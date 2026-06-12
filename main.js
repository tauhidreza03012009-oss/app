import * as THREE from 'three';
import { buildMapLayout } from './worldGenerator.js';
import { activeLaunchPads } from './worldGenerator.js';

// ── AUDIO SETUP ───────────────────────────────────────────────────────────────
let audioCtx = null;
let laserBuffer = null;
let jumpBuffer = null;
let springBuffer = null;
let walkBuffer = null;
let walkSource = null; // Tracks the active loop instance so it can be stopped

// Refactored to handle preloading upfront
async function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const [laserRes, jumpRes, springRes, walkRes] = await Promise.all([
      fetch('./laser.mp3'),
      fetch('./jump.mp3'),
      fetch('./spring.mp3'),
      fetch('./walk.mp3')
    ]);
    const [laserArr, jumpArr, springArr, walkArr] = await Promise.all([
      laserRes.arrayBuffer(),
      jumpRes.arrayBuffer(),
      springRes.arrayBuffer(),
      walkRes.arrayBuffer()
    ]);
    
    // We use Promises to ensure all decoding is complete before moving forward
    await Promise.all([
      new Promise((resolve, reject) => { audioCtx.decodeAudioData(laserArr, b => { laserBuffer = b; resolve(); }, reject); }),
      new Promise((resolve, reject) => { audioCtx.decodeAudioData(jumpArr, b => { jumpBuffer = b; resolve(); }, reject); }),
      new Promise((resolve, reject) => { audioCtx.decodeAudioData(springArr, b => { springBuffer = b; resolve(); }, reject); }),
      new Promise((resolve, reject) => { audioCtx.decodeAudioData(walkArr, b => { walkBuffer = b; resolve(); }, reject); })
    ]);
  } catch(e) {
    console.error('Audio preloading failed: ' + e.message);
    alert('Audio failed to load. The game will start, but sounds may not play.');
  }
}

function playLaser() {
  if (!audioCtx || !laserBuffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = laserBuffer;
  source.connect(audioCtx.destination);
  source.start(0);
}

function playJump() {
  if (!audioCtx || !jumpBuffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = jumpBuffer;
  source.connect(audioCtx.destination);
  source.start(0);
  stopWalk(); // Cut off walking sound instantly when airborne
}

function playSpring() {
  if (!audioCtx || !springBuffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = springBuffer;
  source.connect(audioCtx.destination);
  source.start(0);
  stopWalk(); // Cut off walking sound instantly when launched
}

function startWalk() {
  if (!audioCtx || !walkBuffer || walkSource) return;
  walkSource = audioCtx.createBufferSource();
  walkSource.buffer = walkBuffer;
  walkSource.loop = true; // Seamless looping while moving
  walkSource.connect(audioCtx.destination);
  walkSource.start(0);
}

function stopWalk() {
  if (walkSource) {
    try { walkSource.stop(); } catch(e) {}
    walkSource = null;
  }
}

// Keep these triggers just in case the AudioContext starts in a suspended state due to browser autoplay policies
window.addEventListener('touchstart', () => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }, { once: true });
window.addEventListener('mousedown', () => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }, { once: true });

// ── MULTIPLAYER NETWORKING SETUP ──────────────────────────────────────────────
const socket = io();
let myNetworkId = null;
const remotePlayers = {};
const targetStates = {};

// ── SHARED STATE ──────────────────────────────────────────────────────────────
let vy = 0;
let running = false;
let launchTimer = 0;
const activeLaunchVector = new THREE.Vector3();

// ── JOYSTICK ──────────────────────────────────────────────────────────────────
const jstEl = document.getElementById('jst');
const jskEl = document.getElementById('jsk');
const JR = 50;
let jx = 0, jy = 0, jId = -1;

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
  if(vy === 0 && launchTimer <= 0){ vy = 18; playJump(); }
}, {passive: false});

// ── RUN BUTTON ────────────────────────────────────────────────────────────────
const runEl = document.getElementById('run');
function toggleRun(force){
  running = (force !== undefined) ? force : !running;
  runEl.classList.toggle('active', running);
}
runEl.addEventListener('touchstart', e => { e.preventDefault(); toggleRun(); }, {passive: false});

