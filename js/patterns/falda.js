/**
 * patterns/falda.js
 * Falda recta con pinzas en cintura.
 *
 * Piezas:
 *  1. Frente (½, doblar en tela)
 *  2. Espalda (½, doblar en tela, abertura en CB o costado)
 */

'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.Falda = (function() {
  const U = PAT.SVGUtils;
  const P = U.P;
  const C = PAT.COLORS;
  const NS = U.NS;

  function generate(m, seam) {
    const s = seam;
    const ease = m.ease * 10;
    const pieces = [];

    const W  = m.waist * 10;
    const H  = m.hip   * 10;
    const HD = m.hipDepth * 10;   // profundidad cadera (cintura → cadera)
    const SL = m.skirtLength * 10;  // largo falda

    // Medidas de pieza (¼ del perímetro por pieza, ya que son 2 mitades)
    const wW = (W + ease * 0.5) / 4;   // ¼ cintura (por pieza ½)
    const hW = (H + ease) / 4;         // ¼ cadera
    const diff = hW - wW;               // diferencia cintura-cadera (para pinzas)

    // ── Distribución de pinzas ────────────────────────────────────────
    // Frente: 40% de la diferencia en 1 pinza
    // Espalda: 60% de la diferencia en 2 pinzas (o 1 grande)
    const dartFront = diff * 0.4;
    const dartBack  = diff * 0.6;

    const dartLenF = 80;   // 8cm largo pinza frente
    const dartLenB = 120;  // 12cm largo pinza espalda

    // ═══════════════════ FRENTE ══════════════════════════════════════
    {
      // La cintura está "recortada" por la pinza:
      // El ancho total de la pieza en cintura = hW (cadera)
      // La cintura visible = wW
      // La diferencia (dartFront) se elimina con la pinza

      // Puntos sin margen (se incluye seam al construir)
      const TL_cm = s, TR_cm = s + hW;       // cintura (se moldea con pinza)
      const HL    = s, HR = s + hW;           // cadera
      const hemL  = s, hemR = s + hW;         // dobladillo

      // Caída lateral: la falda tiene la misma anchura de cadera a dobladillo
      // con ligera reducción en cintura → resuelta por la pinza

      // Forma exterior de la pieza (incluyendo la cintura inclinada)
      // La cintura real tiene curva: baja ~2cm del CB al costado
      const waisDropCB   = 5;   // 0.5cm caída en CB
      const waistDropSide= 20;  // 2cm caída en costado (curvatura natural de cintura)

      const A = [s, s + waisDropCB];               // CB cintura
      const B_pt = [s + hW, s + waistDropSide];    // costado cintura
      const D = [s + hW, s + HD];                  // costado cadera
      const E = [s + hW, s + SL];                  // costado dobladillo
      const F = [s, s + SL];                        // CB dobladillo

      // Pinza: centrada en la pieza, en eje x
      const dartX      = s + hW * 0.45;            // posición X de la pinza
      const dartTopY   = s + waisDropCB + (waistDropSide - waisDropCB) * 0.45;  // nivel cintura
      const dartBotY   = dartTopY + dartLenF;       // punta de pinza
      const dartWidth2 = dartFront / 2;             // semiancho

      // Cintura curva (QB entre A y B_pt)
      let d = P.M(...A);
      // El tramo de A a la izquierda de la pinza
      d += ` ${P.Q(s + hW*0.1, s + waisDropCB*0.8, s + dartX - s - dartWidth2, s + dartTopY)}`;
      // La pinza se "cierra" en la costura → se dibuja como V
      d += ` ${P.L(dartX - dartWidth2, dartTopY)}`;  // borde izq pinza (en cintura)
      d += ` ${P.L(dartX, dartBotY)}`;               // punta pinza
      d += ` ${P.L(dartX + dartWidth2, dartTopY)}`;  // borde der pinza (en cintura)
      // Continuación cintura hacia costado
      d += ` ${P.Q(s + hW*0.85, s + waistDropSide*0.5, ...B_pt)}`;
      // Costado (recto para falda recta)
      d += ` ${P.L(...D)}`;
      d += ` ${P.L(...E)}`;
      d += ` ${P.H(s)}`;   // dobladillo
      d += ' Z';

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));

      // Línea de cadera (auxiliar)
      g.appendChild(U.el('line', {
        x1:n(s), y1:n(s+HD), x2:n(s+hW), y2:n(s+HD),
        stroke:C.seamLine, 'stroke-width':'0.3', 'stroke-dasharray':'5,3'
      }));
      const hipLabel = U.el('text', { x:n(s+hW+3), y:n(s+HD+2), 'font-size':'3', fill:C.seamLine, 'font-family':'Arial' });
      hipLabel.textContent = 'nivel cadera';
      g.appendChild(hipLabel);

      // Pinza (líneas de referencia)
      g.appendChild(U.el('line', {
        x1:n(dartX), y1:n(dartTopY), x2:n(dartX), y2:n(dartBotY),
        stroke:C.dartLine, 'stroke-width':'0.4', 'stroke-dasharray':'3,2'
      }));
      const pintLabel = U.el('text', { x:n(dartX+3), y:n(dartTopY+dartLenF*0.5), 'font-size':'3', fill:C.dartLine, 'font-family':'Arial' });
      pintLabel.textContent = `pinza ${Math.round(dartFront)}mm`;
      g.appendChild(pintLabel);

      g.appendChild(U.foldLine(s, s+waisDropCB, s, s+SL, 'CF DOBLAR'));
      g.appendChild(U.grainLine(s+hW*0.5, s+HD+20, SL-HD-40));

      // Muescas
      g.appendChild(U.notch(B_pt[0], B_pt[1], 0, 3));   // costado cintura
      g.appendChild(U.notch(s+hW, s+HD, 0, 3));          // costado cadera
      g.appendChild(U.notch(s, s+HD, 180, 3));            // CB cadera

      g.appendChild(U.pieceLabel(s+8, s+HD+30, 'FRENTE — FALDA', [
        '1 pieza (doble tela)', `Cintura: ${m.waist}cm · Cadera: ${m.hip}cm`,
        `Largo: ${m.skirtLength}cm`,
        `Pinza: ${Math.round(dartFront/10*10)/10}cm`,
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+hW+s,h:s+SL+s}, name:'Frente' });
    }

    // ═══════════════════ ESPALDA ══════════════════════════════════════
    {
      const waisDropCB_b   = 3;
      const waistDropSide_b= 18;

      const A_b = [s, s + waisDropCB_b];
      const B_b = [s + hW, s + waistDropSide_b];
      const D_b = [s + hW, s + HD];
      const E_b = [s + hW, s + SL];
      const F_b = [s, s + SL];

      // 2 pinzas en la espalda (más ajuste)
      const dart1X = s + hW * 0.28;
      const dart2X = s + hW * 0.62;
      const dartTopY_b = s + waisDropCB_b + (waistDropSide_b - waisDropCB_b) * 0.35;
      const dartBotY_b = dartTopY_b + dartLenB;
      const dw = dartBack / 4;  // cada pinza = dartBack/2, semiancho = dartBack/4

      let d = P.M(...A_b);
      // Cintura: A_b → izq pinza1
      d += ` ${P.Q(s+hW*0.08, s+waisDropCB_b*0.5, dart1X-dw, dartTopY_b)}`;
      d += ` ${P.L(dart1X, dartBotY_b)} ${P.L(dart1X+dw, dartTopY_b)}`;
      // Entre pinzas
      d += ` ${P.Q(s+hW*0.45, s+dartTopY_b-s-3, dart2X-dw, dartTopY_b)}`;
      d += ` ${P.L(dart2X, dartBotY_b)} ${P.L(dart2X+dw, dartTopY_b)}`;
      // Hacia costado
      d += ` ${P.Q(s+hW*0.85, s+waistDropSide_b*0.5, ...B_b)}`;
      d += ` ${P.L(...D_b)} ${P.L(...E_b)} ${P.H(s)} Z`;

      const g = document.createElementNS(NS, 'g');
      g.appendChild(U.el('path', { d, fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8', 'stroke-linejoin':'round' }));

      // Línea cadera
      g.appendChild(U.el('line', {
        x1:n(s), y1:n(s+HD), x2:n(s+hW), y2:n(s+HD),
        stroke:C.seamLine, 'stroke-width':'0.3', 'stroke-dasharray':'5,3'
      }));

      // Pinzas
      [dart1X, dart2X].forEach(dx => {
        g.appendChild(U.el('line', {
          x1:n(dx), y1:n(dartTopY_b), x2:n(dx), y2:n(dartBotY_b),
          stroke:C.dartLine, 'stroke-width':'0.4', 'stroke-dasharray':'3,2'
        }));
      });

      // Abertura en CB (cremallera) — línea discontinua especial
      const zipLen = 180;  // 18cm de cremallera
      g.appendChild(U.el('line', {
        x1:n(s), y1:n(s+waisDropCB_b), x2:n(s), y2:n(s+waisDropCB_b+zipLen),
        stroke:C.dimLine, 'stroke-width':'0.6', 'stroke-dasharray':'3,3'
      }));
      const zipLabel = U.el('text', {
        x:n(s-8), y:n(s+waisDropCB_b+zipLen/2), 'font-size':'3',
        fill:C.dimLine, 'font-family':'Arial', 'text-anchor':'middle',
        transform:`rotate(-90, ${n(s-8)}, ${n(s+waisDropCB_b+zipLen/2)})`
      });
      zipLabel.textContent = '← cremallera 18cm';
      g.appendChild(zipLabel);

      g.appendChild(U.foldLine(s, s+waisDropCB_b+zipLen, s, s+SL, 'CB DOBLAR'));
      g.appendChild(U.grainLine(s+hW*0.5, s+HD+20, SL-HD-40));
      g.appendChild(U.notch(B_b[0], B_b[1], 0, 3));
      g.appendChild(U.notch(s+hW, s+HD, 0, 3));

      g.appendChild(U.pieceLabel(s+8, s+HD+30, 'ESPALDA — FALDA', [
        '1 pieza (doble tela)', `2 pinzas`,
        `Pinza total: ${Math.round(dartBack/10*10)/10}cm`,
        'Cremallera CB: 18cm',
      ]));

      pieces.push({ group:g, bounds:{x:0,y:0,w:s+hW+s,h:s+SL+s}, name:'Espalda' });
    }

    // ═══════════════════ PRETINA ══════════════════════════════════════
    {
      const waistBandLen = (W + ease * 0.5) / 2 + 30;  // media cintura + solapamiento 3cm
      const waistBandH   = 40;  // 4cm alto pretina (dobla a 2cm)
      const g = document.createElementNS(NS, 'g');

      g.appendChild(U.el('rect', {
        x:n(s), y:n(s), width:n(waistBandLen), height:n(waistBandH),
        fill:C.fill, stroke:C.cutLine, 'stroke-width':'0.8'
      }));
      g.appendChild(U.foldLine(s, s+waistBandH/2, s+waistBandLen, s+waistBandH/2));
      g.appendChild(U.grainLine(s+waistBandLen*0.5, s+8, waistBandH-16));
      g.appendChild(U.pieceLabel(s+8, s+waistBandH+12, 'PRETINA', [
        '2 piezas (doblar en tela)', `Cintura: ${m.waist}cm`,
      ]));
      pieces.push({ group:g, bounds:{x:0,y:0,w:s+waistBandLen+s,h:s+waistBandH+s+20}, name:'Pretina' });
    }

    return pieces;
  }

  return { generate };
})();
