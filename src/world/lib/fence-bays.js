// world/lib/fence-bays.js - BREAKABLE FENCES (docs/AREAS.md 13.7, the owner's world rule "water is reachable": every fence, parapet, railing and low wall that keeps people from water must break like a bench or a lamp).
// A fence is a row of straight BAYS (a rail panel between two posts, a section of a granite parapet, a stretch of a wall): `knockBays(ctx, { bays, parts, collider, rec })` gives every bay
//   * its own thin physics box (flagged `fence`: people/nav.js reads it as a wall for the routes, exactly like the guard rails of streets/barriers.js),
//   * its instances of every part (a panel, a post, a parapet section ...) in the per-cell dynamic InstancedMeshes of lib/knock-inst.js (the same draw structure as the benches and the chain links),
//   * ONE knock record (core/knock.js), anchored: it holds a bump below `rec.anchored` km/h of the car at contact, above it the bay breaks off at the foot and topples along the hit (a bay that falls over
//     open water sinks and is gone); its collider is removed at the knock and replaced by the low rest box that the car drives over: THE GAP IS PASSABLE.
// Without ctx.knock (tools/check.mjs of a single module, headless probes) knockInstances builds one static InstancedMesh per part and registers nothing: the structure of an ordinary instanced fence,
// the colliders are still created.
// THE FRAME OF A BAY. A bay runs from (x0, z0) to (x1, z1); its local frame has +x ALONG the bay (a part with `stretch` is a unit-length geometry, x 0..1, scaled to the bay length), +y up, +z to the LEFT
// of the direction of travel, (-tz, tx) in the world (the landward side of a bank chain is +z when the bay runs with the water on its right: swap the ends otherwise, see `faceLeft`). The origin of the frame
// is the START of the bay at the foot level `bay.y`. A part is placed with `at` ('start' | 'mid' | 'end' | 0..1), a lateral offset `v` (along local z), a lift `y`, an extra yaw `rot`, a scale (sx, sy, sz).
//   parts: [{ geo, mat, name, shadow, receive, noOutline, far, hide, color(bay, i, k) -> THREE.Color | hex | null, when(bay, i), at | ats(bay) -> ['start' | 'end' | 0..1, ...] (one instance per entry), v, y, rot, stretch, inset, sx, sy, sz }]
//     y, sx, sy, sz, v may be numbers or (bay) => number; inset = metres cut from both ends of a stretched part (a panel between two posts)
//   collider: null (none) | { y0, y1, thick, off, e0, e1, source } | (bay, frame, i) => the same (or null); off = the lateral centre of the box (local z), e0 / e1 = how far it reaches beyond the start / the end
//   a bay may carry ye (the foot level at its end: a slope), ghost: true (a collider without any drawing)
//   rec: the knock record template { kind, mass, h, anchored, hitK, metal, minDv, ... } | (bay, frame, i) => record (null: a bay without a record: the collider stays a plain wall)
import * as THREE from 'three';
import { knockInstances } from './knock-inst.js';

const UP = new THREE.Vector3(0, 1, 0), AXZ = new THREE.Vector3(0, 0, 1), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _qz = new THREE.Quaternion(), _s = new THREE.Vector3();

/** the frame of a bay: { len, tx, tz, rotY, mx, mz }; rotY = atan2(-tz, tx) turns a local +x to (tx, tz) (three.js rotation about Y, also the rotY of core/physics.js boxes) */
export function bayFrame(b) {
  const dx = b.x1 - b.x0, dz = b.z1 - b.z0, len = Math.hypot(dx, dz) || 1e-6, tx = dx / len, tz = dz / len;
  return { len, tx, tz, rotY: Math.atan2(-tz, tx), mx: (b.x0 + b.x1) / 2, mz: (b.z0 + b.z1) / 2 };
}
/** a bay from a to b whose local +z (the left of travel) points to the side of the normal (nx, nz): the ends are swapped when it does not */
export function faceLeft(x0, z0, x1, z1, nx, nz, extra = {}) {
  const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, left = (-dz * nx + dx * nz) / l;      // (-tz, tx) . n
  return left >= 0 ? { x0, z0, x1, z1, ...extra } : { x0: x1, z0: z1, x1: x0, z1: z0, ...extra };
}
/** the world matrix of a part of a bay (see the header) */
export function bayMatrix(b, fr, P, out = new THREE.Matrix4(), at = P.at) {
  const f = (v, d) => (typeof v === 'function' ? v(b) : (v ?? d)), ins = P.stretch ? (P.inset || 0) : 0;
  const u = at === 'end' ? 1 : at === 'mid' ? 0.5 : typeof at === 'number' ? at : 0, lx = u * fr.len + ins, lz = f(P.v, 0);
  const y0 = b.y ?? 0, dy = (b.ye ?? y0) - y0;                        // a bay on a slope (a bridge deck): b.ye = the foot level at the end; a stretched part rolls with it, a post stands upright at its own height
  _p.set(b.x0 + fr.tx * lx - fr.tz * lz, y0 + dy * (lx / fr.len) + f(P.y, 0), b.z0 + fr.tz * lx + fr.tx * lz);
  _q.setFromAxisAngle(UP, fr.rotY + (P.rot || 0));
  if (dy && P.stretch) _q.multiply(_qz.setFromAxisAngle(AXZ, Math.atan2(dy, fr.len)));
  return out.compose(_p, _q, _s.set(P.stretch ? Math.max(0.05, fr.len - 2 * ins) * f(P.sx, 1) : f(P.sx, 1), f(P.sy, 1), f(P.sz, 1)));
}

