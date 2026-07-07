'use strict';
/**
 * atelier-ui.js
 * Modal "Mi Atelier": crear, gestionar miembros, invitar, expulsar,
 * regenerar código, y unirse con código.
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
#atl-box{
  position:relative;z-index:1;background:var(--panel,#faf7f2);
  border:1px solid var(--brd2,#c8bca8);border-radius:18px;
  width:min(500px,96vw);max-height:90vh;overflow:hidden;
  display:flex;flex-direction:column;
  box-shadow:0 28px 90px rgba(0,0,0,.35)
}
.atl-header{
  display:flex;align-items:center;gap:10px;
  padding:16px 20px;border-bottom:1px solid var(--brd,#ddd5c5);flex-shrink:0
}
.atl-header h2{flex:1;font-size:15px;font-weight:800;color:var(--tx,#2a2018);margin:0}
.atl-x{background:none;border:none;color:var(--tx3,#9a8a75);font-size:20px;
  cursor:pointer;padding:2px 8px;border-radius:6px}
.atl-x:hover{background:var(--inp,#f0ebe0);color:var(--tx,#2a2018)}
.atl-scroll{overflow-y:auto;flex:1;padding:18px 20px;display:flex;flex-direction:column;gap:14px}
.atl-card{
  background:var(--surface,#fff);border:1px solid var(--brd,#ddd5c5);
  border-radius:12px;padding:14px 16px
}
.atl-card-title{
  font-size:10px;font-weight:700;letter-spacing:.08em;
  color:var(--tx3,#9a8a75);text-transform:uppercase;margin-bottom:10px
}
/* Código de invitación */
.atl-code-row{display:flex;align-items:center;gap:10px}
.atl-code{
  font-family:monospace;font-size:22px;letter-spacing:4px;
  font-weight:800;color:var(--acc,#b86b2e);
  background:var(--inp,#f0ebe0);border-radius:8px;
  padding:8px 14px;flex:1;text-align:center;user-select:all
}
.atl-btn{
  padding:7px 14px;border-radius:8px;border:none;
  font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;
  font-family:var(--font,inherit)
}
.atl-btn.primary{background:var(--acc,#b86b2e);color:#fff}
.atl-btn.primary:hover{opacity:.88}
.atl-btn.ghost{
  background:none;border:1px solid var(--brd2,#c8bca8);
  color:var(--tx2,#6b5a45)
}
.atl-btn.ghost:hover{border-color:var(--acc,#b86b2e);color:var(--acc,#b86b2e)}
.atl-btn.danger{background:none;border:1px solid #f8717155;color:#b84040}
.atl-btn.danger:hover{background:#f8717118}
.atl-btn.sm{padding:4px 10px;font-size:10px}
.atl-link-row{
  margin-top:10px;display:flex;align-items:center;gap:8px;
  background:var(--inp,#f0ebe0);border-radius:8px;padding:6px 10px
}
.atl-link-url{
  flex:1;font-size:10px;color:var(--tx3,#9a8a75);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  font-family:monospace
}
/* Lista de miembros */
.atl-members{display:flex;flex-direction:column;gap:6px;margin-top:2px}
.atl-member{
  display:flex;align-items:center;gap:10px;
  padding:8px 10px;border-radius:8px;
  background:var(--bg2,#ede8de)
}
.atl-avatar{
  width:30px;height:30px;border-radius:50%;
  background:var(--acc,#b86b2e);color:#fff;
  display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:700;flex-shrink:0
}
.atl-member-info{flex:1;min-width:0}
.atl-member-email{font-size:12px;color:var(--tx,#2a2018);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.atl-member-role{font-size:10px;color:var(--tx3,#9a8a75);margin-top:1px}
/* Formularios */
.atl-input{
  width:100%;background:var(--inp,#f0ebe0);
  border:1px solid var(--brd,#ddd5c5);border-radius:8px;
  color:var(--tx,#2a2018);font-size:13px;padding:9px 10px;
  outline:none;box-sizing:border-box;font-family:var(--font,inherit)
}
.atl-input:focus{border-color:var(--acc,#b86b2e)}
.atl-row{display:flex;gap:8px}
.atl-msg{font-size:11px;margin-top:6px;display:none;border-radius:6px;padding:5px 9px}
.atl-err{color:#b84040;background:#f8717115}
.atl-ok{color:var(--ok,#5a8a65);background:#5a8a6515}
.atl-loading{text-align:center;color:var(--tx3,#9a8a75);font-size:12px;padding:12px}
</style>
<div id="atl-ov"></div>
<div id="atl-box">
  <div class="atl-header">
    <span style="font-size:20px">🏢</span>
    <h2 id="atl-title">Mi Atelier</h2>
    <button class="atl-x" id="atl-x">✕</button>
  </div>
  <div class="atl-scroll" id="atl-content">
    <div class="atl-loading">Cargando…</div>
  </div>
</div>`;
    document.body.appendChild(_modal);
    _modal.querySelector('#atl-x').onclick = close;
    _modal.querySelector('#atl-ov').onclick = close;
  }

  // ── Vista principal ───────────────────────────────────────────────
  async function _refrescar() {
    const content = document.getElementById('atl-content');
    content.innerHTML = '<div class="atl-loading">Cargando…</div>';

    let atelier = null;
    try { atelier = await PAT.Atelier.getMiAtelier(true); } catch (e) {}

    const titleEl = document.getElementById('atl-title');

    if (atelier) {
      titleEl.textContent = atelier.nombre || 'Mi Atelier';
      const uid = window.firebase?.auth?.()?.currentUser?.uid;
      const esDueño = atelier.ownerUid === uid;
      _renderAtelier(content, atelier, esDueño);
    } else {
      titleEl.textContent = 'Mi Atelier';
      _renderSinAtelier(content);
    }
  }

  // ── Vista: pertenece a un atelier ────────────────────────────────
  async function _renderAtelier(content, atelier, esDueño) {
    const inviteUrl = `${location.origin}${location.pathname}?unirse=${atelier.codigo}`;

    content.innerHTML = `
      ${esDueño ? `
      <!-- Nombre del atelier -->
      <div class="atl-card">
        <div class="atl-card-title">Nombre del atelier</div>
        <div class="atl-row">
          <input class="atl-input" id="atl-nombre-edit" value="${_esc(atelier.nombre)}" style="flex:1">
          <button class="atl-btn primary" id="atl-rename-btn">Guardar</button>
        </div>
        <div class="atl-msg atl-ok" id="atl-rename-ok">✓ Nombre actualizado</div>
      </div>` : ''}

      <!-- Código de invitación -->
      <div class="atl-card">
        <div class="atl-card-title">Código de invitación</div>
        <div class="atl-code-row">
          <div class="atl-code" id="atl-code-display">${_esc(atelier.codigo)}</div>
          <button class="atl-btn ghost" id="atl-copy-code" title="Copiar código">📋 Copiar</button>
        </div>
        <div class="atl-link-row">
          <span class="atl-link-url" id="atl-link-txt">${_esc(inviteUrl)}</span>
          <button class="atl-btn ghost sm" id="atl-copy-link">🔗 Copiar link</button>
        </div>
        ${esDueño ? `
        <div style="margin-top:10px;display:flex;gap:8px;align-items:center">
          <button class="atl-btn ghost sm" id="atl-regen" title="Genera un código nuevo e invalida el anterior">
            🔄 Regenerar código
          </button>
          <span style="font-size:10px;color:var(--tx3)">El código anterior dejará de funcionar</span>
        </div>` : ''}
        <div class="atl-msg atl-ok" id="atl-code-ok">✓ Código regenerado</div>
      </div>

      <!-- Miembros -->
      <div class="atl-card">
        <div class="atl-card-title" id="atl-members-title">Miembros (cargando…)</div>
        <div class="atl-members" id="atl-members-list">
          <div class="atl-loading">Cargando miembros…</div>
        </div>
      </div>

      <!-- Salir (no dueño) -->
      ${!esDueño ? `
      <div class="atl-card">
        <button class="atl-btn danger" id="atl-salir-btn" style="width:100%">
          Salir de este atelier
        </button>
        <div class="atl-msg atl-err" id="atl-salir-err"></div>
      </div>` : ''}
    `;

    // Copiar código
    document.getElementById('atl-copy-code').onclick = () => {
      navigator.clipboard?.writeText(atelier.codigo);
      _flash('atl-copy-code', '✓ Copiado');
    };

    // Copiar link
    document.getElementById('atl-copy-link').onclick = () => {
      navigator.clipboard?.writeText(inviteUrl);
      _flash('atl-copy-link', '✓ Copiado');
    };

    // Renombrar (solo dueño)
    if (esDueño) {
      document.getElementById('atl-rename-btn').onclick = async () => {
        const nombre = document.getElementById('atl-nombre-edit').value.trim();
        if (!nombre) return;
        try {
          await window.firebase.firestore()
            .collection('ateliers').doc(atelier.id)
            .update({ nombre });
          atelier.nombre = nombre;
          document.getElementById('atl-title').textContent = nombre;
          _showMsg('atl-rename-ok');
        } catch (e) { PAT.App?.toast('Error: ' + e.message, 'error'); }
      };

      // Regenerar código
      document.getElementById('atl-regen').onclick = async () => {
        if (!confirm('¿Regenerar el código? El código actual dejará de funcionar.')) return;
        try {
          const nuevo = await PAT.Atelier.regenerarCodigo();
          atelier.codigo = nuevo;
          document.getElementById('atl-code-display').textContent = nuevo;
          const nuevoUrl = `${location.origin}${location.pathname}?unirse=${nuevo}`;
          document.getElementById('atl-link-txt').textContent = nuevoUrl;
          _showMsg('atl-code-ok');
        } catch (e) { PAT.App?.toast('Error: ' + e.message, 'error'); }
      };
    }

    // Salir (no dueño)
    if (!esDueño) {
      document.getElementById('atl-salir-btn').onclick = async () => {
        if (!confirm('¿Salir de este atelier? Dejarás de ver sus materiales compartidos.')) return;
        try {
          await PAT.Atelier.salirDelAtelier();
          _refrescar();
        } catch (e) {
          const errEl = document.getElementById('atl-salir-err');
          errEl.textContent = '⚠ ' + e.message;
          errEl.style.display = 'block';
        }
      };
    }

    // Cargar lista de miembros (async)
    _cargarMiembros(atelier, esDueño);
  }

  async function _cargarMiembros(atelier, esDueño) {
    try {
      const miembros = await PAT.Atelier.listarEmpleados();
      const titleEl = document.getElementById('atl-members-title');
      const listEl  = document.getElementById('atl-members-list');
      if (!titleEl || !listEl) return;

      titleEl.textContent = `Miembros (${miembros.length})`;
      listEl.innerHTML = '';

      const uid = window.firebase?.auth?.()?.currentUser?.uid;

      miembros.forEach(m => {
        const inicial = (m.email || '?')[0].toUpperCase();
        const esSelf = m.uid === uid;
        const div = document.createElement('div');
        div.className = 'atl-member';
        div.innerHTML = `
          <div class="atl-avatar">${inicial}</div>
          <div class="atl-member-info">
            <div class="atl-member-email">${_esc(m.email)}</div>
            <div class="atl-member-role">${m.esOwner ? '👑 Dueño' : '👤 Miembro'}${esSelf ? ' · (tú)' : ''}</div>
          </div>
          ${esDueño && !m.esOwner ? `
            <button class="atl-btn danger sm" data-uid="${m.uid}">Expulsar</button>
          ` : ''}
        `;
        if (esDueño && !m.esOwner) {
          div.querySelector('button').onclick = async () => {
            if (!confirm(`¿Expulsar a ${m.email} del atelier?`)) return;
            try {
              await PAT.Atelier.expulsarEmpleado(m.uid);
              div.remove();
              const remaining = listEl.querySelectorAll('.atl-member').length;
              if (titleEl) titleEl.textContent = `Miembros (${remaining})`;
              PAT.App?.toast(`${m.email} expulsado`, 'info');
            } catch (e) { PAT.App?.toast('Error: ' + e.message, 'error'); }
          };
        }
        listEl.appendChild(div);
      });
    } catch (e) {
      const listEl = document.getElementById('atl-members-list');
      if (listEl) listEl.innerHTML = `<div style="font-size:11px;color:var(--err)">Error al cargar miembros</div>`;
    }
  }

  // ── Vista: sin atelier ──────────────────────────────────────────
  function _renderSinAtelier(content) {
    content.innerHTML = `
      <!-- Crear atelier -->
      <div class="atl-card">
        <div class="atl-card-title">Crear mi atelier</div>
        <p style="font-size:12px;color:var(--tx2);margin:0 0 10px">
          Crea un espacio de trabajo para tu equipo o tus alumnos.
          Comparte manuales, videos y material de clase con todos.
        </p>
        <div class="atl-row">
          <input class="atl-input" id="atl-new-nombre" placeholder="Nombre del taller / escuela" style="flex:1">
          <button class="atl-btn primary" id="atl-crear-btn">Crear</button>
        </div>
        <div class="atl-msg atl-err" id="atl-crear-err"></div>
      </div>

      <!-- Unirse con código -->
      <div class="atl-card">
        <div class="atl-card-title">Unirme a un atelier existente</div>
        <p style="font-size:12px;color:var(--tx2);margin:0 0 10px">
          El dueño del atelier te da un código de 7 caracteres o un link de invitación.
        </p>
        <div class="atl-row">
          <input class="atl-input" id="atl-join-codigo"
            placeholder="Código de 7 caracteres (ej: AB3CDEF)"
            style="flex:1;text-transform:uppercase;letter-spacing:2px">
          <button class="atl-btn ghost" id="atl-unir-btn">Unirme</button>
        </div>
        <div class="atl-msg atl-err" id="atl-unir-err"></div>
        <div class="atl-msg atl-ok"  id="atl-unir-ok">✓ ¡Te uniste correctamente!</div>
      </div>
    `;

    document.getElementById('atl-crear-btn').onclick = async () => {
      const nombre = document.getElementById('atl-new-nombre').value.trim();
      const errEl  = document.getElementById('atl-crear-err');
      errEl.style.display = 'none';
      try {
        await PAT.Atelier.crearAtelier(nombre);
        _refrescar();
      } catch (e) { errEl.textContent = '⚠ ' + e.message; errEl.style.display = 'block'; }
    };

    document.getElementById('atl-unir-btn').onclick = async () => {
      const codigo = document.getElementById('atl-join-codigo').value;
      const errEl  = document.getElementById('atl-unir-err');
      const okEl   = document.getElementById('atl-unir-ok');
      errEl.style.display = 'none'; okEl.style.display = 'none';
      try {
        await PAT.Atelier.unirseConCodigo(codigo);
        okEl.style.display = 'block';
        setTimeout(() => _refrescar(), 900);
      } catch (e) { errEl.textContent = '⚠ ' + e.message; errEl.style.display = 'block'; }
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────
  function _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _flash(btnId, txt) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = txt;
    setTimeout(() => { btn.textContent = orig; }, 1800);
  }

  function _showMsg(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 2500);
  }

  // ── Auto-unirse desde URL (?unirse=CODIGO) ────────────────────────
  function _checkUrlInvite() {
    const params = new URLSearchParams(location.search);
    const codigo = params.get('unirse');
    if (!codigo) return;
    // Limpiar la URL
    const clean = location.pathname + location.hash;
    history.replaceState(null, '', clean);
    // Abrir el modal con el código pre-rellenado
    open();
    // Esperar a que el DOM esté listo y rellenar el campo
    setTimeout(() => {
      const inp = document.getElementById('atl-join-codigo');
      if (inp) {
        inp.value = codigo.toUpperCase();
        inp.focus();
      }
    }, 300);
  }

  // Comprobar URL al cargar (si hay parámetro ?unirse=...)
  document.addEventListener('DOMContentLoaded', _checkUrlInvite);

  return { open, close };

})();
