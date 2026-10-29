// landmarksSevkabel/facade.js - wall-with-openings generator for the brick / stucco buildings of the module (windowWall is a COPY of landmarksNavalCorps/facade.js; modules never import each other).
// Everything is drawn in the CURRENT Parts frame of a wall: local +x runs along the wall to the right as seen from outside, y is up, +z points OUT of the wall (kit.js onEdge / frameOf).
//   windowWall(P, o)  a wall field x0..x1, y0..y1 at depth z0 with rectangular openings: the field is cut into horizontal slabs at every opening edge, so the wall has real reveals (0.2 m) and the sashes sit back
//                     in the opening; the wall material changes at `baseTop` (rustication / plinth below).  Openings: { x, w, y0, y1, glass (material), kind }.
//   bayWall(P, e, o)  a whole footprint edge: windows on a regular pitch per floor (centred, margins at the corners), one call per edge.
//   cornice(P, poly, y, mats)  a mitred corbelled cornice round a footprint (stepped boxes), friezes (string courses) and plinths are the same call with other numbers.
import { onEdge, band, ringEdges } from './kit.js';

const EPS = 1e-6;
function mergeIv(iv) {
  iv.sort((p, q) => p[0] - q[0]);
  const out = [];
  for (const s of iv) { const l = out[out.length - 1]; if (l && s[0] <= l[1] + EPS) l[1] = Math.max(l[1], s[1]); else out.push([s[0], s[1]]); }
  return out;
}

/** o: { x0, x1, y0, y1, z0, tu, tv, base, baseTop, wall, reveal, depth, ops: [{ x, w, y0, y1, glass, glassUv, kind }] }; returns the triangle count added */
export function windowWall(P, o) {
  const t0 = P.tris, z0 = o.z0 || 0, depth = o.depth ?? 0.2, ops = o.ops || [], tu = o.tu || 4, tv = o.tv || 4, y0 = o.y0 || 0;
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
    const xa = p.x - p.w / 2, xb = p.x + p.w / 2, zb = z0 - (p.depth ?? depth);
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

/**
 * A whole footprint edge e (kit.ringEdges) as a wall with regular window bays.
 *   o.y0 / o.y1   wall bottom / top (default 0 / o.top);   o.wall / o.base / o.baseTop   materials (base below baseTop);  o.tu / o.tv   texture metres;
 *   o.pitch       target window pitch (m): n = round((len - 2 margin) / pitch) windows per floor, evenly spread;   o.margin   free wall at both ends (default pitch * 0.7)
 *   o.floors      [{ y0, y1, w, h, sill, glass, kind, skip: (i, n) => bool }]  window rect = y0 + sill .. y0 + sill + h (floor = the storey, only used to place the window);   o.reveal / o.depth
 *   o.extra       additional ops [{ x, w, y0, y1, glass }] (doors, shop windows) in the edge frame
 * returns the triangle count.
 */
export function bayWall(P, e, o) {
  return onEdge(P, e, (len) => {
    const pitch = o.pitch || 3.0, margin = o.margin ?? pitch * 0.7;
    const n = Math.max(1, Math.round((len - 2 * margin) / pitch)), step = (len - 2 * margin) / n;
    const ops = [];
    for (const f of o.floors || []) {
      const w = f.w || 1.2;
      for (let i = 0; i < n; i++) {
        if (f.skip && f.skip(i, n)) continue;
        const x = margin + (i + 0.5) * step;
        ops.push({ x, w, y0: f.y0 + (f.sill ?? 0.9), y1: f.y0 + (f.sill ?? 0.9) + (f.h || 2.0), glass: f.glass, glassUv: f.glassUv, kind: f.kind });
      }
    }
    for (const x of o.extra || []) ops.push(x);
    return windowWall(P, { x0: 0, x1: len, y0: o.y0 || 0, y1: o.y1, z0: 0, tu: o.tu || 4, tv: o.tv || 4, base: o.base, baseTop: o.baseTop, wall: o.wall, reveal: o.reveal, depth: o.depth ?? 0.2, ops });
  });
}

/** a stepped cornice (three mitred bands: frieze, corbel course, corona) round a footprint ring: top y of the wall, mats { front, top, under }, depth d of the corona; returns nothing */
export function cornice(P, poly, y, mats, d = 0.45, h = 1.0) {
  const ed = ringEdges(poly);
  band(P, ed, y - h, y - h * 0.6, d * 0.4, mats);
  band(P, ed, y - h * 0.6, y - h * 0.25, d * 0.7, mats);
  band(P, ed, y - h * 0.25, y, d, mats);
}
/** a plain mitred band (string course / plinth cap / coping) */
export function stringCourse(P, poly, y0, y1, d, mats) { band(P, ringEdges(poly), y0, y1, d, mats); }
