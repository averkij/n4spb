// bridges/yelaginMain/first.js - the 1st Yelagin Bridge (1-й Елагин мост): the steel road bridge over the Srednyaya Nevka between Yelagin Island (the main alley of the Kirov park) and Kamenny Island (Starogo Teatra square,
// the Kamennoostrovsky Theatre).  Dossier: docs/research/bridges-yelagin-main.md (ru.wikipedia "1-й Елагин мост", OSM r5633668 / w369563617, 18 Commons photos refs/bridges-yelagin-main a01 - a18).
//   Facts [W]: 107.9 m, 11.5 m between the railings (carriageway 7.0, two raised pavements on blocks), nine spans 12.05 + 11.38 + 12.44 + 8.22 + 16.08 + 9.01 + 12.85 + 11.28 + 12.05 counted from the Yelagin end
//   (OSM: the wooden = lift span sits 44.9 - 58.1 m from the Yelagin end), 7 welded I beams No. 55 1.6 m apart, a single-leaf bascule (lift) span of 16.12 m between two steel frame piers, tower piers on
//   pile foundations with a steel truss superstructure, pile dolphins up and down stream, asphalt deck, welded railing "of simple pattern" (white rods with diamond medallions and S curls), rebuilt 2021-22.
//   Look [V]: everything light grey-white; the lift frames slatted grey; white lamp standards with a curved arm and a clear bowl under a flat cap; a blue enamel plate "1-й Елагин мост" on a dark pole.
// Frame (bridges/sites.js): origin = the middle of the OSM deck polygon, +u toward Kamenny (east-south-east), +v right of travel (south-south-west); HL = 55.8 m.
import * as THREE from 'three';
import { frameOf, toUV, toWorld, frameBounds } from '../sites.js';
import { profile, closeBank, bankU } from '../long.js';
import { ymMats, extendWings, panelMat, bay, bowlLamp, plateOnPole, deckColliders, apron } from './common.js';

const AX = [-4506.4, -5040.9, -4402.6, -5000.0];                 // the OSM axis: Yelagin end -> Kamenny end (middle of the ring ends)
const LEN = Math.hypot(AX[2] - AX[0], AX[3] - AX[1]);
export const Y1 = {
  id: 'yelagin1', name: '1-й Елагин мост', nameEn: '1st Yelagin Bridge (road, lift span)', ww: 'neva',
  cx: (AX[0] + AX[2]) / 2, cz: (AX[1] + AX[3]) / 2, b: Math.atan2(AX[3] - AX[1], AX[2] - AX[0]) * 180 / Math.PI + 90,
  len: LEN, hw: 5.75, road: 3.5, at: [-4454.5, -5020.5],
  osm: ['w369563617', 'w549549558', 'w1283399393', 'w1283399394', 'w1283399395', 'w1283399396', 'w1283399397', 'w1283399398', 'w549549563', 'w549549566'],
  spans: [12.05, 11.38, 12.44, 8.22, 16.08, 9.01, 12.85, 11.28, 12.05], s0: 0.8, lift: 4, crown: 1.15,
};
const HL = LEN / 2, HW = Y1.hw, ROAD = Y1.road, PAVE = 0.17, ROAD_END = 3.5;
/** pier boundaries in the frame (from the middle): [0] = west end of the scheme ... [9] = east end; the lift span = PIERS[4] .. PIERS[5] */
export const PIERS1 = (() => { let a = Y1.s0 - HL; const o = [a]; for (const s of Y1.spans) { a += s; o.push(a); } return o; })();
/** the carriageway level (m over street level) at u from the middle: street level at both banks, +1.15 m over the lift span */
export const deckProfile1 = (() => {
  const A = (x) => x - HL;
  return profile([[A(0), 0.05], [A(14), 0.25], [A(26), 0.62], [A(38), 0.98], [A(50), 1.15], [A(56), 1.15], [A(66), 1.0], [A(78), 0.72], [A(92), 0.3], [A(104), 0.1], [A(LEN), 0.05]]);
})();
const yRoad = (u) => deckProfile1(Math.max(-HL, Math.min(HL, u)));

