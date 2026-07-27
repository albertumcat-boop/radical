/**
 * tienda-admin.js — PatrónAI Pro Admin Panel
 * Gestión de productos: CRUD, imágenes, videos, publicación.
 * Requiere: /admins/{uid} documento en Firestore.
 */
(function () {
'use strict';

// ── Firebase init ────────────────────────────────────────────────
const FB = {
  apiKey: window.__PATRONAI_FB_CONFIG__?.apiKey || "AIzaSyBkwexYdW6zaxpYFjzB6YcFb5c7zxGBEeY",
  authDomain: "radicalpro.firebaseapp.com",
  projectId: "radicalpro",
  storageBucket: "radicalpro.appspot.com",
};
if (!firebase.apps.length) firebase.initializeApp(FB);
const db      = firebase.firestore();
const auth    = firebase.auth();
let   storage = null;
try { storage = firebase.storage(); } catch(e) {}

// ── State ───────────────────────────────────────────────────────
let _user        = null;
let _isAdmin     = false;
let _allProducts = [];
let _orders      = [];
let _filterCat   = 'all';
let _editId      = null;   // null = nuevo, string = editar
let _features    = [];
let _files       = [];
let _gallery     = [];     // Array de URLs (hasta 6)
let _lessons     = [];

// ── CATALOG DEFAULT (semilla inicial) ───────────────────────────
const SEED_PRODUCTS = [
  {id:'patron-franela',cat:'patron',name:'Franela Básica Completa',shortDesc:'Espalda, delantera y manga corta en un solo set.',desc:'Set de patronaje completo para franela/camiseta básica unisex.',price:1.99,oldPrice:null,features:['Espalda · Delantera · Manga','PDF escala 1:1','Márgenes marcados','Instrucciones de armado'],files:['patron_franela_espalda.pdf','patron_franela_delantera.pdf','patron_manga.pdf'],lsVariantKey:'LS_VARIANT_PATRON_FRANELA',tier:null,published:true,popular:false,coverImage:null,gallery:[],videoPreview:null,videoLessons:[],purchases:0,sortOrder:1},
  {id:'patron-camisa',cat:'patron',name:'Camisa Clásica',shortDesc:'Camisa de vestir con cuello camisero y pechera.',desc:'Patronaje completo de camisa clásica de manga larga.',price:3.99,oldPrice:5.99,features:['7 piezas completas','Cuello camisero y puño','Tallas XS a 3XL'],files:['camisa_espalda.pdf','camisa_delantera.pdf','camisa_manga.pdf','guia_confeccion.pdf'],lsVariantKey:'LS_VARIANT_PATRON_CAMISA',tier:null,published:true,popular:false,coverImage:null,gallery:[],videoPreview:null,videoLessons:[],purchases:0,sortOrder:2},
  {id:'patron-blazer',cat:'patron',name:'Blazer Sastre',shortDesc:'Blazer de corte estructurado con solapa y forro.',desc:'Patrón profesional de blazer de sastre.',price:5.99,oldPrice:9.99,features:['12 piezas + forro','Solapa y cuello sastre','Guía de sastre paso a paso'],files:['blazer_espalda.pdf','blazer_delantera.pdf','blazer_manga.pdf','blazer_forro.pdf'],lsVariantKey:'LS_VARIANT_PATRON_BLAZER',tier:'expert',published:true,popular:true,coverImage:null,gallery:[],videoPreview:null,videoLessons:[],purchases:0,sortOrder:3},
  {id:'patron-pantalon',cat:'patron',name:'Pantalón Recto',shortDesc:'Pantalón de corte recto con pretina y pinzas.',desc:'Patrón de pantalón recto clásico.',price:3.49,oldPrice:null,features:['Delantero y trasero','Pretina','Bolsillos laterales'],files:['pantalon_delantera.pdf','pantalon_espalda.pdf','pantalon_pretina.pdf'],lsVariantKey:'LS_VARIANT_PATRON_PANTALON',tier:'pro',published:true,popular:false,coverImage:null,gallery:[],videoPreview:null,videoLessons:[],purchases:0,sortOrder:4},
  {id:'patron-vestido',cat:'patron',name:'Vestido Cruzado',shortDesc:'Vestido envolvente con caída fluida y drapeado.',desc:'Patrón de vestido cruzado con escote en V.',price:4.49,oldPrice:6.99,features:['Escote V cruzado','2 largos: midi y maxi'],files:['vestido_delantera.pdf','vestido_espalda.pdf','guia_drapeado.pdf'],lsVariantKey:'LS_VARIANT_PATRON_VESTIDO',tier:'pro',published:true,popular:true,coverImage:null,gallery:[],videoPreview:null,videoLessons:[],purchases:0,sortOrder:5},
  {id:'patron-falda',cat:'patron',name:'Falda Lápiz Profesional',shortDesc:'Falda ajustada con abertura y cremallera invisible.',desc:'Patrón de falda lápiz clásica.',price:2.99,oldPrice:null,features:['Delantera y trasera','Cremallera invisible','Tallas XS–3XL'],files:['falda_delantera.pdf','falda_espalda.pdf','falda_forro.pdf'],lsVariantKey:'LS_VARIANT_PATRON_FALDA',tier:null,published:true,popular:false,coverImage:null,gallery:[],videoPreview:null,videoLessons:[],purchases:0,sortOrder:6},
  {id:'curso-principiantes',cat:'curso',name:'Patronaje Desde Cero',shortDesc:'8 clases · Principiante · Certificado incluido',desc:'Aprende patronaje desde cero con esta guía completa.',price:14.99,oldPrice:29.99,features:['8 clases en video','Workbook PDF','Certificado al completar','Acceso de por vida'],files:['clase_01.mp4','clase_02.mp4','workbook.pdf'],lsVariantKey:'LS_VARIANT_CURSO_PRINCIPIANTES',tier:null,published:true,popular:true,coverImage:null,gallery:[],videoPreview:null,videoLessons:[{title:'Introducción al patronaje',duration:'12:00',free:true},{title:'Herramientas y materiales',duration:'18:00',free:true},{title:'Cómo tomar medidas',duration:'24:00',free:false},{title:'Tu primer patrón',duration:'35:00',free:false}],purchases:0,lessons:8,duration:'6h',sortOrder:7},
  {id:'curso-avanzado',cat:'curso',name:'Trazado Profesional',shortDesc:'12 clases · Intermedio · Proyecto final',desc:'Domina las técnicas de trazado profesional.',price:24.99,oldPrice:49.99,features:['12 clases avanzadas','Técnicas de graduación','Retroalimentación'],files:['12_clases.zip','proyecto_final.pdf'],lsVariantKey:'LS_VARIANT_CURSO_AVANZADO',tier:null,published:true,popular:false,coverImage:null,gallery:[],videoPreview:null,videoLessons:[],purchases:0,lessons:12,duration:'10h',sortOrder:8},
  {id:'pack-basico',cat:'pack',name:'Pack Básico — 3 Patrones',shortDesc:'Franela + Falda + Pantalón · Ahorra 40%',desc:'Los tres patrones esenciales para comenzar.',price:4.99,oldPrice:8.47,features:['Franela Básica Completa','Falda Lápiz','Pantalón Recto','Ahorra 41%'],files:['pack_basico.zip'],lsVariantKey:'LS_VARIANT_PACK_BASICO',tier:null,published:true,popular:false,coverImage:null,gallery:[],videoPreview:null,videoLessons:[],purchases:0,sortOrder:9},
  {id:'recurso-medidas',cat:'recurso',name:'Guía Profesional de Medidas',shortDesc:'Cómo tomar 24 medidas corporales con precisión',desc:'Guía ilustrada para tomar medidas corporales.',price:2.99,oldPrice:null,features:['24 medidas detalladas','Diagramas ilustrados','Imprimible'],files:['guia_medidas.pdf'],lsVariantKey:'LS_VARIANT_RECURSO_MEDIDAS',tier:null,published:true,popular:false,coverImage:null,gallery:[],videoPreview:null,videoLessons:[],purchases:0,sortOrder:10},
];

// ── AUTH ─────────────────────────────────────────────────────────
auth.onAuthStateChanged(async user => {
  if (!user) {
    _show('auth-wall'); _hide('app-layout'); return;
  }
  _user = user;
  document.getElementById('setup-uid').textContent = user.uid;
  // Verificar si es admin
  try {
    const adminDoc = await db.collection('admins').doc(user.uid).get();
    _isAdmin = adminDoc.exists;
  } catch(e) { _isAdmin = false; }

  if (!_isAdmin) {
    _showAuthError('No tienes permisos de administrador. Consulta la sección de Configuración.');
    auth.signOut();
    return;
  }
  _show('app-layout'); _hide('auth-wall');
  document.getElementById('adm-user-email').textContent = user.email;
  _loadAll();
});

function login() {
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-pass').value;
  const btn   = document.getElementById('auth-btn');
  if (!email || !pass) { _showAuthError('Completa email y contraseña'); return; }
  btn.textContent = 'Entrando…'; btn.disabled = true;
  document.getElementById('auth-error').classList.remove('show');
  auth.signInWithEmailAndPassword(email, pass).catch(err => {
    btn.textContent = 'Entrar al panel →'; btn.disabled = false;
    _showAuthError(_authMsg(err.code));
  });
}
function logout() { auth.signOut(); }
function _showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg; el.classList.add('show');
  document.getElementById('auth-btn').textContent = 'Entrar al panel →';
  document.getElementById('auth-btn').disabled = false;
}
function _authMsg(code) {
  if (code === 'auth/user-not-found') return 'Email no registrado.';
  if (code === 'auth/wrong-password')  return 'Contraseña incorrecta.';
  if (code === 'auth/too-many-requests') return 'Demasiados intentos. Espera un momento.';
  return 'Error: ' + code;
}

// ── LOAD ALL DATA ────────────────────────────────────────────────
async function _loadAll() {
  await Promise.all([_loadProducts(), _loadOrders()]);
  _updateStats();
}

async function _loadProducts() {
  try {
    const snap = await db.collection('products').orderBy('sortOrder').get();
    if (snap.empty) {
      // Seed initial products
      await _seedProducts();
      return;
    }
    _allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) {
    // Fallback to seed data
    _allProducts = SEED_PRODUCTS;
  }
  _renderProducts();
  document.getElementById('nav-count-products').textContent = _allProducts.length;
}

async function _seedProducts() {
  const batch = db.batch();
  SEED_PRODUCTS.forEach(p => {
    const ref = db.collection('products').doc(p.id);
    batch.set(ref, { ...p, createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  });
  try {
    await batch.commit();
    _toast('Catálogo inicial cargado en Firestore ✓', 'ok');
    const snap = await db.collection('products').orderBy('sortOrder').get();
    _allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) {
    _allProducts = SEED_PRODUCTS;
    _toast('No se pudo escribir en Firestore. Verifica que eres admin.', 'err');
  }
  _renderProducts();
  document.getElementById('nav-count-products').textContent = _allProducts.length;
}

async function _loadOrders() {
  try {
    const snap = await db.collection('orders').orderBy('createdAt','desc').limit(50).get();
    _orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    _renderOrders();
    document.getElementById('nav-count-orders').textContent = _orders.length;
  } catch(e) { /* orders might not exist yet */ }
}

// ── RENDER PRODUCTS LIST ─────────────────────────────────────────
function _renderProducts() {
  const body = document.getElementById('products-body');
  const filtered = _filterCat === 'all' ? _allProducts : _allProducts.filter(p => p.cat === _filterCat);
  if (filtered.length === 0) {
    body.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-text">No hay productos en esta categoría</div></div>`;
    return;
  }
  body.innerHTML = filtered.map(p => {
    const thumb = p.coverImage
      ? `<div class="pt-thumb"><img src="${_esc(p.coverImage)}" alt=""></div>`
      : `<div class="pt-thumb">${_catEmoji(p.cat)}</div>`;
    return `<div class="pt-row" onclick="Admin.openEditor('${p.id}')">
      ${thumb}
      <div class="pt-name-col">
        <div class="pt-name">${_esc(p.name)}</div>
        <div class="pt-id">${p.id}</div>
      </div>
      <div><span class="cat-badge cat-${p.cat}">${_catLabel(p.cat)}</span></div>
      <div class="pt-price">$${(p.price||0).toFixed(2)}</div>
      <div><span class="status-dot ${p.published?'pub':'draft'}">${p.published?'Publicado':'Borrador'}</span></div>
      <div class="pt-actions">
        <button class="pt-edit-btn" onclick="event.stopPropagation();Admin.openEditor('${p.id}')">Editar</button>
      </div>
    </div>`;
  }).join('');
}

function filterProducts(cat, el) {
  _filterCat = cat;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  _renderProducts();
}

// ── RENDER ORDERS ────────────────────────────────────────────────
function _renderOrders() {
  const body = document.getElementById('orders-body');
  if (!_orders.length) {
    body.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-text">Sin órdenes aún</div><div class="empty-sub">Las compras aparecerán aquí</div></div>`;
    return;
  }
  body.innerHTML = _orders.map(o => {
    const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('es') : '—';
    return `<div class="order-row">
      <span class="order-date">${date}</span>
      <span class="order-email">${_esc(o.email||'—')}</span>
      <span class="order-total">$${(o.total||0).toFixed(2)}</span>
      <span class="order-id">${(o.lsOrderId||o.id||'').substring(0,12)}</span>
    </div>`;
  }).join('');
}

// ── STATS ────────────────────────────────────────────────────────
function _updateStats() {
  const pub  = _allProducts.filter(p => p.published).length;
  const ord  = _orders.length;
  const rev  = _orders.reduce((s,o) => s + (o.total||0), 0);
  const img  = _allProducts.filter(p => p.coverImage).length;
  document.getElementById('s-pub').textContent = pub;
  document.getElementById('s-ord').textContent = ord;
  document.getElementById('s-rev').textContent = '$' + rev.toFixed(2);
  document.getElementById('s-img').textContent = img + ' / ' + _allProducts.length;
}

// ── PANELS ───────────────────────────────────────────────────────
function showPanel(name, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  if (el) el.classList.add('active');
  if (name === 'earnings') _loadEarnings();
}

async function _loadEarnings() {
  const container = document.getElementById('earnings-list');
  container.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">Cargando…</div></div>';
  try {
    const snap = await db.collection('creatorEarnings').get();
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">Sin ganancias registradas aún</div><div class="empty-sub">Aparecerán aquí cuando se haga la primera venta de un producto con creador asignado</div></div>';
      return;
    }
    let html = '';
    for (const doc of snap.docs) {
      const e = doc.data();
      // Cargar ventas individuales
      const salesSnap = await db.collection('creatorEarnings').doc(doc.id).collection('sales').orderBy('createdAt','desc').get();
      const salesRows = salesSnap.docs.map(s => {
        const sale = s.data();
        const fecha = sale.createdAt?.toDate ? sale.createdAt.toDate().toLocaleDateString('es') : '—';
        const paidBadge = sale.paid
          ? `<span style="color:#2a9d5c;font-size:.75rem;font-weight:600">✓ Pagado</span>`
          : `<button onclick="Admin.markSalePaid('${doc.id}','${s.id}')" style="font-size:.72rem;padding:3px 8px;border:1px solid #D4603A;background:none;color:#D4603A;border-radius:4px;cursor:pointer">Marcar pagado</button>`;
        return `<tr style="font-size:.8rem;border-bottom:1px solid #f0e8de">
          <td style="padding:6px 8px">${fecha}</td>
          <td style="padding:6px 8px">${sale.productName||'—'}</td>
          <td style="padding:6px 8px">$${(sale.salePrice||0).toFixed(2)}</td>
          <td style="padding:6px 8px">${sale.royaltyPct||0}%</td>
          <td style="padding:6px 8px;font-weight:600;color:#2a9d5c">$${(sale.royaltyAmt||0).toFixed(2)}</td>
          <td style="padding:6px 8px">${paidBadge}</td>
        </tr>`;
      }).join('');

      html += `<div style="background:#fff;border:1px solid #e8ddd0;border-radius:10px;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:#fffbf5;border-bottom:1px solid #f0e8de">
          <div>
            <div style="font-weight:700;font-size:.95rem">${e.creatorName||'Sin nombre'}</div>
            <div style="font-size:.8rem;color:#8a7a70">${e.creatorEmail||'Sin email'}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.4rem;font-weight:800;color:#D4603A">$${(e.totalEarned||0).toFixed(2)}</div>
            <div style="font-size:.75rem;color:#8a7a70">${e.totalSales||0} ventas · pendiente de pago</div>
          </div>
        </div>
        ${salesRows ? `<table style="width:100%;border-collapse:collapse">
          <thead><tr style="font-size:.72rem;color:#8a7a70;text-transform:uppercase;letter-spacing:.04em;background:#faf6f1">
            <th style="padding:6px 8px;text-align:left;font-weight:500">Fecha</th>
            <th style="padding:6px 8px;text-align:left;font-weight:500">Producto</th>
            <th style="padding:6px 8px;text-align:left;font-weight:500">Precio</th>
            <th style="padding:6px 8px;text-align:left;font-weight:500">%</th>
            <th style="padding:6px 8px;text-align:left;font-weight:500">Regalía</th>
            <th style="padding:6px 8px;text-align:left;font-weight:500">Estado</th>
          </tr></thead>
          <tbody>${salesRows}</tbody>
        </table>` : '<div style="padding:12px 18px;font-size:.8rem;color:#8a7a70">Sin ventas aún</div>'}
      </div>`;
    }
    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Error cargando ganancias</div><div class="empty-sub">${e.message}</div></div>`;
  }
}

async function markSalePaid(creatorUid, saleId) {
  try {
    await db.collection('creatorEarnings').doc(creatorUid).collection('sales').doc(saleId).update({ paid: true });
    _toast('Venta marcada como pagada ✓', 'ok');
    _loadEarnings();
  } catch(e) { _toast('Error: ' + e.message, 'err'); }
}

// ── EDITOR ───────────────────────────────────────────────────────
function openEditor(productId) {
  _editId   = productId;
  _gallery  = [];
  _lessons  = [];
  _features = [];
  _files    = [];

  const isNew = !productId;
  document.getElementById('editor-title').textContent = isNew ? 'Nuevo producto' : 'Editar producto';
  document.getElementById('btn-delete').style.display = isNew ? 'none' : '';

  // Init gallery slots
  _gallery = new Array(6).fill(null);
  _renderGallerySlots();

  if (isNew) {
    _clearForm();
  } else {
    const p = _allProducts.find(x => x.id === productId);
    if (p) _fillForm(p);
  }

  document.getElementById('editor-overlay').classList.add('open');
  document.getElementById('editor-panel').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Show/hide lessons
  _toggleLessonsSection();
}

function closeEditor() {
  document.getElementById('editor-overlay').classList.remove('open');
  document.getElementById('editor-panel').classList.remove('open');
  document.body.style.overflow = '';
}

function _clearForm() {
  ['f-id','f-name','f-short','f-desc','f-price','f-old-price','f-ls-key','f-video-preview','cover-url',
   'f-creator-name','f-creator-email','f-creator-uid'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const rp = document.getElementById('f-royalty-pct');
  if (rp) rp.value = '70';
  document.getElementById('f-cat').value      = 'patron';
  document.getElementById('f-tier').value     = '';
  document.getElementById('f-published').checked = true;
  document.getElementById('f-popular').checked   = false;
  _removeCover();
  _hideVideoPreview();
  _features = []; _renderTags('features');
  _files    = []; _renderTags('files');
  _lessons  = []; _renderLessons();
}

function _fillForm(p) {
  document.getElementById('f-id').value          = p.id;
  document.getElementById('f-name').value        = p.name || '';
  document.getElementById('f-short').value       = p.shortDesc || '';
  document.getElementById('f-desc').value        = p.desc || '';
  document.getElementById('f-price').value       = p.price != null ? p.price : '';
  document.getElementById('f-old-price').value   = p.oldPrice != null ? p.oldPrice : '';
  document.getElementById('f-ls-key').value      = p.lsVariantKey || '';
  document.getElementById('f-cat').value         = p.cat || 'patron';
  document.getElementById('f-tier').value        = p.tier || '';
  document.getElementById('f-published').checked = p.published !== false;
  document.getElementById('f-popular').checked   = p.popular === true;
  document.getElementById('f-video-preview').value = p.videoPreview || '';

  // Cover image
  if (p.coverImage) {
    document.getElementById('cover-url').value = p.coverImage;
    _showCoverPreview(p.coverImage);
  } else {
    _removeCover();
  }

  // Gallery
  _gallery = [...(p.gallery || [])];
  while (_gallery.length < 6) _gallery.push(null);
  _renderGallerySlots();

  // Video preview
  if (p.videoPreview) previewVideo(p.videoPreview);
  else _hideVideoPreview();

  // Features & Files
  _features = [...(p.features || [])];
  _renderTags('features');
  _files    = [...(p.files || [])];
  _renderTags('files');

  // Lessons
  _lessons = (p.videoLessons || []).map(l => ({...l}));
  _renderLessons();

  // Creator / Royalties
  document.getElementById('f-creator-name').value  = p.creatorName  || '';
  document.getElementById('f-creator-email').value = p.creatorEmail || '';
  document.getElementById('f-creator-uid').value   = p.creatorUid   || '';
  document.getElementById('f-royalty-pct').value   = p.royaltyPct != null ? p.royaltyPct : 70;

  _toggleLessonsSection();
}

// ── SAVE ─────────────────────────────────────────────────────────
async function saveProduct() {
  const btn = document.getElementById('btn-save');
  btn.disabled = true; btn.textContent = 'Guardando…';

  const id = document.getElementById('f-id').value.trim();
  if (!id) { _toast('El ID del producto es obligatorio', 'err'); btn.disabled=false; btn.textContent='💾 Guardar producto'; return; }

  const price    = parseFloat(document.getElementById('f-price').value) || 0;
  const oldPrice = parseFloat(document.getElementById('f-old-price').value) || null;

  const data = {
    id,
    cat:          document.getElementById('f-cat').value,
    name:         document.getElementById('f-name').value.trim(),
    shortDesc:    document.getElementById('f-short').value.trim(),
    desc:         document.getElementById('f-desc').value.trim(),
    price,
    oldPrice:     oldPrice && oldPrice > price ? oldPrice : null,
    lsVariantKey: document.getElementById('f-ls-key').value.trim(),
    tier:         document.getElementById('f-tier').value || null,
    published:    document.getElementById('f-published').checked,
    popular:      document.getElementById('f-popular').checked,
    coverImage:   document.getElementById('cover-url').value.trim() || null,
    gallery:      _gallery.filter(Boolean),
    videoPreview: document.getElementById('f-video-preview').value.trim() || null,
    videoLessons:  _lessons,
    features:      _features,
    files:         _files,
    creatorName:   document.getElementById('f-creator-name').value.trim()  || null,
    creatorEmail:  document.getElementById('f-creator-email').value.trim() || null,
    creatorUid:    document.getElementById('f-creator-uid').value.trim()   || null,
    royaltyPct:    parseFloat(document.getElementById('f-royalty-pct').value) || 0,
    updatedAt:     firebase.firestore.FieldValue.serverTimestamp(),
    sortOrder:    _editId ? (_allProducts.find(p=>p.id===_editId)?.sortOrder || 99) : _allProducts.length + 1,
  };
  if (!_editId) {
    data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    data.purchases = 0;
  }

  try {
    await db.collection('products').doc(id).set(data, { merge: true });
    _toast(`"${data.name}" guardado ✓`, 'ok');
    closeEditor();
    await _loadProducts();
    _updateStats();
  } catch(e) {
    _toast('Error al guardar: ' + e.message, 'err');
  }
  btn.disabled=false; btn.textContent='💾 Guardar producto';
}

// ── DELETE ────────────────────────────────────────────────────────
async function deleteProduct() {
  if (!_editId) return;
  const p = _allProducts.find(x => x.id === _editId);
  if (!confirm(`¿Eliminar "${p?.name || _editId}"? Esta acción no se puede deshacer.`)) return;
  try {
    await db.collection('products').doc(_editId).delete();
    _toast('Producto eliminado', 'ok');
    closeEditor();
    _allProducts = _allProducts.filter(x => x.id !== _editId);
    _renderProducts();
    _updateStats();
  } catch(e) {
    _toast('Error al eliminar: ' + e.message, 'err');
  }
}

// ── COVER IMAGE ───────────────────────────────────────────────────
function handleCoverFile(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { _toast('La imagen supera 5MB', 'err'); return; }

  // Local preview
  const reader = new FileReader();
  reader.onload = e => _showCoverPreview(e.target.result);
  reader.readAsDataURL(file);

  // Upload to Firebase Storage if available
  if (storage) {
    const path = `products/${_editId||'new'}/${Date.now()}_${file.name}`;
    const ref  = storage.ref(path);
    ref.put(file).then(snap => snap.ref.getDownloadURL()).then(url => {
      document.getElementById('cover-url').value = url;
      _showCoverPreview(url);
      _toast('Imagen subida a Firebase Storage ✓', 'ok');
    }).catch(e => {
      _toast('Storage no disponible — usa la imagen local o una URL', 'info');
    });
  }
}

function previewCoverUrl(url) {
  if (!url) { _removeCover(); return; }
  _showCoverPreview(url);
}
function _showCoverPreview(src) {
  document.getElementById('cover-preview').src = src;
  document.getElementById('cover-preview-wrap').classList.add('show');
}
function _removeCover() {
  document.getElementById('cover-url').value = '';
  document.getElementById('cover-preview').src = '';
  document.getElementById('cover-preview-wrap').classList.remove('show');
}
// expose globally
window.Admin_removeCover = _removeCover;

// ── GALLERY ───────────────────────────────────────────────────────
function _renderGallerySlots() {
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = _gallery.map((url, i) => {
    if (url) {
      return `<div class="gallery-slot filled">
        <img src="${_esc(url)}" alt="Foto ${i+1}">
        <button class="gallery-slot-remove" onclick="Admin._galleryRemove(${i})">✕</button>
      </div>`;
    }
    return `<div class="gallery-slot">
      <input type="file" accept="image/*" onchange="Admin._galleryFile(this,${i})">
      <div class="gallery-add-icon">+</div>
      <div class="gallery-add-text">Foto ${i+1}</div>
    </div>`;
  }).join('');
}

function _galleryFile(input, index) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _gallery[index] = e.target.result;
    if (storage) {
      const path = `products/${_editId||'new'}/gallery_${index}_${Date.now()}`;
      storage.ref(path).put(file)
        .then(s => s.ref.getDownloadURL())
        .then(url => { _gallery[index] = url; _renderGallerySlots(); })
        .catch(() => {});
    }
    _renderGallerySlots();
  };
  reader.readAsDataURL(file);
}

function _galleryRemove(index) {
  _gallery[index] = null;
  _renderGallerySlots();
}

// ── VIDEO PREVIEW ─────────────────────────────────────────────────
function previewVideo(url) {
  const embedUrl = _toEmbedUrl(url);
  if (!embedUrl) { _hideVideoPreview(); return; }
  document.getElementById('video-preview-iframe').src = embedUrl;
  document.getElementById('video-preview-box').classList.add('show');
}
function _hideVideoPreview() {
  document.getElementById('video-preview-box').classList.remove('show');
  document.getElementById('video-preview-iframe').src = '';
}
function _toEmbedUrl(url) {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
  // Direct embed URL
  if (url.includes('embed')) return url;
  return null;
}

// ── LESSONS SECTION ───────────────────────────────────────────────
function _toggleLessonsSection() {
  const cat   = document.getElementById('f-cat').value;
  const show  = cat === 'curso' || cat === 'video';
  document.getElementById('lessons-section').style.display = show ? '' : 'none';
  document.getElementById('lessons-area').style.display    = show ? '' : 'none';
}

function addLesson() {
  _lessons.push({ title: '', duration: '0:00', free: false });
  _renderLessons();
}

function _renderLessons() {
  const list = document.getElementById('lesson-list');
  list.innerHTML = _lessons.map((l, i) =>
    `<div class="lesson-item">
       <span class="lesson-num">${i+1}</span>
       <input class="lesson-title-inp" type="text" value="${_esc(l.title)}" placeholder="Título de la lección" oninput="Admin._lessonUpdate(${i},'title',this.value)">
       <input class="lesson-dur-inp" type="text" value="${_esc(l.duration)}" placeholder="12:00" oninput="Admin._lessonUpdate(${i},'duration',this.value)">
       <label class="lesson-free-lbl"><input type="checkbox" ${l.free?'checked':''} onchange="Admin._lessonUpdate(${i},'free',this.checked)"> Gratis</label>
       <span class="lesson-remove" onclick="Admin._lessonRemove(${i})">🗑</span>
     </div>`
  ).join('');
}
function _lessonUpdate(i, field, val) { _lessons[i][field] = val; }
function _lessonRemove(i) { _lessons.splice(i,1); _renderLessons(); }

// ── FEATURES & FILES TAGS ─────────────────────────────────────────
function addTag(type) {
  const inputId = type === 'features' ? 'feature-input' : 'files-input';
  const val = document.getElementById(inputId).value.trim();
  if (!val) return;
  if (type === 'features') { _features.push(val); _renderTags('features'); }
  else { _files.push(val); _renderTags('files'); }
  document.getElementById(inputId).value = '';
}
function _renderTags(type) {
  const arr  = type === 'features' ? _features : _files;
  const list = document.getElementById(type + '-list');
  list.innerHTML = arr.map((t,i) =>
    `<div class="tag-item">
       <span>${_esc(t)}</span>
       <span class="tag-remove" onclick="Admin._removeTag('${type}',${i})">×</span>
     </div>`
  ).join('');
}
function _removeTag(type, i) {
  if (type === 'features') _features.splice(i,1); else _files.splice(i,1);
  _renderTags(type);
}

// ── HELPERS ───────────────────────────────────────────────────────
function _catLabel(cat) {
  return {patron:'Patrón',curso:'Curso',video:'Video',pack:'Pack',recurso:'Recurso'}[cat] || cat;
}
function _catEmoji(cat) {
  return {patron:'🧵',curso:'🎓',video:'🎬',pack:'📦',recurso:'📚'}[cat] || '📄';
}
function _esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function _show(id) { document.getElementById(id).style.display = 'flex'; }
function _hide(id) { document.getElementById(id).style.display = 'none'; }

function _toast(msg, type='info') {
  const c = document.getElementById('toast-root');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── PUBLIC API ────────────────────────────────────────────────────
window.Admin = {
  login, logout, showPanel, filterProducts,
  openEditor, closeEditor, saveProduct, deleteProduct,
  handleCoverFile, previewCoverUrl, removeCover: _removeCover,
  previewVideo,
  addLesson, addTag,
  markSalePaid,
  _galleryFile, _galleryRemove, _lessonUpdate, _lessonRemove, _removeTag,
};

// Wire cat change to toggle lessons
document.getElementById('f-cat').addEventListener('change', _toggleLessonsSection);

})();
