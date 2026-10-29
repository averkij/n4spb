// landmarksPribaltiyskaya/nakhimov.js - the NAKHIMOV monument (П. С. Нахимов, G. V. Lukyanov, architect I. V. Verzhbitskaya, unveiled 5 July 2012; OSM n3617365016) in the park «Малые Гаванцы» and the round GLASS BUILDING of the
// park (OSM w23010318, Нахимова 26: three storeys of dark blue-green glass bands over white spandrels, ~13 m).  The statue: bronze 3.6 m in a forage cap, epaulettes, a double-breasted frock coat, the spyglass in both hands, the
// sabre at the left hip, on a bronze rock plinth; the pedestal 3.6 m of polished dark red-brown granite (base slabs 3.0 x 2.6 x 0.30 and 2.4 x 2.1 x 0.35, the tapering shaft 1.75 x 1.6 -> 1.5 x 1.4 m, 2.75 m, a cap 0.2 m) with the gilt
// inscription «АДМИРАЛ / НАХИМОВ.»; a pink-red granite pad 5 x 4 m round the base.  Dossier docs/research/pribaltiyskaya.md section 9 ([C15] [C16]; the facing is a builder decision: toward the hotel, bearing 245 deg).
// The park itself (r19581548, its trees, benches, flower beds and the black fence) stays the generic city's.
import * as L from '../layout.js';
import { HF, NK, ringOf } from './frame.js';
import { taper, prism, ringBoxes } from './ring.js';
import { nakhimovFig } from './figs.js';
import { figureMats } from '../lib/figures.js';

const ROT = (() => { const b = 245 * Math.PI / 180, dx = Math.sin(b), dz = -Math.cos(b); return Math.atan2(dx, dz); })();      // model +z toward bearing 245 deg (WSW, the hotel)

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics, fm = figureMats(ctx), mk = { main: M.bronzeFig, dark: fm.dark, accent: M.bronzeFig };
  P.push(NK.x, 0, NK.z, ROT);
  try {
    P.box(M.pad, -2.5, 2.5, 0.05, 0.06, -2.0, 2.0, 'b', 3);                                          // the pink-red granite pad
    P.box(M.graniteDark, -1.5, 1.5, 0.06, 0.3, -1.3, 1.3, 'b', 2);                                    // base slab 3.0 x 2.6
    P.box(M.graniteDark, -1.2, 1.2, 0.3, 0.65, -1.05, 1.05, 'b', 2);                                  // base slab 2.4 x 2.1
    taper(P, M.graniteDark, 0, 0, 1.75, 1.6, 1.5, 1.4, 0.65, 3.4, 2, true);                           // the shaft
    P.box(M.graniteTop, -0.95, 0.95, 3.4, 3.6, -0.85, 0.85, 'b', 2);                                  // the cap
    const rock = new K.THREE.SphereGeometry(0.5, 12, 8); P.geo(M.bronzeMask, rock, 0, 3.7, 0, 0, 0, 0, 1.5, 0.28, 1.2); rock.dispose();   // the bronze rock plinth
    P.quad(M.nakh, [-0.55, 2.55, 0.72 + 0.02], [0.55, 2.55, 0.72 + 0.02], [0.55, 3.1, 0.72 + 0.02], [-0.55, 3.1, 0.72 + 0.02], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);   // the gilt inscription
    nakhimovFig().place(P, mk, 0, 3.6 + 0.25, 0, 0, 3.35 / 1.75);
  } finally { P.pop(); }
  ph.addBox(NK.x, NK.z, 3.0, 2.6, ROT, 0, 8);
  // ---- the round glass building of the park: the baked ring extruded 13 m, glass on the arc, plain panels on the straight sides
  const wr = ringOf('w23010318', null);
  if (wr) {
    const ring = wr.map(([x, z]) => { const q = HF.M(x, z); return [q.a, q.b]; });
    P.push(HF.x, 0, HF.z, HF.rot);
    try { prism(P, ring, 0, 13.0, { wall: (e) => (e.len < 8 ? M.cylGlass : M.pavilion), top: M.cylRoof }, { uvs: 13 / 3 }); } finally { P.pop(); }
    ringBoxes(ph, HF, ring, 0, 14, 0.8, true);
    const c = wr.reduce((s, p) => [s[0] + p[0] / wr.length, s[1] + p[1] / wr.length], [0, 0]);
    K.svc.monuments.push({ id: 'w23010318', name: 'Круглое здание сквера Малые Гаванцы', x: c[0], z: c[1], h: 13 });
  }
  K.svc.monuments.push({ id: 'n3617365016', name: 'Памятник адмиралу П. С. Нахимову (Г. В. Лукьянов, 2012)', x: NK.x, z: NK.z, h: 7.2 });
  const sx = NK.x + Math.sin(ROT) * 9, sz = NK.z + Math.cos(ROT) * 9;
  K.svc.photoSpots.push({ name: 'Памятник Нахимову в сквере Малые Гаванцы', x: sx, z: sz, yaw: L.yawToward(sx, sz, NK.x, NK.z), pitch: 25 });
  K.svc.crowd.push({ id: 'nakhimov-visitors', kind: 'photo', x: sx, z: sz, r: 3, n: 3 });
}
