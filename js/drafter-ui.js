/**
 * drafter-ui.js
 * Panel de editor de trazado manual con ejemplos y ayuda.
 */
'use strict';
window.PAT = window.PAT || {};

PAT.DrafterUI = (function () {

  const EXAMPLES = {
    'Cuadrado básico': `# Cuadrado simple 20×20cm
PIEZA Cuadrado de prueba

PUNTO A 0,0
PUNTO B desde:A der:200
PUNTO C desde:B abajo:200
PUNTO D desde:A abajo:200

LINEA A B
LINEA B C
LINEA C D
LINEA D A

HILO A C
COTA A B "Ancho 20cm"
COTA A D "Alto 20cm"`,

    'Rectángulo espalda': `# Bloque básico de espalda
# Medidas ejemplo: Busto 88cm
PIEZA Espalda básica

# Puntos principales
PUNTO A 0,0            # CB nuca
PUNTO B desde:A der:220  # Ancho de bloque (busto/4 + ease) = 22cm
PUNTO C desde:B abajo:400  # Largo espalda 40cm
PUNTO D desde:A abajo:400  # CB cintura

# Línea de sisa (profundidad)
PUNTO E desde:A abajo:142  # Prof. sisa (busto*0.14 + 5cm = 17.32cm → 142mm aprox)
PUNTO F desde:B abajo:142  # Sisa lateral

# Cuello
PUNTO G desde:A der:55   # Ancho cuello (busto/12 + 0.5cm ≈ 5.5cm)
PUNTO H desde:A abajo:25 # Profundidad cuello espalda 2.5cm

# Hombro
PUNTO I desde:G der:120 abajo:15  # Punta del hombro (caída 1.5cm)

# Contorno
CURVA A H control:-10     # Curva cuello CB
LINEA H G                 # Cuello
LINEA G I                 # Hombro
CURVA I F control:8       # Sisa
LINEA F C                 # Lateral
LINEA C D                 # Dobladillo
DOBLEZ D A                # Línea de doblez CB

HILO A C
MUESCA linea:IF pos:0.5

COTA A B "Ancho bloque"
COTA A D "Largo espalda"`,

    'Manga sencilla': `# Manga básica
PIEZA Manga básica

# Puntos base
PUNTO A 0,130          # Extremo izq sisa
PUNTO B desde:A der:260  # Extremo der sisa (ancho manga)
PUNTO PICO desde:A der:130 arriba:130  # Pico cabeza de manga

# Puño
PUNTO C desde:A abajo:600 der:40  # Muñeca izq
PUNTO D desde:B abajo:600 izq:40  # Muñeca der

# Cabeza de manga (curva)
CURVA A PICO control:-15
CURVA PICO B control:-15

# Laterales
LINEA B D
LINEA D C
LINEA C A

# Muescas de unión
MUESCA linea:APICO pos:0.4
MUESCA linea:PICOB pos:0.6

HILO PICO C
COTA A B "Ancho cabeza"
COTA A C "Largo manga"`,

    'Pinza de busto': `# Frente con pinza de busto en costado
PIEZA Frente con pinza

PUNTO A 0,0        # CF nuca (línea de doblez)
PUNTO B desde:A der:220  # Ancho bloque frente
PUNTO C desde:B abajo:420  # Costado cintura
PUNTO D desde:A abajo:420  # CF cintura

# Punto de busto (ápice)
PUNTO BP desde:A der:118 abajo:190  # Busto point ~60% del ancho, 45% del largo

# Pinza en costado (a nivel de busto)
PUNTO P1 desde:B abajo:165  # Extremo sup pinza
PUNTO P2 desde:B abajo:195  # Extremo inf pinza

# Sisa y hombro simplificados
PUNTO E desde:A der:55 abajo:30   # Cuello frente
PUNTO F desde:A der:180 abajo:15  # Punta hombro

# Contorno
CURVA A E control:8           # Curva cuello frente
LINEA E F                     # Hombro
CURVA F B control:10          # Sisa simplificada
LINEA B P1                    # Costado hasta pinza
LINEA P1 BP                   # Pinza sup
LINEA BP P2                   # Pinza inf
LINEA P2 C                    # Costado inferior
LINEA C D                     # Dobladillo
DOBLEZ D A                    # CF doblez

HILO A C
MUESCA linea:P1B pos:0

COTA A B "Ancho bloque"
COTA BP P1 "Largo pinza"`,
  };

  const HELP_TEXT = `COMANDOS DISPONIBLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PUNTO nombre x,y
  Define un punto en coordenadas absolutas (mm)
  Ejemplo: PUNTO A 0,0

PUNTO nombre desde:REF der:N abajo:N arriba:N izq:N
  Define un punto relativo a otro
  Ejemplo: PUNTO B desde:A der:100 abajo:50

LINEA A B [costura]
  Línea recta entre dos puntos
  Agrega "costura" para línea punteada

CURVA A B control:N
  Curva con desplazamiento perpendicular de N mm
  N positivo = hacia la derecha del trayecto
  N negativo = hacia la izquierda

CURVA A B cp:x,y
  Curva con punto de control manual

ARCO A B radio:N [concavo|convexo]
  Arco de circunferencia

DOBLEZ A B
  Línea de doblez (roja punteada)

HILO A B
  Línea de hilo recto (azul con flechas)

MUESCA linea:AB pos:0.5
  Muesca a la mitad de la línea A→B
  pos: 0=inicio, 0.5=mitad, 1=final

COTA A B "Etiqueta"
  Línea de cota con medida automática

CERRAR
  Cierra el contorno al primer punto

PIEZA Nombre de la pieza
  Define el nombre de la pieza

# Comentarios con # o //

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSIÓN DE MEDIDAS:
  1 cm = 10 mm (usar mm en el editor)
  Busto 88cm → 880mm ÷ 4 = 220mm por bloque
  Largo espalda 40cm → 400mm`;

  let _modal    = null;
  let _editor   = null;
  let _preview  = null;
  let _errorBox = null;

  // ─── ABRIR EDITOR ─────────────────────────────────────────────
  function open() {
    if (_modal) { _modal.classList.add('open'); return; }
    _buildUI();
  }

  function close() {
    if (_modal) _modal.classList.remove('open');
  }

  // ─── CONSTRUIR UI ─────────────────────────────────────────────
  function _buildUI() {
    _modal = document.createElement('div');
    _modal.id = 'drafter-modal';
    _modal.className = 'modal open';

    _modal.innerHTML = `
      <div class="m-ov" id="drafter-ov"></div>
      <div class="drafter-panel">

        <!-- Header -->
        <div class="drafter-header">
          <div class="drafter-title">
            <span style="font-size:18px">✏️</span>
            <div>
              <div style="font-size:15px;font-weight:800">Editor de Trazado Manual</div>
              <div style="font-size:10px;color:var(--tx3)">Define puntos y líneas para crear patrones desde cero</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <select id="drafter-examples" style="background:var(--inp);border:1px solid var(--brd);color:var(--tx2);border-radius:var(--r);padding:5px 8px;font-size:11px;cursor:pointer;outline:none">
              <option value="">Cargar ejemplo…</option>
              ${Object.keys(EXAMPLES).map(k => `<option value="${k}">${k}</option>`).join('')}
            </select>
            <button id="drafter-help-btn" class="c3-btn" style="padding:5px 10px;font-size:11px">? Ayuda</button>
            <button id="drafter-close" class="m-close">✕</button>
          </div>
        </div>

        <!-- Body -->
        <div class="drafter-body">

          <!-- Editor de código -->
          <div class="drafter-editor-col">
            <div class="drafter-col-title">
              Instrucciones de trazado
              <span style="font-size:10px;color:var(--tx3);font-weight:400">Coordenadas en milímetros</span>
            </div>
            <textarea id="drafter-editor" class="drafter-textarea" spellcheck="false"
              placeholder="# Escribe tus instrucciones aquí
PIEZA Mi pieza
PUNTO A 0,0
PUNTO B desde:A der:200
PUNTO C desde:B abajo:300
PUNTO D desde:A abajo:300
LINEA A B
LINEA B C
LINEA C D
LINEA D A
HILO A C"
            ></textarea>
            <div id="drafter-errors" class="drafter-errors" style="display:none"></div>
            <div class="drafter-actions">
              <button id="drafter-compile" class="btn-p" style="padding:9px 20px;font-size:12px">
                ▶ Generar patrón
              </button>
              <button id="drafter-add-svg" class="btn-s" style="padding:9px 16px;font-size:12px">
                ＋ Agregar al patrón actual
              </button>
              <button id="drafter-clear" class="btn-g" style="padding:9px 12px;font-size:12px">
                ✕ Limpiar
              </button>
            </div>
          </div>

          <!-- Preview y puntos -->
          <div class="drafter-right-col">
            <div class="drafter-col-title">Vista previa</div>
            <div class="drafter-preview-box">
              <svg id="drafter-svg" xmlns="http://www.w3.org/2000/svg"
                   width="100%" height="100%"
                   viewBox="0 0 400 400"
                   style="background:#0a0a12">
                <defs>
                  <pattern id="dp-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M50 0L0 0 0 50" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
                  </pattern>
                  <marker id="dp-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6"/>
                  </marker>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6"/>
                  </marker>
                  <marker id="arrow-rev" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                    <path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6"/>
                  </marker>
                </defs>
                <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#dp-grid)"/>
                <g id="drafter-preview-content"></g>
              </svg>
            </div>

            <!-- Tabla de puntos -->
            <div class="drafter-points-title">Puntos definidos</div>
            <div id="drafter-points-table" class="drafter-points-table">
              <div style="color:var(--tx3);font-size:11px;padding:8px">Los puntos aparecerán aquí al compilar</div>
            </div>

            <!-- Info -->
            <div id="drafter-info" class="drafter-info" style="display:none"></div>
          </div>

        </div>
      </div>

      <!-- Panel de ayuda (oculto por defecto) -->
      <div id="drafter-help-panel" class="drafter-help" style="display:none">
        <div class="drafter-help-header">
          <span style="font-weight:700">Referencia de comandos</span>
          <button id="drafter-help-close" class="m-close">✕</button>
        </div>
        <pre class="drafter-help-content">${HELP_TEXT}</pre>
      </div>
    `;

    // CSS inline para el editor
    const style = document.createElement('style');
    style.textContent = `
      .drafter-panel{
        position:relative;z-index:1;
        background:var(--panel);border:1px solid var(--brd2);
        border-radius:14px;
        width:min(1100px,96vw);max-height:92vh;
        display:flex;flex-direction:column;
        box-shadow:0 8px 40px rgba(0,0,0,.7);
        overflow:hidden;
      }
      .drafter-header{
        display:flex;align-items:center;justify-content:space-between;
        padding:16px 20px;border-bottom:1px solid var(--brd);
        background:linear-gradient(135deg,rgba(139,92,246,.06) 0%,transparent 100%);
        flex-shrink:0;gap:12px;
      }
      .drafter-title{display:flex;align-items:center;gap:12px}
      .drafter-body{
        display:grid;grid-template-columns:1fr 1fr;
        gap:0;flex:1;overflow:hidden;min-height:0;
      }
      .drafter-editor-col{
        display:flex;flex-direction:column;
        padding:16px;border-right:1px solid var(--brd);
        overflow:hidden;gap:10px;
      }
      .drafter-right-col{
        display:flex;flex-direction:column;
        padding:16px;gap:10px;overflow:hidden;
      }
      .drafter-col-title{
        font-size:10px;font-weight:700;letter-spacing:1px;
        text-transform:uppercase;color:var(--tx3);
        display:flex;align-items:center;justify-content:space-between;
        gap:8px;flex-shrink:0;
      }
      .drafter-textarea{
        flex:1;resize:none;
        background:var(--bg);
        border:1.5px solid var(--brd);
        color:var(--tx);border-radius:var(--r);
        padding:12px;font-size:12px;
        font-family:'Cascadia Code','Fira Code',monospace;
        line-height:1.7;outline:none;
        transition:border-color .16s;
        min-height:0;
      }
      .drafter-textarea:focus{border-color:var(--acc)}
      .drafter-errors{
        background:rgba(248,113,113,.08);
        border:1px solid rgba(248,113,113,.3);
        border-radius:var(--r);padding:10px 12px;
        font-size:11px;color:#f87171;
        font-family:monospace;line-height:1.6;
        max-height:80px;overflow-y:auto;flex-shrink:0;
      }
      .drafter-actions{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap}
      .drafter-preview-box{
        flex:1;border:1px solid var(--brd);border-radius:var(--r);
        overflow:hidden;min-height:0;background:#0a0a12;
        position:relative;
      }
      #drafter-svg{cursor:crosshair}
      .drafter-points-title{
        font-size:10px;font-weight:700;letter-spacing:1px;
        text-transform:uppercase;color:var(--tx3);
        flex-shrink:0;
      }
      .drafter-points-table{
        background:var(--inp);border:1px solid var(--brd);
        border-radius:var(--r);padding:8px;
        max-height:130px;overflow-y:auto;
        font-family:monospace;font-size:11px;
        flex-shrink:0;
      }
      .drafter-pt-row{
        display:grid;grid-template-columns:30px 1fr 1fr 1fr;
        gap:6px;align-items:center;
        padding:3px 4px;border-radius:4px;
        transition:background .12s;
      }
      .drafter-pt-row:hover{background:var(--hov)}
      .drafter-pt-name{color:var(--acc2);font-weight:700}
      .drafter-pt-coord{color:var(--tx2)}
      .drafter-pt-dist{color:var(--tx3);font-size:10px}
      .drafter-info{
        background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.2);
        border-radius:var(--r);padding:10px 12px;font-size:11px;
        color:var(--acc2);line-height:1.6;flex-shrink:0;
      }
      .drafter-help{
        position:fixed;right:20px;top:80px;z-index:600;
        background:var(--panel);border:1px solid var(--brd2);
        border-radius:var(--r2);width:360px;max-height:80vh;
        box-shadow:0 8px 32px rgba(0,0,0,.6);
        display:flex;flex-direction:column;overflow:hidden;
      }
      .drafter-help-header{
        display:flex;align-items:center;justify-content:space-between;
        padding:12px 16px;border-bottom:1px solid var(--brd);
        font-size:13px;flex-shrink:0;
      }
      .drafter-help-content{
        padding:16px;font-size:11px;color:var(--tx2);
        font-family:monospace;line-height:1.7;
        overflow-y:auto;white-space:pre-wrap;
      }
      @media(max-width:700px){
        .drafter-body{grid-template-columns:1fr}
        .drafter-right-col{display:none}
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(_modal);

    _editor  = document.getElementById('drafter-editor');
    _preview = document.getElementById('drafter-preview-content');

    // ── Eventos ────────────────────────────────────────────────
    document.getElementById('drafter-ov').addEventListener('click', close);
    document.getElementById('drafter-close').addEventListener('click', close);

    document.getElementById('drafter-compile').addEventListener('click', _compile);
    document.getElementById('drafter-clear').addEventListener('click', function() {
      _editor.value = '';
      _preview.innerHTML = '';
      _showErrors([]);
      _showPoints({});
    });

    document.getElementById('drafter-add-svg').addEventListener('click', _addToMainPattern);

    // Cargar ejemplos
    document.getElementById('drafter-examples').addEventListener('change', function() {
      const key = this.value;
      if (key && EXAMPLES[key]) {
        _editor.value = EXAMPLES[key];
        _compile();
      }
      this.value = '';
    });

    // Ayuda
    document.getElementById('drafter-help-btn').addEventListener('click', function() {
      const hp = document.getElementById('drafter-help-panel');
      hp.style.display = hp.style.display === 'none' ? 'flex' : 'none';
      hp.style.flexDirection = 'column';
    });
    document.getElementById('drafter-help-close').addEventListener('click', function() {
      document.getElementById('drafter-help-panel').style.display = 'none';
    });

    // Compilar en tiempo real (con debounce)
    let _draftTimer = null;
    _editor.addEventListener('input', function() {
      clearTimeout(_draftTimer);
      _draftTimer = setTimeout(_compile, 600);
    });

    // Cargar ejemplo por defecto
    _editor.value = EXAMPLES['Cuadrado básico'];
    _compile();
  }

  // ─── COMPILAR Y PREVISUALIZAR ─────────────────────────────────
  function _compile() {
    const text = _editor ? _editor.value : '';
    if (!text.trim()) return;

    const result = PAT.Drafter.compileAndRender(text);

    // Mostrar errores
    _showErrors(result.errors, result.warnings);

    if (result.piece) {
      // Limpiar preview
      while (_preview.firstChild) _preview.removeChild(_preview.firstChild);

      const g = result.piece.group.cloneNode(true);
      _preview.appendChild(g);

      // Ajustar viewBox del SVG preview
      const b = result.piece.bounds;
      const PAD = 20;
      const svg = document.getElementById('drafter-svg');
      if (svg) {
        svg.setAttribute('viewBox',
          (b.x - PAD) + ' ' + (b.y - PAD) + ' ' +
          (b.w + PAD * 2) + ' ' + (b.h + PAD * 2)
        );
      }

      // Mostrar tabla de puntos
      _showPoints(result.points);

      // Mostrar info
      _showInfo(result);
    }
  }

  // ─── AGREGAR AL PATRÓN PRINCIPAL ──────────────────────────────
  function _addToMainPattern() {
    const text = _editor ? _editor.value : '';
    if (!text.trim()) return;

    const result = PAT.Drafter.compileAndRender(text);
    if (!result.piece) {
      PAT.App.toast('No hay pieza válida para agregar', 'error');
      return;
    }

    // Agregar la pieza al contenido del SVG principal
    const content = document.getElementById('pattern-content');
    if (!content) { PAT.App.toast('SVG principal no encontrado', 'error'); return; }

    // Calcular offset (poner al lado de las piezas existentes)
    const existing = content.getBBox ? content.getBBox() : null;
    const offsetX  = existing && existing.width > 0 ? existing.x + existing.width + 30 : 20;
    const offsetY  = 20;

    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wrapper.setAttribute('transform', 'translate(' + offsetX + ',' + offsetY + ')');
    wrapper.setAttribute('class', 'drafter-piece-manual');
    wrapper.appendChild(result.piece.group.cloneNode(true));
    content.appendChild(wrapper);

    // Actualizar viewBox del SVG principal
    const mainSVG = document.getElementById('pattern-svg');
    if (mainSVG) {
      const vb    = (mainSVG.getAttribute('viewBox') || '0 0 500 400').split(' ').map(Number);
      const newW  = Math.max(vb[2], offsetX + result.piece.bounds.w + 40);
      const newH  = Math.max(vb[3], result.piece.bounds.h + 60);
      mainSVG.setAttribute('viewBox', '0 0 ' + newW + ' ' + newH);
    }

    PAT.App.toast('✅ Pieza "' + result.piece.name + '" agregada al patrón', 'success');
    close();

    // Ajustar zoom para ver todo
    if (PAT.App.fitScreen) setTimeout(PAT.App.fitScreen, 100);
  }

  // ─── MOSTRAR ERRORES ──────────────────────────────────────────
  function _showErrors(errors, warnings) {
    const box = document.getElementById('drafter-errors');
    if (!box) return;

    const msgs = [];
    (errors   || []).forEach(e => msgs.push('❌ ' + e));
    (warnings || []).forEach(w => msgs.push('⚠️ ' + w));

    if (msgs.length > 0) {
      box.innerHTML = msgs.join('\n');
      box.style.display = 'block';
    } else {
      box.style.display = 'none';
    }
  }

  // ─── MOSTRAR TABLA DE PUNTOS ──────────────────────────────────
  function _showPoints(points) {
    const table = document.getElementById('drafter-points-table');
    if (!table) return;

    const names = Object.keys(points);
    if (names.length === 0) {
      table.innerHTML = '<div style="color:var(--tx3);font-size:11px;padding:8px">Sin puntos definidos</div>';
      return;
    }

    let html = '<div class="drafter-pt-row" style="border-bottom:1px solid var(--brd);margin-bottom:4px;padding-bottom:4px;font-size:10px;color:var(--tx3)">';
    html += '<span>Punto</span><span>X (mm)</span><span>Y (mm)</span><span>Dist. al origen</span>';
    html += '</div>';

    names.forEach(function(name) {
      const p    = points[name];
      const dist = Math.round(Math.hypot(p.x, p.y));
      html += '<div class="drafter-pt-row">';
      html += '<span class="drafter-pt-name">' + name + '</span>';
      html += '<span class="drafter-pt-coord">' + Math.round(p.x) + '</span>';
      html += '<span class="drafter-pt-coord">' + Math.round(p.y) + '</span>';
      html += '<span class="drafter-pt-dist">' + dist + 'mm</span>';
      html += '</div>';
    });

    table.innerHTML = html;
  }

  // ─── MOSTRAR INFO ─────────────────────────────────────────────
  function _showInfo(result) {
    const box = document.getElementById('drafter-info');
    if (!box || !result.piece) return;

    const pts = Object.keys(result.points).length;
    const b   = result.piece.bounds;
    const wcm = Math.round(b.w / 10);
    const hcm = Math.round(b.h / 10);

    box.innerHTML = `✅ <strong>${result.piece.name}</strong> — ${pts} puntos · Tamaño aprox: ${wcm}×${hcm} cm`;
    box.style.display = 'block';
  }

  return { open, close };
})();
