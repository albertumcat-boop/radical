'use strict';
window.PAT = window.PAT || {};

PAT.App = (function () {

  let state = {
    garment:    'franela',
    shirtGender:'dama',
    measures:   { ...PAT.DEFAULT_MEASURES },
    params:     { seam: PAT.DEFAULTS.seam, ease: PAT.DEFAULTS.ease, paper: PAT.DEFAULTS.paper },
    zoom: 1, panX: 0, panY: 0,
    view: 'pattern',
    dragging: false, mx: 0, my: 0,
    mannequinReady: false,
  };

  let _timer = null;
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  function debounce(fn, ms = 140) {
    clearTimeout(_timer);
    _timer = setTimeout(fn, ms);
  }

  // ─── INIT ──────────────────────────────────────────────────────
  function init() {
    if (PAT.AuthTier)    PAT.AuthTier.init();
    if (PAT.Affiliate)   PAT.Affiliate.init();
    if (PAT.AtelierPanel) PAT.AtelierPanel.init();

    PAT.PatternEngine.init($('pattern-svg'));

    setupGarmentButtons();
    setupInputs();
    setupViewSwitcher();
    setupZoom();
    setupPan();
    setupModals();
    setupAffiliateUI();
    setupMonetizationEvents();
    if (PAT.AuthTier) applyTierUI();

    showHideRows();
    generate();
    setTimeout(fitScreen, 350);
    console.log('[PatrónAI] ✓ App lista');
  }

  // ─── BOTONES DE PRENDA ─────────────────────────────────────────
  function setupGarmentButtons() {
    $$('.garment-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const g = this.dataset.garment;

        if (PAT.AuthTier && !PAT.AuthTier.canUseGarment(g)) {
          if (PAT.PaymentUI) PAT.PaymentUI.showUpgradeModal();
          return;
        }

        $$('.garment-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.garment = g;
        showHideRows();
        generate(80);
      });
    });
  }

  // ─── INPUTS ────────────────────────────────────────────────────
  function setupInputs() {
    // Medidas
    $$('input[data-measure]').forEach(inp => {
      inp.addEventListener('input', function() {
        const v = parseFloat(this.value);
        if (!isNaN(v) && v > 0) { state.measures[this.dataset.measure] = v; generate(); }
      });
    });

    // Parámetros
    $$('input[data-param], select[data-param]').forEach(el => {
      el.addEventListener('input', function() {
        const k = this.dataset.param;
        const v = this.tagName === 'SELECT' ? this.value : parseFloat(this.value);
        if ((k === 'seam' || k === 'ease') && (isNaN(v) || v <= 0)) return;
        if (k === 'seam' && PAT.AuthTier && !PAT.AuthTier.hasCustomSeam()) {
          toast('🔒 Ajuste de margen disponible en Plan Pro', 'warning');
          this.value = state.params.seam;
          return;
        }
        state.params[k] = v;
        generate();
      });
    });

    // Radio género camisa
    $$('input[name="shirt-gender"]').forEach(r => {
      r.addEventListener('change', function() { state.shirtGender = this.value; generate(80); });
    });
  }

  // ─── TABS DE VISTA ─────────────────────────────────────────────
  function setupViewSwitcher() {
    $$('.view-btn').forEach(btn => {
      btn.addEventListener('click', function() { switchView(this.dataset.view); });
    });
  }

  function switchView(v) {
    state.view = v;
    $$('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    const p = $('view-pattern'), t = $('view-viewer3d');
    if (v === 'pattern') {
      p.style.display = ''; t.style.display = 'none';
    } else {
      p.style.display = 'none'; t.style.display = '';
      if (!state.mannequinReady && PAT.Mannequin3D) {
        PAT.Mannequin3D.init($('three-canvas'));
        state.mannequinReady = true;
      }
      if (PAT.Mannequin3D && state.mannequinReady) {
        PAT.Mannequin3D.updateGarment(state.garment, state.measures, state.params);
      }
    }
  }

  // ─── ZOOM ──────────────────────────────────────────────────────
  function setupZoom() {
    $('zoom-in') ?.addEventListener('click', () => setZoom(state.zoom * 1.25));
    $('zoom-out')?.addEventListener('click', () => setZoom(state.zoom * 0.8));
    $('zoom-fit')?.addEventListener('click', fitScreen);
    $('svg-wrapper')?.addEventListener('wheel', e => {
      e.preventDefault();
      setZoom(state.zoom * (e.deltaY < 0 ? 1.12 : 0.9));
    }, { passive: false });
  }

  function setZoom(z) {
    state.zoom = Math.max(.04, Math.min(6, z));
    applyTransform();
    const el = $('zoom-label');
    if (el) el.textContent = Math.round(state.zoom * 100) + '%';
  }

  function applyTransform() {
    const el = $('svg-pan-container');
    if (el) el.style.transform =
      `translate(${Math.round(state.panX)}px,${Math.round(state.panY)}px) scale(${state.zoom})`;
  }

  function fitScreen() {
    const wrap = $('svg-wrapper'), svg = $('pattern-svg');
    if (!wrap || !svg) return;
    const vb = svg.getAttribute('viewBox');
    if (!vb) return;
    const [,,w,h] = vb.split(' ').map(Number);
    const r = wrap.getBoundingClientRect();
    const PX = 3.78;
    const z = Math.min((r.width - 80) / (w * PX), (r.height - 80) / (h * PX), 2);
    state.zoom = Math.max(.04, z);
    state.panX = (r.width  - w * PX * state.zoom) / 2;
    state.panY = 40;
    applyTransform();
    const el = $('zoom-label');
    if (el) el.textContent = Math.round(state.zoom * 100) + '%';
  }

  // ─── PAN ───────────────────────────────────────────────────────
  function setupPan() {
    const wrap = $('svg-wrapper');
    if (!wrap) return;
    wrap.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      state.dragging = true; state.mx = e.clientX; state.my = e.clientY;
    });
    window.addEventListener('mousemove', e => {
      if (!state.dragging) return;
      state.panX += e.clientX - state.mx; state.panY += e.clientY - state.my;
      state.mx = e.clientX; state.my = e.clientY;
      applyTransform();
    });
    window.addEventListener('mouseup', () => { state.dragging = false; });

    let tx=0,ty=0,td=0;
    wrap.addEventListener('touchstart', e => {
      if (e.touches.length === 1) { tx=e.touches[0].clientX; ty=e.touches[0].clientY; state.dragging=true; }
      else if (e.touches.length === 2) td = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
    },{passive:true});
    wrap.addEventListener('touchmove', e => {
      if (e.touches.length===1 && state.dragging) {
        state.panX+=e.touches[0].clientX-tx; state.panY+=e.touches[0].clientY-ty;
        tx=e.touches[0].clientX; ty=e.touches[0].clientY; applyTransform();
      } else if (e.touches.length===2) {
        const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
        setZoom(state.zoom*(d/td)); td=d;
      }
    },{passive:true});
    wrap.addEventListener('touchend', ()=>{ state.dragging=false; });
  }

  // ─── MODALES ───────────────────────────────────────────────────
  function setupModals() {
    // Sidebar toggle
    $('sidebar-toggle')?.addEventListener('click', () => {
      const sb = $('sidebar');
      sb?.classList.toggle('collapsed');
      const btn = $('sidebar-toggle');
      if (btn) btn.textContent = sb?.classList.contains('collapsed') ? '›' : '‹';
    });

    // PDF
    $('btn-export-pdf')?.addEventListener('click', doPDFExport);

    // Guardar
    $('btn-save')?.addEventListener('click', () => {
      const inp = $('save-name');
      if (inp) inp.value = `${state.garment} busto ${state.measures.bust}cm`;
      const m = $('modal-save'); if (m) m.style.display='flex';
    });
    $('confirm-save')?.addEventListener('click', async () => {
      const name = $('save-name')?.value.trim() || 'Patrón sin nombre';
      try {
        await PAT.Firebase.savePattern(name, { garment:state.garment, measures:state.measures, params:state.params });
        const m=$('modal-save'); if(m) m.style.display='none';
        toast(`✅ "${name}" guardado`, 'success');
      } catch(e) { toast('Error al guardar','error'); }
    });
    ['cancel-save','cancel-save-2'].forEach(id => {
      $(id)?.addEventListener('click', () => { const m=$('modal-save'); if(m) m.style.display='none'; });
    });

    // Cargar
    $('btn-load')?.addEventListener('click', async () => {
      const list=$('saved-patterns-list');
      if(list) list.innerHTML='<p style="color:#5a5678;padding:16px;text-align:center">Cargando…</p>';
      const m=$('modal-load'); if(m) m.style.display='flex';
      try { renderPatterns(await PAT.Firebase.loadPatterns()); }
      catch(e) { if(list) list.innerHTML='<p style="color:#f87171;padding:16px">Error al cargar</p>'; }
    });
    $('cancel-load')?.addEventListener('click', () => { const m=$('modal-load'); if(m) m.style.display='none'; });

    // Cerrar modales al click en overlay
    $$('.modal-overlay').forEach(o => {
      o.addEventListener('click', () => {
        $$('.modal').forEach(m => m.style.display='none');
      });
    });

    // Controles 3D
    $('btn-3d-reset')    ?.addEventListener('click', () => PAT.Mannequin3D?.resetCamera());
    $('btn-3d-wireframe')?.addEventListener('click', () => PAT.Mannequin3D?.toggleWireframe());
  }

  // ─── AFILIADO UI ───────────────────────────────────────────────
  function setupAffiliateUI() {
    $('sidebar-apply-code')?.addEventListener('click', () => {
      const inp = $('sidebar-affiliate-input');
      const msg = $('sidebar-affiliate-msg');
      if (!inp || !PAT.Affiliate) return;
      PAT.Affiliate.applyCode(inp.value.trim().toUpperCase()).then(r => {
        if (msg) { msg.textContent = r.message; msg.style.color = r.valid ? 'var(--c-green)' : 'var(--c-red)'; }
        if (r.valid) toast(`🏷️ ${r.discount}% OFF activo`, 'success');
      });
    });

    const savedCode = PAT.Affiliate?.getActiveCode?.();
    if (savedCode) {
      const inp = $('sidebar-affiliate-input');
      const msg = $('sidebar-affiliate-msg');
      const aff = PAT.Affiliate?.getActiveAffiliate?.();
      if (inp) inp.value = savedCode;
      if (msg && aff) { msg.textContent=`✅ ${aff.discount}% OFF — ${aff.atelierName}`; msg.style.color='var(--c-green)'; }
    }
  }

  // ─── EVENTOS DE MONETIZACIÓN ───────────────────────────────────
  function setupMonetizationEvents() {
    $('btn-atelier-panel')?.addEventListener('click', () => PAT.AtelierPanel?.openPanel());

    document.addEventListener('pat:tierChanged', () => { applyTierUI(); generate(); });

    document.addEventListener('pat:loadClientMeasures', e => {
      const { measures, clientName } = e.detail || {};
      if (!measures) return;
      state.measures = { ...state.measures, ...measures };
      $$('input[data-measure]').forEach(inp => {
        if (state.measures[inp.dataset.measure] !== undefined) inp.value = state.measures[inp.dataset.measure];
      });
      generate();
      toast(`↩ Medidas de "${clientName}" cargadas`, 'success');
    });
  }

  // ─── PDF EXPORT ────────────────────────────────────────────────
  function doPDFExport() {
    const canExport = PAT.AuthTier ? PAT.AuthTier.canExportPDF(state.garment) : true;
    if (!canExport) {
      PAT.PaymentUI?.showPatternPaywall(state.garment, doActualExport);
      return;
    }
    doActualExport();
  }

  function doActualExport() {
    const data = PAT.PatternEngine.getCurrentData();
    if (!data) { toast('Genera un patrón primero','error'); return; }
    const wm = PAT.AuthTier?.needsWatermark?.() ? ' (DEMO)' : '';
    toast(`⏳ Generando PDF${wm}…`);
    setTimeout(() => {
      PAT.PDFExport.exportTiledPDF(data, {
        paper: state.params.paper,
        patternName: `${state.garment}_busto${state.measures.bust}`,
      });
    }, 120);
  }

  // ─── TIER UI ───────────────────────────────────────────────────
  function applyTierUI() {
    if (!PAT.AuthTier) return;
    const tier = PAT.AuthTier.getTier();

    $$('.garment-btn').forEach(btn => {
      btn.classList.toggle('locked', !PAT.AuthTier.canUseGarment(btn.dataset.garment));
    });

    const seamRow = $('p-seam')?.closest('.measure-row');
    if (seamRow) { seamRow.style.opacity = tier.customSeam ? '1' : '.4'; }

    const atelierBtn = $('btn-atelier-panel');
    if (atelierBtn) atelierBtn.style.opacity = tier.atelierPanel ? '1' : '.5';

    if (!PAT.AuthTier.canUseGarment(state.garment)) {
      state.garment = tier.allowedGarments[0] || 'franela';
      $$('.garment-btn').forEach(b => b.classList.toggle('active', b.dataset.garment === state.garment));
      showHideRows();
    }
    updateTopbar();
  }

  // ─── GENERAR ───────────────────────────────────────────────────
  function generate(delay = 140) {
    debounce(() => {
      if (PAT.AuthTier && !PAT.AuthTier.canUseGarment(state.garment)) {
        state.garment = PAT.AuthTier.getTier().allowedGarments[0] || 'franela';
      }
      try {
        PAT.PatternEngine.generate(state.garment, state.measures, {
          seam: state.params.seam, ease: state.params.ease, shirtGender: state.shirtGender,
        });
        updateTopbar();
        if (state.view === 'viewer3d' && state.mannequinReady) {
          PAT.Mannequin3D?.updateGarment(state.garment, state.measures, state.params);
        }
      } catch(err) {
        console.error('[App] Error al generar:', err);
        toast('Error al generar el patrón', 'error');
      }
    }, delay);
  }

  function updateTopbar() {
    const names = {
      franela:'Franela Básica', blusa:'Blusa con Pinzas',
      camisa:`Camisa ${state.shirtGender==='dama'?'Dama':'Caballero'}`,
      falda:'Falda Recta', vestido:'Vestido Básico',
    };
    const counts = { franela:3, blusa:3, camisa:7, falda:3, vestido:2 };
    const demo = PAT.AuthTier?.needsWatermark?.()
      ? ' <span style="background:rgba(248,113,113,.12);color:#f87171;padding:1px 8px;border-radius:20px;font-size:10px;border:1px solid rgba(248,113,113,.25)">DEMO</span>' : '';
    const pi = $('pattern-info');
    if (pi) pi.innerHTML = `${names[state.garment]||state.garment} · ${state.measures.bust}cm${demo}`;
    const pc = $('piece-count');
    if (pc) pc.textContent = `${counts[state.garment]||'?'} piezas`;
  }

  // ─── VISIBILIDAD DE FILAS ──────────────────────────────────────
  function showHideRows() {
    const g = state.garment;
    const show = (id, v) => { const e=$(id); if(e) e.style.display=v?'':'none'; };
    show('row-sleeve-length', ['franela','blusa','camisa'].includes(g));
    show('row-wrist',         ['camisa','blusa'].includes(g));
    show('row-skirt-length',  ['falda','vestido'].includes(g));
    show('shirt-options',     g==='camisa');
  }

  // ─── PATRONES GUARDADOS ────────────────────────────────────────
  function renderPatterns(list) {
    const el = $('saved-patterns-list');
    if (!el) return;
    if (!list?.length) { el.innerHTML='<p style="color:#5a5678;padding:16px;text-align:center">No hay patrones guardados.</p>'; return; }
    el.innerHTML='';
    list.forEach(p => {
      const d = document.createElement('div');
      d.className = 'pat-item';
      const ds = p.createdAt ? (typeof p.createdAt.toDate==='function' ? p.createdAt.toDate().toLocaleDateString('es') : new Date(p.createdAt).toLocaleDateString('es')) : '—';
      d.innerHTML = `
        <div>
          <div class="pat-name">${p.name||'Sin nombre'}</div>
          <div class="pat-meta">${p.garment||'?'} · ${p.measures?.bust||'?'}cm · ${ds}</div>
        </div>
        <div class="pat-actions">
          <button class="load-p" title="Cargar">↩</button>
          <button class="del-p" title="Eliminar" style="color:var(--c-red)">✕</button>
        </div>`;
      d.querySelector('.load-p').addEventListener('click', e => { e.stopPropagation(); loadPat(p); });
      d.querySelector('.del-p').addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm(`¿Eliminar "${p.name}"?`)) return;
        await PAT.Firebase.deletePattern(p.id);
        toast(`"${p.name}" eliminado`,'success');
        d.remove();
      });
      el.appendChild(d);
    });
  }

  function loadPat(p) {
    if (p.garment)  state.garment  = p.garment;
    if (p.measures) state.measures = { ...PAT.DEFAULT_MEASURES, ...p.measures };
    if (p.params)   state.params   = { ...PAT.DEFAULTS, ...p.params };
    if (PAT.AuthTier && !PAT.AuthTier.canUseGarment(state.garment)) {
      state.garment = PAT.AuthTier.getTier().allowedGarments[0];
    }
    $$('input[data-measure]').forEach(i => { if(state.measures[i.dataset.measure]!==undefined) i.value=state.measures[i.dataset.measure]; });
    $$('input[data-param], select[data-param]').forEach(e => { if(state.params[e.dataset.param]!==undefined) e.value=state.params[e.dataset.param]; });
    $$('.garment-btn').forEach(b => b.classList.toggle('active', b.dataset.garment===state.garment));
    showHideRows(); generate();
    const m=$('modal-load'); if(m) m.style.display='none';
    toast(`✅ "${p.name}" cargado`,'success');
  }

  // ─── TOAST ─────────────────────────────────────────────────────
  function toast(msg, type='info') {
    const c=$('toast-container'); if(!c) return;
    const icons={success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};
    const t=document.createElement('div');
    t.className=`toast ${type}`;
    t.innerHTML=`<span>${icons[type]||'ℹ️'}</span>${msg}`;
    c.appendChild(t);
    setTimeout(()=>{ if(t.parentNode) t.remove(); },3200);
  }

  // ─── ARRANQUE ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  return { toast, fitScreen, setZoom, generate, applyTierUI, getState:()=>({...state}) };

})();
