'use strict';
/**
 * bloques-ui.js — Modal de Biblioteca de Bloques Base
 *
 * UI para que cada atelier/usuario gestione sus bloques base:
 * - Ver todos sus bloques
 * - Guardar el trazado actual como bloque
 * - Cargar un bloque al Trazador (con recálculo de fórmulas)
 * - Duplicar, exportar, importar, eliminar
 */

window.PAT = window.PAT || {};

PAT.BloquesUI = (function () {

  let _modal = null;
  let _lista = [];
  let _filtroCategoria = 'todos';

  const CATEGORIAS = [
    { id: 'todos',    label: 'Todos',     icon: '📋' },
    { id: 'espalda',  label: 'Espalda',   icon: '🔙' },
    { id: 'frente',   label: 'Frente',    icon: '👕' },
    { id: 'manga',    label: 'Manga',     icon: '👔' },
    { id: 'falda',    label: 'Falda',     icon: '👗' },
    { id: 'pantalon', label: 'Pantalón',  icon: '👖' },
    { id: 'cuerpo',   label: 'Cuerpo',    icon: '🧵' },
    { id: 'otro',     label: 'Otro',      icon: '📐' },
  ];

  // ── Abrir modal ───────────────────────────────────────────────────
  function open() {
    if (!_modal) _build();
    _modal.classList.add('open');
    _cargarLista();
  }

  function close() {
    if (_modal) _modal.classList.remove('open');
  }

  // ── Construir HTML del modal ──────────────────────────────────────
  function _build() {
    _modal = document.createElement('div');
    _modal.id = 'bq-modal';
    _modal.innerHTML = `
<style>
#bq-modal{position:fixed;inset:0;z-index:900;display:none;align-items:center;justify-content:center}
#bq-modal.open{display:flex}
#bq-ov{position:absolute;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px)}
#bq-box{position:relative;z-index:1;background:#0e0e1a;border:1px solid #3d3d58;border-radius:16px;
  width:min(860px,96vw);max-height:90vh;display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 24px 80px rgba(0,0,0,.7)}
.bq-hdr{display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid #2e2e45}
.bq-title{font-size:15px;font-weight:800;color:#ede9fe;flex:1}
.bq-subtitle{font-size:11px;color:#5a5678}
#bq-x{background:none;border:none;color:#5a5678;font-size:18px;cursor:pointer;padding:4px 8px}
#bq-x:hover{color:#ede9fe}
.bq-body{display:flex;flex:1;overflow:hidden;min-height:0}

/* Sidebar categorías */
.bq-cats{width:130px;flex-shrink:0;border-right:1px solid #2e2e45;overflow-y:auto;padding:8px 0}
.bq-cat{display:flex;align-items:center;gap:8px;padding:8px 14px;font-size:11px;color:#9490b0;
  cursor:pointer;border-left:2px solid transparent;transition:all .15s}
.bq-cat:hover{background:rgba(139,92,246,.08);color:#ede9fe}
.bq-cat.on{border-left-color:#8b5cf6;background:rgba(139,92,246,.12);color:#a78bfa;font-weight:700}

/* Lista de bloques */
.bq-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.bq-toolbar{display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid #2e2e45}
.bq-search{flex:1;background:#141420;border:1px solid #2e2e45;border-radius:8px;
  color:#ede9fe;font-size:12px;padding:6px 12px;outline:none}
.bq-search:focus{border-color:#8b5cf6}
.bq-btn{padding:6px 14px;border-radius:8px;border:1px solid;font-size:11px;cursor:pointer;
  display:flex;align-items:center;gap:5px;font-weight:600;transition:all .15s}
.bq-btn.pri{background:#8b5cf6;border-color:#8b5cf6;color:#fff}
.bq-btn.pri:hover{background:#7c3aed}
.bq-btn.sec{background:transparent;border-color:#3d3d58;color:#9490b0}
.bq-btn.sec:hover{border-color:#8b5cf6;color:#a78bfa}
.bq-btn.grn{background:transparent;border-color:rgba(52,211,153,.4);color:#34d399}
.bq-btn.grn:hover{background:rgba(52,211,153,.1)}
.bq-list{flex:1;overflow-y:auto;padding:10px 16px;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;align-content:start}
.bq-empty{padding:40px;text-align:center;color:#3d3d58;font-size:13px;grid-column:1/-1}

/* Tarjeta de bloque */
.bq-card{background:#141420;border:1px solid #2e2e45;border-radius:12px;
  padding:14px;cursor:pointer;transition:all .2s;position:relative}
.bq-card:hover{border-color:#8b5cf6;background:#1a1730}
.bq-card-top{display:flex;align-items:flex-start;gap:8px;margin-bottom:8px}
.bq-card-icon{width:36px;height:36px;border-radius:8px;background:rgba(139,92,246,.15);
  display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.bq-card-info{flex:1;min-width:0}
.bq-card-name{font-size:13px;font-weight:700;color:#ede9fe;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis}
.bq-card-cat{font-size:10px;color:#5a5678;margin-top:2px}
.bq-card-sistema{font-size:10px;color:#8b5cf6;font-weight:600}
.bq-card-meta{display:flex;gap:8px;font-size:10px;color:#3d3d58;margin-top:6px}
.bq-card-meta span{display:flex;align-items:center;gap:3px}
.bq-card-desc{font-size:10px;color:#5a5678;margin-top:6px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bq-card-actions{display:flex;gap:4px;margin-top:10px;border-top:1px solid #2e2e45;padding-top:8px}
.bq-ca{padding:4px 8px;border-radius:6px;border:1px solid #2e2e45;background:none;
  color:#9490b0;font-size:10px;cursor:pointer;transition:all .15s;flex:1;text-align:center}
.bq-ca:hover{border-color:#8b5cf6;color:#a78bfa}
.bq-ca.load{border-color:rgba(52,211,153,.4);color:#34d399}
.bq-ca.load:hover{background:rgba(52,211,153,.1)}
.bq-ca.del{border-color:rgba(239,68,68,.3);color:#f87171}
.bq-ca.del:hover{background:rgba(239,68,68,.1)}

/* Formulario guardar */
#bq-save-form{border-top:1px solid #2e2e45;padding:14px 16px;background:#0b0b16}
.bq-form-title{font-size:11px;font-weight:700;color:#a78bfa;margin-bottom:10px}
.bq-form-row{display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.bq-fi{background:#141420;border:1px solid #2e2e45;border-radius:8px;
  color:#ede9fe;font-size:12px;padding:6px 10px;outline:none;min-width:0}
.bq-fi:focus{border-color:#8b5cf6}
.bq-fi.nm{flex:2;min-width:140px}
.bq-fi.cat{flex:1;min-width:100px}
.bq-fi.sis{flex:1;min-width:100px}
.bq-fi.desc{width:100%;resize:none;height:44px}

/* Import area */
#bq-import-zone{border:2px dashed #2e2e45;border-radius:10px;padding:12px;text-align:center;
  font-size:11px;color:#5a5678;cursor:pointer;transition:all .2s}
#bq-import-zone:hover{border-color:#8b5cf6;color:#a78bfa}
#bq-import-file{display:none}
</style>

<div id="bq-ov"></div>
<div id="bq-box">
  <div class="bq-hdr">
    <div>
      <div class="bq-title">📚 Mis Bloques Base</div>
      <div class="bq-subtitle">Guarda tu forma de patronar — tus fórmulas, tus proporciones, tu sistema</div>
    </div>
    <button id="bq-x">✕</button>
  </div>

  <div class="bq-body">
    <!-- Categorías -->
    <div class="bq-cats" id="bq-cats"></div>

    <!-- Lista + toolbar + guardar -->
    <div class="bq-main">
      <div class="bq-toolbar">
        <input class="bq-search" id="bq-search" placeholder="🔍 Buscar bloque…">
        <button class="bq-btn grn" id="bq-guardar-actual">💾 Guardar trazado actual</button>
        <label class="bq-btn sec" style="cursor:pointer" title="Importar .patronai.json">
          ⬆ Importar
          <input type="file" id="bq-import-file" accept=".json,.patronai.json">
        </label>
      </div>

      <div class="bq-list" id="bq-list">
        <div class="bq-empty">Cargando bloques…</div>
      </div>

      <!-- Formulario guardar (expandible) -->
      <div id="bq-save-form" style="display:none">
        <div class="bq-form-title">💾 Guardar trazado actual como Bloque Base</div>
        <div class="bq-form-row">
          <input class="bq-fi nm" id="bq-fn" placeholder="Nombre del bloque (ej: Mi Espalda Base)">
          <select class="bq-fi cat" id="bq-fc">
            <option value="espalda">Espalda</option>
            <option value="frente">Frente</option>
            <option value="manga">Manga</option>
            <option value="falda">Falda</option>
            <option value="pantalon">Pantalón</option>
            <option value="cuerpo">Cuerpo completo</option>
            <option value="otro">Otro</option>
          </select>
          <input class="bq-fi sis" id="bq-fs" placeholder="Sistema (Aldrich, Propio…)">
        </div>
        <div class="bq-form-row">
          <textarea class="bq-fi desc" id="bq-fd" placeholder="Notas, ajustes especiales, para qué tipo de cuerpo…"></textarea>
        </div>
        <div style="display:flex;gap:8px">
          <button class="bq-btn pri" id="bq-confirm-save" style="flex:1">✓ Confirmar guardar</button>
          <button class="bq-btn sec" id="bq-cancel-save">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</div>
    `;
    document.body.appendChild(_modal);
    _bindEvents();
    _renderCategorias();
  }

  // ── Eventos ───────────────────────────────────────────────────────
  function _bindEvents() {
    document.getElementById('bq-ov').onclick = close;
    document.getElementById('bq-x').onclick  = close;

    // Búsqueda
    document.getElementById('bq-search').oninput = e => {
      _renderLista(_lista, e.target.value.trim().toLowerCase());
    };

    // Guardar actual
    document.getElementById('bq-guardar-actual').onclick = () => {
      const form = document.getElementById('bq-save-form');
      form.style.display = form.style.display === 'none' ? '' : 'none';
      if (form.style.display !== 'none') {
        document.getElementById('bq-fn').focus();
      }
    };

    document.getElementById('bq-confirm-save').onclick = _confirmarGuardar;
    document.getElementById('bq-cancel-save').onclick  = () => {
      document.getElementById('bq-save-form').style.display = 'none';
    };

    // Importar JSON
    document.getElementById('bq-import-file').onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const id = await PAT.Bloques.importarJSON(file);
        PAT.App.toast('✅ Bloque importado', 'success');
        await _cargarLista();
      } catch(err) {
        PAT.App.toast('⚠ ' + err.message, 'error');
      }
      e.target.value = '';
    };
  }

  // ── Categorías sidebar ────────────────────────────────────────────
  function _renderCategorias() {
    const el = document.getElementById('bq-cats');
    el.innerHTML = '';
    CATEGORIAS.forEach(cat => {
      const div = document.createElement('div');
      div.className = 'bq-cat' + (cat.id === _filtroCategoria ? ' on' : '');
      div.innerHTML = `<span>${cat.icon}</span><span>${cat.label}</span>`;
      div.onclick = () => {
        _filtroCategoria = cat.id;
        _renderCategorias();
        _renderLista(_lista);
      };
      el.appendChild(div);
    });
  }

  // ── Cargar lista desde Firestore ──────────────────────────────────
  async function _cargarLista() {
    const listEl = document.getElementById('bq-list');
    listEl.innerHTML = '<div class="bq-empty">Cargando…</div>';
    try {
      _lista = await PAT.Bloques.listar();
      _renderLista(_lista);
    } catch(err) {
      const bqErr = document.createElement('div');
      bqErr.className = 'bq-empty';
      bqErr.innerHTML = '⚠ <span></span><br><small>Inicia sesión para ver tus bloques</small>';
      bqErr.querySelector('span').textContent = err.message;
      listEl.innerHTML = '';
      listEl.appendChild(bqErr);
    }
  }

  // ── Renderizar lista de tarjetas ──────────────────────────────────
  function _renderLista(lista, busqueda = '') {
    const listEl = document.getElementById('bq-list');
    listEl.innerHTML = '';

    let filtrados = lista;
    if (_filtroCategoria !== 'todos') {
      filtrados = filtrados.filter(b => b.categoria === _filtroCategoria);
    }
    if (busqueda) {
      filtrados = filtrados.filter(b =>
        (b.name||'').toLowerCase().includes(busqueda) ||
        (b.descripcion||'').toLowerCase().includes(busqueda) ||
        (b.sistema||'').toLowerCase().includes(busqueda)
      );
    }

    if (!filtrados.length) {
      listEl.innerHTML = `<div class="bq-empty">
        ${lista.length === 0
          ? '📭 Aún no tienes bloques guardados.<br><small>Traza un patrón en el Trazador y presiona "Guardar trazado actual".</small>'
          : '🔍 Sin resultados para ese filtro.'}
      </div>`;
      return;
    }

    filtrados.forEach(bloque => {
      const cat = CATEGORIAS.find(c => c.id === bloque.categoria) || CATEGORIAS[CATEGORIAS.length-1];
      const ptCount = Object.keys(bloque.points || {}).length;
      const lnCount = (bloque.lines || []).length;
      const fxPts   = Object.values(bloque.points || {}).filter(p => p.fx || p.fy).length;
      const fecha   = bloque.updatedAt ? bloque.updatedAt.slice(0,10) : '—';

      const card = document.createElement('div');
      card.className = 'bq-card';
      card.innerHTML = `
        <div class="bq-card-top">
          <div class="bq-card-icon">${cat.icon}</div>
          <div class="bq-card-info">
            <div class="bq-card-name">${bloque.name}</div>
            <div class="bq-card-cat">${cat.label}</div>
            <div class="bq-card-sistema">${bloque.sistema || 'Sistema propio'}</div>
          </div>
        </div>
        ${bloque.descripcion ? `<div class="bq-card-desc">${bloque.descripcion}</div>` : ''}
        <div class="bq-card-meta">
          <span>● ${ptCount} puntos</span>
          <span>╱ ${lnCount} líneas</span>
          ${fxPts ? `<span style="color:#8b5cf6">⟨f⟩ ${fxPts} fórmulas</span>` : ''}
          <span>v${bloque.version||1} · ${fecha}</span>
        </div>
        <div class="bq-card-actions">
          <button class="bq-ca load" data-id="${bloque.id}" data-action="cargar">▶ Cargar</button>
          <button class="bq-ca" data-id="${bloque.id}" data-action="duplicar">⿻ Duplicar</button>
          <button class="bq-ca" data-id="${bloque.id}" data-action="exportar">⬇ JSON</button>
          <button class="bq-ca del" data-id="${bloque.id}" data-action="eliminar">✕</button>
        </div>
      `;

      // Eventos de tarjeta
      card.querySelectorAll('[data-action]').forEach(btn => {
        btn.onclick = e => {
          e.stopPropagation();
          _accionBloque(btn.dataset.action, btn.dataset.id, bloque);
        };
      });

      listEl.appendChild(card);
    });
  }

  // ── Acciones sobre un bloque ──────────────────────────────────────
  async function _accionBloque(accion, id, bloque) {
    switch(accion) {

      case 'cargar': {
        // Preguntar si recalcular con medidas actuales
        const tieneFx = Object.values(bloque.points||{}).some(p=>p.fx||p.fy);
        let pointsUsados = bloque.points;

        if (tieneFx) {
          const recalc = confirm(
            `Este bloque tiene ${Object.values(bloque.points).filter(p=>p.fx||p.fy).length} punto(s) con fórmulas.\n\n` +
            `¿Recalcular con las medidas actuales del panel principal?\n\n` +
            `OK = Sí, recalcular (adapta al cuerpo actual)\n` +
            `Cancelar = No, usar coordenadas exactas como se guardaron`
          );
          if (recalc) {
            const medidasActuales = _getMedidasPanel();
            pointsUsados = PAT.Bloques.recalcularConMedidas(bloque, medidasActuales);
          }
        }

        // Cargar en el Trazador
        if (PAT.DrafterUI && PAT.DrafterUI.cargarBloque) {
          PAT.DrafterUI.cargarBloque({
            points:    pointsUsados,
            lines:     bloque.lines,
            ptCtr:     bloque.ptCtr,
            name:      bloque.name,
            bloqueId:  id,
          });
          close();
          PAT.App.toast(`✅ "${bloque.name}" cargado en el Trazador`, 'success');
        } else {
          PAT.App.toast('⚠ Abre el Trazador primero', 'error');
        }
        break;
      }

      case 'duplicar': {
        const nombre = prompt('Nombre para la copia:', bloque.name + ' (variante)');
        if (!nombre) break;
        try {
          await PAT.Bloques.duplicar(id, nombre);
          PAT.App.toast('✅ Bloque duplicado', 'success');
          await _cargarLista();
        } catch(err) { PAT.App.toast('⚠ ' + err.message, 'error'); }
        break;
      }

      case 'exportar': {
        PAT.Bloques.exportarJSON(bloque);
        PAT.App.toast('📥 Descargando bloque…', 'success');
        break;
      }

      case 'eliminar': {
        if (!confirm(`¿Eliminar "${bloque.name}"? Esta acción no se puede deshacer.`)) break;
        try {
          await PAT.Bloques.eliminar(id);
          PAT.App.toast('🗑 Bloque eliminado', 'success');
          await _cargarLista();
        } catch(err) { PAT.App.toast('⚠ ' + err.message, 'error'); }
        break;
      }
    }
  }

  // ── Confirmar guardar ─────────────────────────────────────────────
  async function _confirmarGuardar() {
    if (!PAT.DrafterUI || !PAT.DrafterUI.getState) {
      PAT.App.toast('⚠ Abre el Trazador primero y traza algo', 'error');
      return;
    }

    const estado = PAT.DrafterUI.getState();
    if (!Object.keys(estado.points || {}).length) {
      PAT.App.toast('⚠ El Trazador está vacío', 'error');
      return;
    }

    const nombre = document.getElementById('bq-fn').value.trim();
    if (!nombre) {
      document.getElementById('bq-fn').focus();
      PAT.App.toast('⚠ Escribe un nombre para el bloque', 'error');
      return;
    }

    const btn = document.getElementById('bq-confirm-save');
    btn.textContent = 'Guardando…'; btn.disabled = true;

    try {
      const id = await PAT.Bloques.guardar({
        id:          estado.bloqueId,   // si ya tiene id, actualiza
        name:        nombre,
        categoria:   document.getElementById('bq-fc').value,
        sistema:     document.getElementById('bq-fs').value.trim() || 'Propio',
        descripcion: document.getElementById('bq-fd').value.trim(),
        points:      estado.points,
        lines:       estado.lines,
        ptCtr:       estado.ptCtr,
        medidasBase: _getMedidasPanel(),
      });

      // Notificar al Trazador del nuevo id
      if (PAT.DrafterUI.setBloqueId) PAT.DrafterUI.setBloqueId(id);

      PAT.App.toast(`✅ "${nombre}" guardado en tu biblioteca`, 'success');
      document.getElementById('bq-save-form').style.display = 'none';
      document.getElementById('bq-fn').value = '';
      document.getElementById('bq-fd').value = '';
      await _cargarLista();
    } catch(err) {
      PAT.App.toast('⚠ ' + err.message, 'error');
    } finally {
      btn.textContent = '✓ Confirmar guardar'; btn.disabled = false;
    }
  }

  // ── Leer medidas del panel principal ─────────────────────────────
  function _getMedidasPanel() {
    const m = {};
    document.querySelectorAll('[data-measure]').forEach(el => {
      m[el.dataset.measure] = parseFloat(el.value) || 0;
    });
    return m;
  }

  // ── API pública ───────────────────────────────────────────────────
  return { open, close };

})();
