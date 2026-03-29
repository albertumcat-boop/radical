/**
 * patterns/camisa.js
 * Camisa para caballero y dama con cuello camisero y puños.
 *
 * Piezas:
 *  1. Espalda (½, doblar en tela) con canesú
 *  2. Frente (pieza completa con botonadura)
 *  3. Canesú (½, doblar en tela)
 *  4. Cuello (2 piezas: pala y vista)
 *  5. Pie de cuello (banda)
 *  6. Manga (con abertura)
 *  7. Puño
 */

'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.Camisa = (function() {
  const U = PAT.SVGUtils;
  const P = U.P;
  const C = PAT.COLORS;
  const NS = U.NS;

  function generate(m, seam, gender = 'dama') {
    const s = seam;
    const ease = m.ease * 10;
    const pieces = [];
    const isLady = gender === 'dama';

    const B  = m.bust * 10, W = m.waist * 10, H = m.hip * 10;
    const Sh = m.shoulder * 10, BL = m.backLength * 10, FL = m.frontLength * 10;
    const TL = m.totalLength * 10, HD = m.hipDepth * 10;
    const SL = m.sleeveLength * 10, WR = m.wrist * 10;
    const NK = m.neck * 10;  // perímetro de cuello

    const bW = (B + ease + 30) / 4;  // camisa: más facilidad que blusa
    const wW = (W + ease + 20) / 4;
    const hW = (H + ease + 20) / 4;

    const neckW   = B / 12 + 5;
    const neckD_b = 25;
    const neckD_f = isLady ? FL * 0.12 + 20 : 30;
    const shLen   = Sh / 2 - neckW;
    const shSlope = isLady ? 15 : 18;
    const adepth  = B * 0.14 + 50;

    const canesuH = 80;    // canesú: 8cm de alto
    const botonW  = 20;    // ancho de botonadura: 2cm

    // ─── HELPER: Espalda completa (reutilizable) ──────────────────────
    function buildBodyPath(frontFlag) {
      const nkC  = frontFlag ? [s, s+neckD_f] : [s, s+neckD_b];
      const nkS  = [s+neckW, s];
      const shT  = [s+neckW+shLen, s+shSlope];
      const ahB  = [s+bW, s+adepth];
      const ahMX = shT[0]+(ahB[0]-shT[0])*0.7;
      const ahMY = shT[1]+(ahB[1]-shT[1])*0.45;
      const ahM  = [ahMX, ahMY];

      let d = P.M(...nkC);
      if (frontFlag) {
        d += ` ${P.Q(s+neckW*0.2, s+neckD_f*0.8, ...nkS)}`;
      } else {
        d += ` ${P.Q(s+neckW*0.1, s, ...nkS)}`;
      }
      d += ` ${P.L(...shT)}`;
      d += ` ${P.C(shT[0]+5, shT[1]+(ahM[1]-shT[1])*0.4, ahM[0]+10, ahM[1]-15, ...ahM)}`;
      d += ` ${P.C(ahM[0]+8, ahM[1]+15, ahB[0]+5, ahB[1]-20, ...ahB)}`;

      if (isLady) {
        d += ` ${P.C(ahB[0], ahB[1]+(BL-adepth)*0.5, wW+s+5, s+BL-20, s+wW, s+BL)}`;
        d += ` ${P.C(wW+s-5, s+BL+20, hW+s-8, s+BL+HD-20, s+hW, s+BL+HD)}`;
      } else {
        d += ` ${P.L(s+bW, s+TL)}`;  // caballero: recto
      }
      d += ` ${P.L(s+Math.max(bW,hW), s+TL)} ${P.L(s, s+TL)} Z`;
      return { d, ahM, ahB, nkC, nkS, shT };
    }

    // ═══════════════════ ESPALDA ═══════════════════════════════════════
    {
      const { d, ahM, nkC } = buildBodyPath(false);
      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8' }));

      // Línea de canesú (8cm desde hombros)
      g.appendChild(U.el('line', {
        x1:n(s), y1:n(s+neckD_b+canesuH),
        x2:n(s+bW), y2:n(s+neckD_b+canesuH),
        stroke:C.seamLine, 'stroke-width':'0.5', 'stroke-dasharray':'6,3'
      }));
      const canesuLabel = U.el('text', {
        x:n(s+bW*0.5), y:n(s+neckD_b+canesuH-5),
        'font-size':'3', fill:C.seamLine, 'text-anchor':'middle', 'font-family':'Arial'
      });
      canesuLabel.textContent = '── línea de canesú ──';
      g.appendChild(canesuLabel);

      g.appendChild(U.foldLine(s, s+neckD_b, s, s+TL));
      g.appendChild(U.grainLine(s+bW*0.5, s+adepth+20, TL-adepth-40));
      g.appendChild(U.notch(ahM[0], ahM[1], 90, 3));
      g.appendChild(U.pieceLabel(s+10, s+adepth+50, `ESPALDA — CAMISA ${isLady?'DAMA':'CABALLERO'}`, [
        '1 pieza (doble tela)', `Busto/Pecho: ${m.bust}cm`
      ]));
      pieces.push({ group:g, bounds:{x:0,y:0,w:s+Math.max(bW,hW)+s,h:s+TL+s}, name:'Espalda' });
    }

    // ═══════════════════ FRENTE (con botonadura) ══════════════════════
    {
      const bWf = bW + botonW;  // ancho extra por botonadura
      const nkCF = [s+botonW, s+neckD_f];
      const nkSF = [s+botonW+neckW, s];
      const shTF = [s+botonW+neckW+shLen, s+shSlope];
      const ahBF = [s+botonW+bW, s+adepth];
      const ahMXF= shTF[0]+(ahBF[0]-shTF[0])*0.7;
      const ahMYF= shTF[1]+(ahBF[1]-shTF[1])*0.45;
      const ahMF = [ahMXF, ahMYF];

      // El frente es pieza completa (no en doblez), incluye solapamiento de botonadura
      let d = P.M(s, s + neckD_f);
      d += ` ${P.L(s+botonW, s+neckD_f)}`;  // borde de botonadura
      d += ` ${P.Q(s+botonW+neckW*0.2, s+neckD_f*0.8, ...nkSF)}`;
      d += ` ${P.L(...shTF)}`;
      d += ` ${P.C(shTF[0]+5, shTF[1]+(ahMF[1]-shTF[1])*0.4, ahMF[0]+10, ahMF[1]-15, ...ahMF)}`;
      d += ` ${P.C(ahMF[0]+8, ahMF[1]+15, ahBF[0]+5, ahBF[1]-20, ...ahBF)}`;
      if (isLady) {
        d += ` ${P.C(ahBF[0], ahBF[1]+(FL-adepth)*0.5, s+botonW+wW+5, s+FL-20, s+botonW+wW, s+FL)}`;
        d += ` ${P.C(s+botonW+wW-5, s+FL+20, s+botonW+hW-8, s+FL+HD-20, s+botonW+hW, s+FL+HD)}`;
        d += ` ${P.L(s+botonW+Math.max(bW,hW), s+TL)}`;
      } else {
        d += ` ${P.L(s+botonW+bW, s+TL)}`;
      }
      d += ` ${P.L(s, s+TL)} Z`;

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8' }));

      // Línea de centro frente (botonadura)
      g.appendChild(U.el('line', {
        x1:n(s+botonW), y1:n(s+neckD_f), x2:n(s+botonW), y2:n(s+TL),
        stroke:C.seamLine, 'stroke-width':'0.5', 'stroke-dasharray':'6,3'
      }));

      // Botones indicativos (cada 8cm desde neckD hacia abajo)
      for (let by = s+neckD_f+40; by < s+TL-30; by += 80) {
        g.appendChild(U.el('circle', {
          cx:n(s+botonW/2), cy:n(by), r:'4',
          fill:'none', stroke:C.dimLine, 'stroke-width':'0.4', 'stroke-dasharray':'2,2'
        }));
      }

      g.appendChild(U.grainLine(s+botonW+bW*0.5, s+adepth+20, TL-adepth-40));
      g.appendChild(U.notch(ahMF[0], ahMF[1], 90, 3));
      g.appendChild(U.pieceLabel(s+botonW+10, s+adepth+50, `FRENTE — CAMISA`, [
        '2 piezas (no en doblez)', `Incluye 2cm botonadura`
      ]));
      pieces.push({ group:g, bounds:{x:0,y:0,w:s+botonW+Math.max(bW,hW)+s,h:s+TL+s}, name:'Frente' });
    }

    // ═══════════════════ CANESÚ ════════════════════════════════════════
    {
      const cW = bW + 5;
      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('rect', { x:n(s), y:n(s), width:n(cW), height:n(canesuH+neckD_b), fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8' }));
      g.appendChild(U.foldLine(s, s, s, s+canesuH+neckD_b, 'DOBLAR'));
      g.appendChild(U.grainLine(s+cW*0.5, s+10, canesuH+neckD_b-20));
      g.appendChild(U.pieceLabel(s+8, s+30, 'CANESÚ', ['2 piezas (doble tela)', `Largo hombro: ${m.shoulder}cm`]));
      pieces.push({ group:g, bounds:{x:0,y:0,w:s+cW+s,h:s+canesuH+neckD_b+s}, name:'Canesú' });
    }

    // ═══════════════════ CUELLO CAMISERO ══════════════════════════════
    // Cuello: pala (2 piezas) + pie de cuello/banda
    {
      const collarLen  = NK / 2 + 15;   // longitud media cuello + solapamiento
      const collarH    = 40;             // 4cm alto pala de cuello
      const bandH      = 35;             // 3.5cm alto pie de cuello
      const collarTip  = 25;             // 2.5cm punta del cuello (vuelo)

      // ── Pala de cuello ────────────────────────────────────────────
      {
        const g = document.createElementNS(NS, 'g');
        // Forma del cuello: rectangular base con punta en extremo
        const pts = [
          [s, s],
          [s + collarLen, s],
          [s + collarLen + collarTip, s + collarH / 2],  // punta
          [s + collarLen, s + collarH],
          [s, s + collarH],
        ];
        let d = P.M(...pts[0]);
        pts.slice(1).forEach(pt => { d += ` ${P.L(...pt)}`; });
        d += ' Z';

        g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8' }));
        g.appendChild(U.foldLine(s, s+collarH/2, s+collarLen, s+collarH/2, 'DOBLAR'));
        g.appendChild(U.grainLine(s+collarLen*0.5, s+8, collarH-16));

        // Muesca de CF (centro frente)
        g.appendChild(U.notch(s+collarLen, s, 0, 3));
        g.appendChild(U.notch(s, s, 0, 3));

        g.appendChild(U.pieceLabel(s+10, s+collarH+10, 'PALA DE CUELLO', [
          '4 piezas (2 externas + 2 entretela)',
          `Cuello: ${m.neck}cm`,
        ]));
        pieces.push({ group:g, bounds:{x:0,y:0,w:s+collarLen+collarTip+s,h:s+collarH+s+20}, name:'Cuello' });
      }

      // ── Pie de cuello (banda) ─────────────────────────────────────
      {
        const g = document.createElementNS(NS, 'g');
        // La banda tiene curva en la base (para adaptarse al cuello)
        const bandLen = NK / 2 + 10;
        const curveDrop = 8;  // curvatura de la base: 8mm
        let d = P.M(s, s + curveDrop);
        // Base curva
        d += ` ${P.Q(s + bandLen/2, s, s + bandLen, s + curveDrop)}`;
        // Extremo derecho (recto)
        d += ` ${P.L(s + bandLen, s + bandH + curveDrop)}`;
        // Base inferior (recta)
        d += ` ${P.L(s, s + bandH + curveDrop)}`;
        d += ' Z';

        g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8' }));
        g.appendChild(U.grainLine(s+bandLen*0.5, s+curveDrop+8, bandH-16));
        g.appendChild(U.notch(s+bandLen, s+curveDrop+bandH/2, 0, 3));
        g.appendChild(U.pieceLabel(s+8, s+curveDrop+bandH+12, 'PIE DE CUELLO', [
          '4 piezas (2 externas + 2 entretela)',
        ]));
        pieces.push({ group:g, bounds:{x:0,y:0,w:s+bandLen+s,h:s+bandH+curveDrop+s+20}, name:'Pie Cuello' });
      }
    }

    // ═══════════════════ MANGA CON ABERTURA ═══════════════════════════
    {
      const sleeveCapH   = adepth * 0.45;
      const sleeveTopW   = (bW + neckW + shLen) * 0.88;
      const sleeveWristW = (WR + ease * 0.3 + 20) / 2;  // + 2cm facilidad muñeca

      const capTop   = [s + sleeveTopW / 2, s];
      const capLeft  = [s, s + sleeveCapH];
      const capRight = [s + sleeveTopW, s + sleeveCapH];
      const wristL   = [s + sleeveTopW/2 - sleeveWristW/2, s + SL];
      const wristR   = [s + sleeveTopW/2 + sleeveWristW/2, s + SL];

      const cpLTop = [capLeft[0]+15, capLeft[1]-sleeveCapH*0.5];
      const cpLMid = [capTop[0]-10, capTop[1]+5];
      const cpRMid = [capTop[0]+10, capTop[1]+5];
      const cpRBot = [capRight[0]-15, capRight[1]-sleeveCapH*0.5];

      let d = P.M(...capLeft);
      d += ` ${P.C(...cpLTop, ...cpLMid, ...capTop)}`;
      d += ` ${P.C(...cpRMid, ...cpRBot, ...capRight)}`;
      d += ` ${P.L(...wristR)}`;
      d += ` ${P.L(...wristL)}`;
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8' }));

      // Abertura de manga (placket) — línea en el lateral
      const aberturaX = s + sleeveTopW/2 + sleeveWristW/4;
      const aberturaH = 90;  // 9cm abertura
      g.appendChild(U.el('line', {
        x1:n(aberturaX), y1:n(s+SL-aberturaH),
        x2:n(aberturaX), y2:n(s+SL),
        stroke:C.dimLine, 'stroke-width':'0.5', 'stroke-dasharray':'5,3'
      }));
      const abLabel = U.el('text', {
        x:n(aberturaX+4), y:n(s+SL-aberturaH/2),
        'font-size':'3', fill:C.dimLine, 'font-family':'Arial'
      });
      abLabel.textContent = 'abertura 9cm';
      g.appendChild(abLabel);

      g.appendChild(U.grainLine(s+sleeveTopW/2, s+sleeveCapH+15, SL-sleeveCapH-30));
      const nx = s + sleeveTopW * 0.35, ny = s + sleeveCapH * 0.4;
      g.appendChild(U.notch(nx, ny, 315, 3));
      g.appendChild(U.notch(s+sleeveTopW*0.65, ny, 45, 3));
      g.appendChild(U.notch(s+sleeveTopW*0.5, s+sleeveCapH*0.2, 0, 3));

      g.appendChild(U.pieceLabel(s+10, s+sleeveCapH+40, 'MANGA — CAMISA', [
        '2 piezas iguales', `Largo: ${m.sleeveLength}cm`,
        'Incluye abertura 9cm',
      ]));
      pieces.push({ group:g, bounds:{x:0,y:0,w:s+sleeveTopW+s,h:s+SL+s}, name:'Manga' });
    }

    // ═══════════════════ PUÑO ═════════════════════════════════════════
    {
      const cuffLen = WR + 40;  // muñeca + 4cm solapamiento
      const cuffH   = 60;       // 6cm alto de puño
      const g = document.createElementNS(NS, 'g');

      g.appendChild(U.el('rect', {
        x:n(s), y:n(s), width:n(cuffLen), height:n(cuffH),
        fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8'
      }));
      g.appendChild(U.foldLine(s, s+cuffH/2, s+cuffLen, s+cuffH/2, 'DOBLAR'));

      // Botón de puño
      g.appendChild(U.el('circle', {
        cx:n(s+cuffLen-15), cy:n(s+cuffH/2), r:'5',
        fill:'none', stroke:C.dimLine, 'stroke-width':'0.4', 'stroke-dasharray':'2,1'
      }));

      g.appendChild(U.grainLine(s+cuffLen*0.4, s+8, cuffH-16));
      g.appendChild(U.notch(s, s+cuffH/4, 180, 3));
      g.appendChild(U.notch(s, s+cuffH*3/4, 180, 3));

      g.appendChild(U.pieceLabel(s+8, s+cuffH+12, 'PUÑO', [
        '4 piezas (2 ext. + 2 entretela)',
        `Muñeca: ${m.wrist}cm`,
      ]));
      pieces.push({ group:g, bounds:{x:0,y:0,w:s+cuffLen+s,h:s+cuffH+s+20}, name:'Puño' });
    }

    return pieces;
  }

  return { generate };
})();
