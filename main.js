
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import RAPIER from "https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.14.0";

async function initGame() {
    await RAPIER.init();

    const container = document.getElementById('game-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaccff);
    scene.fog = new THREE.FogExp2(0xaaccff, 0.015);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    const world = new RAPIER.World(gravity);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunLight.position.set(40, 60, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    const d = 40;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemisphereLight);

    const cloudGroup = new THREE.Group();
    const cloudGeo = new THREE.BoxGeometry(6, 1.5, 4);
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 15; i++) {
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set((Math.random() - 0.5) * 120, 25 + Math.random() * 5, (Math.random() - 0.5) * 120);
        cloudGroup.add(cloud);
    }
    scene.add(cloudGroup);

    const floorSize = 100;
    const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x557a46, roughness: 0.8 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.1;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const floorColliderDesc = RAPIER.ColliderDesc.cuboid(floorSize / 2, 0.1, floorSize / 2);
    world.createCollider(floorColliderDesc);

    const obstacleGroup = new THREE.Group();
    scene.add(obstacleGroup);

    function createBoxObstacle(x, y, z, w, h, d, color) {
        const meshGeo = new THREE.BoxGeometry(w, h, d);
        const meshMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });
        const mesh = new THREE.Mesh(meshGeo, meshMat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        obstacleGroup.add(mesh);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(x, y, z);
        world.createCollider(colliderDesc);
    }

    createBoxObstacle(0, 2.5, -15, 12, 5, 2, 0xffaa00);
    createBoxObstacle(-5, 0.5, -8, 2, 1, 2, 0x00ffcc);
    createBoxObstacle(-5, 1.5, -10, 2, 3, 2, 0x00ffcc);
    createBoxObstacle(-5, 2.5, -12, 2, 5, 2, 0x00ffcc);

    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff3366, roughness: 0.4 });
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    playerMesh.castShadow = true;
    playerMesh.receiveShadow = true;
    playerGroup.add(playerMesh);

    const visorGeo = new THREE.BoxGeometry(0.8, 0.3, 0.2);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.5, -0.51);
    playerGroup.add(visorMesh);

    const playerBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0.0, 5.0, 0.0);
    const playerBody = world.createRigidBody(playerBodyDesc);
    const playerColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 1.0, 0.5);
    const playerCollider = world.createCollider(playerColliderDesc, playerBody);
    const characterController = world.createCharacterController(0.1);

    // Optimized framing angle variables
    let cameraPitch = -0.2, cameraYaw = 0;
    const cameraDistance = 6, cameraHeight = 2.8;

    const joystickZone = document.getElementById('joystick-zone');
    const joystickHandle = document.getElementById('joystick-handle');
    let joystickActive = false, joystickTouchId = null;
    let moveVector = new THREE.Vector2(0, 0);
    const maxRadius = 50;

    joystickZone.addEventListener('touchstart', (e) => {
        joystickActive = true;
        joystickTouchId = e.changedTouches[0].identifier;
    });

    window.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === joystickTouchId) {
                const touch = e.touches[i];
                const rect = joystickZone.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                let deltaX = touch.clientX - centerX;
                let deltaY = touch.clientY - centerY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                if (distance > maxRadius) {
                    deltaX = (deltaX / distance) * maxRadius;
                    deltaY = (deltaY / distance) * maxRadius;
                }
                joystickHandle.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                moveVector.set(deltaX / maxRadius, deltaY / maxRadius);
            }
        }
    });

    window.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickTouchId) {
                joystickActive = false;
                joystickTouchId = null;
                joystickHandle.style.transform = 'translate(0px, 0px)';
                moveVector.set(0, 0);
            }
        }
    });

    let cameraTouchId = null, lastTouchX = 0, lastTouchY = 0;
    const sensitivity = 0.006;

    window.addEventListener('touchstart', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.clientX > window.innerWidth / 2 && cameraTouchId === null) {
                cameraTouchId = touch.identifier;
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
            }
        }
    });

    window.addEventListener('touchmove', (e) => {
        if (cameraTouchId === null) return;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === cameraTouchId) {
                const touch = e.touches[i];
                cameraYaw -= (touch.clientX - lastTouchX) * sensitivity;
                cameraPitch -= (touch.clientY - lastTouchY) * sensitivity;
                cameraPitch = Math.max(-Math.PI / 3.5, Math.min(Math.PI / 4, cameraPitch));
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
            }
        }
    });

    window.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === cameraTouchId) cameraTouchId = null;
        }
    });

    const clock = new THREE.Clock();
    const playerSpeed = 7.0;
    let verticalVelocity = 0;

    // --- ACCURATE FIXED TIME STEP VARIABLES ---
    const physicsTimeStep = 1 / 60; // Locked 60Hz physics frequency updates
    let physicsAccumulator = 0;

    function animate() {
        requestAnimationFrame(animate);
        
        // Track true frame delta time safely
        const rawDelta = clock.getDelta();
        physicsAccumulator += Math.min(rawDelta, 0.1);

        // Run Rapier Physics steps inside a fixed time block to entirely eliminate lag
        while (physicsAccumulator >= physicsTimeStep) {
            world.step();
            
            const movementDesired = new THREE.Vector3(0, 0, 0);
            if (moveVector.lengthSq() > 0) {
                const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
                const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
                movementDesired.addScaledVector(forward, -moveVector.y).addScaledVector(right, moveVector.x);
                movementDesired.normalize().multiplyScalar(playerSpeed * physicsTimeStep);
                
                // Direct rotation calculation without heavy processing calculations
                playerGroup.rotation.y = Math.atan2(movementDesired.x, movementDesired.z);
            }

            if (characterController.computedGrounded()) {
                verticalVelocity = -0.5;
            } else {
                verticalVelocity += gravity.y * physicsTimeStep;
            }
            movementDesired.y = verticalVelocity * physicsTimeStep;

            characterController.computeColliderMovement(playerCollider, movementDesired);
            const corrected = characterController.computedMovement();
            const currentPos = playerBody.translation();

            playerBody.setNextKinematicTranslation({
                x: currentPos.x + corrected.x,
                y: currentPos.y + corrected.y,
                z: currentPos.z + corrected.z
            });

physicsAccumulator -= physicsTimeStep;}// Instantly bind mesh rendering tracking directly to the physics step output
const finalPos = playerBody.translation();playerGroup.position.set(finalPos.x, finalPos.y, finalPos.z);// Standard direct camera orbit placement transformation
const camOffset = new THREE.Vector3(0, 0, cameraDistance).applyAxisAngle(new THREE.Vector3(1, 0, 0), cameraPitch).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);camera.position.copy(playerGroup.position).add(camOffset);camera.position.y += cameraHeight;camera.lookAt(playerGroup.position.clone().add(new THREE.Vector3(0, 1.3, 0)));// Frame-rate based scenery animation 
cloudGroup.children.forEach(c => {c.position.z += 1.5 * rawDelta;if (c.position.z > 60) c.position.z = -60;});renderer.render(scene, camera);}window.addEventListener('resize', () => {camera.aspect = window.innerWidth / window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth, window.innerHeight);});animate();}initGame().catch(err => alert("Init Error: " + err));
