'use strict';
window.PAT = window.PAT || {};

PAT.MeasureTable = (function () {

  const LS_VIS = 'pat_mtable_vis';   // qué filas están visibles
  const LS_DIV = 'pat_mtable_div';   // fracción guardada por campo

  // ── Catálogo de medidas (orden definido por el usuario) ─────────
  const FIELDS = [
    { key:'bust',        measure:'bust',        label:'Busto / Pecho',        hint:'contorno de pecho',      defDiv:4,  talla:true  },
    { key:'backWidth',   measure:'backWidth',   label:'Ancho de espalda',     hint:'ancho en dorso',         defDiv:2,  talla:false },
    { key:'backLength',  measure:'backLength',  label:'Talle parte trasera',  hint:'nuca → cintura',         defDiv:1,  talla:false },
    { key:'frontLength', measure:'frontLength', label:'Talle parte delantera',hint:'cuello → cintura',       defDiv:1,  talla:false },
    { key:'waist',       measure:'waist',       label:'Contorno de cintura',  hint:'contorno de cintura',    defDiv:4,  talla:false },
    { key:'hipDepth',    measure:'hipDepth',    label:'Alto de cadera',       hint:'cintura → cadera',       defDiv:1,  talla:false },
    { key:'hip',         measure:'hip',         label:'Contorno de cadera',   hint:'contorno de cadera',     defDiv:4,  talla:false },
    { key:'skirtLength', measure:'skirtLength', label:'Largo de falda',       hint:'cintura → dobladillo',   defDiv:1,  talla:false },
    { key:'sleeveShort', measure:'sleeveShort', label:'Largo manga corta',    hint:'hombro → codo',          defDiv:1,  talla:false },
    { key:'sleeveLength',measure:'sleeveLength',label:'Largo manga larga',    hint:'hombro → muñeca',        defDiv:1,  talla:false },
    { key:'armCirc',     measure:'armCirc',     label:'Contorno de brazo',    hint:'contorno de brazo',      defDiv:2,  talla:false },
    { key:'wrist',       measure:'wrist',       label:'Contorno de muñeca',   hint:'contorno de muñeca',     defDiv:1,  talla:false },
    { key:'neck',        measure:'neck',        label:'Contorno de cuello',   hint:'contorno de cuello',     defDiv:6,  talla:false },
    { key:'totalLength', measure:'totalLength', label:'Largo de camisa',      hint:'hombro → bajo',          defDiv:1,  talla:false },
    { key:'armhole',     measure:'armhole',     label:'Sisa',                 hint:'contorno de sisa',       defDiv:2,  talla:false },
    { key:'shoulder',    measure:'shoulder',    label:'Ancho de hombros',     hint:'hombro a hombro',        defDiv:2,  talla:false },
    { key:'rise',        measure:'rise',        label:'Entrepierna',          hint:'crotch depth',           defDiv:1,  talla:false },
    { key:'thigh',       measure:'thigh',       label:'Contorno de muslo',    hint:'contorno de muslo',      defDiv:2,  talla:false },
    { key:'inseam',      measure:'inseam',      label:'Largo de pantalón',    hint:'cintura → tobillo',      defDiv:1,  talla:false },
    { key:'outseam',     measure:'outseam',     label:'Tiro largo',           hint:'cintura → suelo',        defDiv:1,  talla:false },
    { key:'knee',        measure:'knee',        label:'Contorno de rodilla',  hint:'contorno de rodilla',    defDiv:2,  talla:false },
    { key:'ankle',       measure:'ankle',       label:'Contorno de tobillo',  hint:'contorno de tobillo',    defDiv:1,  talla:false },
  ];

  const DIVS = [
    {v:1,l:'Completa ÷1'},{v:2,l:'Mitad ÷2'},{v:3,l:'Tercio ÷3'},
    {v:4,l:'Cuarta ÷4'},{v:5,l:'Quinta ÷5'},{v:6,l:'Sexta ÷6'},
    {v:8,l:'Octava ÷8'},{v:10,l:'Décima ÷10'},
  ];

  const TALLAS = [
    {max:76, label:'XXS / 30'},
    {max:80, label:'XS / 32'},
    {max:84, label:'XS-S / 34'},
    {max:88, label:'S / 36'},
    {max:92, label:'M / 38'},
    {max:96, label:'M-L / 40'},
    {max:100,label:'L / 42'},
    {max:104,label:'XL / 44'},
    {max:110,label:'XXL / 46'},
    {max:999,label:'XXXL / 48+'},
  ];

  function _getTalla(bust) {
    if (!bust || isNaN(bust)) return null;
    return (TALLAS.find(t => bust <= t.max) || TALLAS[TALLAS.length-1]).label;
  }

  // ── Persistencia de preferencias UI ──────────────────────────────
  function _loadVis()  { try { return JSON.parse(localStorage.getItem(LS_VIS) || '{}'); } catch(e) { return {}; } }
  function _saveVis(v) { try { localStorage.setItem(LS_VIS, JSON.stringify(v)); } catch(e) {} }
  function _loadDivs() { try { return JSON.parse(localStorage.getItem(LS_DIV) || '{}'); } catch(e) { return {}; } }
  function _saveDivs(d){ try { localStorage.setItem(LS_DIV, JSON.stringify(d)); } catch(e) {} }

  // ── Aplicar medidas al panel izquierdo ────────────────────────────
  function _applyToPanel(values) {
    FIELDS.forEach(f => {
      const v = values[f.key];
      const inp = document.querySelector(`input[data-measure="${f.measure}"]`);
      if (!inp) return;
      if (v !== undefined && v !== null && v !== '') {
        inp.value = v;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  // ── Leer medidas del panel izquierdo ──────────────────────────────
  function _readFromPanel() {
    const vals = {};
    FIELDS.forEach(f => {
      const inp = document.querySelector(`input[data-measure="${f.measure}"]`);
      if (inp && inp.value) vals[f.key] = parseFloat(inp.value) || 0;
    });
    return vals;
  }

  // ── Modal principal ───────────────────────────────────────────────
  let _modal = null;
  let _vis = {};
  let _divs = {};
  let _onProceed = null;
  let _currentClientId = null;

  function open(onProceed) {
    _onProceed = onProceed || null;
    _vis  = _loadVis();
    _divs = _loadDivs();
    if (!_modal) _build();
    _loadClients();
    _renderRows();
    _modal.style.display = 'flex';
  }

  function _close() {
    if (_modal) _modal.style.display = 'none';
  }

  function _build() {
    // CSS
    const style = document.createElement('style');
    style.textContent = `
#mt-modal{position:fixed;inset:0;z-index:9800;background:rgba(5,4,15,.85);
  display:flex;align-items:center;justify-content:center;padding:12px}
#mt-box{background:#0f0e1a;border:1px solid #2e2e45;border-radius:16px;
  width:100%;max-width:700px;max-height:92vh;display:flex;flex-direction:column;
  overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.8)}
.mt-head{padding:12px 18px;border-bottom:1px solid #2e2e45;display:flex;align-items:center;gap:10px;flex-shrink:0}
.mt-head-title{font-size:14px;font-weight:700;color:#ede9fe;flex:1}
.mt-talla-badge{padding:3px 12px;border-radius:999px;font-size:11px;font-weight:700;
  background:rgba(139,92,246,.2);color:#a78bfa;border:1px solid rgba(139,92,246,.35);white-space:nowrap}
.mt-btn-skip{padding:6px 14px;border-radius:8px;border:1.5px solid #2e2e45;
  background:transparent;color:#9490b0;font-size:11px;cursor:pointer;font-family:inherit}
.mt-btn-skip:hover{border-color:#3d3d58;color:#ede9fe}
.mt-btn-go{padding:6px 16px;border-radius:8px;border:none;
  background:#8b5cf6;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}
.mt-btn-go:hover{filter:brightness(1.1)}
.mt-client-bar{padding:8px 18px;border-bottom:1px solid #2e2e45;
  display:flex;align-items:center;gap:8px;flex-shrink:0;flex-wrap:wrap}
.mt-client-sel{flex:1;min-width:160px;background:#141420;border:1.5px solid #2e2e45;
  border-radius:8px;color:#ede9fe;padding:6px 10px;font-size:12px;font-family:inherit}
.mt-client-sel:focus{outline:none;border-color:#8b5cf6}
.mt-btn-save{padding:5px 12px;border-radius:7px;border:1.5px solid #2e2e45;
  background:transparent;color:#9490b0;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap}
.mt-btn-save:hover{border-color:#8b5cf6;color:#a78bfa}
.mt-btn-new{padding:5px 12px;border-radius:7px;border:none;
  background:rgba(139,92,246,.15);color:#a78bfa;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap}
.mt-btn-new:hover{background:rgba(139,92,246,.25)}
.mt-col-hdr{display:grid;grid-template-columns:26px 1fr 78px 130px 58px 88px;
  gap:6px;padding:5px 18px;border-bottom:1px solid #2e2e45;flex-shrink:0;background:#090912}
.mt-col-hdr span{font-size:9px;font-weight:700;text-transform:uppercase;
  letter-spacing:.06em;color:#5a5678}
.mt-col-hdr span:nth-child(n+3){text-align:right}
.mt-rows{overflow-y:auto;flex:1}
.mt-row{display:grid;grid-template-columns:26px 1fr 78px 130px 58px 88px;
  gap:6px;align-items:center;padding:5px 18px;border-bottom:1px solid #1a1828;
  transition:opacity .15s}
.mt-row:hover{background:#111020}
.mt-row.mt-hidden{opacity:.3}
.mt-eye{background:none;border:none;cursor:pointer;color:#3d3d58;padding:2px;
  border-radius:4px;font-size:14px;display:flex;align-items:center;justify-content:center}
.mt-eye:hover{color:#9490b0;background:#1a1828}
.mt-lbl{font-size:11px;color:#ede9fe;line-height:1.3}
.mt-hint{font-size:9px;color:#5a5678}
.mt-inp{width:100%;padding:4px 7px;font-size:11px;border-radius:6px;
  border:1.5px solid #2e2e45;background:#141420;color:#ede9fe;
  font-family:monospace;text-align:right}
.mt-inp:focus{outline:none;border-color:#8b5cf6}
.mt-sel{width:100%;padding:4px 5px;font-size:10px;border-radius:6px;
  border:1.5px solid #2e2e45;background:#141420;color:#ede9fe;font-family:inherit}
.mt-add{width:100%;padding:4px 7px;font-size:11px;border-radius:6px;
  border:1.5px solid #2e2e45;background:#141420;color:#ede9fe;
  font-family:monospace;text-align:right}
.mt-result{font-size:12px;font-weight:700;font-family:monospace;
  color:#34d399;text-align:right;white-space:nowrap}
.mt-result.mt-empty{color:#3d3d58;font-weight:400}
.mt-foot{padding:10px 18px;border-top:1px solid #2e2e45;
  display:flex;align-items:center;justify-content:space-between;
  flex-shrink:0;background:#090912}
.mt-foot-note{font-size:10px;color:#5a5678}
.mt-show-all{font-size:10px;color:#8b5cf6;background:none;border:none;
  cursor:pointer;font-family:inherit;padding:0}
.mt-show-all:hover{text-decoration:underline}
.mt-new-name-bar{padding:8px 18px;border-top:1px solid #2e2e45;
  display:flex;gap:8px;align-items:center;flex-shrink:0;display:none}
.mt-new-name-inp{flex:1;background:#141420;border:1.5px solid #8b5cf6;
  border-radius:8px;color:#ede9fe;padding:6px 10px;font-size:12px;font-family:inherit}
.mt-new-name-inp:focus{outline:none}
`;
    document.head.appendChild(style);

    _modal = document.createElement('div');
    _modal.id = 'mt-modal';
    _modal.style.display = 'none';
    _modal.innerHTML = `
      <div id="mt-box">
        <div class="mt-head">
          <span class="mt-head-title">📐 Tabla de medidas</span>
          <span class="mt-talla-badge" id="mt-talla-badge">Talla —</span>
          <button class="mt-btn-skip" id="mt-skip">Omitir</button>
          <button class="mt-btn-go" id="mt-go">✓ Comenzar a trazar</button>
        </div>
        <div class="mt-client-bar">
          <select class="mt-client-sel" id="mt-client-sel">
            <option value="">— Sin cliente —</option>
          </select>
          <button class="mt-btn-save" id="mt-save-client">💾 Guardar en cliente</button>
          <button class="mt-btn-new"  id="mt-new-client">＋ Nuevo cliente</button>
        </div>
        <div class="mt-new-name-bar" id="mt-new-name-bar">
          <input class="mt-new-name-inp" id="mt-new-name-inp" placeholder="Nombre del cliente (ej. Sr. Albert)">
          <button class="mt-btn-go" id="mt-new-name-ok">Crear</button>
          <button class="mt-btn-skip" id="mt-new-name-cancel">✕</button>
        </div>
        <div class="mt-col-hdr">
          <span></span><span>Medida</span>
          <span>Total cm</span><span>Fracción</span>
          <span>± cm</span><span>Resultado</span>
        </div>
        <div class="mt-rows" id="mt-rows"></div>
        <div class="mt-foot">
          <span id="mt-hidden-note"></span>
          <span id="mt-filled-note" style="font-size:10px;color:#5a5678"></span>
        </div>
      </div>`;
    document.body.appendChild(_modal);

    // Cerrar con click en overlay
    _modal.addEventListener('click', e => { if (e.target === _modal) _close(); });

    document.getElementById('mt-skip').onclick = () => { _close(); if (_onProceed) _onProceed(); };
    document.getElementById('mt-go').onclick   = _proceed;

    document.getElementById('mt-client-sel').onchange = e => {
      _currentClientId = e.target.value || null;
      _loadClientMeasures(_currentClientId);
    };

    document.getElementById('mt-save-client').onclick = _saveToClient;
    document.getElementById('mt-new-client').onclick  = () => {
      const bar = document.getElementById('mt-new-name-bar');
      bar.style.display = bar.style.display === 'flex' ? 'none' : 'flex';
      if (bar.style.display === 'flex') document.getElementById('mt-new-name-inp').focus();
    };
    document.getElementById('mt-new-name-ok').onclick     = _createClient;
    document.getElementById('mt-new-name-cancel').onclick = () => {
      document.getElementById('mt-new-name-bar').style.display = 'none';
    };
  }

  function _renderRows() {
    const container = document.getElementById('mt-rows');
    if (!container) return;
    container.innerHTML = '';
    FIELDS.forEach(f => {
      const isVisible = _vis[f.key] !== false;
      const savedDiv  = _divs[f.key] || f.defDiv;
      const row = document.createElement('div');
      row.className = 'mt-row' + (isVisible ? '' : ' mt-hidden');
      row.dataset.key = f.key;

      const divOpts = DIVS.map(d =>
        `<option value="${d.v}"${d.v == savedDiv ? ' selected' : ''}>${d.l}</option>`
      ).join('');

      row.innerHTML = `
        <button class="mt-eye" data-key="${f.key}" title="${isVisible ? 'Ocultar' : 'Mostrar'}">
          ${isVisible
            ? '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
            : '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>'}
        </button>
        <div>
          <div class="mt-lbl">${f.label}</div>
          <div class="mt-hint">${f.hint}</div>
        </div>
        <input class="mt-inp" type="number" placeholder="0" step="0.5" min="0" data-field="${f.key}">
        <select class="mt-sel" data-field="${f.key}">${divOpts}</select>
        <input class="mt-add" type="number" value="0" step="0.5" data-field="${f.key}">
        <span class="mt-result mt-empty" data-result="${f.key}">—</span>`;

      container.appendChild(row);

      row.querySelector('.mt-eye').onclick = () => _toggleVis(f.key);
      row.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', () => _calcRow(f.key));
      });
    });

    _updateFooter();
  }

  function _calcRow(key) {
    const f = FIELDS.find(f => f.key === key);
    if (!f) return;
    const row   = document.querySelector(`.mt-row[data-key="${key}"]`);
    const total = parseFloat(row.querySelector(`.mt-inp[data-field="${key}"]`).value);
    const div   = parseFloat(row.querySelector(`.mt-sel[data-field="${key}"]`).value) || 1;
    const add   = parseFloat(row.querySelector(`.mt-add[data-field="${key}"]`).value) || 0;
    const res   = row.querySelector(`[data-result="${key}"]`);

    // guardar fracción elegida
    _divs[key] = div;
    _saveDivs(_divs);

    if (!total || isNaN(total)) {
      res.textContent = '—'; res.className = 'mt-result mt-empty';
    } else {
      res.textContent = '= ' + (total / div + add).toFixed(1) + ' cm';
      res.className   = 'mt-result';
    }

    // actualizar talla si es bust
    if (key === 'bust') _updateTalla(total);
    _updateFooter();
  }

  function _updateTalla(bustVal) {
    const badge = document.getElementById('mt-talla-badge');
    if (!badge) return;
    const t = _getTalla(bustVal);
    badge.textContent = t ? 'Talla ' + t : 'Talla —';
  }

  function _toggleVis(key) {
    _vis[key] = _vis[key] === false ? true : false;
    _saveVis(_vis);
    _renderRows();
    // re-poblar valores
    _restoreRowValues();
  }

  // guardar valores actuales antes de re-render
  let _rowCache = {};
  function _snapshotValues() {
    FIELDS.forEach(f => {
      const row = document.querySelector(`.mt-row[data-key="${f.key}"]`);
      if (!row) return;
      _rowCache[f.key] = {
        total: row.querySelector(`.mt-inp[data-field="${f.key}"]`)?.value || '',
        add:   row.querySelector(`.mt-add[data-field="${f.key}"]`)?.value || '0',
      };
    });
  }
  function _restoreRowValues() {
    FIELDS.forEach(f => {
      if (!_rowCache[f.key]) return;
      const row = document.querySelector(`.mt-row[data-key="${f.key}"]`);
      if (!row) return;
      const inpT = row.querySelector(`.mt-inp[data-field="${f.key}"]`);
      const inpA = row.querySelector(`.mt-add[data-field="${f.key}"]`);
      if (inpT && _rowCache[f.key].total) { inpT.value = _rowCache[f.key].total; }
      if (inpA) { inpA.value = _rowCache[f.key].add; }
      _calcRow(f.key);
    });
  }

  // sobrescribir toggleVis para capturar valores antes
  const _origToggle = _toggleVis;

  function _updateFooter() {
    let filled = 0, hidden = 0;
    FIELDS.forEach(f => {
      if (_vis[f.key] === false) { hidden++; return; }
      const row = document.querySelector(`.mt-row[data-key="${f.key}"] .mt-inp`);
      if (row && parseFloat(row.value) > 0) filled++;
    });
    const note = document.getElementById('mt-hidden-note');
    const fill = document.getElementById('mt-filled-note');
    if (note) note.innerHTML = hidden > 0
      ? `<button class="mt-show-all" id="mt-show-all">${hidden} oculta${hidden!==1?'s':''} — mostrar todas</button>`
      : '';
    if (fill) fill.textContent = filled > 0 ? `${filled} medida${filled!==1?'s':''} ingresada${filled!==1?'s':''}` : '';
    const btn = document.getElementById('mt-show-all');
    if (btn) btn.onclick = () => {
      FIELDS.forEach(f => { _vis[f.key] = true; });
      _saveVis(_vis);
      _snapshotValues();
      _renderRows();
      _restoreRowValues();
    };
  }

  // ── Clientes ──────────────────────────────────────────────────────
  function _loadClients() {
    const sel = document.getElementById('mt-client-sel');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Sin cliente —</option>';
    if (!PAT.MeasurementProfiles) return;
    const list = PAT.MeasurementProfiles.listar();
    list.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nombre;
      sel.appendChild(opt);
    });
    // si hay un cliente activo en PAT.Clients, preseleccionarlo
    if (PAT.Clients && PAT.Clients.activeId) {
      sel.value = PAT.Clients.activeId;
      _currentClientId = PAT.Clients.activeId;
      _loadClientMeasures(_currentClientId);
    }
  }

  function _loadClientMeasures(id) {
    if (!id || !PAT.MeasurementProfiles) return;
    const p = PAT.MeasurementProfiles.obtener(id);
    if (!p || !p.medidas) return;
    const m = p.medidas;
    FIELDS.forEach(f => {
      const row = document.querySelector(`.mt-row[data-key="${f.key}"]`);
      if (!row) return;
      const v = m[f.key] || m[f.measure] || '';
      const inp = row.querySelector(`.mt-inp[data-field="${f.key}"]`);
      if (inp) { inp.value = v ? String(v) : ''; }
      _calcRow(f.key);
    });
    if (PAT.App) PAT.App.toast('Medidas de "' + p.nombre + '" cargadas', 'success');
  }

  function _collectValues() {
    const vals = {};
    FIELDS.forEach(f => {
      const row = document.querySelector(`.mt-row[data-key="${f.key}"]`);
      if (!row) return;
      const v = parseFloat(row.querySelector(`.mt-inp[data-field="${f.key}"]`)?.value);
      if (v > 0) vals[f.key] = v;
    });
    return vals;
  }

  async function _saveToClient() {
    if (!PAT.MeasurementProfiles) { if (PAT.App) PAT.App.toast('Módulo de perfiles no disponible', 'warning'); return; }
    const sel = document.getElementById('mt-client-sel');
    const id  = sel?.value;
    if (!id) { if (PAT.App) PAT.App.toast('Selecciona un cliente primero', 'warning'); return; }
    const existing = PAT.MeasurementProfiles.obtener(id);
    const medidas  = _collectValues();
    await PAT.MeasurementProfiles.guardar(
      existing?.nombre || 'Cliente',
      medidas,
      { id, genero: existing?.genero, notas: existing?.notas,
        telefono: existing?.telefono, email: existing?.email }
    );
    if (PAT.App) PAT.App.toast('💾 Medidas guardadas en "' + (existing?.nombre || 'Cliente') + '"', 'success');
  }

  async function _createClient() {
    const nameInp = document.getElementById('mt-new-name-inp');
    const name    = (nameInp?.value || '').trim();
    if (!name) { nameInp?.focus(); return; }
    if (!PAT.MeasurementProfiles) return;
    const medidas = _collectValues();
    const id = await PAT.MeasurementProfiles.guardar(name, medidas, {});
    document.getElementById('mt-new-name-bar').style.display = 'none';
    nameInp.value = '';
    _loadClients();
    const sel = document.getElementById('mt-client-sel');
    if (sel) { sel.value = id; _currentClientId = id; }
    if (PAT.App) PAT.App.toast('✓ Cliente "' + name + '" creado', 'success');
  }

  function _proceed() {
    const vals = _collectValues();
    _applyToPanel(vals);
    _close();
    if (_onProceed) _onProceed();
  }

  return { open };

})();
