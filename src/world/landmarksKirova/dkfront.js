// landmarksKirova/dkfront.js - the FRONT ELEVATION of the Kirov Palace (docs/research/kirova.md section 5; photos refs/kirova dk15 dk14 dk01 dk37 dk27): drawn in the pushed frame FD (x = r, z = -q).
//   podium(...)       one 9.2 m podium of two public floors: 6 m modules (a 4 m glass group between half piers) under a projecting cornice
//   block(...)        the upper block: clear bays (three window rows, two recessed spandrel panels), pilasters 0.5 m (the end ones double), the three-step entablature, the attic; set back 2.5 m
//   pavilion(...)     the 25.5 m niche pavilion: dark rough base with shop windows, plain margins 3.4 m, four recessed niches 8.7 x 3.6 m with moulded frames, the 0.8 m cornice
//   westBlock()       V1: three tall recessed panels, two red-brown doors, the cornice at 14.4
//   gallery() / white() / endBlock()   the east part: the 1968 low gallery, the white pavilion (three bays, a dark canopy), the corner of the end block
import { FRONT as F, DKH as H, PORTAL_C } from './frame.js';
import { windowWall } from './facade.js';
import { dkOp, dkWindowed } from './dkwin.js';

const wallQ = (P, mat, r0, r1, y0, y1, q, tu = 4, tv = 4) => { if (r1 - r0 < 0.01 || y1 - y0 < 0.01) return; P.quad(mat, [r0, y0, -q], [r1, y0, -q], [r1, y1, -q], [r0, y1, -q], [0, 0, 1], [[r0 / tu, y0 / tv], [r1 / tu, y0 / tv], [r1 / tu, y1 / tv], [r0 / tu, y1 / tv]]); };

/** the podium of a wing / centre block between r0 and r1 at front plane q: ground floor = glass groups (4 m, five panes) between 2 m piers, spandrel band, second floor = ribbon groups (4 m, four panes), podium cornice.
 *  o.portal = [ra, rb] leaves the ground-floor groups out where the portal stands in front (the second-floor groups stay: the portal cornice hides their lower part) */
function podium(K, r0, r1, q, o = {}) {
  const { P, M } = K, n = Math.max(1, Math.round((r1 - r0) / 6)), p = (r1 - r0) / n, ops = [];
  for (let i = 0; i < n; i++) {
    const c = r0 + p * (i + 0.5), hid = o.portal && c + 2.2 > o.portal[0] && c - 2.2 < o.portal[1];
    if (!hid) ops.push(dkOp(M, c, Math.min(4.0, p - 1.2), 0.55, 3.8, 5, [0.78], i % 3 === 1 ? M.dkGlassC : M.dkGlassA, { lintel: true }));
    ops.push(dkOp(M, c, Math.min(4.0, p - 1.2), 6.2, 7.95, 4, [], i % 2 ? M.dkGlassC : M.dkGlassA));
  }
  dkWindowed(K, { x0: r0, x1: r1, ya: 0, yb: H.podium, z: -q, tu: 4, tv: 4, wall: M.wall, base: M.rough, baseTop: 0.45, ops });
  P.box(M.cornice, r0 - 0.1, r1 + 0.1, 8.7, 9.2, -q, -q + 0.5, 'k', 2);                          // the projecting podium cornice (lip 0.5 m)
  P.box(M.cornice, r0 - 0.1, r1 + 0.1, 5.75, 5.95, -q, -q + 0.25, 'k', 2);                        // the belt lip at 5.9
}

