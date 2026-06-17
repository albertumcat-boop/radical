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

      // ── PINZA TRASERA ─────────────────────────────────────────
      // 7 = mitad entre E y p3 (centro de la pinza)
      const p7  = { x: (E.x + p3.x) / 2,  y: p3.y,      name:'7'  };
      const p8  = { x: p7.x,               y: p3.y + 50,  name:'8'  };
      const p9L = { x: p7.x - 15,          y: p8.y,       name:'9L' };
      const p9R = { x: p7.x + 15,          y: p8.y,       name:'9R' };

      // ── Ensamblar puntos ──────────────────────────────────────
      const points = {};
      [A, B_, C_, D, p1, p2, p3, p4, p2a, p4a, p5, p6,
       E, F, SM, D1, D2, p7, p8, p9L, p9R]
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
      // 'dart' la excluye del relleno (antes era 'line' y ensuciaba la silueta).
      ln('7',  '8',   'dart');
      ln('8',  '9L',  'dart');
      ln('8',  '9R',  'dart');

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
  // 4. FÓRMULAS — CAMISA PARTE POSTERIOR (CABALLERO)
  //    Fuente: "Trazado de Camisa Parte Posterior" Nereyda Herrera
  //
  //    LECTURA DEL DOCUMENTO:
  //    - Rectángulo: tórax/4 + 2cm (ancho) × largo camisa (alto)
  //      (nota manuscrita: A movimiento ±2cm holgado o ajustado)
  //    - A.1  = cuello/6 - 1cm
  //    - A.2  = cuello/4 + 1cm
  //    - A.3  = cuello/6
  //    - 3.4  = cuello/6 - 2cm
  //    - A.5  = espalda/2 (mitad ancho espalda)
  //    - 5.6  = 1cm
  //    - 6.7  = 1cm
  //    - Trace la sisa en semicurva
  //    - E    = mitad de 2.D (mitad del largo)
  //    - E.F  = 1cm (entalle en costado)
  //    - G    = 5 a 8cm aprox (tiro/bajo del canesú)
  //    - A.a  = subir 1cm (en la curva posterior del cuello)
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
    generar(m, s = 10) {
      const T   = m.bust * 10;
      const NK  = m.neck * 10;
      const ESP = m.shoulder * 10;
      const LC  = (m.totalLength || 68) * 10;

      const HOLGURA = 20;  // 2cm holgura

      const OX = s;        // margen izquierdo = CB
      const OY = s + 30;   // margen superior (+3cm para que 'a' quede visible)

      const rectW = T / 4 + HOLGURA;
      const rectH = LC;

      // CB = IZQUIERDA, costado/sisa = DERECHA
      const B_  = { x: OX,           y: OY,           name: 'B'  };  // CB top
      const A   = { x: OX + rectW,   y: OY,           name: 'A'  };  // sisa top
      const D   = { x: OX + rectW,   y: OY + rectH,   name: 'D'  };  // sisa bottom
      const C_  = { x: OX,           y: OY + rectH,   name: 'C'  };  // CB bottom

      // ── CUELLO ────────────────────────────────────────────────
      // A.1 = cuello/6 - 1cm (profundidad escote posterior)
      const p1  = { x: OX + rectW,             y: OY + NK/6 - 10,     name: '1'  };
      // A.2 = cuello/4 + 1cm (ancho escote lateral)
      const p2  = { x: OX + rectW - (NK/4+10), y: OY,                 name: '2'  };
      // A.3 = cuello/6 (ancho cuello en hombro)
      const p3  = { x: OX + rectW - NK/6,      y: OY,                 name: '3'  };
      // 3.4 = cuello/6 - 2cm (punto de curva escote)
      const p4  = { x: OX + rectW - NK/6,      y: OY + NK/6 - 20,     name: '4'  };
      // A.a = subir 1cm (punto cuello elevado — queda dentro del margen OY)
      const pa  = { x: OX + rectW,             y: OY - 10,            name: 'a'  };

      // ── HOMBRO Y SISA ─────────────────────────────────────────
      // A.5 = espalda/2 (mitad ancho espalda desde costado)
      const p5  = { x: OX + rectW - ESP/2,     y: OY,                 name: '5'  };
      // 5.6 = 1cm hacia abajo
      const p6  = { x: OX + rectW - ESP/2,     y: OY + 10,            name: '6'  };
      // 6.7 = 1cm hacia CB (hacia adentro, para la sisa)
      const p7  = { x: OX + rectW - ESP/2 - 10, y: OY + 10,           name: '7'  };

      // ── CANESÚ ────────────────────────────────────────────────
      // G = 6cm bajo el hombro en CB
      const G   = { x: OX,                     y: OY + 60,            name: 'G'  };
      // Nivel sisa para canesú (inferior al hombro)
      const p2D = { x: OX,                     y: OY + NK/4 + 30,     name: '2D' };

      // ── ENTALLE ───────────────────────────────────────────────
      // E = mitad del largo (en el costado)
      const E   = { x: OX + rectW,             y: OY + rectH/2,       name: 'E'  };
      // E.F = 1cm de entalle hacia adentro
      const F   = { x: OX + rectW - 10,        y: OY + rectH/2,       name: 'F'  };

      const points = {};
      [B_, A, D, C_, p1, p2, p3, p4, pa, p5, p6, p7, G, p2D, E, F]
        .forEach((p, i) => { points['nc'+i] = {x:p.x, y:p.y, name:p.name, fx:'', fy:''}; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a, b, type='line', lbl='', ctrl=20) {
        if (byName[a] && byName[b])
          lines.push({ from:byName[a], to:byName[b], type, ctrl, cpx:null, cpy:null });
      }

      // ── Contorno principal ─────────────────────────────────────
      // CB doblez (izquierda)
      ln('C',  'B',  'fold');
      // Dobladillo
      ln('C',  'D',  'line');
      // Costado (con entalle leve)
      ln('D',  'F',  'line');
      ln('F',  'a',  'line');
      // Cuello y escote
      ln('a',  '1',  'line');
      ln('1',  '4',  'curve');   // escote posterior — ctrl=20 curva hacia arriba (correcto)
      ln('4',  '3',  'curve');   // cuello→hombro — ctrl=20 curva hacia el centro (correcto)
      // Hombro y sisa
      ln('3',  '5',  'line');
      ln('5',  '6',  'line');
      // 6→7 es solo 1cm horizontal; ctrl pequeño para no deformar el arco
      ln('6',  '7',  'curve', '', 5);
      // Canesú / armhole base
      ln('7',  '2D', 'line');
      ln('2D', 'B',  'line');

      // Referencias — 'construction' (no 'line') para que no se cuelen
      // como bordes falsos dentro del contorno relleno.
      ln('B',  'A',  'construction');    // tope superior
      ln('E',  'F',  'construction');    // referencia entalle

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
  //    A.B   = pecho/4 + 2cm
  //    B.C   = largo camisa
  //    A.1   = cuello/6 - 1cm     (prof. escote)
  //    A.2   = pecho/4 + 1cm      (ancho escote)
  //    A.8   = cuello/6            (ancho cuello)
  //    A.9   = cuello/6            (ídem, referencia)
  //    1.10  = espalda/2           (mitad ancho espalda)
  //    10.11 = 1cm
  //    8.12  = 1cm
  //    11.13 = 1cm
  //    A.14  = cuello/6 (sport) o 9cm fijo (vista ojal)
  //    Bolsillo: referencia 2–2.5cm de línea 2, ancho 10–12cm
  // ══════════════════════════════════════════════════════════════
  const CAMISA_DELANTERA = {
    nombre: 'Camisa Parte Delantera',

    /**
     * NH — Trazado de Camisa Parte Delantera.
     * Sigue el procedimiento numerado del manual NH (imagen):
     *   A = CF arriba-izq, B = costado arriba-der,
     *   C = costado abajo-der, D = CF abajo-izq.
     *   Puntos 1,2,8,10,11,12,13,14 son puntos de construcción
     *   visibles en el canvas para verificar medidas.
     *
     * @param {object} m  { bust, shoulder, neck, totalLength }
     * @param {number} s  margen en mm
     */
    generar(m, s = 10) {
      const T   = m.bust * 10;
      const NK  = m.neck * 10;
      const ESP = m.shoulder * 10;
      const LC  = (m.totalLength || m.frontLength || 65) * 10;

      // Margen extra a la izquierda para que la vista (9cm) quepa
      const OX = s + 100;
      const OY = s;

      // ── Rectángulo base ──────────────────────────────────────────
      const RW = T / 4 + 20;   // A.B  pecho/4 + 2cm (ancho)
      const RH = LC;             // B.C  largo de camisa

      const A  = { x: OX,       y: OY,       name: 'A'  };  // CF top-izq
      const B_ = { x: OX + RW,  y: OY,       name: 'B'  };  // costado top-der
      const C_ = { x: OX + RW,  y: OY + RH,  name: 'C'  };  // costado bot-der
      const D  = { x: OX,       y: OY + RH,  name: 'D'  };  // CF bot-izq

      // ── Puntos de construcción NH (manual, sec. Delantera) ───────

      // A.1  sexta parte del cuello - 1cm  (profundidad escote en CF, hacia abajo)
      const p1  = { x: OX,            y: OY + NK/6 - 10,     name: '1'  };

      // A.2  pecho/4 + 1cm  (nivel de sisa — línea horizontal de verificación)
      const p2  = { x: OX,            y: OY + T/4 + 10,      name: '2'  };

      // A.8  sexta parte del contorno del cuello  (ancho del escote hacia costado)
      const p8  = { x: OX + NK/6,     y: OY,                  name: '8'  };

      // A.9  sexta parte del cuello (completa, sin restar 1cm) hacia ABAJO
      // en la línea AD (CF). Queda más abajo que el punto 1 (que es cuello/6-1cm).
      // El escote real pasa por este punto, no por el 1 — el punto 1 es solo
      // una referencia de construcción intermedia.
      const p9  = { x: OX,            y: OY + NK/6,           name: '9'  };

      // 1.10  mitad del ancho de espalda desde p1  (posición del tip de hombro)
      const p10 = { x: OX + ESP/2,    y: OY + NK/6 - 10,     name: '10' };

      // 10.11  1cm hacia abajo  (caída del hombro)
      const p11 = { x: OX + ESP/2,    y: OY + NK/6,           name: '11' };

      // 8.12  1cm hacia abajo desde p8  (curva de arranque cuello-hombro)
      const p12 = { x: OX + NK/6,     y: OY + 10,             name: '12' };

      // 11.13  1cm hacia abajo desde p11  (inicio de la sisa)
      const p13 = { x: OX + ESP/2,    y: OY + NK/6 + 10,     name: '13' };

      // Punto de sisa lado costado (mismo y que p2, en la columna derecha)
      const p2b = { x: OX + RW,       y: OY + T/4 + 10,      name: '2b' };

      // 2b.2c  1cm hacia ADENTRO desde 2b (entrada de sisa) — crea el óvalo
      // de la axila: la sisa no es un solo arco recto de 2b a 13, sino que
      // pasa primero por este punto interior antes de subir al hombro.
      const p2c = { x: OX + RW - 10,  y: OY + T/4 + 10,      name: '2c' };

      // A.14  9cm a la izquierda, a la altura del escote REAL (punto 9),
      // no a la altura de A. A ya no es parte del contorno (el escote
      // termina en 9, más abajo que A) — si 14 quedara a la altura de A,
      // la línea 9→14 tendría que subir en diagonal de golpe, creando un
      // "pico" falso justo donde va el ojal/botón. Poniendo 14 a la misma
      // altura que 9, la línea 9→14 queda horizontal y la vista nace
      // limpiamente desde el final real del escote.
      const p14  = { x: OX - 90,      y: OY + NK/6,           name: '14' };
      const p14b = { x: OX - 90,      y: OY + RH,             name: '14D' };

      // 14T  esquina superior de la vista, a la altura del PICO (punto A).
      // El usuario pidió que la vista (donde van ojal y botón) suba hasta
      // la altura del pico pero en forma de CUADRADO (línea recta arriba),
      // no como un pico diagonal: 9→A (sube recto por la línea CF) →
      // 14T (línea horizontal arriba, a la altura de A) → 14 (baja recto
      // hasta la altura real del escote, punto 9) → 14D (sigue hacia abajo).
      const p14t = { x: OX - 90,      y: OY,                  name: '14T' };

      // ── Puntos ────────────────────────────────────────────────────
      const points = {};
      [A, B_, C_, D, p1, p2, p8, p9, p10, p11, p12, p13, p2b, p2c, p14, p14b, p14t]
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
      ln('B',  'C',   'construction', 'B.C  largo camisa');
      ln('C',  'D',   'construction', 'base rectángulo');
      ln('A',  '1',   'construction', 'A.1  cuello/6-1cm');
      ln('A',  '9',   'construction', 'A.9  cuello/6 (escote real)');
      ln('A',  '2',   'construction', 'A.2  pecho/4+1cm');
      ln('2',  '2b',  'construction', 'nivel sisa ←verificar→');
      ln('A',  '8',   'construction', 'A.8  cuello/6');
      ln('1',  '10',  'construction', '1.10  espalda/2');
      ln('10', '11',  'construction', '10.11  1cm caída');
      ln('8',  '12',  'construction', '8.12  1cm');
      ln('11', '13',  'construction', '11.13  1cm');

      // ── Contorno final de la prenda ───────────────────────────────
      // IMPORTANTE: estas líneas deben formar UNA SOLA cadena continua
      // (cada "from" = "to" de la línea anterior). El renderer dibuja el
      // relleno recorriendo _lines en orden y asume que el punto de partida
      // de cada tramo es donde terminó el anterior — si el orden no es una
      // cadena real, salta puntos y dibuja diagonales falsas (esto causaba
      // el fragmento de la vista desconectado del resto de la pieza).
      // Recorrido: 14D → D → C → 2b → 2c → 13 → 12 → 9 → 14 → (cierra en 14D)

      // Vista (placket de botones): borde inferior, desde la esquina
      // inferior de la vista hasta D.
      ln('14D', 'D',   'line');

      // Dobladillo
      ln('D',  'C',   'line');

      // Costado inferior
      ln('C',  '2b',  'line');

      // Sisa: dos arcos en lugar de uno, para lograr la axila ovalada del manual NH.
      // 1) 2b→2c: pequeño arco de 1cm que redondea la esquina del costado (el "óvalo").
      ln('2b', '2c',  'curve', '', -6);
      // 2) 2c→13: arco principal de la sisa, desde la entrada (1cm adentro) hasta el hombro.
      //    El vector 2c→13 sube y va a la izquierda (dx<0, dy<0).
      //    Con ctrl negativo el CP queda a la DERECHA del vector = hacia el interior del cuerpo.
      ln('2c', '13',  'curve', '', -20);

      // Hombro
      ln('13', '12',  'line');

      // Escote: el contorno real pasa por el punto 9 (cuello/6 completo desde A
      // en la línea CF), NO por el punto 1 (que es solo una referencia de
      // construcción intermedia, cuello/6-1cm). Confirmado por el manual NH.
      // Vector 12→9 va a la izquierda y hacia abajo (dx<0, dy>0), misma
      // dirección que el caso 12→1 ya verificado — mismo signo de ctrl.
      ln('12', '9',   'curve', '', -18);

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
      const p2 = { x: OX + d1/2,     y: OY,        name: '2'  };
      const p3 = { x: OX + d1/4,     y: OY,        name: '3'  };
      const p4 = { x: OX + anchoM/2, y: OY,        name: '4'  };  // centro sisa

      // Abertura y puño (manga larga)
      let abertura = null;
      if (tipo === 'larga') {
        abertura = { x: OX + anchoM - 100, y: OY + ML, name: 'AB' };
      }

      const points = {};
      const allPts = [A, B_, P, C_, D, p1, p2, p3, p4];
      if (abertura) allPts.push(abertura);
      allPts.forEach((p, i) => { points['mg'+i] = {x:p.x, y:p.y, name:p.name, fx:'', fy:''}; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a,b,t='line'){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl:20,cpx:null,cpy:null}); }

      // ── Cabeza de manga (arco en dos mitades) ─────────────────────
      ln('A', 'P', 'curve');   // mitad izq del arco
      ln('P', 'B', 'curve');   // mitad der del arco

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
  // 10. CUELLO CAMISERO CON PIE (2 piezas)
  //     Fuente: "Cuello Camisero con Pie" Nereyda Herrera
  //
  //     PIEZA 1 — CUELLO:
  //     A.B = escote/2
  //     B.C = 4cm (ancho cuello)
  //     C.1 = 1cm, B.2 = 2cm, 3 = mitad A.B y C.D
  //
  //     PIEZA 2 — PIE O BASE:
  //     A.B = escote/2 + 3cm
  //     B.C = 3cm (ancho pie)
  //     C.1 = 1cm, B.2 = 2cm, 3 = mitad C.D
  // ══════════════════════════════════════════════════════════════
  const CUELLO_CON_PIE = {
    nombre: 'Cuello con Pie',
    generar(m, s = 10) {
      const NK = m.neck * 10;
      const SF = s;
      const GAP = 30; // separación entre las dos piezas

      // ── PIEZA 1: CUELLO ────────────────────────────────────
      const AB1 = NK / 2;
      const BC1 = 40; // 4cm

      const A1 = { x: SF + AB1, y: SF,        name: 'A'  };
      const B1 = { x: SF,       y: SF,         name: 'B'  };
      const C1 = { x: SF,       y: SF + BC1,   name: 'C'  };
      const D1 = { x: SF + AB1, y: SF + BC1,   name: 'D'  };
      const p1_1 = { x: SF + 10,    y: SF + BC1,  name: '1'  }; // C.1 = 1cm
      const p2_1 = { x: SF,         y: SF + 20,   name: '2'  }; // B.2 = 2cm
      const p3_1 = { x: SF + AB1/2, y: SF + BC1,  name: '3c' }; // mitad inferior

      // ── PIEZA 2: PIE ───────────────────────────────────────
      const yOff = SF + BC1 + GAP;
      const AB2  = NK / 2 + 30; // escote/2 + 3cm
      const BC2  = 30;           // 3cm

      const A2 = { x: SF + AB2, y: yOff,        name: 'A2' };
      const B2 = { x: SF,       y: yOff,         name: 'B2' };
      const C2 = { x: SF,       y: yOff + BC2,   name: 'C2' };
      const D2 = { x: SF + AB2, y: yOff + BC2,   name: 'D2' };
      const p1_2 = { x: SF + 10,    y: yOff + BC2, name: '1p' }; // C.1 = 1cm
      const p2_2 = { x: SF,         y: yOff + 20,  name: '2p' }; // B.2 = 2cm
      const p3_2 = { x: SF + AB2/2, y: yOff + BC2, name: '3p' }; // mitad inf

      const points = {};
      [A1,B1,C1,D1,p1_1,p2_1,p3_1, A2,B2,C2,D2,p1_2,p2_2,p3_2]
        .forEach((p,i) => { points['cp'+i] = {x:p.x, y:p.y, name:p.name, fx:'', fy:''}; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a,b,t='line',lbl='',ctrl=20){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl,cpx:null,cpy:null}); }

      // Cuello
      ln('B',  'A',  'line');
      ln('A',  'D',  'fold');
      ln('D',  '1',  'line');
      ln('1',  'C',  'line');
      ln('C',  '2',  'line');
      // Vector 2→B apunta hacia arriba (dy<0); ctrl negativo curva hacia la DERECHA (interior cuello).
      ln('2',  'B',  'curve', '', -20);
      ln('3c', 'D',  'line');

      // Pie
      ln('B2', 'A2', 'line');
      ln('A2', 'D2', 'fold');
      ln('D2', '1p', 'line');
      ln('1p', 'C2', 'line');
      ln('C2', '2p', 'line');
      // Vector 2p→B2 apunta hacia arriba (dy<0); ctrl negativo curva hacia la DERECHA (interior pie).
      ln('2p', 'B2', 'curve', '', -20);
      ln('3p', 'D2', 'line');

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
     *   queda 2.5cm más abajo que las esquinas inferiores CR/CL.
     * Para RECTO: fondo recto C→D.
     * Para SEMICURVA: fondo en curva C → M → D.
     */
    generar(m, s = 10, modelo = 'pico') {
      const SF    = s;
      const ancho = 110;          // 11cm
      const largo = ancho + 20;   // 13cm

      const OX = SF;
      const OY = SF;

      const B_ = { x: OX,        y: OY,           name: 'B'  };  // top-left
      const A  = { x: OX+ancho,  y: OY,           name: 'A'  };  // top-right
      // Marcas de dobladillo (3cm desde tope)
      const p1L= { x: OX,        y: OY+30,        name: '1L' };
      const p1 = { x: OX+ancho,  y: OY+30,        name: '1'  };

      let allPts, linesFn;

      if (modelo === 'pico') {
        // Esquinas inferiores al nivel del pico (5mm antes del fondo)
        const CL = { x: OX,          y: OY+largo-25, name: 'CL' };
        const CR = { x: OX+ancho,    y: OY+largo-25, name: 'CR' };
        // Pico central 2.5cm más abajo que las esquinas
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
    },
    'camisa-delantera': {
      'A':   'CF arriba-izquierda (origen): centro frente superior. Todo el rectángulo parte de aquí. A.B = pecho/4 + 2cm de ancho; B.C = largo de camisa.',
      'B':   'Costado arriba-derecha: esquina superior del lado del costado. Punto de referencia del rectángulo — no es contorno.',
      'C':   'Costado abajo-derecha: esquina inferior del costado. Junto con D cierra el dobladillo.',
      'D':   'CF abajo-izquierda: esquina inferior del centro frente. El dobladillo va de D→C.',
      '1':   'Punto de construcción intermedio (A.1): cuello/6 − 1cm hacia abajo desde A en el CF. NO es el final real del escote — solo ayuda a ubicar el punto 10 (tip de hombro). El escote real termina en el punto 9, más abajo.',
      '2':   'Nivel de sisa CF (A.2): pecho/4 + 1cm hacia abajo desde A. La línea horizontal 2→2b es la línea de verificación de la sisa — mide que la profundidad sea correcta.',
      '2b':  'Nivel de sisa en el costado: igual altura que punto 2 pero en el borde derecho. La línea 2→2b es la referencia horizontal de la sisa para verificar medidas.',
      '2c':  'Entrada de sisa (1cm hacia adentro desde 2b): la sisa no sube directo desde la esquina del costado, sino que primero entra 1cm hacia el cuerpo. Este punto crea el óvalo de la axila — sin él la sisa queda angulosa.',
      '8':   'Ancho del escote (A.8): cuello/6 hacia la derecha desde A. Define cuánto se abre el escote hacia el hombro. Punto de arranque de la curva del escote.',
      '9':   'Profundidad real del escote (A.9): cuello/6 completo (sin restar 1cm) hacia abajo desde A, en la línea CF. Queda más abajo que el punto 1. La curva del escote (12→9) termina aquí — confirmado contra el manual NH.',
      '10':  'Tip de hombro en nivel 1 (1.10): espalda/2 desde el punto 1 hacia la derecha. Ubica el extremo del hombro a la altura del cuello — antes de la caída.',
      '11':  'Hombro con caída (10.11): 1cm hacia abajo desde el punto 10. El hombro tiene una caída natural; este punto lo refleja.',
      '12':  'Arranque de curva cuello-hombro (8.12): 1cm hacia abajo desde el punto 8. La curva del escote arranca suavemente desde aquí, no desde el borde de la tela.',
      '13':  'Inicio de sisa (11.13): 1cm hacia abajo desde el punto 11. Es donde la línea del hombro termina y la curva de la sisa comienza — punto crítico de la manga.',
      '14':  'Vista (ojal y botón) — A.14: 9cm a la izquierda del CF. Este ancho es estándar para una vista de camisa de caballero con 3 botones.',
      '14D': 'Esquina inferior de la vista: igual posición que punto 14 pero a la altura del dobladillo. La línea 14→14D es el doblez de la vista.',
    },
    'camisa-posterior': {
      'B':  'Centro Espalda arriba (doblez): origen del patrón trasero de camisa.',
      'A':  'Esquina superior derecha (costado): ancho del cuerpo — pecho/4 + 2cm.',
      'D':  'Costado abajo: cierra el cuerpo verticalmente.',
      'C':  'Centro Espalda abajo: cierra el dobladillo.',
      'a':  'Punto de cuello elevado: el CE sube 1cm sobre A para que el cuello quede bien sentado al doblar.',
      '1':  'Profundidad del escote posterior: cuello/6 − 1cm. Marca dónde baja el escote desde el CE.',
      '2':  'Ancho del escote lateral: cuello/4 + 1cm desde el costado. Define cuánto se abre el escote hacia el hombro.',
      '3':  'Ancho de cuello en el hombro: cuello/6 desde el costado. Punto donde la línea del cuello llega al hombro.',
      '4':  'Punto de curva del escote: cuello/6 − 2cm debajo del punto 3. Controla la curva entre el cuello y el hombro.',
      '5':  'Tip de hombro: espalda/2 desde el costado. Donde termina el hombro.',
      '6':  'Caída de hombro: 1cm hacia abajo desde el tip. Inclinación natural del hombro.',
      '7':  'Inicio de sisa: 1cm hacia el CE desde el punto 6. La sisa no empieza en el borde del hombro sino ligeramente adentro.',
      'G':  'Línea de canesú: 6cm desde el CE hacia abajo. Marca la costura que separa el canesú de la espalda.',
      'E':  'Nivel de cintura (referencia): mitad del largo total en el costado.',
      'F':  'Punto de entalle: 1cm hacia adentro desde E. Da forma a la cintura de la camisa.',
      '2D': 'Punto inferior del canesú en el costado: define el largo del canesú en el lado del costado.',
    },
    'manga-corta-camisa': {
      'A':  'Sisa izquierda: punto base de la cabeza de manga en el lado izquierdo. Se une a la sisa de la blusa/camisa.',
      'B':  'Sisa derecha: punto base de la cabeza de manga en el lado derecho.',
      'P':  'Pico de la cabeza de manga: pecho/10 + 1cm por encima de la línea de sisa. Es el punto más alto de la manga — más alto = manga con mejor cabeza de manga.',
      'C':  'Esquina inferior derecha (ruedo): donde termina el largo de manga en el costado derecho.',
      'D':  'Esquina inferior izquierda (ruedo): donde termina el largo de manga en el costado izquierdo.',
      '1':  'Referencia NH: pecho/10 + 1cm desde A. Define el punto de inflexión de la curva de sisa en el lado izquierdo.',
      '2':  'Referencia NH: mitad de A→1. Divide la cabeza de manga en cuartos para controlar la curva.',
      '3':  'Referencia NH: mitad de A→2. Cuarto interno de la cabeza de manga.',
      '4':  'Centro de la manga (referencia): mitad exacta del ancho A→B. Marca el centro de la manga para alineación con la costura del hombro.',
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
      'A':  'Extremo del cuello (cuerpo principal): el cuerpo del cuello mide escote/2 de largo.',
      'B':  'Doblez del cuello (CE): aquí se coloca el Centro Espalda del cuello.',
      '2':  'Curva superior del cuello: punto de inflexión que define la curva del borde visible del cuello.',
      '3c': 'Punto de terminación de la curva superior.',
      'A2': 'Extremo del pie de cuello: el pie tiene el mismo largo que el cuerpo (escote/2).',
      'B2': 'Doblez del pie (CE): Centro Espalda del pie de cuello.',
      '3p': 'Curva inferior del pie: punto de inflexión en el borde que va al escote.',
    },
    'bolsillo-pico':      { 'B': 'Esquina superior izquierda del bolsillo.', 'A': 'Esquina superior derecha del bolsillo.', '1L': 'Marca de dobladillo izquierda: 3cm desde la parte superior. El dobladillo se dobla hacia adentro para terminar el borde superior.', '1': 'Marca de dobladillo derecha: 3cm desde arriba.', 'CL': 'Esquina inferior izquierda: altura donde comienza el pico.', 'CR': 'Esquina inferior derecha: altura donde comienza el pico.', 'M': 'Pico central: punto más bajo del bolsillo, 2.5cm debajo de las esquinas. Le da el acabado decorativo en V.' },
    'bolsillo-recto':     { 'B': 'Esquina superior izquierda.', 'A': 'Esquina superior derecha.', '1L': 'Marca de dobladillo izquierda (3cm desde arriba).', '1': 'Marca de dobladillo derecha (3cm desde arriba).', 'C': 'Esquina inferior izquierda: fondo recto del bolsillo.', 'D': 'Esquina inferior derecha: fondo recto del bolsillo.' },
    'bolsillo-semicurva': { 'B': 'Esquina superior izquierda.', 'A': 'Esquina superior derecha.', '1L': 'Marca de dobladillo izquierda (3cm desde arriba).', '1': 'Marca de dobladillo derecha (3cm desde arriba).', 'C': 'Esquina inferior izquierda: inicio de la semicurva.', 'M': 'Punto central inferior: define la profundidad de la semicurva. La curva C→M→D da el redondeado del bolsillo.', 'D': 'Esquina inferior derecha: fin de la semicurva.' },
  };

  function generarBloque(pieza, medidas, talla = 'S') {
    let resultado, nombre, categoria;

    switch (pieza) {
      case 'blusa-trasera':
        resultado = BLUSA_TRASERA.generar(medidas);
        nombre    = `Blusa Trasera NH — Talla ${talla}`;
        categoria = 'espalda';
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
    camisaPosterior: CAMISA_POSTERIOR,
    camisaDelantera: CAMISA_DELANTERA,
    mangaCamisa:     MANGA_CAMISA,
    mangaVestido:    MANGA_VESTIDO,
    cuelloSport:     CUELLO_SPORT,
    cuelloConPie:    CUELLO_CON_PIE,
    bolsilloCamisa:  BOLSILLO_CAMISA,
    // Tabla Atelier Escuela
    tablasAtelierCab: TALLAS_ATELIER_CAB,
    // Lista de piezas para UI
    // ── Lista plana para compatibilidad con código legado ──────────
    piezasDama: [
      { id: 'blusa-trasera',       label: 'Blusa Trasera',          tipo: 'dama'      },
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
    ],
    // ── Agrupado por categoría (para dropdown ordenado sin duplicados) ──
    piezasGrupos: [
      {
        titulo: '👗 Blusa / Vestido',
        piezas: [
          { id: 'blusa-trasera',       label: 'Blusa Trasera',         tipo: 'dama' },
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
        ],
      },
    ],
  };

  return PAT.Sistemas.NereydaHerrera;

})();

console.log('[PatrónAI] Sistema Nereyda Herrera cargado ✓');
