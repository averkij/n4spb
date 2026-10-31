// landmarksYelaginKitchen/body.js - the walls of the Kitchen block: the half drum R 29.83 with its 10 rectangular statue niches (frames with ears), the flat NORTH wall with six arched vase niches, the limestone
// plinth + three grooved bands, the entablature (architrave, frieze with flat strips, mutule cornice, corona, gutter), the zinc roof with its ring of chimney boxes, two small hipped end blocks, the courtyard
// (floor, walls; closed, seen only from above) and the downpipes.  Photos kit_02 kit_04 kit_08 kit_11 kit_13 kit_15 kit_16.  Everything is built in frame K (frame.js).
import * as THREE from 'three';
import { C, TH, D, POR, STATUES } from './frame.js';
import { ringEdges, band, rectPath, archPath } from './kit.js';
import { mutules } from './orders.js';

const DEG = Math.PI / 180, R = D.R;
const PHI_E = Math.acos(D.wN / R) * 1;                  // the arc ends where it meets the north wall plane (w = -0.35): angle from the south axis, rad (> 90 deg)
const PHI_P = Math.asin(POR.halfW / R);                 // the arc meets the portico side planes (u = +-9.15)
const ALPHA = Math.asin(D.nicheW / 2 / R);              // half angle of a niche opening

/** the arc angles of the ring: grid 3 deg + the portico edges + the ends + both edges of every niche (no angle inside the portico notch).  Returns the left group (-PHI_E .. -PHI_P) and the right one (PHI_P .. PHI_E) */
export function ringAngles() {
  const set = new Set();
  const add = (a) => { if (Math.abs(a) >= PHI_P - 1e-6 && Math.abs(a) <= PHI_E + 1e-6) set.add(Math.round(a * 1e7) / 1e7); };
  for (let d = -90; d <= 90; d += 3) add(d * DEG);
  add(PHI_E); add(-PHI_E); add(PHI_P); add(-PHI_P);
  for (const s of STATUES) if (s.place === 'arc') { const p = s.phi * DEG; add(p - ALPHA); add(p + ALPHA); add(p); }
  const all = [...set].sort((a, b) => a - b);
  return { left: all.filter((a) => a < 0), right: all.filter((a) => a > 0) };
}
const pol = (phi, r = R) => [r * Math.sin(phi), r * Math.cos(phi)];

export function ringPoints() {
  const { left, right } = ringAngles();
  const pts = [...left.map((a) => pol(a)), ...right.map((a) => pol(a))];
  const uE = pts[pts.length - 1][0];
  pts.push([POR.halfW, D.wN], [-POR.halfW, D.wN]);
  void uE;
  return pts;
}

