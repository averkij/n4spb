// landmarksFortress/stucco.js - the Elizabethan-baroque vocabulary of the cathedral and the bell tower, built from the Parts collector (kit.js): Corinthian-composite columns with cherub heads,
// arched window surrounds with rocaille crests, cartouches, volutes, garlands, balcony slabs with consoles and iron railings, oval windows, gilded ray fans, vase finials, cornice runs.
// Photos refs/nikolsky 005 (capitals, garland, putto), 039 (bays, balconies, order), 009 (console + railing), 031 (domes).  All coordinates are in the CURRENT Parts frame (a facade frame: x right, y up, z out).
import * as THREE from 'three';
import * as G from './geo.js';

const TAU = Math.PI * 2;
const cache = new Map();
const geoOf = (key, mk) => { let g = cache.get(key); if (!g) { g = mk(); cache.set(key, g); } return g; };
const sphereG = (seg = 8) => geoOf('sph' + seg, () => new THREE.SphereGeometry(1, seg, Math.max(4, seg >> 1)));
const boxG = () => geoOf('box', () => new THREE.BoxGeometry(1, 1, 1));
const torusG = (arc, seg = 10) => geoOf('tor' + arc.toFixed(2) + seg, () => new THREE.TorusGeometry(1, 0.28, 5, seg, arc));

export const sph = (P, mat, x, y, z, rx, ry = rx, rz = rx, seg = 8) => P.geo(mat, sphereG(seg), x, y, z, 0, 0, 0, rx, ry, rz);
/** oriented thin box (centre x,y,z; sizes w,h,d; rotation about z) */
export const slat = (P, mat, x, y, z, w, h, d, rz = 0) => P.geo(mat, boxG(), x, y, z, 0, 0, rz, w, h, d);
/** a scroll (volute): a torus arc of mean radius r, tube radius 0.28 r, in the facade plane, starting angle a0 */
export const volute = (P, mat, x, y, z, r, a0 = 0, arc = Math.PI * 1.5, sz = 1) => P.geo(mat, torusG(arc), x, y, z, 0, 0, a0, r, r, r * sz);

// ---------------------------------------------------------------------------------------------- columns
/** column base: plinth block + two rings */
export function colBase(P, M, x, z, y, R) {
  P.box(M.whiteShade, x - R * 1.28, x + R * 1.28, y, y + R * 0.38, z - R * 1.28, z + R * 1.28, 'b');
  P.col(M.white, x, z, y + R * 0.38, y + R * 0.62, R * 1.12, R * 1.05, 14, false);
  P.col(M.white, x, z, y + R * 0.62, y + R * 0.8, R * 1.0, R * 1.0, 14, false);
}
/** Corinthian-composite capital: bell, 8 acanthus ribs, abacus; a cherub head on the +z face when `putti` */
export function capital(P, M, x, z, y, R, o = {}) {
  const hBell = R * 1.45;
  P.col(M.white, x, z, y, y + hBell, R * 1.0, R * 1.42, 14, false);
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8 + 0.3927, c = Math.cos(a), s = Math.sin(a);
    P.geo(M.white, boxG(), x + s * R * 1.12, y + hBell * 0.38, z + c * R * 1.12, 0.35, a, 0, R * 0.34, hBell * 0.62, R * 0.16);
  }
  P.col(M.white, x, z, y + hBell, y + hBell + R * 0.14, R * 1.62, R * 1.62, 8, true);
  P.box(M.white, x - R * 1.7, x + R * 1.7, y + hBell + R * 0.14, y + hBell + R * 0.34, z - R * 1.7, z + R * 1.7, 'b');
  if (o.putti !== false) putto(P, M, x, y + hBell * 0.55, z + R * 1.3, R * 0.62);
  return hBell + R * 0.34;
}
/** shaft + base + capital: returns the top y */
export function column(P, M, x, z, y0, y1, R, o = {}) {
  colBase(P, M, x, z, y0, R);
  const capH = R * 1.8, yb = y0 + R * 0.8, yt = y1 - capH;
  P.col(M.white, x, z, yb, yt, R * 1.0, R * 0.9, 14, false);
  capital(P, M, x, z, yt, R, o);
  return y1;
}
/** cluster of n columns along x with the given spacing (a pair or a trio); the middle one of a trio stands slightly in front */
export function cluster(P, M, cx, z, y0, y1, R, n, pitch, o = {}) {
  for (let i = 0; i < n; i++) { const x = cx + (i - (n - 1) / 2) * pitch; column(P, M, x, z + (n === 3 && i === 1 ? R * 0.1 : 0), y0, y1, R, o); }
}

