'use strict';
/**
 * materiales.js
 * Gestión de materiales de apoyo (manuales, videos, imágenes, material de clase).
 *
 * Firestore:  ateliers/{atelierId}/materiales/{id}  (si el usuario pertenece a un atelier)
 *             users/{uid}/materiales/{id}            (fallback: usuario sin atelier)
 * Storage:    materiales/{uid}/{filename}
 *
 * Los materiales se comparten entre todos los empleados del mismo atelier
 * (PAT.Atelier.getMiAtelierIdCached()) — así un manual o video subido por
 * cualquiera del equipo aparece para todos, sin mezclarse con otros ateliers.
 *
 * Tipos:  manual | video | imagen | clase | referencia
 * Formato de un material:
 * {
 *   nombre:      string,
 *   tipo:        'manual'|'video'|'imagen'|'clase'|'referencia',
 *   descripcion: string,
 *   tags:        string[],        // ['blusa','manga',...]
 *   url:         string,          // URL pública (Storage o YouTube)
 *   storagePath: string|null,     // path en Firebase Storage (si es archivo)
 *   thumbnail:   string|null,     // URL miniatura
 *   mimeType:    string|null,
 *   tamaño:      number|null,     // bytes
 *   createdAt:   Timestamp,
 *   updatedAt:   Timestamp,
 * }
 */

window.PAT = window.PAT || {};
PAT.Materiales = (function () {

  // ── Helpers Firebase ──────────────────────────────────────────
  function _db()      { return window.firebase?.firestore?.(); }
  function _auth()    { return window.firebase?.auth?.(); }
  function _storage() { return window.firebase?.storage?.(); }

  function _col() {
    const uid = _auth()?.currentUser?.uid;
    if (!uid) throw new Error('No hay usuario autenticado');
    const atelierId = window.PAT?.Atelier?.getMiAtelierIdCached?.();
    if (atelierId) return _db().collection('ateliers').doc(atelierId).collection('materiales');
    return _db().collection('users').doc(uid).collection('materiales');
  }

  function _uid() {
    const uid = _auth()?.currentUser?.uid;
    if (!uid) throw new Error('No hay usuario autenticado');
    return uid;
  }

  // ── Subir archivo ─────────────────────────────────────────────

  /**
   * Sube un archivo a Firebase Storage y guarda el metadato en Firestore.
   * @param {File}   file
   * @param {object} opts  { nombre, tipo, descripcion, tags, onProgress }
   * @returns {Promise<string>} id del material
   */
  async function subir(file, opts = {}) {
    const uid  = _uid();
    const ext  = file.name.split('.').pop().toLowerCase();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `materiales/${uid}/${Date.now()}_${safe}`;

    // Detectar tipo desde mime si no viene en opts
    let tipo = opts.tipo || _detectTipo(file.type, ext);

    // Subir a Storage con progreso
    const ref  = _storage().ref(path);
    const task = ref.put(file);

    if (opts.onProgress) {
      task.on('state_changed', snap => {
        opts.onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      });
    }

    await task;
    const url = await ref.getDownloadURL();

    const meta = {
      nombre:      opts.nombre      || file.name,
      tipo,
      descripcion: opts.descripcion || '',
      tags:        opts.tags        || [],
      url,
      storagePath: path,
      thumbnail:   _thumbFromTipo(tipo, url),
      mimeType:    file.type,
      tamaño:      file.size,
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await _col().add(meta);
    return docRef.id;
  }

  /**
   * Agrega un video (YouTube u otro link) sin subir archivo.
   */
  async function agregarVideo(url, opts = {}) {
    const meta = {
      nombre:      opts.nombre      || 'Video',
      tipo:        'video',
      descripcion: opts.descripcion || '',
      tags:        opts.tags        || [],
      url,
      storagePath: null,
      thumbnail:   _youtubeThumb(url),
      mimeType:    null,
      tamaño:      null,
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await _col().add(meta);
    return docRef.id;
  }

  /**
   * Agrega cualquier URL externa (link a documento, página, etc.)
   */
  async function agregarLink(url, opts = {}) {
    const meta = {
      nombre:      opts.nombre      || 'Enlace',
      tipo:        opts.tipo        || 'referencia',
      descripcion: opts.descripcion || '',
      tags:        opts.tags        || [],
      url,
      storagePath: null,
      thumbnail:   null,
      mimeType:    null,
      tamaño:      null,
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await _col().add(meta);
    return docRef.id;
  }

  // ── CRUD ──────────────────────────────────────────────────────

  async function listar(filtros = {}) {
    let q = _col().orderBy('createdAt', 'desc');
    if (filtros.tipo) q = q.where('tipo', '==', filtros.tipo);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function actualizar(id, campos) {
    await _col().doc(id).set({
      ...campos,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  async function eliminar(id) {
    const doc = await _col().doc(id).get();
    if (!doc.exists) return;
    const { storagePath } = doc.data();
    if (storagePath) {
      try { await _storage().ref(storagePath).delete(); } catch {}
    }
    await _col().doc(id).delete();
  }

  // ── Helpers ──────────────────────────────────────────────────

  function _detectTipo(mime, ext) {
    if (mime.startsWith('video/') || ['mp4','webm','avi','mov'].includes(ext)) return 'video';
    if (mime.startsWith('image/') || ['jpg','jpeg','png','gif','webp'].includes(ext)) return 'imagen';
    if (mime === 'application/pdf' || ext === 'pdf') return 'manual';
    return 'referencia';
  }

  function _thumbFromTipo(tipo, url) {
    if (tipo === 'video') return _youtubeThumb(url);
    if (tipo === 'imagen') return url;
    return null;
  }

  function _youtubeThumb(url) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
  }

  // ── API pública ───────────────────────────────────────────────
  return { subir, agregarVideo, agregarLink, listar, actualizar, eliminar };

})();
