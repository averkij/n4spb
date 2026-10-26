// landmarksNikolsky/tower.js - the free-standing four-tier bell tower of the cathedral (Chevakinsky 1755-58, 72 m with the cross) 105 m WSW of the dome on the Kryukov Canal embankment
// (dossier section 4, photos refs/nikolsky 019 017 030 006 012): plinth, tier 1 with the portal (the door faces the cathedral), two belfry tiers with real bells, corner column clusters, vase finials,
// a low gold dome, the clock tier (octagon, four white dials), a small gold dome, a gilded onion and a long needle spire with the cross.  Own frame: origin at the tower centre on the ground,
// local +z = towards the cathedral (the door face), x right as seen from outside.
import * as THREE from 'three';
import * as L from '../layout.js';
import * as G from './geo.js';
import * as S from './stucco.js';
import { goreGeo, domeProfile, crossGold } from './domes.js';
import { C0, ROT, TOWER, W } from './frame.js';
import { addPolyColliders } from '../lib/massing.js';

const TAU = Math.PI * 2;
export const TIERS = { plinth: 1.0, t1: [1.0, 13.2, 6.3], t2: [13.2, 26.9, 5.4], t3: [26.9, 38.7, 4.0], dome1: [38.7, 44.7], clock: [44.7, 52.8], dome2: [52.8, 56.3], onion: [56.3, 59.5], spire: [59.5, 69.0], top: 72.0 };

function tierCornice(P, M, h, y, proj, height = 1.0) {
  // cornice ring on a square of half width h: four runs with mitred corners (each run one box overlapping nothing at the corner: the front runs are longer)
  for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    P.push(fx * h, 0, fz * h, Math.atan2(fx, fz));
    const ext = (Math.abs(fz) ? proj : 0);
    S.entablature(P, M, -h - proj + (ext ? 0 : 0), h + proj, y, proj, { hA: height * 0.32, hF: height * 0.30, hC: height * 0.38 });
    P.pop();
  }
}
function pedestalAndCluster(P, M, px, pz, y0, y1, n, R, ax, az) {
  // an L / pair of columns at a tower corner: n = 3 (L-shape) or 2 (diagonal pair along the face direction)
  const pts = n === 3 ? [[0, 0], [-ax * R * 2.4, 0], [0, -az * R * 2.4]] : [[0, 0], [-ax * R * 2.4, -az * R * 2.4 * 0]];
  for (const [dx, dz] of pts) {
    const x = px + dx, z = pz + dz;
    P.box(M.white, x - R * 1.5, x + R * 1.5, y0, y0 + 1.3, z - R * 1.5, z + R * 1.5, 'b');
    S.column(P, M, x, z, y0 + 1.3, y1, R, { putti: false });
  }
}
/** a belfry opening in a wall face (local frame of the face: x along, z out): an arched hole, dark backing, a bell inside; w x h, bottom y0 */
function belfryOpening(P, M, cx, y0, w, h, hole = true, bell = true) {
  const hw = 3.3, ys = y0 - 0.0;
  S.archGlass(P, M.dark, cx, y0, w, h, -0.9);
  for (const sx of [-1, 1]) P.quad(M.dark, [cx + sx * w / 2, y0, 0.0], [cx + sx * w / 2, y0, -0.9], [cx + sx * w / 2, y0 + h - w / 2, -0.9], [cx + sx * w / 2, y0 + h - w / 2, 0.0], [-sx, 0, 0]);
  P.quad(M.dark, [cx - w / 2, y0, 0], [cx + w / 2, y0, 0], [cx + w / 2, y0, -0.9], [cx - w / 2, y0, -0.9], [0, 1, 0]);
  if (bell) {
    const bh = Math.min(h * 0.4, w * 0.9), by = y0 + h * 0.34;
    P.col(M.bell, cx, -0.5, by, by + bh, w * 0.2, w * 0.39, 12, false);
    P.col(M.bell, cx, -0.5, by + bh, by + bh + 0.1, w * 0.4, w * 0.4, 12, true);
    S.sph(P, M.bell, cx, -0.5, by + 0, w * 0.1, w * 0.1, w * 0.1, 5);
    P.box(M.underside, cx - w / 2, cx + w / 2, by + bh + 0.5, by + bh + 0.8, -0.9, -0.15, '');
  }
  void hw; void ys; void hole;
}

