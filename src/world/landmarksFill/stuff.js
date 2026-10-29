// landmarksFill/stuff.js - the MOVABLE and BREAKABLE things of the sites (the owner's rule, docs/AREAS.md 13.7): the hoardings are knock BAYS (lib/fence-bays.js), containers, site cabins, pallets, big-bags, pipe piles,
// machines and the floodlight masts are knock RECORDS (lib/knock-furniture.js; each with its collider box, removed at the knock, a rest box of at most 0.42 m takes its place). Geometry comes from the Parts collector
// (one InstancedMesh per material and 384 m cell, instance colours for the container / cabin paint).
import * as THREE from 'three';
import { Parts } from './kit.js';
import { partsGeos, kBays } from './inst.js';
import { FURNITURE_REC } from '../lib/knock-furniture.js';
import { knockInstances } from '../lib/knock-inst.js';
import { unitBox } from '../lib/fence-bays.js';
import { toWorld } from './plan.js';

const WHITE = '#ffffff';
const CONTAINER_COLORS = ['#2f5f95', '#b13a2f', '#4f8a52', '#d9772b', '#8a8f94', '#c9a227', '#3b4046', '#6d7f93'];
const CABIN_COLORS = ['#2f5f95', '#d9772b', '#dcdcd4', '#4f8a52'];

