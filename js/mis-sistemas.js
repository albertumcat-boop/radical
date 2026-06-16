'use strict';
/**
 * mis-sistemas.js
 * Gestión de sistemas de patronaje propios por usuario.
 * Firestore path: users/{uid}/misSistemas/{id}
 *
 * Formato de un sistema guardado:
 * {
 *   nombre: string,
 *   descripcion: string,
 *   version: string,
 *   autor: string,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   piezas: [
 *     {
 *       id: string,          // slug: 'blusa-trasera'
 *       nombre: string,
 *       categoria: string,   // espalda|frente|manga|falda|pantalon|cuerpo|otro
 *       tipo: string,        // dama|caballero|ambos
 *       puntos: [
 *         { nombre:'A', fx:'0', fy:'0' },
 *         { nombre:'B', fx:'busto/4+2', fy:'0' }
 *       ],
 *       lineas: [
 *         { de:'A', a:'B', tipo:'line' }
 *       ],
 *       notas: string        // fórmulas en texto libre / descripción
 *     }
 *   ]
 * }
 */

window.PAT = window.PAT || {};
PAT.MisSistemas = (function () {

  // ── Helpers Firebase ──────────────────────────────────────────
  function _db()  { return window.firebase?.firestore?.(); }
  function _auth(){ return window.firebase?.auth?.(); }

  function _col() {
    const uid = _auth()?.currentUser?.uid;
    if (!uid) throw new Error('No hay usuario autenticado');
    return _db().collection('users').doc(uid).collection('misSistemas');
  }

  // ── CRUD ──────────────────────────────────────────────────────

  /**
   * Guarda (crea o actualiza) un sistema en Firestore.
   * Si opts.id existe → actualiza; si no → crea nuevo.
   * @returns {Promise<string>} id del sistema
   */
  async function guardar(opts = {}) {
    const col = _col();
    const ahora = firebase.firestore.FieldValue.serverTimestamp();

    const datos = {
      nombre:      opts.nombre      || 'Mi Sistema',
      descripcion: opts.descripcion || '',
      version:     opts.version     || '1.0',
      autor:       opts.autor       || (_auth().currentUser?.displayName || ''),
      piezas:      opts.piezas      || [],
      updatedAt:   ahora,
    };

    if (opts.id) {
      await col.doc(opts.id).set(datos, { merge: true });
      return opts.id;
    } else {
      datos.createdAt = ahora;
      const ref = await col.add(datos);
      return ref.id;
    }
  }

  /**
   * Lista todos los sistemas del usuario.
   * @returns {Promise<Array>}
   */
  async function listar() {
    const snap = await _col().orderBy('updatedAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  /**
   * Carga un sistema por id.
   */
  async function cargar(id) {
    const doc = await _col().doc(id).get();
    if (!doc.exists) throw new Error('Sistema no encontrado: ' + id);
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Elimina un sistema y lo desregistra de PAT.Sistemas.
   */
  async function eliminar(id) {
    await _col().doc(id).delete();
    // desregistrar si estaba activo
    const key = 'user_' + id;
    if (PAT.Sistemas && PAT.Sistemas[key]) delete PAT.Sistemas[key];
  }

  // ── Importar / Exportar JSON ──────────────────────────────────

  /**
   * Importa un sistema desde un objeto JSON (ya parseado).
   * Valida estructura mínima y guarda en Firestore.
   */
  async function importarJSON(obj) {
    if (!obj.nombre) throw new Error('El JSON debe tener un campo "nombre"');
    if (!Array.isArray(obj.piezas)) throw new Error('El JSON debe tener un array "piezas"');
    const id = await guardar(obj);
    registrarEnMemoria({ id, ...obj });
    return id;
  }

  /**
   * Exporta un sistema como JSON descargable.
   */
  function exportarJSON(sistema) {
    const { id: _id, createdAt: _c, updatedAt: _u, ...clean } = sistema;
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (sistema.nombre || 'sistema').replace(/\s+/g, '-').toLowerCase() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Registrar en PAT.Sistemas ─────────────────────────────────

  /**
   * Registra un sistema guardado en PAT.Sistemas para que aparezca
   * automáticamente en el modal 🧵 Sistemas del Trazador.
   */
  function registrarEnMemoria(sistema) {
    window.PAT = window.PAT || {};
    window.PAT.Sistemas = window.PAT.Sistemas || {};

    const key = 'user_' + sistema.id;

    // Construir listas de piezas
    const piezasDama      = [];
    const piezasCaballero = [];
    (sistema.piezas || []).forEach(p => {
      const entry = { id: p.id, label: p.nombre, tipo: p.tipo || 'dama' };
      if (p.tipo === 'caballero') piezasCaballero.push(entry);
      else                        piezasDama.push(entry);
    });

    PAT.Sistemas[key] = {
      nombre:  sistema.nombre,
      version: sistema.version || '1.0',
      tallasDisponibles: { dama: [], caballero: [] },
      piezasDama,
      piezasCaballero,

      getMedidasDama:      () => ({}),
      getMedidasCaballero: () => ({}),

      generarBloque(piezaId, medidas = {}) {
        const pieza = (sistema.piezas || []).find(p => p.id === piezaId);
        if (!pieza) throw new Error('Pieza no encontrada: ' + piezaId);

        // Evaluar fórmulas con las medidas actuales
        const vars = _buildVarsDesde(medidas);
        const points = {};
        const byNombre = {};

        (pieza.puntos || []).forEach((pt, i) => {
          const id = 'us' + i;
          const x  = _evalExpr(pt.fx || '0', vars);
          const y  = _evalExpr(pt.fy || '0', vars);
          points[id] = { x: x ?? 0, y: y ?? 0, name: pt.nombre, fx: pt.fx || '', fy: pt.fy || '' };
          byNombre[pt.nombre] = id;
        });

        const lines = (pieza.lineas || []).map(l => ({
          from:  byNombre[l.de],
          to:    byNombre[l.a],
          type:  l.tipo || 'line',
          ctrl:  20,
          cpx:   null,
          cpy:   null,
        })).filter(l => l.from && l.to);

        return {
          name:        `${pieza.nombre} — ${sistema.nombre}`,
          categoria:   pieza.categoria || 'otro',
          sistema:     sistema.nombre,
          descripcion: pieza.notas || '',
          points,
          lines,
          ptCtr:       Object.keys(points).length,
          medidasBase: medidas,
        };
      },
    };

    return PAT.Sistemas[key];
  }

  // ── Cargar todos los sistemas del usuario al iniciar ──────────

  async function cargarTodos() {
    try {
      const lista = await listar();
      lista.forEach(s => registrarEnMemoria(s));
      console.log(`[MisSistemas] ${lista.length} sistema(s) cargado(s)`);
    } catch (e) {
      // Sin auth o sin datos — silencioso
    }
  }

  // ── Helpers internos ──────────────────────────────────────────

  function _buildVarsDesde(m) {
    const T   = (m.bust        || 96) * 10;
    const NK  = (m.neck        || 37) * 10;
    const ESP = (m.shoulder    || 42) * 10;
    const LC  = (m.totalLength || m.backLength || 65) * 10;
    const CIN = (m.waist       || 74) * 10;
    const CAD = (m.hip         || 96) * 10;
    const ACA = (m.hipDepth    || 18) * 10;
    const s   = 10;
    return {
      // NH-style (mm) — nombres cortos recomendados
      T, NK, ESP, LC, CIN, CAD, ACA, s,
      // Aliases en español (compatibilidad hacia atrás)
      BUSTO:T, CINTURA:CIN, CADERA:CAD, HOMBROS:ESP, CUELLO:NK,
      busto:T, cintura:CIN, cadera:CAD, hombros:ESP, cuello:NK, pecho:T,
      // Derivados comunes
      B4:T/4, B6:T/6, B8:T/8, B10:T/10,
      W4:CIN/4, H4:CAD/4, E2:ESP/2,
      talle: LC, largo: LC,
      manga:  (m.sleeveLength || 0) * 10,
      falda:  (m.skirtLength  || 0) * 10,
    };
  }

  function _evalExpr(expr, vars) {
    if (!expr) return 0;
    try {
      let e = expr;
      Object.keys(vars).sort((a,b)=>b.length-a.length)
        .forEach(k => { e = e.replace(new RegExp('\\b'+k+'\\b','g'), vars[k]); });
      return Function('"use strict";return (' + e + ')')();
    } catch { return null; }
  }

  // ── API pública ───────────────────────────────────────────────
  return { guardar, listar, cargar, eliminar, importarJSON, exportarJSON,
           registrarEnMemoria, cargarTodos,
           // internals exposed for UI preview and entrevista
           _buildVarsDesde, _evalExpr };

})();
