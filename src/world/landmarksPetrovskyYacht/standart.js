// landmarksPetrovskyYacht/standart.js - the STANDART SHIPYARD SHED (Верфь «Штандарт», Петровская коса 9 лит. О, OSM w200731337, 19.5 x 14.9 m) on the club territory, photo y12 (Яхт-клуб. Территория 01) and y13:
// a gabled hangar of dark teal-green corrugated sheet (eave 6.0 m, ridge 8.5 m [E]) with a sliding door and a man door on its east wall, a high two-light window, a rigid white name plate "ВЕРФЬ «ШТАНДАРТ»"
// (plain text, no logo, not a banner), a vent hood and a drain pipe; on the yard at the foot of that wall: a black cast-iron ship's cannon on its timber truck carriage (barrel ~1.9 m), a rusty admiralty anchor
// (2.4 m, stock, ring, curved arms, flukes) with a log bench beside it, and the compass-rose sign on a post in an old tyre.  Frame: centre of the polygon, rotation 75 deg, local x along the 19.5 m wall (north),
// local z = the east normal.  Exterior only: the shed is solid.
import { STANDART } from './frame.js';
import { gable } from './shapes.js';
import * as L from '../layout.js';

export const DEG = Math.PI / 180;
export const ST = { x: STANDART.cx, z: STANDART.cz, rot: 75 * DEG, hx: 9.75, hz: 7.45 };
export const stWorld = (lx, lz) => ({ x: ST.x + lx * Math.cos(ST.rot) + lz * Math.sin(ST.rot), z: ST.z - lx * Math.sin(ST.rot) + lz * Math.cos(ST.rot) });

