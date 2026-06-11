import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── CORE SYSTEM INSTANTIATOR (WITH PRECISE ORIENTATION) ───────────────────────
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

// ── ADVANCED COMPONENT MODELING GENERATORS ───────────────────────────────────

// 1. High-Density Apartment Complexes with Windows & Structural Depth
function buildApartmentComplex(scene, world, R, x, z, w, h, d, stories = 5) {
  // Main building structural hull
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, stoneMat);
  // Architectural overhanging roof line
  createRigidMesh(scene, world, R, x, h + 0.2, z, w + 1.0, 0.4, d + 1.0, roofMat);
  
  // Floor separation ledges
  const storyH = h / stories;
  for (let i = 1; i < stories; i++) {
    createRigidMesh(scene, world, R, x, storyH * i, z, w + 0.3, 0.25, d + 0.3, stoneMat, 0, false);
  }

  // Individual low-poly window indent panels along front and back façades
  for (let s = 0; s < stories; s++) {
    const frameY = (storyH * s) + (storyH / 2);
    // Front face window grid rows
    createRigidMesh(scene, world, R, x - w/3, frameY, z + d/2 + 0.1, 2.0, 1.8, 0.2, borderMat, 0, false);
    createRigidMesh(scene, world, R, x - w/9, frameY, z + d/2 + 0.1, 2.0, 1.8, 0.2, borderMat, 0, false);
    createRigidMesh(scene, world, R, x + w/9, frameY, z + d/2 + 0.1, 2.0, 1.8, 0.2, borderMat, 0, false);
    createRigidMesh(scene, world, R, x + w/3, frameY, z + d/2 + 0.1, 2.0, 1.8, 0.2, borderMat, 0, false);
  }
}

// 2. Residential Row Houses with True Layered A-Frame Sloped Roofs
function buildRowHouse(scene, world, R, x, z, w, h, d, ry = 0) {
  // Main base living space box
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, woodMat, ry);
  // Ground floor front door cutout representation
  createRigidMesh(scene, world, R, x, h/3, z + d/2 + 0.05, 1.8, 2.8, 0.1, borderMat, ry, false);

  // Structural A-Frame sloped geometric roof built via overlapping progressive layers
  const roofTiers = 6;
  const tierH = 0.5;
  for (let i = 0; i < roofTiers; i++) {
    const pct = i / roofTiers;
    const tierW = w * (1.1 - pct); // Squeezes the building width step-by-step as it reaches peak apex
    const tierY = h + (i * tierH) + (tierH / 2);
    createRigidMesh(scene, world, R, x, tierY, z, tierW, tierH, d + 0.4, roofMat, ry);
  }
}

// 3. Commercial Main Street Retails with Custom Structural Windows, Awnings & Signs
function buildCommercialShop(scene, world, R, x, z, w, h, d, signColorMat, ry = 0) {
  // Shop foundational structure
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, stoneMat, ry);
  // Wide storefront ground floor clear display panel windows
  createRigidMesh(scene, world, R, x - w/4, h/3, z + d/2 + 0.1, w/2.5, h/2, 0.2, borderMat, ry, false);
  createRigidMesh(scene, world, R, x + w/4, h/3, z + d/2 + 0.1, w/2.5, h/2, 0.2, borderMat, ry, false);
  // Projecting diagonal style striped shade awning canopy
  createRigidMesh(scene, world, R, x, h * 0.62, z + d/2 + 0.7, w + 0.6, 0.3, 1.5, roofMat, ry);
  // Explicit top billboard advertisement name sign board strip
  createRigidMesh(scene, world, R, x, h * 0.84, z + d/2 + 0.2, w * 0.85, 1.4, 0.3, signColorMat, ry);
}

// 4. Heavy Industrial Complex Warehouses with Ventilation Elements
function buildFactoryWarehouse(scene, world, R, x, z, w, h, d) {
  // Main manufacturing assembly floor hall
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, crateMat);
  // Shutter rolling loading bay garage gate
  createRigidMesh(scene, world, R, x + w/5, h/2.5, z + d/2 + 0.1, 10, h/1.4, 0.2, borderMat, 0, false);
  // Corrugated multi-sloped pitched industrial factory roof plate
  createRigidMesh(scene, world, R, x, h + 0.2, z, w + 1.2, 0.5, d + 1.2, roofMat);
  // Back mechanical ventilation chimney pipes infrastructure
  createRigidMesh(scene, world, R, x - w/3, h + 6.0, z - d/3, 2.0, 12.0, 2.0, stoneMat);
  createRigidMesh(scene, world, R, x - w/3 + 3, h + 4.0, z - d/3, 1.2, 8.0, 1.2, borderMat);
}

