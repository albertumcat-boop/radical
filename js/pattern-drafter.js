/**
 * pattern-drafter.js
 * Editor de trazado manual por instrucciones.
 *
 * Sintaxis de instrucciones:
 *   PUNTO A 0,0              → define punto A en coordenadas mm
 *   PUNTO B desde:A der:5    → punto B a 5mm a la derecha de A
 *   PUNTO C desde:A abajo:10 → punto C a 10mm abajo de A
 *   PUNTO D desde:B abajo:8 der:3  → diagonal
 *   LINEA A B                → línea recta de A a B
 *   CURVA A B control:5      → curva con tensión de 5mm
 *   CURVA A B cp:20,5        → curva con punto de control manual
 *   ARCO A B radio:12        → arco de circunferencia
 *   COTA A B "Largo espalda" → línea de cota con etiqueta
 *   HILO A B                 → línea de hilo recto
 *   DOBLEZ A B               → línea de doblez (roja)
 *   CERRAR                   → cierra el contorno (última línea al primer punto)
 *   MUESCA linea:AB pos:0.5  → muesca a la mitad de la línea AB
 *
 * Las coordenadas son en mm. Y positivo = abajo (igual que SVG).
 * Ejemplo de pieza completa al final de este archivo.
 */

'use strict';
window.PAT = window.PAT || {};

