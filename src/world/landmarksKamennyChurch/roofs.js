// landmarksVladimir/roofs.js - hip roofs by the distance field: hipRoof() lays a sheet over a RECTILINEAR ring (all edges along the local axes) whose height is y0 + pitch x (distance to the
// nearest eave), capped; the grid lines pass through every ring vertex, so the eaves, ridges of the bars and the valleys of an L plan come out exactly.  Used by Tuchkov Buyan and the annexes.
const distSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
export const distRing = (x, z, ring) => { let d = 1e9; for (let i = 0; i < ring.length; i++) d = Math.min(d, distSeg(x, z, ring[i], ring[(i + 1) % ring.length])); return d; };
export const inRing = (x, z, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
function cuts(vals, step) {
  const v = [...new Set(vals.map((a) => Math.round(a * 100) / 100))].sort((a, b) => a - b), out = [];
  for (let i = 0; i + 1 < v.length; i++) { const n = Math.max(1, Math.ceil((v[i + 1] - v[i]) / step)); for (let k = 0; k < n; k++) out.push(v[i] + (v[i + 1] - v[i]) * k / n); }
  out.push(v[v.length - 1]); return out;
}
/** ring [[x, z]..] in the current frame (rectilinear); o: { step 2.5, cap (max rise), tile 2.4 } */
export function hipRoof(P, mat, ring, y0, pitch, o = {}) {
  const step = o.step ?? 2.5, cap = o.cap ?? 1e9, tile = o.tile ?? 2.4;
  const xs = cuts(ring.map((p) => p[0]), step), zs = cuts(ring.map((p) => p[1]), step);
  const h = (x, z) => y0 + Math.min(cap, pitch * distRing(x, z, ring));
  for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < zs.length; j++) {
    const x0 = xs[i], x1 = xs[i + 1], z0 = zs[j], z1 = zs[j + 1];
    if (!inRing((x0 + x1) / 2, (z0 + z1) / 2, ring)) continue;
    const a = [x0, h(x0, z0), z0], b = [x1, h(x1, z0), z0], c = [x1, h(x1, z1), z1], d = [x0, h(x0, z1), z1];
    const ua = [x0 / tile, z0 / tile], ub = [x1 / tile, z0 / tile], uc = [x1 / tile, z1 / tile], ud = [x0 / tile, z1 / tile];
    // split along the diagonal that joins the two closest heights (keeps ridges and valleys sharp)
    if (Math.abs(a[1] - c[1]) <= Math.abs(b[1] - d[1])) { P.fan(mat, [a, b, c], [0, 1, 0], null); fix(P, mat, ua, ub, uc); P.fan(mat, [a, c, d], [0, 1, 0], null); fix(P, mat, ua, uc, ud); }
    else { P.fan(mat, [a, b, d], [0, 1, 0], null); fix(P, mat, ua, ub, ud); P.fan(mat, [b, c, d], [0, 1, 0], null); fix(P, mat, ub, uc, ud); }
  }
}
// P.fan gives the three vertices the normal it was asked for and uv from x, y: rewrite the last triangle's normals (true face normal) and uv (world x, z)
function fix(P, mat, u0, u1, u2) {
  const k = P.bucket(mat), n = k.n, p = (i) => [k.pos[(n - 3 + i) * 3], k.pos[(n - 3 + i) * 3 + 1], k.pos[(n - 3 + i) * 3 + 2]];
  const A = p(0), B = p(1), C = p(2), ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
  for (let i = 0; i < 3; i++) { k.nrm[(n - 3 + i) * 3] = nx; k.nrm[(n - 3 + i) * 3 + 1] = ny; k.nrm[(n - 3 + i) * 3 + 2] = nz; }
  [u0, u1, u2].forEach((u, i) => { k.uv[(n - 3 + i) * 2] = u[0]; k.uv[(n - 3 + i) * 2 + 1] = u[1]; });
}
