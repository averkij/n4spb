// landmarksNavalCorps/sub.js - the museum SUBMARINE S-189 (Project 613 "Whiskey", 1954; Baltic Shipyard; museum since 2010; OSM w133084707) and its floating PIER (OSM w945633057, w945633056).
// Dossier docs/research/navalcorps.md section 7, photos refs/navalcorps d01 d02 d09 d12 d23 n08 n09 (the critic's orientation: the BOW is the NORTH-EAST end, bluff, the pointed STERN the SOUTH-WEST end).
// Frame S: origin = the hull midpoint, local +z = the STERN (SW), local -z = the BOW (NE), local +x = the pier side (SE), -x = the quay side (NW); y absolute (waterline -3.4); the hull spans z -38.03 .. +38.03.
//   HULL    a loft of 19 stations (plan: elliptical bluff bow, parallel body to z +8, tapering stern), 76.06 x 6.64 m, casing top 2.3 m above the waterline (a flat 2.6 m deck), the sides a "pear" section
//           (flat top, rounded to the widest point at the waterline, round bilge down to the keel 4.55 m below); light grey casing above the white boot-top line (1.0 m above the water), bright green below it;
//           two rows of black free-flood slots along each side, a block of round holes at both ends, bitts, hatches, a dark walkway strip.
//   SAIL    5.5 m above the casing at z -16 (+-6: 29 % of the length from the BOW), 9.0 x 3.4 m with a rounded bow side, a bridge screen with four windows facing the bow, a ladder on the bow face, a searchlight
//           stalk on the stern side, the numerals С189 (white block letters with a black shadow) on both sides, five masts (two periscopes, snorkel, radio mast, rod), NO flag and NO staff.
//   PIER    a floating concrete wharf 218 x 9 m (x 3.2 .. 12.2, z -168.6 .. +49.2): deck 1.3 m above the water, concrete coaming, the red-and-white fender face, black double bollards every 12 m, the dark
//           green mesh fence on the hull side, the gangway (white banner with the museum name, no saltire), the grey tent on the casing, the blue ticket tent and the teal umbrella.  Scenery: not walkable.
import * as L from '../layout.js';
import { S as FS, SUB, PIER } from './frame.js';
import { addFloatBlock } from '../lib/craft-solids.js';      // n4spb (docs/water-transport-boat-collisions.md): the floating pier is solid for the motor boat

const WL = -3.4;
const LV = [2.3, 1.8, 1.4, 1.0, 0.8, 0.0, -1.0, -2.2, -3.4, -4.2, -4.55];
const ZS = [-38.03, -37.6, -36.8, -35.5, -33.5, -31, -28, -24, -16, -8, 0, 8, 14, 20, 26, 31, 34.5, 36.8, 38.03];
const clamp01 = (v) => Math.max(0, Math.min(1, v));
/** plan half-beam factor along the hull (elliptical bluff bow in the first 14 m, parallel body to z +8, a taper to a nearly pointed stern) */
const g = (z) => (z < -24.03 ? Math.sqrt(clamp01(1 - (1 - (z + 38.03) / 14) ** 2)) : z <= 8 ? 1 : 1 - Math.pow((z - 8) / 30.03, 1.6) * 0.93);
const beam = (z) => 3.32 * g(z);
/** x of the hull surface at height y (relative to the waterline) and station z */
function hx(z, y) {
  const B = beam(z), wt = Math.min(1.3, B * 0.75);
  return y >= 0 ? wt + (B - wt) * Math.sqrt(Math.max(0, 1 - (y / 2.3) ** 2)) : B * Math.sqrt(Math.max(0, 1 - (y / 4.55) ** 2));
}

