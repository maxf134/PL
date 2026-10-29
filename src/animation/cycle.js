import * as THREE from 'three';
import { LAYOUT } from '../scene/layout.js';

const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

const TRAVEL_Y = 19; 
const BUCKET_GRAB_Y = 3.0; 
const BUCKET_PARK_Y = LAYOUT.bucketPark.y;
const CCM_HOOK_Y = 10.5; 

function updateSteam(emitter, dt) {
  if (!emitter.active) {
    for (const s of emitter.particles) { s.material.opacity = 0; s.userData.life = 0; }
    return;
  }
  for (const s of emitter.particles) {
    if (s.userData.life <= 0) {
      s.position.set((Math.random() - 0.5) * 1.2, Math.random() * 0.3, (Math.random() - 0.5) * 1.2);
      s.userData.life = 1.2 + Math.random() * 1.5;
      s.userData.maxLife = s.userData.life;
      s.userData.vx = (Math.random() - 0.5) * 0.3;
      s.userData.vy = 0.7 + Math.random() * 0.6;
      s.userData.vz = (Math.random() - 0.5) * 0.3;
    }
    s.userData.life -= dt;
    const k = Math.max(0, s.userData.life / s.userData.maxLife);
    s.position.x += s.userData.vx * dt;
    s.position.y += s.userData.vy * dt;
    s.position.z += s.userData.vz * dt;
    s.material.opacity = k * 0.3;
    const sc = 0.5 + (1 - k) * 0.7;
    s.scale.set(sc, sc, 1);
  }
}

