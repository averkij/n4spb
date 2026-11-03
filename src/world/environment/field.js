// environment/field.js - the raster "field" of the ground: everything the ground shader, the trees, the lawns and the water need to know about a place,
// built once from the baked OSM data (src/world/data/city.js). Adapted from the Yakutsk sibling (101_3d_yakutsk) for Saint Petersburg.
//   * class mask (1 m cells, RGBA8): the composition of the unbuilt ground as four weights
//       R lawn / grass   G worn asphalt   B granite setts / pavers   A gravel / ballast / dark earth
//     painted per land use (residential yard, commercial lot, railway ...), GREEN polygons, parking, AREAS and the rail corridor, a default elsewhere (a yard:
//     asphalt + setts + a little grass). The ground shader picks ONE category per pixel from a noise tile (patchy, painterly), so one mask serves yards of every kind.
//   * distance texture (1 m cells, RGBA8): R metres to the nearest building wall, G to the nearest carriageway edge (incl. parking pockets), B signed distance to the
//     water (128 = shore, +8 levels per metre on land, - on water), A to the outer edge of the paving beside the roads; all capped at 16 m.
//   * noise tile (256^2 RGBA8, repeating): R / G smooth patch noise, B cracks (cell edges), A speckle; sampled by the GPU and by `noiseAt` (CPU twin) so that
//     "is this spot grass?" (categoryAt) agrees with what the shader draws.
//   * placement queries: free(x, z, extra) = may a trunk / large prop stand here (clear of buildings, carriageways, footways, paving, water + the quay strip, pitches,
//     parking, crossings, bus stops, signals, doors, benches, monuments, fences, the station forecourt, the metro shafts).
// Sources: data/city.js BUILDINGS ROADS AREAS GREEN LANDUSE PARKING CROSSINGS CROSSING_NODES SIGNALS BUS_STOPS DOORS FURNITURE MONUMENTS BARRIERS RAILS ENTRANCES
// + layout GROUND_HOLES; the river from river.js. Everything is deterministic (no Math.random).
import * as THREE from 'three';
import { bakedData } from '../../core/baked-world.js';
import * as L from '../layout.js';
import { BUILDINGS, ROADS, AREAS, GREEN, LANDUSE, PARKING, CROSSINGS, CROSSING_NODES, SIGNALS, BUS_STOPS, DOORS, FURNITURE, MONUMENTS, BARRIERS, RAILS, ENTRANCES, EXTENT } from '../data/city.js';
import { isOwned } from '../lib/claims.js';
import { waterPolys } from './river.js';
import { slopeQuads, slopeAt } from './waterways.js';
import { ZONES, HOOKS, WATER as AREA_WATER } from '../lib/area-tables.js';
import { extraClaimRings } from './claims.js';
import { clamp, hash2 } from './util.js';
import { classLayer } from './class-palette.js';
import { bytePlane } from './sparse-byte-plane.js';
import { distanceLayer } from './distance-atlas.js';

export const PAD = 40;                       // the field reaches this far beyond the data extent
const FIELD_PLANES = ['qP','qH','qT','claim','dtex','clsB'];

// Legacy monolithic fields remain readable. The southern bounding box makes
// the full payload exceed browser ArrayBuffer limits; keep each plane below
// that limit and decode at most two at once, retaining the original typed data.
export async function loadFieldBake(ctx) {
  const meta=await bakedData(ctx,'field');
  if(!meta?.planes)return meta;
  const payload={...meta};delete payload.planes;
  try {
    for(let i=0;i<FIELD_PLANES.length;i+=2)await Promise.all(FIELD_PLANES.slice(i,i+2).map(async key=>{
      const asset=meta.planes[key];
      if(asset!==`field-${key}`)throw Error('Invalid field plane '+key);
      const plane=await bakedData(ctx,asset),length=key==='dtex'?meta.dg.W*meta.dg.H*4:key==='clsB'?meta.cg.W*meta.cg.H*4:meta.dg.W*meta.dg.H;
      if(!(plane instanceof Uint8Array)||plane.length!==length)throw Error('Missing/invalid field plane '+key);
      payload[key]=plane;ctx.baked?.release?.(asset);
    }));
    ctx.baked?.release?.('field');return payload;
  } catch(e) {
    if(ctx.recordBake)throw e;
    console.warn('[baked] field planes unavailable; using generator',e.message);return null;
  }
}

