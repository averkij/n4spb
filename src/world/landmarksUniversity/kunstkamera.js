// landmarksUniversity/kunstkamera.js - the Kunstkamera (Университетская наб., 3; 1718-34, Petrine baroque; OSM r3296328): docs/research/university-embankment.md section 3,
// photos refs/university kk_01 (frontal, the measuring photo) kk_02 kk_07 (tower) kk_03 kk_06 kk_18 (ends, centre) kk_10 kk_12 (yard).
//   the 95.7 m river block: two wings of 12 window axes (6 in the end pavilion under a white balustrade + 6), turquoise-green with white lopatki between all windows (bay textures of
//   mats.js + real strips), the concave banded centre (the unrolled centre texture laid over the six footprint edges), grey hipped roofs with green chimneys;
//   the TOWER on the centre: octagonal banded tier 1, the round tier 2 with eight tall arched windows, the balustraded gallery, the octagonal tier 3 with scroll buttresses, the dark
//   copper dome with oval lucarnes, the lantern and the gilded armillary sphere (top 44.3 m);
//   the yellow three-storey ANNEX on Tamozhenny pereulok (the same footprint ring) and the two low buildings of the yard (w216655300, w28566732).
// Frame KK (frame.js): +x along the river front to the NE, +z out to the Neva.  No flags.
import * as THREE from 'three';
import * as L from '../layout.js';
import { onEdge } from './kit.js';
import { shellWalls, shellCornice, shellPlinth, insetRoof, hipRect, chimney, shellColliders, balustrade, prism, texQuad, plainQuad, ringFromFlat } from './shell.js';
import { lathe } from './prims.js';
import { plate } from './plaques.js';
import { KK, KK_LEN, KK_W0, KK_W1, KK_TOWER } from './frame.js';

const ID = 'r3296328', EAVE = 14.2, KH = 14.2, AEAVE = 15.5, PAV = 0.3, PAVW = 18.1, TAU = Math.PI * 2;

