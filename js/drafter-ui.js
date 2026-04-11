/**
 * drafter-ui.js v6.0 — Editor Visual de Patronaje
 * FIXES: línea temporal fuera del canvas (coords SVG directas),
 * undo/redo, distancia en tiempo real, curvas ajustables arrastrando,
 * snap a grilla, gradación de tallas
 */
'use strict';
window.PAT = window.PAT || {};

PAT.DrafterUI = (function () {
  const NS = 'http://www.w3.org/2000/svg';
  const MK = 'pat_v6';
  const SC = 2; // px por mm a zoom=1

  // ── Estado ─────────────────────────────────────────────────
  let _modal    = null;
  let _svgEl    = null;
  let _canvasG  = null; // g transformado: translate(pan) scale(zoom*SC)
  let _linesG   = null;
  let _pointsG  = null;
  let _dimG     = null;
  let _ctrlG    = null; // puntos de control de curvas
  let _tempLine = null; // FUERA del canvas, coordenadas SVG directas

  // Datos — todo en mm
  let _points   = {};
  let _lines    = [];
  let _ptCtr    = 0;

  // Historia para undo/redo
  let _history  = [];
  let _histIdx  = -1;

  // Interacción
  let _dragging    = null; // id de punto siendo arrastrado
  let _draggingCtrl= null; // índice de línea cuyo ctrl se arrastra
  let _dragOff     = {x:0,y:0};
  let _tool        = 'select';
  let _lnStart     = null;
  let _pan         = {x:0,y:0};
  let _panStart    = null;
  let _isPan       = false;
  let _zoom        = 1;
  let _selected    = null;
  let _pieceName   = 'Mi Pieza';
  let _curSave     = null;
  let _snapEnabled = false;
  let _snapSize    = 5; // mm
  let _showDims    = true;

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
    if (document.getElementById('dv6-css')) return;
    const s = document.createElement('style'); s.id = 'dv6-css';
    s.textContent = `
#dv6-modal{z-index:700}
.dv6{position:relative;z-index:1;background:#090912;border:1px solid #3d3d58;border-radius:14px;
  width:min(1400px,99vw);height:min(960px,97vh);display:flex;flex-direction:column;
  box-shadow:0 40px 100px rgba(0,0,0,.98);overflow:hidden}
.dv6-hdr{display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #2e2e45;
  background:rgba(139,92,246,.07);flex-shrink:0;flex-wrap:wrap}
.dv6-title{font-size:13px;font-weight:800;color:#ede9fe}
.dv6-nm{background:none;border:none;border-bottom:1.5px solid #3d3d58;color:#ede9fe;font-size:13px;
  font-weight:700;font-family:var(--font,'Segoe UI');outline:none;padding:2px 6px;min-width:180px;transition:border-color .15s}
.dv6-nm:focus{border-color:#8b5cf6}
.dv6-gap{flex:1}
.dv6-zl{font-size:11px;color:#5a5678;font-family:monospace;background:#141420;padding:3px 10px;border-radius:10px;border:1px solid #2e2e45}
.dv6-tb{display:flex;align-items:center;gap:4px;padding:6px 12px;border-bottom:1px solid #2e2e45;
  background:#06060d;flex-shrink:0;flex-wrap:wrap}
.dv6-sep{width:1px;height:22px;background:#2e2e45;margin:0 4px}
.tb{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:7px;border:1.5px solid #2e2e45;
  background:#141420;color:#9490b0;cursor:pointer;font-size:11px;font-weight:600;
  font-family:var(--font,'Segoe UI');transition:all .15s;white-space:nowrap;user-select:none}
.tb:hover{background:#2a2a3e;color:#ede9fe;border-color:#3d3d58}
.tb.on{background:rgba(139,92,246,.18);color:#a78bfa;border-color:#8b5cf6}
.tb.red{border-color:rgba(248,113,113,.25);color:#f87171}.tb.red:hover{background:rgba(248,113,113,.1)}
.tb.grn{border-color:rgba(52,211,153,.25);color:#34d399}.tb.grn:hover{background:rgba(52,211,153,.1)}
.tb.pri{background:#8b5cf6;color:#fff;border-color:#8b5cf6}.tb.pri:hover{filter:brightness(1.1)}
.tb.yel{border-color:rgba(251,191,36,.25);color:#fbbf24}.tb.yel:hover{background:rgba(251,191,36,.1)}
.tb:disabled{opacity:.35;cursor:not-allowed}
.dv6-body{display:flex;flex:1;overflow:hidden;min-height:0}
/* canvas */
.dv6-cv{flex:1;position:relative;overflow:hidden;background:#06060c}
.dv6-cv.sel{cursor:default}
.dv6-cv.pt{cursor:crosshair}
.dv6-cv.ln{cursor:cell}
#dv6-svg{width:100%;height:100%;display:block;user-select:none}
/* overlays */
#dv6-instr{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);
  background:rgba(9,9,18,.93);border:1px solid #2e2e45;border-radius:20px;
  padding:6px 18px;font-size:12px;color:#9490b0;pointer-events:none;white-space:nowrap;backdrop-filter:blur(6px);
  max-width:80%;text-overflow:ellipsis;overflow:hidden}
#dv6-coord{position:absolute;top:10px;left:12px;font-size:11px;color:#3d3d58;font-family:monospace;
  background:rgba(6,6,12,.85);padding:4px 10px;border-radius:6px;pointer-events:none;line-height:1.5}
#dv6-dist{position:absolute;top:10px;right:12px;font-size:12px;font-weight:700;color:#34d399;
  font-family:monospace;background:rgba(6,6,12,.85);padding:4px 12px;border-radius:6px;
  pointer-events:none;display:none;border:1px solid rgba(52,211,153,.3)}
/* snap indicator */
#dv6-snapdot{position:absolute;width:10px;height:10px;border:2px solid #fbbf24;border-radius:50%;
  pointer-events:none;display:none;transform:translate(-50%,-50%)}
/* panel derecho */
.dv6-pnl{width:260px;flex-shrink:0;border-left:1px solid #2e2e45;display:flex;flex-direction:column;
  overflow:hidden;background:#08080f}
.dv6-psec{border-bottom:1px solid #2e2e45;flex-shrink:0}
.dv6-ptl{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#5a5678;
  padding:8px 14px 4px;display:flex;align-items:center;justify-content:space-between}
.dv6-prow{display:flex;align-items:center;gap:8px;padding:4px 14px}
.dv6-plb{font-size:11px;color:#5a5678;width:58px;flex-shrink:0}
.dv6-pi{flex:1;background:#141420;border:1.5px solid #2e2e45;color:#ede9fe;border-radius:6px;
  padding:4px 8px;font-size:11px;font-family:monospace;outline:none;transition:border-color .15s}
.dv6-pi:focus{border-color:#8b5cf6}
.dv6-fv{font-size:10px;color:#a78bfa;font-family:monospace;padding:0 14px 6px}
/* listas */
.dv6-ptlist{flex:1;overflow-y:auto;padding:4px 8px}
.dv6-pti{display:flex;align-items:center;gap:7px;padding:5px 8px;border-radius:6px;cursor:pointer;
  transition:all .15s;margin-bottom:2px;border:1.5px solid transparent;font-size:11px}
.dv6-pti:hover{background:#1c1c2a}
.dv6-pti.on{background:rgba(139,92,246,.12);border-color:#8b5cf6}
.dv6-pdot{width:7px;height:7px;border-radius:50%;background:#8b5cf6;flex-shrink:0}
.dv6-pnm{font-weight:700;color:#a78bfa;font-family:monospace;width:26px;flex-shrink:0}
.dv6-pco{font-size:10px;color:#5a5678;font-family:monospace;flex:1}
.dv6-pdel,.dv6-ldel{background:none;border:none;color:#3d3d58;cursor:pointer;font-size:11px;padding:1px 3px}
.dv6-pdel:hover,.dv6-ldel:hover{color:#f87171}
.dv6-lnlist{overflow-y:auto;max-height:100px;padding:4px 8px}
.dv6-lni{display:flex;align-items:center;gap:5px;padding:4px 7px;border-radius:5px;font-size:10px;
  color:#9490b0;margin-bottom:2px;background:#141420;border:1px solid #2e2e45;cursor:pointer;transition:all .12s}
.dv6-lni:hover{background:#1c1c2a}
.dv6-lni.on{background:rgba(96,165,250,.1);border-color:#60a5fa}
.dv6-lbar{width:18px;height:2px;border-radius:1px;flex-shrink:0}
.dv6-llb{flex:1}
/* curva slider */
.dv6-ctrl-slider{display:none;padding:4px 14px 8px;align-items:center;gap:8px}
.dv6-ctrl-slider.vis{display:flex}
.dv6-csl{flex:1;accent-color:#60a5fa;cursor:pointer}
.dv6-cnm{font-size:10px;color:#60a5fa;font-family:monospace;width:40px;text-align:right}
/* vars */
.dv6-vl{padding:5px 10px;display:flex;flex-wrap:wrap;gap:3px}
.dv6-vc{background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.2);color:#a78bfa;border-radius:10px;
  padding:2px 7px;font-size:10px;font-family:monospace;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .12s}
.dv6-vc:hover{background:rgba(139,92,246,.22);border-color:#8b5cf6}
/* guardados */
.dv6-sl{overflow-y:auto;max-height:80px;padding:4px 8px}
.dv6-si{display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;background:#141420;
  border:1.5px solid #2e2e45;cursor:pointer;font-size:11px;margin-bottom:3px;transition:all .15s}
.dv6-si:hover{background:#1c1c2a}
.dv6-snm{font-weight:600;flex:1;color:#ede9fe;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv6-sdel{background:none;border:none;color:#3d3d58;cursor:pointer;font-size:10px;padding:1px 3px}
.dv6-sdel:hover{color:#f87171}
/* modal gradacion */
.dv6-grade-modal{position:fixed;inset:0;z-index:800;display:none;align-items:center;justify-content:center}
.dv6-grade-modal.open{display:flex}
.dv6-grade-box{position:relative;z-index:1;background:#1c1c2a;border:1px solid #3d3d58;border-radius:12px;
  width:min(480px,94vw);max-height:80vh;overflow-y:auto;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.8)}
.dv6-grade-title{font-size:14px;font-weight:800;color:#ede9fe;margin-bottom:16px}
.dv6-grade-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.dv6-grade-lbl{font-size:12px;color:#9490b0;width:140px;flex-shrink:0}
.dv6-grade-inp{flex:1;background:#141420;border:1.5px solid #2e2e45;color:#ede9fe;border-radius:6px;
  padding:5px 8px;font-size:12px;font-family:monospace;outline:none}
.dv6-grade-inp:focus{border-color:#8b5cf6}
.dv6-grade-unit{font-size:11px;color:#5a5678}
/* keys */
.dv6-keys{padding:6px 14px;font-size:10px;color:#3d3d58;line-height:1.9;flex-shrink:0;border-top:1px solid #2e2e45}
.dv6-keys kbd{background:#141420;border:1px solid #2e2e45;border-radius:3px;padding:1px 4px;font-size:9px;color:#5a5678;font-family:monospace}
/* footer */
.dv6-ft{padding:7px 10px;border-top:1px solid #2e2e45;display:flex;flex-direction:column;gap:5px;flex-shrink:0}
.dv6-fb{width:100%;padding:8px;border-radius:7px;border:none;font-size:11px;font-weight:600;
  cursor:pointer;font-family:var(--font,'Segoe UI');transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px}
.dv6-fb.pri{background:#8b5cf6;color:#fff}.dv6-fb.pri:hover{filter:brightness(1.1)}
.dv6-fb.sec{background:#141420;color:#ede9fe;border:1.5px solid #3d3d58}.dv6-fb.sec:hover{background:#1c1c2a}
    `;
    document.head.appendChild(s);
  }

  // ════════════════════════════════════════════════════════════
  // BUILD UI
  // ════════════════════════════════════════════════════════════
  function _build() {
    _modal = document.createElement('div'); _modal.id='dv6-modal'; _modal.className='modal open';
    _modal.innerHTML = `
<div class="m-ov" id="dv6-ov"></div>
<div class="dv6">
  <div class="dv6-hdr">
    <span style="font-size:18px">✏️</span>
    <span class="dv6-title">Editor de Patronaje</span>
    <input class="dv6-nm" id="dv6-nm" value="Mi Pieza" placeholder="Nombre…">
    <div class="dv6-gap"></div>
    <span class="dv6-zl" id="dv6-zl">100%</span>
    <button class="tb" id="dv6-x" style="padding:4px 10px">✕ Cerrar</button>
  </div>

  <div class="dv6-tb">
    <!-- Herramientas -->
    <button class="tb on" data-tool="select" title="S">▶ Seleccionar</button>
    <button class="tb" data-tool="addPoint" title="P">＋ Punto</button>
    <button class="tb" data-tool="addLine" title="L">╱ Línea</button>
    <button class="tb" data-tool="addCurve" title="C">⌒ Curva</button>
    <button class="tb" data-tool="addFold" title="F">— Doblez</button>
    <div class="dv6-sep"></div>
    <!-- Rectángulo base -->
    <button class="tb" id="dv6-rect" title="R">⬜ Rectángulo</button>
    <div class="dv6-sep"></div>
    <!-- Undo / Redo -->
    <button class="tb" id="dv6-undo" title="Ctrl+Z" disabled>↩ Atrás</button>
    <button class="tb" id="dv6-redo" title="Ctrl+Y" disabled>↪ Adelante</button>
    <div class="dv6-sep"></div>
    <!-- Snap -->
    <button class="tb yel" id="dv6-snap" title="Activar snap a grilla">⊞ Snap 5mm</button>
    <!-- Cotas -->
    <button class="tb on" id="dv6-dims-btn" title="Mostrar/ocultar medidas">📐 Medidas</button>
    <div class="dv6-sep"></div>
    <!-- Tallas -->
    <button class="tb yel" id="dv6-grade">📏 Escalar talla</button>
    <div class="dv6-sep"></div>
    <!-- Vista -->
    <button class="tb" id="dv6-zi">＋</button>
    <button class="tb" id="dv6-zo">－</button>
    <button class="tb" id="dv6-zf">⊡ Ajustar</button>
    <div class="dv6-sep"></div>
    <button class="tb red" id="dv6-clr">🗑 Limpiar</button>
    <button class="tb grn" id="dv6-sv">💾 Guardar</button>
    <button class="tb pri" id="dv6-ap">＋ Al patrón</button>
  </div>

  <div class="dv6-body">
    <!-- ══ CANVAS ══ -->
    <div class="dv6-cv sel" id="dv6-wrap">
      <svg id="dv6-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dv6-g1" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M5 0H0V5" fill="none" stroke="rgba(255,255,255,.04)" stroke-width=".25"/>
          </pattern>
          <pattern id="dv6-g10" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="url(#dv6-g1)"/>
            <path d="M10 0H0V10" fill="none" stroke="rgba(255,255,255,.09)" stroke-width=".5"/>
          </pattern>
          <pattern id="dv6-g100" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#dv6-g10)"/>
            <path d="M100 0H0V100" fill="none" stroke="rgba(139,92,246,.22)" stroke-width="1"/>
          </pattern>
        </defs>

        <!-- Canvas transformado (pan + zoom) — TODO en mm -->
        <g id="dv6-canvas">
          <rect id="dv6-grid" x="-9999" y="-9999" width="19998" height="19998" fill="url(#dv6-g100)"/>
          <g id="dv6-axes">
            <line x1="-9999" y1="0" x2="9999" y2="0" stroke="rgba(139,92,246,.18)" stroke-width=".4"/>
            <line x1="0" y1="-9999" x2="0" y2="9999" stroke="rgba(139,92,246,.18)" stroke-width=".4"/>
            <circle cx="0" cy="0" r="1" fill="rgba(139,92,246,.5)"/>
          </g>
          <g id="dv6-dims"></g>
          <g id="dv6-lines"></g>
          <g id="dv6-ctrls"></g>
          <g id="dv6-pts"></g>
        </g>

        <!-- Línea temporal FUERA del canvas — usa coordenadas SVG directas -->
        <line id="dv6-tmp" x1="0" y1="0" x2="0" y2="0"
          stroke="#34d399" stroke-width="1.5" stroke-dasharray="8,4" opacity="0" pointer-events="none"/>
        <!-- Punto de snap FUERA del canvas -->
        <circle id="dv6-snapcircle" cx="0" cy="0" r="6" fill="none"
          stroke="#fbbf24" stroke-width="1.5" opacity="0" pointer-events="none"/>
      </svg>

      <div id="dv6-instr">▶ Seleccionar activo — haz clic en un punto para editarlo</div>
      <div id="dv6-coord">x: 0mm · y: 0mm</div>
      <div id="dv6-dist"></div>
    </div>

    <!-- ══ PANEL DERECHO ══ -->
    <div class="dv6-pnl">
      <!-- Propiedades del punto -->
      <div class="dv6-psec">
        <div class="dv6-ptl">Punto seleccionado <span id="dv6-badge" style="color:#a78bfa;font-family:monospace;font-weight:800">—</span></div>
        <div id="dv6-nosel" style="padding:10px 14px;font-size:11px;color:#5a5678">
          Clic en un punto para editarlo · Arrástralo para moverlo
        </div>
        <div id="dv6-pform" style="display:none">
          <div class="dv6-prow"><span class="dv6-plb">Nombre</span><input class="dv6-pi" id="dv6-pnm" maxlength="4" placeholder="A, B, 1…"></div>
          <div class="dv6-prow"><span class="dv6-plb">X (mm)</span><input type="number" class="dv6-pi" id="dv6-px" step="0.5"></div>
          <div class="dv6-prow"><span class="dv6-plb">Y (mm)</span><input type="number" class="dv6-pi" id="dv6-py" step="0.5"></div>
          <div class="dv6-prow"><span class="dv6-plb">Fórmula</span><input class="dv6-pi" id="dv6-pf" style="color:#a78bfa" placeholder="B4, TALLE_ESP…"></div>
          <div class="dv6-fv" id="dv6-fv">—</div>
          <div class="dv6-prow" style="padding-bottom:8px">
            <button class="tb red" id="dv6-dpt" style="width:100%;justify-content:center;font-size:10px;padding:4px 0">🗑 Eliminar punto</button>
          </div>
        </div>
      </div>

      <!-- Propiedades de línea seleccionada -->
      <div class="dv6-psec">
        <div class="dv6-ptl">Variables de medidas</div>
        <div class="dv6-vl" id="dv6-vl"></div>
      </div>

      <div class="dv6-psec" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
        <div class="dv6-ptl">Puntos <span id="dv6-ptcnt" style="color:#5a5678;font-weight:400">0</span></div>
        <div class="dv6-ptlist" id="dv6-ptlist"></div>
      </div>

      <div class="dv6-psec">
        <div class="dv6-ptl">Líneas / Curvas <span id="dv6-lncnt" style="color:#5a5678;font-weight:400">0</span></div>
        <div class="dv6-lnlist" id="dv6-lnlist"></div>
        <!-- Slider de curvatura (visible solo cuando se selecciona una curva) -->
        <div class="dv6-ctrl-slider" id="dv6-ctrl-slider">
          <span style="font-size:10px;color:#60a5fa">⌒ Curva</span>
          <input type="range" class="dv6-csl" id="dv6-csl" min="-80" max="80" value="0">
          <span class="dv6-cnm" id="dv6-cnm">0mm</span>
        </div>
      </div>

      <div class="dv6-psec" style="max-height:90px;overflow:hidden;display:flex;flex-direction:column">
        <div class="dv6-ptl">Guardados</div>
        <div class="dv6-sl" id="dv6-sl"></div>
      </div>

      <div class="dv6-keys">
        <kbd>S</kbd> Sel &nbsp;<kbd>P</kbd> Punto &nbsp;<kbd>L</kbd> Línea<br>
        <kbd>C</kbd> Curva &nbsp;<kbd>F</kbd> Doblez &nbsp;<kbd>R</kbd> Rect.<br>
        <kbd>Ctrl+Z</kbd> Atrás &nbsp;<kbd>Ctrl+Y</kbd> Adelante<br>
        <kbd>Del</kbd> Borrar &nbsp;<kbd>Esc</kbd> Cancelar<br>
        <kbd>Rueda</kbd> Zoom &nbsp;<kbd>Alt+drag</kbd> Pan
      </div>

      <div class="dv6-ft">
        <button class="dv6-fb pri" id="dv6-apb">＋ Agregar al patrón principal</button>
        <button class="dv6-fb sec" id="dv6-svb">💾 Guardar pieza</button>
      </div>
    </div>
  </div>
</div>

<!-- Modal Gradación de tallas -->
<div class="dv6-grade-modal" id="dv6-grade-modal">
  <div class="m-ov" id="dv6-grade-ov"></div>
  <div class="dv6-grade-box">
    <div class="dv6-grade-title">📏 Escalar a otra talla</div>
    <p style="font-size:11px;color:#9490b0;margin-bottom:14px">
      Ingresa las nuevas medidas para escalar el patrón.<br>
      Los puntos con fórmulas se recalcularán; los demás escalarán proporcionalmente.
    </p>
    <div class="dv6-grade-row"><span class="dv6-grade-lbl">Busto / Pecho</span><input class="dv6-grade-inp" id="gr-bust" type="number" min="50" max="200" step="0.5"><span class="dv6-grade-unit">cm</span></div>
    <div class="dv6-grade-row"><span class="dv6-grade-lbl">Cintura</span><input class="dv6-grade-inp" id="gr-waist" type="number" min="40" max="180" step="0.5"><span class="dv6-grade-unit">cm</span></div>
    <div class="dv6-grade-row"><span class="dv6-grade-lbl">Cadera</span><input class="dv6-grade-inp" id="gr-hip" type="number" min="50" max="220" step="0.5"><span class="dv6-grade-unit">cm</span></div>
    <div class="dv6-grade-row"><span class="dv6-grade-lbl">Hombros</span><input class="dv6-grade-inp" id="gr-shoulder" type="number" min="25" max="70" step="0.5"><span class="dv6-grade-unit">cm</span></div>
    <div class="dv6-grade-row"><span class="dv6-grade-lbl">Cuello</span><input class="dv6-grade-inp" id="gr-neck" type="number" min="28" max="70" step="0.5"><span class="dv6-grade-unit">cm</span></div>
    <div class="dv6-grade-row"><span class="dv6-grade-lbl">Talle espalda</span><input class="dv6-grade-inp" id="gr-back" type="number" min="25" max="65" step="0.5"><span class="dv6-grade-unit">cm</span></div>
    <div class="dv6-grade-row"><span class="dv6-grade-lbl">Largo total</span><input class="dv6-grade-inp" id="gr-total" type="number" min="30" max="160" step="0.5"><span class="dv6-grade-unit">cm</span></div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="tb pri" id="gr-apply" style="flex:1;justify-content:center;padding:10px">✓ Aplicar escala</button>
      <button class="tb" id="gr-cancel" style="padding:10px 20px">Cancelar</button>
    </div>
  </div>
</div>
    `;
    document.body.appendChild(_modal);

    _svgEl   = document.getElementById('dv6-svg');
    _canvasG = document.getElementById('dv6-canvas');
    _linesG  = document.getElementById('dv6-lines');
    _pointsG = document.getElementById('dv6-pts');
    _dimG    = document.getElementById('dv6-dims');
    _ctrlG   = document.getElementById('dv6-ctrls');
    _tempLine= document.getElementById('dv6-tmp'); // FUERA del canvas

    const wrap = document.getElementById('dv6-wrap');
    setTimeout(() => {
      _pan = { x: wrap.clientWidth * 0.38, y: wrap.clientHeight * 0.3 };
      _applyTransform();
    }, 30);

    _bindAll();
    _renderVars();
    _refreshSaved();
    _snapshot(); // snapshot inicial vacío
    _renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // COORDENADAS
  // Puntos almacenados en mm.
  // Canvas transform: translate(pan.x, pan.y) scale(zoom*SC)
  // _mmToSvg: mm → coordenadas SVG (px)
  // _screenToMm: coordenadas de pantalla → mm
  // ════════════════════════════════════════════════════════════
  function _applyTransform() {
    _canvasG.setAttribute('transform', `translate(${_pan.x},${_pan.y}) scale(${_zoom * SC})`);
    document.getElementById('dv6-zl').textContent = Math.round(_zoom * 100) + '%';
  }

  /** Convierte mm del canvas a px del SVG (lo que ve el usuario en pantalla) */
  function _mmToSvg(xMm, yMm) {
    return {
      x: _pan.x + xMm * _zoom * SC,
      y: _pan.y + yMm * _zoom * SC,
    };
  }

  /** Convierte coordenadas de pantalla (clientX/Y) a mm del canvas */
  function _screenToMm(cx, cy) {
    const r = document.getElementById('dv6-wrap').getBoundingClientRect();
    return {
      x: (cx - r.left - _pan.x) / (_zoom * SC),
      y: (cy - r.top  - _pan.y) / (_zoom * SC),
    };
  }

  function _snap(mm) {
    if (!_snapEnabled) return mm;
    return {
      x: Math.round(mm.x / _snapSize) * _snapSize,
      y: Math.round(mm.y / _snapSize) * _snapSize,
    };
  }

  // ════════════════════════════════════════════════════════════
  // HISTORIA — undo / redo
  // ════════════════════════════════════════════════════════════
  function _snapshot() {
    const state = {
      points: JSON.parse(JSON.stringify(_points)),
      lines:  JSON.parse(JSON.stringify(_lines)),
      ptCtr:  _ptCtr,
    };
    _history = _history.slice(0, _histIdx + 1);
    _history.push(state);
    if (_history.length > 60) _history.shift();
    _histIdx = _history.length - 1;
    _updateUndoRedo();
  }

  function _undo() {
    if (_histIdx <= 0) return;
    _histIdx--;
    _restore(_history[_histIdx]);
  }

  function _redo() {
    if (_histIdx >= _history.length - 1) return;
    _histIdx++;
    _restore(_history[_histIdx]);
  }

  function _restore(state) {
    _points = JSON.parse(JSON.stringify(state.points));
    _lines  = JSON.parse(JSON.stringify(state.lines));
    _ptCtr  = state.ptCtr;
    _selected = null; _lnStart = null;
    _tempLine.setAttribute('opacity', '0');
    _renderAll();
    _updateUndoRedo();
  }

  function _updateUndoRedo() {
    const u = document.getElementById('dv6-undo');
    const r = document.getElementById('dv6-redo');
    if (u) u.disabled = _histIdx <= 0;
    if (r) r.disabled = _histIdx >= _history.length - 1;
  }

  // ════════════════════════════════════════════════════════════
  // BIND EVENTOS
  // ════════════════════════════════════════════════════════════
  function _bindAll() {
    document.getElementById('dv6-ov').onclick = close;
    document.getElementById('dv6-x').onclick  = close;
    document.getElementById('dv6-nm').oninput = e => _pieceName = e.target.value;

    document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => _setTool(b.dataset.tool));

    document.getElementById('dv6-zi').onclick   = () => _doZoom(1.25);
    document.getElementById('dv6-zo').onclick   = () => _doZoom(0.8);
    document.getElementById('dv6-zf').onclick   = _fitView;
    document.getElementById('dv6-rect').onclick = _insertRect;
    document.getElementById('dv6-undo').onclick = _undo;
    document.getElementById('dv6-redo').onclick = _redo;
    document.getElementById('dv6-clr').onclick  = () => { if (confirm('¿Limpiar todo?')) { _snapshot(); _clearAll(); } };
    document.getElementById('dv6-sv').onclick   = _save;
    document.getElementById('dv6-svb').onclick  = _save;
    document.getElementById('dv6-ap').onclick   = _addToPattern;
    document.getElementById('dv6-apb').onclick  = _addToPattern;
    document.getElementById('dv6-dpt').onclick  = _delSelected;

    document.getElementById('dv6-snap').onclick = function() {
      _snapEnabled = !_snapEnabled;
      this.classList.toggle('on', _snapEnabled);
      this.textContent = _snapEnabled ? '⊞ Snap ON' : '⊞ Snap 5mm';
    };

    document.getElementById('dv6-dims-btn').onclick = function() {
      _showDims = !_showDims;
      this.classList.toggle('on', _showDims);
      document.getElementById('dv6-dims').style.display = _showDims ? '' : 'none';
    };

    document.getElementById('dv6-grade').onclick = _openGradeModal;
    document.getElementById('dv6-grade-ov').onclick = _closeGradeModal;
    document.getElementById('gr-cancel').onclick = _closeGradeModal;
    document.getElementById('gr-apply').onclick = _applyGrade;

    document.getElementById('dv6-pnm').oninput = _applyProps;
    document.getElementById('dv6-px').oninput  = _applyProps;
    document.getElementById('dv6-py').oninput  = _applyProps;
    document.getElementById('dv6-pf').oninput  = _applyFormula;

    document.getElementById('dv6-csl').oninput = function() {
      const val = parseInt(this.value);
      document.getElementById('dv6-cnm').textContent = val + 'mm';
      if (_selectedLine !== null && _lines[_selectedLine]) {
        _lines[_selectedLine].ctrl = val;
        _renderLines();
        _renderCurveControls();
        _renderDims();
      }
    };

    const wrap = document.getElementById('dv6-wrap');
    wrap.addEventListener('mousedown',  _mdown);
    wrap.addEventListener('mousemove',  _mmove);
    wrap.addEventListener('mouseup',    _mup);
    wrap.addEventListener('mouseleave', _mup);
    wrap.addEventListener('wheel', _onWheel, { passive: false });
    document.addEventListener('keydown', _kdown);
  }

  function _onWheel(e) {
    e.preventDefault();
    const r = document.getElementById('dv6-wrap').getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const f = e.deltaY < 0 ? 1.12 : 0.89;
    _pan.x = mx - (mx - _pan.x) * f;
    _pan.y = my - (my - _pan.y) * f;
    _zoom = Math.max(0.04, Math.min(20, _zoom * f));
    _applyTransform();
  }

  // ════════════════════════════════════════════════════════════
  // MOUSE
  // ════════════════════════════════════════════════════════════
  let _selectedLine = null; // índice de línea seleccionada (para slider de curva)

  function _mdown(e) {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      _isPan = true;
      _panStart = { x: e.clientX - _pan.x, y: e.clientY - _pan.y };
      return;
    }

    const rawMm = _screenToMm(e.clientX, e.clientY);
    const mm    = _snap(rawMm);
    const threshMm = 8 / (_zoom * SC);
    const near = _nearest(mm, threshMm);

    // ¿Clic en punto de control de curva?
    const nearCtrl = _nearestCtrl(mm, threshMm * 1.5);
    if (_tool === 'select' && nearCtrl !== -1) {
      _draggingCtrl = nearCtrl;
      _selectLine(nearCtrl);
      return;
    }

    if (_tool === 'addPoint') {
      _snapshot();
      _addPt(mm.x, mm.y);
      return;
    }

    if (_tool === 'addLine' || _tool === 'addCurve' || _tool === 'addFold') {
      if (!near) {
        _instr('⚠️ Haz clic exactamente sobre un punto existente (círculo morado)');
        return;
      }
      if (!_lnStart) {
        _lnStart = near;
        _renderAll();
        _instr(`✓ Punto ${_points[near].name} seleccionado. Ahora clic en el punto final.`);
      } else if (near !== _lnStart) {
        _snapshot();
        _addLn(_lnStart, near, _tool);
        _lnStart = null;
        _tempLine.setAttribute('opacity', '0');
        _instr(_toolMsg());
      } else {
        _lnStart = null;
        _tempLine.setAttribute('opacity', '0');
        _renderAll();
      }
      return;
    }

    if (_tool === 'select') {
      if (near) {
        _selectPt(near);
        _dragging = near;
        _dragOff = { x: mm.x - _points[near].x, y: mm.y - _points[near].y };
        _selectLine(null);
      } else {
        _deselectPt();
        _selectLine(null);
        _isPan = true;
        _panStart = { x: e.clientX - _pan.x, y: e.clientY - _pan.y };
      }
    }
  }

  function _mmove(e) {
    const rawMm = _screenToMm(e.clientX, e.clientY);
    const mm    = _snap(rawMm);
    const r     = document.getElementById('dv6-wrap').getBoundingClientRect();

    // Mostrar coordenadas
    document.getElementById('dv6-coord').textContent =
      `x: ${Math.round(mm.x)}mm · y: ${Math.round(mm.y)}mm`;

    // Snap indicator (fuera del canvas)
    const sc = document.getElementById('dv6-snapcircle');
    if (_snapEnabled) {
      const svgPos = _mmToSvg(mm.x, mm.y);
      sc.setAttribute('cx', svgPos.x); sc.setAttribute('cy', svgPos.y);
      sc.setAttribute('opacity', '0.8');
    } else {
      sc.setAttribute('opacity', '0');
    }

    if (_isPan && _panStart) {
      _pan.x = e.clientX - _panStart.x;
      _pan.y = e.clientY - _panStart.y;
      _applyTransform(); return;
    }

    // Arrastrar punto de control de curva
    if (_draggingCtrl !== null && _lines[_draggingCtrl]) {
      const ln = _lines[_draggingCtrl];
      const a = _points[ln.from], b = _points[ln.to];
      if (a && b) {
        // Calcular ctrl como proyección perpendicular desde el punto medio
        const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
        const dx = b.x-a.x, dy = b.y-a.y, len = Math.hypot(dx,dy)||1;
        const perpX = -dy/len, perpY = dx/len;
        const newCtrl = (mm.x-mx)*perpX + (mm.y-my)*perpY;
        ln.ctrl = Math.round(newCtrl);
        const sl = document.getElementById('dv6-csl');
        if (sl) sl.value = ln.ctrl;
        document.getElementById('dv6-cnm').textContent = ln.ctrl + 'mm';
        _renderLines();
        _renderCurveControls();
      }
      return;
    }

    // Arrastrar punto
    if (_dragging && _points[_dragging]) {
      const p = _points[_dragging];
      p.x = mm.x - _dragOff.x;
      p.y = mm.y - _dragOff.y;
      p.formula = '';
      _renderAll();
      _updateForm(); return;
    }

    // Línea temporal — ★ CRÍTICO: usa _mmToSvg() para convertir a coords SVG directas
    if (_lnStart && _points[_lnStart]) {
      const from = _points[_lnStart];
      // Convertir AMBOS puntos de mm a coordenadas SVG directas
      const svgFrom = _mmToSvg(from.x, from.y);
      const svgTo   = _mmToSvg(mm.x, mm.y);
      _tempLine.setAttribute('x1', svgFrom.x);
      _tempLine.setAttribute('y1', svgFrom.y);
      _tempLine.setAttribute('x2', svgTo.x);
      _tempLine.setAttribute('y2', svgTo.y);
      _tempLine.setAttribute('opacity', '1');
      const col = _tool==='addFold'?'#f87171':_tool==='addCurve'?'#60a5fa':'#34d399';
      _tempLine.setAttribute('stroke', col);

      // Mostrar distancia en tiempo real
      const dist = Math.hypot(mm.x-from.x, mm.y-from.y);
      const distEl = document.getElementById('dv6-dist');
      if (distEl) {
        distEl.textContent = `${Math.round(dist)}mm = ${(dist/10).toFixed(1)}cm desde ${from.name}`;
        distEl.style.display = 'block';
      }
    } else {
      _tempLine.setAttribute('opacity', '0');
      const distEl = document.getElementById('dv6-dist');
      if (distEl) distEl.style.display = 'none';
    }
  }

  function _mup(e) {
    if (_dragging) _snapshot(); // guardar estado después de arrastrar
    _isPan = false; _panStart = null;
    _dragging = null; _draggingCtrl = null;
  }

  function _kdown(e) {
    if (!_modal?.classList.contains('open')) return;
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey) {
      if (e.key==='z'||e.key==='Z') { e.preventDefault(); _undo(); return; }
      if (e.key==='y'||e.key==='Y') { e.preventDefault(); _redo(); return; }
    }
    switch(e.key) {
      case 's': case 'S': _setTool('select'); break;
      case 'p': case 'P': _setTool('addPoint'); break;
      case 'l': case 'L': _setTool('addLine'); break;
      case 'c': case 'C': _setTool('addCurve'); break;
      case 'f': case 'F': _setTool('addFold'); break;
      case 'r': case 'R': _insertRect(); break;
      case 'Escape': _lnStart=null; _tempLine.setAttribute('opacity','0'); _setTool('select'); break;
      case 'Delete': case 'Backspace': if(_selected)_delSelected(); break;
    }
  }

  // ════════════════════════════════════════════════════════════
  // HERRAMIENTAS
  // ════════════════════════════════════════════════════════════
  function _setTool(t) {
    _tool=t; _lnStart=null;
    _tempLine.setAttribute('opacity','0');
    document.getElementById('dv6-dist').style.display='none';
    document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool===t));
    const w=document.getElementById('dv6-wrap');
    w.className='dv6-cv'+(t==='select'?' sel':t==='addPoint'?' pt':' ln');
    _instr(_toolMsg());
    _renderAll();
  }

  function _toolMsg() {
    return {
      select:   '▶ Clic para seleccionar · Arrastrar para mover · Alt+drag para mover la vista',
      addPoint: '＋ Clic en el canvas para agregar punto. Con Snap ON se alinea a la grilla.',
      addLine:  '╱ Clic en punto A → clic en punto B — traza línea recta. La distancia aparece en verde.',
      addCurve: '⌒ Clic en punto A → clic en punto B — traza curva. Arrastra el ◆ azul para ajustar.',
      addFold:  '— Clic en punto A → clic en punto B — marca doblez (rojo) o hilo recto.',
    }[_tool]||'';
  }

  function _instr(t) { const el=document.getElementById('dv6-instr');if(el)el.textContent=t; }

  // ════════════════════════════════════════════════════════════
  // PUNTOS
  // ════════════════════════════════════════════════════════════
  const ALFA='ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function _addPt(xMm,yMm,name,formula) {
    _ptCtr++;
    const id='pt'+Date.now()+_ptCtr;
    const nm=name||(ALFA[Object.keys(_points).length%26]||String(_ptCtr));
    _points[id]={x:xMm,y:yMm,name:nm,formula:formula||''};
    _selectPt(id); _renderAll(); return id;
  }

  function _nearest(mm,thresh) {
    let near=null,d=thresh;
    Object.entries(_points).forEach(([id,p])=>{
      const dist=Math.hypot(p.x-mm.x,p.y-mm.y);
      if(dist<d){d=dist;near=id;}
    });
    return near;
  }

  function _nearestCtrl(mm,thresh) {
    for(let i=0;i<_lines.length;i++){
      const ln=_lines[i];if(ln.type!=='curve')continue;
      const a=_points[ln.from],b=_points[ln.to];if(!a||!b)continue;
      const {cpx,cpy}=_curveCP(a,b,ln.ctrl);
      if(Math.hypot(cpx-mm.x,cpy-mm.y)<thresh)return i;
    }
    return -1;
  }

  function _selectPt(id){_selected=id;_renderAll();_updateForm();}
  function _deselectPt(){_selected=null;_renderAll();_updateForm();}

  function _delSelected(){
    if(!_selected)return;
    _snapshot();
    _lines=_lines.filter(l=>l.from!==_selected&&l.to!==_selected);
    delete _points[_selected];_selected=null;_lnStart=null;
    _tempLine.setAttribute('opacity','0');
    _renderAll();_updateForm();
  }

  // ════════════════════════════════════════════════════════════
  // LÍNEAS
  // ════════════════════════════════════════════════════════════
  function _addLn(fromId,toId,tool){
    const type=tool==='addCurve'?'curve':tool==='addFold'?'fold':'line';
    const ctrl=type==='curve'?20:0; // 20mm de curvatura inicial para curvas
    _lines.push({from:fromId,to:toId,type,ctrl});
    _renderAll();
  }

  function _selectLine(idx){
    _selectedLine=idx;
    const slider=document.getElementById('dv6-ctrl-slider');
    if(idx===null||!_lines[idx]||_lines[idx].type!=='curve'){
      if(slider)slider.classList.remove('vis');
      _renderCurveControls();
      return;
    }
    const sl=document.getElementById('dv6-csl');
    const nm=document.getElementById('dv6-cnm');
    if(sl){sl.value=_lines[idx].ctrl;nm.textContent=_lines[idx].ctrl+'mm';}
    if(slider)slider.classList.add('vis');
    _renderCurveControls();
  }

  // ════════════════════════════════════════════════════════════
  // RECTÁNGULO BASE
  // ════════════════════════════════════════════════════════════
  function _insertRect(){
    const m=_getMeasures();
    const W=m.bust/4*10;    // B4 en mm
    const H=m.backLength*10; // TALLE_ESP en mm
    _snapshot();
    _clearAll();
    const A=_addPt(0,0,'A','0');
    const B=_addPt(W,0,'B','B4');
    const C=_addPt(W,H,'C','TALLE_ESP');
    const D=_addPt(0,H,'D','TALLE_ESP');
    _lines=[
      {from:A,to:B,type:'line',ctrl:0},
      {from:B,to:C,type:'line',ctrl:0},
      {from:C,to:D,type:'line',ctrl:0},
      {from:D,to:A,type:'fold',ctrl:0},
    ];
    _pieceName='Rectángulo Base';
    document.getElementById('dv6-nm').value=_pieceName;
    _snapshot();
    _renderAll();_fitView();
    _setTool('addPoint');
    _instr(`⬜ ${Math.round(W)}×${Math.round(H)}mm · A(0,0) B(${Math.round(W)},0) C(${Math.round(W)},${Math.round(H)}) D(0,${Math.round(H)}). Agrega puntos [P].`);
  }

  function _clearAll(){
    _points={};_lines={};_lines=[];_ptCtr=0;_selected=null;_lnStart=null;
    _selectedLine=null;_tempLine.setAttribute('opacity','0');
    _renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // CURVA — punto de control
  // ════════════════════════════════════════════════════════════
  function _curveCP(a,b,ctrlMm){
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    return{cpx:mx-(dy/len)*ctrlMm,cpy:my+(dx/len)*ctrlMm};
  }

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  function _renderAll(){_renderLines();_renderCurveControls();_renderPoints();_renderDims();_refreshPanel();}

  function _renderLines(){
    while(_linesG.firstChild)_linesG.removeChild(_linesG.firstChild);
    const sw=0.5; // mm — el canvas transform escala esto

    // Relleno
    let d='';
    _lines.forEach(ln=>{
      const a=_points[ln.from],b=_points[ln.to];if(!a||!b)return;
      if(!d)d=`M ${a.x} ${a.y}`;
      if(ln.type==='curve'){const{cpx,cpy}=_curveCP(a,b,ln.ctrl);d+=` Q ${cpx} ${cpy} ${b.x} ${b.y}`;}
      else d+=` L ${b.x} ${b.y}`;
    });
    if(d){const f=document.createElementNS(NS,'path');f.setAttribute('d',d);f.setAttribute('fill','rgba(139,92,246,.06)');f.setAttribute('stroke','none');f.setAttribute('pointer-events','none');_linesG.appendChild(f);}

    _lines.forEach((ln,i)=>{
      const a=_points[ln.from],b=_points[ln.to];if(!a||!b)return;
      let el;
      if(ln.type==='curve'){
        const{cpx,cpy}=_curveCP(a,b,ln.ctrl);
        el=document.createElementNS(NS,'path');
        el.setAttribute('d',`M ${a.x} ${a.y} Q ${cpx} ${cpy} ${b.x} ${b.y}`);
        el.setAttribute('stroke',i===_selectedLine?'#93c5fd':'#60a5fa');
        el.setAttribute('fill','none');
      }else{
        el=document.createElementNS(NS,'line');
        el.setAttribute('x1',a.x);el.setAttribute('y1',a.y);el.setAttribute('x2',b.x);el.setAttribute('y2',b.y);
        el.setAttribute('stroke',ln.type==='fold'?'#f87171':'#e2e8f0');
        if(ln.type==='fold')el.setAttribute('stroke-dasharray','3,1.5');
      }
      el.setAttribute('stroke-width',sw);
      _linesG.appendChild(el);
    });
  }

  function _renderCurveControls(){
    while(_ctrlG.firstChild)_ctrlG.removeChild(_ctrlG.firstChild);
    const sz=2.5; // mm

    _lines.forEach((ln,i)=>{
      if(ln.type!=='curve')return;
      const a=_points[ln.from],b=_points[ln.to];if(!a||!b)return;
      const{cpx,cpy}=_curveCP(a,b,ln.ctrl);
      // Línea de guía desde midpoint al ctrl
      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      const guide=document.createElementNS(NS,'line');
      guide.setAttribute('x1',mx);guide.setAttribute('y1',my);
      guide.setAttribute('x2',cpx);guide.setAttribute('y2',cpy);
      guide.setAttribute('stroke','rgba(96,165,250,.3)');guide.setAttribute('stroke-width','0.3');
      guide.setAttribute('stroke-dasharray','1.5,1');
      _ctrlG.appendChild(guide);
      // Diamante draggable
      const pts=`${cpx},${cpy-sz} ${cpx+sz},${cpy} ${cpx},${cpy+sz} ${cpx-sz},${cpy}`;
      const diamond=document.createElementNS(NS,'polygon');
      diamond.setAttribute('points',pts);
      diamond.setAttribute('fill',i===_selectedLine?'#93c5fd':'#60a5fa');
      diamond.setAttribute('stroke','#06060c');diamond.setAttribute('stroke-width','0.25');
      diamond.style.cursor='move';
      _ctrlG.appendChild(diamond);
    });
  }

  function _renderPoints(){
    while(_pointsG.firstChild)_pointsG.removeChild(_pointsG.firstChild);
    const r=2,fs=5,hit=5;

    Object.entries(_points).forEach(([id,p])=>{
      const g=document.createElementNS(NS,'g');
      g.id='dv6pt-'+id;g.style.cursor=_tool==='select'?'pointer':'crosshair';

      const hc=document.createElementNS(NS,'circle');
      hc.setAttribute('cx',p.x);hc.setAttribute('cy',p.y);hc.setAttribute('r',hit);
      hc.setAttribute('fill','transparent');g.appendChild(hc);

      const c=document.createElementNS(NS,'circle');
      c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);c.setAttribute('r',r);
      c.setAttribute('fill',id===_selected?'#fbbf24':id===_lnStart?'#34d399':'#8b5cf6');
      c.setAttribute('stroke','#06060c');c.setAttribute('stroke-width','0.3');g.appendChild(c);

      const t=document.createElementNS(NS,'text');
      t.setAttribute('x',p.x+r*1.6);t.setAttribute('y',p.y-r*0.7);
      t.setAttribute('font-size',fs);t.setAttribute('fill',id===_selected?'#fbbf24':'#a78bfa');
      t.setAttribute('font-family','Arial');t.setAttribute('font-weight','bold');
      t.textContent=p.name;g.appendChild(t);

      if(p.formula){
        const ft=document.createElementNS(NS,'text');
        ft.setAttribute('x',p.x+r*1.6);ft.setAttribute('y',p.y+fs*0.9);
        ft.setAttribute('font-size',fs*0.7);ft.setAttribute('fill','#3d3d58');
        ft.setAttribute('font-family','monospace');ft.textContent=p.formula;g.appendChild(ft);
      }

      _pointsG.appendChild(g);
    });
  }

  function _renderDims(){
    while(_dimG.firstChild)_dimG.removeChild(_dimG.firstChild);
    if(!_showDims)return;
    const fs=3.2;

    _lines.forEach(ln=>{
      if(ln.type==='fold')return;
      const a=_points[ln.from],b=_points[ln.to];if(!a||!b)return;

      let distMm;
      if(ln.type==='curve'){
        // Aproximar longitud de la curva
        const{cpx,cpy}=_curveCP(a,b,ln.ctrl);
        distMm=Math.round(Math.hypot((a.x+cpx)/2-b.x,(a.y+cpy)/2-b.y)+Math.hypot(a.x-cpx,a.y-cpy));
      }else{
        distMm=Math.round(Math.hypot(b.x-a.x,b.y-a.y));
      }
      if(distMm<5)return;

      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
      const OFF=5;

      // Línea de cota
      const cotaLine=document.createElementNS(NS,'line');
      cotaLine.setAttribute('x1',mx-(dy/len)*OFF*0.5);cotaLine.setAttribute('y1',my+(dx/len)*OFF*0.5);
      cotaLine.setAttribute('x2',mx-(dy/len)*OFF);cotaLine.setAttribute('y2',my+(dx/len)*OFF);
      cotaLine.setAttribute('stroke','#3d3d58');cotaLine.setAttribute('stroke-width','0.2');
      _dimG.appendChild(cotaLine);

      const t=document.createElementNS(NS,'text');
      t.setAttribute('x',mx-(dy/len)*OFF*1.4);t.setAttribute('y',my+(dx/len)*OFF*1.4);
      t.setAttribute('font-size',fs);t.setAttribute('fill','#5a5678');
      t.setAttribute('font-family','monospace');t.setAttribute('text-anchor','middle');
      t.textContent=distMm+'mm';
      _dimG.appendChild(t);

      // También mostrar en cm si > 10mm
      if(distMm>=10){
        const t2=document.createElementNS(NS,'text');
        t2.setAttribute('x',mx-(dy/len)*OFF*1.4);t2.setAttribute('y',my+(dx/len)*OFF*1.4+fs*1.2);
        t2.setAttribute('font-size',fs*0.85);t2.setAttribute('fill','#3d3d58');
        t2.setAttribute('font-family','monospace');t2.setAttribute('text-anchor','middle');
        t2.textContent='('+((distMm/10).toFixed(1))+'cm)';
        _dimG.appendChild(t2);
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  // PANEL PROPIEDADES
  // ════════════════════════════════════════════════════════════
  function _updateForm(){
    const form=document.getElementById('dv6-pform');
    const nosel=document.getElementById('dv6-nosel');
    const badge=document.getElementById('dv6-badge');
    if(!_selected||!_points[_selected]){
      form.style.display='none';nosel.style.display='';badge.textContent='—';return;
    }
    const p=_points[_selected];
    form.style.display='';nosel.style.display='none';badge.textContent=p.name;
    document.getElementById('dv6-pnm').value=p.name;
    document.getElementById('dv6-px').value=Math.round(p.x*10)/10;
    document.getElementById('dv6-py').value=Math.round(p.y*10)/10;
    document.getElementById('dv6-pf').value=p.formula||'';
    _updateFVal();
  }

  function _updateFVal(){
    const p=_selected&&_points[_selected];
    if(!p||!p.formula){document.getElementById('dv6-fv').textContent='—';return;}
    const v=_evalF(p.formula);
    document.getElementById('dv6-fv').textContent=v!==null?`= ${Math.round(v)}mm`:'— fórmula inválida';
  }

  function _applyProps(){
    if(!_selected||!_points[_selected])return;
    const p=_points[_selected];
    const nm=document.getElementById('dv6-pnm').value.trim().toUpperCase();
    if(nm)p.name=nm;
    p.x=parseFloat(document.getElementById('dv6-px').value)||0;
    p.y=parseFloat(document.getElementById('dv6-py').value)||0;
    _renderAll();
  }

  function _applyFormula(){
    if(!_selected||!_points[_selected])return;
    _points[_selected].formula=document.getElementById('dv6-pf').value.trim();
    _updateFVal();_renderAll();
  }

  function _refreshPanel(){
    const ptlist=document.getElementById('dv6-ptlist');
    const lnlist=document.getElementById('dv6-lnlist');
    if(!ptlist)return;
    const ptKeys=Object.keys(_points);
    document.getElementById('dv6-ptcnt').textContent=ptKeys.length;
    ptlist.innerHTML='';
    ptKeys.forEach(id=>{
      const p=_points[id];
      const div=document.createElement('div');div.className='dv6-pti'+(id===_selected?' on':'');
      div.innerHTML=`<div class="dv6-pdot"></div><span class="dv6-pnm">${p.name}</span><span class="dv6-pco">${Math.round(p.x)},${Math.round(p.y)}mm</span>${p.formula?`<span style="font-size:9px;color:#a78bfa;font-family:monospace">${p.formula}</span>`:''}<button class="dv6-pdel">✕</button>`;
      div.addEventListener('click',e=>{if(e.target.classList.contains('dv6-pdel'))return;_selectPt(id);});
      div.querySelector('.dv6-pdel').addEventListener('click',()=>{_snapshot();_lines=_lines.filter(l=>l.from!==id&&l.to!==id);delete _points[id];if(_selected===id)_selected=null;_renderAll();});
      ptlist.appendChild(div);
    });
    lnlist.innerHTML='';
    document.getElementById('dv6-lncnt').textContent=_lines.length;
    _lines.forEach((ln,i)=>{
      const a=_points[ln.from],b=_points[ln.to];if(!a||!b)return;
      const col=ln.type==='fold'?'#f87171':ln.type==='curve'?'#60a5fa':'#e2e8f0';
      const bg=ln.type==='fold'?'repeating-linear-gradient(90deg,#f87171 0,#f87171 4px,transparent 4px,transparent 8px)':col;
      const div=document.createElement('div');div.className='dv6-lni'+(i===_selectedLine?' on':'');
      div.innerHTML=`<div class="dv6-lbar" style="background:${bg}"></div><span class="dv6-llb">${a.name}→${b.name} <span style="color:#3d3d58">(${ln.type}${ln.type==='curve'?' '+ln.ctrl+'mm':''})</span></span><button class="dv6-ldel">✕</button>`;
      div.addEventListener('click',e=>{if(e.target.classList.contains('dv6-ldel'))return;_selectLine(i===_selectedLine?null:i);_refreshPanel();});
      div.querySelector('.dv6-ldel').addEventListener('click',()=>{_snapshot();_lines.splice(i,1);if(_selectedLine===i)_selectLine(null);_renderAll();});
      lnlist.appendChild(div);
    });
  }

  // ════════════════════════════════════════════════════════════
  // VARIABLES
  // ════════════════════════════════════════════════════════════
  function _renderVars(){
    const m=_getMeasures();
    const vars=[
      {k:'B4',v:Math.round(m.bust*10/4)},{k:'B6',v:Math.round(m.bust*10/6)},
      {k:'B8',v:Math.round(m.bust*10/8)},{k:'E2',v:Math.round(m.shoulder*10/2)},
      {k:'H4',v:Math.round(m.hip*10/4)},{k:'W4',v:Math.round(m.waist*10/4)},
      {k:'TALLE_ESP',v:m.backLength*10},{k:'TALLE_DEL',v:m.frontLength*10},
      {k:'LARGO',v:m.totalLength*10},{k:'MANGA',v:m.sleeveLength*10},
      {k:'CUELLO',v:m.neck*10},{k:'FALDA',v:m.skirtLength*10},
    ];
    const el=document.getElementById('dv6-vl');if(!el)return;
    el.innerHTML='';
    vars.forEach(v=>{
      const sp=document.createElement('span');sp.className='dv6-vc';
      sp.title=v.v+'mm';sp.textContent=v.k;
      sp.onclick=()=>{
        if(_selected&&_points[_selected]){
          _points[_selected].formula=v.k;
          document.getElementById('dv6-pf').value=v.k;
          document.getElementById('dv6-fv').textContent='= '+v.v+'mm';
          _renderAll();
        }
      };
      el.appendChild(sp);
    });
  }

  // ════════════════════════════════════════════════════════════
  // GRADACIÓN DE TALLAS
  // ════════════════════════════════════════════════════════════
  function _openGradeModal(){
    const m=_getMeasures();
    document.getElementById('gr-bust').value=m.bust;
    document.getElementById('gr-waist').value=m.waist;
    document.getElementById('gr-hip').value=m.hip;
    document.getElementById('gr-shoulder').value=m.shoulder;
    document.getElementById('gr-neck').value=m.neck;
    document.getElementById('gr-back').value=m.backLength;
    document.getElementById('gr-total').value=m.totalLength;
    document.getElementById('dv6-grade-modal').classList.add('open');
  }

  function _closeGradeModal(){
    document.getElementById('dv6-grade-modal').classList.remove('open');
  }

  function _applyGrade(){
    const newM={
      bust:     parseFloat(document.getElementById('gr-bust').value)||88,
      waist:    parseFloat(document.getElementById('gr-waist').value)||68,
      hip:      parseFloat(document.getElementById('gr-hip').value)||94,
      shoulder: parseFloat(document.getElementById('gr-shoulder').value)||38,
      neck:     parseFloat(document.getElementById('gr-neck').value)||36,
      backLength:parseFloat(document.getElementById('gr-back').value)||40,
      totalLength:parseFloat(document.getElementById('gr-total').value)||65,
    };
    const oldM=_getMeasures();

    _snapshot();

    // Calcular factor de escala proporcional (usar busto como referencia)
    const scaleX=(newM.bust/4*10)/(oldM.bust/4*10)||1;
    const scaleY=(newM.backLength*10)/(oldM.backLength*10)||1;

    Object.values(_points).forEach(p=>{
      if(p.formula){
        // Re-evaluar la fórmula con nuevas medidas (temporalmente cambiar los inputs)
        const oldVars=_buildVarsMap();
        const newVars={
          BUSTO:newM.bust*10,CINTURA:newM.waist*10,CADERA:newM.hip*10,
          ESPALDA:newM.shoulder*10,CUELLO:newM.neck*10,
          TALLE_ESP:newM.backLength*10,TALLE_DEL:(newM.totalLength-5)*10,
          LARGO:newM.totalLength*10,MANGA:60*10,FALDA:60*10,CADERA_PROF:20*10,
          B4:newM.bust*10/4,B6:newM.bust*10/6,B8:newM.bust*10/8,
          B10:newM.bust*10/10,B12:newM.bust*10/12,
          W4:newM.waist*10/4,H4:newM.hip*10/4,E2:newM.shoulder*10/2,
        };
        let c=String(p.formula).trim();
        Object.entries(newVars).forEach(([k,v])=>{c=c.replace(new RegExp('\\b'+k+'\\b','g'),v.toFixed(4));});
        if(/^[\d\s+\-*/().]+$/.test(c)){
          try{const val=Function('"use strict";return('+c+')')();p.x=val;p.y=val;}catch(e){}
        }
        // Para fórmulas simples de una dimensión: actualizar x o y según dirección esperada
        // Aproximación: si la fórmula era un valor horizontal → escalar X, si vertical → Y
        const oldVal=_evalF(p.formula);
        if(oldVal!==null){
          // Intentar re-evaluar con nuevas medidas globales
          // Simplificación: escalar proporcional si no se puede re-evaluar
        }
      }else{
        // Sin fórmula: escalar proporcionalmente
        p.x*=scaleX;
        p.y*=scaleY;
      }
    });

    // Actualizar también el control de curvas
    _lines.forEach(ln=>{if(ln.type==='curve')ln.ctrl*=(scaleX+scaleY)/2;});

    _snapshot();
    _renderAll();_fitView();
    _closeGradeModal();
    if(PAT.App)PAT.App.toast('✅ Patrón escalado a nuevas medidas','success');
  }

  // ════════════════════════════════════════════════════════════
  // ZOOM
  // ════════════════════════════════════════════════════════════
  function _doZoom(f){
    const w=document.getElementById('dv6-wrap');
    const cx=w.clientWidth/2,cy=w.clientHeight/2;
    _pan.x=cx-(cx-_pan.x)*f;_pan.y=cy-(cy-_pan.y)*f;
    _zoom=Math.max(0.04,Math.min(20,_zoom*f));
    _applyTransform();
  }

  function _fitView(){
    const keys=Object.keys(_points);if(!keys.length)return;
    const xs=keys.map(id=>_points[id].x),ys=keys.map(id=>_points[id].y);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const wMm=(maxX-minX)||100,hMm=(maxY-minY)||100;
    const w=document.getElementById('dv6-wrap');
    const PAD=80;
    const scX=(w.clientWidth-PAD*2)/(wMm*SC),scY=(w.clientHeight-PAD*2)/(hMm*SC);
    _zoom=Math.min(scX,scY,6);
    _pan.x=w.clientWidth/2-(minX+wMm/2)*_zoom*SC;
    _pan.y=w.clientHeight/2-(minY+hMm/2)*_zoom*SC;
    _applyTransform();_renderAll();
  }

  // ════════════════════════════════════════════════════════════
  // FÓRMULAS
  // ════════════════════════════════════════════════════════════
  function _getMeasures(){
    const def={bust:88,waist:68,hip:94,shoulder:38,neck:36,backLength:40,frontLength:42,totalLength:65,sleeveLength:60,skirtLength:60,hipDepth:20};
    const m={};
    document.querySelectorAll('[data-measure]').forEach(el=>{m[el.dataset.measure]=parseFloat(el.value)||0;});
    return Object.assign(def,m);
  }

  function _buildVarsMap(){
    const m=_getMeasures();
    const b=m.bust*10,w=m.waist*10,h=m.hip*10,sh=m.shoulder*10,nk=m.neck*10;
    return{BUSTO:b,CINTURA:w,CADERA:h,ESPALDA:sh,CUELLO:nk,TALLE_ESP:m.backLength*10,TALLE_DEL:m.frontLength*10,LARGO:m.totalLength*10,MANGA:m.sleeveLength*10,FALDA:m.skirtLength*10,CADERA_PROF:m.hipDepth*10,B4:b/4,B6:b/6,B8:b/8,B10:b/10,B12:b/12,W4:w/4,H4:h/4,E2:sh/2};
  }

  function _evalF(expr){
    if(!expr||expr==='0')return 0;
    const vars=_buildVarsMap();
    let c=String(expr).trim();
    Object.entries(vars).forEach(([k,v])=>{c=c.replace(new RegExp('\\b'+k+'\\b','g'),v.toFixed(4));});
    if(!/^[\d\s+\-*/().]+$/.test(c))return null;
    try{return Function('"use strict";return('+c+')')();}catch(e){return null;}
  }

  // ════════════════════════════════════════════════════════════
  // GUARDAR / CARGAR
  // ════════════════════════════════════════════════════════════
  function _save(){
    const id=_curSave||('sv6_'+Date.now());
    const store=_loadStore();
    store[id]={id,name:_pieceName,points:JSON.parse(JSON.stringify(_points)),lines:JSON.parse(JSON.stringify(_lines)),ptCtr:_ptCtr,savedAt:new Date().toISOString()};
    localStorage.setItem(MK,JSON.stringify(store));
    _curSave=id;_refreshSaved();
    if(PAT.App)PAT.App.toast('💾 "'+_pieceName+'" guardado','success');
  }

  function _loadStore(){try{return JSON.parse(localStorage.getItem(MK)||'{}');}catch(e){return{};}}

  function _refreshSaved(){
    const list=document.getElementById('dv6-sl');if(!list)return;
    const store=_loadStore(),keys=Object.keys(store);
    list.innerHTML='';
    if(!keys.length){list.innerHTML='<div style="font-size:10px;color:#3d3d58;padding:4px">Sin guardados</div>';return;}
    keys.forEach(id=>{
      const item=store[id];
      const div=document.createElement('div');div.className='dv6-si';
      div.innerHTML=`<span class="dv6-snm">${item.name}</span><button class="dv6-sdel">✕</button>`;
      div.addEventListener('click',e=>{
        if(e.target.classList.contains('dv6-sdel'))return;
        _points=JSON.parse(JSON.stringify(item.points));
        _lines=JSON.parse(JSON.stringify(item.lines));
        _ptCtr=item.ptCtr||0;_pieceName=item.name;_curSave=id;
        document.getElementById('dv6-nm').value=_pieceName;
        _selected=null;_lnStart=null;_selectedLine=null;
        _tempLine.setAttribute('opacity','0');
        _snapshot();_renderAll();_fitView();
      });
      div.querySelector('.dv6-sdel').addEventListener('click',e=>{
        e.stopPropagation();if(!confirm('¿Eliminar "'+item.name+'"?'))return;
        delete store[id];localStorage.setItem(MK,JSON.stringify(store));_refreshSaved();
      });
      list.appendChild(div);
    });
  }

  // ════════════════════════════════════════════════════════════
  // AGREGAR AL PATRÓN PRINCIPAL
  // ════════════════════════════════════════════════════════════
  function _addToPattern(){
    if(!Object.keys(_points).length){if(PAT.App)PAT.App.toast('No hay puntos','error');return;}
    const svgNS='http://www.w3.org/2000/svg';
    const xs=Object.values(_points).map(p=>p.x),ys=Object.values(_points).map(p=>p.y);
    const minX=Math.min(...xs),minY=Math.min(...ys),W=Math.max(...xs)-minX,H=Math.max(...ys)-minY;
    const g=document.createElementNS(svgNS,'g');
    const gt=document.createElementNS(svgNS,'g');gt.setAttribute('transform',`translate(${-minX},${-minY})`);
    let d='';
    _lines.forEach(ln=>{
      const a=_points[ln.from],b=_points[ln.to];if(!a||!b)return;
      if(!d)d=`M ${a.x} ${a.y}`;
      if(ln.type==='curve'){const{cpx,cpy}=_curveCP(a,b,ln.ctrl);d+=` Q ${cpx} ${cpy} ${b.x} ${b.y}`;}
      else d+=` L ${b.x} ${b.y}`;
    });
    if(d){const f=document.createElementNS(svgNS,'path');f.setAttribute('d',d);f.setAttribute('fill','rgba(139,92,246,.05)');f.setAttribute('stroke','none');gt.appendChild(f);}
    _lines.forEach(ln=>{
      const a=_points[ln.from],b=_points[ln.to];if(!a||!b)return;
      if(ln.type==='curve'){const{cpx,cpy}=_curveCP(a,b,ln.ctrl);const el=document.createElementNS(svgNS,'path');el.setAttribute('d',`M ${a.x} ${a.y} Q ${cpx} ${cpy} ${b.x} ${b.y}`);el.setAttribute('stroke','#60a5fa');el.setAttribute('stroke-width','0.5');el.setAttribute('fill','none');gt.appendChild(el);}
      else{const el=document.createElementNS(svgNS,'line');el.setAttribute('x1',a.x);el.setAttribute('y1',a.y);el.setAttribute('x2',b.x);el.setAttribute('y2',b.y);el.setAttribute('stroke',ln.type==='fold'?'#f87171':'#e2e8f0');el.setAttribute('stroke-width','0.5');if(ln.type==='fold')el.setAttribute('stroke-dasharray','4,2');gt.appendChild(el);}
    });
    Object.entries(_points).forEach(([,p])=>{
      const c=document.createElementNS(svgNS,'circle');c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);c.setAttribute('r','1.5');c.setAttribute('fill','#8b5cf6');gt.appendChild(c);
      const t=document.createElementNS(svgNS,'text');t.setAttribute('x',p.x+2.5);t.setAttribute('y',p.y-1.5);t.setAttribute('font-size','4');t.setAttribute('fill','#a78bfa');t.setAttribute('font-family','Arial');t.setAttribute('font-weight','bold');t.textContent=p.name;gt.appendChild(t);
    });
    const nt=document.createElementNS(svgNS,'text');nt.setAttribute('x',W/2);nt.setAttribute('y',H/2);nt.setAttribute('font-size','5');nt.setAttribute('fill','#ede9fe');nt.setAttribute('font-family','Arial');nt.setAttribute('font-weight','bold');nt.setAttribute('text-anchor','middle');nt.textContent=_pieceName;gt.appendChild(nt);
    g.appendChild(gt);
    const content=document.getElementById('pattern-content');if(!content){if(PAT.App)PAT.App.toast('SVG no encontrado','error');return;}
    let ox=30,oy=30;try{const eb=content.getBBox();if(eb.width>0)ox=eb.x+eb.width+35;}catch(e){}
    g.setAttribute('transform',`translate(${ox},${oy})`);g.setAttribute('class','manual-piece');
    content.appendChild(g);
    close();
    if(PAT.App){PAT.App.toast('✅ "'+_pieceName+'" agregado','success');if(PAT.App.fitScreen)setTimeout(PAT.App.fitScreen,120);}
  }

  return { open, close };
})();
