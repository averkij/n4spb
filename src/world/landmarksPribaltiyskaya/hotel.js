// landmarksPribaltiyskaya/hotel.js - the HOTEL BODY (Прибалтийская, OSM w17559880 + parts w533042815 .. 22): the H of three 18 m thick window slabs (four arms + the 14-bay central block) in folded champagne aluminium,
// the dark brown attic, the fins band (28 fins), the dark bronze crown with the two sloping ears, the roof word, the four end towers (blind panels, a column of ten windows at the outer corner, a deep groove, the concrete
// zigzag stairs at the bases of the front towers), the roofs, masts and plant boxes.  Dossier docs/research/pribaltiyskaya.md sections 4.1, 4.2 ([C1] 14 bays x 3.86 m, [C2] 10 rows x 2.93 m, [C3] heights, [C4] ears slope
// down outward, [C5] 28 fins, [C6] windows 2.25 x 1.7 m, [C7] albedo, [C10] towers), photos 08 15 01 12 02 17 10.  Frame HF (frame.js): local +z = out of the main facade (ENE), +x = NNW.
// LAYERS (y above the plaza): the platform / plinth (hotelfront.js) tops out at 3.2; here: base zone 3.2 .. 15.5 (glass lobby + dark band), 10 window rows 15.5 .. 44.8, panel strip + attic to 48.2 (arms),
// the central block: beam 45.4 .. 47.4, fins 47.4 .. 53.1, crown 53.1 .. 57.8, letters to 60.2, ears 60.2 .. 63.3, masts to 70.  The facades are textures (art.js bay / blind / base), one bay = 3.86 m = one uv unit.
import * as L from '../layout.js';
import { HF, Y, BAY, RING, EDGE_KIND, CB, CROWN, EAR_IN, EAR_OUT } from './frame.js';
import { edgesOf, wallQuad, wallPart, slopedCap, prism, mirrorX, boxF, ringBoxes } from './ring.js';

