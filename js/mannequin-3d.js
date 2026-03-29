/**
 * mannequin-3d.js
 * Maniquí 3D con Three.js r134.
 * El maniquí se construye con geometrías primitivas (sin assets externos).
 * La "prenda" se aproxima con formas geométricas extraídas de las medidas.
 */

'use strict';
window.PAT = window.PAT || {};

PAT.Mannequin3D = (function() {
  let scene, camera, renderer, controls;
  let mannequinGroup, garmentGroup;
  let isWireframe = false;
  let _canvas = null;
  let _animFrameId = null;
  let _initialized = false;

  const SC = PAT.MANNEQUIN.scale;  // 0.1 (1cm → 0.1 Three.js units)

  function init(canvasEl) {
    if (_initialized) return;
    _canvas = canvasEl;

    renderer = new THREE.WebGLRenderer({
      canvas: canvasEl,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight);
    renderer.setClearColor(0x08080f, 1);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08080f, 0.015);

    const aspect = canvasEl.clientWidth / canvasEl.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 200);
    camera.position.set(0, 1.2, 5);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.5;
    controls.maxDistance = 12;
    controls.target.set(0, 1, 0);
    controls.update();

    // Iluminación
    scene.add(new THREE.AmbientLight(0xffeeff, 0.4));

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(3, 6, 4);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(1024, 1024);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x7c3aed, 0.4);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.2);
    fillLight.position.set(0, -2, 4);
    scene.add(fillLight);

    // Suelo con rejilla
    const gridHelper = new THREE.GridHelper(10, 20, 0x2d2d45, 0x1a1a2a);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Círculo de base (plataforma maniquí)
    const baseGeo  = new THREE.CylinderGeometry(0.35, 0.4, 0.05, 32);
    const baseMat  = new THREE.MeshStandardMaterial({ color: 0x2d2d45, metalness: 0.3, roughness: 0.7 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.025;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);

    // Poste del maniquí
    const poleGeo  = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8);
    const poleMat  = new THREE.MeshStandardMaterial({ color: 0x444466, metalness: 0.6, roughness: 0.4 });
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.y = 0.55;
    poleMesh.castShadow = true;
    scene.add(poleMesh);

    // Grupos principales
    mannequinGroup = new THREE.Group();
    garmentGroup   = new THREE.Group();
    mannequinGroup.position.y = 1.0;
    garmentGroup.position.y   = 1.0;
    scene.add(mannequinGroup);
    scene.add(garmentGroup);

    // Construir maniquí base
    buildMannequin();

    // Resize handler
    window.addEventListener('resize', onResize);

    // Iniciar loop
    animate();
    _initialized = true;
  }

  // ── Construir maniquí con geometrías primitivas ─────────────────────
  function buildMannequin() {
    while (mannequinGroup.children.length) {
      mannequinGroup.remove(mannequinGroup.children[0]);
    }

    const skinMat = new THREE.MeshStandardMaterial({
      color: PAT.MANNEQUIN.color.skin,
      roughness: 0.85,
      metalness: 0.05,
    });

    // Helper para crear cilindros suavizados como segmentos corporales
    function bodySegment(rTop, rBot, h, posY, mat) {
      const geo  = new THREE.CylinderGeometry(rTop, rBot, h, 24, 1, false);
      const mesh = new THREE.Mesh(geo, mat || skinMat);
      mesh.position.y = posY;
      mesh.castShadow = true;
      mannequinGroup.add(mesh);
      return mesh;
    }

    function sphere(r, posY, posX, posZ, mat) {
      const geo  = new THREE.SphereGeometry(r, 16, 12);
      const mesh = new THREE.Mesh(geo, mat || skinMat);
      mesh.position.set(posX || 0, posY, posZ || 0);
      mesh.castShadow = true;
      mannequinGroup.add(mesh);
      return mesh;
    }

    // Cabeza
    sphere(0.14, 0.92, 0, 0);

    // Cuello
    bodySegment(0.065, 0.075, 0.12, 0.77);

    // Hombros (esferas a los lados)
    sphere(0.09, 0.68, -0.28, 0);
    sphere(0.09, 0.68,  0.28, 0);

    // Torso superior (busto)
    const torsoMat = new THREE.MeshStandardMaterial({
      color: PAT.MANNEQUIN.color.skin,
      roughness: 0.9, metalness: 0.02,
    });
    bodySegment(0.175, 0.145, 0.42, 0.48, torsoMat);  // pecho → cintura alta

    // Brazos (simplificado: cilindros)
    // Brazo superior izquierdo
    const armGeoU = new THREE.CylinderGeometry(0.055, 0.048, 0.32, 12);
    const armMeshUL = new THREE.Mesh(armGeoU, skinMat);
    armMeshUL.position.set(-0.31, 0.48, 0);
    armMeshUL.rotation.z = Math.PI / 8;
    armMeshUL.castShadow = true;
    mannequinGroup.add(armMeshUL);

    const armMeshUR = new THREE.Mesh(armGeoU, skinMat);
    armMeshUR.position.set(0.31, 0.48, 0);
    armMeshUR.rotation.z = -Math.PI / 8;
    armMeshUR.castShadow = true;
    mannequinGroup.add(armMeshUR);

    // Brazo inferior
    const armGeoL = new THREE.CylinderGeometry(0.044, 0.038, 0.28, 12);
    const armMeshLL = new THREE.Mesh(armGeoL, skinMat);
    armMeshLL.position.set(-0.36, 0.18, 0);
    armMeshLL.rotation.z = Math.PI / 12;
    armMeshLL.castShadow = true;
    mannequinGroup.add(armMeshLL);

    const armMeshLR = new THREE.Mesh(armGeoL, skinMat);
    armMeshLR.position.set(0.36, 0.18, 0);
    armMeshLR.rotation.z = -Math.PI / 12;
    armMeshLR.castShadow = true;
    mannequinGroup.add(armMeshLR);

    // Torso inferior (cintura → cadera)
    bodySegment(0.145, 0.185, 0.30, 0.14);

    // Cadera
    bodySegment(0.185, 0.17, 0.12, -0.04);
  }

  // ── Construir prenda según tipo y medidas ───────────────────────────
  function updateGarment(garmentType, measures, params) {
    // Limpiar prenda anterior
    while (garmentGroup.children.length) {
      garmentGroup.remove(garmentGroup.children[0]);
    }

    const m = measures;
    // Convertir medidas cm → unidades Three.js (SC = 0.1)
    const bust  = m.bust  * SC * 0.5 / Math.PI; // radio busto aproximado
    const waist = m.waist * SC * 0.5 / Math.PI;
    const hip   = m.hip   * SC * 0.5 / Math.PI;
    const tl    = m.totalLength * SC;
    const bl    = m.backLength  * SC;
    const sl    = m.skirtLength * SC;

    const garmentMat = new THREE.MeshStandardMaterial({
      color: PAT.MANNEQUIN.color.garment,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });

    const wireframeMat = new THREE.MeshStandardMaterial({
      color: PAT.MANNEQUIN.color.garment,
      roughness: 0.5,
      metalness: 0.2,
      wireframe: isWireframe,
      transparent: true,
      opacity: isWireframe ? 0.7 : 0.85,
      side: THREE.DoubleSide,
    });

    switch (garmentType) {
      case 'franela':
      case 'blusa':
        buildTorsoGarment(wireframeMat, bust, waist, hip, tl, bl, garmentType);
        buildSleeveGarment(wireframeMat, bust, m.sleeveLength * SC, garmentType);
        break;
      case 'camisa':
        buildTorsoGarment(wireframeMat, bust * 1.05, waist * 1.05, hip * 1.05, tl, bl, garmentType);
        buildSleeveGarment(wireframeMat, bust * 1.05, m.sleeveLength * SC, garmentType);
        buildCollarGarment(wireframeMat, m.neck * SC);
        break;
      case 'falda':
        buildSkirtGarment(wireframeMat, waist, hip, sl, m.hipDepth * SC);
        break;
      case 'vestido':
        buildTorsoGarment(wireframeMat, bust, waist, hip, bl, bl, garmentType);
        buildSkirtGarment(wireframeMat, waist, hip, sl, m.hipDepth * SC);
        break;
    }
  }

  function buildTorsoGarment(mat, bust, waist, hip, totalLen, bodyLen, type) {
    // Cuerpo principal: cilindro con variación de radio
    // Usamos LatheGeometry para forma orgánica
    const points = [];
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let radius, y;
      if (t <= 0.15) {
        // Zona de hombros
        radius = bust * 0.85 + (bust - bust * 0.85) * (t / 0.15);
        y = bodyLen * (1 - t);
      } else if (t <= 0.55) {
        // Busto → cintura
        const tt = (t - 0.15) / 0.40;
        radius = bust - (bust - waist) * tt;
        y = bodyLen * (1 - t);
      } else {
        // Cintura → hem
        const tt = (t - 0.55) / 0.45;
        radius = waist + (hip * 0.95 - waist) * tt;
        y = bodyLen * (1 - t);
      }
      points.push(new THREE.Vector2(radius + 0.02, y - bodyLen));
    }

    const latheGeo = new THREE.LatheGeometry(points, 32);
    const latheMesh = new THREE.Mesh(latheGeo, mat);
    latheMesh.castShadow = true;
    garmentGroup.add(latheMesh);

    // Línea de costura lateral (como línea 3D)
    addSeamLine(bust + 0.02, -bodyLen, 0, bodyLen, mat);
  }

  function buildSleeveGarment(mat, bust, sleeveLen, type) {
    const sleeveTopR = bust * 0.52;
    const sleeveWristR = type === 'camisa' ? bust * 0.18 : bust * 0.22;

    // Manga izquierda
    const sleeveGeo = new THREE.CylinderGeometry(sleeveWristR, sleeveTopR, sleeveLen, 16, 1, true);
    const sleeveL   = new THREE.Mesh(sleeveGeo, mat);
    sleeveL.position.set(-(bust + sleeveTopR * 0.5), -sleeveLen * 0.5 + 0.05, 0);
    sleeveL.rotation.z = Math.PI / 14;
    sleeveL.castShadow = true;
    garmentGroup.add(sleeveL);

    // Manga derecha
    const sleeveR = new THREE.Mesh(sleeveGeo, mat);
    sleeveR.position.set(bust + sleeveTopR * 0.5, -sleeveLen * 0.5 + 0.05, 0);
    sleeveR.rotation.z = -Math.PI / 14;
    sleeveR.castShadow = true;
    garmentGroup.add(sleeveR);
  }

  function buildSkirtGarment(mat, waist, hip, skirtLen, hipDepth) {
    const points = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let radius;
      if (t <= hipDepth / skirtLen) {
        const tt = t / (hipDepth / skirtLen);
        radius = waist + (hip - waist) * tt;
      } else {
        radius = hip;
      }
      points.push(new THREE.Vector2(radius + 0.015, -t * skirtLen));
    }

    const latheGeo  = new THREE.LatheGeometry(points, 32);
    const latheMesh = new THREE.Mesh(latheGeo, mat);
    latheMesh.castShadow = true;
    garmentGroup.add(latheMesh);
  }

  function buildCollarGarment(mat, neckCirc) {
    const neckR = (neckCirc / (2 * Math.PI)) + 0.01;
    const collarGeo  = new THREE.CylinderGeometry(neckR * 0.95, neckR, 0.06, 20, 1, true);
    const collarMesh = new THREE.Mesh(collarGeo, mat);
    // El cuello va encima del torso (aproximado a 0.68 unidades)
    collarMesh.position.y = 0.68;
    collarMesh.castShadow = true;
    garmentGroup.add(collarMesh);
  }

  function addSeamLine(x, startY, z, len, mat) {
    const points3D = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      points3D.push(new THREE.Vector3(x, startY + t * len, z));
    }
    const curve   = new THREE.CatmullRomCurve3(points3D);
    const lineGeo = new THREE.TubeGeometry(curve, 20, 0.003, 4, false);
    const lineMat = new THREE.MeshBasicMaterial({ color: PAT.MANNEQUIN.color.seam });
    const line    = new THREE.Mesh(lineGeo, lineMat);
    garmentGroup.add(line);
  }

  function toggleWireframe() {
    isWireframe = !isWireframe;
    garmentGroup.traverse(child => {
      if (child.isMesh && child.material) {
        child.material.wireframe = isWireframe;
        child.material.opacity   = isWireframe ? 0.6 : 0.85;
      }
    });
  }

  function resetCamera() {
    camera.position.set(0, 1.2, 5);
    controls.target.set(0, 1, 0);
    controls.update();
  }

  function onResize() {
    if (!_canvas) return;
    const w = _canvas.clientWidth;
    const h = _canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    _animFrameId = requestAnimationFrame(animate);
    controls.update();
    // Rotación lenta automática del maniquí cuando está inactivo
    if (!controls.enabled || !controls._lastInteraction) {
      mannequinGroup.rotation.y += 0.002;
      garmentGroup.rotation.y   += 0.002;
    }
    renderer.render(scene, camera);
  }

  function destroy() {
    if (_animFrameId) cancelAnimationFrame(_animFrameId);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    _initialized = false;
  }

  return { init, updateGarment, toggleWireframe, resetCamera, destroy };
})();
