// landmarksYelaginRossi/ironwork.js - the cast-iron railing of the east spit (Rossi's sketch: square posts with a ball finial, a round top rail, panels of a hexagon lattice over a chain of rings; photos
// rossi 07, 08, 12) as Parts geometry, plus the arch helpers shared by the pavilions (an arch outline, a moulded frame, a glazed arched window / door).
// railing(): posts every <= postEvery m (and at every corner) + one alpha-cut panel quad per span (M.ironLattice, 2.4 m x 1.0 m texture) + a top rail; returns the post list and the spans for colliders.
import { revolved } from './orders.js';

const BALL = [[0, 0], [0.04, 0.005], [0.07, 0.03], [0.085, 0.07], [0.07, 0.115], [0.04, 0.14], [0, 0.15]];
const ballProfile = (R) => BALL.map(([r, y]) => [r * R / 0.085, y * R / 0.085]);

/** a railing along the plan polyline pts [[x, z]..] (closed = ring) standing on y0, total height h; returns { posts: [[x, z]..], spans: [[x0, z0, x1, z1]..] } */
export function railing(P, M, pts, o = {}) {
  const h = o.h ?? 0.95, y0 = o.y0 ?? 0, every = o.every ?? 2.3, closed = !!o.closed, postW = o.postW ?? 0.1, panelLow = 0.06, finial = o.finial !== false;
  const n = pts.length, m = closed ? n : n - 1, posts = [], spans = [];
  const keep = [0]; let acc = 0;
  for (let i = 1; i <= m; i++) {
    const a = pts[i - 1], b = pts[i % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += seg;
    const pa = pts[(i - 2 + n) % n], bend = i >= 2 || closed ? (() => { const x1 = a[0] - pa[0], z1 = a[1] - pa[1], x2 = b[0] - a[0], z2 = b[1] - a[1], l = Math.hypot(x1, z1) * Math.hypot(x2, z2) || 1; return (x1 * x2 + z1 * z2) / l; })() : 1;
    if (i === m || acc >= every - 0.2 || (bend < 0.9 && acc > 0.6)) { keep.push(i); acc = 0; }
  }
  const P2 = keep.map((i) => pts[i % n]);
  const post = (x, z) => { P.box(M.iron, x - postW / 2, x + postW / 2, y0, y0 + h, z - postW / 2, z + postW / 2, 'b', 1); if (finial) P.geo(M.iron, revolved('ball|' + h, ballProfile(0.085), 8, 1), x, y0 + h, z); posts.push([x, z]); };
  for (const p of P2) post(p[0], p[1]);
  for (let i = 0; i + 1 < P2.length; i++) {
    const a = P2[i], b = P2[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.2) continue;
    const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len, nx = -dz, nz = dx;
    const ya = y0 + panelLow, yb = y0 + h - 0.05, u1 = Math.max(0.3, len / 2.4);
    P.quad(M.ironLattice, [a[0] + dx * postW / 2, ya, a[1] + dz * postW / 2], [b[0] - dx * postW / 2, ya, b[1] - dz * postW / 2], [b[0] - dx * postW / 2, yb, b[1] - dz * postW / 2], [a[0] + dx * postW / 2, yb, a[1] + dz * postW / 2], [nx, 0, nz], [[0, 0], [u1, 0], [u1, 1], [0, 1]]);
    P.beam(M.iron, [[a[0], y0 + h - 0.03, a[1]], [b[0], y0 + h - 0.03, b[1]]], 0.05, 0.05, [nx, 0, nz], 1);
    P.beam(M.iron, [[a[0], y0 + 0.04, a[1]], [b[0], y0 + 0.04, b[1]]], 0.05, 0.06, [nx, 0, nz], 1);
    spans.push([a[0], a[1], b[0], b[1]]);
  }
  return { posts, spans };
}

/** an arch outline in a plane (s across, y up): jamb up, round head, jamb down; n segments in the head */
export const archOutline = (hw, hs, n = 8) => { const o = [[-hw, 0], [-hw, hs]]; for (let i = 1; i < n; i++) { const a = Math.PI - Math.PI * i / n; o.push([Math.cos(a) * hw, hs + Math.sin(a) * hw]); } o.push([hw, hs], [hw, 0]); return o; };

/** the outline of an arch grown outward by g (jambs sideways, the head radially): same number of points as archOutline */
export function growOutline(out, hs, g) {
  return out.map(([s, y], i) => { if (i <= 1) return [s - g, y]; if (i >= out.length - 2) return [s + g, y]; const a = Math.atan2(y - hs, s), l = Math.hypot(s, y - hs); return [Math.cos(a) * (l + g), hs + Math.sin(a) * (l + g)]; });
}

/** a moulded frame (quad strip) round an arch outline in the plane z = z0 of the current frame, from height y0 */
export function archFrame(P, mat, hw, hs, g, z0, y0 = 0, n = 8) {
  const a = archOutline(hw, hs, n), b = growOutline(a, hs, g);
  for (let i = 0; i + 1 < a.length; i++) P.quad(mat, [a[i][0], y0 + a[i][1], z0], [a[i + 1][0], y0 + a[i + 1][1], z0], [b[i + 1][0], y0 + b[i + 1][1], z0], [b[i][0], y0 + b[i][1], z0], [0, 0, 1]);
}

/** an arched window (glazed, white frame and muntins) or door in the wall plane z = 0 of the current frame facing +z; x centre 0, from y0; w wide, hs straight height */
export function archOpening(P, M, w, hs, o = {}) {
  const hw = w / 2, y0 = o.y0 ?? 0, door = !!o.door, n = 8;
  const poly = archOutline(hw, hs, n).map(([s, y]) => [s, y0 + y, 0.012]);
  P.fan(door ? M.white : M.glass, poly, [0, 0, 1], (p) => [p[0], p[1]]);
  archFrame(P, M.white, hw, hs, 0.09, 0.03, y0, n);
  if (door) archFrame(P, M.dark, hw - 0.01, hs, -0.05, 0.016, y0, n);                      // the dark reveal round the door leaf
  P.ranged(120, () => {
    const t = 0.035;
    P.box(M.white, -t / 2, t / 2, y0, y0 + hs + hw, 0.012, 0.045, 'bk', 1);                                          // the centre bar / the leaf joint
    if (!door) {
      for (let y = 0.55; y < hs - 0.1; y += 0.55) P.box(M.white, -hw, hw, y0 + y, y0 + y + t, 0.012, 0.04, 'bk', 1);
      for (let i = 1; i < 4; i++) { const a = Math.PI * i / 4; P.cyl(M.white, [0, y0 + hs, 0.03], [Math.cos(a) * hw, y0 + hs + Math.sin(a) * hw, 0.03], 0.016, 0.016, 4, false); }
    } else {
      P.box(M.white, -hw + 0.18, -0.06, y0 + 0.35, y0 + hs - 0.2, 0.012, 0.04, 'bk', 1); P.box(M.white, 0.06, hw - 0.18, y0 + 0.35, y0 + hs - 0.2, 0.012, 0.04, 'bk', 1);
    }
  });
}
