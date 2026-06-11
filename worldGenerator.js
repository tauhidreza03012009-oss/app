import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── CORE ENGINE PRIMITIVES (OPTIMIZED & CASTING READY) ────────────────────────
export function addStaticWall(scene, world, R, x, y, z, w, h, d, material = borderMat, ry = 0, castShadow = true){
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

export function addPath(scene, x, z, w, d, ry = 0) {
  const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pathMat);
  pathMesh.rotation.x = -Math.PI / 2;
  pathMesh.rotation.z = ry; // Handle diagonal road cuts
  pathMesh.position.set(x, 0.02, z); 
  pathMesh.receiveShadow = true; 
  scene.add(pathMesh);
}

// ── EXACT COMPONENT GENERATORS MATCHING THE MODEL DESIGN ──────────────────────

// The Iconic Central Obelisk Column with its tiered steps and iron fences
export function addCentralMonument(scene, world, R, x, z) {
  // Dark grey base steps
  addStaticWall(scene, world, R, x, 0.3, z, 28, 0.6, 28, stoneMat);
  addStaticWall(scene, world, R, x, 0.9, z, 20, 0.6, 20, stoneMat);
  addStaticWall(scene, world, R, x, 1.8, z, 12, 1.2, 12, stoneMat);
  // Tiered pedestal column
  addStaticWall(scene, world, R, x, 4.0, z, 4, 3.2, 4, stoneMat);
  addStaticWall(scene, world, R, x, 10.0, z, 2.2, 9.0, 2.2, stoneMat); // Slim spire
  addStaticWall(scene, world, R, x, 14.8, z, 1.5, 0.6, 1.5, woodMat);  // Bronze cap
  
  // Symmetrical courtyard corner concrete/stone barriers enclosing the steps
  const offsets = [-13.5, 13.5];
  offsets.forEach(ox => {
    offsets.forEach(oz => {
      addStaticWall(scene, world, R, x + ox, 0.8, z + oz, 3.5, 1.6, 3.5, stoneMat);
    });
  });
}

// Low-poly Box-Cut Trees styled exactly like the picture
export function addStylizedTree(scene, world, R, x, z) {
  // Dark thin trunk
  addStaticWall(scene, world, R, x, 2.0, z, 0.6, 4.0, 0.6, woodMat, 0, true);
  // Symmetrical box foliage layers
  addStaticWall(scene, world, R, x, 4.8, z, 3.0, 1.8, 3.0, leafMat, 0, false);
  addStaticWall(scene, world, R, x, 5.8, z, 1.8, 1.2, 1.8, leafMat, 0, false);
}

// Detailed Residential Row Houses with slanted modular rooftops
export function addRowHouse(scene, world, R, x, z, ry = 0) {
  // Main brick/wood structural block
  addStaticWall(scene, world, R, x, 4.0, z, 9, 8, 14, woodMat, ry);
  // Slanted A-frame roof approximation using nested tiered steps to give a low-poly roof angle
  addStaticWall(scene, world, R, x, 8.3, z, 8.2, 0.6, 14.2, roofMat, ry);
  addStaticWall(scene, world, R, x, 8.9, z, 5.5, 0.6, 14.2, roofMat, ry);
  addStaticWall(scene, world, R, x, 9.5, z, 2.5, 0.6, 14.2, roofMat, ry);
}

// Modular Commercial Shops with Front Overhang Awnings
export function addCommercialShop(scene, world, R, x, z, w, d, nameMaterial) {
  // Base floor building block
  addStaticWall(scene, world, R, x, 4.5, z, w, 9, d, stoneMat);
  // Upper sign board strip layout
  addStaticWall(scene, world, R, x, 8.0, z + d/2 + 0.2, w - 1, 1.5, 0.5, nameMaterial);
  // Front display awning projection
  addStaticWall(scene, world, R, x, 6.2, z + d/2 + 0.6, w + 0.4, 0.3, 1.5, roofMat);
}

