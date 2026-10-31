// COPY of landmarksBotanicalGarden/geo.js (modules never import each other); used by landmarksLETI.
// COPY of landmarksYelaginPalace/geo.js (modules never import each other); used by landmarksBotanicalGarden.
// COPY of landmarksMenshikov/geo.js (modules never import each other); used by landmarksYelaginPalace.
// COPY of landmarksKarpovka/geo.js (modules never import each other); used by landmarksMenshikov for wall / pane / frustum helpers and `revolve` (added here: the lathe-turned pedestal of the Kapodistrias monument).
// landmarksMenshikov/geo.js - geometry helpers on top of the Parts collector (kit.js): face frames, textured tubes / frusta / n-gon prisms, lathe bodies (onions), keel / ogee / arch outlines as Shapes,
// gilded crosses, stacked frame rings.  All coordinates in the CURRENT Parts frame (the church frame C or a facade frame).
import * as THREE from 'three';

export const TAU = Math.PI * 2, DEG = Math.PI / 180;

/** run fn in the frame of a facade whose outward normal is (nx, nz) and whose left end (seen from outside) is at (x, z) on the ground: local +x runs to the right, +z points out */
export function onFace(P, x, z, nx, nz, fn) {
  P.push(x, 0, z, Math.atan2(nx, nz));
  try { return fn(); } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ textured tubes and prisms
/** vertical tube (cone frustum) around (cx, cz) from y0 to y1, radii r0 -> r1, `seg` flat quads; uv u = uRep * i / seg, v = vRep * (y - y0) / (y1 - y0).  Normals follow the slope. Optional caps. */
export function tube(P, mat, cx, cz, y0, y1, r0, r1 = r0, seg = 24, uRep = 1, vRep = 1, o = {}) {
  const a0 = o.a0 ?? 0, slope = (r0 - r1) / (y1 - y0 || 1);
  for (let i = 0; i < seg; i++) {
    const t0 = a0 + i * TAU / seg, t1 = a0 + (i + 1) * TAU / seg, tm = (t0 + t1) / 2;
    const p = (t, r, y) => [cx + Math.sin(t) * r, y, cz + Math.cos(t) * r];
    P.quad(mat, p(t0, r0, y0), p(t1, r0, y0), p(t1, r1, y1), p(t0, r1, y1), [Math.sin(tm), slope, Math.cos(tm)],
      [[uRep * i / seg, 0], [uRep * (i + 1) / seg, 0], [uRep * (i + 1) / seg, vRep], [uRep * i / seg, vRep]]);
  }
  if (o.capTop) P.fan(o.capTop, Array.from({ length: seg }, (_, i) => [cx + Math.sin(a0 + i * TAU / seg) * r1, y1, cz + Math.cos(a0 + i * TAU / seg) * r1]), [0, 1, 0], (q) => [q[0] / 3, q[2] / 3]);
  if (o.capBot) P.fan(o.capBot, Array.from({ length: seg }, (_, i) => [cx + Math.sin(a0 + i * TAU / seg) * r0, y0, cz + Math.cos(a0 + i * TAU / seg) * r0]), [0, -1, 0], (q) => [q[0] / 3, q[2] / 3]);
}
/**
 * regular n-gon frustum: circumradius R0 at y0, R1 at y1 (R1 = 0 = pyramid), the first vertex at angle a0 (0 = +z, counter-clockwise seen from above is +x ... sin / cos convention).
 * Every face gets uv u 0..uRep, v 0..vRep (a pyramid: triangle faces).  mats: one material or an array per face.  Returns the face centre directions.
 */
export function frustum(P, mat, cx, cz, y0, y1, n, R0, R1, a0 = 0, uRep = 1, vRep = 1, o = {}) {
  const dirs = [];
  const cs = Math.cos(Math.PI / n), slope = (R0 - R1) * cs / (y1 - y0 || 1);
  for (let i = 0; i < n; i++) {
    const t0 = a0 + i * TAU / n, t1 = a0 + (i + 1) * TAU / n, tm = (t0 + t1) / 2;
    const m = Array.isArray(mat) ? mat[i % mat.length] : mat;
    const p = (t, r, y) => [cx + Math.sin(t) * r, y, cz + Math.sin(t + Math.PI / 2) * 0 + Math.cos(t) * r];
    const nn = [Math.sin(tm), slope, Math.cos(tm)];
    if (R1 < 0.001) P.fan(m, [p(t0, R0, y0), p(t1, R0, y0), [cx, y1, cz]], nn, null) , fixFan(P, m, uRep, vRep);
    else P.quad(m, p(t0, R0, y0), p(t1, R0, y0), p(t1, R1, y1), p(t0, R1, y1), nn, [[0, 0], [uRep, 0], [uRep, vRep], [0, vRep]]);
    dirs.push({ ang: tm, x: Math.sin(tm), z: Math.cos(tm) });
  }
  if (o.capTop) P.fan(o.capTop, Array.from({ length: n }, (_, i) => [cx + Math.sin(a0 + i * TAU / n) * R1, y1, cz + Math.cos(a0 + i * TAU / n) * R1]), [0, 1, 0], (q) => [q[0] / 3, q[2] / 3]);
  return dirs;
}
// a pyramid face drawn as a fan has uv from its own coordinates: rewrite the last three vertices' uv to (0,0) (1,0) (0.5,1) * reps
function fixFan(P, mat, uRep, vRep) {
  const k = P.bucket(mat), n = k.n; k.uv[(n - 3) * 2] = 0; k.uv[(n - 3) * 2 + 1] = 0; k.uv[(n - 2) * 2] = uRep; k.uv[(n - 2) * 2 + 1] = 0; k.uv[(n - 1) * 2] = uRep / 2; k.uv[(n - 1) * 2 + 1] = vRep;
}
/** points of a regular n-gon [x, z] around (cx, cz) */
export const ngon = (n, R, a0 = 0, cx = 0, cz = 0) => Array.from({ length: n }, (_, i) => [cx + Math.sin(a0 + i * TAU / n) * R, cz + Math.cos(a0 + i * TAU / n) * R]);

// ------------------------------------------------------------------------------------------------ lathe bodies
const latheCache = new Map();
/** resample a profile [[r, y]..] by arc length into n points */
function resample(prof, n) {
  const L = [0]; for (let i = 1; i < prof.length; i++) L.push(L[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
  const tot = L[L.length - 1], out = [];
  for (let k = 0; k < n; k++) {
    const d = tot * k / (n - 1); let i = 1; while (i < prof.length - 1 && L[i] < d) i++;
    const t = (d - L[i - 1]) / ((L[i] - L[i - 1]) || 1); out.push([prof[i - 1][0] + (prof[i][0] - prof[i - 1][0]) * t, prof[i - 1][1] + (prof[i][1] - prof[i - 1][1]) * t]);
  }
  return out;
}
/** place a lathe body (profile [[r, y]..] in unit sizes, resampled to n rings) at (x, y, z): radius scale sr, height scale sy */
export function lathe(P, mat, key, prof, x, y, z, sr = 1, sy = 1, seg = 28, n = 18) {
  const k = `${key}|${seg}|${n}`;
  if (!latheCache.has(k)) latheCache.set(k, new THREE.LatheGeometry(resample(prof, n).map((p) => new THREE.Vector2(p[0], p[1])), seg));
  P.geo(mat, latheCache.get(k), x, y, z, 0, 0, 0, sr, sy, sr);
}
/** the Russian onion: unit belly radius (1.06), height 2.36 */
export const ONION = [[0, 0], [0.55, 0], [0.62, 0.1], [0.86, 0.3], [1.02, 0.52], [1.06, 0.75], [0.98, 1.05], [0.8, 1.38], [0.55, 1.72], [0.28, 2.02], [0.1, 2.25], [0, 2.36]];
export const onion = (P, mat, x, y, z, r, sy = 1, seg = 32, n = 20) => lathe(P, mat, 'onion', ONION, x, y, z, r, r * sy, seg, n);
/** a flat-topped ring / cornice profile is built with tube(); a gilded ball */
export function ball(P, mat, x, y, z, r, seg = 12) { const g = new THREE.SphereGeometry(r, seg, Math.max(5, seg >> 1)); P.geo(mat, g, x, y, z); g.dispose(); }
/** Orthodox cross of height h, base at (x, y, z), arms in the plane of the local x axis */
export function cross(P, mat, x, y, z, h, rot = 0) {
  const t = Math.max(0.05, h * 0.03);
  P.push(x, y, z, rot);
  P.box(mat, -t, t, 0, h, -t, t, 'b');
  P.box(mat, -h * 0.17, h * 0.17, h * 0.64, h * 0.64 + t * 1.8, -t * 0.8, t * 0.8, '');
  P.box(mat, -h * 0.1, h * 0.1, h * 0.84, h * 0.84 + t * 1.5, -t * 0.8, t * 0.8, '');
  P.box(mat, -h * 0.12, h * 0.12, h * 0.3, h * 0.3 + t * 1.5, -t * 0.8, t * 0.8, '');
  P.pop();
}

// ------------------------------------------------------------------------------------------------ outlines (Shapes in the facade plane)
const bez = (p0, p1, p2, p3, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; });
/** the keel (pointed-oval) gable outline: flat bottom from (-w/2, 0) to (w/2, 0), convex flanks, apex (0, h) -> points, counter-clockwise */
export function keelPts(w, h, n = 10) {
  const r = bez([w / 2, 0], [w / 2, h * 0.4], [w * 0.2, h * 0.64], [0, h], n), l = bez([0, h], [-w * 0.2, h * 0.64], [-w / 2, h * 0.4], [-w / 2, 0], n);
  return [[-w / 2, 0], ...r, ...l.slice(1, -1)];
}
/** the keel-arched hood over the open chapel: vertical flanks, round shoulders, a small point on top (w wide, h tall) */
export function hoodPts(w, h, n = 10) {
  const r = bez([w / 2, h * 0.42], [w / 2, h * 0.74], [w * 0.2, h * 0.8], [0, h], n), l = bez([0, h], [-w * 0.2, h * 0.8], [-w / 2, h * 0.74], [-w / 2, h * 0.42], n);
  return [[-w / 2, 0], [w / 2, 0], [w / 2, h * 0.42], ...r.slice(1), ...l.slice(1, -1), [-w / 2, h * 0.42]];
}
/** ogee crown (kokoshnik) outline over a window: base from (-w/2, 0) to (w/2, 0), concave shoulders, apex (0, h) */
export function ogeePts(w, h, n = 8) {
  const r = bez([w / 2, 0], [w / 2, h * 0.55], [w * 0.1, h * 0.42], [0, h], n), l = bez([0, h], [-w * 0.1, h * 0.42], [-w / 2, h * 0.55], [-w / 2, 0], n);
  return [[-w / 2, 0], ...r, ...l.slice(1, -1)];
}
/** round-headed opening: rectangle x0..x1 from y0, straight part to y0 + hs, semicircle on top: points counter-clockwise */
export function archPts(cx, y0, w, hTotal, n = 10) {
  const r = w / 2, hs = Math.max(0.01, hTotal - r), pts = [[cx - r, y0], [cx + r, y0], [cx + r, y0 + hs]];
  for (let i = 1; i < n; i++) { const a = Math.PI * i / n; pts.push([cx + Math.cos(a) * r, y0 + hs + Math.sin(a) * r]); }
  pts.push([cx - r, y0 + hs]); return pts;
}
export const shapeOf = (pts, holes = []) => {
  const s = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  for (const h of holes) s.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p[0], p[1])).reverse()));
  return s;
};
/** scale a point list about its bottom centre (x about cx, y about y0) */
export const scalePts = (pts, sx, sy, cx = 0, y0 = 0) => pts.map((p) => [cx + (p[0] - cx) * sx, y0 + (p[1] - y0) * sy]);
export const shiftPts = (pts, dx, dy) => pts.map((p) => [p[0] + dx, p[1] + dy]);
/** a flat polygon (facade plane x, y) at depth z facing +z with uv mapped to its bounding box (0..1) (mosaics) */
export function planeShape(P, mat, pts, z) {
  const sh = shapeOf(pts), g = new THREE.ShapeGeometry(sh, 4);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const pa = g.attributes.position, ua = g.attributes.uv; for (let i = 0; i < pa.count; i++) ua.setXY(i, (pa.getX(i) - x0) / (x1 - x0), (pa.getY(i) - y0) / (y1 - y0));
  P.geo(mat, g, 0, 0, z); g.dispose();
}
/** an extruded frame ring between two outlines (outer, inner = point lists), front at z0 + depth, uv = metres / uvs */
export function frameRing(P, mat, outer, inner, z0, depth, uvs = 1) { P.extrude(mat, shapeOf(outer, inner ? [inner] : []), z0, depth, uvs, 4); }
/** a filled extruded outline */
export function solid(P, mat, pts, z0, depth, uvs = 1) { P.extrude(mat, shapeOf(pts), z0, depth, uvs, 4); }

