/**
 * mannequin-3d.js v10 — PatrónAI Pro
 * Silueta humana real con secciones elípticas (loft mesh).
 * Cada anillo del cuerpo tiene rx, rz y desplazamiento cz diferente
 * → el pecho sobresale adelante, glúteos atrás, cintura marcada.
 */
'use strict';
window.PAT = window.PAT || {};

PAT.Mannequin3D = (function () {

  let scene, camera, renderer, controls;
  let bodyGroup, garmentGroup, measureGroup;
  let _canvas=null, _animId=null, _initialized=false;
  let _currentMeasures={}, _activeMeasureLine=null;
  let _isWireframe=false, _bodyType='woman', _lastGarment='franela';
  let _currentRadii=null;

  const BT = {
    woman:{ l:'Mujer',  e:'👩', bM:1.00, wM:0.78, hM:1.00, sM:0.88, nM:0.94, ht:1.00 },
    man:  { l:'Hombre', e:'👨', bM:1.14, wM:0.95, hM:0.86, sM:1.12, nM:1.08, ht:1.06 },
    girl: { l:'Niña',   e:'👧', bM:0.58, wM:0.63, hM:0.56, sM:0.60, nM:0.70, ht:0.70 },
    boy:  { l:'Niño',   e:'👦', bM:0.56, wM:0.61, hM:0.54, sM:0.63, nM:0.68, ht:0.68 },
  };

  function cmR(c){ return c/(2*Math.PI*100); }

  // ════════════════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════════════════
  function init(el){
    if(_initialized||!el)return;
    _canvas=el;
    const W=el.clientWidth||800, H=el.clientHeight||600;
    renderer=new THREE.WebGLRenderer({canvas:el,antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(W,H);
    renderer.setClearColor(0x07070f,1);
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;

    scene=new THREE.Scene();
    scene.fog=new THREE.FogExp2(0x07070f,0.07);

    camera=new THREE.PerspectiveCamera(36,W/H,0.01,30);
    camera.position.set(0,0.95,2.8);

    controls=new THREE.OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true; controls.dampingFactor=0.06;
    controls.minDistance=0.3; controls.maxDistance=6;
    controls.target.set(0,0.82,0); controls.update();

    bodyGroup=new THREE.Group();
    garmentGroup=new THREE.Group();
    measureGroup=new THREE.Group();
    scene.add(bodyGroup,garmentGroup,measureGroup);

    _buildScene();
    _injectPanel();
    window.addEventListener('resize',_onResize);
    _animate();
    _initialized=true;
  }

  // ════════════════════════════════════════════════════════════
  // ESCENA
  // ════════════════════════════════════════════════════════════
  function _buildScene(){
    scene.add(Object.assign(new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshStandardMaterial({color:0x090918,roughness:0.98})),{rotation:{x:-Math.PI/2},receiveShadow:true}));
    scene.add(new THREE.GridHelper(6,30,0x14142a,0x0c0c1e));
    const wm=new THREE.MeshStandardMaterial({color:0x0b0b1e,roughness:0.95,side:THREE.FrontSide});
    const bw=new THREE.Mesh(new THREE.PlaneGeometry(7,4),wm);bw.position.set(0,2,-2.5);bw.receiveShadow=true;scene.add(bw);
    const sw=new THREE.Mesh(new THREE.PlaneGeometry(7,4),wm.clone());sw.position.set(-2.5,2,0);sw.rotation.y=Math.PI/2;sw.receiveShadow=true;scene.add(sw);
    scene.add(new THREE.AmbientLight(0xeef0ff,0.40));
    const key=new THREE.DirectionalLight(0xfff8f0,1.30);
    key.position.set(1.5,3.5,2.5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
    key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=3;key.shadow.camera.bottom=-1;
    scene.add(key);
    scene.add(Object.assign(new THREE.DirectionalLight(0xb0c8ff,0.45),{position:new THREE.Vector3(-2,2,1)}));
    scene.add(Object.assign(new THREE.DirectionalLight(0x7c3aed,0.28),{position:new THREE.Vector3(0,2.5,-3)}));
    scene.add(new THREE.HemisphereLight(0xeeeeff,0x111133,0.25));
    const bm=new THREE.MeshStandardMaterial({color:0x1a1a32,metalness:0.8,roughness:0.2});
    scene.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,0.025,48),bm),{position:new THREE.Vector3(0,0.012,0)}));
    scene.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.5,14),bm),{position:new THREE.Vector3(0,0.275,0)}));
  }

  // ════════════════════════════════════════════════════════════
  // LOFT MESH — conecta secciones elípticas para forma no cilíndrica
  // sections: [{ y, rx, rz, cx=0, cz=0 }]
  // rx = radio izq-der, rz = radio front-back
  // cz > 0 = sección desplazada hacia adelante (busto)
  // cz < 0 = sección desplazada hacia atrás (glúteos)
  // ════════════════════════════════════════════════════════════
  function loftMesh(sections, segs, mat, closedTop, closedBot){
    segs=segs||32;
    const positions=[], normals=[], indices=[];

    sections.forEach(sec=>{
      for(let i=0;i<=segs;i++){
        const a=i/segs*Math.PI*2;
        positions.push(
          (sec.cx||0)+sec.rx*Math.cos(a),
          sec.y,
          (sec.cz||0)+sec.rz*Math.sin(a)
        );
        normals.push(Math.cos(a),0,Math.sin(a));
      }
    });

    for(let s=0;s<sections.length-1;s++){
      for(let i=0;i<segs;i++){
        const a=s*(segs+1)+i, b=a+1;
        const c=(s+1)*(segs+1)+i, d=c+1;
        indices.push(a,c,b, b,c,d);
      }
    }

    // Tapas
    function addCap(sec, yIdx, invert){
      const cx=sec.cx||0, cz=sec.cz||0;
      const ci=positions.length/3;
      positions.push(cx,sec.y,cz); normals.push(0,invert?-1:1,0);
      for(let i=0;i<=segs;i++){
        const a=i/segs*Math.PI*2;
        positions.push(cx+sec.rx*Math.cos(a),sec.y,cz+sec.rz*Math.sin(a));
        normals.push(0,invert?-1:1,0);
      }
      for(let i=0;i<segs;i++){
        if(invert) indices.push(ci,ci+1+i+1,ci+1+i);
        else       indices.push(ci,ci+1+i,ci+1+i+1);
      }
    }
    if(closedBot) addCap(sections[0],0,true);
    if(closedTop) addCap(sections[sections.length-1],sections.length-1,false);

    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo,mat);
  }

  // ════════════════════════════════════════════════════════════
  // CUERPO HUMANO — secciones elípticas por parte del cuerpo
  // ════════════════════════════════════════════════════════════
  function _buildBody(m){
    while(bodyGroup.children.length){
      const c=bodyGroup.children[0];c.geometry?.dispose();c.material?.dispose();bodyGroup.remove(c);
    }

    const bt=BT[_bodyType]||BT.woman;
    const ht=bt.ht;
    const isF=(_bodyType==='woman'||_bodyType==='girl');
    const isM=_bodyType==='man';
    const isCh=(_bodyType==='girl'||_bodyType==='boy');

    // Medidas base en metros
    const rB=cmR(m.bust)*bt.bM;
    const rW=cmR(m.waist)*bt.wM;
    const rH=cmR(m.hip)*bt.hM;
    const rN=cmR(m.neck)*bt.nM;
    const rS=(m.shoulder/100)/2*bt.sM;

    // Alturas absolutas
    const T=1.68*ht;
    const yAnk=T*0.048, yKne=T*0.268, yCro=T*0.478, yHip=T*0.535;
    const yWai=T*0.622, yBus=T*0.732, yArm=T*0.758, yShl=T*0.820;
    const yNkB=T*0.862, yNkT=T*0.900, yChi=T*0.930, yHdC=T*0.972;

    const SKIN={woman:0xd4a882,man:0xc09060,girl:0xdcb090,boy:0xc8966e}[_bodyType]||0xd4a882;
    const skin=new THREE.MeshStandardMaterial({color:SKIN,roughness:0.60,metalness:0.01,side:THREE.FrontSide});
    const skinBS=new THREE.MeshStandardMaterial({color:new THREE.Color(SKIN).multiplyScalar(0.96),roughness:0.62});

    function add(geo,x,y,z,rx,rz,sx,sy,sz){
      const ms=new THREE.Mesh(geo,skin);
      ms.position.set(x||0,y||0,z||0);
      if(rx!==undefined)ms.rotation.set(rx||0,rz||0,0);
      if(sx!==undefined)ms.scale.set(sx,sy||sx,sz||sx);
      ms.castShadow=true;ms.receiveShadow=true;bodyGroup.add(ms);return ms;
    }

    // ─── PIES ───
    [-1,1].forEach(s=>{
      const lx=s*rH*(isM?0.48:0.52);
      const foot=new THREE.Mesh(new THREE.BoxGeometry(rH*0.40,yAnk*0.65,rH*1.28),skin);
      foot.position.set(lx,yAnk*0.32,rH*0.20);foot.castShadow=true;bodyGroup.add(foot);
    });

    // ─── PIERNAS — loft con secciones elípticas ───
    // La pierna no es cilíndrica: más ancha de lado en rodilla, más profunda en pantorrilla
    [-1,1].forEach(s=>{
      const lx=s*rH*(isM?0.48:0.52);

      // Pantorrilla
      const calf=loftMesh([
        {y:0,      rx:rH*0.115, rz:rH*0.135},  // tobillo: más profundo que ancho
        {y:(yKne-yAnk)*0.25, rx:rH*0.145, rz:rH*0.175, cz:rH*0.02},  // vientre pantorrilla
        {y:(yKne-yAnk)*0.55, rx:rH*0.138, rz:rH*0.162},
        {y:(yKne-yAnk)*0.80, rx:rH*0.128, rz:rH*0.148},
        {y:(yKne-yAnk),      rx:rH*0.145, rz:rH*0.152},  // rodilla: más redondeada
      ],20,skin);
      calf.position.set(lx,yAnk,0);calf.castShadow=true;bodyGroup.add(calf);

      // Muslo — más ancho de lado, sobresale un poco adelante
      const thigh=loftMesh([
        {y:0,      rx:rH*0.145, rz:rH*0.155},  // encima rodilla
        {y:(yCro-yKne)*0.22, rx:rH*0.210, rz:rH*0.220, cz:rH*0.015},
        {y:(yCro-yKne)*0.50, rx:rH*0.235, rz:rH*0.228, cz:rH*0.018},  // punto más ancho
        {y:(yCro-yKne)*0.75, rx:rH*0.220, rz:rH*0.210},
        {y:(yCro-yKne),      rx:rH*0.195, rz:rH*0.185},  // entrepierna
      ],22,skin);
      thigh.position.set(lx,yKne,0);thigh.castShadow=true;bodyGroup.add(thigh);
    });

    // ─── PELVIS + CADERA — loft elíptico con glúteos ───
    // La cadera es más ancha de lado, y los glúteos sobresalen hacia atrás
    const pelvis=loftMesh([
      {y:0,            rx:rH*0.76, rz:rH*0.65, cz:-rH*0.05},   // entrepierna
      {y:(yHip-yCro)*0.28, rx:rH*0.88, rz:rH*0.80, cz:-rH*0.08},  // inicio cadera
      {y:(yHip-yCro)*0.60, rx:rH*1.00, rz:rH*0.88, cz:-rH*0.10},  // MAX cadera — glúteos atrás
      {y:(yHip-yCro)*0.80, rx:rH*0.98, rz:rH*0.84, cz:-rH*0.07},
      {y:(yHip-yCro),      rx:rW*1.04, rz:rW*0.92, cz:-rH*0.03},  // inicio cintura
      {y:(yWai-yCro),      rx:rW,      rz:rW*0.88, cz:0},          // cintura (más angosta)
    ],36,skin);
    pelvis.position.y=yCro;pelvis.castShadow=true;bodyGroup.add(pelvis);

    // ─── TORSO — la parte más crítica para la silueta ───
    // Cintura angosta, busto más ancho y sobresale adelante en mujer
    let torsoSecs;
    if(isF){
      // Perfil femenino: cintura marcada, busto saliente
      torsoSecs=[
        {y:0,               rx:rW,      rz:rW*0.88,  cz:0},         // cintura
        {y:(yBus-yWai)*0.15, rx:rW*0.98, rz:rW*0.90, cz:rB*0.02},
        {y:(yBus-yWai)*0.30, rx:rB*0.88, rz:rB*0.84, cz:rB*0.05},  // bajo busto
        {y:(yBus-yWai)*0.48, rx:rB*0.96, rz:rB*0.92, cz:rB*0.10},  // busto medio
        {y:(yBus-yWai)*0.62, rx:rB*1.00, rz:rB*0.95, cz:rB*0.14},  // MAX busto (adelante)
        {y:(yBus-yWai)*0.74, rx:rB*0.98, rz:rB*0.88, cz:rB*0.10},  // sobre busto
        {y:(yBus-yWai)*0.86, rx:rB*0.92, rz:rB*0.80, cz:rB*0.05},
        {y:(yShl-yWai)*0.88, rx:rS*1.02, rz:rS*0.82, cz:0},        // pecho alto
        {y:(yNkB-yWai),      rx:rN*1.40, rz:rN*1.22, cz:0},        // base cuello
      ];
    }else if(isM){
      // Perfil masculino: más rectangular, hombros muy anchos, pecho plano
      torsoSecs=[
        {y:0,               rx:rW*1.02, rz:rW*0.90, cz:0},
        {y:(yBus-yWai)*0.20, rx:rB*0.92, rz:rB*0.82, cz:rB*0.04},
        {y:(yBus-yWai)*0.45, rx:rB*0.98, rz:rB*0.88, cz:rB*0.06},  // pecho
        {y:(yBus-yWai)*0.65, rx:rB*1.04, rz:rB*0.90, cz:rB*0.06},  // pecho ancho
        {y:(yBus-yWai)*0.80, rx:rB*1.02, rz:rB*0.86, cz:rB*0.04},
        {y:(yShl-yWai)*0.88, rx:rS*1.08, rz:rS*0.88, cz:0},        // hombros anchos
        {y:(yNkB-yWai),      rx:rN*1.48, rz:rN*1.28, cz:0},
      ];
    }else{
      // Niño/niña: más recto, sin cintura marcada
      torsoSecs=[
        {y:0,               rx:rW*0.98, rz:rW*0.88, cz:0},
        {y:(yBus-yWai)*0.35, rx:rB*0.92, rz:rB*0.85, cz:rB*0.03},
        {y:(yBus-yWai)*0.65, rx:rB*0.96, rz:rB*0.88, cz:rB*0.04},
        {y:(yShl-yWai)*0.85, rx:rS*0.98, rz:rS*0.80, cz:0},
        {y:(yNkB-yWai),      rx:rN*1.35, rz:rN*1.18, cz:0},
      ];
    }
    const torso=loftMesh(torsoSecs,40,skin);
    torso.position.y=yWai;torso.castShadow=true;bodyGroup.add(torso);

    // ─── CUELLO ───
    const neck=loftMesh([
      {y:0,            rx:rN*1.38, rz:rN*1.20},
      {y:(yNkT-yNkB)*0.4, rx:rN*1.12, rz:rN*0.98},
      {y:(yNkT-yNkB),  rx:rN*0.98, rz:rN*0.86},
    ],20,skin);
    neck.position.y=yNkB;bodyGroup.add(neck);

    // ─── CABEZA — esferoide no simétrico ───
    const headR=rN*2.10*bt.nM;
    const headM=new THREE.Mesh(new THREE.SphereGeometry(headR,36,28),skin);
    headM.scale.set(0.88,1.02,0.84);
    headM.position.set(0,yHdC,0);headM.castShadow=true;bodyGroup.add(headM);

    // Mandíbula
    const jaw=new THREE.Mesh(new THREE.SphereGeometry(headR*0.72,24,16,0,Math.PI*2,Math.PI*0.52,Math.PI*0.24),skin);
    jaw.scale.set(isM?0.90:0.84,isM?0.55:0.48,isM?0.80:0.74);
    jaw.position.set(0,yChi,headR*0.06);bodyGroup.add(jaw);

    // ─── CABELLO ───
    const hcols={woman:0x2a1a0a,man:0x1a0e04,girl:0x7a4010,boy:0x2a1608};
    const hm=new THREE.MeshStandardMaterial({color:hcols[_bodyType],roughness:0.92});
    if(isF){
      const ht2=new THREE.Mesh(new THREE.SphereGeometry(headR*1.055,28,20,0,Math.PI*2,0,Math.PI*0.52),hm);
      ht2.scale.set(0.89,1.02,0.85);ht2.position.set(0,yHdC+headR*0.05,0);bodyGroup.add(ht2);
      [-1,1].forEach(s=>{
        const strand=new THREE.Mesh(new THREE.CylinderGeometry(headR*0.24,headR*0.12,headR*1.05,12),hm);
        strand.position.set(s*headR*0.86,yHdC-headR*0.22,0);strand.rotation.z=s*0.10;bodyGroup.add(strand);
      });
    }else if(isM){
      const ht2=new THREE.Mesh(new THREE.SphereGeometry(headR*1.028,24,16,0,Math.PI*2,0,Math.PI*0.43),hm);
      ht2.scale.set(0.88,1.0,0.84);ht2.position.set(0,yHdC+headR*0.02,0);bodyGroup.add(ht2);
    }else{
      const ht2=new THREE.Mesh(new THREE.SphereGeometry(headR*1.05,22,16,0,Math.PI*2,0,Math.PI*0.50),hm);
      ht2.scale.set(0.88,1.0,0.84);ht2.position.set(0,yHdC+headR*0.04,0);bodyGroup.add(ht2);
      if(_bodyType==='girl'){[-1,1].forEach(s=>{const b=new THREE.Mesh(new THREE.SphereGeometry(headR*0.30,14,10),hm);b.position.set(s*headR*0.90,yHdC+headR*0.38,0);bodyGroup.add(b);});}
    }

    // ─── RASGOS FACIALES ───
    const eyeY=yHdC+headR*0.07, eyeZ=headR*0.79;
    const ewm=new THREE.MeshStandardMaterial({color:0xf0eee8,roughness:0.2});
    const im=new THREE.MeshStandardMaterial({color:{woman:0x4a3020,man:0x1a1808,girl:0x2a4a7a,boy:0x1a3060}[_bodyType],roughness:0.15});
    const pm=new THREE.MeshStandardMaterial({color:0x050505});
    [-1,1].forEach(s=>{
      const ex=s*headR*0.30;
      const ew=new THREE.Mesh(new THREE.SphereGeometry(headR*0.085,14,10),ewm);
      ew.scale.set(1.1,0.76,0.52);ew.position.set(ex,eyeY,eyeZ);bodyGroup.add(ew);
      const ir=new THREE.Mesh(new THREE.CircleGeometry(headR*0.060,12),im);
      ir.position.set(ex,eyeY,eyeZ+headR*0.014);bodyGroup.add(ir);
      const pu=new THREE.Mesh(new THREE.CircleGeometry(headR*0.030,10),pm);
      pu.position.set(ex,eyeY,eyeZ+headR*0.016);bodyGroup.add(pu);
      // Ceja
      const brow=new THREE.Mesh(new THREE.BoxGeometry(headR*0.20,headR*0.026,headR*0.035),new THREE.MeshStandardMaterial({color:0x2a1a06}));
      brow.position.set(ex,eyeY+headR*0.155,eyeZ+headR*0.018);brow.rotation.z=s*0.07;bodyGroup.add(brow);
    });
    // Nariz
    const nsm=new THREE.MeshStandardMaterial({color:new THREE.Color(SKIN).multiplyScalar(0.92),roughness:0.65});
    const ns=new THREE.Mesh(new THREE.SphereGeometry(headR*0.082,12,10),nsm);
    ns.scale.set(0.64,0.52,1.15);ns.position.set(0,yHdC-headR*0.11,eyeZ+headR*0.14);bodyGroup.add(ns);
    // Labios
    const lm=new THREE.MeshStandardMaterial({color:isF?0xd08080:0xb07060,roughness:0.55});
    [{dy:0.27,sy:0.42},{dy:0.34,sy:0.38}].forEach((l,i)=>{
      const lb=new THREE.Mesh(new THREE.SphereGeometry(headR*0.115,12,8,0,Math.PI),lm);
      lb.scale.set(isM?1.0:1.15,l.sy,0.58);lb.position.set(0,yHdC-headR*l.dy,eyeZ+headR*0.07);bodyGroup.add(lb);
    });
    // Orejas
    const em=new THREE.MeshStandardMaterial({color:new THREE.Color(SKIN).multiplyScalar(0.90),roughness:0.68});
    [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(headR*0.135,12,10),em);e.scale.set(0.44,0.66,0.32);e.position.set(s*headR*0.87,yHdC-headR*0.05,0);bodyGroup.add(e);});

    // ─── HOMBROS — esferoide aplastado ───
    [-1,1].forEach(s=>{
      const shr=rB*(isM?0.19:0.165);
      const sh=new THREE.Mesh(new THREE.SphereGeometry(shr,18,14),skin);
      sh.scale.set(1.0,0.80,0.85);sh.position.set(s*rS*1.02,yShl,0);sh.castShadow=true;bodyGroup.add(sh);
    });

    // ─── BRAZOS — loft elíptico ───
    const aTop=rB*(isM?0.148:0.122), aMid=rB*(isM?0.135:0.110), aFore=rB*(isM?0.118:0.096), aWris=rB*(isM?0.088:0.075);
    const uAH=(yShl-yArm)*0.94, fAH=uAH*0.92, ang=isM?0.22:0.28;

    [-1,1].forEach(s=>{
      const ax=s*rS;
      const elbX=ax+s*Math.sin(ang)*uAH, elbY=yShl-Math.cos(ang)*uAH;

      // Brazo superior — bícep más saliente por delante en hombre
      const uArm=loftMesh([
        {y:0,       rx:aTop, rz:aTop},
        {y:uAH*0.28, rx:aMid*1.08, rz:aMid*(isM?1.12:1.05), cz:isM?aMid*0.04:aMid*0.02},
        {y:uAH*0.55, rx:aMid*1.04, rz:aMid*0.98},
        {y:uAH*0.80, rx:aFore*1.05, rz:aFore},
        {y:uAH,      rx:aFore, rz:aFore*0.95},
      ],16,skin);
      uArm.position.set(ax+s*Math.sin(ang)*uAH*0.5, yShl-Math.cos(ang)*uAH*0.5, 0);
      uArm.rotation.z=s*ang;uArm.castShadow=true;bodyGroup.add(uArm);

      // Codo
      add(new THREE.SphereGeometry(aFore*1.0,14,10),elbX,elbY,0);

      // Antebrazo
      const fa=s*0.12;
      const fArm=loftMesh([
        {y:0,       rx:aFore*0.95, rz:aFore*0.92},
        {y:fAH*0.25, rx:aFore*1.04, rz:aFore*1.02},
        {y:fAH*0.55, rx:aFore*0.96, rz:aFore*0.94},
        {y:fAH*0.80, rx:aWris*1.20, rz:aWris*1.12},
        {y:fAH,      rx:aWris, rz:aWris*0.92},
      ],14,skin);
      fArm.position.set(elbX+s*Math.sin(Math.abs(fa))*fAH*0.5, elbY-Math.cos(fa)*fAH*0.5, 0);
      fArm.rotation.z=fa;fArm.castShadow=true;bodyGroup.add(fArm);

      // Mano
      const hx=elbX+s*Math.sin(Math.abs(fa))*fAH, hy=elbY-fAH;
      const hand=new THREE.Mesh(new THREE.SphereGeometry(aWris*1.18,14,10),skin);
      hand.scale.set(1.12,0.60,1.32);hand.position.set(hx,hy,0);bodyGroup.add(hand);

      // Dedos
      for(let f=0;f<4;f++){
        const fo=(f-1.5)*aWris*0.40, fl=aWris*(f===1||f===2?0.72:0.58);
        const fin=new THREE.Mesh(new THREE.CylinderGeometry(aWris*0.10,aWris*0.11,fl,8),skin);
        fin.position.set(hx+fo,hy-aWris*0.36-fl*0.5,aWris*0.14);bodyGroup.add(fin);
      }
      const th=new THREE.Mesh(new THREE.CylinderGeometry(aWris*0.10,aWris*0.12,aWris*0.52,8),skin);
      th.position.set(hx+s*aWris*0.62,hy-aWris*0.22,0);th.rotation.z=s*0.6;th.rotation.x=0.35;bodyGroup.add(th);
    });

    return{rBust:rB,rWaist:rW,rHip:rH,rNeck:rN,rShoulder:rS,h:{bust:yBus,waist:yWai,hip:yHip,shoulder:yShl,neckBase:yNkB,crotch:yCro,underbust:yBus-rB*0.1,armpit:yArm}};
  }


  // ════════════════════════════════════════════════════════════
  // PRENDA
  // ════════════════════════════════════════════════════════════
  function _buildGarment(gt, r, m){
    while(garmentGroup.children.length){const c=garmentGroup.children[0];c.geometry?.dispose();c.material?.dispose();garmentGroup.remove(c);}
    const{rBust:rB,rWaist:rW,rHip:rH,rNeck:rN,rShoulder:rS,h}=r;
    const E=0.011;
    const isF=(_bodyType==='woman'||_bodyType==='girl');
    const gc={franela:0x6d28d9,blusa:0x9333ea,camisa:0x1d4ed8,falda:0xbe185d,vestido:0x7c3aed};
    const gm=new THREE.MeshStandardMaterial({color:gc[gt]||0x6d28d9,roughness:0.50,metalness:0.04,transparent:true,opacity:0.88,side:THREE.DoubleSide,wireframe:_isWireframe});
    const ht2=BT[_bodyType].ht;
    const sL=m.sleeveLength/100*ht2, skL=m.skirtLength/100*ht2;

    function garTorso(){
      let secs;
      if(isF){secs=[
        {y:0,          rx:rH+E*0.8,  rz:(rH+E*0.8)*0.88, cz:-(rH)*0.04},
        {y:(h.bust-h.crotch)*0.18, rx:rW+E*0.7, rz:(rW+E*0.7)*0.88, cz:0},
        {y:(h.bust-h.crotch)*0.42, rx:rB+E,    rz:(rB+E)*0.90, cz:(rB+E)*0.08},
        {y:(h.bust-h.crotch)*0.60, rx:rB+E,    rz:(rB+E)*0.94, cz:(rB+E)*0.14},
        {y:(h.bust-h.crotch)*0.75, rx:rB*0.96+E, rz:(rB*0.96+E)*0.88, cz:(rB+E)*0.06},
        {y:(h.neckBase-h.crotch)*0.88, rx:rS+E*0.5, rz:(rS+E*0.5)*0.84, cz:0},
        {y:(h.neckBase-h.crotch), rx:rN+E*0.3, rz:(rN+E*0.3)*0.92, cz:0},
      ];}else{secs=[
        {y:0,          rx:rH+E,     rz:(rH+E)*0.88},
        {y:(h.bust-h.crotch)*0.30, rx:rW+E, rz:(rW+E)*0.90},
        {y:(h.bust-h.crotch)*0.60, rx:rB+E*1.3, rz:(rB+E*1.3)*0.90, cz:(rB)*0.05},
        {y:(h.neckBase-h.crotch)*0.88, rx:rS*1.06+E, rz:(rS+E)*0.86},
        {y:(h.neckBase-h.crotch), rx:rN+E*0.4, rz:(rN+E*0.4)*0.90},
      ];}
      const mg=loftMesh(secs,44,gm);mg.position.y=h.crotch;mg.castShadow=true;garmentGroup.add(mg);
    }

    function garSleeve(longSleeve){
      const len=longSleeve?sL:(h.shoulder-h.armpit)*0.65;
      const ang=0.27;
      [-1,1].forEach(s=>{
        const secs=longSleeve?[
          {y:0,      rx:rB*0.50+E, rz:rB*0.46+E},
          {y:len*0.4, rx:rB*0.34+E, rz:rB*0.32+E},
          {y:len*0.75, rx:rB*0.25+E, rz:rB*0.24+E},
          {y:len,    rx:rB*0.20+E, rz:rB*0.19+E},
        ]:[
          {y:0,  rx:rB*0.50+E, rz:rB*0.46+E},
          {y:len,rx:rB*0.23+E, rz:rB*0.22+E},
        ];
        const mg=loftMesh(secs,18,gm);
        mg.position.set(s*(rS+rB*0.10+Math.sin(ang)*len*0.5),h.shoulder-Math.cos(ang)*len*0.5,0);
        mg.rotation.z=s*ang;mg.castShadow=true;garmentGroup.add(mg);
      });
    }

    function garSkirt(yBase){
      const secs=[{y:0,rx:rW+E,rz:(rW+E)*0.90}];
      for(let i=1;i<=16;i++){const t=i/16;const r2=lerp(rW+E,rH+E*0.8,Math.min(t*2.5,1));secs.push({y:-t*skL,rx:r2,rz:r2*0.94,cz:-(r2-rW)*0.05});}
      const mg=loftMesh(secs,40,gm);mg.position.y=yBase;mg.castShadow=true;garmentGroup.add(mg);
    }

    switch(gt){
      case 'franela':case'blusa':garTorso();garSleeve(false);grainLines(rB+E,h.crotch,h.neckBase);break;
      case 'camisa':garTorso();garSleeve(true);garmentGroup.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(rN+E*0.3,rN+E*0.35,0.04,24,1,true),gm),{position:new THREE.Vector3(0,h.neckBase+0.02,0)}));grainLines(rB+E,h.crotch,h.neckBase);break;
      case 'falda':garSkirt(h.waist);grainLines(rH+E,h.waist-skL,h.waist);break;
      case 'vestido':garTorso();garSkirt(h.crotch);grainLines(rB+E,h.crotch-skL,h.neckBase);break;
    }
  }

  function lerp(a,b,t){return a+(b-a)*Math.min(Math.max(t,0),1);}

  function grainLines(r,yB,yT){
    const rm=new THREE.LineBasicMaterial({color:0xf87171,opacity:0.45,transparent:true});
    const bm=new THREE.LineBasicMaterial({color:0x60a5fa,opacity:0.45,transparent:true});
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2,b=a+Math.PI/8;
      garmentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a)*r*0.97,yB,Math.sin(a)*r*0.97),new THREE.Vector3(Math.cos(a)*r*0.97,yT,Math.sin(a)*r*0.97)]),rm));
      garmentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a)*r*0.97,yB,Math.sin(a)*r*0.97),new THREE.Vector3(Math.cos(b)*r*0.97,yT,Math.sin(b)*r*0.97)]),bm));
    }
  }

  // ════════════════════════════════════════════════════════════
  // MEDIDAS
  // ════════════════════════════════════════════════════════════
  function _buildML(m,r){
    while(measureGroup.children.length){const c=measureGroup.children[0];c.geometry?.dispose();c.material?.dispose();measureGroup.remove(c);}
    const{rBust,rWaist,rHip,rShoulder,h}=r;
    [{k:'bust',y:h.bust,r:rBust,c:0xf59e0b},{k:'waist',y:h.waist,r:rWaist,c:0xf59e0b},{k:'hip',y:h.hip,r:rHip,c:0xf59e0b},{k:'shoulder',y:h.shoulder,r:rShoulder,c:0x60a5fa}].forEach(l=>{
      const isA=l.k===_activeMeasureLine;
      const pts=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*l.r,l.y,Math.sin(a)*l.r));}
      measureGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:isA?0xfbbf24:l.c,opacity:isA?1:.5,transparent:true})));
      if(isA){const lp=[new THREE.Vector3(-l.r*1.9,l.y,0),new THREE.Vector3(l.r*1.9,l.y,0)];measureGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp),new THREE.LineBasicMaterial({color:0xfbbf24})));}
    });
  }

  // ════════════════════════════════════════════════════════════
  // PANEL UI
  // ════════════════════════════════════════════════════════════
  function _injectPanel(){
    document.getElementById('m3d-panel')?.remove();
    document.getElementById('m3d-css')?.remove();
    const css=document.createElement('style');css.id='m3d-css';
    css.textContent=`#m3d-panel{position:absolute;right:0;top:0;bottom:0;width:200px;background:rgba(7,7,15,.95);border-left:1px solid #2e2e45;display:flex;flex-direction:column;z-index:10;overflow:hidden}#m3d-hd{padding:9px 13px 7px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#a78bfa;border-bottom:1px solid #2e2e45;flex-shrink:0;display:flex;align-items:center;gap:6px}#m3d-gen{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:6px 9px;border-bottom:1px solid #2e2e45;flex-shrink:0}.m3g{padding:5px 3px;border-radius:6px;border:1.5px solid #2e2e45;background:#141420;color:#9490b0;cursor:pointer;font-size:11px;font-family:var(--font,'Segoe UI');transition:all .15s;text-align:center}.m3g:hover{background:#2a2a3e;color:#ede9fe}.m3g.on{background:rgba(139,92,246,.2);color:#a78bfa;border-color:#8b5cf6}#m3d-lbl{margin:5px 8px;padding:7px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:6px;font-size:12px;font-weight:800;color:#fbbf24;text-align:center;display:none;font-family:monospace}#m3d-bd{flex:1;overflow-y:auto;padding:4px 7px}.m3s{font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#5a5678;padding:6px 4px 3px}.m3r{display:flex;align-items:center;padding:5px 7px;border-radius:5px;cursor:pointer;transition:all .15s;margin-bottom:2px;border:1.5px solid transparent}.m3r:hover{background:#1c1c2a;border-color:#2e2e45}.m3r.active{background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.3)}.m3d{width:7px;height:7px;border-radius:50%;flex-shrink:0}.m3n{font-size:11px;color:#9490b0;flex:1;margin-left:6px}.m3v{font-size:12px;font-weight:700;color:#ede9fe;font-family:monospace}.m3u{font-size:9px;color:#5a5678;margin-left:2px}#m3d-ft{padding:7px 8px;border-top:1px solid #2e2e45;display:flex;flex-direction:column;gap:5px;flex-shrink:0}#m3d-pg{height:3px;background:#1c1c2a;border-radius:2px;overflow:hidden;margin:0 2px;display:none}#m3d-pb{height:100%;width:0%;background:linear-gradient(90deg,#34d399,#8b5cf6);border-radius:2px}.m3b{width:100%;padding:7px;border:1px solid #3d3d58;background:transparent;color:#9490b0;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font,'Segoe UI');transition:all .15s;display:flex;align-items:center;justify-content:center;gap:5px}.m3b:hover{background:#2a2a3e;color:#ede9fe}.m3sim{border-color:rgba(52,211,153,.4);color:#34d399;font-size:12px;font-weight:700}.m3sim:hover{background:rgba(52,211,153,.15)}.m3sim.running{border-color:rgba(251,191,36,.4);color:#fbbf24;animation:m3p 1s ease-in-out infinite}@keyframes m3p{0%,100%{opacity:1}50%{opacity:.6}}#three-canvas{width:calc(100% - 200px)!important}#ctrl-3d{display:none!important}`;
    document.head.appendChild(css);

    const panel=document.createElement('div');panel.id='m3d-panel';
    panel.innerHTML=`<div id="m3d-hd"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>Medidas de Avatar</div><div id="m3d-gen">${Object.entries(BT).map(([k,v])=>`<button class="m3g${k==='woman'?' on':''}" data-btype="${k}">${v.e} ${v.l}</button>`).join('')}</div><div id="m3d-lbl"></div><div id="m3d-bd"><div class="m3s">Contornos</div><div class="m3r" data-mk="bust"><div class="m3d" style="background:#f59e0b"></div><span class="m3n">Busto</span><span class="m3v" id="m3v-bust">88</span><span class="m3u">cm</span></div><div class="m3r" data-mk="waist"><div class="m3d" style="background:#f59e0b"></div><span class="m3n">Cintura</span><span class="m3v" id="m3v-waist">68</span><span class="m3u">cm</span></div><div class="m3r" data-mk="hip"><div class="m3d" style="background:#f59e0b"></div><span class="m3n">Cadera</span><span class="m3v" id="m3v-hip">94</span><span class="m3u">cm</span></div><div class="m3s">Anchuras</div><div class="m3r" data-mk="shoulder"><div class="m3d" style="background:#60a5fa"></div><span class="m3n">Hombros</span><span class="m3v" id="m3v-shoulder">38</span><span class="m3u">cm</span></div><div class="m3r" data-mk="neck"><div class="m3d" style="background:#60a5fa"></div><span class="m3n">Cuello</span><span class="m3v" id="m3v-neck">36</span><span class="m3u">cm</span></div><div class="m3s">Largos</div><div class="m3r" data-mk="backLength"><div class="m3d" style="background:#34d399"></div><span class="m3n">Talle esp.</span><span class="m3v" id="m3v-backLength">40</span><span class="m3u">cm</span></div><div class="m3r" data-mk="sleeveLength"><div class="m3d" style="background:#34d399"></div><span class="m3n">Manga</span><span class="m3v" id="m3v-sleeveLength">60</span><span class="m3u">cm</span></div></div><div id="m3d-pg"><div id="m3d-pb"></div></div><div id="m3d-ft"><button class="m3b m3sim" id="m3d-sim">▶ Simular tela</button><button class="m3b" id="m3d-wire">⬡ Wireframe</button><button class="m3b" id="m3d-cam">⌂ Reset cámara</button></div>`;

    const view=document.getElementById('view-3d');
    if(view){view.style.position='relative';view.appendChild(panel);}

    panel.querySelectorAll('.m3g').forEach(btn=>{btn.addEventListener('click',function(){_bodyType=this.dataset.btype;panel.querySelectorAll('.m3g').forEach(b=>b.classList.remove('on'));this.classList.add('on');if(Object.keys(_currentMeasures).length)_rebuildAll();});});
    panel.querySelectorAll('.m3r').forEach(row=>{
      const names={bust:'Busto',waist:'Cintura',hip:'Cadera',shoulder:'Hombros',neck:'Cuello',backLength:'Talle esp.',sleeveLength:'Manga'};
      row.addEventListener('mouseenter',function(){_activeMeasureLine=this.dataset.mk;if(_currentRadii)_buildML(_currentMeasures,_currentRadii);document.querySelectorAll('.m3r').forEach(r=>r.classList.remove('active'));this.classList.add('active');const l=document.getElementById('m3d-lbl');if(l&&_currentMeasures[this.dataset.mk]){l.textContent=`${names[this.dataset.mk]}: ${_currentMeasures[this.dataset.mk]}cm`;l.style.display='block';}});
      row.addEventListener('mouseleave',function(){_activeMeasureLine=null;if(_currentRadii)_buildML(_currentMeasures,_currentRadii);document.querySelectorAll('.m3r').forEach(r=>r.classList.remove('active'));const l=document.getElementById('m3d-lbl');if(l)l.style.display='none';});
      row.addEventListener('click',function(){const inp=document.querySelector(`[data-measure="${this.dataset.mk}"]`);if(inp){const sb=document.getElementById('sidebar');if(sb?.classList.contains('collapsed'))sb.classList.remove('collapsed');inp.focus();inp.select();}});
    });
    document.getElementById('m3d-sim').addEventListener('click',_toggleSim);
    document.getElementById('m3d-wire').addEventListener('click',function(){this.classList.toggle('on');toggleWireframe();});
    document.getElementById('m3d-cam').addEventListener('click',resetCamera);
  }

  function _rebuildAll(){
    const m=Object.assign({bust:88,waist:68,hip:94,shoulder:38,neck:36,backLength:40,frontLength:42,totalLength:65,sleeveLength:60,skirtLength:60,hipDepth:20},_currentMeasures);
    const r=_buildBody(m);_currentRadii=r;_buildGarment(_lastGarment,r,m);_buildML(m,r);
  }

  let _simStep=0,_simRunning=false;
  function _toggleSim(){if(_simRunning){_simRunning=false;_updateSimBtn(false);return;}_simRunning=true;_simStep=0;_updateSimBtn(true);document.getElementById('m3d-pg').style.display='block';document.getElementById('m3d-pb').style.width='0%';}
  function _simTick(){if(!_simRunning)return;_simStep++;document.getElementById('m3d-pb').style.width=Math.min(_simStep/80*100,100)+'%';if(_simStep>=80){_simRunning=false;_updateSimBtn(false);document.getElementById('m3d-pg').style.display='none';}}
  function _updateSimBtn(r){const b=document.getElementById('m3d-sim');if(!b)return;b.classList.toggle('running',r);b.textContent=r?'■ Detener':'▶ Simular tela';}

  // ════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ════════════════════════════════════════════════════════════
  function updateGarment(gt,measures){
    const m=Object.assign({bust:88,waist:68,hip:94,shoulder:38,neck:36,backLength:40,frontLength:42,totalLength:65,sleeveLength:60,wrist:16,skirtLength:60,hipDepth:20},measures);
    _currentMeasures=m;_lastGarment=gt;
    ['bust','waist','hip','shoulder','neck','backLength','sleeveLength'].forEach(k=>{const e=document.getElementById('m3v-'+k);if(e&&m[k]!==undefined)e.textContent=m[k];});
    const r=_buildBody(m);_currentRadii=r;_buildGarment(gt,r,m);_buildML(m,r);
  }

  function toggleWireframe(){_isWireframe=!_isWireframe;garmentGroup.traverse(c=>{if(c.isMesh)c.material.wireframe=_isWireframe;});}
  function resetCamera(){camera.position.set(0,0.95,2.8);controls.target.set(0,0.82,0);controls.update();}
  function _onResize(){if(!_canvas||!renderer)return;const w=_canvas.clientWidth,h=_canvas.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
  function _animate(){_animId=requestAnimationFrame(_animate);_simTick();if(controls)controls.update();if(renderer&&scene&&camera)renderer.render(scene,camera);}
  function destroy(){if(_animId)cancelAnimationFrame(_animId);window.removeEventListener('resize',_onResize);if(renderer)renderer.dispose();_initialized=false;}

  return{init,updateGarment,toggleWireframe,resetCamera,destroy};
})();
