'use strict';
window.PAT = window.PAT || {};

PAT.MeasureTable = (function () {

  const LS_VIS    = 'pat_mtable_vis';
  const LS_STATE  = 'pat_mtable_state';
  const LS_CUSTOM = 'pat_custom_medidas'; // compartido con el constructor de fórmula

  const FIELDS = [
    { key:'bust',        measure:'bust',        label:'Busto / Pecho',         hint:'contorno de pecho',      defDiv:4,  talla:true  },
    { key:'backWidth',   measure:'backWidth',   label:'Ancho de espalda',      hint:'ancho en dorso',         defDiv:2                },
    { key:'backLength',  measure:'backLength',  label:'Talle parte trasera',   hint:'nuca → cintura',         defDiv:1                },
    { key:'frontLength', measure:'frontLength', label:'Talle parte delantera', hint:'cuello → cintura',       defDiv:1                },
    { key:'waist',       measure:'waist',       label:'Contorno de cintura',   hint:'contorno de cintura',    defDiv:4                },
    { key:'hipDepth',    measure:'hipDepth',    label:'Alto de cadera',        hint:'cintura → cadera',       defDiv:1                },
    { key:'hip',         measure:'hip',         label:'Contorno de cadera',    hint:'contorno de cadera',     defDiv:4                },
    { key:'skirtLength', measure:'skirtLength', label:'Largo de falda',        hint:'cintura → dobladillo',   defDiv:1                },
    { key:'sleeveShort', measure:'sleeveShort', label:'Largo manga corta',     hint:'hombro → codo',          defDiv:1                },
    { key:'sleeveLength',measure:'sleeveLength',label:'Largo manga larga',     hint:'hombro → muñeca',        defDiv:1                },
    { key:'armCirc',     measure:'armCirc',     label:'Contorno de brazo',     hint:'contorno de brazo',      defDiv:2                },
    { key:'wrist',       measure:'wrist',       label:'Contorno de muñeca',    hint:'contorno de muñeca',     defDiv:1                },
    { key:'neck',        measure:'neck',        label:'Contorno de cuello',    hint:'contorno de cuello',     defDiv:6                },
    { key:'totalLength', measure:'totalLength', label:'Largo de camisa',       hint:'hombro → bajo',          defDiv:1                },
    { key:'armhole',     measure:'armhole',     label:'Sisa',                  hint:'contorno de sisa',       defDiv:2                },
    { key:'shoulder',    measure:'shoulder',    label:'Ancho de hombros',      hint:'hombro a hombro',        defDiv:2                },
    { key:'rise',        measure:'rise',        label:'Entrepierna',           hint:'crotch depth',           defDiv:1                },
    { key:'thigh',       measure:'thigh',       label:'Contorno de muslo',     hint:'contorno de muslo',      defDiv:2                },
    { key:'inseam',      measure:'inseam',      label:'Largo de pantalón',     hint:'cintura → tobillo',      defDiv:1                },
    { key:'outseam',     measure:'outseam',     label:'Tiro largo',            hint:'cintura → suelo',        defDiv:1                },
    { key:'knee',        measure:'knee',        label:'Contorno de rodilla',   hint:'contorno de rodilla',    defDiv:2                },
    { key:'ankle',       measure:'ankle',       label:'Contorno de tobillo',   hint:'contorno de tobillo',    defDiv:1                },
  ];

  const DIVS = [
    {v:1,l:'Completa ÷1'},{v:2,l:'Mitad ÷2'},{v:3,l:'Tercio ÷3'},
    {v:4,l:'Cuarta ÷4'},{v:5,l:'Quinta ÷5'},{v:6,l:'Sexta ÷6'},
    {v:8,l:'Octava ÷8'},{v:10,l:'Décima ÷10'},{v:12,l:'Doceava ÷12'},
  ];

  const TALLAS = [
    {max:76,'l':'XXS / 30'},{max:80,'l':'XS / 32'},{max:84,'l':'XS-S / 34'},
    {max:88,'l':'S / 36'},{max:92,'l':'M / 38'},{max:96,'l':'M-L / 40'},
    {max:100,'l':'L / 42'},{max:104,'l':'XL / 44'},{max:110,'l':'XXL / 46'},{max:999,'l':'XXXL / 48+'},
  ];
  function _getTalla(v){ return !v||isNaN(v)?null:(TALLAS.find(t=>v<=t.max)||TALLAS[TALLAS.length-1]).l; }

  // Estado en memoria
  let _vis   = {};
  let _state = {};
  let _hiddenOpen  = false;
  let _addFormOpen = false;
  let _modal = null;
  let _onProceed = null;
  let _currentClientId = null;

  // Campos personalizados (compartidos con el constructor de fórmula)
  function _loadCustomFields(){
    try { return JSON.parse(localStorage.getItem(LS_CUSTOM)||'[]'); } catch(e){ return []; }
  }
  function _saveCustomFields(arr){
    try { localStorage.setItem(LS_CUSTOM, JSON.stringify(arr)); } catch(e){}
    document.dispatchEvent(new CustomEvent('pat:customMedidasChanged'));
  }
  // Devuelve FIELDS base + personalizados, sin duplicados por key
  function _allFields(){
    const custom = _loadCustomFields();
    const base = FIELDS.map(f => f.key);
    const extras = custom
      .filter(c => !base.includes(c.key))
      .map(c => ({ key: c.key, measure: c.key, label: c.label, hint: 'medida personalizada', defDiv: 1, custom: true }));
    return [...FIELDS, ...extras];
  }

  function _loadPrefs(){
    try { _vis   = JSON.parse(localStorage.getItem(LS_VIS)   || '{}'); }catch(e){_vis={};}
    try { _state = JSON.parse(localStorage.getItem(LS_STATE) || '{}'); }catch(e){_state={};}
  }
  function _savePrefs(){
    try { localStorage.setItem(LS_VIS,   JSON.stringify(_vis));   }catch(e){}
    try { localStorage.setItem(LS_STATE, JSON.stringify(_state)); }catch(e){}
  }

  function _isVisible(key){ return _vis[key] !== false; }

  function _getState(key){
    const f = FIELDS.find(f=>f.key===key);
    if (!_state[key]) _state[key] = { total:'', fracciones:[{div: f?.defDiv||4, add:0}] };
    return _state[key];
  }

  // ── Calcular resultado de una fracción ────────────────────────────
  function _calc(total, div, add){
    const t = parseFloat(total), d = parseFloat(div)||1, a = parseFloat(add)||0;
    if (!t || isNaN(t)) return null;
    return Math.round((t/d + a) * 10) / 10;
  }

  // ── CSS (inyectado una vez) ───────────────────────────────────────
  function _css(){
    if (document.getElementById('mt-css')) return;
    const s = document.createElement('style');
    s.id = 'mt-css';
    s.textContent = `
#mt-modal{position:fixed;inset:0;z-index:9800;background:rgba(5,4,15,.88);
  display:flex;align-items:center;justify-content:center;padding:12px}
#mt-box{background:#0f0e1a;border:1px solid #2e2e45;border-radius:16px;
  width:100%;max-width:680px;max-height:93vh;display:flex;flex-direction:column;
  overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.85)}
.mt-head{padding:11px 16px;border-bottom:1px solid #2e2e45;display:flex;
  align-items:center;gap:8px;flex-shrink:0;flex-wrap:wrap}
.mt-head-title{font-size:13px;font-weight:700;color:#ede9fe;flex:1}
.mt-talla{padding:2px 10px;border-radius:999px;font-size:10px;font-weight:700;
  background:rgba(139,92,246,.2);color:#a78bfa;border:1px solid rgba(139,92,246,.3)}
.mt-btn-skip{padding:5px 13px;border-radius:7px;border:1.5px solid #2e2e45;
  background:transparent;color:#9490b0;font-size:11px;cursor:pointer;font-family:inherit}
.mt-btn-skip:hover{color:#ede9fe;border-color:#3d3d58}
.mt-btn-go{padding:5px 14px;border-radius:7px;border:none;background:#8b5cf6;
  color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}
.mt-btn-go:hover{filter:brightness(1.1)}
.mt-cbar{padding:7px 16px;border-bottom:1px solid #2e2e45;display:flex;
  align-items:center;gap:7px;flex-shrink:0;flex-wrap:wrap}
.mt-csel{flex:1;min-width:150px;background:#141420;border:1.5px solid #2e2e45;
  border-radius:7px;color:#ede9fe;padding:5px 8px;font-size:11px;font-family:inherit}
.mt-csel:focus{outline:none;border-color:#8b5cf6}
.mt-cbtn{padding:4px 11px;border-radius:7px;border:1.5px solid #2e2e45;
  background:transparent;color:#9490b0;font-size:10px;cursor:pointer;font-family:inherit;white-space:nowrap}
.mt-cbtn:hover{border-color:#8b5cf6;color:#a78bfa}
.mt-cbtn.pri{background:rgba(139,92,246,.15);color:#a78bfa;border-color:rgba(139,92,246,.3)}
.mt-new-bar{display:none;padding:6px 16px;border-bottom:1px solid #2e2e45;
  gap:7px;align-items:center;flex-shrink:0}
.mt-new-bar.open{display:flex}
.mt-new-inp{flex:1;background:#141420;border:1.5px solid #8b5cf6;border-radius:7px;
  color:#ede9fe;padding:5px 9px;font-size:11px;font-family:inherit}
.mt-new-inp:focus{outline:none}
.mt-scroll{overflow-y:auto;flex:1}
.mt-field{border-bottom:1px solid #181828}
.mt-field-head{display:flex;align-items:center;gap:8px;padding:7px 16px 4px}
.mt-field-head:hover{background:#0d0c18}
.mt-eye{background:none;border:none;cursor:pointer;padding:3px;border-radius:4px;
  color:#3a3a55;font-size:13px;display:flex;align-items:center;line-height:1;flex-shrink:0}
.mt-eye:hover{color:#9490b0;background:#181828}
.mt-lbl{flex:1;min-width:0}
.mt-lbl-name{font-size:11px;color:#ede9fe;font-weight:600}
.mt-lbl-hint{font-size:9px;color:#5a5678}
.mt-total-wrap{display:flex;align-items:center;gap:4px;flex-shrink:0}
.mt-total-lbl{font-size:9px;color:#5a5678;white-space:nowrap}
.mt-total-inp{width:70px;padding:4px 6px;font-size:11px;border-radius:6px;
  border:1.5px solid #2e2e45;background:#141420;color:#ede9fe;
  font-family:monospace;text-align:right}
.mt-total-inp:focus{outline:none;border-color:#8b5cf6}
.mt-fracs{padding:0 16px 6px 38px;display:flex;flex-direction:column;gap:3px}
.mt-frac-row{display:flex;align-items:center;gap:5px}
.mt-fsel{flex:1;padding:3px 5px;font-size:10px;border-radius:5px;
  border:1px solid #2e2e45;background:#0d0c18;color:#9490b0;font-family:inherit}
.mt-fsel:focus{outline:none;border-color:#8b5cf6}
.mt-fadd{width:58px;padding:3px 6px;font-size:10px;border-radius:5px;
  border:1px solid #2e2e45;background:#0d0c18;color:#9490b0;
  font-family:monospace;text-align:right}
.mt-fadd:focus{outline:none;border-color:#8b5cf6}
.mt-fres{font-size:11px;font-weight:700;font-family:monospace;
  color:#34d399;min-width:72px;text-align:right;white-space:nowrap}
.mt-fres.empty{color:#3a3a55;font-weight:400}
.mt-fdel{background:none;border:none;cursor:pointer;color:#3a3a55;
  font-size:12px;padding:2px 4px;border-radius:4px;line-height:1;flex-shrink:0}
.mt-fdel:hover{color:#f87171;background:rgba(248,113,113,.1)}
.mt-add-frac{background:none;border:none;cursor:pointer;color:#5a5678;
  font-size:10px;padding:2px 0;margin-left:0;font-family:inherit;text-align:left}
.mt-add-frac:hover{color:#a78bfa}
.mt-hidden-section{flex-shrink:0;border-top:1px solid #2e2e45}
.mt-hidden-toggle{display:flex;align-items:center;gap:6px;padding:8px 16px;
  cursor:pointer;background:#090912;width:100%;border:none;font-family:inherit;
  color:#5a5678;font-size:11px}
.mt-hidden-toggle:hover{color:#9490b0}
.mt-hidden-toggle .arrow{transition:transform .2s;font-size:10px}
.mt-hidden-toggle.open .arrow{transform:rotate(180deg)}
.mt-hidden-rows{display:none;border-top:1px solid #181828;max-height:200px;overflow-y:auto}
.mt-hidden-rows.open{display:block}
.mt-hidden-row{display:flex;align-items:center;gap:8px;padding:6px 16px;
  border-bottom:1px solid #111020;opacity:.5}
.mt-hidden-row:hover{opacity:.8;background:#0d0c18}
.mt-show-btn{background:none;border:none;cursor:pointer;color:#8b5cf6;
  font-size:10px;padding:2px 7px;border-radius:4px;font-family:inherit;white-space:nowrap;flex-shrink:0}
.mt-show-btn:hover{background:rgba(139,92,246,.15)}
.mt-foot{padding:8px 16px;border-top:1px solid #2e2e45;display:flex;
  align-items:center;justify-content:space-between;flex-shrink:0;background:#090912}
.mt-foot-note{font-size:10px;color:#5a5678}
`;
    document.head.appendChild(s);
  }

  // ── Construir DOM del modal ───────────────────────────────────────
  function _build(){
    _css();
    _modal = document.createElement('div');
    _modal.id = 'mt-modal';
    _modal.style.display = 'none';
    _modal.innerHTML = `
<div id="mt-box">
  <div class="mt-head">
    <span class="mt-head-title">📐 Tabla de medidas</span>
    <span class="mt-talla" id="mt-talla">Talla —</span>
    <button class="mt-btn-skip" id="mt-skip">Omitir</button>
    <button class="mt-btn-go"   id="mt-go">✓ Comenzar a trazar</button>
  </div>
  <div class="mt-cbar">
    <select class="mt-csel" id="mt-csel"><option value="">— Sin cliente —</option></select>
    <button class="mt-cbtn" id="mt-save">💾 Guardar</button>
    <button class="mt-cbtn pri" id="mt-new">＋ Nuevo cliente</button>
  </div>
  <div class="mt-new-bar" id="mt-new-bar">
    <input class="mt-new-inp" id="mt-new-inp" placeholder="Nombre del cliente (ej. Sr. Albert)">
    <button class="mt-btn-go" id="mt-new-ok">Crear</button>
    <button class="mt-btn-skip" id="mt-new-cancel">✕</button>
  </div>
  <div class="mt-scroll" id="mt-scroll"></div>
  <div class="mt-hidden-section" id="mt-hidden-section" style="display:none">
    <button class="mt-hidden-toggle" id="mt-hidden-toggle">
      <span class="arrow">▲</span>
      <span id="mt-hidden-label">0 medidas ocultas</span>
    </button>
    <div class="mt-hidden-rows" id="mt-hidden-rows"></div>
  </div>
  <div id="mt-add-section" style="border-top:1px solid #2e2e45;padding:6px 16px 8px;background:#090912">
    <div id="mt-add-form" style="display:none;flex-direction:column;gap:5px;padding-bottom:4px">
      <div style="font-size:10px;color:#5a5678;font-weight:600">NUEVA MEDIDA PERSONALIZADA</div>
      <div style="display:flex;gap:6px;align-items:center">
        <input id="mt-add-lbl" placeholder="Nombre (ej. Busto alto)" class="mt-total-inp" style="flex:2;width:auto;text-align:left">
        <input id="mt-add-key" placeholder="clave" class="mt-total-inp" style="flex:1;width:auto;text-align:left">
        <button id="mt-add-ok" class="mt-btn-go" style="font-size:10px">Agregar</button>
        <button id="mt-add-cancel" class="mt-btn-skip" style="font-size:10px">✕</button>
      </div>
      <div style="font-size:9px;color:#3a3a55">La clave se usa en fórmulas (sin espacios). Ej: busto_alto</div>
    </div>
    <button id="mt-add-btn" style="background:none;border:none;cursor:pointer;color:#5a5678;font-size:11px;padding:2px 0;font-family:inherit">＋ Agregar medida personalizada</button>
  </div>
  <div class="mt-foot">
    <span class="mt-foot-note" id="mt-foot-note"></span>
    <button class="mt-btn-skip" id="mt-print" style="font-size:10px">🖨 Imprimir / PDF</button>
  </div>
</div>`;
    document.body.appendChild(_modal);

    _modal.onclick = e => { if (e.target === _modal) _close(); };
    document.getElementById('mt-skip').onclick   = () => { _close(); if (_onProceed) _onProceed(); };
    document.getElementById('mt-go').onclick     = _proceed;
    document.getElementById('mt-print').onclick  = _print;
    document.getElementById('mt-save').onclick   = _saveToClient;
    document.getElementById('mt-new').onclick    = () => {
      const bar = document.getElementById('mt-new-bar');
      bar.classList.toggle('open');
      if (bar.classList.contains('open')) document.getElementById('mt-new-inp').focus();
    };
    document.getElementById('mt-new-ok').onclick     = _createClient;
    document.getElementById('mt-new-cancel').onclick = () => document.getElementById('mt-new-bar').classList.remove('open');
    document.getElementById('mt-hidden-toggle').onclick = _toggleHidden;
    document.getElementById('mt-add-btn').onclick = () => {
      _addFormOpen = !_addFormOpen;
      const form = document.getElementById('mt-add-form');
      form.style.display = _addFormOpen ? 'flex' : 'none';
      if (_addFormOpen) document.getElementById('mt-add-lbl').focus();
    };
    document.getElementById('mt-add-ok').onclick = _addCustomField;
    document.getElementById('mt-add-cancel').onclick = () => {
      _addFormOpen = false;
      document.getElementById('mt-add-form').style.display = 'none';
    };
    // Sincronizar si el constructor de fórmula agrega medidas personalizadas
    document.addEventListener('pat:customMedidasChanged', _renderAll);
    document.getElementById('mt-csel').onchange = e => {
      _currentClientId = e.target.value || null;
      if (_currentClientId) _loadClientMeasures(_currentClientId);
    };
  }

  // ── Render lista visible ──────────────────────────────────────────
  function _renderAll(){
    const scroll = document.getElementById('mt-scroll');
    if (!scroll) return;
    scroll.innerHTML = '';
    _allFields().forEach(f => {
      if (!_isVisible(f.key)) return;
      scroll.appendChild(_buildFieldEl(f));
    });
    _renderHidden();
    _updateFoot();
  }

  function _buildFieldEl(f){
    const st = _getState(f.key);
    const div = document.createElement('div');
    div.className = 'mt-field';
    div.dataset.key = f.key;

    // cabecera del campo
    const head = document.createElement('div');
    head.className = 'mt-field-head';
    head.innerHTML = `
      <button class="mt-eye" data-key="${f.key}" title="Ocultar">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <div class="mt-lbl">
        <div class="mt-lbl-name">${f.label}</div>
        <div class="mt-lbl-hint">${f.hint}</div>
      </div>
      <div class="mt-total-wrap">
        <span class="mt-total-lbl">Total cm</span>
        <input class="mt-total-inp" type="number" placeholder="0" step="0.5" min="0"
          value="${st.total || ''}" data-total="${f.key}">
        ${f.custom ? `<button class="mt-fdel" data-del-field="${f.key}" title="Eliminar medida" style="margin-left:2px">🗑</button>` : ''}
      </div>`;
    div.appendChild(head);

    // filas de fracciones
    const fracsDiv = document.createElement('div');
    fracsDiv.className = 'mt-fracs';
    fracsDiv.dataset.fracs = f.key;
    st.fracciones.forEach((frac, idx) => {
      fracsDiv.appendChild(_buildFracRow(f.key, idx, frac, st.total));
    });
    // botón + agregar fracción
    const addBtn = document.createElement('button');
    addBtn.className = 'mt-add-frac';
    addBtn.textContent = '＋ agregar fracción';
    addBtn.onclick = () => _addFrac(f.key);
    fracsDiv.appendChild(addBtn);
    div.appendChild(fracsDiv);

    // wiring ojo
    head.querySelector('.mt-eye').onclick = () => _hide(f.key);
    // wiring borrar campo personalizado
    head.querySelector('[data-del-field]')?.addEventListener('click', () => {
      const updated = _loadCustomFields().filter(c => c.key !== f.key);
      _saveCustomFields(updated);
      delete _state[f.key]; _savePrefs();
      _renderAll();
    });
    // wiring total
    head.querySelector('.mt-total-inp').oninput = e => {
      _state[f.key].total = e.target.value;
      _savePrefs();
      _refreshFracs(f.key);
      if (f.talla) _updateTalla(parseFloat(e.target.value));
      _updateFoot();
    };

    return div;
  }

  function _buildFracRow(key, idx, frac, totalVal){
    const row = document.createElement('div');
    row.className = 'mt-frac-row';
    row.dataset.idx = idx;

    const divOpts = DIVS.map(d =>
      `<option value="${d.v}"${d.v == frac.div?' selected':''}>${d.l}</option>`
    ).join('');
    const res = _calc(totalVal, frac.div, frac.add);

    row.innerHTML = `
      <select class="mt-fsel">${divOpts}</select>
      <input class="mt-fadd" type="number" value="${frac.add||0}" step="0.5" placeholder="±cm">
      <span class="mt-fres ${res===null?'empty':''}">${res!==null?'= '+res+' cm':'—'}</span>
      <button class="mt-fdel" title="Eliminar fracción">✕</button>`;

    row.querySelector('.mt-fsel').oninput = e => {
      _state[key].fracciones[idx].div = parseFloat(e.target.value);
      _savePrefs();
      _refreshFrac(row, key, idx);
    };
    row.querySelector('.mt-fadd').oninput = e => {
      _state[key].fracciones[idx].add = parseFloat(e.target.value)||0;
      _savePrefs();
      _refreshFrac(row, key, idx);
    };
    row.querySelector('.mt-fdel').onclick = () => {
      if (_state[key].fracciones.length <= 1) return; // siempre dejar al menos una
      _state[key].fracciones.splice(idx, 1);
      _savePrefs();
      _rerenderFracs(key);
    };
    return row;
  }

  function _refreshFrac(row, key, idx){
    const st = _state[key];
    const frac = st.fracciones[idx];
    const res = _calc(st.total, frac.div, frac.add);
    const span = row.querySelector('.mt-fres');
    span.textContent = res !== null ? '= '+res+' cm' : '—';
    span.className = 'mt-fres'+(res===null?' empty':'');
  }

  function _refreshFracs(key){
    const fracsDiv = document.querySelector(`[data-fracs="${key}"]`);
    if (!fracsDiv) return;
    const st = _state[key];
    fracsDiv.querySelectorAll('.mt-frac-row').forEach((row, idx) => {
      const frac = st.fracciones[idx];
      if (!frac) return;
      const res = _calc(st.total, frac.div, frac.add);
      const span = row.querySelector('.mt-fres');
      span.textContent = res !== null ? '= '+res+' cm' : '—';
      span.className = 'mt-fres'+(res===null?' empty':'');
    });
  }

  function _rerenderFracs(key){
    const fracsDiv = document.querySelector(`[data-fracs="${key}"]`);
    if (!fracsDiv) return;
    const st = _state[key];
    const addBtn = fracsDiv.querySelector('.mt-add-frac');
    fracsDiv.querySelectorAll('.mt-frac-row').forEach(r => r.remove());
    st.fracciones.forEach((frac, idx) => {
      fracsDiv.insertBefore(_buildFracRow(key, idx, frac, st.total), addBtn);
    });
  }

  function _addFrac(key){
    const st = _state[key];
    st.fracciones.push({ div: 4, add: 0 });
    _savePrefs();
    _rerenderFracs(key);
  }

  // ── Ocultar / mostrar ─────────────────────────────────────────────
  function _hide(key){
    _vis[key] = false;
    _savePrefs();
    const el = document.querySelector(`.mt-field[data-key="${key}"]`);
    if (el) el.remove();
    _renderHidden();
    _updateFoot();
  }

  function _show(key){
    _vis[key] = true;
    _savePrefs();
    _renderAll(); // re-render completo para mantener orden
  }

  function _renderHidden(){
    const hidden = _allFields().filter(f => !_isVisible(f.key));
    const section = document.getElementById('mt-hidden-section');
    const rowsDiv = document.getElementById('mt-hidden-rows');
    const label   = document.getElementById('mt-hidden-label');
    if (!section || !rowsDiv || !label) return;

    if (hidden.length === 0) {
      section.style.display = 'none';
      _hiddenOpen = false;
      return;
    }

    section.style.display = 'block';
    label.textContent = hidden.length + ' medida' + (hidden.length!==1?'s':'') + ' oculta' + (hidden.length!==1?'s':'');

    rowsDiv.innerHTML = '';
    hidden.forEach(f => {
      const row = document.createElement('div');
      row.className = 'mt-hidden-row';
      row.innerHTML = `
        <svg width="13" height="13" fill="none" stroke="#3a3a55" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
        <span style="flex:1;font-size:11px;color:#5a5678">${f.label}</span>
        <span style="font-size:9px;color:#3a3a55">${f.hint}</span>
        <button class="mt-show-btn" data-show="${f.key}">Mostrar</button>`;
      row.querySelector('.mt-show-btn').onclick = () => _show(f.key);
      rowsDiv.appendChild(row);
    });

    // mantener estado abierto/cerrado
    const toggle = document.getElementById('mt-hidden-toggle');
    const rowsEl = document.getElementById('mt-hidden-rows');
    toggle.classList.toggle('open', _hiddenOpen);
    rowsEl.classList.toggle('open', _hiddenOpen);
  }

  function _toggleHidden(){
    _hiddenOpen = !_hiddenOpen;
    const toggle = document.getElementById('mt-hidden-toggle');
    const rows   = document.getElementById('mt-hidden-rows');
    toggle.classList.toggle('open', _hiddenOpen);
    rows.classList.toggle('open', _hiddenOpen);
  }

  function _updateTalla(bust){
    const badge = document.getElementById('mt-talla');
    if (badge) badge.textContent = bust > 0 ? 'Talla ' + (_getTalla(bust)||'—') : 'Talla —';
  }

  function _updateFoot(){
    const note = document.getElementById('mt-foot-note');
    if (!note) return;
    let filled = 0;
    _allFields().forEach(f => { if (_isVisible(f.key) && parseFloat(_state[f.key]?.total) > 0) filled++; });
    note.textContent = filled > 0 ? filled + ' medida' + (filled!==1?'s':'') + ' con valor' : 'Ingresa las medidas del cliente';
  }

  // ── Clientes ──────────────────────────────────────────────────────
  async function _loadClients(){
    const sel = document.getElementById('mt-csel');
    if (!sel) return;
    sel.innerHTML = '<option value="" disabled>Cargando clientes…</option>';
    // Siempre refresca desde Firestore para que sea consistente entre dispositivos
    if (PAT.MeasurementProfiles?.loadAll) await PAT.MeasurementProfiles.loadAll();
    sel.innerHTML = '<option value="">— Sin cliente —</option>';
    if (!PAT.MeasurementProfiles) return;
    PAT.MeasurementProfiles.listar().forEach(p => {
      const o = document.createElement('option');
      o.value = p.id; o.textContent = p.nombre; sel.appendChild(o);
    });
    if (_currentClientId) { sel.value = _currentClientId; }
    else if (PAT.Clients?.activeId) {
      sel.value = PAT.Clients.activeId;
      _currentClientId = PAT.Clients.activeId;
    }
  }

  function _loadClientMeasures(id){
    const p = PAT.MeasurementProfiles?.obtener(id);
    if (!p?.medidas) return;
    _allFields().forEach(f => {
      const v = p.medidas[f.key] || p.medidas[f.measure];
      if (!_state[f.key]) _getState(f.key);
      if (v) _state[f.key].total = String(v);
    });
    _savePrefs();
    _renderAll();
    const bust = parseFloat(p.medidas.bust || p.medidas.bust);
    if (bust > 0) _updateTalla(bust);
    if (PAT.App) PAT.App.toast('Medidas de "' + p.nombre + '" cargadas', 'success');
  }

  function _collectValues(){
    const vals = {};
    _allFields().forEach(f => {
      const t = parseFloat(_state[f.key]?.total);
      if (t > 0) vals[f.key] = t;
    });
    return vals;
  }

  async function _saveToClient(){
    const sel = document.getElementById('mt-csel');
    const id  = sel?.value;
    if (!id) { if (PAT.App) PAT.App.toast('Selecciona un cliente primero', 'warning'); return; }
    const ex = PAT.MeasurementProfiles?.obtener(id);
    await PAT.MeasurementProfiles?.guardar(
      ex?.nombre||'Cliente', _collectValues(),
      {id, genero:ex?.genero, notas:ex?.notas, telefono:ex?.telefono, email:ex?.email}
    );
    if (PAT.App) PAT.App.toast('💾 Guardado en "' + (ex?.nombre||'Cliente') + '"', 'success');
  }

  async function _createClient(){
    const inp  = document.getElementById('mt-new-inp');
    const name = (inp?.value||'').trim();
    if (!name) { inp?.focus(); return; }
    const id = await PAT.MeasurementProfiles?.guardar(name, _collectValues(), {});
    document.getElementById('mt-new-bar').classList.remove('open');
    inp.value = '';
    _currentClientId = id;
    _loadClients();
    document.getElementById('mt-csel').value = id;
    if (PAT.App) PAT.App.toast('✓ "' + name + '" creado', 'success');
  }

  // ── Aplicar medidas al panel izquierdo ────────────────────────────
  function _applyToPanel(){
    _allFields().forEach(f => {
      const v = parseFloat(_state[f.key]?.total);
      const inp = document.querySelector(`input[data-measure="${f.measure}"]`);
      if (inp && v > 0) { inp.value = v; inp.dispatchEvent(new Event('input',{bubbles:true})); }
    });
  }

  function _proceed(){
    _applyToPanel();
    _close();
    if (_onProceed) _onProceed();
  }

  function _close(){
    if (_modal) _modal.style.display = 'none';
  }

  // ── Agregar medida personalizada ──────────────────────────────────
  function _addCustomField(){
    const lbl = (document.getElementById('mt-add-lbl')?.value || '').trim();
    if (!lbl) return;
    const rawKey = (document.getElementById('mt-add-key')?.value || '').trim();
    const key = rawKey
      ? rawKey.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')
      : lbl.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'').toLowerCase();
    if (!key) return;
    const existing = _loadCustomFields();
    if (_allFields().some(f => f.key === key)) {
      if (window.PAT?.App) PAT.App.toast('Esa clave ya existe', 'warning');
      return;
    }
    existing.push({ key, label: lbl, field: key });
    _saveCustomFields(existing);
    document.getElementById('mt-add-lbl').value = '';
    document.getElementById('mt-add-key').value = '';
    _addFormOpen = false;
    document.getElementById('mt-add-form').style.display = 'none';
    _renderAll();
    if (window.PAT?.App) PAT.App.toast('✓ Medida "' + lbl + '" agregada', 'success');
  }

  // ── Imprimir / Guardar PDF ────────────────────────────────────────
  function _print(){
    const clientName = document.getElementById('mt-csel')?.selectedOptions[0]?.text || '';
    const talla = document.getElementById('mt-talla')?.textContent || '';
    const date  = new Date().toLocaleDateString('es-ES', {year:'numeric',month:'long',day:'numeric'});

    let rows = '';
    _allFields().forEach(f => {
      const st = _state[f.key];
      if (!st || !parseFloat(st.total)) return;
      const vis = _isVisible(f.key);
      const fracs = (st.fracciones||[]).map(fr => {
        const res = _calc(st.total, fr.div, fr.add);
        const divLabel = DIVS.find(d=>d.v==fr.div)?.l || ('÷'+fr.div);
        const addTxt = fr.add > 0 ? '+'+fr.add : fr.add < 0 ? fr.add : '';
        return `<span class="frac">${divLabel}${addTxt} = <b>${res} cm</b></span>`;
      }).join('');
      rows += `<tr${vis?'':' class="hidden-row"'}>
        <td>${f.label}<small>${f.hint}</small></td>
        <td><b>${st.total} cm</b></td>
        <td>${fracs}</td>
      </tr>`;
    });

    const hiddenCount = _allFields().filter(f => !_isVisible(f.key) && parseFloat(_state[f.key]?.total) > 0).length;

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Tabla de Medidas — ${clientName||'PatrónAI'}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;font-size:12px;color:#1a1a2e;padding:20px 28px}
  header{display:flex;justify-content:space-between;align-items:flex-end;
    padding-bottom:10px;border-bottom:2px solid #8b5cf6;margin-bottom:14px}
  h1{font-size:17px;font-weight:800;color:#6d28d9}
  .meta{font-size:10px;color:#666;text-align:right;line-height:1.6}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#ede9fe}
  th{padding:6px 8px;text-align:left;font-size:10px;color:#6d28d9;text-transform:uppercase;letter-spacing:.05em}
  td{padding:5px 8px;vertical-align:top;border-bottom:1px solid #e5e7eb}
  td:first-child{width:30%;color:#374151;font-weight:600}
  td:first-child small{display:block;font-weight:400;font-size:9px;color:#9ca3af}
  td:nth-child(2){width:15%;font-family:monospace;color:#6d28d9}
  td:last-child .frac{display:inline-block;background:#f3f0ff;border:1px solid #ddd8fa;
    border-radius:4px;padding:1px 6px;margin:1px 2px;font-size:10px;font-family:monospace}
  .hidden-row{opacity:.5;font-style:italic}
  .hidden-row td:first-child::before{content:'(oculta) ';font-size:9px;color:#9ca3af}
  tr:nth-child(even){background:#fafafa}
  footer{margin-top:12px;font-size:9px;color:#9ca3af;text-align:center;
    border-top:1px solid #e5e7eb;padding-top:8px}
  @media print{body{padding:10px}button{display:none}}
</style></head><body>
<header>
  <div>
    <h1>📐 Tabla de Medidas</h1>
    ${clientName ? `<p style="font-size:11px;color:#6b7280;margin-top:3px">Cliente: <b>${clientName}</b></p>` : ''}
  </div>
  <div class="meta">
    <div><b>${talla}</b></div>
    <div>${date}</div>
    <div style="margin-top:6px"><button onclick="window.print()" style="padding:4px 12px;background:#8b5cf6;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:10px">🖨 Imprimir / Guardar PDF</button></div>
  </div>
</header>
<table>
  <thead><tr><th>Medida</th><th>Total cm</th><th>Fracciones</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
${hiddenCount > 0 ? `<p style="margin-top:10px;font-size:10px;color:#9ca3af;font-style:italic">${hiddenCount} medida(s) oculta(s) no incluida(s) en esta vista.</p>` : ''}
<footer>Generado con PatrónAI Pro · patronai.app</footer>
</body></html>`;

    const w = window.open('', '_blank', 'width=750,height=900');
    if (w) { w.document.write(html); w.document.close(); }
  }

  // ── API pública ───────────────────────────────────────────────────
  function open(onProceed){
    _onProceed = onProceed;
    _loadPrefs();
    if (!_modal) _build();
    _loadClients();
    _renderAll();
    // restaurar talla si hay bust
    const bust = parseFloat(_state['bust']?.total);
    if (bust > 0) _updateTalla(bust);
    _modal.style.display = 'flex';
  }

  function rerender(){
    // Re-carga campos personalizados desde localStorage y re-renderiza
    const updated = _loadCustomFields();
    _allFields(); // re-evaluates dynamically from _loadCustomFields
    _renderAll();
  }

  return { open, rerender, getValues: _collectValues };

})();
