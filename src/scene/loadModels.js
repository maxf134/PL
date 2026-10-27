import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LAYOUT } from './layout.js';

const loader = new GLTFLoader();
// Автоматически подставляет /PL/ на GitHub Pages и / локально
const base = import.meta.env.BASE_URL;

function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}

function findNode(parent, name) {
  const node = parent.getObjectByName(name);
  if (!node) console.warn(`⚠️ В модели не найден узел: "${name}"`);
  return node;
}

export async function loadAllModels(scene) {
  const [
    eafGltf, lfGltf, ccmGltf, craneGltf, ladleGltf,
    bucketGltf, rollerGltf, deskGltf, carGltf, tundishGltf
  ] = await Promise.all([
    loadModel(`${base}models/eaf.glb`),
    loadModel(`${base}models/ladle_furnace.glb`),
    loadModel(`${base}models/ccm.glb`),
    loadModel(`${base}models/crane.glb`),
    loadModel(`${base}models/ladle.glb`),
    loadModel(`${base}models/scrap_bucket.glb`),
    loadModel(`${base}models/roller_table.glb`),
    loadModel(`${base}models/control_desk.glb`),
    loadModel(`${base}models/ladle_car.glb`),
    loadModel(`${base}models/tundish.glb`)
  ]);

  const handleL = findNode(craneGltf, 'handle_L');
  const handleR = findNode(craneGltf, 'handle_R');
  if (handleL) handleL.rotation.y = -Math.PI / 2; 
  if (handleR) handleR.rotation.y = Math.PI / 2;

  // --- ПОЗИЦИОНИРОВАНИЕ ---
  eafGltf.position.set(LAYOUT.eaf.x, LAYOUT.eaf.y, LAYOUT.eaf.z);
  
  const lfContainer = new THREE.Group();
  lfContainer.position.set(LAYOUT.lf.x, LAYOUT.lf.y, LAYOUT.lf.z);
  lfContainer.rotation.y = -Math.PI / 2;
  lfGltf.position.set(0, 0, 0); 
  lfContainer.add(lfGltf);

  ccmGltf.position.set(LAYOUT.ccm.x, LAYOUT.ccm.y, LAYOUT.ccm.z);
  
  // УВЕЛИЧИВАЕМ КРАН (1.5 = 150% от исходного размера)
  const CRANE_SCALE = 1.5;
  craneGltf.scale.set(CRANE_SCALE, CRANE_SCALE, CRANE_SCALE);
  craneGltf.position.set(0, 0, 0); 
  
  ladleGltf.position.set(LAYOUT.ladleStart.x, LAYOUT.ladleStart.y, LAYOUT.ladleStart.z);
  bucketGltf.position.set(LAYOUT.bucketPark.x, LAYOUT.bucketPark.y, LAYOUT.bucketPark.z);
  rollerGltf.position.set(LAYOUT.roller.x, 0, LAYOUT.roller.z1);
  deskGltf.position.set(LAYOUT.desk.x, LAYOUT.desk.y, LAYOUT.desk.z);
  carGltf.position.set(LAYOUT.ladleStart.x, 0, LAYOUT.ladleStart.z); 
  
  tundishGltf.position.set(0, 6.8, -12);
  ccmGltf.add(tundishGltf);

  scene.add(eafGltf, lfContainer, ccmGltf, craneGltf, ladleGltf, bucketGltf, rollerGltf, deskGltf, carGltf);

  const eafTiltNode = findNode(eafGltf, 'tilt') || eafGltf;

  return {
    eaf: {
      group: eafGltf,
      tilt: eafTiltNode, 
      roofPivot: findNode(eafGltf, 'roofPivot'),
      electrodes: [
        findNode(eafGltf, 'electrode_1'),
        findNode(eafGltf, 'electrode_2'),
        findNode(eafGltf, 'electrode_3')
      ].filter(Boolean)
    },
    lf: {
      group: lfContainer, 
      roof: findNode(lfGltf, 'roof'),
      electrodes: []
    },
    ccm: {
      group: ccmGltf,
      billet: findNode(ccmGltf, 'billet')
    },
    crane: {
      group: craneGltf,
      bridge: findNode(craneGltf, 'bridge'),
      trolley: findNode(craneGltf, 'trolley'),
      hooksGroup: findNode(craneGltf, 'hooksGroup'),
      hookL: findNode(craneGltf, 'hookL'),
      hookR: findNode(craneGltf, 'hookR'),
      wireL: findNode(craneGltf, 'wireL'),
      wireR: findNode(craneGltf, 'wireR')
    },
    ladle: {
      group: ladleGltf
    },
    bucket: {
      group: bucketGltf,
      bottomCap: findNode(bucketGltf, 'bottomCap') 
    },
    desk: { group: deskGltf },
    car: carGltf
  };
}