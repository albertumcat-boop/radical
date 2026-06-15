/**
 * patterns/vestido-cruzado.js
 * Vestido cruzado / wrap dress básico.
 *
 * Piezas:
 *  1. Espalda     (½ pieza, doblar en tela)
 *  2. Frente izq  (pieza entera — se cruza sobre el derecho)
 *  3. Frente der  (pieza entera — espejo del izquierdo)
 *  4. Manga corta tipo kimono (rectangular con curva en axila, opcional)
 *  5. Cinturón/faja (tira larga para atar)
 */

'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.VestidoCruzado = (function() {
  const U = PAT.SVGUtils;
  const P = U.P;
  const C = PAT.COLORS;
  const NS = U.NS;
  const n = U.n;

  function generate(m, seam) {
    const s = seam;
    const ease = m.ease * 10;
    const pieces = [];

    // ── Medidas base ──────────────────────────────────────────────────
    const B  = m.bust         * 10;
    const W  = m.waist        * 10;
    const H  = m.hip          * 10;
    const Sh = m.shoulder     * 10;
    const BL = m.backLength   * 10;
    const FL = m.frontLength  * 10;
    const HD = m.hipDepth     * 10;
    const SL = (m.skirtLength || 60) * 10;
    const TL = BL + SL;                    // largo total espalda
    const TL_f = FL + SL;                  // largo total frente

    // ── Anchos de pieza ───────────────────────────────────────────────
    const bW  = (B + ease) / 4;            // ¼ busto (espalda ½)
    const wW  = (W + ease * 0.5) / 4;
    const hW  = (H + ease) / 4;

    // Overlap del cruce: +12cm en frente
    const OVERLAP  = 120;   // 12cm en mm
    // Vuelo extra en lateral inferior del frente
    const FLARE    = 150;   // 15cm en mm

    // ── Cuello / hombro ───────────────────────────────────────────────
    const neckW    = B / 12 + 5;
    const neckD_b  = 25;                   // profundidad cuello espalda
    const shLen    = Sh / 2 - neckW;
    const shSlope  = 15;                   // caída de hombro

    // ── Sisa ──────────────────────────────────────────────────────────
    const adepth   = B * 0.14 + 50;       // profundidad sisa

    // ── Pinzas en cintura ─────────────────────────────────────────────
    const diff      = hW - wW;
    const dartFront = diff * 0.4;
    const dartBack  = diff * 0.6;
    const dw_f      = dartFront / 2;
    const dw_b      = dartBack  / 2;

    // ── Helper sisa (igual que vestido.js) ────────────────────────────
    function buildSisa(nkC, nkS, shT, ahB) {
      const ahMX = shT[0] + (ahB[0] - shT[0]) * 0.7;
      const ahMY = shT[1] + (ahB[1] - shT[1]) * 0.45;
      const ahM  = [ahMX, ahMY];
      let d = '';
      d += ` ${P.C(shT[0]+5, shT[1]+(ahM[1]-shT[1])*0.4, ahM[0]+10, ahM[1]-15, ...ahM)}`;
      d += ` ${P.C(ahM[0]+8, ahM[1]+15, ahB[0]+5, ahB[1]-20, ...ahB)}`;
      return { d, ahM };
    }

    // ═══════════════════ ESPALDA (½ pieza, doblar en CB) ════════════════
    {
      const nkC = [s, s+neckD_b], nkS = [s+neckW, s];
      const shT = [s+neckW+shLen, s+shSlope], ahB = [s+bW, s+adepth];
      const { d: sisaD, ahM } = buildSisa(nkC, nkS, shT, ahB);

      // Pinza cintura espalda
      const dartX   = s + bW * 0.55;
      const dartTopY = s + BL - 20;
      const dartBotY = s + BL + 80;

      let d = P.M(...nkC);
      d += ` ${P.Q(s+neckW*0.1, s, ...nkS)} ${P.L(...shT)}`;
      d += sisaD;
      // Lateral: sisa → cintura → cadera → dobladillo
      d += ` ${P.C(ahB[0], ahB[1]+(BL-adepth)*0.5, wW+s+5, s+BL-20, s+wW, s+BL)}`;
      d += ` ${P.C(wW+s-5, s+BL+20, hW+s-8, s+BL+HD-20, s+hW, s+BL+HD)}`;
      d += ` ${P.L(s+hW, s+TL)} ${P.H(s)} Z`;

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));

      // Líneas auxiliares cintura y cadera
      g.appendChild(U.el('line', { x1:n(s), y1:n(s+BL), x2:n(s+hW), y2:n(s+BL), stroke:C.seamLine, 'stroke-width':'0.4', 'stroke-dasharray':'6,3' }));
      g.appendChild(U.el('line', { x1:n(s), y1:n(s+BL+HD), x2:n(s+hW), y2:n(s+BL+HD), stroke:C.seamLine, 'stroke-width':'0.3', 'stroke-dasharray':'5,3' }));

      // Pinza cintura espalda
      g.appendChild(U.el('polygon', {
        points:`${n(dartX-dw_b)},${n(dartTopY)} ${n(dartX)},${n(dartBotY)} ${n(dartX+dw_b)},${n(dartTopY)}`,
        fill:C.fill, stroke:C.dartLine, 'stroke-width':'0.5', 'stroke-dasharray':'3,2'
      }));

      g.appendChild(U.foldLine(s, s+neckD_b, s, s+TL, 'CB DOBLAR'));
      g.appendChild(U.grainLine(s+bW*0.5, s+adepth+20, TL-adepth-40));
      g.appendChild(U.notch(ahM[0], ahM[1], 90, 3));
      g.appendChild(U.notch(s+wW, s+BL, 0, 3));
      g.appendChild(U.notch(s+hW, s+BL+HD, 0, 3));

      g.appendChild(U.pieceLabel(s+10, s+adepth+40, 'ESPALDA — VESTIDO CRUZADO', [
        '1 pieza (doble tela — doblar en CB)',
        `Busto: ${m.bust}cm · Cintura: ${m.waist}cm`,
        `Cadera: ${m.hip}cm · Largo: ${Math.round(TL/10)}cm`,
        `Pinza cintura: ${Math.round(dartBack/10*10)/10}cm`,
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+Math.max(bW,hW)+s,h:s+TL+s}, name:'Espalda' });
    }

    // ═══════════════════ FRENTE CRUZADO (pieza entera) ════════════════
    // Se genera como frente izquierdo. El derecho es su espejo (indicado en etiqueta).
    // La pieza es completa (no ½): ancho = 2×bW + OVERLAP
    {
      // Frente cruzado: pieza entera.
      // La costura de CB no existe — el centro del frente queda libre para cruzar.
      // Escote diagonal (cuello V pronunciado): desde hombro hasta punto V en CF.

      // Coordenadas hombro (izquierdo de la pieza)
      const shSide_L  = [s, s + shSlope];               // hombro extremo izq (costado)
      const nkShL     = [s + shLen, s];                  // hombro→cuello izq
      // Punto V del escote (centro del frente, debajo del busto)
      const vNeckX    = s + shLen + neckW + OVERLAP * 0.5;  // hacia el centro con overlap
      const vNeckY    = s + FL * 0.35;                       // profundidad V (35% del talle)

      // Sisa izquierda (costado)
      const ahB_L = [s, s + adepth];
      const ahMX  = shSide_L[0] + (ahB_L[0] - shSide_L[0]) * 0.5;
      const ahMY  = shSide_L[1] + (ahB_L[1] - shSide_L[1]) * 0.5;
      const ahM_L = [ahMX, ahMY];

      // Ancho total de la pieza
      const pieceW = bW + neckW + OVERLAP;   // sisa + neckW + overlap cruce

      // Hombro derecho (borde del escote V, más interno)
      const nkShR = [s + pieceW, s];
      const shSide_R = [s + pieceW - shLen * 0.6, s + shSlope * 0.6];  // hombro der más pequeño (zona cruce)

      // Sisa derecha (cruce — menos pronunciada, solo curva axila)
      const ahB_R = [s + pieceW, s + adepth * 0.7];

      // ── Lateral inferior con vuelo extra ────────────────────────────
      // Izquierdo (costado): baja recto desde sisa a cadera luego se abre con flare
      const sideTopL = ahB_L;
      const waistL   = [s, s + FL];
      const hipL     = [s - FLARE * 0.3, s + FL + HD];      // se abre hacia el exterior
      const hemL     = [s - FLARE, s + TL_f];                // dobladillo con vuelo

      // Central del dobladillo (frente inferior)
      const hemC     = [s + pieceW * 0.5, s + TL_f];

      // Derecho (cruce): baja más recta, el vuelo va hacia el interior
      const waistR   = [s + pieceW, s + FL];
      const hipR     = [s + pieceW + FLARE * 0.2, s + FL + HD];
      const hemR     = [s + pieceW + FLARE * 0.5, s + TL_f];

      let d = P.M(...nkShL);
      // Hombro izquierdo → sisa izquierda
      d += ` ${P.L(...shSide_L)}`;
      d += ` ${P.C(shSide_L[0]-5, ahM_L[1]-10, ahM_L[0]-8, ahM_L[1]-5, ...ahM_L)}`;
      d += ` ${P.C(ahM_L[0]-5, ahM_L[1]+15, ahB_L[0]+5, ahB_L[1]-10, ...ahB_L)}`;
      // Lateral izquierdo: sisa → cintura → cadera → dobladillo (con vuelo)
      d += ` ${P.C(waistL[0]-5, s+FL-30, ...waistL)}`;
      d += ` ${P.C(waistL[0]-10, s+FL+20, ...hipL)}`;
      d += ` ${P.L(...hemL)}`;
      // Dobladillo inferior (de izq a der)
      d += ` ${P.Q(s+pieceW*0.3, s+TL_f+10, ...hemC)}`;
      d += ` ${P.Q(s+pieceW*0.7, s+TL_f+10, ...hemR)}`;
      // Lateral derecho: dobladillo → cadera → cintura → sisa
      d += ` ${P.L(...hipR)}`;
      d += ` ${P.C(waistR[0]+10, s+FL+20, waistR[0]+5, s+FL-20, ...waistR)}`;
      d += ` ${P.C(ahB_R[0]+5, ahB_R[1]-10, ahB_R[0], ahB_R[1]+10, ...ahB_R)}`;
      // Hombro derecho (corto — zona cruce)
      d += ` ${P.L(...shSide_R)}`;
      d += ` ${P.L(...nkShR)}`;
      // Escote V diagonal: de hombro der hasta punto V, luego al hombro izq
      d += ` ${P.L(...[vNeckX, vNeckY])}`;   // diagonal al V
      d += ` ${P.L(...nkShL)}`;               // diagonal del V al hombro izq
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));

      // Líneas cintura y cadera
      g.appendChild(U.el('line', { x1:n(s), y1:n(s+FL), x2:n(s+pieceW), y2:n(s+FL), stroke:C.seamLine, 'stroke-width':'0.4', 'stroke-dasharray':'6,3' }));
      g.appendChild(U.el('line', { x1:n(s), y1:n(s+FL+HD), x2:n(s+pieceW), y2:n(s+FL+HD), stroke:C.seamLine, 'stroke-width':'0.3', 'stroke-dasharray':'5,3' }));

      // Línea de escote V (guía de costura)
      g.appendChild(U.el('line', {
        x1:n(nkShR[0]), y1:n(nkShR[1]),
        x2:n(vNeckX), y2:n(vNeckY),
        stroke:C.seamLine, 'stroke-width':'0.5', 'stroke-dasharray':'4,2'
      }));
      const vLbl = U.el('text', { x:n(vNeckX+4), y:n(vNeckY), 'font-size':'3', fill:C.seamLine, 'font-family':'Arial' });
      vLbl.textContent = 'punto V';
      g.appendChild(vLbl);

      // Línea de overlap/cruce (vertical)
      const overlapX = s + neckW + OVERLAP;
      g.appendChild(U.el('line', {
        x1:n(overlapX), y1:n(s), x2:n(overlapX), y2:n(s+TL_f),
        stroke:C.dimLine, 'stroke-width':'0.5', 'stroke-dasharray':'5,3'
      }));
      const olLbl = U.el('text', {
        x:n(overlapX+3), y:n(s+FL*0.5), 'font-size':'2.8', fill:C.dimLine, 'font-family':'Arial'
      });
      olLbl.textContent = `←cruce ${OVERLAP/10}cm→`;
      g.appendChild(olLbl);

      // Línea de hilo (vertical en eje central de la pieza)
      g.appendChild(U.grainLine(s+pieceW*0.45, s+adepth+20, TL_f-adepth-40));

      // Muescas
      g.appendChild(U.notch(ahM_L[0], ahM_L[1], 180, 3));   // sisa izq
      g.appendChild(U.notch(s, s+FL, 180, 3));                // cintura costado
      g.appendChild(U.notch(vNeckX, vNeckY, 270, 3));         // punto V

      g.appendChild(U.pieceLabel(s+pieceW*0.2, s+FL*0.6, 'FRENTE IZQ — VESTIDO CRUZADO', [
        '2 piezas (cortar en espejo para der)',
        `Escote V pronunciado · Cruce ${OVERLAP/10}cm`,
        `Vuelo lateral: ${FLARE/10}cm`,
        `Largo: ${Math.round(TL_f/10)}cm`,
        'SIN botones — atar con cinturón',
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+pieceW+FLARE+s,h:s+TL_f+s+15}, name:'Frente Izq/Der' });
    }

    // ═══════════════════ MANGA KIMONO CORTA ════════════════════════════
    // Manga rectangular + curva en axila. Largo 20cm.
    {
      const sleeveLen = 200;    // 20cm largo manga
      const sleeveW   = bW + 30; // anchura manga (¼ busto + holgura)
      const axillaCurveD = 40;   // profundidad curva axila (4cm)

      const g = document.createElementNS(NS, 'g');

      // Rectángulo base de la manga
      // La axila queda en el borde inferior interno (esquina inferior derecha si CB arriba)
      let d = P.M(s, s);
      d += ` ${P.H(s + sleeveW)}`;                  // borde superior (hombro→puño)
      d += ` ${P.L(s + sleeveW, s + sleeveLen)}`;   // orilla lateral (puño)
      d += ` ${P.H(s)}`;                             // dobladillo de puño
      d += ` ${P.L(s, s + sleeveLen - axillaCurveD)}`;  // sube por el costado hasta curva axila
      // Curva axila: de la base del costado hasta el inicio de la axila en hombro
      d += ` ${P.Q(s, s + sleeveLen * 0.3, s + sleeveW * 0.15, s + sleeveLen * 0.15)}`;
      d += ` ${P.L(s, s)}`;
      d += ' Z';

      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));

      // Línea de doblez en hombro (borde superior)
      g.appendChild(U.foldLine(s, s, s+sleeveW, s, 'DOBLEZ HOMBRO'));

      // Curva de axila (guía)
      g.appendChild(U.el('line', {
        x1:n(s), y1:n(s+sleeveLen-axillaCurveD), x2:n(s+sleeveW*0.15), y2:n(s+sleeveLen*0.15),
        stroke:C.seamLine, 'stroke-width':'0.3', 'stroke-dasharray':'3,2'
      }));
      const axLbl = U.el('text', { x:n(s+3), y:n(s+sleeveLen*0.35), 'font-size':'3', fill:C.seamLine, 'font-family':'Arial' });
      axLbl.textContent = 'curva axila';
      g.appendChild(axLbl);

      g.appendChild(U.grainLine(s+sleeveW*0.5, s+sleeveLen*0.3, sleeveLen*0.4));

      // Muescas para unir con espalda/frente
      g.appendChild(U.notch(s+sleeveW*0.5, s, 270, 3));               // centro hombro
      g.appendChild(U.notch(s+sleeveW, s+sleeveLen*0.5, 0, 3));       // lateral frente
      g.appendChild(U.notch(s, s+sleeveLen*0.5, 180, 3));              // lateral espalda

      g.appendChild(U.pieceLabel(s+sleeveW*0.25, s+sleeveLen*0.55, 'MANGA KIMONO — VESTIDO CRUZADO', [
        '2 piezas (espejo)',
        `Largo: ${sleeveLen/10}cm · Ancho: ${Math.round(sleeveW/10)}cm`,
        'Curva en axila',
        'OPCIONAL',
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+sleeveW+s,h:s+sleeveLen+s}, name:'Manga Kimono' });
    }

    // ═══════════════════ CINTURÓN / FAJA ══════════════════════════════
    // Tira larga para atar. Largo total: perímetro cintura × 2.5 (para dar la vuelta y atar).
    {
      const beltLen = W * 2.5 + 200;  // largo generoso para lazo
      const beltH   = 60;             // 6cm de ancho (dobla a 3cm)

      const g = document.createElementNS(NS, 'g');

      g.appendChild(U.el('rect', {
        x:n(s), y:n(s), width:n(beltLen), height:n(beltH),
        fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8'
      }));

      // Extremos en punta (opcional — indica dónde termina la tira)
      g.appendChild(U.el('line', {
        x1:n(s+beltLen-50), y1:n(s), x2:n(s+beltLen), y2:n(s+beltH/2),
        stroke:C.seamLine, 'stroke-width':'0.4', 'stroke-dasharray':'3,2'
      }));
      g.appendChild(U.el('line', {
        x1:n(s+beltLen-50), y1:n(s+beltH), x2:n(s+beltLen), y2:n(s+beltH/2),
        stroke:C.seamLine, 'stroke-width':'0.4', 'stroke-dasharray':'3,2'
      }));

      // Línea de doblez central (longitudinal)
      g.appendChild(U.foldLine(s, s+beltH/2, s+beltLen, s+beltH/2));

      // Marca de centro (para posicionar en cintura al atar)
      const midX = s + beltLen/2;
      g.appendChild(U.el('line', {
        x1:n(midX), y1:n(s), x2:n(midX), y2:n(s+beltH),
        stroke:C.dimLine, 'stroke-width':'0.5', 'stroke-dasharray':'4,2'
      }));
      const midLbl = U.el('text', { x:n(midX+2), y:n(s+beltH+8), 'font-size':'3', fill:C.dimLine, 'font-family':'Arial' });
      midLbl.textContent = 'centro CB';
      g.appendChild(midLbl);

      g.appendChild(U.grainLine(s+beltLen*0.3, s+10, beltH-20));

      g.appendChild(U.pieceLabel(s+20, s+beltH+16, 'CINTURÓN/FAJA — VESTIDO CRUZADO', [
        '1 pieza (tira continua)',
        `Largo total: ${Math.round(beltLen/10)}cm · Ancho: ${beltH/10}cm (dobla a ${beltH/20}cm)`,
        'Marcar centro CB',
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+beltLen+s,h:s+beltH+s+25}, name:'Cinturón' });
    }

    return pieces;
  }

  return { generate };
})();
