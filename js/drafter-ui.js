/**
 * drafter-ui.js v5.0 — Editor Visual de Patronaje
 * Sistema de coordenadas unificado: todo en mm
 * Canvas transform = translate(pan) scale(zoom * SCALE)
 * donde SCALE = 2px/mm (a zoom 1x, 1mm = 2px en pantalla)
 */
'use strict';
window.PAT = window.PAT || {};

PAT.DrafterUI = (function () {
  const NS  = 'http://www.w3.org/2000/svg';
  const MK  = 'pat_v5';
  const SC  = 2; // px por mm a zoom 100%

  // ── Estado ─────────────────────────────────────────────────
  let _modal    = null;
  let _svgEl    = null;
  let _canvasG  = null; // g transformado (pan + zoom)
  let _gridG    = null;
  let _dimG     = null;
  let _linesG   = null;
  let _pointsG  = null;
  let _tempLine = null; // línea temporal DENTRO del canvas

  // Datos — todo en mm
  let _points   = {};  // id → { x, y, name, formula }
  let _lines    = [];  // { from, to, type, ctrl(mm) }
  let _ptCtr    = 0;

  // Interacción
  let _dragging = null;
  let _dragOff  = {x:0, y:0};
  let _tool     = 'select';
  let _lnStart  = null;
  let _pan      = {x:0, y:0};
  let _panStart = null;
  let _isPan    = false;
  let _zoom     = 1;
  let _selected = null;
  let _pieceName= 'Mi Pieza';
  let _curSave  = null;

  // ════════════════════════════════════════════════════════════
  function open() {
    if (_modal) { _modal.classList.add('open'); _renderVars(); _refreshSaved(); return; }
    _css(); _build();
  }
  function close() { if (_modal) _modal.classList.remove('open'); }

  // ════════════════════════════════════════════════════════════
  // CSS
  // ════════════════════════════════════════════════════════════
  function _css() {
    if (document.getElementById('dv5-css')) return;
    const s = document.createElement('style');
    s.id = 'dv5-css';
    s.textContent = `
#dv5-modal{z-index:700}
.dv5{position:relative;z-index:1;background:#090912;border:1px solid #3d3d58;border-radius:14px;
  width:min(1380px,99vw);height:min(960px,97vh);display:flex;flex-direction:column;
  box-shadow:0 40px 100px rgba(0,0,0,.98);overflow:hidden}
/* header */
.dv5-hdr{display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid #2e2e45;
  background:rgba(139,92,246,.07);flex-shrink:0}
.dv5-title{font-size:13px;font-weight:800;color:#ede9fe}
.dv5-nm{background:none;border:none;border-bottom:1.5px solid #3d3d58;color:#ede9fe;font-size:13px;
  font-weight:700;font-family:var(--font,'Segoe UI');outline:none;padding:2px 6px;min-width:200px;
  transition:border-color .15s}
.dv5-nm:focus{border-color:#8b5cf6}
.dv5-gap{flex:1}
.dv5-zl{font-size:11px;color:#5a5678;font-family:monospace;background:#141420;padding:3px 10px;
  border-radius:10px;border:1px solid #2e2e45}
.dv5-xbtn{background:#141420;border:1.5px solid #3d3d58;color:#9490b0;border-radius:7px;
  padding:5px 12px;cursor:pointer;font-size:12px;font-weight:600;font-family:var(--font,'Segoe UI');
  transition:all .15s}
.dv5-xbtn:hover{background:#2a2a3e;color:#ede9fe}
/* toolbar */
.dv5-tb{display:flex;align-items:center;gap:4px;padding:7px 12px;border-bottom:1px solid #2e2e45;
  background:#06060d;flex-shrink:0;flex-wrap:wrap}
.dv5-sep{width:1px;height:22px;background:#2e2e45;margin:0 5px}
.dv5-btn{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:7px;
  border:1.5px solid #2e2e45;background:#141420;color:#9490b0;cursor:pointer;font-size:11px;
  font-weight:600;font-family:var(--font,'Segoe UI');transition:all .15s;white-space:nowrap}
.dv5-btn:hover{background:#2a2a3e;color:#ede9fe;border-color:#3d3d58}
.dv5-btn.on{background:rgba(139,92,246,.18);color:#a78bfa;border-color:#8b5cf6}
.dv5-btn.red{border-color:rgba(248,113,113,.25);color:#f87171}
.dv5-btn.red:hover{background:rgba(248,113,113,.1)}
.dv5-btn.grn{border-color:rgba(52,211,153,.25);color:#34d399}
.dv5-btn.grn:hover{background:rgba(52,211,153,.1)}
.dv5-btn.pri{background:#8b5cf6;color:#fff;border-color:#8b5cf6}
.dv5-btn.pri:hover{filter:brightness(1.1)}
/* body */
.dv5-body{display:flex;flex:1;overflow:hidden;min-height:0}
/* canvas */
.dv5-cv{flex:1;position:relative;overflow:hidden;background:#06060c}
.dv5-cv.sel{cursor:default}
.dv5-cv.pt{cursor:crosshair}
.dv5-cv.ln{cursor:cell}
#dv5-svg{width:100%;height:100%;display:block;user-select:none}
/* overlays */
#dv5-instr{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);
  background:rgba(9,9,18,.92);border:1px solid #2e2e45;border-radius:20px;
  padding:6px 18px;font-size:12px;color:#9490b0;pointer-events:none;white-space:nowrap;backdrop-filter:blur(6px)}
#dv5-coord{position:absolute;top:10px;left:10px;font-size:10px;color:#3d3d58;font-family:monospace;
  background:rgba(6,6,12,.8);padding:3px 8px;border-radius:6px;pointer-events:none}
/* panel */
.dv5-pnl{width:270px;flex-shrink:0;border-left:1px solid #2e2e45;display:flex;flex-direction:column;overflow:hidden;background:#08080f}
.dv5-psec{border-bottom:1px solid #2e2e45;flex-shrink:0}
.dv5-ptl{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#5a5678;
  padding:9px 14px 5px;display:flex;align-items:center;justify-content:space-between}
.dv5-prow{display:flex;align-items:center;gap:8px;padding:5px 14px}
.dv5-plb{font-size:11px;color:#5a5678;width:62px;flex-shrink:0}
.dv5-pi{flex:1;background:#141420;border:1.5px solid #2e2e45;color:#ede9fe;border-radius:6px;
  padding:4px 8px;font-size:11px;font-family:monospace;outline:none;transition:border-color .15s}
.dv5-pi:focus{border-color:#8b5cf6}
.dv5-fv{font-size:10px;color:#a78bfa;font-family:monospace;padding:0 14px 8px}
/* listas */
.dv5-ptlist{flex:1;overflow-y:auto;padding:4px 8px}
.dv5-pti{display:flex;align-items:center;gap:7px;padding:5px 8px;border-radius:6px;
  cursor:pointer;transition:all .15s;margin-bottom:2px;border:1.5px solid transparent;font-size:11px}
.dv5-pti:hover{background:#1c1c2a}
.dv5-pti.on{background:rgba(139,92,246,.12);border-color:#8b5cf6}
.dv5-pdot{width:7px;height:7px;border-radius:50%;background:#8b5cf6;flex-shrink:0}
.dv5-pnm{font-weight:700;color:#a78bfa;font-family:monospace;width:26px;flex-shrink:0}
.dv5-pco{font-size:10px;color:#5a5678;font-family:monospace;flex:1}
.dv5-pdel,.dv5-ldel{background:none;border:none;color:#3d3d58;cursor:pointer;font-size:11px;padding:1px 3px}
.dv5-pdel:hover,.dv5-ldel:hover{color:#f87171}
.dv5-lnlist{overflow-y:auto;max-height:110px;padding:4px 8px}
.dv5-lni{display:flex;align-items:center;gap:5px;padding:4px 7px;border-radius:5px;font-size:10px;
  color:#9490b0;margin-bottom:2px;background:#141420;border:1px solid #2e2e45}
.dv5-lbar{width:18px;height:2px;border-radius:1px;flex-shrink:0}
.dv5-llb{flex:1}
/* vars */
.dv5-vl{padding:6px 10px;display:flex;flex-wrap:wrap;gap:3px}
.dv5-vc{background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.2);color:#a78bfa;border-radius:10px;
  padding:2px 7px;font-size:10px;font-family:monospace;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .12s}
.dv5-vc:hover{background:rgba(139,92,246,.22);border-color:#8b5cf6}
/* guardados */
.dv5-sl{overflow-y:auto;max-height:90px;padding:4px 8px}
.dv5-si{display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;background:#141420;
  border:1.5px solid #2e2e45;cursor:pointer;font-size:11px;margin-bottom:3px;transition:all .15s}
.dv5-si:hover{background:#1c1c2a}
.dv5-snm{font-weight:600;flex:1;color:#ede9fe;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv5-sdel{background:none;border:none;color:#3d3d58;cursor:pointer;font-size:10px;padding:1px 3px}
.dv5-sdel:hover{color:#f87171}
/* keys */
.dv5-keys{padding:7px 14px;font-size:10px;color:#3d3d58;line-height:1.9;flex-shrink:0;border-top:1px solid #2e2e45}
.dv5-keys kbd{background:#141420;border:1px solid #2e2e45;border-radius:3px;padding:1px 4px;font-size:9px;color:#5a5678;font-family:monospace}
/* footer */
.dv5-ft{padding:8px 10px;border-top:1px solid #2e2e45;display:flex;flex-direction:column;gap:5px;flex-shrink:0}
.dv5-fb{width:100%;padding:8px;border-radius:7px;border:none;font-size:11px;font-weight:600;
  cursor:pointer;font-family:var(--font,'Segoe UI');transition:all .15s;
  display:flex;align-items:center;justify-content:center;gap:6px}
.dv5-fb.pri{background:#8b5cf6;color:#fff}.dv5-fb.pri:hover{filter:brightness(1.1)}
.dv5-fb.sec{background:#141420;color:#ede9fe;border:1.5px solid #3d3d58}.dv5-fb.sec:hover{background:#1c1c2a}
    `;
    document.head.appendChild(s);
  }

  // ════════════════════════════════════════════════════════════
  // BUILD UI
  // ════════════════════════════════════════════════════════════
  function _build() {
    _modal = document.createElement('div');
    _modal.id = 'dv5-modal';
    _modal.className = 'modal open';
    _modal.innerHTML = `
<div class="m-ov" id="dv5-ov"></div>
<div class="dv5">

  <div class="dv5-hdr">
    <span style="font-size:18px">✏️</span>
    <span class="dv5-title">Editor de Patronaje</span>
    <input class="dv5-nm" id="dv5-nm" value="Mi Pieza" placeholder="Nombre de la pieza…">
    <div class="dv5-gap"></div>
    <span class="dv5-zl" id="dv5-zl">100%</span>
    <button class="dv5-xbtn" id="dv5-x">✕ Cerrar</button>
  </div>

  <div class="dv5-tb">
    <button class="dv5-btn on" data-tool="select">▶ Seleccionar <kbd style="font-size:9px;background:#0a0a14;border:1px solid #2e2e45;border-radius:3px;padding:1px 4px;color:#5a5678">S</kbd></button>
    <button class="dv5-btn" data-tool="addPoint">＋ Punto <kbd style="font-size:9px;background:#0a0a14;border:1px solid #2e2e45;border-radius:3px;padding:1px 4px;color:#5a5678">P</kbd></button>
    <button class="dv5-btn" data-tool="addLine">╱ Línea recta <kbd style="font-size:9px;background:#0a0a14;border:1px solid #2e2e45;border-radius:3px;padding:1px 4px;color:#5a5678">L</kbd></button>
    <button class="dv5-btn" data-tool="addCurve">⌒ Curva <kbd style="font-size:9px;background:#0a0a14;border:1px solid #2e2e45;border-radius:3px;padding:1px 4px;color:#5a5678">C</kbd></button>
    <button class="dv5-btn" data-tool="addFold">— Doblez <kbd style="font-size:9px;background:#0a0a14;border:1px solid #2e2e45;border-radius:3px;padding:1px 4px;color:#5a5678">F</kbd></button>
    <div class="dv5-sep"></div>
    <button class="dv5-btn" id="dv5-rect">⬜ Rectángulo base <kbd style="font-size:9px;background:#0a0a14;border:1px solid #2e2e45;border-radius:3px;padding:1px 4px;color:#5a5678">R</kbd></button>
    <div class="dv5-sep"></div>
    <button class="dv5-btn" id="dv5-zi">＋</button>
    <button class="dv5-btn" id="dv5-zo">－</button>
    <button class="dv5-btn" id="dv5-zf">⊡ Ajustar</button>
    <div class="dv5-sep"></div>
    <button class="dv5-btn red" id="dv5-clr">🗑 Limpiar</button>
    <button class="dv5-btn grn" id="dv5-sv">💾 Guardar</button>
    <button class="dv5-btn pri" id="dv5-ap">＋ Al patrón</button>
  </div>

  <div class="dv5-body">

    <!-- ══ CANVAS ══ -->
    <div class="dv5-cv sel" id="dv5-wrap">
      <svg id="dv5-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Grilla pequeña: 1mm -->
          <pattern id="dv5-g1" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M1 0H0V1" fill="none" stroke="rgba(255,255,255,.06)" stroke-width=".05"/>
          </pattern>
          <!-- Grilla grande: 10mm -->
          <pattern id="dv5-g10" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="url(#dv5-g1)"/>
            <path d="M10 0H0V10" fill="none" stroke="rgba(255,255,255,.12)" stroke-width=".1"/>
          </pattern>
          <!-- Grilla 100mm -->
          <pattern id="dv5-g100" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#dv5-g10)"/>
            <path d="M100 0H0V100" fill="none" stroke="rgba(139,92,246,.25)" stroke-width=".2"/>
          </pattern>
          <marker id="dv5-arr" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#8b5cf6"/>
          </marker>
        </defs>

        <!-- Todo el contenido está dentro de este grupo transformado -->
        <g id="dv5-canvas">
          <!-- Grilla de fondo -->
          <rect id="dv5-grid" x="-9999" y="-9999" width="19998" height="19998" fill="url(#dv5-g100)"/>
          <!-- Ejes (origen 0,0) -->
          <g id="dv5-axes">
            <line x1="-500" y1="0" x2="500" y2="0" stroke="rgba(139,92,246,.3)" stroke-width=".2"/>
            <line x1="0" y1="-500" x2="0" y2="500" stroke="rgba(139,92,246,.3)" stroke-width=".2"/>
            <circle cx="0" cy="0" r="1.5" fill="rgba(139,92,246,.6)"/>
          </g>
          <!-- Dimensiones -->
          <g id="dv5-dims"></g>
          <!-- Líneas del patrón -->
          <g id="dv5-lines"></g>
          <!-- Puntos del patrón -->
          <g id="dv5-pts"></g>
          <!-- Línea temporal (DENTRO del canvas) -->
          <line id="dv5-tmp" x1="0" y1="0" x2="0" y2="0"
            stroke="#34d399" stroke-width=".5" stroke-dasharray="3,1.5" opacity="0" pointer-events="none"/>
        </g>
      </svg>
      <div id="dv5-instr">▶ Seleccionar activo — haz clic en un punto para editarlo</div>
      <div id="dv5-coord">x: 0mm · y: 0mm</div>
    </div>

    <!-- ══ PANEL DERECHO ══ -->
    <div class="dv5-pnl">

      <div class="dv5-psec">
        <div class="dv5-ptl">Punto seleccionado <span id="dv5-badge" style="color:#a78bfa;font-family:monospace;font-weight:800">—</span></div>
        <div id="dv5-nosel" style="padding:10px 14px;font-size:11px;color:#5a5678">
          Clic en un punto para editarlo<br>Arrástralo para moverlo
        </div>
        <div id="dv5-pform" style="display:none">
          <div class="dv5-prow"><span class="dv5-plb">Nombre</span><input class="dv5-pi" id="dv5-pnm" placeholder="A, B, 1, 2A…" maxlength="4"></div>
          <div class="dv5-prow"><span class="dv5-plb">X (mm)</span><input type="number" class="dv5-pi" id="dv5-px" step="0.5"></div>
          <div class="dv5-prow"><span class="dv5-plb">Y (mm)</span><input type="number" class="dv5-pi" id="dv5-py" step="0.5"></div>
          <div class="dv5-prow"><span class="dv5-plb">Fórmula</span><input class="dv5-pi" id="dv5-pf" style="color:#a78bfa" placeholder="B4, TALLE_ESP+10…"></div>
          <div class="dv5-fv" id="dv5-fv">—</div>
          <div class="dv5-prow" style="padding-bottom:10px">
            <button class="dv5-btn red" id="dv5-dpt" style="font-size:10px;padding:4px 10px;width:100%">🗑 Eliminar punto</button>
          </div>
        </div>
      </div>

      <div class="dv5-psec">
        <div class="dv5-ptl">Variables de medidas</div>
        <div class="dv5-vl" id="dv5-vl"></div>
      </div>

      <div class="dv5-psec" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
        <div class="dv5-ptl">Puntos <span id="dv5-ptcnt" style="color:#5a5678;font-weight:400">0</span></div>
        <div class="dv5-ptlist" id="dv5-ptlist"></div>
      </div>

      <div class="dv5-psec">
        <div class="dv5-ptl">Líneas / Curvas <span id="dv5-lncnt" style="color:#5a5678;font-weight:400">0</span></div>
        <div class="dv5-lnlist" id="dv5-lnlist"></div>
      </div>

      <div class="dv5-psec" style="max-height:100px;overflow:hidden;display:flex;flex-direction:column">
        <div class="dv5-ptl">Guardados</div>
        <div class="dv5-sl" id="dv5-sl"></div>
      </div>

      <div class="dv5-keys">
        <kbd>S</kbd> Seleccionar &nbsp;<kbd>P</kbd> Punto &nbsp;<kbd>L</kbd> Línea<br>
        <kbd>C</kbd> Curva &nbsp;<kbd>F</kbd> Doblez &nbsp;<kbd>R</kbd> Rectángulo<br>
        <kbd>Esc</kbd> Cancelar &nbsp;<kbd>Del</kbd> Borrar punto<br>
        <kbd>Rueda</kbd> Zoom &nbsp;<kbd>Alt+drag</kbd> Mover vista
      </div>

      <div class="dv5-ft">
        <button class="dv5-fb pri" id="dv5-apb">＋ Agregar al patrón principal</button>
        <button class="dv5-fb sec" id="dv5-svb">💾 Guardar pieza</button>
      </div>

    </div>
  </div>
</div>`;

    document.body.appendChild(_modal);

    _svgEl   = document.getElementById('dv5-svg');
    _canvasG = document.getElementById('dv5-canvas');
    _gridG   = document.getElementById('dv5-grid');
    _dimG    = document.getElementById('dv5-dims');
    _linesG  = document.getElementById('dv5-lines');
    _pointsG = document.getElementById('dv5-pts');
    _tempLine= document.getElementById('dv5-tmp');

    // Centrar el canvas en el origen
    const wrap = document.getElementById('dv5-wrap');
    setTimeout(() => {
      _pan = { x: wrap.clientWidth * 0.4, y: wrap.clientHeight * 0.3 };
      _zoom = 1;
      _applyTransform();
    }, 30);

    _bindAll();
    _renderVars();
    _refreshSaved();
    _renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // TRANSFORM — coordenadas en mm, canvas en (pan + zoom*SC)
  // ════════════════════════════════════════════════════════════
  function _applyTransform() {
    // SC = 2: a zoom=1, 1mm = 2px en pantalla
    const tf = `translate(${_pan.x},${_pan.y}) scale(${_zoom * SC})`;
    _canvasG.setAttribute('transform', tf);
    document.getElementById('dv5-zl').textContent = Math.round(_zoom * 100) + '%';
  }

  // Convierte coordenadas de pantalla → mm del canvas
  function _screenToMm(clientX, clientY) {
    const wrap = document.getElementById('dv5-wrap');
    const r = wrap.getBoundingClientRect();
    const sx = clientX - r.left;
    const sy = clientY - r.top;
    return {
      x: (sx - _pan.x) / (_zoom * SC),
      y: (sy - _pan.y) / (_zoom * SC),
    };
  }

  // ════════════════════════════════════════════════════════════
  // BIND EVENTOS
  // ════════════════════════════════════════════════════════════
  function _bindAll() {
    document.getElementById('dv5-ov').onclick = close;
    document.getElementById('dv5-x').onclick  = close;
    document.getElementById('dv5-nm').oninput = e => _pieceName = e.target.value;

    document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => _setTool(b.dataset.tool));

    document.getElementById('dv5-zi').onclick   = () => _doZoom(1.25);
    document.getElementById('dv5-zo').onclick   = () => _doZoom(0.8);
    document.getElementById('dv5-zf').onclick   = _fitView;
    document.getElementById('dv5-rect').onclick = _insertRect;
    document.getElementById('dv5-clr').onclick  = () => { if (confirm('¿Limpiar todo el canvas?')) _clearAll(); };
    document.getElementById('dv5-sv').onclick   = _save;
    document.getElementById('dv5-svb').onclick  = _save;
    document.getElementById('dv5-ap').onclick   = _addToPattern;
    document.getElementById('dv5-apb').onclick  = _addToPattern;
    document.getElementById('dv5-dpt').onclick  = _delSelected;

    document.getElementById('dv5-pnm').oninput = _applyProps;
    document.getElementById('dv5-px').oninput  = _applyProps;
    document.getElementById('dv5-py').oninput  = _applyProps;
    document.getElementById('dv5-pf').oninput  = _applyFormula;

    const wrap = document.getElementById('dv5-wrap');
    wrap.addEventListener('mousedown',  _mdown);
    wrap.addEventListener('mousemove',  _mmove);
    wrap.addEventListener('mouseup',    _mup);
    wrap.addEventListener('mouseleave', _mup);
    wrap.addEventListener('wheel', e => {
      e.preventDefault();
      const r = wrap.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const f = e.deltaY < 0 ? 1.12 : 0.89;
      _pan.x = mx - (mx - _pan.x) * f;
      _pan.y = my - (my - _pan.y) * f;
      _zoom  = Math.max(0.05, Math.min(20, _zoom * f));
      _applyTransform();
    }, { passive: false });

    document.addEventListener('keydown', _kdown);
  }

  // ════════════════════════════════════════════════════════════
  // MOUSE
  // ════════════════════════════════════════════════════════════
  function _mdown(e) {
    const mm = _screenToMm(e.clientX, e.clientY);

    // Alt+drag o botón medio = pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      _isPan = true;
      _panStart = { x: e.clientX - _pan.x, y: e.clientY - _pan.y };
      return;
    }

    // Umbral en mm para detectar clic sobre un punto (8px en pantalla → mm)
    const threshMm = 8 / (_zoom * SC);
    const near = _nearest(mm, threshMm);

    if (_tool === 'addPoint') {
      // Si hay punto cercano, no duplicar — seleccionar ese
      if (near) { _selectPt(near); }
      else { _addPt(mm.x, mm.y); }
      return;
    }

    if (_tool === 'addLine' || _tool === 'addCurve' || _tool === 'addFold') {
      if (!near) {
        _instr('⚠️ Haz clic exactamente sobre un punto existente (marcado en morado)');
        return;
      }
      if (!_lnStart) {
        // Primer punto
        _lnStart = near;
        _renderAll();
        _instr(`✓ Punto ${_points[near].name} seleccionado (verde). Ahora haz clic en el punto final.`);
      } else {
        // Segundo punto
        if (near !== _lnStart) {
          _addLn(_lnStart, near, _tool);
          _instr(`✓ ${_tool === 'addCurve' ? 'Curva' : _tool === 'addFold' ? 'Doblez' : 'Línea'} trazada: ${_points[_lnStart].name} → ${_points[near].name}`);
        }
        _lnStart = null;
        _renderAll();
      }
      return;
    }

    if (_tool === 'select') {
      if (near) {
        _selectPt(near);
        _dragging = near;
        _dragOff = { x: mm.x - _points[near].x, y: mm.y - _points[near].y };
      } else {
        _deselectPt();
        _isPan = true;
        _panStart = { x: e.clientX - _pan.x, y: e.clientY - _pan.y };
      }
    }
  }

  function _mmove(e) {
    const mm = _screenToMm(e.clientX, e.clientY);
    document.getElementById('dv5-coord').textContent =
      `x: ${Math.round(mm.x)}mm · y: ${Math.round(mm.y)}mm`;

    if (_isPan && _panStart) {
      _pan.x = e.clientX - _panStart.x;
      _pan.y = e.clientY - _panStart.y;
      _applyTransform();
      return;
    }

    if (_dragging && _points[_dragging]) {
      const p = _points[_dragging];
      p.x = mm.x - _dragOff.x;
      p.y = mm.y - _dragOff.y;
      p.formula = '';
      _renderAll();
      _updateForm();
      return;
    }

    // Línea temporal — en coordenadas mm (dentro del canvas transformado)
    if (_lnStart && _points[_lnStart]) {
      const from = _points[_lnStart];
      _tempLine.setAttribute('x1', from.x);
      _tempLine.setAttribute('y1', from.y);
      _tempLine.setAttribute('x2', mm.x);
      _tempLine.setAttribute('y2', mm.y);
      _tempLine.setAttribute('opacity', '1');
      const col = _tool === 'addFold' ? '#f87171' : _tool === 'addCurve' ? '#60a5fa' : '#34d399';
      _tempLine.setAttribute('stroke', col);
    } else {
      _tempLine.setAttribute('opacity', '0');
    }

    // Resaltar punto cercano
    const threshMm = 8 / (_zoom * SC);
    const near = _nearest(mm, threshMm);
    document.getElementById('dv5-wrap').style.cursor =
      near && _tool !== 'select' ? 'pointer' : (_tool === 'select' ? 'default' : 'crosshair');
  }

  function _mup() {
    _isPan = false; _panStart = null; _dragging = null;
  }

  function _kdown(e) {
    if (!_modal?.classList.contains('open')) return;
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    switch(e.key) {
      case 's': case 'S': _setTool('select'); break;
      case 'p': case 'P': _setTool('addPoint'); break;
      case 'l': case 'L': _setTool('addLine'); break;
      case 'c': case 'C': _setTool('addCurve'); break;
      case 'f': case 'F': _setTool('addFold'); break;
      case 'r': case 'R': _insertRect(); break;
      case 'Escape':
        _lnStart = null; _tempLine.setAttribute('opacity','0');
        _setTool('select'); break;
      case 'Delete': case 'Backspace': if (_selected) _delSelected(); break;
    }
  }

  // ════════════════════════════════════════════════════════════
  // HERRAMIENTAS
  // ════════════════════════════════════════════════════════════
  function _setTool(t) {
    _tool = t;
    _lnStart = null;
    _tempLine.setAttribute('opacity', '0');
    document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    const wrap = document.getElementById('dv5-wrap');
    wrap.className = 'dv5-cv' + (t==='select'?' sel':t==='addPoint'?' pt':' ln');
    const msgs = {
      select:   '▶ Clic en un punto para seleccionarlo · Arrástralo para moverlo · Alt+drag para mover la vista',
      addPoint: '＋ Haz clic en el canvas para agregar un punto',
      addLine:  '╱ Clic en el punto A → luego clic en el punto B para trazar línea recta',
      addCurve: '⌒ Clic en el punto A → luego clic en el punto B para trazar curva suavizada',
      addFold:  '— Clic en el punto A → luego clic en el punto B para marcar doblez o hilo',
    };
    _instr(msgs[t] || '');
    _renderAll();
  }

  function _instr(t) {
    const el = document.getElementById('dv5-instr');
    if (el) el.textContent = t;
  }

  // ════════════════════════════════════════════════════════════
  // PUNTOS — coordenadas en mm
  // ════════════════════════════════════════════════════════════
  const ALFA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function _addPt(xMm, yMm, name, formula) {
    _ptCtr++;
    const id = 'pt' + Date.now() + _ptCtr;
    const nm = name || (ALFA[Object.keys(_points).length % 26] || String(_ptCtr));
    _points[id] = { x: xMm, y: yMm, name: nm, formula: formula || '' };
    _selectPt(id);
    _renderAll();
    return id;
  }

  function _nearest(mmPt, threshMm) {
    let near = null, d = threshMm;
    Object.entries(_points).forEach(([id, p]) => {
      const dist = Math.hypot(p.x - mmPt.x, p.y - mmPt.y);
      if (dist < d) { d = dist; near = id; }
    });
    return near;
  }

  function _selectPt(id) {
    _selected = id;
    _renderAll();
    _updateForm();
  }

  function _deselectPt() {
    _selected = null;
    _renderAll();
    _updateForm();
  }

  function _delSelected() {
    if (!_selected) return;
    _lines = _lines.filter(l => l.from !== _selected && l.to !== _selected);
    delete _points[_selected];
    _selected = null;
    _lnStart = null;
    _tempLine.setAttribute('opacity', '0');
    _renderAll();
    _updateForm();
  }

  // ════════════════════════════════════════════════════════════
  // LÍNEAS — coordenadas en mm
  // ════════════════════════════════════════════════════════════
  function _addLn(fromId, toId, tool) {
    const type = tool === 'addCurve' ? 'curve'
               : tool === 'addFold'  ? 'fold'
               : 'line';
    // ctrl en mm — curvatura perpendicular fija (15mm por defecto)
    _lines.push({ from: fromId, to: toId, type, ctrl: 15 });
    _renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // RECTÁNGULO BASE
  // ════════════════════════════════════════════════════════════
  function _insertRect() {
    const m = _getMeasures();
    const W = m.bust / 4 * 10;     // B4 en mm = bust_cm/4 * 10
    const H = m.backLength * 10;   // TALLE_ESP en mm

    _clearAll();

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
    document.getElementById('dv5-nm').value = _pieceName;

    _renderAll();
    _fitView();
    _setTool('addPoint');
    _instr(`⬜ Rectángulo ${Math.round(W)}×${Math.round(H)}mm creado. Agrega puntos sobre él con [P].`);
  }

  function _clearAll() {
    _points = {}; _lines = []; _ptCtr = 0;
    _selected = null; _lnStart = null;
    _tempLine.setAttribute('opacity', '0');
    _renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // RENDER — coordenadas mm, el canvas transform se encarga de escalar
  // ════════════════════════════════════════════════════════════
  function _renderAll() {
    _renderLines();
    _renderPoints();
    _renderDims();
    _refreshPanel();
  }

  function _renderLines() {
    while (_linesG.firstChild) _linesG.removeChild(_linesG.firstChild);

    // Relleno del contorno (primer recorrido)
    let d = '';
    _lines.forEach(ln => {
      const a = _points[ln.from], b = _points[ln.to];
      if (!a || !b) return;
      if (!d) d = `M ${a.x} ${a.y}`;
      if (ln.type === 'curve') {
        const { cpx, cpy } = _curveCP(a, b, ln.ctrl);
        d += ` Q ${cpx} ${cpy} ${b.x} ${b.y}`;
      } else {
        d += ` L ${b.x} ${b.y}`;
      }
    });
    if (d) {
      const fill = document.createElementNS(NS, 'path');
      fill.setAttribute('d', d);
      fill.setAttribute('fill', 'rgba(139,92,246,.06)');
      fill.setAttribute('stroke', 'none');
      fill.setAttribute('pointer-events', 'none');
      _linesG.appendChild(fill);
    }

    // Líneas reales
    _lines.forEach(ln => {
      const a = _points[ln.from], b = _points[ln.to];
      if (!a || !b) return;
      const sw = 0.5; // en mm (el zoom escala esto automáticamente)

      if (ln.type === 'curve') {
        const { cpx, cpy } = _curveCP(a, b, ln.ctrl);
        const el = document.createElementNS(NS, 'path');
        el.setAttribute('d', `M ${a.x} ${a.y} Q ${cpx} ${cpy} ${b.x} ${b.y}`);
        el.setAttribute('stroke', '#60a5fa');
        el.setAttribute('stroke-width', sw);
        el.setAttribute('fill', 'none');
        _linesG.appendChild(el);
      } else {
        const el = document.createElementNS(NS, 'line');
        el.setAttribute('x1', a.x); el.setAttribute('y1', a.y);
        el.setAttribute('x2', b.x); el.setAttribute('y2', b.y);
        el.setAttribute('stroke', ln.type === 'fold' ? '#f87171' : '#e2e8f0');
        el.setAttribute('stroke-width', sw);
        if (ln.type === 'fold') {
          el.setAttribute('stroke-dasharray', '3,1.5'); // en mm
        }
        _linesG.appendChild(el);
      }
    });
  }

  // Calcula el punto de control de una curva cuadrática
  // ctrl en mm = desplazamiento perpendicular desde el punto medio
  function _curveCP(a, b, ctrlMm) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    // Vector perpendicular unitario * ctrl
    const cpx = mx - (dy / len) * ctrlMm;
    const cpy = my + (dx / len) * ctrlMm;
    return { cpx, cpy };
  }

  function _renderPoints() {
    while (_pointsG.firstChild) _pointsG.removeChild(_pointsG.firstChild);

    // Tamaños en mm (se escalan con el zoom automáticamente)
    const r   = 2;    // radio del punto en mm
    const fs  = 5;    // font-size en mm
    const hit = 5;    // radio del área clickeable en mm

    Object.entries(_points).forEach(([id, p]) => {
      const g = document.createElementNS(NS, 'g');
      g.id = 'pt-' + id;
      g.style.cursor = _tool === 'select' ? 'pointer' : 'crosshair';

      // Área de hit invisible (más grande que el punto visual)
      const hc = document.createElementNS(NS, 'circle');
      hc.setAttribute('cx', p.x); hc.setAttribute('cy', p.y);
      hc.setAttribute('r', hit);
      hc.setAttribute('fill', 'transparent');
      hc.setAttribute('stroke', 'none');
      g.appendChild(hc);

      // Círculo visible
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
      c.setAttribute('r', r);
      const isSelected = id === _selected;
      const isStart    = id === _lnStart;
      c.setAttribute('fill',   isSelected ? '#fbbf24' : isStart ? '#34d399' : '#8b5cf6');
      c.setAttribute('stroke', '#06060c');
      c.setAttribute('stroke-width', '0.3');
      g.appendChild(c);

      // Nombre del punto
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', p.x + r * 1.5);
      t.setAttribute('y', p.y - r * 0.8);
      t.setAttribute('font-size', fs);
      t.setAttribute('fill', isSelected ? '#fbbf24' : '#a78bfa');
      t.setAttribute('font-family', 'Arial');
      t.setAttribute('font-weight', 'bold');
      t.textContent = p.name;
      g.appendChild(t);

      // Etiqueta de fórmula (más pequeña, debajo)
      if (p.formula) {
        const ft = document.createElementNS(NS, 'text');
        ft.setAttribute('x', p.x + r * 1.5);
        ft.setAttribute('y', p.y + fs * 0.85);
        ft.setAttribute('font-size', fs * 0.72);
        ft.setAttribute('fill', '#3d3d58');
        ft.setAttribute('font-family', 'monospace');
        ft.textContent = p.formula;
        g.appendChild(ft);
      }

      _pointsG.appendChild(g);
    });
  }

  function _renderDims() {
    while (_dimG.firstChild) _dimG.removeChild(_dimG.firstChild);
    const fs = 3.5; // mm

    _lines.filter(l => l.type === 'line').forEach(ln => {
      const a = _points[ln.from], b = _points[ln.to];
      if (!a || !b) return;
      const distMm = Math.round(Math.hypot(b.x - a.x, b.y - a.y));
      if (distMm < 5) return; // no mostrar si muy corto

      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const OFF = 5; // mm perpendicular

      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', mx - (dy / len) * OFF);
      t.setAttribute('y', my + (dx / len) * OFF);
      t.setAttribute('font-size', fs);
      t.setAttribute('fill', '#3d3d58');
      t.setAttribute('font-family', 'monospace');
      t.setAttribute('text-anchor', 'middle');
      t.textContent = distMm + 'mm';
      _dimG.appendChild(t);
    });
  }

  // ════════════════════════════════════════════════════════════
  // PANEL PROPIEDADES
  // ════════════════════════════════════════════════════════════
  function _updateForm() {
    const form  = document.getElementById('dv5-pform');
    const nosel = document.getElementById('dv5-nosel');
    const badge = document.getElementById('dv5-badge');
    if (!_selected || !_points[_selected]) {
      form.style.display = 'none'; nosel.style.display = ''; badge.textContent = '—'; return;
    }
    const p = _points[_selected];
    form.style.display = ''; nosel.style.display = 'none';
    badge.textContent = p.name;
    document.getElementById('dv5-pnm').value = p.name;
    document.getElementById('dv5-px').value  = Math.round(p.x * 10) / 10;
    document.getElementById('dv5-py').value  = Math.round(p.y * 10) / 10;
    document.getElementById('dv5-pf').value  = p.formula || '';
    _updateFVal();
  }

  function _updateFVal() {
    const p = _selected && _points[_selected];
    if (!p || !p.formula) { document.getElementById('dv5-fv').textContent = '—'; return; }
    const v = _evalF(p.formula);
    document.getElementById('dv5-fv').textContent = v !== null ? `= ${Math.round(v)}mm` : '— fórmula inválida';
  }

  function _applyProps() {
    if (!_selected || !_points[_selected]) return;
    const p = _points[_selected];
    const nm = document.getElementById('dv5-pnm').value.trim().toUpperCase();
    if (nm) p.name = nm;
    p.x = parseFloat(document.getElementById('dv5-px').value) || 0;
    p.y = parseFloat(document.getElementById('dv5-py').value) || 0;
    _renderAll();
  }

  function _applyFormula() {
    if (!_selected || !_points[_selected]) return;
    const p = _points[_selected];
    p.formula = document.getElementById('dv5-pf').value.trim();
    _updateFVal();
    _renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // PANEL LISTA DE PUNTOS Y LÍNEAS
  // ════════════════════════════════════════════════════════════
  function _refreshPanel() {
    const ptlist = document.getElementById('dv5-ptlist');
    const lnlist = document.getElementById('dv5-lnlist');
    if (!ptlist) return;

    // Puntos
    ptlist.innerHTML = '';
    const ptKeys = Object.keys(_points);
    document.getElementById('dv5-ptcnt').textContent = ptKeys.length;
    ptKeys.forEach(id => {
      const p = _points[id];
      const div = document.createElement('div');
      div.className = 'dv5-pti' + (id === _selected ? ' on' : '');
      div.innerHTML = `
        <div class="dv5-pdot"></div>
        <span class="dv5-pnm">${p.name}</span>
        <span class="dv5-pco">${Math.round(p.x)}, ${Math.round(p.y)}mm</span>
        ${p.formula ? `<span style="font-size:9px;color:#a78bfa;font-family:monospace">${p.formula}</span>` : ''}
        <button class="dv5-pdel">✕</button>
      `;
      div.addEventListener('click', e => {
        if (e.target.classList.contains('dv5-pdel')) return;
        _selectPt(id);
      });
      div.querySelector('.dv5-pdel').addEventListener('click', () => {
        _lines = _lines.filter(l => l.from !== id && l.to !== id);
        delete _points[id];
        if (_selected === id) _selected = null;
        _renderAll();
      });
      ptlist.appendChild(div);
    });

    // Líneas
    lnlist.innerHTML = '';
    document.getElementById('dv5-lncnt').textContent = _lines.length;
    _lines.forEach((ln, i) => {
      const a = _points[ln.from], b = _points[ln.to];
      if (!a || !b) return;
      const bgColor = ln.type === 'fold' ? '#f87171' : ln.type === 'curve' ? '#60a5fa' : '#e2e8f0';
      const bgStyle = ln.type === 'fold'
        ? 'repeating-linear-gradient(90deg,#f87171 0,#f87171 4px,transparent 4px,transparent 8px)'
        : bgColor;
      const div = document.createElement('div');
      div.className = 'dv5-lni';
      div.innerHTML = `
        <div class="dv5-lbar" style="background:${bgStyle}"></div>
        <span class="dv5-llb">${a.name}→${b.name} <span style="color:#3d3d58">(${ln.type})</span></span>
        <button class="dv5-ldel">✕</button>
      `;
      div.querySelector('.dv5-ldel').addEventListener('click', () => {
        _lines.splice(i, 1); _renderAll();
      });
      lnlist.appendChild(div);
    });
  }

  // ════════════════════════════════════════════════════════════
  // VARIABLES DE MEDIDAS
  // ════════════════════════════════════════════════════════════
  function _renderVars() {
    const m = _getMeasures();
    const vars = [
      { k:'B4',        v: Math.round(m.bust*10/4) },
      { k:'B6',        v: Math.round(m.bust*10/6) },
      { k:'B8',        v: Math.round(m.bust*10/8) },
      { k:'E2',        v: Math.round(m.shoulder*10/2) },
      { k:'H4',        v: Math.round(m.hip*10/4) },
      { k:'W4',        v: Math.round(m.waist*10/4) },
      { k:'TALLE_ESP', v: m.backLength*10 },
      { k:'TALLE_DEL', v: m.frontLength*10 },
      { k:'LARGO',     v: m.totalLength*10 },
      { k:'MANGA',     v: m.sleeveLength*10 },
      { k:'CUELLO',    v: m.neck*10 },
      { k:'FALDA',     v: m.skirtLength*10 },
    ];
    const el = document.getElementById('dv5-vl');
    if (!el) return;
    el.innerHTML = '';
    vars.forEach(v => {
      const sp = document.createElement('span');
      sp.className = 'dv5-vc';
      sp.title = v.v + 'mm';
      sp.textContent = v.k;
      sp.onclick = () => {
        if (_selected && _points[_selected]) {
          _points[_selected].formula = v.k;
          document.getElementById('dv5-pf').value = v.k;
          document.getElementById('dv5-fv').textContent = `= ${v.v}mm`;
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
    const wrap = document.getElementById('dv5-wrap');
    const cx = wrap.clientWidth / 2, cy = wrap.clientHeight / 2;
    _pan.x = cx - (cx - _pan.x) * f;
    _pan.y = cy - (cy - _pan.y) * f;
    _zoom = Math.max(0.05, Math.min(20, _zoom * f));
    _applyTransform();
  }

  function _fitView() {
    const keys = Object.keys(_points);
    if (!keys.length) return;
    const xs = keys.map(id => _points[id].x);
    const ys = keys.map(id => _points[id].y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const wMm = (maxX - minX) || 100, hMm = (maxY - minY) || 100;
    const wrap = document.getElementById('dv5-wrap');
    const PAD = 80;
    const scaleX = (wrap.clientWidth  - PAD * 2) / (wMm * SC);
    const scaleY = (wrap.clientHeight - PAD * 2) / (hMm * SC);
    _zoom = Math.min(scaleX, scaleY, 6);
    _pan.x = wrap.clientWidth  / 2 - (minX + wMm / 2) * _zoom * SC;
    _pan.y = wrap.clientHeight / 2 - (minY + hMm / 2) * _zoom * SC;
    _applyTransform();
    _renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // FÓRMULAS
  // ════════════════════════════════════════════════════════════
  function _getMeasures() {
    const def = { bust:88, waist:68, hip:94, shoulder:38, neck:36, backLength:40, frontLength:42, totalLength:65, sleeveLength:60, skirtLength:60, hipDepth:20 };
    const m = {};
    document.querySelectorAll('[data-measure]').forEach(el => {
      m[el.dataset.measure] = parseFloat(el.value) || 0;
    });
    return Object.assign(def, m);
  }

  function _buildVarsMap() {
    const m = _getMeasures();
    const b=m.bust*10,w=m.waist*10,h=m.hip*10,sh=m.shoulder*10,nk=m.neck*10;
    return {
      BUSTO:b,CINTURA:w,CADERA:h,ESPALDA:sh,CUELLO:nk,
      TALLE_ESP:m.backLength*10,TALLE_DEL:m.frontLength*10,
      LARGO:m.totalLength*10,MANGA:m.sleeveLength*10,
      FALDA:m.skirtLength*10,CADERA_PROF:m.hipDepth*10,
      B4:b/4,B6:b/6,B8:b/8,B10:b/10,B12:b/12,
      W4:w/4,H4:h/4,E2:sh/2,
    };
  }

  function _evalF(expr) {
    if (!expr || expr === '0') return 0;
    const vars = _buildVarsMap();
    let c = String(expr).trim();
    Object.entries(vars).forEach(([k,v]) => {
      c = c.replace(new RegExp('\\b' + k + '\\b', 'g'), v.toFixed(4));
    });
    if (!/^[\d\s+\-*/().]+$/.test(c)) return null;
    try { return Function('"use strict";return(' + c + ')')(); } catch(e) { return null; }
  }

  // ════════════════════════════════════════════════════════════
  // GUARDAR / CARGAR
  // ════════════════════════════════════════════════════════════
  function _save() {
    const id = _curSave || ('sv5_' + Date.now());
    const store = _loadStore();
    store[id] = {
      id, name: _pieceName,
      points: JSON.parse(JSON.stringify(_points)),
      lines:  JSON.parse(JSON.stringify(_lines)),
      ptCtr:  _ptCtr,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(MK, JSON.stringify(store));
    _curSave = id;
    _refreshSaved();
    if (window.PAT && PAT.App) PAT.App.toast('💾 "' + _pieceName + '" guardado', 'success');
  }

  function _loadStore() {
    try { return JSON.parse(localStorage.getItem(MK) || '{}'); } catch(e) { return {}; }
  }

  function _refreshSaved() {
    const list = document.getElementById('dv5-sl');
    if (!list) return;
    const store = _loadStore(), keys = Object.keys(store);
    list.innerHTML = '';
    if (!keys.length) {
      list.innerHTML = '<div style="font-size:10px;color:#3d3d58;padding:4px">Sin guardados</div>';
      return;
    }
    keys.forEach(id => {
      const item = store[id];
      const div = document.createElement('div'); div.className = 'dv5-si';
      div.innerHTML = `<span class="dv5-snm">${item.name}</span><button class="dv5-sdel">✕</button>`;
      div.addEventListener('click', e => {
        if (e.target.classList.contains('dv5-sdel')) return;
        _points = JSON.parse(JSON.stringify(item.points));
        _lines  = JSON.parse(JSON.stringify(item.lines));
        _ptCtr  = item.ptCtr || 0;
        _pieceName = item.name; _curSave = id;
        document.getElementById('dv5-nm').value = _pieceName;
        _selected = null; _lnStart = null;
        _tempLine.setAttribute('opacity', '0');
        _renderAll(); _fitView();
      });
      div.querySelector('.dv5-sdel').addEventListener('click', e => {
        e.stopPropagation();
        if (!confirm('¿Eliminar "' + item.name + '"?')) return;
        delete store[id]; localStorage.setItem(MK, JSON.stringify(store)); _refreshSaved();
      });
      list.appendChild(div);
    });
  }

  // ════════════════════════════════════════════════════════════
  // AGREGAR AL PATRÓN PRINCIPAL
  // ════════════════════════════════════════════════════════════
  function _addToPattern() {
    if (!Object.keys(_points).length) {
      if (PAT.App) PAT.App.toast('No hay puntos en el editor', 'error'); return;
    }

    const svgNS = 'http://www.w3.org/2000/svg';
    const xs = Object.values(_points).map(p => p.x);
    const ys = Object.values(_points).map(p => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const maxX = Math.max(...xs), maxY = Math.max(...ys);

    // Factor de escala para el SVG del patrón principal (1mm = 1 unidad SVG)
    const g = document.createElementNS(svgNS, 'g');
    const gt = document.createElementNS(svgNS, 'g');
    gt.setAttribute('transform', `translate(${-minX},${-minY})`);

    // Relleno
    let d = '';
    _lines.forEach(ln => {
      const a = _points[ln.from], b = _points[ln.to];
      if (!a || !b) return;
      if (!d) d = `M ${a.x} ${a.y}`;
      if (ln.type === 'curve') {
        const { cpx, cpy } = _curveCP(a, b, ln.ctrl);
        d += ` Q ${cpx} ${cpy} ${b.x} ${b.y}`;
      } else { d += ` L ${b.x} ${b.y}`; }
    });
    if (d) {
      const f = document.createElementNS(svgNS, 'path');
      f.setAttribute('d', d); f.setAttribute('fill', 'rgba(139,92,246,.05)'); f.setAttribute('stroke', 'none');
      gt.appendChild(f);
    }

    // Líneas
    _lines.forEach(ln => {
      const a = _points[ln.from], b = _points[ln.to]; if (!a || !b) return;
      if (ln.type === 'curve') {
        const { cpx, cpy } = _curveCP(a, b, ln.ctrl);
        const el = document.createElementNS(svgNS, 'path');
        el.setAttribute('d', `M ${a.x} ${a.y} Q ${cpx} ${cpy} ${b.x} ${b.y}`);
        el.setAttribute('stroke', '#60a5fa'); el.setAttribute('stroke-width', '0.5'); el.setAttribute('fill', 'none');
        gt.appendChild(el);
      } else {
        const el = document.createElementNS(svgNS, 'line');
        el.setAttribute('x1',a.x);el.setAttribute('y1',a.y);el.setAttribute('x2',b.x);el.setAttribute('y2',b.y);
        el.setAttribute('stroke', ln.type==='fold'?'#f87171':'#e2e8f0');
        el.setAttribute('stroke-width','0.5');
        if (ln.type==='fold') el.setAttribute('stroke-dasharray','4,2');
        gt.appendChild(el);
      }
    });

    // Puntos y etiquetas
    Object.entries(_points).forEach(([, p]) => {
      const c = document.createElementNS(svgNS,'circle');
      c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);c.setAttribute('r','1.5');c.setAttribute('fill','#8b5cf6');
      gt.appendChild(c);
      const t = document.createElementNS(svgNS,'text');
      t.setAttribute('x',p.x+2.5);t.setAttribute('y',p.y-1.5);
      t.setAttribute('font-size','4');t.setAttribute('fill','#a78bfa');
      t.setAttribute('font-family','Arial');t.setAttribute('font-weight','bold');
      t.textContent = p.name; gt.appendChild(t);
    });

    // Nombre de la pieza
    const W = maxX-minX, H = maxY-minY;
    const nt = document.createElementNS(svgNS,'text');
    nt.setAttribute('x',W/2);nt.setAttribute('y',H/2);nt.setAttribute('font-size','5');
    nt.setAttribute('fill','#ede9fe');nt.setAttribute('font-family','Arial');
    nt.setAttribute('font-weight','bold');nt.setAttribute('text-anchor','middle');
    nt.textContent = _pieceName; gt.appendChild(nt);

    g.appendChild(gt);

    const content = document.getElementById('pattern-content');
    if (!content) { if(PAT.App)PAT.App.toast('SVG principal no encontrado','error'); return; }
    let ox=30,oy=30;
    try { const eb=content.getBBox();if(eb.width>0)ox=eb.x+eb.width+35; } catch(e) {}
    g.setAttribute('transform',`translate(${ox},${oy})`);
    g.setAttribute('class','manual-piece');
    content.appendChild(g);

    close();
    if (PAT.App) {
      PAT.App.toast('✅ "' + _pieceName + '" agregado al patrón', 'success');
      if (PAT.App.fitScreen) setTimeout(PAT.App.fitScreen, 120);
    }
  }

  return { open, close };
})();
