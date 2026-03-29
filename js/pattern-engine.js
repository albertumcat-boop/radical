'use strict';
window.PAT = window.PAT || {};

PAT.PatternEngine = (function () {
  const NS  = 'http://www.w3.org/2000/svg';
  const GAP = 30;

  let _svg     = null;
  let _content = null;
  let _bounds  = { w: 100, h: 100 };
  let _pieces  = [];

  function init(svgEl) {
    _svg     = svgEl;
    _content = svgEl ? svgEl.getElementById
      ? svgEl.getElementById('pattern-content')
      : svgEl.querySelector('#pattern-content')
      : null;
    if (!_content && svgEl) {
      // fallback: buscar por id directo
      _content = document.getElementById('pattern-content');
    }
    console.log('[Engine] init svg:', !!_svg, 'content:', !!_content);
  }

  function generate(garmentType, measures, params) {
    if (!_svg) { console.error('[Engine] _svg null'); return; }
    if (!_content) {
      _content = document.getElementById('pattern-content');
      if (!_content) { console.error('[Engine] #pattern-content no encontrado'); return; }
    }

    const m    = Object.assign({}, PAT.DEFAULT_MEASURES, measures, { ease: params.ease || 6 });
    const seam = params.seam || 10;

    let pieces = [];
    try {
      switch (garmentType) {
        case 'franela':  pieces = PAT.Patterns.Franela.generate(m, seam); break;
        case 'blusa':    pieces = PAT.Patterns.Blusa.generate(m, seam); break;
        case 'camisa':   pieces = PAT.Patterns.Camisa.generate(m, seam, params.shirtGender || 'dama'); break;
        case 'falda':    pieces = PAT.Patterns.Falda.generate(m, seam); break;
        case 'vestido':  pieces = PAT.Patterns.Vestido.generate(m, seam); break;
        default:         pieces = PAT.Patterns.Franela.generate(m, seam);
      }
    } catch (e) {
      console.error('[Engine] Error generando:', e);
      return;
    }

    if (!pieces || pieces.length === 0) {
      console.warn('[Engine] 0 piezas generadas');
      return;
    }

    _render(pieces);
  }

  function _render(pieces) {
    // Limpiar
    while (_content.firstChild) _content.removeChild(_content.firstChild);

    const PAD = 25;
    const CAL_W = 80;

    // Cuadrado de calibración
    try {
      const cal = PAT.SVGUtils.calibrationSquare(PAD, PAD);
      _content.appendChild(cal);
    } catch(e) { console.warn('[Engine] calibrationSquare error:', e); }

    // Posicionar piezas
    const MAX_ROW = 1000;
    let curX = CAL_W + GAP + PAD;
    let curY = PAD;
    let rowH = 0;

    pieces.forEach(piece => {
      if (!piece || !piece.group || !piece.bounds) return;

      const pw = piece.bounds.w || 200;
      const ph = piece.bounds.h || 300;

      if (curX > CAL_W + GAP + PAD && curX + pw > MAX_ROW) {
        curX = CAL_W + GAP + PAD;
        curY += rowH + GAP;
        rowH = 0;
      }

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', 'translate(' + curX + ',' + curY + ')');
      g.appendChild(piece.group);
      _content.appendChild(g);

      curX += pw + GAP;
      rowH  = Math.max(rowH, ph);
    });

    const totalW = MAX_ROW + PAD * 2;
    const totalH = curY + rowH + PAD * 2;

    _svg.setAttribute('viewBox', '0 0 ' + totalW + ' ' + totalH);
    _svg.setAttribute('width',  totalW + 'mm');
    _svg.setAttribute('height', totalH + 'mm');

    _bounds = { w: totalW, h: totalH };
    _pieces = pieces;

    console.log('[Engine] Render OK — ' + pieces.length + ' piezas, viewBox: 0 0 ' + totalW + ' ' + totalH);
  }

  function getCurrentData() {
    if (!_svg) return null;
    return { svgEl: _svg, pieces: _pieces, bounds: _bounds };
  }

  function getSVGString() {
    if (!_svg) return '';
    return new XMLSerializer().serializeToString(_svg);
  }

  return { init, generate, getCurrentData, getSVGString,
    get bounds() { return _bounds; } };
})();
