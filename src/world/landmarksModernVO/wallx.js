// landmarksModernVO/wallx.js - the WINDOWED WALL of the module: a wall piece drawn in the current Parts frame (local +x along the wall to the right as seen from outside, y up, +z out) as
// horizontal slabs between the band boundaries and the window edges, so every window is a REAL opening (reveals + a set-back glass sheet) without any polygon-with-holes triangulation.
//   winWall(P, { x0, x1, z, bands: [{ y0, y1, mat, tu, tv }], wins: [window..], reveal: mat, depth })
//     band    contiguous vertical zones of the wall with their own material (granite base, tile wall, frieze ...); uv are ABSOLUTE metres / (tu, tv), so the texture runs on through all slabs.
//     window  { x (centre), y (sill), w, h (total height incl. the head), head: 'flat' | 'arch' | 'seg' | 'point' | 'round', rise, glass: mat, reveal: mat, sillMat: mat, depth,
//               trim: { mat, t (frame width), proud, top, bot }   a flat frame ring in front of the opening (round-headed for arch / point heads)
//               hood: { mat, w, h }   a pedimental hood (flat triangle) above the head;  n: arc segments }
//   spandrels of round / segmental / pointed heads are filled with the wall material; the bounding box of every window is cut out of the slabs first.
// Also: pointC / roundC contours, loft() (quads between rings: towers, cones, bay roofs), quadFace() (a flat polygon with absolute uv), beltBox(), shaft().
import * as THREE from 'three';
import { rectC, archC, segC } from './wall.js';

export { rectC, archC, segC };

/** pointed (Gothic) arch opening: straight sides to y0 + h - rise, two circular arcs to the apex (equilateral when rise = 0.866 w) */
export function pointC(cx, y0, w, h, rise, n = 6) {
  rise = Math.min(rise ?? w * 0.866, h * 0.8); const ys = y0 + h - rise, c = (rise * rise - w * w / 4) / w, R = Math.max(0.05, w / 2 + c), a1 = Math.atan2(rise, c);
  const pts = [[cx - w / 2, y0], [cx + w / 2, y0], [cx + w / 2, ys]];
  for (let i = 1; i < n; i++) { const a = a1 * i / n; pts.push([cx - c + Math.cos(a) * R, ys + Math.sin(a) * R]); }
  pts.push([cx, ys + rise]);
  for (let i = n - 1; i >= 1; i--) { const a = a1 * i / n; pts.push([cx + c - Math.cos(a) * R, ys + Math.sin(a) * R]); }
  pts.push([cx - w / 2, ys]); return pts;
}
/** a circle as an opening (counter clockwise) */
export function roundC(cx, cy, r, n = 14) { return Array.from({ length: n }, (_, i) => { const a = Math.PI * 2 * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }); }

const contourOf = (w) => {
  // round heads: the arc is cut into more chords for wider openings (review 2026-10-09: 8 chords on a 1.2 m window were visible as facets from 2-3 m); an explicit w.n always wins
  const n = Math.max(w.n || 0, w.head === 'arch' ? Math.min(20, Math.max(8, Math.round(w.w * 8))) : 8);
  switch (w.head) {
    case 'arch': return archC(w.x, w.y, w.w, w.h, n);
    case 'seg': return segC(w.x, w.y, w.w, w.h, w.rise ?? w.w * 0.12, n);
    case 'point': return pointC(w.x, w.y, w.w, w.h, w.rise, Math.max(3, n >> 1));
    case 'round': return roundC(w.x, w.y + w.h / 2, Math.min(w.w, w.h) / 2, Math.max(10, n + 4));
    default: return rectC(w.x, w.y, w.w, w.h);
  }
};
/** y where the head begins (springing line) */
const springY = (w) => (w.head === 'arch' ? w.y + w.h - w.w / 2 : w.head === 'seg' ? w.y + w.h - (w.rise ?? w.w * 0.12) : w.head === 'point' ? w.y + w.h - Math.min(w.rise ?? w.w * 0.866, w.h * 0.8) : w.head === 'round' ? w.y : w.y + w.h);

