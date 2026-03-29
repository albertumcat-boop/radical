/**
 * auth-tier.js
 * Sistema de niveles de acceso (Tiers).
 *
 * Niveles:
 *  - free   : Franela + Falda únicamente. PDF con marca de agua DEMO.
 *  - pro    : Todas las prendas. PDF limpio.
 *  - expert : Todo lo de Pro + ajuste avanzado de márgenes + Panel Atelier.
 *
 * En producción: reemplazar _loadTierFromStorage() con una llamada
 * autenticada al backend (Firebase Auth + Firestore o Stripe Customer Portal).
 *
 * HOOK DE INTEGRACIÓN:
 *  → Stripe Customer Portal: https://billing.stripe.com/p/login/...
 *  → Firebase Auth: firebase.auth().currentUser.getIdTokenResult()
 *    para leer custom claims { tier: 'pro' } asignados desde tu backend.
 */

'use strict';
window.PAT = window.PAT || {};

PAT.AuthTier = (function () {

  // ── Definición de tiers ─────────────────────────────────────────
  const TIERS = {
    free: {
      id:           'free',
      name:         'Básico',
      price:        0,
      color:        '#64748b',
      badge:        '🆓',
      allowedGarments: ['franela', 'falda'],
      pdfWatermark: true,
      customSeam:   false,
      atelierPanel: false,
      pdfClean:     false,
      maxSavedPatterns: 3,
    },
    pro: {
      id:           'pro',
      name:         'Pro',
      price:        9.99,
      color:        '#7c3aed',
      badge:        '⭐',
      allowedGarments: ['franela', 'falda', 'blusa', 'camisa', 'vestido'],
      pdfWatermark: false,
      customSeam:   true,
      atelierPanel: false,
      pdfClean:     true,
      maxSavedPatterns: 50,
    },
    expert: {
      id:           'expert',
      name:         'Expert',
      price:        24.99,
      color:        '#f59e0b',
      badge:        '👑',
      allowedGarments: ['franela', 'falda', 'blusa', 'camisa', 'vestido'],
      pdfWatermark: false,
      customSeam:   true,
      atelierPanel: true,
      pdfClean:     true,
      maxSavedPatterns: 500,
    },
  };

  // ── Precios por patrón (micropago) ──────────────────────────────
  const PATTERN_PRICES = {
    franela: 0.99,
    falda:   0.99,
    blusa:   1.49,
    camisa:  1.99,
    vestido: 1.99,
  };

  // ── Estado actual ───────────────────────────────────────────────
  let _currentTier = 'free';
  let _userId      = null;
  let _sessionPurchases = new Set();  // patrones comprados en esta sesión

  // ─────────────────────────────────────────────────────────────────
  // INIT — carga el tier del usuario
  // ─────────────────────────────────────────────────────────────────
  function init() {
    _currentTier = _loadTierFromStorage();
    _userId      = _loadUserIdFromStorage();
    _sessionPurchases = new Set(
      JSON.parse(sessionStorage.getItem('pat_purchases') || '[]')
    );
    _renderTierBadge();
    console.log(`[AuthTier] Tier activo: ${_currentTier}`);
    return _currentTier;
  }

  // ─────────────────────────────────────────────────────────────────
  // GETTERS
  // ─────────────────────────────────────────────────────────────────
  function getTier()       { return TIERS[_currentTier]; }
  function getTierId()     { return _currentTier; }
  function getTiers()      { return TIERS; }
  function getUserId()     { return _userId; }
  function getPatternPrice(garment) { return PATTERN_PRICES[garment] || 1.99; }

  function canUseGarment(garmentType) {
    return TIERS[_currentTier].allowedGarments.includes(garmentType);
  }

  function canExportPDF(garmentType) {
    // Free tier: solo puede exportar si compró el patrón individualmente
    if (_currentTier === 'free') {
      return _sessionPurchases.has(garmentType);
    }
    return true;
  }

  function needsWatermark() {
    return TIERS[_currentTier].pdfWatermark;
  }

  function hasAtelierPanel() {
    return TIERS[_currentTier].atelierPanel;
  }

  function hasCustomSeam() {
    return TIERS[_currentTier].customSeam;
  }

  // ─────────────────────────────────────────────────────────────────
  // CAMBIAR TIER (solo para demo / testing)
  // En producción: esto se maneja desde el backend tras verificar el pago
  // ─────────────────────────────────────────────────────────────────
  function setTier(tierId) {
    if (!TIERS[tierId]) return;
    _currentTier = tierId;
    localStorage.setItem('pat_tier', tierId);
    _renderTierBadge();

    // Notificar a la app para re-renderizar la UI
    document.dispatchEvent(new CustomEvent('pat:tierChanged', { detail: { tier: tierId } }));
  }

  // ─────────────────────────────────────────────────────────────────
  // REGISTRAR COMPRA DE PATRÓN (micropago)
  // ─────────────────────────────────────────────────────────────────
  function registerPurchase(garmentType) {
    _sessionPurchases.add(garmentType);
    sessionStorage.setItem('pat_purchases', JSON.stringify([..._sessionPurchases]));
  }

  // ─────────────────────────────────────────────────────────────────
  // BADGE DE TIER EN LA UI
  // ─────────────────────────────────────────────────────────────────
  function _renderTierBadge() {
    const tier = TIERS[_currentTier];
    let badge = document.getElementById('tier-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'tier-badge';
      badge.style.cssText = `
        position:fixed; top:10px; right:14px; z-index:999;
        background:var(--bg-panel); border:1px solid var(--border-light);
        border-radius:20px; padding:5px 12px; font-size:11px; font-weight:700;
        display:flex; align-items:center; gap:6px; cursor:pointer;
        box-shadow:0 2px 12px rgba(0,0,0,0.3);
        color: ${tier.color};
        border-color: ${tier.color}44;
      `;
      badge.addEventListener('click', () => PAT.PaymentUI.showUpgradeModal());
      document.body.appendChild(badge);
    }
    badge.innerHTML = `
      <span style="font-size:14px">${tier.badge}</span>
      <span>${tier.name}</span>
      ${_currentTier !== 'expert'
        ? `<span style="background:${tier.color}22;padding:1px 6px;border-radius:10px;font-size:9px;color:${tier.color}">Mejorar ↑</span>`
        : ''}
    `;
    badge.style.color       = tier.color;
    badge.style.borderColor = tier.color + '44';
  }

  // ─────────────────────────────────────────────────────────────────
  // STORAGE HELPERS
  // ─────────────────────────────────────────────────────────────────
  function _loadTierFromStorage() {
    // HOOK DE PRODUCCIÓN:
    // En lugar de localStorage, aquí debe ir una llamada al backend:
    //
    // const token = await firebase.auth().currentUser.getIdToken();
    // const res   = await fetch('/api/verify-subscription', {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // const { tier } = await res.json();
    // return tier;
    //
    // O con Stripe:
    // const customer = await stripe.customers.retrieve(customerId, {
    //   expand: ['subscriptions']
    // });
    // return mapStripePlanToTier(customer.subscriptions.data[0]?.price?.id);

    return localStorage.getItem('pat_tier') || 'free';
  }

  function _loadUserIdFromStorage() {
    let uid = localStorage.getItem('pat_uid');
    if (!uid) {
      uid = 'usr_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('pat_uid', uid);
    }
    return uid;
  }

  return {
    init, getTier, getTierId, getTiers, getUserId, getPatternPrice,
    canUseGarment, canExportPDF, needsWatermark, hasAtelierPanel,
    hasCustomSeam, setTier, registerPurchase,
  };
})();