// ---------------------------------------------------------------------------------------------- small figures and crests
/** a winged cherub head, front along +z, head radius r */
export function putto(P, M, x, y, z, r) {
  sph(P, M.white, x, y, z, r, r * 1.02, r * 0.9, 8);
  for (const sx of [-1, 1]) {
    P.geo(M.white, sphereG(6), x + sx * r * 1.55, y - r * 0.15, z - r * 0.15, 0, 0, sx * -0.5, r * 1.1, r * 0.42, r * 0.22);
    sph(P, M.white, x + sx * r * 0.82, y + r * 0.55, z - r * 0.05, r * 0.38, r * 0.34, r * 0.36, 5);
  }
}
/** rocaille cartouche: a fan of shell ribs over a flattened body, two small C-scrolls hanging at the sides and a cherub on top, width w (crest above a window or on a pediment) */
export function cartouche(P, M, x, y, z, w, o = {}) {
  const h = w * 0.4;
  sph(P, M.white, x, y + h * 0.42, z, w * 0.26, h * 0.34, w * 0.045, 8);                       // the flat body
  for (let i = 0; i < 5; i++) {                                                                // shell ribs fanning upward
    const a = Math.PI * (0.18 + 0.16 * i), c = Math.cos(a), s = Math.sin(a);
    P.geo(M.white, boxG(), x + c * w * 0.2, y + h * 0.4 + s * h * 0.55, z + w * 0.02, 0, 0, a - Math.PI / 2, w * 0.05, h * 0.62, w * 0.05);
  }
  for (const sx of [-1, 1]) {                                                                  // C-scrolls curling down at both sides
    volute(P, M.white, x + sx * w * 0.34, y + h * 0.28, z + w * 0.01, w * 0.1, sx > 0 ? 0.6 : Math.PI - 0.6 - Math.PI * 1.3, Math.PI * 1.3);
    sph(P, M.white, x + sx * w * 0.42, y + h * 0.05, z, w * 0.045, w * 0.07, w * 0.03, 5);
  }
  sph(P, M.white, x, y + h * 0.06, z, w * 0.07, w * 0.05, w * 0.04, 5);                         // drop at the bottom
  if (o.putto !== false) putto(P, M, x, y + h * 1.12, z + w * 0.02, w * 0.1);
}
/** a swag of small spheres along a sagging curve from x0 to x1 at height y */
export function garland(P, M, x0, x1, y, z, sag = 0.28, n = 7, r = 0.075) {
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, yy = y - Math.sin(t * Math.PI) * sag; sph(P, M.white, x, yy, z, r * (1 + 0.4 * Math.sin(t * Math.PI)), r, r, 5); }
}
/** a gilded fan of rays centred at (cx, cy) in the facade plane: rays from radius r0 to r1, angles a0..a1 (radians, 0 = +x, counter-clockwise), n rays */
export function rayFan(P, M, cx, cy, z, r0, r1, a0, a1, n, thick = 0.07) {
  for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * (n === 1 ? 0.5 : i / (n - 1)), rm = (r0 + r1) / 2, len = r1 - r0;
    P.geo(M.goldFlat, boxG(), cx + Math.cos(a) * rm, cy + Math.sin(a) * rm, z, 0, 0, a, len, thick, thick);
  }
}
/** a vase finial (urn on a pedestal), total height h */
export function urn(P, M, x, y, z, h) {
  const r = h * 0.2;
  P.box(M.white, x - r * 0.9, x + r * 0.9, y, y + h * 0.18, z - r * 0.9, z + r * 0.9, 'b');
  P.col(M.white, x, z, y + h * 0.18, y + h * 0.42, r * 0.5, r * 1.15, 8, false);
  P.col(M.white, x, z, y + h * 0.42, y + h * 0.7, r * 1.15, r * 0.7, 8, false);
  P.col(M.white, x, z, y + h * 0.7, y + h * 0.82, r * 0.7, r * 0.95, 8, true);
  sph(P, M.white, x, y + h * 0.92, z, r * 0.5, r * 0.55, r * 0.5, 6);
}

