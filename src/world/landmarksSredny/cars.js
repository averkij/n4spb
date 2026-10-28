// landmarksSredny/cars.js - the static tram cars of the depot museum and the Brush monument (dossier docs/research/sredny.md section 3.4 / 3.5, photos refs/sredny 18 19 21 22 23 25 61 69 70 71 79):
// ONE parametric car body (a chamfered plan prism: underframe, lower panels, a window band with pillars and glass, a roof with an optional clerestory, end windows, headlamps, bogie boxes / wheels),
// used for the modern working cars (red + grey bands), LM-47 (red + cream), LM-33 (burgundy + cream), MS-1 (wooden, red + cream), the tourist car T1 (red, cream roof) and the Brush monument car "1031"
// (burgundy + cream, black roof, a clerestory with ten small windows, two open end platforms, two blue signal lamps).  No pennants, no flags, pantograph / trolley down.  Car frame: x along the car, z across, y up (wheels on y = 0).
// carOn(P, ...) places a car on a track polyline by two bogie points (the body follows the chord, so a car on the curved yard fan stays on its rails).
import * as THREE from 'three';
import { TRAMWAYS } from '../data/city.js';

/** the z range of a box on the side s (+1 / -1) between the offsets a < b from the centre line, in the order P.box wants (z0 < z1) */
const zr = (s, a, b) => (s > 0 ? [a, b] : [-b, -a]);
/** plan polygon of a car: length L, width W, chamfered corners c */
const plan = (L, W, c) => [[-L / 2 + c, -W / 2], [L / 2 - c, -W / 2], [L / 2, -W / 2 + c], [L / 2, W / 2 - c], [L / 2 - c, W / 2], [-L / 2 + c, W / 2], [-L / 2, W / 2 - c], [-L / 2, -W / 2 + c]];
/** the side walls of a prism over a plan polygon (CCW seen from above), y0..y1 */
function prismSides(P, mat, pts, y0, y1) {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], nx = (b[1] - a[1]), nz = -(b[0] - a[0]);
    P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
}
const inset = (pts, d) => { let cx = 0, cz = 0; for (const p of pts) { cx += p[0]; cz += p[1]; } cx /= pts.length; cz /= pts.length; return pts.map((p) => { const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1; return [p[0] - dx / l * d, p[1] - dz / l * d]; }); };

/**
 * o: { L, W = 2.4, ride = 0.62, belt = 1.1, top = 2.35 (the top of the window band), lower, upper (materials), glass, roof, pillars = n, chamfer = 0.4, clerestory = bool, platforms = bool, wheels = bool,
 *      stripe (material of a thin band above the lower panels), number: material (a gold number decal given as a `numQuad(P, x, y, side)` callback), cab: bool }
 */
