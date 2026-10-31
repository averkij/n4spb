// landmarksZhdanovka/geom.js - building helpers shared by the four houses: walls of a ring edge as a stack of atlas rows, the cornice ledge, an arch opening in a wall (real hole, reveal, back), oriel bays,
// cast-iron balconies, a barrel dormer.  All take a Parts collector P whose current frame is the EDGE FRAME of the wall (frame.js: x to the right, z outward, origin at the left end) unless the name says "world".
import { edgeFrame } from './frame.js';

const TAU = Math.PI * 2;

/**
 * the wall of one edge as a stack of atlas rows (M.o7g ...): rows = [{ mat, h, from?, to? }] from the ground up; each row is one quad tiled n times along the edge (u = tile repeats).
 * from / to (m along the edge) restrict a row to a span (used round openings); holes = [{ x0, x1, yTop }] spans that are left open between the ground and yTop (the quad of a row is cut).
 */
export function wallRows(P, rows, len, o = {}) {
  const pitch = o.pitch || 2.94, nAll = Math.max(1, Math.round(len / pitch)), tile = len / nAll;
  let y = o.y0 || 0;
  for (const r of rows) {
    const y1 = y + r.h, hM = (r.mat.__atlas && r.mat.__atlas.hM) || r.h;
    const spans = [[0, len]];
    for (const hl of (o.holes || [])) {
      if (y >= hl.yTop - 1e-3) continue;
      for (let i = spans.length - 1; i >= 0; i--) {
        const [a, b] = spans[i];
        if (hl.x1 <= a || hl.x0 >= b) continue;
        spans.splice(i, 1);
        if (hl.x0 > a) spans.push([a, hl.x0]);
        if (hl.x1 < b) spans.push([hl.x1, b]);
      }
    }
    for (const [a, b] of spans) {
      if (b - a < 0.05) continue;
      const v1 = Math.min(1, r.h / hM);
      P.quad(r.mat, [a, y, 0], [b, y, 0], [b, y1, 0], [a, y1, 0], [0, 0, 1], [[a / tile, 0], [b / tile, 0], [b / tile, v1], [a / tile, v1]]);
    }
    y = y1;
  }
  return y;
}

/** a courtyard / back wall in WORLD coordinates between two ring points: rows of the court tile up to height H */
export function courtWall(P, mat, a, b, n, H, y0 = 0) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.2) return;
  const pitch = 2.94, nr = Math.max(1, Math.round(len / pitch)), hM = mat.__atlas.hM;
  let y = y0;
  while (y < H - 0.01) {
    const y1 = Math.min(H, y + hM), v1 = (y1 - y) / hM;
    P.quad(mat, [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [n[0], 0, n[1]], [[0, 0], [nr, 0], [nr, v1], [0, v1]]);
    y = y1;
  }
}

/** a ledge (cornice / string course) along the whole edge in the edge frame: x 0..len (+ ext at both ends), y0..y1, projecting `proj`; the back face is omitted */
export function ledge(P, mat, len, y0, y1, proj, ext = 0, skip = 'k', uvs = 1.2) { P.box(mat, -ext, len + ext, y0, y1, 0, proj, skip, uvs); }

/**
 * a wall of the single texture `mat` (an ordinary map, uv = x / W, y / H) with arched openings cut out: openings = [{ cx, r, yc }] (a semicircle of radius r springing at height yc, the jambs go down to y 0).
 * The wall is built from rectangles and vertical strips above the arcs.  Returns the polylines of the openings (for the reveals).
 */
