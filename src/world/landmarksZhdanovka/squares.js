// landmarksZhdanovka/squares.js - the small furniture of the two squares of the Zhdanovka: Staro-Zhdanovsky (OSM w185784584, the wedge of lawn between Bolshoy pr. P.S. / the Zhdanovskaya embankment and the river, opposite the stadium)
// and Novo-Zhdanovsky (w185784578, the strip in front of Zhdanovskaya emb. 33).  The squares themselves (lawn, footways, trees, the OSM benches and bins) stay generic (environment, props); this file adds what the photos show on the
// lawn and the OSM data cannot: round flowerbeds with orange / red / yellow blooms (photo m17, p20), white slatted benches round them facing the bed (p21: benches with white concrete ends in a row, bins beside them) and clumps of lilac
// shrubs along the edge (m17: a thick lilac hedge by the corner house).  Everything is placed by rules (inside the green polygon, 4 m from its edge, clear of every road and footway, of buildings and of mapped trees), so nothing
// stands on a carriageway.  The Staro-Zhdanovsky gas station of the photos (a brand building) and the lamp posts (streets) are not drawn here.
// Budget about 1.5 k triangles, 3 materials of the module (bed row of the det atlas, cream, stone, shrub), ranged LOD 250-400 m.  Publishes svc.benches ([{ x, z, rotY }]) so that props does not draw an OSM bench on top of them.
import * as THREE from 'three';
import * as L from '../layout.js';
import * as CITY from '../data/city.js';
import { hash } from './kit.js';

const SQUARES = [
  { id: 'w185784584', name: 'Старо-Ждановский сквер', beds: 2, lilacs: 5, seed: 11 },
  { id: 'w185784578', name: 'Ново-Ждановский сквер', beds: 1, lilacs: 3, seed: 23 },
];

const ringOf = (o) => { const r = []; for (let i = 0; i + 1 < o.length; i += 2) r.push([o[i], o[i + 1]]); return r; };
const inRing = (r, x, z) => { let ins = false; for (let i = 0, k = r.length - 1; i < r.length; k = i++) { const [xi, zi] = r[i], [xk, zk] = r[k]; if ((zi > z) !== (zk > z) && x < (xk - xi) * (z - zi) / (zk - zi) + xi) ins = !ins; } return ins; };
const edgeDist = (r, x, z) => { let d = 1e9; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); d = Math.min(d, Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz)); } return d; };

/** one white slatted bench (length 1.9, seat 0.45 m high, the sitter looks to local +z) in the current frame */
function bench(P, M) {
  for (const sx of [-0.78, 0.78]) { P.box(M.stone, sx - 0.06, sx + 0.06, 0, 0.44, -0.24, 0.24, '', 1); P.box(M.stone, sx - 0.06, sx + 0.06, 0.44, 0.92, -0.26, -0.18, '', 1); }
  for (let k = 0; k < 3; k++) P.box(M.cream, -0.9, 0.9, 0.44, 0.48, -0.2 + k * 0.15, -0.2 + k * 0.15 + 0.12, '', 1);
  for (let k = 0; k < 2; k++) P.box(M.cream, -0.9, 0.9, 0.62 + k * 0.17, 0.62 + k * 0.17 + 0.12, -0.27, -0.22, '', 1);
}

