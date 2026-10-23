import * as THREE from 'three';
import { MAT } from '../utils/materials.js';
import { LAYOUT } from './layout.js';
import { createEAF } from './equipment/eaf.js';
import { createLadleFurnace } from './equipment/ladleFurnace.js';
import { createCCM } from './equipment/ccm.js';
import { createCrane } from './equipment/crane.js';
import { createLadle } from './equipment/ladle.js';
import { createScrapBucket } from './equipment/scrapBucket.js';
import { createRollerTable } from './equipment/rollerTable.js';
import { createControlDesk } from './equipment/controlDesk.js';

function makeSteamTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.5, 'rgba(220,220,230,0.35)');
  g.addColorStop(1, 'rgba(200,200,210,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function createSteamEmitter(count = 10) {
  const group = new THREE.Group();
  const tex = makeSteamTexture();
  const particles = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
    const s = new THREE.Sprite(mat);
    s.scale.set(0.8, 0.8, 1);
    s.userData = { life: 0, maxLife: 1, vx: 0, vy: 0, vz: 0 };
    group.add(s);
    particles.push(s);
  }
  return { group, particles, active: false };
}

function createScrapParticles() {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(0.3, 0.3, 0.4);
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.7, roughness: 0.6 });
  for (let i = 0; i < 40; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    group.add(m);
  }
  return group;
}

export function createWorld(scene) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(LAYOUT.hall.w, LAYOUT.hall.d), MAT.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(LAYOUT.hall.w, LAYOUT.hall.w, 0x2f3542, 0x2f3542);
  grid.position.y = 0.01;
  scene.add(grid);

  const railMat = new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.9, roughness: 0.4 });
  for (const zz of [-0.6, 0.6]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(LAYOUT.rails.x2 - LAYOUT.rails.x1, 0.1, 0.15), railMat
    );
    rail.position.set((LAYOUT.rails.x1 + LAYOUT.rails.x2) / 2, 0.05, zz);
    scene.add(rail);
  }

  // Сталевоз — высокая платформа (1.0 м), ковш стоит на ней
  const car = new THREE.Mesh(new THREE.BoxGeometry(4, 1.0, 2.5), MAT.steelDark);
  car.position.set(LAYOUT.ladleStart.x, 0.5, LAYOUT.ladleStart.z);
  scene.add(car);

  scene.add(new THREE.HemisphereLight(0xd0e0ff, 0x4a4a52, 1.2));
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(30, 45, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;   sun.shadow.camera.bottom = -60;
  sun.shadow.camera.near = 1;   sun.shadow.camera.far = 200;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.55);
  fill.position.set(-30, 30, -20);
  scene.add(fill);

  const eaf    = createEAF(LAYOUT.eaf);
  const lf     = createLadleFurnace(LAYOUT.lf);
  const ccm    = createCCM(LAYOUT.ccm);
  const crane  = createCrane(LAYOUT.crane);
  const ladle  = createLadle(LAYOUT.ladleStart);
  const bucket = createScrapBucket(LAYOUT.bucketPark);
  const roller = createRollerTable(LAYOUT.roller.x, LAYOUT.roller.z1, LAYOUT.roller.z2);
  const desk   = createControlDesk(LAYOUT.desk);
  const scrapParticles = createScrapParticles();

  // Глобальная струя выпуска ЭДП → ковш
  const pourStream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 1, 8),
    new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0, depthWrite: false })
  );
  pourStream.visible = false;
  scene.add(pourStream);

  const ladleSteam = createSteamEmitter(8);
  ladleSteam.group.position.set(0, 2.0, 0);
  ladle.group.add(ladleSteam.group);

  const lfSteam = createSteamEmitter(10);
  lfSteam.group.position.set(0, 8.0, 0);
  lf.group.add(lfSteam.group);

  const ccmSteam = createSteamEmitter(10);
  ccmSteam.group.position.set(0, 7.6, -12);
  ccm.group.add(ccmSteam.group);

  scene.add(
    eaf.group, lf.group, ccm.group, crane.group, ladle.group,
    bucket.group, roller.group, desk.group, car, scrapParticles
  );

  return {
    eaf, lf, ccm, crane, ladle, bucket, roller, desk, car, scrapParticles,
    pourStream,
    steam: { ladle: ladleSteam, lf: lfSteam, ccm: ccmSteam },
  };
}