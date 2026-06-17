'use strict';
/**
 * sistemas/nereyda-herrera.js
 * ═══════════════════════════════════════════════════════════════
 * SISTEMA DE PATRONAJE — NEREYDA HERRERA
 * Digitalizado desde sus documentos de cátedra originales.
 *
 * Incluye:
 *  1. Tabla de medidas industriales (dama) SS→3XL
 *  2. Tabla de medidas caballero SS→3XL
 *  3. Fórmulas de construcción — Blusa Básica Parte Trasera
 *  4. Fórmulas de construcción — Camisa Parte Posterior
 *  5. Conversiones (cuartas partes, mitades, sextas)
 * ═══════════════════════════════════════════════════════════════
 */

window.PAT = window.PAT || {};
PAT.Sistemas = PAT.Sistemas || {};

PAT.Sistemas.NereydaHerrera = (function () {

  const NOMBRE  = 'Sistema Nereyda Herrera';
  const VERSION = '1.0';

  // ══════════════════════════════════════════════════════════════
  // 1. TABLA DE MEDIDAS INDUSTRIALES — DAMA
  //    Fuente: documento "Medidas Industriales" Nereyda Herrera
  //    Todas las medidas en centímetros
  // ══════════════════════════════════════════════════════════════
  const TALLAS_DAMA = {
    etiquetas: ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    modelo: 'S', // talla modelo de referencia

    medidas: {
      // 01
      bust:         { SS:90, S:92, M:96,  L:100, XL:106, '2XL':110, '3XL':116 },
      // 02
      shoulder:     { SS:37, S:38, M:39,  L:40,  XL:41,  '2XL':42,  '3XL':43  },
      // 03
      backLength:   { SS:40, S:41, M:42,  L:43,  XL:44,  '2XL':45,  '3XL':46  },
      // 04
      frontLength:  { SS:43, S:44, M:45,  L:46,  XL:47,  '2XL':48,  '3XL':49  },
      // 05
      waist:        { SS:66, S:70, M:72,  L:76,  XL:82,  '2XL':86,  '3XL':92  },
      // 06
      hipDepth:     { SS:17, S:18, M:19,  L:20,  XL:21,  '2XL':21,  '3XL':22  },
      // 07
      hip:          { SS:90, S:96, M:100, L:104, XL:110, '2XL':116, '3XL':122 },
      // 08
      skirtLength:  { SS:60, S:62, M:64,  L:65,  XL:66,  '2XL':67,  '3XL':68  },
      // 09
      sleeveShort:  { SS:18, S:19, M:20,  L:21,  XL:22,  '2XL':23,  '3XL':24  },
      // 10
      armCirc:      { SS:28, S:29, M:30,  L:31,  XL:32,  '2XL':33,  '3XL':34  },
      // 11
      sleeveLong:   { SS:52, S:53, M:54,  L:55,  XL:56,  '2XL':57,  '3XL':58  },
      // 12
      wrist:        { SS:15, S:16, M:17,  L:19,  XL:21,  '2XL':22,  '3XL':23  },
    },

    // Conversiones que Nereyda Herrera usa en construcción (talla S de ejemplo)
    // Cuarta parte del busto = 92/4 = 23
    // Mitad y sexta de espalda = 38/2=19 → 38/6=6.3
    // Cuarta parte de cintura = 70/4 = 17.5
    // Cuarta parte de cadera = 96/4 = 24
    conversionesEjemploS: {
      bust_4:     23,    // cuarta parte del busto
      espalda_2:  19,    // mitad del ancho de espalda
      espalda_6:  6.3,   // sexta del ancho de espalda
      waist_4:    17.5,  // cuarta parte cintura
      hip_4:      24,    // cuarta parte cadera
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 2. TABLA DE MEDIDAS — CAMISA CABALLERO
  //    Fuente: documento "Camisa de Caballero" Nereyda Herrera
  //    Tallas: 32=SS, 34=S, 36=M, 38=L, 40=XL, 42=2XL, 44=3XL
  // ══════════════════════════════════════════════════════════════
  const TALLAS_CABALLERO = {
    etiquetas: ['32','34','36','38','40','42','44'],
    nombreTallas: { '32':'SS','34':'S','36':'M','38':'L','40':'XL','42':'2XL','44':'3XL' },

    medidas: {
      // 01
      bust:         { '32':82,  '34':86,  '36':92,  '38':97,  '40':102, '42':107, '44':112 },
      // 02
      shoulder:     { '32':40,  '34':41,  '36':42,  '38':44,  '40':46,  '42':48,  '44':50  },
      // 03
      shirtLength:  { '32':64,  '34':68,  '36':70,  '38':72,  '40':74,  '42':76,  '44':78  },
      // 04
      neck:         { '32':36,  '34':38,  '36':40,  '38':42,  '40':44,  '42':46,  '44':48  },
      // 05
      sleeveShort:  { '32':20,  '34':21,  '36':22,  '38':23,  '40':24,  '42':25,  '44':26  },
      // 06
      armCirc:      { '32':26,  '34':28,  '36':30,  '38':32,  '40':34,  '42':36,  '44':38  },
      // 07
      sleeveLong:   { '32':56,  '34':57,  '36':58,  '38':60,  '40':61,  '42':62,  '44':63  },
      // 08
      wrist:        { '32':18,  '34':19,  '36':20,  '38':21,  '40':22,  '42':23,  '44':24  },
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 3. FÓRMULAS — BLUSA BÁSICA PARTE TRASERA
  //    Fuente: "Trazado de Blusa Básica Parte Trasera" Nereyda Herrera
  //
  //    LECTURA DEL DOCUMENTO:
  //    - Rectángulo base: AB = busto/4,  BC = talle posterior
  //    - A.1  = espalda/2               (mitad del ancho de espalda)
  //    - 1.2  = 4 cm                    (caída de hombro)
  //    - 2.3  = espalda/2 - 1 cm       (nivel sisa - línea E)
  //    - A.4  = espalda/6               (sexta parte espalda)
  //    - 2.2a = +2 cm (subir)
  //    - 4.4a = +2 cm (subir)
  //    - A.5  = 2 cm
  //    - D.6  = cintura/4 + 3 cm
  //    - Sisa: meter 1 cm en mitad de 2.3, semicurva
  //    - Escote: unir 4.5 en semicurva
  //    - D1   = alto de cadera
  //    - D2   = cadera/4
  //    - Pinza: 7=mitad E.3, 7.8=5cm, alto pinza 8-12cm, 8.9=1.5cm
  //    - Canesú: puntos 6,7,8,10
  // ══════════════════════════════════════════════════════════════
  const BLUSA_TRASERA = {
    nombre: 'Blusa Básica Parte Trasera',
    autor:  'Nereyda Herrera',
    piezas: ['trasero'],

    /**
     * Genera la pieza trasera siguiendo exactamente el sistema NH.
     * @param {object} m - medidas en cm { bust, shoulder, backLength, waist, hip, hipDepth }
     * @param {number} s - margen de costura en mm (default 10)
     * @returns {object} { points, lines } en mm
     */
    generar(m, s = 10) {
      // ── Conversión a mm ───────────────────────────────────────
      const B   = m.bust       * 10;   // contorno busto
      const ESP = m.shoulder   * 10;   // ancho de espalda (total)
      const TP  = m.backLength * 10;   // talle posterior
      const CIN = m.waist      * 10;   // cintura
      const CAD = m.hip        * 10;   // cadera
      const ACA = (m.hipDepth || 18) * 10;

      // Origen del canvas — dejamos 30mm arriba para que el punto 4a
      // (que sube 2cm sobre la línea de referencia A) quede visible
      const OX = s;        // margen izquierdo
      const OY = s + 30;   // margen superior ampliado

      // ── Rectángulo de construcción ────────────────────────────
      // AB = busto/4 (ancho)   BC = talle posterior (alto)
      const RW = B / 4;   // ancho del rectángulo
      const RH = TP;      // alto del rectángulo

      // Esquinas del rectángulo base
      const A  = { x: OX,       y: OY,       name:'A' };
      const B_ = { x: OX + RW,  y: OY,       name:'B' };
      const C_ = { x: OX + RW,  y: OY + RH,  name:'C' };
      const D  = { x: OX,       y: OY + RH,  name:'D' };

      // ── ESCOTE / CUELLO ───────────────────────────────────────
      // A.4  = espalda/6 hacia la DERECHA → ancho del escote
      const p4  = { x: OX + ESP/6,        y: OY,        name:'4'  };
      // A.5  = 2 cm hacia ABAJO → profundidad del escote espalda
      const p5  = { x: OX,                y: OY + 20,   name:'5'  };
      // 4.4a = subir 2cm (el punto de encuentro cuello-hombro sube ligeramente)
      const p4a = { x: OX + ESP/6,        y: OY - 20,   name:'4a' };
      // Curva de escote: 5 → 4a  (semicurva cóncava)

      // ── HOMBRO ───────────────────────────────────────────────
      // A.1  = espalda/2 → extremo del hombro al nivel de A
      const p1  = { x: OX + ESP/2,        y: OY,        name:'1'  };
      // 1.2  = 4 cm hacia abajo → caída de hombro
      const p2  = { x: OX + ESP/2,        y: OY + 40,   name:'2'  };
      // 2.2a = subir 2cm (punto de costura real en el hombro)
      const p2a = { x: OX + ESP/2,        y: OY + 20,   name:'2a' };
      // Hombro: 4a → 2a  (línea recta diagonal)

      // ── SISA (ARMHOLE) ────────────────────────────────────────
      // 2.3  = espalda/2 − 1cm, medida VERTICAL hacia abajo desde 2
      //        define la profundidad de la sisa
      const sisaDepth = ESP/2 - 10;                         // ≈ 18cm para talla S
      const p3  = { x: OX + ESP/2,        y: OY + 40 + sisaDepth, name:'3' };

      // SM   = punto medio de la sisa, metido 1cm hacia el centro (izq)
      const SM  = {
        x: OX + ESP/2 - 10,
        y: OY + 40 + sisaDepth / 2,
        name:'SM'
      };

      // F    = costado a nivel de sisa (extremo derecho del rectángulo en p3.y)
      const E   = { x: OX,                y: OY + 40,   name:'E'  }; // nivel hombro
      const F   = { x: OX + RW,           y: p3.y,      name:'F'  }; // nivel sisa (costado)

      // ── CINTURA Y CADERA ──────────────────────────────────────
      // D.6  = cintura/4 + 3cm (punto de cintura en costado)
      const p6  = { x: OX + CIN/4 + 30,   y: OY + RH,   name:'6'  };
      const D1  = { x: OX,                y: OY + RH + ACA, name:'D1' };
      const D2  = { x: OX + CAD/4,        y: OY + RH + ACA, name:'D2' };

      // ── PINZA TRASERA (manual: Paso 3 Bloque B) ────────────────
      // Punto 7 = mitad del TRAMO DE CINTURA (no del tramo de sisa).
      // El tramo de cintura va de D (CB, x=OX) a 6 (costado, x=p6.x).
      const p7  = { x: (OX + p6.x) / 2,   y: OY + RH,    name:'7'  };
      // La pinza sube en recta hasta la altura de sisa y baja hasta la
      // línea de cadera — longitud total real (no fija 5cm), tal como
      // indica el manual.
      const p7T = { x: p7.x,               y: p3.y,            name:'7T' };
      const p7B = { x: p7.x,               y: OY + RH + ACA,   name:'7B' };
      // Reparto de 1.5cm hacia cada lado de la línea central en la cintura
      const p9L = { x: p7.x - 15,          y: p7.y,       name:'9L' };
      const p9R = { x: p7.x + 15,          y: p7.y,       name:'9R' };

      // ── Ensamblar puntos ──────────────────────────────────────
      const points = {};
      [A, B_, C_, D, p1, p2, p3, p4, p2a, p4a, p5, p6,
       E, F, SM, D1, D2, p7, p7T, p7B, p9L, p9R]
        .forEach((p, i) => {
          points['nh' + i] = { x: p.x, y: p.y, name: p.name, fx:'', fy:'' };
        });

      const byName = {};
      Object.entries(points).forEach(([id, p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a, b, t='line', lbl='', ctrl=20) {
        if (byName[a] && byName[b])
          lines.push({ from:byName[a], to:byName[b], type:t, ctrl, cpx:null, cpy:null });
      }

      // Centro espalda (doblez)
      ln('D',  'A',   'fold');
      ln('D',  'D1',  'fold');

      // Escote (cuello)
      ln('A',  '5',   'line');   // A → 2cm abajo (profundidad escote)
      ln('5',  '4a',  'curve');  // curva escote: centro espalda → hombro

      // Hombro
      ln('4a', '2a',  'line');   // línea de hombro

      // Sisa (armhole) — curva corrida desde caída de hombro hasta nivel sisa
      // Verificado con la fórmula real del renderer: cpx = mx-(dy/len)*ctrl.
      // Vector 2→3 es vertical puro (dx=0, dy>0) → cpx = mx - ctrl.
      // SM (punto guía) está 1cm hacia -x (hacia el centro espalda) respecto
      // a la línea 2-3, así que para que la curva pase por ese lado ctrl debe
      // ser POSITIVO (ctrl negativo movería la curva hacia +x, hacia afuera).
      ln('2a', '2',   'line');   // caída de hombro (2cm vertical)
      ln('2',  '3',   'curve', '', 20);  // sisa completa — ctrl positivo = curva hacia adentro (centro espalda)

      // Nivel sisa → costado
      ln('3',  'F',   'line');   // sisa horizontal hasta costado
      ln('F',  '6',   'line');   // costado sisa → cintura
      ln('6',  'C',   'line');   // cintura → esquina inferior

      // Dobladillo inferior
      ln('C',  'D',   'line');

      // Cadera
      ln('D1', 'D2',  'line');
      ln('D2', '6',   'line');

      // Líneas de referencia (construcción) — antes mal etiquetadas como
      // 'line', lo que las metía dentro del contorno relleno como bordes
      // falsos. 'construction' las deja como guía punteada, fuera del relleno.
      ln('E',  'F',   'construction');   // nivel hombro (referencia)
      ln('A',  'B',   'construction');   // línea tope (referencia)

      // Pinza trasera — interna, NO es parte del contorno exterior.
      // Forma de rombo (manual): sube de la cintura a la sisa por un lado
      // y baja de la cintura a la cadera por el otro, repartiendo 1.5cm a
      // cada lado en la línea de cintura. 'dart' la excluye del relleno.
      ln('7T', '9R',  'dart');
      ln('9R', '7B',  'dart');
      ln('7B', '9L',  'dart');
      ln('9L', '7T',  'dart');

      return { points, lines };
    },

    // Fórmulas como strings para el sistema fx/fy
    formulas: {
      'A':   { fx: '0',                                  fy: '0',                 nota: 'Origen' },
      'B':   { fx: 'pecho/4',                            fy: '0',                 nota: 'Ancho busto/4' },
      'C':   { fx: 'pecho/4',                            fy: 'talle',             nota: 'Esquina inf der' },
      'D':   { fx: '0',                                  fy: 'talle',             nota: 'Esquina inf izq' },
      '1':   { fx: 'hombros/2',                          fy: '0',                 nota: 'Mitad espalda' },
      '2':   { fx: 'hombros/2',                          fy: '40',                nota: '4cm caída hombro' },
      '3':   { fx: 'hombros - 10',                       fy: '40',                nota: 'Nivel sisa (espalda-1cm)' },
      '4':   { fx: 'hombros/6',                          fy: '0',                 nota: 'Sexta parte espalda' },
      '2a':  { fx: 'hombros/2',                          fy: '20',                nota: 'Punto 2 subir 2cm' },
      '4a':  { fx: 'hombros/6',                          fy: '-20',               nota: 'Punto 4 subir 2cm' },
      '5':   { fx: '20',                                 fy: '0',                 nota: '2cm desde A (cuello)' },
      '6':   { fx: 'cintura/4 + 30',                     fy: 'talle',             nota: 'Cintura/4 + 3cm' },
      'D1':  { fx: '0',                                  fy: 'talle + cadera_prof * 10', nota: 'Alto de cadera' },
      'D2':  { fx: 'cadera/4',                           fy: 'talle + cadera_prof * 10', nota: 'Cadera/4' },
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 3.5 FÓRMULAS — BLUSA BÁSICA DE DAMA, PARTE DELANTERA
  //    Fuente: MANUAL TÉCNICO COMPLETO DE PATRONAJE INDUSTRIAL — NH,
  //    Sección 3, Bloque A. Pieza que antes NO existía en el código
  //    (solo había Parte Trasera).
  //
  //    A.B  = busto/4 + 2cm                (ancho)
  //    B.C  = talle delantero               (alto)
  //    Caída de hombro: 5cm (1cm más que la espalda — el manual no da
  //                      un eje X explícito; se usa la misma guía
  //                      espalda/2 que la trasera, por homologación)
  //    A.1  = espalda/6                    (escote horizontal)
  //    A.5  = espalda/6 + 2cm               (escote vertical, curva profunda)
  //    Pinza de entalle (cintura) = cintura/4 + 3cm, con 3cm reubicados
  //      como pinza de busto que muere 2cm antes de la altura del pezón
  //      (el manual no da una coordenada X numérica exacta para el punto
  //      de separación de busto; se aproxima al 55% del ancho del cuerpo,
  //      una posición típica de patronaje — ajustable con fx/fy)
  //    Pinza de costado: extrae la diferencia (talle delantero − talle
  //      posterior) en el costado, horizontal
  //    Cruce de cierre: 7cm desde el CF para la vista de botones
  // ══════════════════════════════════════════════════════════════
  const BLUSA_DELANTERA = {
    nombre: 'Blusa Básica Parte Delantera',
    autor:  'Nereyda Herrera',
    piezas: ['delantero'],

    /**
     * NH — Blusa Básica Dama, Parte Delantera (con pinzas anatómicas).
     * CF = IZQUIERDA, costado = DERECHA (misma convención que el resto
     * del sistema: CB/CF siempre a la izquierda).
     *
     * @param {object} m  { bust, shoulder, frontLength, backLength, waist, hipDepth }
     * @param {number} s  margen en mm
     */
    generar(m, s = 10) {
      const BUS = m.bust * 10;
      const ESP = m.shoulder * 10;
      const TF  = (m.frontLength || 44) * 10;
      const TP  = (m.backLength  || 41) * 10;
      const CIN = m.waist * 10;

      // Margen extra a la izquierda para la vista de botones (7cm)
      const OX = s + 70;
      const OY = s + 30;   // espacio arriba para que la pinza de busto quepa

      const RW = BUS / 4 + 20;   // A.B  busto/4 + 2cm
      const RH = TF;              // B.C  talle delantero

      const A  = { x: OX,       y: OY,       name: 'A' };  // CF top
      const B_ = { x: OX + RW,  y: OY,       name: 'B' };  // costado top
      const C_ = { x: OX + RW,  y: OY + RH,  name: 'C' };  // costado bottom
      const D  = { x: OX,       y: OY + RH,  name: 'D' };  // CF bottom

      // ── ESCOTE ────────────────────────────────────────────────
      // A.1 escote horizontal = espalda/6 (hacia el costado)
      const p1 = { x: OX + ESP/6,       y: OY,             name: '1' };
      // A.5 escote vertical = espalda/6 + 2cm (hacia abajo, en el CF)
      const p5 = { x: OX,               y: OY + ESP/6+20,  name: '5' };

      // ── HOMBRO ────────────────────────────────────────────────
      // Guía de hombro (espalda/2, homologada con la trasera), caída 5cm
      const hombroX = OX + ESP/2;
      const pH = { x: hombroX, y: OY + 50, name: 'H' };

      // ── PINZA DE BUSTO (entalle vertical de cintura) ───────────
      // Cintura/4+3cm define el ancho final en la cintura; los 3cm se
      // reubican como pinza de busto (1.5cm a cada lado), centrada
      // aprox. al 55% del ancho del cuerpo (punto de separación de
      // busto — el manual no da una X numérica exacta).
      const bustX  = OX + RW * 0.55;
      const bustApexY = p5.y + (RH - p5.y) * 0.32;   // ≈ "2cm antes del pezón": altura aprox.
      const waistY = OY + RH;
      const pBA  = { x: bustX,        y: bustApexY,  name: 'PB'  };  // ápice (muere 2cm antes del pezón)
      const pBL  = { x: bustX - 15,   y: waistY,      name: 'PBL' };
      const pBR  = { x: bustX + 15,   y: waistY,      name: 'PBR' };

      // Punto de cintura en el costado: cintura/4 + 3cm
      const p6 = { x: OX + CIN/4 + 30, y: waistY, name: '6' };

      // ── PINZA DE COSTADO (busto) ────────────────────────────────
      // Extrae la diferencia entre talle delantero y posterior, en el
      // costado, de forma horizontal (puntos 10, 11, 12).
      const difTalle = Math.max(TF - TP, 0);
      const p10 = { x: OX + RW,       y: OY + RH*0.42,            name: '10' };
      const p11 = { x: OX + RW - 10,  y: p10.y,                    name: '11' };
      const p12 = { x: OX + RW,       y: p10.y + (difTalle || 10), name: '12' };

      // ── VISTA / CRUCE DE CIERRE ──────────────────────────────────
      // 7cm desde el CF para la vista de ojales y abotonado.
      const p14  = { x: OX - 70, y: p5.y,      name: '14'  };
      const p14b = { x: OX - 70, y: OY + RH,   name: '14D' };

      const points = {};
      [A, B_, C_, D, p1, p5, pH, pBA, pBL, pBR, p6, p10, p11, p12, p14, p14b]
        .forEach((p, i) => { points['bd' + i] = { x: p.x, y: p.y, name: p.name, fx: '', fy: '' }; });
      const byName = {};
      Object.entries(points).forEach(([id, p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a, b, t = 'line', lbl = '', ctrl = 20) {
        if (byName[a] && byName[b])
          lines.push({ from: byName[a], to: byName[b], type: t, ctrl, cpx: null, cpy: null, label: lbl });
      }

      // ── Líneas de construcción ────────────────────────────────
      ln('A', 'B', 'construction', 'A.B busto/4+2cm');
      ln('B', 'C', 'construction', 'B.C talle delantero');

      // ── Contorno: 14D → D → C → 12 → 11 → 10 → 6 → C(costado)...
      // Recorrido real: 14D→D(dobladillo CF)→D→C(dobladillo)→C→12→11→10
      // (pinza costado, ya cerrada arriba)→6(cintura)→H(hombro, vía sisa)
      // →1(escote)→5(escote)→A→14(vista)→14D
      ln('14D', 'D',   'line');          // doblez vista (abajo)
      ln('D',   'C',   'line');          // dobladillo
      ln('C',   '12',  'line');          // costado hasta pinza
      ln('12',  '11',  'curve', '', 10); // pinza de costado (entra)
      ln('11',  '10',  'curve', '', -10);// pinza de costado (sale)
      ln('10',  '6',   'line');          // costado hasta cintura — referencia,
                                          // el ancho final en cintura es 6 (CIN/4+3cm)
      ln('6',   'H',   'curve', 'sisa delantera', -18); // sisa hasta caída de hombro
      ln('H',   '1',   'line');          // hombro
      ln('1',   '5',   'curve', 'escote delantero (curva profunda)', -28);
      ln('5',   'A',   'line');          // escote hasta CF
      ln('A',   '14',  'line');          // vista, borde superior
      ln('14',  '14D', 'fold');          // doblez de la vista, cierra contorno

      // Pinza de busto — interna, no forma parte del contorno exterior.
      ln('PB',  'PBL', 'dart');
      ln('PB',  'PBR', 'dart');

      return { points, lines };
    },
  };

  // ══════════════════════════════════════════════════════════════
  // 4. FÓRMULAS — CAMISA PARTE POSTERIOR (CABALLERO)
  //    Fuente: MANUAL TÉCNICO COMPLETO DE PATRONAJE INDUSTRIAL — NH,
  //    Sección 2, Bloque A (Parte Posterior).
  //
  //    El manual usa CB=DERECHA / sisa=IZQUIERDA; este código mantiene
  //    su convención histórica CB=IZQUIERDA / sisa=DERECHA (espejo), para
  //    quedar simétrico con CAMISA_DELANTERA (CF=izquierda). Mapeo:
  //    manual A(CB top)→código B_ · manual D(CB bottom)→código C_ ·
  //    manual B(sisa top)→código A · manual C(sisa bottom)→código D.
  //
  //    LECTURA DEL MANUAL (Paso 1-4):
  //    - Rectángulo: CP/4+2cm (ancho) × Largo Total (alto)
  //    - A.1   = CC/6 - 1cm           (ancho escote trasero, en línea superior)
  //    - a     = baja 1cm desde A     (caída de escote en el centro)
  //    - Punto 1 = CC/6 (profundidad canesú, vertical desde A en el centro)
  //    - Punto 2 = Punto1 + (CC/6-2cm) (línea de sisa, horizontal a costado)
  //    - A.5   = AE/2 (guía ancho espalda, vertical desde línea de canesú)
  //    - Punto 3 = guía AE/2, baja 4cm desde línea superior
  //    - Punto 4 = prolongación de A.1→3 en línea recta, 1cm más afuera
  //    - G = desde Punto 3, sube 1cm (holgura ergonómica hombro)
  //    - Sisa: G baja recto a la línea de sisa y conecta en semicurva con Punto 2
  //    - E = mitad del costado (sisa→bajo) · F = E entra 1cm (entalle)
  // ══════════════════════════════════════════════════════════════
  const CAMISA_POSTERIOR = {
    nombre: 'Camisa Parte Posterior',
    autor:  'Nereyda Herrera',
    genero: 'caballero',

    /**
     * NH — Camisa Posterior (espalda caballero).
     * CB (Centro Espalda) = IZQUIERDA (doblez).
     * Costado/sisa = DERECHA.
     *
     * @param {object} m  { bust, neck, shoulder, totalLength }
     */
    generar(m, s = 30) {   // margen de seguridad 3cm (manual NH, Sección 2 Paso 1)
      const T   = m.bust * 10;
      const NK  = m.neck * 10;
      const ESP = m.shoulder * 10;
      const LC  = (m.totalLength || 68) * 10;

      const HOLGURA = 20;  // 2cm holgura

      const OX = s;        // margen izquierdo = CB
      const OY = s + 30;   // margen superior (espacio para 'a')

      const rectW = T / 4 + HOLGURA;
      const rectH = LC;

      // CB = IZQUIERDA, costado/sisa = DERECHA
      const B_  = { x: OX,           y: OY,           name: 'B'  };  // CB top (referencia, no en contorno final)
      const A   = { x: OX + rectW,   y: OY,           name: 'A'  };  // sisa top
      const D   = { x: OX + rectW,   y: OY + rectH,   name: 'D'  };  // sisa bottom
      const C_  = { x: OX,           y: OY + rectH,   name: 'C'  };  // CB bottom

      // ── ESCOTE ────────────────────────────────────────────────
      // a: caída de escote, baja 1cm desde el CB top (B_)
      const pa  = { x: OX,             y: OY + 10,            name: 'a' };
      // A.1: ancho de escote trasero CC/6-1cm, sobre la línea superior
      const p1  = { x: OX + (NK/6-10), y: OY,                 name: '1' };

      // ── CANESÚ Y SISA ──────────────────────────────────────────
      // Punto "1" del manual (profundidad de canesú) = CC/6 vertical desde CB
      const canesuY = OY + NK/6;
      const pCanesu = { x: OX,         y: canesuY,            name: 'CAN' };
      // Punto 2: línea de sisa = canesú + (CC/6-2cm), horizontal a costado
      const sisaY   = canesuY + (NK/6 - 20);
      const p2      = { x: OX + rectW, y: sisaY,              name: '2'  };

      // ── HOMBRO ────────────────────────────────────────────────
      // A.5: guía de ancho de espalda (AE/2) — eje vertical auxiliar
      const guideX = OX + ESP/2;
      // Punto 3: en la guía, 4cm bajo la línea superior
      const p3 = { x: guideX, y: OY + 40, name: '3' };
      // Punto 4: prolongación de la línea A.1→3, 1cm más afuera (hombro real)
      const dx34 = p3.x - p1.x, dy34 = p3.y - p1.y;
      const len34 = Math.sqrt(dx34*dx34 + dy34*dy34) || 1;
      const p4 = { x: p3.x + dx34/len34*10, y: p3.y + dy34/len34*10, name: '4' };

      // G: holgura ergonómica del hombro — sube 1cm desde el Punto 3
      const G  = { x: p3.x, y: p3.y - 10, name: 'G' };
      // G2: G bajando recto hasta la línea de sisa (inicio de la semicurva)
      const G2 = { x: G.x,  y: sisaY,     name: 'G2' };

      // ── ENTALLE DE COSTADO ───────────────────────────────────
      const E = { x: OX + rectW, y: (sisaY + (OY+rectH)) / 2, name: 'E' };
      const F = { x: E.x - 10,   y: E.y,                      name: 'F' };

      const points = {};
      [B_, A, D, C_, pa, p1, pCanesu, p2, p3, p4, G, G2, E, F]
        .forEach((p, i) => { points['nc'+i] = {x:p.x, y:p.y, name:p.name, fx:'', fy:''}; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a, b, type='line', lbl='', ctrl=20) {
        if (byName[a] && byName[b])
          lines.push({ from:byName[a], to:byName[b], type, ctrl, cpx:null, cpy:null });
      }

      // ── Contorno principal ─────────────────────────────────────
      // CB doblez (izquierda): de C (abajo) a 'a' (arriba, 1cm bajo B_ —
      // B_ ya no es punto de contorno porque el escote lo recorta).
      ln('C',  'a',  'fold');
      // Escote: curva cóncava de 'a' a A.1 (manual: "regla de curvas")
      ln('a',  '1',  'curve', 'escote trasero', -14);
      // Hombro: línea recta de A.1 al Punto 4
      ln('1',  '4',  'line');
      // Conector de holgura ergonómica (4→G, ~1cm) y bajada recta a sisa
      ln('4',  'G',  'line');
      ln('G',  'G2', 'line');
      // Sisa: semicurva de G2 a Punto 2
      ln('G2', '2',  'curve', 'sisa posterior', -20);
      // Costado con entalle
      ln('2',  'F',  'line');
      ln('F',  'D',  'line');
      // Dobladillo
      ln('D',  'C',  'line');

      // Referencias — 'construction' para que no se cuelen como bordes
      // falsos dentro del contorno relleno.
      ln('B',  'A',   'construction');   // tope superior
      ln('E',  'F',   'construction');   // referencia entalle
      ln('B',  'CAN', 'construction');   // profundidad de canesú
      ln('CAN','A',   'construction', '', 0); // línea base del canesú (horizontal completa)

      return { points, lines };
    },
  };

  // ══════════════════════════════════════════════════════════════
  // 5. TABLA ATELIER ESCUELA — CABALLERO (versión actualizada NH)
  //    Fuente: "Tablas para medidas para camisas" — Atelier Escuela
  //    Tallas: SS, S, M, L, XL, 2XL, 3XL
  // ══════════════════════════════════════════════════════════════
  const TALLAS_ATELIER_CAB = {
    etiquetas: ['SS','S','M','L','XL','2XL','3XL'],
    medidas: {
      bust:        { SS:90,  S:93,  M:97,  L:102, XL:107, '2XL':112, '3XL':117 },
      shoulder:    { SS:42,  S:44,  M:46,  L:47,  XL:49,  '2XL':50,  '3XL':52  },
      shirtLength: { SS:65,  S:66,  M:68,  L:70,  XL:72,  '2XL':74,  '3XL':76  },
      neck:        { SS:38,  S:39,  M:40,  L:42,  XL:44,  '2XL':46,  '3XL':48  },
      sleeveShort: { SS:18,  S:19,  M:20,  L:21,  XL:22,  '2XL':23,  '3XL':24  },
      armCirc:     { SS:32,  S:33,  M:34,  L:35,  XL:36,  '2XL':37,  '3XL':38  },
      sleeveLong:  { SS:56,  S:58,  M:59,  L:61,  XL:63,  '2XL':64,  '3XL':66  },
      wrist:       { SS:14,  S:15,  M:16,  L:17,  XL:18,  '2XL':19,  '3XL':20  },
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 6. CAMISA PARTE DELANTERA
  //    Fuente: "Trazado de Camisa Parte Delantera" Nereyda Herrera
  //
  //    Fuente: MANUAL TÉCNICO COMPLETO DE PATRONAJE INDUSTRIAL — NH,
  //    Sección 2, Bloque B (Parte Delantera, "Sistema Integrado").
  //
  //    A.B   = CP/4 + 2cm                  (ancho tórax, idéntico a posterior)
  //    B.C   = Largo + 2cm                 (holgura anatómica delantera)
  //    Margen de botonadura = 7cm (3cm cruce ojal/botón + 4cm vista doblada)
  //    A.8   = CC/6                        (ancho escote)
  //    A.9   = CC/6                        (profundidad escote) — curva con A.8
  //    Línea de sisa (homologada con posterior) = CC/6 + (CC/6-2cm)
  //    1.10  = AE/2 (guía ancho espalda), caída de hombro fija 4cm
  //    Hombro: línea recta A.8 → caída de hombro (debe medir igual que el
  //            hombro posterior, tramo A.1→4)
  //    Curva de sisa delantera: entra 1-1.5cm en la mitad de la guía de hombro
  // ══════════════════════════════════════════════════════════════
  const CAMISA_DELANTERA = {
    nombre: 'Camisa Parte Delantera',

    /**
     * NH — Trazado de Camisa Parte Delantera ("Sistema Integrado",
     * homologado con la parte posterior para que hombro y costado
     * cierren exactos).
     * A = CF arriba-izq, B = costado arriba-der,
     * C = costado abajo-der, D = CF abajo-izq.
     *
     * @param {object} m  { bust, shoulder, neck, totalLength }
     * @param {number} s  margen en mm
     */
    generar(m, s = 30) {   // margen de seguridad 3cm (manual NH, Sección 2 Paso 1)
      const T   = m.bust * 10;
      const NK  = m.neck * 10;
      const ESP = m.shoulder * 10;
      const LC  = (m.totalLength || m.frontLength || 65) * 10;

      // Margen extra a la izquierda para que la vista (7cm: 3cm cruce + 4cm
      // vista doblada) quepa.
      const OX = s + 70;
      const OY = s;

      // ── Rectángulo base ──────────────────────────────────────────
      const RW = T / 4 + 20;       // A.B  pecho/4 + 2cm (ancho)
      const RH = LC + 20;          // B.C  largo + 2cm de holgura anatómica

      const A  = { x: OX,       y: OY,       name: 'A'  };  // CF top-izq
      const B_ = { x: OX + RW,  y: OY,       name: 'B'  };  // costado top-der
      const C_ = { x: OX + RW,  y: OY + RH,  name: 'C'  };  // costado bot-der
      const D  = { x: OX,       y: OY + RH,  name: 'D'  };  // CF bot-izq

      // ── ESCOTE ────────────────────────────────────────────────────
      // Punto 1 (ancho de escote) = cuello/6 − 1cm — la MISMA fórmula que
      // la espalda (homologación delantero/trasero, confirmada por el
      // usuario). Punto 9 (profundidad de escote) = cuello/6, sin cambio.
      const p1  = { x: OX + (NK/6 - 10), y: OY,            name: '1'  };
      const p9  = { x: OX,               y: OY + NK/6,     name: '9'  };

      // ── HOMOLOGACIÓN DE SISA Y HOMBRO (idéntico método que posterior) ──
      // Línea de sisa delantera = canesú (CC/6) + (CC/6-2cm), igual que la
      // espalda, para que ambas sisas midan lo mismo.
      const sisaY = OY + NK/6 + (NK/6 - 20);
      // Guía de ancho de espalda (AE/2) — eje vertical auxiliar
      const guideX = OX + ESP/2;

      // Punto 8: sobre la línea A→B (arriba), en la guía de espalda/2.
      const p8  = { x: guideX,      y: OY,             name: '8'  };
      // Punto 10: sobre la línea de sisa, misma x que el punto 8.
      const p10 = { x: guideX,      y: sisaY,          name: '10' };
      // Punto 11: el punto 10 sube 1cm en dirección a la línea A→B.
      const p11 = { x: guideX,      y: sisaY - 10,     name: '11' };
      // Punto 12: el punto 8 baja 1cm (referencia interna, no es vértice
      // del contorno — el usuario lo describe como ajuste de control).
      const p12 = { x: guideX,      y: OY + 10,        name: '12' };
      // Punto 13: el punto 11 se mete 1cm en dirección a la línea B→C —
      // este es el vértice real donde termina la caída de hombro y
      // empieza la semicurva de la sisa.
      const p13 = { x: guideX + 10, y: sisaY - 10,      name: '13' };

      // Punto 2 — donde la sisa llega al costado.
      const p2 = { x: OX + RW, y: sisaY, name: '2' };

      // ── COSTADO CON ENTALLE ──────────────────────────────────────
      const E = { x: OX + RW, y: (sisaY + (OY + RH)) / 2, name: 'E' };
      const F = { x: E.x - 10, y: E.y,                    name: 'F' };

      // ── REFERENCIA DE BOLSILLO ────────────────────────────────────
      // "Línea 2": pecho/4 + 1cm desde A, en dirección al punto D
      // (vertical, sobre la línea CF). NO es el punto de escote — se usa
      // solo como guía para ubicar el bolsillo. Se renombra a "L2" para
      // no chocar con el punto "2" del costado/sisa (que es algo distinto).
      const pL2 = { x: OX, y: OY + (T/4 + 10), name: 'L2' };
      // Punto de referencia del bolsillo: 2 a 2.5cm por debajo de la
      // línea L2 (posición horizontal estimada — el manual no da una
      // coordenada X exacta; ajustable con fx/fy).
      const pBolsillo = { x: OX + RW * 0.4, y: pL2.y + 25, name: 'BOLS' };

      // A.14 vista de botones (estilo Sport): margen de 9cm desde el CF.
      const p14  = { x: OX - 90,      y: OY + NK/6,           name: '14' };
      const p14b = { x: OX - 90,      y: OY + RH,             name: '14D' };

      // 14T  esquina superior de la vista, a la altura del PICO (punto A).
      // La vista sube en forma de CUADRADO (línea recta arriba), no de pico
      // diagonal: 9→A (sube recto por la línea CF) → 14T (línea horizontal
      // arriba, a la altura de A) → 14 (baja recto hasta la altura real del
      // escote, punto 9) → 14D (sigue hacia abajo).
      const p14t = { x: OX - 90,      y: OY,                  name: '14T' };

      // ── Puntos ────────────────────────────────────────────────────
      const points = {};
      [A, B_, C_, D, p1, p9, p8, p10, p11, p12, p13, p2, E, F, pL2, pBolsillo, p14, p14b, p14t]
        .forEach((p, i) => {
          points['cd' + i] = { x: p.x, y: p.y, name: p.name, fx: '', fy: '' };
        });
      const byName = {};
      Object.entries(points).forEach(([id, p]) => { byName[p.name] = id; });

      const lines = [];
      // ctrl positivo = la curva se dobla hacia la IZQUIERDA del vector a→b
      // ctrl negativo = se dobla hacia la DERECHA del vector a→b
      function ln(a, b, t = 'line', lbl = '', ctrl = 20) {
        if (byName[a] && byName[b])
          lines.push({ from: byName[a], to: byName[b], type: t, ctrl, cpx: null, cpy: null, label: lbl });
      }

      // ── Líneas de construcción NH (punteadas grises) ─────────────
      ln('A',  'B',   'construction', 'A.B  pecho/4+2cm');
      ln('B',  'C',   'construction', 'B.C  largo+2cm');
      ln('C',  'D',   'construction', 'base rectángulo');
      ln('A',  '1',   'construction', 'A.1  cuello/6-1cm');
      ln('A',  '9',   'construction', 'A.9  cuello/6');
      ln('E',  'F',   'construction', 'referencia entalle');
      ln('8',  '10',  'construction', 'guía espalda/2');
      ln('10', '11',  'construction', '11: 10 sube 1cm');
      ln('8',  '12',  'construction', '12: 8 baja 1cm');
      ln('11', '13',  'construction', '13: 11 entra 1cm hacia costado');
      ln('A',  'L2',  'construction', 'L2: pecho/4+1cm — ref. bolsillo');

      // ── Contorno final de la prenda ───────────────────────────────
      // Recorrido: 14D → D → C → F → 2 → 10 → 13 → 1 → 9 → A → 14T → 14 → (14D)

      // Vista (placket de botones): borde inferior, desde la esquina
      // inferior de la vista hasta D.
      ln('14D', 'D',   'line');

      // Dobladillo
      ln('D',  'C',   'line');

      // Costado con entalle
      ln('C',  'F',   'line');
      ln('F',  '2',   'line');

      // Sisa delantera (semicurva inferior): del punto 2, recto hasta el
      // punto 13 (caída de hombro), luego curva hasta el ancho de escote.
      ln('2',  '13',  'curve', 'sisa delantera (homologada)', -20);

      // Caída de hombro / escote: línea recta del punto 13 al punto 1
      // (ancho de escote) — debe medir igual que el hombro posterior.
      ln('13', '1',   'line');

      // Escote: curva cóncava de 1 a 9 (regla curva francesa).
      ln('1',  '9',   'curve', 'escote delantero', -16);

      // Vista cuadrada: desde la profundidad real del escote (9) sube recto
      // por la línea CF hasta la altura del pico (A), gira en línea recta
      // horizontal hasta la esquina superior de la vista (14T) y luego baja
      // recto hasta la altura real del escote (14, misma altura que 9) —
      // forma de cuadrado/escalón, no de pico diagonal.
      ln('9',   'A',   'line');
      ln('A',   '14T', 'line');
      ln('14T', '14',  'line');

      // Cierre: doblez de la vista (borde izquierdo), conecta 14 con 14D
      // y cierra el contorno completo.
      ln('14',  '14D', 'fold');

      return { points, lines };
    },
  };

  // ══════════════════════════════════════════════════════════════
  // 7. MANGA CORTA — CAMISAS
  //    Fuente: "Manga para Camisas — Base Corta" Nereyda Herrera
  //
  //    Ejemplo Talla 32:
  //    1. Largo de manga corta
  //    2. Mitad del ancho de la espalda
  //    3. Sexta del ancho de espalda
  //    4. Mitad del contorno del Brazo
  //
  //    PROCEDIMIENTO (Base Manga Larga → mismos puntos):
  //    A.B = espalda/2 + 1cm       (ancho de la manga)
  //    B.C = largo manga
  //    B.1 = pecho/10 + 1cm        (décima parte pecho + 1cm)
  //    2   = B.1 / 2               (mitad de B.1)
  //    3   = B.2 / 2               (mitad de B.2)
  //    4   = A.B / 2               (mitad de A.B)
  //    5   = brazo / 2             (mitad contorno brazo)
  //    6   = 3cm
  //    Sisa configurada con semicurvas
  // ══════════════════════════════════════════════════════════════
  const MANGA_CAMISA = {
    nombre: 'Manga para Camisa',

    /**
     * NH — Manga para Camisa.
     * Layout: cabeza de manga en la PARTE SUPERIOR (arco hacia arriba),
     * puño/ruedo en la parte inferior.
     * A = sisa izquierda, B = sisa derecha, P = pico de la cabeza.
     * C = puño derecho, D = puño izquierdo.
     *
     * @param {object} m  { bust, shoulder, sleeveLength, sleeveShort, wrist }
     */
    generar(m, s = 10, tipo = 'corta') {
      const T   = m.bust * 10;
      const ESP = m.shoulder * 10;
      const ML  = tipo === 'larga' ? (m.sleeveLength || 58) * 10 : (m.sleeveShort || 20) * 10;
      const PU  = (m.wrist || 18) * 10;

      const anchoM = ESP / 2 + 10;   // espalda/2 + 1cm (ancho de la manga en sisa)
      const CH     = T / 10 + 10;    // pecho/10 + 1cm (altura cabeza de manga)

      const OX = s;
      const OY = s + CH + 20;        // nivel de sisa; la cabeza sube por encima de aquí

      // Puntos de sisa (base de la cabeza)
      const A  = { x: OX,           y: OY,        name: 'A'  };  // sisa izq
      const B_ = { x: OX + anchoM,  y: OY,        name: 'B'  };  // sisa der

      // Pico de la cabeza de manga
      const P  = { x: OX + anchoM/2, y: OY - CH,  name: 'P'  };

      // Puño/ruedo
      const C_ = { x: OX + anchoM,  y: OY + ML,   name: 'C'  };  // puño der
      const D  = { x: OX,           y: OY + ML,   name: 'D'  };  // puño izq

      // Puntos de referencia NH sobre la línea de sisa (y=OY)
      const d1 = T / 10 + 10;        // = CH
      const p1 = { x: OX + d1,       y: OY,        name: '1'  };
      const p2 = { x: OX + d1/2,     y: OY,        name: '2'  };  // mitad del tramo horizontal
      const p3 = { x: OX + d1/4,     y: OY,        name: '3'  };  // cuarta parte del tramo horizontal
      const p4 = { x: OX,            y: OY+ML/2,   name: '4'  };  // mitad de la vertical izquierda (manual NH)

      // Abertura y puño (manga larga) — manual: entra 7cm horizontal desde
      // el extremo posterior (antes eran 10cm fijos).
      let abertura = null;
      if (tipo === 'larga') {
        abertura = { x: OX + anchoM - 70, y: OY + ML, name: 'AB' };
      }

      // Puntos de descuento del puño (manga larga, manual NH Sección 4):
      // Punto 5: sube 5-6cm desde C (esquina derecha del ruedo).
      // Punto 6: ancho = mitad de contorno de puño + 3cm, desde D.
      let p5 = null, p6 = null;
      if (tipo === 'larga') {
        p5 = { x: C_.x,              y: OY + ML - 55,        name: '5' };
        p6 = { x: OX + (PU/2 + 30),  y: OY + ML,              name: '6' };
      }

      const points = {};
      const allPts = [A, B_, P, C_, D, p1, p2, p3, p4];
      if (abertura) allPts.push(abertura);
      if (p5) allPts.push(p5, p6);
      allPts.forEach((p, i) => { points['mg'+i] = {x:p.x, y:p.y, name:p.name, fx:'', fy:''}; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a,b,t='line'){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl:20,cpx:null,cpy:null}); }

      // ── Cabeza de manga (arco en dos mitades, diferenciadas) ───────
      // Manual NH: la copa NO es simétrica — el lado que va contra la
      // ESPALDA es más plano ("línea azul") y el lado que va contra el
      // DELANTERO es más cóncavo, con ~1cm más de entrada ("línea roja").
      // A = lado posterior/espalda (más plano, ctrl menor) ·
      // B = lado delantero (más cóncavo, ctrl mayor).
      ln('A', 'P', 'curve', 'línea azul (espalda) — más plana', 14);
      ln('P', 'B', 'curve', 'línea roja (delantero) — más cóncava', 26);

      // ── Costuras laterales ─────────────────────────────────────────
      ln('A', 'D', 'line');    // costura lateral izq
      ln('B', 'C', 'line');    // costura lateral der

      // ── Ruedo / puño ──────────────────────────────────────────────
      if (tipo === 'corta') {
        ln('D', 'C', 'fold');  // ruedo (se dobla)
      } else {
        if (abertura) {
          ln('D',  'AB', 'line');
          ln('AB', 'C',  'line'); // abertura carterita
        } else {
          ln('D', 'C', 'fold');
        }
      }

      // ── Referencias ───────────────────────────────────────────────
      ln('A', 'B', 'line');    // línea de sisa (referencia)
      if (p5 && p6) {
        ln('5', '6', 'construction', 'descuento de puño (referencia)');
        ln('C', '5', 'construction');
        ln('D', '6', 'construction');
      }

      return { points, lines };
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 8. MANGA CORTA — VESTIDOS
  //    Fuente: "Manga Corta" Nereyda Herrera (ejemplo talla 8)
  //    Medidas ejemplo: largo=20, espalda/2-1=17.5, busto/10=8.8, brazo/2=14
  //
  //    A.B = espalda/2 - 1cm
  //    B.C = largo manga
  //    B.1 = busto/10 + 3cm
  //    2   = B.1 / 2
  //    3   = B.2 / 2
  //    4   = A.B / 2
  //    D.5 = brazo/2 + 2cm
  //    D.6 = 3cm (ruedo)
  //    Sisa con semicurvas
  //    (Para larga: mismos puntos + puño)
  // ══════════════════════════════════════════════════════════════
  const MANGA_VESTIDO = {
    nombre: 'Manga para Vestido',

    /**
     * NH — Manga para Vestido.
     * Mismo esquema que MANGA_CAMISA pero proporciones vestido:
     *   ancho = espalda/2 - 1cm
     *   CH    = busto/10 + 3cm (cabeza más alta)
     *
     * @param {object} m  { bust, shoulder, sleeveLength, sleeveShort, wrist }
     */
    generar(m, s = 10, tipo = 'corta') {
      const T   = m.bust * 10;
      const ESP = m.shoulder * 10;
      const ML  = tipo === 'larga' ? (m.sleeveLength || 55) * 10 : (m.sleeveShort || 20) * 10;
      const PU  = (m.wrist || 17) * 10;

      const anchoM = ESP / 2 - 10;   // espalda/2 - 1cm
      const CH     = T / 10 + 30;    // busto/10 + 3cm (cabeza vestido)

      const OX = s;
      const OY = s + CH + 20;        // nivel de sisa

      // Puntos de sisa
      const A  = { x: OX,            y: OY,        name: 'A'  };  // sisa izq
      const B_ = { x: OX + anchoM,   y: OY,        name: 'B'  };  // sisa der

      // Pico de la cabeza
      const P  = { x: OX + anchoM/2, y: OY - CH,   name: 'P'  };

      // Puño/ruedo
      const C_ = { x: OX + anchoM,   y: OY + ML,   name: 'C'  };
      const D  = { x: OX,            y: OY + ML,   name: 'D'  };

      // Puntos de referencia NH en la línea de sisa
      const d1 = T / 10 + 30;        // = CH para vestido
      const p1 = { x: OX + d1,        y: OY,        name: '1'  };
      const p2 = { x: OX + d1/2,      y: OY,        name: '2'  };
      const p3 = { x: OX + d1/4,      y: OY,        name: '3'  };
      const p4 = { x: OX + anchoM/2,  y: OY,        name: '4'  };

      // Referencia puño manga larga (brazo/2 + 2cm)
      const p5 = { x: OX + anchoM,    y: OY + ML/2, name: '5'  };

      let abertura = null;
      if (tipo === 'larga') {
        abertura = { x: OX + anchoM - 100, y: OY + ML, name: 'AB' };
      }

      const points = {};
      const allPts = [A, B_, P, C_, D, p1, p2, p3, p4, p5];
      if (abertura) allPts.push(abertura);
      allPts.forEach((p,i) => { points['mv'+i] = {x:p.x, y:p.y, name:p.name, fx:'', fy:''}; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a,b,t='line'){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl:20,cpx:null,cpy:null}); }

      // Cabeza de manga (arco en dos mitades)
      ln('A', 'P', 'curve');
      ln('P', 'B', 'curve');

      // Costuras laterales
      ln('A', 'D', 'line');
      ln('B', 'C', 'line');

      // Ruedo / puño
      if (tipo === 'corta') {
        ln('D', 'C', 'fold');
      } else {
        if (abertura) {
          ln('D',  'AB', 'line');
          ln('AB', 'C',  'line');
        } else {
          ln('D', 'C', 'fold');
        }
      }

      // Referencias
      ln('A', 'B', 'line');    // línea de sisa

      return { points, lines };
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 9. CUELLO CAMISERO SPORT
  //    Fuente: "Cuello Camisero Sport" Nereyda Herrera
  //
  //    A.B = mitad contorno del escote
  //    B.C = ancho del cuello (6cm)
  //    C.1 = 1cm
  //    B.2 = 1 a 2cm (generalmente 1.5cm)
  //    3   = mitad de A.B y de C.D
  //    Marcar DOBLAR en el centro
  // ══════════════════════════════════════════════════════════════
  const CUELLO_SPORT = {
    nombre: 'Cuello Camisero Sport',
    generar(m, s = 10) {
      const NK  = m.neck * 10;   // contorno cuello
      const SF  = s;

      // El escote = cuello + holgura ≈ cuello (ya es el contorno medido en la blusa)
      // A.B = escote/2 (medida tomada uniendo las bases de la blusa)
      const AB = NK / 2;
      const BC = 60;  // ancho cuello 6cm

      const A = { x: SF + AB, y: SF,        name: 'A' }; // der-sup
      const B_= { x: SF,      y: SF,        name: 'B' }; // izq-sup
      const C_= { x: SF,      y: SF + BC,   name: 'C' }; // izq-inf
      const D = { x: SF + AB, y: SF + BC,   name: 'D' }; // der-inf (doblez)

      // C.1 = 1cm (desde C hacia la derecha — escuadra inf)
      const p1 = { x: SF + 10, y: SF + BC,  name: '1' };
      // B.2 = 1.5cm (desde B hacia abajo — ajuste escote)
      const p2 = { x: SF,      y: SF + 15,  name: '2' };
      // 3 = mitad de A.B y de C.D (punto medio de cada línea horizontal)
      const p3t= { x: SF + AB/2, y: SF,     name: '3t' }; // mitad superior
      const p3b= { x: SF + AB/2, y: SF + BC,name: '3b' }; // mitad inferior

      const points = {};
      [A, B_, C_, D, p1, p2, p3t, p3b]
        .forEach((p,i) => { points['cs'+i] = {x:p.x, y:p.y, name:p.name, fx:'', fy:''}; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a,b,t='line',lbl='',ctrl=20){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl,cpx:null,cpy:null}); }

      ln('B',  'A',  'line');   // tope superior
      ln('A',  'D',  'fold');   // doblez (DOBLAR)
      ln('D',  '1',  'line');   // base inferior der
      ln('1',  'C',  'line');   // base inferior izq
      ln('C',  '2',  'line');   // lateral izq
      // Vector 2→B apunta hacia arriba (dy<0); ctrl negativo curva hacia la DERECHA (interior del cuello).
      ln('2',  'B',  'curve', '', -20);  // curva escote — ctrl negativo = curva hacia adentro
      ln('3t', '3b', 'line');   // referencia media (construcción)

      return { points, lines };
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 10. CUELLO CAMISERO CON PIE (2 piezas) — CLÁSICO DE DOS PIEZAS
  //     Fuente: MANUAL TÉCNICO COMPLETO DE PATRONAJE INDUSTRIAL — NH,
  //     Sección 5, Bloque A.
  //
  //     PIEZA 1 — TIRILLA / PIE DE CUELLO:
  //       Rectángulo: mitad de contorno de cuello (escote/2) × 3cm alto.
  //       Extensión de abotonadura: +1.5cm en el extremo de cierre, con
  //         curva suave (igual técnica que el puño camisero).
  //       Curvatura de asiento: el borde superior sube 1cm en el centro
  //         y se desvanece hacia la mitad del tramo — no es línea recta.
  //
  //     PIEZA 2 — SOLAPA (cuerpo visible del cuello):
  //       Rectángulo: mitad de contorno de cuello (escote/2) × 4.5–5cm alto.
  //       Punta del cuello: se prolonga 1.5–2cm en diagonal más allá de la
  //         esquina del rectángulo, en el extremo de cierre.
  //       Línea de quiebre (borde superior/doblez): concavidad de 0.5cm.
  // ══════════════════════════════════════════════════════════════
  const CUELLO_CON_PIE = {
    nombre: 'Cuello con Pie',
    generar(m, s = 10) {
      const NK = m.neck * 10;
      const SF = s;
      const GAP = 30; // separación entre las dos piezas

      // ── PIEZA 1: TIRILLA / PIE DE CUELLO ────────────────────────
      const AB1 = NK / 2;   // escote/2
      const BC1 = 30;        // 3cm alto

      const A1 = { x: SF + AB1, y: SF,        name: 'A'  };  // cierre
      const B1 = { x: SF,       y: SF,        name: 'B'  };  // doblez/CE
      const C1 = { x: SF,       y: SF + BC1,  name: 'C'  };
      const D1 = { x: SF + AB1, y: SF + BC1,  name: 'D'  };  // cierre (abajo)
      // Extensión de abotonadura: 1.5cm hacia afuera del extremo de cierre
      const E1 = { x: SF + AB1 + 15, y: SF + BC1/2, name: 'E' };
      // Curvatura de asiento: sube 1cm en el centro, se desvanece a la mitad
      const M1 = { x: SF + AB1/2,    y: SF - 10,    name: 'M'  };
      const N1 = { x: SF + AB1*0.75, y: SF,          name: 'N'  };

      // ── PIEZA 2: SOLAPA (cuerpo visible) ────────────────────────
      const yOff = SF + BC1 + GAP + 20; // +2cm para que quepa la extensión
      const AB2  = NK / 2;   // escote/2 (mismo largo que la tirilla)
      const BC2  = 47;        // 4.7cm alto (rango 4.5–5cm)

      const A2 = { x: SF + AB2, y: yOff,        name: 'A2' };
      const B2 = { x: SF,       y: yOff,         name: 'B2' };
      const C2 = { x: SF,       y: yOff + BC2,   name: 'C2' };
      const D2 = { x: SF + AB2, y: yOff + BC2,   name: 'D2' };
      // Punta del cuello: prolonga 1.75cm en diagonal desde la esquina A2
      const P2 = { x: SF + AB2 + 17, y: yOff + 17, name: 'P2' };
      // Línea de quiebre: concavidad de 0.5cm en el centro del borde superior
      const Q2 = { x: SF + AB2/2, y: yOff + 5,    name: 'Q2' };

      const points = {};
      [A1,B1,C1,D1,E1,M1,N1, A2,B2,C2,D2,P2,Q2]
        .forEach((p,i) => { points['cp'+i] = {x:p.x, y:p.y, name:p.name, fx:'', fy:''}; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a,b,t='line',lbl='',ctrl=20){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl,cpx:null,cpy:null,label:lbl}); }

      // ── Tirilla / Pie de cuello ──────────────────────────────────
      ln('B', 'M', 'curve', 'asiento — sube 1cm al centro', -10);
      ln('M', 'N', 'curve', 'asiento se desvanece', 10);
      ln('N', 'A', 'line');
      ln('A', 'E', 'curve', 'extensión de abotonadura +1.5cm', 12);
      ln('E', 'D', 'curve', '', 12);
      ln('D', 'C', 'line');
      ln('C', 'B', 'fold');  // doblez (Centro Espalda de la tirilla)

      // ── Solapa ────────────────────────────────────────────────────
      ln('B2', 'Q2', 'curve', 'línea de quiebre — concavidad 0.5cm', 6);
      ln('Q2', 'A2', 'curve', '', 6);
      ln('A2', 'P2', 'line');   // punta del cuello (prolongación diagonal)
      ln('P2', 'D2', 'line');
      ln('D2', 'C2', 'line');
      ln('C2', 'B2', 'fold');   // doblez (Centro Espalda de la solapa)

      return { points, lines };
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 11. BOLSILLO PARA CAMISA
  //     Fuente: "Bolsillos para Camisa" Nereyda Herrera
  //
  //     A.B = ancho del bolsillo (10–12cm, referencia del patrón delantero)
  //     B.C = ancho + 2cm (largo total)
  //     A.1 = 3cm para dobladillo
  //     3 modelos de base: en pico, en punta recta, semi curva
  // ══════════════════════════════════════════════════════════════
  const BOLSILLO_CAMISA = {
    nombre: 'Bolsillo para Camisa',

    /**
     * NH — Bolsillo para Camisa. 3 modelos: pico, recto, semicurva.
     *
     * Rectángulo base:
     *   B (top-left) — A (top-right)
     *   C (bottom-left) — D (bottom-right)
     *   1L y 1 = marca de dobladillo a 3cm del tope
     *
     * Para PICO: los 4 lados van hasta la altura del pico; centro (M)
     *   queda 1.5cm más abajo que las esquinas inferiores CR/CL
     *   (Manual NH Sección 5: "el pico central baja verticalmente 1.5cm").
     * Para RECTO: fondo recto C→D.
     * Para SEMICURVA: fondo en curva C → M → D.
     */
    generar(m, s = 10, modelo = 'pico') {
      const SF    = s;
      const ancho = 120;          // 12cm (manual NH: bolsillo de parche 12x14cm)
      const largo = ancho + 20;   // 14cm

      const OX = SF;
      const OY = SF;

      const B_ = { x: OX,        y: OY,           name: 'B'  };  // top-left
      const A  = { x: OX+ancho,  y: OY,           name: 'A'  };  // top-right
      // Marcas de dobladillo (3cm desde tope)
      const p1L= { x: OX,        y: OY+30,        name: '1L' };
      const p1 = { x: OX+ancho,  y: OY+30,        name: '1'  };

      let allPts, linesFn;

      if (modelo === 'pico') {
        // Esquinas inferiores al nivel del pico (1.5cm antes del fondo)
        const CL = { x: OX,          y: OY+largo-15, name: 'CL' };
        const CR = { x: OX+ancho,    y: OY+largo-15, name: 'CR' };
        // Pico central 1.5cm más abajo que las esquinas (manual NH)
        const M  = { x: OX+ancho/2,  y: OY+largo,    name: 'M'  };

        allPts = [B_, A, p1L, p1, CL, CR, M];
        linesFn = (ln) => {
          ln('B',  'A',  'line');  // tope (línea de dobladillo)
          ln('B',  'CL', 'line');  // lado izq
          ln('CL', 'M',  'line');  // base izq → pico
          ln('M',  'CR', 'line');  // pico → base der
          ln('CR', 'A',  'line');  // lado der
          ln('p1L','p1', 'line');  // marca dobladillo (guía)
        };
      } else if (modelo === 'semicurva') {
        const C_ = { x: OX,          y: OY+largo, name: 'C'  };
        const D  = { x: OX+ancho,    y: OY+largo, name: 'D'  };
        const M  = { x: OX+ancho/2,  y: OY+largo, name: 'M'  };

        allPts = [B_, A, p1L, p1, C_, D, M];
        linesFn = (ln) => {
          ln('B',  'A',  'line');
          ln('B',  'C',  'line');  // lado izq
          ln('C',  'M',  'curve'); // base izq (semicurva)
          ln('M',  'D',  'curve'); // base der (semicurva)
          ln('D',  'A',  'line');  // lado der
          ln('1L', '1',  'line');  // marca dobladillo
        };
      } else {
        // recto (default)
        const C_ = { x: OX,       y: OY+largo, name: 'C' };
        const D  = { x: OX+ancho, y: OY+largo, name: 'D' };

        allPts = [B_, A, p1L, p1, C_, D];
        linesFn = (ln) => {
          ln('B',  'A',  'line');
          ln('B',  'C',  'line');
          ln('C',  'D',  'line');  // fondo recto
          ln('D',  'A',  'line');
          ln('1L', '1',  'line');  // marca dobladillo
        };
      }

      const points = {};
      allPts.forEach((p,i) => { points['bo'+i] = {x:p.x, y:p.y, name:p.name, fx:'', fy:''}; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a,b,t='line'){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl:20,cpx:null,cpy:null}); }
      linesFn(ln);

      return { points, lines };
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 4.5 PUÑO CAMISERO (pieza independiente)
  //    Fuente: Manual NH, Sección 5 Bloque B — Puño Camisero Clásico.
  //    Antes el "puño" solo existía como el borde inferior de la manga
  //    (sin pieza propia); el manual lo trata como patrón aparte:
  //
  //    Largo = contorno de muñeca + 5cm totales (2cm holgura + 3cm cruce)
  //            [antes el código usaba mitad-contorno+3cm; corregido]
  //    Alto = 6cm
  //    Extensión de abotonadura: +1.5cm en el extremo de cierre
  //    Variantes de esquina (lado doblez, B/C):
  //      - 'redondo'  → curva suave en ambas puntas (default)
  //      - 'angular'  → corte diagonal de 1.5cm en ambas puntas
  // ══════════════════════════════════════════════════════════════
  const PUNO_CAMISA = {
    nombre: 'Puño Camisero',
    autor:  'Nereyda Herrera',

    /**
     * NH — Puño camisero clásico (pieza independiente, se corta x2 en doblez).
     * A = esquina superior izq (cierre/abotonadura) · B = esquina superior
     * der (doblez/CE) · C = esquina inferior der (doblez) · D = esquina
     * inferior izq (cierre) · E = extensión de abotonadura.
     *
     * @param {object} m  { wrist }
     * @param {number} s  margen en mm
     * @param {string} estilo  'redondo' (default) | 'angular'
     */
    generar(m, s = 10, estilo = 'redondo') {
      const PU = (m.wrist || 18) * 10;

      const ancho = PU + 50;       // contorno de muñeca + 5cm (2cm holgura + 3cm cruce)
      const alto  = 60;            // 6cm

      const OX = s;
      const OY = s;

      const A  = { x: OX,          y: OY,          name: 'A' };  // sup-izq (cierre)
      const B_ = { x: OX + ancho,  y: OY,          name: 'B' };  // sup-der (doblez)
      const C_ = { x: OX + ancho,  y: OY + alto,   name: 'C' };  // inf-der (doblez)
      const D  = { x: OX,          y: OY + alto,   name: 'D' };  // inf-izq (cierre)
      // Extensión de abotonadura: 1.5cm hacia afuera del lado de cierre
      const E  = { x: OX - 15,     y: OY + alto/2, name: 'E' };

      const pts = [A, B_, C_, D, E];

      let cornerLines;
      if (estilo === 'angular') {
        // Esquinas en punta del lado doblez: corte diagonal de 1.5cm
        const B1 = { x: OX + ancho - 15, y: OY,            name: 'B1' };
        const B2 = { x: OX + ancho,      y: OY + 15,       name: 'B2' };
        const C1 = { x: OX + ancho,      y: OY + alto - 15,name: 'C1' };
        const C2 = { x: OX + ancho - 15, y: OY + alto,     name: 'C2' };
        pts.push(B1, B2, C1, C2);
        cornerLines = (ln) => {
          ln('A',  'B1', 'line');
          ln('B1', 'B2', 'line');   // corte angular sup
          ln('B2', 'C1', 'fold');   // doblez (CE del puño)
          ln('C1', 'C2', 'line');   // corte angular inf
          ln('C2', 'D',  'line');
        };
      } else {
        // Redondo: curva suave en ambas puntas
        cornerLines = (ln) => {
          ln('A', 'B', 'line');
          ln('B', 'C', 'fold');     // doblez (CE del puño), con curvatura leve
          ln('C', 'D', 'line');
        };
      }

      const points = {};
      pts.forEach((p, i) => { points['pn' + i] = { x: p.x, y: p.y, name: p.name, fx: '', fy: '' }; });
      const byName = {};
      Object.entries(points).forEach(([id, p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a, b, t = 'line', ctrl = 20) {
        if (byName[a] && byName[b]) lines.push({ from: byName[a], to: byName[b], type: t, ctrl, cpx: null, cpy: null });
      }

      cornerLines(ln);
      // Lado de cierre: pasa por la extensión de abotonadura (leve curva
      // hacia afuera, no una esquina recta).
      ln('D', 'E', 'curve', 12);
      ln('E', 'A', 'curve', 12);

      return { points, lines };
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 5. API — obtener medidas por talla
  // ══════════════════════════════════════════════════════════════

  /**
   * Devuelve el objeto de medidas para una talla específica (dama)
   * @param {string} talla - 'SS'|'S'|'M'|'L'|'XL'|'2XL'|'3XL'
   * @returns {object} medidas en cm
   */
  function getMedidasDama(talla) {
    const t = talla.toUpperCase();
    const d = TALLAS_DAMA.medidas;
    const bust = d.bust[t] || 92;
    return {
      bust,
      shoulder:    d.shoulder[t]    || 38,
      backLength:  d.backLength[t]  || 41,
      frontLength: d.frontLength[t] || 44,
      waist:       d.waist[t]       || 70,
      hipDepth:    d.hipDepth[t]    || 18,
      hip:         d.hip[t]         || 96,
      skirtLength: d.skirtLength[t] || 62,
      sleeveShort: d.sleeveShort[t] || 20,
      armCirc:     d.armCirc[t]     || 28,
      sleeveLength:d.sleeveLong[t]  || 53,
      wrist:       d.wrist[t]       || 16,
      neck:        Math.round(bust * 0.39), // aprox cuello dama
      totalLength: d.frontLength[t] || 44,
    };
  }

  /**
   * Devuelve medidas para una talla de caballero
   * @param {string} talla - '32'|'34'|'36'|'38'|'40'|'42'|'44'
   */
  function getMedidasCaballero(talla) {
    const d = TALLAS_CABALLERO.medidas;
    return {
      bust:        d.bust[talla]        || 92,
      shoulder:    d.shoulder[talla]    || 42,
      totalLength: d.shirtLength[talla] || 70,
      neck:        d.neck[talla]        || 40,
      sleeveShort: d.sleeveShort[talla] || 20,
      armCirc:     d.armCirc[talla]     || 32,
      sleeveLength:d.sleeveLong[talla]  || 58,
      wrist:       d.wrist[talla]       || 20,
    };
  }

  /**
   * Genera un bloque listo para guardar en PAT.Bloques
   * Piezas soportadas:
   *   Dama:      blusa-trasera, camisa-delantera,
   *              manga-corta-vestido, manga-larga-vestido,
   *              cuello-sport, cuello-con-pie, bolsillo-pico,
   *              bolsillo-recto, bolsillo-semicurva
   *   Caballero: camisa-posterior, manga-corta-camisa, manga-larga-camisa
   */
  // ══════════════════════════════════════════════════════════════
  // NOTAS DIDÁCTICAS — explicación de cada punto por pieza
  // Al hacer clic en un punto en el canvas, se muestra esta nota.
  // ══════════════════════════════════════════════════════════════
  const NOTAS_NH = {
    'blusa-trasera': {
      'A':  'Centro Espalda (arriba) — punto de origen. Aquí empieza el doblez de la espalda.',
      'B':  'Ancho del cuerpo: pecho/4 + 2cm de holgura. Define el ancho total de la mitad de la blusa.',
      'D':  'Centro Espalda (abajo) — línea de doblez. El patrón se corta en doblez desde A hasta D.',
      'D1': 'Referencia de largo: marca el dobladillo inferior en el CE.',
      '5':  'Profundidad del escote posterior: 2cm hacia abajo desde A. El escote de espalda no es recto, baja ligeramente.',
      '4':  'Ancho del escote: cuello/4 + 1cm desde el CE. Define cuánto se abre el cuello hacia el hombro.',
      '4a': 'Punto elevado del escote: se sube 1cm desde el punto 4 para crear la curva natural del cuello posterior.',
      '2a': 'Tip de hombro: espalda/2 desde el punto de cuello (4a). Marca el extremo del hombro.',
      '2':  'Caída del hombro: se baja 1.5–2cm desde 2a. Los hombros no son horizontales, tienen una inclinación natural.',
      '3':  'Nivel de sisa (base): pecho/8 + 2cm hacia abajo desde el hombro. Define dónde termina la sisa y empieza el costado.',
      'SM': 'Punto de referencia de sisa NH: 1cm hacia adentro desde el punto medio de la línea recta 2→3. No es parte del contorno — define la profundidad de la curva de la sisa.',
      'F':  'Punto de axila (underarm): en la línea de sisa, define el ancho del cuerpo a nivel axilar.',
      '6':  'Punto de cintura: con un pequeño entalle (2–3cm hacia adentro desde el costado) para dar forma a la silueta.',
      'C':  'Esquina inferior del costado: punto donde el costado se une al dobladillo.',
      '7':  'Centro de la pinza trasera: mitad del tramo de cintura (de CB al costado). Desde aquí la pinza sube a la sisa y baja a la cadera.',
      '7T': 'Ápice superior de la pinza: sube en recta hasta la altura de la sisa.',
      '7B': 'Ápice inferior de la pinza: baja en recta hasta la línea de cadera.',
      '9L': 'Ancho de la pinza (izq): 1.5cm a la izquierda del centro, en la línea de cintura.',
      '9R': 'Ancho de la pinza (der): 1.5cm a la derecha del centro, en la línea de cintura. Junto con 9L y los ápices forma el rombo de la pinza.',
    },
    'blusa-delantera': {
      'A':   'CF arriba (origen): centro frente superior. A.B = busto/4 + 2cm de ancho.',
      'B':   'Costado arriba: esquina superior del lado del costado.',
      'C':   'Costado abajo: cierra el dobladillo junto con D.',
      'D':   'CF abajo: esquina inferior del centro frente.',
      '1':   'Escote horizontal: espalda/6 desde A, hacia el costado.',
      '5':   'Escote vertical: espalda/6 + 2cm desde A, hacia abajo. Forma una curva profunda con el punto 1 (el escote delantero de dama baja más que el de la espalda).',
      'H':   'Caída de hombro: 5cm sobre la guía de espalda/2 (homologada con la trasera) — 1cm más que la espalda por el volumen del busto.',
      '6':   'Punto de cintura en el costado: cintura/4 + 3cm.',
      '10':  'Inicio de la pinza de costado: a nivel medio del cuerpo, en el costado.',
      '11':  'Entrada de la pinza de costado: 1cm hacia adentro desde el punto 10.',
      '12':  'Salida de la pinza de costado: extrae la diferencia entre el talle delantero y el posterior, para igualar ambas piezas al coser.',
      'PB':  'Ápice de la pinza de busto: muere aprox. 2cm antes de la altura del pezón. Posición horizontal aproximada (el manual no da una coordenada exacta) — ajustable con fx/fy si no coincide con el punto real de busto de la clienta.',
      'PBL': 'Base izquierda de la pinza de busto (1.5cm del centro), en la línea de cintura.',
      'PBR': 'Base derecha de la pinza de busto (1.5cm del centro), en la línea de cintura. Junto con PB y PBL forma la pinza tipo rombo.',
      '14':  'Vista de botonadura: margen de 7cm desde el CF.',
      '14D': 'Esquina inferior de la vista, a la altura del dobladillo.',
    },
    'camisa-delantera': {
      'A':   'CF arriba-izquierda (origen): centro frente superior. A.B = pecho/4 + 2cm de ancho; B.C = largo + 2cm de holgura anatómica.',
      'B':   'Costado arriba-derecha: esquina superior del lado del costado. Punto de referencia del rectángulo — no es contorno.',
      'C':   'Costado abajo-derecha: esquina inferior del costado. Junto con D cierra el dobladillo.',
      'D':   'CF abajo-izquierda: esquina inferior del centro frente. El dobladillo va de D→C.',
      '1':   'Ancho del escote (A.1): cuello/6 − 1cm hacia la derecha desde A — misma fórmula homologada con el escote trasero. Se une con el punto 9 en curva cóncava, y con el punto 13 en línea recta (caída de hombro).',
      '9':   'Profundidad del escote (A.9): cuello/6 hacia abajo desde A, en la línea CF. Curva con el punto 1 (regla curva francesa).',
      '8':   'Guía de hombro sobre la línea A→B: en el eje espalda/2. Punto de construcción — no es vértice del contorno.',
      '10':  'Guía sobre la línea de sisa, misma x que el punto 8. Punto de construcción.',
      '11':  'El punto 10 sube 1cm en dirección a la línea A→B. Punto de construcción.',
      '12':  'El punto 8 baja 1cm. Punto de construcción interno (ajuste de control).',
      '13':  'Caída de hombro real: el punto 11 se mete 1cm en dirección a la línea B→C. Es el vértice donde termina el hombro (13→1) y empieza la semicurva de la sisa (2→13).',
      '2':   'Línea de sisa homologada con la espalda (canesú + canesú-2cm) — garantiza que ambas sisas (delantera y posterior) midan lo mismo. La semicurva va de 2 a 13.',
      'E':   'Nivel medio del costado (referencia): mitad entre la sisa y el dobladillo.',
      'F':   'Punto de entalle: 1cm hacia adentro desde E.',
      'L2':  'Línea de referencia para el bolsillo: pecho/4 + 1cm desde A, en dirección al punto D (vertical, sobre la línea CF). No es el ancho de escote.',
      'BOLS':'Punto de referencia del bolsillo: 2 a 2.5cm por debajo de la línea L2 (posición horizontal estimada, ajustable).',
      '14':  'Vista (ojal y botón), estilo Sport — A.14: margen de 9cm desde el CF.',
      '14D': 'Esquina inferior de la vista: igual posición que punto 14 pero a la altura del dobladillo. La línea 14→14D es el doblez de la vista.',
      '14T': 'Esquina superior cuadrada de la vista: a la altura del pico (punto A). La vista sube recta y gira en ángulo recto, no en pico diagonal.',
    },
    'camisa-posterior': {
      'B':  'Centro Espalda arriba (referencia): el contorno real empieza 1cm más abajo, en el punto "a".',
      'A':  'Esquina superior derecha (costado): ancho del cuerpo — pecho/4 + 2cm.',
      'D':  'Costado abajo: cierra el cuerpo verticalmente.',
      'C':  'Centro Espalda abajo: cierra el dobladillo.',
      'a':  'Caída de escote: el Centro Espalda baja 1cm para que el cuello quede bien sentado al doblar.',
      '1':  'Ancho de escote trasero: cuello/6 − 1cm sobre la línea superior, desde "a".',
      'CAN':'Profundidad del canesú: cuello/6 desde el Centro Espalda, hacia abajo.',
      '2':  'Línea de sisa: canesú + (cuello/6 − 2cm), proyectada horizontal hasta el costado.',
      '3':  'Punto guía de hombro: en el eje de espalda/2, 4cm bajo la línea superior.',
      '4':  'Punto real del hombro: prolongación de la línea 1→3, 1cm más afuera.',
      'G':  'Holgura ergonómica del hombro: 1cm arriba del punto 3, para la curvatura natural de la espalda.',
      'G2': 'G bajado en recta hasta la línea de sisa — desde aquí arranca la semicurva de la sisa hasta el punto 2.',
      'E':  'Nivel medio del costado (referencia): mitad entre la sisa y el dobladillo.',
      'F':  'Punto de entalle: 1cm hacia adentro desde E. Da forma a la cintura de la camisa.',
    },
    'manga-corta-camisa': {
      'A':  'Sisa izquierda: punto base de la cabeza de manga en el lado izquierdo. Se une a la sisa de la blusa/camisa.',
      'B':  'Sisa derecha: punto base de la cabeza de manga en el lado derecho.',
      'P':  'Pico de la cabeza de manga: pecho/10 + 1cm por encima de la línea de sisa. Es el punto más alto de la manga — más alto = manga con mejor cabeza de manga.',
      'C':  'Esquina inferior derecha (ruedo): donde termina el largo de manga en el costado derecho.',
      'D':  'Esquina inferior izquierda (ruedo): donde termina el largo de manga en el costado izquierdo.',
      '1':  'Referencia NH: pecho/10 + 1cm desde A. Define el punto de inflexión de la curva de sisa en el lado izquierdo.',
      '2':  'Referencia NH: mitad de A→1. Divide la cabeza de manga en cuartos para controlar la curva.',
      '3':  'Referencia NH: cuarta parte del tramo horizontal de sisa (d1/4) desde A.',
      '4':  'Mitad de la vertical izquierda (A→D): punto de referencia a media altura de la manga.',
      '5':  'Descuento de puño: sube 5-6cm desde el punto C (esquina derecha del ruedo). Solo en manga larga.',
      '6':  'Descuento de puño: ancho = mitad del contorno de puño + 3cm, desde D. Define el ancho final del ruedo tras los pliegues/abertura. Solo en manga larga.',
    },
    'manga-corta-vestido': {
      'A':  'Sisa izquierda: punto base de la cabeza de manga para vestido.',
      'B':  'Sisa derecha: punto base de la cabeza de manga para vestido.',
      'P':  'Pico de la cabeza de manga: busto/10 + 3cm por encima de la sisa. La cabeza de manga de vestido es más alta que la de camisa para dar más amplitud de movimiento.',
      'C':  'Ruedo derecho: fin del largo de manga.',
      'D':  'Ruedo izquierdo: fin del largo de manga.',
      '4':  'Centro de la manga: mitad del ancho. Alinea con la costura del hombro al coser.',
      '5':  'Referencia de puño: mitad del largo. En mangas largas indica donde puede ir el punto de entalle.',
    },
    'cuello-sport': {
      'A':  'Extremo derecho del cuello: el largo A→B = escote/2 (mitad del contorno de escote de la blusa).',
      'B':  'Extremo izquierdo del cuello (doblez): aquí se marca DOBLAR. El cuello se corta en doblez para obtener ambas mitades simétricas.',
      'C':  'Esquina inferior izquierda: define el ancho del cuello (6cm).',
      'D':  'Esquina inferior derecha (doblez): coincide con B al doblar la tela.',
      '1':  'Punto de curva en el extremo: cuello/4 + 1cm desde A para dar la curva que va hacia el cuello de la blusa.',
      '2':  'Punto de caída inferior: 1–2cm hacia abajo desde B. Define la línea curva del borde inferior del cuello.',
      '3':  'Centro del cuello (ancho): mitad de A→B en el borde superior y en el inferior. Ayuda a trazar la línea central.',
    },
    'cuello-con-pie': {
      'A':  'Tirilla — extremo de cierre: el cuerpo mide escote/2 de largo.',
      'B':  'Tirilla — doblez (CE): aquí se coloca el Centro Espalda de la tirilla.',
      'C':  'Tirilla — esquina inferior del doblez.',
      'D':  'Tirilla — esquina inferior de cierre.',
      'E':  'Tirilla — extensión de abotonadura: 1.5cm hacia afuera del extremo de cierre, con curva suave.',
      'M':  'Tirilla — curvatura de asiento: el borde superior sube 1cm en el centro.',
      'N':  'Tirilla — el asiento se desvanece (vuelve a la línea recta) a la mitad del tramo.',
      'A2': 'Solapa — esquina de cierre del cuerpo visible del cuello (escote/2 de largo).',
      'B2': 'Solapa — doblez (CE): Centro Espalda de la solapa.',
      'C2': 'Solapa — esquina inferior del doblez.',
      'D2': 'Solapa — esquina inferior de cierre.',
      'P2': 'Solapa — punta del cuello: prolongada 1.75cm en diagonal más allá de la esquina A2.',
      'Q2': 'Solapa — línea de quiebre: concavidad de 0.5cm en el centro del borde superior (doblez).',
    },
    'bolsillo-pico':      { 'B': 'Esquina superior izquierda del bolsillo.', 'A': 'Esquina superior derecha del bolsillo.', '1L': 'Marca de dobladillo izquierda: 3cm desde la parte superior. El dobladillo se dobla hacia adentro para terminar el borde superior.', '1': 'Marca de dobladillo derecha: 3cm desde arriba.', 'CL': 'Esquina inferior izquierda: altura donde comienza el pico.', 'CR': 'Esquina inferior derecha: altura donde comienza el pico.', 'M': 'Pico central: punto más bajo del bolsillo, 1.5cm debajo de las esquinas (manual NH). Le da el acabado decorativo en V.' },
    'bolsillo-recto':     { 'B': 'Esquina superior izquierda.', 'A': 'Esquina superior derecha.', '1L': 'Marca de dobladillo izquierda (3cm desde arriba).', '1': 'Marca de dobladillo derecha (3cm desde arriba).', 'C': 'Esquina inferior izquierda: fondo recto del bolsillo.', 'D': 'Esquina inferior derecha: fondo recto del bolsillo.' },
    'bolsillo-semicurva': { 'B': 'Esquina superior izquierda.', 'A': 'Esquina superior derecha.', '1L': 'Marca de dobladillo izquierda (3cm desde arriba).', '1': 'Marca de dobladillo derecha (3cm desde arriba).', 'C': 'Esquina inferior izquierda: inicio de la semicurva.', 'M': 'Punto central inferior: define la profundidad de la semicurva. La curva C→M→D da el redondeado del bolsillo.', 'D': 'Esquina inferior derecha: fin de la semicurva.' },
    'puno-camisa': {
      'A': 'Esquina superior del lado de cierre/abotonadura.',
      'B': 'Esquina superior del lado de doblez (Centro Espalda del puño) — aquí se dobla la tela al cortar.',
      'C': 'Esquina inferior del doblez: coincide con B al doblar.',
      'D': 'Esquina inferior del lado de cierre: se une al ruedo de la manga.',
      'E': 'Extensión de abotonadura: 1.5cm hacia afuera del lado de cierre, con leve curva.',
    },
  };

  function generarBloque(pieza, medidas, talla = 'S') {
    let resultado, nombre, categoria;

    switch (pieza) {
      case 'blusa-trasera':
        resultado = BLUSA_TRASERA.generar(medidas);
        nombre    = `Blusa Trasera NH — Talla ${talla}`;
        categoria = 'espalda';
        break;

      case 'blusa-delantera':
        resultado = BLUSA_DELANTERA.generar(medidas);
        nombre    = `Blusa Delantera NH — Talla ${talla}`;
        categoria = 'frente';
        break;

      case 'camisa-posterior':
        resultado = CAMISA_POSTERIOR.generar(medidas);
        nombre    = `Camisa Posterior NH — Talla ${talla}`;
        categoria = 'espalda';
        break;

      case 'camisa-delantera':
        resultado = CAMISA_DELANTERA.generar(medidas);
        nombre    = `Camisa Delantera NH — Talla ${talla}`;
        categoria = 'frente';
        break;

      case 'manga-corta-camisa':
        resultado = MANGA_CAMISA.generar(medidas, 10, 'corta');
        nombre    = `Manga Corta Camisa NH — Talla ${talla}`;
        categoria = 'manga';
        break;

      case 'manga-larga-camisa':
        resultado = MANGA_CAMISA.generar(medidas, 10, 'larga');
        nombre    = `Manga Larga Camisa NH — Talla ${talla}`;
        categoria = 'manga';
        break;

      case 'manga-corta-vestido':
        resultado = MANGA_VESTIDO.generar(medidas, 10, 'corta');
        nombre    = `Manga Corta Vestido NH — Talla ${talla}`;
        categoria = 'manga';
        break;

      case 'manga-larga-vestido':
        resultado = MANGA_VESTIDO.generar(medidas, 10, 'larga');
        nombre    = `Manga Larga Vestido NH — Talla ${talla}`;
        categoria = 'manga';
        break;

      case 'cuello-sport':
        resultado = CUELLO_SPORT.generar(medidas);
        nombre    = `Cuello Sport NH — Talla ${talla}`;
        categoria = 'otro';
        break;

      case 'cuello-con-pie':
        resultado = CUELLO_CON_PIE.generar(medidas);
        nombre    = `Cuello con Pie NH — Talla ${talla}`;
        categoria = 'otro';
        break;

      case 'bolsillo-pico':
        resultado = BOLSILLO_CAMISA.generar(medidas, 10, 'pico');
        nombre    = `Bolsillo en Pico NH`;
        categoria = 'otro';
        break;

      case 'bolsillo-recto':
        resultado = BOLSILLO_CAMISA.generar(medidas, 10, 'recto');
        nombre    = `Bolsillo Recto NH`;
        categoria = 'otro';
        break;

      case 'bolsillo-semicurva':
        resultado = BOLSILLO_CAMISA.generar(medidas, 10, 'semicurva');
        nombre    = `Bolsillo Semicurva NH`;
        categoria = 'otro';
        break;

      case 'puno-camisa':
        resultado = PUNO_CAMISA.generar(medidas);
        nombre    = `Puño Camisero NH — Talla ${talla}`;
        categoria = 'otro';
        break;

      default:
        throw new Error('Pieza no reconocida: ' + pieza);
    }

    // Adjuntar notas didácticas a cada punto
    const notasPieza = NOTAS_NH[pieza] || {};
    Object.values(resultado.points).forEach(pt => {
      pt.nota = notasPieza[pt.name] || '';
    });

    return {
      name:        nombre,
      categoria,
      sistema:     NOMBRE,
      descripcion: `Generado automáticamente — Sistema ${NOMBRE} v${VERSION}. Talla ${talla}.`,
      points:      resultado.points,
      lines:       resultado.lines,
      ptCtr:       Object.keys(resultado.points).length,
      medidasBase: medidas,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 12. REGISTRAR EN EL TRAZADOR (para el menú de sistemas)
  // ══════════════════════════════════════════════════════════════
  PAT.Sistemas.NereydaHerrera = {
    nombre: NOMBRE,
    version: VERSION,
    tallasDisponibles: {
      dama:      TALLAS_DAMA.etiquetas,
      caballero: TALLAS_CABALLERO.etiquetas,
    },
    getMedidasDama,
    getMedidasCaballero,
    generarBloque,
    tablasDama:      TALLAS_DAMA,
    tablasCaballero: TALLAS_CABALLERO,
    // Acceso directo a módulos
    blusaTrasera:    BLUSA_TRASERA,
    blusaDelantera:  BLUSA_DELANTERA,
    camisaPosterior: CAMISA_POSTERIOR,
    camisaDelantera: CAMISA_DELANTERA,
    mangaCamisa:     MANGA_CAMISA,
    mangaVestido:    MANGA_VESTIDO,
    cuelloSport:     CUELLO_SPORT,
    cuelloConPie:    CUELLO_CON_PIE,
    bolsilloCamisa:  BOLSILLO_CAMISA,
    punoCamisa:      PUNO_CAMISA,
    // Tabla Atelier Escuela
    tablasAtelierCab: TALLAS_ATELIER_CAB,
    // Lista de piezas para UI
    // ── Lista plana para compatibilidad con código legado ──────────
    piezasDama: [
      { id: 'blusa-trasera',       label: 'Blusa Trasera',          tipo: 'dama'      },
      { id: 'blusa-delantera',     label: 'Blusa Delantera',        tipo: 'dama'      },
      { id: 'camisa-delantera',    label: 'Camisa Delantera',       tipo: 'dama'      },
      { id: 'manga-corta-vestido', label: 'Manga Corta (Vestido)',  tipo: 'dama'      },
      { id: 'manga-larga-vestido', label: 'Manga Larga (Vestido)',  tipo: 'dama'      },
      { id: 'cuello-sport',        label: 'Cuello Sport',           tipo: 'dama'      },
      { id: 'cuello-con-pie',      label: 'Cuello con Pie',         tipo: 'dama'      },
      { id: 'bolsillo-pico',       label: 'Bolsillo en Pico',       tipo: 'dama'      },
      { id: 'bolsillo-recto',      label: 'Bolsillo Recto',         tipo: 'dama'      },
      { id: 'bolsillo-semicurva',  label: 'Bolsillo Semicurva',     tipo: 'dama'      },
    ],
    piezasCaballero: [
      { id: 'camisa-posterior',    label: 'Camisa Posterior',       tipo: 'caballero' },
      { id: 'manga-corta-camisa',  label: 'Manga Corta (Camisa)',   tipo: 'caballero' },
      { id: 'manga-larga-camisa',  label: 'Manga Larga (Camisa)',   tipo: 'caballero' },
      { id: 'cuello-sport',        label: 'Cuello Sport',           tipo: 'caballero' },
      { id: 'cuello-con-pie',      label: 'Cuello con Pie',         tipo: 'caballero' },
      { id: 'bolsillo-pico',       label: 'Bolsillo en Pico',       tipo: 'caballero' },
      { id: 'puno-camisa',         label: 'Puño Camisero',          tipo: 'caballero' },
    ],
    // ── Agrupado por categoría (para dropdown ordenado sin duplicados) ──
    piezasGrupos: [
      {
        titulo: '👗 Blusa / Vestido',
        piezas: [
          { id: 'blusa-trasera',       label: 'Blusa Trasera',         tipo: 'dama' },
          { id: 'blusa-delantera',     label: 'Blusa Delantera',       tipo: 'dama' },
          { id: 'manga-corta-vestido', label: 'Manga Corta (Vestido)', tipo: 'dama' },
          { id: 'manga-larga-vestido', label: 'Manga Larga (Vestido)', tipo: 'dama' },
        ],
      },
      {
        titulo: '👔 Camisa',
        piezas: [
          { id: 'camisa-delantera',    label: 'Camisa Delantera',      tipo: 'dama'      },
          { id: 'camisa-posterior',    label: 'Camisa Posterior',      tipo: 'caballero' },
          { id: 'manga-corta-camisa',  label: 'Manga Corta (Camisa)',  tipo: 'caballero' },
          { id: 'manga-larga-camisa',  label: 'Manga Larga (Camisa)',  tipo: 'caballero' },
        ],
      },
      {
        titulo: '🔧 Accesorios',
        piezas: [
          { id: 'cuello-sport',        label: 'Cuello Sport',          tipo: 'ambos' },
          { id: 'cuello-con-pie',      label: 'Cuello con Pie',        tipo: 'ambos' },
          { id: 'bolsillo-pico',       label: 'Bolsillo en Pico',      tipo: 'ambos' },
          { id: 'bolsillo-recto',      label: 'Bolsillo Recto',        tipo: 'dama'  },
          { id: 'bolsillo-semicurva',  label: 'Bolsillo Semicurva',    tipo: 'dama'  },
          { id: 'puno-camisa',         label: 'Puño Camisero',         tipo: 'caballero' },
        ],
      },
    ],
  };

  return PAT.Sistemas.NereydaHerrera;

})();

console.log('[PatrónAI] Sistema Nereyda Herrera cargado ✓');
