// landmarksC/palace.js - the Beloselsky-Belozersky Palace, Nevsky 41 (A. I. Stackenschneider 1847-48, Russian neo-baroque after Rastrelli; OSM relation r1588865; photos refs/fontanka 04 21 22 23 55 62).
// Coral-pink stucco (#d98671) with cream pilasters and heavy stucco window frames (#ecdfc6), a rusticated ground floor with square-headed windows and ten white ATLANTES, a piano-nobile
// storey with tall arched windows in the five-bay centre risalit (segmental pediment with a cartouche and three oculi, top ~19.8 m) and cream pilaster pairs, rectangular windows with
// hoods and cartouches in the wings, two corner pavilions with triangular pediments, balustrades over the cornice (cornice +14.3 m), grey sheet roof #7b8691, red-brick chimneys.
// The long Nevsky front (81 m) faces north, the Fontanka front (46 m) west; the other faces are plain (garden / courtyards).  Heights from the research, NOT from OSM.
import { buildHouse } from './house.js';
import { findEdge } from './kit.js';

const HC = 14.0, GF = 4.8, TOP = 13.0, UP = 0.45;
const WALL = '#e39a8e', COURT = '#e8b0a0', ROOF = '#7b8691', BRICK = '#b4523c';

export function build(K) {
  const L = K.L, P = K.P, M = K.mats;
  const recs = L.groupMembers('beloselsky').filter((r) => !r.skip);
  K.svc.houses.push({ id: 'r1588865', name: 'Дворец Белосельских-Белозерских', nameEn: 'Beloselsky-Belozersky Palace, Nevsky 41', x: -374, z: -30 });
  K.svc.photoSpots.push({ x: -392, z: -76, yaw: L.yawToward(-392, -76, -380, -48), pitch: 6, name: 'Дворец Белосельских-Белозерских' });
  const is = (e, ax, az, bx, bz) => !!findEdge([e], ax, az, bx, bz, 0.5);
  const nevsky = (e) => is(e, -403.7, -64.6, -325.2, -44), fontanka = (e) => is(e, -425, -18.9, -408.1, -62.1), corner = (e) => is(e, -408.1, -62.1, -403.7, -64.6);
  buildHouse(K, {
    recs, hc: HC, wall: WALL, court: COURT, plinth: 0.9, floors: [4.6, 5.4, 4.4], cornice: 'none', roofMat: K.mat(ROOF), upstand: UP, plinthMat: M.graniteWarm, courtPitch: 3.6, railing: false,
    front: (e, c) => {
      if (nevsky(e)) { nevskyFront(K, c.len); return true; }
      if (fontanka(e)) { fontankaFront(K, c.len); return true; }
      if (corner(e)) { cornerBay(K, c.len); return true; }
      return false;
    },
  });
  // chimneys of red brick on the roof
  const chim = [[-398, -46], [-392, -44], [-369, -37], [-348, -31], [-410, -28]];
  for (const [x, z] of chim) { if (!L.insideBuilding(x, z)) continue; P.box(K.mat(BRICK), x - 0.6, x + 0.6, HC + UP, HC + UP + 3.2, z - 0.6, z + 0.6, 'b'); P.box(M.cream, x - 0.75, x + 0.75, HC + UP + 3.2, HC + UP + 3.4, z - 0.75, z + 0.75, 'b'); }
}

