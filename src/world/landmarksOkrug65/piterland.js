// The glazed shopping wings, waterfront apron, silver membrane dome and small
// roof lantern. Primary references: OAM / Intercolumnium and piterland.ru/about.
import * as THREE from 'three';
import { SITES } from './sites.js';
import { ringFromFlat, addPolyColliders, signedArea } from '../lib/massing.js';

const TAU = Math.PI * 2, CX = -7870.5, CZ = -5389.2;
function record(ctx, id) {
  return ctx.L?.groupMembers?.('okrug65-piterland')?.find(b => b.id === id) || SITES.find(b => b.id === id);
}
// The frame's local +Z is left of its +X edge, so clockwise rings put facade
// pieces outside the footprint. The roof triangulator accepts either winding.
function outward(ring) { return signedArea(ring) > 0 ? [...ring].reverse() : ring; }

// Parking/service lanes may end exactly on the mapped mall outline. Keep the
// low, projecting fascia's horizontal cap off the actual drawn carriageway;
// otherwise its 52 cm top visually replaces a short piece of asphalt. The
// facade wall and the upper floor bands still follow the complete footprint.
function lowBandSpans(ctx, a, rot, len) {
  const net = ctx.services.streets?.net || ctx._roadPlan;
  if (!net?.cover) return [[0, len]];
  const c = Math.cos(rot), s = Math.sin(rot), spans = [];
  let start = null;
  for (let u = 0; u < len; u += 0.5) {
    const end = Math.min(len, u + 0.5);
    const clear = [u, (u + end) / 2, end].every(t => [0.015, 0.11].every(v => net.cover(a[0] + c * t + s * v, a[1] - s * t + c * v, {}) < -0.15));
    if (clear && start === null) start = u;
    if (!clear && start !== null) { spans.push([start, u]); start = null; }
  }
  if (start !== null) spans.push([start, len]);
  return spans;
}

function wing(K, rec, top, facade = true) {
  const { P, M, ctx } = K;
  for (const poly of rec.polys) {
    const ring = outward(ringFromFlat(poly.o));
    P.far = Infinity;
    P.cap(M.roof, ring, top, true, 8, (poly.h || []).map(ringFromFlat));
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1];
      const len = Math.hypot(dx, dz); if (len < 0.2) continue;
      const rot = Math.atan2(-dz, dx);
      P.push(a[0], 0, a[1], rot);
      P.box(facade ? M.glass : M.wall, 0, len, 0, top, -0.15, 0, 'bkt');
      // Wide silver floor spandrels sit flush with the dark curtain wall.
      for (const y of facade ? [0.12, 6.7, 13.3, 20.0, 26.6] : [3.6]) {
        if (y >= top) continue;
        const spans = y < 0.6 ? lowBandSpans(ctx, a, rot, len) : [[0, len]];
        for (const [u0, u1] of spans) P.box(M.panel, u0, u1, y, Math.min(top, y + 0.4), 0.015, 0.11, 'bk');
      }
      P.far = 600;
      if (facade) {
        const bays = Math.max(1, Math.round(len / 2.3)), pitch = len / bays;
        for (let bay = 0; bay < bays; bay++) {
          const u = bay * pitch;
          // The pale upper reflections make the long blue glazed facade legible
          // without transparent district-wide surfaces or per-window materials.
          for (let f = 0; f < 4; f++) {
            const y = 1.1 + f * 6.6, tint = (bay + f * 3 + i) % 5;
            if (tint < 2) P.box(tint ? M.glassLight : M.glassBlue, u + 0.09, u + pitch - 0.07, y, y + 4.8, 0.014, 0.025, 'bklrt');
            P.box(M.steel, u, u + 0.065, y - 0.4, y + 5.2, 0.025, 0.085, 'bk');
            P.box(M.steel, u, u + pitch, y + 2.7, y + 2.755, 0.03, 0.09, 'bk');
          }
        }
      } else {
        // Low curved waterfront retail strip beneath the dome.
        const bays = Math.max(1, Math.floor(len / 3.5));
        for (let j = 0; j < bays; j++) {
          const u = (j + 0.5) * len / bays, w = Math.min(2.6, len / bays - 0.3);
          P.box(M.dark, u - w / 2, u + w / 2, 0.25, 3.5, 0.012, 0.065, 'bk');
          P.box(M.glassBlue, u - w / 2 + 0.07, u + w / 2 - 0.07, 0.5, 3.3, 0.07, 0.085, 'bklrt');
        }
      }
      P.pop();
      // Building walls follow the complete mapped ring. They never extend into
      // the bay, the promenade or the adjacent yacht-bridge navigation channel.
    }
    addPolyColliders(ctx, poly, 0, top, 0.22);
  }
}

