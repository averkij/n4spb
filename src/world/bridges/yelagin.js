// bridges/yelagin.js - the 2nd Yelagin Bridge (2-й Елагин мост): the pedestrian lift bridge over the Srednyaya Nevka between Krestovsky Island (K2, the Ryukhina street / TsPKiO gate) and Yelagin Island (the main
// entrance of the Kirov park).  Dossier: docs/research/yelagin-bridge-2026.md (ru.wikipedia "2-й Елагин мост", OSM r5633666 / w368503777 / w4461337, 18 Commons photos refs/yelagin-bridge 01 - 18).
//   Facts [W]: 141.8 m, 15.9 m between the railings, 11 spans 15.02 + 10.44 + 11.87 + 12.76 + 10.57 + 16.00 + 9.66 + 12.69 + 11.59 + 12.5 + 16.12 (counted from the Yelagin end, photos 02 / 04 / 13), spans 4 and
//   8 navigable, span 6 a single-leaf bascule (13.5 m clear) between two steel frame piers; 9 welded I beams per fixed span (1.7 m apart), timber-clad tower piers on piles (two rows of posts, X bracing, inclined
//   struts), pile clusters (grey steel pipe piles) up and down stream, plank deck, white steel railing of simple pattern (round top tube, bottom rail, vertical rods, 2 m posts), a pale-blue 2.4 m bar
//   fence along the lift span, pale grey lamp standards (round pole, ball top, arched arm, clear hemispherical globe), a blue enamel plate "2-й ЕЛАГИН МОСТ" on a dark pole; pedestrians only since 1990
//   (bollards / gates at both ends: OSM n1231935214 at the Yelagin end, the TsPKiO gate n2318469095 + wicket n5308362245 at the Krestovsky end), rebuilt 2017-18 keeping the look.
//   Frame: origin = the middle of the OSM bridge axis (w4461337: (-5216.2, -4875.0) -> (-5204.2, -4737.7)), +u toward Krestovsky (south), +v right of travel (west); u = 0 at the middle, the deck runs HL = 68.9 m
//   either way and over the land beyond the bank lines.  Deck profile: street level at both banks, a hump of 1.45 m over the lift span (navigable clearance ~4.0 m over the water; ours is flat).
//   Own files: this one + tools/yelagin-bridge-*.mjs.  NO flags / flagpoles / beacons (user rules).
import * as THREE from 'three';
import { frameOf, toUV, toWorld, frameBounds } from './sites.js';
import { profile, closeBank, bankU } from './long.js';

const SCALE_AX = [-5216.2, -4875.0, -5204.2, -4737.7];                  // OSM way w4461337: Yelagin end -> Krestovsky end
const AX = Math.atan2(SCALE_AX[3] - SCALE_AX[1], SCALE_AX[2] - SCALE_AX[0]);        // direction of +u (rad, atan2(dz, dx))
const LEN = Math.hypot(SCALE_AX[2] - SCALE_AX[0], SCALE_AX[3] - SCALE_AX[1]);        // 137.8 m between the polygon ends
/** the spec / frame record (a "site": frameOf / toUV / toWorld / closeBank / bankU accept it) */
export const YEL = {
  id: 'yelagin2', name: '2-й Елагин мост', nameEn: '2nd Yelagin Bridge (pedestrian lift bridge)', ww: 'neva',
  cx: (SCALE_AX[0] + SCALE_AX[2]) / 2, cz: (SCALE_AX[1] + SCALE_AX[3]) / 2, b: AX * 180 / Math.PI + 90,       // bearing of +u (clockwise from north)
  len: LEN, hw: 7.95, osm: ['r5633666', 'w4461337', 'w368503777'], at: [-5210, -4806],
  // [W] span lengths from the Yelagin end (m); the sum 139.22 is scaled to the OSM deck length
  spans: [15.02, 10.44, 11.87, 12.76, 10.57, 16.00, 9.66, 12.69, 11.59, 12.5, 16.12], lift: 5, nav: [3, 7], crown: 1.45,
};
const HL = LEN / 2, HW = YEL.hw;
const SUM = YEL.spans.reduce((a, b) => a + b, 0), K = LEN / SUM;
/** u (from the middle) of the pier boundaries: ps[0] = Yelagin abutment edge ... ps[11] = Krestovsky edge */
export const PIERS = (() => { let a = -HL; const o = [a]; for (const s of YEL.spans) { a += s * K; o.push(a); } return o; })();
/** deck height (m over street level) at u from the middle: monotone hump, +0.05 at the banks */
export const deckProfile = (() => {
  const A = (x) => x - HL;                                                // keys given from the Yelagin end
  return profile([[A(0), 0.05], [A(15), 0.30], [A(26), 0.66], [A(37), 1.02], [A(50), 1.30], [A(68), YEL.crown], [A(87), 1.30], [A(99), 1.02], [A(111), 0.66], [A(123), 0.30], [A(LEN), 0.05]]);
})();
const yDeck = (u) => deckProfile(Math.max(-HL, Math.min(HL, u)));

