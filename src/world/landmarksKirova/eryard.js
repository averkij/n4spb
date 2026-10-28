// landmarksKirova/eryard.js - the FOREYARD of the Erarta museum (frame FE: q' along the front, r' outward from the front wall), docs/research/kirova.md 11.3, photos er03 (larch row, lawn strip, kerb, hemispherical
// bollards), er07 (soil beds beside the apron).  The three OSM "wood" strips w671154995 / 96 / 97 (q' -44.4 .. -6.4, 6.8 .. 22.7, 29.2 .. 44.1, r' 11.7 .. 24.3) are claimed (groups.js) so that environment
// stops planting broad-leaved trees there: this file plants what the photos show instead (two staggered rows of LARCHES, light summer green, and low shrub clumps), edges the strips with a pale concrete
// kerb and draws the hemispherical concrete bollards along the kerb of the 28-29 line.  Everything is tested against the real asphalt (road integrity: net.cover < -0.5).
import * as THREE from 'three';
import * as L from '../layout.js';
import { FE } from './frame.js';
import { coverFn, ribbon } from './surfaces.js';
import { partsGeos, addInstanced, mat4, kBays } from './inst.js';
import { BARRIERS } from '../data/city.js';
import { splitBays, unitBox } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, 15.v): the brick walls of the passage are breakable bays (the source used streets/barriers.js addFenceBoxes: plain solid boxes)

export const STRIPS = [{ q: [-44.4, -6.4] }, { q: [6.8, 22.7] }, { q: [29.2, 44.1] }].map((s) => ({ ...s, r: [11.7, 24.3] }));

/** 2025 photos a16/a19: the asphalt paths have rounded pale lawn kerbs.
 * The mapped asphalt footways stay with streets/paths.js (surface=asphalt);
 * only the existing authored lawn edge changes, avoiding a second path layer. */
function lawnEdge(s, radius = 0.65) {
  const [x0, x1] = s.q, [z0, z1] = s.r, out = [];
  for (const [cx, cz, start] of [[x1 - radius, z1 - radius, 0], [x0 + radius, z1 - radius, Math.PI / 2], [x0 + radius, z0 + radius, Math.PI], [x1 - radius, z0 + radius, Math.PI * 1.5]]) {
    for (let i = 0; i <= 5; i++) { const a = start + i * Math.PI / 10, p = FE.W(cx + Math.cos(a) * radius, cz + Math.sin(a) * radius); out.push([p.x, p.z]); }
  }
  return out;
}

/** the PASSAGE behind the museum: the service road along the rear wall (OSM w65623762, 4 m) and the one round the north end are closed by brick walls (OSM barrier=wall w65623768 / w65623779 / w65623788, 2.3 m with a
 *  pale coping and pilasters every 6 m) that nobody draws otherwise; walls stay off the asphalt (net.cover) and are solid (fence boxes) */
const PASSAGE_WALLS = ['w65623768', 'w65623779', 'w65623788'];
function passage(K, cover) {
  const { P, M, ctx } = K, bays = [];
  for (const b of BARRIERS) {
    if (!PASSAGE_WALLS.includes(b.id) || !b.pts) continue;
    const segs = [];
    for (let i = 0; i + 3 < b.pts.length; i += 2) {
      const ax = b.pts[i], az = b.pts[i + 1], bx = b.pts[i + 2], bz = b.pts[i + 3], dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz); if (len < 0.5) continue;
      if (cover((ax + bx) / 2, (az + bz) / 2) > -0.45 || cover(ax, az) > -0.3 || cover(bx, bz) > -0.3) continue;
      bays.push(...splitBays(ax, az, bx, bz, 4.0, { y: 0 }));
      P.push(ax, 0, az, Math.atan2(-dz, dx));
      for (let s = 0; s <= len + 0.01; s += Math.max(3, len / Math.max(1, Math.round(len / 6)))) P.box(M.eBrick, s - 0.3, s + 0.3, 0, 2.55, -0.3, 0.3, 'b', 1.5);
      P.pop();
    }
  }
  // the wall and its coping are the parts of the bays; the pilasters every 6 m (above) stay static
  kBays(K, { name: 'lmKir-passage', bays, far: 300,
    parts: [{ geo: unitBox(0, 2.3, -0.2, 0.2, { uLen: 4, uvs: 1.5 }), mat: M.eBrick, name: 'wall', stretch: true },
      { geo: unitBox(2.3, 2.42, -0.3, 0.3, { uLen: 4, uvs: 1 }), mat: M.eRoofTrim, name: 'coping', stretch: true, inset: -0.05 }],
    collider: { y0: 0, y1: 2.45, thick: 0.4, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 1200, h: 2.4, anchored: 28, hitK: 0.5, metal: false, minDv: 0 }) });
}

