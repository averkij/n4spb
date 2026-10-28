// landmarksKirova/roerich.js - the monument to NICHOLAS ROERICH in the Vasileostrovets garden (V. Zayko, Yu. Kozhin, 2010; Karelian granite, 3.5 m; docs/research/kirova.md 10.4, photos rr01 rr04 n10 n11) and
// the gravel PLAZA it stands on (r 176 .. 208, q -90 .. -52 in frame K, saturated pink-terracotta crushed brick #b8806f).
//   platform   a granite slab 8.8 x 6.8 m, 0.12 m high (light pink-grey), dark red-brown polished kerb 0.35 x 0.2 with 0.6 m corner blocks; centre K (186, -62) (walkable: a 0.12 m step)
//   pedestal   at the NNW long edge, 0.5 m inside the kerb: a stepped bevelled base 2.2 -> 1.5 m, 0.35 high (dark red-brown) + a block of grey-pink rust-speckled granite 1.4 x 1.2 -> 1.2 x 1.1 m, 1.1 high,
//              the carved signature "Н. Рерих" on the front, a dark triangular 'peak' panel at the foot of the front face, the engraved plaque of the donors on the back (text of photo rr04)
//   figure     a standing old man in a long hooded cloak, arms crossed on the chest, long beard (figure.js), 2.05 m, faces the plaza (SSE)
// Frame: FK pushed (x = r, z = -q): the figure faces local +z.
import * as THREE from 'three';
import { FK } from './frame.js';
import { fillPolyClipped, coverFn } from './surfaces.js';
import { roerichFig } from './figure.js';

const C = [186, -62], PW = 8.8, PD = 6.8;
const PLAZA_K = [[176, -86], [185, -90], [200, -89], [208, -82], [207, -66], [204, -56], [192, -52], [180, -54], [176, -62], [175, -75]];

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx);
  // gravel plaza (decal), clipped at the carriageways
  fillPolyClipped(P, M.plaza, PLAZA_K.map(([r, q]) => { const p = FK.W(r, q); return [p.x, p.z]; }), 0.052, cover, { margin: 0.3, maxEdge: 4, tile: 3 });
  FK.push(P);
  P.push(C[0], 0, -C[1], 0);                                                                    // origin: the platform centre; local x = r, local z = -q (toward the plaza = +z)
  const hx = PW / 2, hz = PD / 2, y0 = 0.12;
  P.box(M.platform, -hx, hx, 0, y0, -hz, hz, 'b', 2);                                            // the slab
  for (const [a, b, c, d] of [[-hx, hx, hz - 0.35, hz], [-hx, hx, -hz, -hz + 0.35]]) P.box(M.roeDark, a, b, y0, y0 + 0.08, c, d, 'b', 1);         // the kerb along the long sides
  for (const [a, b] of [[-hx, -hx + 0.35], [hx - 0.35, hx]]) P.box(M.roeDark, a, b, y0, y0 + 0.08, -hz + 0.35, hz - 0.35, 'b', 1);                  // and the short sides
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(M.roeDark, sx * (hx - 0.3) - 0.3, sx * (hx - 0.3) + 0.3, y0, y0 + 0.2, sz * (hz - 0.3) - 0.3, sz * (hz - 0.3) + 0.3, 'b', 1);   // corner blocks
  // pedestal at the far long edge (local -z side = NNW): its base is 0.5 m inside the kerb
  const pz = -hz + 0.35 + 0.5 + 1.1;
  P.push(0, y0, pz, 0);
  const frust = (mat, w0, d0, w1, d1, h, y) => {                                                  // a bevelled frustum (4 sloped faces and a top)
    const a = [[-w0 / 2, y, -d0 / 2], [w0 / 2, y, -d0 / 2], [w0 / 2, y, d0 / 2], [-w0 / 2, y, d0 / 2]], b = [[-w1 / 2, y + h, -d1 / 2], [w1 / 2, y + h, -d1 / 2], [w1 / 2, y + h, d1 / 2], [-w1 / 2, y + h, d1 / 2]];
    P.quad(mat, a[3], a[2], b[2], b[3], [0, 0.3, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); P.quad(mat, a[1], a[0], b[0], b[1], [0, 0.3, -1]);
    P.quad(mat, a[0], a[3], b[3], b[0], [-1, 0.3, 0]); P.quad(mat, a[2], a[1], b[1], b[2], [1, 0.3, 0]);
    P.quad(mat, b[3], b[2], b[1], b[0], [0, 1, 0]);
  };
  frust(M.roeDark, 2.2, 2.2, 1.5, 1.5, 0.35, 0);
  frust(M.roeGranite, 1.4, 1.2, 1.2, 1.1, 1.1, 0.35);
  // front face of the block (toward the plaza, +z): the signature in the upper third, the dark peak panel at the foot; the rear face carries the plaque
  const yb = 0.35;
  P.quad(M.roeSign, [-0.55, yb + 0.62, 0.575], [0.55, yb + 0.62, 0.575], [0.55, yb + 0.98, 0.559], [-0.55, yb + 0.98, 0.559], [0, 0.3, 1]);
  P.fan(M.roePeak, [[-0.55, yb + 0.02, 0.612], [0.55, yb + 0.02, 0.612], [0, yb + 0.72, 0.58]], [0, 0.2, 1], (p) => [p[0], p[1]]);
  P.quad(M.roePlaque, [0.45, yb + 0.1, -0.601], [-0.45, yb + 0.1, -0.601], [-0.45, yb + 0.95, -0.563], [0.45, yb + 0.95, -0.563], [0, 0.2, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  // the figure on top of the block
  const topY = 0.35 + 1.1;
  roerichFig().place(P, { main: M.roeFig, dark: M.roeDark, accent: M.roeFig }, 0, topY, 0.0, 0, 1.17);
  P.pop(); P.pop(); P.pop();
  // colliders: the slab is a 0.12 m walk-on step, the pedestal block solid
  { const p = FK.W(C[0], C[1]); ph.addWalkBox(p.x, p.z, PW, PD, FK.rot, 0.12); }
  { const p = FK.W(C[0], C[1] + (-pz)); ph.addBox(p.x, p.z, 2.2, 2.2, FK.rot, 0, 1.6); }
  const m = FK.W(C[0], C[1]);
  K.svc.monuments.push({ id: 'n5611461009', name: 'Памятник Н. К. Рериху', x: m.x, z: m.z, h: 3.5, r: 4 });
  K.svc.photoSpots.push({ x: FK.W(193, -78).x, z: FK.W(193, -78).z, yaw: 0, pitch: 6, name: 'Сад «Василеостровец»: памятник Н. К. Рериху', look: [m.x, m.z] });
  K.svc.crowd.push({ id: 'roerich-plaza', kind: 'photo', x: FK.W(191, -71).x, z: FK.W(191, -71).z, r: 10, n: 5 });
  void THREE;
}
