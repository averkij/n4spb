// landmarksSmolensky/gates.js - the HOLY GATES WITH THE ALMSHOUSE (Святые ворота с богадельней, Kamskaya 24 litE; L. I. Rusca 1807-09; OSM r4198201 with the parts r4198203 / 4 / 5, the gate node n3695731351 = the frame origin).
// Dossier docs/research/smolensky.md section 7 (+ critic log 14b no. 12), photos refs/smolensky 58 (the Kamskaya facade at 52 px/m), 59 60 64 65 66: warm yellow ochre `#e3c06a` stucco, white trim, grey-blue zinc roofs,
// black iron.  Frame GA: x 0 = the Kamskaya facade, +x into the cemetery (WSW), +z (= v) NNW; the building is 17.4 m deep and 51.6 m long (v -22.7 .. 28.9).  The facade frame used below: x' = v (to the right
// as seen from the street, so the south wing is at the left), y up, z' out of the facade (= -x).
//  * the two-storey CENTRAL BLOCK (v -6.8 .. 6.7, cornice 5.8) with the barrel-vaulted passage (clear 2.9 x 4.6 m, centre v 0.65, 17.3 m long) under a white archivolt; two ground windows each side (the inner two
//    under a low triangular hood, the outer two under a trapezoid keystone block), two small upper windows each side; a dentil cornice; a STEPPED attic (v -6.6 .. 3.7 up to 7.6, the rest to 6.8) with a thin coping
//  * the one-storey SOUTH WING (v -22.7 .. -6.8, x 0 .. 10.3, eave 3.6, hip roof ridge 5.3, 5 bays) and the NORTH WING (v 6.7 .. 28.9, x 0 .. 17.3, eave 3.3, ridge 4.7, 7 bays, two small dormers, chimneys)
//  * the plaque of Arina Rodionovna on the LEFT wall under the arch (x 5, v -0.8), the cemetery hours plate and the protected-monument plate on the front, the open black gate leaf on the RIGHT wall of the passage,
//    the white security booth with the brown pitched roof and two orange barrier posts in front (only when clear of the carriageway)
// Colliders: solid piers / wings, the passage stays open (walk through the gate: the cemetery is entered here).
import * as L from '../layout.js';
import { GA } from './frame.js';
import * as G from './geo.js';
import * as S from './stucco.js';

const C0 = 0.65, AW = 2.9, AH = 4.6, CORN = 5.8;
/** reserve a wall rectangle in the shared label registry (docs/rules/LABELS-API.md): u = facade x (frame GA v), y = height; returns false when another label already hangs there */
const labelOk = (ctx, id, v, y, w, h) => { const lb = ctx.services && ctx.services.labels; if (!lb || !lb.reserve) return true; const p = GA.W(0, v); return lb.reserve(id, p.x - GA.ux * 0.03, y, p.z - GA.uz * 0.03, w, h, -GA.ux, -GA.uz, "plaque"); };
const onFacade = (P, fn) => { P.push(0, 0, 0, -Math.PI / 2); try { fn(); } finally { P.pop(); } };