/** a flat polygon [[x, y]..] (any winding, simple) in the wall plane z, facing +z, uv = (x / tu, y / tv) */
export function quadFace(P, mat, pts, z, tu = 1, tv = tu) {
  const p = pts.filter((q, i) => { const r = pts[(i + 1) % pts.length]; return Math.hypot(q[0] - r[0], q[1] - r[1]) > 1e-5; });
  if (p.length < 3) return;
  const g = new THREE.ShapeGeometry(new THREE.Shape(p.map((q) => new THREE.Vector2(q[0], q[1]))), 4), ua = g.attributes.uv, pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) ua.setXY(i, pa.getX(i) / tu, pa.getY(i) / tv);
  P.geo(mat, g, 0, 0, z); g.dispose();
}

function reveals(P, c, z0, zb, rv) {
  const n = c.length; let cx = 0, cy = 0; for (const p of c) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
  for (let i = 0; i < n; i++) {
    const a = c[i], b = c[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; if (nx * (cx - mx) + ny * (cy - my) < 0) { nx = -nx; ny = -ny; }
    const l = Math.hypot(nx, ny) || 1;
    P.quad(rv, [a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], zb], [a[0], a[1], zb], [nx / l, ny / l, 0]);
  }
}

/** the flat frame ring (and sill / hood) of a window in front of the wall plane z */
function trimOf(P, w, z, c) {
  const T = w.trim, t = T.t ?? 0.12, pr = T.proud ?? 0.04, top = T.top ?? t, bot = T.bot ?? t, zz = z + pr, mat = T.mat;
  const x0 = w.x - w.w / 2, x1 = w.x + w.w / 2, y0 = w.y, ys = springY(w);
  const q = (a, b, cc, d) => P.quad(mat, a, b, cc, d, [0, 0, 1]);
  if (w.head === 'flat' || !w.head) {
    q([x0 - t, y0 - bot, zz], [x1 + t, y0 - bot, zz], [x1 + t, y0, zz], [x0 - t, y0, zz]);
    q([x0 - t, y0, zz], [x0, y0, zz], [x0, y0 + w.h, zz], [x0 - t, y0 + w.h, zz]);
    q([x1, y0, zz], [x1 + t, y0, zz], [x1 + t, y0 + w.h, zz], [x1, y0 + w.h, zz]);
    q([x0 - t, y0 + w.h, zz], [x1 + t, y0 + w.h, zz], [x1 + t, y0 + w.h + top, zz], [x0 - t, y0 + w.h + top, zz]);
  } else if (w.head === 'round') {
    const r = Math.min(w.w, w.h) / 2, cx = w.x, cy = w.y + w.h / 2, n = 12;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI * 2 * i / n, a1 = Math.PI * 2 * (i + 1) / n;
      q([cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, zz], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, zz], [cx + Math.cos(a1) * (r + t), cy + Math.sin(a1) * (r + t), zz], [cx + Math.cos(a0) * (r + t), cy + Math.sin(a0) * (r + t), zz]);
    }
  } else {
    // arch / seg / point heads: the legs up to the springing line, a sill, and the ring along the head (offset outwards by t)
    q([x0 - t, y0 - bot, zz], [x1 + t, y0 - bot, zz], [x1 + t, y0, zz], [x0 - t, y0, zz]);
    q([x0 - t, y0, zz], [x0, y0, zz], [x0, ys, zz], [x0 - t, ys, zz]);
    q([x1, y0, zz], [x1 + t, y0, zz], [x1 + t, ys, zz], [x1, ys, zz]);
    const H = c.slice(2);                                                       // right spring, arc..., left spring
    const cxh = w.x, cyh = ys;
    for (let i = 0; i + 1 < H.length; i++) {
      const A = H[i], B = H[i + 1];
      const off = (p) => { const dx = p[0] - cxh, dy = p[1] - cyh, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * t, p[1] + dy / l * t]; };
      const A2 = off(A), B2 = off(B);
      q([A[0], A[1], zz], [B[0], B[1], zz], [B2[0], B2[1], zz], [A2[0], A2[1], zz]);
    }
  }
  if (w.sill) { const S = w.sill; P.box(S.mat || mat, x0 - (S.ext ?? 0.12), x1 + (S.ext ?? 0.12), y0 - (S.h ?? 0.1), y0, z - 0.02, z + (S.d ?? 0.16), 'bk', 1); }
}

