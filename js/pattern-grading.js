'use strict';
window.PAT = window.PAT || {};

/**
 * PAT.PatternGrading — graduación de patrones personalizados por regresión.
 * (Nombrado distinto a PAT.Grading porque ese namespace ya lo usa
 * js/grading.js para el selector de tallas — no mezclar.)
 *
 * Idea: en patronaje real, "graduar" una talla es mover cada punto del
 * patrón base una cantidad fija por cada medida que cambia (reglas de
 * graduación). En vez de pedirle al diseñador que escriba esas reglas a
 * mano punto por punto, las DEDUCIMOS a partir de varias muestras reales
 * que el propio diseñador traza con medidas distintas.
 *
 * Con 2+ muestras del mismo patrón (mismos puntos/IDs, medidas distintas),
 * calculamos para cada punto y cada medida la sensibilidad (cuánto se mueve
 * x/y por cada cm que cambia esa medida), usando regresión lineal simple
 * (covarianza/varianza) entre la medida y la coordenada, a través de todas
 * las muestras disponibles.
 *
 * Limitación conocida: si dos medidas varían siempre juntas en las
 * muestras (correlacionadas), no se pueden separar sus efectos por
 * separado — para mejores resultados, varía una medida a la vez entre
 * muestras cuando sea posible.
 */
PAT.PatternGrading = (function () {

  /**
   * @param {Array<{medidas:object, points:object}>} muestras
   * @returns {object|null} modelo entrenado, o null si no hay suficientes datos
   */
  function calcularModelo(muestras) {
    if (!muestras || muestras.length < 2) return null;

    // Medidas que realmente varían entre muestras (si no varía, no aporta info)
    const keysSet = new Set();
    muestras.forEach(s => Object.keys(s.medidas || {}).forEach(k => keysSet.add(k)));
    const keys = Array.from(keysSet).filter(k => {
      const vals = muestras.map(s => s.medidas?.[k]).filter(v => v != null && isFinite(v));
      if (vals.length < 2) return false;
      return Math.max(...vals) > Math.min(...vals);
    });
    if (keys.length === 0) return null;

    const n = muestras.length;
    const base = {};
    keys.forEach(k => {
      const vals = muestras.map(s => s.medidas?.[k]).filter(v => v != null);
      base[k] = vals.reduce((a, b) => a + b, 0) / vals.length;
    });

    // Universo de IDs de puntos = unión de todas las muestras (por si alguna
    // muestra tiene puntos adicionales); solo se gradúan los que aparecen
    // en TODAS las muestras usadas para ese punto.
    const idsSet = new Set();
    muestras.forEach(s => Object.keys(s.points || {}).forEach(id => idsSet.add(id)));

    const puntos = {};
    idsSet.forEach(id => {
      const muestrasConPunto = muestras.filter(s => s.points?.[id]);
      if (muestrasConPunto.length < 2) return;
      const xs = muestrasConPunto.map(s => s.points[id].x);
      const ys = muestrasConPunto.map(s => s.points[id].y);
      const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
      const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;

      const slopesX = {}, slopesY = {};
      keys.forEach(k => {
        let sumMM = 0, sumMX = 0, sumMY = 0;
        muestrasConPunto.forEach(s => {
          const mv = s.medidas?.[k];
          if (mv == null) return;
          const dm = mv - base[k];
          const p = s.points[id];
          sumMM += dm * dm;
          sumMX += dm * (p.x - meanX);
          sumMY += dm * (p.y - meanY);
        });
        slopesX[k] = sumMM > 1e-6 ? sumMX / sumMM : 0;
        slopesY[k] = sumMM > 1e-6 ? sumMY / sumMM : 0;
      });

      puntos[id] = {
        meanX, meanY, slopesX, slopesY,
        name: muestrasConPunto[0].points[id].name,
      };
    });

    return { keys, base, puntos, nMuestras: n };
  }

  /**
   * Genera las coordenadas de los puntos para unas medidas nuevas usando
   * el modelo entrenado. Si el modelo no tiene un punto, simplemente no
   * lo incluye (el caller debe combinar con la última muestra si quiere
   * cubrir huecos).
   */
  function generar(modelo, medidas) {
    if (!modelo) return null;
    const out = {};
    Object.entries(modelo.puntos).forEach(([id, pt]) => {
      let x = pt.meanX, y = pt.meanY;
      modelo.keys.forEach(k => {
        const mv = medidas?.[k];
        if (mv == null) return;
        const dm = mv - modelo.base[k];
        x += (pt.slopesX[k] || 0) * dm;
        y += (pt.slopesY[k] || 0) * dm;
      });
      out[id] = { x, y, name: pt.name };
    });
    return out;
  }

  return { calcularModelo, generar };

})();
