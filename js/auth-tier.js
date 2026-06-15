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
    const loggedIn = isLoggedIn();
    badge.innerHTML = `
      <span>${tier.badge}</span>
      <span>${tier.name}</span>
      ${!loggedIn
        ? `<span style="background:#3b82f622;padding:1px 7px;border-radius:10px;font-size:9px;color:#60a5fa">Entrar →</span>`
        : _currentTier !== 'expert'
          ? `<span style="background:${tier.color}22;padding:1px 7px;border-radius:10px;font-size:9px">Mejorar ↑</span>`
          : ''
      }
    `;
    // Doble clic en badge → modal de cuenta
    badge.onclick = () => {
      if (isLoggedIn()) {
        showAccountModal();
      } else {
        showAuthModal();
      }
    };
  }

  // ── Modal de autenticación (login / registro) ─────────────────
  function showAuthModal(defaultTab = 'login') {
    const existing = document.getElementById('modal-auth');
    if (existing) { existing.classList.add('open'); return; }

    const modal = document.createElement('div');
    modal.id = 'modal-auth';
    modal.className = 'modal open';
    modal.innerHTML = `
      <div class="m-ov"></div>
      <div style="
        position:relative;z-index:1;
        background:var(--panel);border:1px solid var(--brd2);
        border-radius:16px;width:min(380px,95vw);
        box-shadow:0 24px 64px rgba(0,0,0,.8);overflow:hidden;
      ">
        <div style="display:flex;border-bottom:1px solid var(--brd);">
          <button id="auth-tab-login" style="
            flex:1;padding:14px;background:none;border:none;
            color:var(--tx);font-size:13px;font-weight:700;cursor:pointer;
            border-bottom:2px solid var(--acc);font-family:var(--font);
          ">Iniciar sesión</button>
          <button id="auth-tab-register" style="
            flex:1;padding:14px;background:none;border:none;
            color:var(--tx2);font-size:13px;font-weight:600;cursor:pointer;
            border-bottom:2px solid transparent;font-family:var(--font);
          ">Crear cuenta</button>
        </div>

        <div style="padding:24px;">
          <div id="auth-error" style="
            display:none;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);
            border-radius:8px;padding:8px 12px;font-size:12px;color:#f87171;margin-bottom:14px;
          "></div>

          <div style="display:flex;flex-direction:column;gap:12px;">
            <input id="auth-email" type="email" placeholder="Correo electrónico" style="
              background:var(--inp);border:1.5px solid var(--brd);color:var(--tx);
              border-radius:8px;padding:10px 14px;font-size:13px;font-family:var(--font);outline:none;
            " />
            <input id="auth-password" type="password" placeholder="Contraseña" style="
              background:var(--inp);border:1.5px solid var(--brd);color:var(--tx);
              border-radius:8px;padding:10px 14px;font-size:13px;font-family:var(--font);outline:none;
            " />
            <div id="auth-confirm-wrap" style="display:none;">
              <input id="auth-confirm" type="password" placeholder="Confirmar contraseña" style="
                width:100%;background:var(--inp);border:1.5px solid var(--brd);color:var(--tx);
                border-radius:8px;padding:10px 14px;font-size:13px;font-family:var(--font);outline:none;
                box-sizing:border-box;
              " />
            </div>
            <button id="auth-submit" style="
              background:linear-gradient(135deg,var(--acc),#6d28d9);color:#fff;
              border:none;border-radius:10px;padding:12px;font-size:13px;font-weight:700;
              cursor:pointer;font-family:var(--font);
            ">Iniciar sesión</button>
            <button id="auth-forgot" style="
              background:none;border:none;color:var(--tx3);font-size:11px;
              cursor:pointer;font-family:var(--font);
            ">¿Olvidaste tu contraseña?</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    let _tab = defaultTab;

    function switchTab(tab) {
      _tab = tab;
      const loginBtn = document.getElementById('auth-tab-login');
      const regBtn = document.getElementById('auth-tab-register');
      const confirmWrap = document.getElementById('auth-confirm-wrap');
      const submitBtn = document.getElementById('auth-submit');
      const forgotBtn = document.getElementById('auth-forgot');
      const errDiv = document.getElementById('auth-error');
      errDiv.style.display = 'none';

      if (tab === 'login') {
        loginBtn.style.borderBottomColor = 'var(--acc)';
        loginBtn.style.color = 'var(--tx)';
        regBtn.style.borderBottomColor = 'transparent';
        regBtn.style.color = 'var(--tx2)';
        confirmWrap.style.display = 'none';
        submitBtn.textContent = 'Iniciar sesión';
        forgotBtn.style.display = 'block';
      } else {
        regBtn.style.borderBottomColor = 'var(--acc)';
        regBtn.style.color = 'var(--tx)';
        loginBtn.style.borderBottomColor = 'transparent';
        loginBtn.style.color = 'var(--tx2)';
        confirmWrap.style.display = 'block';
        submitBtn.textContent = 'Crear cuenta';
        forgotBtn.style.display = 'none';
      }
    }

    document.getElementById('auth-tab-login').addEventListener('click', () => switchTab('login'));
    document.getElementById('auth-tab-register').addEventListener('click', () => switchTab('register'));
    modal.querySelector('.m-ov').addEventListener('click', () => modal.remove());

    document.getElementById('auth-submit').addEventListener('click', async () => {
      const email    = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      const confirm  = document.getElementById('auth-confirm')?.value;
      const errDiv   = document.getElementById('auth-error');
      const btn      = document.getElementById('auth-submit');

      if (!email || !password) { errDiv.textContent = 'Completa todos los campos'; errDiv.style.display = 'block'; return; }
      if (_tab === 'register' && password !== confirm) { errDiv.textContent = 'Las contraseñas no coinciden'; errDiv.style.display = 'block'; return; }

      btn.disabled = true;
      btn.textContent = 'Procesando…';
      errDiv.style.display = 'none';

      try {
        if (_tab === 'login') {
          await PAT.Firebase.signIn(email, password);
        } else {
          await PAT.Firebase.signUp(email, password);
        }
        modal.remove();
        if (window.PAT && PAT.App) PAT.App.toast('✅ Sesión iniciada', 'success');
      } catch (e) {
        const msgs = {
          'auth/wrong-password':    'Contraseña incorrecta',
          'auth/user-not-found':    'No existe cuenta con ese correo',
          'auth/email-already-in-use': 'Ese correo ya tiene cuenta. Inicia sesión.',
          'auth/weak-password':     'La contraseña debe tener al menos 6 caracteres',
          'auth/invalid-email':     'Correo no válido',
          'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
        };
        errDiv.textContent = msgs[e.code] || e.message;
        errDiv.style.display = 'block';
        btn.disabled = false;
        btn.textContent = _tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
      }
    });

    document.getElementById('auth-forgot').addEventListener('click', async () => {
      const email = document.getElementById('auth-email').value.trim();
      const errDiv = document.getElementById('auth-error');
      if (!email) { errDiv.textContent = 'Escribe tu correo primero'; errDiv.style.display = 'block'; return; }
      try {
        await PAT.Firebase.resetPassword(email);
        errDiv.style.display = 'none';
        if (PAT.App) PAT.App.toast('📧 Revisa tu correo para restablecer la contraseña', 'info');
        modal.remove();
      } catch (e) {
        errDiv.textContent = e.message;
        errDiv.style.display = 'block';
      }
    });

    if (defaultTab === 'register') switchTab('register');
  }

  // ── Modal de cuenta (usuario logueado) ───────────────────────
  function showAccountModal() {
    const email = getUserEmail() || '—';
    const tier  = TIERS[_currentTier];

    const modal = document.createElement('div');
    modal.className = 'modal open';
    modal.innerHTML = `
      <div class="m-ov"></div>
      <div style="
        position:relative;z-index:1;background:var(--panel);
        border:1px solid var(--brd2);border-radius:16px;
        width:min(320px,95vw);box-shadow:0 24px 64px rgba(0,0,0,.8);
        padding:24px;
      ">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:32px;margin-bottom:8px;">${tier.badge}</div>
          <div style="font-weight:700;font-size:15px;">${email}</div>
          <div style="color:${tier.color};font-size:12px;font-weight:600;margin-top:4px;">Plan ${tier.name}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${_currentTier !== 'expert' ? `
          <button id="acc-upgrade" style="
            background:linear-gradient(135deg,var(--acc),#6d28d9);color:#fff;
            border:none;border-radius:8px;padding:10px;font-size:12px;font-weight:700;
            cursor:pointer;font-family:var(--font);
          ">⭐ Mejorar plan</button>` : ''}
          <button id="acc-logout" style="
            background:var(--inp);border:1.5px solid var(--brd);color:var(--tx2);
            border-radius:8px;padding:10px;font-size:12px;font-weight:600;
            cursor:pointer;font-family:var(--font);
          ">Cerrar sesión</button>
          <button id="acc-close" style="
            background:none;border:none;color:var(--tx3);font-size:11px;
            cursor:pointer;font-family:var(--font);
          ">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.m-ov').addEventListener('click', () => modal.remove());
    document.getElementById('acc-close').addEventListener('click', () => modal.remove());
    document.getElementById('acc-upgrade')?.addEventListener('click', () => {
      modal.remove();
      if (PAT.PaymentUI) PAT.PaymentUI.showUpgradeModal();
    });
    document.getElementById('acc-logout').addEventListener('click', async () => {
      await PAT.Firebase.signOut();
      _currentTier = 'free';
      _sessionToken = null;
      _sessionPurchases = new Set();
      _renderBadge();
      modal.remove();
      if (PAT.App) PAT.App.toast('Sesión cerrada', 'info');
    });
  }

  function _loadTier() {
    return localStorage.getItem('pat_tier') || 'free';
  }

  // ── Firebase Auth — usuario actual ────────────────────────────
  function getUserId() {
    try {
      const auth = window.firebase && firebase.auth ? firebase.auth() : null;
      return auth && auth.currentUser ? auth.currentUser.uid : null;
    } catch (e) {
      return null;
    }
  }

  function getUserEmail() {
    try {
      const auth = window.firebase && firebase.auth ? firebase.auth() : null;
      return auth && auth.currentUser ? auth.currentUser.email : null;
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    return getUserId() !== null;
  }

  // ── Cargar tier desde Firestore (post-login) ──────────────────
  async function loadTierFromFirestore() {
    const uid = getUserId();
    if (!uid || !window.PAT.Firebase || !PAT.Firebase.ready) return;
    try {
      const db = firebase.firestore();
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        const tier = data.tier || 'free';
        if (tier !== 'free') {
          _currentTier = tier;
          _sessionToken = 'firestore_verified_' + uid;
          localStorage.setItem('pat_tier', tier);
          sessionStorage.setItem('pat_session_token', _sessionToken);
          _renderBadge();
          document.dispatchEvent(new CustomEvent('pat:tierChanged', { detail: { tier } }));
        }
      }
    } catch (e) {
      console.warn('[AuthTier] No se pudo cargar tier desde Firestore:', e.message);
    }
  }

  return {
    init, getTier, getTierId, getTiers, getPatternPrice,
    canUseGarment, canExportPDF, needsWatermark,
    hasAtelierPanel, hasCustomSeam,
    setTier, activateTier, registerPurchase,
    getUserId, getUserEmail, isLoggedIn, loadTierFromFirestore,
  };
})();
