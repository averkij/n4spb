// landmarksBotanicalGarden/fence.js - the BAR FENCE of the Botanical Garden (OSM ways with h = 2 m `fence_type = bars`: the perimeter along the Karpovka, Prof. Popova street and Aptekarskaya embankment, 1.9 km;
// dossier 4.1 / 4.1d / 7: black-green bars every 0.125 m with spear tips on a low granite plinth, cast square posts every ~2.8 m) and its GATES (OSM barrier nodes on the ways):
//   * public gates (no access tag / permissive / yes) stand OPEN: a 3 m gap between two granite piers with ball finials and the two bar leaves folded back against the piers;
//   * private / no / locked gates are CLOSED: two bar leaves across the gap, two taller posts, solid.
// The garden is open to visitors (dossier 4.1: park open Tu-Su 10-18, greenhouses by tour): the fence is a wall for the player except at the open gates.  Panels are alpha quads (both sides), the plinth is a
// merged strip, the posts are instanced.  Road integrity: no post or panel on a carriageway (net.cover).  Publishes svc.fences ({ id, pts, h, kind }), svc.gates ({ x, z, rot, closed, id }).
import { BARRIERS, BARRIER_NODES } from '../data/city.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { revolve } from './geo.js';
import { stage } from './shell.js';
import { GROUPS_LIST } from './groups.js';

export const PITCH = 3.6, GATE_HALF = 1.5; const H_PL = 0.5, H_BARS = 2.05, H_POST = 2.25;
export const pairs = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
const distSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); return { d: Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t), t }; };
export function lineInfo(pts) { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; }
export function at(info, s) {
  const { pts, cum } = info; s = Math.max(0, Math.min(info.len, s)); let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i], l = cum[i] - cum[i - 1] || 1, t = (s - cum[i - 1]) / l;
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l };
}

/** nodes of a run (corner posts, a post every PITCH, the gate piers) and the gate openings */
export function planRun(pts, gates) {
  const info = lineInfo(pts), open = [], shut = [];
  for (const g of [...gates].sort((a, b) => Number(a.closed) - Number(b.closed))) {
    let best = null;
    for (let i = 0; i + 1 < pts.length; i++) { const r = distSeg(g.x, g.z, pts[i], pts[i + 1]); if (r.d < 2.2 && (!best || r.d < best.d)) best = { d: r.d, s: info.cum[i] + r.t * (info.cum[i + 1] - info.cum[i]) }; }
    if (!best || info.len < 2 * GATE_HALF + 1) continue;
    const s = Math.max(GATE_HALF + 0.3, Math.min(info.len - GATE_HALF - 0.3, best.s));
    if ([...open, ...shut].some((o) => Math.abs(o.s - s) < 4.5)) continue;                // two nodes of one gate (leaf + leaf): the first (open ones come first) wins
    (g.closed ? shut : open).push({ s, half: GATE_HALF, g });
  }
  const gaps = [...open, ...shut].sort((a, b) => a.s - b.s);
  const inGap = (s, m = 0.05) => gaps.some((o) => s > o.s - o.half + m && s < o.s + o.half - m);
  const nodes = [];
  for (let i = 0; i < pts.length; i++) nodes.push({ s: info.cum[i], kind: 'corner' });
  for (let i = 0; i + 1 < pts.length; i++) { const l = info.cum[i + 1] - info.cum[i], n = Math.max(1, Math.round(l / PITCH)); for (let k = 1; k < n; k++) nodes.push({ s: info.cum[i] + l * k / n, kind: 'mid' }); }
  for (const o of gaps) nodes.push({ s: o.s - o.half, kind: o.g.closed ? 'gateShut' : 'gate' }, { s: o.s + o.half, kind: o.g.closed ? 'gateShut' : 'gate' });
  nodes.sort((a, b) => a.s - b.s);
  const keep = nodes.filter((n) => n.kind.startsWith('gate') || !inGap(n.s)).filter((n, i, arr) => i === 0 || n.s - arr[i - 1].s > 0.4 || n.kind.startsWith('gate'));
  return { info, open, shut, nodes: keep, inGap };
}

