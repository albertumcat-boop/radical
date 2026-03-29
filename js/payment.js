/**
 * payment.js
 * Motor de pagos (simulado). Contiene los hooks para Stripe/PayPal.
 *
 * ARQUITECTURA DE PAGOS:
 *
 *  [Frontend] → [Vercel Serverless Function /api/create-checkout]
 *             → [Stripe API]
 *             → [Webhook /api/stripe-webhook]
 *             → [Firebase Firestore] (actualiza tier del usuario)
 *             → [Frontend] (recibe tier actualizado)
 *
 * NUNCA incluir stripe.secretKey en el frontend.
 * La clave pública (publishableKey) sí puede estar aquí.
 */

'use strict';
window.PAT = window.PAT || {};

PAT.PaymentUI = (function () {

  // ── Configuración de Stripe (solo clave PÚBLICA) ─────────────────
  // HOOK: Reemplaza con tu clave pública de Stripe
  // const STRIPE_PK = 'pk_live_XXXXXXXXXXXXXXXXXXXXXXXX';
  // const stripe = Stripe(STRIPE_PK);  // requiere <script src="https://js.stripe.com/v3/">

  // ── Precios de Stripe (IDs de Price) ─────────────────────────────
  // HOOK: Crear estos productos en tu dashboard de Stripe
  // https://dashboard.stripe.com/products
  const STRIPE_PRICES = {
    pro:     'price_XXXXXXXXXX_pro_monthly',     // $9.99/mes
    expert:  'price_XXXXXXXXXX_expert_monthly',  // $24.99/mes
    pattern_single: 'price_XXXXXXXXXX_pattern',  // $0.99-$1.99 por patrón
  };

  // ── PayPal (alternativa) ──────────────────────────────────────────
  // HOOK: https://developer.paypal.com/sdk/js/
  // <script src="https://www.paypal.com/sdk/js?client-id=TU_CLIENT_ID&currency=USD">
  // paypal.Buttons({ createOrder: ..., onApprove: ... }).render('#paypal-button')

  // ─────────────────────────────────────────────────────────────────
  // MODAL DE UPGRADE (planes de suscripción)
  // ─────────────────────────────────────────────────────────────────
  function showUpgradeModal() {
    const existing = document.getElementById('modal-upgrade');
    if (existing) { existing.style.display = 'flex'; return; }

    const tiers = PAT.AuthTier.getTiers();
    const currentTier = PAT.AuthTier.getTierId();

    const modal = document.createElement('div');
    modal.id = 'modal-upgrade';
    modal.className = 'modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content upgrade-modal">
        <button class="modal-close-btn" id="close-upgrade">✕</button>
        <div class="upgrade-header">
          <h2>🧵 Desbloquea PatrónAI Pro</h2>
          <p class="upgrade-subtitle">Elige el plan que se adapta a tu taller</p>
        </div>

        <div class="tier-cards">

          <!-- FREE -->
          <div class="tier-card ${currentTier === 'free' ? 'current' : ''}">
            <div class="tier-card-header" style="border-color:#64748b">
              <span class="tier-emoji">🆓</span>
              <h3>Básico</h3>
              <div class="tier-price">Gratis</div>
              <div class="tier-price-sub">siempre</div>
            </div>
            <ul class="tier-features">
              <li>✅ Franela básica</li>
              <li>✅ Falda recta</li>
              <li>✅ Vista 3D</li>
              <li>⚠️ PDF con marca DEMO</li>
              <li>❌ Blusas / Camisas / Vestidos</li>
              <li>❌ Panel Atelier</li>
            </ul>
            ${currentTier === 'free'
              ? '<div class="tier-current-badge">Plan actual</div>'
              : `<button class="action-btn ghost tier-select-btn" data-tier="free">Seleccionar</button>`}
          </div>

          <!-- PRO -->
          <div class="tier-card featured ${currentTier === 'pro' ? 'current' : ''}">
            <div class="tier-popular-badge">⭐ MÁS POPULAR</div>
            <div class="tier-card-header" style="border-color:#7c3aed">
              <span class="tier-emoji">⭐</span>
              <h3>Pro</h3>
              <div class="tier-price">$9.99</div>
              <div class="tier-price-sub">/ mes USD</div>
            </div>
            <ul class="tier-features">
              <li>✅ Todas las prendas</li>
              <li>✅ PDF limpio (sin marca)</li>
              <li>✅ Ajuste de márgenes</li>
              <li>✅ 50 patrones guardados</li>
              <li>✅ Exportación ilimitada</li>
              <li>❌ Panel Atelier</li>
            </ul>
            ${currentTier === 'pro'
              ? '<div class="tier-current-badge">Plan actual</div>'
              : `<button class="action-btn primary tier-select-btn" data-tier="pro"
                   style="background:#7c3aed">Suscribirse ↗</button>`}
          </div>

          <!-- EXPERT -->
          <div class="tier-card ${currentTier === 'expert' ? 'current' : ''}">
            <div class="tier-card-header" style="border-color:#f59e0b">
              <span class="tier-emoji">👑</span>
              <h3>Expert</h3>
              <div class="tier-price">$24.99</div>
              <div class="tier-price-sub">/ mes USD</div>
            </div>
            <ul class="tier-features">
              <li>✅ Todo lo de Pro</li>
              <li>✅ Panel Atelier completo</li>
              <li>✅ Gestión de clientes</li>
              <li>✅ Código de referido</li>
              <li>✅ 500 patrones guardados</li>
              <li>✅ Marca del atelier en PDF</li>
            </ul>
            ${currentTier === 'expert'
              ? '<div class="tier-current-badge">Plan actual</div>'
              : `<button class="action-btn secondary tier-select-btn" data-tier="expert"
                   style="border-color:#f59e0b;color:#f59e0b">Suscribirse ↗</button>`}
          </div>

        </div>

        <!-- Nota de demostración -->
        <div class="upgrade-demo-note">
          <span>🧪</span>
          <span>Modo demo: selecciona cualquier plan para simularlo localmente.</span>
        </div>

        <!-- Garantía -->
        <div class="upgrade-guarantee">
          🔒 Pago seguro · Cancela cuando quieras · Soporte en español
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Cerrar
    modal.querySelector('#close-upgrade').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    modal.querySelector('.modal-backdrop').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Seleccionar tier
    modal.querySelectorAll('.tier-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = btn.dataset.tier;
        initiateCheckout(tier, modal);
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // INICIAR CHECKOUT
  // ─────────────────────────────────────────────────────────────────
  async function initiateCheckout(tierId, modal) {
    if (tierId === 'free') {
      PAT.AuthTier.setTier('free');
      modal.style.display = 'none';
      PAT.App.toast('Plan Básico activado', 'info');
      return;
    }

    // ── SIMULACIÓN (reemplazar con Stripe real) ───────────────────
    const btn = modal.querySelector(`[data-tier="${tierId}"]`);
    if (btn) {
      btn.textContent = '⏳ Procesando…';
      btn.disabled = true;
    }

    // HOOK STRIPE CHECKOUT:
    // ─────────────────────────────────────────────────────────────
    // Opción A: Stripe Checkout (hosted page)
    //
    // const res = await fetch('/api/create-checkout-session', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     priceId:  STRIPE_PRICES[tierId],
    //     userId:   PAT.AuthTier.getUserId(),
    //     tier:     tierId,
    //     affiliate: PAT.Affiliate.getActiveCode(),
    //     discount:  PAT.Affiliate.getDiscount(),
    //   })
    // });
    // const { sessionId } = await res.json();
    // const stripe = Stripe(STRIPE_PK);
    // await stripe.redirectToCheckout({ sessionId });
    //
    // Opción B: Stripe Payment Element (embebido)
    // const { clientSecret } = await res.json();
    // const elements = stripe.elements({ clientSecret });
    // elements.create('payment').mount('#payment-element');
    // ─────────────────────────────────────────────────────────────

    // Simulación: esperar 1.5s y activar el tier
    await new Promise(r => setTimeout(r, 1500));

    PAT.AuthTier.setTier(tierId);
    if (modal) modal.style.display = 'none';

    const tierNames = { pro: 'Pro ⭐', expert: 'Expert 👑' };
    PAT.App.toast(`🎉 ¡Plan ${tierNames[tierId]} activado!`, 'success');

    // Recargar UI para reflejar el nuevo tier
    document.dispatchEvent(new CustomEvent('pat:tierChanged', { detail: { tier: tierId } }));
  }

  // ─────────────────────────────────────────────────────────────────
  // MODAL DE PAGO POR PATRÓN (micropago)
  // ─────────────────────────────────────────────────────────────────
  function showPatternPaywall(garmentType, onSuccess) {
    const existing = document.getElementById('modal-paywall');
    if (existing) existing.remove();

    const price        = PAT.AuthTier.getPatternPrice(garmentType);
    const affiliate    = PAT.Affiliate.getActiveCode();
    const discount     = affiliate ? PAT.Affiliate.getDiscount() : 0;
    const finalPrice   = +(price * (1 - discount / 100)).toFixed(2);
    const garmentNames = {
      franela: 'Franela Básica', falda: 'Falda Recta',
      blusa: 'Blusa con Pinzas', camisa: 'Camisa', vestido: 'Vestido Básico',
    };

    const modal = document.createElement('div');
    modal.id = 'modal-paywall';
    modal.className = 'modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content paywall-modal">
        <div class="paywall-icon">🔒</div>
        <h2>Descargar Patrón</h2>
        <p class="paywall-garment">${garmentNames[garmentType] || garmentType}</p>

        <div class="paywall-price-box">
          ${discount > 0 ? `
            <div class="paywall-original-price">$${price.toFixed(2)} USD</div>
            <div class="paywall-discount-badge">−${discount}% código atelier</div>
          ` : ''}
          <div class="paywall-final-price">$${finalPrice.toFixed(2)} <span>USD</span></div>
          <div class="paywall-note">Descarga única · PDF escala 1:1 · Impresión ilimitada</div>
        </div>

        <!-- Código de atelier -->
        <div class="paywall-affiliate">
          <input type="text" id="paywall-affiliate-input"
                 placeholder="Código de atelier (opcional)"
                 value="${affiliate || ''}" />
          <button id="paywall-apply-code" class="action-btn ghost" style="padding:6px 10px;font-size:11px">
            Aplicar
          </button>
        </div>
        <div id="paywall-affiliate-msg" style="font-size:11px;margin-top:4px;min-height:16px"></div>

        <div class="paywall-actions">
          <button class="action-btn primary" id="paywall-pay-btn" style="width:100%">
            💳 Pagar $${finalPrice.toFixed(2)} y descargar
          </button>

          <!-- HOOK PayPal: descomentar al integrar SDK -->
          <!-- <div id="paypal-button-container" style="margin-top:8px"></div> -->

          <button class="action-btn ghost" id="paywall-upgrade-btn"
                  style="width:100%;font-size:11px;margin-top:6px">
            ⭐ Suscribirme a Pro y descargar todo sin límites
          </button>
          <button class="action-btn ghost" id="paywall-cancel-btn" style="width:100%;font-size:11px">
            Cancelar
          </button>
        </div>

        <div class="paywall-security">
          🔒 Pago seguro · Stripe · No guardamos datos de tarjeta
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Aplicar código de afiliado desde el paywall
    const affiliateInput = modal.querySelector('#paywall-affiliate-input');
    const affiliateMsg   = modal.querySelector('#paywall-affiliate-msg');
    const payBtn         = modal.querySelector('#paywall-pay-btn');

    modal.querySelector('#paywall-apply-code').addEventListener('click', () => {
      const code = affiliateInput.value.trim().toUpperCase();
      const result = PAT.Affiliate.applyCode(code);
      if (result.valid) {
        affiliateMsg.textContent = `✅ ${result.message}`;
        affiliateMsg.style.color = 'var(--green)';
        const d = result.discount;
        const fp = +(price * (1 - d / 100)).toFixed(2);
        payBtn.textContent = `💳 Pagar $${fp.toFixed(2)} y descargar`;
      } else {
        affiliateMsg.textContent = `❌ ${result.message}`;
        affiliateMsg.style.color = 'var(--red)';
      }
    });

    // Pagar
    payBtn.addEventListener('click', async () => {
      await processPatternPayment(garmentType, finalPrice, modal, onSuccess);
    });

    // Upgrade a Pro
    modal.querySelector('#paywall-upgrade-btn').addEventListener('click', () => {
      modal.remove();
      showUpgradeModal();
    });

    // Cancelar
    modal.querySelector('#paywall-cancel-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-backdrop').addEventListener('click', () => modal.remove());
  }

  // ─────────────────────────────────────────────────────────────────
  // PROCESAR PAGO DE PATRÓN
  // ─────────────────────────────────────────────────────────────────
  async function processPatternPayment(garmentType, amount, modal, onSuccess) {
    const payBtn = modal.querySelector('#paywall-pay-btn');
    payBtn.textContent = '⏳ Procesando pago…';
    payBtn.disabled = true;

    // HOOK STRIPE PAYMENT INTENT:
    // ─────────────────────────────────────────────────────────────
    // const res = await fetch('/api/create-payment-intent', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     amount:    Math.round(amount * 100),  // en centavos
    //     currency:  'usd',
    //     garment:   garmentType,
    //     userId:    PAT.AuthTier.getUserId(),
    //     affiliate: PAT.Affiliate.getActiveCode(),
    //   })
    // });
    // const { clientSecret } = await res.json();
    //
    // const stripe   = Stripe(STRIPE_PK);
    // const elements = stripe.elements({ clientSecret });
    // const card     = elements.create('card');
    // card.mount('#card-element');
    //
    // const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);
    // if (error) { alert(error.message); return; }
    // if (paymentIntent.status === 'succeeded') { ... }
    // ─────────────────────────────────────────────────────────────

    // Simulación
    await new Promise(r => setTimeout(r, 1800));

    // Registrar compra
    PAT.AuthTier.registerPurchase(garmentType);

    // Registrar comisión para el afiliado
    PAT.Affiliate.logCommission(garmentType, amount);

    modal.remove();
    PAT.App.toast(`✅ Pago exitoso — descargando patrón…`, 'success');

    // Ejecutar callback de éxito (dispara la descarga del PDF)
    if (typeof onSuccess === 'function') {
      setTimeout(onSuccess, 400);
    }
  }

  return { showUpgradeModal, showPatternPaywall, initiateCheckout };
})();
