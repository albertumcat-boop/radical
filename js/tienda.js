/**
 * tienda.js — PatrónAI Pro E-Commerce
 * Catálogo de patrones, cursos, packs y recursos.
 * Carrito en localStorage. Checkout vía Lemon Squeezy.
 */
(function () {
'use strict';

// ── Firebase config (mismo proyecto radicalpro) ───────────────────
const FB_CONFIG = {
  apiKey: "AIzaSyBkHlVJBXFBXFBXFBXFBXFBXFBXFBXFBXF",
  authDomain: "radicalpro.firebaseapp.com",
  projectId: "radicalpro",
};
let _db = null, _auth = null, _user = null, _userTier = 'free';
let _cart = [], _currentFilter = 'all', _searchQuery = '', _activeProduct = null;

// Descuento de afiliado activo
const _aff = (() => {
  try { return JSON.parse(localStorage.getItem('pat_aff') || 'null'); } catch { return null; }
})();

// ── SVG PREVIEWS ─────────────────────────────────────────────────
const SVGS = {
  franela: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <path d="M60,30 L30,70 L55,80 L55,190 L145,190 L145,80 L170,70 L140,30 L120,50 Q100,60 80,50 Z" fill="none" stroke="#8b5cf6" stroke-width="1.5"/>
    <line x1="60" y1="30" x2="140" y2="30" stroke="#a78bfa" stroke-width=".8" stroke-dasharray="4,3"/>
    <line x1="100" y1="50" x2="100" y2="190" stroke="#6d28d9" stroke-width=".6" stroke-dasharray="3,2"/>
    <text x="100" y="140" text-anchor="middle" font-size="9" fill="#5a5678" font-family="monospace">FRANELA</text>
    <text x="100" y="152" text-anchor="middle" font-size="7" fill="#3d3a55" font-family="monospace">DELANTERA</text>
  </svg>`,

  camisa: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <path d="M55,25 L25,75 L52,85 L52,195 L148,195 L148,85 L175,75 L145,25 L125,45 Q100,55 75,45 Z" fill="none" stroke="#8b5cf6" stroke-width="1.5"/>
    <path d="M75,45 Q100,30 125,45" fill="none" stroke="#a78bfa" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="52" y1="120" x2="148" y2="120" stroke="#3d3a55" stroke-width=".5" stroke-dasharray="2,3"/>
    <text x="100" y="160" text-anchor="middle" font-size="9" fill="#5a5678" font-family="monospace">CAMISA</text>
  </svg>`,

  blazer: `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
    <path d="M50,20 L20,80 L48,90 L48,210 L100,220 L152,210 L152,90 L180,80 L150,20 L120,50 L100,60 L80,50 Z" fill="none" stroke="#8b5cf6" stroke-width="1.5"/>
    <path d="M100,60 L100,220" stroke="#a78bfa" stroke-width=".8" stroke-dasharray="3,2"/>
    <path d="M100,80 Q90,100 88,130" fill="none" stroke="#6d28d9" stroke-width="1"/>
    <text x="100" y="170" text-anchor="middle" font-size="9" fill="#5a5678" font-family="monospace">BLAZER</text>
  </svg>`,

  pantalon: `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
    <path d="M40,20 L40,130 L30,250 L90,250 L100,150 L110,250 L170,250 L160,130 L160,20 Z" fill="none" stroke="#8b5cf6" stroke-width="1.5"/>
    <line x1="100" y1="20" x2="100" y2="150" stroke="#a78bfa" stroke-width=".8" stroke-dasharray="3,2"/>
    <line x1="40" y1="20" x2="160" y2="20" stroke="#6d28d9" stroke-width=".6" stroke-dasharray="4,3"/>
    <text x="70" y="200" text-anchor="middle" font-size="8" fill="#5a5678" font-family="monospace">IZQ</text>
    <text x="135" y="200" text-anchor="middle" font-size="8" fill="#5a5678" font-family="monospace">DER</text>
  </svg>`,

  vestido: `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
    <path d="M65,20 L45,75 L42,170 L30,250 L170,250 L158,170 L155,75 L135,20 Q100,35 65,20 Z" fill="none" stroke="#8b5cf6" stroke-width="1.5"/>
    <path d="M65,20 Q100,10 135,20" fill="none" stroke="#a78bfa" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="100" y1="20" x2="100" y2="250" stroke="#6d28d9" stroke-width=".5" stroke-dasharray="3,2"/>
    <line x1="42" y1="130" x2="158" y2="130" stroke="#3d3a55" stroke-width=".5" stroke-dasharray="2,3"/>
    <text x="100" y="200" text-anchor="middle" font-size="9" fill="#5a5678" font-family="monospace">VESTIDO</text>
  </svg>`,

  falda: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <path d="M60,30 L40,210 L160,210 L140,30 Z" fill="none" stroke="#8b5cf6" stroke-width="1.5"/>
    <line x1="60" y1="30" x2="140" y2="30" stroke="#a78bfa" stroke-width=".8" stroke-dasharray="4,3"/>
    <line x1="100" y1="30" x2="100" y2="210" stroke="#6d28d9" stroke-width=".5" stroke-dasharray="3,2"/>
    <text x="100" y="140" text-anchor="middle" font-size="9" fill="#5a5678" font-family="monospace">FALDA</text>
  </svg>`,

  curso: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="30" width="140" height="140" rx="12" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
    <circle cx="100" cy="90" r="28" fill="none" stroke="#fbbf24" stroke-width="1.5"/>
    <polygon points="92,78 92,102 116,90" fill="#fbbf24"/>
    <line x1="40" y1="140" x2="160" y2="140" stroke="#f59e0b" stroke-width=".8" stroke-dasharray="3,2"/>
    <text x="100" y="160" text-anchor="middle" font-size="9" fill="#78716c" font-family="monospace">CURSO</text>
  </svg>`,

  pack: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="60" width="100" height="120" rx="6" fill="none" stroke="#34d399" stroke-width="1.2"/>
    <rect x="50" y="40" width="100" height="120" rx="6" fill="none" stroke="#10b981" stroke-width="1.2"/>
    <rect x="80" y="20" width="100" height="120" rx="6" fill="none" stroke="#059669" stroke-width="1.2"/>
    <text x="100" y="170" text-anchor="middle" font-size="9" fill="#4a7c68" font-family="monospace">PACK</text>
  </svg>`,

  recurso: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="50" y="20" width="100" height="130" rx="4" fill="none" stroke="#60a5fa" stroke-width="1.5"/>
    <line x1="65" y1="55" x2="135" y2="55" stroke="#93c5fd" stroke-width="1"/>
    <line x1="65" y1="75" x2="135" y2="75" stroke="#93c5fd" stroke-width="1"/>
    <line x1="65" y1="95" x2="110" y2="95" stroke="#93c5fd" stroke-width="1"/>
    <line x1="65" y1="115" x2="125" y2="115" stroke="#93c5fd" stroke-width="1"/>
    <text x="100" y="175" text-anchor="middle" font-size="9" fill="#3b5a8a" font-family="monospace">RECURSO</text>
  </svg>`,
};

// ── CATÁLOGO DE PRODUCTOS ────────────────────────────────────────
const CATALOG = [
  // ═══ PATRONES ═══
  {
    id:'patron-franela',      cat:'patron',
    name:'Franela Básica Completa',
    shortDesc:'Espalda, delantera y manga corta en un solo set.',
    desc:'Set de patronaje completo para franela/camiseta básica unisex. Incluye espalda, delantera, manga corta y guía de armado. Adaptado a tus medidas desde la app.',
    price:1.99, oldPrice:null,
    svg:'franela', icon:'👕',
    features:['Espalda · Delantera · Manga','Sesgos de cuello incluidos','PDF escala 1:1 imprimible','Márgenes de costura marcados','Instrucciones de armado'],
    files:['patron_franela_espalda.pdf','patron_franela_delantera.pdf','patron_manga_corta.pdf','guia_armado.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_FRANELA',
    tier:null,
  },
  {
    id:'patron-camisa',       cat:'patron',
    name:'Camisa Clásica',
    shortDesc:'Camisa de vestir con cuello camisero y pechera.',
    desc:'Patronaje completo de camisa clásica de manga larga. Incluye todas las piezas: espalda, delantera, manga, cuello camisero, puño y pechera.',
    price:3.99, oldPrice:5.99,
    svg:'camisa', icon:'👔',
    features:['7 piezas completas','Cuello camisero y puño','Botones y ojales marcados','Tallas XS a 3XL','PDF A4 y A0'],
    files:['camisa_espalda.pdf','camisa_delantera.pdf','camisa_manga.pdf','camisa_cuello.pdf','camisa_puno.pdf','guia_confeccion.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_CAMISA',
    tier:null,
  },
  {
    id:'patron-blazer',       cat:'patron',
    name:'Blazer Sastre',
    shortDesc:'Blazer de corte estructurado con solapa y forro.',
    desc:'Patrón profesional de blazer de sastre. Corte estructurado con solapa muesca, bolsillos de pecho, forro completo y mangas con abertura.',
    price:5.99, oldPrice:9.99,
    svg:'blazer', icon:'🧥',
    features:['12 piezas + forro','Solapa y cuello sastre','Bolsillos marcados','Entretela indicada','Guía de sastre paso a paso'],
    files:['blazer_espalda.pdf','blazer_delantera.pdf','blazer_manga.pdf','blazer_solapa.pdf','blazer_forro.pdf','guia_sastre.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_BLAZER',
    tier:'expert',
  },
  {
    id:'patron-pantalon',     cat:'patron',
    name:'Pantalón Recto',
    shortDesc:'Pantalón de corte recto con pretina y pinzas.',
    desc:'Patrón de pantalón recto clásico. Incluye delantero con pinzas, trasero, pretina, bolsillos laterales y tiro frontal.',
    price:3.49, oldPrice:null,
    svg:'pantalon', icon:'👖',
    features:['Delantero y trasero','Pretina y cinturilla','Bolsillos laterales','Pinzas marcadas','Instrucciones de montaje'],
    files:['pantalon_delantera.pdf','pantalon_espalda.pdf','pantalon_pretina.pdf','pantalon_bolsillos.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_PANTALON',
    tier:'pro',
  },
  {
    id:'patron-vestido',      cat:'patron',
    name:'Vestido Cruzado',
    shortDesc:'Vestido envolvente con caída fluida y drapeado.',
    desc:'Patrón de vestido cruzado con escote en V y talle definido. Diseño clásico adaptable a diferentes telas y ocasiones.',
    price:4.49, oldPrice:6.99,
    svg:'vestido', icon:'👗',
    features:['Escote V cruzado','Talle ajustable','Mangas opcionales','Corte en sesgo indicado','2 largos: midi y maxi'],
    files:['vestido_delantera.pdf','vestido_espalda.pdf','vestido_manga.pdf','vestido_cinturon.pdf','guia_drapeado.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_VESTIDO',
    tier:'pro',
  },
  {
    id:'patron-falda',        cat:'patron',
    name:'Falda Lápiz Profesional',
    shortDesc:'Falda ajustada con abertura y cremallera invisible.',
    desc:'Patrón de falda lápiz clásica de alto a rodilla. Incluye delantero, trasero, pretina y cierre con cremallera invisible lateral.',
    price:2.99, oldPrice:null,
    svg:'falda', icon:'🩱',
    features:['Delantera y trasera','Pretina y forro','Cremallera invisible','Abertura posterior','Tallas XS–3XL'],
    files:['falda_delantera.pdf','falda_espalda.pdf','falda_pretina.pdf','falda_forro.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_FALDA',
    tier:null,
  },

  // ═══ CURSOS ═══
  {
    id:'curso-principiantes', cat:'curso',
    name:'Patronaje Desde Cero',
    shortDesc:'8 clases · Principiante · Certificado incluido',
    desc:'Aprende patronaje desde cero. Desde tomar medidas hasta crear tu primer patrón completo. Incluye material de trabajo, plantillas y acceso de por vida.',
    price:14.99, oldPrice:29.99,
    svg:'curso', icon:'🎓',
    features:['8 clases en video (HD)','Workbook PDF descargable','Plantillas y ejercicios','Certificado al completar','Acceso de por vida','Soporte por comunidad'],
    files:['clase_01_intro.mp4','clase_02_medidas.mp4','clase_03_herramientas.mp4','workbook_completo.pdf','plantillas_pack.zip'],
    lsVariantKey:'LS_VARIANT_CURSO_PRINCIPIANTES',
    tier:null, lessons:8, duration:'6h',
  },
  {
    id:'curso-avanzado',      cat:'curso',
    name:'Trazado Profesional',
    shortDesc:'12 clases · Intermedio · Proyecto final',
    desc:'Domina las técnicas de trazado profesional. Aprende a interpretar y adaptar patrones, trabajar con diferentes siluetas y crear tus propias variantes.',
    price:24.99, oldPrice:49.99,
    svg:'curso', icon:'📐',
    features:['12 clases avanzadas','Técnicas de graduación','Proyectos reales con guía','Retroalimentación personalizada','Plantillas premium','Comunidad privada'],
    files:['12_clases_video.zip','proyecto_final_guia.pdf','plantillas_avanzadas.zip','recursos_extra.pdf'],
    lsVariantKey:'LS_VARIANT_CURSO_AVANZADO',
    tier:null, lessons:12, duration:'10h',
  },
  {
    id:'curso-blazer',        cat:'curso',
    name:'Blazer de Sastre Completo',
    shortDesc:'6 clases · Avanzado · Proyecto blazer real',
    desc:'Crea un blazer de sastre profesional de principio a fin. Patronaje, corte, construcción, entretela, forro y terminaciones de alta costura.',
    price:29.99, oldPrice:59.99,
    svg:'blazer', icon:'✂️',
    features:['6 clases especializadas','Patrón blazer incluido','Técnicas de alta costura','Lista de materiales exacta','Video en HD 4K','Soporte directo'],
    files:['blazer_clases_6.zip','patron_blazer_premium.pdf','lista_materiales.pdf','bonus_entretela.pdf'],
    lsVariantKey:'LS_VARIANT_CURSO_BLAZER',
    tier:null, lessons:6, duration:'8h',
  },
  {
    id:'curso-patronaje-ia',  cat:'curso',
    name:'Patronaje con IA · PatrónAI Pro',
    shortDesc:'4 clases · Todos los niveles · App incluida',
    desc:'Domina PatrónAI Pro de principio a fin. Aprende a generar, modificar y exportar patrones profesionales usando la plataforma. Incluye suscripción Pro 1 mes.',
    price:9.99, oldPrice:19.99,
    svg:'curso', icon:'🤖',
    features:['4 clases en video','Suscripción Pro 1 mes incluida','Flujo completo de la app','Descarga e impresión 1:1','Plantillas de trabajo','Actualizaciones incluidas'],
    files:['clase_01_inicio.mp4','clase_02_prendas.mp4','clase_03_pdf.mp4','clase_04_atelier.mp4'],
    lsVariantKey:'LS_VARIANT_CURSO_IA',
    tier:null, lessons:4, duration:'3h',
  },

  // ═══ PACKS ═══
  {
    id:'pack-basico',         cat:'pack',
    name:'Pack Básico — 3 Patrones',
    shortDesc:'Franela + Falda + Pantalón · Ahorra 40%',
    desc:'Los tres patrones esenciales para comenzar tu guardarropa. Franela básica, falda lápiz y pantalón recto. Todo lo que necesitas para prendas del día a día.',
    price:4.99, oldPrice:8.47,
    svg:'pack', icon:'📦',
    features:['Franela Básica Completa','Falda Lápiz Profesional','Pantalón Recto','18 piezas en total','Ahorra un 41%','Instrucciones unificadas'],
    files:['pack_basico_todos_patrones.zip','guia_completa.pdf'],
    lsVariantKey:'LS_VARIANT_PACK_BASICO',
    tier:null, discount:41,
  },
  {
    id:'pack-femenino',       cat:'pack',
    name:'Pack Femenino — 5 Patrones',
    shortDesc:'Blusa + Falda + Vestido + Pantalón + Camisa · Ahorra 45%',
    desc:'El pack completo para moda femenina. Cinco patrones versátiles que cubren todas las ocasiones: trabajo, casual y noche.',
    price:12.99, oldPrice:23.95,
    svg:'pack', icon:'👗',
    features:['5 patrones premium','30+ piezas de patronaje','Guía de combinación','Consejos de telas','Tabla de tallas incluida','Soporte por comunidad'],
    files:['pack_femenino_5_patrones.zip','guia_moda_femenina.pdf','tabla_tallas_internacional.pdf'],
    lsVariantKey:'LS_VARIANT_PACK_FEMENINO',
    tier:null, discount:46,
  },
  {
    id:'pack-completo',       cat:'pack',
    name:'Pack Completo Pro — Todo',
    shortDesc:'6 patrones + 2 cursos + recursos · El mejor valor',
    desc:'Todo lo que necesitas para dominar el patronaje. Seis patrones, dos cursos introductorios y un pack de recursos. La inversión más inteligente.',
    price:39.99, oldPrice:79.99,
    svg:'pack', icon:'⭐',
    features:['6 patrones completos','Curso Patronaje Desde Cero','Curso con IA incluido','Pack de recursos profesionales','50% de ahorro','Soporte prioritario'],
    files:['pack_completo_patrones.zip','cursos_completos.zip','recursos_premium.zip'],
    lsVariantKey:'LS_VARIANT_PACK_COMPLETO',
    tier:null, discount:50,
  },

  // ═══ RECURSOS ═══
  {
    id:'recurso-medidas',     cat:'recurso',
    name:'Guía Profesional de Medidas',
    shortDesc:'Cómo tomar 24 medidas corporales con precisión',
    desc:'Guía ilustrada paso a paso para tomar medidas corporales con precisión profesional. Incluye 24 medidas, diagramas, tips y tabla de referencia.',
    price:2.99, oldPrice:null,
    svg:'recurso', icon:'📏',
    features:['24 medidas detalladas','Diagramas ilustrados','Tabla de referencia ISO','Versión imprimible','Actualizable gratis','Español e inglés'],
    files:['guia_medidas_profesional.pdf','tabla_referencia_rapida.pdf'],
    lsVariantKey:'LS_VARIANT_RECURSO_MEDIDAS',
    tier:null,
  },
  {
    id:'recurso-tallas',      cat:'recurso',
    name:'Tablas de Tallas Internacionales',
    shortDesc:'Equivalencias ISO · EU · US · UK · Brasil · México',
    desc:'Tabla completa de equivalencias de tallas para mujer, hombre y niño. Incluye tallas internacionales: ISO, EU, US, UK, Brasil, México y Colombia.',
    price:1.99, oldPrice:null,
    svg:'recurso', icon:'📊',
    features:['Mujer · Hombre · Niño','6 sistemas de tallas','Medidas en cm e in','Actualizado 2024','Imprimible tamaño carta','Versión digital y física'],
    files:['tablas_tallas_internacional.pdf'],
    lsVariantKey:'LS_VARIANT_RECURSO_TALLAS',
    tier:null,
  },
  {
    id:'recurso-glosario',    cat:'recurso',
    name:'Glosario Completo de Patronaje',
    shortDesc:'300+ términos técnicos ilustrados con ejemplos',
    desc:'Diccionario técnico de patronaje y costura con más de 300 términos. Ilustrado, con ejemplos prácticos y traducciones al inglés y portugués.',
    price:3.99, oldPrice:null,
    svg:'recurso', icon:'📚',
    features:['300+ términos técnicos','Ilustraciones por término','Traducciones EN / PT','Índice alfabético','Búsqueda digital (PDF)','Imprimible A5'],
    files:['glosario_patronaje_completo.pdf'],
    lsVariantKey:'LS_VARIANT_RECURSO_GLOSARIO',
    tier:null,
  },
  {
    id:'recurso-calculos',    cat:'recurso',
    name:'Hoja de Cálculos de Costura',
    shortDesc:'Calculadoras: tela, hilo, tiempo y costos',
    desc:'Pack de hojas de cálculo (Excel + Google Sheets) para gestionar proyectos de costura. Calcula tela necesaria, costo por prenda, tiempo y rentabilidad.',
    price:4.99, oldPrice:7.99,
    svg:'recurso', icon:'🧮',
    features:['Calculadora de tela','Estimador de costos','Control de inventario','Plantilla de presupuesto','Google Sheets + Excel','Instrucciones de uso'],
    files:['calculadora_tela.xlsx','calculadora_costos.xlsx','plantilla_google_sheets.gsheet','guia_uso.pdf'],
    lsVariantKey:'LS_VARIANT_RECURSO_CALCULOS',
    tier:null,
  },
];

// ── FIREBASE INIT ─────────────────────────────────────────────────
function _initFirebase() {
  try {
    // Usa la misma config del proyecto principal cargada previamente
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length === 0) {
      // Config inyectada desde window si existe
      const cfg = window.__PATRONAI_FB_CONFIG__ || {
        apiKey:"AIzaSyBkwexYdW6zaxpYFjzB6YcFb5c7zxGBEeY",
        authDomain:"radicalpro.firebaseapp.com",
        projectId:"radicalpro",
        storageBucket:"radicalpro.appspot.com",
        messagingSenderId:"123456789",
        appId:"1:123456789:web:abcdef"
      };
      firebase.initializeApp(cfg);
    }
    _db   = firebase.firestore ? firebase.firestore() : null;
    _auth = firebase.auth     ? firebase.auth()      : null;
    if (_auth) _auth.onAuthStateChanged(_onAuthChange);
  } catch(e) { console.warn('[Tienda] Firebase init omitido:', e.message); }
}

function _onAuthChange(user) {
  _user = user;
  if (user) {
    document.getElementById('nav-user-name').textContent = user.displayName || user.email?.split('@')[0] || '';
    _loadUserTier(user.uid);
  } else {
    document.getElementById('nav-user-name').textContent = '';
    _userTier = 'free';
    _renderTierNotice();
  }
}

async function _loadUserTier(uid) {
  if (!_db) return;
  try {
    const doc = await _db.collection('users').doc(uid).get();
    if (doc.exists) {
      const d = doc.data();
      const now = Date.now();
      const trialStart = d.trialStart?.toMillis ? d.trialStart.toMillis() : 0;
      const inTrial = trialStart && (now - trialStart) < 15 * 86400000;
      _userTier = inTrial ? 'expert' : (d.tier || 'free');
    }
  } catch(e) { console.warn('[Tienda] Tier load error:', e.message); }
  _renderTierNotice();
  _renderGrid();
}

// ── TIER NOTICE ───────────────────────────────────────────────────
function _renderTierNotice() {
  const el = document.getElementById('tier-notice');
  const txt = document.getElementById('tier-notice-text');
  if (!_user) { el.classList.remove('visible'); return; }
  if (_userTier === 'expert') {
    txt.innerHTML = '👑 Con tu plan Expert tienes acceso gratuito a los patrones marcados con <strong>★ Expert</strong>. <a href="/app">Ábrelos en la app</a>.';
    el.classList.add('visible');
  } else if (_userTier === 'pro') {
    txt.innerHTML = '⭐ Con tu plan Pro algunos patrones están incluidos gratis en la app. <a href="/app">Ir a la app</a>.';
    el.classList.add('visible');
  } else {
    el.classList.remove('visible');
  }
}

// ── CART ─────────────────────────────────────────────────────────
function _loadCart() {
  try { _cart = JSON.parse(localStorage.getItem('pat_cart') || '[]'); } catch { _cart = []; }
  _updateCartUI();
}
function _saveCart() {
  try { localStorage.setItem('pat_cart', JSON.stringify(_cart)); } catch {}
  _updateCartUI();
}
function _addToCart(productId) {
  const p = CATALOG.find(x => x.id === productId);
  if (!p) return;
  if (_cart.find(x => x.id === productId)) {
    _toast('Ya está en tu carrito', 'info'); return;
  }
  _cart.push({ id: p.id, name: p.name, price: _effectivePrice(p), icon: p.icon, cat: p.cat });
  _saveCart();
  _toast(`"${p.name}" agregado al carrito ✓`, 'success');
}
function _removeFromCart(productId) {
  _cart = _cart.filter(x => x.id !== productId);
  _saveCart();
}
function _effectivePrice(p) {
  let price = p.price;
  if (_aff && _aff.discount) price = price * (1 - _aff.discount / 100);
  return Math.max(0, parseFloat(price.toFixed(2)));
}
function _cartTotal() {
  return _cart.reduce((s, x) => s + x.price, 0).toFixed(2);
}
function _updateCartUI() {
  const count = _cart.length;
  const countEl = document.getElementById('cart-count');
  if (countEl) {
    countEl.textContent = count;
    countEl.className = 'cart-count' + (count > 0 ? ' visible' : '');
  }
  _renderCartDrawer();
}

// ── CART DRAWER ───────────────────────────────────────────────────
function _renderCartDrawer() {
  const el = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  if (!el) return;
  if (_cart.length === 0) {
    el.innerHTML = `<div class="cart-empty"><span class="cart-empty-icon">🛒</span>Tu carrito está vacío.<br>¡Explora nuestros productos!</div>`;
  } else {
    el.innerHTML = _cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-icon">${item.icon}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-type">${_catLabel(item.cat)}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
        </div>
        <button class="cart-item-remove" onclick="Shop.removeFromCart('${item.id}')" title="Eliminar">✕</button>
      </div>
    `).join('');
  }
  if (totalEl) totalEl.textContent = '$' + _cartTotal();
  const btn = document.getElementById('cart-checkout-btn');
  if (btn) btn.disabled = _cart.length === 0;
}

function _catLabel(cat) {
  return {patron:'Patrón digital',curso:'Curso en video',pack:'Pack de productos',recurso:'Recurso descargable'}[cat] || cat;
}

// ── PRODUCTS GRID ─────────────────────────────────────────────────
function _renderGrid() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  const filtered = _filteredProducts();
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="no-results">No se encontraron productos para "<em>${_searchQuery}</em>"</div>`;
    return;
  }
  // Group by category when showing all
  let html = '';
  if (_currentFilter === 'all' && !_searchQuery) {
    const groups = [
      { cat:'patron', label:'🧵 Patrones Digitales' },
      { cat:'curso',  label:'🎓 Cursos' },
      { cat:'pack',   label:'📦 Packs y Bundles' },
      { cat:'recurso',label:'📚 Recursos y Guías' },
    ];
    groups.forEach(g => {
      const items = filtered.filter(p => p.cat === g.cat);
      if (!items.length) return;
      html += `<div class="section-label" style="grid-column:1/-1;margin-top:${html?'16px':'0'}">${g.label}</div>`;
      html += items.map(_cardHTML).join('');
    });
  } else {
    html = filtered.map(_cardHTML).join('');
  }
  grid.innerHTML = html;
  document.getElementById('stat-products').textContent = CATALOG.length + '+';
}

function _filteredProducts() {
  return CATALOG.filter(p => {
    const matchCat  = _currentFilter === 'all' || p.cat === _currentFilter;
    const q = _searchQuery.toLowerCase();
    const matchSrch = !q || p.name.toLowerCase().includes(q) || p.shortDesc.toLowerCase().includes(q) || p.cat.includes(q);
    return matchCat && matchSrch;
  });
}

function _cardHTML(p) {
  const price = _effectivePrice(p);
  const isInCart = _cart.some(x => x.id === p.id);
  const tierBadge = p.tier
    ? `<span class="card-free-tag">${p.tier === 'expert' ? '★ Expert' : '★ Pro'}</span>`
    : '';
  const discountBadge = p.discount ? `<span class="card-discount">-${p.discount}%</span>` :
                        (p.oldPrice ? `<span class="card-discount">-${Math.round((1-p.price/p.oldPrice)*100)}%</span>` : '');
  const metaItems = p.lessons
    ? `<span class="card-meta-item">📹 ${p.lessons} clases</span><span class="card-meta-item">⏱ ${p.duration}</span>`
    : p.files ? `<span class="card-meta-item">📄 ${p.files.length} archivos</span>` : '';

  return `<div class="product-card" onclick="Shop.openModal('${p.id}')">
    <div class="card-preview">
      ${SVGS[p.svg] || SVGS.recurso}
      <span class="card-badge badge-${p.cat}">${_catLabel(p.cat)}</span>
      ${tierBadge || discountBadge}
    </div>
    <div class="card-body">
      <div class="card-name">${p.name}</div>
      <div class="card-desc">${p.shortDesc}</div>
      <div class="card-meta">${metaItems}</div>
    </div>
    <div class="card-footer">
      <div class="card-price">
        <span class="price-current">$${price.toFixed(2)}</span>
        ${p.oldPrice ? `<span class="price-old">$${p.oldPrice.toFixed(2)}</span>` : ''}
      </div>
      <button class="buy-btn${isInCart?' outline':''}" onclick="event.stopPropagation();Shop.addToCart('${p.id}')">
        ${isInCart ? '✓ En carrito' : 'Agregar'}
      </button>
    </div>
  </div>`;
}

// ── PRODUCT MODAL ─────────────────────────────────────────────────
function openModal(productId) {
  const p = CATALOG.find(x => x.id === productId);
  if (!p) return;
  _activeProduct = p;
  const price = _effectivePrice(p);
  const modal = document.getElementById('product-modal');

  document.getElementById('modal-preview').innerHTML =
    `<button class="modal-close" onclick="Shop.closeModal()">✕</button>
     <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">${SVGS[p.svg] || SVGS.recurso}</div>`;

  document.getElementById('modal-badges').innerHTML =
    `<span class="card-badge badge-${p.cat}">${_catLabel(p.cat)}</span>
     ${p.tier ? `<span class="card-badge badge-${p.tier==='expert'?'patron':'recurso'}">${p.tier==='expert'?'★ Expert':'★ Pro'}</span>` : ''}
     ${p.lessons ? `<span class="card-badge badge-recurso">📹 ${p.lessons} clases · ${p.duration}</span>` : ''}`;

  document.getElementById('modal-title').textContent = p.name;
  document.getElementById('modal-desc').textContent  = p.desc;

  document.getElementById('modal-features').innerHTML = p.features
    .map(f => `<div class="modal-feature"><span class="modal-feature-icon">✓</span>${f}</div>`).join('');

  document.getElementById('modal-price').textContent = '$' + price.toFixed(2);
  const oldEl = document.getElementById('modal-price-old');
  if (p.oldPrice) { oldEl.textContent = '$' + p.oldPrice.toFixed(2); oldEl.style.display = 'block'; }
  else oldEl.style.display = 'none';

  const noteEl = document.getElementById('modal-price-note');
  const isInCart = _cart.some(x => x.id === p.id);
  noteEl.textContent = '• Descarga inmediata  • PDF escala 1:1  • Licencia personal';

  const buyBtn = document.getElementById('modal-buy-btn');
  if (isInCart) {
    buyBtn.textContent = '✓ Ya está en tu carrito';
    buyBtn.onclick = () => { closeModal(); toggleCart(); };
  } else {
    buyBtn.textContent = '🛒 Agregar al carrito';
    buyBtn.onclick = () => { addToCart(p.id); buyBtn.textContent = '✓ En carrito'; };
  }

  const inclEl = document.getElementById('modal-includes');
  if (p.files && p.files.length) {
    inclEl.style.display = 'block';
    document.getElementById('modal-file-list').innerHTML = p.files.map(f => {
      const ext = f.split('.').pop().toUpperCase();
      const icons = {PDF:'📄',MP4:'📹',ZIP:'📦',XLSX:'📊',GSHEET:'📊'};
      return `<div class="modal-file"><span class="modal-file-icon">${icons[ext]||'📎'}</span>${f}</div>`;
    }).join('');
  } else {
    inclEl.style.display = 'none';
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('product-modal').classList.remove('open');
  document.body.style.overflow = '';
  _activeProduct = null;
}

// ── CART DRAWER TOGGLE ────────────────────────────────────────────
function toggleCart() {
  document.getElementById('cart-drawer').classList.toggle('open');
  document.getElementById('cart-overlay').classList.toggle('open');
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
}

function addToCart(id) { _addToCart(id); _renderGrid(); }
function removeFromCart(id) { _removeFromCart(id); _renderGrid(); }

// ── CHECKOUT ──────────────────────────────────────────────────────
async function checkout() {
  if (_cart.length === 0) return;
  if (!_user) {
    _toast('Inicia sesión para comprar', 'info');
    setTimeout(() => window.location.href = '/app?redirect=tienda', 1200);
    return;
  }
  const btn = document.getElementById('cart-checkout-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

  try {
    const items = _cart.map(c => {
      const p = CATALOG.find(x => x.id === c.id);
      return { variantKey: p.lsVariantKey, productId: p.id, name: p.name, price: c.price };
    });
    const res = await fetch('/api/create-cart-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        uid:        _user.uid,
        email:      _user.email,
        affCode:    _aff?.code || null,
        returnUrl:  window.location.href,
      }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Error al iniciar pago');
    }
  } catch(e) {
    _toast('Error al procesar pago: ' + e.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Pagar ahora →'; }
  }
}

// ── FILTER & SEARCH ───────────────────────────────────────────────
function filter(cat, el) {
  _currentFilter = cat;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  _renderGrid();
}
function search(q) {
  _searchQuery = q;
  _renderGrid();
}

// ── TOAST ─────────────────────────────────────────────────────────
function _toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ── INIT ──────────────────────────────────────────────────────────
function _init() {
  _initFirebase();
  _loadCart();
  _renderGrid();
  // Check ?payment=success
  if (new URLSearchParams(location.search).get('payment') === 'success') {
    _cart = []; _saveCart();
    _toast('¡Pago exitoso! Revisa tu email para acceder a tus descargas.', 'success');
  }
  // Afiliado banner
  if (_aff) {
    document.getElementById('aff-code-display').textContent = _aff.code + ' (−' + _aff.discount + '%)';
    document.getElementById('aff-banner').classList.add('visible');
  }
  // Close modal on overlay click
  document.getElementById('product-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}

document.addEventListener('DOMContentLoaded', _init);

// ── PUBLIC API ────────────────────────────────────────────────────
window.Shop = { openModal, closeModal, toggleCart, closeCart, addToCart, removeFromCart, checkout, filter, search };

})();
