// landmarksKamennyDachasWest/follenweider.js - the FOLLENWEIDER MANSION (Особняк Фолленвейдера, R.-F. Meltzer 1904-05, "Теремок" / "Сахарная голова", OSM w108026879): white roughcast walls on a rough dark-granite plinth,
// steep orange-red tile roofs, the tall curved TENT roof over the front gable with a dark half-timber lucarne and three slit windows, a polygonal bay with a dark conical roof, a low porch whose roof carries an iron
// balcony, black frames, massive chimneys.  Photos F01 F02 F04 F07.  Frame FW: local x along the long wall z = 0 (it faces NE, the canal side), z toward the inside; the stepped FRONT (z 25 .. 29, WSW) faces the gate.
// Heights [E]: plinth 1.3, eaves 7.4, main ridge 14.2, tent apex 18.0.
import { FW, RING_FW } from './frame.js';
import { ringEdges, polyOf, band } from './kit.js';
import { Q } from './facade.js';
import { onE, spread, rq, hip, gable, tent, spin, chimney, win } from './util.js';

const EAVE = 7.4, PL = 1.3, PORCH = 4.4;

export async function build(K) {
  const { M, P, N } = K;
  P.push(FW.ox, 0, FW.oz, FW.rot); N.push(FW.ox, 0, FW.oz, FW.rot);
  const edges = ringEdges(polyOf(RING_FW));
  const hOf = (e) => (e.i === 9 || e.i === 10 || e.i === 11 ? PORCH : EAVE);

  const w = (cx, y0, ww = 1.1, hh = 1.5) => win(P, N, M.winF1D, M.iron, { cx, y0, w: ww, h: hh }, { sw: 0.11, proud: 0.07, sill: 0.12 });
  for (const e of edges) {
    const H = hOf(e);
    onE([P, N], e, (len) => {
      P.quad(M.stucco, [0, 0, 0], [len, 0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, H / 3], [0, H / 3]]);
      if (len < 2.4) return;
      if (e.i === 12) {                                                                    // under the lucarne: the three slit windows
        for (const u of [1.0, 2.4, 3.8]) win(P, N, M.winSlitD, M.iron, { cx: u, y0: 3.9, w: 0.5, h: 2.1 }, { sw: 0.1, proud: 0.06, sill: 0.1 });
        w(1.4, 1.9); w(3.4, 1.9);
        return;
      }
      if (e.i === 10) {                                                                    // the front of the porch: a round-headed door and a window
        Q(P, M.doorGD, [len / 2 - 0.8, 0.3, 0.015], [len / 2 + 0.8, 0.3, 0.015], [len / 2 + 0.8, 2.6, 0.015], [len / 2 - 0.8, 2.6, 0.015], [0, 0, 1]);
        N.box(M.iron, len / 2 - 0.95, len / 2 + 0.95, 2.6, 2.8, 0, 0.1, 'k', 1);
        return;
      }
      const upper = H > 5;
      for (const cx of spread(len, 3.5, 1.5)) { w(cx, 2.0 + (PL > 1.9 ? 0 : 0), 1.1, 1.5); if (upper) w(cx, 4.7, 1.1, 1.6); }
    });
  }
  band(P, edges, 0, PL, 0.1, { front: M.graniteF, top: M.graniteF }, { uvs: 1.8 });
  band(P, edges.filter((e) => hOf(e) > 5), EAVE - 0.3, EAVE, 0.25, { front: M.iron, top: M.iron, under: M.iron }, { uvs: 2 });

  // ---- the wall behind the porch roof (z = 23.4, x 19.8 .. 25.8, above the porch): a French window and a window
  P.push(0, 0, 23.4, 0);
  P.quad(M.stucco, [19.8, PORCH, 0], [25.8, PORCH, 0], [25.8, EAVE, 0], [19.8, EAVE, 0], [0, 0, 1], [[19.8 / 3, PORCH / 3], [25.8 / 3, PORCH / 3], [25.8 / 3, EAVE / 3], [19.8 / 3, EAVE / 3]]);
  win(P, N, M.winSlitD, M.iron, { cx: 21.6, y0: PORCH + 0.15, w: 0.9, h: 2.5 }, { sw: 0.1, proud: 0.06, sill: 0.02 });
  win(P, N, M.winF1D, M.iron, { cx: 24.2, y0: PORCH + 1.0, w: 1.1, h: 1.5 }, { sw: 0.1, proud: 0.06, sill: 0.1 });
  P.pop();
  // ---- the porch roof: a flat slab with the iron balcony railing round its three free sides (F07 right)
  P.box(M.stucco, 19.7, 26.1, PORCH - 0.12, PORCH, 23.4, 29.0, 'b', 3);
  for (let i = 0; i < 3; i++) Q(N, M.balF, [20.0 + i * 2.0, PORCH, 28.95], [22.0 + i * 2.0, PORCH, 28.95], [22.0 + i * 2.0, PORCH + 1.0, 28.95], [20.0 + i * 2.0, PORCH + 1.0, 28.95], [0, 0, 1], [0, 0, 1, 1]);
  for (let i = 0; i < 2; i++) { const z0 = 23.4 + i * 2.8; Q(N, M.balF, [26.05, PORCH, z0 + 2.8], [26.05, PORCH, z0], [26.05, PORCH + 1.0, z0], [26.05, PORCH + 1.0, z0 + 2.8], [1, 0, 0], [0, 0, 1, 1]); Q(N, M.balF, [19.75, PORCH, z0], [19.75, PORCH, z0 + 2.8], [19.75, PORCH + 1.0, z0 + 2.8], [19.75, PORCH + 1.0, z0], [-1, 0, 0], [0, 0, 1, 1]); }

  // ---- two iron balconies on the long NE wall (F04): slab + railings, first-floor level
  for (const cx of [9.5, 20.5]) {
    P.box(M.stucco, cx - 1.4, cx + 1.4, 4.25, 4.45, -1.2, 0, 'b', 3);
    for (let i = 0; i < 2; i++) Q(N, M.balF, [cx - 1.4 + i * 1.4, 4.45, -1.2], [cx + i * 1.4, 4.45, -1.2], [cx + i * 1.4, 5.45, -1.2], [cx - 1.4 + i * 1.4, 5.45, -1.2], [0, 0, -1], [0, 0, 1, 1]);
    for (const sx of [-1, 1]) Q(N, M.balF, [cx + sx * 1.4, 4.45, -1.2], [cx + sx * 1.4, 4.45, 0], [cx + sx * 1.4, 5.45, 0], [cx + sx * 1.4, 5.45, -1.2], [sx, 0, 0], [0, 0, 1, 1]);
  }

  // ---- roofs
  const rf = (o) => hip(P, M.tileF, { ov: 0.62, tu: 1.5, ...o });
  rf({ x0: 1.0, x1: 27.7, z0: 0, z1: 23.4, y: EAVE, rise: 6.8 });                                    // the main hip, ridge along x (its west end follows the wall x = 1.3 .. 2.0, not the small bay)
  rf({ x0: -2.4, x1: 3.2, z0: 2.1, z1: 7.4, y: EAVE, rise: 2.4, ov: 0.3 });                           // the small west bay
  rf({ x0: 3.8, x1: 8.6, z0: 20.8, z1: 26.0, y: EAVE, rise: 3.2, ov: 0.2 });                          // the front-left shoulder
  // the central cross gable on the NE side
  gable(P, M.tileF, M.stucco, { x0: 9.0, x1: 17.5, z0: -1.4, z1: 6, y: EAVE, rise: 3.8, ov: 0.5, ovG: 0.5, axis: 'z', tu: 1.5 });
  P.box(M.stucco, 9.0, 17.5, 0, EAVE, -1.4, 0, 'bf', 3);
  for (const u of [10.6, 13.2, 15.8]) { Q(P, M.winF1D, [u + 0.55, 4.7, -1.415], [u - 0.55, 4.7, -1.415], [u - 0.55, 6.3, -1.415], [u + 0.55, 6.3, -1.415], [0, 0, -1]); Q(P, M.winF1D, [u + 0.55, 2.0, -1.415], [u - 0.55, 2.0, -1.415], [u - 0.55, 3.5, -1.415], [u + 0.55, 3.5, -1.415], [0, 0, -1]); N.box(M.iron, u - 0.68, u + 0.68, 4.58, 4.7, -1.5, -1.4, '', 1); N.box(M.iron, u - 0.68, u + 0.68, 1.9, 2.0, -1.5, -1.4, '', 1); }
  for (const x of [9.35, 13.25, 17.15]) N.box(M.iron, x - 0.1, x + 0.1, EAVE - 0.1, EAVE + 3.8 * (1 - Math.abs(x - 13.25) / 4.25) - 0.15, -1.48, -1.4, '', 1);
  N.box(M.iron, 9.0, 17.5, EAVE + 0.55, EAVE + 0.75, -1.48, -1.4, '', 1); N.box(M.iron, 9.0, 17.5, EAVE - 0.1, EAVE + 0.1, -1.5, -1.4, '', 1);
  Q(P, M.winRowD, [13.25 + 1.0, 8.0, -1.415], [13.25 - 1.0, 8.0, -1.415], [13.25 - 1.0, 9.2, -1.415], [13.25 + 1.0, 9.2, -1.415], [0, 0, -1]);
  // the tent over the front gable: concave profile, a dark metal tip; the dark half-timber lucarne with its pointed gable on the front
  tent(P, M.tileF, 15.7, 21.8, 4.5, 4.7, EAVE - 0.1, 18.0, (t) => 1 - (0.3 * t + 0.7 * t * t * (3 - 2 * t)), 12, 1.4);          // ogee (F01 F07): walls rise almost vertically from the eave kick, a needle-thin tip
  P.cyl(M.iron, [15.7, 17.9, 21.8], [15.7, 19.1, 21.8], 0.14, 0.02, 6, false);
  {
    const x0 = 14.1, x1 = 17.3, z0 = 24.2, z1 = 27.0, y0 = 6.9, y1 = 9.7;
    P.box(M.iron, x0, x1, y0, y1, z0, z1, 'b', 1);
    Q(P, M.winRowD, [x0 + 0.35, y0 + 0.5, z1 + 0.015], [x1 - 0.35, y0 + 0.5, z1 + 0.015], [x1 - 0.35, y1 - 0.5, z1 + 0.015], [x0 + 0.35, y1 - 0.5, z1 + 0.015], [0, 0, 1]);
    gable(P, M.tileF, M.iron, { x0, x1, z0, z1, y: y1, rise: 2.0, ov: 0.35, ovG: 0.45, axis: 'z', tu: 1.2 });
  }
  // the polygonal bay with the dark conical roof
  spin(P, M.slateD, 7.3, 23.9, [[4.0, EAVE], [3.2, EAVE + 0.5], [0.15, EAVE + 4.0]], 14, 1.0);
  // chimneys: broad dark-brick stacks
  for (const [x, z, y0] of [[5.2, 9.0, 11.2], [13.0, 10.5, 12.6], [22.0, 8.5, 11.4]]) chimney(P, M, x, z, y0, y0 + 3.4, 1.7, 1.2, M.brickRed);

  // colliders: the three blocks of the plan (world metres; FW.W gives the centre)
  const bx = (x0, x1, z0, z1, h) => { const c = FW.W((x0 + x1) / 2, (z0 + z1) / 2); (K.shared.cols ||= []).push({ box: [c.x, c.z, x1 - x0, z1 - z0, FW.rot, h] }); };
  bx(-2.4, 28.9, 0, 23.4, 14); bx(3.8, 20.0, 23.4, 27.3, 12); bx(19.8, 26.1, 23.4, 29.0, 6);
  P.pop(); N.pop();
}