export function buildFirst(env, sp) {
  const { ctx, P, M, waterY } = env, f = frameOf(sp), T = f.T, L = ctx.L, Yw = ymMats(ctx, M), TM = ctx.mat.toon;
  const world = (u, v) => toWorld(sp, u, v);
  const B = { id: sp.id, x: f.cx, z: f.cz, yDeck: yRoad, info: { rails: 0, colliders: 0 }, masts: [] };
  B.at = sp.at; B.bounds = frameBounds(sp, -HL - 4, HL + 4, -HW - 4, HW + 4, 2);
  B.deckAt = (x, z) => { const q = toUV(sp, x, z); return Math.abs(q.v) <= HW + 0.05 && Math.abs(q.u) <= HL + 0.3 ? yRoad(q.u) + (Math.abs(q.v) > ROAD + 0.2 ? PAVE : 0) : null; };
  const yb = waterY - 0.2;
  // the bank lines along the axis (first / last wet sample)
  const wetAt = (u, v = 0) => { const w = world(u, v); return !!(L.waterwayAt ? L.waterwayAt(w.x, w.z) : L.inRiver(w.x, w.z)); };
  let bank0 = PIERS1[0] + 4, bank1 = PIERS1[9] - 4;
  { let a = null, b = null; for (let u = -HL - 8; u <= HL + 8; u += 0.25) if (wetAt(u)) { if (a === null) a = u; b = u; } if (a !== null) { bank0 = a; bank1 = b; } }
  B.info.bank = [+bank0.toFixed(2), +bank1.toFixed(2)];
  const liftA = PIERS1[sp.lift], liftB = PIERS1[sp.lift + 1];
  const inLift = (u) => u > liftA + 0.5 && u < liftB - 0.5;
  const white = Yw.white, conc = Yw.conc, pile = Yw.pile, slat = Yw.slat;
  const depthOf = (u) => (u > liftA && u < liftB ? 1.35 : 0.95);          // fascia depth: the lift leaf is deeper

  P.push(f.cx, 0, f.cz, -T);
  // ------------------------------------------------------------------------------------------ deck: carriageway, kerbs, raised pavements, fascia, soffit
  const nodes = [-HL];
  { const marks = [-HL, ...PIERS1.filter((p) => p > -HL && p < HL), HL];
    for (let i = 0; i + 1 < marks.length; i++) { const a = marks[i], b = marks[i + 1], n = Math.max(1, Math.ceil((b - a) / 3.2)); for (let k = 1; k <= n; k++) nodes.push(a + (b - a) * k / n); } }
  const HF = HW + 0.1;                                                    // the fascia plane
  for (let i = 0; i + 1 < nodes.length; i++) {
    const u0 = nodes[i], u1 = nodes[i + 1], y0 = yRoad(u0), y1 = yRoad(u1), um = (u0 + u1) / 2, d = depthOf(um), lift = inLift(um);
    const roadMat = lift ? Yw.plank : M.asphalt, walkMat = lift ? Yw.plank : Yw.pave1;
    const rs = lift ? [1.0, 1.0] : [4, 4];
    P.quad(roadMat, [u0, y0, -ROAD], [u1, y1, -ROAD], [u1, y1, ROAD], [u0, y0, ROAD], [0, 1, 0], [[u0 / rs[0], -ROAD / rs[1]], [u1 / rs[0], -ROAD / rs[1]], [u1 / rs[0], ROAD / rs[1]], [u0 / rs[0], ROAD / rs[1]]]);
    for (const sg of [-1, 1]) {
      const va = sg * ROAD, vk = sg * (ROAD + 0.2), vb = sg * HF;
      P.quad(conc, [u0, y0, va], [u1, y1, va], [u1, y1 + PAVE, va], [u0, y0 + PAVE, va], [0, 0, -sg], [[u0, 0], [u1, 0], [u1, PAVE], [u0, PAVE]]);                 // the kerb face
      P.quad(conc, [u0, y0 + PAVE, va], [u1, y1 + PAVE, va], [u1, y1 + PAVE, vk], [u0, y0 + PAVE, vk], [0, 1, 0], [[u0, 0], [u1, 0], [u1, 0.2], [u0, 0.2]]);          // the kerb stone top
      const ta = (Math.abs(vk)) , tb = Math.abs(vb), ws = tb - ta, uvw = lift ? [[u0 / 1.0, vk / 1.0], [u1 / 1.0, vk / 1.0], [u1 / 1.0, vb / 1.0], [u0 / 1.0, vb / 1.0]] : [[u0 / 2.4, 0], [u1 / 2.4, 0], [u1 / 2.4, 1], [u0 / 2.4, 1]];
      void ws;
      P.quad(walkMat, [u0, y0 + PAVE, vk], [u1, y1 + PAVE, vk], [u1, y1 + PAVE, vb], [u0, y0 + PAVE, vb], [0, 1, 0], uvw);                                          // the pavement
      P.quad(white, [u0, y0 - d, vb], [u1, y1 - d, vb], [u1, y1 + PAVE, vb], [u0, y0 + PAVE, vb], [0, 0, sg], [[u0 / 2.4, -d / 2.4], [u1 / 2.4, -d / 2.4], [u1 / 2.4, PAVE / 2.4], [u0 / 2.4, PAVE / 2.4]]);   // the fascia plate
      P.quad(white, [u0, y0 - d + 0.0, vb], [u1, y1 - d, vb], [u1, y1 - d, vb - sg * 0.5], [u0, y0 - d, vb - sg * 0.5], [0, -1, 0]);                                  // the lower flange lip
    }
    P.quad(white, [u0, y0 - d, -vbSafe(HF)], [u0, y0 - d, vbSafe(HF)], [u1, y1 - d, vbSafe(HF)], [u1, y1 - d, -vbSafe(HF)], [0, -1, 0]);                             // the soffit
  }
  function vbSafe(v) { return v - 0.5; }
  // the 7 welded I beams of every fixed span (1.6 m apart) under the soffit
  for (let s = 0; s < sp.spans.length; s++) {
    if (s === sp.lift) continue;
    const ua = PIERS1[s] + 0.15, ub = PIERS1[s + 1] - 0.15, ya = yRoad(ua) - 0.95, yb2 = yRoad(ub) - 0.95, h = 0.5;
    for (let k = -3; k <= 3; k++) {
      const v = k * 1.6;
      for (const sg of [-1, 1]) P.quad(white, [ua, ya - h, v + sg * 0.02], [ub, yb2 - h, v + sg * 0.02], [ub, yb2, v + sg * 0.02], [ua, ya, v + sg * 0.02], [0, 0, sg]);
      P.quad(white, [ua, ya - h, v - 0.12], [ub, yb2 - h, v - 0.12], [ub, yb2 - h, v + 0.12], [ua, ya - h, v + 0.12], [0, -1, 0]);
    }
  }
  // the lift leaf: two deep main beams between the frame piers
  { const ua = liftA + 0.6, ub = liftB - 0.6, ya = yRoad(ua) - 1.35, yb2 = yRoad(ub) - 1.35, h = 0.7;
    for (const v of [-3.0, 3.0]) { for (const sg of [-1, 1]) P.quad(white, [ua, ya - h, v + sg * 0.03], [ub, yb2 - h, v + sg * 0.03], [ub, yb2, v + sg * 0.03], [ua, ya, v + sg * 0.03], [0, 0, sg]); P.quad(white, [ua, ya - h, v - 0.25], [ub, yb2 - h, v - 0.25], [ub, yb2 - h, v + 0.25], [ua, ya - h, v + 0.25], [0, -1, 0]); }
  }
  // ------------------------------------------------------------------------------------------ piers
  const bar = (a, b, w, mat = white) => P.cyl(mat, a, b, w / 2, w / 2, 4, false);
  const grillage = (u0, hu) => {                                          // the pale concrete grillage: a stadium plate with round ends (photos a01 a06)
    const top = waterY + 0.3, hv = HW - 0.3;
    P.box(conc, u0 - hu, u0 + hu, yb, top, -hv, hv, 'b', 2);
    for (const sg of [-1, 1]) P.cyl(conc, [u0, yb, sg * hv], [u0, top, sg * hv], hu, hu, 14, true);
    return top;
  };
  const towers = [];
  const towerPier = (u0) => {
    const top = grillage(u0, 2.0), gy = yRoad(u0) - depthOf(u0) - 0.55;
    for (const du of [-0.95, 0.95]) {                                     // two trusses across the bridge (a row of columns, chords and X braces)
      const ur = u0 + du, cols = [-4.8, -1.6, 1.6, 4.8];
      for (const v of cols) P.box(white, ur - 0.11, ur + 0.11, top, gy, v - 0.11, v + 0.11, 'b', 1);
      for (const yy of [top + 0.2, (top + gy) / 2, gy - 0.12]) P.box(white, ur - 0.08, ur + 0.08, yy - 0.08, yy + 0.08, cols[0], cols[3], '', 1);
      for (let k = 0; k < 3; k++) { const va = cols[k], vc = cols[k + 1]; bar([ur, top + 0.2, va], [ur, (top + gy) / 2, vc], 0.1); bar([ur, top + 0.2, vc], [ur, (top + gy) / 2, va], 0.1); bar([ur, (top + gy) / 2, va], [ur, gy - 0.12, vc], 0.1); bar([ur, (top + gy) / 2, vc], [ur, gy - 0.12, va], 0.1); }
      P.box(white, ur - 0.2, ur + 0.2, gy, gy + 0.5, -HF + 0.4, HF - 0.4, '', 1.4);        // the cap beam under the girders
    }
    for (const v of [-4.8, 4.8]) bar([u0 - 0.95, (top + gy) / 2, v], [u0 + 0.95, (top + gy) / 2, v], 0.1);   // the longitudinal ties
    towers.push(u0);
  };
  const liftPier = (u0, dir) => {                                         // the steel frame of the lift span: a slatted grey box with a white frame (photos a01 a03 a08)
    const top = grillage(u0, 2.2), gy = yRoad(u0) - 1.35 - 0.1;
    P.box(slat, u0 - 1.0, u0 + 1.0, top, gy, -HW + 0.5, HW - 0.5, 'b', 1.2);
    for (const sg of [-1, 1]) for (const v of [-HW + 0.5, HW - 0.5]) P.box(white, u0 + sg * 1.0 - 0.07, u0 + sg * 1.0 + 0.07, top, gy, v - 0.13, v + 0.13, '', 1);
    for (const v of [-HW + 0.45, HW - 0.45]) { bar([u0 - 1.0, top + 0.1, v], [u0 + 1.0, gy - 0.1, v], 0.1); bar([u0 + 1.0, top + 0.1, v], [u0 - 1.0, gy - 0.1, v], 0.1); }
    void dir; towers.push(u0);
  };
  for (let i = 1; i < PIERS1.length - 1; i++) { if (i === sp.lift || i === sp.lift + 1) liftPier(PIERS1[i], i === sp.lift ? -1 : 1); else towerPier(PIERS1[i]); }
  // the abutments: concrete faces at the bank lines under the end of the deck
  for (const [ub, dir] of [[bank0, 1], [bank1, -1]]) {
    const ua = dir > 0 ? ub - 0.05 : ub - 1.5, uc = dir > 0 ? ub + 1.5 : ub + 0.05;
    P.box(conc, ua, uc, yb - 0.1, yRoad(ub) - depthOf(ub) + 0.05, -HF + 0.05, HF - 0.05, 'b', 1.6);
  }
  // pile dolphins: three dark steel pipes with a collar and a cap, up and down stream of every pier and in a row along the lift span (photos a01 a06 a08)
  const dolphin = (u0, v0, top) => {
    for (const [du, dv] of [[0, 0], [0.5, 0.06], [-0.5, 0.06]]) P.cyl(pile, [u0 + du, waterY - 0.15, v0 + dv], [u0 + du, top, v0 + dv], 0.22, 0.22, 8, true);
    P.cyl(M.cap, [u0, top - 0.3, v0 + 0.04], [u0, top - 0.16, v0 + 0.04], 0.5, 0.5, 8, true);
  };
  for (let i = 1; i < PIERS1.length - 1; i++) for (const sg of [-1, 1]) dolphin(PIERS1[i], sg * (HW + 2.7), waterY + (i === sp.lift || i === sp.lift + 1 ? 3.0 : 2.4));
  for (const sg of [-1, 1]) for (let u = liftA - 4.5; u <= liftB + 4.6; u += 4.5) if (Math.abs(u - liftA) > 1.6 && Math.abs(u - liftB) > 1.6) dolphin(u, sg * (HW + 2.7), waterY + 2.2);
  for (const e of [-1, 1]) apron(P, M.asphalt, e, HL, ROAD, 7, 1.5);                                     // the asphalt mouths: the park footways / the 4 m service lane meet the 7 m carriageway
  // ------------------------------------------------------------------------------------------ marks, joints
  for (let u = -HL + 6; u + 3 <= HL - 4; u += 6.5) P.quad(M.mark, [u, yRoad(u) + 0.014, -0.06], [u + 3, yRoad(u + 3) + 0.014, -0.06], [u + 3, yRoad(u + 3) + 0.014, 0.06], [u, yRoad(u) + 0.014, 0.06], [0, 1, 0]);
  for (const u of [liftA + 0.12, liftB - 0.12]) P.quad(M.steel, [u - 0.1, yRoad(u) + 0.016, -ROAD], [u + 0.1, yRoad(u) + 0.016, -ROAD], [u + 0.1, yRoad(u) + 0.016, ROAD], [u - 0.1, yRoad(u) + 0.016, ROAD], [0, 1, 0]);
  // ------------------------------------------------------------------------------------------ railing: round handrail, posts every 2 m, alpha-cut rod panels with diamond medallions and S curls (photos a04 a05 a06)
  const RAIL_V = HW - 0.1, nb = Math.round((2 * HL - 0.8) / 2.0), bw = (2 * HL - 0.8) / nb, u00 = -HL + 0.4;
  const railMat = panelMat(ctx, M, 'y1', 2.0, 1.0, '#e6eaec', (g, W, H, px) => {
    const p = (m) => m * px; g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round';
    g.fillRect(0, p(0.9), W, p(0.04));                                    // the bottom rail
    g.fillRect(0, p(0.06), W, p(0.03));                                   // the lower rail of the handrail
    for (let i = 0; i < 17; i++) { const x = p(0.06 + i * 0.1); if (Math.abs(x - W / 2) < p(0.43) && x > p(0.6) && x < p(1.4)) continue; g.fillRect(x - p(0.009), p(0.06), p(0.018), p(0.86)); }   // vertical rods, interrupted by the medallion
    g.lineWidth = p(0.022); g.beginPath(); g.moveTo(W / 2 - p(0.42), p(0.48)); g.lineTo(W / 2, p(0.26)); g.lineTo(W / 2 + p(0.42), p(0.48)); g.lineTo(W / 2, p(0.7)); g.closePath(); g.stroke();   // the diamond
    g.lineWidth = p(0.014); g.beginPath(); g.moveTo(W / 2 - p(0.26), p(0.48)); g.lineTo(W / 2, p(0.36)); g.lineTo(W / 2 + p(0.26), p(0.48)); g.lineTo(W / 2, p(0.6)); g.closePath(); g.stroke();
    g.fillRect(W / 2 - p(0.4), p(0.47), p(0.8), p(0.02));
    for (const cx of [p(0.3), p(1.7)]) { g.lineWidth = p(0.02); g.beginPath(); g.arc(cx, p(0.72), p(0.09), 0.3, 4.6); g.stroke(); g.beginPath(); g.arc(cx + p(0.15), p(0.5), p(0.09), 3.5, 7.8); g.stroke(); }          // S curls
  });
  for (const sg of [-1, 1]) {
    const v = sg * RAIL_V;
    for (let i = 0; i < nb; i++) {
      const ua = u00 + bw * i, ub = ua + bw, ya = yRoad(ua) + PAVE, yb2 = yRoad(ub) + PAVE;
      bay(P, railMat, ua + 0.06, ub - 0.06, ya + 0.12, yb2 + 0.12, v, 1.0); B.info.rails++;
      P.cyl(white, [ua, ya + 1.12, v], [ub, yb2 + 1.12, v], 0.04, 0.04, 6, false);                                                 // the round handrail
      P.cyl(white, [ua, ya, v], [ua, ya + 1.1, v], 0.055, 0.055, 6, false); P.cyl(white, [ua, ya + 1.0, v], [ua, ya + 1.16, v], 0.075, 0.075, 6, true);   // the post with its collar
    }
    { const u = u00 + bw * nb, y = yRoad(u) + PAVE; P.cyl(white, [u, y, v], [u, y + 1.1, v], 0.055, 0.055, 6, false); P.cyl(white, [u, y + 1.0, v], [u, y + 1.16, v], 0.075, 0.075, 6, true); }
  }
  // ------------------------------------------------------------------------------------------ lamp standards: 8.2 m white poles on the pavement, an arc arm leans over the carriageway, a clear bowl under a cap (photos a01 a04 a05)
  const lampPts = [], LAMP_H = 8.2, lampMats = [];
  for (const sg of [-1, 1]) {
    const list = []; for (let u = -48.5 + (sg > 0 ? 9.5 : 0); u < HL - 3; u += 19) list.push(u);
    for (const u0 of list) {
      const v0 = sg * (HW - 0.45), y0 = yRoad(u0) + PAVE, dv = -sg;
      P.cyl(white, [u0, y0, v0], [u0, y0 + 0.35, v0], 0.17, 0.12, 8, true);                                                  // the cast foot
      P.cyl(white, [u0, y0 + 0.35, v0], [u0, y0 + LAMP_H, v0], 0.1, 0.065, 8, false);
      for (const yy of [1.2, 4.0]) P.cyl(white, [u0, y0 + yy, v0], [u0, y0 + yy + 0.09, v0], 0.115, 0.115, 8, true);          // collars
      const arm = []; for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI * 0.62; arm.push([dv * 1.15 * (1 - Math.cos(a)), 0.95 * Math.sin(a)]); }
      for (let k = 0; k + 1 < arm.length; k++) P.cyl(white, [u0, y0 + LAMP_H - 0.9 + arm[k][1], v0 + arm[k][0]], [u0, y0 + LAMP_H - 0.9 + arm[k + 1][1], v0 + arm[k + 1][0]], 0.04, 0.04, 5, false);
      const gx = v0 + arm[6][0] + dv * 0.1, gy = y0 + LAMP_H - 0.9 + arm[6][1] - 0.12;
      bowlLamp(P, M, white, u0, gy - 0.16, gx, 0.26);
      const w = world(u0, v0); lampPts.push({ x: w.x, z: w.z, y: y0, h: LAMP_H }); B.masts.push({ x: w.x, y: y0, z: w.z, h: LAMP_H, kind: 'lamp', id: sp.id });
    }
  }
  void lampMats;
  // the blue enamel plate "1-й Елагин мост" on a dark pole at the Yelagin end (right pavement) and at the Kamenny end (left pavement), photo a05
  const plateMat = Yw.plate('1-й ЕЛАГИН МОСТ'), platePts = [];
  for (const [u0, sg] of [[-HL + 7.5, 1], [HL - 7.5, -1]]) {
    const v0 = sg * (HW - 0.9), y0 = yRoad(u0) + PAVE;
    plateOnPole(P, M, white, plateMat, u0, v0, y0, M.iron, 3.0, 0.95, 0.36); platePts.push(world(u0, v0));
  }
  // ------------------------------------------------------------------------------------------ the quay opening beside the abutments (granite wings + a collider): closeBank
  const openLen = (sg, u0, dir) => {
    const zs = env.zones || []; if (!zs.length) return 1.6;
    let last = -1;
    for (let k = 0; k <= 16; k++) { const v = sg * (HW + k * 0.5), ub = bankU(L, sp, v, u0, dir); if (ub === null) break; const w = world(ub - dir * 0.25, v); if (zs.some((z) => z.test(w.x, w.z, 0.15))) last = k; }
    return last < 0 ? 1.6 : Math.min(9, Math.max(1.6, (last + 1) * 0.5 + 1.0));
  };
  const wings = [];
  for (const [dir, u0] of [[1, bank0], [-1, bank1]]) for (const sg of [-1, 1]) { const len = openLen(sg, u0, dir); wings.push({ u: u0, dir, sg, len }); closeBank({ site: sp, P, M, L, u: u0, dir, sg, v0: HW + 0.05, len, yTop: 0.05, yb, mat: M.graniteGrey, parapet: M.parapetGrey, collide: false }); }
  B.info.wings = wings.map((w) => w.len);
  P.pop();
  B.info.buckets = P.b.size; B.info.tris = P.tris;
  if (ctx.services) ctx.services.yelagin1 = { info: B.info, spec: sp };

  // ------------------------------------------------------------------------------------------ colliders
  B.colliders = () => {
    B.info.colliders += deckColliders(ctx, f, T, world, { u0: -HL - 0.3, u1: HL + 0.3, hw: HW, yDeck: yRoad, bands: [[0, 2 * ROAD + 0.1, 0], [-(ROAD + HW) / 2 - 0.05, HW - ROAD + 0.1, PAVE], [(ROAD + HW) / 2 + 0.05, HW - ROAD + 0.1, PAVE]] });
    const ph = ctx.physics;
    for (const w of lampPts) { ph.addCylinder(w.x, w.z, 0.17, -0.5, w.y + w.h); B.info.colliders++; }
    for (const w of platePts) { ph.addCylinder(w.x, w.z, 0.07, -0.5, 4); B.info.colliders++; }
    for (const w of wings) { B.info.colliders += closeBank({ site: sp, L, ph, u: w.u, dir: w.dir, sg: w.sg, v0: HW - 0.3, len: w.len, yTop: 0.05, draw: false }); B.info.colliders += extendWings(ctx, sp, L, { u: w.u, dir: w.dir, sg: w.sg, from: HW + w.len + 0.6, yTop: 0.05 }); }
  };
  return B;
}
void THREE; void ROAD_END;