// ---------------------------------------------------------------- geometries (foot at y 0, centred; long axis x)
const containerGeo = (M) => partsGeos((P) => {
  P.tint(WHITE).box(M.vc, -3.03, 3.03, 0.12, 2.5, -1.22, 1.22, '', 2);
  P.tint('#3d4247').box(M.vc, -3.03, 3.03, 0, 0.12, -1.22, 1.22, 'b', 2).box(M.vc, -3.03, 3.03, 2.5, 2.59, -1.22, 1.22, 'b', 2);
  P.tint('#e6e4dc'); for (const k of [-1.8, 0, 1.8]) P.quad(M.vc, [k - 0.05, 0.2, 1.23], [k + 0.05, 0.2, 1.23], [k + 0.05, 2.4, 1.23], [k - 0.05, 2.4, 1.23], [0, 0, 1]);
});
const cabinGeo = (M) => partsGeos((P) => {
  P.tint(WHITE).box(M.vc, -3, 3, 0.35, 2.75, -1.2, 1.2, '', 2);
  P.tint('#55595e').box(M.vc, -3, 3, 0.1, 0.35, -1.1, 1.1, 'b', 2).box(M.vc, -3.1, 3.1, 2.75, 2.85, -1.3, 1.3, 'b', 2);
  P.tint(M.PAL.glass); for (const x of [-1.9, -0.2, 1.5]) P.quad(M.vc, [x, 1.2, 1.215], [x + 1.1, 1.2, 1.215], [x + 1.1, 2.2, 1.215], [x, 2.2, 1.215], [0, 0, 1]);
  P.tint('#e8e6de').quad(M.vc, [2.35, 0.4, 1.215], [3.0, 0.4, 1.215], [3.0, 2.3, 1.215], [2.35, 2.3, 1.215], [0, 0, 1]);
});
const palletGeo = (M) => partsGeos((P) => {
  P.tint('#9a7a52').box(M.vc, -0.6, 0.6, 0, 0.14, -0.45, 0.45, 'b', 1);
  P.tint(M.PAL.brick).box(M.vc, -0.55, 0.55, 0.14, 0.95, -0.4, 0.4, 'b', 1);
  P.tint('#d9d6cc').box(M.vc, -0.56, 0.56, 0.6, 0.66, -0.41, 0.41, 'b', 1);
});
const bagGeo = (M) => partsGeos((P) => { P.tint('#d8d2c0').box(M.vc, -0.48, 0.48, 0, 0.98, -0.48, 0.48, 'b', 1); P.tint('#a7a08c').box(M.vc, -0.4, 0.4, 0.98, 1.06, -0.4, 0.4, 'b', 1); });
const pipeGeo = (M) => partsGeos((P) => {
  P.tint(M.PAL.pipe);
  const rows = [[4, 0.3], [3, 0.3], [2, 0.3]];
  rows.forEach(([n, r], j) => { for (let i = 0; i < n; i++) { const z = (i - (n - 1) / 2) * r * 2.05, y = r + j * r * 1.78; P.cyl(M.vc, [-3, y, z], [3, y, z], r, r, 8, false); } });
});
const mastGeo = (M) => partsGeos((P) => {
  P.tint('#8d9298').box(M.vc, -0.09, 0.09, 0, 12, -0.09, 0.09, 'b', 2);
  P.box(M.vc, -0.7, 0.7, 11.85, 11.97, -0.06, 0.06, 'b', 1);
  for (const x of [-0.6, 0, 0.6]) P.box(M.lampHead, x - 0.28, x + 0.28, 12.0, 12.35, -0.2, 0.2, 'b', 1);
});
const excavatorGeo = (M) => partsGeos((P) => {
  P.tint('#2c2f33'); for (const z of [-1.15, 1.15]) P.box(M.vc, -2.1, 2.1, 0, 0.8, z - 0.4, z + 0.4, '', 1);
  P.tint(M.PAL.yellow).box(M.vc, -1.5, 1.5, 0.8, 1.35, -1.2, 1.2, '', 1).box(M.vc, -1.4, 0.4, 1.35, 2.5, -1.2, 0.2, '', 1).box(M.vc, -1.9, -1.4, 1.35, 2.1, -1.1, 1.1, '', 1);
  P.tint(M.PAL.glass).quad(M.vc, [0.41, 1.55, -1.1], [0.41, 1.55, 0.1], [0.41, 2.35, 0.1], [0.41, 2.35, -1.1], [1, 0, 0]);
  P.tint(M.PAL.yellow).cyl(M.vc, [0.8, 1.2, 0.6], [3.4, 3.1, 0.6], 0.2, 0.17, 6, true).cyl(M.vc, [3.4, 3.1, 0.6], [5.0, 1.0, 0.6], 0.15, 0.12, 6, true);
  P.tint('#55595e').box(M.vc, 4.8, 5.8, 0.2, 1.1, 0.2, 1.0, '', 1);
});
const truckGeo = (M) => partsGeos((P) => {
  P.tint(M.PAL.orange).box(M.vc, 1.6, 3.6, 0.9, 3.0, -1.2, 1.2, '', 1);
  P.tint(M.PAL.glass).quad(M.vc, [3.62, 1.9, -1.0], [3.62, 1.9, 1.0], [3.62, 2.7, 1.0], [3.62, 2.7, -1.0], [1, 0, 0]);
  P.tint('#4a4f55').box(M.vc, -4.2, 1.5, 0.9, 1.3, -1.1, 1.1, '', 1);
  P.tint(M.PAL.yellow).box(M.vc, -4.2, 1.4, 1.3, 2.6, -1.25, 1.25, '', 1);
  P.tint('#26282b'); for (const x of [-3.4, -1.9, 2.6]) for (const z of [-1.15, 1.15]) P.cyl(M.vc, [x, 0.55, z - 0.17], [x, 0.55, z + 0.17], 0.55, 0.55, 8, true);
});

// ---------------------------------------------------------------- placement
const boxItem = (K, x, z, w, d, rot, y1) => { K.svc.colliders++; return K.ctx.physics.addBox(x, z, w, d, rot, 0, y1); };
const spotsOf = (S, list) => list.map((p) => { const [x, z] = toWorld(S.cx, S.cz, S.rot, p.x, p.z); return { x, y: 0, z, rotY: S.rot + (p.yaw || 0), col: p.col }; });

/** place one kind of thing: o = { name, geo, list: [{ x, z, yaw, col }] in the site frame, size: [w, d, h] (the collider box), rec, far }. The spots of every site are COLLECTED per kind and built once by flushStuff
 *  (one InstancedMesh per part and 384 m cell for the whole fill, not one per site) */