// ------------------------------------------------------------------------------------------------ elements
const BALL = null;
/** a white atlas (male figure ~3.9 m tall) carrying the string course, at x */
function atlas(K, x) {
  const P = K.P, m = K.mats.cream;
  P.box(m, x - 0.36, x + 0.36, 0.9, 1.4, 0.0, 0.5, 'kb');
  P.cyl(m, [x, 1.4, 0.3], [x, 3.0, 0.3], 0.3, 0.2, 8, false);
  P.box(m, x - 0.3, x + 0.3, 3.0, 3.85, 0.1, 0.5, 'kb');
  P.geo(m, K.ballGeo ||= new K.THREE.SphereGeometry(1, 8, 6), x, 4.12, 0.3, 0, 0, 0, 0.17, 0.2, 0.17);
  for (const s of [-1, 1]) { P.cyl(m, [x + s * 0.33, 3.65, 0.34], [x + s * 0.42, 4.3, 0.34], 0.09, 0.08, 6, false); P.cyl(m, [x + s * 0.42, 4.3, 0.34], [x + s * 0.3, 4.52, 0.36], 0.08, 0.07, 6, false); }
  P.box(m, x - 0.52, x + 0.52, 4.45, 4.8, 0.0, 0.64, 'kb');
}
/** zone elevation: rusticated ground floor with windows, string course, upper storey */
function groundFloor(K, x0, x1, o = {}) {
  const P = K.P, M = K.mats, n = Math.max(1, Math.round((x1 - x0) / (o.pitch ?? 5.4))), p = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + p * (i + 0.5);
    K.window({ x, y: 1.25, w: 1.25, h: 2.3, sw: 0.2, d: 0.09, frame: 'white', surMat: M.cream, sillMat: M.cream, sill: true });
    K.plane(K.R.shell, x - 0.55, x + 0.55, 3.75, 4.35, 0.05);
  }
  void P;
}
function stringCourse(K, x0, x1, z = 0.22) {
  const P = K.P, M = K.mats;
  P.box(M.cream, x0, x1, GF - 0.18, GF + 0.18, 0, z, 'k');
  P.box(M.cream, x0, x1, GF + 0.18, GF + 0.3, 0, z - 0.08, 'k');
}
function entablature(K, x0, x1, proj = 0.62) {
  const P = K.P, M = K.mats;
  P.box(M.cream, x0, x1, TOP, TOP + 0.5, 0, 0.42, 'k');
  P.box(M.trim, x0, x1, TOP + 0.5, TOP + 0.9, 0.04, 0.32, 'k');
  P.box(M.cream, x0 - 0.1, x1 + 0.1, TOP + 0.9, TOP + 1.3, 0, proj, 'k');
}
function pilasterPair(K, x, y0 = GF + 0.3, y1 = TOP) {
  const M = K.mats, P = K.P;
  for (const s of [-1, 1]) K.pilaster(M.cream, x + s * 0.42, 0.42, y0, y1, 0.2, 0.5);
  void P;
}
function wingBays(K, x0, x1) {
  const M = K.mats, n = Math.max(1, Math.round((x1 - x0) / 5.4)), p = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + p * (i + 0.5);
    K.window({ x, y: GF + 1.5, w: 1.3, h: 3.4, sw: 0.22, d: 0.1, hood: i % 2 ? 'tri' : 'seg', hoodH: 0.4, hoodOver: 0.12, frame: 'white', surMat: M.cream, sill: false });
    K.balustrade(x - 1.0, x + 1.0, GF + 0.3 + 0.5, 0.62, 0.3, M.cream);
    K.plane(K.R.cartouche, x - 0.6, x + 0.6, GF + 6.0, GF + 7.9, 0.05);
  }
  for (let i = 0; i <= n; i++) pilasterPair(K, x0 + p * i, GF + 0.3, TOP - 0.05);
}
function oculus(K, x, y, r = 0.5) {
  const M = K.mats, P = K.P;
  P.cyl(M.cream, [x, y, 0.0], [x, y, 0.14], r + 0.22, r + 0.22, 12, true);
  P.cyl(K.mats.winWhite, [x, y, 0.15], [x, y, 0.17], r, r, 12, true);
  P.cyl(M.ironSoft, [x, y, 0.17], [x, y, 0.19], r * 0.92, r * 0.92, 12, true);
}
function solidProjection(K, x0, x1, depth) {
  const centre = new K.THREE.Vector3((x0+x1)/2,0,depth/2).applyMatrix4(K.P.m);
  const axis = new K.THREE.Vector3(1,0,0).transformDirection(K.P.m);
  K.ctx.physics.addBox(centre.x,centre.z,x1-x0,depth,Math.atan2(-axis.z,axis.x),0,TOP+1.3);
}
function pavilion(K, x0, x1, pediment = true) {
  const P = K.P, M = K.mats, mid = (x0 + x1) / 2, w = x1 - x0, pz = 0.8;
  solidProjection(K,x0,x1,pz);
  P.box(K.wall(WALL), x0, x1, 0, TOP + 1.3, 0, pz, 'kb');                                   // the projecting prism
  P.box(K.rust(WALL), x0 - 0.02, x1 + 0.02, 0.9, GF, pz - 0.02, pz + 0.02, 'kbtlr');         // (rusticated skin of the ground floor)
  P.push(0, 0, pz, 0);
  groundFloor(K, x0 + 0.6, x1 - 0.6, { pitch: 3.6 });
  stringCourse(K, x0 - 0.1, x1 + 0.1, 0.24);
  entablature(K, x0 - 0.05, x1 + 0.05, 0.7);
  K.window({ x: mid, y: GF + 1.3, w: 2.0, h: 5.2, head: 'arch', sw: 0.3, d: 0.12, frame: 'white', surMat: M.cream, sill: false });
  K.balustrade(mid - 1.4, mid + 1.4, GF + 0.3 + 0.4, 0.62, 0.3, M.cream);
  for (const s of [-1, 1]) K.pilaster(M.cream, mid + s * (w / 2 - 0.5), 0.55, GF + 0.3, TOP - 0.05, 0.22, 0.5);
  if (pediment) {
    const sh = new K.THREE.Shape(); sh.moveTo(x0 - 0.05, TOP + 1.3); sh.lineTo(x1 + 0.05, TOP + 1.3); sh.lineTo(mid, TOP + 1.3 + 3.2); sh.lineTo(x0 - 0.05, TOP + 1.3);
    P.extrude(M.cream, sh, 0, 0.5, 1, 4);
    const sh2 = new K.THREE.Shape(); sh2.moveTo(x0 + 0.5, TOP + 1.42); sh2.lineTo(x1 - 0.5, TOP + 1.42); sh2.lineTo(mid, TOP + 1.3 + 2.6); sh2.lineTo(x0 + 0.5, TOP + 1.42);
    P.face(K.wall(WALL), sh2, 0.52, 3);
    oculus(K, mid, TOP + 2.55, 0.5);
  }
  atlas(K, x0 + 0.6); atlas(K, x1 - 0.6);
  P.pop();
}
function centre(K, x0, x1) {
  const P = K.P, M = K.mats, n = 5, p = (x1 - x0) / n, pz = 0.6;
  solidProjection(K,x0,x1,pz);
  P.box(K.wall(WALL), x0, x1, 0, TOP + 1.3, 0, pz, 'kb');
  P.push(0, 0, pz, 0);
  groundFloor(K, x0 + 0.8, x1 - 0.8, { pitch: p });
  stringCourse(K, x0 - 0.05, x1 + 0.05, 0.26);
  entablature(K, x0 - 0.1, x1 + 0.1, 0.7);
  for (let i = 0; i < n; i++) {
    const x = x0 + p * (i + 0.5);
    K.window({ x, y: GF + 1.0, w: 1.55, h: 4.9, head: 'arch', sw: 0.3, d: 0.12, frame: 'white', surMat: M.cream, sill: false });
    K.balustrade(x - 1.05, x + 1.05, GF + 0.3 + 0.4, 0.62, 0.3, M.cream);
    K.plane(K.R.shell, x - 0.85, x + 0.85, GF + 6.1, GF + 7.4, 0.12);
    K.plane(K.R.cartouche, x - 0.55, x + 0.55, GF + 6.6, GF + 8.0 - 0.15, 0.0);
  }
  for (let i = 0; i <= n; i++) pilasterPair(K, x0 + p * i, GF + 0.3, TOP - 0.05);
  // attic with three oculi and the segmental pediment (cartouche in the tympanum)
  const ya = TOP + 1.3, mid = (x0 + x1) / 2;
  P.box(K.wall(WALL), x0 + 0.5, x1 - 0.5, ya, ya + 3.0, -0.4, 0.0, 'bk');
  for (const dx of [-p * 1.1, 0, p * 1.1]) oculus(K, mid + dx, ya + 1.4, 0.5);
  const sh = new K.THREE.Shape(); sh.moveTo(x0 + 0.4, ya + 3.0); sh.quadraticCurveTo(mid, ya + 3.0 + 2.6 * 2 - 0.4, x1 - 0.4, ya + 3.0); sh.lineTo(x0 + 0.4, ya + 3.0);
  P.extrude(M.cream, sh, -0.5, 0.5, 1, 10);
  const sh2 = new K.THREE.Shape(); sh2.moveTo(x0 + 1.0, ya + 3.0 + 0.12); sh2.quadraticCurveTo(mid, ya + 3.0 + 2.6 * 2 - 1.4, x1 - 1.0, ya + 3.0 + 0.12); sh2.lineTo(x0 + 1.0, ya + 3.0 + 0.12);
  P.face(K.wall(WALL), sh2, 0.02, 3, 10);
  K.plane(K.R.coat, mid - 1.2, mid + 1.2, ya + 3.15, ya + 5.0, 0.04);
  for (let i = 0; i <= n; i++) atlas(K, x0 + p * i + (i === 0 ? 0.55 : i === n ? -0.55 : 0));
  P.pop();
}
function roofBehind(K, x0, x1, depth = 7) {
  const P = K.P, y0 = HC + UP, rise = 3.0;
  P.quad(K.mat(ROOF), [x0, y0, -0.45], [x1, y0, -0.45], [x1, y0 + rise, -depth], [x0, y0 + rise, -depth], [0, depth, rise]);
  P.quad(K.mat(ROOF), [x1, y0, -depth], [x0, y0, -depth], [x0, y0 + rise, -depth], [x1, y0 + rise, -depth], [0, 0, -1]);
}

