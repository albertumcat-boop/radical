'use strict';
/**
 * paywall.js
 * Modal bloqueante que aparece cuando el trial de 15 días ha vencido.
 * Stripe está integrado en estructura pero los botones muestran "Próximamente"
 * hasta que se activen las claves reales.
 */

window.PAT = window.PAT || {};
PAT.Paywall = (function () {

  // ── Configuración Stripe ───────────────────────────────────────
  // Cuando se active: reemplazar con claves reales de Stripe Dashboard
  const STRIPE_ENABLED = false;
  const STRIPE_PK      = 'pk_live_XXXXXXXXXXXXXXXXXXXXXXXX'; // publishable key
  const PLANS = [
    {
      id:          'pro',
      name:        'Pro',
      badge:       '⭐',
      price:       9.99,
      currency:    'USD',
      priceId:     'price_XXXXXXXXXXXXXXXXXXXXXXXXX', // Stripe Price ID
      color:       '#8b5cf6',
      features:    ['8 tipos de prendas','Sin marca de agua','PDF limpio','50 patrones guardados'],
      highlight:   false,
    },
    {
      id:          'expert',
      name:        'Expert',
      badge:       '👑',
      price:       24.99,
      currency:    'USD',
      priceId:     'price_XXXXXXXXXXXXXXXXXXXXXXXXX', // Stripe Price ID
      color:       '#f59e0b',
      features:    ['11 tipos de prendas','Todo lo de Pro','Panel de atelier','500 patrones guardados'],
      highlight:   true,
    },
  ];

  let _modal = null;
  let _stripe = null;

  // ── Mostrar paywall ────────────────────────────────────────────
  function show() {
    if (_modal) { _modal.style.display = 'flex'; return; }
    _build();
    if (STRIPE_ENABLED) _loadStripe();
  }

  function _build() {
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
          data-plan="${p.id}"
          data-price-id="${p.priceId}"
          style="
            width:100%;padding:11px;border-radius:10px;border:none;cursor:pointer;
            font-size:12px;font-weight:800;font-family:inherit;
            background:${p.highlight ? p.color : 'none'};
            color:${p.highlight ? '#fff' : p.color};
            border:2px solid ${p.color};
            opacity:${STRIPE_ENABLED ? '1' : '0.7'};
          "
          ${STRIPE_ENABLED ? '' : 'disabled title="Pagos disponibles muy pronto"'}
        >
          ${STRIPE_ENABLED ? `Suscribirme a ${p.name}` : '🔒 Próximamente'}
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
.pw-plan-btn:hover:not(:disabled){filter:brightness(1.1)}
</style>
<div id="paywall-box">
  <div style="text-align:center;margin-bottom:24px">
    <div style="font-size:48px;margin-bottom:8px">⏰</div>
    <h2 style="margin:0;font-size:20px;font-weight:900;color:var(--tx,#2a2018)">Tu prueba gratuita ha terminado</h2>
    <p style="margin:10px 0 0;font-size:13px;color:var(--tx2,#6b5a45);max-width:400px;margin-inline:auto">
      Espero que hayas disfrutado los 15 días de acceso completo a PatrónAI Pro.
      Elige un plan para seguir creando patrones sin límites.
    </p>
  </div>

  <div style="display:flex;gap:14px;flex-wrap:wrap">
    ${plansHtml}
  </div>

  <div style="margin-top:20px;text-align:center">
    <p style="font-size:11px;color:var(--tx3,#9a8a75);margin:0">
      ¿Tienes un código de atelier?
      <button id="pw-atelier-btn" style="background:none;border:none;color:var(--acc,#b86b2e);font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:underline">
        Úsalo aquí
      </button>
    </p>
    <p style="font-size:10px;color:var(--tx3,#9a8a75);margin:8px 0 0">
      Los pagos están disponibles próximamente · Cancela cuando quieras
    </p>
  </div>

  <div id="pw-stripe-loading" style="display:none;text-align:center;margin-top:16px;font-size:12px;color:var(--tx3)">
    Redirigiendo a pago seguro…
  </div>
  <div id="pw-stripe-error" style="display:none;margin-top:12px;background:#f8717115;border:1px solid #f8717155;border-radius:8px;padding:8px 12px;font-size:11px;color:#b84040;text-align:center"></div>
</div>`;

    document.body.appendChild(_modal);

    // Botón atelier → abrir modal de atelier
    document.getElementById('pw-atelier-btn').onclick = () => {
      PAT.AtelierUI?.open();
    };

    // Botones de plan
    _modal.querySelectorAll('.pw-plan-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!STRIPE_ENABLED) return;
        _startCheckout(btn.dataset.priceId);
      });
    });
  }

  // ── Stripe Checkout ────────────────────────────────────────────
  function _loadStripe() {
    if (window.Stripe) { _stripe = Stripe(STRIPE_PK); return; }
    const s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/';
    s.onload = () => { _stripe = Stripe(STRIPE_PK); };
    document.head.appendChild(s);
  }

  async function _startCheckout(priceId) {
    const uid   = PAT.AuthTier?.getUserId();
    const email = PAT.AuthTier?.getUserEmail();
    const loadEl = document.getElementById('pw-stripe-loading');
    const errEl  = document.getElementById('pw-stripe-error');
    if (loadEl) loadEl.style.display = 'block';
    if (errEl)  errEl.style.display  = 'none';

    try {
      // En producción: llamar a tu backend para crear la sesión de Stripe
      // El backend crea la sesión con el uid como metadata para actualizar Firestore
      // tras el pago vía webhook.
      //
      // const res = await fetch('/api/create-checkout-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ priceId, uid, email,
      //     successUrl: location.origin + '/app?payment=success',
      //     cancelUrl:  location.origin + '/app?payment=cancel',
      //   }),
      // });
      // const { sessionId } = await res.json();
      // await _stripe.redirectToCheckout({ sessionId });

      // PLACEHOLDER — mostrar mensaje hasta activar Stripe
      throw new Error('Los pagos estarán disponibles muy pronto');
    } catch (e) {
      if (loadEl) loadEl.style.display = 'none';
      if (errEl) { errEl.textContent = e.message; errEl.style.display = 'block'; }
    }
  }

  // ── Verificar si hay que mostrar el paywall al cargar ──────────
  // Se llama desde loadTierFromFirestore() automáticamente.
  // También se puede llamar manualmente.
  function check() {
    if (PAT.AuthTier?.isInTrial() === false
      && PAT.AuthTier?.getTierId() === 'free'
      && PAT.AuthTier?.isLoggedIn()) {
      show();
    }
  }

  return { show, check };

})();
