// landmarksNikolsky/fence.js - the fences of the cathedral enclosure and the garden (docs/research/nikolsky.md section 5, photos refs/nikolsky 006 017 036 035 072 073):
//  * the WHITE-PYLON FENCE of the "keyhole" (OSM w123944613 / w123944616 / w762486705: a circle of r 45 m round the cathedral + the 10.6 m avenue to the bell tower): white square piers 0.95 m with sky-blue
//    panels, green copper pyramid caps, rocaille brackets, every ~3.9 m, black spear-tipped iron panels between (alpha), the OSM gates left open between two bigger gate piers with an anchor emblem;
//  * the diamond-lattice fence of the garden (north / east edge w762486706, west edge w1106632795 / w1106632797): 1.8 m, square posts with spear finials every 3.2 m, gates open.
// Colliders are thin boxes along every run except the gate openings (the player passes the gates only).  Pylons are instanced; panels are merged quads.
import * as THREE from 'three';
import { BARRIERS, BARRIER_NODES } from '../data/city.js';
import * as G from './geo.js';
import * as S from './stucco.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { knockBays, splitBays, unitPanel } from '../lib/fence-bays.js';

const PYLON_RUNS = ['w123944613', 'w123944616', 'w762486705'];
const LATTICE_RUNS = ['w762486706', 'w1106632795', 'w1106632797'];
const GATE_HALF = 2.1;                                           // half opening of a gate (m)

const pairs = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
const distSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); return { d: Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t), t }; };

/** arc-length parametrisation of a polyline */
function lineInfo(pts) { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; }
function at(info, s) {
  const { pts, cum } = info; s = Math.max(0, Math.min(info.len, s)); let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i], l = cum[i] - cum[i - 1] || 1, t = (s - cum[i - 1]) / l;
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l };
}
/** a run: gate openings along the polyline [{ s, half }], nodes (pylon / post positions with their rot), panels between nodes */
function planRun(pts, gates, pitch) {
  const info = lineInfo(pts), open = [];
  for (const g of gates) {
    let best = null;
    for (let i = 0; i + 1 < pts.length; i++) { const r = distSeg(g.x, g.z, pts[i], pts[i + 1]); if (r.d < 1.6 && (!best || r.d < best.d)) best = { d: r.d, s: info.cum[i] + r.t * (info.cum[i + 1] - info.cum[i]) }; }
    if (best && !g.closed) open.push({ s: best.s, half: GATE_HALF });
  }
  const inOpen = (s, m = 0.05) => open.some((o) => s > o.s - o.half + m && s < o.s + o.half - m);
  const nodes = [];                                              // { s, kind: 'corner' | 'mid' | 'gate' }
  for (let i = 0; i < pts.length; i++) nodes.push({ s: info.cum[i], kind: 'corner' });
  for (let i = 0; i + 1 < pts.length; i++) {
    const l = info.cum[i + 1] - info.cum[i], n = Math.max(1, Math.round(l / pitch));
    for (let k = 1; k < n; k++) nodes.push({ s: info.cum[i] + l * k / n, kind: 'mid' });
  }
  for (const o of open) { nodes.push({ s: o.s - o.half, kind: 'gate' }, { s: o.s + o.half, kind: 'gate' }); }
  nodes.sort((a, b) => a.s - b.s);
  const keep = nodes.filter((n) => n.kind === 'gate' || !inOpen(n.s)).filter((n, i, arr) => i === 0 || n.s - arr[i - 1].s > 0.25 || n.kind === 'gate');
  return { info, open, nodes: keep, inOpen };
}

