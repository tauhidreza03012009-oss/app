import * as THREE from 'three';

// ── MULTIPLAYER NETWORKING SETUP ──────────────────────────────────────────────
const socket = io();
let myNetworkId = null;
const remotePlayers = {}; 
const targetStates = {}; 

// ── SHARED STATE ──────────────────────────────────────────────────────────────
let vy = 0;
let running = false;

// ── JOYSTICK ──────────────────────────────────────────────────────────────────
let jx = 0, jy = 0, jId = -1;
const jstEl = document.getElementById('jst');
const jskEl = document.getElementById('jsk');
const JR = 50;

function moveJoy(t){
  const r = jstEl.getBoundingClientRect();
  let dx = t.clientX - (r.left + r.width / 2);
  let dy = t.clientY - (r.top + r.height / 2);
  const len = Math.sqrt(dx * dx + dy * dy);
  if(len > JR){ dx = (dx / len) * JR; dy = (dy / len) * JR; }
  jx = dx / JR; jy = dy / JR;
  jskEl.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
}

jstEl.addEventListener('touchstart', e => {
  e.preventDefault();
  if(jId !== -1) return;
  jId = e.changedTouches[0].identifier;
  moveJoy(e.changedTouches[0]);
  if(running) toggleRun(false);
}, {passive: false});

jstEl.addEventListener('touchmove', e => {
  e.preventDefault();
  for(const t of e.changedTouches) {
    if(t.identifier === jId){ moveJoy(t); break; }
  }
}, {passive: false});

jstEl.addEventListener('touchend', e => {
  for(const t of e.changedTouches) {
    if(t.identifier === jId){ jx=0; jy=0; jId=-1; jskEl.style.transform='translate(-50%,-50%)'; break; }
  }
});

jstEl.addEventListener('touchcancel', e => {
  for(const t of e.changedTouches) {
    if(t.identifier === jId){ jx=0; jy=0; jId=-1; jskEl.style.transform='translate(-50%,-50%)'; break; }
  }
});

// ── JUMP BUTTON ───────────────────────────────────────────────────────────────
document.getElementById('jmp').addEventListener('touchstart', e => {
  e.preventDefault();
  if(vy === 0) vy = 11;
}, {passive: false});

// ── RUN BUTTON ────────────────────────────────────────────────────────────────
const runEl = document.getElementById('run');
function toggleRun(force){
  running = (force !== undefined) ? force : !running;
  runEl.classList.toggle('active', running);
}
runEl.addEventListener('touchstart', e => { e.preventDefault(); toggleRun(); }, {passive: false});

// ── CAMERA DRAG (FIXED NATURAL SWIPE DIRECTIONS) ──────────────────────────────
let camYaw = 0, camPitch = 0.4, cId = -1, cLx = 0, cLy = 0;
window.addEventListener('touchstart', e => {
  for(const t of e.changedTouches){
    if(t.identifier === jId) continue;
    const r = jstEl.getBoundingClientRect();
    if(t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) continue;
    const jr = document.getElementById('jmp').getBoundingClientRect();
    if(t.clientX >= jr.left && t.clientX <= jr.right && t.clientY >= jr.top && t.clientY <= jr.bottom) continue;
    const fr = document.getElementById('fir').getBoundingClientRect();
    if(t.clientX >= fr.left && t.clientX <= fr.right && t.clientY >= fr.top && t.clientY <= fr.bottom) continue;
    if(cId === -1){ cId = t.identifier; cLx = t.clientX; cLy = t.clientY; }
  }
});

window.addEventListener('touchmove', e => {
  for(const t of e.changedTouches) {
    if(t.identifier === cId){
      camYaw -= (t.clientX - cLx) * 0.005; 
      camPitch = Math.max(0.05, Math.min(1.3, camPitch + (t.clientY - cLy) * 0.005)); 
      cLx = t.clientX; cLy = t.clientY;
    }
  }
});
window.addEventListener('touchend', e => { for(const t of e.changedTouches) if(t.identifier === cId) cId = -1; });

let mdown = false, mLx = 0, mLy = 0;
window.addEventListener('mousedown', e => { mdown = true; mLx = e.clientX; mLy = e.clientY; });
window.addEventListener('mouseup', () => mdown = false);
window.addEventListener('mousemove', e => {
  if(!mdown) return;
  camYaw -= (e.clientX - mLx) * 0.005; 
  camPitch = Math.max(0.05, Math.min(1.3, camPitch + (e.clientY - mLy) * 0.005)); 
  mLx = e.clientX; mLy = e.clientY;
});

