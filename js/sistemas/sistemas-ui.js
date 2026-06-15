'use strict';
/**
 * sistemas/sistemas-ui.js
 * Modal "Cargar desde Sistema" en el Trazador.
 * Permite elegir un sistema de patronaje registrado,
 * seleccionar pieza y talla, y cargar el trazado automáticamente.
 */

window.PAT = window.PAT || {};
PAT.SistemasUI = (function () {

  let _modal = null;

  function open() {
    if (!_modal) _build();
    _modal.classList.add('open');
    _renderSistemas();
  }
  function close() {
    if (_modal) _modal.classList.remove('open');
  }

  function _build() {
    _modal = document.createElement('div');
    _modal.id = 'sis-modal';
    _modal.innerHTML = `
<style>
#sis-modal{position:fixed;inset:0;z-index:950;display:none;align-items:center;justify-content:center}
#sis-modal.open{display:flex}
#sis-ov{position:absolute;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px)}
#sis-box{position:relative;z-index:1;background:#0e0e1a;border:1px solid #3d3d58;border-radius:16px;
  width:min(680px,95vw);max-height:88vh;display:flex;flex-direction:column;
  box-shadow:0 24px 80px rgba(0,0,0,.8)}
.sis-hdr{display:flex;align-items:center;padding:14px 20px;border-bottom:1px solid #2e2e45;gap:12px}
.sis-title{font-size:14px;font-weight:800;color:#ede9fe;flex:1}
#sis-x{background:none;border:none;color:#5a5678;font-size:18px;cursor:pointer;padding:4px 8px}
#sis-x:hover{color:#ede9fe}
.sis-body{padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:16px}

/* Tarjeta de sistema */
.sis-card{border:1px solid #2e2e45;border-radius:12px;overflow:hidden;transition:border-color .2s}
.sis-card.sel{border-color:#8b5cf6}
.sis-card-hdr{display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;
  background:#141420}
.sis-card-hdr:hover{background:#1a1730}
.sis-card-icon{font-size:24px}
.sis-card-info{flex:1}
.sis-card-name{font-size:13px;font-weight:800;color:#ede9fe}
.sis-card-desc{font-size:11px;color:#5a5678;margin-top:3px}
.sis-card-body{padding:16px;border-top:1px solid #2e2e45;display:none;background:#0b0b16}
.sis-card.sel .sis-card-body{display:block}

/* Controles de selección */
.sis-row{display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
.sis-lbl{font-size:11px;color:#9490b0;min-width:80px}
.sis-sel{background:#141420;border:1px solid #2e2e45;border-radius:8px;color:#ede9fe;
  font-size:12px;padding:6px 10px;outline:none;flex:1}
.sis-sel:focus{border-color:#8b5cf6}

/* Tabla de medidas preview */
.sis-tabla{width:100%;border-collapse:collapse;font-size:10px;margin-top:8px}
.sis-tabla th{background:#1a1730;color:#a78bfa;padding:4px 8px;text-align:left;
  border-bottom:1px solid #2e2e45;font-weight:600}
.sis-tabla td{padding:4px 8px;border-bottom:1px solid #1a1730;color:#9490b0}
.sis-tabla tr:hover td{background:#1a1730;color:#ede9fe}
.sis-tabla .hi{color:#ede9fe;font-weight:700}

/* Botón cargar */
.sis-load-btn{width:100%;padding:10px;border-radius:10px;border:none;
  background:#8b5cf6;color:#fff;font-size:13px;font-weight:700;cursor:pointer;
  margin-top:14px;transition:background .2s}
.sis-load-btn:hover{background:#7c3aed}
</style>

<div id="sis-ov"></div>
<div id="sis-box">
  <div class="sis-hdr">
    <div class="sis-title">🧵 Cargar desde Sistema de Patronaje</div>
    <button id="sis-x">✕</button>
  </div>
  <div class="sis-body" id="sis-body">
    <div style="font-size:11px;color:#5a5678">
      Elige un sistema registrado, selecciona la pieza y la talla.
      El patrón se trazará automáticamente siguiendo las fórmulas del sistema.
    </div>
    <div id="sis-lista"></div>
  </div>
</div>
    `;
    document.body.appendChild(_modal);
    document.getElementById('sis-ov').onclick = close;
    document.getElementById('sis-x').onclick  = close;
  }

  function _renderSistemas() {
    const lista = document.getElementById('sis-lista');
    lista.innerHTML = '';

    const sistemas = Object.values(PAT.Sistemas || {});
    if (!sistemas.length) {
      lista.innerHTML = '<div style="color:#5a5678;font-size:12px">No hay sistemas registrados.</div>';
      return;
    }

    sistemas.forEach(sis => _renderTarjetaSistema(sis, lista));
  }

  function _renderTarjetaSistema(sis, container) {
    const card = document.createElement('div');
    card.className = 'sis-card';
    card.id = 'sis-card-' + sis.nombre.replace(/\s+/g,'_');

    // Piezas disponibles — combinadas de piezasDama + piezasCaballero si existen,
    // o fallback al método anterior por compatibilidad
    const piezas = [];
    if (sis.piezasDama || sis.piezasCaballero) {
      (sis.piezasDama      || []).forEach(p => piezas.push(p));
      (sis.piezasCaballero || []).forEach(p => piezas.push(p));
    } else {
      if (sis.blusaTrasera)    piezas.push({ id:'blusa-trasera',    label:'Blusa Trasera',    tipo:'dama' });
      if (sis.camisaPosterior) piezas.push({ id:'camisa-posterior', label:'Camisa Posterior', tipo:'caballero' });
    }

    // Tallas
    const tallasD = (sis.tallasDisponibles?.dama      || []).map(t => `<option value="${t}">${t}</option>`).join('');
    const tallasC = (sis.tallasDisponibles?.caballero  || []).map(t => `<option value="${t}">${t}</option>`).join('');

    card.innerHTML = `
      <div class="sis-card-hdr" onclick="this.closest('.sis-card').classList.toggle('sel')">
        <div class="sis-card-icon">✂️</div>
        <div class="sis-card-info">
          <div class="sis-card-name">${sis.nombre}</div>
          <div class="sis-card-desc">v${sis.version} · ${piezas.length} piezas disponibles · Tablas propias SS→3XL</div>
        </div>
        <div style="color:#5a5678;font-size:12px">▾</div>
      </div>
      <div class="sis-card-body">

        <div class="sis-row">
          <span class="sis-lbl">Pieza</span>
          <select class="sis-sel" id="sis-pieza-${sis.nombre.replace(/\s+/g,'_')}">
            ${piezas.map(p=>`<option value="${p.id}" data-tipo="${p.tipo||'dama'}">${p.label}</option>`).join('')}
          </select>
        </div>

        <div class="sis-row" id="sis-row-dama-${sis.nombre.replace(/\s+/g,'_')}">
          <span class="sis-lbl">Talla</span>
          <select class="sis-sel" id="sis-talla-d-${sis.nombre.replace(/\s+/g,'_')}">${tallasD}</select>
          <span style="font-size:10px;color:#5a5678">Dama</span>
        </div>

        <div class="sis-row" id="sis-row-cab-${sis.nombre.replace(/\s+/g,'_')}" style="display:none">
          <span class="sis-lbl">Talla</span>
          <select class="sis-sel" id="sis-talla-c-${sis.nombre.replace(/\s+/g,'_')}">${tallasC}</select>
          <span style="font-size:10px;color:#5a5678">Caballero</span>
        </div>

        <!-- Vista previa medidas -->
        <div id="sis-preview-${sis.nombre.replace(/\s+/g,'_')}" style="margin-top:6px"></div>

        <button class="sis-load-btn"
          onclick="PAT.SistemasUI._cargar('${sis.nombre}')">
          ▶ Trazar esta pieza en el Trazador
        </button>
      </div>
    `;

    // Eventos: cambio de pieza → mostrar talla correcta
    container.appendChild(card);

    const key = sis.nombre.replace(/\s+/g,'_');
    const piezaSel = document.getElementById('sis-pieza-' + key);
    const rowDama  = document.getElementById('sis-row-dama-' + key);
    const rowCab   = document.getElementById('sis-row-cab-'  + key);
    const preview  = document.getElementById('sis-preview-'  + key);

    function actualizarUI() {
      const pieza   = piezaSel.value;
      const piezaObj= piezas.find(p => p.id === pieza);
      const esCab   = piezaObj ? piezaObj.tipo === 'caballero' : pieza === 'camisa-posterior';
      rowDama.style.display = esCab ? 'none' : '';
      rowCab.style.display  = esCab ? ''     : 'none';
      _renderPreview(sis, pieza, esCab, preview, key);
    }
    piezaSel.onchange = actualizarUI;
    document.getElementById('sis-talla-d-' + key).onchange = actualizarUI;
    document.getElementById('sis-talla-c-' + key).onchange = actualizarUI;
    actualizarUI();
  }

  function _renderPreview(sis, pieza, esCab, el, key) {
    const talla = esCab
      ? document.getElementById('sis-talla-c-' + key).value
      : document.getElementById('sis-talla-d-' + key).value;

    const m = esCab ? sis.getMedidasCaballero(talla) : sis.getMedidasDama(talla);

    const filas = [
      ['Busto/Pecho',   m.bust,         'cm'],
      ['Espalda',       m.shoulder,     'cm'],
      ['Talle trasero', m.backLength,   'cm'],
      ['Cintura',       m.waist,        'cm'],
      ['Cadera',        m.hip,          'cm'],
      ['Cuello',        m.neck,         'cm'],
    ].filter(f => f[1]);

    el.innerHTML = `
      <table class="sis-tabla">
        <tr>${filas.map(f=>`<th>${f[0]}</th>`).join('')}</tr>
        <tr>${filas.map(f=>`<td class="hi">${f[1]}<small style="font-size:8px;color:#5a5678"> ${f[2]}</small></td>`).join('')}</tr>
      </table>
      <div style="font-size:9px;color:#5a5678;margin-top:4px">
        Conversiones: busto/4 = ${Math.round(m.bust*10/4/10*10)/10}cm ·
        espalda/2 = ${Math.round(m.shoulder/2*10)/10}cm ·
        espalda/6 = ${Math.round(m.shoulder/6*10)/10}cm
      </div>
    `;
  }

  // ── Cargar pieza en el Trazador ────────────────────────────────
  function _cargar(nombreSistema) {
    const sis = PAT.Sistemas[nombreSistema] || Object.values(PAT.Sistemas).find(s=>s.nombre===nombreSistema);
    if (!sis) { alert('Sistema no encontrado'); return; }

    const key    = nombreSistema.replace(/\s+/g,'_');
    const pieza  = document.getElementById('sis-pieza-' + key).value;
    const piezaSel_ = document.getElementById('sis-pieza-' + key);
    const selOpt    = piezaSel_ ? piezaSel_.options[piezaSel_.selectedIndex] : null;
    const esCab     = selOpt ? (selOpt.getAttribute('data-tipo') === 'caballero') : pieza === 'camisa-posterior';
    const talla  = esCab
      ? document.getElementById('sis-talla-c-' + key).value
      : document.getElementById('sis-talla-d-' + key).value;

    const medidas = esCab ? sis.getMedidasCaballero(talla) : sis.getMedidasDama(talla);

    try {
      const bloque = sis.generarBloque(pieza, medidas, talla);

      if (!PAT.DrafterUI) {
        alert('Abre el Trazador primero (botón ✏ Trazar)');
        return;
      }

      // Abrir trazador si no está abierto
      PAT.DrafterUI.open();

      // Cargar con pequeño delay para que el trazador termine de inicializar
      setTimeout(() => {
        PAT.DrafterUI.cargarBloque({
          points:   bloque.points,
          lines:    bloque.lines,
          ptCtr:    bloque.ptCtr,
          name:     bloque.name,
          bloqueId: null,
        });
        close();
        if (PAT.App) PAT.App.toast(
          `✅ ${bloque.name} — ${Object.keys(bloque.points).length} puntos trazados`,
          'success'
        );
      }, 350);

    } catch(err) {
      alert('Error generando patrón: ' + err.message);
    }
  }

  return { open, close, _cargar };
})();
