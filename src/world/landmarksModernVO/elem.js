// landmarksModernVO/elem.js - architectural elements shared by the house files: closed prisms from a plan ring (corner bays, turrets), crowns / domes / onions as lofts of scaled rings, wavy-topped dormers,
// decal quads, iron balconies, instanced pinnacles.  Everything is drawn in the CURRENT Parts frame (the house frame or a front frame): x, z = plan, y up.
//   faceFrame(P, A, B, c, fn)   run fn(len) in the frame of the plan segment A -> B whose +z points AWAY from the point c (so a closed ring needs no winding care)
//   prism(P, ring, y0, y1, o)   closed shaft over a plan ring: o { bands | mat, wins: (i, len) => [windows], reveal, glass, depth, cap: mat (top), capUp: true } returns the centroid
//   scaleRing(ring, c, k, keepEnds)  ring scaled about c (the two end points stay when keepEnds: an open chain attached to walls);  loftRings(P, mat, ring, c, profile, o)  crown / dome / onion from a profile [[k, y], ...]
//   cornerBay(h, o)  the five-sided corner bay of the Baranovsky houses (the edges of the OSM outline): pier below, flared corbel, windowed shaft
//   dormer(P, M, o)  a wavy-topped dormer gable;  decal(P, mat, x, y, w, h, z)  a textured quad on the wall;  balcony(P, M, o) an iron balcony with a slab
import { winWall, quadFace, loft } from './wallx.js';
import { onEdge } from './kit.js';
import { inflate } from './surfaces.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';

export function faceFrame(P, A, B, c, fn) {
  let dx = B[0] - A[0], dz = B[1] - A[1], len = Math.hypot(dx, dz), nx = -dz / len, nz = dx / len;
  const mx = (A[0] + B[0]) / 2 - c[0], mz = (A[1] + B[1]) / 2 - c[1];
  if (nx * mx + nz * mz < 0) { const T = A; A = B; B = T; dx = -dx; dz = -dz; nx = -nx; nz = -nz; }
  P.push(A[0], 0, A[1], Math.atan2(nx, nz));
  try { return fn(len); } finally { P.pop(); }
}
export const centroidOf = (ring) => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];
export function scaleRing(ring, c, k, keepEnds = false) {
  return ring.map((p, i) => (keepEnds && (i === 0 || i === ring.length - 1) ? [p[0], p[1]] : [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]));
}
const ring3 = (ring, y) => ring.map((p) => [p[0], y, p[1]]);

/** closed shaft over a plan ring from y0 to y1; windows per face from o.wins(i, len) */
export function prism(P, ring, y0, y1, o) {
  const c = o.c || centroidOf(ring), n = ring.length, closed = o.closed !== false;
  const bands = o.bands || [{ y0, y1, mat: o.mat.mat, tu: o.mat.tu, tv: o.mat.tv }];
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const A = ring[i], B = ring[(i + 1) % n];
    faceFrame(P, A, B, c, (len) => winWall(P, { x0: 0, x1: len, z: 0, bands, wins: o.wins ? o.wins(i, len) || [] : [], reveal: o.reveal, glass: o.glass, depth: o.depth ?? 0.14 }));
  }
  if (o.cap) P.cap(o.cap, ring, y1, true, 2);
  if (o.under) P.cap(o.under, ring, y0, false, 2);
  return c;
}
/** crown / dome / onion over a plan ring: profile [[k, dy], ..] = scale about c and height above y0 of each ring; k = 0 closes into an apex.  o: { over, uRep, vTile, capMat } */
export function loftRings(P, mat, ring, c, y0, profile, o = {}) {
  const rings = profile.map(([k, dy]) => ring3(scaleRing(ring, c, k, false), y0 + dy));
  loft(P, mat, rings, { ax: c, uRep: o.uRep ?? 1, vTile: o.vTile ?? 1, capTop: o.capMat || null, capBot: o.capBot || null });
  return rings;
}

/**
 * The five-sided corner bay of a Baranovsky house from the OSM outline edges (`edges` in ring order, main frame).
 * o: { y0 (corbel start), y1 (corbel top = shaft start), top (shaft top), flare (1.12), mats: { shaft: {mat, tu, tv} | bands, corbel, pier: {mat, tu, tv}, cap }, wins: (i, len) => [..], pierTop (y of the pier top = y0),
 *      pierWins: (i, len) => [..], reveal, glass, depth }.  Returns { ring, shaft, c } (the pier ring, the flared shaft ring, the centroid).
 */
