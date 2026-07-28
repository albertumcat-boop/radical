/**
 * scripts/seed-firestore.js
 * Siembra productos de ejemplo en Firestore y crea el documento de admin.
 *
 * USO:
 *   1. Descarga tu service account desde Firebase Console →
 *      Project Settings → Service Accounts → Generate new private key
 *      Guárdalo como: scripts/service-account.json
 *
 *   2. Ejecuta:
 *      node scripts/seed-firestore.js
 *
 *   O con variable de entorno (si ya tienes FIREBASE_SERVICE_ACCOUNT en Vercel):
 *      FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}' node scripts/seed-firestore.js
 *
 *   3. Para crear tu doc de admin también (reemplaza con tu UID de Firebase):
 *      ADMIN_UID=tuUidAqui node scripts/seed-firestore.js
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue }      = require('firebase-admin/firestore');
const path = require('path');
const fs   = require('fs');

// ── Credenciales ──────────────────────────────────────────────────
let sa;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const saPath = path.join(__dirname, 'service-account.json');
  if (!fs.existsSync(saPath)) {
    console.error(`
❌ No se encontraron credenciales.

Opciones:
  A) Descarga tu service account JSON de Firebase Console y guárdalo en:
       scripts/service-account.json

  B) Pásalo como variable de entorno:
       FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}' node scripts/seed-firestore.js
`);
    process.exit(1);
  }
  sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
}

if (!getApps().length) initializeApp({ credential: cert(sa) });
const db = getFirestore();

// ── Productos de ejemplo ──────────────────────────────────────────
const PRODUCTS = [
  {
    id:'patron-franela', cat:'patron', sortOrder:1, published:true, popular:false,
    name:'Franela Básica Completa',
    shortDesc:'Espalda, delantera y manga corta en un solo set.',
    desc:'Set de patronaje completo para franela/camiseta básica unisex. Incluye espalda, delantera, manga corta y guía de armado.',
    price:1.99, oldPrice:null, tier:null,
    features:['Espalda · Delantera · Manga','Sesgos de cuello','PDF escala 1:1','Márgenes de costura marcados','Instrucciones de armado'],
    files:['patron_franela_espalda.pdf','patron_franela_delantera.pdf','patron_manga_corta.pdf','guia_armado.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_FRANELA',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'patron-camisa', cat:'patron', sortOrder:2, published:true, popular:false,
    name:'Camisa Clásica',
    shortDesc:'Camisa de vestir con cuello camisero y pechera.',
    desc:'Patronaje completo de camisa clásica de manga larga. Incluye todas las piezas: espalda, delantera, manga, cuello camisero, puño y pechera.',
    price:3.99, oldPrice:5.99, tier:null,
    features:['7 piezas completas','Cuello camisero y puño','Botones y ojales marcados','Tallas XS a 3XL','PDF A4 y A0'],
    files:['camisa_espalda.pdf','camisa_delantera.pdf','camisa_manga.pdf','camisa_cuello.pdf','guia_confeccion.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_CAMISA',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'patron-blazer', cat:'patron', sortOrder:3, published:true, popular:true,
    name:'Blazer Sastre',
    shortDesc:'Blazer de corte estructurado con solapa y forro.',
    desc:'Patrón profesional de blazer de sastre. Corte estructurado con solapa muesca, bolsillos de pecho, forro completo y mangas con abertura.',
    price:5.99, oldPrice:9.99, tier:'expert',
    features:['12 piezas + forro','Solapa y cuello sastre','Bolsillos marcados','Entretela indicada','Guía de sastre paso a paso'],
    files:['blazer_espalda.pdf','blazer_delantera.pdf','blazer_manga.pdf','blazer_forro.pdf','guia_sastre.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_BLAZER',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'patron-pantalon', cat:'patron', sortOrder:4, published:true, popular:false,
    name:'Pantalón Recto',
    shortDesc:'Pantalón de corte recto con pretina y pinzas.',
    desc:'Patrón de pantalón recto clásico. Incluye delantero con pinzas, trasero, pretina y bolsillos laterales.',
    price:3.49, oldPrice:null, tier:'pro',
    features:['Delantero y trasero','Pretina y cinturilla','Bolsillos laterales','Pinzas marcadas'],
    files:['pantalon_delantera.pdf','pantalon_espalda.pdf','pantalon_pretina.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_PANTALON',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'patron-vestido', cat:'patron', sortOrder:5, published:true, popular:true,
    name:'Vestido Cruzado',
    shortDesc:'Vestido envolvente con caída fluida y drapeado.',
    desc:'Patrón de vestido cruzado con escote en V y talle definido. Diseño clásico adaptable.',
    price:4.49, oldPrice:6.99, tier:'pro',
    features:['Escote V cruzado','Talle ajustable','2 largos: midi y maxi','Corte en sesgo indicado'],
    files:['vestido_delantera.pdf','vestido_espalda.pdf','guia_drapeado.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_VESTIDO',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'patron-falda', cat:'patron', sortOrder:6, published:true, popular:false,
    name:'Falda Lápiz Profesional',
    shortDesc:'Falda ajustada con abertura y cremallera invisible.',
    desc:'Patrón de falda lápiz clásica con abertura trasera y cremallera invisible.',
    price:2.99, oldPrice:null, tier:null,
    features:['Delantera y trasera','Cremallera invisible','Abertura trasera','Tallas XS–3XL'],
    files:['falda_delantera.pdf','falda_espalda.pdf','falda_forro.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_FALDA',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'patron-blusa', cat:'patron', sortOrder:7, published:true, popular:false,
    name:'Blusa Clásica',
    shortDesc:'Blusa de escote en V con manga larga y pinzas.',
    desc:'Patrón de blusa clásica femenina con escote en V, pinzas al busto y manga larga con puño.',
    price:2.99, oldPrice:null, tier:null,
    features:['Escote en V','Pinzas al busto','Manga larga con puño','5 piezas','PDF escala 1:1'],
    files:['blusa_delantera.pdf','blusa_espalda.pdf','blusa_manga.pdf','blusa_puno.pdf'],
    lsVariantKey:'LS_VARIANT_PATRON_BLUSA',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'curso-principiantes', cat:'curso', sortOrder:8, published:true, popular:true,
    name:'Patronaje Desde Cero',
    shortDesc:'8 clases · Principiante · Certificado incluido',
    desc:'Aprende patronaje de moda desde cero. 8 clases en video que te llevan de no saber nada a trazar tu primer patrón profesional.',
    price:14.99, oldPrice:29.99, tier:null, lessons:8, duration:'6h',
    features:['8 clases en video','Workbook PDF descargable','Certificado al completar','Acceso de por vida','Soporte por comunidad'],
    files:['clase_01_intro.mp4','clase_02_herramientas.mp4','clase_03_medidas.mp4','workbook.pdf'],
    lsVariantKey:'LS_VARIANT_CURSO_PRINCIPIANTES',
    coverImage:null, gallery:[], videoPreview:null,
    videoLessons:[
      {title:'Introducción al patronaje', duration:'12:00', free:true},
      {title:'Herramientas y materiales', duration:'18:00', free:true},
      {title:'Cómo tomar medidas corporales', duration:'24:00', free:false},
      {title:'Tu primer patrón: la base', duration:'35:00', free:false},
      {title:'Ajustes y modificaciones', duration:'28:00', free:false},
      {title:'Márgenes de costura', duration:'20:00', free:false},
      {title:'Exportar e imprimir 1:1', duration:'15:00', free:false},
      {title:'Proyecto final: tu prenda', duration:'45:00', free:false},
    ],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'curso-avanzado', cat:'curso', sortOrder:9, published:true, popular:false,
    name:'Trazado Profesional',
    shortDesc:'12 clases · Intermedio · Proyecto final con retroalimentación',
    desc:'Domina las técnicas de trazado profesional que usan los patronistas de moda. Incluye técnicas de graduación, drapeado y transformación de patrones.',
    price:24.99, oldPrice:49.99, tier:null, lessons:12, duration:'10h',
    features:['12 clases avanzadas','Técnicas de graduación','Transformación de patrones','Retroalimentación personalizada','Certificado profesional'],
    files:['12_clases_video.zip','proyecto_final.pdf','tabla_graduacion.pdf'],
    lsVariantKey:'LS_VARIANT_CURSO_AVANZADO',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'pack-basico', cat:'pack', sortOrder:10, published:true, popular:false,
    name:'Pack Básico — 3 Patrones',
    shortDesc:'Franela + Falda + Pantalón · Ahorra 40%',
    desc:'Los tres patrones esenciales para comenzar tu guardarropa. Todo lo que necesitas para prendas del día a día.',
    price:4.99, oldPrice:8.47, tier:null, discount:41,
    features:['Franela Básica Completa','Falda Lápiz Profesional','Pantalón Recto','18 piezas en total','Ahorra un 41%'],
    files:['pack_basico_todos_patrones.zip','guia_completa.pdf'],
    lsVariantKey:'LS_VARIANT_PACK_BASICO',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'pack-femenino', cat:'pack', sortOrder:11, published:true, popular:true,
    name:'Pack Femenino — 5 Patrones',
    shortDesc:'Blusa + Falda + Vestido + Pantalón + Camisa · Ahorra 45%',
    desc:'El pack completo para moda femenina. Cinco patrones versátiles que cubren todas las ocasiones.',
    price:12.99, oldPrice:23.95, tier:null, discount:46,
    features:['5 patrones premium','30+ piezas de patronaje','Guía de combinación','Tabla de tallas incluida'],
    files:['pack_femenino_5_patrones.zip','guia_moda_femenina.pdf','tabla_tallas_internacional.pdf'],
    lsVariantKey:'LS_VARIANT_PACK_FEMENINO',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'pack-completo', cat:'pack', sortOrder:12, published:true, popular:true,
    name:'Pack Completo Pro — Todo',
    shortDesc:'7 patrones + 2 cursos + recursos · El mejor valor',
    desc:'Todo lo que necesitas para dominar el patronaje. Siete patrones, dos cursos y recursos premium.',
    price:39.99, oldPrice:79.99, tier:null, discount:50,
    features:['7 patrones completos','Curso Desde Cero incluido','Curso Avanzado incluido','Pack de recursos','50% de ahorro','Soporte prioritario'],
    files:['pack_completo_patrones.zip','cursos_completos.zip','recursos_premium.zip'],
    lsVariantKey:'LS_VARIANT_PACK_COMPLETO',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'recurso-medidas', cat:'recurso', sortOrder:13, published:true, popular:false,
    name:'Guía Profesional de Medidas',
    shortDesc:'Cómo tomar 24 medidas corporales con precisión',
    desc:'Guía ilustrada paso a paso para tomar medidas corporales con precisión profesional.',
    price:2.99, oldPrice:null, tier:null,
    features:['24 medidas detalladas','Diagramas ilustrados','Tabla de referencia ISO','Versión imprimible'],
    files:['guia_medidas_profesional.pdf','tabla_referencia_rapida.pdf'],
    lsVariantKey:'LS_VARIANT_RECURSO_MEDIDAS',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
  {
    id:'recurso-tallas', cat:'recurso', sortOrder:14, published:true, popular:false,
    name:'Tablas de Tallas Internacionales',
    shortDesc:'Equivalencias ISO · EU · US · UK · Brasil · México',
    desc:'Tabla completa de equivalencias de tallas para mujer, hombre y niño.',
    price:1.99, oldPrice:null, tier:null,
    features:['Mujer · Hombre · Niño','ISO · EU · US · UK · Brasil','Formato A4 imprimible','Actualización gratuita'],
    files:['tablas_tallas_internacionales.pdf'],
    lsVariantKey:'LS_VARIANT_RECURSO_TALLAS',
    coverImage:null, gallery:[], videoPreview:null, videoLessons:[],
    creatorName:null, creatorEmail:null, creatorUid:null, royaltyPct:0, purchases:0,
  },
];

// ── Ejecutar seed ─────────────────────────────────────────────────
async function seed() {
  console.log(`\n🌱 Sembrando ${PRODUCTS.length} productos en Firestore...\n`);

  const batch = db.batch();
  const now   = FieldValue.serverTimestamp();

  PRODUCTS.forEach(p => {
    const ref = db.collection('products').doc(p.id);
    batch.set(ref, { ...p, createdAt: now, updatedAt: now }, { merge: true });
    console.log(`  ✓ ${p.id} — $${p.price}`);
  });

  await batch.commit();
  console.log(`\n✅ ${PRODUCTS.length} productos escritos en Firestore.\n`);

  // Crear doc de admin si se pasa ADMIN_UID
  const adminUid = process.env.ADMIN_UID;
  if (adminUid) {
    await db.collection('admins').doc(adminUid).set({
      role: 'admin',
      createdAt: now,
    }, { merge: true });
    console.log(`✅ Admin creado: /admins/${adminUid}\n`);
  } else {
    console.log(`ℹ️  Para crear tu doc de admin, ejecuta con:
   ADMIN_UID=tuUidDeFirebase node scripts/seed-firestore.js\n`);
  }
}

seed().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
