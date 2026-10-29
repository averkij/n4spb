// landmarksPribaltiyskaya/waterville.js - the former aquapark WATERVILLE (Вотервиль / Питерлэнд-2, 2006; OSM w17559985, closed 2016): a 107 m body with a convex glass west front (3 x 3 m curtain-wall grid, blue-green glass),
// chamfered pink end blocks (#b39695) and a 72 m neck toward the hotel, 13.8 m, a flat roof.  Dossier docs/research/pribaltiyskaya.md section 4.5 [C12] (the ring in frame HF; photos 07 09 20 21 n14).
// A closed building: exterior only, solid.
import { HF, WATERVILLE, WV_H } from './frame.js';
import { prism, ringBoxes } from './ring.js';

export function build(K) {
  const P = K.P, M = K.M;
  P.push(HF.x, 0, HF.z, HF.rot);
  try {
    // edges 0 .. 4 are the convex west front (glass); the rest are the end blocks, the neck and the east side (pink panels)
    prism(P, WATERVILLE, 0, WV_H, { wall: (e) => (e.i < 5 ? M.wvGlass : M.wvPink), top: M.wvRoof }, { uvs: 3 });
  } finally { P.pop(); }
  ringBoxes(K.ctx.physics, HF, WATERVILLE, 0, WV_H + 1, 0.8, true);
  const c = HF.W(0, -200);
  K.svc.monuments.push({ id: 'w17559985', name: 'Бывший аквапарк «Вотервиль»', x: c.x, z: c.z, h: WV_H });
}
