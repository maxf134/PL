import { LAYOUT } from '../scene/layout.js';

function hits(pos, radius) {
  for (const c of LAYOUT.colliders) {
    const cx = Math.max(c.min.x, Math.min(pos.x, c.max.x));
    const cz = Math.max(c.min.z, Math.min(pos.z, c.max.z));
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}

export function resolveCollisions(desired, current, radius = 0.4) {
  let x = current.x, z = current.z;

  // пробуем сдвиг по X
  if (!hits({ x: desired.x, z: current.z }, radius)) x = desired.x;
  // пробуем сдвиг по Z с учётом уже принятого X
  if (!hits({ x, z: desired.z }, radius)) z = desired.z;

  // границы сцены
  x = Math.max(LAYOUT.bounds.xMin, Math.min(LAYOUT.bounds.xMax, x));
  z = Math.max(LAYOUT.bounds.zMin, Math.min(LAYOUT.bounds.zMax, z));

  return { x, z };
}