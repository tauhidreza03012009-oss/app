import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── CORE ENGINE PRIMITIVE COMPONENT (WITH PRECISE ORIENTATION) ─────────────────
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

// ── ADVANCED HIGH-FIDELITY ASSET GENERATORS ──────────────────────────────────

// 1. Complex Apartment Block with individual window indents and floor trims
function buildApartmentComplex(scene, world, R, x, z, w, h, d, colorMat) {
  // Base Building Structure
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, colorMat);
  // Extruded Roof Border Trim
  createRigidMesh(scene, world, R, x, h + 0.2, z, w + 0.8, 0.4, d + 0.8, roofMat);
  
  // Add Horizontal Floor Divider Trims (Creates the "modular block" look from the image)
  const floors = 4;
  for (let i = 1; i < floors; i++) {
    createRigidMesh(scene, world, R, x, (h / floors) * i, z, w + 0.2, 0.3, d + 0.2, stoneMat, 0, false);
  }

  // Windows Façade Rows (Spawns low-poly dark windows along the front face)
  for (let f = 0; f < floors; f++) {
    const floorY = (h / floors) * f + (h / floors) / 2;
    // Multi-window spacing layout across the front width
    createRigidMesh(scene, world, R, x - w/4, floorY, z + d/2 + 0.1, 2.2, 1.8, 0.2, borderMat, 0, false);
    createRigidMesh(scene, world, R, x, floorY, z + d/2 + 0.1, 2.2, 1.8, 0.2, borderMat, 0, false);
    createRigidMesh(scene, world, R, x + w/4, floorY, z + d/2 + 0.1, 2.2, 1.8, 0.2, borderMat, 0, false);
  }
}

// 2. Residential Row Houses with Realistic A-Frame Sloped Roofs
function buildRowHouse(scene, world, R, x, z, w, h, d, ry = 0) {
  // Main residential living cube
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, woodMat, ry);
  
  // High accuracy sloped roof simulation using overlapping structural step plates
  const steps = 5;
  const stepHeight = 0.6;
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const currentW = w * (1.1 - ratio); // Taper widths inward as it rises
    const currentY = h + (i * stepHeight) + (stepHeight / 2);
    createRigidMesh(scene, world, R, x, currentY, z, currentW, stepHeight, d + 0.4, roofMat, ry);
  }
}

// 3. Custom Commercial Main Street Shops with Sign Boards and Awnings
function buildCommercialShop(scene, world, R, x, z, w, h, d, signColorMat, ry = 0) {
  // Main structural framing
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, stoneMat, ry);
  // Big dark glass cutout display zones on the front
  createRigidMesh(scene, world, R, x, h/3, z + d/2 + 0.1, w * 0.7, h/2, 0.2, borderMat, ry, false);
  // Projecting Awning Canopy Stripe
  createRigidMesh(scene, world, R, x, h * 0.65, z + d/2 + 0.6, w + 0.6, 0.3, 1.4, roofMat, ry);
  // Main Store Name Sign Board Overlay
  createRigidMesh(scene, world, R, x, h * 0.85, z + d/2 + 0.2, w * 0.8, 1.4, 0.3, signColorMat, ry);
}

// 4. Detailed Factory Warehouse with Asymmetrical Gable and Smokestacks
function buildIndustrialWarehouse(scene, world, R, x, z, w, h, d) {
  // Primary industrial floor space
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, crateMat);
  // Large rolling garage door segment
  createRigidMesh(scene, world, R, x + w/4, h/3, z + d/2 + 0.1, 8, h/1.5, 0.2, borderMat, 0, false);
  // Low pitch corrugated iron roof slab
  createRigidMesh(scene, world, R, x, h + 0.2, z, w + 1.0, 0.4, d + 1.0, roofMat);
  // Secondary industrial ventilation infrastructure stack pipes
  createRigidMesh(scene, world, R, x - w/3, h + 5.0, z - d/3, 1.8, 10.0, 1.8, stoneMat);
  createRigidMesh(scene, world, R, x - w/3 + 3, h + 3.0, z - d/3, 1.0, 6.0, 1.0, borderMat);
}