function dome(K) {
  const { P, M } = K, r = 45.6, rise = 43, base = 8, segments = 80, stacks = 22;
  P.push(CX, 0, CZ); P.far = Infinity;
  // Ellipsoidal membrane: exact mapped footprint and mapped 51 m summit. The
  // profile is preserved as skyline geometry, rather than vanishing near detail.
  const point = (a, t, lift = 0) => [Math.cos(a) * (r * Math.cos(t) + lift), base + rise * Math.sin(t) + lift, Math.sin(a) * (r * Math.cos(t) + lift)];
  for (let a = 0; a < segments; a++) for (let j = 0; j < stacks; j++) {
    const a0 = a * TAU / segments, a1 = (a + 1) * TAU / segments;
    const t0 = j * Math.PI / (2 * stacks), t1 = (j + 1) * Math.PI / (2 * stacks);
    const n = [Math.cos((a0 + a1) / 2) * Math.cos((t0 + t1) / 2), Math.sin((t0 + t1) / 2), Math.sin((a0 + a1) / 2) * Math.cos((t0 + t1) / 2)];
    P.quad(a % 4 === 0 ? M.silverShade : M.silver, point(a0, t0), point(a1, t0), point(a1, t1), point(a0, t1), n);
  }
  // The real membrane is opaque silver from outside, with narrowly raised
  // seams. Timber arch ends remain visible through the glazed drum below it.
  P.far = 1100;
  for (let i = 0; i < 40; i++) {
    const a = i * TAU / 40;
    for (let j = 0; j < 18; j++) P.cyl(M.silverSeam, point(a, j * Math.PI / 36, 0.05), point(a, (j + 1) * Math.PI / 36, 0.05), 0.06, 0.06, 4, false);
  }
  P.far = 650;
  for (let i = 0; i < 40; i++) {
    const a0 = i * TAU / 40, a1 = (i + 1) * TAU / 40;
    const A = [r * Math.cos(a0), r * Math.sin(a0)], B = [r * Math.cos(a1), r * Math.sin(a1)];
    P.quad(M.glass, [A[0], 4, A[1]], [B[0], 4, B[1]], [B[0], 8, B[1]], [A[0], 8, A[1]], [Math.cos(a0), 0, Math.sin(a0)]);
    P.cyl(M.timber, [A[0], 4, A[1]], [A[0], 8.12, A[1]], 0.16, 0.13, 6);
    P.cyl(M.steel, [A[0], 4.35, A[1]], [B[0], 4.35, B[1]], 0.1, 0.1, 5);
    P.cyl(M.silverSeam, [A[0], 8, A[1]], [B[0], 8, B[1]], 0.14, 0.14, 5);
  }
  P.pop();
}

function lantern(K, rec) {
  const { P, M } = K;
  for (const poly of rec.polys) {
    const ring = ringFromFlat(poly.o), xs = ring.map(p => p[0]), zs = ring.map(p => p[1]);
    const x = (Math.min(...xs) + Math.max(...xs)) / 2, z = (Math.min(...zs) + Math.max(...zs)) / 2;
    const rx = (Math.max(...xs) - Math.min(...xs)) / 2, rz = (Math.max(...zs) - Math.min(...zs)) / 2;
    P.far = 1200;
    for (let i = 0; i < 32; i++) for (let j = 0; j < 6; j++) {
      const a0 = i * TAU / 32, a1 = (i + 1) * TAU / 32, t0 = j * Math.PI / 12, t1 = (j + 1) * Math.PI / 12;
      const p = (a, t) => [x + rx * Math.cos(a) * Math.cos(t), 27.05 + 2.95 * Math.sin(t), z + rz * Math.sin(a) * Math.cos(t)];
      P.quad(i % 4 ? M.glassLight : M.steel, p(a0, t0), p(a1, t0), p(a1, t1), p(a0, t1), [Math.cos(a0), Math.sin(t0), Math.sin(a0)]);
    }
  }
}

