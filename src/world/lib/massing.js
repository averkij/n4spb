// Building massing helpers: extrude OSM-style footprints (polygon + holes) into wall meshes whose uv are in
// *cell space* for ctx.mat.facade() (u = bay index along the wall, v = floor index = y / floorHeight), flat / skillion
// roofs, and collision boxes along the footprint edges.
//
//   const walls = new MeshBuilder(), roofs = new MeshBuilder();
//   addPrism(walls, roofs, poly, y0, y1, { bay: 1.5, floor: 3.9, roof: { shape: 'skillion', height: 25, dir: 330 } });
//   group.add(new THREE.Mesh(walls.build(), ctx.mat.facade({...})), new THREE.Mesh(roofs.build(), ctx.mat.toon('#8c939a')));
//
// poly = { o: [x,z,x,z,...], h: [[x,z,...], ...] }  (as baked in data/city.js; rings are open, +X east, +Z south)
import * as THREE from 'three';
import { DOORWAYS } from '../data/metro.js';

export class MeshBuilder {
  constructor() { this.pos = []; this.nrm = []; this.uv = []; this.idx = []; this.n = 0; }
  vert(x, y, z, nx, ny, nz, u = 0, v = 0) { this.pos.push(x, y, z); this.nrm.push(nx, ny, nz); this.uv.push(u, v); return this.n++; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  get empty() { return this.n === 0; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

/** flat [x,z,...] -> [[x,z],...] (drops a duplicated closing point and repeated points). */
export function ringFromFlat(a) {
  const r = [];
  for (let i = 0; i < a.length; i += 2) {
    const p = [a[i], a[i + 1]], q = r[r.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.02) r.push(p);
  }
  if (r.length > 1 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 0.02) r.pop();
  return r;
}
export const signedArea = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
export function polyBounds(poly) { const r = ringFromFlat(poly.o); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of r) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } return { x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 }; }
export function polyCentroid(poly) { const r = ringFromFlat(poly.o); let a = 0, cx = 0, cz = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; const f = p[0] * q[1] - q[0] * p[1]; a += f; cx += (p[0] + q[0]) * f; cz += (p[1] + q[1]) * f; } a /= 2; return Math.abs(a) < 1e-6 ? r[0] : [cx / (6 * a), cz / (6 * a)]; }
export const polyArea = (poly) => Math.abs(signedArea(ringFromFlat(poly.o))) - poly.h.reduce((s, h) => s + Math.abs(signedArea(ringFromFlat(h))), 0);

/** Roof height function y(x,z) for a footprint. shape 'flat' (default) | 'skillion' (one slope; dir = compass degrees the slope faces DOWN toward, 0 = north = -Z). */
export function roofProfile(poly, y1, roof) {
  roof = roof || {};
  const shape = roof.shape || 'flat';
  if (shape !== 'skillion' || !(roof.height > 0)) return { y: () => y1, base: y1 };
  const th = ((roof.dir ?? 0) * Math.PI) / 180;
  const dx = Math.sin(th), dz = -Math.cos(th);                // downhill direction in (x,z)
  const r = ringFromFlat(poly.o);
  let lo = 1e9, hi = -1e9; for (const p of r) { const t = p[0] * dx + p[1] * dz; lo = Math.min(lo, t); hi = Math.max(hi, t); }
  const low = y1 - roof.height, span = Math.max(hi - lo, 1e-3);
  // highest point (y1) is the uphill edge; the lowest is y1 - height
  return { y: (x, z) => low + roof.height * (1 - ((x * dx + z * dz) - lo) / span), base: low };
}

/** Add vertical walls around one ring. `top` is a number or fn(x,z)->y. Corners sharper than smoothDeg keep a hard edge. */
export function addWalls(B, ring, y0, top, o = {}) {
  const bay = o.bay ?? 1.5, floor = o.floor ?? 3.9, smoothDeg = o.smoothDeg ?? 30;
  const hole = !!o.hole;
  let r = ring.slice();
  const area = signedArea(r);
  if ((area > 0) === hole) r = r.reverse();             // outer: area > 0, hole: area < 0  (outward normal = (dz, -dx))
  const n = r.length; if (n < 3) return;
  const topAt = typeof top === 'function' ? top : () => top;
  const ed = [], len = [], nm = [];
  for (let i = 0; i < n; i++) {
    const a = r[i], b = r[(i + 1) % n]; const dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1e-6;
    ed.push([dx / l, dz / l]); len.push(l); nm.push([dz / l, -dx / l]);
  }
  const cosSmooth = Math.cos(smoothDeg * Math.PI / 180);
  // corner i sits between edge i-1 and edge i
  const smooth = ed.map((d, i) => { const p = ed[(i + n - 1) % n]; return d[0] * p[0] + d[1] * p[1] >= cosSmooth; });
  let start = smooth.findIndex((s) => !s); const allSmooth = start < 0; if (allSmooth) start = 0;
  // walk chains
  let i = 0;
  while (i < n) {
    const e0 = (start + i) % n;
    let count = 1, chainLen = len[e0];
    if (allSmooth) { count = n; chainLen = len.reduce((s, v) => s + v, 0); }
    else { while (i + count < n && smooth[(start + i + count) % n]) { chainLen += len[(start + i + count) % n]; count++; } }
    const bays = Math.max(1, Math.round(chainLen / bay)), k = bays / chainLen;
    let u = 0;
    for (let c = 0; c < count; c++) {
      const e = (start + i + c) % n, a = r[e], b = r[(e + 1) % n];
      const nA = smooth[e] || (allSmooth) ? avg(nm[(e + n - 1) % n], nm[e]) : nm[e];
      const nB = smooth[(e + 1) % n] || allSmooth ? avg(nm[e], nm[(e + 1) % n]) : nm[e];
      const ua = u * k, ub = (u + len[e]) * k;
      const ta = topAt(a[0], a[1]), tb = topAt(b[0], b[1]);
      if (ta > y0 + 0.01 || tb > y0 + 0.01) {
        const v0 = B.vert(a[0], y0, a[1], nA[0], 0, nA[1], ua, y0 / floor);
        const v1 = B.vert(b[0], y0, b[1], nB[0], 0, nB[1], ub, y0 / floor);
        const v2 = B.vert(b[0], tb, b[1], nB[0], 0, nB[1], ub, tb / floor);
        const v3 = B.vert(a[0], ta, a[1], nA[0], 0, nA[1], ua, ta / floor);
        B.tri(v0, v2, v1); B.tri(v0, v3, v2);
      }
      u += len[e];
    }
    i += count;
  }
  function avg(p, q) { const x = p[0] + q[0], z = p[1] + q[1], l = Math.hypot(x, z) || 1; return [x / l, z / l]; }
}