export function archedWall(P, mat, W, H, openings, N = 16) {
  const uv = (x, y) => [x / W, y / H], Q = (x0, x1, ya, yb, yc, yd) => P.quad(mat, [x0, ya, 0], [x1, yb, 0], [x1, yd, 0], [x0, yc, 0], [0, 0, 1], [uv(x0, ya), uv(x1, yb), uv(x1, yd), uv(x0, yc)]);
  const ops = [...openings].sort((a, b) => a.cx - b.cx), lines = [];
  let x = 0;
  for (const op of ops) {
    const x0 = op.cx - op.r, x1 = op.cx + op.r;
    if (x0 > x + 0.01) Q(x, x0, 0, 0, H, H);
    const pts = [[x0, 0], [x0, op.yc]];
    for (let k = 1; k < N; k++) { const a = Math.PI - Math.PI * k / N; pts.push([op.cx + op.r * Math.cos(a), op.yc + op.r * Math.sin(a)]); }
    pts.push([x1, op.yc], [x1, 0]);
    for (let k = 1; k < pts.length - 2; k++) { const p = pts[k], q = pts[k + 1]; if (Math.abs(q[0] - p[0]) < 1e-6) continue; Q(p[0], q[0], p[1], q[1], H, H); }
    lines.push(pts);
    x = x1;
  }
  if (x < W - 0.01) Q(x, W, 0, 0, H, H);
  return lines;
}

/** the reveal (soffit and jambs) of an opening polyline `pts` ([[x, y]...] along the wall, from the left jamb foot to the right one) into the wall by `depth`, normals pointing into the opening; uv in metres / tileM */
export function reveal(P, mat, pts, depth, tileM = 8, vM = 2) {
  let acc = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const p = pts[i], q = pts[i + 1], dl = Math.hypot(q[0] - p[0], q[1] - p[1]); if (dl < 1e-4) continue;
    const nx = -(q[1] - p[1]) / dl, ny = (q[0] - p[0]) / dl;                       // 90 deg to the left of the travel direction (the right-hand run of the arch: points up then right, so this points into the opening)
    P.quad(mat, [p[0], p[1], 0], [q[0], q[1], 0], [q[0], q[1], -depth], [p[0], p[1], -depth], [-nx, -ny, 0].map((v) => v), [[acc / tileM, 0], [(acc + dl) / tileM, 0], [(acc + dl) / tileM, depth / vM], [acc / tileM, depth / vM]]);
    acc += dl;
  }
}

/** a barrel-vaulted roof: a half-ellipse (width w, rise `rise`) over a base at y0, extruded between z0 and z1 (z1 < z0 going back); the two ends are closed fans */
export function barrel(P, mat, cx, y0, w, rise, z0, z1, n = 10, capMat = mat) {
  const arc = []; for (let k = 0; k <= n; k++) { const a = Math.PI - Math.PI * k / n; arc.push([cx + w / 2 * Math.cos(a), y0 + rise * Math.sin(a)]); }
  for (let k = 0; k < n; k++) {
    const p = arc[k], q = arc[k + 1], mx = (p[0] + q[0]) / 2 - cx, my = ((p[1] + q[1]) / 2 - y0) / rise * 0.6;
    P.quad(mat, [p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1], [mx, my, 0], [[0, 0], [0.4, 0], [0.4, 1], [0, 1]]);
  }
  for (const [z, s] of [[z0, 1], [z1, -1]]) P.fan(capMat, arc.map((p) => [p[0], p[1], z]), [0, 0, s], (p) => [p[0] / 2, p[1] / 2]);
}

/**
 * one level of a three-sided oriel (bay window) in the edge frame: it is attached to the wall over width w centred at cx, the flanks run to a front of width w - 2 * run at depth proj.
 * fm / sm = materials of the front and the flanks, y0..y1 the height; top / bottom caps in capMat.
 */
