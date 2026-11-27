// Winter installations on the paved squares and station forecourts. The LED
// arch groups at Sennaya and the historic fair by the Youth Theatre inform the
// two walk-through installations. The other layouts are seasonal interpretations.
// https://spbdnevnik.ru/news/2025-12-24/kak-ukrasili-k-novomu-godu-peterburg
// https://www.gov.spb.ru/gov/otrasl/inspek/news/102522/
import { VB } from './traffic/vb.js';
import { knockInstances } from './lib/knock-inst.js';
import { FINLYANDSKY_SQUARES, buildFinlyandskyCrystals } from './winter-finlyandsky.js';
import { KRONVERK_SQUARES } from './winter-kronverk.js';
import { VASILYEVSKY_SQUARES, buildVasilyevskyPlanets } from './winter-vasilyevsky.js';
import { MOSKOVSKAYA_SQUARES, buildMoskovskayaFestival } from './winter-moskovskaya.js';
import { KOLOMNA_SQUARES, buildKolomnaFestival } from './winter-kolomna.js';
import { SAMPSON_SQUARES, buildSampsonFestival } from './winter-sampson.js';

// World coordinates keep installations in the same places on overlapping pages.
// x, z, fir height; arch/orb placements are independent of the fir footprint.
const squares = [
  { id: 'sennaya', tree: [-1734, 704, 13], arches: [[-1740, 698, 0.70], [-1728, 710, 0.70]], orbs: [[-1734, 696]] },
  { id: 'teatralnaya', tree: [-3038, 754, 10], orbs: [[-3046, 754], [-3038, 746]], snow: [-3038, 762] },
  { id: 'isaac-garden', tree: [-2449, -63, 11], arches: [[-2443, -57, 0.65]], orbs: [[-2457, -63]] },
  { id: 'pionerskaya', tree: [-1090, 1200, 14], arches: [[-1096, 1194, -0.65], [-1084, 1206, -0.65]], orbs: [[-1098, 1200]], snow: [-1090, 1208] },
  { id: 'vitebsky-forecourt', tree: [-1271, 1370, 10], orbs: [[-1277, 1364], [-1265, 1364]] },
  { id: 'baltic-forecourt', tree: [-2933, 2772, 11], arches: [[-2941, 2772, 0.40]], orbs: [[-2925, 2772]] },
  { id: 'troitskaya', tree: [-1443, -2297, 12], arches: [[-1443, -2305, 0.18]], orbs: [[-1435, -2297], [-1451, -2297]], snow: [-1437, -2291] },
  { id: 'tolstoy-square', tree: [-2194, -3699, 8], orbs: [[-2188, -3693], [-2188, -3705]] },
  ...FINLYANDSKY_SQUARES, ...KRONVERK_SQUARES, ...VASILYEVSKY_SQUARES,
  ...SAMPSON_SQUARES, ...KOLOMNA_SQUARES, ...MOSKOVSKAYA_SQUARES,
];

const gold = '#ffd483', ice = '#c6edf7', red = '#d64d47';

// A double LED rib on weighted fir-filled planters. The middle stays open.
function archGeometry() {
  const frame = new VB(), lights = new VB();
  for (const side of [-1, 1]) {
    const x = side * 1.72;
    frame.box(0.62, 0.44, 0.64, '#694047', [x, 0.22, 0]);
    frame.box(0.68, 0.07, 0.70, '#b8bec0', [x, 0.46, 0]);
    frame.cyl(0.025, 0.42, 0.94, '#30574c', [x, 0.94, 0], null, 8);
    for (const [r, color] of [[1.72, gold], [1.49, ice]]) {
      lights.rod([side*r, 0.48, 0], [side*r, 2.14, 0], 0.038, color);
    }
  }
  for (const [r, color] of [[1.72, gold], [1.49, ice]]) {
    lights.torus(r, 0.044, color, [0, 2.14, 0], null, 5, 24, Math.PI);
  }
  for (let i = 1; i < 12; i++) {
    const a = i * Math.PI / 12;
    lights.sph(0.075, i % 2 ? gold : red, [1.60 * Math.cos(a), 2.14 + 1.60 * Math.sin(a), 0], 6);
  }
  return { frame, lights };
}

// A giant glass-bauble silhouette in open, illuminated meridians.
function baubleGeometry() {
  const frame = new VB(), lights = new VB();
  frame.cyl(0.56, 0.72, 0.24, '#725651', [0, 0.12, 0], null, 12);
  const r = 1.08, cy = 1.24;
  for (let i = 0; i < 6; i++) {
    lights.torus(r, 0.034, i % 2 ? gold : ice, [0, cy, 0], [0, i * Math.PI / 6, 0], 5, 24);
  }
  for (const lat of [-0.42, 0, 0.42]) {
    lights.torus(r * Math.cos(lat), 0.035, gold, [0, cy + r * Math.sin(lat), 0], [Math.PI / 2, 0, 0], 5, 24);
  }
  frame.cyl(0.23, 0.25, 0.18, '#c39a59', [0, 2.36, 0], null, 10);
  lights.torus(0.18, 0.042, gold, [0, 2.56, 0], null, 5, 14);
  return { frame, lights };
}