export function cornerBay(h, o) {
  const P = h.P, es = o.edges, ring = [es[0].a, ...es.map((e) => e.b)];
  const c = centroidOf(ring), shaft = scaleRing(ring, c, o.flare ?? 1.12, true);
  const mp = o.mats;
  // the pier of the ground floor: the outline edges themselves
  es.forEach((e, i) => onEdge(P, e, (len) => {
    const bands = mp.pierBands || [{ y0: 0, y1: o.y0, mat: mp.pier.mat, tu: mp.pier.tu, tv: mp.pier.tv }];
    winWall(P, { x0: 0, x1: len, z: 0, bands, wins: o.pierWins ? o.pierWins(i, len) || [] : [], reveal: o.reveal, glass: o.glass, depth: o.depth ?? 0.16 });
  }));
  // the corbel: pier ring at y0 -> flared ring at y1
  loft(P, mp.corbel, [ring3(ring, o.y0), ring3(shaft, o.y1)], { ax: c });
  // the shaft
  prism(P, shaft, o.y1, o.top, { c, closed: false, bands: mp.shaftBands, mat: mp.shaft, wins: o.wins, reveal: o.reveal, glass: o.glass, depth: o.depth ?? 0.14 });
  if (mp.cap) P.cap(mp.cap, shaft, o.top, true, 2);
  return { ring, shaft, c };
}

/** a decal quad on the wall plane z (faces +z) */
export function decal(P, mat, x, y, w, h, z = 0.03, uv) { P.quad(mat, [x - w / 2, y, z], [x + w / 2, y, z], [x + w / 2, y + h, z], [x - w / 2, y + h, z], [0, 0, 1], uv || [[0, 0], [1, 0], [1, 1], [0, 1]]); }

/**
 * A wavy-topped dormer on the wall plane z0: front wall x - w/2 .. x + w/2 from y0 to y0 + hw with one window, a hump cap up to y0 + h, cheeks `depth` deep, a flat lid.
 * o: { x, y0, w (1.6), h (2.8), hw (1.9), z (0), wall: {mat, tu, tv}, edge: material of the dark scroll edge, win: {w, h, y, glass, reveal}, depth (1.0), lid: material, humpPow (0.8) }
 */
