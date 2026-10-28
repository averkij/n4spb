// landmarksMakarova/lutheran.js - the LUTHERAN CHURCH OF ST CATHERINE (Bolshoy pr. 1A; Yu. Felten 1768-71, stair wings 1902-03; OSM w54949806 + the dome circle w875603833; docs/research/makarova.md section 7;
// photos k01 k02 k06 k07 k09 k10 k11 crit_n09).  Frame E (frame.js): origin = the west corner of the NW (altar) end, u across, v along the long axis toward the portico (SE, bearing 150); the front faces +v.
//   * the HALL 22.1 x 42.9 m: straw-yellow stucco, white pilasters at 3.4 m pitch with six round-headed windows (1.3 x 3.8) a side, cornice 11.0, a grey gable roof (ridge 15.0) hipped at the NW end;
//   * the FOUR-COLUMN DORIC PORTICO (columns 0.88 x 7.3 m at u 6.6 / 9.6 / 13.05 / 16.05, a wider middle bay; entablature 7.3-9.5 with triglyph blocks and a modillion cornice; pediment apex 12.4; floor +0.9, three steps):
//     its back wall carries three doors (the middle one in a shallow pedimented portal under the white sign ЛЮТЕРАНСКАЯ ЦЕРКОВЬ / СВ. ЕКАТЕРИНЫ);
//   * the two STAIR WINGS (7.2 m wide, cornice 11.0 and a white balustrade to 12.1): on each front an arched niche on a shell console with a WHITE APOSTLE (2.0 m), the meander frieze and a relief panel;
//   * the DRUM (d 10.0, a straw-yellow cylinder with 8 round-headed windows and white pilasters, cornice 18.5) and the silver RIBBED DOME (16 ribs, to 23.3), a lantern and a gold cross (to 28 m);
//   * the two arched iron GATES that close the yard at the flanks (u -3.0 and 26.0, v 42.9: closed, private).
// Colliders: the hall and wing walls, the portico back wall, the columns, the steps (physics.addStairs) and the portico floor (walk box), the gates.  Publishes crowd disc / photo spot / door sign (labels).
import * as THREE from 'three';
import * as L from '../layout.js';
import { FE, FALL, ringIn, polyIn, colliders } from './frame.js';
import { ringEdges, onEdge } from './kit.js';
import { wallHoles, cornice, column, pilaster, lathe } from './facade.js';
import { apostleFig } from './figs.js';
import { addPolyColliders } from '../lib/massing.js';

const Y_COR = 11.0, Y_RIDGE = 15.0, Y_PORT = 0.9;
const PORT = { u0: 6.05, u1: 16.6, v0: 42.88, v1: 48.3, cx: 11.3 };
const COLS = [6.6, 9.6, 13.05, 16.05];
const DRUM = { cx: 11.3, cz: 39.0, r: 5.0, y0: 11.0, y1: 18.5 };

export function build(K) {
  const { ctx, P } = K, errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMakarova] lutheran/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const ring = ringIn(FE, 'w54949806', FALL.lutheran);
  P.push(FE.x, 0, FE.z, FE.rot);
  try {
    stage('walls', () => walls(K, ring));
    stage('frontwall', () => frontWall(K));
    stage('roof', () => roof(K));
    stage('portico', () => portico(K));
    stage('drum', () => drum(K));
    stage('gates', () => gates(K));
  } finally { P.pop(); }
  stage('colliders', () => colliders_(K, ring));
  const c = FE.W(11.3, 25);
  K.svc.monuments.push({ id: 'w54949806', name: 'Лютеранская церковь Св. Екатерины', x: c.x, z: c.z, h: 28 });
  K.svc.crowd.push({ x: -3445, z: -1001, r: 5, n: 4, kind: 'square', name: 'Лютеранская церковь Св. Екатерины' });
  K.svc.photoSpots.push({ x: -3445, z: -1000, yaw: L.yawToward ? L.yawToward(-3445, -1000, c.x, c.z) : 10, name: 'Лютеранская церковь Св. Екатерины' });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the walls of the outline
function role(e) {
  const mv = (e.a[1] + e.b[1]) / 2, mu = (e.a[0] + e.b[0]) / 2, n = e.n;
  if (mv > 48.5) return 'step';
  if (n[1] > 0.7) return 'wingFront';
  if (n[1] < -0.7) return mv < 10 ? 'end' : 'jog';
  return mv > 40 ? 'wingSide' : (mu > 11 ? 'hallE' : 'hallW');
}
const archWin = (x, y0, w, h, glass) => ({ x, y0, w, h, kind: 'arch', glass });

