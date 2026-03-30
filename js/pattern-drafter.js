/**
 * pattern-drafter.js v2.0
 * Motor de trazado manual con soporte de:
 * - Fórmulas basadas en medidas (bust/4 + 2, etc.)
 * - Instrucciones paso a paso numeradas (A.B, B.C, A.1, etc.)
 * - Guardado de manuales
 * - Reemplazo de patrones prediseñados
 */
'use strict';
window.PAT = window.PAT || {};

PAT.Drafter = (function () {

  const NS = 'http://www.w3.org/2000/svg';

  // ── Estado ───────────────────────────────────────────────────
  let _points    = {};
  let _lines     = [];
  let _errors    = [];
  let _warnings  = [];
  let _pieceName = 'Pieza';
  let _measures  = {};  // medidas actuales del usuario
  let _firstPoint= null;

  // ── Variables disponibles en fórmulas ────────────────────────
  // Se calculan a partir de las medidas del usuario
  function _buildVars(m) {
    return {
      // Medidas directas (en cm → convertidas a mm)
      BUSTO:        (m.bust    || 88) * 10,
      CINTURA:      (m.waist   || 68) * 10,
      CADERA:       (m.hip     || 94) * 10,
      ESPALDA:      (m.shoulder|| 38) * 10,
      CUELLO:       (m.neck    || 36) * 10,
      TALLE_ESP:    (m.backLength  || 40) * 10,
      TALLE_DEL:    (m.frontLength || 42) * 10,
      LARGO:        (m.totalLength || 65) * 10,
      MANGA:        (m.sleeveLength|| 60) * 10,
      MUNECA:       (m.wrist   || 16) * 10,
      FALDA:        (m.skirtLength || 60) * 10,
      CADERA_PROF:  (m.hipDepth|| 20) * 10,

      // Derivadas comunes de patronaje
      B4:   ((m.bust    || 88) * 10) / 4,   // busto/4
      B6:   ((m.bust    || 88) * 10) / 6,   // busto/6
      B8:   ((m.bust    || 88) * 10) / 8,   // busto/8
      B10:  ((m.bust    || 88) * 10) / 10,  // busto/10
      B12:  ((m.bust    || 88) * 10) / 12,  // busto/12
      W4:   ((m.waist   || 68) * 10) / 4,
      H4:   ((m.hip     || 94) * 10) / 4,
      E2:   ((m.shoulder|| 38) * 10) / 2,   // espalda/2 = ancho hombro
    };
  }

  // ── Evaluar fórmula ──────────────────────────────────────────
  // Ejemplo: "B4 + 20" → (busto/4) + 20mm
  // "TALLE_ESP - 10" → talle espalda - 10mm
  function evalFormula(expr, vars) {
    if (!expr) return 0;
    let cleaned = String(expr).trim();

    // Reemplazar variables por sus valores
    Object.entries(vars).forEach(([k, v]) => {
      const re = new RegExp('\\b' + k + '\\b', 'g');
      cleaned = cleaned.replace(re, v.toFixed(4));
    });

    try {
      // Evaluar expresión matemática simple
      // Permitir solo números, operadores y paréntesis
      if (!/^[\d\s+\-*/().]+$/.test(cleaned)) {
        throw new Error('Expresión no válida: ' + cleaned);
      }
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + cleaned + ')')();
      return Math.round(result * 100) / 100;
    } catch (e) {
      throw new Error('Error en fórmula "' + expr + '": ' + e.message);
    }
  }

  // ── RESET ────────────────────────────────────────────────────
  function reset() {
    _points     = {};
    _lines      = [];
    _errors     = [];
    _warnings   = [];
    _firstPoint = null;
  }

  // ── COMPILAR INSTRUCCIONES ───────────────────────────────────
  function compileAndRender(text, measures) {
    _measures = measures || (window.PAT?.App?.getState?.()?.measures) || {};
    const vars = _buildVars(_measures);

    reset();

    const lines = text.split('\n');
    lines.forEach(function(rawLine, idx) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) return;
      try {
        _parseLine(line, idx + 1, vars);
      } catch(e) {
        _errors.push('Línea ' + (idx + 1) + ': ' + e.message);
      }
    });

    const piece = _generateSVG();
    return {
      piece,
      points:   Object.assign({}, _points),
      errors:   _errors.slice(),
      warnings: _warnings.slice(),
      pieceName: _pieceName,
    };
  }

  // ── PARSER ───────────────────────────────────────────────────
  function _parseLine(line, lineNum, vars) {
    const tokens  = _tokenize(line);
    if (!tokens.length) return null;
    const cmd = tokens[0].toUpperCase();

    switch (cmd) {
      case 'PIEZA': case 'NOMBRE':
        _pieceName = tokens.slice(1).join(' ').replace(/"/g,'');
        break;

      case 'PUNTO': case 'P':
        _parsePoint(tokens, vars); break;

      case 'LINEA': case 'L':
        _parseLine2(tokens); break;

      case 'CURVA': case 'C':
        _parseCurve(tokens, vars); break;

      case 'ARCO': case 'A':
        _parseArc(tokens, vars); break;

      case 'DOBLEZ':
        _parseFold(tokens); break;

      case 'HILO':
        _parseGrain(tokens); break;

      case 'MUESCA': case 'N':
        _parseNotch(tokens); break;

      case 'COTA':
        _parseDim(tokens); break;

      case 'CERRAR': case 'Z':
        _parseClose(); break;

      default:
        // Intentar parsear como referencia numérica tipo "A.1", "B.2"
        if (/^[A-Z]+\.\d+[a-z]?$/i.test(cmd) && tokens[1]) {
          // Formato: A.1 PUNTO desde:X der:5 o A.1 LINEA A B
          const subcmd = tokens[1].toUpperCase();
          const subtokens = tokens.slice(1);
          subtokens[0] = subcmd;
          try { _parseLine(subtokens.join(' '), lineNum, vars); } catch(e) {}
        } else {
          _warnings.push('Línea ' + lineNum + ': instrucción desconocida "' + cmd + '"');
        }
    }
  }

  function _tokenize(line) {
    const tokens = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuote = !inQuote; continue; }
      if (line[i] === ' ' && !inQuote) {
        if (cur) { tokens.push(cur); cur = ''; }
      } else { cur += line[i]; }
    }
    if (cur) tokens.push(cur);
    return tokens;
  }

  function _getParam(tokens, key) {
    const k = key.toLowerCase() + ':';
    for (const t of tokens) {
      if (t.toLowerCase().startsWith(k)) return t.slice(k.length);
    }
    return null;
  }

  // ── PUNTO ────────────────────────────────────────────────────
  function _parsePoint(tokens, vars) {
    if (tokens.length < 2) throw new Error('PUNTO requiere nombre');
    const name = tokens[1].toUpperCase();
    let x = 0, y = 0;

    // Forma directa: PUNTO A 0,0
    if (tokens[2] && tokens[2].includes(',') && !tokens[2].includes(':')) {
      const parts = tokens[2].split(',');
      x = evalFormula(parts[0], vars);
      y = evalFormula(parts[1], vars);
    }
    // Forma con fórmulas: PUNTO A x:B4+20 y:TALLE_ESP
    else if (_getParam(tokens, 'x') || _getParam(tokens, 'y')) {
      x = evalFormula(_getParam(tokens,'x') || '0', vars);
      y = evalFormula(_getParam(tokens,'y') || '0', vars);
    }
    // Forma relativa: PUNTO B desde:A der:B4+20 abajo:TALLE_ESP
    else {
      const desde = _getParam(tokens,'desde') || _getParam(tokens,'de');
      if (desde) {
        const ref = _points[desde.toUpperCase()];
        if (!ref) throw new Error('Punto "' + desde + '" no definido');
        x = ref.x; y = ref.y;
      }

      const der    = _getParam(tokens,'der')    || _getParam(tokens,'derecha')   || '0';
      const izq    = _getParam(tokens,'izq')    || _getParam(tokens,'izquierda') || '0';
      const abajo  = _getParam(tokens,'abajo')  || _getParam(tokens,'bajo')      || '0';
      const arriba = _getParam(tokens,'arriba') || _getParam(tokens,'arr')       || '0';

      x += evalFormula(der, vars) - evalFormula(izq, vars);
      y += evalFormula(abajo, vars) - evalFormula(arriba, vars);
    }

    if (isNaN(x) || isNaN(y)) throw new Error('Coordenadas inválidas: ' + name);

    _points[name] = { x, y };
    if (!_firstPoint) _firstPoint = name;
  }

  // ── LINEA ────────────────────────────────────────────────────
  function _parseLine2(tokens) {
    if (tokens.length < 3) throw new Error('LINEA requiere dos puntos');
    const from  = tokens[1].toUpperCase();
    const to    = tokens[2].toUpperCase();
    _checkPts(from, to);
    const style = (tokens[3] || 'corte').toLowerCase();
    _lines.push({ type:'line', from, to, style });
  }

  // ── CURVA ────────────────────────────────────────────────────
  function _parseCurve(tokens, vars) {
    if (tokens.length < 3) throw new Error('CURVA requiere dos puntos');
    const from = tokens[1].toUpperCase();
    const to   = tokens[2].toUpperCase();
    _checkPts(from, to);

    const ctrlVal  = _getParam(tokens,'control') || _getParam(tokens,'ctrl');
    const cpVal    = _getParam(tokens,'cp');
    const semiVal  = _getParam(tokens,'semicurva') || _getParam(tokens,'semi');

    let cp1 = null, cp2 = null;

    if (ctrlVal) {
      const dist = evalFormula(ctrlVal, vars);
      const mid  = _mid(from, to);
      const perp = _perp(from, to, dist);
      cp1 = cp2 = { x: mid.x + perp.x, y: mid.y + perp.y };
    } else if (semiVal) {
      // Semicurva estilo sastre — curva tipo sisa
      const dist = evalFormula(semiVal, vars);
      const a = _points[from], b = _points[to];
      cp1 = { x: a.x + (b.x-a.x)*0.3, y: a.y + (b.y-a.y)*0.1 - dist };
      cp2 = { x: a.x + (b.x-a.x)*0.7, y: a.y + (b.y-a.y)*0.9 - dist*0.3 };
    } else if (cpVal) {
      const parts = cpVal.split(',');
      cp1 = cp2 = { x: evalFormula(parts[0],vars), y: evalFormula(parts[1],vars) };
    } else {
      // Curva suave por defecto
      const dist = _dist(from,to) * 0.25;
      const perp = _perp(from, to, dist);
      const mid  = _mid(from, to);
      cp1 = cp2 = { x: mid.x + perp.x, y: mid.y + perp.y };
    }

    _lines.push({ type:'curve', from, to, cp1, cp2 });
  }

  // ── ARCO ─────────────────────────────────────────────────────
  function _parseArc(tokens, vars) {
    if (tokens.length < 3) throw new Error('ARCO requiere dos puntos');
    const from  = tokens[1].toUpperCase();
    const to    = tokens[2].toUpperCase();
    _checkPts(from, to);
    const radioStr = _getParam(tokens,'radio') || _getParam(tokens,'r') || '50';
    const radio    = evalFormula(radioStr, vars);
    const dir      = _getParam(tokens,'dir') || 'convexo';
    _lines.push({ type:'arc', from, to, radio, dir });
  }

  // ── DOBLEZ ───────────────────────────────────────────────────
  function _parseFold(tokens) {
    if (tokens.length < 3) throw new Error('DOBLEZ requiere dos puntos');
    _checkPts(tokens[1].toUpperCase(), tokens[2].toUpperCase());
    _lines.push({ type:'fold', from:tokens[1].toUpperCase(), to:tokens[2].toUpperCase() });
  }

  // ── HILO ─────────────────────────────────────────────────────
  function _parseGrain(tokens) {
    if (tokens.length < 3) throw new Error('HILO requiere dos puntos');
    _checkPts(tokens[1].toUpperCase(), tokens[2].toUpperCase());
    _lines.push({ type:'grain', from:tokens[1].toUpperCase(), to:tokens[2].toUpperCase() });
  }

  // ── MUESCA ───────────────────────────────────────────────────
  function _parseNotch(tokens) {
    const lineRef = _getParam(tokens,'linea') || _getParam(tokens,'l');
    const pos = parseFloat(_getParam(tokens,'pos') || '0.5');
    if (lineRef && lineRef.length >= 2) {
      _lines.push({ type:'notch', from:lineRef[0].toUpperCase(), to:lineRef.slice(1).toUpperCase(), pos });
    }
  }

  // ── COTA ─────────────────────────────────────────────────────
  function _parseDim(tokens) {
    if (tokens.length < 3) return;
    const from  = tokens[1].toUpperCase();
    const to    = tokens[2].toUpperCase();
    const label = tokens.slice(3).join(' ').replace(/"/g,'');
    _lines.push({ type:'dim', from, to, label });
  }

  // ── CERRAR ───────────────────────────────────────────────────
  function _parseClose() {
    if (!_firstPoint) return;
    const names = Object.keys(_points);
    if (names.length > 0) {
      const last = names[names.length-1];
      _lines.push({ type:'line', from:last, to:_firstPoint, style:'corte' });
    }
  }

  // ── HELPERS GEOMÉTRICOS ──────────────────────────────────────
  function _checkPts() {
    for (const n of arguments) {
      if (typeof n === 'string' && !_points[n])
        throw new Error('Punto "' + n + '" no definido aún');
    }
  }
  function _mid(a, b) {
    const pa = _points[a], pb = _points[b];
    return { x:(pa.x+pb.x)/2, y:(pa.y+pb.y)/2 };
  }
  function _dist(a, b) {
    const pa = _points[a], pb = _points[b];
    return Math.hypot(pb.x-pa.x, pb.y-pa.y);
  }
  function _perp(a, b, dist) {
    const pa = _points[a], pb = _points[b];
    const dx = pb.x-pa.x, dy = pb.y-pa.y;
    const len = Math.hypot(dx,dy) || 1;
    return { x: -dy/len*dist, y: dx/len*dist };
  }

  // ── GENERAR SVG ──────────────────────────────────────────────
  function _generateSVG() {
    if (Object.keys(_points).length === 0) return null;

    const g = document.createElementNS(NS, 'g');

    // 1. Contorno principal
    const contourLines = _lines.filter(l =>
      l.type === 'line' || l.type === 'curve' || l.type === 'arc'
    );
    const pathD = _buildPath(contourLines);
    if (pathD) {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', pathD);
      path.setAttribute('fill', 'rgba(139,92,246,0.04)');
      path.setAttribute('stroke', '#e2e8f0');
      path.setAttribute('stroke-width', '0.8');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('stroke-linecap', 'round');
      g.appendChild(path);
    }

    // 2. Líneas de costura
    _lines.filter(l => l.style === 'costura').forEach(l => {
      g.appendChild(_svgSimpleLine(l, '#666688', '0.4', '4,2'));
    });

    // 3. Dobleces (rojo punteado)
    _lines.filter(l => l.type === 'fold').forEach(l => {
      const a = _points[l.from], b = _points[l.to];
      if (!a || !b) return;
      const el = document.createElementNS(NS, 'line');
      el.setAttribute('x1', a.x); el.setAttribute('y1', a.y);
      el.setAttribute('x2', b.x); el.setAttribute('y2', b.y);
      el.setAttribute('stroke', '#f87171');
      el.setAttribute('stroke-width', '0.6');
      el.setAttribute('stroke-dasharray', '8,4');
      el.setAttribute('fill', 'none');
      g.appendChild(el);
      _addLabel(g, (a.x+b.x)/2 + 5, (a.y+b.y)/2, 'DOBLAR', '#f87171', 3.5);
    });

    // 4. Hilo recto (azul con flechas)
    _lines.filter(l => l.type === 'grain').forEach(l => {
      const a = _points[l.from], b = _points[l.to];
      if (!a || !b) return;
      const el = document.createElementNS(NS, 'line');
      el.setAttribute('x1', a.x); el.setAttribute('y1', a.y);
      el.setAttribute('x2', b.x); el.setAttribute('y2', b.y);
      el.setAttribute('stroke', '#60a5fa');
      el.setAttribute('stroke-width', '0.7');
      el.setAttribute('marker-start', 'url(#arrow-rev)');
      el.setAttribute('marker-end',   'url(#arrow)');
      el.setAttribute('fill', 'none');
      g.appendChild(el);
      _addLabel(g, (a.x+b.x)/2 + 4, (a.y+b.y)/2, 'Hilo recto', '#60a5fa', 3.5);
    });

    // 5. Muescas
    _lines.filter(l => l.type === 'notch').forEach(l => {
      const a = _points[l.from], b = _points[l.to];
      if (!a || !b) return;
      const nx = a.x + (b.x-a.x) * (l.pos || 0.5);
      const ny = a.y + (b.y-a.y) * (l.pos || 0.5);
      const tri = document.createElementNS(NS, 'polygon');
      tri.setAttribute('points', nx+','+(ny-4)+' '+(nx-2)+','+(ny+2)+' '+(nx+2)+','+(ny+2));
      tri.setAttribute('fill', '#e2e8f0');
      g.appendChild(tri);
    });

    // 6. Cotas
    _lines.filter(l => l.type === 'dim').forEach(l => {
      const a = _points[l.from], b = _points[l.to];
      if (!a || !b) return;
      const dist = Math.round(Math.hypot(b.x-a.x, b.y-a.y));
      const OFF  = 10;
      const dx = b.x-a.x, dy = b.y-a.y;
      const len= Math.hypot(dx,dy)||1;
      const px = -dy/len*OFF, py = dx/len*OFF;

      const dLine = document.createElementNS(NS, 'line');
      dLine.setAttribute('x1', a.x+px); dLine.setAttribute('y1', a.y+py);
      dLine.setAttribute('x2', b.x+px); dLine.setAttribute('y2', b.y+py);
      dLine.setAttribute('stroke', '#8b5cf6');
      dLine.setAttribute('stroke-width', '0.4');
      dLine.setAttribute('marker-start', 'url(#arrow-rev)');
      dLine.setAttribute('marker-end', 'url(#arrow)');
      dLine.setAttribute('fill', 'none');
      g.appendChild(dLine);

      const label = (l.label ? l.label+' ' : '') + dist + 'mm';
      _addLabel(g, (a.x+b.x)/2+px*1.5, (a.y+b.y)/2+py*1.5, label, '#8b5cf6', 4, 'middle');
    });

    // 7. Puntos con etiquetas
    Object.entries(_points).forEach(([name, pt]) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y);
      c.setAttribute('r', '2.2');
      c.setAttribute('fill', '#8b5cf6');
      c.setAttribute('stroke', '#1c1c2a');
      c.setAttribute('stroke-width', '0.5');
      g.appendChild(c);

      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', pt.x + 3.5);
      t.setAttribute('y', pt.y - 2.5);
      t.setAttribute('font-size', '5.5');
      t.setAttribute('fill', '#a78bfa');
      t.setAttribute('font-family', 'Arial, sans-serif');
      t.setAttribute('font-weight', 'bold');
      t.textContent = name;
      g.appendChild(t);
    });

    // 8. Nombre de pieza centrado
    const bbox  = _bbox();
    const cx    = (bbox.minX + bbox.maxX) / 2;
    const cy    = (bbox.minY + bbox.maxY) / 2;
    _addLabel(g, cx, cy - 8, _pieceName, '#ede9fe', 6, 'middle');
    _addLabel(g, cx, cy + 4, 'Trazado manual', '#9490b0', 4.5, 'middle');

    const PAD = 20;
    return {
      group: g,
      bounds: {
        x: bbox.minX - PAD, y: bbox.minY - PAD,
        w: (bbox.maxX - bbox.minX) + PAD*2,
        h: (bbox.maxY - bbox.minY) + PAD*2,
      },
      name: _pieceName,
    };
  }

  function _buildPath(lines) {
    if (!lines.length) return null;
    let d = '', started = false;

    lines.forEach(l => {
      const a = _points[l.from], b = _points[l.to];
      if (!a || !b) return;

      if (!started) { d += 'M ' + a.x + ' ' + a.y; started = true; }

      if (l.type === 'line') {
        d += ' L ' + b.x + ' ' + b.y;
      } else if (l.type === 'curve' && l.cp1) {
        if (l.cp1.x === l.cp2?.x && l.cp1.y === l.cp2?.y) {
          d += ' Q ' + l.cp1.x + ' ' + l.cp1.y + ' ' + b.x + ' ' + b.y;
        } else {
          d += ' C ' + l.cp1.x + ' ' + l.cp1.y + ' ' + l.cp2.x + ' ' + l.cp2.y + ' ' + b.x + ' ' + b.y;
        }
      } else if (l.type === 'arc') {
        const sf = l.dir === 'concavo' ? 0 : 1;
        d += ' A ' + l.radio + ' ' + l.radio + ' 0 0 ' + sf + ' ' + b.x + ' ' + b.y;
      }
    });

    return d;
  }

  function _svgSimpleLine(l, stroke, width, dash) {
    const a = _points[l.from], b = _points[l.to];
    const el = document.createElementNS(NS, 'line');
    el.setAttribute('x1', a.x); el.setAttribute('y1', a.y);
    el.setAttribute('x2', b.x); el.setAttribute('y2', b.y);
    el.setAttribute('stroke', stroke || '#e2e8f0');
    el.setAttribute('stroke-width', width || '0.8');
    if (dash) el.setAttribute('stroke-dasharray', dash);
    el.setAttribute('fill', 'none');
    return el;
  }

  function _addLabel(parent, x, y, text, fill, size, anchor) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('font-size', size || 4);
    t.setAttribute('fill', fill || '#9490b0');
    t.setAttribute('font-family', 'Arial, sans-serif');
    t.setAttribute('text-anchor', anchor || 'start');
    t.textContent = text;
    parent.appendChild(t);
    return t;
  }

  function _bbox() {
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    Object.values(_points).forEach(p => {
      if (p.x<minX) minX=p.x; if (p.y<minY) minY=p.y;
      if (p.x>maxX) maxX=p.x; if (p.y>maxY) maxY=p.y;
    });
    return { minX:minX===Infinity?0:minX, minY:minY===Infinity?0:minY,
             maxX:maxX===-Infinity?100:maxX, maxY:maxY===-Infinity?100:maxY };
  }

  return { compileAndRender, getPoints:()=>({..._points}),
           getErrors:()=>[..._errors], getWarnings:()=>[..._warnings] };
})();