export function bayLevel(P, cx, w, proj, run, y0, y1, fm, sm, capMat, o = {}) {
  const hw = w / 2, fw = hw - run, wall = o.uv || ((a, b) => [[a, 0], [b, 0], [b, 1], [a, 1]]);
  P.quad(fm, [cx - fw, y0, proj], [cx + fw, y0, proj], [cx + fw, y1, proj], [cx - fw, y1, proj], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.quad(sm, [cx + fw, y0, proj], [cx + hw, y0, 0], [cx + hw, y1, 0], [cx + fw, y1, proj], [Math.hypot(proj, run) ? proj / Math.hypot(proj, run) : 1, 0, run / Math.hypot(proj, run)], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.quad(sm, [cx - hw, y0, 0], [cx - fw, y0, proj], [cx - fw, y1, proj], [cx - hw, y1, 0], [-proj / Math.hypot(proj, run), 0, run / Math.hypot(proj, run)], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  if (o.top !== false) P.fan(capMat, [[cx - hw, y1, 0], [cx - fw, y1, proj], [cx + fw, y1, proj], [cx + hw, y1, 0]], [0, 1, 0], (p) => [p[0], p[2]]);
  if (o.bottom !== false) P.fan(capMat, [[cx - hw, y0, 0], [cx + hw, y0, 0], [cx + fw, y0, proj], [cx - fw, y0, proj]], [0, -1, 0], (p) => [p[0], p[2]]);
  void wall;
}

/** a cast-iron balcony in the edge frame: a slab at yF (thickness 0.14), two brackets, the railing on three sides (M.rails alpha) 0.95 m high, centred at cx, width w, projection proj */
export function balcony(P, M, cx, w, proj, yF) {
  P.box(M.stone, cx - w / 2, cx + w / 2, yF - 0.14, yF, 0, proj, 'k', 1.2);
  for (const sx of [-1, 1]) P.box(M.black, cx + sx * (w / 2 - 0.3) - 0.04, cx + sx * (w / 2 - 0.3) + 0.04, yF - 0.5, yF - 0.14, 0.02, proj - 0.1, 'k', 1);
  const h = 0.95, rp = proj - 0.04, x0 = cx - w / 2 + 0.04, x1 = cx + w / 2 - 0.04;
  P.quad(M.rails, [x0, yF, rp], [x1, yF, rp], [x1, yF + h, rp], [x0, yF + h, rp], [0, 0, 1], [[0, 0], [w / 1.9, 0], [w / 1.9, 1], [0, 1]]);
  P.quad(M.rails, [x0, yF, 0.04], [x0, yF, rp], [x0, yF + h, rp], [x0, yF + h, 0.04], [-1, 0, 0], [[0, 0], [rp / 1.9, 0], [rp / 1.9, 1], [0, 1]]);
  P.quad(M.rails, [x1, yF, rp], [x1, yF, 0.04], [x1, yF + h, 0.04], [x1, yF + h, rp], [1, 0, 0], [[0, 0], [rp / 1.9, 0], [rp / 1.9, 1], [0, 1]]);
}

/** world-frame helper: the polygon ring as flat [x, z, x, z ...] */
export const flat = (ring) => ring.flatMap((p) => [p[0], p[1]]);
export { edgeFrame, TAU };

// ================================================================================================ real windows: holes in the wall, reveals, a recessed glass quad
/**
 * a wall rectangle x0..x1 x y0..y1 in the plane z = 0 (facing +z) with HOLES cut out: holes = [{ x0, x1, y0, y1, top?, N? }]; a hole with `top(x)` (arch) is open up to y = top(x) (y1 ignored) and is sampled in N slabs.
 * The wall is emitted as quads over vertical slabs (equal slabs are merged); uvf(x, y) -> [u, v] gives the texture coordinate of every corner.
 */
export function wallHoles(P, mat, x0, x1, y0, y1, holes, uvf) {
  const eps = 1e-4, xs = new Set([x0, x1]);
  for (const h of holes) {
    for (const x of [h.x0, h.x1]) if (x > x0 + eps && x < x1 - eps) xs.add(Math.round(x * 1e4) / 1e4);
    if (h.top) for (let k = 1; k < (h.N || 12); k++) xs.add(Math.round((h.x0 + (h.x1 - h.x0) * k / (h.N || 12)) * 1e4) / 1e4);
  }
  const X = [...xs].sort((a, b) => a - b), slabs = [];
  for (let i = 0; i + 1 < X.length; i++) {
    const a = X[i], b = X[i + 1]; if (b - a < eps) continue;
    const m = (a + b) / 2, cov = holes.filter((h) => h.x0 <= m && h.x1 >= m).sort((p, q) => p.y0 - q.y0);
    const key = cov.some((h) => h.top) ? 's' + i : cov.map((h) => holes.indexOf(h)).join(',');
    const last = slabs[slabs.length - 1];
    if (last && last.key === key && Math.abs(last.b - a) < eps) last.b = b; else slabs.push({ a, b, key, cov });
  }
  const Q = (a, b, ya, yb, yc, yd) => { if (Math.max(yc - ya, yd - yb) < 1e-3) return; P.quad(mat, [a, ya, 0], [b, yb, 0], [b, yd, 0], [a, yc, 0], [0, 0, 1], [uvf(a, ya), uvf(b, yb), uvf(b, yd), uvf(a, yc)]); };
  for (const s of slabs) {
    let ca = y0, cb = y0;
    for (const h of s.cov) {
      if (h.top) { Q(s.a, s.b, ca, cb, h.y0, h.y0); ca = Math.max(ca, h.top(s.a)); cb = Math.max(cb, h.top(s.b)); }
      else { const lo = Math.max(h.y0, y0); Q(s.a, s.b, ca, cb, Math.max(lo, ca), Math.max(lo, cb)); ca = cb = Math.max(ca, h.y1); }
    }
    Q(s.a, s.b, ca, cb, y1, y1);
  }
}

/**
 * the opening of a window in the edge frame: reveals (jambs, head, sill) of material `rev` and the glass picture `glass` (an atlas row) recessed by `d`.  Box x0..x1 x y0..y1.
 */
export function windowOpen(P, rev, glass, x0, x1, y0, y1, d = 0.26) {
  P.quad(rev, [x0, y0, 0], [x0, y0, -d], [x0, y1, -d], [x0, y1, 0], [1, 0, 0]);
  P.quad(rev, [x1, y0, -d], [x1, y0, 0], [x1, y1, 0], [x1, y1, -d], [-1, 0, 0]);
  P.quad(rev, [x0, y1, 0], [x1, y1, 0], [x1, y1, -d], [x0, y1, -d], [0, -1, 0]);
  P.quad(rev, [x0, y0, -d], [x1, y0, -d], [x1, y0, 0], [x0, y0, 0], [0, 1, 0]);
  P.quad(glass, [x0, y0, -d], [x1, y0, -d], [x1, y1, -d], [x0, y1, -d], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}

/** a stone surround of width sw standing out by pr round the box x0..x1 x y0..y1 (three front quads: two jambs and the head) */
export function surround(P, mat, x0, x1, y0, y1, sw = 0.1, pr = 0.05, uvs = 1) {
  const q = (a0, a1, b0, b1) => P.quad(mat, [a0, b0, pr], [a1, b0, pr], [a1, b1, pr], [a0, b1, pr], [0, 0, 1], [[a0 / uvs, b0 / uvs], [a1 / uvs, b0 / uvs], [a1 / uvs, b1 / uvs], [a0 / uvs, b1 / uvs]]);
  q(x0 - sw, x0, y0, y1 + sw); q(x1, x1 + sw, y0, y1 + sw); q(x0, x1, y1, y1 + sw);
}
/** a round drain pipe from y0 to y1 standing out of the wall at x (edge frame), radius r, with two clamps */
export function downpipe(P, mat, x, y0, y1, r = 0.055, off = 0.09) {
  P.col(mat, x, off, y0, y1, r, r, 6, false);
  for (let y = y0 + 1.2; y < y1 - 0.4; y += 2.6) P.box(mat, x - r - 0.02, x + r + 0.02, y, y + 0.05, 0, off, 'k', 1);
}
