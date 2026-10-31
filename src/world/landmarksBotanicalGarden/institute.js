// landmarksBotanicalGarden/institute.js - the Komarov Botanical Institute main building (lit A, OSM r14150140 + w617020776 + the one-storey annexes r14150138 / r14150139; dossier 4.1b, photos 49 50 53 F0):
//   yellow-ochre stucco (#e3b95a), 85 m long, four storeys on a raised ground floor (plinth 1.1 m), the WEST front: arched ground-floor windows, three tall narrow windows in the middle between two PAIRS
//   of giant columns (10.6 m, from the porch roof to the cornice), two plain pilaster strips, oval windows with festoons, the semicircular colonnaded porch of 6 columns on a podium with a broad flight of
//   7 treads, an attic block with a fan window and a low pediment, a dark red hip roof; the east front plainer with a semicircular stair bay; two one-storey annexes.
//   Frame IB (frame.js): x along the west front to the right (south), z = out of the west front; body x -36.4 .. 36.1, z -9.2 .. 8.4 (wall planes), axis x = -0.95.
//   Heights (dossier 7 [E]): plinth 1.1, string course 5.4, floors 9.3 / 13.0, cornice 16.2 .. 17.2, ridge 21.6, attic 19.5, pediment apex 21.3.
import { IB, IDS } from './frame.js';
import { band as kitBand, ringEdges, polyOf, onEdge } from './kit.js';
import { pilaster } from './facade.js';
import { revolve } from './geo.js';
import { hipRect } from './roof.js';
import { arch, rect, oval, bayCentres, wallRun, stage, rectL, cylL, walkL, stepsL } from './shell.js';
import { addPolyColliders } from '../lib/massing.js';

const Z_W = 8.4, Z_E = -9.2, X0 = -36.4, X1 = 36.1, XA0 = -42.5, XA1 = 42.4, XM = -0.95;
const Y = { fl: 1.1, s1: 5.4, s2: 9.3, s3: 13.0, cor: 16.2, top: 17.2 };
const WD = 0.35;                                              // wall thickness (the panel is hollow)
const RISALIT = 8.35;                                         // half width of the central risalit
const PODIUM = { w: 11.8, d: 4.6, tread: 0.4, n: 7, R: 3.8 };  // porch podium: width, depth, tread depth, number of treads, colonnade radius

/** the windows of a wing between x0 and x1: arched ground floor + three storeys of rectangular windows */
function wingHoles(x0, x1) {
  const n = Math.max(2, Math.round((x1 - x0) / 3.45)), h = [];
  for (const cx of bayCentres(x0, x1, n)) {
    h.push(arch(cx, Y.fl + 0.9, 1.5, 3.2));
    h.push(rect(cx, 6.25, 1.3, 2.4), rect(cx, 10.05, 1.3, 2.4), rect(cx, 13.7, 1.3, 2.0));
  }
  return h;
}

function westHoles() {
  const h = [...wingHoles(X0, XM - RISALIT), ...wingHoles(XM + RISALIT, X1)];
  // the middle: the loggia door and two side lights on the ground floor, three tall windows in two stages, three small ones under the cornice, side windows, ovals
  h.push(arch(XM, Y.fl, 2.4, 3.7, 'timber'), rect(XM - 2.75, Y.fl + 0.9, 1.1, 2.6), rect(XM + 2.75, Y.fl + 0.9, 1.1, 2.6));
  for (const dx of [-1.6, 0, 1.6]) { h.push(rect(XM + dx, 6.3, 1.0, 2.75), rect(XM + dx, 9.45, 1.0, 2.8)); h.push(rect(XM + dx, 13.75, 1.0, 1.9)); }
  for (const s of [-1, 1]) { const cx = XM + s * 6.2; h.push(rect(cx, 6.3, 1.2, 2.4), rect(cx, 10.0, 1.2, 2.4), oval(cx, 14.5, 0.55, 0.8)); }
  return h;
}

