'use strict';
window.PAT = window.PAT || {};

/**
 * PAT.PieceBases — versiones "base" personalizadas por pieza, guardadas por
 * el usuario desde el editor (botón "📌 Guardar como base de esta pieza").
 *
 * Cuando el usuario corrige a mano un trazado (ej. camisa-posterior) y lo fija
 * como base, el asistente cargará ESA versión la próxima vez que se genere
 * esa misma pieza, en vez de regenerarla desde las fórmulas NH.
 *
 * Persistencia: Firestore (users/{uid}/configuracion/bases_piezas)
 * con fallback/cache a localStorage cuando no hay sesión — mismo patrón que
 * PAT.NotasUsuario y PAT.MeasurementProfiles.
 *
 * Estructura: { [bloqueId]: { bloqueId, name, points, lines, ptCtr, medidas, savedAt } }
 *
 * Nota: bloqueId no distingue género (ej. "camisa-posterior" sirve para dama
 * y caballero, las fórmulas solo escalan con las medidas) — guardar una base
 * para esa pieza afecta a ambos.
 */
PAT.PieceBases = (function () {

  const LS_KEY = 'pat_v6_bases'; // mismo key que el localStorage legado, para migrar sin perder datos
  let _cache = {};
  let _loaded = false;

  // ── Persistencia local ──────────────────────────────────────────
  function _lsLoad() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function _lsSave(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
    catch (e) { console.warn('[PieceBases] localStorage write error', e); }
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
        .collection('configuracion').doc('bases_piezas');
    } catch (e) { return null; }
  }

  /** Carga todas las bases del usuario (Firestore → localStorage → vacío). */
  async function loadAll() {
    const doc = _fsDoc();
    if (doc) {
      try {
        const snap = await doc.get();
        _cache = snap.exists ? (snap.data().bases || {}) : {};
        _lsSave(_cache); // sincroniza copia local
        _loaded = true;
        console.log('[PieceBases] Bases cargadas desde Firestore:', Object.keys(_cache).length);
        return;
      } catch (e) {
        console.warn('[PieceBases] Firestore error, usando localStorage', e.message);
      }
    }
    _cache = _lsLoad();
    _loaded = true;
  }

  async function _persist() {
    _lsSave(_cache);
    const doc = _fsDoc();
    if (doc) {
      try { await doc.set({ bases: _cache }, { merge: true }); }
      catch (e) { console.warn('[PieceBases] No se pudo guardar en Firestore', e.message); }
    }
  }

  // ── API ────────────────────────────────────────────────────────

  /** Lista los bloqueId que tienen una base personalizada guardada. */
  function listar() { return Object.keys(_cache); }

  /** Devuelve la base guardada para un bloqueId, o null si no hay ninguna. */
  function obtener(bloqueId) {
    if (!bloqueId) return null;
    return _cache[bloqueId] || null;
  }

  /** Guarda (crea o reemplaza) la base de una pieza. */
  async function guardar(bloqueId, data) {
    _cache[bloqueId] = Object.assign({}, data, { bloqueId, savedAt: new Date().toISOString() });
    await _persist();
  }

  /** Quita la base personalizada de una pieza (vuelve a generarse desde NH). */
  async function eliminar(bloqueId) {
    delete _cache[bloqueId];
    await _persist();
  }

  // Cargar automáticamente al iniciar/cerrar sesión (mismo patrón que NotasUsuario)
  document.addEventListener('pat:authChanged', (e) => {
    if (e.detail) loadAll();
    else { _cache = _lsLoad(); _loaded = true; }
  });

  // Cache local disponible de inmediato, antes de resolver el login
  _cache = _lsLoad();

  return { loadAll, listar, obtener, guardar, eliminar };

})();