export function build(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksNavalCorps] sub/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = Q.P;
  P.push(FS.x, 0, FS.z, FS.rot);
  try {
    stage('hull', () => hull(Q));
    stage('details', () => details(Q));
    stage('sail', () => sail(Q));
    stage('pier', () => pier(Q));
    stage('fittings', () => fittings(Q));
  } finally { P.pop(); }
  // n4spb (docs/AREAS.md 13.7, docs/vo-m2.md): the hull and the floating pier SIT IN THE WATER and were scenery without any collider (a boat, a car on the bed and a walker went through the submarine). They are solid STRUCTURES now, like the Krasin
  // hull: the hull in three blocks that follow its plan (bow, parallel body, tapering stern) from below the keel to the casing, the pier (a floating wharf, not walkable) as a float block that stops the motor boat; the quay side (-x) stays open
  // water between the quay and the hull, and both ends of the pier are open: the water is not walled (water-reachable-test check 1).
  stage('colliders', () => {
    const ph = Q.ctx.physics, y0 = WL - SUB.draught - 0.2, y1 = WL + SUB.deck;
    FS.box(ph, 0, -30, 5.0, 12, y0, y1); FS.box(ph, 0, -8, SUB.beam, 32, y0, y1); FS.box(ph, 0, 19, 3.6, 22, y0, y1);
    const pc = FS.W((PIER.x0 + PIER.x1) / 2, (PIER.z0 + PIER.z1) / 2);
    addFloatBlock(ph, pc.x, pc.z, PIER.x1 - PIER.x0, PIER.z1 - PIER.z0, FS.rot, WL);
  });
  stage('spots', () => spots(Q));
  const c = FS.W(0, 0);
  Q.svc.monuments.push({ id: 'w133084707', name: 'Подводная лодка-музей С-189', x: c.x, z: c.z, h: 15.6 });
  Q.svc.sub = { centre: [c.x, c.z], sail: FS.W(0, SUB.sailZ) };
  if (errs.length) throw new Error(errs.join('\n'));
}

function hull(Q) {
  const P = Q.P, M = Q.M;
  const mat = (y0, y1) => (y1 >= 1.0 - 1e-6 ? M.hull : y1 >= 0.8 - 1e-6 ? M.boot : M.green);
  for (let i = 0; i + 1 < ZS.length; i++) {
    const za = ZS[i], zb = ZS[i + 1];
    for (let j = 0; j + 1 < LV.length; j++) {
      const ya = LV[j] + WL, yb = LV[j + 1] + WL, m = mat(LV[j], LV[j + 1]);
      const xa0 = hx(za, LV[j]), xa1 = hx(za, LV[j + 1]), xb0 = hx(zb, LV[j]), xb1 = hx(zb, LV[j + 1]);
      const ny = LV[j] >= 0 ? 0.25 : -0.5;
      for (const s of [1, -1]) {
        if (xa0 + xb0 + xa1 + xb1 < 0.001) continue;
        P.quad(m, [s * xa0, ya, za], [s * xa1, yb, za], [s * xb1, yb, zb], [s * xb0, ya, zb], [s, ny, 0], [[za / 4, ya / 2], [za / 4, yb / 2], [zb / 4, yb / 2], [zb / 4, ya / 2]]);
      }
    }
    // the deck between the two top edges
    const wa = hx(za, 2.3), wb = hx(zb, 2.3);
    P.quad(M.hull, [-wa, 2.3 + WL, za], [wa, 2.3 + WL, za], [wb, 2.3 + WL, zb], [-wb, 2.3 + WL, zb], [0, 1, 0], [[-wa / 3, za / 3], [wa / 3, za / 3], [wb / 3, zb / 3], [-wb / 3, zb / 3]]);
  }
  // the stern end: a fan over the last ring (the casing ends in a rounded tail)
  const ze = ZS[ZS.length - 1], ring = [];
  for (const s of [1, -1]) for (let j = s > 0 ? 0 : LV.length - 1; s > 0 ? j < LV.length : j >= 0; j += s) ring.push([s * hx(ze, LV[j]), LV[j] + WL, ze]);
  P.fan(M.hull, ring, [0, 0, 1]);
}