export function createCycle(world) {
  const scale = world.crane.group.scale.y || 1;
  const bridgeLocalY = world.crane.bridge ? world.crane.bridge.position.y : 20;

  const home = {
    craneX: LAYOUT.eaf.x, craneZ: LAYOUT.eaf.z, 
    hookY: TRAVEL_Y,
    grabOffset: 0,
    bucketAttached: false,
    bucketOpen: 0,
    scrapDropped: false, 
    roofSwing: 0, electrodesUp: 0, electrodeMelt: 0,
    arcGlow: 0, eafTilt: 0,
    lfRoofY: 0,
    ladleX: LAYOUT.ladleStart.x, ladleY: 1.0, ladleZ: LAYOUT.ladleStart.z,
    carX: LAYOUT.ladleStart.x,
    billetFront: -12,
    molten: 0, ladleStream: 0, ccmStreamA: 0, ccmStreamB: 0,
    steamLadle: 0, steamLf: 0, steamCcm: 0,
    hasScrap: 0,
  };
  const state = { ...home };
  const s0 = { ...home };

  let phaseIndex = 0, phaseTime = 0, running = false, paused = false, finished = false;

  const scrap = world.scrapParticles.children;
  const scrapSt = scrap.map(() => ({ alive: false, vx: 0, vy: 0, vz: 0 }));
  
  function spawnScrap(cx, cy, cz) {
    for (let i = 0; i < scrap.length; i++) {
      const s = scrap[i], st = scrapSt[i];
      s.position.set(cx + (Math.random() - 0.5) * 1.2, cy + Math.random() * 0.3, cz + (Math.random() - 0.5) * 1.2);
      st.vx = (Math.random() - 0.5) * 0.8;
      st.vy = -1 - Math.random() * 1.5;
      st.vz = (Math.random() - 0.5) * 0.8;
      st.alive = true; s.visible = true;
    }
  }
  
  function updateScrap(dt) {
    for (let i = 0; i < scrap.length; i++) {
      const s = scrap[i], st = scrapSt[i];
      if (!st.alive) continue;
      st.vy -= 9.8 * dt;
      s.position.x += st.vx * dt;
      s.position.y += st.vy * dt;
      s.position.z += st.vz * dt;
      s.rotation.x += dt * 2; s.rotation.y += dt * 3;
      if (s.position.y < 2.5) { st.alive = false; s.visible = false; }
    }
  }

  const pickupX = LAYOUT.rails.x2; 
  const pickupZ = 0; 
  const ccmPour = { x: LAYOUT.ccm.x, z: LAYOUT.ccm.z - 12 };

  const phases = [
    { name: '1. Загрузка лома в ЭДП', duration: 20, apply(s, s0, t) {
      if (t < 0.05) { s.electrodesUp = easeInOut(t / 0.05); s.roofSwing = 0; }
      else if (t < 0.10) { s.electrodesUp = 1; s.roofSwing = easeInOut((t - 0.05) / 0.05); }
      else if (t < 0.85) { s.electrodesUp = 1; s.roofSwing = 1; }
      else if (t < 0.90) { s.electrodesUp = 1; s.roofSwing = 1 - easeInOut((t - 0.85) / 0.05); }
      else if (t < 0.95) { s.roofSwing = 0; s.electrodesUp = 1 - easeInOut((t - 0.90) / 0.05); }
      else { s.roofSwing = 0; s.electrodesUp = 0; }

      const parkX = LAYOUT.bucketPark.x;
      const parkZ = LAYOUT.bucketPark.z - 1.5; 
      const eafX = LAYOUT.eaf.x, eafZ = LAYOUT.eaf.z;

      if (t < 0.10) {
        const e = easeInOut(t / 0.10);
        s.craneX = lerp(eafX, parkX, e);
        s.craneZ = lerp(eafZ, parkZ, e);
        s.hookY = TRAVEL_Y;
      } else if (t < 0.18) {
        const e = easeInOut((t - 0.10) / 0.08);
        s.craneX = parkX; s.craneZ = parkZ;
        s.hookY = lerp(TRAVEL_Y, BUCKET_GRAB_Y, e);
      } else if (t < 0.22) {
        s.craneX = parkX; s.craneZ = parkZ; s.hookY = BUCKET_GRAB_Y;
        s.grabOffset = easeInOut((t - 0.18) / 0.04);
      } else if (t < 0.32) {
        s.craneX = parkX; s.craneZ = parkZ;
        s.grabOffset = 1;
        s.bucketAttached = true;
        s.hookY = lerp(BUCKET_GRAB_Y, TRAVEL_Y, easeInOut((t - 0.22) / 0.10));
      } else if (t < 0.50) {
        const e = easeInOut((t - 0.32) / 0.18);
        s.craneX = lerp(parkX, eafX, e);
        s.craneZ = lerp(parkZ, eafZ - 0.5, e); 
        s.hookY = TRAVEL_Y;
      } else if (t < 0.65) {
        s.craneX = eafX; s.craneZ = eafZ - 0.5; s.hookY = TRAVEL_Y;
        
        if (t > 0.52 && t < 0.58) {
          s.bucketOpen = easeInOut((t - 0.52) / 0.06);
          if (!s.scrapDropped && s.bucketOpen > 0.1) {
            for (let i = 0; i < 40; i++) spawnScrap(s.craneX, s.hookY - 3, s.craneZ + 0.5);
            s.scrapDropped = true;
          }
        } else if (t >= 0.58 && t < 0.62) {
          s.bucketOpen = 1;
        } else if (t >= 0.62) {
          s.bucketOpen = 1 - easeInOut((t - 0.62) / 0.03);
        }
        s.hasScrap = 1;
      } else if (t < 0.80) {
        const e = easeInOut((t - 0.65) / 0.15);
        s.craneX = lerp(eafX, parkX, e);
        s.craneZ = lerp(eafZ - 0.5, parkZ, e);
        s.hookY = TRAVEL_Y;
      } else if (t < 0.88) {
        const e = easeInOut((t - 0.80) / 0.08);
        s.craneX = parkX; s.craneZ = parkZ;
        s.hookY = lerp(TRAVEL_Y, BUCKET_GRAB_Y, e);
      } else if (t < 0.92) {
        s.craneX = parkX; s.craneZ = parkZ; s.hookY = BUCKET_GRAB_Y;
        s.grabOffset = 1 - easeInOut((t - 0.88) / 0.04);
        if (t > 0.90) s.bucketAttached = false;
      } else {
        const e = easeInOut((t - 0.92) / 0.08);
        s.craneX = parkX; s.craneZ = parkZ;
        s.grabOffset = 0;
        s.hookY = lerp(BUCKET_GRAB_Y, TRAVEL_Y, e);
      }

      if (t > 0.90) {
        for (let i = 0; i < scrap.length; i++) {
          scrap[i].visible = false;
          scrapSt[i].alive = false;
        }
      }
    }},

    { name: '2. Плавка (горят дуги)', duration: 8, apply(s) {
      s.roofSwing = 0; s.electrodesUp = 0; s.electrodeMelt = 1; s.grabOffset = 0;
      s.hasScrap = 1; s.arcGlow = 0;
    }},

    { name: '3. Подготовка к выпуску', duration: 3, apply(s, s0, t) {
      s.arcGlow = 0;
      s.electrodeMelt = 1 - easeInOut(clamp01(t / 0.5));
      s.electrodesUp = easeInOut(clamp01(t / 0.8));
      s.roofSwing = 0; s.hasScrap = 1; s.grabOffset = 0;
    }},

    { name: '4. Выпуск стали в ковш', duration: 6, apply(s, s0, t) {
      s.roofSwing = 0; s.electrodesUp = 1; s.electrodeMelt = 0; s.grabOffset = 0;
      s.hasScrap = 1;
      if (t < 0.3) s.eafTilt = lerp(0, -0.3, easeInOut(t / 0.3));
      else if (t < 0.7) s.eafTilt = -0.3;
      else s.eafTilt = lerp(-0.3, 0, easeInOut((t - 0.7) / 0.3));
      s.ladleStream = (t > 0.2 && t < 0.8) ? 1 : 0;
      if (t < 0.2) s.molten = 0;
      else if (t < 0.75) s.molten = easeInOut((t - 0.2) / 0.55);
      else s.molten = 1;
      s.steamLadle = t > 0.25 ? 1 : 0;
    }},

    { name: '5. Возврат ЭДП', duration: 3, apply(s, s0, t) {
      s.eafTilt = 0; s.ladleStream = 0; s.molten = 1; s.steamLadle = 1;
      s.roofSwing = 0; s.electrodesUp = 1; s.hasScrap = 1; s.grabOffset = 0;
    }},

    { name: '6. Сталевоз к печи-ковшу', duration: 5, apply(s, s0, t) {
      const e = easeInOut(t);
      // ИСПРАВЛЕНИЕ: Начинаем с изначальной стартовой точки LAYOUT.ladleStart.x
      s.carX = lerp(LAYOUT.ladleStart.x, LAYOUT.lf.x, e);
      s.ladleX = s.carX; s.ladleZ = LAYOUT.rails.z; s.ladleY = 1.0;
      s.molten = 1; s.steamLadle = 1; s.grabOffset = 0;
    }},

    { name: '7. Обработка в печи-ковше', duration: 7, apply(s, s0, t) {
      s.molten = 1; s.steamLadle = 1; s.grabOffset = 0;
      if (t < 0.2) { s.lfRoofY = lerp(0, -2, easeInOut(t / 0.2)); s.steamLf = 0; }
      else if (t < 0.8) {
        s.lfRoofY = -2; s.steamLf = 1; 
      } else {
        s.lfRoofY = lerp(-2, 0, (t - 0.8) / 0.2);
        s.steamLf = 1 - (t - 0.8) / 0.2;
      }
    }},

    { name: '8. Выдвижение ковша', duration: 3, apply(s, s0, t) {
      const e = easeInOut(t);
      s.carX = lerp(LAYOUT.lf.x, pickupX, e); 
      s.ladleX = s.carX; s.ladleZ = 0; s.ladleY = 1.0;
      s.molten = 1; s.steamLadle = 1; s.steamLf = 0; s.grabOffset = 0;
    }},

        { name: '9. Кран несёт ковш к МНЛЗ', duration: 16, apply(s, s0, t) {
      s.molten = 1; s.steamLadle = 1; s.steamLf = 0;

      if (t < 0.10) {
        const e = easeInOut(t / 0.10);
        s.craneX = lerp(s0.craneX, pickupX, e);
        s.craneZ = lerp(s0.craneZ, pickupZ - 1.5, e); // 1.5
        s.hookY = TRAVEL_Y;
        s.grabOffset = 0;
        s.ladleX = pickupX; s.ladleY = 1.0; s.ladleZ = pickupZ;
      } else if (t < 0.20) {
        const e = easeInOut((t - 0.10) / 0.10);
        s.craneX = pickupX; s.craneZ = pickupZ - 1.5; // 1.5
        s.hookY = lerp(TRAVEL_Y, 4.05, e);
        s.grabOffset = 0;
        s.ladleX = pickupX; s.ladleY = 1.0; s.ladleZ = pickupZ;
      } else if (t < 0.28) {
        const e = easeInOut((t - 0.20) / 0.08);
        s.craneX = pickupX; s.craneZ = pickupZ - 1.5; // 1.5
        s.hookY = 4.05;
        s.grabOffset = e;
        s.ladleX = pickupX; s.ladleY = 1.0; s.ladleZ = pickupZ;
      } else if (t < 0.40) {
        const e = easeInOut((t - 0.28) / 0.12);
        s.craneX = pickupX; s.craneZ = pickupZ - 1.5; // 1.5
        s.hookY = lerp(4.05, TRAVEL_Y, e);
        s.grabOffset = 1;
        s.ladleX = s.craneX; s.ladleY = s.hookY - 3.05; s.ladleZ = s.craneZ + 1.5; // 1.5
      } else if (t < 0.85) {
        const ct = (t - 0.40) / 0.45;
        
        if (ct < 0.3) {
          const e = easeInOut(ct / 0.3);
          s.craneX = lerp(pickupX, ccmPour.x, e);
          s.craneZ = pickupZ - 1.5; // 1.5
          s.hookY = TRAVEL_Y;
        } else if (ct < 0.7) {
          const e = easeInOut((ct - 0.3) / 0.4);
          s.craneX = ccmPour.x;
          s.craneZ = lerp(pickupZ - 1.5, ccmPour.z - 1.5, e); // 1.5
          s.hookY = TRAVEL_Y;
        } else {
          const e = easeInOut((ct - 0.7) / 0.3);
          s.craneX = ccmPour.x;
          s.craneZ = ccmPour.z - 1.5; // 1.5
          s.hookY = lerp(TRAVEL_Y, CCM_HOOK_Y, e); 
        }
        s.grabOffset = 1;
        s.ladleX = s.craneX; s.ladleY = s.hookY - 3.05; s.ladleZ = s.craneZ + 1.5; // 1.5
      } else {
        s.craneX = ccmPour.x; s.craneZ = ccmPour.z - 1.5; // 1.5
        s.hookY = CCM_HOOK_Y;
        s.grabOffset = 1;
        s.ladleX = ccmPour.x; s.ladleY = CCM_HOOK_Y - 3.05; s.ladleZ = ccmPour.z;
      }
    }},

    { name: '10. Разливка на МНЛЗ', duration: 10, apply(s, s0, t) {
      s.molten = 1; s.steamLadle = 0.7; s.steamLf = 0;
      s.craneX = ccmPour.x; s.craneZ = ccmPour.z - 1.5;
      s.hookY = CCM_HOOK_Y; s.grabOffset = 1;
      s.ladleX = ccmPour.x; s.ladleY = CCM_HOOK_Y - 3.05; s.ladleZ = ccmPour.z;

      if (t > 0.15 && t < 0.65) { s.ccmStreamA = 1; s.ccmStreamB = 1; s.steamCcm = 1; }
      else if (t >= 0.65) { s.ccmStreamA = 0; s.ccmStreamB = 0; s.steamCcm = 0.4; }

      if (t > 0.15) {
        if (t < 0.65) s.billetFront = lerp(-12, 8, (t - 0.15) / 0.50);
        else if (t < 0.70) s.billetFront = lerp(8, 10, (t - 0.65) / 0.05);
        else s.billetFront = 10;
      }
      if (t > 0.7) s.molten = lerp(1, 0, (t - 0.7) / 0.3);
    }},
  ];

  function applyState() {
    if (world.crane.bridge) world.crane.bridge.position.x = state.craneX / scale;
    if (world.crane.trolley) world.crane.trolley.position.z = state.craneZ / scale;
    
    if (world.crane.hooksGroup) {
      world.crane.hooksGroup.position.z = state.craneZ / scale;
      world.crane.hooksGroup.position.y = (state.hookY - (world.crane.group.position.y || 0)) / scale - bridgeLocalY;
    }

    const grab = state.grabOffset || 0;
    const halfSpan = 1.6 + (1 - grab) * 0.5; 
    
    if (world.crane.hookL) {
      world.crane.hookL.position.x = -halfSpan / scale;
    }
    if (world.crane.hookR) {
      world.crane.hookR.position.x = halfSpan / scale;
    }

    if (world.crane.wireL && world.crane.wireR && world.crane.trolley && world.crane.hookL && world.crane.hookR) {
      world.crane.trolley.updateMatrixWorld(true);
      world.crane.hookL.updateMatrixWorld(true);
      world.crane.hookR.updateMatrixWorld(true);

      const trolleyWorld = new THREE.Vector3();
      world.crane.trolley.getWorldPosition(trolleyWorld);

      const hookLWorld = new THREE.Vector3();
      world.crane.hookL.getWorldPosition(hookLWorld);

      const hookRWorld = new THREE.Vector3();
      world.crane.hookR.getWorldPosition(hookRWorld);

      const topL = new THREE.Vector3(hookLWorld.x, trolleyWorld.y + 1.5, hookLWorld.z);
      const botL = hookLWorld.clone();
      
      const dirL = botL.clone().sub(topL);
      const lenL = dirL.length();
      world.crane.wireL.position.copy(topL).addScaledVector(dirL, 0.5);
      world.crane.wireL.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirL.normalize());
      world.crane.wireL.scale.set(1, lenL, 1);

      const topR = new THREE.Vector3(hookRWorld.x, trolleyWorld.y + 1.5, hookRWorld.z);
      const botR = hookRWorld.clone();
      
      const dirR = botR.clone().sub(topR);
      const lenR = dirR.length();
      world.crane.wireR.position.copy(topR).addScaledVector(dirR, 0.5);
      world.crane.wireR.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirR.normalize());
      world.crane.wireR.scale.set(1, lenR, 1);
    }

    if (state.bucketAttached) {
      world.bucket.group.position.set(state.craneX, state.hookY - 1.5, state.craneZ + 1.5);
    } else {
      world.bucket.group.position.set(LAYOUT.bucketPark.x, BUCKET_PARK_Y, LAYOUT.bucketPark.z);
    }
    
    if (world.bucket.capPivot) {
      world.bucket.capPivot.rotation.x = -state.bucketOpen * Math.PI * 0.8; 
    }

    if (world.eaf.tilt) world.eaf.tilt.rotation.z = state.eafTilt;
    if (world.eaf.roofPivot) world.eaf.roofPivot.rotation.y = state.roofSwing * Math.PI * 0.55;
    for (const e of world.eaf.electrodes) {
      e.position.y = -1.5 + state.electrodesUp * 4.2 - state.electrodeMelt * 1.4;
    }
    
    if (world.eaf.scrapPile) world.eaf.scrapPile.visible = state.hasScrap > 0.5;

    if (world.lf.roof) world.lf.roof.position.y = 7.2 + state.lfRoofY;
    
    world.ladle.group.position.set(state.ladleX, state.ladleY, state.ladleZ);
    if (world.ladle.molten) {
      world.ladle.molten.material.opacity = state.molten * 0.95;
      world.ladle.molten.visible = state.molten > 0.01;
      world.ladle.molten.position.y = 0.2 + state.molten * 2.6;
    }

    if (world.car) world.car.position.x = state.carX;

    if (state.ladleStream > 0.01) {
      const spoutLocalX = 4.5, spoutLocalY = 5.5;
      const tilt = state.eafTilt;
      const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const spoutX = spoutLocalX * cosT - spoutLocalY * sinT;
      const spoutY = spoutLocalX * sinT + spoutLocalY * cosT;
      const from = new THREE.Vector3(LAYOUT.eaf.x + spoutX, 0.6 + spoutY, LAYOUT.eaf.z);
      const to = new THREE.Vector3(state.ladleX, state.ladleY + 1.5, state.ladleZ);
      const mid = from.clone().add(to).multiplyScalar(0.5);
      const len = from.distanceTo(to);
      world.pourStream.position.copy(mid);
      world.pourStream.scale.set(1.5, Math.max(0.1, len), 1.5); 
      const dir = to.clone().sub(from).normalize();
      world.pourStream.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      world.pourStream.material.opacity = state.ladleStream * 0.9;
      world.pourStream.visible = true;
    } else {
      world.pourStream.visible = false;
    }

        // Обновление 3-х заготовок
    const rearZ = -12;
    const L = state.billetFront - rearZ;
    
    if (world.ccm.billets) {
      world.ccm.billets.forEach((billet) => {
        if (L < 0.05) {
          billet.visible = false;
        } else {
          billet.visible = true;
          billet.scale.z = L;
          billet.position.z = rearZ + L / 2;
        }
      });
    }
    
    // Струя ковш -> промежуточный ковш (1 шт)
    if (world.ccm.streamA) {
      world.ccm.streamA.material.opacity = state.ccmStreamA * 0.9;
      world.ccm.streamA.visible = state.ccmStreamA > 0.01;
    }
    
    // Струи промежуточный ковш -> 3 заготовки
    if (world.ccm.streamsB) {
      world.ccm.streamsB.forEach((stream) => {
        stream.material.opacity = state.ccmStreamB * 0.9;
        stream.visible = state.ccmStreamB > 0.01;
      });
    }

    if (world.steam.ladle) world.steam.ladle.active = state.steamLadle > 0;
    if (world.steam.lf) world.steam.lf.active = state.steamLf > 0;
    if (world.steam.ccm) world.steam.ccm.active = state.steamCcm > 0;
  }

  function update(dt) {
    if (!running || paused) return;
    updateScrap(dt);
    if (world.steam.ladle) updateSteam(world.steam.ladle, dt);
    if (world.steam.lf) updateSteam(world.steam.lf, dt);
    if (world.steam.ccm) updateSteam(world.steam.ccm, dt);

    phaseTime += dt;
    const phase = phases[phaseIndex];
    const t = Math.min(1, phaseTime / phase.duration);
    phase.apply(state, s0, t);
    applyState();
    if (t >= 1) {
      if (phaseIndex >= phases.length - 1) { running = false; finished = true; return; }
      Object.assign(s0, state);
      phaseIndex++; phaseTime = 0;
    }
  }

  function start() { if (finished) reset(); running = true; paused = false; }
  function pause() { paused = !paused; }
  function next() {
    if (finished) { reset(); return; }
    Object.assign(s0, state);
    phaseIndex = (phaseIndex + 1) % phases.length;
    phaseTime = 0;
  }
  function reset() {
    Object.assign(state, home);
    Object.assign(s0, home);
    phaseIndex = 0; phaseTime = 0; running = false; paused = false; finished = false;
    for (const s of scrap) s.visible = false;
    for (const st of scrapSt) st.alive = false;
    applyState();
  }
  function getPhase() {
    return { index: phaseIndex, name: phases[phaseIndex].name, list: phases.map(p => p.name) };
  }
  function isRunning() { return running; }
  function isPaused() { return paused; }
  function isFinished() { return finished; }

  applyState();
  return { update, start, pause, next, reset, getPhase, isRunning, isPaused, isFinished };
}