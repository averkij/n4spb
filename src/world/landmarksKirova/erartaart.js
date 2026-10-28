// landmarksKirova/erartaart.js - ERA and ARTA, the two forged-steel figures by Dmitry Zhukov (2009) on the cheek walls of the Erarta stair (docs/research/erarta-detail.md section 2.1 / 2.2; photos a01 a04 a06
// and crops/era_arta.jpg).  Version 2 (2010-10-10): erfig2.js builds both as smooth fluted steel torsos with forged strips, a plated waist, Era's fluted flare and Arta's layered wing, with the sky sheen in the
// vertex colours (no material of their own).  Each stands on a dark steel plate (2.2 x 1.9 x 0.35 m: it covers most of the cheek top) with a white LED tube along its front edge; the nodes of the OSM
// artworks lie 5 m further out (the mapper's guess at the stair foot), the photos put both figures beside the portal piers.
import { FE, ER } from './frame.js';
import { buildEra, buildArta, FIG_H } from './erfig2.js';

const PLATE = { w: 2.2, d: 1.9, h: 0.35, z0: 2.4 };            // plate on the cheek top: z 2.4 .. 4.3 (the portal piers end at r' 2.3)

export function build(K) {
  const { P, M } = K, ph = K.ctx.physics, white = M.col('#ffffff');
  const geos = { era: buildEra(), arta: buildArta() };
  const y = ER.plinth + PLATE.h, zc = PLATE.z0 + PLATE.d / 2 + 0.05;
  FE.push(P);
  for (const [q, which, rot] of [[-7.1, 'era', 0.2], [7.1, 'arta', -0.2]]) {
    P.box(M.eSteel, q - PLATE.w / 2, q + PLATE.w / 2, ER.plinth, y, PLATE.z0, PLATE.z0 + PLATE.d, 'b', 1);                                    // the plate
    P.box(M.eGraniteDark, q - PLATE.w / 2 - 0.03, q + PLATE.w / 2 + 0.03, y - 0.03, y, PLATE.z0 - 0.03, PLATE.z0 + PLATE.d + 0.03, 'b', 1);      // its lip
    P.cyl(M.eLightBar, [q - 0.95, ER.plinth + 0.17, PLATE.z0 + PLATE.d + 0.04], [q + 0.95, ER.plinth + 0.17, PLATE.z0 + PLATE.d + 0.04], 0.035, 0.035, 8, true);   // the white LED tube on the front edge
    P.geo(white, geos[which], q, y, zc, 0, rot, 0, 1, 1, 1);
  }
  P.pop();
  for (const q of [-7.1, 7.1]) { const p = FE.W(q, zc); ph.addCylinder(p.x, p.z, 0.95, 0, ER.plinth + 6.2); K.svc.monuments.push({ id: q < 0 ? 'n800277882' : 'n800277191', name: q < 0 ? 'Эра' : 'Арта', x: p.x, z: p.z, h: ER.plinth + PLATE.h + (q < 0 ? FIG_H.era : FIG_H.arta) }); }
}
