'use strict';
window.PAT = window.PAT || {};

PAT.Mannequin3D = (function () {

  let scene, camera, renderer, controls;
  let bodyGroup, garmentGroup;
  let isWireframe  = false;
  let _canvas      = null;
  let _animId      = null;
  let _initialized = false;

  // 1 cm → 0.01 unidades Three.js  (maniquí 170cm = 1.70 unidades)
  const SC = 0.01;

  // ─── INIT ──────────────────────────────────────────────────────
  function init(canvasEl) {
    if (_initialized || !canvasEl) return;
    _canvas = canvasEl;

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvasEl.clientWidth || 800, canvasEl.clientHeight || 600);
    renderer.setClearColor(0x06060e, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x06060e, 8, 25);

    const aspect = (canvasEl.clientWidth || 800) / (canvasEl.clientHeight || 600);
    camera = new THREE.PerspectiveCamera(40, aspect, 0.01, 50);
    camera.position.set(0, 0.95, 3.5);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance   = 0.5;
    controls.maxDistance   = 7;
    controls.target.set(0, 0.85, 0);
    controls.update();

    _setupScene();

    bodyGroup    = new THREE.Group();
    garmentGroup = new THREE.Group();
    scene.add(bodyGroup);
    scene.add(garmentGroup);

    window.addEventListener('resize', _onResize);
    _animate();
    _initialized = true;
    console.log('[3D] Inicializado');
  }

  function _setupScene() {
    // Suelo
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3, 64),
      new THREE.MeshStandardMaterial({ color: 0x0d0d1a, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid
    const grid = new THREE.GridHelper(6, 30, 0x1a1a35, 0x111125);
    grid.position.y = 0.001;
    scene.add(grid);

    // Luces
    scene.add(new THREE.AmbientLight(0xeeeeff, 0.4));

    const key = new THREE.DirectionalLight(0xfff8f0, 1.1);
    key.position.set(2, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x7c3aed, 0.6);
    rim.position.set(-2, 2, -2);
    scene.add(rim);

    const fill = new THREE.DirectionalLight(0x60a5fa, 0.3);
    fill.position.set(1, 0, 3);
    scene.add(fill);

    // Base de maniquí
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e1e35, metalness: 0.7, roughness: 0.3 });
    const disc    = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.04, 40), baseMat);
    disc.position.y = 0.02;
    disc.receiveShadow = true;
    scene.add(disc);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.55, 12), baseMat);
    pole.position.y = 0.29;
    scene.add(pole);
  }

  // ─── MANIQUÍ PARAMÉTRICO ───────────────────────────────────────
  function _buildBody(m) {
    while (bodyGroup.children.length) {
      const c = bodyGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) { if (Array.isArray(c.material)) c.material.forEach(x=>x.dispose()); else c.material.dispose(); }
      bodyGroup.remove(c);
    }

    // Radios reales desde perímetros
    const rBust    = (m.bust    * SC) / (2 * Math.PI);
    const rWaist   = (m.waist   * SC) / (2 * Math.PI);
    const rHip     = (m.hip     * SC) / (2 * Math.PI);
    const rNeck    = (m.neck    * SC) / (2 * Math.PI);
    const rShoulder= (m.shoulder* SC) / 2;

    // Alturas
    const legH   = 0.88;   // piernas: fijo proporcional
    const torsoH = (m.backLength * SC) * 1.6;  // tronco
    const headR  = rNeck * 2.1;
    const neckH  = torsoH * 0.07;

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xc8a882, roughness: 0.72, metalness: 0.04
    });

    // ── Torso (LatheGeometry perfil) ─────────────────────────
    // Puntos de abajo (cadera) hacia arriba (cuello)
    // X = radio, Y = altura relativa al torso
    const tPts = [
      new THREE.Vector2(rHip,            0),
      new THREE.Vector2(rHip * 0.96,     torsoH * 0.04),
      new THREE.Vector2(rHip * 0.88,     torsoH * 0.14),
      new THREE.Vector2(rWaist * 1.08,   torsoH * 0.26),
      new THREE.Vector2(rWaist,          torsoH * 0.34),
      new THREE.Vector2(rWaist * 1.04,   torsoH * 0.42),
      new THREE.Vector2(rBust  * 0.95,   torsoH * 0.56),
      new THREE.Vector2(rBust,            torsoH * 0.65),
      new THREE.Vector2(rBust  * 0.94,   torsoH * 0.76),
      new THREE.Vector2(rShoulder * 0.88,torsoH * 0.88),
      new THREE.Vector2(rNeck  * 1.35,   torsoH * 0.96),
      new THREE.Vector2(rNeck  * 1.1,    torsoH),
    ];

    const torso = new THREE.Mesh(
      new THREE.LatheGeometry(tPts, 52),
      skinMat
    );
    // Posicionar sobre las piernas
    torso.position.y = legH;
    torso.castShadow = true;
    bodyGroup.add(torso);

    // ── Cuello ────────────────────────────────────────────────
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(rNeck, rNeck * 1.15, neckH, 22),
      skinMat
    );
    neck.position.y = legH + torsoH + neckH * 0.4;
    neck.castShadow = true;
    bodyGroup.add(neck);

    // ── Cabeza ────────────────────────────────────────────────
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(headR, 36, 28),
      skinMat
    );
    head.position.y = legH + torsoH + neckH + headR * 0.9;
    head.castShadow = true;
    bodyGroup.add(head);

    // ── Brazos ────────────────────────────────────────────────
    const aTopR = rBust * 0.26;
    const aBotR = rBust * 0.17;
    const armH  = torsoH * 0.48;
    const foreH = torsoH * 0.42;

    [-1, 1].forEach(side => {
      // Punto de origen del hombro
      const sx = side * (rShoulder + aTopR * 0.3);
      const sy = legH + torsoH * 0.84;
      const ang = side * Math.PI / 10;

      const upperArm = new THREE.Mesh(
        new THREE.CylinderGeometry(aBotR, aTopR, armH, 16),
        skinMat
      );
      upperArm.position.set(
        sx + Math.sin(ang) * armH * 0.5,
        sy - Math.cos(ang) * armH * 0.5,
        0
      );
      upperArm.rotation.z = ang;
      upperArm.castShadow = true;
      bodyGroup.add(upperArm);

      const foreArm = new THREE.Mesh(
        new THREE.CylinderGeometry(aBotR * 0.72, aBotR, foreH, 16),
        skinMat
      );
      const ux = sx + Math.sin(ang) * armH;
      const uy = sy - Math.cos(ang) * armH;
      const ang2 = side * Math.PI / 12;
      foreArm.position.set(
        ux + Math.sin(ang2) * foreH * 0.5,
        uy - Math.cos(ang2) * foreH * 0.5,
        0
      );
      foreArm.rotation.z = ang2;
      foreArm.castShadow = true;
      bodyGroup.add(foreArm);
    });

    // ── Pelvis / cadera redondeada ────────────────────────────
    const pelvis = new THREE.Mesh(
      new THREE.SphereGeometry(rHip * 0.8, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5),
      skinMat
    );
    pelvis.position.y = legH - rHip * 0.08;
    pelvis.castShadow = true;
    bodyGroup.add(pelvis);

    // ── Piernas ───────────────────────────────────────────────
    const lTopR = rHip * 0.44;
    const lBotR = rHip * 0.22;
    const thighH = legH * 0.52;
    const calfH  = legH * 0.45;

    [-0.42, 0.42].forEach(side => {
      const lx = side * rHip * 0.56;

      const thigh = new THREE.Mesh(
        new THREE.CylinderGeometry(lBotR, lTopR, thighH, 18),
        skinMat
      );
      thigh.position.set(lx, thighH * 0.5, 0);
      thigh.castShadow = true;
      bodyGroup.add(thigh);

      const calf = new THREE.Mesh(
        new THREE.CylinderGeometry(lBotR * 0.68, lBotR, calfH, 16),
        skinMat
      );
      calf.position.set(lx, thighH + calfH * 0.5, 0);
      calf.castShadow = true;
      bodyGroup.add(calf);

      // Pie simplificado
      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(lBotR * 1.2, lBotR * 0.55, lBotR * 2.8),
        skinMat
      );
      foot.position.set(lx, thighH + calfH + lBotR * 0.27, lBotR * 0.5);
      foot.castShadow = true;
      bodyGroup.add(foot);
    });

    // El bodyGroup queda con piernas en Y=0 → suelo
    return { torsoH, legH, rBust, rWaist, rHip, rNeck, rShoulder };
  }

  // ─── PRENDA ────────────────────────────────────────────────────
  function updateGarment(garmentType, measures, params) {
    const m = Object.assign({}, PAT.DEFAULT_MEASURES, measures);

    // Reconstruir cuerpo con medidas actuales
    const dims = _buildBody(m);

    // Limpiar prenda anterior
    while (garmentGroup.children.length) {
      const c = garmentGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      garmentGroup.remove(c);
    }

    const { torsoH, legH, rBust, rWaist, rHip, rNeck, rShoulder } = dims;

    // Offset del torso: empieza en legH
    const yBase = legH;

    // Radio con holgura para la prenda (encima del cuerpo)
    const bR = rBust   + 0.009;
    const wR = rWaist  + 0.007;
    const hR = rHip    + 0.010;
    const nR = rNeck   + 0.006;
    const sR = rShoulder;

    const gMat = new THREE.MeshStandardMaterial({
      color:       0x7c3aed,
      roughness:   0.6,
      metalness:   0.08,
      transparent: true,
      opacity:     isWireframe ? 0.55 : 0.87,
      side:        THREE.DoubleSide,
      wireframe:   isWireframe,
    });

    const seamMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, roughness: 0.5, metalness: 0.1
    });

    switch (garmentType) {
      case 'franela':
      case 'blusa':
        _addTorsoGarment(gMat, bR, wR, hR, nR, torsoH, yBase, false);
        _addSleeves(gMat, bR, sR, m.sleeveLength * SC, torsoH, yBase);
        break;

      case 'camisa':
        _addTorsoGarment(gMat, bR*1.03, wR*1.03, hR*1.03, nR*1.02, torsoH, yBase, true);
        _addSleeves(gMat, bR*1.03, sR, m.sleeveLength*SC, torsoH, yBase);
        _addCollar(gMat, nR, torsoH, yBase);
        break;

      case 'falda':
        _addSkirt(gMat, wR, hR, m.skirtLength*SC, m.hipDepth*SC, yBase);
        break;

      case 'vestido':
        _addTorsoGarment(gMat, bR, wR, hR, nR, torsoH*0.98, yBase, false);
        _addSkirt(gMat, wR, hR, m.skirtLength*SC, m.hipDepth*SC, yBase);
        break;
    }

    // Costuras decorativas
    if (!isWireframe) {
      _addSeamLine(0,        yBase, torsoH, bR, seamMat);
      _addSeamLine(Math.PI,  yBase, torsoH, bR, seamMat);
    }
  }

  function _addTorsoGarment(mat, bR, wR, hR, nR, torsoH, yBase, withPlacket) {
    const pts = [
      new THREE.Vector2(hR,           0),
      new THREE.Vector2(hR * 0.95,    torsoH * 0.05),
      new THREE.Vector2(wR * 1.06,    torsoH * 0.28),
      new THREE.Vector2(wR,            torsoH * 0.36),
      new THREE.Vector2(wR * 1.04,    torsoH * 0.44),
      new THREE.Vector2(bR * 0.97,    torsoH * 0.60),
      new THREE.Vector2(bR,            torsoH * 0.68),
      new THREE.Vector2(bR * 0.93,    torsoH * 0.80),
      new THREE.Vector2(nR * 1.55,    torsoH * 0.95),
      new THREE.Vector2(nR * 1.15,    torsoH),
    ];
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 52), mat);
    mesh.position.y = yBase;
    mesh.castShadow = true;
    garmentGroup.add(mesh);
  }

  function _addSleeves(mat, bR, sR, sleeveLen, torsoH, yBase) {
    const topR = bR * 0.50;
    const botR = bR * 0.26;

    [-1, 1].forEach(side => {
      const geo  = new THREE.CylinderGeometry(botR, topR, sleeveLen, 22, 1, true);
      const mesh = new THREE.Mesh(geo, mat);
      const ang  = side * Math.PI / 9;
      mesh.position.set(
        side * (sR + topR * 0.4),
        yBase + torsoH * 0.80 - sleeveLen * 0.5,
        0
      );
      mesh.rotation.z = ang;
      mesh.castShadow = true;
      garmentGroup.add(mesh);
    });
  }

  function _addSkirt(mat, wR, hR, skirtLen, hipDepth, yBase) {
    const pts = [];
    const steps = 18;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = t < (hipDepth / skirtLen)
        ? wR + (hR - wR) * (t / (hipDepth / skirtLen))
        : hR * (1 + t * 0.03);
      pts.push(new THREE.Vector2(r, -t * skirtLen));
    }
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 52), mat);
    mesh.position.y = yBase;
    mesh.castShadow = true;
    garmentGroup.add(mesh);
  }

  function _addCollar(mat, nR, torsoH, yBase) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(nR * 0.92, nR * 1.05, torsoH * 0.065, 24, 1, true),
      mat
    );
    mesh.position.y = yBase + torsoH + torsoH * 0.01;
    garmentGroup.add(mesh);
  }

  function _addSeamLine(angle, yBase, torsoH, bR, mat) {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * bR * 0.96,
        yBase + t * torsoH * 0.92,
        Math.sin(angle) * bR * 0.96
      ));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.0028, 6, false);
    garmentGroup.add(new THREE.Mesh(geo, mat));
  }

  // ─── CONTROLES ────────────────────────────────────────────────
  function toggleWireframe() {
    isWireframe = !isWireframe;
    garmentGroup.traverse(c => {
      if (c.isMesh && c.material) {
        c.material.wireframe = isWireframe;
        c.material.opacity   = isWireframe ? 0.55 : 0.87;
      }
    });
  }

  function resetCamera() {
    camera.position.set(0, 0.95, 3.5);
    controls.target.set(0, 0.85, 0);
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
