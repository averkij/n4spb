// streets/surface.js - asphalt ribbons + junction fillets, kerbs with the sand gutter, lane / parking markings, zebra crossings, stop lines,
// manhole covers. Everything is generated from the network in net.js. Layering (bottom to top, coplanar-safe through polygonOffset):
//   ground (environment, y 0) < footway 0.02-0.05 < asphalt 0.03 < wear / gutter decals 0.033 < paint 0.037 < (sidewalk 0.12, kerb top 0.15)
import { MB, UP, clamp, lerp, hash2, rgb, segClosest, dpKeep } from './util.js';
import { wayAt, nearCrossing, pointAtS, mitres } from './net.js';
import { prepLanes, latAt } from './lanes.js';
import { ASPHALT_TILE } from './tex.js';
import { deckAt } from './decks.js';
import { planMarkings, drawPlan, isBusLaneWay } from './markings.js';
import { kerbBacking } from './walks.js';                // (walks.js imports this file too: both only use the other at call time)
import { northDeckHeight } from '../northBridges/sites.js';

export const ROAD_Y = 0.03, WALK_Y = 0.12, KERB_H = 0.15, LIFT = 0.015, KERB_W = 0.2;
const WHITE = rgb('#e9e6dc'), YELLOW = rgb('#e3c64a'), GULLY = rgb('#2c2d30'), BUSLANE = rgb('#a05a46'), ZEBRA_RED = rgb('#7f4c47');
export const WEST_X = -880;                                    // west of Sadovaya (the Fontanka-to-Admiralty part of the map): bus lanes painted red-brown, zebras red-brown / white

/** mitre factors so a ribbon keeps its width in bends */
export function prepWay(w) {
  if (w._prep) return; w._prep = true;
  prepLanes(w);
  w.mit = mitres(w);
}

// ------------------------------------------------------------------ asphalt
export function buildAsphalt(net, B, Bs) {                      // (every drivable road is asphalt: the cobble / brick switches of the ways are gone; streets.js still passes its cobble / brick builders, other generators use them)
  const T = ASPHALT_TILE;
  const pick = (w) => (w.rank === 0 ? [Bs, T] : [B, T]);
  for (const w of net.ways) {
    prepWay(w);
    if (w.skipDraw) continue;                                    // the bridge deck is drawn by landmarksC
    const [out, tile] = pick(w);
    let prev = null;
    // both edges of the ribbon, then only the vertices where an edge bends (or the width changes) by more than 3 cm: straight blocks become single quads
    const LP = [], RP = [];
    for (let i = 0; i < w.n; i++) {
      const nx = -w.tz[i], nz = w.tx[i], m = w.mit[i];
      LP.push([w.x[i] - nx * w.hL[i] * m, w.z[i] - nz * w.hL[i] * m]); RP.push([w.x[i] + nx * w.hR[i] * m, w.z[i] + nz * w.hR[i] * m]);
    }
    const keep = w.n > 2 ? dpKeep([LP, RP], 0.03, (i) => w.deck[i] !== w.deck[i - 1] || w.deck[i] !== w.deck[i + 1], 40) : [true, true];
    for (let i = 0; i < w.n; i++) {
      if (!keep[i]) continue;
      const [lx, lz] = LP[i], [rx, rz] = RP[i];
      const a = out.vert(lx, ROAD_Y, lz, lx / tile, lz / tile), b = out.vert(rx, ROAD_Y, rz, rx / tile, rz / tile);
      if (prev && !(w.deck[i] && prev[2])) out.quad(prev[0], prev[1], b, a);       // the bridges module draws the deck: no asphalt between two deck vertices
      prev = [a, b, w.deck[i], i];
    }
  }
  for (const f of net.fillets) {
    if (f.ways[0].skipDraw || f.ways[1].skipDraw || deckAt(f.P[0], f.P[1])) continue;
    const out = B, tile = T;
    const p = out.vert(f.P[0], ROAD_Y, f.P[1], f.P[0] / tile, f.P[1] / tile);
    let last = -1;
    for (const [x, z] of f.arc) {
      const v = out.vert(x, ROAD_Y, z, x / tile, z / tile);
      if (last >= 0) out.tri(p, last, v);
      last = v;
    }
  }
}