function details(Q) {
  const P = Q.P, M = Q.M;
  // two rows of black free-flood slots along each side (0.9 x 0.18 m, every 1.4 m) from the bow quarter to the stern quarter
  for (const [yr, z0, z1] of [[1.45, -33.5, 29], [1.85, -33.5, 29]]) {
    for (let z = z0; z <= z1; z += 1.4) {
      if (z > -22 && z < -10 && yr > 1.7) continue;                                    // the sail foot hides the upper row
      const x = hx(z, yr) + 0.006, x2 = hx(z + 0.9, yr) + 0.006;
      for (const s of [1, -1]) P.quad(M.glassDark, [s * x, yr + WL, z], [s * x, yr + 0.18 + WL, z], [s * x2, yr + 0.18 + WL, z + 0.9], [s * x2, yr + WL, z + 0.9], [s, 0, 0]);
    }
  }
  // the blocks of small round holes at both ends (nine at the stern, seven at the bow), a flat stripe of white draft marks at the stern
  for (const [zc, n] of [[34.6, 9], [-33.2, 7]]) for (let k = 0; k < n; k++) {
    const z = zc + (k % 5) * 0.28 * (zc > 0 ? 1 : -1), y = 1.7 - Math.floor(k / 5) * 0.28, x = hx(z, y) + 0.006;
    for (const s of [1, -1]) P.cyl(M.glassDark, [s * x, y + WL, z], [s * (x + 0.02), y + WL, z], 0.06, 0.06, 6, true);
  }
  // casing: hatch coamings (forward and aft), bitts, the dark perforated walkway from the sail to the bow
  for (const z of [-30.5, 24.5]) P.box(M.hull, -0.55, 0.55, 2.3 + WL, 2.55 + WL, z - 0.6, z + 0.6, 'b', 1);
  P.box(M.deck, -0.45, 0.45, 2.3 + WL + 0.01, 2.34 + WL, -34, -21, 'b', 2);
  for (const z of [-30, -10, 10, 30]) for (const s of [1, -1]) { const x = s * (hx(z, 2.3) - 0.35); P.box(M.pole, x - 0.15, x + 0.15, 2.3 + WL, 2.75 + WL, z - 0.2, z + 0.2, 'b', 1); }
  // a short jack-staff stub is NOT drawn (no staffs at all); the draft scale at the bow (a column of white ticks) is drawn as thin white bars
  for (let k = 0; k < 12; k++) for (const s of [1, -1]) { const y = 2.2 - k * 0.38, z = -34.5, x = hx(z, Math.max(-4, y)) + 0.01; P.box(M.boot, s * x - (s > 0 ? 0 : 0.02), s * x + (s > 0 ? 0.02 : 0), y + WL, y + WL + 0.16, z - 0.18, z + 0.18, 'b', 1); }
}

