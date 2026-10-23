import * as THREE from 'three';
import { MAT } from '../../utils/materials.js';
import { box, cyl } from '../../utils/geometry.js';

function makeHook() {
  const g = new THREE.Group();
  // Стойка
  g.add(cyl(0.06, 0.06, 0.5, 8, MAT.steelDark, 0, 0.45, 0));
  // Скоба (полутор сверху, открытие вниз)
  const bend = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.05, 8, 16, Math.PI),
    MAT.steelDark
  );
  bend.position.y = 0.2;
  g.add(bend);
  return g;
}

export function createCrane(cfg) {
  const group = new THREE.Group();
  const spanZ = 18;
  const railY = cfg.y;
  const travelXmin = -32, travelXmax = 5;

  // Рельсы по краям цеха + стойки
  for (const zz of [-spanZ, spanZ]) {
    group.add(box(travelXmax - travelXmin + 2, 0.4, 0.5, MAT.crane,
      (travelXmin + travelXmax) / 2, railY + 0.2, zz));
    for (const xx of [travelXmin, 0, travelXmax]) {
      group.add(box(0.5, railY, 0.5, MAT.steelDark, xx, railY / 2, zz));
    }
  }

  // Мост (жёлтая балка)
  const bridge = new THREE.Group();
  bridge.position.y = railY + 0.8;
  bridge.add(box(1.4, 1.2, 2 * spanZ, MAT.crane, 0, 0, 0));
  bridge.add(box(3, 0.6, 1, MAT.crane, 0, -0.7, -spanZ + 0.5));
  bridge.add(box(3, 0.6, 1, MAT.crane, 0, -0.7, spanZ - 0.5));

  // Тележка
  const trolley = new THREE.Group();
  trolley.position.y = -0.6;
  trolley.add(box(2.2, 0.7, 1.6, MAT.steelDark, 0, 0, 0));
  for (const dx of [-0.7, 0.7]) {
    for (const dz of [-0.6, 0.6]) {
      const w = cyl(0.22, 0.22, 0.2, 10, MAT.steelDark, dx, 0.35, dz);
      w.rotation.z = Math.PI / 2;
      trolley.add(w);
    }
  }
  bridge.add(trolley);

  // Группа крюков (подвешена на тросах)
  const hooksGroup = new THREE.Group();
  bridge.add(hooksGroup);

  const hookL = makeHook();
  const hookR = makeHook();
  hooksGroup.add(hookL, hookR);

  // Троса
  const wireL = cyl(0.04, 0.04, 1, 6, MAT.steelDark, 0, 0, 0);
  const wireR = cyl(0.04, 0.04, 1, 6, MAT.steelDark, 0, 0, 0);
  bridge.add(wireL, wireR);

  group.add(bridge);

  return { group, bridge, trolley, hooksGroup, hookL, hookR, wireL, wireR };
}