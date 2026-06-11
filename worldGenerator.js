import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── BASIC WALL GENERATOR ─────────────────────────────────────────────────────
export function addStaticWall(scene, world, R, x, y, z, w, h, d, material = borderMat){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; 
  mesh.receiveShadow = true;
  scene.add(mesh);

  const rb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z));
  world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2, d / 2), rb);
}

// ── FLAT FLOOR PATHWAY GENERATOR ──────────────────────────────────────────────
export function addPath(scene, x, z, w, d) {
  const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pathMat);
  pathMesh.rotation.x = -Math.PI / 2;
  pathMesh.position.set(x, 0.02, z); 
  pathMesh.receiveShadow = true;
  scene.add(pathMesh);
}

// ── RESIDENTIAL BUILDING MODULE ────────────────────────────────────────────────
export function addHouse(scene, world, R, x, z, w = 14, h = 9, d = 14) {
  addStaticWall(scene, world, R, x, h / 2, z, w, h, d, woodMat);
  addStaticWall(scene, world, R, x, h + 0.2, z, w + 1, 0.4, d + 1, roofMat);
}

// ── NATURAL ENVIRONMENT SCENERY ───────────────────────────────────────────────
export function addTree(scene, world, R, x, z, trunkH = 5) {
  addStaticWall(scene, world, R, x, trunkH / 2, z, 1.2, trunkH, 1.2, woodMat);
  addStaticWall(scene, world, R, x, trunkH + 2, z, 5, 4, 5, leafMat);
}

export function addCrate(scene, world, R, x, z, size = 3) {
  addStaticWall(scene, world, R, x, size / 2, z, size, size, size, crateMat);
}

// ── SKY DOME SCENERY MODULE ───────────────────────────────────────────────────
export function addSkyDome(scene) {
  const geo = new THREE.SphereGeometry(260, 32, 15);
  const mat = new THREE.MeshBasicMaterial({ color: 0x8fc2ff, side: THREE.BackSide, fog: false });
  const dome = new THREE.Mesh(geo, mat);
  scene.add(dome);
}

// ── LOCKED-FLAT OVERHEAD CROSSING BRIDGE ──────────────────────────────────────
export function addSkyBridge(scene, world, R, x, y, z, w, h, d, material = woodMat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(0, 0, 0); 
  mesh.castShadow = true; 
  mesh.receiveShadow = true;
  scene.add(mesh);

  const rb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z));
  world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2, d / 2), rb);
}

// ── SNIPER OUTPOST DEFENSE PLATFORM ────────────────────────────────────────────
export function addSniperTower(scene, world, R, x, z) {
  const th = 11;
  // Support Pillars
  addStaticWall(scene, world, R, x - 3, th / 2, z - 3, 0.5, th, 0.5, woodMat);
  addStaticWall(scene, world, R, x + 3, th / 2, z - 3, 0.5, th, 0.5, woodMat);
  addStaticWall(scene, world, R, x - 3, th / 2, z + 3, 0.5, th, 0.5, woodMat);
  addStaticWall(scene, world, R, x + 3, th / 2, z + 3, 0.5, th, 0.5, woodMat);
  
  // Floor Deck
  addStaticWall(scene, world, R, x, th, z, 7, 0.4, 7, woodMat);
  
  // Guard Rails
  addStaticWall(scene, world, R, x, th + 1, z - 3.4, 7, 1.5, 0.3, stoneMat);
  addStaticWall(scene, world, R, x, th + 1, z + 3.4, 7, 1.5, 0.3, stoneMat);
  addStaticWall(scene, world, R, x - 3.4, th + 1, z, 0.3, 1.5, 7, stoneMat);
  addStaticWall(scene, world, R, x + 3.4, th + 1, z, 0.3, 1.5, 7, stoneMat);
}

// ── AUTOCALCULATED INCLINE GENERATOR (FIXED DIRECTION MATH) ───────────────────
export function addRamp(scene, world, R, x, groundZ, targetHeight, rampLength, width = 4, direction = 1) {
  // Compute precise trigonometric pitch angle automatically
  const rx = Math.asin(targetHeight / rampLength) * direction; 
  
  // The center calculation handles the vector projection correctly on the ground
  const y = targetHeight / 2;
  const z = groundZ + (Math.cos(Math.abs(rx)) * rampLength / 2) * direction;

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, rampLength), woodMat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, 0, 0); 
  mesh.castShadow = true; 
  mesh.receiveShadow = true;
  scene.add(mesh);

  const q = new THREE.Quaternion().setFromEuler(mesh.rotation);
  const rb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z).setRotation({x: q.x, y: q.y, z: q.z, w: q.w}));
  world.createCollider(R.ColliderDesc.cuboid(width / 2, 0.2, rampLength / 2), rb);
}

// ── INITIAL LEVEL COMPOSITION CONTROLLER ──────────────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  // Main Ground Mesh & Boundaries
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), grassMat); 
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const fBody = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(MAP_SIZE / 2, 0.5, MAP_SIZE / 2), fBody);

  const H_WALL = 16; const HALF_M = MAP_SIZE / 2;
  addStaticWall(scene, world, R, 0, H_WALL / 2, HALF_M, MAP_SIZE, H_WALL, 4);   
  addStaticWall(scene, world, R, 0, H_WALL / 2, -HALF_M, MAP_SIZE, H_WALL, 4);  
  addStaticWall(scene, world, R, HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE);   
  addStaticWall(scene, world, R, -HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE);  

  // Roads and Paths Layout
  addPath(scene, 0, 0, 35, 35);         
  addPath(scene, 0, 80, 14, 130); addPath(scene, 0, -80, 14, 130);      
  addPath(scene, 80, 0, 130, 14); addPath(scene, -80, 0, 130, 14);      

  addSkyDome(scene);
  addStaticWall(scene, world, R, 0, 2, 0, 8, 4, 8, stoneMat); 

  // Core Settlement Hub Architecture
  addHouse(scene, world, R, -35, 35, 16, 9, 16);  addCrate(scene, world, R, -23, 28, 3);
  addHouse(scene, world, R, 35, 40, 14, 9, 14);   addCrate(scene, world, R, 24, 38, 4);
  addHouse(scene, world, R, -40, -35, 14, 11, 18);
  addHouse(scene, world, R, 45, -45, 20, 9, 20);

  // Structural Walkway Inclines (Autocalculated base alignments)
  addRamp(scene, world, R, -35, 43.0, 9.0, 21, 4, 1); 
  addRamp(scene, world, R, 35, 47.0, 9.0, 21, 4, 1);  

  // Sky Crossing Infrastructure
  addSkyBridge(scene, world, R, 0, 9.2, 35, 54, 0.3, 3, woodMat);

  // Strategic Sniper Fortifications
  addSniperTower(scene, world, R, -75, 75);
  addRamp(scene, world, R, -75, 78.5, 11.0, 25, 3, 1); 

  addSniperTower(scene, world, R, 75, -75);
  addRamp(scene, world, R, 75, -78.5, 11.0, 25, 3, -1);  

  // Peripheral Outer Outposts
  addHouse(scene, world, R, -90, 35, 16, 9, 14);  addHouse(scene, world, R, 90, -35, 14, 9, 16);
  addHouse(scene, world, R, -100, -80, 18, 9, 14); addHouse(scene, world, R, 100, 80, 16, 9, 16);

  // Forestry Foliage Layout
  const treeLocations = [
    [-15, 45], [15, 45], [-20, -45], [25, -40], [-70, 100], [70, -100], [110, 110], [-110, -110]
  ];
  treeLocations.forEach(loc => addTree(scene, world, R, loc[0], loc[1], 5));
}
