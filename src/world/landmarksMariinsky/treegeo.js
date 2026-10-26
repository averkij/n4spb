// landmarksMariinsky/ (copy of environment/treegeo.js - procedural tree / shrub geometry for Saint Petersburg in July (docs/research/streets.md section 6; adapted from the Yakutsk sibling: lobe crowns, tiers). )
// Metres, origin = ground contact, +Y up. Every family exists in four canopy levels of detail and two trunk levels of detail:
//   canopy LOD0  lumpy leaf lobes (icosphere 1, smooth blended normals, crease darkening) ~ 500-900 tris (spruce / larch: 6-8 drooping tiers)
//   canopy LOD1  the 3-5 biggest lobes ~ 160-400 tris       LOD2  one crown blob (80 tris)       LOD3  one blob (20 tris)
//   trunk  LOD0  stems + branches into the crowns            LOD1  plain taper
// Vertex colours only carry a luminance / hue-shift pattern (cool dark underside -> bright warm top, dark creases between lobes); the leaf colour itself is
// the per-instance colour, so one mesh serves every green. The leaf-cell highlights come from the material (leafmat.js).
// Families (nominal height / crown radius, instance scale 0.4 .. 1.4): limeA 14 / 4.0, limeB 13 / 3.7, limeY 6 / 1.9 (young embankment lime), mapleA 12 / 3.8, elm 16 / 4.6, ash 15 / 3.6, oak 13 / 5.4,
// chestnut 13 / 4.6, poplar 16 / 2.4, birch 10 / 2.3 (A, B), ball 4.2 / 1.55 (clipped maple on a clear stem), blue spruce 9 / 1.9 (A, B), rowan 4.2 / 1.9, shrub 1.5 / 1.0 (lilac, privet).
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { Acc, hash2, mix, sstep } from './util.js';

// ---------------------------------------------------------------- noise (for lumpy lobes)
function vnoise(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), fx = x - xi, fy = y - yi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const h = (a, b, c) => hash2(xi + a + zi * 31 + c * 7, yi + b + c * 13, s + c * 5);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(h(0, 0, 0), h(1, 0, 0), u), L(h(0, 1, 0), h(1, 1, 0), u), v), L(L(h(0, 0, 1), h(1, 0, 1), u), L(h(0, 1, 1), h(1, 1, 1), u), v), w);
}
function billow(x, y, z, s) {
  let a = 0, amp = 0.62, f = 1;
  for (let o = 0; o < 3; o++) { a += amp * (1 - Math.abs(vnoise(x * f, y * f, z * f, s + o * 17) * 2 - 1)); amp *= 0.45; f *= 2.03; }
  return a / 1.05;
}

const _ico = new Map();
function icoBase(detail) {
  let b = _ico.get(detail);
  if (!b) {
    let g = new THREE.IcosahedronGeometry(1, detail); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-5);
    b = { pos: g.attributes.position.array, idx: g.index.array }; _ico.set(detail, b);
  }
  return b;
}

// ---------------------------------------------------------------- families
/** H, R: nominal height / crown radius (m); trunk: COLLISION radius at the stem (a spruce / willow gets a wider one because its low branches reach the ground);
 *  bark: texture key; kind: 'lobes' | 'tiers' */
