// landmarksPribaltiyskaya/creators.js - "Создатели флота России" (E. M. Agayan, architect N. N. Baranov, 1983; OSM node n5182103813): two nude bronze men rising out of a swirled wave, swimming OUTWARD like a pair of wings
// (the left one lifts a small three-masted ship, the right one a cup, the inner arms raised toward the middle), on a tapering red-pink granite pedestal on a low wide slab at the top of the hotel stair (the frame origin).
// Dossier docs/research/pribaltiyskaya.md section 5 (photos 08 22 23 24 26: in photo 24 the figures recline about 50 deg outward, the wave curls between them): slab 5.6 x 3.4 x 0.35, pedestal 2.2 x 1.7 -> 1.8 x 1.4 x 2.7
// (cap 0.12), the group about 2.3 m (the sources say 2.30 / 3.90 m).  The group faces +z (the plaza).
import * as L from '../layout.js';
import { HF, Y } from './frame.js';
import { taper, boxF } from './ring.js';
import { creatorsFigs, creatorsWave, creatorsShip, creatorsCup } from './figs.js';
import { figureMats } from '../lib/figures.js';

const ROLL = 0.9, SC = 1.45, HIP = 0.8, HIP_X = 0.5;       // the figures lean outward by 52 deg about their feet; unit man 1.75 m x 1.45; pelvis height 0.8 (unit); the pelvis sits at x = -+0.5 over the wave

export function build(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics, mk = figureMats(K.ctx).keys('bronze', 'bronze');
  const y0 = Y.terr, P0 = y0 + 0.35, P1 = P0 + 2.7, gy = P1 + 0.12, hipLocal = HIP * SC;
  P.push(HF.x, 0, HF.z, HF.rot);
  try {
    P.box(M.plinth, -2.8, 2.8, y0, P0, -1.7, 1.7, 'b', 2.4);                                               // the low wide base slab
    taper(P, M.graniteRed, 0, 0, 2.2, 1.7, 1.8, 1.4, P0, P1, 2, true);                                     // the pedestal (polished red-pink granite)
    P.box(M.graniteRed, -1.0, 1.0, P1, gy, -0.8, 0.8, 'b', 2);                                             // the cap slab
    creatorsWave().place(P, { main: mk.main }, 0, gy, 0.05, 0, 1.0);
    const figs = creatorsFigs();
    // figure i = 0 (left, sg -1) leans toward -x: Place rolls it about its feet by rz (> 0 turns +y toward -x), so the feet end up near the middle and the pelvis over the wave
    for (let i = 0; i < 2; i++) {
      const sg = i === 0 ? -1 : 1, rz = -sg * ROLL, ox = sg * HIP_X + Math.sin(rz) * hipLocal, oy = HIP - Math.cos(rz) * hipLocal;
      figs[i].place(P, mk, ox, gy + oy, 0.12, 0, SC, 0, rz);
      // the object in the OUTER hand: the figure's hold point rolled with the figure (the ship in the right hand of the left figure, the cup in the left hand of the right one)
      const h = figs[i].info.j.hands[i === 0 ? 'R' : 'L'].hold, hx = h[0] * SC, hy = h[1] * SC, hz = h[2] * SC;
      const px = ox + hx * Math.cos(rz) - hy * Math.sin(rz), py = gy + oy + hx * Math.sin(rz) + hy * Math.cos(rz), pz = 0.12 + hz;
      if (i === 0) creatorsShip().place(P, { main: mk.main }, px, py - 0.08, pz, -0.3, 1.5);
      else creatorsCup().place(P, { main: mk.main }, px, py - 0.02, pz, 0, 1.4);
    }
  } finally { P.pop(); }
  boxF(ph, HF, 0, 0, 5.6, 3.4, y0, y0 + 9);
  const p = HF.W(0, 0);
  K.svc.monuments.push({ id: 'n5182103813', name: 'Создатели флота России (группа Е. М. Агаяна)', x: p.x, z: p.z, h: gy + 2.4 });
  const sp = HF.W(6, 17), t = HF.W(0, 0);
  K.svc.photoSpots.push({ name: 'Группа «Создатели флота России»', x: sp.x, z: sp.z, yaw: L.yawToward(sp.x, sp.z, t.x, t.z), pitch: 22 });
}