// ------------------------------------------------------------------------------------------------ the fronts
function nevskyFront(K, len) {
  const P = K.P, M = K.mats;
  K.wallQuad(K.wall(WALL), 0, len, GF, HC + UP, 3);
  K.wallQuad(K.rust(WALL), 0, len, 0, GF, 2.4, 0, 1.2);
  const pv = 9.6, wl = 16.2, c0 = pv + wl, c1 = len - pv - wl;
  groundFloor(K, pv, c0); groundFloor(K, c1, len - pv);
  stringCourse(K, pv, c0); stringCourse(K, c1, len - pv);
  entablature(K, pv, c0); entablature(K, c1, len - pv);
  wingBays(K, pv, c0); wingBays(K, c1, len - pv);
  K.balustrade(pv, c0, HC + 0.3, 1.1, 0.3, M.cream); K.balustrade(c1, len - pv, HC + 0.3, 1.1, 0.3, M.cream);
  pavilion(K, 0, pv); pavilion(K, len - pv, len);
  centre(K, c0, c1);
  roofBehind(K, pv, c0); roofBehind(K, c1, len - pv); roofBehind(K, c0, c1, 9); roofBehind(K, 0, pv, 5); roofBehind(K, len - pv, len, 5);
  for (const x of [0.6, len - 0.6]) K.downpipe(x, 0.9, HC - 1.0, M.cream);
}
function fontankaFront(K, len) {
  const P = K.P, M = K.mats;
  K.wallQuad(K.wall(WALL), 0, len, GF, HC + UP, 3);
  K.wallQuad(K.rust(WALL), 0, len, 0, GF, 2.4, 0, 1.2);
  const pv = 9.6;
  groundFloor(K, pv, len - 1.2); stringCourse(K, pv, len);
  entablature(K, pv, len); wingBays(K, pv, len - 1.2);
  K.balustrade(pv, len, HC + 0.3, 1.1, 0.3, M.cream);
  pavilion(K, 0, pv);
  roofBehind(K, pv, len, 6); roofBehind(K, 0, pv, 5);
  K.downpipe(len - 0.5, 0.9, HC - 1.0, M.cream);
  void P;
}
/** the 5 m chamfer between the two fronts: one tall arched window over the ground floor, atlas at the corner */
function cornerBay(K, len) {
  const P = K.P, M = K.mats;
  K.wallQuad(K.wall(WALL), 0, len, GF, HC + UP, 3);
  K.wallQuad(K.rust(WALL), 0, len, 0, GF, 2.4, 0, 1.2);
  K.window({ x: len / 2, y: 1.25, w: 1.25, h: 2.3, sw: 0.2, d: 0.09, frame: 'white', surMat: M.cream });
  stringCourse(K, 0, len); entablature(K, 0, len);
  K.window({ x: len / 2, y: GF + 1.3, w: 1.6, h: 5.0, head: 'arch', sw: 0.28, d: 0.12, frame: 'white', surMat: M.cream, sill: false });
  K.balustrade(0, len, HC + 0.3, 1.1, 0.3, M.cream);
  void P;
}
void BALL;
