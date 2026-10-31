// landmarksVladimir/yubileyny.js - the YUBILEYNY sports palace (пр. Добролюбова, 18; G. P. Morozov, I. P. Suslikov and others, 1967; rebuilt 2015-16; OSM relation r2277233) in world
// coordinates.  Dossier docs/research/vladimir.md section 5; photos refs/vladimir yub_01 / yub_02 (fins, glazing, ring cornice, entrance), yub_03_aerial (roof with its central ring,
// podium stairs), yub_05, yub_08_fountain.
//   the round hall (part r2277231, r 45.6 m on (-3312.5, -1989.5), 22 m): 72 white concrete fins on a glazed ground floor, dark glazing between them, a projecting ring cornice, a shallow
//   dished roof with the central ring (part w1042578477, to 24.5 m), the plain name over the entrance that faces pr. Dobrolyubova;
//   the small arena (part r2277234, 13.5 m) and the low annex between the hall and Tuchkov Buyan (part r2277235, 9 m): pale panel walls with strip windows on the OSM outlines.
// The fins are merged geometry (72 boxes).  ~6 k triangles.
import * as L from '../layout.js';
import * as G from './geo.js';
import { ringEdges, onEdge, band } from './kit.js';
import { addPolyColliders } from '../lib/massing.js';

const TAU = Math.PI * 2;
const C = { x: -3312.5, z: -1989.5 }, R = 45.6, NF = 72, H = 22, YG = 4.4;
const ENTR = Math.atan2(0.5025, -0.8645);                                    // azimuth (sin, cos) of the main entrance: square to pr. Dobrolyubova

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksVladimir] yubileyny/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('hall', () => hall(K));
  stage('annexes', () => { annex(K, 'r2277234', 13.5); annex(K, 'r2277235', 9.0); });
  stage('colliders', () => {
    for (const id of ['r2277234', 'r2277235']) { const b = L.buildingById(id); if (b) for (const poly of b.polys) addPolyColliders(ctx, poly, 0, 14, 0.9); }
    // the drum: a ring of thin boxes (hollow like every building)
    for (let i = 0; i < 36; i++) { const t = (i + 0.5) * TAU / 36; ctx.physics.addBox(C.x + Math.sin(t) * (R + 0.6), C.z + Math.cos(t) * (R + 0.6), 2 * (R + 1.4) * Math.tan(Math.PI / 36), 1.6, t, 0, 22); }
  });
  K.svc.monuments.push({ id: 'r2277233', name: 'Дворец спорта «Юбилейный»', x: C.x, z: C.z, h: 24.5 });
  K.svc.entrances.push({ x: C.x + Math.sin(ENTR) * (R + 4), z: C.z + Math.cos(ENTR) * (R + 4), rotY: ENTR, kind: 'arena' });
  K.svc.crowd.push({ id: 'yubileyny-forecourt', kind: 'group', x: C.x + Math.sin(ENTR) * (R + 22), z: C.z + Math.cos(ENTR) * (R + 22), r: 14, n: 18 });
  K.svc.photoSpots.push({ x: C.x + Math.sin(ENTR) * (R + 60), z: C.z + Math.cos(ENTR) * (R + 60), yaw: L.yawToward(C.x + Math.sin(ENTR) * (R + 60), C.z + Math.cos(ENTR) * (R + 60), C.x, C.z), pitch: 8, name: 'Дворец спорта «Юбилейный»' });
  if (errs.length) throw new Error(errs.join('\n'));
}