function flyArena(K) {
  const { P, M, ctx } = K, x = -7952.6, z = -5348.4;
  wing(K, record(ctx, 'w294050494'), 2.3, false);
  // The operator's waterfront photograph shows a mirrored truncated
  // icosahedron above this pavilion: silver hexagons and dark glazed pentagons.
  // It is the conspicuous football-shaped volume beside the big dome.
  P.far = 900;
  const original = new THREE.IcosahedronGeometry(1, 0), a = original.attributes.position, vertices = [], faces = [], keys = new Map();
  const id = p => {
    const key = p.toArray().map(v => v.toFixed(5)).join(',');
    if (!keys.has(key)) { keys.set(key, vertices.length); vertices.push(p); }
    return keys.get(key);
  };
  for (let i = 0; i < a.count; i += 3) faces.push([id(new THREE.Vector3().fromBufferAttribute(a, i)), id(new THREE.Vector3().fromBufferAttribute(a, i + 1)), id(new THREE.Vector3().fromBufferAttribute(a, i + 2))]);
  original.dispose();
  const edges = new Map(), adjacent = vertices.map(() => new Set());
  const point = (u, v) => {
    const key = u + ':' + v;
    if (!edges.has(key)) edges.set(key, vertices[u].clone().multiplyScalar(2 / 3).addScaledVector(vertices[v], 1 / 3));
    return edges.get(key);
  };
  const scale = 4.7 / vertices[0].clone().multiplyScalar(2 / 3).addScaledVector(vertices[faces[0].find(i => i !== 0) ?? 1], 1 / 3).length();
  const drawFace = (points, mat) => {
    const centre = points.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / points.length), n = centre.clone().normalize();
    const ps = points.map(p => [x + p.x * scale, 6.8 + p.y * scale, z + p.z * scale]);
    P.fan(mat, ps, n.toArray());
    P.ranged(500, () => { for (let i = 0; i < ps.length; i++) P.cyl(M.steel, ps[i], ps[(i + 1) % ps.length], 0.045, 0.045, 4, false); });
  };
  for (let i = 0; i < faces.length; i++) {
    const [u, v, w] = faces[i]; adjacent[u].add(v).add(w); adjacent[v].add(u).add(w); adjacent[w].add(u).add(v);
    drawFace([point(u, v), point(v, u), point(v, w), point(w, v), point(w, u), point(u, w)], i % 3 ? M.silver : M.glassLight);
  }
  for (let u = 0; u < vertices.length; u++) {
    const axis = vertices[u].clone().normalize(), basis = new THREE.Vector3(0, 1, 0).cross(axis).normalize();
    const second = axis.clone().cross(basis), sorted = [...adjacent[u]].map(v => point(u, v));
    sorted.sort((a, b) => Math.atan2(a.dot(second), a.dot(basis)) - Math.atan2(b.dot(second), b.dot(basis)));
    drawFace(sorted, M.glass);
  }
  // Only the elevated connector gets elevated wall colliders. Its underside
  // remains open to feet and cars instead of a generic ground-standing block.
  for (const poly of record(ctx, 'w886683713').polys) {
    const ring = ringFromFlat(poly.o); P.far = 900;
    P.cap(M.roof, ring, 6.6, true); P.cap(M.panel, ring, 3.3, false);
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      P.quad(M.glassBlue, [a[0], 3.3, a[1]], [b[0], 3.3, b[1]], [b[0], 6.6, b[1]], [a[0], 6.6, a[1]], [b[1] - a[1], 0, a[0] - b[0]]);
      P.cyl(M.silverSeam, [a[0], 3.35, a[1]], [b[0], 3.35, b[1]], 0.08, 0.08, 4);
      P.cyl(M.silverSeam, [a[0], 6.6, a[1]], [b[0], 6.6, b[1]], 0.08, 0.08, 4);
    }
    addPolyColliders(ctx, poly, 3.3, 6.6, 0.15);
  }
}

export function buildPiterland(K) {
  const start = K.P.tris;
  wing(K, record(K.ctx, 'w1041714586'), 27);
  wing(K, record(K.ctx, 'w1041714585'), 4, false);
  dome(K); lantern(K, record(K.ctx, 'w317789256')); flyArena(K);
  // South-west glazed entrance has a deep canopy, framed doors and a low
  // terrace. All geometry stays inside the mapped complex's footprint.
  const { P, M } = K;
  P.far = 650; P.push(-7952, 0, -5399, -0.248);
  P.box(M.wall, -11, 11, 4.2, 4.6, -4, 3.8, 'b');
  for (const u of [-8.5, -4.25, 0, 4.25, 8.5]) {
    P.box(M.steel, u - 0.09, u + 0.09, 0.15, 4.25, 3.3, 3.5, 'b');
    P.box(M.dark, u - 1.8, u + 1.8, 0.15, 3.6, 0.025, 0.08, 'bklrt');
  }
  P.pop();
  K.service.monuments.push({ id: 'w55498111', name: 'Питерлэнд', x: CX, z: CZ, h: 51 });
  K.service.photoSpots.push({ name: 'Купол Питерлэнда с берега', x: -7955, z: -5292, yaw: -41, pitch: 10 });
  K.service.parts.piterland = { triangles: K.P.tris - start, domeDiameter: 91.2, domeTop: 51 };
}