function sail(Q) {
  const P = Q.P, M = Q.M, y0 = 2.3 + WL, y1 = 7.8 + WL, zc = SUB.sailZ, za = zc - 4.5, zb = zc + 4.5, w = 1.7;
  // body: a prism with a rounded bow end (radius 1.7 at za), vertical sides that lean in 0.25 m toward the top (a streamlined fairing), flared skirt at the base
  const n = 8, A = { r: w, zr: za + 1.7 }, B = { r: w - 0.3, zr: za + 1.7 + 0.9 };
  // plan points (x, z) of the bottom and top ring: the stern edge flat at zb, the bow end a half circle centred at zr
  const plan = (R) => { const pts = [[R.r, zb], [R.r, R.zr]]; for (let k = 1; k < n; k++) { const a = Math.PI * k / n; pts.push([R.r * Math.cos(a), R.zr - R.r * Math.sin(a)]); } pts.push([-R.r, R.zr], [-R.r, zb]); return pts; };
  const pa = plan(A), pb = plan(B), m = pa.length;
  for (let k = 0; k < m; k++) {
    const k2 = (k + 1) % m, a = pa[k], b = pa[k2], a2 = pb[k], b2 = pb[k2], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    const cx = 0, cz = (za + zb) / 2, nx = mx - cx, nz = mz - cz;
    P.quad(M.sailPlate, [a[0], y0, a[1]], [b[0], y0, b[1]], [b2[0], y1, b2[1]], [a2[0], y1, a2[1]], [nx, 0.1, nz], [[a[1] / 3, y0 / 3], [b[1] / 3, y0 / 3], [b2[1] / 3, y1 / 3], [a2[1] / 3, y1 / 3]]);
  }
  P.fan(M.hull, pb.map((p) => [p[0], y1, p[1]]), [0, 1, 0]);
  // flare skirts at the foot
  P.box(M.hull, -w - 0.12, w + 0.12, y0, y0 + 0.4, za - 0.12 + 1.7 - 1.7, zb + 0.12, 'b', 2);
  // the bridge screen on top: a 1.1 m high shield with four small windows on the bow side
  const ys = y1, zs0 = za + 0.7, zs1 = zb - 1.5;
  P.box(M.sailPlate, -1.35, 1.35, ys, ys + 1.1, zs0, zs1, 'b', 3);
  // the handrail round the top of the screen (d04: a stainless rail 1.0 m high on posts every 1.3 m with X braces in the long bays)
  { const hx0 = -1.3, hx1 = 1.3, hz0 = zs0 + 0.15, hz1 = zs1 - 0.15, yb = ys + 1.1, yt = yb + 0.95, t = 0.025;
    const runs = [[hx0, hz0, hx1, hz0], [hx1, hz0, hx1, hz1], [hx1, hz1, hx0, hz1], [hx0, hz1, hx0, hz0]];
    for (const [xa, za2, xb, zb2] of runs) {
      P.cyl(M.mast, [xa, yt, za2], [xb, yt, zb2], t, t, 5, false); P.cyl(M.mast, [xa, yb + 0.5, za2], [xb, yb + 0.5, zb2], t * 0.8, t * 0.8, 5, false);
      const L2 = Math.hypot(xb - xa, zb2 - za2), n2 = Math.max(1, Math.round(L2 / 1.3));
      for (let i = 0; i <= n2; i++) { const f = i / n2, px = xa + (xb - xa) * f, pz = za2 + (zb2 - za2) * f; P.cyl(M.mast, [px, yb, pz], [px, yt, pz], t, t, 5, false); }
    }
    for (const [xa, za2, xb, zb2] of [runs[1], runs[3]]) { const f = 0.5; P.cyl(M.mast, [xa, yb, za2], [xa + (xb - xa) * f, yt, za2 + (zb2 - za2) * f], 0.015, 0.015, 4, false); P.cyl(M.mast, [xb, yb, zb2], [xb + (xa - xb) * f, yt, zb2 + (za2 - zb2) * f], 0.015, 0.015, 4, false); } }
  for (let k = 0; k < 4; k++) { const x = -1.0 + k * 0.67; P.box(M.glassDark, x - 0.22, x + 0.22, ys + 0.5, ys + 0.9, zs0 - 0.02, zs0 + 0.005, 'bk', 1); }
  // searchlight stalk on the stern side, a ladder (two rails and rungs) on the bow face
  P.col(M.pole, 0.0, zb - 0.9, ys + 1.1, ys + 1.9, 0.07, 0.07, 6, false); P.col(M.hull, 0.0, zb - 0.9, ys + 1.9, ys + 2.15, 0.28, 0.2, 10, true);
  for (const s of [-1, 1]) P.box(M.pole, s * 0.2 - 0.02, s * 0.2 + 0.02, y0 + 0.2, ys + 1.0, za - 0.02 + 0.0, za + 0.04, 'b', 1);
  for (let k = 0; k < 14; k++) P.box(M.pole, -0.2, 0.2, y0 + 0.4 + k * 0.45, y0 + 0.44 + k * 0.45, za - 0.03, za + 0.01, 'b', 1);
  // the numerals С189 on both sides: 4.2 x 2.1 m, centre 3.2 m above the casing and 1.5 m aft of the middle of the side; left-to-right as seen from outside
  const nz0 = zc + 1.5 - 2.1, nz1 = zc + 1.5 + 2.1, ny0 = 2.3 + WL + 2.2, ny1 = ny0 + 2.1, xs = 1.7 - 0.25 * (2.2 + 1.05) / 5.5 + 0.03;
  P.quad(M.sail, [-xs, ny0, nz0], [-xs, ny0, nz1], [-xs, ny1, nz1], [-xs, ny1, nz0], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);          // quay side: z runs to the right
  P.quad(M.sail, [xs, ny0, nz1], [xs, ny0, nz0], [xs, ny1, nz0], [xs, ny1, nz1], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);               // pier side: reversed
  // five masts: periscopes (+7.0, +6.2 above the sail top), the snorkel with a head valve (+5.0), the radio mast (+4.4) and a rod (+3.4)
  for (const [x, z, h, r] of [[0.35, zc - 0.6, 7.0, 0.1], [-0.2, zc - 0.9, 6.2, 0.1], [0.75, zc + 0.3, 5.0, 0.12], [-0.7, zc + 0.5, 4.4, 0.07], [0.1, zc + 1.1, 3.4, 0.04]]) {
    P.col(M.mast, x, z, ys + 1.1, ys + 1.1 + h, r, r * 0.8, 8, true);
  }
  P.cyl(M.mast, [0.75, ys + 6.1 - 0.0, zc + 0.3], [0.75, ys + 6.5, zc + 0.3], 0.2, 0.2, 8, true);
}

