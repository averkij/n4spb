// landmarksSmolensky/fence.js - the fence and the walls of the cemetery (nobody else draws OSM fences), from the BARRIERS of the dossier (docs/research/smolensky.md sections 3.1-3.3, photos refs/smolensky 81 84 45 57 58):
//  * the forged BAR FENCE of Maly pr. and Beringa st. (w203893164, 1 861 m: 2.0 m, dark blue-black pickets with spear tips, scalloped band, posts every ~3.6 m: `bars` cut-out panels + posts);
//  * the plain grey concrete-panel WALL of Beketovskaya st. (w203893168, w201779490: 2.8 m);
//  * the plastered 2.0 m walls of the gate yard and the Kamskaya side (w203893166, w453130760, w109078563, w109078572);
//  * the black CAST-IRON LOT FENCE on a 0.55 m pink-granite socle round the Resurrection church (w453130759, w1160929450, w1160929451, w312980908: posts every ~5.7 m, taller gate posts).
// Gates (BARRIER_NODES kind 'gate') are OPEN gaps of 2.4 m (access=no / private ones stay closed; n1328766692 is open for walkers: the 1913 plan and the alley ends say so, decision of the builder); the lift gate
// n1249813820 is left raised (not drawn).  Road integrity: a panel or post whose end lies on real asphalt (net.cover) is dropped.  Colliders: thin boxes along every panel, none in the gaps.
// Publishes svc.fences [{ id, pts, h, kind }] and svc.gates [{ id, x, z, open, half }].
import * as L from '../layout.js';
import { barrierPts, nodes as barrierNodes } from './data.js';
import { splitBays, unitPanel, unitBox } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7): every panel of the fence and of the walls is a breakable bay
import { kBays } from './inst.js';

const RUNS = [
  { id: 'w203893164', kind: 'bars', h: 2.0, pitch: 3.6 },
  { id: 'w203893168', kind: 'concrete', h: 2.8, pitch: 3.0 }, { id: 'w201779490', kind: 'concrete', h: 2.8, pitch: 3.0 },
  { id: 'w203893166', kind: 'plaster', h: 2.0, pitch: 4.0 }, { id: 'w453130760', kind: 'plaster', h: 2.0, pitch: 4.0 },
  { id: 'w109078563', kind: 'plaster', h: 2.0, pitch: 4.0 }, { id: 'w109078572', kind: 'plaster', h: 2.0, pitch: 4.0 },
  { id: 'w453130759', kind: 'lot', h: 2.5, pitch: 5.7 }, { id: 'w1160929450', kind: 'lot', h: 2.5, pitch: 5.7 }, { id: 'w1160929451', kind: 'lot', h: 2.5, pitch: 5.7 }, { id: 'w312980908', kind: 'lot', h: 2.5, pitch: 5.7 },
];
const BOX = { x0: -6320, x1: -5300, z0: -1710, z1: -730 };
const GATE_HALF = 1.2;
const TILE = { bars: 3.6, concrete: 3.0, plaster: 4.0, lot: 5.7 };      // metres of one texture tile = the length of a bay

