/**
 * firebase-config.js
 * Configuración de Firebase (compat SDK v9).
 * REEMPLAZA los valores con los de tu proyecto Firebase.
 *
 * ⚠️  IMPORTANTE: En producción usa variables de entorno.
 *     Para Vercel: Settings → Environment Variables
 *     Para Firebase Hosting: No se pueden usar env vars en el cliente
 *     directamente — se recomienda usar Firebase Remote Config o
 *     almacenar la config en un endpoint seguro.
 */

'use strict';
window.PAT = window.PAT || {};

(function() {
  // ── Configuración del proyecto Firebase ───────────────────────────
  // Reemplaza estos valores con los de tu consola Firebase:
  // https://console.firebase.google.com → Tu proyecto → Configuración → General → Tus apps
  const firebaseConfig = {
    apiKey:            "TU_API_KEY",
    authDomain:        "TU_PROJECT_ID.firebaseapp.com",
    projectId:         "TU_PROJECT_ID",
    storageBucket:     "TU_PROJECT_ID.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId:             "TU_APP_ID",
  };

  // ── Inicializar Firebase ──────────────────────────────────────────
  let db = null;
  let auth = null;
  let firebaseReady = false;

  try {
    // firebase-app-compat.js ya está cargado en el <head>
    if (typeof firebase !== 'undefined') {
      // Evitar inicializar dos veces (hot-reload)
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db   = firebase.firestore();
      auth = firebase.auth();
      firebaseReady = true;
      console.log('[PatrónAI] Firebase inicializado ✓');
    } else {
      console.warn('[PatrónAI] Firebase SDK no disponible. Modo offline.');
    }
  } catch (e) {
    console.warn('[PatrónAI] Error Firebase:', e.message, '— Modo offline activado.');
  }

  // ── API pública para el resto de la app ──────────────────────────
  PAT.Firebase = {
    ready: firebaseReady,

    /**
     * Guardar un patrón en Firestore.
     * @param {string} name - nombre del patrón
     * @param {Object} data - datos a guardar (medidas, tipo, params)
     * @returns {Promise<string>} ID del documento creado
     */
    async savePattern(name, data) {
      if (!firebaseReady) {
        // Fallback: localStorage
        return saveToLocalStorage(name, data);
      }
      try {
        const docData = {
          name,
          garment:   data.garment,
          measures:  data.measures,
          params:    data.params,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        const ref = await db.collection(PAT.FB_COLLECTION).add(docData);
        console.log('[Firebase] Patrón guardado:', ref.id);
        return ref.id;
      } catch (e) {
        console.error('[Firebase] Error al guardar:', e);
        return saveToLocalStorage(name, data);
      }
    },

    /**
     * Cargar todos los patrones guardados.
     * @returns {Promise<Object[]>} lista de patrones
     */
    async loadPatterns() {
      if (!firebaseReady) {
        return loadFromLocalStorage();
      }
      try {
        const snap = await db
          .collection(PAT.FB_COLLECTION)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();

        const patterns = [];
        snap.forEach(doc => {
          patterns.push({ id: doc.id, ...doc.data() });
        });
        return patterns;
      } catch (e) {
        console.error('[Firebase] Error al cargar:', e);
        return loadFromLocalStorage();
      }
    },

    /**
     * Eliminar un patrón.
     * @param {string} id - ID del documento
     */
    async deletePattern(id) {
      if (!firebaseReady) {
        deleteFromLocalStorage(id);
        return;
      }
      try {
        await db.collection(PAT.FB_COLLECTION).doc(id).delete();
      } catch (e) {
        console.error('[Firebase] Error al eliminar:', e);
      }
    },
  };

  // ── Fallback: localStorage (modo offline) ─────────────────────────
  const LS_KEY = 'patronai_patterns';

  function saveToLocalStorage(name, data) {
    try {
      const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      const id = 'local_' + Date.now();
      existing.unshift({
        id,
        name,
        garment:   data.garment,
        measures:  data.measures,
        params:    data.params,
        createdAt: new Date().toISOString(),
      });
      // Limitar a 20 patrones locales
      if (existing.length > 20) existing.splice(20);
      localStorage.setItem(LS_KEY, JSON.stringify(existing));
      console.log('[PatrónAI] Patrón guardado en localStorage:', id);
      return id;
    } catch (e) {
      console.error('[PatrónAI] Error localStorage:', e);
      return null;
    }
  }

  function loadFromLocalStorage() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function deleteFromLocalStorage(id) {
    try {
      const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      const filtered = existing.filter(p => p.id !== id);
      localStorage.setItem(LS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('[PatrónAI] Error localStorage delete:', e);
    }
  }

})();
