/**
 * constants.js
 * Constantes globales del sistema de patronaje.
 * Unidad interna: mm (milímetros) — 1 SVG unit = 1 mm
 * Garantiza impresión 1:1 sin conversiones adicionales.
 */

'use strict';

window.PAT = window.PAT || {};

// ─── Escala ──────────────────────────────────────────────────────────────────
// El SVG usa 1 unit = 1 mm. No se necesita SCALE factor en el canvas.
// Para pantalla usamos CSS transform (zoom/pan).
// Para PDF: jsPDF con unit:'mm' → 1 jsPDF unit = 1 mm ✓

PAT.MM   = 1;       // 1 mm (unidad base)
PAT.CM   = 10;      // 1 cm = 10 mm
PAT.INCH = 25.4;    // 1 pulgada = 25.4 mm

// ─── Tamaños de papel (en mm) ─────────────────────────────────────────────
PAT.PAPER = {
  letter: { w: 215.9,  h: 279.4, name: 'Carta (8.5×11")' },
  a4:     { w: 210.0,  h: 297.0, name: 'A4 (210×297mm)'  }
};

// Márgenes de impresión (en mm) — impresoras domésticas típicas
PAT.MARGIN = { top: 12, right: 12, bottom: 12, left: 12 };

// Solapamiento entre tiles (en mm) — para marcas de registro
PAT.TILE_OVERLAP = 10;

// ─── Valores predeterminados de parámetros ────────────────────────────────
PAT.DEFAULTS = {
  seam: 10,          // margen de costura: 10 mm (1 cm)
  ease: 6,           // facilidad: 6 cm
  paper: 'letter',   // tamaño papel
  garment: 'franela'
};

// ─── Medidas predeterminadas (talla M femenina) ───────────────────────────
PAT.DEFAULT_MEASURES = {
  // ─ Torso ─
  bust:        88,    // cm — busto/pecho
  waist:       68,    // cm — cintura
  hip:         94,    // cm — cadera
  shoulder:    38,    // cm — hombros (ancho total)
  neck:        36,    // cm — perímetro de cuello
  backLength:  40,    // cm — nuca a cintura (espalda)
  frontLength: 42,    // cm — hombro a cintura (frente)
  totalLength: 65,    // cm — total de prenda (torso)
  sleeveLength:60,    // cm — largo de manga (hombro a muñeca)
  wrist:       16,    // cm — perímetro muñeca
  // ─ Falda / Vestido ─
  skirtLength: 60,    // cm — largo de falda
  hipDepth:    20,    // cm — talle a cadera (profundidad)
  // ─ Pantalón / Short ─
  inseam:      76,    // cm — entrepierna (tiro a tobillo)
  outseam:    100,    // cm — lateral total (cintura a tobillo)
  thigh:       56,    // cm — contorno muslo
  knee:        37,    // cm — contorno rodilla
  ankle:       23,    // cm — contorno tobillo
  shortLength: 45,    // cm — largo short (cintura a bajo)
  rise:        28,    // cm — tiro (cintura a entrepierna)
};

// ─── Separación entre piezas en el canvas ─────────────────────────────────
PAT.PIECE_GAP = 30;  // mm entre piezas

// ─── Colores SVG ──────────────────────────────────────────────────────────
PAT.COLORS = {
  cutLine:   '#2a2018',   // línea de corte (exterior) — oscuro visible en fondo beige
  seamLine:  '#6b5a45',   // línea de costura (interior, punteada)
  foldLine:  '#b84040',   // línea de doblez (roja, punteada)
  grainLine: '#3a6ea8',   // línea de hilo
  dartLine:  '#c49830',   // pinza
  dimLine:   '#7c3aed',   // cotas/dimensiones
  notch:     '#2a2018',   // muescas
  fill:      'rgba(184,107,46,0.04)',  // relleno sutil cálido
  bgGrid:    'rgba(0,0,0,0.04)',
};

// ─── Tamaños de texto en SVG (en mm) ─────────────────────────────────────
PAT.FONT = {
  title:  4.0,  // mm — título de pieza
  label:  2.8,  // mm — etiqueta
  grain:  2.4,  // mm — texto línea de hilo
  dim:    2.4,  // mm — cotas
};

// ─── Constantes para el maniquí 3D ────────────────────────────────────────
PAT.MANNEQUIN = {
  scale: 0.1,   // 1 cm en medidas → 0.1 unidades Three.js (ajuste visual)
  color: {
    skin:    0x8B7355,   // madera/piel neutra
    garment: 0x7c3aed,   // color de prenda (púrpura)
    seam:    0xf59e0b,   // costuras en 3D
  }
};

// ─── Firebase collection name ─────────────────────────────────────────────
PAT.FB_COLLECTION = 'patterns';

console.log('[PatrónAI] Constants loaded. Unit: 1 SVG unit = 1 mm');
