// landmarksVladimir/stadium.js - the PETROVSKY stadium on its island (Петровский остров, 2; rebuilt 1957-61 by N. V. Baranov, O. I. Guryev and V. M. Fromzel; OSM stands r9073800, pitch
// r4588176, track r4587232) in world coordinates.  Dossier docs/research/vladimir.md section 6; photos refs/vladimir petr_01 / 13 (the bowl with its colonnade and the four masts from the
// Malaya Neva), petr_10 / 11 (pillars, gallery, yellow wall), petr_04_aerial / 05_aerial (blue seats, pitch, track).
//   The bowl is lofted between the OSM outer oval and the inner edge of the stands, both resampled by angle round the centre (96 bays): a two-level gallery of square pillars carrying a
//   flat cornice, the yellow wall with doors behind it, blue seat rows falling from 13.2 m to 1.6 m, the red track and the striped pitch.  Four white lattice floodlight masts (OSM nodes)
//   lean their lamp banks over the pitch; a scoreboard stands at the north end.  The stadium is closed (solid outer ring).  No flags on the rim (user rule).  ~7 k triangles.
import * as L from '../layout.js';
import { PITCHES } from '../data/city.js';
import { fillPolyFine } from './surfaces.js';

const TAU = Math.PI * 2, N = 96;
const MASTS = [[-3530.5, -2189.9], [-3656.5, -2279.1], [-3744.1, -2160.0], [-3617.5, -2067.5]];
const YW = 12.0, YR = 13.2, GAL = 3.4;

const ringOf = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
/** distance from c along the direction (dx, dz) to the ring (farthest crossing) */
function rayHit(c, dx, dz, ring) {
  let best = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], ex = b[0] - a[0], ez = b[1] - a[1], den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - c[0]) * ez - (a[1] - c[1]) * ex) / den, s = ((a[0] - c[0]) * dz - (a[1] - c[1]) * dx) / den;
    if (t > 0 && s >= -1e-6 && s <= 1 + 1e-6) best = Math.max(best, t);
  }
  return best;
}