/** the upper block (y 9.2 .. 22.2) of n bays between r0 and r1; its front plane is q: three rows of windows with real reveals, recessed spandrel panels under the lower two, pilasters, the entablature */
function block(K, r0, r1, q, n) {
  const { P, M } = K, p = (r1 - r0) / n, y0 = H.upper0, y1 = H.wing, ops = [];
  for (let i = 0; i < n; i++) {
    const a = r0 + i * p + (i === 0 ? 1.0 : 0.25), b = r0 + (i + 1) * p - (i === n - 1 ? 1.0 : 0.25), c = (a + b) / 2;
    [[10.3, 12.05], [13.7, 15.45], [17.1, 18.85]].forEach(([ya, yb], k) => ops.push(dkOp(M, c, Math.min(1.25, b - a - 0.5), ya, yb, 2, [0.7], (i + k) % 4 === 1 ? M.dkGlassC : M.dkGlassA, { sill: true })));
    for (const [pa, pb] of [[12.7, 13.6], [16.1, 17.0]]) {                                         // recessed spandrel panels 0.9 x 0.9 with a 0.12 m frame
      P.box(M.band, c - 0.57, c + 0.57, pa - 0.06, pb + 0.06, -q, -q + 0.03, 'k', 2); P.quad(M.nicheBack, [c - 0.45, pa, -q + 0.012], [c + 0.45, pa, -q + 0.012], [c + 0.45, pb, -q + 0.012], [c - 0.45, pb, -q + 0.012], [0, 0, 1]);
    }
  }
  dkWindowed(K, { x0: r0, x1: r1, ya: y0, yb: y1, z: -q, tu: 4, tv: 4, wall: M.wall, ops, depth: 0.25 });
  for (let i = 0; i <= n; i++) {
    const c = r0 + i * p, a = i === 0 ? r0 : i === n ? r1 - 1.0 : c - 0.25, b = i === 0 ? r0 + 1.0 : i === n ? r1 : c + 0.25;
    P.box(M.pilaster, a, b, y0, H.ent0, -q, -q + 0.18, 'k', 2);
  }
  const ent = [[19.1, 19.45, 0.1], [19.45, 19.8, 0.2], [19.8, 20.2, 0.35]];                         // three stepped mouldings
  for (const [ya, yb, pr] of ent) P.box(M.cornice, r0, r1, ya, yb, -q, -q + pr, 'k', 2);
  P.box(M.coping, r0 - 0.05, r1 + 0.05, y1, y1 + 0.08, -q - 0.3, -q + 0.1, 'b', 1);               // the coping over the attic
  P.box(M.wall, r0, r1, y1, y1 + 0.5, -q - 0.3, -q, 'b', 4);                                       // a low parapet over the attic
  P.box(M.coping, r0 - 0.05, r1 + 0.05, y1 + 0.5, y1 + 0.57, -q - 0.35, -q + 0.05, 'b', 1);
}

/** one pavilion between r0 and r1 whose front plane is q (flush with the podium) */
function pavilion(K, r0, r1, q) {
  const { P, M } = K, c = (r0 + r1) / 2, w = 8.7, a = c - w / 2, b = c + w / 2, n = Math.max(1, Math.round((r1 - r0) / 6)), mw = (r1 - r0) / n;
  P.quad(M.podiumRough, [r0, 0, -q], [r1, 0, -q], [r1, 4.9, -q], [r0, 4.9, -q], [0, 0, 1], [[0, 0], [n, 0], [n, 4.9 / 9.2], [0, 4.9 / 9.2]]);
  void mw;
  wallQ(P, M.wall, r0, r1, 4.9, 5.8, q); wallQ(P, M.wall, r0, a, 5.8, 23.2, q); wallQ(P, M.wall, b, r1, 5.8, 23.2, q); wallQ(P, M.wall, r0, r1, 23.2, H.pavilion, q);
  const ys = [[5.8, 9.4], [10.4, 14.0], [15.0, 18.6], [19.6, 23.2]];
  for (let k = 0; k < ys.length; k++) {
    const [y0, y1] = ys[k], rec = 0.3;
    if (k < 3) wallQ(P, M.wall, a, b, y1, ys[k + 1][0], q);                                          // the ledge between two niches
    P.quad(M.nicheBack, [a, y0, -(q + rec)], [b, y0, -(q + rec)], [b, y1, -(q + rec)], [a, y1, -(q + rec)], [0, 0, 1]);
    P.quad(M.wallShade, [a, y0, -q], [a, y0, -(q + rec)], [a, y1, -(q + rec)], [a, y1, -q], [1, 0, 0]);
    P.quad(M.wallShade, [b, y0, -(q + rec)], [b, y0, -q], [b, y1, -q], [b, y1, -(q + rec)], [-1, 0, 0]);
    P.quad(M.wallShade, [a, y1, -(q + rec)], [b, y1, -(q + rec)], [b, y1, -q], [a, y1, -q], [0, -1, 0]);
    P.quad(M.wallShade, [a, y0, -q], [b, y0, -q], [b, y0, -(q + rec)], [a, y0, -(q + rec)], [0, 1, 0]);
    // moulded frame 0.35 m wide, 7 cm proud
    P.box(M.band, a - 0.35, b + 0.35, y1, y1 + 0.35, -q, -q + 0.07, 'k', 2); P.box(M.band, a - 0.35, b + 0.35, y0 - 0.35, y0, -q, -q + 0.07, 'k', 2);
    P.box(M.band, a - 0.35, a, y0, y1, -q, -q + 0.07, 'k', 2); P.box(M.band, b, b + 0.35, y0, y1, -q, -q + 0.07, 'k', 2);
  }
  P.box(M.cornice, r0 - 0.1, r1 + 0.1, 24.7, H.pavilion, -q, -q + 0.4, 'k', 2);                    // the 0.8 m cornice
  P.box(M.cornice, r0 - 0.05, r1 + 0.05, 4.8, 4.95, -q, -q + 0.12, 'k', 2);                        // the line over the rough base
}

