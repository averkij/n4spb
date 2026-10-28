// environment/boats.js - piers (landing stages) and tourist boats of the canals and the Neva (docs/research/west-canals-bridges.md section 5, 6; west-life-furniture.md).
// PIERS: every OSM pier polygon (PIERS of the data) that lies on the Moika, the Griboedov Canal, the Winter Canal or the Neva (the Fontanka stages are landmarksC's) becomes a floating
// pontoon: a steel deck 0.3 m above the water on dark floats with black tyre fenders, a white railing along the water side, a ticket kiosk with a green tarpaulin roof on the long ones.
// The oriented rectangle of the OSM polygon is used (position and size are the real ones: Kazansky north pier 3.8 x 13 m, Palace Embankment piers 12 x 45 m ...).
// BOATS (user rule: no flags): three instanced types with vertex colours - the glass-roofed "canal tram" (white hull, navy / red stripe, green foredeck, dark glass band, flat roof, < 2.3 m
// high for the 2.5-2.8 m bridges), the open two-deck tour boat (wooden benches, orange life buoys) and the speedboat (white, red / navy canopy). MOORED ones lie alongside the piers
// (outer long side, bow up-stream) and the quay walls; MOVING ones run back and forth on short reaches of the Moika (Green - Pevchesky, Red - Blue), the Griboedov Canal south of the
// Kazansky Bridge, the Winter Canal and the Neva (a hydrofoil + a tram): position, heading and bobbing are pure functions of t, a U-turn at each end of the reach.
// COLLIDERS (docs/water-transport-boat-collisions.md): every pontoon is a float block (lib/craft-solids.js addFloatBlock: stops the player's motor boat, a walker on the deck is not touched) and every boat, moored or moving,
// is a kinematic solid hull box (craftSolids: the pose is the same pure function of t that poses the mesh, the velocity comes with it). Everything is instanced / merged: ~8 draw calls.
// SERVICE (ctx.services.environment.boats): [{ id, type, key, moving, state(t) -> { x, z, yaw, speed } }], piers: [{ x, z, w, d, yaw, key, y }]
import * as THREE from 'three';
import * as L from '../layout.js';
import { PIERS } from '../data/city.js';
import { WATERWAYS, keepOut } from './waterways.js';
import { WATER as AREA_WATER } from '../lib/area-tables.js';
import { Acc, hash2 } from './util.js';
import { craftSolids, addFloatBlock, obbGap } from '../lib/craft-solids.js';

const C = (h) => new THREE.Color(h);

// ---------------------------------------------------------------- boat geometry (x = length, +x is the bow; origin = the waterline at the middle; y up)
function hullPrism(A, L0, W0, y0, y1, bow, col, grow = 0, stern = 0.0, ox = 0) {
  const l = L0 / 2 + grow, w = W0 / 2 + grow, b = Math.min(bow, L0 * 0.45);
  const pts = [[-l + ox, -w + stern], [l - b + ox, -w], [l + ox, 0], [l - b + ox, w], [-l + ox, w - stern]];
  const n = pts.length, c = C(col);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n], dx = q[0] - p[0], dz = q[1] - p[1], nl = Math.hypot(dx, dz) || 1, nx = dz / nl, nz = -dx / nl;
    const k = 0.9 + 0.1 * Math.abs(nx * 0.3 + nz);
    const v = [A.vert(p[0], y0, p[1], nx, 0, nz, c.r * k, c.g * k, c.b * k), A.vert(q[0], y0, q[1], nx, 0, nz, c.r * k, c.g * k, c.b * k), A.vert(q[0], y1, q[1], nx, 0, nz, c.r * k, c.g * k, c.b * k), A.vert(p[0], y1, p[1], nx, 0, nz, c.r * k, c.g * k, c.b * k)];
    A.tri(v[0], v[1], v[2]); A.tri(v[0], v[2], v[3]);
  }
  const top = pts.map((p) => A.vert(p[0], y1, p[1], 0, 1, 0, c.r, c.g, c.b));
  for (let i = 1; i + 1 < n; i++) A.tri(top[0], top[i + 1], top[i]);
}
function boxC(A, cx, cy, cz, sx, sy, sz, col, shade = 1) {
  const c = C(col), hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const F = [[[1, 0, 0], [[hx, -hy, -hz], [hx, -hy, hz], [hx, hy, hz], [hx, hy, -hz]]], [[-1, 0, 0], [[-hx, -hy, hz], [-hx, -hy, -hz], [-hx, hy, -hz], [-hx, hy, hz]]], [[0, 1, 0], [[-hx, hy, -hz], [hx, hy, -hz], [hx, hy, hz], [-hx, hy, hz]]], [[0, 0, 1], [[hx, -hy, hz], [-hx, -hy, hz], [-hx, hy, hz], [hx, hy, hz]]], [[0, 0, -1], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz]]]];
  for (const [nm, q] of F) {
    const k = shade * (nm[1] > 0 ? 1 : 0.92);
    const v = q.map((p) => A.vert(cx + p[0], cy + p[1], cz + p[2], nm[0], nm[1], nm[2], c.r * k, c.g * k, c.b * k));
    A.tri(v[0], v[1], v[2]); A.tri(v[0], v[2], v[3]);
  }
}
const WHITE = '#f1f2f0', NAVY = '#1f3050', RED = '#c43a34', GLASS = '#26343e', DECK = '#3a8a50', TYRE = '#1e1f21', WOOD = '#9a6a3c', ORANGE = '#e8742a', CANOPY_N = '#243a64', CANOPY_R = '#9c2a2a';