// ---- arc-length helpers (copy of the Karpovka planFence: posts at corners, every ~pitch and at both sides of every opening)
function lineInfo(pts) { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; }
function at(info, s) {
  const { pts, cum } = info; s = Math.max(0, Math.min(info.len, s)); let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i], l = cum[i] - cum[i - 1] || 1, t = (s - cum[i - 1]) / l;
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l };
}
function planFence(pts, pitch, opens = [], inset = 0.06) {
  const info = lineInfo(pts), op = [];
  for (const g of opens) {
    let best = null;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((g.x - a[0]) * dx + (g.z - a[1]) * dz) / l2));
      const d = Math.hypot(g.x - a[0] - dx * t, g.z - a[1] - dz * t);
      if (d < (g.tol ?? 2.5) && (!best || d < best.d)) best = { d, s: info.cum[i] + t * (info.cum[i + 1] - info.cum[i]), g };
    }
    if (best) op.push({ s: best.s, half: g.half ?? GATE_HALF, g });
  }
  const inOpen = (s, m = 0.05) => op.some((o) => s > o.s - o.half + m && s < o.s + o.half - m);
  let nodes = [];
  for (let i = 0; i < pts.length; i++) nodes.push({ s: info.cum[i], gate: false });
  for (let i = 0; i + 1 < pts.length; i++) { const l = info.cum[i + 1] - info.cum[i], n = Math.max(1, Math.round(l / pitch)); for (let k = 1; k < n; k++) nodes.push({ s: info.cum[i] + l * k / n, gate: false }); }
  for (const o of op) nodes.push({ s: Math.max(0, o.s - o.half), gate: true }, { s: Math.min(info.len, o.s + o.half), gate: true });
  nodes.sort((a, b) => a.s - b.s);
  nodes = nodes.filter((n) => n.gate || !inOpen(n.s)).filter((n, i, arr) => i === 0 || n.s - arr[i - 1].s > 0.3 || n.gate);
  const posts = [], panels = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i], p = at(info, Math.min(info.len - 1e-3, Math.max(1e-3, n.s)));
    posts.push({ x: p.x, z: p.z, rot: Math.atan2(-p.dz, p.dx), gate: n.gate, s: n.s });
    if (i + 1 < nodes.length) {
      const m = nodes[i + 1]; if (inOpen((n.s + m.s) / 2) || m.s - n.s < 2 * inset + 0.2) continue;
      const a = at(info, n.s + inset), b = at(info, m.s - inset), len = Math.hypot(b.x - a.x, b.z - a.z);
      panels.push({ a, b, len, s0: n.s + inset, s1: m.s - inset, rot: Math.atan2(-(b.z - a.z), b.x - a.x) });
    }
  }
  return { posts, panels, opens: op.map((o) => { const p = at(info, o.s); return { x: p.x, z: p.z, rot: Math.atan2(-p.dz, p.dx), half: o.half, g: o.g }; }), info };
}