/** V1: the west end block with three tall recessed panels (centres r -67.1 / -62.4 / -57.8), two red-brown doors, the cornice at 14.4 */
function westBlock(K) {
  const { P, M } = K, r0 = F.v1[0], r1 = F.v1[1], q = F.line, cs = [-67.1, -62.4, -57.8], hw = 1.7, rec = 0.12;
  wallQ(P, M.wall, r0, r1, 0, 3.0, q); wallQ(P, M.wall, r0, r1, 12.6, H.v1, q);
  const edges = [r0, ...cs.flatMap((c) => [c - hw, c + hw]), r1];
  for (let i = 0; i < edges.length; i += 2) wallQ(P, M.wall, edges[i], edges[i + 1], 3.0, 12.6, q);
  for (const c of cs) {
    const a = c - hw, b = c + hw, y0 = 3.0, y1 = 12.6;
    P.quad(M.nicheBack, [a, y0, -(q + rec)], [b, y0, -(q + rec)], [b, y1, -(q + rec)], [a, y1, -(q + rec)], [0, 0, 1]);
    P.quad(M.wallShade, [a, y0, -q], [a, y0, -(q + rec)], [a, y1, -(q + rec)], [a, y1, -q], [1, 0, 0]);
    P.quad(M.wallShade, [b, y0, -(q + rec)], [b, y0, -q], [b, y1, -q], [b, y1, -(q + rec)], [-1, 0, 0]);
    P.quad(M.wallShade, [a, y1, -(q + rec)], [b, y1, -(q + rec)], [b, y1, -q], [a, y1, -q], [0, -1, 0]);
    P.box(M.band, a - 0.3, b + 0.3, y1, y1 + 0.3, -q, -q + 0.06, 'k', 2); P.box(M.band, a - 0.3, b + 0.3, y0 - 0.3, y0, -q, -q + 0.06, 'k', 2);
    P.box(M.band, a - 0.3, a, y0, y1, -q, -q + 0.06, 'k', 2); P.box(M.band, b, b + 0.3, y0, y1, -q, -q + 0.06, 'k', 2);
  }
  for (const d of [-63.7, -60.5]) P.box(M.doorRed, d - 0.55, d + 0.55, 0, 2.6, -q, -q + 0.05, 'k', 1);
  P.box(M.cornice, r0 - 0.05, r1 + 0.05, 13.75, 14.1, -q, -q + 0.3, 'k', 2); P.box(M.cornice, r0 - 0.1, r1 + 0.1, 14.1, H.v1, -q, -q + 0.45, 'k', 2);
  P.box(M.coping, r0 - 0.12, r1 + 0.12, H.v1, H.v1 + 0.08, -q - 0.3, -q + 0.5, 'b', 1);
}

/** the 1968 low gallery r 56.4 .. 103.5, front q -35.5: 17 modules of 2.77 m: showcase windows (2.2 m, curtains on some) between 0.55 m piers, a slab band, then the second-floor ribbon (large windows, dark frames) */
function gallery(K) {
  const { P, M } = K, r0 = F.gallery[0], r1 = F.gallery[1], q = F.galleryQ, n = Math.round((r1 - r0) / 2.75), p = (r1 - r0) / n, ops = [];
  for (let i = 0; i < n; i++) {
    const c = r0 + p * (i + 0.5);
    ops.push(dkOp(M, c, p - 0.62, 0.4, 4.3, 2, [0.8], i % 3 === 2 ? M.dkGlassC : M.dkGlassA, { sill: false }));
    ops.push(dkOp(M, c, p - 0.1, 5.55, 8.5, 2, [0.72], i % 5 === 3 ? M.dkGlassC : M.dkGlassA, { sill: false }));
  }
  dkWindowed(K, { x0: r0, x1: r1, ya: 0, yb: H.gallery, z: -q, tu: 4, tv: 4, wall: M.pale, ops, depth: 0.2 });
  P.box(M.pale, r0 - 0.05, r1 + 0.05, 8.8, 9.35, -q, -q + 0.3, 'k', 2);                             // the roof slab edge
  P.box(M.pale, r0 - 0.05, r1 + 0.05, 4.35, 4.5, -q, -q + 0.12, 'k', 2);
}