export const SPECIES = {
  // broad-leaved street / garden / courtyard trees: nominal size of a mature tree, instances are scaled 0.4 (a young planting) .. 1.4 (an old giant)
  limeA:   { sp: 'lime',   H: 14.0, R: 4.0, trunk: 0.42, bark: 'lime', kind: 'lobes', lump: 0.12, blend: 0.78 },       // small-leaved lime, dense heart-shaped canopy
  limeB:   { sp: 'lime',   H: 13.0, R: 3.7, trunk: 0.40, bark: 'lime', kind: 'lobes', lump: 0.12, blend: 0.78 },       // twin-trunk variant
  limeY:   { sp: 'lime',   H: 6.0, R: 1.9, trunk: 0.16, bark: 'lime', kind: 'lobes', lump: 0.1, blend: 0.8 },          // young planting on the embankment (5-6 m, round dark crown)
  mapleA:  { sp: 'maple',  H: 12.0, R: 3.8, trunk: 0.36, bark: 'maple', kind: 'lobes', lump: 0.12, blend: 0.75 },      // Norway maple, rounder, lighter green
  elm:     { sp: 'elm',    H: 16.0, R: 4.6, trunk: 0.48, bark: 'lime', kind: 'lobes', lump: 0.12, blend: 0.7 },        // broad vase
  ash:     { sp: 'ash',    H: 15.0, R: 3.6, trunk: 0.38, bark: 'ash', kind: 'lobes', lump: 0.13, blend: 0.65 },        // open oval crown
  oak:     { sp: 'oak',    H: 13.0, R: 5.4, trunk: 0.55, bark: 'oak', kind: 'lobes', lump: 0.15, blend: 0.68 },        // wide spreading crown (Mariinsky fence)
  chestnut: { sp: 'chestnut', H: 13.0, R: 4.6, trunk: 0.46, bark: 'oak', kind: 'lobes', lump: 0.13, blend: 0.78 },     // horse chestnut, dense dark dome
  poplar:  { sp: 'poplar', H: 16.0, R: 2.4, trunk: 0.32, bark: 'pale', kind: 'lobes', lump: 0.11, blend: 0.7 },        // balsam poplar, tall and narrow
  birchA:  { sp: 'birch',  H: 10.0, R: 2.3, trunk: 0.20, bark: 'birch', kind: 'lobes', lump: 0.12, blend: 0.82 },
  birchB:  { sp: 'birch',  H: 9.5, R: 2.2, trunk: 0.20, bark: 'birch', kind: 'lobes', lump: 0.12, blend: 0.82 },
  ball:    { sp: 'ball',   H: 4.2, R: 1.55, trunk: 0.14, bark: 'maple', kind: 'lobes', lump: 0.06, blend: 0.9 },         // clipped Norway maple 'Globosum': a ball on a clear stem (Vosstaniya Sq)
  spruceA: { sp: 'spruce', H: 9.0, R: 1.9, trunk: 0.9, bark: 'brown', kind: 'tiers', tiers: [7, 5, 3, 2], seg: [10, 8, 6, 5] },    // blue spruce of the Anichkov garden
  spruceB: { sp: 'spruce', H: 7.5, R: 1.9, trunk: 1.0, bark: 'brown', kind: 'tiers', tiers: [6, 4, 3, 2], seg: [10, 8, 6, 5] },
  rowan:   { sp: 'rowan',  H: 4.2, R: 1.9, trunk: 0.4, bark: 'brown', kind: 'lobes', lump: 0.15, blend: 0.5 },           // rowan / bird cherry in courtyards
  shrub:   { sp: 'shrub',  H: 1.5, R: 1.0, trunk: 0.45, bark: 'brown', kind: 'lobes', lump: 0.14, blend: 0.4, shrub: true },   // lilac / privet / spiraea
};
export const FAMILIES = Object.keys(SPECIES);

