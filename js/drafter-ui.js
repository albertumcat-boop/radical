/**
 * drafter-ui.js v3.0 — Editor Visual de Patronaje
 * Menú desplegable por pieza, ajuste de cada punto con inputs,
 * preview en vivo sin necesidad de escribir código.
 */
'use strict';
window.PAT = window.PAT || {};

PAT.DrafterUI = (function () {

  const MK = 'pat_manuals';
  const NS = 'http://www.w3.org/2000/svg';

  // ══════════════════════════════════════════════════════════════
  // DEFINICIÓN DE PIEZAS — cada punto tiene parámetros ajustables
  // La fórmula base usa variables de medidas (B4, TALLE_ESP, etc.)
  // El usuario puede ajustar el OFFSET de cada punto
  // ══════════════════════════════════════════════════════════════
  const PIECES = {

    'blusa-trasera': {
      name: 'Blusa — Parte Trasera',
      garment: 'blusa',
      description: 'Blusa básica sistema Müller & Sohn',
      icon: '👚',
      points: [
        { id:'A',  label:'A — Origen (CB nuca)',      base:'0',    dir:'abs',    x:0,  y:0,  xOff:0, yOff:0, xLocked:true, yLocked:true },
        { id:'B',  label:'B — Ancho del bloque',      base:'B4',   dir:'der',    ref:'A', xOff:0, yOff:0, desc:'Busto ÷ 4' },
        { id:'C',  label:'C — Largo espalda (inf der)',base:'TALLE_ESP', dir:'abajo', ref:'B', xOff:0, yOff:0, desc:'Talle espalda' },
        { id:'D',  label:'D — CB cintura (inf izq)',   base:'TALLE_ESP', dir:'abajo', ref:'A', xOff:0, yOff:0, desc:'Talle espalda' },
        { id:'1',  label:'1 — Ancho cuello',          base:'B6',   dir:'der',    ref:'A', xOff:0, yOff:0, desc:'Busto ÷ 6' },
        { id:'2',  label:'2 — Prof. cuello trasero',  base:'20',   dir:'abajo',  ref:'A', xOff:0, yOff:0, desc:'Fijo ~2cm' },
        { id:'2A', label:'2A — Caída hombro',         base:'10',   dir:'abajo',  ref:'1', xOff:0, yOff:0, desc:'Caída ~1cm' },
        { id:'3',  label:'3 — Punta hombro',          base:'E2',   dir:'der',    ref:'2A', xOff:0, yOff:-20, desc:'Espalda ÷ 2, sube 2cm' },
        { id:'E',  label:'E — Prof. sisa lateral',    base:'B4',   dir:'abajo',  ref:'B', xOff:0, yOff:0, desc:'Busto ÷ 4' },
        { id:'F',  label:'F — Costado cintura',       base:'TALLE_ESP', dir:'abajo', ref:'B', xOff:0, yOff:0, desc:'Talle espalda' },
      ],
      lines: [
        { type:'curve', from:'2',  to:'1',  ctrl:-8,  label:'Curva cuello' },
        { type:'line',  from:'1',  to:'3',  label:'Línea hombro' },
        { type:'curve', from:'3',  to:'E',  semi:15,  label:'Sisa' },
        { type:'line',  from:'E',  to:'F',  label:'Costado' },
        { type:'line',  from:'F',  to:'C',  label:'Bajo costado' },
        { type:'line',  from:'C',  to:'D',  label:'Dobladillo' },
        { type:'fold',  from:'D',  to:'A',  label:'CB — Doblez' },
      ],
    },

    'blusa-delantera': {
      name: 'Blusa — Parte Delantera',
      garment: 'blusa',
      description: 'Blusa básica con pinza de busto',
      icon: '👗',
      points: [
        { id:'A',  label:'A — CF nuca (doblez)',      base:'0',    dir:'abs',  x:0,  y:0,  xLocked:true, yLocked:true },
        { id:'B',  label:'B — Ancho bloque',          base:'B4',   dir:'der',  ref:'A', xOff:0, yOff:0, desc:'Busto ÷ 4' },
        { id:'C',  label:'C — Bajo delantero der',    base:'TALLE_DEL', dir:'abajo', ref:'B', xOff:0, yOff:0, desc:'Talle delantero' },
        { id:'D',  label:'D — CF cintura',            base:'TALLE_DEL', dir:'abajo', ref:'A', xOff:0, yOff:0, desc:'Talle delantero' },
        { id:'1',  label:'1 — Ancho cuello',          base:'B6',   dir:'der',  ref:'A', xOff:0, yOff:0, desc:'Busto ÷ 6' },
        { id:'2',  label:'2 — Prof. cuello delantero',base:'B6',   dir:'abajo', ref:'A', xOff:0, yOff:0, desc:'Más profundo que trasero' },
        { id:'2A', label:'2A — Caída hombro',         base:'10',   dir:'abajo', ref:'1', xOff:0, yOff:0, desc:'~1cm' },
        { id:'3',  label:'3 — Punta hombro',          base:'E2',   dir:'der',  ref:'2A', xOff:0, yOff:-20, desc:'Espalda ÷ 2, sube 2cm' },
        { id:'4',  label:'4 — Prof. sisa delantera',  base:'B4',   dir:'abajo', ref:'B', xOff:0, yOff:0, desc:'Busto ÷ 4' },
        { id:'E',  label:'E — Base costado',          base:'TALLE_DEL', dir:'abajo', ref:'B', xOff:0, yOff:0, desc:'Talle delantero' },
      ],
      lines: [
        { type:'curve', from:'2',  to:'1',  ctrl:-12, label:'Curva cuello' },
        { type:'line',  from:'1',  to:'3',  label:'Hombro' },
        { type:'curve', from:'3',  to:'4',  semi:12,  label:'Sisa' },
        { type:'line',  from:'4',  to:'E',  label:'Costado' },
        { type:'line',  from:'E',  to:'D',  label:'Dobladillo' },
        { type:'fold',  from:'D',  to:'A',  label:'CF — Doblez' },
      ],
    },

    'camisa-posterior': {
      name: 'Camisa — Parte Posterior',
      garment: 'camisa',
      description: 'Camisa clásica sistema Atelier Escuela',
      icon: '👔',
      points: [
        { id:'A',  label:'A — CB nuca',               base:'0',       dir:'abs',   x:0, y:0, xLocked:true, yLocked:true },
        { id:'B',  label:'B — Ancho bloque',           base:'B4',      dir:'der',   ref:'A', xOff:20, yOff:0, desc:'Busto ÷ 4 + 2cm' },
        { id:'C',  label:'C — Largo inferior der',     base:'LARGO',   dir:'abajo', ref:'B', xOff:0, yOff:0, desc:'Largo camisa' },
        { id:'D',  label:'D — CB bajo',               base:'LARGO',   dir:'abajo', ref:'A', xOff:0, yOff:0, desc:'Largo camisa' },
        { id:'1',  label:'1 — Cuello (sexta espalda)', base:'ESPALDA', dir:'der',   ref:'A', xOff:0, yOff:0, desc:'Espalda ÷ 6' },
        { id:'2',  label:'2 — Caída hombro',          base:'10',      dir:'abajo', ref:'1', xOff:0, yOff:0, desc:'~1cm caída' },
        { id:'3',  label:'3 — Punta hombro',          base:'E2',      dir:'der',   ref:'2', xOff:-20, yOff:0, desc:'Espalda ÷ 2 - 2cm' },
        { id:'E',  label:'E — Sisa lateral',          base:'ESPALDA', dir:'abajo', ref:'B', xOff:0, yOff:20, desc:'Espalda ÷ 6 + 2cm' },
      ],
      lines: [
        { type:'curve', from:'2', to:'1',  ctrl:-10, label:'Cuello' },
        { type:'line',  from:'1', to:'3',  label:'Hombro' },
        { type:'curve', from:'3', to:'E',  semi:20,  label:'Sisa' },
        { type:'line',  from:'E', to:'C',  label:'Costado' },
        { type:'line',  from:'C', to:'D',  label:'Dobladillo' },
        { type:'fold',  from:'D', to:'A',  label:'CB — Doblez' },
      ],
    },

    'manga-larga': {
      name: 'Manga Larga',
      garment: 'camisa',
      description: 'Manga larga para camisa o blusa',
      icon: '🫱',
      points: [
        { id:'A',   label:'A — Extremo izq base manga', base:'0',      dir:'abs',   x:0, y:0, xLocked:true, yLocked:true },
        { id:'B',   label:'B — Extremo der base manga', base:'E2',     dir:'der',   ref:'A', xOff:10, yOff:0, desc:'Espalda ÷ 2 + 1cm' },
        { id:'C',   label:'C — Muñeca izq',            base:'MANGA',  dir:'abajo', ref:'A', xOff:0,  yOff:0, desc:'Largo manga' },
        { id:'D',   label:'D — Muñeca der',            base:'E2',     dir:'der',   ref:'C', xOff:10, yOff:0, desc:'Espalda ÷ 2 + 1cm' },
        { id:'P1',  label:'P1 — Ctrl sisa izq',        base:'B10',    dir:'der',   ref:'A', xOff:0,  yOff:0, desc:'Busto ÷ 10' },
        { id:'P3',  label:'P3 — Pico cabeza manga',    base:'E2',     dir:'der',   ref:'A', xOff:10, yOff:0, desc:'Sube: Espalda ÷ 6', extra:'arriba', extraBase:'ESPALDA', extraDiv:6 },
      ],
      lines: [
        { type:'curve', from:'A',  to:'P1', ctrl:-20, label:'Sisa izq' },
        { type:'curve', from:'P1', to:'P3', ctrl:15,  label:'Cabeza manga' },
        { type:'curve', from:'P3', to:'B',  ctrl:-10, label:'Sisa der' },
        { type:'line',  from:'B',  to:'D',  label:'Costado der' },
        { type:'line',  from:'D',  to:'C',  label:'Dobladillo' },
        { type:'line',  from:'C',  to:'A',  label:'Costado izq' },
      ],
    },

    'falda-frente': {
      name: 'Falda Recta — Frente',
      garment: 'falda',
      description: 'Falda recta clásica',
      icon: '👗',
      points: [
        { id:'A',  label:'A — Cintura izq',          base:'0',          dir:'abs',   x:0, y:0, xLocked:true, yLocked:true },
        { id:'B',  label:'B — Cintura der',          base:'H4',         dir:'der',   ref:'A', xOff:0, yOff:0, desc:'Cadera ÷ 4' },
        { id:'C',  label:'C — Bajo der',             base:'FALDA',      dir:'abajo', ref:'B', xOff:0, yOff:0, desc:'Largo falda' },
        { id:'D',  label:'D — Bajo izq',             base:'FALDA',      dir:'abajo', ref:'A', xOff:0, yOff:0, desc:'Largo falda' },
        { id:'A1', label:'A1 — Ajuste cintura izq',  base:'5',          dir:'arriba', ref:'A', xOff:0, yOff:0, desc:'Sube ~0.5cm' },
        { id:'B1', label:'B1 — Ajuste cintura der',  base:'15',         dir:'abajo', ref:'B', xOff:0, yOff:0, desc:'Baja ~1.5cm' },
        { id:'PX', label:'PX — Centro pinza X',      base:'H4',         dir:'der',   ref:'A', xOff:0, yOff:0, desc:'Cadera ÷ 4 ÷ 2', div:2 },
        { id:'PT', label:'PT — Punta sup. pinza',    base:'15',         dir:'abajo', ref:'PX', xOff:0, yOff:0, desc:'~1.5cm' },
        { id:'PB', label:'PB — Punta inf. pinza',    base:'CADERA_PROF',dir:'abajo', ref:'PX', xOff:0, yOff:-20, desc:'Prof. cadera - 2cm' },
      ],
      lines: [
        { type:'curve', from:'A1', to:'PT', ctrl:-8, label:'Cintura izq' },
        { type:'line',  from:'PT', to:'PB', label:'Pinza (costura)' },
        { type:'curve', from:'PB', to:'B1', ctrl:8,  label:'Cintura der' },
        { type:'line',  from:'B1', to:'C',  label:'Costado' },
        { type:'line',  from:'C',  to:'D',  label:'Dobladillo' },
        { type:'fold',  from:'D',  to:'A1', label:'CF — Doblez' },
      ],
    },

    'cuello-camisero': {
      name: 'Cuello Camisero',
      garment: 'camisa',
      description: 'Cuello clásico con pie y pala',
      icon: '🔘',
      points: [
        { id:'A',     label:'A — Base izq',         base:'0',      dir:'abs',   x:0, y:0, xLocked:true, yLocked:true },
        { id:'B',     label:'B — Base der',         base:'CUELLO', dir:'der',   ref:'A', xOff:0, yOff:0, desc:'Cuello ÷ 2' },
        { id:'C',     label:'C — Bajo der',         base:'40',     dir:'abajo', ref:'B', xOff:0, yOff:0, desc:'Ancho ~4cm' },
        { id:'PUNTA', label:'Punta — Vuelo cuello', base:'25',     dir:'der',   ref:'B', xOff:0, yOff:20, desc:'Vuelo + bajada' },
        { id:'D',     label:'D — Bajo izq',         base:'40',     dir:'abajo', ref:'A', xOff:0, yOff:0, desc:'Ancho ~4cm' },
        { id:'PA',    label:'PA — Pie base izq',    base:'80',     dir:'abajo', ref:'A', xOff:0, yOff:0, desc:'Separación del cuello' },
        { id:'PB2',   label:'PB — Pie base der',    base:'CUELLO', dir:'der',   ref:'PA', xOff:0, yOff:0, desc:'Cuello ÷ 2' },
        { id:'PC',    label:'PC — Pie bajo der',    base:'35',     dir:'abajo', ref:'PB2', xOff:0, yOff:0, desc:'Pie ~3.5cm' },
        { id:'PD',    label:'PD — Pie bajo izq',    base:'35',     dir:'abajo', ref:'PA', xOff:0, yOff:0, desc:'Pie ~3.5cm' },
      ],
      lines: [
        { type:'line',  from:'A',    to:'B',    label:'Cuello superior' },
        { type:'line',  from:'B',    to:'PUNTA',label:'Pala' },
        { type:'curve', from:'PUNTA',to:'C',    ctrl:5, label:'Punta cuello' },
        { type:'line',  from:'C',    to:'D',    label:'Base cuello' },
        { type:'line',  from:'D',    to:'A',    label:'Lado izq' },
        { type:'fold',  from:'A',    to:'B',    label:'Doblez' },
        { type:'curve', from:'PA',  to:'PB2',   ctrl:-8, label:'Pie superior' },
        { type:'line',  from:'PB2', to:'PC',    label:'Pie der' },
        { type:'line',  from:'PC',  to:'PD',    label:'Pie base' },
        { type:'line',  from:'PD',  to:'PA',    label:'Pie izq' },
      ],
    },

  };

  // ── Estado ──────────────────────────────────────────────────
  let _modal        = null;
  let _currentPiece = null;
  let _adjustments  = {}; // { pointId: { xOff, yOff, ctrl } }
  let _curManualKey = null;
  let _previewSVG   = null;

  // ════════════════════════════════════════════════════════════
  // OPEN / CLOSE
  // ════════════════════════════════════════════════════════════
  function open() {
    if (_modal) { _modal.classList.add('open'); return; }
    _injectStyles();
    _buildUI();
  }
  function close() { if (_modal) _modal.classList.remove('open'); }

  // ════════════════════════════════════════════════════════════
  // CSS
  // ════════════════════════════════════════════════════════════
  function _injectStyles() {
    if (document.getElementById('dv3-css')) return;
    const s = document.createElement('style');
    s.id = 'dv3-css';
    s.textContent = `
      #dv3-modal { z-index:700 }
      .dv3-panel {
        position:relative;z-index:1;background:var(--panel);
        border:1px solid var(--brd2);border-radius:16px;
        width:min(1140px,97vw);max-height:96vh;
        display:flex;flex-direction:column;
        box-shadow:0 24px 64px rgba(0,0,0,.9);overflow:hidden;
      }
      .dv3-hdr {
        display:flex;align-items:center;justify-content:space-between;
        padding:14px 20px;border-bottom:1px solid var(--brd);
        background:linear-gradient(135deg,rgba(139,92,246,.1),transparent);
        flex-shrink:0;gap:12px;
      }
      .dv3-hdr-l { display:flex;align-items:center;gap:12px }
      .dv3-hdr-l h2 { font-size:15px;font-weight:800 }
      .dv3-hdr-l p  { font-size:11px;color:var(--tx3);margin-top:1px }
      .dv3-hdr-r { display:flex;gap:8px;align-items:center }

      /* Body — 3 columnas */
      .dv3-body { display:grid;grid-template-columns:240px 1fr 280px;flex:1;overflow:hidden;min-height:0 }
      @media(max-width:900px){.dv3-body{grid-template-columns:1fr}.dv3-col-l,.dv3-col-r{display:none}}

      /* Col izq — piezas */
      .dv3-col-l { border-right:1px solid var(--brd);display:flex;flex-direction:column;overflow:hidden }
      .dv3-col-title {
        font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--tx3);
        padding:10px 14px 7px;border-bottom:1px solid var(--brd);flex-shrink:0;
        display:flex;align-items:center;justify-content:space-between;
      }
      .dv3-pieces-list { flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:4px }
      .dv3-piece-btn {
        display:flex;align-items:center;gap:10px;
        padding:9px 12px;border-radius:8px;border:1.5px solid var(--brd);
        background:var(--inp);cursor:pointer;transition:all .15s;text-align:left;
        font-family:var(--font);width:100%;
      }
      .dv3-piece-btn:hover { background:var(--hov);border-color:var(--brd2) }
      .dv3-piece-btn.active { background:var(--accbg);border-color:var(--acc) }
      .dv3-piece-icon { font-size:18px;flex-shrink:0 }
      .dv3-piece-nm { font-size:11px;font-weight:700;color:var(--tx);line-height:1.3 }
      .dv3-piece-desc { font-size:9px;color:var(--tx3);margin-top:1px }

      /* Col centro — puntos ajustables */
      .dv3-col-m { display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--brd) }
      .dv3-piece-header {
        padding:12px 16px;border-bottom:1px solid var(--brd);flex-shrink:0;
        background:rgba(139,92,246,.05);
      }
      .dv3-piece-header h3 { font-size:14px;font-weight:800;margin-bottom:2px }
      .dv3-piece-header p  { font-size:11px;color:var(--tx3) }

      .dv3-points-scroll { flex:1;overflow-y:auto;padding:10px 14px }
      .dv3-point-card {
        background:var(--inp);border:1.5px solid var(--brd);border-radius:10px;
        padding:12px 14px;margin-bottom:8px;transition:border-color .15s;
      }
      .dv3-point-card:hover { border-color:var(--brd2) }
      .dv3-point-card.highlighted { border-color:var(--acc);background:var(--accbg) }

      .dv3-pt-header {
        display:flex;align-items:center;gap:10px;margin-bottom:10px;
      }
      .dv3-pt-badge {
        width:28px;height:28px;border-radius:6px;
        background:var(--acc);color:#fff;
        font-size:11px;font-weight:800;
        display:flex;align-items:center;justify-content:center;
        flex-shrink:0;font-family:monospace;
      }
      .dv3-pt-name { font-size:12px;font-weight:700;color:var(--tx);flex:1 }
      .dv3-pt-desc { font-size:10px;color:var(--tx3) }
      .dv3-pt-coords {
        font-size:10px;color:var(--acc2);font-family:monospace;font-weight:600;
      }

      /* Slider row */
      .dv3-slider-row {
        display:flex;align-items:center;gap:10px;margin-bottom:6px;
      }
      .dv3-slider-lbl { font-size:10px;color:var(--tx3);width:90px;flex-shrink:0 }
      .dv3-slider {
        flex:1;-webkit-appearance:none;appearance:none;
        height:4px;background:var(--brd2);border-radius:2px;outline:none;cursor:pointer;
      }
      .dv3-slider::-webkit-slider-thumb {
        -webkit-appearance:none;width:14px;height:14px;border-radius:50%;
        background:var(--acc);cursor:pointer;box-shadow:0 0 6px rgba(139,92,246,.5);
      }
      .dv3-slider::-moz-range-thumb {
        width:14px;height:14px;border-radius:50%;background:var(--acc);cursor:pointer;border:none;
      }
      .dv3-num-inp {
        width:60px;background:var(--bg);border:1.5px solid var(--brd);
        color:var(--tx);border-radius:6px;padding:4px 8px;
        font-size:11px;font-family:monospace;text-align:right;outline:none;
        transition:border-color .15s;
      }
      .dv3-num-inp:focus { border-color:var(--acc) }
      .dv3-unit { font-size:10px;color:var(--tx3);width:20px;flex-shrink:0 }

      /* Sección de líneas */
      .dv3-lines-section { padding:10px 14px;border-top:1px solid var(--brd);flex-shrink:0 }
      .dv3-lines-title { font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--tx3);margin-bottom:8px }
      .dv3-line-row {
        display:flex;align-items:center;gap:8px;padding:5px 8px;
        border-radius:6px;background:var(--inp);margin-bottom:4px;
        font-size:11px;color:var(--tx2);
      }
      .dv3-line-type {
        width:28px;height:3px;border-radius:1px;flex-shrink:0;
      }
      .dv3-line-ctrl-row { display:flex;align-items:center;gap:8px;flex:1 }
      .dv3-line-lbl { flex:1 }
      .dv3-line-num {
        width:50px;background:var(--bg);border:1px solid var(--brd);
        color:var(--tx);border-radius:5px;padding:3px 6px;
        font-size:10px;font-family:monospace;text-align:right;outline:none;
      }
      .dv3-line-num:focus { border-color:var(--acc) }

      /* Acciones */
      .dv3-actions { display:flex;gap:8px;padding:10px 14px;border-top:1px solid var(--brd);flex-shrink:0;flex-wrap:wrap }
      .dv3-btn-p {
        background:linear-gradient(135deg,var(--acc),#6d28d9);color:#fff;border:none;
        border-radius:var(--r);padding:9px 16px;font-size:12px;font-weight:700;
        cursor:pointer;font-family:var(--font);transition:all .15s;
      }
      .dv3-btn-p:hover { filter:brightness(1.1);transform:translateY(-1px) }
      .dv3-btn-s { background:var(--inp);border:1.5px solid var(--brd2);color:var(--tx);border-radius:var(--r);padding:9px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s }
      .dv3-btn-s:hover { background:var(--hov) }
      .dv3-btn-g { background:transparent;border:1.5px solid var(--brd);color:var(--tx2);border-radius:var(--r);padding:8px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s }
      .dv3-btn-g:hover { background:var(--inp);color:var(--tx) }
      .dv3-btn-add { background:rgba(52,211,153,.1);border:1.5px solid rgba(52,211,153,.3);color:#34d399;border-radius:var(--r);padding:9px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s }
      .dv3-btn-add:hover { background:rgba(52,211,153,.2) }

      /* Col der — preview */
      .dv3-col-r { display:flex;flex-direction:column;overflow:hidden }
      .dv3-preview-wrap { flex:1;background:#080810;position:relative;overflow:hidden;min-height:0 }
      #dv3-svg { width:100%;height:100% }
      .dv3-info-bar {
        padding:10px 14px;border-top:1px solid var(--brd);flex-shrink:0;
        display:flex;flex-direction:column;gap:4px;
      }
      .dv3-info-row { display:flex;justify-content:space-between;font-size:11px }
      .dv3-info-lbl { color:var(--tx3) }
      .dv3-info-val { color:var(--tx);font-weight:700;font-family:monospace }

      /* Vars badge */
      .dv3-var-pill {
        display:inline-flex;align-items:center;gap:4px;
        background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.2);
        color:var(--acc2);border-radius:12px;padding:2px 8px;font-size:10px;
        font-family:monospace;font-weight:600;cursor:help;white-space:nowrap;
      }

      /* Saved list */
      .dv3-saved-lbl { font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--tx3);padding:8px 8px 3px }
      .dv3-saved-item {
        display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:7px;
        background:var(--inp);border:1.5px solid var(--brd);cursor:pointer;
        font-size:11px;transition:all .15s;margin-bottom:3px;
      }
      .dv3-saved-item:hover { background:var(--hov);border-color:var(--brd2) }
      .dv3-saved-item.active { background:var(--accbg);border-color:var(--acc) }
      .dv3-saved-nm { font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--tx) }
      .dv3-saved-tp { font-size:9px;color:var(--tx3) }
      .dv3-del-btn { background:none;border:none;color:var(--tx3);cursor:pointer;font-size:11px;padding:1px 3px;line-height:1 }
      .dv3-del-btn:hover { color:var(--red) }

      /* No piece selected */
      .dv3-empty {
        flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:12px;color:var(--tx3);padding:40px;text-align:center;
      }
      .dv3-empty-icon { font-size:48px;opacity:.4 }
      .dv3-empty h3 { font-size:14px;font-weight:700;color:var(--tx2) }
      .dv3-empty p  { font-size:12px;line-height:1.6 }
    `;
    document.head.appendChild(s);
  }

  // ════════════════════════════════════════════════════════════
  // BUILD UI
  // ════════════════════════════════════════════════════════════
  function _buildUI() {
    _modal = document.createElement('div');
    _modal.id = 'dv3-modal';
    _modal.className = 'modal open';

    _modal.innerHTML = `
      <div class="m-ov" id="dv3-ov"></div>
      <div class="dv3-panel">

        <!-- HEADER -->
        <div class="dv3-hdr">
          <div class="dv3-hdr-l">
            <span style="font-size:22px">✏️</span>
            <div>
              <h2>Editor Visual de Patronaje</h2>
              <p>Selecciona la pieza · Ajusta cada punto · Preview en vivo</p>
            </div>
          </div>
          <div class="dv3-hdr-r">
            <button class="dv3-btn-g" id="dv3-reset-btn">↺ Resetear</button>
            <button class="m-close" id="dv3-close">✕</button>
          </div>
        </div>

        <!-- BODY -->
        <div class="dv3-body">

          <!-- COL IZQ: lista de piezas + guardados -->
          <div class="dv3-col-l">
            <div class="dv3-col-title">
              Tipo de pieza
            </div>
            <div class="dv3-pieces-list" id="dv3-pieces-list"></div>

            <div style="border-top:1px solid var(--brd);flex-shrink:0">
              <div class="dv3-col-title" style="border-bottom:none">
                Mis patrones guardados
                <button class="dv3-btn-g" id="dv3-new-btn" style="padding:3px 7px;font-size:9px">+ Nuevo</button>
              </div>
              <div style="padding:6px;max-height:160px;overflow-y:auto" id="dv3-saved-list"></div>
            </div>
          </div>

          <!-- COL CENTRO: puntos ajustables -->
          <div class="dv3-col-m" id="dv3-col-m">
            <div class="dv3-empty" id="dv3-empty">
              <div class="dv3-empty-icon">✂</div>
              <h3>Selecciona una pieza</h3>
              <p>Elige el tipo de pieza en la lista de la izquierda para comenzar a ajustar los puntos de tu patrón.</p>
            </div>
          </div>

          <!-- COL DER: preview -->
          <div class="dv3-col-r">
            <div class="dv3-col-title" style="padding:10px 14px">
              Vista previa en vivo
              <span id="dv3-scale-tag" style="font-size:9px;color:var(--tx3);font-weight:400">—</span>
            </div>
            <div class="dv3-preview-wrap">
              <svg id="dv3-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
                <defs>
                  <pattern id="dv3-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M50 0L0 0 0 50" fill="none" stroke="rgba(255,255,255,.04)" stroke-width=".5"/>
                  </pattern>
                  <marker id="dv3-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6"/>
                  </marker>
                  <marker id="dv3-arrow-rev" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                    <path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6"/>
                  </marker>
                </defs>
                <rect x="-9999" y="-9999" width="19998" height="19998" fill="url(#dv3-grid)"/>
                <g id="dv3-pattern-g"></g>
              </svg>
            </div>
            <div class="dv3-info-bar">
              <div class="dv3-info-row"><span class="dv3-info-lbl">Tamaño aprox.</span><span class="dv3-info-val" id="dv3-size">—</span></div>
              <div class="dv3-info-row"><span class="dv3-info-lbl">Puntos</span><span class="dv3-info-val" id="dv3-pts-count">0</span></div>
              <div class="dv3-info-row"><span class="dv3-info-lbl">Medidas base</span><span class="dv3-info-val" id="dv3-bust-val">88cm</span></div>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(_modal);
    _previewSVG = document.getElementById('dv3-svg');

    // Poblar lista de piezas
    const list = document.getElementById('dv3-pieces-list');
    Object.entries(PIECES).forEach(([key, piece]) => {
      const btn = document.createElement('button');
      btn.className = 'dv3-piece-btn';
      btn.dataset.key = key;
      btn.innerHTML = `
        <span class="dv3-piece-icon">${piece.icon}</span>
        <div>
          <div class="dv3-piece-nm">${piece.name}</div>
          <div class="dv3-piece-desc">${piece.description}</div>
        </div>
      `;
      btn.addEventListener('click', () => _selectPiece(key));
      list.appendChild(btn);
    });

    // Eventos
    document.getElementById('dv3-ov').onclick    = close;
    document.getElementById('dv3-close').onclick = close;
    document.getElementById('dv3-reset-btn').onclick = _resetAdjustments;
    document.getElementById('dv3-new-btn').onclick   = () => { _curManualKey = null; _refreshSaved(); };

    _refreshSaved();

    // Seleccionar primera pieza por defecto
    _selectPiece(Object.keys(PIECES)[0]);
  }

  // ════════════════════════════════════════════════════════════
  // SELECCIONAR PIEZA
  // ════════════════════════════════════════════════════════════
  function _selectPiece(key) {
    _currentPiece = key;
    _adjustments  = {};

    // Inicializar adjustments desde la definición
    const piece = PIECES[key];
    piece.points.forEach(pt => {
      _adjustments[pt.id] = {
        xOff: pt.xOff || 0,
        yOff: pt.yOff || 0,
        ctrl: 0,
      };
    });
    // Inicializar líneas con sus controles
    piece.lines.forEach((ln, i) => {
      _adjustments['line_' + i] = {
        ctrl: ln.ctrl || ln.semi || 0,
      };
    });

    // Marcar botón activo
    document.querySelectorAll('.dv3-piece-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.key === key);
    });

    // Construir UI de puntos
    _buildPointsUI(piece);

    // Actualizar preview
    _updatePreview();
  }

  // ════════════════════════════════════════════════════════════
  // CONSTRUIR UI DE PUNTOS
  // ════════════════════════════════════════════════════════════
  function _buildPointsUI(piece) {
    const col = document.getElementById('dv3-col-m');
    const measures = _getMeasures();
    const vars = _buildVars(measures);

    col.innerHTML = `
      <div class="dv3-piece-header">
        <h3>${piece.icon} ${piece.name}</h3>
        <p>${piece.description}</p>
      </div>
      <div class="dv3-points-scroll" id="dv3-points-scroll">
        ${piece.points.map(pt => _buildPointCard(pt, vars)).join('')}
      </div>
      <div class="dv3-lines-section">
        <div class="dv3-lines-title">Líneas del contorno — ajustar curvas</div>
        ${piece.lines.map((ln, i) => _buildLineRow(ln, i)).join('')}
      </div>
      <div class="dv3-actions">
        <button class="dv3-btn-p" id="dv3-add-btn">＋ Agregar al patrón</button>
        <button class="dv3-btn-s" id="dv3-save-btn">💾 Guardar</button>
        <button class="dv3-btn-g" id="dv3-reset-pts">↺ Resetear puntos</button>
      </div>
    `;

    // Bind sliders e inputs
    _bindPointControls(piece);

    document.getElementById('dv3-add-btn').onclick  = _addToPattern;
    document.getElementById('dv3-save-btn').onclick  = _saveManual;
    document.getElementById('dv3-reset-pts').onclick = _resetAdjustments;
  }

  function _buildPointCard(pt, vars) {
    if (pt.xLocked && pt.yLocked) {
      return `
        <div class="dv3-point-card" id="ptcard-${pt.id}">
          <div class="dv3-pt-header">
            <div class="dv3-pt-badge">${pt.id}</div>
            <div>
              <div class="dv3-pt-name">${pt.label}</div>
              <div class="dv3-pt-coords" id="ptcoord-${pt.id}">x:0 · y:0</div>
            </div>
            <span style="font-size:10px;color:var(--tx3);margin-left:auto">🔒 Origen fijo</span>
          </div>
        </div>
      `;
    }

    const baseVal = _evalBase(pt.base, vars);
    const adj = _adjustments[pt.id] || { xOff:0, yOff:0 };

    const xDir = ['der','izq'].includes(pt.dir) ? pt.dir : 'der';
    const yDir = ['abajo','arriba'].includes(pt.dir) ? pt.dir : 'abajo';
    const isXMain = ['der','izq'].includes(pt.dir);

    return `
      <div class="dv3-point-card" id="ptcard-${pt.id}">
        <div class="dv3-pt-header">
          <div class="dv3-pt-badge">${pt.id}</div>
          <div style="flex:1">
            <div class="dv3-pt-name">${pt.label}</div>
            ${pt.desc ? `<div class="dv3-pt-desc">${pt.desc}</div>` : ''}
          </div>
          <span class="dv3-pt-coords" id="ptcoord-${pt.id}">—</span>
        </div>

        <!-- Ajuste principal -->
        <div class="dv3-slider-row">
          <span class="dv3-slider-lbl">
            Base <span style="color:var(--acc2);font-family:monospace">${pt.base}</span>
          </span>
          <span style="font-size:10px;color:var(--tx2);font-family:monospace;width:60px;text-align:right">
            = ${Math.round(baseVal)}mm
          </span>
        </div>

        <!-- Offset X -->
        <div class="dv3-slider-row">
          <span class="dv3-slider-lbl" style="color:${isXMain?'var(--tx)':'var(--tx3)'}">
            Ajuste ${isXMain ? (pt.dir === 'der' ? '→ Derecha' : '← Izquierda') : '↔ X'}
          </span>
          <input type="range" class="dv3-slider" id="sx-${pt.id}"
            min="-100" max="100" step="1" value="${adj.xOff}"
            style="${!isXMain ? 'opacity:.5' : ''}">
          <input type="number" class="dv3-num-inp" id="nx-${pt.id}"
            value="${adj.xOff}" min="-200" max="200" step="1">
          <span class="dv3-unit">mm</span>
        </div>

        <!-- Offset Y -->
        <div class="dv3-slider-row">
          <span class="dv3-slider-lbl" style="color:${!isXMain?'var(--tx)':'var(--tx3)'}">
            Ajuste ${!isXMain ? (pt.dir === 'abajo' ? '↓ Abajo' : '↑ Arriba') : '↕ Y'}
          </span>
          <input type="range" class="dv3-slider" id="sy-${pt.id}"
            min="-100" max="100" step="1" value="${adj.yOff}"
            style="${isXMain ? 'opacity:.5' : ''}">
          <input type="number" class="dv3-num-inp" id="ny-${pt.id}"
            value="${adj.yOff}" min="-200" max="200" step="1">
          <span class="dv3-unit">mm</span>
        </div>
      </div>
    `;
  }

  function _buildLineRow(ln, i) {
    const adj = _adjustments['line_' + i] || { ctrl: ln.ctrl || ln.semi || 0 };
    const type = ln.type;
    const color = type === 'fold' ? '#f87171' : type === 'curve' ? '#60a5fa' : '#e2e8f0';
    const bgStyle = type === 'fold'
      ? 'repeating-linear-gradient(90deg,#f87171 0,#f87171 4px,transparent 4px,transparent 8px)'
      : type === 'curve' ? '#60a5fa' : '#e2e8f0';

    const hasCurve = type === 'curve';

    return `
      <div class="dv3-line-row">
        <div class="dv3-line-type" style="background:${bgStyle}"></div>
        <span class="dv3-line-lbl">${ln.label || ln.from + ' → ' + ln.to}</span>
        ${hasCurve ? `
          <div class="dv3-line-ctrl-row">
            <span style="font-size:10px;color:var(--tx3)">curva</span>
            <input type="range" class="dv3-slider" id="lc-${i}"
              min="-60" max="60" step="1" value="${adj.ctrl}" style="width:70px">
            <input type="number" class="dv3-line-num" id="ln-${i}"
              value="${adj.ctrl}" min="-100" max="100" step="1">
          </div>
        ` : ''}
      </div>
    `;
  }

  // ════════════════════════════════════════════════════════════
  // BIND CONTROLES
  // ════════════════════════════════════════════════════════════
  function _bindPointControls(piece) {
    // Bind puntos
    piece.points.forEach(pt => {
      if (pt.xLocked && pt.yLocked) return;

      const sxEl = document.getElementById('sx-' + pt.id);
      const syEl = document.getElementById('sy-' + pt.id);
      const nxEl = document.getElementById('nx-' + pt.id);
      const nyEl = document.getElementById('ny-' + pt.id);

      if (!_adjustments[pt.id]) _adjustments[pt.id] = { xOff:0, yOff:0 };

      const syncX = (val) => {
        val = parseFloat(val);
        _adjustments[pt.id].xOff = val;
        if (sxEl) sxEl.value = val;
        if (nxEl) nxEl.value = val;
        _highlightCard(pt.id);
        _updatePreview();
      };
      const syncY = (val) => {
        val = parseFloat(val);
        _adjustments[pt.id].yOff = val;
        if (syEl) syEl.value = val;
        if (nyEl) nyEl.value = val;
        _highlightCard(pt.id);
        _updatePreview();
      };

      if (sxEl) { sxEl.addEventListener('input', e => syncX(e.target.value)); }
      if (nxEl) { nxEl.addEventListener('input', e => syncX(e.target.value)); }
      if (syEl) { syEl.addEventListener('input', e => syncY(e.target.value)); }
      if (nyEl) { nyEl.addEventListener('input', e => syncY(e.target.value)); }
    });

    // Bind curvas de líneas
    piece.lines.forEach((ln, i) => {
      if (ln.type !== 'curve') return;
      const slEl = document.getElementById('lc-' + i);
      const nmEl = document.getElementById('ln-' + i);
      if (!_adjustments['line_' + i]) _adjustments['line_' + i] = { ctrl: ln.ctrl || 0 };

      const syncCtrl = (val) => {
        val = parseFloat(val);
        _adjustments['line_' + i].ctrl = val;
        if (slEl) slEl.value = val;
        if (nmEl) nmEl.value = val;
        _updatePreview();
      };
      if (slEl) slEl.addEventListener('input', e => syncCtrl(e.target.value));
      if (nmEl) nmEl.addEventListener('input', e => syncCtrl(e.target.value));
    });
  }

  let _highlightTimer = null;
  function _highlightCard(ptId) {
    const card = document.getElementById('ptcard-' + ptId);
    if (card) {
      card.classList.add('highlighted');
      clearTimeout(_highlightTimer);
      _highlightTimer = setTimeout(() => card.classList.remove('highlighted'), 800);
    }
  }

  // ════════════════════════════════════════════════════════════
  // CALCULAR PUNTOS
  // ════════════════════════════════════════════════════════════
  function _getMeasures() {
    const m = {};
    document.querySelectorAll('[data-measure]').forEach(el => {
      m[el.dataset.measure] = parseFloat(el.value) || 0;
    });
    return Object.assign({ bust:88,waist:68,hip:94,shoulder:38,neck:36,backLength:40,frontLength:42,totalLength:65,sleeveLength:60,wrist:16,skirtLength:60,hipDepth:20 }, m);
  }

  function _buildVars(m) {
    const b = (m.bust||88)*10, w=(m.waist||68)*10, h=(m.hip||94)*10;
    const sh=(m.shoulder||38)*10, nk=(m.neck||36)*10;
    return {
      BUSTO:b, CINTURA:w, CADERA:h, ESPALDA:sh, CUELLO:nk,
      TALLE_ESP:(m.backLength||40)*10, TALLE_DEL:(m.frontLength||42)*10,
      LARGO:(m.totalLength||65)*10, MANGA:(m.sleeveLength||60)*10,
      MUNECA:(m.wrist||16)*10, FALDA:(m.skirtLength||60)*10,
      CADERA_PROF:(m.hipDepth||20)*10,
      B4:b/4, B6:b/6, B8:b/8, B10:b/10, B12:b/12,
      W4:w/4, H4:h/4, E2:sh/2,
    };
  }

  function _evalBase(expr, vars) {
    if (!expr || expr === '0') return 0;
    let c = String(expr).trim();
    Object.entries(vars).forEach(([k,v]) => {
      c = c.replace(new RegExp('\\b'+k+'\\b','g'), v.toFixed(4));
    });
    if (!/^[\d\s+\-*/().]+$/.test(c)) return 0;
    try { return Math.round(Function('"use strict";return('+c+')')() * 100) / 100; }
    catch(e) { return 0; }
  }

  function _computePoints(piece, vars) {
    const pts = {};
    piece.points.forEach(pt => {
      const adj = _adjustments[pt.id] || { xOff:0, yOff:0 };
      let x=0, y=0;

      if (pt.xLocked && pt.yLocked) {
        pts[pt.id] = { x: pt.x || 0, y: pt.y || 0 };
        return;
      }

      const ref = pt.ref ? pts[pt.ref] : null;
      if (ref) { x = ref.x; y = ref.y; }

      const base = _evalBase(pt.base, vars);

      // Aplicar dirección base + offset del usuario
      switch (pt.dir) {
        case 'der':    x += base + (adj.xOff || 0); y += (adj.yOff || 0); break;
        case 'izq':    x -= base + (adj.xOff || 0); y += (adj.yOff || 0); break;
        case 'abajo':  y += base + (adj.yOff || 0); x += (adj.xOff || 0); break;
        case 'arriba': y -= base + (adj.yOff || 0); x += (adj.xOff || 0); break;
        case 'abs':    x = (pt.x||0) + (adj.xOff||0); y = (pt.y||0) + (adj.yOff||0); break;
      }

      // Extra (ej: arriba adicional para P3 en manga)
      if (pt.extra === 'arriba' && pt.extraBase) {
        const extraVal = _evalBase(pt.extraBase + (pt.extraDiv ? '/' + pt.extraDiv : ''), vars);
        y -= extraVal;
      }

      pts[pt.id] = { x, y };
    });
    return pts;
  }

  // ════════════════════════════════════════════════════════════
  // GENERAR SVG
  // ════════════════════════════════════════════════════════════
  function _buildSVG(piece, pts) {
    const g = document.createElementNS(NS, 'g');

    // Calcular bbox
    const xs = Object.values(pts).map(p=>p.x);
    const ys = Object.values(pts).map(p=>p.y);
    const minX=Math.min(...xs), maxX=Math.max(...xs);
    const minY=Math.min(...ys), maxY=Math.max(...ys);

    // Path del contorno
    let d = '', started = false;
    piece.lines.forEach((ln, i) => {
      const a = pts[ln.from], b = pts[ln.to];
      if (!a || !b) return;

      if (!started) { d += `M ${a.x} ${a.y}`; started = true; }

      const adj = _adjustments['line_' + i] || { ctrl: ln.ctrl || ln.semi || 0 };
      const ctrl = adj.ctrl;

      if (ln.type === 'line' || ln.type === 'fold') {
        d += ` L ${b.x} ${b.y}`;
      } else if (ln.type === 'curve') {
        if (ctrl !== 0) {
          const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
          const dx=b.x-a.x, dy=b.y-a.y;
          const len = Math.hypot(dx,dy)||1;
          const px=-dy/len*ctrl, py=dx/len*ctrl;
          d += ` Q ${mx+px} ${my+py} ${b.x} ${b.y}`;
        } else {
          d += ` L ${b.x} ${b.y}`;
        }
      }
    });

    if (d) {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'rgba(139,92,246,0.06)');
      path.setAttribute('stroke', '#e2e8f0');
      path.setAttribute('stroke-width', '0.9');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('stroke-linecap', 'round');
      g.appendChild(path);
    }

    // Líneas de doblez (rojo punteado)
    piece.lines.filter(ln => ln.type === 'fold').forEach(ln => {
      const a = pts[ln.from], b = pts[ln.to];
      if (!a || !b) return;
      const el = document.createElementNS(NS, 'line');
      el.setAttribute('x1',a.x);el.setAttribute('y1',a.y);
      el.setAttribute('x2',b.x);el.setAttribute('y2',b.y);
      el.setAttribute('stroke','#f87171');el.setAttribute('stroke-width','0.7');
      el.setAttribute('stroke-dasharray','8,4');el.setAttribute('fill','none');
      g.appendChild(el);
    });

    // Puntos + etiquetas
    Object.entries(pts).forEach(([id, pt]) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx',pt.x);c.setAttribute('cy',pt.y);c.setAttribute('r','2.8');
      c.setAttribute('fill','#8b5cf6');c.setAttribute('stroke','#090911');c.setAttribute('stroke-width','0.5');
      g.appendChild(c);

      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x',pt.x+4);t.setAttribute('y',pt.y-3);
      t.setAttribute('font-size','6');t.setAttribute('fill','#a78bfa');
      t.setAttribute('font-family','Arial');t.setAttribute('font-weight','bold');
      t.textContent = id;
      g.appendChild(t);

      // Actualizar coordenadas en el card
      const coordEl = document.getElementById('ptcoord-' + id);
      if (coordEl) coordEl.textContent = `x:${Math.round(pt.x)} · y:${Math.round(pt.y)}`;
    });

    // Hilo recto (de A a D si existe)
    const grainA = pts['A'], grainD = pts['D'] || pts['C'];
    if (grainA && grainD) {
      const el = document.createElementNS(NS, 'line');
      el.setAttribute('x1',grainA.x+10);el.setAttribute('y1',(grainA.y+grainD.y)/2);
      el.setAttribute('x2',grainA.x+10);el.setAttribute('y2',(grainA.y+grainD.y)/2+40);
      el.setAttribute('stroke','#60a5fa');el.setAttribute('stroke-width','0.7');
      el.setAttribute('marker-end','url(#dv3-arrow)');el.setAttribute('fill','none');
      g.appendChild(el);
    }

    // Nombre de la pieza centrado
    const cx = (minX+maxX)/2, cy = (minY+maxY)/2;
    const nt = document.createElementNS(NS,'text');
    nt.setAttribute('x',cx);nt.setAttribute('y',cy);
    nt.setAttribute('font-size','7');nt.setAttribute('fill','#ede9fe');
    nt.setAttribute('font-family','Arial');nt.setAttribute('font-weight','bold');
    nt.setAttribute('text-anchor','middle');
    nt.textContent = piece.name;
    g.appendChild(nt);

    const PAD = 25;
    return {
      group: g,
      bounds: { x:minX-PAD, y:minY-PAD, w:(maxX-minX)+PAD*2, h:(maxY-minY)+PAD*2 },
    };
  }

  // ════════════════════════════════════════════════════════════
  // UPDATE PREVIEW
  // ════════════════════════════════════════════════════════════
  function _updatePreview() {
    if (!_currentPiece || !_previewSVG) return;

    const piece   = PIECES[_currentPiece];
    const measures = _getMeasures();
    const vars    = _buildVars(measures);
    const pts     = _computePoints(piece, vars);

    const result  = _buildSVG(piece, pts);

    const g = document.getElementById('dv3-pattern-g');
    if (g) {
      while (g.firstChild) g.removeChild(g.firstChild);
      g.appendChild(result.group);
    }

    const b = result.bounds, P=10;
    _previewSVG.setAttribute('viewBox', `${b.x-P} ${b.y-P} ${b.w+P*2} ${b.h+P*2}`);

    // Info
    const wCm = Math.round(b.w/10), hCm = Math.round(b.h/10);
    const sizeEl = document.getElementById('dv3-size');
    const ptEl   = document.getElementById('dv3-pts-count');
    const bustEl = document.getElementById('dv3-bust-val');
    if (sizeEl) sizeEl.textContent = `${wCm} × ${hCm} cm`;
    if (ptEl)   ptEl.textContent   = Object.keys(pts).length;
    if (bustEl) bustEl.textContent = `${measures.bust}cm busto`;

    const scaleEl = document.getElementById('dv3-scale-tag');
    if (scaleEl) scaleEl.textContent = `${wCm}×${hCm} cm`;
  }

  // ════════════════════════════════════════════════════════════
  // AGREGAR AL PATRÓN PRINCIPAL
  // ════════════════════════════════════════════════════════════
  function _addToPattern() {
    if (!_currentPiece) return;
    const piece    = PIECES[_currentPiece];
    const measures  = _getMeasures();
    const vars     = _buildVars(measures);
    const pts      = _computePoints(piece, vars);
    const result   = _buildSVG(piece, pts);

    const content = document.getElementById('pattern-content');
    if (!content) { PAT.App.toast('SVG principal no encontrado', 'error'); return; }

    let ox = 30, oy = 30;
    try { const eb = content.getBBox(); if (eb.width>0) ox = eb.x+eb.width+35; } catch(e){}

    const w = document.createElementNS(NS, 'g');
    w.setAttribute('transform', `translate(${ox},${oy})`);
    w.setAttribute('class', 'manual-piece');
    w.appendChild(result.group.cloneNode(true));
    content.appendChild(w);

    const ms = document.getElementById('pattern-svg');
    if (ms) {
      const vb = (ms.getAttribute('viewBox')||'0 0 600 400').split(' ').map(Number);
      ms.setAttribute('viewBox', `0 0 ${Math.max(vb[2],ox+result.bounds.w+50)} ${Math.max(vb[3],oy+result.bounds.h+50)}`);
    }

    close();
    PAT.App.toast(`✅ "${piece.name}" agregado al patrón`, 'success');
    if (PAT.App.fitScreen) setTimeout(PAT.App.fitScreen, 120);
  }

  // ════════════════════════════════════════════════════════════
  // GUARDAR / CARGAR MANUALES
  // ════════════════════════════════════════════════════════════
  function _saveManual() {
    if (!_currentPiece) return;
    const piece = PIECES[_currentPiece];
    const id    = _curManualKey || ('m_' + Date.now());
    const manuals = _loadManuals();
    manuals[id] = {
      id, name: piece.name, pieceKey: _currentPiece,
      adjustments: JSON.parse(JSON.stringify(_adjustments)),
      savedAt: new Date().toISOString(),
    };
    _saveManuals(manuals);
    _curManualKey = id;
    _refreshSaved();
    PAT.App.toast(`💾 "${piece.name}" guardado`, 'success');
  }

  function _refreshSaved() {
    const list = document.getElementById('dv3-saved-list');
    if (!list) return;
    const manuals = _loadManuals();
    const keys    = Object.keys(manuals);
    list.innerHTML = '';

    if (!keys.length) {
      list.innerHTML = '<div style="font-size:10px;color:var(--tx3);padding:8px 10px">Sin patrones guardados</div>';
      return;
    }

    const lbl = document.createElement('div');
    lbl.className = 'dv3-saved-lbl';
    lbl.textContent = 'Guardados';
    list.appendChild(lbl);

    keys.forEach(id => {
      const m   = manuals[id];
      const div = document.createElement('div');
      div.className = 'dv3-saved-item' + (_curManualKey===id ? ' active' : '');
      div.innerHTML = `
        <span class="dv3-saved-nm">${m.name}</span>
        <span class="dv3-saved-tp">${PIECES[m.pieceKey]?.icon || ''}</span>
        <button class="dv3-del-btn" data-id="${id}" title="Eliminar">✕</button>
      `;
      div.addEventListener('click', function(e) {
        if (e.target.classList.contains('dv3-del-btn')) return;
        _curManualKey = id;
        _adjustments  = JSON.parse(JSON.stringify(m.adjustments || {}));
        _selectPiece(m.pieceKey);
        _updatePreview();
        _refreshSaved();
      });
      div.querySelector('.dv3-del-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        if (!confirm(`¿Eliminar "${m.name}"?`)) return;
        delete manuals[id];
        _saveManuals(manuals);
        if (_curManualKey === id) _curManualKey = null;
        _refreshSaved();
      });
      list.appendChild(div);
    });
  }

  function _resetAdjustments() {
    if (!_currentPiece) return;
    _adjustments = {};
    _selectPiece(_currentPiece);
    PAT.App.toast('↺ Puntos reseteados', 'info');
  }

  function _loadManuals() { try { return JSON.parse(localStorage.getItem(MK)||'{}'); } catch(e) { return {}; } }
  function _saveManuals(m) { localStorage.setItem(MK, JSON.stringify(m)); }

  return { open, close };
})();
