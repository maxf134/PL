import * as THREE from 'three';
import { MAT } from '../../utils/materials.js';
import { box, cyl } from '../../utils/geometry.js';

export function createRollerTable(x, z1, z2) {
  const group = new THREE.Group();
  for (let z = z1; z <= z2; z += 2) {
    group.add(box(0.3, 1, 0.3, MAT.steelDark, x - 1, 0.5, z));
    group.add(box(0.3, 1, 0.3, MAT.steelDark, x + 1, 0.5, z));
    const r = cyl(0.25, 0.25, 2.2, 10, MAT.steelLight, x, 1, z);
    r.rotation.z = Math.PI / 2;
    group.add(r);
  }
  return { group };
}