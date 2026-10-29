// landmarksKirova/gate.js - the MAIN SOUTH GATE of the Vasileostrovets garden (Bolshoy end; docs/research/kirova.md 10.1, critic-corrected on gd03 / gd09, horizon method +-15 %):
//   axis (r 191.3, q -242.2) in frame K.  A CENTRAL GATE of 3.4 m clear opening between two stout round columns (shaft D 0.55, plinth 0.8, abacus 0.75, 3.1 m high) with two black iron LEAVES of 1.7 m x 2.6 m
//   (scalloped garland rail, five rings in the lower panel; OPEN: swung inward 90 degrees), a passage of ~1.5 m on each side between the column and the pavilion, and TWO SMALL STUCCOED PAVILIONS at the OSM
//   gate nodes (r 186.1 and 196.5): 2.7 x 3.0 m in plan, 0.6 m plinth, 4.5 m high, round corner columns, an arched niche 0.8 x 2.2 m on the street face and on the inner face, an entablature, a triangular
//   pediment on both faces, a low gable roof of grey sheet metal, no door.  Six concrete flower bowls (D 1.1 m, red bedding) in front of the pavilions; grey asphalt apron outside, cracked asphalt inside
//   for ~25 m (decal, clipped at the real carriageways).  Colliders: pavilions, columns, leaves; the three passages stay open.
// Local frame here: FK pushed (x = r, z = -q), then the gate axis as origin: u = r - 191.3 (along the fence), v toward the street (-q).
import * as THREE from 'three';
import { FK } from './frame.js';
import { coverFn, fillPolyClipped } from './surfaces.js';
import { archPath } from './kit.js';
import { postGeo } from './fence.js';
import { partsGeos, kBays } from './inst.js';
import { unitPanel } from '../lib/fence-bays.js';
import { knockFurniture } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13.7, 15.v): the two gate leaves are breakable bays, the six flower bowls are knock records (planters)

const AX = [191.3, -242.2], PAV = [-5.2, 5.2];

