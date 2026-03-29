/**
 * patterns/vestido.js
 * Vestido básico = Cuerpo (blusa) + Falda recta unidos en cintura.
 *
 * Piezas: Espalda, Frente, con moldeo de sisa, cuello V opcional, y falda integrada.
 */

'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.Vestido = (function() {
  const U = PAT.SVGUtils;
  const P = U.P;
  const C = PAT.COLORS;
  const NS = U.NS;

  function generate(m, seam) {
    const s = seam;
    const ease = m.ease * 10;
    const pieces = [];

    const B  = m.bust  * 10, W = m.waist * 10, H = m.hip * 10;
    const Sh = m.shoulder * 10, BL = m.backLength * 10, FL = m.frontLength * 10;
    const SL = m.skirtLength * 10, HD = m.hipDepth * 10;
    const TL = BL + SL;  // largo total = talle + falda

    const bW = (B + ease) / 4;
    const wW = (W + ease * 0.5) / 4;
    const hW = (H + ease) / 4;

    const neckW   = B / 12 + 5;
    const neckD_b = 25;
    const neckD_f = FL * 0.2 + 15;   // cuello V para vestido
    const shLen   = Sh / 2 - neckW;
    const shSlope = 15;
    const adepth  = B * 0.14 + 50;

    const diff    = hW - wW;
    const dartFront = diff * 0.4;
    const dartBack  = diff * 0.6;

    // ─── HELPER de sisa ─────────────────────────────────────────────
    function buildSisa(nkC, nkS, shT, ahB) {
      const ahMX = shT[0]+(ahB[0]-shT[0])*0.7;
      const ahMY = shT[1]+(ahB[1]-shT[1])*0.45;
      const ahM  = [ahMX, ahMY];
      let d = '';
      d += ` ${P.C(shT[0]+5, shT[1]+(ahM[1]-shT[1])*0.4, ahM[0]+10, ahM[1]-15, ...ahM)}`;
      d += ` ${P.C(ahM[0]+8, ahM[1]+15, ahB[0]+5, ahB[1]-20, ...ahB)}`;
      return { d, ahM };
    }

    // ═══════════════════ ESPALDA COMPLETA ═══════════════════════════
    {
      const nkC = [s, s+neckD_b], nkS = [s+neckW, s];
      const shT = [s+neckW+shLen, s+shSlope], ahB = [s+bW, s+adepth];
      const { d: sisaD, ahM } = buildSisa(nkC, nkS, shT, ahB);

      // Pinza de espalda en cintura (vertical)
      const dartX = s + bW * 0.55;
      const dartTopY = s + BL - 20;   // empieza 2cm antes de cintura
      const dartBotY = s + BL + 80;   // termina 8cm abajo de cintura
      const dw = dartBack / 2;

      let d = P.M(...nkC);
      d += ` ${P.Q(s+neckW*0.1, s, ...nkS)} ${P.L(...shT)}`;
      d += sisaD;
      // Lateral: sisa → cintura → cadera → hem
      d += ` ${P.C(ahB[0], ahB[1]+(BL-adepth)*0.5, wW+s+5, s+BL-20, s+wW, s+BL)}`;
      d += ` ${P.C(wW+s-5, s+BL+20, hW+s-8, s+BL+HD-20, s+hW, s+BL+HD)}`;
      d += ` ${P.L(s+hW, s+TL)} ${P.H(s)} Z`;

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));

      // Línea de cintura
      g.appendChild(U.el('line', { x1:n(s), y1:n(s+BL), x2:n(s+hW), y2:n(s+BL), stroke:C.seamLine, 'stroke-width':'0.4', 'stroke-dasharray':'6,3' }));
      // Línea de cadera
      g.appendChild(U.el('line', { x1:n(s), y1:n(s+BL+HD), x2:n(s+hW), y2:n(s+BL+HD), stroke:C.seamLine, 'stroke-width':'0.3', 'stroke-dasharray':'5,3' }));

      // Pinza en cintura
      g.appendChild(U.el('polygon', {
        points:`${n(dartX-dw)},${n(dartTopY)} ${n(dartX)},${n(dartBotY)} ${n(dartX+dw)},${n(dartTopY)}`,
        fill:C.fill, stroke:C.dartLine, 'stroke-width':'0.5', 'stroke-dasharray':'3,2'
      }));

      g.appendChild(U.foldLine(s, s+neckD_b, s, s+TL, 'CB DOBLAR'));
      g.appendChild(U.grainLine(s+bW*0.5, s+adepth+20, TL-adepth-40));
      g.appendChild(U.notch(ahM[0], ahM[1], 90, 3));
      g.appendChild(U.notch(s+wW, s+BL, 0, 3));
      g.appendChild(U.notch(s+hW, s+BL+HD, 0, 3));

      g.appendChild(U.pieceLabel(s+10, s+adepth+40, 'ESPALDA — VESTIDO', [
        '1 pieza (doble tela)', `Busto: ${m.bust}cm · Cintura: ${m.waist}cm`,
        `Cadera: ${m.hip}cm · Largo: ${Math.round(TL/10)}cm`,
        `Pinza cintura: ${Math.round(dartBack/10*10)/10}cm`,
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+Math.max(bW,hW)+s,h:s+TL+s}, name:'Espalda' });
    }

    // ═══════════════════ FRENTE COMPLETO ════════════════════════════
    {
      const nkC = [s, s+neckD_f], nkS = [s+neckW, s];
      const shT = [s+neckW+shLen, s+shSlope], ahB = [s+bW, s+adepth];
      const { d: sisaD, ahM } = buildSisa(nkC, nkS, shT, ahB);

      // Pinza de busto en costado
      const bustY = s + FL * 0.43;
      const bustPt = { x: s + bW * 0.55, y: bustY };
      const dw_bust = Math.max(8, (B - W) / 4 * 0.45);
      const dartTopF = [s + bW, bustY - dw_bust / 2];
      const dartBotF = [s + bW, bustY + dw_bust / 2];

      // Pinza cintura frente
      const dartFX = s + bW * 0.5;
      const dartTopFW = s + FL - 15;
      const dartBotFW = s + FL + 80;
      const dw_w = dartFront / 2;

      let d = P.M(...nkC);
      // Cuello V frente
      d += ` ${P.L(s+neckW*0.5, s+neckD_f*0.5)}`;  // cuello V con línea
      d += ` ${P.L(...nkS)} ${P.L(...shT)}`;
      d += sisaD;
      // Lateral con pinza de busto
      d += ` ${P.C(ahB[0], ahB[1]+30, dartTopF[0], dartTopF[1]-20, ...dartTopF)}`;
      d += ` ${P.L(bustPt.x, bustPt.y)} ${P.L(...dartBotF)}`;
      d += ` ${P.C(dartBotF[0], dartBotF[1]+20, s+wW+2, s+FL-10, s+wW, s+FL)}`;
      d += ` ${P.C(s+wW-5, s+FL+20, s+hW-8, s+FL+HD-20, s+hW, s+FL+HD)}`;
      d += ` ${P.L(s+hW, s+TL)} ${P.H(s)} Z`;

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));

      // Línea cintura
      g.appendChild(U.el('line', { x1:n(s), y1:n(s+FL), x2:n(s+hW), y2:n(s+FL), stroke:C.seamLine, 'stroke-width':'0.4', 'stroke-dasharray':'6,3' }));
      // Línea cadera
      g.appendChild(U.el('line', { x1:n(s), y1:n(s+FL+HD), x2:n(s+hW), y2:n(s+FL+HD), stroke:C.seamLine, 'stroke-width':'0.3', 'stroke-dasharray':'5,3' }));

      // Pinza busto
      g.appendChild(U.el('line', { x1:n(dartTopF[0]), y1:n(dartTopF[1]), x2:n(bustPt.x), y2:n(bustPt.y), stroke:C.dartLine, 'stroke-width':'0.5', 'stroke-dasharray':'4,2' }));
      g.appendChild(U.el('line', { x1:n(bustPt.x), y1:n(bustPt.y), x2:n(dartBotF[0]), y2:n(dartBotF[1]), stroke:C.dartLine, 'stroke-width':'0.5', 'stroke-dasharray':'4,2' }));
      g.appendChild(U.el('circle', { cx:n(bustPt.x), cy:n(bustPt.y), r:'2', fill:'none', stroke:C.dartLine, 'stroke-width':'0.4' }));

      // Pinza cintura frente
      g.appendChild(U.el('polygon', {
        points:`${n(dartFX-dw_w)},${n(dartTopFW)} ${n(dartFX)},${n(dartBotFW)} ${n(dartFX+dw_w)},${n(dartTopFW)}`,
        fill:C.fill, stroke:C.dartLine, 'stroke-width':'0.5', 'stroke-dasharray':'3,2'
      }));

      g.appendChild(U.foldLine(s, s+neckD_f, s, s+TL, 'CF DOBLAR'));
      g.appendChild(U.grainLine(s+bW*0.5, s+adepth+20, TL-adepth-40));
      g.appendChild(U.notch(ahM[0], ahM[1], 90, 3));
      g.appendChild(U.notch(dartTopF[0], dartTopF[1], 0, 3));
      g.appendChild(U.notch(dartBotF[0], dartBotF[1], 0, 3));
      g.appendChild(U.notch(s+wW, s+FL, 0, 3));

      g.appendChild(U.pieceLabel(s+10, s+adepth+50, 'FRENTE — VESTIDO', [
        '1 pieza (doble tela)', 'Cuello V',
        `Pinza busto: ${Math.round(dw_bust*2/10*10)/10}cm`,
        `Pinza cintura: ${Math.round(dartFront/10*10)/10}cm`,
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+Math.max(bW,hW)+s,h:s+TL+s}, name:'Frente' });
    }

    return pieces;
  }

  return { generate };
})();
