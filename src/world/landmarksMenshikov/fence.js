// landmarksMenshikov/fence.js - cast-iron fences on a stone base, shared by the palace forecourt (limestone wall 0.45 m, spear / fleur-de-lis panels, square piers) and the Rumyantsev garden (pink granite plinth
// 0.55 m, openwork panels with scrolls, barley-twist posts with urns every 2.6 m).  A fence follows a world polyline; gates cut gaps (open = a passage with two taller posts, closed = a double leaf and a
// collider); the ironwork is ONE alpha-tested quad per run (white strokes painted in art.js: bars every 12-14 cm, tips, rails, scroll bands), so a 470 m fence costs a few hundred triangles + the posts
// (instanced).  Colliders: thin boxes along the kept runs (2.2 m high) so that nobody walks through the railing.
import * as THREE from 'three';
import { revolve, tbox } from './geo.js';
import { partsGeos, addInstanced } from './inst.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const mat = (x, y, z, rot, s) => new THREE.Matrix4().compose(_v.set(x, y, z), _q.setFromAxisAngle(_up, rot), _s.set(s, s, s));

/** a barley-twist post with a gadrooned urn, base at y 0: shaft to 1.5, collar, urn to 2.0 (the instance sits on the plinth top) */
export function urnPostParts(Q, M) {
  Q.cyl(M.fenceIron, [0, 0, 0], [0, 0.4, 0], 0.085, 0.08, 8, false);
  for (let i = 0; i < 6; i++) { const y = 0.4 + i * 0.18; Q.cyl(M.fenceIron, [0, y, 0], [0, y + 0.18, 0], i % 2 ? 0.066 : 0.08, i % 2 ? 0.08 : 0.066, 8, false); }
  Q.cyl(M.fenceIron, [0, 1.48, 0], [0, 1.58, 0], 0.13, 0.13, 8, true);
  revolve(Q, M.fenceIron, [[0, 1.58], [0.1, 1.6], [0.15, 1.66], [0.24, 1.78], [0.27, 1.88], [0.24, 1.95], [0.3, 1.99], [0.2, 2.02], [0.08, 2.03]], 8, { crease: 40 });
  revolve(Q, M.fenceIron, [[0.08, 2.03], [0.1, 2.1], [0.05, 2.22], [0, 2.3]], 6, { crease: 70 });
}
/** a plain square pier 0.2 m with a stone cap and a ball, base at y 0, 1.9 m high (palace fence piers) */
export function squarePostParts(Q, M) {
  Q.box(M.fenceIron, -0.07, 0.07, 0, 1.78, -0.07, 0.07, 'b', 1);
  Q.box(M.fenceIron, -0.11, 0.11, 1.78, 1.86, -0.11, 0.11, 'b', 1);
  revolve(Q, M.fenceIron, [[0, 1.86], [0.1, 1.88], [0.12, 1.96], [0.08, 2.04], [0, 2.07]], 8, { crease: 60 });
}
/** a heavy gate pier: granite-faced square 0.5 m, 2.3 m high with a capped top and a ball */
export function gatePierParts(Q, M) {
  Q.box(M.granite, -0.25, 0.25, 0, 1.9, -0.25, 0.25, 'b', 2.2);
  Q.box(M.granite, -0.3, 0.3, 1.9, 2.02, -0.3, 0.3, 'b', 2.2);
  Q.box(M.granite, -0.22, 0.22, 2.02, 2.14, -0.22, 0.22, 'b', 2.2);
  revolve(Q, M.granite, [[0, 2.14], [0.2, 2.17], [0.25, 2.3], [0.2, 2.44], [0, 2.5]], 10, { crease: 60 });
}

/**
 * o: { id, pts: [[x, z] ..] world, panel (material), tile (m per panel tile), top (ironwork height), base: { mat, h, w, uvs }, posts: 'urn' | 'square' | null, every (post pitch),
 *      gates: [{ id, x, z, w, open }], gatePost: 'urn' | 'square' | 'pier' (the posts at the gates), colH (collider height), name }
 * returns { runs: [[ [x, z], [x, z] ]], gates }
 */