// 5. High-Accuracy Central Pedestal Spire Obelisk Monument
function buildCentralMonument(scene, world, R, x, z) {
  // Symmetrical tiered platform steps layers
  createRigidMesh(scene, world, R, x, 0.4, z, 36, 0.8, 36, stoneMat);
  createRigidMesh(scene, world, R, x, 1.2, z, 26, 0.8, 26, stoneMat);
  createRigidMesh(scene, world, R, x, 2.4, z, 16, 1.6, 16, stoneMat);
  
  // Pillar transition base blocks
  createRigidMesh(scene, world, R, x, 4.2, z, 6.0, 2.0, 6.0, stoneMat);
  // Main dramatic vertical spire column column
  createRigidMesh(scene, world, R, x, 12.0, z, 3.2, 14.0, 3.2, stoneMat);
  // Gold pyramidal peak cap stone block
  createRigidMesh(scene, world, R, x, 19.5, z, 2.0, 1.0, 2.0, woodMat);

  // Enclosing courtyard accent barrier fencing blocks
  const offsets = [-16.5, 16.5];
  offsets.forEach(ox => {
    offsets.forEach(oz => {
      createRigidMesh(scene, world, R, x + ox, 1.0, z + oz, 3, 2.0, 3, stoneMat);
    });
  });
}

// 6. Realistic Intricate Lattice Structural Frame Clock Tower
function buildClockTower(scene, world, R, x, z) {
  const totalH = 20;
  // Four structural corner pillars running into the sky
  createRigidMesh(scene, world, R, x - 4, totalH/2, z - 4, 0.8, totalH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x + 4, totalH/2, z - 4, 0.8, totalH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x - 4, totalH/2, z + 4, 0.8, totalH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x + 4, totalH/2, z + 4, 0.8, totalH, 0.8, borderMat);
  
  // Horizontal scaffolding structure links
  for (let h = 4; h < totalH; h += 5) {
    createRigidMesh(scene, world, R, x, h, z, 8.8, 0.4, 8.8, borderMat, 0, false);
  }

  // High altitude platform observation floor deck
  createRigidMesh(scene, world, R, x, totalH, z, 10, 0.4, 10, woodMat);
  // Heavy structural concrete clock head house cube
  createRigidMesh(scene, world, R, x, totalH + 4.5, z, 7.5, 9.0, 7.5, stoneMat);
  // Round clock dial visual representations (Dark cylinders embedded)
  const dialGeo = new THREE.CylinderGeometry(2, 2, 0.4, 8);
  dialGeo.rotateX(Math.PI / 2);
  const dialMesh = new THREE.Mesh(dialGeo, borderMat);
  dialMesh.position.set(x, totalH + 4.5, z + 3.8);
  scene.add(dialMesh);

  // Pyramidal peak cap roof tower spire
  createRigidMesh(scene, world, R, x, totalH + 9.5, z, 8.2, 1.0, 8.2, roofMat);
}

// 7. Low-Poly Structured Box Trees
function buildBoxTree(scene, world, R, x, z) {
  createRigidMesh(scene, world, R, x, 2.5, z, 0.6, 5.0, 0.6, woodMat, 0, true);
  createRigidMesh(scene, world, R, x, 6.0, z, 3.4, 2.0, 3.4, leafMat, 0, false);
  createRigidMesh(scene, world, R, x, 7.2, z, 2.2, 1.4, 2.2, leafMat, 0, false);
}