/** the colliders + instances + records of a row of bays (see the header); returns { records, items, frames } with one entry per bay */
export function knockBays(ctx, { name = 'fence', bays, parts, collider = null, rec = null, far = 360, cell = 384 }) {
  const frames = bays.map(bayFrame), items = new Array(bays.length).fill(null);
  const col = typeof collider === 'function' ? collider : () => collider;
  bays.forEach((b, i) => {
    const c = col(b, frames[i], i); if (!c) return;
    const fr = frames[i], off = c.off || 0, e0 = c.e0 ?? 0.05, e1 = c.e1 ?? 0.05, sh = (e1 - e0) / 2;
    const cx = fr.mx + fr.tx * sh - fr.tz * off, cz = fr.mz + fr.tz * sh + fr.tx * off;
    const box = ctx.physics.addBox(cx, cz, fr.len + e0 + e1, c.thick ?? 0.4, fr.rotY, c.y0 ?? Math.min(b.y ?? 0, 0) - 0.5, c.y1 ?? (b.y ?? 0) + 1.1);
    box.fence = c.fence !== false; items[i] = box;
  });
  const spec = parts.map((P) => ({
    geo: P.geo, mat: P.mat, name: P.name, shadow: P.shadow, receive: P.receive, noOutline: P.noOutline, far: P.far, hide: P.hide,
    when: (s, i) => !bays[i].ghost && (P.when ? P.when(bays[i], i) : true),      // (a ghost bay has no instance: see below)
    place: P.ats ? (s, i) => P.ats(bays[i]).map((at) => bayMatrix(bays[i], frames[i], P, new THREE.Matrix4(), at)) : (s, i) => bayMatrix(bays[i], frames[i], P),
    color: P.color ? (s, i, k) => P.color(bays[i], i, k) : undefined,
  }));
  const spots = bays.map((b, i) => ({ x: frames[i].mx, y: b.y ?? 0, z: frames[i].mz, rotY: frames[i].rotY }));
  const dflt = (i) => ({ w: frames[i].len, d: items[i] ? items[i].hd * 2 : 0.3, y: bays[i].y ?? 0 });
  const recOf = typeof rec === 'function' ? (s, i) => { const r = rec(bays[i], frames[i], i); return r ? { ...dflt(i), ...r } : null; } : rec ? (s, i) => ({ ...dflt(i), ...rec }) : null;
  const r = knockInstances(ctx, { name, parts: spec, spots, items: (i) => items[i], rec: recOf || (() => null), far, cell });
  // a GHOST bay is a collider that stands where nothing is drawn (the old invisible walls of a bridge face): it is breakable too (an invisible wall must never be what keeps a car out of the water), a record without parts
  if (ctx.knock && recOf) bays.forEach((b, i) => { if (b.ghost && items[i]) { const q = recOf(spots[i], i); if (q) r.records[i] = ctx.knock.register({ ...q, x: spots[i].x, z: spots[i].z, y: spots[i].y, rotY: spots[i].rotY, ghost: true, parts: [], item: items[i] }); } });
  return { records: r.records, items, frames, meshes: r.meshes };
}

/** split the run (x0, z0) -> (x1, z1) into equal bays of about `tile` metres (at least one; a texture tile per bay: a stretched alpha panel keeps its pattern), each carrying `extra` (y, ye, ghost ...);
 *  `first` / `last` mark the first and the last bay of the run (a post at the start of the first bay and at the end of the last) */
export function splitBays(x0, z0, x1, z1, tile, extra = {}) {
  const l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / tile)), out = [];
  for (let k = 0; k < n; k++) out.push({ x0: x0 + (x1 - x0) * k / n, z0: z0 + (z1 - z0) * k / n, x1: x0 + (x1 - x0) * (k + 1) / n, z1: z0 + (z1 - z0) * (k + 1) / n, first: k === 0, last: k === n - 1, ...extra });
  return out;
}
/** a vertical panel x 0..1, y y0..y1, in the plane z = 0, uv (0..1, 0..1): ONE texture tile per bay (an alpha-tested double-sided material); the normal faces +z (the left of the bay) */
export function unitPanel(y0 = 0, y1 = 1, { u1 = 1 } = {}) {      // u1: the u coordinate of the far end (a bay of N texture tiles: u1 = N, the texture repeats)
  const pos = [], nrm = [], uv = [], idx = [];
  quad(pos, nrm, uv, idx, [[0, y0, 0], [1, y0, 0], [1, y1, 0], [0, y1, 0]], [0, 0, 1], [[0, 0], [u1, 0], [u1, 1], [0, 1]]);
  return build(pos, nrm, uv, idx);
}

