/**
 * app.js
 * Controlador principal de la aplicación.
 * Inicializa todos los módulos, gestiona la UI y conecta eventos.
 */

'use strict';
window.PAT = window.PAT || {};

PAT.App = (function() {

  // ── Estado de la aplicación ──────────────────────────────────────
  let state = {
    garment:     PAT.DEFAULTS.garment,
    shirtGender: 'dama',
    measures:    { ...PAT.DEFAULT_MEASURES },
    params: {
      seam:  PAT.DEFAULTS.seam,
      ease:  PAT.DEFAULTS.ease,
      paper: PAT.DEFAULTS.paper,
    },
    zoom:  1.0,
    panX:  0,
    panY:  0,
    view:  'pattern',  // 'pattern' | 'viewer3d'
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  };

  // ── Referencias DOM ───────────────────────────────────────────────
  const dom = {};

  // ── Debounce para no regenerar en cada keypress ───────────────────
  let _genDebounceTimer = null;
  function scheduleGenerate(delay = 120) {
    clearTimeout(_genDebounceTimer);
    _genDebounceTimer = setTimeout(generateAndRender, delay);
  }

  // ─────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────
  function init() {
    cacheDOM();
    bindEvents();
    initPatternEngine();
    initMannequin();
    showHideConditionalInputs();
    generateAndRender();
    console.log('[PatrónAI] App inicializada ✓');
  }

  function cacheDOM() {
    dom.svg            = document.getElementById('pattern-svg');
    dom.svgWrapper     = document.getElementById('svg-wrapper');
    dom.svgPanContainer= document.getElementById('svg-pan-container');
    dom.threeCanvas    = document.getElementById('three-canvas');
    dom.patternInfo    = document.getElementById('pattern-info');
    dom.pieceCount     = document.getElementById('piece-count');
    dom.zoomLabel      = document.getElementById('zoom-label');
    dom.modalSave      = document.getElementById('modal-save');
    dom.modalLoad      = document.getElementById('modal-load');
    dom.saveNameInput  = document.getElementById('save-name');
    dom.patternsList   = document.getElementById('saved-patterns-list');
    dom.shirtOptions   = document.getElementById('shirt-options');
    dom.sidebar        = document.getElementById('sidebar');
  }

  // ─────────────────────────────────────────────────────────────────
  // EVENTOS
  // ─────────────────────────────────────────────────────────────────
  function bindEvents() {

    // ── Botones de tipo de prenda ───────────────────────────────
    document.querySelectorAll('.garment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.garment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.garment = btn.dataset.garment;
        showHideConditionalInputs();
        scheduleGenerate(80);
      });
    });

    // ── Opción de género en camisa ──────────────────────────────
    document.querySelectorAll('input[name="shirt-gender"]').forEach(radio => {
      radio.addEventListener('change', () => {
        state.shirtGender = radio.value;
        scheduleGenerate(80);
      });
    });

    // ── Inputs de medidas ───────────────────────────────────────
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
      tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        switchView(view);
      });
    });

    // ── Zoom ────────────────────────────────────────────────────
    document.getElementById('zoom-in').addEventListener('click',  () => applyZoom(state.zoom * 1.25));
    document.getElementById('zoom-out').addEventListener('click', () => applyZoom(state.zoom * 0.8));
    document.getElementById('zoom-fit').addEventListener('click', fitToScreen);

    // Scroll zoom en el SVG wrapper
    dom.svgWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      applyZoom(state.zoom * delta);
    }, { passive: false });

    // ── Pan (arrastrar el SVG) ──────────────────────────────────
    dom.svgWrapper.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      state.isDragging = true;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
      dom.svgWrapper.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      if (!state.isDragging) return;
      const dx = e.clientX - state.lastMouseX;
      const dy = e.clientY - state.lastMouseY;
      state.panX += dx;
      state.panY += dy;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
      applyTransform();
    });
    window.addEventListener('mouseup', () => {
      state.isDragging = false;
      dom.svgWrapper.style.cursor = 'grab';
    });

    // Touch pan para móviles
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

    // ── Exportar PDF ────────────────────────────────────────────
    document.getElementById('btn-export-pdf').addEventListener('click', () => {
      const data = PAT.PatternEngine.getCurrentData();
      if (!data) { toast('Genera un patrón primero', 'error'); return; }
      toast('⏳ Generando PDF…');
      // Pequeño timeout para que el toast se muestre antes de bloquear el hilo
      setTimeout(() => {
        PAT.PDFExport.exportTiledPDF(data, {
          paper:       state.params.paper,
          patternName: `${state.garment}_busto${state.measures.bust}`,
        });
      }, 100);
    });

    // ── Guardar patrón ──────────────────────────────────────────
    document.getElementById('btn-save').addEventListener('click', () => {
      dom.saveNameInput.value = `${state.garment} busto ${state.measures.bust}cm`;
      dom.modalSave.style.display = 'flex';
    });
    document.getElementById('confirm-save').addEventListener('click', async () => {
      const name = dom.saveNameInput.value.trim() || 'Patrón sin nombre';
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

    // ── Cargar patrón ───────────────────────────────────────────
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

    // Cerrar modales al click en backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', () => {
        dom.modalSave.style.display = 'none';
        dom.modalLoad.style.display = 'none';
      });
    });

    // ── Sidebar toggle ──────────────────────────────────────────
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      dom.sidebar.classList.toggle('collapsed');
      const btn = document.getElementById('sidebar-toggle');
      btn.textContent = dom.sidebar.classList.contains('collapsed') ? '›' : '‹';
    });

    // ── Controles 3D ────────────────────────────────────────────
    const btn3DReset = document.getElementById('btn-3d-reset');
    const btn3DWire  = document.getElementById('btn-3d-wireframe');
    if (btn3DReset) btn3DReset.addEventListener('click', () => PAT.Mannequin3D.resetCamera());
    if (btn3DWire)  btn3DWire.addEventListener('click',  () => PAT.Mannequin3D.toggleWireframe());
  }

  // ─────────────────────────────────────────────────────────────────
  // INICIALIZACIÓN DE MOTORES
  // ─────────────────────────────────────────────────────────────────
  function initPatternEngine() {
    const svgEl = document.getElementById('pattern-svg');
    PAT.PatternEngine.init(svgEl);
  }

  function initMannequin() {
    const canvas = document.getElementById('three-canvas');
    if (canvas) {
      // Inicializar Three.js solo cuando se cambie a la vista 3D
      // para no desperdiciar recursos
      dom._mannequinReady = false;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // GENERAR Y RENDERIZAR
  // ─────────────────────────────────────────────────────────────────
  function generateAndRender() {
    // Generar patrón 2D
    PAT.PatternEngine.generate(state.garment, state.measures, {
      seam:        state.params.seam,
      ease:        state.params.ease,
      shirtGender: state.shirtGender,
    });

    // Actualizar info en topbar
    updateTopBarInfo();

    // Actualizar vista 3D si está activa
    if (state.view === 'viewer3d' && dom._mannequinReady) {
      PAT.Mannequin3D.updateGarment(state.garment, state.measures, state.params);
    }
  }

  function updateTopBarInfo() {
    const garmentNames = {
      franela: 'Franela Básica', blusa: 'Blusa con Pinzas',
      camisa:  `Camisa ${state.shirtGender === 'dama' ? 'Dama' : 'Caballero'}`,
      falda:   'Falda Recta', vestido: 'Vestido Básico',
    };
    const pieceCounts = {
      franela: 3, blusa: 3, camisa: 7, falda: 3, vestido: 2,
    };

    if (dom.patternInfo) {
      dom.patternInfo.textContent =
        `${garmentNames[state.garment]} · Busto/Pecho ${state.measures.bust}cm`;
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

    // El SVG está en mm; necesitamos saber cuántos píxeles ocupa
    // Aproximación: 1mm ≈ 3.78px a 96dpi
    const MM_TO_PX = 3.78;
    const svgPxW = vbW * MM_TO_PX;
    const svgPxH = vbH * MM_TO_PX;

    const scaleX = (wrapperRect.width  - 40) / svgPxW;
    const scaleY = (wrapperRect.height - 40) / svgPxH;
    const newZoom = Math.min(scaleX, scaleY);

    state.zoom = newZoom;
    state.panX = (wrapperRect.width  - svgPxW * newZoom) / 2;
    state.panY = 20;
    applyTransform();
    if (dom.zoomLabel) dom.zoomLabel.textContent = Math.round(newZoom * 100) + '%';
  }

  // ─────────────────────────────────────────────────────────────────
  // CAMBIO DE VISTA
  // ─────────────────────────────────────────────────────────────────
  function switchView(viewName) {
    state.view = viewName;

    document.querySelectorAll('.view-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === viewName);
    });

    const viewPattern  = document.getElementById('view-pattern');
    const viewViewer3D = document.getElementById('view-viewer3d');

    if (viewName === 'pattern') {
      viewPattern.style.display  = '';
      viewViewer3D.style.display = 'none';
    } else {
      viewPattern.style.display  = 'none';
      viewViewer3D.style.display = '';

      // Inicializar Three.js la primera vez que se abre la vista 3D
      if (!dom._mannequinReady) {
        const canvas = document.getElementById('three-canvas');
        PAT.Mannequin3D.init(canvas);
        dom._mannequinReady = true;
      }
      PAT.Mannequin3D.updateGarment(state.garment, state.measures, state.params);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // INPUTS CONDICIONALES (mostrar/ocultar según prenda)
  // ─────────────────────────────────────────────────────────────────
  function showHideConditionalInputs() {
    const g = state.garment;
    const hasSleeve  = ['franela', 'blusa', 'camisa'].includes(g);
    const hasSkirt   = ['falda', 'vestido'].includes(g);
    const isCamisa   = g === 'camisa';

    const show = (id, visible) => {
      const el = document.getElementById(id);
      if (el) el.style.display = visible ? '' : 'none';
    };

    show('row-sleeve-length', hasSleeve);
    show('row-wrist',         g === 'camisa' || g === 'blusa');
    show('row-skirt-length',  hasSkirt || g === 'vestido');
    show('shirt-options',     isCamisa);
  }

  // ─────────────────────────────────────────────────────────────────
  // LISTA DE PATRONES GUARDADOS
  // ─────────────────────────────────────────────────────────────────
  function renderPatternsList(patterns) {
    if (!patterns || patterns.length === 0) {
      dom.patternsList.innerHTML =
        '<p style="color:#64748b;padding:12px;text-align:center">No hay patrones guardados aún.</p>';
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
          <button class="icon-btn" data-action="load" data-id="${p.id}" title="Cargar">↩</button>
          <button class="icon-btn" data-action="delete" data-id="${p.id}" title="Eliminar"
                  style="color:#ef4444">✕</button>
        </div>`;

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
    if (p.params)   state.params   = { ...PAT.DEFAULTS, ...p.params };

    // Actualizar inputs en el DOM
    document.querySelectorAll('input[data-measure]').forEach(input => {
      const key = input.dataset.measure;
      if (state.measures[key] !== undefined) input.value = state.measures[key];
    });
    document.querySelectorAll('input[data-param], select[data-param]').forEach(el => {
      const key = el.dataset.param;
      if (state.params[key] !== undefined) el.value = state.params[key];
    });

    // Seleccionar botón de prenda
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

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    container.appendChild(t);

    setTimeout(() => {
      t.remove();
    }, 3200);
  }

  // ─────────────────────────────────────────────────────────────────
  // ARRANQUE
  // ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  // API pública mínima (para que pdf-export pueda llamar a toast)
  return { toast, getState: () => ({ ...state }) };

})();