// Await immediately after construction, before any later builder mutates a
// keep-out plane. Encode/upload one plane at a time, avoiding a second complete
// multi-gigabyte snapshot living beside the source raster and transient masks.
export async function recordFieldBake(ctx,field) {
  const payload=field?._bakePayload;if(!payload)return;
  delete field._bakePayload;
  const meta={...payload,planes:{}};
  for(const key of FIELD_PLANES) {
    const name=`field-${key}`;meta.planes[key]=name;delete meta[key];
    ctx.recordBake(name,payload[key]);await Promise.all(ctx.bakeUploads);
  }
  ctx.recordBake('field',meta);await Promise.all(ctx.bakeUploads);
}
const PARK_DEPTH = { perpendicular: 5.0, diagonal: 4.2, parallel: 2.4 };
/** widths of the paving beside a road (streets draws granite slabs 5.5-7 m on Nevsky, 2.5-3.5 m on side streets): the keep-out for trunks.
 *  If streets changes its profiles, change this table. */
const SIDEWALK = { primary: 6.4, primary_link: 3.0, secondary: 4.2, secondary_link: 3.0, tertiary: 3.6, unclassified: 3.0, residential: 3.0, living_street: 2.8 };
/** the carriageway half width, the parking pockets on the left / right side (m) and the paving width of a road record: { hw, pL, pR, sw } (left / right as the OSM polyline runs) */
export function roadBands(r) {
  const tag = r.parkingLane, d = PARK_DEPTH[r.parkingOri || 'parallel'] ?? 2.4;
  const pR = tag === 'right' || tag === 'both' ? d : 0, pL = tag === 'left' || tag === 'both' ? d : 0;
  return { hw: L.roadWidth(r) / 2, pL, pR, sw: SIDEWALK[r.hw] || 0 };
}
/** polyline shifted sideways by d (positive = to the right of the direction of travel), per-vertex averaged normal */
function offsetLine(pts, d) {
  const out = [], n = pts.length / 2;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1), dx = pts[2 * b] - pts[2 * a], dz = pts[2 * b + 1] - pts[2 * a + 1], l = Math.hypot(dx, dz) || 1;
    out.push(pts[2 * i] - dz / l * d, pts[2 * i + 1] + dx / l * d);
  }
  return out;
}
export const DIST_CAP = 16;                  // metres stored in the distance texture
const QD = 255 / DIST_CAP;


// ---------------------------------------------------------------- raster primitives
function makeGrid(x0, z0, x1, z1, res) { return { x0, z0, res, W: Math.ceil((x1 - x0) / res), H: Math.ceil((z1 - z0) / res) }; }

/** even-odd scanline fill of rings (outer + holes, flat [x,z,...]) on grid g: fn(j, i0, i1) per run of cell centres inside */
function fillRings(g, rings, fn) {
  const { x0, z0, res, W, H } = g;
  let zmin = Infinity, zmax = -Infinity;
  for (const r of rings) for (let k = 1; k < r.length; k += 2) { zmin = Math.min(zmin, r[k]); zmax = Math.max(zmax, r[k]); }
  const j0 = Math.max(0, Math.ceil((zmin - z0) / res - 0.5)), j1 = Math.min(H - 1, Math.floor((zmax - z0) / res - 0.5));
  const xs = [];
  for (let j = j0; j <= j1; j++) {
    const z = z0 + (j + 0.5) * res; xs.length = 0;
    for (const o of rings) for (let a = 0, b = o.length - 2; a < o.length; b = a, a += 2) {
      const za = o[a + 1], zb = o[b + 1];
      if ((za > z) !== (zb > z)) xs.push(o[a] + (z - za) * (o[b] - o[a]) / (zb - za));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil((xs[k] - x0) / res - 0.5)), i1 = Math.min(W - 1, Math.floor((xs[k + 1] - x0) / res - 0.5));
      if (i1 >= i0) fn(j, i0, i1);
    }
  }
}
function fillPoly(g, arr, poly, val) { fillRings(g, [poly.o, ...poly.h], (j, i0, i1) => arr.fill(val, j * g.W + i0, j * g.W + i1 + 1)); }
/** thick polyline (round caps) */
function stamp(g, arr, pts, hw, val) {
  const { x0, z0, res, W, H } = g;
  for (let s = 0; s + 3 < pts.length; s += 2) {
    const ax = pts[s], az = pts[s + 1], bx = pts[s + 2], bz = pts[s + 3], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-6;
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - hw - x0) / res)), i1 = Math.min(W - 1, Math.ceil((Math.max(ax, bx) + hw - x0) / res));
    const j0 = Math.max(0, Math.floor((Math.min(az, bz) - hw - z0) / res)), j1 = Math.min(H - 1, Math.ceil((Math.max(az, bz) + hw - z0) / res));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const px = x0 + (i + 0.5) * res, pz = z0 + (j + 0.5) * res;
      const t = clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1), ex = ax + t * dx - px, ez = az + t * dz - pz;
      if (ex * ex + ez * ez <= hw * hw) arr[j * W + i] = val;
    }
  }
}
const disc = (g, arr, x, z, r, val) => stamp(g, arr, [x, z, x + 0.01, z], r, val);
/** oriented rectangle (centre, w along local x, d along local z, rotY as the physics boxes) */
function stampRect(g, arr, x, z, w, d, rotY, val, grow = 0) {
  const c = Math.cos(rotY), s = Math.sin(rotY), hw = w / 2 + grow, hd = d / 2 + grow;
  const ring = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].flatMap(([lx, lz]) => [x + lx * c + lz * s, z - lx * s + lz * c]);
  fillPoly(g, arr, { o: ring, h: [] }, val);
}

