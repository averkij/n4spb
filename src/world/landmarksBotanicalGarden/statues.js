// landmarksBotanicalGarden/statues.js - the SCULPTURES of the garden that are real figures (docs/FIGURES.md; dossier 4.1b "Statues", 4.1d):
//   * THE THINKER (OSM n13807794875 (-1609.5, -4265.4), granite, 2014, Aydar Ishemgulov): a seated nude athlete in Rodin's pose on a rough granite block, looking over the north court;
//   * SYMBIOSIS (n13917690931 (-1768.1, -4126.2), "Большие грибы"): five big stylised mushrooms 0.9-2.0 m with red-brown caps and cream stems in a cluster;
//   * the small DINOSAUR (n13917693769 (-1766.1, -4204.8) "Маленький динозавр"): a 1.1 m long-necked animal on all fours in patinated bronze;
//   * the JAPANESE LANTERN (n9483250706 (-1649.3, -4251.2) "Японский Фонарь"): a granite ishidoro 1.55 m like the two of the Japanese garden.
// NOT built (no photo, no known shape [?]): the Schnittke tribute n5833171745, "Dance" / "Boreas" / "Wave of warm air" n5833171747..49, the tridacna shell n9346535790, the Lenin statue n4188185554 (the user's call).
import { figureMats } from '../lib/figures.js';
import { revolve } from './geo.js';
import { thinker, dinosaur } from './figs.js';
import { lanternParts } from './japan.js';
import { Frame } from './frame.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { stage } from './shell.js';

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics, FM = figureMats(ctx);
  stage(K, 'thinker', () => {
    const x = -1609.5, z = -4265.4, yaw = Math.atan2(33.5, -17.6), gk = FM.keys('granite', 'granite');
    P.push(x, 0, z, yaw);
    // a rough block of grey granite under the figure (hexahedron-like, 1.1 x 0.8 x 0.5)
    P.box(M.plinth, -0.62, 0.62, 0, 0.1, -0.5, 0.55, 'b', 1.5);
    P.box(M.plinth, -0.52, 0.52, 0.1, 0.48, -0.4, 0.4, 'b', 1.5);
    const f = thinker();
    for (const [key, g] of Object.entries(f.geos)) P.geo(gk[key] || gk.main, g, 0, 0.48, -0.08, 0, 0, 0, 1.12, 1.12, 1.12);
    P.pop();
    ph.addCylinder(x, z, 0.75, 0, 1.9);
    K.svc.monuments.push({ id: 'n13807794875', name: 'Мыслитель', x, z, h: 1.9 });
  });
  stage(K, 'mushrooms', () => {
    const c = [-1768.1, -4126.2], spots = [[0, 0, 1.0], [1.5, 0.7, 0.7], [-1.3, 0.9, 0.55], [0.7, -1.5, 0.45], [-0.9, -1.4, 0.8]];
    for (const [dx, dz, s] of spots) {
      const x = c[0] + dx * 1.2, z = c[1] + dz * 1.2, h = 2.0 * s;
      revolve(P, M.white, [[0.0, 0], [0.2 * s, 0], [0.16 * s, 0.1], [0.13 * s, h * 0.5], [0.12 * s, h * 0.78]], 10, { cx: x, cz: z, crease: 40, uRep: 1, vTile: 1 });
      revolve(P, M.roofRed, [[0.12 * s, h * 0.72], [0.5 * s, h * 0.78], [0.78 * s, h * 0.9], [0.84 * s, h * 0.98], [0.62 * s, h * 1.12], [0.3 * s, h * 1.2], [0.0, h * 1.22]], 14, { cx: x, cz: z, crease: 55, uRep: 1, vTile: 1 });
      ph.addCylinder(x, z, 0.28 * s + 0.1, 0, h * 1.2);
    }
    K.svc.monuments.push({ id: 'n13917690931', name: 'Симбиоз (грибы)', x: c[0], z: c[1], h: 2.5, r: 3 });
  });
  stage(K, 'dinosaur', () => {
    const x = -1766.1, z = -4204.8, bk = FM.keys('bronze', 'bronze'), f = dinosaur();
    for (const [key, g] of Object.entries(f.geos)) P.geo(bk[key] || bk.main, g, x, 0, z, 0, -0.7, 0, 1.0, 1.0, 1.0);
    ph.addCylinder(x, z, 0.5, 0, 1.2);
    K.svc.monuments.push({ id: 'n13917693769', name: 'Маленький динозавр', x, z, h: 1.2 });
  });
  stage(K, 'lantern', () => {
    const x = -1649.3, z = -4251.2;
    K.extraTris += addInstanced(ctx, K.root, 'bg-lantern', partsGeos((Q) => lanternParts(Q, M)), [mat4(x, 0, z, 0.6, 1)]).tris;
    ph.addCylinder(x, z, 0.4, 0, 1.6);
    K.svc.monuments.push({ id: 'n9483250706', name: 'Японский фонарь', x, z, h: 1.6 });
  });
  void Frame;
  if (K.errs && K.errs.length) throw new Error('statues: ' + K.errs.join('\n'));
}