/** Triangulated cap (roof / floor) for a polygon with holes at height fn(x,z). up=true faces +Y. */
export function addCap(B, poly, y, o = {}) {
  const outer = ringFromFlat(poly.o), holes = poly.h.map(ringFromFlat).filter((h) => h.length >= 3);
  if (outer.length < 3) return;
  const yf = typeof y === 'function' ? y : () => y;
  const c2 = outer.map((p) => new THREE.Vector2(p[0], p[1])), h2 = holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
  const tris = THREE.ShapeUtils.triangulateShape(c2, h2);
  const pts = outer.concat(...holes);
  const up = o.up !== false;
  const s = o.uvScale ?? 1;
  // slope normal (from three sample points of the profile)
  const p0 = pts[0]; const e = 1.0;
  const ny = 1, sx = (yf(p0[0] + e, p0[1]) - yf(p0[0] - e, p0[1])) / (2 * e), sz = (yf(p0[0], p0[1] + e) - yf(p0[0], p0[1] - e)) / (2 * e);
  const nl = Math.hypot(sx, ny, sz); const N = [-sx / nl * (up ? 1 : -1), ny / nl * (up ? 1 : -1), -sz / nl * (up ? 1 : -1)];
  const base = B.n;
  for (const p of pts) B.vert(p[0], yf(p[0], p[1]) + (o.lift || 0), p[1], N[0], N[1], N[2], p[0] / s, p[1] / s);
  for (const t of tris) {
    let [a, b, c] = t;
    // make the face point along N
    const A = pts[a], Bp = pts[b], Cp = pts[c];
    const ux = Bp[0] - A[0], uz = Bp[1] - A[1], vx = Cp[0] - A[0], vz = Cp[1] - A[1];
    const cross_y = uz * vx - ux * vz;                       // y component of (B-A) x (C-A) for points in the xz plane
    const wantUp = N[1] > 0;
    if ((cross_y > 0) !== wantUp) { const tmp = b; b = c; c = tmp; }
    B.tri(base + a, base + b, base + c);
  }
}

/** One prism (all rings) + its cap. walls/roofs are MeshBuilders. Returns the roof profile used. */
export function addPrism(walls, roofs, poly, y0, y1, o = {}) {
  const prof = roofProfile(poly, y1, o.roof);
  addWalls(walls, ringFromFlat(poly.o), y0, prof.y, { ...o, hole: false });
  for (const h of poly.h) addWalls(walls, ringFromFlat(h), y0, prof.y, { ...o, hole: true });
  if (roofs) addCap(roofs, poly, prof.y, { uvScale: o.roofUv ?? 4 });
  if (o.floorCap && roofs) addCap(roofs, poly, y0, { up: false });
  return prof;
}

/** Collision boxes along every footprint edge (thin oriented boxes; the player cannot enter the mass). */
export function addPolyColliders(ctx, poly, y0, y1, thick = 0.9, doorways = DOORWAYS) {
  const rings = [ringFromFlat(poly.o), ...poly.h.map(ringFromFlat)];
  let count = 0;
  for (const r of rings) {
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length]; const dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz);
      if (l < 0.3) continue;
      const ux = dx / l, uz = dz / l;
      // metro portals / doorways (data/metro.js DOORWAYS) that cut through this wall: the collider is split around the opening
      const gaps = [];
      for (const d of doorways) {
        const px = d.x - a[0], pz = d.z - a[1], t = px * ux + pz * uz, off = Math.abs(px * -uz + pz * ux);
        if (off < 1.6 && t > -d.w / 2 && t < l + d.w / 2) gaps.push([Math.max(0, t - d.w / 2), Math.min(l, t + d.w / 2)]);
      }
      gaps.sort((m, n) => m[0] - n[0]);
      const pieces = []; let s0 = 0;
      for (const g of gaps) { if (g[0] > s0 + 0.05) pieces.push([s0, g[0]]); s0 = Math.max(s0, g[1]); }
      if (s0 < l - 0.05) pieces.push([s0, l]);
      for (const [t0, t1] of pieces) {
        const len = t1 - t0; if (len < 0.3) continue;
        const cx = a[0] + ux * (t0 + t1) / 2, cz = a[1] + uz * (t0 + t1) / 2;
        ctx.physics.addBox(cx, cz, len + (gaps.length ? 0 : thick * 0.5), thick, Math.atan2(-dz, dx), y0, y1);
        count++;
      }
    }
  }
  return count;
}

/** Deterministic string hash -> [0,1). */
export function hash01(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
