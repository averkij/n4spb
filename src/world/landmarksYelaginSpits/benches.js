// landmarksYelaginSpits/benches.js - the two granite benches of the returns (OSM n11283867340 / n11283867339; photos spit 01, 09-12, 18): a granite seat slab 3.65 x 0.5 m, 0.20 m thick with a rolled front lip, its top 0.45 m above the
// terrace, on three massive S-shaped (volute) granite legs (the two end ones 0.34 m wide), the back of the bench is the parapet of the return.  The legs are one extruded S profile (~100 triangles), the seat one box per bench.
import * as THREE from 'three';
import { TERRACE, PARAPET_T, world, ROT, local } from './frame.js';
import { CORNERS, RET_LEN } from './wall.js';

const SEAT_TOP = 0.45, SEAT_T = 0.2, DEPTH = 0.5, LEG_W = 0.22, END_W = 0.34;
const Z0 = -5.6, Z1 = -1.95;                                     // z' range in the corner frame (the plinth ends at -1.9)

/** the S leg: shape in (d, h): d from the return face outward, h up to the seat underside; extruded 0.22 m along the bench */
function legGeometry(sign) {
  const hh = SEAT_TOP - SEAT_T, s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(0.30, 0);
  s.bezierCurveTo(0.17, 0.04, 0.13, 0.12, 0.17, hh * 0.58);
  s.bezierCurveTo(0.21, hh * 0.84, 0.38, hh * 0.80, DEPTH, hh);
  s.lineTo(0, hh); s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: LEG_W, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -LEG_W / 2);
  const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
  for (let i = 0; i < p.count; i++) u.setXY(i, p.getX(i) * 0.8 + p.getZ(i), p.getY(i) * 0.8);
  if (sign < 0) { for (let i = 0; i < p.count; i++) { p.setX(i, -p.getX(i)); n.setX(i, -n.getX(i)); } const ix = g.index; if (ix) for (let i = 0; i < ix.count; i += 3) { const t = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, t); } else { /* non-indexed: swap the vertex pairs */ for (let i = 0; i < p.count; i += 3) for (const arr of [p, n, u]) { const sz = arr.itemSize; for (let k = 0; k < sz; k++) { const a = arr.getComponent(i + 1, k); arr.setComponent(i + 1, k, arr.getComponent(i + 2, k)); arr.setComponent(i + 2, k, a); } } } }
  g.computeBoundingSphere();
  return g;
}

export function benches(ctx, P, M, svc) {
  const legs = { 1: legGeometry(1), '-1': legGeometry(-1) };
  for (const c of CORNERS) {
    const sg = c.sx, face = sg * (PARAPET_T + 0.03), x0 = sg > 0 ? face : face - DEPTH, x1 = sg > 0 ? face + DEPTH : face;
    P.push(c.a, 0, c.b, c.psi);
    P.boxT(M.granite, x0, x1, TERRACE + SEAT_TOP - SEAT_T, TERRACE + SEAT_TOP, Z0, Z1, '', 3, 3, 0);
    P.boxT(M.granite, sg > 0 ? x1 - 0.0 : x0 - 0.05, sg > 0 ? x1 + 0.05 : x0, TERRACE + SEAT_TOP - SEAT_T - 0.04, TERRACE + SEAT_TOP + 0.03, Z0, Z1, sg > 0 ? 'l' : 'r', 3, 3, 0);              // the rolled front lip of the seat
    for (const [z, wsc] of [[Z1 - END_W / 2, END_W / LEG_W], [(Z0 + Z1) / 2, 1], [Z0 + END_W / 2, END_W / LEG_W]]) P.geo(M.granite, legs[sg], face, TERRACE, z, 0, 0, 0, 1, 1, wsc);
    P.pop();
    // collider (world): the seat block, solid between the terrace and 0.8 m
    const xm = (x0 + x1) / 2, zm = (Z0 + Z1) / 2, ca = Math.cos(c.psi), sa = Math.sin(c.psi);
    const a = c.a + xm * ca + zm * sa, b = c.b - xm * sa + zm * ca;
    const [wx, wz] = world(a, b);
    ctx.physics.addBox(wx, wz, DEPTH, Z1 - Z0, ROT + c.psi, TERRACE - 0.1, TERRACE + 0.75);
    svc.benches.push({ x: wx, z: wz, rotY: ROT + c.psi, len: Z1 - Z0, granite: true });
  }
}
void RET_LEN; void local;
