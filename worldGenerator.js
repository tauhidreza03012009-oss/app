import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── SYSTEM COLLIDER & MESH UTILITY ───────────────────────────────────────────
function createRigidPrimitive(scene, world, R, x, y, z, w, h, d, material, ry = 0, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const q = new THREE.Quaternion().setFromEuler(mesh.rotation);
  const rb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z).setRotation({x: q.x, y: q.y, z: q.z, w: q.w}));
  world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2, d / 2), rb);
  return mesh;
}

// ── CUSTOM BUILDING ELEMENT BUILDERS ─────────────────────────────────────────

// Multi-story Apartment Blocks with structural window indents/frames
function buildApartmentBlock(scene, world, R, x, z, w, h, d, stories = 4) {
  // Main building body
  createRigidPrimitive(scene, world, R, x, h/2, z, w, h, d, stoneMat);
  // Tiered top roof trim edge
  createRigidPrimitive(scene, world, R, x, h + 0.15, z, w + 0.6, 0.3, d + 0.6, roofMat);

  // Structural details: Add decorative low-poly window rows along the long face
  const storyHeight = h / stories;
  for (let i = 0; i < stories; i++) {
    const windowY = (storyHeight * i) + (storyHeight / 2);
    // Left and right window blocks to simulate real façade depth
    createRigidPrimitive(scene, world, R, x - w/4, windowY, z + d/2 + 0.1, 1.8, 1.2, 0.2, woodMat, 0, false);
    createRigidPrimitive(scene, world, R, x + w/4, windowY, z + d/2 + 0.1, 1.8, 1.2, 0.2, woodMat, 0, false);
  }
}

// Slanted Roof Townhouses
function buildTownhouse(scene, world, R, x, z, w, h, d, ry = 0) {
  // Main frame body
  createRigidPrimitive(scene, world, R, x, h/2, z, w, h, d, woodMat, ry);
  
  // Create an accurate geometric sloped roof structure using stacked box tiers
  const roofLayers = 4;
  for (let i = 0; i < roofLayers; i++) {
    const layerH = 0.5;
    const progress = i / roofLayers;
    const layerW = w * (1.0 - progress);
    const layerY = h + (i * layerH) + (layerH / 2);
    createRigidPrimitive(scene, world, R, x, layerY, z, layerW, layerH, d + 0.2, roofMat, ry);
  }
}

// Commercial Retail Outlets with awnings and storefront signs
function buildStoreFront(scene, world, R, x, z, w, h, d, signTextMaterial) {
  // Shop foundation structure
  createRigidPrimitive(scene, world, R, x, h/2, z, w, h, d, stoneMat);
  // Projecting canopy awning
  createRigidPrimitive(scene, world, R, x, h * 0.65, z + d/2 + 0.4, w + 0.4, 0.2, 1.2, roofMat);
  // Store sign banner block
  createRigidPrimitive(scene, world, R, x, h * 0.85, z + d/2 + 0.1, w * 0.8, 1.2, 0.2, signTextMaterial);
}

// Complex Industrial Factory Hangar
function buildFactoryWarehouse(scene, world, R, x, z, w, h, d) {
  // Central warehouse floor frame
  createRigidPrimitive(scene, world, R, x, h/2, z, w, h, d, crateMat);
  // Segmented corrugated roof layout
  createRigidPrimitive(scene, world, R, x, h + 0.2, z, w + 0.8, 0.4, d + 0.8, roofMat);
  // Back utility ventilation smokestack
  createRigidPrimitive(scene, world, R, x - w/3, h + 4.0, z - d/3, 1.5, 8.0, 1.5, stoneMat);
}

