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



let scene, camera, renderer, cube;

function init3D() {
    const container = document.getElementById('game-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0,5,10)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:"green"}))
    ground.rotation.x=-Math.PI/2;
    scene.add(ground);
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0xa370f5});
    cube = new THREE.Mesh(geometry, material);
    cube.position.y=1
    scene.add(cube);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

init3D();
