import * as THREE from 'three';
import { createWorld } from './scene/world.js';
import { createFPSControls } from './controls/fpsControls.js';
import { createMobileControls } from './controls/mobileControls.js';
import { createCycle } from './animation/cycle.js';
import { updateHUD } from './ui/hud.js';
import { setupTouchUI, isTouchDevice } from './ui/touchControls.js';
import { createControlPanel } from './ui/controlPanel.js';

const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a3242);
scene.fog = new THREE.Fog(0x2a3242, 100, 240);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);

const world = createWorld(scene);
const cycle = createCycle(world);

const touch = isTouchDevice();
const PIP_W = touch ? 160 : 280;
const PIP_H = touch ? 120 : 200;
const PIP_M = 12;

// PIP камера
const pipCamera = new THREE.PerspectiveCamera(50, PIP_W / PIP_H, 0.1, 500);
const curPipPos = new THREE.Vector3(-15, 15, 15);
const curPipTarget = new THREE.Vector3(-22, 6, 0);
const PHASE_CAMERAS = [
  { pos: [-18, 18, 15], target: [-25, 4, 0] },   // 1
  { pos: [-19, 12, 10], target: [-25, 4, 0] },   // 2
  { pos: [-19, 10, 10], target: [-25, 4, 0] },   // 3
  { pos: [-22, 6, 12], target: [-22, 3, 0] },    // 4
  { pos: [-19, 10, -10], target: [-25, 4, 0] },  // 5
  { pos: [-12, 10, 10], target: [-10, 2, 0] },   // 6
  { pos: [-2, 10, 10], target: [-6, 4, 0] },     // 7
  { pos: [0, 12, 10], target: [-2, 4, 0] },      // 8
  { pos: [5, 15, 10], target: [3, 6, -6] },      // 9 — виден кран с ковшом
  { pos: [18, 8, 5], target: [12, 4, -12] },     // 10
];
const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
function updatePipCamera(dt) {
  const cam = PHASE_CAMERAS[cycle.getPhase().index] || PHASE_CAMERAS[0];
  tmpPos.set(...cam.pos);
  tmpTarget.set(...cam.target);
  const k = Math.min(1, dt * 2.5);
  curPipPos.lerp(tmpPos, k);
  curPipTarget.lerp(tmpTarget, k);
  pipCamera.position.copy(curPipPos);
  pipCamera.lookAt(curPipTarget);
}

const panel = createControlPanel(cycle, () => {
  if (!touch) renderer.domElement.requestPointerLock?.();
});
const isPanelClosed = () => !panel.isOpen();
const controls = touch
  ? createMobileControls(camera, renderer.domElement, isPanelClosed)
  : createFPSControls(camera, renderer.domElement, isPanelClosed);

const interactables = [{ object: world.desk.group, type: 'desk', range: 3.5 }];
controls.onAction((target) => { if (target.type === 'desk') panel.open(); });

setupTouchUI(touch);
if (!touch) {
  document.addEventListener('pointerlockchange', () => {
    document.getElementById('prompt').style.display = document.pointerLockElement ? 'none' : 'block';
  });
}
if (touch) document.getElementById('btn-pause').onclick = () => cycle.pause();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const tutorialEl = document.getElementById('tutorial');
const actionKey = touch ? 'кнопку F' : 'F';
const TUTORIAL_TEXTS = [
  '➤ Найдите пульт управления',
  `➤ Нажмите ${actionKey}, чтобы открыть пульт`,
  '➤ Нажмите «СТАРТ»',
  '',
];
function updateTutorial(target) {
  let step = 0;
  if (cycle.isRunning()) step = 3;
  else if (panel.isOpen()) step = 2;
  else if (target && target.type === 'desk') step = 1;
  const txt = TUTORIAL_TEXTS[step];
  if (txt) { tutorialEl.textContent = txt; tutorialEl.style.display = 'block'; }
  else { tutorialEl.style.display = 'none'; }
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const W = window.innerWidth, H = window.innerHeight;

  controls.update(dt, interactables);
  cycle.update(dt);
  updatePipCamera(dt);

  // Основной вид
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, W, H);
  renderer.autoClear = true;
  renderer.render(scene, camera);

  // PIP
  const pipX = W - PIP_W - PIP_M;
  const pipY = H - PIP_H - PIP_M;
  renderer.setScissorTest(true);
  renderer.setScissor(pipX, pipY, PIP_W, PIP_H);
  renderer.setViewport(pipX, pipY, PIP_W, PIP_H);
  renderer.render(scene, pipCamera);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, W, H);

  const target = controls.getPromptTarget();
  const promptEl = document.getElementById('prompt');
  if (!touch) {
    if (panel.isOpen()) promptEl.style.display = 'none';
    else if (target) { promptEl.style.display = 'block'; promptEl.textContent = 'F — открыть пульт'; }
    else if (!document.pointerLockElement) { promptEl.style.display = 'block'; promptEl.textContent = 'Кликните для захвата мыши'; }
    else promptEl.style.display = 'none';
  }

  updateTutorial(target);
  updateHUD(cycle);
}
animate();