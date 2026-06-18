'use strict';
window.PAT = window.PAT || {};

/**
 * PAT.MeasurementProfiles — perfiles de medidas reutilizables (tipo
 * SeamlyME de Seamly2D), para no tener que re-tipear las medidas de un
 * cliente cada vez que se genera una pieza nueva.
 *
 * Persistencia: Firestore (users/{uid}/configuracion/perfiles_medidas)
 * con fallback/cache a localStorage cuando no hay sesión.
 *
 * Además permite exportar/importar un perfil individual como archivo
 * .json (compatible entre dispositivos / para compartir con un colega).
 *
 * Estructura de un perfil:
 *   { id, nombre, medidas: { bust, waist, hip, shoulder, neck, ... },
 *     genero: 'mujer'|'hombre'|'nino', notas: '', savedAt }
 */
PAT.MeasurementProfiles = (function () {

  const LS_KEY = 'pat_perfiles_medidas';
  let _cache = {};   // { id: perfil }
  let _loaded = false;

  // ── Persistencia local ──────────────────────────────────────────
  function _lsLoad() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function _lsSave(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
    catch (e) { console.warn('[MeasurementProfiles] localStorage write error', e); }
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
        .collection('configuracion').doc('perfiles_medidas');
    } catch (e) { return null; }
  }

  /** Carga todos los perfiles del usuario (Firestore → localStorage → vacío). */
  async function loadAll() {
    const doc = _fsDoc();
    if (doc) {
      try {
        const snap = await doc.get();
        _cache = snap.exists ? (snap.data().perfiles || {}) : {};
        _lsSave(_cache); // sincroniza copia local
        _loaded = true;
        console.log('[MeasurementProfiles] Perfiles cargados desde Firestore:', Object.keys(_cache).length);
        return;
      } catch (e) {
        console.warn('[MeasurementProfiles] Firestore error, usando localStorage', e.message);
      }
    }
    _cache = _lsLoad();
    _loaded = true;
  }

  async function _persist() {
    _lsSave(_cache);
    const doc = _fsDoc();
    if (doc) {
      try { await doc.set({ perfiles: _cache }, { merge: true }); }
      catch (e) { console.warn('[MeasurementProfiles] No se pudo guardar en Firestore', e.message); }
    }
  }

  // ── API ────────────────────────────────────────────────────────

  /** Lista todos los perfiles guardados, ordenados por nombre. */
  function listar() {
    return Object.values(_cache).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }

  function obtener(id) { return _cache[id] || null; }

  /**
   * Guarda (crea o actualiza) un perfil de medidas.
   * @param {string} nombre   ej. "Cliente Ana López"
   * @param {object} medidas  objeto plano { bust, waist, hip, ... } en cm
   * @param {object} opts     { id (para actualizar uno existente), genero, notas }
   * @returns {string} id del perfil guardado
   */
  async function guardar(nombre, medidas, opts = {}) {
    const id = opts.id || ('mp_' + Date.now());
    _cache[id] = {
      id,
      nombre: nombre || 'Sin nombre',
      medidas: JSON.parse(JSON.stringify(medidas || {})),
      genero: opts.genero || '',
      notas: opts.notas || '',
      savedAt: new Date().toISOString(),
    };
    await _persist();
    return id;
  }

  async function eliminar(id) {
    delete _cache[id];
    await _persist();
  }

  /** Exporta un perfil como objeto plano listo para JSON.stringify / descarga. */
  function exportarJSON(id) {
    const p = _cache[id];
    if (!p) return null;
    return JSON.stringify(p, null, 2);
  }

  /** Dispara la descarga de un perfil como archivo .json. */
  function descargarArchivo(id) {
    const p = _cache[id];
    if (!p) return;
    const blob = new Blob([exportarJSON(id)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medidas_${(p.nombre || 'perfil').replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Importa un perfil desde un string JSON (contenido de archivo .json).
   * Valida que tenga al menos un objeto "medidas" antes de aceptarlo.
   * @returns {string} id del nuevo perfil importado
   */
  async function importarJSON(jsonStr) {
    let data;
    try { data = JSON.parse(jsonStr); }
    catch (e) { throw new Error('Archivo JSON inválido'); }
    if (!data || typeof data.medidas !== 'object') {
      throw new Error('El archivo no tiene el formato esperado de un perfil de medidas (falta "medidas")');
    }
    return guardar(data.nombre || 'Perfil importado', data.medidas, { genero: data.genero, notas: data.notas });
  }

  // Cargar automáticamente al iniciar/cerrar sesión (mismo patrón que NotasUsuario)
  document.addEventListener('pat:authChanged', (e) => {
    if (e.detail) loadAll();
    else { _cache = _lsLoad(); _loaded = true; }
  });

  // Cache local disponible de inmediato, antes de resolver el login
  _cache = _lsLoad();

  return { loadAll, listar, obtener, guardar, eliminar, exportarJSON, descargarArchivo, importarJSON };

})();
