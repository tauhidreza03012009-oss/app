import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── BASIC WALL GENERATOR ─────────────────────────────────────────────────────
export function addStaticWall(scene, world, R, x, y, z, w, h, d, material = borderMat, castShadow = true){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow; // Toggleable to save GPU cycles
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
  pathMesh.receiveShadow = true; // Floors never need to cast shadows
  scene.add(pathMesh);
}

// ── RESIDENTIAL BUILDING MODULE ────────────────────────────────────────────────
export function addHouse(scene, world, R, x, z, w = 14, h = 9, d = 14) {
  addStaticWall(scene, world, R, x, h / 2, z, w, h, d, woodMat, true);
  addStaticWall(scene, world, R, x, h + 0.2, z, w + 1, 0.4, d + 1, roofMat, true);
}

// ── NATURAL ENVIRONMENT SCENERY ───────────────────────────────────────────────
export function addTree(scene, world, R, x, z, trunkH = 5) {
  // Trunks cast shadows
  addStaticWall(scene, world, R, x, trunkH / 2, z, 1.2, trunkH, 1.2, woodMat, true);
  
  // OPTIMIZATION: Leaves do NOT cast shadows anymore. This saves huge amounts of performance in forests.
  addStaticWall(scene, world, R, x, trunkH + 1.5, z, 5, 3, 5, leafMat, false);
  addStaticWall(scene, world, R, x, trunkH + 3.5, z, 3.5, 2, 3.5, leafMat, false);
}

export function addCrate(scene, world, R, x, z, size = 3, castShadow = true) {
  addStaticWall(scene, world, R, x, size / 2, z, size, size, size, crateMat, castShadow);
}

// Barricades
export function addBarricade(scene, world, R, x, z, rotationY = 0, width = 6) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 2.2, 0.8), stoneMat);
  mesh.position.set(x, 1.1, z);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const q = new THREE.Quaternion().setFromEuler(mesh.rotation);
  const rb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, 1.1, z).setRotation({x: q.x, y: q.y, z: q.z, w: q.w}));
  world.createCollider(R.ColliderDesc.cuboid(width / 2, 1.1, 0.4), rb);
}

// Cargo Stacks
export function addCargoCluster(scene, world, R, x, z) {
  // Internal/bottom crates don't need to cast shadows if they are covered
  addCrate(scene, world, R, x, z, 3.5, true);
  addCrate(scene, world, R, x + 3.2, z, 3, false);
  addCrate(scene, world, R, x, z + 3.2, 3, false);
  addStaticWall(scene, world, R, x + 1.5, 5, z + 1.5, 3, 3, 3, crateMat, true);
}

// ── SKY DOME SCENERY MODULE ───────────────────────────────────────────────────
export function addSkyDome(scene) {
  const geo = new THREE.SphereGeometry(280, 24, 12); // Reduced segments slightly
  const mat = new THREE.MeshBasicMaterial({ color: 0x8fc2ff, side: THREE.BackSide, fog: false });
  const dome = new THREE.Mesh(geo, mat);
  scene.add(dome);
}

// ── LOCKED-FLAT OVERHEAD CROSSING BRIDGE ──────────────────────────────────────
export function addSkyBridge(scene, world, R, x, y, z, w, h, d, material = woodMat) {
  addStaticWall(scene, world, R, x, y, z, w, h, d, material, true);
}

// ── SNIPER FORTRESS TOWER ─────────────────────────────────────────────────────
export function addSniperTower(scene, world, R, x, z) {
  const th = 11;
  addStaticWall(scene, world, R, x - 3.4, th / 2, z - 3.4, 0.5, th, 0.5, woodMat, true);
  addStaticWall(scene, world, R, x + 3.4, th / 2, z - 3.4, 0.5, th, 0.5, woodMat, true);
  addStaticWall(scene, world, R, x - 3.4, th / 2, z + 3.4, 0.5, th, 0.5, woodMat, false);
  addStaticWall(scene, world, R, x + 3.4, th / 2, z + 3.4, 0.5, th, 0.5, woodMat, false);
  
  addStaticWall(scene, world, R, x, th, z, 7.2, 0.4, 7.2, woodMat, true);
  
  addStaticWall(scene, world, R, x, th + 1, z - 3.5, 7.2, 1.5, 0.3, stoneMat, true); 
  addStaticWall(scene, world, R, x - 3.5, th + 1, z, 0.3, 1.5, 7.2, stoneMat, true);  
  addStaticWall(scene, world, R, x + 3.5, th + 1, z, 0.3, 1.5, 7.2, stoneMat, true);  

  addStaticWall(scene, world, R, x - 2.2, th + 1, z + 3.5, 2.0, 1.5, 0.3, stoneMat, false); 
  addStaticWall(scene, world, R, x + 2.2, th + 1, z + 3.5, 2.0, 1.5, 0.3, stoneMat, false); 
}