export function build(K) {
  const { P, M, ctx, svc } = K, net = ctx.services.streets && ctx.services.streets.net;
  const trees = [];
  const placed = [];                                                                    // [x, z, r] of what this file has put down: nothing overlaps
  svc.benches = [];
  for (const sq of SQUARES) {
    const g = CITY.GREEN.find((q) => q.id === sq.id); if (!g || !g.polys || !g.polys[0]) continue;
    const ring = ringOf(g.polys[0].o);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of ring) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    const tr = []; for (let i = 0; i + 1 < CITY.TREES.length; i += 2) { const x = CITY.TREES[i], z = CITY.TREES[i + 1]; if (x > x0 - 6 && x < x1 + 6 && z > z0 - 6 && z < z1 + 6) tr.push([x, z]); }
    trees.push(...tr);
    const clear = (x, z, r, t = 2.2) => !L.insideBuilding(x, z, r) && !L.isOnRoad(x, z, r, { all: true }) && !(net && net.cover && net.cover(x, z, {}) > -r) && !tr.some((p) => Math.hypot(p[0] - x, p[1] - z) < t) && !placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < p[2] + r);
    const cand = [];
    for (let x = x0; x <= x1; x += 2.5) for (let z = z0; z <= z1; z += 2.5) { if (!inRing(ring, x, z)) continue; const d = edgeDist(ring, x, z); if (d >= 2) cand.push({ x, z, d }); }
    // ---- flowerbeds: the roomiest clear spots, 26 m apart; a kerb ring, the planted disc, a bench on each of two sides facing it
    const beds = [];
    cand.filter((c) => c.d >= 6).sort((a, b) => b.d - a.d || a.x - b.x || a.z - b.z).forEach((c) => {
      if (beds.length >= sq.beds || beds.some((b) => Math.hypot(b.x - c.x, b.z - c.z) < 26)) return;
      if (!clear(c.x, c.z, 4.2, 3.2)) return;
      beds.push(c); placed.push([c.x, c.z, 2.0]);
    });
    beds.forEach((b, bi) => {
      const R = 2.0 + 0.4 * hash(sq.seed, bi, 1);
      P.far = 300;
      P.col(M.stone, b.x, b.z, 0, 0.2, R + 0.14, R + 0.14, 24, false);
      const disc = Array.from({ length: 24 }, (_, k) => { const a = k / 24 * Math.PI * 2; return [b.x + Math.cos(a) * R, 0.24, b.z + Math.sin(a) * R]; });
      P.fan(M.stone, disc.map((p) => [b.x + (p[0] - b.x) * (R + 0.14) / R, 0.2, b.z + (p[2] - b.z) * (R + 0.14) / R]), [0, 1, 0], (p) => [0, 0]);
      P.fan(M.bed, disc, [0, 1, 0], (p) => [(p[0] - b.x) / (2 * R) + 0.5, (p[2] - b.z) / (2 * R) + 0.5]);
      for (const side of [0, 1]) {                                                              // two benches on opposite sides of the bed, facing it (the first free angle within +-60 deg of the nominal one)
        const base = hash(sq.seed, bi, 2) * Math.PI + side * Math.PI;
        for (const da of [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05]) {
          const a = base + da, bx = b.x + Math.cos(a) * (R + 1.5), bz = b.z + Math.sin(a) * (R + 1.5);
          if (!clear(bx, bz, 1.0, 1.4) || !inRing(ring, bx, bz)) continue;
          const rotY = Math.atan2(b.x - bx, b.z - bz);
          P.far = 250; P.push(bx, 0, bz, rotY); bench(P, M); P.pop();
          if (ctx.physics && ctx.physics.addBox) ctx.physics.addBox(bx, bz, 1.9, 0.6, rotY, 0, 0.9);
          svc.benches.push({ x: bx, z: bz, rotY }); placed.push([bx, bz, 1.0]);
          break;
        }
      }
    });
    // ---- lilac: clumps of three blobs along the edge of the lawn (2.5 .. 3.5 m inside), 14 m apart
    const lil = [];
    cand.filter((c) => c.d >= 2.5 && c.d <= 3.5 && hash(sq.seed, Math.round(c.x), Math.round(c.z)) < 0.5).forEach((c) => {
      if (lil.length >= sq.lilacs || lil.some((q) => Math.hypot(q.x - c.x, q.z - c.z) < 14) || !clear(c.x, c.z, 1.8, 2.6)) return;
      lil.push(c); placed.push([c.x, c.z, 1.8]);
    });
    lil.forEach((c, i) => {
      P.far = 400;
      for (let k = 0; k < 3; k++) {
        const a = hash(sq.seed, i, k) * 6.28, d = k ? 0.9 + 0.3 * hash(sq.seed, i, k + 5) : 0, s = 1.0 + 0.4 * hash(sq.seed, i, k + 9);
        P.geo(M.shrub, new THREE.IcosahedronGeometry(1, 1), c.x + Math.cos(a) * d, 0.7 * s, c.z + Math.sin(a) * d, 0, a, 0, s, 0.8 * s, s);
      }
    });
    svc.squares = (svc.squares || []).concat({ id: sq.id, name: sq.name, beds: beds.map((b) => [Math.round(b.x), Math.round(b.z)]), lilacs: lil.length });
  }
  P.far = 420;
  svc.entrances = svc.entrances || [];
}