function pier(Q) {
  const P = Q.P, M = Q.M, ya = -2.1, yb = -3.8, x0 = 3.2, x1 = 12.2, z0 = PIER.z0 ?? -168.6, z1 = PIER.z1 ?? 49.2;
  // deck, the two long faces (the SE one is the red-and-white fender face), the two ends, the coaming
  P.quad(M.concrete, [x0, ya, z0], [x1, ya, z0], [x1, ya, z1], [x0, ya, z1], [0, 1, 0], [[x0 / 3, z0 / 3], [x1 / 3, z0 / 3], [x1 / 3, z1 / 3], [x0 / 3, z1 / 3]]);
  P.quad(M.fender, [x1, yb, z0], [x1, yb, z1], [x1, ya, z1], [x1, ya, z0], [1, 0, 0], [[z0 / 6, 0], [z1 / 6, 0], [z1 / 6, 1.0], [z0 / 6, 1.0]]);
  P.quad(M.fender, [x0, yb, z1], [x0, yb, z0], [x0, ya, z0], [x0, ya, z1], [-1, 0, 0], [[z1 / 6, 0], [z0 / 6, 0], [z0 / 6, 1.0], [z1 / 6, 1.0]]);
  P.quad(M.concrete, [x0, yb, z0], [x1, yb, z0], [x1, ya, z0], [x0, ya, z0], [0, 0, -1]); P.quad(M.concrete, [x1, yb, z1], [x0, yb, z1], [x0, ya, z1], [x1, ya, z1], [0, 0, 1]);
  for (const xe of [x0 + 0.1, x1 - 0.1]) P.box(M.concrete, xe - 0.15, xe + 0.15, ya, ya + 0.6, z0, z1, 'b', 3);
  // black double mooring bollards every 12 m on both edges
  for (let z = z0 + 6; z < z1 - 2; z += 12) for (const xe of [x0 + 0.5, x1 - 0.5]) { for (const dz of [-0.2, 0.2]) P.col(M.pole, xe, z + dz, ya, ya + 0.45, 0.15, 0.1, 6, true); P.box(M.pole, xe - 0.12, xe + 0.12, ya + 0.38, ya + 0.46, z - 0.35, z + 0.35, 'b', 1); }
  // the dark green mesh fence on the hull side (NW edge), 1.1 m high, posts every 3 m, from the stern to the bow
  const fz0 = -38, fz1 = 38, fx = x0 + 0.5;
  P.box(M.meshFence, fx - 0.03, fx + 0.03, ya + 0.9, ya + 1.1, fz0, fz1, 'b', 1); P.box(M.meshFence, fx - 0.02, fx + 0.02, ya + 0.45, ya + 0.5, fz0, fz1, 'b', 1);
  for (let z = fz0; z <= fz1 + 0.01; z += 3) P.box(M.meshFence, fx - 0.04, fx + 0.04, ya, ya + 1.1, z - 0.04, z + 0.04, 'b', 1);
  // the footbridge to the second pier at the SW end: a 1.5 m deck with rails
  P.box(M.concrete, 6.2, 7.7, ya, ya + 0.12, z1, z1 + 2.9, 'b', 2); for (const xr of [6.2, 7.7]) P.box(M.pole, xr - 0.02, xr + 0.02, ya + 0.12, ya + 1.0, z1, z1 + 2.9, 'b', 1);
}