// ── KEYBOARD ──────────────────────────────────────────────────────────────────
const K={};
window.addEventListener('keydown', e => {
  K[e.code] = true;
  if(e.code === 'Space' && vy === 0){ e.preventDefault(); vy = 11; }
  if(e.code === 'ShiftLeft' || e.code === 'ShiftRight') toggleRun();
  if(running && (e.code==='KeyW' || e.code==='KeyA' || e.code==='KeyS' || e.code==='KeyD' ||
     e.code==='ArrowUp' || e.code==='ArrowDown' || e.code==='ArrowLeft' || e.code==='ArrowRight')) {
    toggleRun(false);
  }
});
window.addEventListener('keyup', e => K[e.code] = false);

// ── MAIN INITIALIZATION ───────────────────────────────────────────────────────
async function main(){
  const R = await import('https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.12.0/rapier.es.js');
  await R.init();
  document.getElementById('loading').style.display = 'none';

  const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('c'), antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcce0ff); 
  scene.fog = new THREE.FogExp2(0xcce0ff, 0.0015); 
  const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 500); 

  const minimapCamera = new THREE.OrthographicCamera(-190, 190, 190, -190, 1, 500);
  minimapCamera.position.set(0, 200, 0);
  minimapCamera.lookAt(0, 0, 0);       

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(100, 200, 80);
  sun.castShadow = true;
  sun.shadow.camera.left = -160; sun.shadow.camera.right = 160;
  sun.shadow.camera.top = 160; sun.shadow.camera.bottom = -160;
  sun.shadow.camera.far = 400;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  // ── PHYSICS WORLD ────────────────────────────────────────────────────────────
  const world = new R.World({x: 0, y: -32, z: 0});

  // ── VILLAGE ENVIRONMENT SETUP ────────────────────────────────────────────────
  const grassMat  = new THREE.MeshStandardMaterial({color: 0x4c7c4c, roughness: 0.9});
  const pathMat   = new THREE.MeshStandardMaterial({color: 0xdfc49f, roughness: 0.8});
  const woodMat   = new THREE.MeshStandardMaterial({color: 0x6f4e37, roughness: 0.7});
  const roofMat   = new THREE.MeshStandardMaterial({color: 0xb23b3b, roughness: 0.6});
  const leafMat   = new THREE.MeshStandardMaterial({color: 0x2e5c2e, roughness: 0.9});
  const stoneMat  = new THREE.MeshStandardMaterial({color: 0x7a828a, roughness: 0.6});
  const crateMat  = new THREE.MeshStandardMaterial({color: 0xc69c6d, roughness: 0.5});
  const borderMat = new THREE.MeshStandardMaterial({color: 0x2b3e2b, roughness: 0.9});

  const MAP_SIZE = 360;
  const floorGeo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
  const floorMesh = new THREE.Mesh(floorGeo, grassMat); 
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const fBody = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(MAP_SIZE / 2, 0.5, MAP_SIZE / 2), fBody);

  function addStaticWall(x, y, z, w, h, d, material = borderMat){
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);
    const rb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z));
    world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2, d / 2), rb);
  }

  function addPath(x, z, w, d) {
    const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pathMat);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(x, 0.02, z); 
    pathMesh.receiveShadow = true;
    scene.add(pathMesh);
  }

  function addHouse(x, z, w = 14, h = 9, d = 14) {
    addStaticWall(x, h / 2, z, w, h, d, woodMat);
    addStaticWall(x, h + 1, z, w + 2, 2, d + 2, roofMat);
    addStaticWall(x, h + 2.5, z, w - 2, 1.5, d - 2, roofMat);
  }

  function addTree(x, z, trunkH = 5) {
    addStaticWall(x, trunkH / 2, z, 1.5, trunkH, 1.5, woodMat);
    addStaticWall(x, trunkH + 2, z, 6, 4, 6, leafMat);
    addStaticWall(x, trunkH + 4.5, z, 4, 2, 4, leafMat);
  }

  function addCrate(x, z, size = 3) {
    addStaticWall(x, size / 2, z, size, size, size, crateMat);
  }

  function addTownWell(x, z) {
    addStaticWall(x - 3, 2, z, 1, 4, 7, stoneMat);
    addStaticWall(x + 3, 2, z, 1, 4, 7, stoneMat);
    addStaticWall(x, 2, z - 3, 5, 4, 1, stoneMat);
    addStaticWall(x, 2, z + 3, 5, 4, 1, stoneMat);
    addStaticWall(x - 2, 5.5, z, 0.5, 3, 0.5, woodMat);
    addStaticWall(x + 2, 5.5, z, 0.5, 3, 0.5, woodMat);
    addStaticWall(x, 7.5, z, 6, 1, 7, roofMat);
  }

  // Borders
  const H_WALL = 16; const HALF_M = MAP_SIZE / 2;
  addStaticWall(0, H_WALL / 2, HALF_M, MAP_SIZE, H_WALL, 4);   
  addStaticWall(0, H_WALL / 2, -HALF_M, MAP_SIZE, H_WALL, 4);  
  addStaticWall(HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE);   
  addStaticWall(-HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE);  

  // Roads
  addPath(0, 0, 30, 30);         
  addPath(0, 80, 14, 130);       
  addPath(0, -80, 14, 130);      
  addPath(80, 0, 130, 14);       
  addPath(-80, 0, 130, 14);      

  addTownWell(0, 0);

  // Houses & Crates
  addHouse(-35, 35, 16, 10, 16);
  addCrate(-23, 30, 3);
  addCrate(-23, 33, 5); 

  addHouse(35, 40, 14, 9, 14);
  addCrate(25, 40, 3);

  addHouse(-40, -35, 14, 9, 18);
  addCrate(-40, -23, 4);

  addHouse(45, -45, 20, 14, 20);
  addCrate(32, -45, 4);
  addCrate(32, -40, 8);

  addHouse(-90, 35, 16, 10, 14);
  addHouse(90, -35, 14, 9, 16);
  addHouse(-100, -80, 18, 11, 14);
  addHouse(100, 80, 16, 10, 16);

  const treeLocations = [
    [-15, 25], [15, 25], [-20, -25], [25, -20],
    [-70, 40], [70, -40], [40, 80], [-40, -80],
    [120, 120], [-120, 120], [120, -120], [-120, -120],
    [-140, 20], [140, -20], [-20, 140], [20, -140]
  ];
  treeLocations.forEach(loc => addTree(loc[0], loc[1], 4 + Math.random() * 3));

  // ── PLAYER SETUP ────────────────────────────────────────────────────────────
  const PH = 1.8, PR = 0.35;
  const player = new THREE.Group();
  scene.add(player);
  
  const bMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(PR, PH - PR * 2, 8, 16),
    new THREE.MeshStandardMaterial({color: 0xff3366, roughness: 0.2}) 
  );
  bMesh.position.y = PH / 2;
  bMesh.castShadow = true;
  player.add(bMesh);
  
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.04, 8, 32),
    new THREE.MeshStandardMaterial({color: 0xff3366})
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  player.add(ring);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.15, 0.3),
    new THREE.MeshStandardMaterial({color: 0x111111})
  );
  visor.position.set(0, 1.4, -0.25);
  player.add(visor);

  function createRemotePlayerMesh() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(PR, PH - PR * 2, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x00aaff, roughness: 0.2 })
    );
    body.position.y = PH / 2;
    body.castShadow = true;
    group.add(body);

    const v = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.15, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    v.position.set(0, 1.4, -0.25);
    group.add(v);
    scene.add(group);
    return group;
  }

  // ── NETWORKING LISTENERS ─────────────────────────────────────────────────────
  socket.on('init', (id) => {
    myNetworkId = id;
    console.log("Connected. Unique ID:", myNetworkId);
  });

  socket.on('tick', (serverPlayers) => {
    const listEl = document.getElementById('scores-list');
    if (listEl) {
      let listHTML = '';
      for (const id in serverPlayers) {
        const tag = (id === myNetworkId) ? "You" : `Player_${id.substring(0, 4)}`;
        const pts = serverPlayers[id].score || 0;
        listHTML += `<div>${tag}: <b>${pts}</b></div>`;
      }
      listEl.innerHTML = listHTML;
    }

    for (const id in serverPlayers) {
      if (id === myNetworkId) continue;

      const pData = serverPlayers[id];
      if (!remotePlayers[id]) {
        remotePlayers[id] = createRemotePlayerMesh();
        targetStates[id] = { x: pData.x, y: pData.y, z: pData.z, rotY: pData.rotY };
      }
      
      targetStates[id] = { x: pData.x, y: pData.y, z: pData.z, rotY: pData.rotY };
    }
  });

  socket.on('removePlayer', (id) => {
    if (remotePlayers[id]) {
      scene.remove(remotePlayers[id]);
      delete remotePlayers[id];
      delete targetStates[id];
    }
  });

  socket.on('respawn', () => {
    const rx = (Math.random() - 0.5) * 60;
    const rz = (Math.random() - 0.5) * 60;
    pBody.setTranslation({ x: rx, y: 15, z: rz }, true);
    vy = 0; 
  });

  // ── FIRE BUTTON TRIGGERS ─────────────────────────────────────────────────────
  const fireBtn = document.getElementById('fir');
  fireBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    fireWeapon();
  }, { passive: false });

  window.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'CANVAS') {
      fireWeapon();
    }
  });
  
  // ── SHOOTING LOGIC ───────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const crosshairVector = new THREE.Vector2(0, 0.2); 

  function fireWeapon() {
    raycaster.setFromCamera(crosshairVector, camera);
    const rayDir = raycaster.ray.direction.clone().normalize();
    const rayOrigin = raycaster.ray.origin.clone();
    
    const shootingDirection = new THREE.Vector3(rayDir.x, 0, rayDir.z).normalize();
    player.rotation.y = Math.atan2(shootingDirection.x, shootingDirection.z);

    const maxRange = 120;
    const targetPointInSpace = rayOrigin.clone().add(rayDir.clone().multiplyScalar(maxRange));
    const tracerStart = player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    
    const lineGeo = new THREE.BufferGeometry().setFromPoints([tracerStart, targetPointInSpace]);
    const lineMat = new THREE.LineBasicMaterial({color: 0xff355e, linewidth: 7});
    const tracer = new THREE.Line(lineGeo, lineMat);
    
    tracer.frustumCulled = false; 
    scene.add(tracer);
    setTimeout(() => scene.remove(tracer), 60);

    let closestTarget = null;
    let closestDist = maxRange;

    for (const id in remotePlayers) {
      const remoteP = remotePlayers[id];
      const targetPos = remoteP.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      
      const toTarget = targetPos.clone().sub(rayOrigin);
      const projection = toTarget.dot(rayDir);
      
      if (projection < 0) continue; 

      const closestPointOnRay = rayOrigin.clone().add(rayDir.clone().multiplyScalar(projection));
      const lateralDist = targetPos.distanceTo(closestPointOnRay);

      if (lateralDist < 1.8) { 
        const distance = rayOrigin.distanceTo(targetPos);
        if (distance < closestDist) {
          closestDist = distance;
          closestTarget = id;
        }
      }
    }

    if (closestTarget) {
      socket.emit('shoot', closestTarget);
    }
  }

  // ── CHARACTER CONTROLLER PHYSICS ─────────────────────────────────────────────
  const controller = world.createCharacterController(0.01);
  controller.setSlideEnabled(true);
  controller.setMaxSlopeClimbAngle(45 * Math.PI / 180);
  controller.setMinSlopeSlideAngle(30 * Math.PI / 180);
  controller.enableAutostep(0.3, 0.1, true);
  controller.enableSnapToGround(0.3);

  const pBody = world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 100, 30));
  const pCollider = world.createCollider(R.ColliderDesc.capsule(PH / 2 - PR, PR), pBody);

  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  const MOVE_SPEED = 0.32; 
  const clock = new THREE.Clock();
  const camPos = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const rayDir = new THREE.Vector3(); 
  let firstFrame = true;

  // ── MAIN RUNTIME LOOP ────────────────────────────────────────────────────────
  function frame(){
    requestAnimationFrame(frame);
    const elapsed = clock.elapsedTime;
    const dt = Math.min(clock.getDelta(), 0.05); 

    world.timestep = dt;

    // 1. GATHER INPUTS
    let ix = jx, iy = jy;
    if(K['KeyA'] || K['ArrowLeft'])  ix = -1;
    if(K['KeyD'] || K['ArrowRight']) ix =  1;
    if(K['KeyW'] || K['ArrowUp'])    iy = -1;
    if(K['KeyS'] || K['ArrowDown'])  iy =  1;

    const hasInput = Math.abs(ix) > 0.02 || Math.abs(iy) > 0.02;

    if(running && !hasInput){ iy = -1; }
    if(running && hasInput && (jx !== 0 || jy !== 0)) toggleRun(false);

    // 2. MOVE PLAYER LOGIC (FIX: Fixed Horizontal Axis processing sign inversion)
    const mx = -ix * Math.cos(camYaw) + iy * Math.sin(camYaw);
    const mz = -ix * Math.sin(camYaw) + iy * Math.cos(camYaw);

    const speed = MOVE_SPEED * (running ? 1.8 : 1.0);
    vy -= 28 * dt; 

    const desiredMove = {x: mx * speed, y: vy * dt, z: mz * speed};

    controller.computeColliderMovement(pCollider, desiredMove);
    const corrected = controller.computedMovement();

    if(corrected.y >= 0 || Math.abs(corrected.y) < Math.abs(desiredMove.y) * 0.01) {
      if(vy < 0) vy = 0;
    }

    const pos = pBody.translation();
    pBody.setNextKinematicTranslation({
      x: pos.x + corrected.x,
      y: pos.y + corrected.y,
      z: pos.z + corrected.z
    });

    // 3. STEP THE PHYSICS WORLD (CRITICAL: Moved up to run completely before visual sync layout)
    world.step();

    // 4. SYNC THREE.JS PLAYER VISUALS TO PHYSICS BODY
    const p = pBody.translation();
    player.position.set(p.x, p.y - PH / 2, p.z);
    
    if(hasInput || (running && !hasInput)) {
      player.rotation.y = Math.atan2(mx, mz);
    }

    // 5. UPDATE MULTIPLAYER SOCKETS
    if (socket.connected) {
      socket.emit('move', {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        rotY: player.rotation.y
      });
    }

    for (const id in remotePlayers) {
      if (targetStates[id]) {
        remotePlayers[id].position.x += (targetStates[id].x - remotePlayers[id].position.x) * 0.20;
        remotePlayers[id].position.y += (targetStates[id].y - remotePlayers[id].position.y) * 0.20;
        remotePlayers[id].position.z += (targetStates[id].z - remotePlayers[id].position.z) * 0.20;
        remotePlayers[id].rotation.y += (targetStates[id].rotY - remotePlayers[id].rotation.y) * 0.20;
      }
    }

    // 6. RUN OVER-THE-SHOULDER CAMERA MATH (FIX: Now correctly processes after physics calculations)
    lookAt.set(p.x, p.y - PH / 2 + 1.2, p.z);
    
    const idealX = p.x + Math.sin(camYaw) * Math.cos(camPitch) * 7.5;
    const idealY = p.y - PH / 2 + 1.2 + Math.sin(camPitch) * 7.5;
    const idealZ = p.z + Math.cos(camYaw) * Math.cos(camPitch) * 7.5;
    
    const rightX = Math.cos(camYaw) * 1.4; 
    const rightZ = -Math.sin(camYaw) * 1.4;

    const finalCamX = idealX + rightX;
    const finalCamZ = idealZ + rightZ;
    const finalLookAt = new THREE.Vector3(lookAt.x + rightX, lookAt.y, lookAt.z + rightZ);
    
    rayDir.set(finalCamX - finalLookAt.x, idealY - finalLookAt.y, finalCamZ - finalLookAt.z);
    const maxDist = rayDir.length();
    rayDir.normalize();
    
    const ray = new R.Ray(finalLookAt, rayDir);
    const hit = world.castRay(ray, maxDist, true, null, null, pCollider);

    if (hit) {
      const safeDist = Math.max(0.4, hit.toi - 0.15);
      camPos.set(finalLookAt.x + rayDir.x * safeDist, finalLookAt.y + rayDir.y * safeDist, finalLookAt.z + rayDir.z * safeDist);
    } else {
      camPos.set(finalCamX, idealY, finalCamZ);
    }

    // 7. SMOOTH CAMERA INTERPOLATION (FIX: Cranked up speed factor from -18 to -30 to stop the jitter)
    if(firstFrame){ 
      camera.position.copy(camPos); 
      firstFrame = false; 
    } else { 
      camera.position.lerp(camPos, 1 - Math.exp(-30 * dt)); 
    }

    camera.lookAt(finalLookAt);
    ring.rotation.z = elapsed * 2;

    // ── RENDER SYSTEM ────────────────────────────────────────────────────────
    renderer.setViewport(0, 0, innerWidth, innerHeight);
    renderer.setScissor(0, 0, innerWidth, innerHeight);
    renderer.setScissorTest(true);
    renderer.render(scene, camera);

    // Minimap Render Loop Execution
    const mapSize = Math.min(innerWidth, innerHeight) * 0.25; 
    const mapX = innerWidth - mapSize - 20;                   
    const mapY = innerHeight - mapSize - 20;                  

    minimapCamera.position.set(player.position.x, 200, player.position.z);
    minimapCamera.lookAt(player.position.x, player.position.y, player.position.z);

    renderer.setViewport(mapX, mapY, mapSize, mapSize);
    renderer.setScissor(mapX, mapY, mapSize, mapSize);
    renderer.setScissorTest(true);
    
    renderer.setClearColor(0xeef2f7); 
    renderer.clearDepth(); 
    renderer.render(scene, minimapCamera);
    renderer.setClearColor(0xffffff); 
  }
  frame();
}

main().catch(e => {
  document.getElementById('loading').textContent = 'ERROR: ' + e.message;
  console.error(e);
});
