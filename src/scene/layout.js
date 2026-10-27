export const LAYOUT = {
  hall: { w: 80, d: 90 },
  eaf: { x: -25, y: 0, z: 0, w: 8, h: 12, d: 8 },
  lf:  { x: -6,  y: 0, z: 0, w: 6, h: 10, d: 6 },
  ccm: { x: 12,  y: 0, z: 0, w: 10, h: 12, d: 30 },
  rails: { x1: -20, x2: 6, z: 0 },
  crane: { spanZ: 28, y: 26, travelX: { min: -32, max: 5 } },
  ladleStart: { x: -19, y: 1.0, z: 0 }, // 1.0 — это высота платформы сталевоза
  bucketPark: { x: -20, y: 1.5, z: 8 },
  desk: { x: -14, y: 0, z: 12 },
  roller: { x: 12, z1: 15, z2: 30 },
  colliders: [
    { min: { x: -29, z: -4.5 }, max: { x: -21, z: 4.5 } },  // ЭДП
    { min: { x: -10, z: -4 },   max: { x: -2,  z: 4 } },    // печь-ковш
    { min: { x: 5,   z: -16 },  max: { x: 19,  z: 16 } },   // МНЛЗ
    { min: { x: -15.15, z: 11.45 }, max: { x: -12.85, z: 12.55 } },  // пульт
    { min: { x: -21.8, z: 6.2 }, max: { x: -18.2, z: 9.8 } },         // корзина
  ],
  bounds: { xMin: -38, xMax: 38, zMin: -28, zMax: 28 },
};