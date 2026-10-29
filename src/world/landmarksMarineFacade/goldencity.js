// landmarksMarineFacade/goldencity.js - GOLDEN CITY quarter 6 (Chelyuskina 2, OSM r7378335 + its four parts; dossier 6.1-6.6 and CRITIC 12b): the U-shaped perimeter block round a lawn court, drawn with the REAL heights
// (1.2 m ground floor + n x 3.0 m: 6 fl = 19.2 m, 14 fl = 43.2 m, 17 fl = 52.2 m; the baked levels x 3.3 were wrong), a pale grid facade (window 1.1 x 2.3 m, bay 1.74 m: the facade shader with thick pilasters),
// green roofs on the 6-storey wings, and on the 17-storey tower r10034571 the openwork GOLD SPIRE (52.4 m: a gold ring band on the full 15.7 x 30.9 m footprint, a bell-shaped lattice hip of K-braced rings narrowing to
// 8 x 8 m at 22 m, a four-post needle with ring frames and X bracing, three open platform rings, a finial); on r10034570 (14 fl) a gold BOX CROWN (4 storeys of beams, posts and N-bracing); the same crown is
// laid over the generic towers r12001859 and r12001860 (not claimed: base = their generic roof, `L.heightOf`).  Gold by day: #c9a43c; no light, no flags.  Frame G (frame.js): origin (-8715.7, -967), rotation -1.7785.
import * as THREE from 'three';
import * as L from '../layout.js';
import { G, GW } from './frame.js';
import { ringOf, obb, prism, rotYOf } from './geo.js';
import { addPolyColliders } from '../lib/massing.js';
import { hash2 } from './util.js';
import { Parts } from './kit.js';
import { LOD } from '../../core/lod.js';

export const PARTS = [['r10034568', 6, 'green'], ['r10034569', 6, 'green'], ['r10034570', 14, 'tar'], ['r10034571', 17, 'tar']];
const heightOfFloors = (n) => 1.2 + n * 3.0;