function put(K, S, o) {
  const spots = spotsOf(S, o.list); if (!spots.length) return 0;
  const items = spots.map((s) => boxItem(K, s.x, s.z, o.size[0], o.size[1], s.rotY, o.size[2]));
  const acc = K.acc.get(o.name) || { o, spots: [], items: [] }; K.acc.set(o.name, acc);
  acc.spots.push(...spots); acc.items.push(...items);
  K.svc.knock += spots.length;
  return 0;
}
/** build the collected things: one knockInstances per kind -> triangles */
export function flushStuff(K) {
  let tris = 0;
  for (const [name, { o, spots, items }] of K.acc) {
    // the instance colour of a part: only the vertex-colour material takes the paint (container / cabin colour); the lamp heads are an emissive material
    const parts = o.geo.list.map((p, i) => ({ geo: p.geo, mat: p.mat, name: 'p' + i, color: p.mat === K.M.vc ? (s) => s.col || null : undefined }));
    knockInstances(K.ctx, { name: 'lmfill-' + name, parts, spots, items, rec: o.rec, far: o.far || 300 });
    let n = 0; for (const { geo } of o.geo.list) n += (geo.index ? geo.index.count : geo.attributes.position.count) / 3 * spots.length;
    (K.svc.knockBy ||= {})[name] = Math.round(n) + '/' + spots.length; tris += n;
  }
  K.acc.clear();
  return tris;
}