// ---------------------------------------------------------------- unit geometries (x 0..1 along the bay, scaled by the part's `stretch`)
/** a box x 0..1, y y0..y1, z z0..z1 (local z = the left of the bay); uvs: texture metres per uv unit, uLen: the bay length the u coordinate is meant for (a stretched box repeats that many metres per tile) */
export function unitBox(y0, y1, z0, z1, { uLen = 1, uvs = 1, bottom = false } = {}) {
  const pos = [], nrm = [], uv = [], idx = [];
  const U = uLen / uvs, H = (y1 - y0) / uvs, D = (z1 - z0) / uvs, q = (a, b, c, d, n, ua, ub, va, vb) => quad(pos, nrm, uv, idx, [a, b, c, d], n, [[ua, va], [ub, va], [ub, vb], [ua, vb]]);
  q([0, y0, z0], [1, y0, z0], [1, y1, z0], [0, y1, z0], [0, 0, -1], 0, U, 0, H);        // the right face (local -z)
  q([1, y0, z1], [0, y0, z1], [0, y1, z1], [1, y1, z1], [0, 0, 1], 0, U, 0, H);         // the left face
  q([0, y1, z0], [1, y1, z0], [1, y1, z1], [0, y1, z1], [0, 1, 0], 0, U, 0, D);         // the top
  q([0, y0, z1], [0, y0, z0], [0, y1, z0], [0, y1, z1], [-1, 0, 0], 0, D, 0, H);        // the start end
  q([1, y0, z0], [1, y0, z1], [1, y1, z1], [1, y1, z0], [1, 0, 0], 0, D, 0, H);         // the far end
  if (bottom) q([0, y0, z0], [0, y0, z1], [1, y0, z1], [1, y0, z0], [0, -1, 0], 0, U, 0, D);
  return build(pos, nrm, uv, idx);
}
/** a quad (four [x, y, z]) facing the normal n: the winding is flipped to match it; t = the four [u, v] */
function quad(pos, nrm, uv, idx, p, n, t) {
  const k = pos.length / 3, ax = p[1][0] - p[0][0], ay = p[1][1] - p[0][1], az = p[1][2] - p[0][2], bx = p[3][0] - p[0][0], by = p[3][1] - p[0][1], bz = p[3][2] - p[0][2];
  const flip = (ay * bz - az * by) * n[0] + (az * bx - ax * bz) * n[1] + (ax * by - ay * bx) * n[2] < 0;
  for (let j = 0; j < 4; j++) { pos.push(...p[j]); nrm.push(...n); uv.push(...t[j]); }
  if (flip) idx.push(k, k + 2, k + 1, k, k + 3, k + 2); else idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
}
/** a profile [[z, y], ...] (an open polyline, z = the left of the bay) swept x 0..1: one flat quad per profile edge, facing the (nz, ny) = (-dy, dz) side of the travel along the profile; vFn(y) -> v of the texture */
export function unitProfile(profile, { uLen = 1, uvs = 1, vFn = (y) => y, caps = true } = {}) {
  const pos = [], nrm = [], uv = [], idx = [], U = uLen / uvs;
  for (let k = 0; k + 1 < profile.length; k++) {
    const [z0, y0] = profile[k], [z1, y1] = profile[k + 1], dz = z1 - z0, dy = y1 - y0, l = Math.hypot(dz, dy) || 1, nz = -dy / l, ny = dz / l;
    quad(pos, nrm, uv, idx, [[0, y0, z0], [1, y0, z0], [1, y1, z1], [0, y1, z1]], [0, ny, nz], [[0, vFn(y0)], [U, vFn(y0)], [U, vFn(y1)], [0, vFn(y1)]]);
  }
  if (caps) for (const x of [0, 1]) {                      // the two end faces: a fan over the profile closed to its first point
    const b = pos.length / 3;
    for (const [z, y] of profile) { pos.push(x, y, z); nrm.push(x ? 1 : -1, 0, 0); uv.push(z / uvs, vFn(y)); }
    for (let k = 1; k + 1 < profile.length; k++) { if (x) idx.push(b, b + k, b + k + 1); else idx.push(b, b + k + 1, b + k); }
  }
  return build(pos, nrm, uv, idx);
}
function build(pos, nrm, uv, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeBoundingSphere(); return g;
}
