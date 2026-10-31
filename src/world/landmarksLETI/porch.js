// landmarksLETI/porch.js - the west PORCH BLOCK of Corpus 1 (edge 28 of r1915364, 21.6 m, normal WNW; the main entrance n1547973236 (-1751, -4380.4); photo leti/01): two corner pylons (the Lenin plate on the south one),
//   ground floor: a pair of arched windows, a narrow window and the entrance on each side of the axis; the dark double door in a shut arch (the door is closed: interiors are not modelled), a granite landing 1.52 m high
//   with five steps, two free-standing columns with Corinthian-like capitals carrying a stone balcony with a balustrade; upper floor: five tall arched windows (the hall behind); the plan is symmetric about the axis.
//   Facade frame of the edge: x along the wall as seen from outside, z out; the entrance axis xm = L / 2.
import { holedWall, pane } from './facade.js';
import { arch, rect, boxL, walkL, cylL } from './shell.js';
import { H, Frame } from './frame.js';
import { onBoth, archRing, pylon, localOnEdge, frameOf } from './c1common.js';
import { tube } from './geo.js';
import { plaqueUV } from './art.js';
import { makeLabels } from '../streets/labels.js';

export const PORCH = { landTop: 1.52, landD: 2.6, nStep: 5, tread: 0.38, colD: 2.45, colZ: 1.5, colTop: 5.05, balTop: 5.65 };

