/**
 * tienda.js — PatrónAI Pro E-Commerce
 * Catálogo de patrones, cursos, packs y recursos.
 * Carrito en localStorage. Checkout vía Lemon Squeezy.
 */
(function () {
'use strict';

// ── Firebase config ────────────────────────────────────────────────
// (inicializado en _initFirebase con window.__PATRONAI_FB_CONFIG__ o fallback)
let _db = null, _auth = null, _user = null, _userTier = 'free';
let _cart = [], _currentFilter = 'all', _searchQuery = '', _activeProduct = null;
let _products = []; // se inicializa tras la declaración de CATALOG
let _purchasedIds = new Set(); // IDs de productos ya comprados por el usuario

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

// Normalizar CATALOG: asegurar campos que Firestore sí tiene
// (debe estar DESPUÉS de la declaración de CATALOG)
const CATALOG_NORMALIZED = CATALOG.map((p, i) => ({
  published: true, sortOrder: i + 1,
  coverImage: null, gallery: [], videoPreview: null, videoLessons: [],
  ...p,
}));
_products = [...CATALOG_NORMALIZED];

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
    // Cargar productos desde Firestore (con imágenes y videos reales)
    _loadFirestoreProducts().catch(() => {});
  } catch(e) { console.warn('[Tienda] Firebase init omitido:', e.message); }
}

async function _loadFirestoreProducts() {
  if (!_db) return;
  try {
    // Sin where+orderBy combinados para evitar requerir índice compuesto.
    // Filtramos published y ordenamos en cliente.
    const snap = await _db.collection('products').get();
    if (snap.empty) return;
    const fsProducts = snap.docs
      .map(d => ({ ...d.data(), id: d.id }))
      .filter(p => p.published !== false)
      .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
    // Merge: CATALOG_NORMALIZED como base (tiene SVG fallback), Firestore gana en campos reales
    _products = fsProducts.map(fp => {
      const local = CATALOG_NORMALIZED.find(c => c.id === fp.id) || {};
      return { ...local, ...fp };
    });
    // Productos solo en Firestore (creados desde el admin, sin equivalente local)
    fsProducts.forEach(fp => {
      if (!_products.find(p => p.id === fp.id)) _products.push(fp);
    });
    _renderGrid();
  } catch(e) { console.warn('[Tienda] Firestore productos:', e.message); }
}

function _onAuthChange(user) {
  _user = user;
  if (user) {
    document.getElementById('nav-user-name').textContent = user.displayName || user.email?.split('@')[0] || '';
    _loadUserTier(user.uid);
    _loadPurchases(user.uid);
  } else {
    document.getElementById('nav-user-name').textContent = '';
    _userTier = 'free';
    _purchasedIds = new Set();
    _renderTierNotice();
    _renderGrid();
  }
}

async function _loadPurchases(uid) {
  if (!_db) return;
  try {
    // Filtramos status en cliente para evitar requerir índice compuesto uid+status
    const snap = await _db.collection('orders').where('uid', '==', uid).get();
    _purchasedIds = new Set();
    snap.docs
      .filter(d => d.data().status === 'paid')
      .forEach(d => {
        (d.data().productIds || []).forEach(pid => _purchasedIds.add(pid));
      });
    _renderGrid();
  } catch(e) { console.warn('[Tienda] purchases:', e.message); }
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
  const p = _products.find(x => x.id === productId);
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
  return {patron:'Patrón digital',curso:'Curso en video',video:'Video curso',pack:'Pack de productos',recurso:'Recurso descargable'}[cat] || cat;
}

