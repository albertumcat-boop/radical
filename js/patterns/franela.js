/**
 * patterns/franela.js
 * Franela básica unisex / T-shirt básica.
 *
 * FÓRMULAS BASADAS EN:
 *  - Metric Pattern Cutting (Winifred Aldrich, 6th ed.)
 *  - Sistema Müller & Sohn (trazado industrial)
 *
 * Piezas generadas:
 *  1. Espalda (½ pieza, doblar en tela)
 *  2. Frente  (½ pieza, doblar en tela)
 *  3. Sesgo de cuello (tira de 1×perímetro cuello)
 *
 * Unidades: mm internamente. Inputs: cm → *10 para convertir.
 */

'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.Franela = (function() {
  const U = PAT.SVGUtils;
  const P = U.P;
  const C = PAT.COLORS;
  const NS = U.NS;

  /**
   * @param {Object} m - medidas en cm
   * @param {number} seam - margen de costura en mm
   * @returns {Object[]} array de piezas SVG {group, bounds, name}
   */
  function generate(m, seam) {
    const s = seam;  // mm
    const ease = m.ease * 10;  // cm → mm

    // ── Conversión de medidas a mm ──────────────────────────────────────
    const B  = m.bust  * 10;          // busto mm
    const W  = m.waist * 10;          // cintura mm
    const H  = m.hip   * 10;          // cadera mm
    const Sh = m.shoulder * 10;       // hombros mm (total)
    const BL = m.backLength  * 10;    // largo espalda mm
    const FL = m.frontLength * 10;    // largo frente mm
    const TL = m.totalLength * 10;    // largo total mm
    const HD = m.hipDepth * 10;       // profundidad cadera mm

    // ── Medidas de bloque (con facilidad) ──────────────────────────────
    const bW = (B + ease) / 4;    // ancho de bloque (¼ busto + facilidad)
    const wW = (W + ease) / 4;    // ancho cintura
    const hW = (H + ease) / 4;    // ancho cadera

    // ── Parámetros de cuello ──────────────────────────────────────────
    const neckW_back  = B / 12 + 5;           // ancho cuello espalda (mm) desde CB
    const neckD_back  = 25;                    // profundidad cuello espalda 2.5cm
    const neckW_front = B / 12 + 5;           // igual que espalda para redondo
    const neckD_front = BL * 0.15 + 20;       // más profundo al frente (~10-15% BL)

    // ── Profundidad sisa ──────────────────────────────────────────────
    // Fórmula Aldrich: sisa desde línea de hombros
    const armholeDepth = B * 0.14 + 50;      // mm

    // ── Hombro ────────────────────────────────────────────────────────
    const shLength = Sh / 2 - neckW_back;    // largo del hombro por pieza
    const shSlope  = 15;                      // caída del hombro: 1.5cm

    // ═══════════════════════════════════════════════════════════════════
    // PIEZA 1: ESPALDA (½ pieza — doblar en tela al lado izquierdo)
    // ═══════════════════════════════════════════════════════════════════
    const pieces = [];

    {
      // Puntos clave (sin margen de costura — se agrega desplazando)
      // Origen: CB (centro espalda) arriba = (0,0)
      // Y crece hacia abajo, X crece hacia el lado derecho (sisa)

      // Cuello
      const nkCenter  = [s, s + neckD_back];      // punto CB nivel cuello
      const nkShoulder= [s + neckW_back, s];       // punto cuello/hombro

      // Hombro
      const shTip = [
        s + neckW_back + shLength,
        s + shSlope
      ]; // punta del hombro

      // Sisa (curva): desde hombro hasta lado a nivel sisa
      // El punto más bajo de la sisa está a bW de CB
      const ahBottom = [s + bW, s + armholeDepth];

      // Lateral (con moldeado en cintura)
      const waistSide = [s + wW, s + BL];          // cintura lateral
      const hipSide   = [s + hW, s + BL + HD];     // cadera lateral

      // Hem
      const hemSide   = [s + (hW > bW ? hW : bW), s + TL];
      const hemCenter = [s, s + TL];

      // ── Control points para sisa ─────────────────────────────────
      // Curva en dos segmentos para sisa natural
      // Segmento 1: hombro → punto medio sisa (curva exterior)
      const ahMidX = shTip[0] + (ahBottom[0] - shTip[0]) * 0.7;
      const ahMidY = shTip[1] + (ahBottom[1] - shTip[1]) * 0.45;
      const ahMid  = [ahMidX, ahMidY];

      // Cubic bezier: hombro → mid sisa
      const cp1_1 = [shTip[0] + 5, shTip[1] + (ahMid[1] - shTip[1]) * 0.4];
      const cp1_2 = [ahMid[0] + 10, ahMid[1] - 15];
      // Cubic bezier: mid sisa → bottom sisa
      const cp2_1 = [ahMid[0] + 8, ahMid[1] + 15];
      const cp2_2 = [ahBottom[0] + 5, ahBottom[1] - 20];

      // ── Control points para lado con molde ───────────────────────
      const cpWaist1 = [ahBottom[0], ahBottom[1] + (BL - armholeDepth) * 0.5];
      const cpWaist2 = [wW + s + 5, s + BL - 20];
      const cpHip1   = [wW + s - 5, s + BL + 20];
      const cpHip2   = [hW + s - 8, s + BL + HD - 20];

      // ── Construir path ────────────────────────────────────────────
      let d = '';
      d += P.M(...nkCenter);
      // Curva de cuello (espalda): cuadrática suave
      d += ` ${P.Q(s + neckW_back * 0.1, s, ...nkShoulder)}`;
      // Hombro: línea recta
      d += ` ${P.L(...shTip)}`;
      // Sisa: dos beziers cúbicos
      d += ` ${P.C(...cp1_1, ...cp1_2, ...ahMid)}`;
      d += ` ${P.C(...cp2_1, ...cp2_2, ...ahBottom)}`;
      // Lateral con molde en cintura y cadera
      d += ` ${P.C(...cpWaist1, ...cpWaist2, ...waistSide)}`;
      d += ` ${P.C(...cpHip1, ...cpHip2, ...hipSide)}`;
      // Hasta dobladillo
      d += ` ${P.L(...hemSide)}`;
      // Dobladillo recto
      d += ` ${P.L(...hemCenter)}`;
      // Cierre por CB (línea de doblez — vertical)
      d += ' Z';

      // ── Crear grupo SVG ───────────────────────────────────────────
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'piece-back');

      // Área de relleno + línea de corte
      const cutPath = U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      });
      g.appendChild(cutPath);

      // Línea de doblez CB (eje izquierdo)
      g.appendChild(U.foldLine(s, s + neckD_back, s, s + TL, 'DOBLAR'));

      // Línea de hilo (vertical por el centro de la pieza)
      const grainX = s + bW / 2;
      const grainY1 = s + armholeDepth + 20;
      const grainY2 = s + TL - 20;
      g.appendChild(U.grainLine(grainX, grainY1, grainY2 - grainY1, true));

      // Muescas
      // En sisa a nivel medio
      g.appendChild(U.notch(ahMid[0], ahMid[1], 90, 3));
      // En cintura lateral
      g.appendChild(U.notch(waistSide[0], waistSide[1], 0, 3));
      // En cuello CB
      g.appendChild(U.notch(nkCenter[0], nkCenter[1], 270, 2));

      // Etiqueta
      const labelX = s + bW * 0.3;
      const labelY = s + armholeDepth + (TL - armholeDepth) * 0.3;
      g.appendChild(U.pieceLabel(labelX, labelY, 'ESPALDA', [
        'Franela Básica', `1 pieza (doble tela)`,
        `Busto: ${m.bust}cm · Largo: ${m.totalLength}cm`,
        `Margen costura: ${seam}mm en todo el contorno`,
        `(NO en línea de doblez CB)`,
      ]));

      // Bounds
      const totalW = s + Math.max(bW, hW) + s;
      const totalH = s + TL + s;

      pieces.push({
        group: g,
        bounds: { x: 0, y: 0, w: totalW, h: totalH },
        name: 'Espalda',
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PIEZA 2: FRENTE (½ pieza — doblar en tela al lado izquierdo)
    // ═══════════════════════════════════════════════════════════════════
    {
      const bWf = (B + ease) / 4;  // igual que espalda para franela
      const wWf = (W + ease) / 4;
      const hWf = (H + ease) / 4;

      // Cuello frente: más profundo y ancho igual al de la espalda
      const nkCenterF   = [s, s + neckD_front];
      const nkShoulderF = [s + neckW_front, s];
      const shTipF      = [s + neckW_front + shLength, s + shSlope];
      const ahBottomF   = [s + bWf, s + armholeDepth];

      // Sisa idéntica a espalda
      const ahMidXF = shTipF[0] + (ahBottomF[0] - shTipF[0]) * 0.7;
      const ahMidYF = shTipF[1] + (ahBottomF[1] - shTipF[1]) * 0.45;
      const ahMidF  = [ahMidXF, ahMidYF];

      const cp1_1F = [shTipF[0] + 5, shTipF[1] + (ahMidF[1] - shTipF[1]) * 0.4];
      const cp1_2F = [ahMidF[0] + 10, ahMidF[1] - 15];
      const cp2_1F = [ahMidF[0] + 8, ahMidF[1] + 15];
      const cp2_2F = [ahBottomF[0] + 5, ahBottomF[1] - 20];

      const waistSideF = [s + wWf, s + FL];
      const hipSideF   = [s + hWf, s + FL + HD];
      const hemSideF   = [s + Math.max(bWf, hWf), s + TL];
      const hemCenterF = [s, s + TL];

      const cpWaist1F = [ahBottomF[0], ahBottomF[1] + (FL - armholeDepth) * 0.5];
      const cpWaist2F = [wWf + s + 5, s + FL - 20];
      const cpHip1F   = [wWf + s - 5, s + FL + 20];
      const cpHip2F   = [hWf + s - 8, s + FL + HD - 20];

      let d = '';
      d += P.M(...nkCenterF);

      // Curva de cuello frente: más profunda y redondeada
      const nkCPX = s + neckW_front * 0.8;
      const nkCPY = s + neckD_front * 0.9;
      d += ` ${P.Q(s + neckW_front * 0.1, s + neckD_front * 0.95, ...nkShoulderF)}`;

      d += ` ${P.L(...shTipF)}`;
      d += ` ${P.C(...cp1_1F, ...cp1_2F, ...ahMidF)}`;
      d += ` ${P.C(...cp2_1F, ...cp2_2F, ...ahBottomF)}`;
      d += ` ${P.C(...cpWaist1F, ...cpWaist2F, ...waistSideF)}`;
      d += ` ${P.C(...cpHip1F, ...cpHip2F, ...hipSideF)}`;
      d += ` ${P.L(...hemSideF)}`;
      d += ` ${P.L(...hemCenterF)}`;
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'piece-front');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));

      g.appendChild(U.foldLine(s, s + neckD_front, s, s + TL, 'DOBLAR'));

      const grainXF = s + bWf / 2;
      g.appendChild(U.grainLine(grainXF, s + armholeDepth + 20, TL - armholeDepth - 40, true));

      g.appendChild(U.notch(ahMidF[0], ahMidF[1], 90, 3));
      g.appendChild(U.notch(waistSideF[0], waistSideF[1], 0, 3));

      // Muesca en cuello frente CB
      g.appendChild(U.notch(nkCenterF[0], nkCenterF[1], 270, 2));

      g.appendChild(U.pieceLabel(
        s + bWf * 0.3,
        s + armholeDepth + (TL - armholeDepth) * 0.3,
        'FRENTE', [
          'Franela Básica', '1 pieza (doble tela)',
          `Busto: ${m.bust}cm · Largo: ${m.totalLength}cm`,
          `Margen costura: ${seam}mm`,
          '(NO en línea de doblez CF)',
        ]
      ));

      const totalWF = s + Math.max(bWf, hWf) + s;
      const totalHF = s + TL + s;

      pieces.push({
        group: g,
        bounds: { x: 0, y: 0, w: totalWF, h: totalHF },
        name: 'Frente',
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PIEZA 3: SESGO DE CUELLO
    // ═══════════════════════════════════════════════════════════════════
    {
      // Longitud = perímetro de cuello estimado + 2cm solapamiento
      const neckPerim = (neckW_back + neckD_back + neckW_front + neckD_front) * 2 * 0.85;
      const biasW  = 35;  // 3.5cm ancho de sesgo (dobla a 1.5cm visible)
      const biasH  = neckPerim;

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'piece-bias');

      g.appendChild(U.el('rect', {
        x: s, y: s, width: n(biasW), height: n(biasH),
        fill: C.fill, stroke: C.cutLine, 'stroke-width': '0.8',
      }));

      // Línea de doblez central
      const midY = s + biasH / 2;
      g.appendChild(U.el('line', {
        x1: s, y1: n(midY), x2: n(s + biasW), y2: n(midY),
        stroke: C.foldLine, 'stroke-width': '0.5', 'stroke-dasharray': '6,3',
      }));

      // Hilo: diagonal 45°
      g.appendChild(U.el('line', {
        x1: n(s + 5), y1: n(s + 5),
        x2: n(s + biasW - 5), y2: n(s + 30),
        stroke: C.grainLine, 'stroke-width': '0.7',
        'stroke-dasharray': '4,2',
      }));

      const biasLabel = U.el('text', {
        x: n(s + biasW / 2), y: n(s + biasH / 2),
        'font-size': '3.5', fill: C.cutLine, 'text-anchor': 'middle',
        'font-family': 'Arial', transform: `rotate(-90, ${n(s+biasW/2)}, ${n(s+biasH/2)})`,
      });
      biasLabel.textContent = `SESGO CUELLO — ${Math.round(neckPerim / 10)}cm × 3.5cm — HILO 45°`;
      g.appendChild(biasLabel);

      pieces.push({
        group: g,
        bounds: { x: 0, y: 0, w: s + biasW + s, h: s + biasH + s },
        name: 'Sesgo Cuello',
      });
    }

    return pieces;
  }

  return { generate };
})();