/** merge a lobe list into k bigger lobes (by height) that keep the silhouette: the LOD1 crown */
function cluster(L, k) {
  const sorted = L.slice().sort((p, q) => p.c[1] - q.c[1]), out = [], per = Math.ceil(sorted.length / k);
  for (let i = 0; i < sorted.length; i += per) {
    const g = sorted.slice(i, i + per); let cx = 0, cy = 0, cz = 0; for (const o of g) { cx += o.c[0]; cy += o.c[1]; cz += o.c[2]; } cx /= g.length; cy /= g.length; cz /= g.length;
    let rx = 0, ry = 0; for (const o of g) { rx = Math.max(rx, Math.hypot(o.c[0] - cx, o.c[2] - cz) + o.r[0]); ry = Math.max(ry, Math.abs(o.c[1] - cy) + o.r[1]); }
    out.push({ c: [cx, cy, cz], r: [rx * 0.88, ry * 0.9, rx * 0.88], tint: g[0].tint });
  }
  return out;
}
/** n lobes scattered inside the crown envelope (rejection sampling with a minimum spacing); o: { rx: [min, max] radius, k: [min, max] height / width, sep, tint(), lean: [dx, dz] drift with height, hollow: keep the core empty } */
function scatter(env, n, rnd, o) {
  const out = [];
  for (let tries = 0; tries < 900 && out.length < n; tries++) {
    const u = rnd() * 2 - 1, a = rnd() * 6.283, rad = Math.cbrt(rnd()), rh = Math.sqrt(1 - u * u) * rad;
    const dx = Math.cos(a) * rh, dz = Math.sin(a) * rh, dy = u * rad;
    if (o.hollow && Math.hypot(dx, dz) < o.hollow * (1 - Math.abs(dy)) * 0.6 && dy < 0.4) continue;
    const t = (dy + 1) / 2, c = [env.c[0] + dx * env.r[0] + (o.lean ? o.lean[0] * t * t : 0), env.c[1] + dy * env.r[1], env.c[2] + dz * env.r[2] + (o.lean ? o.lean[1] * t * t : 0)];
    const rx = o.rx[0] + rnd() * (o.rx[1] - o.rx[0]), k = o.k[0] + rnd() * (o.k[1] - o.k[0]);
    if (o.minY !== undefined && c[1] - rx * k < o.minY) continue;                          // keep the crown above head height (walkers pass underneath)
    if (out.some((p) => Math.hypot(p.c[0] - c[0], (p.c[1] - c[1]) * 0.7, p.c[2] - c[2]) < (p.r[0] + rx) * o.sep)) continue;
    out.push({ c, r: [rx, rx * k, rx], tint: o.tint() });
  }
  return out;
}
/** lobe layout of a lobe family: { env: crown envelope ellipsoid, L: [{c, r, tint}], lod1: [indices] } (deterministic per family) */
function layout(fam) {
  let s = 0; for (const ch of fam) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const jit = (a) => (rnd() - 0.5) * 2 * a;
  const sunny = [1.0, 1.0, 0.88], neutral = [1, 1, 1], cool = [0.92, 1.0, 0.97], lime = [1.02, 1.0, 0.82];
  const T = () => [sunny, neutral, cool, lime][Math.floor(rnd() * 4)];
  const F = SPECIES[fam];
  // broad-leaved crowns: an ellipsoid envelope scattered with leaf lobes (rejection sampling), crown base kept above head height
  const crown = (c, r, n, rx, k, sep, o = {}) => {
    const env = { c, r };
    const L = scatter(env, n, rnd, { rx, k, sep, tint: T, lean: o.lean, hollow: o.hollow, minY: o.minY });
    return { env, L, L1: cluster(L, o.l1 ?? 4) };
  };
  if (fam === 'limeA' || fam === 'limeB') {
    const H = F.H, R = F.R, B = fam === 'limeB';
    return crown([0, 0.6 * H, 0], [R, 0.38 * H, R], B ? 22 : 26, [0.26 * R, 0.5 * R], [0.85, 1.15], 0.5, { minY: 0.25 * H, lean: B ? [0.5, 0.3] : [0.25, -0.2] });
  }
  if (fam === 'limeY') { const H = F.H, R = F.R; return crown([0, 0.66 * H, 0], [R, 0.34 * H, R], 14, [0.45 * R, 0.8 * R], [0.85, 1.1], 0.55, { minY: 0.34 * H }); }
  if (fam === 'mapleA') { const H = F.H, R = F.R; return crown([0, 0.6 * H, 0], [R, 0.4 * H, R], 22, [0.26 * R, 0.46 * R], [0.85, 1.1], 0.5, { minY: 0.24 * H }); }
  if (fam === 'elm') { const H = F.H, R = F.R; return crown([0, 0.65 * H, 0], [R, 0.35 * H, R], 24, [0.22 * R, 0.4 * R], [0.8, 1.05], 0.55, { minY: 0.3 * H, hollow: 0.35, lean: [0.6, 0.2] }); }
  if (fam === 'ash') { const H = F.H, R = F.R; return crown([0, 0.6 * H, 0], [0.82 * R, 0.4 * H, 0.82 * R], 24, [0.22 * R, 0.42 * R], [0.95, 1.3], 0.55, { minY: 0.26 * H, hollow: 0.2 }); }
  if (fam === 'oak') { const H = F.H, R = F.R; return crown([0, 0.55 * H, 0], [R, 0.34 * H, R], 24, [0.24 * R, 0.44 * R], [0.75, 1.0], 0.5, { minY: 0.2 * H, lean: [0.9, 0.3] }); }
  if (fam === 'chestnut') { const H = F.H, R = F.R; return crown([0, 0.56 * H, 0], [R, 0.42 * H, R], 20, [0.3 * R, 0.54 * R], [0.85, 1.05], 0.5, { minY: 0.2 * H }); }
  if (fam === 'ball') {
    const H = F.H, R = F.R, env = { c: [0, H - R, 0], r: [R, R * 0.96, R] };
    const L = [{ c: [0, H - R, 0], r: [R, R * 0.96, R], tint: [1, 1, 1] }];
    return { env, L, L1: L };
  }
  if (fam === 'birchA' || fam === 'birchB') {
    // loose crown: leaf clusters of different sizes scattered through a tall oval (no two alike), thin gaps between them
    const B = fam === 'birchB', k = F.H / 7.5, env = { c: [0, 4.7 * k, 0], r: [1.75 * k * 1.1, 2.7 * k, 1.75 * k * 1.1] };
    const L = scatter(env, B ? 15 : 14, rnd, { rx: [0.34 * k, 0.68 * k], k: [1.0, 1.45], sep: 0.8, tint: T, lean: [0.35 * k, 0.2 * k], minY: 2.3 * k });
    return { env, L, L1: cluster(L, 4) };
  }
  if (fam === 'poplar') {
    const kH = F.H / 11.5, kR = F.R / 2.0;
    const env = { c: [0, 7.2 * kH, 0], r: [2.0 * kR, 5.2 * kH, 2.0 * kR] };
    const L = [], a0 = rnd() * 6.28, prof = [[3.2, 0.9], [4.4, 1.25], [5.6, 1.5], [6.8, 1.65], [8.0, 1.7], [9.2, 1.6], [10.3, 1.35], [11.2, 1.0], [11.8, 0.6]];
    prof.forEach(([y, w], k) => { const a = a0 + k * 2.4; L.push({ c: [Math.cos(a) * 0.35, y * kH, Math.sin(a) * 0.35], r: [w * kR, 1.5 * kH, w * kR], tint: T() }); });
    return { env, L, L1: [1, 4, 7].map((i) => L[i]) };
  }
  if (fam === 'rowan') {
    const k = F.H / 3.2, env = { c: [0, 2.3 * k, 0], r: [1.8 * k * 0.9, 1.6 * k, 1.8 * k * 0.9] };
    const L = [{ c: [0, 3.1 * k, 0], r: [0.85 * k, 0.85 * k, 0.85 * k], tint: lime }];
    const a0 = rnd() * 6.28;
    for (let q = 0; q < 4; q++) { const a = a0 + q * 1.571 + jit(0.3); L.push({ c: [Math.cos(a) * 0.95 * k, (2.5 + (q % 2) * 0.6) * k, Math.sin(a) * 0.95 * k], r: [0.9 * k, 0.8 * k, 0.9 * k], tint: T() }); }
    return { env, L, L1: cluster(L, 2) };
  }
  // shrub
  return { env: { c: [0, 0.7, 0], r: [1.0, 0.75, 1.0] }, L: [{ c: [0, 0.68, 0], r: [1.0, 0.72, 1.0], tint: neutral }, { c: [0.45, 0.5, 0.2], r: [0.6, 0.5, 0.6], tint: sunny }, { c: [-0.4, 0.55, -0.25], r: [0.6, 0.5, 0.6], tint: cool }], L1: [{ c: [0, 0.68, 0], r: [1.05, 0.75, 1.05], tint: neutral }] };
}
const _lay = new Map();
const layoutOf = (fam) => { let l = _lay.get(fam); if (!l) _lay.set(fam, (l = layout(fam))); return l; };

