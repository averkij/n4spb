// landmarksBotanicalGarden/houses2.js - the small HOUSES of the garden drawn from their baked footprints with the ring-house vocabulary (house.js): none of them is photographed except the first, so their colours
// are the OSM ones and their forms follow the footprint, the levels and the roof tag of the record [?]:
//   * the GREEN HOUSE (Зелёный домик, w28692704, 29 x 14 m, one storey, hipped): mint clapboard (#86b09c), a low stone base, white-framed windows, a grey tin hip roof with three dormers on each long slope (photo 46
//     "the workers' house": a long low green wooden house on a lawn, the roof with three dormers);
//   * lit V (r13561492, 2 storeys, hipped, OSM colour #867762 grey-brown stucco), lit K (w28692702, 3 storeys, stucco), the laboratory lit M (w28692697, 2 storeys, hipped, light stucco, zinc roof).
import { ringOf } from './frame.js';
import { ringHouse, rectOf, dormerAt } from './house.js';
import { stage } from './shell.js';

export function build(K) {
  const M = K.M;
  stage(K, 'green house', () => {
    const ring = ringOf('w28692704');
    const res = ringHouse(K, ring, { baseH: 0.55, baseMat: M.plinth, wallMat: M.clapMint, wallUvs: 1.2, y1: 3.1, floors: [{ y0: 0.95, h: 1.6, w: 1.1 }], pitch: 3.0, margin: 1.5, surround: 'none',
      cornice: { h: 0.25, d: 0.3 }, roofMat: M.zinc, roofSlope: 0.42, over: 0.5 });
    const rc = rectOf(ring);
    if (res.roofH && rc) for (const s of [-1, 1]) for (const lx of [-8, 0, 8]) {
      const w = rc.fr.w(lx, s * (rc.z1 - rc.z0) * 0.27), dz = s * 1, dir = [Math.sin(rc.fr.rot) * 0 + (-Math.sin(rc.fr.rot)) * 0, 0];
      void dir;
      const ux = Math.cos(rc.fr.rot) * 0, wx = rc.fr.w(0, s * 1)[0] - rc.fr.cx, wz = rc.fr.w(0, s * 1)[1] - rc.fr.cz;
      dormerAt(K, res.roofH, w[0], w[1], wx, wz, { w: 1.1, h: 1.1, win: 'winI', roofMat: M.zinc, wallMat: M.white }); void ux; void dz;
    }
  });
  stage(K, 'lit V', () => ringHouse(K, ringOf('r13561492'), { baseH: 0.9, baseMat: M.plinth, wallMat: M.grey, y1: 6.6, floors: [{ y0: 1.3, h: 1.7, w: 1.1 }, { y0: 4.3, h: 1.8, w: 1.15 }], pitch: 3.2, margin: 1.6, cornice: { h: 0.3, d: 0.35 }, roofMat: M.zinc, roofSlope: 0.4, over: 0.5, surround: 'none' }));
  stage(K, 'lit K', () => ringHouse(K, ringOf('w28692702'), { baseH: 1.0, baseMat: M.plinth, wallMat: M.ochre, y1: 9.9, floors: [{ y0: 1.2, h: 1.8, w: 1.2 }, { y0: 4.4, h: 2.0, w: 1.25 }, { y0: 7.7, h: 1.9, w: 1.25 }], pitch: 3.3, margin: 1.6, cornice: { h: 0.35, d: 0.4 }, roofMat: M.zinc, roofSlope: 0.3, over: 0.5, surround: 'none' }));
  stage(K, 'lit M', () => ringHouse(K, ringOf('w28692697'), { baseH: 0.8, baseMat: M.plinth, wallMat: M.white, y1: 6.6, floors: [{ y0: 1.2, h: 1.8, w: 1.5 }, { y0: 4.1, h: 1.9, w: 1.5 }], pitch: 3.4, margin: 1.6, cornice: { h: 0.3, d: 0.3 }, roofMat: M.zinc, roofSlope: 0.4, over: 0.45, surround: 'none' }));
  for (const [id, name] of [['w28692704', 'Зелёный домик'], ['r13561492', 'Служебный дом (литера В)'], ['w28692702', 'Служебный дом (литера К)'], ['w28692697', 'Лаборатория (литера М)']]) {
    const r = ringOf(id); if (!r) continue;
    const c = r.reduce((a, p) => [a[0] + p[0] / r.length, a[1] + p[1] / r.length], [0, 0]);
    K.svc.monuments.push({ id, name, x: c[0], z: c[1], h: 8 });
  }
  if (K.errs && K.errs.length) throw new Error('houses2: ' + K.errs.join('\n'));
}
