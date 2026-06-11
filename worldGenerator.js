import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

export const activeLaunchPads = [];

export function buildJumper(scene, world, R, x, y, z, targetX, targetY, targetZ, duration = 1.0) {
  const w = 6, d = 6, h = 0.2; // Slightly enlarged target pad size for open distance landings
  
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), borderMat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const rb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z));
  world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setSensor(true), rb);

  const dx = targetX - x;
  const dz = targetZ - z;
  
  const velocityX = dx / duration;
  const velocityZ = dz / duration;
  const velocityY = ((targetY - y) / duration) + (14 * duration);

  activeLaunchPads.push({
    x, y, z, w, d, duration,
    force: { x: velocityX, y: velocityY, z: velocityZ }
  });
  
  return mesh;
}

function createRigidMesh(scene, world, R, x, y, z, w, h, d, material, rx = 0, ry = 0, rz = 0, castShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const q = new THREE.Quaternion().setFromEuler(mesh.rotation);
  const rb = world.createRigidBody(
    R.RigidBodyDesc.fixed()
      .setTranslation(x, y, z)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
  );
  world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2, d / 2), rb);
  return mesh;
}

function buildExplorableApartment(scene, world, R, x, z, w, floorH, d, floors) {
  const wallThick = 0.5; 
  const rampW = 4.0;     

  for (let i = 0; i < floors; i++) {
    const yBase = i * floorH;
    if (i === 0) {
      createRigidMesh(scene, world, R, x, yBase + 0.1, z, w, 0.2, d, stoneMat);
    } else {
      createRigidMesh(scene, world, R, x - rampW / 2, yBase + 0.1, z, w - rampW, 0.2, d, stoneMat);
      createRigidMesh(scene, world, R, x + (w - rampW) / 2, yBase + 0.1, z + d / 3, rampW, 0.2, d / 3, stoneMat);
      createRigidMesh(scene, world, R, x + (w - rampW) / 2, yBase + 0.1, z - d / 3, rampW, 0.2, d / 3, stoneMat);
    }

    createRigidMesh(scene, world, R, x, yBase + floorH / 2, z - d / 2 + wallThick / 2, w, floorH, wallThick, stoneMat); 
    createRigidMesh(scene, world, R, x - w / 2 + wallThick / 2, yBase + floorH / 2, z, wallThick, floorH, d - wallThick * 2, stoneMat); 
    createRigidMesh(scene, world, R, x + w / 2 - wallThick / 2, yBase + floorH / 2, z, wallThick, floorH, d - wallThick * 2, stoneMat); 

    const pillarW = 2.5;
    createRigidMesh(scene, world, R, x - w / 2 + pillarW / 2, yBase + floorH / 2, z + d / 2 - wallThick / 2, pillarW, floorH, wallThick, borderMat);
    createRigidMesh(scene, world, R, x + w / 2 - pillarW / 2, yBase + floorH / 2, z + d / 2 - wallThick / 2, pillarW, floorH, wallThick, borderMat);
    createRigidMesh(scene, world, R, x, yBase + floorH / 2, z + d / 2 - wallThick / 2, pillarW, floorH, wallThick, borderMat);

    const windowW = w / 2 - pillarW;
    createRigidMesh(scene, world, R, x - w / 4, yBase + floorH - 0.6, z + d / 2 - wallThick / 2, windowW, 1.2, wallThick, borderMat);
    createRigidMesh(scene, world, R, x + w / 4, yBase + floorH - 0.6, z + d / 2 - wallThick / 2, windowW, 1.2, wallThick, borderMat);

    if (i > 0) {
      createRigidMesh(scene, world, R, x - w / 4, yBase + 0.6, z + d / 2 - wallThick / 2, windowW, 1.2, wallThick, borderMat);
      createRigidMesh(scene, world, R, x + w / 4, yBase + 0.6, z + d / 2 - wallThick / 2, windowW, 1.2, wallThick, borderMat);
    } 

    if (i < floors - 1) {
      const rampRun = d - 2.0; 
      const rampLength = Math.sqrt(rampRun * rampRun + floorH * floorH);
      const rampAngle = Math.atan2(floorH, rampRun); 
      createRigidMesh(scene, world, R, x + w / 2 - wallThick - rampW / 2, yBase + floorH / 2, z, rampW, 0.15, rampLength, woodMat, rampAngle, 0, 0);
    }
  }
  createRigidMesh(scene, world, R, x, floors * floorH + 0.1, z, w + 0.8, 0.2, d + 0.8, roofMat);
}