export function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const net = ctx.services?.streets?.net, onRoad = (x, z) => !!net && net.cover(x, z, {}) > -0.3;
  // gates inside the cemetery box (not the lift gate); closed = access no / private (n1328766692 is opened on purpose)
  const gates = barrierNodes().filter((n) => n.kind === 'gate' && n.x > BOX.x0 && n.x < BOX.x1 && n.z > BOX.z0 && n.z < BOX.z1)
    .map((n) => ({ id: n.id, x: n.x, z: n.z, closed: (n.access === 'private' || n.access === 'no') && n.id !== 'n1328766692' && n.id !== 'n3695731351' }));
  const bays = { bars: [], concrete: [], plaster: [], lot: [] };
  const stats = { bars: 0, concrete: 0, plaster: 0, lot: 0, posts: 0, colliders: 0, onRoad: 0 };
  for (const run of RUNS) {
    const pts = barrierPts(run.id); if (!pts || pts.length < 2) continue;
    const plan = planFence(pts, run.pitch, gates.filter((g) => !g.closed).map((g) => ({ x: g.x, z: g.z, half: GATE_HALF, id: g.id })));
    const seenGate = new Set(K.svc.gates.map((q) => q.id));
    for (const o of plan.opens) if (!seenGate.has(o.g.id)) K.svc.gates.push({ id: o.g.id, x: o.g.x, z: o.g.z, open: true, half: o.half, fence: run.id });
    for (const pn of plan.panels) {
      const mx = (pn.a.x + pn.b.x) / 2, mz = (pn.a.z + pn.b.z) / 2;
      if (onRoad(pn.a.x, pn.a.z) || onRoad(pn.b.x, pn.b.z) || onRoad(mx, mz)) { stats.onRoad++; continue; }
      // n4spb: a panel is a row of breakable bays of about one texture tile (the colliders, the drawing and the knock records of lib/fence-bays.js); the posts below stay static
      bays[run.kind].push(...splitBays(pn.a.x, pn.a.z, pn.b.x, pn.b.z, TILE[run.kind], { y: 0, h: run.h })); stats.colliders++; stats[run.kind]++;
    }
    for (const po of plan.posts) {
      if (onRoad(po.x, po.z)) continue;
      P.push(po.x, 0, po.z, po.rot);
      if (run.kind === 'bars') { const h = po.gate ? 2.7 : 2.12; P.box(M.barIron, -0.05, 0.05, 0, h, -0.05, 0.05, 'b'); P.box(M.barIron, -0.08, 0.08, h, h + 0.1, -0.08, 0.08, 'b'); if (po.gate) { P.box(M.barIron, -0.14, 0.14, 0, 1.0, -0.14, 0.14, 'b'); } }
      else if (run.kind === 'lot') { const h = po.gate ? 3.0 : 2.6; P.box(M.socle, -0.3, 0.3, 0, 0.6, -0.3, 0.3, 'b'); P.box(M.barBlack, -0.15, 0.15, 0.6, h, -0.15, 0.15, 'b'); P.box(M.barBlack, -0.22, 0.22, h, h + 0.12, -0.22, 0.22, 'b'); if (po.gate) { P.col(M.barBlack, 0, 0, h + 0.12, h + 0.55, 0.2, 0.2, 8, true); } }
      else if (run.kind === 'concrete' || run.kind === 'plaster') { P.box(run.kind === 'concrete' ? M.concrete : M.wallPlaster, -0.2, 0.2, 0, run.h + 0.12, -0.2, 0.2, 'b', 3); }
      P.pop(); stats.posts++;
    }
    K.svc.fences.push({ id: run.id, pts, h: run.h, kind: run.kind === 'bars' ? 'bars' : run.kind === 'lot' ? 'bars-socle' : 'wall' });
  }
  // ---- the breakable bays (n4spb): bar fence 2.0 m, concrete wall 2.8 m, plastered walls 2.0 m, the cast-iron lot fence on its granite socle 2.5 m
  const R = (mass, h, anchored, metal) => ({ kind: 'fence', mass, h, anchored, hitK: 0.5, metal, minDv: 0 });
  const FAR = 320;
  if (bays.bars.length) kBays(K, { name: 'lmsmol-bars', bays: bays.bars, far: FAR,
    parts: [{ geo: unitPanel(0, 2.0, { u1: 1 }), mat: M.bars, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }],
    collider: { y0: 0, y1: 2.2, thick: 0.25 }, rec: () => R(500, 2.0, 24, true) });
  if (bays.concrete.length) kBays(K, { name: 'lmsmol-concrete', bays: bays.concrete, far: FAR,
    parts: [{ geo: unitBox(0, 2.8, -0.1, 0.1, { uLen: 3, uvs: 3 }), mat: M.concrete, name: 'wall', stretch: true }],
    collider: { y0: 0, y1: 3.0, thick: 0.35 }, rec: () => R(1400, 2.8, 30, false) });
  if (bays.plaster.length) kBays(K, { name: 'lmsmol-plaster', bays: bays.plaster, far: FAR,
    parts: [{ geo: unitBox(0, 2.0, -0.12, 0.12, { uLen: 4, uvs: 3 }), mat: M.wallPlaster, name: 'wall', stretch: true }],
    collider: { y0: 0, y1: 2.2, thick: 0.25 }, rec: () => R(1000, 2.0, 28, false) });
  if (bays.lot.length) kBays(K, { name: 'lmsmol-lot', bays: bays.lot, far: FAR,
    parts: [{ geo: unitBox(0, 0.55, -0.25, 0.25, { uLen: 5.7, uvs: 1 }), mat: M.socle, name: 'socle', stretch: true }, { geo: unitPanel(0.55, 2.5, { u1: 1 }), mat: M.barsK, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }],
    collider: { y0: 0, y1: 2.7, thick: 0.25 }, rec: () => R(700, 2.5, 24, true) });
  K.svc.fenceStats = stats;
}
