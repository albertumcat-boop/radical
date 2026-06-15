/**
 * grading.js
 * Sistema de tallas estándar (grading) para PatrónAI Pro.
 * Basado en tablas ISO 4415 / ASTM D5585 para mujer, y ISO 3636 para hombre.
 *
 * Permite seleccionar una talla base (XS–3XL) y auto-rellenar las medidas.
 * El usuario puede ajustar cualquier medida individualmente después.
 */

'use strict';
window.PAT = window.PAT || {};

PAT.Grading = (function () {

  // ── Tablas de tallas ─────────────────────────────────────────────────────
  // Todas las medidas en cm.
  const SIZES = {
    mujer: {
      XS:  { bust:80,  waist:60, hip:86,  shoulder:36, neck:34, backLength:38, frontLength:40, totalLength:63, sleeveLength:58, wrist:15, skirtLength:58, hipDepth:19 },
      S:   { bust:84,  waist:64, hip:90,  shoulder:37, neck:35, backLength:39, frontLength:41, totalLength:64, sleeveLength:59, wrist:15, skirtLength:59, hipDepth:19 },
      M:   { bust:88,  waist:68, hip:94,  shoulder:38, neck:36, backLength:40, frontLength:42, totalLength:65, sleeveLength:60, wrist:16, skirtLength:60, hipDepth:20 },
      L:   { bust:96,  waist:76, hip:102, shoulder:40, neck:38, backLength:42, frontLength:44, totalLength:67, sleeveLength:61, wrist:16, skirtLength:62, hipDepth:21 },
      XL:  { bust:104, waist:84, hip:110, shoulder:42, neck:40, backLength:43, frontLength:45, totalLength:68, sleeveLength:62, wrist:17, skirtLength:63, hipDepth:21 },
      '2XL':{ bust:112, waist:92, hip:118, shoulder:44, neck:42, backLength:44, frontLength:46, totalLength:69, sleeveLength:63, wrist:17, skirtLength:64, hipDepth:22 },
      '3XL':{ bust:120, waist:100,hip:126, shoulder:46, neck:44, backLength:45, frontLength:47, totalLength:70, sleeveLength:64, wrist:18, skirtLength:65, hipDepth:22 },
    },
    hombre: {
      XS:  { bust:88,  waist:72, hip:90,  shoulder:42, neck:37, backLength:42, frontLength:44, totalLength:70, sleeveLength:62, wrist:17, skirtLength:65, hipDepth:22 },
      S:   { bust:92,  waist:76, hip:94,  shoulder:43, neck:38, backLength:43, frontLength:45, totalLength:71, sleeveLength:63, wrist:17, skirtLength:66, hipDepth:22 },
      M:   { bust:96,  waist:80, hip:98,  shoulder:44, neck:39, backLength:44, frontLength:46, totalLength:72, sleeveLength:64, wrist:18, skirtLength:67, hipDepth:23 },
      L:   { bust:104, waist:88, hip:106, shoulder:46, neck:41, backLength:46, frontLength:48, totalLength:74, sleeveLength:65, wrist:18, skirtLength:69, hipDepth:23 },
      XL:  { bust:112, waist:96, hip:114, shoulder:48, neck:43, backLength:47, frontLength:49, totalLength:75, sleeveLength:66, wrist:19, skirtLength:70, hipDepth:24 },
      '2XL':{ bust:120, waist:104,hip:122, shoulder:50, neck:45, backLength:48, frontLength:50, totalLength:76, sleeveLength:67, wrist:19, skirtLength:71, hipDepth:24 },
      '3XL':{ bust:128, waist:112,hip:130, shoulder:52, neck:47, backLength:49, frontLength:51, totalLength:77, sleeveLength:68, wrist:20, skirtLength:72, hipDepth:25 },
    },
    nino: {
      '2':  { bust:52,  waist:51, hip:54,  shoulder:24, neck:24, backLength:24, frontLength:25, totalLength:38, sleeveLength:32, wrist:12, skirtLength:30, hipDepth:12 },
      '4':  { bust:56,  waist:53, hip:58,  shoulder:26, neck:25, backLength:26, frontLength:27, totalLength:42, sleeveLength:35, wrist:12, skirtLength:34, hipDepth:13 },
      '6':  { bust:60,  waist:55, hip:62,  shoulder:28, neck:26, backLength:28, frontLength:29, totalLength:46, sleeveLength:38, wrist:13, skirtLength:38, hipDepth:14 },
      '8':  { bust:64,  waist:57, hip:66,  shoulder:30, neck:27, backLength:30, frontLength:31, totalLength:50, sleeveLength:41, wrist:13, skirtLength:42, hipDepth:15 },
      '10': { bust:68,  waist:59, hip:70,  shoulder:32, neck:28, backLength:32, frontLength:33, totalLength:54, sleeveLength:44, wrist:14, skirtLength:46, hipDepth:16 },
      '12': { bust:72,  waist:62, hip:74,  shoulder:34, neck:30, backLength:35, frontLength:37, totalLength:58, sleeveLength:50, wrist:14, skirtLength:50, hipDepth:17 },
      '14': { bust:76,  waist:64, hip:80,  shoulder:36, neck:32, backLength:37, frontLength:39, totalLength:61, sleeveLength:55, wrist:15, skirtLength:55, hipDepth:18 },
    },
  };

  const SIZE_ORDER = {
    mujer:  ['XS','S','M','L','XL','2XL','3XL'],
    hombre: ['XS','S','M','L','XL','2XL','3XL'],
    nino:   ['2','4','6','8','10','12','14'],
  };

  let _currentGender = 'mujer';
  let _currentSize   = 'M';

  // ── API pública ────────────────────────────────────────────────────────
  function getSizes(gender) {
    return SIZE_ORDER[gender] || SIZE_ORDER.mujer;
  }

  function getMeasures(gender, size) {
    return { ...(SIZES[gender]?.[size] || SIZES.mujer.M) };
  }

  function getCurrentGender() { return _currentGender; }
  function getCurrentSize()   { return _currentSize; }

  function detectSize(measures, gender = 'mujer') {
    const table  = SIZES[gender];
    const order  = SIZE_ORDER[gender];
    let   best   = order[Math.floor(order.length / 2)];
    let   minDiff = Infinity;

    order.forEach(size => {
      const ref  = table[size];
      const diff = Math.abs(measures.bust - ref.bust)
                 + Math.abs(measures.waist - ref.waist)
                 + Math.abs(measures.hip   - ref.hip);
      if (diff < minDiff) { minDiff = diff; best = size; }
    });
    return best;
  }

  // ── UI de selector de talla ─────────────────────────────────────────────
  function renderSelector(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <select id="grade-gender" style="
          background:var(--inp);border:1px solid var(--brd);color:var(--tx);
          border-radius:6px;padding:5px 8px;font-size:11px;font-family:var(--font);
        ">
          <option value="mujer">Mujer</option>
          <option value="hombre">Hombre</option>
          <option value="nino">Niño/a</option>
        </select>

        <div id="grade-size-btns" style="display:flex;gap:4px;flex-wrap:wrap;"></div>

        <button id="grade-apply" style="
          background:var(--acc);color:#fff;border:none;border-radius:6px;
          padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;
          font-family:var(--font);
        ">Aplicar talla</button>

        <span id="grade-detected" style="font-size:10px;color:var(--tx3);"></span>
      </div>
    `;

    _renderSizeButtons('mujer');

    document.getElementById('grade-gender').addEventListener('change', function () {
      _currentGender = this.value;
      _renderSizeButtons(this.value);
    });

    document.getElementById('grade-apply').addEventListener('click', () => {
      const measures = getMeasures(_currentGender, _currentSize);
      _applyMeasuresToUI(measures);
      if (PAT.App) PAT.App.toast(`Talla ${_currentSize} (${_currentGender}) aplicada`, 'success');
    });
  }

  function _renderSizeButtons(gender) {
    const container = document.getElementById('grade-size-btns');
    if (!container) return;
    const sizes = getSizes(gender);
    container.innerHTML = sizes.map(size => `
      <button class="grade-size-btn ${size === _currentSize ? 'active' : ''}"
        data-size="${size}" style="
          background:${size === _currentSize ? 'var(--acc)' : 'var(--inp)'};
          color:${size === _currentSize ? '#fff' : 'var(--tx2)'};
          border:1px solid var(--brd);border-radius:5px;
          padding:3px 8px;font-size:11px;font-weight:600;
          cursor:pointer;font-family:var(--font);transition:all .15s;
        ">${size}</button>
    `).join('');

    container.querySelectorAll('.grade-size-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        _currentSize = this.dataset.size;
        container.querySelectorAll('.grade-size-btn').forEach(b => {
          b.style.background = b === this ? 'var(--acc)' : 'var(--inp)';
          b.style.color      = b === this ? '#fff' : 'var(--tx2)';
        });
      });
    });
  }

  function _applyMeasuresToUI(measures) {
    Object.entries(measures).forEach(([key, val]) => {
      const inp = document.querySelector(`input[data-measure="${key}"]`);
      if (inp) {
        inp.value = val;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  // Detectar talla desde las medidas actuales del UI
  function detectFromUI() {
    const measures = {};
    document.querySelectorAll('input[data-measure]').forEach(inp => {
      const v = parseFloat(inp.value);
      if (!isNaN(v)) measures[inp.dataset.measure] = v;
    });
    const detected = detectSize(measures, _currentGender);
    const el = document.getElementById('grade-detected');
    if (el) el.textContent = `≈ Talla ${detected} detectada`;
    return detected;
  }

  return {
    getSizes, getMeasures, detectSize,
    getCurrentGender, getCurrentSize,
    renderSelector, detectFromUI,
  };
})();