export function build(K) {
  const { M, P } = K;
  P.push(C.x, 0, C.z, TH);
  const ring = ringPoints();
  const poly = { o: ring.flat(), h: [] };
  const edges = ringEdges(poly);
  const inNotch = (e) => { const um = Math.abs((e.a[0] + e.b[0]) / 2), wm = (e.a[1] + e.b[1]) / 2; return um <= POR.halfW + 0.01 && Math.abs(e.a[0]) <= POR.halfW + 0.01 && Math.abs(e.b[0]) <= POR.halfW + 0.01 && (wm > 20 || wm < 0); };
  const draw = (e) => !inNotch(e);

  // ---- plinth: tan limestone courses (0 .. 0.55) and the three grooved white bands (0.55 .. 1.1)
  band(P, edges, 0, 0.55, 0.09, { front: M.plinth, top: M.whiteFlat }, { draw, uvs: 1.1 });
  band(P, edges, 0.55, D.plinth, 0.03, { front: M.bands, top: M.whiteFlat }, { draw, uvs: 0.55 });
  // ---- the entablature of the drum and the north wall
  const y0 = D.wallTop, y1 = y0 + D.archi, y2 = y1 + D.frieze, y3 = y2 + D.mutule, y4 = y3 + D.corona, y5 = y4 + D.cyma;
  band(P, edges, y0, y1, 0.14, { front: M.white }, { draw, uvs: 3 });                                 // architrave
  band(P, edges, y1, y2, 0.04, { front: M.white, top: M.white }, { draw, uvs: 3 });                    // frieze (flat face), its top face is the ledge under the mutules
  band(P, edges, y2, y3, 0.46, { front: M.shade }, { draw, uvs: 3 });                                  // the dark core of the mutule zone
  band(P, edges, y3, y4, 0.9, { front: M.white, top: M.white, under: M.white }, { draw, uvs: 3 });     // corona with its soffit
  band(P, edges, y4, y5, 0.8, { front: M.white, top: M.whiteFlat }, { draw, uvs: 3 });                 // gutter moulding
  // flat strips of the frieze and the mutule blocks above them: one per 0.95 m along the arc and along the north wall
  const strip = (x, along) => {                                                                       // in the facade frame (x along, z out)
    P.box(M.whiteFlat, x - 0.13, x + 0.13, y1, y2, 0, 0.09, 'bk', 3);
    P.box(M.shade, x - 0.05, x - 0.03, y1 + 0.1, y2 - 0.1, 0.09, 0.095, 'bk', 3); P.box(M.shade, x + 0.03, x + 0.05, y1 + 0.1, y2 - 0.1, 0.09, 0.095, 'bk', 3);
    P.box(M.whiteFlat, x - 0.2, x + 0.2, y2, y3, 0.4, 0.84, '', 3);
    void along;
  };
  for (const [a0, a1] of [[PHI_P + 0.012, PHI_E - 0.012], [-PHI_E + 0.012, -PHI_P - 0.012]]) {
    const len = Math.abs(a1 - a0) * R, n = Math.round(len / 0.95);
    for (let i = 0; i < n; i++) {
      const phi = a0 + (a1 - a0) * (i + 0.5) / n, p = pol(phi);
      P.push(p[0], 0, p[1], phi); strip(0); P.pop();
    }
  }
  for (const s of [1, -1]) {                                                                          // the north wall: facade frame turned to face north (local +z = north, local +x = west)
    P.push(0, 0, D.wN, Math.PI);
    const xa = POR.halfW + 0.45, xb = R - 0.35, n = Math.round((xb - xa) / 0.95);
    for (let i = 0; i < n; i++) strip(s * (xa + (xb - xa) * (i + 0.5) / n));
    P.pop();
  }

  // ---- the wall of the arc between the niches (plain plaster, y 1.1 .. 5.7) and the niches
  const { left, right } = ringAngles();
  const nichePhis = STATUES.filter((s) => s.place === 'arc').map((s) => s.phi * DEG);
  const inNiche = (a, b) => nichePhis.find((p) => a >= p - ALPHA - 1e-5 && b <= p + ALPHA + 1e-5);
  const yN = D.plinth + D.nicheH;                                                                      // top of a niche opening
  for (const grp of [left, right]) {
    for (let i = 0; i + 1 < grp.length; i++) {
      const a = grp[i], b = grp[i + 1], A = pol(a), B = pol(b), mid = (a + b) / 2, n = [Math.sin(mid), 0, Math.cos(mid)];
      const yb = inNiche(a, b) !== undefined ? yN : D.plinth, len = Math.hypot(B[0] - A[0], B[1] - A[1]), s0 = a * R / 3;
      P.quad(M.wall, [A[0], yb, A[1]], [B[0], yb, B[1]], [B[0], D.top, B[1]], [A[0], D.top, A[1]], n, [[s0, yb / 3], [s0 + len / 3, yb / 3], [s0 + len / 3, D.top / 3], [s0, D.top / 3]]);
    }
  }
  const frames = [];
  for (const phi of nichePhis) {
    const L = pol(phi - ALPHA), Rr = pol(phi + ALPHA), r = R - D.nicheD, Bc = pol(phi, r), t = [Math.cos(phi), -Math.sin(phi)];
    const Bl = [Bc[0] - t[0] * D.nicheW / 2, Bc[1] - t[1] * D.nicheW / 2], Br = [Bc[0] + t[0] * D.nicheW / 2, Bc[1] + t[1] * D.nicheW / 2];
    const y0n = D.plinth, y1n = yN, nr = [Math.sin(phi), 0, Math.cos(phi)];
    P.quad(M.wall, [Bl[0], y0n, Bl[1]], [Br[0], y0n, Br[1]], [Br[0], y1n, Br[1]], [Bl[0], y1n, Bl[1]], nr, [[0, y0n / 3], [D.nicheW / 3, y0n / 3], [D.nicheW / 3, y1n / 3], [0, y1n / 3]]);              // back
    P.quad(M.shade, [L[0], y0n, L[1]], [Bl[0], y0n, Bl[1]], [Bl[0], y1n, Bl[1]], [L[0], y1n, L[1]], [t[0], 0, t[1]], [[0, 0], [1, 0], [1, 1], [0, 1]]);                                    // left reveal (faces +t)
    P.quad(M.wall, [Br[0], y0n, Br[1]], [Rr[0], y0n, Rr[1]], [Rr[0], y1n, Rr[1]], [Br[0], y1n, Br[1]], [-t[0], 0, -t[1]], [[0, 0], [1, 0], [1, 1], [0, 1]]);                                // right reveal
    P.quad(M.whiteFlat, [L[0], y0n, L[1]], [Rr[0], y0n, Rr[1]], [Br[0], y0n, Br[1]], [Bl[0], y0n, Bl[1]], [0, 1, 0]);                                                                       // sill
    P.quad(M.whiteFlat, [Bl[0], y1n, Bl[1]], [Br[0], y1n, Br[1]], [Rr[0], y1n, Rr[1]], [L[0], y1n, L[1]], [0, -1, 0]);                                                                      // soffit
    frames.push(phi);
  }
  for (const phi of frames) {                                                                        // frame: two pilasters, architrave, frieze and a cornice with ears (photo kit_13)
    const p = pol(phi);
    P.push(p[0], 0, p[1], phi);
    const pw = D.pil, hw = D.nicheW / 2;
    for (const s of [-1, 1]) {
      P.box(M.whiteFlat, s > 0 ? hw : -hw - pw, s > 0 ? hw + pw : -hw, D.plinth, yN, -0.03, 0.1, 'bk', 3);
      P.box(M.whiteFlat, s > 0 ? hw - 0.02 : -hw - pw - 0.05, s > 0 ? hw + pw + 0.05 : -hw + 0.02, yN - 0.2, yN, -0.03, 0.14, 'bk', 3);   // impost block under the cap
    }
    P.box(M.whiteFlat, -hw - pw - 0.04, hw + pw + 0.04, yN, yN + 0.22, -0.03, 0.14, 'b', 3);           // architrave
    P.box(M.whiteFlat, -hw - pw, hw + pw, yN + 0.22, yN + 0.44, -0.03, 0.1, 'b', 3);                   // frieze
    P.box(M.whiteFlat, -hw - pw - 0.34, hw + pw + 0.34, yN + 0.44, yN + 0.52, -0.03, 0.36, 'b', 3);    // bed mould with the ears
    P.box(M.whiteFlat, -hw - pw - 0.34, hw + pw + 0.34, yN + 0.52, yN + 0.66, -0.03, 0.42, 'b', 3);    // corona
    P.box(M.whiteFlat, -hw - pw - 0.3, hw + pw + 0.3, yN + 0.66, yN + 0.74, -0.03, 0.34, 'b', 3);      // cymatium
    P.pop();
  }

  // ---- the flat north wall: plaster with six arched vase niches (photo kit_08, kit_14): two halves of the wall between the portico and the ends
  northWall(K);

  // ---- roof (zinc), chimneys, end blocks, downpipes, the courtyard
  const roofPts = ring.map((p) => [p[0], p[1]]);
  const court = courtyard();
  P.cap(M.zinc, roofPts, y5 + 0.03, true, 1.2, [court.map((p) => p.slice())]);
  const chim = [-76, -60, -44, -28, 28, 44, 60, 76];
  for (const d of chim) {
    const phi = d * DEG, p = pol(phi, R - 3.6);
    P.push(p[0], y5 + 0.03, p[1], phi);
    P.box(M.whiteFlat, -0.5, 0.5, 0, 1.25, -0.5, 0.5, 'b', 3); P.box(M.zinc, -0.62, 0.62, 1.25, 1.36, -0.62, 0.62, 'b', 1.2); P.pop();
  }
  endBlocks(K, y5);
  courtyardBuild(K, court, y5);
  passageMouth(K);
  for (const s of [-1, 1]) {                                                                          // downpipes where the porticos meet the drum (photo kit_08, kit_13)
    for (const [w, nz] of [[R * Math.cos(PHI_P) + 0.35, 1], [D.wN - 0.35, -1]]) {
      const u = s * (POR.halfW + 0.2), z = w;
      P.cyl(M.shade, [u, 0.15, z], [u, y3, z], 0.06, 0.06, 6, false);
      P.cyl(M.shade, [u, 0.0, z], [u, 0.15, z], 0.09, 0.07, 6, false);
      void nz;
    }
  }
}

