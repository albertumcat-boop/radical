'use strict';
window.PAT = window.PAT || {};

/**
 * PAT.Clients — gestión de clientes con sus tablas de medidas.
 * Cada cliente tiene: nombre, género, notas, teléfono, email y medidas completas.
 * Se apoya en PAT.MeasurementProfiles para persistencia (Firestore / localStorage).
 * El panel se renderiza como overlay full-screen sobre la app.
 */
PAT.Clients = (function () {

  // ── Campos de medidas con etiquetas ────────────────────────────
  const MEASURE_FIELDS = [
    { key:'bust',        label:'Busto / Pecho',   unit:'cm', group:'torso' },
    { key:'waist',       label:'Cintura',          unit:'cm', group:'torso' },
    { key:'hip',         label:'Cadera',           unit:'cm', group:'torso' },
    { key:'shoulder',    label:'Hombros (ancho)',  unit:'cm', group:'torso' },
    { key:'neck',        label:'Cuello (perímet.)',unit:'cm', group:'torso' },
    { key:'backLength',  label:'Talle espalda',    unit:'cm', group:'largos' },
    { key:'frontLength', label:'Talle delantero',  unit:'cm', group:'largos' },
    { key:'totalLength', label:'Largo total torso',unit:'cm', group:'largos' },
    { key:'sleeveLength',label:'Largo manga',      unit:'cm', group:'largos' },
    { key:'wrist',       label:'Muñeca',           unit:'cm', group:'largos' },
    { key:'skirtLength', label:'Largo falda',      unit:'cm', group:'falda' },
    { key:'hipDepth',    label:'Talle a cadera',   unit:'cm', group:'falda' },
    { key:'inseam',      label:'Entrepierna',      unit:'cm', group:'pantalon' },
    { key:'outseam',     label:'Lateral total',    unit:'cm', group:'pantalon' },
    { key:'thigh',       label:'Muslo',            unit:'cm', group:'pantalon' },
    { key:'knee',        label:'Rodilla',          unit:'cm', group:'pantalon' },
    { key:'ankle',       label:'Tobillo',          unit:'cm', group:'pantalon' },
    { key:'shortLength', label:'Largo short',      unit:'cm', group:'pantalon' },
    { key:'rise',        label:'Tiro (talle↓)',    unit:'cm', group:'pantalon' },
  ];

  const GROUPS = {
    torso:   { label:'Torso',   color:'#f59e0b' },
    largos:  { label:'Largos',  color:'#60a5fa' },
    falda:   { label:'Falda',   color:'#a78bfa' },
    pantalon:{ label:'Pantalón',color:'#34d399' },
  };

  let _editId = null; // id del cliente que se está editando

  // ── Inyección HTML + CSS ────────────────────────────────────────
  function _inject() {
    if (document.getElementById('clients-overlay')) return;

    const style = document.createElement('style');
    style.textContent = `
/* ── CLIENTS OVERLAY ───────────────────────────────────────── */
#clients-overlay{
  position:fixed;inset:0;z-index:9200;
  background:rgba(20,18,30,.72);backdrop-filter:blur(12px);
  display:none;align-items:flex-start;justify-content:center;
  padding:24px 16px;overflow-y:auto;
}
#clients-overlay.open{display:flex}
#clients-panel{
  background:var(--panel,#1a1828);border:1px solid var(--bd,#2e2e45);
  border-radius:18px;width:100%;max-width:900px;
  box-shadow:0 32px 80px rgba(0,0,0,.55);
  display:flex;flex-direction:column;overflow:hidden;
  min-height:300px;
}
.cp-head{
  display:flex;align-items:center;gap:14px;
  padding:18px 22px;border-bottom:1px solid var(--bd,#2e2e45);
  flex-shrink:0;
}
.cp-head h2{font-size:1.05rem;font-weight:700;flex:1;color:var(--tx,#e8e4f0)}
.cp-head-btn{
  padding:7px 16px;border-radius:9px;font-size:12px;font-weight:700;
  border:none;cursor:pointer;font-family:inherit;transition:all .15s;
}
.cp-head-btn.pri{background:var(--acc,#b86b2e);color:#fff}
.cp-head-btn.pri:hover{filter:brightness(1.15)}
.cp-head-btn.sec{background:transparent;border:1.5px solid var(--bd,#2e2e45);color:var(--tx2,#9490b0)}
.cp-head-btn.sec:hover{border-color:var(--acc2,#d4603a);color:var(--acc2,#d4603a)}

/* Search */
.cp-search-wrap{padding:14px 22px;border-bottom:1px solid var(--bd,#2e2e45);flex-shrink:0}
.cp-search{
  width:100%;padding:8px 12px;border:1.5px solid var(--bd,#2e2e45);
  border-radius:9px;background:var(--bg2,#141420);color:var(--tx,#e8e4f0);
  font-family:inherit;font-size:13px;outline:none;transition:border-color .15s;
}
.cp-search:focus{border-color:var(--acc,#b86b2e)}
.cp-search::placeholder{color:var(--tx3,#5a5678)}

/* Client list */
.cp-list{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
  gap:14px;padding:18px 22px;overflow-y:auto;flex:1;
}
.cp-empty{
  grid-column:1/-1;text-align:center;padding:60px 20px;
  color:var(--tx3,#5a5678);font-size:13px;
}
.cp-empty-icon{font-size:2.5rem;display:block;margin-bottom:10px;opacity:.5}

/* Client card */
.cp-card{
  border:1.5px solid var(--bd,#2e2e45);border-radius:12px;
  padding:14px 16px;cursor:pointer;transition:all .18s;
  background:var(--bg2,#141420);position:relative;
}
.cp-card:hover{border-color:var(--acc,#b86b2e);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
.cp-card.active{border-color:var(--acc,#b86b2e);background:var(--accbg,rgba(184,107,46,.08))}
.cp-card-avatar{
  width:40px;height:40px;border-radius:10px;
  background:var(--accbg,rgba(184,107,46,.15));
  display:flex;align-items:center;justify-content:center;
  font-size:20px;margin-bottom:10px;
}
.cp-card-name{font-weight:700;font-size:.95rem;color:var(--tx,#e8e4f0);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cp-card-meta{font-size:.72rem;color:var(--tx3,#5a5678);margin-bottom:10px}
.cp-card-measures{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.cp-card-m{
  font-family:monospace;font-size:.7rem;padding:2px 7px;
  border-radius:5px;background:rgba(255,255,255,.04);color:var(--tx2,#9490b0);
  border:1px solid var(--bd,#2e2e45);
}
.cp-card-actions{display:flex;gap:7px}
.cp-card-btn{
  flex:1;padding:6px;border-radius:8px;font-size:.75rem;font-weight:600;
  border:1.5px solid var(--bd,#2e2e45);background:transparent;
  color:var(--tx2,#9490b0);cursor:pointer;font-family:inherit;transition:all .15s;
}
.cp-card-btn.load{background:var(--acc,#b86b2e);color:#fff;border-color:var(--acc,#b86b2e)}
.cp-card-btn.load:hover{filter:brightness(1.1)}
.cp-card-btn:not(.load):hover{border-color:var(--acc2,#d4603a);color:var(--acc2,#d4603a)}

/* ── CLIENT FORM ───────────────────────────────────────── */
#client-form-overlay{
  position:fixed;inset:0;z-index:9400;
  background:rgba(10,8,20,.8);backdrop-filter:blur(8px);
  display:none;align-items:center;justify-content:center;padding:16px;
}
#client-form-overlay.open{display:flex}
#client-form-panel{
  background:var(--panel,#1a1828);border:1px solid var(--bd,#2e2e45);
  border-radius:18px;width:100%;max-width:600px;max-height:90vh;
  overflow-y:auto;box-shadow:0 40px 100px rgba(0,0,0,.6);
}
.cf-head{
  padding:18px 22px 14px;border-bottom:1px solid var(--bd,#2e2e45);
  display:flex;align-items:center;gap:12px;position:sticky;top:0;
  background:var(--panel,#1a1828);z-index:1;
}
.cf-head h3{font-size:1rem;font-weight:700;flex:1;color:var(--tx,#e8e4f0)}
.cf-close{background:none;border:none;color:var(--tx3,#5a5678);font-size:1.1rem;cursor:pointer;padding:2px 6px;border-radius:6px}
.cf-close:hover{background:var(--bd,#2e2e45)}
.cf-body{padding:18px 22px 22px;display:flex;flex-direction:column;gap:14px}
.cf-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cf-field label{display:block;font-size:.72rem;font-weight:700;color:var(--tx3,#5a5678);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
.cf-inp,.cf-select,.cf-textarea{
  width:100%;padding:8px 12px;border:1.5px solid var(--bd,#2e2e45);
  border-radius:9px;background:var(--bg2,#141420);color:var(--tx,#e8e4f0);
  font-family:inherit;font-size:.88rem;outline:none;transition:border-color .15s;
}
.cf-inp:focus,.cf-select:focus,.cf-textarea:focus{border-color:var(--acc,#b86b2e)}
.cf-textarea{resize:vertical;min-height:70px;line-height:1.5}
.cf-group-title{
  font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;
  padding:6px 0 4px;border-bottom:1px solid var(--bd,#2e2e45);margin-top:4px;
}
.cf-measures-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
  gap:8px;margin-top:6px;
}
.cf-m-field label{font-size:.7rem;color:var(--tx3,#5a5678);display:block;margin-bottom:3px}
.cf-m-inp{
  width:100%;padding:6px 10px;border:1.5px solid var(--bd,#2e2e45);
  border-radius:7px;background:var(--bg2,#141420);color:var(--tx,#e8e4f0);
  font-family:monospace;font-size:.85rem;outline:none;transition:border-color .15s;
}
.cf-m-inp:focus{border-color:var(--acc,#b86b2e)}
.cf-footer{
  padding:14px 22px;border-top:1px solid var(--bd,#2e2e45);
  display:flex;gap:10px;align-items:center;
  position:sticky;bottom:0;background:var(--panel,#1a1828);
}
.cf-save-btn{
  flex:1;padding:11px;border:none;border-radius:10px;
  background:var(--acc,#b86b2e);color:#fff;font-family:inherit;
  font-size:.95rem;font-weight:700;cursor:pointer;transition:all .15s;
}
.cf-save-btn:hover{filter:brightness(1.1)}
.cf-save-btn:disabled{opacity:.5;cursor:not-allowed}
.cf-cancel-btn{
  padding:11px 20px;border:1.5px solid var(--bd,#2e2e45);border-radius:10px;
  background:transparent;color:var(--tx2,#9490b0);font-family:inherit;
  font-size:.88rem;cursor:pointer;transition:all .15s;
}
.cf-cancel-btn:hover{border-color:var(--acc2,#d4603a);color:var(--acc2,#d4603a)}

/* ── Botón en sidebar ─────────────────────────────────── */
.clients-open-btn{
  display:flex;align-items:center;gap:8px;width:100%;
  padding:8px 10px;border:1.5px solid var(--bd,#2e2e45);border-radius:9px;
  background:transparent;color:var(--tx2,#9490b0);font-family:inherit;
  font-size:12px;cursor:pointer;transition:all .15s;margin-bottom:6px;
}
.clients-open-btn:hover{border-color:var(--acc,#b86b2e);color:var(--acc,#b86b2e);background:var(--accbg,rgba(184,107,46,.08))}
.clients-open-btn .client-active-name{
  flex:1;text-align:left;font-weight:600;color:var(--acc,#b86b2e);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
`;
    document.head.appendChild(style);

    // Overlay principal (lista de clientes)
    const overlay = document.createElement('div');
    overlay.id = 'clients-overlay';
    overlay.innerHTML = `
      <div id="clients-panel">
        <div class="cp-head">
          <h2>👥 Mis Clientes</h2>
          <button class="cp-head-btn pri" id="cp-new-btn">+ Nuevo cliente</button>
          <button class="cp-head-btn sec" id="cp-close-btn">✕ Cerrar</button>
        </div>
        <div class="cp-search-wrap">
          <input class="cp-search" id="cp-search" type="search" placeholder="Buscar cliente…">
        </div>
        <div class="cp-list" id="cp-list">
          <div class="cp-empty"><span class="cp-empty-icon">👥</span>Cargando clientes…</div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // Overlay de formulario (crear/editar)
    const formOverlay = document.createElement('div');
    formOverlay.id = 'client-form-overlay';
    formOverlay.innerHTML = `
      <div id="client-form-panel">
        <div class="cf-head">
          <h3 id="cf-title">Nuevo cliente</h3>
          <button class="cf-close" id="cf-close-btn">✕</button>
        </div>
        <div class="cf-body">
          <div class="cf-row">
            <div class="cf-field">
              <label>Nombre del cliente *</label>
              <input class="cf-inp" id="cf-name" type="text" placeholder="Ej: Sr. Albert García">
            </div>
            <div class="cf-field">
              <label>Género</label>
              <select class="cf-select" id="cf-gender">
                <option value="">Sin especificar</option>
                <option value="mujer">Mujer</option>
                <option value="hombre">Hombre</option>
                <option value="nino">Niño / Niña</option>
              </select>
            </div>
          </div>
          <div class="cf-row">
            <div class="cf-field">
              <label>Teléfono</label>
              <input class="cf-inp" id="cf-phone" type="tel" placeholder="+58 412 000 0000">
            </div>
            <div class="cf-field">
              <label>Email</label>
              <input class="cf-inp" id="cf-email" type="email" placeholder="correo@ejemplo.com">
            </div>
          </div>
          <div class="cf-field">
            <label>Notas</label>
            <textarea class="cf-textarea" id="cf-notes" placeholder="Observaciones, preferencias de estilo, ajustes especiales…"></textarea>
          </div>
          ${_buildMeasureFields()}
        </div>
        <div class="cf-footer">
          <button class="cf-cancel-btn" id="cf-cancel-btn">Cancelar</button>
          <button class="cf-save-btn" id="cf-save-btn">💾 Guardar cliente</button>
        </div>
      </div>`;
    document.body.appendChild(formOverlay);

    _bindEvents();
  }

  function _buildMeasureFields() {
    let html = '';
    const groups = Object.entries(GROUPS);
    for (const [gKey, gMeta] of groups) {
      const fields = MEASURE_FIELDS.filter(f => f.group === gKey);
      html += `<div>
        <div class="cf-group-title" style="color:${gMeta.color}">${gMeta.label}</div>
        <div class="cf-measures-grid">
          ${fields.map(f => `
            <div class="cf-m-field">
              <label>${f.label} <span style="color:#5a5678">(${f.unit})</span></label>
              <input class="cf-m-inp" type="number" data-cf-measure="${f.key}" placeholder="—" min="0" step="0.5">
            </div>`).join('')}
        </div>
      </div>`;
    }
    return html;
  }

  function _bindEvents() {
    document.getElementById('cp-close-btn').onclick  = close;
    document.getElementById('cp-new-btn').onclick    = () => openForm(null);
    document.getElementById('cf-close-btn').onclick  = closeForm;
    document.getElementById('cf-cancel-btn').onclick = closeForm;
    document.getElementById('cf-save-btn').onclick   = saveClient;
    document.getElementById('cp-search').oninput     = e => renderList(e.target.value);
    document.getElementById('clients-overlay').onclick = e => { if (e.target === e.currentTarget) close(); };
    document.getElementById('client-form-overlay').onclick = e => { if (e.target === e.currentTarget) closeForm(); };
  }

  // ── Render lista ────────────────────────────────────────────────
  function renderList(query) {
    const list = document.getElementById('cp-list');
    if (!list) return;
    const perfiles = PAT.MeasurementProfiles ? PAT.MeasurementProfiles.listar() : [];
    const q = (query || '').toLowerCase().trim();
    const filtrados = q ? perfiles.filter(p => (p.nombre || '').toLowerCase().includes(q) || (p.notas || '').toLowerCase().includes(q)) : perfiles;

    if (!filtrados.length) {
      list.innerHTML = `<div class="cp-empty"><span class="cp-empty-icon">👥</span>${q ? 'No se encontraron clientes' : 'Aún no tienes clientes.<br>Pulsa "+ Nuevo cliente" para añadir el primero.'}</div>`;
      return;
    }

    const currentId = _currentClientId();
    list.innerHTML = filtrados.map(p => {
      const m = p.medidas || {};
      const avatar = p.genero === 'hombre' ? '👨' : p.genero === 'nino' ? '🧒' : '👩';
      const chips = ['bust','waist','hip'].filter(k => m[k]).map(k => {
        const labels = {bust:'B',waist:'C',hip:'Ca'};
        return `<span class="cp-card-m">${labels[k]} ${m[k]}</span>`;
      }).join('');
      const isActive = p.id === currentId;
      return `<div class="cp-card${isActive ? ' active' : ''}" data-id="${p.id}">
        <div class="cp-card-avatar">${avatar}</div>
        <div class="cp-card-name">${_esc(p.nombre)}</div>
        <div class="cp-card-meta">${p.genero ? p.genero + ' · ' : ''}${p.notas ? _esc(p.notas.slice(0,40))+'…' : 'Sin notas'}</div>
        <div class="cp-card-measures">${chips || '<span style="font-size:.7rem;color:#5a5678">Sin medidas</span>'}</div>
        <div class="cp-card-actions">
          <button class="cp-card-btn load" onclick="PAT.Clients.loadClient('${p.id}');event.stopPropagation()">▶ Cargar</button>
          <button class="cp-card-btn" onclick="PAT.Clients.openForm('${p.id}');event.stopPropagation()">✏ Editar</button>
          <button class="cp-card-btn" onclick="PAT.Clients.deleteClient('${p.id}');event.stopPropagation()">🗑</button>
        </div>
      </div>`;
    }).join('');
  }

  // ── Formulario ──────────────────────────────────────────────────
  function openForm(id) {
    _editId = id || null;
    const p = id ? PAT.MeasurementProfiles.obtener(id) : null;
    document.getElementById('cf-title').textContent = p ? 'Editar cliente' : 'Nuevo cliente';
    document.getElementById('cf-name').value   = p?.nombre || '';
    document.getElementById('cf-gender').value = p?.genero || '';
    document.getElementById('cf-phone').value  = p?.telefono || '';
    document.getElementById('cf-email').value  = p?.email || '';
    document.getElementById('cf-notes').value  = p?.notas || '';
    document.querySelectorAll('[data-cf-measure]').forEach(inp => {
      const val = p?.medidas?.[inp.dataset.cfMeasure];
      inp.value = val != null ? val : '';
    });
    document.getElementById('client-form-overlay').classList.add('open');
    document.getElementById('cf-name').focus();
  }

  function closeForm() {
    document.getElementById('client-form-overlay').classList.remove('open');
    _editId = null;
  }

  async function saveClient() {
    const nombre = document.getElementById('cf-name').value.trim();
    if (!nombre) { document.getElementById('cf-name').focus(); return; }

    const btn = document.getElementById('cf-save-btn');
    btn.disabled = true; btn.textContent = 'Guardando…';

    const medidas = {};
    document.querySelectorAll('[data-cf-measure]').forEach(inp => {
      const v = parseFloat(inp.value);
      if (!isNaN(v) && v > 0) medidas[inp.dataset.cfMeasure] = v;
    });

    const opts = {
      id:       _editId || null,
      genero:   document.getElementById('cf-gender').value,
      notas:    document.getElementById('cf-notes').value.trim(),
      telefono: document.getElementById('cf-phone').value.trim(),
      email:    document.getElementById('cf-email').value.trim(),
    };

    try {
      const id = await PAT.MeasurementProfiles.guardar(nombre, medidas, opts);
      closeForm();
      renderList(document.getElementById('cp-search')?.value || '');
      _updateSidebarBtn(id, nombre);
      if (PAT.App) PAT.App.toast('👤 Cliente "' + nombre + '" guardado', 'success');
    } catch(e) {
      if (PAT.App) PAT.App.toast('Error al guardar: ' + e.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = '💾 Guardar cliente';
    }
  }

  // ── Cargar medidas del cliente ─────────────────────────────────
  function loadClient(id) {
    const p = PAT.MeasurementProfiles ? PAT.MeasurementProfiles.obtener(id) : null;
    if (!p) return;
    // Escribir en inputs de medidas del sidebar
    document.querySelectorAll('[data-measure]').forEach(inp => {
      const val = p.medidas?.[inp.dataset.measure];
      if (val != null) {
        inp.value = val;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    // Actualizar select de perfiles
    const sel = document.getElementById('mp-select');
    if (sel) sel.value = id;
    // Actualizar botón del sidebar
    _updateSidebarBtn(id, p.nombre);
    if (PAT.App) PAT.App.toast('👤 ' + p.nombre + ' — medidas cargadas', 'success');
    close();
  }

  async function deleteClient(id) {
    const p = PAT.MeasurementProfiles ? PAT.MeasurementProfiles.obtener(id) : null;
    if (!p) return;
    if (!confirm('¿Eliminar al cliente "' + p.nombre + '"? Esta acción no se puede deshacer.')) return;
    await PAT.MeasurementProfiles.eliminar(id);
    renderList(document.getElementById('cp-search')?.value || '');
    if (PAT.App) PAT.App.toast('🗑 Cliente eliminado', 'success');
  }

  // ── Sidebar button ─────────────────────────────────────────────
  function _currentClientId() {
    const sel = document.getElementById('mp-select');
    return sel?.value || null;
  }

  function _updateSidebarBtn(id, nombre) {
    const span = document.getElementById('clients-active-name');
    if (span) {
      span.textContent = nombre;
      span.className = 'client-active-name';
    }
  }

  // ── Open / Close panel ─────────────────────────────────────────
  function open() {
    renderList('');
    document.getElementById('clients-overlay').classList.add('open');
    document.getElementById('cp-search').value = '';
    document.getElementById('cp-search').focus();
  }

  function close() {
    document.getElementById('clients-overlay').classList.remove('open');
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    if (!PAT.MeasurementProfiles) { setTimeout(init, 300); return; }
    _inject();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { open, close, openForm, closeForm, loadClient, deleteClient, renderList };

})();
