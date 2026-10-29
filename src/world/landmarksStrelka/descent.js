// landmarksStrelka/descent.js - the granite DESCENT of the Spit (1805-10, the stone cut by Samson Sukhanov): docs/research/strelka.md 2.4, photos refs/strelka q_01 q_02 q_03 q_05 q_09 q_13 aer_01.
// Polar layout around SC (frame.js), angle a from the axis (+z, the tip) toward +x (north); the two edges fitted to the OSM lines (groups.js DESCENT_INNER / DESCENT_OUTER, +-0.5 m):
//   terrace wall  rIn(a)  = 69.7 + 2.7 cos^2 a      (the garden stands on it at street level: pink granite, a corbel belt, a parapet of 1.05 m)
//   outer edge    rOut(a) = 80.6 + 2.1 cos^2 a
//   the ring between them: from each end (|a| = 88.5 deg, y 0) a sett-paved RAMP goes down to the LANDING (|a| <= 41.9 deg, y -2.8, 0.6 m above the Neva); thick pink parapets on the outer
//   side of the ramps end at the two grey granite SPHERES; the landing is open to the water: a slab edge and three steps down to the water; eight LION MASKS with iron rings on the terrace wall.
// MODES: `sunk` (the real thing) needs the environment to treat the ring as water (no ground over it): docs/research/petro-requests-landmarksStrelka.md request 1.  It is switched on when
// layout.inRiver is true in the middle of the ring; otherwise the FLAT fallback is built (the ring paved at street level, same parapets and spheres, no masks, no steps).
import * as THREE from 'three';
import * as L from '../layout.js';
import { ROT, W, SC, DEG } from './frame.js';
import { Sculpt, cached } from '../lib/figures.js';
import { knockBays, unitBox } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, docs/vo-m1.md): the two parapets are rows of breakable bays

export const A_HEAD = 88.5 * DEG, A_END = 89.6 * DEG, A_SPH = 41.9 * DEG, Y_LAND = -2.8;
export const rIn = (a) => 69.7 + 2.7 * Math.cos(a) ** 2, rOut = (a) => 80.6 + 2.1 * Math.cos(a) ** 2;
const at = (R, a) => [SC[0] + Math.sin(a) * R, SC[1] + Math.cos(a) * R];

/** the lion mask: a grey granite keystone with a lion's head holding an iron ring (faces +z, origin on the wall face at the middle of the block) */
function lionMask() {
  return cached('lmSt-lionMask', () => {
    const S = new Sculpt({ detail: 1 });
    S.sheet('main', [[-0.52, 0.5, 0.04], [0.52, 0.5, 0.04], [0.4, -0.5, 0.04], [-0.4, -0.5, 0.04]], 0.05);                          // the keystone block
    // the mane: a thick wreath of curls round the face
    const mane = []; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; mane.push([Math.sin(a) * 0.31, 0.06 + Math.cos(a) * 0.3 - (Math.cos(a) < -0.5 ? 0.05 : 0), 0.1]); }
    S.tube('main', mane, mane.map((_, k) => [0.12, 0.075]), { seg: 8, closed: true, per: 2, bump: (t, th) => 1 + 0.16 * Math.sin(t * 75 + th * 2) });
    S.blob('main', [0, 0.07, 0.13], [0.25, 0.26, 0.15], { w: 12, h: 8 });                              // skull
    S.blob('main', [0, 0.2, 0.2], [0.19, 0.07, 0.07], { w: 8, h: 5 });                                 // the heavy brow
    S.blob('main', [0, 0.04, 0.26], [0.055, 0.13, 0.07], { w: 6, h: 5 });                              // the bridge of the nose
    S.blob('main', [0, -0.08, 0.31], [0.085, 0.055, 0.06], { w: 7, h: 5 });                            // the nose tip
    for (const s of [1, -1]) {
      S.blob('main', [s * 0.085, -0.15, 0.27], [0.1, 0.085, 0.09], { w: 7, h: 5 });                    // the whisker pads
      S.blob('main', [s * 0.15, 0.03, 0.21], [0.085, 0.09, 0.07], { w: 6, h: 5 });                     // cheeks
      S.blob('dark', [s * 0.105, 0.1, 0.235], [0.035, 0.022, 0.02], { w: 5, h: 4 });                   // eyes under the brow
      S.blob('main', [s * 0.24, 0.31, 0.12], [0.06, 0.07, 0.04], { w: 5, h: 4 });                      // ears
    }
    S.blob('main', [0, -0.26, 0.24], [0.09, 0.05, 0.07], { w: 6, h: 4 });                              // the lower jaw holding the ring
    const ring = []; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; ring.push([Math.cos(a) * 0.2, -0.44 + Math.sin(a) * 0.2, 0.22 - Math.sin(a) * 0.05]); }
    S.tube('accent', ring, 0.03, { seg: 5, closed: true, per: 1 });
    return S.finish({});
  });
}