/** a FLUTED shaft: n flutes (each a shallow V groove of the given depth, two flat quads), three sections for the entasis; y0..y1, radii r0 (bottom) .. r1 (top), centre (cx, cz) of the current frame */
function flutedShaft(P, mat, cx, cz, y0, y1, r0, r1, n, depth) {
  const secs = 3, rAt = (t) => r0 + (r1 - r0) * t + Math.sin(t * Math.PI) * 0.035;       // a slight entasis
  const pt = (a, r, y) => [cx + Math.sin(a) * r, y, cz + Math.cos(a) * r];
  for (let k = 0; k < secs; k++) {
    const t0 = k / secs, t1 = (k + 1) / secs, ya = y0 + (y1 - y0) * t0, yb = y0 + (y1 - y0) * t1, ra = rAt(t0), rb = rAt(t1);
    for (let i = 0; i < n; i++) {
      const a0 = i * 2 * Math.PI / n, am = (i + 0.5) * 2 * Math.PI / n, a1 = (i + 1) * 2 * Math.PI / n;
      P.quad(mat, pt(a0, ra, ya), pt(am, ra - depth, ya), pt(am, rb - depth, yb), pt(a0, rb, yb), [Math.sin((a0 + am) / 2), 0.02, Math.cos((a0 + am) / 2)], [[i / n * 3, ya / 3], [(i + 0.5) / n * 3, ya / 3], [(i + 0.5) / n * 3, yb / 3], [i / n * 3, yb / 3]]);
      P.quad(mat, pt(am, ra - depth, ya), pt(a1, ra, ya), pt(a1, rb, yb), pt(am, rb - depth, yb), [Math.sin((am + a1) / 2), 0.02, Math.cos((am + a1) / 2)], [[(i + 0.5) / n * 3, ya / 3], [(i + 1) / n * 3, ya / 3], [(i + 1) / n * 3, yb / 3], [(i + 0.5) / n * 3, yb / 3]]);
    }
  }
}

/** one giant column of the front: base, fluted shaft 9.4 m, a plain capital (echinus) and a square abacus; made in the current frame at (x, z) */
function giantColumn(K, x, z, y0, y1) {
  const P = K.P, M = K.M, H = y1 - y0;
  revolve(P, M.white, [[0.78, 0], [0.78, 0.22], [0.70, 0.26], [0.66, 0.42], [0.64, 0.6]].map(([r, y]) => [r, y0 + y]), 18, { cx: x, cz: z, crease: 55, uRep: 4, vTile: 3 });
  flutedShaft(P, M.white, x, z, y0 + 0.6, y1 - 1.0, 0.64, 0.55, 14, 0.06);
  revolve(P, M.white, [[0.55, H - 1.0], [0.62, H - 0.88], [0.62, H - 0.72], [0.74, H - 0.55], [0.86, H - 0.32], [0.9, H - 0.26]].map(([r, y]) => [r, y0 + y]), 18, { cx: x, cz: z, crease: 55, uRep: 4, vTile: 3 });
  P.box(M.white, x - 0.98, x + 0.98, y1 - 0.28, y1, z - 0.98, z + 0.98, 'b', 3);
}

/** a column of the porch (simple Ionic, 3.95 m): base, fluted shaft, echinus, abacus */
function porchColumn(K, x, z, y0, y1) {
  const P = K.P, M = K.M, H = y1 - y0;
  revolve(P, M.white, [[0.42, 0], [0.42, 0.14], [0.36, 0.2], [0.34, 0.3]].map(([r, y]) => [r, y0 + y]), 12, { cx: x, cz: z, crease: 55, uRep: 3, vTile: 2 });
  flutedShaft(P, M.white, x, z, y0 + 0.3, y1 - 0.55, 0.33, 0.28, 10, 0.035);
  revolve(P, M.white, [[0.29, H - 0.55], [0.3, H - 0.45], [0.38, H - 0.32], [0.46, H - 0.2], [0.46, H - 0.14]].map(([r, y]) => [r, y0 + y]), 12, { cx: x, cz: z, crease: 55, uRep: 3, vTile: 2 });
  P.box(M.white, x - 0.5, x + 0.5, y1 - 0.15, y1, z - 0.5, z + 0.5, 'b', 3);
}

