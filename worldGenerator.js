import * as THREE from 'three';
import { grassMat, pathMat, woodMat, roofMat, leafMat, stoneMat, crateMat, borderMat } from './materials.js';

// ── UTILITY: EXACT OBJECT PLACEMENT ──────────────────────────────────────────
function spawnBlock(scene, world, R, x, z, size, height, material, castShadow = true) {
  const y = height / 2;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, height, size), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  scene.add(mesh); 

  const rb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z));
  world.createCollider(R.ColliderDesc.cuboid(size / 2, height / 2, size / 2), rb);
}

// ── THE VISUAL CITY BLUEPRINT MATRIX ─────────────────────────────────────────
// Each character represents a 10x10 area. Total map size: 300x300 units.
// W = Outer Wall, . = Grass, R = Main Roads, M = Central Monument
// H = Residential Row Houses, A = Concrete High-rises, P = Power Plant Substation
// C = Industrial Cargo Containers, F = Factory Hangar, T = Tank Infrastructure
// S = Commercial Shops, D = Department Store, B = Bank Plaza, K = Clock Tower
const CITY_MAP = [
  "WWWWWWWWWWWWWWWWRRWWWWWWWWWWWWWW",
  "W P P P . A A . R R . D D D .  W",
  "W P P P . A A . R R . D D D .  W",
  "W . . . . A A . R R . . S 1 .  W",
  "W . H H . . . . R R . . S 2 .  W",
  "W . H H . . . . R R . . . . .  W",
  "W . H H . . . . R R . . . . .  W",
  "W . H H . . . . R R . . . . .  W",
  "W . . . . . . . R R . . . . .  W",
  "W . . . . . . 🌳 R R 🌳 . . . .  W",
  "W . . . . . . 🌳 R R 🌳 . . . .  W",
  "W . . . . . . 🌳 R R 🌳 . . . .  W",
  "W . . . . . . 🌳 R R 🌳 . . . .  W",
  "W . . . . . . 🌳 R R 🌳 . . . .  W",
  "W . . . . . . 🌳 R R 🌳 . . . .  W",
  "RRRRRRRRRRRRRRRR M RRRRRRRRRRRRR",
  "RRRRRRRRRRRRRRRR M RRRRRRRRRRRRR",
  "W . . . . . . 🌳 R R 🌳 . . . .  W",
  "W . . . . . . 🌳 R R 🌳 . . . .  W",
  "W . . . . . . 🌳 R R 🌳 . . . .  W",
  "W . F F F . . 🌳 R R 🌳 . B B .  W",
  "W . F F F . . 🌳 R R 🌳 . B B .  W",
  "W . F F F . . . R R . . . . .  W",
  "W C C C C . . . R R . . . . .  W",
  "W C C C C . . . R R . . . . .  W",
  "W C C C C . . . R R . . . . .  W",
  "W T T . . . . . R R . . . . K  W",
  "W T T . . . . . R R . . . . .  W",
  "WWWWWWWWWWWWWWWWRRWWWWWWWWWWWWWW"
];

const TILE_SIZE = 10;

