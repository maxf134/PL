import * as THREE from 'three';
import { MAT } from '../../utils/materials.js';
import { box, cyl } from '../../utils/geometry.js';

export function createEAF(cfg) {
  const group = new THREE.Group();
  group.position.set(cfg.x, cfg.y, cfg.z);
  group.add(box(8, 0.6, 8, MAT.concrete, 0, 0.3, 0));

  const tilt = new THREE.Group();
  tilt.position.y = 0.6;

  // Корпус — открыт сверху и снизу, видна внутренность
  const shellMat = MAT.steelDark.clone();
  shellMat.side = THREE.DoubleSide;
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 3.5, 5.5, 32, 1, true), shellMat
  );
  shell.position.y = 3.2;
  shell.castShadow = true;
  tilt.add(shell);

  // Под (закрытый цилиндр) — то, на чём лежит лом
  tilt.add(cyl(3.6, 3.6, 1.0, 32, MAT.steelLight, 0, 0.9, 0));

  // Носок выпуска — удлинён, чтобы струя была почти вертикальной
  tilt.add(box(1.5, 0.6, 1.2, MAT.steelDark, 3.75, 5.5, 0));

  // Колонна шарнира свода (-X)
  tilt.add(cyl(0.15, 0.15, 7, 8, MAT.steelDark, -3.5, 5.5, 0));

  // Свод на шарнире
  const roofPivot = new THREE.Group();
  roofPivot.position.set(-3.5, 6.3, 0);
  const roofMesh = cyl(3.6, 3.6, 0.7, 32, MAT.steelLight, 3.5, 0, 0);
  roofPivot.add(roofMesh);

  // Электроды — дети свода, высота 4 м
  const electrodes = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const e = cyl(0.22, 0.22, 4, 12, MAT.steelDark,
      Math.cos(a) * 1.4 + 3.5, -1.5, Math.sin(a) * 1.4);
    electrodes.push(e);
    roofPivot.add(e);
  }

  tilt.add(roofPivot);

  // Свечение дуг
  const arcGlow = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), MAT.arc.clone());
  arcGlow.position.set(0, 3.5, 0);
  tilt.add(arcGlow);

  // Штабель лома на дне — скрыт до загрузки
  const scrapPile = new THREE.Group();
  scrapPile.position.y = 1.5;
  scrapPile.visible = false;
  const scrapMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.6, roughness: 0.7 });
  for (let i = 0; i < 20; i++) {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(0.3 + Math.random() * 0.3, 0.2 + Math.random() * 0.2, 0.4 + Math.random() * 0.3),
      scrapMat
    );
    const r = Math.random() * 2.2;
    const a = Math.random() * Math.PI * 2;
    b.position.set(Math.cos(a) * r, Math.random() * 0.3, Math.sin(a) * r);
    b.rotation.set(Math.random(), Math.random(), Math.random());
    scrapPile.add(b);
  }
  tilt.add(scrapPile);

  group.add(tilt);
  return { group, tilt, roofPivot, electrodes, arcGlow, scrapPile };
}