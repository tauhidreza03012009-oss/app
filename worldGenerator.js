import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── CORE INSTANTIATOR ENGINE WITH SHADOW HANDLING ───────────────────────────
function createRigidMesh(scene, world, R, x, y, z, w, h, d, material, ry = 0, castShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const q = new THREE.Quaternion().setFromEuler(mesh.rotation);
  const rb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z).setRotation({x: q.x, y: q.y, z: q.z, w: q.w}));
  world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2, d / 2), rb);
  return mesh;
}

// ── DECORATIVE PROP GENERATORS (NON-RIGID FOR PERFORMANCE) ───────────────────
function buildDashedRoadLines(scene, x, z, w, d, isVertical) {
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const count = isVertical ? d / 12 : w / 12;
  for (let i = 0; i < count; i++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(isVertical ? 0.6 : 3, isVertical ? 3 : 0.6), lineMat);
    dash.rotation.x = -Math.PI / 2;
    if (isVertical) {
      dash.position.set(x, 0.03, z - d / 2 + (i * 12) + 6);
    } else {
      dash.position.set(x - w / 2 + (i * 12) + 6, 0.03, z);
    }
    scene.add(dash);
  }
}

// ── ARCHITECTURAL HIGH-DENSITY PROCEDURAL BUILDERS ───────────────────────────

function buildApartmentComplex(scene, world, R, x, z, w, h, d, stories = 5) {
  createRigidMesh(scene, world, R, x, h / 2, z, w, h, d, stoneMat);
  createRigidMesh(scene, world, R, x, h + 0.2, z, w + 1.0, 0.4, d + 1.0, roofMat);
  
  const storyH = h / stories;
  for (let i = 1; i < stories; i++) {
    createRigidMesh(scene, world, R, x, storyH * i, z, w + 0.3, 0.2, d + 0.3, stoneMat, 0, false);
  }
  for (let s = 0; s < stories; s++) {
    const frameY = (storyH * s) + (storyH / 2);
    for (let offset = -w / 3; offset <= w / 3; offset += w / 3) {
      if (offset !== 0 || w > 15) {
        createRigidMesh(scene, world, R, x + offset, frameY, z + d / 2 + 0.06, 1.8, 1.6, 0.1, borderMat, 0, false);
        createRigidMesh(scene, world, R, x + offset, frameY, z - d / 2 - 0.06, 1.8, 1.6, 0.1, borderMat, 0, false);
      }
    }
  }
}

function buildRowHouse(scene, world, R, x, z, w, h, d, ry = 0) {
  createRigidMesh(scene, world, R, x, h / 2, z, w, h, d, woodMat, ry);
  createRigidMesh(scene, world, R, x, h / 3, z + d / 2 + 0.05, 1.6, 2.6, 0.1, borderMat, ry, false);

  const roofTiers = 6;
  const tierH = 0.45;
  for (let i = 0; i < roofTiers; i++) {
    const pct = i / roofTiers;
    const tierW = w * (1.1 - pct);
    const tierY = h + (i * tierH) + (tierH / 2);
    createRigidMesh(scene, world, R, x, tierY, z, tierW, tierH, d + 0.4, roofMat, ry);
  }
}

function buildCommercialShop(scene, world, R, x, z, w, h, d, accentMat, ry = 0) {
  createRigidMesh(scene, world, R, x, h / 2, z, w, h, d, stoneMat, ry);
  createRigidMesh(scene, world, R, x - w / 4, h / 3, z + d / 2 + 0.05, w / 3, h / 2, 0.1, borderMat, ry, false);
  createRigidMesh(scene, world, R, x + w / 4, h / 3, z + d / 2 + 0.05, w / 3, h / 2, 0.1, borderMat, ry, false);
  createRigidMesh(scene, world, R, x, h * 0.65, z + d / 2 + 0.6, w + 0.4, 0.25, 1.3, roofMat, ry);
  createRigidMesh(scene, world, R, x, h * 0.85, z + d / 2 + 0.15, w * 0.8, 1.2, 0.2, accentMat, ry);
}