function faceFrame(P, h, fx, fz, fn) { P.push(fx * h, 0, fz * h, Math.atan2(fx, fz)); try { fn(); } finally { P.pop(); } }
const FACES = [[0, 1], [0, -1], [1, 0], [-1, 0]];

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksNikolsky] tower/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  P.push(C0.x, 0, C0.z, ROT);
  P.push(TOWER.mx, 0, TOWER.mz, Math.PI);                                 // door (+z) faces the cathedral at local z = 0
  stage('tier1', () => tier1(P, M));
  stage('tier2', () => tier23(P, M, TIERS.t2, 0.36, 'bell'));
  stage('tier3', () => tier23(P, M, TIERS.t3, 0.3, 'bell'));
  stage('top', () => top(P, M));
  P.pop(); P.pop();
  stage('colliders', () => {
    for (const id of ['r3290835', 'r3290839']) { const rec = L.buildingById(id); if (rec) for (const poly of rec.polys) addPolyColliders(ctx, poly, 0, 75, 1.0); }
  });
  K.svc.tower = { centre: [W(TOWER.mx, TOWER.mz).x, W(TOWER.mx, TOWER.mz).z], height: TIERS.top };
  if (errs.length) throw new Error(errs.join('\n'));
}

function tier1(P, M) {
  const [y0, y1, h] = TIERS.t1, ph = 14.2 / 2;
  // plinth + steps
  P.box(M.blueDeep, -ph, ph, 0, y0, -ph, ph, 'b');
  P.box(M.whiteShade, -ph - 0.1, ph + 0.1, y0 - 0.2, y0, -ph - 0.1, ph + 0.1, 'b');
  for (let k = 0; k < 3; k++) P.box(M.greyGranite, -2.4, 2.4, 0, 0.33 * (3 - k), ph, ph + 0.5 * (3 - k) + 0.0, 'b');
  // walls
  for (const [fx, fz] of FACES) faceFrame(P, h, fx, fz, () => {
    P.quad(M.blue, [-h, y0, 0], [h, y0, 0], [h, y1, 0], [-h, y1, 0], [0, 0, 1], [[0, 0], [h * 2 / 3, 0], [h * 2 / 3, (y1 - y0) / 3], [0, (y1 - y0) / 3]]);
    // white framed panels on the plinth zone (2 each side of the opening)
    for (const sx of [-1, 1]) for (const px of [2.6, 4.1]) { }
    for (const sx of [-1, 1]) P.box(M.whiteShade, sx * 3.7 - 0.9, sx * 3.7 + 0.9, y0 + 0.5, y0 + 2.2, 0, 0.12, 'b');
    if (fz === 1 && fx === 0) {
      // the portal (faces the cathedral)
      S.archGlass(P, M.door, 0, y0 + 0.05, 2.8, 5.2, 0.06);
      S.archFrame(P, M.white, 0, y0 + 0.05, 2.8, 5.2, 0.35, 0, 0.3);
      S.cartouche(P, M, 0, y0 + 6.2, 0.3, 3.4);
      S.rayFan(P, M, 0, y0 + 6.6, 0.3, 2.2, 3.4, 0.4, Math.PI - 0.4, 7, 0.08);
    } else {
      S.archWindow(P, M, 0, y0 + 0.9, 2.4, 5.0, { mat: M.winBarred, crest: true, b: 0.32 });
    }
    // string course under the cornice
    P.box(M.white, -h, h, y1 - 0.6, y1 - 0.35, 0, 0.25, 'b');
  });
  // corner clusters (3 columns each)
  for (const [ax, az] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) pedestalAndCluster(P, M, ax * (h + 0.45), az * (h + 0.45), y0, y1 - 1.0, 3, 0.46, ax, az);
  tierCornice(P, M, h, y1 - 1.0, 1.15, 1.0);
}

