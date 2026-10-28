// landmarksKirova/lawns.js - the TWO LONG LAWNS of the Vasileostrovets garden (OSM w65623784: r 182.2 .. 198.7, q -154.9 .. -92.3, and w65623798: r 182.6 .. 198.4, q -224.1 .. -162.1; frame K) with the
// clipped HEDGE (0.8 m high, 0.6 m wide, `#3f6b3a`) on both long sides, the TWENTY OVOID THUJA (several stems from one root, clipped egg shape, 3.8 m high, 1.9 m across the belly, `#2f5a35`; the 20 baked
// tree nodes of the two lawns ARE these conifers: exact K positions, critic 2026-10-08), each in a ring of low shrubs, and the TWO ROUND FLOWER BEDS (w1347749320 at (190.7, -182), w1347749321 at
// (189.3, -99.1), D 7.3 m: red and pink bedding round a green centre, a low pale kerb).  Docs: kirova.md 10.2, photos gd04 gd05 gd12.  The lawns / beds are claimed (groups.js): environment plants nothing there.
import * as THREE from 'three';
import { FK } from './frame.js';
import { GREEN } from '../data/city.js';
import { ribbon } from './surfaces.js';
import { splitBays, unitBox } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, 15.v): the clipped hedges are breakable bays (the source used streets/barriers.js addFenceBoxes: plain solid boxes)
import { kBays } from './inst.js';

const LAWN_IDS = ['w65623784', 'w65623798'];
const THUJA = [[185.5, -103], [185.5, -116], [185.5, -128], [185.5, -141], [185.5, -154], [196.0, -103], [196.0, -116], [196.0, -128], [196.0, -141], [196.0, -154],
  [185.0, -164], [185.0, -175], [185.0, -187], [185.0, -198.5], [185.0, -210], [196.0, -164], [196.0, -175], [196.0, -187], [196.0, -198.5], [196.0, -210]];
const BEDS = [[190.7, -182], [189.3, -99.1]];
const LAWN_K = [{ r: [182.2, 198.7], q: [-154.9, -92.3] }, { r: [182.6, 198.4], q: [-224.1, -162.1] }];


