// landmarksKronverk/house.js - the generic house builder of the module (the technique of landmarksFortress/buildings.js): one textured quad per footprint edge (a bay per u unit, v over the wall height:
// mats.js M.fac / M.bay), a mitred cornice band, an inset hip roof (sloped ring + flat ridge cap; works for L / U shapes and courtyards) or a flat roof behind a parapet, thin wall colliders.
//   walls(K, poly, H, matOf, o)   - the wall quads of a footprint; matOf(edge, index) -> { mat, bay } | material (bay from mat.userData.bay) | null (skip the edge)
//   hipRoof(K, mat, ring, holes, yE, d, rise, over) / flatRoof(K, mat, ring, holes, y)
//   house(K, rec, style, o)       - all of it for a baked building record; style = { H, bay, mat | fac: {...M.fac options}, trim, roof: material key, rise, flat, parapet }
import { ringEdges, onEdge, band } from './kit.js';
import { addPolyColliders } from '../lib/massing.js';
import { pairs, offsetRing, ringArea, simplify, inRing } from './frame.js';

export function walls(K, poly, H, matOf, o = {}) {
  const { P, M } = K, y0 = o.y0 || 0;
  const edges = ringEdges(poly, 0.15);
  edges.forEach((e, i) => {
    let s = matOf(e, i); if (!s) return;
    if (s.isMaterial) s = { mat: s, bay: s.userData.bay || 4 };
    onEdge(P, e, (len) => {
      if (len < s.bay * 0.55 && s.plain !== false) { const pm = s.plainMat || o.plain || M.brickT; P.quad(pm, [0, y0, 0], [len, y0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, y0 / 2], [len / 2, y0 / 2], [len / 2, H / 2], [0, H / 2]]); return; }
      const nb = Math.max(1, Math.round(len / s.bay));
      P.quad(s.mat, [0, y0, 0], [len, y0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [nb, 0], [nb, 1], [0, 1]]);
    });
  });
  return edges;
}

/** inset hip roof over a polygon: eaves at yE (overhang `over`), ridge ring d inside, rise; holes = courtyards (the roof falls to them too). Returns the ridge ring. */
export function hipRoof(K, mat, o, holes, yE, d, rise, over = 0.4) {
  const P = K.P, ring = simplify(o), hs = holes.map((h) => simplify(h));
  const eav = offsetRing(ring, over), rid = offsetRing(ring, -d), heav = hs.map((h) => offsetRing(h, -over)), hrid = hs.map((h) => offsetRing(h, d));
  const slope = (A, B, n) => { for (let i = 0; i < A.length; i++) { const j = (i + 1) % A.length, a = A[i], b = A[j], c = B[j], e = B[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.02) continue; P.quad(mat, [a[0], yE, a[1]], [b[0], yE, b[1]], [c[0], yE + rise, c[1]], [e[0], yE + rise, e[1]], [n * (b[1] - a[1]) / l * 0.4, 0.9, -n * (b[0] - a[0]) / l * 0.4], [[0, 0], [l / 2.4, 0], [l / 2.4, (d + over) / 2.4], [0, (d + over) / 2.4]]); } };
  const sg = ringArea(ring) > 0 ? 1 : -1;
  slope(eav, rid, sg); hs.forEach((h, k) => slope(heav[k], hrid[k], ringArea(h) > 0 ? 1 : -1));
  const okHoles = hrid.every((h) => h.every((q) => inRing(rid, q[0], q[1])));
  try { if (okHoles) P.cap(mat, rid, yE + rise, true, 2.4, hrid); else P.cap(mat, rid, yE + rise, true, 2.4, []); } catch (e) { /* a degenerate ridge ring: the sloped ring alone closes the roof well enough */ }
  return rid;
}
export function flatRoof(K, mat, ring, holes, y) { try { K.P.cap(mat, ring, y, true, 2.4, holes); } catch (e) { /* degenerate ring */ } }

/**
 * A whole house on a baked record.  style: { H, bay, mat (a bay material) | fac (M.fac options without key / H / bay), key, trim (hex), roof ('roofZinc' ...), rise, roofD, flat (true = flat roof at H - parapet),
 * parapet (m, with flat), cornice (projection m, default 0.38), chimneys (bool) }.  o: { H, mat, noRoof, noCollide, matOf (edge -> override) }.  Returns { H, edges }.
 */
export function house(K, rec, style, o = {}) {
  const { P, M, ctx } = K, s = style, H = o.H || s.H;
  const mat = o.mat || s.mat || M.fac({ key: s.key, H: s.H, bay: s.bay, ...s.fac });
  const trim = M.col(s.trim || '#efeadc'), bay = s.bay || mat.userData.bay || 4;
  let edgesAll = [];
  for (const poly of rec.polys) {
    const edges = walls(K, poly, H, (e, i) => (o.matOf && o.matOf(e, i)) || { mat, bay, plainMat: s.plain || M.col(s.wall || (s.fac && s.fac.wall) || '#c9c2b2') });
    edgesAll = edgesAll.concat(edges);
    const cz = s.cornice ?? 0.38;
    if (cz > 0) band(P, edges.filter((e) => !e.hole), H - 0.25, H + 0.12, cz, { front: trim, top: trim, under: M.underside });
    const ring = pairs(poly.o), holes = poly.h.map(pairs), area = Math.abs(ringArea(ring)) - holes.reduce((a, h) => a + Math.abs(ringArea(h)), 0);
    let per = 0; for (const e of edges) per += e.len;
    if (!o.noRoof) {
      const rm = M[s.roof] || M.roofZinc;
      if (s.flat) {
        const pp = s.parapet ?? 0.6;
        flatRoof(K, rm, ring, holes, H - pp);
        // the inner faces of the parapet
        for (const e of edges) onEdge(P, e, (len) => { P.quad(M.underside, [len, H - pp, -0.02], [0, H - pp, -0.02], [0, H, -0.02], [len, H, -0.02], [0, 0, -1]); });
      } else {
        const wdt = 2 * area / Math.max(1, per), d = Math.min(s.roofD || 4.6, Math.max(0.6, wdt * (holes.length ? 0.47 : 0.44))), rise = s.rise ?? Math.max(0.8, d * 0.55);
        hipRoof(K, rm, ring, holes, H + 0.12, d, rise);
      }
    }
    if (!o.noCollide) addPolyColliders(ctx, poly, 0, H + 2, 0.8);
  }
  return { H, edges: edgesAll };
}