export function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const T = { white: M.yTrim };                                                                      // 'M' of the stucco helpers with the white trim of this building
  P.push(GA.x, 0, GA.z, GA.rot);
  onFacade(P, () => {
    // ---- plinth (granite 0.6 m) along the whole front
    P.box(M.yPlinth, -22.8, C0 - AW / 2 - 0.05, 0, 0.6, 0.0, 0.1, 'bk', 2); P.box(M.yPlinth, C0 + AW / 2 + 0.05, 28.9, 0, 0.6, 0.0, 0.1, 'bk', 2);
    // ---- the central block with the passage: an extruded facade shape (front at z' = 0, 17.3 m deep towards the cemetery)
    const rect = [[-6.8, -0.3], [6.7, -0.3], [6.7, CORN], [-6.8, CORN]], hole = G.archPts(C0, 0, AW, AH, 12);
    P.extrude(M.yellow, G.shapeOf(rect, [hole]), -17.3, 17.3, 2, 8);
    S.archRing(P, M.yTrim, C0, 0, AW, AH, 0.32, 0, 0.1);                                             // the white archivolt round the passage
    P.quad(M.asphalt, [C0 - AW / 2, 0.03, 0.0], [C0 + AW / 2, 0.03, 0.0], [C0 + AW / 2, 0.03, -17.3], [C0 - AW / 2, 0.03, -17.3], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // the cornice (a dentil band 5.45 .. 5.95 round the block), the stepped attic and its thin coping
    P.box(M.yTrim, -7.3, 7.2, 5.45, 5.95, -17.8, 0.5, 'b');
    S.dentils(P, M.yTrim, -6.8, 6.7, 5.45, 0.0, 0.8, 0.35, 0.3, 0.45);
    P.box(M.yellow, -6.6, 3.7, 5.95, 7.6, -17.3, -0.2, 'b', 2);                                      // the middle attic (10.3 m)
    P.box(M.yellow, 3.7, 6.7, 5.95, 6.8, -17.3, -0.2, 'b', 2);                                       // the lower end section
    P.box(M.yRoof, -6.75, 3.85, 7.6, 7.72, -17.45, -0.05, 'b', 2); P.box(M.yRoof, 3.55, 6.85, 6.8, 6.9, -17.45, -0.05, 'b', 2);
    // flat roof of the block (zinc) is hidden behind the attic: a cap quad
    P.quad(M.yRoof, [-6.8, 5.95, 0.4], [6.7, 5.95, 0.4], [6.7, 5.95, -17.8], [-6.8, 5.95, -17.8], [0, 1, 0]);
    // ---- ground windows (1.0 x 1.75) and upper windows (0.9 x 1.05), white frames; hoods over the inner ground windows, keystone blocks over the outer ones
    const gw = (x, hood) => {
      S.rectWin(P, T, M.winGate, x - 0.5, x + 0.5, 0.95, 2.7, 0.13, 0.12);
      if (hood) { P.fan(M.yTrim, [[x - 0.95, 2.9, 0.16], [x + 0.95, 2.9, 0.16], [x, 3.25, 0.16]], [0, 0, 1]); P.box(M.yTrim, x - 0.95, x + 0.95, 2.82, 2.92, 0, 0.17, 'b'); }
      else { P.box(M.yTrim, x - 0.35, x + 0.35, 2.85, 3.35, 0, 0.16, 'b'); }
    };
    gw(-3.0, true); gw(-5.4, false); gw(4.0, true); gw(5.9 - 0.2, false);
    for (const x of [-3.0, -5.4, 4.0, 5.7]) S.rectWin(P, T, M.lattGate, x - 0.45, x + 0.45, 3.8, 4.85, 0.1, 0.1);
    // ---- plates on the front: the hours plate (black) left of the arch, the monument plate on the right
    if (labelOk(ctx, "r4198201", -1.6, 1.7, 0.5, 0.5)) P.quad(M.hours, [-1.85, 1.45, 0.03], [-1.35, 1.45, 0.03], [-1.35, 1.95, 0.03], [-1.85, 1.95, 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    if (labelOk(ctx, "r4198201", 3.475, 1.775, 0.55, 0.55)) P.quad(M.monGate, [3.2, 1.5, 0.03], [3.75, 1.5, 0.03], [3.75, 2.05, 0.03], [3.2, 2.05, 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // ---- the south wing (v -22.7 .. -6.8, depth x 0 .. 10.3): walls to 3.6, white cornice, hip roof ridge 5.3, five bays of 3.2 m
    P.box(M.yellow, -22.7, -6.8, 0.6, 3.35, -10.3, 0, 'bt', 2);
    P.box(M.yTrim, -23.0, -6.8, 3.35, 3.6, -10.6, 0.3, 'b');
    roofHip(P, M.yRoof, -23.1, -6.5, -10.9, 0.4, 3.6, 5.3);
    for (let i = 0; i < 5; i++) { const x = -22.7 + 1.6 + 3.2 * i; S.rectWin(P, T, M.winGate, x - 0.5, x + 0.5, 0.95, 2.55, 0.13, 0.12); P.box(M.yTrim, x - 0.35, x + 0.35, 2.72, 3.2, 0, 0.14, 'b'); }
    // ---- the north wing (v 6.7 .. 28.9, depth 17.3): walls to 3.3, cornice, hip roof ridge 4.7 along v, seven bays, two dormers, three chimneys
    P.box(M.yellow, 6.7, 28.9, 0.6, 3.05, -17.3, 0, 'bt', 2);
    P.box(M.yTrim, 6.7, 29.2, 3.05, 3.3, -17.6, 0.3, 'b');
    roofHip(P, M.yRoof, 6.4, 29.2, -17.9, 0.4, 3.3, 4.7);
    for (let i = 0; i < 7; i++) { const x = 6.7 + 1.6 + 3.2 * i; S.rectWin(P, T, M.winGate, x - 0.5, x + 0.5, 0.95, 2.45, 0.13, 0.12); P.box(M.yTrim, x - 0.35, x + 0.35, 2.62, 3.0, 0, 0.14, 'b'); }
    for (const x of [12.3, 23.3]) dormer(P, M, x, 3.35);                                            // the box starts below the roof slope (3.5 .. 3.6 m at the dormer front): no floating gap
    for (const x of [10.5, 17.5, 24.5]) { P.box(M.yellow, x - 0.35, x + 0.35, 4.6, 6.0, -8.8, -8.1, 'b'); P.box(M.yTrim, x - 0.42, x + 0.42, 6.0, 6.15, -8.88, -8.02, 'b'); }
    // ---- the YARD side (towards the cemetery; a tourist sees it the moment he walks through the arch, photo 64: white-framed barred windows with keystone "ears", the same bays as the street front).
    // The rear plane of the central block and of the north wing is x = 17.3 (z' = -17.3), the south wing ends at x = 10.3: a frame turned by PI faces into the cemetery, its local x = -v.
    const yard = (planeZ, bays, y0, y1, upper) => {
      P.push(0, 0, planeZ, Math.PI);
      for (const v of bays) {
        S.rectWin(P, T, M.winGate, -v - 0.5, -v + 0.5, y0, y1, 0.13, 0.12); P.box(M.yTrim, -v - 0.35, -v + 0.35, y1 + 0.15, y1 + 0.6, 0, 0.14, 'b');
        if (upper) S.rectWin(P, T, M.lattGate, -v - 0.45, -v + 0.45, 3.8, 4.85, 0.1, 0.1);
      }
      P.pop();
    };
    yard(-17.3, [-5.4, -3.0, 4.0, 5.7], 0.95, 2.7, true);                                            // the central block (the passage v -0.8 .. 2.1 stays clear)
    yard(-17.3, [0, 1, 2, 3, 4, 5, 6].map((i) => 6.7 + 1.6 + 3.2 * i), 0.95, 2.45, false);           // the north wing, seven bays
    yard(-10.3, [0, 1, 2, 3, 4].map((i) => -22.7 + 1.6 + 3.2 * i), 0.95, 2.55, false);               // the south wing, five bays
  });
  // ---- the open black gate leaf against the RIGHT wall of the passage (frame GA: the passage is along x, the right wall at z = C0 + AW / 2 as seen from the street)
  P.quad(M.leaf, [0.5, 0, C0 + AW / 2 - 0.1], [2.1, 0, C0 + AW / 2 - 0.1], [2.1, 2.2, C0 + AW / 2 - 0.1], [0.5, 2.2, C0 + AW / 2 - 0.1], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  // ---- Arina Rodionovna: the marble plate (0.45 x 0.65 m) in a white stucco frame on the LEFT wall, x 5, centre z -0.8
  { const zw = C0 - AW / 2 + 0.03;
    P.quad(M.arina, [4.775, 1.4, zw], [5.225, 1.4, zw], [5.225, 2.05, zw], [4.775, 2.05, zw], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.box(M.yTrim, 4.6, 5.4, 1.2, 1.3, zw - 0.02, zw + 0.1, 'b'); P.box(M.yTrim, 4.6, 5.4, 2.12, 2.24, zw - 0.02, zw + 0.1, 'b'); P.box(M.yTrim, 4.6, 4.72, 1.3, 2.12, zw - 0.02, zw + 0.08, ''); P.box(M.yTrim, 5.28, 5.4, 1.3, 2.12, zw - 0.02, zw + 0.08, '');
    P.box(M.yTrim, 4.85, 5.15, 2.24, 2.4, zw - 0.02, zw + 0.12, 'b'); }
  // ---- the booth and the barrier posts in front of the facade (GA u -5, v +5 / u -1.5, v -2.5 and +2.9), skipped when on the carriageway
  const cover = ctx.services?.streets?.net?.cover ? (x, z) => ctx.services.streets.net.cover(x, z, {}) : () => -5;
  const free = (u, v, m = 0.5) => { const q = GA.W(u, v); return cover(q.x, q.z) < -m && !L.insideBuilding(q.x, q.z, 0.3); };
  if (free(-5, 5, 1.0) && free(-5, 7, 1.0) && free(-3.4, 5, 1.0)) {
    P.push(-5, 0, 5, 0);
    P.box(M.booth, -0.9, 0.9, 0.0, 2.2, -1.1, 1.1, 'b'); P.box(M.dark, -0.5, 0.5, 1.0, 1.7, 1.11, 1.13, '');
    roofHip(P, M.boothRoof, -1.3, 1.3, -1.4, 1.4, 2.2, 3.0);
    P.pop();
  }
  for (const [u, v, arm] of [[-1.5, -2.5, 0.2], [-1.5, 2.9, 1.1]]) if (free(u, v, 0.8)) {
    P.push(u, 0, v, 0);
    P.box(M.orange, -0.12, 0.12, 0, 1.05, -0.12, 0.12, 'b');
    P.box(M.orange, -0.05, 0.05, 0.9 + arm * 0.5, 1.0 + arm * 0.5, -0.05, 1.7, '');
    P.pop();
  }
  P.pop();
  // ---- colliders: the central block piers + the lintel above the passage, the two wings (the passage v -0.8 .. 2.1 stays open)
  GA.box(ph, 8.65, -3.8, 17.3, 6.0, 0, 20); GA.box(ph, 8.65, 4.4, 17.3, 4.6, 0, 20);
  GA.box(ph, 8.65, 0.65, 17.3, 2.9, 4.7, 20);
  GA.box(ph, 5.15, -14.75, 10.3, 15.9, 0, 20); GA.box(ph, 8.65, 17.8, 17.3, 22.2, 0, 20);
  // ---- services
  const d = GA.W(-3, 0.65), g = GA.W(0, 0.65);
  K.svc.entrances.push({ id: 'n3695731351', x: d.x, z: d.z, rotY: GA.rot + Math.PI / 2, name: 'Святые ворота Смоленского кладбища' });
  K.svc.gates.push({ id: 'n3695731351', x: g.x, z: g.z, open: true, half: 1.45 });
  K.svc.crowd.push({ id: 'gates', x: -5487.9, z: -1529.7, r: 5, n: 8, kind: 'visitors' });
  K.svc.photoSpots.push({ x: -5476, z: -1521, yaw: L.yawToward(-5476, -1521, g.x, g.z), name: 'Святые ворота Смоленского кладбища' });
  K.svc.monuments.push({ id: 'r4198201', name: 'Святые ворота с богадельней (Л. И. Руска)', x: GA.W(8, 0).x, z: GA.W(8, 0).z, h: 7.6 });
}

/** a small dormer on the street slope of the north wing (facade frame: x' = v, z' out): box 0.9 wide, a mini gable above, white frame round the dark pane */
function dormer(P, M, x, y) {
  P.box(M.yellow, x - 0.55, x + 0.55, y, y + 1.25, -1.4, -0.9, 'b');
  P.box(M.yTrim, x - 0.5, x + 0.5, y + 0.1, y + 1.15, -0.92, -0.88, ''); P.quad(M.dark, [x - 0.4, y + 0.2, -0.87], [x + 0.4, y + 0.2, -0.87], [x + 0.4, y + 1.05, -0.87], [x - 0.4, y + 1.05, -0.87], [0, 0, 1]);
  P.fan(M.yTrim, [[x - 0.7, y + 1.25, -0.92], [x + 0.7, y + 1.25, -0.92], [x, y + 1.8, -0.92]], [0, 0, 1]);
  P.quad(M.yRoof, [x - 0.72, y + 1.22, -0.88], [x, y + 1.82, -0.88], [x, y + 1.82, -1.8], [x - 0.72, y + 1.22, -1.8], null);
  P.quad(M.yRoof, [x, y + 1.82, -0.88], [x + 0.72, y + 1.22, -0.88], [x + 0.72, y + 1.22, -1.8], [x, y + 1.82, -1.8], null);
}
/** a hip over the rectangle x0..x1, z0..z1 with eave y0 and ridge y1 along the long axis */
function roofHip(P, mat, x0, x1, z0, z1, y0, y1) {
  const alongX = (x1 - x0) >= (z1 - z0), w = alongX ? z1 - z0 : x1 - x0, ins = w / 2;
  const cx0 = alongX ? x0 + ins : (x0 + x1) / 2, cx1 = alongX ? x1 - ins : (x0 + x1) / 2, cz0 = alongX ? (z0 + z1) / 2 : z0 + ins, cz1 = alongX ? (z0 + z1) / 2 : z1 - ins;
  const q = (a, b, c, d, n) => P.quad(mat, a, b, c, d, n, [a, b, c, d].map((p) => [p[0], p[2]]));
  const k = (y1 - y0) / ins, nl = Math.hypot(1, k);
  q([x0, y0, z1], [x1, y0, z1], [cx1, y1, cz1], [cx0, y1, cz1], [0, 1 / nl, k / nl]);
  q([x1, y0, z0], [x0, y0, z0], [cx0, y1, cz0], [cx1, y1, cz0], [0, 1 / nl, -k / nl]);
  q([x1, y0, z1], [x1, y0, z0], [cx1, y1, cz0], [cx1, y1, cz1], [k / nl, 1 / nl, 0]);
  q([x0, y0, z0], [x0, y0, z1], [cx0, y1, cz1], [cx0, y1, cz0], [-k / nl, 1 / nl, 0]);
}
