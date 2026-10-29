// landmarksPribaltiyskaya/kirov.js - the MEMORIAL TO THE CRUISER "KIROV" (Памятник крейсеру «Киров», 1990; M. V. Kruglov, V. N. Sokolov, A. B. Korolkov, V. A. Reppo; OSM n1352795088 + r7692261 + w536759933 / 34 / 38 + nodes of
// the anchors n5198972326 / 29 and propellers n5198972327 / 28): a +0.55 m granite PLATFORM paved in a grid of pale strips on dark setts, the bronze oak-and-laurel WREATH on its pale granite disc, the two triple 180 mm TURRETS
// (silent static props, 35 / 30 deg), the semicircular granite WALL (1.3 m) with the two niches of six 180 mm shells, two bronze PROPELLERS and two ANCHORS on granite plinths.  Dossier docs/research/pribaltiyskaya.md section 8
// ([C13] disc 4.9 m, wreath 3.4 m, wall 1.3 m, niche 1.1 m clear width, propeller d 3.0 m on a 3.2 m plinth, turret 4.9 m, the bronze plaque), photos 44 45 46 47 48 49 50 52 53.  Frame KF (frame.js): local +z = toward the college.
// A calm place: no people inside the wall arc, nothing alarming; the guns point at the wreath, never fire.
import * as THREE from 'three';
import * as L from '../layout.js';
import { AREAS } from '../data/city.js';
import { KF, KY, TURRETS, WALL_ARC, coverFn } from './frame.js';
import { boxF, walkF, wallPart, edgesOf } from './ring.js';
import { onEdge } from './kit.js';
import { kBays } from './inst.js';
import { unitBox } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, 15.v): the granite wall arc is a row of breakable bays
import { Sculpt, figureMats, cached, loopPts, hash1 } from '../lib/figures.js';

const TAU = Math.PI * 2, PLAT = KY.plat, WALL_H = KY.wall;
const NICHES = [[24.55, 10.5], [-24.55, 10.5]];
const PROPS = [{ x: 51.1, z: -2.3 }, { x: -50.3, z: -0.7 }], ANCHORS = [{ x: -29.8, z: 46.9 }, { x: 32.5, z: 46.4 }];
const DISC_TOP = PLAT + 0.28;

