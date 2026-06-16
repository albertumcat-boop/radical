'use strict';
window.PAT = window.PAT || {};

/**
 * PAT.NotasUsuario — notas didácticas por punto, por atelier.
 *
 * Estructura en Firestore:
 *   users/{uid}/configuracion/notas_nh
 *   → { 'blusa-trasera': { 'SM': 'texto...', 'A': 'texto...' }, ... }
 *
 * Fallback a localStorage cuando no hay sesión.
 */
PAT.NotasUsuario = (function () {

  const LS_KEY = 'pat_notas_nh';
  let _cache = {};   // { pieza: { pointName: texto } }
  let _loaded = false;

  // ── Persistencia ────────────────────────────────────────────────

  function _lsLoad() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function _lsSave(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
    catch (e) { console.warn('[NotasUsuario] localStorage write error', e); }
  }

  function _uid() {
    try { return firebase?.auth?.()?.currentUser?.uid || null; }
    catch (e) { return null; }
  }

  function _fsDoc() {
    try {
      const uid = _uid();
      if (!uid || !firebase?.firestore) return null;
      return firebase.firestore().collection('users').doc(uid)
        .collection('configuracion').doc('notas_nh');
    } catch (e) { return null; }
  }

  /** Carga todas las notas del usuario (Firestore → localStorage → vacío). */
  async function loadAll() {
    const doc = _fsDoc();
    if (doc) {
      try {
        const snap = await doc.get();
        _cache = snap.exists ? (snap.data() || {}) : {};
        _lsSave(_cache);   // sync local
        _loaded = true;
        console.log('[NotasUsuario] Notas cargadas desde Firestore');
        return;
      } catch (e) {
        console.warn('[NotasUsuario] Firestore error, usando localStorage', e.message);
      }
    }
    _cache = _lsLoad();
    _loaded = true;
  }

  /**
   * Devuelve las notas del usuario para una pieza,
   * mezcladas sobre las notas por defecto del sistema NH.
   *
   * @param {string} pieza  ej. 'blusa-trasera'
   * @param {object} defaults  { pointName: textoDefecto }
   * @returns {object}  { pointName: texto }
   */
  function getNotas(pieza, defaults = {}) {
    const user = _cache[pieza] || {};
    return Object.assign({}, defaults, user);
  }

  /**
   * Guarda o actualiza la nota de un punto.
   *
   * @param {string} pieza      ej. 'blusa-trasera'
   * @param {string} pointName  ej. 'SM'
   * @param {string} texto      Nueva nota (vacío = eliminar personalización)
   */
  async function setNota(pieza, pointName, texto) {
    if (!_cache[pieza]) _cache[pieza] = {};

    if (texto && texto.trim()) {
      _cache[pieza][pointName] = texto.trim();
    } else {
      delete _cache[pieza][pointName];
      if (Object.keys(_cache[pieza]).length === 0) delete _cache[pieza];
    }

    _lsSave(_cache);

    const doc = _fsDoc();
    if (doc) {
      try {
        // Guardado parcial: solo actualiza la pieza afectada
        await doc.set({ [pieza]: _cache[pieza] || {} }, { merge: true });
      } catch (e) {
        console.warn('[NotasUsuario] No se pudo guardar en Firestore', e.message);
      }
    }
  }

  /**
   * Devuelve la nota del usuario para un punto específico (o '' si no tiene).
   */
  function getNota(pieza, pointName) {
    return (_cache[pieza] || {})[pointName] || '';
  }

  // Cargar automáticamente al iniciar sesión
  document.addEventListener('pat:authChanged', (e) => {
    if (e.detail) {
      loadAll();
      // Cargar también los sistemas propios del atelier
      if (PAT.MisSistemas) PAT.MisSistemas.cargarTodos();
    } else {
      _cache = _lsLoad(); _loaded = true;
    }
  });

  // Cargar desde localStorage si ya hay datos antes del login
  _cache = _lsLoad();

  return { loadAll, getNotas, setNota, getNota };

})();
