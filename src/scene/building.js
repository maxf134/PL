import * as THREE from 'three';
import { box } from '../utils/geometry.js';
import { LAYOUT } from './layout.js';

export function createBuilding(scene) {
  const W = LAYOUT.hall.w;   // 80
  const D = LAYOUT.hall.d;   // 60
  const H = 40;              // высота цеха

  // Материалы
 const wallMat = new THREE.MeshStandardMaterial({
  color: 0x9aa0a8, roughness: 0.9, metalness: 0.05, side: THREE.DoubleSide,
});
const ceilingMat = new THREE.MeshStandardMaterial({
  color: 0x50555c, roughness: 0.9, metalness: 0.05, side: THREE.DoubleSide,
});
const columnMat = new THREE.MeshStandardMaterial({
  color: 0x70757e, roughness: 0.7, metalness: 0.4,
});
  const windowMat = new THREE.MeshBasicMaterial({
    color: 0xbfd4e8, transparent: true, opacity: 0.55,
  });
  const lampPanelMat = new THREE.MeshBasicMaterial({ color: 0xfff2d0 });
  const lampFrameMat = new THREE.MeshStandardMaterial({
    color: 0x2a2f36, roughness: 0.7, metalness: 0.5,
  });

  // --- Стены ---
  // Юг (z = -D/2) — сплошная, с окнами в верхней части
  const southWall = box(W, H, 0.6, wallMat, 0, H / 2, -D / 2);
  southWall.castShadow = false;      // не отбрасывает тень — солнце проходит «сквозь» окна
  southWall.receiveShadow = true;
  scene.add(southWall);

  // Север (z = +D/2) — с проёмом для выхода заготовки (x = 4..20)
  const northLeft = box(44, H, 0.6, wallMat, -18, H / 2, D / 2);
  const northRight = box(20, H, 0.6, wallMat, 30, H / 2, D / 2);
  const northTop = box(16, 10, 0.6, wallMat, 12, 15, D / 2);
  for (const w of [northLeft, northRight, northTop]) {
    w.castShadow = false; w.receiveShadow = true;
    scene.add(w);
  }

  // Запад и Восток
  const westWall = box(0.6, H, D, wallMat, -W / 2, H / 2, 0);
  const eastWall = box(0.6, H, D, wallMat, W / 2, H / 2, 0);
  for (const w of [westWall, eastWall]) {
    w.castShadow = false; w.receiveShadow = true;
    scene.add(w);
  }

  // Потолок — без отбрасывания тени, чтобы солнце освещало сцену
  const ceiling = box(W, 0.4, D, ceilingMat, 0, H, 0);
  ceiling.castShadow = false;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // --- Колонны вдоль стен (с отступом внутрь) ---
  for (let x = -W / 2 + 6; x <= W / 2 - 6; x += 12) {
    scene.add(box(0.8, H, 0.8, columnMat, x, H / 2, -D / 2 + 1.2));
    scene.add(box(0.8, H, 0.8, columnMat, x, H / 2,  D / 2 - 1.2));
  }

  // --- Продольные прогоны под потолком ---
  for (let z = -D / 2 + 4; z <= D / 2 - 4; z += 10) {
    scene.add(box(W - 2, 0.25, 0.25, columnMat, 0, H - 1.5, z));
  }
  // --- Поперечные фермы ---
  for (let x = -W / 2 + 6; x <= W / 2 - 6; x += 12) {
    scene.add(box(0.35, 0.7, D - 2, columnMat, x, H - 1.5, 0));
  }

  // --- Окна на южной стене (свет проходит снаружи) ---
  for (let x = -W / 2 + 6; x <= W / 2 - 6; x += 8) {
    // Само «стекло» — полупрозрачная панель
    scene.add(box(5, 4, 0.08, windowMat, x, 14, -D / 2 + 0.35));
    // Рамы сверху и снизу
    scene.add(box(5.3, 0.25, 0.15, columnMat, x, 16, -D / 2 + 0.35));
    scene.add(box(5.3, 0.25, 0.15, columnMat, x, 12, -D / 2 + 0.35));
    // Вертикальный переплёт
    scene.add(box(0.15, 4, 0.15, columnMat, x, 14, -D / 2 + 0.35));
  }

  // --- Промышленные лампы на потолке ---
  const lampPositions = [];
  for (let x = -W / 2 + 8; x <= W / 2 - 8; x += 16) {
    for (let z = -D / 2 + 8; z <= D / 2 - 8; z += 14) {
      lampPositions.push({ x, z });
    }
  }
  lampPositions.forEach(({ x, z }) => {
    // Корпус светильника
    scene.add(box(1.6, 0.35, 1.0, lampFrameMat, x, H - 2.5, z));
    // Светящаяся панель снизу
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), lampPanelMat);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(x, H - 2.69, z);
    scene.add(panel);
    // Трос
    scene.add(box(0.04, 2.5, 0.04, lampFrameMat, x, H - 1.25, z));
  });

  return { H, lampPositions };
}