function buildCentralMonument(scene, world, R, x, z) {
  createRigidMesh(scene, world, R, x, 0.4, z, 42, 0.8, 42, stoneMat);
  createRigidMesh(scene, world, R, x, 1.2, z, 32, 0.8, 32, stoneMat);
  createRigidMesh(scene, world, R, x, 2.4, z, 22, 1.6, 22, stoneMat);
  createRigidMesh(scene, world, R, x, 4.4, z, 14, 2.4, 14, stoneMat);
  createRigidMesh(scene, world, R, x, 6.4, z, 7.0, 1.6, 7.0, stoneMat);
  createRigidMesh(scene, world, R, x, 15.5, z, 3.6, 16.6, 3.6, stoneMat);
  createRigidMesh(scene, world, R, x, 24.1, z, 2.4, 0.6, 2.4, woodMat);

  const offsets = [-19.5, 19.5];
  offsets.forEach(px => {
    offsets.forEach(pz => {
      createRigidMesh(scene, world, R, x + px, 1.2, pz, 3.5, 2.4, 3.5, stoneMat);
    });
  });
}

function buildClockTower(scene, world, R, x, z) {
  const backboneH = 24;
  createRigidMesh(scene, world, R, x - 4.5, backboneH / 2, z - 4.5, 0.8, backboneH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x + 4.5, backboneH / 2, z - 4.5, 0.8, backboneH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x - 4.5, backboneH / 2, z + 4.5, 0.8, backboneH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x + 4.5, backboneH / 2, z + 4.5, 0.8, backboneH, 0.8, borderMat);
  
  for (let stageY = 6; stageY < backboneH; stageY += 6) {
    createRigidMesh(scene, world, R, x, stageY, z, 9.8, 0.4, 9.8, borderMat, 0, false);
  }
  createRigidMesh(scene, world, R, x, backboneH, z, 11.5, 0.4, 11.5, woodMat);
  createRigidMesh(scene, world, R, x, backboneH + 5.0, z, 8.5, 10.0, 8.5, stoneMat);
  
  const faceGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.5, 8);
  faceGeo.rotateX(Math.PI / 2);
  const faceZ = new THREE.Mesh(faceGeo, borderMat); faceZ.position.set(x, backboneH + 5.0, z + 4.3); scene.add(faceZ);
  const faceX = new THREE.Mesh(faceGeo, borderMat); faceX.rotation.y = Math.PI / 2; faceX.position.set(x + 4.3, backboneH + 5.0, z); scene.add(faceX);

  createRigidMesh(scene, world, R, x, backboneH + 10.6, z, 9.2, 1.4, 9.2, roofMat);
}

function buildBoxTree(scene, world, R, x, z) {
  createRigidMesh(scene, world, R, x, 2.6, z, 0.6, 5.2, 0.6, woodMat, 0, true);
  createRigidMesh(scene, world, R, x, 6.2, z, 3.6, 2.2, 3.6, leafMat, 0, false);
  createRigidMesh(scene, world, R, x, 7.5, z, 2.4, 1.6, 2.4, leafMat, 0, false);
}