/** the geometry of one boat type; returns { geo, len, wid, h } */
function boatGeometry(type) {
  const A = new Acc(true);
  let len, wid, h;
  if (type === 'tram') {                         // glass-roof canal tram 13 x 3.2 m (2.2 m high)
    len = 13; wid = 3.2; h = 2.2;
    hullPrism(A, len, wid, -0.1, 0.78, 2.6, WHITE); hullPrism(A, len, wid, 0.08, 0.34, 2.6, RED, 0.02);
    hullPrism(A, len * 0.5, wid * 0.9, 0.77, 0.9, 1.5, DECK);                                 // green foredeck (bow part)
    boxC(A, len * 0.5 - 2.7, 0.78 + 0.65, 0, 3.0, 1.3, wid * 0.82, WHITE);                      // wheelhouse
    boxC(A, len * 0.5 - 2.7, 0.78 + 0.85, 0, 3.04, 0.55, wid * 0.84, GLASS);
    boxC(A, -0.9, 0.78 + 0.6, 0, 8.4, 1.2, wid * 0.86, GLASS);                                 // the long glass band
    for (let i = 0; i < 6; i++) boxC(A, -4.6 + i * 1.5, 0.78 + 0.6, 0, 0.12, 1.24, wid * 0.88, WHITE);   // pillars
    boxC(A, -0.7, 0.78 + 1.28, 0, 9.2, 0.14, wid * 0.94, WHITE);                               // flat roof
    boxC(A, -0.7, 0.78 + 1.36, 0, 5.4, 0.04, wid * 0.62, '#2b3b4a');                           // skylight
    for (const z of [-1, 1]) for (let i = 0; i < 4; i++) boxC(A, -3.6 + i * 2.4, 0.36, z * (wid / 2 + 0.05), 0.42, 0.42, 0.14, TYRE);
  } else if (type === 'open') {                  // open tour boat 12 x 3.4 m
    len = 12; wid = 3.4; h = 2.3;
    hullPrism(A, len, wid, -0.1, 0.9, 2.4, WHITE); hullPrism(A, len, wid, 0.0, 0.3, 2.4, NAVY, 0.02);
    boxC(A, len * 0.5 - 1.6, 0.9 + 0.55, 0, 2.6, 1.1, wid * 0.72, WHITE); boxC(A, len * 0.5 - 1.6, 0.9 + 1.12, 0, 2.8, 0.12, wid * 0.78, '#d8dad8');
    boxC(A, len * 0.5 - 1.6, 0.9 + 0.6, 0, 2.62, 0.4, wid * 0.74, GLASS);
    for (let i = 0; i < 6; i++) for (const z of [-0.65, 0.65]) boxC(A, -4.6 + i * 1.15, 0.9 + 0.22, z, 0.35, 0.44, 1.05, WOOD);   // benches
    for (const z of [-1, 1]) boxC(A, -1.2, 0.9 + 0.5, z * (wid / 2 - 0.1), 8.2, 0.05, 0.05, WHITE);     // railing
    for (const z of [-1, 1]) boxC(A, -1.2, 0.9 + 0.25, z * (wid / 2 - 0.1), 8.2, 0.05, 0.05, WHITE);
    for (let i = 0; i < 5; i++) for (const z of [-1, 1]) boxC(A, -5 + i * 2, 0.9 + 0.28, z * (wid / 2 - 0.1), 0.05, 0.56, 0.05, WHITE);
    for (const z of [-1, 1]) boxC(A, -2, 0.9 + 0.55, z * (wid / 2 - 0.04), 0.36, 0.36, 0.08, ORANGE);
    for (const z of [-1, 1]) for (let i = 0; i < 3; i++) boxC(A, -3.4 + i * 3, 0.36, z * (wid / 2 + 0.05), 0.4, 0.4, 0.14, TYRE);
  } else if (type === 'meteor') {                // the "Meteor" hydrofoil of the Peterhof line (photo refs/petro-water 17): 34.6 x 6 m, a long low white hull with a navy waist stripe, a swept glazed
    len = 34.6; wid = 6.0; h = 4.2;                 // forward saloon, the raised wheelhouse behind it, a long glazed main saloon and the open stern deck; here it runs slowly (hull-borne) inside the city
    hullPrism(A, len, wid, -0.25, 1.15, 7.5, WHITE, 0, 0.5); hullPrism(A, len, wid, 0.25, 0.62, 7.5, NAVY, 0.03, 0.5);
    hullPrism(A, len * 0.86, wid * 0.88, 1.14, 1.3, 6.0, '#d9dcdc');                                      // deck
    boxC(A, len * 0.5 - 9.2, 1.3 + 0.75, 0, 7.6, 1.5, wid * 0.74, WHITE); boxC(A, len * 0.5 - 9.2, 1.3 + 0.9, 0, 7.66, 0.75, wid * 0.76, GLASS);     // forward saloon
    hullPrism(A, 4.2, wid * 0.72, 1.3, 2.8, 2.6, WHITE, 0, 0);
    boxC(A, len * 0.5 - 14.6, 1.3 + 1.6, 0, 3.4, 1.5, wid * 0.56, WHITE); boxC(A, len * 0.5 - 14.4, 1.3 + 1.85, 0, 3.46, 0.7, wid * 0.58, GLASS);    // wheelhouse on top
    boxC(A, -3.6, 1.3 + 0.8, 0, 17.0, 1.6, wid * 0.78, WHITE); boxC(A, -3.6, 1.3 + 0.95, 0, 17.06, 0.8, wid * 0.8, GLASS);                          // main saloon
    for (let i = 0; i < 9; i++) boxC(A, -11.4 + i * 1.95, 1.3 + 0.95, 0, 0.16, 0.84, wid * 0.82, WHITE);                                           // window pillars
    boxC(A, -3.6, 1.3 + 1.66, 0, 17.4, 0.12, wid * 0.84, '#e4e6e6');                                                                                 // roof
    boxC(A, -len * 0.5 + 2.6, 1.3 + 0.5, 0, 4.4, 0.06, wid * 0.8, '#b9bcbc'); for (const z of [-1, 1]) boxC(A, -len * 0.5 + 2.6, 1.3 + 0.55, z * wid * 0.4, 4.4, 1.0, 0.06, WHITE);   // stern deck + bulwark
    boxC(A, len * 0.5 - 14.6, 1.3 + 2.75, 0, 0.12, 0.9, 0.12, '#8a8f93');                                                                           // a bare mast (no flag)
    for (const z of [-1, 1]) for (let i = 0; i < 5; i++) boxC(A, -11 + i * 5.2, 0.5, z * (wid / 2 + 0.06), 0.5, 0.5, 0.16, TYRE);
  } else {                                       // speedboat 7 x 2.4 m
    len = 7; wid = 2.4; h = 2.0;
    hullPrism(A, len, wid, -0.1, 0.62, 2.6, WHITE); hullPrism(A, len, wid, 0.05, 0.26, 2.6, RED, 0.02);
    boxC(A, -0.2, 0.62 + 0.3, 0, 2.2, 0.6, wid * 0.7, '#e9ebe9'); boxC(A, 0.9, 0.62 + 0.55, 0, 0.12, 0.5, wid * 0.66, GLASS);
    boxC(A, -1.0, 0.62 + 1.2, 0, 2.6, 0.12, wid * 0.8, CANOPY_N);
    for (const x of [-2.1, 0.1]) for (const z of [-1, 1]) boxC(A, x, 0.62 + 0.8, z * wid * 0.36, 0.06, 1.0, 0.06, '#d8dad8');
    boxC(A, -3.2, 0.2, 0, 0.5, 0.5, 0.5, '#2a2a2c');
    void CANOPY_R;
  }
  return { geo: A.geometry(), len, wid, h };
}