/** the courtyard polygon (closed shape: arc of the circle R 20 and the chord of its north wall) */
function courtyard() {
  const psi = Math.acos((D.wCN - D.cw) / D.Rc), pts = [];
  const n = 40;
  for (let i = 0; i <= n; i++) { const a = -psi + 2 * psi * i / n; pts.push([D.cu + D.Rc * Math.sin(a), D.cw + D.Rc * Math.cos(a)]); }
  return pts;                                                              // the last point -> the first closes along the chord w = wCN
}

function courtyardBuild(K, court, topY) {
  const { M, P } = K;
  // floor of setts (just above the lawn), the inner walls (plaster, facing the yard) with a plinth line and a cornice band, closed by the roof cap
  P.cap(M.grey, court, 0.05, true, 1.5);
  const n = court.length;
  for (let i = 0; i < n; i++) {
    const a = court[i], b = court[(i + 1) % n];
    const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.01) continue;
    const nx = -dz / l, nz = dx / l;                                        // candidate normal; the yard interior must be on its side: test against the centroid
    const cx = D.cu, cz = D.cw + 10, side = (cx - a[0]) * nx + (cz - a[1]) * nz;
    const nn = side > 0 ? [nx, 0, nz] : [-nx, 0, -nz];
    P.quad(M.wall, [a[0], 0.05, a[1]], [b[0], 0.05, b[1]], [b[0], topY, b[1]], [a[0], topY, a[1]], nn, [[i * 0.8, 0], [i * 0.8 + l / 3, 0], [i * 0.8 + l / 3, topY / 3], [i * 0.8, topY / 3]]);
  }
}

