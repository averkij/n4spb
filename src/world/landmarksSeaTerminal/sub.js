// landmarksSeaTerminal/sub.js - the museum SUBMARINE D-2 «Народоволец» (Dekabrist class, 1929; on the shore of the Shkipersky protok since 1989; OSM r14595064 + parts) with its museum plot: the 76.0 x 6.4 m hull standing
// ON LAND on two concrete cradles (keel +2.3, boot-top +6.1, casing deck +8.2), the conning tower (centre z -4.5) with the red star, white «Д-2», ring antenna and two periscopes, the 100-mm gun on its pad
// (a silent static prop), the stern group (two propellers, planes, the big vertical rudder), the free-flood slots, hydroplanes and rails; the ochre pavilion (75 x 7.6 x 4.0 m), the yard fence with its gates, the clipped
// hedge, the open-air exhibits (field gun, armoured car, truck), the foundation stone on its plinth and gravel plaza, path lamps, the museum plate.
// Dossier docs/research/seaterminal.md section 6 (CRITIC-corrected: bow = SW, tower z -4.5, pad abutting the tower), photos d01 d02 d03 d09 d14 d19 d20.  Frame D (frame.js): +z = BOW (SW), +x = port (SSE), y absolute.
import * as THREE from 'three';
import * as L from '../layout.js';
import { D, SUB, STARS, coverFn } from './frame.js';
import { gridGeo, extrudeShape, polyShape } from './geo.js';
import { fenceRun, barrierPts } from './fence.js';
import { partsGeos, addInstanced, mat4, kBays } from './inst.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13, 15.v): the path lamps are knock records
import { splitBays, unitBox } from '../lib/fence-bays.js';      // n4spb: the hedge is a row of breakable bays

