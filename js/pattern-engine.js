'use strict';
window.PAT = window.PAT || {};

PAT.PatternEngine = (function () {
  const NS  = 'http://www.w3.org/2000/svg';
  const GAP = 30; // mm

  let _svg     = null;
  let _content = null;
  let _bounds  = { w: 500, h: 400 };
  let _pieces  = [];

  function init(svgEl) {
    _svg = svgEl;
    // Buscar el grupo de contenido de múltiples formas
    if (svgEl) {
      _content = svgEl.querySelector('#pattern-content');
    }
    if (!_content) {
      _content = document.getElementById('pattern-content');
    }
    console.log('[Engine] init — svg:', !!_svg, 'content:', !!_content);
  }

  function generate(garmentType, measures, params) {
    if (!_svg) { console.error('[Engine] SVG no encontrado'); return; }

    // Re-buscar content por si acaso
    if (!_content) {
      _content = document.getElementById('pattern-content');
    }
    if (!_content) { console.error('[Engine] #pattern-content no encontrado'); return; }

    const m = Object.assign({}, PAT.DEFAULT_MEASURES, measures, {
      ease: params.ease !== undefined ? params.ease : 6
    });
    const seam = params.seam || 10;

    let pieces = [];
    try {
      switch (garmentType) {
        case 'franela':  pieces = PAT.Patterns.Franela.generate(m, seam);  break;
        case 'blusa':    pieces = PAT.Patterns.Blusa.generate(m, seam);    break;
        case 'camisa':   pieces = PAT.Patterns.Camisa.generate(m, seam, params.shirtGender || 'dama'); break;
        case 'falda':    pieces = PAT.Patterns.Falda.generate(m, seam);    break;
        case 'vestido':  pieces = PAT.Patterns.Vestido.generate(m, seam);  break;
        default:         pieces = PAT.Patterns.Franela.generate(m, seam);
      }
    } catch (err) {
      console.error('[Engine] Error en generación:', err);
      return;
    }

    if (!pieces || pieces.length === 0) {
      console.warn('[Engine] 0 piezas generadas para:', garmentType);
      return;
    }

    _renderPieces(pieces);
  }

  function _renderPieces(pieces) {
    // Limpiar TODO el contenido anterior
    while (_content.firstChild) {
      _content.removeChild(_content.firstChild);
    }

    const PAD   = 20;  // padding mm
    const CAL_W = 80;  // espacio calibración mm

    // Cuadrado de calibración (5×5cm)
    try {
      if (PAT.SVGUtils && PAT.SVGUtils.calibrationSquare) {
        const cal = PAT.SVGUtils.calibrationSquare(PAD, PAD);
        _content.appendChild(cal);
      }
    } catch (e) {
      console.warn('[Engine] No se pudo dibujar calibración:', e);
    }

    // Layout de piezas en filas
    const MAX_W = 1100; // mm máximo por fila
    let curX  = CAL_W + GAP;
    let curY  = PAD;
    let rowH  = 0;

    pieces.forEach(function(piece) {
      if (!piece || !piece.group || !piece.bounds) {
        console.warn('[Engine] Pieza inválida, saltando');
        return;
      }

      const pw = piece.bounds.w || 200;
      const ph = piece.bounds.h || 300;

      // Saltar a nueva fila si no cabe
      if (curX > CAL_W + GAP && (curX + pw) > MAX_W) {
        curX = CAL_W + GAP;
        curY += rowH + GAP;
        rowH = 0;
      }

      // Crear grupo contenedor con transformación
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', 'translate(' + curX + ',' + curY + ')');
      g.appendChild(piece.group);
      _content.appendChild(g);

      curX += pw + GAP;
      if (ph > rowH) rowH = ph;
    });

    // Calcular viewBox final
    const vbW = curX + PAD;
    const vbH = curY + rowH + PAD;

    _svg.setAttribute('viewBox', '0 0 ' + vbW + ' ' + vbH);
    _svg.setAttribute('width',  vbW + 'mm');
    _svg.setAttribute('height', vbH + 'mm');

    _bounds = { w: vbW, h: vbH };
    _pieces = pieces;

    console.log('[Engine] ✓ Renderizado', pieces.length, 'piezas — viewBox: 0 0', vbW, vbH);

    // Disparar evento para que app.js ajuste el zoom
    document.dispatchEvent(new CustomEvent('pat:rendered', { detail: { w: vbW, h: vbH } }));
  }

  function getCurrentData() {
    if (!_svg) return null;
    return { svgEl: _svg, pieces: _pieces, bounds: _bounds };
  }

  function getSVGString() {
    return _svg ? new XMLSerializer().serializeToString(_svg) : '';
  }

  return {
    init, generate, getCurrentData, getSVGString,
    get bounds() { return _bounds; }
  };
})();