export function buildYelagin(env) {
  const { ctx, P, M, rails } = env, sp = YEL, f = frameOf(sp), T = f.T, L = ctx.L, waterY = env.waterY;
  const TM = ctx.mat.toon;
  const timber = TM('#7b7467', { paint: 0.06, name: 'brg-yel-timber' });                 // weathered grey-brown timber of the piers
  const white = TM('#e2e8ea', { paint: 0.02, name: 'brg-yel-white' });                     // white-grey paint: posts, handrail, lamp standards, lift piers
  const rng = ctx.rng('brg-yel-deck');
  const texDeck = ctx.tex.draw(256, 256, (g, w, h) => {                                      // silver-grey weathered boards 0.15 m wide laid along the bridge, butt joints staggered (photos 05 06 07); tile 1.0 (along) x 1.5 m (across)
    const rows = 10, rh = h / rows;
    for (let j = 0; j < rows; j++) {
      const k = 0.9 + rng() * 0.16, r0 = 168 * k, g0 = 160 * k, b0 = 146 * k;
      g.fillStyle = `rgb(${Math.round(r0)},${Math.round(g0)},${Math.round(b0)})`; g.fillRect(0, j * rh, w, rh - 1.5);
      g.fillStyle = 'rgba(70,64,54,0.55)'; g.fillRect(0, j * rh + rh - 2, w, 2);
      g.fillStyle = 'rgba(90,82,70,0.22)'; for (let s2 = 0; s2 < 5; s2++) g.fillRect(rng() * w, j * rh + rng() * (rh - 3), 30 + rng() * 80, 1.2);
      g.fillStyle = 'rgba(60,54,46,0.6)'; g.fillRect((j * 97) % w, j * rh, 2, rh - 1.5);
    }
  }, { key: 'brg-yel-deck', repeat: [1, 1], anisotropy: 8 });
  const deckMat = TM('#d0cabc', { map: texDeck, paint: 0.05, name: 'brg-yel-deck' });
  const steel = M.steel, black = M.ironBlack;
  const world = (u, v) => toWorld(sp, u, v);
  const B = { id: sp.id, x: f.cx, z: f.cz, yDeck, info: { rails: 0, colliders: 0, pier: PIERS.length - 2 }, masts: [] };
  B.at = sp.at; B.bounds = frameBounds(sp, -HL - 4, HL + 4, -HW - 4, HW + 4, 2);
  B.deckAt = (x, z) => { const q = toUV(sp, x, z); return Math.abs(q.v) <= HW + 0.05 && Math.abs(q.u) <= HL + 0.3 ? yDeck(q.u) : null; };
  const yb = waterY - 0.2;

  // the bank lines along the axis (first / last wet sample): the abutment faces and the wing walls start there
  const wetAt = (u, v = 0) => { const w = world(u, v); return !!(L.waterwayAt ? L.waterwayAt(w.x, w.z) : L.inRiver(w.x, w.z)); };
  let bank0 = -HL + 4, bank1 = HL - 4;
  { let a = null, b = null; for (let u = -HL - 8; u <= HL + 8; u += 0.25) if (wetAt(u)) { if (a === null) a = u; b = u; } if (a !== null) { bank0 = a; bank1 = b; } }
  B.info.bank = [+bank0.toFixed(2), +bank1.toFixed(2)];

  P.push(f.cx, 0, f.cz, -T);
  // ------------------------------------------------------------------------------------------ deck, fascia, girders
  const nodes = [];                                                                // u nodes: every pier + subdivisions of <= 3.3 m
  for (let i = 0; i + 1 < PIERS.length; i++) { const a = PIERS[i], b = PIERS[i + 1], n = Math.max(1, Math.ceil((b - a) / 3.3)); for (let k = 0; k < n; k++) nodes.push(a + (b - a) * k / n); }
  nodes.push(HL);
  const liftA = PIERS[YEL.lift], liftB = PIERS[YEL.lift + 1];
  const inLift = (u) => u >= liftA - 1.2 && u <= liftB + 1.2;
  const depthOf = (u) => (u > liftA + 0.01 && u < liftB - 0.01) ? 1.45 : 0.85;       // the bascule leaf is deeper (photos 10 11)
  for (let i = 0; i + 1 < nodes.length; i++) {
    const u0 = nodes[i], u1 = nodes[i + 1], y0 = yDeck(u0), y1 = yDeck(u1), d = depthOf((u0 + u1) / 2);
    P.quad(deckMat, [u0, y0, -HW], [u1, y1, -HW], [u1, y1, HW], [u0, y0, HW], [0, 1, 0], [[u0 / 1.0, -HW / 1.5], [u1 / 1.0, -HW / 1.5], [u1 / 1.0, HW / 1.5], [u0 / 1.0, HW / 1.5]]);
    for (const sg of [-1, 1]) {                                                 // the fascia plates (grey-blue steel) with a 0.2 m timber edge curb on top
      const v = sg * HW;
      P.quad(steel, [u0, y0 - d, v], [u1, y1 - d, v], [u1, y1, v], [u0, y0, v], [0, 0, sg], [[u0 / 2.4, -d / 2.4], [u1 / 2.4, -d / 2.4], [u1 / 2.4, 0], [u0 / 2.4, 0]]);
      P.quad(steel, [u0, y0, v - sg * 0.02], [u1, y1, v - sg * 0.02], [u1, y1 + 0.2, v - sg * 0.02], [u0, y0 + 0.2, v - sg * 0.02], [0, 0, -sg]);
      P.quad(steel, [u0, y0 + 0.2, v], [u1, y1 + 0.2, v], [u1, y1 + 0.2, v - sg * 0.22], [u0, y0 + 0.2, v - sg * 0.22], [0, 1, 0]);
    }
    P.quad(steel, [u0, y0 - 0.14, -HW], [u0, y0 - 0.14, HW], [u1, y1 - 0.14, HW], [u1, y1 - 0.14, -HW], [0, -1, 0]);        // the soffit under the planks
  }
  // the I beams under the fixed spans (9 per span, 1.7 m apart): web faces + lower flange, chords between the pier caps
  for (let s = 0; s < YEL.spans.length; s++) {
    if (s === YEL.lift) continue;
    const ua = PIERS[s] + 0.1, ub = PIERS[s + 1] - 0.1, ya = yDeck(ua) - 0.16, yb2 = yDeck(ub) - 0.16, h = 0.62;
    for (let k = -3; k <= 3; k++) {
      const v = k * 1.7;
      for (const sg of [-1, 1]) P.quad(steel, [ua, ya - h, v + sg * 0.025], [ub, yb2 - h, v + sg * 0.025], [ub, yb2, v + sg * 0.025], [ua, ya, v + sg * 0.025], [0, 0, sg]);
      P.quad(steel, [ua, ya - h, v - 0.13], [ub, yb2 - h, v - 0.13], [ub, yb2 - h, v + 0.13], [ua, ya - h, v + 0.13], [0, -1, 0]);
    }
  }
  // the bascule leaf: four deep plate girders under a dark soffit (photos 10 11 13)
  { const ua = liftA + 0.9, ub = liftB - 0.9, ya = yDeck(ua) - 0.14, yb2 = yDeck(ub) - 0.14, h = 1.31;
    for (const v of [-5.6, -1.9, 1.9, 5.6]) { for (const sg of [-1, 1]) P.quad(steel, [ua, ya - h, v + sg * 0.03], [ub, yb2 - h, v + sg * 0.03], [ub, yb2, v + sg * 0.03], [ua, ya, v + sg * 0.03], [0, 0, sg]); P.quad(steel, [ua, ya - h, v - 0.2], [ub, yb2 - h, v - 0.2], [ub, yb2 - h, v + 0.2], [ua, ya - h, v + 0.2], [0, -1, 0]); }
    P.quad(steel, [ua, ya - h, -HW], [ua, ya - h, HW], [ub, yb2 - h, HW], [ub, yb2 - h, -HW], [0, -1, 0]);
  }
  // ------------------------------------------------------------------------------------------ the piers
  const beam = (a, b, w, mat) => P.cyl(mat, a, b, w / 2, w / 2, 4, false);
  const towers = [];
  const timberPier = (u0) => {
    const topY = yDeck(u0) - 0.16 - 0.62, capH = 0.42, yt = topY - capH, yTopPlat = waterY + 0.38;
    P.box(timber, u0 - 2.15, u0 + 2.15, waterY - 0.12, yTopPlat, -HW + 0.15, HW - 0.15, 'b', 1.6);                  // the grillage platform on the pile heads
    for (const du of [-0.85, 0.85]) {
      const ur = u0 + du;
      for (let k = -4; k <= 4; k++) P.box(timber, ur - 0.15, ur + 0.15, yTopPlat, yt, k * 1.7 - 0.15, k * 1.7 + 0.15, 'tb', 1.2);          // the posts
      P.box(timber, ur - 0.3, ur + 0.3, yt, topY, -HW + 0.4, HW - 0.4, '', 1.4);                                                          // the cap beam under the girders
      P.box(timber, ur - 0.17, ur + 0.17, yTopPlat + (yt - yTopPlat) * 0.5 - 0.1, yTopPlat + (yt - yTopPlat) * 0.5 + 0.1, -7.1, 7.1, '', 1.4);   // the waling
      for (let k = -4; k < 4; k++) {                                                                                                      // X bracing between the posts, on both faces of the row
        const va = k * 1.7, vb = (k + 1) * 1.7;
        for (const so of [-1, 1]) { beam([ur + so * 0.18, yTopPlat + 0.1, va], [ur + so * 0.18, yt - 0.1, vb], 0.15, timber); beam([ur + so * 0.18, yTopPlat + 0.1, vb], [ur + so * 0.18, yt - 0.1, va], 0.15, timber); }
      }
    }
    for (let k = -4; k <= 4; k++) for (const so of [-1, 1]) beam([u0 + so * 0.85, yt - 0.35, k * 1.7], [u0 + so * 2.05, yTopPlat + 0.05, k * 1.7], 0.24, timber);      // the inclined struts (photo 01)
  };
  const liftTower = (u0) => {                                                         // the steel frame piers of the bascule span: pale grey boxes with dark panel windows and a ladder (photos 02 04 13)
    const ytop = yDeck(u0) - 0.16, yTopPlat = waterY + 0.4, hw = HW - 0.25;
    P.box(timber, u0 - 2.15, u0 + 2.15, waterY - 0.12, yTopPlat, -HW + 0.15, HW - 0.15, 'b', 1.6);
    P.box(white, u0 - 1.0, u0 + 1.0, yTopPlat, ytop, -hw, hw, 'b', 2.0);
    for (const sw of [-1, 1]) for (const k of [-1, 0, 1]) { const v = k * 4.5, x = u0 + sw * 1.012; P.quad(steel, [x, yTopPlat + 0.6, v - 1.5], [x, yTopPlat + 0.6, v + 1.5], [x, ytop - 0.6, v + 1.5], [x, ytop - 0.6, v - 1.5], [sw, 0, 0]); }    // the dark panel windows of the frame
    for (const sw of [-1, 1]) for (const sv of [-1, 1]) { P.cyl(white, [u0 + sw * 1.15, yTopPlat, sv * (hw - 0.4)], [u0 + sw * 1.15, ytop, sv * (hw - 0.4)], 0.035, 0.035, 4, false); P.cyl(white, [u0 + sw * 1.15, yTopPlat, sv * (hw - 0.75)], [u0 + sw * 1.15, ytop, sv * (hw - 0.75)], 0.035, 0.035, 4, false); }
    towers.push(u0);
  };
  for (let i = 1; i < PIERS.length - 1; i++) { if (i === YEL.lift || i === YEL.lift + 1) liftTower(PIERS[i]); else timberPier(PIERS[i]); }
  // the abutments: timber-clad faces at the bank lines (under the first / last 1.3 m of the deck) and at the deck ends
  for (const [ub, dir] of [[bank0, 1], [bank1, -1]]) {
    const ua = dir > 0 ? ub - 0.05 : ub - 1.3, uc = dir > 0 ? ub + 1.3 : ub + 0.05;
    P.box(timber, ua, uc, yb - 0.1, yDeck(ub) - 0.16, -HW + 0.1, HW - 0.1, 'b', 1.4);
  }
  // ------------------------------------------------------------------------------------------ pile clusters (grey steel pipe piles up / down stream of every pier, photos 01 07 10)
  for (let i = 1; i < PIERS.length - 1; i++) for (const sg of [-1, 1]) {
    const u0 = PIERS[i], v0 = sg * (HW + 2.2), top = waterY + (i === YEL.lift || i === YEL.lift + 1 ? 3.2 : 2.6);
    for (const [du, dv] of [[0, 0], [0.5, 0.3], [-0.5, 0.3]]) { P.cyl(steel, [u0 + du, waterY - 0.15, v0 + dv * sg], [u0 + du, top, v0 + dv * sg], 0.22, 0.22, 7, true); }
    P.cyl(black, [u0, top - 0.5, v0 + 0.06], [u0, top - 0.42, v0 + 0.06], 0.52, 0.52, 7, false);
  }
  // ------------------------------------------------------------------------------------------ expansion joints at the ends of the planks (photo 06)
  for (const u of [-HL + 0.4, HL - 0.4, liftA - 0.12, liftB + 0.12]) P.quad(steel, [u - 0.12, yDeck(u) + 0.012, -HW], [u + 0.12, yDeck(u) + 0.012, -HW], [u + 0.12, yDeck(u) + 0.012, HW], [u - 0.12, yDeck(u) + 0.012, HW], [0, 1, 0]);
  // ------------------------------------------------------------------------------------------ the railing: white rods + posts every ~2 m + a round handrail, a pale-blue 2.4 m bar fence beside the bascule span
  const RAIL_V = HW - 0.14, nb = Math.round(2 * (HL - 0.4) / 2.0), bw = 2 * (HL - 0.4) / nb;
  for (const sg of [-1, 1]) {
    const v = sg * RAIL_V;
    for (let i = 0; i < nb; i++) {
      const ua = -HL + 0.4 + bw * i, ub = ua + bw, w = world(ua + 0.06, v);
      rails.add({ kind: 'plainrods', hex: '#eef2f3', x: w.x, y: yDeck(ua) + 0.24, z: w.z, rotY: -T, roll: Math.atan((yDeck(ub) - yDeck(ua)) / bw), len: bw - 0.12, h: 0.9 }); B.info.rails++;
      P.cyl(white, [ua, yDeck(ua) + 1.16, v], [ub, yDeck(ub) + 1.16, v], 0.032, 0.032, 5, false);                                              // the round handrail
    }
    for (let i = 0; i <= nb; i++) { const u = -HL + 0.4 + bw * i, y = yDeck(u) + 0.2; P.cyl(white, [u, y, v], [u, y + 0.98, v], 0.055, 0.05, 6, false); P.cyl(white, [u, y + 0.98, v], [u, y + 1.0, v], 0.07, 0.07, 6, true); }
    // the pale-blue bar fence of the bascule span: 0.3 m bars up to 2.4 m between two flat rails
    const fa = liftA + 1.1, fb = liftB - 1.1, nf = Math.round((fb - fa) / 2.0), fw = (fb - fa) / nf, fv = sg * (HW - 0.02);
    for (let i = 0; i < nf; i++) { const ua = fa + fw * i, w = world(ua + 0.05, fv); rails.add({ kind: 'plainrods', hex: '#b5ced9', x: w.x, y: yDeck(ua) + 0.2, z: w.z, rotY: -T, roll: Math.atan((yDeck(ua + fw) - yDeck(ua)) / fw), len: fw - 0.1, h: 2.3 }); B.info.rails++; }
    for (let i = 0; i <= nf; i++) { const u = fa + fw * i, y = yDeck(u) + 0.2; P.box(white, u - 0.05, u + 0.05, y, y + 2.45, fv - 0.05, fv + 0.05, 'b', 1); }
  }
  // ------------------------------------------------------------------------------------------ lamp standards: a pair every ~22 m (round pale pole, ball top, arched arm, clear hemisphere under a cast cap; photos 05 07 12)
  const LAMP_U = [-62, -41, -20, 1, 22, 43, 64].map((a) => a - 0.3);
  const hemi = new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), ball = new THREE.SphereGeometry(1, 7, 5);
  const lampPts = [], lampH = 6.2;
  for (const u0 of LAMP_U) for (const sg of [-1, 1]) {
    const v0 = sg * (HW - 0.65), y0 = yDeck(u0) + 0.2, dv = -sg;
    P.cyl(white, [u0, y0, v0], [u0, y0 + 0.5, v0], 0.16, 0.12, 8, true);
    P.cyl(white, [u0, y0 + 0.5, v0], [u0, y0 + lampH, v0], 0.095, 0.07, 8, false);
    P.geo(white, ball, u0, y0 + lampH + 0.1, v0, 0, 0, 0, 0.12, 0.12, 0.12);
    const arm = [[0, -0.05], [0.18, 0.3], [0.5, 0.42], [0.85, 0.3], [1.05, 0.0]];
    for (let k = 0; k + 1 < arm.length; k++) P.cyl(white, [u0, y0 + lampH - 0.2 + arm[k][1], v0 + dv * arm[k][0]], [u0, y0 + lampH - 0.2 + arm[k + 1][1], v0 + dv * arm[k + 1][0]], 0.034, 0.034, 5, false);
    const gx = v0 + dv * 1.05, gy = y0 + lampH - 0.2;
    P.cyl(white, [u0, gy - 0.02, gx], [u0, gy - 0.3, gx], 0.04, 0.04, 5, false);
    P.cyl(white, [u0, gy - 0.3, gx], [u0, gy - 0.55, gx], 0.07, 0.23, 8, false);
    P.geo(M.lampGlass, hemi, u0, gy - 0.55, gx, 0, 0, 0, 0.22, 0.2, 0.22);
    const w = world(u0, v0); lampPts.push({ x: w.x, z: w.z, y: y0, h: lampH }); B.masts.push({ x: w.x, y: y0, z: w.z, h: lampH, kind: 'lamp', id: sp.id });
  }
  // the name plate: a dark pole beside the bascule span, blue enamel plate "2-й ЕЛАГИН МОСТ" facing the walkway (photos 06 16)
  const plateM = M.namePlate ? M.namePlate('2-й ЕЛАГИН МОСТ') : null;
  const platePts = [];
  for (const sg of [-1, 1]) {
    const u0 = liftB + 2.4, v0 = sg * (HW - 0.55), y0 = yDeck(u0) + 0.2;
    P.cyl(black, [u0, y0, v0], [u0, y0 + 3.0, v0], 0.04, 0.04, 6, false);
    if (plateM) for (const sv of [-1, 1]) { const z = v0 + sv * 0.03; P.quad(plateM, [u0 - sv * 0.45, y0 + 2.55, z], [u0 + sv * 0.45, y0 + 2.55, z], [u0 + sv * 0.45, y0 + 2.95, z], [u0 - sv * 0.45, y0 + 2.95, z], [0, 0, sv]); }
    platePts.push(world(u0, v0));
  }
  // ------------------------------------------------------------------------------------------ bollards across both mouths (pedestrian bridge: OSM bollard n1231935214 + gate / wicket gate at the Krestovsky end)
  const bollards = [];
  for (const su of [-1, 1]) for (let k = -4; k <= 4; k++) {
    const u = su * (HL - 1.1), v = k * 1.5, y0 = yDeck(u) + 0.0;
    P.cyl(steel, [u, y0, v], [u, y0 + 0.82, v], 0.09, 0.09, 6, true); P.cyl(white, [u, y0 + 0.62, v], [u, y0 + 0.76, v], 0.095, 0.095, 6, false);
    bollards.push(world(u, v));
  }
  // ------------------------------------------------------------------------------------------ the quay opening beside the abutments: granite wings along the bank line + a collider (closeBank, as foot3.js)
  const openLen = (sg, u0, dir) => {
    const zs = env.zones || []; if (!zs.length) return 1.6;
    let last = -1;
    for (let k = 0; k <= 16; k++) { const v = sg * (HW + k * 0.5), ub = bankU(L, sp, v, u0, dir); if (ub === null) break; const w = world(ub - dir * 0.25, v); if (zs.some((z) => z.test(w.x, w.z, 0.15))) last = k; }
    return last < 0 ? 1.6 : Math.min(9, Math.max(1.6, (last + 1) * 0.5 + 1.0));
  };
  const wings = [];
  for (const [dir, u0] of [[1, bank0], [-1, bank1]]) for (const sg of [-1, 1]) { const len = openLen(sg, u0, dir); wings.push({ u: u0, dir, sg, len }); closeBank({ site: sp, P, M, L, u: u0, dir, sg, v0: HW + 0.05, len, yTop: 0.05, yb, mat: M.granitePink || M.granite, parapet: M.parapetPink || M.parapet, collide: false }); }
  B.info.wings = wings.map((w) => w.len);
  P.pop();
  B.info.buckets = P.b.size; B.info.tris = P.tris;                          // meshes (one per material) and triangles of this bridge
  if (ctx.services) ctx.services.yelagin2 = { info: B.info, spec: sp };                         // read by tools/yelagin-bridge-test.mjs

  // ------------------------------------------------------------------------------------------ colliders
  B.colliders = () => {
    const ph = ctx.physics, rampRot = Math.atan2(f.c, f.s), m = Math.ceil((LEN + 0.6) / 4);
    for (let i = 0; i < m; i++) { const u0 = -HL - 0.3 + (LEN + 0.6) * i / m, u1 = -HL - 0.3 + (LEN + 0.6) * (i + 1) / m, w = world((u0 + u1) / 2, 0); ph.addWalkRamp(w.x, w.z, 2 * HW - 0.1, u1 - u0 + 0.04, rampRot, yDeck(u0), yDeck(u1), 2.5); B.info.colliders++; }
    for (const sg of [-1, 1]) {
      const nR = Math.ceil(LEN / 7);
      for (let i = 0; i < nR; i++) { const u0 = -HL + LEN * i / nR, u1 = -HL + LEN * (i + 1) / nR, w = world((u0 + u1) / 2, sg * (HW - 0.1)); ph.addBox(w.x, w.z, u1 - u0 + 0.05, 0.28, -T, -6, Math.max(yDeck(u0), yDeck(u1)) + 1.2); B.info.colliders++; }
    }
    for (const w of lampPts) { ph.addCylinder(w.x, w.z, 0.14, -0.5, w.y + w.h); B.info.colliders++; }
    for (const w of platePts) { ph.addCylinder(w.x, w.z, 0.06, -0.5, 4); B.info.colliders++; }
    for (const w of bollards) { ph.addCylinder(w.x, w.z, 0.11, -0.5, 1.6); B.info.colliders++; }
    for (const w of wings) B.info.colliders += closeBank({ site: sp, L, ph, u: w.u, dir: w.dir, sg: w.sg, v0: HW - 0.3, len: w.len, yTop: 0.05, draw: false });
  };
  return B;
}
void toUV;
