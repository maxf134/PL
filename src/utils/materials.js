import * as THREE from 'three';

export const MAT = {
  steelDark:  new THREE.MeshStandardMaterial({ color: 0x3a3f46, metalness: 0.85, roughness: 0.45 }),
  steelLight: new THREE.MeshStandardMaterial({ color: 0x8a9099, metalness: 0.85, roughness: 0.35 }),
  concrete:   new THREE.MeshStandardMaterial({ color: 0x6b6f74, metalness: 0.0,  roughness: 0.95 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x6b7079, metalness: 0.0, roughness: 0.9 }),
  ladle:      new THREE.MeshStandardMaterial({ color: 0xb5502a, metalness: 0.7,  roughness: 0.5 }),
  crane:      new THREE.MeshStandardMaterial({ color: 0xd9a300, metalness: 0.6,  roughness: 0.5 }),
  hot:        new THREE.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0.0 }),
  arc:        new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.0 }),
  billet:     new THREE.MeshStandardMaterial({ color: 0x8a2a12, emissive: 0x6a1a08, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.5 }),
  desk:       new THREE.MeshStandardMaterial({ color: 0x2a3038, metalness: 0.6,  roughness: 0.5 }),
  btnRed:     new THREE.MeshStandardMaterial({ color: 0xc0392b, metalness: 0.4,  roughness: 0.5, emissive: 0x441111 }),
  btnBlue:    new THREE.MeshStandardMaterial({ color: 0x2980b9, metalness: 0.4,  roughness: 0.5, emissive: 0x0a2240 }),
  btnGreen:   new THREE.MeshStandardMaterial({ color: 0x27ae60, metalness: 0.4,  roughness: 0.5, emissive: 0x0a3018 }),
  btnGray:    new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.4,  roughness: 0.5 }),
};