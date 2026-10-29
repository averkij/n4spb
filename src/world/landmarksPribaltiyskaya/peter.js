// landmarksPribaltiyskaya/peter.js - the MONUMENT TO PETER I by Z. K. Tsereteli (2006; OSM w145671729; architects F. K. Romanovsky and A. P. Chernov): 12.65 m in all, standing ON THE ASPHALT of Pribaltiyskaya
// Square 106.6 m ENE of the hotel stair and facing away from the hotel (+z of frame HF).  Dossier docs/research/pribaltiyskaya.md section 6 [C11] (photos n11 16 40 41 42 43 n01):
//   BASE      three granite slabs 8.3 x 8.3 / 7.0 x 7.0 / 4.8 x 4.4 m, 0.5 m each (polished dark red granite), eight stump bollards d 0.45 x 0.9 m with a black chain (sag 0.2 m) round the lowest slab;
//   SHAFT     2.5 (x) x 2.9 (z) x 5.2 m, polished red-cherry granite #7a3f38 with four half-round CORNER pilasters, a bronze oval medallion with a ship's wheel on the FRONT (+z) and the BACK faces,
//             a stepped cap (0.8 m block 2.7 x 3.1, a 0.35 m cap 2.2 x 2.5) and the 0.15 m bronze plinth slab;
//   FIGURE    4.65 m bronze (figs.js peterFig, scale 2.657) + the decree scroll 0.9 x 1.5 m with the founding text (ten lines, art.js) hanging from the right hand.
import * as L from '../layout.js';
import * as THREE from 'three';
import { HF, PETER } from './frame.js';
import { taper, boxF } from './ring.js';
import { peterFig } from './figs.js';
import { figureMats } from '../lib/figures.js';

