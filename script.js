const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x86b2d6, 0.02); // лёгкий туман для глубины

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
hemi.position.set(0, 50, 0);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(10, 30, 10);
sun.castShadow = true;
scene.add(sun);

// Ground (grass)
const groundGeo = new THREE.PlaneGeometry(400, 400);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a7b3b, roughness: 1 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Simple path
const pathGeo = new THREE.PlaneGeometry(60, 8);
const pathMat = new THREE.MeshStandardMaterial({ color: 0xa79b8a });
const path = new THREE.Mesh(pathGeo, pathMat);
path.rotation.x = -Math.PI / 2;
path.position.y = 0.01;
scene.add(path);

// Benches / low-poly park props (boxes + cylinders as trees)
function makeBench(x, z, scale = 1) {
  const bGeo = new THREE.BoxGeometry(2 * scale, 0.4 * scale, 0.6 * scale);
  const bMat = new THREE.MeshStandardMaterial({ color: 0x6b4f3b });
  const bench = new THREE.Mesh(bGeo, bMat);
  bench.position.set(x, 0.2, z);
  scene.add(bench);
}
function makeTree(x,z) {
  const trunkGeo = new THREE.CylinderGeometry(0.2,0.3,2,8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b3b1b });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x,1,z);
  scene.add(trunk);
  const leavesGeo = new THREE.ConeGeometry(1.2,2.5,8);
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2c6b2b });
  const leaves = new THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.set(x,2.4,z);
  scene.add(leaves);
}

for (let i = -3; i <= 3; i++) {
  makeBench(12 + Math.random()*6, i*6 - 2, 1 - Math.random()*0.3);
  makeBench(-12 - Math.random()*6, i*6 + 2, 1 - Math.random()*0.3);
}
for (let i = 0; i < 18; i++) {
  const rx = (Math.random()-0.5)*160;
  const rz = (Math.random()-0.5)*160;
  if (Math.hypot(rx, rz) < 15) continue;
  makeTree(rx, rz);
}

// Statue: we'll create a sprite with a generated "PNG-like" canvas texture.
// Sprites in Three.js always face the camera by default (billboard).
// Загрузка текстуры PNG для статуи
const loader = new THREE.TextureLoader();
const texture = loader.load('https://raw.githubusercontent.com/MaisLaufen/portfolio/refs/heads/master/statue.png');

const statueMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
const statue = new THREE.Sprite(statueMaterial);
statue.scale.set(4, 6, 1); // тот же размер, что был
statue.position.set(0, 3, 0);
scene.add(statue);

// --- модальное окно ---
const modal = document.getElementById('modal');

// Raycaster для кликов
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(statue);
  if (intersects.length > 0) {
    const playerPos = yawObject.position;
    const dist = playerPos.distanceTo(statue.position);

    if (dist <= 10) {
      // Если модалка открыта — закрыть, иначе открыть
      modal.classList.toggle('hidden');
    }
  }
}

window.addEventListener('click', onClick);

window.addEventListener('click', onClick);

// Add a low, round pedestal
const pedestalGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.6, 24);
const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x7a6e62 });
const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
pedestal.position.set(0, 0.3, 0);
scene.add(pedestal);

// Camera control setup: yaw (y-axis) and pitch (x-axis) objects
const yawObject = new THREE.Object3D();
const pitchObject = new THREE.Object3D();
yawObject.add(pitchObject);
pitchObject.add(camera);
scene.add(yawObject);

// Start position
yawObject.position.set(0, 1.6, 12); // player eye height ~1.6

// Pointer lock and instructions
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');

startBtn.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

// Pointer lock change
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  overlay.classList.toggle('hidden', locked);
});

// Mouse look
let pitch = 0, yaw = 0;
const PI_2 = Math.PI / 2;
const sensitivity = 0.0025;

function onMouseMove(e) {
  if (document.pointerLockElement !== renderer.domElement) return;
  yaw -= e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;
  // clamp pitch
  pitch = Math.max(-PI_2 + 0.01, Math.min(PI_2 - 0.01, pitch));
  yawObject.rotation.y = yaw;
  pitchObject.rotation.x = pitch;
}
window.addEventListener('mousemove', onMouseMove, false);

// Movement
const move = { forward:false, back:false, left:false, right:false };
const velocity = new THREE.Vector3();
const speed = 6.0; // units per second

function onKeyDown(e) {
  switch (e.code) {
    case 'KeyW': move.forward = true; break;
    case 'KeyS': move.back = true; break;
    case 'KeyA': move.left = true; break;
    case 'KeyD': move.right = true; break;
  }
}
function onKeyUp(e) {
  switch (e.code) {
    case 'KeyW': move.forward = false; break;
    case 'KeyS': move.back = false; break;
    case 'KeyA': move.left = false; break;
    case 'KeyD': move.right = false; break;
  }
}
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

// simple collision bounds (keep player within a radius)
const worldRadius = 180;

// helper to move in the direction camera faces (ignoring pitch)
function movePlayer(delta) {
  const dir = new THREE.Vector3();
  if (move.forward) dir.z -= 1;
  if (move.back) dir.z += 1;
  if (move.left) dir.x -= 1;
  if (move.right) dir.x += 1;
  if (dir.lengthSq() === 0) return;

  dir.normalize();
  // rotate by yaw (y-axis)
  const angle = yawObject.rotation.y;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const dx = dir.x * cos - dir.z * sin;
  const dz = dir.x * sin + dir.z * cos;

  yawObject.position.x += dx * speed * delta;
  yawObject.position.z += dz * speed * delta;

  // keep in bounds
  const r = Math.hypot(yawObject.position.x, yawObject.position.z);
  if (r > worldRadius) {
    yawObject.position.x *= worldRadius / r;
    yawObject.position.z *= worldRadius / r;
  }
}

// Resize handling
window.addEventListener('resize', onWindowResize);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Optional: show a simple FPS-ish text
const fpsDisplay = document.getElementById('fps');
let prevTime = performance.now();
let frames = 0;
let fps = 0;

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now();
  const delta = Math.min(0.05, (time - prevTime) / 1000); // clamp delta
  prevTime = time;

  movePlayer(delta);

  // make the statue slowly turn its sprite alpha based on distance (optional subtle effect)
  // Not needed: sprites face camera by default.

  renderer.render(scene, camera);

  // fps simple
  frames++;
  if (time % 1000 < 17) { // approx each second
    fps = Math.round(1 / delta);
    fpsDisplay.textContent = `FPS ~ ${fps}`;
  }
}

animate();