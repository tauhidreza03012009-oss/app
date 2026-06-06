// 1. Service Worker & Fullscreen Immersion (Kept from earlier)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js'); });
}

function lockImmersive() {
    const doc = document.documentElement;
    if (doc.requestFullscreen) { doc.requestFullscreen({ navigationUI: "hide" }).catch(() => {}); }
    else if (doc.webkitRequestFullscreen) { doc.webkitRequestFullscreen(); }
}
window.addEventListener('touchstart', lockImmersive, { once: true });
window.addEventListener('click', lockImmersive, { once: true });


// 2. THREE.JS 3D CORE SETUP
let scene, camera, renderer, cube;

function init3D() {
    const container = document.getElementById('game-container');

    // Create the 3D Scene
    scene = new THREE.Scene();

    // Create the Camera (Field of view, Aspect Ratio, Near clip, Far clip)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Create the WebGL Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimizes performance for heavy mobile screens
    container.appendChild(renderer.domElement);

    // Create a simple 3D Box Geometry and Material
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xa370f7, wireframe: true });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Start the game loop
    animate();
}

// 3. Animation Loop (Runs 60+ times per second)
function animate() {
    requestAnimationFrame(animate);

    // Rotate the cube dynamically
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Render the scene from the perspective of the camera
    renderer.render(scene, camera);
}

// 4. Handle Window Resizing (Crucial when screen flips to landscape)
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Initialize the 3D environment when the script loads
init3D();
