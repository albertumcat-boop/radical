/**
 * share.js
 * Sistema de compartir patrones por link o descarga JSON.
 * El link codifica garment + medidas + params en base64 en la URL.
 */

'use strict';
window.PAT = window.PAT || {};

PAT.Share = (function () {

  // ── Codificar estado actual en URL ─────────────────────────────
  function encode(garment, measures, params) {
    try {
      const payload = { g: garment, m: measures, p: params, v: 1 };
      const json    = JSON.stringify(payload);
      const b64     = btoa(unescape(encodeURIComponent(json)));
      return b64;
    } catch (e) {
      console.error('[Share] Error al codificar:', e);
      return null;
    }
  }

  function decode(b64) {
    try {
      const json    = decodeURIComponent(escape(atob(b64)));
      const payload = JSON.parse(json);
      return payload;
    } catch (e) {
      console.error('[Share] Error al decodificar:', e);
      return null;
    }
  }

  function getShareURL(garment, measures, params) {
    const code = encode(garment, measures, params);
    if (!code) return null;
    const base = window.location.origin + window.location.pathname;
    return `${base}?p=${code}`;
  }

  // ── Leer patrón desde la URL al cargar ─────────────────────────
  function loadFromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const code   = params.get('p');
      if (!code) return null;
      return decode(code);
    } catch (e) {
      return null;
    }
  }

  // ── Exportar como archivo JSON ──────────────────────────────────
  function exportJSON(garment, measures, params, name) {
    const payload = {
      app: 'PatrónAI Pro',
      version: 1,
      name: name || `Patrón ${garment} — ${new Date().toLocaleDateString('es')}`,
      garment, measures, params,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `patronai-${garment}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Importar desde archivo JSON ─────────────────────────────────
  function importJSON(onLoad) {
    const input = document.createElement('input');
    input.type  = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text    = await file.text();
        const payload = JSON.parse(text);
        if (payload.app !== 'PatrónAI Pro') {
          if (PAT.App) PAT.App.toast('Archivo no compatible con PatrónAI Pro', 'error');
          return;
        }
        onLoad(payload);
      } catch (err) {
        if (PAT.App) PAT.App.toast('Error al leer el archivo', 'error');
      }
    };
    input.click();
  }

  // ── Modal de compartir ──────────────────────────────────────────
  function showShareModal(garment, measures, params) {
    const url = getShareURL(garment, measures, params);

    const existing = document.getElementById('modal-share');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-share';
    modal.className = 'modal open';
    modal.innerHTML = `
      <div class="m-ov"></div>
      <div style="
        position:relative;z-index:1;background:var(--panel);
        border:1px solid var(--brd2);border-radius:16px;
        width:min(440px,95vw);box-shadow:0 24px 64px rgba(0,0,0,.8);
        overflow:hidden;
      ">
        <div style="padding:24px 24px 0;display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;font-size:16px;font-weight:800;">🔗 Compartir patrón</h3>
          <button id="share-close" style="
            background:var(--inp);border:1px solid var(--brd);color:var(--tx2);
            border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:16px;
          ">✕</button>
        </div>

        <div style="padding:20px 24px;display:flex;flex-direction:column;gap:12px;">

          <div style="font-size:12px;color:var(--tx2);">
            El link incluye la prenda y todas las medidas. Quien lo abra verá exactamente tu patrón.
          </div>

          <div style="display:flex;gap:8px;">
            <input id="share-url-input" readonly value="${url || ''}" style="
              flex:1;background:var(--inp);border:1.5px solid var(--brd);color:var(--tx3);
              border-radius:8px;padding:8px 12px;font-size:11px;
              font-family:var(--mono, monospace);outline:none;
            " />
            <button id="share-copy-btn" style="
              background:var(--acc);color:#fff;border:none;border-radius:8px;
              padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;
              font-family:var(--font);white-space:nowrap;
            ">Copiar</button>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button id="share-json-btn" style="
              flex:1;background:var(--inp);border:1.5px solid var(--brd);color:var(--tx2);
              border-radius:8px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;
              font-family:var(--font);
            ">⬇ Exportar JSON</button>
            <button id="share-import-btn" style="
              flex:1;background:var(--inp);border:1.5px solid var(--brd);color:var(--tx2);
              border-radius:8px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;
              font-family:var(--font);
            ">⬆ Importar JSON</button>
          </div>

          <div style="
            background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);
            border-radius:8px;padding:10px 14px;font-size:11px;color:var(--tx3);
          ">
            💡 También puedes guardar el patrón en tu cuenta para acceder desde cualquier dispositivo.
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('share-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.m-ov').addEventListener('click', () => modal.remove());

    document.getElementById('share-copy-btn').addEventListener('click', () => {
      const input = document.getElementById('share-url-input');
      input.select();
      navigator.clipboard?.writeText(input.value).then(() => {
        document.getElementById('share-copy-btn').textContent = '✅ Copiado';
        setTimeout(() => { document.getElementById('share-copy-btn').textContent = 'Copiar'; }, 2000);
      }).catch(() => {
        document.execCommand('copy');
      });
    });

    document.getElementById('share-json-btn').addEventListener('click', () => {
      exportJSON(garment, measures, params);
      modal.remove();
    });

    document.getElementById('share-import-btn').addEventListener('click', () => {
      importJSON((payload) => {
        modal.remove();
        document.dispatchEvent(new CustomEvent('pat:importPattern', { detail: payload }));
        if (PAT.App) PAT.App.toast('✅ Patrón importado', 'success');
      });
    });
  }

  return { encode, decode, getShareURL, loadFromURL, exportJSON, importJSON, showShareModal };
})();
