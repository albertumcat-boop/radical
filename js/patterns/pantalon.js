/**
 * patterns/pantalon.js
 * Pantalón básico recto / clásico.
 *
 * FÓRMULAS BASADAS EN:
 *  - Metric Pattern Cutting (Winifred Aldrich, 6th ed.)
 *  - Sistema Müller & Sohn
 *
 * Piezas generadas:
 *  1. Delantero (½ pieza — doblar en tela al CF)
 *  2. Trasero   (½ pieza — doblar en tela al CB)
 *  3. Pretina   (tira recta, ancho = cintura + 5cm, alto = 40mm doble)
 *  4. Bolsillo  (rectángulo redondeado, opcional)
 *
 * Unidades: mm internamente. Inputs: cm → ×10 para convertir.
 */

'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.Pantalon = (function() {
  const U = PAT.SVGUtils;
  const P = U.P;
  const C = PAT.COLORS;
  const NS = U.NS;
  const n = U.n;

  /**
   * @param {Object} m   - medidas en cm (PAT.DEFAULT_MEASURES + extras)
   * @param {number} seam - margen de costura en mm
   * @returns {Object[]}  array de piezas {group, bounds, name}
   */
  function generate(m, seam) {
    const s    = seam;
    const ease = (m.ease || 6) * 10;   // facilidad en mm

    // ── Conversión de medidas a mm ──────────────────────────────────────
    const W  = m.waist * 10;                         // cintura mm
    const H  = m.hip   * 10;                         // cadera mm
    const HD = (m.hipDepth || 20) * 10;              // profundidad cadera mm

    // Medidas de largo
    const inseam  = (m.inseam || 76) * 10;           // largo entrepierna mm
    const outseam = (m.totalLength || 100) * 10;     // largo total (tiro+pierna) mm

    // Medidas de sección transversal
    const thigh = (m.thigh || m.hip * 0.6) * 10;    // muslo mm
    const knee  = (m.knee  || m.hip * 0.5) * 10;    // rodilla mm
    const ankle = (m.ankle || 23) * 10;              // tobillo mm

    // ── Medidas de bloque (¼ del contorno + facilidad) ─────────────────
    // Aldrich: cintura y cadera por cuartos para piezas ½
    const wBlock = (W + ease * 0.5) / 4;  // ancho bloque cintura (¼)
    const hBlock = (H + ease)       / 4;  // ancho bloque cadera  (¼)

    // ── Tiro (crotch) — Fórmulas Aldrich ───────────────────────────────
    // Profundidad tiro = cadera/4 × 0.28 + 2cm
    const crotchDepth = H / 4 * 0.28 + 20;   // mm

    // Largo tiro (gancho) = medida entrepierna
    // El "rise" = outseam - inseam = largo desde cintura al tiro
    const rise = outseam - inseam;            // mm (cintura al tiro)

    // Extensión de tiro (fork):
    //   Delantero: (cadera/4) - 10mm
    //   Trasero:   (cadera/4) + 30mm
    const forkF = hBlock - 10;   // extensión tiro delantero mm
    const forkB = hBlock + 30;   // extensión tiro trasero mm

    // Ancho tobillo ½
    const ankleHalf = ankle / 2 + 15;   // +1.5cm de facilidad

    // Diferencia cintura-cadera para pinzas
    const diffF = hBlock - wBlock;      // para distribuir en pinzas delantero
    const dartWidthF = diffF * 0.5;     // 50% de diferencia en 1 pinza
    const dartLenF   = 90;              // largo pinza delantera 9cm

    const diffB = hBlock - wBlock + 20; // espalda más holgura
    const dartWidthB = diffB * 0.6;     // 60% en pinza trasera
    const dartLenB   = 130;             // largo pinza trasera 13cm

    const pieces = [];

    // ═══════════════════════════════════════════════════════════════════
    // PIEZA 1: DELANTERO (½ pieza — doblar en tela CF = izquierda)
    // ═══════════════════════════════════════════════════════════════════
    {
      // Origen (0,0) = esquina sup-izq incluyendo margen
      // CF vertical corre a x = s (línea de doblez)
      // Y crece hacia abajo

      // ── Puntos clave ─────────────────────────────────────────────
      // Cintura CF (arriba)
      const wCF    = [s, s];
      // Cintura lateral (recortada por la pinza, pero el borde geométrico es hBlock)
      const wSide  = [s + hBlock, s + 15];  // caída lateral cintura ~1.5cm

      // Cadera lateral
      const hipSide = [s + hBlock, s + HD];

      // Punto tiro: se extiende hacia la izquierda del CF
      // En el delantero, el tiro sale a la derecha del CF (fuera del doblez)
      // Nivel tiro (crotch level) = desde cintura hacia abajo por "rise"
      const crotchY = s + rise;
      const crotchPoint = [s + forkF, crotchY];   // punta del tiro delantero

      // Entrepierna (inseam): desde tiro hasta tobillo
      // El muslo queda inmediatamente bajo el tiro
      const thighPt = [s + forkF / 2 + thigh / 4, crotchY + 80]; // 8cm bajo tiro
      const kneePt  = [s + knee / 4, s + rise + (inseam * 0.45)]; // rodilla 45% inseam
      const anklePt = [s + ankleHalf, s + outseam];                // tobillo (bajo)

      // Dobladillo: horizontal
      const hemCF   = [s, s + outseam];            // bajo CF

      // ── Curva de tiro delantero ───────────────────────────────────
      // La curva sale del lateral en nivel cadera y baja curvando
      // hasta la punta del tiro
      // Punto de inicio curva = pie de cadera lateral
      const crotchStart = [s + hBlock, s + HD + 60]; // 6cm bajo cadera

      // Control points para curva de tiro (cóncava)
      const cpTiro1 = [s + hBlock + forkF * 0.3, crotchStart[1] + (crotchY - crotchStart[1]) * 0.4];
      const cpTiro2 = [s + forkF + 15, crotchY - 20];

      // ── Pinza de cintura ─────────────────────────────────────────
      // Centrada a ~45% del ancho de cadera
      const pDartX   = s + hBlock * 0.45;
      const pDartTopY = s + 10;    // 1cm bajo cintura (por curva de cintura)
      const pDartBotY = pDartTopY + dartLenF;
      const pDartW2  = dartWidthF / 2;

      // ── Construir path ────────────────────────────────────────────
      let d = '';

      // CF cintura → cintura lateral (curva suave de cintura)
      d += P.M(...wCF);
      const wCP = [s + hBlock * 0.5, s - 5];   // curva de cintura ligeramente cóncava
      d += ` ${P.Q(...wCP, ...wSide)}`;

      // Lateral RECTO: cintura → cadera → inicio curva tiro
      d += ` ${P.L(...hipSide)}`;
      d += ` ${P.L(...crotchStart)}`;

      // Curva de tiro (cóncava, característica del pantalón)
      d += ` ${P.C(...cpTiro1, ...cpTiro2, ...crotchPoint)}`;

      // Entrepierna: curva suave → rodilla → tobillo
      const cpIn1 = [crotchPoint[0] - 10, crotchPoint[1] + (kneePt[1] - crotchPoint[1]) * 0.3];
      const cpIn2 = [kneePt[0] + 5, kneePt[1] - 30];
      d += ` ${P.C(...cpIn1, ...cpIn2, ...kneePt)}`;

      // Rodilla → tobillo: LÍNEA RECTA (pantalón recto)
      d += ` ${P.L(...anklePt)}`;

      // Dobladillo → CF: LÍNEA RECTA
      d += ` ${P.L(...hemCF)}`;

      // CF: subir LÍNEA RECTA hasta arriba
      d += ' Z';

      // ── Pinza dibujada sobre la pieza ────────────────────────────
      // Se dibuja como líneas independientes (no altera el contorno)
      const dartG = U.el('g', {});
      const dartPath = `${P.M(pDartX - pDartW2, pDartTopY)} ${P.L(pDartX, pDartBotY)} ${P.L(pDartX + pDartW2, pDartTopY)}`;
      dartG.appendChild(U.el('path', {
        d: dartPath, fill: 'none',
        stroke: C.dartLine, 'stroke-width': '0.6',
        'stroke-dasharray': '5,2',
      }));

      // ── Crear grupo SVG ───────────────────────────────────────────
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'piece-front-pants');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));
      g.appendChild(dartG);

      // Línea de doblez CF
      g.appendChild(U.foldLine(s, s, s, s + outseam, 'DOBLAR CF'));

      // Línea de hilo (vertical, centrada en la pieza)
      const grainX = s + hBlock * 0.5;
      g.appendChild(U.grainLine(grainX, s + rise + 40, inseam - 80, true));

      // Muescas en puntos clave
      g.appendChild(U.notch(hipSide[0], hipSide[1], 0, 3));     // cadera lateral
      g.appendChild(U.notch(crotchPoint[0], crotchPoint[1], 180, 3)); // punta tiro
      g.appendChild(U.notch(kneePt[0], kneePt[1], 90, 3));       // rodilla
      g.appendChild(U.notch(wSide[0], wSide[1], 0, 2));           // cintura lateral

      // Etiqueta
      g.appendChild(U.pieceLabel(s + hBlock * 0.2, s + rise + inseam * 0.3, 'DELANTERO', [
        'Pantalón Básico', '1 pieza (doble tela)',
        `Cintura: ${m.waist}cm · Cadera: ${m.hip}cm`,
        `Largo total: ${m.totalLength || 100}cm`,
        `Margen costura: ${seam}mm (NO en doblez CF)`,
      ]));

      const totalW = s + hBlock + forkF + s;
      const totalH = s + outseam + s;
      pieces.push({ group: g, bounds: { x: 0, y: 0, w: totalW, h: totalH }, name: 'Delantero' });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PIEZA 2: TRASERO (½ pieza — doblar en tela CB = izquierda)
    // ═══════════════════════════════════════════════════════════════════
    {
      // El trasero es más ancho en el tiro y cintura
      // Ancho cadera trasera: hBlock + 5mm extra
      const hBlockB = hBlock + 5;

      // Cintura trasera: levantada ~1.5cm en CB (curva característica trasero)
      const wCB    = [s, s + 15];   // CB cintura 1.5cm abajo de la línea 0
      const wSideB = [s + hBlockB, s + 30];   // lateral cintura

      // Cadera lateral
      const hipSideB = [s + hBlockB, s + HD];

      // Tiro trasero
      const crotchY  = s + rise;
      const crotchPtB = [s + forkB, crotchY];  // tiro trasero más extendido

      // El tiro trasero tiene curva más pronunciada y levantada
      const crotchStartB = [s + hBlockB, s + HD + 40];
      const cpTiroB1 = [s + hBlockB + forkB * 0.4, crotchStartB[1] + (crotchY - crotchStartB[1]) * 0.3];
      const cpTiroB2 = [s + forkB + 20, crotchY - 30];

      // Entrepierna (igual estructura que delantero)
      const kneePtB  = [s + knee / 4 + 5, s + rise + (inseam * 0.45)];
      const anklePtB = [s + ankleHalf + 5, s + outseam];
      const hemCB    = [s, s + outseam];

      // ── Pinza trasera ─────────────────────────────────────────────
      const bDartX    = s + hBlockB * 0.4;
      const bDartTopY = s + 30 + 10;
      const bDartBotY = bDartTopY + dartLenB;
      const bDartW2   = dartWidthB / 2;

      // ── Construir path ────────────────────────────────────────────
      let d = '';
      d += P.M(...wCB);

      // Cintura CB → lateral: curva más pronunciada que el delantero
      const wCPB = [s + hBlockB * 0.5, s + 5];
      d += ` ${P.Q(...wCPB, ...wSideB)}`;

      // Lateral RECTO: cintura → cadera → curva tiro
      d += ` ${P.L(...hipSideB)}`;
      d += ` ${P.L(...crotchStartB)}`;

      // Curva de tiro trasero (más profunda)
      d += ` ${P.C(...cpTiroB1, ...cpTiroB2, ...crotchPtB)}`;

      // Entrepierna trasera
      const cpInB1 = [crotchPtB[0] - 10, crotchPtB[1] + (kneePtB[1] - crotchPtB[1]) * 0.3];
      const cpInB2 = [kneePtB[0] + 5, kneePtB[1] - 30];
      d += ` ${P.C(...cpInB1, ...cpInB2, ...kneePtB)}`;

      // Rodilla → tobillo → dobladillo → CB: LÍNEAS RECTAS
      d += ` ${P.L(...anklePtB)}`;
      d += ` ${P.L(...hemCB)}`;
      d += ' Z';

      // ── Pinza trasera dibujada sobre la pieza ─────────────────────
      const dartGB = U.el('g', {});
      const dartPathB = `${P.M(bDartX - bDartW2, bDartTopY)} ${P.L(bDartX, bDartBotY)} ${P.L(bDartX + bDartW2, bDartTopY)}`;
      dartGB.appendChild(U.el('path', {
        d: dartPathB, fill: 'none',
        stroke: C.dartLine, 'stroke-width': '0.6',
        'stroke-dasharray': '5,2',
      }));

      // ── Crear grupo SVG ───────────────────────────────────────────
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'piece-back-pants');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));
      g.appendChild(dartGB);

      // Línea de doblez CB
      g.appendChild(U.foldLine(s, s + 15, s, s + outseam, 'DOBLAR CB'));

      // Línea de hilo
      const grainXB = s + hBlockB * 0.5;
      g.appendChild(U.grainLine(grainXB, s + rise + 40, inseam - 80, true));

      // Muescas
      g.appendChild(U.notch(hipSideB[0], hipSideB[1], 0, 3));
      g.appendChild(U.notch(crotchPtB[0], crotchPtB[1], 180, 3));
      g.appendChild(U.notch(kneePtB[0], kneePtB[1], 90, 3));
      g.appendChild(U.notch(wSideB[0], wSideB[1], 0, 2));
      g.appendChild(U.notch(wCB[0], wCB[1], 270, 2));

      // Etiqueta
      g.appendChild(U.pieceLabel(s + hBlockB * 0.2, s + rise + inseam * 0.3, 'TRASERO', [
        'Pantalón Básico', '1 pieza (doble tela)',
        `Cintura: ${m.waist}cm · Cadera: ${m.hip}cm`,
        `Largo total: ${m.totalLength || 100}cm`,
        `Margen costura: ${seam}mm (NO en doblez CB)`,
      ]));

      const totalWB = s + hBlockB + forkB + s;
      const totalHB = s + outseam + s;
      pieces.push({ group: g, bounds: { x: 0, y: 0, w: totalWB, h: totalHB }, name: 'Trasero' });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PIEZA 3: PRETINA
    // ═══════════════════════════════════════════════════════════════════
    {
      // Ancho = cintura + 5cm (para el cierre/broche)
      const waistbandW = W + 50;   // mm
      const waistbandH = 40;       // mm (4cm, se dobla → 2cm visible)

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'piece-waistband');

      g.appendChild(U.el('rect', {
        x: n(s), y: n(s),
        width: n(waistbandW), height: n(waistbandH),
        fill: C.fill, stroke: C.cutLine, 'stroke-width': '0.8',
      }));

      // Línea de doblez central (horizontal)
      const midY = s + waistbandH / 2;
      g.appendChild(U.el('line', {
        x1: n(s), y1: n(midY), x2: n(s + waistbandW), y2: n(midY),
        stroke: C.foldLine, 'stroke-width': '0.5', 'stroke-dasharray': '6,3',
      }));

      // Línea de hilo (horizontal)
      g.appendChild(U.grainLine(s + 20, s + waistbandH / 2, waistbandW - 40, false));

      // Muescas CB (marcador centro), y CF
      g.appendChild(U.notch(s + waistbandW / 2, s, 270, 2));             // centro
      g.appendChild(U.notch(s + waistbandW / 2, s + waistbandH, 90, 2)); // centro bajo

      // Etiqueta
      const wb = U.el('text', {
        x: n(s + waistbandW / 2), y: n(s + waistbandH / 2 - 2),
        'font-size': '3.5', fill: C.cutLine, 'text-anchor': 'middle',
        'font-family': 'Arial, sans-serif',
      });
      wb.textContent = `PRETINA — ${Math.round(waistbandW / 10)}cm × 4cm — doblar por línea roja`;
      g.appendChild(wb);
      const wb2 = U.el('text', {
        x: n(s + waistbandW / 2), y: n(s + waistbandH / 2 + 5),
        'font-size': '2.8', fill: C.seamLine, 'text-anchor': 'middle',
        'font-family': 'Arial, sans-serif',
      });
      wb2.textContent = `Cintura: ${m.waist}cm + 5cm cierre · 1 pieza en tela doble`;
      g.appendChild(wb2);

      pieces.push({
        group: g,
        bounds: { x: 0, y: 0, w: s + waistbandW + s, h: s + waistbandH + s },
        name: 'Pretina',
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PIEZA 4: BOLSILLO (rectángulo redondeado, opcional)
    // ═══════════════════════════════════════════════════════════════════
    {
      const pW = 150;  // 15cm ancho
      const pH = 160;  // 16cm alto
      const r  = 15;   // radio esquinas inf mm

      // Path rectángulo redondeado solo en esquinas inferiores
      let d = '';
      d += P.M(s, s);                                      // sup-izq
      d += ` ${P.L(s + pW, s)}`;                          // sup → sup-der
      d += ` ${P.L(s + pW, s + pH - r)}`;                 // sup-der → antes de curva
      d += ` ${P.A(r, r, 0, 0, 1, s + pW - r, s + pH)}`; // curva inf-der
      d += ` ${P.L(s + r, s + pH)}`;                      // inf-der → antes curva izq
      d += ` ${P.A(r, r, 0, 0, 1, s, s + pH - r)}`;      // curva inf-izq
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'piece-pocket');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));

      // Línea de hilo vertical
      g.appendChild(U.grainLine(s + pW / 2, s + 20, pH - 40, true));

      // Etiqueta
      g.appendChild(U.pieceLabel(s + 10, s + pH * 0.4, 'BOLSILLO', [
        'Pantalón Básico', '2 piezas (1 por lado)',
        `15cm × 16cm`,
        `Margen costura: ${seam}mm`,
      ]));

      pieces.push({
        group: g,
        bounds: { x: 0, y: 0, w: s + pW + s, h: s + pH + s },
        name: 'Bolsillo',
      });
    }

    return pieces;
  }

  return { generate };
})();
