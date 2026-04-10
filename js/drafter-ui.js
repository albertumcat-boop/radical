/**
 * drafter-ui.js v4.0 — Editor Visual tipo Valentina/Seamly2D
 * Canvas grande · Arrastrar puntos · Rectángulo base · Nombres libres
 */
'use strict';
window.PAT = window.PAT || {};

PAT.DrafterUI = (function () {
  const NS  = 'http://www.w3.org/2000/svg';
  const MK  = 'pat_manuals_v4';
  const PX_PER_MM = 3.779527559; // 96dpi

  // ── Estado ─────────────────────────────────────────────────
  let _modal    = null;
  let _svgEl    = null;
  let _canvasG  = null; // g principal (transforma con pan/zoom)
  let _linesG   = null;
  let _pointsG  = null;
  let _dimG     = null;

  let _points   = {};   // id → { x, y, name, formula }
  let _lines    = [];   // { from, to, type, ctrl }
  let _ptCtr    = 0;

  let _dragging = null;
  let _dragOff  = {x:0,y:0};
  let _tool     = 'select';
  let _lnStart  = null;
  let _pan      = {x:0,y:0};
  let _panStart = null;
  let _isPan    = false;
  let _zoom     = 1;
  let _selected = null;
  let _pieceName= 'Mi Pieza';
  let _curSave  = null;

  // ════════════════════════════════════════════════════════════
  function open() {
    if (_modal) { _modal.classList.add('open'); _refreshPanel(); return; }
    _css();
    _build();
  }
  function close() { if (_modal) _modal.classList.remove('open'); }

  // ════════════════════════════════════════════════════════════
  // CSS
  // ════════════════════════════════════════════════════════════
  function _css() {
    if (document.getElementById('dv4-css')) return;
    const s = document.createElement('style');
    s.id = 'dv4-css';
    s.textContent = `
#dv4-modal{z-index:700}
.dv4-shell{position:relative;z-index:1;background:#0a0a14;border:1px solid #3d3d58;border-radius:14px;width:min(1360px,99vw);height:min(940px,97vh);display:flex;flex-direction:column;box-shadow:0 40px 100px rgba(0,0,0,.98);overflow:hidden}
/* header */
.dv4-hdr{display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid #2e2e45;background:rgba(139,92,246,.07);flex-shrink:0}
.dv4-hdr-title{font-size:13px;font-weight:800;color:#ede9fe}
.dv4-name-inp{background:none;border:none;border-bottom:1.5px solid #3d3d58;color:#ede9fe;font-size:13px;font-weight:700;font-family:var(--font);outline:none;padding:2px 6px;min-width:180px;transition:border-color .15s}
.dv4-name-inp:focus{border-color:#8b5cf6}
.dv4-hdr-gap{flex:1}
.dv4-zoom-lbl{font-size:11px;color:#5a5678;font-family:monospace;background:#141420;padding:3px 10px;border-radius:10px;border:1px solid #2e2e45}
.dv4-close-btn{background:#141420;border:1.5px solid #3d3d58;color:#9490b0;border-radius:7px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:600;font-family:var(--font);transition:all .15s}
.dv4-close-btn:hover{background:#2a2a3e;color:#ede9fe}
/* toolbar */
.dv4-tb{display:flex;align-items:center;gap:4px;padding:7px 12px;border-bottom:1px solid #2e2e45;background:#07070f;flex-shrink:0;flex-wrap:wrap}
.dv4-sep{width:1px;height:22px;background:#2e2e45;margin:0 5px}
.tb{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:7px;border:1.5px solid #2e2e45;background:#141420;color:#9490b0;cursor:pointer;font-size:11px;font-weight:600;font-family:var(--font);transition:all .15s;white-space:nowrap}
.tb:hover{background:#2a2a3e;color:#ede9fe;border-color:#3d3d58}
.tb.on{background:rgba(139,92,246,.15);color:#a78bfa;border-color:#8b5cf6}
.tb.red{border-color:rgba(248,113,113,.25);color:#f87171}.tb.red:hover{background:rgba(248,113,113,.1)}
.tb.grn{border-color:rgba(52,211,153,.25);color:#34d399}.tb.grn:hover{background:rgba(52,211,153,.1)}
.tb.pri{background:#8b5cf6;color:#fff;border-color:#8b5cf6}.tb.pri:hover{filter:brightness(1.1)}
/* body */
.dv4-body{display:flex;flex:1;overflow:hidden;min-height:0}
/* canvas */
.dv4-cvwrap{flex:1;position:relative;overflow:hidden;background:#07070e;cursor:crosshair}
.dv4-cvwrap.sel{cursor:default}
#dv4-svg{width:100%;height:100%;display:block}
/* instruccion */
#dv4-instr{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);background:rgba(10,10,22,.9);border:1px solid #3d3d58;border-radius:20px;padding:6px 16px;font-size:12px;color:#9490b0;pointer-events:none;white-space:nowrap;backdrop-filter:blur(6px)}
#dv4-coord{position:absolute;top:10px;left:10px;font-size:10px;color:#3d3d58;font-family:monospace;background:rgba(7,7,14,.8);padding:3px 8px;border-radius:6px;pointer-events:none}
/* panel der */
.dv4-pnl{width:270px;flex-shrink:0;border-left:1px solid #2e2e45;display:flex;flex-direction:column;overflow:hidden;background:#090913}
.dv4-psec{border-bottom:1px solid #2e2e45;flex-shrink:0}
.dv4-pttl{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#5a5678;padding:9px 14px 5px;display:flex;align-items:center;justify-content:space-between}
/* props */
.dv4-prow{display:flex;align-items:center;gap:8px;padding:5px 14px}
.dv4-plbl{font-size:11px;color:#5a5678;width:62px;flex-shrink:0}
.dv4-pinp{flex:1;background:#141420;border:1.5px solid #2e2e45;color:#ede9fe;border-radius:6px;padding:4px 8px;font-size:11px;font-family:monospace;outline:none;transition:border-color .15s}
.dv4-pinp:focus{border-color:#8b5cf6}
.dv4-fval{font-size:10px;color:#a78bfa;font-family:monospace;padding:0 14px 6px}
/* listas */
.dv4-ptlist{flex:1;overflow-y:auto;padding:4px 8px}
.dv4-pti{display:flex;align-items:center;gap:7px;padding:5px 8px;border-radius:6px;cursor:pointer;transition:all .15s;margin-bottom:2px;border:1.5px solid transparent;font-size:11px}
.dv4-pti:hover{background:#1c1c2a}
.dv4-pti.on{background:rgba(139,92,246,.12);border-color:#8b5cf6}
.dv4-ptdot{width:7px;height:7px;border-radius:50%;background:#8b5cf6;flex-shrink:0}
.dv4-ptnm{font-weight:700;color:#a78bfa;font-family:monospace;width:26px;flex-shrink:0}
.dv4-ptco{font-size:10px;color:#5a5678;font-family:monospace;flex:1}
.dv4-ptdel{background:none;border:none;color:#3d3d58;cursor:pointer;font-size:11px;padding:1px 3px}
.dv4-ptdel:hover{color:#f87171}
.dv4-lnlist{overflow-y:auto;max-height:110px;padding:4px 8px}
.dv4-lni{display:flex;align-items:center;gap:5px;padding:4px 7px;border-radius:5px;font-size:10px;color:#9490b0;margin-bottom:2px;background:#141420;border:1px solid #2e2e45}
.dv4-lnbar{width:18px;height:2px;border-radius:1px;flex-shrink:0}
.dv4-lnlb{flex:1}
.dv4-lndel{background:none;border:none;color:#3d3d58;cursor:pointer;font-size:10px;padding:1px 3px}
.dv4-lndel:hover{color:#f87171}
/* vars */
.dv4-vlist{padding:6px 10px;display:flex;flex-wrap:wrap;gap:3px}
.dv4-vchip{background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.2);color:#a78bfa;border-radius:10px;padding:2px 7px;font-size:10px;font-family:monospace;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .12s}
.dv4-vchip:hover{background:rgba(139,92,246,.22);border-color:#8b5cf6}
/* guardados */
.dv4-slist{overflow-y:auto;max-height:90px;padding:4px 8px}
.dv4-si{display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;background:#141420;border:1.5px solid #2e2e45;cursor:pointer;font-size:11px;margin-bottom:3px;transition:all .15s}
.dv4-si:hover{background:#1c1c2a}
.dv4-sinm{font-weight:600;flex:1;color:#ede9fe;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv4-sdel{background:none;border:none;color:#3d3d58;cursor:pointer;font-size:10px;padding:1px 3px}
.dv4-sdel:hover{color:#f87171}
/* atajos */
.dv4-keys{padding:7px 14px;font-size:10px;color:#3d3d58;line-height:1.9;flex-shrink:0;border-top:1px solid #2e2e45}
.dv4-keys kbd{background:#141420;border:1px solid #2e2e45;border-radius:3px;padding:1px 4px;font-size:9px;color:#5a5678;font-family:monospace}
/* footer */
.dv4-foot{padding:8px 10px;border-top:1px solid #2e2e45;display:flex;flex-direction:column;gap:5px;flex-shrink:0}
.dv4-fbtn{width:100%;padding:8px;border-radius:7px;border:none;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px}
.dv4-fbtn.pri{background:#8b5cf6;color:#fff}.dv4-fbtn.pri:hover{filter:brightness(1.1)}
.dv4-fbtn.sec{background:#141420;color:#ede9fe;border:1.5px solid #3d3d58}.dv4-fbtn.sec:hover{background:#1c1c2a}
    `;
    document.head.appendChild(s);
  }

  // ════════════════════════════════════════════════════════════
  // BUILD UI
  // ════════════════════════════════════════════════════════════
  function _build() {
    _modal = document.createElement('div');
    _modal.id = 'dv4-modal';
    _modal.className = 'modal open';
    _modal.innerHTML = `
<div class="m-ov" id="dv4-ov"></div>
<div class="dv4-shell">

  <div class="dv4-hdr">
    <span style="font-size:18px">✏️</span>
    <span class="dv4-hdr-title">Editor de Patronaje</span>
    <input class="dv4-name-inp" id="dv4-nm" value="Mi Pieza" placeholder="Nombre de la pieza…">
    <div class="dv4-hdr-gap"></div>
    <span class="dv4-zoom-lbl" id="dv4-zlbl">100%</span>
    <button class="dv4-close-btn" id="dv4-x">✕ Cerrar</button>
  </div>

  <div class="dv4-tb">
    <button class="tb on" data-tool="select">▶ Seleccionar</button>
    <button class="tb" data-tool="addPoint">＋ Punto</button>
    <button class="tb" data-tool="addLine">╱ Línea recta</button>
    <button class="tb" data-tool="addCurve">⌒ Curva</button>
    <button class="tb" data-tool="addFold">— Doblez/Hilo</button>
    <div class="dv4-sep"></div>
    <button class="tb" id="tpl-rect">⬜ Rectángulo base</button>
    <div class="dv4-sep"></div>
    <button class="tb" id="dv4-zi">＋</button>
    <button class="tb" id="dv4-zo">－</button>
    <button class="tb" id="dv4-zf">⊡ Ajustar</button>
    <div class="dv4-sep"></div>
    <button class="tb red" id="dv4-clr">🗑 Limpiar todo</button>
    <button class="tb grn" id="dv4-sv">💾 Guardar</button>
    <button class="tb pri" id="dv4-ap">＋ Al patrón</button>
  </div>

  <div class="dv4-body">

    <div class="dv4-cvwrap sel" id="dv4-wrap">
      <svg id="dv4-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dv4-gsm" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="rgba(255,255,255,.035)" stroke-width=".5"/>
          </pattern>
          <pattern id="dv4-glg" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#dv4-gsm)"/>
            <path d="M100 0H0V100" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
          </pattern>
          <marker id="dv4-arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6"/>
          </marker>
        </defs>
        <g id="dv4-bg">
          <rect x="-9999" y="-9999" width="19998" height="19998" fill="url(#dv4-glg)"/>
        </g>
        <g id="dv4-ori">
          <line x1="-25" y1="0" x2="25" y2="0" stroke="rgba(139,92,246,.3)" stroke-width="1"/>
          <line x1="0" y1="-25" x2="0" y2="25" stroke="rgba(139,92,246,.3)" stroke-width="1"/>
          <circle cx="0" cy="0" r="2" fill="rgba(139,92,246,.5)"/>
        </g>
        <g id="dv4-cv">
          <g id="dv4-dims"></g>
          <g id="dv4-lines"></g>
          <g id="dv4-pts"></g>
        </g>
        <line id="dv4-tmp" x1="0" y1="0" x2="0" y2="0" stroke="#34d399" stroke-width="1" stroke-dasharray="6,3" opacity="0" pointer-events="none"/>
      </svg>
      <div id="dv4-instr">Selecciona una herramienta para comenzar</div>
      <div id="dv4-coord">x: 0mm · y: 0mm</div>
    </div>

    <div class="dv4-pnl">
      <div class="dv4-psec">
        <div class="dv4-pttl">Punto seleccionado <span id="dv4-selbadge" style="color:#a78bfa;font-family:monospace;font-weight:800">—</span></div>
        <div id="dv4-nosel" style="padding:10px 14px;font-size:11px;color:#5a5678">Haz clic en un punto para editarlo · Arrástralo para moverlo</div>
        <div id="dv4-pform" style="display:none">
          <div class="dv4-prow"><span class="dv4-plbl">Nombre</span><input class="dv4-pinp" id="dv4-pnm" placeholder="A, B, 1…" maxlength="4"></div>
          <div class="dv4-prow"><span class="dv4-plbl">X (mm)</span><input type="number" class="dv4-pinp" id="dv4-px" step="0.5"></div>
          <div class="dv4-prow"><span class="dv4-plbl">Y (mm)</span><input type="number" class="dv4-pinp" id="dv4-py" step="0.5"></div>
          <div class="dv4-prow"><span class="dv4-plbl">Fórmula</span><input class="dv4-pinp" id="dv4-pf" style="color:#a78bfa" placeholder="ej: B4, TALLE_ESP+10…"></div>
          <div class="dv4-fval" id="dv4-fval">—</div>
          <div class="dv4-prow" style="padding-bottom:10px"><button class="tb red" id="dv4-dpt" style="font-size:10px;padding:4px 10px">🗑 Eliminar punto</button></div>
        </div>
      </div>

      <div class="dv4-psec">
        <div class="dv4-pttl">Variables disponibles</div>
        <div class="dv4-vlist" id="dv4-vlist"></div>
      </div>

      <div class="dv4-psec" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
        <div class="dv4-pttl">Puntos <span id="dv4-ptcnt" style="color:#5a5678;font-weight:400">0</span></div>
        <div class="dv4-ptlist" id="dv4-ptlist"></div>
      </div>

      <div class="dv4-psec">
        <div class="dv4-pttl">Líneas / Curvas <span id="dv4-lncnt" style="color:#5a5678;font-weight:400">0</span></div>
        <div class="dv4-lnlist" id="dv4-lnlist"></div>
      </div>

      <div class="dv4-psec" style="max-height:105px;overflow:hidden;display:flex;flex-direction:column">
        <div class="dv4-pttl">Guardados</div>
        <div class="dv4-slist" id="dv4-slist"></div>
      </div>

      <div class="dv4-keys">
        <kbd>S</kbd> Sel &nbsp;<kbd>P</kbd> Punto &nbsp;<kbd>L</kbd> Línea &nbsp;
        <kbd>C</kbd> Curva &nbsp;<kbd>R</kbd> Rectángulo<br>
        <kbd>Esc</kbd> Cancelar &nbsp;<kbd>Del</kbd> Borrar punto seleccionado<br>
        <kbd>Rueda</kbd> Zoom &nbsp;<kbd>Alt+drag</kbd> o <kbd>Rueda botón</kbd> Pan
      </div>

      <div class="dv4-foot">
        <button class="dv4-fbtn pri" id="dv4-apb">＋ Agregar al patrón principal</button>
        <button class="dv4-fbtn sec" id="dv4-svb">💾 Guardar pieza</button>
      </div>
    </div>

  </div>
</div>`;
    document.body.appendChild(_modal);

    _svgEl   = document.getElementById('dv4-svg');
    _canvasG = document.getElementById('dv4-cv');
    _linesG  = document.getElementById('dv4-lines');
    _pointsG = document.getElementById('dv4-pts');
    _dimG    = document.getElementById('dv4-dims');

    // Centrar en canvas
    const wrap = document.getElementById('dv4-wrap');
    setTimeout(() => {
      _pan = { x: wrap.clientWidth / 2, y: wrap.clientHeight / 2 };
      _applyTransform();
    }, 50);

    _bindAll();
    _renderVars();
    _refreshSaved();
    _refreshPanel();
  }

  // ════════════════════════════════════════════════════════════
  // TRANSFORM
  // ════════════════════════════════════════════════════════════
  function _applyTransform() {
    const tf = `translate(${_pan.x},${_pan.y}) scale(${_zoom})`;
    _canvasG.setAttribute('transform', tf);
    document.getElementById('dv4-ori').setAttribute('transform', tf);
    document.getElementById('dv4-zlbl').textContent = Math.round(_zoom * 100) + '%';
  }

  function _svgPt(cx, cy) {
    const wrap = document.getElementById('dv4-wrap');
    const r = wrap.getBoundingClientRect();
    return {
      x: (cx - r.left - _pan.x) / _zoom,
      y: (cy - r.top  - _pan.y) / _zoom,
    };
  }

  function _px(mm) { return mm * PX_PER_MM; }
  function _mm(px) { return px / PX_PER_MM; }

  // ════════════════════════════════════════════════════════════
  // BIND
  // ════════════════════════════════════════════════════════════
  function _bindAll() {
    document.getElementById('dv4-ov').onclick = close;
    document.getElementById('dv4-x').onclick  = close;
    document.getElementById('dv4-nm').oninput = e => _pieceName = e.target.value;

    document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => _tool_(b.dataset.tool));

    document.getElementById('dv4-zi').onclick  = () => _doZoom(1.2);
    document.getElementById('dv4-zo').onclick  = () => _doZoom(0.83);
    document.getElementById('dv4-zf').onclick  = _fitView;
    document.getElementById('tpl-rect').onclick= _insertRect;
    document.getElementById('dv4-clr').onclick = () => { if (confirm('¿Limpiar todo?')) _clearAll(); };
    document.getElementById('dv4-sv').onclick  = _save;
    document.getElementById('dv4-svb').onclick = _save;
    document.getElementById('dv4-ap').onclick  = _addToPattern;
    document.getElementById('dv4-apb').onclick = _addToPattern;
    document.getElementById('dv4-dpt').onclick = _delSelected;

    document.getElementById('dv4-pnm').oninput = _applyProps;
    document.getElementById('dv4-px').oninput  = _applyProps;
    document.getElementById('dv4-py').oninput  = _applyProps;
    document.getElementById('dv4-pf').oninput  = _applyFormula;

    const wrap = document.getElementById('dv4-wrap');
    wrap.addEventListener('mousedown',  _mdown);
    wrap.addEventListener('mousemove',  _mmove);
    wrap.addEventListener('mouseup',    _mup);
    wrap.addEventListener('mouseleave', _mup);
    wrap.addEventListener('wheel', e => {
      e.preventDefault();
      const r = wrap.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const f = e.deltaY < 0 ? 1.12 : 0.89;
      _pan.x = mx - (mx - _pan.x) * f;
      _pan.y = my - (my - _pan.y) * f;
      _zoom  = Math.max(0.08, Math.min(10, _zoom * f));
      _applyTransform();
      _renderAll();
    }, { passive: false });

    document.addEventListener('keydown', _kdown);
  }

  // ════════════════════════════════════════════════════════════
  // MOUSE
  // ════════════════════════════════════════════════════════════
  function _mdown(e) {
    // Middle button or Alt = pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      _isPan = true;
      _panStart = { x: e.clientX - _pan.x, y: e.clientY - _pan.y };
      return;
    }
    const pt = _svgPt(e.clientX, e.clientY);
    const nearest = _nearest(pt, 16 / _zoom);

    if (_tool === 'addPoint') {
      _addPt(pt.x, pt.y); return;
    }
    if (_tool === 'addLine' || _tool === 'addCurve' || _tool === 'addFold') {
      if (nearest) {
        if (!_lnStart) { _lnStart = nearest; _renderAll(); _instr(`${_points[nearest].name} seleccionado. Clic en el punto final.`); }
        else if (nearest !== _lnStart) { _addLn(_lnStart, nearest, _tool); _lnStart = null; _renderAll(); _instr(_toolInstr()); }
        else { _lnStart = null; _renderAll(); }
      }
      return;
    }
    if (_tool === 'select') {
      if (nearest) {
        _select_(nearest);
        _dragging = nearest;
        const p = _points[nearest];
        _dragOff = { x: pt.x - p.x, y: pt.y - p.y };
      } else {
        _desel();
        _isPan = true;
        _panStart = { x: e.clientX - _pan.x, y: e.clientY - _pan.y };
      }
    }
  }

  function _mmove(e) {
    const pt = _svgPt(e.clientX, e.clientY);
    document.getElementById('dv4-coord').textContent = `x: ${Math.round(_mm(pt.x))}mm · y: ${Math.round(_mm(pt.y))}mm`;

    if (_isPan && _panStart) {
      _pan.x = e.clientX - _panStart.x;
      _pan.y = e.clientY - _panStart.y;
      _applyTransform(); return;
    }
    if (_dragging) {
      const p = _points[_dragging];
      p.x = pt.x - _dragOff.x;
      p.y = pt.y - _dragOff.y;
      p.formula = '';
      _renderAll();
      _updateForm(); return;
    }
    if (_lnStart && _points[_lnStart]) {
      const from = _points[_lnStart];
      const tl = document.getElementById('dv4-tmp');
      tl.setAttribute('x1', from.x); tl.setAttribute('y1', from.y);
      tl.setAttribute('x2', pt.x);   tl.setAttribute('y2', pt.y);
      tl.setAttribute('opacity', '1');
      tl.setAttribute('stroke', _tool === 'addFold' ? '#f87171' : '#34d399');
    } else {
      document.getElementById('dv4-tmp').setAttribute('opacity', '0');
    }
  }

  function _mup() {
    _isPan = false; _panStart = null; _dragging = null;
  }

  function _kdown(e) {
    if (!_modal?.classList.contains('open')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch(e.key) {
      case 's': case 'S': _tool_('select'); break;
      case 'p': case 'P': _tool_('addPoint'); break;
      case 'l': case 'L': _tool_('addLine'); break;
      case 'c': case 'C': _tool_('addCurve'); break;
      case 'r': case 'R': _insertRect(); break;
      case 'Escape': _lnStart = null; _tool_('select'); break;
      case 'Delete': case 'Backspace': if (_selected) _delSelected(); break;
    }
  }

  // ════════════════════════════════════════════════════════════
  // HERRAMIENTA
  // ════════════════════════════════════════════════════════════
  function _tool_(t) {
    _tool = t; _lnStart = null;
    document.getElementById('dv4-tmp').setAttribute('opacity', '0');
    document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    const wrap = document.getElementById('dv4-wrap');
    wrap.className = 'dv4-cvwrap' + (t === 'select' ? ' sel' : '');
    _instr(_toolInstr());
    _renderAll();
  }

  function _toolInstr() {
    return {
      select:   'Haz clic para seleccionar un punto · Arrástralo para moverlo',
      addPoint: 'Haz clic en el canvas para agregar un punto',
      addLine:  'Clic en punto A, luego en punto B — traza línea recta',
      addCurve: 'Clic en punto A, luego en punto B — traza curva',
      addFold:  'Clic en dos puntos — marca línea de doblez o hilo recto',
    }[_tool] || '';
  }

  function _instr(t) {
    const el = document.getElementById('dv4-instr');
    if (el) el.textContent = t;
  }

  // ════════════════════════════════════════════════════════════
  // PUNTOS
  // ════════════════════════════════════════════════════════════
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function _addPt(x, y, name, formula) {
    _ptCtr++;
    const id = 'p' + Date.now() + _ptCtr;
    const nm = name || (LETTERS[Object.keys(_points).length % 26] || String(_ptCtr));
    _points[id] = { x, y, name: nm, formula: formula || '' };
    _select_(id);
    _renderAll();
    return id;
  }

  function _nearest(svgPt, thresh) {
    let near = null, d = thresh;
    Object.entries(_points).forEach(([id,p]) => {
      const dist = Math.hypot(p.x - svgPt.x, p.y - svgPt.y);
      if (dist < d) { d = dist; near = id; }
    });
    return near;
  }

  function _select_(id) {
    _selected = id; _renderAll(); _updateForm();
  }

  function _desel() {
    _selected = null; _renderAll(); _updateForm();
  }

  function _delSelected() {
    if (!_selected) return;
    _lines = _lines.filter(l => l.from !== _selected && l.to !== _selected);
    delete _points[_selected];
    _selected = null;
    _renderAll(); _updateForm();
  }

  // ════════════════════════════════════════════════════════════
  // LÍNEAS
  // ════════════════════════════════════════════════════════════
  function _addLn(f, t, tool) {
    const type = tool === 'addCurve' ? 'curve' : tool === 'addFold' ? 'fold' : 'line';
    _lines.push({ from: f, to: t, type, ctrl: 30 });
    _renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // RECTÁNGULO BASE
  // ════════════════════════════════════════════════════════════
  function _insertRect() {
    const m = _getMeasures();
    const W = _px(m.bust / 4 * 10);
    const H = _px(m.backLength * 10);
    _clearAll(false);
    const A = _addPt(0, 0, 'A', '0');
    const B = _addPt(W, 0, 'B', 'B4');
    const C = _addPt(W, H, 'C', 'TALLE_ESP');
    const D = _addPt(0, H, 'D', 'TALLE_ESP');
    _lines = [
      { from:A, to:B, type:'line', ctrl:0 },
      { from:B, to:C, type:'line', ctrl:0 },
      { from:C, to:D, type:'line', ctrl:0 },
      { from:D, to:A, type:'fold', ctrl:0 },
    ];
    _pieceName = 'Rectángulo Base';
    document.getElementById('dv4-nm').value = _pieceName;
    _renderAll();
    _fitView();
    _tool_('addPoint');
    _instr(`Rectángulo B4×Talle (${Math.round(m.bust/4)}×${m.backLength}cm) creado. Agrega puntos sobre él.`);
  }

  function _clearAll(confirm_ = true) {
    if (confirm_ && !confirm('¿Limpiar todo el canvas?')) return;
    _points = {}; _lines = []; _ptCtr = 0; _selected = null; _lnStart = null;
    _renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  function _renderAll() {
    _renderLines();
    _renderPoints();
    _renderDims();
    _refreshPanel();
  }

  function _renderLines() {
    while (_linesG.firstChild) _linesG.removeChild(_linesG.firstChild);
    const sw = Math.max(0.5, 1.5 / _zoom);

    // Relleno del contorno
    let d = '';
    _lines.forEach((ln, i) => {
      const a = _points[ln.from], b = _points[ln.to];
      if (!a || !b) return;
      if (!d) d = `M ${a.x} ${a.y}`;
      if (ln.type === 'curve') {
        const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
        const ctrl = ln.ctrl / _zoom;
        d += ` Q ${mx-dy/len*ctrl} ${my+dx/len*ctrl} ${b.x} ${b.y}`;
      } else { d += ` L ${b.x} ${b.y}`; }
    });
    if (d) {
      const fill = document.createElementNS(NS,'path');
      fill.setAttribute('d', d);
      fill.setAttribute('fill','rgba(139,92,246,.05)');
      fill.setAttribute('stroke','none');
      fill.setAttribute('pointer-events','none');
      _linesG.appendChild(fill);
    }

    _lines.forEach(ln => {
      const a = _points[ln.from], b = _points[ln.to];
      if (!a || !b) return;
      let el;
      if (ln.type === 'curve') {
        const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
        const ctrl = ln.ctrl / _zoom;
        el = document.createElementNS(NS,'path');
        el.setAttribute('d',`M ${a.x} ${a.y} Q ${mx-dy/len*ctrl} ${my+dx/len*ctrl} ${b.x} ${b.y}`);
        el.setAttribute('stroke','#60a5fa');
        el.setAttribute('fill','none');
      } else {
        el = document.createElementNS(NS,'line');
        el.setAttribute('x1',a.x);el.setAttribute('y1',a.y);
        el.setAttribute('x2',b.x);el.setAttribute('y2',b.y);
        el.setAttribute('stroke', ln.type==='fold' ? '#f87171' : '#e2e8f0');
        if (ln.type==='fold') el.setAttribute('stroke-dasharray', `${8/_zoom},${4/_zoom}`);
      }
      el.setAttribute('stroke-width', sw);
      _linesG.appendChild(el);
    });
  }

  function _renderPoints() {
    while (_pointsG.firstChild) _pointsG.removeChild(_pointsG.firstChild);
    const r = Math.max(2.5, 4 / _zoom);
    const fs = Math.max(8, 11 / _zoom);

    Object.entries(_points).forEach(([id, p]) => {
      const g = document.createElementNS(NS,'g');
      g.id = 'dv4p-' + id;
      g.style.cursor = 'pointer';

      // Hit area invisible
      const hit = document.createElementNS(NS,'circle');
      hit.setAttribute('cx',p.x);hit.setAttribute('cy',p.y);
      hit.setAttribute('r', 14 / _zoom);
      hit.setAttribute('fill','transparent');
      g.appendChild(hit);

      // Círculo visible
      const c = document.createElementNS(NS,'circle');
      c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);c.setAttribute('r',r);
      c.setAttribute('fill', id===_selected ? '#fbbf24' : id===_lnStart ? '#34d399' : '#8b5cf6');
      c.setAttribute('stroke','#07070e');
      c.setAttribute('stroke-width', Math.max(0.5, 1.2/_zoom));
      g.appendChild(c);

      // Nombre
      const t = document.createElementNS(NS,'text');
      t.setAttribute('x', p.x + fs*0.6);
      t.setAttribute('y', p.y - fs*0.35);
      t.setAttribute('font-size', fs);
      t.setAttribute('fill', id===_selected ? '#fbbf24' : '#a78bfa');
      t.setAttribute('font-family','Arial');
      t.setAttribute('font-weight','bold');
      t.textContent = p.name;
      g.appendChild(t);

      // Fórmula pequeña debajo
      if (p.formula) {
        const ft = document.createElementNS(NS,'text');
        ft.setAttribute('x', p.x + fs*0.6);
        ft.setAttribute('y', p.y + fs*0.7);
        ft.setAttribute('font-size', fs*0.72);
        ft.setAttribute('fill','#3d3d58');
        ft.setAttribute('font-family','monospace');
        ft.textContent = p.formula;
        g.appendChild(ft);
      }

      _pointsG.appendChild(g);
    });
  }

  function _renderDims() {
    while (_dimG.firstChild) _dimG.removeChild(_dimG.firstChild);
    const fs = Math.max(7, 9/_zoom);

    _lines.filter(l => l.type === 'line').forEach(ln => {
      const a = _points[ln.from], b = _points[ln.to];
      if (!a || !b) return;
      const dist = Math.hypot(b.x-a.x, b.y-a.y);
      if (dist < 10) return;
      const mm = Math.round(_mm(dist));
      const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
      const dx=b.x-a.x, dy=b.y-a.y, len=dist||1;
      const OFF = 12 / _zoom;
      const t = document.createElementNS(NS,'text');
      t.setAttribute('x', mx - dy/len*OFF);
      t.setAttribute('y', my + dx/len*OFF);
      t.setAttribute('font-size', fs);
      t.setAttribute('fill','#3d3d58');
      t.setAttribute('font-family','monospace');
      t.setAttribute('text-anchor','middle');
      t.textContent = mm + 'mm';
      _dimG.appendChild(t);
    });
  }

  // ════════════════════════════════════════════════════════════
  // PANEL PROPS
  // ════════════════════════════════════════════════════════════
  function _updateForm() {
    const form = document.getElementById('dv4-pform');
    const nosel= document.getElementById('dv4-nosel');
    const badge= document.getElementById('dv4-selbadge');
    if (!_selected || !_points[_selected]) {
      form.style.display='none'; nosel.style.display=''; badge.textContent='—'; return;
    }
    const p = _points[_selected];
    form.style.display=''; nosel.style.display='none'; badge.textContent=p.name;
    document.getElementById('dv4-pnm').value = p.name;
    document.getElementById('dv4-px').value  = Math.round(_mm(p.x)*10)/10;
    document.getElementById('dv4-py').value  = Math.round(_mm(p.y)*10)/10;
    document.getElementById('dv4-pf').value  = p.formula || '';
    _updateFVal();
  }

  function _updateFVal() {
    const p = _selected && _points[_selected];
    if (!p || !p.formula) { document.getElementById('dv4-fval').textContent = '—'; return; }
    const v = _evalF(p.formula);
    document.getElementById('dv4-fval').textContent = v !== null ? `= ${Math.round(v)}mm` : '— fórmula inválida';
  }

  function _applyProps() {
    if (!_selected || !_points[_selected]) return;
    const p = _points[_selected];
    const nm = document.getElementById('dv4-pnm').value.trim().toUpperCase();
    const xmm= parseFloat(document.getElementById('dv4-px').value)||0;
    const ymm= parseFloat(document.getElementById('dv4-py').value)||0;
    if (nm) p.name = nm;
    p.x = _px(xmm); p.y = _px(ymm);
    _renderAll();
  }

  function _applyFormula() {
    if (!_selected || !_points[_selected]) return;
    const p = _points[_selected];
    p.formula = document.getElementById('dv4-pf').value.trim();
    const v = _evalF(p.formula);
    if (v !== null && p.formula) {
      // Aplicar la fórmula como dimensión (solo actualizar visual info)
      document.getElementById('dv4-fval').textContent = `= ${Math.round(v)}mm`;
    } else {
      document.getElementById('dv4-fval').textContent = '—';
    }
    _renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // REFRESH PANEL
  // ════════════════════════════════════════════════════════════
  function _refreshPanel() {
    const ptlist = document.getElementById('dv4-ptlist');
    const lnlist = document.getElementById('dv4-lnlist');
    if (!ptlist) return;

    // Puntos
    ptlist.innerHTML = '';
    document.getElementById('dv4-ptcnt').textContent = Object.keys(_points).length;
    Object.entries(_points).forEach(([id,p]) => {
      const div = document.createElement('div');
      div.className = 'dv4-pti' + (id===_selected?' on':'');
      div.innerHTML = `<div class="dv4-ptdot"></div><span class="dv4-ptnm">${p.name}</span><span class="dv4-ptco">${Math.round(_mm(p.x))}, ${Math.round(_mm(p.y))}mm</span>${p.formula?`<span style="font-size:9px;color:#a78bfa;font-family:monospace">${p.formula}</span>`:''}<button class="dv4-ptdel">✕</button>`;
      div.addEventListener('click', e => { if(e.target.classList.contains('dv4-ptdel'))return; _select_(id); });
      div.querySelector('.dv4-ptdel').addEventListener('click', () => {
        _lines = _lines.filter(l=>l.from!==id&&l.to!==id);
        delete _points[id]; if(_selected===id)_selected=null; _renderAll();
      });
      ptlist.appendChild(div);
    });

    // Líneas
    lnlist.innerHTML = '';
    document.getElementById('dv4-lncnt').textContent = _lines.length;
    _lines.forEach((ln,i) => {
      const a=_points[ln.from],b=_points[ln.to];if(!a||!b)return;
      const col = ln.type==='fold'?'#f87171':ln.type==='curve'?'#60a5fa':'#e2e8f0';
      const bg  = ln.type==='fold'?'repeating-linear-gradient(90deg,#f87171 0,#f87171 4px,transparent 4px,transparent 8px)':col;
      const div = document.createElement('div');
      div.className='dv4-lni';
      div.innerHTML=`<div class="dv4-lnbar" style="background:${bg}"></div><span class="dv4-lnlb">${a.name}→${b.name} <span style="color:#3d3d58">(${ln.type})</span></span><button class="dv4-lndel">✕</button>`;
      div.querySelector('.dv4-lndel').addEventListener('click',()=>{ _lines.splice(i,1);_renderAll(); });
      lnlist.appendChild(div);
    });
  }

  // ════════════════════════════════════════════════════════════
  // VARIABLES
  // ════════════════════════════════════════════════════════════
  function _renderVars() {
    const m = _getMeasures();
    const vars = [
      {k:'B4',v:Math.round(m.bust*10/4)},{k:'B6',v:Math.round(m.bust*10/6)},
      {k:'B8',v:Math.round(m.bust*10/8)},{k:'E2',v:Math.round(m.shoulder*10/2)},
      {k:'H4',v:Math.round(m.hip*10/4)},{k:'W4',v:Math.round(m.waist*10/4)},
      {k:'TALLE_ESP',v:m.backLength*10},{k:'TALLE_DEL',v:m.frontLength*10},
      {k:'LARGO',v:m.totalLength*10},{k:'MANGA',v:m.sleeveLength*10},
      {k:'CUELLO',v:m.neck*10},{k:'FALDA',v:m.skirtLength*10},
    ];
    const el = document.getElementById('dv4-vlist');
    if (!el) return;
    el.innerHTML = '';
    vars.forEach(v => {
      const sp = document.createElement('span');
      sp.className = 'dv4-vchip';
      sp.title = v.v + 'mm';
      sp.textContent = v.k;
      sp.onclick = () => {
        if (_selected && _points[_selected]) {
          _points[_selected].formula = v.k;
          document.getElementById('dv4-pf').value = v.k;
          document.getElementById('dv4-fval').textContent = `= ${v.v}mm`;
          _renderAll();
        }
      };
      el.appendChild(sp);
    });
  }

  // ════════════════════════════════════════════════════════════
  // ZOOM
  // ════════════════════════════════════════════════════════════
  function _doZoom(f) {
    const wrap = document.getElementById('dv4-wrap');
    const cx=wrap.clientWidth/2, cy=wrap.clientHeight/2;
    _pan.x = cx - (cx-_pan.x)*f;
    _pan.y = cy - (cy-_pan.y)*f;
    _zoom = Math.max(0.08, Math.min(10, _zoom*f));
    _applyTransform(); _renderAll();
  }

  function _fitView() {
    const keys = Object.keys(_points);
    if (!keys.length) return;
    const xs=keys.map(id=>_points[id].x),ys=keys.map(id=>_points[id].y);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const w=maxX-minX||200,h=maxY-minY||200;
    const wrap=document.getElementById('dv4-wrap');
    const PAD=80;
    _zoom=Math.min((wrap.clientWidth-PAD*2)/w,(wrap.clientHeight-PAD*2)/h,6);
    _pan.x=wrap.clientWidth/2-(minX+w/2)*_zoom;
    _pan.y=wrap.clientHeight/2-(minY+h/2)*_zoom;
    _applyTransform(); _renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // FÓRMULAS
  // ════════════════════════════════════════════════════════════
  function _getMeasures() {
    const def={bust:88,waist:68,hip:94,shoulder:38,neck:36,backLength:40,frontLength:42,totalLength:65,sleeveLength:60,skirtLength:60,hipDepth:20};
    const m={};
    document.querySelectorAll('[data-measure]').forEach(el=>{m[el.dataset.measure]=parseFloat(el.value)||0;});
    return Object.assign(def,m);
  }

  function _buildVars() {
    const m=_getMeasures();
    const b=m.bust*10,w=m.waist*10,h=m.hip*10,sh=m.shoulder*10,nk=m.neck*10;
    return {BUSTO:b,CINTURA:w,CADERA:h,ESPALDA:sh,CUELLO:nk,TALLE_ESP:m.backLength*10,TALLE_DEL:m.frontLength*10,LARGO:m.totalLength*10,MANGA:m.sleeveLength*10,FALDA:m.skirtLength*10,CADERA_PROF:m.hipDepth*10,B4:b/4,B6:b/6,B8:b/8,B10:b/10,B12:b/12,W4:w/4,H4:h/4,E2:sh/2};
  }

  function _evalF(expr) {
    if(!expr||expr==='0')return 0;
    const vars=_buildVars();
    let c=String(expr).trim();
    Object.entries(vars).forEach(([k,v])=>{c=c.replace(new RegExp('\\b'+k+'\\b','g'),v.toFixed(4));});
    if(!/^[\d\s+\-*/().]+$/.test(c))return null;
    try{return Function('"use strict";return('+c+')')();}catch(e){return null;}
  }

  // ════════════════════════════════════════════════════════════
  // GUARDAR / CARGAR
  // ════════════════════════════════════════════════════════════
  function _save() {
    const id=_curSave||('mv4_'+Date.now());
    const store=_loadStore();
    store[id]={id,name:_pieceName,points:JSON.parse(JSON.stringify(_points)),lines:JSON.parse(JSON.stringify(_lines)),ptCtr:_ptCtr,savedAt:new Date().toISOString()};
    localStorage.setItem(MK,JSON.stringify(store));
    _curSave=id;
    _refreshSaved();
    PAT.App.toast('💾 "'+_pieceName+'" guardado','success');
  }

  function _loadStore(){try{return JSON.parse(localStorage.getItem(MK)||'{}');}catch(e){return{};}}

  function _refreshSaved() {
    const list=document.getElementById('dv4-slist');if(!list)return;
    const store=_loadStore(),keys=Object.keys(store);
    list.innerHTML='';
    if(!keys.length){list.innerHTML='<div style="font-size:10px;color:#3d3d58;padding:4px">Sin guardados</div>';return;}
    keys.forEach(id=>{
      const item=store[id];
      const div=document.createElement('div');div.className='dv4-si';
      div.innerHTML=`<span class="dv4-sinm">${item.name}</span><button class="dv4-sdel">✕</button>`;
      div.addEventListener('click',e=>{
        if(e.target.classList.contains('dv4-sdel'))return;
        _points=JSON.parse(JSON.stringify(item.points));
        _lines=JSON.parse(JSON.stringify(item.lines));
        _ptCtr=item.ptCtr||0;_pieceName=item.name;_curSave=id;
        document.getElementById('dv4-nm').value=_pieceName;
        _selected=null;_lnStart=null;_renderAll();_fitView();
      });
      div.querySelector('.dv4-sdel').addEventListener('click',e=>{
        e.stopPropagation();if(!confirm('¿Eliminar "'+item.name+'"?'))return;
        delete store[id];localStorage.setItem(MK,JSON.stringify(store));_refreshSaved();
      });
      list.appendChild(div);
    });
  }

  // ════════════════════════════════════════════════════════════
  // AGREGAR AL PATRÓN PRINCIPAL
  // ════════════════════════════════════════════════════════════
  function _addToPattern() {
    if(!Object.keys(_points).length){PAT.App.toast('No hay puntos','error');return;}
    const svgNS='http://www.w3.org/2000/svg';
    const g=document.createElementNS(svgNS,'g');
    const xs=Object.values(_points).map(p=>p.x),ys=Object.values(_points).map(p=>p.y);
    const minX=Math.min(...xs),minY=Math.min(...ys),W=Math.max(...xs)-minX,H=Math.max(...ys)-minY;
    const gt=document.createElementNS(svgNS,'g');
    gt.setAttribute('transform',`translate(${-minX},${-minY})`);

    let d='';
    _lines.forEach((ln,i)=>{
      const a=_points[ln.from],b=_points[ln.to];if(!a||!b)return;
      if(!d)d=`M ${a.x} ${a.y}`;
      if(ln.type==='curve'){const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;d+=` Q ${mx-dy/len*ln.ctrl} ${my+dx/len*ln.ctrl} ${b.x} ${b.y}`;}
      else{d+=` L ${b.x} ${b.y}`;}
    });
    if(d){const f=document.createElementNS(svgNS,'path');f.setAttribute('d',d);f.setAttribute('fill','rgba(139,92,246,.05)');f.setAttribute('stroke','none');gt.appendChild(f);}

    _lines.forEach(ln=>{
      const a=_points[ln.from],b=_points[ln.to];if(!a||!b)return;
      if(ln.type==='curve'){
        const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
        const el=document.createElementNS(svgNS,'path');el.setAttribute('d',`M ${a.x} ${a.y} Q ${mx-dy/len*ln.ctrl} ${my+dx/len*ln.ctrl} ${b.x} ${b.y}`);el.setAttribute('stroke','#60a5fa');el.setAttribute('stroke-width','0.9');el.setAttribute('fill','none');gt.appendChild(el);
      }else{
        const el=document.createElementNS(svgNS,'line');el.setAttribute('x1',a.x);el.setAttribute('y1',a.y);el.setAttribute('x2',b.x);el.setAttribute('y2',b.y);el.setAttribute('stroke',ln.type==='fold'?'#f87171':'#e2e8f0');el.setAttribute('stroke-width','0.9');if(ln.type==='fold')el.setAttribute('stroke-dasharray','8,4');gt.appendChild(el);
      }
    });

    Object.entries(_points).forEach(([id,p])=>{
      const c=document.createElementNS(svgNS,'circle');c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);c.setAttribute('r','2.5');c.setAttribute('fill','#8b5cf6');gt.appendChild(c);
      const t=document.createElementNS(svgNS,'text');t.setAttribute('x',p.x+4);t.setAttribute('y',p.y-3);t.setAttribute('font-size','6');t.setAttribute('fill','#a78bfa');t.setAttribute('font-family','Arial');t.setAttribute('font-weight','bold');t.textContent=p.name;gt.appendChild(t);
    });

    const nt=document.createElementNS(svgNS,'text');nt.setAttribute('x',W/2);nt.setAttribute('y',H/2);nt.setAttribute('font-size','7');nt.setAttribute('fill','#ede9fe');nt.setAttribute('font-family','Arial');nt.setAttribute('font-weight','bold');nt.setAttribute('text-anchor','middle');nt.textContent=_pieceName;gt.appendChild(nt);
    g.appendChild(gt);

    const content=document.getElementById('pattern-content');
    if(!content){PAT.App.toast('SVG principal no encontrado','error');return;}
    let ox=30,oy=30;
    try{const eb=content.getBBox();if(eb.width>0)ox=eb.x+eb.width+35;}catch(e){}
    g.setAttribute('transform',`translate(${ox},${oy})`);
    g.setAttribute('class','manual-piece');
    content.appendChild(g);

    close();
    PAT.App.toast('✅ "'+_pieceName+'" agregado al patrón','success');
    if(PAT.App.fitScreen)setTimeout(PAT.App.fitScreen,120);
  }

  return { open, close };
})();
