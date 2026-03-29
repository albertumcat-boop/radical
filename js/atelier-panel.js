/**
 * atelier-panel.js
 * Panel de Atelier — gestión de perfiles de clientes.
 * Disponible solo en tier Expert.
 *
 * Almacenamiento: localStorage con estructura JSON indexada.
 * En producción: sincronizar con Firestore (colección users/{uid}/clients).
 */

'use strict';
window.PAT = window.PAT || {};

PAT.AtelierPanel = (function () {

  const STORAGE_KEY = 'pat_atelier_clients';
  let _clients = [];
  let _panelEl = null;

  // ─────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────
  function init() {
    _clients = _loadClients();
  }

  // ─────────────────────────────────────────────────────────────────
  // ABRIR PANEL
  // ─────────────────────────────────────────────────────────────────
  function openPanel() {
    if (!PAT.AuthTier.hasAtelierPanel()) {
      PAT.PaymentUI.showUpgradeModal();
      return;
    }

    if (_panelEl) { _panelEl.style.display = 'flex'; _refreshPanel(); return; }

    _panelEl = document.createElement('div');
    _panelEl.id = 'atelier-panel';
    _panelEl.style.cssText = `
      position:fixed; inset:0; z-index:1100;
      display:flex; align-items:center; justify-content:center;
    `;

    _panelEl.innerHTML = `
      <div class="modal-backdrop" id="atelier-backdrop"></div>
      <div class="atelier-panel-content">

        <!-- Header -->
        <div class="atelier-panel-header">
          <div>
            <h2>👑 Panel de Atelier</h2>
            <p class="atelier-subtitle">Gestión de perfiles de medidas de clientes</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="action-btn primary" id="atelier-new-client" style="padding:7px 14px;font-size:12px">
              + Nuevo cliente
            </button>
            <button class="icon-btn" id="atelier-close">✕</button>
          </div>
        </div>

        <!-- Buscador -->
        <div class="atelier-search-row">
          <input type="text" id="atelier-search"
                 placeholder="🔍 Buscar cliente por nombre…"
                 style="flex:1;background:var(--bg-input);border:1px solid var(--border);
                        color:var(--text-primary);border-radius:var(--radius);
                        padding:8px 12px;font-size:12px;outline:none" />
          <div id="atelier-client-count" style="color:var(--text-dim);font-size:11px;white-space:nowrap"></div>
        </div>

        <!-- Lista de clientes -->
        <div id="atelier-clients-list" class="atelier-clients-list"></div>

        <!-- Stats -->
        <div class="atelier-stats" id="atelier-stats"></div>

      </div>

      <!-- Modal de cliente -->
      <div id="atelier-client-modal" style="display:none;position:fixed;inset:0;z-index:1200;
           display:none;align-items:center;justify-content:center">
        <div class="modal-backdrop" id="client-modal-backdrop"></div>
        <div class="modal-content" style="width:480px;max-height:90vh;overflow-y:auto">
          <h3 id="client-modal-title">Nuevo Cliente</h3>
          <div id="client-form"></div>
          <div class="modal-actions" style="margin-top:16px">
            <button class="action-btn primary" id="client-save-btn">💾 Guardar</button>
            <button class="action-btn ghost" id="client-cancel-btn">Cancelar</button>
            <button class="action-btn ghost" id="client-load-btn"
                    style="display:none;color:var(--accent);border-color:var(--accent)">
              ↩ Cargar medidas
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(_panelEl);

    // Eventos
    _panelEl.querySelector('#atelier-close').addEventListener('click', () => {
      _panelEl.style.display = 'none';
    });
    _panelEl.querySelector('#atelier-backdrop').addEventListener('click', () => {
      _panelEl.style.display = 'none';
    });
    _panelEl.querySelector('#atelier-new-client').addEventListener('click', () => {
      openClientModal(null);
    });
    _panelEl.querySelector('#atelier-search').addEventListener('input', (e) => {
      _renderClientsList(e.target.value);
    });

    _refreshPanel();
  }

  // ─────────────────────────────────────────────────────────────────
  // REFRESCAR PANEL
  // ─────────────────────────────────────────────────────────────────
  function _refreshPanel() {
    _renderClientsList('');
    _renderStats();
  }

  function _renderClientsList(searchTerm) {
    const list = document.getElementById('atelier-clients-list');
    const countEl = document.getElementById('atelier-client-count');
    if (!list) return;

    const filtered = _clients.filter(c =>
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (countEl) countEl.textContent = `${filtered.length} de ${_clients.length} clientes`;

    if (filtered.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-dim)">
          ${_clients.length === 0
            ? '👥 Aún no tienes clientes registrados.<br><small>Crea tu primer cliente con el botón de arriba.</small>'
            : '🔍 No se encontraron resultados.'}
        </div>`;
      return;
    }

    list.innerHTML = '';
    filtered.forEach(client => {
      const card = document.createElement('div');
      card.className = 'atelier-client-card';
      const updated = new Date(client.updatedAt).toLocaleDateString('es');

      card.innerHTML = `
        <div class="client-avatar">${client.name.charAt(0).toUpperCase()}</div>
        <div class="client-info">
          <div class="client-name">${client.name}</div>
          <div class="client-meta">
            Busto: <strong>${client.measures?.bust || '—'}cm</strong> ·
            Cintura: <strong>${client.measures?.waist || '—'}cm</strong> ·
            Cadera: <strong>${client.measures?.hip || '—'}cm</strong>
          </div>
          ${client.notes ? `<div class="client-notes">📝 ${client.notes}</div>` : ''}
          <div class="client-updated">Actualizado: ${updated}</div>
        </div>
        <div class="client-actions">
          <button class="icon-btn client-load-btn" data-id="${client.id}" title="Cargar medidas">↩</button>
          <button class="icon-btn client-edit-btn" data-id="${client.id}" title="Editar">✏️</button>
          <button class="icon-btn client-delete-btn" data-id="${client.id}"
                  title="Eliminar" style="color:var(--red)">🗑</button>
        </div>
      `;

      card.querySelector('.client-load-btn').addEventListener('click', () => {
        loadClientMeasures(client.id);
      });
      card.querySelector('.client-edit-btn').addEventListener('click', () => {
        openClientModal(client.id);
      });
      card.querySelector('.client-delete-btn').addEventListener('click', () => {
        deleteClient(client.id, client.name);
      });

      list.appendChild(card);
    });
  }

  function _renderStats() {
    const el = document.getElementById('atelier-stats');
    if (!el) return;
    const avg = field => {
      const vals = _clients.map(c => c.measures?.[field]).filter(Boolean);
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
    };
    el.innerHTML = `
      <div class="stat-item"><div class="stat-value">${_clients.length}</div><div class="stat-label">Clientes</div></div>
      <div class="stat-item"><div class="stat-value">${avg('bust')}cm</div><div class="stat-label">Busto prom.</div></div>
      <div class="stat-item"><div class="stat-value">${avg('waist')}cm</div><div class="stat-label">Cintura prom.</div></div>
      <div class="stat-item"><div class="stat-value">${avg('hip')}cm</div><div class="stat-label">Cadera prom.</div></div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // MODAL DE CLIENTE (crear/editar)
  // ─────────────────────────────────────────────────────────────────
  function openClientModal(clientId) {
    const modal = document.getElementById('atelier-client-modal');
    if (!modal) return;

    const client = clientId ? _clients.find(c => c.id === clientId) : null;
    const isEdit = !!client;

    document.getElementById('client-modal-title').textContent =
      isEdit ? `✏️ Editar: ${client.name}` : '👤 Nuevo Cliente';

    const measureFields = [
      { key: 'bust',        label: 'Busto/Pecho',   unit: 'cm' },
      { key: 'waist',       label: 'Cintura',        unit: 'cm' },
      { key: 'hip',         label: 'Cadera',         unit: 'cm' },
      { key: 'shoulder',    label: 'Hombros',        unit: 'cm' },
      { key: 'neck',        label: 'Cuello',         unit: 'cm' },
      { key: 'backLength',  label: 'Largo espalda',  unit: 'cm' },
      { key: 'frontLength', label: 'Largo frente',   unit: 'cm' },
      { key: 'totalLength', label: 'Largo total',    unit: 'cm' },
      { key: 'sleeveLength',label: 'Largo manga',    unit: 'cm' },
      { key: 'wrist',       label: 'Muñeca',         unit: 'cm' },
      { key: 'skirtLength', label: 'Largo falda',    unit: 'cm' },
      { key: 'hipDepth',    label: 'Prof. cadera',   unit: 'cm' },
    ];

    const form = document.getElementById('client-form');
    form.innerHTML = `
      <div class="input-row" style="margin-bottom:10px">
        <label style="color:var(--text-secondary)">Nombre completo *</label>
        <input type="text" id="cf-name" value="${client?.name || ''}"
               style="width:180px;background:var(--bg-input);border:1px solid var(--border);
                      color:var(--text-primary);border-radius:var(--radius);padding:5px 8px;font-size:12px;outline:none"
               placeholder="Nombre del cliente" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
        ${measureFields.map(f => `
          <div class="input-row" style="margin-bottom:0">
            <label style="color:var(--text-secondary);font-size:11px">${f.label}</label>
            <input type="number" id="cf-${f.key}"
                   value="${client?.measures?.[f.key] || PAT.DEFAULT_MEASURES[f.key] || ''}"
                   style="width:64px;background:var(--bg-input);border:1px solid var(--border);
                          color:var(--text-primary);border-radius:var(--radius);padding:4px 6px;
                          font-size:11px;font-family:monospace;text-align:right;outline:none"
                   min="0" max="300" step="0.5" />
          </div>
        `).join('')}
      </div>
      <div class="input-row" style="flex-direction:column;align-items:flex-start;gap:4px">
        <label style="color:var(--text-secondary);font-size:11px">Notas del cliente</label>
        <textarea id="cf-notes" rows="2"
                  style="width:100%;background:var(--bg-input);border:1px solid var(--border);
                         color:var(--text-primary);border-radius:var(--radius);padding:6px 8px;
                         font-size:11px;resize:vertical;outline:none"
                  placeholder="Alergias a telas, preferencias de ajuste, etc.">${client?.notes || ''}</textarea>
      </div>
    `;

    modal.style.display = 'flex';

    // Guardar
    const saveBtn = document.getElementById('client-save-btn');
    const loadBtn = document.getElementById('client-load-btn');

    // Limpiar listeners anteriores
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    const newLoadBtn = loadBtn.cloneNode(true);
    loadBtn.parentNode.replaceChild(newLoadBtn, loadBtn);

    newSaveBtn.addEventListener('click', () => {
      const name = document.getElementById('cf-name').value.trim();
      if (!name) { PAT.App.toast('El nombre es obligatorio', 'error'); return; }

      const measures = {};
      measureFields.forEach(f => {
        const val = parseFloat(document.getElementById(`cf-${f.key}`)?.value);
        if (!isNaN(val)) measures[f.key] = val;
      });

      if (isEdit) {
        updateClient(clientId, name, measures, document.getElementById('cf-notes').value);
      } else {
        createClient(name, measures, document.getElementById('cf-notes').value);
      }
      modal.style.display = 'none';
    });

    if (isEdit) {
      newLoadBtn.style.display = '';
      newLoadBtn.addEventListener('click', () => {
        loadClientMeasures(clientId);
        modal.style.display = 'none';
        _panelEl.style.display = 'none';
      });
    } else {
      newLoadBtn.style.display = 'none';
    }

    document.getElementById('client-cancel-btn').onclick = () => {
      modal.style.display = 'none';
    };
    document.getElementById('client-modal-backdrop').onclick = () => {
      modal.style.display = 'none';
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // CRUD DE CLIENTES
  // ─────────────────────────────────────────────────────────────────
  function createClient(name, measures, notes) {
    const client = {
      id:        'cli_' + Date.now(),
      name,
      measures,
      notes:     notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    _clients.unshift(client);
    _saveClients();
    _refreshPanel();
    PAT.App.toast(`✅ Cliente "${name}" creado`, 'success');
  }

  function updateClient(clientId, name, measures, notes) {
    const idx = _clients.findIndex(c => c.id === clientId);
    if (idx === -1) return;
    _clients[idx] = { ..._clients[idx], name, measures, notes, updatedAt: new Date().toISOString() };
    _saveClients();
    _refreshPanel();
    PAT.App.toast(`✅ "${name}" actualizado`, 'success');
  }

  function deleteClient(clientId, name) {
    if (!confirm(`¿Eliminar al cliente "${name}"?\nEsta acción no se puede deshacer.`)) return;
    _clients = _clients.filter(c => c.id !== clientId);
    _saveClients();
    _refreshPanel();
    PAT.App.toast(`"${name}" eliminado`, 'info');
  }

  function loadClientMeasures(clientId) {
    const client = _clients.find(c => c.id === clientId);
    if (!client || !client.measures) return;

    // Disparar evento para que app.js actualice los inputs y regenere
    document.dispatchEvent(new CustomEvent('pat:loadClientMeasures', {
      detail: { measures: client.measures, clientName: client.name }
    }));

    if (_panelEl) _panelEl.style.display = 'none';
    PAT.App.toast(`↩ Medidas de "${client.name}" cargadas`, 'success');
  }

  // ─────────────────────────────────────────────────────────────────
  // PERSISTENCIA
  // ─────────────────────────────────────────────────────────────────
  function _loadClients() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function _saveClients() {
    // HOOK DE PRODUCCIÓN: sincronizar con Firestore
    // db.collection(`users/${PAT.AuthTier.getUserId()}/clients`).set(...)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_clients)); }
    catch (e) { console.error('[AtelierPanel] Error al guardar:', e); }
  }

  function getClients() { return [..._clients]; }

  return { init, openPanel, getClients, loadClientMeasures };
})();