// The Multi-Tier Central Monument Base & Spire Obelisk
function buildGrandObelisk(scene, world, R, x, z) {
  // Tiered architectural base steps
  createRigidPrimitive(scene, world, R, x, 0.3, z, 32, 0.6, 32, stoneMat);
  createRigidPrimitive(scene, world, R, x, 0.9, z, 24, 0.6, 24, stoneMat);
  createRigidPrimitive(scene, world, R, x, 1.8, z, 14, 1.2, 14, stoneMat);
  
  // Elegant column transition tiers
  createRigidPrimitive(scene, world, R, x, 4.0, z, 4.5, 3.2, 4.5, stoneMat);
  createRigidPrimitive(scene, world, R, x, 10.5, z, 2.4, 9.8, 2.4, stoneMat); // Tall slim obelisk body
  createRigidPrimitive(scene, world, R, x, 15.7, z, 1.6, 0.6, 1.6, woodMat);  // Pyramid capstone
  
  // Courtyard corner perimeter fencing stone blocks
  const innerOffsets = [-15, 15];
  innerOffsets.forEach(ox => {
    innerOffsets.forEach(oz => {
      createRigidPrimitive(scene, world, R, x + ox, 0.8, z + oz, 4, 1.6, 4, stoneMat);
    });
  });
}

// Skeleton Framework Clock Tower Bastion
function buildClockTower(scene, world, R, x, z) {
  const pillarH = 18;
  // Four individual corner frame pillars
  createRigidPrimitive(scene, world, R, x - 3.5, pillarH/2, z - 3.5, 0.6, pillarH, 0.6, borderMat);
  createRigidPrimitive(scene, world, R, x + 3.5, pillarH/2, z - 3.5, 0.6, pillarH, 0.6, borderMat);
  createRigidPrimitive(scene, world, R, x - 3.5, pillarH/2, z + 3.5, 0.6, pillarH, 0.6, borderMat);
  createRigidPrimitive(scene, world, R, x + 3.5, pillarH/2, z + 3.5, 0.6, pillarH, 0.6, borderMat);
  
  // Upper observation floor platform
  createRigidPrimitive(scene, world, R, x, pillarH, z, 8.5, 0.4, 8.5, woodMat);
  // Solid clock housing header frame sitting on top
  createRigidPrimitive(scene, world, R, x, pillarH + 4.0, z, 6.5, 8.0, 6.5, stoneMat);
  // Pyramidal peak cap roof
  createRigidPrimitive(scene, world, R, x, pillarH + 8.3, z, 7.0, 0.6, 7.0, roofMat);
}

// Low-Poly Box Trees
function buildBoxTree(scene, world, R, x, z) {
  createRigidPrimitive(scene, world, R, x, 2.2, z, 0.6, 4.4, 0.6, woodMat, 0, true);
  createRigidPrimitive(scene, world, R, x, 5.2, z, 3.2, 1.8, 3.2, leafMat, 0, false);
  createRigidPrimitive(scene, world, R, x, 6.2, z, 2.0, 1.2, 2.0, leafMat, 0, false);
}

// Flat Road Surface Overlay with Crosswalk Visual Markers
function buildAsphaltAvenue(scene, x, z, w, d, isCrosswalk = false) {
  const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pathMat);
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.position.set(x, 0.02, z);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  if (isCrosswalk) {
    // Add distinct light-grey accent strips around intersection junctions
    const accentMesh = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.4, 1.2), stoneMat);
    accentMesh.rotation.x = -Math.PI / 2;
    accentMesh.position.set(x, 0.03, z);
    scene.add(accentMesh);
  }
}