export function build(K) {
  const { ctx, P, M, root } = K, cover = coverFn(ctx), free = (x, z, m = 1.0) => cover(x, z) < -m && !L.insideBuilding(x, z, 0.5);
  const trees = [], shrubs = [];
  let n = 0;
  for (const s of STRIPS) {
    const w = s.q[1] - s.q[0], cols = Math.max(2, Math.round(w / 6.5)), pitch = w / cols;
    for (const [row, r0] of [[0, 14.6], [1, 21.2]]) for (let i = 0; i < cols; i++) {
      const q = s.q[0] + pitch * (i + (row ? 0.75 : 0.25)) + (((n * 7) % 5) - 2) * 0.12, r = r0 + (((n * 11) % 7) - 3) * 0.15, p = FE.W(q, r); n++;
      if (!free(p.x, p.z, 1.8)) continue;                                                    // the larch crown starts 3.4 m above the ground (the audit measures the foliage below 1.2 m: only the straight trunk is there)
      const sc = 0.9 + ((n * 13) % 7) * 0.035;
      trees.push({ x: p.x, z: p.z, y: 0.02, fam: 'larch', s: sc, sy: sc * (1 + ((n * 5) % 6) * 0.05), tr: 0.25, yaw: n * 1.7, col: ['#6f8c3a', '#668634', '#7a9640'][n % 3] });
    }
    // low shrub clumps at the strip ends and along the kerb of the footway
    for (const [q, r] of [[s.q[0] + 1.2, 12.8], [s.q[1] - 1.2, 12.8], [s.q[0] + 1.4, 23.2], [s.q[1] - 1.4, 23.2], [(s.q[0] + s.q[1]) / 2, 12.6]]) { const p = FE.W(q, r); if (free(p.x, p.z)) shrubs.push({ x: p.x, z: p.z, y: 0.02, fam: 'shrub', s: 0.55 + ((n++ * 3) % 5) * 0.06, yaw: n, col: '#4a8138' }); }
  }
  // the two big larches that flank the stair (12 - 14 m, a02 / a03) at q' +-15, r' 12.5
  for (const q of [-15, 15]) { const p = FE.W(q, 12.5); if (free(p.x, p.z, 1.8)) trees.push({ x: p.x, z: p.z, y: 0.02, fam: 'larch', s: 1.15, sy: 1.3, tr: 0.3, yaw: q, col: '#6f8c3a' }); }
  K.trees.push(...trees); K.svc.trees.push(...trees.map((t) => ({ x: t.x, z: t.z, r: 2.4, h: 10 })));
  passage(K, cover);
  // pale concrete kerb round every strip (flat ribbon, clipped at the asphalt)
  const kerbs = STRIPS.map((s) => lawnEdge(s));
  let kerbQuads = 0;
  for (const ring of kerbs) kerbQuads += ribbon(P, M.eKerb, ring, 0.16, 0.09, { closed: true, tile: 2, seg: 4, clip: (x, z) => cover(x, z) > -0.5 });
  K.svc.stats = { ...(K.svc.stats || {}), erartaRoundedKerbs: kerbs.length, erartaKerbQuads: kerbQuads };
  // hemispherical concrete bollards along the building-side kerb of the 28-29 line (photo er03): Ø 0.5 m, 0.28 m high, every 2.2 m
  const parts = partsGeos((Q) => { const g = new THREE.SphereGeometry(0.26, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2); Q.geo(M.eBollard, g, 0, 0, 0); g.dispose(); });
  const mats = [];
  for (let q = -53; q <= -22; q += 2.2) { const p = FE.W(q, 32.6); if (cover(p.x, p.z) < -0.6 && !L.insideBuilding(p.x, p.z, 0.4)) mats.push(mat4(p.x, 0.12, p.z, 0, 1)); }
  const inst = addInstanced(ctx, root, 'lmKir-bollards', parts, mats);
  K.extraTris += inst.tris; K.svc.bollards = (K.svc.bollards || 0) + mats.length;
}
