// landmarksAndrew/fence.js - iron fences with stuccoed piers, shared by the cathedral precinct (white lace panels on pink piers, granite plinth wall) and the Annunciation compound (black Greek-key + diamond
// lattice panels on ochre piers) (docs/research/andrew.md 3.8, 8.5; photos refs/andrew 10 30 40 43 144 145 147).  `fenceRuns(K, runs, style)`: runs = [{ pts: [[x, z]..] (world), gates: [{ x, z, half }] }];
// piers are INSTANCED (one geometry from the style's pier function), panels are alpha quads, plinth walls boxes, colliders thin boxes along every run except the gate openings (the gates stand open: the leaves
// are swung 85 deg inwards).  Every pier / panel is tested against the real asphalt (`net.cover`: road integrity) and skipped on a carriageway.
import * as THREE from 'three';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { coverFn } from './surfaces.js';
import { knockBays, unitPanel, unitBox } from '../lib/fence-bays.js';

const info = (pts) => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; };
function at(inf, s) {
  const { pts, cum } = inf; s = Math.max(0, Math.min(inf.len, s)); let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i], l = cum[i] - cum[i - 1] || 1, t = (s - cum[i - 1]) / l;
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l };
}
const distSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); return { d: Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t), t }; };

/** plan a run: nodes (corners + every `pitch` m) and gate openings along the polyline */
function plan(pts, gates, pitch, half) {
  const inf = info(pts), open = [];
  for (const g of gates || []) {
    let best = null;
    for (let i = 0; i + 1 < pts.length; i++) { const r = distSeg(g.x, g.z, pts[i], pts[i + 1]); if (r.d < 2.2 && (!best || r.d < best.d)) best = { d: r.d, s: inf.cum[i] + r.t * (inf.cum[i + 1] - inf.cum[i]) }; }
    if (best) open.push({ s: best.s, half: g.half || half });
  }
  const inOpen = (s, m = 0.05) => open.some((o) => s > o.s - o.half + m && s < o.s + o.half - m);
  const nodes = [];
  for (let i = 0; i < pts.length; i++) nodes.push({ s: inf.cum[i], kind: 'corner' });
  for (let i = 0; i + 1 < pts.length; i++) { const l = inf.cum[i + 1] - inf.cum[i], n = Math.max(1, Math.round(l / pitch)); for (let k = 1; k < n; k++) nodes.push({ s: inf.cum[i] + l * k / n, kind: 'mid' }); }
  for (const o of open) nodes.push({ s: o.s - o.half, kind: 'gate' }, { s: o.s + o.half, kind: 'gate' });
  nodes.sort((a, b) => a.s - b.s);
  // a pier that stands within 1.2 m of a gate pier or of the previous pier is dropped (two caps at one height 0.4 m apart z-fight); gate piers always stay
  const gnodes = nodes.filter((n) => n.kind === "gate"), keep = [];
  for (const n of nodes) {
    if (n.kind !== 'gate') { if (inOpen(n.s) || gnodes.some((g) => Math.abs(g.s - n.s) < 1.2)) continue; const pv = keep[keep.length - 1]; if (pv && n.s - pv.s < 1.2) continue; }
    keep.push(n);
  }
  return { inf, open, nodes: keep, inOpen };
}

/**
 * style: { pitch, gateHalf, pier: (Q, M) draws a pier (base at the origin, front +z), gatePier (optional), panelMat, plinthMat, plinthH, plinthT, panelY0, panelY1, panelTile (m of run per texture repeat), colH, pierW, name }
 */
