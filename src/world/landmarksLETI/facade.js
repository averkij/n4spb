// COPY of landmarksBotanicalGarden/facade.js (modules never import each other); used by landmarksLETI.
// COPY of landmarksYelaginPalace/facade.js (modules never import each other); used by landmarksBotanicalGarden.
// COPY of landmarksMenshikov/facade.js (modules never import each other); used by landmarksYelaginPalace for holed wall panels, window panes, surrounds.
// landmarksMenshikov/facade.js - the wall vocabulary shared by the palace and the Cadet Corps, drawn in a FACADE FRAME (kit.js onEdge: x along the wall to the right seen from the street, y up, z OUT
// of the wall): a plaster panel with real window openings (an extruded Shape with holes: the reveals are the sides of the extrusion, the glazing a pane at the back of the reveal), cream surrounds
// (rectangular: four slabs; round-headed: an extruded arch ring), flat pilasters with capital blocks, string courses, stepped cornices, plinths.  Everything is geometry (the player judges the
// walls at 1-5 m); the cost is ~30 triangles per window.
import * as THREE from 'three';
import { archPath } from './kit.js';
import { archPts, frameRing, planeShape } from './geo.js';

/** a plaster panel x0..x1, y0..y1 whose front face is at z 0 and which is `depth` thick; holes = [{ x0, y0, x1, y1 } | { cx, y0, w, h, arch: true }] (h = the straight part of an arch + w/2 on top = total) */
export function holedWall(P, mat, x0, x1, y0, y1, holes, o = {}) {
  const depth = o.depth ?? 0.3, uvs = o.uvs ?? 3;
  const sh = new THREE.Shape(); sh.moveTo(x0, y0); sh.lineTo(x1, y0); sh.lineTo(x1, y1); sh.lineTo(x0, y1); sh.lineTo(x0, y0);
  for (const h of holes) {
    const p = new THREE.Path();
    if (h.ell) { p.absellipse(h.cx, h.cy, h.ell.rx, h.ell.ry, 0, Math.PI * 2, true); }
    else if (h.circle) { p.absarc(h.cx, h.cy, h.r, 0, Math.PI * 2, true); }
    else if (h.arch) { const r = h.w / 2, st = h.h - r; p.moveTo(h.cx - r, h.y0); p.lineTo(h.cx - r, h.y0 + st); p.absarc(h.cx, h.y0 + st, r, Math.PI, 0, true); p.lineTo(h.cx + r, h.y0); p.lineTo(h.cx - r, h.y0); }
    else { p.moveTo(h.x0, h.y0); p.lineTo(h.x0, h.y1); p.lineTo(h.x1, h.y1); p.lineTo(h.x1, h.y0); p.lineTo(h.x0, h.y0); }
    sh.holes.push(p);
  }
  if (!o.noEnds) { P.extrude(mat, sh, -depth, depth, uvs, o.seg ?? 12); return; }
  // noEnds: the same extrusion without the two END faces (x = x0 / x1) and without the hidden back cap: the neighbouring wall of a corner owns that plane (no coplanar faces, no z-fighting)
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: o.seg ?? 12 });
  const pa = g.attributes.position, ua = g.attributes.uv, na = g.attributes.normal;
  for (let i = 0; i < pa.count; i++) { if (Math.abs(na.getZ(i)) > 0.5) ua.setXY(i, pa.getX(i) / uvs, pa.getY(i) / uvs); else ua.setXY(i, pa.getZ(i) / uvs, pa.getY(i) / uvs); }
  const keep = [], onEnd = (a, b, c) => [x0, x1].some((xe) => Math.abs(pa.getX(a) - xe) < 1e-4 && Math.abs(pa.getX(b) - xe) < 1e-4 && Math.abs(pa.getX(c) - xe) < 1e-4);
  for (let i = 0; i < pa.count; i += 3) {
    if (na.getZ(i) < -0.9 && na.getZ(i + 1) < -0.9 && na.getZ(i + 2) < -0.9) continue;
    if (onEnd(i, i + 1, i + 2) && Math.abs(na.getZ(i)) < 0.1) continue;
    keep.push(i, i + 1, i + 2);
  }
  g.setIndex(keep);
  P.geo(mat, g, 0, 0, -depth); g.dispose();
}

