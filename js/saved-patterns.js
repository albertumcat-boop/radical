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

  /** Carga todos los patrones guardados del usuario (Firestore → localStorage → vacío).
   *  Si hay datos locales que no están en Firestore (ej. guardados antes de
   *  iniciar sesión), se fusionan y se suben para no perderlos. */
  async function loadAll() {
    const doc = _fsDoc();
    const local = _lsLoad();
    if (doc) {
      try {
        const snap = await doc.get();
        const remoto = snap.exists ? (snap.data().patrones || {}) : {};
        // Fusionar: lo local que no esté en remoto se considera pendiente de subir
        const merged = Object.assign({}, remoto, local);
        _cache = merged;
        _lsSave(_cache);
        _loaded = true;
        // Subir cualquier patrón local que faltara en Firestore
        const faltantes = Object.keys(local).some(id => !remoto[id]);
        if (faltantes) await _persist();
        console.log('[SavedPatterns] Patrones cargados:', Object.keys(_cache).length);
        return;
      } catch (e) {
        console.warn('[SavedPatterns] Firestore error, usando localStorage', e.message);
      }
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

  // Cargar automáticamente al iniciar/cerrar sesión (mismo patrón que NotasUsuario/PieceBases)
  document.addEventListener('pat:authChanged', (e) => {
    if (e.detail) loadAll();
    else { _cache = _lsLoad(); _loaded = true; }
  });

  // Cache local disponible de inmediato, antes de resolver el login
  _cache = _lsLoad();

  return { loadAll, obtenerTodos, obtener, guardar, eliminar };

})();
