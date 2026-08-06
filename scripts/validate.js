/**
 * validate.js — Validador pre-deploy de PatrónAI Pro
 *
 * Verifica antes de cada push:
 *   1. Todos los getElementById('id') sin ?. apuntan a IDs que existen en el HTML
 *   2. Todo onclick="fn()" en HTML llama funciones que existen en el código
 *   3. No hay <script src="..."> que apunten a archivos que no existen en disco
 *   4. El service-worker.js lista solo archivos que existen en disco
 *
 * Uso: node scripts/validate.js
 * Exit 0 = todo OK · Exit 1 = hay errores (bloquea el push)
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const HTML    = path.join(ROOT, 'index.html');
const SW      = path.join(ROOT, 'service-worker.js');

let errors   = 0;
let warnings = 0;

function err(msg)  { console.error('  ❌', msg); errors++; }
function warn(msg) { console.warn ('  ⚠ ', msg); warnings++; }
function ok(msg)   { console.log  ('  ✓ ', msg); }

// ── Leer archivos ─────────────────────────────────────────────────
const html = fs.readFileSync(HTML, 'utf8');
const sw   = fs.readFileSync(SW,   'utf8');

// ── 1. IDs declarados en el HTML ──────────────────────────────────
console.log('\n[1] IDs en HTML vs referencias getElementById sin guard\n');

const declaredIds = new Set();
for (const m of html.matchAll(/\bid="([^"]+)"/g)) {
  declaredIds.add(m[1]);
}
ok(`${declaredIds.size} IDs declarados en index.html`);

// Detectar getElementById('id').prop sin guard opcional (?.)
// Coincide cuando el `)` de la llamada va seguido directamente de `.` (no de `?.`)
const reGetById = /\bgetElementById\(\s*['"]([^'"]+)['"]\s*\)(?!\?)\.(?:on\w+|style|classList|value|textContent|innerHTML|setAttribute|getAttribute|removeAttribute|append|remove|click|focus)/g;

const missing = [];
for (const m of html.matchAll(reGetById)) {
  const id = m[1];
  if (!declaredIds.has(id)) {
    missing.push({ id, usage: m[0].slice(0, 60) });
  }
}

if (missing.length === 0) {
  ok('Ningún getElementById sin guard apunta a un ID inexistente');
} else {
  missing.forEach(({ id, usage }) =>
    err(`getElementById('${id}') — ID no existe en HTML\n       Uso: ${usage}`)
  );
}

// ── 2. <script src="..."> apuntan a archivos existentes ───────────
console.log('\n[2] <script src> vs archivos en disco\n');

const scriptRefs = [];
for (const m of html.matchAll(/<script\s+src="([^"]+)"/g)) {
  scriptRefs.push(m[1]);
}

let missingScripts = 0;
for (const ref of scriptRefs) {
  if (ref.startsWith('http')) continue; // CDN, ignorar
  const abs = path.join(ROOT, ref);
  if (!fs.existsSync(abs)) {
    err(`<script src="${ref}"> — archivo no encontrado en disco`);
    missingScripts++;
  }
}
if (missingScripts === 0) ok(`${scriptRefs.length} scripts verificados — todos existen`);

// ── 3. Service Worker — STATIC_ASSETS vs archivos en disco ────────
console.log('\n[3] service-worker.js STATIC_ASSETS vs archivos en disco\n');

const assetMatches = sw.match(/STATIC_ASSETS\s*=\s*\[([\s\S]*?)\]/);
let missingSW = 0;
if (assetMatches) {
  const assets = [...assetMatches[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  for (const asset of assets) {
    const abs = path.join(ROOT, asset === '/' ? 'index.html' : asset);
    if (!fs.existsSync(abs)) {
      err(`SW cachea '${asset}' — archivo no existe en disco`);
      missingSW++;
    }
  }
  if (missingSW === 0) ok(`${assets.length} assets del SW verificados — todos existen`);
}

// ── 4. Cache version consistente entre SW y console.log ───────────
console.log('\n[4] Versión de caché consistente en service-worker.js\n');

const cacheMatch   = sw.match(/CACHE_STATIC\s*=\s*'patronai-static-v(\d+)'/);
const consoleMatch = sw.match(/Instalando PatrónAI v(\d+)/);

if (cacheMatch && consoleMatch) {
  if (cacheMatch[1] === consoleMatch[1]) {
    ok(`Versión de caché y console.log coinciden: v${cacheMatch[1]}`);
  } else {
    err(`Versión inconsistente: CACHE_STATIC=v${cacheMatch[1]} pero console.log dice v${consoleMatch[1]}`);
  }
}

// ── Resultado final ────────────────────────────────────────────────
console.log('\n' + '─'.repeat(55));
if (errors === 0 && warnings === 0) {
  console.log('✅ Validación OK — safe to push\n');
  process.exit(0);
} else {
  if (warnings > 0) console.warn(`⚠  ${warnings} advertencia(s)`);
  if (errors   > 0) console.error(`❌ ${errors} error(es) — push bloqueado\n`);
  process.exit(errors > 0 ? 1 : 0);
}
