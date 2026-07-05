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

  // ── Auth helpers ──────────────────────────────────────────────
  function _getCurrentUid() {
    try { return auth && auth.currentUser ? auth.currentUser.uid : null; }
    catch (e) { return null; }
  }

  // Escuchar cambios de sesión y actualizar tier automáticamente
  if (firebaseReady && auth) {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('[PatrónAI] Sesión activa:', user.email);
        if (PAT.AuthTier && PAT.AuthTier.loadTierFromFirestore) {
          await PAT.AuthTier.loadTierFromFirestore();
        }
        if (PAT.Atelier && PAT.Atelier.getMiAtelier) {
          await PAT.Atelier.getMiAtelier(true); // precarga el atelierId en caché para materiales.js
        }
        document.dispatchEvent(new CustomEvent('pat:authChanged', { detail: { uid: user.uid, email: user.email } }));
        // Cargar sistemas propios del usuario en PAT.Sistemas
        if (PAT.MisSistemas?.cargarTodos) PAT.MisSistemas.cargarTodos();
      } else {
        console.log('[PatrónAI] Sin sesión activa.');
        document.dispatchEvent(new CustomEvent('pat:authChanged', { detail: null }));
      }
    });
  }

  PAT.Firebase = {
    ready: firebaseReady,

    // ── Auth ─────────────────────────────────────────────────────
    async signUp(email, password) {
      if (!firebaseReady) throw new Error('Firebase no disponible');
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      // Crear documento de usuario con tier free por defecto
      await db.collection('users').doc(cred.user.uid).set({
        email, tier: 'free', createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return cred.user;
    },

    async signIn(email, password) {
      if (!firebaseReady) throw new Error('Firebase no disponible');
      const cred = await auth.signInWithEmailAndPassword(email, password);
      return cred.user;
    },

    async signOut() {
      if (!firebaseReady) return;
      await auth.signOut();
      ['pat_tier','pat_v6','pat_atelier_clients','pat_notas_nh',
       'pat_perfiles_medidas','pat_v6_bases','pat_pizarras','patronai_bgimages']
        .forEach(k => localStorage.removeItem(k));
      sessionStorage.removeItem('pat_session_token');
      sessionStorage.removeItem('pat_purchases');
    },

    async resetPassword(email) {
      if (!firebaseReady) throw new Error('Firebase no disponible');
      await auth.sendPasswordResetEmail(email);
    },

    /** Elimina la cuenta completa: subcollections + doc raíz + Auth. */
    async deleteAccount() {
      if (!firebaseReady) throw new Error('Firebase no disponible');
      const user = auth.currentUser;
      if (!user) throw new Error('No hay sesión activa');
      const uid = user.uid;
      const userRef = db.collection('users').doc(uid);

      // Borrar documentos de cada subcollección conocida
      const subcols = ['configuracion', 'bgImages', 'atelierClients', 'misSistemas', 'commissions'];
      for (const sub of subcols) {
        try {
          const snap = await userRef.collection(sub).limit(200).get();
          const batch = db.batch();
          snap.docs.forEach(d => batch.delete(d.ref));
          if (!snap.empty) await batch.commit();
        } catch (e) {
          console.warn('[Firebase] No se pudo borrar subcolección', sub, e.message);
        }
      }

      try { await userRef.delete(); } catch (e) {
        console.warn('[Firebase] No se pudo borrar doc usuario:', e.message);
      }
      await user.delete();
      ['pat_tier','pat_v6','pat_atelier_clients','pat_notas_nh',
       'pat_perfiles_medidas','pat_v6_bases','pat_pizarras','patronai_bgimages']
        .forEach(k => localStorage.removeItem(k));
      sessionStorage.removeItem('pat_session_token');
      sessionStorage.removeItem('pat_purchases');
    },

    // ── Patrones (aislados por userId) ───────────────────────────
    async savePattern(name, data) {
      const uid = _getCurrentUid();
      if (!firebaseReady || !uid) return saveToLocalStorage(name, data);
      try {
        const docData = {
          name,
          userId:    uid,
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
      const uid = _getCurrentUid();
      if (!firebaseReady || !uid) return loadFromLocalStorage();
      try {
        const snap = await db
          .collection('patterns')
          .where('userId', '==', uid)
          .orderBy('createdAt', 'desc')
          .limit(200)
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
      const uid = _getCurrentUid();
      if (!firebaseReady || !uid) { deleteFromLocalStorage(id); return; }
      try {
        // Verificar que el patrón pertenece al usuario antes de borrar
        const doc = await db.collection('patterns').doc(id).get();
        if (!doc.exists || doc.data().userId !== uid) {
          console.warn('[Firebase] Intento de borrar patrón ajeno bloqueado');
          return;
        }
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
