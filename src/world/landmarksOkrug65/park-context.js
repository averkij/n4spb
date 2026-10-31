// Park 300 is a composition of open lawns, allées and mapped small groves.
// The generic park fill must not turn the entire design into continuous wood.
// Aerial photo + mapped plan: docs/research/okrug65-landmarks.md.
import * as THREE from 'three';
import { BEACHES } from './park-data.js';
import { registerLOD } from '../../core/spatial.js';

export { inPark, inBeach, treeReject, pavedRings } from "./park-hooks.js";

/** One pale, gently varied sand mesh over the exact mapped beaches. It is
 *  below the normal 2 cm paths and 3 cm asphalt, with no walking colliders. */
export function drawBeach(ctx) {
  const pos = [], col = [], ix = [], normal = [], uv = [];
  const add = (x, z) => {
    const k = pos.length / 3;
    pos.push(x, 0.008, z); normal.push(0, 1, 0); uv.push(x / 12, z / 12);
    const shade = 0.97 + (Math.sin(x * 0.031) * Math.sin(z * 0.027) + 1) * 0.025;
    col.push(shade, shade, shade); return k;
  };
  for (const b of BEACHES) for (const p of b.polys) {
    // The true polygon boundary is retained; road-triangle candidates are
    // subdivided before rejecting them, so no broad cap crosses a carriageway.
    const outer = Array.from({ length: p.o.length / 2 }, (_, i) => new THREE.Vector2(p.o[i * 2], p.o[i * 2 + 1]));
    const holes = p.h.map(h => Array.from({ length: h.length / 2 }, (_, i) => new THREE.Vector2(h[i * 2], h[i * 2 + 1])));
    const pts = [...outer, ...holes.flat()], triangles = THREE.ShapeUtils.triangulateShape(outer, holes);
    const emit = (a, b, c, depth = 0) => {
      const lengths = [a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)], max = Math.max(...lengths);
      if (max > 13 && depth < 12) {
        const edge = lengths.indexOf(max);
        if (edge === 0) { const m = a.clone().add(b).multiplyScalar(0.5); emit(a, m, c, depth + 1); emit(m, b, c, depth + 1); }
        else if (edge === 1) { const m = b.clone().add(c).multiplyScalar(0.5); emit(a, b, m, depth + 1); emit(a, m, c, depth + 1); }
        else { const m = c.clone().add(a).multiplyScalar(0.5); emit(a, b, m, depth + 1); emit(m, b, c, depth + 1); }
        return;
      }
      const mx = (a.x + b.x + c.x) / 3, mz = (a.y + b.y + c.y) / 3;
      const cover = (x, z) => (ctx._roadPlan?.cover(x, z, {}) ?? -Infinity) >= -0.25;
      if (cover(mx, mz) || cover(a.x, a.y) || cover(b.x, b.y) || cover(c.x, c.y)) return;
      const A = add(a.x, a.y), B = add(b.x, b.y), C = add(c.x, c.y);
      const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (area < 0) ix.push(A, B, C); else ix.push(A, C, B);
    };
    for (const [a, b, c] of triangles) emit(pts[a], pts[b], pts[c]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(ix); geo.computeBoundingBox(); geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, ctx.mat.toon('#c0b290', { vertexColors: true, paint: 0.02 })); mesh.name = 'okrug65-mapped-sand-beach'; mesh.receiveShadow = true; mesh.castShadow = false;
  ctx.noOutline(mesh); registerLOD(mesh, 3000); ctx.addStatic(mesh);
  return ix.length / 3;
}