// ── WORLD LEVEL BUILD ENGINE ────────────────────────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  // Set explicit map proportions to accurately translate the reference composition scale
  const HALF_MAP = MAP_SIZE / 2;

  // 1. Foundation Grass Ground Plane
  const grassBase = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), grassMat);
  grassBase.rotation.x = -Math.PI / 2;
  grassBase.receiveShadow = true;
  scene.add(grassBase);

  const baseBody = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(HALF_MAP, 0.5, HALF_MAP), baseBody);

  // 2. High Outer Security Perimeter Bastion Walls
  const WALL_H = 15;
  createRigidPrimitive(scene, world, R, 0, WALL_H/2, HALF_MAP, MAP_SIZE, WALL_H, 4, borderMat, 0, false);
  createRigidPrimitive(scene, world, R, 0, WALL_H/2, -HALF_MAP, MAP_SIZE, WALL_H, 4, borderMat, 0, false);
  createRigidPrimitive(scene, world, R, HALF_MAP, WALL_H/2, 0, 4, WALL_H, MAP_SIZE, borderMat, 0, false);
  createRigidPrimitive(scene, world, R, -HALF_MAP, WALL_H/2, 0, 4, WALL_H, MAP_SIZE, borderMat, 0, false);

  // Clear Sky Environment Dome
  const skyGeo = new THREE.SphereGeometry(285, 24, 12);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0xa6d2ff, side: THREE.BackSide, fog: false });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // ── 3. ROAD NETWORK CORE ───────────────────────────────────────────────────
  const roadWidth = 22;
  buildAsphaltAvenue(scene, 0, 0, 56, 56); // Central intersection plaza loop
  // Four central axes dividing the town layout cleanly
  buildAsphaltAvenue(scene, 0, HALF_MAP - 35, roadWidth, HALF_MAP - 28);
  buildAsphaltAvenue(scene, 0, -(HALF_MAP - 35), roadWidth, HALF_MAP - 28);
  buildAsphaltAvenue(scene, HALF_MAP - 35, 0, HALF_MAP - 28, roadWidth);
  buildAsphaltAvenue(scene, -(HALF_MAP - 35), 0, HALF_MAP - 28, roadWidth);

  // Add distinct white strip street crosswalk decorations at junctions
  buildAsphaltAvenue(scene, 0, 28, roadWidth, 2, true);
  buildAsphaltAvenue(scene, 0, -28, roadWidth, 2, true);
  buildAsphaltAvenue(scene, 28, 0, 2, roadWidth, true);
  buildAsphaltAvenue(scene, -28, 0, 2, roadWidth, true);

  // Spawns the central architectural monument spire
  buildGrandObelisk(scene, world, R, 0, 0);

  // ── 4. NORTH-WEST SECTOR: SUBURBAN ESTATE & INFRASTRUCTURE ──────────────────
  // Dense multi-story high rise apartments flanking the back wall
  buildApartmentBlock(scene, world, R, -85, 105, 16, 22, 28, 4);
  buildApartmentBlock(scene, world, R, -115, 105, 16, 22, 28, 4);
  
  // Aligned row house residential strip with sloped geometric roofing layers
  for (let i = 0; i < 4; i++) {
    buildTownhouse(scene, world, R, -42, 45 + (i * 15), 10, 8, 13, Math.PI / 2);
    buildTownhouse(scene, world, R, -56, 45 + (i * 15), 10, 8, 13, Math.PI / 2);
  }

  // Electrical Power Transformer station cage (Far top-left nook)
  createRigidPrimitive(scene, world, R, -115, 6, 135, 24, 12, 14, borderMat, 0, false);

  // ── 5. SOUTH-WEST SECTOR: LOGISTICS & INDUSTRIAL REGION ─────────────────────
  // Custom dark asphalt foundation pad for the warehouse district
  const industrialPad = new THREE.Mesh(new THREE.PlaneGeometry(105, 105), stoneMat);
  industrialPad.rotation.x = -Math.PI / 2;
  industrialPad.position.set(-72, 0.03, -72);
  scene.add(industrialPad);

  // Industrial gabled warehouse hanger structure
  buildFactoryWarehouse(scene, world, R, -65, -55, 34, 11, 24);

  // Accurate multi-colored multi-stacked logistical shipping container yard layout
  const containerMaterials = [roofMat, borderMat, crateMat, woodMat];
  
  // Row 1: Foreground long stack line
  for (let i = 0; i < 5; i++) {
    const cx = -115 + (i * 15);
    const cz = -110;
    const matSelection = containerMaterials[i % containerMaterials.length];
    createRigidPrimitive(scene, world, R, cx, 2.5, cz, 13, 5, 6, matSelection);
    if (i % 2 === 0) { // Double stacked upper block row layer
      createRigidPrimitive(scene, world, R, cx, 7.5, cz, 13, 5, 6, containerMaterials[(i + 1) % containerMaterials.length]);
    }
  }

  // Row 2: Deep side flank container stacks
  for (let j = 0; j < 3; j++) {
    createRigidPrimitive(scene, world, R, -120, 2.5, -45 - (j * 14), 6, 5, 12, containerMaterials[j % containerMaterials.length]);
    createRigidPrimitive(scene, world, R, -108, 2.5, -45 - (j * 14), 6, 5, 12, containerMaterials[(j + 2) % containerMaterials.length]);
  }

  // Scattered supply wooden crates for tactical navigation cover
  createRigidPrimitive(scene, world, R, -35, 1.5, -35, 3, 3, 3, woodMat);
  createRigidPrimitive(scene, world, R, -31, 1.5, -35, 3, 3, 3, woodMat);
  createRigidPrimitive(scene, world, R, -34, 4.0, -35, 2.5, 2.5, 2.5, crateMat);

  // Liquid processing storage tank array (Far bottom-left corner)
  createRigidPrimitive(scene, world, R, -125, 5, -130, 8, 10, 8, stoneMat);
  createRigidPrimitive(scene, world, R, -112, 4, -130, 6, 8, 6, stoneMat);

  // ── 6. TOP-RIGHT SECTOR: DOWNTOWN COMMERCIAL MARKET BLOCK ────────────────────
  // Open terracotta brick styled retail pedestrian walkway plaza canvas
  const commercialPlaza = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), woodMat);
  commercialPlaza.rotation.x = -Math.PI / 2;
  commercialPlaza.position.set(75, 0.03, 75);
  scene.add(commercialPlaza);

  // Anchor Wholesale Department Store structure
  createRigidPrimitive(scene, world, R, 110, 6, 50, 32, 12, 22, roofMat);

  // Individual high fidelity commercial storefront strips facing roads
  buildStoreFront(scene, world, R, 52, 45, 14, 8, 12, woodMat);  // Corner Cafe Bodega
  buildStoreFront(scene, world, R, 52, 60, 14, 8, 12, borderMat); // Boutique Apparel Store
  buildStoreFront(scene, world, R, 52, 75, 14, 8, 12, stoneMat);  // Grocery Market

  // Flanking downtown high-rise commercial office towers with high skyway overpass bridge
  createRigidPrimitive(scene, world, R, 34, 14, 120, 16, 28, 16, stoneMat);  // East anchor tower
  createRigidPrimitive(scene, world, R, -34, 14, 120, 16, 28, 16, stoneMat); // West anchor tower across street
  // High-altitude structural steel transit walkway bridge linking the roofs securely
  createRigidPrimitive(scene, world, R, 0, 26.5, 120, 52, 0.5, 6, borderMat);

  // ── 7. SOUTH-EAST SECTOR: CIVIL BANK PLAZA & HISTORIC CLOCK TOWER ───────────
  // Symmetrical clean marble-style institutional structures
  createRigidPrimitive(scene, world, R, 65, 6, -55, 30, 12, 20, stoneMat);  // Central Bank branch office
  createRigidPrimitive(scene, world, R, 110, 5, -55, 22, 10, 20, woodMat);  // Records Office Annex

  // The Vintage Open Skeleton Framework Clock Tower Bastion (Vantage Point)
  buildClockTower(scene, world, R, 125, -125);

  // ── 8. PERIMETER SIDEWALK TREE ARRAY AUTOMATION ────────────────────────────
  // Neat, uniform linear tree columns running exactly parallel along all internal sidewalks 
  const avenueTreeCoordinates = [
    // North Main Axis Boulevard Lines
    [-14, 38], [-14, 58], [-14, 78], [-14, 98], [-14, 118],
    [14, 38], [14, 58], [14, 78], [14, 98], [14, 118],
    // South Main Axis Boulevard Lines
    [-14, -38], [-14, -58], [-14, -78], [-14, -98], [-14, -118],
    [14, -38], [14, -58], [14, -78], [14, -98], [14, -118],
    // East Main Axis Boulevard Lines
    [38, 14], [58, 14], [78, 14], [98, 14], [118, 14],
    [38, -14], [58, -14], [78, -14], [98, -14], [118, -14],
    // West Main Axis Boulevard Lines
    [-38, 14], [-58, 14], [-78, 14], [-98, 14], [-118, 14],
    [-38, -14], [-58, -14], [-78, -14], [-98, -14], [-118, -14]
  ];

  avenueTreeCoordinates.forEach(([xCoord, zCoord]) => {
    buildBoxTree(scene, world, R, xCoord, zCoord);
  });
}
