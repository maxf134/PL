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

  if (!hits({ x: desired.x, z: current.z }, radius)) x = desired.x;
  if (!hits({ x, z: desired.z }, radius)) z = desired.z;

  x = Math.max(LAYOUT.bounds.xMin, Math.min(LAYOUT.bounds.xMax, x));
  z = Math.max(LAYOUT.bounds.zMin, Math.min(LAYOUT.bounds.zMax, z));

  return { x, z };
}

// Функция для подъема по лестнице
export function getFloorHeight(x, z) {
  // Координаты зоны лестницы (подстройте под свою модель, если нужно)
  // Сейчас это примерная зона перед ЭДП (от z=2 до z=14)
  if (x > -27 && x < -22 && z > 2 && z < 14) {
    // Плавный подъем от 1.7 до высоты площадки (например, 8 метров)
    return 1.7 + ((z - 2) / 12) * 8; 
  }
  return 1.7; // Обычная высота глаз игрока
}