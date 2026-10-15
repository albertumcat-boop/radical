'use strict';
window.PAT = window.PAT || {};

PAT.Wizard = (function () {

  /* ── Etiquetas de medidas ───────────────────────────────────── */
  const CAMPOS_INFO = {
    bust:        { label: 'Busto / Pecho',         placeholder: 'ej. 88' },
    waist:       { label: 'Cintura',               placeholder: 'ej. 68' },
    hip:         { label: 'Cadera',                placeholder: 'ej. 94' },
    hipDepth:    { label: 'Cadera desde cintura',  placeholder: 'ej. 18' },
    shoulder:    { label: 'Ancho de Espalda',      placeholder: 'ej. 38' },
    neck:        { label: 'Cuello (circunf.)',      placeholder: 'ej. 36' },
    backLength:  { label: 'Talle Espalda',         placeholder: 'ej. 40' },
    frontLength: { label: 'Talle Delantero',       placeholder: 'ej. 42' },
    totalLength: { label: 'Largo Total',           placeholder: 'ej. 65' },
    sleeveLength:{ label: 'Largo Manga',           placeholder: 'ej. 58' },
    sleeveShort: { label: 'Largo Manga Corta',     placeholder: 'ej. 20' },
    armCirc:     { label: 'Circunf. Brazo',        placeholder: 'ej. 28' },
    wrist:       { label: 'Muñeca',                placeholder: 'ej. 16' },
    skirtLength: { label: 'Largo Falda',           placeholder: 'ej. 60' },
    rise:        { label: 'Tiro',                  placeholder: 'ej. 28' },
    inseam:      { label: 'Entrepierna',           placeholder: 'ej. 76' },
    outseam:     { label: 'Lateral (pantalón)',    placeholder: 'ej. 100'},
    thigh:       { label: 'Muslo',                 placeholder: 'ej. 56' },
    knee:        { label: 'Rodilla',               placeholder: 'ej. 37' },
    ankle:       { label: 'Tobillo',               placeholder: 'ej. 23' },
  };

  /* ── Catálogo de prendas (agrupado por prenda completa) ─────── */
  const CATEGORIAS = [
    {
      titulo: 'Camisa',
      icon: '👔',
      items: [
        {
          id: 'camisa-posterior',
          nombre: 'Espalda',
          icon: '🔙',
          desc: 'Parte posterior · NH',
          campos: ['bust', 'shoulder', 'neck', 'totalLength'],
        },
        {
          id: 'camisa-delantera',
          nombre: 'Delantera',
          icon: '👕',
          desc: 'Parte delantera · NH',
          campos: ['bust', 'neck', 'shoulder', 'totalLength'],
        },
        {
          id: 'manga-corta-camisa',
          nombre: 'Manga Corta',
          icon: '🤏',
          desc: 'Manga corta · NH',
          campos: ['bust', 'shoulder', 'sleeveShort', 'armCirc', 'wrist'],
        },
        {
          id: 'manga-larga-camisa',
          nombre: 'Manga Larga',
          icon: '💪',
          desc: 'Manga larga · NH',
          campos: ['bust', 'shoulder', 'sleeveLength', 'armCirc', 'wrist'],
        },
        {
          id: 'cuello-sport',
          nombre: 'Cuello Sport',
          icon: '🏅',
          desc: 'Cuello camisero · NH',
          campos: ['neck'],
        },
        {
          id: 'cuello-con-pie',
          nombre: 'Cuello con Pie',
          icon: '🪢',
          desc: 'Cuello con pie · NH',
          campos: ['neck'],
        },
        { id: 'bolsillo-pico',      nombre: 'Bolsillo Pico',      icon: '🔷', desc: 'NH', campos: [] },
        { id: 'bolsillo-recto',     nombre: 'Bolsillo Recto',     icon: '⬜', desc: 'NH', campos: [] },
        { id: 'bolsillo-semicurva', nombre: 'Bolsillo Semicurva', icon: '🔵', desc: 'NH', campos: [] },
      ],
    },
    {
      titulo: 'Blusa / Vestido',
      icon: '👗',
      items: [
        {
          id: 'blusa-trasera',
          nombre: 'Espalda',
          icon: '🔙',
          desc: 'Parte trasera · NH',
          campos: ['bust', 'shoulder', 'neck', 'backLength', 'waist', 'hip', 'hipDepth'],
        },
        {
          id: 'manga-corta-vestido',
          nombre: 'Manga Corta',
          icon: '🤏',
          desc: 'Manga corta · NH',
          campos: ['bust', 'shoulder', 'sleeveShort', 'armCirc', 'wrist'],
        },
        {
          id: 'manga-larga-vestido',
          nombre: 'Manga Larga',
          icon: '💪',
          desc: 'Manga larga · NH',
          campos: ['bust', 'shoulder', 'sleeveLength', 'armCirc', 'wrist'],
        },
      ],
    },
  ];

  let _pieza        = null; // pieza seleccionada
  let _CATS_CUSTOM  = [];   // categorías cargadas dinámicamente de sistemas propios

  /* ── Cargar sistemas custom en el wizard ─────────────────────── */
  async function _cargarCustom() {
    _CATS_CUSTOM = [];
    try {
      const lista = await PAT.MisSistemas.listar();
      lista.forEach(sis => {
        if (!(sis.piezas||[]).length) return;
        const sistemaKey = 'user_' + sis.id;
        // Asegurar que esté registrado en memoria
        PAT.MisSistemas.registrarEnMemoria(sis);
        _CATS_CUSTOM.push({
          titulo: sis.nombre,
          icon:   '🧵',
          items:  (sis.piezas||[]).map(p => ({
            id:          `custom:${sistemaKey}:${p.id}`,
            nombre:      p.nombre || p.id,
            icon:        '📐',
            desc:        `${sis.nombre} · ${p.categoria||'pieza'}`,
            // campos: todos los estándar (el sistema evalúa con defaults si falta alguno)
            campos: ['bust','neck','shoulder','totalLength','waist','hip','hipDepth'],
            _sistemaKey: sistemaKey,
            _piezaId:    p.id,
          })),
        });
      });
    } catch(e) { /* sin auth o sin datos */ }
  }

  // Permite a MisSistemasUI recargar el wizard cuando se guarda un sistema
  window.PAT = window.PAT || {};
  PAT.WizardCustom = { recargar: () => _cargarCustom().then(() => {
    if (document.getElementById('wiz-step1')?.style.display !== 'none') _renderStep1();
  })};

  /* ── API pública ───────────────────────────────────────────── */
  function open() {
    const modal = document.getElementById('wizard-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    // Cargar sistemas custom antes de mostrar step1
    _cargarCustom().then(() => _showStep1());
  }

  function close() {
    const modal = document.getElementById('wizard-modal');
    if (modal) modal.style.display = 'none';
    _pieza = null;
  }

  /* ── Step 1 — selector de prenda ────────────────────────────── */
  function _showStep1() {
    document.getElementById('wiz-step1').style.display = '';
    document.getElementById('wiz-step2').style.display = 'none';
  }

  function _renderStep1() {
    const el = document.getElementById('wiz-categories');
    const todasCats = [
      ...CATEGORIAS,
      ..._CATS_CUSTOM,
    ];
    el.innerHTML = todasCats.map(cat => `
      <div class="wiz-cat">
        <div class="wiz-cat-title">${cat.icon ? cat.icon + ' ' : ''}${cat.titulo}</div>
        <div class="wiz-items">
          ${cat.items.map(item => `
            <button class="wiz-item" data-id="${item.id}">
              <span class="wiz-item-icon">${item.icon}</span>
              <span class="wiz-item-nombre">${item.nombre}</span>
              <span class="wiz-item-desc">${item.desc}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');

    el.querySelectorAll('.wiz-item').forEach(btn => {
      btn.addEventListener('click', () => _selectPrenda(btn.dataset.id));
    });
  }

  /* ── Step 2 — medidas ──────────────────────────────────────── */
  function _selectPrenda(id) {
    const todasPiezas = [...CATEGORIAS, ..._CATS_CUSTOM].flatMap(c => c.items);
    _pieza = todasPiezas.find(p => p.id === id);
    if (!_pieza) return;

    document.getElementById('wiz-step1').style.display = 'none';
    document.getElementById('wiz-step2').style.display = '';
    document.getElementById('wiz-pieza-nombre').textContent = _pieza.nombre;

    _renderCampos();
    _resetTalla();
  }

  function _renderCampos() {
    const el = document.getElementById('wiz-campos');
    if (!_pieza || _pieza.campos.length === 0) {
      el.innerHTML = '<p class="wiz-no-campos">Esta pieza usa medidas estándar — no necesita medidas adicionales.</p>';
      return;
    }
    el.innerHTML = _pieza.campos.map(c => {
      const info = CAMPOS_INFO[c] || { label: c, placeholder: '' };
      return `
        <div class="wiz-campo">
          <label for="wiz-m-${c}">${info.label}</label>
          <div class="wiz-campo-row">
            <input type="number" id="wiz-m-${c}" placeholder="${info.placeholder}"
                   min="1" max="400" step="0.5" autocomplete="off">
            <span class="wiz-unit">cm</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ── Carga de talla base (NH) ───────────────────────────────── */
  function _resetTalla() {
    const tipoSel  = document.getElementById('wiz-talla-tipo');
    const valorSel = document.getElementById('wiz-talla-valor');
    if (!tipoSel || !valorSel) return;
    tipoSel.value       = '';
    valorSel.innerHTML  = '';
    valorSel.style.display = 'none';
  }

  function _onTallaChange() {
    const nh = PAT.Sistemas?.NereydaHerrera;
    const tipoSel  = document.getElementById('wiz-talla-tipo');
    const valorSel = document.getElementById('wiz-talla-valor');
    if (!tipoSel || !valorSel) return;

    const tipo = tipoSel.value;
    if (!tipo || !nh) { valorSel.style.display = 'none'; return; }

    const tallas = tipo === 'dama'
      ? nh.tallasDisponibles.dama
      : nh.tallasDisponibles.caballero;

    valorSel.innerHTML = tallas.map(t => `<option value="${t}">${t}</option>`).join('');
    valorSel.style.display = '';
  }

  function _onCargarTalla() {
    const nh = PAT.Sistemas?.NereydaHerrera;
    if (!nh || !_pieza) return;

    const tipo  = document.getElementById('wiz-talla-tipo')?.value;
    const talla = document.getElementById('wiz-talla-valor')?.value;
    if (!tipo || !talla) { alert('Selecciona tipo y talla primero.'); return; }

    const m = tipo === 'dama'
      ? nh.getMedidasDama(talla)
      : nh.getMedidasCaballero(talla);
    if (!m) return;

    _pieza.campos.forEach(c => {
      const inp = document.getElementById('wiz-m-' + c);
      if (inp && m[c] != null) inp.value = m[c];
    });
  }

  /* ── Trazar ─────────────────────────────────────────────────── */
  function _getMedidas() {
    const m = {};
    if (!_pieza) return m;
    _pieza.campos.forEach(c => {
      const v = parseFloat(document.getElementById('wiz-m-' + c)?.value);
      if (!isNaN(v) && v > 0) m[c] = v;
    });
    return m;
  }

  function _trazar() {
    if (!_pieza) return;

    // Validar campos requeridos
    if (_pieza.campos.length > 0) {
      const m = _getMedidas();
      const faltantes = _pieza.campos.filter(c => m[c] === undefined);
      if (faltantes.length > 0) {
        const nombres = faltantes.map(c => CAMPOS_INFO[c]?.label || c).join(', ');
        alert('⚠ Completa antes de trazar:\n\n' + nombres);
        return;
      }
    }

    const id      = _pieza.id;
    const medidas = _getMedidas();
    close();

    // Abrir el Trazador si no está abierto
    if (PAT.DrafterUI) PAT.DrafterUI.open();

    // Pequeño delay para que DrafterUI inicialice el canvas antes de trazar
    setTimeout(() => {
      if (typeof window._runPieza === 'function') {
        window._runPieza(id, medidas);
      } else {
        console.warn('[Wizard] _runPieza no disponible');
      }
    }, 120);
  }

  function _trazarEnBlanco() {
    close();
    if (PAT.DrafterUI) PAT.DrafterUI.nuevoEnBlanco();
  }

  /* ── Estilos ─────────────────────────────────────────────────── */
  function _injectStyles() {
    if (document.getElementById('wizard-styles')) return;
    const s = document.createElement('style');
    s.id = 'wizard-styles';
    s.textContent = `
      #wizard-modal {
        position:fixed;inset:0;z-index:10000;
        align-items:center;justify-content:center;
        background:rgba(30,20,10,.6);backdrop-filter:blur(6px);
      }
      .wiz-panel {
        position:relative;background:#faf7f2;
        border:1px solid #d8d0c0;border-radius:16px;
        width:min(700px,95vw);max-height:90vh;
        display:flex;flex-direction:column;
        box-shadow:0 24px 80px rgba(80,60,20,.22);
      }
      .wiz-header {
        display:flex;align-items:center;justify-content:space-between;
        padding:18px 24px 14px;
        border-bottom:1px solid #e8e0d0;
        flex-shrink:0;background:#f5f0e8;border-radius:16px 16px 0 0;
      }
      .wiz-header h2 { margin:0;font-size:1.1rem;color:#3a2e1e;font-weight:700; }
      #wizard-close {
        background:none;border:none;color:#9a8e7e;font-size:1.1rem;
        cursor:pointer;padding:4px 8px;border-radius:6px;line-height:1;
      }
      #wizard-close:hover { color:#3a2e1e;background:rgba(0,0,0,.06); }
      .wiz-body { padding:20px 24px;overflow-y:auto;flex:1; }

      /* Step 1 */
      .wiz-hint { color:#7a6e5e;font-size:.83rem;margin:0 0 18px; }
      .wiz-cat { margin-bottom:22px; }
      .wiz-cat-title {
        font-size:.72rem;font-weight:700;color:#8a5c20;
        letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px;
      }
      .wiz-items { display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px; }
      .wiz-item {
        background:#fff;
        border:1px solid #d8d0c0;
        border-radius:10px;padding:12px 14px;
        cursor:pointer;text-align:left;width:100%;
        display:flex;flex-direction:column;gap:3px;
        transition:background .15s,border-color .15s;
      }
      .wiz-item:hover {
        background:#fdf5e8;
        border-color:rgba(138,92,32,.5);
      }
      .wiz-item-icon  { font-size:1.5rem;line-height:1; }
      .wiz-item-nombre{ font-size:.88rem;font-weight:600;color:#3a2e1e;margin-top:4px; }
      .wiz-item-desc  { font-size:.73rem;color:#9a8e7e; }

      /* Step 2 */
      .wiz-top-row { display:flex;align-items:center;gap:12px;margin-bottom:18px; }
      .wiz-top-row h3 { margin:0;color:#3a2e1e;font-size:1rem;font-weight:600; }
      #wiz-back {
        background:none;border:1px solid #c8bfaf;
        color:#7a6e5e;border-radius:6px;padding:5px 13px;
        cursor:pointer;font-size:.8rem;white-space:nowrap;
      }
      #wiz-back:hover { color:#3a2e1e;border-color:#8a5c20; }

      .wiz-talla-row {
        display:flex;align-items:center;gap:8px;flex-wrap:wrap;
        background:#f5f0e8;border:1px solid #d8d0c0;
        border-radius:8px;padding:10px 14px;margin-bottom:22px;
      }
      .wiz-talla-row label { font-size:.8rem;color:#7a6e5e;white-space:nowrap; }
      .wiz-talla-row select {
        background:#fff;border:1px solid #c8bfaf;
        color:#3a2e1e;border-radius:6px;padding:5px 8px;
        font-size:.82rem;cursor:pointer;
      }
      #wiz-cargar-talla {
        background:rgba(138,92,32,.12);border:1px solid rgba(138,92,32,.35);
        color:#8a5c20;border-radius:6px;padding:5px 14px;
        cursor:pointer;font-size:.82rem;
      }
      #wiz-cargar-talla:hover { background:rgba(138,92,32,.22); }

      .wiz-campos-grid {
        display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));
        gap:14px;margin-bottom:24px;
      }
      .wiz-campo label {
        display:block;font-size:.78rem;color:#7a6e5e;margin-bottom:5px;
        font-weight:500;
      }
      .wiz-campo-row { display:flex;align-items:center;gap:6px; }
      .wiz-campo-row input {
        flex:1;background:#fff;
        border:1px solid #c8bfaf;
        color:#3a2e1e;border-radius:7px;padding:8px 10px;font-size:.92rem;
      }
      .wiz-campo-row input:focus { outline:none;border-color:#8a5c20;box-shadow:0 0 0 2px rgba(138,92,32,.12); }
      .wiz-unit { font-size:.78rem;color:#9a8e7e; }
      .wiz-no-campos { color:#9a8e7e;font-style:italic;font-size:.85rem;padding:8px 0; }
      .wiz-blank-row { margin-top:18px;padding-top:14px;border-top:1px solid #e8e0d0;text-align:center; }
      #wiz-en-blanco { background:none;border:none;color:#9a8e7e;font-size:.82rem;cursor:pointer;text-decoration:underline;text-underline-offset:3px; }
      #wiz-en-blanco:hover { color:#3a2e1e; }

      .wiz-footer { border-top:1px solid #e8e0d0;padding-top:18px;margin-top:4px; }
      #wiz-trazar {
        width:100%;
        background:linear-gradient(135deg,#a06828,#7a4a10);
        border:none;color:#fff;border-radius:10px;
        padding:14px;font-size:1rem;font-weight:700;
        cursor:pointer;letter-spacing:.02em;
        transition:background .2s,transform .15s,box-shadow .2s;
        box-shadow:0 4px 16px rgba(120,80,20,.28);
      }
      #wiz-trazar:hover {
        background:linear-gradient(135deg,#b87830,#8a5c20);
        transform:translateY(-1px);
        box-shadow:0 6px 22px rgba(138,92,32,.4);
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Inyectar modal ─────────────────────────────────────────── */
  function _injectModal() {
    if (document.getElementById('wizard-modal')) return;
    const div = document.createElement('div');
    div.id = 'wizard-modal';
    div.style.display = 'none';
    div.innerHTML = `
      <div class="wiz-panel">
        <div class="wiz-header">
          <h2>✂ Nueva Prenda</h2>
          <button id="wizard-close">✕</button>
        </div>
        <div class="wiz-body">

          <!-- Paso 1: elegir prenda -->
          <div id="wiz-step1">
            <p class="wiz-hint">Selecciona la pieza que deseas trazar:</p>
            <div id="wiz-categories"></div>
            <div class="wiz-blank-row">
              <button id="wiz-en-blanco">✏ Abrir canvas en blanco</button>
            </div>
          </div>

          <!-- Paso 2: medidas y trazar -->
          <div id="wiz-step2" style="display:none">
            <div class="wiz-top-row">
              <button id="wiz-back">← Volver</button>
              <h3 id="wiz-pieza-nombre"></h3>
            </div>

            <div class="wiz-talla-row">
              <label>Cargar talla base:</label>
              <select id="wiz-talla-tipo">
                <option value="">— ingresar manual —</option>
                <option value="dama">Dama (NH)</option>
                <option value="caballero">Caballero (NH)</option>
              </select>
              <select id="wiz-talla-valor" style="display:none"></select>
              <button id="wiz-cargar-talla">Cargar</button>
            </div>

            <div id="wiz-campos" class="wiz-campos-grid"></div>

            <div class="wiz-footer">
              <button id="wiz-trazar">▶ Trazar Automáticamente</button>
            </div>
          </div>

        </div>
      </div>
    `;
    document.body.appendChild(div);

    // Eventos
    document.getElementById('wizard-close').addEventListener('click', close);
    div.addEventListener('click', e => { if (e.target === div) close(); });
    document.getElementById('wiz-back').addEventListener('click', _showStep1);
    document.getElementById('wiz-en-blanco').addEventListener('click', _trazarEnBlanco);
    document.getElementById('wiz-talla-tipo').addEventListener('change', _onTallaChange);
    document.getElementById('wiz-cargar-talla').addEventListener('click', _onCargarTalla);
    document.getElementById('wiz-trazar').addEventListener('click', _trazar);

    _renderStep1();
  }

  /* ── Init ────────────────────────────────────────────────────── */
  function init() {
    _injectStyles();
    _injectModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { open, close, CAMPOS_INFO };

})();
