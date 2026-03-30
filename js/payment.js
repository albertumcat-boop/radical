'use strict';
window.PAT = window.PAT || {};

PAT.PaymentUI = (function () {

  // ── CSS de los modales ─────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('payment-styles')) return;
    const style = document.createElement('style');
    style.id = 'payment-styles';
    style.textContent = `
      /* ── Upgrade Modal ── */
      #modal-upgrade {z-index:800}
      .upgrade-box {
        position:relative;z-index:1;
        background:var(--panel);
        border:1px solid var(--brd2);
        border-radius:16px;
        width:min(880px,96vw);
        max-height:92vh;
        overflow-y:auto;
        box-shadow:0 24px 64px rgba(0,0,0,.8);
      }
      .upgrade-header {
        padding:28px 28px 0;
        text-align:center;
      }
      .upgrade-header h2 {
        font-size:22px;font-weight:800;
        background:linear-gradient(135deg,#ede9fe,#8b5cf6);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;
        background-clip:text;margin-bottom:8px;
      }
      .upgrade-header p {
        color:var(--tx2);font-size:13px;margin-bottom:24px;
      }
      .upgrade-close {
        position:absolute;top:16px;right:16px;
        background:var(--inp);border:1px solid var(--brd);
        color:var(--tx2);border-radius:8px;
        width:32px;height:32px;cursor:pointer;font-size:16px;
        display:flex;align-items:center;justify-content:center;
        transition:all .15s;
      }
      .upgrade-close:hover {background:var(--hov);color:var(--tx)}

      /* Tier cards */
      .tier-grid {
        display:grid;grid-template-columns:repeat(3,1fr);
        gap:14px;padding:0 28px 20px;
      }
      @media(max-width:680px){.tier-grid{grid-template-columns:1fr}}

      .tier-c {
        border-radius:12px;overflow:hidden;
        border:1.5px solid var(--brd);
        transition:transform .2s,box-shadow .2s;
        position:relative;background:var(--inp);
      }
      .tier-c:hover {transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.4)}
      .tier-c.featured {border-color:var(--acc);box-shadow:0 0 0 1px var(--acc)}
      .tier-c.featured::before {
        content:'⭐ MÁS POPULAR';
        display:block;background:var(--acc);
        color:#fff;font-size:10px;font-weight:800;
        text-align:center;padding:5px;letter-spacing:.8px;
      }

      .tier-top {
        padding:22px 18px 16px;text-align:center;
        border-bottom:1px solid var(--brd);
      }
      .tier-top .t-icon {font-size:32px;display:block;margin-bottom:8px}
      .tier-top h3 {font-size:17px;font-weight:800;margin-bottom:6px}
      .tier-top .t-price {font-size:30px;font-weight:900;line-height:1}
      .tier-top .t-period {font-size:11px;color:var(--tx3);margin-top:3px}

      .tier-feats {
        list-style:none;padding:16px 18px;
        font-size:12px;color:var(--tx2);
        display:flex;flex-direction:column;gap:7px;
      }
      .tier-feats li {display:flex;align-items:center;gap:8px}
      .tier-feats li span.f-check {color:#34d399;font-size:13px;flex-shrink:0}
      .tier-feats li span.f-no    {color:var(--tx3);font-size:13px;flex-shrink:0}

      .tier-action {padding:14px 18px 18px}
      .tier-action button {
        width:100%;padding:11px;border-radius:8px;border:none;
        font-size:13px;font-weight:700;cursor:pointer;
        transition:all .15s;font-family:var(--font);
      }
      .tier-action .t-btn-primary {
        background:linear-gradient(135deg,var(--acc),#6d28d9);
        color:#fff;box-shadow:0 4px 16px rgba(139,92,246,.4);
      }
      .tier-action .t-btn-primary:hover {filter:brightness(1.12);transform:translateY(-1px)}
      .tier-action .t-btn-outline {
        background:transparent;color:var(--tx2);
        border:1.5px solid var(--brd);
      }
      .tier-action .t-btn-outline:hover {background:var(--hov);color:var(--tx)}
      .tier-action .t-btn-current {
        background:var(--hov);color:var(--tx3);cursor:default;
      }

      .upgrade-footer {
        padding:16px 28px 24px;
        display:flex;align-items:center;justify-content:center;
        gap:8px;flex-wrap:wrap;
      }
      .upgrade-footer span {
        font-size:11px;color:var(--tx3);
        display:flex;align-items:center;gap:4px;
      }
      .upgrade-footer .sep {color:var(--brd2)}

      .demo-note {
        margin:0 28px 20px;
        background:rgba(139,92,246,.06);
        border:1px solid rgba(139,92,246,.2);
        border-radius:8px;padding:10px 14px;
        font-size:11px;color:var(--acc2);
        display:flex;align-items:center;gap:8px;
      }

      /* ── Paywall Modal ── */
      #modal-paywall {z-index:800}
      .paywall-box {
        position:relative;z-index:1;
        background:var(--panel);
        border:1px solid var(--brd2);
        border-radius:16px;
        width:min(400px,95vw);
        box-shadow:0 24px 64px rgba(0,0,0,.8);
        overflow:hidden;
      }
      .pw-header {
        background:linear-gradient(135deg,rgba(139,92,246,.15),rgba(109,40,217,.08));
        padding:28px 24px 22px;text-align:center;
        border-bottom:1px solid var(--brd);
      }
      .pw-lock {font-size:36px;display:block;margin-bottom:10px}
      .pw-header h3 {font-size:17px;font-weight:800;margin-bottom:4px}
      .pw-header p  {font-size:12px;color:var(--acc2);font-weight:600}

      .pw-price-block {
        margin:20px 24px;
        background:var(--inp);border:1px solid var(--brd);
        border-radius:10px;padding:16px;text-align:center;
      }
      .pw-original {text-decoration:line-through;color:var(--tx3);font-size:13px}
      .pw-discount {
        background:var(--grn);color:#000;
        font-size:10px;font-weight:800;padding:2px 8px;
        border-radius:10px;display:inline-block;margin:4px 0;
      }
      .pw-final {font-size:36px;font-weight:900;color:var(--tx);line-height:1}
      .pw-final small {font-size:14px;color:var(--tx2);font-weight:400}
      .pw-desc {font-size:11px;color:var(--tx3);margin-top:6px}

      .pw-aff {
        display:flex;gap:8px;margin:0 24px 6px;
      }
      .pw-aff input {
        flex:1;background:var(--inp);border:1.5px solid var(--brd);
        color:var(--tx);border-radius:8px;padding:8px 12px;
        font-size:12px;font-family:var(--mono);text-transform:uppercase;outline:none;
        transition:border-color .15s;
      }
      .pw-aff input:focus {border-color:var(--acc)}
      .pw-aff button {
        background:var(--inp);border:1.5px solid var(--brd);
        color:var(--tx2);border-radius:8px;padding:8px 14px;
        font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;
      }
      .pw-aff button:hover {background:var(--hov);color:var(--grn);border-color:var(--grn)}
      #pw-aff-msg {min-height:16px;font-size:10px;padding:0 24px 2px;color:var(--tx3)}

      .pw-actions {padding:0 24px 20px;display:flex;flex-direction:column;gap:8px}
      .pw-pay-btn {
        background:linear-gradient(135deg,var(--acc),#6d28d9);
        color:#fff;border:none;border-radius:10px;
        padding:13px;font-size:13px;font-weight:700;
        cursor:pointer;transition:all .15s;font-family:var(--font);
        box-shadow:0 4px 16px rgba(139,92,246,.4);
        display:flex;align-items:center;justify-content:center;gap:8px;
      }
      .pw-pay-btn:hover {filter:brightness(1.1);transform:translateY(-1px)}
      .pw-pay-btn:disabled {opacity:.6;cursor:wait;transform:none}
      .pw-upgrade-btn {
        background:transparent;color:var(--acc2);
        border:1.5px solid rgba(139,92,246,.3);border-radius:10px;
        padding:10px;font-size:12px;font-weight:600;cursor:pointer;
        transition:all .15s;font-family:var(--font);
      }
      .pw-upgrade-btn:hover {background:var(--accbg)}
      .pw-cancel-btn {
        background:none;border:none;color:var(--tx3);
        font-size:11px;cursor:pointer;padding:4px;
        font-family:var(--font);
      }
      .pw-cancel-btn:hover {color:var(--tx)}
      .pw-security {
        padding:12px 24px 18px;
        border-top:1px solid var(--brd);
        font-size:10px;color:var(--tx3);text-align:center;
      }
      .pw-security span {margin:0 6px}

      /* Processing overlay */
      .processing-overlay {
        position:absolute;inset:0;
        background:rgba(12,12,20,.85);
        backdrop-filter:blur(4px);
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:14px;z-index:10;border-radius:16px;
      }
      .processing-spinner {
        width:44px;height:44px;border-radius:50%;
        border:3px solid var(--brd);
        border-top-color:var(--acc);
        animation:spin .8s linear infinite;
      }
      @keyframes spin{to{transform:rotate(360deg)}}
      .processing-text {font-size:13px;color:var(--tx2);font-weight:600}
    `;
    document.head.appendChild(style);
  }

  // ── Modal de Upgrade ─────────────────────────────────────────
  function showUpgradeModal() {
    _injectStyles();
    const existing = document.getElementById('modal-upgrade');
    if (existing) { existing.classList.add('open'); return; }

    const tiers   = PAT.AuthTier.getTiers();
    const current = PAT.AuthTier.getTierId();

    const modal = document.createElement('div');
    modal.id        = 'modal-upgrade';
    modal.className = 'modal open';

    const tierData = [
      {
        id:'free', icon:'🆓', name:'Básico', price:'Gratis', period:'siempre',
        featured:false,
        feats:[
          {ok:true,  txt:'Franela básica'},
          {ok:true,  txt:'Falda recta'},
          {ok:true,  txt:'Vista 3D'},
          {ok:false, txt:'PDF con marca DEMO'},
          {ok:false, txt:'Blusas / Camisas / Vestidos'},
          {ok:false, txt:'Panel Atelier'},
        ]
      },
      {
        id:'pro', icon:'⭐', name:'Pro', price:'$9.99', period:'/mes USD',
        featured:true,
        feats:[
          {ok:true, txt:'Todas las prendas'},
          {ok:true, txt:'PDF limpio sin marca'},
          {ok:true, txt:'Ajuste de márgenes'},
          {ok:true, txt:'50 patrones guardados'},
          {ok:true, txt:'Exportación ilimitada'},
          {ok:false,txt:'Panel Atelier'},
        ]
      },
      {
        id:'expert', icon:'👑', name:'Expert', price:'$24.99', period:'/mes USD',
        featured:false,
        feats:[
          {ok:true, txt:'Todo lo de Pro'},
          {ok:true, txt:'Panel Atelier completo'},
          {ok:true, txt:'Gestión de clientes'},
          {ok:true, txt:'Código de referido'},
          {ok:true, txt:'500 patrones guardados'},
          {ok:true, txt:'Marca del atelier en PDF'},
        ]
      },
    ];

    modal.innerHTML = `
      <div class="m-ov"></div>
      <div class="upgrade-box">
        <button class="upgrade-close" id="close-upgrade">✕</button>

        <div class="upgrade-header">
          <h2>🧵 Elige tu plan</h2>
          <p>Accede a todas las herramientas de patronaje profesional</p>
        </div>

        <div class="tier-grid">
          ${tierData.map(t => `
            <div class="tier-c ${t.featured ? 'featured' : ''}">
              <div class="tier-top">
                <span class="t-icon">${t.icon}</span>
                <h3>${t.name}</h3>
                <div class="t-price">${t.price}</div>
                <div class="t-period">${t.period}</div>
              </div>
              <ul class="tier-feats">
                ${t.feats.map(f => `
                  <li>
                    <span class="${f.ok ? 'f-check' : 'f-no'}">${f.ok ? '✓' : '✕'}</span>
                    <span style="color:${f.ok ? 'var(--tx2)' : 'var(--tx3)'}">${f.txt}</span>
                  </li>
                `).join('')}
              </ul>
              <div class="tier-action">
                ${current === t.id
                  ? `<button class="t-btn-current" disabled>Plan actual</button>`
                  : t.id === 'free'
                    ? `<button class="t-btn-outline tier-select" data-tier="free">Seleccionar</button>`
                    : `<button class="t-btn-primary tier-select" data-tier="${t.id}">Suscribirse →</button>`
                }
              </div>
            </div>
          `).join('')}
        </div>

        <div class="demo-note">
          <span>🧪</span>
          <span><strong>Modo demo:</strong> los pagos son simulados. En producción se integra con Stripe.</span>
        </div>

        <div class="upgrade-footer">
          <span>🔒 Pago seguro</span>
          <span class="sep">·</span>
          <span>↩ Cancela cuando quieras</span>
          <span class="sep">·</span>
          <span>💬 Soporte en español</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('close-upgrade').addEventListener('click', () => {
      modal.classList.remove('open');
    });
    modal.querySelector('.m-ov').addEventListener('click', () => {
      modal.classList.remove('open');
    });

    modal.querySelectorAll('.tier-select').forEach(btn => {
      btn.addEventListener('click', () => _processUpgrade(btn.dataset.tier, modal));
    });
  }

  async function _processUpgrade(tierId, modal) {
    if (tierId === 'free') {
      PAT.AuthTier.setTier('free');
      modal.classList.remove('open');
      if (PAT.App) PAT.App.toast('Plan Básico activo', 'info');
      return;
    }

    // Mostrar overlay de procesamiento
    const box = modal.querySelector('.upgrade-box');
    const overlay = document.createElement('div');
    overlay.className = 'processing-overlay';
    overlay.innerHTML = `
      <div class="processing-spinner"></div>
      <div class="processing-text">Procesando pago…</div>
      <div style="font-size:11px;color:var(--tx3)">Simulando integración con Stripe</div>
    `;
    box.style.position = 'relative';
    box.appendChild(overlay);

    // HOOK STRIPE:
    // const res = await fetch('/api/create-checkout-session', {
    //   method:'POST', headers:{'Content-Type':'application/json'},
    //   body: JSON.stringify({ priceId: STRIPE_PRICES[tierId], userId: PAT.AuthTier.getUserId() })
    // });
    // const { sessionId } = await res.json();
    // Stripe(STRIPE_PK).redirectToCheckout({ sessionId });

    await new Promise(r => setTimeout(r, 2000));

    overlay.remove();
    PAT.AuthTier.setTier(tierId);
    modal.classList.remove('open');
    const names = { pro:'Pro ⭐', expert:'Expert 👑' };
    if (PAT.App) PAT.App.toast(`🎉 Plan ${names[tierId]} activado`, 'success');
  }

  // ── Modal de Paywall (pago por patrón) ───────────────────────
  function showPatternPaywall(garmentType, onSuccess) {
    _injectStyles();
    const existing = document.getElementById('modal-paywall');
    if (existing) existing.remove();

    const garmentNames = {
      franela:'Franela Básica', falda:'Falda Recta',
      blusa:'Blusa con Pinzas', camisa:'Camisa', vestido:'Vestido Básico',
    };

    const price      = PAT.AuthTier.getPatternPrice(garmentType);
    const affiliate  = PAT.Affiliate ? PAT.Affiliate.getActiveCode() : null;
    const discount   = affiliate && PAT.Affiliate ? PAT.Affiliate.getDiscount() : 0;
    const finalPrice = +(price * (1 - discount / 100)).toFixed(2);

    const modal = document.createElement('div');
    modal.id        = 'modal-paywall';
    modal.className = 'modal open';

    modal.innerHTML = `
      <div class="m-ov"></div>
      <div class="paywall-box">

        <div class="pw-header">
          <span class="pw-lock">🔒</span>
          <h3>Descargar Patrón</h3>
          <p>${garmentNames[garmentType] || garmentType}</p>
        </div>

        <div class="pw-price-block">
          ${discount > 0 ? `
            <div class="pw-original">$${price.toFixed(2)} USD</div>
            <div class="pw-discount">−${discount}% código atelier</div>
          ` : ''}
          <div class="pw-final">$${finalPrice.toFixed(2)} <small>USD</small></div>
          <div class="pw-desc">Descarga única · PDF escala 1:1 · Impresión ilimitada</div>
        </div>

        <div class="pw-aff">
          <input type="text" id="pw-aff-input"
                 placeholder="Código de atelier (opcional)"
                 value="${affiliate || ''}" />
          <button id="pw-aff-apply">Aplicar</button>
        </div>
        <div id="pw-aff-msg"></div>

        <div class="pw-actions">
          <button class="pw-pay-btn" id="pw-pay">
            💳 Pagar $${finalPrice.toFixed(2)} y descargar
          </button>
          <button class="pw-upgrade-btn" id="pw-upgrade">
            ⭐ Suscribirme a Pro — descarga todo sin límites
          </button>
          <button class="pw-cancel-btn" id="pw-cancel">Cancelar</button>
        </div>

        <div class="pw-security">
          <span>🔒 Stripe</span>
          <span>·</span>
          <span>No guardamos datos de tarjeta</span>
          <span>·</span>
          <span>Compra protegida</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const payBtn  = document.getElementById('pw-pay');
    const affMsg  = document.getElementById('pw-aff-msg');
    let _finalPrice = finalPrice;

    // Aplicar código de afiliado
    document.getElementById('pw-aff-apply').addEventListener('click', () => {
      const code = document.getElementById('pw-aff-input').value.trim().toUpperCase();
      if (!code || !PAT.Affiliate) return;
      PAT.Affiliate.applyCode(code).then(r => {
        if (affMsg) {
          affMsg.textContent = r.message;
          affMsg.style.color = r.valid ? 'var(--grn)' : 'var(--red)';
        }
        if (r.valid) {
          _finalPrice = +(price * (1 - r.discount / 100)).toFixed(2);
          payBtn.innerHTML = `💳 Pagar $${_finalPrice.toFixed(2)} y descargar`;
        }
      });
    });

    // Pagar
    payBtn.addEventListener('click', async () => {
      payBtn.disabled = true;
      payBtn.innerHTML = `<div class="processing-spinner" style="width:18px;height:18px;border-width:2px"></div> Procesando…`;

      // HOOK STRIPE PAYMENT INTENT:
      // const res = await fetch('/api/create-payment-intent', {
      //   method:'POST', headers:{'Content-Type':'application/json'},
      //   body: JSON.stringify({ amount: Math.round(_finalPrice*100), garment: garmentType })
      // });

      await new Promise(r => setTimeout(r, 2000));

      PAT.AuthTier.registerPurchase(garmentType);
      if (PAT.Affiliate) PAT.Affiliate.logCommission(garmentType, _finalPrice);

      modal.remove();
      if (PAT.App) PAT.App.toast('✅ Pago exitoso — descargando…', 'success');
      if (typeof onSuccess === 'function') setTimeout(onSuccess, 400);
    });

    // Upgrade
    document.getElementById('pw-upgrade').addEventListener('click', () => {
      modal.remove();
      showUpgradeModal();
    });

    // Cancelar
    document.getElementById('pw-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('.m-ov').addEventListener('click', () => modal.remove());
  }

  return { showUpgradeModal, showPatternPaywall };
})();
