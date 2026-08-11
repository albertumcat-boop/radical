'use strict';
window.PAT = window.PAT || {};

PAT.ManualsUI = (function () {

  let _activeManualId = null;   // manual activo para captura
  let _capturePanel   = null;   // referencia al panel de captura
  let _prevLineCount  = 0;      // líneas existentes antes del paso actual

  // ── Recuperar manual activo entre sesiones ─────────────────────
  function _loadActive() {
    try { _activeManualId = localStorage.getItem('pat_active_manual') || null; } catch (_) {}
  }
  function _saveActive(id) {
    _activeManualId = id;
    try { localStorage.setItem('pat_active_manual', id || ''); } catch (_) {}
  }

  // ══════════════════════════════════════════════════════════════
  // PANEL DE CAPTURA (dentro del drafter)
  // ══════════════════════════════════════════════════════════════

  function initCapturePanel(container) {
    _loadActive();
    if (_capturePanel) { container.appendChild(_capturePanel); _refreshCapturePanel(); return; }

    const el = document.createElement('div');
    el.id = 'man-capture-panel';
    el.style.cssText = `
      position:absolute;right:0;top:0;bottom:0;width:200px;
      background:#0f0f1a;border-left:1px solid #2e2e45;
      display:flex;flex-direction:column;gap:0;z-index:10;
      transform:translateX(200px);transition:transform .25s;
    `;
    el.innerHTML = `
      <div style="padding:10px 12px;border-bottom:1px solid #2e2e45;display:flex;align-items:center;gap:6px">
        <span style="font-size:12px;font-weight:800;color:#c4b5fd;flex:1">📖 Manual</span>
        <button id="man-close-panel" style="background:none;border:none;color:#5a5678;cursor:pointer;font-size:14px">✕</button>
      </div>
      <div id="man-active-info" style="padding:8px 12px;border-bottom:1px solid #1a1a2a;font-size:10px;color:#9490b0;cursor:pointer" onclick="PAT.ManualsUI.openLibrary()">
        Sin manual activo — clic para crear
      </div>
      <button id="man-capture-btn" style="margin:10px 12px 4px;padding:9px;background:#7c3aed;border:none;border-radius:8px;color:#fff;font-weight:700;font-size:11px;cursor:pointer;font-family:inherit">
        📸 Capturar paso
      </button>
      <div style="padding:4px 12px 6px;font-size:10px;color:#5a5678;text-align:center" id="man-step-count">0 pasos capturados</div>
      <div id="man-thumbs" style="flex:1;overflow-y:auto;padding:8px 10px;display:flex;flex-direction:column;gap:6px"></div>
      <div style="padding:8px 12px;border-top:1px solid #2e2e45;display:flex;flex-direction:column;gap:5px">
        <button onclick="PAT.ManualsUI.openLibrary()" style="padding:7px;background:transparent;border:1px solid #2e2e45;border-radius:7px;color:#9490b0;font-size:10px;cursor:pointer;font-family:inherit">📚 Biblioteca de manuales</button>
      </div>
    `;
    _capturePanel = el;
    container.appendChild(el);

    document.getElementById('man-close-panel').onclick = hideCapture;
    document.getElementById('man-capture-btn').onclick = () => {
      if (PAT.DrafterUI?.capturar) PAT.DrafterUI.capturar();
    };

    _refreshCapturePanel();
  }

  function showCapture() {
    if (_capturePanel) _capturePanel.style.transform = 'translateX(0)';
  }
  function hideCapture() {
    if (_capturePanel) _capturePanel.style.transform = 'translateX(200px)';
  }

  function _refreshCapturePanel() {
    if (!_capturePanel) return;
    const infoEl   = document.getElementById('man-active-info');
    const countEl  = document.getElementById('man-step-count');
    const thumbsEl = document.getElementById('man-thumbs');
    if (!infoEl) return;

    if (!_activeManualId) {
      infoEl.textContent = 'Sin manual activo — clic para crear';
      if (countEl) countEl.textContent = '0 pasos capturados';
      if (thumbsEl) thumbsEl.innerHTML = '';
      return;
    }

    PAT.Manuals.obtenerManual(_activeManualId).then(manual => {
      if (!manual) { _saveActive(null); _refreshCapturePanel(); return; }
      if (infoEl) infoEl.textContent = '✏ ' + (manual.titulo || 'Sin título');
      const pasos = manual.pasos || [];
      if (countEl) countEl.textContent = pasos.length + ' paso' + (pasos.length === 1 ? '' : 's') + ' capturado' + (pasos.length === 1 ? '' : 's');
      if (thumbsEl) {
        thumbsEl.innerHTML = pasos.map((p, i) => `
          <div style="border:1px solid #2e2e45;border-radius:6px;overflow:hidden;cursor:pointer;background:#141420"
               onclick="PAT.ManualsUI.openEditor('${_activeManualId}')">
            <div style="padding:2px 6px;font-size:9px;color:#7c7aa8;border-bottom:1px solid #1a1a2a">Paso ${i + 1}</div>
            <div style="padding:4px;background:#fff">${p.svg || ''}</div>
            <div style="padding:3px 6px;font-size:9px;color:#9490b0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.descripcion || p.autoDesc || ''}</div>
          </div>
        `).join('');
      }
    }).catch(console.error);
  }

  // ── Registrar captura desde el drafter ─────────────────────────
  async function registrarCaptura(svgStr, autoDesc, newLineIndices) {
    if (!_activeManualId) {
      const titulo = prompt('Nombre del manual:', 'Manual de trazado');
      if (!titulo) return;
      const id = await PAT.Manuals.crearManual(titulo);
      _saveActive(id);
      _prevLineCount = 0;
    }

    const pasos = await PAT.Manuals.cargarPasos(_activeManualId);
    const orden = pasos.length + 1;

    await PAT.Manuals.agregarPaso(_activeManualId, {
      orden, svg: svgStr, autoDesc, descripcion: autoDesc, newLineIndices,
    });

    _refreshCapturePanel();
    _toast('Paso ' + orden + ' capturado ✓');
  }

  // ══════════════════════════════════════════════════════════════
  // BIBLIOTECA DE MANUALES
  // ══════════════════════════════════════════════════════════════

  function openLibrary() {
    let ov = document.getElementById('man-library-ov');
    if (ov) { ov.style.display = 'flex'; _renderLibrary(); return; }

    ov = document.createElement('div');
    ov.id = 'man-library-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:900;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.85);backdrop-filter:blur(6px)';
    ov.innerHTML = `
      <div style="background:#13131f;border:1px solid #2e2e45;border-radius:14px;width:min(860px,96vw);max-height:90vh;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,.9)">
        <div style="padding:14px 18px;border-bottom:1px solid #2e2e45;display:flex;align-items:center;gap:10px">
          <span style="font-size:15px;font-weight:800;color:#ede9fe;flex:1">📚 Biblioteca de Manuales</span>
          <button onclick="document.getElementById('man-library-ov').style.display='none'" style="background:none;border:none;color:#5a5678;cursor:pointer;font-size:16px">✕</button>
        </div>
        <div style="padding:12px 18px;border-bottom:1px solid #1a1a2a;display:flex;gap:8px">
          <button id="man-lib-new" style="padding:8px 16px;background:#7c3aed;border:none;border-radius:8px;color:#fff;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit">＋ Nuevo manual</button>
        </div>
        <div id="man-lib-grid" style="flex:1;overflow-y:auto;padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px"></div>
      </div>
    `;
    document.body.appendChild(ov);

    document.getElementById('man-lib-new').onclick = async () => {
      const titulo = prompt('Nombre del manual:', 'Manual de trazado');
      if (!titulo) return;
      const id = await PAT.Manuals.crearManual(titulo);
      _saveActive(id);
      _renderLibrary();
      _refreshCapturePanel();
    };

    _renderLibrary();
  }

  function _renderLibrary() {
    const grid = document.getElementById('man-lib-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="color:#5a5678;font-size:12px;padding:20px">Cargando...</div>';

    PAT.Manuals.cargarManuales().then(manuales => {
      if (!manuales.length) {
        grid.innerHTML = '<div style="color:#5a5678;font-size:12px;padding:20px;grid-column:1/-1">No tienes manuales aún. Crea el primero con el botón de arriba.</div>';
        return;
      }
      grid.innerHTML = manuales.map(m => `
        <div style="background:#1c1c2a;border:1.5px solid ${_activeManualId===m.id?'#7c3aed':'#2e2e45'};border-radius:10px;overflow:hidden;cursor:pointer;transition:border-color .15s"
             onclick="PAT.ManualsUI.selectManual('${m.id}')">
          <div style="background:#fff;height:100px;display:flex;align-items:center;justify-content:center;padding:6px;overflow:hidden">
            ${m.thumbnail ? m.thumbnail : '<span style="color:#ddd;font-size:11px">Sin captura</span>'}
          </div>
          <div style="padding:8px 10px">
            <div style="font-size:12px;font-weight:700;color:#ede9fe;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.titulo || 'Sin título'}</div>
            <div style="font-size:10px;color:#5a5678">${m.totalPasos || 0} pasos · ${m.estado === 'publicado' ? '🟢 Publicado' : '📝 Borrador'}</div>
          </div>
          <div style="padding:4px 8px 8px;display:flex;gap:4px">
            <button onclick="event.stopPropagation();PAT.ManualsUI.openEditor('${m.id}')" style="flex:1;padding:5px;background:#7c3aed;border:none;border-radius:6px;color:#fff;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit">✏ Editar</button>
            <button onclick="event.stopPropagation();PAT.ManualsUI._confirmDelete('${m.id}')" style="padding:5px 8px;background:transparent;border:1px solid #3d2020;border-radius:6px;color:#f87171;font-size:10px;cursor:pointer;font-family:inherit">🗑</button>
          </div>
        </div>
      `).join('');
    });
  }

  function selectManual(id) {
    _saveActive(id);
    _refreshCapturePanel();
    _renderLibrary(); // refresh borders
    _toast('Manual activo: seleccionado para captura');
  }

  function _confirmDelete(id) {
    if (!confirm('¿Eliminar este manual y todos sus pasos?')) return;
    PAT.Manuals.eliminarManual(id).then(() => {
      if (_activeManualId === id) _saveActive(null);
      _renderLibrary();
      _refreshCapturePanel();
    });
  }

  // ══════════════════════════════════════════════════════════════
  // EDITOR DE MANUAL
  // ══════════════════════════════════════════════════════════════

  function openEditor(manualId) {
    // Close library if open
    const lib = document.getElementById('man-library-ov');
    if (lib) lib.style.display = 'none';

    let ov = document.getElementById('man-editor-ov');
    if (ov) ov.remove();

    ov = document.createElement('div');
    ov.id = 'man-editor-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:910;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.85);backdrop-filter:blur(6px)';
    ov.innerHTML = `
      <div style="background:#13131f;border:1px solid #2e2e45;border-radius:14px;width:min(1100px,97vw);max-height:94vh;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,.9)">
        <div style="padding:12px 18px;border-bottom:1px solid #2e2e45;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <button onclick="document.getElementById('man-editor-ov').remove();PAT.ManualsUI.openLibrary()" style="background:none;border:none;color:#9490b0;cursor:pointer;font-size:12px">← Biblioteca</button>
          <input id="man-ed-titulo" style="background:none;border:none;border-bottom:1.5px solid #3d3d58;color:#ede9fe;font-size:14px;font-weight:800;font-family:inherit;outline:none;padding:2px 6px;flex:1;min-width:160px" placeholder="Título del manual">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button id="man-ed-pdf" style="padding:7px 14px;background:transparent;border:1px solid #3d3d58;border-radius:7px;color:#9490b0;font-size:11px;cursor:pointer;font-family:inherit">📄 Exportar PDF</button>
            <button id="man-ed-publish" style="padding:7px 14px;background:#059669;border:none;border-radius:7px;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">🛍 Publicar en tienda</button>
            <button onclick="document.getElementById('man-editor-ov')?.remove()" style="background:none;border:none;color:#5a5678;cursor:pointer;font-size:16px">✕</button>
          </div>
        </div>
        <div id="man-ed-steps" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px">
          <div style="color:#5a5678;font-size:12px">Cargando pasos...</div>
        </div>
      </div>
    `;
    document.body.appendChild(ov);

    PAT.Manuals.obtenerManual(manualId).then(manual => {
      if (!manual) return;
      const tit = document.getElementById('man-ed-titulo');
      if (tit) tit.value = manual.titulo || '';

      // Save title on blur
      if (tit) tit.onblur = () => PAT.Manuals.actualizarManual(manualId, { titulo: tit.value.trim() });

      // PDF button
      const pdfBtn = document.getElementById('man-ed-pdf');
      if (pdfBtn) pdfBtn.onclick = () => exportarPDF(manualId);

      // Publish button
      const pubBtn = document.getElementById('man-ed-publish');
      if (pubBtn) {
        if (manual.estado === 'publicado') {
          pubBtn.textContent = '🔴 Despublicar';
          pubBtn.style.background = '#7f1d1d';
          pubBtn.onclick = () => _despublicar(manualId, pubBtn);
        } else {
          pubBtn.onclick = () => _publishDialog(manualId, manual);
        }
      }

      _renderEditorSteps(manualId, manual.pasos || []);
    });
  }

  function _renderEditorSteps(manualId, pasos) {
    const cont = document.getElementById('man-ed-steps');
    if (!cont) return;

    if (!pasos.length) {
      cont.innerHTML = `<div style="color:#5a5678;font-size:12px;text-align:center;padding:40px">
        Aún no hay pasos capturados.<br>Abre el drafter, traza y usa el panel Manual para capturar pasos.
      </div>`;
      return;
    }

    cont.innerHTML = pasos.map((p, i) => `
      <div id="man-step-${p.id}" style="display:grid;grid-template-columns:260px 1fr;gap:14px;background:#1c1c2a;border:1px solid #2e2e45;border-radius:10px;overflow:hidden">
        <div style="background:#fff;display:flex;align-items:center;justify-content:center;padding:10px;min-height:180px">
          ${p.svg || '<span style="color:#aaa;font-size:11px">Sin imagen</span>'}
        </div>
        <div style="padding:12px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;font-weight:800;color:#a78bfa">Paso ${i + 1}</span>
            <div style="flex:1"></div>
            <button onclick="PAT.ManualsUI._deletePaso('${manualId}','${p.id}')" style="background:none;border:none;color:#5a5678;cursor:pointer;font-size:12px" title="Eliminar paso">🗑</button>
            ${i > 0 ? `<button onclick="PAT.ManualsUI._movePaso('${manualId}','${p.id}',-1)" style="background:none;border:none;color:#5a5678;cursor:pointer;font-size:12px" title="Subir">↑</button>` : ''}
            ${i < pasos.length - 1 ? `<button onclick="PAT.ManualsUI._movePaso('${manualId}','${p.id}',1)" style="background:none;border:none;color:#5a5678;cursor:pointer;font-size:12px" title="Bajar">↓</button>` : ''}
          </div>
          ${p.autoDesc ? `<div style="font-size:10px;color:#5a5678;font-family:monospace;background:#0f0f1a;padding:6px 8px;border-radius:5px;white-space:pre-wrap">${_esc(p.autoDesc)}</div>` : ''}
          <textarea id="man-desc-${p.id}"
            style="flex:1;background:#0f0f1a;border:1px solid #2e2e45;border-radius:7px;color:#ede9fe;font-size:12px;font-family:inherit;padding:8px 10px;resize:vertical;min-height:80px;outline:none"
            placeholder="Descripción del paso...">${_esc(p.descripcion || p.autoDesc || '')}</textarea>
          <button onclick="PAT.ManualsUI._saveDesc('${manualId}','${p.id}')"
            style="padding:6px;background:#7c3aed;border:none;border-radius:7px;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">
            💾 Guardar descripción
          </button>
        </div>
      </div>
    `).join('');
  }

  function _saveDesc(manualId, pasoId) {
    const ta = document.getElementById('man-desc-' + pasoId);
    if (!ta) return;
    PAT.Manuals.actualizarPaso(manualId, pasoId, { descripcion: ta.value.trim() })
      .then(() => _toast('Descripción guardada ✓'));
  }

  async function _deletePaso(manualId, pasoId) {
    if (!confirm('¿Eliminar este paso?')) return;
    await PAT.Manuals.eliminarPaso(manualId, pasoId);
    const manual = await PAT.Manuals.obtenerManual(manualId);
    _renderEditorSteps(manualId, manual?.pasos || []);
    _refreshCapturePanel();
  }

  async function _movePaso(manualId, pasoId, dir) {
    const manual = await PAT.Manuals.obtenerManual(manualId);
    const pasos = manual?.pasos || [];
    const idx = pasos.findIndex(p => p.id === pasoId);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= pasos.length) return;
    const tmp = pasos[idx]; pasos[idx] = pasos[newIdx]; pasos[newIdx] = tmp;
    await PAT.Manuals.reordenarPasos(manualId, pasos.map(p => p.id));
    _renderEditorSteps(manualId, pasos);
  }

  // ── Publicar dialog ────────────────────────────────────────────

  function _publishDialog(manualId, manual) {
    let d = document.getElementById('man-pub-dialog');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'man-pub-dialog';
    d.style.cssText = 'position:fixed;inset:0;z-index:920;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7)';
    d.innerHTML = `
      <div style="background:#1c1c2a;border:1px solid #7c3aed;border-radius:12px;padding:22px;width:min(420px,94vw)">
        <div style="font-size:14px;font-weight:800;color:#ede9fe;margin-bottom:14px">🛍 Publicar en la tienda</div>
        <label style="font-size:11px;color:#9490b0;display:block;margin-bottom:4px">Título</label>
        <input id="man-pub-titulo" value="${_esc(manual.titulo||'')}" style="width:100%;background:#0f0f1a;border:1px solid #2e2e45;border-radius:6px;color:#ede9fe;font-size:12px;padding:7px 10px;margin-bottom:10px;font-family:inherit;box-sizing:border-box">
        <label style="font-size:11px;color:#9490b0;display:block;margin-bottom:4px">Descripción</label>
        <textarea id="man-pub-desc" rows="3" style="width:100%;background:#0f0f1a;border:1px solid #2e2e45;border-radius:6px;color:#ede9fe;font-size:12px;padding:7px 10px;margin-bottom:10px;font-family:inherit;resize:vertical;box-sizing:border-box" placeholder="¿Qué aprende quien compra este manual?">${_esc(manual.descripcion||'')}</textarea>
        <label style="font-size:11px;color:#9490b0;display:block;margin-bottom:4px">Precio (USD)</label>
        <input id="man-pub-precio" type="number" min="0" step="0.50" value="${manual.precio||4.99}" style="width:100%;background:#0f0f1a;border:1px solid #2e2e45;border-radius:6px;color:#ede9fe;font-size:12px;padding:7px 10px;margin-bottom:16px;font-family:inherit;box-sizing:border-box">
        <div style="display:flex;gap:8px">
          <button onclick="document.getElementById('man-pub-dialog').remove()" style="flex:1;padding:9px;background:transparent;border:1px solid #2e2e45;border-radius:8px;color:#9490b0;font-size:12px;cursor:pointer;font-family:inherit">Cancelar</button>
          <button id="man-pub-confirm" style="flex:1;padding:9px;background:#059669;border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">✓ Publicar</button>
        </div>
      </div>
    `;
    document.body.appendChild(d);
    document.getElementById('man-pub-confirm').onclick = async () => {
      const btn = document.getElementById('man-pub-confirm');
      btn.disabled = true; btn.textContent = 'Publicando...';
      try {
        await PAT.Manuals.publicarEnTienda(manualId, {
          titulo:      document.getElementById('man-pub-titulo').value.trim(),
          descripcion: document.getElementById('man-pub-desc').value.trim(),
          precio:      parseFloat(document.getElementById('man-pub-precio').value) || 0,
        });
        d.remove();
        openEditor(manualId);
        _toast('Manual publicado en la tienda ✓');
      } catch (e) {
        btn.disabled = false; btn.textContent = '✓ Publicar';
        alert('Error: ' + e.message);
      }
    };
  }

  async function _despublicar(manualId, btn) {
    if (!confirm('¿Retirar este manual de la tienda?')) return;
    btn.disabled = true;
    await PAT.Manuals.despublicar(manualId);
    openEditor(manualId);
    _toast('Manual retirado de la tienda');
  }

  // ══════════════════════════════════════════════════════════════
  // EXPORTAR PDF
  // ══════════════════════════════════════════════════════════════

  async function exportarPDF(manualId) {
    const manual = await PAT.Manuals.obtenerManual(manualId);
    if (!manual) return;
    const pasos = manual.pasos || [];

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${_esc(manual.titulo || 'Manual')}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a2e; margin: 0; }
  h1 { font-size: 22px; font-weight: 900; margin: 0 0 4px; color: #4c1d95; }
  .sub { font-size: 11px; color: #6b7280; margin-bottom: 24px; }
  .paso { display: grid; grid-template-columns: 240px 1fr; gap: 16px; margin-bottom: 24px;
          border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; break-inside: avoid; }
  .paso-img { background: #fff; display: flex; align-items: center; justify-content: center; padding: 10px; }
  .paso-img svg { max-width: 220px; max-height: 180px; }
  .paso-txt { padding: 14px 14px 14px 4px; display: flex; flex-direction: column; gap: 6px; }
  .paso-num { font-size: 10px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: .8px; }
  .paso-desc { font-size: 12px; color: #374151; line-height: 1.6; white-space: pre-wrap; }
  .paso-auto { font-size: 10px; color: #9ca3af; font-family: monospace; white-space: pre-wrap;
               background: #f9fafb; padding: 5px 7px; border-radius: 4px; margin-top: 4px; }
  .footer { margin-top: 30px; font-size: 9px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<h1>${_esc(manual.titulo || 'Manual de trazado')}</h1>
<div class="sub">${_esc(manual.prendaNombre || '')} &bull; ${pasos.length} paso${pasos.length !== 1 ? 's' : ''} &bull; PatrónAI Pro</div>
${pasos.map((p, i) => `
<div class="paso">
  <div class="paso-img">${p.svg || ''}</div>
  <div class="paso-txt">
    <div class="paso-num">Paso ${i + 1}</div>
    <div class="paso-desc">${_esc(p.descripcion || p.autoDesc || '')}</div>
    ${p.autoDesc && p.descripcion && p.autoDesc !== p.descripcion
      ? `<div class="paso-auto">${_esc(p.autoDesc)}</div>` : ''}
  </div>
</div>`).join('')}
<div class="footer">Generado con PatrónAI Pro · patronai.app</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }

  // ── utils ──────────────────────────────────────────────────────
  function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function _toast(msg) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:#7c3aed;color:#fff;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:700;font-family:inherit;box-shadow:0 6px 20px rgba(0,0,0,.5)';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  return {
    initCapturePanel, showCapture, hideCapture,
    registrarCaptura, openLibrary, openEditor,
    selectManual, _confirmDelete, _deletePaso, _movePaso,
    _saveDesc, exportarPDF,
  };

})();