// ------------------------------------------------------------------ kerbs
function simplifyRun(pts, tol) {
  const keep = new Array(pts.length).fill(false); keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let best = -1, bd = tol;
    for (let i = a + 1; i < b; i++) { const d = segClosest(pts[i].x, pts[i].z, pts[a].x, pts[a].z, pts[b].x, pts[b].z).d; if (d > bd) { bd = d; best = i; } }
    if (best >= 0) { keep[best] = true; stack.push([a, best], [best, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/** The kerb runs that are drawn: net.kerbRuns without the stones that have no pavement behind them because another carriageway lies there (walks.js kerbBacking: the free-standing kerb
 *  of an island between two roadways, a corner arc whose patch would lie on asphalt), and without the stubs that remain: a run shorter than STUB m that does not touch another run.
 *  Returns [{ run, pts }]. */
const STUB = 3;
function drawnKerbs(net) {
  const backing = kerbBacking(net), subs = [];
  for (const run of net.kerbRuns) {
    if (run.w.skipDraw) continue;
    const drop = backing(run);
    let cur = null;
    for (let i = 0; i < run.pts.length; i++) {
      if (drop[i]) { cur = null; continue; }
      if (!cur) { cur = []; subs.push({ run, pts: cur }); }
      cur.push(run.pts[i]);
    }
  }
  const lenOf = (pts) => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); return l; };
  const live = subs.filter((r) => r.pts.length >= 2);
  const CELL = 1, ends = new Map(), key = (x, z) => Math.round(x / CELL) * 65536 + Math.round(z / CELL);
  const add = (r, p) => { const k = key(p.x, p.z); let l = ends.get(k); if (!l) ends.set(k, (l = [])); l.push(r); };
  for (const r of live) { add(r, r.pts[0]); add(r, r.pts[r.pts.length - 1]); }
  const touches = (r, p) => { for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const o of ends.get(key(p.x + dx * CELL, p.z + dz * CELL)) || []) { if (o === r) continue; for (const q of [o.pts[0], o.pts[o.pts.length - 1]]) if (Math.hypot(q.x - p.x, q.z - p.z) < 0.45) return true; } return false; };
  return live.filter((r) => lenOf(r.pts) >= STUB || touches(r, r.pts[0]) || touches(r, r.pts[r.pts.length - 1]));
}

/** kerb stones (inner face, top, outer face; light granite via vertex colour) + the dusty gutter decal along the road side. Dropped kerbs: no kerb run there. */
export function buildKerbs(net, B, Bg, Bp) {
  for (const { run, pts: raw } of drawnKerbs(net)) {
    const yellow = Bp && run.kind === 'edge' && run.w.name === 'Невский проспект' && run.w.rank >= 3;     // yellow painted kerb line where stopping is banned (docs/research/streets.md P03)
    const pts = simplifyRun(raw, 0.07);
    if (pts.length < 2) continue;
    let s = 0, prev = null, gs = 0, gp = null;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i) s += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
      const u = s / 1.0;
      const ix = p.x, iz = p.z, ox = p.x + p.ox * KERB_W, oz = p.z + p.oz * KERB_W;
      const nIn = [-p.ox, 0, -p.oz], nOut = [p.ox, 0, p.oz];
      const a0 = B.vert(ix, ROAD_Y - 0.004, iz, u, 0, nIn, [0.78, 0.78, 0.8]), a1 = B.vert(ix, KERB_H, iz, u, 0.5, nIn, [0.88, 0.88, 0.9]);
      const t0 = B.vert(ix, KERB_H, iz, u, 0.2, UP, [1, 1, 1]), t1 = B.vert(ox, KERB_H, oz, u, 0.8, UP, [1, 1, 1]);
      const b1 = B.vert(ox, KERB_H, oz, u, 0.5, nOut, [0.93, 0.93, 0.95]), b0 = B.vert(ox, WALK_Y - 0.03, oz, u, 0, nOut, [0.88, 0.88, 0.9]);
      const cur = [a0, a1, t0, t1, b1, b0];
      if (prev) {
        B.quad(prev[0], prev[1], cur[1], cur[0], nIn);
        B.quad(prev[2], prev[3], cur[3], cur[2], UP);
      } else {
        const cap = [-((pts[1].x - p.x) || 0), 0, -((pts[1].z - p.z) || 0)]; const cl = Math.hypot(cap[0], cap[2]) || 1; cap[0] /= cl; cap[2] /= cl;
        B.tri(a0, a1, t1, cap); B.tri(a0, t1, b0, cap);
      }
      if (yellow && prev) {
        const q = pts[i - 1], yv = (pp, d) => Bp.vert(pp.x + pp.ox * d, KERB_H + 0.012, pp.z + pp.oz * d, 0, 0, UP, YELLOW);
        const y0 = yv(q, 0.04), y1 = yv(q, 0.14), y2 = yv(p, 0.14), y3 = yv(p, 0.04);
        Bp.quad(y0, y1, y2, y3);
      }
      prev = cur;
      // gutter: dust / sand along the road side of the kerb (1.5 m wide, v = length / 6 m)
      if (i) gs += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
      if (run.w.rank >= 2 && run.kind === 'edge') {
        const ga = Bg.vert(p.x, ROAD_Y + 0.01, p.z, 0, gs / 6), gb = Bg.vert(p.x - p.ox * 1.5, ROAD_Y + 0.01, p.z - p.oz * 1.5, 1, gs / 6);
        if (gp) Bg.quad(gp[0], gp[1], gb, ga);
        gp = [ga, gb];
      }
    }
    { const p = pts[pts.length - 1], q = pts[pts.length - 2]; const cap = [p.x - q.x, 0, p.z - q.z]; const cl = Math.hypot(cap[0], cap[2]) || 1; cap[0] /= cl; cap[2] /= cl;
      B.tri(prev[0], prev[1], prev[3], cap); B.tri(prev[0], prev[3], prev[5], cap); }
  }
}

