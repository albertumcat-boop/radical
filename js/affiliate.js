/**
 * affiliate.js
 * Sistema de afiliados / códigos de atelier.
 *
 * En producción: la validación de códigos se hace en el backend.
 * Nunca exponer la lista completa de códigos válidos en el frontend.
 *
 * HOOK DE BACKEND:
 *  POST /api/validate-affiliate-code
 *  Body: { code: string, userId: string }
 *  Response: { valid: boolean, discount: number, atelierId: string, atelierName: string }
 */

'use strict';
window.PAT = window.PAT || {};

PAT.Affiliate = (function () {

  // ── Códigos de demostración (solo para modo local) ────────────────
  // HOOK: En producción, eliminar esta lista y validar desde el backend
  const DEMO_CODES = {
    'ATELIER10': { discount: 10, atelierId: 'atl_001', atelierName: 'Taller Modas Sofía',    commissionPct: 15 },
    'COSTURA20': { discount: 20, atelierId: 'atl_002', atelierName: 'Casa de Costura Luna',  commissionPct: 15 },
    'MODA2024':  { discount: 15, atelierId: 'atl_003', atelierName: 'PatrónAI Partner',       commissionPct: 20 },
    'EXPERTO25': { discount: 25, atelierId: 'atl_004', atelierName: 'Expert Atelier Network', commissionPct: 20 },
  };

  let _activeCode     = null;
  let _activeAffiliate = null;
  let _commissionLog  = [];

  // ─────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────
  function init() {
    _activeCode = localStorage.getItem('pat_affiliate_code') || null;
    if (_activeCode && DEMO_CODES[_activeCode]) {
      _activeAffiliate = DEMO_CODES[_activeCode];
    }
    _commissionLog = JSON.parse(localStorage.getItem('pat_commission_log') || '[]');
    _renderAffiliateBanner();
  }

  // ─────────────────────────────────────────────────────────────────
  // APLICAR CÓDIGO
  // ─────────────────────────────────────────────────────────────────
  async function applyCode(code) {
    if (!code) return { valid: false, message: 'Ingresa un código' };

    // HOOK DE PRODUCCIÓN:
    // ─────────────────────────────────────────────────────────────
    // try {
    //   const res = await fetch('/api/validate-affiliate-code', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ code, userId: PAT.AuthTier.getUserId() })
    //   });
    //   const data = await res.json();
    //   if (!data.valid) return { valid: false, message: 'Código no válido' };
    //   _activeCode     = code;
    //   _activeAffiliate = data;
    //   localStorage.setItem('pat_affiliate_code', code);
    //   _renderAffiliateBanner();
    //   return { valid: true, discount: data.discount, message: `${data.discount}% de descuento — ${data.atelierName}` };
    // } catch (e) {
    //   return { valid: false, message: 'Error de conexión' };
    // }
    // ─────────────────────────────────────────────────────────────

    // Validación local (demo)
    const affiliate = DEMO_CODES[code.toUpperCase()];
    if (!affiliate) {
      return { valid: false, message: 'Código de atelier no reconocido' };
    }

    _activeCode      = code.toUpperCase();
    _activeAffiliate = affiliate;
    localStorage.setItem('pat_affiliate_code', _activeCode);
    _renderAffiliateBanner();

    return {
      valid:    true,
      discount: affiliate.discount,
      message:  `${affiliate.discount}% de descuento — ${affiliate.atelierName}`,
    };
  }

  function removeCode() {
    _activeCode      = null;
    _activeAffiliate = null;
    localStorage.removeItem('pat_affiliate_code');
    _renderAffiliateBanner();
  }

  // ─────────────────────────────────────────────────────────────────
  // GETTERS
  // ─────────────────────────────────────────────────────────────────
  function getActiveCode()     { return _activeCode; }
  function getDiscount()       { return _activeAffiliate?.discount || 0; }
  function getActiveAffiliate(){ return _activeAffiliate; }

  // ─────────────────────────────────────────────────────────────────
  // LOG DE COMISIONES
  // ─────────────────────────────────────────────────────────────────
  function logCommission(garmentType, saleAmount) {
    if (!_activeAffiliate) return;

    const commission = {
      id:          'com_' + Date.now(),
      atelierId:   _activeAffiliate.atelierId,
      atelierName: _activeAffiliate.atelierName,
      garment:     garmentType,
      saleAmount,
      commission:  +(saleAmount * _activeAffiliate.commissionPct / 100).toFixed(2),
      commissionPct: _activeAffiliate.commissionPct,
      userId:      PAT.AuthTier.getUserId(),
      timestamp:   new Date().toISOString(),
      status:      'pending',  // → 'paid' cuando el backend procese
    };

    _commissionLog.push(commission);
    localStorage.setItem('pat_commission_log', JSON.stringify(_commissionLog));

    // HOOK DE PRODUCCIÓN: enviar al backend
    // ─────────────────────────────────────────────────────────────
    // fetch('/api/log-commission', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(commission)
    // });
    // ─────────────────────────────────────────────────────────────

    console.log('[Affiliate] Comisión registrada:', commission);
  }

  function getCommissionLog() { return [..._commissionLog]; }

  // ─────────────────────────────────────────────────────────────────
  // BANNER DE AFILIADO EN LA UI
  // ─────────────────────────────────────────────────────────────────
  function _renderAffiliateBanner() {
    const existing = document.getElementById('affiliate-banner');
    if (existing) existing.remove();

    if (!_activeAffiliate) return;

    const banner = document.createElement('div');
    banner.id = 'affiliate-banner';
    banner.style.cssText = `
      position:fixed; bottom:60px; left:50%; transform:translateX(-50%);
      background:var(--bg-panel); border:1px solid var(--green);
      border-radius:20px; padding:6px 16px; font-size:11px; font-weight:600;
      display:flex; align-items:center; gap:8px; z-index:990;
      color:var(--green); box-shadow:0 2px 12px rgba(16,185,129,0.2);
      white-space:nowrap;
    `;
    banner.innerHTML = `
      <span>🏷️</span>
      <span>Código <strong>${_activeCode}</strong> activo · ${_activeAffiliate.discount}% OFF · ${_activeAffiliate.atelierName}</span>
      <button onclick="PAT.Affiliate.removeCode()" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:14px;padding:0 0 0 4px">✕</button>
    `;
    document.body.appendChild(banner);
  }

  return {
    init, applyCode, removeCode,
    getActiveCode, getDiscount, getActiveAffiliate,
    logCommission, getCommissionLog,
  };
})();