/** a quad facing +z at depth z with uv span */
export function pane(P, mat, x0, x1, y0, y1, z, uv) { P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], uv || [[0, 0], [1, 0], [1, 1], [0, 1]]); }
/** textured wall quad: uv in metres / (tu, tv) */
export function wall(P, mat, x0, x1, y0, y1, z, tu = 3, tv = tu) { P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[x0 / tu, y0 / tv], [x1 / tu, y0 / tv], [x1 / tu, y1 / tv], [x0 / tu, y1 / tv]]); }
/** box with metre-scaled texture coordinates on all four sides (tu along the sides, tv up) */
export function tbox(P, mat, x0, x1, y0, y1, z0, z1, tu = 3, tv = tu, skip = '') {
  const q = (a, b, c, d, n, ua, ub) => P.quad(mat, a, b, c, d, n, [[ua[0] / tu, y0 / tv], [ub[0] / tu, y0 / tv], [ub[0] / tu, y1 / tv], [ua[0] / tu, y1 / tv]]);
  if (!skip.includes('f')) q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [x0], [x1]);
  if (!skip.includes('k')) q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [-x1], [-x0]);
  if (!skip.includes('l')) q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [z0], [z1]);
  if (!skip.includes('r')) q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [-z1], [-z0]);
  if (!skip.includes('t')) P.quad(mat, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [[x0 / tu, z1 / tu], [x1 / tu, z1 / tu], [x1 / tu, z0 / tu], [x0 / tu, z0 / tu]]);
  if (!skip.includes('b')) P.quad(mat, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], [[x0 / tu, z0 / tu], [x1 / tu, z0 / tu], [x1 / tu, z1 / tu], [x0 / tu, z1 / tu]]);
}

