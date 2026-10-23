import * as THREE from 'three';
import { MAT } from '../../utils/materials.js';
import { box, cyl } from '../../utils/geometry.js';

export function createLadleFurnace(cfg) {
  const group = new THREE.Group();
  group.position.set(cfg.x, cfg.y, cfg.z);

  group.add(box(6, 0.5, 6, MAT.concrete, 0, 0.25, 0));

  // стойки
  group.add(box(0.4, 8, 0.4, MAT.steelDark, -2.6, 4, -2.6));
  group.add(box(0.4, 8, 0.4, MAT.steelDark,  2.6, 4, -2.6));
  group.add(box(0.4, 8, 0.4, MAT.steelDark, -2.6, 4,  2.6));
  group.add(box(0.4, 8, 0.4, MAT.steelDark,  2.6, 4,  2.6));

  // свод (подвижный)
  const roof = new THREE.Group();
  roof.add(cyl(3, 3, 0.6, 24, MAT.steelLight, 0, 0, 0));
  roof.position.set(0, 7.2, 0);
  group.add(roof);

  // 3 электрода
  const electrodes = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const e = cyl(0.18, 0.18, 4, 10, MAT.steelDark,
      Math.cos(a) * 1.0, 6.8, Math.sin(a) * 1.0);
    electrodes.push(e);
    group.add(e);
  }

  // свечение нагрева
  const glow = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), MAT.hot.clone());
  glow.position.set(0, 2.2, 0);
  group.add(glow);

  return { group, roof, electrodes, glow };
}