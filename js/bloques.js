'use strict';
/**
 * bloques.js — Biblioteca de Bloques Base por usuario
 *
 * Cada usuario/atelier puede guardar sus patrones base con sus propias
 * fórmulas (fx/fy por punto). Al cargar un bloque y cambiar las medidas,
 * todos los puntos con fórmulas se recalculan automáticamente.
 *
 * Estructura en Firestore:
 *   users/{uid}/bloques/{bloque_id}
 *     name        : string
 *     categoria   : 'espalda'|'frente'|'manga'|'falda'|'pantalon'|'otro'
 *     descripcion : string
 *     points      : { [id]: { name, x, y, fx, fy } }
 *     lines       : [ { from, to, type, ctrl } ]
 *     ptCtr       : number
 *     medidasBase : { bust, waist, hip, ... }   ← medidas al guardar
 *     sistema     : string  ← nombre del sistema ("Aldrich", "Müller", "Propio")
 *     createdAt   : ISO string
 *     updatedAt   : ISO string
 *     version     : number  ← para historial de versiones futuro
 */

window.PAT = window.PAT || {};

PAT.Bloques = (function () {

  const COL = 'bloques'; // subcollection bajo users/{uid}/

  // ── Helpers Firebase ──────────────────────────────────────────────
  function _db()  { return window.firebase && firebase.firestore ? firebase.firestore() : null; }
  function _uid() {
    try {
      const auth = window.firebase && firebase.auth ? firebase.auth() : null;
      return auth && auth.currentUser ? auth.currentUser.uid : null;
    } catch(e) { return null; }
  }

  function _userCol() {
    const db  = _db();
    const uid = _uid();
    if (!db || !uid) return null;
    return db.collection('users').doc(uid).collection(COL);
  }

  // ── GUARDAR bloque base ───────────────────────────────────────────
  /**
   * Guarda el estado actual del Trazador como bloque base del usuario.
   * @param {object} opts
   *   name        - nombre del bloque
   *   categoria   - categoría ('espalda', 'frente', 'manga', etc.)
   *   descripcion - notas libres
   *   sistema     - nombre del sistema de patronaje ("Mío", "Aldrich", ...)
   *   points      - _points del DrafterUI
   *   lines       - _lines del DrafterUI
   *   ptCtr       - contador de puntos
   *   medidasBase - medidas activas al guardar
   * @returns {Promise<string>} id del bloque guardado
   */
  async function guardar(opts) {
    const col = _userCol();
    if (!col) throw new Error('Debes iniciar sesión para guardar bloques base.');

    const ahora = new Date().toISOString();
    const data = {
      name:        opts.name        || 'Bloque sin nombre',
      categoria:   opts.categoria   || 'otro',
      descripcion: opts.descripcion || '',
      sistema:     opts.sistema     || 'Propio',
      points:      JSON.parse(JSON.stringify(opts.points || {})),
      lines:       JSON.parse(JSON.stringify(opts.lines  || [])),
      ptCtr:       opts.ptCtr       || 0,
      medidasBase: JSON.parse(JSON.stringify(opts.medidasBase || {})),
      updatedAt:   ahora,
      version:     1,
    };

    if (opts.id) {
      // Actualizar existente
      const ref = col.doc(opts.id);
      const snap = await ref.get();
      data.version  = snap.exists ? (snap.data().version || 1) + 1 : 1;
      data.createdAt = snap.exists ? snap.data().createdAt : ahora;
      await ref.set(data, { merge: true });
      return opts.id;
    } else {
      // Nuevo bloque
      data.createdAt = ahora;
      const ref = await col.add(data);
      return ref.id;
    }
  }

  // ── CARGAR todos los bloques del usuario ─────────────────────────
  /**
   * @returns {Promise<Array>} lista de bloques [{id, name, categoria, ...}]
   */
  async function listar() {
    const col = _userCol();
    if (!col) return [];
    const snap = await col.orderBy('updatedAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // ── CARGAR un bloque por id ───────────────────────────────────────
  async function cargar(id) {
    const col = _userCol();
    if (!col) throw new Error('No autenticado');
    const snap = await col.doc(id).get();
    if (!snap.exists) throw new Error('Bloque no encontrado');
    return { id: snap.id, ...snap.data() };
  }

  // ── ELIMINAR ─────────────────────────────────────────────────────
  async function eliminar(id) {
    const col = _userCol();
    if (!col) throw new Error('No autenticado');
    await col.doc(id).delete();
  }

  // ── RECALCULAR puntos con fórmulas usando nuevas medidas ─────────
  /**
   * Toma un bloque guardado y recalcula los puntos con fx/fy usando
   * las nuevas medidas. Devuelve points actualizado (no muta el original).
   */
  function recalcularConMedidas(bloque, nuevasMedidas) {
    const m = { ...bloque.medidasBase, ...nuevasMedidas };
    const vars = _buildVars(m);

    const pointsCopy = JSON.parse(JSON.stringify(bloque.points));

    Object.values(pointsCopy).forEach(p => {
      if (p.fx) {
        const v = _evalFormula(p.fx, vars);
        if (v !== null) p.x = v;
      }
      if (p.fy) {
        const v = _evalFormula(p.fy, vars);
        if (v !== null) p.y = v;
      }
    });

    return pointsCopy;
  }

  // ── Evaluador de fórmulas (independiente del DrafterUI) ──────────
  function _buildVars(m) {
    const b  = (m.bust  || 88) * 10;
    const w  = (m.waist || 68) * 10;
    const h  = (m.hip   || 94) * 10;
    const sh = (m.shoulder || 38) * 10;
    const nk = (m.neck  || 36) * 10;
    return {
      BUSTO:b, CINTURA:w, CADERA:h, ESPALDA:sh, CUELLO:nk,
      TALLE_ESP:(m.backLength||40)*10, TALLE_DEL:(m.frontLength||42)*10,
      LARGO:(m.totalLength||65)*10, MANGA:(m.sleeveLength||60)*10,
      FALDA:(m.skirtLength||60)*10, CADERA_PROF:(m.hipDepth||20)*10,
      B4:b/4, B6:b/6, B8:b/8, B10:b/10, B12:b/12,
      W4:w/4, H4:h/4, E2:sh/2,
      // alias minúsculas
      pecho:b, cintura:w, cadera:h, hombros:sh, cuello:nk,
      talle:(m.backLength||40)*10, largo:(m.totalLength||65)*10,
      manga:(m.sleeveLength||60)*10, falda:(m.skirtLength||60)*10,
    };
  }

  function _evalFormula(expr, vars) {
    if (!expr) return null;
    let c = String(expr).trim();
    Object.entries(vars).forEach(([k, v]) => {
      c = c.replace(new RegExp('\\b' + k + '\\b', 'g'), v.toFixed(4));
    });
    if (!/^[\d\s+\-*/().]+$/.test(c)) return null;
    try { return Function('"use strict";return(' + c + ')')(); } catch(e) { return null; }
  }

  // ── DUPLICAR un bloque (para hacer variante) ──────────────────────
  async function duplicar(id, nuevoNombre) {
    const original = await cargar(id);
    const copia = { ...original };
    delete copia.id;
    copia.name      = nuevoNombre || original.name + ' (copia)';
    copia.createdAt = new Date().toISOString();
    copia.updatedAt = copia.createdAt;
    copia.version   = 1;
    const col = _userCol();
    const ref = await col.add(copia);
    return ref.id;
  }

  // ── EXPORTAR bloque como JSON descargable ─────────────────────────
  function exportarJSON(bloque) {
    const json   = JSON.stringify(bloque, null, 2);
    const blob   = new Blob([json], { type: 'application/json' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = (bloque.name || 'bloque').replace(/\s+/g,'_') + '.patronai.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── IMPORTAR desde JSON ───────────────────────────────────────────
  async function importarJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.points || !data.lines) throw new Error('Archivo inválido');
          const id = await guardar(data);
          resolve(id);
        } catch(err) { reject(err); }
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  }

  // ── API pública ───────────────────────────────────────────────────
  return {
    guardar,
    listar,
    cargar,
    eliminar,
    duplicar,
    exportarJSON,
    importarJSON,
    recalcularConMedidas,
  };

})();
