// landmarksPetrovskyStadium/frame.js - the measured frame of the Petrovsky stadium (Петровский, 1924-25 / 1957-61, 20 985 seats, never roofed; OSM stands r9073800, pitch r4588176, track r4587232,
// stadium area r2270942) on the east tip of Petrovsky Island: the bowl rings, the stations (bays) round the outer colonnade, the constants of its section, the floodlight masts, the apron outline
// (a cut of the island relation r1576109) and the small-arena data.  Everything is derived from the baked OSM data (layout.buildingById / data PITCHES); only the apron outline is a copied cut
// (docs/reference/islands2-island-polys.json, vertices 300..343 of the Petrovsky ring).  Local frame: x east, z SOUTH, metres.
//   Section of the bowl, measured from the outer ring line INWARD (s, metres) and up (y), dossier docs/research/petrovsky-zhdanovka-2026.md section 10 + CRITIC LOG, photos s02 s04 s12 s01:
//     columns on s = 0.55 (one storey, shaft 0.35 .. 7.55 m, capital to 8.0), entablature y 8.0 .. 9.2 (maroon soffit y 8.0), gallery GAL = 4.6 m deep, back wall at s = GAL,
//     rim wall to y 10.5, stands from the track barrier (y 1.9) over a gangway (y 5.0) to y 9.8 at the rim.
import * as L from '../layout.js';
import { PITCHES } from '../data/city.js';
import { TIP, signedArea, offsetRing } from './geom.js';
export { TIP, signedArea, offsetRing };

export const GAL = 4.6;                                             // depth of the gallery (column plane to the back wall)
export const Y = { floor: 0.07, colBase: 0.35, colTop: 7.55, cap: 8.0, corn: 9.2, rim: 10.5, seatTop: 9.8, barrier: 1.9, gang: 5.0, riser: 5.9, track: 0.10, infield: 0.13, pitch: 0.16 };
export const BAY = 6.6;                                             // column spacing along the ring [E from s02: ~24 columns in ~160 m]
export const COL_S = 0.55;                                          // the column axis, metres inside the outer ring line
export const MASTS = [[-3530.49, -2189.92], [-3656.47, -2279.09], [-3744.06, -2159.99], [-3617.48, -2067.51]];       // n7617998960..63 (lighting towers)
export const MAST_H = 55;                                           // [E from s02 / s12: ~55 m]
export const ARENA_MASTS = [[-3849.71, -2333.48], [-3868.68, -2186.62], [-3786.05, -2240.49]];                       // n7617998956 / 58 / 59 (small arena, man_made=mast)
export const CHIMNEY = [-3705.06, -2380.24];                        // n7629436124

// ------------------------------------------------------------------------------------------------ small ring helpers
export const ringOf = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
export const centroid = (r) => r.reduce((s, p) => [s[0] + p[0] / r.length, s[1] + p[1] / r.length], [0, 0]);
/** first crossing of the ray p + t d (t > 0) with the closed ring, or 0 */
export function rayHit(p, dx, dz, ring) {
  let best = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], ex = b[0] - a[0], ez = b[1] - a[1], den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - p[0]) * ez - (a[1] - p[1]) * ex) / den, s = ((a[0] - p[0]) * dz - (a[1] - p[1]) * dx) / den;
    if (t > 1e-3 && s >= -1e-6 && s <= 1 + 1e-6 && t < best) best = t;
  }
  return best === Infinity ? 0 : best;
}
/** the ring resampled into n points of equal arc length, the first at the vertex nearest to `from` ([x,z]) */
export function resample(ring, n, from = null) {
  const m = ring.length, len = [0];
  for (let i = 0; i < m; i++) len.push(len[i] + Math.hypot(ring[(i + 1) % m][0] - ring[i][0], ring[(i + 1) % m][1] - ring[i][1]));
  const tot = len[m];
  let s0 = 0;
  if (from) { let bd = Infinity; ring.forEach((p, i) => { const d = Math.hypot(p[0] - from[0], p[1] - from[1]); if (d < bd) { bd = d; s0 = len[i]; } }); }
  const out = []; let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (s0 + tot * k / n) % tot;
    while (!(len[j] <= s && s <= len[j + 1])) j = (j + 1) % m;
    const t = (s - len[j]) / ((len[j + 1] - len[j]) || 1), a = ring[j], b = ring[(j + 1) % m];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return { pts: out, length: tot };
}
/** 1-2-1 smoothing of a closed ring, `it` passes */
export function smooth(ring, it = 1) {
  let r = ring;
  for (let k = 0; k < it; k++) { const n = r.length; r = r.map((p, i) => { const a = r[(i + n - 1) % n], b = r[(i + 1) % n]; return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4]; }); }
  return r;
}
// ------------------------------------------------------------------------------------------------ the bowl
let _bowl = null;
/**
 * The bowl: { c, outer, hole, N, st[] } where st[k] = { x, z (the outer ring line), nx, nz (unit INWARD normal), tx, tz (unit tangent), D (distance to the track barrier along the normal) }.
 * `at(k, s, y)` = [x, y, z] at s metres inward from the outer ring line of station k.  Stations are spaced by arc length (BAY m) round the smoothed OSM outer ring.
 */
