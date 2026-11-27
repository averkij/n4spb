// Sampson Cathedral garden, the public approach to Lesnaya, and Klimov Square.
// Sources and the distinction between the realised displays and the designer's
// cloud proposal are in docs/research/sampson-winter.md.
import * as THREE from 'three';
import { VB } from './traffic/vb.js';
import { knockInstances } from './lib/knock-inst.js';

export const SAMPSON_SQUARES = [
  {
    id: 'klimov-square', tree: [-1060, -5788, 14],
    arches: [[-1068, -5792, -.28], [-1052, -5784, -.28]],
    orbs: [[-1054, -5794], [-1066, -5782]], snow: [-1052, -5796],
  },
  {
    id: 'lesnaya-metro', tree: [-426, -5858, 11],
    arches: [[-434, -5862, -.22]], orbs: [[-420, -5864], [-432, -5852]],
  },
  {
    id: 'sampson-garden', tree: [-428, -4084, 8],
    arches: [[-420, -4080, .26]], orbs: [[-434, -4078]], snow: [-422, -4090],
  },
];

// Two outlines in parallel give the cloud volume from either side. A small
// inclined pair of wings rises above it, matching the square's aviation motif.
function cloudLights() {
  const lights = new VB(), start = [-1.44, .48];
  const contour = new THREE.Path();
  contour.moveTo(...start);
  contour.bezierCurveTo(-2.28, .54, -2.14, 1.73, -1.39, 1.81);
  contour.bezierCurveTo(-1.46, 2.50, -.64, 2.80, -.18, 2.33);
  contour.bezierCurveTo(.25, 3.08, 1.46, 2.61, 1.38, 1.85);
  contour.bezierCurveTo(2.32, 1.91, 2.42, .56, 1.55, .48);
  contour.lineTo(...start);
  const outline = contour.getPoints(7);
  for (const z of [-.36, .36]) {
    for (let i = 1; i < outline.length; i++) {
      const a = outline[i - 1], b = outline[i];
      lights.rod([a.x, a.y, z], [b.x, b.y, z], .042, z > 0 ? '#def8ff' : '#8ac4ea', 5);
    }
  }
  for (let i = 0; i < outline.length - 1; i += 3) {
    const p = outline[i];
    lights.rod([p.x, p.y, -.36], [p.x, p.y, .36], .022, '#b5ddec', 5);
  }
  const wings = [[-1.23, 3.58, -.12], [-.47, 3.42, -.18], [0, 3.02, 0], [.38, 3.54, .13], [1.08, 3.87, .19]];
  for (let i = 1; i < wings.length; i++) lights.rod(wings[i - 1], wings[i], .038, '#ffdb92', 5);
  return lights.build();
}

export function buildSampsonFestival(ctx, glow) {
  const net = ctx.services.streets?.net || ctx._roadPlan;
  const spots = [
    { x: -1042, z: -5742, rotY: -.39, s: 1 },
    { x: -1052, z: -5736, rotY: -.65, s: .77 },
    { x: -1032, z: -5744, rotY: -.19, s: .88 },
  ].filter(({ x, z, s }) => {
    const r = 2.25 * s;
    return ctx.L.inPlay(x, z) && ctx.L.waterLevelAt(x, z) == null && !ctx.L.insideBuilding(x, z, r)
      && (net ? net.cover(x, z, {}) < -r - .5 : !ctx.L.isOnRoad(x, z, r + .5))
      && !ctx.physics.columnBlocked(x, z, r, .32, 3.9 * s);
  });
  if (!spots.length) return;
  const stand = new VB();
  stand.box(2.65, .20, .9, '#797c82', [0, .10, 0]);
  for (const x of [-.85, .85]) stand.rod([x, .19, 0], [x, .5, 0], .04, '#859293', 5);
  stand.rod([0, .17, 0], [0, 3.04, 0], .025, '#899498', 5);
  knockInstances(ctx, {
    name: 'klimov-cloud', spots, far: 230,
    parts: [
      { geo: stand.build(), mat: ctx.mat.toon('#ffffff', { name: 'klimov-cloud-base', vertexColors: true }) },
      { geo: cloudLights(), mat: glow, shadow: false, noOutline: true },
    ],
    items: (_, p) => ctx.physics.addBox(p.x, p.z, 4.25 * p.s, .86 * p.s, p.rotY, 0, 2.55 * p.s),
    rec: p => ({ kind: 'lamp', w: 4.25 * p.s, d: .86 * p.s, h: 3.9 * p.s, mass: 65 * p.s, metal: true }),
  });
}
