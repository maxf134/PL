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
renderer.shadowMap.type = THREE.PCFShadowMap; 
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a3242);
scene.fog = new THREE.Fog(0x2a3242, 100, 240);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);

let world, cycle, controls, panel;
const touch = isTouchDevice();

const PIP_W  = touch ? 160 : 288;
const PIP_H  = touch ? 90  : 162;
const PIP_MR = 12;   
const PIP_MT = 24;   

const pipCamera = new THREE.PerspectiveCamera(50, PIP_W / PIP_H, 0.1, 500);
const curPipPos = new THREE.Vector3(-15, 15, 15);
const curPipTarget = new THREE.Vector3(-22, 6, 0);
const PHASE_CAMERAS = [
  { pos: [-18, 18, 15], target: [-25, 4, 0] },
  { pos: [-19, 12, 10], target: [-25, 4, 0] },
  { pos: [-19, 10, 10], target: [-25, 4, 0] },
  { pos: [-20, 16, 16], target: [-22, 4, 0] },
  { pos: [-19, 10, -10], target: [-25, 4, 0] },
  { pos: [-12, 10, 10], target: [-10, 2, 0] },
  { pos: [-2, 10, 10], target: [-6, 4, 0] },
  { pos: [0, 12, 10], target: [-2, 4, 0] },
  { pos: [5, 15, 10], target: [3, 6, -6] },
  { pos: [18, 8, 5], target: [12, 4, -12] },
];
const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

function updatePipCamera(dt) {
  if (!cycle) return;
  const cam = PHASE_CAMERAS[cycle.getPhase().index] || PHASE_CAMERAS[0];
  tmpPos.set(...cam.pos);
  tmpTarget.set(...cam.target);
  const k = Math.min(1, dt * 2.5);
  curPipPos.lerp(tmpPos, k);
  curPipTarget.lerp(tmpTarget, k);
  pipCamera.position.copy(curPipPos);
  pipCamera.lookAt(curPipTarget);
}

async function init() {
  document.getElementById('hud').innerHTML = 'Загрузка 3D моделей...';
  
  world = await createWorld(scene);
  cycle = createCycle(world);

  // ВОЗВРАЩАЕМ ЗАХВАТ МЫШИ ПРИ ЗАКРЫТИИ ПАНЕЛИ
  panel = createControlPanel(cycle, () => {
    if (!touch && document.pointerLockElement !== renderer.domElement) {
      // Небольшая задержка, чтобы браузер не блокировал запрос
      setTimeout(() => renderer.domElement.requestPointerLock(), 100);
    }
  });
  
  const isPanelClosed = () => !panel.isOpen();
  
  controls = touch
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
  if (touch) {
    document.getElementById('btn-pause').onclick = () => cycle.pause();
  }

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

  let lastTime = performance.now();

  function animate() {
    requestAnimationFrame(animate);
    
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    const W = window.innerWidth, H = window.innerHeight;

    controls.update(dt, interactables);
    cycle.update(dt);
    updatePipCamera(dt);

    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
    renderer.autoClear = true;
    renderer.render(scene, camera);

    const pipX = W - PIP_W - PIP_MR;
    const pipY = H - PIP_H - PIP_MT;
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
}

init();