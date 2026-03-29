/**
 * pdf-export.js
 * Sistema de exportación PDF "tiled" con escala 1:1.
 *
 * CRÍTICO: jsPDF se inicializa con unit:'mm', por lo que
 * todas las coordenadas son en mm. El SVG ya está en mm.
 * Esto garantiza impresión 1:1 sin conversiones.
 *
 * Proceso:
 *  1. Parsear el SVG a comandos jsPDF (SVG → jsPDF drawing API)
 *  2. Dividir en páginas según tamaño de papel seleccionado
 *  3. Agregar marcas de registro en cada esquina de página
 *  4. Numerar páginas con grid (A1, A2, B1, ...)
 *  5. Incluir cuadrado de calibración 5×5cm en página 1
 */

'use strict';
window.PAT = window.PAT || {};

PAT.PDFExport = (function() {

  const { jsPDF } = window.jspdf;

  /**
   * Exportar el patrón actual como PDF tiled.
   * @param {Object} patternData - objeto de PAT.PatternEngine.getCurrentData()
   * @param {Object} params - {paper:'letter'|'a4', patternName}
   */
  function exportTiledPDF(patternData, params) {
    if (!patternData) {
      PAT.App.toast('No hay patrón generado aún', 'error');
      return;
    }

    const paper    = PAT.PAPER[params.paper || 'letter'];
    const margin   = PAT.MARGIN;
    const overlap  = PAT.TILE_OVERLAP;  // 10mm solapamiento entre páginas

    // Área imprimible por página (mm)
    const printW = paper.w - margin.left - margin.right;
    const printH = paper.h - margin.top  - margin.bottom;

    // Área útil por tile (restando solapamiento en bordes internos)
    const tileW = printW - overlap;
    const tileH = printH - overlap;

    // Dimensiones del patrón completo
    const patW = patternData.bounds.w;
    const patH = patternData.bounds.h;

    // Número de tiles en X e Y
    const cols = Math.ceil(patW / tileW);
    const rows = Math.ceil(patH / tileH);
    const totalPages = cols * rows;

    // Crear jsPDF
    const pdf = new jsPDF({
      orientation: patW > patH ? 'landscape' : 'portrait',
      unit: 'mm',
      format: params.paper || 'letter',
    });

    const svgEl = patternData.svgEl;
    const vbParts = svgEl.getAttribute('viewBox').split(' ').map(Number);
    const svgViewW = vbParts[2];
    const svgViewH = vbParts[3];

    // Escala SVG → mm (el SVG está en mm, así que debería ser 1:1)
    // Pero el viewBox puede ser diferente al tamaño físico si hubo zoom
    // Usamos el atributo width/height para obtener el tamaño real en mm
    const svgPhysW = parseFloat(svgEl.getAttribute('width')) || svgViewW;
    const svgPhysH = parseFloat(svgEl.getAttribute('height')) || svgViewH;
    const scaleX = svgPhysW / svgViewW;
    const scaleY = svgPhysH / svgViewH;

    let pageNum = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        pageNum++;
        if (pageNum > 1) pdf.addPage();

        // Coordenadas de este tile en el espacio del patrón
        const tilePatX = col * tileW;
        const tilePatY = row * tileH;

        // ── Fondo blanco ─────────────────────────────────────────
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, paper.w, paper.h, 'F');

        // ── Área imprimible (borde fino) ─────────────────────────
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.rect(margin.left, margin.top, printW, printH);

        // ── Marcas de registro (en las 4 esquinas) ───────────────
        drawRegistrationMarks(pdf, margin, printW, printH);

        // ── Dibujar el fragmento del SVG en este tile ─────────────
        // Usamos canvas intermediario para rasterizar el fragmento SVG
        drawSVGTile(pdf, svgEl, {
          tilePatX, tilePatY,
          tileW, tileH,
          printW, printH,
          margin, overlap,
          scaleX, scaleY,
          svgViewW, svgViewH,
          svgPhysW, svgPhysH,
        });

        // ── Información de tile ───────────────────────────────────
        const rowLabel = String.fromCharCode(65 + row);  // A, B, C...
        const colLabel = col + 1;
        const tileLabel = `${rowLabel}${colLabel}`;

        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 200);
        pdf.text(
          `PatrónAI Pro  |  ${params.patternName || 'Patrón'}  |  Página ${pageNum}/${totalPages}  |  Tile ${tileLabel} (${rowLabel}${colLabel})  |  Escala 1:1`,
          margin.left,
          margin.top - 3
        );

        // Grid indicator (esquina inferior derecha)
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `↑ ARRIBA  |  Unir con: ${getPrevTiles(tileLabel, cols)}`,
          margin.left,
          margin.top + printH + 5
        );

        // ── Cuadrado de calibración en página 1 ─────────────────
        if (pageNum === 1) {
          drawCalibrationSquare(pdf, margin.left + printW - 65, margin.top + printH - 65);
        }

        // ── Solapamiento: líneas de guía (overlap zone) ──────────
        pdf.setDrawColor(120, 120, 255);
        pdf.setLineWidth(0.3);
        pdf.setLineDashPattern([3, 3], 0);
        if (col < cols - 1) {
          // Borde derecho (zona de solapamiento)
          const overlapX = margin.left + printW - overlap;
          pdf.line(overlapX, margin.top, overlapX, margin.top + printH);
          pdf.setFontSize(6);
          pdf.setTextColor(120, 120, 255);
          pdf.text('← solapar 10mm', overlapX - 20, margin.top + 10);
        }
        if (row < rows - 1) {
          const overlapY = margin.top + printH - overlap;
          pdf.line(margin.left, overlapY, margin.left + printW, overlapY);
          pdf.setFontSize(6);
          pdf.text('solapar 10mm ↑', margin.left + 5, overlapY - 2);
        }
        pdf.setLineDashPattern([], 0);
      }
    }

    // ── Guardar PDF ───────────────────────────────────────────────
    const filename = `${(params.patternName || 'patron').replace(/\s+/g, '_')}_${paper.name.split(' ')[0]}_${totalPages}paginas.pdf`;
    pdf.save(filename);

    PAT.App.toast(`✅ PDF exportado: ${totalPages} páginas (${rows}×${cols} tiles)`, 'success');
  }

  /** Dibuja el fragmento SVG correspondiente al tile actual en el PDF */
  function drawSVGTile(pdf, svgEl, opts) {
    const { tilePatX, tilePatY, tileW, tileH, margin, scaleX, scaleY,
            svgViewW, svgViewH, svgPhysW, svgPhysH } = opts;

    // Clonar SVG y aplicar clip al área del tile
    // La escala del SVG (mm → puntos de papel) es 1:1 porque jsPDF usa mm
    // Solo necesitamos desplazar el origen

    // Método: renderizar el SVG recortado en un canvas
    // y luego insertar como imagen en el PDF
    const canvas = document.createElement('canvas');

    // DPI para exportación: 150 DPI (buena calidad sin ser enorme)
    const DPI = 150;
    const MM_PER_INCH = 25.4;
    const PX_PER_MM = DPI / MM_PER_INCH;

    const canvasW = Math.round(tileW * PX_PER_MM);
    const canvasH = Math.round(tileH * PX_PER_MM);
    canvas.width  = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext('2d');

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Serializar SVG completo a imagen
    const svgStr = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function() {
      // Escala para convertir mm del SVG a px del canvas
      const scaleToCanvas = PX_PER_MM * (svgPhysW / svgViewW);

      // Dibujar el SVG desplazado para mostrar solo el tile
      ctx.drawImage(
        img,
        -tilePatX * PX_PER_MM,  // recorte X en px
        -tilePatY * PX_PER_MM,  // recorte Y en px
        svgPhysW * PX_PER_MM,   // ancho total en px
        svgPhysH * PX_PER_MM    // alto total en px
      );

      URL.revokeObjectURL(url);

      // Agregar imagen al PDF (posición en mm dentro de la página)
      const dataURL = canvas.toDataURL('image/png', 0.95);
      pdf.addImage(
        dataURL, 'PNG',
        opts.margin.left,     // X en mm en la página PDF
        opts.margin.top,      // Y en mm en la página PDF
        opts.tileW,           // ancho en mm
        opts.tileH            // alto en mm
      );
    };
    img.src = url;
    // Nota: drawImage es síncrono cuando la imagen ya está cargada en el canvas
    // pero para SVG puede necesitar un enfoque diferente. Usamos SVG directo:
    return drawSVGTileDirect(pdf, svgEl, opts);
  }

  /** Alternativa directa: insertar SVG como imagen vectorial en jsPDF */
  function drawSVGTileDirect(pdf, svgEl, opts) {
    const { tilePatX, tilePatY, tileW, tileH, margin } = opts;

    // Crear SVG clonado con viewBox recortado al tile
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('viewBox', `${tilePatX} ${tilePatY} ${tileW} ${tileH}`);
    clone.setAttribute('width', `${tileW}mm`);
    clone.setAttribute('height', `${tileH}mm`);

    // Limpiar estilos de fondo (el SVG tiene un rect de fondo oscuro)
    const bg = clone.querySelector('#svg-bg');
    if (bg) {
      bg.setAttribute('fill', '#ffffff');
      // Cambiar grid para que sea visible en papel blanco
      const gridPat = clone.querySelector('#grid-pattern path');
      if (gridPat) gridPat.setAttribute('stroke', 'rgba(0,0,0,0.06)');
      const gridLargePat = clone.querySelector('#grid-pattern-large path');
      if (gridLargePat) gridLargePat.setAttribute('stroke', 'rgba(0,0,0,0.1)');
    }

    // Actualizar colores del patrón para impresión en papel blanco
    clone.querySelectorAll('[fill="rgba(255,255,255,0.025)"]').forEach(el => {
      el.setAttribute('fill', 'none');
    });
    // Texto de labels: oscuro para impresión
    clone.querySelectorAll('text').forEach(el => {
      const fill = el.getAttribute('fill');
      if (fill && (fill.includes('rgba(255') || fill.startsWith('#e') || fill.startsWith('#9'))) {
        el.setAttribute('fill', '#222222');
      }
    });
    // Líneas de corte: negras para impresión
    clone.querySelectorAll('path[stroke="#e2e8f0"], line[stroke="#e2e8f0"]').forEach(el => {
      el.setAttribute('stroke', '#111111');
    });

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgDataURL = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

    pdf.addImage(svgDataURL, 'SVG', margin.left, margin.top, tileW, tileH);
  }

  /** Dibuja marcas de registro (cruz + círculo) en las 4 esquinas */
  function drawRegistrationMarks(pdf, margin, printW, printH) {
    const corners = [
      [margin.left, margin.top],
      [margin.left + printW, margin.top],
      [margin.left, margin.top + printH],
      [margin.left + printW, margin.top + printH],
    ];

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);

    corners.forEach(([cx, cy]) => {
      const size = 5;  // 5mm marca de registro
      // Cruz horizontal
      pdf.line(cx - size, cy, cx + size, cy);
      // Cruz vertical
      pdf.line(cx, cy - size, cx, cy + size);
      // Círculo
      pdf.circle(cx, cy, size * 0.6, 'S');
    });
  }

  /** Dibuja cuadrado de calibración 5×5cm en el PDF */
  function drawCalibrationSquare(pdf, x, y) {
    const s = 50;  // 50mm = 5cm
    pdf.setDrawColor(100, 60, 200);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, s, s, 'S');
    // Líneas de división
    pdf.setLineWidth(0.2);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(x + s/2, y, x + s/2, y + s);
    pdf.line(x, y + s/2, x + s, y + s/2);
    pdf.setLineDashPattern([], 0);
    // Etiqueta
    pdf.setFontSize(6);
    pdf.setTextColor(100, 60, 200);
    pdf.text('5 cm', x + s/2, y + s + 4, { align: 'center' });
    pdf.text('▣ VERIFICAR ESCALA', x + s/2, y - 2, { align: 'center' });
  }

  /** Ayuda a indicar qué tiles debe unir el usuario */
  function getPrevTiles(tileLabel, cols) {
    const row = tile
