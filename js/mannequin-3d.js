/**
 * mannequin-3d.js v8 — PatrónAI Pro
 * Maniquí 3D realista con selección de género/edad,
 * paredes de esquina, prenda ajustada al cuerpo.
 */
'use strict';
window.PAT = window.PAT || {};

PAT.Mannequin3D = (function () {

  let scene, camera, renderer, controls;
  let bodyGroup, garmentGroup, measureGroup;
  let _canvas = null, _animId = null, _initialized = false;
  let _currentMeasures = {}, _activeMeasureLine = null;
  let _isWireframe = false;
  let _bodyType = 'woman';
  let _lastGarment = 'franela';

  // Proporciones de cuerpo por tipo
  const BTYPES = {
    woman: { l:'Mujer',  e:'👩', bM:1.00, wM:0.81, hM:1.00, sM:0.88, nM:0.94, hHt:1.00, headM:1.00 },
    man:   { l:'Hombre', e:'👨', bM:1.12, wM:0.96, hM:0.85, sM:1.10, nM:1.08, hHt:1.06, headM:1.05 },
    girl:  { l:'Niña',   e:'👧', bM:0.58, wM:0.63, hM:0.56, sM:0.60, nM:0.70, hHt:0.70, headM:0.92 },
    boy:   { l:'Niño',   e:'👦', bM:0.56, wM:0.61, hM:0.54, sM:0.63, nM:0.68, hHt:0.68, headM:0.90 },
  };

  // Proporciones de altura del cuerpo (base = mujer adulta)
  const BH = {
    floor:0, ankle:0.075, calf:0.22, knee:0.38, thighMid:0.46, crotch:0.50,
    hipLow:0.58, hip:0.61, waist:0.74, underbust:0.82, bust:0.88,
    armpit:0.90, shoulder:0.97, neckBase:1.02, neckTop:1.09, chin:1.13, headCtr:1.24,
  };

  function cmR(c) { return c / (2 * Math.PI * 100); }

  // ════════════════════════════════════════════════════════════
  function init(canvasEl) {
    if (_initialized || !canvasEl) return;
    _canvas = canvasEl;
    const W = canvasEl.clientWidth || 800, Ht = canvasEl.clientHeight || 600;

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, Ht);
    renderer.setClearColor(0x06060e, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060610, 0.09);

    camera = new THREE.PerspectiveCamera(36, W / Ht, 0.01, 30);
    camera.position.set(0, 0.95, 2.7);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.4;
    controls.maxDistance = 5;
    controls.target.set(0, 0.82, 0);
    controls.update();

    bodyGroup    = new THREE.Group();
    garmentGroup = new THREE.Group();
    measureGroup = new THREE.Group();
    scene.add(bodyGroup, garmentGroup, measureGroup);

    _buildScene();
    _injectPanel();
    window.addEventListener('resize', _onResize);
    _animate();
    _initialized = true;
  }

  // ════════════════════════════════════════════════════════════
  // ESCENA: suelo, paredes, luces
  // ════════════════════════════════════════════════════════════
  function _buildScene() {
    // Suelo con textura de rejilla
    const floorMat = new THREE.MeshStandardMaterial({ color:0x0a0a18, roughness:0.97, metalness:0 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8, 20, 20), floorMat);
    floor.rotation.x = -Math.PI/2; floor.receiveShadow = true;
    scene.add(floor);

    // Grilla
    const grid = new THREE.GridHelper(6, 30, 0x18183a, 0x0f0f28);
    grid.position.y = 0.001;
    scene.add(grid);

    // ── Pared trasera ──
    const wallTex = _createWallTexture();
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d22, roughness: 0.95, metalness: 0.02,
      map: wallTex, side: THREE.FrontSide,
    });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(7, 4), wallMat);
    backWall.position.set(0, 2, -2.5);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // ── Pared lateral izquierda ──
    const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(7, 4), wallMat.clone());
    sideWall.position.set(-2.5, 2, 0);
    sideWall.rotation.y = Math.PI / 2;
    sideWall.receiveShadow = true;
    scene.add(sideWall);

    // Rodapié (zócalo)
    const skirtMat = new THREE.MeshStandardMaterial({ color:0x080818, roughness:0.8 });
    const skirtBack = new THREE.Mesh(new THREE.BoxGeometry(7, 0.12, 0.04), skirtMat);
    skirtBack.position.set(0, 0.06, -2.49); scene.add(skirtBack);
    const skirtSide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 7), skirtMat);
    skirtSide.position.set(-2.49, 0.06, 0); scene.add(skirtSide);

    // ── Luces ──
    scene.add(new THREE.AmbientLight(0xeef0ff, 0.38));

    const key = new THREE.DirectionalLight(0xfff8f0, 1.2);
    key.position.set(1.5, 3.5, 2.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.1; key.shadow.camera.far = 10;
    key.shadow.camera.left = -2; key.shadow.camera.right = 2;
    key.shadow.camera.top = 3; key.shadow.camera.bottom = -1;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xb0c8ff, 0.45);
    fill.position.set(-2, 2.5, 1); scene.add(fill);

    const back = new THREE.DirectionalLight(0x8866aa, 0.30);
    back.position.set(0.5, 2, -3); scene.add(back);

    // Luz ambiental suave desde arriba
    const hemi = new THREE.HemisphereLight(0xeeeeff, 0x222244, 0.3);
    scene.add(hemi);

    // ── Base del maniquí ──
    const baseMat = new THREE.MeshStandardMaterial({ color:0x1a1a30, metalness:0.8, roughness:0.25 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.025, 48), baseMat);
    disc.position.y = 0.012; disc.castShadow = true; scene.add(disc);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.5, 14), baseMat);
    pole.position.y = 0.275; scene.add(pole);

    // Conexión pole-body
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), baseMat);
    joint.position.y = 0.52; scene.add(joint);
  }

  function _createWallTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0d0d22';
    ctx.fillRect(0, 0, size, size);
    // Patrón sutil de paneles
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < size; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    }
    for (let x = 0; x < size; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 3);
    return tex;
  }

  // ════════════════════════════════════════════════════════════
  // CUERPO — construcción realista por género
  // ════════════════════════════════════════════════════════════
  function _buildBody(m) {
    while (bodyGroup.children.length) {
      const c = bodyGroup.children[0];
      c.geometry?.dispose(); c.material?.dispose(); bodyGroup.remove(c);
    }

    const bt = BTYPES[_bodyType] || BTYPES.woman;
    const hm = bt.hHt; // multiplicador de altura

    // Escalar alturas
    const h = {};
    Object.entries(BH).forEach(([k,v]) => h[k] = v * hm);

    // Calcular radios con multiplicadores de género
    const rBust     = cmR(m.bust)     * bt.bM;
    const rWaist    = cmR(m.waist)    * bt.wM;
    const rHip      = cmR(m.hip)      * bt.hM;
    const rNeck     = cmR(m.neck)     * bt.nM;
    const rShoulder = (m.shoulder / 100) / 2 * bt.sM;

    // Colores de piel distintos por tipo
    const skinHex = {
      woman: 0xc8987c, man: 0xb8845c,
      girl:  0xd4a88a, boy: 0xc89472
    }[_bodyType] || 0xc4906a;

    const skin = new THREE.MeshStandardMaterial({
      color: skinHex, roughness: 0.62, metalness: 0.02,
    });

    function add(geo, px, py, pz, rZ, rX) {
      const mesh = new THREE.Mesh(geo, skin);
      mesh.position.set(px||0, py||0, pz||0);
      if (rZ !== undefined) mesh.rotation.z = rZ;
      if (rX !== undefined) mesh.rotation.x = rX;
      mesh.castShadow = true; mesh.receiveShadow = true;
      bodyGroup.add(mesh); return mesh;
    }

    // ── PIERNAS ──
    const isChild = _bodyType === 'girl' || _bodyType === 'boy';
    const legX = rHip * (isChild ? 0.48 : _bodyType === 'man' ? 0.50 : 0.54);

    [-1, 1].forEach(side => {
      const lx = legX * side;

      // Pie
      const footGeo = new THREE.BoxGeometry(rHip*0.48, h.ankle*0.65, rHip*1.35);
      const foot = new THREE.Mesh(footGeo, skin);
      foot.position.set(lx, h.ankle*0.32, rHip*0.25);
      foot.castShadow = true; bodyGroup.add(foot);

      // Tobillo
      add(new THREE.CylinderGeometry(rHip*0.16, rHip*0.14, h.ankle*0.5, 14), lx, h.ankle*0.75);

      // Pantorrilla — perfil más definido
      const calfPts = [
        new THREE.Vector2(rHip*0.17, 0),
        new THREE.Vector2(rHip*0.24, (h.calf-h.ankle)*0.35),
        new THREE.Vector2(rHip*0.22, (h.calf-h.ankle)*0.7),
        new THREE.Vector2(rHip*0.19, h.calf-h.ankle),
      ];
      const calfMesh = new THREE.Mesh(new THREE.LatheGeometry(calfPts, 16), skin);
      calfMesh.position.set(lx, h.ankle, 0); calfMesh.castShadow=true; bodyGroup.add(calfMesh);

      // Rodilla
      add(new THREE.SphereGeometry(rHip*0.22, 14, 10), lx, h.knee);

      // Muslo
      const thighPts = [
        new THREE.Vector2(rHip*0.23, 0),
        new THREE.Vector2(rHip*0.36, (h.thighMid-h.knee)*0.4),
        new THREE.Vector2(rHip*0.38, (h.thighMid-h.knee)*0.7),
        new THREE.Vector2(rHip*0.35, h.thighMid-h.knee),
      ];
      const thighH = h.crotch - h.knee;
      const thighMesh = new THREE.Mesh(new THREE.LatheGeometry(thighPts, 16), skin);
      thighMesh.position.set(lx, h.knee, 0); thighMesh.castShadow=true; bodyGroup.add(thighMesh);
    });

    // ── PELVIS / CADERA ──
    const pelvH = h.waist - h.crotch;
    const pelvPts = [
      new THREE.Vector2(rHip*0.85, 0),
      new THREE.Vector2(rHip*0.95, pelvH*0.2),
      new THREE.Vector2(rHip,      pelvH*0.55),
      new THREE.Vector2(rHip*1.01, pelvH*0.72),
      new THREE.Vector2(rWaist*1.05, pelvH*0.88),
      new THREE.Vector2(rWaist,    pelvH),
    ];
    const pelvis = new THREE.Mesh(new THREE.LatheGeometry(pelvPts, 48), skin);
    pelvis.position.y = h.crotch; pelvis.castShadow=true; bodyGroup.add(pelvis);

    // ── TORSO ──
    const torsoH = h.neckBase - h.waist;

    if (_bodyType === 'woman' || _bodyType === 'girl') {
      // Torso femenino: cintura más marcada, busto
      const tPts = [
        new THREE.Vector2(rWaist,      0),
        new THREE.Vector2(rWaist*1.02, torsoH*0.05),
        new THREE.Vector2(rBust*0.92,  torsoH*0.42),
        new THREE.Vector2(rBust,       torsoH*0.58),
        new THREE.Vector2(rBust*1.02,  torsoH*0.64), // pecho
        new THREE.Vector2(rBust*0.97,  torsoH*0.72),
        new THREE.Vector2(rShoulder*0.94, torsoH*0.90),
        new THREE.Vector2(rNeck*1.40,  torsoH),
      ];
      const torso = new THREE.Mesh(new THREE.LatheGeometry(tPts, 52), skin);
      torso.position.y = h.waist; torso.castShadow=true; bodyGroup.add(torso);

      // Detalle de busto (dos hemisferios)
      if (_bodyType === 'woman') {
        const bustR = rBust * 0.22;
        [-1, 1].forEach(side => {
          const bustGeo = new THREE.SphereGeometry(bustR, 16, 12, 0, Math.PI*2, 0, Math.PI*0.65);
          const bustMesh = new THREE.Mesh(bustGeo, skin);
          bustMesh.position.set(side * rBust*0.45, h.bust, rBust*0.62);
          bustMesh.rotation.x = 0.35;
          bustMesh.castShadow=true; bodyGroup.add(bustMesh);
        });
      }
    } else {
      // Torso masculino: más rectangular, hombros anchos
      const tPts = [
        new THREE.Vector2(rWaist*1.00, 0),
        new THREE.Vector2(rWaist*1.03, torsoH*0.08),
        new THREE.Vector2(rBust*0.98,  torsoH*0.35),
        new THREE.Vector2(rBust,       torsoH*0.55),
        new THREE.Vector2(rBust*1.02,  torsoH*0.68),
        new THREE.Vector2(rShoulder*0.96, torsoH*0.88),
        new THREE.Vector2(rNeck*1.45,  torsoH),
      ];
      const torso = new THREE.Mesh(new THREE.LatheGeometry(tPts, 52), skin);
      torso.position.y = h.waist; torso.castShadow=true; bodyGroup.add(torso);

      // Pectorales masculinos (niños no los tienen)
      if (_bodyType === 'man') {
        const pectR = rBust * 0.20;
        [-1, 1].forEach(side => {
          const pGeo = new THREE.SphereGeometry(pectR, 14, 10, 0, Math.PI*2, 0, Math.PI*0.6);
          const pMesh = new THREE.Mesh(pGeo, skin);
          pMesh.position.set(side * rBust*0.42, h.bust + 0.02, rBust*0.58);
          pMesh.rotation.x = 0.25;
          pMesh.castShadow=true; bodyGroup.add(pMesh);
        });
      }
    }

    // ── CUELLO ──
    const neckH = h.neckTop - h.neckBase;
    const neckPts = [
      new THREE.Vector2(rNeck*1.35, 0),
      new THREE.Vector2(rNeck*1.15, neckH*0.3),
      new THREE.Vector2(rNeck,      neckH*0.7),
      new THREE.Vector2(rNeck*0.95, neckH),
    ];
    const neckMesh = new THREE.Mesh(new THREE.LatheGeometry(neckPts, 22), skin);
    neckMesh.position.y = h.neckBase; bodyGroup.add(neckMesh);

    // ── CABEZA ──
    const headR = rNeck * bt.headM * 2.05;
    // Cabeza ovalada (más realista)
    const headGeo = new THREE.SphereGeometry(headR, 32, 26);
    const headMesh = new THREE.Mesh(headGeo, skin);
    headMesh.scale.set(0.90, 1.0, 0.86);
    headMesh.position.y = h.headCtr;
    headMesh.castShadow=true; bodyGroup.add(headMesh);

    // Mandíbula (leve protuberancia inferior)
    const jaw = new THREE.Mesh(
      new THREE.SphereGeometry(headR*0.75, 20, 14, 0, Math.PI*2, Math.PI*0.55, Math.PI*0.22), skin
    );
    jaw.scale.set(0.88, 0.6, 0.78);
    jaw.position.set(0, h.chin, headR*0.1);
    bodyGroup.add(jaw);

    // Cabello
    const hairColors = { woman:0x2a1a0a, man:0x1a0e05, girl:0x8B4513, boy:0x3a2010 };
    const hairMat = new THREE.MeshStandardMaterial({ color:hairColors[_bodyType], roughness:0.9 });

    if (_bodyType === 'woman' || _bodyType === 'girl') {
      // Cabello largo (semiesfera + cilindro)
      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(headR*1.04, 24, 16, 0, Math.PI*2, 0, Math.PI*0.5), hairMat);
      hairTop.position.y = h.headCtr + headR*0.08; bodyGroup.add(hairTop);
      // Cabello a los lados
      [-1,1].forEach(side => {
        const strand = new THREE.Mesh(new THREE.CylinderGeometry(headR*0.3, headR*0.15, headR*0.9, 12), hairMat);
        strand.position.set(side*headR*0.85, h.headCtr - headR*0.2, 0);
        bodyGroup.add(strand);
      });
    } else if (_bodyType === 'man') {
      // Cabello corto
      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(headR*1.025, 20, 12, 0, Math.PI*2, 0, Math.PI*0.42), hairMat);
      hairTop.position.y = h.headCtr + headR*0.05; bodyGroup.add(hairTop);
    } else {
      // Niños: cabello redondo
      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(headR*1.045, 20, 14, 0, Math.PI*2, 0, Math.PI*0.5), hairMat);
      hairTop.position.y = h.headCtr + headR*0.06; bodyGroup.add(hairTop);
    }

    // ── RASGOS FACIALES (ojos, nariz) ──
    const eyeMat = new THREE.MeshStandardMaterial({ color:0x1a1a2a, roughness:0.2 });
    const irisColors = { woman:'#5a3a1a', man:'#2a1a0a', girl:'#3a5a8a', boy:'#2a4a6a' };
    const irisMat = new THREE.MeshStandardMaterial({ color:irisColors[_bodyType]||0x3a3a5a, roughness:0.3 });

    [-1, 1].forEach(side => {
      const eyeX = side * headR * 0.33;
      const eyeY = h.headCtr + headR * 0.08;
      const eyeZ = headR * 0.82;
      // Blanco del ojo
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(headR*0.075, 12, 10), new THREE.MeshStandardMaterial({color:0xeeeeee,roughness:0.3}));
      eyeWhite.position.set(eyeX, eyeY, eyeZ); eyeWhite.scale.set(1, 0.75, 0.5);
      bodyGroup.add(eyeWhite);
      // Iris
      const iris = new THREE.Mesh(new THREE.CircleGeometry(headR*0.055, 10), irisMat);
      iris.position.set(eyeX, eyeY, eyeZ+headR*0.01); iris.rotation.x = 0.05;
      bodyGroup.add(iris);
      // Pupila
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(headR*0.028, 8), eyeMat);
      pupil.position.set(eyeX, eyeY, eyeZ+headR*0.012);
      bodyGroup.add(pupil);
    });

    // Nariz (simple protuberancia)
    const noseMat = new THREE.MeshStandardMaterial({ color:skinHex, roughness:0.65 });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(headR*0.08, 10, 8), noseMat);
    nose.scale.set(0.7, 0.6, 1.2);
    nose.position.set(0, h.headCtr - headR*0.08, headR*0.88);
    bodyGroup.add(nose);

    // ── BRAZOS ──
    const isM = _bodyType === 'man';
    const aTopR  = rBust * (isM ? 0.30 : 0.25);
    const aMidR  = rBust * (isM ? 0.21 : 0.18);
    const aBotR  = rBust * (isM ? 0.16 : 0.13);
    const wristR = rBust * (isM ? 0.13 : 0.11);
    const uAH = (h.shoulder - h.armpit) * 0.95;
    const fAH = uAH * 0.9;
    const ang = isM ? 0.26 : 0.31;

    [-1, 1].forEach(side => {
      const ax = side * rShoulder;
      const elbowX = ax + side * Math.sin(ang) * uAH;
      const elbowY = h.shoulder - Math.cos(ang) * uAH;
      const ang2 = side * 0.14;

      // Brazo superior — perfil muscular
      const uArmPts = [
        new THREE.Vector2(aTopR, 0),
        new THREE.Vector2(aMidR*1.05 + (isM?0.005:0), uAH*0.4),
        new THREE.Vector2(aMidR, uAH*0.75),
        new THREE.Vector2(aMidR*0.95, uAH),
      ];
      const uArm = new THREE.Mesh(new THREE.LatheGeometry(uArmPts, 14), skin);
      uArm.position.set(ax+side*Math.sin(ang)*uAH*0.5, h.shoulder-Math.cos(ang)*uAH*0.5, 0);
      uArm.rotation.z = side*ang; uArm.castShadow=true; bodyGroup.add(uArm);

      // Codo
      const elbow = new THREE.Mesh(new THREE.SphereGeometry(aMidR*0.9, 12, 8), skin);
      elbow.position.set(elbowX, elbowY, 0); bodyGroup.add(elbow);

      // Antebrazo
      const fArmPts = [
        new THREE.Vector2(aMidR*0.88, 0),
        new THREE.Vector2(aBotR*1.1, fAH*0.5),
        new THREE.Vector2(wristR*1.2, fAH*0.85),
        new THREE.Vector2(wristR, fAH),
      ];
      const fArm = new THREE.Mesh(new THREE.LatheGeometry(fArmPts, 14), skin);
      fArm.position.set(elbowX+side*Math.sin(Math.abs(ang2))*fAH*0.5, elbowY-Math.cos(ang2)*fAH*0.5, 0);
      fArm.rotation.z = ang2; fArm.castShadow=true; bodyGroup.add(fArm);

      // Muñeca + mano
      const handGeo = new THREE.SphereGeometry(wristR*1.15, 12, 10);
      const hand = new THREE.Mesh(handGeo, skin);
      hand.scale.set(1.1, 0.65, 1.3);
      hand.position.set(elbowX+side*Math.sin(Math.abs(ang2))*fAH, elbowY-fAH, 0);
      bodyGroup.add(hand);

      // Dedos (muy simplificados)
      for (let f = 0; f < 4; f++) {
        const fingerOff = (f - 1.5) * wristR * 0.4;
        const finger = new THREE.Mesh(new THREE.CylinderGeometry(wristR*0.1, wristR*0.1, wristR*0.6, 8), skin);
        finger.position.set(
          elbowX + side*Math.sin(Math.abs(ang2))*fAH + fingerOff,
          elbowY - fAH - wristR*0.35,
          wristR * 0.2
        );
        bodyGroup.add(finger);
      }
    });

    return { rBust, rWaist, rHip, rNeck, rShoulder, h };
  }

  // ════════════════════════════════════════════════════════════
  // PRENDA — ajustada directamente al cuerpo con EASE realista
  // ════════════════════════════════════════════════════════════
  function _buildGarment(garmentType, radii, m) {
    while (garmentGroup.children.length) {
      const c = garmentGroup.children[0];
      c.geometry?.dispose(); c.material?.dispose(); garmentGroup.remove(c);
    }

    const { rBust, rWaist, rHip, rNeck, rShoulder, h } = radii;
    const E = 0.010; // 1cm de facilidad (holgura)

    const gColors = {
      franela: 0x7c3aed, blusa: 0xb45fd4,
      camisa: 0x3b6ed4, falda: 0xd43b8a,
      vestido: 0x8a3bd4
    };
    const gMat = new THREE.MeshStandardMaterial({
      color: gColors[garmentType] || 0x7c3aed,
      roughness: 0.52, metalness: 0.04,
      transparent: true, opacity: 0.90,
      side: THREE.DoubleSide, wireframe: _isWireframe,
    });

    const sLen = m.sleeveLength / 100;
    const sLen_h = sLen * (h.shoulder / BH.shoulder); // escalar por altura del cuerpo

    switch (garmentType) {
      case 'franela': case 'blusa':
        _torso(rBust+E, rWaist+E*0.75, rHip+E*0.9, rNeck+E*0.3, h, gMat);
        _sleeves(rBust+E, rShoulder, h, sLen_h*0.55, gMat); // manga corta
        _addHiloLines(rBust+E, h.crotch, h.neckBase);
        break;
      case 'camisa':
        _torso(rBust+E*1.3, rWaist+E, rHip+E*1.2, rNeck+E*0.4, h, gMat);
        _sleeves(rBust+E, rShoulder, h, sLen_h, gMat);
        _collar(rNeck+E*0.3, h, gMat);
        _addHiloLines(rBust+E, h.crotch, h.neckBase);
        break;
      case 'falda':
        _skirt(rWaist+E, rHip+E*0.8, h, m.skirtLength/100, m.hipDepth/100, gMat, h.waist);
        _addHiloLines(rHip+E, h.waist - m.skirtLength/100, h.waist);
        break;
      case 'vestido':
        _torso(rBust+E, rWaist+E*0.75, rHip+E, rNeck+E*0.3, h, gMat);
        _skirt(rHip+E*0.5, rHip+E*0.9, h, m.skirtLength/100, 0.04, gMat, h.crotch);
        _addHiloLines(rBust+E, h.waist - m.skirtLength/100, h.neckBase);
        break;
    }
  }

  function _torso(bR,wR,hR,nR,h,mat){
    const tH = h.neckBase - h.crotch;
    const pts = [
      new THREE.Vector2(hR*0.97, 0),
      new THREE.Vector2(hR,      tH*(h.hip-h.crotch)/(h.neckBase-h.crotch)),
      new THREE.Vector2(wR*1.02, tH*(h.waist-h.crotch)/(h.neckBase-h.crotch)),
      new THREE.Vector2(wR,      tH*(h.waist-h.crotch)/(h.neckBase-h.crotch)+0.02),
      new THREE.Vector2(bR*0.97, tH*(h.underbust-h.crotch)/(h.neckBase-h.crotch)),
      new THREE.Vector2(bR,      tH*(h.bust-h.crotch)/(h.neckBase-h.crotch)),
      new THREE.Vector2(bR*0.93, tH*(h.bust-h.crotch)/(h.neckBase-h.crotch)+0.025),
      new THREE.Vector2(nR*1.40, tH),
    ];
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 52), mat);
    mesh.position.y = h.crotch; mesh.castShadow=true; garmentGroup.add(mesh);
  }

  function _sleeves(bR,sR,h,len,mat){
    const tR=bR*0.50, bR2=bR*0.23, ang=0.31;
    [-1,1].forEach(side=>{
      const geo=new THREE.CylinderGeometry(bR2,tR,len,20,1,true);
      const mesh=new THREE.Mesh(geo,mat);
      mesh.position.set(side*(sR+tR*0.1+Math.sin(ang)*len*0.5),h.shoulder-Math.cos(ang)*len*0.5,0);
      mesh.rotation.z=side*ang; mesh.castShadow=true; garmentGroup.add(mesh);
    });
  }

  function _collar(nR,h,mat){
    const cH=0.045;
    const pts=[
      new THREE.Vector2(nR*1.04,0),
      new THREE.Vector2(nR*1.06,cH*0.5),
      new THREE.Vector2(nR*1.04,cH),
    ];
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(pts,24),mat);
    mesh.position.y=h.neckBase; garmentGroup.add(mesh);
  }

  function _skirt(wR,hR,h,len,hipD,mat,yBase){
    const pts=[];
    for(let i=0;i<=22;i++){
      const t=i/22;
      const r=t<(hipD/len)?wR+(hR-wR)*(t/(hipD/len)):hR+t*0.012;
      pts.push(new THREE.Vector2(r,-t*len));
    }
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(pts,52),mat);
    mesh.position.y=yBase; mesh.castShadow=true; garmentGroup.add(mesh);
  }

  function _addHiloLines(radius,yBot,yTop){
    const rMat=new THREE.LineBasicMaterial({color:0xf87171,opacity:0.5,transparent:true});
    const bMat=new THREE.LineBasicMaterial({color:0x60a5fa,opacity:0.5,transparent:true});
    for(let i=0;i<9;i++){
      const a=i/9*Math.PI*2;
      const vR=[
        new THREE.Vector3(Math.cos(a)*radius*0.97,yBot,Math.sin(a)*radius*0.97),
        new THREE.Vector3(Math.cos(a)*radius*0.97,yTop,Math.sin(a)*radius*0.97)
      ];
      garmentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(vR),rMat));
      const b=(a+Math.PI/9);
      const vB=[
        new THREE.Vector3(Math.cos(a)*radius*0.97,yBot,Math.sin(a)*radius*0.97),
        new THREE.Vector3(Math.cos(b)*radius*0.97,yTop,Math.sin(b)*radius*0.97)
      ];
      garmentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(vB),bMat));
    }
  }

  // ════════════════════════════════════════════════════════════
  // LÍNEAS DE MEDIDA
  // ════════════════════════════════════════════════════════════
  function _buildMeasureLines(m, radii) {
    while (measureGroup.children.length) {
      const c=measureGroup.children[0]; c.geometry?.dispose(); c.material?.dispose(); measureGroup.remove(c);
    }
    const { rBust,rWaist,rHip,rShoulder,h } = radii;
    [
      {key:'bust',y:h.bust,r:rBust,c:0xf59e0b},{key:'waist',y:h.waist,r:rWaist,c:0xf59e0b},
      {key:'hip',y:h.hip,r:rHip,c:0xf59e0b},{key:'shoulder',y:h.shoulder,r:rShoulder,c:0x60a5fa},
    ].forEach(ln=>{
      const isActive=ln.key===_activeMeasureLine;
      const pts=[];
      for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*ln.r,ln.y,Math.sin(a)*ln.r));}
      const mat=new THREE.LineBasicMaterial({color:isActive?0xfbbf24:ln.c,opacity:isActive?1:.5,transparent:true});
      measureGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mat));
      if(isActive){
        const lp=[new THREE.Vector3(-ln.r*1.9,ln.y,0),new THREE.Vector3(ln.r*1.9,ln.y,0)];
        measureGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp),new THREE.LineBasicMaterial({color:0xfbbf24})));
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  // PANEL UI
  // ════════════════════════════════════════════════════════════
  function _injectPanel() {
    // Eliminar panel anterior si existe
    const old=document.getElementById('m3d-panel');if(old)old.remove();
    const oldCss=document.getElementById('m3d-css');if(oldCss)oldCss.remove();

    const css=document.createElement('style');css.id='m3d-css';
    css.textContent=`
      #m3d-panel{position:absolute;right:0;top:0;bottom:0;width:200px;background:rgba(8,8,20,.95);
        border-left:1px solid #2e2e45;display:flex;flex-direction:column;z-index:10;overflow:hidden}
      #m3d-head{padding:10px 13px 8px;font-size:10px;font-weight:700;letter-spacing:1px;
        text-transform:uppercase;color:#a78bfa;border-bottom:1px solid #2e2e45;flex-shrink:0;
        display:flex;align-items:center;gap:6px}
      #m3d-gen{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:7px 9px;
        border-bottom:1px solid #2e2e45;flex-shrink:0}
      .m3g{padding:5px 3px;border-radius:6px;border:1.5px solid #2e2e45;background:#141420;
        color:#9490b0;cursor:pointer;font-size:11px;font-family:var(--font,'Segoe UI');
        transition:all .15s;text-align:center}
      .m3g:hover{background:#2a2a3e;color:#ede9fe}
      .m3g.on{background:rgba(139,92,246,.2);color:#a78bfa;border-color:#8b5cf6}
      #m3d-lbl{margin:5px 8px;padding:8px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);
        border-radius:6px;font-size:12px;font-weight:800;color:#fbbf24;text-align:center;
        display:none;font-family:monospace}
      #m3d-body{flex:1;overflow-y:auto;padding:5px 8px}
      .m3sec{font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;
        color:#5a5678;padding:7px 4px 3px}
      .m3row{display:flex;align-items:center;padding:5px 7px;border-radius:5px;cursor:pointer;
        transition:all .15s;margin-bottom:2px;border:1.5px solid transparent}
      .m3row:hover{background:#1c1c2a;border-color:#2e2e45}
      .m3row.active{background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.3)}
      .m3dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
      .m3nm{font-size:11px;color:#9490b0;flex:1;margin-left:6px}
      .m3val{font-size:12px;font-weight:700;color:#ede9fe;font-family:monospace}
      .m3u{font-size:9px;color:#5a5678;margin-left:2px}
      #m3d-foot{padding:7px 8px;border-top:1px solid #2e2e45;display:flex;flex-direction:column;gap:5px;flex-shrink:0}
      #m3d-prog{height:3px;background:#1c1c2a;border-radius:2px;overflow:hidden;margin:0 2px;display:none}
      #m3d-bar{height:100%;width:0%;background:linear-gradient(90deg,#34d399,#8b5cf6);border-radius:2px}
      .m3btn{width:100%;padding:7px;border:1px solid #3d3d58;background:transparent;color:#9490b0;
        border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font,'Segoe UI');
        transition:all .15s;display:flex;align-items:center;justify-content:center;gap:5px}
      .m3btn:hover{background:#2a2a3e;color:#ede9fe}
      .m3sim{border-color:rgba(52,211,153,.4);color:#34d399;font-size:12px;font-weight:700}
      .m3sim:hover{background:rgba(52,211,153,.15)}
      .m3sim.running{border-color:rgba(251,191,36,.4);color:#fbbf24;animation:m3pulse 1s ease-in-out infinite}
      @keyframes m3pulse{0%,100%{opacity:1}50%{opacity:.6}}
      #three-canvas{width:calc(100% - 200px)!important}
      #ctrl-3d{display:none!important}
    `;
    document.head.appendChild(css);

    const panel=document.createElement('div');panel.id='m3d-panel';
    panel.innerHTML=`
      <div id="m3d-head">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        Medidas de Avatar
      </div>
      <div id="m3d-gen">
        ${Object.entries(BTYPES).map(([k,v])=>`<button class="m3g${k==='woman'?' on':''}" data-btype="${k}">${v.e} ${v.l}</button>`).join('')}
      </div>
      <div id="m3d-lbl"></div>
      <div id="m3d-body">
        <div class="m3sec">Contornos</div>
        <div class="m3row" data-mk="bust"><div class="m3dot" style="background:#f59e0b"></div><span class="m3nm">Busto</span><span class="m3val" id="m3v-bust">88</span><span class="m3u">cm</span></div>
        <div class="m3row" data-mk="waist"><div class="m3dot" style="background:#f59e0b"></div><span class="m3nm">Cintura</span><span class="m3val" id="m3v-waist">68</span><span class="m3u">cm</span></div>
        <div class="m3row" data-mk="hip"><div class="m3dot" style="background:#f59e0b"></div><span class="m3nm">Cadera</span><span class="m3val" id="m3v-hip">94</span><span class="m3u">cm</span></div>
        <div class="m3sec">Anchuras</div>
        <div class="m3row" data-mk="shoulder"><div class="m3dot" style="background:#60a5fa"></div><span class="m3nm">Hombros</span><span class="m3val" id="m3v-shoulder">38</span><span class="m3u">cm</span></div>
        <div class="m3row" data-mk="neck"><div class="m3dot" style="background:#60a5fa"></div><span class="m3nm">Cuello</span><span class="m3val" id="m3v-neck">36</span><span class="m3u">cm</span></div>
        <div class="m3sec">Largos</div>
        <div class="m3row" data-mk="backLength"><div class="m3dot" style="background:#34d399"></div><span class="m3nm">Talle esp.</span><span class="m3val" id="m3v-backLength">40</span><span class="m3u">cm</span></div>
        <div class="m3row" data-mk="sleeveLength"><div class="m3dot" style="background:#34d399"></div><span class="m3nm">Manga</span><span class="m3val" id="m3v-sleeveLength">60</span><span class="m3u">cm</span></div>
      </div>
      <div id="m3d-prog"><div id="m3d-bar"></div></div>
      <div id="m3d-foot">
        <button class="m3btn m3sim" id="m3d-sim">▶ Simular tela</button>
        <button class="m3btn" id="m3d-wire">⬡ Wireframe</button>
        <button class="m3btn" id="m3d-cam">⌂ Reset cámara</button>
      </div>
    `;

    const view=document.getElementById('view-3d');
    if(view){view.style.position='relative';view.appendChild(panel);}

    // Eventos de género
    panel.querySelectorAll('.m3g').forEach(btn=>{
      btn.addEventListener('click',function(){
        _bodyType=this.dataset.btype;
        panel.querySelectorAll('.m3g').forEach(b=>b.classList.remove('on'));
        this.classList.add('on');
        if(Object.keys(_currentMeasures).length){
          const m=Object.assign({bust:88,waist:68,hip:94,shoulder:38,neck:36,backLength:40,frontLength:42,totalLength:65,sleeveLength:60,skirtLength:60,hipDepth:20},_currentMeasures);
          const r=_buildBody(m);
          _buildGarment(_lastGarment,r,m);
          _buildMeasureLines(m,r);
        }
      });
    });

    // Hover en filas de medidas
    panel.querySelectorAll('.m3row').forEach(row=>{
      row.addEventListener('mouseenter',function(){
        _activeMeasureLine=this.dataset.mk;
        if(_currentRadii)_buildMeasureLines(_currentMeasures,_currentRadii);
        document.querySelectorAll('.m3row').forEach(r=>r.classList.remove('active'));
        this.classList.add('active');
        const lbl=document.getElementById('m3d-lbl');
        if(lbl&&_currentMeasures[this.dataset.mk]){
          const names={bust:'Busto',waist:'Cintura',hip:'Cadera',shoulder:'Hombros',neck:'Cuello',backLength:'Talle esp.',sleeveLength:'Manga'};
          lbl.textContent=`${names[this.dataset.mk]}: ${_currentMeasures[this.dataset.mk]}cm`;
          lbl.style.display='block';
        }
      });
      row.addEventListener('mouseleave',function(){
        _activeMeasureLine=null;
        if(_currentRadii)_buildMeasureLines(_currentMeasures,_currentRadii);
        document.querySelectorAll('.m3row').forEach(r=>r.classList.remove('active'));
        const lbl=document.getElementById('m3d-lbl');if(lbl)lbl.style.display='none';
      });
      row.addEventListener('click',function(){
        const inp=document.querySelector(`[data-measure="${this.dataset.mk}"]`);
        if(inp){const sb=document.getElementById('sidebar');if(sb&&sb.classList.contains('collapsed'))sb.classList.remove('collapsed');inp.focus();inp.select();}
      });
    });

    document.getElementById('m3d-sim').addEventListener('click',_toggleSim);
    document.getElementById('m3d-wire').addEventListener('click',function(){this.classList.toggle('on');toggleWireframe();});
    document.getElementById('m3d-cam').addEventListener('click',resetCamera);
  }

  let _simStep=0, _simRunning=false, _currentRadii=null;

  function _toggleSim(){
    if(_simRunning){_simRunning=false;_updateSimBtn(false);return;}
    _simRunning=true;_simStep=0;
    _updateSimBtn(true);
    document.getElementById('m3d-prog').style.display='block';
    document.getElementById('m3d-bar').style.width='0%';
  }

  function _simTick(){
    if(!_simRunning)return;
    _simStep++;
    const pct=Math.min(_simStep/80,1);
    const bar=document.getElementById('m3d-bar');
    if(bar)bar.style.width=(pct*100)+'%';
    // Ligera animación de asentamiento (ondulación amortiguada)
    garmentGroup.traverse(c=>{
      if(!c.isMesh||c.geometry?.type==='CylinderGeometry')return;
      // Solo agitar levemente en las primeras iteraciones
      if(_simStep<40&&c.geometry?.attributes?.position){
        const p=c.geometry.attributes.position;
        for(let i=0;i<Math.min(p.count,50);i++){
          const n=Math.sin(_simStep*0.2+i*0.8)*0.002*Math.max(0,1-_simStep/40);
          p.setY(i,p.getY(i)+n);
        }
        p.needsUpdate=true;
      }
    });
    if(_simStep>=80){_simRunning=false;_updateSimBtn(false);document.getElementById('m3d-prog').style.display='none';}
  }

  function _updateSimBtn(r){
    const btn=document.getElementById('m3d-sim');if(!btn)return;
    btn.classList.toggle('running',r);
    btn.textContent=r?'■ Detener':'▶ Simular tela';
  }

  function _updatePanelVals(m){
    ['bust','waist','hip','shoulder','neck','backLength','sleeveLength'].forEach(k=>{
      const el=document.getElementById('m3v-'+k);if(el&&m[k]!==undefined)el.textContent=m[k];
    });
  }

  // ════════════════════════════════════════════════════════════
  // UPDATE DESDE APP.JS
  // ════════════════════════════════════════════════════════════
  function updateGarment(garmentType, measures) {
    const m=Object.assign({bust:88,waist:68,hip:94,shoulder:38,neck:36,backLength:40,frontLength:42,totalLength:65,sleeveLength:60,wrist:16,skirtLength:60,hipDepth:20},measures);
    _currentMeasures=m;_lastGarment=garmentType;
    _updatePanelVals(m);
    const radii=_buildBody(m);
    _currentRadii=radii;
    _buildGarment(garmentType,radii,m);
    _buildMeasureLines(m,radii);
  }

  function toggleWireframe(){
    _isWireframe=!_isWireframe;
    garmentGroup.traverse(c=>{if(c.isMesh)c.material.wireframe=_isWireframe;});
  }

  function resetCamera(){
    camera.position.set(0,0.95,2.7);
    controls.target.set(0,0.82,0);
    controls.update();
  }

  function _onResize(){
    if(!_canvas||!renderer)return;
    const w=_canvas.clientWidth,h=_canvas.clientHeight;
    if(!w||!h)return;
    camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
  }

  function _animate(){
    _animId=requestAnimationFrame(_animate);
    _simTick();
    if(controls)controls.update();
    if(renderer&&scene&&camera)renderer.render(scene,camera);
  }

  function destroy(){
    if(_animId)cancelAnimationFrame(_animId);
    window.removeEventListener('resize',_onResize);
    if(renderer)renderer.dispose();
    _initialized=false;
  }

  return{init,updateGarment,toggleWireframe,resetCamera,destroy};
})();
