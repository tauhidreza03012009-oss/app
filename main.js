import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import RAPIER from "https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.14.0";

let scene, camera, renderer;
let physicsWorld;
let fallingCubeMesh, fallingCubeBody;
const joystickInput = { x: 0, z: 0 };

async function init() {
    for(let i=0;i<2000;i++){
        console.log("fine")}
    try {
        // Initialize the WebAssembly binary physics module
        await RAPIER.init();
        setupGraphics();
        setupPhysics();
        buildRoom();
        spawnDynamicCube();
        setupJoystick();
        animate();
    } catch (err) {
        alert("Initialization Block Failed: " + err.message);
    }
}

function setupGraphics() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 12, 14);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    document.getElementById('game-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
}

function setupPhysics() {
    const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    physicsWorld = new RAPIER.World(gravity);
}

function buildRoom() {
    // Floor
    const floorGeo = new THREE.BoxGeometry(100, 1, 100);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x44fa44 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const floorBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0.5, 0);
    const floorBody = physicsWorld.createRigidBody(floorBodyDesc);
    physicsWorld.createCollider(RAPIER.ColliderDesc.cuboid(50, 0.5, 50), floorBody);

    // Dynamic Bounds Walls
    const wallConfigs = [
        { pos: [0, 2, -5], size: [10, 4, 1.5],  color: 0x666666 },
        { pos: [0, 2, 5],  size: [10, 4, 0.1],  color: 0x88ccff },
        { pos: [5, 2, 0],  size: [0.5, 4, 10],  color: 0x775555 }
    ];

    wallConfigs.forEach(config => {
        const wallGeo = new THREE.BoxGeometry(...config.size);
        const wallMat = new THREE.MeshStandardMaterial({ color: config.color });
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.position.set(...config.pos);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        scene.add(wallMesh);

        const wallBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(...config.pos);
        const wallBody = physicsWorld.createRigidBody(wallBodyDesc);
        physicsWorld.createCollider(RAPIER.ColliderDesc.cuboid(config.size[0]/2, config.size[1]/2, config.size[2]/2), wallBody);
    });
}

function spawnDynamicCube() {
    const size = 1.0;
    const cubeGeo = new THREE.BoxGeometry(size, size, size);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    fallingCubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
    fallingCubeMesh.castShadow = true;
    scene.add(fallingCubeMesh);

    const cubeBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 10, 0);
    fallingCubeBody = physicsWorld.createRigidBody(cubeBodyDesc);

    const cubeColliderDesc = RAPIER.ColliderDesc.cuboid(size/2, size/2, size/2)
        .setRestitution(0.3)
        .setFriction(0.8);
    physicsWorld.createCollider(cubeColliderDesc, fallingCubeBody);
}

function setupJoystick() {
    const zone = document.getElementById('joystick-zone');
    const handle = document.getElementById('joystick-handle');
    
    const maxRadius = 50; 
    let activeTouchId = null;
    let startX = 0, startY = 0;

    zone.addEventListener('touchstart', (e) => {
        if (activeTouchId !== null) return;
        const touch = e.changedTouches[0];
        activeTouchId = touch.identifier;
        
        const rect = zone.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
        
        handleJoystickMove(touch.clientX, touch.clientY);
    });

    window.addEventListener('touchmove', (e) => {
        if (activeTouchId === null) return;
        
        for (let touch of e.touches) {
            if (touch.identifier === activeTouchId) {
                handleJoystickMove(touch.clientX, touch.clientY);
                break;
            }
        }
    }, { passive: false });

    const endTouch = (e) => {
        if (activeTouchId === null) return;
        
        for (let touch of e.changedTouches) {
            if (touch.identifier === activeTouchId) {
                activeTouchId = null;
                joystickInput.x = 0;
                joystickInput.z = 0;
                handle.style.transform = `translate(0px, 0px)`;
                break;
            }
        }
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);

    function handleJoystickMove(clientX, clientY) {
        let deltaX = clientX - startX;
        let deltaY = clientY - startY;
        let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > maxRadius) {
            deltaX = (deltaX / distance) * maxRadius;
            deltaY = (deltaY / distance) * maxRadius;
            distance = maxRadius;
        }

        handle.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        joystickInput.x = deltaX / maxRadius;
        joystickInput.z = deltaY / maxRadius;
    }
}

function handlePlayerMovement() {
    const currentVelocity = fallingCubeBody.linvel();
    const speedScale = 7.0;

    if (Math.abs(joystickInput.x) > 0.05 || Math.abs(joystickInput.z) > 0.05) {
        fallingCubeBody.setLinvel({
            x: joystickInput.x * speedScale,
            y: currentVelocity.y,
            z: joystickInput.z * speedScale
        }, true);
    }
}

function animate() {
    requestAnimationFrame(animate);

    handlePlayerMovement();
    physicsWorld.step();

    const rawPos = fallingCubeBody.translation();
    const rawRot = fallingCubeBody.rotation();

    fallingCubeMesh.position.set(rawPos.x, rawPos.y, rawPos.z);
    fallingCubeMesh.quaternion.set(rawRot.x, rawRot.y, rawRot.z, rawRot.w);

    camera.lookAt(rawPos.x, rawPos.y + 1, rawPos.z);
    camera.position.set(rawPos.x, rawPos.y + 1.5, rawPos.z + 2);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Run application setup
init();