/** chamfer distance transform (metres) of the cells where m !== 0 (distance 0 there); capped at DIST_CAP. Works per 64 x 64 tile: a tile with no seed within one tile of it keeps the
 *  far value, a tile made of seeds only keeps 0 - neither is swept (the result is exact below the cap because DIST_CAP (16 m) < one tile). Returns Float32 (BIG = 1e4 where far). */
function edt(m, W, H, res = 1) {
  const BIG = 1e4, S2 = Math.SQRT2 * res, TS = 64, TW = Math.ceil(W / TS), TH = Math.ceil(H / TS);
  const d = new Float32Array(W * H).fill(BIG);                                         // native fill; only tiles with seeds are touched below
  const cnt = new Int32Array(TW * TH);                                               // seeds per tile
  for (let j = 0; j < H; j++) {
    const row = j * W, tj = (j / TS | 0) * TW;
    for (let tx = 0; tx < TW; tx++) {                                                // per tile row segment
      const i0 = tx * TS, i1 = Math.min(W, i0 + TS); let c = 0;
      for (let i = i0; i < i1; i++) c += m[row + i];
      cnt[tj + tx] += c;
    }
  }
  const tileN = (tx, ty) => Math.min(TS, W - tx * TS) * Math.min(TS, H - ty * TS);
  const act = new Uint8Array(TW * TH);                                               // 1 = sweep
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    const k = ty * TW + tx; let near = false;
    for (let y = Math.max(0, ty - 1); y <= Math.min(TH - 1, ty + 1) && !near; y++) for (let x = Math.max(0, tx - 1); x <= Math.min(TW - 1, tx + 1); x++) if (cnt[y * TW + x]) { near = true; break; }
    act[k] = near && cnt[k] < tileN(tx, ty) ? 1 : 0;
  }
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {                  // seed init: full tiles are 0, tiles with some seeds get 0 at the seeds (the rest stays BIG)
    const c = cnt[ty * TW + tx]; if (!c) continue;
    const i0 = tx * TS, i1 = Math.min(W, (tx + 1) * TS), j1 = Math.min(H, (ty + 1) * TS), full = c === tileN(tx, ty);
    for (let j = ty * TS; j < j1; j++) { const row = j * W; if (full) d.fill(0, row + i0, row + i1); else for (let i = i0; i < i1; i++) if (m[row + i]) d[row + i] = 0; }
  }
  // forward sweep (row by row, active tiles of the row only), then backward
  for (let j = 0; j < H; j++) {
    const ty = j / TS | 0;
    for (let tx = 0; tx < TW; tx++) {
      if (!act[ty * TW + tx]) continue;
      const i1 = Math.min(W, (tx + 1) * TS);
      for (let i = tx * TS; i < i1; i++) {
        const k = j * W + i; let v = d[k]; if (v === 0) continue;
        if (i > 0) v = Math.min(v, d[k - 1] + res);
        if (j > 0) { v = Math.min(v, d[k - W] + res); if (i > 0) v = Math.min(v, d[k - W - 1] + S2); if (i < W - 1) v = Math.min(v, d[k - W + 1] + S2); }
        d[k] = v;
      }
    }
  }
  for (let j = H - 1; j >= 0; j--) {
    const ty = j / TS | 0;
    for (let tx = TW - 1; tx >= 0; tx--) {
      if (!act[ty * TW + tx]) continue;
      const i0 = tx * TS;
      for (let i = Math.min(W, (tx + 1) * TS) - 1; i >= i0; i--) {
        const k = j * W + i; let v = d[k]; if (v === 0) continue;
        if (i < W - 1) v = Math.min(v, d[k + 1] + res);
        if (j < H - 1) { v = Math.min(v, d[k + W] + res); if (i < W - 1) v = Math.min(v, d[k + W + 1] + S2); if (i > 0) v = Math.min(v, d[k + W - 1] + S2); }
        d[k] = v;
      }
    }
  }
  return d;
}
const quant = (d) => { const q = new Uint8Array(d.length); for (let i = 0; i < d.length; i++) { const v = d[i] * QD + 0.5; q[i] = v > 255 ? 255 : v | 0; } return q; };

