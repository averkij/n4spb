// The city programme covers Lenin Square, Simbirsky Garden and Kalinin Square.
// Photographs and the distinction between documented sites and our light
// arrangements are in docs/research/finlyandsky-winter.md.
import { VB } from './traffic/vb.js';
import { knockInstances } from './lib/knock-inst.js';

export const FINLYANDSKY_SQUARES = [
  {
    id: 'finland-lenin-square', tree: [266, -2504, 17],
    arches: [[258, -2501, -.28], [274, -2507, -.28]],
    orbs: [[261, -2511], [271, -2497]], snow: [261, -2497],
  },
  {
    id: 'simbirsky-garden', tree: [500, -2546, 9],
    arches: [[500, -2537, -.28]], orbs: [[492, -2543], [508, -2549]],
    snow: [495, -2553],
  },
];

// A six-sided, slightly leaning prism. Each group uses one shared light mesh
// for its facet edges; the bases and their knock contacts scale with each prism.
function crystalEdges() {
  const lights = new VB(), tip = [.26, 4.2, -.09];
  const ring = (radius, y, dx) => Array.from({ length: 6 }, (_, i) => {
    const angle = i * Math.PI / 3;
    return [dx + radius * Math.cos(angle), y, radius * Math.sin(angle)];
  });
  const foot = ring(.34, .14, 0), shoulder = ring(.67, 2.94, .15);
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const colour = i % 2 ? '#a9d9f4' : '#eff2d6';
    lights.rod(foot[i], shoulder[i], .043, colour, 5);
    lights.rod(shoulder[i], shoulder[j], .032, '#c4edfa', 5);
    lights.rod(shoulder[i], tip, .043, colour, 5);
    lights.rod(foot[i], shoulder[j], .021, '#99c7de', 5);
  }
  return lights.build();
}

export function buildFinlyandskyCrystals(ctx, glow) {
  const road = ctx.services.streets?.net || ctx._roadPlan;
  const spots = [
    { x: 1940, z: -4200, s: 1, rotY: -.42 },
    { x: 1945, z: -4193, s: .7, rotY: 1.4 },
    { x: 1948, z: -4197, s: .84, rotY: .62 },
  ].filter(({ x, z, s }) => {
    const r = .85 * s;
    return ctx.L.inPlay(x, z) && ctx.L.waterLevelAt(x, z) == null &&
      !ctx.L.insideBuilding(x, z, r) &&
      (road ? road.cover(x, z, {}) < -r - .5 : !ctx.L.isOnRoad(x, z, r + .5)) &&
      !ctx.physics.columnBlocked(x, z, r, .32, 4.2 * s);
  });
  if (!spots.length) return;
  const base = new VB();
  base.cyl(.49, .59, .16, '#889298', [0, .08, 0], null, 6);
  const metal = ctx.mat.toon('#ffffff', { vertexColors: true, name: 'kalinin-crystal-foot' });
  knockInstances(ctx, {
    name: 'kalinin-light-crystal', spots, far: 235,
    parts: [{ geo: base.build(), mat: metal }, { geo: crystalEdges(), mat: glow, noOutline: true, shadow: false }],
    items: (_, p) => ctx.physics.addCylinder(p.x, p.z, .60*p.s, 0, 4.2*p.s),
    rec: p => ({ kind: 'lamp', h: 4.2*p.s, r: .67*p.s, mass: 43*p.s, metal: true }),
  });
}
