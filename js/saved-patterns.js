'use strict';
window.PAT = window.PAT || {};

/**
 * PAT.SavedPatterns — patrones guardados por el usuario desde el editor
 * (botón "💾 Guardar pieza"), sincronizados a su cuenta.
 *
 * Antes esto vivía SOLO en localStorage (clave 'pat_v6') — si el usuario
 * limpiaba datos del navegador, cambiaba de dispositivo, o usaba modo
 * incógnito, perdía todos sus patrones guardados sin posibilidad de
 * recuperarlos. Ahora se sincroniza a Firestore con el mismo patrón que
 * PAT.PieceBases / PAT.NotasUsuario / PAT.MeasurementProfiles: cache local
 * inmediata para lectura síncrona, y sincronización async a la cuenta.
 *
 * Estructura: { [id]: { id, name, points, lines, ptCtr, savedAt } }
 */
PAT.SavedPatterns = (function () {

  const LS_KEY = 'pat_v6'; // misma clave que el localStorage legado, para migrar sin perder datos
  let _cache = {};
  let _loaded = false;
  let _unsubscribe = null; // listener onSnapshot activo

  function _lsLoad() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function _lsSave(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
    catch (e) { console.warn('[SavedPatterns] localStorage write error', e); }
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
        .collection('configuracion').doc('patrones_guardados');
    } catch (e) { return null; }
  }

  /** Carga y suscribe en tiempo real (onSnapshot). Si hay datos locales pendientes
   *  de subir, los fusiona en el primer snapshot y los persiste. */
  async function loadAll() {
    // Cancelar listener previo si existe (ej. re-login)
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }

    const doc = _fsDoc();
    const local = _lsLoad();

    if (doc) {
      // Merge inicial: subir locales pendientes antes de activar el listener
      try {
        const snap = await doc.get();
        const remoto = snap.exists ? (snap.data().patrones || {}) : {};
        const faltantes = Object.keys(local).some(id => !remoto[id]);
        if (faltantes) {
          const merged = Object.assign({}, remoto, local);
          await doc.set({ patrones: merged }, { merge: true });
        }
      } catch (e) { /* sin conexión — el listener actualizará cuando vuelva */ }

      // Listener en tiempo real: mantiene la cache sincronizada entre pestañas/dispositivos
      _unsubscribe = doc.onSnapshot(
        (snap) => {
          if (snap.exists) {
            _cache = snap.data().patrones || {};
            _lsSave(_cache);
            _loaded = true;
            console.log('[SavedPatterns] Sync:', Object.keys(_cache).length, 'patrones');
          }
        },
        (e) => { console.warn('[SavedPatterns] onSnapshot error:', e.message); }
      );
      return;
    }

    _cache = local;
    _loaded = true;
  }

  async function _persist() {
    _lsSave(_cache);
    const doc = _fsDoc();
    if (doc) {
      try { await doc.set({ patrones: _cache }, { merge: true }); }
      catch (e) { console.warn('[SavedPatterns] No se pudo guardar en Firestore', e.message); }
    }
  }

  // ── API ────────────────────────────────────────────────────────

  /** Devuelve el diccionario {id: patron} con todos los guardados (lectura síncrona, desde cache). */
  function obtenerTodos() { return _cache; }

  function obtener(id) { return _cache[id] || null; }

  /** Guarda (crea o reemplaza) un patrón. Devuelve el id usado. */
  async function guardar(id, data) {
    const finalId = id || ('sv6_' + Date.now());
    _cache[finalId] = Object.assign({}, data, { id: finalId, savedAt: new Date().toISOString() });
    await _persist();
    return finalId;
  }

  async function eliminar(id) {
    delete _cache[id];
    await _persist();
  }

  document.addEventListener('pat:authChanged', (e) => {
    if (e.detail) {
      loadAll();
    } else {
      if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
      _cache = _lsLoad(); _loaded = true;
    }
  });

  // Cache local disponible de inmediato, antes de resolver el login
  _cache = _lsLoad();

  return { loadAll, obtenerTodos, obtener, guardar, eliminar };

})();