export function build(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics, fm = figureMats(K.ctx), mk = { main: M.bronzeFig, dark: fm.dark, accent: M.bronzeFig };
  P.push(HF.x, 0, HF.z, HF.rot);
  try {
    P.push(PETER.x, 0, PETER.z, 0);
    // the base: three slabs (0.5 m each) + the eight stump bollards with a chain
    P.box(M.graniteBase, -4.15, 4.15, 0, 0.5, -4.15, 4.15, 'b', 3);
    P.box(M.graniteBase, -3.5, 3.5, 0.5, 1.0, -3.5, 3.5, 'b', 3);
    P.box(M.graniteBase, -2.4, 2.4, 1.0, 1.5, -2.2, 2.2, 'b', 3);
    const sx = 1.25, sz = 1.45, y0 = 1.5, y1 = 6.7;
    taper(P, M.graniteDark, 0, 0, 2 * sx, 2 * sz, 2 * sx, 2 * sz, y0, y1, 2, true);                                   // the shaft
    for (const [x, z] of [[-sx, -sz], [sx, -sz], [sx, sz], [-sx, sz]]) P.cyl(M.graniteDark, [x, y0, z], [x, y1, z], 0.2, 0.2, 10, false);        // the corner pilasters (half out)
    P.box(M.graniteTop, -1.35, 1.35, y1, y1 + 0.8, -1.55, 1.55, 'b', 2);                                                // the cap block
    P.box(M.graniteDark, -1.1, 1.1, y1 + 0.8, y1 + 1.15, -1.25, 1.25, 'b', 2);                                          // the top cap
    P.box(M.bronzeMask, -1.0, 1.0, y1 + 1.15, y1 + 1.3, -1.1, 1.1, 'b', 2);                                             // the bronze plinth slab (the figure stands on it)
    // medallions: a flattened oval boss with a rim ring and a ship's wheel on the front (+z) and back (-z) faces, centre 4.5 m above the shaft foot
    for (const zs of [1, -1]) {
      P.push(0, y0 + 4.5, zs * (sz + 0.005), zs > 0 ? 0 : Math.PI);
      const boss = new THREE.SphereGeometry(0.5, 16, 10); P.geo(M.bronzeMask, boss, 0, 0, 0.02, 0, 0, 0, 1.5, 0.9, 0.12); boss.dispose();
      const rim = new THREE.TorusGeometry(0.5, 0.045, 6, 24); P.geo(M.bronzeFig, rim, 0, 0, 0.06, 0, 0, 0, 1.4, 0.82, 1); rim.dispose();
      const wheel = new THREE.TorusGeometry(0.28, 0.03, 6, 20); P.geo(M.bronzeFig, wheel, 0, 0, 0.1, 0, 0, 0, 1, 1, 1); wheel.dispose();
      for (let i = 0; i < 8; i++) { P.push(0, 0, 0.1, i * Math.PI / 4); P.box(M.bronzeFig, -0.012, 0.012, -0.34, 0.34, -0.012, 0.012, '', 1); P.pop(); }
      P.pop();
    }
    // the figure (bronze 4.65 m on the plinth slab) and the decree scroll in its right hand (the figure's right = frame -x)
    const s = 4.65 / 1.75, fy = y1 + 1.3;
    peterFig().place(P, mk, 0, fy, 0, 0, s);
    const hx = -0.315 * s, hy = fy + 0.86 * s + 0.02, hz = 0.115 * s + 0.05;
    P.cyl(mk.main, [hx + 0.1, hy + 0.02, hz], [hx - 0.95, hy + 0.02, hz], 0.12, 0.12, 12, true);                         // the rolled top
    P.quad(M.scroll, [hx - 0.92, hy - 1.5, hz + 0.01], [hx + 0.02, hy - 1.5, hz + 0.01], [hx + 0.02, hy - 0.04, hz + 0.01], [hx - 0.92, hy - 0.04, hz + 0.01], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(M.graniteTop, [hx + 0.02, hy - 1.5, hz - 0.02], [hx - 0.92, hy - 1.5, hz - 0.02], [hx - 0.92, hy - 0.04, hz - 0.02], [hx + 0.02, hy - 0.04, hz - 0.02], [0, 0, -1]);
    // the stump bollards (round granite d 0.45 x 0.9 m, domed tops) at the corners and edge middles of the lowest slab; the black chain sags 0.2 m between them
    const pts = [[-3.9, -3.9], [0, -3.9], [3.9, -3.9], [3.9, 0], [3.9, 3.9], [0, 3.9], [-3.9, 3.9], [-3.9, 0]];
    for (const [x, z] of pts) { P.cyl(M.graniteBase, [x, 0.5, z], [x, 1.35, z], 0.23, 0.23, 10, true); const g = new THREE.SphereGeometry(0.23, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2); P.geo(M.graniteBase, g, x, 1.35, z); g.dispose(); }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      let prev = [a[0], 1.2, a[1]];
      for (let k = 1; k <= 8; k++) { const t = k / 8, sag = 0.2 * 4 * t * (1 - t), cur = [a[0] + (b[0] - a[0]) * t, 1.2 - sag, a[1] + (b[1] - a[1]) * t]; P.cyl(M.chain, prev, cur, 0.025, 0.025, 4, false); prev = cur; }
    }
    P.pop();
  } finally { P.pop(); }
  boxF(ph, HF, PETER.x, PETER.z, 8.3, 8.3, 0, 14);
  const p = HF.W(PETER.x, PETER.z);
  K.svc.monuments.push({ id: 'w145671729', name: 'Памятник Петру I работы З. К. Церетели', x: p.x, z: p.z, h: 12.65 });
  const sp = HF.W(PETER.x, PETER.z + 13), sp2 = HF.W(PETER.x + 9, PETER.z - 9), t = HF.W(PETER.x, PETER.z);
  K.svc.photoSpots.push({ name: 'Памятник Петру I на Прибалтийской площади', x: sp.x, z: sp.z, yaw: L.yawToward(sp.x, sp.z, t.x, t.z), pitch: 28 });
  K.svc.photoSpots.push({ name: 'Памятник Петру I: от гостиницы', x: sp2.x, z: sp2.z, yaw: L.yawToward(sp2.x, sp2.z, t.x, t.z), pitch: 30 });
  K.svc.fences.push({ id: 'peter-chain', kind: 'chain', x: p.x, z: p.z, r: 5.6 });
  K.svc.crowd.push({ id: 'peter-photo', kind: 'photo', x: HF.W(PETER.x, PETER.z + 9).x, z: HF.W(PETER.x, PETER.z + 9).z, r: 4, n: 4 });
}
