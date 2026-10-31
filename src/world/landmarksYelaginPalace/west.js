// landmarksYelaginPalace/west.js - the PODIUM and everything on the ground around the palace (dossier 5.2, 5.3, 12 (KNOWN ERRORS 7 and 12); photos pal_01 pal_04 pal_05 pal_06 pal_20 pal_26 pal_27 pal_28 lion_05 lion_07):
//   * the floor of the terrace / podium at F = 2.8 (granite flags) with a retaining wall of grey ashlar all round it and the white cast-iron lattice balustrade on its edge;
//   * the WEST STAIR: 13 granite steps (tread 0.42), the landing at +2.0 between two ashlar cheek blocks that carry the white plinths of the lions, two short side flights up to the terrace;
//   * the two curved CARRIAGE RAMPS (cobbled, 10 % grade, kerbs 0.45 m, the palace-side kerb is the podium wall) from the terrace ends to their tips at the lawn;
//   * the EAST STAIR: 14 broad steps (tread 0.59) down from the rotunda platform, two ashlar cheek blocks on each side (the marble vases and planters stand on them).
// The polygon / ramp numbers are in frame.js (FLOOR, RAMP_N, RAMP_S): the OSM outline w173206736 re-read in the palace frame.  Everything is Parts geometry in world coordinates (the Parts stack is empty).
import * as THREE from 'three';
import { PA, W, F, P as PL, FLOOR, RAMP_N, RAMP_S, EAST_STAIR } from './frame.js';
import { balustrade } from './orders.js';
import { holedWall, pane, archSurround } from './facade.js';

const stage = (K, name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksYelaginPalace] west/${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };
const L = PL.halfLen;

/** palace (u, y, w) -> world [x, y, z] */
const V = (u, y, w) => { const p = W(u, w); return [p.x, y, p.z]; };
/** normal in palace axes (nu, ny, nw) -> world */
const N = (nu, ny, nw) => [-nw, ny, nu];

function polyInside(pts, u, w) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > w) !== (pts[j][1] > w) && u < (pts[j][0] - pts[i][0]) * (w - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; }

export function floorPts() { return FLOOR.map((v) => (Array.isArray(v) ? v : v.p)); }
/** the edges of the floor polygon: { a:[u,w], b:[u,w], open } */
export function floorEdges() {
  const pts = floorPts(), out = [];
  for (let i = 0; i < pts.length; i++) {
    const v = FLOOR[i], a = pts[i], b = pts[(i + 1) % pts.length];
    out.push({ a, b, open: !Array.isArray(v) && !!v.open, i });
  }
  return out;
}

/** a vertical wall quad along the palace-axes segment a -> b from y0 to y1 facing outward of the polygon `pts` (u, w); uv in metres / tile */
function wallQuad(K, mat, a, b, y0, y1, pts, tile = 1.8, flip = false) {
  const du = b[0] - a[0], dw = b[1] - a[1], len = Math.hypot(du, dw);
  if (len < 0.02) return;
  let nu = dw / len, nw = -du / len;                                   // candidate normal in (u, w)
  const mu = (a[0] + b[0]) / 2, mw = (a[1] + b[1]) / 2;
  const inside = polyInside(pts, mu + nu * 0.05, mw + nw * 0.05);
  if (inside !== flip) { nu = -nu; nw = -nw; }                         // flip === false: outward of the polygon
  K.P.quad(mat, V(a[0], y0, a[1]), V(b[0], y0, b[1]), V(b[0], y1, b[1]), V(a[0], y1, a[1]), N(nu, 0, nw), [[0, y0 / tile], [len / tile, y0 / tile], [len / tile, y1 / tile], [0, y1 / tile]]);
  return [nu, nw];
}

