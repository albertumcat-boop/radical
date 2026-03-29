/**
 * app.js v3.0 — Versión limpia con monetización y botones funcionando.
 */

'use strict';
window.PAT = window.PAT || {};

PAT.App = (function () {

  // ─── Estado ───────────────────────────────────────────────────────
  let state = {
    garment:     'franela',
    shirtGender: 'dama',
    measures:    { ...PAT.DEFAULT_MEASURES },
    params: {
      seam:  PAT.DEFAULTS.seam,
      ease:  PAT.DEFAULTS.ease,
      paper: PAT.DEFAULTS.paper,
    },
    zoom:       1.0,
    panX:       0,
    panY:       0,
    view:       'pattern',
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  };

  const dom = {};
  let _genTimer = null;

  function scheduleGenerate(delay = 150) {
    clearTimeout(_genTimer);
    _genTimer = setTimeout(generateAndRender, delay);
  }

  // ─── INIT ─────────────────────────────────────────────────────────
  function init() {
    cacheDOM();

    // Inicializar módulos de monetización
    if (PAT.AuthTier)    PAT.AuthTier.init();
    if (PAT.Affiliate)   PAT.Affiliate.init();
    if (PAT.AtelierPanel) PAT.AtelierPanel.init();

    // Motores
    initPatternEngine();

    // Eventos
    bindGarmentButtons();
    bindMeasureInputs();
    bindParamInputs();
    bindViewTabs();
    bindZoomControls();
    bindPanControls();
    bindModalControls();
    bindMonetizationEvents();

    // Inyectar UI extra de monetización en el sidebar
    injectMonetizationUI();

    // UI inicial
    showHideConditionalInputs();
    if (PAT.AuthTier) updateTierUI();

    // Renderizar
    generateAndRender();

    // Ajustar zoom al tamaño de pantalla después de renderizar
    setTimeout(fitToScreen, 300);

    console.log('[PatrónAI] App v3.0 lista ✓');
  }

  function cacheDOM() {
    dom.svg             = document.getElementById('pattern-svg');
    dom.svgWrapper      = document.getElementById('svg-wrapper');
    dom.svgPanContainer = document.getElementById('svg-pan-container');
    dom.threeCanvas     = document.getElementById('three-canvas');
    dom.patternInfo     = document.getElementById('pattern-info');
    dom.pieceCount      = document.getElementById('piece-count');
    dom.zoomLabel       = document.getElementById('zoom-label');
    dom.modalSave       = document.getElementById('modal-save');
    dom.modalLoad       = document.getElementById('modal-load');
    dom.saveNameInput   = document.getElementById('save-name');
    dom.patternsList    = document.getElementById('saved-patterns-list');
    dom.sidebar         = document.getElementById('sidebar');
    dom.mannequinReady  = false;
  }

  // ─── BOTONES DE PRENDA ────────────────────────────────────────────
  // Separado y simple — sin clonar nada
  function bindGarmentButtons() {
    document.querySelectorAll('.garment-btn').forEach(btn => {
      btn.addEventListener('click', onGarmentClick);
    });
  }

  function onGarmentClick(e) {
    const btn     = e.currentTarget;
    const garment = btn.dataset.garment;

    // Verificar tier
    if (PAT.AuthTier && !PAT.AuthTier.canUseGarment(garment)) {
      PAT.PaymentUI.showUpgradeModal();
      return;
    }

    // Cambiar estado activo visualmente
    document.querySelectorAll('.garment-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Actualizar estado
    state.garment = garment;
    showHideConditionalInputs();
    updateTopBarInfo();
    scheduleGenerate(80);
  }

  // ─── INPUTS DE MEDIDAS ────────────────────────────────────────────
  function bindMeasureInputs() {
    document.querySelectorAll('input[data-measure]').forEach(input => {
      input.addEventListener('input', () => {
        const key = input.dataset.measure;
        const val = parseFloat(input.value);
        if (!isNaN(val) && val > 0) {
          state.measures[key] = val;
          scheduleGenerate();
        }
      });
    });
  }

  // ─── PARÁMETROS ───────────────────────────────────────────────────
  function bindParamInputs() {
    document.querySelectorAll('input[data-param], select[data-param]').forEach(el => {
      el.addEventListener('input', () => {
        const key = el.dataset.param;
        const val = el.tagName === 'SELECT' ? el.value : parseFloat(el.value);
        if ((key === 'seam' || key === 'ease') && (isNaN(val) || val <= 0)) return;

        // Verificar si el tier permite cambiar el margen
        if (key === 'seam' && PAT.AuthTier && !PAT.AuthTier.hasCustomSeam()) {
          toast('🔒 Ajuste de margen disponible en Plan Pro', 'warning');
          el.value = state.params.seam;
          return;
        }

        state.params[key] = val;
        scheduleGenerate();
      });
    });

    // Radio de género de camisa
    document.querySelectorAll('input[name="shirt-gender"]').forEach(radio => {
      radio.addEventListener('change', () => {
        state.shirtGender = radio.value;
        scheduleGenerate(80);
      });
    });
  }

  // ─── TABS DE VISTA ────────────────────────────────────────────────
  function bindViewTabs() {
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => switchView(tab.dataset.view));
    });
  }

  // ─── ZOOM ─────────────────────────────────────────────────────────
  function bindZoomControls() {
    document.getElementById('zoom-in') ?.addEventListener('click', () => applyZoom(state.zoom * 1.25));
    document.getElementById('zoom-out')?.addEventListener('click', () => applyZoom(state.zoom * 0.8));
    document.getElementById('zoom-fit')?.addEventListener('click', fitToScreen);

    dom.svgWrapper?.addEventListener('wheel', (e) => {
      e.preventDefault();
      applyZoom(state.zoom * (e.deltaY < 0 ? 1.12 : 0.9));
    }, { passive: false });
  }

  // ─── PAN ──────────────────────────────────────────────────────────
  function bindPanControls() {
    if (!dom.svgWrapper) return;

    dom.svgWrapper.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      state.isDragging = true;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
    });
    window.addEventListener('mousemove', (e) => {
      if (!state.isDragging) return;
      state.panX += e.clientX - state.lastMouseX;
      state.panY += e.clientY - state.lastMouseY;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
      applyTransform();
    });
    window.addEventListener('mouseup', () => { state.isDragging = false; });

    // Touch
    let tx = 0, ty = 0, td = 0;
    dom.svgWrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        tx = e.touches[0].clientX;
        ty = e.touches[0].clientY;
        state.isDragging = true;
      } else if (e.touches.length === 2) {
        td = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    }, { passive: true });
    dom.svgWrapper.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && state.isDragging) {
        state.panX += e.touches[0].clientX - tx;
        state.panY += e.touches[0].clientY - ty;
        tx = e.touches[0].clientX;
        ty = e.touches[0].clientY;
        applyTransform();
      } else if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        applyZoom(state.zoom * (d / td));
        td = d;
      }
    }, { passive: true });
    dom.svgWrapper.addEventListener('touchend', () => { state.isDragging = false; });
  }

  // ─── MODALES ──────────────────────────────────────────────────────
  function bindModalControls() {
    // Sidebar toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      dom.sidebar?.classList.toggle('collapsed');
      const btn = document.getElementById('sidebar-toggle');
      if (btn) btn.textContent = dom.sidebar?.classList.contains('collapsed') ? '›' : '‹';
    });

    // Guardar
    document.getElementById('btn-save')?.addEventListener('click', () => {
      if (dom.saveNameInput) {
        dom.saveNameInput.value = `${state.garment} busto ${state.measures.bust}cm`;
      }
      if (dom.modalSave) dom.modalSave.style.display = 'flex';
    });
    document.getElementById('confirm-save')?.addEventListener('click', async () => {
      const name = dom.saveNameInput?.value.trim() || 'Patrón sin nombre';
      try {
        await PAT.Firebase.savePattern(name, {
          garment: state.garment, measures: state.measures, params: state.params,
        });
        if (dom.modalSave) dom.modalSave.style.display = 'none';
        toast(`✅ "${name}" guardado`, 'success');
      } catch (e) { toast('Error al guardar', 'error'); }
    });
    document.getElementById('cancel-save')?.addEventListener('click', () => {
      if (dom.modalSave) dom.modalSave.style.display = 'none';
    });

    // Cargar
    document.getElementById('btn-load')?.addEventListener('click', async () => {
      if (dom.patternsList) dom.patternsList.innerHTML = '<p style="color:#64748b;padding:12px;text-align:center">Cargando…</p>';
      if (dom.modalLoad) dom.modalLoad.style.display = 'flex';
      try {
        const patterns = await PAT.Firebase.loadPatterns();
        renderPatternsList(patterns);
      } catch (e) {
        if (dom.patternsList) dom.patternsList.innerHTML = '<p style="color:#f87171;padding:12px">Error al cargar</p>';
      }
    });
    document.getElementById('cancel-load')?.addEventListener('click', () => {
      if (dom.modalLoad) dom.modalLoad.style.display = 'none';
    });

    // Cerrar modales al click en backdrop
    document.querySelectorAll('.modal-backdrop').forEach(b => {
      b.addEventListener('click', () => {
        if (dom.modalSave) dom.modalSave.style.display = 'none';
        if (dom.modalLoad) dom.modalLoad.style.display = 'none';
      });
    });

    // Controles 3D
    document.getElementById('btn-3d-reset')    ?.addEventListener('click', () => PAT.Mannequin3D?.resetCamera());
    document.getElementById('btn-3d-wireframe')?.addEventListener('click', () => PAT.Mannequin3D?.toggleWireframe());

    // PDF
    document.getElementById('btn-export-pdf')?.addEventListener('click', handlePDFExport);
  }

  // ─── MONETIZACIÓN ────────────────────────────────────────────────
  function bindMonetizationEvents() {
    // Código de afiliado
    document.addEventListener('click', (e) => {
      if (e.target?.id !== 'sidebar-apply-code') return;
      const input = document.getElementById('sidebar-affiliate-input');
      const msg   = document.getElementById('sidebar-affiliate-msg');
      if (!input || !PAT.Affiliate) return;

      PAT.Affiliate.applyCode(input.value.trim().toUpperCase()).then(result => {
        if (msg) {
          msg.textContent = result.message;
          msg.style.color = result.valid ? 'var(--green)' : 'var(--red)';
        }
        if (result.valid) toast(`🏷️ ${result.discount}% OFF activo`, 'success');
      });
    });

    // Panel Atelier
    document.addEventListener('click', (e) => {
      if (e.target?.closest?.('#btn-atelier-panel')) {
        PAT.AtelierPanel?.openPanel();
      }
    });

    // Cambio de tier
    document.addEventListener('pat:tierChanged', () => {
      updateTierUI();
      generateAndRender();
    });

    // Cargar medidas de cliente
    document.addEventListener('pat:loadClientMeasures', (e) => {
      const { measures, clientName } = e.detail || {};
      if (!measures) return;
      state.measures = { ...state.measures, ...measures };
      document.querySelectorAll('input[data-measure]').forEach(input => {
        const key = input.dataset.measure;
        if (state.measures[key] !== undefined) input.value = state.measures[key];
      });
      generateAndRender();
      toast(`↩ Medidas de "${clientName}" aplicadas`, 'success');
    });
  }

  // ─── UI DE MONETIZACIÓN EN SIDEBAR ───────────────────────────────
  function injectMonetizationUI() {
    const actionsSection = document.querySelector('.actions-section');
    if (!actionsSection || document.getElementById('affiliate-code-row')) return;

    // Campo de código
    const affiliateRow = document.createElement('div');
    affiliateRow.id = 'affiliate-code-row';
    affiliateRow.style.cssText = 'margin-bottom:8px';
    affiliateRow.innerHTML = `
      <div class="section-title" style="margin-bottom:8px">
        Código Atelier
        <span class="unit-badge">% OFF</span>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:4px">
        <input type="text" id="sidebar-affiliate-input"
               placeholder="Ej: ATELIER10" autocomplete="off"
               style="flex:1;background:var(--bg-input);border:1.5px solid var(--border);
                      color:var(--text-primary);border-radius:var(--radius-sm);
                      padding:6px 10px;font-size:11px;font-family:var(--font-mono);
                      text-transform:uppercase;outline:none;transition:border-color .18s" />
        <button id="sidebar-apply-code" class="icon-btn"
                style="padding:6px 12px;font-weight:700;font-size:12px">✓</button>
      </div>
      <div id="sidebar-affiliate-msg"
           style="font-size:10px;min-height:14px;color:var(--text-dim)"></div>
    `;
    actionsSection.insertBefore(affiliateRow, actionsSection.firstChild);

    // Botón Panel Atelier
    if (!document.getElementById('btn-atelier-panel')) {
      const atelierBtn = document.createElement('button');
      atelierBtn.id        = 'btn-atelier-panel';
      atelierBtn.className = 'action-btn ghost';
      atelierBtn.style.cssText = 'position:relative;margin-top:4px';
      atelierBtn.innerHTML = `<span class="expert-badge">EXPERT</span>👑 Panel de Atelier`;
      actionsSection.appendChild(atelierBtn);
    }

    // Restaurar código guardado
    const savedCode = PAT.Affiliate?.getActiveCode?.();
    if (savedCode) {
      const input = document.getElementById('sidebar-affiliate-input');
      const msg   = document.getElementById('sidebar-affiliate-msg');
      const aff   = PAT.Affiliate?.getActiveAffiliate?.();
      if (input) input.value = savedCode;
      if (msg && aff) {
        msg.textContent = `✅ ${aff.discount}% OFF — ${aff.atelierName}`;
        msg.style.color = 'var(--green)';
      }
    }
  }

  // ─── EXPORTAR PDF ─────────────────────────────────────────────────
  function handlePDFExport() {
    const garment   = state.garment;
    const canExport = PAT.AuthTier ? PAT.AuthTier.canExportPDF(garment) : true;

    if (!canExport) {
      PAT.PaymentUI?.showPatternPaywall(garment, () => _doExportPDF());
      return;
    }
    _doExportPDF();
  }

  function _doExportPDF() {
    const data = PAT.PatternEngine.getCurrentData();
    if (!data) { toast('Genera un patrón primero', 'error'); return; }

    const hasWatermark = PAT.AuthTier ? PAT.AuthTier.needsWatermark() : false;
    toast(`⏳ Generando PDF${hasWatermark ? ' (DEMO)' : ''}…`);

    setTimeout(() => {
      PAT.PDFExport.exportTiledPDF(data, {
        paper:       state.params.paper,
        patternName: `${state.garment}_busto${state.measures.bust}`,
      });
    }, 120);
  }

  // ─── ACTUALIZAR UI SEGÚN TIER ─────────────────────────────────────
  function updateTierUI() {
    if (!PAT.AuthTier) return;
    const tier = PAT.AuthTier.getTier();

    // Marcar botones bloqueados
    document.querySelectorAll('.garment-btn').forEach(btn => {
      const allowed = PAT.AuthTier.canUseGarment(btn.dataset.garment);
      btn.classList.toggle('locked', !allowed);
    });

    // Input de margen
    const seamInput = document.getElementById('p-seam');
    if (seamInput) {
      const row = seamInput.closest('.input-row');
      if (row) row.style.opacity = tier.customSeam ? '1' : '0.4';
      seamInput.title = tier.customSeam ? '' : '🔒 Disponible en Plan Pro';
    }

    // Botón Atelier
    const atelierBtn = document.getElementById('btn-atelier-panel');
    if (atelierBtn) {
      atelierBtn.style.opacity = tier.atelierPanel ? '1' : '0.5';
      atelierBtn.title = tier.atelierPanel ? '' : '🔒 Disponible en Plan Expert';
    }

    // Si la prenda activa ya no está permitida
    if (!PAT.AuthTier.canUseGarment(state.garment)) {
      const firstAllowed = tier.allowedGarments[0] || 'franela';
      state.garment = firstAllowed;
      document.querySelectorAll('.garment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.garment === firstAllowed);
      });
      showHideConditionalInputs();
    }

    updateTopBarInfo();
  }

  // ─── MOTOR DE PATRONES ────────────────────────────────────────────
  function initPatternEngine() {
    const svgEl = document.getElementById('pattern-svg');
    if (svgEl) PAT.PatternEngine.init(svgEl);
  }

  function generateAndRender() {
    // Guardia de tier
    if (PAT.AuthTier && !PAT.AuthTier.canUseGarment(state.garment)) {
      const tier = PAT.AuthTier.getTier();
      state.garment = tier.allowedGarments[0] || 'franela';
    }

    try {
      PAT.PatternEngine.generate(state.garment, state.measures, {
        seam:        state.params.seam,
        ease:        state.params.ease,
        shirtGender: state.shirtGender,
      });
    } catch (err) {
      console.error('[App] Error generando patrón:', err);
      toast('Error al generar el patrón', 'error');
      return;
    }

    updateTopBarInfo();

    if (state.view === 'viewer3d' && dom.mannequinReady) {
      PAT.Mannequin3D?.updateGarment(state.garment, state.measures, state.params);
    }
  }

  // ─── TOPBAR ───────────────────────────────────────────────────────
  function updateTopBarInfo() {
    const names = {
      franela: 'Franela Básica', blusa: 'Blusa con Pinzas',
      camisa:  `Camisa ${state.shirtGender === 'dama' ? 'Dama' : 'Caballero'}`,
      falda:   'Falda Recta', vestido: 'Vestido Básico',
    };
    const counts = { franela: 3, blusa: 3, camisa: 7, falda: 3, vestido: 2 };
    const demoBadge = (PAT.AuthTier?.needsWatermark?.())
      ? ' <span style="background:rgba(248,113,113,0.15);color:#f87171;padding:1px 7px;border-radius:10px;font-size:10px;border:1px solid rgba(248,113,113,0.3)">DEMO</span>'
      : '';

    if (dom.patternInfo) {
      dom.patternInfo.innerHTML = `${names[state.garment] || state.garment} · ${state.measures.bust}cm${demoBadge}`;
    }
    if (dom.pieceCount) {
      dom.pieceCount.textContent = `${counts[state.garment] || '?'} piezas`;
    }
  }

  // ─── ZOOM Y PAN ───────────────────────────────────────────────────
  function applyZoom(newZoom) {
    state.zoom = Math.max(0.04, Math.min(6, newZoom));
    applyTransform();
    if (dom.zoomLabel) dom.zoomLabel.textContent = Math.round(state.zoom * 100) + '%';
  }

  function applyTransform() {
    if (dom.svgPanContainer) {
      dom.svgPanContainer.style.transform =
        `translate(${Math.round(state.panX)}px, ${Math.round(state.panY)}px) scale(${state.zoom})`;
    }
  }

  function fitToScreen() {
    if (!dom.svgWrapper || !dom.svg) return;
    const rect = dom.svgWrapper.getBoundingClientRect();
    const vb   = dom.svg.getAttribute('viewBox');
    if (!vb) return;

    const [, , vbW, vbH] = vb.split(' ').map(Number);
    const MM_TO_PX = 3.78;
    const svgPxW   = vbW * MM_TO_PX;
    const svgPxH   = vbH * MM_TO_PX;

    const scaleX = (rect.width  - 80) / svgPxW;
    const scaleY = (rect.height - 80) / svgPxH;
    state.zoom   = Math.max(0.04, Math.min(scaleX, scaleY, 2));
    state.panX   = (rect.width  - svgPxW * state.zoom) / 2;
    state.panY   = 40;

    applyTransform();
    if (dom.zoomLabel) dom.zoomLabel.textContent = Math.round(state.zoom * 100) + '%';
  }

  // ─── CAMBIO DE VISTA ──────────────────────────────────────────────
  function switchView(viewName) {
    state.view = viewName;

    document.querySelectorAll('.view-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === viewName);
    });

    const viewPattern  = document.getElementById('view-pattern');
    const viewViewer3D = document.getElementById('view-viewer3d');

    if (viewName === 'pattern') {
      if (viewPattern)  viewPattern.style.display  = '';
      if (viewViewer3D) viewViewer3D.style.display = 'none';
    } else {
      if (viewPattern)  viewPattern.style.display  = 'none';
      if (viewViewer3D) viewViewer3D.style.display = '';

      if (!dom.mannequinReady) {
        const canvas = document.getElementById('three-canvas');
        if (canvas && PAT.Mannequin3D) {
          PAT.Mannequin3D.init(canvas);
          dom.mannequinReady = true;
        }
      }
      PAT.Mannequin3D?.updateGarment(state.garment, state.measures, state.params);
    }
  }

  // ─── INPUTS CONDICIONALES ─────────────────────────────────────────
  function showHideConditionalInputs() {
    const g = state.garment;
    const show = (id, visible) => {
      const el = document.getElementById(id);
      if (el) el.style.display = visible ? '' : 'none';
    };
    show('row-sleeve-length', ['franela', 'blusa', 'camisa'].includes(g));
    show('row-wrist',         ['camisa', 'blusa'].includes(g));
    show('row-skirt-length',  ['falda', 'vestido'].includes(g));
    show('shirt-options',     g === 'camisa');
  }

  // ─── LISTA DE PATRONES GUARDADOS ──────────────────────────────────
  function renderPatternsList(patterns) {
    if (!dom.patternsList) return;
    if (!patterns?.length) {
      dom.patternsList.innerHTML = '<p style="color:#5f5c78;padding:16px;text-align:center">No hay patrones guardados aún.</p>';
      return;
    }
    dom.patternsList.innerHTML = '';
    patterns.forEach(p => {
      const item = document.createElement('div');
      item.className = 'saved-pattern-item';
      const dateStr = p.createdAt
        ? (typeof p.createdAt.toDate === 'function'
            ? p.createdAt.toDate().toLocaleDateString('es')
            : new Date(p.createdAt).toLocaleDateString('es'))
        : '—';
      item.innerHTML = `
        <div>
          <div class="pattern-name">${p.name || 'Sin nombre'}</div>
          <div class="pattern-meta">${p.garment || '?'} · Busto ${p.measures?.bust || '?'}cm · ${dateStr}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="icon-btn load-btn" title="Cargar">↩</button>
          <button class="icon-btn del-btn" title="Eliminar" style="color:var(--red)">✕</button>
        </div>`;
      item.querySelector('.load-btn').addEventListener('click', (e) => { e.stopPropagation(); loadPattern(p); });
      item.querySelector('.del-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`¿Eliminar "${p.name}"?`)) return;
        await PAT.Firebase.deletePattern(p.id);
        toast(`"${p.name}" eliminado`, 'success');
        item.remove();
      });
      dom.patternsList.appendChild(item);
    });
  }

  function loadPattern(p) {
    if (p.garment)  state.garment  = p.garment;
    if (p.measures) state.measures = { ...PAT.DEFAULT_MEASURES, ...p.measures };
    if (p.params)   state.params   = { ...PAT.DEFAULTS,         ...p.params   };

    if (PAT.AuthTier && !PAT.AuthTier.canUseGarment(state.garment)) {
      toast(`Plan actual no incluye "${state.garment}"`, 'error');
      state.garment = PAT.AuthTier.getTier().allowedGarments[0];
    }

    document.querySelectorAll('input[data-measure]').forEach(i => {
      if (state.measures[i.dataset.measure] !== undefined) i.value = state.measures[i.dataset.measure];
    });
    document.querySelectorAll('input[data-param], select[data-param]').forEach(el => {
      if (state.params[el.dataset.param] !== undefined) el.value = state.params[el.dataset.param];
    });
    document.querySelectorAll('.garment-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.garment === state.garment);
    });

    showHideConditionalInputs();
    generateAndRender();
    if (dom.modalLoad) dom.modalLoad.style.display = 'none';
    toast(`✅ "${p.name}" cargado`, 'success');
  }

  // ─── TOAST ────────────────────────────────────────────────────────
  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span>${message}`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ─── ARRANQUE ─────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  return {
    toast, getState: () => ({ ...state }),
    fitToScreen, applyZoom, generateAndRender, updateTierUI,
  };

})();