export function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const byId = new Map(BARRIERS.map((b) => [b.id, b]));
  const gatesAll = BARRIER_NODES.filter((n) => n.kind === 'gate').map((n) => ({ x: n.x, z: n.z, closed: n.access === 'private' || n.locked }));
  const stats = { pylons: 0, piers: 0, panels: 0, posts: 0, lattice: 0 };
  const pyl = [], pier = [], posts = [];
  const fences = [];
  const pylBays = [], latBays = [];      // the panels between the pylons / posts are BREAKABLE bays (lib/fence-bays.js, docs/AREAS.md 13.7 / 15.2): one bay per ~3 texture tiles, the pylons and posts stay instanced

  // ------------------------------------------------------------------------------------------ pylon runs
  for (const id of PYLON_RUNS) {
    const b = byId.get(id); if (!b) continue;
    const plan = planRun(pairs(b.pts), gatesAll, 3.9);
    const { info, nodes } = plan;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i], p = at(info, Math.min(info.len - 1e-3, n.s)), rot = Math.atan2(-p.dz, p.dx);
      if (n.kind === 'gate') { pier.push(mat4(p.x, 0, p.z, rot, 1)); stats.piers++; } else { pyl.push(mat4(p.x, 0, p.z, rot, 1)); stats.pylons++; }
      if (i + 1 < nodes.length) {
        const m = nodes[i + 1], mid = (n.s + m.s) / 2;
        if (plan.inOpen(mid)) continue;
        const a = at(info, n.s + 0.45), c = at(info, m.s - 0.45);
        const la = Math.hypot(c.x - a.x, c.z - a.z);
        if (la > 0.3) {
          pylBays.push(...splitBays(a.x, a.z, c.x, c.z, 3.36, { y: 0.25 }));
          stats.panels++;
        }
      }
    }
    for (const o of plan.open) {
      const g = at(info, o.s), rot = Math.atan2(-g.dz, g.dx);
      // the open leaves: swung 85 deg inwards (towards the cathedral / garden) from the two piers
      for (const sgn of [-1, 1]) {
        const hx = g.x + g.dx * o.half * sgn, hz = g.z + g.dz * o.half * sgn;
        const lx = hx - g.dz * 2.0 * 0.97, lz = hz + g.dx * 2.0 * 0.97;          // perpendicular to the run
        panel(P, M.bars, { x: hx, z: hz }, { x: lx, z: lz }, 0.25, 2.3, 1.12);
      }
      fences.push({ x: g.x, z: g.z, rot, kind: 'gate', half: o.half });
    }
    fences.push({ id, pts: pairs(b.pts), h: 2.3, kind: 'pylon' });
  }
  const pylG = partsGeos((Q) => pylonParts(Q, M)), pierG = partsGeos((Q) => pierParts(Q, M));
  K.extraTris += addInstanced(ctx, K.root, 'lmN-pylons', pylG, pyl).tris + addInstanced(ctx, K.root, 'lmN-piers', pierG, pier).tris;

  // ------------------------------------------------------------------------------------------ lattice runs
  const postG = partsGeos((Q) => postParts(Q, M));
  for (const id of LATTICE_RUNS) {
    const b = byId.get(id); if (!b) continue;
    const plan = planRun(pairs(b.pts), gatesAll, 3.2);
    const { info, nodes } = plan;
    // road integrity (docs/AGENT-BRIEF.md): the OSM fence way cuts a street corner in places (ulitsa Glinki at (-2903.6, 1001.7): 1 m inside the asphalt): no post and no panel on a carriageway
    const net = ctx.services.streets?.net, onRoad = (x, z) => !!net && net.cover(x, z, {}) > -0.3;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i], p = at(info, Math.min(info.len - 1e-3, n.s)), rot = Math.atan2(-p.dz, p.dx);
      if (!onRoad(p.x, p.z)) { posts.push(mat4(p.x, 0, p.z, rot, n.kind === 'gate' ? 1.25 : 1)); stats.posts++; }
      if (i + 1 < nodes.length) {
        const m = nodes[i + 1];
        if (plan.inOpen((n.s + m.s) / 2)) continue;
        const a = at(info, n.s + 0.1), c = at(info, m.s - 0.1), la = Math.hypot(c.x - a.x, c.z - a.z);
        if (onRoad(a.x, a.z) || onRoad(c.x, c.z) || onRoad((a.x + c.x) / 2, (a.z + c.z) / 2)) continue;
        if (la > 0.3) { latBays.push(...splitBays(a.x, a.z, c.x, c.z, 3.0, { y: 0.15 })); stats.lattice++; }
      }
    }
    for (const o of plan.open) { const g = at(info, o.s); fences.push({ x: g.x, z: g.z, rot: Math.atan2(-g.dz, g.dx), kind: 'gate', half: o.half }); }
    fences.push({ id, pts: pairs(b.pts), h: 1.8, kind: 'lattice' });
  }
  K.extraTris += addInstanced(ctx, K.root, 'lmN-posts', postG, posts).tris;
  knockBays(ctx, { name: 'lmN-pylon-fence', bays: pylBays, far: 320,
    parts: [{ geo: unitPanel(0, 2.05, { u1: 3 }), mat: M.bars, name: 'panel', stretch: true, shadow: false, receive: false }],
    collider: { y0: 0, y1: 2.3, thick: 0.14, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 500, h: 2.3, anchored: 24, hitK: 0.5, metal: true, minDv: 0 }) });
  knockBays(ctx, { name: 'lmN-lattice-fence', bays: latBays, far: 300,
    parts: [{ geo: unitPanel(0, 1.6, { u1: 3 }), mat: M.lattice, name: 'panel', stretch: true, shadow: false, receive: false }],
    collider: { y0: 0, y1: 1.8, thick: 0.12, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 250, h: 1.8, anchored: 18, hitK: 0.4, metal: true, minDv: 0 }) });
  K.svc.fences = (K.svc.fences || []).concat(fences);
  K.svc.fenceStats = stats;
}

