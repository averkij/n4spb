// landmarksSevkabel/common.js - helpers shared by the parts: textured walls on footprint edges (u measured from the LEFT end as seen from outside: nothing is mirrored), roof caps with holes, mitred coping,
// solid colliders on a footprint, the vertex-coloured instance geometry used by the cranes, and a few tiny shape helpers.
import * as THREE from 'three';
import * as L from '../layout.js';
import { Parts, ringEdges, frameOf, band } from './kit.js';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';

export { ringEdges, frameOf, band, ringFromFlat };

/** the baked footprint polygons of a building id: [{ o: flat, h: [flat..] }] ([] when the id is unknown) */
export function polysOf(id) { const b = L.buildingById(id); return b && b.polys ? b.polys : []; }

/** a wall quad on footprint edge `e` (kit.ringEdges) from y0 to y1; uv = (u / tu, v / tv) with u from the left end (o.u0 m offset) and v from o.v0 (default y0) */
export function wallEdge(P, mat, e, y0, y1, tu = 4, tv = 4, o = {}) {
  if (y1 <= y0 + 1e-4) return;
  const f = frameOf(e), A = [f.x, f.z], B = [f.x + f.xa[0] * e.len, f.z + f.xa[1] * e.len];
  const u0 = (o.u0 || 0) / tu, u1 = u0 + e.len / tu, v0 = (o.v0 ?? y0) / tv, v1 = v0 + (y1 - y0) / tv;
  P.quad(mat, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], [e.n[0], 0, e.n[1]], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
}

/** every edge of a footprint polygon as a wall of material `mat`; fn(e, i) may return { mat, y1, tu, tv, u0 } to override per edge */
export function polyWalls(P, poly, mat, y0, y1, tu = 4, tv = 4, fn = null) {
  const edges = ringEdges(poly);
  edges.forEach((e, i) => { const o = fn ? fn(e, i) || {} : {}; wallEdge(P, o.mat || mat, e, y0, o.y1 ?? y1, o.tu || tu, o.tv || tv, o); });
  return edges;
}

/** a flat roof cap of a footprint at height y (holes = courtyards) */
export function roofCap(P, mat, poly, y, uvs = 4) {
  const ring = ringFromFlat(poly.o), holes = poly.h.map((h) => ringFromFlat(h));
  P.cap(mat, ring, y, true, uvs, holes);
}

/** mitred coping / parapet cap ring round a footprint: front + top faces, d metres proud */
export function coping(P, poly, y0, y1, d, mats) { band(P, ringEdges(poly), y0, y1, d, mats); }

/** thin solid walls on a footprint (colliders, hollow inside) */
export function solidPoly(ctx, poly, h, y0 = 0, thick = 0.9) { return addPolyColliders(ctx, poly, y0, h, thick); }

/** one geometry with vertex colours from a Parts run: fn(P) draws with STRING material keys, `colors` maps key -> hex.  Returns { geo, tris }. */
export function partsGeoVC(fn, colors) {
  const P = new Parts(); fn(P);
  const pos = [], nrm = [], uv = [], col = [], idx = []; let n = 0;
  for (const k of P.b.values()) {
    if (!k.n) continue;
    const c = new THREE.Color(colors[k.mat] || '#ff00ff');
    for (let i = 0; i < k.pos.length; i++) pos.push(k.pos[i]);
    for (let i = 0; i < k.nrm.length; i++) nrm.push(k.nrm[i]);
    for (let i = 0; i < k.uv.length; i++) uv.push(k.uv[i]);
    for (let i = 0; i < k.n; i++) col.push(c.r, c.g, c.b);
    for (let i = 0; i < k.idx.length; i++) idx.push(k.idx[i] + n);
    n += k.n;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return { geo: g, tris: P.tris };
}

/** a thin strut between two points (a square tube of half-width r) */
export function strut(P, mat, a, b, r = 0.12) { P.cyl(mat, a, b, r, r, 4, false); }

/** tiny deterministic hash 0..1 */
export const hash = (a, b = 0) => { let h = Math.imul((a * 73856093) ^ (b * 19349663), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
