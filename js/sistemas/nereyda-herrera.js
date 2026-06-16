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
      function ln(a, b, t='line') {
        if (byName[a] && byName[b])
          lines.push({ from:byName[a], to:byName[b], type:t, ctrl:20, cpx:null, cpy:null });
      }

      // Centro espalda (doblez)
      ln('D',  'A',   'fold');
      ln('D',  'D1',  'fold');

      // Escote (cuello)
      ln('A',  '5',   'line');   // A → 2cm abajo (profundidad escote)
      ln('5',  '4a',  'curve');  // curva escote: centro espalda → hombro

      // Hombro
      ln('4a', '2a',  'line');   // línea de hombro

      // Sisa (armhole) — semicurva desde hombro hasta nivel sisa
      ln('2a', '2',   'line');   // caída de hombro (2cm vertical)
      ln('2',  'SM',  'curve');  // sisa superior
      ln('SM', '3',   'curve');  // sisa inferior

      // Nivel sisa → costado
      ln('3',  'F',   'line');   // sisa horizontal hasta costado
      ln('F',  '6',   'line');   // costado sisa → cintura
      ln('6',  'C',   'line');   // cintura → esquina inferior

      // Dobladillo inferior
      ln('C',  'D',   'line');

      // Cadera
      ln('D1', 'D2',  'line');
      ln('D2', '6',   'line');

      // Líneas de referencia (construcción)
      ln('E',  'F',   'line');   // nivel hombro (referencia)
      ln('A',  'B',   'line');   // línea tope (referencia)

      // Pinza trasera
      ln('7',  '8',   'line');
      ln('8',  '9L',  'line');
      ln('8',  '9R',  'line');

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

    generar(m, s = 10) {
      const T   = m.bust * 10;          // tórax (contorno de pecho) en mm
      const NK  = m.neck * 10;          // cuello
      const ESP = m.shoulder * 10;      // espalda
      const LC  = m.totalLength * 10;   // largo de la camisa
      const SF  = s;

      // Holgura: +2cm por defecto (ajustado=0, holgado=+4cm)
      const HOLGURA = 20; // mm

      // Rectángulo base
      const rectW = T / 4 + HOLGURA;   // tórax/4 + 2cm
      const rectH = LC;

      // Puntos del rectángulo
      // B=sup-der, A=sup-izq (la A está a la derecha en el diagrama)
      // El diagrama muestra: B izquierda, A derecha (estilo caballero)
      const B_ = { x: SF,          y: SF,        name: 'B'  };
      const A  = { x: SF + rectW,  y: SF,        name: 'A'  };
      const D  = { x: SF + rectW,  y: SF + rectH, name: 'D' };
      const C_ = { x: SF,          y: SF + rectH, name: 'C' };

      // Desde A (lado cuello):
      // A.1 = cuello/6 - 1cm (profundidad escote)
      const p1  = { x: SF + rectW, y: SF + NK/6 - 10,     name: '1'  };
      // A.2 = cuello/4 + 1cm (ancho escote lateral)
      const p2  = { x: SF + rectW - (NK/4 + 10), y: SF,   name: '2'  };
      // A.3 = cuello/6 (ancho cuello en hombro)
      const p3  = { x: SF + rectW - NK/6,         y: SF,   name: '3'  };
      // 3.4 = cuello/6 - 2cm (punto del escote curvo)
      const p4  = { x: SF + rectW - NK/6,         y: SF + NK/6 - 20, name: '4' };
      // A.5 = espalda/2 (mitad del ancho de espalda)
      const p5  = { x: SF + rectW - ESP/2,         y: SF,   name: '5'  };
      // 5.6 = 1cm (hacia abajo)
      const p6  = { x: SF + rectW - ESP/2,         y: SF + 10, name: '6' };
      // 6.7 = 1cm (hacia adentro, para la sisa)
      const p7  = { x: SF + rectW - ESP/2 - 10,    y: SF + 10, name: '7' };

      // Punto E = mitad del largo (nivel del talle / codo)
      const E   = { x: SF + rectW,  y: SF + rectH/2,         name: 'E' };
      // E.F = 1cm de entalle
      const F   = { x: SF + rectW + 10, y: SF + rectH/2,     name: 'F' };

      // G = canesú (6cm aprox bajo el hombro)
      const G   = { x: SF,          y: SF + 60,               name: 'G' };

      // A.a = subir 1cm (curva posterior cuello)
      const pa  = { x: SF + rectW,  y: SF - 10,               name: 'a' };

      // Punto 2 del diagrama = nivel sisa (donde termina el canesú)
      const p2D = { x: SF,          y: SF + NK/4 + 10 + 20,   name: '2D' };

      const points = {};
      const allPts = [B_, A, D, C_, p1, p2, p3, p4, p5, p6, p7, E, F, G, pa, p2D];
      allPts.forEach((p, i) => {
        points['nc' + i] = { x: p.x, y: p.y, name: p.name, fx: '', fy: '' };
      });
      const byName = {};
      Object.entries(points).forEach(([id, p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a, b, type='line') {
        if (byName[a] && byName[b])
          lines.push({ from:byName[a], to:byName[b], type, ctrl:20, cpx:null, cpy:null });
      }

      // Rectángulo base
      ln('B',  'G',   'line');   // lateral izq (bajo canesú)
      ln('C',  'D',   'line');   // dobladillo
      ln('C',  'B',   'fold');   // centro espalda (doblez)
      ln('D',  'F',   'line');   // costado (con entalle en F)

      // Canesú y cuello
      ln('B',  '2D',  'line');   // lateral izq hasta nivel sisa
      ln('2D', '7',   'line');   // línea del canesú
      ln('7',  '6',   'curve');  // sisa
      ln('6',  '5',   'line');   // hombro (5→6→7 sisa)
      ln('5',  '3',   'line');   // hombro hasta escote
      ln('3',  '4',   'curve');  // curva escote lado hombro
      ln('4',  '1',   'curve');  // curva escote → cuello
      ln('1',  'a',   'line');   // cuello centro (+1cm subida)
      ln('a',  'D',   'line');   // costado derecho

      // Entalle
      ln('E',  'F',   'line');   // referencia entalle

      return { points, lines };
    },

    formulas: {
      'A':   { fx: 'pecho/4 + 20',   fy: '0',            nota: 'Ancho tórax/4 + 2cm holgura' },
      '1':   { fx: 'pecho/4 + 20',   fy: 'cuello/6 - 10', nota: 'Cuello/6 - 1cm (prof escote)' },
      '2':   { fx: 'pecho/4 - cuello/4', fy: '0',        nota: 'Cuello/4 + 1cm (ancho escote)' },
      '3':   { fx: 'pecho/4 - cuello/6 + 20', fy: '0',   nota: 'Cuello/6 (ancho cuello hombro)' },
      '5':   { fx: 'pecho/4 + 20 - hombros/2', fy: '0',  nota: 'Espalda/2 (mitad ancho espalda)' },
    }
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
     * Construcción NH — Camisa Delantera (frente).
     * CF (Centro Delantero) = DERECHA (doblez).
     * Costado/sisa = IZQUIERDA.
     * Misma lógica que BLUSA_TRASERA pero en espejo horizontal.
     *
     * @param {object} m  medidas en cm { bust, shoulder, neck, totalLength, waist, hip, hipDepth }
     * @param {number} s  margen en mm (default 10)
     */
    generar(m, s = 10) {
      const T   = m.bust        * 10;
      const NK  = m.neck        * 10;
      const ESP = m.shoulder    * 10;
      const LC  = (m.totalLength || m.backLength || 65) * 10;
      const CIN = (m.waist      || 68) * 10;
      const CAD = (m.hip        || 94) * 10;
      const ACA = (m.hipDepth   || 18) * 10;

      const OX = s;        // margen izquierdo = lado costado/sisa
      const OY = s + 30;   // margen superior ampliado (el escote puede subir 2cm sobre OY)

      // ── Rectángulo base ─────────────────────────────────────────
      // Ancho = tórax/4 + 2cm holgura   Alto = largo total
      const RW = T / 4 + 20;
      const RH = LC;

      // CF = borde DERECHO (x = OX + RW)
      // Costado = borde IZQUIERDO (x = OX)
      const B_  = { x: OX,       y: OY,       name: 'B'  };  // top-left  (costado ref.)
      const A   = { x: OX + RW,  y: OY,       name: 'A'  };  // top-right  (CF top)
      const D   = { x: OX + RW,  y: OY + RH,  name: 'D'  };  // bot-right  (CF bottom)
      const C_  = { x: OX,       y: OY + RH,  name: 'C'  };  // bot-left   (costado bottom)

      // ── ESCOTE DELANTERO ─────────────────────────────────────────
      // Ancho escote: cuello/6 desde CF hacia costado (igual que espalda)
      const neckW = NK / 6;
      // Profundidad escote delantero: cuello/6 + 1cm (ligeramente mayor que espalda)
      const neckD = NK / 6 + 10;

      // NW = punto cuello-hombro sobre la línea de tope (a neckW del CF)
      const NW  = { x: OX + RW - neckW,  y: OY,        name: 'NW'  };
      // NWa = NW subido 2cm (curva del escote sube en el hombro, mismo criterio que espalda)
      const NWa = { x: OX + RW - neckW,  y: OY - 20,   name: 'NWa' };
      // ND = profundidad del escote sobre el CF
      const ND  = { x: OX + RW,          y: OY + neckD, name: 'ND'  };

      // ── HOMBRO ───────────────────────────────────────────────────
      // Desde NWa hacia el costado: espalda/2 de ancho total de hombro
      // 4cm de caída de hombro (mismo que espalda)
      const shDrop = 40;
      const SH  = { x: OX + RW - ESP / 2, y: OY + shDrop, name: 'SH' };

      // ── SISA ─────────────────────────────────────────────────────
      // Profundidad de sisa = espalda/2 - 1cm (igual que espalda)
      const sisaD = ESP / 2 - 10;
      const SI  = { x: OX + RW - ESP / 2,      y: OY + shDrop + sisaD,       name: 'SI' };
      const SM  = { x: OX + RW - ESP / 2 + 10, y: OY + shDrop + sisaD / 2,   name: 'SM' };
      // punto de control empuja hacia CF (derecha) para curvatura correcta

      // ── UNDERARM y COSTADO ────────────────────────────────────────
      // F = extremo izquierdo del underarm (nivel sisa, borde costado)
      const F   = { x: OX,              y: SI.y,         name: 'F'  };

      // Cintura y cadera (medidas desde CF hacia costado, igual que espalda desde CB)
      const p6  = { x: OX + RW - (CIN / 4 + 30), y: OY + RH - ACA, name: '6'  };
      const D2  = { x: OX + RW - CAD / 4,         y: OY + RH + ACA, name: 'D2' };
      // Nodo de cadera para esquina inferior del costado (a nivel de cadera)
      const FH  = { x: OX,                         y: OY + RH + ACA, name: 'FH' };

      // ── Ensamblar puntos ──────────────────────────────────────────
      const points = {};
      [B_, A, D, C_, NW, NWa, ND, SH, SI, SM, F, p6, D2, FH]
        .forEach((p, i) => {
          points['del' + i] = { x: p.x, y: p.y, name: p.name, fx: '', fy: '' };
        });

      const byName = {};
      Object.entries(points).forEach(([id, p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a, b, t = 'line') {
        if (byName[a] && byName[b])
          lines.push({ from: byName[a], to: byName[b], type: t, ctrl: 20, cpx: null, cpy: null });
      }

      // ── Contorno principal (forma de la prenda) ───────────────────
      // CF (doblez) — borde derecho completo
      ln('A',   'D',   'fold');
      // Dobladillo inferior
      ln('D',   'C',   'line');
      // Costado (borde izquierdo) sube desde dobladillo hasta nivel sisa
      ln('C',   'F',   'line');
      // Underarm horizontal hasta el fondo de la sisa
      ln('F',   'SI',  'line');
      // Sisa — semicurvas (inferior y superior)
      ln('SI',  'SM',  'curve');
      ln('SM',  'SH',  'curve');
      // Hombro desde tip hasta nodo cuello-hombro
      ln('SH',  'NWa', 'line');
      // Curva del escote delantero
      ln('NWa', 'ND',  'curve');
      // Apertura CF (del escote hasta la esquina superior)
      ln('ND',  'A',   'line');

      // ── Líneas de construcción (referencia) ───────────────────────
      ln('B',  'A',  'line');   // tope superior horizontal
      ln('B',  'C',  'fold');   // costado vertical de referencia

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
    generar(m, s = 10, tipo = 'corta') {
      const T   = m.bust * 10;
      const ESP = m.shoulder * 10;
      const BR  = (m.armCirc || m.wrist * 2 + 20) * 10; // contorno brazo
      const ML  = tipo === 'larga' ? (m.sleeveLength || 58) * 10 : (m.sleeveShort || 20) * 10;
      const PU  = (m.wrist || 18) * 10;
      const SF  = s;

      // Rectángulo: A (inf-izq), B (sup-izq), C (sup-der), D (inf-der)
      const AB = ESP / 2 + 10;  // espalda/2 + 1cm (ancho manga)
      const BC = ML;             // largo manga

      const A  = { x: SF,       y: SF + BC,  name: 'A' };
      const B_ = { x: SF,       y: SF,       name: 'B' };
      const C_ = { x: SF + AB,  y: SF,       name: 'C' };
      const D  = { x: SF + AB,  y: SF + BC,  name: 'D' };

      // B.1 = pecho/10 + 1cm (desde B hacia la derecha)
      const dist1 = T / 10 + 10;
      const p1  = { x: SF + dist1,          y: SF,        name: '1' };
      // 2 = B.1/2
      const p2  = { x: SF + dist1 / 2,      y: SF,        name: '2' };
      // 3 = mitad entre B y 2 → B.2/2
      const p3  = { x: SF + dist1 / 4,      y: SF,        name: '3' };
      // 4 = A.B/2 (mitad del ancho en el eje vertical)
      const p4  = { x: SF + AB / 2,         y: SF,        name: '4' };
      // 5 = brazo/2 (a media altura de la manga — cabeza de manga)
      const p5  = { x: SF + AB / 2,         y: SF + BC * 0.35, name: '5' };
      // 6 = 3cm desde D (marca del ruedo)
      const p6  = { x: SF + AB,             y: SF + BC - 30,   name: '6' };

      // Puntos de sisa (curva cabeza de manga)
      // La cabeza va de A→3→2→1→C en semicurva
      const sisaL = { x: SF,       y: SF + BC * 0.3, name: 'SL' }; // izquierda
      const sisaR = { x: SF + AB,  y: SF + BC * 0.3, name: 'SR' }; // derecha

      // Para manga larga: agregar puño
      let p_puno = null, p_abertura = null;
      if (tipo === 'larga') {
        // C.4 = descontar puño (~6cm)
        const descPuno = { x: SF + AB, y: SF + BC - 60, name: 'C4' };
        // 5.6 = puño/2 + 3cm (ancho del puño)
        p_puno = { x: SF + PU/2 + 30, y: SF + BC, name: 'PU' };
        p_abertura = { x: SF + AB - 100, y: SF + BC, name: 'AB' }; // 10cm abertura
      }

      const points = {};
      const allPts = [A, B_, C_, D, p1, p2, p3, p4, p5, p6, sisaL, sisaR];
      if (tipo === 'larga' && p_puno) allPts.push(p_puno, p_abertura);
      allPts.forEach((p, i) => { if(p) points['mg'+i] = { x:p.x, y:p.y, name:p.name, fx:'', fy:'' }; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a,b,t='line'){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl:20,cpx:null,cpy:null}); }

      // Cuerpo
      ln('A', 'SL', 'line');  // lateral izq inferior
      ln('D', 'SR', 'line');  // lateral der inferior
      ln('SL','B',  'curve'); // cabeza manga izq
      ln('B', '3',  'line');  // tope sup izq
      ln('3', '2',  'line');
      ln('2', '1',  'line');
      ln('1', '4',  'line');
      ln('4', 'C',  'line');
      ln('C', 'SR', 'curve'); // cabeza manga der

      if (tipo === 'corta') {
        ln('A', 'D', 'fold');   // doblez (doblar para obtener modelo entero)
      } else {
        ln('A',  'PU', 'line');
        ln('PU', 'D',  'fold');
        if(byName['AB']) ln('AB','D', 'line'); // abertura carterita
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
    generar(m, s = 10, tipo = 'corta') {
      const B   = m.bust * 10;
      const ESP = m.shoulder * 10;
      const BR  = (m.armCirc || 28) * 10;
      const ML  = tipo === 'larga' ? (m.sleeveLength || 55) * 10 : (m.sleeveShort || 20) * 10;
      const MU  = (m.wrist || 17) * 10;
      const SF  = s;

      const AB = ESP / 2 - 10;  // espalda/2 - 1cm
      const BC = ML;

      const A  = { x: SF,       y: SF,        name: 'A' }; // doblez (derecha)
      const B_ = { x: SF,       y: SF + BC,   name: 'B' }; // esquina inf
      const C_ = { x: SF + AB,  y: SF + BC,   name: 'C' };
      const D  = { x: SF + AB,  y: SF,        name: 'D' };

      // B.1 = busto/10 + 3cm
      const d1  = B / 10 + 30;
      const p1  = { x: SF + d1,       y: SF + BC,   name: '1' };
      const p2  = { x: SF + d1/2,     y: SF + BC,   name: '2' }; // mitad B.1
      const p3  = { x: SF + d1/4,     y: SF + BC,   name: '3' }; // mitad B.2
      const p4  = { x: SF + AB/2,     y: SF + BC,   name: '4' }; // mitad A.B
      // D.5 = brazo/2 + 2cm (a media altura en el lateral)
      const p5  = { x: SF + AB,       y: SF + BC/2, name: '5' };
      // D.6 = 3cm ruedo
      const p6  = { x: SF + AB,       y: SF + 30,   name: '6' };
      // XX = punto doblez
      const XX  = { x: SF + AB*0.4,   y: SF,        name: 'XX' };

      const points = {};
      [A, B_, C_, D, p1, p2, p3, p4, p5, p6, XX]
        .forEach((p,i) => { points['mv'+i] = {x:p.x, y:p.y, name:p.name, fx:'', fy:''}; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a,b,t='line'){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl:20,cpx:null,cpy:null}); }

      ln('A',  'B',  'fold');   // doblez
      ln('B',  '3',  'line');
      ln('3',  '2',  'line');
      ln('2',  '1',  'line');
      ln('1',  'C',  'line');
      ln('C',  '5',  'curve');  // sisa der (semicurva)
      ln('5',  'D',  'line');
      ln('D',  '6',  'line');
      ln('6',  'A',  'curve');  // sisa izq (semicurva)
      ln('D',  'XX', 'line');   // marca doblez superior

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
      function ln(a,b,t='line'){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl:20,cpx:null,cpy:null}); }

      ln('B',  'A',  'line');   // tope superior
      ln('A',  'D',  'fold');   // doblez (DOBLAR)
      ln('D',  '1',  'line');   // base inferior der
      ln('1',  'C',  'line');   // base inferior izq
      ln('C',  '2',  'line');   // lateral izq
      ln('2',  'B',  'curve');  // curva escote
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
      function ln(a,b,t='line'){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl:20,cpx:null,cpy:null}); }

      // Cuello
      ln('B',  'A',  'line');
      ln('A',  'D',  'fold');
      ln('D',  '1',  'line');
      ln('1',  'C',  'line');
      ln('C',  '2',  'line');
      ln('2',  'B',  'curve');
      ln('3c', 'D',  'line');

      // Pie
      ln('B2', 'A2', 'line');
      ln('A2', 'D2', 'fold');
      ln('D2', '1p', 'line');
      ln('1p', 'C2', 'line');
      ln('C2', '2p', 'line');
      ln('2p', 'B2', 'curve');
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
    generar(m, s = 10, modelo = 'pico') {
      const SF   = s;
      const ancho = 110; // 11cm por defecto
      const largo = ancho + 20; // +2cm

      const A  = { x: SF + ancho, y: SF,         name: 'A' };
      const B_ = { x: SF,         y: SF,         name: 'B' };
      const C_ = { x: SF,         y: SF + largo,  name: 'C' };
      const D  = { x: SF + ancho, y: SF + largo,  name: 'D' };
      // A.1 = 3cm dobladillo
      const p1 = { x: SF + ancho, y: SF + 30,    name: '1' };
      const p1L= { x: SF,         y: SF + 30,    name: '1L' };
      // Punto de base (modelo pico = mitad sube 2.5cm)
      const pMid = { x: SF + ancho/2, y: SF + largo + (modelo==='pico' ? -25 : 0), name: 'M' };

      const points = {};
      [A, B_, C_, D, p1, p1L, pMid]
        .forEach((p,i) => { points['bo'+i] = {x:p.x, y:p.y, name:p.name, fx:'', fy:''}; });
      const byName = {};
      Object.entries(points).forEach(([id,p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a,b,t='line'){ if(byName[a]&&byName[b]) lines.push({from:byName[a],to:byName[b],type:t,ctrl:20,cpx:null,cpy:null}); }

      ln('A',  'B',  'line'); // tope (dobladillo)
      ln('B',  '1L', 'line'); // lateral izq
      ln('A',  '1',  'line'); // lateral der
      ln('1L', 'M',  modelo==='semicurva'?'curve':'line'); // base izq
      ln('M',  '1',  modelo==='semicurva'?'curve':'line'); // base der
      if(modelo==='pico') {
        ln('C', 'M', 'line'); // líneas al pico
        ln('D', 'M', 'line');
      }

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
    piezasDama: [
      { id: 'blusa-trasera',      label: 'Blusa Trasera',          tipo: 'dama' },
      { id: 'camisa-delantera',   label: 'Camisa Delantera',        tipo: 'dama' },
      { id: 'manga-corta-vestido',label: 'Manga Corta (Vestido)',   tipo: 'dama' },
      { id: 'manga-larga-vestido',label: 'Manga Larga (Vestido)',   tipo: 'dama' },
      { id: 'cuello-sport',       label: 'Cuello Sport',            tipo: 'dama' },
      { id: 'cuello-con-pie',     label: 'Cuello con Pie',          tipo: 'dama' },
      { id: 'bolsillo-pico',      label: 'Bolsillo en Pico',        tipo: 'dama' },
      { id: 'bolsillo-recto',     label: 'Bolsillo Recto',          tipo: 'dama' },
      { id: 'bolsillo-semicurva', label: 'Bolsillo Semicurva',      tipo: 'dama' },
    ],
    piezasCaballero: [
      { id: 'camisa-posterior',   label: 'Camisa Posterior',        tipo: 'caballero' },
      { id: 'manga-corta-camisa', label: 'Manga Corta (Camisa)',    tipo: 'caballero' },
      { id: 'manga-larga-camisa', label: 'Manga Larga (Camisa)',    tipo: 'caballero' },
      { id: 'cuello-sport',       label: 'Cuello Sport',            tipo: 'caballero' },
      { id: 'cuello-con-pie',     label: 'Cuello con Pie',          tipo: 'caballero' },
      { id: 'bolsillo-pico',      label: 'Bolsillo en Pico',        tipo: 'caballero' },
    ],
  };

  return PAT.Sistemas.NereydaHerrera;

})();

console.log('[PatrónAI] Sistema Nereyda Herrera cargado ✓');
