import * as THREE from 'three';
import { MAT } from '../../utils/materials.js';
import { box } from '../../utils/geometry.js';

function makePanelTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a2230';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#4ea3ff';
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, c.width - 12, c.height - 12);
  ctx.fillStyle = '#e8eef5';
  ctx.font = 'bold 84px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('ПУЛЬТ', c.width / 2, 160);
  ctx.fillText('УПРАВЛЕНИЯ', c.width / 2, 280);
  ctx.fillStyle = '#4ea3ff';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('F — открыть', c.width / 2, 410);
  return new THREE.CanvasTexture(c);
}

export function createControlDesk(cfg) {
  const group = new THREE.Group();
  group.position.set(cfg.x, cfg.y, cfg.z);
  group.add(box(2.2, 1.2, 1.0, MAT.desk, 0, 0.6, 0));

  const tex = makePanelTexture();
  const panelMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.3 });
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.08, 1.0),
    [MAT.desk, MAT.desk, panelMat, MAT.desk, MAT.desk, MAT.desk]
  );
  panel.position.set(0, 1.24, 0);
  panel.rotation.x = 0.3;
  group.add(panel);

  return { group };
}