/** the mitred bands round the body: plinth, string courses, the three tiers of the cornice (frame IB, the body ring is the wall planes) */
function bands(K) {
  const P = K.P, M = K.M;
  const ring = [[X0, Z_E], [X0, Z_W], [X1, Z_W], [X1, Z_E]];
  const edges = ringEdges(polyOf(ring));
  kitBand(P, edges, 0, Y.fl, 0.08, { front: M.plinth, top: M.plinth }, { uvs: 3 });
  kitBand(P, edges, Y.s1 - 0.2, Y.s1 + 0.15, 0.1, { front: M.white, top: M.white, under: M.plinth }, { uvs: 3 });
  kitBand(P, edges, Y.s3 - 0.1, Y.s3 + 0.08, 0.05, { front: M.white, top: M.white, under: M.plinth }, { uvs: 3 });
  kitBand(P, edges, Y.cor, Y.cor + 0.34, 0.18, { front: M.white, top: M.white, under: M.plinth }, { uvs: 3 });
  kitBand(P, edges, Y.cor + 0.34, Y.cor + 0.68, 0.38, { front: M.white, top: M.white, under: M.plinth }, { uvs: 3 });
  kitBand(P, edges, Y.cor + 0.68, Y.top, 0.58, { front: M.white, top: M.white, under: M.plinth }, { uvs: 3 });
}

function west(K) {
  const P = K.P, M = K.M;
  P.push(0, 0, Z_W, 0);                                       // the west front: x along (IB x), z out of the wall plane
  wallRun(K, M.ochre, X0, X1, Y.fl - 0.1, Y.cor, westHoles(), { depth: WD, uvs: 3, surround: 'light' });
  for (const s of [-1, 1]) {
    pilaster(P, M.white, XM + s * 7.9, Y.s1 + 0.1, Y.cor, { w: 1.2, proud: 0.16, capH: 0.5, base: 0.3 });
    // festoon under the oval window: a swag of small blocks
    const cx = XM + s * 6.2;
    for (let i = -2; i <= 2; i++) { const dy = 0.1 * (2 - Math.abs(i)) * 0.7; P.box(M.white, cx + i * 0.2 - 0.07, cx + i * 0.2 + 0.07, 13.5 - dy - 0.1, 13.5 - dy + 0.06, 0, 0.09, 'k'); }
    P.box(M.white, XM + s * 2.0 - (s < 0 ? 5.0 : 0), XM + s * 2.0 + (s < 0 ? 0 : 5.0), 12.62, 12.84, 0, 0.1, 'k');      // a thin band over the stage
  }
  // the door: two leaves with two raised panels each (the cel outline draws the panel edges) and a seam
  { const dz0 = -WD + 0.05;
    P.box(M.iron, XM - 0.02, XM + 0.02, Y.fl + 0.05, Y.fl + 2.5, dz0, dz0 + 0.04, 'b', 1);
    for (const s of [-1, 1]) for (const [y0, y1] of [[0.25, 1.25], [1.45, 2.4]]) P.box(M.timber, XM + s * 0.1 + (s > 0 ? 0.08 : -0.82), XM + s * 0.1 + (s > 0 ? 0.88 : -0.08), Y.fl + y0, Y.fl + y1, dz0, dz0 + 0.03, 'b', 1); }
  // the balcony of the middle window under the cornice: a stone slab with an iron railing (alpha bars)
  P.box(M.white, XM - 1.0, XM + 1.0, 13.25, 13.45, 0, 0.75, 'b');
  const rail = (x0, z0, x1, z1, nx, nz) => P.quad(M.bars, [x0, 13.45, z0], [x1, 13.45, z1], [x1, 14.35, z1], [x0, 14.35, z0], [nx, 0, nz], [[0, 0.5], [Math.hypot(x1 - x0, z1 - z0) / 2, 0.5], [Math.hypot(x1 - x0, z1 - z0) / 2, 1.0], [0, 1.0]]);
  rail(XM - 1.0, 0.72, XM + 1.0, 0.72, 0, 1); rail(XM - 1.0, 0.72, XM - 1.0, 0.05, -1, 0); rail(XM + 1.0, 0.05, XM + 1.0, 0.72, 1, 0);
  // the two pairs of giant columns (centres 2.85 / 4.35 m from the axis), 0.45 m in front of the wall; the entablature blocks over them (the cornice projects further here)
  for (const s of [-1, 1]) {
    for (const d of [2.85, 4.35]) giantColumn(K, XM + s * d, 0.45, Y.s1 + 0.1, Y.cor - 0.1);
    const a = XM + s * 2.0, b = XM + s * 5.2;
    P.box(M.white, Math.min(a, b), Math.max(a, b), Y.cor - 0.3, Y.cor + 0.3, 0, 1.0, 'b', 3);
  }
  P.pop();
}

