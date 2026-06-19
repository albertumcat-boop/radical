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

  /** Guarda (crea o reemplaza) la base de una pieza. Conserva las muestras
   *  de graduación existentes si ya había alguna. */
  async function guardar(bloqueId, data) {
    const prevMuestras = _cache[bloqueId]?.muestras || [];
    _cache[bloqueId] = Object.assign({}, data, {
      bloqueId, savedAt: new Date().toISOString(), muestras: prevMuestras,
    });
    await _persist();
  }

  /** Quita la base personalizada de una pieza (vuelve a generarse desde NH).
   *  Esto también borra sus muestras de graduación. */
  async function eliminar(bloqueId) {
    delete _cache[bloqueId];
    await _persist();
  }

  /** Agrega una muestra (medidas + puntos) para entrenar la graduación
   *  automática de esta pieza. Si la pieza no tenía base guardada todavía,
   *  esta muestra también se fija como la base actual. */
  async function agregarMuestra(bloqueId, data) {
    if (!_cache[bloqueId]) {
      _cache[bloqueId] = {
        bloqueId, name: data.name, points: data.points, lines: data.lines,
        ptCtr: data.ptCtr, medidas: data.medidas,
        savedAt: new Date().toISOString(), muestras: [],
      };
    }
    const entry = _cache[bloqueId];
    entry.muestras = entry.muestras || [];
    entry.muestras.push({
      medidas: data.medidas ? Object.assign({}, data.medidas) : {},
      points: JSON.parse(JSON.stringify(data.points || {})),
      savedAt: new Date().toISOString(),
    });
    await _persist();
    return entry.muestras.length;
  }

  /** Devuelve las muestras de graduación guardadas para una pieza (array,
   *  vacío si no hay ninguna). */
  function obtenerMuestras(bloqueId) {
    return (_cache[bloqueId]?.muestras) || [];
  }

  /** Elimina una muestra de graduación por índice (la que se ve en el
   *  visor "📊 Muestras guardadas" del editor). */
  async function eliminarMuestra(bloqueId, idx) {
    const entry = _cache[bloqueId];
    if (!entry || !entry.muestras || !entry.muestras[idx]) return false;
    entry.muestras.splice(idx, 1);
    await _persist();
    return true;
  }

  // Cargar automáticamente al iniciar/cerrar sesión (mismo patrón que NotasUsuario)
  document.addEventListener('pat:authChanged', (e) => {
    if (e.detail) loadAll();
    else { _cache = _lsLoad(); _loaded = true; }
  });

  // Cache local disponible de inmediato, antes de resolver el login
  _cache = _lsLoad();

  return { loadAll, listar, obtener, guardar, eliminar, agregarMuestra, obtenerMuestras, eliminarMuestra };

})();
