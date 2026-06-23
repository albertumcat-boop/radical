'use strict';
/**
 * image-library.js
 * Biblioteca de imágenes de referencia para "trazar sobre imagen".
 * Guarda las fotos que el usuario sube en el editor ✏ Trazar para
 * que pueda buscarlas y reutilizarlas después, sin tener que volver
 * a subirlas desde su dispositivo.
 *
 * Firestore path: users/{uid}/bgImages/{id}
 * Fallback: localStorage (sin sesión) — clave 'patronai_bgimages'
 *
 * Las imágenes se redimensionan/comprimen antes de guardarse para
 * mantenerse dentro del límite de 1MB por documento de Firestore.
 */

window.PAT = window.PAT || {};
PAT.ImageLibrary = (function () {

  const LS_KEY = 'patronai_bgimages';
  const MAX_DIM = 1400;     // px máximo de lado para guardar
  const JPEG_Q  = 0.78;

  function _db()  { return window.firebase?.firestore?.(); }
  function _auth(){ return window.firebase?.auth?.(); }
  function _uid() { return _auth()?.currentUser?.uid || null; }

  function _col() {
    const uid = _uid();
    if (!uid) return null;
    return _db().collection('users').doc(uid).collection('bgImages');
  }

  /** Redimensiona y comprime un dataURL para que quepa en Firestore. */
  function _comprimir(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.min(1, MAX_DIM / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', JPEG_Q), w, h });
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  /**
   * Guarda una imagen en la biblioteca.
   * @param {string} dataUrl - imagen original (cualquier formato)
   * @param {string} nombre  - nombre para buscarla luego
   * @param {number} anchoCm - ancho real calibrado (cm), para recordarlo la próxima vez
   * @returns {Promise<{id, dataUrl, nombre, w, h, anchoCm}>}
   */
  async function guardar(dataUrl, nombre, anchoCm) {
    const { dataUrl: comp, w, h } = await _comprimir(dataUrl);
    const col = _col();
    anchoCm = anchoCm || 50;

    if (col) {
      const ahora = firebase.firestore.FieldValue.serverTimestamp();
      const ref = await col.add({
        nombre: nombre || 'Imagen sin nombre',
        dataUrl: comp, w, h, anchoCm,
        createdAt: ahora, updatedAt: ahora,
      });
      return { id: ref.id, dataUrl: comp, nombre, w, h, anchoCm };
    }

    // Fallback localStorage
    const id = 'local_' + Date.now();
    const item = { id, nombre: nombre || 'Imagen sin nombre', dataUrl: comp, w, h, anchoCm, createdAt: new Date().toISOString() };
    try {
      const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      existing.unshift(item);
      if (existing.length > 15) existing.splice(15); // localStorage tiene espacio limitado
      localStorage.setItem(LS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('[ImageLibrary] Error guardando en localStorage:', e);
    }
    return item;
  }

  /** Actualiza el ancho calibrado (cm) de una imagen ya guardada. */
  async function actualizarAncho(id, anchoCm) {
    const col = _col();
    if (col) {
      await col.doc(id).set({ anchoCm, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return;
    }
    try {
      const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      const it = existing.find(x => x.id === id);
      if (it) it.anchoCm = anchoCm;
      localStorage.setItem(LS_KEY, JSON.stringify(existing));
    } catch (e) { console.error('[ImageLibrary] Error actualizando ancho en localStorage:', e); }
  }

  /** Lista todas las imágenes guardadas (más recientes primero). */
  async function listar() {
    const col = _col();
    if (col) {
      const snap = await col.orderBy('updatedAt', 'desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch (e) { return []; }
  }

  /** Elimina una imagen de la biblioteca por id. */
  async function eliminar(id) {
    const col = _col();
    if (col) { await col.doc(id).delete(); return; }
    try {
      const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      localStorage.setItem(LS_KEY, JSON.stringify(existing.filter(it => it.id !== id)));
    } catch (e) { console.error('[ImageLibrary] Error eliminando de localStorage:', e); }
  }

  /** Renombra una imagen guardada. */
  async function renombrar(id, nuevoNombre) {
    const col = _col();
    if (col) {
      await col.doc(id).set({ nombre: nuevoNombre, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return;
    }
    try {
      const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      const it = existing.find(x => x.id === id);
      if (it) it.nombre = nuevoNombre;
      localStorage.setItem(LS_KEY, JSON.stringify(existing));
    } catch (e) { console.error('[ImageLibrary] Error renombrando en localStorage:', e); }
  }

  return { guardar, listar, eliminar, renombrar, actualizarAncho };
})();
