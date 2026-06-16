'use strict';
/**
 * mis-sistemas-ui.js
 * Modal "Mis Sistemas de Patronaje" — gestión de sistemas propios por atelier.
 * Permite crear, editar, importar (JSON), exportar y eliminar sistemas.
 * Los sistemas guardados se registran automáticamente en PAT.Sistemas
 * para aparecer en el modal 🧵 "Cargar desde Sistema".
 */

window.PAT = window.PAT || {};
PAT.MisSistemasUI = (function () {

  let _modal  = null;
  let _lista  = [];          // sistemas cargados
  let _editId = null;        // sistema en edición (null = nuevo)
  let _editPiezaIdx = null;  // índice pieza en edición

  const CATEGORIAS = ['espalda','frente','manga','falda','pantalon','cuerpo','otro'];
  const TIPOS      = ['dama','caballero','ambos'];

  // ── Abrir / cerrar ───────────────────────────────────────────
  function open() {
    if (!_modal) _build();
    _modal.classList.add('open');
    _cargarLista();
  }

  function close() {
    if (_modal) _modal.classList.remove('open');
    _editId = null;
    _editPiezaIdx = null;
  }

  // ── Construcción del modal ───────────────────────────────────
  function _build() {
    _modal = document.createElement('div');
    _modal.id = 'ms-modal';
    _modal.innerHTML = `
<style>
#ms-modal{position:fixed;inset:0;z-index:960;display:none;align-items:center;justify-content:center}
#ms-modal.open{display:flex}
#ms-ov{position:absolute;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(5px)}
#ms-box{position:relative;z-index:1;background:#0e0e1a;border:1px solid #3d3d58;border-radius:18px;
  width:min(780px,96vw);max-height:92vh;display:flex;flex-direction:column;
  box-shadow:0 28px 90px rgba(0,0,0,.85)}
.ms-hdr{display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid #2e2e45;gap:12px}
.ms-title{font-size:14px;font-weight:800;color:#ede9fe;flex:1}
#ms-x{background:none;border:none;color:#5a5678;font-size:18px;cursor:pointer;padding:4px 8px}
#ms-x:hover{color:#ede9fe}
.ms-body{display:flex;flex:1;overflow:hidden}

/* ── Sidebar lista ── */
.ms-sidebar{width:220px;border-right:1px solid #1e1e30;display:flex;flex-direction:column;overflow:hidden}
.ms-sidebar-top{padding:12px;border-bottom:1px solid #1e1e30;display:flex;gap:8px}
.ms-new-btn{flex:1;padding:8px;border-radius:8px;border:none;background:#8b5cf6;color:#fff;
  font-size:11px;font-weight:700;cursor:pointer}
.ms-new-btn:hover{background:#7c3aed}
.ms-import-btn{padding:8px 10px;border-radius:8px;border:1px solid #3d3d58;background:none;
  color:#9490b0;font-size:11px;cursor:pointer}
.ms-import-btn:hover{border-color:#8b5cf6;color:#ede9fe}
#ms-lista{flex:1;overflow-y:auto;padding:8px}
.ms-item{padding:10px 12px;border-radius:10px;cursor:pointer;border:1px solid transparent;margin-bottom:6px;transition:.15s}
.ms-item:hover{background:#141420}
.ms-item.sel{background:#1a1730;border-color:#8b5cf6}
.ms-item-name{font-size:12px;font-weight:700;color:#ede9fe}
.ms-item-sub{font-size:10px;color:#5a5678;margin-top:3px}
.ms-empty{font-size:11px;color:#5a5678;padding:16px 12px;text-align:center;line-height:1.6}

/* ── Panel edición ── */
.ms-panel{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px}
.ms-welcome{display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:100%;gap:12px;color:#5a5678;font-size:13px;text-align:center}
.ms-welcome-icon{font-size:40px}
.ms-sec{display:flex;flex-direction:column;gap:6px}
.ms-sec-title{font-size:10px;font-weight:800;color:#a78bfa;text-transform:uppercase;letter-spacing:.08em;
  padding-bottom:6px;border-bottom:1px solid #1e1e30}
.ms-row{display:flex;gap:10px;align-items:center}
.ms-lbl{font-size:11px;color:#9490b0;min-width:90px}
.ms-inp{background:#141420;border:1px solid #2e2e45;border-radius:8px;color:#ede9fe;
  font-size:12px;padding:7px 10px;width:100%;outline:none;font-family:inherit}
.ms-inp:focus{border-color:#8b5cf6}
.ms-ta{resize:vertical;min-height:60px}
.ms-sel{background:#141420;border:1px solid #2e2e45;border-radius:8px;color:#ede9fe;
  font-size:12px;padding:7px 10px;outline:none}
.ms-sel:focus{border-color:#8b5cf6}

/* Piezas */
.ms-piezas{display:flex;flex-direction:column;gap:6px}
.ms-pieza-item{background:#141420;border:1px solid #2e2e45;border-radius:10px;padding:10px 12px;
  display:flex;align-items:center;gap:10px;cursor:pointer}
.ms-pieza-item:hover{border-color:#8b5cf6}
.ms-pieza-name{font-size:12px;font-weight:700;color:#ede9fe;flex:1}
.ms-pieza-sub{font-size:10px;color:#5a5678}
.ms-pieza-del{background:none;border:none;color:#5a5678;cursor:pointer;font-size:14px;padding:2px 6px}
.ms-pieza-del:hover{color:#f87171}
.ms-add-pieza{width:100%;padding:8px;border-radius:8px;border:1px dashed #3d3d58;background:none;
  color:#9490b0;font-size:11px;cursor:pointer;margin-top:4px}
.ms-add-pieza:hover{border-color:#8b5cf6;color:#ede9fe}

/* Puntos y líneas en la pieza */
.ms-tbl{width:100%;border-collapse:collapse;font-size:11px;margin-top:4px}
.ms-tbl th{background:#1a1730;color:#a78bfa;padding:5px 8px;text-align:left;font-weight:600;
  border-bottom:1px solid #2e2e45}
.ms-tbl td{padding:4px 6px;border-bottom:1px solid #141420;color:#9490b0;vertical-align:middle}
.ms-tbl tr:last-child td{border-bottom:none}
.ms-pt-inp{background:#0b0b16;border:1px solid #2e2e45;border-radius:5px;color:#ede9fe;
  font-size:11px;padding:3px 6px;width:100%;font-family:var(--mono,monospace)}
.ms-pt-inp:focus{border-color:#8b5cf6;outline:none}
.ms-pt-del{background:none;border:none;color:#5a5678;cursor:pointer;padding:2px 4px}
.ms-pt-del:hover{color:#f87171}
.ms-add-row{width:100%;padding:5px;border-radius:6px;border:1px dashed #2e2e45;background:none;
  color:#5a5678;font-size:10px;cursor:pointer;margin-top:4px}
.ms-add-row:hover{border-color:#8b5cf6;color:#ede9fe}

/* Acciones footer */
.ms-footer{display:flex;gap:8px;padding:16px 20px;border-top:1px solid #1e1e30;flex-shrink:0}
.ms-save-btn{flex:1;padding:9px;border-radius:10px;border:none;background:#8b5cf6;color:#fff;
  font-size:12px;font-weight:700;cursor:pointer}
.ms-save-btn:hover{background:#7c3aed}
.ms-del-btn{padding:9px 14px;border-radius:10px;border:1px solid #3d3d58;background:none;
  color:#f87171;font-size:12px;cursor:pointer}
.ms-del-btn:hover{background:rgba(248,113,113,.1)}
.ms-export-btn{padding:9px 14px;border-radius:10px;border:1px solid #3d3d58;background:none;
  color:#9490b0;font-size:12px;cursor:pointer}
.ms-export-btn:hover{border-color:#8b5cf6;color:#ede9fe}

/* Pieza editor sub-panel */
#ms-pieza-editor{display:none;background:#0b0b16;border:1px solid #2e2e45;border-radius:12px;padding:14px;margin-top:6px}
#ms-pieza-editor.open{display:block}
.ms-pe-title{font-size:11px;font-weight:800;color:#a78bfa;margin-bottom:10px}
</style>

<div id="ms-ov"></div>
<div id="ms-box">
  <div class="ms-hdr">
    <div class="ms-title">📐 Mis Sistemas de Patronaje</div>
    <button id="ms-x">✕</button>
  </div>
  <div class="ms-body">
    <!-- Lista lateral -->
    <div class="ms-sidebar">
      <div class="ms-sidebar-top">
        <button class="ms-new-btn" onclick="PAT.MisSistemasUI._nuevo()">＋ Nuevo</button>
        <button class="ms-import-btn" title="Importar desde archivo JSON" onclick="PAT.MisSistemasUI._triggerImport()">📥</button>
        <input type="file" id="ms-import-file" accept=".json" style="display:none" onchange="PAT.MisSistemasUI._importarArchivo(this)">
      </div>
      <div id="ms-lista"></div>
    </div>
    <!-- Panel de edición -->
    <div class="ms-panel" id="ms-panel">
      <div class="ms-welcome">
        <div class="ms-welcome-icon">✂️</div>
        <strong style="color:#ede9fe">Tus sistemas de patronaje</strong>
        <span>Crea un sistema nuevo o importa uno desde un archivo JSON.<br>
          Cada sistema puede tener múltiples piezas con sus propios puntos y fórmulas.</span>
      </div>
    </div>
  </div>
  <div class="ms-footer" id="ms-footer" style="display:none">
    <button class="ms-export-btn" onclick="PAT.MisSistemasUI._exportar()">📤 Exportar JSON</button>
    <div style="flex:1"></div>
    <button class="ms-del-btn" id="ms-del-btn" onclick="PAT.MisSistemasUI._eliminar()">🗑 Eliminar</button>
    <button class="ms-save-btn" onclick="PAT.MisSistemasUI._guardar()">💾 Guardar sistema</button>
  </div>
</div>
    `;
    document.body.appendChild(_modal);
    document.getElementById('ms-ov').onclick = close;
    document.getElementById('ms-x').onclick  = close;
  }

  // ── Lista ────────────────────────────────────────────────────
  async function _cargarLista() {
    const el = document.getElementById('ms-lista');
    el.innerHTML = '<div class="ms-empty">Cargando…</div>';
    try {
      _lista = await PAT.MisSistemas.listar();
    } catch(e) {
      _lista = [];
    }

    if (!_lista.length) {
      el.innerHTML = '<div class="ms-empty">Aún no tienes sistemas guardados.<br>Crea uno nuevo o importa un archivo JSON.</div>';
      return;
    }

    el.innerHTML = '';
    _lista.forEach(s => {
      const d = document.createElement('div');
      d.className = 'ms-item' + (_editId === s.id ? ' sel' : '');
      d.dataset.id = s.id;
      d.innerHTML = `
        <div class="ms-item-name">${s.nombre}</div>
        <div class="ms-item-sub">v${s.version||'1.0'} · ${(s.piezas||[]).length} pieza(s)</div>
      `;
      d.onclick = () => _abrirSistema(s);
      el.appendChild(d);
    });
  }

  // ── Nuevo sistema ────────────────────────────────────────────
  function _nuevo() {
    _editId = null;
    _renderEditor({ nombre:'', descripcion:'', version:'1.0', autor:'', piezas:[] });
    _selItem(null);
    document.getElementById('ms-footer').style.display = '';
  }

  function _abrirSistema(s) {
    _editId = s.id;
    _renderEditor(s);
    _selItem(s.id);
    document.getElementById('ms-footer').style.display = '';
    document.getElementById('ms-del-btn').style.display = '';
  }

  function _selItem(id) {
    document.querySelectorAll('#ms-lista .ms-item').forEach(el => {
      el.classList.toggle('sel', el.dataset.id === id);
    });
  }

  // ── Editor ───────────────────────────────────────────────────
  let _piezasLocal = []; // estado en edición

  function _renderEditor(s) {
    _piezasLocal = JSON.parse(JSON.stringify(s.piezas || []));
    const panel = document.getElementById('ms-panel');
    panel.innerHTML = `
      <div class="ms-sec">
        <div class="ms-sec-title">Información del sistema</div>
        <div class="ms-row"><span class="ms-lbl">Nombre</span>
          <input class="ms-inp" id="ms-nombre" placeholder="Ej: Sistema Atelier NH" value="${_esc(s.nombre)}">
        </div>
        <div class="ms-row"><span class="ms-lbl">Autor / Atelier</span>
          <input class="ms-inp" id="ms-autor" placeholder="Ej: Nereyda Herrera" value="${_esc(s.autor||'')}">
        </div>
        <div class="ms-row"><span class="ms-lbl">Versión</span>
          <input class="ms-inp" id="ms-version" placeholder="1.0" value="${_esc(s.version||'1.0')}" style="max-width:80px">
        </div>
        <div>
          <textarea class="ms-inp ms-ta" id="ms-desc" placeholder="Describe el sistema: origen, método, notas generales…">${_esc(s.descripcion||'')}</textarea>
        </div>
      </div>

      <div class="ms-sec">
        <div class="ms-sec-title">Piezas del sistema</div>
        <div class="ms-piezas" id="ms-piezas-lista"></div>
        <button class="ms-add-pieza" onclick="PAT.MisSistemasUI._agregarPieza()">＋ Agregar pieza</button>
      </div>

      <div id="ms-pieza-editor"></div>
    `;
    _renderPiezas();
  }

  function _renderPiezas() {
    const el = document.getElementById('ms-piezas-lista');
    if (!el) return;
    el.innerHTML = '';
    _piezasLocal.forEach((p, i) => {
      const d = document.createElement('div');
      d.className = 'ms-pieza-item';
      d.innerHTML = `
        <div style="flex:1" onclick="PAT.MisSistemasUI._editarPieza(${i})">
          <div class="ms-pieza-name">${p.nombre || 'Sin nombre'}</div>
          <div class="ms-pieza-sub">${p.categoria||'otro'} · ${p.tipo||'dama'} · ${(p.puntos||[]).length} pts · ${(p.lineas||[]).length} líneas</div>
        </div>
        <button class="ms-pieza-del" title="Eliminar pieza" onclick="PAT.MisSistemasUI._borrarPieza(${i})">✕</button>
      `;
      el.appendChild(d);
    });
  }

  function _agregarPieza() {
    _piezasLocal.push({
      id:       'pieza-' + Date.now(),
      nombre:   '',
      categoria:'espalda',
      tipo:     'dama',
      notas:    '',
      puntos:   [],
      lineas:   [],
    });
    _renderPiezas();
    _editarPieza(_piezasLocal.length - 1);
  }

  function _borrarPieza(i) {
    if (!confirm('¿Eliminar esta pieza?')) return;
    _piezasLocal.splice(i, 1);
    _renderPiezas();
    const ed = document.getElementById('ms-pieza-editor');
    if (ed) { ed.innerHTML = ''; ed.classList.remove('open'); }
  }

  function _editarPieza(i) {
    _editPiezaIdx = i;
    const p   = _piezasLocal[i];
    const ed  = document.getElementById('ms-pieza-editor');
    if (!ed) return;
    ed.classList.add('open');
    ed.innerHTML = `
      <div class="ms-pe-title">✏ Editar pieza ${i+1}</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="ms-row">
          <span class="ms-lbl">Nombre</span>
          <input class="ms-inp" id="ms-pe-nombre" placeholder="Ej: Blusa Trasera" value="${_esc(p.nombre)}">
        </div>
        <div class="ms-row">
          <span class="ms-lbl">ID (slug)</span>
          <input class="ms-inp" id="ms-pe-id" placeholder="blusa-trasera" value="${_esc(p.id)}" style="font-family:var(--mono,monospace);font-size:11px">
        </div>
        <div class="ms-row">
          <span class="ms-lbl">Categoría</span>
          <select class="ms-sel" id="ms-pe-cat">
            ${CATEGORIAS.map(c=>`<option value="${c}" ${p.categoria===c?'selected':''}>${c}</option>`).join('')}
          </select>
          <span class="ms-lbl" style="margin-left:10px">Tipo</span>
          <select class="ms-sel" id="ms-pe-tipo">
            ${TIPOS.map(t=>`<option value="${t}" ${p.tipo===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <textarea class="ms-inp ms-ta" id="ms-pe-notas" placeholder="Fórmulas en texto libre, instrucciones…">${_esc(p.notas||'')}</textarea>
        </div>

        <!-- Puntos -->
        <div class="ms-sec-title" style="margin-top:6px">Puntos de construcción</div>
        <table class="ms-tbl">
          <tr><th>Nombre</th><th>Fórmula X (mm)</th><th>Fórmula Y (mm)</th><th></th></tr>
          <tbody id="ms-pe-pts"></tbody>
        </table>
        <button class="ms-add-row" onclick="PAT.MisSistemasUI._addPunto(${i})">＋ Agregar punto</button>

        <!-- Líneas -->
        <div class="ms-sec-title" style="margin-top:6px">Líneas de construcción</div>
        <table class="ms-tbl">
          <tr><th>De</th><th>A</th><th>Tipo</th><th></th></tr>
          <tbody id="ms-pe-lns"></tbody>
        </table>
        <button class="ms-add-row" onclick="PAT.MisSistemasUI._addLinea(${i})">＋ Agregar línea</button>

        <button class="ms-save-btn" style="margin-top:8px" onclick="PAT.MisSistemasUI._guardarPieza(${i})">✓ Confirmar pieza</button>
      </div>
    `;
    _renderPuntosEditor(i);
    _renderLineasEditor(i);

    // Listeners live
    ['ms-pe-nombre','ms-pe-id','ms-pe-cat','ms-pe-tipo','ms-pe-notas'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = () => _syncPiezaMeta(i);
    });
  }

  function _syncPiezaMeta(i) {
    const p = _piezasLocal[i];
    p.nombre    = document.getElementById('ms-pe-nombre')?.value || '';
    p.id        = document.getElementById('ms-pe-id')?.value    || ('pieza-' + i);
    p.categoria = document.getElementById('ms-pe-cat')?.value   || 'otro';
    p.tipo      = document.getElementById('ms-pe-tipo')?.value  || 'dama';
    p.notas     = document.getElementById('ms-pe-notas')?.value || '';
    _renderPiezas();
  }

  function _renderPuntosEditor(pIdx) {
    const tb = document.getElementById('ms-pe-pts');
    if (!tb) return;
    const pts = _piezasLocal[pIdx].puntos || [];
    tb.innerHTML = pts.map((pt, j) => `
      <tr>
        <td><input class="ms-pt-inp" data-pt="${j}" data-field="nombre" value="${_esc(pt.nombre)}" placeholder="A" style="width:40px" oninput="PAT.MisSistemasUI._updatePunto(${pIdx},${j},this)"></td>
        <td><input class="ms-pt-inp" data-pt="${j}" data-field="fx"     value="${_esc(pt.fx||'')}" placeholder="0" oninput="PAT.MisSistemasUI._updatePunto(${pIdx},${j},this)"></td>
        <td><input class="ms-pt-inp" data-pt="${j}" data-field="fy"     value="${_esc(pt.fy||'')}" placeholder="0" oninput="PAT.MisSistemasUI._updatePunto(${pIdx},${j},this)"></td>
        <td><button class="ms-pt-del" onclick="PAT.MisSistemasUI._delPunto(${pIdx},${j})">✕</button></td>
      </tr>
    `).join('');
  }

  function _updatePunto(pIdx, ptIdx, el) {
    const field = el.dataset.field;
    _piezasLocal[pIdx].puntos[ptIdx][field] = el.value;
  }

  function _addPunto(pIdx) {
    _piezasLocal[pIdx].puntos = _piezasLocal[pIdx].puntos || [];
    _piezasLocal[pIdx].puntos.push({ nombre:'', fx:'0', fy:'0' });
    _renderPuntosEditor(pIdx);
  }

  function _delPunto(pIdx, ptIdx) {
    _piezasLocal[pIdx].puntos.splice(ptIdx, 1);
    _renderPuntosEditor(pIdx);
  }

  function _renderLineasEditor(pIdx) {
    const tb = document.getElementById('ms-pe-lns');
    if (!tb) return;
    const lns = _piezasLocal[pIdx].lineas || [];
    const tiposLn = ['line','curve','fold','dart'];
    tb.innerHTML = lns.map((l, j) => `
      <tr>
        <td><input class="ms-pt-inp" value="${_esc(l.de)}" style="width:50px" placeholder="A" oninput="PAT.MisSistemasUI._updateLinea(${pIdx},${j},'de',this.value)"></td>
        <td><input class="ms-pt-inp" value="${_esc(l.a)}"  style="width:50px" placeholder="B" oninput="PAT.MisSistemasUI._updateLinea(${pIdx},${j},'a',this.value)"></td>
        <td><select class="ms-sel" style="font-size:10px;padding:3px 6px" onchange="PAT.MisSistemasUI._updateLinea(${pIdx},${j},'tipo',this.value)">
          ${tiposLn.map(t=>`<option value="${t}" ${l.tipo===t?'selected':''}>${t}</option>`).join('')}
        </select></td>
        <td><button class="ms-pt-del" onclick="PAT.MisSistemasUI._delLinea(${pIdx},${j})">✕</button></td>
      </tr>
    `).join('');
  }

  function _updateLinea(pIdx, lIdx, field, val) {
    _piezasLocal[pIdx].lineas[lIdx][field] = val;
  }

  function _addLinea(pIdx) {
    _piezasLocal[pIdx].lineas = _piezasLocal[pIdx].lineas || [];
    _piezasLocal[pIdx].lineas.push({ de:'', a:'', tipo:'line' });
    _renderLineasEditor(pIdx);
  }

  function _delLinea(pIdx, lIdx) {
    _piezasLocal[pIdx].lineas.splice(lIdx, 1);
    _renderLineasEditor(pIdx);
  }

  function _guardarPieza(i) {
    _syncPiezaMeta(i);
    const ed = document.getElementById('ms-pieza-editor');
    if (ed) { ed.innerHTML = ''; ed.classList.remove('open'); }
    _renderPiezas();
    if (PAT.App) PAT.App.toast('✓ Pieza guardada en el sistema', 'success');
  }

  // ── Guardar sistema completo ─────────────────────────────────
  async function _guardar() {
    const nombre = document.getElementById('ms-nombre')?.value.trim();
    if (!nombre) { alert('El sistema necesita un nombre.'); return; }

    const opts = {
      id:          _editId || undefined,
      nombre,
      autor:       document.getElementById('ms-autor')?.value.trim()   || '',
      version:     document.getElementById('ms-version')?.value.trim() || '1.0',
      descripcion: document.getElementById('ms-desc')?.value.trim()    || '',
      piezas:      _piezasLocal,
    };

    try {
      const id = await PAT.MisSistemas.guardar(opts);
      _editId = id;
      PAT.MisSistemas.registrarEnMemoria({ id, ...opts });
      await _cargarLista();
      if (PAT.App) PAT.App.toast('✅ Sistema guardado', 'success');
    } catch(e) {
      alert('Error guardando: ' + e.message);
    }
  }

  // ── Eliminar sistema ─────────────────────────────────────────
  async function _eliminar() {
    if (!_editId) return;
    if (!confirm('¿Eliminar este sistema? Esta acción no se puede deshacer.')) return;
    try {
      await PAT.MisSistemas.eliminar(_editId);
      _editId = null;
      document.getElementById('ms-panel').innerHTML = '<div class="ms-welcome"><div class="ms-welcome-icon">✂️</div><span>Sistema eliminado.</span></div>';
      document.getElementById('ms-footer').style.display = 'none';
      await _cargarLista();
    } catch(e) {
      alert('Error eliminando: ' + e.message);
    }
  }

  // ── Exportar ─────────────────────────────────────────────────
  function _exportar() {
    if (!_editId) return;
    const s = _lista.find(x => x.id === _editId);
    if (!s) return;
    PAT.MisSistemas.exportarJSON({
      ...s,
      nombre:      document.getElementById('ms-nombre')?.value  || s.nombre,
      descripcion: document.getElementById('ms-desc')?.value    || s.descripcion,
      version:     document.getElementById('ms-version')?.value || s.version,
      piezas:      _piezasLocal,
    });
  }

  // ── Importar desde archivo JSON ──────────────────────────────
  function _triggerImport() {
    document.getElementById('ms-import-file')?.click();
  }

  async function _importarArchivo(input) {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const texto = await file.text();
      const obj   = JSON.parse(texto);
      const id    = await PAT.MisSistemas.importarJSON(obj);
      await _cargarLista();
      const s = _lista.find(x => x.id === id) || { id, ...obj };
      _abrirSistema(s);
      if (PAT.App) PAT.App.toast('✅ Sistema importado: ' + obj.nombre, 'success');
    } catch(e) {
      alert('Error importando JSON: ' + e.message);
    }
    input.value = '';
  }

  // ── Helpers ──────────────────────────────────────────────────
  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  // ── API pública ──────────────────────────────────────────────
  return {
    open, close,
    _nuevo, _abrirSistema,
    _agregarPieza, _borrarPieza, _editarPieza, _guardarPieza,
    _addPunto, _delPunto, _updatePunto,
    _addLinea, _delLinea, _updateLinea,
    _guardar, _eliminar, _exportar,
    _triggerImport, _importarArchivo,
  };

})();