export function bowl() {
  if (_bowl) return _bowl;
  const rec = L.buildingById('r9073800'); if (!rec || !rec.polys[0] || !rec.polys[0].h.length) return null;
  const outer0 = ringOf(rec.polys[0].o), hole0 = ringOf(rec.polys[0].h[0]);
  const c = centroid(hole0);
  const dense = resample(outer0, 720, null), outer = smooth(dense.pts, 3);                  // 0.8 m samples, the corners of the OSM outline rounded by ~1 m
  const N = Math.round(dense.length / BAY), rs = resample(outer, N, [c[0] - 200, c[1]]);   // start of the numbering at the west end
  const pts = rs.pts, sg = signedArea(outer) > 0 ? 1 : -1, st = [];
  for (let k = 0; k < N; k++) {
    const a = pts[(k + N - 1) % N], b = pts[(k + 1) % N], p = pts[k];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    let nx = -tz * sg, nz = tx * sg;                                                        // candidate normal; point it toward the centre
    if (nx * (c[0] - p[0]) + nz * (c[1] - p[1]) < 0) { nx = -nx; nz = -nz; }
    const D = rayHit(p, nx, nz, hole0) || 20;
    st.push({ x: p[0], z: p[1], nx, nz, tx, tz, D });
  }
  const Ds = smooth(st.map((q, k) => [q.D, k]), 2).map((p) => p[0]); st.forEach((q, k) => { q.D = Ds[k]; });
  const at = (k, s, y) => { const q = st[((k % N) + N) % N]; return [q.x + q.nx * s, y, q.z + q.nz * s]; };
  const s0 = st[0], dirSign = (-s0.tx * s0.nz + s0.tz * s0.nx) > 0 ? 1 : -1;       // +1: increasing k runs to the RIGHT of a viewer who stands outside and faces the wall (the atlas text reads left to right)
  _bowl = { c, outer, hole: hole0, N, st, at, perimeter: rs.length, dirSign };
  return _bowl;
}

// ------------------------------------------------------------------------------------------------ the pitch / track frame
/** the football pitch r4588176: { c, ux, uz (unit along the long side), vx, vz, len, wid, ring } */
export function pitchFrame() {
  const p = PITCHES.find((q) => q.id === 'r4588176'); if (!p) return null;
  const r = ringOf(p.polys[0].o), c = centroid(r);
  let best = 0, ux = 1, uz = 0;
  for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; ux = (b[0] - a[0]) / l; uz = (b[1] - a[1]) / l; } }
  let vx = -uz, vz = ux; let wid = 0;
  for (const q of r) { const w = Math.abs((q[0] - c[0]) * vx + (q[1] - c[1]) * vz); wid = Math.max(wid, w * 2); }
  return { c, ux, uz, vx, vz, len: best, wid, ring: r };
}