/** the alpha panel between two points (both faces): u = length / 2 m */
export function panel(P, mat, a, c, y0, y1) {
  const l = Math.hypot(c.x - a.x, c.z - a.z);
  P.quad(mat, [a.x, y0, a.z], [c.x, y0, c.z], [c.x, y1, c.z], [a.x, y1, a.z], null, [[0, 0], [l / 2.0, 0], [l / 2.0, 1], [0, 1]]);
}
/** the granite plinth strip between two points: top, outer and inner faces (no bottom, no ends) */
function plinth(P, mat, a, c, y1, t) {
  const dx = c.x - a.x, dz = c.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * t / 2, nz = dx / l * t / 2, u = l / 2;
  const q = (p0, p1, p2, p3, n, uv) => P.quad(mat, p0, p1, p2, p3, n, uv);
  q([a.x - nx, y1, a.z - nz], [c.x - nx, y1, c.z - nz], [c.x + nx, y1, c.z + nz], [a.x + nx, y1, a.z + nz], [0, 1, 0], [[0, 0], [u, 0], [u, 0.2], [0, 0.2]]);
  q([a.x + nx, 0, a.z + nz], [c.x + nx, 0, c.z + nz], [c.x + nx, y1, c.z + nz], [a.x + nx, y1, a.z + nz], [nx, 0, nz], [[0, 0], [u, 0], [u, 0.25], [0, 0.25]]);
  q([c.x - nx, 0, c.z - nz], [a.x - nx, 0, a.z - nz], [a.x - nx, y1, a.z - nz], [c.x - nx, y1, c.z - nz], [-nx, 0, -nz], [[0, 0], [u, 0], [u, 0.25], [0, 0.25]]);
}

function postParts(Q, M, tall = false) {                                   // frame: foot at the origin, local x along the fence: a square cast post with a spear cap (18 triangles)
  const h = tall ? 2.55 : H_POST;
  Q.box(M.iron, -0.08, 0.08, H_PL - 0.02, h, -0.08, 0.08, 'b', 2);
  Q.cyl(M.iron, [0, h, 0], [0, h + 0.3, 0], 0.095, 0.0, 4, false);
}
function pierParts(Q, M) {                                                 // an open gate's granite pier with a ball finial
  Q.box(M.plinth, -0.34, 0.34, 0, 0.22, -0.34, 0.34, 'b', 2);
  Q.box(M.plinth, -0.27, 0.27, 0.22, 2.35, -0.27, 0.27, 'b', 2);
  Q.box(M.plinth, -0.34, 0.34, 2.35, 2.5, -0.34, 0.34, 'b', 2);
  revolve(Q, M.plinth, [[0.0, 2.5], [0.2, 2.52], [0.31, 2.64], [0.33, 2.8], [0.27, 2.98], [0.16, 3.07], [0.0, 3.1]], 12, { crease: 40, uRep: 1, vTile: 1 });
}

