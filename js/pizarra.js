'use strict';
window.PAT = window.PAT || {};

/**
 * PAT.Pizarra — capa de datos para Pizarras de Inspiración.
 *
 * Firestore: users/{uid}/pizarras/{pizarraId}
 *   { nombre, creadaEn, items: [ {id,type,x,y,w,h,...} ] }
 *
 * Fallback: localStorage 'pat_pizarras'
 */
PAT.Pizarra = (function () {

  const LS_KEY = 'pat_pizarras';

  function _uid() {
    try { return firebase?.auth?.()?.currentUser?.uid || null; }
    catch(e) { return null; }
  }
  function _col() {
    try {
      const uid = _uid();
      if (!uid || typeof firebase === 'undefined') return null;
      return firebase.firestore().collection('users').doc(uid).collection('pizarras');
    } catch(e) { return null; }
  }
  function _storage() {
    try {
      if (typeof firebase === 'undefined') return null;
      return firebase.storage();
    } catch(e) { return null; }
  }

  // ── localStorage helpers ─────────────────────────────────────
  function _lsAll()   { try { return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); } catch(e){ return []; } }
  function _lsSave(d) { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch(e){} }

  // ── CRUD pizarras ────────────────────────────────────────────

  async function listar() {
    const col = _col();
    if (col) {
      try {
        const snap = await col.orderBy('creadaEn','desc').limit(30).get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch(e) { console.warn('[Pizarra] listar Firestore error', e.message); }
    }
    return _lsAll();
  }

  async function crear(nombre = 'Nueva Pizarra') {
    const nueva = {
      nombre,
      creadaEn: new Date().toISOString(),
      items: [],
    };
    const col = _col();
    if (col) {
      try {
        const ref = await col.add({
          ...nueva,
          creadaEn: firebase.firestore.FieldValue.serverTimestamp(),
        });
        return { id: ref.id, ...nueva };
      } catch(e) { console.warn('[Pizarra] crear Firestore error', e.message); }
    }
    const id = 'pz_' + Date.now();
    const lista = _lsAll();
    lista.unshift({ id, ...nueva });
    _lsSave(lista);
    return { id, ...nueva };
  }

  async function renombrar(id, nombre) {
    const col = _col();
    if (col) {
      try { await col.doc(id).update({ nombre }); return; } catch(e) {}
    }
    const lista = _lsAll();
    const idx = lista.findIndex(p => p.id === id);
    if (idx !== -1) { lista[idx].nombre = nombre; _lsSave(lista); }
  }

  async function eliminar(id) {
    const col = _col();
    if (col) {
      try { await col.doc(id).delete(); return; } catch(e) {}
    }
    _lsSave(_lsAll().filter(p => p.id !== id));
  }

  async function cargar(id) {
    const col = _col();
    if (col) {
      try {
        const doc = await col.doc(id).get();
        if (doc.exists) return { id: doc.id, ...doc.data() };
      } catch(e) { console.warn('[Pizarra] cargar Firestore error', e.message); }
    }
    return _lsAll().find(p => p.id === id) || null;
  }

  // ── Items ────────────────────────────────────────────────────

  async function guardarItems(pizarraId, items) {
    const col = _col();
    if (col) {
      try {
        await col.doc(pizarraId).update({ items });
        return;
      } catch(e) { console.warn('[Pizarra] guardarItems Firestore error', e.message); }
    }
    const lista = _lsAll();
    const idx = lista.findIndex(p => p.id === pizarraId);
    if (idx !== -1) { lista[idx].items = items; _lsSave(lista); }
  }

  // ── Subida de imágenes / audio ───────────────────────────────

  async function subirArchivo(pizarraId, file, onProgress) {
    const st = _storage();
    const uid = _uid();
    if (!st || !uid) {
      // Fallback: dataURL (solo funciona bien con imágenes pequeñas)
      return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
    }
    const path = `users/${uid}/pizarras/${pizarraId}/${Date.now()}_${file.name}`;
    const ref  = st.ref(path);
    const task = ref.put(file);
    return new Promise((res, rej) => {
      task.on('state_changed',
        snap => onProgress && onProgress(Math.round(snap.bytesTransferred/snap.totalBytes*100)),
        rej,
        async () => res(await ref.getDownloadURL())
      );
    });
  }

  return { listar, crear, renombrar, eliminar, cargar, guardarItems, subirArchivo };
})();