/** the porch: podium, the six columns, the half-ring entablature, the red half-cone roof, the flight (frame: west, origin (0, Z_W), z out) */
function porch(K) {
  const P = K.P, M = K.M;
  P.push(0, 0, Z_W, 0);
  const { R, d: zD, tread, n } = PODIUM, y0 = Y.fl, yc = y0 + 3.95, xc = XM, rise = y0 / (n + 1);
  P.box(M.plinth, xc - PODIUM.w / 2, xc + PODIUM.w / 2, 0, y0, 0, zD, 'k', 3);
  for (let j = 1; j <= n; j++) P.box(M.plinth, xc - PODIUM.w / 2 + 0.3 + j * 0.02, xc + PODIUM.w / 2 - 0.3 - j * 0.02, 0, y0 - j * rise, zD + (j - 1) * tread, zD + j * tread, 'k', 3);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 5; porchColumn(K, xc - R * Math.cos(a), R * Math.sin(a), y0, yc); }
  const ring = (r, y) => Array.from({ length: 13 }, (_, i) => { const a = i * Math.PI / 12; return [xc - r * Math.cos(a), y, r * Math.sin(a)]; });
  const out = ring(R + 0.5, yc), outTop = ring(R + 0.5, yc + 0.8), cor = ring(R + 0.8, yc + 0.8), corTop = ring(R + 0.8, yc + 1.2), inn = ring(R - 0.5, yc), innTop = ring(R - 0.5, yc + 1.2);
  for (let i = 0; i < 12; i++) {
    const am = i * Math.PI / 12 + Math.PI / 24, nx = -Math.cos(am), nz = Math.sin(am);
    P.quad(M.white, out[i], out[i + 1], outTop[i + 1], outTop[i], [nx, 0, nz]);                   // architrave + frieze face
    P.quad(M.plinth, outTop[i], outTop[i + 1], cor[i + 1], cor[i], [0, -1, 0]);                    // the soffit of the corona
    P.quad(M.white, cor[i], cor[i + 1], corTop[i + 1], corTop[i], [nx, 0, nz]);                   // the corona face
    P.quad(M.plinth, inn[i], inn[i + 1], innTop[i + 1], innTop[i], [-nx, 0, -nz]);                 // the inner face of the ring
    P.quad(M.plinth, inn[i], inn[i + 1], out[i + 1], out[i], [0, -1, 0]);                          // the loggia ceiling strip
  }
  const apex = [xc, yc + 2.5, 0], base = Array.from({ length: 13 }, (_, i) => { const a = i * Math.PI / 12; return [xc - (R + 0.8) * Math.cos(a), yc + 1.2, (R + 0.8) * Math.sin(a)]; });
  for (let i = 0; i < 12; i++) { const am = i * Math.PI / 12 + Math.PI / 24; P.fan(M.roofRed, [base[i], base[i + 1], apex], [-Math.cos(am) * 0.35, 1, Math.sin(am) * 0.35], (p) => [p[0] / 1.2, p[2] / 1.2]); }
  P.pop();
}