function walls(K, ring) {
  const { P, M } = K, glass = M.glassDark;
  for (const e of ringEdges({ o: ring.flat(), h: [] }, 0.3)) {
    const r = role(e);
    if (r === 'step') continue;
    onEdge(P, e, (len) => {
      const ops = [];
      if (r === 'hallE' || r === 'hallW') for (let k = 0; k < 6; k++) ops.push(archWin(2.8 + 6.8 * k + 0.0, 3.2, 1.3, 3.1, glass));
      else if (r === 'end') for (const x of [len * 0.2, len * 0.5, len * 0.8]) ops.push(archWin(x, 3.2, 1.3, 3.1, glass));
      else if (r === 'wingSide') ops.push(archWin(len / 2, 3.0, 1.2, 2.4, glass));
      else if (r === 'wingFront') ops.push({ x: len / 2, y0: 1.6, w: 1.5, h: 2.55, kind: 'arch', glass: M.stuccoY, depth: 0.45, sill: false });
      let x0 = 0, x1 = len;
      wallHoles(P, { mat: M.stuccoY, x0, x1, y0: 0.9, y1: Y_COR, uvs: 4, ops, reveal: M.stuccoY, depth: 0.3 });
      P.box(M.stone, -0.08, len + 0.08, 0, 0.9, 0, 0.1, 'bk', 1.6);                         // pale granite plinth
      cornice(P, M.lutOrder, M.stuccoY, 0, len, 0, Y_COR - 1.2, { e0: 0.05, e1: 0.05, proj: 0.8 });
      if (r === 'hallE' || r === 'hallW') {
        for (let k = 0; k < 13; k++) pilaster(P, M.lutOrder, 1.1 + 3.4 * k, 0.55, 0.9, Y_COR - 1.2, 0.18, { capH: 0.6, baseH: 0.4 });
        for (let k = 0; k < 6; k++) P.box(M.lutOrder, 2.8 + 6.8 * k - 0.95, 2.8 + 6.8 * k + 0.95, 3.2 + 3.1 + 0.65, 3.2 + 3.1 + 0.8, 0, 0.1, 'k', 1);
      }
      if (r === 'wingFront') wingFront(K, len);
      if (r === 'wingSide' || r === 'wingFront') balustrade(P, M, 0, len);
    });
  }
}
/** a balustrade along the wall top (1.1 m, the white cut-out): from x0 to x1 in the wall frame, standing on the cornice at 11.0 */
function balustrade(P, M, x0, x1) {
  const z = 0.35;
  P.quad(M.balust, [x0, Y_COR, z], [x1, Y_COR, z], [x1, Y_COR + 1.1, z], [x0, Y_COR + 1.1, z], [0, 0, 1], [[0, 0], [(x1 - x0) / 0.5, 0], [(x1 - x0) / 0.5, 1], [0, 1]]);
}
/** the front of a stair wing: corner pilasters, the console and the apostle in the niche, the meander frieze, a relief panel */
function wingFront(K, w) {
  const { P, M } = K;
  for (const x of [0.5, w - 0.5]) pilaster(P, M.lutOrder, x, 0.9, 0.9, Y_COR - 1.2, 0.2, { capH: 0.8, baseH: 0.5 });
  P.box(M.lutOrder, w / 2 - 0.55, w / 2 + 0.55, 1.2, 1.6, -0.3, 0.2, 'k', 1);                                // the shell console
  const hood = (cx, y) => { P.box(M.lutOrder, cx - 0.95, cx + 0.95, y, y + 0.2, 0, 0.18, 'k', 1); P.box(M.lutOrder, cx - 0.12, cx + 0.12, y - 0.3, y, 0, 0.12, 'k', 1); };
  hood(w / 2, 4.9);
  P.quad(M.meander, [0.9, 5.35, 0.04], [w - 0.9, 5.35, 0.04], [w - 0.9, 5.85, 0.04], [0.9, 5.85, 0.04], [0, 0, 1], [[0, 0], [(w - 1.8) / 0.9, 0], [(w - 1.8) / 0.9, 1], [0, 1]]);
  P.box(M.lutOrder, w / 2 - 0.75, w / 2 + 0.75, 6.2, 7.2, 0, 0.1, 'k', 1);                                    // the relief panel (cherubs and a garland: a plain cream relief block)
  try {
    const mats = { main: M.lutOrder, dark: M.lutOrder, accent: M.lutOrder };                  // one material for the whole figure (draw calls: the apostles are 2 m statues seen at 10 m)
    const side = w > 6 ? 1 : 1;
    apostleFig(((K.svc.apost = (K.svc.apost || 0) + 1) % 2)).place(P, mats, w / 2, 1.6, -0.12, 0, 2.0 / 1.75 * side);
  } catch (e) { console.warn('[landmarksMakarova] apostle failed:', e && e.message); }
}

