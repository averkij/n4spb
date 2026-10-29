// landmarksMarineFacade/shore.js - the Gulf-shore objects of the port area (dossier 4.10 + CRITIC, section 7):
//   * the YACHT MARINE on the north shore of the land fill: a floating timber main pier 3 m wide along the 8-node raw line (595 m, from (-9218.5, -2371.9) to (-8645.1, -2212.0)), five 2 m finger piers of
//     45-51 m to the north, ~35 white motor yachts and a few sailing boats of 9 / 12 / 15 m (instanced; no names, no flags, no masts with flags).  The piers are lines in the data (environment/boats.js
//     pierRects() ignores them), so this module owns them; they float 12 m off the rubble revetment, over water; nobody can reach them (no walk boxes).
//   * the two «Маяк» art objects at (-8684, -811) and (-8667, -541): the design is UNDOCUMENTED (the dossier calls the white lighthouse an invention), so each is the cheapest placeholder: a round plaza
//     d 8 m (clipped at the asphalt: the nodes lie only 11-12 m from the centreline of Lisyansky street), a plinth and a slender tapering lighthouse-like column 5.2 m with two red bands, tier 3.
import * as THREE from 'three';
import * as L from '../layout.js';
import { WATER_Y } from './frame.js';
import { coverFn, fillPolyClipped } from './surfaces.js';
import { prism } from './geo.js';

const MAIN = [[-9218.5, -2371.9], [-9145.8, -2351.6], [-9049.3, -2324.7], [-8965.8, -2301.4], [-8885.4, -2279.0], [-8837.4, -2265.6], [-8793.5, -2253.4], [-8645.1, -2212.0]];
const FINGERS = [[[-8793.5, -2253.4], [-8782.1, -2296.8]], [[-8837.4, -2265.6], [-8824.1, -2314.4]], [[-8885.4, -2279.0], [-8873.9, -2323.4]], [[-8965.8, -2301.4], [-8954.3, -2346.1]], [[-9049.3, -2324.7], [-9036.7, -2368.4]]];
export const MAYAK = [{ id: 'n13416353221', x: -8683.7, z: -810.8, rot: 0.6 }, { id: 'n12149444658', x: -8666.9, z: -541.2, rot: 0.5 }];

/** a flat strip of constant width along a polyline at height y (uv: metres) */
function deck(P, mat, pts, w, y) {
  let acc = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = -dz / l * w / 2, nz = dx / l * w / 2;
    P.quad(mat, [a[0] + nx, y, a[1] + nz], [b[0] + nx, y, b[1] + nz], [b[0] - nx, y, b[1] - nz], [a[0] - nx, y, a[1] - nz], [0, 1, 0], [[acc / 3, 0], [(acc + l) / 3, 0], [(acc + l) / 3, w / 3], [acc / 3, w / 3]]);
    acc += l;
  }
}

export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics, cover = coverFn(ctx);
  const step = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMarineFacade/shore] ${name}:`, e); } };
  // ---------------------------------------------------------------------------------------- the marina
  step('marina', () => {
    const Y = WATER_Y + 0.35;
    deck(P, M.timber, MAIN, 3.0, Y);
    for (const f of FINGERS) deck(P, M.timber, f, 2.0, Y + 0.01);
    // yachts: 3-4 per side of every finger, centred along the finger, white, three sizes (instanced)
    const sizes = [9, 12, 15], list = [[], [], []];
    let nBoat = 0;
    FINGERS.forEach((f, fi) => {
      const dx = f[1][0] - f[0][0], dz = f[1][1] - f[0][1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, nx = -uz, nz = ux;
      for (const side of [-1, 1]) {
        let s = 3.0, k = 0;
        while (s + 8 < len) {
          const sz = (fi + k + (side > 0 ? 1 : 0)) % 3, Lb = sizes[sz];
          if (s + Lb > len + 1) break;
          const off = 1.0 + 1.6 + 0.2, cx = f[0][0] + ux * (s + Lb / 2) + nx * side * off, cz = f[0][1] + uz * (s + Lb / 2) + nz * side * off;
          if ((fi * 7 + k * 3 + (side > 0 ? 1 : 0)) % 5 !== 4) { list[sz].push({ x: cx, z: cz, rot: Math.atan2(-uz, ux) + (side > 0 ? 0 : Math.PI) }); nBoat++; }
          s += Lb + 1.0; k++;
        }
      }
    });
    sizes.forEach((Lb, i) => {
      const yacht = (Q) => {
        const B = Lb * 0.34, ring = [[-Lb / 2, -B / 2], [Lb / 2 - Lb * 0.28, -B / 2], [Lb / 2, 0], [Lb / 2 - Lb * 0.28, B / 2], [-Lb / 2, B / 2]];
        prism(Q, ring, 0, 1.5, { wall: M.yachtWhite, roof: M.yachtWhite }, { tile: 4, capTile: 4 });
        Q.box(M.yachtWhite, -Lb * 0.27, Lb * 0.14, 1.5, 2.5, -B * 0.3, B * 0.3, 'b', 2); Q.box(M.shipDark, -Lb * 0.2, Lb * 0.12, 1.85, 2.2, -B * 0.31, B * 0.31, '', 1);
        if (i === 1) Q.col(M.rod, -Lb * 0.05, 0, 2.5, 13.5, 0.07, 0.05, 5, false);                                                     // the 12 m boats are sailing yachts
      };
      for (const b of list[i]) { P.push(b.x, WATER_Y - 0.3, b.z, b.rot); try { yacht(P); } finally { P.pop(); } }
    });
    svc.counts.yachts = nBoat;
  });
  // ---------------------------------------------------------------------------------------- the two Mayak placeholders
  for (const m of MAYAK) step('mayak-' + m.id, () => {
    // plaza d 8 m (r 4.0), clipped at the asphalt; the paving is a pale ring, the kerb a darker rim
    const ring = Array.from({ length: 16 }, (_, i) => [m.x + Math.cos(i / 16 * Math.PI * 2) * 4.0, m.z + Math.sin(i / 16 * Math.PI * 2) * 4.0]);
    fillPolyClipped(P, M.concrete, ring, 0.08, cover, { margin: 0.3, maxEdge: 3, tile: 3 });
    P.push(m.x, 0, m.z, m.rot);
    try {
      P.box(M.plinth, -0.5, 0.5, 0, 0.9, -0.5, 0.5, 'b', 1);
      P.col(M.mayak, 0, 0, 0.9, 4.6, 0.62, 0.36, 12, true);
      P.col(M.dark, 0, 0, 4.6, 4.75, 0.5, 0.5, 12, true);
      P.col(M.lantern, 0, 0, 4.75, 5.55, 0.4, 0.4, 10, true);
      P.col(M.mayakRoof, 0, 0, 5.55, 6.15, 0.5, 0.05, 10, true);
    } finally { P.pop(); }
    ph.addCylinder(m.x, m.z, 0.7, 0, 6.2);
    svc.monuments.push({ id: m.id, name: 'Маяк', at: [m.x, m.z], x: m.x, z: m.z, h: 6.1 });
  });
}