// ------------------------------------------------------------------ markings
function strip(B, pts, width, col, lift, uvLen = 3) {
  // pts: [{x,z,y,nx,nz}] centre points with unit normals. uv: u across 0..1, v along (metres / uvLen). Collinear interior points are dropped (a dash = one quad, a straight line = a few).
  if (pts.length > 2) { const keep = dpKeep([pts.map((p) => [p.x, p.z])], 0.012); pts = pts.filter((_, i) => keep[i]); }
  let prev = null, s = 0;
  pts.forEach((p, i) => {
    if (i) s += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
    const a = B.vert(p.x + p.nx * width / 2, p.y + lift, p.z + p.nz * width / 2, 0, s / uvLen, UP, col), b = B.vert(p.x - p.nx * width / 2, p.y + lift, p.z - p.nz * width / 2, 1, s / uvLen, UP, col);
    if (prev) B.quad(prev[0], prev[1], b, a);
    prev = [a, b];
  });
}

/** a run along way w at lateral offset latFn(q) between arclengths s0..s1; split where `hidden` says so */
function lineRuns(w, s0, s1, step, latFn, hidden) {
  const runs = []; let cur = null;
  const n = Math.max(2, Math.ceil((s1 - s0) / step) + 1);
  for (let k = 0; k < n; k++) {
    const s = s0 + (s1 - s0) * k / (n - 1), q = wayAt(w, s), off = latFn(q);
    const nx = -q.tz, nz = q.tx, x = q.x + nx * off, z = q.z + nz * off;
    if (hidden(x, z, s, q) || deckAt(x, z, 0.3)) { cur = null; continue; }
    if (!cur) { cur = []; runs.push(cur); }
    cur.push({ x, z, y: ROAD_Y, nx, nz });
  }
  return runs.filter((r) => r.length >= 2);
}

/** Tyre wear (one band per lane), the red-brown bus lane of west Nevsky and the PLAN of the white road markings (markings.js: the rule set of docs/rules/ROAD-MARKINGS.md, drawn by drawPlan).
 *  Returns the plan ({ lines, bars, arrows, stats }); the lane arrows are pushed into arrowsOut, the stop bars are painted by buildStopLines(plan, P). graph = the lane graph (lane ranges, stop lines). */