// ---------------------------------------------------------------- canopy
function tone(t, tint, jitter, ao) {
  const lum = (0.58 + 0.42 * sstep(0.0, 0.8, t) + 0.14 * sstep(0.62, 1.0, t)) * ao;                     // dark cool underside -> bright top
  const cool = 1 - sstep(0.1, 0.62, t);
  return [lum * tint[0] * jitter * mix(1, 0.86, cool), lum * tint[1] * jitter * mix(1, 0.93, cool), lum * tint[2] * jitter * mix(1, 1.08, cool)];
}
function addLobes(acc, lay, indices, detail, lump, blend, seedBase = 0) {
  const lobes = indices.map((i) => lay.L[i]);
  const ec = lay.env.c, er = lay.env.r, y0 = ec[1] - er[1], y1 = ec[1] + er[1];
  const base = icoBase(detail), n = base.pos.length / 3;
  const inside = (px, py, pz, o) => { const dx = (px - o.c[0]) / o.r[0], dy = (py - o.c[1]) / o.r[1], dz = (pz - o.c[2]) / o.r[2]; return Math.sqrt(dx * dx + dy * dy + dz * dz); };
  let li = 0;
  for (const Lb of lobes) {
    const first = acc.count, seed = 11 + li * 7 + seedBase; li++;
    const deep = new Uint8Array(n);
    for (let v = 0; v < n; v++) {
      const ux = base.pos[v * 3], uy = base.pos[v * 3 + 1], uz = base.pos[v * 3 + 2];
      let d = 1; if (lump > 0) d += lump * (billow(ux * 2.1 + seed, uy * 2.1, uz * 2.1 - seed, seed) - 0.55);
      let yy = uy; if (yy < -0.45) yy = -0.45 + (yy + 0.45) * 0.55;                      // flatter underside
      const px = Lb.c[0] + ux * Lb.r[0] * d, py = Lb.c[1] + yy * Lb.r[1] * d, pz = Lb.c[2] + uz * Lb.r[2] * d;
      let nlx = ux / Lb.r[0], nly = uy / Lb.r[1], nlz = uz / Lb.r[2]; const nl = Math.hypot(nlx, nly, nlz) || 1; nlx /= nl; nly /= nl; nlz /= nl;
      let nex = (px - ec[0]) / (er[0] * er[0]), ney = (py - ec[1]) / (er[1] * er[1]), nez = (pz - ec[2]) / (er[2] * er[2]); const ne = Math.hypot(nex, ney, nez) || 1; nex /= ne; ney /= ne; nez /= ne;
      let nx = mix(nlx, nex, blend), ny = mix(nly, ney, blend), nz = mix(nlz, nez, blend); const nn = Math.hypot(nx, ny, nz) || 1; nx /= nn; ny /= nn; nz /= nn;
      let ao = 1, buried = false;
      for (const O of lobes) { if (O === Lb) continue; const q = inside(px, py, pz, O); if (q < 0.9) buried = true; else if (q < 1.22) ao = Math.min(ao, mix(0.74, 1, sstep(0.9, 1.22, q))); }
      deep[v] = buried ? 1 : 0;
      const t = (py - y0) / (y1 - y0), jitter = 0.94 + 0.12 * vnoise(px * 0.9 + 3, py * 0.9, pz * 0.9 - 2, seed);
      const c = tone(t, Lb.tint || [1, 1, 1], jitter, ao);
      acc.vert(px, py, pz, nx, ny, nz, c[0], c[1], c[2]);
    }
    for (let f = 0; f < base.idx.length; f += 3) {
      const a = base.idx[f], b = base.idx[f + 1], c = base.idx[f + 2];
      if (deep[a] && deep[b] && deep[c]) continue;
      acc.tri(first + a, first + b, first + c);
    }
  }
}
function addStub(acc, x, h, r) {                                                  // thin dark stick for the far LODs
  const seg = 4;
  for (let s = 0; s < seg; s++) {
    const a0 = s / seg * 6.283, a1 = (s + 1) / seg * 6.283, v = [];
    for (const [a, y, rr] of [[a0, 0, r], [a1, 0, r], [a1, h, r * 0.6], [a0, h, r * 0.6]]) v.push(acc.vert(x + Math.cos(a) * rr, y, Math.sin(a) * rr, Math.cos(a), 0.2, Math.sin(a), 0.16, 0.14, 0.12));
    acc.tri(v[0], v[1], v[2]); acc.tri(v[0], v[2], v[3]);
  }
}
/** stacked jagged cone tiers (spruce; larch = narrow, open, lighter) */
function addTiers(acc, F, lod) {
  const H = F.H, R = F.R, tiers = F.tiers[lod], seg = F.seg[lod], open = !!F.open;
  const y0 = open ? 0.9 : 0.55, span = H - y0;
  for (let k = 0; k < tiers; k++) {
    const t0 = k / tiers, t1 = (k + (open ? 1.2 : 1.55)) / tiers;
    const yb = y0 + span * t0 * 0.93, yt = Math.min(H, y0 + span * Math.min(1, t1));
    const rad = R * Math.pow(1 - t0, open ? 0.75 : 0.92) * (0.88 + 0.12 * hash2(k, 1, 77)) + 0.08;
    const slope = rad / Math.max(0.5, yt - yb), ring = [];
    for (let s = 0; s < seg; s++) {
      const a = (s + (k % 2) * 0.5) / seg * 6.283, jag = lod === 0 ? (s % 2 ? 0.78 : 1.0) : 1.0, rr = rad * jag;
      let nx = Math.cos(a), nz = Math.sin(a), ny = slope * 0.55; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const cn = Math.hypot(1, R / H * 1.3), gx = Math.cos(a) / cn, gy = (R / H * 1.3) / cn, gz = Math.sin(a) / cn;
      let mx = mix(nx, gx, 0.45), my = mix(ny, gy, 0.45), mz = mix(nz, gz, 0.45); const ml = Math.hypot(mx, my, mz); mx /= ml; my /= ml; mz /= ml;
      const t = (yb - y0) / span, lum = 0.55 + 0.45 * t, jit = 0.94 + 0.12 * hash2(s, k, 78);
      ring.push(acc.vert(Math.cos(a) * rr, yb - (lod === 0 && !open ? 0.28 * (s % 2) : 0), Math.sin(a) * rr, mx, my, mz, lum * 0.8 * jit, lum * 0.9 * jit, lum * 1.0 * jit));
    }
    const tip = acc.vert(0, yt, 0, 0, 1, 0, 1.05, 1.05, 0.98);                // bright tips
    for (let s = 0; s < seg; s++) acc.tri(ring[s], ring[(s + 1) % seg], tip);
    if (lod <= 1 && !open) {                                                  // dark underside
      const under = acc.vert(0, yb + 0.4, 0, 0, -1, 0, 0.42, 0.46, 0.55), rr2 = [];
      for (let s = 0; s < seg; s++) { const p = ring[s]; rr2.push(acc.vert(acc.p[p * 3], acc.p[p * 3 + 1], acc.p[p * 3 + 2], 0, -1, 0, 0.42, 0.46, 0.55)); }
      for (let s = 0; s < seg; s++) acc.tri(rr2[s], rr2[(s + 1) % seg], under);
    }
  }
}

