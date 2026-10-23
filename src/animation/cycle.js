import * as THREE from 'three';
import { LAYOUT } from '../scene/layout.js';

const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

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
    s.material.opacity = k * 0.5;
    const sc = 0.6 + (1 - k) * 1.6;
    s.scale.set(sc, sc, 1);
  }
}

export function createCycle(world) {
  const home = {
    craneX: LAYOUT.eaf.x, craneZ: LAYOUT.eaf.z, hookY: 13,
    grabOffset: 0,
    bucketLifted: 0, bucketOpen: 0,
    roofSwing: 0, electrodesUp: 0, electrodeMelt: 0,
    arcGlow: 0, eafTilt: 0,
    lfRoofY: 0, lfGlow: 0,
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
  const ccmPour = { x: LAYOUT.ccm.x, z: LAYOUT.ccm.z - 12 };

  const phases = [
    { name: '1. Загрузка лома в ЭДП', duration: 18, apply(s, s0, t) {
      if (t < 0.10) { s.electrodesUp = easeInOut(t / 0.10); s.roofSwing = 0; }
      else if (t < 0.18) { s.electrodesUp = 1; s.roofSwing = easeInOut((t - 0.10) / 0.08); }
      else if (t < 0.70) { s.electrodesUp = 1; s.roofSwing = 1; }
      else if (t < 0.80) { s.electrodesUp = 1; s.roofSwing = 1 - easeInOut((t - 0.70) / 0.10); }
      else if (t < 0.92) { s.roofSwing = 0; s.electrodesUp = 1 - easeInOut((t - 0.80) / 0.12); }
      else { s.roofSwing = 0; s.electrodesUp = 0; }

      if (t >= 0.18 && t <= 0.62) {
        const ct = (t - 0.18) / 0.44;
        const eafX = LAYOUT.eaf.x, eafZ = LAYOUT.eaf.z;
        const parkX = LAYOUT.bucketPark.x, parkZ = LAYOUT.bucketPark.z;
        const keys = [
          { t: 0.00, x: eafX, z: eafZ, y: 13, bl: 0, bo: 0 },
          { t: 0.14, x: parkX, z: parkZ, y: 13, bl: 0, bo: 0 },
          { t: 0.24, x: parkX, z: parkZ, y: 3.0, bl: 0, bo: 0 },
          { t: 0.30, x: parkX, z: parkZ, y: 3.0, bl: 1, bo: 0 },
          { t: 0.42, x: parkX, z: parkZ, y: 13, bl: 1, bo: 0 },
          { t: 0.58, x: eafX, z: eafZ, y: 13, bl: 1, bo: 0 },
          { t: 0.63, x: eafX, z: eafZ, y: 13, bl: 1, bo: 1 },
          { t: 0.73, x: eafX, z: eafZ, y: 13, bl: 1, bo: 1 },
          { t: 0.78, x: eafX, z: eafZ, y: 13, bl: 1, bo: 0 },
          { t: 0.90, x: parkX, z: parkZ, y: 13, bl: 1, bo: 0 },
          { t: 0.96, x: parkX, z: parkZ, y: 3.0, bl: 1, bo: 0 },
          { t: 1.00, x: parkX, z: parkZ, y: 13, bl: 0, bo: 0 },
        ];
        let i = 0;
        while (i < keys.length - 1 && ct > keys[i + 1].t) i++;
        const k0 = keys[i], k1 = keys[i + 1];
        const segT = k1.t > k0.t ? (ct - k0.t) / (k1.t - k0.t) : 0;
        const e = easeInOut(clamp01(segT));
        s.craneX = lerp(k0.x, k1.x, e);
        s.craneZ = lerp(k0.z, k1.z, e);
        s.hookY = lerp(k0.y, k1.y, e);
        s.bucketLifted = lerp(k0.bl, k1.bl, e);
        s.bucketOpen = lerp(k0.bo, k1.bo, e);
        s.grabOffset = s.bucketLifted;  // крюки сходятся вместе с подъёмом корзины

        if (ct > 0.63 && ct < 0.73 && Math.random() < 0.30) {
          spawnScrap(s.craneX, s.hookY - 3, s.craneZ);
        }
        if (ct > 0.73) s.hasScrap = 1;
      } else if (t > 0.62 && t < 0.70) {
        s.craneX = LAYOUT.bucketPark.x;
        s.craneZ = LAYOUT.bucketPark.z;
        s.hookY = 13;
        s.bucketLifted = 0; s.bucketOpen = 0; s.grabOffset = 0;
        s.hasScrap = 1;
      }
    }},

    { name: '2. Плавка (горят дуги)', duration: 8, apply(s) {
      s.roofSwing = 0; s.electrodesUp = 0; s.electrodeMelt = 1; s.grabOffset = 0;
      s.hasScrap = 1;
      s.arcGlow = Math.min(0.9, 0.3 + Math.sin(phaseTime / 8 * Math.PI) * 0.9);
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
      s.carX = lerp(LAYOUT.rails.x1, LAYOUT.lf.x, e);
      s.ladleX = s.carX; s.ladleZ = LAYOUT.rails.z; s.ladleY = 1.0;
      s.molten = 1; s.steamLadle = 1; s.grabOffset = 0;
    }},

    { name: '7. Обработка в печи-ковше', duration: 7, apply(s, s0, t) {
      s.molten = 1; s.steamLadle = 1; s.grabOffset = 0;
      if (t < 0.2) { s.lfRoofY = lerp(0, -2, easeInOut(t / 0.2)); s.steamLf = 0; }
      else if (t < 0.8) {
        s.lfRoofY = -2;
        s.lfGlow = Math.min(0.85, 0.3 + Math.sin((t - 0.2) * Math.PI * 5) * 0.4);
        s.steamLf = 1;
      } else {
        s.lfGlow = lerp(0.85, 0, (t - 0.8) / 0.2);
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
        s.craneZ = lerp(s0.craneZ, 0, e);
        s.hookY = 13;
        s.grabOffset = 0;
        s.ladleX = pickupX; s.ladleY = 1.0; s.ladleZ = 0;
      } else if (t < 0.20) {
        const e = easeInOut((t - 0.10) / 0.10);
        s.craneX = pickupX; s.craneZ = 0;
        s.hookY = lerp(13, 4.05, e);
        s.grabOffset = 0;
        s.ladleX = pickupX; s.ladleY = 1.0; s.ladleZ = 0;
      } else if (t < 0.28) {
        const e = easeInOut((t - 0.20) / 0.08);
        s.craneX = pickupX; s.craneZ = 0;
        s.hookY = 4.05;
        s.grabOffset = e;
        s.ladleX = pickupX; s.ladleY = 1.0; s.ladleZ = 0;
      } else if (t < 0.40) {
        const e = easeInOut((t - 0.28) / 0.12);
        s.craneX = pickupX; s.craneZ = 0;
        s.hookY = lerp(4.05, 4.8, e);
        s.grabOffset = 1;
        s.ladleX = pickupX; s.ladleY = s.hookY - 3.05; s.ladleZ = 0;
      } else if (t < 0.85) {
        const e = easeInOut((t - 0.40) / 0.45);
        s.craneX = lerp(pickupX, ccmPour.x, e);
        s.craneZ = lerp(0, ccmPour.z, e);
        s.hookY = lerp(4.8, 13, e);
        s.grabOffset = 1;
        s.ladleX = s.craneX; s.ladleY = s.hookY - 3.05; s.ladleZ = s.craneZ;
      } else {
        s.craneX = ccmPour.x; s.craneZ = ccmPour.z;
        s.hookY = 13;
        s.grabOffset = 1;
        s.ladleX = ccmPour.x; s.ladleY = 9.95; s.ladleZ = ccmPour.z;
      }
    }},

    { name: '10. Разливка на МНЛЗ', duration: 10, apply(s, s0, t) {
      s.molten = 1; s.steamLadle = 0.7; s.steamLf = 0;
      s.craneX = ccmPour.x; s.craneZ = ccmPour.z;
      s.hookY = 13; s.grabOffset = 1;
      s.ladleX = ccmPour.x; s.ladleY = 9.95; s.ladleZ = ccmPour.z;

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
    const bridgeY = world.crane.bridge.position.y;
    world.crane.bridge.position.x = state.craneX;
    world.crane.trolley.position.z = state.craneZ;
    world.crane.hooksGroup.position.z = state.craneZ;
    world.crane.hooksGroup.position.y = state.hookY - bridgeY;

    // Крюки — раскрытие
    const grab = state.grabOffset || 0;
    const halfSpan = 1.5 + (1 - grab) * 0.2;  // 1.7 при grab=0 → 1.5 при grab=1
    world.crane.hookL.position.x = -halfSpan;
    world.crane.hookR.position.x = halfSpan;

    // Троса
    const trolleyLocalY = -0.6;
    const hooksLocalY = state.hookY - bridgeY;
    const wireLen = Math.max(0.1, trolleyLocalY - hooksLocalY);
    const wireY = (trolleyLocalY + hooksLocalY) / 2;
    world.crane.wireL.position.set(-halfSpan, wireY, state.craneZ);
    world.crane.wireL.scale.y = wireLen;
    world.crane.wireR.position.set(halfSpan, wireY, state.craneZ);
    world.crane.wireR.scale.y = wireLen;

    // Корзина
    const bl = state.bucketLifted;
    world.bucket.group.position.set(
      lerp(LAYOUT.bucketPark.x, state.craneX, bl),
      lerp(LAYOUT.bucketPark.y, state.hookY - 3.0, bl),
      lerp(LAYOUT.bucketPark.z, state.craneZ, bl)
    );
    const sc = 1 - state.bucketOpen * 0.9;
    world.bucket.bottomCap.scale.set(sc, sc, 1);

    // ЭДП
    world.eaf.tilt.rotation.z = state.eafTilt;
    world.eaf.roofPivot.rotation.y = state.roofSwing * Math.PI * 0.55;
    for (const e of world.eaf.electrodes) {
      e.position.y = -1.5 + state.electrodesUp * 4.2 - state.electrodeMelt * 1.4;
    }
    world.eaf.arcGlow.material.opacity = state.arcGlow;
    world.eaf.scrapPile.visible = state.hasScrap > 0.5;

    // Печь-ковш
    world.lf.roof.position.y = 7.2 + state.lfRoofY;
    world.lf.glow.material.opacity = state.lfGlow;
    for (const e of world.lf.electrodes) e.position.y = 6.8 + state.lfRoofY * 0.3;

    // Ковш
    world.ladle.group.position.set(state.ladleX, state.ladleY, state.ladleZ);
    world.ladle.molten.material.opacity = state.molten * 0.95;
    world.ladle.molten.visible = state.molten > 0.01;
    world.ladle.molten.position.y = 0.2 + state.molten * 2.2;

    world.car.position.x = state.carX;

    // Струя выпуска
    if (state.ladleStream > 0.01) {
      const spoutLocalX = 4.5, spoutLocalY = 5.5;
      const tilt = state.eafTilt;
      const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const spoutX = spoutLocalX * cosT - spoutLocalY * sinT;
      const spoutY = spoutLocalX * sinT + spoutLocalY * cosT;
      const from = new THREE.Vector3(LAYOUT.eaf.x + spoutX, 0.6 + spoutY, LAYOUT.eaf.z);
      const to = new THREE.Vector3(state.ladleX, state.ladleY + 3.05, state.ladleZ);
      const mid = from.clone().add(to).multiplyScalar(0.5);
      const len = from.distanceTo(to);
      world.pourStream.position.copy(mid);
      world.pourStream.scale.set(1, Math.max(0.1, len), 1);
      const dir = to.clone().sub(from).normalize();
      world.pourStream.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      world.pourStream.material.opacity = state.ladleStream * 0.9;
      world.pourStream.visible = true;
    } else {
      world.pourStream.visible = false;
    }

    // МНЛЗ
    const rearZ = -12;
    const L = state.billetFront - rearZ;
    if (L < 0.05) world.ccm.billet.visible = false;
    else {
      world.ccm.billet.visible = true;
      world.ccm.billet.scale.z = L;
      world.ccm.billet.position.z = rearZ + L / 2;
    }
    world.ccm.streamA.material.opacity = state.ccmStreamA * 0.9;
    world.ccm.streamA.visible = state.ccmStreamA > 0.01;
    world.ccm.streamB.material.opacity = state.ccmStreamB * 0.9;
    world.ccm.streamB.visible = state.ccmStreamB > 0.01;

    world.steam.ladle.active = state.steamLadle > 0;
    world.steam.lf.active = state.steamLf > 0;
    world.steam.ccm.active = state.steamCcm > 0;
  }

  function update(dt) {
    if (!running || paused) return;
    updateScrap(dt);
    updateSteam(world.steam.ladle, dt);
    updateSteam(world.steam.lf, dt);
    updateSteam(world.steam.ccm, dt);

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