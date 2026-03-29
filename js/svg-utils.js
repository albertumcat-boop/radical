/**
 * svg-utils.js
 * Utilidades para construir elementos SVG en mm.
 * Todas las coordenadas son en mm (1 unidad = 1 mm).
 */

'use strict';
window.PAT = window.PAT || {};

PAT.SVGUtils = (function() {

  const NS = 'http://www.w3.org/2000/svg';

  // ─── Crear elemento SVG con atributos ─────────────────────────────────
  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      e.setAttribute(k, v);
    }
    return e;
  }

  // ─── Formatear número a 3 decimales para SVG ─────────────────────────
  function n(val) { return Math.round(val * 1000) / 1000; }

  // ─── Comandos de path ─────────────────────────────────────────────────
  const P = {
    M: (x, y)                         => `M ${n(x)} ${n(y)}`,
    L: (x, y)                         => `L ${n(x)} ${n(y)}`,
    H: (x)                            => `H ${n(x)}`,
    V: (y)                            => `V ${n(y)}`,
    Q: (cx, cy, x, y)                 => `Q ${n(cx)} ${n(cy)} ${n(x)} ${n(y)}`,
    C: (cx1, cy1, cx2, cy2, x, y)     => `C ${n(cx1)} ${n(cy1)} ${n(cx2)} ${n(cy2)} ${n(x)} ${n(y)}`,
    A: (rx, ry, rot, laf, sf, x, y)   => `A ${n(rx)} ${n(ry)} ${rot} ${laf} ${sf} ${n(x)} ${n(y)}`,
    Z: ()                             => 'Z',
  };

  // ─── Crear path SVG completo ───────────────────────────────────────────
  function path(d, attrs) {
    return el('path', Object.assign({ d, fill: 'none', stroke: PAT.COLORS.cutLine, 'stroke-width': '0.8' }, attrs));
  }

  // ─── Interpolación cuadrática en t=[0,1] ──────────────────────────────
  function quadBezierPoint(p0, p1, p2, t) {
    return {
      x: (1-t)*(1-t)*p0.x + 2*(1-t)*t*p1.x + t*t*p2.x,
      y: (1-t)*(1-t)*p0.y + 2*(1-t)*t*p1.y + t*t*p2.y,
    };
  }

  // ─── Calcular longitud aproximada de un bezier cúbico ─────────────────
  function cubicBezierLength(p0, p1, p2, p3, steps = 20) {
    let len = 0;
    let prev = p0;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const cur = {
        x: mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x,
        y: mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y,
      };
      len += Math.hypot(cur.x - prev.x, cur.y - prev.y);
      prev = cur;
    }
    return len;
  }

  // ─── Crear texto SVG ──────────────────────────────────────────────────
  function text(x, y, str, attrs) {
    const t = el('text', Object.assign({
      x: n(x), y: n(y),
      'font-size': PAT.FONT.label,
      fill: PAT.COLORS.seamLine,
      'font-family': 'Segoe UI, Arial, sans-serif',
      'text-anchor': 'middle',
    }, attrs));
    t.textContent = str;
    return t;
  }

  // ─── Crear muesca de sastre (triángulo pequeño) ────────────────────────
  function notch(x, y, angle = 0, size = 3) {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    // Triángulo apuntando hacia afuera
    const pts = [
      [x, y - size],
      [x - size * 0.5, y + size * 0.5],
      [x + size * 0.5, y + size * 0.5],
    ].map(([px, py]) => {
      // Rotar
      const rx = cos * (px - x) - sin * (py - y) + x;
      const ry = sin * (px - x) + cos * (py - y) + y;
      return `${n(rx)},${n(ry)}`;
    });
    return el('polygon', {
      points: pts.join(' '),
      fill: PAT.COLORS.notch, stroke: 'none',
    });
  }

  // ─── Línea de hilo (grain line) con flechas ───────────────────────────
  function grainLine(x, y, length, vertical = true) {
    const g = el('g', {});
    const x2 = vertical ? x : x + length;
    const y2 = vertical ? y + length : y;
    const line = el('line', {
      x1: n(x), y1: n(y), x2: n(x2), y2: n(y2),
      stroke: PAT.COLORS.grainLine, 'stroke-width': '0.7',
      'marker-start': 'url(#arrow-rev)', 'marker-end': 'url(#arrow)',
    });
    // Texto "Hilo recto" centrado
    const mx = (x + x2) / 2, my = (y + y2) / 2;
    const lab = el('text', {
      x: n(mx + (vertical ? 4 : 0)),
      y: n(my + (vertical ? 0 : -3)),
      'font-size': PAT.FONT.grain, fill: PAT.COLORS.grainLine,
      'font-family': 'Arial, sans-serif',
      transform: vertical ? `rotate(-90, ${n(mx+4)}, ${n(my)})` : '',
    });
    lab.textContent = 'Hilo recto';
    g.appendChild(line);
    g.appendChild(lab);
    return g;
  }

  // ─── Línea de doblez (fold line) ──────────────────────────────────────
  function foldLine(x1, y1, x2, y2, label = 'Doblar en tela') {
    const g = el('g', {});
    g.appendChild(el('line', {
      x1: n(x1), y1: n(y1), x2: n(x2), y2: n(y2),
      stroke: PAT.COLORS.foldLine, 'stroke-width': '0.6',
      'stroke-dasharray': '8,4',
    }));
    const mx = (x1+x2)/2, my = (y1+y2)/2;
    const vertical = Math.abs(x2-x1) < Math.abs(y2-y1);
    const t = el('text', {
      x: n(mx + (vertical ? -5 : 0)),
      y: n(my + (vertical ? 0 : -4)),
      'font-size': PAT.FONT.label, fill: PAT.COLORS.foldLine,
      'font-family': 'Arial, sans-serif', 'text-anchor': 'middle',
      transform: vertical ? `rotate(-90, ${n(mx-5)}, ${n(my)})` : '',
    });
    t.textContent = label;
    g.appendChild(t);
    return g;
  }

  // ─── Cuadrado de calibración 5×5cm ────────────────────────────────────
  function calibrationSquare(x, y) {
    const s = 50; // 50 mm = 5 cm
    const g = el('g', { id: 'calibration-square' });

    // Rectángulo exterior
    g.appendChild(el('rect', {
      x: n(x), y: n(y), width: s, height: s,
      fill: 'none', stroke: PAT.COLORS.dimLine, 'stroke-width': '0.5',
    }));

    // Líneas de cruz internas
    g.appendChild(el('line', {
      x1: n(x + s/2), y1: n(y), x2: n(x + s/2), y2: n(y + s),
      stroke: PAT.COLORS.dimLine, 'stroke-width': '0.3', 'stroke-dasharray': '3,2',
    }));
    g.appendChild(el('line', {
      x1: n(x), y1: n(y + s/2), x2: n(x + s), y2: n(y + s/2),
      stroke: PAT.COLORS.dimLine, 'stroke-width': '0.3', 'stroke-dasharray': '3,2',
    }));

    // Etiqueta
    const label = el('text', {
      x: n(x + s/2), y: n(y + s + 8),
      'font-size': '4', fill: PAT.COLORS.dimLine,
      'font-family': 'Arial', 'text-anchor': 'middle',
    });
    label.textContent = '◄──── 5 cm ────►';
    g.appendChild(label);

    const label2 = el('text', {
      x: n(x - 8), y: n(y + s/2),
      'font-size': '3.5', fill: PAT.COLORS.dimLine,
      'font-family': 'Arial', 'text-anchor': 'middle',
      transform: `rotate(-90, ${n(x-8)}, ${n(y+s/2)})`,
    });
    label2.textContent = '5 cm';
    g.appendChild(label2);

    const note = el('text', {
      x: n(x + s/2), y: n(y - 4),
      'font-size': '3.5', fill: PAT.COLORS.dimLine,
      'font-family': 'Arial', 'text-anchor': 'middle',
    });
    note.textContent = '▣ CUADRADO DE CALIBRACIÓN — verificar antes de imprimir';
    g.appendChild(note);

    return g;
  }

  // ─── Etiqueta de pieza (título + medidas) ─────────────────────────────
  function pieceLabel(x, y, title, info) {
    const g = el('g', {});
    const t1 = el('text', {
      x: n(x), y: n(y),
      'font-size': PAT.FONT.title, fill: PAT.COLORS.cutLine,
      'font-family': 'Arial, sans-serif', 'font-weight': 'bold',
    });
    t1.textContent = title;
    g.appendChild(t1);
    (info || []).forEach((line, i) => {
      const t = el('text', {
        x: n(x), y: n(y + (i + 1) * (PAT.FONT.label + 1.5)),
        'font-size': PAT.FONT.label, fill: PAT.COLORS.seamLine,
        'font-family': 'Arial, sans-serif',
      });
      t.textContent = line;
      g.appendChild(t);
    });
    return g;
  }

  // ─── Línea de costura interior (offset simple para rectas) ───────────
  // Genera un rect o path dentro del contorno a `seam` distancia
  function seamAllowanceRect(x, y, w, h, seam) {
    return el('rect', {
      x: n(x + seam), y: n(y + seam),
      width: n(w - 2*seam), height: n(h - 2*seam),
      fill: 'none', stroke: PAT.COLORS.seamLine,
      'stroke-width': '0.4', 'stroke-dasharray': '4,2',
    });
  }

  // ─── Calcular bounding box de puntos ──────────────────────────────────
  function bbox(points) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(([x, y]) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    });
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  // ─── Traducir (mover) un path completo ────────────────────────────────
  function translatePath(d, dx, dy) {
    return d.replace(/([ML])\s*([\d.]+)\s+([\d.]+)/g, (m, cmd, x, y) =>
      `${cmd} ${n(+x + dx)} ${n(+y + dy)}`
    ).replace(/([CQ])\s*([\d.\s]+)/g, (m, cmd, coords) => {
      const nums = coords.trim().split(/\s+/).map(Number);
      const moved = [];
      for (let i = 0; i < nums.length; i += 2) {
        moved.push(n(nums[i] + dx), n(nums[i+1] + dy));
      }
      return `${cmd} ${moved.join(' ')}`;
    });
  }

  // ─── Punto en una línea perpendicular ────────────────────────────────
  function perpPoint(x1, y1, x2, y2, dist) {
    const len = Math.hypot(x2-x1, y2-y1);
    if (len === 0) return { x: x1, y: y1 };
    return {
      x: x1 + (-(y2-y1)/len) * dist,
      y: y1 + ( (x2-x1)/len) * dist,
    };
  }

  return { el, n, P, path, text, notch, grainLine, foldLine,
           calibrationSquare, pieceLabel, seamAllowanceRect,
           bbox, translatePath, perpPoint,
           quadBezierPoint, cubicBezierLength, NS };
})();