export function build(K) {
  return;   // 2026-10-13 (islands round 2): the Petrovsky stadium is drawn by landmarksPetrovskyStadium (twin-leg towers, maroon soffit, one-storey colonnade, apron, small arena); its claim moved to that module's groups.js. Nothing is built here any more.
  // eslint-disable-next-line no-unreachable
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics;
  const rec = L.buildingById('r9073800'); if (!rec || !rec.polys[0] || !rec.polys[0].h.length) return;
  const outer = ringOf(rec.polys[0].o), inner = ringOf(rec.polys[0].h[0]);
  const c = inner.reduce((s, p) => [s[0] + p[0] / inner.length, s[1] + p[1] / inner.length], [0, 0]);
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksVladimir] stadium/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const dir = [], ro = [], ri = [];
  for (let k = 0; k < N; k++) { const t = k * TAU / N, d = [Math.sin(t), Math.cos(t)]; dir.push(d); ro.push(rayHit(c, d[0], d[1], outer)); ri.push(rayHit(c, d[0], d[1], inner)); }
  const pt = (k, r, y) => { const j = (k + N) % N; return [c[0] + dir[j][0] * r, y, c[1] + dir[j][1] * r]; };
  stage('bowl', () => {
    for (let k = 0; k < N; k++) {
      const j = (k + 1) % N, n = [dir[k][0] + dir[j][0], 0, dir[k][1] + dir[j][1]], ni = [-n[0], 0, -n[2]];
      const q = (mat, a, b, cc, d, nn, uv) => P.quad(mat, a, b, cc, d, nn, uv);
      const wo = (kk) => ro[(kk + N) % N] - GAL, U1 = [[0, 0], [1, 0], [1, 1], [0, 1]];
      // the yellow wall behind the gallery, the gallery floor with its edge beam, the cornice with the gallery roof
      q(M.stadWall, pt(k, wo(k), 0), pt(j, wo(j), 0), pt(j, wo(j), YW), pt(k, wo(k), YW), n, U1);
      q(M.concrete, pt(k, ro[k], 5.6), pt(j, ro[j], 5.6), pt(j, wo(j), 5.6), pt(k, wo(k), 5.6), [0, 1, 0]);
      q(M.underside, pt(k, ro[k], 5.2), pt(j, ro[j], 5.2), pt(j, wo(j), 5.2), pt(k, wo(k), 5.2), [0, -1, 0]);
      q(M.stadPillar, pt(k, ro[k], 5.2), pt(j, ro[j], 5.2), pt(j, ro[j], 5.75), pt(k, ro[k], 5.75), n);
      q(M.stadPillar, pt(k, ro[k] + 0.35, YW - 1.0), pt(j, ro[j] + 0.35, YW - 1.0), pt(j, ro[j] + 0.35, YW + 0.3), pt(k, ro[k] + 0.35, YW + 0.3), n);
      q(M.underside, pt(k, ro[k] + 0.35, YW - 1.0), pt(j, ro[j] + 0.35, YW - 1.0), pt(j, wo(j), YW - 1.0), pt(k, wo(k), YW - 1.0), [0, -1, 0]);
      q(M.concrete, pt(k, ro[k] + 0.35, YW + 0.3), pt(j, ro[j] + 0.35, YW + 0.3), pt(j, wo(j), YW + 0.3), pt(k, wo(k), YW + 0.3), [0, 1, 0]);
      // rim parapet (both faces), seat rows, the low wall at the foot of the stands
      q(M.stad, pt(k, wo(k), YW + 0.3), pt(j, wo(j), YW + 0.3), pt(j, wo(j), YR + 1.0), pt(k, wo(k), YR + 1.0), n);
      q(M.stad, pt(k, wo(k) - 0.3, YR), pt(j, wo(j) - 0.3, YR), pt(j, wo(j) - 0.3, YR + 1.0), pt(k, wo(k) - 0.3, YR + 1.0), ni);
      q(M.concrete, pt(k, wo(k), YR + 1.0), pt(j, wo(j), YR + 1.0), pt(j, wo(j) - 0.3, YR + 1.0), pt(k, wo(k) - 0.3, YR + 1.0), [0, 1, 0]);
      const arc = Math.hypot(pt(j, wo(j), 0)[0] - pt(k, wo(k), 0)[0], pt(j, wo(j), 0)[2] - pt(k, wo(k), 0)[2]), rows = Math.max(4, Math.round(Math.hypot(wo(k) - ri[k], YR - 1.6) / 0.8));
      q(M.seats, pt(k, ri[k], 1.6), pt(j, ri[j], 1.6), pt(j, wo(j) - 0.3, YR), pt(k, wo(k) - 0.3, YR), [-n[0] * 0.3, 1, -n[2] * 0.3], [[0, 0], [arc / 3, 0], [arc / 3, rows], [0, rows]]);
      q(M.stad, pt(k, ri[k], 0), pt(j, ri[j], 0), pt(j, ri[j], 1.6), pt(k, ri[k], 1.6), ni);
      // a square pillar on every bay line (two levels, the upper slimmer)
      const t = k * TAU / N;
      P.push(c[0] + dir[k][0] * (ro[k] - 0.45), 0, c[1] + dir[k][1] * (ro[k] - 0.45), t);
      P.box(M.stadPillar, -0.45, 0.45, 0, 5.2, -0.45, 0.45, 'bt'); P.box(M.stadPillar, -0.36, 0.36, 5.75, YW - 1.0, -0.36, 0.36, 'bt');
      P.pop();
    }
  });
  stage('field', () => {
    // the arena floor: red track everywhere inside the stands, the striped pitch on its OSM polygon
    fillPolyFine(P, M.track, inner.map((p) => [c[0] + (p[0] - c[0]) * 1.004, c[1] + (p[1] - c[1]) * 1.004]), 0.1, { tile: 9.76, maxEdge: 30 });
    const pitch = PITCHES.find((p) => p.id === 'r4588176');
    if (pitch) fillPolyFine(P, M.pitch, ringOf(pitch.polys[0].o), 0.15, { tile: 11, maxEdge: 30 });
  });
  stage('masts', () => { for (const [x, z] of MASTS) mast(P, M, x, z, c); });
  stage('scoreboard', () => {
    const k = Math.round(N * 0.5), p = pt(k, ro[k] - GAL - 2.5, 0), t = k * TAU / N + Math.PI;
    P.push(p[0], 0, p[2], t);
    P.col(M.mastSolid, 0, 0, YR, YR + 9, 0.5, 0.5, 8, false); P.box(M.screen, -6, 6, YR + 9, YR + 16, -0.6, 0.6, ''); P.box(M.mastSolid, -6.3, 6.3, YR + 8.7, YR + 9, -0.75, 0.75, '');
    P.pop();
  });
  stage('colliders', () => {
    for (let k = 0; k < N; k += 2) {
      const a = pt(k, ro[k], 0), b = pt(k + 2, ro[(k + 2) % N], 0), len = Math.hypot(b[0] - a[0], b[2] - a[2]);
      ph.addBox((a[0] + b[0]) / 2, (a[2] + b[2]) / 2, len + 0.4, 1.0, Math.atan2(-(b[2] - a[2]), b[0] - a[0]), 0, 14);
    }
    for (const [x, z] of MASTS) ph.addBox(x, z, 4, 4, 0, 0, 12);
  });
  K.svc.monuments.push({ id: 'r9073800', name: 'Стадион «Петровский»', x: c[0], z: c[1], h: 60 });
  if (errs.length) throw new Error(errs.join('\n'));
}

