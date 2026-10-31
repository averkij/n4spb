// landmarksAurora/ship.js - the cruiser AURORA at her eternal mooring (OSM r3272566; docs/research/aurora.md section 2; photos 01 03 04 08 09 17 29, drawing 11).
// As she looks since the 2014-16 refit: ALL GREY (hull, funnels, masts, cowls), green boot-topping with a white line, teak decks, cream canvas dodgers on the bridge; NO flags (bare staffs).
// Ship frame (frame.js SHIP, hull.js): x = station s (bow +63.4), y above the water line, z = +starboard (the quay side).  The frame is pushed to the water level of the environment
// (`L.waterLevelAt` at the berth, else -3.4), so the ship floats as soon as the Bolshaya Nevka is water.
//   hull + decks (hull.js) · boiler casing, three funnels (s 0.2 / 11.8 / 23.5, tops 23.5 m), 20 cowl ventilators · bridge at the fore mast (conning tower, chart house, wings with canvas dodgers)
//   · fore mast (s 28.5: search-light platform, fighting top, yard, truck 39 m) and main mast (s -27.7: platform, yard, gaff, truck 43.5 m) with the standing rigging as ctx.wires
//   · fourteen 152 mm guns with box shields (bow, stern, six a side on half-round sponsons) · eight boats on curved davits · Hall anchors, hawse rings, bow stars, stern name
//   · guard rails, port holes (instanced) · the gangway to the quay platform with the banner, the port accommodation ladder, two spacer booms with dolphins, four red-and-white mooring
//   barrels on white chains · the ticket pavilion on the platform (w486091825) · colliders (the ship is closed: solid).
import * as THREE from 'three';
import * as L from '../layout.js';
import { tube } from '../lib/figures.js';
import { SHIP, shipWaterY, shipAfloat, TICKET_ID, STELE, pairs } from './frame.js';
import { buildHull, half, topY, deckY, hullPt, UD, FC, BULWARK, BREAK, AFT_END, STERN } from './hull.js';
import { partsGeos, addInstanced } from './inst.js';

const FUNNELS = [0.2, 11.8, 23.5], FORE = 28.5, MAIN = -27.7, FUN_TOP = 23.5, FORE_TOP = 39, MAIN_TOP = 43.5;
const SIDE_GUNS = [34.3, 25.5, 15.5, -13.5, -28.5, -40.5];
const GANG_S = -32.5;                                                    // station of the gangway (OSM pier w518595697)
const TAU = Math.PI * 2;