// ── MAIN LAYOUT RECONSTRUCTION BASED ON IMAGE CAMERA PERSPECTIVE ──────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  // 1. Tarmac / Concrete Ground Layer Base instead of pure grass fields
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), stoneMat); 
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const fBody = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(MAP_SIZE / 2, 0.5, MAP_SIZE / 2), fBody);

  // High fortified corner bastion outer walls
  const H_WALL = 16; const HALF_M = MAP_SIZE / 2;
  addStaticWall(scene, world, R, 0, H_WALL / 2, HALF_M, MAP_SIZE, H_WALL, 4, borderMat, 0, false);   
  addStaticWall(scene, world, R, 0, H_WALL / 2, -HALF_M, MAP_SIZE, H_WALL, 4, borderMat, 0, false);  
  addStaticWall(scene, world, R, HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE, borderMat, 0, false);   
  addStaticWall(scene, world, R, -HALF_M, H_WALL / 2, 0, 4, H_WALL, MAP_SIZE, borderMat, 0, false);  

  // 2. MAIN ASPHALT BOULEVARDS WITH WHITE LINE TRIM BORDERS
  addPath(scene, 0, 0, 50, 50);        // Square Intersection Plaza
  addPath(scene, 0, 95, 20, 140);     // Central Boulevard (Top background track)
  addPath(scene, 0, -95, 20, 140);    // Foreground Main Entry Road
  addPath(scene, 95, 0, 140, 20);     // Right Boulevard Wing
  addPath(scene, -95, 0, 140, 20);    // Left Boulevard Wing

  // Spawn Center Monument Spire Obelisk
  addCentralMonument(scene, world, R, 0, 0);

  // 3. THE INDUSTRIAL SHIPPING HUB (BOTTOM-LEFT DISTRICT)
  // Dark factory flooring slab
  addPath(scene, -85, -85, 110, 110);
  
  // Asymmetrical Factory Gabled Hangar
  addStaticWall(scene, world, R, -65, 7, -55, 38, 14, 26, crateMat);
  addStaticWall(scene, world, R, -65, 14.5, -55, 36, 1, 24, roofMat); // Flat corrugated rooftop roof layer

  // Perfectly colored parallel container shipping blocks (Blue, Red, Yellow lines)
  // Stack group 1 (Foreground horizontal containers)
  const colors = [borderMat, roofMat, crateMat, woodMat];
  for(let i = 0; i < 6; i++) {
    addStaticWall(scene, world, R, -125 + (i * 14), 3, -115, 12, 6, 6, colors[i % colors.length]);
    if(i % 2 === 0) { // Stack secondary upper tier layer block columns
      addStaticWall(scene, world, R, -125 + (i * 14), 9, -115, 12, 6, 6, colors[(i + i) % colors.length]);
    }
  }
  // Stack group 2 (Left side vertical container bays)
  for(let j = 0; j < 3; j++) {
    addStaticWall(scene, world, R, -125, 3, -45 - (j * 15), 6, 6, 12, colors[j % colors.length]);
    addStaticWall(scene, world, R, -110, 3, -45 - (j * 15), 6, 6, 12, colors[(j+1) % colors.length]);
  }

  // Scattered supply wooden crates
  addStaticWall(scene, world, R, -35, 2, -35, 4, 4, 4, woodMat);
  addStaticWall(scene, world, R, -31, 1.5, -35, 3, 3, 3, woodMat);

  // Heavy liquid pipeline tanks infrastructure (Far bottom-left nook)
  addStaticWall(scene, world, R, -125, 6, -130, 8, 12, 8, stoneMat);
  addStaticWall(scene, world, R, -112, 5, -130, 6, 10, 6, stoneMat);

  // 4. THE SUBURBAN TOWNHOUSE / APARTMENT COMPLEX BLOCK (TOP-LEFT DISTRICT)
  // Row of identical brown/red sloped houses facing the boulevard
  for(let i = 0; i < 4; i++) {
    addRowHouse(scene, world, R, -38, 40 + (i * 16), Math.PI / 2);
  }
  // Massive multi-story concrete rental high-rises blocking the back edge
  addStaticWall(scene, world, R, -85, 11, 55, 18, 22, 32, stoneMat);
  addStaticWall(scene, world, R, -120, 11, 55, 18, 22, 32, stoneMat);

  // Power grid transformer station scaffolding enclosure (Far top-left)
  addStaticWall(scene, world, R, -110, 8, 120, 24, 16, 12, borderMat, 0, false);

  // 5. THE COMMERCIAL MARKET AVENUE & SKYBRIDGE COMPLEX (TOP-RIGHT DISTRICT)
  // Terracotta tile colored open courtyard sidewalk plaza area
  addPath(scene, 75, 75, 90, 90); 

  // Large Department Store anchor block structure
  addStaticWall(scene, world, R, 110, 7, 50, 34, 14, 26, roofMat);
  
  // Custom styled storefront strips lined side-by-side facing west onto the road
  addCommercialShop(scene, world, R, 55, 45, 15, 12, woodMat);  // The Market Cafe
  addCommercialShop(scene, world, R, 55, 62, 15, 12, borderMat); // Boutique Outlet Store
  
  // Parallel tall downtown commercial offices enabling the high overpass skybridge
  addStaticWall(scene, world, R, 32, 130, 15, 26, 15, stoneMat);  // East block pillar
  addStaticWall(scene, world, R, -32, 130, 15, 26, 15, stoneMat); // West block cross-axis pillar
  // Industrial steel/stone walkway bridging the high rise roofs completely over the highway
  addStaticWall(scene, world, R, 0, 23, 130, 52, 0.4, 5, borderMat);

  // 6. CIVIC BANK PLAZA & HISTORIC CLOCK TOWER BASE (BOTTOM-RIGHT DISTRICT)
  // Clean white marble style architecture blocks
  addStaticWall(scene, world, R, 65, 6, -55, 32, 12, 22, stoneMat); // Institutional Bank Branch
  addStaticWall(scene, world, R, 115, 5, -55, 24, 10, 22, woodMat);  // Records Office Annex

  // The Vintage Open Skeleton Framework Structural Clock Tower (Bottom Right Corner)
  const cx = 120; const cz = -120;
  addStaticWall(scene, world, R, cx - 3, 8, cz - 3, 0.5, 16, 0.5, borderMat);
  addStaticWall(scene, world, R, cx + 3, 8, cz - 3, 0.5, 16, 0.5, borderMat);
  addStaticWall(scene, world, R, cx - 3, 8, cz + 3, 0.5, 16, 0.5, borderMat);
  addStaticWall(scene, world, R, cx + 3, 8, cz + 3, 0.5, 16, 0.5, borderMat);
  // Upper Deck platform staging square
  addStaticWall(scene, world, R, cx, 16, cz, 8, 0.4, 8, woodMat);
  // Heavy solid clock housing frame cube sitting right on top
  addStaticWall(scene, world, R, cx, 20, cz, 6.5, 8, 6.5, stoneMat);

  // 7. SYMMETRICAL PERIMETER ALIGNED BOULEVARD SIDEWALK TREES
  // Spawns the clean, boxy, low-poly tree arrays framing the roadways exactly like the picture lines
  const linearTreePositions = [
    // Left & Right borders of North Avenue
    [-13, 35], [-13, 55], [-13, 75], [-13, 95], [-13, 115],
    [13, 35], [13, 55], [13, 75], [13, 95], [13, 115],
    // Left & Right borders of South Avenue
    [-13, -35], [-13, -55], [-13, -75], [-13, -95], [-13, -115],
    [13, -35], [13, -55], [13, -75], [13, -95], [13, -115],
    // Upper & Lower borders of East Boulevard
    [35, 13], [55, 13], [75, 13], [95, 13], [115, 13],
    [35, -13], [55, -13], [75, -13], [95, -13], [115, -13],
    // Upper & Lower borders of West Boulevard
    [-35, 13], [-55, 13], [-75, 13], [-95, 13], [-115, 13],
    [-35, -13], [-55, -13], [-75, -13], [-95, -13], [-115, -13]
  ];

  linearTreePositions.forEach(([xCoord, zCoord]) => {
    addStylizedTree(scene, world, R, xCoord, zCoord);
  });
}