/** the platform polygon in frame KF: [{ o: [[a, b]..], h: [[[a, b]..]..] }] from the baked relation r7692261 */
function platformRings() {
  const rec = AREAS.find((a) => a.id === 'r7692261');
  const conv = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) { const q = KF.M(flat[i], flat[i + 1]); r.push([q.a, q.b]); } return r; };
  if (rec && rec.polys && rec.polys[0]) return { o: conv(rec.polys[0].o), h: rec.polys[0].h.map(conv) };
  return { o: [[-34.2, 0.7], [-5.9, 0.6], [5.6, 0.6], [36.2, 0.5], [36.2, 7.0], [26.7, 7.1], [26.7, 34.3], [37.4, 34.3], [37.4, 55.4], [-34.3, 55.7], [-34.3, 34.6], [-25.7, 34.5], [-25.8, 7.3], [-34.2, 7.3]], h: [] };
}

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksPribaltiyskaya] kirov/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = K.P, M = K.M, mk = figureMats(K.ctx).keys('bronze', 'bronze');
  const rings = platformRings(), cover = coverFn(K.ctx);
  P.push(KF.x, 0, KF.z, KF.rot);
  try {
    stage('platform', () => platform(P, M, rings, cover));
    stage('niches', () => niches(P, M));
    TURRETS.forEach((t, i) => stage('turret' + i, () => turret(P, M, t, i)));
    stage('wreath', () => wreath(P, M, mk));
    stage('props', () => props(P, M, mk, cover));
  } finally { P.pop(); }
  stage('wall', () => wallArc(K, M));
  stage('colliders', () => colliders(K));
  stage('services', () => services(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the platform: grid paving (a square of setts centred on the wreath), edge walls, three granite steps on the straight south-west edges
function platform(P, M, rings, cover) {
  // the paving grid is drawn in a frame shifted by (-4.2, -4.2) so that a 5.6 m square of setts is centred on the disc (strips 1.4 m on a 7 m pitch)
  const SH = 4.2, sh = (r) => r.map(([a, b]) => [a + SH, b + SH]);
  P.push(-SH, 0, -SH, 0);
  P.cap(M.kpave, sh(rings.o), PLAT, true, 7, rings.h.map(sh));
  P.pop();
  for (const e of edgesOf(rings.o)) {
    wallPart(P, M.kwall, e, 0, e.len, 0, PLAT, 1 / 2.4, 1 / 1.3);                                     // the 0.55 m granite curb all round
    if (e.n[1] < -0.9 && e.len > 8) {                                                                // the straight south-west edges: three steps of 0.18 m, 0.4 m deep, laid OUTSIDE the edge (clear of the footway)
      const mid = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2], clear = [0, 0.5, 1.0, 1.4].every((d) => { const w = KF.W(mid[0] + e.n[0] * d, mid[1] + e.n[1] * d); return cover(w.x, w.z) < -0.5; });
      if (!clear) continue;
      onEdge(P, e, (len) => { for (let k = 0; k < 3; k++) { const d0 = 0.4 * (2 - k), d1 = d0 + 0.4, h = 0.18 * (k + 1); P.box(M.kcap, 0, len, 0, h, d0 + 0.0001, d1, 'kb', 2); } });
    }
  }
}

// ------------------------------------------------------------------------------------------------ the semicircular granite wall: centre (0.5, 11.5), r 24.5, thickness 0.5, 1.3 m high on the platform
// n4spb (docs/AREAS.md 13.7, 15.v): the wall is 30 BREAKABLE BAYS (knockBays: a thin box collider, the drawn section and a knock record each; the source drew it as static quads and 30 solid boxes). A section is a straight chord of
// the arc, 0.5 m thick (z -0.25 .. 0.25 about the arc), foot at the platform (PLAT), 1.3 m high with a cap strip; the bay frame turns with the chord, the +0.04 m inset overlap closes the mitres between neighbours.
function wallArc(K, M) {
  const { cx, cz, r } = WALL_ARC, n = 30, ro = r + 0.25;
  const bays = [];
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI, a1 = (i + 1) / n * Math.PI;
    const p0 = KF.W(cx + Math.cos(a0) * r, cz + Math.sin(a0) * r), p1 = KF.W(cx + Math.cos(a1) * r, cz + Math.sin(a1) * r);
    bays.push({ x0: p0.x, z0: p0.z, x1: p1.x, z1: p1.z, y: 0 + PLAT, len: ro * (a1 - a0) });
  }
  const side = unitBox(0, WALL_H, -0.25, 0.25, { uLen: ro * Math.PI / n * 1.3 / 2.4, uvs: 1.3 });            // texture: one granite tile per 2.4 m along the wall, per 1.3 m up (the source uv)
  const cap = unitBox(WALL_H, WALL_H + 0.004, -0.25, 0.25, { uLen: 1, uvs: 1 });
  kBays(K, { name: 'lmprib-kirov-wall', bays, far: 320,
    parts: [{ geo: side, mat: M.kwall, name: 'wall', stretch: true, inset: -0.04 }, { geo: cap, mat: M.kcap, name: 'cap', stretch: true, inset: -0.04 }],
    collider: { y0: 0, y1: PLAT + WALL_H + 1, thick: 0.7, e0: 0.15, e1: 0.15 },
    rec: () => ({ kind: 'fence', mass: 1500, h: WALL_H, anchored: 30, hitK: 0.5, metal: false, minDv: 0 }) });
}