/** the attic block over the middle of the west front with its low pediment and the fan window (frame: west, origin (0, Z_W - 0.5): the attic front is 0.5 m behind the wall plane) */
function attic(K) {
  const P = K.P, M = K.M;
  P.push(0, 0, Z_W - 0.5, 0);
  const hw = 5.4, y0 = Y.top - 0.2, y1 = 19.6, zb = -5.4, pedH = 1.5;
  // the fan window: arch(cx, y0, w, hTotal) needs hTotal >= w / 2 (a semicircle is hTotal = w / 2); the first version had 4.2 x 1.9 (negative straight part, crown 20.0 above the wall top 19.6: sky showed through the attic)
  wallRun(K, M.ochre, XM - hw, XM + hw, y0, y1, [arch(XM, 17.45, 3.8, 1.9, 'winI')], { depth: 0.4, uvs: 3, surround: 'full' });
  for (const s of [-1, 1]) P.quad(M.ochre, [XM + s * hw, y0, 0], [XM + s * hw, y0, zb], [XM + s * hw, y1, zb], [XM + s * hw, y1, 0], [s, 0, 0], [[0, 0], [2, 0], [2, 1], [0, 1]]);
  P.box(M.white, XM - hw - 0.35, XM + hw + 0.35, y1, y1 + 0.36, zb, 0.55, 'b', 3);                 // the attic cornice
  const gy = y1 + 0.36;
  P.fan(M.ochre, [[XM - hw - 0.1, gy, 0.5], [XM + hw + 0.1, gy, 0.5], [XM, gy + pedH, 0.5]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]);       // the tympanum
  for (const s of [-1, 1]) P.cyl(M.white, [XM + s * (hw + 0.25), gy + 0.02, 0.55], [XM, gy + pedH + 0.1, 0.55], 0.17, 0.17, 4, false);   // the raking cornice
  const yr = gy + pedH + 0.1;
  for (const s of [-1, 1]) P.quad(M.roofRed, [XM + s * (hw + 0.5), gy - 0.2, 0.6], [XM + s * (hw + 0.5), gy - 0.2, zb - 0.2], [XM, yr, zb - 0.2], [XM, yr, 0.6], [s * pedH, hw, 0], [[0, 0], [8, 0], [8, 5], [0, 5]]);
  P.pop();
}

function east(K) {
  const P = K.P, M = K.M;
  P.push(X1, 0, Z_E, Math.PI);                                // the east wall: facing -z, local x runs to the NORTH (decreasing IB x) from the south end
  const h = [], loc = (xi) => X1 - xi;
  const wing = (a, b) => { for (const cx of bayCentres(loc(b), loc(a), Math.max(2, Math.round((b - a) / 3.45)))) h.push(arch(cx, Y.fl + 0.9, 1.5, 3.2), rect(cx, 6.25, 1.3, 2.4), rect(cx, 10.05, 1.3, 2.4), rect(cx, 13.7, 1.3, 2.0)); };
  wing(8.4, X1); wing(X0, -8.8);
  wallRun(K, M.ochre, 0, X1 - X0, Y.fl - 0.1, Y.cor, h, { depth: WD, uvs: 3, surround: 'light' });
  P.pop();
}