/** a retaining-wall edge with blind arched recesses: the panel is an extruded Shape with arch holes (reveal 0.5 m), a dark back pane in every recess, a stone archivolt round it */
function recessedWall(K, e, at, pts) {
  const P = K.P, M = K.M, du = e.b[0] - e.a[0], dw = e.b[1] - e.a[1], len = Math.hypot(du, dw);
  let nu = dw / len, nw = -du / len;
  if (polyInside(pts, (e.a[0] + e.b[0]) / 2 + nu * 0.05, (e.a[1] + e.b[1]) / 2 + nw * 0.05)) { nu = -nu; nw = -nw; }
  const nx = -nw, nz = nu;                                                // outward normal in the world
  const A = W(e.a[0], e.a[1]), B = W(e.b[0], e.b[1]);
  const fwd = (-(B.z - A.z)) * 0 + ((-(B.z - A.z)) / len) * nx + ((B.x - A.x) / len) * nz > 0;     // is the frame a -> b outward-facing (local z = (-dz, dx) / len)?
  const o = fwd ? A : B, t = fwd ? B : A, dx = t.x - o.x, dz = t.z - o.z;
  P.push(o.x, 0, o.z, Math.atan2(-dz, dx));
  try {
    const xs = at.filter((x) => x < len - 1).map((x) => (fwd ? x : len - x));
    const holes = xs.map((cx) => ({ cx, y0: 0.15, w: 1.9, h: 2.35, arch: true }));
    holedWall(P, M.limestone, 0, len, 0, F, holes, { depth: 0.5, uvs: 1.8 });
    for (const h of holes) { pane(P, M.dark, h, 0.5); archSurround(P, M.limestone, h, { sw: 0.2, proud: 0.07, sill: false, impost: false }); }
  } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ the floor, the retaining wall, the railing
function podium(K) {
  const P = K.P, M = K.M, pts = floorPts(), edges = floorEdges();
  // floor: flags at F, with a hole where the palace body stands (its footprint u +-23.65, w 0 .. -24.5)
  const ring = pts.map(([u, w]) => { const p = W(u, w); return [p.x, p.z]; });
  const hole = [[-L, 0], [-L, PL.wallE], [L, PL.wallE], [L, 0]].map(([u, w]) => { const p = W(u, w); return [p.x, p.z]; });
  P.cap(M.flags, ring, F, true, 2.4, [hole]);
  // the retaining wall under every closed edge + the railing on it
  K.shared.railEdges = [];
  // blind arched recesses in the long flank walls (pal_04 left, pal_05 right: an arch in the rusticated base): [edge index] -> positions along the edge (from its start vertex)
  const RECESS = { 0: [6.0, 17.0, 28.0, 35.0], 19: [8.0, 20.0, 32.0, 40.0], 20: [3.5, 11.5], 22: [4.5, 12.5] };
  for (const e of edges) {
    if (e.open) continue;
    if (RECESS[e.i]) recessedWall(K, e, RECESS[e.i], pts); else wallQuad(K, M.limestone, e.a, e.b, 0, F, pts);
    K.shared.railEdges.push(e);
  }
  // the railing: along every closed edge, a post at every corner shared by two runs; the rail sits 0.14 m inside the edge (the floor is the stone coping)
  const inset = (e) => {
    const du = e.b[0] - e.a[0], dw = e.b[1] - e.a[1], len = Math.hypot(du, dw);
    let nu = dw / len, nw = -du / len;
    if (polyInside(pts, (e.a[0] + e.b[0]) / 2 + nu * 0.05, (e.a[1] + e.b[1]) / 2 + nw * 0.05)) { nu = -nu; nw = -nw; }
    const A = W(e.a[0] - nu * 0.16, e.a[1] - nw * 0.16), B = W(e.b[0] - nu * 0.16, e.b[1] - nw * 0.16);
    return { a: [A.x, A.z], b: [B.x, B.z], len };
  };
  for (const e of K.shared.railEdges) {
    const i = e.i, nextOpen = edges[(i + 1) % edges.length].open, we = inset(e);
    along(P, we.a, we.b, (len) => balustrade(P, M, 0, len, F, 0, { h: 1.0, step: 1.8, noEnd: !nextOpen }));
  }
}

/** run fn(len) in a frame whose x axis runs from world point a to b (z = its left); the lattice is double sided so the side does not matter */
export function along(P, a, b, fn) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
  P.push(a[0], 0, a[1], Math.atan2(-dz, dx));
  try { return fn(len); } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ the west stair
function westStair(K) {
  const P = K.P, M = K.M, S = PL.stair, p0 = W(0, 0);
  P.push(p0.x, 0, p0.z, PA.rot);                                          // local x = u, local z = w
  const rise = S.top / S.n;
  for (let k = 0; k < S.n; k++) {
    const wf = S.wFoot - k * S.tread, wb = wf - S.tread, yt = (k + 1) * rise;
    P.box(M.steps, -S.half, S.half, 0, yt, wb, wf, 'kb', 1);
  }
  P.box(M.flags, -S.half, S.half, 0, S.top, 7.6, S.wTop, 'kbf', 2.4);                                                           // the landing (w 7.6 .. 9.54)
  // cheek blocks (ashlar) with the white lion plinths on them
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? S.half : -S.half - S.cheekW, x1 = s > 0 ? S.half + S.cheekW : -S.half;
    P.box(M.limestone, x0, x1, 0, S.top + 0.06, S.wTop, S.wFoot, 'bk', 1.8);
    const px = s * 6.85;
    P.box(M.whiteFlat, px - 0.52, px + 0.52, S.top + 0.06, S.top + 0.41, 12.6, 15.0, 'b', 1);                                  // the lion plinth 2.4 x 1.04 x 0.35
    const dx = s > 0 ? px - 0.535 : px + 0.535, za = s > 0 ? 12.8 : 14.8, zb = s > 0 ? 14.8 : 12.8;                                 // the inscription on the face toward the stair, reading left to right
    P.quad(M.plinthText, [dx, S.top + 0.12, za], [dx, S.top + 0.12, zb], [dx, S.top + 0.35, zb], [dx, S.top + 0.35, za], [s > 0 ? -1 : 1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // the two side flights on the landing: four steps rising outward from the landing (2.0) to the terrace (2.8)
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const xa = S.half + i * 1.0, xb = S.half + (i + 1) * 1.0 + (i === 3 ? 0.0 : 0), yt = 2.0 + 0.2 * (i + 1);
    P.box(M.steps, s > 0 ? xa : -xb, s > 0 ? xb : -xa, 0, yt, 7.6, S.wTop, 'kb', 1);
  }
  // the balustrade along the open front of each flight (a run per step, base at the step top)
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const xa = S.half + i * 1.0, xb = S.half + (i + 1) * 1.0, yt = 2.0 + 0.2 * (i + 1);
    balustrade(P, M, s > 0 ? xa : -xb, s > 0 ? xb : -xa, yt, S.wTop - 0.16, { h: 1.0, step: 1.0 });
  }
  P.pop();
  void rise;
}

// ------------------------------------------------------------------------------------------------ the ramps
function resample(poly, n) {
  const L2 = [0]; for (let i = 1; i < poly.length; i++) L2.push(L2[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const tot = L2[L2.length - 1], out = [];
  for (let k = 0; k < n; k++) {
    const d = tot * k / (n - 1); let i = 1; while (i < poly.length - 1 && L2[i] < d) i++;
    const t = (d - L2[i - 1]) / ((L2[i] - L2[i - 1]) || 1);
    out.push([poly[i - 1][0] + (poly[i][0] - poly[i - 1][0]) * t, poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * t]);
  }
  return out;
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], len2 = (a) => Math.hypot(a[0], a[1]);

/** one ramp: returns { A, B, hA, hB, segs: [{ c: [x, z], rot, w, len, yA, yB }], tips: [[u, w], ...] } */
function ramp(K, R, name) {
  const P = K.P, M = K.M, n = 14, A = resample(R.A, n), B = resample(R.B, n), H = (i) => F * (1 - i / (n - 1));
  // inward offsets of the kerbs (toward the other curve), 0.4 m
  const inw = (X, Y, i) => { const t = sub(X[Math.min(n - 1, i + 1)], X[Math.max(0, i - 1)]); const l = len2(t) || 1; let nn = [-t[1] / l, t[0] / l]; const to = sub(Y[i], X[i]); if (nn[0] * to[0] + nn[1] * to[1] < 0) nn = [-nn[0], -nn[1]]; return nn; };
  const aKerb = (i) => Math.abs(A[i][0]) > 26.4, cut = 0.4;
  const A2 = A.map((p, i) => { if (!aKerb(i)) return p; const nn = inw(A, B, i); return [p[0] + nn[0] * cut, p[1] + nn[1] * cut]; });
  const B2 = B.map((p, i) => { const nn = inw(B, A, i); return [p[0] + nn[0] * cut, p[1] + nn[1] * cut]; });
  const segs = [];
  for (let i = 0; i < n - 1; i++) {
    const hA0 = H(i), hA1 = H(i + 1);
    // the cobbled surface
    const q = [V(A2[i][0], hA0, A2[i][1]), V(B2[i][0], hA0, B2[i][1]), V(B2[i + 1][0], hA1, B2[i + 1][1]), V(A2[i + 1][0], hA1, A2[i + 1][1])];
    P.quad(M.setts, q[0], q[1], q[2], q[3], [0, 1, 0], q.map((p) => [p[0] / 1.5, p[2] / 1.5]));
    // lawn-side kerb: outer face, inner face, top
    const kb = (X, X2, Y2, outerSign, wall) => {
      const o0 = X[i], o1 = X[i + 1], k0 = X2[i], k1 = X2[i + 1];
      const hh0 = hA0 + 0.45, hh1 = hA1 + 0.45;
      // outer face (from the ground), faces away from the band
      const out = (a, b, ha, hb) => P.quad(M.limestone, V(a[0], 0, a[1]), V(b[0], 0, b[1]), V(b[0], hb, b[1]), V(a[0], ha, a[1]), (() => { const tt = sub(b, a); const l = len2(tt) || 1; let nn = [tt[1] / l, -tt[0] / l]; const to = sub(Y2[i], a); if (nn[0] * to[0] + nn[1] * to[1] > 0) nn = [-nn[0], -nn[1]]; return N(nn[0], 0, nn[1]); })(), [[0, 0], [len2(sub(b, a)) / 1.8, 0], [len2(sub(b, a)) / 1.8, hb / 1.8], [0, ha / 1.8]]);
      out(o0, o1, hh0, hh1);
      // inner face of the kerb (above the cobbles) faces the band
      P.quad(M.limestone, V(k0[0], hA0, k0[1]), V(k1[0], hA1, k1[1]), V(k1[0], hh1, k1[1]), V(k0[0], hh0, k0[1]), (() => { const tt = sub(k1, k0); const l = len2(tt) || 1; let nn = [tt[1] / l, -tt[0] / l]; const to = sub(Y2[i], k0); if (nn[0] * to[0] + nn[1] * to[1] < 0) nn = [-nn[0], -nn[1]]; return N(nn[0], 0, nn[1]); })(), [[0, hA0 / 1.8], [len2(sub(k1, k0)) / 1.8, hA1 / 1.8], [len2(sub(k1, k0)) / 1.8, hh1 / 1.8], [0, hh0 / 1.8]]);
      P.quad(M.limestone, V(o0[0], hh0, o0[1]), V(o1[0], hh1, o1[1]), V(k1[0], hh1, k1[1]), V(k0[0], hh0, k0[1]), [0, 1, 0], [[o0[0] / 1.8, o0[1] / 1.8], [o1[0] / 1.8, o1[1] / 1.8], [k1[0] / 1.8, k1[1] / 1.8], [k0[0] / 1.8, k0[1] / 1.8]]);
      void outerSign; void wall;
    };
    kb(B, B2, A2, 1, false);
    if (aKerb(i) && aKerb(i + 1)) kb(A, A2, B2, -1, false);
    // the colliders (walk ramp along the band centre)
    const m0 = [(A2[i][0] + B2[i][0]) / 2, (A2[i][1] + B2[i][1]) / 2], m1 = [(A2[i + 1][0] + B2[i + 1][0]) / 2, (A2[i + 1][1] + B2[i + 1][1]) / 2];
    const w0 = V(m0[0], 0, m0[1]), w1 = V(m1[0], 0, m1[1]);
    const dx = w0[0] - w1[0], dz = w0[2] - w1[2], l = Math.hypot(dx, dz), width = (len2(sub(A2[i], B2[i])) + len2(sub(A2[i + 1], B2[i + 1]))) / 2;
    segs.push({ c: [(w0[0] + w1[0]) / 2, (w0[2] + w1[2]) / 2], rot: Math.atan2(dx, dz), w: width, len: l + 0.5, yA: hA1, yB: hA0 });
  }
  // the end of the kerb at the tip: a block with a granite ball (the balls are placed in sculpt.js)
  const tips = [A[n - 1], B[n - 1]];
  K.shared.ramps = (K.shared.ramps || []).concat([{ name, A, B, A2, B2, n, segs, tips, aKerb }]);
}

// ------------------------------------------------------------------------------------------------ the east stair
function eastStair(K) {
  const P = K.P, M = K.M, S = EAST_STAIR, p0 = W(0, 0);
  P.push(p0.x, 0, p0.z, PA.rot);
  const d = S.run / S.n, rise = F / S.n;
  for (let k = 0; k < S.n - 1; k++) {
    const wf = S.wTop - k * d, wb = wf - d, yt = F - (k + 1) * rise;
    P.box(M.steps, -S.half, S.half, 0, yt, wb, wf, 'fb', 1);
  }
  // the riser of the floor edge above the first step
  P.quad(M.limestone, [-S.half, F - rise, S.wTop], [S.half, F - rise, S.wTop], [S.half, F, S.wTop], [-S.half, F, S.wTop], [0, 0, -1], [[0, 0], [10, 0], [10, 0.1], [0, 0.1]]);
  // cheek blocks: an upper block level with the floor, a lower one two thirds down
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? S.half : -S.half - 2.4, x1 = s > 0 ? S.half + 2.4 : -S.half;
    P.box(M.limestone, x0, x1, 0, F, S.wTop - 3.6, S.wTop, 'bf', 1.8);
    P.box(M.limestone, x0, x1, 0, 1.3, S.wTop - 3.6 - 4.6, S.wTop - 3.6, 'bf', 1.8);
  }
  P.pop();
}

export function build(K) {
  stage(K, 'podium', () => podium(K));
  stage(K, 'westStair', () => westStair(K));
  stage(K, 'ramps', () => { ramp(K, RAMP_N, 'N'); ramp(K, RAMP_S, 'S'); });
  stage(K, 'eastStair', () => eastStair(K));
  if (K.errs) throw new Error(K.errs.join('\n'));
}
