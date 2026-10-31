// landmarksYelaginServices/orangery.js - the ORANGERY (Оранжерея, 4 литБ, Rossi 1819-21; since 2000 the Museum of Art Glass; dossier 6.4, CRITIC LOG items 19-20; photos ora_01 ora_03 ora_04 ora_07 ora_09 ora_10 ora_11 ora_13 ora_15):
// the central two-storey GLASS PAVILION (4 glazed bays between 5 white pilasters on pink granite blocks, every pilaster capital an Ionic volute pair carrying the HERM head of a woman, mutule cornice, stepped attic with a blank
// panel, the museum door in the third bay with granite steps and two black lanterns), the two GLAZED GALLERIES with the steep zinc roof, 10 gabled DORMERS and a row of white chimneys each and the low travertine walls in front,
// the two END PAVILIONS (white, pedimented ends, entrance with an iron trellis canopy and granite steps), Medici vases and iron tripods at the entrances, the fence w736544133 and its two gates.
// Frame OR (frame.js): x east-ish, z south, y up.  Colliders and services of the Orangery are added at the end of build().
import * as THREE from 'three';
import { Sculpt, face, cached } from '../lib/figures.js';
import { OR, ORN, toWorld } from './frame.js';
import { stage, onSide, rect, panel, gable, chimney, canopy } from './wall.js';
import { cornice as stepCornice } from './facade.js';
import { pediment } from './orders.js';
import { geosOf, put } from './objs.js';
import { revolve } from './geo.js';
import { fenceRun, gateAt } from './fence.js';
import * as D from '../data/city.js';

const PIL = 1.35, BAYW = 3.64, PITCH = PIL + BAYW;               // pilaster width, glass bay width, axis pitch (4.99)
const HP = ORN.hPlinth, YS = 7.0;                                // plinth height, the top of the pilaster shafts
const mirror = (r) => ({ x0: -r.x1, x1: -r.x0, z0: r.z0, z1: r.z1 });

/** one herm capital drawn into P at the current frame: origin at the pilaster axis, y = the top of the shaft, +z = out */
function herm(P, M) {
  P.box(M.white, -0.74, 0.74, -0.15, 0.0, -0.44, 0.36, 'b', 1);
  P.box(M.white, -0.62, 0.62, 0.0, 0.2, -0.3, 0.32, 'b', 1);
  P.box(M.white, -0.8, 0.8, 0.86, 1.0, -0.4, 0.42, 'b', 1);
  for (const s of [-1, 1]) {
    const t = new THREE.TorusGeometry(0.17, 0.055, 5, 10); P.geo(M.white, t, s * 0.52, 0.66, 0.36, 0, 0, 0); t.dispose();
    const t2 = new THREE.TorusGeometry(0.085, 0.04, 4, 8); P.geo(M.white, t2, s * 0.52, 0.66, 0.4, 0, 0, 0); t2.dispose();
    P.box(M.white, s * 0.52 - 0.17, s * 0.52 + 0.17, 0.8, 0.86, 0.16, 0.42, 'b', 1);
  }
  // the head: the figure kit face (a woman with long hair, closed lips), 0.58 m high, cast in white like the capital (ora_03: heads with ringlets over the volutes)
  hermHeadFig().place(P, { main: M.white, dark: M.shade, accent: M.white }, 0, 0.5, 0.36, 0, 1, 0, 0);
}
const hermHeadFig = () => cached('lmyesv-hermhead', () => {
  const S = new Sculpt({ detail: 0.55 });
  face(S, { c: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }, { scale: 2.35, hair: 'long', age: 0.1, mouth: 'closed', seed: 5, skinKey: 'main', hairKey: 'main' });
  return S.finish({});
});

/** a black wall lantern with its bracket at the current frame (x, y), proud of the wall at z */
function lantern(P, M, x, y, z) {
  P.box(M.dark, x - 0.02, x + 0.02, y + 0.15, y + 0.19, z - 0.3, z, 'b', 1);
  P.box(M.dark, x - 0.13, x + 0.13, y - 0.28, y - 0.24, z - 0.42, z - 0.16, '', 1);
  P.box(M.lampGlass, x - 0.11, x + 0.11, y - 0.24, y + 0.12, z - 0.4, z - 0.18, '', 1);
  P.box(M.dark, x - 0.15, x + 0.15, y + 0.12, y + 0.16, z - 0.44, z - 0.14, '', 1);
}