// ── CAMERA DRAG ───────────────────────────────────────────────────────────────
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

// ── KEYBOARD CONTROLS ─────────────────────────────────────────────────────────
const K={};
window.addEventListener('keydown', e => {
  K[e.code] = true;
  if(e.code === 'Space' && vy === 0 && launchTimer <= 0){ e.preventDefault(); vy = 11; playJump(); }
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
  
  // Wait for physics engine initialization AND all audio tracking data to resolve
  await Promise.all([
    R.init(),
    initAudio()
  ]);

  // Hide loading screen only after physics engine AND audio files are fully decoded
  document.getElementById('loading').style.display = 'none';

  const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('c'), antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const skyColor = 0xaaccff;
  scene.background = new THREE.Color(skyColor);
  scene.fog = new THREE.FogExp2(skyColor, 0.003);

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

  // ── PHYSICS SETUP ─────────────────────────────────────────────────────────
  const world = new R.World({x: 0, y: -32, z: 0});
  const MAP_SIZE = 360;
  buildMapLayout(scene, world, R, MAP_SIZE);

  // ── PLAYER GRAPHICS ───────────────────────────────────────────────────────
  const PH = 1.8, PR = 0.35;
  const player = new THREE.Group();
  scene.add(player);

  const bMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(PR, PH - PR * 2, 8, 16),
    new THREE.MeshStandardMaterial({color: 0xff3366, roughness: 0.2})
  );
  bMesh.position.y = PH / 2; bMesh.castShadow = true; player.add(bMesh);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 32), new THREE.MeshStandardMaterial({color: 0xff3366}));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; player.add(ring);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), new THREE.MeshStandardMaterial({color: 0x111111}));
  visor.position.set(0, 1.4, -0.25); player.add(visor);

  function createRemotePlayerMesh() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(PR, PH - PR * 2, 8, 16), new THREE.MeshStandardMaterial({ color: 0x00aaff, roughness: 0.2 }));
    body.position.y = PH / 2; body.castShadow = true; group.add(body);
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    v.position.set(0, 1.4, -0.25); group.add(v);
    scene.add(group);
    return group;
  }

  // ── NETWORK SYNC ──────────────────────────────────────────────────────────
  socket.on('init', id => { myNetworkId = id; });

  socket.on('tick', serverPlayers => {
    const listEl = document.getElementById('scores-list');
    if (listEl) {
      let listHTML = '';
      for (const id in serverPlayers) {
        const tag = (id === myNetworkId) ? "You" : `Player_${id.substring(0, 4)}`;
        listHTML += `<div>${tag}: <b>${serverPlayers[id].score || 0}</b></div>`;
      }
      listEl.innerHTML = listHTML;
    }
    for (const id in serverPlayers) {
      if (id === myNetworkId) continue;
      const pData = serverPlayers[id];
      if (!remotePlayers[id]) remotePlayers[id] = createRemotePlayerMesh();
      targetStates[id] = { x: pData.x, y: pData.y, z: pData.z, rotY: pData.rotY };
    }
  });

  socket.on('removePlayer', id => {
    if (remotePlayers[id]) {
      scene.remove(remotePlayers[id]);
      delete remotePlayers[id]; delete targetStates[id];
    }
  });

  socket.on('respawn', () => {
    pBody.setTranslation({ x: (Math.random() - 0.5) * 40, y: 15, z: (Math.random() - 0.5) * 40 }, true);
    vy = 0;
    launchTimer = 0;
  });

  // ── WEAPON FIRE ───────────────────────────────────────────────────────────
  document.getElementById('fir').addEventListener('touchstart', e => { e.preventDefault(); fireWeapon(); }, { passive: false });
  window.addEventListener('mousedown', e => { if (e.target.tagName === 'CANVAS') fireWeapon(); });

  const raycaster = new THREE.Raycaster();
  const crosshairVector = new THREE.Vector2(0, 0.2);

  function fireWeapon() {
    playLaser();

    raycaster.setFromCamera(crosshairVector, camera);
    const rayDir = raycaster.ray.direction.clone().normalize();
    const rayOrigin = raycaster.ray.origin.clone();

    player.rotation.y = Math.atan2(rayDir.x, -rayDir.z);

    const maxRange = 120;
    
    // --- FIXED THICK, GLOWING LASER VISUAL ---
    // Extract real forward direction vector from player mesh matrix layout 
    const playerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion).normalize();
    
    // Set precise egress position right out the front of the dark visor bounds
    const tracerStart = player.position.clone()
      .add(playerForward.clone().multiplyScalar(0.38))
      .add(new THREE.Vector3(0, 1.4, 0));

    // Calculate real destination vector point by mapping actual environment layout intersects
    let targetPointInSpace = rayOrigin.clone().add(rayDir.clone().multiplyScalar(maxRange));

    const distance = tracerStart.distanceTo(targetPointInSpace);
    
    // Create a cylinder along the default Y axis
    const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, distance, 8); 
    
    // Rotate geometry onto the Z-axis
    laserGeo.rotateX(Math.PI / 2);

    const laserMat = new THREE.MeshStandardMaterial({
      color: 0xff355e,
      emissive: 0xff355e,
      emissiveIntensity: 6,
      transparent: true,
      opacity: 0.85
    });

    const tracer = new THREE.Mesh(laserGeo, laserMat);
    
    // Position halfway between the player and target
    const midPoint = new THREE.Vector3().lerpVectors(tracerStart, targetPointInSpace, 0.5);
    tracer.position.copy(midPoint);
    
    // Orient lookAt perfectly
    tracer.lookAt(targetPointInSpace);
    
    tracer.frustumCulled = false; 
    scene.add(tracer);
    
    setTimeout(() => scene.remove(tracer), 100);
    // -----------------------------------------

    let closestTarget = null; let closestDist = maxRange;

    for (const id in remotePlayers) {
      const targetPos = remotePlayers[id].position.clone().add(new THREE.Vector3(0, 1.0, 0));
      const toTarget = targetPos.clone().sub(rayOrigin);
      const projection = toTarget.dot(rayDir);
      if (projection < 0) continue;
      const closestPointOnRay = rayOrigin.clone().add(rayDir.clone().multiplyScalar(projection));
      if (targetPos.distanceTo(closestPointOnRay) < 1.8) {
        const distToTarget = rayOrigin.distanceTo(targetPos);
        if (distToTarget < closestDist) { closestDist = distToTarget; closestTarget = id; }
      }
    }
    if (closestTarget) socket.emit('shoot', closestTarget);
  }

  // ── CHARACTER CONTROLLER ──────────────────────────────────────────────────
  const controller = world.createCharacterController(0.01);
  controller.setSlideEnabled(true);
  controller.setMaxSlopeClimbAngle(45 * Math.PI / 180);
  controller.setMinSlopeSlideAngle(30 * Math.PI / 180);
  controller.enableAutostep(0.4, 0.1, true);
  controller.enableSnapToGround(0.3);

  const pBody = world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 20, 30));
  const pCollider = world.createCollider(R.ColliderDesc.capsule(PH / 2 - PR, PR), pBody);

  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  });

  const MOVE_SPEED = 0.32;
  const clock = new THREE.Clock();
  const camPos = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const rayDirVector = new THREE.Vector3();
  let firstFrame = true;
  let frameCount = 0;
  let wasOnLaunchPad = false;

  const crosshairEl = document.getElementById('crosshair');

  // ── GAME LOOP ─────────────────────────────────────────────────────────────
  function frame(){
    requestAnimationFrame(frame);
    const elapsed = clock.elapsedTime;
    const dt = Math.min(clock.getDelta(), 0.05);
    world.timestep = 1 / 60;
    frameCount++;

    let ix = jx, iy = jy;
    if(K['KeyA'] || K['ArrowLeft'])  ix = -1;
    if(K['KeyD'] || K['ArrowRight']) ix =  1;
    if(K['KeyW'] || K['ArrowUp'])    iy = -1;
    if(K['KeyS'] || K['ArrowDown'])  iy =  1;

    const hasInput = Math.abs(ix) > 0.02 || Math.abs(iy) > 0.02;
    if(running && !hasInput) iy = -1;
    if(running && hasInput && (jx !== 0 || jy !== 0)) toggleRun(false);

    const mx = ix * Math.cos(camYaw) + iy * Math.sin(camYaw);
    const mz = -ix * Math.sin(camYaw) + iy * Math.cos(camYaw);
    const speed = MOVE_SPEED * (running ? 1.8 : 1.0);

    let finalMx = mx * speed;
    let finalMz = mz * speed;

    if (launchTimer > 0) {
      launchTimer -= dt;
      controller.enableSnapToGround(false);
      finalMx = activeLaunchVector.x * dt;
      vy = activeLaunchVector.y;
      finalMz = activeLaunchVector.z * dt;
    } else {
      controller.enableSnapToGround(true);
      vy -= 28 * dt;

      const pos = pBody.translation();
      let onPadThisFrame = false;
      for (const pad of activeLaunchPads) {
        const insideX = Math.abs(pos.x - pad.x) < (pad.w / 2 + 0.6);
        const insideZ = Math.abs(pos.z - pad.z) < (pad.d / 2 + 0.6);
        const insideY = Math.abs(pos.y - pad.y) < 1.8;
        if (insideX && insideZ && insideY) {
          onPadThisFrame = true;
          if (!wasOnLaunchPad) playSpring();
          launchTimer = pad.duration;
          activeLaunchVector.set(pad.force.x, pad.force.y, pad.force.z);
          vy = activeLaunchVector.y;
          finalMx = activeLaunchVector.x * dt;
          finalMz = activeLaunchVector.z * dt;
          controller.enableSnapToGround(false);
          break;
        }
      }
      wasOnLaunchPad = onPadThisFrame;
    }

    const desiredMove = {x: finalMx, y: vy * dt, z: finalMz};
    controller.computeColliderMovement(pCollider, desiredMove);
    const corrected = controller.computedMovement();

    if(corrected.y >= 0 || Math.abs(corrected.y) < Math.abs(desiredMove.y) * 0.01) {
      if(vy < 0 && launchTimer <= 0) vy = 0;
    }

    // ── WALKING AUDIO LOGIC ──────────────────────────────────────────────────
    const isMovingOnGround = (hasInput || (running && !hasInput)) && vy === 0 && launchTimer <= 0;
    if (isMovingOnGround) {
      startWalk();
    } else {
      stopWalk();
    }
    // ─────────────────────────────────────────────────────────────────────────

    const pos = pBody.translation();
    pBody.setNextKinematicTranslation({
      x: pos.x + corrected.x,
      y: pos.y + corrected.y,
      z: pos.z + corrected.z
    });

    world.step();

    player.position.set(pos.x + corrected.x, (pos.y + corrected.y) - PH / 2, pos.z + corrected.z);

    if((hasInput || (running && !hasInput)) && launchTimer <= 0) {
      player.rotation.y = Math.atan2(mx, -mz);
    } else if (launchTimer > 0) {
      player.rotation.y = Math.atan2(activeLaunchVector.x, -activeLaunchVector.z);
    }

    if (socket.connected) {
      socket.emit('move', { x: player.position.x, y: player.position.y, z: player.position.z, rotY: player.rotation.y });
    }

    for (const id in remotePlayers) {
      if (targetStates[id]) {
        remotePlayers[id].position.x += (targetStates[id].x - remotePlayers[id].position.x) * 0.20;
        remotePlayers[id].position.y += (targetStates[id].y - remotePlayers[id].position.y) * 0.20;
        remotePlayers[id].position.z += (targetStates[id].z - remotePlayers[id].position.z) * 0.20;
        remotePlayers[id].rotation.y += (targetStates[id].rotY - remotePlayers[id].rotation.y) * 0.20;
      }
    }

    lookAt.set(player.position.x, player.position.y + 1.2, player.position.z);

    const idealX = player.position.x + Math.sin(camYaw) * Math.cos(camPitch) * 7.5;
    const idealY = player.position.y + 1.2 + Math.sin(camPitch) * 7.5;
    const idealZ = player.position.z + Math.cos(camYaw) * Math.cos(camPitch) * 7.5;

    const rightX = Math.cos(camYaw) * 1.4; const rightZ = -Math.sin(camYaw) * 1.4;
    const finalCamX = idealX + rightX; const finalCamZ = idealZ + rightZ;
    const finalLookAt = new THREE.Vector3(lookAt.x + rightX, lookAt.y, lookAt.z + rightZ);

    if (frameCount % 3 === 0 || firstFrame) {
      rayDirVector.set(finalCamX - finalLookAt.x, idealY - finalLookAt.y, finalCamZ - finalLookAt.z);
      const maxDist = rayDirVector.length(); rayDirVector.normalize();
      const ray = new R.Ray(finalLookAt, rayDirVector);
      const hit = world.castRay(ray, maxDist, true, null, null, pCollider);
      if (hit) {
        const safeDist = Math.max(0.4, hit.toi - 0.15);
        camPos.set(finalLookAt.x + rayDirVector.x * safeDist, finalLookAt.y + rayDirVector.y * safeDist, finalLookAt.z + rayDirVector.z * safeDist);
      } else {
        camPos.set(finalCamX, idealY, finalCamZ);
      }
    }

    if(firstFrame){
      camera.position.copy(camPos); firstFrame = false;
    } else {
      camera.position.lerp(camPos, 0.14);
    }

    camera.lookAt(finalLookAt);

    let targetInSight = false;
    raycaster.setFromCamera(crosshairVector, camera);
    const checkDir = raycaster.ray.direction.clone().normalize();
    const checkOrigin = raycaster.ray.origin.clone();

    for (const id in remotePlayers) {
      const targetPos = remotePlayers[id].position.clone().add(new THREE.Vector3(0, 1.0, 0));
      const toTarget = targetPos.clone().sub(checkOrigin);
      const projection = toTarget.dot(checkDir);
      if (projection < 0) continue;
      const closestPointOnRay = checkOrigin.clone().add(checkDir.clone().multiplyScalar(projection));
      if (targetPos.distanceTo(closestPointOnRay) < 1.8 && checkOrigin.distanceTo(targetPos) < 120) {
        targetInSight = true;
        break;
      }
    }

    if (crosshairEl) {
      if (targetInSight) {
        crosshairEl.style.borderColor = '#ff355e';
        crosshairEl.style.transform = 'translate(-50%, -50%) scale(1.3)';
      } else {
        crosshairEl.style.borderColor = '#ffffff';
        crosshairEl.style.transform = 'translate(-50%, -50%) scale(1.0)';
      }
    }

    ring.rotation.z = elapsed * 2;

    renderer.setViewport(0, 0, innerWidth, innerHeight);
    renderer.setScissor(0, 0, innerWidth, innerHeight);
    renderer.setScissorTest(true);
    renderer.render(scene, camera);

    const mapSize = Math.min(innerWidth, innerHeight) * 0.25;
    const mapX = innerWidth - mapSize - 20; const mapY = innerHeight - mapSize - 20;

    minimapCamera.position.set(player.position.x, 200, player.position.z);
    minimapCamera.lookAt(player.position.x, player.position.y, player.position.z);

    renderer.setViewport(mapX, mapY, mapSize, mapSize);
    renderer.setScissor(mapX, mapY, mapSize, mapSize);
    renderer.setScissorTest(true);

    renderer.setClearColor(0xeef2f7); renderer.clearDepth(); renderer.render(scene, minimapCamera);
    renderer.setClearColor(0xffffff);
  }
  frame();
}

main().catch(e => {
  document.getElementById('loading').textContent = 'ERROR: ' + e.message;
  console.error(e);
});
