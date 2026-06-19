/**
 * service-worker.js — PatrónAI Pro PWA
 * Cachea assets estáticos para modo offline.
 * Versión: debe actualizarse en cada deploy para invalidar caché.
 */

const CACHE_NAME   = 'patronai-v11';
const CACHE_STATIC = 'patronai-static-v11';

// Assets que se cachean en la instalación
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/css/monetization.css',
  '/js/constants.js',
  '/js/svg-utils.js',
  '/js/grading.js',
  '/js/instructions.js',
  '/js/share.js',
  '/js/pattern-engine.js',
  '/js/pdf-export.js',
  '/js/mannequin-3d.js',
  '/js/firebase-config.js',
  '/js/auth-tier.js',
  '/js/payment.js',
  '/js/affiliate.js',
  '/js/atelier-panel.js',
  '/js/drafter-ui.js',
  '/js/pattern-drafter.js',
  '/js/app.js',
  '/js/patterns/franela.js',
  '/js/patterns/blusa.js',
  '/js/patterns/camisa.js',
  '/js/patterns/falda.js',
  '/js/patterns/vestido.js',
  '/js/patterns/pantalon.js',
  '/js/patterns/short.js',
  '/js/patterns/blazer.js',
  '/js/patterns/chaleco.js',
  '/js/patterns/falda-lapiz.js',
  '/js/patterns/vestido-cruzado.js',
];

// URLs que NUNCA se cachean (siempre van a la red)
const NEVER_CACHE = [
  '/api/',
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'stripe.com',
  'js.stripe.com',
];

function shouldNeverCache(url) {
  return NEVER_CACHE.some(pattern => url.includes(pattern));
}

// ── Instalación: cachear assets estáticos ────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Instalando PatrónAI v2...');
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[SW] Assets cacheados ✓');
      return self.skipWaiting();
    })
  );
});

// ── Activación: limpiar cachés viejas ────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_STATIC && key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Eliminando caché vieja:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first para HTML/JS/CSS (siempre código fresco),
//          cache-first solo como respaldo si la red falla ──────────
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Nunca cachear APIs, Firebase, Stripe
  if (shouldNeverCache(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Solo cachear GET
  if (event.request.method !== 'GET') return;

  const isCodeAsset = event.request.destination === 'document' ||
    /\.(js|css)(\?.*)?$/.test(url);

  if (isCodeAsset) {
    // Network-first: siempre intenta traer la versión nueva primero.
    // Solo cae a caché si no hay conexión (modo offline).
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.destination === 'document') return caches.match('/index.html');
        });
      })
    );
    return;
  }

  // Resto de assets (imágenes, fuentes, etc.): cache-first está bien,
  // cambian poco entre deploys.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_STATIC).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ── Mensaje desde la app para forzar actualización ──────────────
self.addEventListener('message', event => {
  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