// ------------------------------------------------------------------------------------------------ the two shell niches at the wall ends: granite jambs, a lintel, a 0.2 m step, six 180 mm shells (d 0.18, 0.9 m, ogive nose)
function niches(P, M) {
  const shell = () => { const g = new THREE.ConeGeometry(0.09, 0.26, 10); return g; };
  for (const [cx, cz] of NICHES) {
    P.push(cx, PLAT, cz, 0);
    P.box(M.niche, -1.2, -0.55, 0, 1.9, -0.9, 0.9, '', 2); P.box(M.niche, 0.55, 1.2, 0, 1.9, -0.9, 0.9, '', 2);                 // jambs
    P.box(M.niche, -0.55, 0.55, 1.4, 1.9, -0.9, 0.9, '', 2); P.box(M.niche, -0.55, 0.55, 0, 1.4, 0.4, 0.9, 'k', 2);              // lintel, back
    P.box(M.niche, -0.55, 0.55, 0, 0.05, -0.9, 0.4, 't', 2);                                                                    // the floor of the recess
    P.box(M.niche, -0.7, 0.7, 0, 0.2, -1.25, -0.9, 'k', 2); P.box(M.kcap, -1.25, 1.25, 1.9, 2.0, -0.95, 0.95, 'b', 2);          // the step, the cap slab
    for (let k = 0; k < 6; k++) {
      const x = -0.425 + k * 0.17, z = -0.05;
      P.cyl(M.shell, [x, 0.05, z], [x, 0.66, z], 0.09, 0.09, 10, true); P.cyl(M.shellBand, [x, 0.44, z], [x, 0.5, z], 0.095, 0.095, 10, false);
      const g = shell(); P.geo(M.shell, g, x, 0.79, z); g.dispose();
    }
    P.pop();
  }
}

// ------------------------------------------------------------------------------------------------ a triple 180 mm turret: concrete plinth ring d 7.8 (0.75 m), barbette d 6.4 (1.0 m), the sloping body (2.05 m), a flat roof with two hoods, the counterweight box, three barrels raised toward the wreath
function turret(P, M, t, idx) {
  const { x, z } = t, y0 = PLAT, yb = y0 + 0.75, yt = yb + 1.0, yr = yt + 2.05;
  P.cyl(M.ring, [x, 0, z], [x, yb, z], 3.9, 3.9, 24, true);                                           // the plinth ring (also fills the hole of the platform)
  P.cyl(M.turretLit, [x, yb, z], [x, yt, z], 3.2, 3.2, 24, false);
  P.cyl(M.turretDark, [x, yb + 0.45, z], [x, yb + 0.55, z], 3.23, 3.23, 24, false);                   // the rivet band
  P.cyl(M.turretDark, [x, yt - 0.04, z], [x, yt + 0.06, z], 3.24, 3.24, 24, false);                   // the rotating-ring seam
  P.cyl(M.turret, [x, yt, z], [x, yr, z], 3.1, 1.75, 20, true);                                       // the sloping body
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; P.cyl(M.turretDark, [x + Math.sin(a) * 2.7, yt + 0.55, z - Math.cos(a) * 2.7], [x + Math.sin(a) * 2.55, yt + 0.8, z - Math.cos(a) * 2.55], 0.04, 0.04, 4, false); }
  for (const hx of [-0.8, 0.9]) P.cyl(M.turretDark, [x + hx, yr, z + 0.6], [x + hx, yr + 0.5, z + 0.6], 0.25, 0.22, 10, true);          // two periscope hoods
  P.box(M.turretDark, x - 0.95, x + 0.95, yt + 0.9, yr + 0.0, z + 2.1, z + 4.4, '', 2);              // the rear counterweight box
  P.box(M.turretDark, x - 1.8, x + 1.8, yt + 0.7, yt + 2.1, z - 3.0, z - 2.0, '', 2);                // the gun mantlet
  const ang = t.pitch, d = [0, Math.sin(ang), -Math.cos(ang)], y = yt + 1.5;
  for (const bx of [-1.0, 0, 1.0]) {
    const a = [x + bx, y, z - 3.0], b = [a[0], a[1] + d[1] * 9.5, a[2] + d[2] * 9.5];
    P.cyl(M.turret, a, [a[0], a[1] + d[1] * 2.2, a[2] + d[2] * 2.2], 0.275, 0.2, 10, true);
    P.cyl(M.turretLit, [a[0], a[1] + d[1] * 2.2, a[2] + d[2] * 2.2], b, 0.2, 0.15, 10, true);
    P.cyl(M.turretDark, [b[0], b[1] - d[1] * 0.35, b[2] - d[2] * 0.35], b, 0.17, 0.17, 10, false);       // the muzzle ring
  }
  // the bronze plaque 0.7 x 0.95 m on the lower right front of the body (seen from the wreath: toward -x), tilted with the cone
  const phi = 35 * Math.PI / 180, rr = 3.1 - (yb + 1.0 + 0.55 + 0.7 - yt) / 2.05 * 1.35, nh = [-Math.sin(phi), 0, -Math.cos(phi)];
  const nrm = [nh[0], 0.659, nh[2]], nl = Math.hypot(...nrm); nrm[0] /= nl; nrm[1] /= nl; nrm[2] /= nl;
  const up = [-0.659 * nh[0], 1, -0.659 * nh[2]], ul = Math.hypot(...up); up.forEach((v, i) => { up[i] = v / ul; });
  const rt = [-(nrm[1] * up[2] - nrm[2] * up[1]), -(nrm[2] * up[0] - nrm[0] * up[2]), -(nrm[0] * up[1] - nrm[1] * up[0])];
  const c = [x + nh[0] * rr + nrm[0] * 0.04, yt + 0.55 + 0.7 + nrm[1] * 0.04, z + nh[2] * rr + nrm[2] * 0.04];
  const q = (sr, su) => [c[0] + rt[0] * sr * 0.35 + up[0] * su * 0.475, c[1] + rt[1] * sr * 0.35 + up[1] * su * 0.475, c[2] + rt[2] * sr * 0.35 + up[2] * su * 0.475];
  P.quad(M.plaque, q(-1, -1), q(1, -1), q(1, 1), q(-1, 1), nrm, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  void idx;
}

