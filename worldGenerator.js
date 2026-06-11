import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── BASIC WALL GENERATOR (WITH SHADOW CONTROLS) ──────────────────────────────
export function addStaticWall(scene, world, R, x, y, z, w, h, d, material = borderMat, castShadow = true){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow; 
  mesh.receiveShadow = true;
  scene.add(mesh);

  const rb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z));
  world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2, d / 2), rb);
}

// ── ROAD AND SURFACE GENERATOR ────────────────────────────────────────────────
export function addPath(scene, x, z, w, d) {
  const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pathMat);
  pathMesh.rotation.x = -Math.PI / 2;
  pathMesh.position.set(x, 0.02, z); 
  pathMesh.receiveShadow = true; 
  scene.add(pathMesh);
}

// ── COMPLEX BUILDING MODULES (IMAGE INSPIRED) ──────────────────────────────────
export function addComplexBuilding(scene, world, R, x, z, w, h, d, levels = 1, material = woodMat) {
  // Main building body structure
  addStaticWall(scene, world, R, x, h / 2, z, w, h, d, material, true);
  // Tiered flat roof setup to match architectural style
  addStaticWall(scene, world, R, x, h + 0.1, z, w + 0.6, 0.2, d + 0.6, roofMat, true);
  
  if (levels > 1) { // Render structural floor tiers for high rises
    for (let i = 1; i < levels; i++) {
      const tierY = (h / levels) * i;
      addStaticWall(scene, world, R, x, tierY, z, w + 0.2, 0.15, d + 0.2, stoneMat, false);
    }
  }
}

// ── COMPACT TREE LINES (LOW POLY FLUIDITY) ───────────────────────────────────
export function addTree(scene, world, R, x, z, trunkH = 4.5) {
  addStaticWall(scene, world, R, x, trunkH / 2, z, 0.8, trunkH, 0.8, woodMat, true);
  // Boxy low-poly leaves to accurately mimic the reference render aesthetic
  addStaticWall(scene, world, R, x, trunkH + 1.2, z, 3.2, 2.2, 3.2, leafMat, false);
}

// ── INDUSTRIAL CONTAINER FIELDS ──────────────────────────────────────────────
export function addShippingContainer(scene, world, R, x, yOffset, z, w, h, d, material) {
  addStaticWall(scene, world, R, x, yOffset + h / 2, z, w, h, d, material, true);
}

// ── RECREATION OF THE CENTRAL PLAZA MONUMENT ─────────────────────────────────
export function addCentralMonument(scene, world, R, x, z) {
  // Tiered steps platform base
  addStaticWall(scene, world, R, x, 0.4, z, 26, 0.8, 26, stoneMat, true);
  addStaticWall(scene, world, R, x, 1.2, z, 18, 0.8, 18, stoneMat, true);
  addStaticWall(scene, world, R, x, 2.4, z, 10, 1.6, 10, stoneMat, true);
  // Central Column Pillar spire
  addStaticWall(scene, world, R, x, 8.0, z, 2.2, 10.0, 2.2, stoneMat, true);
  // Top Monument capstone block
  addStaticWall(scene, world, R, x, 13.5, z, 1.5, 1.0, 1.5, woodMat, true);
}

// ── SKYWAY TRANSIT BRIDGE OVERPASS ───────────────────────────────────────────
export function addSkyBridge(scene, world, R, x, y, z, w, h, d) {
  addStaticWall(scene, world, R, x, y, z, w, h, d, stoneMat, true);
  // Left side safety guard rail
  addStaticWall(scene, world, R, x, y + 1.0, z - d/2, w, 1.8, 0.2, borderMat, false);
  // Right side safety guard rail
  addStaticWall(scene, world, R, x, y + 1.0, z + d/2, w, 1.8, 0.2, borderMat, false);
}

// ── AUTOCALCULATED STRUCTURAL ACCESS RAMPS ───────────────────────────────────
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