// ── MASTER WORLD LAYOUT COMPOSITION ENGINE ────────────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  const HALF_MAP = MAP_SIZE / 2;

  // 1. Concrete Tarmac Foundation Floor (Matching dark base look instead of raw green grass everywhere)
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), stoneMat); 
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const fBody = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(HALF_MAP, 0.5, HALF_MAP), fBody);

  // Clear Sky Environment Mesh Backdrop
  const skyGeo = new THREE.SphereGeometry(285, 24, 12);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x9eccfa, side: THREE.BackSide, fog: false });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // 2. High Outer Fortified Perimeter Security Bastion Walls (Borders the image scene)
  const HW = 16;
  createRigidMesh(scene, world, R, 0, HW/2, HALF_MAP, MAP_SIZE, HW, 4, borderMat, 0, false);   
  createRigidMesh(scene, world, R, 0, HW/2, -HALF_M, MAP_SIZE, HW, 4, borderMat, 0, false);  
  createRigidMesh(scene, world, R, HALF_MAP, HW/2, 0, 4, HW, MAP_SIZE, borderMat, 0, false);   
  createRigidMesh(scene, world, R, -HALF_MAP, HW/2, 0, 4, HW, MAP_SIZE, borderMat, 0, false);  

  // 3. COMPLETE STREET BOULEVARD NETWORK (WITH ROAD BORDERS)
  const rw = 24; // Wide asphalt avenues
  // Intersection core square
  const plazaMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), pathMat);
  plazaMesh.rotation.x = -Math.PI / 2; plazaMesh.position.set(0, 0.02, 0); plazaMesh.receiveShadow = true; scene.add(plazaMesh);

  // Main Avenue extensions layout
  const avenues = [
    {x: 0, z: (HALF_MAP+30)/2, w: rw, d: HALF_MAP-30},
    {x: 0, z: -(HALF_MAP+30)/2, w: rw, d: HALF_MAP-30},
    {x: (HALF_MAP+30)/2, z: 0, w: HALF_MAP-30, d: rw},
    {x: -(HALF_MAP+30)/2, z: 0, w: HALF_MAP-30, d: rw}
  ];
  avenues.forEach(av => {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(av.w, av.d), pathMat);
    road.rotation.x = -Math.PI / 2; road.position.set(av.x, 0.02, av.z); road.receiveShadow = true; scene.add(road);
    
    // Add light accent pedestrian sidewalk edge curbs bounding the asphalt lanes
    if(av.w === rw) { // Vertical avenues curbs
      createRigidMesh(scene, world, R, av.x - rw/2 - 0.4, 0.2, av.z, 0.8, 0.4, av.d, stoneMat, 0, false);
      createRigidMesh(scene, world, R, av.x + rw/2 + 0.4, 0.2, av.z, 0.8, 0.4, av.d, stoneMat, 0, false);
    } else { // Horizontal boulevard curbs
      createRigidMesh(scene, world, R, av.x, 0.2, av.z - rw/2 - 0.4, av.w, 0.4, 0.8, stoneMat, 0, false);
      createRigidMesh(scene, world, R, av.x, 0.2, av.z + rw/2 + 0.4, av.w, 0.4, 0.8, stoneMat, 0, false);
    }
  });

  // Spawn Highly Detailed Centerpiece Monument Spire
  buildCentralMonument(scene, world, R, 0, 0);

  // ── 4. NORTH-WEST QUADRANT: THE DENSE RESIDENTIAL NEIGHBORHOOD ───────────────
  // Grass park foundation overlay zone
  const nwGrass = new THREE.Mesh(new THREE.PlaneGeometry(105, 105), grassMat); nwGrass.rotation.x = -Math.PI / 2; nwGrass.position.set(-70, 0.03, 70); scene.add(nwGrass);

  // Multi-tier high rise residential block apartments sitting along the far edge
  buildApartmentComplex(scene, world, R, -75, 115, 20, 24, 20, stoneMat);
  buildApartmentComplex(scene, world, R, -110, 115, 20, 24, 20, stoneMat);

  // Two tightly packed rows of identical sloped townhouses facing inside corridors
  for (let i = 0; i < 4; i++) {
    buildRowHouse(scene, world, R, -40, 42 + (i * 16), 11, 8, 14, Math.PI / 2);
    buildRowHouse(scene, world, R, -56, 42 + (i * 16), 11, 8, 14, Math.PI / 2);
  }

  // Substation Electrical Transformer cage installation (Far back nook)
  createRigidMesh(scene, world, R, -120, 5, 75, 16, 10, 24, borderMat, 0, false);

  // ── 5. SOUTH-WEST QUADRANT: HIGH-DENSITY FREIGHT LOGISTICS INFRASTRUCTURE ───
  // Massive Industrial Logistics Warehouse Hangar
  buildIndustrialWarehouse(scene, world, R, -70, -55, 38, 12, 26);

  // Precise color-alternating multi-stacked freight container lines
  const cargoMats = [roofMat, borderMat, crateMat, woodMat];
  
  // Array Group Alpha: Long foreground grid stack lines
  for (let i = 0; i < 5; i++) {
    const cx = -115 + (i * 15);
    const cz = -115;
    const selectedTexture = cargoMats[i % cargoMats.length];
    createRigidMesh(scene, world, R, cx, 2.5, cz, 13, 5, 6, selectedTexture);
    // Standard double stack physics overlays
    createRigidMesh(scene, world, R, cx, 7.5, cz, 13, 5, 6, cargoMats[(i + 2) % cargoMats.length]);
  }

  // Array Group Beta: Flank vertical shipping container rows
  for (let j = 0; j < 3; j++) {
    createRigidMesh(scene, world, R, -122, 2.5, -45 - (j * 15), 6, 5, 13, cargoMats[j % cargoMats.length]);
    createRigidMesh(scene, world, R, -108, 2.5, -45 - (j * 15), 6, 5, 13, cargoMats[(j + 1) % cargoMats.length]);
    // Stack upper tier blocks to block view lines completely
    createRigidMesh(scene, world, R, -122, 7.5, -45 - (j * 15), 6, 5, 13, cargoMats[(j + 3) % cargoMats.length]);
  }

  // Tactical scattered wooden supply crate piles providing high cover points
  createRigidMesh(scene, world, R, -35, 1.5, -35, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -31, 1.5, -35, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -34, 4.2, -35, 2.5, 2.5, 2.5, crateMat);

  // Liquid refinery processing storage silo units (Far corner)
  createRigidMesh(scene, world, R, -125, 6, -130, 10, 12, 10, stoneMat);
  createRigidMesh(scene, world, R, -110, 5, -130, 7, 10, 7, stoneMat);

  // ── 6. TOP-RIGHT QUADRANT: MAIN STREET MARKET PLACE & HIGH SKYWAYS ─────────
  // Terracotta stone plaza brick style open walkway canvas overlay
  const retailPlaza = new THREE.Mesh(new THREE.PlaneGeometry(105, 105), woodMat); retailPlaza.rotation.x = -Math.PI / 2; retailPlaza.position.set(70, 0.03, 70); scene.add(retailPlaza);

  // Wholesale anchor anchor Department Store facility
  createRigidMesh(scene, world, R, 110, 6, 50, 34, 12, 24, roofMat);

  // Linear Main Street commercial storefront strips facing the central roadway loop
  buildCommercialShop(scene, world, R, 55, 42, 15, 8, 12, woodMat);  // Corner Cafe
  buildCommercialShop(scene, world, R, 55, 58, 15, 8, 12, borderMat); // Boutique Outlet
  buildCommercialShop(scene, world, R, 55, 74, 15, 8, 12, stoneMat);  // General Store

  // Massive flanking high-rise commercial pillars supporting rooftop skybridges
  buildApartmentComplex(scene, world, R, 38, 120, 18, 28, 18, stoneMat);  // East Support Tower
  buildApartmentComplex(scene, world, R, -38, 120, 18, 28, 18, stoneMat); // West Support Tower across street
  // Massive high-altitude structural iron overpass pedestrian transit walkway bridge
  createRigidMesh(scene, world, R, 0, 26.5, 120, 58, 0.6, 6, borderMat);

  // ── 7. SOUTH-EAST QUADRANT: CIVIL PLAZA & GRAND CLOCK BASTION ───────────────
  const seGrass = new THREE.Mesh(new THREE.PlaneGeometry(105, 105), grassMat); seGrass.rotation.x = -Math.PI / 2; seGrass.position.set(70, 0.03, -70); scene.add(seGrass);

  // Symmetrical clean white municipal structures
  createRigidMesh(scene, world, R, 65, 6, -55, 32, 12, 22, stoneMat);  // Institutional Bank Branch Office
  createRigidMesh(scene, world, R, 110, 5, -55, 24, 10, 22, woodMat);  // Corporate Administration Office

  // Landmark Framework Clock Tower Bastion Vantage Point Structure
  buildClockTower(scene, world, R, 120, -120);

  // ── 8. SYSTEMATIC HIGH-DENSITY SIDEWALK TREES ROW PLACEMENT ──────────────────
  // Neatly columns lining both sides of the avenues exactly mimicking the look from the asset packs
  const boulevardTreePlacements = [
    // Vertical North Highway Axis Sidewalk Lines
    [-15, 36], [-15, 54], [-15, 72], [-15, 90], [-15, 108], [-15, 126],
    [15, 36], [15, 54], [15, 72], [15, 90], [15, 108], [15, 126],
    // Vertical South Highway Axis Sidewalk Lines
    [-15, -36], [-15, -54], [-15, -72], [-15, -90], [-15, -108], [-15, -126],
    [15, -36], [15, -54], [15, -72], [15, -90], [15, -108], [15, -126],
    // Horizontal East Highway Axis Sidewalk Lines
    [36, 15], [54, 15], [72, 15], [90, 15], [108, 15], [126, 15],
    [36, -15], [54, -15], [72, -15], [90, -15], [108, -15], [126, -15],
    // Horizontal West Highway Axis Sidewalk Lines
    [-36, 15], [-54, 15], [-72, 15], [-90, 15], [-110, 15], [-126, 15],
    [-36, -15], [-54, -15], [-72, -15], [-90, -15], [-110, -15], [-126, -15]
  ];

  boulevardTreePlacements.forEach(([tx, tz]) => {
    buildBoxTree(scene, world, R, tx, tz);
  });
}
