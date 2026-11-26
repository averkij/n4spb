// landmarksG/square.js - the square itself.  Paving after the aerial photo 005 and the ground photos 001 003 011 016 082 090 (docs/research/palace-square-hermitage.md section 4):
//   * the stone field (OSM AREAS r1947507, 17 679 m2, a rounded bell): fields of 9.7 m (14 across the base) of diabase setts in concentric arcs framed by 1.6 m grey granite bands with a thin pink inlay and a pink
//     diagonal belt across every crossing (texture G.paveTex), a 1.9 m granite outline all round (double line) and a thick 2.8 m ring round the 4 x 4 fields of the column; the column stands on a crossing;
//   * the open square (OSM r1947508, 28 000 m2) is WORN ASPHALT: a tiled texture (aggregate, hair cracks) x vertex-colour blotches that are a pure function of the world position (dark wet areas, dry light areas),
//     48 rectangular repair patches away from the real carriageways, the same asphalt in a 12 m strip along the General Staff and in front of the arch, and the marked strip in front of the Winter Palace
//     (8 rows of 3 m dashes + a solid line, 1.5 m pitch, u -88.5..-76.6);
//   * the granite lattice pavement in front of the General Staff (4.2 m, +12 cm, also across the arch front), the Montferrand lamps (fluted poles with 2-3 opal globes) along the arc, in front of the Guards HQ and on the
//     Winter Palace pavement, bollards on the west road edge, the four five-lantern bronze candelabra (Rakhau 1876) at the corners of the stone field, and the spots the people / props modules use.
// Layers (y, polygonOffset): ground 0 < streets asphalt 0.03 / paint 0.037 < square asphalt 0.04 (-3) < zebra 0.052 (-4.5) < stone field 0.05 (-4) < GS strip 0.058 < outline / ring 0.085 (-5) < pink inlays 0.1 (-6) < pavement 0.12.
// The OSM living-street trace round the field (w217399816, claimed in groups.js) is drawn by streets with kerbs and lane lines: not a real carriageway; see the report (streets should skip it).
// No flags, no benches / kiosks on the stone field (dossier section 4).
// KNOCKABLE (core/knock.js, lib/knock-inst.js): with ctx.knock the 18 Montferrand lamps are instanced (pole body + opal globes, Dynamic, one set of meshes per 384 m cell, LOD 320 m) and
// registered, anchored at 23 km/h: a car at the break speed knocks the pole over at the foot and the globes go dark with it. Without ctx.knock they are drawn into the module's Parts as before.
// The granite bollards and the stone-field candelabra stay solid (heritage, plan section 6).
import * as THREE from 'three';
import * as L from '../layout.js';
import { AREAS, ROADS } from '../data/city.js';
import { band, Parts } from './kit.js';
import { CX, CZ, toWorld, toUV, ARC } from './frame.js';
import { GC } from './mats.js';
import { knockInstances } from '../lib/knock-inst.js';
import { registerLOD } from '../../core/spatial.js';
import { VB } from '../traffic/vb.js';

// ---------------------------------------------------------------------------------------------- small helpers
const ARC_U = ARC.u, ARC_R = ARC.R;
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const hh = (ix, iz, sd) => { let h = (ix * 374761393 + iz * 668265263 + sd * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, z, sd) => {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hh(ix, iz, sd), b = hh(ix + 1, iz, sd), c = hh(ix, iz + 1, sd), d = hh(ix + 1, iz + 1, sd);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
};
/** vertex colour of the worn asphalt (photo 011: dark wet blotches, dry light areas, slight warm / cool drift); a pure function of the world position so that every asphalt mesh agrees */
const asphaltCol = (x, z) => {
  const t = 0.55 * vnoise(x / 42, z / 42, 1) + 0.33 * vnoise(x / 15, z / 15, 2) + 0.12 * vnoise(x / 7, z / 7, 3);
  const lum = 0.64 + 0.72 * t;
  return [lum * (0.97 + 0.07 * t), lum, lum * (1.04 - 0.1 * t)];
};
const inRing = (r, x, z) => { let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; };
const distSeg = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz; const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0; return Math.hypot(px - ax - dx * t, pz - az - dz * t); };