const WL = SUB.wl;
const LV = [2.1, 1.5, 0.9, 0.4, 0.12, -0.12, -0.8, -1.8, -2.8, -3.5, -3.8];            // levels relative to the waterline: casing edge .. keel
const ZS = [-38, -37.4, -36.2, -34, -31, -27, -22, -17, -12, -6, 0, 6, 12, 18, 22, 26, 29, 32, 34.5, 36.5, 37.6, 38];
const clamp01 = (v) => Math.max(0, Math.min(1, v));
/** plan half-beam factor: a blunt elliptical bow in the last 14 m, a parallel body z -12 .. 24, a taper to a blunt tail (beam 6.4) */
// REVIEW 2026-10-09: the bow is a raked, pointed prow (power 1.5 instead of the blunt ellipse of photo-less first pass: d02 d14), the tail ends in a blunt 0.9 m end that is CAPPED (it was a 0.4 m open slit: from behind
// at eye level the hull could be looked into), and the keel line rises toward both ends (kd): the real boat's lower hull tapers up into the stern cone and the forefoot (d03 d14), it is not a constant-depth knife.
const gz = (z) => (z > 24 ? clamp01(1 - ((z - 24) / 14) ** 1.5) : z >= -12 ? 1 : 1 - Math.pow((-12 - z) / 26, 1.6) * 0.86);
const beam = (z) => 3.2 * gz(z);
/** depth factor of the lower hull (1 = full 3.8 m below the waterline): the keel rises toward the stern cone and the bow */
const kd = (z) => (z > 24 ? 1 - 0.55 * clamp01((z - 24) / 14) ** 1.5 : z < -12 ? 1 - 0.6 * clamp01((-12 - z) / 26) ** 1.4 : 1);
/** world height (y absolute) of the hull point at station z and level y (relative to the waterline): the levels below the waterline are squeezed toward it by kd(z) at the ends */
const hy = (z, y) => WL + (y < 0 ? y * kd(z) : y);
/** half-width of the hull at station z and level y (relative to the waterline) */
function hx(z, y) {
  const B = beam(z), wt = Math.min(1.3, B * 0.75);
  return y >= 0 ? wt + (B - wt) * Math.sqrt(Math.max(0, 1 - (y / 2.1) ** 2)) : B * Math.sqrt(Math.max(0, 1 - (y / 3.8) ** 2));
}

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSeaTerminal] sub/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = K.P;
  P.push(D.x, 0, D.z, D.rot);
  try {
    stage('hull', () => hull(K));
    stage('details', () => details(K));
    stage('tower', () => tower(K));
    stage('gun', () => gun(K));
    stage('stern', () => stern(K));
    stage('rigging', () => rigging(K));
    stage('cradles', () => cradles(K));
    stage('pavilion', () => pavilion(K));
    stage('yard', () => yard(K));
    stage('exhibits', () => exhibits(K));
    stage('stone', () => stone(K));
  } finally { P.pop(); }
  stage('lamps', () => lamps(K));
  stage('colliders', () => colliders(K));
  stage('services', () => services(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ hull: three smooth lofted bands per side (grey casing, white boot-top, green belly) + the flat casing deck
function hull(K) {
  const P = K.P, M = K.M, ns = ZS.length - 1;
  const bands = [[0, 4, M.hullUp], [4, 5, M.boot], [5, 10, M.hullLow]];
  // gridGeo winds a grid (s = along z, t = down the levels) with the normal toward -x on the +x side: that faces INTO the hull (the first pass flipped the wrong side, so only the far wall's inner face was
  // drawn: from the stern one could look inside the hull).  Flip the +x side so both flanks face outward (checked numerically: normal.x * side > 0).
  for (const [j0, j1, mat] of bands) for (const side of [1, -1]) {
    const nt = j1 - j0;
    const g = gridGeo(ns, nt, (s, t) => { const z = ZS[Math.round(s * ns)], y = LV[j0 + Math.round(t * nt)]; return [side * hx(z, y), hy(z, y), z]; }, (s, t, p) => [p[2] / 3, p[1] / 2.4], side > 0);
    P.geo(mat, g); g.dispose();
  }
  // the stern end cap: the blunt tail (z -38) closed with a fan over its section ring (keel up the -x side), facing -z
  { const z = ZS[0], ring = []; for (const side of [1, -1]) for (let k = 0; k < LV.length; k++) { const y = LV[side > 0 ? k : LV.length - 1 - k]; ring.push([side * hx(z, y), hy(z, y), z]); }
    P.fan(M.hullLow, ring, [0, 0, -1], (p) => [p[0] / 3, p[1] / 2.4]); }
  // the casing deck: a flat strip between the two top edges
  for (let i = 0; i < ns; i++) {
    const za = ZS[i], zb = ZS[i + 1], wa = hx(za, LV[0]), wb = hx(zb, LV[0]), y = LV[0] + WL;
    if (wa + wb < 0.01) continue;
    P.quad(M.deck, [-wa, y, za], [wa, y, za], [wb, y, zb], [-wb, y, zb], [0, 1, 0], [[-wa / 2, za / 2], [wa / 2, za / 2], [wb / 2, zb / 2], [-wb / 2, zb / 2]]);
  }
}

function details(K) {
  const P = K.P, M = K.M;
  // three rows of black free-flood slots (0.9 x 0.2 m, pitch 1.4 m) along each side from z +30 to -34 (the tower hides the upper rows between z -9 and 0.5)
  for (const yr of [1.1, 1.6, 1.9]) for (let z = -34; z <= 30; z += 1.4) {
    if (yr > 1.5 && z > -9.5 && z < 1.0) continue;
    const xa = hx(z, yr) + 0.008, xb = hx(z + 0.9, yr) + 0.008;
    for (const s of [1, -1]) P.quad(M.slot, [s * xa, yr + WL, z], [s * xa, yr + WL + 0.2, z], [s * xb, yr + WL + 0.2, z + 0.9], [s * xb, yr + WL, z + 0.9], [s, 0, 0]);
  }
  // two louvre grilles on the green belly of each side (1.3 x 0.9 m) at z -2 and +18
  for (const z of [-2, 18]) for (const s of [1, -1]) {
    const y = -1.7, x = hx(z, y) + 0.012;
    P.quad(M.slot, [s * x, y + WL, z + 0.65 * s], [s * x, y + WL + 0.9, z + 0.65 * s], [s * x, y + WL + 0.9, z - 0.65 * s], [s * x, y + WL, z - 0.65 * s], [s, 0, 0]);
  }
  // the bow: towing ring on the stem top, the bow hydroplanes (flat ellipses folded out at z +24), the vent pipe ahead of the gun
  const ring = new THREE.TorusGeometry(0.35, 0.05, 5, 10); P.geo(M.pole, ring, 0, SUB.deck + 0.3, 37.2, Math.PI / 2, 0, 0); ring.dispose();
  for (const s of [1, -1]) { const w = new THREE.SphereGeometry(1, 10, 6); P.geo(M.hullUp, w, s * 4.4, 5.6, 24, 0, 0, s * 0.22, 1.5, 0.05, 0.75); w.dispose(); }
  P.col(M.boot, 0.0, 10.0, SUB.deck, SUB.deck + 2.4, 0.16, 0.16, 8, true);
  // stanchions along the casing edge (1.2 m every 3.2 m) carrying two ropes, both sides, z -34 .. +34
  for (const s of [1, -1]) {
    const xe = s * 1.15;
    for (let z = -34; z <= 34.01; z += 3.2) P.col(M.wire, xe, z, SUB.deck, SUB.deck + 1.2, 0.02, 0.02, 4, false);
    for (const hh of [0.6, 1.2]) P.cyl(M.wire, [xe, SUB.deck + hh, -34], [xe, SUB.deck + hh, 34], 0.018, 0.018, 4, false);
  }
}

// ------------------------------------------------------------------------------------------------ conning tower, centre z -4.5 (z -8.7 .. -0.3, 3.4 m wide, to y 12.6): rounded fore end, flat aft end
function tower(K) {
  const P = K.P, M = K.M, y0 = SUB.deck - 0.1, y1 = SUB.towerTop, zb = SUB.towerZ - SUB.towerLen / 2, zf = SUB.towerZ + SUB.towerLen / 2, w0 = SUB.towerW / 2, w1 = w0 - 0.25, n = 8;
  const plan = (w, zo) => { const r = w, zr = zf - r - zo, pts = [[w, zb + zo], [w, zr]]; for (let k = 1; k < n; k++) { const a = Math.PI * k / n; pts.push([w * Math.cos(a), zr + r * Math.sin(a)]); } pts.push([-w, zr], [-w, zb + zo]); return pts; };
  const pa = plan(w0, 0), pb = plan(w1, 0.15), m = pa.length;
  for (let k = 0; k < m; k++) {
    const k2 = (k + 1) % m, a = pa[k], b = pa[k2], a2 = pb[k], b2 = pb[k2], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    P.quad(M.hullUp, [a[0], y0, a[1]], [b[0], y0, b[1]], [b2[0], y1, b2[1]], [a2[0], y1, a2[1]], [mx, 0.05, mz - SUB.towerZ], [[a[1] / 3, y0 / 3], [b[1] / 3, y0 / 3], [b2[1] / 3, y1 / 3], [a2[1] / 3, y1 / 3]]);
  }
  P.fan(M.hullUp, pb.map((p) => [p[0], y1, p[1]]), [0, 1, 0]);
  // the bridge screen: a 0.5 m rim round the top with a rail, six small windows on the fore face, the ladder on the aft face
  for (let k = 0; k < m; k++) { const k2 = (k + 1) % m, a = pb[k], b = pb[k2]; P.cyl(M.pole, [a[0], y1 + 0.55, a[1]], [b[0], y1 + 0.55, b[1]], 0.025, 0.025, 4, false); P.cyl(M.pole, [a[0], y1, a[1]], [a[0], y1 + 0.55, a[1]], 0.02, 0.02, 4, false); }
  for (let k = 0; k < 6; k++) { const ang = Math.PI * (0.18 + 0.64 * k / 5), zr = zf - w1 - 0.15, x = w1 * Math.cos(ang) * 1.01, z = zr + w1 * Math.sin(ang) * 1.01; P.box(M.slot, x - 0.13, x + 0.13, y1 - 0.9, y1 - 0.62, z - 0.02, z + 0.1, 'b', 1); }
  for (const s of [-0.25, 0.25]) P.col(M.pole, s, zb - 0.04, y0 + 0.2, y1 + 0.4, 0.025, 0.025, 4, false);
  for (let k = 0; k < 8; k++) P.box(M.pole, -0.25, 0.25, y0 + 0.5 + k * 0.5, y0 + 0.53 + k * 0.5, zb - 0.07, zb - 0.01, 'b', 1);
  // the red star (white rim, a white 5) on the fore half of both sides at y 10.8 (DECISION: STARS), the white «Д-2» (4.4 x 2.4 m) on the after half at y 10.3: read left to right as seen from outside
  const xs = (y) => w0 - (w0 - w1) * (y - y0) / (y1 - y0) + 0.02;
  const lt = (s, zc, yc, wd, ht, mat) => {
    const x = s * xs(yc), za = zc + (s > 0 ? wd / 2 : -wd / 2), zbb = zc - (s > 0 ? wd / 2 : -wd / 2);
    P.quad(mat, [x, yc - ht / 2, za], [x, yc - ht / 2, zbb], [x, yc + ht / 2, zbb], [x, yc + ht / 2, za], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  };
  for (const s of [1, -1]) {
    lt(s, SUB.towerZ - 2.1, 10.3, 4.2, 2.3, M.d2Letters);
    if (STARS) lt(s, zf - 2.2, 10.9, 1.2, 1.2, M.star);
  }
  // the ring (loop) antenna, the two periscopes, the H-shaped whip frame (photo d01)
  const ring = new THREE.TorusGeometry(0.5, 0.025, 4, 16); P.geo(M.pole, ring, 0.05, y1 + 1.15, zf - 3.0, 0, 0.4, 0); ring.dispose();
  P.col(M.pole, 0.05, zf - 3.0, y1, y1 + 0.7, 0.03, 0.03, 4, false);
  P.col(M.peri, 0.35, SUB.towerZ - 0.3, y1, y1 + 3.8, 0.12, 0.1, 8, true); P.col(M.peri, -0.2, SUB.towerZ - 0.8, y1, y1 + 2.8, 0.1, 0.08, 8, true);
  P.box(M.peri, 0.28, 0.46, y1 + 3.5, y1 + 3.95, SUB.towerZ - 0.5, SUB.towerZ - 0.05, 'b', 1);
  for (const s of [-1.2, 1.2]) P.col(M.pole, s, zb + 0.3, y1, y1 + 2.5, 0.025, 0.025, 4, false);
  P.cyl(M.pole, [-1.2, y1 + 2.5, zb + 0.3], [1.2, y1 + 2.5, zb + 0.3], 0.03, 0.03, 4, false); P.cyl(M.pole, [-1.2, y1 + 1.5, zb + 0.3], [1.2, y1 + 1.5, zb + 0.3], 0.02, 0.02, 4, false);
}

// ------------------------------------------------------------------------------------------------ the 100-mm gun on its oval pad (z -0.3 .. +3.9, pivot z +2.0): silent static prop
function gun(K) {
  const P = K.P, M = K.M, y = SUB.deck, zc = (SUB.padZ0 + SUB.padZ1) / 2;
  const pad = new THREE.CylinderGeometry(1, 1, 1, 18); P.geo(M.hullUp, pad, 0, y + 0.15, zc, 0, 0, 0, 1.3, 0.3, (SUB.padZ1 - SUB.padZ0) / 2); pad.dispose();
  const gz0 = SUB.gunPivot;
  P.col(M.gunGrey, 0, gz0, y + 0.3, y + 1.2, 0.45, 0.4, 10, true);
  P.box(M.gunGrey, -0.65, 0.65, y + 1.2, y + 2.3, gz0 - 0.55, gz0 + 0.5, 'b', 1);                // the splinter shield / breech box
  const el = 12 * Math.PI / 180, L0 = 5.1, z0 = gz0 + 0.5, y0 = y + 1.8;
  P.cyl(M.gunGrey, [0, y0, z0], [0, y0 + L0 * Math.sin(el), z0 + L0 * Math.cos(el)], 0.1, 0.075, 8, true);
  // the 1.1 m tube railing round the pad on 14 posts
  const pts = []; for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; pts.push([Math.cos(a) * 1.25, zc + Math.sin(a) * 2.0]); }
  for (let k = 0; k < pts.length; k++) {
    const a = pts[k], b = pts[(k + 1) % pts.length];
    if (a[1] < SUB.padZ0 + 0.4 && b[1] < SUB.padZ0 + 0.4) continue;                                  // the aft side stands against the tower
    P.cyl(M.wire, [a[0], y + 1.1, a[1]], [b[0], y + 1.1, b[1]], 0.02, 0.02, 4, false); P.cyl(M.wire, [a[0], y + 0.6, a[1]], [b[0], y + 0.6, b[1]], 0.015, 0.015, 4, false);
    P.col(M.wire, a[0], a[1], y + 0.3, y + 1.1, 0.02, 0.02, 4, false);
  }
}

// ------------------------------------------------------------------------------------------------ stern: two propellers, the horizontal planes, the big vertical rudder blade, the towing ring
function stern(K) {
  const P = K.P, M = K.M;
  for (const s of [-1.3, 1.3]) {
    P.cyl(M.peri, [s, 3.6, -37.4], [s, 3.6, -36.0], 0.1, 0.16, 6, false); P.cyl(M.peri, [s, 3.6, -36.2], [s, 3.6, -36.0], 0.2, 0.2, 8, true);           // shaft and hub
    for (let k = 0; k < 3; k++) { const bl = new THREE.SphereGeometry(1, 8, 4); bl.scale(0.2, 0.48, 0.05); bl.translate(0, 0.62, 0); P.geo(M.prop, bl, s, 3.6, -36.1, 0, 0, k * Math.PI * 2 / 3 + 0.4); bl.dispose(); }
  }
  const w = new THREE.SphereGeometry(1, 12, 6); P.geo(M.hullLow, w, 0, 4.0, -33.5, 0, 0, 0, 3.9, 0.07, 0.62); w.dispose();
  // the vertical rudder: a double-sided plate x = 0, from 0.3 m above the ground up into the tail
  P.quad(M.rudder, [0, 0.3, -37.4], [0, 0.3, -33.6], [0, 5.9, -33.4], [0, 5.9, -37.0], [1, 0, 0]);
  const ring = new THREE.TorusGeometry(0.35, 0.05, 5, 10); P.geo(M.pole, ring, 0, SUB.deck + 0.2, -37.2, Math.PI / 2, 0, 0); ring.dispose();
}

// ------------------------------------------------------------------------------------------------ antenna wires from the periscope heads to the bow and stern stanchions (three parallel wires, no staffs, no flags)
function rigging(K) {
  const P = K.P, M = K.M, ty = SUB.towerTop + 3.8, tz = SUB.towerZ - 0.3;
  for (const dx of [-0.3, 0, 0.3]) {
    P.cyl(M.wire, [0.35 + dx * 0.2, ty, tz], [dx, SUB.deck + 1.3, 36.0], 0.02, 0.02, 4, false);
    P.cyl(M.wire, [0.35 + dx * 0.2, ty, tz], [dx, SUB.deck + 1.3, -36.0], 0.02, 0.02, 4, false);
  }
}

// ------------------------------------------------------------------------------------------------ the two concrete cradles (V-notch, ochre): 5.3 x 4.7 m at (-4.1, +8.0) and 4.9 x 4.2 m at (-4.2, -14.8) in frame D
function cradles(K) {
  const P = K.P, M = K.M;
  SUB.cradles.forEach((c, i) => {
    const hw = c.w / 2, prof = polyShape([[-hw, 0], [hw, 0], [hw, 2.9], [1.75, 2.9], [0, 2.3], [-1.75, 2.9], [-hw, 2.9]]);
    const g = extrudeShape(prof, c.d, 2, 2);
    P.push(c.x, 0, c.z - c.d / 2, 0); P.geo(i === 0 ? M.cradle : M.cradleOchre, g); P.pop(); g.dispose();
    // the cradle stands on its own base block against the pavilion wall: nothing more (the hull rests on the V)
  });
}

// ------------------------------------------------------------------------------------------------ the museum pavilion: ochre faux-ashlar walls 4.0 m, dark roof, barred windows on the hull side, a dark foot band
function pavilion(K) {
  const P = K.P, M = K.M, pv = SUB.pav, h = pv.h, w = pv.x1 - pv.x0, d = pv.z1 - pv.z0;
  const q = (a, b, n, len, y0 = 0, y1 = h) => P.quad(M.ashlar, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], n, [[0, y0 / 2], [len / 4, y0 / 2], [len / 4, y1 / 2], [0, y1 / 2]]);
  q([pv.x1, pv.z1], [pv.x1, pv.z0], [1, 0, 0], d);          // the face toward the hull (+x): reads left to right looking from the hull side (z decreasing to the right? the stone pattern is symmetric)
  q([pv.x0, pv.z0], [pv.x0, pv.z1], [-1, 0, 0], d);
  q([pv.x0, pv.z1], [pv.x1, pv.z1], [0, 0, 1], w); q([pv.x1, pv.z0], [pv.x0, pv.z0], [0, 0, -1], w);
  P.cap(M.pavRoof, [[pv.x0, pv.z0], [pv.x1, pv.z0], [pv.x1, pv.z1], [pv.x0, pv.z1]], h, true, 4);
  P.box(M.ashlar, pv.x0, pv.x1, h, h + 0.3, pv.z0, pv.z0 + 0.25, 'b', 2); P.box(M.ashlar, pv.x0, pv.x1, h, h + 0.3, pv.z1 - 0.25, pv.z1, 'b', 2);
  P.box(M.ashlar, pv.x0, pv.x0 + 0.25, h, h + 0.3, pv.z0, pv.z1, 'b', 2); P.box(M.ashlar, pv.x1 - 0.25, pv.x1, h, h + 0.3, pv.z0, pv.z1, 'b', 2);
  // the dark red-brown foot band (0.6 m) round the walls (a 2 cm proud strip)
  P.box(M.pavFoot, pv.x1, pv.x1 + 0.03, 0, 0.6, pv.z0, pv.z1, 'b', 1); P.box(M.pavFoot, pv.x0 - 0.03, pv.x0, 0, 0.6, pv.z0, pv.z1, 'b', 1);
  P.box(M.pavFoot, pv.x0, pv.x1, 0, 0.6, pv.z1, pv.z1 + 0.03, 'b', 1); P.box(M.pavFoot, pv.x0, pv.x1, 0, 0.6, pv.z0 - 0.03, pv.z0, 'b', 1);
  // barred windows 1.2 x 0.9 m on the hull side, every 6 m, and drain pipes every 8 m
  for (let z = pv.z0 + 4; z < pv.z1 - 3; z += 6) { P.box(M.slot, pv.x1, pv.x1 + 0.04, 1.5, 2.4, z - 0.6, z + 0.6, 'b', 1); for (let k = 1; k < 5; k++) P.box(M.pole, pv.x1 + 0.04, pv.x1 + 0.06, 1.5, 2.4, z - 0.6 + k * 0.24 - 0.01, z - 0.6 + k * 0.24 + 0.01, 'b', 1); }
  for (let z = pv.z0 + 6; z < pv.z1 - 2; z += 8) { if (Math.abs(z - SUB.entrance.z) < 2.2) continue; P.col(M.boot, pv.x1 + 0.12, z, 0.0, h, 0.05, 0.05, 6, false); }      // none in front of the museum door
  // a plate stand near the entrance (-6.3, -45.7): two posts and a board facing +x... toward the approach path (NE)
  const e = SUB.entrance;
  P.col(M.pole, e.x + 1.2, e.z - 1.2, 0, 1.9, 0.04, 0.04, 5, false); P.col(M.pole, e.x + 1.2, e.z - 2.4, 0, 1.9, 0.04, 0.04, 5, false);
  P.quad(M.museum, [e.x + 1.2, 1.1, e.z - 1.15], [e.x + 1.2, 1.1, e.z - 2.45], [e.x + 1.2, 1.9, e.z - 2.45], [e.x + 1.2, 1.9, e.z - 1.15], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  // the museum door: the OSM entrance node (-6561.9, -84.7) lies on the hull side of the pavilion, 5.5 m from its NE end: a double steel door 1.9 x 2.3 m (dark green leaves, a pale frame), two concrete steps, a small flat canopy
  const dx = pv.x1, dz = e.z;
  P.box(M.cradle, dx - 0.05, dx + 0.07, 0, 2.5, dz - 1.12, dz - 0.97, 'b', 1); P.box(M.cradle, dx - 0.05, dx + 0.07, 0, 2.5, dz + 0.97, dz + 1.12, 'b', 1); P.box(M.cradle, dx - 0.05, dx + 0.07, 2.3, 2.5, dz - 1.12, dz + 1.12, 'b', 1);
  P.quad(M.stern, [dx + 0.075, 0, dz + 0.97], [dx + 0.075, 0, dz + 0.02], [dx + 0.075, 2.3, dz + 0.02], [dx + 0.075, 2.3, dz + 0.97], [1, 0, 0]);
  P.quad(M.stern, [dx + 0.075, 0, dz - 0.02], [dx + 0.075, 0, dz - 0.97], [dx + 0.075, 2.3, dz - 0.97], [dx + 0.075, 2.3, dz - 0.02], [1, 0, 0]);
  for (const s of [-1, 1]) P.box(M.pole, dx + 0.075, dx + 0.1, 1.0, 1.04, dz + s * 0.12, dz + s * 0.7, 'b', 1);
  P.box(M.cradle, dx + 0.07, dx + 0.45, 0, 0.15, dz - 1.15, dz + 1.15, 'b', 1); P.box(M.cradle, dx + 0.45, dx + 0.85, 0, 0.08, dz - 1.15, dz + 1.15, 'b', 1);
  P.box(M.pavRoof, dx + 0.0, dx + 1.1, 2.6, 2.72, dz - 1.4, dz + 1.4, 'b', 1);
  for (const s of [-1, 1]) P.col(M.pole, dx + 1.0, dz + s * 1.3, 2.0, 2.6, 0.03, 0.03, 5, false);
}

// ------------------------------------------------------------------------------------------------ the yard: fence with gates, the clipped hedge, lamps (world rings from the baked barriers)
function yard(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  // the plot fences are world polylines: draw them in the world frame (undo the D push for the call)
  P.pop();
  try {
    const gates = [[-6532.3, -94.6], [-6593.6, -101.6], [-6561.9, -84.7]];
    const runs = [
      ['w1095638978', [-6664.8, -111, -6623.1, -110.8, -6621.1, -98.5, -6593.6, -101.6, -6558.2, -106, -6533.3, -97.5, -6531.7, -93.1, -6524.8, -78.8]],
      ['w372463179', [-6676.4, -86.1, -6674.7, -87.8, -6669.4, -94.5, -6671.6, -95.6, -6671, -98.1, -6658.7, -123.9]],
    ];
    let n = 0;
    for (const [id, fallback] of runs) {
      const pts = barrierPts(id) || fallback;
      n += fenceRun(K, pts, { kind: 'iron', h: 1.2, gates, gateHalf: 1.4 });
    }
    K.svc.yardFence = n;
    // the clipped conifer hedge 1.8 m tall along the SE side of the plot (the Lenexpo fence line (-6624.5,-31.6) -> (-6524.8,-78.8)), 1.2 m inside it (plot side = NNW)
    const a = [-6624.5, -31.6], b = [-6524.8, -78.8], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, px = uz, pz = -ux;
    // n4spb (docs/AREAS.md 13.7; the Kirova hedges): the 100 m hedge is a row of breakable bays of about 3.1 m (collider 0.9 x 1.8 m as the source's fence box, one knock record each); the source drew one box + one solid fence box
    kBays(K, { name: 'lmseate-d2-hedge', bays: splitBays(a[0] + px * 1.2, a[1] + pz * 1.2, b[0] + px * 1.2, b[1] + pz * 1.2, 3.1, { y: 0 }), far: 300,
      parts: [{ geo: unitBox(0, 1.8, -0.4, 0.4, { uLen: 3.1, uvs: 2 }), mat: M.hedge, name: 'hedge', stretch: true }],
      collider: { y0: 0, y1: 1.8, thick: 0.9, e0: 0, e1: 0 },
      rec: () => ({ kind: 'fence', mass: 450, h: 1.8, anchored: 14, hitK: 0.3, metal: false, minDv: 0 }) });
    K.svc.fences.push({ id: 'd2-hedge', pts: [a, b], solid: true });
  } finally { P.push(D.x, 0, D.z, D.rot); }
}

// ------------------------------------------------------------------------------------------------ open-air exhibits (OSM "Пушка" (-6605,-78), the Ehrhardt E-V/4 (-6598,-80), the Opel Blitz (-6565,-95)): simple, [E] sizes
function exhibits(K) {
  const P = K.P, M = K.M;
  const at = (wx, wz) => D.M(wx, wz);
  // field gun (3.4 m long, grey-green): two wheels, a trail, a shield and a barrel
  { const p = at(-6605, -78); P.push(p.a, 0, p.b, 0.3);
    for (const s of [-0.9, 0.9]) P.cyl(M.vehicle, [s, 0.55, 0], [s + Math.sign(s) * 0.12, 0.55, 0], 0.55, 0.55, 12, true);
    P.box(M.vehicle, -0.7, 0.7, 0.5, 0.9, -0.2, 0.2, 'b', 1); P.box(M.vehicle, -0.6, 0.6, 0.55, 1.5, 0.3, 0.38, 'b', 1);
    P.cyl(M.vehicle, [0, 1.0, 0.2], [0, 1.2, 2.9], 0.08, 0.06, 6, true); P.cyl(M.vehicle, [-0.1, 0.5, -0.2], [-0.3, 0.2, -2.0], 0.06, 0.05, 5, true); P.cyl(M.vehicle, [0.1, 0.5, -0.2], [0.3, 0.2, -2.0], 0.06, 0.05, 5, true);
    P.pop(); }
  // armoured car (5.2 x 1.9 x 2.8 m): hull, turret, four wheels
  { const p = at(-6598, -80); P.push(p.a, 0, p.b, 0.3);
    P.box(M.vehicleGrey, -0.95, 0.95, 0.5, 1.9, -2.6, 2.6, 'b', 1); P.box(M.vehicleGrey, -0.8, 0.8, 1.9, 2.3, -0.4, 1.2, 'b', 1);
    P.col(M.vehicleGrey, 0, -0.8, 2.3, 2.8, 0.7, 0.55, 8, true); P.cyl(M.pole, [0, 2.5, -0.2], [0, 2.5, 1.2], 0.06, 0.06, 5, true);
    for (const x of [-1.0, 1.0]) for (const z of [-1.6, 1.4]) P.cyl(M.peri, [x, 0.5, z], [x + Math.sign(x) * 0.15, 0.5, z], 0.5, 0.5, 10, true);
    P.pop(); }
  // truck (6.0 x 2.3 x 2.6 m, cab-over): cab, open bed, six wheels
  { const p = at(-6565, -95); P.push(p.a, 0, p.b, -0.6);
    P.box(M.vehicle, -1.1, 1.1, 0.7, 2.6, 1.5, 3.0, 'b', 1); P.box(M.vehicle, -1.1, 1.1, 0.7, 1.4, -3.0, 1.5, 'b', 1);
    for (const s of [-1.1, 1.1]) P.box(M.vehicle, s - 0.04, s + 0.04, 1.4, 2.1, -3.0, 1.5, 'b', 1);
    P.box(M.glassDark, -0.9, 0.9, 1.7, 2.4, 3.0, 3.03, 'b', 1);
    for (const x of [-1.1, 1.1]) for (const z of [2.0, -1.2, -2.5]) P.cyl(M.peri, [x, 0.5, z], [x + Math.sign(x) * 0.25, 0.5, z], 0.5, 0.5, 10, true);
    P.pop(); }
}

/** a rough boulder: icosphere (detail 2) made non-indexed (flat facets), every vertex pushed out by a position hash (so shared corners stay shared), the +x side clamped to a plane (the polished face) */
function boulderGeo() {
  const g0 = new THREE.IcosahedronGeometry(1, 2), g = g0.index ? g0.toNonIndexed() : g0, pa = g.attributes.position;
  const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  const q = (v) => Math.round(v * 100) / 100;
  for (let i = 0; i < pa.count; i++) {
    let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    const r = 0.8 + 0.4 * hash(q(x), q(y), q(z));
    x *= r; y *= r; z *= r;
    if (x > 0.86) x = 0.86;
    pa.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------ the foundation stone (OSM n10033881447): a rough granite boulder with a polished inscribed face on a granite drum on a round gravel plaza
function stone(K) {
  const P = K.P, M = K.M, c = SUB.stone;
  P.push(c.x, 0, c.z, 0);
  try {
    const pl = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; pl.push([Math.cos(a) * 3.0, Math.sin(a) * 3.0]); }
    P.cap(M.gravel, pl, 0.03, true, 2);
    P.col(M.graniteDark, 0, 0, 0.0, 0.8, 1.6, 1.6, 20, true);
    P.col(M.graniteDark, 0, 0, 0.8, 0.86, 1.66, 1.66, 20, true);                       // the drum's cap ring
    // the rough boulder: a faceted, deterministically displaced icosphere (flat shaded), 1.9 x 1.4 x 1.3 m, its +x side cut flat = the polished face
    const b = boulderGeo(); P.geo(M.boulder, b, 0, 1.4, 0, 0, 0, 0, 0.95, 0.7, 1.0); b.dispose();
    // the polished face with the inscription plate, looking +x (toward the pavilion and the hull): a darker polished field 1.2 x 0.85 m and the plate 0.9 x 0.7 m on it
    const fx = 0.95 * 0.86 + 0.012;
    P.quad(M.polished, [fx, 1.0, 0.6], [fx, 1.0, -0.6], [fx, 1.85, -0.6], [fx, 1.85, 0.6], [1, 0, 0]);
    P.quad(M.stonePlate, [fx + 0.012, 1.08, 0.45], [fx + 0.012, 1.08, -0.45], [fx + 0.012, 1.78, -0.45], [fx + 0.012, 1.78, 0.45], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ path lamps of the museum yard (photos d14 d17 d19: grey tubular poles ~5 m with ONE white opal globe, one per ~20 m along the footways); no lamp is mapped in the OSM data there.
// Frame D positions: the SE footway w1537775740 (x +9.5 from the hull axis, z -56 .. +37), the door path, the stone plaza.  Instanced (2 meshes), never within 1 m of asphalt (road integrity), thin cylinder colliders.
function lamps(K) {
  const ctx = K.ctx, M = K.M, cover = coverFn(ctx);
  const parts = partsGeos((p) => {
    p.col(M.lampPole, 0, 0, 0, 0.25, 0.14, 0.1, 8, true); p.col(M.lampPole, 0, 0, 0.25, 4.9, 0.065, 0.05, 8, true); p.col(M.lampPole, 0, 0, 4.8, 4.98, 0.13, 0.13, 8, true);
    const g = new THREE.SphereGeometry(0.27, 10, 8); p.geo(M.lampGlobe, g, 0, 5.28, 0); g.dispose();
  });
  const spots = [[10.9, -42], [10.9, -19], [10.9, 4], [10.9, 27], [4.5, -50], [-27.5, -12]], at = [], items = [];
  for (const [a, b] of spots) {
    const w = D.W(a, b);
    if (cover(w.x, w.z) > -1.0 || L.inRiver(w.x, w.z)) continue;
    at.push({ x: w.x, y: 0, z: w.z, rotY: 0 }); items.push(ctx.physics.addCylinder(w.x, w.z, 0.12, 0, 5.4)); K.svc.lamps.push({ x: w.x, z: w.z, h: 5.3 });
  }
  // n4spb (docs/AREAS.md 13, 15.v): the path lamps are knock records (the source drew static instances over solid cylinders)
  K.extraTris += knockFurniture(ctx, 'lmseate-lamps', parts, at, items, FURNITURE_REC.lamp(5.4), 300);
}

// ------------------------------------------------------------------------------------------------ colliders: the hull (three boxes along the axis), the tower, the pavilion walls, the cradles, the stone, the exhibits; the yard is walkable
function colliders(K) {
  const ph = K.ctx.physics, w = (a, b) => D.W(a, b);
  const box = (a, b, wd, dp, y0, y1) => { const p = w(a, b); return ph.addBox(p.x, p.z, wd, dp, D.rot, y0, y1); };
  box(0, 0, 6.2, 76.0, SUB.keel, SUB.deck);
  box(0, SUB.towerZ, 3.4, 8.4, SUB.deck, SUB.towerTop);
  const pv = SUB.pav;
  box((pv.x0 + pv.x1) / 2, (pv.z0 + pv.z1) / 2, pv.x1 - pv.x0, pv.z1 - pv.z0, 0, pv.h + 0.4);
  for (const c of SUB.cradles) box(c.x, c.z, c.w, c.d, 0, 2.9);
  const s = SUB.stone; const p = w(s.x, s.z); ph.addCylinder(p.x, p.z, 1.6, 0, 2.2);
  box(0, -37.2, 0.4, 3.0, 0.2, 6.0);                                                          // the rudder
  for (const [wx, wz, wd, dp] of [[-6605, -78, 2.2, 3.4], [-6598, -80, 2.0, 5.2], [-6565, -95, 2.4, 6.0]]) ph.addBox(wx, wz, wd, dp, D.rot, 0, 2.8);
}

function services(K) {
  const hull = D.W(0, 0), st = D.W(SUB.stone.x, SUB.stone.z), en = D.W(SUB.entrance.x, SUB.entrance.z);
  K.svc.monuments.push({ id: 'r14595064', name: 'Подводная лодка Д-2 «Народоволец»', x: hull.x, z: hull.z, h: SUB.towerTop + 4 });
  K.svc.monuments.push({ id: 'n10033881447', name: 'Закладной камень мемориала подводников', x: st.x, z: st.z, h: 2.2, r: 3 });
  const sp = (name, x, z, tx, tz) => K.svc.photoSpots.push({ name, x, z, yaw: L.yawToward(x, z, tx, tz), pitch: 3 });
  sp('Д-2: борт со стороны тропы', -6591, -54.3, hull.x, hull.z);
  const lw = D.W(0, 26);                                                              // the bow quarter seen from the public quay strip (the dossier spot (-6650, -36) and the edge (-6633, -17) lie in / on the scene's water)
  sp('Д-2: нос с угла набережной', -6630, -25, lw.x, lw.z);
  sp('Д-2: корма и вход', -6556, -80, hull.x, hull.z);
  K.svc.entrances.push({ id: 'd2-entrance', x: en.x, z: en.z, rotY: D.rot, kind: 'museum', closed: false });
  K.svc.crowd.push({ id: 'd2-entrance', kind: 'queue', x: en.x + 2, z: en.z + 1, r: 5, n: 3 });
  K.svc.d2 = { hull: [hull.x, hull.z], tower: D.W(0, SUB.towerZ) };
}