/** an iron panel (alpha quad, both sides) between two points, bottom y0, top y1, uv u = length / tile, v 0..1 */
function panel(P, mat, a, c, y0, y1, tile) {
  const l = Math.hypot(c.x - a.x, c.z - a.z);
  P.quad(mat, [a.x, y0, a.z], [c.x, y0, c.z], [c.x, y1, c.z], [a.x, y1, a.z], null, [[0, 0], [l / tile, 0], [l / tile, 1], [0, 1]]);
}

// ---------------------------------------------------------------------------------------------- instanced parts (frame: base at the origin, local x along the fence)
function pylonParts(Q, M) {
  const w = 0.95, h = w / 2;
  Q.box(M.blueDeep, -h - 0.06, h + 0.06, 0, 0.38, -h - 0.06, h + 0.06, 'b');
  Q.box(M.white, -h, h, 0.38, 2.48, -h, h, 'b');
  for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {                   // blue recessed panel on every face
    Q.push(fx * (h + 0.012), 0, fz * (h + 0.012), Math.atan2(fx, fz));
    Q.quad(M.blue, [-0.27, 0.72, 0], [0.27, 0.72, 0], [0.27, 2.22, 0], [-0.27, 2.22, 0], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    Q.pop();
  }
  Q.box(M.white, -h - 0.1, h + 0.1, 2.48, 2.7, -h - 0.1, h + 0.1, 'b');
  for (const s of [-1, 1]) Q.box(M.whiteShade, s * (h - 0.0) - 0.07, s * (h) + 0.07, 2.1, 2.46, -0.12, 0.12, '');       // little brackets at the sides
  G.frustum(Q, M.copper, 0, 0, 2.7, 3.2, 4, (h + 0.1) * Math.SQRT2, 0.02, Math.PI / 4, 1, 1);
}
function pierParts(Q, M) {
  const w = 1.3, h = w / 2;
  Q.box(M.blueDeep, -h - 0.08, h + 0.08, 0, 0.5, -h - 0.08, h + 0.08, 'b');
  Q.box(M.white, -h, h, 0.5, 3.7, -h, h, 'b');
  for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    Q.push(fx * (h + 0.012), 0, fz * (h + 0.012), Math.atan2(fx, fz));
    G.planeShape(Q, M.blueDeep, G.archPts(0, 1.3, 0.8, 1.9, 8), 0.0);
    // a gilded anchor in the niche: shank, stock, two flukes
    Q.box(M.goldFlat, -0.03, 0.03, 1.5, 2.6, 0.0, 0.03, '');
    Q.box(M.goldFlat, -0.22, 0.22, 2.35, 2.4, 0.0, 0.03, '');
    S.volute(Q, M.goldFlat, 0, 1.75, 0.02, 0.2, Math.PI * 1.0, Math.PI, 0.2);
    Q.pop();
  }
  Q.box(M.white, -h - 0.14, h + 0.14, 3.7, 3.98, -h - 0.14, h + 0.14, 'b');
  G.frustum(Q, M.copper, 0, 0, 3.98, 4.7, 4, (h + 0.14) * Math.SQRT2, 0.03, Math.PI / 4, 1, 1);
}
function postParts(Q, M) {
  Q.box(M.iron, -0.1, 0.1, 0, 1.9, -0.1, 0.1, 'b');
  Q.box(M.iron, -0.14, 0.14, 1.78, 1.86, -0.14, 0.14, 'b');
  G.frustum(Q, M.iron, 0, 0, 1.86, 2.2, 4, 0.12, 0.0, Math.PI / 4, 1, 1);
  Q.box(M.graniteBase, -0.16, 0.16, 0, 0.3, -0.16, 0.16, 'b');
}
