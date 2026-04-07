'use strict';
window.PAT = window.PAT || {};

PAT.Mannequin3D = (function () {

  let scene, camera, renderer, controls;
  let bodyGroup, garmentGroup, measureGroup;
  let isWireframe = false;
  let _canvas = null;
  let _animId = null;
  let _initialized = false;
  let _currentMeasures = {};
  let _activeMeasureLine = null;

  const SC = 0.01; // 1cm = 0.01 unidades

  const H = {
    floor:0, ankle:0.08, knee:0.40, crotch:0.50,
    hip:0.60, waist:0.74, underbust:0.82, bust:0.88,
    shoulder:0.97, neckBot:1.02, neckTop:1.09, headCtr:1.24,
  };

  function cmToRadius(circ_cm) {
    return circ_cm / (2 * Math.PI * 100);
  }

  // ─── INIT ──────────────────────────────────────────────────────
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

    _buildScene();

    bodyGroup    = new THREE.Group();
    garmentGroup = new THREE.Group();
    measureGroup = new THREE.Group();
    scene.add(bodyGroup);
    scene.add(garmentGroup);
    scene.add(measureGroup);

    window.addEventListener('resize', _onResize);
    _animate();
    _initialized = true;

    // Inyectar panel de medidas
    _injectMeasurePanel();
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

  // ─── CONSTRUIR CUERPO ──────────────────────────────────────────
  function _buildBody(m) {
    while (bodyGroup.children.length) {
      const c = bodyGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      bodyGroup.remove(c);
    }

    const rBust    = cmToRadius(m.bust);
    const rWaist   = cmToRadius(m.waist);
    const rHip     = cmToRadius(m.hip);
    const rNeck    = cmToRadius(m.neck);
    const rShoulder= (m.shoulder / 100) / 2;

    const skin = new THREE.MeshStandardMaterial({
      color: 0xc4956a, roughness: 0.68, metalness: 0.03
    });

    // Piernas
    const legLX = rHip * 0.55;
    [-legLX, legLX].forEach(lx => {
      const footGeo = new THREE.BoxGeometry(rHip * 0.5, H.ankle, rHip * 1.4);
      const foot = new THREE.Mesh(footGeo, skin);
      foot.position.set(lx, H.ankle / 2, rHip * 0.3);
      foot.castShadow = true;
      bodyGroup.add(foot);

      const calfH = H.knee - H.ankle;
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(rHip*0.22, rHip*0.19, calfH, 18), skin);
      calf.position.set(lx, H.ankle + calfH/2, 0);
      calf.castShadow = true;
      bodyGroup.add(calf);

      const thighH = H.crotch - H.knee;
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(rHip*0.40, rHip*0.26, thighH, 20), skin);
      thigh.position.set(lx, H.knee + thighH/2, 0);
      thigh.castShadow = true;
      bodyGroup.add(thigh);
    });

    // Pelvis/cadera
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

    // Cuello
    const neckH = H.neckTop - H.neckBot;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(rNeck, rNeck*1.2, neckH, 20), skin);
    neck.position.y = H.neckBot + neckH/2;
    neck.castShadow = true;
    bodyGroup.add(neck);

    // Cabeza
    const headR = rNeck * 2.05;
    const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 28, 20), skin);
    head.position.y = H.headCtr;
    head.castShadow = true;
    bodyGroup.add(head);

    // Brazos
    const aTopR = rBust*0.27, aMidR=rBust*0.20, aBotR=rBust*0.15;
    const upperArmH=0.24, foreArmH=0.22, ang=0.32;
    [-1,1].forEach(side => {
      const ax = side * rShoulder;
      const elbowX = ax + side*Math.sin(ang)*upperArmH;
      const elbowY = H.shoulder - Math.cos(ang)*upperArmH;

      const uArm = new THREE.Mesh(new THREE.CylinderGeometry(aMidR,aTopR,upperArmH,16), skin);
      uArm.position.set(ax+side*Math.sin(ang)*upperArmH*0.5, H.shoulder-Math.cos(ang)*upperArmH*0.5, 0);
      uArm.rotation.z = side*ang;
      uArm.castShadow = true;
      bodyGroup.add(uArm);

      const fArm = new THREE.Mesh(new THREE.CylinderGeometry(aBotR,aMidR,foreArmH,16), skin);
      const ang2 = side*0.18;
      fArm.position.set(elbowX+side*Math.sin(Math.abs(ang2))*foreArmH*0.5, elbowY-Math.cos(ang2)*foreArmH*0.5, 0);
      fArm.rotation.z = ang2;
      fArm.castShadow = true;
      bodyGroup.add(fArm);
    });

    return { rBust, rWaist, rHip, rNeck, rShoulder };
  }

  // ─── LÍNEAS DE MEDIDA ESTILO CLO ──────────────────────────────
  function _buildMeasureLines(m, radii) {
    // Limpiar líneas anteriores
    while (measureGroup.children.length) {
      const c = measureGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      measureGroup.remove(c);
    }

    const lines = [
      { name:'bust',     y: H.bust,    r: radii.rBust,    color: 0xf59e0b, label:'Busto',   value: m.bust },
      { name:'waist',    y: H.waist,   r: radii.rWaist,   color: 0xf59e0b, label:'Cintura', value: m.waist },
      { name:'hip',      y: H.hip,     r: radii.rHip,     color: 0xf59e0b, label:'Cadera',  value: m.hip },
      { name:'shoulder', y: H.shoulder,r: radii.rShoulder,color: 0x60a5fa, label:'Hombros', value: m.shoulder },
    ];

    lines.forEach(ln => {
      _addCircleLine(ln.y, ln.r, ln.color, ln.name === _activeMeasureLine);
    });

    // Si hay una línea activa, mostrar el valor
    if (_activeMeasureLine) {
      const active = lines.find(l => l.name === _activeMeasureLine);
      if (active) {
        _showMeasureLabel(active);
      }
    }
  }

  function _addCircleLine(y, radius, color, isActive) {
    const segments = 64;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: isActive ? 0xfbbf24 : color,
      linewidth: isActive ? 3 : 1,
      opacity: isActive ? 1.0 : 0.55,
      transparent: true,
    });
    const line = new THREE.Line(geo, mat);
    measureGroup.add(line);

    // Línea horizontal de medida (como en CLO — la línea amarilla)
    if (isActive) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-radius * 1.5, y, 0),
        new THREE.Vector3(radius * 1.5, y, 0),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xfbbf24 });
      measureGroup.add(new THREE.Line(lineGeo, lineMat));
    }
  }

  function _showMeasureLabel(ln) {
    // El label se actualiza en el panel HTML, no en el canvas 3D
    const el = document.getElementById('measure-active-label');
    if (el) {
      el.textContent = `${ln.label}: ${ln.value} cm`;
      el.style.display = 'block';
    }
  }

  // ─── PANEL DE MEDIDAS ESTILO CLO ──────────────────────────────
  function _injectMeasurePanel() {
    if (document.getElementById('clo-panel')) return;

    const style = document.createElement('style');
    style.textContent = `
      #clo-panel {
        position:absolute;right:0;top:0;bottom:0;
        width:200px;background:rgba(12,12,20,.92);
        border-left:1px solid #2e2e45;
        display:flex;flex-direction:column;
        backdrop-filter:blur(8px);z-index:10;
      }
      #clo-panel-title {
        padding:12px 14px;font-size:10px;font-weight:700;
        letter-spacing:1px;text-transform:uppercase;
        color:#a78bfa;border-bottom:1px solid #2e2e45;
        display:flex;align-items:center;gap:6px;
      }
      #clo-panel-body { flex:1;overflow-y:auto;padding:8px }
      .clo-section {
        font-size:9px;font-weight:700;letter-spacing:.8px;
        text-transform:uppercase;color:#5a5678;
        padding:10px 6px 4px;
      }
      .clo-measure-row {
        display:flex;align-items:center;justify-content:space-between;
        padding:7px 8px;border-radius:6px;cursor:pointer;
        transition:all .15s;margin-bottom:2px;
        border:1px solid transparent;
      }
      .clo-measure-row:hover { background:#2a2a3e;border-color:#3d3d58 }
      .clo-measure-row.active {
        background:rgba(251,191,36,.1);
        border-color:rgba(251,191,36,.4);
      }
      .clo-m-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0 }
      .clo-m-name { font-size:11px;color:#9490b0;flex:1;margin-left:8px }
      .clo-m-val {
        font-size:12px;font-weight:700;color:#ede9fe;
        font-family:monospace;
      }
      .clo-m-unit { font-size:9px;color:#5a5678;margin-left:2px }
      #measure-active-label {
        margin:8px;padding:10px 12px;
        background:rgba(251,191,36,.12);
        border:1px solid rgba(251,191,36,.4);
        border-radius:8px;font-size:13px;font-weight:800;
        color:#fbbf24;text-align:center;display:none;
        font-family:monospace;
      }
      .clo-wireframe-toggle {
        margin:8px;padding:8px;
        background:transparent;border:1px solid #3d3d58;
        color:#9490b0;border-radius:6px;
        font-size:11px;font-weight:600;cursor:pointer;
        font-family:var(--font,'Segoe UI');transition:all .15s;
        display:flex;align-items:center;gap:6px;
      }
      .clo-wireframe-toggle:hover { background:#2a2a3e;color:#ede9fe }
      .clo-wireframe-toggle.on { background:rgba(139,92,246,.15);border-color:#8b5cf6;color:#a78bfa }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'clo-panel';
    panel.innerHTML = `
      <div id="clo-panel-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        Medidas de Avatar
      </div>
      <div id="clo-panel-body">
        <div id="measure-active-label"></div>

        <div class="clo-section">Contornos</div>
        <div class="clo-measure-row" data-key="bust">
          <div class="clo-m-dot" style="background:#f59e0b"></div>
          <span class="clo-m-name">Busto</span>
          <span class="clo-m-val" id="clo-v-bust">88</span>
          <span class="clo-m-unit">cm</span>
        </div>
        <div class="clo-measure-row" data-key="waist">
          <div class="clo-m-dot" style="background:#f59e0b"></div>
          <span class="clo-m-name">Cintura</span>
          <span class="clo-m-val" id="clo-v-waist">68</span>
          <span class="clo-m-unit">cm</span>
        </div>
        <div class="clo-measure-row" data-key="hip">
          <div class="clo-m-dot" style="background:#f59e0b"></div>
          <span class="clo-m-name">Cadera Baja</span>
          <span class="clo-m-val" id="clo-v-hip">94</span>
          <span class="clo-m-unit">cm</span>
        </div>

        <div class="clo-section">Anchuras</div>
        <div class="clo-measure-row" data-key="shoulder">
          <div class="clo-m-dot" style="background:#60a5fa"></div>
          <span class="clo-m-name">Hombros</span>
          <span class="clo-m-val" id="clo-v-shoulder">38</span>
          <span class="clo-m-unit">cm</span>
        </div>
        <div class="clo-measure-row" data-key="neck">
          <div class="clo-m-dot" style="background:#60a5fa"></div>
          <span class="clo-m-name">Cuello</span>
          <span class="clo-m-val" id="clo-v-neck">36</span>
          <span class="clo-m-unit">cm</span>
        </div>

        <div class="clo-section">Largos</div>
        <div class="clo-measure-row" data-key="backLength">
          <div class="clo-m-dot" style="background:#34d399"></div>
          <span class="clo-m-name">Talle espalda</span>
          <span class="clo-m-val" id="clo-v-backLength">40</span>
          <span class="clo-m-unit">cm</span>
        </div>
        <div class="clo-measure-row" data-key="sleeveLength">
          <div class="clo-m-dot" style="background:#34d399"></div>
          <span class="clo-m-name">Largo manga</span>
          <span class="clo-m-val" id="clo-v-sleeveLength">60</span>
          <span class="clo-m-unit">cm</span>
        </div>
      </div>

      <button class="clo-wireframe-toggle" id="clo-wire-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        Wireframe
      </button>
    `;

    const view3d = document.getElementById('view-3d');
    if (view3d) {
      view3d.style.position = 'relative';
      view3d.appendChild(panel);

      // Ajustar canvas para dejar espacio al panel
      const canvas = document.getElementById('three-canvas');
      if (canvas) {
        canvas.style.width = 'calc(100% - 200px)';
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.bottom = '0';
      }
    }

    // Eventos — hover sobre medidas resalta la línea
    panel.querySelectorAll('.clo-measure-row').forEach(row => {
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
        // Hacer scroll al input correspondiente en el sidebar
        const input = document.querySelector(`[data-measure="${this.dataset.key}"]`);
        if (input) {
          input.focus();
          input.select();
          // Mostrar sidebar si está colapsado
          const sb = document.getElementById('sidebar');
          if (sb && sb.classList.contains('collapsed')) {
            sb.classList.remove('collapsed');
          }
        }
      });
    });

    // Wireframe toggle
    document.getElementById('clo-wire-btn').addEventListener('click', function() {
      this.classList.toggle('on');
      toggleWireframe();
    });
  }

  function _highlightRow(key) {
    document.querySelectorAll('.clo-measure-row').forEach(r => {
      r.classList.toggle('active', r.dataset.key === key);
    });
    const el = document.getElementById('measure-active-label');
    if (el && _currentMeasures[key]) {
      const labels = {
        bust:'Busto', waist:'Cintura', hip:'Cadera',
        shoulder:'Hombros', neck:'Cuello',
        backLength:'Talle esp', sleeveLength:'Largo manga'
      };
      el.textContent = `${labels[key] || key}: ${_currentMeasures[key]} cm`;
      el.style.display = 'block';
    }
  }

  function _clearHighlight() {
    document.querySelectorAll('.clo-measure-row').forEach(r => r.classList.remove('active'));
    const el = document.getElementById('measure-active-label');
    if (el) el.style.display = 'none';
  }

  function _refreshMeasureLines() {
    if (_currentMeasures && Object.keys(_currentMeasures).length) {
      const m = Object.assign({
        bust:88, waist:68, hip:94, shoulder:38, neck:36,
        backLength:40, sleeveLength:60
      }, _currentMeasures);
      const r = {
        rBust:    cmToRadius(m.bust),
        rWaist:   cmToRadius(m.waist),
        rHip:     cmToRadius(m.hip),
        rNeck:    cmToRadius(m.neck),
        rShoulder:(m.shoulder/100)/2,
      };
      _buildMeasureLines(m, r);
    }
  }

  // ─── ACTUALIZAR VALORES EN EL PANEL ───────────────────────────
  function _updatePanelValues(m) {
    const keys = ['bust','waist','hip','shoulder','neck','backLength','sleeveLength'];
    keys.forEach(k => {
      const el = document.getElementById('clo-v-' + k);
      if (el && m[k]) el.textContent = m[k];
    });
  }

  // ─── PRENDA 3D ────────────────────────────────────────────────
  function updateGarment(garmentType, measures, params) {
    const m = Object.assign({
      bust:88, waist:68, hip:94, shoulder:38, neck:36,
      backLength:40, frontLength:42, totalLength:65,
      sleeveLength:60, wrist:16, skirtLength:60, hipDepth:20
    }, measures);

    _currentMeasures = m;
    const radii = _buildBody(m);

    // Actualizar panel
    _updatePanelValues(m);
    _buildMeasureLines(m, radii);

    // Limpiar prenda anterior
    while (garmentGroup.children.length) {
      const c = garmentGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      garmentGroup.remove(c);
    }

    const EASE = 0.008;
    const bR = radii.rBust + EASE;
    const wR = radii.rWaist + EASE*0.8;
    const hR = radii.rHip + EASE;
    const nR = radii.rNeck + EASE*0.5;
    const sR = radii.rShoulder;
    const sleeveLen = m.sleeveLength / 100;

    const gMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed, roughness: 0.60, metalness: 0.06,
      transparent: true, opacity: isWireframe ? 0.5 : 0.86,
      side: THREE.DoubleSide, wireframe: isWireframe,
    });

    // Líneas de hilo rojo/azul en la prenda (estilo CLO)
    const grainMat_red  = new THREE.LineBasicMaterial({ color: 0xf87171, opacity:0.8, transparent:true });
    const grainMat_blue = new THREE.LineBasicMaterial({ color: 0x60a5fa, opacity:0.8, transparent:true });

    switch (garmentType) {
      case 'franela': case 'blusa':
        _garmentTorso(bR,wR,hR,nR,H.crotch,H.neckBot,gMat);
        _garmentSleeves(bR,sR,H.shoulder,sleeveLen*0.95,gMat);
        _addGrainLines(bR,H.crotch,H.neckBot,grainMat_red,grainMat_blue);
        break;
      case 'camisa':
        _garmentTorso(bR*1.02,wR*1.02,hR*1.02,nR,H.crotch,H.neckBot,gMat);
        _garmentSleeves(bR*1.02,sR,H.shoulder,sleeveLen,gMat);
        _garmentCollar(nR,H.neckBot,H.neckTop+0.03,gMat);
        _addGrainLines(bR,H.crotch,H.neckBot,grainMat_red,grainMat_blue);
        break;
      case 'falda':
        _garmentSkirt(wR,hR,H.waist,m.skirtLength/100,m.hipDepth/100,gMat);
        _addSkirtGrainLines(wR,hR,H.waist,m.skirtLength/100,grainMat_red,grainMat_blue);
        break;
      case 'vestido':
        _garmentTorso(bR,wR,hR,nR,H.crotch,H.neckBot,gMat);
        _garmentSkirt(hR,hR*1.02,H.crotch,m.skirtLength/100,0.05,gMat);
        _addGrainLines(bR,H.crotch,H.neckBot,grainMat_red,grainMat_blue);
        break;
    }
  }

  // ─── LÍNEAS DE HILO ESTILO CLO (rojo vertical, azul diagonal) ──
  function _addGrainLines(radius, yBottom, yTop, matRed, matBlue) {
    const h = yTop - yBottom;
    const segments = 8; // número de líneas

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;

      // Línea vertical roja
      const ptsRed = [
        new THREE.Vector3(Math.cos(angle)*radius*0.98, yBottom, Math.sin(angle)*radius*0.98),
        new THREE.Vector3(Math.cos(angle)*radius*0.98, yTop, Math.sin(angle)*radius*0.98),
      ];
      const geoRed = new THREE.BufferGeometry().setFromPoints(ptsRed);
      garmentGroup.add(new THREE.Line(geoRed, matRed));

      // Línea diagonal azul (desplazada 22.5°)
      const angleB = angle + Math.PI/8;
      const ptsBlue = [
        new THREE.Vector3(Math.cos(angleB)*radius*0.97, yBottom + h*0.1, Math.sin(angleB)*radius*0.97),
        new THREE.Vector3(Math.cos(angle)*radius*0.97, yTop - h*0.1, Math.sin(angle)*radius*0.97),
      ];
      const geoBlue = new THREE.BufferGeometry().setFromPoints(ptsBlue);
      garmentGroup.add(new THREE.Line(geoBlue, matBlue));
    }
  }

  function _addSkirtGrainLines(wR, hR, yWaist, skirtLen, matRed, matBlue) {
    const segments = 10;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      const rBot = hR + skirtLen * 0.015;

      const ptsRed = [
        new THREE.Vector3(Math.cos(angle)*wR*0.98, yWaist, Math.sin(angle)*wR*0.98),
        new THREE.Vector3(Math.cos(angle)*rBot*0.98, yWaist - skirtLen, Math.sin(angle)*rBot*0.98),
      ];
      garmentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsRed), matRed));

      const angleB = angle + Math.PI/10;
      const ptsBlue = [
        new THREE.Vector3(Math.cos(angleB)*wR*0.97, yWaist, Math.sin(angleB)*wR*0.97),
        new THREE.Vector3(Math.cos(angle)*rBot*0.97, yWaist - skirtLen, Math.sin(angle)*rBot*0.97),
      ];
      garmentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsBlue), matBlue));
    }
  }

  // ─── GEOMETRÍAS DE PRENDA ────────────────────────────────────
  function _garmentTorso(bR,wR,hR,nR,yBottom,yTop,mat){
    const h=yTop-yBottom;
    const pts=[
      new THREE.Vector2(hR,0),new THREE.Vector2(hR*0.96,h*0.08),
      new THREE.Vector2(wR*1.05,h*0.28),new THREE.Vector2(wR,h*0.36),
      new THREE.Vector2(wR*1.04,h*0.44),new THREE.Vector2(bR*0.96,h*0.60),
      new THREE.Vector2(bR,h*0.68),new THREE.Vector2(bR*0.92,h*0.82),
      new THREE.Vector2(nR*1.5,h*0.94),new THREE.Vector2(nR*1.1,h),
    ];
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(pts,52),mat);
    mesh.position.y=yBottom;mesh.castShadow=true;garmentGroup.add(mesh);
  }

  function _garmentSleeves(bR,sR,shoulderY,sleeveLen,mat){
    const topR=bR*0.52,botR=bR*0.24,ang=0.32;
    [-1,1].forEach(side=>{
      const geo=new THREE.CylinderGeometry(botR,topR,sleeveLen,22,1,true);
      const mesh=new THREE.Mesh(geo,mat);
      mesh.position.set(side*(sR+topR*0.15+Math.sin(ang)*sleeveLen*0.5),shoulderY-Math.cos(ang)*sleeveLen*0.5,0);
      mesh.rotation.z=side*ang;mesh.castShadow=true;garmentGroup.add(mesh);
    });
  }

  function _garmentCollar(nR,yBot,yTop,mat){
    const h=yTop-yBot;
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(nR*1.02,nR*1.08,h*0.5,24,1,true),mat);
    mesh.position.y=yBot+h*0.25;garmentGroup.add(mesh);
  }

  function _garmentSkirt(wR,hR,yWaist,skirtLen,hipDepth,mat){
    const pts=[];
    for(let i=0;i<=18;i++){
      const t=i/18;
      const r=t<(hipDepth/skirtLen)?wR+(hR-wR)*(t/(hipDepth/skirtLen)):hR+t*0.012;
      pts.push(new THREE.Vector2(r,-t*skirtLen));
    }
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(pts,52),mat);
    mesh.position.y=yWaist;mesh.castShadow=true;garmentGroup.add(mesh);
  }

  // ─── CONTROLES ────────────────────────────────────────────────
  function toggleWireframe(){
    isWireframe=!isWireframe;
    garmentGroup.traverse(c=>{
      if(!c.isMesh)return;
      c.material.wireframe=isWireframe;
      c.material.opacity=isWireframe?0.5:0.86;
    });
  }

  function resetCamera(){
    camera.position.set(0,0.9,3.0);
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
    if(controls)controls.update();
    if(renderer&&scene&&camera)renderer.render(scene,camera);
  }

  function destroy(){
    if(_animId)cancelAnimationFrame(_animId)
