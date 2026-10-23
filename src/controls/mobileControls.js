import * as THREE from 'three';
import { resolveCollisions } from '../systems/collisions.js';

export function createMobileControls(camera, domElement, isEnabled) {
  camera.position.set(-14, 1.7, 16);
  camera.rotation.order = 'YXZ';

  const joystick = document.getElementById('joystick');
  const knob = document.getElementById('joystick-knob');
  const btnAction = document.getElementById('btn-action');

  let moveX = 0, moveZ = 0, lookId = null, lookX = 0, lookY = 0, promptTarget = null;

  const rect = () => joystick.getBoundingClientRect();
  function updateKnob(dx, dy) {
    const max = 60, len = Math.hypot(dx, dy);
    const k = len > max ? max / len : 1;
    knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    moveX = (dx * k) / max; moveZ = (dy * k) / max;
  }
  let joyActive = false;
  joystick.addEventListener('touchstart', (e) => {
    if (isEnabled && !isEnabled()) return;
    joyActive = true;
    const r = rect(), t = e.changedTouches[0];
    updateKnob(t.clientX - (r.left + r.width / 2), t.clientY - (r.top + r.height / 2));
    e.preventDefault();
  }, { passive: false });
  joystick.addEventListener('touchmove', (e) => {
    if (!joyActive) return;
    const r = rect(), t = e.changedTouches[0];
    updateKnob(t.clientX - (r.left + r.width / 2), t.clientY - (r.top + r.height / 2));
    e.preventDefault();
  }, { passive: false });
  joystick.addEventListener('touchend', () => {
    joyActive = false; moveX = moveZ = 0;
    knob.style.transform = 'translate(0,0)';
  });

  domElement.addEventListener('touchstart', (e) => {
    if (isEnabled && !isEnabled()) return;
    const t = e.changedTouches[0];
    if (t.clientX < window.innerWidth / 2) return;
    lookId = t.identifier; lookX = t.clientX; lookY = t.clientY;
  }, { passive: true });
  domElement.addEventListener('touchmove', (e) => {
    if (isEnabled && !isEnabled()) return;
    for (const t of e.changedTouches) {
      if (t.identifier !== lookId) continue;
      const dx = t.clientX - lookX, dy = t.clientY - lookY;
      lookX = t.clientX; lookY = t.clientY;
      camera.rotation.y -= dx * 0.004;
      camera.rotation.x -= dy * 0.004;
      camera.rotation.x = Math.max(-1.4, Math.min(1.4, camera.rotation.x));
    }
  }, { passive: true });
  domElement.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null;
  });

  function update(dt, interactables) {
    if (isEnabled && !isEnabled()) {
      promptTarget = null;
      btnAction.style.display = 'none';
      return;
    }
    if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
      const speed = 5;
      const fwd = new THREE.Vector3(-Math.sin(camera.rotation.y), 0, -Math.cos(camera.rotation.y));
      const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
      const move = new THREE.Vector3()
        .addScaledVector(fwd, -moveZ * speed * dt)
        .addScaledVector(right, -moveX * speed * dt);
      const desired = { x: camera.position.x + move.x, z: camera.position.z + move.z };
      const r = resolveCollisions(desired, { x: camera.position.x, z: camera.position.z }, 0.4);
      camera.position.x = r.x; camera.position.z = r.z;
    }
    camera.position.y = 1.7;

    promptTarget = null;
    let bestDist = Infinity;
    for (const item of interactables) {
      const wp = new THREE.Vector3();
      item.object.getWorldPosition(wp);
      const d = camera.position.distanceTo(wp);
      if (d <= item.range && d < bestDist) { bestDist = d; promptTarget = item; }
    }
    btnAction.style.display = promptTarget ? 'block' : 'none';
  }

  return {
    update,
    getPromptTarget: () => promptTarget,
    onAction: (cb) => {
      btnAction.addEventListener('click', () => { if (promptTarget) cb(promptTarget); });
    },
  };
}