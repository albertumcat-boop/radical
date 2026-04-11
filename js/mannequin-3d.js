/**
 * mannequin-3d.js v9 — PatrónAI Pro
 * Cuerpo humano realista con silueta real.
 * Técnica: meshes separados por parte del cuerpo
 * con proporciones anatómicas correctas.
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
  let _currentRadii = null;

  // Tipos de cuerpo con multiplicadores proporcionales
  const BT = {
    woman: { l:'Mujer',  e:'👩', bM:1.00, wM:0.80, hM:1.00, sM:0.88, nM:0.94, ht:1.00 },
    man:   { l:'Hombre', e:'👨', bM:1.12, wM:0.96, hM:0.85, sM:1.10, nM:1.08, ht:1.06 },
    girl:  { l:'Niña',   e:'👧', bM:0.58, wM:0.63, hM:0.56, sM:0.60, nM:0.70, ht:0.70 },
    boy:   { l:'Niño',   e:'👦', bM:0.56, wM:0.61, hM:0.54, sM:0.63, nM:0.68, ht:0.68 },
  };

  function cmR(c) { return c / (2 * Math.PI * 100); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ════════════════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════════════════
  function init(canvasEl) {
    if (_initialized || !canvasEl) return;
    _canvas = canvasEl;
    const W = canvasEl.clientWidth || 800, Ht = canvasEl.clientHeight || 600;

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, Ht);
    renderer.setClearColor(0x07070f, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07070f, 0.08);

    camera = new THREE.PerspectiveCamera(36, W / Ht, 0.01, 30);
    camera.position.set(0, 0.95, 2.8);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.3;
    controls.maxDistance = 6;
    controls.target.set(0, 0.8, 0);
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
  // ESCENA
  // ════════════════════════════════════════════════════════════
  function _buildScene() {
    // Suelo
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshStandardMaterial({ color:0x090918, roughness:0.98 })
    );
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(6, 30, 0x14142a, 0x0c0c1e));

    // Paredes
    const wallMat = new THREE.MeshStandardMaterial({ color:0x0c0c1f, roughness:0.95, side:THREE.FrontSide });
    const bw = new THREE.Mesh(new THREE.PlaneGeometry(7, 4), wallMat);
    bw.position.set(0, 2, -2.6); bw.receiveShadow=true; scene.add(bw);
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(7, 4), wallMat.clone());
    sw.position.set(-2.6, 2, 0); sw.rotation.y=Math.PI/2; sw.receiveShadow=true; scene.add(sw);

    // Luces
    scene.add(new THREE.AmbientLight(0xeef0ff, 0.42));
    const key = new THREE.DirectionalLight(0xfff8f0, 1.25);
    key.position.set(1.5, 3.5, 2.5); key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);
    key.shadow.camera.left=-2; key.shadow.camera.right=2;
    key.shadow.camera.top=3; key.shadow.camera.bottom=-1;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xb0c8ff, 0.4);
    fill.position.set(-2, 2, 1); scene.add(fill);
    const back = new THREE.DirectionalLight(0x7c3aed, 0.3);
    back.position.set(0, 2.5, -3); scene.add(back);
    scene.add(new THREE.HemisphereLight(0xeeeeff, 0x111133, 0.25));

    // Base
    const bMat = new THREE.MeshStandardMaterial({ color:0x1a1a32, metalness:0.8, roughness:0.2 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,0.025,48), bMat);
    disc.position.y=0.012; scene.add(disc);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.5,14), bMat);
    pole.position.y=0.275; scene.add(pole);
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.02,12,10), bMat);
    joint.position.y=0.52; scene.add(joint);
  }

  // ════════════════════════════════════════════════════════════
  // CUERPO HUMANO REALISTA
  // Construcción pieza por pieza con silueta anatómica real
  // ════════════════════════════════════════════════════════════
  function _buildBody(m) {
    // Limpiar
    while (bodyGroup.children.length) {
      const c = bodyGroup.children[0];
      c.geometry?.dispose(); c.material?.dispose(); bodyGroup.remove(c);
    }

    const bt = BT[_bodyType] || BT.woman;
    const ht = bt.ht; // escala de altura
    const isF = (_bodyType === 'woman' || _bodyType === 'girl');
    const isM = (_bodyType === 'man');
    const isChild = (_bodyType === 'girl' || _bodyType === 'boy');

    // ── Radios en metros desde medidas ──
    const rB = cmR(m.bust)     * bt.bM;
    const rW = cmR(m.waist)    * bt.wM;
    const rH = cmR(m.hip)      * bt.hM;
    const rN = cmR(m.neck)     * bt.nM;
    const rS = (m.shoulder/100)/2 * bt.sM;

    // ── Alturas absolutas (metros) ──
    const TOTAL = 1.68 * ht;
    const FLOOR  = 0;
    const ANKLE  = TOTAL * 0.048;
    const KNEE   = TOTAL * 0.268;
    const CROTCH = TOTAL * 0.478;
    const HIP    = TOTAL * 0.535;
    const WAIST  = TOTAL * 0.620;
    const NAVEL  = TOTAL * 0.580;
    const RIBBOT = TOTAL * 0.650;
    const RIBTOP = TOTAL * 0.710;
    const BUST   = TOTAL * 0.730;
    const ARMPIT = TOTAL * 0.755;
    const SHLDR  = TOTAL * 0.818;
    const NECKB  = TOTAL * 0.860;
    const NECKT  = TOTAL * 0.900;
    const CHIN   = TOTAL * 0.930;
    const HEAD   = TOTAL * 0.970;
    const CROWN  = TOTAL * 1.000;

    // Color de piel
    const SKIN_HEX = { woman:0xd4a882, man:0xc09060, girl:0xdcb090, boy:0xc8966e }[_bodyType] || 0xd4a882;
    const skin = new THREE.MeshStandardMaterial({ color:SKIN_HEX, roughness:0.60, metalness:0.01 });
    const skinDark = new THREE.MeshStandardMaterial({ color:new THREE.Color(SKIN_HEX).multiplyScalar(0.85), roughness:0.65 });

    function mesh(geo, mat, x,y,z, rx,ry,rz, sx,sy,sz) {
      const m2 = new THREE.Mesh(geo, mat || skin);
      m2.position.set(x||0, y||0, z||0);
      if (rx!==undefined) m2.rotation.set(rx||0, ry||0, rz||0);
      if (sx!==undefined) m2.scale.set(sx||1, sy||1, sz||1);
      m2.castShadow=true; m2.receiveShadow=true;
      bodyGroup.add(m2); return m2;
    }

    // ════════════════════════════════════════════════════
    // PIERNAS — silueta real con curva de muslo y pantorrilla
    // ════════════════════════════════════════════════════
    const legSep = rH * (isM ? 0.48 : 0.52);
    const thighW = rH * (isM ? 0.38 : 0.36);
    const calfW  = rH * (isM ? 0.22 : 0.20);
    const ankleW = rH * (isM ? 0.14 : 0.12);

    [-1, 1].forEach(side => {
      const lx = legX(side, legSep);

      // ── Pie ──
      const footGeo = new THREE.BoxGeometry(rH*0.42, ANKLE*0.7, rH*1.3);
      const foot = new THREE.Mesh(footGeo, skin);
      foot.position.set(lx, ANKLE*0.35, rH*0.22);
      foot.castShadow=true; bodyGroup.add(foot);

      // Tobillo esférico
      mesh(new THREE.SphereGeometry(ankleW*0.9, 16, 12), null, lx, ANKLE*0.85);

      // ── Pantorrilla — LatheGeometry con silueta real ──
      const calfH = KNEE - ANKLE;
      const calfProfile = [
        new THREE.Vector2(ankleW,        0),
        new THREE.Vector2(ankleW*1.15,   calfH*0.10),
        new THREE.Vector2(calfW*1.08,    calfH*0.28),  // vientre pantorrilla
        new THREE.Vector2(calfW,         calfH*0.42),
        new THREE.Vector2(calfW*0.95,    calfH*0.60),
        new THREE.Vector2(calfW*0.88,    calfH*0.80),
        new THREE.Vector2(calfW*0.82,    calfH),
      ];
      const calfMesh = new THREE.Mesh(new THREE.LatheGeometry(calfProfile, 20), skin);
      calfMesh.position.set(lx, ANKLE, 0);
      calfMesh.castShadow=true; bodyGroup.add(calfMesh);

      // Rótula (rodilla)
      mesh(new THREE.SphereGeometry(calfW*1.05, 14, 10), null, lx, KNEE);

      // ── Muslo — perfil anatómico ──
      const thighH = CROTCH - KNEE;
      const thighProfile = [
        new THREE.Vector2(calfW*1.05,    0),
        new THREE.Vector2(thighW*0.90,   thighH*0.15),
        new THREE.Vector2(thighW,        thighH*0.35),   // punto más ancho del muslo
        new THREE.Vector2(thighW*0.98,   thighH*0.55),
        new THREE.Vector2(thighW*0.92,   thighH*0.72),
        new THREE.Vector2(thighW*0.85,   thighH*0.88),
        new THREE.Vector2(thighW*0.80,   thighH),
      ];
      const thighMesh = new THREE.Mesh(new THREE.LatheGeometry(thighProfile, 20), skin);
      thighMesh.position.set(lx, KNEE, 0);
      thighMesh.castShadow=true; bodyGroup.add(thighMesh);
    });

    // ════════════════════════════════════════════════════
    // PELVIS + GLÚTEOS — forma real en 3D
    // ════════════════════════════════════════════════════
    const pelvisH = HIP - CROTCH;
    const pelvisProfile = [
      new THREE.Vector2(rH*0.78,   0),
      new THREE.Vector2(rH*0.92,   pelvisH*0.25),
      new THREE.Vector2(rH*1.00,   pelvisH*0.55),   // punto más ancho cadera
      new THREE.Vector2(rH*0.98,   pelvisH*0.72),
      new THREE.Vector2(rW*1.05,   pelvisH*0.90),
      new THREE.Vector2(rW,        pelvisH),
    ];
    const pelvisMesh = new THREE.Mesh(new THREE.LatheGeometry(pelvisProfile, 48), skin);
    pelvisMesh.position.y = CROTCH;
    pelvisMesh.castShadow=true; bodyGroup.add(pelvisMesh);

    // Glúteos (2 semiesferas traseras para mujeres)
    if (isF) {
      const glutR = rH * 0.38;
      [-1,1].forEach(side => {
        const glut = new THREE.Mesh(
          new THREE.SphereGeometry(glutR, 20, 16, 0, Math.PI*2, 0, Math.PI*0.72),
          skin
        );
        glut.position.set(side*rH*0.36, CROTCH+pelvisH*0.30, -rH*0.55);
        glut.rotation.x = 0.3;
        glut.castShadow=true; bodyGroup.add(glut);
      });
    }

    // ════════════════════════════════════════════════════
    // TORSO — perfil anatómico detallado
    // ════════════════════════════════════════════════════
    const torsoH = NECKB - WAIST;

    // Perfil lateral del torso (muy detallado para silueta real)
    let torsoProfile;
    if (isF) {
      torsoProfile = [
        new THREE.Vector2(rW,         0),
        new THREE.Vector2(rW*1.02,    torsoH*0.05),
        new THREE.Vector2(rW*0.98,    torsoH*0.12),   // talle marcado
        new THREE.Vector2(rW*1.00,    torsoH*0.18),
        new THREE.Vector2(rB*0.82,    torsoH*0.32),   // arranque del busto
        new THREE.Vector2(rB*0.94,    torsoH*0.46),
        new THREE.Vector2(rB*1.00,    torsoH*0.58),   // busto máximo
        new THREE.Vector2(rB*0.98,    torsoH*0.66),
        new THREE.Vector2(rB*0.90,    torsoH*0.74),
        new THREE.Vector2(rS*0.98,    torsoH*0.88),   // hombros
        new THREE.Vector2(rN*1.38,    torsoH*0.97),
        new THREE.Vector2(rN*1.20,    torsoH),
      ];
    } else if (isM) {
      torsoProfile = [
        new THREE.Vector2(rW*1.02,    0),
        new THREE.Vector2(rW*1.04,    torsoH*0.08),
        new THREE.Vector2(rB*0.88,    torsoH*0.28),
        new THREE.Vector2(rB*0.96,    torsoH*0.48),
        new THREE.Vector2(rB*1.02,    torsoH*0.60),   // pecho masculino (más plano)
        new THREE.Vector2(rB*1.00,    torsoH*0.68),
        new THREE.Vector2(rS*1.00,    torsoH*0.86),   // hombros anchos
        new THREE.Vector2(rN*1.48,    torsoH*0.97),
        new THREE.Vector2(rN*1.28,    torsoH),
      ];
    } else {
      // Niño/niña (torso más recto)
      torsoProfile = [
        new THREE.Vector2(rW,         0),
        new THREE.Vector2(rW*1.01,    torsoH*0.10),
        new THREE.Vector2(rB*0.92,    torsoH*0.40),
        new THREE.Vector2(rB*0.98,    torsoH*0.60),
        new THREE.Vector2(rS*0.96,    torsoH*0.86),
        new THREE.Vector2(rN*1.32,    torsoH),
      ];
    }

    const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoProfile, 52), skin);
    torso.position.y = WAIST;
    torso.castShadow=true; bodyGroup.add(torso);

    // ── Busto femenino 3D ──
    if (isF && !isChild) {
      const bR = rB * 0.26;
      [-1,1].forEach(side => {
        // Cuerpo principal del busto
        const bustGeo = new THREE.SphereGeometry(bR, 22, 18, 0, Math.PI*2, 0, Math.PI*0.75);
        const bMesh = new THREE.Mesh(bustGeo, skin);
        bMesh.position.set(side * rB * 0.44, BUST + bR*0.05, rB * 0.68);
        bMesh.rotation.x = -0.25;
        bMesh.scale.set(0.92, 0.95, 1.0);
        bMesh.castShadow=true; bodyGroup.add(bMesh);
      });
    }

    // ── Pectorales masculinos ──
    if (isM) {
      const pR = rB * 0.22;
      [-1,1].forEach(side => {
        const pGeo = new THREE.SphereGeometry(pR, 18, 14, 0, Math.PI*2, 0, Math.PI*0.65);
        const pMesh = new THREE.Mesh(pGeo, skin);
        pMesh.position.set(side * rB*0.42, BUST+0.02, rB*0.62);
        pMesh.rotation.x = -0.2;
        pMesh.scale.set(1.1, 0.8, 0.9);
        pMesh.castShadow=true; bodyGroup.add(pMesh);
      });
    }

    // ════════════════════════════════════════════════════
    // CUELLO — perfil cónico
    // ════════════════════════════════════════════════════
    const neckH = NECKT - NECKB;
    const neckProfile = [
      new THREE.Vector2(rN*1.28, 0),
      new THREE.Vector2(rN*1.10, neckH*0.35),
      new THREE.Vector2(rN*1.00, neckH*0.72),
      new THREE.Vector2(rN*0.96, neckH),
    ];
    const neckMesh = new THREE.Mesh(new THREE.LatheGeometry(neckProfile, 22), skin);
    neckMesh.position.y = NECKB;
    bodyGroup.add(neckMesh);

    // ════════════════════════════════════════════════════
    // CABEZA — forma ovalada humana
    // ════════════════════════════════════════════════════
    const headR = rN * 2.1 * bt.nM;

    // Cráneo (esferoide)
    const headGeo = new THREE.SphereGeometry(headR, 32, 24);
    const headMesh = new THREE.Mesh(headGeo, skin);
    headMesh.scale.set(0.88, 1.0, 0.84);
    headMesh.position.set(0, HEAD, 0);
    headMesh.castShadow=true; bodyGroup.add(headMesh);

    // Mandíbula inferior (más prominente en hombre)
    const jawR = headR * (isM ? 0.82 : 0.76);
    const jawGeo = new THREE.SphereGeometry(jawR, 24, 16, 0, Math.PI*2, Math.PI*0.55, Math.PI*0.25);
    const jawMesh = new THREE.Mesh(jawGeo, skin);
    jawMesh.scale.set(isM?0.88:0.84, isM?0.55:0.48, isM?0.78:0.72);
    jawMesh.position.set(0, CHIN, headR*0.08);
    bodyGroup.add(jawMesh);

    // ── CABELLO ──
    const hairCol = { woman:0x2a1a0a, man:0x1a0e04, girl:0x7a4010, boy:0x2a1608 }[_bodyType];
    const hairMat = new THREE.MeshStandardMaterial({ color:hairCol, roughness:0.92 });

    if (isF) {
      // Cabello largo: casquete + lateral
      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(headR*1.055, 26, 18, 0, Math.PI*2, 0, Math.PI*0.5), hairMat);
      hairTop.scale.set(0.90, 1.0, 0.86);
      hairTop.position.set(0, HEAD+headR*0.06, 0); bodyGroup.add(hairTop);
      [-1,1].forEach(side => {
        // Mechones laterales
        const strand = new THREE.Mesh(
          new THREE.CylinderGeometry(headR*0.25, headR*0.12, headR*1.1, 12),
          hairMat
        );
        strand.position.set(side*headR*0.88, HEAD-headR*0.25, 0);
        strand.rotation.z = side*0.12;
        bodyGroup.add(strand);
        // Mechón delantero
        const front = new THREE.Mesh(
          new THREE.CylinderGeometry(headR*0.18, headR*0.08, headR*0.5, 10),
          hairMat
        );
        front.position.set(side*headR*0.3, HEAD-headR*0.15, headR*0.72);
        front.rotation.x = -0.4; front.rotation.z = side*0.2;
        bodyGroup.add(front);
      });
    } else if (isM) {
      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(headR*1.03, 22, 14, 0, Math.PI*2, 0, Math.PI*0.44), hairMat);
      hairTop.scale.set(0.89, 1.0, 0.85);
      hairTop.position.set(0, HEAD+headR*0.03, 0); bodyGroup.add(hairTop);
    } else {
      // Niñas/niños: cabello redondo
      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(headR*1.05, 22, 16, 0, Math.PI*2, 0, Math.PI*0.52), hairMat);
      hairTop.scale.set(0.89, 1.0, 0.85);
      hairTop.position.set(0, HEAD+headR*0.05, 0); bodyGroup.add(hairTop);
      if (!isM && _bodyType==='girl') {
        [-1,1].forEach(side => {
          const bun = new THREE.Mesh(new THREE.SphereGeometry(headR*0.32, 14, 10), hairMat);
          bun.position.set(side*headR*0.92, HEAD+headR*0.4, 0); bodyGroup.add(bun);
        });
      }
    }

    // ── RASGOS FACIALES ──
    const eyeY = HEAD + headR*0.08;
    const eyeZ = headR * 0.80;

    // Ojos
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color:0xf0eee8, roughness:0.25 });
    const irisColors = { woman:0x4a3020, man:0x2a2018, girl:0x2a4a7a, boy:0x1a3a5a };
    const irisMat = new THREE.MeshStandardMaterial({ color:irisColors[_bodyType]||0x3a3030, roughness:0.2 });
    const pupilMat = new THREE.MeshStandardMaterial({ color:0x060606, roughness:0.1 });

    [-1,1].forEach(side => {
      const ex = side*headR*0.30;
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(headR*0.085, 14, 10), eyeWhiteMat);
      eyeWhite.scale.set(1.1, 0.78, 0.55);
      eyeWhite.position.set(ex, eyeY, eyeZ); bodyGroup.add(eyeWhite);

      const iris = new THREE.Mesh(new THREE.CircleGeometry(headR*0.062, 12), irisMat);
      iris.position.set(ex, eyeY, eyeZ+headR*0.015); bodyGroup.add(iris);

      const pupil = new THREE.Mesh(new THREE.CircleGeometry(headR*0.032, 10), pupilMat);
      pupil.position.set(ex, eyeY, eyeZ+headR*0.016); bodyGroup.add(pupil);

      // Párpados
      const lidMat = new THREE.MeshStandardMaterial({ color:new THREE.Color(SKIN_HEX).multiplyScalar(0.9) });
      const lid = new THREE.Mesh(new THREE.SphereGeometry(headR*0.092, 14, 8, 0, Math.PI*2, 0, Math.PI*0.3), lidMat);
      lid.scale.set(1.1, 0.5, 0.6);
      lid.position.set(ex, eyeY+headR*0.048, eyeZ-headR*0.01);
      lid.rotation.x = 0.1; bodyGroup.add(lid);

      // Cejas
      const browMat = new THREE.MeshStandardMaterial({ color:new THREE.Color(hairCol).addScalar(0.1) });
      const brow = new THREE.Mesh(new THREE.BoxGeometry(headR*0.22, headR*0.028, headR*0.04), browMat);
      brow.position.set(ex, eyeY+headR*0.16, eyeZ+headR*0.02);
      brow.rotation.z = side*0.08; bodyGroup.add(brow);
    });

    // Nariz
    const noseMat = new THREE.MeshStandardMaterial({ color:new THREE.Color(SKIN_HEX).multiplyScalar(0.93), roughness:0.65 });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(headR*0.085, 12, 10), noseMat);
    nose.scale.set(0.65, 0.55, 1.15);
    nose.position.set(0, HEAD-headR*0.10, eyeZ+headR*0.14); bodyGroup.add(nose);

    // Labios
    const lipMat = new THREE.MeshStandardMaterial({ color:isF?0xd08080:0xb87060, roughness:0.55 });
    const lipTop = new THREE.Mesh(new THREE.SphereGeometry(headR*0.12, 12, 8, 0, Math.PI), lipMat);
    lipTop.scale.set(1.2, 0.45, 0.65);
    lipTop.position.set(0, HEAD-headR*0.28, eyeZ+headR*0.08); bodyGroup.add(lipTop);
    const lipBot = new THREE.Mesh(new THREE.SphereGeometry(headR*0.12, 12, 8, 0, Math.PI), lipMat);
    lipBot.scale.set(1.0, 0.42, 0.6);
    lipBot.position.set(0, HEAD-headR*0.34, eyeZ+headR*0.07); bodyGroup.add(lipBot);

    // Orejas
    const earMat = new THREE.MeshStandardMaterial({ color:new THREE.Color(SKIN_HEX).multiplyScalar(0.92), roughness:0.68 });
    [-1,1].forEach(side => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(headR*0.14, 12, 10), earMat);
      ear.scale.set(0.45, 0.68, 0.35);
      ear.position.set(side*headR*0.88, HEAD-headR*0.04, 0); bodyGroup.add(ear);
    });

    // ════════════════════════════════════════════════════
    // HOMBROS — definición muscular
    // ════════════════════════════════════════════════════
    [-1,1].forEach(side => {
      const shR = rB * (isM ? 0.20 : 0.17);
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(shR, 18, 14), skin);
      shoulder.scale.set(1.0, 0.82, 0.88);
      shoulder.position.set(side*rS*1.02, SHLDR, 0); bodyGroup.add(shoulder);
    });

    // ════════════════════════════════════════════════════
    // BRAZOS — perfil muscular real
    // ════════════════════════════════════════════════════
    const aTopR  = rB * (isM ? 0.155 : 0.130);
    const aMidR  = rB * (isM ? 0.138 : 0.114);  // bícep
    const aForeR = rB * (isM ? 0.125 : 0.100);
    const aWristR= rB * (isM ? 0.095 : 0.080);
    const uAH = (SHLDR - ARMPIT) * 0.94;
    const fAH = uAH * 0.92;
    const armAng = isM ? 0.22 : 0.28;

    [-1,1].forEach(side => {
      const ax = side * rS;
      const elbX = ax + side*Math.sin(armAng)*uAH;
      const elbY = SHLDR - Math.cos(armAng)*uAH;

      // Brazo superior — perfil bícep
      const uArmProfile = [
        new THREE.Vector2(aTopR,       0),
        new THREE.Vector2(aMidR*1.08,  uAH*0.30),   // bícep
        new THREE.Vector2(aMidR*1.05,  uAH*0.50),
        new THREE.Vector2(aMidR*0.95,  uAH*0.75),
        new THREE.Vector2(aForeR*1.05, uAH),
      ];
      const uArm = new THREE.Mesh(new THREE.LatheGeometry(uArmProfile, 16), skin);
      uArm.position.set(ax+side*Math.sin(armAng)*uAH*0.5, SHLDR-Math.cos(armAng)*uAH*0.5, 0);
      uArm.rotation.z = side*armAng;
      uArm.castShadow=true; bodyGroup.add(uArm);

      // Codo
      const elbow = new THREE.Mesh(new THREE.SphereGeometry(aForeR*1.05, 14, 10), skin);
      elbow.position.set(elbX, elbY, 0); bodyGroup.add(elbow);

      // Antebrazo
      const fAng = side*0.12;
      const fArmProfile = [
        new THREE.Vector2(aForeR*0.95, 0),
        new THREE.Vector2(aForeR*1.05, fAH*0.20),   // redondeo músculo
        new THREE.Vector2(aForeR*0.98, fAH*0.50),
        new THREE.Vector2(aWristR*1.15,fAH*0.80),
        new THREE.Vector2(aWristR,     fAH),
      ];
      const fArm = new THREE.Mesh(new THREE.LatheGeometry(fArmProfile, 16), skin);
      fArm.position.set(elbX+side*Math.sin(Math.abs(fAng))*fAH*0.5, elbY-Math.cos(fAng)*fAH*0.5, 0);
      fArm.rotation.z = fAng;
      fArm.castShadow=true; bodyGroup.add(fArm);

      // Muñeca + Mano
      const handY = elbY - fAH;
      const handX = elbX + side*Math.sin(Math.abs(fAng))*fAH;

      const hand = new THREE.Mesh(new THREE.SphereGeometry(aWristR*1.2, 14, 10), skin);
      hand.scale.set(1.15, 0.62, 1.35);
      hand.position.set(handX, handY, 0); bodyGroup.add(hand);

      // Dedos (4 cilindros)
      for (let f=0; f<4; f++) {
        const fOff = (f - 1.5) * aWristR*0.42;
        const finLen = aWristR * (f===1||f===2 ? 0.75 : 0.60);
        const fin = new THREE.Mesh(
          new THREE.CylinderGeometry(aWristR*0.10, aWristR*0.11, finLen, 8),
          skin
        );
        fin.position.set(handX + fOff, handY - aWristR*0.38 - finLen*0.5, aWristR*0.15);
        bodyGroup.add(fin);
      }
      // Pulgar
      const thumb = new THREE.Mesh(
        new THREE.CylinderGeometry(aWristR*0.10, aWristR*0.12, aWristR*0.55, 8),
        skin
      );
      thumb.position.set(handX + side*aWristR*0.65, handY - aWristR*0.25, 0);
      thumb.rotation.z = side*0.6; thumb.rotation.x = 0.4;
      bodyGroup.add(thumb);
    });

    return {
      rBust:rB, rWaist:rW, rHip:rH, rNeck:rN, rShoulder:rS,
      h:{ bust:BUST, waist:WAIST, hip:HIP, shoulder:SHLDR, neckBase:NECKB,
          crotch:CROTCH, underbust:RIBTOP, armpit:ARMPIT }
    };
  }

  function legX(side, sep) { return side * sep; }

  // ════════════════════════════════════════════════════════════
  // PRENDA — ajustada al cuerpo con silueta correcta
  // ════════════════════════════════════════════════════════════
  function _buildGarment(garmentType, radii, m) {
    while (garmentGroup.children.length) {
      const c = garmentGroup.children[0];
      c.geometry?.dispose(); c.material?.dispose(); garmentGroup.remove(c);
    }

    const { rBust:rB, rWaist:rW, rHip:rH, rNeck:rN, rShoulder:rS, h } = radii;
    const E = 0.010; // facilidad 1cm

    const gColors = { franela:0x6d28d9, blusa:0x9333ea, camisa:0x1d4ed8, falda:0xbe185d, vestido:0x7c3aed };
    const gMat = new THREE.MeshStandardMaterial({
      color: gColors[garmentType] || 0x6d28d9,
      roughness:0.50, metalness:0.04,
      transparent:true, opacity:0.88,
      side:THREE.DoubleSide, wireframe:_isWireframe,
    });

    const sLen = m.sleeveLength / 100;
    const skirtLen = m.skirtLength / 100;
    const hipD = m.hipDepth / 100;
    const ht = BT[_bodyType].ht;

    switch (garmentType) {
      case 'franela': case 'blusa':
        _garTorso(rB+E, rW+E*0.7, rH+E*0.8, rN+E*0.3, h, gMat);
        _garSleeveShort(rB+E, rS, h, gMat);
        _grainLines(rB+E, h.crotch, h.neckBase);
        break;
      case 'camisa':
        _garTorso(rB+E*1.3, rW+E, rH+E*1.2, rN+E*0.4, h, gMat);
        _garSleeveLong(rB+E, rS, h, sLen*ht, gMat);
        _garCollar(rN+E*0.3, h, gMat);
        _grainLines(rB+E, h.crotch, h.neckBase);
        break;
      case 'falda':
        _garSkirt(rW+E, rH+E*0.8, h, skirtLen*ht, hipD*ht, gMat, h.waist);
        _grainLines(rH+E, h.waist-skirtLen*ht, h.waist);
        break;
      case 'vestido':
        _garTorso(rB+E, rW+E*0.7, rH+E, rN+E*0.3, h, gMat);
        _garSkirt(rH+E*0.5, rH+E*0.9, h, skirtLen*ht, hipD*0.5*ht, gMat, h.crotch);
        _grainLines(rB+E, h.waist-skirtLen*ht, h.neckBase);
        break;
    }
  }

  function _garTorso(bR,wR,hR,nR,h,mat) {
    const H = h.neckBase - h.crotch;
    const bt = BT[_bodyType];
    const isF = (_bodyType==='woman'||_bodyType==='girl');

    // Perfil de la prenda sigue la silueta del cuerpo
    let pts;
    if (isF) {
      pts = [
        new THREE.Vector2(hR*0.97,  0),
        new THREE.Vector2(hR*0.99,  H*(h.hip-h.crotch)/(h.neckBase-h.crotch)),
        new THREE.Vector2(wR*1.02,  H*(h.waist-h.crotch)/(h.neckBase-h.crotch)),
        new THREE.Vector2(bR*0.88,  H*0.42),
        new THREE.Vector2(bR*1.02,  H*0.58),
        new THREE.Vector2(bR*0.96,  H*0.68),
        new THREE.Vector2(bR*0.88,  H*0.76),
        new THREE.Vector2(nR*1.42,  H*0.97),
      ];
    } else {
      pts = [
        new THREE.Vector2(hR*0.95,  0),
        new THREE.Vector2(wR*1.04,  H*(h.waist-h.crotch)/(h.neckBase-h.crotch)),
        new THREE.Vector2(bR*0.98,  H*0.52),
        new THREE.Vector2(bR*1.04,  H*0.64),
        new THREE.Vector2(bR*0.96,  H*0.76),
        new THREE.Vector2(nR*1.46,  H*0.97),
      ];
    }
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 52), mat);
    m.position.y = h.crotch; m.castShadow=true; garmentGroup.add(m);
  }

  function _garSleeveShort(bR,sR,h,mat) {
    const len = (h.shoulder - h.armpit) * 0.7;
    const ang = 0.28;
    [-1,1].forEach(side=>{
      const geo = new THREE.CylinderGeometry(bR*0.24, bR*0.50, len, 20, 1, true);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(side*(sR+bR*0.12+Math.sin(ang)*len*0.5), h.shoulder-Math.cos(ang)*len*0.5, 0);
      m.rotation.z=side*ang; m.castShadow=true; garmentGroup.add(m);
    });
  }

  function _garSleeveLong(bR,sR,h,len,mat) {
    const ang=0.28;
    [-1,1].forEach(side=>{
      const pts=[
        new THREE.Vector2(bR*0.50,0),
        new THREE.Vector2(bR*0.44,len*0.4),
        new THREE.Vector2(bR*0.28,len*0.75),
        new THREE.Vector2(bR*0.22,len),
      ];
      const geo = new THREE.LatheGeometry(pts,18);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(side*(sR+bR*0.12+Math.sin(ang)*len*0.5), h.shoulder-Math.cos(ang)*len*0.5, 0);
      m.rotation.z=side*ang; m.castShadow=true; garmentGroup.add(m);
    });
  }

  function _garCollar(nR,h,mat) {
    const cH=0.04;
    const m=new THREE.Mesh(new THREE.CylinderGeometry(nR*1.04,nR*1.10,cH,24,1,true),mat);
    m.position.y=h.neckBase+cH/2; garmentGroup.add(m);
  }

  function _garSkirt(wR,hR,h,len,hipD,mat,yBase) {
    const pts=[];
    for(let i=0;i<=24;i++){
      const t=i/24;
      const r=t<(hipD/len)?wR+(hR-wR)*(t/(hipD/len)):hR+t*0.008;
      pts.push(new THREE.Vector2(r,-t*len));
    }
    const m=new THREE.Mesh(new THREE.LatheGeometry(pts,52),mat);
    m.position.y=yBase; m.castShadow=true; garmentGroup.add(m);
  }

  function _grainLines(radius,yBot,yTop) {
    const rMat=new THREE.LineBasicMaterial({color:0xf87171,opacity:0.5,transparent:true});
    const bMat=new THREE.LineBasicMaterial({color:0x60a5fa,opacity:0.5,transparent:true});
    for(let i=0;i<9;i++){
      const a=i/9*Math.PI*2, b=a+Math.PI/9;
      const vR=[new THREE.Vector3(Math.cos(a)*radius*0.97,yBot,Math.sin(a)*radius*0.97),
               new THREE.Vector3(Math.cos(a)*radius*0.97,yTop,Math.sin(a)*radius*0.97)];
      garmentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(vR),rMat));
      const vB=[new THREE.Vector3(Math.cos(a)*radius*0.97,yBot,Math.sin(a)*radius*0.97),
               new THREE.Vector3(Math.cos(b)*radius*0.97,yTop,Math.sin(b)*radius*0.97)];
      garmentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(vB),bMat));
    }
  }

  // ════════════════════════════════════════════════════════════
  // LÍNEAS DE MEDIDA
  // ════════════════════════════════════════════════════════════
  function _buildMeasureLines(m, r) {
    while(measureGroup.children.length){const c=measureGroup.children[0];c.geometry?.dispose();c.material?.dispose();measureGroup.remove(c);}
    const {rBust,rWaist,rHip,rShoulder,h}=r;
    [{k:'bust',y:h.bust,r:rBust,c:0xf59e0b},{k:'waist',y:h.waist,r:rWaist,c:0xf59e0b},{k:'hip',y:h.hip,r:rHip,c:0xf59e0b},{k:'shoulder',y:h.shoulder,r:rShoulder,c:0x60a5fa}].forEach(ln=>{
      const isA=ln.k===_activeMeasureLine;
      const pts=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*ln.r,ln.y,Math.sin(a)*ln.r));}
      const mat=new THREE.LineBasicMaterial({color:isA?0xfbbf24:ln.c,opacity:isA?1:.5,transparent:true});
      measureGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mat));
      if(isA){const lp=[new THREE.Vector3(-ln.r*1.9,ln.y,0),new THREE.Vector3(ln.r*1.9,ln.y,0)];measureGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp),new THREE.LineBasicMaterial({color:0xfbbf24})));}
    });
  }

  // ════════════════════════════════════════════════════════════
  // PANEL UI
  // ════════════════════════════════════════════════════════════
  function _injectPanel() {
    const old=document.getElementById('m3d-panel');if(old)old.remove();
    const oldCSS=document.getElementById('m3d-css');if(oldCSS)oldCSS.remove();

    const css=document.createElement('style');css.id='m3d-css';
    css.textContent=`
      #m3d-panel{position:absolute;right:0;top:0;bottom:0;width:200px;background:rgba(7,7,15,.95);
        border-left:1px solid #2e2e45;display:flex;flex-direction:column;z-index:10;overflow:hidden}
      #m3d-hd{padding:9px 13px 7px;font-size:10px;font-weight:700;letter-spacing:1px;
        text-transform:uppercase;color:#a78bfa;border-bottom:1px solid #2e2e45;flex-shrink:0;
        display:flex;align-items:center;gap:6px}
      #m3d-gen{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:6px 9px;
        border-bottom:1px solid #2e2e45;flex-shrink:0}
      .m3g{padding:5px 3px;border-radius:6px;border:1.5px solid #2e2e45;background:#141420;
        color:#9490b0;cursor:pointer;font-size:11px;font-family:var(--font,'Segoe UI');
        transition:all .15s;text-align:center;display:flex;align-items:center;justify-content:center;gap:4px}
      .m3g:hover{background:#2a2a3e;color:#ede9fe}
      .m3g.on{background:rgba(139,92,246,.2);color:#a78bfa;border-color:#8b5cf6}
      #m3d-lbl{margin:5px 8px;padding:7px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);
        border-radius:6px;font-size:12px;font-weight:800;color:#fbbf24;text-align:center;
        display:none;font-family:monospace}
      #m3d-bd{flex:1;overflow-y:auto;padding:4px 7px}
      .m3s{font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#5a5678;padding:6px 4px 3px}
      .m3r{display:flex;align-items:center;padding:5px 7px;border-radius:5px;cursor:pointer;
        transition:all .15s;margin-bottom:2px;border:1.5px solid transparent}
      .m3r:hover{background:#1c1c2a;border-color:#2e2e45}
      .m3r.active{background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.3)}
      .m3d{width:7px;height:7px;border-radius:50%;flex-shrink:0}
      .m3n{font-size:11px;color:#9490b0;flex:1;margin-left:6px}
      .m3v{font-size:12px;font-weight:700;color:#ede9fe;font-family:monospace}
      .m3u{font-size:9px;color:#5a5678;margin-left:2px}
      #m3d-ft{padding:7px 8px;border-top:1px solid #2e2e45;display:flex;flex-direction:column;gap:5px;flex-shrink:0}
      #m3d-pg{height:3px;background:#1c1c2a;border-radius:2px;overflow:hidden;margin:0 2px;display:none}
      #m3d-pb{height:100%;width:0%;background:linear-gradient(90deg,#34d399,#8b5cf6);border-radius:2px}
      .m3b{width:100%;padding:7px;border:1px solid #3d3d58;background:transparent;color:#9490b0;
        border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font,'Segoe UI');
        transition:all .15s;display:flex;align-items:center;justify-content:center;gap:5px}
      .m3b:hover{background:#2a2a3e;color:#ede9fe}
      .m3sim{border-color:rgba(52,211,153,.4);color:#34d399;font-size:12px;font-weight:700}
      .m3sim:hover{background:rgba(52,211,153,.15)}
      .m3sim.running{border-color:rgba(251,191,36,.4);color:#fbbf24;animation:m3p 1s ease-in-out infinite}
      @keyframes m3p{0%,100%{opacity:1}50%{opacity:.6}}
      #three-canvas{width:calc(100% - 200px)!important}
      #ctrl-3d{display:none!important}
    `;
    document.head.appendChild(css);

    const panel=document.createElement('div');panel.id='m3d-panel';
    panel.innerHTML=`
      <div id="m3d-hd">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        Medidas de Avatar
      </div>
      <div id="m3d-gen">
        ${Object.entries(BT).map(([k,v])=>`<button class="m3g${k==='woman'?' on':''}" data-btype="${k}">${v.e} ${v.l}</button>`).join('')}
      </div>
      <div id="m3d-lbl"></div>
      <div id="m3d-bd">
        <div class="m3s">Contornos</div>
        <div class="m3r" data-mk="bust"><div class="m3d" style="background:#f59e0b"></div><span class="m3n">Busto</span><span class="m3v" id="m3v-bust">88</span><span class="m3u">cm</span></div>
        <div class="m3r" data-mk="waist"><div class="m3d" style="background:#f59e0b"></div><span class="m3n">Cintura</span><span class="m3v" id="m3v-waist">68</span><span class="m3u">cm</span></div>
        <div class="m3r" data-mk="hip"><div class="m3d" style="background:#f59e0b"></div><span class="m3n">Cadera</span><span class="m3v" id="m3v-hip">94</span><span class="m3u">cm</span></div>
        <div class="m3s">Anchuras</div>
        <div class="m3r" data-mk="shoulder"><div class="m3d" style="background:#60a5fa"></div><span class="m3n">Hombros</span><span class="m3v" id="m3v-shoulder">38</span><span class="m3u">cm</span></div>
        <div class="m3r" data-mk="neck"><div class="m3d" style="background:#60a5fa"></div><span class="m3n">Cuello</span><span class="m3v" id="m3v-neck">36</span><span class="m3u">cm</span></div>
        <div class="m3s">Largos</div>
        <div class="m3r" data-mk="backLength"><div class="m3d" style="background:#34d399"></div><span class="m3n">Talle esp.</span><span class="m3v" id="m3v-backLength">40</span><span class="m3u">cm</span></div>
        <div class="m3r" data-mk="sleeveLength"><div class="m3d" style="background:#34d399"></div><span class="m3n">Manga</span><span class="m3v" id="m3v-sleeveLength">60</span><span class="m3u">cm</span></div>
      </div>
      <div id="m3d-pg"><div id="m3d-pb"></div></div>
      <div id="m3d-ft">
        <button class="m3b m3sim" id="m3d-sim">▶ Simular tela</button>
        <button class="m3b" id="m3d-wire">⬡ Wireframe</button>
        <button class="m3b" id="m3d-cam">⌂ Reset cámara</button>
      </div>
    `;

    const view=document.getElementById('view-3d');
    if(view){view.style.position='relative';view.appendChild(panel);}

    // Selector género
    panel.querySelectorAll('.m3g').forEach(btn=>{
      btn.addEventListener('click',function(){
        _bodyType=this.dataset.btype;
        panel.querySelectorAll('.m3g').forEach(b=>b.classList.remove('on'));
        this.classList.add('on');
        _rebuildAll();
      });
    });

    // Hover medidas
    panel.querySelectorAll('.m3r').forEach(row=>{
      row.addEventListener('mouseenter',function(){
        _activeMeasureLine=this.dataset.mk;
        if(_currentRadii)_buildMeasureLines(_currentMeasures,_currentRadii);
        document.querySelectorAll('.m3r').forEach(r=>r.classList.remove('active'));
        this.classList.add('active');
        const lbl=document.getElementById('m3d-lbl');
        const names={bust:'Busto',waist:'Cintura',hip:'Cadera',shoulder:'Hombros',neck:'Cuello',backLength:'Talle esp.',sleeveLength:'Manga'};
        if(lbl&&_currentMeasures[this.dataset.mk]){lbl.textContent=`${names[this.dataset.mk]}: ${_currentMeasures[this.dataset.mk]}cm`;lbl.style.display='block';}
      });
      row.addEventListener('mouseleave',function(){
        _activeMeasureLine=null;
        if(_currentRadii)_buildMeasureLines(_currentMeasures,_currentRadii);
        document.querySelectorAll('.m3r').forEach(r=>r.classList.remove('active'));
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

  function _rebuildAll() {
    if(!Object.keys(_currentMeasures).length)return;
    const m=Object.assign({bust:88,waist:68,hip:94,shoulder:38,neck:36,backLength:40,frontLength:42,totalLength:65,sleeveLength:60,skirtLength:60,hipDepth:20},_currentMeasures);
    const radii=_buildBody(m);
    _currentRadii=radii;
    _buildGarment(_lastGarment,radii,m);
    _buildMeasureLines(m,radii);
  }

  let _simStep=0,_simRunning=false;

  function _toggleSim(){
    if(_simRunning){_simRunning=false;_updateSimBtn(false);return;}
    _simRunning=true;_simStep=0;_updateSimBtn(true);
    document.getElementById('m3d-pg').style.display='block';
    document.getElementById('m3d-pb').style.width='0%';
  }

  function _simTick(){
    if(!_simRunning)return;
    _simStep++;
    document.getElementById('m3d-pb').style.width=Math.min(_simStep/80*100,100)+'%';
    if(_simStep>=80){_simRunning=false;_updateSimBtn(false);document.getElementById('m3d-pg').style.display='none';}
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
  // API PÚBLICA
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
    camera.position.set(0,0.95,2.8);
    controls.target.set(0,0.8,0);
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
