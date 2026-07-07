'use strict';
/**
 * atelier.js
 * Sistema de "Atelier" (taller) con varios empleados.
 *
 * Modelo de datos:
 *   ateliers/{atelierId}        { nombre, ownerUid, codigo, empleados:[uid,...], createdAt }
 *   atelierCodes/{codigo}       { atelierId }   ← lookup por código, no enumerable (allow get, no list)
 *   users/{uid}.atelierId       ← referencia al atelier al que pertenece (dueño o empleado)
 *
 * Lo que se comparte entre empleados del mismo atelier:
 *   - Materiales de apoyo (manuales, videos, clases) → ateliers/{atelierId}/materiales/{id}
 * Lo que NO se comparte (cada empleado lo suyo, ligado a su propio uid):
 *   - Patrones / bloques base / mis sistemas / clientes del Panel Atelier
 */

window.PAT = window.PAT || {};
PAT.Atelier = (function () {

  let _miAtelier = null; // cache del doc { id, nombre, ownerUid, codigo, empleados }

  function _db()   { return window.firebase?.firestore?.(); }
  function _auth() { return window.firebase?.auth?.(); }
  function _uid()  {
    const uid = _auth()?.currentUser?.uid;
    if (!uid) throw new Error('No hay usuario autenticado');
    return uid;
  }

  function _genCodigo() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos (0,O,1,I)
    let c = '';
    for (let i = 0; i < 7; i++) c += abc[Math.floor(Math.random() * abc.length)];
    return c;
  }

  /**
   * Crea un atelier nuevo. El usuario actual queda como dueño y primer empleado.
   * Genera un código único (reintenta si hay colisión, muy improbable con 7 chars).
   */
  async function crearAtelier(nombre) {
    const uid = _uid();
    const db  = _db();
    const nombreFinal = (nombre || '').trim() || 'Mi Atelier';

    let codigo, codigoRef, intento = 0;
    do {
      codigo = _genCodigo();
      codigoRef = db.collection('atelierCodes').doc(codigo);
      intento++;
    } while ((await codigoRef.get()).exists && intento < 5);

    const atelierRef = db.collection('ateliers').doc();
    const batch = db.batch();
    batch.set(atelierRef, {
      nombre: nombreFinal,
      ownerUid: uid,
      codigo,
      empleados: [uid],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    batch.set(codigoRef, { atelierId: atelierRef.id });
    batch.set(db.collection('users').doc(uid), { atelierId: atelierRef.id }, { merge: true });
    await batch.commit();

    _miAtelier = { id: atelierRef.id, nombre: nombreFinal, ownerUid: uid, codigo, empleados: [uid] };
    document.dispatchEvent(new CustomEvent('pat:atelierChanged', { detail: _miAtelier }));
    return _miAtelier;
  }

  /**
   * Un empleado se une a un atelier existente usando el código que le dio el dueño.
   */
  async function unirseConCodigo(codigoTexto) {
    const uid = _uid();
    const db  = _db();
    const codigo = String(codigoTexto || '').trim().toUpperCase();
    if (!codigo) throw new Error('Ingresa un código');

    const codigoDoc = await db.collection('atelierCodes').doc(codigo).get();
    if (!codigoDoc.exists) throw new Error('Código de atelier no válido');
    const atelierId = codigoDoc.data().atelierId;

    const atelierRef = db.collection('ateliers').doc(atelierId);
    await atelierRef.update({
      empleados: firebase.firestore.FieldValue.arrayUnion(uid),
    });
    await db.collection('users').doc(uid).set({ atelierId }, { merge: true });

    const snap = await atelierRef.get();
    _miAtelier = { id: atelierId, ...snap.data() };
    document.dispatchEvent(new CustomEvent('pat:atelierChanged', { detail: _miAtelier }));
    return _miAtelier;
  }

  /**
   * Sale del atelier actual. Si es el dueño, no se permite salir (debe transferir
   * o eliminar el atelier desde soporte) — solo empleados normales pueden salir.
   */
  async function salirDelAtelier() {
    if (!_miAtelier) await getMiAtelier();
    if (!_miAtelier) return;
    const uid = _uid();
    if (_miAtelier.ownerUid === uid) {
      throw new Error('El dueño no puede salir de su propio atelier');
    }
    const db = _db();
    await db.collection('ateliers').doc(_miAtelier.id).update({
      empleados: firebase.firestore.FieldValue.arrayRemove(uid),
    });
    await db.collection('users').doc(uid).set({ atelierId: firebase.firestore.FieldValue.delete() }, { merge: true });
    _miAtelier = null;
    document.dispatchEvent(new CustomEvent('pat:atelierChanged', { detail: null }));
  }

  /**
   * Devuelve el atelier del usuario actual (o null si no pertenece a ninguno).
   * Usa caché en memoria tras la primera consulta de la sesión.
   */
  async function getMiAtelier(force) {
    if (_miAtelier && !force) return _miAtelier;
    try {
      const uid = _uid();
      const db = _db();
      const userDoc = await db.collection('users').doc(uid).get();
      const atelierId = userDoc.exists ? userDoc.data().atelierId : null;
      if (!atelierId) { _miAtelier = null; return null; }
      const snap = await db.collection('ateliers').doc(atelierId).get();
      if (!snap.exists) { _miAtelier = null; return null; }
      _miAtelier = { id: atelierId, ...snap.data() };
      return _miAtelier;
    } catch (e) {
      _miAtelier = null;
      return null;
    }
  }

  /** Versión síncrona usando solo lo cacheado — útil para otros módulos (materiales.js). */
  function getMiAtelierIdCached() {
    return _miAtelier ? _miAtelier.id : null;
  }

  /**
   * Devuelve un array con { uid, email, esOwner } de cada empleado.
   * Necesita leer cada doc users/{uid} para obtener el email.
   */
  async function listarEmpleados() {
    const atelier = await getMiAtelier();
    if (!atelier) return [];
    const db = _db();
    const uids = atelier.empleados || [];
    const results = await Promise.all(
      uids.map(async uid => {
        try {
          const doc = await db.collection('users').doc(uid).get();
          const email = doc.exists ? (doc.data().email || uid) : uid;
          return { uid, email, esOwner: uid === atelier.ownerUid };
        } catch { return { uid, email: uid, esOwner: uid === atelier.ownerUid }; }
      })
    );
    // Owner siempre primero
    return results.sort((a, b) => (b.esOwner ? 1 : 0) - (a.esOwner ? 1 : 0));
  }

  /**
   * El dueño expulsa a un empleado.
   * Solo el owner puede expulsar; no puede expulsarse a sí mismo.
   */
  async function expulsarEmpleado(targetUid) {
    const uid = _uid();
    const atelier = await getMiAtelier();
    if (!atelier) throw new Error('No perteneces a ningún atelier');
    if (atelier.ownerUid !== uid) throw new Error('Solo el dueño puede expulsar miembros');
    if (targetUid === uid) throw new Error('No puedes expulsarte a ti mismo');
    const db = _db();
    const batch = db.batch();
    batch.update(db.collection('ateliers').doc(atelier.id), {
      empleados: firebase.firestore.FieldValue.arrayRemove(targetUid),
    });
    batch.set(db.collection('users').doc(targetUid),
      { atelierId: firebase.firestore.FieldValue.delete() }, { merge: true });
    await batch.commit();
    _miAtelier.empleados = (_miAtelier.empleados || []).filter(u => u !== targetUid);
    document.dispatchEvent(new CustomEvent('pat:atelierChanged', { detail: _miAtelier }));
  }

  /**
   * El dueño genera un nuevo código de invitación.
   * Invalida el anterior borrando su doc en atelierCodes.
   */
  async function regenerarCodigo() {
    const uid = _uid();
    const atelier = await getMiAtelier();
    if (!atelier) throw new Error('No tienes un atelier');
    if (atelier.ownerUid !== uid) throw new Error('Solo el dueño puede regenerar el código');
    const db = _db();

    let nuevoCodigo, codigoRef, intento = 0;
    do {
      nuevoCodigo = _genCodigo();
      codigoRef = db.collection('atelierCodes').doc(nuevoCodigo);
      intento++;
    } while ((await codigoRef.get()).exists && intento < 5);

    const batch = db.batch();
    // Borrar código viejo
    batch.delete(db.collection('atelierCodes').doc(atelier.codigo));
    // Crear código nuevo
    batch.set(codigoRef, { atelierId: atelier.id });
    // Actualizar doc del atelier
    batch.update(db.collection('ateliers').doc(atelier.id), { codigo: nuevoCodigo });
    await batch.commit();

    _miAtelier.codigo = nuevoCodigo;
    document.dispatchEvent(new CustomEvent('pat:atelierChanged', { detail: _miAtelier }));
    return nuevoCodigo;
  }

  return {
    crearAtelier,
    unirseConCodigo,
    salirDelAtelier,
    getMiAtelier,
    getMiAtelierIdCached,
    listarEmpleados,
    expulsarEmpleado,
    regenerarCodigo,
  };

})();