/** triangulate a ring (+ holes), subdivide the triangles to < maxEdge, y fixed, uv from fn(x, z), optional vertex colour fn(x, z) -> [r, g, b] */
function polyGeo(ring, holes, y, uvFn, maxEdge = 14, colFn = null) {
  const c2 = ring.map((p) => new THREE.Vector2(p[0], p[1])), h2 = holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
  const all = ring.concat(...holes), tris = THREE.ShapeUtils.triangulateShape(c2, h2);
  const pos = [], nrm = [], uv = [], col = [], idx = [];
  const add = (p) => { const i = pos.length / 3; pos.push(p[0], y, p[1]); nrm.push(0, 1, 0); const t = uvFn(p[0], p[1]); uv.push(t[0], t[1]); if (colFn) col.push(...colFn(p[0], p[1])); return i; };
  const sub = (a, b, c) => {
    const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]), ca = Math.hypot(a[0] - c[0], a[1] - c[1]), m = Math.max(ab, bc, ca);
    if (m <= maxEdge) {
      // winding: make the face point up
      const cr = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const i0 = add(a), i1 = add(b), i2 = add(c);
      if (cr > 0) idx.push(i0, i2, i1); else idx.push(i0, i1, i2);
      return;
    }
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    if (m === ab) { const d = mid(a, b); sub(a, d, c); sub(d, b, c); } else if (m === bc) { const d = mid(b, c); sub(a, b, d); sub(a, d, c); } else { const d = mid(c, a); sub(a, b, d); sub(d, b, c); }
  };
  for (const t of tris) sub(all[t[0]], all[t[1]], all[t[2]]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (colFn) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}
const ringOf = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); if (r.length > 1 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 0.05) r.pop(); return r; };

/**
 * A flat ribbon along a polyline [[x, z]..] from offset d0 to d1 (metres, along the left normal of the walking direction; `flip` mirrors it), at height y, facing up.
 * uv: (length / uvAlong, 0..1 across) or, with o.uvWorld = m, world x / m, z / m.  o.col = fn(x, z) -> [r, g, b] adds vertex colours; o.maxSeg resamples the line.
 */
