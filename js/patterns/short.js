/**
 * patterns/short.js
 * Short básico / bermuda deportivo.
 *
 * FÓRMULAS BASADAS EN:
 *  - Metric Pattern Cutting (Winifred Aldrich, 6th ed.)
 *
 * Piezas generadas:
 *  1. Delantero (½ pieza — doblar en tela al CF)
 *  2. Trasero   (½ pieza — doblar en tela al CB)
 *  3. Pretina   (igual al pantalón: cintura + 5cm, 40mm alto)
 *
 * Diferencias vs pantalón:
 *  - Largo total = m.shortLength || 45cm (sobre la rodilla)
 *  - Tiro más corto (proporcional al largo)
 *  - Bajo recto (sin tobillo)
 *  - Sin entrepierna larga — la pierna termina justo bajo el tiro
 *
 * Unidades: mm internamente. Inputs: cm → ×10 para convertir.
 */

'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.Short = (function() {
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
    const ease = (m.ease || 6) * 10;   // facilidad mm

    // ── Medidas clave ───────────────────────────────────────────────────
    const W  = m.waist * 10;                     // cintura mm
    const H  = m.hip   * 10;                     // cadera mm
    const HD = (m.hipDepth || 20) * 10;          // profundidad cadera mm

    // Largo total del short (desde cintura hasta el bajo)
    const SL = (m.shortLength || 45) * 10;       // mm

    // El "rise" (cintura al tiro) es proporcional
    // Para un short, el tiro queda aproximadamente a SL × 0.6
    const rise = SL * 0.6;   // mm desde cintura al tiro

    // ── Bloque de medidas (¼ contorno + facilidad) ─────────────────────
    const wBlock = (W + ease * 0.5) / 4;  // ancho bloque cintura ¼
    const hBlock = (H + ease)       / 4;  // ancho bloque cadera  ¼

    // ── Tiro (fórmulas Aldrich adaptadas a short) ───────────────────────
    // La extensión del tiro es proporcional a la cadera, igual que el pantalón
    const forkF = hBlock - 10;   // tiro delantero mm
    const forkB = hBlock + 30;   // tiro trasero mm (más ancho)

    // Ancho del bajo del short (entre entrepierna y lateral)
    // Para un short, el bajo es más ancho que el tobillo del pantalón
    const thigh = (m.thigh || m.hip * 0.6) * 10;
    const hemHalfF = thigh / 4 + 10;   // ½ ancho bajo delantero
    const hemHalfB = thigh / 4 + 15;   // ½ ancho bajo trasero (más holgado)

    // Diferencia cintura-cadera para pinzas
    const diffF      = hBlock - wBlock;
    const dartWidthF = diffF * 0.5;
    const dartLenF   = 70;    // largo pinza delantera 7cm

    const diffB      = hBlock - wBlock + 20;
    const dartWidthB = diffB * 0.6;
    const dartLenB   = 100;   // largo pinza trasera 10cm

    const pieces = [];

    // ═══════════════════════════════════════════════════════════════════
    // PIEZA 1: DELANTERO (½ pieza — doblar en tela CF = izquierda)
    // ═══════════════════════════════════════════════════════════════════
    {
      // Puntos clave
      const wCF    = [s, s];                            // CF cintura
      const wSide  = [s + hBlock, s + 12];              // lateral cintura (~1.2cm bajo)

      const hipSide = [s + hBlock, s + HD];             // lateral cadera

      const crotchY = s + rise;
      // La curva de tiro empieza un poco antes del nivel tiro
      const crotchStart = [s + hBlock, Math.min(s + HD + 50, crotchY - 20)];
      const crotchPt    = [s + forkF, crotchY];         // punta tiro delantero

      // Control points tiro (curva cóncava característica)
      const cpTiro1 = [s + hBlock + forkF * 0.3, crotchStart[1] + (crotchY - crotchStart[1]) * 0.4];
      const cpTiro2 = [s + forkF + 12, crotchY - 15];

      // Bajo del short: horizontal — recto
      // La entrepierna es una curva muy corta desde el tiro hasta el bajo
      const inseamBot  = [s + hemHalfF, s + SL];      // bajo entrepierna
      const hemSide    = [s + hemHalfF, s + SL];      // bajo lateral (igual punto)
      const hemCF      = [s, s + SL];                  // bajo CF

      // ── Pinza de cintura delantera ────────────────────────────────
      const pDartX    = s + hBlock * 0.45;
      const pDartTopY = s + 8;
      const pDartBotY = pDartTopY + dartLenF;
      const pDartW2   = dartWidthF / 2;

      // ── Construir path ────────────────────────────────────────────
      let d = '';
      d += P.M(...wCF);

      // Cintura: curva suave CF → lateral
      const wCP = [s + hBlock * 0.5, s - 4];
      d += ` ${P.Q(...wCP, ...wSide)}`;

      // Lateral RECTO: cintura → cadera → inicio curva tiro
      d += ` ${P.L(...hipSide)}`;
      d += ` ${P.L(...crotchStart)}`;

      // Curva de tiro (cóncava)
      d += ` ${P.C(...cpTiro1, ...cpTiro2, ...crotchPt)}`;

      // Entrepierna: curva corta desde tiro hasta bajo
      const cpIns1 = [crotchPt[0] - 8, crotchPt[1] + (s + SL - crotchPt[1]) * 0.4];
      const cpIns2 = [inseamBot[0] + 5, s + SL - 20];
      d += ` ${P.C(...cpIns1, ...cpIns2, ...inseamBot)}`;

      // Bajo recto: entrepierna → lateral → CF
      d += ` ${P.L(...hemCF)}`;
      d += ' Z';

      // ── Pinza dibujada ────────────────────────────────────────────
      const dartG = U.el('g', {});
      const dartPath = `${P.M(pDartX - pDartW2, pDartTopY)} ${P.L(pDartX, pDartBotY)} ${P.L(pDartX + pDartW2, pDartTopY)}`;
      dartG.appendChild(U.el('path', {
        d: dartPath, fill: 'none',
        stroke: C.dartLine, 'stroke-width': '0.6',
        'stroke-dasharray': '5,2',
      }));

      // ── Crear grupo SVG ───────────────────────────────────────────
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'piece-short-front');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));
      g.appendChild(dartG);

      // Línea de doblez CF
      g.appendChild(U.foldLine(s, s, s, s + SL, 'DOBLAR CF'));

      // Línea de hilo (vertical, centro de pieza)
      const grainX = s + hBlock * 0.5;
      g.appendChild(U.grainLine(grainX, s + rise + 15, SL - rise - 30, true));

      // Muescas
      g.appendChild(U.notch(hipSide[0], hipSide[1], 0, 3));
      g.appendChild(U.notch(crotchPt[0], crotchPt[1], 180, 3));
      g.appendChild(U.notch(wSide[0], wSide[1], 0, 2));
      g.appendChild(U.notch(s + hemHalfF, s + SL, 90, 2));  // bajo lateral

      // Etiqueta
      g.appendChild(U.pieceLabel(s + hBlock * 0.2, s + rise + (SL - rise) * 0.4, 'DELANTERO', [
        'Short Básico', '1 pieza (doble tela)',
        `Cintura: ${m.waist}cm · Cadera: ${m.hip}cm`,
        `Largo short: ${m.shortLength || 45}cm`,
        `Margen costura: ${seam}mm (NO en doblez CF)`,
      ]));

      const totalW = s + hBlock + forkF + s;
      const totalH = s + SL + s;
      pieces.push({ group: g, bounds: { x: 0, y: 0, w: totalW, h: totalH }, name: 'Delantero' });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PIEZA 2: TRASERO (½ pieza — doblar en tela CB = izquierda)
    // ═══════════════════════════════════════════════════════════════════
    {
      const hBlockB = hBlock + 5;   // cadera trasera ligeramente más ancha

      // Puntos clave
      const wCB    = [s, s + 15];                         // CB cintura (levantada 1.5cm)
      const wSideB = [s + hBlockB, s + 28];               // lateral cintura

      const hipSideB = [s + hBlockB, s + HD];             // lateral cadera

      const crotchY  = s + rise;
      const crotchStartB = [s + hBlockB, Math.min(s + HD + 40, crotchY - 15)];
      const crotchPtB    = [s + forkB, crotchY];          // punta tiro trasero

      const cpTiroB1 = [s + hBlockB + forkB * 0.35, crotchStartB[1] + (crotchY - crotchStartB[1]) * 0.3];
      const cpTiroB2 = [s + forkB + 18, crotchY - 25];

      // Bajo trasero: recto — ligeramente más ancho que el delantero
      const inseamBotB = [s + hemHalfB, s + SL];
      const hemCB      = [s, s + SL];

      // ── Pinza trasera ─────────────────────────────────────────────
      const bDartX    = s + hBlockB * 0.4;
      const bDartTopY = s + 28 + 8;
      const bDartBotY = bDartTopY + dartLenB;
      const bDartW2   = dartWidthB / 2;

      // ── Construir path ────────────────────────────────────────────
      let d = '';
      d += P.M(...wCB);

      // Cintura CB → lateral: curva más pronunciada que el delantero
      const wCPB = [s + hBlockB * 0.5, s + 8];
      d += ` ${P.Q(...wCPB, ...wSideB)}`;

      // Lateral RECTO: cintura → cadera → curva tiro
      d += ` ${P.L(...hipSideB)}`;
      d += ` ${P.L(...crotchStartB)}`;

      // Curva de tiro trasero (más profunda y extendida)
      d += ` ${P.C(...cpTiroB1, ...cpTiroB2, ...crotchPtB)}`;

      // Entrepierna trasera: curva corta hasta bajo
      const cpInsB1 = [crotchPtB[0] - 10, crotchPtB[1] + (s + SL - crotchPtB[1]) * 0.4];
      const cpInsB2 = [inseamBotB[0] + 5, s + SL - 20];
      d += ` ${P.C(...cpInsB1, ...cpInsB2, ...inseamBotB)}`;

      // Bajo recto → CF
      d += ` ${P.L(...hemCB)}`;
      d += ' Z';

      // ── Pinza trasera dibujada ────────────────────────────────────
      const dartGB = U.el('g', {});
      const dartPathB = `${P.M(bDartX - bDartW2, bDartTopY)} ${P.L(bDartX, bDartBotY)} ${P.L(bDartX + bDartW2, bDartTopY)}`;
      dartGB.appendChild(U.el('path', {
        d: dartPathB, fill: 'none',
        stroke: C.dartLine, 'stroke-width': '0.6',
        'stroke-dasharray': '5,2',
      }));

      // ── Crear grupo SVG ───────────────────────────────────────────
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'piece-short-back');

      g.appendChild(U.el('path', {
        d, fill: C.fill,
        stroke: C.cutLine, 'stroke-width': '0.8',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));
      g.appendChild(dartGB);

      // Línea de doblez CB
      g.appendChild(U.foldLine(s, s + 15, s, s + SL, 'DOBLAR CB'));

      // Línea de hilo
      const grainXB = s + hBlockB * 0.5;
      g.appendChild(U.grainLine(grainXB, s + rise + 15, SL - rise - 30, true));

      // Muescas
      g.appendChild(U.notch(hipSideB[0], hipSideB[1], 0, 3));
      g.appendChild(U.notch(crotchPtB[0], crotchPtB[1], 180, 3));
      g.appendChild(U.notch(wSideB[0], wSideB[1], 0, 2));
      g.appendChild(U.notch(wCB[0], wCB[1], 270, 2));
      g.appendChild(U.notch(s + hemHalfB, s + SL, 90, 2));

      // Etiqueta
      g.appendChild(U.pieceLabel(s + hBlockB * 0.2, s + rise + (SL - rise) * 0.4, 'TRASERO', [
        'Short Básico', '1 pieza (doble tela)',
        `Cintura: ${m.waist}cm · Cadera: ${m.hip}cm`,
        `Largo short: ${m.shortLength || 45}cm`,
        `Margen costura: ${seam}mm (NO en doblez CB)`,
      ]));

      const totalWB = s + hBlockB + forkB + s;
      const totalHB = s + SL + s;
      pieces.push({ group: g, bounds: { x: 0, y: 0, w: totalWB, h: totalHB }, name: 'Trasero' });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PIEZA 3: PRETINA (idéntica al pantalón)
    // ═══════════════════════════════════════════════════════════════════
    {
      const waistbandW = W + 50;   // cintura + 5cm cierre
      const waistbandH = 40;       // 4cm alto (dobla a 2cm visible)

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'piece-short-waistband');

      g.appendChild(U.el('rect', {
        x: n(s), y: n(s),
        width: n(waistbandW), height: n(waistbandH),
        fill: C.fill, stroke: C.cutLine, 'stroke-width': '0.8',
      }));

      // Línea de doblez central
      const midY = s + waistbandH / 2;
      g.appendChild(U.el('line', {
        x1: n(s), y1: n(midY), x2: n(s + waistbandW), y2: n(midY),
        stroke: C.foldLine, 'stroke-width': '0.5', 'stroke-dasharray': '6,3',
      }));

      // Línea de hilo horizontal
      g.appendChild(U.grainLine(s + 20, s + waistbandH / 2, waistbandW - 40, false));

      // Muescas de centro
      g.appendChild(U.notch(s + waistbandW / 2, s, 270, 2));
      g.appendChild(U.notch(s + waistbandW / 2, s + waistbandH, 90, 2));

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

    return pieces;
  }

  return { generate };
})();