export function build(K) {
  const { ctx, M, P, svc, root } = K, ph = ctx.physics;
  const WY = shipWaterY(), QY = -WY;                                    // QY = the quay top (street level) in the ship frame
  const W = (s, y, t) => [SHIP.x + SHIP.ax[0] * s + SHIP.zx[0] * t, WY + y, SHIP.z + SHIP.ax[1] * s + SHIP.zx[1] * t];
  const wire = (pts, width = 0.035, color = '#3d444c') => { if (ctx.wires) ctx.wires.add(pts.map((p) => W(p[0], p[1], p[2])), { width, color }); };
  const tub = (mat, path, rad, o = {}) => { const g = tube(path, rad, { seg: 8, per: 3, ...o }); P.geo(mat, g); g.dispose(); };
  const H = buildHull();
  svc.ship = { x: SHIP.x, z: SHIP.z, rot: SHIP.rot, waterY: WY, afloat: shipAfloat(), loa: SHIP.LOA, beam: SHIP.beam };

  P.push(SHIP.x, WY, SHIP.z, SHIP.rot);
  try {
    // ================================================================== hull, decks
    for (const g of H.boot) { P.geo(M.boot, g); g.dispose(); }
    for (const g of H.line) { P.geo(M.white, g); g.dispose(); }
    for (const g of H.plate) { P.geo(M.hull, g); g.dispose(); }
    for (let i = 0; i + 1 < H.cols.length; i++) {
      const a = H.cols[i], b = H.cols[i + 1]; if (b - a < 0.05) continue;
      const ya = deckY(a + 0.02), yb = deckY(b - 0.02), ha = Math.max(0.02, half(a, ya) - 0.08), hb = Math.max(0.02, half(b, yb) - 0.08);
      P.quad(M.deck, [a, ya, ha], [b, yb, hb], [b, yb, -hb], [a, ya, -ha], [0, 1, 0], [[a / 2.4, ha / 2.4], [b / 2.4, hb / 2.4], [b / 2.4, -hb / 2.4], [a / 2.4, -ha / 2.4]]);
    }
    { const h0 = half(BREAK, UD), h1 = half(BREAK, FC); P.quad(M.grey, [BREAK, UD, h0], [BREAK, UD, -h0], [BREAK, FC, -h1], [BREAK, FC, h1], [-1, 0, 0]);          // the forecastle break bulkhead
      for (const t of [-2.6, 2.6]) P.box(M.greyDark, BREAK - 0.06, BREAK, UD + 0.1, UD + 2.0, t - 0.4, t + 0.4, 'r'); }

    // ================================================================== deck houses, bridge
    P.box(M.grey, -4.5, 27, UD, 8.1, -2.4, 2.4, 'b');                                                       // the boiler casing the funnels and cowls stand on
    for (let s = -3; s < 26; s += 3.6) for (const sd of [-1, 1]) P.box(M.port, s, s + 0.9, 6.9, 7.5, sd * 2.4 - 0.03, sd * 2.4 + 0.03, 'tb');
    P.box(M.grey, 25, 33.4, UD, 9.1, -3.1, 3.1, 'b');                                                      // the house under the bridge
    P.box(M.grey, 25.8, 32.4, 9.1, 9.25, -7.9, 7.9, '');                                                    // the bridge deck across the beam
    P.quad(M.deck, [25.8, 9.26, 7.9], [32.4, 9.26, 7.9], [32.4, 9.26, -7.9], [25.8, 9.26, -7.9], [0, 1, 0], [[0, 0], [2.7, 0], [2.7, 6.5], [0, 6.5]]);
    for (const sd of [-1, 1]) {                                                                            // wings: canvas dodgers, stanchions, lifebuoys, search lights
      P.box(M.canvas, 25.8, 32.4, 9.25, 10.2, sd * 7.9 - 0.04, sd * 7.9 + 0.04, 'b');
      for (const s of [25.8, 32.4]) P.box(M.canvas, s - 0.04, s + 0.04, 9.25, 10.2, Math.min(sd * 3.2, sd * 7.9), Math.max(sd * 3.2, sd * 7.9), 'b');
      for (const s of [26.2, 29.1, 32]) P.cyl(M.grey, [s, UD, sd * 7.55], [s, 9.1, sd * 7.55], 0.07, 0.07, 5, false);
      for (const s of [27.4, 30.8]) { const g = new THREE.TorusGeometry(0.31, 0.075, 6, 12); P.geo(M.red, g, s, 9.74, sd * 7.99, 0, 0, 0); g.dispose(); P.box(M.white, s - 0.09, s + 0.09, 9.37, 10.11, sd * 7.97, sd * 8.03, ''); }
      P.cyl(M.grey, [29.1, 9.25, sd * 7.2], [29.1, 10.5, sd * 7.2], 0.09, 0.09, 6, false);
      P.cyl(M.greyDark, [28.75, 10.85, sd * 7.2], [29.45, 10.85, sd * 7.2], 0.36, 0.36, 10, true); P.cyl(M.brass, [29.46, 10.85, sd * 7.2], [29.48, 10.85, sd * 7.2], 0.3, 0.3, 10, true);
    }
    P.col(M.grey, 31.3, 0, 9.25, 11.25, 1.5, 1.5, 16, false); P.col(M.greyDark, 31.3, 0, 10.55, 10.8, 1.53, 1.53, 16, false); P.col(M.grey, 31.3, 0, 11.25, 11.42, 1.75, 1.6, 16, true);   // conning tower with its mushroom roof
    P.box(M.grey, 26.2, 29.5, 9.25, 11.5, -1.7, 1.7, 'b');                                                  // chart / wheel house
    for (const [x0, x1, z0, z1, sk] of [[26.6, 29.1, 1.71, 1.73, 'tb'], [26.6, 29.1, -1.73, -1.71, 'tb'], [29.51, 29.53, -1.3, 1.3, 'tb']]) P.box(M.port, x0, x1, 10.3, 11.05, z0, z1, sk);
    P.box(M.grey, 25.8, 33.0, 11.5, 11.62, -3.3, 3.3, '');                                                  // the upper bridge
    P.quad(M.deck, [25.8, 11.63, 3.3], [33, 11.63, 3.3], [33, 11.63, -3.3], [25.8, 11.63, -3.3], [0, 1, 0], [[0, 0], [3, 0], [3, 2.7], [0, 2.7]]);
    for (const sd of [-1, 1]) P.box(M.canvas, 25.8, 33, 11.62, 12.55, sd * 3.3 - 0.04, sd * 3.3 + 0.04, 'b');
    P.box(M.canvas, 32.96, 33.04, 11.62, 12.55, -3.3, 3.3, 'b'); P.box(M.canvas, 25.76, 25.84, 11.62, 12.55, -3.3, 3.3, 'b');
    P.col(M.brass, 31.2, 0, 11.62, 12.7, 0.2, 0.16, 8, true); P.col(M.greyDark, 31.2, 0, 12.7, 12.95, 0.26, 0.2, 8, true);   // compass binnacle
    for (const t of [-2.6, 2.6]) { const g = new THREE.TorusGeometry(0.31, 0.075, 6, 12); P.geo(M.red, g, 33.06, 12.1, t, 0, Math.PI / 2, 0); g.dispose(); }
    // aft bridge at the main mast
    P.box(M.grey, -30.4, -25.4, UD, 9.0, -1.8, 1.8, 'b');
    P.box(M.grey, -31.6, -24.2, 9.0, 9.15, -6.4, 6.4, '');
    P.quad(M.deck, [-31.6, 9.16, 6.4], [-24.2, 9.16, 6.4], [-24.2, 9.16, -6.4], [-31.6, 9.16, -6.4], [0, 1, 0], [[0, 0], [3, 0], [3, 5.3], [0, 5.3]]);
    for (const sd of [-1, 1]) {
      for (let k = 0; k <= 4; k++) P.cyl(M.grey, [-31.6 + k * 1.85, 9.15, sd * 6.35], [-31.6 + k * 1.85, 10.2, sd * 6.35], 0.025, 0.025, 4, false);
      for (const dy of [0.55, 1.05]) { wire([[-31.6, 9.15 + dy, sd * 6.35], [-24.2, 9.15 + dy, sd * 6.35]], 0.02, '#59616b'); for (const s of [-31.6, -24.2]) wire([[s, 9.15 + dy, sd * 6.35], [s, 9.15 + dy, sd * 1.9]], 0.02, '#59616b'); }
      for (const s of [-31.2, -27.9, -24.6]) P.cyl(M.grey, [s, UD, sd * 6.1], [s, 9.0, sd * 6.1], 0.07, 0.07, 5, false);
      P.cyl(M.grey, [-27.9, 9.15, sd * 5.4], [-27.9, 10.3, sd * 5.4], 0.09, 0.09, 6, false);
      P.cyl(M.greyDark, [-28.25, 10.65, sd * 5.4], [-27.55, 10.65, sd * 5.4], 0.36, 0.36, 10, true);
    }
    // skylights, hatches, capstans
    for (const [x0, x1, hw, h] of [[-37.5, -35, 1.1, 0.8], [-47, -44.6, 1.0, 0.7], [-19.5, -17, 1.3, 0.9], [41.5, 43.6, 1.0, 0.7]]) { const y = deckY((x0 + x1) / 2); P.box(M.grey, x0, x1, y, y + h, -hw, hw, 'b'); P.box(M.port, x0 + 0.25, x1 - 0.25, y + h, y + h + 0.03, -hw + 0.2, hw - 0.2, 'b'); }
    for (const [s, r] of [[55.5, 0.55], [-57, 0.45]]) { const y = deckY(s); P.col(M.greyDark, s, 0, y, y + 0.75, r, r * 0.7, 10, true); P.col(M.greyDark, s, 0, y + 0.75, y + 0.9, r * 1.15, r * 1.15, 10, true); }

    // ================================================================== funnels
    for (const sf of FUNNELS) {
      P.col(M.grey, sf, 0, 8.1, 10.3, 1.95, 1.85, 20, false); P.col(M.grey, sf, 0, 10.3, 10.45, 1.85, 1.55, 20, false);
      P.col(M.grey, sf, 0, 10.45, 21.6, 1.55, 1.55, 20, false);
      P.col(M.greyDark, sf, 0, 21.6, FUN_TOP, 1.57, 1.57, 20, false);
      P.col(M.greyDark, sf, 0, FUN_TOP - 0.22, FUN_TOP, 1.68, 1.68, 20, true);
      P.col(M.grey, sf, 0, 16.2, 16.36, 1.6, 1.6, 20, false);
      P.fan(M.mouth, Array.from({ length: 16 }, (_, i) => [sf + Math.cos(i / 16 * TAU) * 1.45, FUN_TOP + 0.01, Math.sin(-i / 16 * TAU) * 1.45]), [0, 1, 0]);
      P.cyl(M.grey, [sf + 1.72, 9, 0], [sf + 1.72, 22.6, 0], 0.11, 0.11, 6, true);                         // steam pipe on the fore side
      for (const [dx, dz] of [[4.6, 2.2], [4.6, -2.2], [-4.6, 2.2], [-4.6, -2.2]]) wire([[sf + Math.sign(dx) * 1.1, 17.5, Math.sign(dz) * 1.1], [sf + dx, 8.15, dz]], 0.03);
    }

    // ================================================================== cowl ventilators (mouths toward the bow)
    const COWLS = [];
    for (const sf of FUNNELS) for (const sd of [-1, 1]) { COWLS.push([sf + 3.5, sd * 1.75, 8.1, 14.0, 0.55]); COWLS.push([sf - 3.3, sd * 1.75, 8.1, 13.1, 0.5]); }
    for (const sd of [-1, 1]) COWLS.push([-8.5, sd * 2.3, UD, 11.6, 0.45], [-20.5, sd * 1.7, UD, 10.4, 0.4], [44.5, sd * 1.9, FC + 0.1, 11.6, 0.36], [-39.5, sd * 2.6, UD, 9.4, 0.34]);
    for (const [s, t, y0, h, r] of COWLS) {
      tub(M.grey, [[s, y0, t], [s, h - 1.5, t], [s + 0.1, h - 0.82, t], [s + 0.48, h - 0.42, t], [s + 1.0, h - 0.36, t]], [r, r, r * 1.05, r * 1.3, r * 1.8], { seg: 10, per: 4, cap: false });
      const g = new THREE.CircleGeometry(r * 1.62, 12); P.geo(M.mouth, g, s + 0.93, h - 0.365, t, 0, Math.PI / 2, 0); g.dispose();
    }

    // ================================================================== masts, yards, rigging
    // fore mast
    P.cyl(M.grey, [FORE, UD, 0], [FORE, 26.5, 0], 0.42, 0.3, 12, false); P.cyl(M.grey, [FORE, 25.5, 0], [FORE, FORE_TOP, 0], 0.17, 0.07, 8, true);
    P.col(M.grey, FORE, 0, 23.2, 25.3, 1.35, 1.35, 14, false); P.col(M.grey, FORE, 0, 23.05, 23.2, 1.1, 1.38, 14, true); P.col(M.greyDark, FORE, 0, 25.3, 25.42, 1.42, 1.42, 14, true);   // the fighting top
    P.box(M.grey, FORE + 0.3, FORE + 2.6, 17.1, 17.22, -1.2, 1.2, '');                                    // search-light platform on the fore side
    P.cyl(M.grey, [FORE + 1.7, 17.22, 0], [FORE + 1.7, 18.0, 0], 0.08, 0.08, 6, false); P.cyl(M.greyDark, [FORE + 1.35, 18.35, 0], [FORE + 2.1, 18.35, 0], 0.4, 0.4, 10, true); P.cyl(M.brass, [FORE + 2.11, 18.35, 0], [FORE + 2.13, 18.35, 0], 0.33, 0.33, 10, true);
    for (const t of [-1.2, 1.2]) for (const s of [FORE + 0.3, FORE + 2.6]) P.cyl(M.grey, [s, 17.22, t], [s, 18.2, t], 0.03, 0.03, 4, false);
    tub(M.grey, [[FORE + 0.3, 26.9, -9.5], [FORE + 0.3, 26.9, -4], [FORE + 0.3, 26.9, 4], [FORE + 0.3, 26.9, 9.5]], [0.05, 0.11, 0.11, 0.05], { seg: 6, per: 2 });
    // main mast
    P.cyl(M.grey, [MAIN, UD, 0], [MAIN, 28, 0], 0.4, 0.27, 12, false); P.cyl(M.grey, [MAIN, 27, 0], [MAIN, MAIN_TOP, 0], 0.16, 0.06, 8, true);
    P.col(M.grey, MAIN, 0, 20.4, 20.55, 1.3, 1.3, 12, true); P.col(M.grey, MAIN, 0, 20.55, 21.5, 1.3, 1.3, 12, false);
    tub(M.grey, [[MAIN - 0.3, 25.2, -8.5], [MAIN - 0.3, 25.2, -3.5], [MAIN - 0.3, 25.2, 3.5], [MAIN - 0.3, 25.2, 8.5]], [0.05, 0.1, 0.1, 0.05], { seg: 6, per: 2 });
    tub(M.grey, [[MAIN - 0.3, 21.8, 0], [MAIN - 5.5, 25.6, 0], [MAIN - 10.4, 29.2, 0]], [0.1, 0.08, 0.04], { seg: 6, per: 2 });                                             // the gaff
    P.cyl(M.grey, [-62.3, deckY(-62.3), 0], [-63.6, deckY(-62.3) + 5.2, 0], 0.07, 0.04, 6, true);                                                                         // bare ensign staff (no flag)
    P.cyl(M.grey, [62.2, deckY(62.2), 0], [62.5, deckY(62.2) + 3.6, 0], 0.05, 0.03, 6, true);                                                                              // bare jack staff
    // standing rigging
    wire([[FORE, 38.4, 0], [62.3, deckY(62.3) + 0.3, 0]]); wire([[FORE, 26.2, 0], [50, deckY(50) + 0.2, 0]], 0.03);
    wire([[FORE, 38.7, 0], [(FORE + MAIN) / 2, 39.4, 0], [MAIN, 43.2, 0]], 0.025); wire([[MAIN, 43.2, 0], [-62.6, deckY(-62) + 2.6, 0]]);
    for (const sd of [-1, 1]) {
      for (const s of [27.3, 25.6, 23.9]) wire([[FORE, 23.1, sd * 0.4], [s, BULWARK + 0.1, sd * (half(s, 7) - 0.15)]], 0.03);
      wire([[FORE, 37.5, 0], [20.5, BULWARK, sd * (half(20.5, 7) - 0.15)]], 0.025);
      for (const s of [-26.5, -28.2, -29.9]) wire([[MAIN, 20.5, sd * 0.4], [s, deckY(s) + 0.1, sd * (half(s, 6) - 0.15)]], 0.03);
      wire([[MAIN, 42, 0], [-35.5, deckY(-35.5), sd * (half(-35.5, 6) - 0.15)]], 0.025);
      wire([[FORE + 0.3, 26.9, sd * 9.3], [FORE, 31.5, 0]], 0.02); wire([[MAIN - 0.3, 25.2, sd * 8.3], [MAIN, 30, 0]], 0.02);
      for (const t of [4.5, 7, 9]) wire([[FORE + 0.3, 26.85, sd * t], [FORE + 1.2, 12.6, sd * Math.min(3.2, t * 0.4)]], 0.015, '#59606a');     // signal halyards
      wire([[MAIN - 0.3, 25.15, sd * 7.6], [MAIN, 10.2, sd * 5.5]], 0.015, '#59606a');
    }
    wire([[MAIN - 10.2, 29.1, 0], [MAIN, 37, 0]], 0.02); wire([[MAIN - 10.2, 29.1, 0], [-56, deckY(-56) + 0.1, 0]], 0.015, '#59606a');

    // ================================================================== guns (152 mm Canet, box shields)
    const gun = (s, y, t, yaw, elev = 0.05) => {
      P.push(s, y, t, yaw);
      P.col(M.greyDark, 0, 0, 0, 0.95, 0.6, 0.42, 10, false);
      P.box(M.greyDark, -1.1, 0.75, 0.95, 1.55, -0.32, 0.32, '');
      for (const z of [-1.15, 1.15]) { P.quad(M.greyD, [-0.95, 0.3, z], [0.75, 0.3, z], [0.75, 1.55, z], [-0.95, 1.55, z], [0, 0, Math.sign(z)]); P.fan(M.greyD, [[-0.95, 1.55, z], [0.75, 1.55, z], [0.25, 2.05, z], [-0.95, 2.05, z]], [0, 0, Math.sign(z)]); }
      P.quad(M.greyD, [0.75, 0.3, 1.15], [0.75, 0.3, -1.15], [0.75, 1.55, -1.15], [0.75, 1.55, 1.15], [1, 0, 0]);
      P.quad(M.greyD, [0.75, 1.55, 1.15], [0.75, 1.55, -1.15], [0.25, 2.05, -1.15], [0.25, 2.05, 1.15], [0.7, 0.7, 0]);
      P.quad(M.greyD, [0.25, 2.05, 1.15], [0.25, 2.05, -1.15], [-0.95, 2.05, -1.15], [-0.95, 2.05, 1.15], [0, 1, 0]);
      P.box(M.mouth, 0.76, 0.78, 1.02, 1.5, -0.3, 0.3, 'kl');
      const e = Math.tan(elev);
      P.cyl(M.grey, [0.5, 1.25, 0], [3.0, 1.25 + e * 2.5, 0], 0.19, 0.15, 8, false); P.cyl(M.grey, [3.0, 1.25 + e * 2.5, 0], [6.3, 1.25 + e * 5.8, 0], 0.15, 0.1, 8, false);
      P.cyl(M.greyDark, [6.3, 1.25 + e * 5.8, 0], [6.42, 1.25 + e * 5.92, 0], 0.125, 0.125, 8, true);
      P.pop();
    };
    gun(50.5, deckY(50.5), 0, 0, 0.09);                                                                   // the bow gun (the one that fired the blank shot in 1917)
    P.box(M.brass, 51.28, 51.3, deckY(50.5) + 0.75, deckY(50.5) + 1.3, 0.45, 1.05, 'k');                    // the bronze plaque on its shield
    gun(-52.5, deckY(-52.5), 0, Math.PI, 0.05);
    for (const s of SIDE_GUNS) for (const sd of [-1, 1]) {
      const yD = deckY(s), bh = half(s, yD), fwd = s > 0;
      // sponson: a quarter ellipsoid under a half-round platform
      const R = fwd || s > -20 ? [2.25, 1.9, 1.3] : [1.9, 1.3, 0.85];
      const g = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI, Math.PI / 2, Math.PI / 2);
      P.geo(M.grey, g, s, yD, sd * (bh - 0.06), 0, sd > 0 ? 0 : Math.PI, 0, R[0], R[1], R[2]); g.dispose();
      P.fan(M.grey, Array.from({ length: 13 }, (_, i) => [s + Math.cos(i / 12 * Math.PI) * R[0], yD + 0.012, sd * (bh - 0.06 + Math.sin(i / 12 * Math.PI) * R[2])]), [0, 1, 0]);
      gun(s, yD, sd * (bh + R[2] * 0.22), fwd ? -sd * 0.42 : Math.PI + sd * 0.42, 0.03);
      for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI, x = s + Math.cos(a) * (R[0] - 0.08), z = sd * (bh - 0.06 + Math.sin(a) * (R[2] - 0.08)); P.cyl(M.grey, [x, yD, z], [x, yD + 1.0, z], 0.025, 0.025, 4, false); }
    }

    // ================================================================== boats on curved davits
    const boat = (s, y, t, len, wid, mat, botMat) => {
      const g = new THREE.SphereGeometry(1, 12, 5, 0, TAU, Math.PI / 2, Math.PI / 2);
      P.geo(mat, g, s, y, t, 0, 0, 0, len / 2, 1.15, wid / 2); g.dispose();
      if (botMat) { const g2 = new THREE.SphereGeometry(1, 12, 3, 0, TAU, Math.PI * 0.7, Math.PI * 0.3); P.geo(botMat, g2, s, y, t, 0, 0, 0, len / 2 * 1.015, 1.17, wid / 2 * 1.02); g2.dispose(); }
      P.fan(M.greyLight, Array.from({ length: 14 }, (_, i) => [s + Math.cos(i / 14 * TAU) * len / 2, y + 0.01, t - Math.sin(i / 14 * TAU) * wid / 2]), [0, 1, 0]);
      P.box(mat, s - len / 2 + 0.3, s + len / 2 - 0.3, y - 0.02, y + 0.1, t - 0.05, t + 0.05, 'b');
    };
    for (const sd of [-1, 1]) {
      for (const [s, len] of [[18.2, 8.6], [6.0, 9.4], [-19.8, 7.2]]) {
        const bh = half(s, 7), t = sd * (bh + 1.55), top = 11.3;
        for (const ds of [-len * 0.3, len * 0.3]) {
          tub(M.grey, [[s + ds, UD, sd * (bh - 0.35)], [s + ds, top - 1.6, sd * (bh - 0.35)], [s + ds, top - 0.5, sd * (bh + 0.1)], [s + ds, top, sd * (bh + 0.95)], [s + ds, top - 0.2, sd * (bh + 1.6)]], [0.11, 0.1, 0.09, 0.08, 0.06], { seg: 6, per: 4 });
          wire([[s + ds, top - 0.22, sd * (bh + 1.58)], [s + ds, 9.95, sd * (bh + 1.55)]], 0.02);
        }
        boat(s, 9.9, t, len, 2.1, M.grey);
      }
      boat(-7.2, 10.2, sd * 4.4, 10.6, 2.5, M.grey, M.redDeep);                                              // the steam launch on its skids
      for (const s of [-10.6, -3.8]) { P.box(M.grey, s - 0.1, s + 0.1, UD, 9.1, sd * 4.4 - 0.1, sd * 4.4 + 0.1, 'b'); P.box(M.grey, s - 0.12, s + 0.12, 8.95, 9.12, sd * 3.2, sd * 5.6, ''); }
      P.col(M.brass, -6.4, sd * 4.4, 10.2, 11.3, 0.18, 0.18, 8, true);
    }

    // ================================================================== bow and stern: anchors, hawse rings, stars, the name
    const anchor = (s, sd) => {
      const hp = hullPt(s, 5.2, sd, 0.28), x = hp.p[0], z = hp.p[2];
      P.cyl(M.black, [x, 3.3, z], [x, 6.5, z], 0.13, 0.1, 6, true);
      P.box(M.black, x - 0.98, x + 0.98, 2.95, 3.38, z - 0.21, z + 0.21, '');
      for (const d of [-1, 1]) { P.fan(M.black, [[x + d * 0.98, 3.05, z + sd * 0.23], [x + d * 0.4, 3.1, z + sd * 0.23], [x + d * 0.8, 4.7, z + sd * 0.23], [x + d * 1.28, 4.1, z + sd * 0.23]], [0, 0, sd]); P.box(M.black, x + d * 0.42, x + d * 1.0, 3.05, 3.9, z - 0.2, z + 0.22, ''); }
      const g = new THREE.TorusGeometry(0.17, 0.045, 5, 10); P.geo(M.black, g, x, 6.62, z, 0, Math.PI / 2, 0); g.dispose();
      const top = hullPt(s + 0.3, topY(s) - 0.35, sd, 0.12).p;
      tub(M.black, [[x, 6.78, z], [x + 0.1, 7.5, z], top], 0.055, { seg: 5, per: 3 });
    };
    anchor(50.6, 1); anchor(46.4, 1); anchor(50.6, -1);
    for (const sd of [-1, 1]) {
      const hw = hullPt(57.2, 5.0, sd, 0.02);                                                              // hawse ring
      const g = new THREE.TorusGeometry(0.5, 0.15, 6, 14); P.geo(M.grey, g, hw.p[0], hw.p[1], hw.p[2], 0, hw.yaw, 0); g.dispose();
      const gc = new THREE.CircleGeometry(0.42, 12); const hc = hullPt(57.2, 5.0, sd, 0.03); P.geo(M.mouth, gc, hc.p[0], hc.p[1], hc.p[2], 0, hc.yaw, 0); gc.dispose();
      // red star with a white edge
      const st = hullPt(59.4, 7.55, sd, 0.03), st2 = hullPt(59.4, 7.55, sd, 0.045);
      const star = (R, c, off) => { P.push(off.p[0], off.p[1], off.p[2], off.yaw); const pts = [[0, 0, 0]]; for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + i / 10 * TAU, r = i % 2 ? R * 0.4 : R; pts.push([Math.cos(a) * r, Math.sin(a) * r, 0]); } P.fan(c, pts, [0, 0, 1]); P.pop(); };
      star(0.6, M.white, st); star(0.47, M.red, st2);
    }
    { // draught numerals at the stem (white ticks) and the brass name on both quarters
      for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) { const q = hullPt(62.2, 1.9 + k * 0.42, sd, 0.02); P.push(q.p[0], q.p[1], q.p[2], q.yaw); P.box(M.white, -0.13, 0.13, -0.09, 0.09, 0, 0.01, 'k'); P.pop(); }
      const nameTex = ctx.tex.draw(512, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#d2a94e'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold 96px ${(ctx.tex.FONTS && ctx.tex.FONTS.serif) || 'serif'}`; g.fillText('АВРОРА', w / 2, h / 2 + 6); }, { key: 'lmAu-name' });
      const nameMat = ctx.mat.decal('#ffffff', { map: nameTex, alphaTest: 0.4, name: 'lmAu-nameDecal' }); M.decals.add(nameMat);
      for (const sd of [-1, 1]) {
        const a = hullPt(-58.9, 4.55, sd, 0.05), b = hullPt(-55.3, 4.55, sd, 0.05), c = hullPt(-55.3, 5.4, sd, 0.05), d = hullPt(-58.9, 5.4, sd, 0.05);
        const uv = sd > 0 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[1, 0], [0, 0], [0, 1], [1, 1]];
        P.quad(nameMat, a.p, b.p, c.p, d.p, a.n, uv);
      }
    }

    // ================================================================== guard rails: forecastle, quarterdeck (stanchions here, the two wires as ctx.wires)
    for (const [s0, s1] of [[BREAK + 0.6, 62], [STERN + 0.8, AFT_END - 0.4]]) for (const sd of [-1, 1]) {
      const top = [], mid = [];
      for (let s = s0; s <= s1 + 0.01; s += (s1 - s0) / Math.round((s1 - s0) / 2.2)) {
        const y = deckY(s), t = sd * Math.max(0.05, half(s, y) - 0.22);
        P.cyl(M.grey, [s, y, t], [s, y + 1.02, t], 0.022, 0.022, 4, false);
        top.push([s, y + 1.0, t]); mid.push([s, y + 0.52, t]);
      }
      wire(top, 0.022, '#59616b'); wire(mid, 0.018, '#59616b');
    }

    // ================================================================== moorings: barrels, chains, spacer booms with dolphins, the port ladder
    const barrel = (s, t, tilt, turn) => {
      P.push(s, 0.25, t, turn);
      const m = new THREE.Matrix4().makeRotationZ(tilt);
      const part = (mat, y0, y1, r0, r1) => { const g = new THREE.CylinderGeometry(r1, r0, y1 - y0, 16, 1, true); g.translate(0, (y0 + y1) / 2, 0); g.applyMatrix4(m); P.geo(mat, g); g.dispose(); };
      part(M.red, -1.0, -0.45, 1.56, 1.6); part(M.white, -0.45, 0.45, 1.6, 1.6); part(M.red, 0.45, 1.25, 1.6, 1.45);
      const gt = new THREE.CircleGeometry(1.45, 16); gt.rotateX(-Math.PI / 2); gt.translate(0, 1.25, 0); gt.applyMatrix4(m); P.geo(M.barrelTop, gt); gt.dispose();
      const gr = new THREE.TorusGeometry(0.28, 0.07, 5, 10); gr.translate(0, 1.5, 0); gr.applyMatrix4(m); P.geo(M.greyDark, gr); gr.dispose();
      P.pop();
    };
    const chain = (a, b, sag) => { const pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u]); } tub(M.white, pts, 0.11, { seg: 5, per: 2 }); };
    for (const [s, t, hs, hy, ht, tilt, turn] of [[84, 11, 57.4, 4.9, 1, -0.35, 0.5], [86, -13, 57.4, 4.9, -1, -0.35, -0.6], [-82, 10, -60.8, 4.0, 1, 0.35, -0.5], [-86, -12, -60.8, 4.0, -1, 0.35, 0.6]]) {
      barrel(s, t, tilt, turn);
      const hp = hullPt(hs, hy, ht, 0.2).p; chain(hp, [s - Math.sign(s) * 0.6, 1.6, t], 1.6);
    }
    for (const s of [36.5, -51.5]) {                                                                      // spacer booms to the dolphins on the quay side
      const b = half(s, 0.6);
      P.cyl(M.greyDark, [s, 0.75, b - 0.1], [s, 0.75, b + 12.5], 0.32, 0.32, 10, true);
      P.box(M.greyDark, s - 0.5, s + 0.5, 0.2, 1.3, b - 0.1, b + 0.7, '');
      P.box(M.rust, s - 1.6, s + 1.6, -0.7, 0.45, b + 12, b + 15, 'b'); P.box(M.greyDark, s - 0.7, s + 0.7, 0.45, 1.25, b + 12.3, b + 13.7, 'b');
    }
    { // the yellow accommodation ladder on the port side with a float and two black fenders
      const s0 = -17, b0 = half(s0, UD);
      for (let k = 0; k < 14; k++) { const u = k / 14, x = s0 - u * 9.2, y = UD - 0.2 - u * 4.9; P.box(M.ladder, x - 0.34, x + 0.34, y - 0.06, y, -b0 - 1.5, -b0 - 0.35, ''); }
      for (const z of [-b0 - 0.35, -b0 - 1.5]) { P.cyl(M.ladder, [s0, UD - 0.2, z], [s0 - 9.2, UD - 5.1, z], 0.06, 0.06, 5, false); P.cyl(M.ladder, [s0, UD + 0.8, z], [s0 - 9.2, UD - 4.1, z], 0.04, 0.04, 5, false); }
      P.box(M.greyDark, s0 - 14.5, s0 - 8.8, 0.1, 0.75, -b0 - 2.6, -b0 - 0.2, '');
      for (const x of [s0 - 18.5, s0 - 22]) P.cyl(M.black, [x, 0.35, -half(x, 0.5) - 0.75], [x + 2.6, 0.35, -half(x + 2.6, 0.5) - 0.75], 0.7, 0.7, 10, true);
    }

    // ================================================================== the gangway from the quay platform (banner on its south side)
    {
      const b = half(GANG_S, UD), tA = b - 0.6, tB = SHIP.loc(-785.1, -2582.8).v + 0.9, yA = UD + 0.25, yB = QY + 1.25, wid = 1.7;
      const len = tB - tA, ny = (yB - yA) / len;
      const yAt = (t) => yA + (t - tA) * ny;
      P.quad(M.deck, [GANG_S - wid / 2, yA, tA], [GANG_S + wid / 2, yA, tA], [GANG_S + wid / 2, yB, tB], [GANG_S - wid / 2, yB, tB], [0, 1, 0], [[0, 0], [0.7, 0], [0.7, len / 2.4], [0, len / 2.4]]);
      P.quad(M.greyDark, [GANG_S - wid / 2, yA - 0.04, tA], [GANG_S - wid / 2, yB - 0.04, tB], [GANG_S + wid / 2, yB - 0.04, tB], [GANG_S + wid / 2, yA - 0.04, tA], [0, -1, 0]);
      for (const sx of [-1, 1]) {
        const x = GANG_S + sx * wid / 2;
        for (const dy of [-0.25, 0.0, 1.1]) P.cyl(M.grey, [x, yA + dy, tA], [x, yB + dy, tB], 0.05, 0.05, 5, false);
        const n = Math.round(len / 1.3);
        for (let k = 0; k <= n; k++) { const t = tA + len * k / n; P.cyl(M.grey, [x, yAt(t) - 0.25, t], [x, yAt(t) + 1.1, t], 0.035, 0.035, 4, false); if (k < n) { const t1 = tA + len * (k + 1) / n; P.cyl(M.grey, [x, yAt(t) - 0.25, t], [x, yAt(t1), t1], 0.025, 0.025, 4, false); } }
      }
      const banTex = ctx.tex.draw(1024, 96, (g, w, h) => { g.fillStyle = '#f2f0e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d2f5a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold 50px ${(ctx.tex.FONTS && ctx.tex.FONTS.sans) || 'sans-serif'}`; g.fillText('КРЕЙСЕР I РАНГА БАЛТИЙСКОГО ФЛОТА «АВРОРА»', w / 2, h / 2 + 3); }, { key: 'lmAu-banner' });
      const banMat = ctx.mat.toon('#ffffff', { map: banTex, name: 'lmAu-banner' });
      const x = GANG_S + wid / 2 + 0.07, t0 = tA + 1.2, t1 = tB - 1.2;                                     // facing the bow (+x): readable from the south part of the quay
      P.quad(banMat, [x, yAt(t1) + 0.1, t1], [x, yAt(t0) + 0.1, t0], [x, yAt(t0) + 0.95, t0], [x, yAt(t1) + 0.95, t1], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(M.white, [x - 0.02, yAt(t0) + 0.1, t0], [x - 0.02, yAt(t1) + 0.1, t1], [x - 0.02, yAt(t1) + 0.95, t1], [x - 0.02, yAt(t0) + 0.95, t0], [-1, 0, 0]);
      // shore end: a steel landing over the parapet that runs into the ticket pavilion (the ship is closed: no way through)
      const tP = SHIP.loc(-790.1, -2586.6).v + 0.04;
      P.box(M.greyDark, GANG_S - 1.0, GANG_S + 1.0, QY + 1.1, QY + 1.25, tB - 0.4, tP, '');
      for (const sx of [-1.0, 1.0]) { for (const dy of [1.75, 2.3]) P.cyl(M.grey, [GANG_S + sx, QY + dy, tB - 0.4], [GANG_S + sx, QY + dy, tP], 0.035, 0.035, 4, false); for (const t of [tB - 0.4, (tB + tP) / 2, tP - 0.05]) P.cyl(M.grey, [GANG_S + sx, QY + 1.25, t], [GANG_S + sx, QY + 2.3, t], 0.035, 0.035, 4, false); }
      P.box(M.mouth, GANG_S - 0.85, GANG_S + 0.85, QY + 1.25, QY + 3.3, tP - 0.02, tP + 0.02, 'f');
      P.box(M.greyLight, GANG_S - 0.98, GANG_S + 0.98, QY + 1.2, QY + 3.42, tP - 0.01, tP + 0.012, 'f');
      { const c = SHIP.w(GANG_S, (tB + tP) / 2 - 0.2); ph.addBox(c.x, c.z, 2.2, tP - tB + 0.5, SHIP.rot, 0, 2.6); }
      svc.gangway = { s: GANG_S, x: SHIP.w(GANG_S, tB).x, z: SHIP.w(GANG_S, tB).z };
    }
  } finally { P.pop(); }

  // ================================================================== port holes (two instanced meshes: brass rim, dark glass)
  {
    const mats = [], base = new THREE.Matrix4().makeRotationY(SHIP.rot); base.setPosition(SHIP.x, WY, SHIP.z);
    const put = (s, y, sd) => { const q = hullPt(s, y, sd, 0.035); const m = new THREE.Matrix4().makeRotationY(q.yaw); m.setPosition(q.p[0], q.p[1], q.p[2]); mats.push(base.clone().multiply(m)); };
    const nearGun = (s) => SIDE_GUNS.some((g) => Math.abs(s - g) < 2.6);
    for (const sd of [-1, 1]) {
      for (let s = -55; s <= 60.5; s += 2.5) put(s, 3.05, sd);
      for (let s = 38.6; s <= 60; s += 2.4) { put(s, 5.55, sd); put(s, 7.85, sd); }
      for (let s = -53; s < 36; s += 4.9) if (!nearGun(s)) put(s, 4.7, sd);
    }
    const parts = partsGeos((Q) => { const r = new THREE.RingGeometry(0.15, 0.195, 12); Q.geo(M.brass, r); r.dispose(); const c = new THREE.CircleGeometry(0.15, 12); Q.geo(M.port, c, 0, 0, -0.005); c.dispose(); });
    const res = addInstanced(ctx, root, 'lmAu-ports', parts, mats, { cast: false });
    K.extraTris += res.tris; svc.ship.ports = mats.length;
  }

  // ================================================================== the ticket pavilion on the quay platform, the stele
  try {
    const b = L.buildingById(TICKET_ID);
    if (b) {
      const r = pairs(b.polys[0].o), cx = b.cx, cz = b.cz, e0 = [r[1][0] - r[0][0], r[1][1] - r[0][1]], l0 = Math.hypot(e0[0], e0[1]), e1 = [r[2][0] - r[1][0], r[2][1] - r[1][1]], l1 = Math.hypot(e1[0], e1[1]);
      P.push(cx, 0, cz, Math.atan2(-e0[1], e0[0]));
      P.box(M.greyDark, -l0 / 2, l0 / 2, 0, 0.5, -l1 / 2, l1 / 2, 'b'); P.box(M.port, -l0 / 2 + 0.05, l0 / 2 - 0.05, 0.5, 3.45, -l1 / 2 + 0.05, l1 / 2 - 0.05, 'tb');
      for (const [x, z] of [[-l0 / 2, -l1 / 2], [l0 / 2, -l1 / 2], [l0 / 2, l1 / 2], [-l0 / 2, l1 / 2], [0, -l1 / 2], [0, l1 / 2]]) P.box(M.greyDark, x - 0.08, x + 0.08, 0.5, 3.45, z - 0.08, z + 0.08, 'tb');
      P.box(M.greyDark, -l0 / 2 - 0.35, l0 / 2 + 0.35, 3.45, 3.7, -l1 / 2 - 0.35, l1 / 2 + 0.35, '');
      P.pop();
      ph.addBox(cx, cz, l0, l1, Math.atan2(-e0[1], e0[0]), 0, 3.7);
    }
    // the granite stele of the eternal mooring (text from the OSM inscription tag)
    const stTex = ctx.tex.draw(512, 512, (g, w, h) => {
      g.fillStyle = '#8f8b86'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e2d2'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const F = (ctx.tex.FONTS && ctx.tex.FONTS.serif) || 'serif', lines = ['ОРДЕНА', 'ОКТЯБРЬСКОЙ РЕВОЛЮЦИИ', 'КРАСНОЗНАМЁННЫЙ', 'КРЕЙСЕР', '«АВРОРА»', 'В НОЯБРЕ 1948 ГОДА', 'ПОСТАВЛЕН ЗДЕСЬ', 'НА ВЕЧНУЮ СТОЯНКУ'];
      lines.forEach((t, i) => { g.font = `bold ${i === 4 ? 58 : 34}px ${F}`; g.fillText(t, w / 2, 70 + i * 54); });
    }, { key: 'lmAu-stele' });
    const stMat = ctx.mat.toon('#ffffff', { map: stTex, name: 'lmAu-steleText' });
    P.push(STELE.x, 0, STELE.z, SHIP.rot);                                                                // a slab parallel to the quay, the text toward the promenade (the river side)
    P.box(M.greyGranite, -1.0, 1.0, 0, 0.25, -0.22, 0.22, 'b', 1.5); P.box(M.greyGranite, -0.8, 0.8, 0.25, 2.1, -0.13, 0.13, 'b', 1.5);
    P.quad(stMat, [0.7, 0.45, -0.135], [-0.7, 0.45, -0.135], [-0.7, 1.95, -0.135], [0.7, 1.95, -0.135], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.pop();
    ph.addBox(STELE.x, STELE.z, 2.0, 0.5, SHIP.rot, 0, 2.2);
  } catch (e) { console.error('[landmarksAurora] ship quay furniture:', e); }

  // ================================================================== colliders: the hull (closed ship), the dolphins; services
  for(let s=-60;s<63;s+=2){const c=SHIP.w(s+1,0),hw=Math.max(half(s,0),half(s+1,0),half(s+2,0));ph.addBox(c.x,c.z,2,hw*2,SHIP.rot,WY-6,WY+14);}
  for (const [s, t] of [[84, 11], [86, -13], [-82, 10], [-86, -12]]) { const c = SHIP.w(s, t); ph.addCylinder(c.x, c.z, 1.7, WY - 3, WY + 2.5); }
  svc.monuments.push({ id: 'r3272566', name: 'Крейсер «Аврора»', x: SHIP.x, z: SHIP.z, h: WY + MAIN_TOP });
  const spot = SHIP.w(34, 34), spot2 = SHIP.w(-30, 26);
  svc.photoSpots.push({ x: spot.x, z: spot.z, yaw: L.yawToward ? L.yawToward(spot.x, spot.z, SHIP.x, SHIP.z) : -90, name: 'Крейсер «Аврора» с Петроградской набережной' });
  svc.crowd.push({ x: spot.x, z: spot.z, r: 9, n: 14, kind: 'tourists' }, { x: spot2.x, z: spot2.z, r: 7, n: 10, kind: 'tourists' });
}
