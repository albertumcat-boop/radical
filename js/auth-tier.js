'use strict';
window.PAT = window.PAT || {};

PAT.AuthTier = (function () {

  const TIERS = {
    free: {
      id:'free', name:'Básico', price:0, color:'#64748b', badge:'🆓',
      allowedGarments:['franela','falda'],
      pdfWatermark:true, customSeam:false, atelierPanel:false,
      pdfClean:false, maxSavedPatterns:3,
    },
    pro: {
      id:'pro', name:'Pro', price:9.99, color:'#8b5cf6', badge:'⭐',
      allowedGarments:['franela','falda','blusa','camisa','vestido'],
      pdfWatermark:false, customSeam:true, atelierPanel:false,
      pdfClean:true, maxSavedPatterns:50,
    },
    expert: {
      id:'expert', name:'Expert', price:24.99, color:'#f59e0b', badge:'👑',
      allowedGarments:['franela','falda','blusa','camisa','vestido'],
      pdfWatermark:false, customSeam:true, atelierPanel:true,
      pdfClean:true, maxSavedPatterns:500,
    },
  };

  const PATTERN_PRICES = {
    franela:0.99, falda:0.99, blusa:1.49, camisa:1.99, vestido:1.99,
  };

  // Token de sesión — se genera al "pagar" y expira al cerrar el navegador
  // En producción: este token viene del backend tras verificar el pago con Stripe
  let _currentTier      = 'free';
  let _sessionToken     = null;   // prueba de pago en esta sesión
  let _sessionPurchases = new Set();

  function init() {
    _currentTier  = _loadTier();
    _sessionToken = sessionStorage.getItem('pat_session_token');
    _sessionPurchases = new Set(
      JSON.parse(sessionStorage.getItem('pat_purchases') || '[]')
    );

    // Verificar que el tier guardado tenga un token válido
    // Si no hay token pero hay tier Pro/Expert → downgrade a free (evita bypass)
    if (_currentTier !== 'free' && !_sessionToken) {
      _currentTier = 'free';
      localStorage.removeItem('pat_tier');
    }

    _renderBadge();
    console.log('[AuthTier] Tier activo:', _currentTier);
    return _currentTier;
  }

  // ── Getters ──────────────────────────────────────────────────
  function getTier()    { return TIERS[_currentTier]; }
  function getTierId()  { return _currentTier; }
  function getTiers()   { return TIERS; }
  function getPatternPrice(g) { return PATTERN_PRICES[g] || 1.99; }
  function canUseGarment(g)   { return TIERS[_currentTier].allowedGarments.includes(g); }
  function needsWatermark()   { return TIERS[_currentTier].pdfWatermark; }
  function hasAtelierPanel()  { return TIERS[_currentTier].atelierPanel; }
  function hasCustomSeam()    { return TIERS[_currentTier].customSeam; }

  function canExportPDF(g) {
    if (_currentTier !== 'free') return true;
    return _sessionPurchases.has(g);
  }

  // ── Activar tier (solo desde PaymentUI tras "pago") ───────────
  // En producción: llamar solo tras confirmar el pago con Stripe webhook
  function activateTier(tierId, paymentToken) {
    if (!TIERS[tierId]) return false;

    // Validar que viene con un token de pago (no bypass directo)
    if (tierId !== 'free' && !paymentToken) {
      console.warn('[AuthTier] Intento de activar tier sin token de pago');
      return false;
    }

    _currentTier  = tierId;
    _sessionToken = paymentToken || null;

    if (tierId === 'free') {
      localStorage.removeItem('pat_tier');
      sessionStorage.removeItem('pat_session_token');
    } else {
      localStorage.setItem('pat_tier', tierId);
      sessionStorage.setItem('pat_session_token', paymentToken);
    }

    _renderBadge();
    document.dispatchEvent(new CustomEvent('pat:tierChanged', { detail: { tier: tierId } }));
    return true;
  }

  // Mantener compatibilidad con código existente que llama setTier
  // pero ahora requiere el token
  function setTier(tierId) {
    // En modo DEMO: generar un token simulado
    const demoToken = 'demo_' + tierId + '_' + Date.now();
    return activateTier(tierId, demoToken);
  }

  function registerPurchase(g) {
    _sessionPurchases.add(g);
    sessionStorage.setItem('pat_purchases', JSON.stringify([..._sessionPurchases]));
  }

  // ── Badge ─────────────────────────────────────────────────────
  function _renderBadge() {
    const tier = TIERS[_currentTier];
    let badge  = document.getElementById('tier-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'tier-badge';
      document.body.appendChild(badge);
    }
    badge.style.cssText = `
      position:fixed;top:10px;right:14px;z-index:999;
      background:var(--panel);border:1px solid ${tier.color}55;
      border-radius:20px;padding:5px 12px;font-size:11px;font-weight:700;
      display:flex;align-items:center;gap:6px;cursor:pointer;
      box-shadow:0 2px 12px rgba(0,0,0,.3);color:${tier.color};
    `;
    badge.innerHTML = `
      <span>${tier.badge}</span>
      <span>${tier.name}</span>
      ${_currentTier !== 'expert'
        ? `<span style="background:${tier.color}22;padding:1px 7px;border-radius:10px;font-size:9px">Mejorar ↑</span>`
        : ''}
    `;
    badge.onclick = () => { if (window.PAT && PAT.PaymentUI) PAT.PaymentUI.showUpgradeModal(); };
  }

  function _loadTier() {
    return localStorage.getItem('pat_tier') || 'free';
  }

  return {
    init, getTier, getTierId, getTiers, getPatternPrice,
    canUseGarment, canExportPDF, needsWatermark,
    hasAtelierPanel, hasCustomSeam,
    setTier, activateTier, registerPurchase,
  };
})();
