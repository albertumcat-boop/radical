'use strict';
window.PAT = window.PAT || {};

/**
 * PAT.CustomGarments — puente entre las piezas propias del usuario
 * (guardadas en "Mis Sistemas" o desde el editor "✏ Trazar" con el botón
 * "💾 Guardar") y la pantalla principal: las expone como prendas más en el
 * selector de prendas, reactivas a las medidas igual que las prendas de
 * fábrica (Franela, Blusa, etc.).
 *
 * Cada prenda personalizada tiene un id con prefijo "custom:" para no
 * chocar con los 11 ids de fábrica:
 *   - "custom:ms:<sistemaKey>:<piezaId>"  → viene de Mis Sistemas
 *   - "custom:sv:<savedId>"               → viene de "💾 Guardar" del editor
 */
PAT.CustomGarments = (function () {

  // ── Geometría: réplica del cálculo de punto de control del editor ─────
  function _curveCP(a, b, ln) {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if (ln && ln.cpx != null && ln.cpx !== undefined) {
      return { cpx: ln.cpx, cpy: ln.cpy };
    }
    const ctrl = (ln && ln.ctrl != null) ? ln.ctrl : 0;
    return { cpx: mx - (dy / len) * ctrl, cpy: my + (dx / len) * ctrl };
  }

  // ── Evalúa fx/fy de un set de puntos "crudos" (editor) contra medidas ──
  function _resolvePoints(points, vars) {
    const out = {};
    Object.entries(points || {}).forEach(([id, p]) => {
      let x = p.x, y = p.y;
      if (p.fx && PAT.MisSistemas) {
        const v = PAT.MisSistemas._evalExpr(p.fx, vars);
        if (v != null && !isNaN(v)) x = v;
      }
      if (p.fy && PAT.MisSistemas) {
        const v = PAT.MisSistemas._evalExpr(p.fy, vars);
        if (v != null && !isNaN(v)) y = v;
      }
      out[id] = { x, y, name: p.name || p.nombre || id };
    });
    return out;
  }

  // ── Construye el grupo SVG (mismo contrato {group,bounds} que js/patterns/*.js) ──
  function _buildSVGGroup(points, lines, name) {
    const SU = PAT.SVGUtils;
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'custom-piece');

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    Object.values(points || {}).forEach(p => {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    });
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 200; maxY = 200; }

    const PAD = 10;
    const off = { x: -minX + PAD, y: -minY + PAD };

    (lines || []).forEach(ln => {
      const a = points[ln.from], b = points[ln.to];
      if (!a || !b) return;
      const ax = a.x + off.x, ay = a.y + off.y, bx = b.x + off.x, by = b.y + off.y;
      let d;
      if (ln.type === 'curve') {
        const { cpx, cpy } = _curveCP({ x: ax, y: ay }, { x: bx, y: by }, ln);
        d = `M ${ax} ${ay} Q ${cpx} ${cpy} ${bx} ${by}`;
      } else {
        d = `M ${ax} ${ay} L ${bx} ${by}`;
      }
      if (SU && SU.path) g.appendChild(SU.path(d, {}));
    });

    Object.values(points || {}).forEach(p => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', p.x + off.x);
      c.setAttribute('cy', p.y + off.y);
      c.setAttribute('r', 2);
      c.setAttribute('fill', '#333');
      g.appendChild(c);
    });

    if (name && SU && SU.text) {
      g.appendChild(SU.text((maxX - minX) / 2 + PAD, (maxY - minY) + PAD + 16, name, {}));
    }

    const w = (maxX - minX) + PAD * 2, h = (maxY - minY) + PAD * 2;
    return { group: g, bounds: { w, h } };
  }

  // ── Catálogo: piezas elegibles desde Mis Sistemas ──────────────────────
  function _listFromMisSistemas() {
    const out = [];
    const sis = window.PAT.Sistemas || {};
    Object.keys(sis).forEach(key => {
      if (key.indexOf('user_') !== 0) return;
      const s = sis[key];
      const piezas = (s.piezasDama || []).concat(s.piezasCaballero || []);
      const vistos = {};
      piezas.forEach(p => {
        if (vistos[p.id]) return;
        vistos[p.id] = true;
        const id = 'custom:ms:' + key + ':' + p.id;
        out.push({
          id, label: p.label + ' (' + s.nombre + ')', count: piezas.length,
          _gen: (measures) => s.generarBloque(p.id, measures),
        });
      });
    });
    return out;
  }

  // ── Catálogo: piezas elegibles desde "💾 Guardar" del editor ───────────
  function _listFromSavedPatterns() {
    const out = [];
    if (!PAT.SavedPatterns) return out;
    const all = PAT.SavedPatterns.obtenerTodos() || {};
    Object.entries(all).forEach(([id, data]) => {
      out.push({
        id: 'custom:sv:' + id,
        label: (data.name || 'Mi pieza') + ' (mía)',
        count: 1,
        _gen: (measures) => {
          const vars = PAT.MisSistemas ? PAT.MisSistemas._buildVarsDesde(measures) : {};
          const pts = _resolvePoints(data.points, vars);
          return { points: pts, lines: data.lines, name: data.name };
        },
      });
    });
    return out;
  }

  function list() {
    return _listFromMisSistemas().concat(_listFromSavedPatterns());
  }

  function getLabel(customId) {
    const e = list().find(e => e.id === customId);
    return e ? e.label.replace(/\s*\((mía|[^)]+)\)$/, '') : customId;
  }

  function getCount(customId) {
    const e = list().find(e => e.id === customId);
    return e ? (e.count || 1) : 1;
  }

  function generate(customId, measures) {
    const entry = list().find(e => e.id === customId);
    if (!entry) return [];
    let block;
    try { block = entry._gen(measures); } catch (e) {
      console.error('[CustomGarments] Error generando', customId, e);
      return [];
    }
    if (!block || !block.points) return [];
    const piece = _buildSVGGroup(block.points, block.lines, block.name);
    return [piece];
  }

  return { list, generate, getLabel, getCount };

})();
