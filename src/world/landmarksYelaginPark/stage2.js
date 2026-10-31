// landmarksYelaginPark/stage2.js - the OPEN STAGE of the Big Square area (OSM w111429666, description "Открытая сцена", building=yes, hexagon 28.8 x 14.3 m at about (-4746, -5421), NE of the
// island in the region YE1 that the foundation owner bakes in the same round).  NO photograph exists (docs/research/yelagin-park-2026.md 11 "photo needed [?]"): everything here is [E]:
// a 0.9 m plank deck on a glulam fascia, six steel posts at the corners of the outline carrying a flat-pitched timber roof (4.6 m, membrane over a plywood soffit and a glulam fascia ring),
// two flights of steps on the long north side.  The ring below is the raw OSM way (converted with tools/osm-lib.mjs proj); it is replaced by the baked record when that exists.
// The part is built only when its claim 'ypark-openstage' is switched on in groups.js (the id must exist in the baked data first).
import { BUILDINGS } from '../data/city.js';
import { ringOf } from './kit.js';
import { deckBoxes } from './theatre.js';

export const RING_RAW = [[-4752.4, -5415.6], [-4758.8, -5417.8], [-4757.3, -5428.6], [-4734.5, -5430.8], [-4730.2, -5421.4], [-4738.3, -5416.2]];

export function build(K) {
  const { ctx, P, M, svc } = K;
  const rec = BUILDINGS.find((b) => b.id === 'w111429666' && b.polys && b.polys.length);
  const o = rec ? ringOf(rec.polys[0].o) : RING_RAW, deck = 0.9, roofY = 4.6;
  const cx = o.reduce((s, p) => s + p[0], 0) / o.length, cz = o.reduce((s, p) => s + p[1], 0) / o.length;
  // orientation: the long axis of the polygon (PCA) for the collider box
  let sxx = 0, sxz = 0, szz = 0; for (const p of o) { const dx = p[0] - cx, dz = p[1] - cz; sxx += dx * dx; sxz += dx * dz; szz += dz * dz; }
  const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ax = Math.cos(th), az = Math.sin(th);
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const p of o) { const dx = p[0] - cx, dz = p[1] - cz, u = dx * ax + dz * az, v = -dx * az + dz * ax; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const grow = (k) => o.map((p) => [cx + (p[0] - cx) * k, cz + (p[1] - cz) * k]);
  P.ranged(700, () => {
    P.cap(M.deck, o, deck, true, 2);
    for (let i = 0; i < o.length; i++) {                                                        // fascia, both sides drawn (the outline winding is not assumed)
      const a = o[i], c = o[(i + 1) % o.length], dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      P.quad(M.glulam, [a[0], 0, a[1]], [c[0], 0, c[1]], [c[0], deck, c[1]], [a[0], deck, a[1]], [dz / l, 0, -dx / l], [[0, 0], [l / 2, 0], [l / 2, 0.45], [0, 0.45]]);
      P.quad(M.glulam, [c[0], 0, c[1]], [a[0], 0, a[1]], [a[0], deck, a[1]], [c[0], deck, c[1]], [-dz / l, 0, dx / l], [[0, 0], [l / 2, 0], [l / 2, 0.45], [0, 0.45]]);
    }
    const ro = grow(1.06), ri = grow(1.06);
    P.cap(M.membrane, ro, roofY, true, 3); P.cap(M.panel, ri, roofY - 0.34, false, 3);
    for (let i = 0; i < ro.length; i++) {                                                       // the roof fascia ring
      const a = ro[i], c = ro[(i + 1) % ro.length], dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      P.quad(M.glulam, [a[0], roofY - 0.34, a[1]], [c[0], roofY - 0.34, c[1]], [c[0], roofY, c[1]], [a[0], roofY, a[1]], [dz / l, 0, -dx / l], [[0, 0], [l / 2, 0], [l / 2, 0.17], [0, 0.17]]);
      P.quad(M.glulam, [c[0], roofY - 0.34, c[1]], [a[0], roofY - 0.34, a[1]], [a[0], roofY, a[1]], [c[0], roofY, c[1]], [-dz / l, 0, dx / l], [[0, 0], [l / 2, 0], [l / 2, 0.17], [0, 0.17]]);
    }
    const posts = grow(0.93);
    for (const p of posts) { P.col(M.steel, p[0], p[1], deck, roofY - 0.34, 0.09, 0.09, 8); ctx.physics.addCylinder(p[0], p[1], 0.14, deck, roofY - 0.34); }
    // ribs under the soffit across the short axis, every 3.6 m
    for (let u = u0 + 1.4; u < u1 - 1; u += 3.6) {
      P.beam(M.glulam, [[cx + ax * u + az * (v0 - 0.5), roofY - 0.5, cz + az * u - ax * (v0 - 0.5)], [cx + ax * u + az * (v1 + 0.5), roofY - 0.5, cz + az * u - ax * (v1 + 0.5)]], 0.14, 0.32, [ax, 0, az], 2);
    }
  });
  const rot = Math.atan2(-az, ax);
  deckBoxes(ctx, o, cx, cz, ax, az, deck, 2.4);
  // two flights of steps (two treads of 0.3 m, 1.8 m wide) on the north edge (the vertex pair nearest to the north), at 25 % and 75 % of it
  let ni = 0; for (let i = 0; i < o.length; i++) if (o[i][1] + o[(i + 1) % o.length][1] < o[ni][1] + o[(ni + 1) % o.length][1]) ni = i;
  const A = o[ni], B = o[(ni + 1) % o.length], ex = B[0] - A[0], ez = B[1] - A[1], el = Math.hypot(ex, ez) || 1;
  let nx = -ez / el, nz = ex / el; if ((A[0] - cx) * nx + (A[1] - cz) * nz < 0) { nx = -nx; nz = -nz; }
  const rotS = Math.atan2(-nx, -nz), run = 0.45;
  for (const t of [0.25, 0.75]) {
    const px = A[0] + ex * t, pz = A[1] + ez * t;
    P.ranged(300, () => { for (let j = 0; j < 2; j++) P.tbox(M.glulam, px + nx * run * (j + 0.5), pz + nz * run * (j + 0.5), 1.8, run, 0, deck - 0.3 * (j + 1), rotS); });
    ctx.physics.addStairs(px + nx * run, pz + nz * run, 1.8, run * 2, rotS, 0, deck - 0.3, 2);
  }
  svc.stage2 = { x: cx, z: cz, fromBake: !!rec };
  svc.monuments.push({ id: 'w111429666', name: 'Открытая сцена', nameEn: 'Open stage (Big Square)', x: cx, z: cz, h: roofY, r: 16 });
}
