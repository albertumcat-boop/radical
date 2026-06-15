/**
 * patterns/falda-lapiz.js
 * Falda lápiz entallada (pencil skirt) — sin facilidad en cadera, con tajo trasero.
 *
 * Piezas:
 *  1. Delantera (½ pieza, doblar en tela) — entallada con pinza de cintura
 *  2. Trasera  (½ pieza) — con tajo en el dobladillo y 2 pinzas en cintura
 *  3. Pretina  — tira recta con cierre lateral marcado
 */

'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.FaldaLapiz = (function() {
  const U = PAT.SVGUtils;
  const P = U.P;
  const C = PAT.COLORS;
  const NS = U.NS;
  const n = U.n;

  function generate(m, seam) {
    const s = seam;
    // Falda lápiz: ease mínimo (2cm total para no quedar rígida, distribuido en cadera)
    const ease = 20;  // 2cm en mm — entallada (sin facilidad real)
    const pieces = [];

    const W  = m.waist      * 10;
    const H  = m.hip        * 10;
    const HD = m.hipDepth   * 10;   // talle → cadera
    const SL = (m.skirtLength || 60) * 10;  // largo falda (default 60cm)

    // ── Anchos de pieza (¼ del perímetro, piezas en ½) ─────────────────
    // Cintura: sin pinza en la pieza — la diferencia la absorben las pinzas
    const wDel  = W / 4 + 10;           // ¼ cintura + 1cm para pinza delantera
    const wTras = W / 4 + 20;           // ¼ cintura + 2cm para pinzas traseras
    const hDel  = (H + ease) / 4;       // ¼ cadera con mínimo ease
    const hTras = (H + ease) / 4;

    // ── Diferencia cintura→cadera (para moldear el lateral) ─────────────
    const diffDel  = hDel - (W / 4);   // diferencia en delantera
    const diffTras = hTras - (W / 4);  // diferencia en trasera

    // ── Pinzas ──────────────────────────────────────────────────────────
    // Delantera: 1 pinza de 1cm ancho × 8cm largo
    const dartFrontW  = 10;   // 1cm en mm
    const dartFrontL  = 80;   // 8cm en mm

    // Trasera: 2 pinzas de 1.5cm ancho × 10cm largo
    const dartBackW   = 15;   // 1.5cm en mm
    const dartBackL   = 100;  // 10cm en mm

    // Tajo trasero: 15–20cm desde el dobladillo
    const tajoLen = 170;   // 17cm en mm

    // Caída natural de cintura (curva de cintura)
    const wDropCB_f = 5;    // 0.5cm caída en CF (delantera)
    const wDropSide_f = 18; // 1.8cm caída en costado delantera
    const wDropCB_b = 3;    // 0.3cm caída en CB (trasera)
    const wDropSide_b = 15; // 1.5cm caída en costado trasera

    // ═══════════════════ DELANTERA ══════════════════════════════════════
    {
      // Puntos estructurales
      const A  = [s, s + wDropCB_f];                     // CF cintura (doblez)
      const B  = [s + hDel, s + wDropSide_f];            // costado cintura
      const D  = [s + hDel, s + HD];                     // costado cadera
      // Falda lápiz: el dobladillo se estrecha ligeramente respecto a la cadera
      const hemNarrow = 5;  // 0.5cm más estrecho en dobladillo (efecto lápiz)
      const E  = [s + hDel - hemNarrow, s + SL];         // costado dobladillo
      const F  = [s, s + SL];                             // CF dobladillo

      // Pinza delantera: centrada en la pieza
      const dartX    = s + hDel * 0.45;
      const dartTopY = s + wDropCB_f + (wDropSide_f - wDropCB_f) * 0.45;
      const dartBotY = dartTopY + dartFrontL;
      const dw       = dartFrontW / 2;

      let d = P.M(...A);
      // Cintura: CF → borde izq pinza (con ligera curva)
      d += ` ${P.Q(s + hDel * 0.1, s + wDropCB_f * 0.7, dartX - dw, dartTopY)}`;
      // Pinza (V)
      d += ` ${P.L(dartX, dartBotY)}`;
      d += ` ${P.L(dartX + dw, dartTopY)}`;
      // Cintura: borde der pinza → costado
      d += ` ${P.Q(s + hDel * 0.82, s + wDropSide_f * 0.5, ...B)}`;
      // Lateral: costado cintura → cadera → dobladillo (ligeramente entallado)
      d += ` ${P.L(...D)}`;
      d += ` ${P.L(...E)}`;
      // Dobladillo → CF
      d += ` ${P.H(s)}`;
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));

      // Línea de cadera (auxiliar)
      g.appendChild(U.el('line', {
        x1:n(s), y1:n(s+HD), x2:n(s+hDel), y2:n(s+HD),
        stroke:C.seamLine, 'stroke-width':'0.3', 'stroke-dasharray':'5,3'
      }));
      const hipLbl = U.el('text', { x:n(s+hDel+3), y:n(s+HD+2), 'font-size':'3', fill:C.seamLine, 'font-family':'Arial' });
      hipLbl.textContent = 'nivel cadera';
      g.appendChild(hipLbl);

      // Pinza (líneas de referencia)
      g.appendChild(U.el('line', {
        x1:n(dartX), y1:n(dartTopY), x2:n(dartX), y2:n(dartBotY),
        stroke:C.dartLine, 'stroke-width':'0.4', 'stroke-dasharray':'3,2'
      }));
      const dartLbl = U.el('text', { x:n(dartX+3), y:n(dartTopY + dartFrontL * 0.5), 'font-size':'3', fill:C.dartLine, 'font-family':'Arial' });
      dartLbl.textContent = `pinza ${dartFrontW / 10}cm`;
      g.appendChild(dartLbl);

      // Cierre lateral (línea de puntos morada — cremallera/cierre)
      const zipLen = 180;  // 18cm
      g.appendChild(U.el('line', {
        x1:n(s+hDel), y1:n(s+wDropSide_f), x2:n(s+hDel), y2:n(s+wDropSide_f+zipLen),
        stroke:C.dimLine, 'stroke-width':'0.6', 'stroke-dasharray':'4,3'
      }));
      const zipLbl = U.el('text', {
        x:n(s+hDel+6), y:n(s+wDropSide_f+zipLen/2), 'font-size':'3',
        fill:C.dimLine, 'font-family':'Arial', 'text-anchor':'middle',
        transform:`rotate(90, ${n(s+hDel+6)}, ${n(s+wDropSide_f+zipLen/2)})`
      });
      zipLbl.textContent = 'cierre lateral 18cm';
      g.appendChild(zipLbl);

      g.appendChild(U.foldLine(s, s+wDropCB_f, s, s+SL, 'CF DOBLAR'));
      g.appendChild(U.grainLine(s+hDel*0.5, s+HD+20, SL-HD-40));

      // Muescas
      g.appendChild(U.notch(B[0], B[1], 0, 3));           // costado cintura
      g.appendChild(U.notch(s+hDel, s+HD, 0, 3));          // costado cadera
      g.appendChild(U.notch(s, s+HD, 180, 3));              // CF cadera

      g.appendChild(U.pieceLabel(s+8, s+HD+30, 'DELANTERA — FALDA LÁPIZ', [
        '1 pieza (doble tela — doblar en CF)',
        `Cintura: ${m.waist}cm · Cadera: ${m.hip}cm`,
        `Largo: ${m.skirtLength || 60}cm`,
        `Pinza: ${dartFrontW/10}cm × ${dartFrontL/10}cm`,
        'Cierre lateral (cremallera 18cm)',
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+hDel+s+20,h:s+SL+s}, name:'Delantera' });
    }

    // ═══════════════════ TRASERA ════════════════════════════════════════
    {
      const A_b = [s, s + wDropCB_b];
      const B_b = [s + hTras, s + wDropSide_b];
      const D_b = [s + hTras, s + HD];
      // Dobladillo trasero también estrecho (efecto lápiz)
      const hemNarrow_b = 5;
      const E_b = [s + hTras - hemNarrow_b, s + SL];
      const F_b = [s, s + SL];

      // 2 pinzas en trasera
      const dart1X   = s + hTras * 0.28;
      const dart2X   = s + hTras * 0.62;
      const dartTopY_b = s + wDropCB_b + (wDropSide_b - wDropCB_b) * 0.3;
      const dartBotY_b = dartTopY_b + dartBackL;
      const dw_b      = dartBackW / 2;

      let d = P.M(...A_b);
      // Cintura: CB → izq pinza1
      d += ` ${P.Q(s + hTras*0.08, s + wDropCB_b*0.5, dart1X - dw_b, dartTopY_b)}`;
      d += ` ${P.L(dart1X, dartBotY_b)} ${P.L(dart1X + dw_b, dartTopY_b)}`;
      // Entre pinzas
      d += ` ${P.Q(s + hTras*0.45, s + dartTopY_b - s - 2, dart2X - dw_b, dartTopY_b)}`;
      d += ` ${P.L(dart2X, dartBotY_b)} ${P.L(dart2X + dw_b, dartTopY_b)}`;
      // Hacia costado
      d += ` ${P.Q(s + hTras*0.82, s + wDropSide_b*0.5, ...B_b)}`;
      d += ` ${P.L(...D_b)} ${P.L(...E_b)}`;
      // Tajo: desde dobladillo hacia arriba en el CB
      // La trasera NO cierra el CB abajo del tajo — se deja abierto
      d += ` ${P.L(s + hemNarrow_b, s + SL)}`; // dobladillo trasero (parcial)
      d += ` ${P.L(s, s + SL - tajoLen)}`;        // subir por CB hasta fin del tajo
      d += ` ${P.L(s, s + SL - tajoLen)}`;        // punto superior del tajo
      // CB arriba del tajo (hacia cintura)
      d += ` ${P.L(...A_b)}`;
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));

      // Línea cadera
      g.appendChild(U.el('line', {
        x1:n(s), y1:n(s+HD), x2:n(s+hTras), y2:n(s+HD),
        stroke:C.seamLine, 'stroke-width':'0.3', 'stroke-dasharray':'5,3'
      }));

      // 2 Pinzas (líneas de referencia)
      [dart1X, dart2X].forEach(dx => {
        g.appendChild(U.el('line', {
          x1:n(dx), y1:n(dartTopY_b), x2:n(dx), y2:n(dartBotY_b),
          stroke:C.dartLine, 'stroke-width':'0.4', 'stroke-dasharray':'3,2'
        }));
      });
      const dLbl = U.el('text', { x:n(dart1X+3), y:n(dartTopY_b + dartBackL*0.5), 'font-size':'3', fill:C.dartLine, 'font-family':'Arial' });
      dLbl.textContent = `2 pinzas ${dartBackW/10}cm × ${dartBackL/10}cm`;
      g.appendChild(dLbl);

      // Tajo en dobladillo CB — línea discontinua especial
      g.appendChild(U.el('line', {
        x1:n(s), y1:n(s+SL-tajoLen), x2:n(s), y2:n(s+SL),
        stroke:C.dimLine, 'stroke-width':'0.8', 'stroke-dasharray':'6,3'
      }));
      const tajoLbl = U.el('text', {
        x:n(s-8), y:n(s+SL-tajoLen/2), 'font-size':'3',
        fill:C.dimLine, 'font-family':'Arial', 'text-anchor':'middle',
        transform:`rotate(-90, ${n(s-8)}, ${n(s+SL-tajoLen/2)})`
      });
      tajoLbl.textContent = `← tajo ${tajoLen/10}cm`;
      g.appendChild(tajoLbl);
      // Marcador de inicio del tajo (muesca doble)
      g.appendChild(U.notch(s, s+SL-tajoLen, 180, 4));

      // Cierre lateral (misma posición que delantera, para emparejar)
      const zipLen_b = 180;
      g.appendChild(U.el('line', {
        x1:n(s+hTras), y1:n(s+wDropSide_b), x2:n(s+hTras), y2:n(s+wDropSide_b+zipLen_b),
        stroke:C.dimLine, 'stroke-width':'0.6', 'stroke-dasharray':'4,3'
      }));

      // Sin línea de doblez — la trasera es pieza entera (se corta en CB)
      g.appendChild(U.grainLine(s+hTras*0.5, s+HD+20, SL-HD-50));

      // Muescas
      g.appendChild(U.notch(B_b[0], B_b[1], 0, 3));        // costado cintura
      g.appendChild(U.notch(s+hTras, s+HD, 0, 3));           // costado cadera
      g.appendChild(U.notch(s, s+wDropCB_b+50, 180, 3));     // CB 5cm bajo cintura (ref)

      g.appendChild(U.pieceLabel(s+8, s+HD+30, 'TRASERA — FALDA LÁPIZ', [
        '2 piezas (espejo)',
        `Cintura: ${m.waist}cm · Cadera: ${m.hip}cm`,
        `Largo: ${m.skirtLength || 60}cm`,
        `2 pinzas: ${dartBackW/10}cm × ${dartBackL/10}cm c/u`,
        `Tajo CB: ${tajoLen/10}cm desde dobladillo`,
        'Cierre lateral (cremallera 18cm)',
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+hTras+s+20,h:s+SL+s}, name:'Trasera' });
    }

    // ═══════════════════ PRETINA ════════════════════════════════════════
    {
      // Media cintura + solapamiento 3cm (para cierre lateral)
      const wbLen = W / 2 + 30;
      const wbH   = 40;   // 4cm alto (dobla a 2cm)

      const g = document.createElementNS(NS, 'g');

      g.appendChild(U.el('rect', {
        x:n(s), y:n(s), width:n(wbLen), height:n(wbH),
        fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8'
      }));

      // Línea de doblez (a la mitad de la altura)
      g.appendChild(U.foldLine(s, s+wbH/2, s+wbLen, s+wbH/2));

      // Marca de cierre (extremo derecho — costado con cremallera)
      g.appendChild(U.el('line', {
        x1:n(s+wbLen-30), y1:n(s), x2:n(s+wbLen-30), y2:n(s+wbH),
        stroke:C.dimLine, 'stroke-width':'0.5', 'stroke-dasharray':'3,2'
      }));
      const closeLbl = U.el('text', { x:n(s+wbLen-28), y:n(s+wbH/2+1), 'font-size':'2.5', fill:C.dimLine, 'font-family':'Arial' });
      closeLbl.textContent = 'solapamiento 3cm';
      g.appendChild(closeLbl);

      g.appendChild(U.grainLine(s+wbLen*0.5, s+8, wbH-16));

      g.appendChild(U.pieceLabel(s+8, s+wbH+14, 'PRETINA — FALDA LÁPIZ', [
        '2 piezas (entretela en 1)',
        `Cintura: ${m.waist}cm · Solapamiento: 3cm`,
        'Cierre lateral',
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+wbLen+s,h:s+wbH+s+25}, name:'Pretina' });
    }

    return pieces;
  }

  return { generate };
})();
