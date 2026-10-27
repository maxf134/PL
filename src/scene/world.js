import * as THREE from 'three';
import { loadAllModels } from './loadModels.js';
import { createBuilding } from './building.js';
import { MAT } from '../utils/materials.js';
import { LAYOUT } from './layout.js';

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

export async function createWorld(scene) {
  // Оси (AxesHelper) удалены

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

  scene.add(new THREE.HemisphereLight(0xbccadd, 0x3a3a3e, 0.9));
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const sun = new THREE.DirectionalLight(0xfff2d0, 1.4);
  sun.position.set(30, 40, -30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;   sun.shadow.camera.bottom = -60;
  sun.shadow.camera.near = 1;   sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.4);
  fill.position.set(-30, 30, -20);
  scene.add(fill);

  const lampEAF = new THREE.PointLight(0xfff2d0, 90, 45, 1.4);
  lampEAF.position.set(LAYOUT.eaf.x, 16, 0);
  scene.add(lampEAF);
  const lampLF = new THREE.PointLight(0xfff2d0, 70, 40, 1.4);
  lampLF.position.set(LAYOUT.lf.x, 16, 0);
  scene.add(lampLF);
  const lampCCM = new THREE.PointLight(0xfff2d0, 90, 50, 1.4);
  lampCCM.position.set(LAYOUT.ccm.x, 16, -12);
  scene.add(lampCCM);

  const building = createBuilding(scene);

  console.log("⏳ Загрузка 3D моделей...");
  const models = await loadAllModels(scene);
  console.log("✅ Модели загружены!");

  models.crane.group.traverse((child) => {
    if (child.isMesh && (child.name.toLowerCase().includes('wire') || child.name.toLowerCase().includes('cable') || child.name.toLowerCase().includes('rope'))) {
      child.visible = false;
    }
  });

  const wMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const wireL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), wMat);
  const wireR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), wMat);
  scene.add(wireL);
  scene.add(wireR);
  models.crane.wireL = wireL;
  models.crane.wireR = wireR;

  if (!models.eaf.scrapPile) {
    const scrapPile = new THREE.Group();
    scrapPile.position.y = 1.5;
    scrapPile.visible = false;
    const scrapMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    for (let i = 0; i < 15; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.5), scrapMat);
      b.position.set((Math.random()-0.5)*2, Math.random()*0.3, (Math.random()-0.5)*2);
      scrapPile.add(b);
    }
    models.eaf.tilt.add(scrapPile);
    models.eaf.scrapPile = scrapPile;
  }

  if (!models.ladle.molten) {
    const moltenMat = new THREE.MeshBasicMaterial({ color: 0xff8822, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const molten = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), moltenMat);
    molten.rotation.x = -Math.PI / 2;
    molten.position.y = 0.2;
    models.ladle.group.add(molten);
    models.ladle.molten = molten;
  }

  if (!models.ccm.streamA) {
    const sA = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0 });
    const streamA = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 3.6, 8), sA);
    streamA.position.set(0, 9.2, -12);
    models.ccm.group.add(streamA);
    models.ccm.streamA = streamA;
  }
  if (!models.ccm.streamB) {
    const sB = new THREE.MeshBasicMaterial({ color: 0xff9933, transparent: true, opacity: 0 });
    const streamB = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 5.2, 8), sB);
    streamB.position.set(0, 3.6, -12);
    models.ccm.group.add(streamB);
    models.ccm.streamB = streamB;
  }
  
  if (!models.ccm.billet) {
    const bMat = new THREE.MeshStandardMaterial({ color: 0x8a2a12, emissive: 0x6a1a08, emissiveIntensity: 0.8 });
    const billet = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1), bMat);
    billet.visible = false;
    billet.position.y = 1.5; 
    models.ccm.group.add(billet);
    models.ccm.billet = billet;
  } else {
    models.ccm.billet.position.y = 1.5; 
  }

  if (!models.bucket.capPivot) {
    const pivot = new THREE.Group();
    if (models.bucket.bottomCap) {
      const cap = models.bucket.bottomCap;
      pivot.position.set(0, -1.5, 1.6); 
      models.bucket.group.add(pivot);
      cap.position.set(0, 0, -1.6); 
      pivot.add(cap);
    } else {
      models.bucket.group.add(pivot);
    }
    models.bucket.capPivot = pivot;
  }

  if (!models.eaf.electrodes) models.eaf.electrodes = [];
  if (!models.lf.electrodes) models.lf.electrodes = [];

  const pourStream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 1, 8),
    new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0 })
  );
  pourStream.visible = false;
  scene.add(pourStream);

  const scrapParticles = createScrapParticles();
  scene.add(scrapParticles);

  const ladleSteam = createSteamEmitter(4);
  ladleSteam.group.position.set(0, 3.2, 0);
  models.ladle.group.add(ladleSteam.group);

  const lfSteam = createSteamEmitter(10);
  lfSteam.group.position.set(0, 8.0, 0);
  models.lf.group.add(lfSteam.group);

  const ccmSteam = createSteamEmitter(10);
  ccmSteam.group.position.set(0, 7.6, -12);
  models.ccm.group.add(ccmSteam.group);

  return {
    ...models,
    car: models.car, 
    scrapParticles,
    pourStream,
    building,
    steam: { ladle: ladleSteam, lf: lfSteam, ccm: ccmSteam },
  };
}