// ------------------------------------------------------------------------------------------------ the wreath: a cast bronze oak-and-laurel ring (outer d 3.4, inner 2.2, 0.6 m) on four ball feet on a pale granite disc d 4.9 (0.28 m, three slabs)
const oz0 = (rz, th) => rz * 0.3 * Math.cos(th);
const wreathFig = () => cached('lmprib-wreath', () => {
  const S = new Sculpt({ detail: 1 }), ring = loopPts([0, 0, 0], [0, 1, 0], 1.4, 1.4, 24);
  S.tube('main', ring, [[0.3, 0.27]], { closed: true, seg: 14, rings: 120, ref: [0, 1, 0], bump: (t, th) => 1 + 0.08 * Math.sin(t * TAU * 30 + th * 2) + 0.05 * Math.sin(t * TAU * 61 + th * 5) });
  // oak and laurel leaves: flattened lobed blobs lying along the ring, tilted outward / upward, 3 per ring station
  for (let i = 0; i < 132; i++) {
    const a = i / 132 * TAU + hash1(i) * 0.03, th = hash1(i + 400) * 1.7 + (i % 2 ? 0.9 : -0.9), tx = -Math.sin(a), tz = Math.cos(a), rx = Math.cos(a), rz = Math.sin(a);
    const ox = rx * 0.3 * Math.cos(th), oy = 0.27 * Math.sin(th) + 0.02, c = [rx * 1.4 + ox, oy, rz * 1.4 + rx * 0 + oz0(rz, th)];
    const sn = Math.sin(th), cs = Math.cos(th), ct = [-sn * rx, cs, -sn * rz], jit = hash1(i + 80) * 0.35, dir = [ct[0] + tx * jit, ct[1], ct[2] + tz * jit];       // review: the leaf lies ON the tube (width along the cross-section, length along the ring: no spikes)
    S.blob('main', [c[0], c[1], c[2]], [0.17, 0.028, 0.1], { dir, ref: [tx, 0, tz], w: 7, h: 5 });
  }
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU + 0.1; S.blob('main', [Math.cos(a) * 1.4 + Math.sin(a * 5) * 0.12, 0.2 + 0.1 * Math.cos(a * 3), Math.sin(a) * 1.4], [0.075, 0.075, 0.09], { w: 7, h: 5 }); }          // acorns / berries
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; S.blob('main', [Math.cos(a) * 1.4, -0.4, Math.sin(a) * 1.4], [0.135, 0.135, 0.135], { w: 10, h: 7 }); }                          // the ball feet
  return S.finish({});
});
function wreath(P, M, mk) {
  P.cyl(M.disc, [0, PLAT, 0], [0, DISC_TOP, 0], 2.45, 2.45, 40, true);
  for (const a of [0.4, 0.4 + TAU / 3, 0.4 + 2 * TAU / 3]) { P.push(0, DISC_TOP + 0.004, 0, a); P.box(M.kwall, -0.015, 0.015, 0, 0.005, 0, 2.45, '', 1); P.pop(); }
  wreathFig().place(P, { main: M.bronzeDark, dark: mk.dark, accent: M.bronzeDark }, 0, DISC_TOP + 0.55, 0, 0, 1);
}

