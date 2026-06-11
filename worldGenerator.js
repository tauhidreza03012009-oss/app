import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── CORE ENCAPSULATED PHYSICS MATRIX INSTANTIATOR ────────────────────────────
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

// ── MICROSCOPIC DETAIL ELEMENT GENERATORS ─────────────────────────────────────

// 1. Road Markings & Zebra Crosswalks
function buildRoadDetails(scene, MAP_SIZE, avW) {
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const half = MAP_SIZE / 2;
  
  // Dashed lane splitters
  for (let i = 35; i < half - 10; i += 12) {
    // North lane
    let dN = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3), lineMat); dN.rotation.x = -Math.PI/2; dN.position.set(0, 0.03, i); scene.add(dN);
    // South lane
    let dS = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3), lineMat); dS.rotation.x = -Math.PI/2; dS.position.set(0, 0.03, -i); scene.add(dS);
    // East lane
    let dE = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.5), lineMat); dE.rotation.x = -Math.PI/2; dE.position.set(i, 0.03, 0); scene.add(dE);
    // West lane
    let dW = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.5), lineMat); dW.rotation.x = -Math.PI/2; dW.position.set(-i, 0.03, 0); scene.add(dW);
  }

  // Zebra Crosswalk Lines at the Central Plaza boundaries
  const crosswalkPositions = [31, -31];
  crosswalkPositions.forEach(zCoord => {
    for (let xOffset = -avW / 2 + 2; xOffset <= avW / 2 - 2; xOffset += 3) {
      let stripe = new THREE.Mesh(new THREE.PlaneGeometry(1, 4), lineMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(xOffset, 0.03, zCoord);
      scene.add(stripe);
    }
  });
  crosswalkPositions.forEach(xCoord => {
    for (let zOffset = -avW / 2 + 2; zOffset <= avW / 2 - 2; zOffset += 3) {
      let stripe = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), lineMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(xCoord, 0.03, zOffset);
      scene.add(stripe);
    }
  });
}

// 2. Low-Poly Box Foliage Trees
function buildBoxTree(scene, world, R, x, z) {
  createRigidMesh(scene, world, R, x, 2.5, z, 0.6, 5.0, 0.6, woodMat, 0, true);
  createRigidMesh(scene, world, R, x, 5.8, z, 3.2, 2.0, 3.2, leafMat, 0, false);
  createRigidMesh(scene, world, R, x, 7.0, z, 2.0, 1.4, 2.0, leafMat, 0, false);
}

// 3. Fortified Wall Corner Bastion Tower Modules
function buildWallTower(scene, world, R, x, z) {
  createRigidMesh(scene, world, R, x, 10, z, 10, 20, 10, borderMat);
  createRigidMesh(scene, world, R, x, 20.5, z, 11, 1.0, 11, stoneMat);
  // Battlement parapets
  createRigidMesh(scene, world, R, x - 4.5, 21.5, z - 4.5, 2, 1.5, 2, borderMat);
  createRigidMesh(scene, world, R, x + 4.5, 21.5, z - 4.5, 2, 1.5, 2, borderMat);
  createRigidMesh(scene, world, R, x - 4.5, 21.5, z + 4.5, 2, 1.5, 2, borderMat);
  createRigidMesh(scene, world, R, x + 4.5, 21.5, z + 4.5, 2, 1.5, 2, borderMat);
}

// 4. Commercial Strip Retail Blocks (Signboards, Awnings, and Storefronts)
function buildRetailUnit(scene, world, R, x, z, w, h, d, textMat, signMat, ry = 0) {
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, stoneMat, ry);
  // Window displays
  createRigidMesh(scene, world, R, x, h/3, z + d/2 + 0.05, w * 0.7, h/2, 0.1, borderMat, ry, false);
  // Colored canopy awning
  createRigidMesh(scene, world, R, x, h * 0.6, z + d/2 + 0.5, w + 0.4, 0.3, 1.2, signMat, ry);
  // Big rectangular business sign board
  createRigidMesh(scene, world, R, x, h * 0.85, z + d/2 + 0.1, w * 0.8, 1.5, 0.2, textMat, ry);
}