// ---------------------------------------------------------------- ground classes
const pack = (r, g, b, a) => ((Math.round(r * 255) | (Math.round(g * 255) << 8) | (Math.round(b * 255) << 16) | (Math.round(a * 255) << 24)) >>> 0);
/** composition weights (grass, asphalt, setts, gravel) of the unbuilt ground per source */
export const CLASS = {
  default: [0.10, 0.44, 0.38, 0.08],          // a Petersburg courtyard: worn asphalt, granite setts / red-brown pavers, a few lawn patches
  residential: [0.12, 0.42, 0.38, 0.08],
  commercial: [0.03, 0.52, 0.38, 0.07],
  retail: [0.02, 0.60, 0.32, 0.06],
  religious: [0.40, 0.08, 0.40, 0.12],
  garages: [0.01, 0.48, 0.08, 0.43],
  construction: [0.03, 0.12, 0.05, 0.80],
  industrial: [0.06, 0.40, 0.10, 0.44],
  railway: [0.00, 0.03, 0.01, 0.96],
  sports_centre: [0.05, 0.55, 0.30, 0.10],
  lawn: [0.90, 0.00, 0.02, 0.08],
  wood: [0.86, 0.00, 0.02, 0.12],
  parking: [0.01, 0.90, 0.05, 0.04],
  play: [0.02, 0.06, 0.10, 0.82],             // playground / pitch surface: dark earth + rubber crumbs
  paved: [0.00, 0.04, 0.94, 0.02],
  asphalt: [0.00, 0.94, 0.03, 0.03],
  trail: [0.02, 0.06, 0.10, 0.82],          // compacted / fine gravel footways of the parks
  rail: [0.00, 0.02, 0.00, 0.98],
};