// ------------------------------------------------------------------------------------------------ the propellers (three blades d 3.0 m, ogive hub, axis tilted 35 deg up toward the road) on light grey granite plinths, and the stockless anchors
const propFig = () => cached('lmprib-prop', () => {
  const S = new Sculpt({ detail: 1 });
  S.push(0, 0, 0, -35 * Math.PI / 180, Math.PI, 0);
  S.tube('main', [[0, 0, -0.1], [0, 0, 0.2], [0, 0, 0.55], [0, 0, 0.78]], [[0.3, 0.3], [0.32, 0.32], [0.2, 0.2], [0.02, 0.02]], { seg: 12, per: 3, ref: [1, 0, 0] });
  S.tube('main', loopPts([0, 0, 0.03], [0, 0, 1], 0.33, 0.33, 12), [[0.045, 0.045]], { closed: true, seg: 6, rings: 24, ref: [0, 0, 1] });
  for (let k = 0; k < 3; k++) {
    const a = k * TAU / 3 + 0.3, c = Math.cos(a), s = Math.sin(a);
    S.tube('main', [[c * 0.2, s * 0.2, 0.05], [c * 0.7, s * 0.7, 0.1], [c * 1.15, s * 1.15, 0.18], [c * 1.5, s * 1.5, 0.28]], [[0.2, 0.045], [0.34, 0.05], [0.3, 0.04], [0.2, 0.03]], { seg: 8, per: 4, ref: [-s, c, 0], twist: (t) => 0.5 - 0.7 * t });
  }
  S.pop();
  return S.finish({});
});
const anchorFig = () => cached('lmprib-anchor', () => {
  const S = new Sculpt({ detail: 1 });
  S.tube('main', [[0, 0.3, 0], [0, 1.6, 0], [0, 3.0, 0]], [[0.09, 0.09]], { seg: 8, per: 3 });
  S.tube('main', loopPts([0, 3.2, 0], [0, 0, 1], 0.2, 0.2, 10), [[0.04, 0.04]], { closed: true, seg: 6, rings: 20, ref: [0, 1, 0] });
  for (const sx of [-1, 1]) {
    S.tube('main', [[0, 0.32, 0], [sx * 0.35, 0.22, 0], [sx * 0.75, 0.45, 0], [sx * 0.95, 0.95, 0]], [[0.08, 0.08], [0.075, 0.075], [0.07, 0.07], [0.06, 0.06]], { seg: 8, per: 4 });
    S.blob('main', [sx * 0.95, 0.98, 0], [0.17, 0.28, 0.04], { w: 8, h: 6, dir: [sx * 0.3, 1, 0] });
  }
  S.tube('main', [[0, 0.32, 0], [0, 0.18, 0]], [[0.13, 0.13]], { seg: 8, per: 2 });
  return S.finish({});
});
function props(P, M, mk, cover) {
  const prop = propFig(), anchor = anchorFig();
  for (const pr of PROPS) {
    const w = KF.W(pr.x, pr.z);
    P.box(M.propPlinth, pr.x - 1.6, pr.x + 1.6, 0, 1.0, pr.z - 1.2, pr.z + 1.2, '', 2);
    P.box(M.propPlinth, pr.x + (pr.x > 0 ? 1.6 : -1.6 - 0.45), pr.x + (pr.x > 0 ? 2.05 : -1.6), 0, 0.2, pr.z - 0.9, pr.z + 0.9, 'k', 2);              // the granite step at one end
    prop.place(P, { main: M.propBronze }, pr.x, 1.0 + 0.5, pr.z, 0, 1.0);
    void w; void cover;
  }
  for (const an of ANCHORS) {
    P.box(M.propPlinth, an.x - 0.5, an.x + 0.5, PLAT, PLAT + 0.6, an.z - 0.4, an.z + 0.4, '', 2);
    anchor.place(P, { main: M.anchor }, an.x, PLAT + 0.6, an.z, 0.3 * (an.x > 0 ? 1 : -1), 1.0);
  }
}