export function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const ids = GROUPS_LIST.find((g) => g.key === 'fence').osm;
  const byId = new Map(BARRIERS.map((b) => [b.id, b]));
  const gatesAll = BARRIER_NODES.filter((n) => n.kind === 'gate').map((n) => ({ id: n.id, x: n.x, z: n.z, closed: !!(n.access === 'private' || n.access === 'no' || n.locked) && !(n.id === 'n1552530759') }));
  const net = ctx.services.streets && ctx.services.streets.net, onRoad = (x, z) => !!net && net.cover(x, z, {}) > -0.3;
  const stats = { posts: 0, piers: 0, panels: 0, runs: 0, gates: 0, shut: 0, skippedRoad: 0, length: 0 };
  const posts = [], tallPosts = [], piers = [], fences = [], gatesOut = [];
  // the summer entrance (no mapped fence between the two ways, dossier 4.1d: the closed gate n1552314688 and the ticket pavilion beside it): a short run of its own closes the gap
  const EXTRA = [{ id: 'bg-summer-gate', pts: [-1838, -4022.4, -1834.4, -4012.7] }];
  for (const e of EXTRA) byId.set(e.id, e);
  const cx0 = -1500, cz0 = -4200;                                           // the garden centre: the open leaves fold towards it
  for (const id of [...ids, ...EXTRA.map((e) => e.id)]) {
    const b = byId.get(id); if (!b) continue;
    const plan = planRun(pairs(b.pts), gatesAll), { info, nodes } = plan;
    stats.runs++; stats.length += info.len;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i], p = at(info, Math.min(info.len - 1e-3, n.s)), rot = Math.atan2(-p.dz, p.dx);
      const ok = !onRoad(p.x, p.z);
      if (!ok) stats.skippedRoad++;
      if (ok) { if (n.kind === 'gate') { piers.push(mat4(p.x, 0, p.z, rot, 1)); stats.piers++; } else if (n.kind === 'gateShut') { tallPosts.push(mat4(p.x, 0, p.z, rot, 1)); stats.posts++; } else { posts.push(mat4(p.x, 0, p.z, rot, 1)); stats.posts++; } }
      if (i + 1 < nodes.length) {
        const m = nodes[i + 1], mid = (n.s + m.s) / 2;
        if (plan.open.some((o) => mid > o.s - o.half && mid < o.s + o.half)) continue;       // an open gate: no panel
        const isShutLeaf = plan.shut.some((o) => mid > o.s - o.half && mid < o.s + o.half);
        const a = at(info, n.s + 0.1), c = at(info, m.s - 0.1), la = Math.hypot(c.x - a.x, c.z - a.z);
        if (la < 0.3 || onRoad(a.x, a.z) || onRoad(c.x, c.z) || onRoad((a.x + c.x) / 2, (a.z + c.z) / 2)) continue;
        panel(P, M.bars, a, c, H_PL, isShutLeaf ? H_BARS + 0.2 : H_BARS);
        plinth(P, M.plinth, a, c, H_PL, 0.3);
        ph.addBox((a.x + c.x) / 2, (a.z + c.z) / 2, la + 0.1, 0.22, Math.atan2(-(c.z - a.z), c.x - a.x), 0, 2.3);
        stats.panels++;
      }
    }
    for (const o of plan.open) {
      const g = at(info, o.s), rot = Math.atan2(-g.dz, g.dx);
      // the two bar leaves swung open to 90 deg towards the garden centre, from the piers
      const side = ((cx0 - g.x) * -g.dz + (cz0 - g.z) * g.dx) >= 0 ? 1 : -1, nx = -g.dz * side, nz = g.dx * side;
      for (const sg of [-1, 1]) {
        const hx = g.x + g.dx * o.half * sg, hz = g.z + g.dz * o.half * sg;
        panel(P, M.bars, { x: hx + nx * 0.1, z: hz + nz * 0.1 }, { x: hx + nx * (o.half - 0.2), z: hz + nz * (o.half - 0.2) }, 0.15, 1.95);
        ph.addBox(hx + nx * o.half / 2, hz + nz * o.half / 2, o.half - 0.1, 0.12, Math.atan2(-nz, nx), 0, 2.0);
      }
      gatesOut.push({ id: o.g.id, x: g.x, z: g.z, rot, closed: false, half: o.half }); stats.gates++;
    }
    for (const o of plan.shut) { const g = at(info, o.s); gatesOut.push({ id: o.g.id, x: g.x, z: g.z, rot: Math.atan2(-g.dz, g.dx), closed: true, half: o.half }); stats.shut++; }
    fences.push({ id, pts: pairs(b.pts), h: 2.0, kind: 'bars' });
  }
  stage(K, 'instances', () => {
    const pg = partsGeos((Q) => postParts(Q, M)), pt = partsGeos((Q) => postParts(Q, M, true)), pi = partsGeos((Q) => pierParts(Q, M));
    K.extraTris += addInstanced(ctx, K.root, 'bg-fence-posts', pg, posts).tris + addInstanced(ctx, K.root, 'bg-fence-gateposts', pt, tallPosts).tris + addInstanced(ctx, K.root, 'bg-fence-piers', pi, piers).tris;
    for (const m of piers) { const p = [m.elements[12], m.elements[14]]; ph.addCylinder(p[0], p[1], 0.36, 0, 3); }
  });
  K.svc.fences = (K.svc.fences || []).concat(fences);
  K.svc.gates = (K.svc.gates || []).concat(gatesOut);
  K.svc.fenceStats = stats;
  if (K.errs && K.errs.length) throw new Error('fence: ' + K.errs.join('\n'));
}