// ---------------------------------------------------------------------------------------------- windows and surrounds
/** outline of the white surround of an arched opening of width w and total height h (sides, arched crown), border b: ring between archPts(w+2b..) and archPts(w..) */
export function archFrame(P, mat, cx, y0, w, h, b, z0, depth) {
  const inner = G.archPts(cx, y0, w, h, 10), outer = G.archPts(cx, y0 - b * 0.6, w + 2 * b, h + b * 0.6 + b, 10);
  G.frameRing(P, mat, outer, inner, z0, depth, 1);
}
/** the glass of an opening, uv spans the opening (texture mat) at depth z */
export function archGlass(P, mat, cx, y0, w, h, z) { G.planeShape(P, mat, G.archPts(cx, y0, w, h, 10), z); }
/** rectangular opening glass */
export function rectGlass(P, mat, x0, x1, y0, y1, z) { G.pane(P, mat, x0, x1, y0, y1, z); }
/**
 * An arched baroque window: glass pane (muntins) at z = 0.04, a white frame ring of border b (0.22 deep), a sill with two consoles, optional rocaille crest (cartouche + two ears) and a hood.
 * cx, y0 = centre x / bottom of the glass; w, h = glass width and total height. o: { mat (glass material), crest, sill, b }
 */
export function archWindow(P, M, cx, y0, w, h, o = {}) {
  const b = o.b ?? Math.max(0.2, w * 0.14);
  archGlass(P, o.mat || M.win36, cx, y0, w, h, 0.05);
  archFrame(P, M.white, cx, y0, w, h, b, 0, 0.22);
  if (o.sill !== false) {
    P.box(M.white, cx - w / 2 - b * 1.3, cx + w / 2 + b * 1.3, y0 - b * 1.1, y0 - b * 0.35, 0, 0.45, '');
    for (const sx of [-1, 1]) P.box(M.whiteShade, cx + sx * (w / 2 + b * 0.55) - 0.1, cx + sx * (w / 2 + b * 0.55) + 0.1, y0 - b * 2.2, y0 - b * 1.1, 0, 0.3, 'b');
  }
  if (o.crest) {
    const ytop = y0 + h + b * 0.4;
    for (const sx of [-1, 1]) {
      volute(P, M.white, cx + sx * (w / 2 + b * 0.6), ytop - w * 0.28, 0.15, w * 0.2, sx > 0 ? 0.2 : Math.PI - 0.2 - 1.5 * Math.PI + 1.5 * Math.PI, Math.PI * 1.5);
    }
    cartouche(P, M, cx, ytop - 0.05, 0.2, w * 1.5);
  }
}
/** oval window (oculus) with a garland below and a cherub above; rx, ry half sizes */
export function oculus(P, M, cx, cy, rx, ry, o = {}) {
  const s = new THREE.Shape(); s.absellipse(cx, cy, rx + 0.18, ry + 0.18, 0, TAU, false, 0);
  const hole = new THREE.Path(); hole.absellipse(cx, cy, rx, ry, 0, TAU, true, 0); s.holes.push(hole);
  P.extrude(M.white, s, 0, 0.2, 1, 14);
  const pg = new THREE.Shape(); pg.absellipse(cx, cy, rx, ry, 0, TAU, false, 0);
  const g = new THREE.ShapeGeometry(pg, 14), ua = g.attributes.uv, pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) ua.setXY(i, (pa.getX(i) - cx + rx) / (2 * rx), (pa.getY(i) - cy + ry) / (2 * ry));
  P.geo(o.mat || M.win24, g, 0, 0, 0.05); g.dispose();
  if (o.garland !== false) garland(P, M, cx - rx * 0.9, cx + rx * 0.9, cy - ry - 0.15, 0.1, 0.3, 7, 0.09);
  if (o.putto !== false) putto(P, M, cx, cy + ry + 0.32, 0.15, 0.2);
}

