// landmarksLETI/c1common.js - what the files of Corpus 1 share: the role / tier of every ring edge, the edge-frame runner for both collectors, the bay layout of one facade, the pylon and the arched surround.
//   Tiers (how much is drawn): 'A' the public fronts (south front 14 / 18 / 20, west front 22 .. 32): pylons, surrounds on every window, paired ground arches;  'B' north, court and inner-court walls: reveals + sills;
//   'C' the long east back wall 38: reveals only, a pylon every ~12 m.  Special: 21 = the clock gable between the two towers, 28 = the porch block (porch.js).
//   Layout of a facade (layoutEdge): end pylons and forced pylons (the plaque positions of the OSM nodes), the gaps between them are filled with bays of ~3.7 m; a gap of more than 3 bays gets an interior pylon.
import { frameOf, localOnEdge } from './kit.js';
import { archPts } from './geo.js';
import { H } from './frame.js';

export const TIER = {};
for (let i = 0; i <= 13; i++) TIER[i] = 'B';
Object.assign(TIER, { 14: 'A', 18: 'A', 20: 'A', 22: 'A', 24: 'A', 26: 'A', 27: 'A', 29: 'A', 30: 'A', 32: 'A', 33: 'B', 35: 'B', 36: 'B', 37: 'B', 38: 'C' });
export const SPECIAL = { 21: 'gable', 28: 'porch' };
/** the profile of the maroon onion-pointed domes (unit sizes: belly radius 2.58, height 4.7), scaled per use by geo.lathe */
export const DOME = [[0, 0], [2.35, 0], [2.58, 0.28], [2.52, 0.75], [2.2, 1.45], [1.62, 2.2], [0.98, 2.9], [0.52, 3.45], [0.22, 3.95], [0.1, 4.35], [0, 4.7]];

/** run fn(len, frame) in the frame of edge e on BOTH collectors (base K.P, detail K.D) */
export function onBoth(K, e, fn) {
  const f = frameOf(e);
  K.P.push(f.x, 0, f.z, f.rot); K.D.push(f.x, 0, f.z, f.rot);
  try { return fn(f.len, f); } finally { K.D.pop(); K.P.pop(); }
}

/**
 * segments of a facade of length L: end pylons, forced pylons (centres `forced`), bays of ~pitch m between them, an interior pylon in every gap wider than `group` bays.
 * Returns { pylons: [{ x, w }], bays: [{ x0, x1, c }] }; a gap narrower than 2.4 m stays blank wall.
 */
export function layoutEdge(L, o = {}) {
  const pw = o.pw ?? 1.5, pitch = o.pitch ?? 3.7, group = o.group ?? 3, forced = (o.forced || []).filter((u) => u > pw * 1.6 && u < L - pw * 1.6).sort((a, b) => a - b);
  const centres = [];
  if (!o.noEnds) centres.push(pw / 2);
  for (const u of forced) centres.push(u);
  if (!o.noEnds) centres.push(L - pw / 2);
  const pylons = centres.map((x) => ({ x, w: pw })), bays = [];
  const start = o.noEnds ? 0 : pw, end = o.noEnds ? L : L - pw;
  const edges = [start, ...forced.flatMap((u) => [u - pw / 2, u + pw / 2]), end];
  for (let i = 0; i + 1 < edges.length; i += 2) {
    const a = edges[i], b = edges[i + 1], g = b - a;
    if (g < 2.4) continue;
    const nb = Math.max(1, Math.round(g / pitch)), ng = Math.ceil(nb / group);
    if (ng <= 1) { for (let k = 0; k < nb; k++) bays.push({ x0: a + g * k / nb, x1: a + g * (k + 1) / nb, c: a + g * (k + 0.5) / nb }); continue; }
    // interior pylons: split the gap in ng groups separated by pylons of width pw
    const gw = (g - (ng - 1) * pw) / ng;
    let x = a;
    for (let q = 0; q < ng; q++) {
      const nq = Math.max(1, Math.round(gw / pitch));
      for (let k = 0; k < nq; k++) bays.push({ x0: x + gw * k / nq, x1: x + gw * (k + 1) / nq, c: x + gw * (k + 0.5) / nq });
      x += gw;
      if (q < ng - 1) { pylons.push({ x: x + pw / 2, w: pw }); x += pw; }
    }
  }
  pylons.sort((p, q) => p.x - q.x);
  return { pylons, bays };
}