PAT.Drafter = (function () {

  const NS = 'http://www.w3.org/2000/svg';
  const U  = PAT.SVGUtils;

  // ─── Estado del editor ─────────────────────────────────────────
  let _points    = {};   // { nombre: {x, y} }
  let _lines     = [];   // [ {type, from, to, ...} ]
  let _errors    = [];
  let _warnings  = [];
  let _pieceName = 'Pieza';
  let _firstPoint= null; // para CERRAR

  // ─── RESET ─────────────────────────────────────────────────────
  function reset() {
    _points    = {};
    _lines     = [];
    _errors    = [];
    _warnings  = [];
    _firstPoint= null;
  }

  // ═══════════════════════════════════════════════════════════════
  // PARSER DE INSTRUCCIONES
  // ═══════════════════════════════════════════════════════════════
  function parseInstructions(text) {
    reset();
    const lines  = text.split('\n');
    const result = [];

    lines.forEach(function(rawLine, idx) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) return;

      try {
        const parsed = parseLine(line, idx + 1);
        if (parsed) result.push(parsed);
      } catch (e) {
        _errors.push('Línea ' + (idx + 1) + ': ' + e.message);
      }
    });

    return result;
  }

  function parseLine(line, lineNum) {
    const upper = line.toUpperCase();
    const tokens = tokenize(line);
    if (tokens.length === 0) return null;

    const cmd = tokens[0].toUpperCase();

    switch (cmd) {
      case 'PIEZA':
      case 'NOMBRE':
        _pieceName = tokens.slice(1).join(' ').replace(/"/g, '');
        return null;

      case 'PUNTO':
      case 'P':
        return parsePoint(tokens, lineNum);

      case 'LINEA':
      case 'L':
        return parseStraightLine(tokens, lineNum);

      case 'CURVA':
      case 'C':
        return parseCurve(tokens, lineNum);

      case 'ARCO':
      case 'A':
        return parseArc(tokens, lineNum);

      case 'COTA':
        return parseDimension(tokens, lineNum);

      case 'HILO':
        return parseGrainLine(tokens, lineNum);

      case 'DOBLEZ':
        return parseFoldLine(tokens, lineNum);

      case 'CERRAR':
      case 'Z':
        return parseClose(tokens, lineNum);

      case 'MUESCA':
      case 'M':
        return parseNotch(tokens, lineNum);

      case 'COSTURA':
        return parseSeamLine(tokens, lineNum);

      default:
        _warnings.push('Línea ' + lineNum + ': Instrucción desconocida "' + cmd + '"');
        return null;
    }
  }

  // ─── Tokenizar respetando comillas ────────────────────────────
  function tokenize(line) {
    const tokens = [];
    let current  = '';
    let inQuote  = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ' ' && !inQuote) {
        if (current) { tokens.push(current); current = ''; }
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  // ─── Parsear un parámetro clave:valor ─────────────────────────
  // Ej: "desde:A", "der:5", "abajo:10", "cp:20,5"
  function getParam(tokens, key) {
    const k = key.toLowerCase() + ':';
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].toLowerCase().startsWith(k)) {
        return tokens[i].slice(k.length);
      }
    }
    return null;
  }

  // ─── INSTRUCCIÓN: PUNTO ───────────────────────────────────────
  function parsePoint(tokens, lineNum) {
    // PUNTO nombre x,y
    // PUNTO nombre desde:X der:N abajo:N arriba:N izq:N
    if (tokens.length < 2) throw new Error('PUNTO requiere al menos un nombre');

    const name = tokens[1].toUpperCase();

    let x = 0, y = 0;

    // Forma directa: PUNTO A 10,20 o PUNTO A 10 20
    const coords = tokens[2];
    if (coords && coords.includes(',')) {
      const parts = coords.split(',');
      x = parseFloat(parts[0]);
      y = parseFloat(parts[1]);
    } else if (coords && !coords.includes(':') && tokens[3] && !tokens[3].includes(':')) {
      x = parseFloat(coords);
      y = parseFloat(tokens[3]);
    } else {
      // Forma relativa: desde:OTRO der:5 abajo:10
      const desde = getParam(tokens, 'desde') || getParam(tokens, 'de');
      if (desde) {
        const ref = _points[desde.toUpperCase()];
        if (!ref) throw new Error('Punto de referencia "' + desde + '" no definido');
        x = ref.x;
        y = ref.y;
      }

      const der    = parseFloat(getParam(tokens, 'der')    || getParam(tokens, 'derecha')  || '0');
      const izq    = parseFloat(getParam(tokens, 'izq')    || getParam(tokens, 'izquierda')|| '0');
      const abajo  = parseFloat(getParam(tokens, 'abajo')  || getParam(tokens, 'bajo')     || '0');
      const arriba = parseFloat(getParam(tokens, 'arriba') || getParam(tokens, 'arr')      || '0');

      x += der - izq;
      y += abajo - arriba;
    }

    if (isNaN(x) || isNaN(y)) throw new Error('Coordenadas inválidas en PUNTO ' + name);

    _points[name] = { x, y };
    if (!_firstPoint) _firstPoint = name;

    return { type: 'point', name, x, y };
  }

  // ─── INSTRUCCIÓN: LINEA ───────────────────────────────────────
  function parseStraightLine(tokens, lineNum) {
    // LINEA A B [corte|costura|doblez]
    if (tokens.length < 3) throw new Error('LINEA requiere dos puntos');
    const from = tokens[1].toUpperCase();
    const to   = tokens[2].toUpperCase();
    _checkPoints(from, to, lineNum);
    const style = (tokens[3] || 'corte').toLowerCase();
    _lines.push({ type: 'line', from, to, style });
    return { type: 'line', from, to, style };
  }

  // ─── INSTRUCCIÓN: CURVA ───────────────────────────────────────
  function parseCurve(tokens, lineNum) {
    // CURVA A B control:N  → N mm de bulge perpendicular
    // CURVA A B cp:x,y     → punto de control absoluto
    // CURVA A B cp1:x,y cp2:x,y → bezier cúbico
    if (tokens.length < 3) throw new Error('CURVA requiere dos puntos');
    const from = tokens[1].toUpperCase();
    const to   = tokens[2].toUpperCase();
    _checkPoints(from, to, lineNum);

    const controlVal = getParam(tokens, 'control') || getParam(tokens, 'ctrl');
    const cpVal      = getParam(tokens, 'cp');
    const cp1Val     = getParam(tokens, 'cp1');
    const cp2Val     = getParam(tokens, 'cp2');
    const style      = getParam(tokens, 'estilo') || 'corte';

    let cp1 = null, cp2 = null, bulge = 0;

    if (controlVal) {
      // Bulge perpendicular
      bulge = parseFloat(controlVal);
      const mid = _midPoint(from, to);
      const perp = _perpendicular(from, to, bulge);
      cp1 = { x: mid.x + perp.x, y: mid.y + perp.y };
      cp2 = cp1;
    } else if (cpVal) {
      const parts = cpVal.split(',');
      cp1 = { x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
      cp2 = cp1;
    } else if (cp1Val && cp2Val) {
      const p1 = cp1Val.split(',');
      const p2 = cp2Val.split(',');
      cp1 = { x: parseFloat(p1[0]), y: parseFloat(p1[1]) };
      cp2 = { x: parseFloat(p2[0]), y: parseFloat(p2[1]) };
    } else {
      // Sin control → curva suave por defecto (1/3 del largo)
      const dist = _distance(from, to) * 0.33;
      const perp = _perpendicular(from, to, dist);
      const mid  = _midPoint(from, to);
      cp1 = { x: mid.x + perp.x, y: mid.y + perp.y };
      cp2 = cp1;
    }

    _lines.push({ type: 'curve', from, to, cp1, cp2, style });
    return { type: 'curve', from, to, cp1, cp2, style };
  }

  // ─── INSTRUCCIÓN: ARCO ────────────────────────────────────────
  function parseArc(tokens, lineNum) {
    // ARCO A B radio:N [concavo|convexo]
    if (tokens.length < 3) throw new Error('ARCO requiere dos puntos y radio');
    const from  = tokens[1].toUpperCase();
    const to    = tokens[2].toUpperCase();
    _checkPoints(from, to, lineNum);

    const radioStr = getParam(tokens, 'radio') || getParam(tokens, 'r');
    if (!radioStr) throw new Error('ARCO requiere radio:N');
    const radio = parseFloat(radioStr);
    const dir   = (getParam(tokens, 'dir') || 'convexo').toLowerCase();

    _lines.push({ type: 'arc', from, to, radio, dir });
    return { type: 'arc', from, to, radio, dir };
  }

  // ─── INSTRUCCIÓN: CERRAR ──────────────────────────────────────
  function parseClose(tokens, lineNum) {
    if (!_firstPoint) throw new Error('CERRAR: no hay puntos definidos');
    const lastPoint = Object.keys(_points)[Object.keys(_points).length - 1];
    const style = (tokens[1] || 'corte').toLowerCase();
    _lines.push({ type: 'line', from: lastPoint, to: _firstPoint, style });
    return { type: 'close' };
  }

  // ─── INSTRUCCIÓN: MUESCA ──────────────────────────────────────
  function parseNotch(tokens, lineNum) {
    // MUESCA linea:AB pos:0.5 [angulo:90]
    const lineRef = getParam(tokens, 'linea') || getParam(tokens, 'l');
    const posStr  = getParam(tokens, 'pos')   || getParam(tokens, 'p') || '0.5';
    const angStr  = getParam(tokens, 'angulo')|| getParam(tokens, 'ang') || '0';

    if (!lineRef || lineRef.length < 2)
      throw new Error('MUESCA requiere linea:AB (dos letras de puntos)');

    const from = lineRef[0].toUpperCase();
    const to   = lineRef.slice(1).toUpperCase();
    const pos  = parseFloat(posStr);
    const ang  = parseFloat(angStr);

    return { type: 'notch', from, to, pos, ang };
  }

  // ─── INSTRUCCIÓN: COTA ────────────────────────────────────────
  function parseDimension(tokens, lineNum) {
    // COTA A B "etiqueta"
    if (tokens.length < 3) throw new Error('COTA requiere dos puntos');
    const from  = tokens[1].toUpperCase();
    const to    = tokens[2].toUpperCase();
    const label = tokens.slice(3).join(' ').replace(/"/g, '') || '';
    return { type: 'dimension', from, to, label };
  }

  // ─── INSTRUCCIÓN: HILO ────────────────────────────────────────
  function parseGrainLine(tokens, lineNum) {
    if (tokens.length < 3) throw new Error('HILO requiere dos puntos');
    const from = tokens[1].toUpperCase();
    const to   = tokens[2].toUpperCase();
    return { type: 'grain', from, to };
  }

  // ─── INSTRUCCIÓN: DOBLEZ ──────────────────────────────────────
  function parseFoldLine(tokens, lineNum) {
    if (tokens.length < 3) throw new Error('DOBLEZ requiere dos puntos');
    const from = tokens[1].toUpperCase();
    const to   = tokens[2].toUpperCase();
    return { type: 'fold', from, to };
  }

  // ─── INSTRUCCIÓN: COSTURA ─────────────────────────────────────
  function parseSeamLine(tokens, lineNum) {
    if (tokens.length < 3) throw new Error('COSTURA requiere dos puntos');
    const from = tokens[1].toUpperCase();
    const to   = tokens[2].toUpperCase();
    return { type: 'seam', from, to };
  }

  // ─── HELPERS GEOMÉTRICOS ──────────────────────────────────────
  function _checkPoints() {
    for (let i = 0; i < arguments.length - 1; i++) {
      const name = arguments[i];
      if (typeof name === 'string' && !_points[name]) {
        throw new Error('Punto "' + name + '" no definido');
      }
    }
  }

  function _midPoint(nameA, nameB) {
    const a = _points[nameA], b = _points[nameB];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function _distance(nameA, nameB) {
    const a = _points[nameA], b = _points[nameB];
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function _perpendicular(nameA, nameB, dist) {
    const a  = _points[nameA], b = _points[nameB];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    // Perpendicular normalizada × dist
    return { x: -dy / len * dist, y: dx / len * dist };
  }

  // ═══════════════════════════════════════════════════════════════
  // GENERADOR SVG
  // ═══════════════════════════════════════════════════════════════
  function generateSVG(instructions) {
    if (!instructions || instructions.length === 0) return null;

    const g = document.createElementNS(NS, 'g');
    g.setAttribute('id', 'drafter-piece');

    // Separar por tipo
    const lines      = _lines;  // acumulado durante el parse
    const points     = _points;
    const notches    = instructions.filter(i => i.type === 'notch');
    const dimensions = instructions.filter(i => i.type === 'dimension');
    const grains     = instructions.filter(i => i.type === 'grain');
    const folds      = instructions.filter(i => i.type === 'fold');

    // 1. Construir el path del contorno
    const contourPath = _buildContourPath(lines, points);
    if (contourPath) {
      const pathEl = document.createElementNS(NS, 'path');
      pathEl.setAttribute('d', contourPath);
      pathEl.setAttribute('fill', 'rgba(255,255,255,0.03)');
      pathEl.setAttribute('stroke', '#e2e8f0');
      pathEl.setAttribute('stroke-width', '0.8');
      pathEl.setAttribute('stroke-linejoin', 'round');
      pathEl.setAttribute('stroke-linecap', 'round');
      g.appendChild(pathEl);
    }

    // 2. Líneas de costura (interior, punteado)
    lines.filter(l => l.style === 'costura').forEach(function(line) {
      g.appendChild(_svgLine(points, line, '#666688', '0.4', '4,2'));
    });

    // 3. Líneas de doblez
    folds.forEach(function(f) {
      if (U && U.foldLine) {
        const a = points[f.from], b = points[f.to];
        if (a && b) g.appendChild(U.foldLine(a.x, a.y, b.x, b.y));
      }
    });

    // 4. Líneas de hilo recto
    grains.forEach(function(gr) {
      if (U && U.grainLine) {
        const a = points[gr.from], b = points[gr.to];
        if (a && b) {
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const isV = Math.abs(b.x - a.x) < Math.abs(b.y - a.y);
          g.appendChild(U.grainLine(a.x, a.y, len, isV));
        }
      }
    });

    // 5. Muescas
    notches.forEach(function(n) {
      const a = points[n.from], b = points[n.to];
      if (!a || !b) return;
      const nx = a.x + (b.x - a.x) * n.pos;
      const ny = a.y + (b.y - a.y) * n.pos;
      if (U && U.notch) g.appendChild(U.notch(nx, ny, n.ang, 3));
    });

    // 6. Cotas
    dimensions.forEach(function(dim) {
      const a = points[dim.from], b = points[dim.to];
      if (!a || !b) return;
      const dist = Math.round(Math.hypot(b.x - a.x, b.y - a.y));
      g.appendChild(_svgDimension(a, b, dim.label, dist));
    });

    // 7. Puntos (círculos y etiquetas)
    Object.entries(points).forEach(function([name, pt]) {
      // Punto
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', '1.5');
      circle.setAttribute('fill', '#8b5cf6');
      circle.setAttribute('stroke', 'none');
      g.appendChild(circle);

      // Etiqueta del punto
      const text = document.createElementNS(NS, 'text');
      text.setAttribute('x', pt.x + 3);
      text.setAttribute('y', pt.y - 2);
      text.setAttribute('font-size', '5');
      text.setAttribute('fill', '#a78bfa');
      text.setAttribute('font-family', 'Arial, sans-serif');
      text.setAttribute('font-weight', 'bold');
      text.textContent = name;
      g.appendChild(text);
    });

    // 8. Etiqueta de pieza
    if (U && U.pieceLabel) {
      const bbox  = _calculateBBox(points);
      const label = U.pieceLabel(
        bbox.minX + 10,
        bbox.minY + (bbox.maxY - bbox.minY) * 0.5,
        _pieceName,
        ['Trazado manual', Object.keys(points).length + ' puntos']
      );
      g.appendChild(label);
    }

    // Calcular bounds
    const bbox = _calculateBBox(points);
    const PAD  = 15;
    const bounds = {
      x: bbox.minX - PAD, y: bbox.minY - PAD,
      w: (bbox.maxX - bbox.minX) + PAD * 2,
      h: (bbox.maxY - bbox.minY) + PAD * 2,
    };

    return { group: g, bounds, name: _pieceName };
  }

  // ─── Construir path del contorno a partir de las líneas ────────
  function _buildContourPath(lines, points) {
    if (lines.length === 0) return null;

    let d = '';
    let started = false;

    lines.forEach(function(line) {
      const a = points[line.from];
      const b = points[line.to];
      if (!a || !b) return;

      if (!started) {
        d += 'M ' + a.x + ' ' + a.y;
        started = true;
      }

      switch (line.type) {
        case 'line':
          d += ' L ' + b.x + ' ' + b.y;
          break;

        case 'curve':
          if (line.cp1 && line.cp2) {
            if (line.cp1.x === line.cp2.x && line.cp1.y === line.cp2.y) {
              // Cuadrático
              d += ' Q ' + line.cp1.x + ' ' + line.cp1.y + ' ' + b.x + ' ' + b.y;
            } else {
              // Cúbico
              d += ' C ' + line.cp1.x + ' ' + line.cp1.y
                 + ' '   + line.cp2.x + ' ' + line.cp2.y
                 + ' '   + b.x + ' ' + b.y;
            }
          } else {
            d += ' L ' + b.x + ' ' + b.y;
          }
          break;

        case 'arc':
          const r   = line.radio;
          const sf  = line.dir === 'concavo' ? 0 : 1;
          d += ' A ' + r + ' ' + r + ' 0 0 ' + sf + ' ' + b.x + ' ' + b.y;
          break;
      }
    });

    return d;
  }

  // ─── SVG de una línea individual ──────────────────────────────
  function _svgLine(points, line, stroke, width, dash) {
    const a = points[line.from], b = points[line.to];
    const el = document.createElementNS(NS, 'line');
    el.setAttribute('x1', a.x); el.setAttribute('y1', a.y);
    el.setAttribute('x2', b.x); el.setAttribute('y2', b.y);
    el.setAttribute('stroke', stroke || '#e2e8f0');
    el.setAttribute('stroke-width', width || '0.8');
    if (dash) el.setAttribute('stroke-dasharray', dash);
    el.setAttribute('fill', 'none');
    return el;
  }

  // ─── SVG de una cota ──────────────────────────────────────────
  function _svgDimension(a, b, label, distMM) {
    const g = document.createElementNS(NS, 'g');
    const OFFSET = 8;

    // Línea de cota
    const dx  = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const px  = -dy / len * OFFSET, py = dx / len * OFFSET;

    const lineEl = document.createElementNS(NS, 'line');
    lineEl.setAttribute('x1', a.x + px); lineEl.setAttribute('y1', a.y + py);
    lineEl.setAttribute('x2', b.x + px); lineEl.setAttribute('y2', b.y + py);
    lineEl.setAttribute('stroke', '#8b5cf6');
    lineEl.setAttribute('stroke-width', '0.4');
    lineEl.setAttribute('marker-start', 'url(#arrow-rev)');
    lineEl.setAttribute('marker-end',   'url(#arrow)');
    g.appendChild(lineEl);

    // Texto
    const mx = (a.x + b.x) / 2 + px * 1.5;
    const my = (a.y + b.y) / 2 + py * 1.5;
    const text = document.createElementNS(NS, 'text');
    text.setAttribute('x', mx);
    text.setAttribute('y', my);
    text.setAttribute('font-size', '4.5');
    text.setAttribute('fill', '#8b5cf6');
    text.setAttribute('font-family', 'Arial, monospace');
    text.setAttribute('text-anchor', 'middle');

    const displayLabel = label ? label + ' ' : '';
    text.textContent   = displayLabel + distMM + 'mm';
    g.appendChild(text);

    return g;
  }

  // ─── Calcular bounding box de los puntos ──────────────────────
  function _calculateBBox(points) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    Object.values(points).forEach(function(p) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    if (minX === Infinity) { minX = 0; minY = 0; maxX = 100; maxY = 100; }
    return { minX, minY, maxX, maxY };
  }

  // ─── Calcular distancia entre dos puntos definidos ────────────
  function measureDistance(nameA, nameB) {
    const a = _points[nameA.toUpperCase()];
    const b = _points[nameB.toUpperCase()];
    if (!a || !b) return null;
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  // ─── Compilar y renderizar en el SVG principal ────────────────
  function compileAndRender(text) {
    const instructions = parseInstructions(text);
    return {
      piece:    generateSVG(instructions),
      points:   Object.assign({}, _points),
      errors:   _errors.slice(),
      warnings: _warnings.slice(),
    };
  }

  return {
    compileAndRender,
    parseInstructions,
    generateSVG,
    measureDistance,
    getPoints:   function() { return Object.assign({}, _points); },
    getErrors:   function() { return _errors.slice(); },
    getWarnings: function() { return _warnings.slice(); },
  };
})();