function tier23(P, M, tier, R, kind) {
  const [y0, y1, h] = tier;
  const hOpen = (y1 - y0) * 0.5;
  for (const [fx, fz] of FACES) faceFrame(P, h, fx, fz, () => {
    // wall with the arched belfry hole: blue quad ring (a Shape with a hole)
    const ow = h * 0.52, oy = y0 + 2.8, oh = Math.min(5.6, (y1 - y0) - 4.8 + 0.6);
    const outer = [[-h, y0], [h, y0], [h, y1], [-h, y1]], hole = G.archPts(0, oy, ow, oh, 10);
    P.face(M.blue, G.shapeOf(outer, [hole]), 0, 3, 4);
    belfryOpening(P, M, 0, oy, ow, oh, true, true);
    S.archFrame(P, M.white, 0, oy, ow, oh, 0.28, 0, 0.22);
    S.cartouche(P, M, 0, oy + oh + 0.35, 0.22, ow * 1.2);
    S.rayFan(P, M, 0, oy + oh + 0.45, 0.2, 1.3, 2.1, 0.5, Math.PI - 0.5, 5, 0.06);
    // pedestal band at the base: three white panels
    P.box(M.whiteShade, -h, h, y0, y0 + 0.9, 0, 0.3, 'b');
    for (const sx of [-1, 1]) P.quad(M.blueDeep, [sx * h * 0.55 - 0.9, y0 + 0.15, 0.34], [sx * h * 0.55 + 0.9, y0 + 0.15, 0.34], [sx * h * 0.55 + 0.9, y0 + 0.75, 0.34], [sx * h * 0.55 - 0.9, y0 + 0.75, 0.34], [0, 0, 1]);
    P.box(M.white, -h, h, y1 - 0.6, y1 - 0.35, 0, 0.22, 'b');
  });
  // corner column pairs (2 each, set along both faces) and vase finials on the cornice
  for (const [ax, az] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) pedestalAndCluster(P, M, ax * (h + 0.4), az * (h + 0.4), y0 + 0.9, y1 - 1.0, 3, R, ax, az);
  tierCornice(P, M, h, y1 - 1.0, 1.0, 1.0);
  for (const [ax, az] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) S.urn(P, M, ax * (h + 0.7), y1, az * (h + 0.7), 1.2);
  void kind; void hOpen;
}