const BED_H = [[0, 0.62], [0.8, 0.46], [1.5, 0.5], [2.0, 0.36], [2.5, 0.38], [3.0, 0.24], [3.3, 0.24], [3.55, 0.1], [3.65, 0]];
const bedH = (r) => { for (let i = 0; i + 1 < BED_H.length; i++) if (r <= BED_H[i + 1][0]) { const t = (r - BED_H[i][0]) / (BED_H[i + 1][0] - BED_H[i][0]); return BED_H[i][1] + (BED_H[i + 1][1] - BED_H[i][1]) * t; } return 0; };
// colour bands of the bed: [r0, r1, base colour, lighter colour]: ornamental foliage, red begonia / salvia, silver cineraria, pink / yellow edge (Petersburg bedding vocabulary, erarta-detail 4.1)
const BED_BANDS = [[0, 0.85, '#6f9440', '#8fb050'], [0.85, 2.0, '#c01c2a', '#e0383c'], [2.0, 3.0, '#bcc0ac', '#dcdccc'], [3.0, 3.7, '#d86a8c', '#e8a03a']];
const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const lin3 = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
/** one round bed of D 7.3 m at (x, z), base height y: a domed mesh in polar rows with per-vertex colour (irregular scalloped colour bands, noisy plant mass), a few tall stalks in the heart */
function bed(P, M, x, z, y, seed) {
  const NR = 46, NA = 120, pos = [], idx = [], bands = BED_BANDS.map(([r0, r1, c0, c1]) => [r0, r1, lin3(c0), lin3(c1)]), leaf = lin3('#4f7a38');
  for (let i = 0; i <= NR; i++) {
    const r = 3.65 * i / NR;
    for (let j = 0; j < NA; j++) {
      const a = j / NA * Math.PI * 2, n = hsh(seed + i * 13.1 + j * 7.7);
      const yy = y + bedH(r) * (1 - 0.06 * (hsh(seed + j) - 0.5)) + 0.05 * (n - 0.5) + 0.03 * Math.sin(r * 9 + a * 5);
      pos.push(x + Math.cos(a) * r, yy, z + Math.sin(a) * r);
    }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA, c = (i + 1) * NA + (j + 1) % NA, d = (i + 1) * NA + j; idx.push(a, b, c, a, c, d); }
  const gi = new THREE.BufferGeometry(); gi.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gi.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
  gi.setIndex(idx); gi.computeVertexNormals();
  const g = gi.toNonIndexed(); gi.dispose();                                                  // smooth normals kept, one flat colour per quad = a mosaic of plant clumps (a begonia bed is a mass of small red / white / pink heads, photo b16), not a smooth marble
  const col = new Float32Array(NR * NA * 6 * 3);
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
    const q = i * NA + j, r = 3.65 * (i + 0.5) / NR, a = (j + 0.5) / NA * Math.PI * 2, wob = 0.1 * Math.sin(7 * a + r * 2.1 + seed) + 0.06 * Math.sin(13 * a - r * 3), re = r + wob + 0.09 * (hsh(seed * 7 + i * 3.7 + j * 1.3) - 0.5);
    let b = bands[bands.length - 1]; for (const bd of bands) if (re < bd[1]) { b = bd; break; }
    const h1 = hsh(seed * 3 + i * 5.3 + j * 3.1), h2 = hsh(seed + i * 2.9 + j * 11.3), pick = h1 > 0.7 ? b[3] : b[2];
    const k = h2 < 0.07 && r > 0.9 ? 0.55 : 0, dark = 0.74 + 0.26 * hsh(seed * 5 + i * 9.1 + j * 4.7);                       // 7 % of the heads are green leaf showing through
    const c = [pick[0] + (leaf[0] - pick[0]) * k, pick[1] + (leaf[1] - pick[1]) * k, pick[2] + (leaf[2] - pick[2]) * k];
    for (let v = 0; v < 6; v++) { col[(q * 6 + v) * 3] = c[0] * dark; col[(q * 6 + v) * 3 + 1] = c[1] * dark; col[(q * 6 + v) * 3 + 2] = c[2] * dark; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  P.geo(M.col('#ffffff'), g, 0, 0, 0); g.dispose();
  for (let i = 0; i < 9; i++) {                                                                                      // tall stalks (canna / ornamental grass) in the heart of the bed
    const a = i * 2.4 + hsh(seed + i), rr = 0.1 + 0.4 * hsh(seed + i * 3), tx = x + Math.cos(a) * rr, tz = z + Math.sin(a) * rr, h = 0.65 + 0.45 * hsh(seed + i * 5);
    P.cyl(M.col('#5f8a3c'), [tx, y + 0.5, tz], [tx + 0.05, y + 0.5 + h, tz], 0.1, 0.015, 5, false);
  }
}

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  // lawn tops: the baked rings (world), a flat polygon 4 cm above the ground
  for (const id of LAWN_IDS) {
    const g = GREEN.find((q) => q.id === id); if (!g) { console.warn('[landmarksKirova] lawn missing', id); continue; }
    for (const p of g.polys) { const ring = []; for (let i = 0; i < p.o.length; i += 2) ring.push([p.o[i], p.o[i + 1]]); P.cap(M.lawnTop, ring, 0.04, true, 6); }
  }
  // hedges along both long sides of each lawn (boxes in frame K, texture = clipped privet)
  const hedgeBays = [];
  for (const L of LAWN_K) for (const r of [L.r[0] + 0.3, L.r[1] - 0.3]) {
    const a = FK.W(r, L.q[0]), b = FK.W(r, L.q[1]); hedgeBays.push(...splitBays(a.x, a.z, b.x, b.z, 3.1, { y: 0 }));
  }
  kBays(K, { name: 'lmKir-hedges', bays: hedgeBays, far: 260,
    parts: [{ geo: unitBox(0, 0.8, -0.3, 0.3, { uLen: 3.1, uvs: 0.8 }), mat: M.hedge, name: 'hedge', stretch: true }],
    collider: { y0: 0, y1: 0.8, thick: 0.6, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 300, h: 0.8, anchored: 14, hitK: 0.3, metal: false, minDv: 0 }) });
  // thuja: two ovoid stems from one root + a ring of six low shrubs (flat spheres)
  const ov = new THREE.SphereGeometry(1, 10, 7), sh = new THREE.SphereGeometry(1, 6, 4);
  THUJA.forEach(([r, q], i) => {
    const p = FK.W(r, q), a = i * 2.399, ox = Math.cos(a) * 0.18, oz = Math.sin(a) * 0.18, hs = 1 + ((i * 7) % 5) * 0.03;
    P.geo(M.thuja, ov, p.x + ox, 1.9 * hs, p.z + oz, 0, a, 0, 0.92, 1.9 * hs, 0.92);
    P.geo(M.thuja, ov, p.x - ox * 1.3, 1.5 * hs, p.z - oz * 1.3, 0, a + 1, 0, 0.7, 1.5 * hs, 0.7);
    for (let k = 0; k < 4; k++) { const t = a + k * Math.PI / 2; P.geo(M.shrubGreen, sh, p.x + Math.cos(t) * 1.25, 0.34, p.z + Math.sin(t) * 1.25, 0, t, 0, 0.75, 0.5, 0.75); }
    ph.addCylinder(p.x, p.z, 0.55, 0, 4);
  });
  // round flower beds (erarta-detail 4.1): a low DOMED mound of bedding in concentric colour rings with plant tufts that break the silhouette, a pale kerb ring.  Surface height H(r) is one smooth profile that is
  // cut into the colour bands (centre ornamental foliage with tall stalks, red begonia / salvia, silver cineraria, pink / yellow edge); flat geometry of the flat base (no decal, no new kind)
  for (const [r, q] of BEDS) {
    const p = FK.W(r, q), n = 28, ring = Array.from({ length: n }, (_, i) => [p.x + Math.cos(i * 2 * Math.PI / n) * 3.65, p.z + Math.sin(i * 2 * Math.PI / n) * 3.65]);
    bed(P, M, p.x, p.z, 0.06, (r + q) * 7);
    ribbon(P, M.eKerb, ring, 0.16, 0.12, { closed: true, tile: 2, seg: 3 });
  }
  K.svc.beds = BEDS.map(([r, q]) => { const p = FK.W(r, q); return { x: p.x, z: p.z, r: 3.65 }; });
}