export function kunstkamera(K) {
  const { ctx, P, M } = K;
  const b = L.buildingById ? L.buildingById(ID) : null; if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksUniversity] Kunstkamera footprint missing'); return; }
  const poly = b.polys[0], ring = ringFromFlat(poly.o);
  const loc = (p) => KK.M(p[0], p[1]);
  const inMain = (p) => { const [x, z] = loc(p); return z > -15.9 || (x > 26 && x < 63 && z > -31) || (x > -1.5 && x < 12 && z > -20.9); };
  const isMain = (e) => inMain(e.a) && inMain(e.b);
  const isCentre = (e) => { const a = loc(e.a), c = loc(e.b); return a[0] > 39 && a[0] < 55.4 && c[0] > 39 && c[0] < 55.4 && a[1] > -0.6 && c[1] > -0.6; };
  const isFront = (e) => { const a = loc(e.a), c = loc(e.b); return Math.abs(a[1]) < 0.6 && Math.abs(c[1]) < 0.6 && e.len > 30; };
  const isEnd = (e) => { const a = loc(e.a), c = loc(e.b), xm = (a[0] + c[0]) / 2; return e.len > 12 && Math.abs(a[0] - c[0]) < 2.5 && (xm < 2 || xm > KK_LEN - 2) && Math.max(a[1], c[1]) > -1; };
  const main = { mat: M.kkBayM, bayW: 3.6, texH: KH, eave: EAVE, plain: M.kk, minBay: 3.0 }, annex = { mat: M.kkAnnex, bayW: 3.6, texH: AEAVE, eave: AEAVE, plain: M.annex, margin: 0.5, minBay: 3.0 };
  const edges = shellWalls(P, poly, { style: (e) => (isCentre(e) || isFront(e) || isEnd(e) ? 'skip' : isMain(e) ? main : annex), def: main });

  // ---------------------------------------------------------------------------------------------- the two river fronts: 12 axes, the outer 6 = the pavilion (projecting PAV)
  for (const e of edges.filter(isFront)) onEdge(P, e, (len, f) => {
    const west = KK.M(f.x, f.z)[0] < 20, pw = PAVW / 6, mw = (len - PAVW) / 6, door = west ? 4 : 7;
    const pav = (i) => (west ? i < 6 : i >= 6), X = (i) => (west ? (i <= 6 ? i * pw : PAVW + (i - 6) * mw) : (i <= 6 ? i * mw : len - PAVW + (i - 6) * pw));
    for (let i = 0; i < 12; i++) texQuad(P, pav(i) ? (i === door ? M.kkDoorP : M.kkBayP) : M.kkBayM, X(i), X(i + 1), 0, EAVE, 0, 1, KH, pav(i) ? PAV : 0);
    for (let i = 0; i <= 12; i++) {                                                     // the lopatki; the pavilion corners are banded quoins
      const x = X(i), inP = (i > 0 && pav(i - 1)) || (i < 12 && pav(i)), z0 = inP ? PAV : 0, corner = i === 0 || i === 12 || i === 6, hl = (i > 0 && pav(i - 1)) ? 0.45 : 0.75, hr = (i < 12 && pav(i)) ? 0.45 : 0.75;
      if (corner) { const a = Math.max(0, x - (i === 6 ? 0.5 : 0.62)), c = Math.min(len, x + (i === 6 ? 0.5 : 0.62)); P.box(M.whiteBand, a, c, 1.3, 13.2, z0, z0 + 0.2, 'kb', 1); continue; }
      P.box(M.white, x - hl, x + hr, 1.3, 13.2, z0, z0 + 0.12, 'kb');
    }
    const xp = X(6), [pa, pb] = west ? [0, xp] : [xp, len];
    P.quad(M.white, [xp, 0, 0], [xp, 0, PAV], [xp, EAVE, PAV], [xp, EAVE, 0], [west ? 1 : -1, 0, 0]);          // the return of the pavilion
    P.quad(M.white, [west ? 0 : len, 0, 0], [west ? 0 : len, 0, PAV], [west ? 0 : len, EAVE, PAV], [west ? 0 : len, EAVE, 0], [west ? -1 : 1, 0, 0]);
    P.box(M.white, pa - (west ? 0.5 : 0), pb + (west ? 0 : 0.5), EAVE - 0.5, EAVE + 0.02, PAV, PAV + 0.5, 'k'); P.box(M.white, pa, pb, EAVE - 0.82, EAVE - 0.5, PAV, PAV + 0.2, 'kt');   // the pavilion cornice
    P.box(M.kkSocle, pa, pb, 0, 1.25, PAV, PAV + 0.08, 'kb');
    const dx = (X(door) + X(door + 1)) / 2, dz = PAV;                                    // granite steps of the door
    P.box(M.granitePlain, dx - 1.1, dx + 1.1, 0, 0.16, dz, dz + 0.75, 'kb'); P.box(M.granitePlain, dx - 0.9, dx + 0.9, 0.16, 0.3, dz, dz + 0.42, 'kb');
    K.svc.entrances.push({ x: f.x + f.xa[0] * dx + e.n[0] * 1.6, z: f.z + f.xa[1] * dx + e.n[1] * 1.6, rotY: Math.atan2(e.n[0], e.n[1]), name: 'Кунсткамера', closed: true });
    plate(K, { id: ID, x: X(door + 1), y: 2.35, w: 0.72, h: 0.95, z: PAV + 0.12, key: 'kk-name', style: 'board', n: e.n, size: 40, world: (x, z) => [f.x + f.xa[0] * x + e.n[0] * z, f.z + f.xa[1] * x + e.n[1] * z],
      lines: ['РОССИЙСКАЯ АКАДЕМИЯ НАУК', 'МУЗЕЙ АНТРОПОЛОГИИ', 'И ЭТНОГРАФИИ', 'им. ПЕТРА ВЕЛИКОГО', '(КУНСТКАМЕРА)'] });
  });
  // ---------------------------------------------------------------------------------------------- the end walls: three broad axes, the middle one blind (kk_06, kk_18)
  for (const e of edges.filter(isEnd)) onEdge(P, e, (len, f) => {
    const west = KK.M(f.x, f.z)[0] < 20, W = 15.0;
    // seen from outside: the west end runs from the annex (left) to the river corner (right); the east end from the river corner (left) to the yard (right)
    const g0 = west ? Math.max(0, len - W) : 0, g1 = west ? len : Math.min(len, W), q = 0.9, bw = (g1 - g0 - 2 * q) / 3;
    if (g0 > 0.3) texQuad(P, M.kkAnnex, 0, g0, 0, AEAVE, 0, 1, AEAVE); if (g1 < len - 0.3) plainQuad(P, M.kk, g1, len, 0, EAVE);
    plainQuad(P, M.white, g0, g0 + q, 0, EAVE); plainQuad(P, M.white, g1 - q, g1, 0, EAVE);
    for (let i = 0; i < 3; i++) { const x = g0 + q + i * bw; texQuad(P, i === 1 ? M.kkBlindE : M.kkBayE, x, x + bw, 0, EAVE, 0, 1, KH); if (i) P.box(M.white, x - 0.6, x + 0.6, 1.3, 13.2, 0, 0.12, 'kb'); }
    P.box(M.whiteBand, g0, g0 + q + 0.6, 1.3, 13.2, 0, 0.2, 'kb', 1); P.box(M.whiteBand, g1 - q - 0.6, g1, 1.3, 13.2, 0, 0.2, 'kb', 1);          // quoins
  });
  // ---------------------------------------------------------------------------------------------- the concave centre: the unrolled texture over the footprint edges, west -> east
  const cen = edges.filter(isCentre).map((e) => { const a = loc(e.a), c = loc(e.b); return a[0] < c[0] ? [a, c] : [c, a]; }).sort((m, n) => m[0][0] - n[0][0]);
  P.push(KK.O[0], 0, KK.O[1], KK.rot);
  if (cen.length) {
    const tot = cen.reduce((s, [a, c]) => s + Math.hypot(c[0] - a[0], c[1] - a[1]), 0); let s0 = 0;
    for (const [a, c] of cen) {
      const l = Math.hypot(c[0] - a[0], c[1] - a[1]), nx = -(c[1] - a[1]) / l, nz = (c[0] - a[0]) / l;
      P.quad(M.kkCentre, [a[0], 0, a[1]], [c[0], 0, c[1]], [c[0], EAVE, c[1]], [a[0], EAVE, a[1]], [nx, 0, nz], [[s0 / tot, 0], [(s0 + l) / tot, 0], [(s0 + l) / tot, 1], [s0 / tot, 1]]);
      s0 += l;
    }
  }
  // ---------------------------------------------------------------------------------------------- roofs, pavilion attics, chimneys (KK frame)
  const ye = EAVE + 0.06, T1 = 8.2, [tx, tz] = KK_TOWER;
  hipRect(P, M.kkRoof, 0, tx - T1 + 1.2, -15.2, 0, ye, 2.8, { hip1: 0, over: 0.3, gable: M.kk });
  hipRect(P, M.kkRoof, tx + T1 - 1.2, KK_LEN, -15.2, 0, ye, 2.8, { hip0: 0, over: 0.3, gable: M.kk });
  for (const [x0, x1, xe] of [[0.25, PAVW - 0.2, 0.12], [KK_LEN - PAVW + 0.2, KK_LEN - 0.25, KK_LEN - 0.12]]) {
    balustrade(P, M, x0, x1, EAVE, PAV + 0.12, { h: 1.35, panel: M.kk, step: 3.9 });
    P.push(xe, 0, PAV + 0.1, Math.PI / 2); balustrade(P, M, 0.5, 15.3, EAVE, 0, { h: 1.35, panel: M.kk, step: 3.7 }); P.pop();
    P.push(0, 0, -15.1, Math.PI); balustrade(P, M, -x1, -x0, EAVE, 0, { h: 1.35, step: 3.9 }); P.pop();
    P.push(x0 > 40 ? x0 : x1, 0, 0, Math.PI / 2); balustrade(P, M, 0.5, 15.0, EAVE, 0, { h: 1.35, step: 3.7 }); P.pop();     // the inner side of the attic
  }
  [5.5, 12.5, 24, 30.5, 36.5, 59, 65, 71.5, 83, 90].forEach((x, i) => { for (const z of x < 20 || x > 76 ? [-4.6, -10.6] : [i % 2 ? -4.6 : -10.6]) chimney(P, M.kkChimney, M.white, x, z, EAVE + 0.6, EAVE + 4.0, 0.9, 1.3); });
  P.pop();
  P.cap(M.kkRoof, ring, EAVE - 0.06, true, 0.6);                                           // closes everything the hips leave open (the yard projection, the deep west pavilion)

  // ---------------------------------------------------------------------------------------------- annex roof (ring vertices of the annex: everything that is not "main")
  const ann = ring.filter((p) => !inMain(p)), seam = ring.filter((p) => { const [x, z] = loc(p); return inMain(p) && z < -15.9 && x < 12; });
  if (ann.length >= 4) {
    const i0 = ring.indexOf(ann[0]), ordered = []; for (let k = 0; k < ring.length; k++) { const p = ring[(i0 + k) % ring.length]; if (!inMain(p) || seam.includes(p)) ordered.push(p); }
    try { insetRoof(P, ordered, AEAVE, M.kkRoof, { inset: 3.0, rise: 1.7, chimney: M.annex, cap: M.white, chimneyMin: 16 }); } catch (err) { console.warn('[landmarksUniversity] annex roof:', err.message); }
    P.cap(M.kkRoof, ordered, AEAVE - 0.03, true, 0.6);
  }
  shellCornice(P, poly, (e) => (isMain(e) ? EAVE : AEAVE), M, { d: 0.5, h: 0.5 });
  shellPlinth(P, poly, 1.25, M.kkSocle, 0.07, { draw: (e) => isMain(e) && !isCentre(e) });
  shellColliders(ctx, poly, 17);

  // ---------------------------------------------------------------------------------------------- tower
  P.push(KK.O[0], 0, KK.O[1], KK.rot);
  tower(K, tx, tz);
  P.pop();

  // ---------------------------------------------------------------------------------------------- the low buildings of the yard
  for (const [id, eave, rise] of [['w216655300', 10.3, 1.6], ['w28566732', 4.9, 1.5]]) {
    const yb = L.buildingById(id); if (!yb || !yb.polys || !yb.polys.length) continue;
    const yp = yb.polys[0];
    shellWalls(P, yp, { def: { mat: M.kkAnnex, bayW: 3.6, texH: AEAVE, eave, plain: M.annex, margin: 0.4, minBay: 3.0 } });
    shellCornice(P, yp, eave, M, { d: 0.3, h: 0.3 }); insetRoof(P, ringFromFlat(yp.o), eave, M.kkRoof, { inset: 3.0, rise });
    shellColliders(ctx, yp, eave + 2);
  }
  const wc = KK.W(tx, tz);
  K.svc.monuments.push({ id: 'kunstkamera', name: 'Кунсткамера', x: wc[0], z: wc[1], h: 44.3, r: 0 });
  K.svc.photoSpots.push({ x: KK.W(tx, 22)[0], z: KK.W(tx, 22)[1], yaw: 0, name: 'Кунсткамера' });
  K.svc.tower = { x: wc[0], z: wc[1], top: 44.3 };
}

