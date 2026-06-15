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
      // Conversión a mm
      const B   = m.bust        * 10;   // contorno de busto
      const ESP = m.shoulder    * 10;   // ancho de espalda
      const TP  = m.backLength  * 10;   // talle posterior
      const CIN = m.waist       * 10;   // contorno cintura
      const CAD = m.hip         * 10;   // contorno cadera
      const ACA = m.hipDepth    * 10;   // alto de cadera
      const SF  = s;                     // margen (mm)

      // ── Rectángulo base ─────────────────────────────────────
      // Punto B (esquina sup derecha) = origen del rectángulo
      // A.B = busto/4 (ancho del rectángulo)
      // B.C = talle posterior (alto)
      const rectW = B / 4;    // ancho = busto/4
      const rectH = TP;       // alto  = talle posterior

      // Coordenadas absolutas (origen en SF, SF)
      // A = esquina superior izquierda (la "A" de Nereyda Herrera)
      // B = esquina superior derecha
      // C = esquina inferior derecha
      // D = esquina inferior izquierda

      const A  = { x: SF,          y: SF,           name:'A'  };
      const B_ = { x: SF + rectW,  y: SF,           name:'B'  };
      const C_ = { x: SF + rectW,  y: SF + rectH,   name:'C'  };
      const D  = { x: SF,          y: SF + rectH,   name:'D'  };

      // ── Puntos de construcción desde A ──────────────────────
      // A.1 = mitad del ancho de espalda (hacia la izquierda de A)
      // Nota: "hacia su izquierda" en el documento = hacia el centro del patrón
      const p1  = { x: SF + ESP/2,            y: SF,           name:'1'  };

      // 1.2 = 4 cm (caída de hombro, hacia abajo desde 1)
      const p2  = { x: SF + ESP/2,            y: SF + 40,      name:'2'  };

      // 2.3 = mitad de espalda menos 1cm (hacia la derecha desde 2 → nivel sisa)
      const p3  = { x: SF + ESP/2 + ESP/2 - 10, y: SF + 40,   name:'3'  };
      // (2.3 define la línea horizontal E = nivel de la sisa)

      // A.4 = sexta parte del ancho de espalda (subiendo desde A)
      const p4  = { x: SF + ESP/6,            y: SF,           name:'4'  };

      // 2.2a = punto 2 subir 2cm
      const p2a = { x: SF + ESP/2,            y: SF + 40 - 20, name:'2a' };

      // 4.4a = punto 4 subir 2cm (da la curva del escote en el hombro)
      const p4a = { x: SF + ESP/6,            y: SF - 20,      name:'4a' };

      // A.5 = 2 cm desde A hacia el costado del cuello
      const p5  = { x: SF + 20,               y: SF,           name:'5'  };

      // D.6 = cuarta parte cintura + 3cm (costado cintura)
      const p6  = { x: SF + CIN/4 + 30,       y: SF + rectH,   name:'6'  };

      // Punto E (mitad del rectángulo vertical = nivel sisa)
      const E   = { x: SF,                    y: SF + 40,      name:'E'  };
      const F   = { x: SF + rectW,            y: SF + 40,      name:'F'  };

      // Sisa: punto medio entre 2 y 3, metido 1cm hacia el cuerpo
      const sisaMid = {
        x: (p2.x + p3.x) / 2 - 10,  // 1cm hacia dentro
        y: SF + 40,
        name: 'SM'
      };

      // D1 = alto de cadera bajo D
      const D1  = { x: SF,          y: SF + rectH + ACA,  name:'D1' };
      // D2 = cuarta parte de cadera
      const D2  = { x: SF + CAD/4,  y: SF + rectH + ACA,  name:'D2' };

      // Pinza trasera:
      // 7 = mitad entre E y p3
      const p7  = { x: (E.x + p3.x) / 2,    y: SF + 40,      name:'7'  };
      // 7→8 = 5 cm hacia abajo desde 7
      const p8  = { x: p7.x,                  y: SF + 40 + 50, name:'8'  };
      // 8.9 = 1.5 cm a cada lado en p8
      const p9L = { x: p7.x - 15,             y: p8.y,         name:'9L' };
      const p9R = { x: p7.x + 15,             y: p8.y,         name:'9R' };

      // ── Construir objetos points y lines ────────────────────
      const points = {};
      const allPts = [A, B_, C_, D, p1, p2, p3, p4, p2a, p4a, p5, p6,
                      E, F, sisaMid, D1, D2, p7, p8, p9L, p9R];
      allPts.forEach((p, i) => {
        const id = 'nh' + i;
        points[id] = { x: p.x, y: p.y, name: p.name, fx: '', fy: '' };
      });

      // Índice por nombre para construir líneas
      const byName = {};
      Object.entries(points).forEach(([id, p]) => { byName[p.name] = id; });

      const lines = [];
      function ln(a, b, type='line') { lines.push({ from:byName[a], to:byName[b], type, ctrl:20, cpx:null, cpy:null }); }

      // Rectángulo base (líneas de construcción)
      ln('A',  'B',  'line');   // tope superior
      ln('B',  'C',  'line');   // costado derecho (CF)
      ln('C',  '6',  'line');   // dobladillo (ajustado a cintura)
      ln('D',  'A',  'fold');   // centro espalda (doblez)
      ln('D',  '6',  'line');   // línea de cintura

      // Hombro: A→2a (curva escote) y 2a→2 (hombro)
      ln('A',   '5',  'line');   // tope del cuello
      ln('4a',  '2a', 'line');   // línea del hombro
      ln('5',   '4a', 'curve');  // curva del escote espalda

      // Sisa: 2 → SM → 3 (semicurva)
      ln('2a',  '2',  'line');   // caída de hombro
      ln('2',   'SM', 'curve');  // sisa parte superior
      ln('SM',  '3',  'curve');  // sisa parte inferior

      // Lateral: 3 → 6 (costado con entalle)
      ln('3',   '6',  'line');   // costado sisa→cintura

      // Cadera
      ln('D',   'D1', 'fold');   // centro espalda bajo cintura
      ln('D1',  'D2', 'line');   // línea de cadera
      ln('D2',  '6',  'line');   // costado cadera→cintura

      // Línea E (nivel sisa, referencia)
      ln('E',   'F',  'line');

      // Pinza trasera
      ln('7',   '8',  'line');   // eje de la pinza
      ln('8',   '9L', 'line');   // rama izquierda
      ln('8',   '9R', 'line');   // rama derecha

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
    return {
      bust:        d.bust[t]        || 92,
      shoulder:    d.shoulder[t]    || 38,
      backLength:  d.backLength[t]  || 41,
      frontLength: d.frontLength[t] || 44,
      waist:       d.waist[t]       || 70,
      hipDepth:    d.hipDepth[t]    || 18,
      hip:         d.hip[t]         || 96,
      skirtLength: d.skirtLength[t] || 62,
      sleeveLength:d.sleeveLong[t]  || 53,
      wrist:       d.wrist[t]       || 16,
      neck:        Math.round((d.bust[t]||92) * 0.39), // aprox (no en tabla original)
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
      sleeveLength:d.sleeveLong[talla]  || 58,
      wrist:       d.wrist[talla]       || 20,
    };
  }

  /**
   * Genera un bloque listo para guardar en PAT.Bloques
   * @param {string} pieza - 'blusa-trasera' | 'camisa-posterior'
   * @param {object} medidas - medidas en cm
   */
  function generarBloque(pieza, medidas, talla = 'S') {
    let resultado, nombre, categoria;

    if (pieza === 'blusa-trasera') {
      resultado = BLUSA_TRASERA.generar(medidas);
      nombre    = `Blusa Trasera NH — Talla ${talla}`;
      categoria = 'espalda';
    } else if (pieza === 'camisa-posterior') {
      resultado = CAMISA_POSTERIOR.generar(medidas);
      nombre    = `Camisa Posterior NH — Talla ${talla}`;
      categoria = 'espalda';
    } else {
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
  // 6. REGISTRAR EN EL TRAZADOR (para el menú de sistemas)
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
    blusaTrasera:    BLUSA_TRASERA,
    camisaPosterior: CAMISA_POSTERIOR,
  };

  return PAT.Sistemas.NereydaHerrera;

})();

console.log('[PatrónAI] Sistema Nereyda Herrera cargado ✓');