/** the wall of the strip behind the gallery roof (y 9.2 .. 17.5, front q -29.5): ONE ribbon of low windows (groups of four panes, pitch 3.9 m) */
function strip(K) {
  const { M } = K, r0 = F.gallery[0], r1 = 99.7 + 3.8, ops = [], n = Math.round((r1 - r0) / 3.9), p = (r1 - r0) / n;
  for (let i = 0; i < n; i++) ops.push(dkOp(M, r0 + p * (i + 0.5), p - 0.5, 12.5, 13.9, 4, [], i % 4 === 1 ? M.dkGlassC : M.dkGlassA));
  dkWindowed(K, { x0: r0, x1: r1, ya: 9.2, yb: H.strip, z: 29.5, tu: 4, tv: 4, wall: M.wall, ops, depth: 0.2 });
}

/** the front of the east end block (r 103.5 .. 129, q -35.6): pale pink stone with two ribbons of windows above the white pavilion, a lower row beside the corner entrance */
function endFront(K) {
  const { M } = K, r0 = 103.5, r1 = 129.0, ops = [];
  for (const [ya, yb] of [[7.4, 9.0], [11.2, 12.8], [14.6, 16.2]]) for (let i = 0; i < 6; i++) ops.push(dkOp(M, r0 + 2.2 + i * 4.1, 3.0, ya, yb, 3, [], (i + ya) % 3 === 0 ? M.dkGlassC : M.dkGlassA));
  for (const c of [124.2]) ops.push(dkOp(M, c, 2.4, 1.0, 3.2, 2, [0.7], M.dkGlassA));
  dkWindowed(K, { x0: r0, x1: r1, ya: 0, yb: H.strip, z: 35.6, tu: 4, tv: 4, wall: M.wallEnd, ops, depth: 0.2 });
}

/** the white 1968 pavilion r 103.6 .. 121.8, front q -40: window / double doors under a dark canopy / door pair / window */
function white(K) {
  const { P, M } = K, r0 = F.white[0], r1 = F.white[1], q = F.whiteQ;
  const ops = [dkOp(M, 106.3, 3.4, 0.7, 3.4, 3, [0.7], M.dkGlassA, { sill: true }), { x: 111.2, w: 1.9, y0: 0, y1: 2.8, kind: 'door', glass: M.whiteDoor }, { x: 114.2, w: 1.9, y0: 0, y1: 2.8, kind: 'door', glass: M.whiteDoor }, dkOp(M, 119.2, 3.4, 0.7, 3.4, 3, [0.7], M.dkGlassC, { sill: true })];
  dkWindowed(K, { x0: r0, x1: r1, ya: 0, yb: H.white, z: -q, tu: 4, tv: 4, wall: M.white, reveal: M.white, depth: 0.22, ops });
  P.box(M.whiteCanopy, 109.6, 116.0, 3.55, 3.75, -q, -q + 1.6, '', 1);                              // the flat dark canopy over the doors at 3.7
  P.box(M.white, r0 - 0.1, r1 + 0.1, 5.15, H.white, -q, -q + 0.25, 'k', 2);                          // pale cornice 5.2 .. 5.6
}

/** the corner of the end block: a corner entrance with a black canopy, a drain pipe */
function endBlock(K) {
  const { P, M } = K, q = F.endQ;
  P.box(M.whiteCanopy, 123.0, 127.6, 3.3, 3.5, -q, -q + 1.3, '', 1);
  P.box(M.glassDark, 123.6, 126.8, 0, 3.0, -q, -q + 0.04, 'k', 1);
  P.cyl(M.pipe, [128.6, 0, -q + 0.1], [128.6, 17.4, -q + 0.1], 0.07, 0.07, 6, false);
}

export function build(K) {
  const { P, M } = K;
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKirova] dkfront/${name}:`, e); throw e; } };
  const Lq = F.line, Eq = F.lineE;
  // west wing W1 (10 bays), centre block (8 bays, the portal in front), east wing WE (9 bays)
  stage('w1', () => { podium(K, F.w1[0], F.w1[1], Lq); block(K, F.w1[0], F.w1[1], Lq + H.setback, 10); });
  stage('cb', () => { podium(K, F.cb[0], F.cb[1], F.line + 0.2, { portal: [F.portal[0], F.portal[1]] }); block(K, F.cb[0], F.cb[1], F.line + 0.2 + H.setback, 8); });
  stage('we', () => { podium(K, F.we[0], F.we[1], Eq); block(K, F.we[0], F.we[1], Eq + H.setback, 9); });
  stage('pavilions', () => { pavilion(K, F.pl[0], F.pl[1], Lq); pavilion(K, F.pr[0], F.pr[1], Eq); });
  stage('v1', () => westBlock(K));
  stage('gallery', () => gallery(K));
  stage('strip', () => strip(K));
  stage('endfront', () => endFront(K));
  stage('white', () => white(K));
  stage('endblock', () => endBlock(K));
  void M; void P; void PORTAL_C;
}