// ------------------------------------------------------------------------------------------------ the central glass pavilion
const DOORX = 0.5 * PITCH;                                      // the museum door: the third of the four bays
/** architrave + frieze over x0..x1, mutule cornice over c0..c1 (the cornice ranges reach 1.12 m past a corner: the mitre belongs to one face only) in a face frame, front plane z = 0.3 */
function entab(P, M, x0, x1, c0, c1) {
  P.box(M.white, x0, x1, 7.95, 8.5, -0.5, 0.42, 'k', 3);                                     // the architrave projects 0.77 m past the glass: its soffit shows from below
  P.box(M.white, x0, x1, 8.5, 9.02, -0.5, 0.38, 'b', 3);
  for (let x = c0 + 0.45; x < c1 - 0.2; x += 0.9) P.box(M.white, x - 0.2, x + 0.2, 8.84, 9.02, 0.38, 1.0, 't', 1);
  P.box(M.white, c0, c1, 9.02, 9.2, -0.5, 1.05, 'k', 3);                                      // the corona: the soffit between the mutules is visible (it was open to the sky)
  P.box(M.white, c0, c1, 9.2, 9.6, -0.5, 1.12, 'b', 3);
}
function centerPavilion(K) {
  const P = K.P, M = K.M, c = ORN.center, hw = (c.x1 - c.x0) / 2, zc = (c.z0 + c.z1) / 2;
  const xs = [-2, -1, 0, 1, 2].map((i) => i * PITCH), bays = [-1.5, -0.5, 0.5, 1.5].map((i) => i * PITCH);
  onSide(K, c, 'F', () => {
    P.box(M.ashlar, -hw, hw, 0, HP, -0.5, 0.0, 'bk', 1.8);                                              // the stone base wall (its top is the sill of the glass)
    for (const x of xs) {
      P.box(M.pink, x - PIL / 2 - 0.05, x + PIL / 2 + 0.05, 0, HP + 0.12, -0.5, 0.36, 'b', 1.5);       // pink granite block
      P.box(M.white, x - PIL / 2, x + PIL / 2, HP + 0.12, 7.95, -0.5, 0.3, 'b', 1.5);                    // pilaster shaft up to the architrave (ora_03: a plain pier, the herm head sits on its upper front)
      P.push(x, YS, 0.0, 0); herm(P, M); P.pop();
    }
    for (const x of bays) P.quad(M.glassBay, [x - BAYW / 2, HP, -0.35], [x + BAYW / 2, HP, -0.35], [x + BAYW / 2, 7.95, -0.35], [x - BAYW / 2, 7.95, -0.35], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // the museum door (third bay): white jambs, mid bar, lintel and a kick panel over the glass, two lanterns on the flanking pilasters, four granite steps
    for (const dx of [-0.95, 0.95]) P.box(M.white, DOORX + dx - 0.06, DOORX + dx + 0.06, HP, HP + 3.0, -0.4, -0.3, 'b', 1);
    P.box(M.white, DOORX - 1.01, DOORX + 1.01, HP + 3.0, HP + 3.14, -0.42, -0.3, 'b', 1); P.box(M.white, DOORX - 0.04, DOORX + 0.04, HP, HP + 3.0, -0.4, -0.3, 'b', 1);
    P.box(M.white, DOORX - 0.95, DOORX + 0.95, HP, HP + 0.45, -0.4, -0.3, 'b', 1);
    for (const x of [xs[2], xs[3]]) lantern(P, M, x, 3.6, 0.3);
    for (let k = 1; k <= 4; k++) P.box(M.ashlar, DOORX - 1.5, DOORX + 1.5, 0, HP * k / 4, 0.36 + (4 - k) * 0.33 - 0.33, 0.36 + (4 - k) * 0.33, 'bk', 1.8);
    entab(P, M, -hw - 0.42, hw + 0.42, -hw - 1.12, hw + 1.12);
    // the stepped attic: a lower course the full width, an upper block set back with a blank panel; the flat zinc roof
    P.box(M.white, -hw - 0.2, hw + 0.2, 9.6, 10.3, -14.8, -0.3, 'b', 3);
    P.box(M.white, -hw + 1.9, hw - 1.9, 10.3, 11.4, -13.6, -2.2, 'b', 3);
    P.quad(M.shade, [-hw + 3.6, 10.55, -2.17], [hw - 3.6, 10.55, -2.17], [hw - 3.6, 11.1, -2.17], [-hw + 3.6, 11.1, -2.17], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.cap(M.zinc, [[-hw - 1.12, -15.7], [hw + 1.12, -15.7], [hw + 1.12, 1.12], [-hw - 1.12, 1.12]], 9.595, true, 1.2);
  });
  // the two side faces: the corner pilaster belongs to the front; one more pilaster 4.99 m back with a glass bay between; plain wall to the back
  for (const name of ['R', 'L']) {
    const sg = name === 'R' ? -1 : 1, fx = (z) => sg * (z - zc), len = c.z1 - c.z0, zp1 = c.z1 - PIL / 2, zp2 = zp1 - PITCH, zb = (zp1 + zp2) / 2;
    onSide(K, c, name, () => {
      const wa = fx(c.z0 + 0.4), wb = fx(zp2 - PIL / 2);
      panel(K, M.white, Math.min(wa, wb), Math.max(wa, wb), HP, 7.95, [rect((wa + wb) / 2, 2.4, 1.5, 2.8, 'winWhite', 0.1)]);
      P.box(M.ashlar, -len / 2 + 0.4, len / 2 - 0.4, 0, HP, -0.5, 0.0, 'bk', 1.8);
      P.box(M.pink, fx(zp2) - PIL / 2 - 0.05, fx(zp2) + PIL / 2 + 0.05, 0, HP + 0.12, -0.5, 0.36, 'b', 1.5);
      P.box(M.white, fx(zp2) - PIL / 2, fx(zp2) + PIL / 2, HP + 0.12, 7.95, -0.5, 0.3, 'b', 1.5);
      P.push(fx(zp2), YS, 0.0, 0); herm(P, M); P.pop();
      // the corner pier: the front corner pilaster is only 0.8 m deep (-0.5 .. 0.3), so on the side face the pier is completed to the full 1.35 m up to the glass bay (ora_03: the corner pier wraps the corner)
      { const xa = fx(c.z1 - PIL), xb = fx(c.z1 - 0.5), x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
        P.box(M.pink, x0, x1, 0, HP + 0.12, -0.5, 0.0, 'b', 1.5);                 // flush with the side plane, like the front corner pilaster beside it (no overlap: no coplanar faces)
        P.box(M.white, x0, x1, HP + 0.12, 7.95, -0.5, 0.0, 'b', 1.5); }
      P.quad(M.glassBay, [fx(zb) - BAYW / 2, HP, -0.35], [fx(zb) + BAYW / 2, HP, -0.35], [fx(zb) + BAYW / 2, 7.95, -0.35], [fx(zb) - BAYW / 2, 7.95, -0.35], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      entab(P, M, -len / 2 + 0.5, len / 2 - 0.5, -len / 2 + 0.5, len / 2 - 0.5);
    });
  }
  // the north face: a plain white wall with three windows and the same entablature
  onSide(K, c, 'B', (len) => {
    panel(K, M.white, -len / 2, len / 2, 0, 7.95, [-6.5, 0, 6.5].map((x) => ({ ...rect(x, 2.2, 1.6, 3.0, 'winWhite', 0.12) })));
    entab(P, M, -len / 2 - 0.42, len / 2 + 0.42, -len / 2 - 1.12, len / 2 + 1.12);
  });
}

// ------------------------------------------------------------------------------------------------ the dormer galleries
function dormer(K, x, g) {
  const P = K.P, M = K.M, { zs, zr, ye, yr } = g;
  const tf = 0.3, zf = zs + (zr - zs) * tf, yfb = ye + (yr - ye) * tf, hd = 1.55, wd = 1.5, ytop = yfb + hd, yd = ytop + 0.62, ov = 0.2;
  const zAt = (y) => zs + (zr - zs) * (y - ye) / (yr - ye), ze = zAt(ytop), zj = zAt(yd);
  P.push(x, 0, zf, 0);
  panel(K, M.clapGrey, -wd / 2, wd / 2, yfb, ytop, [rect(0, yfb + 0.22, 1.1, 1.12, 'winWhite', 0.1)], { uvs: 1 });
  P.pop();
  for (const s of [-1, 1]) {                                                                                  // the side cheeks: triangles between the dormer front and the main roof
    const xx = x + s * wd / 2;
    P.fan(M.clapGrey, [[xx, yfb, zf], [xx, ytop, zf], [xx, ytop, ze]], [s, 0, 0], (p) => [p[2] / 1, p[1] / 1]);
    // the dormer roof slope
    const xo = x + s * (wd / 2 + ov);
    P.quad(M.zinc, [xo, ytop - 0.1, zf + 0.1 - 0.0], [xo, ytop - 0.1, ze + 0.0], [x, yd, zj], [x, yd, zf + 0.1], [s * (yd - ytop), wd / 2 + ov, 0], [[0, 0], [2, 0], [2, 1], [0, 1]]);
  }
  P.fan(M.clapGrey, [[x - wd / 2 - ov, ytop - 0.1, zf + 0.02], [x + wd / 2 + ov, ytop - 0.1, zf + 0.02], [x, yd, zf + 0.02]], [0, 0, 1], (p) => [p[0] / 1, p[1] / 1]);
  P.box(M.white, x - wd / 2 - ov - 0.04, x + wd / 2 + ov + 0.04, ytop - 0.18, ytop - 0.08, zf, zf + 0.12, 'k', 1);       // the eave trim
}
function gallery(K, g, name) {
  const P = K.P, M = K.M, r = g, len = r.x1 - r.x0, ye = 1.4, zs = r.z1 + 0.35, zn = r.z0 - 0.35, zr = (r.z0 + r.z1) / 2 - 0.2;
  const yr = ye + Math.tan(40 * Math.PI / 180) * (zs - zr);
  const geo = { zs, zr, ye, yr };
  // walls under the eaves: the south face (travertine) and the north face
  P.box(M.ashlar, r.x0, r.x1, 0, ye, r.z1 - 0.4, r.z1, 'b', 1.8);
  P.box(M.clapGrey, r.x0, r.x1, 0, ye, r.z0, r.z0 + 0.4, 'bt', 1);
  // the two roof slopes
  const nS = [0, (zs - zr), -(yr - ye)], lS = Math.hypot(nS[1], nS[2]);
  P.quad(M.zinc, [r.x0, ye, zs], [r.x1, ye, zs], [r.x1, yr, zr], [r.x0, yr, zr], [0, (yr - ye) / lS, (zs - zr) / lS], [[0, 0], [len / 1.2, 0], [len / 1.2, lS / 1.2], [0, lS / 1.2]]);
  P.quad(M.zinc, [r.x1, ye, zn], [r.x0, ye, zn], [r.x0, yr, zr], [r.x1, yr, zr], [0, (yr - ye) / lS, -(zn - zr) / lS * -1], [[0, 0], [len / 1.2, 0], [len / 1.2, lS / 1.2], [0, lS / 1.2]]);
  // dormers: 10 per gallery
  const n = 10; for (let k = 0; k < n; k++) dormer(K, r.x0 + (k + 0.5) * len / n, geo);
  // chimneys along the ridge
  for (let k = 0; k < 6; k++) chimney(P, M, r.x0 + (k + 0.5) * len / 6, zr - 0.4, yr - 0.5, yr + 1.5, 0.8, 0.8);
  // the low travertine wall in front (stb: ora_04): 0.85 m with a coping, interrupted 1.0 m before the pavilions
  P.box(M.ashlar, r.x0 + 0.8, r.x1 - 0.8, 0, 0.85, r.z1 + 1.1, r.z1 + 1.7, 'b', 1.8);
  P.box(M.white, r.x0 + 0.7, r.x1 - 0.7, 0.85, 0.95, r.z1 + 1.0, r.z1 + 1.8, 'b', 1.5);
  void name;
}

// ------------------------------------------------------------------------------------------------ the end pavilions
function endPavilion(K, r, s) {
  const P = K.P, M = K.M, H = ORN.hEnd, h2 = (r.x1 - r.x0) / 2, hc = 2.8;
  onSide(K, r, 'F', () => {
    const xsLow = [-5.2, -2.6, 2.6, 5.2], low = xsLow.map((x) => ({ ...rect(x, 0.95, 1.3, 2.4, 'winWhite', 0.14), cornice: true }));
    const up = [-5.2, -2.6, 0, 2.6, 5.2].map((x) => rect(x, 4.7, 1.2, 1.9, 'winWhite', 0.1));
    low.push({ x0: -0.85, x1: 0.85, y0: 0.9, y1: 3.4, mat: 'door', cas: true, sill: 0 });
    panel(K, M.white, -h2, h2, 0, H - 0.6, [...low, ...up]);
    P.box(M.ashlar, -h2, h2, 0, 0.8, 0, 0.1, 'kb', 1.8);
    P.box(M.white, -h2, h2, 3.9, 4.05, 0, 0.12, 'k', 3);
    stepCornice(P, M.white, -h2 - 0.5, h2 + 0.5, H - 0.6, H, { p1: 0.2, p2: 0.4, p3: 0.55 });
    for (const x of [-h2 + 0.25, h2 - 0.25]) P.cyl(M.shade, [x, 0.8, 0.14], [x, H - 0.6, 0.14], 0.055, 0.055, 6, false);
    // the entrance: four granite steps, an iron trellis canopy on two slender posts
    for (let k = 1; k <= 4; k++) P.box(M.ashlar, -1.4, 1.4, 0, 0.9 * k / 4, 0.0, 0.2 + (4 - k) * 0.3, 'bk', 1.8);
    canopy(P, M, -1.9, 1.9, 0.0, 1.7, 3.95, 3.55, true);
    lantern(P, M, 0, 3.4, 1.4);
  });
  for (const name of ['R', 'L']) onSide(K, r, name, (len) => {
    const a = -len / 2 + 0.4, b = len / 2 - 0.4;
    panel(K, M.white, a, b, 0, H - 0.6, [-5.2, 0, 5.2].flatMap((x) => [{ ...rect(x, 0.95, 1.3, 2.4, 'winWhite', 0.14), cornice: true }, rect(x, 4.7, 1.2, 1.9, 'winWhite', 0.1)]));
    P.box(M.ashlar, a, b, 0, 0.8, 0, 0.1, 'kb', 1.8);
    stepCornice(P, M.white, a - 0.5, b + 0.5, H - 0.6, H, { p1: 0.2, p2: 0.4, p3: 0.55 });
    pediment(P, M, -len / 2 - 0.3, len / 2 + 0.3, H, hc, 0.62, -0.02);
  });
  onSide(K, r, 'B', (len) => { panel(K, M.white, -len / 2, len / 2, 0, H - 0.6, [-3.6, 3.6].map((x) => ({ ...rect(x, 2.0, 1.3, 2.4, 'winWhite', 0.12) }))); stepCornice(K.P, M.white, -len / 2 - 0.5, len / 2 + 0.5, H - 0.6, H, { p1: 0.2, p2: 0.4, p3: 0.55 }); });
  gable(P, M, r.z0, r.z1, H, hc, r.x0, r.x1, { alongZ: false, ov: 0.35, ends: false });
  chimney(P, M, (r.x0 + r.x1) / 2 + s * 2.5, (r.z0 + r.z1) / 2 - 3, H + 1.4, H + 3.4); chimney(P, M, (r.x0 + r.x1) / 2 - s * 2.5, (r.z0 + r.z1) / 2 - 3, H + 1.4, H + 3.4);
}

// ------------------------------------------------------------------------------------------------ vases and tripods
function vaseSet(M) {
  return geosOf((P) => {
    P.box(M.ashlar, -0.45, 0.45, 0, 0.8, -0.45, 0.45, 'b', 1.8); P.box(M.ashlar, -0.52, 0.52, 0.8, 0.9, -0.52, 0.52, 'b', 1.8);
    const prof = [[0, 0.9], [0.3, 0.9], [0.3, 0.98], [0.2, 1.04], [0.14, 1.16], [0.16, 1.24], [0.3, 1.32], [0.5, 1.46], [0.6, 1.66], [0.6, 1.9], [0.66, 1.96], [0.62, 2.0], [0.0, 2.0]];
    revolve(P, M.white, prof, 18, { crease: 55 });
    for (const sx of [-1, 1]) { P.cyl(M.white, [sx * 0.58, 1.8, 0], [sx * 0.76, 1.6, 0], 0.05, 0.05, 5, false); P.cyl(M.white, [sx * 0.76, 1.6, 0], [sx * 0.62, 1.4, 0], 0.05, 0.05, 5, false); }
  });
}
function tripodSet(M) {
  return geosOf((P) => {
    P.box(M.shade, -0.4, 0.4, 0, 0.42, -0.4, 0.4, 'b', 1.8);
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + 0.5; P.cyl(M.dark, [Math.sin(a) * 0.3, 0.42, Math.cos(a) * 0.3], [Math.sin(a) * 0.5, 1.45, Math.cos(a) * 0.5], 0.035, 0.035, 5, false); }
    const prof = [[0, 1.4], [0.55, 1.44], [0.62, 1.56], [0.58, 1.62], [0.0, 1.6]];
    revolve(P, M.dark, prof, 14, { crease: 50 });
  });
}


// ------------------------------------------------------------------------------------------------ the museum plate beside the east entrance (labels registry)
function plate(K) {
  const ctx = K.ctx, M = K.M, lab = ctx.services.labels;
  const r = ORN.endE, x = (ORN.endE.x0 + ORN.endE.x1) / 2 + 3.9, y = 2.2, w = 0.64, h = 0.48, z = r.z1 + 0.04;
  const c = toWorld(OR, x, z), nx = Math.sin(OR.rot), nz = Math.cos(OR.rot);
  if (lab && !lab.reserve('w23150126', c.x, y, c.z, w, h, nx, nz, 'plate')) return;
  const tex = ctx.tex.draw(256, 192, (g, tw, th) => {
    g.fillStyle = '#1d2a36'; g.fillRect(0, 0, tw, th); g.strokeStyle = '#8fa4b5'; g.lineWidth = 4; g.strokeRect(6, 6, tw - 12, th - 12);
    g.fillStyle = '#e8eef3'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ctx.tex.fitText(g, 'ОРАНЖЕРЕЯ', tw / 2, th * 0.22, tw * 0.8, 32, ctx.tex.FONTS.sans, 700);
    ctx.tex.fitText(g, 'Музей художественного', tw / 2, th * 0.5, tw * 0.86, 22, ctx.tex.FONTS.sans, 500);
    ctx.tex.fitText(g, 'стекла', tw / 2, th * 0.7, tw * 0.5, 22, ctx.tex.FONTS.sans, 500);
    ctx.tex.fitText(g, 'К. И. Росси, 1819 — 1821', tw / 2, th * 0.88, tw * 0.8, 15, ctx.tex.FONTS.sans, 500);
  }, { key: 'lmyesv-plate' });
  const mat = ctx.mat.toon('#ffffff', { map: tex, name: 'lmyesv-plate', paint: 0, polygonOffset: -2 });
  const tx = Math.cos(OR.rot), tz = -Math.sin(OR.rot);                        // local +x in the world
  K.P.quad(mat, [c.x - tx * w / 2, y - h / 2, c.z - tz * w / 2], [c.x + tx * w / 2, y - h / 2, c.z + tz * w / 2], [c.x + tx * w / 2, y + h / 2, c.z + tz * w / 2], [c.x - tx * w / 2, y + h / 2, c.z - tz * w / 2], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  K.ctx.noOutline && (K.shared.plateMat = mat);
}

// ------------------------------------------------------------------------------------------------ build
export function build(K) {
  const M = K.M, P = K.P, ph = K.ctx.physics;
  P.push(OR.x, 0, OR.z, OR.rot);
  try {
    stage(K, 'orangery/center', () => centerPavilion(K));
    stage(K, 'orangery/galleries', () => { gallery(K, ORN.galW, 'W'); gallery(K, ORN.galE, 'E'); });
    stage(K, 'orangery/ends', () => { endPavilion(K, ORN.endW, -1); endPavilion(K, ORN.endE, 1); });
  } finally { P.pop(); }
  stage(K, 'orangery/vases', () => {
    const vase = vaseSet(M), tripod = tripodSet(M), root = K.root;
    let tris = 0;
    for (const [x, z, set] of [[(ORN.endW.x0 + ORN.endW.x1) / 2 - 2.6, ORN.endW.z1 + 1.6, vase], [(ORN.endW.x0 + ORN.endW.x1) / 2 + 2.6, ORN.endW.z1 + 1.6, vase], [(ORN.endE.x0 + ORN.endE.x1) / 2 - 2.6, ORN.endE.z1 + 1.6, tripod], [(ORN.endE.x0 + ORN.endE.x1) / 2 + 2.6, ORN.endE.z1 + 1.6, tripod]]) {
      const w = toWorld(OR, x, z); tris += put(root, set, w.x, 0, w.z, OR.rot, 1, 'yes-vase'); (K.shared.orSmall ||= []).push(w);
    }
    K.extraTris += tris;
  });
  stage(K, 'orangery/plate', () => plate(K));
  stage(K, 'orangery/fence', () => {
    const b = D.BARRIERS.find((q) => q.id === 'w736544133'); if (!b) return;
    const pts = []; for (let i = 0; i < b.pts.length; i += 2) pts.push([b.pts[i], b.pts[i + 1]]);
    const gates = ['n6896052611', 'n1145292923'].map((id) => D.BARRIER_NODES.find((n) => n.id === id)).filter(Boolean);
    fenceRun(K, pts, { h: 2.0, gates: gates.map((g) => ({ x: g.x, z: g.z, w: 3.2 })) });
    for (const g of gates) {
      let best = 0, bd = 1e9; for (let i = 0; i + 1 < pts.length; i++) { const d = Math.abs((g.x - pts[i][0]) * (pts[i + 1][1] - pts[i][1]) - (g.z - pts[i][1]) * (pts[i + 1][0] - pts[i][0])) / Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); if (d < bd) { bd = d; best = i; } }
      const a = pts[best], c = pts[best + 1], l = Math.hypot(c[0] - a[0], c[1] - a[1]);
      gateAt(K, g.x, g.z, (c[0] - a[0]) / l, (c[1] - a[1]) / l);
    }
  });
  // colliders and services
  stage(K, 'orangery/walk', () => {
    if (!ph) return;
    const box = (r, y1, y0 = 0) => { const p = toWorld(OR, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2); ph.addBox(p.x, p.z, r.x1 - r.x0, r.z1 - r.z0, OR.rot, y0, y1); };
    box(ORN.center, 11.5); box(ORN.galW, 6.5); box(ORN.galE, 6.5); box(ORN.endW, 11.5); box(ORN.endE, 11.5);
    for (const g of [ORN.galW, ORN.galE]) box({ x0: g.x0 + 0.8, x1: g.x1 - 0.8, z0: g.z1 + 1.0, z1: g.z1 + 1.8 }, 1.0);
    for (const q of K.shared.orSmall || []) ph.addCylinder(q.x, q.z, 0.6, 0, 2.6);
    // the museum steps and the end-pavilion steps (walk boxes, 4 risers)
    const steps = (cx, z0, w, n, top, d) => { for (let k = 1; k <= n; k++) { const zz = z0 + (n - k) * d + d / 2, p = toWorld(OR, cx, zz); const it = ph.addWalkBox(p.x, p.z, w, d + 0.04, OR.rot, top * k / n); it.sticky = true; } };
    steps(DOORX, ORN.center.z1, 3.0, 4, HP, 0.33);
    for (const s of [ORN.endW, ORN.endE]) steps((s.x0 + s.x1) / 2, s.z1, 2.8, 4, 0.9, 0.3);
    const m = toWorld(OR, 0, -4);
    K.svc.monuments.push({ id: 'w23150126', name: 'Оранжерея Елагина дворца (Музей художественного стекла)', x: m.x, z: m.z, h: 11.4 });
    const a = toWorld(OR, 0, 30), e = toWorld(OR, DOORX, ORN.center.z1 + 2.2);
    K.svc.photoSpots.push({ x: a.x, z: a.z, yaw: OR.rot * 180 / Math.PI, name: 'Оранжерея: стеклянный павильон с гермами' });
    K.svc.entrances.push({ x: e.x, z: e.z, rotY: OR.rot + Math.PI, bldg: 'w23150126' });
    const d = toWorld(OR, 0, 12); K.svc.crowd.push({ id: 'yelagin-orangery', kind: 'photo', x: d.x, z: d.z, r: 6, n: 4 });
  });
  if (K.errs) throw new Error(K.errs.join('\n'));
}