// ------------------------------------------------------------------------------------------------ colliders
function colliders(K) {
  const ph = K.ctx.physics;
  // the platform (walk boxes, solid column from the ground: the 0.55 m curb), the three south-west step tiers are the way in
  walkF(ph, KF, -34.2, 36.2, 0.3, 7.0, PLAT, 0); walkF(ph, KF, -5.3, 5.3, -2.7, 0.4, PLAT, 0); walkF(ph, KF, -3.8, 3.8, -5.2, -2.5, PLAT, 0);   // + the paved bump round the wreath
   walkF(ph, KF, -25.8, 26.7, 7.0, 34.3, PLAT, 0); walkF(ph, KF, -34.3, 37.4, 34.3, 55.4, PLAT, 0);
  for (let k = 0; k < 3; k++) { const d0 = 0.4 * (2 - k), h = 0.18 * (k + 1); walkF(ph, KF, -34.2, -5.9, 0.6 - d0 - 0.4, 0.6 - d0, h, 0); walkF(ph, KF, 5.6, 36.2, 0.5 - d0 - 0.4, 0.5 - d0, h, 0); }
  // the wall arc is a row of breakable bays (wallArc above); the two shell niches at its ends are granite structure (jambs, lintel, cap slab 2.5 x 1.9 x 2.1 m): solid
  for (const [x, z] of NICHES) boxF(ph, KF, x, z, 2.5, 1.9, 0, PLAT + 2.1);
  // the turrets (solid cylinders), the wreath ring (solid), the propeller plinths, the anchors
  for (const t of TURRETS) { const p = KF.W(t.x, t.z); ph.addCylinder(p.x, p.z, 3.95, 0, PLAT + KY.turretH + 0.2); }
  { const p = KF.W(0, 0); ph.addCylinder(p.x, p.z, 1.75, PLAT, PLAT + 1.9); }
  for (const pr of PROPS) boxF(ph, KF, pr.x, pr.z, 3.3, 2.5, 0, 3.6);
  for (const an of ANCHORS) boxF(ph, KF, an.x, an.z, 1.0, 0.8, PLAT, PLAT + 3.4);
}

// ------------------------------------------------------------------------------------------------ services
function services(K) {
  const S = K.svc, W = KF.W, sp = (name, a, b, ta, tb, pitch = 8) => { const p = W(a, b), t = W(ta, tb); S.photoSpots.push({ name, x: p.x, z: p.z, yaw: L.yawToward(p.x, p.z, t.x, t.z), pitch }); };
  const c = W(0, 0);
  S.monuments.push({ id: 'n1352795088', name: 'Памятник крейсеру «Киров»', x: c.x, z: c.z, h: 10 });
  for (const t of TURRETS) { const p = W(t.x, t.z); S.monuments.push({ id: 'turret-' + t.z, name: 'Башня главного калибра крейсера «Киров»', x: p.x, z: p.z, h: KY.turretH }); }
  for (const pr of PROPS) { const p = W(pr.x, pr.z); S.monuments.push({ id: 'prop-' + pr.x, name: 'Гребной винт крейсера «Киров»', x: p.x, z: p.z, h: 3.5 }); }
  sp('Памятник крейсеру «Киров»: венок и башни', 0, -6, 0, 40, 12);
  sp('Памятник крейсеру «Киров»: башни и колледж', 12, 12, 0, 40, 8);
  S.fences.push({ id: 'kirov-wall', kind: 'wall', x: c.x, z: c.z, r: 24.5 });
  S.crowd.push({ id: 'kirov-visitors', kind: 'quiet', x: W(18, 4).x, z: W(18, 4).z, r: 3, n: 2 });
}
