'use strict';
window.PAT = window.PAT || {};

(function() {

  const firebaseConfig = {
    apiKey:            "AIzaSyCI1F7s_jYsa_-2IAuCPojMKJbTdOQZlvw",
    authDomain:        "radicalpro.firebaseapp.com",
    projectId:         "radicalpro",
    storageBucket:     "radicalpro.firebasestorage.app",
    messagingSenderId: "173737828098",
    appId:             "1:173737828098:web:01bddd1812062942092c1b"
  };

  let db   = null;
  let auth = null;
  let firebaseReady = false;

  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db   = firebase.firestore();
      auth = firebase.auth();
      firebaseReady = true;
      console.log('[PatrónAI] Firebase inicializado ✓ — proyecto: radicalpro');
    } else {
      console.warn('[PatrónAI] Firebase SDK no disponible. Modo offline.');
    }
  } catch (e) {
    console.warn('[PatrónAI] Error Firebase:', e.message, '— Modo offline activado.');
  }

  PAT.Firebase = {
    ready: firebaseReady,

    async savePattern(name, data) {
      if (!firebaseReady) return saveToLocalStorage(name, data);
      try {
        const docData = {
          name,
          garment:   data.garment,
          measures:  data.measures,
          params:    data.params,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        const ref = await db.collection('patterns').add(docData);
        console.log('[Firebase] Patrón guardado:', ref.id);
        return ref.id;
      } catch (e) {
        console.error('[Firebase] Error al guardar:', e);
        return saveToLocalStorage(name, data);
      }
    },

    async loadPatterns() {
      if (!firebaseReady) return loadFromLocalStorage();
      try {
        const snap = await db
          .collection('patterns')
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();
        const patterns = [];
        snap.forEach(doc => patterns.push({ id: doc.id, ...doc.data() }));
        return patterns;
      } catch (e) {
        console.error('[Firebase] Error al cargar:', e);
        return loadFromLocalStorage();
      }
    },

    async deletePattern(id) {
      if (!firebaseReady) { deleteFromLocalStorage(id); return; }
      try {
        await db.collection('patterns').doc(id).delete();
      } catch (e) {
        console.error('[Firebase] Error al eliminar:', e);
      }
    },
  };

  // ── Fallback localStorage ─────────────────────────────────────
  const LS_KEY = 'patronai_patterns';

  function saveToLocalStorage(name, data) {
    try {
      const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      const id = 'local_' + Date.now();
      existing.unshift({
        id, name,
        garment:   data.garment,
        measures:  data.measures,
        params:    data.params,
        createdAt: new Date().toISOString(),
      });
      if (existing.length > 20) existing.splice(20);
      localStorage.setItem(LS_KEY, JSON.stringify(existing));
      return id;
    } catch (e) {
      console.error('[PatrónAI] Error localStorage:', e);
      return null;
    }
  }

  function loadFromLocalStorage() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch (e) { return []; }
  }

  function deleteFromLocalStorage(id) {
    try {
      const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      localStorage.setItem(LS_KEY, JSON.stringify(existing.filter(p => p.id !== id)));
    } catch (e) { console.error('[PatrónAI] Error localStorage delete:', e); }
  }

})();
