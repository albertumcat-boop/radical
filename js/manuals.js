'use strict';
window.PAT = window.PAT || {};

(function () {

  // ── helpers Firebase ───────────────────────────────────────────
  function _db()  { try { return window.firebase && firebase.firestore ? firebase.firestore() : null; } catch { return null; } }
  function _uid() { try { return firebase.auth().currentUser?.uid || null; } catch { return null; } }
  function _ts()  { try { return firebase.firestore.FieldValue.serverTimestamp(); } catch { return null; } }

  // ── CRUD Manuales ──────────────────────────────────────────────

  async function crearManual(titulo, prendaNombre) {
    const uid = _uid();
    const data = {
      titulo:       titulo || 'Manual sin título',
      prendaNombre: prendaNombre || '',
      descripcion:  '',
      estado:       'borrador',
      precio:       0,
      thumbnail:    '',
      totalPasos:   0,
      creadoEn:     _ts() || new Date().toISOString(),
      actualizadoEn:_ts() || new Date().toISOString(),
    };
    if (uid) {
      const ref = await _db().collection('users').doc(uid).collection('manuales').add(data);
      return ref.id;
    }
    const id = 'manual_' + Date.now();
    const all = _loadLS();
    all[id] = { ...data, id, pasos: [], creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() };
    _saveLS(all);
    return id;
  }

  async function cargarManuales() {
    const uid = _uid();
    if (uid) {
      try {
        const snap = await _db().collection('users').doc(uid).collection('manuales')
          .orderBy('creadoEn', 'desc').limit(100).get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) { console.error('[Manuales]', e); return []; }
    }
    return Object.values(_loadLS()).sort((a, b) => b.creadoEn > a.creadoEn ? 1 : -1);
  }

  async function obtenerManual(id) {
    const uid = _uid();
    if (uid) {
      const doc = await _db().collection('users').doc(uid).collection('manuales').doc(id).get();
      if (!doc.exists) return null;
      const pasos = await cargarPasos(id);
      return { id: doc.id, ...doc.data(), pasos };
    }
    const all = _loadLS();
    return all[id] || null;
  }

  async function actualizarManual(id, cambios) {
    const uid = _uid();
    const upd = { ...cambios, actualizadoEn: _ts() || new Date().toISOString() };
    if (uid) {
      await _db().collection('users').doc(uid).collection('manuales').doc(id).update(upd);
    } else {
      const all = _loadLS();
      if (all[id]) { Object.assign(all[id], upd); _saveLS(all); }
    }
  }

  async function eliminarManual(id) {
    const uid = _uid();
    if (uid) {
      const pasosSnap = await _db().collection('users').doc(uid).collection('manuales').doc(id).collection('pasos').get();
      const batch = _db().batch();
      pasosSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await _db().collection('users').doc(uid).collection('manuales').doc(id).delete();
    } else {
      const all = _loadLS(); delete all[id]; _saveLS(all);
    }
  }

  // ── CRUD Pasos ─────────────────────────────────────────────────

  async function agregarPaso(manualId, paso) {
    const uid = _uid();
    const data = {
      orden:          paso.orden   ?? 0,
      svg:            paso.svg     || '',
      descripcion:    paso.descripcion  || '',
      autoDesc:       paso.autoDesc || '',
      newLineIndices: paso.newLineIndices || [],
      timestamp:      Date.now(),
    };
    if (uid) {
      const ref = await _db().collection('users').doc(uid)
        .collection('manuales').doc(manualId).collection('pasos').add(data);
      const allP = await cargarPasos(manualId);
      const upd = { totalPasos: allP.length };
      if (allP.length === 1) upd.thumbnail = paso.svg.slice(0, 800);
      await actualizarManual(manualId, upd);
      return ref.id;
    }
    const id = 'paso_' + Date.now();
    const all = _loadLS();
    if (all[manualId]) {
      all[manualId].pasos = all[manualId].pasos || [];
      all[manualId].pasos.push({ ...data, id });
      if (all[manualId].pasos.length === 1) all[manualId].thumbnail = paso.svg.slice(0, 800);
      all[manualId].totalPasos = all[manualId].pasos.length;
      _saveLS(all);
    }
    return id;
  }

  async function cargarPasos(manualId) {
    const uid = _uid();
    if (uid) {
      const snap = await _db().collection('users').doc(uid)
        .collection('manuales').doc(manualId).collection('pasos')
        .orderBy('orden').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    const all = _loadLS();
    return (all[manualId]?.pasos || []).sort((a, b) => a.orden - b.orden);
  }

  async function actualizarPaso(manualId, pasoId, cambios) {
    const uid = _uid();
    if (uid) {
      await _db().collection('users').doc(uid)
        .collection('manuales').doc(manualId).collection('pasos').doc(pasoId).update(cambios);
    } else {
      const all = _loadLS();
      const paso = all[manualId]?.pasos?.find(p => p.id === pasoId);
      if (paso) { Object.assign(paso, cambios); _saveLS(all); }
    }
  }

  async function eliminarPaso(manualId, pasoId) {
    const uid = _uid();
    if (uid) {
      await _db().collection('users').doc(uid)
        .collection('manuales').doc(manualId).collection('pasos').doc(pasoId).delete();
      const allP = await cargarPasos(manualId);
      await actualizarManual(manualId, { totalPasos: allP.length });
    } else {
      const all = _loadLS();
      if (all[manualId]) {
        all[manualId].pasos = all[manualId].pasos.filter(p => p.id !== pasoId);
        all[manualId].totalPasos = all[manualId].pasos.length;
        _saveLS(all);
      }
    }
  }

  async function reordenarPasos(manualId, pasoIds) {
    for (let i = 0; i < pasoIds.length; i++) {
      await actualizarPaso(manualId, pasoIds[i], { orden: i + 1 });
    }
  }

  // ── Publicar en tienda ─────────────────────────────────────────

  async function publicarEnTienda(manualId, datos) {
    const uid = _uid();
    if (!uid) throw new Error('Inicia sesión para publicar');
    await actualizarManual(manualId, {
      estado:      'publicado',
      precio:      datos.precio || 0,
      titulo:      datos.titulo,
      descripcion: datos.descripcion || '',
    });
    const manual = await obtenerManual(manualId);
    await _db().collection('products').doc('manual_' + manualId).set({
      id:          'manual_' + manualId,
      cat:         'manual',
      name:        datos.titulo,
      shortDesc:   (datos.descripcion || '').slice(0, 120),
      desc:        datos.descripcion || '',
      price:       datos.precio || 0,
      icon:        '📖',
      published:   true,
      userId:      uid,
      manualId,
      thumbnail:   manual?.thumbnail || '',
      totalPasos:  manual?.totalPasos || 0,
      creadoEn:    _ts() || new Date().toISOString(),
    });
  }

  async function despublicar(manualId) {
    await actualizarManual(manualId, { estado: 'borrador' });
    try {
      const uid = _uid();
      if (uid) await _db().collection('products').doc('manual_' + manualId).delete();
    } catch (_) {}
  }

  // ── localStorage fallback ──────────────────────────────────────
  const LS_KEY = 'patronai_manuales';
  function _loadLS() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; } }
  function _saveLS(d) { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch (_) {} }

  PAT.Manuals = {
    crearManual, cargarManuales, obtenerManual, actualizarManual, eliminarManual,
    agregarPaso, cargarPasos, actualizarPaso, eliminarPaso, reordenarPasos,
    publicarEnTienda, despublicar,
  };

})();
