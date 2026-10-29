// landmarksSeaTerminal/site.js - the former LENEXPO site as a FENCED BUILDING SITE (lead decision: no sight; dossier section 8): the hoarding along the OSM perimeter fences w133197188 (west / south side, 30 vertices, 866 m)
// and w60989199 (east side, from the gate at (-6425,319) down to (-6473,49)): galvanised ribbed sheets 2.0 m high on steel posts every 3 m with a few shortened ("flimsy") panels, a plain top rail, no logos, no text; the
// four gates (n14101067938 (-6479.2, 47.0) main, n10911911624 (-6485.4,-1.7), n10911911629 (-6452.3, 143.5), n5571531231 (-6425.1, 319.1)) are CLOSED double gates (steel frame, tall posts) and the main gate has the
// white guard booth.  The pavilions stay the generic city's.  Nobody walks inside: every run is solid.  Hoarding colour is a default [?] (no photograph of the 2022-25 fence).
import { fenceRun, barrierPts } from './fence.js';
import { LENEXPO_GATES } from './frame.js';

const RUNS = [
  ['w133197188', [-6578.6, 356.5, -6743, 264.6, -6745.7, 270, -6755.6, 264.9, -6752.6, 258.9, -6742.8, 232.3, -6746, 230.6, -6749.5, 229.4, -6753.8, 229.5, -6757.9, 230, -6728.1, 81.8, -6713, 84.8, -6700.5, 83.5, -6678.3, 76.7, -6664, 64.8, -6644.1, 47.3, -6634, 31.6, -6628.9, 21.8, -6625.1, 8.8, -6623.4, -2.1, -6622.4, -14.6, -6624.5, -31.6, -6524.8, -78.8, -6508, -86.6, -6505.2, -86.7, -6503.3, -84.5, -6501.4, -75, -6505.2, -64.7, -6478.4, 50.3, -6473.3, 49]],
  ['w60989199', null],
];

/** the stretch (-6624.5, -31.6) -> (-6524.8, -78.8) of w133197188 is the SE boundary of the D-2 museum plot: a clipped hedge (sub.js) stands there (Esri tile stw_sat_d2_19, photo d14), not a hoarding */
const D2_SEG = [[-6624.5, -31.6], [-6524.8, -78.8]];
function splitD2(pts) {
  const near = (i, p) => Math.hypot(pts[i] - p[0], pts[i + 1] - p[1]) < 8;
  for (let i = 0; i + 3 < pts.length; i += 2) if (near(i, D2_SEG[0]) && near(i + 2, D2_SEG[1])) return [pts.slice(0, i + 2), pts.slice(i + 2)];
  return [pts];
}

export function build(K) {
  const P = K.P, M = K.M;
  let pieces = 0;
  for (const [id, fb] of RUNS) {
    const pts = barrierPts(id) || fb;
    if (!pts) continue;
    for (const run of id === 'w133197188' ? splitD2(pts) : [pts]) if (run.length >= 4) pieces += fenceRun(K, run, { kind: 'hoard', id });
  }
  K.svc.hoarding = pieces;
  // the four closed gates: two leaves 3 m wide (a steel frame with galvanised sheet), taller posts and a top bar, drawn along the nearest fence segment
  const all = RUNS.flatMap(([id, fb]) => { const p = barrierPts(id) || fb; return p ? [p] : []; });
  for (const [gx, gz, kind] of LENEXPO_GATES) {
    let best = null;
    for (const pts of all) for (let i = 0; i + 3 < pts.length; i += 2) {
      const ax = pts[i], az = pts[i + 1], bx = pts[i + 2], bz = pts[i + 3], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((gx - ax) * dx + (gz - az) * dz) / l2)), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(px - gx, pz - gz);
      if (!best || d < best.d) best = { d, px, pz, ux: dx / Math.sqrt(l2), uz: dz / Math.sqrt(l2) };
    }
    if (!best || best.d > 14) continue;
    const half = kind === 'main' ? 4.0 : 3.0, rot = Math.atan2(-best.uz, best.ux);
    P.push(best.px, 0, best.pz, rot);
    try {
      P.box(M.hoardPost, -half - 0.15, -half + 0.15, 0, 2.6, -0.15, 0.15, 'b', 1); P.box(M.hoardPost, half - 0.15, half + 0.15, 0, 2.6, -0.15, 0.15, 'b', 1);
      P.box(M.hoardPost, -half, half, 2.45, 2.6, -0.06, 0.06, 'b', 1);
      for (const s of [-1, 1]) { P.box(M.hoardPost, s > 0 ? 0.03 : -half + 0.1, s > 0 ? half - 0.1 : -0.03, 0.1, 2.3, -0.07, 0.07, 'b', 1); P.box(M.hoard, s > 0 ? 0.08 : -half + 0.15, s > 0 ? half - 0.15 : -0.08, 0.25, 2.2, -0.04, 0.04, 'b', 2); }
      if (kind === 'main') {
        // the guard booth: 2.4 x 2.4 x 2.5 m, white with a grey roof and a window, beside the gate on the inside (the site side is the side of the hoarding's left-hand normal)
        P.box(M.booth, half + 1.2, half + 3.6, 0, 2.5, -2.8, -0.4, 'b', 1); P.box(M.boothRoof, half + 1.1, half + 3.7, 2.5, 2.65, -2.9, -0.3, 'b', 1);
        P.box(M.glassDark, half + 1.6, half + 3.2, 1.2, 2.1, -0.43, -0.4, 'b', 1);
      }
    } finally { P.pop(); }
  }
}
