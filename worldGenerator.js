import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── FIXED CORE PHYSICS MATRICES ENGINE ────────────────────────────────────────
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

// ── FIXED BASE STRUCTURAL BUILDING BLOCKS ────────────────────────────────────
function buildExplicitApartment(scene, world, R, x, z, w, h, d, floorCount) {
  createRigidMesh(scene, world, R, x, h / 2, z, w, h, d, stoneMat);
  createRigidMesh(scene, world, R, x, h + 0.2, z, w + 1.0, 0.4, d + 1.0, roofMat);
  const step = h / floorCount;
  for (let i = 1; i < floorCount; i++) {
    createRigidMesh(scene, world, R, x, step * i, z, w + 0.2, 0.2, d + 0.2, stoneMat, 0, false);
  }
}

function buildExplicitRowHouse(scene, world, R, x, z, w, h, d, ry = 0) {
  createRigidMesh(scene, world, R, x, h / 2, z, w, h, d, woodMat, ry);
  createRigidMesh(scene, world, R, x, h / 3, z + d / 2 + 0.05, 1.6, 2.6, 0.1, borderMat, ry, false);
  const tiers = 5;
  const th = 0.5;
  for (let i = 0; i < tiers; i++) {
    const pct = i / tiers;
    createRigidMesh(scene, world, R, x, h + (i * th) + (th / 2), z, w * (1.1 - pct), th, d + 0.4, roofMat, ry);
  }
}

function buildExplicitShop(scene, world, R, x, z, w, h, d, signMat, ry = 0) {
  createRigidMesh(scene, world, R, x, h / 2, z, w, h, d, stoneMat, ry);
  createRigidMesh(scene, world, R, x, h / 3, z + d / 2 + 0.05, w * 0.6, h / 2, 0.1, borderMat, ry, false);
  createRigidMesh(scene, world, R, x, h * 0.65, z + d / 2 + 0.5, w + 0.4, 0.3, 1.2, roofMat, ry);
  createRigidMesh(scene, world, R, x, h * 0.85, z + d / 2 + 0.1, w * 0.8, 1.2, 0.2, signMat, ry);
}

function buildExplicitTree(scene, world, R, x, z) {
  createRigidMesh(scene, world, R, x, 2.5, z, 0.6, 5.0, 0.6, woodMat, 0, true);
  createRigidMesh(scene, world, R, x, 5.8, z, 3.4, 2.2, 3.4, leafMat, 0, false);
  createRigidMesh(scene, world, R, x, 7.1, z, 2.2, 1.4, 2.2, leafMat, 0, false);
}

