'use strict';
window.PAT = window.PAT || {};

/**
 * PAT.ToolbarConfig — personalización de botones del trazador.
 * Permite mostrar/ocultar botones de la barra de herramientas del drafter.
 * Persiste en localStorage. Los botones marcados como "fixed" no se pueden ocultar.
 */
PAT.ToolbarConfig = (function () {

  const LS_KEY = 'pat_toolbar_cfg';

  // Catálogo completo de botones configurables
  // id: selector CSS para encontrar el botón; fixed: no se puede ocultar
  const BUTTONS = [
    // Herramientas de dibujo
    { id:'tool-select',  sel:'[data-tool="select"]',  label:'▶ Seleccionar', group:'Herramientas', fixed:true },
    { id:'tool-point',   sel:'[data-tool="addPoint"]',label:'＋ Punto',       group:'Herramientas' },
    { id:'tool-line',    sel:'[data-tool="addLine"]',  label:'╱ Línea',       group:'Herramientas' },
    { id:'tool-curve',   sel:'[data-tool="addCurve"]', label:'⌒ Curva',       group:'Herramientas' },
    { id:'tool-fold',    sel:'[data-tool="addFold"]',  label:'— Doblez',      group:'Herramientas' },
    { id:'dv6-rect',     sel:'#dv6-rect',              label:'⬜ Rectángulo',  group:'Herramientas' },
    // Historial
    { id:'dv6-undo',     sel:'#dv6-undo',              label:'↩ Atrás',       group:'Historial' },
    { id:'dv6-redo',     sel:'#dv6-redo',              label:'↪ Adelante',    group:'Historial' },
    // Ayudas visuales
    { id:'dv6-snap',     sel:'#dv6-snap',              label:'⊞ Snap 5mm',    group:'Ayudas' },
    { id:'dv6-dims-btn', sel:'#dv6-dims-btn',          label:'📐 Medidas',     group:'Ayudas' },
    { id:'dv6-grade',    sel:'#dv6-grade',             label:'📏 Escalar talla',group:'Ayudas' },
    // Zoom
    { id:'dv6-zi',       sel:'#dv6-zi',                label:'＋ Zoom +',      group:'Vista' },
    { id:'dv6-zo',       sel:'#dv6-zo',                label:'－ Zoom −',      group:'Vista' },
    { id:'dv6-zf',       sel:'#dv6-zf',                label:'⊡ Ajustar',      group:'Vista' },
    // Acciones especiales
    { id:'tool-scurve',  sel:'[data-tool="addSCurve"]', label:'〜 Curva S',    group:'Herramientas' },
    { id:'tool-dart',    sel:'[data-tool="addDart"]',   label:'📌 Pinza',      group:'Herramientas' },
    { id:'tool-measure', sel:'[data-tool="measure"]',   label:'📏 Medir',      group:'Herramientas' },
    { id:'tool-mid',     sel:'[data-tool="midpointTool"]',label:'⊕ Mitad',     group:'Herramientas' },
    { id:'dv6-multi',    sel:'#dv6-multi',              label:'⬚ Multi',        group:'Herramientas' },
    // Acciones (fijas)
    { id:'dv6-clr',      sel:'#dv6-clr',               label:'🗑 Limpiar',     group:'Acciones', fixed:true },
    { id:'dv6-sv',       sel:'#dv6-sv',                label:'💾 Guardar',     group:'Acciones', fixed:true },
    { id:'dv6-ap',       sel:'#dv6-ap',                label:'＋ Al patrón',   group:'Acciones', fixed:true },
    // Acciones opcionales de la toolbar
    { id:'dv6-validate', sel:'#dv6-validate',           label:'🔍 Verificar',  group:'Acciones' },
    { id:'dv6-mirror',   sel:'#dv6-mirror',             label:'🪞 Espejo',      group:'Acciones' },
    { id:'dv6-tallas',   sel:'#dv6-tallas',             label:'📊 Tallas',     group:'Acciones' },
    { id:'dv6-demo',     sel:'#dv6-demo',               label:'▶ Demo Espalda',group:'Acciones' },
    { id:'dv6-sistemas', sel:'#dv6-sistemas',           label:'🧵 Sistemas',   group:'Acciones' },
    { id:'dv6-bgimg-btn',sel:'#dv6-bgimg-btn',          label:'🖼️ Imagen',      group:'Acciones' },
    { id:'dv6-help-btn', sel:'#dv6-help-btn',           label:'❓ Ayuda',      group:'Acciones' },
  ];

  const GROUPS = ['Herramientas','Historial','Ayudas','Vista','Acciones'];

  let _cfg = {};  // { buttonId: true/false }

  function _load() {
    try { _cfg = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch(e) { _cfg = {}; }
  }

  function _save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(_cfg)); }
    catch(e) {}
  }

  function isVisible(id) {
    const btn = BUTTONS.find(b => b.id === id);
    if (!btn || btn.fixed) return true;
    return _cfg[id] !== false;
  }

  function apply() {
    // Aplica visibilidad a los botones del DOM del trazador
    BUTTONS.forEach(btn => {
      if (btn.fixed) return;
      const el = document.querySelector('.dv6-tb ' + btn.sel);
      if (el) el.style.display = isVisible(btn.id) ? '' : 'none';
    });
  }

  // ── Panel de configuración ──────────────────────────────────────
  function _inject() {
    if (document.getElementById('tb-cfg-overlay')) return;

    const style = document.createElement('style');
    style.textContent = `
#tb-cfg-overlay{
  position:fixed;inset:0;z-index:9600;
  background:rgba(10,8,20,.78);backdrop-filter:blur(10px);
  display:none;align-items:center;justify-content:center;padding:16px;
}
#tb-cfg-overlay.open{display:flex}
#tb-cfg-panel{
  background:var(--panel,#1a1828);border:1px solid var(--bd,#2e2e45);
  border-radius:16px;width:100%;max-width:480px;max-height:86vh;
  overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.6);
}
.tc-head{
  padding:16px 20px;border-bottom:1px solid var(--bd,#2e2e45);
  display:flex;align-items:center;gap:10px;
  position:sticky;top:0;background:var(--panel,#1a1828);z-index:1;
}
.tc-head h3{font-size:.95rem;font-weight:700;flex:1;color:var(--tx,#e8e4f0)}
.tc-head-note{font-size:.72rem;color:var(--tx3,#5a5678)}
.tc-close{background:none;border:none;color:var(--tx3,#5a5678);font-size:1.1rem;cursor:pointer;padding:2px 6px;border-radius:6px}
.tc-close:hover{background:var(--bd,#2e2e45)}
.tc-body{padding:14px 20px 20px;display:flex;flex-direction:column;gap:16px}
.tc-group-title{
  font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;
  color:var(--tx3,#5a5678);padding-bottom:6px;
  border-bottom:1px solid var(--bd,#2e2e45);margin-bottom:2px;
}
.tc-btn-list{display:flex;flex-direction:column;gap:6px}
.tc-btn-row{
  display:flex;align-items:center;gap:12px;
  padding:8px 12px;border-radius:9px;
  background:var(--bg2,#141420);border:1.5px solid var(--bd,#2e2e45);
  transition:border-color .15s;
}
.tc-btn-row:has(input:checked){border-color:var(--acc,#b86b2e)}
.tc-btn-row.fixed{opacity:.5;cursor:not-allowed}
.tc-btn-label{flex:1;font-size:.85rem;color:var(--tx,#e8e4f0)}
.tc-btn-fixed{font-size:.65rem;font-family:monospace;color:var(--tx3,#5a5678);padding:1px 6px;border:1px solid var(--bd,#2e2e45);border-radius:4px}
.tc-toggle{
  position:relative;width:36px;height:20px;flex-shrink:0;
}
.tc-toggle input{opacity:0;width:0;height:0;position:absolute}
.tc-toggle-track{
  position:absolute;inset:0;border-radius:10px;
  background:var(--bd,#2e2e45);transition:background .2s;cursor:pointer;
}
.tc-toggle input:checked + .tc-toggle-track{background:var(--acc,#b86b2e)}
.tc-toggle-thumb{
  position:absolute;top:3px;left:3px;width:14px;height:14px;
  border-radius:50%;background:#fff;transition:transform .2s;pointer-events:none;
}
.tc-toggle input:checked ~ .tc-toggle-thumb{transform:translateX(16px)}
.tc-footer{
  padding:12px 20px;border-top:1px solid var(--bd,#2e2e45);
  display:flex;gap:10px;
  position:sticky;bottom:0;background:var(--panel,#1a1828);
}
.tc-reset-btn{
  padding:9px 16px;border:1.5px solid var(--bd,#2e2e45);border-radius:9px;
  background:transparent;color:var(--tx2,#9490b0);font-family:inherit;
  font-size:.82rem;cursor:pointer;transition:all .15s;
}
.tc-reset-btn:hover{border-color:var(--acc2,#d4603a);color:var(--acc2,#d4603a)}
.tc-apply-btn{
  flex:1;padding:9px;border:none;border-radius:9px;
  background:var(--acc,#b86b2e);color:#fff;font-family:inherit;
  font-size:.88rem;font-weight:700;cursor:pointer;transition:all .15s;
}
.tc-apply-btn:hover{filter:brightness(1.1)}
#dv6-tb-cfg-btn{
  padding:4px 10px;border-radius:6px;border:1px solid var(--bd2,#3a3a55);
  background:var(--bg2,#141420);color:var(--tx3,#5a5678);font-size:11px;
  cursor:pointer;font-family:inherit;transition:all .15s;margin-left:auto;
}
#dv6-tb-cfg-btn:hover{border-color:var(--acc,#b86b2e);color:var(--acc,#b86b2e)}
`;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'tb-cfg-overlay';
    overlay.innerHTML = `
      <div id="tb-cfg-panel">
        <div class="tc-head">
          <h3>⚙ Personalizar herramientas</h3>
          <span class="tc-head-note">Los fijos no se pueden ocultar</span>
          <button class="tc-close" id="tc-close-btn">✕</button>
        </div>
        <div class="tc-body" id="tc-body"></div>
        <div class="tc-footer">
          <button class="tc-reset-btn" id="tc-reset-btn">Restablecer todo</button>
          <button class="tc-apply-btn" id="tc-apply-btn">✓ Aplicar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById('tc-close-btn').onclick = closePanel;
    document.getElementById('tc-apply-btn').onclick = _applyFromPanel;
    document.getElementById('tc-reset-btn').onclick = _resetAll;
    overlay.onclick = e => { if (e.target === overlay) closePanel(); };
  }

  function _renderPanel() {
    const body = document.getElementById('tc-body');
    if (!body) return;

    let html = '';
    for (const group of GROUPS) {
      const btns = BUTTONS.filter(b => b.group === group);
      html += `<div>
        <div class="tc-group-title">${group}</div>
        <div class="tc-btn-list">
          ${btns.map(b => `
            <label class="tc-btn-row${b.fixed ? ' fixed' : ''}">
              <span class="tc-btn-label">${b.label}</span>
              ${b.fixed ? '<span class="tc-btn-fixed">fijo</span>' : ''}
              <span class="tc-toggle">
                <input type="checkbox" data-tc-id="${b.id}"
                  ${isVisible(b.id) ? 'checked' : ''}
                  ${b.fixed ? 'disabled' : ''}>
                <span class="tc-toggle-track"></span>
                <span class="tc-toggle-thumb"></span>
              </span>
            </label>`).join('')}
        </div>
      </div>`;
    }
    body.innerHTML = html;
  }

  function _applyFromPanel() {
    document.querySelectorAll('[data-tc-id]').forEach(inp => {
      _cfg[inp.dataset.tcId] = inp.checked;
    });
    _save();
    apply();
    closePanel();
    if (PAT.App) PAT.App.toast('✓ Herramientas actualizadas', 'success');
  }

  function _resetAll() {
    _cfg = {};
    _save();
    apply();
    _renderPanel();
    if (PAT.App) PAT.App.toast('Herramientas restablecidas', 'success');
  }

  function openPanel() {
    _renderPanel();
    document.getElementById('tb-cfg-overlay').classList.add('open');
  }

  function closePanel() {
    document.getElementById('tb-cfg-overlay').classList.remove('open');
  }

  // ── Inyectar botón ⚙ en la toolbar del trazador ────────────────
  function _injectToolbarBtn() {
    const tb = document.querySelector('.dv6-tb');
    if (!tb || document.getElementById('dv6-tb-cfg-btn')) return;

    // Botón tabla de medidas
    const btnM = document.createElement('button');
    btnM.id = 'dv6-tb-medidas-btn';
    btnM.title = 'Tabla de medidas del cliente';
    btnM.textContent = '📋 Tabla';
    btnM.style.cssText = 'padding:4px 10px;border-radius:6px;border:1px solid var(--bd2,#3a3a55);background:var(--bg2,#141420);color:var(--tx3,#5a5678);font-size:11px;cursor:pointer;font-family:inherit;transition:all .15s';
    btnM.onmouseenter = () => { btnM.style.borderColor='var(--acc,#b86b2e)'; btnM.style.color='var(--acc,#b86b2e)'; };
    btnM.onmouseleave = () => { btnM.style.borderColor='var(--bd2,#3a3a55)'; btnM.style.color='var(--tx3,#5a5678)'; };
    btnM.onclick = () => {
      if (PAT.MeasureTable) PAT.MeasureTable.open(null);
    };
    tb.appendChild(btnM);

    // Botón configurar herramientas
    const btn = document.createElement('button');
    btn.id = 'dv6-tb-cfg-btn';
    btn.title = 'Personalizar herramientas';
    btn.textContent = '⚙ Herramientas';
    btn.onclick = openPanel;
    tb.appendChild(btn);

    apply();
  }

  // ── Init ────────────────────────────────────────────────────────
  function init() {
    _load();
    _inject();
    // Observar cuando aparece la toolbar del trazador (se crea dinámicamente)
    const observer = new MutationObserver(() => {
      if (document.querySelector('.dv6-tb') && !document.getElementById('dv6-tb-cfg-btn')) {
        _injectToolbarBtn();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { openPanel, closePanel, apply, isVisible };

})();
