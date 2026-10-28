// landmarksNavalCorps/facade.js - wall-with-openings generator and the small trim pieces shared by the Corps and the church house (docs/research/navalcorps.md 4.2 / 4.3).
// Everything is drawn in the CURRENT Parts frame of a wall: local +x runs along the wall to the right as seen from outside, y is up, +z points OUT of the wall (kit.js onEdge / frameOf).
//   windowWall(P, o)  a wall field x0..x1, y0..y1 at depth z0 with rectangular openings: the field is cut into horizontal slabs at every opening edge, so the wall has real reveals (0.22 m) and the sashes sit
//                     back in the opening; the wall material changes at `baseTop` (rustication below, stucco above).  Openings: { x, w, y0, y1, glass (material), kind }.
//   hood(P, mat, cx, y, w)  the white hood (sandrik) over a first-floor window: flat lintel with a segmental top and a keystone.
//   corniceBox(P, mat, x0, x1, z0, y0)  the three-step main cornice (architrave band, frieze, corona), crown at y0 + 1.2, projecting 0.9 m.
import * as THREE from 'three';

const EPS = 1e-6;

/** merge intervals [a, b] (sorted by a) */
function mergeIv(iv) {
  iv.sort((p, q) => p[0] - q[0]);
  const out = [];
  for (const s of iv) { const l = out[out.length - 1]; if (l && s[0] <= l[1] + EPS) l[1] = Math.max(l[1], s[1]); else out.push([s[0], s[1]]); }
  return out;
}

/**
 * o: { x0, x1, y0 = 0, y1, z0 = 0, tu = 4, tv = 4, base: material below baseTop, baseTop, wall: material above, reveal: material of the reveals, depth = 0.22, ops: [{ x, w, y0, y1, glass, glassUv, kind }] }
 * returns the triangle count added
 */
export function windowWall(P, o) {
  const t0 = P.tris, z0 = o.z0 || 0, depth = o.depth ?? 0.22, ops = o.ops || [], tu = o.tu || 4, tv = o.tv || 4, y0 = o.y0 || 0;
  const ys = new Set([y0, o.y1]); if (o.baseTop != null) ys.add(o.baseTop);
  for (const p of ops) { ys.add(p.y0); ys.add(p.y1); }
  const Y = [...ys].filter((y) => y >= y0 - EPS && y <= o.y1 + EPS).sort((a, b) => a - b);
  const field = (mat, xa, xb, ya, yb) => {
    if (xb - xa < 0.01 || yb - ya < 0.01) return;
    P.quad(mat, [xa, ya, z0], [xb, ya, z0], [xb, yb, z0], [xa, yb, z0], [0, 0, 1], [[xa / tu, ya / tv], [xb / tu, ya / tv], [xb / tu, yb / tv], [xa / tu, yb / tv]]);
  };
  for (let i = 0; i + 1 < Y.length; i++) {
    const ya = Y[i], yb = Y[i + 1];
    if (yb - ya < 0.01) continue;
    const mat = o.baseTop != null && yb <= o.baseTop + EPS ? o.base : o.wall;
    const cover = mergeIv(ops.filter((p) => p.y0 <= ya + EPS && p.y1 >= yb - EPS).map((p) => [p.x - p.w / 2, p.x + p.w / 2]));
    let x = o.x0;
    for (const [a, b] of cover) { field(mat, x, Math.min(a, o.x1), ya, yb); x = Math.max(x, b); }
    field(mat, x, o.x1, ya, yb);
  }
  const rv = o.reveal;
  for (const p of ops) {
    const xa = p.x - p.w / 2, xb = p.x + p.w / 2, zb = z0 - depth;
    if (rv) {
      P.quad(rv, [xa, p.y0, z0], [xa, p.y0, zb], [xa, p.y1, zb], [xa, p.y1, z0], [1, 0, 0]);
      P.quad(rv, [xb, p.y0, zb], [xb, p.y0, z0], [xb, p.y1, z0], [xb, p.y1, zb], [-1, 0, 0]);
      P.quad(rv, [xa, p.y1, zb], [xb, p.y1, zb], [xb, p.y1, z0], [xa, p.y1, z0], [0, -1, 0]);
      if (p.kind !== 'door') P.quad(rv, [xa, p.y0, z0], [xb, p.y0, z0], [xb, p.y0, zb], [xa, p.y0, zb], [0, 1, 0]);
    }
    if (p.glass) P.quad(p.glass, [xa, p.y0, zb], [xb, p.y0, zb], [xb, p.y1, zb], [xa, p.y1, zb], [0, 0, 1], p.glassUv || [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  return P.tris - t0;
}

/** shapes cached by size */
const _shapes = new Map();
function hoodShape(w) {
  const k = Math.round(w * 100); let s = _shapes.get(k);
  if (!s) {
    s = new THREE.Shape(); const h = w / 2;
    s.moveTo(-h, 0); s.lineTo(h, 0); s.lineTo(h, 0.3); s.quadraticCurveTo(0, 0.8, -h, 0.3); s.lineTo(-h, 0); _shapes.set(k, s);
  }
  return s;
}
/** the hood of a first-floor window: base at y (just above the head), centre cx, width w, relief 0.14 m in front of the wall plane at z */
export function hood(P, mat, cx, y, w = 1.5, z = 0) {
  P.push(cx, y, 0, 0);
  P.extrude(mat, hoodShape(w), z, 0.14, 1, 4);
  P.box(mat, -0.07, 0.07, 0.34, 0.5, z + 0.0, z + 0.17, 'bk', 1);                 // the keystone
  P.pop();
}

/** the main cornice of a wall piece: three stepped boxes (architrave band, frieze with the modillion row, corona), crown at yb + 1.2; x0..x1 at the wall plane z0, projecting up to 0.9 m */
export function corniceBox(P, mat, shade, x0, x1, z0, yb, e0 = 0.3, e1 = 0.3) {
  P.box(mat, x0 - e0 / 3, x1 + e1 / 3, yb, yb + 0.4, z0, z0 + 0.45, 'bk', 2);
  P.box(shade, x0 - e0 / 2, x1 + e1 / 2, yb + 0.4, yb + 0.72, z0, z0 + 0.4, 'bk', 2);
  P.box(mat, x0 - e0, x1 + e1, yb + 0.72, yb + 1.2, z0, z0 + 0.9, 'bk', 2);
  // the row of small modillion blocks under the corona
  const n = Math.max(1, Math.floor((x1 - x0) / 0.7));
  for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * (x1 - x0) / n; P.box(mat, x - 0.11, x + 0.11, yb + 0.5, yb + 0.76, z0 + 0.38, z0 + 0.66, 'bk', 1); }
}

/** a round downpipe (yellow-cream) from y1 down to y0 at x, standing off the wall z */
export function pipe(P, mat, x, y0, y1, z = 0.08, r = 0.06) { P.cyl(mat, [x, y1, z], [x, y0, z], r, r, 6, false); P.cyl(mat, [x, y0 + 0.3, z], [x, y0, z + 0.12], r, r, 6, false); }

/** a flat panel (plaque etc.) on a wall at (x, yc), w x h, on top of the wall by `lift` m; faces +z; uv 0..1 */
export function panel(P, mat, x, yc, w, h, z = 0.02) {
  P.quad(mat, [x - w / 2, yc - h / 2, z], [x + w / 2, yc - h / 2, z], [x + w / 2, yc + h / 2, z], [x - w / 2, yc + h / 2, z], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}