export function build(K, e) {
  const M = K.M, P = K.P, D = K.D, ctx = K.ctx, L = e.len, xm = L / 2, PC = PORCH;
  onBoth(K, e, (len, f) => {
    const holes = [];
    for (const s of [-1, 1]) {
      holes.push(arch(xm + s * 6.1, H.winG0, 1.15, 2.85, 'winA'), arch(xm + s * 7.6, H.winG0, 1.15, 2.85, 'winA'));
      holes.push(rect(xm + s * 3.95, 2.5, 0.9, 2.1, 'winR', 0.12));
      holes.push(arch(xm + s * 4.7, H.winU0, 2.2, 5.4, 'winB'), arch(xm + s * 7.7, H.winU0, 2.2, 5.4, 'winB'));
    }
    holes.push(arch(xm, H.winU0 - 0.6, 3.0, 6.2, 'winB'));
    holes.push(arch(xm, H.plinth, 2.5, 3.9, 'door'));
    holedWall(P, M.stripe, 0, L, H.plinth - 0.05, H.wall, holes, { depth: 0.55, uvs: 2.4, noEnds: true, seg: 7 });
    for (const h of holes) pane(P, M[h.mat], h, 0.55);
    for (const h of holes) {
      if (h.arch) {
        const upper = h.y0 > 5, door = h.mat === 'door';
        archRing(D, M.stucco, h.cx, h.y0, h.w, h.h, door ? 0.35 : upper ? 0.3 : 0.17, door ? 0.14 : upper ? 0.1 : 0.07, 8);
        if (!door) D.box(M.stucco, h.cx - h.w / 2 - (upper ? 0.34 : 0.2), h.cx + h.w / 2 + (upper ? 0.34 : 0.2), h.y0 - 0.13, h.y0 - 0.02, 0, upper ? 0.2 : 0.14, 'kb');
      } else D.box(M.stucco, h.x0 - 0.1, h.x1 + 0.1, h.y0 - 0.12, h.y0 - 0.02, 0, 0.14, 'kb');
    }
    // pylons: the corner ones are wide, the pilasters between the pairs and the entrance are slim
    for (const x of [0.9, L - 0.9]) pylon(D, M, x, 1.8, 0.7);
    for (const s of [-1, 1]) for (const d of [2.8, 5.05]) pylon(D, M, xm + s * d, 0.5, 0.2);
    for (const s of [-1, 1]) { const x = xm + s * 9.0; D.box(M.stucco, x - 0.28, x + 0.28, H.plinth, H.wall, 0, 0.18, 'kb', 2.4); }
    // landing, steps
    P.box(M.conc, xm - 3.4, xm + 3.4, 0, PC.landTop, 0, PC.landD, 'kt', 2.4);
    P.quad(M.conc, [xm - 3.4, PC.landTop, PC.landD], [xm + 3.4, PC.landTop, PC.landD], [xm + 3.4, PC.landTop, 0.0], [xm - 3.4, PC.landTop, 0.0], [0, 1, 0], [[0, 1], [3, 1], [3, 0], [0, 0]]);
    for (let i = 0; i < PC.nStep - 1; i++) {
      const z0 = PC.landD + i * PC.tread, z1 = z0 + PC.tread, top = PC.landTop * (1 - (i + 1) / PC.nStep), w = 3.4 + 0.12 * (i + 1);
      P.box(M.conc, xm - w, xm + w, 0, top, z0, z1, 'kbt', 2.4);
      P.quad(M.conc, [xm - w, top, z1], [xm + w, top, z1], [xm + w, top, z0], [xm - w, top, z0], [0, 1, 0], [[0, 1], [3, 1], [3, 0], [0, 0]]);
    }
    // the columns and the balcony
    for (const s of [-1, 1]) {
      const cx = xm + s * PC.colD;
      P.box(M.stucco, cx - 0.46, cx + 0.46, PC.landTop, PC.landTop + 0.28, PC.colZ - 0.46, PC.colZ + 0.46, 'b', 1.5);
      tube(P, M.stucco, cx, PC.colZ, PC.landTop + 0.28, PC.colTop - 0.6, 0.38, 0.32, 14, 3, 3);
      tube(P, M.stucco, cx, PC.colZ, PC.colTop - 0.6, PC.colTop - 0.1, 0.32, 0.5, 14, 3, 0.5);                  // the capital, flaring
      P.box(M.stucco, cx - 0.56, cx + 0.56, PC.colTop - 0.1, PC.colTop, PC.colZ - 0.56, PC.colZ + 0.56, '', 1.5);   // the abacus
    }
    P.box(M.stucco, xm - 3.3, xm + 3.3, PC.colTop, PC.balTop, 0, 2.3, 'k', 1.8);                                   // the entablature / balcony slab
    const bz = 2.2, bx = 3.2;
    P.quad(M.bal, [xm - bx, PC.balTop, bz], [xm + bx, PC.balTop, bz], [xm + bx, PC.balTop + 1.0, bz], [xm - bx, PC.balTop + 1.0, bz], [0, 0, 1], [[0, 0], [bx * 2 / 2, 0], [bx * 2 / 2, 1], [0, 1]]);
    for (const s of [-1, 1]) P.quad(M.bal, [xm + s * bx, PC.balTop, 0.1], [xm + s * bx, PC.balTop, bz], [xm + s * bx, PC.balTop + 1.0, bz], [xm + s * bx, PC.balTop + 1.0, 0.1], [s, 0, 0], [[0, 0], [1.1, 0], [1.1, 1], [0, 1]]);
    // the Lenin plate on the pylon nearest to its OSM node
    const lab = ctx.services.labels || (ctx.services.labels = makeLabels()), u = localOnEdge(e, -1753.3, -4371.4).u, px = u < xm ? 0.9 : L - 0.9;
    const wx = f.x + f.xa[0] * px + e.n[0] * 0.72, wz = f.z + f.xa[1] * px + e.n[1] * 0.72;
    if (lab.reserve('lmleti-lenin-plate', wx, 3.4, wz, 0.72, 1.0, e.n[0], e.n[1], 'plate')) D.quad(M.plaques, [px - 0.36, 2.9, 0.72], [px + 0.36, 2.9, 0.72], [px + 0.36, 3.9, 0.72], [px - 0.36, 3.9, 0.72], [0, 0, 1], plaqueUV(2));
  });
  // colliders in the world frame of the edge
  const ef = frameOf(e), fr = new Frame(ef.x, ef.z, ef.rot);
  walkL(ctx, fr, xm, PC.landD / 2, 6.8, PC.landD, PC.landTop, 0);
  for (let i = 0; i < PC.nStep - 1; i++) {
    const z = PC.landD + (i + 0.5) * PC.tread, p = fr.w(xm, z), it = ctx.physics.addWalkBox(p[0], p[1], 6.8 + 0.24 * (i + 1), PC.tread + 0.04, fr.rot, PC.landTop * (1 - (i + 1) / PC.nStep), 0); it.sticky = true;
  }
  for (const s of [-1, 1]) cylL(ctx, fr, xm + s * PC.colD, PC.colZ, 0.45, PC.landTop, PC.balTop);
  boxL(ctx, fr, xm, 0.35, 2.7, 0.7, PC.landTop, 5.2);                                                        // the shut door in its reveal
  K.svc.entrances.push({ id: 'leti-c1-main', x: fr.w(xm, 3)[0], z: fr.w(xm, 3)[1], rotY: fr.rot, name: 'ЛЭТИ, корпус 1: главный вход (западный портик)', closed: true });
  K.svc.photoSpots.push({ x: fr.w(xm, 22)[0], z: fr.w(xm, 22)[1], yaw: Math.round(fr.rot * 180 / Math.PI), name: 'ЛЭТИ: портик старого здания Векшинского' });
  return fr;
}
