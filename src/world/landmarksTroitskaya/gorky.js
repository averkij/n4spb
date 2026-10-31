// landmarksTroitskaya/gorky.js - the monument to MAXIM GORKY at the head of Kamennoostrovsky pr. (1968; OSM n1029463448 at (-1757.5, -2711.3) on the traffic island of Kronverksky pr.).
// Dossier docs/research/troitskaya.md section 5, photos refs/troitskaya 92 95: a bronze standing figure in a long open coat, the hat in the lowered right hand, the left hand at the pocket,
// moustache, the head turned a little to the left; ~4.8 m on a polished red granite pedestal 3.5 m with the facsimile «М. Горький»; a low two-step granite platform with red flower beds; blue
// spruces behind.  The figure comes from the shared kit (lib/figures.js, docs/FIGURES.md); it looks to the SE (toward the Trinity Bridge), as the square pad of the island is turned.
import * as G from './geo.js';
import { human, cached, figureMats } from '../lib/figures.js';
import { coverFn, fillPolyClipped } from './surfaces.js';
import { plantTrees } from './trees.js';

export const GORKY = { x: -1757.5, z: -2711.3, rot: 0.715, scale: 2.75, ped: 3.95 };

export function gorkyFigure() {
  return cached('lmT-gorky', () => human({
    detail: 0.8, body: { muscle: 0.2, bulk: 1.05, shoulders: 1.04 },
    pose: {
      pelvis: [0, 0.95, 0], pelvisRot: [-0.02, 0.06, 0], spine: [-0.05, 0.06, 0], head: [-0.06, 0.28, 0],
      legs: { L: { foot: [0.13, 0, 0.14], yaw: 0.28 }, R: { foot: [-0.12, 0, -0.06], yaw: -0.22 } },
      arms: { L: { hand: [0.25, 0.93, 0.1], pole: [0.8, -0.2, -0.6], grip: 'fist' }, R: { hand: [-0.31, 0.84, 0.04], pole: [-0.8, -0.2, -0.6], grip: 'hold', palm: [0.9, 0, 0.2] } },
    },
    outfit: { torso: 'coat', hem: 0.62, flare: 0.3, folds: 0.05, open: 0.45, sleeves: 'long', trousers: 'long', boots: 0.1, collar: 'fall', buttons: false },
    face: { age: 0.6, hair: 'short', beard: 'moustache', brow: 0.8, jaw: 1.05, mouth: 'stern', seed: 68 },
  }));
}

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics, cover = coverFn(ctx);
  const { x, z, rot, scale: s, ped } = GORKY;
  const cs = Math.cos(rot), sn = Math.sin(rot), W = (mx, mz) => [x + mx * cs + mz * sn, z - mx * sn + mz * cs];
  const pad = [W(-5.2, -5.2), W(5.2, -5.2), W(5.2, 5.2), W(-5.2, 5.2)];
  fillPolyClipped(P, M.pavers, pad, 0.05, cover, { maxEdge: 3, tile: 2 });
  P.push(x, 0, z, rot);
  // two-step platform, flower beds on its corners, the pedestal with base and cap
  P.box(M.redGranite, -3.6, 3.6, 0, 0.22, -3.6, 3.6, 'b', 2); P.box(M.redGranite, -2.7, 2.7, 0.22, 0.45, -2.7, 2.7, 'b', 2);
  for (const [bx, bz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { P.box(M.graniteLightK, bx * 3.15 - 0.42, bx * 3.15 + 0.42, 0.22, 0.4, bz * 1.3 - 1.25, bz * 1.3 + 1.25, 'b'); P.box(M.flowers, bx * 3.15 - 0.34, bx * 3.15 + 0.34, 0.4, 0.52, bz * 1.3 - 1.17, bz * 1.3 + 1.17, 'b'); }
  P.box(M.redGranite, -1.15, 1.15, 0.45, 0.8, -1.15, 1.15, 'b', 2);
  P.box(M.redGranite, -0.98, 0.98, 0.8, ped - 0.22, -0.98, 0.98, 'b', 2);
  P.box(M.redGranite, -1.08, 1.08, ped - 0.22, ped, -1.08, 1.08, 'b', 2);
  G.pane(P, M.text('М. Горький', { w: 512, h: 128, fg: '#3a1f1a', font: ctx.tex.FONTS.hand }), -0.7, 0.7, 1.9, 2.25, 0.99);
  // the bronze figure and the hat in the right hand
  const mk = figureMats(ctx).keys('bronze', 'bronze');
  gorkyFigure().place(P, mk, 0, ped, 0, 0, s);
  const hx = -0.34 * s, hy = ped + 0.78 * s, hz = 0.06 * s;
  P.cyl(mk.main, [hx - 0.02, hy, hz], [hx - 0.1, hy, hz], 0.42, 0.42, 14, true); P.cyl(mk.main, [hx - 0.1, hy, hz], [hx - 0.42, hy, hz], 0.25, 0.22, 12, true);
  P.pop();
  ph.addBox(x, z, 2.4, 2.4, rot, 0, ped + 5);
  for (const [mx, mz] of [[-3.15, 0], [3.15, 0]]) { const w = W(mx, mz); ph.addBox(w[0], w[1], 0.9, 5.2, rot, 0, 0.5); }
  // blue spruces behind the monument (photo 95)
  const sp = [[-4.4, -3.6, 1.15], [4.4, -3.6, 1.05], [-4.6, 1.6, 0.8], [4.6, 1.6, 0.75]].map(([mx, mz, sc]) => { const w = W(mx, mz); return { x: w[0], z: w[1], fam: 'spruceA', s: sc, yaw: mx, y: 0.05 }; }).filter((t) => cover(t.x, t.z) < -1.0);
  plantTrees(K, sp, 'lmT-gorkySpruces');
  K.svc.trees.push(...sp.map((t) => ({ x: t.x, z: t.z, r: 2 * t.s, h: 9 * t.s })));
  K.svc.monuments.push({ id: 'n1029463448', name: 'Памятник М. Горькому', x, z, h: ped + 1.75 * s });
  const p = W(0, 13);
  K.svc.photoSpots.push({ x: p[0], z: p[1], yaw: Math.atan2(-(x - p[0]), -(z - p[1])) * 180 / Math.PI, pitch: 12, name: 'Памятник Горькому' });
  K.svc.crowd.push({ id: 'gorky', kind: 'photo', x: W(0, 9)[0], z: W(0, 9)[1], r: 3, n: 5 });
}