// ---------------------------------------------------------------- noise tile
const NT = 256;
function latticeNoise(f, seed) {                              // periodic value noise, f x f lattice over the tile
  const lat = new Float32Array(f * f); for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) lat[j * f + i] = hash2(i, j, seed);
  const out = new Float32Array(NT * NT);
  for (let y = 0; y < NT; y++) {
    const v = y / NT * f, j = Math.floor(v), fy = v - j, sy = fy * fy * (3 - 2 * fy), j1 = (j + 1) % f;
    for (let x = 0; x < NT; x++) {
      const u = x / NT * f, i = Math.floor(u), fx = u - i, sx = fx * fx * (3 - 2 * fx), i1 = (i + 1) % f;
      const a = lat[j * f + i], b = lat[j * f + i1], c = lat[j1 * f + i], d = lat[j1 * f + i1];
      out[y * NT + x] = (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
    }
  }
  return out;
}
function worleyEdge(cells, seed) {                            // periodic cellular noise: F2 - F1 (0 on the cell borders)
  const px = new Float32Array(cells * cells), pz = new Float32Array(cells * cells);
  for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) { px[j * cells + i] = hash2(i, j, seed) * 0.8 + 0.1; pz[j * cells + i] = hash2(i, j, seed + 99) * 0.8 + 0.1; }
  const out = new Float32Array(NT * NT);
  for (let y = 0; y < NT; y++) for (let x = 0; x < NT; x++) {
    const u = x / NT * cells, v = y / NT * cells, ci = Math.floor(u), cj = Math.floor(v);
    let f1 = 9, f2 = 9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ni = ci + di, nj = cj + dj, wi = ((ni % cells) + cells) % cells, wj = ((nj % cells) + cells) % cells;
      const dx = ni + px[wj * cells + wi] - u, dz = nj + pz[wj * cells + wi] - v, d = Math.hypot(dx, dz);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
    }
    out[y * NT + x] = clamp((f2 - f1) * 2.2, 0, 1);
  }
  return out;
}
function makeNoise(bakedData = null) {
  if (bakedData) return noiseFromData(bakedData);
  const R = new Float32Array(NT * NT), G = new Float32Array(NT * NT), A = new Float32Array(NT * NT);
  const octs = [[3, 0.46], [6, 0.28], [12, 0.16], [24, 0.10]];
  let wsum = 0; for (const [, w] of octs) wsum += w;
  for (const [f, w] of octs) { const a = latticeNoise(f, 11 + f), b = latticeNoise(f, 71 + f); for (let i = 0; i < R.length; i++) { R[i] += a[i] * w / wsum; G[i] += b[i] * w / wsum; } }
  const sp0 = latticeNoise(96, 5), sp1 = latticeNoise(48, 9); for (let i = 0; i < A.length; i++) A[i] = sp0[i] * 0.6 + sp1[i] * 0.4;
  const Bc = worleyEdge(6, 3);
  for (const ch of [R, G, A]) { let lo = 1, hi = 0; for (let i = 0; i < ch.length; i++) { lo = Math.min(lo, ch[i]); hi = Math.max(hi, ch[i]); } const k = 1 / Math.max(1e-6, hi - lo); for (let i = 0; i < ch.length; i++) ch[i] = (ch[i] - lo) * k; }
  const data = new Uint8Array(NT * NT * 4);
  for (let i = 0; i < NT * NT; i++) { data[i * 4] = Math.round(R[i] * 255); data[i * 4 + 1] = Math.round(G[i] * 255); data[i * 4 + 2] = Math.round(Bc[i] * 255); data[i * 4 + 3] = Math.round(A[i] * 255); }
  return noiseFromData(data);
}
function noiseFromData(data) {
  const tex = new THREE.DataTexture(data, NT, NT, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 2; tex.needsUpdate = true;
  /** bilinear sample of channel ch (0..3) at world (x, z) with `s` tiles per metre -> 0..1 (what texture2D(uNoise, vec2(x, z) * s) gives at mip 0) */
  const noiseAt = (ch, x, z, s) => {
    const fu = x * s * NT - 0.5, fv = z * s * NT - 0.5, i0 = Math.floor(fu), j0 = Math.floor(fv), fx = fu - i0, fy = fv - j0;
    const w = (v) => ((v % NT) + NT) % NT, a = w(i0), b = w(i0 + 1), c = w(j0), d = w(j0 + 1);
    const t00 = data[(c * NT + a) * 4 + ch], t10 = data[(c * NT + b) * 4 + ch], t01 = data[(d * NT + a) * 4 + ch], t11 = data[(d * NT + b) * 4 + ch];
    return ((t00 + (t10 - t00) * fx) * (1 - fy) + (t01 + (t11 - t01) * fx) * fy) / 255;
  };
  return { texture: tex, noiseAt, data };
}

// ---------------------------------------------------------------- the field
export function buildField(ctx, owned, baked = null) {
  if (baked) return hydrateField(baked, !!ctx.recordBake);
  const _t = []; const lap = (n) => _t.push([n, Date.now()]);
  lap('start');
  const x0 = EXTENT.x0 - PAD, z0 = EXTENT.z0 - PAD, x1 = EXTENT.x1 + PAD, z1 = EXTENT.z1 + PAD;
  const dg = makeGrid(x0, z0, x1, z1, 1), W = dg.W, H = dg.H;
  const cg = dg;                                                    // class mask at the same 1 m grid

  // ---- occupancy masks at 1 m
  const bld = new Uint8Array(W * H), road = new Uint8Array(W * H), pave = new Uint8Array(W * H), path = new Uint8Array(W * H), hard = new Uint8Array(W * H), wat = new Uint8Array(W * H), claim = new Uint8Array(W * H);
  const pts = new Uint8Array(W * H);                    // point-like keep-outs (crossings, signals, bus stops, doors, entrances, furniture, monuments, shafts): kept even for "loose" trunks
  for (const b of BUILDINGS) {
    if (b.skip || (b.minH || 0) > 6) continue;
    for (const p of b.polys) fillPoly(dg, bld, p, 1);
  }
  for (const r of ROADS) {
    if (r.tunnel) continue;
    const w = L.roadWidth(r);
    if (L.isDrivable(r)) {
      const B = roadBands(r), hw = Math.max(1.4, B.hw);
      stamp(dg, road, r.pts, hw, 1);
      if (B.pR) stamp(dg, road, offsetLine(r.pts, hw + B.pR / 2), B.pR / 2, 1);
      if (B.pL) stamp(dg, road, offsetLine(r.pts, -(hw + B.pL / 2)), B.pL / 2, 1);
      if (B.sw) { stamp(dg, pave, r.pts, hw + B.sw, 1); if (B.pR) stamp(dg, pave, offsetLine(r.pts, hw + B.pR / 2), B.pR / 2 + B.sw, 1); if (B.pL) stamp(dg, pave, offsetLine(r.pts, -(hw + B.pL / 2)), B.pL / 2 + B.sw, 1); }
    } else stamp(dg, path, r.pts, Math.max(0.7, w / 2), 1);
  }
  // AREAS that their landmark owner draws itself (a claimed `square` can contain a garden: St Isaac's, the Admiralty, Catherine / Kazan gardens) are NOT hardened and NOT painted as paving over
  // the lawns here: they go into the `claim` mask (no trunks, hedges, beds or tufts: the owner plants its own lawns and trees) and the ground keeps the lawn class of what is mapped inside.
  for (const a of AREAS) { const own = isOwned(owned, a.id); for (const p of a.polys) fillPoly(dg, own ? claim : hard, p, 1); }
  for (const g of GREEN) if (L.isClaimed(g.id)) for (const p of g.polys) fillPoly(dg, claim, p, 1);                 // the landmark owners' lawn beds: they plant them
  for (const b of BUILDINGS) if (isOwned(owned, b.id)) for (const p of b.polys) for (const h of p.h) fillPoly(dg, claim, { o: h, h: [] }, 1);   // courtyards of owned buildings (Great Courtyard of the Winter Palace): the owner lays the floor
  for (const w of waterPolys()) fillPoly(dg, wat, { o: w.o, h: w.h }, 1);
  for (const w of (HOOKS.waterBodies ? HOOKS.waterBodies() : [])) fillPoly(dg, wat, { o: w.o, h: w.h }, 1);                // HOOKS.waterBodies (docs/AREAS.md 9.1): the ponds of a landmark module (the Tauride Garden): in the water mask, so env.waterAt / shoreDist / the distance atlas of the water shader know them
  for (const ring of extraClaimRings(ctx)) fillPoly(dg, claim, { o: ring, h: [] }, 1);                                 // the Kapodistrias promenade of landmarksOktyabrsky (the module paves it)
  for (const sq of slopeQuads()) if(!sq.vegetated) fillPoly(dg, claim, { o: sq.q.flat(), h: [] }, 1);                 // formal slopes exclude planting; park banks allow terrain-rooted trees below
  for (const g of GREEN) if (g.kind === 'pitch' || g.kind === 'playground' || g.kind === 'garden' || g.kind === 'flowerbed' || g.kind === 'fitness_station') for (const p of g.polys) fillPoly(dg, hard, p, 1);
  for (const g of PARKING) for (const p of g.polys) fillPoly(dg, hard, p, 1);
  for (const c of CROSSINGS) stamp(dg, pts, c.pts, (c.w || 3) / 2 + 1.2, 1);
  for (const c of CROSSING_NODES) disc(dg, pts, c.x, c.z, 3.2, 1);
  for (const s of SIGNALS) disc(dg, pts, s.x, s.z, 3.0, 1);
  for (const s of BUS_STOPS) disc(dg, pts, s.x, s.z, s.shelter ? 5.0 : 4.0, 1);
  for (const d of DOORS) disc(dg, pts, d.x, d.z, 3.0, 1);
  for (const e of ENTRANCES) disc(dg, pts, e.x, e.z, 7.0, 1);                                                     // metro entrances
  for (const f of FURNITURE) disc(dg, pts, f.x, f.z, 1.4, 1);
  for (const m of MONUMENTS) disc(dg, pts, m.x, m.z, 4.5, 1);
  for (const b of BARRIERS) if (b.kind === 'fence' || b.kind === 'wall' || b.kind === 'chain') stamp(dg, hard, b.closed ? b.pts.concat(b.pts.slice(0, 2)) : b.pts, 0.9, 1);
  for (const h of L.GROUND_HOLES) stampRect(dg, pts, h.x, h.z, h.w, h.d, h.rotY || 0, 1, 6);                      // metro shafts + 6 m around them
  for (const c of ZONES.clearDiscs) disc(dg, pts, c.x, c.z, c.r, 1);      // the area's ZONES.clearDiscs (the strip: the station forecourt, Vosstaniya Square paving is an AREA already): keep trunks off the facade apron

  lap('raster');
  // each distance field is quantised to a byte right after its transform and the float array dropped (8 float fields at once were ~320 MB of peak memory)
  const qB = quant(edt(bld, W, H)), qR = quant(edt(road, W, H)), qV = quant(edt(pave, W, H)), qP = quant(edt(path, W, H)), qH = quant(edt(hard, W, H)), qT = quant(edt(pts, W, H));
  const qW = new Uint8Array(W * H);
  {
    const dWo = edt(wat, W, H);                                                       // distance to water for land cells
    for (let i = 0; i < W * H; i++) qW[i] = dWo[i] > 0 ? clamp(Math.round(128 + dWo[i] * 8), 0, 255) : 128;   // water cells: set below
    for (let i = 0; i < wat.length; i++) wat[i] = wat[i] ? 0 : 1;
    const dWi = edt(wat, W, H);                                                       // distance to land for water cells
    for (let i = 0; i < W * H; i++) if (!(dWo[i] > 0)) qW[i] = clamp(Math.round(128 - dWi[i] * 8), 0, 255);
  }
  lap('edt');
  const dtex = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { dtex[i * 4] = qB[i]; dtex[i * 4 + 1] = qR[i]; dtex[i * 4 + 2] = qW[i]; dtex[i * 4 + 3] = qV[i]; }


  lap('quant');
  // ---- ground classes
  const cls = new Uint32Array(cg.W * cg.H);
  const vec = (k) => pack(...CLASS[k]);
  cls.fill(vec('default'));
  for (const u of LANDUSE) { const v = vec(CLASS[u.kind] ? u.kind : 'default'); for (const p of u.polys) fillPoly(cg, cls, p, v); }
  const greenClass = (g) => (g.kind === 'wood' || g.kind === 'forest' || g.kind === 'scrub' ? vec('wood') : g.kind === 'pitch' || g.kind === 'playground' || g.kind === 'fitness_station' || g.kind === 'track' ? vec('play') : vec('lawn'));
  for (const a of AREAS) if (isOwned(owned, a.id)) for (const p of a.polys) fillPoly(cg, cls, p, vec('paved'));         // owned squares: paving first, the lawns mapped inside (owned or not) are painted over it
  for (const g of GREEN) for (const p of g.polys) fillPoly(cg, cls, p, greenClass(g));
  for (const g of PARKING) if (g.polys.length && g.amenity === 'parking') for (const p of g.polys) fillPoly(cg, cls, p, vec('parking'));
  for (const a of AREAS) if (!isOwned(owned, a.id)) for (const p of a.polys) fillPoly(cg, cls, p, vec('paved'));
  // mapped surfaces of the pedestrian ways: a pedestrian street (Griboedov east bank, Italyanskaya) is setts / slabs, not a courtyard patchwork; footways follow their surface tag
  // (paving stones / setts: granite, compacted / fine gravel: park gravel). Streets draws only the footway strip itself, the rest of such a street shows this ground.
  const wayReject = HOOKS.groundWayReject;                                                                       // HOOKS.groundWayReject (docs/AREAS.md 9.1): the ways that a landmark module draws itself are not painted (the Tauride Garden)
  for (const r of ROADS) {
    if (r.tunnel || r.bridge || r.passage) continue;
    if (wayReject && wayReject(r)) continue;
    const sf = r.surface, paving = sf === 'paving_stones' || sf === 'sett' || sf === 'cobblestone' || sf === 'paved' || sf === 'unhewn_cobblestone';
    if (r.hw === 'pedestrian') stamp(cg, cls, r.pts, clamp((r.w || 0) / 2 || 6, 3, 10), vec(sf === 'asphalt' ? 'asphalt' : 'paved'));
    else if ((r.hw === 'footway' || r.hw === 'path') && paving) stamp(cg, cls, r.pts, 1.5, vec('paved'));
    else if ((r.hw === 'footway' || r.hw === 'path') && (sf === 'compacted' || sf === 'fine_gravel' || sf === 'gravel' || sf === 'ground')) stamp(cg, cls, r.pts, 1.4, vec('trail'));
  }
  for (const r of RAILS) if (!r.tunnel && !r.bridge) stamp(cg, cls, r.pts, 4.2, vec('rail'));                       // the ballast bed of every track (the rail module draws rails / sleepers)
  const clsB = new Uint8Array(cls.buffer);

  lap('classes');
  const noise = makeNoise();
  if (typeof process !== 'undefined' && process.env && process.env.ENV_DEBUG) console.log('[field]', _t.slice(1).map((e, i) => e[0] + ' ' + (e[1] - _t[i][1])).join(', '));

  // The immutable building / road / water / pavement distances already occupy
  // dtex's RGBA channels. Keeping separate planes duplicates four bytes per
  // cell (319 MiB across the current city) in the bake and in the runtime heap.
  const payload = { x0, z0, x1, z1, dg, cg, qP, qH, qT, claim, dtex, clsB, noiseData: noise.data };
  const field=hydrateField(payload, !!ctx.recordBake);
  if(ctx.recordBake)field._bakePayload=payload;
  return field;
}
function hydrateField(p, keepRawField = false) {
  // Older bakes carry extra qB/qR/qV/qW planes; dtex is identical in both
  // formats. Mutable keep-out distances remain separate for addBlock().
  const { x0, z0, x1, z1, dg, cg } = p;
  const { W, H } = dg, distances = distanceLayer(p.dtex, dg, x0, z0, keepRawField), classes = classLayer(p.clsB, cg, x0, z0, keepRawField), noise = makeNoise(p.noiseData);
  // Private CPU masks keep the original resolution/bytes. Only the offline
  // recordBake branch retains their original mutable raw-array aliases.
  const qP = bytePlane(p.qP, W, H, keepRawField), qH = bytePlane(p.qH, W, H, keepRawField), qT = bytePlane(p.qT, W, H, keepRawField), claim = bytePlane(p.claim, W, H, keepRawField);
  // ---- queries
  const di = (x, z) => { const i = Math.floor(x - x0), j = Math.floor(z - z0); return i < 0 || j < 0 || i >= W || j >= H ? -1 : j * W + i; };
  const tmp0 = [0, 0, 0, 0], tmp = [0, 0, 0, 0];
  const field = {
    box: { x0, z0, x1, z1 }, dist: distances.layer, cls: classes.layer,
    noise,
    bldDist(x, z) { const k = di(x, z); return k < 0 ? DIST_CAP : distances.get(k, 0) / QD; },
    roadDist(x, z) { const k = di(x, z); return k < 0 ? DIST_CAP : distances.get(k, 1) / QD; },
    pathDist(x, z) { const k = di(x, z); return k < 0 ? DIST_CAP : qP.get(k) / QD; },
    ptDist(x, z) { const k = di(x, z); return k < 0 ? DIST_CAP : qT.get(k) / QD; },                      // point-like keep-outs only (crossings, signals, bus stops, doors, entrances, furniture, monuments, shafts)
    hardOnlyDist(x, z) { const k = di(x, z); return k < 0 ? DIST_CAP : qH.get(k) / QD; },                // paving AREAS, fences / walls, parking, pitches
    hardDist(x, z) { const k = di(x, z); return k < 0 ? DIST_CAP : Math.min(qH.get(k), qT.get(k)) / QD; },
    /** signed distance to water (m): > 0 on land, < 0 on water */
    shore(x, z) { const k = di(x, z); return k < 0 ? DIST_CAP : (distances.get(k, 2) - 128) / 8; },
    /** class weights [grass, asphalt, setts, gravel] (0..1, bilinear) at x, z */
    clsAt: classes.sample,
  };
  /** true when a trunk (with `extra` metres more clearance) may stand at x, z. o: { bld (min wall distance), onPave (paving beside the road allowed), shore (min distance to the quay) } */
  field.free = (x, z, extra = 0, o = {}) => {
    const k = di(x, z); if (k < 0) return true;
    if (claim.get(k) && !o.claimOk) return false;
    if (!o.onNaturalBank && AREA_WATER.naturalShoreRegion && slopeAt(x,z)) return false;
    const d = distances.getWord(k); if (d === undefined) return false;
    if ((d & 255) < ((o.bld ?? 2.2) + extra) * QD || (d >>> 8 & 255) < ((o.road ?? 1.3) + extra) * QD || qT.get(k) < (1.0 + extra) * QD) return false;
    if (!o.loose && (qP.get(k) < (0.8 + extra * 0.5) * QD || qH.get(k) < (1.0 + extra) * QD)) return false;       // loose: pavement trees ignore mapped footways and fences along the facade
    if (!o.onPave && (d >>> 24) < 0.8 * QD) { const w = field.clsAt(x, z, tmp0); if (w[0] < 0.8) return false; }     // paving beside the road: only inside a lawn verge
    return ((d >>> 16 & 255) - 128) / 8 > (o.shore ?? 5.5) + extra * 0.5;
  };
  /** true inside an AREA / GREEN / courtyard that a landmark owner draws and plants itself (no trunks, hedges, beds, tufts) */
  field.claimed = (x, z) => { const k = di(x, z); return k >= 0 && (claim.get(k) === 1 || !!AREA_WATER.naturalShoreRegion && slopeAt(x,z)); };
  /** mark a disc as built-over for trunks / tufts / hedges (round flowerbeds are placed after the field exists) */
  field.addBlock = (x, z, r) => {
    for (let dz = -Math.ceil(r + 2); dz <= Math.ceil(r + 2); dz++) for (let dx = -Math.ceil(r + 2); dx <= Math.ceil(r + 2); dx++) {
      const k = di(x + dx, z + dz); if (k < 0) continue;
      const d = Math.hypot(dx, dz) - r; if (d < 2) { qH.set(k, Math.min(qH.get(k), Math.max(0, Math.round(d * QD)))); qT.set(k, Math.min(qT.get(k), Math.max(0, Math.round(d * QD)))); }
    }
  };
  /** clear ground for low things (hedges, beds): not in a building (m metres from the wall), not on a carriageway / hard surface, not in water */
  field.clear = (x, z, m = 0.5) => { const k = di(x, z); if (k < 0) return true; const d = distances.getWord(k); return d !== undefined && !claim.get(k) && (d & 255) >= m * QD && (d >>> 8 & 255) >= 0.5 * QD && qH.get(k) >= 0.2 * QD && qT.get(k) >= 0.2 * QD && ((d >>> 16 & 255) - 128) / 8 >= 0.5 && !(AREA_WATER.naturalShoreRegion && slopeAt(x,z)); };
  /** distance (m) to the outer edge of the paving beside the roads (0 on it) */
  field.paveDist = (x, z) => { const k = di(x, z); return k < 0 ? DIST_CAP : distances.get(k, 3) / QD; };
  /** which ground the shader paints at x, z: 'grass' | 'asphalt' | 'setts' | 'gravel' (the same competition of four noise fields as the shader) */
  field.categoryAt = (x, z) => {
    const w = field.clsAt(x, z, tmp), sum = w[0] + w[1] + w[2] + w[3] + 1e-4;
    const a0 = noise.noiseAt(0, x, z, 0.021), a1 = noise.noiseAt(1, x, z, 0.021), b0 = noise.noiseAt(0, x + 61, z + 37, 0.021), b1 = noise.noiseAt(1, x + 61, z + 37, 0.021);
    const s = [Math.log(w[0] / sum + 0.04) + 9 * (a0 - 0.5), Math.log(w[1] / sum + 0.04) + 9 * (a1 - 0.5), Math.log(w[2] / sum + 0.04) + 9 * (b0 - 0.5), Math.log(w[3] / sum + 0.04) + 9 * (b1 - 0.5)];
    let k = 0; for (let i = 1; i < 4; i++) if (s[i] > s[k]) k = i;
    return k === 0 ? 'grass' : k === 1 ? 'asphalt' : k === 2 ? 'setts' : 'gravel';
  };
  return field;
}