export function carBody(P, M, o) {
  const L = o.L, W = o.W || 2.4, y0 = o.ride ?? 0.62, belt = o.belt ?? 1.1, top = o.top ?? 2.35, ch = o.chamfer ?? 0.4;
  const pl = plan(L, W, ch), t0 = P.tris;
  // underframe and bogies
  P.box(M.tramBlack, -L / 2 + 0.3, L / 2 - 0.3, y0 - 0.2, y0, -W / 2 + 0.25, W / 2 - 0.25, 'b', 1);
  const bx = L * 0.3;
  for (const x of [-bx, bx]) {
    if (o.wheels) for (const s of [-1, 1]) for (const d of [-0.8, 0.8]) P.cyl(M.tramBlack, [x + d, 0.34, s * (W / 2 - 0.45)], [x + d, 0.34, s * (W / 2 - 0.3)], 0.34, 0.34, 12, true);
    else P.box(M.tramBlack, x - 1.2, x + 1.2, 0.12, y0 - 0.2, -W / 2 + 0.5, W / 2 - 0.5, 'b', 1);
  }
  // lower panels
  prismSides(P, o.lower, pl, y0, belt);
  P.cap(o.lower, pl, y0, false, 4);
  if (o.stripe) prismSides(P, o.stripe, inset(pl, -0.01), belt - 0.12, belt + 0.02);
  // window band: pillars + glass between them on the two long sides and the end windows
  const hw = W / 2 + 0.005, np = o.pillars ?? Math.max(4, Math.round((L - 2 * ch) / 1.5)), x0 = -L / 2 + ch + 0.2, x1 = L / 2 - ch - 0.2, ph = (x1 - x0) / np;
  for (const s of [-1, 1]) {
    P.quad(o.glass, [x0, belt, s * hw], [x1, belt, s * hw], [x1, top, s * hw], [x0, top, s * hw], [0, 0, s]);
    const pwid = o.pillarW ?? 0.06;
    for (let i = 0; i <= np; i++) { const x = x0 + i * ph; P.box(o.upper, x - pwid, x + pwid, belt, top, ...zr(s, W / 2 - 0.05, W / 2 + 0.03), '', 1); }
    P.box(o.upper, x0, x1, belt, belt + 0.1, ...zr(s, W / 2 - 0.05, W / 2 + 0.03), '', 1); P.box(o.upper, x0, x1, top - 0.1, top, ...zr(s, W / 2 - 0.05, W / 2 + 0.03), '', 1);
  }
  // door groups (two-leaf doors, a pillar frame, a glass pane) on both long sides, and the roof equipment of the modern cars
  for (const x of (o.doors || [])) for (const s of [-1, 1]) {
    P.box(o.doorMat || o.lower, x - 0.62, x + 0.62, belt - 0.15, top, ...zr(s, W / 2 - 0.02, W / 2 + 0.07), '', 1);
    for (const dx of [-0.31, 0.31]) P.quad(o.glass, [x + dx - 0.24, belt + 0.35, s * (W / 2 + 0.075)], [x + dx + 0.24, belt + 0.35, s * (W / 2 + 0.075)], [x + dx + 0.24, top - 0.15, s * (W / 2 + 0.075)], [x + dx - 0.24, top - 0.15, s * (W / 2 + 0.075)], [0, 0, s]);
    P.box(M.tramBlack, x - 0.02, x + 0.02, belt - 0.1, top, ...zr(s, W / 2 + 0.05, W / 2 + 0.085), '', 1);
  }
  // the chamfered end and corner walls of the band (upper material) with a windscreen
  const ends = pl.slice(1, 4).concat(pl.slice(5, 8));
  void ends;
  for (const s of [-1, 1]) {
    const xe = s * L / 2;
    P.quad(o.upper, [xe, belt, -W / 2 + ch], [xe, belt, W / 2 - ch], [xe, top, W / 2 - ch], [xe, top, -W / 2 + ch], [s, 0, 0]);
    P.quad(o.glass, [xe + s * 0.01, belt + 0.1, -W / 2 + ch + 0.15], [xe + s * 0.01, belt + 0.1, W / 2 - ch - 0.15], [xe + s * 0.01, top - 0.15, W / 2 - ch - 0.15], [xe + s * 0.01, top - 0.15, -W / 2 + ch + 0.15], [s, 0, 0]);
    for (const t of [-1, 1]) P.quad(o.upper, [s * (L / 2 - ch), belt, t * W / 2], [xe, belt, t * (W / 2 - ch)], [xe, top, t * (W / 2 - ch)], [s * (L / 2 - ch), top, t * W / 2], [s * 0.7, 0, t * 0.7]);
    // a round headlamp on the end, a small destination box above
    P.cyl(M.gold, [xe, 1.15, 0], [xe + s * 0.08, 1.15, 0], 0.15, 0.13, 10, true);
  }
  // roof: slab (a hint of curvature: two stacked slabs), clerestory
  const rp = inset(pl, 0.06);
  prismSides(P, o.roof, rp, top, top + 0.14); P.cap(o.roof, rp, top + 0.14, true, 4);
  if (o.roofBox) P.box(o.roofBox, -L * 0.18, L * 0.18, top + 0.14, top + 0.42, -W * 0.28, W * 0.28, 'b', 1);
  if (o.clerestory) {
    const cx0 = -L / 2 + ch + 1.2, cx1 = L / 2 - ch - 1.2, cw = W * 0.28;
    P.box(o.roof, cx0, cx1, top + 0.14, top + 0.62, -cw, cw, 'b', 2);
    for (const s of [-1, 1]) { const n = 10, dx = (cx1 - cx0) / n; for (let i = 0; i < n; i++) P.quad(o.glass, [cx0 + (i + 0.15) * dx, top + 0.22, s * (cw + 0.01)], [cx0 + (i + 0.85) * dx, top + 0.22, s * (cw + 0.01)], [cx0 + (i + 0.85) * dx, top + 0.54, s * (cw + 0.01)], [cx0 + (i + 0.15) * dx, top + 0.54, s * (cw + 0.01)], [0, 0, s]); }
    P.box(o.roof, cx0 - 0.04, cx1 + 0.04, top + 0.62, top + 0.7, -cw - 0.05, cw + 0.05, 'b', 2);
  }
  if (o.platforms) {
    // open end platforms: handrails of two black rods on each side of the step
    for (const s of [-1, 1]) for (const t of [-1, 1]) { P.cyl(M.tramBlack, [s * (L / 2 + 0.02), belt, t * (W / 2 - 0.3)], [s * (L / 2 + 0.02), belt + 0.9, t * (W / 2 - 0.3)], 0.025, 0.025, 5, false); }
  }
  if (o.number) o.number(P);
  return P.tris - t0;
}

/** the polyline of the TRAMWAYS way `id` as world points [[x, z]..] (or null) */
export function wayPts(id) {
  const w = TRAMWAYS.find((q) => q.id === id); if (!w) return null;
  const p = w.pts, r = []; for (let i = 0; i < p.length; i += 2) r.push([p[i], p[i + 1]]); return r;
}
/** the point of the polyline `pts` at arc length s from its start (clamped) */
export function pointAt(pts, s) {
  let acc = 0;
  for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); if (s <= acc + l || i === pts.length - 2) { const t = Math.max(0, Math.min(1, (s - acc) / (l || 1))); return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]; } acc += l; }
  return pts[pts.length - 1];
}
/** a car (built by `build(P)` in its frame) on a way: the body centre at arc length s, the bogie points `bogie` m apart; returns { x, z, rotY } */
export function carOn(P, pts, s, bogie, build) {
  const a = pointAt(pts, s - bogie / 2), b = pointAt(pts, s + bogie / 2), cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2, rotY = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
  P.push(cx, 0, cz, rotY); try { build(P); } finally { P.pop(); }
  return { x: cx, z: cz, rotY };
}
void THREE;