/** the things of a site by type (positions in the site frame: x along the coast, z inland; the building stands at z -26, the yard side is z > 8) */
export function siteStuff(K, S, rng) {
  const G = K.geos, hw = S.w / 2, hd = S.d / 2, type = S.type;
  const rows = (z0, n, gap = 0.7, x0 = -hw + 6) => Array.from({ length: n }, (_, i) => ({ x: x0 + 3.03 + i * (6.06 + gap), z: z0, yaw: 0 }));
  let tris = 0;
  const cont = (list) => put(K, S, { name: 'container', geo: G.container, list: list.map((p) => ({ ...p, col: CONTAINER_COLORS[Math.floor(rng() * CONTAINER_COLORS.length)] })), size: [6.06, 2.44, 2.59], rec: { kind: 'booth', mass: 2200, h: 2.59, w: 6.06, d: 2.44, anchored: 26, hitK: 0.55, metal: true, minDv: 0 } });
  const cabins = (list) => put(K, S, { name: 'cabin', geo: G.cabin, list: list.map((p) => ({ ...p, col: CABIN_COLORS[Math.floor(rng() * CABIN_COLORS.length)] })), size: [6, 2.4, 2.8], rec: { kind: 'booth', mass: 900, h: 2.8, w: 6, d: 2.4, anchored: 16, hitK: 0.5, metal: true, minDv: 0 } });
  const crates = (geo, name, list, size, rec) => put(K, S, { name, geo, list, size, rec, far: 220 });
  const scatter = (n, x0, x1, z0, z1, f) => Array.from({ length: n }, () => f(x0 + rng() * (x1 - x0), z0 + rng() * (z1 - z0), (rng() - 0.5) * 0.6));
  if (type === 'topped' || type === 'frame' || type === 'pit') {
    tris += cont(rows(10, 3 + Math.floor(rng() * 3)).concat(rows(13.2, 2 + Math.floor(rng() * 3))));
    tris += cabins([{ x: -hw + 9, z: 40, yaw: 0 }, { x: -hw + 16.5, z: 40, yaw: 0 }, { x: -hw + 9, z: 43.2, yaw: 0 }].slice(0, 2 + Math.floor(rng() * 2)));
    tris += crates(G.pallet, 'pallet', scatter(5 + Math.floor(rng() * 4), 6, hw - 8, 20, 34, (x, z, yaw) => ({ x, z, yaw })), [1.2, 0.9, 1.0], { kind: 'crate', mass: 900, h: 1.0, w: 1.2, d: 0.9, hitK: 0.25, minDv: 0 });
    tris += crates(G.bag, 'bag', scatter(4, 6, hw - 8, 20, 34, (x, z, yaw) => ({ x, z, yaw })), [0.95, 0.95, 1.05], { kind: 'crate', mass: 600, h: 1.05, w: 0.96, d: 0.96, hitK: 0.22, minDv: 0 });
    if (type === 'pit') tris += crates(G.excavator, 'excavator', [{ x: hw - 24, z: 3, yaw: 0.4 }], [4.4, 2.6, 3], { kind: 'booth', mass: 7000, h: 3.2, w: 5, d: 2.8, anchored: 38, hitK: 0.7, metal: true, minDv: 0 });
    tris += crates(G.pipe, 'pipes', [{ x: hw - 14, z: 30, yaw: 0 }], [6, 2.3, 1.4], { kind: 'crate', mass: 2600, h: 1.4, w: 6, d: 2.4, hitK: 0.3, minDv: 0 });
  } else if (type === 'yard') {
    tris += cont(rows(-52, 8, 0.6, -hw + 6).concat(rows(-48.6, 8, 0.6, -hw + 6), rows(-30, 7, 0.6, -hw + 6), rows(-26.6, 7, 0.6, -hw + 6), rows(-8, 5, 0.6, -hw + 6)));
    tris += cabins([{ x: -hw + 9, z: 20, yaw: 0 }, { x: -hw + 16.5, z: 20, yaw: 0 }, { x: -hw + 24, z: 20, yaw: 0 }]);
    tris += crates(G.pipe, 'pipes', [{ x: -6, z: 40, yaw: 0 }, { x: 8, z: 40, yaw: 0.1 }, { x: 22, z: 40, yaw: -0.05 }], [6, 2.3, 1.4], { kind: 'crate', mass: 2600, h: 1.4, w: 6, d: 2.4, hitK: 0.3, minDv: 0 });
    tris += crates(G.pallet, 'pallet', scatter(10, -hw + 8, hw - 8, 52, 62, (x, z, yaw) => ({ x, z, yaw })), [1.2, 0.9, 1.0], { kind: 'crate', mass: 900, h: 1.0, w: 1.2, d: 0.9, hitK: 0.25, minDv: 0 });
    tris += crates(G.excavator, 'excavator', [{ x: hw - 14, z: 8, yaw: 0.5 }], [4.4, 2.6, 3], { kind: 'booth', mass: 7000, h: 3.2, w: 5, d: 2.8, anchored: 38, hitK: 0.7, metal: true, minDv: 0 });
    tris += crates(G.truck, 'truck', [{ x: hw - 40, z: 10, yaw: 0.2 }, { x: hw - 30, z: 30, yaw: -0.5 }], [8.6, 2.6, 3.2], { kind: 'booth', mass: 5500, h: 3.2, w: 8.6, d: 2.6, anchored: 34, hitK: 0.7, metal: true, minDv: 0 });
  } else if (type === 'plant') {
    tris += crates(G.truck, 'truck', [{ x: 8, z: 30, yaw: 0.2 }, { x: 22, z: 34, yaw: -0.3 }], [8.6, 2.6, 3.2], { kind: 'booth', mass: 5500, h: 3.2, w: 8.6, d: 2.6, anchored: 34, hitK: 0.7, metal: true, minDv: 0 });
    tris += cabins([{ x: -hw + 9, z: 44, yaw: 0 }, { x: -hw + 16.5, z: 44, yaw: 0 }]);
  } else if (type === 'graded') {
    if (rng() < 0.5) tris += cabins([{ x: rng() * 40 - 20, z: rng() * 60 - 30, yaw: rng() * 3 }]);
  }
  // floodlight masts: two per fenced site (the corners of the working area)
  if (type !== 'graded') {
    tris += put(K, S, { ...mastKind(K), list: [{ x: -hw + 6, z: -hd + 6, yaw: 0 }, { x: hw - 6, z: hd - 6, yaw: 0 }, { x: hw - 6, z: -hd + 6, yaw: 0 }] });
  }
  return tris;
}