// 5. Classic Pillars Municipal Structure (The Bank)
function buildMunicipalBank(scene, world, R, x, z, w, h, d) {
  // Main building foundation block
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, stoneMat);
  // Front steps entry portico platform
  createRigidMesh(scene, world, R, x, 0.4, z + d/2 + 2, w * 0.6, 0.8, 4, stoneMat);
  // Front triangular classic pediment roof cap overlay
  createRigidMesh(scene, world, R, x, h + 1.5, z + d/2 - 1, w, 3.0, 4, roofMat);
  // Architectural pillars structural columns
  for (let i = -w/3; i <= w/3; i += w/3) {
    createRigidMesh(scene, world, R, x + i, h/2, z + d/2 + 0.2, 1.2, h, 1.2, borderMat);
  }
}

// 6. High-Voltage Transmission Radio Lattice Tower
function buildRadioTower(scene, world, R, x, z) {
  const baseH = 32;
  createRigidMesh(scene, world, R, x, baseH / 2, z, 4, baseH, 4, borderMat);
  // Progressive taper step scaffolds
  createRigidMesh(scene, world, R, x, baseH + 4, z, 2, 8, 2, woodMat);
  createRigidMesh(scene, world, R, x, baseH + 10, z, 0.4, 6, 0.4, borderMat); // Top antenna mast spike
}