function buildExplorableShop(scene, world, R, x, z, w, h, d, signMat) {
  const wallThick = 0.5;
  createRigidMesh(scene, world, R, x, 0.1, z, w, 0.2, d, stoneMat);
  createRigidMesh(scene, world, R, x, h + 0.1, z, w + 0.6, 0.2, d + 0.6, roofMat);
  createRigidMesh(scene, world, R, x, h / 2, z - d / 2 + wallThick / 2, w, h, wallThick, stoneMat); 
  createRigidMesh(scene, world, R, x - w / 2 + wallThick / 2, h / 2, z, wallThick, h, d - wallThick * 2, stoneMat); 
  createRigidMesh(scene, world, R, x + w / 2 - wallThick / 2, h / 2, z, wallThick, h, d - wallThick * 2, stoneMat); 

  const pillarW = 2.0;
  createRigidMesh(scene, world, R, x - w / 2 + pillarW / 2, h / 2, z + d / 2 - wallThick / 2, pillarW, h, wallThick, borderMat);
  createRigidMesh(scene, world, R, x + w / 2 + pillarW / 2, h / 2, z + d / 2 - wallThick / 2, pillarW, h, wallThick, borderMat);
  createRigidMesh(scene, world, R, x, h - 0.6, z + d / 2 - wallThick / 2, w - pillarW * 2, 1.2, wallThick, borderMat); 
  createRigidMesh(scene, world, R, x, h * 0.75, z + d / 2 + 0.3, w + 0.2, 0.2, 0.8, roofMat);
  createRigidMesh(scene, world, R, x, h * 0.9, z + d / 2 + 0.05, w * 0.85, 0.8, 0.1, signMat);
}

function buildPropTree(scene, world, R, x, z) {
  createRigidMesh(scene, world, R, x, 2.5, z, 0.6, 5.0, 0.6, woodMat, 0, 0, 0, true);
  createRigidMesh(scene, world, R, x, 5.8, z, 3.4, 2.2, 3.4, leafMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, x, 7.1, z, 2.2, 1.4, 2.2, leafMat, 0, 0, 0, false);
}

function buildStreetLight(scene, world, R, x, z, ry = 0) {
  createRigidMesh(scene, world, R, x, 4.0, z, 0.2, 8.0, 0.2, borderMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, x + Math.sin(ry) * 1.0, 8.0, z + Math.cos(ry) * 1.0, 1.6, 0.2, 0.3, borderMat, 0, ry, 0, false);
  createRigidMesh(scene, world, R, x + Math.sin(ry) * 1.6, 7.8, z + Math.cos(ry) * 1.6, 0.5, 0.2, 0.5, stoneMat, 0, ry, 0, false);
}

