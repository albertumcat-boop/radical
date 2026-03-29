'use strict';
window.PAT = window.PAT || {};

PAT.Mannequin3D = (function () {

  let scene, camera, renderer, controls;
  let bodyGroup, garmentGroup;
  let isWireframe  = false;
  let _canvas      = null;
  let _animId      = null;
  let _initialized = false;

  // ── Proporciones fijas del maniquí (en unidades Three.js) ──────
  // Maniquí total = 1.65 unidades de alto
  // Las medidas del usuario solo afectan los radios (contornos)
  const H = {
    total:    1.65,
    floor:    0.00,
    ankle:    0.08,
    knee:     0.40,
    crotch:   0.50,   // inicio cadera
    hip:      0.60,   // nivel máximo cadera
    waist:    0.74,
    underbust:0.82,
    bust:     0.88,
    shoulder: 0.97,
    neckBot:  1.02,
    neckTop:  1.09,
    chin:     1.14,
    headCtr:  1.24,
    headTop:  1.37,
  };

  // ── Convertir medida (cm) a radio Three.js ─────────────────────
  // circunferencia cm → radio = circ / (2π) / 100
  function cmToRadius(circ_cm) {
    return circ_cm / (2 * Math.PI * 100);
  }

  // ─── INIT ──────────────────────────────────────────────────────
  function init(canvasEl) {
    if (_initialized || !canvasEl) return;
    _canvas = canvasEl;

    const W = canvasEl.clientWidth  || 800;
    const Ht = canvasEl.clientHeight || 600;

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, Ht);
    renderer.setClearColor(0x06060e, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x06060e, 6, 20);

    camera = new THREE.PerspectiveCamera(38, W / Ht, 0.01, 40);
    camera.position.set(0, 0.9, 3.0);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance   = 0.5;
    controls.maxDistance   = 6;
    controls.target.set(0, 0.82, 0);
    controls.update();

    _buildScene();

    bodyGroup    = new THREE.Group();
    garmentGroup = new THREE.Group();
    scene.add(bodyGroup);
    scene.add(garmentGroup);

    window.addEventListener('resize', _onResize);
    _animate();
    _initialized = true;
    console.log('[3D] Iniciado ✓');
  }

  function _buildScene() {
    // Suelo
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3, 48),
      new THREE.MeshStandardMaterial({ color: 0x0c0c1a, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid sutil
    scene.add(new THREE.GridHelper(6, 30, 0x1a1a35, 0x111125));

    // Luces
    scene.add(new THREE.AmbientLight(0xeeeeff, 0.45));

    const key = new THREE.DirectionalLight(0xfff5ee, 1.1);
    key.position.set(2, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x7c3aed, 0.55);
    rim.position.set(-2, 3, -2);
    scene.add(rim);

    const fill = new THREE.DirectionalLight(0x60a5fa, 0.25);
    fill.position.set(1, 0, 3);
    scene.add(fill);

    // Base de maniquí
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a30, metalness: 0.7, roughness: 0.3
    });
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.25, 0.035, 40), baseMat
    );
    disc.position.y = 0.018;
    disc.receiveShadow = true;
    scene.add(disc);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.50, 12), baseMat
    );
    pole.position.y = 0.285;
    scene.add(pole);
  }

  // ─── CONSTRUIR CUERPO ──────────────────────────────────────────
  // Retorna los radios usados para posicionar la prenda
  function _buildBody(m) {
    // Limpiar
    while (bodyGroup.children.length) {
      const c = bodyGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      bodyGroup.remove(c);
    }

    // Radios desde medidas del usuario
    const rBust    = cmToRadius(m.bust);
    const rWaist   = cmToRadius(m.waist);
    const rHip     = cmToRadius(m.hip);
    const rNeck    = cmToRadius(m.neck);
    const rShoulder= (m.shoulder / 100) / 2;  // ancho total / 2

    const skin = new THREE.MeshStandardMaterial({
      color: 0xc4956a, roughness: 0.68, metalness: 0.03
    });

    // Función auxiliar: añadir cilindro entre dos alturas Y
    function addCyl(rTop, rBot, yBot, yTop, mat, castShadow) {
      const h    = yTop - yBot;
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(rTop, rBot, h, 24, 1),
        mat || skin
      );
      mesh.position.y = yBot + h / 2;
      if (castShadow !== false) mesh.castShadow = true;
      bodyGroup.add(mesh);
      return mesh;
    }

    function addSphere(r, y, mat) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), mat || skin);
      mesh.position.y = y;
      mesh.castShadow = true;
      bodyGroup.add(mesh);
      return mesh;
    }

    // ── Piernas ────────────────────────────────────────────────
    const legLX = rHip * 0.55;  // separación lateral
    [-legLX, legLX].forEach(lx => {
      // Pie
      const footGeo = new THREE.BoxGeometry(rHip * 0.5, H.ankle, rHip * 1.4);
      const foot    = new THREE.Mesh(footGeo, skin);
      foot.position.set(lx, H.ankle / 2, rHip * 0.3);
      foot.castShadow = true;
      bodyGroup.add(foot);

      // Pantorrilla (tobillo → rodilla)
      const calfT = rHip * 0.22;
      const calfB = rHip * 0.19;
      const calfH = H.knee - H.ankle;
      const calf  = new THREE.Mesh(
        new THREE.CylinderGeometry(calfT, calfB, calfH, 18), skin
      );
      calf.position.set(lx, H.ankle + calfH / 2, 0);
      calf.castShadow = true;
      bodyGroup.add(calf);

      // Rodilla
      addSphere(rHip * 0.24, H.knee, skin);

      // Muslo (rodilla → entrepierna)
      const thighH = H.crotch - H.knee;
      const thigh  = new THREE.Mesh(
        new THREE.CylinderGeometry(rHip * 0.40, rHip * 0.26, thighH, 20), skin
      );
      thigh.position.set(lx, H.knee + thighH / 2, 0);
      thigh.castShadow = true;
      bodyGroup.add(thigh);
    });

    // ── Pelvis / cadera ───────────────────────────────────────
    // Cilindro de entrepierna a cintura con forma de cadera
    const pelvPts = [
      new THREE.Vector2(rHip * 0.90, 0),
      new THREE.Vector2(rHip,         H.hip - H.crotch),
      new THREE.Vector2(rHip * 0.98,  H.hip - H.crotch + 0.02),
      new THREE.Vector2(rWaist * 1.05, H.waist - H.crotch - 0.02),
      new THREE.Vector2(rWaist,        H.waist - H.crotch),
    ];
    const pelvis = new THREE.Mesh(
      new THREE.LatheGeometry(pelvPts, 44), skin
    );
    pelvis.position.y = H.crotch;
    pelvis.castShadow = true;
    bodyGroup.add(pelvis);

    // ── Torso (cintura → hombros) ─────────────────────────────
    const torsoPts = [
      new THREE.Vector2(rWaist,         0),
      new THREE.Vector2(rWaist * 1.04,  0.03),
      new THREE.Vector2(rBust  * 0.96,  H.underbust - H.waist),
      new THREE.Vector2(rBust,           H.bust      - H.waist),
      new THREE.Vector2(rBust  * 0.94,  H.bust      - H.waist + 0.03),
      new THREE.Vector2(rShoulder * 0.88,H.shoulder  - H.waist - 0.01),
      new THREE.Vector2(rShoulder * 0.75,H.shoulder  - H.waist),
      new THREE.Vector2(rNeck * 1.4,    H.neckBot   - H.waist),
    ];
    const torso = new THREE.Mesh(
      new THREE.LatheGeometry(torsoPts, 44), skin
    );
    torso.position.y = H.waist;
    torso.castShadow = true;
    bodyGroup.add(torso);

    // ── Cuello ────────────────────────────────────────────────
    const neckH = H.neckTop - H.neckBot;
    const neck  = new THREE.Mesh(
      new THREE.CylinderGeometry(rNeck, rNeck * 1.2, neckH, 20), skin
    );
    neck.position.y = H.neckBot + neckH / 2;
    neck.castShadow = true;
    bodyGroup.add(neck);

    // ── Cabeza ────────────────────────────────────────────────
    const headR = rNeck * 2.05;
    addSphere(headR, H.headCtr, skin);

    // Nariz (pequeño punto)
    const noseGeo = new THREE.SphereGeometry(rNeck * 0.18, 10, 8);
    const nose    = new THREE.Mesh(noseGeo, skin);
    nose.position.set(0, H.headCtr, headR * 0.92);
    bodyGroup.add(nose);

    // ── Brazos ────────────────────────────────────────────────
    const aTopR = rBust * 0.27;
    const aMidR = rBust * 0.20;
    const aBotR = rBust * 0.15;
    const upperArmH = 0.24;
    const foreArmH  = 0.22;
    const ang = 0.32; // radianes de apertura

    [-1, 1].forEach(side => {
      const ax = side * rShoulder;

      // Hombro
      addSphere(aTopR * 0.95, H.shoulder, skin);

      // Brazo superior
      const uArm = new THREE.Mesh(
        new THREE.CylinderGeometry(aMidR, aTopR, upperArmH, 16), skin
      );
      uArm.position.set(
        ax + side * Math.sin(ang) * upperArmH * 0.5,
        H.shoulder - Math.cos(ang) * upperArmH * 0.5,
        0
      );
      uArm.rotation.z = side * ang;
      uArm.castShadow = true;
      bodyGroup.add(uArm);

      // Codo
      const elbowX = ax + side * Math.sin(ang) * upperArmH;
      const elbowY = H.shoulder - Math.cos(ang) * upperArmH;
      const elbowSph = new THREE.Mesh(
        new THREE.SphereGeometry(aMidR * 1.05, 14, 10), skin
      );
      elbowSph.position.set(elbowX, elbowY, 0);
      bodyGroup.add(elbowSph);

      // Antebrazo
      const ang2 = side * 0.18;
      const fArm = new THREE.Mesh(
        new THREE.CylinderGeometry(aBotR, aMidR, foreArmH, 16), skin
      );
      fArm.position.set(
        elbowX + side * Math.sin(Math.abs(ang2)) * foreArmH * 0.5,
        elbowY - Math.cos(ang2) * foreArmH * 0.5,
        0
      );
      fArm.rotation.z = ang2;
      fArm.castShadow = true;
      bodyGroup.add(fArm);
    });

    return { rBust, rWaist, rHip, rNeck, rShoulder };
  }

  // ─── PRENDA 3D ────────────────────────────────────────────────
  function updateGarment(garmentType, measures, params) {
    // Usar defaults si faltan medidas
    const m = Object.assign({}, {
      bust: 88, waist: 68, hip: 94, shoulder: 38, neck: 36,
      backLength: 40, frontLength: 42, totalLength: 65,
      sleeveLength: 60, wrist: 16, skirtLength: 60, hipDepth: 20
    }, measures);

    // Reconstruir cuerpo
    const radii = _buildBody(m);

    // Limpiar prenda anterior
    while (garmentGroup.children.length) {
      const c = garmentGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      garmentGroup.remove(c);
    }

    // Radios de la prenda = radios del cuerpo + holgura
    const EASE = 0.008; // holgura de tela ~8mm
    const bR = radii.rBust    + EASE;
    const wR = radii.rWaist   + EASE * 0.8;
    const hR = radii.rHip     + EASE;
    const nR = radii.rNeck    + EASE * 0.5;
    const sR = radii.rShoulder;

    // Largo de manga en unidades Three.js
    const sleeveLen = m.sleeveLength / 100;

    const gMat = new THREE.MeshStandardMaterial({
      color:       0x7c3aed,
      roughness:   0.60,
      metalness:   0.06,
      transparent: true,
      opacity:     isWireframe ? 0.5 : 0.86,
      side:        THREE.DoubleSide,
      wireframe:   isWireframe,
    });

    switch (garmentType) {

      case 'franela':
        _garmentTorso(bR, wR, hR, nR, H.crotch, H.neckBot, gMat);
        _garmentSleeves(bR, sR, H.shoulder, sleeveLen * 0.55, gMat);
        break;

      case 'blusa':
        _garmentTorso(bR, wR, hR, nR, H.crotch, H.neckBot, gMat);
        _garmentSleeves(bR, sR, H.shoulder, sleeveLen * 0.95, gMat);
        break;

      case 'camisa':
        _garmentTorso(bR*1.02, wR*1.02, hR*1.02, nR, H.crotch, H.neckBot, gMat);
        _garmentSleeves(bR*1.02, sR, H.shoulder, sleeveLen, gMat);
        _garmentCollar(nR, H.neckBot, H.neckTop + 0.03, gMat);
        _garmentCuffs(bR * 0.18, H.shoulder - sleeveLen - 0.01, gMat);
        break;

      case 'falda':
        _garmentSkirt(wR, hR, H.waist, m.skirtLength / 100, m.hipDepth / 100, gMat);
        _garmentWaistband(wR, H.waist, gMat);
        break;

      case 'vestido':
        _garmentTorso(bR, wR, hR, nR, H.crotch, H.neckBot, gMat);
        _garmentSkirt(hR, hR * 1.02, H.crotch, m.skirtLength / 100, 0.05, gMat);
        break;
    }
  }

  // ── Torso de prenda (de hem inferior a escote) ─────────────────
  function _garmentTorso(bR, wR, hR, nR, yBottom, yTop, mat) {
    const h = yTop - yBottom;
    const pts = [
      new THREE.Vector2(hR,          0),
      new THREE.Vector2(hR * 0.96,   h * 0.08),
      new THREE.Vector2(wR * 1.05,   h * 0.28),
      new THREE.Vector2(wR,           h * 0.36),
      new THREE.Vector2(wR * 1.04,   h * 0.44),
      new THREE.Vector2(bR * 0.96,   h * 0.60),
      new THREE.Vector2(bR,           h * 0.68),
      new THREE.Vector2(bR * 0.92,   h * 0.82),
      new THREE.Vector2(nR * 1.5,    h * 0.94),
      new THREE.Vector2(nR * 1.1,    h),
    ];
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 52), mat);
    mesh.position.y = yBottom;
    mesh.castShadow = true;
    garmentGroup.add(mesh);
  }

  // ── Mangas ─────────────────────────────────────────────────────
  function _garmentSleeves(bR, sR, shoulderY, sleeveLen, mat) {
    const topR = bR * 0.52;
    const botR = bR * 0.24;
    const ang  = 0.32;

    [-1, 1].forEach(side => {
      // Cabeza de manga (tapón superior)
      const capGeo = new THREE.SphereGeometry(topR, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
      const cap    = new THREE.Mesh(capGeo, mat);
      cap.position.set(side * (sR + topR * 0.1), shoulderY, 0);
      garmentGroup.add(cap);

      // Tubo de manga
      const geo  = new THREE.CylinderGeometry(botR, topR, sleeveLen, 22, 1, true);
      const mesh = new THREE.Mesh(geo, mat);
      const cx   = side * (sR + topR * 0.15 + Math.sin(ang) * sleeveLen * 0.5);
      const cy   = shoulderY - Math.cos(ang) * sleeveLen * 0.5;
      mesh.position.set(cx, cy, 0);
      mesh.rotation.z = side * ang;
      mesh.castShadow = true;
      garmentGroup.add(mesh);
    });
  }

  // ── Cuello camisero ────────────────────────────────────────────
  function _garmentCollar(nR, yBot, yTop, mat) {
    const h = yTop - yBot;
    // Pie de cuello
    const bandMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(nR * 1.02, nR * 1.08, h * 0.5, 24, 1, true), mat
    );
    bandMesh.position.y = yBot + h * 0.25;
    garmentGroup.add(bandMesh);

    // Pala de cuello (abierta al frente)
    const collarPts = [
      new THREE.Vector2(nR * 1.12, 0),
      new THREE.Vector2(nR * 1.28, h * 0.3),
      new THREE.Vector2(nR * 1.35, h * 0.5),
      new THREE.Vector2(nR * 1.3,  h * 0.7),
      new THREE.Vector2(nR * 1.15, h),
    ];
    const collarMesh = new THREE.Mesh(
      new THREE.LatheGeometry(collarPts, 44, Math.PI * 0.1, Math.PI * 1.8), mat
    );
    collarMesh.position.y = yBot + h * 0.5;
    garmentGroup.add(collarMesh);
  }

  // ── Puños ──────────────────────────────────────────────────────
  function _garmentCuffs(r, y, mat) {
    [-1, 1].forEach(side => {
      const ang = side * 0.32;
      const cx  = side * (0.19 + r * 0.5 + Math.sin(0.32) * 0.46 * 0.9);
      const cy  = y;
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.78, r * 0.82, 0.025, 18, 1, false), mat
      );
      mesh.position.set(cx, cy, 0);
      mesh.rotation.z = ang;
      garmentGroup.add(mesh);
    });
  }

  // ── Falda ──────────────────────────────────────────────────────
  function _garmentSkirt(wR, hR, yWaist, skirtLen, hipDepth, mat) {
    const pts = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t   = i / steps;
      const r   = t < (hipDepth / skirtLen)
        ? wR + (hR - wR) * (t / (hipDepth / skirtLen))
        : hR + t * 0.012; // leve vuelo
      pts.push(new THREE.Vector2(r, -t * skirtLen));
    }
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 52), mat);
    mesh.position.y = yWaist;
    mesh.castShadow = true;
    garmentGroup.add(mesh);
  }

  // ── Pretina ────────────────────────────────────────────────────
  function _garmentWaistband(wR, yWaist, mat) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(wR * 1.01, wR * 1.02, 0.03, 36), mat
    );
    mesh.position.y = yWaist + 0.015;
    garmentGroup.add(mesh);
  }

  // ─── CONTROLES ────────────────────────────────────────────────
  function toggleWireframe() {
    isWireframe = !isWireframe;
    garmentGroup.traverse(c => {
      if (!c.isMesh) return;
      c.material.wireframe = isWireframe;
      c.material.opacity   = isWireframe ? 0.5 : 0.86;
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