export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const step = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMarineFacade/goldencity] ${name}:`, e); } };
  // ---------------------------------------------------------------------------------------- the four parts
  for (const [id, fl, roof] of PARTS) step(id, () => {
    const ring = ringOf(id); if (!ring) { console.warn('[landmarksMarineFacade/goldencity] no ring', id); return; }
    const h = heightOfFloors(fl);
    prism(P, ring, 0, h, { wall: M.gcFacade, roof: roof === 'green' ? M.gcRoof : M.gcTar }, { uv: 'cells', bay: 1.74, floor: 3.0, capTile: 4 });
    // parapet 0.9 m (a plain pale block ring: outward faces only) and roof plant (deterministic boxes)
    prism(P, ring, h, h + 0.9, { wall: M.gcStone }, { tile: 3, skipCap: true });
    const B = obb(ring);
    for (let i = 0; i < (roof === 'green' ? 4 : 6); i++) {
      const a = (hash2(i, fl, 11) - 0.5) * 1.5 * B.hl, b = (hash2(i, fl, 12) - 0.5) * 1.2 * B.hw, x = B.cx + B.ux * a + B.vx * b, z = B.cz + B.uz * a + B.vz * b;
      if (!pointIn(ring, x, z)) continue;
      P.box(M.gcPlant, x - 1.4, x + 1.4, h, h + 1.3 + hash2(i, 5, 13) * 0.8, z - 1.0, z + 1.0, 'b', 2);
    }
    const poly = { o: ring.flat(), h: [] }; addPolyColliders(ctx, poly, 0, h, 0.9);
  });
  // the lawn court (the hole of the outline r7378335): lawn, 12 paths are the generic ground
  step('court', () => {
    const b = L.buildingById('r7378335'); const hole = b && b.polys[0] && b.polys[0].h[0]; if (!hole) return;
    const ring = []; for (let i = 0; i < hole.length; i += 2) ring.push([hole[i], hole[i + 1]]);
    P.cap(M.lawn, ring, 0.07, true, 5);
  });
  // the thin gold lattices (spire, crowns) are separate meshes with a distance LOD: the lattice within ~1.1 km, a solid gold silhouette proxy beyond ~0.8 km (a 0.14 m rod is sub-pixel at 2 km, the spire must stay a skyline mark)
  const LQ = new Parts(), PX = new Parts();
  // ---------------------------------------------------------------------------------------- the spire on the tower r10034571 (frame G, base = the tower roof 52.2 m)
  step('spire', () => spire(K, heightOfFloors(17), LQ, PX));
  // ---------------------------------------------------------------------------------------- crowns: r10034570 (claimed block) and the overlays
  step('crown-claimed', () => { const r = ringOf('r10034570'); if (r) crown(K, r, heightOfFloors(14) - 0.0, 12, LQ, PX); });
  for (const id of ['r12001859', 'r12001860']) step('crown-' + id, () => {
    const b = L.buildingById(id), r = ringOf(id); if (!b || !r) return; const hh = L.heightOf(b); if (!(hh > 5)) return; crown(K, r, hh - 0.3, 12, LQ, PX);
  });
  step('lod', () => { K.extraTris += lodMeshes(K, LQ, 'lmmarin-lattice', { far: 1100 }) + lodMeshes(K, PX, 'lmmarin-latticeFar', { near: 800 }); });
  svc.monuments.push({ id: 'r10034571', name: 'Золотой шпиль ЖК Golden City (ул. Челюскина, 2)', x: G.x, z: G.z, h: heightOfFloors(17) + 52.4 });
  svc.towers = { spire: { x: G.x, z: G.z, tip: heightOfFloors(17) + 52.4 }, crowns: ['r10034570', 'r12001859', 'r12001860'] };
}

function pointIn(ring, x, z) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) if ((ring[i][1] > z) !== (ring[j][1] > z) && x < (ring[j][0] - ring[i][0]) * (z - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0]) c = !c; return c; }

/** a solid four-sided frustum between two plan rectangles (half sizes hx0 x hz0 at y0, hx1 x hz1 at y1) */
function frustumQuads(Q, mat, hx0, hz0, y0, hx1, hz1, y1) {
  const A = [[-hx0, y0, -hz0], [hx0, y0, -hz0], [hx0, y0, hz0], [-hx0, y0, hz0]], B = [[-hx1, y1, -hz1], [hx1, y1, -hz1], [hx1, y1, hz1], [-hx1, y1, hz1]];
  const ns = [[0, 0.1, -1], [1, 0.1, 0], [0, 0.1, 1], [-1, 0.1, 0]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; Q.quad(mat, A[i], A[j], B[j], B[i], ns[i], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
}

/** a thin gold rod between two points of the current frame */
const rod = (P, M, a, b, r = 0.14, mat) => P.cyl(mat || M.gold, a, b, r, r, 5, false);

/** the gold box crown (cage) of a tower: the oriented rectangle of `ring`, 12 m tall from y0: five beam rings every 3 m, posts at ~3.3 m pitch, alternating diagonals in every bay, a dark glazed core */
function crown(K, ring, y0, hgt, P, PX) {
  const { M } = K, B = obb(ring), hl = B.hl + 0.15, hw = B.hw + 0.15;
  PX.push(B.cx, 0, B.cz, rotYOf(B.ux, B.uz)); PX.box(M.gold, -hl, hl, y0, y0 + hgt, -hw, hw, 'b', 4); PX.pop();                  // the solid silhouette proxy of the cage
  P.push(B.cx, 0, B.cz, rotYOf(B.ux, B.uz));
  try {
    const rect = [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]];
    P.box(M.gcDark, -hl + 0.3, hl - 0.3, y0, y0 + hgt, -hw + 0.3, hw - 0.3, 'b', 4);                 // the glazed core behind the cage
    const lv = 4;
    for (let k = 0; k <= lv; k++) { const y = y0 + hgt * k / lv; for (let i = 0; i < 4; i++) { const a = rect[i], b = rect[(i + 1) % 4], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2; P.push(cx, y, cz, Math.atan2(-dz, dx)); P.box(M.gold, -l / 2, l / 2, -0.14, 0.14, -0.14, 0.14, '', 1); P.pop(); } }
    for (let i = 0; i < 4; i++) {
      const a = rect[i], b = rect[(i + 1) % 4], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), n = Math.max(2, Math.round(l / 3.3));
      for (let j = 0; j <= n; j++) { const x = a[0] + dx * j / n, z = a[1] + dz * j / n; P.box(M.gold, x - 0.14, x + 0.14, y0, y0 + hgt, z - 0.14, z + 0.14, 'b', 1); }
      for (let j = 0; j < n; j++) for (let k = 0; k < lv; k++) {
        const p0 = [a[0] + dx * j / n, a[1] + dz * j / n], p1 = [a[0] + dx * (j + 1) / n, a[1] + dz * (j + 1) / n], ya = y0 + hgt * k / lv, yb = y0 + hgt * (k + 1) / lv;
        if ((j + k) % 2) rod(P, M, [p0[0], ya, p0[1]], [p1[0], yb, p1[1]], 0.09); else rod(P, M, [p1[0], ya, p1[1]], [p0[0], yb, p0[1]], 0.09);
      }
    }
  } finally { P.pop(); }
}

/** the spire: frame G (x along the long axis, z across), base y0 = the tower roof */
function spire(K, y0, P, PX) {
  const { M } = K, HX = 15.45, HZ = 7.85;
  P.push(G.x, y0, G.z, G.rot); PX.push(G.x, y0, G.z, G.rot);
  try {
    // 1. the ring band (0 .. 3.4 m): gold ribs 0.35 m wide at 1.0 m pitch on the full footprint, ring beams top and bottom, dark glazing behind
    const rc = [[-HX, -HZ], [HX, -HZ], [HX, HZ], [-HX, HZ]];
    P.box(M.gcDark, -HX + 0.25, HX - 0.25, 0, 3.4, -HZ + 0.25, HZ - 0.25, 'b', 4);
    for (let i = 0; i < 4; i++) {
      const a = rc[i], b = rc[(i + 1) % 4], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), n = Math.round(l / 1.0);
      for (let j = 0; j < n; j++) { const x = a[0] + dx * (j + 0.5) / n, z = a[1] + dz * (j + 0.5) / n; P.box(M.gold, x - 0.17, x + 0.17, 0, 3.4, z - 0.17, z + 0.17, 'b', 1); }
      for (const y of [0.0, 3.2]) { P.push((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, Math.atan2(-dz, dx)); P.box(M.gold, -l / 2 - 0.2, l / 2 + 0.2, 0, 0.25, -0.22, 0.22, 'b', 1); P.pop(); }
    }
    // 2. the hip: rings of K-braced lattice from the full footprint to 8 x 8 m at 22 m (the bell profile of the photographs: steep, a shoulder at ~13 m, then closing)
    const lerp = (a, b, t) => a + (b - a) * t;
    const levels = [[3.4, 0.10], [7.9, 0.40], [12.4, 0.45], [16.9, 0.62], [22.0, 1.0]];
    const ringPts = (p, y) => {                                         // points of a rectangle ring at progress p: 8 per long side, 4 per short side
      const hx = lerp(HX, 4, p), hz = lerp(HZ, 4, p), pts = [];
      const side = (a, b, n) => { for (let j = 0; j < n; j++) pts.push([lerp(a[0], b[0], j / n), y, lerp(a[1], b[1], j / n)]); };
      side([-hx, -hz], [hx, -hz], 8); side([hx, -hz], [hx, hz], 4); side([hx, hz], [-hx, hz], 8); side([-hx, hz], [-hx, -hz], 4);
      return pts;
    };
    let prev = ringPts(levels[0][1], levels[0][0]);
    for (let k = 1; k < levels.length; k++) {
      const cur = ringPts(levels[k][1], levels[k][0]), n = cur.length;
      for (let i = 0; i < n; i++) {
        rod(P, M, cur[i], cur[(i + 1) % n], 0.22);                                       // the ring beam
        rod(P, M, prev[i], cur[i], 0.2);                                                // strut
        rod(P, M, prev[i], cur[(i + 1) % n], 0.16);                                      // diagonal (alternating K)
      }
      prev = cur;
    }
    // 3. the needle: four posts from the 8 x 8 m square at 22 m to the tip at 52.4 m, ring frames every ~3.5 m with X bracing
    const W = [[22, 4.0], [26.3, 3.5], [30.6, 2.85], [34.9, 2.35], [39.2, 1.6], [43.6, 1.1], [45, 0.6], [52.4, 0.0]];
    const half = (y) => { for (let i = 0; i + 1 < W.length; i++) if (y <= W[i + 1][0]) return lerp(W[i][1], W[i + 1][1], (y - W[i][0]) / (W[i + 1][0] - W[i][0])); return 0; };
    const ys = [22, 25.5, 29, 32.5, 36, 39.5, 43, 46.5, 50.4];
    let pr = null;
    for (const y of ys) {
      const h = half(y), c = [[-h, -h], [h, -h], [h, h], [-h, h]].map((q) => [q[0], y, q[1]]);
      if (h > 0.05) for (let i = 0; i < 4; i++) rod(P, M, c[i], c[(i + 1) % 4], 0.17);
      if (pr) for (let i = 0; i < 4; i++) {
        rod(P, M, pr[i], c[i], 0.2);
        rod(P, M, pr[i], c[(i + 1) % 4], 0.12); rod(P, M, pr[(i + 1) % 4], c[i], 0.12);
      }
      pr = c;
    }
    // a thin solid core so the needle never vanishes at 5-8 km (the lattice rods are far thinner than a pixel there)
    P.cyl(M.gold, [0, 22, 0], [0, 52.4, 0], 0.32, 0.03, 4, false);
    // three open platform rings (d 5, 4, 3 m at 30, 38, 45 m)
    for (const [y, r] of [[30, 2.5], [38, 2.0], [45, 1.5]]) for (let i = 0; i < 12; i++) { const a0 = i / 12 * Math.PI * 2, a1 = (i + 1) / 12 * Math.PI * 2; rod(P, M, [Math.cos(a0) * r, y, Math.sin(a0) * r], [Math.cos(a1) * r, y, Math.sin(a1) * r], 0.12, M.goldLit); }
    // the solid silhouette proxy: the ring band, the bell hip and the needle as stacked frusta of the same plan rings (a four-sided solid in gold)
    { const ringXY = (p) => [lerp(HX, 4, p), lerp(HZ, 4, p)];
      PX.box(M.gold, -HX, HX, 0, 3.4, -HZ, HZ, 'b', 4);
      let prevR = ringXY(levels[0][1]), py = levels[0][0];
      for (let k = 1; k < levels.length; k++) { const r2 = ringXY(levels[k][1]), y2 = levels[k][0]; frustumQuads(PX, M.gold, prevR[0], prevR[1], py, r2[0], r2[1], y2); prevR = r2; py = y2; }
      let pp = 4, pyy = 22;
      for (const [y, h] of W.slice(1)) { frustumQuads(PX, M.gold, pp, pp, pyy, h, h, y); pp = h; pyy = y; } }
    // the finial
    rod(P, M, [0, 50.4, 0], [0, 52.2, 0], 0.05);
    const g = new THREE.SphereGeometry(0.2, 8, 6); P.geo(M.goldLit, g, 0, 52.3, 0); g.dispose();
  } finally { P.pop(); PX.pop(); }
}

/** the lattice / proxy Parts as noBatch meshes registered with the distance LOD (far: hidden beyond that distance; near: drawn only beyond it); returns the triangle count */
function lodMeshes(K, Q, name, o) {
  const meshes = Q.build(K.root, { name });
  for (const m of meshes) {
    K.ctx.noBatch(m); K.ctx.noOutline(m);
    const s = m.geometry.boundingSphere;
    LOD.add(m, s.center.x, s.center.z, s.radius, o.far ?? Infinity, o.near ? { near: o.near } : {});
  }
  return Q.tris;
}
export { GW };