// ── MASTER MAP EXPLICIT PLACEMENT COMPOSER ───────────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  const HALF_MAP = MAP_SIZE / 2;

  // Foundations Plane Setup
  const baseFloor = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), stoneMat); 
  baseFloor.rotation.x = -Math.PI / 2;
  baseFloor.receiveShadow = true;
  scene.add(baseFloor);

  const floorRB = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(HALF_MAP, 0.5, HALF_MAP), floorRB);

  // Structural Fortress Outer Boundaries
  const WH = 18;
  createRigidMesh(scene, world, R, 0, WH / 2, HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, false);   
  createRigidMesh(scene, world, R, 0, WH / 2, -HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, false);  
  createRigidMesh(scene, world, R, HALF_MAP, WH / 2, 0, 4, WH, MAP_SIZE, borderMat, 0, false);   
  createRigidMesh(scene, world, R, -HALF_MAP, WH / 2, 0, 4, WH, MAP_SIZE, borderMat, 0, false);  

  // Environmental Lighting Arena Dome
  const envSkyGeo = new THREE.SphereGeometry(285, 24, 12);
  const envSkyMat = new THREE.MeshBasicMaterial({ color: 0xa8d3ff, side: THREE.BackSide });
  scene.add(new THREE.Mesh(envSkyGeo, envSkyMat));

  // Avenues Cross Layout configuration
  const avW = 24;
  const plazaPlat = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), pathMat);
  plazaPlat.rotation.x = -Math.PI / 2; plazaPlat.position.set(0, 0.02, 0); plazaPlat.receiveShadow = true; scene.add(plazaPlat);

  const networks = [
    {x: 0, z: (HALF_MAP + 32) / 2, w: avW, d: HALF_MAP - 32, v: true},
    {x: 0, z: -(HALF_MAP + 32) / 2, w: avW, d: HALF_MAP - 32, v: true},
    {x: (HALF_MAP + 32) / 2, z: 0, w: HALF_MAP - 32, d: avW, v: false},
    {x: -(HALF_MAP + 32) / 2, z: 0, w: HALF_MAP - 32, d: avW, v: false}
  ];
  networks.forEach(lane => {
    const roadTrack = new THREE.Mesh(new THREE.PlaneGeometry(lane.w, lane.d), pathMat);
    roadTrack.rotation.x = -Math.PI / 2; roadTrack.position.set(lane.x, 0.02, lane.z); roadTrack.receiveShadow = true; scene.add(roadTrack);
    buildDashedRoadLines(scene, lane.x, lane.z, lane.w, lane.d, lane.v);
  });

  // Crosswalk Intersection Layout Borders
  const crosswalks = [{cx: 0, cz: 32}, {cx: 0, cz: -32}, {cx: 32, cz: 0}, {cx: -32, cz: 0}];
  crosswalks.forEach(cw => {
    const cwMesh = new THREE.Mesh(new THREE.PlaneGeometry(cw.cx === 0 ? avW : 3, cw.cx === 0 ? 3 : avW), stoneMat);
    cwMesh.rotation.x = -Math.PI / 2; cwMesh.position.set(cw.cx, 0.03, cw.cz); scene.add(cwMesh);
  });

  // Centerpiece Spire Monument
  buildCentralMonument(scene, world, R, 0, 0);

  // ── QUADRANT 1: NORTH-WEST RESIDENTIAL HOUSING BLOCKS ────────────────────────
  const nwLawn = new THREE.Mesh(new THREE.PlaneGeometry(106, 106), grassMat); nwLawn.rotation.x = -Math.PI / 2; nwLawn.position.set(-70, 0.03, 70); scene.add(nwLawn);
  
  // Tall Multi-story Apartments Blocks flanking the back wall
  buildApartmentComplex(scene, world, R, -74, 116, 22, 26, 22);
  buildApartmentComplex(scene, world, R, -114, 116, 22, 26, 22);

  // Dense row house arrays with true spacing configurations
  for (let s = 0; s < 4; s++) {
    buildRowHouse(scene, world, R, -38, 42 + (s * 17), 12, 9, 14, Math.PI / 2);
    buildRowHouse(scene, world, R, -56, 42 + (s * 17), 12, 9, 14, Math.PI / 2);
  }

  // Electrical Transformer Station (Top-Left Nook)
  createRigidMesh(scene, world, R, -116, 5, 74, 20, 10, 26, borderMat, 0, false);
  createRigidMesh(scene, world, R, -118, 4, 76, 5, 8, 5, stoneMat);
  createRigidMesh(scene, world, R, -112, 4, 72, 4, 6, 4, crateMat);

  // ── QUADRANT 2: SOUTH-WEST FREIGHT LOGISTICS / WAREHOUSE YARD ────────────────
  const swIndustrialTarmac = new THREE.Mesh(new THREE.PlaneGeometry(106, 106), stoneMat); 
  swIndustrialTarmac.rotation.x = -Math.PI / 2; swIndustrialTarmac.position.set(-70, 0.03, -70); scene.add(swIndustrialTarmac);

  // Gabled Core Assembly Hall Facility Warehouse
  createRigidMesh(scene, world, R, -68, 6, -54, 44, 12, 28, crateMat);
  createRigidMesh(scene, world, R, -68, 12.2, -54, 45, 0.4, 29, roofMat);
  createRigidMesh(scene, world, R, -82, 18, -62, 2.5, 12, 2.5, stoneMat); // Exhaust smokestack

  // Asymmetrical Container Shipping Grid Stacks Assembly
  const cargoMats = [roofMat, borderMat, crateMat, woodMat];
  
  // Horizontal Freight Base Layout Row
  for (let i = 0; i < 5; i++) {
    const cx = -116 + (i * 16);
    createRigidMesh(scene, world, R, cx, 2.5, -116, 14, 5, 6.5, cargoMats[i % cargoMats.length]);
    createRigidMesh(scene, world, R, cx, 7.5, -116, 14, 5, 6.5, cargoMats[(i + 1) % cargoMats.length]);
  }
  // Vertical Deep Left Wing Container Rows
  for (let j = 0; j < 3; j++) {
    createRigidMesh(scene, world, R, -122, 2.5, -44 - (j * 16), 6.5, 5, 14, cargoMats[j % cargoMats.length]);
    createRigidMesh(scene, world, R, -122, 7.5, -44 - (j * 16), 6.5, 5, 14, cargoMats[(j + 2) % cargoMats.length]);
    createRigidMesh(scene, world, R, -106, 2.5, -44 - (j * 16), 6.5, 5, 14, cargoMats[(j + 3) % cargoMats.length]);
  }

  // Liquid Processing Refinery Silos (Bottom-Left Corner)
  createRigidMesh(scene, world, R, -124, 6, -132, 11, 12, 11, stoneMat);
  createRigidMesh(scene, world, R, -108, 5, -132, 8, 10, 8, stoneMat);

  // Scattered Logistics Cover Crates
  createRigidMesh(scene, world, R, -36, 1.5, -36, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -31, 1.5, -36, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -34, 4.2, -36, 2.5, 2.5, 2.5, crateMat);

  // ── QUADRANT 3: TOP-RIGHT RETAIL PLAZA & DOWNTOWN TOWERS ─────────────────────
  const nePlaza = new THREE.Mesh(new THREE.PlaneGeometry(106, 106), woodMat); nePlaza.rotation.x = -Math.PI / 2; nePlaza.position.set(70, 0.03, 70); scene.add(nePlaza);

  // Anchor Superstore Complex
  createRigidMesh(scene, world, R, 112, 6, 48, 36, 13, 26, roofMat);

  // Distinct Commercial Frontage Line Facing Avenue Layout
  buildCommercialShop(scene, world, R, 54, 40, 16, 8.5, 13, woodMat);  
  buildCommercialShop(scene, world, R, 54, 57, 16, 8.5, 13, borderMat); 
  buildCommercialShop(scene, world, R, 54, 74, 16, 8.5, 13, stoneMat);  

  // Highrise Infrastructure Support Pillars & Connecting Steel Transit Skybridge
  buildApartmentComplex(scene, world, R, 40, 122, 18, 32, 18);
  buildApartmentComplex(scene, world, R, -40, 122, 18, 32, 18);
  createRigidMesh(scene, world, R, 0, 30.2, 122, 62, 0.6, 6.5, borderMat);

  // ── QUADRANT 4: SOUTH-EAST CIVIL BANK MUNICIPAL SECTOR ───────────────────────
  const seLawn = new THREE.Mesh(new THREE.PlaneGeometry(106, 106), grassMat); seLawn.rotation.x = -Math.PI / 2; seLawn.position.set(70, 0.03, -70); scene.add(seLawn);

  // Symmetrical Municipal Court Houses / Bank Building Blocks
  createRigidMesh(scene, world, R, 66, 6, -54, 34, 13, 24, stoneMat); 
  createRigidMesh(scene, world, R, 112, 5, -54, 24, 11, 24, woodMat);  

  // High Scaffolding Lattice Framework Clock Bastion Tower
  buildClockTower(scene, world, R, 122, -122);

  // ── SYSTEMATIC BOULEVARD SIDEWALK AUTOMATED TREES ────────────────────────────
  const treeRows = [
    // North Axis Boulevard Column Grid
    [-15, 36], [-15, 52], [-15, 68], [-15, 84], [-15, 100], [-15, 116], [-15, 132],
    [15, 36], [15, 52], [15, 68], [15, 84], [15, 100], [15, 116], [15, 132],
    // South Axis Boulevard Column Grid
    [-15, -36], [-15, -52], [-15, -68], [-15, -84], [-15, -100], [-15, -116], [-15, -132],
    [15, -36], [15, -52], [15, -68], [15, -84], [15, -100], [15, -116], [15, -132],
    // East Axis Boulevard Row Grid
    [36, 15], [52, 15], [68, 15], [84, 15], [100, 15], [116, 15], [132, 15],
    [36, -15], [52, -15], [68, -15], [84, -15], [100, -15], [116, -15], [132, -15],
    // West Axis Boulevard Row Grid
    [-36, 15], [-52, 15], [-68, 15], [-84, 15], [-100, 15], [-116, 15], [-132, 15],
    [-36, -15], [-52, -15], [-68, -15], [-84, -15], [-100, -15], [-116, -15], [-132, -15]
  ];

  treeRows.forEach(([tx, tz]) => {
    buildBoxTree(scene, world, R, tx, tz);
  });
}