// ── MASTER WORLD ENVIRONMENT EXPLICIT COMPOSITION ─────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  const HALF_MAP = MAP_SIZE / 2;
  const avW = 24;

  // Ground Arena Floor Plate
  const baseFloor = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), stoneMat); 
  baseFloor.rotation.x = -Math.PI / 2; baseFloor.receiveShadow = true; scene.add(baseFloor);
  const floorRB = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(HALF_MAP, 0.5, HALF_MAP), floorRB);

  // Outer Sky Dome
  const skyGeo = new THREE.SphereGeometry(290, 24, 12);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x9eccfa, side: THREE.BackSide });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // Fortress Border Walls
  const WH = 16;
  createRigidMesh(scene, world, R, 0, WH/2, HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, false);   
  createRigidMesh(scene, world, R, 0, WH/2, -HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, false);  
  createRigidMesh(scene, world, R, HALF_MAP, WH/2, 0, 4, WH, MAP_SIZE, borderMat, 0, false);   
  createRigidMesh(scene, world, R, -HALF_MAP, WH/2, 0, 4, WH, MAP_SIZE, borderMat, 0, false);  

  // Avenues Cross Layout configuration
  const plazaPlat = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), pathMat);
  plazaPlat.rotation.x = -Math.PI / 2; plazaPlat.position.set(0, 0.02, 0); plazaPlat.receiveShadow = true; scene.add(plazaPlat);

  const roadPlacements = [
    {x: 0, z: (HALF_MAP + 32) / 2, w: avW, d: HALF_MAP - 32},
    {x: 0, z: -(HALF_MAP + 32) / 2, w: avW, d: HALF_MAP - 32},
    {x: (HALF_MAP + 32) / 2, z: 0, w: HALF_MAP - 32, d: avW},
    {x: -(HALF_MAP + 32) / 2, z: 0, w: HALF_MAP - 32, d: avW}
  ];
  roadPlacements.forEach(lane => {
    const roadTrack = new THREE.Mesh(new THREE.PlaneGeometry(lane.w, lane.d), pathMat);
    roadTrack.rotation.x = -Math.PI / 2; roadTrack.position.set(lane.x, 0.02, lane.z); roadTrack.receiveShadow = true; scene.add(roadTrack);
  });

  // Central Obelisk Column Monument
  createRigidMesh(scene, world, R, 0, 0.4, 0, 44, 0.8, 44, stoneMat);
  createRigidMesh(scene, world, R, 0, 1.2, 0, 34, 0.8, 34, stoneMat);
  createRigidMesh(scene, world, R, 0, 2.4, 0, 24, 1.6, 24, stoneMat);
  createRigidMesh(scene, world, R, 0, 4.4, 0, 14, 2.4, 14, stoneMat);
  createRigidMesh(scene, world, R, 0, 14.5, 0, 3.8, 18.0, 3.8, stoneMat);
  createRigidMesh(scene, world, R, 0, 24.0, 0, 2.5, 1.0, 2.5, woodMat);

  // ── QUADRANT 1: NORTH-WEST RESIDENTIAL ZONE ─────────────────────────────────
  const nwLawn = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), grassMat); nwLawn.rotation.x = -Math.PI / 2; nwLawn.position.set(-70, 0.03, 70); scene.add(nwLawn);
  
  buildExplicitApartment(scene, world, R, -74, 116, 22, 26, 22, 5);
  buildExplicitApartment(scene, world, R, -114, 116, 22, 26, 22, 5);

  buildExplicitRowHouse(scene, world, R, -38, 42, 12, 9, 14, Math.PI / 2);
  buildExplicitRowHouse(scene, world, R, -38, 59, 12, 9, 14, Math.PI / 2);
  buildExplicitRowHouse(scene, world, R, -38, 76, 12, 9, 14, Math.PI / 2);
  buildExplicitRowHouse(scene, world, R, -38, 93, 12, 9, 14, Math.PI / 2);
  buildExplicitRowHouse(scene, world, R, -56, 42, 12, 9, 14, Math.PI / 2);
  buildExplicitRowHouse(scene, world, R, -56, 59, 12, 9, 14, Math.PI / 2);
  buildExplicitRowHouse(scene, world, R, -56, 76, 12, 9, 14, Math.PI / 2);
  buildExplicitRowHouse(scene, world, R, -56, 93, 12, 9, 14, Math.PI / 2);

  // Power Plant Cage Substation
  createRigidMesh(scene, world, R, -118, 4, 76, 16, 8, 22, borderMat, 0, false);
  createRigidMesh(scene, world, R, -120, 5, 78, 4, 10, 4, stoneMat);
  createRigidMesh(scene, world, R, -114, 3, 72, 3, 6, 3, crateMat);

  // ── QUADRANT 2: SOUTH-WEST FREIGHT LOGISTICS MATRIX ──────────────────────────
  const swTarmac = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), stoneMat); swTarmac.rotation.x = -Math.PI / 2; swTarmac.position.set(-70, 0.03, -70); scene.add(swTarmac);

  createRigidMesh(scene, world, R, -68, 6, -54, 46, 12, 30, crateMat);
  createRigidMesh(scene, world, R, -68, 12.3, -54, 48, 0.6, 32, roofMat);
  createRigidMesh(scene, world, R, -84, 17, -64, 2.5, 10, 2.5, stoneMat);

  // Explicit Container Placement Layout Matrices (Alternating safe colors)
  createRigidMesh(scene, world, R, -118, 2.5, -116, 14, 5, 7, roofMat);
  createRigidMesh(scene, world, R, -118, 7.5, -116, 14, 5, 7, crateMat);
  createRigidMesh(scene, world, R, -102, 2.5, -116, 14, 5, 7, borderMat);
  createRigidMesh(scene, world, R, -102, 7.5, -116, 14, 5, 7, woodMat);
  createRigidMesh(scene, world, R, -86, 2.5, -116, 14, 5, 7, crateMat);
  createRigidMesh(scene, world, R, -86, 7.5, -116, 14, 5, 7, roofMat);
  createRigidMesh(scene, world, R, -70, 2.5, -116, 14, 5, 7, woodMat);
  createRigidMesh(scene, world, R, -70, 7.5, -116, 14, 5, 7, borderMat);
  createRigidMesh(scene, world, R, -54, 2.5, -116, 14, 5, 7, roofMat);
  createRigidMesh(scene, world, R, -54, 7.5, -116, 14, 5, 7, crateMat);

  createRigidMesh(scene, world, R, -122, 2.5, -42, 7, 5, 14, borderMat);
  createRigidMesh(scene, world, R, -122, 7.5, -42, 7, 5, 14, roofMat);
  createRigidMesh(scene, world, R, -122, 2.5, -58, 7, 5, 14, crateMat);
  createRigidMesh(scene, world, R, -122, 7.5, -58, 7, 5, 14, woodMat);
  createRigidMesh(scene, world, R, -122, 2.5, -74, 7, 5, 14, woodMat);
  createRigidMesh(scene, world, R, -122, 7.5, -74, 7, 5, 14, borderMat);

  createRigidMesh(scene, world, R, -106, 2.5, -42, 7, 5, 14, crateMat);
  createRigidMesh(scene, world, R, -106, 2.5, -58, 7, 5, 14, roofMat);
  createRigidMesh(scene, world, R, -106, 2.5, -74, 7, 5, 14, borderMat);

  // Silo Storage Fluid Systems
  createRigidMesh(scene, world, R, -125, 7, -132, 12, 14, 12, stoneMat);
  createRigidMesh(scene, world, R, -109, 5, -132, 8, 10, 8, stoneMat);

  // Loose Obstacle Crates
  createRigidMesh(scene, world, R, -36, 1.5, -36, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -31, 1.5, -36, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -34, 4.2, -36, 2.5, 2.5, 2.5, crateMat);

  // ── QUADRANT 3: TOP-RIGHT MARKET SQUARE PLAZA ───────────────────────────────
  const nePlaza = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), woodMat); nePlaza.rotation.x = -Math.PI / 2; nePlaza.position.set(70, 0.03, 70); scene.add(nePlaza);

  createRigidMesh(scene, world, R, 112, 7.5, 48, 38, 15, 26, roofMat);
  createRigidMesh(scene, world, R, 112, 11.5, 61.1, 16, 3, 0.2, stoneMat);

  buildExplicitShop(scene, world, R, 54, 40, 16, 9, 14, woodMat);  
  buildExplicitShop(scene, world, R, 54, 57, 16, 9, 14, borderMat); 
  buildExplicitShop(scene, world, R, 54, 74, 16, 9, 14, stoneMat);  

  createRigidMesh(scene, world, R, 40, 15, 122, 18, 30, 18, stoneMat);
  createRigidMesh(scene, world, R, -40, 15, 122, 18, 30, 18, stoneMat); 
  createRigidMesh(scene, world, R, 0, 28.5, 122, 62, 1.0, 6.5, borderMat);

  // Radio Signal Mast
  createRigidMesh(scene, world, R, 126, 16, 126, 4, 32, 4, borderMat);
  createRigidMesh(scene, world, R, 126, 36, 126, 2, 8, 2, woodMat);

  // ── QUADRANT 4: BOTTOM-RIGHT CIVIC BANK PARK ────────────────────────────────
  const seGrass = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), grassMat); seGrass.rotation.x = -Math.PI / 2; seGrass.position.set(70, 0.03, -70); scene.add(seGrass);

  // Symmetrical Municipal Court / Bank
  createRigidMesh(scene, world, R, 66, 6, -54, 34, 13, 24, stoneMat);
  createRigidMesh(scene, world, R, 66, 0.4, -38, 20, 0.8, 4, stoneMat);
  createRigidMesh(scene, world, R, 66, 14.5, -41, 34, 3.0, 4, roofMat);
  createRigidMesh(scene, world, R, 55, 6, -39, 1.2, 13, 1.2, borderMat);
  createRigidMesh(scene, world, R, 66, 6, -39, 1.2, 13, 1.2, borderMat);
  createRigidMesh(scene, world, R, 77, 6, -39, 1.2, 13, 1.2, borderMat);

  createRigidMesh(scene, world, R, 112, 5.5, -54, 24, 11, 24, woodMat);
  createRigidMesh(scene, world, R, 112, 11.2, -54, 25, 0.5, 25, roofMat);

  // Clock Bastion Spire Tower Setup
  const ctH = 24;
  createRigidMesh(scene, world, R, 122 - 4.5, ctH / 2, -122 - 4.5, 0.8, ctH, 0.8, borderMat);
  createRigidMesh(scene, world, R, 122 + 4.5, ctH / 2, -122 - 4.5, 0.8, ctH, 0.8, borderMat);
  createRigidMesh(scene, world, R, 122 - 4.5, ctH / 2, -122 + 4.5, 0.8, ctH, 0.8, borderMat);
  createRigidMesh(scene, world, R, 122 + 4.5, ctH / 2, -122 + 4.5, 0.8, ctH, 0.8, borderMat);
  createRigidMesh(scene, world, R, 122, 6, -122, 9.8, 0.4, 9.8, borderMat, 0, false);
  createRigidMesh(scene, world, R, 122, 12, -122, 9.8, 0.4, 9.8, borderMat, 0, false);
  createRigidMesh(scene, world, R, 122, 18, -122, 9.8, 0.4, 9.8, borderMat, 0, false);
  createRigidMesh(scene, world, R, 122, ctH, -122, 11.5, 0.4, 11.5, woodMat);
  createRigidMesh(scene, world, R, 122, ctH + 5.0, -122, 8.5, 10.0, 8.5, stoneMat);
  createRigidMesh(scene, world, R, 122, ctH + 10.6, -122, 9.2, 1.4, 9.2, roofMat);

  const faceGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.5, 8); faceGeo.rotateX(Math.PI / 2);
  const faceMesh = new THREE.Mesh(faceGeo, borderMat); faceMesh.position.set(122, ctH + 5.0, -117.7); scene.add(faceMesh);

  // ── HARDCODED GRID FOR AVENUE SIDEWALK TREES ───────────────────────────────
  const staticTrees = [
    [-15, 36], [-15, 52], [-15, 68], [-15, 84], [-15, 100], [-15, 116], [-15, 132],
    [15, 36], [15, 52], [15, 68], [15, 84], [15, 100], [15, 116], [15, 132],
    [-15, -36], [-15, -52], [-15, -68], [-15, -84], [-15, -100], [-15, -116], [-15, -132],
    [15, -36], [15, -52], [15, -68], [15, -84], [15, -100], [15, -116], [15, -132],
    [36, 15], [52, 15], [68, 15], [84, 15], [100, 15], [116, 15], [132, 15],
    [36, -15], [52, -15], [68, -15], [84, -15], [100, -15], [116, -15], [132, -15],
    [-36, 15], [-52, 15], [-68, 15], [-84, 15], [-100, 15], [-116, 15], [-132, 15],
    [-36, -15], [-52, -15], [-68, -15], [-84, -15], [-100, -15], [-116, -15], [-132, -15]
  ];
  staticTrees.forEach(([tx, tz]) => { buildExplicitTree(scene, world, R, tx, tz); });
}
