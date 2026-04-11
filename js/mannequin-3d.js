/**
 * mannequin-3d.js v7 — PatrónAI Pro
 * Maniquí 3D con selección de género/edad, paredes de fondo,
 * ropa ajustada al cuerpo, panel de medidas estilo CLO.
 */
'use strict';
window.PAT = window.PAT || {};

PAT.Mannequin3D = (function () {

  let scene, camera, renderer, controls;
  let bodyGroup, garmentGroup, measureGroup;
  let _canvas = null, _animId = null, _initialized = false;
  let _currentMeasures = {}, _activeMeasureLine = null;
  let _isWireframe = false;
  let _bodyType = 'woman'; // woman | man | girl | boy

  // Proporciones del cuerpo por tipo (multiplicadores sobre medidas base)
  const BODY_TYPES = {
    woman: { label:'Mujer',  icon:'👩', bustM:1.00, waistM:0.82, hipM:1.00, shoulderM:0.88, neckM:0.95, heightM:1.00 },
    man:   { label:'Hombre', icon:'👨', bustM:1.10, waistM:0.96, hipM:0.86, shoulderM:1.08, neckM:1.08, heightM:1.05 },
    girl:  { label:'Niña',   icon:'👧', bustM:0.60, waistM:0.64, hipM:0.58, shoulderM:0.60, neckM:0.70, heightM:0.70 },
    boy:   { label:'Niño',   icon:'👦', bustM:0.58, waistM:0.62, hipM:0.56, shoulderM:0.62, neckM:0.68, heightM:0.68 },
  };

  // Alturas proporcionales del cuerpo (en unidades Three.js)
  const H = {
    floor:0, ankle:0.08, knee:0.40, crotch:0.50,
    hip:0.60, waist:0.74, underbust:0.82, bust:0.88,
    shoulder:0.97, neckBot:1.02, neckTop:1.09, headCtr:1.24,
  };

  function cmToR(circ_cm) { return circ_cm / (2 * Math.PI * 100); }

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
    scene.fog = new THREE.FogExp2(0x06060e, 0.12);

    camera = new THREE.PerspectiveCamera(38, W / Ht, 0.01, 30);
    camera.position.set(0, 0.9, 2.8);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 0.4;
    controls.maxDistance = 5;
    controls.target.set(0, 0.8, 0);
    controls.update();

    bodyGroup    = new THREE.Group();
    garmentGroup = new THREE.Group();
    measureGroup = new THREE.Group();
    scene.add(bodyGroup, garmentGroup, measureGroup);

    _buildScene();
    _injectUI();
    window.addEventListener('resize', _onResize);
    _animate();
    _initialized = true;
  }

  // ════════════════════════════════════════════════════════════
  // ESCENA BASE
  // ════════════════════════════════════════════════════════════
  function _buildScene() {
    // ── Suelo ──
    const floorMat = new THREE.MeshStandardMaterial({ color:0x0c0c1a, roughness:0.95 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 64), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(6, 32, 0x1a1a35, 0x0e0e20));

    // ── Paredes de fondo (esquina) ──
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0e0e1c, roughness: 0.92, metalness: 0.02, side: THREE.FrontSide
    });

    // Pared trasera
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), wallMat);
    backWall.position.set(0, 1.6, -2.4);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Pared lateral izquierda
    const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), wallMat);
    sideWall.position.set(-2.4, 1.6, 0);
    sideWall.rotation.y = Math.PI / 2;
    sideWall.receiveShadow = true;
    scene.add(sideWall);

    // Bordes de esquina (línea sutil)
    const edgeMat = new THREE.LineBasicMaterial({ color:0x1e1e35, opacity:0.6, transparent:true });
    const edgeV = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.4, 0, -2.4), new THREE.Vector3(-2.4, 3.2, -2.4)
    ]);
    scene.add(new THREE.Line(edgeV, edgeMat));

    // ── Luces ──
    scene.add(new THREE.AmbientLight(0xeeeeff, 0.40));

    const key = new THREE.DirectionalLight(0xfff8ee, 1.15);
    key.position.set(1.5, 3.5, 2.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xaabbff, 0.35);
    fill.position.set(-2, 2, -1);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x7c3aed, 0.4);
    rim.position.set(2, 3, -2);
    scene.add(rim);

    // ── Base del maniquí ──
    const baseMat = new THREE.MeshStandardMaterial({ color:0x1a1a30, metalness:0.7, roughness:0.3 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.25, 0.03, 40), baseMat);
    disc.position.y = 0.015;
    scene.add(disc);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.48, 12), baseMat);
    pole.position.y = 0.27;
    scene.add(pole);
  }

  // ════════════════════════════════════════════════════════════
  // CUERPO — distinto por género/edad
  // ════════════════════════════════════════════════════════════
  function _buildBody(m) {
    while (bodyGroup.children.length) {
      const c = bodyGroup.children[0];
      c.geometry?.dispose(); c.material?.dispose();
      bodyGroup.remove(c);
    }

    const bt   = BODY_TYPES[_bodyType] || BODY_TYPES.woman;
    const hMul = bt.heightM;
    const isChild = (_bodyType === 'girl' || _bodyType === 'boy');

    // Radios base calculados desde medidas
    const rB0 = cmToR(m.bust);
    const rW0 = cmToR(m.waist);
    const rH0 = cmToR(m.hip);
    const rN0 = cmToR(m.neck);
    const rS0 = (m.shoulder / 100) / 2;

    // Aplicar multiplicadores de género
    const rBust     = rB0 * bt.bustM;
    const rWaist    = rW0 * bt.waistM;
    const rHip      = rH0 * bt.hipM;
    const rNeck     = rN0 * bt.neckM;
    const rShoulder = rS0 * bt.shoulderM;

    // Alturas escaladas por altura del tipo de cuerpo
    const h = {};
    Object.entries(H).forEach(([k,v]) => h[k] = v * hMul);

    const skinColor = _bodyType === 'man' ? 0xc09070 : 0xc4956a;
    const skin = new THREE.MeshStandardMaterial({
      color: skinColor, roughness: 0.65, metalness: 0.02
    });

    function add(geo, pos, rotZ) {
      const m2 = new THREE.Mesh(geo, skin);
      m2.position.set(pos.x||0, pos.y||0, pos.z||0);
      if (rotZ !== undefined) m2.rotation.z = rotZ;
      m2.castShadow = true; m2.receiveShadow = true;
      bodyGroup.add(m2); return m2;
    }

    // ── Piernas ──
    const legX = rHip * (_bodyType==='man' ? 0.50 : 0.55);
    [-legX, legX].forEach(lx => {
      const side = lx < 0 ? -1 : 1;
      const calfH = h.knee - h.ankle;
      add(new THREE.CylinderGeometry(rHip*0.22, rHip*0.18, calfH, 14), {x:lx, y:h.ankle+calfH/2});
      const thighH = h.crotch - h.knee;
      add(new THREE.CylinderGeometry(rHip*0.38, rHip*0.25, thighH, 16), {x:lx, y:h.knee+thighH/2});
      // Pie
      const foot = new THREE.Mesh(new THREE.BoxGeometry(rHip*0.45, h.ankle*0.7, rHip*1.3), skin);
      foot.position.set(lx, h.ankle*0.35, rHip*0.3);
      foot.castShadow = true;
      bodyGroup.add(foot);
    });

    // ── Pelvis / cadera ──
    const pelvPts = [
      new THREE.Vector2(rHip*0.88, 0),
      new THREE.Vector2(rHip, h.hip-h.crotch),
      new THREE.Vector2(rWaist*1.04, h.waist-h.crotch-0.02),
      new THREE.Vector2(rWaist, h.waist-h.crotch),
    ];
    const pelvis = new THREE.Mesh(new THREE.LatheGeometry(pelvPts, 40), skin);
    pelvis.position.y = h.crotch;
    pelvis.castShadow = true;
    bodyGroup.add(pelvis);

    // ── Torso ──
    const torsoPts = [
      new THREE.Vector2(rWaist, 0),
      new THREE.Vector2(rWaist*1.05, 0.025),
      new THREE.Vector2(rBust*0.96, h.underbust-h.waist),
      new THREE.Vector2(rBust, h.bust-h.waist),
    ];

    // Mujer/niña: pechos más definidos
    if (_bodyType === 'woman' || _bodyType === 'girl') {
      torsoPts.push(new THREE.Vector2(rBust*0.93, h.bust-h.waist+0.03));
    }
    torsoPts.push(
      new THREE.Vector2(rShoulder*0.9, h.shoulder-h.waist-0.01),
      new THREE.Vector2(rNeck*1.35, h.neckBot-h.waist),
    );

    const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 44), skin);
    torso.position.y = h.waist;
    torso.castShadow = true;
    bodyGroup.add(torso);

    // ── Cuello ──
    const neckH = h.neckTop - h.neckBot;
    add(new THREE.CylinderGeometry(rNeck, rNeck*1.18, neckH, 18), {y:h.neckBot+neckH/2});

    // ── Cabeza ──
    const headR = rNeck * (_bodyType==='man' ? 2.2 : _bodyType==='woman' ? 2.0 : 1.85);
    const headGeo = new THREE.SphereGeometry(headR, 28, 22);
    const headMesh = new THREE.Mesh(headGeo, skin);
    headMesh.position.y = h.headCtr;
    // Cara levemente ovalada
    headMesh.scale.set(0.92, 1.0, 0.88);
    headMesh.castShadow = true;
    bodyGroup.add(headMesh);

    // ── Cabello (esfera encima) ──
    const hairColor = _bodyType==='man'?0x2a1a0a:_bodyType==='woman'?0x1a0a00:0x3a2010;
    const hairMat = new THREE.MeshStandardMaterial({ color:hairColor, roughness:0.95 });
    if (_bodyType !== 'man') {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(headR*1.04, 22, 16, 0, Math.PI*2, 0, Math.PI*0.55), hairMat);
      hair.position.y = h.headCtr + headR * 0.1;
      bodyGroup.add(hair);
    }

    // ── Brazos ──
    const aTopR  = rBust * (_bodyType==='man'?0.30:0.26);
    const aMidR  = rBust * (_bodyType==='man'?0.22:0.19);
    const aBotR  = rBust * (_bodyType==='man'?0.17:0.14);
    const uAH = 0.22 * hMul, fAH = 0.20 * hMul;
    const ang = _bodyType==='man' ? 0.28 : 0.33;

    [-1,1].forEach(side => {
      const ax = side * rShoulder;
      const elbowX = ax + side * Math.sin(ang) * uAH;
      const elbowY = h.shoulder - Math.cos(ang) * uAH;
      const ang2 = side * 0.15;

      const uArm = new THREE.Mesh(new THREE.CylinderGeometry(aMidR, aTopR, uAH, 14), skin);
      uArm.position.set(ax+side*Math.sin(ang)*uAH*0.5, h.shoulder-Math.cos(ang)*uAH*0.5, 0);
      uArm.rotation.z = side * ang;
      uArm.castShadow = true; bodyGroup.add(uArm);

      const fArm = new THREE.Mesh(new THREE.CylinderGeometry(aBotR, aMidR, fAH, 14), skin);
      fArm.position.set(elbowX+side*Math.sin(Math.abs(ang2))*fAH*0.5, elbowY-Math.cos(ang2)*fAH*0.5, 0);
      fArm.rotation.z = ang2;
      fArm.castShadow = true; bodyGroup.add(fArm);

      // Mano simplificada
      const hand = new THREE.Mesh(new THREE.SphereGeometry(aBotR*1.1, 10, 8), skin);
      hand.position.set(elbowX+side*Math.sin(Math.abs(ang2))*fAH, elbowY-fAH, 0);
      bodyGroup.add(hand);
    });

    return { rBust, rWaist, rHip, rNeck, rShoulder, h };
  }

  // ════════════════════════════════════════════════════════════
  // PRENDA — ajustada directamente al cuerpo
  // ════════════════════════════════════════════════════════════
  function _buildGarment(garmentType, radii, measures) {
    while (garmentGroup.children.length) {
      const c = garmentGroup.children[0];
      c.geometry?.dispose(); c.material?.dispose();
      garmentGroup.remove(c);
    }

    const { rBust, rWaist, rHip, rNeck, rShoulder, h } = radii;
    const EASE = 0.012; // 1.2cm de facilidad

    const gMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed, roughness: 0.55, metalness: 0.06,
      transparent: true, opacity: 0.88,
      side: THREE.DoubleSide,
      wireframe: _isWireframe,
    });

    const sleeveLen = measures.sleeveLength / 100;

    switch (garmentType) {
      case 'franela': case 'blusa':
        _addTorsoMesh(rBust+EASE, rWaist+EASE*0.8, rHip+EASE, rNeck+EASE*0.4, h, gMat);
        _addSleeveMesh(rBust+EASE, rShoulder, h, sleeveLen*0.6, gMat); // manga corta
        _addGrainLines(rBust+EASE, h.crotch, h.neckBot);
        break;

      case 'camisa':
        _addTorsoMesh(rBust+EASE*1.2, rWaist+EASE, rHip+EASE*1.2, rNeck+EASE*0.5, h, gMat);
        _addSleeveMesh(rBust+EASE, rShoulder, h, sleeveLen, gMat); // manga larga
        _addCollarMesh(rNeck+EASE*0.3, h, gMat);
        _addGrainLines(rBust+EASE, h.crotch, h.neckBot);
        break;

      case 'falda':
        _addSkirtMesh(rWaist+EASE, rHip+EASE, h, measures.skirtLength/100, measures.hipDepth/100, gMat);
        _addGrainLines(rHip+EASE, h.waist - measures.skirtLength/100, h.waist);
        break;

      case 'vestido':
        _addTorsoMesh(rBust+EASE, rWaist+EASE*0.8, rHip+EASE, rNeck+EASE*0.4, h, gMat);
        _addSkirtMesh(rHip+EASE*0.5, rHip+EASE, h, measures.skirtLength/100, 0.05, gMat, h.crotch);
        _addGrainLines(rBust+EASE, h.waist - measures.skirtLength/100, h.neckBot);
        break;
    }
  }

  function _addTorsoMesh(bR,wR,hR,nR,h,mat) {
    const pts = [
      new THREE.Vector2(hR*0.98,  0),
      new THREE.Vector2(hR*0.96,  h.hip-h.crotch),
      new THREE.Vector2(wR*1.03,  h.waist-h.crotch),
      new THREE.Vector2(wR,       h.waist-h.crotch+0.02),
      new THREE.Vector2(bR*0.97,  h.underbust-h.crotch),
      new THREE.Vector2(bR,       h.bust-h.crotch),
      new THREE.Vector2(bR*0.93,  h.bust-h.crotch+0.03),
      new THREE.Vector2(nR*1.45,  h.neckBot-h.crotch),
      new THREE.Vector2(nR*1.1,   h.neckBot-h.crotch+0.03),
    ];
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), mat);
    mesh.position.y = h.crotch;
    mesh.castShadow = true;
    garmentGroup.add(mesh);
  }

  function _addSleeveMesh(bR,sR,h,len,mat) {
    const topR = bR*0.50, botR = bR*0.23;
    const ang = 0.32;
    [-1,1].forEach(side => {
      const geo = new THREE.CylinderGeometry(botR, topR, len, 20, 1, true);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        side*(sR + topR*0.12 + Math.sin(ang)*len*0.5),
        h.shoulder - Math.cos(ang)*len*0.5, 0
      );
      mesh.rotation.z = side * ang;
      mesh.castShadow = true;
      garmentGroup.add(mesh);
    });
  }

  function _addCollarMesh(nR,h,mat) {
    const colH = 0.04;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(nR*1.05, nR*1.1, colH, 22, 1, true), mat);
    mesh.position.y = h.neckBot + colH/2;
    garmentGroup.add(mesh);
  }

  function _addSkirtMesh(wR,hR,h,skirtLen,hipDepth,mat,yBase) {
    const startY = yBase !== undefined ? yBase : h.waist;
    const pts = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i/steps;
      const r = t < (hipDepth/skirtLen)
        ? wR + (hR-wR)*(t/(hipDepth/skirtLen))
        : hR + (t-hipDepth/skirtLen)*0.015;
      pts.push(new THREE.Vector2(r, -t*skirtLen));
    }
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), mat);
    mesh.position.y = startY;
    mesh.castShadow = true;
    garmentGroup.add(mesh);
  }

  // Líneas de hilo rojo/azul sobre la prenda
  function _addGrainLines(radius, yBottom, yTop) {
    const redMat  = new THREE.LineBasicMaterial({ color:0xf87171, opacity:0.6, transparent:true });
    const blueMat = new THREE.LineBasicMaterial({ color:0x60a5fa, opacity:0.6, transparent:true });
    const segs = 10;
    for (let i = 0; i < segs; i++) {
      const t = i/segs;
      const a = t*Math.PI*2, b = a+Math.PI/segs;
      const ptsR = [
        new THREE.Vector3(Math.cos(a)*radius*0.97, yBottom, Math.sin(a)*radius*0.97),
        new THREE.Vector3(Math.cos(a)*radius*0.97, yTop,    Math.sin(a)*radius*0.97),
      ];
      garmentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsR), redMat));
      const ptsB = [
        new THREE.Vector3(Math.cos(a)*radius*0.97, yBottom, Math.sin(a)*radius*0.97),
        new THREE.Vector3(Math.cos(b)*radius*0.97, yTop,    Math.sin(b)*radius*0.97),
      ];
      garmentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsB), blueMat));
    }
  }

  // ════════════════════════════════════════════════════════════
  // LÍNEAS DE MEDIDA ESTILO CLO
  // ════════════════════════════════════════════════════════════
  function _buildMeasureLines(m, radii) {
    while (measureGroup.children.length) {
      const c = measureGroup.children[0];
      c.geometry?.dispose(); c.material?.dispose();
      measureGroup.remove(c);
    }
    const { rBust, rWaist, rHip, rShoulder, h } = radii;
    const lines = [
      { key:'bust',     y:h.bust,    r:rBust,     color:0xf59e0b, label:'Busto',   val:m.bust },
      { key:'waist',    y:h.waist,   r:rWaist,    color:0xf59e0b, label:'Cintura', val:m.waist },
      { key:'hip',      y:h.hip,     r:rHip,      color:0xf59e0b, label:'Cadera',  val:m.hip },
      { key:'shoulder', y:h.shoulder,r:rShoulder, color:0x60a5fa, label:'Hombros', val:m.shoulder },
    ];
    lines.forEach(ln => _addCircleLine(ln.y, ln.r, ln.color, ln.key===_activeMeasureLine));
  }

  function _addCircleLine(y, r, color, isActive) {
    const pts = [];
    for (let i=0; i<=64; i++) {
      const a = (i/64)*Math.PI*2;
      pts.push(new THREE.Vector3(Math.cos(a)*r, y, Math.sin(a)*r));
    }
    const mat = new THREE.LineBasicMaterial({
      color: isActive ? 0xfbbf24 : color,
      opacity: isActive ? 1.0 : 0.5,
      transparent: true,
    });
    measureGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));

    if (isActive) {
      const linePts = [new THREE.Vector3(-r*1.8,y,0), new THREE.Vector3(r*1.8,y,0)];
      measureGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(linePts),
        new THREE.LineBasicMaterial({ color:0xfbbf24 })
      ));
    }
  }

  // ════════════════════════════════════════════════════════════
  // UI — Panel de medidas + selector de género
  // ════════════════════════════════════════════════════════════
  function _injectUI() {
    if (document.getElementById('m3d-styles')) return;
    const style = document.createElement('style');
    style.id = 'm3d-styles';
    style.textContent = `
      #m3d-panel {
        position:absolute;right:0;top:0;bottom:0;width:200px;
        background:rgba(10,10,20,.93);border-left:1px solid #2e2e45;
        display:flex;flex-direction:column;backdrop-filter:blur(10px);z-index:10;
      }
      #m3d-title {
        padding:10px 13px;font-size:10px;font-weight:700;letter-spacing:1px;
        text-transform:uppercase;color:#a78bfa;border-bottom:1px solid #2e2e45;
        display:flex;align-items:center;gap:6px;flex-shrink:0;
      }
      /* Selector de género */
      #m3d-gender {
        display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:8px 10px;
        border-bottom:1px solid #2e2e45;flex-shrink:0;
      }
      .m3d-gbtn {
        padding:5px 4px;border-radius:6px;border:1.5px solid #2e2e45;
        background:#141420;color:#9490b0;cursor:pointer;font-size:11px;
        font-family:var(--font,'Segoe UI');transition:all .15s;text-align:center;
        display:flex;align-items:center;justify-content:center;gap:4px;
      }
      .m3d-gbtn:hover{background:#2a2a3e;color:#ede9fe}
      .m3d-gbtn.on{background:rgba(139,92,246,.18);color:#a78bfa;border-color:#8b5cf6}
      /* Medidas */
      #m3d-body{flex:1;overflow-y:auto;padding:6px}
      .m3d-sec{font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#5a5678;padding:8px 6px 3px}
      .m3d-row{display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-radius:6px;cursor:pointer;transition:all .15s;margin-bottom:2px;border:1.5px solid transparent}
      .m3d-row:hover{background:#2a2a3e;border-color:#3d3d58}
      .m3d-row.active{background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.35)}
      .m3d-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
      .m3d-nm{font-size:11px;color:#9490b0;flex:1;margin-left:7px}
      .m3d-val{font-size:12px;font-weight:700;color:#ede9fe;font-family:monospace}
      .m3d-unit{font-size:9px;color:#5a5678;margin-left:2px}
      /* Label activo */
      #m3d-active{margin:6px;padding:8px 10px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.35);
        border-radius:7px;font-size:13px;font-weight:800;color:#fbbf24;text-align:center;
        display:none;font-family:monospace}
      /* Footer */
      #m3d-foot{padding:8px;border-top:1px solid #2e2e45;display:flex;flex-direction:column;gap:6px;flex-shrink:0}
      .m3d-btn{width:100%;padding:8px;background:transparent;border:1px solid #3d3d58;color:#9490b0;
        border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font,'Segoe UI');
        transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px}
      .m3d-btn:hover{background:#2a2a3e;color:#ede9fe}
      .m3d-btn.sim{background:linear-gradient(135deg,rgba(52,211,153,.15),rgba(16,185,129,.08));
        border-color:rgba(52,211,153,.4);color:#34d399;font-size:12px;font-weight:700}
      .m3d-btn.sim:hover{background:rgba(52,211,153,.25)}
      .m3d-btn.sim.running{border-color:rgba(251,191,36,.4);color:#fbbf24;animation:pulse3d 1s ease-in-out infinite}
      @keyframes pulse3d{0%,100%{opacity:1}50%{opacity:.6}}
      #m3d-prog{height:3px;background:#1c1c2a;border-radius:2px;overflow:hidden;margin:0 8px 4px;display:none}
      #m3d-bar{height:100%;width:0%;background:linear-gradient(90deg,#34d399,#8b5cf6);transition:width .1s;border-radius:2px}
      #three-canvas{width:calc(100% - 200px)!important}
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div'); panel.id='m3d-panel';
    panel.innerHTML = `
      <div id="m3d-title">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        Medidas de Avatar
      </div>

      <div id="m3d-gender">
        ${Object.entries(BODY_TYPES).map(([k,v])=>`
          <button class="m3d-gbtn${k==='woman'?' on':''}" data-body="${k}">
            <span>${v.icon}</span><span>${v.label}</span>
          </button>`).join('')}
      </div>

      <div id="m3d-active"></div>
      <div id="m3d-body">
        <div class="m3d-sec">Contornos</div>
        <div class="m3d-row" data-key="bust"><div class="m3d-dot" style="background:#f59e0b"></div><span class="m3d-nm">Busto</span><span class="m3d-val" id="m3dv-bust">88</span><span class="m3d-unit">cm</span></div>
        <div class="m3d-row" data-key="waist"><div class="m3d-dot" style="background:#f59e0b"></div><span class="m3d-nm">Cintura</span><span class="m3d-val" id="m3dv-waist">68</span><span class="m3d-unit">cm</span></div>
        <div class="m3d-row" data-key="hip"><div class="m3d-dot" style="background:#f59e0b"></div><span class="m3d-nm">Cadera</span><span class="m3d-val" id="m3dv-hip">94</span><span class="m3d-unit">cm</span></div>
        <div class="m3d-sec">Anchuras</div>
        <div class="m3d-row" data-key="shoulder"><div class="m3d-dot" style="background:#60a5fa"></div><span class="m3d-nm">Hombros</span><span class="m3d-val" id="m3dv-shoulder">38</span><span class="m3d-unit">cm</span></div>
        <div class="m3d-row" data-key="neck"><div class="m3d-dot" style="background:#60a5fa"></div><span class="m3d-nm">Cuello</span><span class="m3d-val" id="m3dv-neck">36</span><span class="m3d-unit">cm</span></div>
        <div class="m3d-sec">Largos</div>
        <div class="m3d-row" data-key="backLength"><div class="m3d-dot" style="background:#34d399"></div><span class="m3d-nm">Talle esp.</span><span class="m3d-val" id="m3dv-backLength">40</span><span class="m3d-unit">cm</span></div>
        <div class="m3d-row" data-key="sleeveLength"><div class="m3d-dot" style="background:#34d399"></div><span class="m3d-nm">Manga</span><span class="m3d-val" id="m3dv-sleeveLength">60</span><span class="m3d-unit">cm</span></div>
      </div>

      <div id="m3d-prog"><div id="m3d-bar"></div></div>
      <div id="m3d-foot">
        <button class="m3d-btn sim" id="m3d-sim">▶ Simular tela</button>
        <button class="m3d-btn" id="m3d-wire">⬡ Wireframe</button>
        <button class="m3d-btn" id="m3d-reset">⌂ Reset cámara</button>
      </div>
    `;

    const view3d = document.getElementById('view-3d');
    if (view3d) { view3d.style.position='relative'; view3d.appendChild(panel); }

    // Selector de género
    panel.querySelectorAll('.m3d-gbtn').forEach(btn => {
      btn.addEventListener('click', function() {
        _bodyType = this.dataset.body;
        panel.querySelectorAll('.m3d-gbtn').forEach(b => b.classList.remove('on'));
        this.classList.add('on');
        // Re-renderizar con las mismas medidas
        if (_currentMeasures && Object.keys(_currentMeasures).length) {
          const m = Object.assign({bust:88,waist:68,hip:94,shoulder:38,neck:36,backLength:40,frontLength:42,totalLength:65,sleeveLength:60,skirtLength:60,hipDepth:20}, _currentMeasures);
          const radii = _buildBody(m);
          _buildMeasureLines(m, radii);
          _buildGarment(_lastGarmentType||'franela', radii, m);
        }
      });
    });

    // Hover en medidas
    panel.querySelectorAll('.m3d-row').forEach(row => {
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
        const inp = document.querySelector(`[data-measure="${this.dataset.key}"]`);
        if (inp) {
          const sb = document.getElementById('sidebar');
          if (sb && sb.classList.contains('collapsed')) sb.classList.remove('collapsed');
          inp.focus(); inp.select();
        }
      });
    });

    document.getElementById('m3d-sim').addEventListener('click', _runSimulation);
    document.getElementById('m3d-wire').addEventListener('click', function() {
      this.classList.toggle('on');
      toggleWireframe();
    });
    document.getElementById('m3d-reset').addEventListener('click', resetCamera);

    // Ocultar controles viejos
    const old = document.getElementById('ctrl-3d');
    if (old) old.style.display = 'none';
  }

  let _simStep = 0, _simRunning = false, _lastGarmentType = 'franela';

  function _runSimulation() {
    if (_simRunning) { _simRunning=false; _updateSimBtn(false); return; }
    _simRunning = true; _simStep = 0;
    _updateSimBtn(true);
    document.getElementById('m3d-prog').style.display = 'block';
    document.getElementById('m3d-bar').style.width = '0%';
  }

  function _simTick() {
    if (!_simRunning) return;
    _simStep++;
    // Animación suave de la ropa "asentándose"
    garmentGroup.traverse(c => {
      if (!c.isMesh || !c.geometry?.attributes?.position) return;
      const pos = c.geometry.attributes.position;
      let changed = false;
      for (let i = 0; i < pos.count; i++) {
        const noise = Math.sin(_simStep * 0.15 + i * 0.7) * Math.max(0, 0.003 * (1 - _simStep/120));
        pos.setY(i, pos.getY(i) + noise);
        changed = true;
      }
      if (changed) pos.needsUpdate = true;
    });
    const pct = Math.min(_simStep / 120, 1);
    const bar = document.getElementById('m3d-bar');
    if (bar) bar.style.width = (pct * 100) + '%';
    if (_simStep >= 120) {
      _simRunning = false;
      _updateSimBtn(false);
      document.getElementById('m3d-prog').style.display = 'none';
    }
  }

  function _updateSimBtn(running) {
    const btn = document.getElementById('m3d-sim');
    if (!btn) return;
    btn.classList.toggle('running', running);
    btn.innerHTML = running
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Simulando…`
      : `▶ Simular tela`;
  }

  function _highlightRow(key) {
    document.querySelectorAll('.m3d-row').forEach(r=>r.classList.toggle('active',r.dataset.key===key));
    const el=document.getElementById('m3d-active');
    if(el&&_currentMeasures[key]){
      const labels={bust:'Busto',waist:'Cintura',hip:'Cadera',shoulder:'Hombros',neck:'Cuello',backLength:'Talle esp.',sleeveLength:'Manga'};
      el.textContent=`${labels[key]||key}: ${_currentMeasures[key]}cm`;
      el.style.display='block';
    }
  }

  function _clearHighlight(){
    document.querySelectorAll('.m3d-row').forEach(r=>r.classList.remove('active'));
    const el=document.getElementById('m3d-active');if(el)el.style.display='none';
  }

  function _updatePanelValues(m){
    ['bust','waist','hip','shoulder','neck','backLength','sleeveLength'].forEach(k=>{
      const el=document.getElementById('m3dv-'+k);if(el&&m[k]!==undefined)el.textContent=m[k];
    });
  }

  function _refreshMeasureLines(){
    if(_currentMeasures&&Object.keys(_currentMeasures).length){
      const m=Object.assign({bust:88,waist:68,hip:94,shoulder:38,neck:36,backLength:40,sleeveLength:60},_currentMeasures);
      const bt=BODY_TYPES[_bodyType]||BODY_TYPES.woman;
      const h={};Object.entries(H).forEach(([k,v])=>h[k]=v*bt.heightM);
      const radii={
        rBust:cmToR(m.bust)*bt.bustM,rWaist:cmToR(m.waist)*bt.waistM,
        rHip:cmToR(m.hip)*bt.hipM,rNeck:cmToR(m.neck)*bt.neckM,
        rShoulder:(m.shoulder/100)/2*bt.shoulderM,h
      };
      _buildMeasureLines(m,radii);
    }
  }

  // ════════════════════════════════════════════════════════════
  // UPDATE GARMENT — llamado desde app.js
  // ════════════════════════════════════════════════════════════
  function updateGarment(garmentType, measures) {
    const m = Object.assign({
      bust:88,waist:68,hip:94,shoulder:38,neck:36,
      backLength:40,frontLength:42,totalLength:65,
      sleeveLength:60,wrist:16,skirtLength:60,hipDepth:20
    }, measures);

    _currentMeasures = m;
    _lastGarmentType = garmentType;

    _updatePanelValues(m);
    const radii = _buildBody(m);
    _buildMeasureLines(m, radii);
    _buildGarment(garmentType, radii, m);
  }

  // ════════════════════════════════════════════════════════════
  // CONTROLES
  // ════════════════════════════════════════════════════════════
  function toggleWireframe() {
    _isWireframe = !_isWireframe;
    garmentGroup.traverse(c=>{if(c.isMesh)c.material.wireframe=_isWireframe;});
  }

  function resetCamera() {
    camera.position.set(0, 0.9, 2.8);
    controls.target.set(0, 0.8, 0);
    controls.update();
  }

  function _onResize() {
    if (!_canvas||!renderer) return;
    const w=_canvas.clientWidth, h=_canvas.clientHeight;
    if(!w||!h) return;
    camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
  }

  function _animate() {
    _animId = requestAnimationFrame(_animate);
    _simTick();
    if (controls) controls.update();
    if (renderer&&scene&&camera) renderer.render(scene,camera);
  }

  function destroy() {
    if(_animId) cancelAnimationFrame(_animId);
    window.removeEventListener('resize', _onResize);
    if(renderer) renderer.dispose();
    _initialized = false;
  }

  return { init, updateGarment, toggleWireframe, resetCamera, destroy };
})();