/** the semicircular stair bay of the east front (7 facets of the OSM ring) */
const BAY = [[7.8, -9.2], [5.6, -11.6], [2.9, -13.1], [-0.3, -13.5], [-3.4, -12.9], [-6.1, -11.3], [-8.2, -9.2]];
function bump(K) {
  const P = K.P, M = K.M, yTop = 13.0;
  for (let i = 0; i + 1 < BAY.length; i++) {
    const a = BAY[i], b = BAY[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    let nx = dz / len, nz = -dx / len; if (nz > 0) { nx = -nx; nz = -nz; }                    // the outward normal points to -z
    onEdge(P, { a, b, n: [nx, nz], len }, (L) => {
      wallRun(K, M.ochre, 0, L, Y.fl - 0.1, yTop, [arch(L / 2, Y.fl + 0.9, 1.4, 3.2), rect(L / 2, 6.25, 1.2, 2.4), rect(L / 2, 10.05, 1.2, 2.4)], { depth: 0.4, uvs: 3, surround: 'light' });
      P.box(M.plinth, 0, L, 0, Y.fl, -0.4, 0.08, 'k', 3);
      P.box(M.white, 0, L, Y.s1 - 0.2, Y.s1 + 0.15, 0, 0.1, 'k', 3);
      P.box(M.white, 0, L, yTop, yTop + 0.35, -0.4, 0.4, 'b', 3);
    });
  }
  const apex = [-0.3, yTop + 2.6, -10.4], pt = (i) => [BAY[i][0], yTop + 0.35, BAY[i][1]];
  for (let i = 0; i + 1 < BAY.length; i++) P.fan(M.roofRed, [pt(i), pt(i + 1), apex], [0, 0.8, -0.6], (p) => [p[0] / 1.2, p[2] / 1.2]);
}

/** the end walls of the 4-storey body (above the annexes) and the annexes: one storey, hip roof */
function ends(K) {
  const P = K.P, M = K.M, w = Z_W - Z_E;
  for (const s of [-1, 1]) {
    const x = s < 0 ? X0 : X1, xa = s < 0 ? XA0 : XA1, len = Math.abs(xa - x), hA = 3.6;
    P.push(x, 0, s < 0 ? Z_E : Z_W, s < 0 ? -Math.PI / 2 : Math.PI / 2);           // the end wall of the body: facing -x (north) / +x (south), local x to the right
    const hh = []; for (const cx of bayCentres(0, w, 4)) hh.push(rect(cx, 6.25, 1.3, 2.4), rect(cx, 10.05, 1.3, 2.4), rect(cx, 13.7, 1.3, 2.0));
    wallRun(K, M.ochre, 0, w, 3.5, Y.cor, hh, { depth: WD, uvs: 3, surround: 'light' });
    P.pop();
    P.push(xa, 0, s < 0 ? Z_E : Z_W, s < 0 ? -Math.PI / 2 : Math.PI / 2);          // the end wall of the annex
    wallRun(K, M.ochre, 0, w, 0.9, hA, [rect(w * 0.2, 1.7, 1.3, 1.6), rect(w * 0.5, 1.7, 1.3, 1.6), rect(w * 0.8, 1.7, 1.3, 1.6)], { depth: WD, uvs: 3, surround: 'light' });
    P.box(M.plinth, 0, w, 0, 0.9, -WD, 0.08, 'k', 3);
    P.box(M.white, -0.1, w + 0.1, hA, hA + 0.3, -WD, 0.35, 'b', 3);
    P.pop();
    for (const sd of [Z_W, Z_E]) {                                                  // the two long sides of the annex
      P.push(sd === Z_W ? Math.min(x, xa) : Math.max(x, xa), 0, sd, sd === Z_W ? 0 : Math.PI);
      wallRun(K, M.ochre, 0, len, 0.9, hA, [rect(len * 0.5, 1.7, 1.3, 1.6)], { depth: WD, uvs: 3, surround: 'light' });
      P.box(M.plinth, 0, len, 0, 0.9, -WD, 0.08, 'k', 3);
      P.box(M.white, 0, len, hA, hA + 0.3, -WD, 0.35, 'b', 3);
      P.pop();
    }
    hipRect(P, M.roofRed, Math.min(x, xa), Math.max(x, xa), Z_E, Z_W, hA + 0.3, 1.5, { over: 0.35, hip0: s < 0 ? undefined : 0, hip1: s < 0 ? 0 : undefined, gable: M.ochre });
  }
}

function roof(K) {
  const P = K.P, M = K.M;
  hipRect(P, M.roofRed, X0, X1, Z_E, Z_W, Y.top, 4.4, { over: 0.5 });
  for (let x = X0 + 9; x < X1 - 4; x += 14) { if (Math.abs(x - XM) < 9) continue; P.box(M.roofRed, x - 0.5, x + 0.5, Y.top + 2.2, Y.top + 6.3, -0.6, 0.6, 'b', 1.2); P.box(M.plinth, x - 0.62, x + 0.62, Y.top + 6.3, Y.top + 6.5, -0.72, 0.72, '', 1.2); }
}

function colliders(K) {
  const ctx = K.ctx, ph = ctx.physics;
  const poly = (pts) => ({ o: pts.flatMap((p) => IB.w(p[0], p[1])), h: [] });
  addPolyColliders(ctx, poly([[X0, Z_E], [X0, Z_W], [X1, Z_W], [X1, Z_E]]), 0, 22);
  addPolyColliders(ctx, poly([[XA0, Z_E], [XA0, Z_W], [X0, Z_W], [X0, Z_E]]), 0, 5);
  addPolyColliders(ctx, poly([[X1, Z_E], [X1, Z_W], [XA1, Z_W], [XA1, Z_E]]), 0, 5);
  for (let i = 0; i + 1 < BAY.length; i++) {
    const a = BAY[i], b = BAY[i + 1], p = IB.w((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), l = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    ph.addBox(p[0], p[1], l + 0.2, 0.9, IB.rot - ang, 0, 14);
  }
  const { w, d, tread, n, R } = PODIUM, xc = XM, y0 = Y.fl, rise = y0 / (n + 1);
  rectL(ctx, IB, xc - w / 2, xc + w / 2, Z_W - 0.4, Z_W + d, 0, y0 - 0.02);
  walkL(ctx, IB, xc, Z_W + d / 2, w, d, y0);
  stepsL(ctx, IB, xc, Z_W + d + n * tread, 0, -1, w - 0.6, n * tread, 0, y0 - rise, n);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 5; cylL(ctx, IB, xc - R * Math.cos(a), Z_W + R * Math.sin(a), 0.45, 0, y0 + 4.2); }
  for (const s of [-1, 1]) for (const dd of [2.85, 4.35]) cylL(ctx, IB, XM + s * dd, Z_W + 0.45, 0.7, 0, 16.2);
}

function services(K) {
  const sv = K.svc, m = IB.w(XM, Z_W + 3), f = IB.w(XM, Z_W + 20), e = IB.w(XM, Z_W + PODIUM.d + PODIUM.n * PODIUM.tread + 1.2);
  sv.monuments.push({ id: IDS.institute, name: 'Ботанический институт им. В. Л. Комарова', x: m[0], z: m[1], h: 21.6 });
  sv.photoSpots.push({ x: f[0], z: f[1], yaw: Math.round(IB.rot * 180 / Math.PI), name: 'Ботанический институт: западный фасад с колоннами и крыльцом' });
  sv.entrances.push({ x: e[0], z: e[1], rotY: IB.rot + Math.PI, bldg: IDS.institute });
  sv.crowd.push({ id: 'institute-porch', kind: 'photo', x: f[0], z: f[1], r: 6, n: 3 });
}

export function build(K) {
  K.P.push(IB.cx, 0, IB.cz, IB.rot);
  try {
    stage(K, 'bands', () => bands(K));
    stage(K, 'west', () => west(K));
    stage(K, 'porch', () => porch(K));
    stage(K, 'attic', () => attic(K));
    stage(K, 'east', () => east(K));
    stage(K, 'bump', () => bump(K));
    stage(K, 'ends', () => ends(K));
    stage(K, 'roof', () => roof(K));
  } finally { K.P.pop(); }
  stage(K, 'colliders', () => colliders(K));
  stage(K, 'services', () => services(K));
  if (K.errs && K.errs.length) throw new Error('institute: ' + K.errs.join('\n'));
}