export function build(K) {
  const { P, M, shared } = K;
  const { hx, hz } = ST, yE = 6.0, yR = 8.5;
  P.push(ST.x, 0, ST.z, ST.rot);
  P.far = 700;
  // ---- the hangar: walls (ribbed sheet, ribs vertical), the gabled roof, the gable ends, the gutter
  P.box(M.corrGreen, -hx, hx, 0, yE, -hz, hz, 'tb', 1.6);
  gable(P, M.corrGreen, M.corrGreen, -hx, hx, -hz, hz, yE, yR, 0.45, 0.3, 1.6);
  P.box(M.metal, -hx - 0.3, hx + 0.3, yE - 0.28, yE - 0.12, hz + 0.28, hz + 0.45, 'b', 1);         // gutters on both long walls
  P.box(M.metal, -hx - 0.3, hx + 0.3, yE - 0.28, yE - 0.12, -hz - 0.45, -hz - 0.28, 'b', 1);
  P.cyl(M.metal, [hx - 0.15, 0.1, hz + 0.35], [hx - 0.15, yE - 0.2, hz + 0.35], 0.07, 0.07, 6, false);   // the drain pipe at the south-east corner
  // ---- the east wall (z = +hz): sliding door 4.4 x 4.6 m, a man door, a two-light window, the name plate, a vent hood
  P.ranged(260, () => {
    const z = hz;
    P.box(M.black, -3.4, -3.37, 0.0, 4.6, z, z + 0.05, 'kb', 1); P.box(M.black, 1.07, 1.1, 0.0, 4.6, z, z + 0.05, 'kb', 1); P.box(M.black, -3.4, 1.1, 4.58, 4.61, z, z + 0.06, 'kb', 1);   // seams of the sliding door
    P.box(M.corrGreen, -5.4, -4.4, 0, 2.15, z, z + 0.07, 'kb', 1.6); P.box(M.black, -5.44, -4.36, 2.15, 2.19, z, z + 0.09, 'kb', 1); P.box(M.black, -5.44, -5.41, 0, 2.2, z, z + 0.09, 'kb', 1); P.box(M.black, -4.39, -4.36, 0, 2.2, z, z + 0.09, 'kb', 1);   // the man door
    for (const wx of [-7.4, -6.0]) { P.box(M.black, wx - 0.55, wx + 0.55, 3.55, 4.3, z, z + 0.06, 'kb', 1); P.quad(M.glassGround, [wx - 0.5, 3.6, z + 0.07], [wx + 0.5, 3.6, z + 0.07], [wx + 0.5, 4.25, z + 0.07], [wx - 0.5, 4.25, z + 0.07], [0, 0, 1], [[0.1, 0.3], [0.9, 0.3], [0.9, 0.75], [0.1, 0.75]]); }
    P.quad(M.nameStandart, [-3.0, 4.9, z + 0.04], [0.8, 4.9, z + 0.04], [0.8, 5.85, z + 0.04], [-3.0, 5.85, z + 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.cyl(M.metal, [4.6, 4.6, z + 0.02], [4.6, 4.6, z + 0.55], 0.16, 0.16, 8, true); P.box(M.metal, 4.5, 4.7, 4.45, 4.75, z + 0.4, z + 0.62, '', 1);                       // vent hood
    // the west wall: a second man door and a roller-door seam
    P.box(M.corrGreen, 2.0, 3.0, 0, 2.15, -hz - 0.07, -hz, 'fb', 1.6); P.box(M.black, 1.94, 3.06, 2.1, 2.2, -hz - 0.09, -hz, 'fb', 1);
  });
  P.pop();

  // ---- the yard props at the foot of the east wall (photo y12): the cannon, the anchor and the bench, the compass-rose sign
  const dyx = hz + 1.25;
  P.ranged(180, () => {
    // cannon on a truck carriage; its axis lies along the wall, muzzle towards -x
    P.push(ST.x, 0, ST.z, ST.rot);
    P.push(-2.6, 0, dyx, 0);
    const ay = 0.82;
    P.box(M.timber, -1.2, 1.2, 0.0, 0.14, -0.13, 0.13, '', 1);                                  // the baulk under the carriage
    for (const sz of [-0.28, 0.28]) P.box(M.timber, -0.55 + 0.0, 0.6, 0.36, 0.95, sz - 0.06, sz + 0.06, '', 1);   // cheeks
    P.box(M.timber, -0.55, 0.6, 0.28, 0.4, -0.3, 0.3, '', 1);                                    // bed
    for (const [wx, r] of [[0.45, 0.27], [-0.5, 0.2]]) for (const sz of [-0.44, 0.44]) P.cyl(M.timber, [wx, r, sz - 0.05], [wx, r, sz + 0.05], r, r, 10, true);
    P.cyl(M.black, [0.45, 0.27, -0.46], [0.45, 0.27, 0.46], 0.035, 0.035, 5, true);
    const b = (x0, x1, r0, r1) => P.cyl(M.black, [x0, ay, 0], [x1, ay, 0], r0, r1, 12, true);       // the barrel along x (breech at +x, muzzle at -x)
    b(0.95, 0.88, 0.07, 0.1); b(0.88, 0.62, 0.16, 0.2); b(0.62, 0.56, 0.23, 0.23); b(0.56, 0.0, 0.2, 0.18); b(0.0, -0.06, 0.2, 0.2); b(-0.06, -0.55, 0.17, 0.13); b(-0.55, -0.62, 0.17, 0.17); b(-0.62, -0.95, 0.15, 0.12); b(-0.95, -1.05, 0.165, 0.165);
    P.cyl(M.black, [0.0, ay + 0.1, 0], [0.0, ay + 0.28, 0], 0.03, 0.03, 5, true);                // the trunnion boss / touch-hole
    P.pop();
    // anchor
    P.push(1.8, 0, dyx - 0.35, 0);
    P.box(M.rust, -0.05, 0.05, 0.3, 2.25, -0.045, 0.045, '', 1);                                  // shank
    P.box(M.rust, -0.07, 0.07, 1.78, 1.86, -0.62, 0.62, '', 1);                                   // stock
    for (let i = 0; i < 12; i++) { const a0 = i / 12 * Math.PI * 2, a1 = (i + 1) / 12 * Math.PI * 2; P.cyl(M.rust, [Math.cos(a0) * 0.13, 2.36 + Math.sin(a0) * 0.13, 0], [Math.cos(a1) * 0.13, 2.36 + Math.sin(a1) * 0.13, 0], 0.028, 0.028, 4, false); }   // the ring
    P.beam(M.rust, [[0, 0.32, 0], [0.34, 0.28, 0], [0.62, 0.52, 0], [0.72, 0.88, 0]], 0.1, 0.08, [0, 0, 1], 1); P.beam(M.rust, [[0, 0.32, 0], [-0.34, 0.28, 0], [-0.62, 0.52, 0], [-0.72, 0.88, 0]], 0.1, 0.08, [0, 0, 1], 1);
    P.fan(M.rust, [[0.62, 0.8, 0.05], [0.88, 0.96, 0.05], [0.74, 1.12, 0.05]], [0, 0, 1]); P.fan(M.rust, [[-0.62, 0.8, 0.05], [-0.74, 1.12, 0.05], [-0.88, 0.96, 0.05]], [0, 0, 1]);
    P.fan(M.rust, [[0.62, 0.8, -0.05], [0.74, 1.12, -0.05], [0.88, 0.96, -0.05]], [0, 0, -1]); P.fan(M.rust, [[-0.62, 0.8, -0.05], [-0.88, 0.96, -0.05], [-0.74, 1.12, -0.05]], [0, 0, -1]);
    P.cyl(M.timber, [0, 1.15, 0], [0, 1.35, 0], 0.068, 0.068, 6, false);                          // the rope lashing on the shank
    P.pop();
    // log bench
    P.push(0.05, 0, dyx - 0.15, 0);
    for (const sx of [-0.55, 0.55]) P.cyl(M.timber, [sx, 0, 0], [sx, 0.42, 0], 0.15, 0.14, 8, true);
    P.box(M.timber, -0.85, 0.85, 0.42, 0.49, -0.16, 0.16, '', 1);
    P.pop();
    // compass-rose sign on a post in a tyre, at the north corner of the wall
    P.push(-hx + 0.6, 0, hz + 2.4, 0);
    P.cyl(M.black, [0, 0, 0], [0, 0.34, 0], 0.42, 0.42, 12, false); P.cyl(M.black, [0, 0, 0], [0, 0.34, 0], 0.26, 0.26, 12, false);
    P.cyl(M.metal, [0, 0, 0], [0, 1.9, 0], 0.04, 0.04, 6, true);
    P.quad(M.compass, [-0.38, 1.2, 0.05], [0.38, 1.2, 0.05], [0.38, 1.96, 0.05], [-0.38, 1.96, 0.05], [0, 0, 1]);
    P.pop();
    P.pop();
  });
  const ph = K.ctx.physics;
  if (ph) {
    const c = stWorld(0, 0); ph.addBox(c.x, c.z, 2 * hx + 0.2, 2 * hz + 0.2, ST.rot, 0, 10);
    const cn = stWorld(-2.6, dyx); ph.addBox(cn.x, cn.z, 2.3, 0.9, ST.rot, 0, 1.4);
    const an = stWorld(1.8, dyx - 0.35); ph.addCylinder(an.x, an.z, 0.45, 0, 2.5);
    const bn = stWorld(0.05, dyx - 0.15); ph.addBox(bn.x, bn.z, 1.8, 0.5, ST.rot, 0, 0.55);
    const sg = stWorld(-hx + 0.6, hz + 2.4); ph.addCylinder(sg.x, sg.z, 0.14, 0, 2.0);
  }
  { const c = stWorld(0, 0); K.svc.monuments.push({ id: STANDART.id, name: 'Верфь «Штандарт»', x: c.x, z: c.z, h: 8.5 });
    const p = stWorld(-2.6, dyx + 3.2), q = stWorld(-2.6, dyx); K.svc.photoSpots.push({ x: p.x, z: p.z, yaw: Math.round(L.yawToward(p.x, p.z, q.x, q.z)), name: 'Верфь «Штандарт»: чугунная пушка и якорь' }); }
  shared.standart = { cannon: stWorld(-2.6, dyx), anchor: stWorld(1.8, dyx - 0.35), bench: stWorld(0.05, dyx - 0.15), sign: stWorld(-hx + 0.6, hz + 2.4) };
}
