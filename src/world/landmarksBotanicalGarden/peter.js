// landmarksBotanicalGarden/peter.js - the BUST OF PETER THE GREAT in the north court of the greenhouse complex (OSM n4146659535 (-1572.2, -4282.6), inscription "Петру Великому - основателю Ботанического Сада";
// photo 84): a dark bronze bust (long hair, moustache, a plain coat; lib/figures.js bust) on a dark-grey granite block that crowns a TREE-TRUNK pedestal of grey stone carved with bark, a cut branch and a
// root flare (the total height is about 3.0 m), a terracotta bowl of red geraniums at its foot, and 5 m in front a pink-grey granite BOULDER with a sloping face and the bronze plate with the inscription.
// The bust looks away from the museum (north-north-west of it), towards the vestibule side of the court: yaw atan2(14, 38).  A ring path 7 m round the bust is the environment's.
import { bust, cached, figureMats } from '../lib/figures.js';
import { revolve } from './geo.js';
import { Frame } from './frame.js';
import { stage } from './shell.js';
import { makeLabels } from '../streets/labels.js';

export const PB = new Frame(-1572.2, -4282.6, Math.atan2(14, 38));
const bustFig = () => cached('lmbg-peter-bust', () => bust({ detail: 0.85, style: 'civil', turn: 0.12, pitch: 0.03, roll: 0, face: { age: 0.4, hair: 'long', beard: 'moustache', brow: 0.8, jaw: 1.0, nose: 1.15, mouth: 'stern', seed: 17 } }));

