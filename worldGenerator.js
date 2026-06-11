import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── CORE COMPONENT RENDER ENGINE WITH PHYSICAL COLLIDERS ─────────────────────
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

// ── MICRO-ASSET DESIGN MODULES ───────────────────────────────────────────────

function buildPropTree(scene, world, R, x, z) {
  createRigidMesh(scene, world, R, x, 2.5, z, 0.6, 5.0, 0.6, woodMat, 0, true);
  createRigidMesh(scene, world, R, x, 5.8, z, 3.4, 2.2, 3.4, leafMat, 0, false);
  createRigidMesh(scene, world, R, x, 7.1, z, 2.2, 1.4, 2.2, leafMat, 0, false);
}

function buildStreetLight(scene, world, R, x, z, ry = 0) {
  // Post pole
  createRigidMesh(scene, world, R, x, 4.0, z, 0.3, 8.0, 0.3, borderMat, 0, false);
  // Overhanging lamp arm
  createRigidMesh(scene, world, R, x + Math.sin(ry)*1.0, 8.0, z + Math.cos(ry)*1.0, 1.8, 0.3, 0.4, borderMat, ry, false);
  // Emission head
  createRigidMesh(scene, world, R, x + Math.sin(ry)*1.8, 7.7, z + Math.cos(ry)*1.8, 0.6, 0.3, 0.6, stoneMat, ry, false);
}

function buildDetailedRowHouse(scene, world, R, x, z, w, h, d, ry = 0) {
  // Structural frame
  createRigidMesh(scene, world, R, x, h / 2, z, w, h, d, woodMat, ry);
  // Front door element
  createRigidMesh(scene, world, R, x, h / 3, z + d / 2 + 0.05, 1.6, 2.6, 0.1, borderMat, ry, false);
  // Left and Right windows
  createRigidMesh(scene, world, R, x - w/4, h/2, z + d/2 + 0.05, 1.4, 1.4, 0.1, stoneMat, ry, false);
  createRigidMesh(scene, world, R, x + w/4, h/2, z + d/2 + 0.05, 1.4, 1.4, 0.1, stoneMat, ry, false);
  // Layered sloped roofs
  const tiers = 6;
  const th = 0.45;
  for (let i = 0; i < tiers; i++) {
    const pct = i / tiers;
    createRigidMesh(scene, world, R, x, h + (i * th) + (th / 2), z, w * (1.15 - pct), th, d + 0.4, roofMat, ry);
  }
}

function buildDetailedShop(scene, world, R, x, z, w, h, d, signMat, ry = 0) {
  createRigidMesh(scene, world, R, x, h / 2, z, w, h, d, stoneMat, ry);
  // Window frames
  createRigidMesh(scene, world, R, x - w/4, h / 3, z + d / 2 + 0.05, w / 3, h / 2, 0.1, borderMat, ry, false);
  createRigidMesh(scene, world, R, x + w/4, h / 3, z + d / 2 + 0.05, w / 3, h / 2, 0.1, borderMat, ry, false);
  // Hanging awning
  createRigidMesh(scene, world, R, x, h * 0.62, z + d / 2 + 0.6, w + 0.4, 0.25, 1.4, roofMat, ry);
  // Large corporate fascia board
  createRigidMesh(scene, world, R, x, h * 0.85, z + d / 2 + 0.15, w * 0.85, 1.3, 0.2, signMat, ry);
}

