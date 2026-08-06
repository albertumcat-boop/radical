'use strict';
window.PAT = window.PAT || {};

PAT.HelpPanel = (function () {

  // ── Helpers ───────────────────────────────────────────────────────────
  function _ref(items) {
    return '<div class="hp-ref-list">' +
      items.map(([label, desc]) =>
        `<div class="hp-ref-row"><span class="hp-ref-lbl">${label}</span><span class="hp-ref-desc">${desc}</span></div>`
      ).join('') + '</div>';
  }

  // ── Contenido ─────────────────────────────────────────────────────────
  const TOPICS = [
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'herramientas',
      icon: '🖊️',
      title: 'Herramientas de trazo',
      steps: [
        {
          title: 'Seleccionar  [S]',
          text: 'Modo por defecto. Haz clic en un punto para seleccionarlo y ver sus propiedades en el panel derecho. Arrastra un punto seleccionado para moverlo. Sin punto seleccionado, arrastra el canvas para hacer pan.',
          svg: ''
        },
        {
          title: 'Punto  [P]',
          text: 'Modo de creación de puntos. Cada clic en el canvas crea un nuevo punto. El punto recibe un nombre automático (A, B, C…). Puedes renombrarlo en el panel derecho. El modo permanece activo hasta que cambies de herramienta.',
          svg: ''
        },
        {
          title: 'Línea  [L]',
          text: 'Conecta dos puntos con una línea recta. Selecciona el primer punto y luego Shift+clic en el segundo. También puedes hacer clic en el primer punto con la herramienta Línea activa y luego clic en el destino.',
          svg: ''
        },
        {
          title: 'Curva  [C]',
          text: 'Igual que Línea pero crea una curva Bézier. Después de conectar dos puntos aparece un diamante rojo en el medio — arrástralo para curvar la línea en cualquier dirección.',
          svg: ''
        },
        {
          title: 'Curva S  [V]',
          text: 'Crea una curva en S con dos puntos de control independientes. Útil para sisas, escotes y costados con doble curvatura. Cada diamante controla su mitad de la curva.',
          svg: ''
        },
        {
          title: 'Doblez  [F]',
          text: 'Marca una línea como línea de doblez (pliegue). Se muestra con trazo rojo discontinuo en el canvas y se exporta como marca de doblez en el PDF.',
          svg: ''
        },
        {
          title: 'Pinza  [D]',
          text: 'Herramienta de pinza. Clic en el punto de vértice, luego en los dos puntos de los lados. Crea automáticamente las tres líneas de la pinza y las marca para exportar.',
          svg: ''
        }
      ]
    },
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'utilidades',
      icon: '🔧',
      title: 'Herramientas auxiliares',
      steps: [
        {
          title: '📏 Medir (cinta métrica)',
          text: 'Activa la cinta métrica. Primer clic ancla el punto de inicio (se engancha al punto más cercano si hay uno). Mueve el mouse para ver la distancia en tiempo real junto al cursor. Segundo clic limpia la medida. No crea ningún punto ni línea.',
          svg: ''
        },
        {
          title: '⊕ Mitad (punto medio)',
          text: 'Encuentra el punto exacto entre dos puntos. Primer clic selecciona el punto A, segundo clic el punto B. Se crea automáticamente un nuevo punto M# en la posición exacta del centro entre ambos.',
          svg: ''
        },
        {
          title: '⬚ Multi (selección múltiple)',
          text: 'Activa el modo de selección múltiple. Arrastra en espacio vacío para dibujar un rectángulo de selección — todos los puntos dentro quedan seleccionados (color ámbar). Clic en un punto individual lo agrega o quita de la selección. Arrastra cualquier punto seleccionado para mover todos juntos. ESC limpia la selección.',
          svg: ''
        },
        {
          title: '⬚ Panel Mover (en modo Multi)',
          text: 'Cuando hay puntos seleccionados en modo Multi, aparece un panel en la parte inferior del canvas. Escribe Δx y Δy en mm o cm (botón de unidad alterna entre ambos) y presiona Mover o Enter para desplazar exactamente todos los puntos seleccionados esa distancia.',
          svg: ''
        },
        {
          title: '⬜ Rectángulo  [R]',
          text: 'Inserta un rectángulo base: crea cuatro puntos (esquinas) y los conecta con líneas rectas automáticamente. Útil para empezar una pieza rectangular rápida.',
          svg: ''
        },
        {
          title: '🔁 Espejo  [M]',
          text: 'Refleja el punto seleccionado respecto a la línea de doblez (línea roja). Crea una copia especular del punto al otro lado de esa línea. Si no hay línea de doblez, el espejo no tiene efecto.',
          svg: ''
        }
      ]
    },
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'barra-superior',
      icon: '🗂️',
      title: 'Barra de botones',
      steps: [
        {
          title: 'Atrás / Adelante',
          text: 'Deshacer y rehacer pasos. Hasta 60 pasos de historial. Atajos: Ctrl+Z (deshacer) y Ctrl+Y (rehacer). El historial se pierde al cerrar el editor.',
          svg: ''
        },
        {
          title: '⊞ Snap 5mm',
          text: 'Activa el ajuste automático a la grilla de 5mm. Cuando está ON, al mover un punto se engancha a la grilla. También detecta alineación con otros puntos (misma X o misma Y) y muestra guías azules. Clic para activar/desactivar.',
          svg: ''
        },
        {
          title: '📐 Medidas',
          text: 'Muestra u oculta las cotas de dimensión sobre las líneas del patrón. Las cotas muestran la longitud de cada segmento en mm. Útil para verificar medidas mientras trazas.',
          svg: ''
        },
        {
          title: '📏 Escalar talla',
          text: 'Escala todo el patrón actual proporcionalmente a una nueva talla. Ingresa el nuevo busto o medida clave y recalcula todos los puntos con fórmula. Los puntos sin fórmula se escalan por proporción geométrica.',
          svg: ''
        },
        {
          title: '🔍 + / − / Ajustar',
          text: '+ amplía el zoom, − lo reduce. Ajustar centra y escala el patrón para que todas las piezas queden visibles en pantalla (equivale a "fit to screen"). También puedes usar la rueda del mouse para zoom.',
          svg: ''
        },
        {
          title: '📋 Tallas',
          text: 'Abre la tabla de tallas estándar de referencia. Muestra medidas típicas para diferentes tallas (S, M, L, XL…). Útil para consultar proporciones mientras trazas.',
          svg: ''
        },
        {
          title: '🗑️ Limpiar',
          text: 'Elimina todos los puntos y líneas del canvas. Pide confirmación antes de borrar. Esta acción no se puede deshacer después de confirmar.',
          svg: ''
        },
        {
          title: '💾 Guardar',
          text: 'Guarda la pieza actual en tu lista de patrones guardados. Pide un nombre. Se guarda en Firestore (si tienes sesión) y también en localStorage como respaldo. Puedes cargarla luego desde "Patrones guardados".',
          svg: ''
        },
        {
          title: '+ Al patrón',
          text: 'Agrega la pieza actual al patrón principal (el canvas del wizard). Se exportará junto con las demás piezas al generar el PDF. El botón del panel derecho hace lo mismo.',
          svg: ''
        },
        {
          title: '✅ Verificar',
          text: 'Comprueba que el patrón sea válido para exportar: detecta puntos sin conectar, líneas abiertas y problemas de cierre del contorno. Muestra advertencias pero no bloquea el guardado.',
          svg: ''
        },
        {
          title: '▶ Demo Espalda',
          text: 'Carga automáticamente un patrón de espalda de demostración con puntos y fórmulas ya configurados. Útil para entender cómo funciona el sistema de fórmulas y puntos de referencia.<br><br><button onclick="if(PAT.DrafterUI&&PAT.DrafterUI.demo){PAT.DrafterUI.open();setTimeout(()=>PAT.DrafterUI.demo(),200);}" style="padding:8px 16px;background:#34d399;color:#0a1a10;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">▶ Cargar Demo Espalda</button>',
          svg: ''
        },
        {
          title: '⚙ Sistemas',
          text: 'Abre el panel de sistemas de patronaje. Permite cargar sistemas predefinidos (Müller, Metric, etc.) con sus bases y reglas de construcción.',
          svg: ''
        },
        {
          title: '🖼️ Imagen',
          text: 'Abre el panel de imagen de fondo. Permite subir una foto o patrón escaneado y usarlo como referencia debajo del canvas para trazar encima. Ajusta la opacidad con el slider.',
          svg: ''
        },
        {
          title: '📊 Tabla',
          text: 'Muestra una tabla con todos los puntos del patrón actual: nombre, coordenadas X/Y en cm y la fórmula asignada (si tiene). Útil para auditar el patrón o copiar datos.',
          svg: ''
        },
        {
          title: '🔨 Herramientas',
          text: 'Menú desplegable con herramientas avanzadas: espejo, escalar, y otras operaciones sobre el patrón completo.',
          svg: ''
        }
      ]
    },
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'panel-punto',
      icon: '📍',
      title: 'Panel derecho — Punto',
      steps: [
        {
          title: 'Nombre del punto',
          text: 'Cuando seleccionas un punto, el panel derecho muestra su nombre (A, B, C… o el que le hayas dado). Puedes editarlo directamente. El nombre se usa en las fórmulas de otros puntos (ej: B.x, B.y).',
          svg: ''
        },
        {
          title: 'Coord X / Coord Y',
          text: 'Muestra la posición del punto en mm desde el origen (esquina superior izquierda del canvas). Puedes editar el valor directamente para mover el punto a una posición exacta. Si el punto tiene fórmula, editarlo manualmente borra la fórmula.',
          svg: ''
        },
        {
          title: 'Fórm. X / Fórm. Y',
          text: 'Fórmula que controla la posición del punto. Puede usar medidas (BUSTO, CINTURA, CADERA…), operaciones matemáticas y referencias a otros puntos (B.x, D.y). Cuando el patrón se recalcula o se escala, los puntos con fórmula se reposicionan automáticamente.',
          svg: ''
        },
        {
          title: 'Sintaxis de fórmulas',
          text: 'Ejemplos válidos: "BUSTO/4 + 2" — "D.y + TALLE_ESP" — "B.x - 15" — "(CADERA/4) + 3". Las medidas van en MAYÚSCULAS. Los puntos se referencian como NombrePunto.x o NombrePunto.y. Las unidades son siempre mm internamente.',
          svg: ''
        },
        {
          title: 'Notas del punto',
          text: 'El ícono de nota (📌) junto al nombre del punto abre un campo de texto libre. Puedes escribir instrucciones o recordatorios para ese punto específico. Las notas se guardan con el patrón.',
          svg: ''
        }
      ]
    },
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'constructor',
      icon: '🧮',
      title: 'Constructor de fórmula',
      steps: [
        {
          title: '¿Qué hace?',
          text: 'El Constructor de Fórmula te ayuda a crear fórmulas sin escribirlas a mano. Selecciona una medida, la operación y un valor constante — el sistema arma la expresión y muestra el resultado en cm en tiempo real.',
          svg: ''
        },
        {
          title: 'Unidades (mm / cm)',
          text: 'El toggle mm/cm en la esquina superior del constructor controla en qué unidad se muestra el resultado y en qué unidad introduces el valor constante. Internamente todo es mm, la conversión es automática.',
          svg: ''
        },
        {
          title: 'Medida base',
          text: 'El primer dropdown lista todas las medidas disponibles: Busto, Cintura, Cadera, Talle de espalda, etc. El número al lado es el valor actual de esa medida para el cliente/perfil activo.',
          svg: ''
        },
        {
          title: 'División (Cuarta, Mitad, Tercio…)',
          text: 'El segundo dropdown divide la medida base: Entera (÷1), Mitad (÷2), Tercio (÷3), Cuarta (÷4), Quinta (÷5), Sexta (÷6). La cuarta parte de cintura es el valor más común en patronaje.',
          svg: ''
        },
        {
          title: 'Operación y constante',
          text: 'El tercer dropdown elige + o −. El campo numérico a su derecha es la constante que se suma o resta. Ejemplo: Cintura ÷ 4 + 3 = 24.8cm.',
          svg: ''
        },
        {
          title: '→ Insertar en X',
          text: 'Aplica la fórmula calculada como coordenada X del punto seleccionado. Usa el punto A del bloque "Desde otro punto" como referencia: inserta "A.x + fórmula" o "A.x − fórmula" según la posición relativa. Si A no está definido, inserta el valor absoluto.',
          svg: ''
        },
        {
          title: '→ Insertar en Y',
          text: 'Igual que Insertar en X pero para la coordenada Y. Genera "A.y + fórmula" o "A.y − fórmula". Úsalo para posicionar puntos verticalmente respecto a un punto de referencia.',
          svg: ''
        }
      ]
    },
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'desde-otro-punto',
      icon: '📐',
      title: 'Desde otro punto / Línea',
      steps: [
        {
          title: '¿Qué es?',
          text: 'Esta sección posiciona el punto seleccionado calculando su lugar a partir de uno o dos puntos de referencia. El botón ▲/▼ en el encabezado colapsa o expande la sección. Tiene dos modos según si defines B o no.',
          svg: ''
        },
        {
          title: 'Modo solo punto A (B = ninguno)',
          text: 'Define el punto de origen. Luego usa "Sacar / Meter / Subir / Bajar" con una distancia en cm para mover el punto en esa dirección respecto a A. Ejemplo: A=D, Sacar 5cm → el punto queda 5cm a la derecha de D.',
          svg: ''
        },
        {
          title: 'Modo sobre línea A→B',
          text: 'Define dos puntos. El sistema traza la línea imaginaria entre A y B. El campo "cm sobre línea A→B" avanza esa distancia desde A hacia B sobre la línea. Luego la dirección y cm perpendicular alejan el punto de esa línea en ángulo recto.',
          svg: ''
        },
        {
          title: 'Dirección perpendicular',
          text: '"Subir" — aleja hacia arriba en la pantalla. "Bajar" — hacia abajo. "Sacar (→)" — hacia la derecha del vector A→B. "Meter (←)" — hacia la izquierda del vector A→B. El segundo número es cuántos cm perpendiculares.',
          svg: ''
        },
        {
          title: '→ Ubicar punto aquí',
          text: 'Aplica el cálculo actual al punto seleccionado en el canvas. Mueve el punto a la posición calculada. No asigna fórmula — es un valor absoluto. Si mueves A o B después, el punto NO se recalcula solo.',
          svg: ''
        },
        {
          title: 'Relación con Insertar en X/Y',
          text: 'El punto A también sirve como referencia para "Insertar en X" e "Insertar en Y" del Constructor de Fórmula. Cuando cambias A aquí, la fórmula generada cambia para usar ese punto de referencia.',
          svg: ''
        }
      ]
    },
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'canvas',
      icon: '🖱️',
      title: 'Interacción con el canvas',
      steps: [
        {
          title: 'Navegación (pan y zoom)',
          text: 'Arrastra el canvas en espacio vacío (sin punto) para desplazarte. Rueda del mouse: zoom in/out centrado en el cursor. Botones + y − en la barra. "Ajustar" centra todo el patrón en pantalla.',
          svg: ''
        },
        {
          title: 'Crear y mover puntos',
          text: 'En modo Punto (+): clic en canvas crea un punto nuevo. En modo Seleccionar: clic en un punto lo selecciona; arrastrarlo lo mueve. Al mover un punto con Snap activo se alinea a la grilla de 5mm y a otros puntos.',
          svg: ''
        },
        {
          title: 'Conectar puntos con líneas',
          text: 'Selecciona un punto de inicio (queda resaltado). Luego Shift+clic en el punto destino con la herramienta Línea, Curva o Curva S activa para crear la conexión. También puedes seleccionar el primer punto, cambiar a la herramienta de línea, y hacer clic en el segundo.',
          svg: ''
        },
        {
          title: 'Seleccionar una línea',
          text: 'Haz clic directamente sobre una línea (no en los puntos). La línea queda resaltada y aparece su información en el panel. Puedes cambiar su tipo (recta ↔ curva) o eliminarla con Supr.',
          svg: ''
        },
        {
          title: 'Guías de alineación',
          text: 'Cuando mueves un punto con Snap activo, aparecen líneas punteadas azules horizontales y verticales si el punto se alinea con otro existente. Sueltas cuando las guías aparecen para quedar exactamente alineado.',
          svg: ''
        },
        {
          title: 'Atajos de teclado',
          text: 'S = Seleccionar · P = Punto · L = Línea · C = Curva · V = Curva S · F = Doblez · D = Pinza · M = Espejo · R = Rectángulo · ESC = cancelar operación / limpiar multi-selección · Ctrl+Z = deshacer · Ctrl+Y = rehacer · Supr = eliminar punto o línea seleccionada.',
          svg: ''
        }
      ]
    },
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'generar',
      icon: '📐',
      title: 'Generar patrón',
      steps: [
        {
          title: 'Ingresa tus medidas',
          text: 'En el panel izquierdo completa las medidas: busto, cintura, cadera, talle de espalda y largo total. Abre los grupos desplegables para ver todas las medidas disponibles.',
          svg: ''
        },
        {
          title: 'Selecciona la prenda',
          text: 'En el selector de prendas elige el tipo: Franela, Blusa, Camisa, Falda, Vestido, Pantalón, etc. La lista muestra solo las prendas disponibles para tu plan.',
          svg: ''
        },
        {
          title: 'Haz clic en Generar',
          text: 'El botón "⚡ Generar" calcula todas las piezas del patrón con tus medidas. Las piezas aparecen en el canvas: espalda, frente, mangas y complementos según la prenda elegida.',
          svg: ''
        },
        {
          title: 'Perfiles de cliente',
          text: 'En la sección "Perfil de medidas" puedes guardar las medidas de cada cliente con su nombre. Al seleccionar un perfil, sus medidas se cargan automáticamente. Se sincronizan en la nube si tienes sesión iniciada.',
          svg: ''
        }
      ]
    },
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'pdf',
      icon: '📄',
      title: 'Exportar PDF',
      steps: [
        {
          title: 'Exportar el patrón',
          text: 'En "📁 Archivo" → "📄 Exportar PDF". Elige el tamaño de papel: Carta (216×279mm) o A4 (210×297mm). Las piezas grandes se dividen en varias hojas con marcas de solapamiento de 10mm.',
          svg: ''
        },
        {
          title: 'Imprimir al 100%',
          text: 'Al imprimir, configura la escala al 100% (tamaño real / sin ajuste de página). La opción "Ajustar a la página" del navegador reduce ~2% el tamaño y descuadra las medidas. El PDF incluye un cuadrado de calibración de 10×10cm para verificar.',
          svg: ''
        },
        {
          title: 'Ensamblar hojas',
          text: 'Cada hoja tiene marcas de esquina. Recorta el margen de solapamiento de la hoja derecha y pégala sobre la izquierda alineando las marcas. Repite para ensamblar el patrón completo.',
          svg: ''
        }
      ]
    },
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'formulas',
      icon: '🧮',
      title: 'Tutorial: fórmulas para graduar',
      steps: [
        {
          title: '¿Por qué usar fórmulas?',
          text: 'Sin fórmulas, los puntos tienen coordenadas fijas (ej: X=220, Y=180). Al graduar a otra talla, el sistema los escala proporcionalmente — es una aproximación. Con fórmulas, el punto se RECALCULA exactamente según las medidas de cada talla: si el busto cambia, el punto se mueve a la posición correcta automáticamente. Un patrón con fórmulas gradura perfectamente a cualquier talla.',
          svg: ''
        },
        {
          title: 'Las variables de medida disponibles',
          text: 'Puedes usar estas variables en las fórmulas (los valores son en mm internamente):\n\nBUSTO — contorno de busto (ej: 880 para 88cm)\nCINTURA — contorno de cintura\nCADERA — contorno de cadera\nESPALDA — ancho de hombros\nCUELLO — contorno de cuello\nTALLE_ESP — talle espalda\nLARGO — largo total de la prenda\n\nAtajos comunes:\nB4 = BUSTO÷4, B6 = BUSTO÷6, B8 = BUSTO÷8\nW4 = CINTURA÷4, H4 = CADERA÷4',
          svg: ''
        },
        {
          title: 'Referencia a otro punto',
          text: 'Si ya tienes el punto A ubicado, puedes decir: "el punto B está 5cm a la derecha de A". La fórmula sería:\n\nFórm. X: A.x + 50\nFórm. Y: A.y\n\n(las unidades son mm, entonces 5cm = 50mm)\n\nSi A se mueve, B se mueve con él automáticamente. Así se construye una cadena de puntos que se recalculan solos.',
          svg: ''
        },
        {
          title: 'Ejemplo: espalda básica paso a paso',
          text: 'Punto 0 — origen (esquina superior izquierda):\nX: 0   Y: 0\n\nPunto A — extremo de escote:\nX: CUELLO/6 + 20   Y: 0\n\nPunto B — hombro lateral:\nX: ESPALDA/2   Y: 20\n\nPunto C — sisa lateral (nivel pecho):\nX: ESPALDA/2 + 10   Y: TALLE_ESP/3\n\nPunto D — cintura lateral:\nX: B4 + 10   Y: TALLE_ESP\n\nPunto E — dobladillo lateral:\nX: H4 + 10   Y: LARGO\n\nPunto F — dobladillo centro:\nX: 0   Y: LARGO',
          svg: ''
        },
        {
          title: 'Cómo ingresar una fórmula en el editor',
          text: '1. Crea o selecciona un punto.\n2. En el panel derecho, ve al CONSTRUCTOR DE FÓRMULA.\n3. Elige la medida base (ej: Busto) en el primer dropdown.\n4. Elige la división (ej: Cuarta ÷4).\n5. Elige + o − y escribe la constante en cm.\n6. Haz clic en "→ Insertar en X" o "→ Insertar en Y".\nEl punto se mueve al instante y la fórmula queda guardada.',
          svg: ''
        },
        {
          title: 'Fórmula manual (campo de texto)',
          text: 'También puedes escribir la fórmula directamente en los campos Fórm. X y Fórm. Y del panel de punto. Ejemplos válidos:\n\nB4 + 20\n(CINTURA/4) - 5\nA.y + TALLE_ESP\nBUSTO/6 + 15\nC.x - 30\n\nReglas: solo números, operadores +−×÷ y paréntesis. Las medidas van en MAYÚSCULAS. Los puntos se escriben como NombrePunto.x o NombrePunto.y.',
          svg: ''
        },
        {
          title: '🧵 Sistema de costuras etiquetadas',
          text: 'El botón "🧵 Costuras" en la barra superior activa el modo de etiquetado. Haz clic en los puntos EN ORDEN que forman una costura (ej: los 4 puntos que forman la sisa) y luego elige el tipo: Sisa, Caída de hombro, Costado, etc. El sistema guarda ese camino como una costura con reglas de gradación propias.',
          svg: ''
        },
        {
          title: 'Por qué las costuras gradan mejor que los puntos',
          text: 'Cuando etiquetas una costura, el sistema conoce su DIRECCIÓN real. Al graduar, mueve cada punto perpendicular a esa costura — no en X/Y absoluto. Así el hombro inclinado se desplaza a lo largo de su inclinación real, no en horizontal puro.',
          svg: ''
        },
        {
          title: 'Puntos de unión entre dos costuras',
          text: 'Si un punto pertenece a DOS costuras etiquetadas (ej: donde termina "Caída de hombro" y empieza "Sisa"), el sistema resuelve automáticamente la posición correcta por INTERSECCIÓN de las dos líneas graduadas. El punto va exactamente donde ambas costuras se encontrarían en la talla nueva — sin huecos ni traslapes.',
          svg: ''
        },
        {
          title: 'Orden de prioridad en la gradación',
          text: '1. FÓRMULA — el punto tiene fx o fy: recalcula exacto con las medidas de la talla nueva.\n2. COSTURA — el punto está en una costura etiquetada: usa gradación vectorial (perpendicular a la costura).\n3. ROL DE PUNTO — tiene "Rol para graduar" en el panel: usa incremento fijo dx/dy por paso.\n4. NINGUNO — escala proporcional según busto y talle (aproximación).\n\nUsa fórmulas siempre que puedas. Usa costuras para los puntos trazados a ojo que sí tienen posición reconocible.',
          svg: ''
        }
      ]
    }
  ];

  // ── Estado ────────────────────────────────────────────────────────────
  let _panelEl     = null;
  let _activeTopic = TOPICS[0].id;
  let _activeStep  = 0;

  // ── Renderizado ───────────────────────────────────────────────────────
  function _build() {
    if (_panelEl) return;

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
        width:540px; max-width:95vw;
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
        width:160px; flex-shrink:0; overflow-y:auto;
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
        display:flex; gap:12px; padding:12px 0;
        border-bottom:1px solid var(--brd); cursor:pointer;
        transition:background .1s; border-radius:4px;
      }
      .hp-step:last-child { border-bottom:none; }
      .hp-step.active { background:var(--accbg); padding:12px 10px; margin:0 -10px; border-radius:6px; border-bottom:none; }
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
      .hp-step-text { font-size:12px; color:var(--tx2); line-height:1.7; margin:0; }
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

    const fab = document.createElement('button');
    fab.id = 'help-fab';
    fab.textContent = '?';
    fab.title = 'Ayuda y referencia';
    fab.onclick = toggle;
    document.body.appendChild(fab);

    _panelEl = document.createElement('div');
    _panelEl.id = 'help-panel';
    _panelEl.innerHTML = `
      <div class="hp-header">
        <span style="font-size:20px">📚</span>
        <h2>Referencia completa</h2>
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
          ${active ? `<p class="hp-step-text">${step.text}</p>` : ''}
        </div>
      </div>`;
    });
    html += '</div>';
    content.innerHTML = html;

    content.querySelectorAll('.hp-step').forEach(el => {
      el.onclick = () => { _activeStep = parseInt(el.dataset.step); _renderContent(); _updateNav(); };
    });

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
      next.textContent = _activeStep < total - 1 ? 'Siguiente →' : '✓ Listo';
      next.disabled = false;
    }
  }

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
