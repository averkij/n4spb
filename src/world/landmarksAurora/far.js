// Low-cost mass of the moored cruiser across the Nevka. It retains the actual
// hull and waterline, three funnels, deck houses and both tall masts. Tiny gun,
// railing and rigging details stay in the near model. Shared factory materials,
// no textures, ordinary static batching and a finite authored viewing range.
import * as THREE from 'three';
import { LOD } from '../../core/lod.js';
import { Parts } from './kit.js';
import { SHIP, shipWaterY } from './frame.js';
import { buildHull, deckY, half } from './hull.js';

export function buildFarShip(ctx) {
  const P = new Parts(), H = buildHull(), root = new THREE.Group();
  root.name = 'aurora-far-mass';
  const mat = (c, name) => ctx.mat.emissive(c, .85, { name, side: 'double' });
  const grey = mat('#6e7882', 'aurora-far-grey'), dark = mat('#474e57', 'aurora-far-dark');
  const green = mat('#1f9d55', 'aurora-far-green'), white = mat('#eeece4', 'aurora-far-white');
  const deck = mat('#9a7b55', 'aurora-far-deck');
  P.push(SHIP.x, shipWaterY(), SHIP.z, SHIP.rot);
  for (const [geos, m] of [[H.boot, green], [H.line, white], [H.plate, grey]])
    for (const g of geos) { P.geo(m, g, 0, -.03, 0, 0, 0, 0, 1, 1, .98); g.dispose(); }
  for (let i = 0; i + 1 < H.cols.length; i++) {
    const a = H.cols[i], b = H.cols[i + 1]; if (b - a < .05) continue;
    const ya = deckY(a + .02), yb = deckY(b - .02), ha = half(a, ya), hb = half(b, yb);
    P.quad(deck, [a,ya-.05,ha*.98], [b,yb-.05,hb*.98], [b,yb-.05,-hb*.98], [a,ya-.05,-ha*.98], [0,1,0]);
  }
  P.box(grey, -4.5, 27, 5.9, 8.1, -2.4, 2.4, 'b');
  P.box(grey, 25.05, 33.35, 5.9, 9.05, -3.05, 3.05, 'b');
  P.box(grey, 26.25, 29.45, 9.25, 11.45, -1.65, 1.65, 'b');
  P.box(grey, 25.85, 32.35, 9.1, 9.2, -7.85, 7.85, 'b');
  P.box(grey, -30.35, -25.45, 5.9, 8.95, -1.75, 1.75, 'b');
  P.box(grey, -31.55, -24.25, 9, 9.1, -6.35, 6.35, 'b');
  for (const x of [.2, 11.8, 23.5]) {
    P.col(grey, x, 0, 8.1, 21.6, 1.5, 1.5, 12, true);
    P.col(dark, x, 0, 21.6, 23.45, 1.52, 1.52, 12, true);
  }
  for (const [x, top] of [[28.5,39],[-27.7,43.5]]) {
    P.col(grey, x, 0, 8, top, .1, .05, 6, true);
    P.col(grey, x, 0, 24, 26, .8, .8, 8, true);
  }
  P.pop();
  for (const m of P.build(root, { name: 'aurora-far-mass', cast: false, receive: false })) {
    ctx.noOutline(m);
    // Nested just inside the detailed shell, so it can remain present nearby
    // without z-fighting. No near-only registration with an unbounded far tail.
    LOD.add(m, SHIP.x, SHIP.z, 90, 1400, { shadow: false });
  }
  ctx.addStatic(root);
}