/** the arch of the covered passage (OSM w739448361) on the inner wall of the courtyard, axis u = 0: an archivolt with a keystone, the dark tunnel mouth and the hanging black-iron lantern with milk glass (photo kit_12);
 *  the passage itself lies inside the closed block (the south door is painted shut), only its mouth is drawn */
function passageMouth(K) {
  const { M, P } = K;
  const wA = D.cw + Math.sqrt(D.Rc * D.Rc - D.cu * D.cu), w = 2.6, h = 2.9;
  P.push(0, 0, wA - 0.05, Math.PI);                                                  // frame facing north (into the yard): local +z = -w
  const y0 = 0.05, r = w / 2;
  const mouth = new THREE.Shape(); archPath(mouth, 0, y0, w, h, false);
  P.face(M.lantern, mouth, 0.14, 3);                                                // the dark mouth
  const outer = new THREE.Shape(); archPath(outer, 0, y0, w + 0.7, h, false);
  const hole = new THREE.Path(); archPath(hole, 0, y0, w, h, true); outer.holes.push(hole);
  P.extrude(M.whiteFlat, outer, 0.1, 0.14, 3, 14);
  P.box(M.whiteFlat, -0.22, 0.22, y0 + h + r + 0.05, y0 + h + r + 0.5, 0.1, 0.34, 'b', 3);             // keystone
  const ly = y0 + h + r - 0.3;                                                        // the lantern hangs from the crown of the vault
  P.cyl(M.lantern, [0, ly + 0.9, 0.7], [0, ly + 0.34, 0.7], 0.012, 0.012, 4, false);
  P.box(M.lampGlass, -0.14, 0.14, ly - 0.2, ly + 0.28, 0.56, 0.84, '', 1);
  for (const sx of [-1, 1]) for (const sz of [0.56, 0.84]) P.box(M.lantern, sx * 0.14 - 0.02, sx * 0.14 + 0.02, ly - 0.22, ly + 0.3, sz - 0.02, sz + 0.02, '', 1);
  P.box(M.lantern, -0.19, 0.19, ly + 0.28, ly + 0.32, 0.51, 0.89, 'b', 1); P.box(M.lantern, -0.17, 0.17, ly - 0.24, ly - 0.2, 0.53, 0.87, 'b', 1);
  P.pop();
}

/** two small hipped blocks standing on the roof near the north corners (photos kit_04, kit_16: the grey hip roofs above the ends of the drum) */
function endBlocks(K, roofY) {
  const { M, P } = K;
  for (const s of [-1, 1]) {
    const u0 = s * 26.4, w0 = 1.6, hw = 1.5, hd = 1.3, y0 = roofY + 0.03, y1 = y0 + 1.6, yr = y1 + 1.2;
    P.push(u0, 0, w0, 0);
    P.box(M.wall, -hw, hw, y0, y1, -hd, hd, 'b', 3);
    P.box(M.whiteFlat, -hw - 0.12, hw + 0.12, y1 - 0.2, y1, -hd - 0.12, hd + 0.12, 'b', 3);            // cornice
    const c = [[-hw - 0.2, y1, -hd - 0.2], [hw + 0.2, y1, -hd - 0.2], [hw + 0.2, y1, hd + 0.2], [-hw - 0.2, y1, hd + 0.2]], top0 = [-0.35, yr, 0], top1 = [0.35, yr, 0];
    P.fan(M.zinc, [c[0], c[1], top1, top0], [0, 0.5, -1], (p) => [p[0] / 1.2, p[1] / 1.2]);
    P.fan(M.zinc, [c[2], c[3], top0, top1], [0, 0.5, 1], (p) => [p[0] / 1.2, p[1] / 1.2]);
    P.fan(M.zinc, [c[1], c[2], top1], [1, 0.5, 0], (p) => [p[2] / 1.2, p[1] / 1.2]);
    P.fan(M.zinc, [c[3], c[0], top0], [-1, 0.5, 0], (p) => [p[2] / 1.2, p[1] / 1.2]);
    P.pop();
  }
}

