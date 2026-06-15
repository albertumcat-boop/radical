/**
 * patterns/chaleco.js
 * Chaleco sin mangas (vest / gilet).
 *
 * FÓRMULAS BASADAS EN:
 *  - Metric Pattern Cutting (Winifred Aldrich, 6th ed.) — bloque sin manga
 *  - Sistema Müller & Sohn — sisa abierta y escote en V
 *
 * Piezas generadas:
 *  1. Espalda   (½ pieza, doblar en tela — CB, escote cuadrado alto)
 *  2. Frente    (pieza completa — escote en V y abertura central)
 *  3. Bolsillo de parche
 *
 * Unidades internas: mm. Inputs: cm → ×10.
 */

'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.Chaleco = (function() {
  const U = PAT.SVGUtils;
  const P = U.P;
  const C = PAT.COLORS;
  const NS = U.NS;
  const n = U.n;

  /**
   * @param {Object} m    - medidas en cm (ver PAT.DEFAULT_MEASURES)
   * @param {number} seam - margen de costura en mm
   * @returns {Object[]}  array de piezas { group, bounds, name }
   */
  function generate(m, seam) {
    const s    = seam;
    // Chaleco más entallado: ease reducido al 70%
    const ease = m.ease * 10 * 0.7;   // cm → mm, 70% de facilidad estándar
    const pieces = [];

    // ── Conversión de medidas a mm ──────────────────────────────────────────
    const B  = m.bust        * 10;   // busto
    const W  = m.waist       * 10;   // cintura
    const H  = m.hip         * 10;   // cadera
    const Sh = m.shoulder    * 10;   // ancho total hombros
    const BL = m.backLength  * 10;   // largo espalda (nuca → cintura)
    const FL = m.frontLength * 10;   // largo frente (hombro → cintura)
    const TL = m.totalLength * 10;   // largo total del chaleco
    const HD = m.hipDepth    * 10;   // cintura → cadera

    // ── Bloques de ancho (con facilidad reducida) ────────────────────────────
    const bW = (B + ease) / 4;   // ¼ bloque busto
    const wW = (W + ease) / 4;   // ¼ cintura
    const hW = (H + ease) / 4;   // ¼ cadera

    // ── Cuello ──────────────────────────────────────────────────────────────
    const neckW   = B / 12 + 5;   // ancho cuello desde CB/CF
    const neckD_b = 20;           // escote espalda: cuadrado alto (2cm fija)

    // ── Hombro ──────────────────────────────────────────────────────────────
    const shLen   = Sh / 2 - neckW;   // largo del hombro por pieza
    const shSlope = 15;                // caída del hombro (1.5cm)

    // ── Sisa chaleco: más abierta y profunda que blazer (sin manga) ─────────
    const adepth = B * 0.18 + 70;     // mm — fórmula chaleco sin manga

    // ── Escote en V frente ──────────────────────────────────────────────────
    // El vértice del V desciende hasta el 40% del largo frente
    const vNeckDepth = FL * 0.4;      // profundidad del escote V
    const vNeckWidth = neckW + 10;    // ancho del V en hombros (ligeramente más abierto)

    // ════════════════════════════════════════════════════════════════════════
    // PIEZA 1: ESPALDA  (½ pieza — doblar en CB, escote cuadrado alto)
    // ════════════════════════════════════════════════════════════════════════
    {
      // Escote cuadrado (CB horizontal): sale horizontal del CB hacia el hombro
      const nkC = [s, s + neckD_b];          // CB a nivel del escote
      const nkS = [s + neckW, s + neckD_b];  // esquina escote/hombro (cuadrado)
      const shT = [s + neckW + shLen, s + shSlope + neckD_b];  // punta hombro

      // Sisa: desde hombro hasta nivel sisa
      const ahB = [s + bW, s + adepth];

      // Punto medio sisa
      const ahMX = shT[0] + (ahB[0] - shT[0]) * 0.68;
      const ahMY = shT[1] + (ahB[1] - shT[1]) * 0.42;
      const ahM  = [ahMX, ahMY];

      // Control points sisa (más abierta: curva exterior más pronunciada)
      const cp1_1 = [shT[0] + 8,    shT[1] + (ahM[1] - shT[1]) * 0.35];
      const cp1_2 = [ahM[0] + 12,   ahM[1] - 18];
      const cp2_1 = [ahM[0] + 10,   ahM[1] + 18];
      const cp2_2 = [ahB[0] + 6,    ahB[1] - 18];

      const sideW = Math.max(bW, hW);

      let d = P.M(...nkC);
      // Escote cuadrado: línea horizontal del CB al hombro
      d += ` ${P.L(...nkS)}`;
      // Hombro: recto (desciende con shSlope desde nkS)
      d += ` ${P.L(...shT)}`;
      // Sisa abierta: dos beziers cúbicos
      d += ` ${P.C(...cp1_1, ...cp1_2, ...ahM)}`;
      d += ` ${P.C(...cp2_1, ...cp2_2, ...ahB)}`;
      // Lateral recto: sisa → cintura → cadera → hem
      d += ` ${P.L(s + wW, s + BL)}`;
      d += ` ${P.L(s + hW, s + BL + HD)}`;
      d += ` ${P.L(s + sideW, s + TL)}`;
      d += ` ${P.L(s, s + TL)}`;
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'chaleco-piece-back');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));

      // Línea de doblez CB
      g.appendChild(U.foldLine(s, s + neckD_b, s, s + TL, 'DOBLAR CB'));

      // Línea de hilo vertical centrada
      g.appendChild(U.grainLine(s + bW * 0.5, s + adepth + 20, TL - adepth - 40, true));

      // Muescas
      g.appendChild(U.notch(ahM[0], ahM[1], 90, 3));        // sisa media
      g.appendChild(U.notch(s + wW, s + BL, 0, 3));         // cintura lateral
      g.appendChild(U.notch(nkC[0], nkC[1], 270, 2));       // cuello CB
      g.appendChild(U.notch(nkS[0], nkS[1], 315, 2));       // esquina cuello-hombro

      g.appendChild(U.pieceLabel(s + 8, s + adepth + 50, 'ESPALDA — CHALECO', [
        '1 pieza (doble tela — doblar en CB)',
        `Escote: cuadrado alto ${neckD_b / 10}cm`,
        `Busto: ${m.bust}cm  Cintura: ${m.waist}cm`,
        `Largo: ${m.totalLength}cm  Margen: ${seam}mm`,
        '(NO margen en línea de doblez CB)',
      ]));

      const totalW = s + sideW + s;
      const totalH = s + TL + s;
      pieces.push({ group: g, bounds: { x: 0, y: 0, w: totalW, h: totalH }, name: 'Espalda' });
    }

    // ════════════════════════════════════════════════════════════════════════
    // PIEZA 2: FRENTE  (pieza completa — escote en V + abertura central)
    // ════════════════════════════════════════════════════════════════════════
    //
    // La pieza completa incluye la abertura (no se dobla).
    // El escote en V: los dos bordes del cuello convergen en un vértice
    // ubicado en CF a profundidad vNeckDepth.
    {
      // En el frente completo el CF está al centro de la pieza.
      // Ancho pieza = 2 × bW  (pieza completa = izquierda + derecha).
      // Sin embargo dibujamos solo un lado y reflejamos → dibujamos ½ con doblez
      // o dibujamos la pieza completa.
      //
      // Opción elegida: PIEZA COMPLETA (ambos lados del V visible).
      // CF = x = s + bW  (columna central).
      const cfX = s + bW;

      // Puntos del hombro (lado derecho de la pieza)
      const nkS = [cfX + vNeckWidth, s];                      // hombro-cuello der
      const shT = [cfX + vNeckWidth + shLen, s + shSlope];    // punta hombro der
      const ahB = [cfX + bW, s + adepth];                     // fondo sisa derecha

      // Punto medio sisa derecha
      const ahMX = shT[0] + (ahB[0] - shT[0]) * 0.68;
      const ahMY = shT[1] + (ahB[1] - shT[1]) * 0.42;
      const ahM  = [ahMX, ahMY];

      // Control points sisa derecha
      const cp1_1 = [shT[0] + 8,  shT[1] + (ahM[1] - shT[1]) * 0.35];
      const cp1_2 = [ahM[0] + 12, ahM[1] - 18];
      const cp2_1 = [ahM[0] + 10, ahM[1] + 18];
      const cp2_2 = [ahB[0] + 6,  ahB[1] - 18];

      // Vértice del escote V (punto más bajo, en CF)
      const vTip = [cfX, s + vNeckDepth];

      const sideW = Math.max(bW, hW);

      // El hem total de la pieza completa va de (s, s+TL) hasta (s + 2*sideW, s+TL)
      // El costado derecho: desde ahB → cintura → cadera → hem

      // Puntos espejados izquierda (se reflejan respecto a cfX)
      const nkS_L = [cfX - vNeckWidth, s];
      const shT_L = [cfX - vNeckWidth - shLen, s + shSlope];
      const ahB_L = [cfX - bW, s + adepth];
      const ahM_L = [cfX - (ahM[0] - cfX), ahM[1]];
      // Control points espejados
      const cp1_1L = [cfX - (cp1_1[0] - cfX), cp1_1[1]];
      const cp1_2L = [cfX - (cp1_2[0] - cfX), cp1_2[1]];
      const cp2_1L = [cfX - (cp2_1[0] - cfX), cp2_1[1]];
      const cp2_2L = [cfX - (cp2_2[0] - cfX), cp2_2[1]];

      let d = P.M(s, s + TL);    // inicio: hem izquierdo
      // Subir por el costado izquierdo
      d += ` ${P.L(s + sideW - (sideW - hW), s + BL + HD)}`;  // cadera izq
      d += ` ${P.L(s + sideW - (sideW - wW), s + BL)}`;        // cintura izq
      d += ` ${P.L(...ahB_L)}`;                                  // fondo sisa izq
      // Sisa izquierda (beziers espejados)
      d += ` ${P.C(...cp2_1L, ...cp2_2L, ...ahM_L)}`;
      d += ` ${P.C(...cp1_1L, ...cp1_2L, ...shT_L)}`;
      // Hombro izquierdo: recto
      d += ` ${P.L(...nkS_L)}`;
      // Escote V izquierdo: línea recta de hombro-cuello al vértice del V
      d += ` ${P.L(...vTip)}`;
      // Escote V derecho: línea recta del vértice al hombro-cuello derecho
      d += ` ${P.L(...nkS)}`;
      // Hombro derecho: recto
      d += ` ${P.L(...shT)}`;
      // Sisa derecha
      d += ` ${P.C(...cp1_1, ...cp1_2, ...ahM)}`;
      d += ` ${P.C(...cp2_1, ...cp2_2, ...ahB)}`;
      // Costado derecho: sisa → cintura → cadera → hem
      d += ` ${P.L(cfX + wW, s + BL)}`;
      d += ` ${P.L(cfX + hW, s + BL + HD)}`;
      d += ` ${P.L(s + 2 * sideW, s + TL)}`;
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'chaleco-piece-front');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));

      // Línea de CF (referencia, no doblez — abertura central)
      g.appendChild(U.el('line', {
        x1: n(cfX), y1: n(s + vNeckDepth),
        x2: n(cfX), y2: n(s + TL),
        stroke: C.foldLine, 'stroke-width': '0.5', 'stroke-dasharray': '8,3',
      }));
      const cfLabel = U.el('text', {
        x: n(cfX + 3), y: n(s + vNeckDepth + 20),
        'font-size': '3', fill: C.foldLine, 'font-family': 'Arial',
      });
      cfLabel.textContent = 'CF — ABERTURA';
      g.appendChild(cfLabel);

      // Vértice del escote V (marcador)
      g.appendChild(U.el('circle', {
        cx: n(vTip[0]), cy: n(vTip[1]), r: '2.5',
        fill: 'none', stroke: C.dartLine, 'stroke-width': '0.5',
      }));
      const vLabel = U.el('text', {
        x: n(vTip[0] + 5), y: n(vTip[1] + 1),
        'font-size': '2.8', fill: C.dartLine, 'font-family': 'Arial',
      });
      vLabel.textContent = `ESCOTE V  prof. ${Math.round(vNeckDepth / 10)}cm`;
      g.appendChild(vLabel);

      // Líneas de hilo (una a cada lado del CF)
      g.appendChild(U.grainLine(cfX - bW * 0.5, s + adepth + 20, TL - adepth - 40, true));
      g.appendChild(U.grainLine(cfX + bW * 0.5, s + adepth + 20, TL - adepth - 40, true));

      // Muescas
      g.appendChild(U.notch(ahM[0], ahM[1], 90, 3));         // sisa media der
      g.appendChild(U.notch(ahM_L[0], ahM_L[1], 90, 3));     // sisa media izq
      g.appendChild(U.notch(cfX + wW, s + BL, 0, 3));        // cintura der
      g.appendChild(U.notch(cfX - wW, s + BL, 0, 3));        // cintura izq
      g.appendChild(U.notch(vTip[0], vTip[1], 270, 2));      // vértice V

      g.appendChild(U.pieceLabel(cfX + 8, s + adepth + 60, 'FRENTE — CHALECO', [
        '1 pieza completa (no doblar)',
        `Escote V — profundidad: ${Math.round(vNeckDepth / 10)}cm`,
        `Busto: ${m.bust}cm  Cintura: ${m.waist}cm`,
        `Largo: ${m.totalLength}cm  Margen: ${seam}mm`,
      ]));

      const totalW = s + 2 * sideW + s;
      const totalH = s + TL + s;
      pieces.push({ group: g, bounds: { x: 0, y: 0, w: totalW, h: totalH }, name: 'Frente' });
    }

    // ════════════════════════════════════════════════════════════════════════
    // PIEZA 3: BOLSILLO DE PARCHE
    // ════════════════════════════════════════════════════════════════════════
    {
      const pkW = 110;   // 11cm ancho
      const pkH = 120;   // 12cm alto
      const pkR = 10;    // radio esquinas redondeadas (mm)

      let d = P.M(s, s);
      d += ` ${P.L(s + pkW, s)}`;
      d += ` ${P.L(s + pkW, s + pkH - pkR)}`;
      d += ` ${P.Q(s + pkW, s + pkH, s + pkW - pkR, s + pkH)}`;
      d += ` ${P.L(s + pkR, s + pkH)}`;
      d += ` ${P.Q(s, s + pkH, s, s + pkH - pkR)}`;
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'chaleco-piece-pocket');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));

      // Línea de hilo vertical
      g.appendChild(U.grainLine(s + pkW / 2, s + 12, pkH - 25, true));

      // Muesca de centrado en borde superior
      g.appendChild(U.notch(s + pkW / 2, s, 270, 2));

      g.appendChild(U.pieceLabel(s + 8, s + pkH * 0.45, 'BOLSILLO PARCHE — CHALECO', [
        '2 piezas  (1 visible + 1 forro)',
        `${pkW / 10}cm × ${pkH / 10}cm  Margen: ${seam}mm`,
        'Esquinas inferiores redondeadas',
      ]));

      const totalW = s + pkW + s;
      const totalH = s + pkH + s;
      pieces.push({ group: g, bounds: { x: 0, y: 0, w: totalW, h: totalH }, name: 'Bolsillo Parche' });
    }

    return pieces;
  }

  return { generate };
})();