function fittings(Q) {
  const P = Q.P, M = Q.M, ya = -2.1, yd = 2.3 + WL;
  // the gangway: 1.2 m wide, from the casing next to the sail foot (z -9.5, x 1.1) down to the pier (x 4.6, z -6.2); the plain white banner with the museum name on the near rail
  { const a = [1.1, yd, -9.5], b = [4.6, ya + 0.1, -6.2], dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, nx = -uz, nz = ux;
    for (const s of [-0.6, 0.6]) {
      P.cyl(M.mast, [a[0] + nx * s, a[1] + 1.0, a[2] + nz * s], [b[0] + nx * s, b[1] + 1.0, b[2] + nz * s], 0.025, 0.025, 6, false);
      P.cyl(M.mast, [a[0] + nx * s, a[1], a[2] + nz * s], [a[0] + nx * s, a[1] + 1.0, a[2] + nz * s], 0.025, 0.025, 6, false);
      P.cyl(M.mast, [b[0] + nx * s, b[1], b[2] + nz * s], [b[0] + nx * s, b[1] + 1.0, b[2] + nz * s], 0.025, 0.025, 6, false);
    }
    P.quad(M.deck, [a[0] + nx * 0.6, a[1], a[2] + nz * 0.6], [a[0] - nx * 0.6, a[1], a[2] - nz * 0.6], [b[0] - nx * 0.6, b[1], b[2] - nz * 0.6], [b[0] + nx * 0.6, b[1], b[2] + nz * 0.6], [0, 1, 0]);
    // the banner on the quay-side rail (facing the quay, -x side)
    const s = -0.62; P.quad(M.banner, [a[0] + nx * s, a[1] + 0.15, a[2] + nz * s], [b[0] + nx * s, b[1] + 0.15, b[2] + nz * s], [b[0] + nx * s, b[1] + 0.95, b[2] + nz * s], [a[0] + nx * s, a[1] + 0.95, a[2] + nz * s], [nx * -1, 0, nz * -1], [[1, 0], [0, 0], [0, 1], [1, 1]]);   // review 2026-10-08: the rail (s = -0.62) is on the +x / -z (pier) side and the face looks that way: the text was MIRRORED (u ran against the reading direction), so u is reversed
  }
  // the grey tent on the casing deck behind the sail foot (3.5 x 3.5 m, 3 m high, sloping front) and the lifebuoy ring on the rail at the sail foot
  { const x0 = -1.2, x1 = 1.2, z0 = -9.3, z1 = -5.0;
    P.box(M.tent, x0, x1, yd, yd + 2.2, z0, z1, 'bt', 1);
    P.quad(M.tent, [x0, yd + 2.2, z0], [x1, yd + 2.2, z0], [x1, yd + 3.0, z0 + 1.0], [x0, yd + 3.0, z0 + 1.0], [0, 1, -0.3]);
    P.quad(M.tent, [x0, yd + 3.0, z0 + 1.0], [x1, yd + 3.0, z0 + 1.0], [x1, yd + 3.0, z1], [x0, yd + 3.0, z1], [0, 1, 0]); }
  P.cyl(M.lifebuoy, [-1.75, yd + 2.4, -10.2], [-1.75, yd + 2.4, -10.2 + 0.02], 0.3, 0.3, 14, true);
  // the blue ticket tent (5 x 3 m, gabled, 2.4 m) on the pier near the NE end of the hull and the teal umbrella (4 m square) at the gangway foot
  { const x0 = 4.6, x1 = 9.6, z0 = -31.5, z1 = -28.5;
    P.box(M.blueTent, x0, x1, ya, ya + 1.9, z0, z1, 't', 1);
    P.quad(M.blueTent, [x0, ya + 1.9, z0], [x1, ya + 1.9, z0], [x1, ya + 2.5, (z0 + z1) / 2], [x0, ya + 2.5, (z0 + z1) / 2], [0, 1, -1]); P.quad(M.blueTent, [x1, ya + 1.9, z1], [x0, ya + 1.9, z1], [x0, ya + 2.5, (z0 + z1) / 2], [x1, ya + 2.5, (z0 + z1) / 2], [0, 1, 1]);
    P.fan(M.blueTent, [[x0, ya + 1.9, z0], [x0, ya + 1.9, z1], [x0, ya + 2.5, (z0 + z1) / 2]], [-1, 0, 0]); P.fan(M.blueTent, [[x1, ya + 1.9, z1], [x1, ya + 1.9, z0], [x1, ya + 2.5, (z0 + z1) / 2]], [1, 0, 0]); }
  { const ux = 8.0, uz = -7.0;
    P.col(M.pole, ux, uz, ya, ya + 2.6, 0.04, 0.04, 6, false);
    P.fan(M.umbrella, [[ux - 2, ya + 2.35, uz - 2], [ux + 2, ya + 2.35, uz - 2], [ux, ya + 2.95, uz]], [0, 0.4, -1]); P.fan(M.umbrella, [[ux + 2, ya + 2.35, uz - 2], [ux + 2, ya + 2.35, uz + 2], [ux, ya + 2.95, uz]], [1, 0.4, 0]);
    P.fan(M.umbrella, [[ux + 2, ya + 2.35, uz + 2], [ux - 2, ya + 2.35, uz + 2], [ux, ya + 2.95, uz]], [0, 0.4, 1]); P.fan(M.umbrella, [[ux - 2, ya + 2.35, uz + 2], [ux - 2, ya + 2.35, uz - 2], [ux, ya + 2.95, uz]], [-1, 0.4, 0]); }
}

/** photo spots on the promenade abeam of the hull: the first dry point landward of the water edge (layout.inRiver) + 2.5 m, looking across at the boat; the crowd disc of the tourists at the sail */
function spots(Q) {
  const edgeX = (z) => { for (let t = 0; t < 120; t += 0.25) { const w = FS.W(-t, z); if (!L.inRiver(w.x, w.z)) return t; } return null; };
  for (const [name, z, zt] of [['С-189: рубка с набережной', SUB.sailZ, SUB.sailZ], ['С-189: корма (юго-запад)', 34, 30], ['С-189: нос (северо-восток)', -34, -30]]) {
    const t = edgeX(z); if (t == null) continue;
    const p = FS.W(-(t + 2.5), z), q = FS.W(0, zt);
    Q.svc.photoSpots.push({ name, x: p.x, z: p.z, yaw: L.yawToward(p.x, p.z, q.x, q.z), pitch: 2 });
    if (z === SUB.sailZ) Q.svc.crowd.push({ id: 's189-promenade', kind: 'photo', x: p.x, z: p.z, r: 4, n: 4 });
  }
}