function ribbonGeo(pts, o) {
  const closed = !!o.closed, maxSeg = o.maxSeg || 1e9, flip = o.flip ? -1 : 1, d0 = o.d0 * flip, d1 = o.d1 * flip, y = o.y;
  const P = [], n0 = pts.length, segs = closed ? n0 : n0 - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i], b = pts[(i + 1) % n0], k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / maxSeg));
    for (let j = 0; j < k; j++) P.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  }
  if (!closed) P.push(pts[n0 - 1]); else P.push(P[0]);
  const n = P.length, en = [];                                                      // edge normals (left of the direction)
  for (let i = 0; i < n - 1; i++) { const dx = P[i + 1][0] - P[i][0], dz = P[i + 1][1] - P[i][1], l = Math.hypot(dx, dz) || 1; en.push([dz / l, -dx / l]); }
  const pos = [], nrm = [], uv = [], col = [], idx = [];
  let s = 0;
  for (let i = 0; i < n; i++) {
    const pn = i > 0 ? en[i - 1] : (closed ? en[n - 2] : en[0]), nn = i < n - 1 ? en[i] : (closed ? en[0] : en[n - 2]);
    let mx = pn[0] + nn[0], mz = pn[1] + nn[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = 1 / Math.max(0.5, mx * nn[0] + mz * nn[1]);
    if (i > 0) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    for (const [d, v] of [[d0, 0], [d1, 1]]) {
      const x = P[i][0] + mx * k * d, z = P[i][1] + mz * k * d;
      pos.push(x, y, z); nrm.push(0, 1, 0);
      if (o.uvWorld) uv.push(x / o.uvWorld, z / o.uvWorld); else uv.push(s / o.uvAlong, v);
      if (o.col) col.push(...o.col(x, z));
    }
  }
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  // face up
  const cr = (pos[5] - pos[2]) * (pos[6] - pos[0]) - (pos[3] - pos[0]) * (pos[8] - pos[2]);                 // y of (B-A)x(C-A) for the first triangle (A = v0, B = v1, C = v2)
  if (cr < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (o.col) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}
/** is the left normal of the walking direction of this closed ring pointing inside it? */
function leftIsInside(ring) {
  const a = ring[0], b = ring[1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
  return inRing(ring, mx + dz / l * 0.4, mz - dx / l * 0.4);
}

export function build(K, ctx) {
  const P = K.P, G = K.G, GM = G.M;
  // road integrity: streets is built before this module; a lamp / bollard / candelabrum whose footprint reaches the real asphalt (parking pockets and fillets included) is left out (drawing and collider together)
  const st = ctx.services.streets, offRoad = (x, z, r = 0.3) => !st || st.net.cover(x, z, {}) < -(r + 0.3);
  const ground = (geo, mat, name) => {                                                // ground paving: receives shadows, casts none, no outline
    const m = new THREE.Mesh(geo, mat); m.name = name; m.castShadow = false; m.receiveShadow = true;
    try { ctx.noOutline(m); } catch (e) { /* older engine */ }
    K.root.add(m); K.tris += geo.index.count / 3; return m;
  };
  // ------------------------------------------------------------------ the stone field (OSM r1947507: a bell, base u -52 (136 m wide), tip u +90, corners rounded)
  const area = AREAS.find((a) => a.id === 'r1947507');
  let fieldRing = null;
  if (area) {
    fieldRing = ringOf(area.polys[0].o);
    const pitch = G.pavePitch;
    ground(polyGeo(fieldRing, [], 0.05, (x, z) => { const q = toUV(x, z); return [q.u / pitch, q.v / pitch]; }, 12), G.pave, 'lmG-stone-field');
    K.fieldRing = fieldRing;
    // the granite outline of the field (2 m, aerial 005: a double line all round) + the thick ring that frames the 4 x 4 fields round the column + its pink inlay
    const inside = leftIsInside(fieldRing);
    ground(ribbonGeo(fieldRing, { closed: true, d0: 0, d1: 1.9, y: 0.085, uvAlong: 4.8, flip: !inside, maxSeg: 6 }), G.band, 'lmG-field-border');
    ground(ribbonGeo(fieldRing, { closed: true, d0: 0.8, d1: 1.1, y: 0.1, uvAlong: 4.8, flip: !inside, maxSeg: 6 }), G.pinkInlay, 'lmG-field-inlay');
    const R = 2 * G.pavePitch, ringPts = [[-R, -R], [-R, R], [R, R], [R, -R]].map(([u, v]) => toWorld(u, v));
    ground(ribbonGeo(ringPts, { closed: true, d0: -1.4, d1: 1.4, y: 0.085, uvAlong: 4.8 }), G.band, 'lmG-column-ring');
    ground(ribbonGeo(ringPts, { closed: true, d0: -0.15, d1: 0.15, y: 0.1, uvAlong: 4.8 }), G.pinkInlay, 'lmG-column-ring-inlay');
  }
  // ------------------------------------------------------------------ the asphalt of the open square (OSM AREAS r1947508 = the whole square, 'area=square'): worn, blotchy (vertex colours from the world position)
  const sq = AREAS.find((x) => x.id === 'r1947508');
  const sqRing = sq ? ringOf(sq.polys[0].o) : null;
  if (sqRing) {
    ground(polyGeo(sqRing, [], 0.04, (x, z) => [x / 10, z / 10], 6, asphaltCol), G.asphaltV, 'lmG-square-asphalt');
    K.squareRing = sqRing;
  }
  const stripMat = K.mat('#ffffff', { map: G.asphaltTex, vertexColors: true, polygonOffset: -3.2, paint: 0.1, name: 'lmG-asphaltStrip' });
  // a strip of asphalt between the square polygon and the walls of the General Staff (the polygon stops ~8 m short); the pavement (granite lattice, 4.2 m) lies on its first metres
  for (const run of K.runs || []) {
    if (run.edges[0].zone === 'flank') continue;
    const pts = run.edges.map((e) => e.a).concat([run.edges[run.edges.length - 1].b]), e0 = run.edges[0];
    const dx = pts[1][0] - pts[0][0], dz = pts[1][1] - pts[0][1], flip = (dz * e0.n[0] - dx * e0.n[1]) < 0;
    ground(ribbonGeo(pts, { d0: 0, d1: 12, y: 0.058, uvWorld: 10, flip, col: asphaltCol, maxSeg: 6 }), stripMat, 'lmG-gs-strip');
  }
  // the same strip in front of the Triumphal Arch (the wing runs stop at its pylons): asphalt + granite pavement; streets draws a brick footway line there (OSM w1004402510) that these cover
  {
    const arc = [];
    for (let v = -34; v <= 34.01; v += 4) arc.push(toWorld(ARC_U + Math.sqrt(ARC_R * ARC_R - v * v), v));
    ground(ribbonGeo(arc, { d0: 0, d1: 12, y: 0.058, uvWorld: 10, flip: true, col: asphaltCol, maxSeg: 6 }), stripMat, 'lmG-arch-strip');
    ground(ribbonGeo(arc, { d0: 0, d1: 4.2, y: 0.12, uvWorld: 4, flip: true, maxSeg: 6 }), G.flagMatFlat, 'lmG-arch-pavement');
  }
  // ------------------------------------------------------------------ patches of newer / older asphalt (repairs): axis-aligned to the palace frame, away from the real carriageways whose lane lines streets draws
  if (sqRing && fieldRing) {
    const roads = ROADS.filter((r) => ['primary', 'secondary', 'tertiary', 'residential', 'service', 'unclassified'].includes(r.hw)).map((r) => ({ p: r.pts, w: r.w || 6 }));
    const nearRoad = (x, z) => roads.some((r) => { for (let i = 0; i + 3 < r.p.length; i += 2) { if (Math.abs(r.p[i] - x) > 90 && Math.abs(r.p[i + 2] - x) > 90) continue; if (distSeg(x, z, r.p[i], r.p[i + 1], r.p[i + 2], r.p[i + 3]) < r.w / 2 + 5) return true; } return false; });
    const rnd = lcg(31337), pg = new THREE.BufferGeometry(), pos = [], nrm = [], uv = [], col = [], idx = [];
    for (let n = 0, tries = 0; n < 48 && tries < 900; tries++) {
      const uc = -86 + rnd() * 200, vc = -118 + rnd() * 300, w = 2 + rnd() * rnd() * 14, d = 1.5 + rnd() * 5, a = (rnd() < 0.3 ? rnd() * 0.5 : 0);
      const cs = [[-w, -d], [w, -d], [w, d], [-w, d]].map(([x, y]) => toWorld(uc + (x * Math.cos(a) - y * Math.sin(a)) / 2, vc + (x * Math.sin(a) + y * Math.cos(a)) / 2));
      if (!cs.every((c) => inRing(sqRing, c[0], c[1]) && !inRing(fieldRing, c[0], c[1]) && !L.insideBuilding(c[0], c[1], 1))) continue;
      const m = toWorld(uc, vc); if (nearRoad(m[0], m[1])) continue;
      if (cs.some((c) => { const q = toUV(c[0], c[1]); return q.u < -60 && q.u > -96; })) continue;             // the zebra rows
      const dark = rnd() < 0.62, f = dark ? 0.72 + rnd() * 0.12 : 1.14 + rnd() * 0.14, b0 = pos.length / 3;
      for (const c of cs) { pos.push(c[0], 0.046, c[1]); nrm.push(0, 1, 0); uv.push(c[0] / 10, c[1] / 10); const k = asphaltCol(c[0], c[1]); col.push(k[0] * f, k[1] * f, k[2] * f * (dark ? 1.03 : 0.97)); }
      idx.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3);
      const cr = (pos[(b0 + 1) * 3 + 2] - pos[b0 * 3 + 2]) * (pos[(b0 + 2) * 3] - pos[b0 * 3]) - (pos[(b0 + 1) * 3] - pos[b0 * 3]) * (pos[(b0 + 2) * 3 + 2] - pos[b0 * 3 + 2]);
      if (cr < 0) { idx.length -= 6; idx.push(b0, b0 + 2, b0 + 1, b0, b0 + 3, b0 + 2); }
      n++;
    }
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); pg.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); pg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); pg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); pg.setIndex(idx);
    if (idx.length) ground(pg, G.asphaltPatch, 'lmG-asphalt-patches');
  }
  // ------------------------------------------------------------------ the marked strip in front of the Winter Palace (aerial 005, photo 016): 8 rows of long dashes along the front + a solid line, 1.5 m pitch
  {
    const y = 0.052, w = 0.5, v0 = -84, v1 = 128, seg = (u, va, vb, ww) => {
      const a = toWorld(u - ww / 2, va), b = toWorld(u - ww / 2, vb), c = toWorld(u + ww / 2, vb), d = toWorld(u + ww / 2, va);
      P.quad(G.mark, [a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], [d[0], y, d[1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    };
    for (let k = 0; k < 8; k++) for (let v = v0 + (k % 2) * 2; v < v1 - 3; v += 4) seg(-88.5 + k * 1.5, v, v + 3, w);
    for (let v = v0; v < v1; v += 20) seg(-76.6, v, Math.min(v + 20, v1), 0.35);
  }
  // ------------------------------------------------------------------ pavement along the General Staff fronts (granite lattice flags, 4.2 m, +12 cm)
  for (const run of K.runs || []) {
    if (run.edges[0].zone === 'flank') continue;
    band(P, run.edges, 0, 0.12, 4.2, { front: GM.graniteGrey, top: G.flagMat }, { uvs: 4 });
  }
  // ------------------------------------------------------------------ lamps along the fronts and in front of the Guards HQ
  const lamps = [];
  for (const run of K.runs || []) {
    if (run.edges[0].zone === 'flank') continue;
    let acc = 0, next = 14;
    for (const e of run.edges) {
      while (next < acc + e.len) {
        const t = (next - acc) / e.len, x = e.a[0] + (e.b[0] - e.a[0]) * t + e.n[0] * 5.6, z = e.a[1] + (e.b[1] - e.a[1]) * t + e.n[1] * 5.6;
        const q = toUV(x, z);
        if (!(Math.abs(q.v - (-1.3)) < 30 && q.u > 120)) lamps.push({ x, z, globes: lamps.length % 2 ? 3 : 2 });
        next += 36;
      }
      acc += e.len;
    }
  }
  const gq = L.buildingById('w41289421');
  if (gq) for (const [u, v] of [[-92, -121], [-70, -121], [-46, -121], [-24, -121]]) { const [x, z] = toWorld(u, v); lamps.push({ x, z, globes: 3 }); }
  const lampSpots = [];
  const putLamp = (x, z, globes) => {
    const item = ctx.physics.addCylinder(x, z, 0.22, 0, 6);
    const angle = lampAngle(x, z);
    if (ctx.knock || ctx.season === 'winter') lampSpots.push({ x, y: 0, z, rotY: -angle, globes, item });
    if (!ctx.knock) lamp(K, GM, P, x, z, globes, angle);
  };
  for (const l of lamps) { if (L.insideBuilding(l.x, l.z, 0.5) || !offRoad(l.x, l.z, 0.25)) continue; putLamp(l.x, l.z, l.globes); }
  // ------------------------------------------------------------------ lamp posts on the Winter Palace pavement (photo 016: black fluted poles every ~30 m, 2-3 m from the facade) and the bollards of the west road edge (photos 012 018)
  for (const [u, v, g] of [[-98.2, -14, 2], [-98.2, 14, 2], [-107.2, -45, 3], [-107.2, 45, 3], [-107.2, -80, 2], [-107.2, 80, 2]]) {
    const [x, z] = toWorld(u, v);
    if (L.insideBuilding(x, z, 0.8) || !offRoad(x, z, 0.25)) continue;
    putLamp(x, z, g);
  }
  if (lampSpots.length) {
    const bracket = ctx.season === 'winter' ? winterLampBracket(ctx) : null;
    if (ctx.knock) knockLamps(ctx, K, GM, lampSpots, bracket);
    else if (bracket) {
      const { meshes } = knockInstances(ctx, { name: 'lmG-lamp', parts: [bracket], spots: lampSpots });
      for (const mesh of meshes) registerLOD(mesh, bracket.far);
    }
  }
  for (let v = 94; v <= 162; v += 3.6) {
    const [x, z] = toWorld(-92.6, v);
    if (L.insideBuilding(x, z, 0.4) || !offRoad(x, z, 0.15)) continue;
    P.cyl(GM.graniteGrey, [x, 0, z], [x, 0.78, z], 0.15, 0.13, 8, true);
    P.cyl(GM.graniteStep, [x, 0.78, z], [x, 0.9, z], 0.13, 0.06, 8, true);
  }
  // ------------------------------------------------------------------ the four candelabra at the corners of the stone field
  for (const [u, v] of [[-47, 63], [-47, -63], [41, 46], [41, -46]]) { const [x, z] = toWorld(u, v); if (!offRoad(x, z, 0.35)) continue; candelabrum(K, GM, x, z); ctx.physics.addCylinder(x, z, 0.35, 0, 8); }
  // ------------------------------------------------------------------ spots for people / props
  const S = K.svc.spots;
  S.tourists = [toWorld(8, 9), toWorld(8, -9), toWorld(-30, 0), toWorld(60, 10), toWorld(100, -40), toWorld(100, 40), toWorld(120, 0)].map(([x, z]) => ({ x, z, kind: 'photo' }));
  S.painters = [toWorld(-60, 70), toWorld(-60, -70), toWorld(-84, 110)].map(([x, z]) => ({ x, z, kind: 'painter' }));
  S.column = { x: CX, z: CZ, fence: 8.25 };
  S.arch = { passage: [toWorld(120, -1.3), toWorld(200, -3)] };
  S.carriages = [toWorld(-155, -85), toWorld(-150, -81)].map(([x, z]) => ({ x, z }));
  S.stoneField = K.fieldRing || null;
}

// ---------------------------------------------------------------------------------------------- the Montferrand lamp: fluted cast-iron pole, collar, 2 or 3 opal globes
function lamp(K, GM, P, x, z, globes, ang) {
  const iron = GM.lamp;
  P.cyl(iron, [x, 0, z], [x, 0.18, z], 0.34, 0.3, 10, true);
  P.cyl(iron, [x, 0.18, z], [x, 1.5, z], 0.27, 0.17, 10, false);
  P.cyl(iron, [x, 1.5, z], [x, 1.62, z], 0.22, 0.22, 10, true);
  P.cyl(iron, [x, 1.62, z], [x, 6.2, z], 0.12, 0.085, 8, false);
  P.cyl(iron, [x, 6.2, z], [x, 6.4, z], 0.17, 0.12, 8, true);
  const globe = (gx, gy, gz, r) => P.geo(GM.globe, K.globeGeo || (K.globeGeo = new THREE.SphereGeometry(1, 10, 7)), gx, gy, gz, 0, 0, 0, r, r, r);
  if (globes === 3) globe(x, 6.75, z, 0.3); else P.geo(iron, K.finialGeo || (K.finialGeo = new THREE.ConeGeometry(0.1, 0.5, 6)), x, 6.65, z, 0, 0, 0, 1, 1, 1);
  for (const sgn of [-1, 1]) {
    const dx = Math.cos(ang) * sgn, dz = Math.sin(ang) * sgn;
    P.cyl(iron, [x, 6.0, z], [x + dx * 0.45, 6.4, z + dz * 0.45], 0.045, 0.035, 5, false);
    P.cyl(iron, [x + dx * 0.45, 6.4, z + dz * 0.45], [x + dx * 0.8, 6.25, z + dz * 0.8], 0.035, 0.03, 5, false);
    globe(x + dx * 0.82, 6.6, z + dz * 0.82, 0.27);
  }
}

/** the direction of the two arms (a facade-independent angle from the position) */
const lampAngle = (x, z) => ((x * 7.3 + z * 3.1) % 3.14);

// Lensvet's photo shows a one-sided golden quill with scalloped vanes, ruby
// ornaments and two curls around the shaft: https://lensvet.spb.ru/d/26909/d/dscf1345.jpg
// The plane follows the square perimeter so its silhouette reads from the plaza.
function winterLampBracket(ctx) {
  const wire = new VB(), gold = '#ffce78', champagne = '#fff2ba', ruby = '#ba3936';
  const spine = t => [0.15 + 2.52 * t * t, 2.64 + 3.64 * t, 0.015];
  const spinePoints = Array.from({ length: 9 }, (_, i) => spine(i / 8));
  wire.tube(spinePoints, 0.052, gold, 14, 4);
  for (let i = 0; i < 5; i++) {
    const t = 0.20 + 0.156 * i, a = spine(t), b = spine(t + 0.17);
    const lift = 0.41 - 0.06 * i;
    const tip = [b[0] + lift, b[1] - 0.095, 0.07];
    wire.tube([a, [a[0] + 0.30, a[1] + 0.10, 0.065], tip], 0.046, champagne, 5, 4);
    wire.tube([tip, [b[0] + 0.09, b[1] - 0.13, 0.045], b], 0.037, gold, 3, 4);
  }
  // The upper spray rises from the quill. Its red beads sit in gold cups
  // at the ends of fine stems. The stars pick up the nearby slide lights.
  const spray = [[0.18, 3.35, -0.01], [0.46, 4.58, -0.04], [1.05, 5.57, -0.055], [2.14, 6.35, -0.07]];
  wire.tube(spray, 0.044, gold, 10, 4);
  for (let i = 0; i < 7; i++) {
    const t = 0.35 + i * 0.085, base = spine(t);
    const bx = base[0] - 0.15, by = base[1] + 0.34;
    wire.rod(base, [bx, by, -0.10], 0.032, gold, 4);
    wire.sph(0.105, i % 3 === 1 ? champagne : ruby, [bx, by, -0.10], 6);
  }
  // Two hanging, four-point stars have a broad enough centre to catch the
  // evening light at the far end of the square.
  for (const t of [0.59, 0.85]) {
    const [x, y] = spine(t), cy = y - 0.28;
    wire.rod([x, y, 0.015], [x, cy + 0.19, 0.07], 0.028, gold, 4);
    wire.sph(1, champagne, [x, cy, 0.07], 4, [0.066, 0.22, 0.056]);
    wire.sph(1, champagne, [x, cy, 0.07], 4, [0.17, 0.058, 0.052]);
  }
  for (const [offset, color] of [[0, champagne], [0.19, ruby]]) {
    const points = Array.from({ length: 25 }, (_, i) => {
      const t = i / 24, a = t * Math.PI * 3.85;
      return [0.19 * Math.cos(a), 1.62 + offset + 1.31 * t, 0.19 * Math.sin(a)];
    });
    wire.tube(points, 0.045, color, 20, 4);
  }
  const mat = ctx.mat.emissive('#ffffff', 1).clone();
  mat.name = 'palace-winter-quill';
  mat.vertexColors = true;
  ctx.onUpdate(() => mat.color.setScalar(0.92 + 2.20 * ctx.shared.uNight.value));
  return {
    geo: wire.build(), mat, name: 'winter-quill', far: 320, shadow: false, receive: false, noOutline: true,
    place: spot => new THREE.Matrix4().makeRotationY(Math.atan2(spot.x - CX, spot.z - CZ))
      .setPosition(spot.x, spot.y, spot.z),
  };
}

/** the knockable lamps (ctx.knock): the pole + arms and the opal globes are templates at the origin (arms along +x, turned by rotY = -angle); the pole is ONE mesh for both kinds (the 3-globe lamp
 *  keeps the 2-globe lamp's little finial, hidden inside its top globe), the globes are one mesh per kind */
function knockLamps(ctx, K, GM, spots, bracket) {
  const model = (globes) => {
    const T = new Parts(); lamp(K, GM, T, 0, 0, globes, 0);
    const tmp = new THREE.Group(), meshes = T.build(tmp), pick = (mat) => meshes.find((m) => m.material === mat).geometry;
    return { body: pick(GM.lamp), glow: pick(GM.globe) };
  };
  const m2 = model(2), m3 = model(3);
  knockInstances(ctx, {
    name: 'lmG-lamp',
    parts: [
      { geo: m2.body, mat: GM.lamp, name: 'body' },
      { geo: m2.glow, mat: GM.globe, name: 'glow2', shadow: false, noOutline: true, hide: true, when: (s) => s.globes !== 3 },
      { geo: m3.glow, mat: GM.globe, name: 'glow3', shadow: false, noOutline: true, hide: true, when: (s) => s.globes === 3 },
      ...(bracket ? [bracket] : []),
    ],
    spots, items: spots.map((s) => s.item), far: 320, cell: 768,                                   // (18 lamps over ~330 m: two cells keep the draws at six)
    rec: { kind: 'lamp', mass: 600, h: 6.2, r: 0.22, anchored: 23, hitK: 0.7, metal: true },
  });
}

// ---------------------------------------------------------------------------------------------- five-lantern candelabrum (bronze-brown, dragon arms, amber lanterns)
function candelabrum(K, GM, x, z) {
  const P = K.P, bronze = GM.candel || (GM.candel = K.mat('#6b4a42', { name: 'lmG-candel' })), glass = GM.lantern || (GM.lantern = K.ctx.mat.emissive('#e8b665', 0.7));
  P.cyl(bronze, [x, 0, z], [x, 0.3, z], 0.42, 0.36, 10, true);
  P.cyl(bronze, [x, 0.3, z], [x, 2.2, z], 0.3, 0.2, 10, false);
  P.cyl(bronze, [x, 2.2, z], [x, 6.4, z], 0.15, 0.1, 8, false);
  P.cyl(bronze, [x, 4.4, z], [x, 4.6, z], 0.2, 0.2, 8, true);
  const lantern = (lx, ly, lz) => {
    P.cyl(glass, [lx, ly, lz], [lx, ly + 0.55, lz], 0.2, 0.28, 6, true);
    P.cyl(bronze, [lx, ly + 0.55, lz], [lx, ly + 0.85, lz], 0.3, 0.02, 6, true);
    P.cyl(bronze, [lx, ly - 0.06, lz], [lx, ly, lz], 0.2, 0.2, 6, true);
  };
  for (const [yy, ox, oz] of [[4.7, 1, 0], [4.7, -1, 0], [5.6, 0, 1], [5.6, 0, -1]]) {
    P.cyl(bronze, [x, yy - 0.5, z], [x + ox * 0.55, yy - 0.15, z + oz * 0.55], 0.07, 0.05, 5, false);
    P.cyl(bronze, [x + ox * 0.55, yy - 0.15, z + oz * 0.55], [x + ox * 0.95, yy - 0.15, z + oz * 0.95], 0.05, 0.04, 5, false);
    lantern(x + ox * 0.95, yy - 0.15, z + oz * 0.95);
  }
  lantern(x, 6.4, z);
}
