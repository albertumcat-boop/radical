/**
 * mannequin-3d.js — PatrónAI Pro
 * Maniquí 3D paramétrico + Simulación de tela (Position-Based Dynamics)
 * Inspirado en CLO 3D
 */
'use strict';
window.PAT = window.PAT || {};

PAT.Mannequin3D = (function () {

  // ── Estado ──────────────────────────────────────────────────
  let scene, camera, renderer, controls;
  let bodyGroup, garmentGroup, measureGroup, clothGroup;
  let isWireframe = false;
  let _canvas = null;
  let _animId = null;
  let _initialized = false;
  let _currentMeasures = {};
  let _activeMeasureLine = null;
  let _simRunning = false;
  let _simStep = 0;
  let _clothParticles = [];   // partículas de la tela
  let _clothConstraints = []; // restricciones de distancia
  let _currentGarment = 'franela';
  let _currentRadii = null;
  let _bodyMeshes = [];       // meshes del cuerpo para colisión

  // ── Constantes ───────────────────────────────────────────────
  const SC = 0.01;
  const GRAVITY = new THREE.Vector3(0, -9.8, 0);
  const DT = 0.016;
  const SOLVER_ITERATIONS = 5;
  const CLOTH_ROWS = 18;
  const CLOTH_COLS = 24;

  const H = {
    floor:0, ankle:0.08, knee:0.40, crotch:0.50,
    hip:0.60, waist:0.74, underbust:0.82, bust:0.88,
    shoulder:0.97, neckBot:1.02, neckTop:1.09, headCtr:1.24,
  };

  function cmToRadius(c) { return c / (2 * Math.PI * 100); }

  // ════════════════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════════════════
  function init(canvasEl) {
    if (_initialized || !canvasEl) return;
    _canvas = canvasEl;
    const W = canvasEl.clientWidth || 800;
    const Ht = canvasEl.clientHeight || 600;

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, Ht);
    renderer.setClearColor(0x06060e, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x06060e, 6, 20);

    camera = new THREE.PerspectiveCamera(38, W / Ht, 0.01, 40);
    camera.position.set(0, 0.9, 3.0);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 0.5;
    controls.maxDistance = 6;
    controls.target.set(0, 0.82, 0);
    controls.update();

    bodyGroup    = new THREE.Group();
    garmentGroup = new THREE.Group();
    measureGroup = new THREE.Group();
    clothGroup   = new THREE.Group();

    scene.add(bodyGroup);
    scene.add(garmentGroup);
    scene.add(measureGroup);
    scene.add(clothGroup);

    _buildScene();
    _injectUI();

    window.addEventListener('resize', _onResize);
    _animate();
    _initialized = true;
    console.log('[3D] Iniciado con simulación de tela ✓');
  }

  function _buildScene() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3, 48),
      new THREE.MeshStandardMaterial({ color: 0x0c0c1a, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(6, 30, 0x1a1a35, 0x111125));

    scene.add(new THREE.AmbientLight(0xeeeeff, 0.45));
    const key = new THREE.DirectionalLight(0xfff5ee, 1.1);
    key.position.set(2, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7c3aed, 0.55);
    rim.position.set(-2, 3, -2);
    scene.add(rim);

    const baseMat = new THREE.MeshStandardMaterial({ color:0x1a1a30, metalness:0.7, roughness:0.3 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.25, 0.035, 40), baseMat);
    disc.position.y = 0.018;
    scene.add(disc);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.50, 12), baseMat);
    pole.position.y = 0.285;
    scene.add(pole);
  }

  // ════════════════════════════════════════════════════════════
  // CUERPO
  // ════════════════════════════════════════════════════════════
  function _buildBody(m) {
    while (bodyGroup.children.length) {
      const c = bodyGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      bodyGroup.remove(c);
    }
    _bodyMeshes = [];

    const rBust    = cmToRadius(m.bust);
    const rWaist   = cmToRadius(m.waist);
    const rHip     = cmToRadius(m.hip);
    const rNeck    = cmToRadius(m.neck);
    const rShoulder= (m.shoulder / 100) / 2;

    const skin = new THREE.MeshStandardMaterial({ color: 0xc4956a, roughness: 0.68, metalness: 0.03 });

    function addMesh(geo, mat, pos, rotZ) {
      const mesh = new THREE.Mesh(geo, mat);
      if (pos) mesh.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
      if (rotZ !== undefined) mesh.rotation.z = rotZ;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bodyGroup.add(mesh);
      _bodyMeshes.push(mesh);
      return mesh;
    }

    // Piernas
    const legLX = rHip * 0.55;
    [-legLX, legLX].forEach(lx => {
      const calfH = H.knee - H.ankle;
      const thighH = H.crotch - H.knee;
      addMesh(new THREE.CylinderGeometry(rHip*0.22, rHip*0.19, calfH, 16), skin, {x:lx, y:H.ankle+calfH/2});
      addMesh(new THREE.CylinderGeometry(rHip*0.40, rHip*0.26, thighH, 18), skin, {x:lx, y:H.knee+thighH/2});
    });

    // Pelvis
    const pelvPts = [
      new THREE.Vector2(rHip*0.90, 0),
      new THREE.Vector2(rHip, H.hip-H.crotch),
      new THREE.Vector2(rWaist*1.05, H.waist-H.crotch-0.02),
      new THREE.Vector2(rWaist, H.waist-H.crotch),
    ];
    const pelvis = new THREE.Mesh(new THREE.LatheGeometry(pelvPts, 44), skin);
    pelvis.position.y = H.crotch;
    pelvis.castShadow = true;
    bodyGroup.add(pelvis);
    _bodyMeshes.push(pelvis);

    // Torso
    const torsoPts = [
      new THREE.Vector2(rWaist, 0),
      new THREE.Vector2(rWaist*1.04, 0.03),
      new THREE.Vector2(rBust*0.96, H.underbust-H.waist),
      new THREE.Vector2(rBust, H.bust-H.waist),
      new THREE.Vector2(rBust*0.94, H.bust-H.waist+0.03),
      new THREE.Vector2(rShoulder*0.88, H.shoulder-H.waist-0.01),
      new THREE.Vector2(rNeck*1.4, H.neckBot-H.waist),
    ];
    const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 44), skin);
    torso.position.y = H.waist;
    torso.castShadow = true;
    bodyGroup.add(torso);
    _bodyMeshes.push(torso);

    // Cuello y cabeza
    const neckH = H.neckTop - H.neckBot;
    addMesh(new THREE.CylinderGeometry(rNeck, rNeck*1.2, neckH, 20), skin, {y: H.neckBot+neckH/2});
    addMesh(new THREE.SphereGeometry(rNeck*2.05, 28, 20), skin, {y: H.headCtr});

    // Brazos
    const aTopR=rBust*0.27, aMidR=rBust*0.20, aBotR=rBust*0.15;
    const uAH=0.24, fAH=0.22, ang=0.32;
    [-1,1].forEach(side => {
      const ax = side * rShoulder;
      const elbowX = ax + side*Math.sin(ang)*uAH;
      const elbowY = H.shoulder - Math.cos(ang)*uAH;
      const uArm = addMesh(new THREE.CylinderGeometry(aMidR,aTopR,uAH,16), skin,
        {x: ax+side*Math.sin(ang)*uAH*0.5, y: H.shoulder-Math.cos(ang)*uAH*0.5}, side*ang);
      const fArm = addMesh(new THREE.CylinderGeometry(aBotR,aMidR,fAH,16), skin,
        {x: elbowX+side*Math.sin(0.18)*fAH*0.5, y: elbowY-Math.cos(0.18)*fAH*0.5}, side*0.18);
    });

    return { rBust, rWaist, rHip, rNeck, rShoulder };
  }

  // ════════════════════════════════════════════════════════════
  // SIMULACIÓN DE TELA — Position-Based Dynamics
  // ════════════════════════════════════════════════════════════

  /**
   * Crea una malla de partículas cilíndrica alrededor del maniquí.
   * Cada partícula tiene: posición, posición anterior, masa, fija (bool)
   * Las restricciones mantienen las distancias entre partículas vecinas.
   */
  function _initCloth(garmentType, radii, m) {
    // Limpiar tela anterior
    while (clothGroup.children.length) {
      const c = clothGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      clothGroup.remove(c);
    }
    _clothParticles = [];
    _clothConstraints = [];

    const rows = CLOTH_ROWS;
    const cols = CLOTH_COLS;

    // Determinar el rango Y y radio de la prenda según el tipo
    let yTop, yBottom, rTop, rBottom;
    const ease = 0.025; // holgura inicial (la tela cae desde arriba)

    switch (garmentType) {
      case 'falda':
        yTop    = H.waist + 0.05;
        yBottom = H.waist - m.skirtLength / 100;
        rTop    = radii.rWaist + ease;
        rBottom = radii.rHip * 1.1 + ease;
        break;
      case 'vestido':
        yTop    = H.neckBot + 0.05;
        yBottom = H.waist - m.skirtLength / 100;
        rTop    = radii.rNeck * 1.5 + ease;
        rBottom = radii.rHip * 1.1 + ease;
        break;
      default: // franela, blusa, camisa
        yTop    = H.neckBot + 0.05;
        yBottom = H.crotch - 0.02;
        rTop    = radii.rNeck * 1.5 + ease;
        rBottom = radii.rHip + ease;
        break;
    }

    // Posición inicial: tela empieza 0.4 unidades SOBRE la prenda final (cae)
    const yStart = yTop + 0.4;

    // Crear partículas
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const t = r / rows; // 0 = arriba, 1 = abajo
        const angle = (c / cols) * Math.PI * 2;

        // Radio interpolado entre top y bottom
        const radius = rTop + (rBottom - rTop) * t + ease * 0.5;

        // Posición objetivo (donde debería quedar)
        const targetY = yTop + (yBottom - yTop) * t;

        // Posición inicial (arriba, tela cayendo)
        const startY = yStart + (yBottom - yTop) * t * 0.3;

        const particle = {
          pos:     new THREE.Vector3(Math.cos(angle)*radius, startY, Math.sin(angle)*radius),
          prevPos: new THREE.Vector3(Math.cos(angle)*radius, startY, Math.sin(angle)*radius),
          targetY: targetY,
          targetR: radius - ease * 0.5,
          angle:   angle,
          mass:    1.0,
          fixed:   r === 0, // fila superior fija (costura del cuello/cintura)
          row:     r,
          col:     c,
        };
        _clothParticles.push(particle);
      }
    }

    // Crear restricciones estructurales
    const stride = cols + 1;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const idx = r * stride + c;

        // Horizontal (entre columnas adyacentes)
        if (c < cols) {
          const d = _clothParticles[idx].pos.distanceTo(_clothParticles[idx + 1].pos);
          _clothConstraints.push({ a: idx, b: idx + 1, rest: d, stiffness: 0.9 });
        }

        // Vertical (entre filas adyacentes)
        if (r < rows) {
          const d = _clothParticles[idx].pos.distanceTo(_clothParticles[idx + stride].pos);
          _clothConstraints.push({ a: idx, b: idx + stride, rest: d, stiffness: 0.9 });
        }

        // Diagonal (resistencia al cizallamiento)
        if (r < rows && c < cols) {
          const d = _clothParticles[idx].pos.distanceTo(_clothParticles[idx + stride + 1].pos);
          _clothConstraints.push({ a: idx, b: idx + stride + 1, rest: d, stiffness: 0.5 });
        }
      }
    }

    // Crear geometría de la tela (TriangleMesh)
    const clothGeo = new THREE.BufferGeometry();
    const positions = new Float32Array((rows + 1) * (cols + 1) * 3);
    const indices = [];
    const uvs = new Float32Array((rows + 1) * (cols + 1) * 2);

    // Índices de los triángulos
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = r * stride + c;
        const b = a + 1;
        const d = a + stride;
        const e = d + 1;
        indices.push(a, d, b);
        indices.push(b, d, e);
      }
    }

    clothGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    clothGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    clothGeo.setIndex(indices);

    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      roughness: 0.5,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      wireframe: isWireframe,
    });

    const clothMesh = new THREE.Mesh(clothGeo, clothMat);
    clothMesh.castShadow = true;
    clothMesh.name = 'cloth';
    clothGroup.add(clothMesh);

    // Líneas de hilo rojo/azul encima de la tela
    _addGrainLinesOnCloth(rows, cols, stride, garmentType);

    // Inicializar posiciones
    _updateClothGeometry();

    return clothMesh;
  }

  function _addGrainLinesOnCloth(rows, cols, stride, garmentType) {
    const redMat  = new THREE.LineBasicMaterial({ color: 0xf87171, opacity: 0.7, transparent: true });
    const blueMat = new THREE.LineBasicMaterial({ color: 0x60a5fa, opacity: 0.7, transparent: true });

    // Líneas verticales rojas (cada 3 columnas)
    for (let c = 0; c <= cols; c += 3) {
      const pts = [];
      for (let r = 0; r <= rows; r++) {
        const p = _clothParticles[r * (cols + 1) + c];
        pts.push(p.pos.clone());
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, redMat);
      line.name = 'grainRed_' + c;
      clothGroup.add(line);
    }

    // Líneas diagonales azules (cada 3 columnas, desplazadas)
    for (let c = 1; c <= cols; c += 3) {
      const pts = [];
      for (let r = 0; r <= rows; r++) {
        const cc = (c + Math.floor(r * 0.5)) % (cols + 1);
        const p = _clothParticles[r * (cols + 1) + cc];
        pts.push(p.pos.clone());
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, blueMat);
      line.name = 'grainBlue_' + c;
      clothGroup.add(line);
    }
  }

  // ─── Actualizar posiciones de la geometría desde las partículas ──
  function _updateClothGeometry() {
    const clothMesh = clothGroup.getObjectByName('cloth');
    if (!clothMesh) return;

    const positions = clothMesh.geometry.attributes.position.array;
    _clothParticles.forEach((p, i) => {
      positions[i * 3]     = p.pos.x;
      positions[i * 3 + 1] = p.pos.y;
      positions[i * 3 + 2] = p.pos.z;
    });
    clothMesh.geometry.attributes.position.needsUpdate = true;
    clothMesh.geometry.computeVertexNormals();

    // Actualizar líneas de hilo
    _updateGrainLines();
  }

  function _updateGrainLines() {
    const cols = CLOTH_COLS;
    const rows = CLOTH_ROWS;
    const stride = cols + 1;

    clothGroup.children.forEach(child => {
      if (!child.name || !child.name.startsWith('grain')) return;
      const isRed = child.name.startsWith('grainRed');
      const c = parseInt(child.name.split('_')[1]);

      const pts = [];
      for (let r = 0; r <= rows; r++) {
        let cc = c;
        if (!isRed) cc = (c + Math.floor(r * 0.5)) % stride;
        if (cc >= stride) cc = stride - 1;
        const p = _clothParticles[r * stride + cc];
        if (p) pts.push(p.pos.clone());
      }

      if (pts.length > 1) {
        const newGeo = new THREE.BufferGeometry().setFromPoints(pts);
        child.geometry.dispose();
        child.geometry = newGeo;
      }
    });
  }

  // ─── STEP DE SIMULACIÓN ─────────────────────────────────────
  function _simulationStep() {
    if (!_simRunning || _clothParticles.length === 0) return;

    const dt = DT;
    const gravity = new THREE.Vector3(0, -4.5, 0); // gravedad suavizada

    // 1. Integración de Verlet
    _clothParticles.forEach(p => {
      if (p.fixed) return;

      const vel = new THREE.Vector3().subVectors(p.pos, p.prevPos);

      // Amortiguación (simula fricción del aire)
      vel.multiplyScalar(0.98);

      // Guardar posición anterior
      p.prevPos.copy(p.pos);

      // Aplicar gravedad
      p.pos.add(vel);
      p.pos.addScaledVector(gravity, dt * dt);
    });

    // 2. Resolver restricciones (SOLVER_ITERATIONS veces)
    for (let iter = 0; iter < SOLVER_ITERATIONS; iter++) {
      _clothConstraints.forEach(c => {
        const pa = _clothParticles[c.a];
        const pb = _clothParticles[c.b];

        const diff = new THREE.Vector3().subVectors(pb.pos, pa.pos);
        const dist = diff.length();
        if (dist === 0) return;

        const error = (dist - c.rest) / dist;
        const correction = diff.multiplyScalar(error * c.stiffness * 0.5);

        if (!pa.fixed) pa.pos.add(correction);
        if (!pb.fixed) pb.pos.sub(correction);
      });

      // 3. Colisión con el cuerpo (cilindro simplificado)
      _solveBodyCollision();
    }

    // 4. Suavizado final hacia posición objetivo (da sensación de "ajuste")
    _simStep++;
    const blend = Math.min(_simStep / 120, 1); // 120 frames para asentarse

    _clothParticles.forEach(p => {
      if (p.fixed) return;

      // Atraer suavemente hacia la posición objetivo
      const targetX = Math.cos(p.angle) * p.targetR;
      const targetZ = Math.sin(p.angle) * p.targetR;
      const attraction = 0.015 * blend;
      p.pos.x += (targetX - p.pos.x) * attraction;
      p.pos.z += (targetZ - p.pos.z) * attraction;
      p.pos.y += (p.targetY - p.pos.y) * attraction * 0.5;
    });

    // Actualizar geometría
    _updateClothGeometry();

    // Parar simulación cuando esté asentada
    if (_simStep > 300) {
      _simRunning = false;
      _simStep = 0;
      _updateSimBtn(false);
      console.log('[Sim] Simulación completada ✓');
    }
  }

  // ─── COLISIÓN CON EL CUERPO ─────────────────────────────────
  // Simplificado: el cuerpo es aproximado como una serie de cilindros/esferas
  function _solveBodyCollision() {
    if (!_currentRadii) return;
    const r = _currentRadii;

    // Tabla de colisión: [yMin, yMax, radio del cuerpo en esa zona]
    const zones = [
      { y0: H.floor,  y1: H.knee,    rad: r.rHip * 0.30 },
      { y0: H.knee,   y1: H.crotch,  rad: r.rHip * 0.42 },
      { y0: H.crotch, y1: H.hip,     rad: r.rHip * 0.96 },
      { y0: H.hip,    y1: H.waist,   rad: r.rWaist * 1.05 },
      { y0: H.waist,  y1: H.bust,    rad: r.rBust * 0.97 },
      { y0: H.bust,   y1: H.shoulder,rad: r.rBust * 0.90 },
      { y0: H.shoulder,y1:H.neckBot, rad: r.rNeck * 1.4 },
    ];

    _clothParticles.forEach(p => {
      if (p.fixed) return;

      // Encontrar la zona correspondiente
      const zone = zones.find(z => p.pos.y >= z.y0 && p.pos.y < z.y1);
      if (!zone) return;

      // Distancia del eje Y al punto
      const dx = p.pos.x, dz = p.pos.z;
      const dist2D = Math.sqrt(dx*dx + dz*dz);
      const minDist = zone.rad + 0.008; // margen de tela

      if (dist2D < minDist && dist2D > 0.001) {
        // Empujar la partícula hacia afuera
        const factor = minDist / dist2D;
        p.pos.x *= factor;
        p.pos.z *= factor;
        // También corregir la posición anterior para evitar vibración
        p.prevPos.x = p.pos.x;
        p.prevPos.z = p.pos.z;
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  // LÍNEAS DE MEDIDA ESTILO CLO
  // ════════════════════════════════════════════════════════════
  function _buildMeasureLines(m, radii) {
    while (measureGroup.children.length) {
      const c = measureGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      measureGroup.remove(c);
    }

    const lines = [
      { name:'bust',     y:H.bust,    r:radii.rBust,     color:0xf59e0b, label:'Busto',   value:m.bust },
      { name:'waist',    y:H.waist,   r:radii.rWaist,    color:0xf59e0b, label:'Cintura', value:m.waist },
      { name:'hip',      y:H.hip,     r:radii.rHip,      color:0xf59e0b, label:'Cadera',  value:m.hip },
      { name:'shoulder', y:H.shoulder,r:radii.rShoulder, color:0x60a5fa, label:'Hombros', value:m.shoulder },
    ];

    lines.forEach(ln => _addCircleLine(ln.y, ln.r, ln.color, ln.name === _activeMeasureLine));
  }

  function _addCircleLine(y, radius, color, isActive) {
    const segments = 64;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle)*radius, y, Math.sin(angle)*radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: isActive ? 0xfbbf24 : color,
      opacity: isActive ? 1.0 : 0.5,
      transparent: true,
    });
    measureGroup.add(new THREE.Line(geo, mat));

    if (isActive) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-radius*1.8, y, 0),
        new THREE.Vector3(radius*1.8, y, 0),
      ]);
      measureGroup.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color:0xfbbf24 })));
    }
  }

  // ════════════════════════════════════════════════════════════
  // UI — PANEL LATERAL + BOTÓN SIMULACIÓN
  // ════════════════════════════════════════════════════════════
  function _injectUI() {
    if (document.getElementById('clo-styles')) return;

    const style = document.createElement('style');
    style.id = 'clo-styles';
    style.textContent = `
      #clo-panel {
        position:absolute;right:0;top:0;bottom:0;width:190px;
        background:rgba(10,10,20,.93);border-left:1px solid #2e2e45;
        display:flex;flex-direction:column;backdrop-filter:blur(10px);z-index:10;
      }
      #clo-panel-title {
        padding:11px 13px;font-size:10px;font-weight:700;letter-spacing:1px;
        text-transform:uppercase;color:#a78bfa;
        border-bottom:1px solid #2e2e45;display:flex;align-items:center;gap:6px;flex-shrink:0;
      }
      #clo-panel-body { flex:1;overflow-y:auto;padding:6px }
      .clo-section { font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#5a5678;padding:10px 6px 4px }
      .clo-m-row {
        display:flex;align-items:center;justify-content:space-between;
        padding:7px 8px;border-radius:6px;cursor:pointer;transition:all .15s;margin-bottom:2px;
        border:1px solid transparent;
      }
      .clo-m-row:hover { background:#2a2a3e;border-color:#3d3d58 }
      .clo-m-row.active { background:rgba(251,191,36,.1);border-color:rgba(251,191,36,.4) }
      .clo-m-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0 }
      .clo-m-name { font-size:11px;color:#9490b0;flex:1;margin-left:7px }
      .clo-m-val { font-size:12px;font-weight:700;color:#ede9fe;font-family:monospace }
      .clo-m-unit { font-size:9px;color:#5a5678;margin-left:2px }
      #clo-active-lbl {
        margin:6px;padding:9px 10px;
        background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.35);
        border-radius:7px;font-size:13px;font-weight:800;color:#fbbf24;
        text-align:center;display:none;font-family:monospace;
      }
      #clo-panel-foot { padding:8px;border-top:1px solid #2e2e45;display:flex;flex-direction:column;gap:6px;flex-shrink:0 }
      .clo-btn {
        width:100%;padding:8px;background:transparent;border:1px solid #3d3d58;
        color:#9490b0;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;
        font-family:var(--font,'Segoe UI');transition:all .15s;
        display:flex;align-items:center;justify-content:center;gap:6px;
      }
      .clo-btn:hover { background:#2a2a3e;color:#ede9fe }
      .clo-btn.on { background:rgba(139,92,246,.15);border-color:#8b5cf6;color:#a78bfa }
      #clo-sim-btn {
        background:linear-gradient(135deg,rgba(52,211,153,.15),rgba(16,185,129,.08));
        border-color:rgba(52,211,153,.4);color:#34d399;font-size:12px;font-weight:700;
        padding:10px;
      }
      #clo-sim-btn:hover { background:rgba(52,211,153,.25) }
      #clo-sim-btn.running {
        background:linear-gradient(135deg,rgba(251,191,36,.15),rgba(245,158,11,.08));
        border-color:rgba(251,191,36,.4);color:#fbbf24;
        animation:simPulse 1s ease-in-out infinite;
      }
      @keyframes simPulse { 0%,100%{opacity:1}50%{opacity:.7} }
      #clo-sim-progress {
        height:3px;background:#1c1c2a;border-radius:2px;overflow:hidden;margin:0 8px 6px;display:none;
      }
      #clo-sim-bar { height:100%;width:0%;background:linear-gradient(90deg,#34d399,#8b5cf6);transition:width .1s;border-radius:2px }

      /* Ajustar canvas */
      #three-canvas { width:calc(100% - 190px) !important }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'clo-panel';
    panel.innerHTML = `
      <div id="clo-panel-title">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        Medidas de Avatar
      </div>
      <div id="clo-panel-body">
        <div id="clo-active-lbl"></div>
        <div class="clo-section">Contornos</div>
        <div class="clo-m-row" data-key="bust"><div class="clo-m-dot" style="background:#f59e0b"></div><span class="clo-m-name">Busto</span><span class="clo-m-val" id="clov-bust">88</span><span class="clo-m-unit">cm</span></div>
        <div class="clo-m-row" data-key="waist"><div class="clo-m-dot" style="background:#f59e0b"></div><span class="clo-m-name">Cintura</span><span class="clo-m-val" id="clov-waist">68</span><span class="clo-m-unit">cm</span></div>
        <div class="clo-m-row" data-key="hip"><div class="clo-m-dot" style="background:#f59e0b"></div><span class="clo-m-name">Cadera Baja</span><span class="clo-m-val" id="clov-hip">94</span><span class="clo-m-unit">cm</span></div>
        <div class="clo-section">Anchuras</div>
        <div class="clo-m-row" data-key="shoulder"><div class="clo-m-dot" style="background:#60a5fa"></div><span class="clo-m-name">Hombros</span><span class="clo-m-val" id="clov-shoulder">38</span><span class="clo-m-unit">cm</span></div>
        <div class="clo-m-row" data-key="neck"><div class="clo-m-dot" style="background:#60a5fa"></div><span class="clo-m-name">Cuello</span><span class="clo-m-val" id="clov-neck">36</span><span class="clo-m-unit">cm</span></div>
        <div class="clo-section">Largos</div>
        <div class="clo-m-row" data-key="backLength"><div class="clo-m-dot" style="background:#34d399"></div><span class="clo-m-name">Talle esp.</span><span class="clo-m-val" id="clov-backLength">40</span><span class="clo-m-unit">cm</span></div>
        <div class="clo-m-row" data-key="sleeveLength"><div class="clo-m-dot" style="background:#34d399"></div><span class="clo-m-name">Largo manga</span><span class="clo-m-val" id="clov-sleeveLength">60</span><span class="clo-m-unit">cm</span></div>
      </div>
      <div id="clo-sim-progress"><div id="clo-sim-bar"></div></div>
      <div id="clo-panel-foot">
        <button id="clo-sim-btn" class="clo-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Simular tela
        </button>
        <button id="clo-wire-btn" class="clo-btn">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          Wireframe
        </button>
        <button id="clo-reset-btn" class="clo-btn">⌂ Reset cámara</button>
      </div>
    `;

    const view3d = document.getElementById('view-3d');
    if (view3d) {
      view3d.style.position = 'relative';
      view3d.appendChild(panel);
    }

    // Eventos del panel
    panel.querySelectorAll('.clo-m-row').forEach(row => {
      row.addEventListener('mouseenter', function() {
        _activeMeasureLine = this.dataset.key;
        _refreshMeasureLines();
        _highlightRow(this.dataset.key);
      });
      row.addEventListener('mouseleave', function() {
        _activeMeasureLine = null;
        _refreshMeasureLines();
        _clearHighlight();
      });
      row.addEventListener('click', function() {
        const input = document.querySelector(`[data-measure="${this.dataset.key}"]`);
        if (input) {
          const sb = document.getElementById('sidebar');
          if (sb && sb.classList.contains('collapsed')) sb.classList.remove('collapsed');
          input.focus(); input.select();
        }
      });
    });

    // Botón Simular
    document.getElementById('clo-sim-btn').addEventListener('click', _startSimulation);

    // Wireframe
    document.getElementById('clo-wire-btn').addEventListener('click', function() {
      this.classList.toggle('on');
      toggleWireframe();
    });

    // Reset
    document.getElementById('clo-reset-btn').addEventListener('click', resetCamera);

    // Ocultar botones antiguos del ctrl-3d
    const oldCtrl = document.getElementById('ctrl-3d');
    if (oldCtrl) oldCtrl.style.display = 'none';
  }

  function _startSimulation() {
    if (_simRunning) return;
    if (_clothParticles.length === 0 && _currentRadii) {
      // Reinicializar tela
      const m = Object.assign({
        bust:88,waist:68,hip:94,shoulder:38,neck:36,
        backLength:40,sleeveLength:60,skirtLength:60,hipDepth:20
      }, _currentMeasures);
      _initCloth(_currentGarment, _currentRadii, m);
    }

    // Resetear posiciones al estado inicial
    _resetClothPositions();

    _simRunning = true;
    _simStep = 0;
    _updateSimBtn(true);

    const progressBar = document.getElementById('clo-sim-bar');
    const progress = document.getElementById('clo-sim-progress');
    if (progress) progress.style.display = 'block';

    console.log('[Sim] Iniciando simulación de tela...');
  }

  function _resetClothPositions() {
    const cols = CLOTH_COLS;
    const rows = CLOTH_ROWS;
    _clothParticles.forEach((p, i) => {
      const t = p.row / rows;
      const startY = p.targetY + 0.5 + t * 0.1;
      p.pos.set(Math.cos(p.angle) * (p.targetR + 0.04), startY, Math.sin(p.angle) * (p.targetR + 0.04));
      p.prevPos.copy(p.pos);
    });
  }

  function _updateSimBtn(running) {
    const btn = document.getElementById('clo-sim-btn');
    if (!btn) return;
    if (running) {
      btn.classList.add('running');
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Simulando…`;
    } else {
      btn.classList.remove('running');
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Simular tela`;
      const progress = document.getElementById('clo-sim-progress');
      if (progress) progress.style.display = 'none';
    }
  }

  function _highlightRow(key) {
    document.querySelectorAll('.clo-m-row').forEach(r => r.classList.toggle('active', r.dataset.key === key));
    const el = document.getElementById('clo-active-lbl');
    if (el && _currentMeasures[key]) {
      const labels = { bust:'Busto', waist:'Cintura', hip:'Cadera', shoulder:'Hombros', neck:'Cuello', backLength:'Talle esp.', sleeveLength:'Largo manga' };
      el.textContent = `${labels[key]||key}: ${_currentMeasures[key]} cm`;
      el.style.display = 'block';
    }
  }

  function _clearHighlight() {
    document.querySelectorAll('.clo-m-row').forEach(r => r.classList.remove('active'));
    const el = document.getElementById('clo-active-lbl');
    if (el) el.style.display = 'none';
  }

  function _updatePanelValues(m) {
    ['bust','waist','hip','shoulder','neck','backLength','sleeveLength'].forEach(k => {
      const el = document.getElementById('clov-' + k);
      if (el && m[k] !== undefined) el.textContent = m[k];
    });
  }

  function _refreshMeasureLines() {
    if (_currentRadii) _buildMeasureLines(_currentMeasures, _currentRadii);
  }

  // ════════════════════════════════════════════════════════════
  // UPDATE PRINCIPAL
  // ════════════════════════════════════════════════════════════
  function updateGarment(garmentType, measures, params) {
    const m = Object.assign({
      bust:88, waist:68, hip:94, shoulder:38, neck:36,
      backLength:40, frontLength:42, totalLength:65,
      sleeveLength:60, wrist:16, skirtLength:60, hipDepth:20
    }, measures);

    _currentMeasures = m;
    _currentGarment  = garmentType;

    const radii = _buildBody(m);
    _currentRadii = radii;

    _updatePanelValues(m);
    _buildMeasureLines(m, radii);

    // Limpiar prenda 3D estática anterior
    while (garmentGroup.children.length) {
      const c = garmentGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      garmentGroup.remove(c);
    }

    // Crear tela simulada
    _simRunning = false;
    _simStep = 0;
    _initCloth(garmentType, radii, m);

    // Auto-iniciar simulación después de un pequeño delay
    setTimeout(() => {
      _startSimulation();
    }, 300);
  }

  // ════════════════════════════════════════════════════════════
  // CONTROLES
  // ════════════════════════════════════════════════════════════
  function toggleWireframe() {
    isWireframe = !isWireframe;
    clothGroup.traverse(c => {
      if (!c.isMesh) return;
      c.material.wireframe = isWireframe;
    });
  }

  function resetCamera() {
    camera.position.set(0, 0.9, 3.0);
    controls.target.set(0, 0.82, 0);
    controls.update();
  }

  function _onResize() {
    if (!_canvas || !renderer) return;
    const w = _canvas.clientWidth, h = _canvas.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function _animate() {
    _animId = requestAnimationFrame(_animate);

    // Ejecutar simulación si está activa
    if (_simRunning) {
      _simulationStep();

      // Actualizar barra de progreso
      const bar = document.getElementById('clo-sim-bar');
      if (bar) bar.style.width = Math.min((_simStep / 300) * 100, 100) + '%';
    }

    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function destroy() {
    if (_animId) cancelAnimationFrame(_animId);
    window.removeEventListener('resize', _onResize);
    if (renderer) renderer.dispose();
    _initialized = false;
  }

  return { init, updateGarment, toggleWireframe, resetCamera, destroy };
})();
