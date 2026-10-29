// landmarksGavan/club.js - the NEVSKY YACHT CLUB piers of Galerny Harbour (docs/research/gavan.md 7.8; photos refs/gavan 47 48 57-61 139 150 151): floating pontoons 2.0 m wide (galvanised frame, grey plank deck, 0.9 m finger piers)
// along the mapped piers w1189608893 / 94 / 95 (west arm) and w1189608899 / 900 (second marina), and 14-20 boats made of two instanced models: white motor cruisers (blue stripe) and sailing yachts with bare white masts.
// Private club: exterior only (the pontoons are not walkable).  The generic stages and boats of environment stay out through KEEP_OUT / the claimed PIERS ids (groups.js).  Everything repeated is instanced.
import * as THREE from 'three';
import * as L from '../layout.js';
import { PIERS } from '../data/city.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { addFloatBlock } from '../lib/craft-solids.js';      // n4spb (docs/water-transport-boat-collisions.md): the pontoons and the moored boats are solid for the motor boat

const IDS = ['w1189608893', 'w1189608894', 'w1189608895', 'w1189608899', 'w1189608900'];
const WATER = -3.4, DECK = WATER + 0.42;

export function build(Q) {
  const P = Q.P, M = Q.M, rng = Q.ctx.rng(4471);
  const wet = (x, z) => { try { return !!L.waterwayAt(x, z); } catch (e) { return false; } };
  const hull = (PP, w, len, hgt, mainMat, stripe) => {
    const pts = [[-w * 0.5, -len * 0.5], [w * 0.5, -len * 0.5], [w * 0.55, len * 0.12], [w * 0.33, len * 0.36], [0, len * 0.5], [-w * 0.33, len * 0.36], [-w * 0.55, len * 0.12]];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = dz / l, nz = -dx / l;
      PP.quad(mainMat, [a[0], -0.5, a[1]], [b[0], -0.5, b[1]], [b[0], hgt, b[1]], [a[0], hgt, a[1]], [nx, 0, nz]);
      PP.quad(stripe, [a[0] * 1.002, hgt - 0.5, a[1]], [b[0] * 1.002, hgt - 0.5, b[1]], [b[0] * 1.002, hgt - 0.28, b[1]], [a[0] * 1.002, hgt - 0.28, a[1]], [nx, 0, nz]);
    }
    PP.cap(M.boatDeck, pts, hgt, true, 2);
  };
  const cruiser = partsGeos((PP) => {
    hull(PP, 3.0, 9.0, 0.9, M.boatWhite, M.boatBlue);
    PP.box(M.boatWhite, -1.1, 1.1, 0.9, 2.1, -3.0, 0.8, '', 2); PP.box(M.glassDark, -1.12, 1.12, 1.35, 1.8, -2.8, 0.6, '', 1); PP.box(M.boatWhite, -1.2, 1.2, 2.1, 2.2, -3.1, 0.9, '', 2);
  });
  const yacht = partsGeos((PP) => {
    hull(PP, 2.6, 8.0, 0.75, M.boatWhite, M.boatBlue);
    PP.box(M.boatWhite, -0.8, 0.8, 0.75, 1.45, -1.8, 1.0, '', 2); PP.box(M.glassDark, -0.82, 0.82, 1.0, 1.25, -1.6, 0.8, '', 1);
    PP.cyl(M.mastWhite, [0, 0.75, 0.9], [0, 11.5, 0.9], 0.07, 0.04, 6, false); PP.cyl(M.mastWhite, [0, 2.2, 0.9], [0, 2.3, -2.6], 0.045, 0.045, 5, false);
  });
  const mC = [], mY = [];
  for (const p of PIERS) {
    if (!IDS.includes(p.id)) continue;
    const pts = []; for (let i = 0; i < p.pts.length; i += 2) pts.push([p.pts[i], p.pts[i + 1]]);
    let acc = 0, nextF = 3;
    for (let i = 0; i + 1 < pts.length; i++) {
      const A = pts[i], B = pts[i + 1], dx = B[0] - A[0], dz = B[1] - A[1], len = Math.hypot(dx, dz); if (len < 2) continue;
      const rot = Math.atan2(-dz, dx);
      P.push(A[0], 0, A[1], rot);
      P.box(M.plank, 0, len, WATER - 0.1, DECK, -1.0, 1.0, 'b', 2);                                       // the pontoon deck on its galvanised frame
      P.box(M.steel, 0, len, WATER - 0.1, WATER + 0.18, -1.05, 1.05, 'tb', 2);
      P.pop();
      addFloatBlock(Q.ctx.physics, A[0] + dx / 2, A[1] + dz / 2, len + 0.04, 2.5, rot, WATER);      // n4spb (docs/water-transport-boat-collisions.md): a pontoon is solid for the motor boat, like the Rumyantsev pontoons (no walker stands on it: private club)
      const ux = dx / len, uz = dz / len, nx = -uz, nz = ux;
      while (nextF <= acc + len) {
        const s = nextF - acc, cx = A[0] + ux * s, cz = A[1] + uz * s;
        for (const side of [-1, 1]) {
          const fx = cx + nx * side * 3.0, fz = cz + nz * side * 3.0, bx = cx + nx * side * 5.2, bz = cz + nz * side * 5.2;
          if (!wet(bx, bz)) continue;
          P.push(cx + nx * side * 1.0, 0, cz + nz * side * 1.0, Math.atan2(-nz * side, nx * side));
          P.box(M.plank, 0, 4.0, WATER - 0.1, DECK, -0.45, 0.45, 'b', 2);                                // a finger pier
          P.pop();
          const fr = Math.atan2(-nz * side, nx * side);
          addFloatBlock(Q.ctx.physics, cx + nx * side * 3.0, cz + nz * side * 3.0, 4.04, 1.3, fr, WATER);      // n4spb: the finger pier is a float block too (the same frame as the drawn box above)
          const ry = Math.atan2(nx * side, nz * side) + (rng() - 0.5) * 0.12;                              // boat across the finger, bow out
          const bxo = ux * (rng() < 0.5 ? 1.6 : -1.6), bzo = uz * (rng() < 0.5 ? 1.6 : -1.6), sc = 0.9 + rng() * 0.25;      // (the same call order as the source: the rng sequence is unchanged)
          const m = mat4(fx + nx * side * 0.9 + bxo, WATER + 0.02, fz + nz * side * 0.9 + bzo, ry, sc);
          const isY = rng() < 0.55;
          if (isY) mY.push(m); else mC.push(m);
          addFloatBlock(Q.ctx.physics, fx + nx * side * 0.9 + bxo, fz + nz * side * 0.9 + bzo, (isY ? 2.6 : 3.0) * sc, (isY ? 8.0 : 9.0) * sc, ry, WATER);      // n4spb: a moored hull is solid for the motor boat (a ship hull is a structure)
          void bx; void bz;
        }
        nextF += 8;
      }
      acc += len;
    }
  }
  const r1 = addInstanced(Q.ctx, Q.root, 'lmgavan-cruisers', cruiser, mC), r2 = addInstanced(Q.ctx, Q.root, 'lmgavan-yachts', yacht, mY);
  Q.extraTris += r1.tris + r2.tris;
  void THREE;
}
