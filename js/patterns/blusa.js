/**
 * patterns/blusa.js
 * Blusa básica con pinzas de busto (corte en hombro y lado).
 *
 * Piezas:
 *  1. Espalda (½, doblar en tela)
 *  2. Frente (½, doblar en tela, con pinza de busto en costado)
 *  3. Manga sencilla
 */

'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.Blusa = (function() {
  const U = PAT.SVGUtils;
  const P = U.P;
  const C = PAT.COLORS;
  const NS = U.NS;

  function generate(m, seam) {
    const s = seam;
    const ease = m.ease * 10;
    const pieces = [];

    // ── Medidas en mm ──────────────────────────────────────────────────
    const B  = m.bust * 10, W = m.waist * 10, H = m.hip * 10;
    const Sh = m.shoulder * 10, BL = m.backLength * 10, FL = m.frontLength * 10;
    const TL = m.totalLength * 10, HD = m.hipDepth * 10;
    const SL = m.sleeveLength * 10, WR = m.wrist * 10;

    const bW = (B + ease) / 4;
    const wW = (W + ease) / 4;
    const hW = (H + ease) / 4;

    const neckW   = B / 12 + 5;
    const neckD_b = 25;
    const neckD_f = FL * 0.12 + 20;
    const shLen   = Sh / 2 - neckW;
    const shSlope = 15;
    const adepth  = B * 0.14 + 50;

    // ── PINZA DE BUSTO ────────────────────────────────────────────────
    // La pinza sale del costado, a nivel del punto de busto.
    // Valor de pinza = diferencia busto-cintura / 4 / 2 (simplificado)
    const bustPoint = { x: s + bW * 0.55, y: s + FL * 0.45 };  // ápice de busto
    const dartWidth   = Math.max(10, (B - W) / 4 * 0.5);        // mm
    const dartLength  = Math.min(80, (B - W) / 4 * 3.5);        // mm desde costado

    // ═════════════════════════════════════════════════════════════════
    // ESPALDA (igual que franela pero con pinza de hombro opcional)
    // ═════════════════════════════════════════════════════════════════
    {
      const nkC = [s, s + neckD_b], nkS = [s + neckW, s];
      const shT = [s + neckW + shLen, s + shSlope];
      const ahB = [s + bW, s + adepth];
      const ahMX = shT[0] + (ahB[0]-shT[0])*0.7, ahMY = shT[1] + (ahB[1]-shT[1])*0.45;
      const ahM  = [ahMX, ahMY];

      let d = P.M(...nkC);
      d += ` ${P.Q(s + neckW * 0.1, s, ...nkS)}`;
      d += ` ${P.L(...shT)}`;
      d += ` ${P.C(shT[0]+5, shT[1]+(ahM[1]-shT[1])*0.4, ahM[0]+10, ahM[1]-15, ...ahM)}`;
      d += ` ${P.C(ahM[0]+8, ahM[1]+15, ahB[0]+5, ahB[1]-20, ...ahB)}`;
      d += ` ${P.C(ahB[0], ahB[1]+(BL-adepth)*0.5, wW+s+5, s+BL-20, s+wW, s+BL)}`;
      d += ` ${P.C(wW+s-5, s+BL+20, hW+s-8, s+BL+HD-20, s+hW, s+BL+HD)}`;
      d += ` ${P.L(s + Math.max(bW,hW), s + TL)} ${P.L(s, s + TL)} Z`;

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));
      g.appendChild(U.foldLine(s, s+neckD_b, s, s+TL));
      g.appendChild(U.grainLine(s + bW*0.5, s + adepth+20, TL-adepth-40));
      g.appendChild(U.notch(ahM[0], ahM[1], 90, 3));
      g.appendChild(U.notch(s+wW, s+BL, 0, 3));
      g.appendChild(U.pieceLabel(s+10, s+adepth+40, 'ESPALDA — BLUSA', ['1 pieza (doble tela)', `Busto ${m.bust}cm`]));
      pieces.push({ group:g, bounds:{x:0,y:0,w:s+Math.max(bW,hW)+s, h:s+TL+s}, name:'Espalda' });
    }

    // ═════════════════════════════════════════════════════════════════
    // FRENTE CON PINZA DE BUSTO EN COSTADO
    // ═════════════════════════════════════════════════════════════════
    {
      // La pinza de busto se abre en el costado:
      // El costado se divide: arriba de la pinza → abajo de la pinza
      const dartY   = s + FL * 0.45;    // nivel de la pinza (altura busto)
      const dartTop = [s + bW + s, dartY - dartWidth / 2];  // extremo sup pinza
      const dartBot = [s + bW + s, dartY + dartWidth / 2];  // extremo inf pinza

      const nkC = [s, s + neckD_f], nkS = [s + neckW, s];
      const shT = [s + neckW + shLen, s + shSlope];
      const ahB = [s + bW, s + adepth];
      const ahMX = shT[0]+(ahB[0]-shT[0])*0.7, ahMY = shT[1]+(ahB[1]-shT[1])*0.45;
      const ahM  = [ahMX, ahMY];

      // La parte superior del costado va de la sisa hasta el extremo top de la pinza
      // La parte inferior va del extremo bot de la pinza hasta el dobladillo

      let d = P.M(...nkC);
      // Cuello frente (curva más pronunciada)
      d += ` ${P.Q(s+neckW*0.2, s+neckD_f*0.8, ...nkS)}`;
      d += ` ${P.L(...shT)}`;
      d += ` ${P.C(shT[0]+5, shT[1]+(ahM[1]-shT[1])*0.4, ahM[0]+10, ahM[1]-15, ...ahM)}`;
      d += ` ${P.C(ahM[0]+8, ahM[1]+15, ahB[0]+5, ahB[1]-20, ...ahB)}`;
      // Lateral: sisa → top pinza
      d += ` ${P.C(ahB[0], ahB[1]+30, dartTop[0], dartTop[1]-20, ...dartTop)}`;
      // Pinza: top → vértice (ápice de busto) → bot
      d += ` ${P.L(bustPoint.x, bustPoint.y)}`;
      d += ` ${P.L(...dartBot)}`;
      // Lateral: bot pinza → cadera → hem
      d += ` ${P.C(dartBot[0], dartBot[1]+20, s+wW+2, s+FL-10, s+wW, s+FL)}`;
      d += ` ${P.C(s+wW-5, s+FL+20, s+hW-8, s+FL+HD-20, s+hW, s+FL+HD)}`;
      d += ` ${P.L(s+Math.max(bW,hW), s+TL)} ${P.L(s, s+TL)} Z`;

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));

      // Líneas de pinza (en amarillo)
      g.appendChild(U.el('line', {
        x1:n(dartTop[0]), y1:n(dartTop[1]), x2:n(bustPoint.x), y2:n(bustPoint.y),
        stroke:C.dartLine, 'stroke-width':'0.5', 'stroke-dasharray':'4,2'
      }));
      g.appendChild(U.el('line', {
        x1:n(bustPoint.x), y1:n(bustPoint.y), x2:n(dartBot[0]), y2:n(dartBot[1]),
        stroke:C.dartLine, 'stroke-width':'0.5', 'stroke-dasharray':'4,2'
      }));
      // Etiqueta pinza
      const pinzaLabel = U.el('text', {
        x:n(bustPoint.x + 12), y:n(bustPoint.y),
        'font-size':'3', fill:C.dartLine, 'font-family':'Arial'
      });
      pinzaLabel.textContent = `PINZA BUSTO ${Math.round(dartWidth/10*10)/10}cm`;
      g.appendChild(pinzaLabel);

      // Círculo ápice de busto
      g.appendChild(U.el('circle', {
        cx:n(bustPoint.x), cy:n(bustPoint.y), r:'2',
        fill:'none', stroke:C.dartLine, 'stroke-width':'0.4'
      }));

      g.appendChild(U.foldLine(s, s+neckD_f, s, s+TL));
      g.appendChild(U.grainLine(s+bW*0.5, s+adepth+20, TL-adepth-40));
      g.appendChild(U.notch(ahM[0], ahM[1], 90, 3));
      g.appendChild(U.notch(dartTop[0], dartTop[1], 0, 3));
      g.appendChild(U.notch(dartBot[0], dartBot[1], 0, 3));
      g.appendChild(U.pieceLabel(s+10, s+adepth+50, 'FRENTE — BLUSA', [
        '1 pieza (doble tela)', `Busto ${m.bust}cm`,
        `Pinza costado: ${Math.round(dartWidth/10*10)/10}cm`,
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+Math.max(bW,hW)+s+20, h:s+TL+s}, name:'Frente' });
    }

    // ═════════════════════════════════════════════════════════════════
    // MANGA BÁSICA
    // ═════════════════════════════════════════════════════════════════
    {
      // La manga: trapezoide con cabeza de manga curva
      // Ancho en cabeza = circunferencia sisa / 2.8 aproximado
      const sleeveCapH   = adepth * 0.45;  // altura de la cabeza de manga
      const sleeveTopW   = (bW + neckW + shLen) * 0.85; // ancho máximo cabeza
      const sleeveWristW = (WR + ease * 0.5) / 2;       // ancho muñeca (½ pieza)

      // Puntos
      const capTop    = [s + sleeveTopW / 2, s];                // pico de cabeza
      const capLeft   = [s, s + sleeveCapH];                    // extremo izq sisa
      const capRight  = [s + sleeveTopW, s + sleeveCapH];       // extremo der sisa
      const wristLeft = [s + sleeveTopW/2 - sleeveWristW/2, s + SL];
      const wristRight= [s + sleeveTopW/2 + sleeveWristW/2, s + SL];

      // Curva cabeza de manga (bezier suave)
      const cpLTop  = [capLeft[0]+15,  capLeft[1]-sleeveCapH*0.5];
      const cpLMid  = [capTop[0]-10,   capTop[1]+5];
      const cpRMid  = [capTop[0]+10,   capTop[1]+5];
      const cpRBot  = [capRight[0]-15, capRight[1]-sleeveCapH*0.5];

      let d = P.M(...capLeft);
      d += ` ${P.C(...cpLTop, ...cpLMid, ...capTop)}`;
      d += ` ${P.C(...cpRMid, ...cpRBot, ...capRight)}`;
      d += ` ${P.L(...wristRight)}`;
      d += ` ${P.L(...wristLeft)}`;
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));
      g.appendChild(U.grainLine(s+sleeveTopW/2, s+sleeveCapH+15, SL-sleeveCapH-30));

      // Muescas de unión sisa
      const notchX = s + sleeveTopW * 0.35;
      const notchY = s + sleeveCapH * 0.4;
      g.appendChild(U.notch(notchX, notchY, 315, 3));
      const notchX2 = s + sleeveTopW * 0.65;
      g.appendChild(U.notch(notchX2, notchY, 45, 3));

      g.appendChild(U.pieceLabel(s+10, s+sleeveCapH+30, 'MANGA — BLUSA', [
        '2 piezas iguales', `Largo: ${m.sleeveLength}cm`,
        `Muñeca: ${m.wrist}cm`,
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+sleeveTopW+s, h:s+SL+s}, name:'Manga' });
    }

    return pieces;
  }

  return { generate };
})();
