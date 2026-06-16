'use strict';
/**
 * materiales-ui.js
 * Biblioteca de materiales de apoyo: manuales, videos, imágenes, material de clase.
 */

window.PAT = window.PAT || {};
PAT.MaterialesUI = (function () {

  let _modal  = null;
  let _todos  = [];
  let _filtro = 'todos';

  const TIPOS = [
    { id:'todos',      label:'Todo',           icon:'🗂' },
    { id:'manual',     label:'Manuales',       icon:'📄' },
    { id:'video',      label:'Videos',         icon:'🎬' },
    { id:'imagen',     label:'Imágenes',       icon:'🖼' },
    { id:'clase',      label:'Material clase', icon:'🎓' },
    { id:'referencia', label:'Referencias',    icon:'🔗' },
  ];
  const TIPO_ICON = { manual:'📄', video:'🎬', imagen:'🖼', clase:'🎓', referencia:'🔗' };

  // ── Abrir / cerrar ────────────────────────────────────────────
  function open() {
    if (!_modal) _build();
    _modal.classList.add('open');
    _cargar();
  }
  function close() { _modal?.classList.remove('open'); }

  // ── Construcción del modal ────────────────────────────────────
  function _build() {
    _modal = document.createElement('div');
    _modal.id = 'mat-modal';
    _modal.innerHTML = `
<style>
#mat-modal{position:fixed;inset:0;z-index:970;display:none;align-items:center;justify-content:center}
#mat-modal.open{display:flex}
#mat-ov{position:absolute;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(5px)}
#mat-box{position:relative;z-index:1;background:#0e0e1a;border:1px solid #3d3d58;border-radius:18px;
  width:min(860px,97vw);max-height:92vh;display:flex;flex-direction:column;
  box-shadow:0 28px 90px rgba(0,0,0,.85)}
.mat-hdr{display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid #2e2e45;gap:12px}
.mat-title{font-size:14px;font-weight:800;color:#ede9fe;flex:1}
#mat-x{background:none;border:none;color:#5a5678;font-size:18px;cursor:pointer;padding:4px 8px}
#mat-x:hover{color:#ede9fe}
.mat-body{display:flex;flex:1;overflow:hidden}
/* Sidebar */
.mat-sidebar{width:185px;border-right:1px solid #1e1e30;padding:10px 8px;display:flex;flex-direction:column;gap:3px}
.mat-cat{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;
  font-size:12px;color:#9490b0;border:1px solid transparent;transition:.15s}
.mat-cat:hover{background:#141420;color:#ede9fe}
.mat-cat.sel{background:#1a1730;border-color:#8b5cf6;color:#ede9fe;font-weight:700}
.mat-cnt{margin-left:auto;font-size:9px;background:#2e2e45;border-radius:10px;padding:1px 6px;color:#5a5678}
/* Contenido */
.mat-content{flex:1;display:flex;flex-direction:column;overflow:hidden}
.mat-toolbar{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #1e1e30;flex-wrap:wrap}
.mat-search{flex:1;background:#141420;border:1px solid #2e2e45;border-radius:8px;
  color:#ede9fe;font-size:12px;padding:7px 10px;outline:none;min-width:140px}
.mat-search:focus{border-color:#8b5cf6}
.mat-btn-link{padding:7px 12px;border-radius:8px;border:1px solid #3d3d58;background:none;
  color:#9490b0;font-size:11px;cursor:pointer;white-space:nowrap}
.mat-btn-link:hover{border-color:#8b5cf6;color:#ede9fe}
.mat-btn-up{padding:7px 14px;border-radius:8px;border:none;background:#8b5cf6;
  color:#fff;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap}
.mat-btn-up:hover{background:#7c3aed}
/* Grid */
.mat-grid{flex:1;overflow-y:auto;padding:14px;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:12px;align-content:start}
.mat-empty{grid-column:1/-1;text-align:center;color:#5a5678;font-size:12px;padding:40px;line-height:1.9}
/* Cards */
.mat-card{background:#141420;border:1px solid #2e2e45;border-radius:12px;overflow:hidden;
  display:flex;flex-direction:column;transition:.15s}
.mat-card:hover{border-color:#8b5cf6;transform:translateY(-1px)}
.mat-thumb{height:115px;background:#0b0b16;display:flex;align-items:center;justify-content:center;
  position:relative;overflow:hidden;cursor:pointer}
.mat-thumb img{width:100%;height:100%;object-fit:cover}
.mat-thumb-icon{font-size:38px;opacity:.45}
.mat-badge{position:absolute;top:6px;right:6px;background:rgba(0,0,0,.72);
  border-radius:6px;padding:2px 6px;font-size:9px;color:#ede9fe;font-weight:700}
.mat-cbody{padding:9px;flex:1;cursor:pointer}
.mat-cname{font-size:12px;font-weight:700;color:#ede9fe;line-height:1.3;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mat-csub{font-size:10px;color:#5a5678;margin-top:3px}
.mat-ctags{display:flex;flex-wrap:wrap;gap:3px;margin-top:5px}
.mat-ctag{font-size:9px;background:#1a1730;border-radius:4px;padding:1px 5px;color:#9490b0}
.mat-cactions{display:flex;gap:5px;padding:7px 9px;border-top:1px solid #1a1730}
.mat-cact{flex:1;padding:4px;border-radius:6px;border:1px solid #2e2e45;background:none;
  color:#9490b0;font-size:10px;cursor:pointer;text-align:center}
.mat-cact:hover{border-color:#8b5cf6;color:#ede9fe}
.mat-cact.del:hover{border-color:#f87171;color:#f87171}
/* Panel subida */
#mat-panel{display:none;position:fixed;inset:0;z-index:980;align-items:center;justify-content:center}
#mat-panel.open{display:flex}
#mat-pov{position:absolute;inset:0;background:rgba(0,0,0,.6)}
#mat-pbox{position:relative;z-index:1;background:#0e0e1a;border:1px solid #3d3d58;border-radius:14px;
  width:min(430px,95vw);padding:22px;display:flex;flex-direction:column;gap:11px}
.mat-ptitle{font-size:13px;font-weight:800;color:#ede9fe}
.mat-prow{display:flex;flex-direction:column;gap:3px}
.mat-plbl{font-size:10px;color:#9490b0}
.mat-pinp{background:#141420;border:1px solid #2e2e45;border-radius:8px;color:#ede9fe;
  font-size:12px;padding:7px 10px;width:100%;outline:none}
.mat-pinp:focus{border-color:#8b5cf6}
.mat-psel{background:#141420;border:1px solid #2e2e45;border-radius:8px;color:#ede9fe;
  font-size:12px;padding:7px 10px;outline:none;width:100%}
.mat-drop{border:2px dashed #3d3d58;border-radius:10px;padding:22px;text-align:center;
  cursor:pointer;color:#5a5678;font-size:12px;transition:.15s}
.mat-drop:hover,.mat-drop.over{border-color:#8b5cf6;background:rgba(139,92,246,.05);color:#ede9fe}
.mat-prog{height:4px;background:#2e2e45;border-radius:2px;overflow:hidden;display:none;margin-top:4px}
.mat-progbar{height:100%;background:#8b5cf6;transition:width .2s;width:0%}
.mat-pbtns{display:flex;gap:8px}
.mat-pok{flex:1;padding:9px;border-radius:8px;border:none;background:#8b5cf6;color:#fff;
  font-size:12px;font-weight:700;cursor:pointer}
.mat-pok:hover{background:#7c3aed}
.mat-pcancel{padding:9px 14px;border-radius:8px;border:1px solid #3d3d58;background:none;
  color:#9490b0;font-size:12px;cursor:pointer}
.mat-pcancel:hover{border-color:#ede9fe;color:#ede9fe}
</style>

<div id="mat-ov"></div>
<div id="mat-box">
  <div class="mat-hdr">
    <div class="mat-title">🎓 Biblioteca de Materiales</div>
    <button id="mat-x">✕</button>
  </div>
  <div class="mat-body">
    <div class="mat-sidebar" id="mat-sidebar"></div>
    <div class="mat-content">
      <div class="mat-toolbar">
        <input class="mat-search" id="mat-search" placeholder="🔍 Buscar…" oninput="PAT.MaterialesUI._buscar()">
        <button class="mat-btn-link" onclick="PAT.MaterialesUI._abrirPanel('link')">🔗 Agregar link / video</button>
        <button class="mat-btn-up"   onclick="PAT.MaterialesUI._abrirPanel('archivo')">＋ Subir archivo</button>
      </div>
      <div class="mat-grid" id="mat-grid"></div>
    </div>
  </div>
</div>

<!-- Panel subida/link -->
<div id="mat-panel">
  <div id="mat-pov"></div>
  <div id="mat-pbox">
    <div class="mat-ptitle" id="mat-ptitle">Subir archivo</div>
    <div id="mat-pform"></div>
    <div class="mat-prog" id="mat-prog"><div class="mat-progbar" id="mat-progbar"></div></div>
    <div class="mat-pbtns">
      <button class="mat-pcancel" onclick="PAT.MaterialesUI._cerrarPanel()">Cancelar</button>
      <button class="mat-pok" id="mat-pok">Guardar</button>
    </div>
  </div>
</div>
    `;
    document.body.appendChild(_modal);
    document.getElementById('mat-ov').onclick  = close;
    document.getElementById('mat-x').onclick   = close;
    document.getElementById('mat-pov').onclick = _cerrarPanel;
    _renderSidebar();
  }

  // ── Sidebar ───────────────────────────────────────────────────
  function _renderSidebar() {
    const sb = document.getElementById('mat-sidebar');
    if (!sb) return;
    sb.innerHTML = TIPOS.map(t => `
      <div class="mat-cat ${_filtro===t.id?'sel':''}" data-id="${t.id}"
           onclick="PAT.MaterialesUI._filtrar('${t.id}')">
        <span>${t.icon}</span><span>${t.label}</span>
        <span class="mat-cnt" id="mat-cnt-${t.id}">0</span>
      </div>`).join('');
  }

  function _filtrar(tipo) {
    _filtro = tipo;
    document.querySelectorAll('.mat-cat').forEach(el =>
      el.classList.toggle('sel', el.dataset.id === tipo));
    _renderGrid(_filtrarLista());
  }

  function _buscar() { _renderGrid(_filtrarLista()); }

  function _filtrarLista() {
    const q = (document.getElementById('mat-search')?.value || '').toLowerCase();
    return _todos.filter(m => {
      const ok_tipo = _filtro === 'todos' || m.tipo === _filtro;
      const ok_q    = !q ||
        (m.nombre||'').toLowerCase().includes(q) ||
        (m.descripcion||'').toLowerCase().includes(q) ||
        (m.tags||[]).some(t => t.toLowerCase().includes(q));
      return ok_tipo && ok_q;
    });
  }

  // ── Cargar ────────────────────────────────────────────────────
  async function _cargar() {
    const grid = document.getElementById('mat-grid');
    if (grid) grid.innerHTML = '<div class="mat-empty">Cargando…</div>';
    try { _todos = await PAT.Materiales.listar(); }
    catch { _todos = []; }
    // Contadores
    TIPOS.forEach(t => {
      const el = document.getElementById('mat-cnt-' + t.id);
      if (el) el.textContent = t.id === 'todos'
        ? _todos.length
        : _todos.filter(m => m.tipo === t.id).length;
    });
    _renderGrid(_filtrarLista());
  }

  // ── Grid ──────────────────────────────────────────────────────
  function _renderGrid(lista) {
    const grid = document.getElementById('mat-grid');
    if (!grid) return;
    if (!lista.length) {
      grid.innerHTML = _todos.length === 0
        ? `<div class="mat-empty">📂 Aún no hay materiales.<br>
           Sube manuales PDF, agrega videos de YouTube,<br>imágenes o links de referencia.</div>`
        : `<div class="mat-empty">No hay materiales en esta categoría.</div>`;
      return;
    }
    grid.innerHTML = '';
    lista.forEach(m => {
      const thumb = m.thumbnail
        ? `<img src="${m.thumbnail}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : `<div class="mat-thumb-icon">${TIPO_ICON[m.tipo]||'📁'}</div>`;
      const sz   = m.tamaño ? _fmtSz(m.tamaño) : '';
      const tags = (m.tags||[]).slice(0,4).map(t=>`<span class="mat-ctag">${t}</span>`).join('');
      const card = document.createElement('div');
      card.className = 'mat-card';
      card.innerHTML = `
        <div class="mat-thumb" onclick="PAT.MaterialesUI._ver('${m.id}')">
          ${thumb}
          <div class="mat-badge">${TIPO_ICON[m.tipo]||'📁'} ${m.tipo}</div>
        </div>
        <div class="mat-cbody" onclick="PAT.MaterialesUI._ver('${m.id}')">
          <div class="mat-cname">${m.nombre}</div>
          <div class="mat-csub">${[sz,m.descripcion].filter(Boolean).join(' · ')}</div>
          ${tags?`<div class="mat-ctags">${tags}</div>`:''}
        </div>
        <div class="mat-cactions">
          <button class="mat-cact" onclick="PAT.MaterialesUI._ver('${m.id}')">👁 Ver</button>
          <button class="mat-cact del" onclick="PAT.MaterialesUI._eliminar('${m.id}')">🗑</button>
        </div>`;
      grid.appendChild(card);
    });
  }

  function _ver(id) {
    const m = _todos.find(x => x.id === id);
    if (m) window.open(m.url, '_blank', 'noopener');
  }

  async function _eliminar(id) {
    const m = _todos.find(x => x.id === id);
    if (!confirm(`¿Eliminar "${m?.nombre||'este material'}"?`)) return;
    try {
      await PAT.Materiales.eliminar(id);
      await _cargar();
      PAT.App?.toast('Material eliminado', 'info');
    } catch(e) { alert('Error: ' + e.message); }
  }

  // ── Panel subida / link ───────────────────────────────────────
  let _modo = 'archivo';
  let _fileSel = null;

  function _abrirPanel(modo) {
    _modo    = modo;
    _fileSel = null;
    const pn  = document.getElementById('mat-panel');
    const pt  = document.getElementById('mat-ptitle');
    const pf  = document.getElementById('mat-pform');
    const pok = document.getElementById('mat-pok');
    if (!pn) return;

    const tipoOpts = ['manual','video','imagen','clase','referencia']
      .map(t=>`<option value="${t}">${t}</option>`).join('');

    if (modo === 'archivo') {
      pt.textContent = '📁 Subir archivo';
      pf.innerHTML = `
        <div class="mat-prow">
          <div class="mat-drop" id="mat-drop"
               onclick="document.getElementById('mat-finp').click()"
               ondragover="event.preventDefault();this.classList.add('over')"
               ondragleave="this.classList.remove('over')"
               ondrop="PAT.MaterialesUI._onDrop(event)">
            Arrastra aquí o haz clic para seleccionar<br>
            <small style="color:#3d3d58;font-size:10px">PDF · imágenes · video</small>
          </div>
          <input type="file" id="mat-finp" style="display:none"
                 accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.mov"
                 onchange="PAT.MaterialesUI._onFileSelect(this)">
          <div id="mat-fname" style="font-size:10px;color:#5a5678;margin-top:4px;text-align:center"></div>
        </div>
        <div class="mat-prow"><span class="mat-plbl">Nombre</span>
          <input class="mat-pinp" id="mat-pnombre" placeholder="Nombre del material">
        </div>
        <div class="mat-prow"><span class="mat-plbl">Tipo</span>
          <select class="mat-psel" id="mat-ptipo">${tipoOpts}</select>
        </div>
        <div class="mat-prow"><span class="mat-plbl">Descripción</span>
          <input class="mat-pinp" id="mat-pdesc" placeholder="Opcional">
        </div>
        <div class="mat-prow"><span class="mat-plbl">Etiquetas</span>
          <input class="mat-pinp" id="mat-ptags" placeholder="manga, blusa, trazado (separar con comas)">
        </div>`;
      pok.onclick = _confirmarArchivo;

    } else {
      pt.textContent = '🔗 Agregar link / video';
      pf.innerHTML = `
        <div class="mat-prow"><span class="mat-plbl">URL</span>
          <input class="mat-pinp" id="mat-purl" placeholder="https://youtube.com/... o cualquier enlace"
                 oninput="PAT.MaterialesUI._detectYT(this.value)">
        </div>
        <div class="mat-prow"><span class="mat-plbl">Nombre</span>
          <input class="mat-pinp" id="mat-pnombre" placeholder="Ej: Tutorial manga raglan">
        </div>
        <div class="mat-prow"><span class="mat-plbl">Tipo</span>
          <select class="mat-psel" id="mat-ptipo">${tipoOpts}</select>
        </div>
        <div class="mat-prow"><span class="mat-plbl">Descripción</span>
          <input class="mat-pinp" id="mat-pdesc" placeholder="Opcional">
        </div>
        <div class="mat-prow"><span class="mat-plbl">Etiquetas</span>
          <input class="mat-pinp" id="mat-ptags" placeholder="manga, blusa, trazado (separar con comas)">
        </div>`;
      pok.onclick = _confirmarLink;
    }

    document.getElementById('mat-prog').style.display = 'none';
    pn.classList.add('open');
  }

  function _detectYT(url) {
    if (/youtube\.com|youtu\.be/.test(url)) {
      const tp = document.getElementById('mat-ptipo');
      if (tp) tp.value = 'video';
    }
  }

  function _cerrarPanel() {
    document.getElementById('mat-panel')?.classList.remove('open');
    _fileSel = null;
  }

  function _onFileSelect(inp) {
    _fileSel = inp.files?.[0] || null;
    if (!_fileSel) return;
    const fn = document.getElementById('mat-fname');
    if (fn) fn.textContent = `✓ ${_fileSel.name} (${_fmtSz(_fileSel.size)})`;
    const nb = document.getElementById('mat-pnombre');
    if (nb && !nb.value)
      nb.value = _fileSel.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  }

  function _onDrop(e) {
    e.preventDefault();
    document.getElementById('mat-drop')?.classList.remove('over');
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    _fileSel = f;
    const fn = document.getElementById('mat-fname');
    if (fn) fn.textContent = `✓ ${f.name} (${_fmtSz(f.size)})`;
    const nb = document.getElementById('mat-pnombre');
    if (nb && !nb.value) nb.value = f.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');
  }

  async function _confirmarArchivo() {
    if (!_fileSel) { alert('Selecciona un archivo primero.'); return; }
    const nombre = document.getElementById('mat-pnombre')?.value.trim() || _fileSel.name;
    const tipo   = document.getElementById('mat-ptipo')?.value   || 'referencia';
    const desc   = document.getElementById('mat-pdesc')?.value.trim() || '';
    const tags   = _parseTags(document.getElementById('mat-ptags')?.value || '');
    const prog   = document.getElementById('mat-prog');
    const bar    = document.getElementById('mat-progbar');
    if (prog) prog.style.display = 'block';
    try {
      await PAT.Materiales.subir(_fileSel, {
        nombre, tipo, descripcion: desc, tags,
        onProgress: p => { if (bar) bar.style.width = p + '%'; },
      });
      _cerrarPanel();
      await _cargar();
      PAT.App?.toast('✅ Material subido correctamente', 'success');
    } catch(e) {
      alert('Error al subir: ' + e.message);
      if (prog) prog.style.display = 'none';
    }
  }

  async function _confirmarLink() {
    const url  = document.getElementById('mat-purl')?.value.trim();
    if (!url)  { alert('Ingresa una URL.'); return; }
    const nombre = document.getElementById('mat-pnombre')?.value.trim() || 'Enlace';
    const tipo   = document.getElementById('mat-ptipo')?.value  || 'referencia';
    const desc   = document.getElementById('mat-pdesc')?.value.trim() || '';
    const tags   = _parseTags(document.getElementById('mat-ptags')?.value || '');
    try {
      if (tipo === 'video') await PAT.Materiales.agregarVideo(url, { nombre, descripcion: desc, tags });
      else                  await PAT.Materiales.agregarLink(url,  { nombre, tipo, descripcion: desc, tags });
      _cerrarPanel();
      await _cargar();
      PAT.App?.toast('✅ Material agregado', 'success');
    } catch(e) { alert('Error: ' + e.message); }
  }

  // ── Helpers ───────────────────────────────────────────────────
  function _parseTags(str) {
    return str.split(',').map(t => t.trim()).filter(Boolean);
  }
  function _fmtSz(b) {
    if (!b) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return Math.round(b/1024) + ' KB';
    return (b/1048576).toFixed(1) + ' MB';
  }

  // ── API pública ───────────────────────────────────────────────
  return { open, close, _filtrar, _buscar, _ver, _eliminar,
           _abrirPanel, _cerrarPanel, _detectYT,
           _onFileSelect, _onDrop,
           _confirmarArchivo, _confirmarLink };

})();
