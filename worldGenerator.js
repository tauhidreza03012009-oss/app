import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── BASIC WALL GENERATOR ─────────────────────────────────────────────────────
export function addStaticWall(scene, world, R, x, y, z, w, h, d, material = borderMat, castShadow = true){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow; 
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
  addStaticWall(scene, world, R, x, h / 2, z, w, h, d, woodMat, true);
  addStaticWall(scene, world, R, x, h + 0.2, z, w + 1, 0.4, d + 1, roofMat, true);
}

// ── NATURAL ENVIRONMENT SCENERY ───────────────────────────────────────────────
export function addTree(scene, world, R, x, z, trunkH = 5) {
  addStaticWall(scene, world, R, x, trunkH / 2, z, 1.0, trunkH, 1.0, woodMat, true);
  addStaticWall(scene, world, R, x, trunkH + 1.5, z, 4.5, 2.5, 4.5, leafMat, false); // Performance save
}

export function addCrate(scene, world, R, x, z, size = 3, castShadow = true) {
  addStaticWall(scene, world, R, x, size / 2, z, size, size, size, crateMat, castShadow);
}

// Concrete/Stone Barricades (Street Dividers / Planters)
export function addBarricade(scene, world, R, x, z, rotationY = 0, width = 6) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 2.0, 1.0), stoneMat);
  mesh.position.set(x, 1.0, z);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const q = new THREE.Quaternion().setFromEuler(mesh.rotation);
  const rb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, 1.0, z).setRotation({x: q.x, y: q.y, z: q.z, w: q.w}));
  world.createCollider(R.ColliderDesc.cuboid(width / 2, 1.0, 0.5), rb);
}

// ── LOCKED-FLAT OVERHEAD CROSSING BRIDGE ──────────────────────────────────────
export function addSkyBridge(scene, world, R, x, y, z, w, h, d, material = woodMat) {
  addStaticWall(scene, world, R, x, y, z, w, h, d, material, true);
}

