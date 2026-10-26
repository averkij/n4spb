// landmarksMariinsky/canalside.js - the covered pedestrian SKYBRIDGE between the Mariinsky Theatre and Mariinsky-II (OSM w220183360, building=bridge, level 1-2, (-3111.7,814.5) .. (-3144.1,824.7), 34 x 5.3 m):
// a glazed gallery 3.6 m high on a steel floor slab 5.2 m above the street, a dark steel roof, blue banners on both sides (plain lettering «МАРИИНСКИЙ ТЕАТР»; the real banners carry the festival text), two
// inclined steel struts with tie rods at the Mariinsky-II end (photo 60).  Dossier docs/research/mariinsky.md section 6.  Not walkable (the real bridge is a closed gallery).
import { BUILDINGS } from '../data/city.js';

export function build(K, M, D, svc) {
  const P = K.P, ctx = K.ctx, T = ctx.mat.toon;
  const rec = BUILDINGS.find((b) => b.id === 'w220183360'); if (!rec) return;
  const a = [-3111.0, 817.0], b = [-3143.3, 827.2];
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, rot = Math.atan2(-dz, dx);
  const glass = T('#7f9a95', { name: 'lmM-skyGlass', paint: 0.01 }), steel = M.m2Steel;
  const banner = T('#ffffff', { map: K.signTex('МАРИИНСКИЙ ТЕАТР', { w: 1024, h: 160, bg: '#1d3f8f', fg: '#f4f1e6', font: ctx.tex.FONTS.serif, weight: 600, size: 0.52, fill: 0.9 }), name: 'lmM-skyBanner', paint: 0 });
  P.push(mx, 0, mz, rot);
  try {
    const hw = 2.65, y0 = 5.2;
    P.box(steel, -L / 2, L / 2, y0, y0 + 0.45, -hw, hw, '');                                     // floor slab (steel box girder)
    P.box(steel, -L / 2, L / 2, y0 + 3.9, y0 + 4.2, -hw - 0.1, hw + 0.1, '');                    // roof
    for (const s of [-1, 1]) {
      const z = s * hw;
      P.quad(glass, [-L / 2, y0 + 0.45, z], [L / 2, y0 + 0.45, z], [L / 2, y0 + 3.9, z], [-L / 2, y0 + 3.9, z], [0, 0, s]);
      for (let x = -L / 2; x <= L / 2 + 0.01; x += 1.8) P.box(steel, x - 0.04, x + 0.04, y0 + 0.45, y0 + 3.9, z - 0.04, z + 0.04, '');
      // banner (outer face), the middle 22 m, 2.4 m high
      P.quad(banner, s > 0 ? [-11, y0 + 0.9, z + 0.07 * s] : [11, y0 + 0.9, z + 0.07 * s], s > 0 ? [11, y0 + 0.9, z + 0.07 * s] : [-11, y0 + 0.9, z + 0.07 * s], s > 0 ? [11, y0 + 3.3, z + 0.07 * s] : [-11, y0 + 3.3, z + 0.07 * s], s > 0 ? [-11, y0 + 3.3, z + 0.07 * s] : [11, y0 + 3.3, z + 0.07 * s], [0, 0, s], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    // inclined struts at the Mariinsky-II end (x = -L/2 is the end towards b) with tie rods
    for (const s of [-1, 1]) {
      P.cyl(steel, [-L / 2 + 1.2, y0 + 4.2, s * 2.9], [-L / 2 + 8.0, y0 + 11.2, s * 2.9], 0.22, 0.12, 8, false);
      for (const t of [0.4, 0.7, 0.95]) P.cyl(steel, [-L / 2 + 8.0, y0 + 11.2, s * 2.9], [-L / 2 + 8.0 + (L - 10) * t * 0.9, y0 + 4.2, s * 2.7], 0.025, 0.025, 4, false);
    }
  } finally { P.pop(); }
  svc.parts.skybridge = { x: mx, z: mz, len: L };
}
