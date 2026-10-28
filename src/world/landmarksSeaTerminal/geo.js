// landmarksSeaTerminal/geo.js - small geometry helpers of the module (no scene objects): a smooth parametric grid surface (the sails, the sail-like hull lofts), a shape extrusion with a rounded
// arch hole (the hotel hood frames), plus tiny 2D helpers.  Everything returns THREE.BufferGeometry for Parts.geo(...) / partsGeos(...).
import * as THREE from 'three';

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const DEG = Math.PI / 180;

/** a parametric grid surface: fn(s, t) -> [x, y, z] for s, t in 0..1, ns x nt cells, uv from uvf(s, t, p) (default (s, t)), smooth normals; flip = reverse the winding (and so the normals).
 *  Default winding: a sheet whose s runs toward +z and whose t runs DOWN, standing at x > 0, has its normal toward -x (inward).  REVIEW 2026-10-09: the D-2 hull passed the wrong flip and was drawn inside-out
 *  (only the far wall's inner face was visible; from the stern one could look into the hull).  Always check the sign numerically (normal . outward > 0) when the material is single-sided; the sails use a double-sided one. */
export function gridGeo(ns, nt, fn, uvf, flip = false) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nt; j++) for (let i = 0; i <= ns; i++) {
    const s = i / ns, t = j / nt, p = fn(s, t); pos.push(p[0], p[1], p[2]);
    const q = uvf ? uvf(s, t, p) : [s, t]; uv.push(q[0], q[1]);
  }
  for (let j = 0; j < nt; j++) for (let i = 0; i < ns; i++) {
    const a = j * (ns + 1) + i, b = a + 1, c = a + ns + 1, d = c + 1;
    if (flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** a flat extruded frame: outer rectangle x0..x1 (centred or not), y0..y1 with an arch-topped hole (x width hw*2 from hy0 to hy1, the two top corners rounded with radius r); depth along +z.
 *  The shape lives in the (x, y) plane, extruded from z = 0 to z = depth (front face at z = depth).  uv in metres / uvs. */
export function archFrame(x0, x1, y0, y1, hw, hy0, hy1, r, depth, uvs = 1.8, cx = 0) {
  const s = new THREE.Shape();
  s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.lineTo(x0, y0);
  const h = new THREE.Path(), n = 5;
  h.moveTo(cx - hw, hy0); h.lineTo(cx - hw, hy1 - r);
  for (let i = 1; i <= n; i++) { const a = Math.PI - (i / n) * Math.PI / 2; h.lineTo(cx - hw + r + Math.cos(a) * r, hy1 - r + Math.sin(a) * r); }
  h.lineTo(cx + hw - r, hy1);
  for (let i = 1; i <= n; i++) { const a = Math.PI / 2 - (i / n) * Math.PI / 2; h.lineTo(cx + hw - r + Math.cos(a) * r, hy1 - r + Math.sin(a) * r); }
  h.lineTo(cx + hw, hy0); h.lineTo(cx - hw, hy0);
  s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 4 });
  const pa = g.attributes.position, ua = g.attributes.uv, na = g.attributes.normal;
  for (let i = 0; i < pa.count; i++) { if (Math.abs(na.getZ(i)) > 0.5) ua.setXY(i, pa.getX(i) / uvs, pa.getY(i) / uvs); else ua.setXY(i, pa.getZ(i) / uvs, pa.getY(i) / uvs); }
  return g;
}

/** extrude any THREE.Shape along +z (uv in metres / uvs) */
export function extrudeShape(shape, depth, uvs = 1, seg = 6) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: seg });
  const pa = g.attributes.position, ua = g.attributes.uv, na = g.attributes.normal;
  for (let i = 0; i < pa.count; i++) { if (Math.abs(na.getZ(i)) > 0.5) ua.setXY(i, pa.getX(i) / uvs, pa.getY(i) / uvs); else ua.setXY(i, pa.getZ(i) / uvs, pa.getY(i) / uvs); }
  return g;
}

/** a rectangle with arch-topped hole as a shape helper for walls: polygon points [[x, y]...] -> THREE.Shape */
export function polyShape(pts, holes = []) {
  const s = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  for (const h of holes) s.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p[0], p[1]))));
  return s;
}

/** the inset octagon helper: offset of a convex polygon (points [[u, v]], clockwise as in frame.js PRISM) inwards by d (mitred) */
export function insetConvex(pts, d) {
  const n = pts.length, out = [];
  const nrm = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return [dz / l, -dx / l]; };      // outward normal for the clockwise order of PRISM
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
    const n1 = nrm(a, b), n2 = nrm(b, c), det = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    const k = d / det;
    out.push([b[0] - (n1[0] + n2[0]) * k, b[1] - (n1[1] + n2[1]) * k]);
  }
  return out;
}
