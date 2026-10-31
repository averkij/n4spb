// bridges/yelaginMain/third.js - the 3rd Yelagin Bridge (3-й Елагин мост): the mint-green road bridge over the Bolshaya Nevka between the Primorsky prospect (the Old Village, the Buddhist temple) and Yelagin Island (the main
// entrance of the Kirov park).  Dossier: docs/research/bridges-yelagin-main.md (ru.wikipedia "3-й Елагин мост", OSM r5633667 / w368506891, 15 Commons photos refs/bridges-yelagin-main b01 - b15).
//   Facts [W]: built 2008-09 (Giprostroymost, engineer S. P. Pyatchenko), 96.1 m long, 12.6 m wide, 3 spans, two continuous steel beams with a curvilinear lower chord, cast-in-place RC piers on piles faced with granite
//   with ice-breakers, 2 lanes + two pavements separated by a granite kerb, orthotropic plate with asphalt, welded railing "of artistic design" of grilles and tumbas, granite parapets over the abutments, 8 steel
//   torchieres with spherical lamps on the abutments and piers; a federal heritage object.  OSM deck ring 80.4 m: the part between the quay lines is drawn here.
//   Look [V]: cream-white haunched fascia with a rolled lip, pale grey granite piers with a flared foot and a wedge ice-breaker, MINT-GREEN (#9cc8aa) railing with square posts (tumbas), rods + a framed X field with a
//   four-leaf clover, mint five-globe candelabra (four curved arms + one on top) on flared granite feet / on mint pedestals over the piers, blue enamel plate "3-й Елагин мост" on a mint pole with scrolls.
// Frame: origin = the middle of the OSM deck ring, +u toward the Primorsky prospect (north), +v right of travel (east); HL = 40.2 m.  Spans (clear, between the quay lines): 20 + 40 + 20 m (photo b05: 0.29 / 0.42 / 0.29 of the deck).
import { frameOf, toUV, toWorld, frameBounds } from '../sites.js';
import { profile, closeBank, bankU } from '../long.js';
import { ymMats, extendWings, panelMat, bay, globe, plateOnPole, deckColliders, apron } from './common.js';

const AX = [-5422.86, -5535.52, -5425.55, -5615.82];             // the OSM carriageway w149248553: Yelagin end (south) -> Primorsky end (north)
const LEN = Math.hypot(AX[2] - AX[0], AX[3] - AX[1]);
export const Y3 = {
  id: 'yelagin3', name: '3-й Елагин мост', nameEn: '3rd Yelagin Bridge (road, mint-green)', ww: 'neva',
  cx: (AX[0] + AX[2]) / 2, cz: (AX[1] + AX[3]) / 2, b: Math.atan2(AX[3] - AX[1], AX[2] - AX[0]) * 180 / Math.PI + 90,
  len: LEN, hw: 6.3, road: 3.95, at: [-5424.2, -5575.7],
  osm: ['w368506891', 'w149248553', 'w549549549', 'w549549552'], pier: 20.0, crown: 1.0,
};
const HL = LEN / 2, HW = Y3.hw, ROAD = Y3.road, PAVE = 0.15, PU = Y3.pier;
/** the carriageway level at u from the middle: street level at the banks, a gentle arch of +1.0 m */
export const deckProfile3 = profile([[-HL, 0.05], [-30, 0.38], [-20, 0.68], [-10, 0.9], [0, Y3.crown], [10, 0.9], [20, 0.68], [30, 0.38], [HL, 0.05]]);
const yRoad = (u) => deckProfile3(Math.max(-HL, Math.min(HL, u)));
const PIERS3 = [-PU, PU];

