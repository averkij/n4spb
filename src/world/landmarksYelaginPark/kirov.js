// landmarksYelaginPark/kirov.js - the KIROV BUST at the gate of the 2nd Yelagin bridge (OSM n4353822789, (-5213.7, -4908.7), 34 m north of the Yelagin end of the bridge deck).
// Photos (docs/research/yelagin-park-2026.md b123 18 / 19, gate 01 / 03): a dark patinated bronze bust of S. M. Kirov (a jacket with an open collar, short combed hair, the head turned a little)
// on a tall RECTANGULAR stele of pink-red granite with a small plaque, on a base of two stepped granite blocks; behind it a wall of lilac / lime shrubs (the generic trees), in front a border of
// broad HOSTAS and an OVAL BED OF RED SALVIA about 3.5 x 1.4 m (summer; the spring tulips are not drawn).  Total height about 2.85 m.  The sculptor of THIS bust is unknown ([?] dossier 5.3;
// N. V. Tomsky's 1936 bust stands on the Kamenny side).  The bust looks south at the alley and the bridge head.  ~1.6 k triangles of geometry + the bust (2.8 k) + 700 of plants.
import { bust, cached, figureMats } from '../lib/figures.js';
import { makeLabels } from '../streets/labels.js';
import { KIROV } from './frame.js';
import { hosta, salviaBed } from './plants.js';

const bustFig = () => cached('ypark-kirov-bust', () => bust({ detail: 0.8, style: 'uniform', turn: -0.18, pitch: 0.02, roll: 0.0, face: { age: 0.42, hair: 'short', brow: 0.85, jaw: 1.0, nose: 1.1, seed: 93, mouth: 'stern' } }));

export function build(K) {
  const { ctx, P, M, svc } = K, { x, z, look } = KIROV;
  const FM = figureMats(ctx), rot = Math.atan2(look[0] - x, look[1] - z);
  P.far = 380;
  P.push(x, 0, z, rot);
  // base: two stepped blocks (darker), the stele (+0.06 cap), the bronze on a thin ledge
  P.box(M.graniteDark, -0.55, 0.55, 0, 0.17, -0.55, 0.55, 'b', 1);
  P.box(M.granitePink, -0.42, 0.42, 0.17, 0.5, -0.42, 0.42, '', 1);
  P.box(M.granitePink, -0.3, 0.3, 0.5, 1.98, -0.3, 0.3, '', 1);                      // the stele 0.6 x 0.6 x 1.5
  P.box(M.graniteDark, -0.34, 0.34, 1.98, 2.06, -0.34, 0.34, '', 1);                  // its cap
  const bf = bustFig();
  const bk = FM.keys('bronze', 'bronze');
  for (const [key, g] of Object.entries(bf.geos)) P.geo(bk[key] || bk.main, g, 0, 2.06, 0, 0, 0, 0, 1.34, 1.12, 1.18);          // the photo: the shoulders of the bust are as wide as the stele (0.58 m), the head 0.3 m
  // plaque on the south face (a decal 2 cm proud), 0.42 x 0.21
  const labels = (ctx.services.labels ||= makeLabels());
  if (labels.reserve('ypark-kirov-plaque', x + Math.sin(rot) * 0.31, 1.25, z + Math.cos(rot) * 0.31, 0.42, 0.21, Math.sin(rot), Math.cos(rot), 'monument')) {
    P.quad(M.plaqueKirov, [-0.21, 1.14, 0.322], [0.21, 1.14, 0.322], [0.21, 1.35, 0.322], [-0.21, 1.35, 0.322], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  P.pop();
  // the plants: a border of hostas round the base (in front and at the sides), the salvia bed 2.6 m in front
  P.far = 200;
  const loc = (u, v) => [x + Math.cos(rot) * u + Math.sin(rot) * v, z - Math.sin(rot) * u + Math.cos(rot) * v];     // u = to the figure's left, v = ahead of it
  const hs = [[-1.2, 0.6], [-0.7, 0.95], [-0.15, 1.15], [0.45, 1.1], [1.0, 0.85], [1.3, 0.4], [-1.45, 0.05], [1.5, -0.1], [-1.3, -0.55], [1.35, -0.6]];
  hs.push([-0.45, 1.5], [0.15, 1.65], [0.75, 1.5], [-1.0, 1.2], [1.2, 1.25], [-1.7, 0.45], [1.75, 0.5]);                            // a second, outer row: the photo (b123 18) shows a lush continuous border, not single clumps
  hs.forEach(([u, v], i) => { const [hx, hz] = loc(u, v); hosta(P, M, hx, hz, 1.3 + (i % 3) * 0.18, 11 + i, 9); });
  const [bx, bz] = loc(0, 3.4);
  const nSpikes = salviaBed(P, M, bx, bz, 1.75, 0.7, rot, 5);
  ctx.physics.addBox(x, z, 1.1, 1.1, rot, 0, 3.0);
  svc.monuments.push({ id: KIROV.id, name: 'С. М. Киров', nameEn: 'Kirov bust at the 2nd Yelagin bridge', x, z, h: 2.9, r: 1.2 });
  const sx = x + Math.sin(rot) * 6.5, sz = z + Math.cos(rot) * 6.5;
  svc.photoSpots.push({ x: sx, z: sz, yaw: ctx.L.yawToward(sx, sz, x, z), name: 'Памятник С. М. Кирову у 2-го Елагина моста' });
  svc.kirov = { x, z, rotY: rot, bed: [bx, bz], spikes: nSpikes };
}