// ── EXPLICIT GLOBAL COORDINATE MAP OUTLAY ────────────────────────────────────
export function buildMapLayout(scene, world, R, MAP_SIZE) {
  const HALF_MAP = MAP_SIZE / 2;
  const avW = 24;

  // Ground plane substrate
  const baseFloor = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), stoneMat);
  baseFloor.rotation.x = -Math.PI / 2; baseFloor.receiveShadow = true; scene.add(baseFloor);
  const floorRB = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(HALF_MAP, 0.5, HALF_MAP), floorRB);

  // Environmental background atmospheric shell
  const skyGeo = new THREE.SphereGeometry(295, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x9eccfa, side: THREE.BackSide });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // Outer Perimeter Defensive Barrier Walls
  const WH = 18;
  createRigidMesh(scene, world, R, 0, WH/2, HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, false);
  createRigidMesh(scene, world, R, 0, WH/2, -HALF_MAP, MAP_SIZE, WH, 4, borderMat, 0, false);
  createRigidMesh(scene, world, R, HALF_MAP, WH/2, 0, 4, WH, MAP_SIZE, borderMat, 0, false);
  createRigidMesh(scene, world, R, -HALF_MAP, WH/2, 0, 4, WH, MAP_SIZE, borderMat, 0, false);

  // Main Boulevard Intersections Tracks
  const plazaPlat = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), pathMat);
  plazaPlat.rotation.x = -Math.PI / 2; plazaPlat.position.set(0, 0.02, 0); plazaPlat.receiveShadow = true; scene.add(plazaPlat);

  const roads = [
    {x: 0, z: (HALF_MAP + 32)/2, w: avW, d: HALF_MAP - 32},
    {x: 0, z: -(HALF_MAP + 32)/2, w: avW, d: HALF_MAP - 32},
    {x: (HALF_MAP + 32)/2, z: 0, w: HALF_MAP - 32, d: avW},
    {x: -(HALF_MAP + 32)/2, z: 0, w: HALF_MAP - 32, d: avW}
  ];
  roads.forEach(r => {
    const track = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), pathMat);
    track.rotation.x = -Math.PI / 2; track.position.set(r.x, 0.02, r.z); track.receiveShadow = true; scene.add(track);
    // Concrete raised curbs bounding the roadway lanes
    if (r.w === avW) {
      createRigidMesh(scene, world, R, r.x - avW/2 - 0.5, 0.2, r.z, 1.0, 0.4, r.d, stoneMat, 0, false);
      createRigidMesh(scene, world, R, r.x + avW/2 + 0.5, 0.2, r.z, 1.0, 0.4, r.d, stoneMat, 0, false);
    } else {
      createRigidMesh(scene, world, R, r.x, 0.2, r.z - avW/2 - 0.5, r.w, 0.4, 1.0, stoneMat, 0, false);
      createRigidMesh(scene, world, R, r.x, 0.2, r.z + avW/2 + 0.5, r.w, 0.4, 1.0, stoneMat, 0, false);
    }
  });

  // White Zebra Crosswalk Stripes
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const crosswalkOffsets = [31, -31];
  crosswalkOffsets.forEach(z => {
    for (let x = -10; x <= 10; x += 2.5) {
      let s = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 4.0), lineMat);
      s.rotation.x = -Math.PI/2; s.position.set(x, 0.03, z); scene.add(s);
    }
  });
  crosswalkOffsets.forEach(x => {
    for (let z = -10; z <= 10; z += 2.5) {
      let s = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.0), lineMat);
      s.rotation.x = -Math.PI/2; s.position.set(x, 0.03, z); scene.add(s);
    }
  });

  // Grand Central Obelisk Column Monument Base
  createRigidMesh(scene, world, R, 0, 0.4, 0, 44, 0.8, 44, stoneMat);
  createRigidMesh(scene, world, R, 0, 1.2, 0, 34, 0.8, 34, stoneMat);
  createRigidMesh(scene, world, R, 0, 2.4, 0, 24, 1.6, 24, stoneMat);
  createRigidMesh(scene, world, R, 0, 4.4, 0, 14, 2.4, 14, stoneMat);
  createRigidMesh(scene, world, R, 0, 14.5, 0, 3.8, 18.0, 3.8, stoneMat);
  createRigidMesh(scene, world, R, 0, 24.0, 0, 2.4, 1.0, 2.4, woodMat); // Pyramid pinnacle cap

  // Plaza protective boundary corner pillars
  createRigidMesh(scene, world, R, -20, 1.2, -20, 4, 2.4, 4, stoneMat);
  createRigidMesh(scene, world, R, 20, 1.2, -20, 4, 2.4, 4, stoneMat);
  createRigidMesh(scene, world, R, -20, 1.2, 20, 4, 2.4, 4, stoneMat);
  createRigidMesh(scene, world, R, 20, 1.2, 20, 4, 2.4, 4, stoneMat);

  // ── QUADRANT 1: HIGH-DENSITY RESIDENTIAL SECTOR (NORTH-WEST) ─────────────────
  const nwGrass = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), grassMat); nwGrass.rotation.x = -Math.PI / 2; nwGrass.position.set(-70, 0.03, 70); scene.add(nwGrass);

  // Modular Multi-Tenant Apartment Complexes
  createRigidMesh(scene, world, R, -74, 12, 116, 24, 24, 22, stoneMat);
  createRigidMesh(scene, world, R, -74, 24.2, 116, 25, 0.4, 23, roofMat);
  createRigidMesh(scene, world, R, -114, 12, 116, 24, 24, 22, stoneMat);
  createRigidMesh(scene, world, R, -114, 24.2, 116, 25, 0.4, 23, roofMat);

  // Symmetrically Packed Grid of Residential Row Houses
  buildDetailedRowHouse(scene, world, R, -38, 42, 12, 9, 14, Math.PI / 2);
  buildDetailedRowHouse(scene, world, R, -38, 59, 12, 9, 14, Math.PI / 2);
  buildDetailedRowHouse(scene, world, R, -38, 76, 12, 9, 14, Math.PI / 2);
  buildDetailedRowHouse(scene, world, R, -38, 93, 12, 9, 14, Math.PI / 2);
  buildDetailedRowHouse(scene, world, R, -56, 42, 12, 9, 14, Math.PI / 2);
  buildDetailedRowHouse(scene, world, R, -56, 59, 12, 9, 14, Math.PI / 2);
  buildDetailedRowHouse(scene, world, R, -56, 76, 12, 9, 14, Math.PI / 2);
  buildDetailedRowHouse(scene, world, R, -56, 93, 12, 9, 14, Math.PI / 2);

  // Back Corner Power Transformer Station & Security Mesh Cage
  createRigidMesh(scene, world, R, -118, 4, 76, 16, 8, 22, borderMat, 0, false);
  createRigidMesh(scene, world, R, -120, 5, 78, 5, 10, 5, stoneMat);
  createRigidMesh(scene, world, R, -114, 3, 72, 4, 6, 4, crateMat);

  // ── QUADRANT 2: CONTAINER FREIGHT YARD & HEAVY INDUSTRY (SOUTH-WEST) ─────────
  const swTarmac = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), stoneMat); swTarmac.rotation.x = -Math.PI / 2; swTarmac.position.set(-70, 0.03, -70); scene.add(swTarmac);

  // Main Logistics Hangar Assembly Plant
  createRigidMesh(scene, world, R, -68, 6, -54, 46, 12, 32, crateMat);
  createRigidMesh(scene, world, R, -68, 12.3, -54, 48, 0.6, 34, roofMat);
  createRigidMesh(scene, world, R, -84, 18, -64, 2.5, 12, 2.5, stoneMat); // Smokestack stack

  // Asymmetrical Multi-Color Double-Stacked Shipping Containers Grid
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

  // Left Wing Sideways Containers
  createRigidMesh(scene, world, R, -122, 2.5, -42, 7, 5, 14, borderMat);
  createRigidMesh(scene, world, R, -122, 7.5, -42, 7, 5, 14, roofMat);
  createRigidMesh(scene, world, R, -122, 2.5, -58, 7, 5, 14, crateMat);
  createRigidMesh(scene, world, R, -122, 7.5, -58, 7, 5, 14, woodMat);
  createRigidMesh(scene, world, R, -122, 2.5, -74, 7, 5, 14, woodMat);
  createRigidMesh(scene, world, R, -122, 7.5, -74, 7, 5, 14, borderMat);

  // Internal Storage Lanes
  createRigidMesh(scene, world, R, -106, 2.5, -42, 7, 5, 14, crateMat);
  createRigidMesh(scene, world, R, -106, 2.5, -58, 7, 5, 14, roofMat);
  createRigidMesh(scene, world, R, -106, 2.5, -74, 7, 5, 14, borderMat);

  // Chemical Refinery Processing Station Storage Silos
  createRigidMesh(scene, world, R, -125, 7, -132, 12, 14, 12, stoneMat); // Liquid tank silo 1
  createRigidMesh(scene, world, R, -109, 5, -132, 8, 10, 8, stoneMat);   // Liquid tank silo 2

  // Tactical Player Obstacle Crate Piles
  createRigidMesh(scene, world, R, -36, 1.5, -36, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -31, 1.5, -36, 3, 3, 3, woodMat);
  createRigidMesh(scene, world, R, -34, 4.2, -36, 2.5, 2.5, 2.5, crateMat);

  // ── QUADRANT 3: DOWNTOWN COMMERCIAL COMMERCIAL PLAZA (TOP-RIGHT) ─────────────
  const nePlaza = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), woodMat); nePlaza.rotation.x = -Math.PI / 2; nePlaza.position.set(70, 0.03, 70); scene.add(nePlaza);

  // Grand Wholesale Anchor Superstore Center
  createRigidMesh(scene, world, R, 112, 7.5, 48, 38, 15, 26, roofMat);
  createRigidMesh(scene, world, R, 112, 11.5, 61.1, 16, 3, 0.2, stoneMat); // Top name sign strip

  // Front Row Commercial Shopping Boutiques Line
  buildDetailedShop(scene, world, R, 54, 40, 16, 9, 14, woodMat);
  buildDetailedShop(scene, world, R, 54, 57, 16, 9, 14, borderMat);
  buildDetailedShop(scene, world, R, 54, 74, 16, 9, 14, stoneMat);

  // Highrise Towers Holding High Traffic Skybridge Overpass
  createRigidMesh(scene, world, R, 40, 15, 122, 18, 30, 18, stoneMat);
  createRigidMesh(scene, world, R, -40, 15, 122, 18, 30, 18, stoneMat); // Twin tower structural pillar opposite side
  createRigidMesh(scene, world, R, 0, 28.5, 122, 62, 1.0, 6.5, borderMat); // Skyway structural transit platform

  // Deep-Corner High Voltage Radio Signal Mast Array
  createRigidMesh(scene, world, R, 126, 16, 126, 4, 32, 4, borderMat);
  createRigidMesh(scene, world, R, 126, 36, 126, 2, 8, 2, woodMat);

  // ── QUADRANT 4: CIVIC MUNICIPAL CENTRE & CLOCK TOWER (SOUTH-EAST) ────────────
  const seGrass = new THREE.Mesh(new THREE.PlaneGeometry(108, 108), grassMat); seGrass.rotation.x = -Math.PI / 2; seGrass.position.set(70, 0.03, -70); scene.add(seGrass);

  // Symmetrical Neo-Classical Pillars Municipal Bank Office
  createRigidMesh(scene, world, R, 66, 6, -54, 34, 13, 24, stoneMat);
  createRigidMesh(scene, world, R, 66, 0.4, -38, 20, 0.8, 4, stoneMat); // Entry portico deck platform
  createRigidMesh(scene, world, R, 66, 14.5, -41, 34, 3.0, 4, roofMat);  // Triangle roof front apex facade
  createRigidMesh(scene, world, R, 55, 6, -39, 1.2, 13, 1.2, borderMat); // Pillar column 1
  createRigidMesh(scene, world, R, 66, 6, -39, 1.2, 13, 1.2, borderMat); // Pillar column 2
  createRigidMesh(scene, world, R, 77, 6, -39, 1.2, 13, 1.2, borderMat); // Pillar column 3

  // Historical Records City Archives Hall Office Annex
  createRigidMesh(scene, world, R, 112, 5.5, -54, 24, 11, 24, woodMat);
  createRigidMesh(scene, world, R, 112, 11.2, -54, 25, 0.5, 25, roofMat);

  // Open Scaffold Lattice Framework Scenic Observation Clock Tower Bastion
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

  // Embedded multi-faceted geometric clock interface disk plate module
  const faceGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.5, 8); faceGeo.rotateX(Math.PI / 2);
  const faceMesh = new THREE.Mesh(faceGeo, borderMat); faceMesh.position.set(122, ctH + 5.0, -117.7); scene.add(faceMesh);

  // ── STREETSIDE INTERSECTION LIGHT POSTS PLACEMENTS ────────────────────────────
  buildStreetLight(scene, world, R, -15, 33, 0);
  buildStreetLight(scene, world, R, 15, 33, Math.PI);
  buildStreetLight(scene, world, R, -15, -33, 0);
  buildStreetLight(scene, world, R, 15, -33, Math.PI);
  buildStreetLight(scene, world, R, 33, 15, Math.PI / 2);
  buildStreetLight(scene, world, R, 33, -15, -Math.PI / 2);
  buildStreetLight(scene, world, R, -33, 15, Math.PI / 2);
  buildStreetLight(scene, world, R, -33, -15, -Math.PI / 2);

  // ── HIGH-DENSITY SIDEWALK PERIMETER TREES MATRIX BLOCKS ───────────────────────
  const treeGrid = [
    [-15, 36], [-15, 52], [-15, 68], [-15, 84], [-15, 100], [-15, 116], [-15, 132],
    [15, 36], [15, 52], [15, 68], [15, 84], [15, 100], [15, 116], [15, 132],
    [-15, -36], [-15, -52], [-15, -68], [-15, -84], [-15, -100], [-15, -116], [-15, -132],
    [15, -36], [15, -52], [15, -68], [15, -84], [15, -100], [15, -116], [15, -132],
    [36, 15], [52, 15], [68, 15], [84, 15], [100, 15], [116, 15], [132, 15],
    [36, -15], [52, -15], [68, -15], [84, -15], [100, -15], [116, -15], [132, -15],
    [-36, 15], [-52, 15], [-68, 15], [-84, 15], [-100, 15], [-116, 15], [-132, 15],
    [-36, -15], [-52, -15], [-68, -15], [-84, -15], [-100, -15], [-116, -15], [-132, -15]
  ];
  treeGrid.forEach(([tx, tz]) => { buildPropTree(scene, world, R, tx, tz); });
}
