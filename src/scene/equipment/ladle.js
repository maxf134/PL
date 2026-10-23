import * as THREE from 'three';
import { MAT } from '../../utils/materials.js';

export function createLadle(cfg) {
  const group = new THREE.Group();
  group.position.set(cfg.x, cfg.y, cfg.z);

  // Открытая сверху стенка
  const shellMat = MAT.ladle.clone();
  shellMat.side = THREE.DoubleSide;
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.5, 3, 24, 1, true), shellMat
  );
  shell.position.y = 1.5;
  shell.castShadow = true;
  group.add(shell);

  // Дно
  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.15, 24),
    new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.8, roughness: 0.5, side: THREE.DoubleSide })
  );
  bottom.position.y = 0.075;
  group.add(bottom);

  // Обод
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.08, 8, 24), MAT.steelDark);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 3;
  group.add(rim);

  // Петли для крюков (x = ±1.5, y = 3.05)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.04, 8, 20), MAT.steelDark
    );
    eye.rotation.y = Math.PI / 2;
    eye.position.set(side * 1.5, 3.05, 0);
    group.add(eye);
  }

  // Расплав
  const moltenMat = new THREE.MeshBasicMaterial({
    color: 0xff8822, transparent: true, opacity: 0, side: THREE.DoubleSide,
  });
  const molten = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), moltenMat);
  molten.rotation.x = -Math.PI / 2;
  molten.position.y = 0.2;
  group.add(molten);

  return { group, molten };
}