export function ironFence(K, o) {
  const { ctx, P, M } = K, ph = ctx.physics, pts = o.pts, nseg = pts.length - 1;
  const base = o.base || { mat: M.granite, h: 0.5, w: 0.4, uvs: 2.2 }, bh = base.h, top = o.top ?? 1.6, every = o.every ?? 2.6, gateW = (g) => g.w ?? 3.0;
  const segs = []; let acc = 0;
  for (let i = 0; i < nseg; i++) { const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.05) continue; segs.push({ a, b, len, s0: acc, ux: (b[0] - a[0]) / len, uz: (b[1] - a[1]) / len }); acc += len; }
  // gates on the line
  const cuts = [], gates = [];
  for (const g of o.gates || []) {
    let best = null;
    for (const s of segs) { const t = Math.max(0, Math.min(s.len, (g.x - s.a[0]) * s.ux + (g.z - s.a[1]) * s.uz)), d = Math.hypot(g.x - s.a[0] - s.ux * t, g.z - s.a[1] - s.uz * t); if (!best || d < best.d) best = { d, s, t }; }
    if (!best || best.d > 1.6) continue;
    const c = best.s.s0 + best.t, w = gateW(g);
    cuts.push({ g, c, w, s: best.s, ux: best.s.ux, uz: best.s.uz, x: best.s.a[0] + best.s.ux * best.t, z: best.s.a[1] + best.s.uz * best.t });
  }
  cuts.sort((p, q) => p.c - q.c);
  const runs = [], postSet = new Set(), posts = [], gposts = [];
  const addPost = (x, z, big = false) => { const k = Math.round(x * 10) + ',' + Math.round(z * 10); if (postSet.has(k)) return; postSet.add(k); (big ? gposts : posts).push([x, z]); };
  let si = 0;
  for (const s of segs) {
    // kept intervals of this segment (s0 .. s0 + len) minus the gate gaps
    let from = s.s0; const keep = [];
    for (const c of cuts) { const g0 = c.c - c.w / 2, g1 = c.c + c.w / 2; if (g1 <= from || g0 >= s.s0 + s.len) continue; if (g0 > from + 0.05) keep.push([from, g0]); from = Math.max(from, g1); }
    if (s.s0 + s.len > from + 0.05) keep.push([from, s.s0 + s.len]);
    for (const [k0, k1] of keep) {
      const ax = s.a[0] + s.ux * (k0 - s.s0), az = s.a[1] + s.uz * (k0 - s.s0), len = k1 - k0, rot = Math.atan2(-s.uz, s.ux);
      runs.push([[ax, az], [ax + s.ux * len, az + s.uz * len]]);
      P.push(ax, 0, az, rot);
      if (base.h > 0) {
        if (base.tu) tbox(P, base.mat, 0, len, 0, bh + si * 0.0012, -base.w / 2, base.w / 2, base.tu, base.tv, 'b');
        else P.box(base.mat, 0, len, 0, bh + si * 0.0012, -base.w / 2, base.w / 2, 'b', base.uvs ?? 2.2);
        if (base.cap) P.box(base.cap, 0, len, bh + si * 0.0012, bh + 0.05 + si * 0.0012, -base.w / 2 - 0.03, base.w / 2 + 0.03, 'b', 1);
      }
      // the ironwork: ONE double-sided cutout quad, u 0..len / tile, v 0..1
      const n = len / o.tile;
      P.quad(o.panel, [0, bh, 0], [len, bh, 0], [len, bh + top, 0], [0, bh + top, 0], [0, 0, 1], [[0, 0], [n, 0], [n, 1], [0, 1]]);
      P.pop();
      if (o.posts) { const k = Math.max(1, Math.round(len / every)); for (let i = 0; i <= k; i++) addPost(ax + s.ux * len * i / k, az + s.uz * len * i / k); }
      ph.addBox(ax + s.ux * len / 2, az + s.uz * len / 2, len + 0.1, 0.32, rot, 0, o.colH ?? 2.2);
    }
    si++;
  }
  // gates: open = two taller posts / heavy piers and nothing between; closed = a double leaf and a collider
  for (const c of cuts) {
    const hw = c.w / 2, a = [c.x - c.ux * hw, c.z - c.uz * hw], b = [c.x + c.ux * hw, c.z + c.uz * hw], rot = Math.atan2(-c.uz, c.ux), open = c.g.open !== false;
    for (const q of [a, b]) addPost(q[0], q[1], true);
    if (!open) {
      P.push(a[0], 0, a[1], rot);
      const lw = c.w / 2 - 0.05;
      for (const x0 of [0.05, c.w / 2]) P.quad(M.gateLeaf, [x0, 0.15, 0], [x0 + lw, 0.15, 0], [x0 + lw, 2.35, 0], [x0, 2.35, 0], [0, 0, 1], [[0, 0], [lw / 1.6, 0], [lw / 1.6, 1], [0, 1]]);
      P.pop();
      ph.addBox(c.x, c.z, c.w + 0.1, 0.32, rot, 0, 2.4);
    }
    gates.push({ id: c.g.id, x: c.x, z: c.z, w: c.w, open, name: c.g.name || null });
  }
  // the instanced posts (one InstancedMesh per material of the post geometry)
  const sets = [];
  if (o.posts) sets.push([posts, o.posts === 'square' ? squarePostParts : urnPostParts, 1.0, bh]);
  const gk = o.gatePost || 'urn';
  if (gposts.length) sets.push([gposts, gk === 'pier' ? gatePierParts : gk === 'square' ? squarePostParts : urnPostParts, gk === 'pier' ? 1.0 : gk === 'square' ? 1.18 : 1.18, gk === 'pier' ? 0 : bh]);
  let tris = 0;
  for (const [list, fn, sc, y] of sets) {
    const geo = partsGeos((Q) => fn(Q, M)), ms = list.map(([x, z]) => mat(x, y, z, 0, sc));
    tris += addInstanced(ctx, K.root, 'lmmensh-posts-' + (o.id || 'f'), geo, ms).tris;
  }
  for (const [x, z] of gposts) ph.addCylinder(x, z, 0.28, 0, 2.5);
  K.extraTris += tris;
  return { runs, gates, tris };
}
