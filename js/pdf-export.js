/**
 * REEMPLAZAR el contenido actual de js/pdf-export.js con este bloque completo.
 * Agrega: marca de agua DEMO para tier free + espacio de branding en PDF.
 */

'use strict';
window.PAT = window.PAT || {};

PAT.PDFExport = (function() {

  const { jsPDF } = window.jspdf;

  function exportTiledPDF(patternData, params) {
    if (!patternData) {
      PAT.App.toast('No hay patrón generado aún', 'error');
      return;
    }

    // ── VERIFICACIÓN DE TIER ────────────────────────────────────
    const tierId    = PAT.AuthTier.getTierId();
    const needsMark = PAT.AuthTier.needsWatermark();
    const affiliate = PAT.Affiliate.getActiveAffiliate();

    const paper   = PAT.PAPER[params.paper || 'letter'];
    const margin  = PAT.MARGIN;
    const overlap = PAT.TILE_OVERLAP;

    const printW = paper.w - margin.left - margin.right;
    const printH = paper.h - margin.top  - margin.bottom;
    const tileW  = printW - overlap;
    const tileH  = printH - overlap;

    const patW   = patternData.bounds.w;
    const patH   = patternData.bounds.h;
    const cols   = Math.ceil(patW / tileW);
    const rows   = Math.ceil(patH / tileH);
    const totalPages = cols * rows;

    const pdf = new jsPDF({
      orientation: patW > patH ? 'landscape' : 'portrait',
      unit: 'mm',
      format: params.paper || 'letter',
    });

    const svgEl   = patternData.svgEl;
    const vbParts = svgEl.getAttribute('viewBox').split(' ').map(Number);
    const svgPhysW = parseFloat(svgEl.getAttribute('width'))  || vbParts[2];
    const svgPhysH = parseFloat(svgEl.getAttribute('height')) || vbParts[3];

    let pageNum = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        pageNum++;
        if (pageNum > 1) pdf.addPage();

        const tilePatX = col * tileW;
        const tilePatY = row * tileH;

        // Fondo blanco
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, paper.w, paper.h, 'F');

        // Borde área imprimible
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.rect(margin.left, margin.top, printW, printH);

        // Marcas de registro
        drawRegistrationMarks(pdf, margin, printW, printH);

        // Contenido del patrón
        drawSVGTileDirect(pdf, svgEl, {
          tilePatX, tilePatY, tileW, tileH,
          margin, svgPhysW, svgPhysH,
          svgViewW: vbParts[2], svgViewH: vbParts[3],
        });

        // ── MARCA DE AGUA DEMO (tier free) ─────────────────────
        if (needsMark) {
          drawDemoWatermark(pdf, printW, printH, margin);
        }

        // ── BANDA DE BRANDING (todas las páginas) ─────────────
        drawBrandingBand(pdf, paper, margin, affiliate, params, tierId);

        // Info de tile
        const rowLabel = String.fromCharCode(65 + row);
        const tileLabel = `${rowLabel}${col + 1}`;
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 200);
        pdf.text(
          `PatrónAI Pro  ·  ${params.patternName || 'Patrón'}  ·  Pág. ${pageNum}/${totalPages}  ·  Tile ${tileLabel}  ·  Escala 1:1`,
          margin.left,
          margin.top - 3
        );

        // Cuadrado de calibración en pág. 1
        if (pageNum === 1) {
          drawCalibrationSquare(pdf, margin.left + printW - 65, margin.top + printH - 65);
        }

        // Líneas de solapamiento
        pdf.setDrawColor(120, 120, 255);
        pdf.setLineWidth(0.3);
        pdf.setLineDashPattern([3, 3], 0);
        if (col < cols - 1) {
          const ox = margin.left + printW - overlap;
          pdf.line(ox, margin.top, ox, margin.top + printH);
        }
        if (row < rows - 1) {
          const oy = margin.top + printH - overlap;
          pdf.line(margin.left, oy, margin.left + printW, oy);
        }
        pdf.setLineDashPattern([], 0);
      }
    }

    const filename = `${(params.patternName || 'patron').replace(/\s+/g, '_')}_${paper.name.split(' ')[0]}_${totalPages}pags${needsMark ? '_DEMO' : ''}.pdf`;
    pdf.save(filename);

    PAT.App.toast(`✅ PDF exportado: ${totalPages} páginas${needsMark ? ' (DEMO)' : ''}`, 'success');
  }

  // ── MARCA DE AGUA DEMO ──────────────────────────────────────────
  function drawDemoWatermark(pdf, printW, printH, margin) {
    pdf.saveGraphicsState();
    pdf.setGState(new pdf.GState({ opacity: 0.12 }));
    pdf.setFontSize(52);
    pdf.setTextColor(120, 0, 200);

    const cx = margin.left + printW / 2;
    const cy = margin.top  + printH / 2;

    // Diagonal
    pdf.text('DEMO — NO PARA CORTE', cx, cy, {
      align: 'center', angle: 45,
    });
    // Segunda instancia
    pdf.setFontSize(22);
    pdf.text('PatrónAI FREE · Actualiza para PDF limpio', cx, cy + 28, {
      align: 'center', angle: 45,
    });
    pdf.restoreGraphicsState();
  }

  // ── BANDA DE BRANDING ──────────────────────────────────────────
  function drawBrandingBand(pdf, paper, margin, affiliate, params, tierId) {
    // Banda inferior de 12mm antes del margen
    const bandY  = paper.h - margin.bottom - 12;
    const bandH  = 11;
    const bandX  = margin.left;
    const bandW  = paper.w - margin.left - margin.right;

    // Fondo de la banda
    pdf.setFillColor(245, 243, 255);
    pdf.rect(bandX, bandY, bandW, bandH, 'F');
    pdf.setDrawColor(180, 160, 240);
    pdf.setLineWidth(0.2);
    pdf.rect(bandX, bandY, bandW, bandH, 'S');

    // Logo/marca
    pdf.setFontSize(8);
    pdf.setTextColor(90, 40, 180);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🧵 PatrónAI Pro', bandX + 3, bandY + 7);

    // Web/CTA
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(120, 90, 180);
    pdf.text('patronai.pro  ·  Patronaje paramétrico a escala 1:1', bandX + 3, bandY + 10.5);

    // Si hay afiliado: mostrar nombre del atelier
    if (affiliate) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(16, 185, 129);
      const atelierText = `✂️ Realizado con el auspicio de: ${affiliate.atelierName}`;
      pdf.text(atelierText, bandX + bandW / 2, bandY + 7, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      pdf.setTextColor(100, 140, 120);
      pdf.text(
        `Código ${PAT.Affiliate.getActiveCode()} · ${affiliate.discount}% OFF para tus clientes`,
        bandX + bandW / 2, bandY + 10.5, { align: 'center' }
      );
    } else {
      // CTA para ateliers sin afiliado
      pdf.setFontSize(6.5);
      pdf.setTextColor(140, 120, 180);
      pdf.text(
        '¿Tienes un atelier? Conviértete en Partner y gana comisiones →  patronai.pro/partners',
        bandX + bandW / 2, bandY + 9, { align: 'center' }
      );
    }

    // Tier badge (derecha)
    const tierColors = { free: [100,100,100], pro: [124,58,237], expert: [245,158,11] };
    const tColor = tierColors[tierId] || tierColors.free;
    pdf.setFillColor(...tColor);
    pdf.roundedRect(bandX + bandW - 26, bandY + 2, 23, 7.5, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(255, 255, 255);
    const tierLabel = { free: 'FREE', pro: '⭐ PRO', expert: '👑 EXPERT' };
    pdf.text(tierLabel[tierId] || 'FREE', bandX + bandW - 14.5, bandY + 7, { align: 'center' });
  }

  // ── SVG a PDF ──────────────────────────────────────────────────
  function drawSVGTileDirect(pdf, svgEl, opts) {
    const { tilePatX, tilePatY, tileW, tileH, margin, svgViewW, svgViewH, svgPhysW, svgPhysH } = opts;

    const clone = svgEl.cloneNode(true);
    clone.setAttribute('viewBox', `${tilePatX} ${tilePatY} ${tileW} ${tileH}`);
    clone.setAttribute('width',  `${tileW}mm`);
    clone.setAttribute('height', `${tileH}mm`);

    const bg = clone.querySelector('#svg-bg');
    if (bg) bg.setAttribute('fill', '#ffffff');

    // Adaptar colores para impresión en blanco
    clone.querySelectorAll('[fill="rgba(255,255,255,0.025)"]').forEach(e => e.setAttribute('fill','none'));
    clone.querySelectorAll('path[stroke="#e2e8f0"],line[stroke="#e2e8f0"],polyline[stroke="#e2e8f0"]').forEach(e => e.setAttribute('stroke','#111111'));
    clone.querySelectorAll('text').forEach(e => {
      const f = e.getAttribute('fill') || '';
      if (f.startsWith('#9') || f.startsWith('#6') || f.startsWith('#e2')) {
        e.setAttribute('fill','#333333');
      }
    });

    const svgString  = new XMLSerializer().serializeToString(clone);
    const svgDataURL = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    pdf.addImage(svgDataURL, 'SVG', margin.left, margin.top, tileW, tileH);
  }

  function drawRegistrationMarks(pdf, margin, printW, printH) {
    const corners = [
      [margin.left, margin.top],
      [margin.left + printW, margin.top],
      [margin.left, margin.top + printH],
      [margin.left + printW, margin.top + printH],
    ];
    pdf.setDrawColor(0); pdf.setLineWidth(0.3);
    corners.forEach(([cx, cy]) => {
      const size = 5;
      pdf.line(cx - size, cy, cx + size, cy);
      pdf.line(cx, cy - size, cx, cy + size);
      pdf.circle(cx, cy, size * 0.6, 'S');
    });
  }

  function drawCalibrationSquare(pdf, x, y) {
    const s = 50;
    pdf.setDrawColor(100, 60, 200); pdf.setLineWidth(0.5);
    pdf.rect(x, y, s, s, 'S');
    pdf.setLineWidth(0.2); pdf.setLineDashPattern([2,2],0);
    pdf.line(x+s/2, y, x+s/2, y+s);
    pdf.line(x, y+s/2, x+s, y+s/2);
    pdf.setLineDashPattern([],0);
    pdf.setFontSize(6); pdf.setTextColor(100,60,200);
    pdf.text('◄── 5 cm ──►', x+s/2, y+s+4, { align:'center' });
    pdf.text('▣ VERIFICAR ESCALA ANTES DE IMPRIMIR', x+s/2, y-2, { align:'center' });
  }

  return { exportTiledPDF };
})();
