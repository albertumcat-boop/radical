/**
 * patterns/blazer.js
 * Blazer básico sin cuello (tipo chaqueta sastre simplificada).
 *
 * FÓRMULAS BASADAS EN:
 *  - Metric Pattern Cutting (Winifred Aldrich, 6th ed.) — bloque sastre
 *  - Sistema Müller & Sohn — hombro estructurado
 *
 * Piezas generadas:
 *  1. Espalda      (½ pieza, doblar en tela — CB)
 *  2. Frente       (pieza completa — lleva abertura central y pinza de busto)
 *  3. Manga Delantera  (½ tubo de manga)
 *  4. Manga Trasera    (½ tubo de manga)
 *  5. Bolsillo de parche (rectangular con esquinas redondeadas)
 *
 * Unidades internas: mm. Inputs: cm → ×10.
 */

'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.Blazer = (function() {
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
    const ease = m.ease * 10;   // cm → mm (facilidad)
    const pieces = [];

    // ── Conversión de medidas a mm ──────────────────────────────────────────
    const B  = m.bust        * 10;   // busto
    const W  = m.waist       * 10;   // cintura
    const H  = m.hip         * 10;   // cadera
    const Sh = m.shoulder    * 10;   // ancho total hombros
    const BL = m.backLength  * 10;   // largo espalda (nuca → cintura)
    const FL = m.frontLength * 10;   // largo frente (hombro → cintura)
    const TL = (m.totalLength ? m.totalLength * 10 : 700);  // largo blazer (default 70cm)
    const HD = m.hipDepth    * 10;   // profundidad cintura → cadera
    const SL = m.sleeveLength* 10;   // largo de manga
    const WR = m.wrist       * 10;   // circunferencia muñeca

    // ── Bloques de ancho (con facilidad) ────────────────────────────────────
    const bW = (B + ease) / 4;   // ¼ bloque busto
    const wW = (W + ease) / 4;   // ¼ cintura
    const hW = (H + ease) / 4;   // ¼ cadera

    // ── Cuello ──────────────────────────────────────────────────────────────
    const neckW    = B / 12 + 5;     // ancho cuello desde CB/CF
    const neckD_b  = 25;             // profundidad cuello espalda (fija, 2.5cm)
    const neckD_f  = FL * 0.12 + 20; // profundidad cuello frente

    // ── Hombro sastre (+10mm extra sobre franela básica) ────────────────────
    const shLen   = Sh / 2 - neckW + 10;  // +10mm espalda de sastre
    const shSlope = 18;                    // caída de hombro: 1.8cm (más estructurado)

    // ── Sisa sastre (más profunda que blusa) ────────────────────────────────
    const adepth = B * 0.15 + 60;         // mm — fórmula blazer

    // ── Pinza de busto (desde sisa del frente) ──────────────────────────────
    const bustPointX = s + bW * 0.55;
    const bustPointY = s + FL * 0.45;
    const dartWidth  = Math.max(12, (B - W) / 4 * 0.55);   // mm

    // ── Abertura delantera (solapa) ─────────────────────────────────────────
    const lapelW = 30;   // 3cm de abertura desde CF

    // ════════════════════════════════════════════════════════════════════════
    // PIEZA 1: ESPALDA  (½ pieza — doblar en tela por CB)
    // ════════════════════════════════════════════════════════════════════════
    {
      // Puntos clave — origen: esquina superior izquierda = CB nivel cuello
      const nkC = [s, s + neckD_b];
      const nkS = [s + neckW, s];
      const shT = [s + neckW + shLen, s + shSlope];
      const ahB = [s + bW, s + adepth];

      // Punto medio sisa (control curva)
      const ahMX = shT[0] + (ahB[0] - shT[0]) * 0.7;
      const ahMY = shT[1] + (ahB[1] - shT[1]) * 0.45;
      const ahM  = [ahMX, ahMY];

      // Control points sisa — curva natural
      const cp1_1 = [shT[0] + 5,    shT[1] + (ahM[1] - shT[1]) * 0.4];
      const cp1_2 = [ahM[0] + 10,   ahM[1] - 15];
      const cp2_1 = [ahM[0] + 8,    ahM[1] + 15];
      const cp2_2 = [ahB[0] + 5,    ahB[1] - 20];

      const sideW = Math.max(bW, hW);

      let d = P.M(...nkC);
      // Cuello espalda: cuadrática casi plana
      d += ` ${P.Q(s + neckW * 0.1, s, ...nkS)}`;
      // Hombro: recto
      d += ` ${P.L(...shT)}`;
      // Sisa: dos beziers cúbicos
      d += ` ${P.C(...cp1_1, ...cp1_2, ...ahM)}`;
      d += ` ${P.C(...cp2_1, ...cp2_2, ...ahB)}`;
      // Lateral recto: sisa → cintura → cadera → hem
      d += ` ${P.L(s + wW, s + BL)}`;
      d += ` ${P.L(s + hW, s + BL + HD)}`;
      d += ` ${P.L(s + sideW, s + TL)}`;
      d += ` ${P.L(s, s + TL)}`;
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'blazer-piece-back');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));

      // Línea de doblez CB
      g.appendChild(U.foldLine(s, s + neckD_b, s, s + TL, 'DOBLAR CB'));

      // Línea de hilo: vertical centrada en la pieza
      g.appendChild(U.grainLine(s + bW * 0.5, s + adepth + 20, TL - adepth - 40, true));

      // Muescas
      g.appendChild(U.notch(ahM[0], ahM[1], 90, 3));        // sisa media
      g.appendChild(U.notch(s + wW, s + BL, 0, 3));         // cintura lateral
      g.appendChild(U.notch(nkC[0], nkC[1], 270, 2));       // CB cuello

      // Etiqueta
      g.appendChild(U.pieceLabel(s + 8, s + adepth + 50, 'ESPALDA — BLAZER', [
        '1 pieza (doble tela — doblar en CB)',
        `Busto: ${m.bust}cm  Cintura: ${m.waist}cm`,
        `Largo: ${Math.round(TL / 10)}cm`,
        `Margen costura: ${seam}mm (no en doblez CB)`,
      ]));

      const totalW = s + sideW + s;
      const totalH = s + TL + s;
      pieces.push({ group: g, bounds: { x: 0, y: 0, w: totalW, h: totalH }, name: 'Espalda' });
    }

    // ════════════════════════════════════════════════════════════════════════
    // PIEZA 2: FRENTE  (pieza completa — abertura central + solapa + pinza busto)
    // ════════════════════════════════════════════════════════════════════════
    {
      // El frente ES pieza completa (no se dobla): ancho = bW + lapelW
      // CF está desplazado lapelW hacia la derecha del margen
      const cfX = s + lapelW;   // posición del centro frente real

      const nkC = [cfX, s + neckD_f];
      const nkS = [cfX + neckW, s];
      const shT = [cfX + neckW + shLen, s + shSlope];
      const ahB = [cfX + bW, s + adepth];

      const ahMX = shT[0] + (ahB[0] - shT[0]) * 0.7;
      const ahMY = shT[1] + (ahB[1] - shT[1]) * 0.45;
      const ahM  = [ahMX, ahMY];

      const cp1_1 = [shT[0] + 5,  shT[1] + (ahM[1] - shT[1]) * 0.4];
      const cp1_2 = [ahM[0] + 10, ahM[1] - 15];
      const cp2_1 = [ahM[0] + 8,  ahM[1] + 15];
      const cp2_2 = [ahB[0] + 5,  ahB[1] - 20];

      // Pinza de busto desde el costado (lado sisa)
      const dartY   = s + FL * 0.45;
      const dartTop = [cfX + bW, dartY - dartWidth / 2];
      const dartBot = [cfX + bW, dartY + dartWidth / 2];
      const bustPt  = { x: cfX + bW * 0.55, y: dartY };

      const sideW = Math.max(bW, hW);

      // Construir path del frente:
      // Partimos del borde inferior de la solapa (esquina CF abajo)
      // → subimos por la abertura → cuello → hombro → sisa → costado → hem → vuelta por CF
      let d = P.M(s, s + TL);                           // esquina inf-izq (hem CF exterior)
      d += ` ${P.L(s, s)}`;                             // subir por borde exterior solapa
      // Curva de remate de solapa (esquina superior redondeada)
      d += ` ${P.Q(s, s, cfX, s)}`;                    // pequeña curva cuadrada en solapa sup
      d += ` ${P.L(...nkS)}`;                           // hasta hombro-cuello
      d += ` ${P.L(...shT)}`;                           // hombro recto
      // Sisa
      d += ` ${P.C(...cp1_1, ...cp1_2, ...ahM)}`;
      d += ` ${P.C(...cp2_1, ...cp2_2, ...ahB)}`;
      // Lateral: sisa → top pinza
      d += ` ${P.L(...dartTop)}`;
      // Pinza: top → ápice → bot
      d += ` ${P.L(bustPt.x, bustPt.y)}`;
      d += ` ${P.L(...dartBot)}`;
      // Lateral: bot pinza → cintura → cadera → hem costado
      d += ` ${P.L(cfX + wW, s + FL)}`;
      d += ` ${P.L(cfX + hW, s + FL + HD)}`;
      d += ` ${P.L(cfX + sideW, s + TL)}`;
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'blazer-piece-front');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));

      // Línea de CF (referencia, no doblez)
      g.appendChild(U.el('line', {
        x1: n(cfX), y1: n(s),
        x2: n(cfX), y2: n(s + TL),
        stroke: C.foldLine, 'stroke-width': '0.5', 'stroke-dasharray': '8,3',
      }));
      // Etiqueta CF
      const cfLabel = U.el('text', {
        x: n(cfX + 2), y: n(s + 20),
        'font-size': '3', fill: C.foldLine, 'font-family': 'Arial',
      });
      cfLabel.textContent = 'CF (no cortar)';
      g.appendChild(cfLabel);

      // Líneas de pinza de busto
      g.appendChild(U.el('line', {
        x1: n(dartTop[0]), y1: n(dartTop[1]),
        x2: n(bustPt.x),  y2: n(bustPt.y),
        stroke: C.dartLine, 'stroke-width': '0.5', 'stroke-dasharray': '4,2',
      }));
      g.appendChild(U.el('line', {
        x1: n(bustPt.x),  y1: n(bustPt.y),
        x2: n(dartBot[0]), y2: n(dartBot[1]),
        stroke: C.dartLine, 'stroke-width': '0.5', 'stroke-dasharray': '4,2',
      }));
      // Círculo ápice
      g.appendChild(U.el('circle', {
        cx: n(bustPt.x), cy: n(bustPt.y), r: '2',
        fill: 'none', stroke: C.dartLine, 'stroke-width': '0.4',
      }));
      const pinzaLbl = U.el('text', {
        x: n(bustPt.x + 8), y: n(bustPt.y - 2),
        'font-size': '2.8', fill: C.dartLine, 'font-family': 'Arial',
      });
      pinzaLbl.textContent = `PINZA SISA ${Math.round(dartWidth / 10 * 10) / 10}cm`;
      g.appendChild(pinzaLbl);

      // Línea de hilo
      g.appendChild(U.grainLine(cfX + bW * 0.4, s + adepth + 20, TL - adepth - 40, true));

      // Muescas
      g.appendChild(U.notch(ahM[0], ahM[1], 90, 3));          // sisa media
      g.appendChild(U.notch(dartTop[0], dartTop[1], 0, 3));    // top pinza
      g.appendChild(U.notch(dartBot[0], dartBot[1], 0, 3));    // bot pinza
      g.appendChild(U.notch(cfX + wW, s + FL, 0, 3));         // cintura lateral
      g.appendChild(U.notch(nkC[0], nkC[1], 270, 2));         // cuello CF

      g.appendChild(U.pieceLabel(cfX + 8, s + adepth + 60, 'FRENTE — BLAZER', [
        '1 pieza completa (no doblar)',
        `Solapa: ${lapelW / 10}cm desde CF`,
        `Busto: ${m.bust}cm  Pinza: ${Math.round(dartWidth / 10 * 10) / 10}cm`,
        `Largo: ${Math.round(TL / 10)}cm  Margen: ${seam}mm`,
      ]));

      const totalW = s + lapelW + sideW + s;
      const totalH = s + TL + s;
      pieces.push({ group: g, bounds: { x: 0, y: 0, w: totalW, h: totalH }, name: 'Frente' });
    }

    // ════════════════════════════════════════════════════════════════════════
    // PIEZAS 3 & 4: MANGA SASTRE (2 piezas — delantera y trasera del tubo)
    // ════════════════════════════════════════════════════════════════════════
    //
    // Manga sastre de dos piezas:
    // La cabeza de manga es un óvalo suave compartido entre ambas.
    // Ancho total del tubo: circunferencia sisa / π ≈ adepth * 0.6 (aprox)
    // La costura de codo divide el tubo: delantera ~45%, trasera ~55%
    // La trasera tiene la costura de codo (punto con ángulo leve).
    {
      const sleeveCapH  = adepth * 0.48;              // altura cabeza de manga
      const sleeveTopW  = (bW + neckW + shLen) * 0.88; // ancho máximo cabeza
      const wristW      = (WR + ease * 0.4) / 2;      // ancho muñeca (½ tubo)

      // El tubo se divide verticalmente: delantera = izquierda, trasera = derecha
      // Línea de costura interna: x = s + sleeveTopW * 0.45 (delantera más estrecha)
      const seamX = s + sleeveTopW * 0.45;   // costura interna (codo-frente)

      // Puntos de cabeza de manga (arco compartido)
      const capLeft  = [s, s + sleeveCapH];
      const capRight = [s + sleeveTopW, s + sleeveCapH];
      const capTop   = [s + sleeveTopW / 2, s];

      // Control points cabeza (bezier cúbico)
      const cpL1 = [capLeft[0] + 15,  capLeft[1]  - sleeveCapH * 0.5];
      const cpL2 = [capTop[0]  - 12,  capTop[1]   + 6];
      const cpR1 = [capTop[0]  + 12,  capTop[1]   + 6];
      const cpR2 = [capRight[0]- 15,  capRight[1] - sleeveCapH * 0.5];

      // Muesca de unión con sisa
      const notchLX = s + sleeveTopW * 0.32;
      const notchLY = s + sleeveCapH * 0.38;
      const notchRX = s + sleeveTopW * 0.68;
      const notchRY = s + sleeveCapH * 0.38;

      // Costura de codo en manga trasera (ángulo leve a nivel codo ~60% del largo)
      const elbowY  = s + sleeveCapH + (SL - sleeveCapH) * 0.6;
      const elbowShift = 8;   // mm — curvatura en la costura de codo

      // ── MANGA DELANTERA ──────────────────────────────────────────────────
      {
        // Pieza izquierda del tubo: desde capLeft hasta la costura interna
        // Muñeca delantera centrada proporcionalmente
        const wristFrontLeft  = [s, s + SL];
        const wristFrontRight = [seamX, s + SL];

        // La parte delantera sube recta en el lado izquierdo (arista exterior)
        // y tiene la costura interna en seamX (línea de codo)

        let d = P.M(...capLeft);
        // Cabeza de manga: solo el arco izquierdo hasta seamX a nivel capH
        d += ` ${P.C(...cpL1, ...cpL2, ...capTop)}`;
        // Bajar por el lado derecho de la pieza delantera (costura interna)
        // → desde capTop hasta costura @ seamX nivel sisa
        d += ` ${P.L(seamX, s + sleeveCapH)}`;
        // Costura interna: recta hasta muñeca (delantera es recta en costura interna)
        d += ` ${P.L(...wristFrontRight)}`;
        // Dobladillo de muñeca
        d += ` ${P.L(...wristFrontLeft)}`;
        // Lado exterior: recto hasta capLeft
        d += ' Z';

        const g = document.createElementNS(NS, 'g');
        g.setAttribute('id', 'blazer-piece-sleeve-front');

        g.appendChild(U.el('path', {
          d, fill: C.fill,
          stroke: C.cutLine, 'stroke-width': '0.8',
          'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        }));

        // Línea de hilo vertical
        g.appendChild(U.grainLine(s + seamX / 3, s + sleeveCapH + 15, SL - sleeveCapH - 30, true));

        // Muesca izquierda de cabeza de manga
        g.appendChild(U.notch(notchLX, notchLY, 315, 3));
        // Muesca en costura interna nivel sisa
        g.appendChild(U.notch(seamX, s + sleeveCapH, 0, 3));

        // Etiqueta
        g.appendChild(U.pieceLabel(s + 6, s + sleeveCapH + 35, 'MANGA DELANTERA — BLAZER', [
          '2 piezas iguales',
          `Largo manga: ${m.sleeveLength}cm`,
          `Costura interna → unir con Manga Trasera`,
        ]));

        const totalW = seamX + s;
        const totalH = s + SL + s;
        pieces.push({ group: g, bounds: { x: 0, y: 0, w: totalW, h: totalH }, name: 'Manga Delantera' });
      }

      // ── MANGA TRASERA ────────────────────────────────────────────────────
      {
        // Pieza derecha del tubo: desde seamX hasta capRight
        // Muñeca trasera más ancha (lleva costura de codo)
        const wristBackLeft  = [seamX, s + SL];
        const wristBackRight = [s + sleeveTopW, s + SL];

        // Costura de codo: punto de inflexión @ elbowY en el lado derecho
        // El lado derecho (exterior manga) tiene un leve ángulo en el codo
        const elbowPt = [s + sleeveTopW + elbowShift, elbowY];  // ángulo hacia afuera

        let d = P.M(seamX, s + sleeveCapH);
        // Cabeza de manga: arco derecho desde seamX hasta capRight
        d += ` ${P.L(...capTop)}`;
        d += ` ${P.C(...cpR1, ...cpR2, ...capRight)}`;
        // Lado exterior con costura de codo (tres segmentos rectos)
        d += ` ${P.L(...elbowPt)}`;                             // hasta punto codo
        d += ` ${P.L(...wristBackRight)}`;                      // hasta muñeca exterior
        // Dobladillo muñeca
        d += ` ${P.L(...wristBackLeft)}`;
        // Costura interna (izquierda de la pieza trasera): recta
        d += ' Z';

        const g = document.createElementNS(NS, 'g');
        g.setAttribute('id', 'blazer-piece-sleeve-back');

        g.appendChild(U.el('path', {
          d, fill: C.fill,
          stroke: C.cutLine, 'stroke-width': '0.8',
          'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        }));

        // Línea de costura de codo (línea de referencia interna)
        g.appendChild(U.el('line', {
          x1: n(seamX), y1: n(elbowY),
          x2: n(s + sleeveTopW), y2: n(elbowY),
          stroke: C.seamLine, 'stroke-width': '0.4', 'stroke-dasharray': '5,2',
        }));
        const elbowLbl = U.el('text', {
          x: n(seamX + 5), y: n(elbowY - 3),
          'font-size': '2.5', fill: C.seamLine, 'font-family': 'Arial',
        });
        elbowLbl.textContent = 'COSTURA CODO';
        g.appendChild(elbowLbl);

        // Línea de hilo
        g.appendChild(U.grainLine(seamX + (sleeveTopW - seamX + s) * 0.4, s + sleeveCapH + 15, SL - sleeveCapH - 30, true));

        // Muescas
        g.appendChild(U.notch(notchRX, notchRY, 45, 3));       // cabeza manga derecha
        g.appendChild(U.notch(seamX, s + sleeveCapH, 0, 3));   // costura interna sisa

        g.appendChild(U.pieceLabel(seamX + 6, s + sleeveCapH + 35, 'MANGA TRASERA — BLAZER', [
          '2 piezas iguales',
          `Largo manga: ${m.sleeveLength}cm  Muñeca: ${m.wrist}cm`,
          `Unir costura interna con Manga Delantera`,
        ]));

        const totalW = s + sleeveTopW + elbowShift + s;
        const totalH = s + SL + s;
        pieces.push({ group: g, bounds: { x: 0, y: 0, w: totalW, h: totalH }, name: 'Manga Trasera' });
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // PIEZA 5: BOLSILLO DE PARCHE (rectangular, esquinas redondeadas)
    // ════════════════════════════════════════════════════════════════════════
    {
      const pkW = 120;    // 12cm ancho
      const pkH = 130;    // 13cm alto
      const pkR = 12;     // radio esquinas redondeadas (mm)

      // Path con esquinas redondeadas inferiores
      let d = P.M(s, s);
      d += ` ${P.L(s + pkW, s)}`;                                            // top recto
      d += ` ${P.L(s + pkW, s + pkH - pkR)}`;                               // lado der
      d += ` ${P.Q(s + pkW, s + pkH, s + pkW - pkR, s + pkH)}`;             // esquina inf-der
      d += ` ${P.L(s + pkR, s + pkH)}`;                                      // bottom
      d += ` ${P.Q(s, s + pkH, s, s + pkH - pkR)}`;                         // esquina inf-izq
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'blazer-piece-pocket');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));

      // Línea de hilo vertical centrada
      g.appendChild(U.grainLine(s + pkW / 2, s + 15, pkH - 30, true));

      // Muesca en centro superior (para centrar en la prenda)
      g.appendChild(U.notch(s + pkW / 2, s, 270, 2));

      g.appendChild(U.pieceLabel(s + 8, s + pkH * 0.45, 'BOLSILLO PARCHE — BLAZER', [
        '2 piezas  (1 bolsillo visible + 1 forro)',
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
