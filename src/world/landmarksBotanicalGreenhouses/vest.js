// landmarksBotanicalGreenhouses/vest.js - the VESTIBULE ROTUNDA (OSM r19579807, 1935, the new entrance hall of the Great Subtropical house): a white stucco body with a flat roof behind a parapet,
// round-headed windows in oak-leaf-and-acorn frames with black wrought-iron grilles (photo 30), and a semicircular colonnaded BOW on its east end: five Tuscan columns, tall wooden door-windows between
// them, a frieze of swags and wreaths, a cornice and a recessed attic (photo 33).  Doors: n4078079811 (west, access=customers) and n4078079813 (the bow, east).  The hall is closed: the north court
// is not opened to the player (the task text), the doors are shut.   Plan: the baked ring (24 vertices; the bow = the 9 arc vertices around (104.4, -95.3) of the pf() frame, radius ~2.9 m).
import * as L from '../layout.js';
import { hangPlate, ringOfPoly, outNormals, len2, wallTiles, wallFlat, tileQuad, pf, EU, EV, capRing, lerp } from './geo.js';
import { ringEdges, band } from './kit.js';

const BOW = pf(104.4, -95.3), RB = 2.9, H = 7.2, PL = 0.5;

export function build(K) {
  const { P, D, M, svc } = K;
  const ring = ringOfPoly(L.buildingById('r19579807'));
  if (!ring) { console.warn('[landmarksBotanicalGreenhouses] vestibule footprint missing'); return; }
  const N = outNormals(ring), n = ring.length, near = (p) => Math.hypot(p[0] - BOW[0], p[1] - BOW[1]) < 3.5, near2 = (p) => Math.hypot(p[0] - BOW[0], p[1] - BOW[1]) < 4.4;
  const wall = [];
  for (let i = 0; i < n; i++) {
    const A = ring[i], B = ring[(i + 1) % n], l = len2(A, B);
    if (near(A) && near(B)) continue;                                                              // the bow is drawn below
    if (l < 0.15) continue;
    wallFlat(P, M.stone, A, B, 0, PL, PL, N[i]);
    wallFlat(P, M.white2, A, B, PL, H, H, N[i]);
    wall.push(i);
  }
  const edges = ringEdges({ o: ring.flat(), h: [] }).filter((e) => !(near(e.a) && near(e.b)));
  band(P, edges, PL - 0.02, PL + 0.1, 0.05, { front: M.stone, top: M.stone });
  band(P, edges, H - 0.55, H - 0.05, 0.2, { front: M.white, top: M.white, under: M.white });          // the cornice
  band(P, edges, H - 0.05, H + 0.55, 0.0, { front: M.white2 });                                       // the parapet
  P.cap(M.tinFlat, ring, H, true, 4);
  // round-headed windows with the oak-leaf frame on the two long walls (north: frame edge facing -v, south: facing +v)
  for (const i of wall) {
    const A = ring[i], B = ring[(i + 1) % n], l = len2(A, B);
    const side = l >= 4.5 && l < 7 && (near2(A) || near2(B));                                         // the short wall beside the bow carries one window too (photo 33), nearer the bow than the plate
    if (l < 12 && !side) continue;
    const k = side ? 1 : l > 16 ? 3 : 2;
    for (let j = 0; j < k; j++) {
      const t = side ? (near2(A) ? 0.24 : 0.76) : (j + 0.5) / k, c = [lerp(A[0], B[0], t), lerp(A[1], B[1], t)], e = [(B[0] - A[0]) / l, (B[1] - A[1]) / l], o = 0.03;
      const a = [c[0] - e[0] * 0.75 + N[i][0] * o, c[1] - e[1] * 0.75 + N[i][1] * o], b = [c[0] + e[0] * 0.75 + N[i][0] * o, c[1] + e[1] * 0.75 + N[i][1] * o];
      tileQuad(P, M.oak, [a[0], 1.5, a[1]], [b[0], 1.5, b[1]], [b[0], 4.9, b[1]], [a[0], 4.9, a[1]], 100, 100, [N[i][0], 0, N[i][1]]);
    }
  }
  bow(K);
  { const q = pf(104.45, -101.2); hangPlate(K, 'r19579807', M.plateVest, q[0] + EU[0] * 0.03, 2.1, q[1] + EU[1] * 0.03, 1.0, 0.5, EU[0], EU[1], 'plate'); }       // the plate on the east wall beside the bow
  const cx = pf(93, -100);
  svc.monuments.push({ id: 'r19579807', name: 'Ротонда-вестибюль оранжерей (1935)', x: cx[0], z: cx[1], h: H + 0.55 });
  { const a = pf(86.2, -107.8); svc.entrances.push({ x: a[0] + EV[0] * -1.5, z: a[1] + EV[1] * -1.5, rotY: Math.atan2(-EV[0], -EV[1]) + Math.PI, bldg: 'r19579807', door: 'n4078079811' }); }
  { const s0 = pf(104.4 + RB + 5, -95.3); (svc.crowd ||= []).push({ id: 'gh-vestibule-bow', kind: 'photo', x: s0[0], z: s0[1], r: 4, n: 4 }); }
  { const s = pf(104.4 + RB + 8, -95.3); svc.photoSpots.push({ x: s[0], z: s[1], yaw: Math.round(L.yawToward(s[0], s[1], BOW[0], BOW[1])), name: 'Ротонда у входа в оранжереи: колонны и фриз' });
    svc.entrances.push({ x: pf(104.4 + RB + 2.4, -95.3)[0], z: pf(104.4 + RB + 2.4, -95.3)[1], rotY: Math.atan2(EU[0], EU[1]) + Math.PI, bldg: 'r19579807', door: 'n4078079813' }); }
}

