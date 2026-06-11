import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── CORE COMPONENT ENGINE ───────────────────────────────────────────────────
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

// ── CLEAN HOLLOW INTERIORS ───────────────────────────────────────────────────

// ── PRECISION MULTI-STORY APARTMENT BUILDINGS ───────────────────────────────
function buildExplorableApartment(scene, world, R, x, z, w, floorH, d, floors) {
  const wallThick = 0.5; // Sharp, thin walls to prevent bulky clipping
  const rampW = 4.0;     // Fixed comfortable width for the interior walkway

  for (let i = 0; i < floors; i++) {
    const yBase = i * floorH;

    // 1. FLOOR PLANES WITH INTEGRATED STAIRWELL HOLES
    if (i === 0) {
      // Ground floor baseline plate
      createRigidMesh(scene, world, R, x, yBase + 0.1, z, w, 0.2, d, stoneMat);
    } else {
      // Upper Floors: Cut a precise hole on the right-hand side for the ramp to emerge
      // Main floor deck (Left side)
      createRigidMesh(scene, world, R, x - rampW / 2, yBase + 0.1, z, w - rampW, 0.2, d, stoneMat);
      // Safety walkways around the hole (Front and Back segments)
      createRigidMesh(scene, world, R, x + (w - rampW) / 2, yBase + 0.1, z + d / 3, rampW, 0.2, d / 3, stoneMat);
      createRigidMesh(scene, world, R, x + (w - rampW) / 2, yBase + 0.1, z - d / 3, rampW, 0.2, d / 3, stoneMat);
    }

    // 2. FLUSH OUTER WALLS (No overlapping corner gaps)
    createRigidMesh(scene, world, R, x, yBase + floorH / 2, z - d / 2 + wallThick / 2, w, floorH, wallThick, stoneMat); // Back Wall
    createRigidMesh(scene, world, R, x - w / 2 + wallThick / 2, yBase + floorH / 2, z, wallThick, floorH, d - wallThick * 2, stoneMat); // Left Wall
    createRigidMesh(scene, world, R, x + w / 2 - wallThick / 2, yBase + floorH / 2, z, wallThick, floorH, d - wallThick * 2, stoneMat); // Right Wall

    // 3. STYLIZED FRONT FAÇADE WITH WINDOW PILLARS (Matches your reference image)
    const pillarW = 2.5;
    // Left, Right, and Center structural columns
    createRigidMesh(scene, world, R, x - w / 2 + pillarW / 2, yBase + floorH / 2, z + d / 2 - wallThick / 2, pillarW, floorH, wallThick, borderMat);
    createRigidMesh(scene, world, R, x + w / 2 - pillarW / 2, yBase + floorH / 2, z + d / 2 - wallThick / 2, pillarW, floorH, wallThick, borderMat);
    createRigidMesh(scene, world, R, x, yBase + floorH / 2, z + d / 2 - wallThick / 2, pillarW, floorH, wallThick, borderMat);

    // Top window headers closing off the frames
    const windowW = w / 2 - pillarW;
    createRigidMesh(scene, world, R, x - w / 4, yBase + floorH - 0.6, z + d / 2 - wallThick / 2, windowW, 1.2, wallThick, borderMat);
    createRigidMesh(scene, world, R, x + w / 4, yBase + floorH - 0.6, z + d / 2 - wallThick / 2, windowW, 1.2, wallThick, borderMat);

    if (i > 0) {
      // Upper floors get safety window sills (creates a perfect square window cutout)
      createRigidMesh(scene, world, R, x - w / 4, yBase + 0.6, z + d / 2 - wallThick / 2, windowW, 1.2, wallThick, borderMat);
      createRigidMesh(scene, world, R, x + w / 4, yBase + 0.6, z + d / 2 - wallThick / 2, windowW, 1.2, wallThick, borderMat);
    } // Note: Ground floor skips the lower sills so they act as two wide door entryways!

    // 4. FLUSH SIDE-WALL RAMPS (Tucked cleanly against the right interior wall)
    if (i < floors - 1) {
      const rampRun = d - 2.0; // Stop short of hitting the front/back walls
      const rampLength = Math.sqrt(rampRun * rampRun + floorH * floorH);
      const rampAngle = Math.atan2(floorH, rampRun); // Tilted cleanly up towards the back stairwell hole

      createRigidMesh(
        scene, world, R,
        x + w / 2 - wallThick - rampW / 2, // Hugs the right interior wall perfectly
        yBase + floorH / 2,                // Centers perfectly between floors
        z,                                 // Center aligned on Z axis
        rampW, 0.15, rampLength, woodMat,
        rampAngle, 0, 0                    // Rotates cleanly up on the X axis
      );
    }
  }

  // Roof decorative crown cap
  createRigidMesh(scene, world, R, x, floors * floorH + 0.1, z, w + 0.8, 0.2, d + 0.8, roofMat);
}

