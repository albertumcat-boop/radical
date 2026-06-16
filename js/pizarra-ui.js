'use strict';
window.PAT = window.PAT || {};

PAT.PizarraUI = (function () {

  let _pizarra  = null;   // { id, nombre, items: [] }
  let _items    = [];     // copia local mutable
  let _saveTimer = null;

  // ── Abrir ────────────────────────────────────────────────────

  async function open() {
    _ensureModal();
    document.getElementById('pz-modal').style.display = 'flex';
    await _showLista();
  }

  function close() {
    const m = document.getElementById('pz-modal');
    if (m) m.style.display = 'none';
    _pizarra = null; _items = [];
  }

  // ── Vista: lista de pizarras ─────────────────────────────────

  async function _showLista() {
    _pizarra = null;
    const lista = await PAT.Pizarra.listar();
    const body  = document.getElementById('pz-body');
    body.innerHTML = `
      <div class="pz-lista-header">
        <span class="pz-lista-titulo">Mis Pizarras</span>
        <button class="pz-btn-nueva" id="pz-btn-nueva">＋ Nueva Pizarra</button>
      </div>
      <div class="pz-lista" id="pz-lista">
        ${lista.length === 0
          ? '<p class="pz-empty">Aún no tienes pizarras. ¡Crea la primera!</p>'
          : lista.map(p => `
              <div class="pz-lista-item" data-id="${p.id}">
                <div class="pz-lista-item-info">
                  <span class="pz-lista-item-nombre">${_esc(p.nombre)}</span>
                  <span class="pz-lista-item-count">${(p.items||[]).length} elemento(s)</span>
                </div>
                <div class="pz-lista-item-actions">
                  <button class="pz-btn-abrir" data-id="${p.id}">Abrir →</button>
                  <button class="pz-btn-del" data-id="${p.id}" title="Eliminar">✕</button>
                </div>
              </div>`).join('')}
      </div>`;

    document.getElementById('pz-btn-nueva').onclick = _nuevaPizarra;
    body.querySelectorAll('.pz-btn-abrir').forEach(b =>
      b.onclick = () => _abrirPizarra(b.dataset.id));
    body.querySelectorAll('.pz-btn-del').forEach(b =>
      b.onclick = (e) => { e.stopPropagation(); _eliminarPizarra(b.dataset.id); });
  }

  async function _nuevaPizarra() {
    const nombre = prompt('Nombre de la pizarra:', 'Nueva Pizarra');
    if (!nombre) return;
    const p = await PAT.Pizarra.crear(nombre.trim());
    await _abrirPizarra(p.id);
  }

  async function _eliminarPizarra(id) {
    if (!confirm('¿Eliminar esta pizarra? Esta acción no se puede deshacer.')) return;
    await PAT.Pizarra.eliminar(id);
    _showLista();
  }

  async function _abrirPizarra(id) {
    const data = await PAT.Pizarra.cargar(id);
    if (!data) return;
    _pizarra = data;
    _items   = JSON.parse(JSON.stringify(data.items || []));
    _renderBoard();
  }

  // ── Vista: board ─────────────────────────────────────────────

  function _renderBoard() {
    const body = document.getElementById('pz-body');
    body.innerHTML = `
      <div class="pz-board-toolbar">
        <button class="pz-back" id="pz-back">← Pizarras</button>
        <input class="pz-nombre-input" id="pz-nombre-input" value="${_esc(_pizarra.nombre)}">
        <div class="pz-add-menu">
          <button class="pz-add-btn" id="pz-add-btn">＋ Agregar</button>
          <div class="pz-add-dropdown" id="pz-add-dropdown" style="display:none">
            <button data-type="imagen">🖼 Imagen</button>
            <button data-type="color">🎨 Color</button>
            <button data-type="nota">📝 Nota</button>
            <button data-type="video">🎬 Video</button>
            <button data-type="audio">🎵 Audio</button>
          </div>
        </div>
      </div>
      <div class="pz-board" id="pz-board">
        <div class="pz-canvas" id="pz-canvas"></div>
      </div>`;

    // Wiring toolbar
    document.getElementById('pz-back').onclick = _showLista;

    const nombreInput = document.getElementById('pz-nombre-input');
    nombreInput.onblur = async () => {
      if (nombreInput.value.trim() && nombreInput.value !== _pizarra.nombre) {
        _pizarra.nombre = nombreInput.value.trim();
        await PAT.Pizarra.renombrar(_pizarra.id, _pizarra.nombre);
      }
    };

    const addBtn      = document.getElementById('pz-add-btn');
    const addDropdown = document.getElementById('pz-add-dropdown');
    addBtn.onclick = (e) => {
      e.stopPropagation();
      addDropdown.style.display = addDropdown.style.display === 'none' ? 'block' : 'none';
    };
    document.getElementById('pz-body').addEventListener('click', () => {
      addDropdown.style.display = 'none';
    });
    addDropdown.querySelectorAll('button[data-type]').forEach(b =>
      b.onclick = (e) => { e.stopPropagation(); addDropdown.style.display='none'; _addItem(b.dataset.type); });

    // Render items
    _items.forEach(item => _renderItem(item));

    // Click vacío en canvas = deseleccionar
    document.getElementById('pz-canvas').addEventListener('mousedown', e => {
      if (e.target.id === 'pz-canvas') _deselectAll();
    });
  }

  // ── Añadir ítems ─────────────────────────────────────────────

  async function _addItem(type) {
    const base = { id: _uid(), type, x: 60 + Math.random()*200|0, y: 60 + Math.random()*120|0, w: 220, h: 180 };

    if (type === 'imagen') {
      const src = await _pickImage();
      if (!src) return;
      const item = { ...base, src, caption: '' };
      _items.push(item); _renderItem(item); _scheduleSave();

    } else if (type === 'color') {
      const item = { ...base, color: '#a78bfa', label: 'Color', w: 160, h: 160 };
      _items.push(item); _renderItem(item); _scheduleSave();

    } else if (type === 'nota') {
      const item = { ...base, titulo: 'Nota', cuerpo: '', w: 220, h: 160 };
      _items.push(item); _renderItem(item); _scheduleSave();

    } else if (type === 'video') {
      const url = prompt('URL del video (YouTube o Vimeo):');
      if (!url) return;
      const embed = _videoEmbed(url);
      if (!embed) { alert('URL no reconocida. Usa YouTube o Vimeo.'); return; }
      const item = { ...base, embed, url, w: 320, h: 200 };
      _items.push(item); _renderItem(item); _scheduleSave();

    } else if (type === 'audio') {
      const src = await _pickAudio();
      if (!src) return;
      const item = { ...base, src, label: 'Audio', w: 280, h: 90 };
      _items.push(item); _renderItem(item); _scheduleSave();
    }
  }

  async function _pickImage() {
    return new Promise(res => {
      const choice = confirm('¿Subir imagen desde tu equipo?\n\nAceptar = subir archivo\nCancelar = pegar URL');
      if (choice) {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = async () => {
          const file = inp.files[0]; if (!file) return res(null);
          const url = await PAT.Pizarra.subirArchivo(_pizarra.id, file, pct => {
            document.getElementById('pz-add-btn').textContent = `Subiendo ${pct}%…`;
          });
          document.getElementById('pz-add-btn').textContent = '＋ Agregar';
          res(url);
        };
        inp.click();
      } else {
        const url = prompt('Pega la URL de la imagen:');
        res(url || null);
      }
    });
  }

  async function _pickAudio() {
    return new Promise(res => {
      const choice = confirm('¿Subir audio desde tu equipo?\n\nAceptar = subir archivo\nCancelar = pegar URL');
      if (choice) {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'audio/*';
        inp.onchange = async () => {
          const file = inp.files[0]; if (!file) return res(null);
          const url = await PAT.Pizarra.subirArchivo(_pizarra.id, file, pct => {
            document.getElementById('pz-add-btn').textContent = `Subiendo ${pct}%…`;
          });
          document.getElementById('pz-add-btn').textContent = '＋ Agregar';
          res(url);
        };
        inp.click();
      } else {
        const url = prompt('Pega la URL del audio:');
        res(url || null);
      }
    });
  }

  function _videoEmbed(url) {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return null;
  }

  // ── Render de cada ítem ──────────────────────────────────────

  function _renderItem(item) {
    const canvas = document.getElementById('pz-canvas');
    if (!canvas) return;
    const old = document.getElementById('pz-item-' + item.id);
    if (old) old.remove();

    const el = document.createElement('div');
    el.className = 'pz-card';
    el.id = 'pz-item-' + item.id;
    el.style.cssText = `left:${item.x}px;top:${item.y}px;width:${item.w}px;`;

    el.innerHTML = `
      <div class="pz-card-handle" data-id="${item.id}">
        <span class="pz-card-type">${_typeIcon(item.type)}</span>
        <span class="pz-card-drag-hint">⠿</span>
        <button class="pz-card-del" data-id="${item.id}" title="Eliminar">✕</button>
      </div>
      <div class="pz-card-body">${_itemBody(item)}</div>
      <div class="pz-resize-handle" data-id="${item.id}"></div>`;

    canvas.appendChild(el);

    // Drag
    el.querySelector('.pz-card-handle').addEventListener('mousedown', e => {
      if (e.target.classList.contains('pz-card-del')) return;
      _startDrag(e, item, el);
    });

    // Resize
    el.querySelector('.pz-resize-handle').addEventListener('mousedown', e => {
      _startResize(e, item, el);
    });

    // Delete
    el.querySelector('.pz-card-del').addEventListener('click', () => {
      _items = _items.filter(i => i.id !== item.id);
      el.remove();
      _scheduleSave();
    });

    // Inline editing per type
    _bindEditors(el, item);
  }

  function _itemBody(item) {
    if (item.type === 'imagen') {
      return `<img src="${_esc(item.src)}" alt="${_esc(item.caption)}" class="pz-img">
              <input class="pz-caption" value="${_esc(item.caption)}" placeholder="Descripción…" data-id="${item.id}" data-field="caption">`;
    }
    if (item.type === 'color') {
      return `<div class="pz-color-swatch" style="background:${_esc(item.color)}" data-id="${item.id}"></div>
              <div class="pz-color-row">
                <input type="color" class="pz-color-picker" value="${_esc(item.color)}" data-id="${item.id}" data-field="color">
                <input class="pz-caption" value="${_esc(item.label)}" placeholder="Nombre del color…" data-id="${item.id}" data-field="label">
              </div>`;
    }
    if (item.type === 'nota') {
      return `<input class="pz-nota-titulo" value="${_esc(item.titulo)}" placeholder="Título…" data-id="${item.id}" data-field="titulo">
              <textarea class="pz-nota-cuerpo" data-id="${item.id}" data-field="cuerpo" placeholder="Escribe aquí…">${_esc(item.cuerpo)}</textarea>`;
    }
    if (item.type === 'video') {
      return `<iframe src="${_esc(item.embed)}" class="pz-video" frameborder="0" allowfullscreen></iframe>`;
    }
    if (item.type === 'audio') {
      return `<input class="pz-caption" value="${_esc(item.label)}" placeholder="Descripción…" data-id="${item.id}" data-field="label">
              <audio controls class="pz-audio"><source src="${_esc(item.src)}"></audio>`;
    }
    return '';
  }

  function _bindEditors(el, item) {
    // Text inputs / textareas
    el.querySelectorAll('[data-field]').forEach(inp => {
      const ev = inp.tagName === 'TEXTAREA' ? 'input' : 'change';
      inp.addEventListener(ev, () => {
        const field = inp.dataset.field;
        item[field] = inp.value;
        // Live update swatch
        if (field === 'color') {
          const swatch = el.querySelector('.pz-color-swatch');
          if (swatch) swatch.style.background = inp.value;
        }
        _scheduleSave();
      });
    });
    // Click on swatch opens color picker
    const swatch = el.querySelector('.pz-color-swatch');
    if (swatch) {
      swatch.addEventListener('click', () => {
        el.querySelector('.pz-color-picker')?.click();
      });
    }
  }

  // ── Drag ─────────────────────────────────────────────────────

  function _startDrag(e, item, el) {
    e.preventDefault();
    const startX = e.clientX - item.x;
    const startY = e.clientY - item.y;
    el.classList.add('pz-dragging');

    function onMove(e) {
      item.x = Math.max(0, e.clientX - startX);
      item.y = Math.max(0, e.clientY - startY);
      el.style.left = item.x + 'px';
      el.style.top  = item.y + 'px';
    }
    function onUp() {
      el.classList.remove('pz-dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      _scheduleSave();
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  // ── Resize ───────────────────────────────────────────────────

  function _startResize(e, item, el) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = item.w;

    function onMove(e) {
      item.w = Math.max(140, startW + (e.clientX - startX));
      el.style.width = item.w + 'px';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      _scheduleSave();
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  // ── Guardar (debounce 800ms) ──────────────────────────────────

  function _scheduleSave() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async () => {
      if (!_pizarra) return;
      await PAT.Pizarra.guardarItems(_pizarra.id, _items);
    }, 800);
  }

  function _deselectAll() {
    document.querySelectorAll('.pz-card.pz-selected')
      .forEach(el => el.classList.remove('pz-selected'));
  }

  // ── Modal HTML + CSS ──────────────────────────────────────────

  function _ensureModal() {
    if (document.getElementById('pz-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'pz-modal';
    modal.innerHTML = `
      <div class="pz-panel">
        <div class="pz-header">
          <span class="pz-header-title">🎨 Pizarra de Inspiración</span>
          <button id="pz-close">✕</button>
        </div>
        <div id="pz-body" class="pz-body-area"></div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById('pz-close').onclick = close;
    modal.addEventListener('click', e => { if (e.target === modal) close(); });

    _injectCSS();
  }

  function _injectCSS() {
    if (document.getElementById('pz-styles')) return;
    const s = document.createElement('style');
    s.id = 'pz-styles';
    s.textContent = `
      #pz-modal{position:fixed;inset:0;z-index:9900;display:none;align-items:stretch;justify-content:stretch;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);}
      .pz-panel{display:flex;flex-direction:column;width:100%;height:100%;background:#0e0c1a;}
      .pz-header{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;}
      .pz-header-title{font-size:1rem;font-weight:700;color:#f472b6;}
      #pz-close{background:none;border:none;color:#64748b;font-size:1.1rem;cursor:pointer;padding:4px 8px;border-radius:6px;}
      #pz-close:hover{color:#fff;background:rgba(255,255,255,.08);}

      /* Lista */
      .pz-body-area{flex:1;overflow:auto;padding:24px;}
      .pz-lista-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
      .pz-lista-titulo{font-size:1.1rem;font-weight:700;color:#e2e8f0;}
      .pz-btn-nueva{background:linear-gradient(135deg,#ec4899,#be185d);border:none;color:#fff;border-radius:8px;padding:8px 18px;font-size:.85rem;font-weight:600;cursor:pointer;}
      .pz-btn-nueva:hover{opacity:.88;}
      .pz-empty{color:#475569;font-style:italic;text-align:center;margin-top:48px;}
      .pz-lista{display:grid;gap:10px;}
      .pz-lista-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:background .15s;}
      .pz-lista-item:hover{background:rgba(244,114,182,.08);border-color:rgba(244,114,182,.3);}
      .pz-lista-item-nombre{font-size:.95rem;font-weight:600;color:#e2e8f0;}
      .pz-lista-item-count{font-size:.75rem;color:#475569;margin-top:2px;}
      .pz-lista-item-info{display:flex;flex-direction:column;gap:2px;}
      .pz-lista-item-actions{display:flex;gap:8px;align-items:center;}
      .pz-btn-abrir{background:rgba(244,114,182,.15);border:1px solid rgba(244,114,182,.35);color:#f472b6;border-radius:6px;padding:5px 14px;font-size:.8rem;cursor:pointer;}
      .pz-btn-abrir:hover{background:rgba(244,114,182,.3);}
      .pz-btn-del{background:none;border:none;color:#475569;cursor:pointer;font-size:1rem;padding:4px 6px;border-radius:4px;}
      .pz-btn-del:hover{color:#f87171;background:rgba(248,113,113,.1);}

      /* Board */
      .pz-board-toolbar{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;background:#0e0c1a;position:relative;z-index:10;}
      .pz-back{background:none;border:1px solid rgba(255,255,255,.12);color:#94a3b8;border-radius:6px;padding:5px 14px;font-size:.82rem;cursor:pointer;}
      .pz-back:hover{color:#fff;}
      .pz-nombre-input{background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.15);color:#e2e8f0;font-size:1rem;font-weight:700;padding:2px 6px;flex:1;max-width:360px;}
      .pz-nombre-input:focus{outline:none;border-bottom-color:#f472b6;}
      .pz-add-menu{position:relative;margin-left:auto;}
      .pz-add-btn{background:linear-gradient(135deg,#ec4899,#be185d);border:none;color:#fff;border-radius:8px;padding:7px 16px;font-size:.85rem;font-weight:600;cursor:pointer;}
      .pz-add-dropdown{position:absolute;right:0;top:calc(100% + 6px);background:#1a1730;border:1px solid rgba(244,114,182,.3);border-radius:10px;padding:6px;min-width:170px;z-index:200;box-shadow:0 12px 40px rgba(0,0,0,.6);}
      .pz-add-dropdown button{display:block;width:100%;text-align:left;background:none;border:none;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:.88rem;cursor:pointer;}
      .pz-add-dropdown button:hover{background:rgba(244,114,182,.15);color:#f472b6;}

      /* Canvas */
      .pz-board{flex:1;overflow:auto;background:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,.03) 39px,rgba(255,255,255,.03) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,.03) 39px,rgba(255,255,255,.03) 40px);background-color:#0a0817;}
      .pz-canvas{position:relative;min-width:2400px;min-height:1600px;}

      /* Cards */
      .pz-card{position:absolute;background:#13111f;border:1px solid rgba(255,255,255,.1);border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.4);display:flex;flex-direction:column;transition:box-shadow .15s;}
      .pz-card:hover{box-shadow:0 6px 32px rgba(0,0,0,.6);}
      .pz-card.pz-dragging{box-shadow:0 16px 60px rgba(0,0,0,.7);opacity:.92;cursor:grabbing;}
      .pz-card-handle{display:flex;align-items:center;gap:6px;padding:7px 10px;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.07);border-radius:12px 12px 0 0;cursor:grab;user-select:none;}
      .pz-card-handle:active{cursor:grabbing;}
      .pz-card-type{font-size:.9rem;}
      .pz-card-drag-hint{color:#475569;font-size:.85rem;flex:1;}
      .pz-card-del{background:none;border:none;color:#334155;cursor:pointer;font-size:.8rem;padding:2px 5px;border-radius:4px;line-height:1;}
      .pz-card-del:hover{color:#f87171;background:rgba(248,113,113,.1);}
      .pz-card-body{padding:10px;flex:1;overflow:hidden;display:flex;flex-direction:column;gap:6px;}

      /* Resize handle */
      .pz-resize-handle{width:14px;height:14px;position:absolute;right:0;bottom:0;cursor:se-resize;border-bottom-right-radius:12px;}
      .pz-resize-handle::after{content:'';position:absolute;right:4px;bottom:4px;width:8px;height:8px;border-right:2px solid #334155;border-bottom:2px solid #334155;border-radius:0 0 2px 0;}

      /* Imagen */
      .pz-img{width:100%;flex:1;object-fit:cover;border-radius:6px;min-height:80px;max-height:260px;}
      .pz-caption{background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.1);color:#94a3b8;font-size:.78rem;padding:3px 0;width:100%;}
      .pz-caption:focus{outline:none;border-bottom-color:#f472b6;color:#e2e8f0;}

      /* Color */
      .pz-color-swatch{flex:1;border-radius:8px;min-height:80px;cursor:pointer;transition:transform .1s;}
      .pz-color-swatch:hover{transform:scale(.98);}
      .pz-color-row{display:flex;align-items:center;gap:6px;}
      .pz-color-picker{width:28px;height:28px;border:none;border-radius:6px;cursor:pointer;padding:0;background:none;}

      /* Nota */
      .pz-nota-titulo{background:transparent;border:none;color:#e2e8f0;font-size:.95rem;font-weight:700;width:100%;margin-bottom:4px;}
      .pz-nota-titulo:focus{outline:none;}
      .pz-nota-cuerpo{background:transparent;border:none;color:#94a3b8;font-size:.83rem;line-height:1.55;flex:1;resize:none;min-height:80px;width:100%;font-family:inherit;}
      .pz-nota-cuerpo:focus{outline:none;color:#e2e8f0;}

      /* Video */
      .pz-video{width:100%;flex:1;border-radius:6px;min-height:140px;}

      /* Audio */
      .pz-audio{width:100%;margin-top:4px;}
    `;
    document.head.appendChild(s);
  }

  // ── Helpers ──────────────────────────────────────────────────

  function _uid()  { return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _typeIcon(t) { return {imagen:'🖼',color:'🎨',nota:'📝',video:'🎬',audio:'🎵'}[t]||'📌'; }

  return { open, close };

})();