/** canopy geometry of a family at a level of detail (0..3) */
export function canopyGeometry(fam, lod) {
  const F = SPECIES[fam], acc = new Acc(true);
  if (F.kind === 'tiers') { addTiers(acc, F, lod); if (lod >= 2) addStub(acc, 0, 1.0, 0.14); return acc.geometry(); }
  const lay = layoutOf(fam), seed = fam.length * 13 + fam.charCodeAt(0);
  if (lod === 0) addLobes(acc, lay, lay.L.map((_, i) => i), 1, F.lump, F.blend, seed);
  else if (lod === 1) addLobes(acc, { env: lay.env, L: lay.L1 }, lay.L1.map((_, i) => i), 1, F.lump * 0.5, F.blend + 0.1, seed);
  else {
    const e = lay.env, one = { env: e, L: [{ c: e.c, r: [e.r[0] * 0.97, e.r[1] * 0.97, e.r[2] * 0.97], tint: [1, 0.98, 0.92] }] };
    addLobes(acc, one, [0], lod === 2 ? 1 : 0, 0, 0.75, seed);
    if (!F.shrub) addStub(acc, 0, e.c[1] - e.r[1] * 0.4, F.trunk * 0.5);
  }
  return acc.geometry();
}

// ---------------------------------------------------------------- trunks
function addTube(acc, path, seg, vRepeat, uRepeat = 2) {
  const rings = []; let len = 0;
  for (let i = 0; i < path.length; i++) {
    const p = path[i], q = path[Math.min(path.length - 1, i + 1)], o = path[Math.max(0, i - 1)];
    let dx = q.x - o.x, dy = q.y - o.y, dz = q.z - o.z; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
    const hx = Math.abs(dy) < 0.9 ? 0 : 1, hy = Math.abs(dy) < 0.9 ? 1 : 0;
    let ux = hy * dz, uy = -hx * dz, uz = hx * dy - hy * dx; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
    if (i > 0) len += Math.hypot(p.x - path[i - 1].x, p.y - path[i - 1].y, p.z - path[i - 1].z);
    const ring = [];
    for (let s = 0; s <= seg; s++) {
      const a = s / seg * 6.283185, ca = Math.cos(a), sa = Math.sin(a), nx = ux * ca + vx * sa, ny = uy * ca + vy * sa, nz = uz * ca + vz * sa;
      ring.push(acc.vert(p.x + nx * p.r, p.y + ny * p.r, p.z + nz * p.r, nx, ny, nz, 1, 1, 1, s / seg * uRepeat, len / vRepeat));
    }
    rings.push(ring);
  }
  for (let i = 0; i + 1 < rings.length; i++) for (let s = 0; s < seg; s++) { const a = rings[i][s], b = rings[i][s + 1], c = rings[i + 1][s + 1], d = rings[i + 1][s]; acc.tri(a, b, c); acc.tri(a, c, d); }
}
const stemPath = (x0, z0, lx, lz, h, r0, r1, flare = 0) => [0, 0.04, 0.2, 0.55, 1].map((t, i) => ({ x: x0 + lx * t * t, y: -0.15 + (h + 0.15) * t, z: z0 + lz * t * t, r: mix(r0, r1, t) * (1 + flare * Math.max(0, 1 - t / 0.07)) }));