// 5. Symmetric Central Obelisk Spire & Monument Courtyard Pedestal
function buildCentralMonument(scene, world, R, x, z) {
  // Multiple sequential ascending foundation steps layers
  createRigidMesh(scene, world, R, x, 0.4, z, 40, 0.8, 40, stoneMat);
  createRigidMesh(scene, world, R, x, 1.2, z, 30, 0.8, 30, stoneMat);
  createRigidMesh(scene, world, R, x, 2.4, z, 20, 1.6, 20, stoneMat);
  createRigidMesh(scene, world, R, x, 4.4, z, 12, 2.4, 12, stoneMat);
  
  // Transition pedestal columns
  createRigidMesh(scene, world, R, x, 6.4, z, 6.5, 1.6, 6.5, stoneMat);
  // Main epic central high-pointing obelisk pillar core spire
  createRigidMesh(scene, world, R, x, 15.0, z, 3.5, 15.6, 3.5, stoneMat);
  // Gold pyramidal peak cap block module capping the absolute center top
  createRigidMesh(scene, world, R, x, 23.1, z, 2.2, 0.6, 2.2, woodMat);

  // Outer plaza perimeter block guards locking the courtyard angles
  const plazas = [-18.5, 18.5];
  plazas.forEach(px => {
    plazas.forEach(pz => {
      createRigidMesh(scene, world, R, x + px, 1.2, z + pz, 4, 2.4, 4, stoneMat);
    });
  });
}

// 6. Intricate Multi-Lattice Framework Structural Clock Tower Bastion
function buildClockTower(scene, world, R, x, z) {
  const backboneH = 22;
  // Four high corner vertical structural steel columns
  createRigidMesh(scene, world, R, x - 4.5, backboneH/2, z - 4.5, 0.8, backboneH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x + 4.5, backboneH/2, z - 4.5, 0.8, backboneH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x - 4.5, backboneH/2, z + 4.5, 0.8, backboneH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x + 4.5, backboneH/2, z + 4.5, 0.8, backboneH, 0.8, borderMat);
  
  // Cross lattice internal structural horizontal beam link rings
  for (let stageY = 5; stageY < backboneH; stageY += 5) {
    createRigidMesh(scene, world, R, x, stageY, z, 9.8, 0.5, 9.8, borderMat, 0, false);
  }

  // Upper scenic look-out floor base balcony deck
  createRigidMesh(scene, world, R, x, backboneH, z, 11, 0.4, 11, woodMat);
  // Solid upper housing clock module cube mechanism sitting on high framework
  createRigidMesh(scene, world, R, x, backboneH + 5.0, z, 8.0, 10.0, 8.0, stoneMat);
  
  // Circular clock facial discs embedded onto all four side dimensions
  const faceGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.5, 8);
  faceGeo.rotateX(Math.PI / 2);
  
  const faceZ = new THREE.Mesh(faceGeo, borderMat); faceZ.position.set(x, backboneH + 5.0, z + 4.1); scene.add(faceZ);
  const faceX = new THREE.Mesh(faceGeo, borderMat); faceX.rotation.y = Math.PI / 2; faceX.position.set(x + 4.1, backboneH + 5.0, z); scene.add(faceX);

  // Pyramidal peak cap roof tower spire top accent
  createRigidMesh(scene, world, R, x, backboneH + 10.6, z, 8.8, 1.2, 8.8, roofMat);
}

// 7. Low-Poly Structured Box Canvas Trees
function buildBoxTree(scene, world, R, x, z) {
  // Thin deep trunk core
  createRigidMesh(scene, world, R, x, 2.6, z, 0.6, 5.2, 0.6, woodMat, 0, true);
  // Layered green box foliage cubes matching the source asset packs geometry
  createRigidMesh(scene, world, R, x, 6.2, z, 3.6, 2.2, 3.6, leafMat, 0, false);
  createRigidMesh(scene, world, R, x, 7.5, z, 2.4, 1.6, 2.4, leafMat, 0, false);
}