// ---------------------------------------------------------------------------------------------- balconies
/** an iron scroll bracket under a balcony: an S-curved (ogee) profile in the (depth, y) plane extruded 0.16 m along the wall; hangs from the slab bottom y, `drop` m long, reaches `depth` out from the wall */
export function console_(P, M, x, y, z0, drop, depth) {
  const cr = (a, b, c, d, n = 6) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; });
  // profile points (d, h): d outwards from the wall, h downward from the slab bottom; the shape is built in (x = -d, y = -h)
  const outer = cr([depth, 0], [depth, drop * 0.45], [depth * 0.15, drop * 0.3], [depth * 0.28, drop * 0.78]);        // the front edge curls in and down
  const tip = cr([depth * 0.28, drop * 0.78], [depth * 0.34, drop * 1.0], [depth * 0.1, drop * 1.05], [0, drop], 4);
  const pts = [[0, 0], ...outer.slice(0), ...tip.slice(1), [0, drop * 0.55]].map(([d, h]) => [-d, -h]);
  P.push(x - 0.08, y, z0, Math.PI / 2);
  P.extrude(M.iron, G.shapeOf(pts), 0, 0.16, 1, 4);
  P.pop();
}
/** balcony of width w at height y (slab top), depth d, railing 1.0 m: the slab, two consoles, a front + two side railing panels (alpha) */
export function balcony(P, M, cx, y, w, d = 0.95, o = {}) {
  const x0 = cx - w / 2, x1 = cx + w / 2;
  P.box(M.whiteShade, x0, x1, y - 0.22, y, 0, d, '');
  P.box(M.iron, x0, x1, y - 0.3, y - 0.22, 0.02, d - 0.02, 'tb');
  for (const sx of [-0.32, 0.32]) console_(P, M, cx + sx * w, y - 0.3, 0.0, 0.8, d);
  const hh = 1.0, tile = 1.0, uvq = (len) => [[0, 0], [len / tile, 0], [len / tile, 1], [0, 1]];
  P.quad(M.rail, [x0, y, d], [x1, y, d], [x1, y + hh, d], [x0, y + hh, d], [0, 0, 1], uvq(w));
  P.quad(M.rail, [x0, y, 0.02], [x0, y, d], [x0, y + hh, d], [x0, y + hh, 0.02], [-1, 0, 0], uvq(d));
  P.quad(M.rail, [x1, y, d], [x1, y, 0.02], [x1, y + hh, 0.02], [x1, y + hh, d], [1, 0, 0], uvq(d));
  P.box(M.iron, x0, x1, y + hh - 0.03, y + hh + 0.04, d - 0.04, d + 0.04, '');
  void o;
}

// ---------------------------------------------------------------------------------------------- cornices
/** the dark lead-flashing underside of a cornice: one down-facing quad (the cornice box has no bottom face of its own) */
export function underside(P, M, x0, x1, y, z0, z1) { P.quad(M.underside, [x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], [0, -1, 0]); }
/** a straight entablature run on a facade: from x0 to x1, architrave / frieze / cornice with the given projection; dark underside strip (lead flashing) under the cornice */
export function entablature(P, M, x0, x1, y, proj = 0.55, o = {}) {
  const hA = o.hA ?? 0.5, hF = o.hF ?? 0.5, hC = o.hC ?? 0.45, z0 = o.z0 ?? 0;
  // o.z0 > 0: a forward block that starts where the continuous run ends (no coplanar overlap); the band faces of the block are then z0 .. proj
  P.box(M.white, x0, x1, y, y + hA, z0, Math.max(z0 + 0.05, proj * 0.62), z0 > 0 ? 'bk' : 'b');
  P.box(M.white, x0, x1, y + hA, y + hA + hF, z0, Math.max(z0 + 0.05, proj * 0.5), z0 > 0 ? 'bk' : 'b');
  P.box(M.white, x0, x1, y + hA + hF, y + hA + hF + hC, z0, proj, z0 > 0 ? 'kb' : 'b');
  underside(P, M, x0, x1, y + hA + hF, z0, proj);
  return y + hA + hF + hC;
}