export function buildThird(env, sp) {
  const { ctx, P, M, waterY } = env, f = frameOf(sp), T = f.T, L = ctx.L, Yw = ymMats(ctx, M), TM = ctx.mat.toon;
  const world = (u, v) => toWorld(sp, u, v);
  const B = { id: sp.id, x: f.cx, z: f.cz, yDeck: yRoad, info: { rails: 0, colliders: 0 }, masts: [] };
  B.at = sp.at; B.bounds = frameBounds(sp, -HL - 4, HL + 4, -HW - 4, HW + 4, 2);
  B.deckAt = (x, z) => { const q = toUV(sp, x, z); return Math.abs(q.v) <= HW + 0.05 && Math.abs(q.u) <= HL + 0.3 ? yRoad(q.u) + (Math.abs(q.v) > ROAD + 0.1 ? PAVE : 0) : null; };
  const yb = waterY - 0.2, cream = Yw.cream, mint = Yw.mint, gran = Yw.granite;
  const wetAt = (u, v = 0) => { const w = world(u, v); return !!(L.waterwayAt ? L.waterwayAt(w.x, w.z) : L.inRiver(w.x, w.z)); };
  let bank0 = -HL + 0.7, bank1 = HL - 0.7;
  { let a = null, b = null; for (let u = -HL - 8; u <= HL + 8; u += 0.25) if (wetAt(u)) { if (a === null) a = u; b = u; } if (a !== null) { bank0 = a; bank1 = b; } }
  B.info.bank = [+bank0.toFixed(2), +bank1.toFixed(2)];
  const HF = HW + 0.05;
  /** girder depth under the carriageway at u: haunched, deepest over the piers and at the abutments, 0.78 m at mid-span (photos b02 b04 b05) */
  const depthOf = (u) => {
    const edges = [-HL, -PU, PU, HL], sup = [1.1, 1.45, 1.45, 1.1];
    for (let k = 0; k < 3; k++) { const a = edges[k], b = edges[k + 1]; if (u >= a - 1e-6 && u <= b + 1e-6) { const t = (u - a) / (b - a), dA = sup[k], dB = sup[k + 1], t0 = k === 0 ? 0.62 : k === 2 ? 0.38 : 0.5; return t < t0 ? 0.8 + (dA - 0.8) * Math.pow(1 - t / t0, 2) : 0.8 + (dB - 0.8) * Math.pow((t - t0) / (1 - t0), 2); } }
    return 1.1;
  };
  const tri = (mat, a, b, c, ref) => {                                  // a flat triangle facing away from `ref`
    const n = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])];
    const cx = (a[0] + b[0] + c[0]) / 3 - ref[0], cy = (a[1] + b[1] + c[1]) / 3 - ref[1], cz = (a[2] + b[2] + c[2]) / 3 - ref[2], s = n[0] * cx + n[1] * cy + n[2] * cz < 0 ? -1 : 1, l = Math.hypot(...n) || 1;
    P.fan(mat, [a, b, c], [s * n[0] / l, s * n[1] / l, s * n[2] / l], (p) => [(p[0] + p[2]) / 2.2, p[1] / 2.2]);
  };

  P.push(f.cx, 0, f.cz, -T);
  // ------------------------------------------------------------------------------------------ deck: carriageway, granite kerbs, pavements, the haunched cream fascia with its rolled lip, the soffit with cross ribs
  const nodes = [-HL]; { const marks = [-HL, -PU, PU, HL]; for (let i = 0; i < 3; i++) { const a = marks[i], b = marks[i + 1], n = Math.ceil((b - a) / 2.2); for (let k = 1; k <= n; k++) nodes.push(a + (b - a) * k / n); } }
  for (let i = 0; i + 1 < nodes.length; i++) {
    const u0 = nodes[i], u1 = nodes[i + 1], y0 = yRoad(u0), y1 = yRoad(u1), d0 = depthOf(u0), d1 = depthOf(u1);
    P.quad(M.asphalt, [u0, y0, -ROAD], [u1, y1, -ROAD], [u1, y1, ROAD], [u0, y0, ROAD], [0, 1, 0], [[u0 / 4, -ROAD / 4], [u1 / 4, -ROAD / 4], [u1 / 4, ROAD / 4], [u0 / 4, ROAD / 4]]);
    for (const sg of [-1, 1]) {
      const va = sg * ROAD, vk = sg * (ROAD + 0.22), vb = sg * HF;
      P.quad(gran, [u0, y0, va], [u1, y1, va], [u1, y1 + PAVE, va], [u0, y0 + PAVE, va], [0, 0, -sg], [[u0 / 2.2, 0], [u1 / 2.2, 0], [u1 / 2.2, PAVE / 2.2], [u0 / 2.2, PAVE / 2.2]]);
      P.quad(gran, [u0, y0 + PAVE, va], [u1, y1 + PAVE, va], [u1, y1 + PAVE, vk], [u0, y0 + PAVE, vk], [0, 1, 0], [[u0 / 2.2, 0], [u1 / 2.2, 0], [u1 / 2.2, 0.1], [u0 / 2.2, 0.1]]);
      P.quad(M.footAsphalt, [u0, y0 + PAVE, vk], [u1, y1 + PAVE, vk], [u1, y1 + PAVE, vb], [u0, y0 + PAVE, vb], [0, 1, 0], [[u0 / 3, vk / 3], [u1 / 3, vk / 3], [u1 / 3, vb / 3], [u0 / 3, vb / 3]]);
      // fascia: the rolled lip (a protruding band) and the recessed web
      const lip = vb + sg * 0.1, web = vb - sg * 0.04;
      P.quad(cream, [u0, y0 - 0.36, lip], [u1, y1 - 0.36, lip], [u1, y1 + PAVE, lip], [u0, y0 + PAVE, lip], [0, 0, sg], [[u0 / 2.4, 0], [u1 / 2.4, 0], [u1 / 2.4, 0.5], [u0 / 2.4, 0.5]]);
      P.quad(cream, [u0, y0 - 0.36, lip], [u1, y1 - 0.36, lip], [u1, y1 - 0.36, web], [u0, y0 - 0.36, web], [0, -1, 0]);
      P.quad(cream, [u0, y0 - d0, web], [u1, y1 - d1, web], [u1, y1 - 0.36, web], [u0, y0 - 0.36, web], [0, 0, sg], [[u0 / 2.4, -d0 / 2.4], [u1 / 2.4, -d1 / 2.4], [u1 / 2.4, 0], [u0 / 2.4, 0]]);
      P.quad(cream, [u0, y0 - d0, web], [u1, y1 - d1, web], [u1, y1 - d1, web - sg * 0.3], [u0, y0 - d0, web - sg * 0.3], [0, -1, 0]);              // the lower flange
    }
    P.quad(Yw.soffit, [u0, y0 - d0 + 0.02, -HF + 0.3], [u0, y0 - d0 + 0.02, HF - 0.3], [u1, y1 - d1 + 0.02, HF - 0.3], [u1, y1 - d1 + 0.02, -HF + 0.3], [0, -1, 0]);
  }
  for (const e of [-1, 1]) apron(P, M.asphalt, e, HL, ROAD, 9, 1.8);                                     // the asphalt mouths: 2.4 m avenue / 4 m service lane meet the 7.9 m carriageway
  for (let u = -HL + 1.6; u < HL - 1; u += 2.1) { const y = yRoad(u), d = depthOf(u); P.box(cream, u - 0.07, u + 0.07, y - d - 0.0, y - d + 0.34, -HF + 0.3, HF - 0.3, 't', 1); }       // the cross ribs under the soffit
  // ------------------------------------------------------------------------------------------ piers: granite shaft (a stadium plan), a flared foot with wedge ice-breakers at both ends
  const pier = (u0) => {
    const topB = waterY + 1.0, tipY = waterY - 0.25, R = 2.05, vE = 4.2, vTip = 6.3, shaftTop = yRoad(u0) - depthOf(u0) - 0.05, rs = 1.55, vS = 4.2;
    P.box(gran, u0 - R, u0 + R, tipY, topB, -vE, vE, 'b', 2.2);                                    // the foot block (top face included)
    for (const sg of [-1, 1]) {                                                                      // wedge ice-breakers
      const A = [u0, tipY, sg * vTip], c1 = [u0 - R, topB, sg * vE], c2 = [u0 + R, topB, sg * vE], c3 = [u0 + R, tipY, sg * vE], c4 = [u0 - R, tipY, sg * vE], ref = [u0, (topB + tipY) / 2, sg * vE * 0.5];
      tri(gran, A, c1, c2, ref); tri(gran, A, c2, c3, ref); tri(gran, A, c4, c1, ref);
    }
    P.box(gran, u0 - rs, u0 + rs, topB, shaftTop - 0.3, -vS, vS, 'b', 2.2);                        // the shaft: a box + two round ends
    for (const sg of [-1, 1]) P.cyl(gran, [u0, topB, sg * vS], [u0, shaftTop - 0.3, sg * vS], rs, rs * 0.96, 16, false);
    P.box(M.coping, u0 - rs - 0.18, u0 + rs + 0.18, shaftTop - 0.3, shaftTop, -vS - 0.3, vS + 0.3, 'b', 1.6);   // the bearing cap
    for (const sg of [-1, 1]) P.cyl(M.coping, [u0, shaftTop - 0.3, sg * vS], [u0, shaftTop, sg * vS], rs + 0.18, rs + 0.18, 16, true);
  };
  for (const u0 of PIERS3) pier(u0);
  // abutments: granite walls at the quay lines under the ends of the deck
  for (const [ub, dir] of [[bank0, 1], [bank1, -1]]) {
    const ua = dir > 0 ? ub - 0.05 : ub - 1.8, uc = dir > 0 ? ub + 1.8 : ub + 0.05;
    P.box(gran, ua, uc, yb - 0.1, yRoad(ub) - depthOf(ub) + 0.02, -HF - 0.6, HF + 0.6, 'b', 2.2);
  }
  // ------------------------------------------------------------------------------------------ markings
  for (let u = -HL + 7; u + 3 <= HL - 5; u += 7) P.quad(M.mark, [u, yRoad(u) + 0.014, -0.07], [u + 3, yRoad(u + 3) + 0.014, -0.07], [u + 3, yRoad(u + 3) + 0.014, 0.07], [u, yRoad(u) + 0.014, 0.07], [0, 1, 0]);
  // ------------------------------------------------------------------------------------------ railing: mint tumbas (square posts) every ~3.6 m, alpha-cut rod panels with an X field and a four-leaf clover (photos b01 b02 b04); granite parapets over the abutments
  const PAR = 5.4;                                                                                   // the granite parapet block over each abutment (u from the end)
  const stations = [];
  { const seg = (a, b, n) => { for (let k = 0; k <= n; k++) stations.push(a + (b - a) * k / n); };
    seg(-HL + PAR, -PU, 4); seg(-PU, PU, 11); seg(PU, HL - PAR, 4);
    stations.sort((p, q) => p - q); for (let i = stations.length - 1; i > 0; i--) if (Math.abs(stations[i] - stations[i - 1]) < 0.01) stations.splice(i, 1); }
  const railMat = panelMat(ctx, M, 'y3', 3.6, 1.0, '#a7cfb3', (g, W, H, px) => {
    const p = (m) => m * px; g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round';
    g.fillRect(0, 0, W, p(0.075)); g.fillRect(0, p(0.12), W, p(0.03)); g.fillRect(0, p(0.88), W, p(0.1));
    for (let x = 0.06; x < 3.55; x += 0.085) { if (x > 0.95 && x < 2.65) continue; g.fillRect(p(x) - p(0.008), p(0.12), p(0.016), p(0.8)); }
    g.lineWidth = p(0.018); g.strokeRect(p(0.95), p(0.2), p(1.7), p(0.62));
    g.beginPath(); g.moveTo(p(0.95), p(0.2)); g.lineTo(p(2.65), p(0.82)); g.moveTo(p(2.65), p(0.2)); g.lineTo(p(0.95), p(0.82)); g.stroke();
    g.lineWidth = p(0.022); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { g.beginPath(); g.arc(p(1.8 + dx * 0.1), p(0.51 + dy * 0.1), p(0.1), 0, 6.3); g.stroke(); }          // the four-leaf clover
    for (const [cx, dir] of [[0.5, 1], [3.1, -1]]) { g.lineWidth = p(0.02); g.beginPath(); g.arc(p(cx), p(0.7), p(0.11), 0.4, 5.6); g.stroke(); g.beginPath(); g.arc(p(cx + dir * 0.22), p(0.5), p(0.11), 3.5, 7.8); g.stroke(); }
  }, 280);
  const railPts = [];
  for (const sg of [-1, 1]) {
    const v = sg * (HW - 0.2);
    for (let i = 0; i + 1 < stations.length; i++) {
      const ua = stations[i], ub = stations[i + 1], ya = yRoad(ua) + PAVE, yb2 = yRoad(ub) + PAVE;
      bay(P, railMat, ua + 0.23, ub - 0.23, ya + 0.12, yb2 + 0.12, v, 1.0); B.info.rails++;
      P.cyl(mint, [ua, ya + 1.1, v], [ub, yb2 + 1.1, v], 0.04, 0.04, 6, false);
    }
    for (const u of stations) {                                                                       // the tumbas: 0.42 m square posts 1.4 m high with a pyramid cap
      const y = yRoad(u) + PAVE, big = Math.abs(Math.abs(u) - PU) < 0.01;
      if (big) continue;
      P.box(mint, u - 0.21, u + 0.21, y, y + 1.3, v - 0.21, v + 0.21, 'b', 1.4);
      P.cyl(mint, [u, y + 1.3, v], [u, y + 1.45, v], 0.3, 0.06, 4, true);
      railPts.push(world(u, v));
    }
    // granite parapets over the abutments (pale granite, 1.0 m, with a coping) and a mint post at the junction with the railing
    for (const e of [-1, 1]) {
      const ua = e < 0 ? -HL : HL - PAR, ub = e < 0 ? -HL + PAR : HL, vv = sg * (HW - 0.2);
      for (let k = 0; k < 6; k++) { const a = ua + (ub - ua) * k / 6, b = ua + (ub - ua) * (k + 1) / 6, y0 = yRoad(a) + PAVE, y1 = yRoad(b) + PAVE;
        for (const s2 of [-1, 1]) P.quad(gran, [a, y0, vv + s2 * 0.25], [b, y1, vv + s2 * 0.25], [b, y1 + 1.0, vv + s2 * 0.25], [a, y0 + 1.0, vv + s2 * 0.25], [0, 0, s2], [[a / 2.2, 0], [b / 2.2, 0], [b / 2.2, 0.45], [a / 2.2, 0.45]]);
        P.quad(M.coping, [a, y0 + 1.0, vv - 0.3], [b, y1 + 1.0, vv - 0.3], [b, y1 + 1.0, vv + 0.3], [a, y0 + 1.0, vv + 0.3], [0, 1, 0]);
      }
    }
  }
  // ------------------------------------------------------------------------------------------ the 8 torchieres: a five-globe mint candelabrum (four curved arms + one globe on top), photos b06 b09 b12
  const lampPts = [], LAMP_H = 3.3;
  const candelabrum = (u0, y0, v0) => {
    P.cyl(mint, [u0, y0, v0], [u0, y0 + 0.08, v0], 0.16, 0.12, 8, true);
    P.cyl(mint, [u0, y0 + 0.08, v0], [u0, y0 + LAMP_H - 0.5, v0], 0.07, 0.06, 8, false);
    P.cyl(mint, [u0, y0 + LAMP_H - 0.62, v0], [u0, y0 + LAMP_H - 0.5, v0], 0.12, 0.1, 8, true);                // the collar under the arms
    for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const pts = [[0, 0], [0.26, 0.04], [0.46, 0.2], [0.56, 0.44]];
      for (let k = 0; k + 1 < pts.length; k++) P.cyl(mint, [u0 + du * pts[k][0], y0 + LAMP_H - 0.5 + pts[k][1], v0 + dv * pts[k][0]], [u0 + du * pts[k + 1][0], y0 + LAMP_H - 0.5 + pts[k + 1][1], v0 + dv * pts[k + 1][0]], 0.035, 0.035, 5, false);
      globe(P, M, u0 + du * 0.56, y0 + LAMP_H - 0.5 + 0.44 + 0.2, v0 + dv * 0.56, 0.2);
    }
    P.cyl(mint, [u0, y0 + LAMP_H - 0.5, v0], [u0, y0 + LAMP_H + 0.1, v0], 0.04, 0.035, 6, false);
    globe(P, M, u0, y0 + LAMP_H + 0.3, v0, 0.22);
  };
  for (const sg of [-1, 1]) {
    for (const e of [-1, 1]) {                                                                         // on a flared granite foot at the abutment corners
      const u0 = e * (HL - 0.55), v0 = sg * (HW - 0.45), y0 = yRoad(u0) + PAVE;
      P.cyl(gran, [u0, y0, v0], [u0, y0 + 0.55, v0], 0.62, 0.4, 8, true); P.cyl(M.coping, [u0, y0 + 0.55, v0], [u0, y0 + 0.65, v0], 0.45, 0.45, 8, true);
      candelabrum(u0, y0 + 0.65, v0);
      const w = world(u0, v0); lampPts.push({ x: w.x, z: w.z, y: y0, h: 0.65 + LAMP_H + 0.5 }); B.masts.push({ x: w.x, y: y0 + 0.65, z: w.z, h: LAMP_H, kind: 'lamp', id: sp.id });
    }
    for (const u0 of PIERS3) {                                                                         // on a mint pedestal over each river pier
      const v0 = sg * (HW - 0.45), y0 = yRoad(u0) + PAVE;
      P.box(mint, u0 - 0.42, u0 + 0.42, y0, y0 + 1.25, v0 - 0.42, v0 + 0.42, 'b', 1.4);
      P.cyl(mint, [u0, y0 + 1.25, v0], [u0, y0 + 1.45, v0], 0.6, 0.3, 4, true);
      candelabrum(u0, y0 + 1.45, v0);
      const w = world(u0, v0); lampPts.push({ x: w.x, z: w.z, y: y0, h: 1.45 + LAMP_H + 0.5 }); B.masts.push({ x: w.x, y: y0 + 1.45, z: w.z, h: LAMP_H, kind: 'lamp', id: sp.id });
    }
  }
  // the blue enamel plate "3-й ЕЛАГИН МОСТ" on a mint pole beside each abutment lamp (photo b06)
  const plateMat = Yw.plate('3-й ЕЛАГИН МОСТ'), platePts = [];
  for (const [u0, sg] of [[-HL + 3.4, 1], [HL - 3.4, -1]]) { const v0 = sg * (HW - 0.9), y0 = yRoad(u0) + PAVE; plateOnPole(P, M, mint, plateMat, u0, v0, y0, mint, 3.0, 1.0, 0.38); platePts.push(world(u0, v0)); }
  // ------------------------------------------------------------------------------------------ the quay opening beside the abutments
  const openLen = (sg, u0, dir) => {
    const zs = env.zones || []; if (!zs.length) return 1.6;
    let last = -1;
    for (let k = 0; k <= 16; k++) { const v = sg * (HW + k * 0.5), ub = bankU(L, sp, v, u0, dir); if (ub === null) break; const w = world(ub - dir * 0.25, v); if (zs.some((z) => z.test(w.x, w.z, 0.15))) last = k; }
    return last < 0 ? 1.6 : Math.min(9, Math.max(1.6, (last + 1) * 0.5 + 1.0));
  };
  const wings = [];
  for (const [dir, u0] of [[1, bank0], [-1, bank1]]) for (const sg of [-1, 1]) { const len = openLen(sg, u0, dir); wings.push({ u: u0, dir, sg, len }); closeBank({ site: sp, P, M, L, u: u0, dir, sg, v0: HW + 0.05, len, yTop: 0.05, yb, mat: gran, parapet: M.parapetGrey, collide: false }); }
  B.info.wings = wings.map((w) => w.len);
  P.pop();
  B.info.buckets = P.b.size; B.info.tris = P.tris;
  if (ctx.services) ctx.services.yelagin3 = { info: B.info, spec: sp };

  B.colliders = () => {
    B.info.colliders += deckColliders(ctx, f, T, world, { u0: -HL - 0.3, u1: HL + 0.3, hw: HW, yDeck: yRoad, bands: [[0, 2 * ROAD + 0.1, 0], [-(ROAD + HW) / 2 - 0.05, HW - ROAD + 0.1, PAVE], [(ROAD + HW) / 2 + 0.05, HW - ROAD + 0.1, PAVE]] });
    const ph = ctx.physics;
    for (const w of lampPts) { ph.addCylinder(w.x, w.z, 0.4, -0.5, w.y + w.h); B.info.colliders++; }
    for (const w of platePts) { ph.addCylinder(w.x, w.z, 0.07, -0.5, 4); B.info.colliders++; }
    for (const w of wings) { B.info.colliders += closeBank({ site: sp, L, ph, u: w.u, dir: w.dir, sg: w.sg, v0: HW - 0.3, len: w.len, yTop: 0.05, draw: false }); B.info.colliders += extendWings(ctx, sp, L, { u: w.u, dir: w.dir, sg: w.sg, from: HW + w.len + 0.6, yTop: 0.05 }); }
  };
  void railPts; void TM;
  return B;
}
