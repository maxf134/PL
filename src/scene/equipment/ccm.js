import * as THREE from 'three';
import { MAT } from '../../utils/materials.js';
import { box, cyl } from '../../utils/geometry.js';

export function createCCM(cfg) {
  const group = new THREE.Group();
  group.position.set(cfg.x, cfg.y, cfg.z);

  group.add(box(10, 0.6, 30, MAT.concrete, 0, 0.3, 0));

  // Стойка + промежуточный ковш (воронка)
  group.add(box(3, 6, 3, MAT.steelDark, 0, 3, -12));

  const tundishMat = MAT.steelLight.clone();
  tundishMat.side = THREE.DoubleSide;
  const tundish = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 1.5, 1.5, 24, 1, true), tundishMat
  );
  tundish.position.set(0, 6.8, -12);
  tundish.castShadow = true;
  group.add(tundish);

  // Дно воронки (плоское кольцо, оставляем отверстие снизу)
  const tundishFloor = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 1.5, 24),
    new THREE.MeshStandardMaterial({ color: 0x8a9099, metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide })
  );
  tundishFloor.rotation.x = -Math.PI / 2;
  tundishFloor.position.set(0, 6.05, -12);
  group.add(tundishFloor);

  // Ролики
  for (let i = 0; i < 8; i++) {
    const z = -8 + i * 4;
    const h = 4 - i * 0.3;
    group.add(box(0.6, h, 0.6, MAT.steelLight, -2, 0.6 + h / 2, z));
    group.add(box(0.6, h, 0.6, MAT.steelLight,  2, 0.6 + h / 2, z));
    const r = cyl(0.25, 0.25, 3.5, 10, MAT.steelDark, 0, 0.8 + i * 0.05, z);
    r.rotation.z = Math.PI / 2;
    group.add(r);
  }

  // Заготовка — единичной длины, удлиняется через scale.z
  const billet = box(0.6, 0.6, 1, MAT.billet, 0, 1.0, -12);
  billet.visible = false;
  billet.scale.z = 0.01;
  group.add(billet);

  // Струя ковш → воронка (от 9.95 до 7.55, длина 2.4)
  const sA = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0 });
  const streamA = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.4, 8), sA);
  streamA.position.set(0, 8.75, -12);
  group.add(streamA);

  // Струя воронка → заготовка (от 6.05 до 1.0, длина 5.05)
  const sB = new THREE.MeshBasicMaterial({ color: 0xff9933, transparent: true, opacity: 0 });
  const streamB = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 5.05, 8), sB);
  streamB.position.set(0, 3.525, -12);
  group.add(streamB);

  return { group, tundish, billet, streamA, streamB };
}