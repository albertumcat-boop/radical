'use strict';
/**
 * paywall.js
 * Modal bloqueante cuando el trial de 15 días ha vencido.
 * - MutationObserver: restaura el modal si alguien lo elimina del DOM.
 * - Lemon Squeezy Checkout: redirige a página hosteada (sin PCI, sin formularios).
 * - LS_ENABLED=false hasta configurar las variables de entorno en Vercel.
 */

window.PAT = window.PAT || {};
PAT.Paywall = (function () {

  // ── Configuración Lemon Squeezy ────────────────────────────────
  // Cuando estés listo: LS_ENABLED = true y configura los Variant IDs en Vercel.
  const LS_ENABLED = false;

  const PLANS = [
    {
      id:        'pro',
      name:      'Pro',
      badge:     '⭐',
      price:     9.99,
      variantId: 'LS_VARIANT_PRO',   // → Vercel env var, no se expone aquí
      color:     '#8b5cf6',
      features:  ['8 tipos de prendas', 'Sin marca de agua', 'PDF limpio', '50 patrones guardados'],
      highlight: false,
    },
    {
      id:        'expert',
      name:      'Expert',
      badge:     '👑',
      price:     24.99,
      variantId: 'LS_VARIANT_EXPERT',
      color:     '#f59e0b',
      features:  ['11 tipos de prendas', 'Todo lo de Pro', 'Panel de atelier', '500 patrones guardados'],
      highlight: true,
    },
  ];

  let _modal    = null;
  let _observer = null;
  let _visible  = false;

  // ── Mostrar ────────────────────────────────────────────────────
  function show() {
    _visible = true;
    if (!_modal || !document.body.contains(_modal)) {
      _build();
    }
    _modal.style.display = 'flex';
    _armWatchdog();
  }

  function _build() {
    if (_observer) { _observer.disconnect(); _observer = null; }
    _modal = document.createElement('div');
    _modal.id = 'paywall-modal';

    const plansHtml = PLANS.map(p => `
      <div style="
        flex:1;min-width:200px;
        background:${p.highlight ? 'linear-gradient(145deg,#1a1208,#2a1a0a)' : 'var(--bg2,#ede8de)'};
        border:2px solid ${p.highlight ? p.color : 'var(--brd,#ddd5c5)'};
        border-radius:16px;padding:20px 16px;
        display:flex;flex-direction:column;gap:10px;
        ${p.highlight ? 'box-shadow:0 0 30px ' + p.color + '33' : ''}
      ">
        ${p.highlight ? `<div style="text-align:center;font-size:10px;font-weight:800;letter-spacing:.1em;color:${p.color};text-transform:uppercase;margin-bottom:-4px">Más popular</div>` : ''}
        <div style="text-align:center">
          <span style="font-size:28px">${p.badge}</span>
          <div style="font-size:16px;font-weight:800;color:${p.highlight ? '#fff' : 'var(--tx,#2a2018)'};margin-top:4px">${p.name}</div>
          <div style="font-size:26px;font-weight:900;color:${p.color};margin-top:6px">
            $${p.price}<span style="font-size:12px;font-weight:600;color:${p.highlight ? '#aaa' : 'var(--tx3)'}">/mes</span>
          </div>
        </div>
        <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px;flex:1">
          ${p.features.map(f => `
            <li style="font-size:11px;color:${p.highlight ? '#ccc' : 'var(--tx2)'};display:flex;gap:6px;align-items:flex-start">
              <span style="color:${p.color};flex-shrink:0">✓</span>${f}
            </li>
          `).join('')}
        </ul>
        <button
          class="pw-plan-btn"
          data-variant="${p.variantId}"
          data-plan="${p.id}"
          style="
            width:100%;padding:11px;border-radius:10px;border:none;cursor:pointer;
            font-size:12px;font-weight:800;font-family:inherit;
            background:${p.highlight ? p.color : 'none'};
            color:${p.highlight ? '#fff' : p.color};
            border:2px solid ${p.color};
            opacity:${LS_ENABLED ? '1' : '0.65'};
            ${LS_ENABLED ? '' : 'cursor:not-allowed'}
          "
        >
          ${LS_ENABLED ? `Suscribirme — $${p.price}/mes` : '🔒 Próximamente'}
        </button>
      </div>
    `).join('');

    _modal.innerHTML = `
<style>
#paywall-modal{
  position:fixed;inset:0;z-index:2000;
  display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.92);backdrop-filter:blur(8px);
}
#paywall-box{
  background:var(--panel,#faf7f2);border:1px solid var(--brd2,#c8bca8);
  border-radius:20px;width:min(620px,96vw);max-height:92vh;
  overflow-y:auto;box-shadow:0 32px 100px rgba(0,0,0,.6);
  padding:32px 28px;
}
.pw-plan-btn:hover:not([style*="cursor:not-allowed"]){filter:brightness(1.12)}
</style>
<div id="paywall-box">
  <div style="text-align:center;margin-bottom:24px">
    <div style="font-size:48px;margin-bottom:8px">⏰</div>
    <h2 style="margin:0;font-size:20px;font-weight:900;color:var(--tx,#2a2018)">
      Tu prueba gratuita ha terminado
    </h2>
    <p style="margin:10px 0 0;font-size:13px;color:var(--tx2,#6b5a45);max-width:400px;margin-inline:auto">
      Espero que hayas disfrutado los 15 días de acceso completo a PatrónAI Pro.
      Elige un plan para seguir creando patrones sin límites.
    </p>
  </div>

  <div style="display:flex;gap:14px;flex-wrap:wrap">${plansHtml}</div>

  <div style="margin-top:20px;text-align:center">
    <p style="font-size:11px;color:var(--tx3,#9a8a75);margin:0">
      ¿Tienes un código de atelier?
      <button id="pw-atelier-btn" style="background:none;border:none;color:var(--acc,#b86b2e);
        font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:underline">
        Úsalo aquí
      </button>
    </p>
    <p style="font-size:10px;color:var(--tx3,#9a8a75);margin:8px 0 0">
      ${LS_ENABLED
        ? 'Pago seguro · Cancela cuando quieras · Factura incluida'
        : 'Los pagos estarán disponibles muy pronto · Cancela cuando quieras'}
    </p>
  </div>

  <div id="pw-loading" style="display:none;text-align:center;margin-top:16px;
    font-size:12px;color:var(--tx3)">Redirigiendo al pago seguro…</div>
  <div id="pw-error"  style="display:none;margin-top:12px;background:#f8717115;
    border:1px solid #f8717155;border-radius:8px;padding:8px 12px;
    font-size:11px;color:#b84040;text-align:center"></div>
</div>`;

    document.body.appendChild(_modal);

    document.getElementById('pw-atelier-btn').onclick = () => PAT.AtelierUI?.open();

    _modal.querySelectorAll('.pw-plan-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!LS_ENABLED) return;
        _startCheckout(btn.dataset.variant, btn.dataset.plan);
      });
    });
  }

  // ── Lemon Squeezy Checkout ─────────────────────────────────────
  async function _startCheckout(variantKey, planId) {
    const uid   = PAT.AuthTier?.getUserId();
    const email = PAT.AuthTier?.getUserEmail();
    const loadEl = document.getElementById('pw-loading');
    const errEl  = document.getElementById('pw-error');
    if (loadEl) loadEl.style.display = 'block';
    if (errEl)  errEl.style.display  = 'none';

    try {
      const res = await fetch('/api/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ variantKey, planId, uid, email }),
      });
      if (!res.ok) throw new Error('Error al crear la sesión de pago');
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      if (loadEl) loadEl.style.display = 'none';
      if (errEl)  { errEl.textContent = '⚠ ' + e.message; errEl.style.display = 'block'; }
    }
  }

  // ── Watchdog: restaura el modal si alguien lo elimina del DOM ──
  function _armWatchdog() {
    if (_observer) _observer.disconnect();
    _observer = new MutationObserver(() => {
      if (!_visible) return;
      const el = document.getElementById('paywall-modal');
      if (!el || el.style.display === 'none') {
        console.warn('[Paywall] Modal removido o ocultado — restaurando.');
        // Reconstruir y volver a mostrar
        if (_modal && !document.body.contains(_modal)) _modal = null;
        if (!_modal) _build();
        _modal.style.display = 'flex';
      }
    });
    _observer.observe(document.body, { childList: true, subtree: true, attributes: true,
      attributeFilter: ['style', 'class'] });
  }

  // ── Verificar al cargar (usado por otros módulos) ──────────────
  function check() {
    if (PAT.AuthTier?.isLoggedIn()
      && !PAT.AuthTier?.isInTrial()
      && PAT.AuthTier?.getTierId() === 'free') {
      show();
    }
  }

  // ── Auto-unirse desde URL (?payment=success) ───────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const p = new URLSearchParams(location.search);
    if (p.get('payment') === 'success') {
      history.replaceState(null, '', location.pathname);
      PAT.App?.toast('✅ Pago confirmado. ¡Bienvenido!', 'success');
    }
  });

  return { show, check };

})();
