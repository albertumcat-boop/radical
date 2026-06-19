'use strict';
/**
 * atelier-ui.js
 * Modal "Mi Atelier": crear un atelier, ver/copiar el código para invitar
 * empleados, unirse a uno existente con un código, o salir.
 */

window.PAT = window.PAT || {};
PAT.AtelierUI = (function () {

  let _modal = null;

  function open() {
    if (!_modal) _build();
    _modal.classList.add('open');
    _refrescar();
  }
  function close() { _modal?.classList.remove('open'); }

  function _build() {
    _modal = document.createElement('div');
    _modal.id = 'atl-modal';
    _modal.innerHTML = `
<style>
#atl-modal{position:fixed;inset:0;z-index:975;display:none;align-items:center;justify-content:center}
#atl-modal.open{display:flex}
#atl-ov{position:absolute;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(5px)}
#atl-box{position:relative;z-index:1;background:#0e0e1a;border:1px solid #3d3d58;border-radius:18px;
  width:min(440px,94vw);max-height:90vh;overflow:auto;box-shadow:0 28px 90px rgba(0,0,0,.85);padding:22px}
.atl-title{font-size:15px;font-weight:800;color:#ede9fe;margin-bottom:4px}
.atl-sub{font-size:12px;color:#9490b0;margin-bottom:16px}
.atl-x{position:absolute;top:14px;right:16px;background:none;border:none;color:#5a5678;font-size:18px;cursor:pointer}
.atl-x:hover{color:#ede9fe}
.atl-section{border:1px solid #2e2e45;border-radius:12px;padding:14px;margin-bottom:12px}
.atl-label{font-size:11px;color:#9490b0;margin-bottom:6px}
.atl-code{font-family:monospace;font-size:20px;letter-spacing:3px;color:var(--gold,#c49830);font-weight:800}
.atl-input{width:100%;background:#141420;border:1px solid #2e2e45;border-radius:8px;color:#ede9fe;
  font-size:13px;padding:9px 10px;outline:none;margin-bottom:8px;box-sizing:border-box}
.atl-btn{background:#8b5cf6;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;
  padding:9px 14px;cursor:pointer}
.atl-btn:hover{background:#7c3aed}
.atl-btn.ghost{background:transparent;border:1px solid #3d3d58;color:#9490b0}
.atl-btn.ghost:hover{color:#ede9fe;border-color:#5a5678}
.atl-row{display:flex;gap:8px;align-items:center}
.atl-emp{font-size:12px;color:#9490b0;margin-top:6px}
.atl-err{font-size:11px;color:#f87171;margin-top:6px;display:none}
.atl-ok{font-size:11px;color:#34d399;margin-top:6px;display:none}
</style>
<div id="atl-ov"></div>
<div id="atl-box">
  <button class="atl-x" id="atl-x">✕</button>
  <div class="atl-title">🏢 Mi Atelier</div>
  <div class="atl-sub">Comparte manuales, videos y material de apoyo con tu equipo. Cada empleado sigue trazando sus propios patrones base.</div>
  <div id="atl-content"></div>
</div>`;
    document.body.appendChild(_modal);
    _modal.querySelector('#atl-x').onclick = close;
    _modal.querySelector('#atl-ov').onclick = close;
  }

  async function _refrescar() {
    const content = _modal.querySelector('#atl-content');
    content.innerHTML = `<div class="atl-sub">Cargando…</div>`;
    let atelier = null;
    try { atelier = await PAT.Atelier.getMiAtelier(true); } catch (e) {}

    if (atelier) {
      const uid = window.firebase?.auth?.()?.currentUser?.uid;
      const esDueño = atelier.ownerUid === uid;
      const n = (atelier.empleados || []).length;
      content.innerHTML = `
        <div class="atl-section">
          <div class="atl-label">NOMBRE</div>
          <div style="color:#ede9fe;font-weight:700;font-size:14px">${_esc(atelier.nombre)}</div>
          <div class="atl-emp">${n} empleado${n === 1 ? '' : 's'}</div>
        </div>
        <div class="atl-section">
          <div class="atl-label">CÓDIGO PARA INVITAR EMPLEADOS</div>
          <div class="atl-code">${_esc(atelier.codigo)}</div>
          <div class="atl-row" style="margin-top:10px">
            <button class="atl-btn ghost" id="atl-copy">📋 Copiar código</button>
          </div>
        </div>
        ${esDueño ? '' : `
        <div class="atl-section">
          <button class="atl-btn ghost" id="atl-salir" style="color:#f87171">Salir de este atelier</button>
        </div>`}
      `;
      content.querySelector('#atl-copy').onclick = () => {
        navigator.clipboard?.writeText(atelier.codigo);
        PAT.toast ? PAT.toast('Código copiado ✓', 'success') : null;
      };
      const salirBtn = content.querySelector('#atl-salir');
      if (salirBtn) salirBtn.onclick = async () => {
        if (!confirm('¿Salir de este atelier? Dejarás de ver sus materiales compartidos.')) return;
        try { await PAT.Atelier.salirDelAtelier(); _refrescar(); }
        catch (e) { alert(e.message); }
      };
      return;
    }

    // Sin atelier: ofrecer crear uno o unirse con código
    content.innerHTML = `
      <div class="atl-section">
        <div class="atl-label">CREAR MI ATELIER</div>
        <input class="atl-input" id="atl-nombre" placeholder="Nombre del taller">
        <button class="atl-btn" id="atl-crear">Crear atelier</button>
        <div class="atl-err" id="atl-err-crear"></div>
      </div>
      <div class="atl-section">
        <div class="atl-label">UNIRME A UN ATELIER EXISTENTE</div>
        <input class="atl-input" id="atl-codigo" placeholder="Código de 7 caracteres" style="text-transform:uppercase">
        <button class="atl-btn ghost" id="atl-unir">Unirme con código</button>
        <div class="atl-err" id="atl-err-unir"></div>
      </div>
    `;
    content.querySelector('#atl-crear').onclick = async () => {
      const nombre = content.querySelector('#atl-nombre').value;
      const err = content.querySelector('#atl-err-crear');
      err.style.display = 'none';
      try { await PAT.Atelier.crearAtelier(nombre); _refrescar(); }
      catch (e) { err.textContent = '⚠ ' + e.message; err.style.display = ''; }
    };
    content.querySelector('#atl-unir').onclick = async () => {
      const codigo = content.querySelector('#atl-codigo').value;
      const err = content.querySelector('#atl-err-unir');
      err.style.display = 'none';
      try { await PAT.Atelier.unirseConCodigo(codigo); _refrescar(); }
      catch (e) { err.textContent = '⚠ ' + e.message; err.style.display = ''; }
    };
  }

  function _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { open, close };

})();