export function buildMapLayout(scene, world, R, MAP_SIZE) {
  // 1. Base Concrete Ground Plate
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE), stoneMat); 
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const fBody = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(R.ColliderDesc.cuboid(MAP_SIZE / 2, 0.5, MAP_SIZE / 2), fBody);

  // 2. Clear Sky Dome Background
  const geo = new THREE.SphereGeometry(290, 24, 12);
  const mat = new THREE.MeshBasicMaterial({ color: 0x9eccfa, side: THREE.BackSide, fog: false });
  scene.add(new THREE.Mesh(geo, mat));

  // Calculate top-left starting offset based on Matrix array dimensions
  const mapRows = CITY_MAP.length;
  const mapCols = CITY_MAP[0].length;
  const startX = -(mapCols * TILE_SIZE) / 2 + TILE_SIZE / 2;
  const startZ = -(mapRows * TILE_SIZE) / 2 + TILE_SIZE / 2;

  // 3. PARSE THE MATRIX FOR EXACT SYSTEMATIC PLACEMENT
  for (let r = 0; r < mapRows; r++) {
    for (let c = 0; c < mapCols; c++) {
      const char = CITY_MAP[r][c];
      const x = startX + c * TILE_SIZE;
      const z = startZ + r * TILE_SIZE;

      switch (char) {
        case 'W': // Outer Security Border Wall Perimeter
          spawnBlock(scene, world, R, x, z, TILE_SIZE, 16, borderMat, false);
          break;

        case 'R': // Asphalt Avenues Grid Lanes
          const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE), pathMat);
          roadMesh.rotation.x = -Math.PI / 2;
          roadMesh.position.set(x, 0.02, z);
          roadMesh.receiveShadow = true;
          scene.add(roadMesh);
          break;

        case 'M': // Center Complex Monument Plaza Base
          spawnBlock(scene, world, R, x, z, TILE_SIZE, 1.2, stoneMat);
          // Add a tall narrow column spike directly in the absolute middle cell
          if (r === 15 && c === 16) {
            spawnBlock(scene, world, R, x, z, 3, 15, stoneMat);
            spawnBlock(scene, world, R, x, 15.5, z, 1.8, woodMat);
          }
          break;

        case '🌳': // Low Poly Box Sidewalk Trees Flanking Roads
          // Base road canvas plate underneath tree sidewalk zone
          const sideWalk = new THREE.Mesh(new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE), pathMat);
          sideWalk.rotation.x = -Math.PI / 2;
          sideWalk.position.set(x, 0.01, z);
          scene.add(sideWalk);
          // Trunk
          spawnBlock(scene, world, R, x, z, 0.8, 4.5, woodMat);
          // Foliage block
          spawnBlock(scene, world, R, x, 5.5, z, 3.5, 2.5, leafMat, false);
          break;

        case 'H': // Residential Block: Slanted Style Row House Base
          spawnBlock(scene, world, R, x, z, TILE_SIZE - 1, 7, woodMat);
          // Layered roof system to form structural triangular volume
          spawnBlock(scene, world, R, x, 7.3, z, TILE_SIZE - 1, 0.6, roofMat);
          spawnBlock(scene, world, R, x, 7.9, z, TILE_SIZE - 4, 0.6, roofMat);
          break;

        case 'A': // High-Rise Concrete Apartment Tower Slabs
          spawnBlock(scene, world, R, x, z, TILE_SIZE - 0.5, 24, stoneMat);
          break;

        case 'P': // Energy Infrastructure Grid Cage Substation
          spawnBlock(scene, world, R, x, z, TILE_SIZE, 8, borderMat, false);
          break;

        case 'F': // Industrial Factory Manufacturing Hangar
          spawnBlock(scene, world, R, x, z, TILE_SIZE, 12, crateMat);
          break;

        case 'C': // Colored Multi-stacked Logistics Freight Yard Containers
          const selectMat = (c % 2 === 0) ? roofMat : (c % 3 === 0 ? borderMat : crateMat);
          spawnBlock(scene, world, R, x, z, TILE_SIZE - 1, 5, selectMat);
          if ((r + c) % 2 === 0) { // Stack up secondary rows randomly
            const upMesh = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE - 1, 5, TILE_SIZE - 1), selectMat);
            upMesh.position.set(x, 7.5, z);
            upMesh.castShadow = true;
            scene.add(upMesh);
            
            const rbUp = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, 7.5, z));
            world.createCollider(R.ColliderDesc.cuboid((TILE_SIZE-1)/2, 2.5, (TILE_SIZE-1)/2), rbUp);
          }
          break;

        case 'T': // Heavy Liquid Liquid Process Storage Tanks
          spawnBlock(scene, world, R, x, z, TILE_SIZE - 2, 10, stoneMat);
          break;

        case 'S': // Street Front Retail Strip Outlets (Boutiques/Cafes)
          spawnBlock(scene, world, R, x, z, TILE_SIZE - 1, 8, stoneMat);
          // Decorative sign overlay boards matching render blocks
          spawnBlock(scene, world, R, x, 7, z + 4, TILE_SIZE - 2, 1.5, woodMat);
          break;

        case 'D': // Corner Wholesale Department Store Center
          spawnBlock(scene, world, R, x, z, TILE_SIZE - 0.5, 11, roofMat);
          break;

        case 'B': // Municipal Institutional Bank Headquarter Complex
          spawnBlock(scene, world, R, x, z, TILE_SIZE - 0.5, 13, stoneMat);
          break;

        case 'K': // Structural Open Scaffold Clock Tower Bastion
          // Slender frame column corners
          spawnBlock(scene, world, R, x - 3.5, z - 3.5, 0.6, 16, borderMat);
          spawnBlock(scene, world, R, x + 3.5, z - 3.5, 0.6, 16, borderMat);
          spawnBlock(scene, world, R, x - 3.5, z + 3.5, 0.6, 16, borderMat);
          spawnBlock(scene, world, R, x + 3.5, z + 3.5, 0.6, 16, borderMat);
          // Solid clock housing head unit sitting safely on high tiers
          spawnBlock(scene, world, R, x, 18, z, 8, 5, stoneMat);
          break;
      }
    }
  }
}