/** an arched vase niche in a facade frame (x along the wall, z out), centre cx, recess depth 0.6: back panel with the shell, reveals, archivolt with consoles.  The wall around it is a Shape with a hole (northWall) */
export function archNiche(P, M, cx, o = {}) {
  const w = D.archW, r = w / 2, y0 = o.y0 ?? D.plinth, ySp = o.ySpring ?? D.archSpring, dep = o.depth ?? 0.6, zb = -dep;
  const back = new THREE.Shape(); archPath(back, cx, y0, w, ySp - y0, false);
  P.face(M.wall, back, zb, 3);
  const fan = new THREE.CircleGeometry(r * 0.96, 24, 0, Math.PI), uv = fan.attributes.uv, pa = fan.attributes.position;
  for (let i = 0; i < pa.count; i++) uv.setXY(i, (pa.getX(i) / (r * 0.96) + 1) / 2, pa.getY(i) / (r * 0.96));
  P.geo(M.fan, fan, cx, ySp, zb + 0.015); fan.dispose();
  const l = cx - r, rr = cx + r;
  P.quad(M.shade, [l, y0, 0], [l, y0, zb], [l, ySp, zb], [l, ySp, 0], [1, 0, 0]);                      // reveals
  P.quad(M.wall, [rr, y0, zb], [rr, y0, 0], [rr, ySp, 0], [rr, ySp, zb], [-1, 0, 0]);
  P.quad(M.whiteFlat, [l, y0, 0], [rr, y0, 0], [rr, y0, zb], [l, y0, zb], [0, 1, 0]);                  // sill
  const nA = 14;
  for (let i = 0; i < nA; i++) {                                                                       // the soffit of the arch
    const a0 = Math.PI * i / nA, a1 = Math.PI * (i + 1) / nA, am = (a0 + a1) / 2;
    const p0 = [cx + r * Math.cos(a0), ySp + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), ySp + r * Math.sin(a1)];
    P.quad(M.shade, [p0[0], p0[1], 0], [p0[0], p0[1], zb], [p1[0], p1[1], zb], [p1[0], p1[1], 0], [-Math.cos(am), -Math.sin(am), 0]);
  }
  // archivolt: moulding ring around the opening (outer arch minus the opening), 0.13 proud; jamb strips down to the sill with a console at the springing
  const outer = new THREE.Shape(), mw = 0.26; archPath(outer, cx, y0, w + 2 * mw, ySp - y0, false);
  const hole = new THREE.Path(); archPath(hole, cx, y0, w, ySp - y0, true); outer.holes.push(hole);
  P.extrude(M.whiteFlat, outer, -0.02, 0.15, 3, 12);
  for (const s of [-1, 1]) {
    const x = cx + s * (r + mw * 0.5);
    P.box(M.whiteFlat, x - 0.18, x + 0.18, ySp - 0.62, ySp - 0.05, 0.1, 0.3, 'b', 3);                   // console
    P.box(M.whiteFlat, x - 0.14, x + 0.14, ySp - 0.9, ySp - 0.62, 0.1, 0.24, 'b', 3);
    P.box(M.whiteFlat, x - 0.22, x + 0.22, ySp - 0.05, ySp + 0.05, 0.1, 0.34, 'b', 3);                  // impost
  }
}

function northWall(K) {
  const { M, P } = K;
  P.push(0, 0, D.wN, Math.PI);                                                                          // local +z = north (out of the wall), local +x = west
  const centres = [12.5, 18.5, 24.5];
  for (const half of [1, -1]) {                                                                         // half = +1: local x > 0 (the west half of the wall)
    const xa = POR.halfW, xb = R - 0.0;
    const x0 = half > 0 ? xa : -xb, x1 = half > 0 ? xb : -xa;
    const sh = new THREE.Shape(); rectPath(sh, x0, D.plinth, x1, D.top, false);
    for (const c of centres) { const hole = new THREE.Path(); archPath(hole, half * c, D.plinth, D.archW, D.archSpring - D.plinth, true); sh.holes.push(hole); }
    P.face(M.wall, sh, 0, 3);
    for (const c of centres) archNiche(P, M, half * c);
  }
  P.pop();
}
