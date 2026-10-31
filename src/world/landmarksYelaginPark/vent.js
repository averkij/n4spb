// landmarksYelaginPark/vent.js - the METRO VENTILATION PAVILION of the Yelagin park (OSM w107154084 / mineshaft, (-5248.4, -4901.8), ref 511, operator Petersburg Metro; mapped as a 16-gon 7.0 x 6.9 m).
// Photo (docs/research/yelagin-park-2026.md misc 10): an OCTAGONAL pavilion on a lawn beside a gravel path: a stepped foot, a base of honey limestone blocks in horizontal courses (about a third
// of the height) with a profiled top ledge, above it an open drum of black horizontal LOUVRES between eight corner posts (the dark shaft shows between the slats), a heavy black rim and a low black
// pyramid.  Height 6.9 m [E from the photo ratio], across the flats 6.65 m.  Solid (collider along the octagon); nothing to enter.  ~1.5 k triangles.
import { addPolyColliders } from '../lib/massing.js';
import { VENT } from './frame.js';

export function build(K) {
  const { ctx, P, M, svc } = K, { x, z } = VENT;
  const R = 3.6, rot0 = Math.PI / 8;                                           // circumradius of the base walls; the corners point N / E / S / W when rot0 = 0 -> flats face them with PI / 8
  P.far = 520;
  P.push(x, 0, z, 0);
  P.prism(M.limestoneCap, 0, 0, R + 0.22, 8, 0, 0.14, rot0, { sides: true });                                 // the lower foot
  P.prism(M.limestoneCap, 0, 0, R + 0.1, 8, 0.14, 0.3, rot0, { sides: true });                                // the second step
  P.prism(M.limestone, 0, 0, R, 8, 0.3, 2.3, rot0, { sides: true, top: false });                              // the ashlar wall (uv 1 m tiles: two courses of 0.5 m)
  P.prism(M.limestoneCap, 0, 0, R + 0.12, 8, 2.3, 2.52, rot0, { sides: true, bottom: true });                             // the ledge
  // the drum: eight corner posts, the bottom and top rails, the louvres, the dark shaft behind
  const Rd = R - 0.14, y0 = 2.52, y1 = 6.1;
  P.prism(M.dark, 0, 0, Rd - 0.28, 8, y0, y1, rot0 + Math.PI / 8 * 0, { sides: true, top: false });          // the dark inner drum seen between the louvres
  P.prism(M.louvre, 0, 0, Rd, 8, y0, y0 + 0.34, rot0, { sides: true });                                       // the bottom rail
  const corner = [];
  for (let i = 0; i < 8; i++) { const a = rot0 + i / 8 * Math.PI * 2; corner.push([Math.sin(a) * Rd, Math.cos(a) * Rd]); }
  for (const [cx, cz] of corner) P.box(M.louvreEdge, cx - 0.09, cx + 0.09, y0, y1, cz - 0.09, cz + 0.09, '', 1);
  const slatY = []; for (let y = y0 + 0.5; y < y1 - 0.4; y += 0.21) slatY.push(y);
  for (let i = 0; i < 8; i++) {
    const a = corner[i], b = corner[(i + 1) % 8], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    const nx = (a[0] + b[0]) / 2, nz = (a[1] + b[1]) / 2, nl = Math.hypot(nx, nz), ox = nx / nl, oz = nz / nl;
    const ux = dx / len, uz = dz / len;
    for (const y of slatY) {                                                 // a tilted blade: the lower edge sticks out 7 cm, the upper edge is flush (about 28 degrees)
      const lo = 0.06, hi = -0.02, hh = 0.17, e0 = 0.1, e1 = len - 0.1;
      const p0 = [a[0] + ux * e0 + ox * lo, y, a[1] + uz * e0 + oz * lo], p1 = [a[0] + ux * e1 + ox * lo, y, a[1] + uz * e1 + oz * lo];
      const p2 = [a[0] + ux * e1 + ox * hi, y + hh, a[1] + uz * e1 + oz * hi], p3 = [a[0] + ux * e0 + ox * hi, y + hh, a[1] + uz * e0 + oz * hi];
      const nrm = [ox * 0.88, 0.47, oz * 0.88];
      P.quad(M.louvre, p0, p1, p2, p3, nrm, [[0, 0], [len, 0], [len, 0.2], [0, 0.2]]);
      P.quad(M.louvre, p3, p2, p1, p0, [-nrm[0], -nrm[1], -nrm[2]], [[0, 0], [len, 0], [len, 0.2], [0, 0.2]]);
    }
  }
  P.prism(M.louvre, 0, 0, Rd + 0.1, 8, y1, y1 + 0.34, rot0, { sides: true, top: false });                    // the heavy top rim
  P.fan(M.louvre, corner.map(([cx, cz]) => [cx * 1.04, y1 + 0.34, cz * 1.04]), [0, 1, 0]);                    // (flat deck under the pyramid)
  // the low pyramid: eight triangles to a ridge point 0.55 m up
  P.fan(M.dark, corner.map(([cx, cz]) => [cx * 1.04, y1 + 0.34, cz * 1.04]), [0, -1, 0]);                    // (the underside of that deck: the roof is seen from below between the louvres)
  const apex = [0, y1 + 0.34 + 0.6, 0];
  for (let i = 0; i < 8; i++) {
    const a = corner[i], b = corner[(i + 1) % 8], q0 = [a[0] * 1.07, y1 + 0.34, a[1] * 1.07], q1 = [b[0] * 1.07, y1 + 0.34, b[1] * 1.07];
    const mx = (q0[0] + q1[0]) / 2, mz = (q0[2] + q1[2]) / 2, ml = Math.hypot(mx, mz);
    P.fan(M.louvre, [apex, q1, q0], [mx / ml * 0.4, 0.92, mz / ml * 0.4]);
  }
  P.pop();
  // the collider along the octagon (the stepped foot is walkable around it)
  const ring = []; for (let i = 0; i < 8; i++) { const a = rot0 + i / 8 * Math.PI * 2; ring.push(x + Math.sin(a) * (R + 0.1), z + Math.cos(a) * (R + 0.1)); }
  addPolyColliders(ctx, { o: ring, h: [] }, 0, 7.0, 0.5);
  svc.monuments.push({ id: VENT.id, name: 'Вентиляционный павильон метро', nameEn: 'Metro ventilation pavilion (ref 511)', x, z, h: 6.9, r: 4.2 });
  svc.vent = { x, z, R, tris: 0 };
}