/** the glazing of an opening at the back of its reveal: a pane quad (rect) or a round-headed shape; depth = reveal depth; uv 0..1 over the opening */
export function pane(P, mat, h, depth = 0.3) {
  const z = -depth + 0.04;
  if (h.circle) { planeShape(P, mat, Array.from({ length: 16 }, (_, i) => [h.cx + Math.cos(i * Math.PI / 8) * h.r, h.cy + Math.sin(i * Math.PI / 8) * h.r]), z); return; }
  if (h.arch) { planeShape(P, mat, archPts(h.cx, h.y0, h.w, h.h, 9), z); return; }
  P.quad(mat, [h.x0, h.y0, z], [h.x1, h.y0, z], [h.x1, h.y1, z], [h.x0, h.y1, z], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}

/** a cream surround round a rectangular opening: jambs, lintel and a projecting sill (sw wide, proud) */
export function surround(P, mat, h, o = {}) {
  const sw = o.sw ?? 0.2, pr = o.proud ?? 0.06, sill = o.sill ?? 0.12;
  const x0 = h.x0 - sw, x1 = h.x1 + sw, y0 = h.y0, y1 = h.y1 + sw;
  P.box(mat, x0, h.x0, y0 - sw * 0.4, y1, 0, pr, 'kb');
  P.box(mat, h.x1, x1, y0 - sw * 0.4, y1, 0, pr, 'kb');
  P.box(mat, h.x0, h.x1, h.y1, y1, 0, pr, 'k');
  if (sill > 0) P.box(mat, x0 - 0.05, x1 + 0.05, y0 - sw * 0.4 - 0.1, y0 - sw * 0.4, 0, pr + sill, 'k');
  if (o.key) P.box(mat, (h.x0 + h.x1) / 2 - 0.16, (h.x0 + h.x1) / 2 + 0.16, h.y1 + sw * 0.3, y1 + 0.16, 0, pr + 0.07, 'k');
}
/** a round-headed surround (archivolt) round an arch opening, 0.2 m wide, 0.07 proud, with two impost blocks */
export function archSurround(P, mat, h, o = {}) {
  const sw = o.sw ?? 0.2, pr = o.proud ?? 0.07;
  const outer = archPts(h.cx, h.y0 - 0.04, h.w + 2 * sw, h.h + sw + 0.04, 14), inner = archPts(h.cx, h.y0 - 0.04, h.w, h.h + 0.04, 14);
  frameRing(P, mat, outer, inner, 0, pr, 1);
  if (o.sill !== false) P.box(mat, h.cx - h.w / 2 - sw - 0.06, h.cx + h.w / 2 + sw + 0.06, h.y0 - 0.14, h.y0 - 0.04, 0, pr + 0.1, 'k');
  const st = h.h - h.w / 2;
  if (o.impost !== false) for (const s of [-1, 1]) P.box(mat, h.cx + s * (h.w / 2 + sw * 0.5) - 0.17, h.cx + s * (h.w / 2 + sw * 0.5) + 0.17, h.y0 + st - 0.12, h.y0 + st + 0.12, 0, pr + 0.06, 'k');
}

/** a flat pilaster: shaft (w wide, proud), base block and a capital block of `capH` under y1 */
export function pilaster(P, mat, x, y0, y1, o = {}) {
  const w = o.w ?? 0.5, pr = o.proud ?? 0.12, capH = o.capH ?? 0.42, base = o.base ?? 0.28, cw = o.capW ?? w + 0.14, cp = o.capProud ?? pr + 0.07;
  P.box(mat, x - w / 2, x + w / 2, y0 + base, y1 - capH, 0, pr, 'kb');
  if (base > 0) P.box(mat, x - w / 2 - 0.05, x + w / 2 + 0.05, y0, y0 + base, 0, pr + 0.04, 'k');
  if (capH > 0) {
    P.box(mat, x - cw / 2, x + cw / 2, y1 - capH * 0.55, y1, 0, cp, 'k');
    P.box(mat, x - w / 2 - 0.03, x + w / 2 + 0.03, y1 - capH, y1 - capH * 0.55, 0, pr + 0.04, 'k');
  }
}
/** a horizontal band (string course / frieze strip) x0..x1, y0..y1 projecting `proud` */
export const band = (P, mat, x0, x1, y0, y1, proud = 0.12) => P.box(mat, x0, x1, y0, y1, 0, proud, 'k');
/** a stepped cornice from yc up to yt: three boxes growing outward (proud, proud2, proud3) and a dentil strip under the corona */
export function cornice(P, mat, x0, x1, yc, yt, o = {}) {
  const h = yt - yc, p1 = o.p1 ?? 0.2, p2 = o.p2 ?? 0.38, p3 = o.p3 ?? 0.58;
  P.box(mat, x0, x1, yc, yc + h * 0.28, 0, p1, 'k');
  if (o.dentil !== false) { const n = Math.floor((x1 - x0) / 0.32); for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * (x1 - x0) / n; P.box(mat, x - 0.08, x + 0.08, yc + h * 0.28, yc + h * 0.5, 0, p2 - 0.08, 'kt'); } }
  P.box(mat, x0, x1, yc + h * 0.28, yc + h * 0.5, 0, p2 - 0.12, 'k');
  P.box(mat, x0, x1, yc + h * 0.5, yc + h * 0.78, 0, p2, 'k');
  P.box(mat, x0 - 0.0, x1 + 0.0, yc + h * 0.78, yt, 0, p3, 'k');
}
export { archPath };
