/**
 * app.js
 * Controlador principal de la aplicación.
 * Versión: 2.0 — incluye sistema de monetización completo.
 *
 * Módulos requeridos (en orden de carga):
 *  constants.js → auth-tier.js → affiliate.js → payment.js
 *  → atelier-panel.js → pattern-engine.js → pdf-export.js
 *  → mannequin-3d.js → firebase-config.js → app.js
 */

'use strict';
window.PAT = window.PAT || {};

PAT.App = (function () {

  // ─────────────────────────────────────────────────────────────────
  // ESTADO GLOBAL
  // ─────────────────────────────────────────────────────────────────
  let state = {
    garment:     PAT.DEFAULTS.garment,
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
    view:       'pattern',   // 'pattern' | 'viewer3d'
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  };

  // ─────────────────────────────────────────────────────────────────
  // REFERENCIAS DOM
  // ─────────────────────────────────────────────────────────────────
  const dom = {};

  // ─────────────────────────────────────────────────────────────────
  // DEBOUNCE
  // ─────────────────────────────────────────────────────────────────
  let _genDebounceTimer = null;
  function scheduleGenerate(delay = 120) {
    clearTimeout(_genDebounceTimer);
    _genDebounceTimer = setTimeout(generateAndRender, delay);
  }

  // ─────────────────────────────────────────────────────────────────
  // INIT — punto de entrada principal
  // ─────────────────────────────────────────────────────────────────
  function init() {
    cacheDOM();

    // 1. Monetización primero (necesita el DOM pero no el patrón)
    PAT.AuthTier.init();
    PAT.Affiliate.init();
    PAT.AtelierPanel.init();

    // 2. Motores
    initPatternEngine();
    initMannequin();

    // 3. Eventos UI base + monetización
    bindEvents();
    bindMonetizationEvents();

    // 4. Inyectar UI de monetización en el sidebar
    injectMonetizationUI();

    // 5. Ajustar visibilidad de inputs y reflejar tier
    showHideConditionalInputs();
    updateTierUI();

    // 6. Renderizado inicial
    generateAndRender();

    // 7. Ajustar zoom al tamaño de pantalla
    setTimeout(fitToScreen, 200);

    console.log('[PatrónAI] App v2.0 inicializada ✓');
  }

  // ─────────────────────────────────────────────────────────────────
  // CACHE DOM
  // ─────────────────────────────────────────────────────────────────
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
    dom.shirtOptions    = document.getElementById('shirt-options');
    dom.sidebar         = document.getElementById('sidebar');
    dom._mannequinReady = false;
  }

  // ─────────────────────────────────────────────────────────────────
  // EVENTOS BASE (sin monetización)
  // ─────────────────────────────────────────────────────────────────
  function bindEvents() {

    // ── Tipo de prenda ──────────────────────────────────────────
    // NOTA: los listeners de garment-btn se gestionan en updateTierUI()
    // para poder aplicar el bloqueo de tier dinámicamente.
    // Aquí solo registramos el listener inicial.
    _bindGarmentButtons();

    // ── Género de camisa ────────────────────────────────────────
    document.querySelectorAll('input[name="shirt-gender"]').forEach(radio => {
      radio.addEventListener('change', () => {
        state.shirtGender = radio.value;
        scheduleGenerate(80);
      });
    });

    // ── Medidas ─────────────────────────────────────────────────
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

    // ── Parámetros de costura ───────────────────────────────────
    document.querySelectorAll('input[data-param], select[data-param]').forEach(el => {
      el.addEventListener('input', () => {
        const key = el.dataset.param;
        const val = el.tagName === 'SELECT' ? el.value : parseFloat(el.value);
        if (key === 'seam' || key === 'ease') {
          if (!isNaN(val) && val > 0) state.params[key] = val;
        } else {
          state.params[key] = val;
        }
        scheduleGenerate();
      });
    });

    // ── Tabs de vista ───────────────────────────────────────────
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // ── Zoom ────────────────────────────────────────────────────
    document.getElementById('zoom-in') .addEventListener('click', () => applyZoom(state.zoom * 1.25));
    document.getElementById('zoom-out').addEventListener('click', () => applyZoom(state.zoom * 0.8));
    document.getElementById('zoom-fit').addEventListener('click', fitToScreen);

    dom.svgWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      applyZoom(state.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
    }, { passive: false });

    // ── Pan con ratón ───────────────────────────────────────────
    dom.svgWrapper.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      state.isDragging = true;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
      dom.svgWrapper.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      if (!state.isDragging) return;
      state.panX += e.clientX - state.lastMouseX;
      state.panY += e.clientY - state.lastMouseY;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
      applyTransform();
    });
    window.addEventListener('mouseup', () => {
      state.isDragging = false;
      dom.svgWrapper.style.cursor = 'grab';
    });

    // ── Pan / pinch táctil ──────────────────────────────────────
    let lastTouchX = 0, lastTouchY = 0, lastTouchDist = 0;
    dom.svgWrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        state.isDragging = true;
      } else if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });
    dom.svgWrapper.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && state.isDragging) {
        state.panX += e.touches[0].clientX - lastTouchX;
        state.panY += e.touches[0].clientY - lastTouchY;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        applyTransform();
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        applyZoom(state.zoom * (dist / lastTouchDist));
        lastTouchDist = dist;
      }
    }, { passive: true });
    dom.svgWrapper.addEventListener('touchend', () => { state.isDragging = false; });

    // ── Guardar patrón (Firebase) ───────────────────────────────
    document.getElementById('btn-save').addEventListener('click', () => {
      dom.saveNameInput.value = `${state.garment} busto ${state.measures.bust}cm`;
      dom.modalSave.style.display = 'flex';
    });
    document.getElementById('confirm-save').addEventListener('click', async () => {
      const name = dom.saveNameInput.value.trim() || 'Patrón sin nombre';
      // Verificar límite de patrones según tier
      const maxPatterns = PAT.AuthTier.getTier().maxSavedPatterns;
      try {
        await PAT.Firebase.savePattern(name, {
          garment:  state.garment,
          measures: state.measures,
          params:   state.params,
        });
        dom.modalSave.style.display = 'none';
        toast(`✅ "${name}" guardado`, 'success');
      } catch (e) {
        toast('Error al guardar', 'error');
      }
    });
    document.getElementById('cancel-save').addEventListener('click', () => {
      dom.modalSave.style.display = 'none';
    });

    // ── Cargar patrón (Firebase) ────────────────────────────────
    document.getElementById('btn-load').addEventListener('click', async () => {
      dom.patternsList.innerHTML = '<p style="color:#64748b;padding:8px">Cargando…</p>';
      dom.modalLoad.style.display = 'flex';
      try {
        const patterns = await PAT.Firebase.loadPatterns();
        renderPatternsList(patterns);
      } catch (e) {
        dom.patternsList.innerHTML = '<p style="color:#ef4444;padding:8px">Error al cargar</p>';
      }
    });
    document.getElementById('cancel-load').addEventListener('click', () => {
      dom.modalLoad.style.display = 'none';
    });

    // Cerrar modales al hacer click en el backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', () => {
        dom.modalSave.style.display = 'none';
        dom.modalLoad.style.display = 'none';
      });
    });

    // ── Sidebar toggle ──────────────────────────────────────────
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      dom.sidebar.classList.toggle('collapsed');
      document.getElementById('sidebar-toggle').textContent =
        dom.sidebar.classList.contains('collapsed') ? '›' : '‹';
    });

    // ── Controles 3D ────────────────────────────────────────────
    const btn3DReset = document.getElementById('btn-3d-reset');
    const btn3DWire  = document.getElementById('btn-3d-wireframe');
    if (btn3DReset) btn3DReset.addEventListener('click', () => PAT.Mannequin3D.resetCamera());
    if (btn3DWire)  btn3DWire.addEventListener('click',  () => PAT.Mannequin3D.toggleWireframe());
  }

  // ─────────────────────────────────────────────────────────────────
  // BOTONES DE PRENDA (separado para poder re-bindear tras cambio de tier)
  // ─────────────────────────────────────────────────────────────────
  function _bindGarmentButtons() {
    document.querySelectorAll('.garment-btn').forEach(btn => {
      // Clonar para eliminar listeners anteriores
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', () => {
        const garment = newBtn.dataset.garment;

        // Verificar si el tier permite esta prenda
        if (!PAT.AuthTier.canUseGarment(garment)) {
          PAT.PaymentUI.showUpgradeModal();
          return;
        }

        document.querySelectorAll('.garment-btn').forEach(b => b.classList.remove('active'));
        newBtn.classList.add('active');
        state.garment = garment;
        showHideConditionalInputs();
        scheduleGenerate(80);
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // EVENTOS DE MONETIZACIÓN
  // ─────────────────────────────────────────────────────────────────
  function bindMonetizationEvents() {

    // ── Botón PDF — reemplazado con lógica de paywall ───────────
    const pdfBtn = document.getElementById('btn-export-pdf');
    if (pdfBtn) {
      const newPdfBtn = pdfBtn.cloneNode(true);
      pdfBtn.parentNode.replaceChild(newPdfBtn, pdfBtn);
      newPdfBtn.addEventListener('click', handlePDFExport);
    }

    // ── Código de afiliado (delegación de eventos) ──────────────
    document.addEventListener('click', (e) => {
      if (e.target.id !== 'sidebar-apply-code') return;
      const input = document.getElementById('sidebar-affiliate-input');
      const msg   = document.getElementById('sidebar-affiliate-msg');
      if (!input) return;
      const code = input.value.trim().toUpperCase();

      PAT.Affiliate.applyCode(code).then(result => {
        if (msg) {
          msg.textContent = result.message;
          msg.style.color = result.valid ? 'var(--green)' : 'var(--red)';
        }
        if (result.valid) {
          toast(`🏷️ Código ${code} activo — ${result.discount}% OFF`, 'success');
        }
      });
    });

    // ── Panel de Atelier ────────────────────────────────────────
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-atelier-panel')) {
        PAT.AtelierPanel.openPanel();
      }
    });

    // ── Cambio de tier → re-renderizar toda la UI ───────────────
    document.addEventListener('pat:tierChanged', (e) => {
      const { tier } = e.detail;
      updateTierUI();
      generateAndRender();
      console.log(`[App] Tier cambiado a: ${tier}`);
    });

    // ── Cargar medidas de cliente desde Panel Atelier ───────────
    document.addEventListener('pat:loadClientMeasures', (e) => {
      const { measures, clientName } = e.detail;
      if (!measures) return;

      state.measures = { ...state.measures, ...measures };

      // Actualizar todos los inputs del sidebar
      document.querySelectorAll('input[data-measure]').forEach(input => {
        const key = input.dataset.measure;
        if (state.measures[key] !== undefined) {
          input.value = state.measures[key];
        }
      });

      generateAndRender();
      toast(`↩ Medidas de "${clientName}" aplicadas`, 'success');
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // INYECTAR UI DE MONETIZACIÓN EN EL SIDEBAR
  // ─────────────────────────────────────────────────────────────────
  function injectMonetizationUI() {
    const actionsSection = document.querySelector('.actions-section');
    if (!actionsSection) return;

    // ── Campo de código de atelier ─────────────────────────────
    if (!document.getElementById('affiliate-code-row')) {
      const affiliateRow = document.createElement('div');
      affiliateRow.id = 'affiliate-code-row';
      affiliateRow.innerHTML = `
        <div class="section-title" style="margin-top:10px">
          Código Atelier
          <span class="unit-badge">%OFF</span>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:4px">
          <input
            type="text"
            id="sidebar-affiliate-input"
            placeholder="Ej: ATELIER10"
            autocomplete="off"
            spellcheck="false"
            style="
              flex:1;
              background:var(--bg-input);
              border:1px solid var(--border);
              color:var(--text-primary);
              border-radius:var(--radius);
              padding:5px 8px;
              font-size:11px;
              font-family:var(--font-mono);
              text-transform:uppercase;
              outline:none;
            "
          />
          <button
            id="sidebar-apply-code"
            class="icon-btn"
            title="Aplicar código"
            style="padding:5px 10px;font-size:12px;font-weight:700"
          >✓</button>
        </div>
        <div
          id="sidebar-affiliate-msg"
          style="font-size:10px;min-height:14px;color:var(--text-dim);margin-bottom:6px"
        ></div>
      `;
      actionsSection.insertBefore(affiliateRow, actionsSection.firstChild);
    }

    // ── Botón Panel Atelier ─────────────────────────────────────
    if (!document.getElementById('btn-atelier-panel')) {
      const atelierBtn = document.createElement('button');
      atelierBtn.id        = 'btn-atelier-panel';
      atelierBtn.className = 'action-btn ghost';
      atelierBtn.style.position = 'relative';
      atelierBtn.innerHTML = `
        <span class="expert-badge">EXPERT</span>
        👑 Panel de Atelier
      `;
      actionsSection.appendChild(atelierBtn);
    }

    // Si hay un código de afiliado guardado, mostrarlo
    const savedCode = PAT.Affiliate.getActiveCode();
    if (savedCode) {
      const input = document.getElementById('sidebar-affiliate-input');
      const msg   = document.getElementById('sidebar-affiliate-msg');
      if (input) input.value = savedCode;
      if (msg) {
        const aff = PAT.Affiliate.getActiveAffiliate();
        msg.textContent = aff
          ? `✅ ${aff.discount}% OFF — ${aff.atelierName}`
          : `✅ Código ${savedCode} activo`;
        msg.style.color = 'var(--green)';
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // EXPORTACIÓN PDF CON VERIFICACIÓN DE TIER
  // ─────────────────────────────────────────────────────────────────
  function handlePDFExport() {
    const garment    = state.garment;
    const canExport  = PAT.AuthTier.canExportPDF(garment);

    if (!canExport) {
      // El usuario no tiene acceso gratuito a este PDF: mostrar paywall
      PAT.PaymentUI.showPatternPaywall(garment, () => {
        // Callback ejecutado tras pago exitoso
        _doExportPDF();
      });
      return;
    }

    // Tiene acceso (tier Pro/Expert o ya compró el patrón)
    _doExportPDF();
  }

  function _doExportPDF() {
    const data = PAT.PatternEngine.getCurrentData();
    if (!data) {
      toast('Genera un patrón primero', 'error');
      return;
    }

    const tierLabel = PAT.AuthTier.needsWatermark() ? ' (DEMO — con marca de agua)' : '';
    toast(`⏳ Generando PDF${tierLabel}…`);

    setTimeout(() => {
      PAT.PDFExport.exportTiledPDF(data, {
        paper:       state.params.paper,
        patternName: `${state.garment}_busto${state.measures.bust}`,
      });
    }, 120);
  }

  // ─────────────────────────────────────────────────────────────────
  // ACTUALIZAR UI SEGÚN EL TIER ACTIVO
  // ─────────────────────────────────────────────────────────────────
  function updateTierUI() {
    const tier   = PAT.AuthTier.getTier();
    const tierId = PAT.AuthTier.getTierId();

    // ── 1. Bloquear/desbloquear botones de prenda ───────────────
    _bindGarmentButtons();   // re-bindear con el check de tier actualizado

    document.querySelectorAll('.garment-btn').forEach(btn => {
      const allowed = PAT.AuthTier.canUseGarment(btn.dataset.garment);
      btn.classList.toggle('locked', !allowed);
    });

    // ── 2. Control de margen de costura (solo Pro/Expert) ────────
    const seamInput = document.getElementById('p-seam');
    if (seamInput) {
      const seamRow = seamInput.closest('.input-row');
      if (seamRow) {
        seamRow.style.opacity = tier.customSeam ? '1' : '0.45';
        seamRow.title = tier.customSeam
          ? ''
          : '🔒 Disponible en Plan Pro — ajuste de margen personalizado';
      }
      seamInput.disabled = !tier.customSeam;
    }

    // ── 3. Botón de Panel Atelier ─────────────────────────────
    const atelierBtn = document.getElementById('btn-atelier-panel');
    if (atelierBtn) {
      atelierBtn.style.opacity = tier.atelierPanel ? '1' : '0.55';
      atelierBtn.title = tier.atelierPanel
        ? 'Abrir Panel de Atelier'
        : '🔒 Disponible en Plan Expert';
    }

    // ── 4. Si la prenda activa ya no está permitida: downgrade ───
    if (!PAT.AuthTier.canUseGarment(state.garment)) {
      const firstAllowed = tier.allowedGarments[0] || 'franela';
      state.garment = firstAllowed;

      document.querySelectorAll('.garment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.garment === firstAllowed);
      });

      showHideConditionalInputs();
      toast(`Prenda cambiada a ${firstAllowed} (plan ${tier.name})`, 'info');
    }

    // ── 5. Actualizar topbar con indicador de tier ───────────────
    updateTopBarInfo();
  }

  // ─────────────────────────────────────────────────────────────────
  // MOTORES
  // ─────────────────────────────────────────────────────────────────
  function initPatternEngine() {
    PAT.PatternEngine.init(document.getElementById('pattern-svg'));
  }

  function initMannequin() {
    // Three.js se inicializa de forma lazy (solo cuando se abre la vista 3D)
    dom._mannequinReady = false;
  }

  // ─────────────────────────────────────────────────────────────────
  // GENERAR Y RENDERIZAR PATRÓN
  // ─────────────────────────────────────────────────────────────────
  function generateAndRender() {
    // Guardia: si el garment actual no está permitido, usar el primero disponible
    if (!PAT.AuthTier.canUseGarment(state.garment)) {
      const allowed = PAT.AuthTier.getTier().allowedGarments;
      state.garment = allowed[0] || 'franela';
    }

    PAT.PatternEngine.generate(state.garment, state.measures, {
      seam:        state.params.seam,
      ease:        state.params.ease,
      shirtGender: state.shirtGender,
    });

    updateTopBarInfo();

    // Actualizar maniquí 3D si la vista está activa
    if (state.view === 'viewer3d' && dom._mannequinReady) {
      PAT.Mannequin3D.updateGarment(state.garment, state.measures, state.params);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // TOPBAR INFO
  // ─────────────────────────────────────────────────────────────────
  function updateTopBarInfo() {
    const garmentNames = {
      franela: 'Franela Básica',
      blusa:   'Blusa con Pinzas',
      camisa:  `Camisa ${state.shirtGender === 'dama' ? 'Dama' : 'Caballero'}`,
      falda:   'Falda Recta',
      vestido: 'Vestido Básico',
    };
    const pieceCounts = {
      franela: 3, blusa: 3, camisa: 7, falda: 3, vestido: 2,
    };

    if (dom.patternInfo) {
      const tierBadge = PAT.AuthTier.needsWatermark()
        ? ' <span style="background:#ef444422;color:#ef4444;padding:1px 6px;border-radius:10px;font-size:10px">DEMO</span>'
        : '';
      dom.patternInfo.innerHTML =
        `${garmentNames[state.garment] || state.garment} · Busto/Pecho ${state.measures.bust}cm${tierBadge}`;
    }
    if (dom.pieceCount) {
      dom.pieceCount.textContent = `${pieceCounts[state.garment] || '?'} piezas`;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // ZOOM Y PAN
  // ─────────────────────────────────────────────────────────────────
  function applyZoom(newZoom) {
    state.zoom = Math.max(0.05, Math.min(5, newZoom));
    applyTransform();
    if (dom.zoomLabel) {
      dom.zoomLabel.textContent = Math.round(state.zoom * 100) + '%';
    }
  }

  function applyTransform() {
    if (dom.svgPanContainer) {
      dom.svgPanContainer.style.transform =
        `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
    }
  }

  function fitToScreen() {
    if (!dom.svgWrapper || !dom.svg) return;

    const wrapperRect = dom.svgWrapper.getBoundingClientRect();
    const vb = dom.svg.getAttribute('viewBox');
    if (!vb) return;

    const [, , vbW, vbH] = vb.split(' ').map(Number);
    const MM_TO_PX = 3.78;   // 1mm ≈ 3.78px a 96dpi
    const svgPxW   = vbW * MM_TO_PX;
    const svgPxH   = vbH * MM_TO_PX;

    const scaleX  = (wrapperRect.width  - 60) / svgPxW;
    const scaleY  = (wrapperRect.height - 60) / svgPxH;
    const newZoom = Math.min(scaleX, scaleY, 2);   // máx 200% en fit

    state.zoom = Math.max(0.05, newZoom);
    state.panX = (wrapperRect.width  - svgPxW * state.zoom) / 2;
    state.panY = 30;
    applyTransform();

    if (dom.zoomLabel) {
      dom.zoomLabel.textContent = Math.round(state.zoom * 100) + '%';
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // CAMBIO DE VISTA (2D ↔ 3D)
  // ─────────────────────────────────────────────────────────────────
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

      // Inicialización lazy de Three.js
      if (!dom._mannequinReady) {
        const canvas = document.getElementById('three-canvas');
        if (canvas) {
          PAT.Mannequin3D.init(canvas);
          dom._mannequinReady = true;
        }
      }
      PAT.Mannequin3D.updateGarment(state.garment, state.measures, state.params);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // INPUTS CONDICIONALES (mostrar/ocultar según prenda)
  // ─────────────────────────────────────────────────────────────────
  function showHideConditionalInputs() {
    const g         = state.garment;
    const hasSleeve = ['franela', 'blusa', 'camisa'].includes(g);
    const hasSkirt  = ['falda', 'vestido'].includes(g);
    const isCamisa  = g === 'camisa';

    const show = (id, visible) => {
      const el = document.getElementById(id);
      if (el) el.style.display = visible ? '' : 'none';
    };

    show('row-sleeve-length', hasSleeve);
    show('row-wrist',         g === 'camisa' || g === 'blusa');
    show('row-skirt-length',  hasSkirt);
    show('shirt-options',     isCamisa);
  }

  // ─────────────────────────────────────────────────────────────────
  // LISTA DE PATRONES GUARDADOS (modal de carga)
  // ─────────────────────────────────────────────────────────────────
  function renderPatternsList(patterns) {
    if (!patterns || patterns.length === 0) {
      dom.patternsList.innerHTML =
        '<p style="color:#64748b;padding:16px;text-align:center">No hay patrones guardados aún.</p>';
      return;
    }

    dom.patternsList.innerHTML = '';
    patterns.forEach(p => {
      const item = document.createElement('div');
      item.className = 'saved-pattern-item';

      const createdStr = p.createdAt
        ? (typeof p.createdAt.toDate === 'function'
            ? p.createdAt.toDate().toLocaleDateString('es')
            : new Date(p.createdAt).toLocaleDateString('es'))
        : '—';

      item.innerHTML = `
        <div>
          <div class="pattern-name">${p.name || 'Sin nombre'}</div>
          <div class="pattern-meta">
            ${p.garment || '?'} · Busto ${p.measures?.bust || '?'}cm · ${createdStr}
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="icon-btn" data-action="load"   data-id="${p.id}" title="Cargar">↩</button>
          <button class="icon-btn" data-action="delete" data-id="${p.id}"
                  title="Eliminar" style="color:#ef4444">✕</button>
        </div>
      `;

      item.querySelector('[data-action="load"]').addEventListener('click', (e) => {
        e.stopPropagation();
        loadPattern(p);
      });
      item.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`¿Eliminar "${p.name}"?`)) {
          await PAT.Firebase.deletePattern(p.id);
          toast(`"${p.name}" eliminado`, 'success');
          item.remove();
        }
      });

      dom.patternsList.appendChild(item);
    });
  }

  function loadPattern(p) {
    if (p.garment)  state.garment  = p.garment;
    if (p.measures) state.measures = { ...PAT.DEFAULT_MEASURES, ...p.measures };
    if (p.params)   state.params   = { ...PAT.DEFAULTS,         ...p.params   };

    // Verificar si el garment del patrón está disponible en el tier actual
    if (!PAT.AuthTier.canUseGarment(state.garment)) {
      toast(`El plan ${PAT.AuthTier.getTier().name} no incluye "${p.garment}". Actualiza tu plan.`, 'error');
      state.garment = PAT.AuthTier.getTier().allowedGarments[0];
    }

    // Sincronizar todos los inputs
    document.querySelectorAll('input[data-measure]').forEach(input => {
      const key = input.dataset.measure;
      if (state.measures[key] !== undefined) input.value = state.measures[key];
    });
    document.querySelectorAll('input[data-param], select[data-param]').forEach(el => {
      const key = el.dataset.param;
      if (state.params[key] !== undefined) el.value = state.params[key];
    });
    document.querySelectorAll('.garment-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.garment === state.garment);
    });

    showHideConditionalInputs();
    generateAndRender();
    dom.modalLoad.style.display = 'none';
    toast(`✅ Patrón "${p.name}" cargado`, 'success');
  }

  // ─────────────────────────────────────────────────────────────────
  // TOAST NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────
  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;
    container.appendChild(t);

    // Autodestruir después de 3.2s (coincide con la animación CSS)
    setTimeout(() => { if (t.parentNode) t.remove(); }, 3200);
  }

  // ─────────────────────────────────────────────────────────────────
  // ARRANQUE
  // ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  // ─────────────────────────────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────────────────────────────
  return {
    toast,
    getState:  () => ({ ...state }),
    fitToScreen,
    applyZoom,
    updateTierUI,
    generateAndRender,
  };

})();
