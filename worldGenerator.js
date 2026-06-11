import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── FIXED CORE ENGINE MESH & COLLIDER UTILITY ────────────────────────────────
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

// ── EXPLICIT ASSET BUILDERS ──────────────────────────────────────────────────
function buildApartmentComplex(scene, world, R, x, z, w, h, d, colorMat) {
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, colorMat);
  createRigidMesh(scene, world, R, x, h + 0.2, z, w + 0.8, 0.4, d + 0.8, roofMat);
  
  const floors = 4;
  for (let i = 1; i < floors; i++) {
    createRigidMesh(scene, world, R, x, (h / floors) * i, z, w + 0.2, 0.3, d + 0.2, stoneMat, 0, false);
  }
}

function buildRowHouse(scene, world, R, x, z, w, h, d, ry = 0) {
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, woodMat, ry);
  const steps = 4;
  const stepHeight = 0.6;
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const currentW = w * (1.1 - ratio);
    const currentY = h + (i * stepHeight) + (stepHeight / 2);
    createRigidMesh(scene, world, R, x, currentY, z, currentW, stepHeight, d + 0.4, roofMat, ry);
  }
}

function buildCommercialShop(scene, world, R, x, z, w, h, d, signColorMat) {
  createRigidMesh(scene, world, R, x, h/2, z, w, h, d, stoneMat);
  createRigidMesh(scene, world, R, x, h/3, z + d/2 + 0.1, w * 0.7, h/2, 0.2, borderMat, 0, false);
  createRigidMesh(scene, world, R, x, h * 0.65, z + d/2 + 0.6, w + 0.6, 0.3, 1.4, roofMat);
  createRigidMesh(scene, world, R, x, h * 0.85, z + d/2 + 0.2, w * 0.8, 1.4, 0.3, signColorMat);
}

function buildCentralMonument(scene, world, R, x, z) {
  createRigidMesh(scene, world, R, x, 0.4, z, 36, 0.8, 36, stoneMat);
  createRigidMesh(scene, world, R, x, 1.2, z, 26, 0.8, 26, stoneMat);
  createRigidMesh(scene, world, R, x, 2.4, z, 16, 1.6, 16, stoneMat);
  createRigidMesh(scene, world, R, x, 4.2, z, 6.0, 2.0, 6.0, stoneMat);
  createRigidMesh(scene, world, R, x, 12.0, z, 3.2, 14.0, 3.2, stoneMat);
  createRigidMesh(scene, world, R, x, 19.5, z, 2.0, 1.0, 2.0, woodMat);
}

function buildClockTower(scene, world, R, x, z) {
  const totalH = 20;
  createRigidMesh(scene, world, R, x - 4, totalH/2, z - 4, 0.8, totalH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x + 4, totalH/2, z - 4, 0.8, totalH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x - 4, totalH/2, z + 4, 0.8, totalH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x + 4, totalH/2, z + 4, 0.8, totalH, 0.8, borderMat);
  createRigidMesh(scene, world, R, x, totalH, z, 10, 0.4, 10, woodMat);
  createRigidMesh(scene, world, R, x, totalH + 4.5, z, 7.5, 9.0, 7.5, stoneMat);
  createRigidMesh(scene, world, R, x, totalH + 9.5, z, 8.2, 1.0, 8.2, roofMat);
}

function buildBoxTree(scene, world, R, x, z) {
  createRigidMesh(scene, world, R, x, 2.5, z, 0.6, 5.0, 0.6, woodMat, 0, true);
  createRigidMesh(scene, world, R, x, 6.0, z, 3.4, 2.0, 3.4, leafMat, 0, false);
}

