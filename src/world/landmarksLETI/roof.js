// COPY of landmarksBotanicalGarden/roof.js (modules never import each other); used by landmarksLETI.
// COPY of landmarksI/hip.js (hipRoof over an arbitrary footprint) and landmarksAcademy/shell.js (hipRect) (modules never import each other); used by landmarksBotanicalGarden.
// hipRoof: the roof surface is the footprint polygon triangulated and subdivided; every vertex rises with its distance to the nearest eave (slope, up to a plateau R), so the planes meet in proper hips
// and valleys at every corner.  hipRect / gableRect: crisp hip / gable roofs over a rectangle of the current frame (ridge along x), with eaves overhang.
import * as THREE from 'three';

export function hipRoof(P, mat, outer, holes, y0, o = {}) {
  const slope = o.slope ?? 0.3, R = o.R ?? 3.0, cell = o.cell ?? 3.2, uvs = o.uvs ?? 4;
  const segs = [];
  for (const r of [outer].concat(holes || [])) for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; segs.push([a[0], a[1], b[0] - a[0], b[1] - a[1], Math.max(1e-9, (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)]); }
  const dist = (x, z) => {
    let best = 1e9;
    for (const s of segs) {
      let t = ((x - s[0]) * s[2] + (z - s[1]) * s[3]) / s[4]; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = x - (s[0] + s[2] * t), dz = z - (s[1] + s[3] * t), d = dx * dx + dz * dz;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  };
  const h = (x, z) => y0 + Math.min(R, slope * dist(x, z));
  const c2 = outer.map((p) => new THREE.Vector2(p[0], p[1])), h2 = (holes || []).map((r) => r.map((p) => new THREE.Vector2(p[0], p[1])));
  const all = outer.concat(...(holes || [])), tris = THREE.ShapeUtils.triangulateShape(c2, h2);
  const out = [];
  const split = (A, B, C, depth) => {
    const ab = Math.hypot(B[0] - A[0], B[1] - A[1]), bc = Math.hypot(C[0] - B[0], C[1] - B[1]), ca = Math.hypot(A[0] - C[0], A[1] - C[1]);
    const m = Math.max(ab, bc, ca);
    if (m <= cell || depth > 7) { out.push([A, B, C]); return; }
    if (m === ab) { const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; split(A, M, C, depth + 1); split(M, B, C, depth + 1); }
    else if (m === bc) { const M = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]; split(A, B, M, depth + 1); split(A, M, C, depth + 1); }
    else { const M = [(C[0] + A[0]) / 2, (C[1] + A[1]) / 2]; split(A, B, M, depth + 1); split(M, B, C, depth + 1); }
  };
  for (const [a, b, c] of tris) split(all[a], all[b], all[c], 0);
  const cache = new Map();
  const H = (p) => { const k = p[0].toFixed(3) + ',' + p[1].toFixed(3); let v = cache.get(k); if (v === undefined) { v = h(p[0], p[1]); cache.set(k, v); } return v; };
  for (const [A, B, C] of out) {
    const a = [A[0], H(A), A[1]], b = [B[0], H(B), B[1]], c = [C[0], H(C), C[1]];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
    P.fan(mat, [a, b, c], [nx, ny, nz], (p) => [p[0] / uvs, p[2] / uvs]);
  }
  return h;
}

/**
 * Hip / gable roof over the rectangle x0..x1, z0..z1 of the CURRENT frame: eaves at y (overhang `over`), ridge along x at y + rise.  hip0 / hip1 = run of the hip at the x0 / x1 end (0 = a gable end,
 * with the wall triangle drawn in o.gable when given; default run = half the depth).  tile = metres per uv unit of the roof material.  Returns the ridge height function h(x, z).
 */
export function hipRect(P, mat, x0, x1, z0, z1, y, rise, o = {}) {
  const ov = o.over ?? 0.4, tile = o.tile ?? 1.2, zm = (z0 + z1) / 2, hd = (z1 - z0) / 2, h0 = o.hip0 ?? hd, h1 = o.hip1 ?? hd, a = x0 - (h0 > 0 ? ov : 0), b = x1 + (h1 > 0 ? ov : 0), c = z0 - ov, d = z1 + ov, yr = y + rise;
  const ra = x0 + h0, rb = x1 - h1, sl = Math.hypot(hd + ov, rise);
  const drop = ov * rise / hd;                                                               // the eaves overhang continues the slope downwards
  const yE = y - drop;
  const seg = Math.max(1, Math.ceil((b - a) / 16));
  for (let i = 0; i < seg; i++) {
    const t0 = i / seg, t1 = (i + 1) / seg, ea = a + (b - a) * t0, eb = a + (b - a) * t1, qa = ra + (rb - ra) * t0, qb = ra + (rb - ra) * t1;
    P.quad(mat, [ea, yE, d], [eb, yE, d], [qb, yr, zm], [qa, yr, zm], [0, hd, rise], [[ea / tile, 0], [eb / tile, 0], [qb / tile, sl / tile], [qa / tile, sl / tile]]);
    P.quad(mat, [eb, yE, c], [ea, yE, c], [qa, yr, zm], [qb, yr, zm], [0, hd, -rise], [[eb / tile, 0], [ea / tile, 0], [qa / tile, sl / tile], [qb / tile, sl / tile]]);
  }
  for (const [xe, xr, hh, s] of [[a, ra, h0, -1], [b, rb, h1, 1]]) {
    if (hh > 0) P.fan(mat, [[xe, yE, s > 0 ? d : c], [xe, yE, s > 0 ? c : d], [xr, yr, zm]], [s * rise, hh, 0], (p) => [p[2] / tile, (p[1] - yE) / tile * 1.4]);
    else if (o.gable) P.fan(o.gable, [[xe, y, c + ov], [xe, y, d - ov], [xe, yr - 0.05, zm]], [s, 0, 0], (p) => [p[2] / 3, p[1] / 3]);
  }
  return (x, z) => y + rise * Math.max(0, 1 - Math.abs(z - zm) / hd);
}

/** a plain gable roof over x0..x1, z0..z1 with the ridge ALONG X (overhang `over` all round, the gable ends closed with the `gable` material) */
export function gableRect(P, mat, x0, x1, z0, z1, y, rise, o = {}) { return hipRect(P, mat, x0, x1, z0, z1, y, rise, { ...o, hip0: 0, hip1: 0 }); }