/** the wall piece. See the header. Returns nothing (P.tris counts). */
export function winWall(P, o) {
  const x0 = o.x0, x1 = o.x1, z = o.z || 0, bands = o.bands, depth0 = o.depth ?? 0.22;
  const wins = (o.wins || []).filter((w) => w.x + w.w / 2 > x0 + 1e-4 && w.x - w.w / 2 < x1 - 1e-4);
  if (typeof process !== 'undefined' && process.env && process.env.MVO_DEBUG) {                       // debug: overlapping openings of one wall piece (coplanar reveals z-fight)
    for (let i = 0; i < wins.length; i++) for (let j = i + 1; j < wins.length; j++) {
      const a = wins[i], b = wins[j];
      if (a.x - a.w / 2 < b.x + b.w / 2 - 0.02 && b.x - b.w / 2 < a.x + a.w / 2 - 0.02 && a.y < b.y + b.h - 0.02 && b.y < a.y + a.h - 0.02) console.warn(`[landmarksModernVO] overlapping windows at x ${a.x.toFixed(1)}/${b.x.toFixed(1)}, y ${a.y.toFixed(1)}/${b.y.toFixed(1)} (wall ${x0.toFixed(1)}..${x1.toFixed(1)})`);
    }
  }
  const ymin = bands[0].y0, ymax = bands[bands.length - 1].y1;
  const set = new Set([ymin, ymax]); for (const b of bands) { set.add(b.y0); set.add(b.y1); }
  for (const w of wins) { if (w.y > ymin) set.add(w.y); if (w.y + w.h < ymax) set.add(w.y + w.h); }
  const ys = [...set].filter((y) => y >= ymin - 1e-6 && y <= ymax + 1e-6).sort((a, b) => a - b);
  const bandAt = (y) => bands.find((b) => y >= b.y0 - 1e-6 && y <= b.y1 + 1e-6);
  const slab = (xa, xb, ya, yb, bd) => {
    if (xb - xa < 1e-3) return;
    const tu = bd.tu ?? 3, tv = bd.tv ?? tu;
    P.quad(bd.mat, [xa, ya, z], [xb, ya, z], [xb, yb, z], [xa, yb, z], [0, 0, 1], [[xa / tu, ya / tv], [xb / tu, ya / tv], [xb / tu, yb / tv], [xa / tu, yb / tv]]);
  };
  for (let i = 0; i + 1 < ys.length; i++) {
    const ya = ys[i], yb = ys[i + 1]; if (yb - ya < 1e-4) continue;
    const bd = bandAt((ya + yb) / 2); if (!bd) continue;
    const opens = wins.filter((w) => w.y <= ya + 1e-4 && w.y + w.h >= yb - 1e-4).map((w) => [Math.max(x0, w.x - w.w / 2), Math.min(x1, w.x + w.w / 2)]).sort((a, b) => a[0] - b[0]);
    let cx = x0;
    for (const [a, b] of opens) { if (a > cx + 1e-4) slab(cx, a, ya, yb, bd); cx = Math.max(cx, b); }
    if (cx < x1 - 1e-4) slab(cx, x1, ya, yb, bd);
  }
  for (const w of wins) {
    const c = contourOf(w), d = w.depth ?? depth0, zb = z - d, rv = w.reveal || o.reveal, gl = w.glass || o.glass;
    const bd = bandAt(w.y + w.h - 0.01) || bands[0], tu = bd.tu ?? 3, tv = bd.tv ?? tu;
    // spandrels of the head
    if (w.head && w.head !== 'flat' && w.head !== 'round') {
      const H = c.slice(2), yt = w.y + w.h, xl = w.x - w.w / 2, xr = w.x + w.w / 2;
      let ia = 0; for (let k = 0; k < H.length; k++) if (H[k][1] > H[ia][1] + 1e-6) ia = k;
      let ib = ia; for (let k = H.length - 1; k >= 0; k--) if (H[k][1] >= H[ia][1] - 1e-6) { ib = k; break; }
      const right = [H[0], [xr, yt], [(H[ia][0]), yt]]; for (let k = ia; k >= 1; k--) right.push(H[k]);
      const left = [H[H.length - 1], [(H[ib][0]), yt]]; left.splice(1, 0, [xl, yt]); for (let k = ib; k <= H.length - 2; k++) left.push(H[k]);
      if (w.head === 'seg' || ia === ib) { /* single apex or flat top: the same polygons */ }
      quadFace(P, bd.mat, right.map((p) => [Math.min(xr, Math.max(w.x, p[0])), p[1]]), z, tu, tv);
      quadFace(P, bd.mat, left.map((p) => [Math.max(xl, Math.min(w.x, p[0])), p[1]]), z, tu, tv);
    }
    if (rv) reveals(P, c, z, zb, rv);
    if (w.sillMat) { const x0w = w.x - w.w / 2, x1w = w.x + w.w / 2; P.quad(w.sillMat, [x0w, w.y, z], [x1w, w.y, z], [x1w, w.y, zb], [x0w, w.y, zb], [0, 1, 0]); }
    if (gl) { const bx0 = w.x - w.w / 2, by0 = w.y; P.fan(gl, c.map((p) => [p[0], p[1], zb]), [0, 0, 1], (p) => [(p[0] - bx0) / w.w, (p[1] - by0) / w.h]); }
    if (w.trim) trimOf(P, w, z, c);
    if (w.hood) { const hd = w.hood, hw = (hd.w ?? w.w + 0.5) / 2, yt = w.y + w.h + (w.trim ? (w.trim.top ?? w.trim.t ?? 0.12) : 0); P.fan(hd.mat, [[w.x - hw, yt, z + 0.05], [w.x + hw, yt, z + 0.05], [w.x, yt + (hd.h ?? 0.45), z + 0.05]], [0, 0, 1]); }
  }
}

