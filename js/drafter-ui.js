/**
 * drafter-ui.js v2.0
 * Interfaz de trazado manual estilo "instrucciones de patronaje"
 * Igual al sistema Atelier Escuela / Nereyda Herrera
 */
'use strict';
window.PAT = window.PAT || {};

PAT.DrafterUI = (function () {

  const MANUALS_KEY = 'pat_manuals';

  // ── Manuales de ejemplo (basados en las fotos enviadas) ──────
  const BUILTIN_EXAMPLES = {

    'Blusa Básica — Parte Trasera': {
      garment: 'blusa',
      gender:  null,
      code: `# ══════════════════════════════════════════
# TRAZADO BLUSA BÁSICA — PARTE TRASERA
# Sistema Atelier Escuela
# ══════════════════════════════════════════
# Variables disponibles:
#  B4 = busto/4   TALLE_ESP = talle espalda
#  E2 = espalda/2  B12 = busto/12
# ══════════════════════════════════════════

PIEZA Blusa Básica — Parte Trasera

# ── Paso 1: Rectángulo base ──────────────
# A = esquina superior izquierda (CB/nuca)
PUNTO A 0,0

# B = ancho del bloque (busto/4)
PUNTO B desde:A der:B4

# C = largo talle posterior (esquina inf derecha)
PUNTO C desde:B abajo:TALLE_ESP

# D = esquina inferior izquierda (CB cintura)
PUNTO D desde:A abajo:TALLE_ESP

# ── Paso 2: Cuello trasero ───────────────
# 1 = ancho cuello (busto/6)
PUNTO 1 desde:A der:B6

# 2 = profundidad cuello trasero (2cm)
PUNTO 2 desde:A abajo:20

# ── Paso 3: Hombro ───────────────────────
# 2a = caída del hombro (subir 1cm desde 1)
PUNTO 2A desde:1 abajo:10

# 3 = sexta parte espalda - 2cm (posición hombro)
PUNTO 3 desde:2A der:E2 arriba:20

# ── Paso 4: Sisa ─────────────────────────
# 4 = profundidad sisa (cuarta parte espalda)
PUNTO 4 desde:A abajo:B4

# E = punto de sisa lateral (mismo nivel que 4)
PUNTO E desde:B abajo:B4

# ── Paso 5: Cadera ───────────────────────
# F = mitad del talle (nivel cintura-cadera)
PUNTO F desde:B abajo:TALLE_ESP

# ── Contorno ─────────────────────────────
CURVA 2 1 control:-8
LINEA 1 3
CURVA 3 E semicurva:15
LINEA E F
LINEA F C
LINEA C D
DOBLEZ D A

# ── Auxiliares ───────────────────────────
HILO A D
MUESCA linea:EF pos:0.5

COTA A B "Busto/4"
COTA A D "Talle espalda"`,
    },

    'Blusa Básica — Parte Delantera': {
      garment: 'blusa',
      gender:  null,
      code: `# ══════════════════════════════════════════
# TRAZADO BLUSA BÁSICA — PARTE DELANTERA
# Sistema Atelier Escuela
# ══════════════════════════════════════════

PIEZA Blusa Básica — Parte Delantera

# Rectángulo base
PUNTO A 0,0
PUNTO B desde:A der:B4
PUNTO C desde:B abajo:TALLE_DEL
PUNTO D desde:A abajo:TALLE_DEL

# Cuello delantero (más profundo que trasero)
PUNTO 1 desde:A der:B6
PUNTO 2 desde:A abajo:B6

# Hombro (igual que trasero)
PUNTO 2A desde:1 abajo:10
PUNTO 3 desde:2A der:E2 arriba:20

# Sisa
PUNTO 4 desde:B abajo:B4

# Línea E (cadera)
PUNTO E desde:B abajo:TALLE_DEL

# Pinza de busto
PUNTO BP desde:A der:B4 abajo:TALLE_DEL

# Contorno
CURVA 2 1 control:-12
LINEA 1 3
CURVA 3 4 semicurva:12
LINEA 4 E
LINEA E D
DOBLEZ D A

HILO A D
COTA 2 1 "Ancho cuello"
COTA A D "Talle delantero"`,
    },

    'Camisa Caballero — Parte Posterior': {
      garment: 'camisa',
      gender:  'caballero',
      code: `# ══════════════════════════════════════════
# TRAZADO CAMISA CABALLERO — PARTE POSTERIOR
# Sistema Atelier Escuela
# Variables: BUSTO, ESPALDA, TALLE_ESP, B4, E2
# ══════════════════════════════════════════

PIEZA Camisa Caballero — Posterior

# Rectángulo base
# A.B = Cuarta parte de pecho + 2cm
PUNTO A 0,0
PUNTO B desde:A der:B4+20

# B.C = Largo de la camisa
PUNTO C desde:B abajo:LARGO

# Cierre
PUNTO D desde:A abajo:LARGO

# A.1 = Sexta parte del ancho de espalda
PUNTO 1 desde:A der:ESPALDA/6

# 1.2 = Cuarta parte de hombro (caída)
PUNTO 2 desde:1 abajo:10

# 2.3 = Sexta parte espalda - 2cm
PUNTO 3 desde:2 der:E2-20

# A.4 = Sexta parte de espalda (profundidad sisa)
PUNTO 4 desde:A abajo:ESPALDA/6

# Bajar 2cm
PUNTO 4A desde:4 abajo:20

# E = nivel sisa
PUNTO E desde:B abajo:ESPALDA/6+20

# Canesú (8cm desde hombros)
PUNTO CANESU_IZQ desde:D arriba:TALLE_ESP abajo:80
PUNTO CANESU_DER desde:E arriba:ESPALDA/6-20 abajo:80

# Contorno
CURVA 2 1 control:-10
LINEA 1 3
CURVA 3 E semicurva:20
LINEA E C
LINEA C D
DOBLEZ D A

# Línea de canesú
LINEA CANESU_IZQ CANESU_DER costura

HILO A D
COTA A B "Busto/4 + 2cm"
COTA A D "Largo camisa"`,
    },

    'Manga Larga — Camisa': {
      garment: 'camisa',
      gender:  null,
      code: `# ══════════════════════════════════════════
# MANGA LARGA PARA CAMISA
# Sistema Atelier Escuela
# ══════════════════════════════════════════

PIEZA Manga Larga

# A.B = Mitad del ancho de espalda + 1cm
PUNTO A 0,0
PUNTO B desde:A der:E2+10

# Punto superior de la manga
PUNTO B1 desde:B abajo:ESPALDA/6

# B.C = Largo de manga
PUNTO C desde:A abajo:MANGA

# D = extremo inferior derecho
PUNTO D desde:C der:E2+10

# Puntos de la cabeza de manga
# B.1 = décima parte del busto
PUNTO P1 desde:A der:B10

# 2 = mitad de B.1 (punto intermedio)
PUNTO P2 desde:P1 der:B10/2

# 3 = mitad de A,B
PUNTO P3 desde:A der:E2+10 arriba:ESPALDA/6

# 4 = mitad de A,B (punto control sisa)
PUNTO P4 desde:A der:E2+10/2

# Puño
# C.4 = descontar ancho del puño (6cm aprox)
PUNTO PUN_IZQ desde:C arriba:0
PUNTO PUN_DER desde:D arriba:0

# Contorno cabeza de manga (curvas S)
CURVA A P1 control:-20
CURVA P1 P3 control:15
CURVA P3 B control:-10

# Laterales
LINEA B D
LINEA D PUN_DER
LINEA PUN_DER PUN_IZQ
LINEA PUN_IZQ C
LINEA C A

# Abertura (6cm desde muñeca)
PUNTO AB1 desde:D abajo:0 arriba:90
HILO P3 PUN_IZQ
MUESCA linea:AP1 pos:0.4
MUESCA linea:P1P3 pos:0.5

COTA A B "Espalda/2 + 1cm"
COTA A C "Largo manga"`,
    },

    'Cuello Camisero con Pie': {
      garment: 'camisa',
      gender:  null,
      code: `# ══════════════════════════════════════════
# CUELLO CAMISERO CON PIE
# Sistema Atelier Escuela
# ══════════════════════════════════════════

PIEZA Cuello Camisero

# ─── PALA DEL CUELLO ────────────────────
# A.B = Mitad del contorno del cuello
PUNTO A 0,0
PUNTO B desde:A der:CUELLO/2

# B.C = Ancho del cuello (4cm)
PUNTO C desde:B abajo:40

# Punta del cuello (vuelo hacia la derecha)
PUNTO PUNTA desde:B der:25 abajo:20

# Lado izquierdo
PUNTO D desde:A abajo:40

# Doblez central
PUNTO CENTRO desde:A der:CUELLO/4 abajo:20

LINEA A B
LINEA B PUNTA
CURVA PUNTA C control:5
LINEA C D
LINEA D A
DOBLEZ A B
HILO A D
MUESCA linea:AB pos:0
MUESCA linea:AB pos:1

COTA A B "Cuello/2"
COTA B C "Ancho 4cm"

# ─── PIE DE CUELLO ─────────────────────
# (separado — trazar debajo del cuello)
PUNTO P_A desde:A abajo:80
PUNTO P_B desde:B abajo:80
PUNTO P_C desde:P_B abajo:35
PUNTO P_D desde:P_A abajo:35

CURVA P_A P_B control:-8
LINEA P_B P_C
LINEA P_C P_D
LINEA P_D P_A
DOBLEZ P_A P_B
HILO P_A P_D

COTA P_A P_B "Cuello/2"
COTA P_B P_C "Pie 3cm"`,
    },

    'Falda Recta': {
      garment: 'falda',
      gender:  null,
      code: `# ══════════════════════════════════════════
# TRAZADO FALDA RECTA
# Sistema Atelier Escuela
# ══════════════════════════════════════════

PIEZA Falda Recta — Frente

# A.B = Cuarta parte de cadera
PUNTO A 0,0
PUNTO B desde:A der:H4

# B.C = Largo de falda
PUNTO C desde:B abajo:FALDA

# D = esquina inferior izquierda
PUNTO D desde:A abajo:FALDA

# 1 = nivel cadera (profundidad cadera)
PUNTO 1 desde:A abajo:CADERA_PROF

# Ajuste de cintura (caída natural)
PUNTO A1 desde:A arriba:5
PUNTO B1 desde:B abajo:15

# Pinza de cintura
PUNTO PINZA_CX desde:A der:H4/2
PUNTO PINZA_TOP desde:PINZA_CX abajo:15
PUNTO PINZA_BOT desde:PINZA_CX abajo:CADERA_PROF-20

# Contorno
CURVA A1 PINZA_TOP control:-8
LINEA PINZA_TOP PINZA_BOT costura
CURVA PINZA_BOT B1 control:8
LINEA B1 C
LINEA C D
DOBLEZ D A1

# Línea auxiliar de cadera
LINEA 1 B costura

HILO A D
MUESCA linea:B1C pos:0.5

COTA A B "Cadera/4"
COTA A D "Largo falda"`,
    },

  };

  // ── Estado del editor ────────────────────────────────────────
  let _modal     = null;
  let _editor    = null;
  let _currentManualKey = null;

  // ── ABRIR ────────────────────────────────────────────────────
  function open() {
    if (_modal) { _modal.classList.add('open'); _refreshManualsList(); return; }
    _injectStyles();
    _buildUI();
  }

  function close() {
    if (_modal) _modal.classList.remove('open');
  }

  // ── CSS ──────────────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('drafter-styles')) return;
    const s = document.createElement('style');
    s.id = 'drafter-styles';
    s.textContent = `
      #drafter-modal { z-index: 700; }

      .drafter-panel {
        position:relative;z-index:1;
        background:var(--panel);
        border:1px solid var(--brd2);
        border-radius:16px;
        width:min(1140px,97vw);
        max-height:95vh;
        display:flex;
        flex-direction:column;
        box-shadow:0 24px 64px rgba(0,0,0,.85);
        overflow:hidden;
      }

      /* Header */
      .drafter-hdr {
        display:flex;align-items:center;justify-content:space-between;
        padding:16px 20px;
        border-bottom:1px solid var(--brd);
        background:linear-gradient(135deg,rgba(139,92,246,.08) 0%,transparent 100%);
        flex-shrink:0;gap:12px;
      }
      .drafter-hdr-left { display:flex;align-items:center;gap:12px }
      .drafter-hdr h2 { font-size:15px;font-weight:800 }
      .drafter-hdr p  { font-size:11px;color:var(--tx3);margin-top:1px }
      .drafter-hdr-right { display:flex;gap:8px;align-items:center;flex-wrap:wrap }

      /* Cuerpo (3 columnas) */
      .drafter-body {
        display:grid;
        grid-template-columns:220px 1fr 260px;
        flex:1;overflow:hidden;min-height:0;
      }
      @media(max-width:900px){
        .drafter-body{grid-template-columns:1fr}
        .drafter-manuals-col,.drafter-info-col{display:none}
      }

      /* Columna izquierda: manuales guardados */
      .drafter-manuals-col {
        border-right:1px solid var(--brd);
        display:flex;flex-direction:column;overflow:hidden;
      }
      .drafter-col-title {
        font-size:10px;font-weight:700;letter-spacing:1px;
        text-transform:uppercase;color:var(--tx3);
        padding:12px 14px 8px;border-bottom:1px solid var(--brd);
        display:flex;align-items:center;justify-content:space-between;
        flex-shrink:0;
      }
      .drafter-manuals-list {
        flex:1;overflow-y:auto;padding:8px;
        display:flex;flex-direction:column;gap:5px;
      }
      .manual-item {
        padding:8px 10px;border-radius:var(--r);
        background:var(--inp);border:1.5px solid var(--brd);
        cursor:pointer;transition:all .15s;font-size:11px;
        display:flex;align-items:center;justify-content:space-between;gap:6px;
      }
      .manual-item:hover { background:var(--hov);border-color:var(--brd2) }
      .manual-item.active { background:var(--accbg);border-color:var(--acc);color:var(--acc2) }
      .manual-item-name { font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }
      .manual-item-type { font-size:9px;color:var(--tx3);flex-shrink:0 }
      .manual-del-btn { background:none;border:none;color:var(--tx3);cursor:pointer;font-size:12px;padding:1px 3px;line-height:1 }
      .manual-del-btn:hover { color:var(--red) }

      .manual-section-title {
        font-size:9px;font-weight:700;letter-spacing:.8px;
        text-transform:uppercase;color:var(--tx3);
        padding:8px 10px 4px;
      }

      /* Columna central: editor */
      .drafter-editor-col {
        display:flex;flex-direction:column;overflow:hidden;
        border-right:1px solid var(--brd);
      }
      .drafter-editor-hdr {
        display:flex;align-items:center;justify-content:space-between;
        padding:10px 14px;border-bottom:1px solid var(--brd);
        flex-shrink:0;gap:8px;flex-wrap:wrap;
      }
      .drafter-editor-name {
        background:none;border:none;
        color:var(--tx);font-size:13px;font-weight:700;
        font-family:var(--font);outline:none;
        flex:1;min-width:120px;
        border-bottom:1.5px solid var(--brd);padding:2px 4px;
        transition:border-color .15s;
      }
      .drafter-editor-name:focus { border-color:var(--acc) }

      .drafter-vars-bar {
        display:flex;gap:6px;flex-wrap:wrap;
        padding:8px 14px;border-bottom:1px solid var(--brd);
        flex-shrink:0;
      }
      .var-chip {
        background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.2);
        color:var(--acc2);border-radius:20px;
        padding:2px 9px;font-size:10px;font-weight:600;
        font-family:var(--mono);cursor:pointer;transition:all .15s;
        white-space:nowrap;
      }
      .var-chip:hover { background:rgba(139,92,246,.2);border-color:var(--acc) }

      .drafter-textarea {
        flex:1;resize:none;
        background:#0a0a12;
        border:none;
        color:#c8c0f0;
        padding:14px;
        font-size:12px;
        font-family:'Cascadia Code','Fira Code',monospace;
        line-height:1.75;
        outline:none;
        tab-size:2;
        min-height:0;
      }
      .drafter-textarea:focus { outline:none }

      .drafter-errors-bar {
        background:rgba(248,113,113,.06);
        border-top:1px solid rgba(248,113,113,.2);
        font-size:10px;color:#f87171;
        font-family:monospace;line-height:1.6;
        padding:8px 14px;max-height:60px;overflow-y:auto;
        flex-shrink:0;display:none;
        white-space:pre;
      }

      .drafter-actions-bar {
        display:flex;gap:8px;padding:10px 14px;
        border-top:1px solid var(--brd);flex-shrink:0;
        flex-wrap:wrap;align-items:center;
      }

      /* Columna derecha: preview + info */
      .drafter-info-col {
        display:flex;flex-direction:column;overflow:hidden;
      }
      .drafter-preview-wrap {
        flex:1;position:relative;overflow:hidden;
        background:#0a0a12;border-bottom:1px solid var(--brd);
        min-height:0;
      }
      #drafter-svg {
        width:100%;height:100%;
        cursor:crosshair;
      }

      .drafter-points-wrap {
        padding:10px 12px;overflow-y:auto;
        max-height:200px;flex-shrink:0;
      }
      .pts-table {
        width:100%;border-collapse:collapse;font-size:10px;
        font-family:var(--mono);
      }
      .pts-table th {
        text-align:left;color:var(--tx3);font-weight:700;
        letter-spacing:.6px;text-transform:uppercase;
        padding:4px 6px;border-bottom:1px solid var(--brd);font-size:9px;
      }
      .pts-table td {
        padding:3px 6px;color:var(--tx2);border-bottom:1px solid var(--brd);
      }
      .pts-table tr:hover td { background:var(--hov) }
      .pts-table .pt-name { color:var(--acc2);font-weight:700 }

      .drafter-info-box {
        padding:10px 12px;border-top:1px solid var(--brd);flex-shrink:0;
        font-size:11px;
      }
      .info-row { display:flex;justify-content:space-between;margin-bottom:4px }
      .info-label { color:var(--tx3) }
      .info-value { color:var(--tx);font-weight:600;font-family:var(--mono) }

      /* Botones */
      .btn-compile {
        background:linear-gradient(135deg,var(--acc),#6d28d9);
        color:#fff;border:none;border-radius:var(--r);
        padding:9px 18px;font-size:12px;font-weight:700;
        cursor:pointer;font-family:var(--font);
        box-shadow:0 2px 12px rgba(139,92,246,.3);
        transition:all .15s;
        display:flex;align-items:center;gap:6px;
      }
      .btn-compile:hover { filter:brightness(1.1);transform:translateY(-1px) }
      .btn-save-manual {
        background:var(--inp);border:1.5px solid var(--brd2);
        color:var(--tx);border-radius:var(--r);
        padding:9px 14px;font-size:12px;font-weight:600;
        cursor:pointer;font-family:var(--font);transition:all .15s;
      }
      .btn-save-manual:hover { background:var(--hov) }
      .btn-add-pattern {
        background:rgba(52,211,153,.1);border:1.5px solid rgba(52,211,153,.3);
        color:#34d399;border-radius:var(--r);
        padding:9px 14px;font-size:12px;font-weight:600;
        cursor:pointer;font-family:var(--font);transition:all .15s;
      }
      .btn-add-pattern:hover { background:rgba(52,211,153,.2) }
      .btn-replace-preset {
        background:rgba(251,191,36,.1);border:1.5px solid rgba(251,191,36,.3);
        color:var(--yel);border-radius:var(--r);
        padding:9px 14px;font-size:12px;font-weight:600;
        cursor:pointer;font-family:var(--font);transition:all .15s;
      }
      .btn-replace-preset:hover { background:rgba(251,191,36,.2) }
      .btn-drafter-g {
        background:transparent;border:1.5px solid var(--brd);
        color:var(--tx2);border-radius:var(--r);
        padding:8px 12px;font-size:11px;font-weight:600;
        cursor:pointer;font-family:var(--font);transition:all .15s;
      }
      .btn-drafter-g:hover { background:var(--inp);color:var(--tx);border-color:var(--brd2) }

      /* Modal de confirmación */
      .drafter-confirm {
        position:fixed;inset:0;z-index:850;
        display:flex;align-items:center;justify-content:center;
      }
      .drafter-confirm-box {
        position:relative;z-index:1;
        background:var(--panel);border:1px solid var(--brd2);
        border-radius:14px;width:min(400px,92vw);
        padding:28px;box-shadow:0 16px 48px rgba(0,0,0,.7);
        text-align:center;
      }
      .drafter-confirm-box h3 { font-size:16px;font-weight:800;margin-bottom:8px }
      .drafter-confirm-box p  { font-size:12px;color:var(--tx2);margin-bottom:20px;line-height:1.6 }
      .drafter-confirm-actions { display:flex;gap:10px;justify-content:center;flex-wrap:wrap }

      /* Selector de tipo de prenda */
      .garment-type-sel {
        background:var(--inp);border:1.5px solid var(--brd);
        color:var(--tx);border-radius:var(--r);
        padding:6px 10px;font-size:11px;outline:none;cursor:pointer;
      }
    `;
    document.head.appendChild(s);
  }

  // ── CONSTRUIR UI ─────────────────────────────────────────────
  function _buildUI() {
    _modal = document.createElement('div');
    _modal.id        = 'drafter-modal';
    _modal.className = 'modal open';

    const state   = window.PAT?.App?.getState?.() || {};
    const measures = state.measures || {};
    const vars     = _buildVarsDisplay(measures);

    _modal.innerHTML = `
      <div class="m-ov" id="drafter-overlay"></div>
      <div class="drafter-panel">

        <!-- HEADER -->
        <div class="drafter-hdr">
          <div class="drafter-hdr-left">
            <span style="font-size:20px">✏️</span>
            <div>
              <h2>Editor de Trazado Manual</h2>
              <p>Define puntos con fórmulas basadas en tus medidas reales</p>
            </div>
          </div>
          <div class="drafter-hdr-right">
            <select id="drafter-example-sel" class="garment-type-sel">
              <option value="">Cargar ejemplo…</option>
              ${Object.keys(BUILTIN_EXAMPLES).map(k =>
                `<option value="${k}">${k}</option>`
              ).join('')}
            </select>
            <button class="btn-drafter-g" id="drafter-help-btn">? Referencia</button>
            <button class="m-close" id="drafter-close-btn">✕</button>
          </div>
        </div>

        <!-- CUERPO -->
        <div class="drafter-body">

          <!-- COL 1: MANUALES GUARDADOS -->
          <div class="drafter-manuals-col">
            <div class="drafter-col-title">
              Mis manuales
              <button class="btn-drafter-g" id="drafter-new-btn" style="padding:3px 8px;font-size:10px">+ Nuevo</button>
            </div>
            <div class="drafter-manuals-list" id="drafter-manuals-list"></div>
          </div>

          <!-- COL 2: EDITOR DE CÓDIGO -->
          <div class="drafter-editor-col">

            <div class="drafter-editor-hdr">
              <input type="text" id="drafter-piece-name"
                     class="drafter-editor-name"
                     value="Mi Pieza"
                     placeholder="Nombre de la pieza…" />
              <select id="drafter-garment-type" class="garment-type-sel" title="Tipo de prenda para reemplazar">
                <option value="">Tipo de prenda…</option>
                <option value="franela">Franela</option>
                <option value="blusa">Blusa</option>
                <option value="camisa_dama">Camisa Dama</option>
                <option value="camisa_caballero">Camisa Caballero</option>
                <option value="falda">Falda</option>
                <option value="vestido">Vestido</option>
              </select>
            </div>

            <!-- Chips de variables disponibles -->
            <div class="drafter-vars-bar" title="Haz clic para insertar en el editor">
              <span style="font-size:10px;color:var(--tx3);margin-right:4px">Variables:</span>
              ${vars.map(v => `<span class="var-chip" data-var="${v.key}" title="${v.desc}">${v.key}</span>`).join('')}
            </div>

            <textarea id="drafter-code"
                      class="drafter-textarea"
                      spellcheck="false"
                      placeholder="# Escribe tus instrucciones de trazado aquí
# Ejemplo:
PIEZA Mi Blusa
PUNTO A 0,0
PUNTO B desde:A der:B4
PUNTO C desde:B abajo:TALLE_ESP
LINEA A B
LINEA B C"></textarea>

            <div class="drafter-errors-bar" id="drafter-errors"></div>

            <div class="drafter-actions-bar">
              <button class="btn-compile" id="drafter-run">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Generar
              </button>
              <button class="btn-save-manual" id="drafter-save-btn">💾 Guardar manual</button>
              <button class="btn-add-pattern" id="drafter-add-btn">＋ Agregar al patrón</button>
              <button class="btn-replace-preset" id="drafter-replace-btn">⇄ Reemplazar prenda base</button>
              <button class="btn-drafter-g" id="drafter-clear-btn">✕ Limpiar</button>
            </div>
          </div>

          <!-- COL 3: PREVIEW + INFO -->
          <div class="drafter-info-col">
            <div class="drafter-col-title" style="padding:12px">Vista previa</div>
            <div class="drafter-preview-wrap">
              <svg id="drafter-svg"
                   xmlns="http://www.w3.org/2000/svg"
                   viewBox="0 0 400 400">
                <defs>
                  <pattern id="dg" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M50 0L0 0 0 50" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
                  </pattern>
                  <marker id="arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
                    <path d="M0,0 L0,7 L7,3.5 z" fill="#8b5cf6"/>
                  </marker>
                  <marker id="arrow-rev" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
                    <path d="M0,0 L0,7 L7,3.5 z" fill="#8b5cf6"/>
                  </marker>
                </defs>
                <rect x="-9999" y="-9999" width="19998" height="19998" fill="url(#dg)"/>
                <g id="drafter-preview-g"></g>
              </svg>
            </div>

            <div class="drafter-col-title" style="padding:10px 12px 4px">Puntos definidos</div>
            <div class="drafter-points-wrap">
              <table class="pts-table" id="drafter-pts-table">
                <thead>
                  <tr><th>Punto</th><th>X (mm)</th><th>Y (mm)</th><th>Desc</th></tr>
                </thead>
                <tbody id="drafter-pts-body">
                  <tr><td colspan="4" style="color:var(--tx3);text-align:center;padding:10px">Sin puntos aún</td></tr>
                </tbody>
              </table>
            </div>

            <div class="drafter-info-box" id="drafter-info-box">
              <div class="info-row"><span class="info-label">Tamaño aprox.</span><span class="info-value" id="drafter-size">—</span></div>
              <div class="info-row"><span class="info-label">Puntos</span><span class="info-value" id="drafter-pt-count">0</span></div>
              <div class="info-row"><span class="info-label">Líneas</span><span class="info-value" id="drafter-ln-count">0</span></div>
            </div>
          </div>

        </div>
      </div>

      <!-- Panel de referencia -->
      <div id="drafter-ref-panel" style="
        display:none;position:fixed;right:20px;top:80px;z-index:720;
        background:var(--panel);border:1px solid var(--brd2);border-radius:12px;
        width:340px;max-height:82vh;box-shadow:0 8px 32px rgba(0,0,0,.6);
        display:none;flex-direction:column;overflow:hidden;
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--brd);flex-shrink:0">
          <span style="font-weight:700;font-size:13px">📖 Referencia de comandos</span>
          <button class="btn-drafter-g" id="drafter-ref-close" style="padding:3px 8px">✕</button>
        </div>
        <div style="overflow-y:auto;padding:14px 16px;font-size:11px;line-height:1.75;color:var(--tx2)">
          ${_helpHTML()}
        </div>
      </div>
    `;

    document.body.appendChild(_modal);
    _editor = document.getElementById('drafter-code');

    _bindEvents();
    _refreshManualsList();
    _loadExample(Object.keys(BUILTIN_EXAMPLES)[0]);
  }

  // ── EVENTOS ──────────────────────────────────────────────────
  function _bindEvents() {
    document.getElementById('drafter-overlay').onclick  = close;
    document.getElementById('drafter-close-btn').onclick = close;

    document.getElementById('drafter-run').onclick = _compile;
    document.getElementById('drafter-clear-btn').onclick = () => {
      _editor.value = '';
      _clearPreview();
    };
    document.getElementById('drafter-add-btn').onclick     = _addToMainPattern;
    document.getElementById('drafter-replace-btn').onclick = _replacePreset;
    document.getElementById('drafter-save-btn').onclick    = _saveManual;
    document.getElementById('drafter-new-btn').onclick     = _newManual;

    // Cargar ejemplo predefinido
    document.getElementById('drafter-example-sel').onchange = function() {
      if (this.value) { _loadExample(this.value); this.value = ''; }
    };

    // Panel de referencia
    document.getElementById('drafter-help-btn').onclick = () => {
      const p = document.getElementById('drafter-ref-panel');
      p.style.display = p.style.display === 'none' || !p.style.display ? 'flex' : 'none';
      p.style.flexDirection = 'column';
    };
    document.getElementById('drafter-ref-close').onclick = () => {
      document.getElementById('drafter-ref-panel').style.display = 'none';
    };

    // Insertar variable al hacer clic en chip
    document.querySelectorAll('.var-chip').forEach(chip => {
      chip.onclick = () => {
        const v   = chip.dataset.var;
        const pos = _editor.selectionStart;
        const before = _editor.value.slice(0, pos);
        const after  = _editor.value.slice(pos);
        _editor.value = before + v + after;
        _editor.focus();
        _editor.setSelectionRange(pos + v.length, pos + v.length);
      };
    });

    // Auto-compilar (debounce 700ms)
    let _t = null;
    _editor.oninput = () => { clearTimeout(_t); _t = setTimeout(_compile, 700); };
  }

  // ── COMPILAR Y PREVISUALIZAR ─────────────────────────────────
  function _compile() {
    const text = _editor?.value || '';
    if (!text.trim()) return;

    // Actualizar nombre desde el textarea si tiene PIEZA
    const pMatch = text.match(/^PIEZA\s+(.+)$/im);
    if (pMatch) {
      const nameInput = document.getElementById('drafter-piece-name');
      if (nameInput && !nameInput._userEdited) nameInput.value = pMatch[1].trim();
    }

    const measures = window.PAT?.App?.getState?.()?.measures || {};
    const result   = PAT.Drafter.compileAndRender(text, measures);

    // Mostrar errores
    const errBox = document.getElementById('drafter-errors');
    if (errBox) {
      const msgs = [...(result.errors||[]).map(e=>'❌ '+e),
                    ...(result.warnings||[]).map(w=>'⚠️ '+w)];
      errBox.textContent  = msgs.join('\n');
      errBox.style.display= msgs.length ? 'block' : 'none';
    }

    if (!result.piece) { _clearPreview(); return; }

    // Actualizar SVG preview
    const g = document.getElementById('drafter-preview-g');
    if (g) {
      while (g.firstChild) g.removeChild(g.firstChild);
      g.appendChild(result.piece.group.cloneNode(true));
    }

    // Ajustar viewBox
    const b = result.piece.bounds;
    const PAD = 15;
    const svg = document.getElementById('drafter-svg');
    if (svg) {
      svg.setAttribute('viewBox',
        (b.x-PAD)+' '+(b.y-PAD)+' '+(b.w+PAD*2)+' '+(b.h+PAD*2)
      );
    }

    // Tabla de puntos
    _renderPointsTable(result.points);

    // Info
    const wCm = Math.round(b.w/10), hCm = Math.round(b.h/10);
    const sizeEl = document.getElementById('drafter-size');
    const ptEl   = document.getElementById('drafter-pt-count');
    if (sizeEl) sizeEl.textContent = wCm + ' × ' + hCm + ' cm';
    if (ptEl)   ptEl.textContent   = Object.keys(result.points).length;
  }

  function _clearPreview() {
    const g = document.getElementById('drafter-preview-g');
    if (g) while (g.firstChild) g.removeChild(g.firstChild);
  }

  function _renderPointsTable(points) {
    const tbody = document.getElementById('drafter-pts-body');
    if (!tbody) return;
    const entries = Object.entries(points);
    if (!entries.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="color:var(--tx3);text-align:center;padding:10px">Sin puntos</td></tr>';
      return;
    }
    tbody.innerHTML = entries.map(([name, pt]) => {
      const dist = Math.round(Math.hypot(pt.x, pt.y));
      return `<tr>
        <td class="pt-name">${name}</td>
        <td>${Math.round(pt.x)}</td>
        <td>${Math.round(pt.y)}</td>
        <td style="color:var(--tx3)">${dist}mm</td>
      </tr>`;
    }).join('');
  }

  // ── GUARDAR MANUAL ───────────────────────────────────────────
  function _saveManual() {
    const name    = document.getElementById('drafter-piece-name')?.value.trim() || 'Manual sin nombre';
    const code    = _editor?.value || '';
    const garment = document.getElementById('drafter-garment-type')?.value || '';
    if (!code.trim()) { PAT.App.toast('Escribe instrucciones primero', 'error'); return; }

    const manuals = _loadManuals();
    const id      = _currentManualKey || ('manual_' + Date.now());

    manuals[id] = {
      id, name, code, garment,
      savedAt: new Date().toISOString(),
    };

    _saveManuals(manuals);
    _currentManualKey = id;
    _refreshManualsList();
    PAT.App.toast('💾 Manual "' + name + '" guardado', 'success');
  }

  function _newManual() {
    _currentManualKey = null;
    _editor.value = '';
    document.getElementById('drafter-piece-name').value = 'Nueva Pieza';
    document.getElementById('drafter-garment-type').value = '';
    _clearPreview();
    _renderPointsTable({});
  }

  function _loadExample(key) {
    const ex = BUILTIN_EXAMPLES[key];
    if (!ex) return;
    _editor.value = ex.code;
    const nameInput = document.getElementById('drafter-piece-name');
    if (nameInput) { nameInput.value = key; nameInput._userEdited = false; }
    if (ex.garment) {
      const gSel = document.getElementById('drafter-garment-type');
      if (gSel) {
        const val = ex.gender ? ex.garment + '_' + ex.gender : ex.garment;
        gSel.value = val || ex.garment;
      }
    }
    _compile();
  }

  function _refreshManualsList() {
    const list = document.getElementById('drafter-manuals-list');
    if (!list) return;

    const manuals = _loadManuals();
    const keys    = Object.keys(manuals);
    list.innerHTML = '';

    // Sección: manuales guardados por el usuario
    if (keys.length > 0) {
      const userTitle = document.createElement('div');
      userTitle.className = 'manual-section-title';
      userTitle.textContent = 'Mis manuales';
      list.appendChild(userTitle);

      keys.forEach(id => {
        const m   = manuals[id];
        const div = document.createElement('div');
        div.className = 'manual-item' + (_currentManualKey === id ? ' active' : '');
        div.innerHTML = `
          <span class="manual-item-name">${m.name}</span>
          <span class="manual-item-type">${m.garment || '—'}</span>
          <button class="manual-del-btn" data-id="${id}" title="Eliminar">✕</button>
        `;
        div.addEventListener('click', function(e) {
          if (e.target.classList.contains('manual-del-btn')) return;
          _currentManualKey = id;
          _editor.value = m.code;
          document.getElementById('drafter-piece-name').value = m.name;
          const gSel = document.getElementById('drafter-garment-type');
          if (gSel) gSel.value = m.garment || '';
          _compile();
          _refreshManualsList();
        });
        div.querySelector('.manual-del-btn').addEventListener('click', function(e) {
          e.stopPropagation();
          if (!confirm('¿Eliminar manual "' + m.name + '"?')) return;
          delete manuals[id];
          _saveManuals(manuals);
          if (_currentManualKey === id) _currentManualKey = null;
          _refreshManualsList();
          PAT.App.toast('"' + m.name + '" eliminado');
        });
        list.appendChild(div);
      });
    }

    // Sección: ejemplos prediseñados
    const exTitle = document.createElement('div');
    exTitle.className = 'manual-section-title';
    exTitle.textContent = 'Ejemplos incluidos';
    list.appendChild(exTitle);

    Object.keys(BUILTIN_EXAMPLES).forEach(key => {
      const div = document.createElement('div');
      div.className = 'manual-item';
      div.innerHTML = `
        <span class="manual-item-name">${key}</span>
        <span class="manual-item-type" style="color:var(--acc2)">base</span>
      `;
      div.addEventListener('click', () => _loadExample(key));
      list.appendChild(div);
    });
  }

  // ── AGREGAR AL PATRÓN PRINCIPAL ──────────────────────────────
  function _addToMainPattern() {
    const text     = _editor?.value || '';
    const measures = window.PAT?.App?.getState?.()?.measures || {};
    const result   = PAT.Drafter.compileAndRender(text, measures);
    if (!result.piece) { PAT.App.toast('No hay pieza válida', 'error'); return; }

    const content = document.getElementById('pattern-content');
    if (!content) { PAT.App.toast('Error: SVG principal no encontrado', 'error'); return; }

    // Calcular offset para no solaparse
    let offsetX = 30, offsetY = 30;
    try {
      const existing = content.getBBox();
      if (existing.width > 0) offsetX = existing.x + existing.width + 35;
    } catch(e) {}

    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wrapper.setAttribute('transform', 'translate(' + offsetX + ',' + offsetY + ')');
    wrapper.setAttribute('class', 'manual-piece');
    wrapper.appendChild(result.piece.group.cloneNode(true));
    content.appendChild(wrapper);

    // Expandir viewBox del SVG principal
    const mainSVG = document.getElementById('pattern-svg');
    if (mainSVG) {
      const vbParts = (mainSVG.getAttribute('viewBox') || '0 0 600 400').split(' ').map(Number);
      const newW = Math.max(vbParts[2], offsetX + result.piece.bounds.w + 50);
      const newH = Math.max(vbParts[3], offsetY + result.piece.bounds.h + 50);
      mainSVG.setAttribute('viewBox', '0 0 ' + newW + ' ' + newH);
      mainSVG.setAttribute('width',  newW + 'mm');
      mainSVG.setAttribute('height', newH + 'mm');
    }

    close();
    PAT.App.toast('✅ "' + result.piece.name + '" agregado al patrón', 'success');
    if (PAT.App.fitScreen) setTimeout(PAT.App.fitScreen, 120);
  }

  // ── REEMPLAZAR PRENDA PREDISEÑADA ────────────────────────────
  function _replacePreset() {
    const garmentSel = document.getElementById('drafter-garment-type')?.value;
    if (!garmentSel) {
      PAT.App.toast('Selecciona el tipo de prenda a reemplazar', 'warning');
      return;
    }

    const text     = _editor?.value || '';
    const measures = window.PAT?.App?.getState?.()?.measures || {};
    const result   = PAT.Drafter.compileAndRender(text, measures);
    if (!result.piece) { PAT.App.toast('Compila el patrón primero', 'error'); return; }

    // Parsear tipo de prenda y género
    const parts   = garmentSel.split('_');
    const garment = parts[0];
    const gender  = parts[1] || null;

    const garmentNames = {
      franela: 'Franela', blusa: 'Blusa',
      camisa_dama: 'Camisa Dama', camisa_caballero: 'Camisa Caballero',
      falda: 'Falda', vestido: 'Vestido',
    };
    const gName = garmentNames[garmentSel] || garmentSel;

    _showConfirmReplace(gName, result.piece.name, () => {
      // Guardar como override en localStorage
      _savePresetOverride(garmentSel, {
        name:    result.piece.name,
        code:    text,
        savedAt: new Date().toISOString(),
      });

      // Registrar en el engine para que use esta pieza
      if (!window.PAT._presetOverrides) window.PAT._presetOverrides = {};
      window.PAT._presetOverrides[garmentSel] = {
        code: text, pieceName: result.piece.name
      };

      close();
      PAT.App.toast('✅ "' + result.piece.name + '" es ahora el patrón base de ' + gName, 'success');

      // Regenerar el patrón activo si coincide con la prenda reemplazada
      const appState = window.PAT?.App?.getState?.();
      if (appState && appState.garment === garment) {
        PAT.App.generate?.(80);
      }
    });
  }

  function _showConfirmReplace(presetName, pieceName, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'drafter-confirm';
    overlay.innerHTML = `
      <div class="m-ov"></div>
      <div class="drafter-confirm-box">
        <div style="font-size:32px;margin-bottom:12px">⇄</div>
        <h3>¿Reemplazar patrón base?</h3>
        <p>
          El patrón <strong>"${pieceName}"</strong> que acabas de trazar reemplazará
          el patrón prediseñado de <strong>${presetName}</strong>.<br><br>
          Cuando selecciones <em>${presetName}</em> en el menú,
          se usará <strong>tu patrón manual</strong> en lugar del predeterminado.
        </p>
        <div class="drafter-confirm-actions">
          <button class="btn-replace-preset" id="confirm-replace-yes">✓ Sí, reemplazar</button>
          <button class="btn-drafter-g" id="confirm-replace-no">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirm-replace-yes').onclick = () => {
      overlay.remove(); onConfirm();
    };
    overlay.querySelector('#confirm-replace-no').onclick  = () => overlay.remove();
    overlay.querySelector('.m-ov').onclick = () => overlay.remove();
  }

  // ── PERSISTENCIA ─────────────────────────────────────────────
  function _loadManuals() {
    try { return JSON.parse(localStorage.getItem(MANUALS_KEY) || '{}'); } catch(e) { return {}; }
  }
  function _saveManuals(manuals) {
    localStorage.setItem(MANUALS_KEY, JSON.stringify(manuals));
  }
  function _savePresetOverride(key, data) {
    try {
      const overrides = JSON.parse(localStorage.getItem('pat_preset_overrides') || '{}');
      overrides[key] = data;
      localStorage.setItem('pat_preset_overrides', JSON.stringify(overrides));
    } catch(e) {}
  }

  // ── VARIABLES PARA MOSTRAR ───────────────────────────────────
  function _buildVarsDisplay(m) {
    const bust = m.bust || 88;
    return [
      { key:'B4',        desc:'Busto÷4 = '      + Math.round(bust*10/4)   + 'mm' },
      { key:'B6',        desc:'Busto÷6 = '      + Math.round(bust*10/6)   + 'mm' },
      { key:'B8',        desc:'Busto÷8 = '      + Math.round(bust*10/8)   + 'mm' },
      { key:'B12',       desc:'Busto÷12 = '     + Math.round(bust*10/12)  + 'mm' },
      { key:'E2',        desc:'Espalda÷2 = '    + Math.round((m.shoulder||38)*10/2) + 'mm' },
      { key:'H4',        desc:'Cadera÷4 = '     + Math.round((m.hip||94)*10/4) + 'mm' },
      { key:'W4',        desc:'Cintura÷4 = '    + Math.round((m.waist||68)*10/4) + 'mm' },
      { key:'TALLE_ESP', desc:'Talle espalda = ' + (m.backLength||40)*10  + 'mm' },
      { key:'TALLE_DEL', desc:'Talle delantero = '+(m.frontLength||42)*10 + 'mm' },
      { key:'LARGO',     desc:'Largo total = '  + (m.totalLength||65)*10  + 'mm' },
      { key:'MANGA',     desc:'Largo manga = '  + (m.sleeveLength||60)*10 + 'mm' },
      { key:'CUELLO',    desc:'Contorno cuello = '+(m.neck||36)*10 + 'mm' },
      { key:'BUSTO',     desc:'Busto completo = ' + (m.bust||88)*10 + 'mm' },
      { key:'CADERA',    desc:'Cadera completa = '+(m.hip||94)*10  + 'mm' },
    ];
  }

  // ── HTML DE REFERENCIA ────────────────────────────────────────
  function _helpHTML() {
    return `
      <div style="display:flex;flex-direction:column;gap:14px">

        <div>
          <div style="font-weight:700;color:var(--tx);margin-bottom:6px">📐 PUNTO — Definir un punto</div>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block;margin-bottom:4px">PUNTO A 0,0</code>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block;margin-bottom:4px">PUNTO B desde:A der:B4+20</code>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block">PUNTO C desde:A der:B6 abajo:TALLE_ESP</code>
          <div style="margin-top:4px;color:var(--tx3)">Direcciones: <code>der</code> <code>izq</code> <code>abajo</code> <code>arriba</code></div>
        </div>

        <div>
          <div style="font-weight:700;color:var(--tx);margin-bottom:6px">📏 LINEA — Línea recta</div>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block;margin-bottom:4px">LINEA A B</code>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block">LINEA A B costura</code>
        </div>

        <div>
          <div style="font-weight:700;color:var(--tx);margin-bottom:6px">〜 CURVA — Curva entre puntos</div>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block;margin-bottom:4px">CURVA A B control:15</code>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block;margin-bottom:4px">CURVA A B control:-10</code>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block">CURVA A B semicurva:20</code>
          <div style="margin-top:4px;color:var(--tx3)">control+ = curva derecha, control- = izquierda<br>semicurva = forma de sisa</div>
        </div>

        <div>
          <div style="font-weight:700;color:var(--tx);margin-bottom:6px">⌒ ARCO — Arco de circunferencia</div>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block">ARCO A B radio:50 dir:convexo</code>
        </div>

        <div>
          <div style="font-weight:700;color:var(--tx);margin-bottom:6px">🔴 DOBLEZ / HILO / MUESCA / COTA</div>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block;margin-bottom:3px">DOBLEZ A D</code>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block;margin-bottom:3px">HILO A C</code>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block;margin-bottom:3px">MUESCA linea:AB pos:0.5</code>
          <code style="background:var(--inp);padding:4px 8px;border-radius:4px;display:block">COTA A B "Busto/4"</code>
        </div>

        <div>
          <div style="font-weight:700;color:var(--tx);margin-bottom:6px">🔢 Variables de medidas</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;font-family:monospace;font-size:10px">
            <span>B4 = busto÷4</span><span>B6 = busto÷6</span>
            <span>E2 = espalda÷2</span><span>H4 = cadera÷4</span>
            <span>W4 = cintura÷4</span><span>B12 = busto÷12</span>
            <span>TALLE_ESP</span><span>TALLE_DEL</span>
            <span>LARGO</span><span>MANGA</span>
            <span>CUELLO</span><span>MUNECA</span>
          </div>
          <div style="margin-top:6px;color:var(--tx3)">
            Puedes usar fórmulas: <code>B4+20</code> <code>MANGA-50</code> <code>CUELLO/2+30</code>
          </div>
        </div>

        <div>
          <div style="font-weight:700;color:var(--tx);margin-bottom:6px">✏️ Ejemplo completo (Atelier Escuela)</div>
          <code style="background:var(--inp);padding:8px;border-radius:4px;display:block;font-size:10px;line-height:1.8;white-space:pre">PIEZA Blusa Trasera
# Rectángulo base
PUNTO A 0,0
PUNTO B desde:A der:B4
PUNTO C desde:B abajo:TALLE_ESP
PUNTO D desde:A abajo:TALLE_ESP
# Cuello
PUNTO 1 desde:A der:B6
PUNTO 2 desde:A abajo:20
# Hombro
PUNTO 3 desde:1 der:E2-20 abajo:10
# Sisa
PUNTO E desde:B abajo:B4
# Contorno
CURVA 2 1 control:-8
LINEA 1 3
CURVA 3 E semicurva:15
LINEA E C
LINEA C D
DOBLEZ D A
HILO A D</code>
        </div>

      </div>
    `;
  }

  return { open, close };
})();