/** the colonnaded bow: half a circle on the east end of the frame (outward = +EU) */
function bow(K) {
  const { P, D, M } = K;
  const pt = (r, phi) => [BOW[0] + r * (Math.cos(phi) * EU[0] + Math.sin(phi) * EV[0]), BOW[1] + r * (Math.cos(phi) * EU[1] + Math.sin(phi) * EV[1])];     // phi = 0: east, + towards v+ (south)
  const N = 8, RW = 2.35, RC = 2.95;
  // door-window wall in facets (between phi -90 .. 90)
  for (let k = 0; k < N; k++) {
    const f0 = -Math.PI / 2 + k * Math.PI / N, f1 = f0 + Math.PI / N, a = pt(RW, f0), b = pt(RW, f1), mid = (f0 + f1) / 2, out = [Math.cos(mid) * EU[0] + Math.sin(mid) * EV[0], 0, Math.cos(mid) * EU[1] + Math.sin(mid) * EV[1]];
    tileQuad(P, M.vestWin, [a[0], 0.4, a[1]], [b[0], 0.4, b[1]], [b[0], 5.0, b[1]], [a[0], 5.0, a[1]], 100, 100, out);
    const a2 = pt(RW, f0), b2 = pt(RW, f1);                                                          // the attic above the cornice, recessed
    wallFlat(P, M.white2, [a2[0], a2[1]], [b2[0], b2[1]], 6.3, H, H, [out[0], out[2]]);
    // frieze with swags (r 3.3) and cornice (r 3.5)
    const fa = pt(3.25, f0), fb = pt(3.25, f1);
    tileQuad(P, M.festoon, [fa[0], 5.0, fa[1]], [fb[0], 5.0, fb[1]], [fb[0], 5.9, fb[1]], [fa[0], 5.9, fa[1]], 100, 100, out);
    const ca = pt(3.55, f0), cb = pt(3.55, f1);
    P.quad(M.white, [ca[0], 5.9, ca[1]], [cb[0], 5.9, cb[1]], [cb[0], 6.3, cb[1]], [ca[0], 6.3, ca[1]], [out[0], 0, out[2]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const ia = pt(3.25, f0), ib = pt(3.25, f1);
    P.quad(M.white, [ca[0], 6.3, ca[1]], [cb[0], 6.3, cb[1]], [pt(RW, f1)[0], 6.3, pt(RW, f1)[1]], [pt(RW, f0)[0], 6.3, pt(RW, f0)[1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(M.white, [ia[0], 5.0, ia[1]], [ib[0], 5.0, ib[1]], [cb[0], 5.0, cb[1]], [ca[0], 5.0, ca[1]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // the floor of the bow porch + two steps
    const sa = pt(RC + 0.9, f0), sb = pt(RC + 0.9, f1), pa = pt(RC + 0.0, f0), pb = pt(RC + 0.0, f1), qa = pt(RC + 1.6, f0), qb = pt(RC + 1.6, f1);
    P.quad(M.stoneGrey, [pa[0], 0.28, pa[1]], [pb[0], 0.28, pb[1]], [sb[0], 0.28, sb[1]], [sa[0], 0.28, sa[1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(M.stoneGrey, [sa[0], 0.0, sa[1]], [sb[0], 0.0, sb[1]], [sb[0], 0.28, sb[1]], [sa[0], 0.28, sa[1]], [out[0], 0, out[2]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(M.stoneGrey, [sa[0], 0.14, sa[1]], [sb[0], 0.14, sb[1]], [qb[0], 0.14, qb[1]], [qa[0], 0.14, qa[1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(M.stoneGrey, [qa[0], 0.0, qa[1]], [qb[0], 0.0, qb[1]], [qb[0], 0.14, qb[1]], [qa[0], 0.14, qa[1]], [out[0], 0, out[2]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // five columns (Tuscan: plain shaft 0.3 m radius, a square abacus above, a base ring)
  for (let k = 0; k < 5; k++) {
    const p = pt(RC, (-72 + 36 * k) * Math.PI / 180);
    P.col(M.white2, p[0], p[1], 0.28, 4.75, 0.31, 0.27, 10, true);
    D.cyl(M.white2, [p[0], 0.28, p[1]], [p[0], 0.5, p[1]], 0.38, 0.33, 10, true);                    // the base
    P.col(M.white2, p[0], p[1], 4.75, 5.0, 0.42, 0.42, 8, true);                                     // the capital
  }
  // the colonnade is solid: the module places the colliders in walk.js
}