const CENTRAL_RETURNS = new Set([5, 7, 17, 19]);            // the side returns of the central block: they rise to the fins deck
const topOf = (i) => { const k = EDGE_KIND[i]; if (k === 'cfront' || k === 'crear') return Y.finTop; if (k === 'reveal') return CENTRAL_RETURNS.has(i) ? Y.finTop : Y.armTop; return Y.armTop; };
const SLOPE = (Y.earInner - Y.earOuter) / (36.6 - 18.2);       // the ear roofs fall 3.1 m over 18.4 m, DOWN outward (north ear: inner edge x 18.2)

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksPribaltiyskaya] hotel/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = K.P, M = K.M;
  P.push(HF.x, 0, HF.z, HF.rot);
  try {
    const E = edgesOf(RING);
    stage('faces', () => faces(P, M, E));
    stage('towers', () => towers(P, M, E));
    stage('central', () => central(P, M));
    stage('crown', () => crown(P, M));
    stage('ears', () => ears(P, M));
    stage('roofs', () => roofs(P, M));
    stage('top', () => top(P, M));
  } finally { P.pop(); }
  stage('colliders', () => colliders(K));
  stage('services', () => services(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the facades of the ring edges (everything except the tower end faces)
function faces(P, M, E) {
  for (const e of E) {
    const kind = EDGE_KIND[e.i], top = topOf(e.i);
    if (kind === 'tower') continue;
    const nB = Math.max(1, Math.round(e.len / BAY));
    wallQuad(P, M.base, e.a, e.b, e.n, Y.terr, Y.gridBase, 0, nB, 0, 1);                                   // glass lobby + dark band (one tile = 3.86 x 12.3 m)
    wallQuad(P, M.bay, e.a, e.b, e.n, Y.gridBase, Y.gridTop, 0, nB, 0, Y.rows);                           // 10 rows of windows
    if (kind === 'cfront' || kind === 'crear') {
      wallPart(P, M.blind, e, 0, e.len, Y.gridTop, Y.beam0, 1 / 2.4, 1 / 2.93, -Y.gridTop / 2.93);          // the light strip under the beam
      wallPart(P, M.beam, e, 0, e.len, Y.beam0, Y.beam1, 1, 1);                                              // (the beam box stands proud of it, below)
      wallQuad(P, M.finsWall, e.a, e.b, e.n, Y.beam1, Y.finTop, 0, e.len / (e.len / 28), 0, 1);             // the recess between the fins: one tile per pair
    } else if (top === Y.finTop) {
      wallPart(P, M.blind, e, 0, e.len, Y.gridTop, Y.finTop, 1 / 2.4, 1 / 2.93, -Y.gridTop / 2.93);
    } else {
      wallPart(P, M.blind, e, 0, e.len, Y.gridTop, Y.panelTop, 1 / 2.4, 1 / 2.93, -Y.gridTop / 2.93);       // light panels to 46.0
      wallPart(P, M.attic, e, 0, e.len, Y.panelTop, Y.armTop, 1, 1);                                         // the dark brown attic 2.2 m
    }
  }
}

// ------------------------------------------------------------------------------------------------ the four end towers [C10]: ONE column of ten windows at the outer corner, blind champagne panels, a full-height groove
function towers(P, M, E) {
  for (const e of E) {
    if (EDGE_KIND[e.i] !== 'tower') continue;
    const L0 = e.len, outerIsA = Math.abs(e.a[0]) > Math.abs(e.b[0]);
    const tOf = (s) => (outerIsA ? s : L0 - s);                          // s = distance from the outer corner along the face
    const seg = (s0, s1, fn) => { const t0 = Math.min(tOf(s0), tOf(s1)), t1 = Math.max(tOf(s0), tOf(s1)); fn(t0, t1); };
    const nB = Math.max(1, Math.round(L0 / BAY));
    wallQuad(P, M.base, e.a, e.b, e.n, Y.terr, Y.gridBase, 0, nB, 0, 1);
    const g0 = L0 / 2 - 0.75, g1 = L0 / 2 + 0.75, colW = 1.7;
    // the window column (a dark blue-grey strip with ten single windows, pitch 2.93) on a blind panel
    seg(0, colW, (t0, t1) => wallPart(P, M.blind, e, t0, t1, Y.gridBase, Y.panelTop, 1 / 2.4, 1 / 2.93, -Y.gridBase / 2.93));
    for (let k = 0; k < Y.rows; k++) {
      const y0 = Y.gridBase + 0.6 + k * Y.row, mid = tOf(colW / 2);
      const a = [e.a[0] + e.t[0] * (mid - 0.5) + e.n[0] * 0.04, e.a[1] + e.t[1] * (mid - 0.5) + e.n[1] * 0.04], b = [e.a[0] + e.t[0] * (mid + 0.5) + e.n[0] * 0.04, e.a[1] + e.t[1] * (mid + 0.5) + e.n[1] * 0.04];
      wallQuad(P, M.glassDark, a, b, e.n, y0, y0 + 1.4, 0, 1, 0, 1);
    }
    seg(colW, g0, (t0, t1) => wallPart(P, M.blind, e, t0, t1, Y.gridBase, Y.panelTop, 1 / 2.4, 1 / 2.93, -Y.gridBase / 2.93));
    seg(g1, L0, (t0, t1) => wallPart(P, M.blind, e, t0, t1, Y.gridBase, Y.panelTop, 1 / 2.4, 1 / 2.93, -Y.gridBase / 2.93));
    // the groove: recessed 0.8 m, in shadow (back wall + two jambs)
    const ga = [e.a[0] + e.t[0] * tOf(g0), e.a[1] + e.t[1] * tOf(g0)], gb = [e.a[0] + e.t[0] * tOf(g1), e.a[1] + e.t[1] * tOf(g1)], d = 0.8, back = (p) => [p[0] - e.n[0] * d, p[1] - e.n[1] * d];
    wallQuad(P, M.beam, back(ga), back(gb), e.n, Y.gridBase, Y.panelTop, 0, 1, 0, 1);
    const tn = [-(gb[0] - ga[0]), -(gb[1] - ga[1])], tl = Math.hypot(tn[0], tn[1]) || 1;
    P.quad(M.beam, [ga[0], Y.gridBase, ga[1]], [back(ga)[0], Y.gridBase, back(ga)[1]], [back(ga)[0], Y.panelTop, back(ga)[1]], [ga[0], Y.panelTop, ga[1]], [(gb[0] - ga[0]) / tl, 0, (gb[1] - ga[1]) / tl], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(M.beam, [gb[0], Y.gridBase, gb[1]], [back(gb)[0], Y.gridBase, back(gb)[1]], [back(gb)[0], Y.panelTop, back(gb)[1]], [gb[0], Y.panelTop, gb[1]], [tn[0] / tl, 0, tn[1] / tl], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // the attic band over the whole face and the plant box on the roof
    wallPart(P, M.attic, e, 0, L0, Y.panelTop, Y.armTop, 1, 1);
    const cx = (e.a[0] + e.b[0]) / 2 - e.n[0] * 6.5, cz = (e.a[1] + e.b[1]) / 2 - e.n[1] * 6.5;
    P.box(M.concrete, cx - 3, cx + 3, Y.armTop, Y.armTop + 3, cz - 3, cz + 3, 'b', 3);
    P.cyl(M.mastGrey, [cx + 1, Y.armTop + 3, cz + 1], [cx + 1, Y.armTop + 6.5, cz + 1], 0.08, 0.05, 6, false);
    // the concrete zigzag stair (three cantilevered flights) at the foot of the FRONT towers' end faces (z -23.3)
    if (e.n[1] > 0.5) {
      const xm = (e.a[0] + e.b[0]) / 2;
      for (let k = 0; k < 3; k++) {
        const y = Y.terr + 1.6 + k * 1.9, ox = (k % 2 ? 1 : -1) * 1.3;
        P.box(M.concrete, xm - 3.5 + ox, xm + 3.5 + ox, y, y + 0.55, e.a[1], e.a[1] + 3.4 + (k % 2) * 0.8, 'k', 2);
        P.box(M.concreteDark, xm - 3.5 + ox, xm + 3.5 + ox, y - 0.5, y, e.a[1] + 0.5, e.a[1] + 3.0 + (k % 2) * 0.8, 'b', 2);
        for (const sx of [-1, 1]) P.box(M.concrete, xm + ox + sx * 3.5 - (sx > 0 ? 0.55 : 0), xm + ox + sx * 3.5 + (sx > 0 ? 0 : 0.55), Y.terr, y, e.a[1] + 2.7 + (k % 2) * 0.8, e.a[1] + 3.3 + (k % 2) * 0.8, '', 2);      // the pillars that carry the flights
      }
      P.box(M.concreteDark, xm - 3.0, xm + 3.0, Y.terr, Y.terr + 1.4, e.a[1] + 0.02, e.a[1] + 1.2, 'k', 2);                // the concrete foot of the stack at the tower wall
    }
  }
}

// ------------------------------------------------------------------------------------------------ the central block above the arm roofs: side walls, the beam, the 28 fins
function central(P, M) {
  const { x0, x1, z0, z1 } = CB;
  // the east / west side walls above the arm roofs (the returns of the front part are ring edges): 48.2 .. 53.1, plus the small jogs of the rear (OSM offsets 0.4 / 0.5 m)
  const side = (a, b, n) => wallQuad(P, M.blind, a, b, n, Y.armTop, Y.finTop, 0, Math.hypot(b[0] - a[0], b[1] - a[1]) / 2.4, 0, (Y.finTop - Y.armTop) / 2.93);
  side([x1, -57.8], [x1, -77.8], [1, 0]); side([x0, -77.7], [x0, -57.8], [-1, 0]);
  side([x0 + 0.0, -77.7], [-27.2, -77.7], [0, -1]);             // jog at the rear west (the ring steps from x -27.7 to -27.2 at z -77.7)
  side([26.0, -77.8], [x1, -77.8], [0, -1]);                    // jog at the rear east (the ring steps from x 26.0 to 26.4)
  // the dark beam stands 0.4 m proud of the front (and the rear) face
  P.box(M.beam, x0, x1, Y.beam0, Y.beam1, z1, z1 + 0.4, 'k', 2);
  P.box(M.beam, -27.2, 26.0, Y.beam0, Y.beam1, z0 - 0.4, z0, 'f', 2);
  // 29 fins (28 pitches of 1.932 m), 0.45 x 0.5 m, running the whole band height 47.4 .. 53.1 (front and rear)
  const pitch = (x1 - x0) / 28;
  for (let k = 0; k <= 28; k++) {
    const x = x0 + k * pitch;
    P.box(M.champagne, x - 0.225, x + 0.225, Y.beam1, Y.finTop, z1, z1 + 0.5, 'kb', 2);
    if (k > 0 && k < 28) P.box(M.champagne, -27.2 + k * (53.2 / 28) - 0.225, -27.2 + k * (53.2 / 28) + 0.225, Y.beam1, Y.finTop, z0 - 0.5, z0, 'fb', 2);
  }
  // the deck at 53.1 around the crown: the central block top minus the crown (a roof membrane)
  const CBP = [[x1, z1], [x0, z1], [x0, -77.7], [-27.2, -77.7], [-27.2, z0], [26.0, z0], [26.0, -77.8], [x1, -77.8]];
  P.cap(M.roofMem, CBP, Y.finTop, true, 4, [[[CROWN.x0, CROWN.z0], [CROWN.x1, CROWN.z0], [CROWN.x1, CROWN.z1], [CROWN.x0, CROWN.z1]]]);
}

// ------------------------------------------------------------------------------------------------ the crown 53.1 .. 57.8: a recessed black louvre strip, the dark bronze band, a flat roof
function crown(P, M) {
  const c = CROWN, W = c.x1 - c.x0;
  // front (+z): the recessed strip 53.1 .. 55.5 (the plant-room wall seen behind the fins tops) and the dark brown band 55.5 .. 57.8
  P.quad(M.beam, [c.x0, Y.finTop, c.z1], [c.x1, Y.finTop, c.z1], [c.x1, 55.5, c.z1], [c.x0, 55.5, c.z1], [0, 0, 1]);
  P.quad(M.crownPanel, [c.x0, 55.5, c.z1], [c.x1, 55.5, c.z1], [c.x1, Y.crownTop, c.z1], [c.x0, Y.crownTop, c.z1], [0, 0, 1], [[0, 55.5 / 2.4], [W / 2.4, 55.5 / 2.4], [W / 2.4, Y.crownTop / 2.4], [0, Y.crownTop / 2.4]]);
  // rear (-z): the golden-brown band 53.1 .. 57.8 (1981 slide: 3.3 m band, the rest the plant wall)
  P.quad(M.crownPanel, [c.x1, Y.finTop, c.z0], [c.x0, Y.finTop, c.z0], [c.x0, Y.crownTop, c.z0], [c.x1, Y.crownTop, c.z0], [0, 0, -1], [[0, Y.finTop / 2.4], [W / 2.4, Y.finTop / 2.4], [W / 2.4, Y.crownTop / 2.4], [0, Y.crownTop / 2.4]]);
  // sides (x +/-), under the ears the inner halves stand on top
  const D = c.z1 - c.z0;
  P.quad(M.crownPanel, [c.x1, Y.finTop, c.z1], [c.x1, Y.finTop, c.z0], [c.x1, Y.crownTop, c.z0], [c.x1, Y.crownTop, c.z1], [1, 0, 0], [[0, Y.finTop / 2.4], [D / 2.4, Y.finTop / 2.4], [D / 2.4, Y.crownTop / 2.4], [0, Y.crownTop / 2.4]]);
  P.quad(M.crownPanel, [c.x0, Y.finTop, c.z0], [c.x0, Y.finTop, c.z1], [c.x0, Y.crownTop, c.z1], [c.x0, Y.crownTop, c.z0], [-1, 0, 0], [[0, Y.finTop / 2.4], [D / 2.4, Y.finTop / 2.4], [D / 2.4, Y.crownTop / 2.4], [0, Y.crownTop / 2.4]]);
  // the crown roof between the ears (the inner halves of the ears cover the ends)
  P.cap(M.crownRoof, [[c.x0, c.z0], [c.x1, c.z0], [c.x1, c.z1], [c.x0, c.z1]], Y.crownTop, true, 4);
  // the roof word ПРИБАЛТИЙСКАЯ: white plain capitals 19 m x 2.4 m, standing on the crown top 0.5 m behind its front edge, readable from the front and from the rear (two single-sided sheets)
  const zl = c.z1 - 0.5, y0 = Y.crownTop + 0.05, y1 = y0 + 2.4, hw = 9.5;
  P.quad(M.letters, [-hw, y0, zl], [hw, y0, zl], [hw, y1, zl], [-hw, y1, zl], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.quad(M.letters, [hw, y0, zl - 0.15], [-hw, y0, zl - 0.15], [-hw, y1, zl - 0.15], [hw, y1, zl - 0.15], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  for (const x of [-8, -3, 3, 8]) P.box(M.steel, x - 0.07, x + 0.07, Y.crownTop, y0 + 0.25, zl - 0.12, zl - 0.02, '', 1);       // the sheet's thin supports
}

// ------------------------------------------------------------------------------------------------ the ears: two prisms per ear (inner half on the crown end, outer half on the arm roof), roofs sloping DOWN outward [C4]
function ears(P, M) {
  const yTopN = (x) => Y.earInner - SLOPE * (x - 18.2);                                // north ear (x 18.2 inner edge .. 36.6 outer edge)
  for (const sgn of [1, -1]) {
    const mapR = (r) => (sgn > 0 ? r : mirrorX(r, 1.2));
    const yf = sgn > 0 ? (x) => yTopN(x) : (x) => yTopN(-x - 1.2);
    for (const [ring, base, dark] of [[EAR_IN, Y.crownTop, false], [EAR_OUT, Y.armTop, true]]) {
      const R = mapR(ring);
      prism(P, R, base, (x) => yf(x), { wall: dark ? M.crownPanel : M.crownPanel, top: M.crownRoof }, { uvs: 2.4 });
    }
  }
}

// ------------------------------------------------------------------------------------------------ the arm roofs (flat, membrane) at 48.2
function roofs(P, M) {
  const R = RING, north = [R[0], R[1], R[2], R[3], R[4], R[5], [CB.x1, -77.8], R[21], R[22], R[23]], south = [R[8], R[9], R[10], R[11], R[12], R[13], R[14], R[15], R[16], [CB.x0, -77.7]];
  P.cap(M.roofMem, north, Y.armTop, true, 4); P.cap(M.roofMem, south, Y.armTop, true, 4);
  // a low parapet kerb round the arm roofs would add edges the photos do not show; the attic band stands 0 m above the roof
}

// ------------------------------------------------------------------------------------------------ masts, antennas and dishes on the crown (no flags)
function top(P, M) {
  const y = Y.crownTop;
  for (const [x, z, topY] of [[-22, -62.5, Y.mast - 0.5], [-14.5, -62, 64], [11, -62.5, 66], [21.5, -62, 63.5], [-5, -73.5, 65], [6, -73.5, Y.mast]]) {     // mast tops up to about 70 m (all-towers.ru "70 m")
    const h = topY - y;
    P.cyl(M.mastGrey, [x, y, z], [x, y + h, z], 0.14, 0.05, 6, false);
    for (const k of [0.45, 0.75]) P.box(M.mastGrey, x - 0.9, x + 0.9, y + h * k, y + h * k + 0.06, z - 0.04, z + 0.04, '', 1);
  }
  for (const [x, z] of [[-17, -64], [-6.5, -65], [4, -64.5], [15, -65], [24, -70]]) { P.cyl(M.steel, [x, y, z], [x, y + 0.8, z], 0.08, 0.08, 6, false); P.cyl(M.dish, [x, y + 0.8, z], [x, y + 1.15, z], 0.65, 0.12, 12, true); }
}

// ------------------------------------------------------------------------------------------------ colliders (the hull is a closed thin-wall ring; the roofs are walked through the engine's roof map)
function colliders(K) {
  const ph = K.ctx.physics;
  ringBoxes(ph, HF, RING, 0, Y.armTop + 14, 0.8, true);
  boxF(ph, HF, 0, -67.8, 54.0, 27.0, 0, Y.finTop + 5, 0);                 // the central block above the arm roofs (so the thin ring cannot be walked through from a landed roof)
  for (const sx of [1, -1]) boxF(ph, HF, sx * 46.7, -21.3, 7.0, 4.2, 0, Y.terr + 9.0, 0);    // the zigzag concrete stair block of each front tower
}

// ------------------------------------------------------------------------------------------------ services
function services(K) {
  const S = K.svc, W = HF.W, sp = (name, a, b, ta, tb, pitch = 8) => { const p = W(a, b), t = W(ta, tb); S.photoSpots.push({ name, x: p.x, z: p.z, yaw: L.yawToward(p.x, p.z, t.x, t.z), pitch }); };
  const c = W(0.3, -67.9);
  S.monuments.push({ id: 'w17559880', name: 'Гостиница «Прибалтийская»', x: c.x, z: c.z, h: Y.earInner });
  sp('Гостиница «Прибалтийская»: фасад с площади', 0, 62, 0, -60, 6);
  sp('Гостиница «Прибалтийская»: у подножия лестницы', 6, 16, 0, -70, 12);
  sp('Гостиница «Прибалтийская»: вид с улицы Нахимова', -4, 230, 0, -60, 4);
  S.entrances.push(...[]);                                                  // the hotel is closed (doors shut): no entrances
}