export function dormer(P, o) {
  const w = o.w ?? 1.6, h = o.h ?? 2.8, hw = o.hw ?? 1.9, z = o.z ?? 0, d = o.depth ?? 1.0, x0 = o.x - w / 2, x1 = o.x + w / 2, y0 = o.y0, yb = y0 + hw;
  const ww = o.win || {};
  winWall(P, { x0, x1, z, bands: [{ y0, y1: yb, mat: o.wall.mat, tu: o.wall.tu, tv: o.wall.tv }], wins: [{ x: o.x, y: y0 + (ww.y ?? 0.35), w: ww.w ?? 0.9, h: ww.h ?? 1.4, glass: ww.glass, reveal: ww.reveal, depth: 0.16, trim: ww.trim }], reveal: ww.reveal, glass: ww.glass });
  const n = 12, top = [];
  for (let i = 0; i <= n; i++) { const t = i / n, s = Math.pow(0.5 - 0.5 * Math.cos(Math.PI * 2 * t), o.humpPow ?? 0.8); top.push([x0 + w * t, yb + (h - hw) * s]); }
  quadFace(P, o.wall.mat, [[x0, yb], ...top.slice(1, -1), [x1, yb]], z, o.wall.tu, o.wall.tv);
  if (o.edge) {                                                                          // the dark scroll edge: a strip 0.12 m wide along the hump
    for (let i = 0; i < n; i++) { const a = top[i], b = top[i + 1]; P.quad(o.edge, [a[0], a[1] - 0.12, z + 0.02], [b[0], b[1] - 0.12, z + 0.02], [b[0], b[1], z + 0.02], [a[0], a[1], z + 0.02], [0, 0, 1]); }
  }
  if (o.lid) for (let i = 0; i < n; i++) { const a = top[i], b = top[i + 1]; P.quad(o.lid, [a[0], a[1], z], [b[0], b[1], z], [b[0], b[1], z - d], [a[0], a[1], z - d], [0, 1, 0]); }
  for (const [xx, s] of [[x0, -1], [x1, 1]]) P.quad(o.wall.mat, [xx, y0, z], [xx, y0, z - d], [xx, yb, z - d], [xx, yb, z], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}

/** an iron balcony on the wall plane z: slab (w x depth x 0.18) at y with a railing 1.0 m high of the cut-out material `rail` on the three free sides; returns nothing */
export function balcony(P, M, o) {
  const w = o.w ?? 1.6, dp = o.depth ?? 0.8, y = o.y, x0 = o.x - w / 2, x1 = o.x + w / 2, z = o.z ?? 0, hr = o.h ?? 1.0, slab = o.slab || M.creamTrim, rail = o.rail || M.railing;
  P.box(slab, x0 - 0.05, x1 + 0.05, y - 0.18, y, z - 0.05, z + dp, 'k', 1);
  const rq = (a, b, c, d) => P.quad(rail, a, b, c, d, null, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  rq([x0, y, z + dp], [x1, y, z + dp], [x1, y + hr, z + dp], [x0, y + hr, z + dp]);
  rq([x0, y, z], [x0, y, z + dp], [x0, y + hr, z + dp], [x0, y + hr, z]);
  rq([x1, y, z + dp], [x1, y, z], [x1, y + hr, z], [x1, y + hr, z + dp]);
}

/** an iron roof railing 0.9 m high along the outer edges of a house (the cut-out `rail` material, one quad per ~1.6 m), standing on the roof edge y, `inset` m inside the wall line; skip(e) -> true omits an edge */
export function roofRail(h, y, o = {}) {
  const P = h.P, M = h.M, mat = o.mat || M.railing, ins = o.inset ?? 0.2, hr = o.h ?? 0.9, step = o.step ?? 1.6;
  for (const e of h.edges) {
    if (e.hole && !o.holes) continue;
    if (o.skip && o.skip(e)) continue;
    if (e.len < 0.8) continue;
    const n = Math.max(1, Math.round(e.len / step)), dx = (e.b[0] - e.a[0]) / n, dz = (e.b[1] - e.a[1]) / n;
    for (let k = 0; k < n; k++) {
      const a = [e.a[0] + dx * k - e.n[0] * ins, e.a[1] + dz * k - e.n[1] * ins], b = [a[0] + dx, a[1] + dz];
      P.quad(mat, [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + hr, b[1]], [a[0], y + hr, a[1]], null, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
  }
}

/** a mansard round every outer ring of the house: a sloped band from the cornice line (y0) to the inset ring (y1) and a flat deck; o: { holes: false } */
export function mansard(h, y0, y1, inset, mat, deckMat, o = {}) {
  const P = h.P;
  for (const p of h.polys) {
    const ring = []; for (let i = 0; i < p.o.length; i += 2) ring.push([p.o[i], p.o[i + 1]]);
    const inner = inflate(ring, -inset), c = centroidOf(ring);
    loft(P, mat, [ring3(ring, y0), ring3(inner, y1)], { ax: c });
    const holes = (o.holes === false ? [] : p.h.map((f) => { const r = []; for (let i = 0; i < f.length; i += 2) r.push([f[i], f[i + 1]]); return r; }));
    try { P.cap(deckMat, inner, y1, true, 4, holes); } catch (e) { /* degenerate inner ring */ }
  }
}
/** a small box dormer of a mansard: front plane at z, window w x h at y, hipped zinc roof, cheeks `depth` deep */
export function miniDormer(P, o) {
  const w = o.w ?? 1.2, hh = o.h ?? 1.4, d = o.depth ?? 1.0, z = o.z ?? 0, x0 = o.x - w / 2, x1 = o.x + w / 2, y0 = o.y0, y1 = y0 + hh;
  P.quad(o.glass, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  for (const [xx, s] of [[x0, -1], [x1, 1]]) P.quad(o.wall, [xx, y0, z], [xx, y0, z - d], [xx, y1, z - d], [xx, y1, z], [s, 0, 0]);
  P.fan(o.roof, [[x0 - 0.12, y1, z + 0.12], [x1 + 0.12, y1, z + 0.12], [x1 + 0.12, y1, z - d], [x0 - 0.12, y1, z - d]], [0, 1, 0]);
  P.fan(o.roof, [[x0 - 0.12, y1, z + 0.12], [x1 + 0.12, y1, z + 0.12], [o.x, y1 + 0.5, z - d * 0.3]], [0, 0.5, 1]);
}

/**
 * Instanced pinnacles (a square shaft with a pyramid cap): list = [{ u, z, y, kind }] in the frame F (kind 0 / 1 = cap material A / B); the shaft is w x w x shaftH, the cap capH high.
 * o: { w (0.55), shaftH (1.7), capH (1.5), shaft: material, capA, capB, name }.  Returns the triangle count (also added to K.extraTris).
 */
export function pinnacles(K, F, list, o) {
  const w = o.w ?? 0.55, sh = o.shaftH ?? 1.7, ch = o.capH ?? 1.5, make = (capMat) => partsGeos((Q) => {
    Q.box(o.shaft, -w / 2, w / 2, 0, sh, -w / 2, w / 2, 'b', 1);
    const cw = w * 0.62, y1 = sh + 0.12;
    Q.box(o.shaft, -w * 0.6, w * 0.6, sh, y1, -w * 0.6, w * 0.6, 'b', 1);
    const c = [[-cw, y1, -cw], [cw, y1, -cw], [cw, y1, cw], [-cw, y1, cw]], ap = [0, y1 + ch, 0];
    for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4], nx = (a[0] + b[0]) / 2, nz = (a[2] + b[2]) / 2; Q.fan(capMat, [[a[0], a[1], a[2]], [b[0], b[1], b[2]], ap], [nx, 0.5, nz]); }
  });
  let tris = 0;
  for (const kind of [0, 1]) {
    const mine = list.filter((p) => (p.kind || 0) === kind); if (!mine.length) continue;
    const parts = make(kind ? o.capB : o.capA);
    const ms = mine.map((p) => { const wp = F.W(p.u, p.z); return mat4(wp.x, p.y, wp.z, F.rot, p.s || 1); });
    tris += addInstanced(K.ctx, K.root, `${o.name || 'pinn'}${kind}`, parts, ms).tris;
  }
  K.extraTris = (K.extraTris || 0) + tris;
  return tris;
}
