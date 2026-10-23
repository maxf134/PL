import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { resolveCollisions } from '../systems/collisions.js';

export function createFPSControls(camera, domElement, isEnabled) {
  const controls = new PointerLockControls(camera, domElement);
  const keys = new Set();
  const raycaster = new THREE.Raycaster();
  let promptTarget = null;

  domElement.addEventListener('click', () => {
    if (isEnabled && !isEnabled()) return;
    controls.lock();
  });
  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup', (e) => keys.delete(e.code));

  camera.position.set(-14, 1.7, 16);

  function update(dt, interactables) {
    if (isEnabled && !isEnabled()) {
      promptTarget = null;
      return;
    }
    const dir = new THREE.Vector3();
    if (keys.has('KeyW')) dir.z -= 1;
    if (keys.has('KeyS')) dir.z += 1;
    if (keys.has('KeyA')) dir.x -= 1;
    if (keys.has('KeyD')) dir.x += 1;
    if (dir.lengthSq() > 0 && controls.isLocked) {
      dir.normalize();
      const speed = keys.has('ShiftLeft') ? 14 : 6;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
      const move = new THREE.Vector3()
        .addScaledVector(forward, -dir.z * speed * dt)
        .addScaledVector(right, dir.x * speed * dt);
      const desired = { x: camera.position.x + move.x, z: camera.position.z + move.z };
      const r = resolveCollisions(desired, { x: camera.position.x, z: camera.position.z }, 0.4);
      camera.position.x = r.x;
      camera.position.z = r.z;
    }
    camera.position.y = 1.7;

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    promptTarget = null;
    if (interactables.length > 0) {
      const hits = raycaster.intersectObjects(interactables.map(i => i.object), true);
      if (hits.length > 0) {
        for (const item of interactables) {
          let p = hits[0].object;
          while (p) { if (p === item.object) break; p = p.parent; }
          if (p && hits[0].distance <= item.range) { promptTarget = item; break; }
        }
      }
    }
  }

  return {
    controls, update,
    getPromptTarget: () => promptTarget,
    onAction: (cb) => {
      window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyF' && promptTarget) cb(promptTarget);
      });
    },
  };
}