export function buildMarkings(net, P, Wear, arrowsOut, Red, graph) {
  for (const w of net.ways) {
    prepWay(w);
    if (w.rank === 0 || w.skipDraw) continue;
    const isRoad = w.rank >= 2 || (w.rank === 1 && w.w >= 5.5);
    const K = w.bnd[0].b.length;
    const hidden = (x, z, m) => net.cover(x, z, { skip: w }) > -m;
    // tyre wear (one band per lane)
    if (w.rank >= 2) {
      for (let j = 0; j < K - 1; j++) {
        const runs = lineRuns(w, 0, w.L, 8, (q) => (latAt(w, q, j) + latAt(w, q, j + 1)) / 2, (x, z) => net.cover(x, z, { skip: w }) > -1.4);
        for (const run0 of runs) {
          let prev = null;
          const kp = run0.length > 2 ? dpKeep([run0.map((p) => [p.x, p.z])], 0.05) : null, run = kp ? run0.filter((_, i) => kp[i]) : run0;
          for (const p of run) {
            const half = (w.bnd[0].b[j + 1] - w.bnd[0].b[j]) / 2;
            const a = Wear.vert(p.x + p.nx * half * 0.96, ROAD_Y + 0.01, p.z + p.nz * half * 0.96, 0, 0.5), b = Wear.vert(p.x - p.nx * half * 0.96, ROAD_Y + 0.01, p.z - p.nz * half * 0.96, 1, 0.5);
            if (prev) Wear.quad(prev[0], prev[1], b, a);
            prev = [a, b];
          }
        }
      }
    }
    if (!isRoad) continue;
    // Nevsky west of Sadovaya: the kerb lane of every carriageway is the bus / trolleybus lane, painted red-brown (docs/research/west-nevsky-2.md 2.4: #a85a42; photos P49 P92)
    if (Red && isBusLaneWay(w) && K >= 4) {
      const noZone = (x, z) => hidden(x, z, -0.12) || !!nearCrossing(net, x, z, 1.0);
      for (const r of lineRuns(w, 0, w.L, 4, (q) => (latAt(w, q, K - 2) + latAt(w, q, K - 1)) / 2, noZone)) strip(Red, r.map((p) => ({ ...p, y: ROAD_Y - 0.004 })), w.bnd[0].lw - 0.22, BUSLANE, LIFT, 6);
    }
  }
  const plan = planMarkings(net, graph, { arrows: !!arrowsOut, bus: !!Red });
  drawPlan(plan, P);
  if (arrowsOut) arrowsOut.push(...plan.arrows);
  return plan;
}

/** straight-ahead lane arrow (3.6 m long) as a polygon decal */
export function addArrow(P, a, col = WHITE) {
  const { x, z, dx, dz, y } = a, nx = -dz, nz = dx;
  const V = (u, v, tu, tv) => {
    const px=x+dx*u+nx*v,pz=z+dz*u+nz*v;
    return P.vert(px,(northDeckHeight(px,pz)??y)+LIFT,pz,tu,tv,UP,col);
  };
  const s0 = V(-1.8, -0.08, 0, 0), s1 = V(-1.8, 0.08, 1, 0), s2 = V(0.6, 0.08, 1, 0.6), s3 = V(0.6, -0.08, 0, 0.6);
  P.quad(s0, s1, s2, s3);
  const h0 = V(0.45, -0.42, 0, 0.6), h1 = V(0.45, 0.42, 1, 0.6), h2 = V(1.85, 0, 0.5, 1);
  P.tri(h0, h1, h2);
}