// ── FULL MAP LAYOUT MASTER ARCHITECT ─────────────────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  // Map Base Grass Ground Canvas
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), grassMat); 
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const fBody = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(MAP_SIZE / 2, 0.5, MAP_SIZE / 2), fBody);

  // Structural Boundary Containment Walls
  const H_WALL = 18; const HALF_M = MAP_SIZE / 2;
  addStaticWall(scene, world, R, 0, H_WALL / 2, HALF_M, MAP_SIZE, H_WALL, 4, borderMat, false);   
  addStaticWall(scene, world, R, 0, H_WALL / 2, -HALF_M, MAP_SIZE, H_WALL, 4, borderMat, false);  
  addStaticWall(scene, world, R, HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE, borderMat, false);   
  addStaticWall(scene, world, R, -HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE, borderMat, false);  

  // Sky Backdrop Sphere Dome
  const geo = new THREE.SphereGeometry(280, 24, 12);
  const mat = new THREE.MeshBasicMaterial({ color: 0x9eccfa, side: THREE.BackSide, fog: false });
  scene.add(new THREE.Mesh(geo, mat));

  // ── 1. MAIN ROAD GRID INFRASTRUCTURE ───────────────────────────────────────
  addPath(scene, 0, 0, 56, 56);         // Central Plaza Boulevard Core
  addPath(scene, 0, 95, 22, 140);       // North Highway Axis
  addPath(scene, 0, -95, 22, 140);      // South Highway Axis
  addPath(scene, 95, 0, 140, 22);       // East Boulevard Axis
  addPath(scene, -95, 0, 140, 22);      // West Boulevard Axis

  // ── 2. CENTER MONUMENT CONSTRUCTION ────────────────────────────────────────
  addCentralMonument(scene, world, R, 0, 0);
  
  // Symmetrical Inner Courtyard Concrete Fencing
  addStaticWall(scene, world, R, -24, 1, 24, 6, 2, 0.8, stoneMat, true);
  addStaticWall(scene, world, R, 24, 1, 24, 6, 2, 0.8, stoneMat, true);
  addStaticWall(scene, world, R, -24, 1, -24, 6, 2, 0.8, stoneMat, true);
  addStaticWall(scene, world, R, 24, 1, -24, 6, 2, 0.8, stoneMat, true);

  // ── 3. BOTTOM-LEFT QUADRANT: THE CARGO SHIPMENT LOGISTICS YARD ──────────────
  // Dark grey industrial concrete tarmac overlay foundation
  addPath(scene, -85, -85, 110, 110);
  
  // Distribution Warehouse Facility
  addComplexBuilding(scene, world, R, -75, -55, 36, 12, 24, 1, stoneMat);
  
  // Arranged Freight Freight Container Matrix Rows
  // Stack group 1: Front left row
  addShippingContainer(scene, world, R, -125, 0, -50, 6, 6, 12, crateMat);
  addShippingContainer(scene, world, R, -118, 0, -50, 6, 6, 12, borderMat);
  addShippingContainer(scene, world, R, -112, 0, -50, 6, 6, 12, roofMat);
  addShippingContainer(scene, world, R, -118, 6, -50, 6, 6, 12, crateMat); // Double stacked layer
  
  // Stack group 2: Back left row blocks
  addShippingContainer(scene, world, R, -120, 0, -95, 12, 6, 6, roofMat);
  addShippingContainer(scene, world, R, -106, 0, -95, 12, 6, 6, crateMat);
  addShippingContainer(scene, world, R, -92, 0, -95, 12, 6, 6, borderMat);
  addShippingContainer(scene, world, R, -78, 0, -95, 12, 6, 6, roofMat);
  
  addShippingContainer(scene, world, R, -113, 6, -95, 12, 6, 6, borderMat);
  addShippingContainer(scene, world, R, -85, 6, -95, 12, 6, 6, crateMat);

  // Small supply pallet stacks scattered near lines of sight
  addStaticWall(scene, world, R, -42, 2, -45, 4, 4, 4, crateMat, true);
  addStaticWall(scene, world, R, -42, 2, -51, 4, 4, 4, crateMat, true);
  addStaticWall(scene, world, R, -42, 5.5, -48, 3, 3, 3, woodMat, true);

  // ── 4. TOP-LEFT QUADRANT: RESIDENTIAL ESTATE & POWER PLANT ──────────────────
  // Aligned residential townhouse blocks
  addComplexBuilding(scene, world, R, -55, 45, 12, 10, 30, 2, woodMat);
  addComplexBuilding(scene, world, R, -80, 45, 12, 10, 30, 2, woodMat);
  
  // Multi-tier urban high rise apartment blocks flanking back alleyways
  addComplexBuilding(scene, world, R, -120, 75, 14, 22, 14, 4, stoneMat);
  addComplexBuilding(scene, world, R, -120, 45, 14, 22, 14, 4, stoneMat);

  // Far Back Left Power Grid Substation Fencing Layout
  addStaticWall(scene, world, R, -115, 4, 115, 25, 8, 2, borderMat, true); // Transformer block cage
  addStaticWall(scene, world, R, -125, 2, 100, 2, 4, 12, stoneMat, false);

  // ── 5. TOP-RIGHT QUADRANT: DOWNTOWN COMMERCIAL DISTRICT & SKYBRIDGE ──────────
  // Corner Shopping Complex Outlet Center
  addComplexBuilding(scene, world, R, 95, 50, 32, 12, 24, 1, roofMat); // Department store
  
  // Aligned strip block stores (Café / Bodegas) facing avenues
  addComplexBuilding(scene, world, R, 55, 65, 14, 9, 14, 1, woodMat);
  addComplexBuilding(scene, world, R, 55, 85, 14, 9, 14, 1, stoneMat);
  
  // High-rise structures with interconnecting rooftop skyways crossing avenues
  addComplexBuilding(scene, world, R, 40, 125, 16, 26, 16, 5, stoneMat); // Block Alpha
  addComplexBuilding(scene, world, R, -40, 125, 16, 26, 16, 5, stoneMat); // Block Beta Cross-Street
  addSkyBridge(scene, world, R, 0, 23.5, 125, 64, 0.4, 6);              // Overhead high structural bridge

  // ── 6. BOTTOM-RIGHT QUADRANT: FINANCIAL PLAZA & HISTORIC CLOCK TOWER ────────
  // Symmetrical municipal bank branch pavilion
  addComplexBuilding(scene, world, R, 65, -55, 26, 12, 20, 2, stoneMat);
  addComplexBuilding(scene, world, R, 105, -55, 20, 10, 20, 1, woodMat); // Administration annex office
  
  // The Historic Skeleton Framework Clock Tower Facility Base (Vantage Point)
  const tx = 115; const tz = -115;
  addStaticWall(scene, world, R, tx - 3, 7, tz - 3, 0.6, 14, 0.6, borderMat, true);
  addStaticWall(scene, world, R, tx + 3, 7, tz - 3, 0.6, 14, 0.6, borderMat, true);
  addStaticWall(scene, world, R, tx - 3, 7, tz + 3, 0.6, 14, 0.6, borderMat, true);
  addStaticWall(scene, world, R, tx + 3, 7, tz + 3, 0.6, 14, 0.6, borderMat, true);
  addStaticWall(scene, world, R, tx, 14.2, tz, 7.5, 0.4, 7.5, woodMat, true); // Observation platform Deck
  addStaticWall(scene, world, R, tx, 17.5, tz, 6.0, 6.0, 6.0, stoneMat, true); // Rigid clock head unit
  addRamp(scene, world, R, tx, tz + 10, 14.0, 28, 3.5, -1);                  // Access scaffolding ramp system

  // ── 7. PERIMETER HIGHWAY LINEAR TREE AVENUE BOULEVARDS ─────────────────────
  // Neat, uniformly spaced arrays running flawlessly along all internal sidewalks 
  const avenueTreeCoordinates = [
    // North Boulevard Lane Rows
    [-14, 42], [-14, 64], [-14, 86], [-14, 108],
    [14, 42], [14, 64], [14, 86], [14, 108],
    // South Boulevard Lane Rows
    [-14, -42], [-14, -64], [-14, -86], [-14, -108],
    [14, -42], [14, -64], [14, -86], [14, -108],
    // East Boulevard Lane Rows
    [42, 14], [64, 14], [86, 14], [108, 14],
    [42, -14], [64, -14], [86, -14], [108, -14],
    // West Boulevard Lane Rows
    [-42, 14], [-64, 14], [-86, 14], [-108, 14],
    [-42, -14], [-64, -14], [-86, -14], [-108, -14]
  ];

  avenueTreeCoordinates.forEach(([xPos, zPos]) => {
    addTree(scene, world, R, xPos, zPos, 5.0);
  });
}