// ── AUTOCALCULATED INCLINE GENERATOR ──────────────────────────────────────────
export function addRamp(scene, world, R, x, groundZ, targetHeight, rampLength, width = 4, direction = 1) {
  const rx = Math.asin(targetHeight / rampLength) * direction; 
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
  // Ground
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), grassMat); 
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const fBody = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(MAP_SIZE / 2, 0.5, MAP_SIZE / 2), fBody);

  // Borders (No dynamic shadows needed for outer map walls!)
  const H_WALL = 16; const HALF_M = MAP_SIZE / 2;
  addStaticWall(scene, world, R, 0, H_WALL / 2, HALF_M, MAP_SIZE, H_WALL, 4, borderMat, false);   
  addStaticWall(scene, world, R, 0, H_WALL / 2, -HALF_M, MAP_SIZE, H_WALL, 4, borderMat, false);  
  addStaticWall(scene, world, R, HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE, borderMat, false);   
  addStaticWall(scene, world, R, -HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE, borderMat, false);  

  // Roads
  addPath(scene, 0, 0, 45, 45); 
  addPath(scene, 0, 90, 16, 150); addPath(scene, 0, -90, 16, 150);      
  addPath(scene, 90, 0, 150, 16); addPath(scene, -90, 0, 150, 16);
  addPath(scene, -110, 110, 80, 10);
  addPath(scene, 110, -110, 80, 10);

  addSkyDome(scene);

  // Central Plaza
  addStaticWall(scene, world, R, 0, 1.5, 0, 16, 3, 16, stoneMat, true); 
  addBarricade(scene, world, R, -14, 0, Math.PI / 2, 8);
  addBarricade(scene, world, R, 14, 0, Math.PI / 2, 8);
  addBarricade(scene, world, R, 0, -14, 0, 8);
  addBarricade(scene, world, R, 0, 14, 0, 8);

  // Zone A
  addHouse(scene, world, R, 45, 45, 16, 9, 16);   
  addCrate(scene, world, R, 32, 38, 4, true);
  addHouse(scene, world, R, 80, 40, 14, 9, 14);
  addHouse(scene, world, R, 50, 85, 18, 10, 14);
  addBarricade(scene, world, R, 35, 60, 0.4, 6);

  // Zone B
  addHouse(scene, world, R, -45, -45, 22, 11, 22); 
  addCargoCluster(scene, world, R, -20, -32);
  addCargoCluster(scene, world, R, -52, -18);
  addCargoCluster(scene, world, R, -22, -60);
  addCrate(scene, world, R, -10, -20, 3.5, true);

  // Zone C
  addHouse(scene, world, R, -45, 45, 18, 10, 18);
  addStaticWall(scene, world, R, -28, 2, 28, 10, 4, 2, stoneMat, true); 
  addCrate(scene, world, R, -20, 40, 3, true);
  addHouse(scene, world, R, -85, 40, 14, 9, 14);

  // Zone D
  addHouse(scene, world, R, 55, -55, 20, 9, 20);
  addBarricade(scene, world, R, 32, -42, -Math.PI / 4, 7);
  addBarricade(scene, world, R, 42, -32, -Math.PI / 4, 7);
  addHouse(scene, world, R, 95, -50, 16, 9, 16);

  // Bridges & Inclines
  addRamp(scene, world, R, -45, 56.0, 10.0, 24, 4.5, 1); 
  addRamp(scene, world, R, 45, 55.5, 9.0, 22, 4.5, 1);  
  addSkyBridge(scene, world, R, 0, 10.2, 45, 72, 0.3, 4, woodMat); 

  // Four Towers
  addSniperTower(scene, world, R, -110, 110);
  addRamp(scene, world, R, -110, 114.5, 11.0, 26, 3.5, 1); 

  addSniperTower(scene, world, R, 110, -110);
  addRamp(scene, world, R, 110, -114.5, 11.0, 26, 3.5, -1);  

  addSniperTower(scene, world, R, 110, 110);
  addRamp(scene, world, R, 110, 114.5, 11.0, 26, 3.5, 1);

  addSniperTower(scene, world, R, -110, -110);
  addRamp(scene, world, R, -110, -114.5, 11.0, 26, 3.5, -1);

  // Far Outer Outposts
  addHouse(scene, world, R, -140, 70, 16, 9, 16);  
  addHouse(scene, world, R, 140, -70, 16, 9, 16);
  addHouse(scene, world, R, -130, -130, 20, 10, 14); 
  addHouse(scene, world, R, 130, 130, 14, 9, 18);

  // Optimized Scattered Forestry Rings
  const clusterCenters = [
    [-80, 0], [80, 0], [0, 80], [0, -80], 
    [-130, 20], [130, -20], [-60, 120], [60, -120]
  ];
  clusterCenters.forEach(([cx, cz]) => {
    addTree(scene, world, R, cx, cz, 5.5);
    addTree(scene, world, R, cx + 5, cz - 6, 4.8);
    addTree(scene, world, R, cx - 6, cz + 4, 6.2);
    addTree(scene, world, R, cx + 7, cz + 7, 4.2);
  });

  const sniperSpottedTrees = [
    [-95, 95], [95, -95], [95, 95], [-95, -95],
    [-25, 70], [25, 70], [-20, -75], [30, -70]
  ];
  sniperSpottedTrees.forEach(([tx, tz]) => addTree(scene, world, R, tx, tz, 5.0));
}