function top(P, M) {
  const y0 = TIERS.dome1[0];
  // low gold dome on the third-tier cornice (square -> round: the dome base R 3.9)
  P.col(M.blue, 0, 0, y0 - 0.0, y0 + 0.4, 3.9, 3.9, 16, true);
  P.geo(M.gold, goreGeo('tdome1', domeProfile(0.3, 8, 0.08), 8, 0.035, 5), 0, y0 + 0.4, 0, 0, Math.PI / 8, 0, 3.6, 3.7, 3.6);
  const yl = y0 + 0.4 + 3.7 * 0.96;
  // balustrade ring at the foot of the clock tier
  const yb = yl + 0.1, bal = 2.6;
  P.col(M.white, 0, 0, yb, yb + 0.25, bal, bal, 8, true);
  for (let i = 0; i < 16; i++) { const a = i * TAU / 16; P.col(M.white, Math.sin(a) * bal * 0.92, Math.cos(a) * bal * 0.92, yb + 0.25, yb + 1.0, 0.08, 0.08, 5, false); }
  P.col(M.white, 0, 0, yb + 1.0, yb + 1.15, bal, bal, 8, true);
  // the clock tier: octagon with four dials (face centres on the cardinal directions)
  const yc0 = yb + 1.15, yc1 = TIERS.clock[1] + (yl - TIERS.dome1[1]) * 0 + 0.0, R = 2.35, a0 = -Math.PI / 8, apo = R * Math.cos(Math.PI / 8);
  G.frustum(P, M.blue, 0, 0, yc0, yc1, 8, R, R, a0, 2, 2);
  for (let i = 0; i < 8; i++) {
    const t = a0 + i * TAU / 8, tm = t + TAU / 16;
    P.push(Math.sin(t) * R, 0, Math.cos(t) * R, t);
    P.box(M.white, -0.18, 0.18, yc0, yc1 - 0.3, -0.18, 0.18, 'b');
    P.pop();
    P.push(Math.sin(tm) * apo, 0, Math.cos(tm) * apo, tm);
    if (i % 2 === 0) {
      // dial (white, 2.2 m) + arched window below + scroll brackets
      const g = new THREE.CircleGeometry(1.1, 20), ua = g.attributes.uv, pa = g.attributes.position;
      for (let k = 0; k < pa.count; k++) ua.setXY(k, (pa.getX(k) + 1.1) / 2.2, (pa.getY(k) + 1.1) / 2.2);
      P.geo(M.clock, g, 0, yc1 - 2.7, 0.06); g.dispose();
      const rg = new THREE.RingGeometry(1.1, 1.3, 20); P.geo(M.white, rg, 0, yc1 - 2.7, 0.07); rg.dispose();
      S.archWindow(P, M, 0, yc0 + 0.6, 0.9, 2.2, { mat: M.win12, b: 0.14, sill: false });
      S.volute(P, M.white, -1.15, yc1 - 1.0, 0.1, 0.35, 0.3, Math.PI * 1.5);
      S.volute(P, M.white, 1.15, yc1 - 1.0, 0.1, 0.35, 1.3, Math.PI * 1.5);
    }
    P.pop();
  }
  G.frustum(P, M.white, 0, 0, yc1, yc1 + 0.45, 8, R * 1.18, R * 1.18, a0, 1, 1);
  G.frustum(P, M.whiteShade, 0, 0, yc1 + 0.45, yc1 + 0.7, 8, R * 1.1, R * 0.95, a0, 1, 1);
  P.cap(M.white, G.ngon(8, R * 1.18, a0), yc1 + 0.45, true, 3);
  // second gold dome, gilded onion, needle spire, orb and cross
  const yd = yc1 + 0.7;
  P.geo(M.gold, goreGeo('tdome2', domeProfile(0.28, 8, 0.06), 8, 0.04, 4), 0, yd, 0, 0, Math.PI / 8, 0, 2.5, 2.1, 2.5);
  const yo = yd + 2.1 * 0.96;
  P.col(M.goldFlat, 0, 0, yo - 0.1, yo + 0.3, 0.9, 0.7, 10, true);
  const oh = TIERS.onion[1] - TIERS.onion[0];
  P.geo(M.gold, goreGeo('tonion', [[0.30, 0], [0.55, 0.04], [0.82, 0.16], [1.0, 0.34], [1.06, 0.55], [0.98, 0.76], [0.78, 0.98], [0.5, 1.2], [0.24, 1.42], [0.08, 1.62], [0.0, 1.72]].map(([r, y]) => [r, y / 1.72]), 8, 0.06, 4), 0, yo + 0.25, 0, 0, 0, 0, 1.25, oh * 0.95, 1.25);
  const ys0 = yo + 0.25 + oh * 0.95 - 0.5;
  P.cyl(M.goldFlat, [0, ys0, 0], [0, ys0 + 10.6, 0], 0.55, 0.06, 8, false);                 // needle
  S.sph(P, M.goldFlat, 0, ys0 + 5.0, 0, 0.28, 0.4, 0.28, 8);
  S.sph(P, M.goldFlat, 0, ys0 + 10.65, 0, 0.2, 0.2, 0.2, 8);
  crossGold(P, M, 0, ys0 + 10.8, 0, 3.0, 0);
}