// ── PRODUCTS GRID ─────────────────────────────────────────────────
function _renderGrid() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  const filtered = _filteredProducts();
  if (filtered.length === 0) {
    const _safeQ = _searchQuery.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    grid.innerHTML = `<div class="no-results">No se encontraron productos para "<em>${_safeQ}</em>"</div>`;
    return;
  }
  // Group by category when showing all
  let html = '';
  if (_currentFilter === 'all' && !_searchQuery) {
    const groups = [
      { cat:'patron', label:'🧵 Patrones Digitales' },
      { cat:'curso',  label:'🎓 Cursos' },
      { cat:'video',  label:'🎬 Video Cursos' },
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
  document.getElementById('stat-products').textContent = _products.length + '+';
}

function _filteredProducts() {
  return _products.filter(p => {
    const matchCat  = _currentFilter === 'all' || p.cat === _currentFilter;
    const q = _searchQuery.toLowerCase();
    const matchSrch = !q || p.name.toLowerCase().includes(q) || (p.shortDesc||'').toLowerCase().includes(q) || p.cat.includes(q);
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

  // Media: imagen real si existe, si no SVG
  const media = p.coverImage
    ? `<img src="${p.coverImage}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:0" loading="lazy">`
    : (SVGS[p.svg] || SVGS.recurso);

  // Video badge encima de la imagen
  const videoBadge = (p.videoPreview || p.cat === 'video')
    ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:48px;height:48px;border-radius:50%;background:rgba(42,32,24,.65);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-size:20px;pointer-events:none">▶</div>`
    : '';

  const popularBadge = p.popular ? `<span class="card-popular">⭐ Popular</span>` : '';

  return `<div class="product-card" onclick="Shop.openModal('${p.id}')">
    <div class="card-preview">
      ${media}
      ${videoBadge}
      <span class="card-badge badge-${p.cat}">${_catLabel(p.cat)}</span>
      ${tierBadge || discountBadge}
      ${popularBadge}
    </div>
    <div class="card-body">
      <div class="card-name">${p.name}</div>
      <div class="card-desc">${p.shortDesc||''}</div>
      <div class="card-meta">${metaItems}</div>
    </div>
    <div class="card-footer">
      <div class="card-price">
        ${_purchasedIds.has(p.id)
          ? `<span style="color:#2a9d5c;font-weight:700;font-size:.85rem">✓ Comprado</span>`
          : `<span class="price-current">$${price.toFixed(2)}</span>${p.oldPrice ? `<span class="price-old">$${p.oldPrice.toFixed(2)}</span>` : ''}`
        }
      </div>
      ${_purchasedIds.has(p.id)
        ? `<button class="buy-btn" style="background:#2a9d5c" onclick="event.stopPropagation();Shop.openModal('${p.id}')">Descargar</button>`
        : `<button class="buy-btn${isInCart?' outline':''}" onclick="event.stopPropagation();Shop.addToCart('${p.id}')">${isInCart ? '✓ En carrito' : 'Agregar'}</button>`
      }
    </div>
  </div>`;
}

// ── PRODUCT MODAL ─────────────────────────────────────────────────
function openModal(productId) {
  const p = _products.find(x => x.id === productId);
  if (!p) return;
  _activeProduct = p;
  const price = _effectivePrice(p);
  const modal = document.getElementById('product-modal');

  // ── Media section: gallery + video ──────────────────────────────
  const allImages = [];
  if (p.coverImage) allImages.push(p.coverImage);
  if (Array.isArray(p.gallery)) p.gallery.filter(Boolean).forEach(u => allImages.push(u));

  let mediaHTML = '';
  if (p.videoPreview) {
    // Video embed as main media
    mediaHTML = `<div style="position:relative;width:100%;padding-bottom:56.25%;background:#111">
      <iframe src="${p.videoPreview}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"
        allow="autoplay;encrypted-media" allowfullscreen></iframe>
    </div>`;
  } else if (allImages.length > 0) {
    mediaHTML = `<div style="position:relative;width:100%;background:#1a1612;overflow:hidden" id="modal-main-img-wrap">
      <img id="modal-main-img" src="${allImages[0]}" alt="${p.name}"
        style="width:100%;max-height:340px;object-fit:contain;display:block">
    </div>`;
    if (allImages.length > 1) {
      mediaHTML += `<div style="display:flex;gap:6px;padding:8px 16px;overflow-x:auto;background:#f5f0e8">
        ${allImages.map((u,i) => `<img src="${u}" onclick="document.getElementById('modal-main-img').src='${u}'"
          style="width:60px;height:60px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid ${i===0?'#D4603A':'transparent'};flex-shrink:0">`).join('')}
      </div>`;
    }
  } else {
    // SVG fallback
    mediaHTML = `<div style="width:100%;height:220px;display:flex;align-items:center;justify-content:center">${SVGS[p.svg] || SVGS.recurso}</div>`;
  }

  // Video lessons list (if any)
  let lessonsHTML = '';
  if (Array.isArray(p.videoLessons) && p.videoLessons.length) {
    lessonsHTML = `<div style="margin-top:16px">
      <div style="font-weight:700;font-size:.85rem;letter-spacing:.06em;text-transform:uppercase;color:#7B5CF6;margin-bottom:8px">Contenido del curso</div>
      ${p.videoLessons.map((l,i) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:.875rem">
        <span style="color:${l.free?'#D4603A':'#999'};font-size:1rem">${l.free?'▶':'🔒'}</span>
        <span style="flex:1">${i+1}. ${l.title||''}</span>
        ${l.duration?`<span style="color:#999;font-size:.8rem">${l.duration}</span>`:''}
      </div>`).join('')}
    </div>`;
  }

  document.getElementById('modal-preview').innerHTML =
    `<button class="modal-close" onclick="Shop.closeModal()">✕</button>${mediaHTML}`;

  // Insert lessons below description (create or reuse element)
  let lessonsEl = document.getElementById('modal-lessons');
  if (!lessonsEl) {
    lessonsEl = document.createElement('div');
    lessonsEl.id = 'modal-lessons';
    const descEl = document.getElementById('modal-desc');
    descEl.parentNode.insertBefore(lessonsEl, descEl.nextSibling);
  }
  lessonsEl.innerHTML = lessonsHTML;

  document.getElementById('modal-badges').innerHTML =
    `<span class="card-badge badge-${p.cat}">${_catLabel(p.cat)}</span>
     ${p.tier ? `<span class="card-badge badge-${p.tier==='expert'?'patron':'recurso'}">${p.tier==='expert'?'★ Expert':'★ Pro'}</span>` : ''}
     ${p.lessons ? `<span class="card-badge badge-recurso">📹 ${p.lessons} clases · ${p.duration}</span>` : ''}
     ${Array.isArray(p.videoLessons)&&p.videoLessons.length ? `<span class="card-badge badge-recurso">📹 ${p.videoLessons.length} lecciones</span>` : ''}`;

  document.getElementById('modal-title').textContent = p.name;
  document.getElementById('modal-desc').textContent  = p.desc||'';

  document.getElementById('modal-features').innerHTML = (p.features||[])
    .map(f => `<div class="modal-feature"><span class="modal-feature-icon">✓</span>${f}</div>`).join('');

  document.getElementById('modal-price').textContent = '$' + price.toFixed(2);
  const oldEl = document.getElementById('modal-price-old');
  if (p.oldPrice) { oldEl.textContent = '$' + p.oldPrice.toFixed(2); oldEl.style.display = 'block'; }
  else oldEl.style.display = 'none';

  const noteEl = document.getElementById('modal-price-note');
  const isInCart = _cart.some(x => x.id === p.id);
  const hasPurchased = _purchasedIds.has(p.id);

  const buyBtn = document.getElementById('modal-buy-btn');
  const inclEl = document.getElementById('modal-includes');

  if (hasPurchased) {
    // Usuario ya compró — mostrar área de descarga real
    noteEl.textContent = '✓ Producto en tu biblioteca · Descarga disponible';
    noteEl.style.color = '#2a9d5c';
    buyBtn.style.display = 'none';

    inclEl.style.display = 'block';
    const icons = {PDF:'📄',MP4:'📹',ZIP:'📦',XLSX:'📊',GSHEET:'📊'};
    const fileLinks = (p.files || []).map(f => {
      const ext = f.split('.').pop().toUpperCase();
      // downloadUrl viene del campo fileUrls en Firestore si existe, si no mostramos nombre
      const url = (p.fileUrls && p.fileUrls[f]) ? p.fileUrls[f] : null;
      return url
        ? `<a class="modal-file" href="${url}" target="_blank" download style="text-decoration:none;color:inherit">
             <span class="modal-file-icon">${icons[ext]||'📎'}</span>${f}
             <span style="margin-left:auto;font-size:.75rem;color:#D4603A">⬇ Descargar</span>
           </a>`
        : `<div class="modal-file"><span class="modal-file-icon">${icons[ext]||'📎'}</span>${f}</div>`;
    }).join('');

    document.getElementById('modal-file-list').innerHTML = fileLinks ||
      `<div style="color:#666;font-size:.875rem;padding:8px 0">Descarga disponible en tu email de confirmación.</div>`;

  } else {
    // No comprado — flujo normal de carrito
    noteEl.textContent = '• Descarga inmediata  • PDF escala 1:1  • Licencia personal';
    noteEl.style.color = '';
    buyBtn.style.display = '';

    if (isInCart) {
      buyBtn.textContent = '✓ Ya está en tu carrito';
      buyBtn.onclick = () => { closeModal(); toggleCart(); };
    } else {
      buyBtn.textContent = '🛒 Agregar al carrito';
      buyBtn.onclick = () => { addToCart(p.id); buyBtn.textContent = '✓ En carrito'; };
    }

    if (p.files && p.files.length) {
      inclEl.style.display = 'block';
      const icons = {PDF:'📄',MP4:'📹',ZIP:'📦',XLSX:'📊',GSHEET:'📊'};
      document.getElementById('modal-file-list').innerHTML = p.files.map(f => {
        const ext = f.split('.').pop().toUpperCase();
        return `<div class="modal-file"><span class="modal-file-icon">${icons[ext]||'📎'}</span>${f}</div>`;
      }).join('');
    } else {
      inclEl.style.display = 'none';
    }
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

// ── CHECKOUT — pago manual (WhatsApp) ────────────────────────────
const _WA_NUM  = '584129376303';
const _PAYMENT_METHODS = {
  pago_movil:    { label: 'Pago Móvil',       info: 'Banco: Bancamiga · Tlf: 0412-9376303 · C.I: 21103679' },
  binance:       { label: 'Binance Pay',       info: 'Email: albert.umcat@gmail.com' },
  zelle:         { label: 'Zelle',             info: 'Te enviamos los datos por WhatsApp al confirmar' },
  transferencia: { label: 'Transferencia',     info: 'Te enviamos los datos por WhatsApp al confirmar' },
};

function checkout() {
  if (_cart.length === 0) return;
  if (!_user) {
    _toast('Inicia sesión para comprar', 'info');
    setTimeout(() => window.location.href = '/app?redirect=tienda', 1200);
    return;
  }
  _openPayModal();
}

function _openPayModal() {
  let existing = document.getElementById('pay-modal-overlay');
  if (existing) existing.remove();

  const total = _cartTotal();
  const itemsHtml = _cart.map(c => {
    const p = _products.find(x => x.id === c.id);
    return `<div class="pay-item"><span>${p ? p.name : c.id}</span><span>$${c.price.toFixed(2)}</span></div>`;
  }).join('');

  const methodsHtml = Object.entries(_PAYMENT_METHODS).map(([key, m]) =>
    `<label class="pay-method">
      <input type="radio" name="pay-method" value="${key}" ${key === 'pago_movil' ? 'checked' : ''}>
      <div class="pay-method-body">
        <strong>${m.label}</strong>
        <span>${m.info}</span>
      </div>
    </label>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.id = 'pay-modal-overlay';
  overlay.innerHTML = `
    <div class="pay-modal">
      <div class="pay-modal-header">
        <h3>Confirmar pedido</h3>
        <button class="pay-modal-close" onclick="Shop.closePayModal()">✕</button>
      </div>
      <div class="pay-items">${itemsHtml}</div>
      <div class="pay-total">Total: <strong>$${total}</strong></div>
      <div class="pay-section-title">Método de pago</div>
      <div class="pay-methods">${methodsHtml}</div>
      <div class="pay-method-detail" id="pay-detail"></div>
      <div class="pay-note">Al hacer clic en "Enviar pedido" se abrirá WhatsApp con el resumen. Envíanos la captura del comprobante en ese mismo chat.</div>
      <button class="pay-submit-btn" id="pay-submit-btn" onclick="Shop.submitPayOrder()">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.853L.057 23.57a.5.5 0 0 0 .614.614l5.717-1.475A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.895 0-3.668-.523-5.184-1.432l-.372-.218-3.394.875.892-3.394-.234-.383A9.961 9.961 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        Enviar pedido por WhatsApp
      </button>
    </div>`;

  overlay.addEventListener('click', e => { if (e.target === overlay) Shop.closePayModal(); });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
}

function closePayModal() {
  const el = document.getElementById('pay-modal-overlay');
  if (el) { el.classList.remove('open'); setTimeout(() => el.remove(), 250); }
}

async function submitPayOrder() {
  const methodEl = document.querySelector('input[name="pay-method"]:checked');
  if (!methodEl) { _toast('Selecciona un método de pago', 'info'); return; }
  const method = methodEl.value;
  const methodInfo = _PAYMENT_METHODS[method];

  const btn = document.getElementById('pay-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

  const items = _cart.map(c => {
    const p = _products.find(x => x.id === c.id);
    return { productId: c.id, name: p ? p.name : c.id, price: c.price };
  });
  const total = _cartTotal();

  // Guardar pedido en Firestore con status pending
  if (_db) {
    try {
      await _db.collection('orders').add({
        uid:        _user.uid,
        email:      _user.email,
        productIds: items.map(i => i.productId),
        items:      items,
        total:      parseFloat(total),
        metodoPago: method,
        status:     'pending',
        fecha:      firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      _toast('Error al registrar pedido. Verifica tu conexión.', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.853L.057 23.57a.5.5 0 0 0 .614.614l5.717-1.475A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.895 0-3.668-.523-5.184-1.432l-.372-.218-3.394.875.892-3.394-.234-.383A9.961 9.961 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg> Enviar pedido por WhatsApp'; }
      return;
    }
  }

  // Construir mensaje WhatsApp
  let msg = `🧵 *PEDIDO PATRONAI PRO*\n`;
  msg += `─────────────────────\n`;
  msg += `👤 *Cliente:* ${_user.displayName || _user.email}\n`;
  msg += `📧 Email: ${_user.email}\n`;
  msg += `─────────────────────\n`;
  msg += `🛒 *Productos:*\n`;
  items.forEach(i => { msg += `  • ${i.name} — $${i.price.toFixed(2)}\n`; });
  msg += `─────────────────────\n`;
  msg += `💵 *Total: $${total}*\n`;
  msg += `💳 *Método de pago:* ${methodInfo.label}\n`;
  if (method !== 'zelle' && method !== 'transferencia') {
    msg += `   ${methodInfo.info}\n`;
  }
  msg += `─────────────────────\n`;
  msg += `Por favor envía la captura del comprobante de pago en este chat para activar tus descargas. ¡Gracias! ✂️`;

  _cart = []; _saveCart(); _renderGrid();
  closePayModal(); closeCart();

  const waUrl = `https://wa.me/${_WA_NUM}?text=${encodeURIComponent(msg)}`;
  const popup = window.open(waUrl, '_blank');
  if (!popup) {
    _toast('✅ Pedido registrado. Toca aquí para abrir WhatsApp 📲', 'success');
    setTimeout(() => window.open(waUrl, '_blank'), 800);
  } else {
    _toast('¡Pedido enviado! Espera nuestra confirmación 📲', 'success');
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

// ── SELL / CREATOR SUBMISSION ─────────────────────────────────────
let _crfFiles = [];   // File objects pendientes de subir
let _crfCover = null; // File object portada

function openSellModal() {
  if (!_user) {
    _toast('Inicia sesión para vender tus productos', 'info');
    return;
  }
  document.getElementById('creator-modal-bg').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSellModal() {
  document.getElementById('creator-modal-bg').classList.remove('open');
  document.body.style.overflow = '';
}

function _crf_coverChange(input) {
  const f = input.files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) { _toast('La portada debe ser menor a 5 MB', 'error'); return; }
  _crfCover = f;
  document.getElementById('crf-cover-name').textContent = f.name + ' (' + (f.size/1024).toFixed(0) + ' KB)';
}

function _crf_filesChange(input) {
  const newFiles = Array.from(input.files).filter(f => {
    if (f.size > 50 * 1024 * 1024) { _toast(f.name + ' supera 50 MB', 'error'); return false; }
    return true;
  });
  _crfFiles = [..._crfFiles, ...newFiles];
  _crf_renderFilesList();
  input.value = '';
}

function _crf_renderFilesList() {
  const list = document.getElementById('crf-files-list');
  list.innerHTML = _crfFiles.map((f, i) =>
    `<div class="crf-file-item">
       <span class="crf-file-name">${_esc(f.name)}</span>
       <span class="crf-file-size">${(f.size/1024/1024).toFixed(1)} MB</span>
       <button class="crf-file-rm" onclick="Shop._crf_removeFile(${i})">×</button>
     </div>`
  ).join('');
}

function _crf_removeFile(i) {
  _crfFiles.splice(i, 1);
  _crf_renderFilesList();
}

async function submitSell() {
  if (!_user) return;
  const name  = document.getElementById('crf-name').value.trim();
  const short = document.getElementById('crf-short').value.trim();
  const price = parseFloat(document.getElementById('crf-price').value) || 0;
  if (!name) { _toast('El nombre es obligatorio', 'error'); return; }
  if (!short) { _toast('La descripción corta es obligatoria', 'error'); return; }
  if (price <= 0) { _toast('Indica el precio sugerido', 'error'); return; }
  if (_crfFiles.length === 0) { _toast('Añade al menos un archivo del producto', 'error'); return; }

  const btn = document.getElementById('crf-submit-btn');
  btn.disabled = true; btn.textContent = 'Subiendo archivos…';

  const storage = firebase.storage();
  const subId   = Date.now() + '_' + Math.random().toString(36).slice(2,7);
  const basePath = `submissions/${_user.uid}/${subId}`;
  const progressWrap = document.getElementById('crf-progress-wrap');
  const progressBar  = document.getElementById('crf-progress-bar');
  progressWrap.style.display = 'block';

  try {
    // Subir portada
    let coverUrl = null;
    if (_crfCover) {
      btn.textContent = 'Subiendo portada…';
      const ref = storage.ref(`${basePath}/cover_${_crfCover.name}`);
      await ref.put(_crfCover);
      coverUrl = await ref.getDownloadURL();
    }

    // Subir archivos del producto
    const fileUrls = {};
    for (let i = 0; i < _crfFiles.length; i++) {
      const f = _crfFiles[i];
      btn.textContent = `Subiendo ${i+1}/${_crfFiles.length}: ${f.name}`;
      progressBar.style.width = ((i / _crfFiles.length) * 100) + '%';
      const ref = storage.ref(`${basePath}/${f.name}`);
      const task = ref.put(f);
      await new Promise((resolve, reject) => {
        task.on('state_changed',
          snap => { progressBar.style.width = (((i + snap.bytesTransferred/snap.totalBytes) / _crfFiles.length) * 100) + '%'; },
          reject,
          resolve
        );
      });
      fileUrls[f.name] = await ref.getDownloadURL();
    }
    progressBar.style.width = '100%';

    // Guardar submission en Firestore
    await db.collection('submissions').add({
      uid:        _user.uid,
      email:      _user.email,
      cat:        document.getElementById('crf-cat').value,
      name,
      shortDesc:  short,
      desc:       document.getElementById('crf-desc').value.trim(),
      price,
      royaltyPct: parseInt(document.getElementById('crf-royalty').value),
      coverImage: coverUrl,
      fileUrls,
      files:      Object.keys(fileUrls),
      status:     'pending',
      createdAt:  firebase.firestore.FieldValue.serverTimestamp(),
    });

    _toast('¡Enviado! Lo revisamos en 1-3 días y te avisamos.', 'success');
    // Reset form
    ['crf-name','crf-short','crf-desc','crf-price'].forEach(id => document.getElementById(id).value = '');
    _crfFiles = []; _crfCover = null;
    _crf_renderFilesList();
    document.getElementById('crf-cover-name').textContent = 'JPG, PNG o WEBP · máx 5 MB';
    progressWrap.style.display = 'none';
    progressBar.style.width = '0';
    setTimeout(() => closeSellModal(), 1400);
  } catch(e) {
    _toast('Error al enviar: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Enviar para revisión →';
  }
}

function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── PUBLIC API ────────────────────────────────────────────────────
window.Shop = { openModal, closeModal, toggleCart, closeCart, addToCart, removeFromCart, checkout, closePayModal, submitPayOrder, filter, search, openSellModal, closeSellModal, submitSell, _crf_coverChange, _crf_filesChange, _crf_removeFile };

})();
