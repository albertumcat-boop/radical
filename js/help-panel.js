'use strict';
window.PAT = window.PAT || {};

PAT.HelpPanel = (function () {

  // ── Contenido del tutorial ────────────────────────────────────────────
  const TOPICS = [
    {
      id: 'generar',
      icon: '📐',
      title: 'Generar patrón',
      steps: [
        {
          title: 'Ingresa tus medidas',
          text: 'En el panel izquierdo completa las medidas: busto, cintura, cadera, talle de espalda y largo total. Abre los grupos desplegables para ver todas las medidas disponibles.',
          svg: `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="50" height="90" rx="4" fill="var(--inp)" stroke="var(--brd)" stroke-width="1"/>
            <rect x="4" y="8" width="42" height="6" rx="2" fill="var(--acc)" opacity=".4"/>
            <rect x="4" y="18" width="30" height="4" rx="1" fill="var(--brd2)"/>
            <rect x="4" y="26" width="42" height="5" rx="1" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="6" y="30" font-size="3.5" fill="var(--tx2)" font-family="Arial">88</text>
            <rect x="4" y="35" width="42" height="5" rx="1" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="6" y="39" font-size="3.5" fill="var(--tx2)" font-family="Arial">68</text>
            <rect x="4" y="44" width="42" height="5" rx="1" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="6" y="48" font-size="3.5" fill="var(--tx2)" font-family="Arial">94</text>
            <rect x="4" y="57" width="42" height="6" rx="2" fill="var(--brd)" opacity=".5"/>
            <text x="13" y="61.5" font-size="3.5" fill="var(--tx)" font-family="Arial">Largos ▸</text>
            <text x="58" y="18" font-size="6" fill="var(--acc)" font-family="Arial">←</text>
            <text x="70" y="18" font-size="4" fill="var(--tx2)" font-family="Arial">Busto (cm)</text>
            <text x="58" y="38" font-size="6" fill="var(--acc)" font-family="Arial">←</text>
            <text x="70" y="38" font-size="4" fill="var(--tx2)" font-family="Arial">Cintura (cm)</text>
            <text x="58" y="49" font-size="6" fill="var(--acc)" font-family="Arial">←</text>
            <text x="70" y="49" font-size="4" fill="var(--tx2)" font-family="Arial">Cadera (cm)</text>
          </svg>`
        },
        {
          title: 'Selecciona la prenda',
          text: 'En el selector de prendas (arriba del canvas) elige el tipo: Franela, Blusa, Camisa, Falda, Vestido, Pantalón, etc. La lista muestra solo las prendas disponibles para tu plan.',
          svg: `<svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="8" width="156" height="22" rx="4" fill="var(--inp)" stroke="var(--brd)" stroke-width="1"/>
            <rect x="6" y="12" width="28" height="14" rx="3" fill="var(--acc)" opacity=".15" stroke="var(--acc)" stroke-width=".8"/>
            <text x="9" y="21" font-size="4.5" fill="var(--acc)" font-family="Arial">Franela</text>
            <rect x="38" y="12" width="24" height="14" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="41" y="21" font-size="4.5" fill="var(--tx2)" font-family="Arial">Blusa</text>
            <rect x="66" y="12" width="26" height="14" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="68" y="21" font-size="4.5" fill="var(--tx2)" font-family="Arial">Camisa</text>
            <rect x="96" y="12" width="22" height="14" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="99" y="21" font-size="4.5" fill="var(--tx2)" font-family="Arial">Falda</text>
            <rect x="122" y="12" width="32" height="14" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="124" y="21" font-size="4.5" fill="var(--tx2)" font-family="Arial">Vestido</text>
            <path d="M20 34 L20 46" stroke="var(--acc)" stroke-width="1.2" stroke-dasharray="2,2"/>
            <circle cx="20" cy="48" r="3" fill="var(--acc)" opacity=".6"/>
            <text x="26" y="46" font-size="4" fill="var(--tx2)" font-family="Arial">Haz clic aquí para seleccionar</text>
          </svg>`
        },
        {
          title: 'Ajusta los parámetros',
          text: 'En el panel "Parámetros" (sidebar, abajo) ajusta: facilidad de movimiento, margen de costura en mm, y género (dama/caballero). Estos valores afectan el trazado de todas las piezas.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="56" height="80" rx="4" fill="var(--inp)" stroke="var(--brd)" stroke-width="1"/>
            <rect x="4" y="6" width="48" height="8" rx="2" fill="var(--brd)" opacity=".5"/>
            <text x="10" y="12" font-size="4" fill="var(--tx)" font-family="Arial">Parámetros ▾</text>
            <text x="4" y="26" font-size="3.5" fill="var(--tx2)" font-family="Arial">Facilidad (cm)</text>
            <rect x="4" y="28" width="48" height="5" rx="1" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="6" y="32" font-size="3.5" fill="var(--tx2)" font-family="Arial">4</text>
            <text x="4" y="42" font-size="3.5" fill="var(--tx2)" font-family="Arial">Costura (mm)</text>
            <rect x="4" y="44" width="48" height="5" rx="1" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="6" y="48" font-size="3.5" fill="var(--tx2)" font-family="Arial">10</text>
            <text x="4" y="60" font-size="3.5" fill="var(--tx2)" font-family="Arial">Género</text>
            <rect x="4" y="62" width="22" height="6" rx="2" fill="var(--acc)" opacity=".8"/>
            <text x="7" y="67" font-size="3.5" fill="white" font-family="Arial">Dama</text>
            <rect x="28" y="62" width="24" height="6" rx="2" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="30" y="67" font-size="3.5" fill="var(--tx2)" font-family="Arial">Caballero</text>
          </svg>`
        },
        {
          title: 'Haz clic en "Generar"',
          text: 'El botón "⚡ Generar" (o presiona Enter) calcula todas las piezas del patrón con tus medidas. Las piezas aparecen en el canvas: espalda, frente, mangas, cuellos y complementos según la prenda.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="4" width="60" height="16" rx="5" fill="var(--acc)"/>
            <text x="37" y="15" font-size="5.5" fill="white" font-family="Arial" font-weight="bold">⚡ Generar</text>
            <path d="M30 26 L10 46 L40 46" stroke="var(--brd2)" stroke-width="1" fill="none"/>
            <path d="M40 46 L40 74 L90 74 L90 46 Z" stroke="var(--brd2)" stroke-width="1" fill="none"/>
            <path d="M90 46 L120 46 L120 74 L90 74" stroke="var(--brd2)" stroke-width="1" fill="none" stroke-dasharray="3,2"/>
            <text x="50" y="62" font-size="4" fill="var(--tx3)" font-family="Arial">Espalda</text>
            <text x="92" y="62" font-size="4" fill="var(--tx3)" font-family="Arial">Frente</text>
            <path d="M60 26 L60 28" stroke="var(--acc)" stroke-width="2" marker-end="url(#arr)"/>
          </svg>`
        }
      ]
    },
    {
      id: 'editor',
      icon: '✏️',
      title: 'Editor de trazado',
      steps: [
        {
          title: 'Abre el editor',
          text: 'Haz clic en "✏ Trazar" en la barra superior para abrir el editor de trazado libre. Es un canvas oscuro con grilla milimétrica. Ciérralo con la X o volviendo a hacer clic.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="160" height="22" rx="0" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <rect x="50" y="4" width="36" height="14" rx="3" fill="#1c1c2a" stroke="#3d3d58" stroke-width=".8"/>
            <text x="54" y="13.5" font-size="5" fill="#ede9fe" font-family="Arial">✏ Trazar</text>
            <rect x="2" y="26" width="156" height="40" rx="3" fill="#0d0d18" stroke="#2a2a3d" stroke-width="1"/>
            <line x1="2" y1="34" x2="158" y2="34" stroke="#1e1e2e" stroke-width=".4"/>
            <line x1="2" y1="42" x2="158" y2="42" stroke="#1e1e2e" stroke-width=".4"/>
            <line x1="2" y1="50" x2="158" y2="50" stroke="#1e1e2e" stroke-width=".4"/>
            <line x1="2" y1="58" x2="158" y2="58" stroke="#1e1e2e" stroke-width=".4"/>
            <line x1="30" y1="26" x2="30" y2="66" stroke="#1e1e2e" stroke-width=".4"/>
            <line x1="60" y1="26" x2="60" y2="66" stroke="#1e1e2e" stroke-width=".4"/>
            <line x1="90" y1="26" x2="90" y2="66" stroke="#1e1e2e" stroke-width=".4"/>
            <line x1="120" y1="26" x2="120" y2="66" stroke="#1e1e2e" stroke-width=".4"/>
            <text x="100" y="50" font-size="4" fill="#3d3d58" font-family="Arial">Canvas de trazado</text>
          </svg>`
        },
        {
          title: 'Coloca puntos',
          text: 'Haz clic en el canvas para crear un punto. Aparece una pequeña etiqueta (A, B, C...) que puedes renombrar. Arrastra un punto existente para moverlo.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="160" height="80" rx="3" fill="#0d0d18"/>
            <line x1="0" y1="20" x2="160" y2="20" stroke="#1e1e2e" stroke-width=".5"/>
            <line x1="0" y1="40" x2="160" y2="40" stroke="#1e1e2e" stroke-width=".5"/>
            <line x1="0" y1="60" x2="160" y2="60" stroke="#1e1e2e" stroke-width=".5"/>
            <line x1="40" y1="0" x2="40" y2="80" stroke="#1e1e2e" stroke-width=".5"/>
            <line x1="80" y1="0" x2="80" y2="80" stroke="#1e1e2e" stroke-width=".5"/>
            <line x1="120" y1="0" x2="120" y2="80" stroke="#1e1e2e" stroke-width=".5"/>
            <circle cx="40" cy="20" r="4" fill="#8b5cf6"/>
            <text x="45" y="18" font-size="5" fill="#ede9fe" font-family="monospace">A</text>
            <circle cx="120" cy="20" r="4" fill="#8b5cf6"/>
            <text x="125" y="18" font-size="5" fill="#ede9fe" font-family="monospace">B</text>
            <circle cx="120" cy="60" r="4" fill="#8b5cf6"/>
            <text x="125" y="58" font-size="5" fill="#ede9fe" font-family="monospace">C</text>
            <circle cx="40" cy="60" r="4" fill="#8b5cf6"/>
            <text x="45" y="58" font-size="5" fill="#ede9fe" font-family="monospace">D</text>
            <text x="60" y="75" font-size="4" fill="#5a5a7a" font-family="Arial">Clic para crear · Arrastrar para mover</text>
          </svg>`
        },
        {
          title: 'Conecta con líneas',
          text: 'Selecciona un punto de inicio, luego Shift+clic en otro punto para conectarlos con una línea recta. En la barra de herramientas elige "Línea" o "Curva" antes de conectar.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="160" height="80" rx="3" fill="#0d0d18"/>
            <circle cx="30" cy="20" r="4" fill="#8b5cf6"/>
            <text x="36" y="18" font-size="5" fill="#ede9fe" font-family="monospace">A</text>
            <circle cx="130" cy="20" r="4" fill="#8b5cf6"/>
            <text x="136" y="18" font-size="5" fill="#ede9fe" font-family="monospace">B</text>
            <circle cx="130" cy="65" r="4" fill="#a78bfa" stroke="#8b5cf6" stroke-width="1.5"/>
            <text x="136" y="63" font-size="5" fill="#ede9fe" font-family="monospace">C</text>
            <circle cx="30" cy="65" r="4" fill="#8b5cf6"/>
            <text x="36" y="63" font-size="5" fill="#ede9fe" font-family="monospace">D</text>
            <line x1="30" y1="20" x2="130" y2="20" stroke="#8b5cf6" stroke-width="1.5"/>
            <line x1="130" y1="20" x2="130" y2="65" stroke="#8b5cf6" stroke-width="1.5"/>
            <line x1="130" y1="65" x2="30" y2="65" stroke="#8b5cf6" stroke-width="1.5"/>
            <line x1="30" y1="65" x2="30" y2="20" stroke="#f87171" stroke-width="1" stroke-dasharray="4,2"/>
            <text x="3" y="45" font-size="3.5" fill="#f87171" font-family="Arial" transform="rotate(-90,3,45)">doblez</text>
            <text x="55" y="76" font-size="4" fill="#5a5a7a" font-family="Arial">Shift+clic en punto destino</text>
          </svg>`
        },
        {
          title: 'Curvas Bézier',
          text: 'Con la herramienta "Curva" activa, conecta dos puntos. Aparece un punto de control (rojo) en el medio de la línea. Arrástralo para cambiar la curvatura en cualquier dirección.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="160" height="80" rx="3" fill="#0d0d18"/>
            <circle cx="20" cy="60" r="4" fill="#8b5cf6"/>
            <text x="26" y="58" font-size="5" fill="#ede9fe" font-family="monospace">A</text>
            <circle cx="140" cy="60" r="4" fill="#8b5cf6"/>
            <text x="118" y="58" font-size="5" fill="#ede9fe" font-family="monospace">B</text>
            <path d="M20 60 Q80 10 140 60" stroke="#8b5cf6" stroke-width="1.5" fill="none"/>
            <circle cx="80" cy="10" r="5" fill="#f87171" opacity=".9"/>
            <line x1="20" y1="60" x2="80" y2="10" stroke="#f87171" stroke-width=".8" stroke-dasharray="3,2" opacity=".6"/>
            <line x1="140" y1="60" x2="80" y2="10" stroke="#f87171" stroke-width=".8" stroke-dasharray="3,2" opacity=".6"/>
            <text x="84" y="13" font-size="4" fill="#f87171" font-family="Arial">control</text>
            <text x="24" y="76" font-size="4" fill="#5a5a7a" font-family="Arial">Arrastra el punto rojo para ajustar la curva</text>
          </svg>`
        },
        {
          title: 'Snap y alineación',
          text: 'Activa "⊞ Snap" en la barra de herramientas. Al mover un punto, se alinea automáticamente a la grilla de 5mm o a la misma posición X o Y que otro punto cercano. Las guías azules aparecen cuando hay alineación.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="160" height="80" rx="3" fill="#0d0d18"/>
            <line x1="0" y1="40" x2="160" y2="40" stroke="#3a6ea8" stroke-width=".8" opacity=".7" stroke-dasharray="4,2"/>
            <line x1="80" y1="0" x2="80" y2="80" stroke="#3a6ea8" stroke-width=".8" opacity=".7" stroke-dasharray="4,2"/>
            <circle cx="30" cy="40" r="4" fill="#8b5cf6"/>
            <circle cx="80" cy="40" r="5" fill="#60a5fa" stroke="white" stroke-width="1"/>
            <text x="86" y="38" font-size="4" fill="#60a5fa" font-family="Arial">↔ misma Y</text>
            <text x="30" y="75" font-size="4" fill="#5a5a7a" font-family="Arial">Las guías azules indican alineación activa</text>
          </svg>`
        },
        {
          title: 'Deshacer y guardar',
          text: 'Ctrl+Z deshace el último paso (hasta 60 pasos). Ctrl+Y rehace. Cuando termines una pieza haz clic en "💾 Guardar pieza" — le asignas un nombre y queda en tu lista de patrones guardados.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="36" height="14" rx="3" fill="#1c1c2a" stroke="#3d3d58" stroke-width=".8"/>
            <text x="8" y="13.5" font-size="4.5" fill="#ede9fe" font-family="Arial">⟲ Ctrl+Z</text>
            <rect x="44" y="4" width="36" height="14" rx="3" fill="#1c1c2a" stroke="#3d3d58" stroke-width=".8"/>
            <text x="48" y="13.5" font-size="4.5" fill="#ede9fe" font-family="Arial">⟳ Ctrl+Y</text>
            <rect x="84" y="4" width="72" height="14" rx="3" fill="#7c3aed" opacity=".8"/>
            <text x="88" y="13.5" font-size="4.5" fill="white" font-family="Arial">💾 Guardar pieza</text>
            <rect x="4" y="28" width="152" height="36" rx="3" fill="#12121f" stroke="#2a2a3d" stroke-width=".8"/>
            <text x="10" y="40" font-size="4" fill="#6b6890" font-family="Arial">Guardados</text>
            <rect x="8" y="44" width="70" height="8" rx="2" fill="#1e1e2e"/>
            <text x="12" y="50" font-size="3.5" fill="#ede9fe" font-family="Arial">Delantero blusa 88cm</text>
            <rect x="8" y="55" width="60" height="8" rx="2" fill="#1e1e2e"/>
            <text x="12" y="61" font-size="3.5" fill="#ede9fe" font-family="Arial">Espalda dama</text>
          </svg>`
        }
      ]
    },
    {
      id: 'imagen',
      icon: '🖼️',
      title: 'Trazar sobre imagen',
      steps: [
        {
          title: 'Abre el panel de imagen',
          text: 'En el editor ✏ Trazar, haz clic en "🖼️ Imagen" en la barra de herramientas. Se abre un panel lateral con tu biblioteca y el botón para subir una foto nueva.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="160" height="18" rx="2" fill="#12121f" stroke="#2a2a3d" stroke-width=".5"/>
            <rect x="4" y="3" width="20" height="12" rx="2" fill="#1c1c2a" stroke="#3d3d58" stroke-width=".6"/>
            <text x="5.5" y="11" font-size="4" fill="#9490b0" font-family="Arial">✏ Trazar</text>
            <rect x="28" y="3" width="28" height="12" rx="2" fill="#7c3aed" opacity=".8" stroke="#8b5cf6" stroke-width=".6"/>
            <text x="30" y="11" font-size="4.5" fill="white" font-family="Arial">🖼️ Imagen</text>
            <rect x="100" y="20" width="56" height="48" rx="3" fill="#12121f" stroke="#3d3d58" stroke-width="1"/>
            <text x="104" y="32" font-size="3.5" fill="#9490b0" font-family="Arial">Biblioteca</text>
            <rect x="104" y="36" width="48" height="8" rx="2" fill="#7c3aed" opacity=".6"/>
            <text x="108" y="42" font-size="3.5" fill="white" font-family="Arial">⬆ Subir imagen</text>
            <rect x="104" y="48" width="20" height="14" rx="2" fill="#1e1e2e"/>
            <rect x="127" y="48" width="20" height="14" rx="2" fill="#1e1e2e"/>
            <text x="107" y="58" font-size="3" fill="#6b6890" font-family="Arial">foto1.jpg</text>
            <path d="M85 32 L100 32" stroke="#8b5cf6" stroke-width="1" stroke-dasharray="2,2"/>
          </svg>`
        },
        {
          title: 'Sube tu imagen de referencia',
          text: 'Haz clic en "⬆ Subir imagen" y selecciona una foto desde tu dispositivo. Puede ser una prenda existente, un patrón impreso, una foto de revista o cualquier referencia visual que quieras trazar.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="4" width="120" height="50" rx="4" fill="#12121f" stroke="#3d3d58" stroke-width="1" stroke-dasharray="4,2"/>
            <text x="65" y="25" font-size="10" fill="#3d3d58" font-family="Arial" text-anchor="middle">🖼️</text>
            <text x="80" y="38" font-size="4" fill="#6b6890" font-family="Arial" text-anchor="middle">Arrastra o haz clic</text>
            <text x="80" y="46" font-size="3.5" fill="#4a4a6a" font-family="Arial" text-anchor="middle">JPG, PNG, WEBP</text>
            <text x="18" y="68" font-size="4" fill="#5a8a65" font-family="Arial">✓ Se guarda en tu biblioteca automáticamente</text>
          </svg>`
        },
        {
          title: 'Calibra la escala',
          text: 'En el campo "Ancho real (cm)" ingresa el ancho real de la prenda o referencia en cm. Esto permite que cuando traces encima, las distancias entre puntos sean correctas en la realidad.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="90" height="60" rx="3" fill="#1a1a2e" stroke="#3d3d58" stroke-width="1" opacity=".6"/>
            <path d="M20 20 L40 20 L40 60 L20 60 Z" fill="none" stroke="#6b6890" stroke-width=".8" stroke-dasharray="2,2"/>
            <line x1="20" y1="70" x2="40" y2="70" stroke="#60a5fa" stroke-width="1"/>
            <line x1="20" y1="67" x2="20" y2="73" stroke="#60a5fa" stroke-width="1"/>
            <line x1="40" y1="67" x2="40" y2="73" stroke="#60a5fa" stroke-width="1"/>
            <text x="23" y="78" font-size="3.5" fill="#60a5fa" font-family="Arial">= 40 cm</text>
            <rect x="108" y="20" width="42" height="14" rx="2" fill="#12121f" stroke="#3d3d58" stroke-width=".8"/>
            <text x="112" y="25" font-size="3.5" fill="#9490b0" font-family="Arial">Ancho real (cm)</text>
            <rect x="112" y="28" width="34" height="6" rx="1" fill="#0d0d18" stroke="#5a5a7a" stroke-width=".5"/>
            <text x="115" y="33" font-size="4" fill="#ede9fe" font-family="Arial">40</text>
          </svg>`
        },
        {
          title: 'Ajusta la opacidad y traza',
          text: 'Mueve el slider de opacidad para ver la imagen más o menos transparente. Luego coloca puntos directamente sobre las líneas de la referencia. La imagen se mueve con el zoom y el pan del canvas.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="160" height="80" rx="3" fill="#0d0d18"/>
            <image href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'><path d='M5 5 L55 5 L55 55 L5 55 Z' fill='none' stroke='%23888' stroke-width='2'/></svg>" x="20" y="10" width="120" height="60" opacity=".35"/>
            <path d="M30 15 L130 15 L130 65 L30 65 Z" fill="none" stroke="#6b6890" stroke-width=".8" opacity=".35"/>
            <circle cx="30" cy="15" r="3.5" fill="#8b5cf6"/>
            <circle cx="130" cy="15" r="3.5" fill="#8b5cf6"/>
            <circle cx="130" cy="65" r="3.5" fill="#8b5cf6"/>
            <line x1="30" y1="15" x2="130" y2="15" stroke="#8b5cf6" stroke-width="1.5"/>
            <line x1="130" y1="15" x2="130" y2="65" stroke="#8b5cf6" stroke-width="1.5"/>
            <text x="8" y="77" font-size="3.5" fill="#5a5a7a" font-family="Arial">Imagen al 35% de opacidad · trazo encima</text>
          </svg>`
        }
      ]
    },
    {
      id: 'pdf',
      icon: '📄',
      title: 'Exportar PDF',
      steps: [
        {
          title: 'Genera el patrón primero',
          text: 'Para exportar, debe haber un patrón en el canvas. Si acabo de abrir la app, selecciona una prenda y haz clic en "⚡ Generar". El PDF exporta exactamente lo que ves en pantalla.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="8" width="140" height="54" rx="4" fill="var(--bg2)" stroke="var(--brd)" stroke-width="1"/>
            <path d="M30 20 L50 20 L50 55 L30 55 Z" fill="none" stroke="var(--tx3)" stroke-width="1"/>
            <path d="M65 20 L85 20 L85 55 L65 55 Z" fill="none" stroke="var(--tx3)" stroke-width="1"/>
            <path d="M100 20 L110 20 L110 55 L100 55 Z" fill="none" stroke="var(--tx3)" stroke-width="1"/>
            <path d="M115 20 L130 20 L130 55 L115 55 Z" fill="none" stroke="var(--tx3)" stroke-width="1"/>
            <text x="32" y="40" font-size="4" fill="var(--tx3)" font-family="Arial">Espalda</text>
            <text x="67" y="40" font-size="4" fill="var(--tx3)" font-family="Arial">Frente</text>
          </svg>`
        },
        {
          title: 'Abre el menú Archivo',
          text: 'Haz clic en "📁 Archivo" en la sección "Acciones" del sidebar. Se despliega un menú con opciones: Guardar, Cargar, PDF y Compartir.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="4" width="90" height="14" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width=".8"/>
            <text x="20" y="14" font-size="5" fill="var(--tx)" font-family="Arial">📁 Archivo ▾</text>
            <rect x="10" y="22" width="90" height="54" rx="3" fill="var(--surface)" stroke="var(--brd)" stroke-width=".8"/>
            <rect x="14" y="26" width="82" height="10" rx="2" fill="var(--inp)"/>
            <text x="18" y="33" font-size="4.5" fill="var(--tx2)" font-family="Arial">💾 Guardar patrón</text>
            <rect x="14" y="39" width="82" height="10" rx="2" fill="var(--inp)"/>
            <text x="18" y="46" font-size="4.5" fill="var(--tx2)" font-family="Arial">📂 Cargar patrón</text>
            <rect x="14" y="52" width="82" height="10" rx="2" fill="var(--acc)" opacity=".2" stroke="var(--acc)" stroke-width=".6"/>
            <text x="18" y="59" font-size="4.5" fill="var(--acc)" font-family="Arial">📄 Exportar PDF →</text>
            <rect x="14" y="65" width="82" height="8" rx="2" fill="var(--inp)"/>
            <text x="18" y="71" font-size="4.5" fill="var(--tx2)" font-family="Arial">🔗 Compartir</text>
          </svg>`
        },
        {
          title: 'Selecciona tamaño de papel',
          text: 'En el modal de exportación, elige el tamaño de papel: Carta (216×279mm) o A4 (210×297mm). Las piezas grandes se dividen en varias hojas con marcas de solapamiento de 10mm para ensamblar.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="4" width="140" height="72" rx="5" fill="var(--surface)" stroke="var(--brd)" stroke-width="1"/>
            <text x="55" y="16" font-size="5" fill="var(--tx)" font-family="Arial" font-weight="bold">Exportar PDF</text>
            <rect x="18" y="22" width="56" height="28" rx="3" fill="var(--acc)" opacity=".15" stroke="var(--acc)" stroke-width="1"/>
            <text x="32" y="33" font-size="4.5" fill="var(--tx)" font-family="Arial">Carta</text>
            <text x="22" y="42" font-size="3.5" fill="var(--tx3)" font-family="Arial">216 × 279 mm</text>
            <rect x="86" y="22" width="56" height="28" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width=".8"/>
            <text x="104" y="33" font-size="4.5" fill="var(--tx)" font-family="Arial">A4</text>
            <text x="90" y="42" font-size="3.5" fill="var(--tx3)" font-family="Arial">210 × 297 mm</text>
            <rect x="45" y="58" width="70" height="12" rx="3" fill="var(--acc)"/>
            <text x="57" y="66.5" font-size="5" fill="white" font-family="Arial">Descargar PDF</text>
          </svg>`
        },
        {
          title: 'Imprime y ensambla',
          text: 'Imprime todas las páginas al 100% (sin ajuste de escala). Cada hoja tiene una marca de referencia. Recorta el margen de solapamiento y pega las hojas siguiendo las marcas para armar el patrón completo.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="60" height="72" rx="2" fill="white" stroke="#ccc" stroke-width="1"/>
            <rect x="74" y="4" width="60" height="72" rx="2" fill="white" stroke="#ccc" stroke-width="1"/>
            <line x1="64" y1="4" x2="64" y2="76" stroke="var(--acc)" stroke-width=".8" stroke-dasharray="3,2"/>
            <path d="M10 10 L58 10 L58 50 L10 50" fill="none" stroke="var(--tx3)" stroke-width=".8"/>
            <path d="M80 20 L128 20 L128 70 L80 70" fill="none" stroke="var(--tx3)" stroke-width=".8"/>
            <rect x="56" y="8" width="8" height="4" rx="1" fill="var(--acc)" opacity=".4"/>
            <rect x="74" y="8" width="8" height="4" rx="1" fill="var(--acc)" opacity=".4"/>
            <text x="55" y="80" font-size="3.5" fill="var(--tx3)" font-family="Arial" text-anchor="middle">Hoja 1</text>
            <text x="104" y="80" font-size="3.5" fill="var(--tx3)" font-family="Arial" text-anchor="middle">Hoja 2</text>
            <text x="58" y="80" font-size="5" fill="var(--acc)" text-anchor="middle">+</text>
          </svg>`
        }
      ]
    },
    {
      id: 'medidas',
      icon: '📏',
      title: 'Perfiles de medidas',
      steps: [
        {
          title: 'Accede a los perfiles',
          text: 'En el sidebar, busca la sección "Perfil de medidas" (arriba del todo). Haz clic en "＋ Nuevo perfil" para crear uno. Con cuenta iniciada, los perfiles se guardan en la nube.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="60" height="70" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width="1"/>
            <rect x="4" y="5" width="52" height="10" rx="2" fill="var(--acc)" opacity=".2" stroke="var(--acc)" stroke-width=".6"/>
            <text x="8" y="12" font-size="4" fill="var(--acc)" font-family="Arial">👤 Perfil de medidas</text>
            <rect x="4" y="19" width="52" height="8" rx="2" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="8" y="25" font-size="3.5" fill="var(--tx2)" font-family="Arial">▾ María García</text>
            <rect x="4" y="30" width="52" height="7" rx="2" fill="var(--surface)"/>
            <text x="8" y="36" font-size="3.5" fill="var(--tx3)" font-family="Arial">Laura Pérez</text>
            <rect x="4" y="40" width="52" height="7" rx="2" fill="var(--surface)"/>
            <text x="8" y="46" font-size="3.5" fill="var(--tx3)" font-family="Arial">Cliente nueva</text>
            <rect x="4" y="55" width="52" height="8" rx="3" fill="var(--acc)" opacity=".7"/>
            <text x="12" y="61" font-size="4" fill="white" font-family="Arial">＋ Nuevo perfil</text>
          </svg>`
        },
        {
          title: 'Crea y nombra el perfil',
          text: 'Escribe el nombre del cliente o la persona. Luego ingresa todas sus medidas en los campos del sidebar. Puedes guardar tantos perfiles como necesites.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="4" width="120" height="62" rx="5" fill="var(--surface)" stroke="var(--brd)" stroke-width="1"/>
            <text x="55" y="16" font-size="5" fill="var(--tx)" font-family="Arial">Nuevo perfil</text>
            <text x="24" y="28" font-size="3.5" fill="var(--tx2)" font-family="Arial">Nombre</text>
            <rect x="24" y="30" width="112" height="8" rx="2" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="28" y="36.5" font-size="4" fill="var(--tx)" font-family="Arial">Ana Rodríguez</text>
            <rect x="24" y="50" width="50" height="10" rx="3" fill="var(--brd)" opacity=".5"/>
            <text x="32" y="57" font-size="4" fill="var(--tx2)" font-family="Arial">Cancelar</text>
            <rect x="86" y="50" width="50" height="10" rx="3" fill="var(--acc)"/>
            <text x="95" y="57" font-size="4" fill="white" font-family="Arial">Guardar</text>
          </svg>`
        },
        {
          title: 'Carga las medidas de un cliente',
          text: 'Selecciona un perfil guardado del desplegable. Sus medidas se cargan automáticamente en todos los campos del sidebar. El patrón se actualiza al hacer clic en "⚡ Generar".',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="56" height="70" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width="1"/>
            <rect x="4" y="5" width="48" height="8" rx="2" fill="var(--inp)" stroke="var(--acc)" stroke-width="1"/>
            <text x="6" y="11" font-size="4" fill="var(--acc)" font-family="Arial">▾ Ana Rodríguez</text>
            <text x="4" y="24" font-size="3.5" fill="var(--tx3)" font-family="Arial">Busto</text>
            <rect x="4" y="26" width="48" height="5" rx="1" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="6" y="30" font-size="3.5" fill="var(--tx)" font-family="Arial">92</text>
            <text x="4" y="38" font-size="3.5" fill="var(--tx3)" font-family="Arial">Cintura</text>
            <rect x="4" y="40" width="48" height="5" rx="1" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="6" y="44" font-size="3.5" fill="var(--tx)" font-family="Arial">72</text>
            <text x="4" y="56" font-size="3.5" fill="var(--tx3)" font-family="Arial">Cadera</text>
            <rect x="4" y="58" width="48" height="5" rx="1" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="6" y="62" font-size="3.5" fill="var(--tx)" font-family="Arial">98</text>
            <text x="70" y="20" font-size="5" fill="var(--ok)" font-family="Arial">✓ Medidas</text>
            <text x="70" y="30" font-size="4" fill="var(--tx3)" font-family="Arial">cargadas</text>
            <text x="70" y="40" font-size="4" fill="var(--tx3)" font-family="Arial">automáticamente</text>
          </svg>`
        }
      ]
    },
    {
      id: 'gradacion',
      icon: '📊',
      title: 'Gradación de tallas',
      steps: [
        {
          title: 'Genera el patrón base',
          text: 'Primero genera un patrón con las medidas de la talla base. La gradación toma ese patrón como punto de partida y lo escala a una talla diferente.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 15 L80 15 L80 60 L30 60 Z" fill="none" stroke="var(--acc)" stroke-width="1.5"/>
            <path d="M22 10 L90 10 L90 68 L22 68 Z" fill="none" stroke="var(--acc)" stroke-width=".8" opacity=".4" stroke-dasharray="3,2"/>
            <path d="M14 5 L100 5 L100 72 L14 72 Z" fill="none" stroke="var(--acc)" stroke-width=".5" opacity=".2" stroke-dasharray="2,3"/>
            <text x="36" y="40" font-size="4" fill="var(--tx3)" font-family="Arial">Talla 38</text>
            <text x="104" y="25" font-size="4" fill="var(--acc)" font-family="Arial">40</text>
            <text x="104" y="38" font-size="4" fill="var(--acc)" opacity=".6" font-family="Arial">42</text>
            <text x="2" y="25" font-size="4" fill="var(--tx3)" font-family="Arial">BASE</text>
            <text x="2" y="38" font-size="3.5" fill="var(--tx3)" font-family="Arial">↑</text>
          </svg>`
        },
        {
          title: 'Abre el panel de gradación',
          text: 'En el sidebar, busca la sección "📊 Gradación" (dentro de Parámetros o como botón separado). Ingresa las medidas de la talla destino. Solo necesitas las medidas que cambien.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="60" height="70" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width="1"/>
            <rect x="4" y="4" width="52" height="8" rx="2" fill="var(--brd)" opacity=".5"/>
            <text x="8" y="10.5" font-size="4" fill="var(--tx)" font-family="Arial">📊 Gradación ▾</text>
            <text x="4" y="22" font-size="3.5" fill="var(--tx3)" font-family="Arial">Talla destino</text>
            <rect x="4" y="24" width="52" height="7" rx="2" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="6" y="29.5" font-size="3.5" fill="var(--tx)" font-family="Arial">Talla 40 (busto 92)</text>
            <text x="4" y="40" font-size="3.5" fill="var(--tx3)" font-family="Arial">Busto nuevo (cm)</text>
            <rect x="4" y="42" width="52" height="6" rx="1" fill="var(--inp)" stroke="var(--acc)" stroke-width=".6"/>
            <text x="6" y="46.5" font-size="4" fill="var(--tx)" font-family="Arial">92</text>
            <rect x="4" y="58" width="52" height="8" rx="3" fill="var(--acc)"/>
            <text x="12" y="64" font-size="4" fill="white" font-family="Arial">Gradar talla</text>
          </svg>`
        },
        {
          title: 'El patrón se recalcula',
          text: 'El sistema recalcula todos los puntos que tienen fórmulas (como B/4, TALLE_ESP) con las nuevas medidas. Los puntos sin fórmula se escalan proporcionalmente entre la talla base y la destino.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 20 L60 20 L60 70 L20 70 Z" fill="none" stroke="var(--acc)" stroke-width="1.5"/>
            <text x="25" y="48" font-size="4" fill="var(--acc)" font-family="Arial">Talla 38</text>
            <path d="M14 15 L68 15 L68 76 L14 76 Z" fill="none" stroke="var(--ok)" stroke-width="1.5" stroke-dasharray="4,2"/>
            <text x="70" y="48" font-size="4" fill="var(--ok)" font-family="Arial">Talla 40</text>
            <circle cx="20" cy="20" r="2.5" fill="var(--acc)"/>
            <circle cx="60" cy="20" r="2.5" fill="var(--acc)"/>
            <circle cx="60" cy="70" r="2.5" fill="var(--acc)"/>
            <circle cx="20" cy="70" r="2.5" fill="var(--acc)"/>
            <circle cx="14" cy="15" r="2" fill="var(--ok)" opacity=".8"/>
            <circle cx="68" cy="15" r="2" fill="var(--ok)" opacity=".8"/>
            <circle cx="68" cy="76" r="2" fill="var(--ok)" opacity=".8"/>
            <circle cx="14" cy="76" r="2" fill="var(--ok)" opacity=".8"/>
            <text x="70" y="68" font-size="3.5" fill="var(--ok)" font-family="Arial">+4cm busto</text>
            <text x="70" y="76" font-size="3.5" fill="var(--ok)" font-family="Arial">+3cm cadera</text>
          </svg>`
        }
      ]
    },
    {
      id: 'guardar',
      icon: '💾',
      title: 'Guardar y cargar',
      steps: [
        {
          title: 'Guardar desde el sidebar',
          text: 'En el sidebar, sección "Acciones", haz clic en "📁 Archivo" → "💾 Guardar patrón". Ingresa un nombre descriptivo. El patrón incluye la prenda, todas las medidas y los parámetros usados.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="56" height="70" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width="1"/>
            <rect x="4" y="4" width="48" height="10" rx="2" fill="var(--brd)" opacity=".5"/>
            <text x="8" y="11" font-size="4.5" fill="var(--tx)" font-family="Arial">Acciones</text>
            <rect x="4" y="18" width="48" height="9" rx="2" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="7" y="24.5" font-size="4" fill="var(--tx)" font-family="Arial">📁 Archivo ▾</text>
            <rect x="4" y="32" width="48" height="8" rx="2" fill="var(--surface)"/>
            <text x="7" y="37.5" font-size="3.5" fill="var(--acc)" font-family="Arial">💾 Guardar patrón</text>
            <rect x="4" y="42" width="48" height="8" rx="2" fill="var(--surface)"/>
            <text x="7" y="47.5" font-size="3.5" fill="var(--tx2)" font-family="Arial">📂 Cargar patrón</text>
            <rect x="4" y="52" width="48" height="8" rx="2" fill="var(--surface)"/>
            <text x="7" y="57.5" font-size="3.5" fill="var(--tx2)" font-family="Arial">📄 Exportar PDF</text>
          </svg>`
        },
        {
          title: 'Sincronización en la nube',
          text: 'Con sesión iniciada, los patrones guardados se sincronizan automáticamente a tu cuenta. Puedes acceder desde cualquier dispositivo. Sin sesión, se guardan solo en este navegador.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="30" width="60" height="30" rx="4" fill="var(--inp)" stroke="var(--brd)" stroke-width="1"/>
            <text x="18" y="42" font-size="4" fill="var(--tx2)" font-family="Arial">💻 Este</text>
            <text x="16" y="52" font-size="4" fill="var(--tx2)" font-family="Arial">navegador</text>
            <rect x="90" y="30" width="60" height="30" rx="4" fill="var(--inp)" stroke="var(--brd)" stroke-width="1"/>
            <text x="96" y="42" font-size="4" fill="var(--tx2)" font-family="Arial">📱 Otro</text>
            <text x="95" y="52" font-size="4" fill="var(--tx2)" font-family="Arial">dispositivo</text>
            <ellipse cx="80" cy="18" rx="22" ry="12" fill="var(--inp)" stroke="var(--acc)" stroke-width="1"/>
            <text x="66" y="22" font-size="4" fill="var(--acc)" font-family="Arial">☁ Nube</text>
            <line x1="40" y1="30" x2="65" y2="22" stroke="var(--acc)" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="120" y1="30" x2="95" y2="22" stroke="var(--acc)" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="28" y="68" font-size="3.5" fill="var(--ok)" font-family="Arial">✓ Sincronizado automáticamente al guardar</text>
          </svg>`
        },
        {
          title: 'Cargar un patrón guardado',
          text: 'En "📁 Archivo" → "📂 Cargar patrón" aparece la lista de todos los patrones guardados. Haz clic en uno para cargarlo: las medidas y la prenda se restauran exactamente como estaban.',
          svg: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="4" width="120" height="72" rx="5" fill="var(--surface)" stroke="var(--brd)" stroke-width="1"/>
            <text x="55" y="16" font-size="5" fill="var(--tx)" font-family="Arial">Mis patrones</text>
            <rect x="26" y="22" width="108" height="12" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="30" y="30" font-size="4" fill="var(--tx2)" font-family="Arial">🧥 Blusa básica 88cm</text>
            <text x="112" y="30" font-size="3.5" fill="var(--tx3)" font-family="Arial">14 jun</text>
            <rect x="26" y="37" width="108" height="12" rx="3" fill="var(--acc)" opacity=".15" stroke="var(--acc)" stroke-width=".6"/>
            <text x="30" y="45" font-size="4" fill="var(--acc)" font-family="Arial">👗 Vestido dama 90cm</text>
            <text x="112" y="45" font-size="3.5" fill="var(--acc)" font-family="Arial">hoy</text>
            <rect x="26" y="52" width="108" height="12" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="30" y="60" font-size="4" fill="var(--tx2)" font-family="Arial">👔 Camisa caballero 96cm</text>
            <rect x="46" y="68" width="68" height="6" rx="2" fill="var(--acc)" opacity=".7"/>
            <text x="59" y="73" font-size="3.5" fill="white" font-family="Arial">Cargar seleccionado</text>
          </svg>`
        }
      ]
    },
    {
      id: 'atelier',
      icon: '🗂️',
      title: 'Panel de Atelier',
      steps: [
        {
          title: '¿Qué es el Atelier?',
          text: 'El Panel de Atelier (plan Expert) es un directorio de clientes con sus medidas guardadas. Evita tener que reescribir las medidas de cada cliente cada vez que haces un patrón para ella/él.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="4" width="140" height="62" rx="5" fill="var(--surface)" stroke="var(--brd)" stroke-width="1"/>
            <text x="55" y="16" font-size="5" fill="var(--tx)" font-family="Arial">🗂️ Atelier</text>
            <rect x="18" y="22" width="50" height="12" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="22" y="30" font-size="4" fill="var(--tx2)" font-family="Arial">👤 María G.</text>
            <text x="22" y="38" font-size="3" fill="var(--tx3)" font-family="Arial">Busto 88 · Cin 68</text>
            <rect x="72" y="22" width="50" height="12" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="76" y="30" font-size="4" fill="var(--tx2)" font-family="Arial">👤 Laura P.</text>
            <text x="76" y="38" font-size="3" fill="var(--tx3)" font-family="Arial">Busto 92 · Cin 74</text>
            <rect x="18" y="50" width="124" height="10" rx="3" fill="var(--acc)" opacity=".7"/>
            <text x="55" y="57" font-size="4" fill="white" font-family="Arial">＋ Agregar cliente</text>
          </svg>`
        },
        {
          title: 'Agrega un cliente',
          text: 'Haz clic en el ícono de Atelier en el menú superior. Luego "＋ Agregar cliente", ingresa su nombre y todas sus medidas. Guarda. El cliente queda en tu directorio.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="4" width="120" height="62" rx="5" fill="var(--surface)" stroke="var(--brd)" stroke-width="1"/>
            <text x="52" y="16" font-size="5" fill="var(--tx)" font-family="Arial">Nuevo cliente</text>
            <text x="24" y="28" font-size="3.5" fill="var(--tx2)" font-family="Arial">Nombre completo</text>
            <rect x="24" y="30" width="112" height="7" rx="2" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="28" y="35.5" font-size="4" fill="var(--tx)" font-family="Arial">Carmen López</text>
            <text x="24" y="44" font-size="3.5" fill="var(--tx2)" font-family="Arial">Busto · Cintura · Cadera · Talle...</text>
            <rect x="24" y="46" width="112" height="7" rx="2" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="28" y="51.5" font-size="4" fill="var(--tx3)" font-family="Arial">90 · 70 · 96 · 40...</text>
            <rect x="86" y="60" width="50" height="4" rx="2" fill="var(--acc)" opacity=".7"/>
          </svg>`
        },
        {
          title: 'Usa las medidas del cliente',
          text: 'Selecciona un cliente de la lista y haz clic en "↩ Usar medidas". Sus medidas se cargan automáticamente en el sidebar. Luego genera el patrón normalmente.',
          svg: `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="4" width="140" height="44" rx="4" fill="var(--surface)" stroke="var(--brd)" stroke-width="1"/>
            <rect x="16" y="10" width="128" height="14" rx="3" fill="var(--acc)" opacity=".15" stroke="var(--acc)" stroke-width=".8"/>
            <text x="20" y="19" font-size="4.5" fill="var(--acc)" font-family="Arial">👤 Carmen López — 90/70/96cm</text>
            <rect x="16" y="27" width="128" height="14" rx="3" fill="var(--inp)" stroke="var(--brd)" stroke-width=".5"/>
            <text x="20" y="36" font-size="4" fill="var(--tx2)" font-family="Arial">👤 María García — 88/68/94cm</text>
            <rect x="30" y="54" width="100" height="12" rx="3" fill="var(--acc)"/>
            <text x="48" y="62" font-size="4.5" fill="white" font-family="Arial">↩ Usar medidas</text>
          </svg>`
        }
      ]
    }
  ];

  // ── Estado ────────────────────────────────────────────────────────────
  let _panelEl   = null;
  let _activeTopic = TOPICS[0].id;
  let _activeStep  = 0;

  // ── Renderizado ───────────────────────────────────────────────────────
  function _build() {
    if (_panelEl) return;

    // Estilos
    const style = document.createElement('style');
    style.textContent = `
      #help-fab {
        position:fixed; bottom:20px; right:20px; z-index:1200;
        width:42px; height:42px; border-radius:50%;
        background:var(--acc); color:#fff; border:none;
        font-size:20px; cursor:pointer; line-height:42px; text-align:center;
        box-shadow:0 4px 18px rgba(184,107,46,.45);
        transition:transform .15s var(--ease), box-shadow .15s;
      }
      #help-fab:hover { transform:scale(1.1); box-shadow:0 6px 24px rgba(184,107,46,.6); }
      #help-panel {
        position:fixed; top:0; right:0; bottom:0; z-index:1150;
        width:520px; max-width:95vw;
        background:var(--surface); border-left:1px solid var(--brd2);
        box-shadow:-6px 0 30px rgba(0,0,0,.18);
        display:flex; flex-direction:column;
        transform:translateX(110%); transition:transform .28s var(--ease);
        font-family:var(--font);
      }
      #help-panel.hp-open { transform:translateX(0); }
      .hp-header {
        display:flex; align-items:center; gap:10px;
        padding:14px 18px; border-bottom:1px solid var(--brd);
        flex-shrink:0;
      }
      .hp-header h2 { font-size:15px; font-weight:700; color:var(--tx); margin:0; flex:1; }
      .hp-close {
        background:none; border:none; cursor:pointer;
        color:var(--tx3); font-size:20px; padding:4px 8px; border-radius:6px;
      }
      .hp-close:hover { background:var(--inp); color:var(--tx); }
      .hp-body { display:flex; flex:1; overflow:hidden; }
      .hp-topics {
        width:150px; flex-shrink:0; overflow-y:auto;
        border-right:1px solid var(--brd); padding:8px 0;
        background:var(--panel);
      }
      .hp-topic-btn {
        display:flex; align-items:center; gap:7px;
        width:100%; padding:9px 12px; background:none; border:none;
        cursor:pointer; text-align:left; border-radius:0;
        font-size:12px; color:var(--tx2); font-family:var(--font);
        transition:background .12s, color .12s;
        border-left:3px solid transparent;
      }
      .hp-topic-btn:hover { background:var(--inp); color:var(--tx); }
      .hp-topic-btn.active {
        background:var(--accbg); color:var(--acc); font-weight:600;
        border-left-color:var(--acc);
      }
      .hp-topic-btn .hp-ti { font-size:16px; flex-shrink:0; }
      .hp-content { flex:1; overflow-y:auto; padding:20px; }
      .hp-topic-title { font-size:16px; font-weight:700; color:var(--tx); margin:0 0 16px; }
      .hp-steps { display:flex; flex-direction:column; gap:0; }
      .hp-step {
        display:flex; gap:12px; padding:14px 0;
        border-bottom:1px solid var(--brd); cursor:pointer;
        transition:background .1s; border-radius:4px;
      }
      .hp-step:last-child { border-bottom:none; }
      .hp-step.active { background:var(--accbg); padding:14px 10px; margin:0 -10px; border-radius:6px; border-bottom:none; }
      .hp-step-num {
        width:26px; height:26px; border-radius:50%; flex-shrink:0;
        background:var(--brd2); color:var(--tx2);
        display:flex; align-items:center; justify-content:center;
        font-size:12px; font-weight:700; margin-top:1px;
        transition:background .15s, color .15s;
      }
      .hp-step.active .hp-step-num { background:var(--acc); color:#fff; }
      .hp-step-body { flex:1; }
      .hp-step-title { font-size:13px; font-weight:600; color:var(--tx); margin:0 0 5px; }
      .hp-step.active .hp-step-title { color:var(--acc); }
      .hp-step-text { font-size:12px; color:var(--tx2); line-height:1.6; margin:0 0 10px; }
      .hp-step-svg { width:100%; max-width:320px; display:block; }
      .hp-step-svg svg { width:100%; height:auto; display:block; border-radius:6px; background:var(--bg2); padding:10px; }
      .hp-nav {
        display:flex; justify-content:space-between; align-items:center;
        padding:12px 18px; border-top:1px solid var(--brd); flex-shrink:0;
        gap:8px;
      }
      .hp-nav-btn {
        padding:7px 18px; border-radius:6px; border:1px solid var(--brd2);
        background:var(--inp); color:var(--tx2); cursor:pointer;
        font-size:12px; font-family:var(--font); font-weight:500;
        transition:background .12s, color .12s;
      }
      .hp-nav-btn:hover { background:var(--brd2); color:var(--tx); }
      .hp-nav-btn.primary { background:var(--acc); color:#fff; border-color:var(--acc); }
      .hp-nav-btn.primary:hover { background:var(--acc2); }
      .hp-nav-btn:disabled { opacity:.35; cursor:default; }
      .hp-step-counter { font-size:11px; color:var(--tx3); }
    `;
    document.head.appendChild(style);

    // Botón flotante ?
    const fab = document.createElement('button');
    fab.id = 'help-fab';
    fab.textContent = '?';
    fab.title = 'Ayuda y tutoriales';
    fab.onclick = toggle;
    document.body.appendChild(fab);

    // Panel
    _panelEl = document.createElement('div');
    _panelEl.id = 'help-panel';
    _panelEl.innerHTML = `
      <div class="hp-header">
        <span style="font-size:20px">📚</span>
        <h2>Guía de uso</h2>
        <button class="hp-close" id="hp-close-btn">✕</button>
      </div>
      <div class="hp-body">
        <nav class="hp-topics" id="hp-topics"></nav>
        <div class="hp-content" id="hp-content"></div>
      </div>
      <div class="hp-nav">
        <button class="hp-nav-btn" id="hp-prev">← Anterior</button>
        <span class="hp-step-counter" id="hp-counter"></span>
        <button class="hp-nav-btn primary" id="hp-next">Siguiente →</button>
      </div>
    `;
    document.body.appendChild(_panelEl);

    document.getElementById('hp-close-btn').onclick = close;
    document.getElementById('hp-prev').onclick = prevStep;
    document.getElementById('hp-next').onclick = nextStep;

    _renderTopics();
    _renderContent();
  }

  function _renderTopics() {
    const nav = document.getElementById('hp-topics');
    if (!nav) return;
    nav.innerHTML = '';
    TOPICS.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'hp-topic-btn' + (t.id === _activeTopic ? ' active' : '');
      btn.innerHTML = `<span class="hp-ti">${t.icon}</span><span>${t.title}</span>`;
      btn.onclick = () => { _activeTopic = t.id; _activeStep = 0; _renderTopics(); _renderContent(); };
      nav.appendChild(btn);
    });
  }

  function _renderContent() {
    const topic = TOPICS.find(t => t.id === _activeTopic);
    if (!topic) return;
    const content = document.getElementById('hp-content');
    if (!content) return;

    let html = `<p class="hp-topic-title">${topic.icon} ${topic.title}</p><div class="hp-steps">`;
    topic.steps.forEach((step, i) => {
      const active = i === _activeStep ? ' active' : '';
      html += `<div class="hp-step${active}" data-step="${i}">
        <div class="hp-step-num">${i + 1}</div>
        <div class="hp-step-body">
          <p class="hp-step-title">${step.title}</p>
          ${active ? `<p class="hp-step-text">${step.text}</p><div class="hp-step-svg">${step.svg}</div>` : ''}
        </div>
      </div>`;
    });
    html += '</div>';
    content.innerHTML = html;

    // Click en cualquier paso para ir a él
    content.querySelectorAll('.hp-step').forEach(el => {
      el.onclick = () => { _activeStep = parseInt(el.dataset.step); _renderContent(); _updateNav(); };
    });

    // Scroll al paso activo
    setTimeout(() => {
      const active = content.querySelector('.hp-step.active');
      if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);

    _updateNav();
  }

  function _updateNav() {
    const topic = TOPICS.find(t => t.id === _activeTopic);
    if (!topic) return;
    const total = topic.steps.length;
    const prev = document.getElementById('hp-prev');
    const next = document.getElementById('hp-next');
    const counter = document.getElementById('hp-counter');
    if (prev)    prev.disabled = _activeStep === 0;
    if (counter) counter.textContent = `${_activeStep + 1} / ${total}`;
    if (next) {
      if (_activeStep < total - 1) {
        next.textContent = 'Siguiente →';
        next.disabled = false;
      } else {
        next.textContent = '✓ Listo';
        next.disabled = false;
      }
    }
  }

  // ── API pública ────────────────────────────────────────────────────────
  function open(topicId) {
    _build();
    if (topicId) { _activeTopic = topicId; _activeStep = 0; _renderTopics(); _renderContent(); }
    _panelEl.classList.add('hp-open');
  }

  function close() {
    if (_panelEl) _panelEl.classList.remove('hp-open');
  }

  function toggle() {
    _build();
    if (_panelEl.classList.contains('hp-open')) close();
    else open();
  }

  function prevStep() {
    if (_activeStep > 0) { _activeStep--; _renderContent(); }
  }

  function nextStep() {
    const topic = TOPICS.find(t => t.id === _activeTopic);
    if (!topic) return;
    if (_activeStep < topic.steps.length - 1) { _activeStep++; _renderContent(); }
    else close();
  }

  return { open, close, toggle };
})();