export function descent(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  const probe = (a) => { const p = at((rIn(a) + rOut(a)) / 2, a), w = W(p[0], p[1]); return L.inRiver(w.x, w.z); };
  const sunk = probe(20 * DEG) && probe(-20 * DEG) && probe(70 * DEG) && probe(-70 * DEG);
  const yRing = (a) => { const b = Math.abs(a); return !sunk ? 0.05 : b >= A_HEAD ? 0.03 : b <= A_SPH ? Y_LAND : Y_LAND * (A_HEAD - b) / (A_HEAD - A_SPH) + 0.03 * (b - A_SPH) / (A_HEAD - A_SPH); };
  const STEP = 2.0 * DEG, N = Math.round(2 * A_END / STEP);
  const angles = Array.from({ length: N + 1 }, (_, i) => -A_END + 2 * A_END * i / N);
  const pink = M.granitePink, pinkP = M.granitePinkPlain;
  /** vertical face along the arc at radius rf(a), between y0f(a) and y1f(a); out = facing away from SC */
  const face = (mat, rf, a0, a1, y0f, y1f, out, tile = 2.4, tileY = 1.2) => {
    const p = at(rf(a0), a0), q = at(rf(a1), a1), am = (a0 + a1) / 2, s = out ? 1 : -1, u0 = rf(a0) * a0 / tile, u1 = rf(a1) * a1 / tile;
    if (y1f(a0) - y0f(a0) < 0.005 && y1f(a1) - y0f(a1) < 0.005) return;
    P.quad(mat, [p[0], y0f(a0), p[1]], [q[0], y0f(a1), q[1]], [q[0], y1f(a1), q[1]], [p[0], y1f(a0), p[1]], [Math.sin(am) * s, 0, Math.cos(am) * s], [[u0, y0f(a0) / tileY], [u1, y0f(a1) / tileY], [u1, y1f(a1) / tileY], [u0, y1f(a0) / tileY]]);
  };
  /** band between two radii at height yf(a) (up) */
  const band = (mat, r0f, r1f, a0, a1, yf, tile = 1.2, up = true, nr = 1) => {
    for (let j = 0; j < nr; j++) {
      const f0 = (a) => r0f(a) + (r1f(a) - r0f(a)) * j / nr, f1 = (a) => r0f(a) + (r1f(a) - r0f(a)) * (j + 1) / nr;
      const p = at(f0(a0), a0), q = at(f0(a1), a1), r = at(f1(a1), a1), s = at(f1(a0), a0);
      P.quad(mat, [p[0], yf(a0), p[1]], [q[0], yf(a1), q[1]], [r[0], yf(a1), r[1]], [s[0], yf(a0), s[1]], [0, up ? 1 : -1, 0], [[p[0] / tile, p[1] / tile], [q[0] / tile, q[1] / tile], [r[0] / tile, r[1] / tile], [s[0] / tile, s[1] / tile]]);
    }
  };
  const c = (v) => () => v, off = (f, d) => (a) => f(a) + d, isRamp = (a) => Math.abs(a) > A_SPH - 0.001;
  const o = W(0, 0);
  const terBays = [], outBays = [];      // the terrace parapet (street level) and the thick outer parapets of the two ramps: knock bays (world coordinates, the arc cut at the 2 degree steps of the drawing)
  const bayAt = (rf, a0, a1, y, ye) => { const p0 = W(...at(rf(a0), a0)), p1 = W(...at(rf(a1), a1)); return { x0: p0.x, z0: p0.z, x1: p1.x, z1: p1.z, y, ye }; };      // runs with increasing a: the left of the bay (local +z) is OUTWARD, away from SC
  P.push(o.x, 0, o.z, ROT);
  try {
    for (let i = 0; i < N; i++) {
      const a0 = angles[i], a1 = angles[i + 1], am = (a0 + a1) / 2, ramp = isRamp(am);
      // ---- the ring surface: setts; on the landing a slab edge along the water
      band(M.settsRamp, off(rIn, 0), off(rOut, ramp ? -0.6 : -0.9), a0, a1, yRing, 1.2, true, 3);
      if (!ramp) band(pinkP, off(rOut, -0.9), rOut, a0, a1, off(yRing, 0.004), 2.4);
      // ---- the terrace wall: face from the ring up to the street, the corbel belt, the parapet (outer face, top, garden face)
      face(pink, rIn, a0, a1, yRing, c(0), true);
      terBays.push(bayAt(rIn, a0, a1, 0, 0));      // (the parapet 0.57 m x 1.05 m on the wall: drawn by its bay)
      if (sunk && yRing(am) < -1.1) {
        face(pinkP, off(rIn, 0.2), a0, a1, c(-0.3), c(-0.06), true); band(pinkP, rIn, off(rIn, 0.2), a0, a1, c(-0.06), 2.4); band(pinkP, rIn, off(rIn, 0.2), a0, a1, c(-0.3), 2.4, false);
        for (const ac of [am - STEP / 4, am + STEP / 4]) { const p = at(rIn(ac), ac); P.push(p[0], 0, p[1], ac); P.box(pinkP, -0.17, 0.17, -0.6, -0.3, 0, 0.18, 'kt'); P.pop(); }   // two corbels per step under the belt
      }
      // ---- the outer side: on the ramps the thick parapet (0.6 m, 0.95 m above the setts) whose outer face goes down into the water; on the landing the three steps
      if (ramp) {
        if (sunk) face(pink, rOut, a0, a1, c(-4.8), yRing, true);      // the wall face under the ring, down into the water; the parapet on the ring (0.6 m x 0.95 m) is drawn by its bay
        outBays.push(bayAt(rOut, a0, a1, yRing(a0), yRing(a1)));
      } else if (sunk) {
        for (let k = 0; k < 3; k++) { const yk = Y_LAND - 0.18 * (k + 1); face(pinkP, off(rOut, 0.4 * k), a0, a1, c(yk), c(yk + 0.18), true); band(pinkP, off(rOut, 0.4 * k), off(rOut, 0.4 * (k + 1)), a0, a1, c(yk), 2.4); }
        face(pink, off(rOut, 1.2), a0, a1, c(-4.8), c(Y_LAND - 0.54), true);
      }
    }
    // ---- ends of the outer parapets at the spheres, the pedestals and the spheres
    for (const s of [1, -1]) {
      const a = s * A_SPH, y = yRing(a), pc = at(rOut(a) - 0.62, a - s * 0.0085);
      P.push(pc[0], 0, pc[1], a);
      P.box(M.granitePlain, -0.62, 0.62, y, y + 1.0, -0.62, 0.62, 'b'); P.box(M.granitePlain, -0.7, 0.7, y + 1.0, y + 1.1, -0.7, 0.7, '');
      P.geo(M.sphere, new THREE.SphereGeometry(0.5, 18, 12), 0, y + 1.1 + 0.48, 0);
      P.pop();
      const w = W(pc[0], pc[1]); ph.addCylinder(w.x, w.z, 0.8, y - 2, y + 2.1);
      K.svc.monuments.push({ id: s > 0 ? 'strelka-sphere-north' : 'strelka-sphere-south', name: 'Гранитный шар', x: w.x, z: w.z, h: 2.1, r: 0.8 });
      // the head of the ramp: the parapets end against a low pier
      const ah = s * A_END, ph0 = at(rOut(ah) - 0.3, ah); P.push(ph0[0], 0, ph0[1], ah); P.box(M.granitePlain, -0.45, 0.45, 0, 1.1, -0.45, 0.45, 'b'); P.pop();
      const pi0 = at(rIn(ah) - 0.27, ah); P.push(pi0[0], 0, pi0[1], ah); P.box(M.granitePlain, -0.42, 0.42, 0, 1.15, -0.42, 0.42, 'b'); P.pop();
    }
    // ---- lion masks on the terrace wall over the landing
    if (sunk) for (const d of [-35, -25, -15, -5, 5, 15, 25, 35]) { const a = d * DEG, p = at(rIn(a) + 0.02, a); lionMask().place(P, { main: M.granitePlain, accent: M.iron, dark: M.bowl }, p[0], -1.2, p[1], a, 1.1); }
  } finally { P.pop(); }

  // ---------------------------------------------------------------------------------------------- colliders
  const CS = 4 * DEG, NC = Math.round(2 * A_END / CS);
  for (let i = 0; i < NC; i++) {
    const a0 = -A_END + 2 * A_END * i / NC, a1 = -A_END + 2 * A_END * (i + 1) / NC, am = (a0 + a1) / 2, rot = ROT + am + Math.PI / 2;
    const wi = W(...at(rIn(am) - 0.27, am)), chordI = (a1 - a0) * rIn(am) + 0.3;
    if (sunk) ph.addBox(wi.x, wi.z, 0.7, chordI, rot, -6, 0);                                  // the retaining wall under the terrace parapet (masonry structure; the parapet above it is the knock bays below)
    const rm = (rIn(am) + rOut(am)) / 2, wm = W(...at(rm, am)), wid = rOut(am) - rIn(am) + 0.4, chord = (a1 - a0) * rOut(am) + 0.4;
    if (sunk) {
      const yA = yRing(a0), yB = yRing(a1);
      if (Math.abs(yA - yB) < 0.002) ph.addWalkBox(wm.x, wm.z, wid, chord, rot, yA, yA - 3); else ph.addWalkRamp(wm.x, wm.z, wid, chord, rot, yA, yB, 3);
    }
    if (!isRamp(am) && sunk) {
      for (let k = 0; k < 3; k++) { const ws = W(...at(rOut(am) + 0.4 * k + 0.2, am)); ph.addWalkBox(ws.x, ws.z, 0.42, chord, rot, Y_LAND - 0.18 * (k + 1), -6); }
      // (the source's invisible guard along the last step, "nobody walks on the water", is gone: water is reachable, docs/AREAS.md 13.7; the walker steps off the last tread into the Neva)
    }
  }
  // ---- n4spb: the parapets are rows of BREAKABLE bays (one thin collider, one knock record and the drawn granite section each; a car breaks a bay off at the foot, the gap is passable)
  const pinkBox = (h, z0, z1) => unitBox(0, h, z0, z1, { uLen: 2.4, uvs: 2.4 });
  const granite = { kind: 'fence', mass: 900, anchored: 24, hitK: 0.7, metal: false, minDv: 0 };
  knockBays(ctx, { name: 'lmSt-terrace-parapet', bays: terBays, far: 320,
    parts: [{ geo: pinkBox(1.05, -0.55, 0.02), mat: M.granitePink, name: 'parapet', stretch: true, shadow: true, receive: true }],
    collider: { y0: 0, y1: 1.15, thick: 0.7, off: -0.27, e0: 0.05, e1: 0.05 }, rec: () => ({ ...granite, h: 1.05 }) });
  knockBays(ctx, { name: 'lmSt-ramp-parapet', bays: outBays, far: 320,
    parts: [{ geo: pinkBox(0.95, -0.6, 0), mat: M.granitePink, name: 'parapet', stretch: true, shadow: true, receive: true }],
    collider: (b) => ({ y0: Math.min(b.y, b.ye) - 0.05, y1: Math.max(b.y, b.ye) + 1.0, thick: 0.65, off: -0.3, e0: 0.05, e1: 0.05 }), rec: () => ({ ...granite, h: 0.95 }) });
  K.extraTris += (terBays.length + outBays.length) * 10;
  const lw = W(SC[0], SC[1] + 77);
  K.svc.descent = { sunk, landingY: sunk ? Y_LAND : 0.05, landing: { x: lw.x, z: lw.z } };
  K.svc.crowd.push({ x: lw.x, z: lw.z, r: 9, n: 10, kind: 'quay', y: sunk ? Y_LAND : 0, name: 'Спуск к Неве' });
  K.svc.photoSpots.push({ x: lw.x, z: lw.z, yaw: 0, y: sunk ? Y_LAND : 0, name: 'Пристань Стрелки' });
}