// ------------------------------------------------------------------------------------------------ small solids
/** a box between two x positions standing off the wall plane z0: y0..y1, projecting `proud` (back and bottom faces skipped) */
export function beltBox(P, mat, x0, x1, y0, y1, z0, proud, uvs = 2, skip = 'bk') { P.box(mat, x0, x1, y0, y1, z0, z0 + proud, skip, uvs); }

/**
 * Quads between consecutive rings (arrays of [x, y, z] of equal length); the ring order is counter-clockwise seen from above; `mats` one material or a function (i) -> material (per ring step);
 * the winding follows the outward direction from the vertical axis through `ax` ([x, z], default the ring centre). caps: 'top' / 'bot' / 'both' fills the end rings.
 */
export function loft(P, mat, rings, o = {}) {
  const n = rings[0].length, c0 = o.ax || [rings[0].reduce((s, p) => s + p[0], 0) / n, rings[0].reduce((s, p) => s + p[2], 0) / n];
  const uRep = o.uRep ?? 1, vTile = o.vTile ?? 1;
  for (let r = 0; r + 1 < rings.length; r++) {
    const A = rings[r], B = rings[r + 1], m = typeof mat === 'function' ? mat(r) : mat;
    for (let i = 0; i < (o.open ? n - 1 : n); i++) {
      const j = (i + 1) % n;
      const mx = (A[i][0] + A[j][0] + B[i][0] + B[j][0]) / 4 - c0[0], mz = (A[i][2] + A[j][2] + B[i][2] + B[j][2]) / 4 - c0[1];
      const u0 = uRep * i / n, u1 = uRep * (i + 1) / n, v0 = A[i][1] / vTile, v1 = B[i][1] / vTile;
      if (B[i][0] === B[j][0] && B[i][1] === B[j][1] && B[i][2] === B[j][2]) P.fan(m, [A[i], A[j], B[i]], [mx, 0.2, mz], () => [0, 0]);   // an apex: a triangle
      else if (A[i][0] === A[j][0] && A[i][1] === A[j][1] && A[i][2] === A[j][2]) P.fan(m, [A[i], B[j], B[i]], [mx, 0.2, mz], () => [0, 0]);
      else P.quad(m, A[i], A[j], B[j], B[i], [mx, 0.2, mz], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
    }
  }
  const cap = (ring, up, m) => { if (m) P.fan(m, ring, [0, up ? 1 : -1, 0], (p) => [p[0] / 2, p[2] / 2]); };
  if (o.capTop) cap(rings[rings.length - 1], true, o.capTop);
  if (o.capBot) cap(rings[0], false, o.capBot);
}
/** a regular n-gon ring at height y around (cx, cz), circumradius r, first vertex at angle a0 (x = sin, z = cos), counter-clockwise from above is the sin / cos order reversed: returned in the order of loft() */
export function ngonRing(n, r, y, cx = 0, cz = 0, a0 = 0) { return Array.from({ length: n }, (_, i) => { const a = a0 - Math.PI * 2 * i / n; return [cx + Math.sin(a) * r, y, cz + Math.cos(a) * r]; }); }