// ------------------------------------------------------------------------------------------------ the hall front wall (behind the portico and the wings): three doors and the sign
function frontWall(K) {
  const { ctx, P, M } = K, vW = 42.86, xs = PORT.cx - 0.29;
  P.push(0.29, 0, vW, 0);                                                                  // wall frame facing +v: x' = u - 0.29
  try {
    const dark = M.oakDoor, X = (u) => u - 0.29, c = X(PORT.cx);
    const d0 = Y_PORT + 0.02, ops = [{ x: c, y0: d0, w: 1.5, h: 2.8, kind: 'rect', glass: dark, sill: false }, { x: X(7.7), y0: d0, w: 1.2, h: 2.4, kind: 'rect', glass: dark, sill: false }, { x: X(14.9), y0: d0, w: 1.2, h: 2.4, kind: 'rect', glass: dark, sill: false },
      { x: c, y0: 5.2, w: 1.0, h: 1.3, kind: 'rect', glass: M.glassDark }];
    // the whole hall front wall (the parts behind the wings are interior); portico floor at +0.9: the wall starts at the floor
    wallHoles(P, { mat: M.stuccoY, x0: 0, x1: 22.1, y0: Y_PORT, y1: Y_COR, uvs: 4, ops, reveal: M.stuccoY, depth: 0.3 });
    P.fan(M.stuccoY, [[0, Y_COR, 0], [22.1, Y_COR, 0], [22.1 / 2, Y_RIDGE, 0]], [0, 0, 1], (p) => [p[0] / 4, p[1] / 4]);
    // the shallow pedimented portal of the middle door and small gabled hoods of the side doors
    P.box(M.lutOrder, c - 1.2, c - 0.85, Y_PORT, Y_PORT + 3.2, 0, 0.12, 'k', 1); P.box(M.lutOrder, c + 0.85, c + 1.2, Y_PORT, Y_PORT + 3.2, 0, 0.12, 'k', 1);
    P.box(M.lutOrder, c - 1.3, c + 1.3, Y_PORT + 3.2, Y_PORT + 3.45, 0, 0.18, 'k', 1);
    P.fan(M.lutOrder, [[c - 1.3, Y_PORT + 3.45, 0.05], [c + 1.3, Y_PORT + 3.45, 0.05], [c, Y_PORT + 4.0, 0.05]], [0, 0, 1]);
    for (const u of [7.7, 14.9]) { const x = X(u); P.box(M.lutOrder, x - 0.8, x + 0.8, Y_PORT + 2.4, Y_PORT + 2.55, 0, 0.16, 'k', 1); P.fan(M.lutOrder, [[x - 0.8, Y_PORT + 2.55, 0.04], [x + 0.8, Y_PORT + 2.55, 0.04], [x, Y_PORT + 2.9, 0.04]], [0, 0, 1]); }
    // the door sign (reserved through the labels registry)
    const wp = FE.W(PORT.cx, vW + 0.03), lb = ctx.services && ctx.services.labels, ny = FE.V;
    if (!lb || lb.reserve('w54949806', wp.x, 3.85 + Y_PORT, wp.z, 1.7, 0.5, ny[0], ny[1], 'plate'))
      P.quad(M.lutSign, [c - 0.85, Y_PORT + 3.9, 0.04], [c + 0.85, Y_PORT + 3.9, 0.04], [c + 0.85, Y_PORT + 4.4, 0.04], [c - 0.85, Y_PORT + 4.4, 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    void xs;
  } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ roofs: the hall (gable, hipped at the altar end), the portico, the flat wing roofs
function roof(K) {
  const { P, M } = K, m = M.roofG, hw = 22.1 / 2, uc = 11.05, ov = 0.3;
  const k = (Y_RIDGE - Y_COR) / hw, nL = [-k, 1, 0], nR = [k, 1, 0];
  // the two long slopes (eaves 11.0 at u = 0 and 22.1, ridge at u 11.05 from v = 11.05 to 42.86)
  P.quad(m, [-ov, Y_COR - k * ov, -ov], [-ov, Y_COR - k * ov, 42.9], [uc, Y_RIDGE, 42.9], [uc, Y_RIDGE, uc], nL, [[0, 0], [43 / 2.4, 0], [43 / 2.4, 5], [0, 5]]);
  P.quad(m, [22.1 + ov, Y_COR - k * ov, 42.9], [22.1 + ov, Y_COR - k * ov, -ov], [uc, Y_RIDGE, uc], [uc, Y_RIDGE, 42.9], nR, [[0, 0], [43 / 2.4, 0], [43 / 2.4, 5], [0, 5]]);
  // the hip over the altar end
  P.fan(m, [[-ov, Y_COR - k * ov, -ov], [22.1 + ov, Y_COR - k * ov, -ov], [uc, Y_RIDGE, uc]], [0, k, -1], (p) => [p[0] / 2.4, p[2] / 2.4]);
  // portico roof: two slopes from the apex of the pediment (12.4) back to the hall wall, eaves at the entablature top (9.5)
  const eav = Y_PORT + 9.5, apx = eav + 2.0, pr = 2.0 / ((PORT.u1 - PORT.u0 + 0.8) / 2);
  P.quad(m, [PORT.u0 - 0.4, eav, PORT.v1 + 0.6], [PORT.cx, apx, PORT.v1 + 0.6], [PORT.cx, apx, 42.9], [PORT.u0 - 0.4, eav, 42.9], [-pr, 1, 0]);
  P.quad(m, [PORT.cx, apx, PORT.v1 + 0.6], [PORT.u1 + 0.4, eav, PORT.v1 + 0.6], [PORT.u1 + 0.4, eav, 42.9], [PORT.cx, apx, 42.9], [pr, 1, 0]);
  // the flat roofs of the wings
  P.cap(m, [[-1.24, 42.9], [PORT.u0, 42.9], [PORT.u0, 48.3], [-1.24, 48.3]], Y_COR, true, 2.4);
  P.cap(m, [[PORT.u1, 42.9], [23.91, 42.9], [23.91, 48.3], [PORT.u1, 48.3]], Y_COR, true, 2.4);
}

// ------------------------------------------------------------------------------------------------ the four-column Doric portico
function portico(K) {
  const { P, M } = K, vC = 47.55, mats = { shaft: M.lutOrder, cap: M.lutOrder };
  // floor and three steps (pale granite)
  P.box(M.stone, PORT.u0, PORT.u1, 0, Y_PORT, PORT.v0, PORT.v1, 'b', 1.6);
  for (let s = 0; s < 2; s++) P.box(M.stone, PORT.u0, PORT.u1, 0, Y_PORT - 0.3 * (s + 1), PORT.v1 + 0.42 * s, PORT.v1 + 0.42 * (s + 1), 'b', 1.6);
  // the inner faces of the two wings (the side walls of the portico)
  P.quad(M.stuccoY, [PORT.u0, Y_PORT, PORT.v0], [PORT.u0, Y_PORT, PORT.v1], [PORT.u0, Y_COR, PORT.v1], [PORT.u0, Y_COR, PORT.v0], [1, 0, 0], [[0, 0], [1.4, 0], [1.4, 2.5], [0, 2.5]]);
  P.quad(M.stuccoY, [PORT.u1, Y_PORT, PORT.v1], [PORT.u1, Y_PORT, PORT.v0], [PORT.u1, Y_COR, PORT.v0], [PORT.u1, Y_COR, PORT.v1], [-1, 0, 0], [[0, 0], [1.4, 0], [1.4, 2.5], [0, 2.5]]);
  // columns: shaft 0.88 m, 7.3 m high including the base block (the rusticated plinth 0.9 m is the portico floor)
  for (const u of COLS) column(P, mats, u, vC, Y_PORT, 7.3 + Y_PORT, 0.44, { seg: 14, capH: 0.5, baseH: 0.25 });
  // entablature: architrave + triglyph frieze + modillion cornice, 7.3 .. 9.5 above the floor line (y = 8.2 .. 10.4 from the ground) -> as in the dossier "above the street": 7.3 .. 9.5 measured from the street
  const ya = Y_PORT + 7.3, yb = Y_PORT + 9.5;
  P.box(M.lutOrder, PORT.u0 - 0.4, PORT.u1 + 0.4, ya, yb - 1.1, PORT.v0, vC + 0.75, 'k', 2);                // architrave band (the beam block)
  P.box(M.stuccoY, PORT.u0 - 0.2, PORT.u1 + 0.2, yb - 1.1, yb - 0.45, PORT.v0, vC + 0.72, 'k', 2);       // the frieze ground
  const n = 11, x0 = PORT.u0 - 0.2, x1 = PORT.u1 + 0.2;
  for (let i = 0; i < n; i++) { const u = x0 + (i + 0.5) * (x1 - x0) / n; P.box(M.stuccoY, u - 0.16, u + 0.16, yb - 1.1, yb - 0.45, vC + 0.74, vC + 0.8, 'k', 1); }   // triglyph-like blocks
  P.box(M.lutOrder, PORT.u0 - 0.55, PORT.u1 + 0.55, yb - 0.45, yb, PORT.v0, vC + 1.0, 'k', 2);
  for (let i = 0; i < 24; i++) { const u = PORT.u0 - 0.4 + (i + 0.5) * (PORT.u1 - PORT.u0 + 0.8) / 24; P.box(M.lutOrder, u - 0.1, u + 0.1, yb - 0.62, yb - 0.45, vC + 0.55, vC + 0.95, 'k', 1); }
  // the pediment: tympanum (yellow with a rosette relief) and raking cornices
  const vF = vC + 1.0, w2 = (PORT.u1 - PORT.u0 + 1.1) / 2, ap = yb + 2.0;
  P.fan(M.stuccoY, [[PORT.cx - w2, yb, vF], [PORT.cx + w2, yb, vF], [PORT.cx, ap, vF]], [0, 0, 1], (p) => [p[0] / 4, p[1] / 4]);
  for (const m of [-1, 1]) {
    const xa = PORT.cx + m * w2, xb = PORT.cx, dx = xb - xa, dy = ap - yb, l = Math.hypot(dx, dy), nx = -dy / l * (m < 0 ? 1 : -1), ny = Math.abs(dx) / l, t = 0.4;
    void nx;
    const A = [xa, yb], B = [xb, ap], A2 = [xa - m * (dy / l) * t * -1, yb + ny * t], B2 = [xb - m * (dy / l) * t * -1, ap + ny * t];
    P.quad(M.lutOrder, [A[0], A[1], vF + 0.2], [B[0], B[1], vF + 0.2], [B2[0], B2[1], vF + 0.2], [A2[0], A2[1], vF + 0.2], [0, 0, 1]);
    P.quad(M.lutOrder, [A[0], A[1], vF - 0.1], [B[0], B[1], vF - 0.1], [B[0], B[1], vF + 0.2], [A[0], A[1], vF + 0.2], [0, -1, 0]);
  }
  const rg = new THREE.CylinderGeometry(0.4, 0.4, 0.06, 12); rg.rotateX(Math.PI / 2); P.geo(M.lutOrder, rg, PORT.cx, yb + 1.0, vF + 0.03); rg.dispose();
  // portico side walls up to the entablature are the wings' inner faces (drawn with the wings' outline walls): a soffit under the beam
}

// ------------------------------------------------------------------------------------------------ the drum and the silver dome
function drum(K) {
  const { P, M } = K, D = DRUM;
  lathe(P, M.lutDrum, [[D.r, D.y0], [D.r, D.y1]], 32, D.cx, D.cz, 8, 7.5, false, D.y0);                       // the wall (8 tiles of 45 degrees, each with a round-headed window)
  for (let k = 0; k < 8; k++) {                                                                               // white pilasters at the eight corners
    const a = k / 8 * Math.PI * 2, x = D.cx + Math.sin(a) * D.r, z = D.cz + Math.cos(a) * D.r;
    P.push(x, 0, z, a); try { P.box(M.lutOrder, -0.3, 0.3, D.y0 + 1.0, D.y1 - 0.5, -0.05, 0.22, 'k', 1); } finally { P.pop(); }
  }
  const band = (r0, r1, y0, y1) => { lathe(P, M.lutOrder, [[r0, y0], [r0, y1]], 32, D.cx, D.cz, 8, 2); lathe(P, M.lutOrder, [[r0, y1], [r1, y1]], 32, D.cx, D.cz, 8, 2); };
  band(D.r + 0.03, D.r + 0.7, D.y1 - 0.3, D.y1 - 0.0);                                                      // 3 cm clear of the drum wall (coplanar bands z-fought at 30 m)
  lathe(P, M.lutOrder, [[D.r + 0.7, D.y1 - 0.3], [D.r + 0.7, D.y1]], 32, D.cx, D.cz, 8, 2);
  const prof = []; for (let i = 0; i <= 12; i++) { const t = i / 12 * Math.PI / 2; prof.push([Math.max(0.001, (D.r + 0.3) * Math.cos(t)), D.y1 + 4.8 * Math.sin(t)]); }
  lathe(P, M.lutRib, prof, 32, D.cx, D.cz, 16, 6, false, D.y1);
  lathe(P, M.lutOrder, [[0.8, 23.2], [0.8, 25.2]], 12, D.cx, D.cz, 2, 2); lathe(P, M.lutOrder, [[0.8, 25.2], [0.35, 25.5]], 12, D.cx, D.cz, 2, 2);
  const g = new THREE.SphereGeometry(0.42, 10, 8); P.geo(M.gold, g, D.cx, 25.95, D.cz); g.dispose();
  P.box(M.gold, D.cx - 0.07, D.cx + 0.07, 26.3, 28.0, D.cz - 0.07, D.cz + 0.07, '', 1); P.box(M.gold, D.cx - 0.5, D.cx + 0.5, 27.1, 27.25, D.cz - 0.07, D.cz + 0.07, '', 1);
  for (const a of [-0.7, 0.7]) P.box(M.gold, D.cx + a * 0.5 - 0.02, D.cx + a * 0.5 + 0.02, 27.2, 27.55, D.cz - 0.03, D.cz + 0.03, '', 1);            // the short rays of the ray-cross
}

// ------------------------------------------------------------------------------------------------ the two arched iron gates that close the yard at the flanks (private)
function gates(K) {
  const { P, M } = K;
  for (const uc of [-3.0, 26.0]) {
    P.push(uc, 0, 42.9, 0);
    try {
      // a pier-and-arch frame: a wall 6.2 m wide, 5.6 m tall with a round-arched opening 3.2 m wide (crown 4.2 m), the iron leaves a little behind
      wallHoles(P, { mat: M.stuccoY, x0: -3.1, x1: 3.1, y0: 0, y1: 5.2, uvs: 4, ops: [{ x: 0, y0: 0.05, w: 3.2, h: 2.55, kind: 'arch', glass: M.gateDark, depth: 0.45, sill: false }], reveal: M.stuccoY, depth: 0.45 });
      P.quad(M.bars, [-1.6, 0.1, 0.0], [1.6, 0.1, 0.0], [1.6, 4.1, 0.0], [-1.6, 4.1, 0.0], [0, 0, 1], [[0, 0], [2.7, 0], [2.7, 4], [0, 4]]);
      for (const sx of [-1, 1]) P.box(M.lutOrder, sx * 1.7 - 0.2, sx * 1.7 + 0.2, 0, 4.3, 0, 0.12, 'k', 1);
      P.box(M.lutOrder, -3.1, 3.1, 5.0, 5.4, -0.1, 0.4, 'b', 2);
    } finally { P.pop(); }
  }
}

// ------------------------------------------------------------------------------------------------ colliders
function colliders_(K, ring) {
  const { ctx } = K, ph = ctx.physics, CL = colliders(FE, ph);
  for (const e of ringEdges({ o: ring.flat(), h: [] }, 0.3)) if (role(e) !== 'step') CL.wall(e.a, e.b, 0, 12, 0.5);
  CL.wall([PORT.u0, 42.86], [PORT.u1, 42.86], 0, 12, 0.5);                                // the portico back wall (closed doors)
  for (const u of COLS) CL.cyl(u, 47.55, 0.46, 0, 10);
  const cx = FE.W(PORT.cx, PORT.v1 + 0.63);
  ph.addStairs(cx.x, cx.z, PORT.u1 - PORT.u0, 1.26, FE.rot, Y_PORT, 0, 3);              // down toward +v (the run goes along local +z)
  CL.wall([PORT.u0, PORT.v0], [PORT.u0, PORT.v1], 0, 12, 0.4); CL.wall([PORT.u1, PORT.v0], [PORT.u1, PORT.v1], 0, 12, 0.4);   // the wings' inner faces
  CL.walk(PORT.cx, 45.6, PORT.u1 - PORT.u0, PORT.v1 - PORT.v0 - 0.0, Y_PORT, -0.5);
  // the gates are closed (iron leaves): solid
  for (const uc of [-3.0, 26.0]) { const it = CL.wall([uc - 1.8, 43.0], [uc + 1.8, 43.0], 0, 4, 0.4); if (it) it.fence = true; K.svc.fences.push({ kind: 'gate', ...FE.W(uc, 43.0), private: true }); }
}