/** a convex block from 8 corners (bottom 4 then top 4, each ring counter-clockwise seen from above): faces get outward normals computed from the centre */
function hexa(P, mat, c, uvs = 1.5) {
  const mid = c.reduce((a, p) => [a[0] + p[0] / 8, a[1] + p[1] / 8, a[2] + p[2] / 8], [0, 0, 0]);
  const face = (a, b, d, e) => {
    const cx = (a[0] + b[0] + d[0] + e[0]) / 4 - mid[0], cy = (a[1] + b[1] + d[1] + e[1]) / 4 - mid[1], cz = (a[2] + b[2] + d[2] + e[2]) / 4 - mid[2];
    const l = Math.hypot(cx, cy, cz) || 1;
    P.quad(mat, a, b, d, e, [cx / l, cy / l, cz / l], [[a[0] / uvs, a[2] / uvs + a[1] / uvs], [b[0] / uvs, b[2] / uvs + b[1] / uvs], [d[0] / uvs, d[2] / uvs + d[1] / uvs], [e[0] / uvs, e[2] / uvs + e[1] / uvs]]);
  };
  face(c[0], c[1], c[5], c[4]); face(c[1], c[2], c[6], c[5]); face(c[2], c[3], c[7], c[6]); face(c[3], c[0], c[4], c[7]); face(c[4], c[5], c[6], c[7]); face(c[3], c[2], c[1], c[0]);
}

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  const FM = figureMats(ctx), bk = FM.keys('bronze', 'bronze');
  stage(K, 'monument', () => {
    P.push(PB.cx, 0, PB.cz, PB.rot);
    // root flare + the trunk: a stone tree stump 1.65 m tall, bark texture, slightly leaning branches cut off
    revolve(P, M.bark, [[0.72, 0], [0.5, 0.12], [0.36, 0.35], [0.31, 0.8], [0.3, 1.3], [0.29, 1.62]], 14, { crease: 30, uRep: 3, vTile: 1.2, capTop: M.bark });
    P.cyl(M.bark, [0.1, 0.78, 0.2], [0.42, 1.0, 0.34], 0.07, 0.055, 6, true);                         // the cut branch stub on the right
    P.cyl(M.bark, [-0.12, 1.15, -0.05], [-0.4, 1.3, -0.2], 0.05, 0.04, 6, true);
    // the dark granite block that the bust stands on, and a thin cap slab
    P.box(M.graniteD, -0.27, 0.27, 1.62, 2.2, -0.27, 0.27, 'b', 1.5);
    P.box(M.graniteD, -0.32, 0.32, 2.2, 2.26, -0.32, 0.32, '', 1.5);
    // the bust (bronze), looking forward (+z)
    const bf = bustFig();
    for (const [key, g] of Object.entries(bf.geos)) P.geo(bk[key] || bk.main, g, 0, 2.26, 0, 0, 0, 0, 1.15, 1.15, 1.15);
    // the terracotta bowl with red geraniums at the foot (a lathe bowl + a mound of flower dots)
    revolve(P, M.terra, [[0.0, 0.0], [0.2, 0.0], [0.33, 0.08], [0.42, 0.18], [0.44, 0.23], [0.39, 0.24], [0.33, 0.18], [0.0, 0.12]], 12, { crease: 40, uRep: 2, vTile: 1, cx: 0, cz: 0.55 });
    revolve(P, M.leaf, [[0.0, 0.16], [0.36, 0.2], [0.42, 0.3], [0.32, 0.42], [0.14, 0.5], [0.0, 0.52]], 10, { crease: 80, uRep: 1, vTile: 1, cx: 0.0, cz: 0.55 });          // the leaves (green: the pale mint of the workers' house read as a teal ball)
    for (let i = 0; i < 12; i++) { const a = i * 2.4, r = 0.05 + (i % 4) * 0.09, bx = Math.cos(a) * r, bz = 0.55 + Math.sin(a) * r, by = 0.5 - r * 0.4; P.box(M.terra, bx - 0.07, bx + 0.07, by, by + 0.13, bz - 0.07, bz + 0.07, 'b', 1); }     // red geranium heads
    // the boulder 5 m in front: a sloping-faced granite block with the bronze plate
    const bz = 5.0, w = 0.75, d = 0.55;
    hexa(P, M.graniteP, [[-w, 0, bz - d], [w, 0, bz - d], [w * 0.9, 0, bz + d + 0.1], [-w * 0.9, 0, bz + d + 0.1], [-w * 0.6, 0.62, bz - d * 0.55], [w * 0.75, 0.66, bz - d * 0.5], [w * 0.6, 0.34, bz + d * 0.5], [-w * 0.7, 0.3, bz + d * 0.5]], 1.6);
    P.pop();
    // the plate on the sloping front face (a decal 1.5 cm proud, labels registry)
    const labels = (ctx.services.labels ||= makeLabels());
    const pc = PB.w(0, 5.5), pn = [Math.sin(PB.rot), Math.cos(PB.rot)];
    if (labels.reserve('lmbg-peter-plate', pc[0], 0.2, pc[1], 0.9, 0.4, pn[0], pn[1], 'monument')) {
      P.push(PB.cx, 0, PB.cz, PB.rot);
      P.quad(M.plaques, [-0.46, 0.07, 5.585], [0.46, 0.07, 5.585], [0.46, 0.25, 5.36], [-0.46, 0.25, 5.36], [0, 0.78, 0.62], [[0, 0.5], [1, 0.5], [1, 1], [0, 1]]);
      P.pop();
    }
  });
  ctx.physics.addCylinder(PB.cx, PB.cz, 0.5, 0, 3.0);
  { const p = PB.w(0, 5.0); ctx.physics.addCylinder(p[0], p[1], 0.8, 0, 0.7); }
  K.svc.monuments.push({ id: 'n4146659535', name: 'Петру Великому — основателю Ботанического сада', x: PB.cx, z: PB.cz, h: 3.2, r: 1.5 });
  const ps = PB.w(0, 9);
  K.svc.photoSpots.push({ x: ps[0], z: ps[1], yaw: Math.round(PB.rot * 180 / Math.PI + 180), name: 'Бюст Петра Великого в северном дворе оранжерей' });
  if (K.errs && K.errs.length) throw new Error('peter: ' + K.errs.join('\n'));
}
