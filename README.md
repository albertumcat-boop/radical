# 🧵 PatrónAI Pro

Sistema integral de patronaje paramétrico con visualización 3D.
Genera patrones de costura a escala 1:1 exportables en PDF para impresión casera.

---

## 📁 Estructura del proyecto
```
patronai-pro/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── constants.js
│   ├── svg-utils.js
│   ├── pattern-engine.js
│   ├── pdf-export.js
│   ├── mannequin-3d.js
│   ├── firebase-config.js
│   ├── app.js
│   └── patterns/
│       ├── franela.js
│       ├── blusa.js
│       ├── camisa.js
│       ├── falda.js
│       └── vestido.js
├── package.json
├── vercel.json
├── firebase.json
├── .firebaserc
├── firestore.rules
├── firestore.indexes.json
└── .gitignore
```

---

## 🚀 Despliegue paso a paso

### 1. GitHub
```bash
git init
git add .
git commit -m "feat: PatrónAI Pro v1.0"
git remote add origin https://github.com/TU_USUARIO/patronai-pro.git
git push -u origin main
```

### 2. Firebase
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Crear proyecto en https://console.firebase.google.com
# Luego editar .firebaserc con tu project ID

# Editar js/firebase-config.js con tu configuración

# Desplegar
firebase deploy
```

### 3. Vercel
```bash
# Opción A: desde GitHub (recomendado)
# Ve a https://vercel.com → Import Git Repository → Selecciona tu repo

# Opción B: CLI
npm install -g vercel
vercel --prod
```

---

## 🔧 Configurar Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Crear proyecto → Agregar app web
3. Copiar la configuración en `js/firebase-config.js`
4. Habilitar **Firestore Database** en modo producción
5. Aplicar las reglas de `firestore.rules`

---

## 🧵 Prendas soportadas

| Prenda | Piezas | Notas |
|--------|--------|-------|
| Franela básica | 3 | Unisex, doblar en tela |
| Blusa con pinzas | 3 | Pinza de busto en costado |
| Camisa dama/caballero | 7 | Cuello, puños, canesú |
| Falda recta | 3 | 1-2 pinzas en cintura |
| Vestido básico | 2 | Cuello V, pinza busto + cintura |

---

## 📐 Sistema de unidades

- **Interno (SVG):** 1 unidad = 1 mm → escala 1:1 garantizada
- **Inputs usuario:** cm
- **PDF (jsPDF):** `unit: 'mm'` → sin conversiones
- **Margen costura:** mm (predeterminado 10 mm = 1 cm)

---

## 🖨️ Impresión del PDF

1. Exportar desde el botón **"Exportar PDF tiled"**
2. Imprimir **sin escalar** (100% / tamaño real)
3. Verificar el cuadrado de calibración 5×5 cm antes de cortar
4. Unir páginas por las marcas de registro y las zonas de solapamiento de 10 mm
5. Recortar por la línea de corte exterior (línea blanca continua)

---

## 📏 Cómo expandir las fórmulas

### Agregar una nueva prenda

1. Crear `js/patterns/mi_prenda.js` con esta estructura:
```javascript
'use strict';
window.PAT = window.PAT || {};
PAT.Patterns = PAT.Patterns || {};

PAT.Patterns.MiPrenda = (function() {
  const U = PAT.SVGUtils;
  const P = U.P;
  const C = PAT.COLORS;
  const NS = U.NS;

  function generate(m, seam) {
    // m = medidas en cm
    // seam = margen de costura en mm
    const pieces = [];

    // 1. Convertir a mm
    const B = m.bust * 10;

    // 2. Calcular puntos clave
    // (usar fórmulas de Aldrich o Müller & Sohn)

    // 3. Construir paths SVG
    let d = P.M(x, y);
    d += ` ${P.L(x2, y2)}`;
    // ...

    // 4. Crear grupo SVG
    const g = document.createElementNS(NS, 'g');
    g.appendChild(U.el('path', { d, fill: C.fill, stroke: C.cutLine, 'stroke-width': '0.8' }));
    g.appendChild(U.grainLine(...));
    g.appendChild(U.pieceLabel(...));

    pieces.push({
      group: g,
      bounds: { x: 0, y: 0, w: totalW, h: totalH },
      name: 'Nombre Pieza',
    });

    return pieces;
  }

  return { generate };
})();
```

2. Agregar `<script src="js/patterns/mi_prenda.js">` en `index.html`
3. Registrar en el `switch` de `pattern-engine.js`
4. Agregar botón en el `.garment-grid` del HTML

### Fórmulas de referencia (sistema Aldrich)
```
Ancho de bloque (¼ busto)  = (busto + facilidad) / 4
Profundidad de sisa         = busto × 0.14 + 5 cm
Ancho cuello                = busto / 12 + 0.5 cm
Largo hombro                = ancho_hombro/2 - ancho_cuello
Caída del hombro            = 1.5 cm (dama) / 1.8 cm (caballero)
Pinza de busto              ≈ (busto - cintura) / 4 × 0.5
```

---

## 🛠️ Tecnologías utilizadas

| Librería | Versión | Uso |
|----------|---------|-----|
| Three.js | r134 | Visualización 3D |
| OrbitControls | r134 | Controles de cámara |
| jsPDF | 2.5.1 | Exportación PDF |
| Firebase | 9.22.0 (compat) | Base de datos cloud |

---

## 📄 Licencia

MIT — Libre para uso personal y comercial.
```

---

## ✅ Guía de montaje final

### Orden de archivos en GitHub
```
Crear en este orden exacto:
1.  .gitignore
2.  package.json
3.  vercel.json
4.  firebase.json
5.  .firebaserc          ← reemplaza TU_FIREBASE_PROJECT_ID
6.  firestore.rules
7.  firestore.indexes.json
8.  index.html
9.  css/styles.css
10. js/constants.js
11. js/svg-utils.js
12. js/patterns/franela.js
13. js/patterns/blusa.js
14. js/patterns/camisa.js
15. js/patterns/falda.js
16. js/patterns/vestido.js
17. js/pattern-engine.js
18. js/pdf-export.js
19. js/mannequin-3d.js
20. js/firebase-config.js  ← reemplaza credenciales
21. js/app.js
22. README.md
