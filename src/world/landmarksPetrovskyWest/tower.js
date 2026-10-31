// landmarksPetrovskyWest/tower.js - the WATER TOWER of the Gote rope works (OSM building:part w861142938, 5 x 5 m, inside the block w248349888 "Петровский пр. 20 лит. Г").  Photos refs/petrovsky-west g02 (a cream-yellow
// plaster shaft with horizontal band joints and narrow windows, topped by a red-brick tank house with a small hip roof and a weathervane rod, standing behind the three-storey brick blocks) and g09 (the tower far left).
// Heights are estimates [E] from the photos against the 11 m brick block beside it: plinth 1.2 m, shaft 15 m with three narrow windows on every face and a cornice, brick tank house 4 m, hip roof 2.2 m, rod 2.4 m.
// The tower is a closed industrial structure: a solid collider.
import { IDS, ringOf, ringEdges, edgeFrame } from './frame.js';
import { wallsOfRing } from './shapes.js';

const Y1 = 1.2, Y2 = 15.0, Y3 = 19.0;

export function build(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const ring = ringOf(IDS.tower);
  if (!ring) return;
  P.far = 800;
  // plinth (stone) and the plaster shaft
  wallsOfRing(P, ring, 0, Y1, M.conc, M.conc, { pitch: 3, th: 3 });
  wallsOfRing(P, ring, Y1, Y2, M.tower, M.tower, { pitch: 3.2, th: 3.2, each: (f, e) => {
    const len = f.len;
    P.far = 420;
    for (const y of [4.0, 8.2, 12.2]) {                                                            // a narrow window with a pale surround on every face
      P.box(M.stone, len / 2 - 0.5, len / 2 + 0.5, y - 0.1, y + 1.7, 0, 0.06, 'kb', 1);
      P.box(M.dark, len / 2 - 0.3, len / 2 + 0.3, y + 0.05, y + 1.55, 0, 0.09, 'kb', 1);
    }
    P.box(M.stone, -0.05, len + 0.05, Y2 - 0.4, Y2, 0, 0.3, 'k', 1);                             // cornice under the tank house
    P.far = 800;
  } });
  // the tank house: red brick, a slightly wider box (0.25 m overhang is simulated by the cornice), small slit windows, a hip roof, a rod
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const grown = ring.map((p) => { const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1; return [p[0] + dx / l * 0.28, p[1] + dz / l * 0.28]; });
  wallsOfRing(P, grown, Y2, Y3, M.ruinPlain, M.ruinPlain, { pitch: 3.4, th: 3.2, each: (f) => {
    P.far = 420;
    for (const x of [f.len * 0.3, f.len * 0.7]) { P.box(M.stone, x - 0.4, x + 0.4, Y2 + 1.2, Y2 + 2.6, 0, 0.05, 'kb', 1); P.box(M.dark, x - 0.26, x + 0.26, Y2 + 1.3, Y2 + 2.5, 0, 0.08, 'kb', 1); }
    P.far = 800;
  } });
  // hip roof (pyramid) and the rod
  const edges = ringEdges(grown), f0 = edgeFrame(edges[0]);
  P.push(f0.S.x, 0, f0.S.z, f0.rot);
  const w = f0.len, d = edges[1].len, ov = 0.35, h = 2.2, x0 = -ov, x1 = w + ov, z0 = -d - ov, z1 = ov, ax = w / 2, az = -d / 2, ay = Y3 + h;
  const tri = (a, b, n) => P.quad(M.zincRoof, a, b, [ax, ay, az], [ax, ay, az], n, [[0, 0], [3, 0], [1.5, 2], [1.5, 2]]);
  tri([x0, Y3, z1], [x1, Y3, z1], [0, 0.8, 0.6]); tri([x1, Y3, z1], [x1, Y3, z0], [0.6, 0.8, 0]); tri([x1, Y3, z0], [x0, Y3, z0], [0, 0.8, -0.6]); tri([x0, Y3, z0], [x0, Y3, z1], [-0.6, 0.8, 0]);
  P.quad(M.dark, [x0, Y3 - 0.02, z0], [x1, Y3 - 0.02, z0], [x1, Y3 - 0.02, z1], [x0, Y3 - 0.02, z1], [0, -1, 0]);
  P.far = 500;
  P.cyl(M.dark, [ax, ay, az], [ax, ay + 2.4, az], 0.04, 0.025, 5, true);
  P.cyl(M.dark, [ax, ay + 1.7, az], [ax + 0.6, ay + 1.7, az], 0.02, 0.02, 4, false);
  P.pop();
  if (ph) { const w2 = { x: cx, z: cz }; ph.addBox(w2.x, w2.z, 5.4, 5.4, Math.atan2(edges[0].n[0], edges[0].n[1]), 0, Y3 + 3); }
  K.svc.monuments.push({ id: IDS.tower, name: 'Водонапорная башня канатного завода Готе', x: cx, z: cz, h: Y3 + 5 });
}
