'use strict';
/**
 * mis-sistemas-ui.js v2
 * Modal "Mis Sistemas de Patronaje"
 * – Preview SVG en vivo mientras defines puntos y líneas
 * – Tarjeta de referencia de variables (T, NK, ESP, LC…)
 * – Tipo 'construction' en las líneas
 * – Botón "🤖 Aprender mi método" → PAT.EntrevistaSistema
 */
window.PAT = window.PAT || {};
PAT.MisSistemasUI = (function () {

  let _modal    = null;
  let _lista    = [];
  let _editId   = null;
  let _editPiezaIdx = null;

  const CATEGORIAS_PIEZA = ['espalda','frente','manga','falda','pantalon','cuerpo','otro'];
  const TIPOS_PIEZA      = ['dama','caballero','ambos'];
  const TIPOS_LINEA      = ['line','curve','fold','dart','construction'];

  // Medidas de referencia para el preview (talla 38)
  const MEDS_REF = { bust:88, neck:36, shoulder:38, totalLength:65, waist:68, hip:94, hipDepth:18 };

  // ── Abrir / cerrar ─────────────────────────────────────────────
  function open() {
    if (!_modal) _build();
    _modal.classList.add('open');
    _cargarLista();
  }
  function close() {
    if (_modal) _modal.classList.remove('open');
    _editId = null; _editPiezaIdx = null;
  }

  // ── HTML del modal ─────────────────────────────────────────────
  function _build() {
    _modal = document.createElement('div');
    _modal.id = 'ms-modal';
    _modal.innerHTML = `
<style>
#ms-modal{position:fixed;inset:0;z-index:960;display:none;align-items:center;justify-content:center}
#ms-modal.open{display:flex}
#ms-ov{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(6px)}
#ms-box{position:relative;z-index:1;background:#0e0e1a;border:1px solid #3d3d58;border-radius:18px;
  width:min(980px,97vw);max-height:94vh;display:flex;flex-direction:column;
  box-shadow:0 32px 100px rgba(0,0,0,.9);overflow:hidden}
.ms-hdr{display:flex;align-items:center;padding:14px 18px;border-bottom:1px solid #1e1e30;gap:10px;flex-shrink:0}
.ms-title{font-size:13px;font-weight:800;color:#ede9fe;flex:1}
.ms-hdr-btn{padding:6px 12px;border-radius:8px;border:1px solid #3d3d58;background:none;
  color:#a78bfa;font-size:11px;cursor:pointer;font-weight:600}
.ms-hdr-btn:hover{background:#1a1730;border-color:#8b5cf6}
#ms-x{background:none;border:none;color:#5a5678;font-size:18px;cursor:pointer;padding:4px 8px}
#ms-x:hover{color:#ede9fe}
.ms-body{display:flex;flex:1;overflow:hidden;min-height:0}

/* Sidebar */
.ms-sidebar{width:210px;border-right:1px solid #1e1e30;display:flex;flex-direction:column;flex-shrink:0}
.ms-sidebar-top{padding:10px;border-bottom:1px solid #1e1e30;display:flex;gap:6px}
.ms-new-btn{flex:1;padding:7px;border-radius:8px;border:none;background:#8b5cf6;color:#fff;
  font-size:11px;font-weight:700;cursor:pointer}
.ms-new-btn:hover{background:#7c3aed}
.ms-import-btn{padding:7px 9px;border-radius:8px;border:1px solid #3d3d58;background:none;
  color:#9490b0;font-size:11px;cursor:pointer;title:"Importar JSON"}
.ms-import-btn:hover{border-color:#8b5cf6;color:#ede9fe}
#ms-lista{flex:1;overflow-y:auto;padding:8px}
.ms-item{padding:9px 11px;border-radius:9px;cursor:pointer;border:1px solid transparent;margin-bottom:5px;transition:.12s}
.ms-item:hover{background:#141420}
.ms-item.sel{background:#1a1730;border-color:#8b5cf6}
.ms-item-name{font-size:12px;font-weight:700;color:#ede9fe}
.ms-item-sub{font-size:10px;color:#5a5678;margin-top:2px}
.ms-empty{font-size:11px;color:#5a5678;padding:16px 10px;text-align:center;line-height:1.7}

/* Panel principal */
.ms-main{flex:1;overflow-y:auto;display:flex;flex-direction:column;min-width:0}
.ms-panel{padding:18px 20px;display:flex;flex-direction:column;gap:14px;flex:1}
.ms-welcome{display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:300px;gap:12px;color:#5a5678;font-size:13px;text-align:center;padding:40px}
.ms-welcome-icon{font-size:40px}

.ms-sec{display:flex;flex-direction:column;gap:6px}
.ms-sec-title{font-size:10px;font-weight:800;color:#a78bfa;text-transform:uppercase;
  letter-spacing:.08em;padding-bottom:5px;border-bottom:1px solid #1e1e30}
.ms-row{display:flex;gap:10px;align-items:center}
.ms-lbl{font-size:11px;color:#9490b0;min-width:88px;flex-shrink:0}
.ms-inp{background:#141420;border:1px solid #2e2e45;border-radius:8px;color:#ede9fe;
  font-size:12px;padding:6px 9px;width:100%;outline:none;font-family:inherit}
.ms-inp:focus{border-color:#8b5cf6}
.ms-ta{resize:vertical;min-height:52px}
.ms-sel{background:#141420;border:1px solid #2e2e45;border-radius:8px;color:#ede9fe;
  font-size:12px;padding:6px 9px;outline:none}
.ms-sel:focus{border-color:#8b5cf6}

/* Piezas */
.ms-piezas{display:flex;flex-direction:column;gap:5px}
.ms-pieza-item{background:#141420;border:1px solid #2e2e45;border-radius:9px;padding:9px 11px;
  display:flex;align-items:center;gap:10px}
.ms-pieza-item:hover{border-color:#4a3f7a}
.ms-pieza-click{flex:1;cursor:pointer}
.ms-pieza-name{font-size:12px;font-weight:700;color:#ede9fe}
.ms-pieza-sub{font-size:10px;color:#5a5678}
.ms-pieza-del{background:none;border:none;color:#5a5678;cursor:pointer;font-size:14px;padding:2px 6px}
.ms-pieza-del:hover{color:#f87171}
.ms-add-pieza{width:100%;padding:7px;border-radius:8px;border:1px dashed #3d3d58;background:none;
  color:#9490b0;font-size:11px;cursor:pointer;margin-top:3px}
.ms-add-pieza:hover{border-color:#8b5cf6;color:#ede9fe}

/* Editor de pieza */
#ms-pieza-editor{display:none;background:#0b0b16;border:1px solid #2e2e45;
  border-radius:12px;margin-top:6px;overflow:hidden}
#ms-pieza-editor.open{display:block}

/* Layout editor: izquierda=formularios, derecha=preview */
.ms-pe-layout{display:flex;gap:0;min-height:360px}
.ms-pe-forms{flex:1;padding:14px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;min-width:0}
.ms-pe-preview{width:220px;flex-shrink:0;border-left:1px solid #1e1e30;background:#080812;
  display:flex;flex-direction:column}
.ms-pe-preview-title{padding:8px 10px;font-size:9px;font-weight:700;color:#5a5678;
  text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #1e1e30;flex-shrink:0}
#ms-pe-svg{width:220px;height:280px;display:block}
.ms-pe-vars{padding:8px 10px;border-top:1px solid #1e1e30;font-size:9px;color:#4a4060;
  line-height:1.8;overflow-y:auto}
.ms-pe-vars strong{color:#6a5a9a}

.ms-pe-title{font-size:10px;font-weight:800;color:#a78bfa;margin-bottom:8px}
.ms-tbl{width:100%;border-collapse:collapse;font-size:11px}
.ms-tbl th{background:#141420;color:#8b7faa;padding:4px 6px;text-align:left;font-weight:600;
  border-bottom:1px solid #1e1e30;font-size:9.5px}
.ms-tbl td{padding:3px 4px;border-bottom:1px solid #0e0e1a;vertical-align:middle}
.ms-pt-inp{background:#0b0b16;border:1px solid #2e2e45;border-radius:5px;color:#ede9fe;
  font-size:11px;padding:3px 5px;width:100%;font-family:var(--mono,monospace);outline:none}
.ms-pt-inp:focus{border-color:#8b5cf6}
.ms-pt-del{background:none;border:none;color:#3d3d58;cursor:pointer;padding:2px 5px;font-size:12px}
.ms-pt-del:hover{color:#f87171}
.ms-add-row{width:100%;padding:5px;border-radius:6px;border:1px dashed #2e2e45;background:none;
  color:#5a5678;font-size:10px;cursor:pointer;margin-top:3px}
.ms-add-row:hover{border-color:#8b5cf6;color:#ede9fe}
.ms-tipo-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:middle}

/* Footer */
.ms-footer{display:flex;gap:8px;padding:12px 18px;border-top:1px solid #1e1e30;flex-shrink:0}
.ms-save-btn{flex:1;padding:8px;border-radius:9px;border:none;background:#8b5cf6;color:#fff;
  font-size:12px;font-weight:700;cursor:pointer}
.ms-save-btn:hover{background:#7c3aed}
.ms-del-btn{padding:8px 12px;border-radius:9px;border:1px solid #3d3d58;background:none;
  color:#f87171;font-size:11px;cursor:pointer}
.ms-del-btn:hover{background:rgba(248,113,113,.1)}
.ms-export-btn{padding:8px 12px;border-radius:9px;border:1px solid #3d3d58;background:none;
  color:#9490b0;font-size:11px;cursor:pointer}
.ms-export-btn:hover{border-color:#8b5cf6;color:#ede9fe}
</style>

<div id="ms-ov"></div>
<div id="ms-box">
  <div class="ms-hdr">
    <div class="ms-title">📐 Mis Sistemas de Patronaje</div>
    <button class="ms-hdr-btn" onclick="PAT.EntrevistaSistema && PAT.EntrevistaSistema.open()">🤖 Aprender mi Método</button>
    <button id="ms-x">✕</button>
  </div>
  <div class="ms-body">
    <div class="ms-sidebar">
      <div class="ms-sidebar-top">
        <button class="ms-new-btn" onclick="PAT.MisSistemasUI._nuevo()">＋ Nuevo</button>
        <button class="ms-import-btn" title="Importar JSON" onclick="PAT.MisSistemasUI._triggerImport()">📥</button>
        <input type="file" id="ms-import-file" accept=".json" style="display:none" onchange="PAT.MisSistemasUI._importarArchivo(this)">
      </div>
      <div id="ms-lista"></div>
    </div>
    <div class="ms-main">
      <div class="ms-panel" id="ms-panel">
        <div class="ms-welcome">
          <div class="ms-welcome-icon">✂️</div>
          <strong style="color:#ede9fe">Tus sistemas de patronaje</strong>
          <span style="max-width:320px">Crea un sistema nuevo, importa un JSON, o usa <strong style="color:#a78bfa">🤖 Aprender mi Método</strong> para que el asistente aprenda tu técnica de forma conversacional.</span>
        </div>
      </div>
      <div class="ms-footer" id="ms-footer" style="display:none">
        <button class="ms-export-btn" onclick="PAT.MisSistemasUI._exportar()">📤 Exportar JSON</button>
        <div style="flex:1"></div>
        <button class="ms-del-btn" id="ms-del-btn" onclick="PAT.MisSistemasUI._eliminar()">🗑 Eliminar</button>
        <button class="ms-save-btn" onclick="PAT.MisSistemasUI._guardar()">💾 Guardar sistema</button>
      </div>
    </div>
  </div>
</div>`;
    document.body.appendChild(_modal);
    document.getElementById('ms-ov').onclick = close;
    document.getElementById('ms-x').onclick  = close;
  }

  // ── Lista lateral ────────────────────────────────────────────────
  async function _cargarLista() {
    const el = document.getElementById('ms-lista');
    el.innerHTML = '<div class="ms-empty">Cargando…</div>';
    try { _lista = await PAT.MisSistemas.listar(); } catch(e) { _lista = []; }
    if (!_lista.length) {
      el.innerHTML = '<div class="ms-empty">Aún no tienes sistemas.<br>Crea uno o importa un JSON.</div>';
      return;
    }
    el.innerHTML = '';
    _lista.forEach(s => {
      const d = document.createElement('div');
      d.className = 'ms-item' + (_editId === s.id ? ' sel' : '');
      d.dataset.id = s.id;
      d.innerHTML = `<div class="ms-item-name">${_esc(s.nombre)}</div>
        <div class="ms-item-sub">v${s.version||'1.0'} · ${(s.piezas||[]).length} pieza(s)</div>`;
      d.onclick = () => _abrirSistema(s);
      el.appendChild(d);
    });
  }

  // ── Nuevo / abrir ────────────────────────────────────────────────
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
  }
  function _selItem(id) {
    document.querySelectorAll('#ms-lista .ms-item').forEach(el => {
      el.classList.toggle('sel', el.dataset.id === id);
    });
  }

  // ── Editor sistema ────────────────────────────────────────────────
  let _piezasLocal = [];

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
          <input class="ms-inp" id="ms-version" placeholder="1.0" value="${_esc(s.version||'1.0')}" style="max-width:70px">
        </div>
        <textarea class="ms-inp ms-ta" id="ms-desc" placeholder="Descripción del sistema, notas generales…">${_esc(s.descripcion||'')}</textarea>
      </div>

      <div class="ms-sec">
        <div class="ms-sec-title">Piezas del sistema</div>
        <div class="ms-piezas" id="ms-piezas-lista"></div>
        <button class="ms-add-pieza" onclick="PAT.MisSistemasUI._agregarPieza()">＋ Agregar pieza</button>
      </div>

      <div id="ms-pieza-editor"></div>`;
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
        <div class="ms-pieza-click" onclick="PAT.MisSistemasUI._editarPieza(${i})">
          <div class="ms-pieza-name">${_esc(p.nombre||'Sin nombre')}</div>
          <div class="ms-pieza-sub">${p.categoria||'otro'} · ${p.tipo||'dama'} · ${(p.puntos||[]).length} pts · ${(p.lineas||[]).length} líneas</div>
        </div>
        <button class="ms-pieza-del" onclick="PAT.MisSistemasUI._borrarPieza(${i})">✕</button>`;
      el.appendChild(d);
    });
  }

  function _agregarPieza() {
    _piezasLocal.push({ id:'pieza-'+Date.now(), nombre:'', categoria:'espalda', tipo:'dama', notas:'', puntos:[], lineas:[] });
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

  // ── Editor de pieza (con preview) ────────────────────────────────
  function _editarPieza(i) {
    _editPiezaIdx = i;
    const p  = _piezasLocal[i];
    const ed = document.getElementById('ms-pieza-editor');
    if (!ed) return;
    ed.classList.add('open');
    ed.innerHTML = `
      <div class="ms-pe-layout">
        <!-- Formularios -->
        <div class="ms-pe-forms">
          <div class="ms-pe-title">✏ Editando pieza ${i+1}</div>
          <div class="ms-row">
            <span class="ms-lbl">Nombre</span>
            <input class="ms-inp" id="ms-pe-nombre" placeholder="Ej: Delantera" value="${_esc(p.nombre)}">
          </div>
          <div class="ms-row">
            <span class="ms-lbl">ID (slug)</span>
            <input class="ms-inp" id="ms-pe-id" placeholder="delantera" value="${_esc(p.id)}" style="font-family:monospace;font-size:11px">
          </div>
          <div class="ms-row">
            <span class="ms-lbl">Categoría</span>
            <select class="ms-sel" id="ms-pe-cat">
              ${CATEGORIAS_PIEZA.map(c=>`<option value="${c}" ${p.categoria===c?'selected':''}>${c}</option>`).join('')}
            </select>
            <span class="ms-lbl" style="margin-left:8px">Tipo</span>
            <select class="ms-sel" id="ms-pe-tipo">
              ${TIPOS_PIEZA.map(t=>`<option value="${t}" ${p.tipo===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
          <textarea class="ms-inp ms-ta" id="ms-pe-notas" placeholder="Fórmulas en texto libre…">${_esc(p.notas||'')}</textarea>

          <!-- Puntos -->
          <div class="ms-sec-title" style="margin-top:4px">Puntos de construcción</div>
          <table class="ms-tbl">
            <tr><th>Nombre</th><th>X (mm) — fórmula</th><th>Y (mm) — fórmula</th><th>Nota</th><th></th></tr>
            <tbody id="ms-pe-pts"></tbody>
          </table>
          <button class="ms-add-row" onclick="PAT.MisSistemasUI._addPunto(${i})">＋ Punto</button>

          <!-- Líneas -->
          <div class="ms-sec-title" style="margin-top:4px">Líneas</div>
          <table class="ms-tbl">
            <tr><th>De</th><th>A</th><th>Tipo</th><th></th></tr>
            <tbody id="ms-pe-lns"></tbody>
          </table>
          <button class="ms-add-row" onclick="PAT.MisSistemasUI._addLinea(${i})">＋ Línea</button>

          <button class="ms-save-btn" style="margin-top:10px" onclick="PAT.MisSistemasUI._guardarPieza(${i})">✓ Confirmar pieza</button>
        </div>

        <!-- Preview SVG -->
        <div class="ms-pe-preview">
          <div class="ms-pe-preview-title">Vista previa · talla 38</div>
          <svg id="ms-pe-svg" width="220" height="280"></svg>
          <div class="ms-pe-vars">
            <strong>Variables disponibles:</strong><br>
            T = pecho×10 &nbsp; NK = cuello×10<br>
            ESP = espalda×10 &nbsp; LC = largo×10<br>
            CIN = cintura×10 &nbsp; CAD = cadera×10<br>
            s = 10 (margen)<br><br>
            <strong>Ejemplos de fórmulas:</strong><br>
            T/4+20 &nbsp; NK/6-10<br>
            ESP/2 &nbsp; LC &nbsp; s+30
          </div>
        </div>
      </div>`;

    // Listeners meta
    ['ms-pe-nombre','ms-pe-id','ms-pe-cat','ms-pe-tipo','ms-pe-notas'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = () => _syncPiezaMeta(i);
    });

    _renderPuntosEditor(i);
    _renderLineasEditor(i);
    _updatePreview(i);
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

  // ── Tabla de puntos ────────────────────────────────────────────────
  function _renderPuntosEditor(pIdx) {
    const tb = document.getElementById('ms-pe-pts');
    if (!tb) return;
    const pts = _piezasLocal[pIdx].puntos || [];
    tb.innerHTML = pts.map((pt, j) => `
      <tr>
        <td><input class="ms-pt-inp" style="width:36px" placeholder="A"
          value="${_esc(pt.nombre||pt.name||'')}"
          oninput="PAT.MisSistemasUI._updatePunto(${pIdx},${j},'nombre',this.value)"></td>
        <td><input class="ms-pt-inp" placeholder="0 o T/4+20"
          value="${_esc(pt.fx||'')}"
          oninput="PAT.MisSistemasUI._updatePunto(${pIdx},${j},'fx',this.value)"></td>
        <td><input class="ms-pt-inp" placeholder="0 o NK/6-10"
          value="${_esc(pt.fy||'')}"
          oninput="PAT.MisSistemasUI._updatePunto(${pIdx},${j},'fy',this.value)"></td>
        <td><input class="ms-pt-inp" placeholder="descripción…"
          value="${_esc(pt.nota||pt.notas||'')}"
          oninput="PAT.MisSistemasUI._updatePunto(${pIdx},${j},'nota',this.value)"></td>
        <td><button class="ms-pt-del" onclick="PAT.MisSistemasUI._delPunto(${pIdx},${j})">✕</button></td>
      </tr>`).join('');
  }

  function _updatePunto(pIdx, ptIdx, field, val) {
    if (!_piezasLocal[pIdx].puntos[ptIdx]) return;
    _piezasLocal[pIdx].puntos[ptIdx][field] = val;
    // también sincronizar 'name' desde 'nombre' para compatibilidad
    if (field === 'nombre') _piezasLocal[pIdx].puntos[ptIdx].name = val;
    _updatePreview(pIdx);
  }

  function _addPunto(pIdx) {
    _piezasLocal[pIdx].puntos = _piezasLocal[pIdx].puntos || [];
    _piezasLocal[pIdx].puntos.push({ nombre:'', name:'', fx:'0', fy:'0', nota:'' });
    _renderPuntosEditor(pIdx);
    _updatePreview(pIdx);
  }

  function _delPunto(pIdx, ptIdx) {
    _piezasLocal[pIdx].puntos.splice(ptIdx, 1);
    _renderPuntosEditor(pIdx);
    _updatePreview(pIdx);
  }

  // ── Tabla de líneas ────────────────────────────────────────────────
  const _LINE_COLOR = {
    line:'#7c3aed', curve:'#6d28d9', fold:'#a78bfa',
    dart:'#f59e0b', construction:'#4a4870',
  };

  function _renderLineasEditor(pIdx) {
    const tb = document.getElementById('ms-pe-lns');
    if (!tb) return;
    const lns = _piezasLocal[pIdx].lineas || [];
    tb.innerHTML = lns.map((l, j) => {
      const color = _LINE_COLOR[l.tipo || 'line'] || '#888';
      return `
      <tr>
        <td><input class="ms-pt-inp" style="width:44px" placeholder="A" value="${_esc(l.de||'')}"
          oninput="PAT.MisSistemasUI._updateLinea(${pIdx},${j},'de',this.value)"></td>
        <td><input class="ms-pt-inp" style="width:44px" placeholder="B" value="${_esc(l.a||'')}"
          oninput="PAT.MisSistemasUI._updateLinea(${pIdx},${j},'a',this.value)"></td>
        <td>
          <select class="ms-sel" style="font-size:10px;padding:3px 6px"
            onchange="PAT.MisSistemasUI._updateLinea(${pIdx},${j},'tipo',this.value)">
            ${TIPOS_LINEA.map(t=>`<option value="${t}" ${(l.tipo||'line')===t?'selected':''}>${t}</option>`).join('')}
          </select>
          <span class="ms-tipo-dot" style="background:${color}"></span>
        </td>
        <td><button class="ms-pt-del" onclick="PAT.MisSistemasUI._delLinea(${pIdx},${j})">✕</button></td>
      </tr>`;
    }).join('');
  }

  function _updateLinea(pIdx, lIdx, field, val) {
    if (!_piezasLocal[pIdx].lineas[lIdx]) return;
    _piezasLocal[pIdx].lineas[lIdx][field] = val;
    _renderLineasEditor(pIdx);
    _updatePreview(pIdx);
  }

  function _addLinea(pIdx) {
    _piezasLocal[pIdx].lineas = _piezasLocal[pIdx].lineas || [];
    _piezasLocal[pIdx].lineas.push({ de:'', a:'', tipo:'line' });
    _renderLineasEditor(pIdx);
  }

  function _delLinea(pIdx, lIdx) {
    _piezasLocal[pIdx].lineas.splice(lIdx, 1);
    _renderLineasEditor(pIdx);
    _updatePreview(pIdx);
  }

  // ── Preview SVG en vivo ───────────────────────────────────────────
  function _updatePreview(pIdx) {
    const svg = document.getElementById('ms-pe-svg');
    if (!svg) return;
    const pieza = _piezasLocal[pIdx];
    const vars  = PAT.MisSistemas._buildVarsDesde(MEDS_REF);

    // Evaluar puntos
    const pts = {};
    (pieza.puntos || []).forEach(pt => {
      const nombre = pt.nombre || pt.name || '';
      if (!nombre) return;
      const x = PAT.MisSistemas._evalExpr(pt.fx || '0', vars);
      const y = PAT.MisSistemas._evalExpr(pt.fy || '0', vars);
      if (x != null && y != null && !isNaN(x) && !isNaN(y)) pts[nombre] = { x, y };
    });

    const pVals = Object.values(pts);
    if (!pVals.length) { svg.innerHTML = ''; return; }

    const xs = pVals.map(p => p.x);
    const ys = pVals.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const W = (maxX - minX) || 10;
    const H = (maxY - minY) || 10;

    const SVG_W = 220, SVG_H = 280, PAD = 18;
    const scale = Math.min((SVG_W - PAD*2) / W, (SVG_H - PAD*2) / H);
    const offsetX = PAD - minX * scale + ((SVG_W - PAD*2) - W * scale) / 2;
    const offsetY = PAD - minY * scale + ((SVG_H - PAD*2) - H * scale) / 2;
    const tx = x => x * scale + offsetX;
    const ty = y => y * scale + offsetY;

    let html = '';

    // Líneas
    (pieza.lineas || []).forEach(ln => {
      const a = pts[ln.de], b = pts[ln.a];
      if (!a || !b) return;
      const color = _LINE_COLOR[ln.tipo] || '#7c3aed';
      const dash  = ln.tipo === 'construction' ? 'stroke-dasharray="5 3"' : '';
      const w     = ln.tipo === 'construction' ? 0.8 : 1.3;
      html += `<line x1="${tx(a.x).toFixed(1)}" y1="${ty(a.y).toFixed(1)}"
                     x2="${tx(b.x).toFixed(1)}" y2="${ty(b.y).toFixed(1)}"
                     stroke="${color}" stroke-width="${w}" ${dash}/>`;
    });

    // Puntos + etiquetas
    Object.entries(pts).forEach(([name, p]) => {
      html += `<circle cx="${tx(p.x).toFixed(1)}" cy="${ty(p.y).toFixed(1)}" r="2.2" fill="#a78bfa"/>`;
      html += `<text x="${(tx(p.x)+3).toFixed(1)}" y="${(ty(p.y)-3).toFixed(1)}"
                     font-size="7" fill="#8b7faa" font-family="monospace">${name}</text>`;
    });

    svg.innerHTML = html;
  }

  // ── Confirmar pieza ────────────────────────────────────────────────
  function _guardarPieza(i) {
    _syncPiezaMeta(i);
    // normalizar: nombre → name en cada punto
    (_piezasLocal[i].puntos || []).forEach(pt => {
      if (!pt.name) pt.name = pt.nombre;
      if (!pt.nombre) pt.nombre = pt.name;
    });
    const ed = document.getElementById('ms-pieza-editor');
    if (ed) { ed.innerHTML = ''; ed.classList.remove('open'); }
    _renderPiezas();
    if (PAT.App) PAT.App.toast('✓ Pieza guardada', 'success');
  }

  // ── Guardar sistema ────────────────────────────────────────────────
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
      PAT.WizardCustom && PAT.WizardCustom.recargar();
      await _cargarLista();
      if (PAT.App) PAT.App.toast('✅ Sistema guardado', 'success');
    } catch(e) { alert('Error guardando: ' + e.message); }
  }

  // ── Eliminar / exportar / importar ────────────────────────────────
  async function _eliminar() {
    if (!_editId) return;
    if (!confirm('¿Eliminar este sistema permanentemente?')) return;
    try {
      await PAT.MisSistemas.eliminar(_editId);
      _editId = null;
      document.getElementById('ms-panel').innerHTML = '<div class="ms-welcome"><div class="ms-welcome-icon">✂️</div><span>Sistema eliminado.</span></div>';
      document.getElementById('ms-footer').style.display = 'none';
      await _cargarLista();
    } catch(e) { alert('Error eliminando: ' + e.message); }
  }

  function _exportar() {
    if (!_editId) return;
    const s = _lista.find(x => x.id === _editId);
    if (!s) return;
    PAT.MisSistemas.exportarJSON({ ...s,
      nombre:      document.getElementById('ms-nombre')?.value  || s.nombre,
      descripcion: document.getElementById('ms-desc')?.value    || s.descripcion,
      version:     document.getElementById('ms-version')?.value || s.version,
      piezas:      _piezasLocal,
    });
  }

  function _triggerImport() { document.getElementById('ms-import-file')?.click(); }

  async function _importarArchivo(input) {
    const file = input.files?.[0]; if (!file) return;
    try {
      const obj = JSON.parse(await file.text());
      const id  = await PAT.MisSistemas.importarJSON(obj);
      await _cargarLista();
      const s = _lista.find(x => x.id === id) || { id, ...obj };
      _abrirSistema(s);
      if (PAT.App) PAT.App.toast('✅ Sistema importado: ' + obj.nombre, 'success');
    } catch(e) { alert('Error importando JSON: ' + e.message); }
    input.value = '';
  }

  // ── API interna para la entrevista ────────────────────────────────
  function abrirSistemaDesdeEntrevista(sistema) {
    if (!_modal) _build();
    _modal.classList.add('open');
    _editId = sistema.id || null;
    _renderEditor(sistema);
    document.getElementById('ms-footer').style.display = '';
    _cargarLista();
  }

  // ── Helpers ────────────────────────────────────────────────────────
  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  return {
    open, close, abrirSistemaDesdeEntrevista,
    _nuevo, _abrirSistema,
    _agregarPieza, _borrarPieza, _editarPieza, _guardarPieza,
    _addPunto, _delPunto, _updatePunto,
    _addLinea, _delLinea, _updateLinea,
    _guardar, _eliminar, _exportar,
    _triggerImport, _importarArchivo,
    _updatePreview,
  };
})();