// ── WORLD BUILD EXECUTION ───────────────────────────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  const HALF_MAP = MAP_SIZE / 2; // 400
  const avW = 28; // Slightly widened highways for visual scale

  const baseFloor = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), stoneMat);
  baseFloor.rotation.x = -Math.PI / 2; baseFloor.receiveShadow = true; scene.add(baseFloor);
  const floorRB = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(HALF_MAP, 0.5, HALF_MAP), floorRB);

  const skyGeo = new THREE.SphereGeometry(695, 32, 16); // scaled skybox up
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x9eccfa, side: THREE.BackSide });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  const WH = 28; // Taller border security walls
  createRigidMesh(scene, world, R, 0, WH / 2, HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, 0, WH / 2, -HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, HALF_MAP, WH / 2, 0, 4, WH, MAP_SIZE, borderMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, -HALF_MAP, WH / 2, 0, 4, WH, MAP_SIZE, borderMat, 0, 0, 0, false);

  const plazaPlat = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), pathMat); // Enlarge center block
  plazaPlat.rotation.x = -Math.PI / 2; plazaPlat.position.set(0, 0.02, 0); plazaPlat.receiveShadow = true; scene.add(plazaPlat);

  // Four main highway arterials extending into the expanded map boundaries
  const roads = [
    { x: 0, z: (HALF_MAP + 60) / 2, w: avW, d: HALF_MAP - 60 },
    { x: 0, z: -(HALF_MAP + 60) / 2, w: avW, d: HALF_MAP - 60 },
    { x: (HALF_MAP + 60) / 2, z: 0, w: HALF_MAP - 60, d: avW },
    { x: -(HALF_MAP + 60) / 2, z: 0, w: HALF_MAP - 60, d: avW }
  ];

  roads.forEach(r => {
    const track = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), pathMat);
    track.rotation.x = -Math.PI / 2; track.position.set(r.x, 0.02, r.z); track.receiveShadow = true; scene.add(track);
    if (r.w === avW) {
      createRigidMesh(scene, world, R, r.x - avW / 2 - 0.5, 0.2, r.z, 1.0, 0.4, r.d, stoneMat, 0, 0, 0, false);
      createRigidMesh(scene, world, R, r.x + avW / 2 + 0.5, 0.2, r.z, 1.0, 0.4, r.d, stoneMat, 0, 0, 0, false);
    } else {
      createRigidMesh(scene, world, R, r.x, 0.2, r.z - avW / 2 - 0.5, r.w, 0.4, 1.0, stoneMat, 0, 0, 0, false);
      createRigidMesh(scene, world, R, r.x, 0.2, r.z + avW / 2 + 0.5, r.w, 0.4, 1.0, stoneMat, 0, 0, 0, false);
    }
  });

  // Center Plaza Tower (Enlarged and scaled higher)
  createRigidMesh(scene, world, R, 0, 0.4, 0, 60, 0.8, 60, stoneMat);
  createRigidMesh(scene, world, R, 0, 1.2, 0, 48, 0.8, 48, stoneMat);
  createRigidMesh(scene, world, R, 0, 3.4, 0, 36, 3.6, 36, stoneMat);
  createRigidMesh(scene, world, R, 0, 7.4, 0, 24, 4.4, 24, stoneMat);
  createRigidMesh(scene, world, R, 0, 24.5, 0, 6.8, 30.0, 6.8, stoneMat);
  createRigidMesh(scene, world, R, 0, 40.0, 0, 3.4, 2.0, 3.4, woodMat);

  // ── QUADRANT 1: HOLLOW RESIDENTIAL MODULES (NORTH-WEST) - Spaced Out
  const nwGrass = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), grassMat); nwGrass.rotation.x = -Math.PI / 2; nwGrass.position.set(-160, 0.03, 160); scene.add(nwGrass);

  buildExplorableApartment(scene, world, R, -140, 220, 28, 6.0, 24, 5); // Raised to 5 floors, height ~30
  buildExplorableApartment(scene, world, R, -200, 220, 28, 6.0, 24, 5); 

  createRigidMesh(scene, world, R, -80, 4.5, 120, 12, 9, 14, woodMat, 0, Math.PI / 2, 0);
  createRigidMesh(scene, world, R, -80, 4.5, 150, 12, 9, 14, woodMat, 0, Math.PI / 2, 0);
  createRigidMesh(scene, world, R, -80, 4.5, 180, 12, 9, 14, woodMat, 0, Math.PI / 2, 0);

  createRigidMesh(scene, world, R, -220, 4, 140, 26, 8, 32, borderMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, -220, 5, 142, 8, 10, 8, stoneMat);

  // ── QUADRANT 2: CARGO GRID INDUSTRIAL FREIGHT YARD (SOUTH-WEST) - Spaced Out
  const swTarmac = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), stoneMat); swTarmac.rotation.x = -Math.PI / 2; swTarmac.position.set(-160, 0.03, -160); scene.add(swTarmac);

  createRigidMesh(scene, world, R, -150, 8, -140, 60, 16, 40, crateMat); // Giant central warehouse
  createRigidMesh(scene, world, R, -150, 16.3, -140, 64, 0.6, 44, roofMat);

  createRigidMesh(scene, world, R, -240, 4, -220, 20, 8, 12, roofMat);
  createRigidMesh(scene, world, R, -240, 12, -220, 20, 8, 12, crateMat);
  createRigidMesh(scene, world, R, -200, 4, -220, 20, 8, 12, borderMat);

  // ── QUADRANT 3: DOWNTOWN COMMERCE SHOPS PLAZA (TOP-RIGHT) - Expanded
  const nePlaza = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), woodMat); nePlaza.rotation.x = -Math.PI / 2; nePlaza.position.set(160, 0.03, 160); scene.add(nePlaza);

  createRigidMesh(scene, world, R, 220, 10, 140, 50, 20, 36, roofMat); // Department store

  buildExplorableShop(scene, world, R, 110, 110, 20, 10, 16, woodMat); 
  buildExplorableShop(scene, world, R, 110, 140, 20, 10, 16, borderMat);
  buildExplorableShop(scene, world, R, 110, 170, 20, 10, 16, stoneMat);

  createRigidMesh(scene, world, R, 140, 25, 260, 30, 50, 30, stoneMat); // Giant Twin Complex towers
  createRigidMesh(scene, world, R, -140, 25, 260, 30, 50, 30, stoneMat); // Height 50!

  // ── QUADRANT 4: CIVIC PARK & NEW HIGH-RISE BANK DISTRICT (SOUTH-EAST) - Massive Additions
  const seGrass = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), grassMat); seGrass.rotation.x = -Math.PI / 2; seGrass.position.set(160, 0.03, -160); scene.add(seGrass);

  createRigidMesh(scene, world, R, 150, 8, -130, 44, 16, 34, stoneMat); 
  createRigidMesh(scene, world, R, 150, 17.5, -110, 44, 3.0, 6, roofMat);

  const ctH = 40; // Spire Temple scaled from 24 up to 40!
  createRigidMesh(scene, world, R, 240, ctH / 2, -240, 2.0, ctH, 2.0, borderMat);
  createRigidMesh(scene, world, R, 260, ctH / 2, -240, 2.0, ctH, 2.0, borderMat);
  createRigidMesh(scene, world, R, 240, ctH / 2, -220, 2.0, ctH, 2.0, borderMat);
  createRigidMesh(scene, world, R, 260, ctH / 2, -220, 2.0, ctH, 2.0, borderMat);
  createRigidMesh(scene, world, R, 250, 45, -230, 16.5, 10.0, 16.5, stoneMat); // Roof height: 55
  createRigidMesh(scene, world, R, 250, 50.6, -230, 18.2, 1.4, 18.2, roofMat);

  // ── BRAND NEW EXPANSION DISTRICT: CORPORATE MEGA-SKYSCRAPERS (DEEP SOUTH-EAST)
  // Placing massive skyscraper towers right out towards the edges of the 800m map
  createRigidMesh(scene, world, R, 310, 35, -120, 45, 70, 45, stoneMat); // Tower A (Height: 70)
  createRigidMesh(scene, world, R, 120, 45, -310, 40, 90, 40, borderMat); // Sky-needle Tower B (Height: 90)

  // ── GLOBAL TARGETED LAUNCHPAD PLACEMENTS (EVERY SINGLE ROOF INTERCONNECTED)
  // Parameters automatically process distances across the massive 800m grid!

  // 1. To North-West Apartment 1 Roof (Height ~30)
  buildJumper(scene, world, R, -140, 0.2, 170, -140, 30.5, 220, 1.10);

  // 2. To North-West Apartment 2 Roof
  buildJumper(scene, world, R, -200, 0.2, 170, -200, 30.5, 220, 1.10);

  // 3. To Freight Yard Central Giant Warehouse Roof (South-West)
  buildJumper(scene, world, R, -150, 0.2, -90, -150, 17.0, -140, 1.00);

  // 4. To Downtown Corner Shop Roof
  buildJumper(scene, world, R, 70, 0.2, 110, 110, 11.0, 110, 0.90);

  // 5. To Massive Department Store Roof (Top-Right)
  buildJumper(scene, world, R, 150, 0.2, 140, 220, 21.5, 140, 1.10);

  // 6. To Civic Assembly Deck (South-East)
  buildJumper(scene, world, R, 150, 0.2, -80, 150, 18.5, -110, 0.95);

  // 7. To High-Rise Spire Temple Top Deck (Height: 55)
  buildJumper(scene, world, R, 250, 0.2, -170, 250, 56.5, -230, 1.30);

  // 8. To Central Monument Tower Peak 
  buildJumper(scene, world, R, 0, 7.6, 40, 0, 41.5, 0, 1.00);

  // 9. NEW: To Giant Twin Complex Left Tower (Height: 50)
  buildJumper(scene, world, R, 140, 0.2, 210, 140, 51.0, 260, 1.15);

  // 10. NEW: To Corporate Tower A (Height: 70)
  buildJumper(scene, world, R, 310, 0.2, -60, 310, 71.0, -120, 1.35);

  // 11. NEW: To Giant Sky-needle Tower B (Absolute Highest Landing Challenge! Height: 90)
  buildJumper(scene, world, R, 120, 0.2, -240, 120, 91.0, -310, 1.50);

  // ── EXPANDED STREET LAMPS & PROP FORESTRY GRID ──────────────────────────────
  buildStreetLight(scene, world, R, -40, 65, 0);
  buildStreetLight(scene, world, R, 40, 65, Math.PI);
  buildStreetLight(scene, world, R, -40, -65, 0);
  buildStreetLight(scene, world, R, 40, -65, Math.PI);

  // Spreading trees contextually across the giant perimeter avenues
  const treeGrid = [
    [-45, 70], [-45, 110], [-45, 160], [-45, 210], [-45, 260],
    [45, 70], [45, 110], [45, 160], [45, 210], [45, 260],
    [-45, -70], [-45, -110], [-45, -160], [-45, -210], [-45, -260],
    [45, -70], [45, -110], [45, -160], [45, -210], [45, -260]
  ];
  treeGrid.forEach(([tx, tz]) => { buildPropTree(scene, world, R, tx, tz); });
}