// ------------------------------------------------------------------ zebra crossings
/** zebra bars: 0.5 m wide, 0.5 m gaps, laid across the carriageway and long (4 m) ALONG the traffic, as seen in docs/research photos; each bar a little worn */
export function buildCrossings(net, P) {
  const stats = { stripes: 0 };
  for (const c of net.crossings) {
    if (c.road.skipDraw || deckAt(c.x, c.z, 2)) continue;
    const wz = clamp(c.w + 1, 3.5, 6), half = wz / 2;
    const x0 = -c.hL + 0.35, x1 = c.hR - 0.35, n = Math.max(1, Math.floor((x1 - x0) / 1.0));
    const x00 = (x0 + x1) / 2 - (n - 1) / 2;
    const redGaps = c.road.name === 'Невский проспект' && c.road.rank >= 3 && c.x < WEST_X;     // west Nevsky zebras: red-brown bars between the white ones (docs/research/west-life-furniture.md fact 16)
    if (redGaps) for (let k = 0; k < n + 1; k++) {
      const p = x00 + (k - 0.5) * 1.0; if (p < x0 - 0.3 || p > x1 + 0.3) continue;
      const wear = 0.85 + 0.15 * hash2(c.x * 0.31 + k, c.z * 0.43), col = [ZEBRA_RED[0] * wear, ZEBRA_RED[1] * wear, ZEBRA_RED[2] * wear];
      const bx = c.x + c.nx * p, bz = c.z + c.nz * p;
      const q = (du, dv, tu, tv) => { const x=bx+c.tx*du+c.nx*dv,z=bz+c.tz*du+c.nz*dv;return P.vert(x,(northDeckHeight(x,z)??ROAD_Y)+LIFT,z,tu,tv,UP,col); };
      P.quad(q(-half, -0.25, 0, 0), q(half, -0.25, 1, 0), q(half, 0.25, 1, 1), q(-half, 0.25, 0, 1));
    }
    for (let k = 0; k < n; k++) {
      const p = x00 + k * 1.0, wear = 0.82 + 0.18 * hash2(c.x * 0.37 + k, c.z * 0.51);
      const col = [WHITE[0] * wear, WHITE[1] * wear, WHITE[2] * wear];
      const bx = c.x + c.nx * p, bz = c.z + c.nz * p;
      const q = (du, dv, tu, tv) => { const x=bx+c.tx*du+c.nx*dv,z=bz+c.tz*du+c.nz*dv;return P.vert(x,(northDeckHeight(x,z)??ROAD_Y)+LIFT,z,tu,tv,UP,col); };
      P.quad(q(-half, -0.25, 0, 0), q(half, -0.25, 1, 0), q(half, 0.25, 1, 1), q(-half, 0.25, 0, 1));
      stats.stripes++;
    }
  }
  return stats;
}

/** manhole covers on the big roads (ring + lid, decals) */
export function buildManholes(net, P) {
  const RING = rgb('#7a6354'), LID = rgb('#5d4a3d');
  const disc = (x, y, z, r, col) => {
    const c = P.vert(x, y, z, 0.5, 0.5, UP, col); let prev = -1, first = -1;
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, v = P.vert(x + Math.cos(a) * r, y, z + Math.sin(a) * r, 0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5, UP, col); if (first < 0) first = v; if (prev >= 0) P.tri(c, prev, v); prev = v; }
    P.tri(c, prev, first);
  };
  let n = 0;
  for (const w of net.ways) {
    if (w.rank < 2 || w.skipDraw) continue;
    prepWay(w);
    let k = 0;
    for (let s = 14 + hash2(w.i, 31) * 30; s < w.L - 10; s += 30 + hash2(w.i, 40 + k) * 60, k++) {
      const q = wayAt(w, s), K = w.bnd[q.k].b.length, j = Math.min(K - 2, Math.floor(hash2(w.i, 77 + k) * (K - 1)));
      const c = (latAt(w, q, j) + latAt(w, q, j + 1)) / 2 + (hash2(w.i, 99 + k) - 0.5) * 0.8;
      const x = q.x - q.tz * c, z = q.z + q.tx * c;
      if (net.cover(x, z, { skip: w }) > -3 || nearCrossing(net, x, z, 3) || deckAt(x, z, 1)) continue;
      disc(x, ROAD_Y + LIFT, z, 0.38, RING); disc(x, ROAD_Y + LIFT + 0.004, z, 0.3, LID); n++;
    }
  }
  return n;
}

/** the stop bars of the plan (markings.js: one 1.12 bar per approach, signalised and give-way approaches of public streets) */
export function buildStopLines(plan, P) { return drawPlan({ lines: [], bars: plan.bars }, P); }
export { lerp, clamp, pointAtS };