/** a drum: vertical cylinder wall with u running `uRep` times round it (u0 = the offset at angle 0 = local +z) */
function drum(P, mat, cx, cz, r, y0, y1, seg, uRep, uOff = 0, v0 = 0, v1 = 1) {
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * TAU, a1 = ((i + 1) / seg) * TAU, am = (a0 + a1) / 2;
    P.quad(mat, [cx + Math.sin(a0) * r, y0, cz + Math.cos(a0) * r], [cx + Math.sin(a1) * r, y0, cz + Math.cos(a1) * r], [cx + Math.sin(a1) * r, y1, cz + Math.cos(a1) * r], [cx + Math.sin(a0) * r, y1, cz + Math.cos(a0) * r],
      [Math.sin(am), 0, Math.cos(am)], [[(i / seg) * uRep + uOff, v0], [((i + 1) / seg) * uRep + uOff, v0], [((i + 1) / seg) * uRep + uOff, v1], [(i / seg) * uRep + uOff, v1]]);
  }
}

function tower(K, cx, cz) {
  const { P, M } = K, one = () => [[0, 0], [1, 0], [1, 1], [0, 1]], R0 = -Math.PI / 8;
  // tier 1: the octagon on the centre (faces 6.8 m), banded, two arched windows per face; its cornice and the skirt roof up to the drum
  prism(P, M.kkT1, cx, cz, [[8.2, 14.2], [8.2, 20.1]], 8, R0, one);
  prism(P, M.white, cx, cz, [[8.2, 19.5], [8.7, 19.7], [8.7, 20.1], [8.2, 20.1]], 8, R0);
  prism(P, M.skirt, cx, cz, [[8.7, 20.1], [5.2, 20.95]], 8, R0, (s, i) => [[0, 0], [11, 0], [9, 6], [2, 6]]);
  // tier 2: the round drum, 8 bays (a window faces the river), entablature, the gallery
  drum(P, M.kkT2, cx, cz, 5.15, 20.7, 28.9, 32, 8, 0.5);
  for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + (k * TAU) / 8; P.push(cx + Math.sin(a) * 5.1, 0, cz + Math.cos(a) * 5.1, a); P.box(M.white, -0.5, 0.5, 20.9, 27.6, 0, 0.2, 'kb'); P.box(M.white, -0.6, 0.6, 27.2, 27.6, 0, 0.3, 'kb'); P.pop(); }
  lathe(P, M.white, cx, cz, [[5.15, 27.6], [5.4, 27.75], [5.4, 28.25], [5.95, 28.5], [5.95, 28.9], [5.3, 28.9]], 32);
  lathe(P, M.kkRoof, cx, cz, [[5.95, 28.9], [2.6, 28.97]], 32);
  lathe(P, M.white, cx, cz, [[5.72, 28.9], [5.72, 29.12], [5.36, 29.12]], 32); lathe(P, M.white, cx, cz, [[5.36, 29.9], [5.76, 29.9], [5.76, 30.08], [5.32, 30.08], [5.32, 29.9]], 32);
  drum(P, M.balus, cx, cz, 5.54, 29.12, 29.9, 32, 96);
  for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + (k * TAU) / 8; P.push(cx + Math.sin(a) * 5.34, 0, cz + Math.cos(a) * 5.34, a); P.box(M.kk, -0.62, 0.62, 29.12, 29.9, 0, 0.4, 'tb'); P.box(M.white, -0.7, -0.62, 29.12, 29.9, 0, 0.42, 'tb'); P.box(M.white, 0.62, 0.7, 29.12, 29.9, 0, 0.42, 'tb'); P.pop(); }
  // tier 3: the octagon with arched windows, scroll buttresses on the corners, entablature, attic
  prism(P, M.kkT3, cx, cz, [[2.65, 28.9], [2.65, 36.3]], 8, R0, one);
  prism(P, M.white, cx, cz, [[2.65, 34.45], [3.2, 34.7], [3.2, 35.1], [2.7, 35.1]], 8, R0);
  for (let k = 0; k < 8; k++) {
    const a = R0 + (k * TAU) / 8, R = 2.65 / Math.cos(Math.PI / 8);
    P.push(cx + Math.sin(a) * R, 0, cz + Math.cos(a) * R, a);
    P.box(M.white, -0.2, 0.2, 29.0, 33.6, -0.12, 0.42, 'b');
    P.cyl(M.white, [-0.22, 29.55, 0.55], [0.22, 29.55, 0.55], 0.52, 0.52, 10, true); P.cyl(M.white, [-0.22, 33.3, 0.42], [0.22, 33.3, 0.42], 0.34, 0.34, 10, true);
    P.box(M.white, -0.24, 0.24, 33.6, 33.9, -0.15, 0.62, '');
    P.pop();
  }
  // dome (octagonal bell), its lucarnes, the lantern with its balustrade, the cap
  prism(P, M.white, cx, cz, [[2.65, 36.18], [2.92, 36.3], [2.92, 36.44], [2.7, 36.44]], 8, R0);
  prism(P, M.dome, cx, cz, [[2.78, 36.44], [2.8, 36.7], [2.7, 37.3], [2.45, 37.95], [2.08, 38.5], [1.62, 38.95], [1.3, 39.2], [1.28, 39.32]], 8, R0);
  for (let k = 0; k < 8; k++) {
    const a = (k * TAU) / 8; P.push(cx + Math.sin(a) * 2.5, 0, cz + Math.cos(a) * 2.5, a);
    P.cyl(M.dome, [0, 37.55, 0], [0, 37.55, 0.36], 0.46, 0.44, 12, true); P.cyl(M.white, [0, 37.55, 0.3], [0, 37.55, 0.39], 0.25, 0.25, 12, true); P.cyl(M.glass, [0, 37.55, 0.36], [0, 37.55, 0.42], 0.19, 0.19, 10, true);
    P.pop();
  }
  prism(P, M.white, cx, cz, [[1.3, 39.3], [1.36, 39.36], [1.36, 39.5], [1.12, 39.5]], 8, R0);
  prism(P, M.balus, cx, cz, [[1.24, 39.5], [1.24, 40.0]], 8, R0, () => [[0, 0], [3, 0], [3, 1], [0, 1]]);
  prism(P, M.white, cx, cz, [[1.18, 40.0], [1.3, 40.0], [1.3, 40.1], [1.18, 40.1]], 8, R0);
  prism(P, M.kkLant, cx, cz, [[0.9, 39.3], [0.9, 41.5]], 8, R0, one);
  prism(P, M.white, cx, cz, [[0.9, 41.28], [1.16, 41.4], [1.16, 41.56], [0.95, 41.56]], 8, R0);
  prism(P, M.dome, cx, cz, [[1.16, 41.56], [0.78, 41.8], [0.42, 42.02], [0.3, 42.15], [0.0, 42.17]], 8, R0);
  // the scrolled stand and the armillary sphere: six gilded rings and a small globe
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + (k * TAU) / 4, s = Math.sin(a), c = Math.cos(a); P.cyl(M.dome, [cx + s * 0.3, 42.12, cz + c * 0.3], [cx + s * 0.42, 42.5, cz + c * 0.42], 0.06, 0.055, 6, false); P.cyl(M.dome, [cx + s * 0.42, 42.5, cz + c * 0.42], [cx + s * 0.1, 42.92, cz + c * 0.1], 0.055, 0.05, 6, false); }
  const cy = 43.6, R = 0.72, ring = (rr, tube) => new THREE.TorusGeometry(rr, tube, 6, 28);
  P.geo(M.dome, new THREE.SphereGeometry(0.13, 8, 6), cx, 42.95, cz); P.cyl(M.gold, [cx, 42.9, cz], [cx, cy + R + 0.12, cz], 0.02, 0.02, 5, false);
  const g1 = ring(R, 0.04), g2 = ring(R * 0.92, 0.035), g3 = ring(R * Math.cos(0.41), 0.03);
  P.geo(M.gold, g1, cx, cy, cz, Math.PI / 2, 0, 0);                                            // horizon ring
  P.geo(M.gold, g1, cx, cy, cz, 0, 0, 0); P.geo(M.gold, g1, cx, cy, cz, 0, Math.PI / 2, 0);     // two meridians
  P.geo(M.gold, g2, cx, cy, cz, Math.PI / 2 - 0.41, 0, 0.0);                                    // equator, tilted
  P.geo(M.gold, g2, cx, cy, cz, Math.PI / 2 + 0.41, 0, 0.2);                                    // ecliptic
  P.geo(M.gold, g3, cx, cy + R * Math.sin(0.41), cz, Math.PI / 2, 0, 0); P.geo(M.gold, g3, cx, cy - R * Math.sin(0.41), cz, Math.PI / 2, 0, 0);   // tropics
  P.geo(M.gold, new THREE.SphereGeometry(0.15, 10, 8), cx, cy, cz);
  for (const g of [g1, g2, g3]) g.dispose();
}