/** the U path of an arched opening (bottom left up, over the arc, bottom right) offset outwards by d: points [x, y] */
export function uPath(cx, y0, w, hTotal, n, d = 0) {
  const r = w / 2 + d, hs = Math.max(0.01, hTotal - w / 2), pts = [[cx - r, y0], [cx - r, y0 + hs]];
  for (let i = 1; i < n; i++) { const a = Math.PI - Math.PI * i / n; pts.push([cx + Math.cos(a) * r, y0 + hs + Math.sin(a) * r]); }
  pts.push([cx + r, y0 + hs], [cx + r, y0]);
  return pts;
}

/** a flat arched surround: the front strip between the opening and the outline `sw` wider (at z = proud), with its outer and inner side strips back to the wall; facade frame, z out */
export function archRing(P, mat, cx, y0, w, hTotal, sw, proud, n = 8, uvs = 1.2) {
  const inner = uPath(cx, y0, w, hTotal, n, 0), outer = uPath(cx, y0, w, hTotal + sw, n, sw), cyc = y0 + Math.max(0.01, hTotal - w / 2);
  for (let i = 0; i + 1 < inner.length; i++) {
    const a = inner[i], b = inner[i + 1], c = outer[i + 1], d = outer[i];
    P.quad(mat, [a[0], a[1], proud], [b[0], b[1], proud], [c[0], c[1], proud], [d[0], d[1], proud], [0, 0, 1], [[a[0] / uvs, a[1] / uvs], [b[0] / uvs, b[1] / uvs], [c[0] / uvs, c[1] / uvs], [d[0] / uvs, d[1] / uvs]]);
    const nx = c[1] - d[1], ny = -(c[0] - d[0]), fl = nx * ((d[0] + c[0]) / 2 - cx) + ny * ((d[1] + c[1]) / 2 - cyc) < 0 ? -1 : 1;
    P.quad(mat, [d[0], d[1], 0], [c[0], c[1], 0], [c[0], c[1], proud], [d[0], d[1], proud], [nx * fl, ny * fl, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    if (i > 0 && i < inner.length - 2) {                                                                  // the reveal side of the surround (the straight jambs are covered by the wall reveal)
      const mx = (a[0] + b[0]) / 2 - cx, my = (a[1] + b[1]) / 2 - cyc;
      P.quad(mat, [a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], proud], [a[0], a[1], proud], [-mx, -my, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
  }
}

/** one pylon of a facade (drawn on the detail collector in the facade frame): a stepped shaft of stucco, proud `pr`, from the plinth to the cornice, caps at the string courses and a block capital */
export function pylon(D, M, x, w = 1.5, pr = 0.5, top = H.wall) {
  const x0 = x - w / 2, x1 = x + w / 2;
  D.box(M.stucco, x0, x1, H.plinth - 0.05, H.str1, 0, pr, 'kb', 2.4);
  D.box(M.stucco, x0 - 0.08, x1 + 0.08, H.str1, H.str1 + 0.35, 0, pr + 0.1, 'kb', 2.4);                    // the stone cap over the ground floor
  D.box(M.stucco, x0 + 0.04, x1 - 0.04, H.str1 + 0.35, top - 0.7, 0, pr - 0.05, 'kb', 2.4);
  D.box(M.stucco, x0 - 0.1, x1 + 0.1, top - 0.7, top, 0, pr + 0.14, 'kb', 2.4);                               // the capital block under the cornice
}
export { frameOf, localOnEdge };