function clear(ctx, x, z, r, h) {
  const L = ctx.L;
  if (!L.inPlay(x, z) || L.waterLevelAt(x, z) != null || L.insideBuilding(x, z, r)) return false;
  const road = ctx.services.streets?.net || ctx._roadPlan;
  if (road ? road.cover(x, z, {}) >= -r - 0.5 : L.isOnRoad(x, z, r + 0.5)) return false;
  return !ctx.physics.columnBlocked(x, z, r, 0.32, h);
}

function placeMarketHuts(ctx, glow, spots) {
  if (!spots.length) return;
  const wood = new VB(), bulbs = new VB();
  const plank = '#8b5340', trim = '#a73737';
  wood.box(3.42, 0.16, 2.38, '#584b40', [0, 0.08, 0]);
  wood.box(3.38, 2.25, 0.12, plank, [0, 1.25, -1.10]);
  for (const side of [-1, 1]) {
    wood.box(0.14, 2.20, 2.25, plank, [side * 1.60, 1.20, 0]);
    wood.box(0.14, 2.30, 0.14, trim, [side * 1.62, 1.26, 1.09]);
    const pitch = -side * 0.46;
    wood.box(2.02, 0.15, 2.66, trim, [side * 0.88, 2.76, 0], [0, 0, pitch]);
    wood.box(2.05, 0.11, 2.69, '#dae2e5', [side * 0.88, 2.87, 0], [0, 0, pitch]);
    for (let i = 0; i <= 6; i++) {
      const x = side * i * 0.27;
      bulbs.sph(0.065, i % 3 ? gold : red, [x, 3.10 - Math.abs(x) * 0.49, 1.35], 6);
    }
  }
  wood.box(3.22, 0.92, 0.14, trim, [0, 0.59, 1.05]);
  wood.box(3.45, 0.12, 0.50, '#cb9a73', [0, 1.10, 1.06]);
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 0.43;
    wood.box(0.28, 0.19, 0.25, i % 2 ? '#547771' : '#c66e50', [x, 1.255, 1.05]);
    wood.box(0.04, 0.205, 0.26, '#e8cd9b', [x, 1.26, 1.05]);
  }
  knockInstances(ctx, {
    name: 'festive-market-hut', spots, far: 245,
    parts: [{ geo: wood.build(), mat: ctx.mat.toon('#ffffff', { vertexColors: true, name: 'fair-timber' }) },
      { geo: bulbs.build(), mat: glow, shadow: false, noOutline: true }],
    items: (_, { x, z, rotY }) => ctx.physics.addBox(x, z, 3.42, 2.38, rotY, 0, 2.40),
    rec: { kind: 'stand', w: 3.42, d: 2.38, h: 3.35, mass: 240 },
  });
}

function placeFixtures(ctx, glow, spots, arches) {
  if (!spots.length) return;
  const { frame, lights } = arches ? archGeometry() : baubleGeometry();
  const mat = ctx.mat.toon('#ffffff', { vertexColors: true, name: 'festival-metalwork' });
  knockInstances(ctx, {
    name: arches ? 'festive-arch' : 'festive-bauble', spots, far: 210,
    parts: [{ geo: frame.build(), mat }, { geo: lights.build(), mat: glow, shadow: false, noOutline: true }],
    items: (_, { x, z, rotY }) => {
      if (!arches) return ctx.physics.addCylinder(x, z, 1.06, 0, 2.36);
      const feet = [-1.72, 1.72].map(dx =>
        ctx.physics.addCylinder(x + dx * Math.cos(rotY), z - dx * Math.sin(rotY), 0.34, 0, 2.22));
      feet.push(ctx.physics.addBox(x, z, 2.6, 0.17, rotY, 3.04, 3.82));
      return feet;
    },
    rec: arches ? { kind: 'lamp', w: 4, d: 0.7, h: 3.9, mass: 94, metal: true } :
      { kind: 'lamp', r: 1.08, h: 2.78, mass: 42, metal: true },
  });
}

export function buildDistrictSquares(ctx, glow, decoratedFir, snowman) {
  const arches = [], orbs = [], huts = [];
  for (const site of squares) {
    const [x, z, h] = site.tree;
    if (!ctx.L.inPlay(x, z)) continue;
    if (clear(ctx, x, z, h * 0.24, h)) decoratedFir(ctx, site.id, x, z, h, glow);
    for (const [x, z, rotY] of site.arches || []) {
      if (clear(ctx, x, z, 2.08, 3.9)) arches.push({ x, z, rotY });
    }
    for (const [x, z] of site.orbs || []) {
      if (clear(ctx, x, z, 1.1, 2.8)) orbs.push({ x, z });
    }
    for (const [x, z, rotY] of site.huts || []) {
      if (clear(ctx, x, z, 2.25, 3.65)) huts.push({ x, z, rotY });
    }
    if (site.snow && clear(ctx, ...site.snow, 0.65, 1.7)) snowman(ctx, ...site.snow, 0.8);
  }
  placeFixtures(ctx, glow, arches, true);
  placeFixtures(ctx, glow, orbs, false);
  placeMarketHuts(ctx, glow, huts);
  buildFinlyandskyCrystals(ctx, glow);
  buildVasilyevskyPlanets(ctx, glow);
  buildMoskovskayaFestival(ctx, glow);
  buildKolomnaFestival(ctx, glow);
  buildSampsonFestival(ctx, glow);
}