/** a lattice floodlight mast at (x, z) that leans toward the pitch centre c, with a tilted lamp bank */
function mast(P, M, x, z, c) {
  const H = 52, dx = c[0] - x, dz = c[1] - z, l = Math.hypot(dx, dz) || 1, rot = Math.atan2(dx / l, dz / l), lean = 7.0;
  P.push(x, 0, z, rot);                                                      // local +z = toward the pitch
  P.box(M.concrete, -2.2, 2.2, 0, 0.8, -2.2, 2.2, 'b');
  const w0 = 1.7, w1 = 1.0, nv = H / 2;
  const face = (a, b, n) => P.quad(M.mast, [a[0] * w0, 0.8, a[1] * w0], [b[0] * w0, 0.8, b[1] * w0], [b[0] * w1, H, b[1] * w1 + lean], [a[0] * w1, H, a[1] * w1 + lean], n, [[0, 0], [1, 0], [1, nv], [0, nv]]);
  face([-1, 1], [1, 1], [0, 0, 1]); face([1, -1], [-1, -1], [0, 0, -1]); face([1, 1], [1, -1], [1, 0, 0]); face([-1, -1], [-1, 1], [-1, 0, 0]);
  // solid corner chords (the alpha lattice fades with distance: the masts are seen from the Makarova embankment and the Tuchkov Bridge)
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.cyl(M.mastSolid, [sx * w0, 0.8, sz * w0], [sx * w1, H, sz * w1 + lean], 0.14, 0.11, 5, false);
  // the lamp bank: a frame 13 x 10 m tilted over the pitch
  const yb = H - 1, tilt = 0.42, hh = 10, ww = 6.5, zb = lean + 1.0, zt = zb + Math.sin(tilt) * hh, yt = yb + Math.cos(tilt) * hh;
  P.quad(M.lamps, [-ww, yb, zb], [ww, yb, zb], [ww, yt, zt], [-ww, yt, zt], [0, -0.4, 1], [[0, 0], [2, 0], [2, 2], [0, 2]]);
  P.box(M.mastSolid, -ww, ww, yb - 0.3, yb, zb - 0.3, zb + 0.3, ''); P.box(M.mastSolid, -0.25, 0.25, H - 4, yt - 2, lean - 0.3, lean + 0.3, 't');
  P.pop();
}