const mastKind = (K) => ({ name: 'mast', geo: K.geos.mast, size: [0.5, 0.5, 12.4], rec: FURNITURE_REC.lamp(12.4), far: 520 });
export function makeGeos(M) {
  return { container: containerGeo(M), cabin: cabinGeo(M), pallet: palletGeo(M), bag: bagGeo(M), pipe: pipeGeo(M), mast: mastGeo(M), excavator: excavatorGeo(M), truck: truckGeo(M) };
}

/** the hoarding of a site: bays of 12 m round the plot, gates of 10 m. o.sides: which sides are fenced ('n' z -hd, 's' z +hd, 'w' x -hw, 'e' x +hw) */
export function hoarding(K, S, sides, rng) {
  const hw = S.w / 2 - 2, hd = S.d / 2 - 2, bays = [];
  const gates = [[rng() * 30 - 15, -hd], [hw, rng() * 40 - 20], [rng() * 30 - 15, hd]];
  const run = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 12));
    for (let i = 0; i < n; i++) {
      const p0 = [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n], p1 = [a[0] + (b[0] - a[0]) * (i + 1) / n, a[1] + (b[1] - a[1]) * (i + 1) / n], mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
      if (gates.some((g) => Math.hypot(g[0] - mx, g[1] - mz) < 6.2)) continue;
      const [x0, z0] = toWorld(S.cx, S.cz, S.rot, p0[0], p0[1]), [x1, z1] = toWorld(S.cx, S.cz, S.rot, p1[0], p1[1]);
      if (!K.plan.free((x0 + x1) / 2, (z0 + z1) / 2, 1, { water: 30, clear: false })) continue;
      bays.push({ x0, z0, x1, z1, y: 0 });
    }
  };
  // the corners (hw, hd) are walked clockwise: n side west -> east, e side north -> south, s side east -> west, w side south -> north
  if (sides.includes('n')) run([-hw, -hd], [hw, -hd]);
  if (sides.includes('e')) run([hw, -hd], [hw, hd]);
  if (sides.includes('s')) run([hw, hd], [-hw, hd]);
  if (sides.includes('w')) run([-hw, hd], [-hw, -hd]);
  K.bays.push(...bays); K.svc.bays += bays.length;
  return bays.length;
}
/** build the collected hoarding bays of every site (one knockBays call: one mesh per part and cell) */
export function flushHoarding(K) {
  const bays = K.bays; if (!bays.length) return 0;
  const M = K.M;
  const parts = [{ geo: unitBox(0.05, 2.0, -0.04, 0.04, { uLen: 12, uvs: 2 }), mat: M.hoard, name: 'panel', stretch: true, inset: 0.02 }];
  kBays(K, { name: 'lmfill-hoard', bays, far: 340, parts,
    collider: { y0: 0, y1: 2.1, thick: 0.15, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 500, h: 2.1, anchored: 16, hitK: 0.4, metal: false, minDv: 0 }) });
  return bays.length;
}

/** the floodlight masts of the embankment roadbed (avenue t = 120): every ~100 m on the inland side, where the ground is free */
export function embankmentMasts(K, roads, plan) {
  const spots = [], items = [];
  for (const r of roads) {
    if (r.kind !== 'avenue' || r.ref !== 120) continue;
    let acc = 60;
    for (let i = 2; i < r.pts.length; i += 2) {
      const ax = r.pts[i - 2], az = r.pts[i - 1], bx = r.pts[i], bz = r.pts[i + 1], l = Math.hypot(bx - ax, bz - az);
      acc += l;
      if (acc < 100) continue; acc = 0;
      const nx = 0.5740, nz = 0.8187, x = bx + nx * (r.w / 2 + 3), z = bz + nz * (r.w / 2 + 3);
      if (!plan.free(x, z, 1, { water: 24 })) continue;
      spots.push({ x, y: 0, z, rotY: 0 }); K.svc.colliders++; items.push(K.ctx.physics.addBox(x, z, 0.5, 0.5, 0, 0, 12.4));
    }
  }
  if (!spots.length) return 0;
  const acc = K.acc.get('mast') || { o: mastKind(K), spots: [], items: [] }; K.acc.set('mast', acc);
  acc.spots.push(...spots); acc.items.push(...items); K.svc.knock += spots.length;
  return spots.length;
}