export function fenceRuns(K, runs, style) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx), onRoad = (x, z) => cover(x, z) > -0.3;
  const pierG = partsGeos((Q) => style.pier(Q, M)), gateG = style.gatePier ? partsGeos((Q) => style.gatePier(Q, M)) : null;
  const pm = [], gm = [], out = [], bays = [];
  const half = style.gateHalf ?? 2.0, pw = style.pierW ?? 0.8, plT = style.plinthT ?? 0.45;
  for (const run of runs) {
    const pl = plan(run.pts, run.gates, style.pitch, half), { inf, nodes } = pl;
    let kept = 0;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i], p = at(inf, Math.min(inf.len - 1e-3, n.s)), rot = Math.atan2(-p.dz, p.dx);
      const here = !onRoad(p.x, p.z);
      if (here) { (n.kind === 'gate' && gateG ? gm : pm).push(mat4(p.x, 0, p.z, rot, 1)); kept++; }      // n4spb: the pier is drawn only (the bay collider below reaches over it): a drawn post stays after its bay broke (docs/AREAS.md 13.7)
      if (i + 1 < nodes.length) {
        const m = nodes[i + 1], mid = (n.s + m.s) / 2;
        if (pl.inOpen(mid) || !here) continue;
        const a = at(inf, n.s + pw / 2), c = at(inf, m.s - pw / 2), la = Math.hypot(c.x - a.x, c.z - a.z);
        if (la < 0.3 || onRoad(a.x, a.z) || onRoad(c.x, c.z) || onRoad((a.x + c.x) / 2, (a.z + c.z) / 2)) continue;
        // plinth wall (box) + iron panel (alpha quad, both sides) = ONE breakable bay (knockBays below); the panel keeps its texture scale: u = the length in tiles, quantised to a quarter tile
        const tl = style.panelTile ?? 3.4;
        bays.push({ x0: a.x, z0: a.z, x1: c.x, z1: c.z, y: 0, u: Math.max(0.25, Math.round(la / tl * 4) / 4) });
      }
    }
    for (const o of pl.open) {                                                                    // the open leaves: swung 85 deg inwards from the two gate piers
      const g = at(inf, o.s);
      for (const sgn of [-1, 1]) {
        const hx = g.x + g.dx * o.half * sgn, hz = g.z + g.dz * o.half * sgn, lx = hx - g.dz * o.half * 0.96, lz = hz + g.dx * o.half * 0.96;
        if (onRoad(hx, hz) || onRoad(lx, lz)) continue;
        P.quad(style.panelMat, [hx, style.panelY0 ?? style.plinthH, hz], [lx, style.panelY0 ?? style.plinthH, lz], [lx, style.panelY1, lz], [hx, style.panelY1, hz], null, [[0, 0], [0.6, 0], [0.6, 1], [0, 1]]);
      }
      out.push({ x: g.x, z: g.z, rot: Math.atan2(-g.dz, g.dx), kind: 'gate', half: o.half, open: true });
    }
    out.push({ pts: run.pts, h: style.panelY1, kind: style.name || 'fence', piers: kept });
  }
  {                                                                                             // the bays: granite plinth + iron panel, a thin collider each, ONE anchored knock record each
    const us = [...new Set(bays.map((b) => b.u))], y0 = style.panelY0 ?? style.plinthH, y1 = style.panelY1;
    knockBays(ctx, { name: 'lmAnd-fence-' + (style.name || 'f'), bays, far: 300,
      parts: [{ geo: unitBox(0, style.plinthH, -plT / 2, plT / 2, { uLen: 3.4, uvs: 2 }), mat: style.plinthMat, name: 'plinth', stretch: true },
        ...us.map((u) => ({ geo: unitPanel(y0, y1, { u1: u }), mat: style.panelMat, name: 'panel' + u, stretch: true, shadow: false, receive: false, noOutline: true, when: (b) => b.u === u }))],
      collider: { y0: 0, y1: style.colH ?? y1, thick: 0.4, e0: pw / 2, e1: pw / 2 },
      rec: () => ({ kind: 'fence', mass: 700, h: style.colH ?? y1, anchored: 24, hitK: 0.5, metal: true, minDv: 0 }) });
    K.extraTris += bays.length * 24;
  }
  K.extraTris += addInstanced(ctx, K.root, 'lmAnd-piers-' + (style.name || 'f'), pierG, pm).tris;
  if (gateG) K.extraTris += addInstanced(ctx, K.root, 'lmAnd-gatepiers-' + (style.name || 'f'), gateG, gm).tris;
  K.svc.fences = (K.svc.fences || []).concat(out);
  void THREE;
  return out;
}