// ---------------------------------------------------------------- piers
/** a Catmull-Rom curve through the control points of a track as a polyline with a vertex every ~`step` m (the lane of a boat is an offset of the track: a vertex with a sharp angle would jump the lane sideways) */
function smooth(cp, step = 10) {
  const out = [cp[0].slice()];
  for (let i = 0; i + 1 < cp.length; i++) {
    const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(cp.length - 1, i + 2)], n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  return out;
}
/** oriented rectangle of a polygon ring: { cx, cz, ax, az (unit long axis), len, wid } */
/** every OSM pier polygon on the Moika / Griboedov Canal / Winter Canal / Neva inside PLAY as an oriented rectangle: [{ cx, cz, ax, az, len, wid, key, y, id }] (the Fontanka stages are landmarksC's) */
export function pierRects() {
  const out = [];
  for (const p of PIERS) p.polys.forEach((poly, pi) => {
    const r = { ...orientedRect(poly.o), ...(AREA_WATER.pierFit[p.id + '#' + pi] || {}) };      // (WATER.pierFit of the area: the rectangle of a pier polygon whose bounding rectangle is much wider than the pier, Vasilyevsky-Okrug 7)
    if (r.len < 5 || r.wid < 1) return;
    const key = L.waterwayAt(r.cx, r.cz);
    if (!key || key === 'fontanka') return;       // (the Fontanka stages are landmarksC's)
    if (!L.inPlay(r.cx, r.cz, -30)) return;
    if (L.claimedBy(p.id) || keepOut(r.cx, r.cz)) return;                // a landing stage that a sight module draws itself / its berth (waterways.js KEEP_OUT: a landmark's own pier)
    out.push({ ...r, key, y: WATERWAYS[key].water, id: p.id + '#' + pi });
  });
  return out;
}
function orientedRect(o) {
  const n = o.length / 2; let cx = 0, cz = 0; for (let i = 0; i < n; i++) { cx += o[i * 2]; cz += o[i * 2 + 1]; } cx /= n; cz /= n;
  let sxx = 0, sxz = 0, szz = 0; for (let i = 0; i < n; i++) { const dx = o[i * 2] - cx, dz = o[i * 2 + 1] - cz; sxx += dx * dx; sxz += dx * dz; szz += dz * dz; }
  const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ax = Math.cos(th), az = Math.sin(th);
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (let i = 0; i < n; i++) { const dx = o[i * 2] - cx, dz = o[i * 2 + 1] - cz, u = dx * ax + dz * az, v = -dx * az + dz * ax; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const mu = (u0 + u1) / 2, mv = (v0 + v1) / 2;
  return { cx: cx + ax * mu - az * mv, cz: cz + az * mu + ax * mv, ax, az, len: u1 - u0, wid: v1 - v0 };
}

export function buildBoats(ctx, root, quay) {
  const T = ctx.THREE || THREE;
  const out = { piers: [], boats: [], triangles: 0 };
  const rng = ctx.rng('env-boats');
  const group = new T.Group(); group.name = 'env-boats'; root.add(group);
  const dyn = new T.Group(); dyn.name = 'env-boats-dyn';
  // ---- pontoon meshes (merged vertex-coloured static mesh)
  const PA = new Acc(true);
  const piers = pierRects().map((r) => {                                              // a pier that quay.js attached to a descent (walkable) is moved beside its lower landing
    const ov = quay.pierOverride && quay.pierOverride[r.id];
    return ov ? { ...r, ...ov, attached: true } : r;
  });
  for (const p of piers) {
    const yaw = Math.atan2(-p.az, p.ax), top = p.y + 0.32, wid = Math.max(2.2, p.wid), len = Math.max(5, p.len);
    const lc = (u, v) => [p.cx + p.ax * u - p.az * v, p.cz + p.az * u + p.ax * v];
    const place = (u, v, cy, sx, sy, sz, col) => {                                  // an axis-aligned (in the pier frame) box
      const [x, z] = lc(u, v), A2 = new Acc(true); boxC(A2, 0, 0, 0, sx, sy, sz, col);
      const c = Math.cos(yaw), s = Math.sin(yaw), base = PA.count;
      for (let i = 0; i < A2.p.length; i += 3) { const lx = A2.p[i], ly = A2.p[i + 1], lz = A2.p[i + 2], nx = A2.n[i], nz = A2.n[i + 2]; PA.vert(x + lx * c + lz * s, cy + ly, z - lx * s + lz * c, nx * c + nz * s, A2.n[i + 1], -nx * s + nz * c, A2.c[i], A2.c[i + 1], A2.c[i + 2]); }
      for (const k of A2.i) PA.i.push(base + k);
    };
    place(0, 0, p.y + 0.12, len, 0.36, wid, '#2b2f33');                                // floats (dark steel body from 6 cm under the water line to 0.30 above it: 2 cm under the deck plate, no coplanar tops; nothing deeper, the outline pass sees through the water)
    place(0, 0, top - 0.025, len + 0.02, 0.05, wid + 0.02, '#6f7378');               // deck plate
    place(0, 0, top + 0.015, len - 0.4, 0.02, wid - 0.4, '#8a8f93');                  // lighter walking surface (its top 2.5 cm above the plate)
    // fenders along the long sides
    for (let u = -len / 2 + 1; u < len / 2; u += 3) for (const sg of [-1, 1]) place(u, sg * (wid / 2 + 0.1), p.y + 0.16, 0.34, 0.32, 0.2, TYRE);
    // railing along the water side (the side away from the wall = the side with more water around)
    const wallSide = bankSide(p), rs = -wallSide, rail = '#e6e8e6';
    if (!p.attached) {      // (the railing of a pier at a descent is a row of breakable bays built by quay.js: docs/AREAS.md 13.7)
    place(0, rs * (wid / 2 - 0.08), top + 0.95, len - 0.2, 0.05, 0.05, rail); place(0, rs * (wid / 2 - 0.08), top + 0.5, len - 0.2, 0.04, 0.04, rail);
    for (let u = -len / 2 + 0.2; u <= len / 2; u += 2.4) place(u, rs * (wid / 2 - 0.08), top + 0.5, 0.06, 1.0, 0.06, rail);
    }
    if (len > 14) {                                                                  // the ticket kiosk: a booth with a green tarpaulin roof
      place(-len / 2 + 3, -rs * 0.0, top + 1.25, 3.0, 2.5, Math.min(2.4, wid - 0.5), '#e4e6e2'); place(-len / 2 + 3, 0, top + 1.55, 3.08, 0.9, Math.min(2.48, wid - 0.42), GLASS);
      place(-len / 2 + 3, 0, top + 2.62, 3.5, 0.16, Math.min(2.9, wid - 0.2), '#3d6f46');
    }
    out.piers.push({ x: p.cx, z: p.cz, len, wid, yaw, key: p.key, y: p.y + 0.32, id: p.id });
    addFloatBlock(ctx.physics, p.cx, p.cz, len + 0.04, wid + 0.4, yaw, p.y);                  // the deck + floats + the tyre fenders (0.2 m beyond each long side): a boat cannot ride over a pontoon
  }
  function bankSide(p) {                                                              // +1 when the nearest bank lies on the +v side of the pier frame
    let best = null;
    for (const q of quay.segments) { if (q.key !== p.key) continue; const mx = (q.ax + q.bx) / 2, mz = (q.az + q.bz) / 2, d = Math.hypot(mx - p.cx, mz - p.cz); if (!best || d < best.d) best = { d, mx, mz }; }
    if (!best) return 1;
    return (-(best.mx - p.cx) * p.az + (best.mz - p.cz) * p.ax) >= 0 ? 1 : -1;
  }
  if (PA.count) {
    const m = new T.Mesh(PA.geometry(), ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.03, name: 'env-piers' })); m.name = 'env-piers'; m.castShadow = true; m.receiveShadow = true; group.add(m);
    out.triangles += PA.i.length / 3;
  }

  // ---- boats: instanced per type
  const types = { tram: boatGeometry('tram'), open: boatGeometry('open'), speed: boatGeometry('speed'), meteor: boatGeometry('meteor') };
  const list = [];                                                                    // { type, key, y, base: {x,z,yaw}, state? }
  const wet = (x, z) => L.inRiver(x, z);
  // moored: along the outer side of the pontoons, alternating types
  const pierBoxes = piers.map((p) => ({ cx: p.cx, cz: p.cz, hw: (Math.max(5, p.len) + 0.04) / 2, hd: (Math.max(2.2, p.wid) + 0.4) / 2, c: Math.cos(Math.atan2(-p.az, p.ax)), s: Math.sin(Math.atan2(-p.az, p.ax)) })), berthed = [];      // (the float blocks; the boats already moored)
  piers.forEach((p, pi) => {
    const wallSide = bankSide(p), outer = -wallSide, kinds = p.key === 'neva' ? ['tram', 'open', 'tram'] : ['open', 'tram', 'speed', 'open'];
    const yaw = Math.atan2(-p.az, p.ax);
    let u = -p.len / 2 + 1.2, k = pi;
    for (let n = 0; n < 4; n++) {
      const type = kinds[(k++) % kinds.length], G = types[type];
      if (p.key !== 'neva' && type === 'tram' && G.len > p.len + 6) continue;
      if (u + G.len > p.len / 2 + 6) break;
      const cu = u + G.len / 2, cv = outer * (Math.max(2.2, p.wid) / 2 + G.wid / 2 + 0.3), x = p.cx + p.ax * cu - p.az * cv, z = p.cz + p.az * cu + p.ax * cv;
      const ends = [-G.len / 2, G.len / 2].map((e) => [x + p.ax * e, z + p.az * e]);
      const by = Math.atan2(-p.az, p.ax), box = { cx: x, cz: z, hw: G.len / 2, hd: G.wid / 2, c: Math.cos(by), s: Math.sin(by) };
      const free = pierBoxes.every((q) => obbGap(box, q) > -0.05) && berthed.every((q) => obbGap(box, q) > -0.05);      // (a berth beside one landing stage must not lie in the next stage or in its boats)
      if (free && wet(x, z) && !keepOut(x, z, 8) && ends.every(([ex, ez]) => wet(ex, ez))) berthed.push(box), list.push({ type, key: p.key, y: p.y, x, z, yaw: p.ax >= 0 || hash2(pi, n, 3) < 0.5 ? yaw : yaw + Math.PI, moored: true });
      u += G.len + 1.0;
    }
  });
  // moored along the walls: a short row below the Green Bridge (east wall) and on the Griboedov Canal south of Kazansky (the west pontoon boats are on the piers)
  // moving boats: back and forth on a reach
  // A PAIR of boats shares one track, run in opposite directions on the two lanes (the second one has the reversed points; its normal is the reverse of the first one's, so the SAME sign of `off` is the
  // OTHER lane: with `off: -x` it ran on the lane of its partner and the two sailed through each other). The lanes are far enough apart for a hull that turns on the spot (radius = half the diagonal of
  // the hull) to clear a boat that passes on the other lane (half the lane distance >= the radius + half the beam of the passing one), and the second boat of a pair keeps `inset` m more off the ends of the
  // track (its lap time is that of the full reach: it is a little slower), so that the two turning zones are far apart (distance between the turning centres > the sum of the two radii): they never meet,
  // whatever the phases of their laps are (tools/boat-craft-test.mjs 5, the sweep).
  const GREEN = smooth([[-1786.5, -790], [-1789.5, -755], [-1783.5, -700], [-1770.5, -630], [-1762.5, -585], [-1761, -520], [-1761.5, -470]]);       // the Moika between the Green and the Pevchesky Bridge, clear of the pontoon at 586 and its moored boats (the west side of the channel)
  const REACHES = [
    { id: 'moika-green', key: 'moika', type: 'open', pts: GREEN, v: 2.2, off: 4.3 },
    { id: 'moika-green2', key: 'moika', type: 'tram', pts: GREEN.slice().reverse(), v: 2.0, off: 4.3, inset: 11, phase: 0.5 },
    { id: 'moika-red', key: 'moika', type: 'tram', pts: [[-2060, -40], [-2160, 0], [-2270, 44], [-2300, 56]], v: 2.4, off: 4.3 },
    { id: 'moika-red2', key: 'moika', type: 'speed', pts: [[-2300, 56], [-2270, 44], [-2160, 0], [-2060, -40]], v: 4.2, off: 4.3, inset: 8, phase: 0.3 },
    { id: 'griboedov-s', key: 'griboedov', type: 'tram', pts: [[-1410, -240], [-1423, -176], [-1439, -98], [-1452, -35]], v: 1.9, off: 0 },
    { id: 'winter', key: 'winter-canal', type: 'open', pts: [[-1795, -972], [-1853, -1049], [-1880, -1085]], v: 1.3, off: 0 },
    // the Mars Field reach (docs/research/mars-bridges-canals.md section 6: the Moika and the Fontanka carry tourist boats, the Swan Canal none): between the 1st and 2nd Sadovy bridges
    { id: 'moika-garden', key: 'moika', type: 'open', pts: [[-915, -958], [-991, -970], [-1049, -982], [-1108, -994], [-1150, -1003]], v: 2.1, off: 4.5, phase: 0.15 },
    { id: 'moika-garden2', key: 'moika', type: 'tram', pts: [[-1150, -1003], [-1108, -994], [-1049, -982], [-991, -970], [-915, -958]], v: 1.9, off: 4.5, inset: 10, phase: 0.65 },
    { id: 'neva-hydro', key: 'neva', type: 'tram', pts: [[-2030, -1190], [-2140, -1110], [-2260, -1020], [-2300, -990]], v: 5.5, off: 0, size: 1.7, phase: 0.2 },
    { id: 'neva-tour', key: 'neva', type: 'open', pts: [[-2300, -1020], [-2200, -1100], [-2110, -1170], [-2030, -1230]], v: 3.2, off: 0, size: 1.4, phase: 0.6 },
    { id: 'neva-meteor', key: 'neva', type: 'meteor', pts: [[-2520, -800], [-2700, -700], [-2950, -520], [-3000, -492]], v: 7.5, off: 0, phase: 0.3 },
  ];
  const moving = [];
  for (const R of REACHES) {
    const pts = R.pts, seg = [], tot = []; let s = 0;
    for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(l); tot.push(s); s += l; }
    const Lr = s, G = types[R.type], sz = R.size || 1;
    // validate: the reach must be water and the offset lane too
    let ok = true; for (let q = 0; q <= 20; q++) { const a = at(q / 20 * Lr); if (!wet(a.x + a.nx * R.off, a.z + a.nz * R.off) || keepOut(a.x + a.nx * R.off, a.z + a.nz * R.off, 6)) { ok = false; break; } }
    if (!ok) continue;
    function at(sv) {
      sv = Math.max(0, Math.min(Lr, sv)); let i = 0; while (i + 1 < seg.length && tot[i] + seg[i] < sv) i++;
      const u = (sv - tot[i]) / (seg[i] || 1), a = pts[i], b = pts[i + 1], tx = (b[0] - a[0]) / (seg[i] || 1), tz = (b[1] - a[1]) / (seg[i] || 1);
      return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, tx, tz, nx: -tz, nz: tx };
    }
    const inset = R.inset || 0, lo = G.len * sz / 2 + 2 + inset, hi = Lr - G.len * sz / 2 - 2 - inset;      // (the turning centres; `inset`: see the pairs above)
    const turn = R.turn || 6, run = Math.max(1, (Lr - G.len * sz - 4) / R.v), period = 2 * (run + turn), ph = (R.phase || 0), vel = (hi - lo) / run;      // (the lap is that of the full reach at R.v)
    const state = (t) => {
      let q = (((t / period) + ph) % 1) * period, dir = 1, along, spin = 0, speed = vel;
      if (q < run) { along = lo + q * vel; }
      else if (q < run + turn) { along = hi; dir = 1; spin = (q - run) / turn; speed = 0; }
      else if (q < 2 * run + turn) { along = hi - (q - run - turn) * vel; dir = -1; }
      else { along = lo; dir = -1; spin = (q - 2 * run - turn) / turn; speed = 0; }
      const a = at(along), x = a.x + a.nx * R.off, z = a.z + a.nz * R.off;
      let yaw = Math.atan2(-(a.tz * dir), a.tx * dir);
      if (spin > 0) yaw += Math.PI * spin * spin * (3 - 2 * spin);
      return { x, z, yaw, speed };
    };
    list.push({ type: R.type, key: R.key, y: WATERWAYS[R.key].water, moving: true, state, size: sz, id: R.id, v: Math.max(R.v, vel) });
    moving.push(list[list.length - 1]);
  }
  // the hulls as solids (the same pose function as the mesh): hull box = the model's length x beam times the size, up to the roof
  const craft = craftSolids(ctx);
  list.forEach((b, i) => {
    const G = types[b.type], sz = b.size || 1;
    craft.add({ id: b.id || ('moored' + i), kind: b.type, key: b.key, y: b.y, w: G.len * sz, d: G.wid * sz, h: G.h * sz, moving: !!b.moving, speed: b.v,
      pose: b.moving ? (t, o) => { const s = b.state(t); o.x = s.x; o.z = s.z; o.rot = s.yaw; } : (t, o) => { o.x = b.x; o.z = b.z; o.rot = b.yaw; } });
  });
  // instanced meshes
  const byType = { tram: [], open: [], speed: [], meteor: [] };
  for (const b of list) byType[b.type].push(b);
  const mat = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.03, name: 'env-boats' });
  const m4 = new T.Matrix4(), qt = new T.Quaternion(), pos = new T.Vector3(), sc = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  const meshes = {};
  for (const type of Object.keys(byType)) {
    const arr = byType[type]; if (!arr.length) continue;
    const im = new T.InstancedMesh(types[type].geo, mat, arr.length); im.name = 'env-boat-' + type; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
    im.instanceMatrix.setUsage(T.DynamicDrawUsage); meshes[type] = im; dyn.add(im);
    arr.forEach((b, i) => { b.mesh = im; b.idx = i; });
    out.triangles += (types[type].geo.index ? types[type].geo.index.count : types[type].geo.attributes.position.count) / 3 * arr.length;
  }
  const put = (b, x, z, yaw, t) => {
    const bob = Math.sin(t * 0.9 + b.idx * 1.7) * 0.025, roll = Math.sin(t * 0.7 + b.idx) * 0.012;
    qt.setFromEuler(new T.Euler(roll, yaw, 0, 'YXZ')); const s = b.size || 1;
    m4.compose(pos.set(x, b.y + bob, z), qt, sc.set(s, s, s)); b.mesh.setMatrixAt(b.idx, m4);
  };
  const T0 = 0;
  for (const b of list) { if (b.moored) put(b, b.x, b.z, b.yaw, 0); else { const s = b.state(T0); put(b, s.x, s.z, s.yaw, T0); } }
  for (const im of Object.values(meshes)) im.instanceMatrix.needsUpdate = true;
  ctx.add(dyn);
  ctx.onUpdate((dt, t) => {
    for (const b of list) { if (b.moored) { put(b, b.x, b.z, b.yaw, t); } else { const s = b.state(t); put(b, s.x, s.z, s.yaw, t); } }
    for (const im of Object.values(meshes)) im.instanceMatrix.needsUpdate = true;
  });
  out.boats = list.map((b, i) => ({ id: b.id || ('moored' + i), type: b.type, key: b.key, moving: !!b.moving, state: b.moving ? b.state : () => ({ x: b.x, z: b.z, yaw: b.yaw, speed: 0 }) }));
  return out;
}
void hash2;