// ── MASTER MAP BUILD LAYOUT COMPOSITION COMPOSER ──────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  const HALF_MAP = MAP_SIZE / 2;

  // 1. Full Concrete Ground Foundation Slab (Keeps everything clean, structured and uniform)
  const baseFloor = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), stoneMat); 
  baseFloor.rotation.x = -Math.PI / 2;
  baseFloor.receiveShadow = true;
  scene.add(baseFloor);

  const floorRB = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(HALF_MAP, 0.5, HALF_MAP), floorRB);

  // High Outer Fortified Border Perimeter Security Bastion Walls (Encloses the complete map layout scene)
  const WALL_HEIGHT = 16;
  createRigidMesh(scene, world, R, 0, WALL_HEIGHT/2, HALF_MAP, MAP_SIZE, WALL_HEIGHT, 4, borderMat, 0, false);   
  createRigidMesh(scene, world, R, 0, WALL_HEIGHT/2, -HALF_MAP, MAP_SIZE, WALL_HEIGHT, 4, borderMat, 0, false);  
  createRigidMesh(scene, world, R, HALF_MAP, WALL_HEIGHT/2, 0, 4, WALL_HEIGHT, MAP_SIZE, borderMat, 0, false);   
  createRigidMesh(scene, world, R, -HALF_MAP, WALL_HEIGHT/2, 0, 4, WALL_HEIGHT, MAP_SIZE, borderMat, 0, false);  

  // Skybox background environment color dome
  const envSkyGeo = new THREE.SphereGeometry(285, 24, 12);
  const envSkyMat = new THREE.MeshBasicMaterial({ color: 0x9eccfa, side: THREE.BackSide });
  scene.add(new THREE.Mesh(envSkyGeo, envSkyMat));

  // ── 2. HIGH ACCURACY AS-RENDERED STREET BOULEVARD LANES NETWORK ─────────────
  const avenueW = 24; // Wide concrete multi-lane avenues dividing layout quadrants
  
  // Central core intersection plaza canvas area plate
  const plazaPlat = new THREE.Mesh(new THREE.PlaneGeometry(62, 62), pathMat);
  plazaPlat.rotation.x = -Math.PI / 2; plazaPlat.position.set(0, 0.02, 0); plazaPlat.receiveShadow = true; scene.add(plazaPlat);

  // Individual Main Avenue strip extension branches
  const networks = [
    {x: 0, z: (HALF_MAP + 31) / 2, w: avenueW, d: HALF_MAP - 31},
    {x: 0, z: -(HALF_MAP + 31) / 2, w: avenueW, d: HALF_MAP - 31},
    {x: (HALF_MAP + 31) / 2, z: 0, w: HALF_MAP - 31, d: avenueW},
    {x: -(HALF_MAP + 31) / 2, z: 0, w: HALF_MAP - 31, d: avenueW}
  ];
  networks.forEach(lane => {
    const roadTrack = new THREE.Mesh(new THREE.PlaneGeometry(lane.w, lane.d), pathMat);
    roadTrack.rotation.x = -Math.PI / 2; roadTrack.position.set(lane.x, 0.02, lane.z); roadTrack.receiveShadow = true; scene.add(roadTrack);
    
    // Add distinct light-colored protective sidewalk pedestrian curb stones framing the vehicle asphalt lines
    if (lane.w === avenueW) { // Vertical highway lanes curbs
      createRigidMesh(scene, world, R, lane.x - avenueW/2 - 0.4, 0.2, lane.z, 0.8, 0.4, lane.d, stoneMat, 0, false);
      createRigidMesh(scene, world, R, lane.x + avenueW/2 + 0.4, 0.2, lane.z, 0.8, 0.4, lane.d, stoneMat, 0, false);
    } else { // Horizontal boulevard lanes curbs
      createRigidMesh(scene, world, R, lane.x, 0.2, lane.z - avenueW/2 - 0.4, lane.w, 0.4, 0.8, stoneMat, 0, false);
      createRigidMesh(scene, world, R, lane.x, 0.2, lane.z + avenueW/2 + 0.4, lane.w, 0.4, 0.8, stoneMat, 0, false);
    }
  });

  // Inject White Pedestrian Crossing Visual Markings at every junction boundary lane entry
  const markerW = avenueW;
  const crosswalkPlacements = [
    {cx: 0, cz: 31}, {cx: 0, cz: -31}, {cx: 31, cz: 0}, {cx: -31, cz: 0}
  ];
  crosswalkPlacements.forEach(cw => {
    const cwMesh = new THREE.Mesh(new THREE.PlaneGeometry(cw.cx === 0 ? markerW : 2.5, cw.cx === 0 ? 2.5 : markerW), stoneMat);
    cwMesh.rotation.x = -Math.PI / 2; cwMesh.position.set(cw.cx, 0.03, cw.cz); scene.add(cwMesh);
  });

  // Instantiates the core grand central architectural obelisk pedestal column spire
  buildCentralMonument(scene, world, R, 0, 0);

  // ── 3. NORTH-WEST QUADRANT: THE HIGH-DENSITY RESIDENTIAL SECTOR ──────────────
  // Foundation Green Meadow Lawn park canvas overlay element
  const NW_BASE_X = -70; const NW_BASE_Z = 70;
  const nwLawn = new THREE.Mesh(new THREE.PlaneGeometry(106, 106), grassMat); nwLawn.rotation.x = -Math.PI / 2; nwLawn.position.set(NW_BASE_X, 0.03, NW_BASE_Z); scene.add(nwLawn);

  // Symmetrical Multi-story massive High-Rise Tenant Apartment block slabs along back border lines
  buildApartmentComplex(scene, world, R, -72, 116, 22, 26, 22, stoneMat);
  buildApartmentComplex(scene, world, R, -112, 116, 22, 26, 22, stoneMat);

  // Two parallel tightly structured linear row columns of sloped A-frame suburban homes facing internally
  for (let s = 0; s < 4; s++) {
    buildRowHouse(scene, world, R, -38, 42 + (s * 17), 12, 8.5, 14, Math.PI / 2);
    buildRowHouse(scene, world, R, -56, 42 + (s * 17), 12, 8.5, 14, Math.PI / 2);
  }

  // Electrical Transformer Power Grid Substation fence installation (Far rear boundary corner nook)
  createRigidMesh(scene, world, R, -116, 5, 74, 18, 10, 26, borderMat, 0, false);
  // Power plant scaffold transformers details inside cage
  createRigidMesh(scene, world, R, -116, 4, 74, 6, 8, 6, stoneMat);
  createRigidMesh(scene, world, R, -108, 4, 74, 4, 6, 4, crateMat);

  // ── 4. SOUTH-WEST QUADRANT: COLD STORAGE & LOGISTICAL SHIPPING INDUSTRIAL DISTRICT
  // Dark factory asphalt tarmac ground cover deck foundation pad
  const SW_BASE_X = -70; const SW_BASE_Z = -70;
  const swIndustrialTarmac = new THREE.Mesh(new THREE.PlaneGeometry(106, 106), stoneMat); 
  swIndustrialTarmac.rotation.x = -Math.PI / 2; swIndustrialTarmac.position.set(SW_BASE_X, 0.03, SW_BASE_Z); scene.add(swIndustrialTarmac);

  // Massive Industrial Assembly Hall Gabled Warehouse Hangar
  buildFactoryWarehouse(scene, world, R, -68, -54, 42, 12, 28);

  // Production Color Palette arrays mimicking alternating container storage setups
  const shippingColors = [roofMat, borderMat, crateMat, woodMat];
  
  // Freight Container Stack Yard Line - Array Alpha (Foreground horizontal rows setup)
  for (let cAlpha = 0; cAlpha < 5; cAlpha++) {
    const targetX = -116 + (cAlpha * 16);
    const targetZ = -116;
    const colorSelection = shippingColors[cAlpha % shippingColors.length];
    // Foundation Container Layer
    createRigidMesh(scene, world, R, targetX, 2.5, targetZ, 14, 5, 6.5, colorSelection);
    // Double Stack Top Container Physics Layer
    createRigidMesh(scene, world, R, targetX, 7.5, targetZ, 14, 5, 6.5, shippingColors[(cAlpha + 2) % shippingColors.length]);
  }

  // Freight Container Stack Yard Line - Array Beta (Deep left vertical rows boundary lines setup)
  for (let cBeta = 0; cBeta < 3; cBeta++) {
    const targetX1 = -122; const targetX2 = -106;
    const targetZ = -44 - (cBeta * 16);
    const primaryColor = shippingColors[cBeta % shippingColors.length];
    // Left row bay stacking
    createRigidMesh(scene, world, R, targetX1, 2.5, targetZ, 6.5, 5, 14, primaryColor);
    createRigidMesh(scene, world, R, targetX1, 7.5, targetZ, 6.5, 5, 14, shippingColors[(cBeta + 3) % shippingColors.length]);
    // Right twin row bay stacking
    createRigidMesh(scene, world, R, targetX2, 2.5, targetZ, 6.5, 5, 14, shippingColors[(cBeta + 1) % shippingColors.length]);
  }

  // Scattered supply wooden crates piles providing tactical player interaction/cover obstacles
  createRigidMesh(scene, world, R, -36, 1.5, -36, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -31, 1.5, -36, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -34, 4.2, -36, 2.5, 2.5, 2.5, crateMat);
  createRigidMesh(scene, world, R, -40, 1.0, -33, 2, 2, 2, woodMat);

  // Liquid refinery chemical processing silo cylinders storage unit installation (Far back nook)
  createRigidMesh(scene, world, R, -124, 6, -132, 11, 12, 11, stoneMat);
  createRigidMesh(scene, world, R, -108, 5, -132, 8, 10, 8, stoneMat);

  // ── 5. TOP-RIGHT QUADRANT: DOWNTOWN COMMERCIAL RETAIL MARKET AVENUES ─────────
  // Open terracotta brick styled pedestrian walking outdoor plaza arena platform overlay
  const NE_BASE_X = 70; const NE_BASE_Z = 70;
  const nePlaza = new THREE.Mesh(new THREE.PlaneGeometry(106, 106), woodMat); nePlaza.rotation.x = -Math.PI / 2; nePlaza.position.set(NE_BASE_X, 0.03, NE_BASE_Z); scene.add(nePlaza);

  // Massive wholesale Anchor Department Superstore complex facility
  createRigidMesh(scene, world, R, 112, 6, 48, 36, 13, 26, roofMat);

  // Linear Main Street commercial retail boutique/cafe strips facing the inner avenue lanes
  buildCommercialShop(scene, world, R, 54, 40, 16, 8.5, 13, woodMat);  // Corner Cafe Bistro Shop
  buildCommercialShop(scene, world, R, 54, 57, 16, 8.5, 13, borderMat); // Apparel Boutique Outlet Store
  buildCommercialShop(scene, world, R, 54, 74, 16, 8.5, 13, stoneMat);  // General Grocery Provisions Market

  // Flanking downtown structural towers holding high overpass vehicle skybridges
  buildApartmentComplex(scene, world, R, 40, 122, 18, 30, 18, stoneMat);  // Right side anchor highrise
  buildApartmentComplex(scene, world, R, -40, 122, 18, 30, 18, stoneMat); // Left side twin anchor highrise across street
  // High-altitude structural steel pedestrian overpass skyway bridge platform crossing completely over road lanes
  createRigidMesh(scene, world, R, 0, 28.5, 122, 62, 0.6, 6.5, borderMat);

  // ── 6. SOUTH-EAST QUADRANT: CIVIL SECTOR PLAZA & GRAND CLOCK BASTION ────────
  // Open clean green grass lawn park canvas overlay element
  const SE_BASE_X = 70; const SE_BASE_Z = -70;
  const seLawn = new THREE.Mesh(new THREE.PlaneGeometry(106, 106), grassMat); seLawn.rotation.x = -Math.PI / 2; seLawn.position.set(SE_BASE_X, 0.03, SE_BASE_Z); scene.add(seLawn);

  // Symmetrical clean white marble architectural institutional structures
  createRigidMesh(scene, world, R, 66, 6, -54, 34, 12.5, 24, stoneMat); // Central Civil Bank Municipal Branch Office
  createRigidMesh(scene, world, R, 112, 5, -54, 24, 10.5, 24, woodMat);  // Historical Records Archive Office Annex

  // Landmark Framework Lattice Structural Clock Tower Bastion Vantage Point Structure
  buildClockTower(scene, world, R, 122, -122);

  // ── 7. PERIMETER ACCURATE SIDEWALK TREES ROW ARRAY INSTANTIATION ────────────
  // Neatly grouped columns lining both edges of all main axis avenues, directly copying the asset pack styling
  const automatedTreePositions = [
    // Vertical North Axis Highway Sidewalk Columns
    [-15, 36], [-15, 52], [-15, 68], [-15, 84], [-15, 100], [-15, 116], [-15, 132],
    [15, 36], [15, 52], [15, 68], [15, 84], [15, 100], [15, 116], [15, 132],
    // Vertical South Axis Highway Sidewalk Columns
    [-15, -36], [-15, -52], [-15, -68], [-15, -84], [-15, -100], [-15, -116], [-15, -132],
    [15, -36], [15, -52], [15, -68], [15, -84], [15, -100], [15, -116], [15, -132],
    // Horizontal East Axis Boulevard Sidewalk Columns
    [36, 15], [52, 15], [68, 15], [84, 15], [100, 15], [116, 15], [132, 15],
    [36, -15], [52, -15], [68, -15], [84, -15], [100, -15], [116, -15], [132, -15],
    // Horizontal West Axis Boulevard Sidewalk Columns
    [-36, 15], [-52, 15], [-68, 15], [-84, 15], [-100, 15], [-116, 15], [-132, 15],
    [-36, -15], [-52, -15], [-68, -15], [-84, -15], [-100, -15], [-116, -15], [-132, -15]
  ];

  automatedTreePositions.forEach(([coordX, coordZ]) => {
    buildBoxTree(scene, world, R, coordX, coordZ);
  });
}
