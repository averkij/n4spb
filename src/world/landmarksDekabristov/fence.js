// landmarksDekabristov/fence.js - the fences and walls of the cemeteries and the garden (nobody else draws OSM fences: the generic modules only stamp them into the ground field), from the BARRIERS of the data.
// A run is the polyline of an OSM way (barrier=fence / wall); the planner (planFence, the arc-length scheme of landmarksSmolensky/fence.js, this repository) puts posts at the corners, every ~pitch and on both sides of every
// opening; the panels between the posts become BREAKABLE BAYS (lib/fence-bays.js knockBays, docs/AREAS.md 13.7): one bay per texture tile with its own collider, its instances and its knock record (anchored: a bump
// holds, a car at speed breaks it off and the gap is passable).  Posts stay static (a 0.1 m iron post / a 0.3 m pillar).  GATES (BARRIER_NODES kind gate / wicket_gate) are OPEN gaps of 2.4 m with two heavier posts
// (access=private / no ones stay closed: the fence continues over them).  Road integrity: a panel or post whose end lies on real asphalt (net.cover) is dropped.
// Kinds: bars (forged pickets with spear tips 3.6 m tiles, the cemetery fence of landmarksSmolensky), rail (a plain picket railing 3.0 m tiles: the garden and the memorial lawns), concrete (panel wall), brick (a low brick wall).
// Publishes svc.fences [{ id, pts, h, kind }] and svc.gates [{ id, x, z, open, half }].
import { splitBays, unitPanel, unitBox } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7): every panel of the fence and of the walls is a breakable bay
import { kBays } from './inst.js';

const GATE_HALF = 1.2;
const KIND = {
  bars: { tile: 3.6, post: 'iron' }, rail: { tile: 3.0, post: 'rail' }, concrete: { tile: 3.0, post: 'wall' }, brick: { tile: 3.0, post: 'wall' },
};

// ---- arc-length helpers (copy of the Karpovka planFence: posts at corners, every ~pitch and at both sides of every opening)
function lineInfo(pts) { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; }
function at(info, s) {
  const { pts, cum } = info; s = Math.max(0, Math.min(info.len, s)); let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i], l = cum[i] - cum[i - 1] || 1, t = (s - cum[i - 1]) / l;
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l };
}
export function planFence(pts, pitch, opens = [], inset = 0.06) {
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

/**
 * fence(K, name, runs, gates) - runs: [{ id, pts [[x, z]..], kind, h }], gates: [{ id, x, z, closed? }] (a gate opens a run it lies on within 2.5 m).
 * Returns { bays, posts, stats }.
 */
export function buildFence(K, name, runs, gates = []) {
  const ctx = K.ctx, P = K.P, M = K.M;
  const net = ctx.services?.streets?.net, onRoad = (x, z) => !!net && net.cover(x, z, {}) > -0.3;
  const bays = {}, stats = { bays: 0, posts: 0, onRoad: 0, runs: 0, gates: 0 };
  const seenGate = new Set(K.svc.gates.map((q) => q.id));
  for (const run of runs) {
    const kind = KIND[run.kind] || KIND.bars, pts = run.pts; if (!pts || pts.length < 2) continue;
    const plan = planFence(pts, kind.tile, gates.filter((g) => !g.closed).map((g) => ({ x: g.x, z: g.z, half: GATE_HALF, id: g.id })));
    for (const o of plan.opens) if (!seenGate.has(o.g.id)) { seenGate.add(o.g.id); K.svc.gates.push({ id: o.g.id, x: o.g.x, z: o.g.z, open: true, half: o.half, fence: run.id }); stats.gates++; }
    const key = run.kind + ':' + run.h;
    for (const pn of plan.panels) {
      const mx = (pn.a.x + pn.b.x) / 2, mz = (pn.a.z + pn.b.z) / 2;
      if (onRoad(pn.a.x, pn.a.z) || onRoad(pn.b.x, pn.b.z) || onRoad(mx, mz)) { stats.onRoad++; continue; }
      (bays[key] ||= { kind: run.kind, h: run.h, list: [] }).list.push(...splitBays(pn.a.x, pn.a.z, pn.b.x, pn.b.z, kind.tile, { y: 0, h: run.h }));
    }
    for (const po of plan.posts) {
      if (onRoad(po.x, po.z)) continue;
      P.push(po.x, 0, po.z, po.rot);
      if (kind.post === 'iron') { const h = po.gate ? 2.5 : run.h + 0.12; P.box(M.barIron, -0.05, 0.05, 0, h, -0.05, 0.05, 'b'); P.box(M.barIron, -0.08, 0.08, h, h + 0.1, -0.08, 0.08, 'b'); if (po.gate) P.box(M.barIron, -0.14, 0.14, 0, 1.0, -0.14, 0.14, 'b'); }
      else if (kind.post === 'rail') { const h = po.gate ? run.h + 0.45 : run.h + 0.06; P.box(M.barGreen, -0.04, 0.04, 0, h, -0.04, 0.04, 'b'); if (po.gate) P.box(M.barGreen, -0.08, 0.08, 0, 0.9, -0.08, 0.08, 'b'); }
      else P.box(run.kind === 'brick' ? M.brickWall : M.concrete, -0.2, 0.2, 0, run.h + 0.12, -0.2, 0.2, 'b', 3);
      P.pop(); stats.posts++;
    }
    K.svc.fences.push({ id: run.id, pts, h: run.h, kind: run.kind === 'bars' || run.kind === 'rail' ? 'bars' : 'wall' }); stats.runs++;
  }
  // ---- the breakable bays: one knockBays row per kind / height
  const R = (mass, h, anchored, metal) => ({ kind: 'fence', mass, h, anchored, hitK: 0.5, metal, minDv: 0 });
  const FAR = 320;
  for (const [key, b] of Object.entries(bays)) {
    if (!b.list.length) continue;
    stats.bays += b.list.length;
    const nm = `${name}-${key.replace(/[^a-z0-9]+/gi, '_')}`;
    if (b.kind === 'bars') kBays(K, { name: nm, bays: b.list, far: FAR,
      parts: [{ geo: unitPanel(0, b.h, { u1: 1 }), mat: M.bars, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }],
      collider: { y0: 0, y1: b.h + 0.2, thick: 0.25 }, rec: () => R(500, b.h, 24, true) });
    else if (b.kind === 'rail') kBays(K, { name: nm, bays: b.list, far: FAR,
      parts: [{ geo: unitPanel(0, b.h, { u1: 1 }), mat: M.rail, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }],
      collider: { y0: 0, y1: b.h + 0.2, thick: 0.2 }, rec: () => R(260, b.h, 18, true) });
    else kBays(K, { name: nm, bays: b.list, far: FAR,
      parts: [{ geo: unitBox(0, b.h, -0.12, 0.12, { uLen: 3, uvs: 3 }), mat: b.kind === 'brick' ? M.brickWall : M.concrete, name: 'wall', stretch: true }],
      collider: { y0: 0, y1: b.h + 0.2, thick: 0.3 }, rec: () => R(1000, b.h, 28, false) });
  }
  K.svc.fenceStats = { ...(K.svc.fenceStats || {}), [name]: stats };
  return { bays, stats };
}