// ── PRECISION COMMERCIAL RETAIL STORES ───────────────────────────────────────
function buildExplorableShop(scene, world, R, x, z, w, h, d, signMat) {
  const wallThick = 0.5;
  
  // Floor plate & Roof slab overhang trims
  createRigidMesh(scene, world, R, x, 0.1, z, w, 0.2, d, stoneMat);
  createRigidMesh(scene, world, R, x, h + 0.1, z, w + 0.6, 0.2, d + 0.6, roofMat);

  // Shell
  createRigidMesh(scene, world, R, x, h / 2, z - d / 2 + wallThick / 2, w, h, wallThick, stoneMat); // Back
  createRigidMesh(scene, world, R, x - w / 2 + wallThick / 2, h / 2, z, wallThick, h, d - wallThick * 2, stoneMat); // Left
  createRigidMesh(scene, world, R, x + w / 2 - wallThick / 2, h / 2, z, wallThick, h, d - wallThick * 2, stoneMat); // Right

  // Clean Front Open Showroom Windows
  const pillarW = 2.0;
  createRigidMesh(scene, world, R, x - w / 2 + pillarW / 2, h / 2, z + d / 2 - wallThick / 2, pillarW, h, wallThick, borderMat);
  createRigidMesh(scene, world, R, x + w / 2 + pillarW / 2, h / 2, z + d / 2 - wallThick / 2, pillarW, h, wallThick, borderMat);
  createRigidMesh(scene, world, R, x, h - 0.6, z + d / 2 - wallThick / 2, w - pillarW * 2, 1.2, wallThick, borderMat); // Top Header

  // Signage structure
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

// ── WORLD LEVEL BUILD EXECUTOR ───────────────────────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  const HALF_MAP = MAP_SIZE / 2;
  const avW = 24;

  // Level Floor Map Plates
  const baseFloor = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), stoneMat);
  baseFloor.rotation.x = -Math.PI / 2; baseFloor.receiveShadow = true; scene.add(baseFloor);
  const floorRB = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(HALF_MAP, 0.5, HALF_MAP), floorRB);

  // Arena Background Sky Capsule
  const skyGeo = new THREE.SphereGeometry(295, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x9eccfa, side: THREE.BackSide });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // Outer Border Containment Walls
  const WH = 18;
  createRigidMesh(scene, world, R, 0, WH / 2, HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, 0, WH / 2, -HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, HALF_MAP, WH / 2, 0, 4, WH, MAP_SIZE, borderMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, -HALF_MAP, WH / 2, 0, 4, WH, MAP_SIZE, borderMat, 0, 0, 0, false);

  // Main Boulevard Roads Network Matrix
  const plazaPlat = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), pathMat);
  plazaPlat.rotation.x = -Math.PI / 2; plazaPlat.position.set(0, 0.02, 0); plazaPlat.receiveShadow = true; scene.add(plazaPlat);

  const roads = [
    { x: 0, z: (HALF_MAP + 32) / 2, w: avW, d: HALF_MAP - 32 },
    { x: 0, z: -(HALF_MAP + 32) / 2, w: avW, d: HALF_MAP - 32 },
    { x: (HALF_MAP + 32) / 2, z: 0, w: HALF_MAP - 32, d: avW },
    { x: -(HALF_MAP + 32) / 2, z: 0, w: HALF_MAP - 32, d: avW }
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

  // Central Obelisk Platform Structure Base
  createRigidMesh(scene, world, R, 0, 0.4, 0, 44, 0.8, 44, stoneMat);
  createRigidMesh(scene, world, R, 0, 1.2, 0, 34, 0.8, 34, stoneMat);
  createRigidMesh(scene, world, R, 0, 2.4, 0, 24, 1.6, 24, stoneMat);
  createRigidMesh(scene, world, R, 0, 4.4, 0, 14, 2.4, 14, stoneMat);
  createRigidMesh(scene, world, R, 0, 14.5, 0, 3.8, 18.0, 3.8, stoneMat);
  createRigidMesh(scene, world, R, 0, 24.0, 0, 2.4, 1.0, 2.4, woodMat);

  // ── QUADRANT 1: HOLLOW RESIDENTIAL MODULES (NORTH-WEST) ──────────────────────
  const nwGrass = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), grassMat); nwGrass.rotation.x = -Math.PI / 2; nwGrass.position.set(-70, 0.03, 70); scene.add(nwGrass);

  // Explorable multi-story units with optimized inner-pathing ramps
  buildExplorableApartment(scene, world, R, -74, 116, 24, 5.5, 22, 4);
  buildExplorableApartment(scene, world, R, -114, 116, 24, 5.5, 22, 4);

  // Row House Block Assemblies
  createRigidMesh(scene, world, R, -38, 4.5, 42, 12, 9, 14, woodMat, 0, Math.PI / 2, 0);
  createRigidMesh(scene, world, R, -38, 4.5, 59, 12, 9, 14, woodMat, 0, Math.PI / 2, 0);
  createRigidMesh(scene, world, R, -38, 4.5, 76, 12, 9, 14, woodMat, 0, Math.PI / 2, 0);
  createRigidMesh(scene, world, R, -38, 4.5, 93, 12, 9, 14, woodMat, 0, Math.PI / 2, 0);

  // Substation Outpost Setup
  createRigidMesh(scene, world, R, -118, 4, 76, 16, 8, 22, borderMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, -120, 5, 78, 5, 10, 5, stoneMat);
  createRigidMesh(scene, world, R, -114, 3, 72, 4, 6, 4, crateMat);

  // ── QUADRANT 2: CARGO GRID INDUSTRIAL FREIGHT YARD (SOUTH-WEST) ─────────────
  const swTarmac = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), stoneMat); swTarmac.rotation.x = -Math.PI / 2; swTarmac.position.set(-70, 0.03, -70); scene.add(swTarmac);

  createRigidMesh(scene, world, R, -68, 6, -54, 46, 12, 32, crateMat);
  createRigidMesh(scene, world, R, -68, 12.3, -54, 48, 0.6, 34, roofMat);

  // Dense Double-Stacked Matrix Cargo Freight Containers
  createRigidMesh(scene, world, R, -118, 2.5, -116, 14, 5, 7, roofMat);
  createRigidMesh(scene, world, R, -118, 7.5, -116, 14, 5, 7, crateMat);
  createRigidMesh(scene, world, R, -102, 2.5, -116, 14, 5, 7, borderMat);
  createRigidMesh(scene, world, R, -102, 7.5, -116, 14, 5, 7, woodMat);
  createRigidMesh(scene, world, R, -86, 2.5, -116, 14, 5, 7, crateMat);
  createRigidMesh(scene, world, R, -86, 7.5, -116, 14, 5, 7, roofMat);

  // Terminal Silos
  createRigidMesh(scene, world, R, -125, 7, -132, 12, 14, 12, stoneMat);
  createRigidMesh(scene, world, R, -109, 5, -132, 8, 10, 8, stoneMat);

  // Obstacle cover blocks
  createRigidMesh(scene, world, R, -36, 1.5, -36, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -31, 1.5, -36, 3, 3, 3, woodMat);

  // ── QUADRANT 3: DOWNTOWN COMMERCE SHOPS PLAZA (TOP-RIGHT) ───────────────────
  const nePlaza = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), woodMat); nePlaza.rotation.x = -Math.PI / 2; nePlaza.position.set(70, 0.03, 70); scene.add(nePlaza);

  // Anchor Supercenter Store
  createRigidMesh(scene, world, R, 112, 7.5, 48, 38, 15, 26, roofMat);

  // Fully open, interior explorable boutique line items
  buildExplorableShop(scene, world, R, 54, 40, 16, 9, 14, woodMat);
  buildExplorableShop(scene, world, R, 54, 57, 16, 9, 14, borderMat);
  buildExplorableShop(scene, world, R, 54, 74, 16, 9, 14, stoneMat);

  // High-traffic skybridge pillars
  createRigidMesh(scene, world, R, 40, 15, 122, 18, 30, 18, stoneMat);
  createRigidMesh(scene, world, R, -40, 15, 122, 18, 30, 18, stoneMat);
  createRigidMesh(scene, world, R, 0, 28.5, 122, 62, 1.0, 6.5, borderMat);

  // ── QUADRANT 4: CIVIC PARK & MUNICIPAL BANK ASSEMBLY (SOUTH-EAST) ───────────
  const seGrass = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), grassMat); seGrass.rotation.x = -Math.PI / 2; seGrass.position.set(70, 0.03, -70); scene.add(seGrass);

  // Court Hall Assembly Structure
  createRigidMesh(scene, world, R, 66, 6, -54, 34, 13, 24, stoneMat);
  createRigidMesh(scene, world, R, 66, 14.5, -41, 34, 3.0, 4, roofMat);
  createRigidMesh(scene, world, R, 55, 6, -39, 1.2, 13, 1.2, borderMat);
  createRigidMesh(scene, world, R, 66, 6, -39, 1.2, 13, 1.2, borderMat);
  createRigidMesh(scene, world, R, 77, 6, -39, 1.2, 13, 1.2, borderMat);

  // Observation Spire Scaffolding Clock Tower
  const ctH = 24;
  createRigidMesh(scene, world, R, 117.5, ctH / 2, -126.5, 0.8, ctH, 0.8, borderMat);
  createRigidMesh(scene, world, R, 126.5, ctH / 2, -126.5, 0.8, ctH, 0.8, borderMat);
  createRigidMesh(scene, world, R, 117.5, ctH / 2, -117.5, 0.8, ctH, 0.8, borderMat);
  createRigidMesh(scene, world, R, 126.5, ctH / 2, -117.5, 0.8, ctH, 0.8, borderMat);
  createRigidMesh(scene, world, R, 122, 6, -122, 9.8, 0.4, 9.8, borderMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, 122, 12, -122, 9.8, 0.4, 9.8, borderMat, 0, 0, 0, false);
  createRigidMesh(scene, world, R, 122, ctH, -122, 11.5, 0.4, 11.5, woodMat);
  createRigidMesh(scene, world, R, 122, ctH + 5.0, -122, 8.5, 10.0, 8.5, stoneMat);
  createRigidMesh(scene, world, R, 122, ctH + 10.6, -122, 9.2, 1.4, 9.2, roofMat);

  // ── STREET LIGHTS ────────────────────────────────────────────────────────────
  buildStreetLight(scene, world, R, -15, 33, 0);
  buildStreetLight(scene, world, R, 15, 33, Math.PI);
  buildStreetLight(scene, world, R, -15, -33, 0);
  buildStreetLight(scene, world, R, 15, -33, Math.PI);

  // ── SIDEWALK TREE BOULEVARD MARKERS ──────────────────────────────────────────
  const treeGrid = [
    [-15, 36], [-15, 52], [-15, 68], [-15, 84], [-15, 100], [-15, 116], [-15, 132],
    [15, 36], [15, 52], [15, 68], [15, 84], [15, 100], [15, 116], [15, 132],
    [-15, -36], [-15, -52], [-15, -68], [-15, -84], [-15, -100], [-15, -116], [-15, -132],
    [15, -36], [15, -52], [15, -68], [15, -84], [15, -100], [15, -116], [15, -132]
  ];
  treeGrid.forEach(([tx, tz]) => { buildPropTree(scene, world, R, tx, tz); });
}