// ── MASTER WORLD ENVIRONMENT COMPOSITION ENGINE ────────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  const HALF_MAP = MAP_SIZE / 2;
  const avW = 24;

  // Ground Plane Tarmac Foundation Base
  const baseFloor = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), stoneMat);
  baseFloor.rotation.x = -Math.PI / 2; baseFloor.receiveShadow = true; scene.add(baseFloor);

  const floorRB = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(HALF_MAP, 0.5, HALF_MAP), floorRB);

  // Outer Sky Dome Background Wrapper
  const skyGeo = new THREE.SphereGeometry(290, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x9eccfa, side: THREE.BackSide });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // ── FORTIFIED BOUNDARY WALLS & CORNER BASTIONS ──────────────────────────────
  const WH = 16;
  // Side Wall Runs
  createRigidMesh(scene, world, R, 0, WH/2, HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, false);
  createRigidMesh(scene, world, R, 0, WH/2, -HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, false);
  createRigidMesh(scene, world, R, HALF_MAP, WH/2, 0, 4, WH, MAP_SIZE, borderMat, 0, false);
  createRigidMesh(scene, world, R, -HALF_MAP, WH/2, 0, 4, WH, MAP_SIZE, borderMat, 0, false);

  // Four Corner Tower Bastions
  buildWallTower(scene, world, R, HALF_MAP, HALF_MAP);
  buildWallTower(scene, world, R, -HALF_MAP, HALF_MAP);
  buildWallTower(scene, world, R, HALF_MAP, -HALF_MAP);
  buildWallTower(scene, world, R, -HALF_MAP, -HALF_MAP);

  // ── STREET BOULEVARDS & JUNCTIONS SYSTEM ────────────────────────────────────
  const plazaPlat = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), pathMat);
  plazaPlat.rotation.x = -Math.PI / 2; plazaPlat.position.set(0, 0.02, 0); plazaPlat.receiveShadow = true; scene.add(plazaPlat);

  const avenues = [
    {x: 0, z: (HALF_MAP + 32) / 2, w: avW, d: HALF_MAP - 32},
    {x: 0, z: -(HALF_MAP + 32) / 2, w: avW, d: HALF_MAP - 32},
    {x: (HALF_MAP + 32) / 2, z: 0, w: HALF_MAP - 32, d: avW},
    {x: -(HALF_MAP + 32) / 2, z: 0, w: HALF_MAP - 32, d: avW}
  ];
  avenues.forEach(lane => {
    const roadTrack = new THREE.Mesh(new THREE.PlaneGeometry(lane.w, lane.d), pathMat);
    roadTrack.rotation.x = -Math.PI / 2; roadTrack.position.set(lane.x, 0.02, lane.z); roadTrack.receiveShadow = true; scene.add(roadTrack);
    // Concrete raised sidewalk perimeter curbs bounding the vehicle roadway track lanes
    if (lane.w === avW) {
      createRigidMesh(scene, world, R, lane.x - avW/2 - 0.5, 0.2, lane.z, 1.0, 0.4, lane.d, stoneMat, 0, false);
      createRigidMesh(scene, world, R, lane.x + avW/2 + 0.5, 0.2, lane.z, 1.0, 0.4, lane.d, stoneMat, 0, false);
    } else {
      createRigidMesh(scene, world, R, lane.x, 0.2, lane.z - avW/2 - 0.5, lane.w, 0.4, 1.0, stoneMat, 0, false);
      createRigidMesh(scene, world, R, lane.x, 0.2, lane.z + avW/2 + 0.5, lane.w, 0.4, 1.0, stoneMat, 0, false);
    }
  });

  buildRoadDetails(scene, MAP_SIZE, avW);

  // ── CENTRAL PLAZA MONUMENT SPIRE ───────────────────────────────────────────
  createRigidMesh(scene, world, R, 0, 0.4, 0, 44, 0.8, 44, stoneMat);
  createRigidMesh(scene, world, R, 0, 1.2, 0, 34, 0.8, 34, stoneMat);
  createRigidMesh(scene, world, R, 0, 2.4, 0, 24, 1.6, 24, stoneMat);
  createRigidMesh(scene, world, R, 0, 4.4, 0, 14, 2.4, 14, stoneMat);
  createRigidMesh(scene, world, R, 0, 14.5, 0, 3.8, 18.0, 3.8, stoneMat);
  createRigidMesh(scene, world, R, 0, 24.0, 0, 2.5, 1.0, 2.5, woodMat); // Pyramid top crown piece

  // Courtyard perimeter fence accents
  const cOffsets = [-20, 20];
  cOffsets.forEach(cx => {
    cOffsets.forEach(cz => {
      createRigidMesh(scene, world, R, cx, 1.2, cz, 4, 2.4, 4, stoneMat);
    });
  });

  // ── ASYMMETRIC QUADRANT DEVELOPMENT MATRIX ──────────────────────────────────

  // 1. NORTH-WEST: RESIDENTIAL APARTMENTS & BACK ALLEY HOUSING
  const nwGrass = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), grassMat); nwGrass.rotation.x = -Math.PI / 2; nwGrass.position.set(-70, 0.03, 70); scene.add(nwGrass);
  
  // Back row structural residential blocks
  createRigidMesh(scene, world, R, -74, 12, 116, 22, 24, 22, stoneMat);
  createRigidMesh(scene, world, R, -74, 24.2, 116, 23, 0.4, 23, roofMat);
  createRigidMesh(scene, world, R, -114, 12, 116, 22, 24, 22, stoneMat);
  createRigidMesh(scene, world, R, -114, 24.2, 116, 23, 0.4, 23, roofMat);

  // Exact 8-Row House Neighborhood layout configuration
  for (let hIndex = 0; hIndex < 4; hIndex++) {
    buildRowHouse(scene, world, R, -38, 42 + (hIndex * 17), 12, 9, 14, Math.PI / 2);
    buildRowHouse(scene, world, R, -56, 42 + (hIndex * 17), 12, 9, 14, Math.PI / 2);
  }

  // Electrical Substations Transformer yard infrastructure (Far back left niche)
  createRigidMesh(scene, world, R, -118, 4, 76, 16, 8, 22, borderMat, 0, false);
  createRigidMesh(scene, world, R, -120, 5, 78, 4, 10, 4, stoneMat);
  createRigidMesh(scene, world, R, -114, 3, 72, 3, 6, 3, crateMat);

  // 2. SOUTH-WEST: COLD LOGISTICS FREIGHT YARD & REFINERY PLANT
  const swTarmac = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), stoneMat); swTarmac.rotation.x = -Math.PI / 2; swTarmac.position.set(-70, 0.03, -70); scene.add(swTarmac);

  // Main Gable-Roof Core Distribution Warehouse Factory
  createRigidMesh(scene, world, R, -68, 6, -54, 46, 12, 30, crateMat);
  createRigidMesh(scene, world, R, -68, 12.3, -54, 48, 0.6, 32, roofMat);
  createRigidMesh(scene, world, R, -84, 17, -64, 2.5, 10, 2.5, stoneMat); // Exhaust smokestack chimney

  // Explicitly configured Container yard layout (Red, Blue, Green, Yellow stacks matching reference photo)
  const colors = [roofMat, borderMat, crateMat, woodMat];
  // Main stack array cluster alpha
  const stackPositionsX = [-118, -102, -86, -70, -54];
  stackPositionsX.forEach((cPosX, idx) => {
    createRigidMesh(scene, world, R, cPosX, 2.5, -116, 14, 5, 7, colors[idx % colors.length]);
    createRigidMesh(scene, world, R, cPosX, 7.5, -116, 14, 5, 7, colors[(idx + 2) % colors.length]);
  });
  // Side block flanking vertical container arrays
  for (let vIdx = 0; vIdx < 3; vIdx++) {
    createRigidMesh(scene, world, R, -122, 2.5, -42 - (vIdx * 16), 7, 5, 14, colors[vIdx % colors.length]);
    createRigidMesh(scene, world, R, -122, 7.5, -42 - (vIdx * 16), 7, 5, 14, colors[(vIdx + 1) % colors.length]);
    createRigidMesh(scene, world, R, -106, 2.5, -42 - (vIdx * 16), 7, 5, 14, colors[(vIdx + 3) % colors.length]);
  }

  // Supply wooden crate obstacles cluster providing low-lying player cover
  createRigidMesh(scene, world, R, -36, 1.5, -36, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -31, 1.5, -36, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -34, 4.2, -36, 2.5, 2.5, 2.5, crateMat);

  // Chemical processing plant storage tank refinery (Bottom far corner layout elements)
  createRigidMesh(scene, world, R, -125, 7, -132, 12, 14, 12, stoneMat); // Tall main fluid cylinder silostat
  createRigidMesh(scene, world, R, -109, 5, -132, 8, 10, 8, stoneMat);  // Secondary fuel silo accumulator block

  // 3. TOP-RIGHT: COMMERCIAL DOWNTOWN MARKET PLAZA & SKYWAYS
  const nePlaza = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), woodMat); nePlaza.rotation.x = -Math.PI / 2; nePlaza.position.set(70, 0.03, 70); scene.add(nePlaza);

  // Large Anchor Big-Box Superstore facility
  createRigidMesh(scene, world, R, 112, 7.5, 48, 38, 15, 26, roofMat);
  createRigidMesh(scene, world, R, 112, 11.5, 61.1, 16, 3, 0.2, stoneMat); // Main store brand sign board

  // Row of completely distinct linear storefront shopping modules
  buildRetailUnit(scene, world, R, 54, 40, 16, 9, 14, woodMat, roofMat);   // Corner Cafe Bistro unit
  buildRetailUnit(scene, world, R, 54, 57, 16, 9, 14, borderMat, stoneMat); // Apparel Boutique unit
  buildRetailUnit(scene, world, R, 54, 74, 16, 9, 14, stoneMat, woodMat);  // Corner Grocery Provision unit

  // Heavy Commercial support pillars holding high structural overpass traffic bridges
  createRigidMesh(scene, world, R, 40, 15, 122, 18, 30, 18, stoneMat);
  createRigidMesh(scene, world, R, -40, 15, 122, 18, 30, 18, stoneMat); // Twin highrise anchor across main road line
  createRigidMesh(scene, world, R, 0, 28.5, 122, 62, 1.0, 6.5, borderMat); // Skyway overpass transit bridge section

  // Tall deep-corner structural radio transmission tower station lattice frame
  buildRadioTower(scene, world, R, 126, 126);

  // 4. BOTTOM-RIGHT: CIVIC CENTRE PLAZA & HISTORICAL CLOCK BASTION
  const seGrass = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), grassMat); seGrass.rotation.x = -Math.PI / 2; seGrass.position.set(70, 0.03, -70); scene.add(seGrass);

  // Main Symmetrical pillars Municipal Bank Branch building
  buildMunicipalBank(scene, world, R, 66, -54, 34, 13, 24);
  // Secondary City Records Archive Hall Office Annex
  createRigidMesh(scene, world, R, 112, 5.5, -54, 24, 11, 24, woodMat);
  createRigidMesh(scene, world, R, 112, 11.2, -54, 25, 0.5, 25, roofMat);

  // Fully frameworked open lattice clock tower observation viewpoint tower
  const ctH = 24;
  createRigidMesh(scene, world, R, 122 - 4.5, ctH / 2, -122 - 4.5, 0.8, ctH, 0.8, borderMat);
  createRigidMesh(scene, world, R, 122 + 4.5, ctH / 2, -122 - 4.5, 0.8, ctH, 0.8, borderMat);
  createRigidMesh(scene, world, R, 122 - 4.5, ctH / 2, -122 + 4.5, 0.8, ctH, 0.8, borderMat);
  createRigidMesh(scene, world, R, 122 + 4.5, ctH / 2, -122 + 4.5, 0.8, ctH, 0.8, borderMat);
  for (let ringY = 6; ringY < ctH; ringY += 6) {
    createRigidMesh(scene, world, R, 122, ringY, -122, 9.8, 0.4, 9.8, borderMat, 0, false);
  }
  createRigidMesh(scene, world, R, 122, ctH, -122, 11.5, 0.4, 11.5, woodMat);
  createRigidMesh(scene, world, R, 122, ctH + 5.0, -122, 8.5, 10.0, 8.5, stoneMat); // Clock house machinery cube head
  createRigidMesh(scene, world, R, 122, ctH + 10.6, -122, 9.2, 1.4, 9.2, roofMat);  // Pyramidal peak cap

  // Clock faces geometry disks pinned onto the exposed outer dimensions
  const faceGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.5, 8); faceGeo.rotateX(Math.PI / 2);
  const faceMesh = new THREE.Mesh(faceGeo, borderMat); faceMesh.position.set(122, ctH + 5.0, -122 + 4.3); scene.add(faceMesh);

  // ── GRID SYMMETRIC TREE BOULEVARD ALIGNMENT PLACEMENTS ──────────────────────
  const structuredTrees = [
    // North Avenue Sidewalk Columns
    [-15, 36], [-15, 52], [-15, 68], [-15, 84], [-15, 100], [-15, 116], [-15, 132],
    [15, 36], [15, 52], [15, 68], [15, 84], [15, 100], [15, 116], [15, 132],
    // South Avenue Sidewalk Columns
    [-15, -36], [-15, -52], [-15, -68], [-15, -84], [-15, -100], [-15, -116], [-15, -132],
    [15, -36], [15, -52], [15, -68], [15, -84], [15, -100], [15, -116], [15, -132],
    // East Boulevard Sidewalk Rows
    [36, 15], [52, 15], [68, 15], [84, 15], [100, 15], [116, 15], [132, 15],
    [36, -15], [52, -15], [68, -15], [84, -15], [100, -15], [116, -15], [132, -15],
    // West Boulevard Sidewalk Rows
    [-36, 15], [-52, 15], [-68, 15], [-84, 15], [-100, 15], [-116, 15], [-132, 15],
    [-36, -15], [-52, -15], [-68, -15], [-84, -15], [-100, -15], [-116, -15], [-132, -15]
  ];

  structuredTrees.forEach(([tx, tz]) => {
    buildBoxTree(scene, world, R, tx, tz);
  });
}
