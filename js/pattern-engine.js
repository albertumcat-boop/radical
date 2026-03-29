/**
 * pattern-engine.js
 * Orquesta la generación de piezas y las compone en el SVG principal.
 * Maneja el layout (posicionamiento de piezas) y la actualización en tiempo real.
 */

'use strict';
window.PAT = window.PAT || {};

PAT.PatternEngine = (function() {
  const U  = PAT.SVGUtils;
  const NS = U.NS;
  const GAP = PAT.PIECE_GAP;

  let _svgEl = null;       // El SVG principal (#pattern-svg)
  let _contentEl = null;   // El grupo <g id="pattern-content">
  let _currentPieces = []; // Array de {group, bounds, name}
  let _currentBounds = { w: 0, h: 0 };

  /** Inicializar el motor con el elemento SVG */
  function init(svgElement) {
    _svgEl      = svgElement;
    _contentEl  = svgElement.querySelector('#pattern-content');
  }

  /**
   * Generar y renderizar el patrón completo.
   * @param {string} garmentType - 'franela' | 'blusa' | 'camisa' | 'falda' | 'vestido'
   * @param {Object} measures    - medidas en cm
   * @param {Object} params      - {seam, ease, shirtGender}
   */
  function generate(garmentType, measures, params) {
    if (!_svgEl || !_contentEl) return;

    const m    = { ...measures, ease: params.ease };
    const seam = params.seam;  // ya en mm

    // ── Generar piezas según el tipo ──────────────────────────────
    let rawPieces = [];
    try {
      switch (garmentType) {
        case 'franela':
          rawPieces = PAT.Patterns.Franela.generate(m, seam);
          break;
        case 'blusa':
          rawPieces = PAT.Patterns.Blusa.generate(m, seam);
          break;
        case 'camisa':
          rawPieces = PAT.Patterns.Camisa.generate(m, seam, params.shirtGender || 'dama');
          break;
        case 'falda':
          rawPieces = PAT.Patterns.Falda.generate(m, seam);
          break;
        case 'vestido':
          rawPieces = PAT.Patterns.Vestido.generate(m, seam);
          break;
        default:
          rawPieces = PAT.Patterns.Franela.generate(m, seam);
      }
    } catch (e) {
      console.error('[PatternEngine] Error generando patrón:', e);
      return;
    }

    // ── Layout: posicionar piezas en filas ────────────────────────
    const laid = layoutPieces(rawPieces);
    _currentPieces = laid.pieces;
    _currentBounds = laid.totalBounds;

    // ── Renderizar en SVG ─────────────────────────────────────────
    renderToSVG(laid);
  }

  /**
   * Organiza las piezas en una cuadrícula 2D con separación GAP.
   * Piezas anchas van primero, luego más estrechas debajo.
   */
  function layoutPieces(pieces) {
    const MAX_ROW_WIDTH = 900;  // mm — máximo ancho por fila antes de saltar
    let curX = 0, curY = 0, rowH = 0;
    const laid = [];

    // Agregar cuadrado de calibración como primera "pieza especial"
    const calSize = 70;  // 5cm + márgenes
    let calX = 10, calY = 10;

    pieces.forEach((piece, i) => {
      const bW = piece.bounds.w;
      const bH = piece.bounds.h;

      // Saltar a nueva fila si no cabe
      if (curX > 0 && curX + bW > MAX_ROW_WIDTH) {
        curX = 0;
        curY += rowH + GAP;
        rowH = 0;
      }

      laid.push({
        ...piece,
        offsetX: curX + calSize + GAP,  // offset por cuadrado de calibración
        offsetY: curY + calSize + GAP,
      });

      curX += bW + GAP;
      rowH = Math.max(rowH, bH);
    });

    const totalW = MAX_ROW_WIDTH + calSize + GAP + 40;
    const totalH = curY + rowH + calSize + GAP + 40;

    return { pieces: laid, totalBounds: { w: totalW, h: totalH } };
  }

  /** Renderiza las piezas en el SVG y actualiza el viewBox */
  function renderToSVG(laid) {
    // Limpiar contenido anterior
    while (_contentEl.firstChild) {
      _contentEl.removeChild(_contentEl.firstChild);
    }

    const { pieces, totalBounds } = laid;
    const padding = 20;

    // Cuadrado de calibración (siempre en esquina superior izq)
    _contentEl.appendChild(U.calibrationSquare(padding, padding));

    // Renderizar cada pieza con su offset
    pieces.forEach(piece => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', `translate(${U.n(piece.offsetX)}, ${U.n(piece.offsetY)})`);
      g.appendChild(piece.group);
      _contentEl.appendChild(g);
    });

    // Actualizar viewBox del SVG para mostrar todo el patrón
    const vbW = totalBounds.w + padding * 2;
    const vbH = totalBounds.h + padding * 2;
    _svgEl.setAttribute('viewBox', `0 0 ${U.n(vbW)} ${U.n(vbH)}`);
    _svgEl.setAttribute('width', `${U.n(vbW)}mm`);
    _svgEl.setAttribute('height', `${U.n(vbH)}mm`);

    return { vbW, vbH };
  }

  /** Retorna los datos del patrón actual para exportar */
  function getCurrentData() {
    if (!_svgEl) return null;
    return {
      svgEl:   _svgEl,
      pieces:  _currentPieces,
      bounds:  _currentBounds,
      svgText: new XMLSerializer().serializeToString(_svgEl),
    };
  }

  /** Retorna SVG completo como string (para exportar como archivo .svg) */
  function getSVGString() {
    if (!_svgEl) return '';
    // Clonar SVG y forzar dimensiones físicas para impresión 1:1
    const clone = _svgEl.cloneNode(true);
    clone.setAttribute('xmlns', NS);
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    // El width/height en mm garantiza escala 1:1 al imprimir
    return new XMLSerializer().serializeToString(clone);
  }

  return { init, generate, getCurrentData, getSVGString, get bounds() { return _currentBounds; } };
})();