function pavilion(K, cu) {
  const { P, M } = K, w = 2.7, d = 3.0, hw = w / 2, hd = d / 2;
  P.push(cu, 0, 0, 0);                                                                              // origin = the pavilion centre on the fence line
  P.box(M.cream, -hw - 0.1, hw + 0.1, 0, 0.6, -hd - 0.1, hd + 0.1, 'b', 2);                          // plinth
  P.box(M.cream, -hw, hw, 0.6, 3.55, -hd, hd, 'b', 2);                                               // the shaft of the house
  P.box(M.cream, -hw - 0.12, hw + 0.12, 3.55, 3.85, -hd - 0.12, hd + 0.12, '', 2);                    // entablature
  P.box(M.eCap, -hw - 0.16, hw + 0.16, 3.85, 3.9, -hd - 0.16, hd + 0.16, '', 2);
  // gable roof of grey sheet metal with the pediments on the street (+z) and the garden (-z) faces: ridge along z, 4.5 m at the ridge
  const rx = hw + 0.16, rz = hd + 0.16, yb = 3.9, yt = 4.5;
  P.quad(M.gateRoof, [-rx, yb, -rz], [-rx, yb, rz], [0, yt, rz], [0, yt, -rz], [-0.7, 1, 0]);
  P.quad(M.gateRoof, [rx, yb, rz], [rx, yb, -rz], [0, yt, -rz], [0, yt, rz], [0.7, 1, 0]);
  for (const sg of [1, -1]) P.fan(M.cream, [[-rx + 0.1, yb, sg * (rz - 0.02)], [rx - 0.1, yb, sg * (rz - 0.02)], [0, yt - 0.05, sg * (rz - 0.02)]], [0, 0, sg], (p) => [p[0] / 2, p[1] / 2]);
  // the two faces: corner columns (D 0.28), niche pilasters, the arched niche (dark recess) 0.8 x 2.2
  for (const sg of [1, -1]) {
    P.push(0, 0, sg * hd, sg > 0 ? 0 : Math.PI);
    for (const x of [-hw + 0.1, hw - 0.1]) P.cyl(M.cream, [x, 0.6, 0.06], [x, 3.55, 0.06], 0.15, 0.14, 8, false);
    for (const x of [-0.55, 0.55]) P.box(M.eCap, x - 0.07, x + 0.07, 0.6, 3.0, 0, 0.06, 'k', 1);
    const sh = new THREE.Shape(); archPath(sh, 0, 0.7, 0.8, 1.8);
    P.face(M.gateNiche, sh, 0.02, 1);
    P.box(M.eCap, -0.5, 0.5, 2.95, 3.05, 0, 0.07, 'k', 1);
    P.pop();
  }
  P.pop();
}

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx);
  FK.push(P);
  P.push(AX[0], 0, -AX[1], 0);                                                                      // gate axis: local x = r - 191.3, local z = -(q + 242.2)
  for (const cu of PAV) pavilion(K, cu);
  // the two stout round columns of the central gate (centres u = +-2.0)
  for (const u of [-2.0, 2.0]) postGeo(P, M, u, 0, 1.28, 1.07);
  // the leaves, swung inward (toward the garden: local -z), hinged at the inner faces of the columns: 1.7 m wide x 2.6 m high, double sided cut-out
  for (const sg of [-1, 1]) {
    const x = sg * 1.66, z0 = -0.05;
    P.box(M.lampBlack, x - 0.02, x + 0.02, 0.1, 2.8, z0 - 0.02, z0 + 0.02, '', 1);                  // the hinge stile (the leaf itself is a breakable bay below)
  }
  // flower bowls: 3 in front of each pavilion on the street side
  const bowlSpots = [], bowlItems = [];
  const bowlGeo = partsGeos((Q) => {      // one bowl at the origin
    const x = 0, z = 0, du = 0;
    Q.cyl(M.bowl, [x, 0.0, z], [x, 0.1, z], 0.28, 0.4, 10, false); Q.cyl(M.bowl, [x, 0.1, z], [x, 0.5, z], 0.4, 0.58, 12, false); Q.cyl(M.bowl, [x, 0.5, z], [x, 0.58, z], 0.58, 0.52, 12, false);
    Q.cyl(M.col('#c01c2a'), [x, 0.56, z], [x, 0.68, z], 0.52, 0.34, 12, true);
    for (let t = 0; t < 7; t++) { const a = t * 0.9 + du, rr = t ? 0.3 : 0.05; Q.cyl(M.col(t % 3 ? '#d63a3a' : '#5f8a3c'), [x + Math.cos(a) * rr, 0.62, z + Math.sin(a) * rr], [x + Math.cos(a) * rr, 0.84 + 0.06 * (t % 3), z + Math.sin(a) * rr], 0.1, 0.02, 5, false); }
  });
  for (const cu of PAV) for (const du of [-1.1, 0, 1.1]) {
    const x = cu + du, z = 2.3 + (du === 0 ? 0.25 : 0), p = FK.W(AX[0] + x, AX[1] - z);
    if (cover(p.x, p.z) > -0.7) continue;
    bowlSpots.push({ x: p.x, y: 0, z: p.z, rotY: 0 }); bowlItems.push(ph.addCylinder(p.x, p.z, 0.6, 0, 0.7));
  }
  P.pop(); P.pop();
  K.extraTris += knockFurniture(ctx, 'lmKir-bowls', bowlGeo, bowlSpots, bowlItems, { kind: 'planter', mass: 450, h: 0.7, r: 0.6, hitK: 0.35, minDv: 1.2 }, 200);
  // colliders (world): the pavilions, the two columns, the leaves
  for (const cu of PAV) { const p = FK.W(AX[0] + cu, AX[1]); ph.addBox(p.x, p.z, 2.9, 3.2, FK.rot, 0, 4.6); }
  for (const u of [-2.0, 2.0]) { const p = FK.W(AX[0] + u, AX[1]); ph.addCylinder(p.x, p.z, 0.42, 0, 3.2); }
  // the two open leaves (1.7 m x 2.6 m, swung inward): breakable bays, a collider + the cut-out panel + a knock record each (the source: a plain solid thin box)
  const leaves = [-1, 1].map((sg) => { const a = FK.W(AX[0] + sg * 1.66, AX[1] + 0.05), c = FK.W(AX[0] + sg * 1.66, AX[1] + 1.75); return { x0: a.x, z0: a.z, x1: c.x, z1: c.z, y: 0 }; });
  kBays(K, { name: 'lmKir-gate-leaves', bays: leaves, far: 300,
    parts: [{ geo: unitPanel(0.15, 2.75, { u1: 1 }), mat: M.gate, name: 'leaf', stretch: true, shadow: false, receive: false, noOutline: true }],
    collider: { y0: 0, y1: 2.8, thick: 0.06, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 160, h: 2.7, anchored: 12, hitK: 0.4, metal: true, minDv: 0 }) });
  // asphalt apron: grey outside (street side, 16 x 22 m), cracked dusty inside (garden side, 16 x 25 m)
  const ring = (r0, r1, q0, q1) => [[r0, q0], [r1, q0], [r1, q1], [r0, q1]].map(([r, q]) => { const p = FK.W(r, q); return [p.x, p.z]; });
  fillPolyClipped(P, M.gateAsphalt, ring(184.6, 198.0, -262.0, -229.0), 0.052, cover, { margin: 0.4, maxEdge: 4, tile: 3 });
  K.svc.entrances.push({ id: 'garden-south-gate', x: FK.W(AX[0], AX[1]).x, z: FK.W(AX[0], AX[1]).z, rotY: FK.rot, closed: false, name: 'Сад «Василеостровец»' });
}