// ------------------------------------------------------------------------------------------------ surfaces of revolution (landmarksMenshikov: the lathe-turned pedestal of the Kapodistrias monument)
/**
 * revolve(P, mat, prof, seg, o): a body of revolution around the vertical axis through (cx, cz); prof = [[r, y]..] from the bottom up (r >= 0).  Every profile segment is its own band
 * (flat-shaded along the profile where the corner is sharper than o.crease degrees, smooth across gentle bends), `seg` sides; uv: u = uRep * i / seg, v = y / vTile.  o: { cx, cz, crease (38),
 * uRep (3), vTile (1), capTop (mat), capBot (mat), a0 }.  Returns the triangle count.
 */
export function revolve(P, mat, prof, seg = 40, o = {}) {
  const k = P.bucket(mat), n = prof.length, cx = o.cx ?? 0, cz = o.cz ?? 0, cosLim = Math.cos((o.crease ?? 38) * Math.PI / 180), uRep = o.uRep ?? 3, vT = o.vTile ?? 1, a0 = o.a0 ?? 0;
  const segN = [];
  for (let i = 0; i + 1 < n; i++) { const dr = prof[i + 1][0] - prof[i][0], dy = prof[i + 1][1] - prof[i][1], l = Math.hypot(dr, dy) || 1; segN.push([dy / l, -dr / l]); }
  const blend = (a, b) => { const x = a[0] + b[0], y = a[1] + b[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  const t0 = P.tris;
  for (let i = 0; i + 1 < n; i++) {
    if (Math.hypot(prof[i + 1][0] - prof[i][0], prof[i + 1][1] - prof[i][1]) < 1e-5) continue;
    const n0 = i > 0 && segN[i - 1][0] * segN[i][0] + segN[i - 1][1] * segN[i][1] > cosLim ? blend(segN[i - 1], segN[i]) : segN[i];
    const n1 = i + 2 < n && segN[i][0] * segN[i + 1][0] + segN[i][1] * segN[i + 1][1] > cosLim ? blend(segN[i], segN[i + 1]) : segN[i];
    const base = k.n;
    for (let j = 0; j <= seg; j++) {
      const a = a0 + j / seg * TAU, s = Math.sin(a), c = Math.cos(a), u = uRep * j / seg;
      P._vert(k, cx + prof[i][0] * s, prof[i][1], cz + prof[i][0] * c, n0[0] * s, n0[1], n0[0] * c, u, prof[i][1] / vT);
      P._vert(k, cx + prof[i + 1][0] * s, prof[i + 1][1], cz + prof[i + 1][0] * c, n1[0] * s, n1[1], n1[0] * c, u, prof[i + 1][1] / vT);
    }
    // winding: the geometric normal of the first triangle must agree with the vertex normal (decided once per band)
    const ax = k.pos.length - (2 * (seg + 1) * 3);                                    // first vertex of the band in k.pos
    const p0 = [k.pos[ax], k.pos[ax + 1], k.pos[ax + 2]], p1 = [k.pos[ax + 3], k.pos[ax + 4], k.pos[ax + 5]], p2 = [k.pos[ax + 6], k.pos[ax + 7], k.pos[ax + 8]];
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
    const gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx;
    const na = [k.nrm[(base) * 3], k.nrm[(base) * 3 + 1], k.nrm[(base) * 3 + 2]];
    const flip = gx * na[0] + gy * na[1] + gz * na[2] < 0;
    for (let j = 0; j < seg; j++) {
      const q = base + j * 2;
      if (!flip) k.idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); else k.idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3);
      P.tris += 2;
    }
  }
  const cap = (m, r, y, up) => {
    if (!m || r < 0.002) return;
    const kk = P.bucket(m), b = kk.n; P._vert(kk, cx, y, cz, 0, up ? 1 : -1, 0, 0.5, 0.5);
    for (let j = 0; j <= seg; j++) { const a = a0 + j / seg * TAU; P._vert(kk, cx + r * Math.sin(a), y, cz + r * Math.cos(a), 0, up ? 1 : -1, 0, 0.5 + 0.5 * Math.sin(a), 0.5 + 0.5 * Math.cos(a)); }
    for (let j = 0; j < seg; j++) { if (up) kk.idx.push(b, b + j + 1, b + j + 2); else kk.idx.push(b, b + j + 2, b + j + 1); P.tris++; }
  };
  cap(o.capTop, prof[n - 1][0], prof[n - 1][1], true); cap(o.capBot, prof[0][0], prof[0][1], false);
  return P.tris - t0;
}
