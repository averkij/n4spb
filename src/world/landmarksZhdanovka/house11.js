// landmarksZhdanovka/house11.js - ZHDANOVSKAYA EMBANKMENT No. 11 (corner of Ofitserskiy pereulok; 1950s, OSM w55440267, 5 levels, 76 x 18 m, two street fronts of 30.7 m and 45.5 m that bend by 7 deg, an end front of 17.9 m).
// Evidence: photo m01 (its yellow ashlar-ruled stucco wall with the pale rusticated base and the profiled plinth moulding, beside the rose granite arch of No. 9) and the OSM tags (STALIN neoclassical in the city table);
// no photo of the whole front, so the front is a plain post-war block: yellow plaster ruled as ashlar (#e2d08c) over a pale rusticated ground floor, five window axes per 14.7 m [E], REAL windows (holes, reveals, recessed glass)
// in cream surrounds with sills, ground floor shop-sized openings, a plinth moulding, a stepped cornice at 18.4-19.3 m, drain pipes at the ends of every front, a flat iron roof with a low rail and a few chimneys.  [E] where marked.
import { edgeFrame } from './frame.js';
import { envelope } from './envelope.js';
import { front } from './facade.js';
import { stepper } from './labels.js';
import { ledge, downpipe } from './geom.js';

const HG = 4.4, HF = 3.5, HW = HG + 4 * HF, HC = HW + 0.9;

export function build(K, fp, streetEdges) {
  const { P, M, svc } = K, set = new Set(streetEdges);
  K.shared.h11 = { edges: streetEdges };
  envelope(K, fp, { Hw: HW, Hc: HC, skip: set, roofMat: M.iron });
  const win = { w: 1.2, y0: 0.85, y1: 2.8, types: [M.g11a, M.g11b, M.g11c], rev: M.cream, d: 0.27, sill: M.cream, sillExt: 0.1, surround: M.cream, sw: 0.12, spr: 0.04 };
  const DOORS = [[5], [4, 11], []];                                                            // entrance axes of the three fronts (e2, e3, e4) [E]
  const rowsOf = (n) => [{ mat: M.o11g, h: HG, win: { w: 1.4, y0: 0.9, y1: 3.2, types: [M.g11s], rev: M.stone, d: 0.3, sill: M.stone, sillExt: 0.12, surround: M.stone, sw: 0.14, spr: 0.05, lintel: M.stone, lh: 0.2,
      over: Object.fromEntries(DOORS[n].map((k) => [k, { w: 1.5, y0: 0, y1: 2.6, types: [[M.gd2, M.gd4][k % 2]], door: true }])) } },
    ...[0, 1, 2, 3].map(() => ({ mat: M.o11f, h: HF, win }))];
  streetEdges.forEach((ei, n) => {
    const e = fp.edges[ei], f = edgeFrame(e), len = f.len;
    P.push(f.S.x, 0, f.S.z, f.rot);
    P.far = Infinity;
    front(P, M, { len, seed: 110 + n, stepMat: M.stone, canopyMat: M.cream, walk: stepper(K.ctx, f) }, rowsOf(n));
    ledge(P, M.cream, len, HW, HW + 0.35, 0.5, 0.0, 'k');
    ledge(P, M.cream, len, HW + 0.35, HC, 0.78, 0.0, 'k');
    P.ranged(300, () => {
      ledge(P, M.stone, len, HG - 0.22, HG + 0.06, 0.16, 0, 'k');                                      // the plinth moulding of the ground floor
      for (let k = 1; k < 4; k++) ledge(P, M.cream, len, HG + k * HF - 0.1, HG + k * HF + 0.06, 0.07, 0, 'k');
      downpipe(P, M.zinc, 0.18, 0.1, HW); downpipe(P, M.zinc, len - 0.18, 0.1, HW);
    });
    P.ranged(600, () => {                                                                                  // brick chimney stacks behind the cornice and a thin roof rail
      const nc = Math.max(1, Math.floor(len / 11));
      for (let k = 0; k < nc; k++) { const x = (k + 0.5) * len / nc; P.box(M.brick, x - 0.5, x + 0.5, HC, HC + 1.7, -4.2, -3.3, 'b', 1); P.box(M.stone, x - 0.6, x + 0.6, HC + 1.7, HC + 1.82, -4.3, -3.2, 'b', 1); }
      P.quad(M.rails, [0.3, HC, -0.4], [len - 0.3, HC, -0.4], [len - 0.3, HC + 0.8, -0.4], [0.3, HC + 0.8, -0.4], [0, 0, 1], [[0, 0], [(len - 0.6) / 1.9, 0], [(len - 0.6) / 1.9, 1], [0, 1]]);
    });
    P.ranged(500, () => { const n2 = Math.floor(len / 2.9); for (let k = 0; k < n2; k++) { const x = (k + 0.5) * len / n2; P.box(M.cream, x - 0.12, x + 0.12, HW - 0.5, HW, 0.0, 0.5, 'k', 1); } });
    P.pop();
  });
  const e = fp.edges[streetEdges[0]];
  svc.monuments.push({ id: 'w55440267', name: 'Ждановская набережная, 11', x: (e.a[0] + e.b[0]) / 2, z: (e.a[1] + e.b[1]) / 2, h: 19 });
}