// ── URBAN WATCHTOWER / CRANE SCALED UP ────────────────────────────────────────
export function addSniperTower(scene, world, R, x, z) {
  const th = 11;
  addStaticWall(scene, world, R, x - 3.4, th / 2, z - 3.4, 0.6, th, 0.6, stoneMat, true);
  addStaticWall(scene, world, R, x + 3.4, th / 2, z - 3.4, 0.6, th, 0.6, stoneMat, true);
  addStaticWall(scene, world, R, x - 3.4, th / 2, z + 3.4, 0.6, th, 0.6, stoneMat, false);
  addStaticWall(scene, world, R, x + 3.4, th / 2, z + 3.4, 0.6, th, 0.6, stoneMat, false);
  
  addStaticWall(scene, world, R, x, th, z, 7.5, 0.4, 7.5, woodMat, true);
  addStaticWall(scene, world, R, x, th + 1, z - 3.6, 7.5, 1.6, 0.3, stoneMat, true); 
  addStaticWall(scene, world, R, x - 3.6, th + 1, z, 0.3, 1.6, 7.5, stoneMat, true);  
  addStaticWall(scene, world, R, x + 3.6, th + 1, z, 0.3, 1.6, 7.5, stoneMat, true);  
  addStaticWall(scene, world, R, x - 2.2, th + 1, z + 3.6, 2.2, 1.6, 0.3, stoneMat, false); 
  addStaticWall(scene, world, R, x + 2.2, th + 1, z + 3.6, 2.2, 1.6, 0.3, stoneMat, false); 
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
  // Base Urban Foundation Ground Mesh
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), grassMat); 
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const fBody = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(MAP_SIZE / 2, 0.5, MAP_SIZE / 2), fBody);

  // Peripheral Perimeter City Walls (Blocks the edge of the world map)
  const H_WALL = 18; const HALF_M = MAP_SIZE / 2;
  addStaticWall(scene, world, R, 0, H_WALL / 2, HALF_M, MAP_SIZE, H_WALL, 4, borderMat, false);   
  addStaticWall(scene, world, R, 0, H_WALL / 2, -HALF_M, MAP_SIZE, H_WALL, 4, borderMat, false);  
  addStaticWall(scene, world, R, HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE, borderMat, false);   
  addStaticWall(scene, world, R, -HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE, borderMat, false);  

  // Sky Environment
  const geo = new THREE.SphereGeometry(280, 24, 12);
  const mat = new THREE.MeshBasicMaterial({ color: 0x8fc2ff, side: THREE.BackSide, fog: false });
  scene.add(new THREE.Mesh(geo, mat));

  // ── 1. CITY GRID HIGHWAYS (MAIN STREET BOULEVARDS) ─────────────────────────
  // A perfect geometric crossroad dividing the city into 4 balanced, clean districts
  addPath(scene, 0, 0, 50, 50);        // Grand Central Intersection Plaza
  addPath(scene, 0, 95, 20, 140);     // North Avenue
  addPath(scene, 0, -95, 20, 140);    // South Avenue
  addPath(scene, 95, 0, 140, 20);     // East Boulevard
  addPath(scene, -95, 0, 140, 20);    // West Boulevard

  // ── 2. CENTRAL PLAZA LANDMARK (THE PLAZA FOUNTAIN / MONUMENT) ──────────────
  // The absolute middle of the city, styled like an architectural courtyard monument
  addStaticWall(scene, world, R, 0, 1.5, 0, 18, 3, 18, stoneMat, true); // Raised Monument Base
  addStaticWall(scene, world, R, 0, 5.0, 0, 4, 4, 4, stoneMat, true);   // Pillar Column
  
  // Street Corner Traffic Planters / Barricades protecting the intersections
  addBarricade(scene, world, R, -16, 16, Math.PI / 4, 6);
  addBarricade(scene, world, R, 16, 16, -Math.PI / 4, 6);
  addBarricade(scene, world, R, -16, -16, -Math.PI / 4, 6);
  addBarricade(scene, world, R, 16, -16, Math.PI / 4, 6);

  // ── 3. NORTH-WEST DISTRICT: THE RESIDENTIAL SECTOR ────────────────────────
  // Structured city block containing parallel houses and a narrow alleyway
  addHouse(scene, world, R, -45, 45, 16, 10, 16);   // Apartment complex 1
  addHouse(scene, world, R, -45, 75, 16, 10, 16);   // Apartment complex 2
  addHouse(scene, world, R, -75, 45, 14, 9, 14);    // Side Townhouse
  // Side Streets/Alleys inside the residential block
  addPath(scene, -45, 60, 10, 14);
  addPath(scene, -60, 45, 14, 10);

  // ── 4. NORTH-EAST DISTRICT: COMMERCIAL MARKET SQUARE ──────────────────────
  // Clean store facades lined up along the boulevard sidewalk with a brick courtyard
  addHouse(scene, world, R, 45, 45, 18, 9, 14);     // Front Cafe / Store Front
  addHouse(scene, world, R, 80, 50, 14, 11, 20);    // The Department Store
  addHouse(scene, world, R, 45, 80, 16, 9, 16);     // Corner Grocery Outlet
  addBarricade(scene, world, R, 32, 32, 0, 8);      // Front Sidewalk Barrier

  // ── 5. SOUTH-WEST DISTRICT: INDUSTRIAL FREIGHT & CONSTRUCTION SITE ────────
  // A grid of organized storage containers and building supplies instead of messy objects
  addHouse(scene, world, R, -55, -55, 24, 12, 24);  // The Central Factory Warehouse
  
  // Cleanly aligned row grids of storage cargo palettes (Construction Zone)
  addCrate(scene, world, R, -22, -35, 4, true);
  addCrate(scene, world, R, -22, -41, 4, true);
  addCrate(scene, world, R, -22, -47, 4, true);
  
  addCrate(scene, world, R, -35, -22, 4, true);
  addCrate(scene, world, R, -41, -22, 4, true);
  
  // Double-stacked supply container
  addCrate(scene, world, R, -35, -35, 3.5, true);
  addStaticWall(scene, world, R, -35, 5.2, -35, 3, 3, 3, crateMat, true);

  // ── 6. SOUTH-EAST DISTRICT: BANK & GOVERNMENT PLAZA ───────────────────────
  // Rigid, symmetrical architectural layout representing a secure institutional sector
  addHouse(scene, world, R, 50, -50, 20, 11, 20);   // The Central Bank Building
  addHouse(scene, world, R, 85, -50, 16, 9, 16);    // Annex Records Office
  // Symmetrical courtyard barrier designs (Security pillars)
  addBarricade(scene, world, R, 32, -45, Math.PI / 2, 6);
  addBarricade(scene, world, R, 32, -55, Math.PI / 2, 6);
  addBarricade(scene, world, R, 45, -32, 0, 6);

  // ── 7. SKYWAYS & ROOFTOP PASSAGES ──────────────────────────────────────────
  // Highly realistic sky-bridges connecting the high-rise roofs across the street grid
  addRamp(scene, world, R, -45, 24.0, 10.0, 22, 4.5, 1);  // South-West Warehouse Ramp
  addRamp(scene, world, R, 45, 24.0, 9.0, 22, 4.5, 1);    // North-East Market Ramp
  addSkyBridge(scene, world, R, 0, 10.2, 45, 72, 0.3, 4, woodMat); // Grand overpass crossing across the North Avenue

  // ── 8. DEFENSIVE CORNER UTILITY INFRASTRUCTURE ─────────────────────────────
  // The 4 map corners contain distinct infrastructure facilities acting as vertical combat towers
  addSniperTower(scene, world, R, -115, 115); addRamp(scene, world, R, -115, 119.5, 11.0, 26, 3.5, 1);  // Power Substation Tower
  addSniperTower(scene, world, R, 115, -115); addRamp(scene, world, R, 115, -119.5, 11.0, 26, 3.5, -1); // Water Processing Tower
  addSniperTower(scene, world, R, 115, 115);  addRamp(scene, world, R, 115, 119.5, 11.0, 26, 3.5, 1);  // Radio Communication Tower
  addSniperTower(scene, world, R, -115, -115); addRamp(scene, world, R, -115, -119.5, 11.0, 26, 3.5, -1); // Clock tower scaffold

  // ── 9. BOULEVARD TREE LANES (REALISTIC LINEAR FOLIAGE) ─────────────────────
  // Instead of noisy rings, trees are neatly lined up along the edges of sidewalks, exactly like real life city blocks.
  const streetSidewalks = [
    // North Avenue Sidewalk Lines
    [-13, 40], [-13, 65], [-13, 90], [-13, 115],
    [13, 40], [13, 65], [13, 90], [13, 115],
    // South Avenue Sidewalk Lines
    [-13, -40], [-13, -65], [-13, -90], [-13, -115],
    [13, -40], [13, -65], [13, -90], [13, -115],
    // East Boulevard Sidewalk Lines
    [40, 13], [65, 13], [90, 13], [115, 13],
    [40, -13], [65, -13], [90, -13], [115, -13],
    // West Boulevard Sidewalk Lines
    [-40, 13], [-65, 13], [-90, 13], [-115, 13],
    [-40, -13], [-65, -13], [-90, -13], [-115, -13]
  ];

  streetSidewalks.forEach(([tx, tz]) => {
    addTree(scene, world, R, tx, tz, 5.5);
  });
}