function hall(K) {
  const P = K.P, M = K.M, a0 = -Math.PI / NF;
  // glazed ground floor, the canopy slab, the glazing of the drum, the cornice ring
  G.tube(P, M.yubDoors, C.x, C.z, 0, YG - 0.5, R - 1.2, R - 1.2, NF, NF, 1, { a0 });
  G.tube(P, M.fin, C.x, C.z, YG - 0.5, YG, R + 2.2, R + 2.2, NF, 1, 1, { a0, capTop: M.fin, capBot: M.underside });
  G.tube(P, M.yubGlass, C.x, C.z, YG, H - 1.6, R - 0.4, R - 0.4, NF, NF, 1, { a0 });
  G.tube(P, M.fin, C.x, C.z, H - 1.6, H, R + 1.9, R + 1.9, NF, 1, 1, { a0, capBot: M.underside });
  G.tube(P, M.fin, C.x, C.z, H - 1.75, H - 1.6, R + 0.2, R + 1.9, NF, 1, 1, { a0 });
  // the fins: tapering concrete blades from the canopy to the cornice, and the slim columns under them
  for (let i = 0; i < NF; i++) {
    const t = i * TAU / NF + Math.PI / NF;
    P.push(C.x + Math.sin(t) * R, 0, C.z + Math.cos(t) * R, t);                // local +z = radially out
    P.box(M.fin, -0.26, 0.26, YG, H - 1.6, -0.5, 1.5, 'tb');
    P.box(M.fin, -0.2, 0.2, 0, YG - 0.5, 0.9, 1.5, 'tb');
    P.pop();
  }
  // roof: a shallow dish to the central ring, the ring itself
  const RR = R + 1.9, r0 = 7.5, SEG = 36;
  for (let i = 0; i < SEG; i++) {
    const t0 = i * TAU / SEG, t1 = (i + 1) * TAU / SEG, p = (t, r, y) => [C.x + Math.sin(t) * r, y, C.z + Math.cos(t) * r];
    P.quad(M.yubRoof, p(t0, RR, H), p(t1, RR, H), p(t1, r0, H - 1.0), p(t0, r0, H - 1.0), [0, 1, 0], [[i, 0], [i + 1, 0], [i + 1, 6], [i, 6]]);
  }
  G.tube(P, M.fin, C.x, C.z, H - 1.2, 24.5, r0, r0, 24, 1, 1, { capTop: M.yubRoof });
  // the name over the entrance, on the cornice ring (six flat panels that follow the curve)
  const labels = K.ctx.services.labels, half = 0.27, cx = C.x + Math.sin(ENTR) * (RR + 0.05), cz = C.z + Math.cos(ENTR) * (RR + 0.05);
  if (!labels || labels.reserve('r2277233', cx, H - 0.8, cz, 24, 1.3, Math.sin(ENTR), Math.cos(ENTR), 'sign')) {
    for (let k = 0; k < 6; k++) {
      const t0 = ENTR - half + (2 * half) * k / 6, t1 = ENTR - half + (2 * half) * (k + 1) / 6, rr = RR + 0.06;   // increasing azimuth = to the right of a viewer outside
      P.quad(M.yubName, [C.x + Math.sin(t0) * rr, H - 1.45, C.z + Math.cos(t0) * rr], [C.x + Math.sin(t1) * rr, H - 1.45, C.z + Math.cos(t1) * rr], [C.x + Math.sin(t1) * rr, H - 0.15, C.z + Math.cos(t1) * rr], [C.x + Math.sin(t0) * rr, H - 0.15, C.z + Math.cos(t0) * rr],
        [Math.sin(ENTR), 0, Math.cos(ENTR)], [[k / 6, 0], [(k + 1) / 6, 0], [(k + 1) / 6, 1], [k / 6, 1]]);
    }
  }
  // the stair podium in front of the entrance: three broad steps on an arc
  for (let s = 0; s < 3; s++) {
    const r1 = R + 13 - s * 1.2, y = 0.45 - s * 0.15, pts = [];
    for (let k = 0; k <= 12; k++) { const t = ENTR - 0.55 + 1.1 * k / 12; pts.push([C.x + Math.sin(t) * r1, C.z + Math.cos(t) * r1]); }
    for (let k = 12; k >= 0; k--) { const t = ENTR - 0.55 + 1.1 * k / 12; pts.push([C.x + Math.sin(t) * (R + 2.2), C.z + Math.cos(t) * (R + 2.2)]); }
    if (pts.some(([x, z]) => L.isOnRoad(x, z, 0.4))) continue;                 // never over a carriageway (road integrity rules)
    P.cap(M.concrete, pts, y, true, 3);
    for (let k = 0; k < 12; k++) { const a = pts[k], b = pts[k + 1]; P.quad(M.concrete, [a[0], y - 0.15, a[1]], [b[0], y - 0.15, b[1]], [b[0], y, b[1]], [a[0], y, a[1]], [Math.sin(ENTR), 0, Math.cos(ENTR)]); }
  }
  K.ctx.physics.addWalkBox(C.x + Math.sin(ENTR) * (R + 6.5), C.z + Math.cos(ENTR) * (R + 6.5), 30, 9, ENTR, 0.3, 0);
}

function annex(K, id, h) {
  const P = K.P, M = K.M, b = L.buildingById(id); if (!b) return;
  for (const poly of b.polys) {
    const E = ringEdges(poly).filter((e) => Math.hypot((e.a[0] + e.b[0]) / 2 - C.x, (e.a[1] + e.b[1]) / 2 - C.z) > R + 0.8);   // not the arc that lies on the hall
    for (const e of E) onEdge(P, e, (len) => {
      const nb = Math.max(1, Math.round(len / 6)), nf = Math.max(1, Math.round(h / 4.5));
      P.quad(M.annex, [0, 0, 0], [len, 0, 0], [len, h, 0], [0, h, 0], [0, 0, 1], [[0, 0], [nb, 0], [nb, nf], [0, nf]]);
    });
    band(P, E, h - 0.5, h, 0.12, { front: M.fin, top: M.fin, under: M.underside });
    const ring = []; for (let i = 0; i < poly.o.length; i += 2) ring.push([poly.o[i], poly.o[i + 1]]);
    P.cap(M.yubRoof, ring, h - 0.02, true, 6);
  }
}