// ── FIXED MAP LAYOUT MASTER ──────────────────────────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  const HALF_MAP = MAP_SIZE / 2;

  // Ground base floor plates
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), stoneMat); 
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const fBody = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(HALF_MAP, 0.5, HALF_MAP), fBody);

  // FIXED Boundary Walls (Resolved variable name crash)
  const HW = 16;
  createRigidMesh(scene, world, R, 0, HW/2, HALF_MAP, MAP_SIZE, HW, 4, borderMat, 0, false);   
  createRigidMesh(scene, world, R, 0, HW/2, -HALF_MAP, MAP_SIZE, HW, 4, borderMat, 0, false);  
  createRigidMesh(scene, world, R, HALF_MAP, HW/2, 0, 4, HW, MAP_SIZE, borderMat, 0, false);   
  createRigidMesh(scene, world, R, -HALF_MAP, HW/2, 0, 4, HW, MAP_SIZE, borderMat, 0, false);  

  // Skybox background dome
  const skyGeo = new THREE.SphereGeometry(285, 24, 12);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x9eccfa, side: THREE.BackSide });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // Roads Network
  const rw = 24;
  const plazaMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), pathMat);
  plazaMesh.rotation.x = -Math.PI / 2; plazaMesh.position.set(0, 0.02, 0); plazaMesh.receiveShadow = true; scene.add(plazaMesh);

  const avenues = [
    {x: 0, z: (HALF_MAP+30)/2, w: rw, d: HALF_MAP-30},
    {x: 0, z: -(HALF_MAP+30)/2, w: rw, d: HALF_MAP-30},
    {x: (HALF_MAP+30)/2, z: 0, w: HALF_MAP-30, d: rw},
    {x: -(HALF_MAP+30)/2, z: 0, w: HALF_MAP-30, d: rw}
  ];
  avenues.forEach(av => {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(av.w, av.d), pathMat);
    road.rotation.x = -Math.PI / 2; road.position.set(av.x, 0.02, av.z); road.receiveShadow = true; scene.add(road);
  });

  // Spawn center obelisk monument
  buildCentralMonument(scene, world, R, 0, 0);

  // NORTH-WEST DISTRICT: RESIDENTIAL
  const nwGrass = new THREE.Mesh(new THREE.PlaneGeometry(105, 105), grassMat); nwGrass.rotation.x = -Math.PI / 2; nwGrass.position.set(-70, 0.03, 70); scene.add(nwGrass);
  buildApartmentComplex(scene, world, R, -75, 115, 20, 24, 20, stoneMat);
  buildApartmentComplex(scene, world, R, -110, 115, 20, 24, 20, stoneMat);
  for (let i = 0; i < 4; i++) {
    buildRowHouse(scene, world, R, -40, 42 + (i * 16), 11, 8, 14, Math.PI / 2);
    buildRowHouse(scene, world, R, -56, 42 + (i * 16), 11, 8, 14, Math.PI / 2);
  }

  // SOUTH-WEST DISTRICT: FACTORY YARD
  createRigidMesh(scene, world, R, -70, 6, -55, 38, 12, 26, crateMat);
  const cargoMats = [roofMat, borderMat, crateMat, woodMat];
  for (let i = 0; i < 5; i++) {
    createRigidMesh(scene, world, R, -115 + (i * 15), 2.5, -115, 13, 5, 6, cargoMats[i % cargoMats.length]);
  }

  // TOP-RIGHT DISTRICT: SHOPPING MARKET
  const retailPlaza = new THREE.Mesh(new THREE.PlaneGeometry(105, 105), woodMat); retailPlaza.rotation.x = -Math.PI / 2; retailPlaza.position.set(70, 0.03, 70); scene.add(retailPlaza);
  createRigidMesh(scene, world, R, 110, 6, 50, 34, 12, 24, roofMat);
  buildCommercialShop(scene, world, R, 55, 42, 15, 8, 12, woodMat);
  buildCommercialShop(scene, world, R, 55, 58, 15, 8, 12, borderMat);

  // BOTTOM-RIGHT DISTRICT: BANK & CLOCK TOWER
  const seGrass = new THREE.Mesh(new THREE.PlaneGeometry(105, 105), grassMat); seGrass.rotation.x = -Math.PI / 2; seGrass.position.set(70, 0.03, -70); scene.add(seGrass);
  createRigidMesh(scene, world, R, 65, 6, -55, 32, 12, 22, stoneMat);
  buildClockTower(scene, world, R, 120, -120);

  // SIDEWALK TREES ROWS
  const treeCoords = [
    [-15, 40], [-15, 70], [-15, 100], [15, 40], [15, 70], [15, 100],
    [-15, -40], [-15, -70], [-15, -100], [15, -40], [15, -70], [15, -100],
    [40, 15], [70, 15], [100, 15], [40, -15], [70, -15], [100, -15],
    [-40, 15], [-70, 15], [-100, 15], [-40, -15], [-70, -15], [-100, -15]
  ];
  treeCoords.forEach(([tx, tz]) => {
    buildBoxTree(scene, world, R, tx, tz);
  });
}
