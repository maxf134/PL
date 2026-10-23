import * as THREE from 'three';
import { MAT } from '../../utils/materials.js';
import { cyl } from '../../utils/geometry.js';

export function createScrapBucket(cfg) {
  const group = new THREE.Group();
  group.position.set(cfg.x, cfg.y, cfg.z);

  group.add(cyl(1.8, 1.6, 3, 16, MAT.steelDark, 0, 0, 0));

  // Дно (открывающаяся заслонка)
  const bottomCap = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 16),
    new THREE.MeshStandardMaterial({
      color: 0x2a2f36, metalness: 0.8, roughness: 0.5, side: THREE.DoubleSide,
    })
  );
  bottomCap.rotation.x = -Math.PI / 2;
  bottomCap.position.y = -1.5;
  group.add(bottomCap);

  // Петли для крюков
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.04, 8, 20), MAT.steelDark
    );
    eye.rotation.y = Math.PI / 2;
    eye.position.set(side * 1.5, 1.5, 0);
    group.add(eye);
  }

  return { group, bottomCap };
}