/** trunk geometry (lod 0: stems + branches into the crown, lod 1: plain taper stems). Returns null for families without a visible trunk. */
export function trunkGeometry(fam, lod) {
  const F = SPECIES[fam]; if (F.shrub) return null;
  const acc = new Acc(false), lay = F.kind === 'lobes' ? layoutOf(fam) : null;
  let s = 7919 + fam.charCodeAt(0) * 31 + fam.length; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const seg = lod === 0 ? 7 : 5;
  const broad = ['lime', 'maple', 'elm', 'ash', 'oak', 'chestnut'].includes(F.sp);
  if (broad) {
    // one thick stem (a twin stem on limeB), a clear height of ~0.24 H, then limbs reaching into the lobes
    const H = F.H, stemH = H * (F.sp === 'oak' ? 0.2 : 0.24), r0 = F.trunk * 0.62 * (F.sp === 'oak' || F.sp === 'chestnut' ? 1.15 : 1);
    const twin = fam === 'limeB', a0 = rnd() * 6.28, stems = twin ? 2 : 1;
    for (let k = 0; k < stems; k++) {
      const a = a0 + k * Math.PI, lean = twin ? 0.35 : 0.12;
      addTube(acc, stemPath(Math.cos(a) * 0.08, Math.sin(a) * 0.08, Math.cos(a) * lean, Math.sin(a) * lean, stemH * (twin ? 1.15 : 1), r0 * (twin ? 0.72 : 1), r0 * 0.5, 0.9), lod === 0 ? 9 : 6, 3.2);
    }
    if (lod === 0) {
      const lobes = lay.L.filter((o) => o.c[1] > stemH * 0.9).sort((p, q) => p.c[1] - q.c[1]);
      const n = Math.min(lobes.length, F.sp === 'oak' ? 6 : 5);
      for (let k = 0; k < n; k++) {
        const Lb = lobes[Math.floor((k + 0.5) * lobes.length / n)], y0 = stemH * (0.78 + 0.2 * rnd()), t = y0 / stemH;
        addTube(acc, [{ x: Math.cos(a0) * 0.12 * t * t, y: y0, z: Math.sin(a0) * 0.12 * t * t, r: r0 * 0.5 }, { x: Lb.c[0] * 0.45, y: (y0 + Lb.c[1]) * 0.5 + 0.25, z: Lb.c[2] * 0.45, r: r0 * 0.3 }, { x: Lb.c[0] * 0.9, y: Lb.c[1] - Lb.r[1] * 0.55, z: Lb.c[2] * 0.9, r: r0 * 0.14 }], 5, 2.2, 1);
      }
    }
  } else if (F.sp === 'ball') {
    addTube(acc, stemPath(0, 0, 0, 0, F.H - F.R * 1.1, F.trunk * 0.9, F.trunk * 0.55, 0.5), 6, 2);
  } else if (F.sp === 'birch') {
    const k = F.H / 7.5, stems = fam === 'birchB' ? 3 : 2, a0 = rnd() * 6.28;
    for (let q = 0; q < stems; q++) {
      const a = a0 + q * 6.283 / stems, lean = (q === 0 && stems === 2 ? 0.25 : 0.55) * k, top = (5.2 + rnd() * 0.8) * k;
      addTube(acc, stemPath(Math.cos(a) * 0.12, Math.sin(a) * 0.12, Math.cos(a) * lean, Math.sin(a) * lean, top, (0.1 - q * 0.02) * k, 0.04 * k, 0.5), seg, 2.4 * k);
    }
    if (lod === 0) for (let q = 1; q < lay.L.length - 1; q++) {
      const Lb = lay.L[q], y0 = (3.0 + rnd() * 1.3) * k, t = y0 / (5.4 * k);
      addTube(acc, [{ x: Math.cos(a0) * 0.3 * t * t, y: y0, z: Math.sin(a0) * 0.3 * t * t, r: 0.04 * k }, { x: Lb.c[0] * 0.5, y: (y0 + Lb.c[1]) * 0.5 + 0.2, z: Lb.c[2] * 0.5, r: 0.03 * k }, { x: Lb.c[0] * 0.95, y: Lb.c[1] - 0.2, z: Lb.c[2] * 0.95, r: 0.018 * k }], 4, 1.5, 1);
    }
  } else if (F.sp === 'poplar') {
    addTube(acc, stemPath(0, 0, 0.12, 0.05, F.H * 0.83, F.trunk * 0.62, 0.07, 1.0), lod === 0 ? 8 : 5, 3.0);
  } else if (F.sp === 'rowan') {
    const k = F.H / 3.2;
    for (let q = 0; q < 3; q++) { const a = rnd() * 6.28 + q * 2.1; addTube(acc, stemPath(Math.cos(a) * 0.1, Math.sin(a) * 0.1, Math.cos(a) * 0.5 * k, Math.sin(a) * 0.5 * k, 2.5 * k, 0.06 * k, 0.03 * k), seg, 2); }
  } else {                                                                      // spruce: the stub that shows below the lowest tier
    addTube(acc, stemPath(0, 0, 0, 0, 2.2, 0.16, 0.07, 0.6), seg, 2.5);
  }
  return acc.count ? acc.geometry() : null;
}
