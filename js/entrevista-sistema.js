'use strict';
/**
 * entrevista-sistema.js
 * =====================
 * Asistente conversacional que aprende el método de patronaje de cada atelier.
 *
 * Flujo:
 *  1. Pregunta el nombre del sistema
 *  2. Pregunta qué piezas tiene (ej: "Delantera, Espalda, Manga")
 *  3. Para cada pieza:
 *     a. Define los puntos uno a uno (nombre + fórmulas X e Y)
 *     b. Define las líneas que los conectan
 *  4. Muestra preview en vivo mientras construye
 *  5. Guarda en Firestore vía PAT.MisSistemas
 *
 * Fórmulas: acepta lenguaje natural (español) y notación directa
 *   "pecho entre cuatro más 2cm"  →  T/4+20
 *   "cuello/6 - 10"               →  NK/6-10
 *   "espalda dividido entre 2"    →  ESP/2
 */
window.PAT = window.PAT || {};

PAT.EntrevistaSistema = (function () {

  // ── Estado ────────────────────────────────────────────────────────
  const S = {
    INICIO          : 'inicio',
    PIEZAS_LISTA    : 'piezas_lista',
    PIEZA_INICIO    : 'pieza_inicio',
    PUNTO_SIGUIENTE : 'punto_siguiente',
    PUNTO_X         : 'punto_x',
    PUNTO_Y         : 'punto_y',
    PUNTO_NOTA      : 'punto_nota',
    LINEA_DE        : 'linea_de',
    LINEA_A         : 'linea_a',
    LINEA_TIPO      : 'linea_tipo',
    LINEA_SIGUIENTE : 'linea_siguiente',
    PIEZA_SIGUIENTE : 'pieza_siguiente',
    GUARDANDO       : 'guardando',
    LISTO           : 'listo',
  };

  let _state      = S.INICIO;
  let _sistema    = { nombre:'', piezas:[] };
  let _piezasQ    = [];          // nombres de piezas pendientes
  let _piezaAct   = null;        // pieza en construcción { nombre, puntos, lineas }
  let _puntoAct   = null;        // punto en construcción { nombre }
  let _lineaAct   = null;        // linea en construcción { de, a, tipo }
  let _modal      = null;

  // Medidas de referencia para el preview SVG (talla 38)
  const MEDS_REF = { bust:88, neck:36, shoulder:38, totalLength:65, waist:68, hip:94, hipDepth:18 };

  // ── Abrir / cerrar ────────────────────────────────────────────────
  function open() {
    // Verificar autenticación ANTES de iniciar — el sistema se guarda en la cuenta del usuario.
    // Si no hay sesión, todo el trabajo de la entrevista se perdería al intentar guardar.
    try {
      const user = window.firebase?.auth?.()?.currentUser;
      if (!user) {
        alert('⚠ Debes iniciar sesión para usar el Asistente de Sistemas.\n\nTu trabajo se guardará en tu cuenta.');
        return;
      }
    } catch (e) { /* firebase no disponible — continuar de todas formas */ }

    if (!_modal) _build();
    _resetEstado();
    _modal.classList.add('open');
    // Primer mensaje
    setTimeout(() => _system(_MSG_BIENVENIDA), 100);
  }

  function close() {
    if (_modal) _modal.classList.remove('open');
  }

  // ── Mensajes iniciales ─────────────────────────────────────────────
  const _MSG_BIENVENIDA = `¡Hola! Soy tu asistente de patronaje. 🧵<br><br>
Voy a aprender <em>tu</em> método de construcción para que quede guardado en el sistema y puedas usarlo con cualquier medida, como el Sistema NH pero con tu propia técnica.<br><br>
<strong>¿Cómo se llama tu sistema de patronaje?</strong><br>
<span style="color:#6a5a8a;font-size:10px">Ej: "Sistema Atelier Rosa", "Método Jiménez", "Mi técnica propia"</span>`;

  // ── Construcción del modal ─────────────────────────────────────────
  function _build() {
    _modal = document.createElement('div');
    _modal.id = 'ent-modal';
    _modal.innerHTML = `
<style>
#ent-modal{position:fixed;inset:0;z-index:970;display:none;align-items:center;justify-content:center}
#ent-modal.open{display:flex}
#ent-ov{position:absolute;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(8px)}
#ent-box{position:relative;z-index:1;background:#0a0a18;border:1px solid #3d3d58;border-radius:18px;
  width:min(860px,96vw);height:min(640px,94vh);display:flex;flex-direction:column;
  box-shadow:0 32px 100px rgba(0,0,0,.95);overflow:hidden}
.ent-hdr{display:flex;align-items:center;padding:13px 18px;border-bottom:1px solid #1e1e30;flex-shrink:0;gap:10px}
.ent-hdr-title{flex:1;font-size:13px;font-weight:800;color:#ede9fe}
.ent-hdr-sub{font-size:10px;color:#5a5678}
#ent-close{background:none;border:none;color:#5a5678;font-size:18px;cursor:pointer;padding:4px 8px}
#ent-close:hover{color:#ede9fe}

/* Layout split */
.ent-split{display:flex;flex:1;overflow:hidden;min-height:0}

/* Panel chat */
.ent-chat{flex:1;display:flex;flex-direction:column;min-width:0;border-right:1px solid #1a1a2e}
#ent-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
#ent-msgs::-webkit-scrollbar{width:3px}
#ent-msgs::-webkit-scrollbar-thumb{background:#2e2e45}

.ent-bubble{max-width:85%;border-radius:14px;padding:10px 14px;font-size:12px;line-height:1.65}
.ent-bubble.sys{background:#1a1730;color:#c4b8e8;border-bottom-left-radius:4px;align-self:flex-start}
.ent-bubble.user{background:#2d1f5e;color:#ede9fe;border-bottom-right-radius:4px;align-self:flex-end;text-align:right}
.ent-bubble.info{background:#0f1a0f;color:#4a8a4a;border:1px solid #1e3a1e;font-size:10.5px}
.ent-bubble.warn{background:#1a1200;color:#c49830;border:1px solid #3a2e00;font-size:10.5px}
.ent-bubble strong{color:#a78bfa}
.ent-bubble em{color:#8bbfa8}
.ent-bubble code{background:#0b0b1a;padding:1px 4px;border-radius:4px;font-family:monospace;font-size:11px;color:#7dd3fc}

/* Sugerencias rápidas */
#ent-suggs{display:flex;flex-wrap:wrap;gap:5px;padding:6px 14px;flex-shrink:0}
.ent-sugg{padding:4px 10px;border-radius:20px;border:1px solid #3d3d58;background:none;
  color:#8b7faa;font-size:10px;cursor:pointer;transition:.12s}
.ent-sugg:hover{border-color:#8b5cf6;color:#ede9fe;background:#1a1730}

/* Input */
.ent-input-area{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #1a1a2e;flex-shrink:0}
#ent-input{flex:1;background:#141420;border:1px solid #2e2e45;border-radius:10px;color:#ede9fe;
  font-size:12px;padding:9px 13px;outline:none;font-family:inherit}
#ent-input:focus{border-color:#8b5cf6}
#ent-input::placeholder{color:#3d3d58}
#ent-send{padding:9px 16px;border-radius:10px;border:none;background:#8b5cf6;color:#fff;
  font-size:13px;cursor:pointer;font-weight:700}
#ent-send:hover{background:#7c3aed}

/* Panel preview */
.ent-preview{width:260px;flex-shrink:0;display:flex;flex-direction:column;background:#080812}
.ent-prev-title{padding:8px 12px;font-size:9px;font-weight:700;color:#5a5678;
  text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #1a1a2e;flex-shrink:0}
#ent-svg{width:260px;height:300px;display:block;flex-shrink:0}
.ent-json-panel{flex:1;overflow-y:auto;padding:10px 12px;font-size:9px;color:#4a4a70;font-family:monospace;line-height:1.8}
.ent-json-panel strong{color:#6a5a9a}
.ent-badge{display:inline-block;padding:2px 6px;border-radius:10px;background:#1a1730;
  color:#a78bfa;font-size:9px;margin:1px;font-weight:600}

/* Step indicator */
.ent-step{font-size:10px;color:#5a5678;padding:4px 14px;border-top:1px solid #0e0e18;flex-shrink:0}
</style>

<div id="ent-ov"></div>
<div id="ent-box">
  <div class="ent-hdr">
    <div>
      <div class="ent-hdr-title">🤖 Aprender mi Método</div>
      <div class="ent-hdr-sub" id="ent-step-label">Inicio</div>
    </div>
    <button id="ent-close">✕</button>
  </div>
  <div class="ent-split">
    <div class="ent-chat">
      <div id="ent-msgs"></div>
      <div id="ent-suggs"></div>
      <div class="ent-input-area">
        <input id="ent-input" placeholder="Escribe tu respuesta…" autocomplete="off">
        <button id="ent-send">→</button>
      </div>
    </div>
    <div class="ent-preview">
      <div class="ent-prev-title">Vista previa en construcción</div>
      <svg id="ent-svg" width="260" height="300"></svg>
      <div class="ent-json-panel" id="ent-json"></div>
    </div>
  </div>
</div>`;
    document.body.appendChild(_modal);
    document.getElementById('ent-ov').onclick    = close;
    document.getElementById('ent-close').onclick  = close;
    document.getElementById('ent-send').onclick   = _onSend;
    document.getElementById('ent-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _onSend(); }
    });
  }

  // ── Reset ──────────────────────────────────────────────────────────
  function _resetEstado() {
    _state    = S.INICIO;
    _sistema  = { nombre:'', piezas:[] };
    _piezasQ  = [];
    _piezaAct = null;
    _puntoAct = null;
    _lineaAct = null;
    const el = document.getElementById('ent-msgs');
    if (el) el.innerHTML = '';
    _setSuggs([]);
    _updateSidePanel();
    _setStep('Inicio');
  }

  // ── Mensajes de burbuja ────────────────────────────────────────────
  function _system(html) {
    _addBubble(html, 'sys');
    _scrollBottom();
  }
  function _user(text) {
    _addBubble(_esc(text), 'user');
    _scrollBottom();
  }
  function _info(html) {
    _addBubble(html, 'info');
  }
  function _addBubble(html, type) {
    const el = document.getElementById('ent-msgs');
    if (!el) return;
    const b = document.createElement('div');
    b.className = 'ent-bubble ' + type;
    b.innerHTML = html;
    el.appendChild(b);
  }
  function _scrollBottom() {
    const el = document.getElementById('ent-msgs');
    if (el) setTimeout(() => el.scrollTop = el.scrollHeight, 50);
  }
  function _setStep(txt) {
    const el = document.getElementById('ent-step-label');
    if (el) el.textContent = txt;
  }
  function _setSuggs(items) {
    const el = document.getElementById('ent-suggs');
    if (!el) return;
    el.innerHTML = items.map(s =>
      `<button class="ent-sugg" onclick="PAT.EntrevistaSistema._sugg(${JSON.stringify(s)})">${s}</button>`
    ).join('');
  }

  // ── Respuesta del usuario ──────────────────────────────────────────
  function _onSend() {
    const inp = document.getElementById('ent-input');
    if (!inp) return;
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = '';
    _setSuggs([]);
    _user(txt);
    setTimeout(() => _procesar(txt), 250);
  }

  // Llamado desde botones de sugerencia
  function _sugg(txt) {
    document.getElementById('ent-input').value = txt;
    _onSend();
  }

  // ── Máquina de estados ─────────────────────────────────────────────
  function _procesar(txt) {
    switch (_state) {
      case S.INICIO:          return _s_inicio(txt);
      case S.PIEZAS_LISTA:    return _s_piezasLista(txt);
      case S.PIEZA_INICIO:    return _s_piezaInicio(txt);
      case S.PUNTO_SIGUIENTE: return _s_puntoSiguiente(txt);
      case S.PUNTO_X:         return _s_puntoX(txt);
      case S.PUNTO_Y:         return _s_puntoY(txt);
      case S.PUNTO_NOTA:      return _s_puntoNota(txt);
      case S.LINEA_DE:        return _s_lineaDe(txt);
      case S.LINEA_A:         return _s_lineaA(txt);
      case S.LINEA_TIPO:      return _s_lineaTipo(txt);
      case S.LINEA_SIGUIENTE: return _s_lineaSiguiente(txt);
      case S.PIEZA_SIGUIENTE: return _s_piezaSiguiente(txt);
    }
  }

  // 1 ── Nombre del sistema
  function _s_inicio(txt) {
    _sistema.nombre = txt;
    _setStep('Piezas');
    _state = S.PIEZAS_LISTA;
    _system(`Excelente — <strong>"${_esc(txt)}"</strong>. 👏<br><br>
Ahora dime: <strong>¿qué piezas tiene este sistema?</strong><br>
Puedes escribirlas separadas por coma.<br>
<span style="color:#6a5a8a;font-size:10px">Ej: "Delantera, Espalda" &nbsp;·&nbsp; "Blusa delantera, Espalda, Manga corta, Manga larga"</span>`);
    _setSuggs(['Delantera, Espalda', 'Delantera, Espalda, Manga']);
  }

  // 2 ── Lista de piezas
  function _s_piezasLista(txt) {
    _piezasQ = txt.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    if (!_piezasQ.length) {
      _system('No entendí las piezas. Escríbelas separadas por coma, ej: <code>Delantera, Espalda</code>');
      return;
    }
    _info(`Piezas a definir: ${_piezasQ.map(p => `<span class="ent-badge">${_esc(p)}</span>`).join(' ')}`);
    _siguientePieza();
  }

  // 3 ── Iniciar pieza
  function _s_piezaInicio(txt) {
    // En este estado el usuario confirmó empezar con la pieza — no se usa txt
    _iniciarPuntos();
  }

  function _siguientePieza() {
    if (!_piezasQ.length) {
      _finalizarSistema();
      return;
    }
    const nombre = _piezasQ.shift();
    _piezaAct = { id: _slug(nombre), nombre, categoria:'otro', tipo:'dama', notas:'', puntos:[], lineas:[] };
    _setStep(`Pieza: ${nombre}`);
    _state = S.PIEZA_INICIO;
    _system(`Empecemos con <strong>"${_esc(nombre)}"</strong>.<br><br>
Vamos a definir los puntos de esta pieza uno a uno.<br>
<strong>¿Cuál es el primer punto?</strong> Describe su nombre y posición.<br>
<span style="color:#6a5a8a;font-size:10px">Ej: "A es el origen, arriba a la izquierda" · "Punto 1, en cero cero"</span>`);
    _state = S.PUNTO_SIGUIENTE;
    _setSuggs(['A es el origen (0,0)', 'Listo — pasar a las líneas']);
  }

  // 4 ── Siguiente punto
  function _s_puntoSiguiente(txt) {
    const low = txt.toLowerCase();
    if (_esListo(low)) {
      // Terminar puntos, pasar a líneas
      _iniciarLineas();
      return;
    }
    // Extraer nombre del punto
    const nombre = _extraerNombrePunto(txt);
    if (!nombre) {
      _system('¿Cuál es el nombre de este punto? (ej: A, B, 1, 8, NW…)');
      return;
    }
    _puntoAct = { nombre, name: nombre, fx:'', fy:'', nota:'' };

    // Si dijo "en el origen" o "(0,0)" lo capturamos directo
    const origen = /\borigen\b|0\s*,\s*0|\bcero\s*,\s*cero\b/i.test(txt);
    if (origen) {
      _puntoAct.fx = '0'; _puntoAct.fy = '0';
      _system(`<strong>${nombre}</strong> = (0, 0) &nbsp;✓<br><br>
¿Cuál es el siguiente punto? (escribe <code>listo</code> cuando hayas definido todos)`);
      _piezaAct.puntos.push({ ..._puntoAct });
      _updateSidePanel();
      _setSuggs(['Listo — pasar a las líneas']);
      return;
    }

    // Preguntar X
    _state = S.PUNTO_X;
    _system(`Punto <strong>${nombre}</strong> — ¿cuánto mide en <em>X</em> (horizontal)?<br>
Puedes usar fórmulas con medidas del cuerpo.<br>
<span style="color:#6a5a8a;font-size:10px">Ej: <code>T/4+20</code> · <code>NK/6</code> · <code>pecho entre cuatro más 2cm</code> · <code>0</code></span>`);
    _setSuggs(['0', 'T/4+20', 'NK/6', 'ESP/2']);
  }

  // 5 ── X del punto
  function _s_puntoX(txt) {
    const formula = _parsearFormula(txt);
    if (!formula) {
      _system('No pude interpretar esa fórmula. Intenta con <code>T/4+20</code> o <code>0</code>');
      return;
    }
    _puntoAct.fx = formula;
    _state = S.PUNTO_Y;
    _system(`X = <code>${formula}</code> ✓<br><br>
¿Y en <em>Y</em> (vertical)? Recuerda que Y positivo va hacia abajo.<br>
<span style="color:#6a5a8a;font-size:10px">Ej: <code>0</code> (misma línea horizontal) · <code>NK/6-10</code> · <code>T/4+10</code></span>`);
    _setSuggs(['0', 'NK/6-10', 'T/4+10', 'ESP/2+10']);
  }

  // 6 ── Y del punto
  function _s_puntoY(txt) {
    let formula = _parsearFormula(txt);
    // "misma altura" o "igual que X" → 0
    if (!formula && /misma\s+altura|igual|mismo\s+nivel/i.test(txt)) formula = '0';
    if (!formula) {
      _system('No pude interpretar esa fórmula. Prueba con <code>0</code> o <code>NK/6</code>');
      return;
    }
    _puntoAct.fy = formula;
    _state = S.PUNTO_NOTA;
    _system(`Y = <code>${formula}</code> ✓<br><br>
(Opcional) ¿Qué explica este punto? ¿Qué medida representa?<br>
<span style="color:#6a5a8a;font-size:10px">Ej: "Profundidad del escote: sexta parte del cuello menos 1cm"<br>Escribe <code>saltar</code> para dejar sin nota.</span>`);
    _setSuggs(['saltar']);
  }

  // 7 ── Nota del punto
  function _s_puntoNota(txt) {
    if (!/saltar|skip|no|nada/i.test(txt)) {
      _puntoAct.nota = txt;
    }
    _piezaAct.puntos.push({ ..._puntoAct });
    _info(`✓ <strong>${_puntoAct.nombre}</strong> = (<code>${_puntoAct.fx}</code>, <code>${_puntoAct.fy}</code>)${_puntoAct.nota ? ' — ' + _esc(_puntoAct.nota) : ''}`);
    _updateSidePanel();
    _state = S.PUNTO_SIGUIENTE;
    _system(`Perfecto. <strong>¿Cuál es el siguiente punto?</strong><br>
Escribe <code>listo</code> cuando hayas definido todos los puntos de <em>${_esc(_piezaAct.nombre)}</em>.`);
    _setSuggs(['Listo — pasar a las líneas']);
  }

  // ── Líneas ─────────────────────────────────────────────────────────
  function _iniciarLineas() {
    if (!_piezaAct.puntos.length) {
      _system('Primero define al menos un punto. ¿Cuál es el primer punto?');
      _state = S.PUNTO_SIGUIENTE;
      return;
    }
    const nombres = _piezaAct.puntos.map(p => `<code>${p.nombre}</code>`).join(' ');
    _state = S.LINEA_DE;
    _system(`Puntos definidos: ${nombres}<br><br>
Ahora las <strong>líneas</strong> que los conectan.<br>
¿De qué punto sale la primera línea?`);
    const ns = _piezaAct.puntos.map(p => p.nombre);
    _setSuggs([...ns.slice(0,4), 'Listo — guardar pieza']);
  }

  function _iniciarPuntos() { /* solo transición de estado, mensaje ya enviado */ }

  // 8 ── De (from)
  function _s_lineaDe(txt) {
    if (_esListo(txt)) { _terminarPieza(); return; }
    const nombre = _extraerNombrePunto(txt) || txt.trim();
    _lineaAct = { de: nombre, a:'', tipo:'line' };
    _state = S.LINEA_A;
    const ns = _piezaAct.puntos.map(p => p.nombre).filter(n => n !== nombre);
    _system(`Línea desde <strong>${_esc(nombre)}</strong> → ¿hasta qué punto?`);
    _setSuggs(ns.slice(0,4));
  }

  // 9 ── A (to)
  function _s_lineaA(txt) {
    _lineaAct.a = _extraerNombrePunto(txt) || txt.trim();
    _state = S.LINEA_TIPO;
    _system(`<strong>${_esc(_lineaAct.de)} → ${_esc(_lineaAct.a)}</strong><br>
¿Qué tipo de línea?<br>
<span style="color:#6a5a8a;font-size:10px">
<strong>line</strong> = recta · <strong>curve</strong> = curva suave · <strong>fold</strong> = doblez/CF ·<br>
<strong>dart</strong> = pinza · <strong>construction</strong> = referencia punteada gris
</span>`);
    _setSuggs(['line', 'curve', 'fold', 'construction', 'dart']);
  }

  // 10 ── Tipo
  function _s_lineaTipo(txt) {
    const TIPOS = ['line','curve','fold','dart','construction'];
    // Detectar por palabra clave
    let tipo = 'line';
    const low = txt.toLowerCase();
    if (/curva?|curve|curv/i.test(low))              tipo = 'curve';
    else if (/dobl|fold|centro|cf\b/i.test(low))     tipo = 'fold';
    else if (/pinza?|dart/i.test(low))               tipo = 'dart';
    else if (/construc|puntead|referen|grey|gris/i.test(low)) tipo = 'construction';
    else if (TIPOS.includes(low.trim()))             tipo = low.trim();

    _lineaAct.tipo = tipo;
    _piezaAct.lineas.push({ ..._lineaAct });
    _info(`✓ <strong>${_lineaAct.de} → ${_lineaAct.a}</strong> · <em>${tipo}</em>`);
    _updateSidePanel();
    _state = S.LINEA_SIGUIENTE;
    _system(`Línea guardada. ¿Hay otra línea? Si terminaste escribe <code>listo</code>.`);
    const ns = _piezaAct.puntos.map(p => p.nombre);
    _setSuggs(['Listo — guardar pieza', ...ns.slice(0,3)]);
  }

  // 11 ── ¿Más líneas?
  function _s_lineaSiguiente(txt) {
    if (_esListo(txt)) { _terminarPieza(); return; }
    // Reinterpretar como nuevo "de"
    _state = S.LINEA_DE;
    _s_lineaDe(txt);
  }

  // ── Terminar pieza ─────────────────────────────────────────────────
  function _terminarPieza() {
    _sistema.piezas.push({ ..._piezaAct });
    _info(`✅ Pieza <strong>"${_esc(_piezaAct.nombre)}"</strong> guardada — ${_piezaAct.puntos.length} pts · ${_piezaAct.lineas.length} líneas`);
    _updateSidePanel();

    if (_piezasQ.length) {
      _state = S.PIEZA_SIGUIENTE;
      _system(`Queda${_piezasQ.length > 1 ? 'n' : ''} <strong>${_piezasQ.length}</strong> pieza(s): ${_piezasQ.map(p=>`<span class="ent-badge">${_esc(p)}</span>`).join(' ')}<br><br>
¿Continuamos con la siguiente pieza?`);
      _setSuggs(['Sí, siguiente pieza', 'No, guardar el sistema ahora']);
    } else {
      _finalizarSistema();
    }
  }

  // 12 ── ¿Más piezas?
  function _s_piezaSiguiente(txt) {
    if (/no|guardar|terminar|listo|fin/i.test(txt)) {
      _finalizarSistema();
    } else {
      _siguientePieza();
    }
  }

  // ── Finalizar y guardar ────────────────────────────────────────────
  async function _finalizarSistema() {
    _state = S.GUARDANDO;
    _setStep('Guardando…');
    _system(`🎉 ¡Sistema completo!<br><br>
<strong>"${_esc(_sistema.nombre)}"</strong> — ${_sistema.piezas.length} pieza(s)<br><br>
Guardando en tu cuenta…`);

    try {
      // Guardar en Firestore / localStorage
      const id = await PAT.MisSistemas.guardar({
        nombre:  _sistema.nombre,
        autor:   '',
        version: '1.0',
        descripcion: 'Creado con el Asistente de Patronaje',
        piezas:  _sistema.piezas,
      });
      PAT.MisSistemas.registrarEnMemoria({ id, ..._sistema });
      PAT.WizardCustom && PAT.WizardCustom.recargar();
      _state = S.LISTO;
      _setStep('Listo ✓');
      _system(`✅ <strong>¡Listo!</strong> Tu sistema <em>"${_esc(_sistema.nombre)}"</em> ya está guardado.<br><br>
Aparecerá en el <strong>Wizard de piezas</strong> junto al Sistema NH.<br>
También puedes abrirlo en <em>📐 Mis Sistemas</em> para editarlo o agregar más piezas.<br><br>
<button onclick="PAT.MisSistemasUI && PAT.MisSistemasUI.open(); PAT.EntrevistaSistema.close()"
  style="padding:6px 14px;border-radius:8px;border:none;background:#8b5cf6;color:#fff;cursor:pointer;font-size:11px;font-weight:700">
  Abrir en editor →
</button>`);
    } catch(e) {
      _system(`⚠ Error guardando: ${e.message}<br>Puedes intentarlo de nuevo o abrirlo en el editor.`);
    }
    _updateSidePanel();
  }

  // ── Panel lateral (JSON + preview) ────────────────────────────────
  function _updateSidePanel() {
    _renderJsonPanel();
    _renderPreviewSVG();
  }

  function _renderJsonPanel() {
    const el = document.getElementById('ent-json');
    if (!el) return;
    let html = `<strong>${_esc(_sistema.nombre||'…')}</strong><br>`;
    (_sistema.piezas || []).forEach(pieza => {
      html += `<br><strong style="color:#a78bfa">${_esc(pieza.nombre)}</strong><br>`;
      (pieza.puntos || []).forEach(pt => {
        html += `&nbsp;• ${_esc(pt.nombre)} = (<code>${_esc(pt.fx)}</code>, <code>${_esc(pt.fy)}</code>)<br>`;
      });
      (pieza.lineas || []).forEach(ln => {
        html += `&nbsp;→ ${_esc(ln.de)}→${_esc(ln.a)} [${ln.tipo}]<br>`;
      });
    });
    // Añadir pieza en construcción
    if (_piezaAct) {
      html += `<br><strong style="color:#f59e0b">${_esc(_piezaAct.nombre)} ✏</strong><br>`;
      (_piezaAct.puntos || []).forEach(pt => {
        html += `&nbsp;• ${_esc(pt.nombre)} = (<code>${_esc(pt.fx)}</code>, <code>${_esc(pt.fy)}</code>)<br>`;
      });
      (_piezaAct.lineas || []).forEach(ln => {
        html += `&nbsp;→ ${_esc(ln.de)}→${_esc(ln.a)} [${ln.tipo}]<br>`;
      });
    }
    el.innerHTML = html;
  }

  function _renderPreviewSVG() {
    const svg = document.getElementById('ent-svg');
    if (!svg) return;

    // Recopilar TODAS las piezas (guardadas + en construcción)
    const todasPiezas = [
      ..._sistema.piezas,
      ...(_piezaAct ? [_piezaAct] : []),
    ];

    // Solo preview de la pieza actual (o la última guardada)
    const pieza = _piezaAct || _sistema.piezas[_sistema.piezas.length-1];
    if (!pieza) { svg.innerHTML = ''; return; }

    const vars = PAT.MisSistemas._buildVarsDesde(MEDS_REF);
    const pts  = {};
    (pieza.puntos || []).forEach(pt => {
      const x = PAT.MisSistemas._evalExpr(pt.fx || '0', vars);
      const y = PAT.MisSistemas._evalExpr(pt.fy || '0', vars);
      if (x != null && !isNaN(x) && y != null && !isNaN(y))
        pts[pt.nombre || pt.name] = { x, y };
    });

    const pVals = Object.values(pts);
    if (!pVals.length) { svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#3d3d58" font-size="11">Define puntos para ver el preview</text>'; return; }

    const xs = pVals.map(p=>p.x), ys = pVals.map(p=>p.y);
    const minX=Math.min(...xs), maxX=Math.max(...xs);
    const minY=Math.min(...ys), maxY=Math.max(...ys);
    const W=(maxX-minX)||10, H=(maxY-minY)||10;
    const SW=260, SH=300, P=20;
    const sc=Math.min((SW-P*2)/W,(SH-P*2)/H);
    const ox=P-minX*sc+((SW-P*2)-W*sc)/2;
    const oy=P-minY*sc+((SH-P*2)-H*sc)/2;
    const tx=x=>x*sc+ox, ty=y=>y*sc+oy;

    const LINE_COLOR={line:'#7c3aed',curve:'#6d28d9',fold:'#a78bfa',dart:'#f59e0b',construction:'#3d3d5a'};
    let html='';

    (pieza.lineas||[]).forEach(ln=>{
      const a=pts[ln.de], b=pts[ln.a]; if(!a||!b)return;
      const c=LINE_COLOR[ln.tipo]||'#7c3aed';
      const dash=ln.tipo==='construction'?'stroke-dasharray="5 3"':'';
      html+=`<line x1="${tx(a.x).toFixed(1)}" y1="${ty(a.y).toFixed(1)}"
               x2="${tx(b.x).toFixed(1)}" y2="${ty(b.y).toFixed(1)}"
               stroke="${c}" stroke-width="${ln.tipo==='construction'?0.8:1.4}" ${dash}/>`;
    });
    Object.entries(pts).forEach(([n,p])=>{
      html+=`<circle cx="${tx(p.x).toFixed(1)}" cy="${ty(p.y).toFixed(1)}" r="2.5" fill="#a78bfa"/>`;
      html+=`<text x="${(tx(p.x)+3.5).toFixed(1)}" y="${(ty(p.y)-3.5).toFixed(1)}"
               font-size="7.5" fill="#8b7faa" font-family="monospace">${_esc(n)}</text>`;
    });
    svg.innerHTML = html;
  }

  // ── Parsear fórmulas (NL → expresión matemática) ─────────────────
  function _parsearFormula(txt) {
    let s = txt.trim();
    if (!s) return null;

    // Ya es una expresión directa válida (solo contiene chars matemáticos + variables NH)
    if (/^[\d\s+\-*/().,TNKESPLCINCADACAsBs]+$/.test(s.replace(/\s/g,''))) {
      // Convertir cm → mm
      s = s.replace(/(\d+(?:\.\d+)?)\s*cm\b/gi, (_,n) => String(parseFloat(n)*10));
      return s.trim() || null;
    }

    // Lenguaje natural → fórmula
    const REGLAS = [
      // Medidas corporales
      [/\bpecho\b|\btórax?\b|\bbusto\b/gi, 'T'],
      [/\bcuello\b/gi,                       'NK'],
      [/\bespalda\b|\bhombro\b/gi,           'ESP'],
      [/\blargo\s+total\b|\btalle\b|\blargo\b/gi,'LC'],
      [/\bcintura\b/gi,                      'CIN'],
      [/\bcadera\b/gi,                       'CAD'],
      // Fracciones en palabras
      [/(?:la\s+)?sexta\s+parte\s+(?:de[l]?\s+(?:la\s+)?)?/gi,   '(1/6)*'],
      [/(?:la\s+)?cuarta\s+parte\s+(?:de[l]?\s+(?:la\s+)?)?/gi,  '(1/4)*'],
      [/(?:la\s+)?tercera\s+parte\s+(?:de[l]?\s+(?:la\s+)?)?/gi, '(1/3)*'],
      [/(?:la\s+)?mitad\s+(?:de[l]?\s+(?:la\s+)?)?/gi,           '(1/2)*'],
      // Operadores en palabras
      [/\bdividid[ao]\s+entre\s+|\bentre\s+/gi, '/'],
      [/\bmás\s+|\bmas\s+/gi,                   '+'],
      [/\bmenos\s+/gi,                           '-'],
      [/\bpor\s+/gi,                             '*'],
      // Conversión de unidades
      [/(\d+(?:\.\d+)?)\s*cm\b/gi, (_,n)=>String(parseFloat(n)*10)],
      [/(\d+(?:\.\d+)?)\s*mm\b/gi, '$1'],
      // Palabras especiales
      [/\borigen\b|\bcero\b|\bzero\b/gi, '0'],
    ];

    let expr = s;
    REGLAS.forEach(([from, to]) => {
      if (typeof to === 'function') expr = expr.replace(from, to);
      else expr = expr.replace(from, to);
    });

    // ── Whitelist estricto ────────────────────────────────────────
    // Las únicas variables permitidas en las fórmulas son las NH definidas.
    // Primero extraemos tokens válidos, luego validamos el resultado.
    const VARS_NH = ['NK','ESP','LC','CIN','CAD','ACA','T','s',
                     'B4','B6','B8','B10','W4','H4','E2'];

    // Eliminar todo lo que no sea: dígito, operador, paréntesis, punto, o una de las vars NH
    // Construimos el patrón de vars como alternación de palabras completas
    const varPattern = VARS_NH.join('|');
    // Sustituir tokens permitidos temporalmente, eliminar el resto, restaurar
    const tokens = [];
    expr = expr.replace(new RegExp(`\\b(${varPattern})\\b`, 'g'), (m) => {
      tokens.push(m);
      return `__V${tokens.length - 1}__`;
    });
    // Ahora solo deben quedar dígitos, operadores y paréntesis
    expr = expr.replace(/[^0-9+\-*/().\s]/g, '');
    // Restaurar variables
    tokens.forEach((v, i) => { expr = expr.replace(`__V${i}__`, v); });
    expr = expr.replace(/\s+/g, '').trim();

    if (!expr) return null;

    // Validar evaluabilidad con valores de prueba (valores numéricos reales, sin código)
    try {
      const T=880, NK=360, ESP=380, LC=650, CIN=680, CAD=940, ACA=180, s=10,
            B4=220, B6=147, B8=110, B10=88, W4=170, H4=235, E2=190;
      // eslint-disable-next-line no-new-func
      const v = new Function('T','NK','ESP','LC','CIN','CAD','ACA','s',
                             'B4','B6','B8','B10','W4','H4','E2',
        `"use strict";return (${expr})`
      )(T,NK,ESP,LC,CIN,CAD,ACA,s,B4,B6,B8,B10,W4,H4,E2);
      if (typeof v !== 'number' || !isFinite(v)) return null;
    } catch(e) { return null; }

    return expr || null;
  }

  // ── Helpers ────────────────────────────────────────────────────────
  function _esListo(txt) {
    return /\blisto\b|\bfin\b|\btermin|\bsaltar\b|\bno\s+m[aá]s\b|\bpasar\b|\bnext\b/i.test(txt);
  }

  function _extraerNombrePunto(txt) {
    // "A es el origen" → "A"
    // "punto 1 en..." → "1"
    // "el punto NW" → "NW"
    const m = txt.match(/^([A-Za-z0-9]+)\b/);
    return m ? m[1] : null;
  }

  function _slug(nombre) {
    return nombre.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  }

  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── API pública ───────────────────────────────────────────────────
  return { open, close, _sugg };

})();
