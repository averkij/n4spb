// landmarksGavan/fence.js - the iron fence builder shared by the canal promenade, the workers' town, the fire reserve yard and the church hoarding (docs/research/gavan.md 5.1, 8.3, 10.3).
//   fenceRun(Q, pts, o)  panels (alpha bars between two posts, ~2.5 m) along a polyline of [x, z], a post at every panel end (collected for instancing), openings at the gates and wherever the real asphalt is,
//                        every `fanEvery` m a sunburst fan panel; returns { bays (one per panel, for fenceBays), runs (the segments), posts, spans, len }.
//   postInstances(Q, name, posts, o)  one InstancedMesh pair (shaft + finial) for all posts (static: the posts stay when a panel is knocked).
//   fenceBays(Q, name, bays, o)  n4spb (docs/AREAS.md 13.7, 15.v): the panels of the runs as BREAKABLE BAYS (lib/fence-bays.js: collider + drawing + knock record); the source drew them as static quads and put plain
//                        thin fence-flagged boxes along the runs (streets/barriers.js addFenceBoxes). Gates and road gaps stay open (no bay there).
import * as THREE from 'three';
import { partsGeos, addInstanced, mat4, kBays } from './inst.js';
import { coverFn } from './surfaces.js';
import { unitBox, unitPanel } from '../lib/fence-bays.js';

/**
 * o: { h: 1.6, y0: 0.06, panel: 2.5, bars: material, fan: material, fanEvery: 0 (no fans), fanFrom, fanTo (arc length range m, default all), gates: [[x, z, halfWidth]], cover (fn), margin: 0.3,
 *      skip: (x, z) => bool (extra exclusion, e.g. water) }
 */
export function fenceRun(Q, pts, o = {}) {
  const cover = o.cover || coverFn(Q.ctx), h = o.h ?? 1.6, y0 = o.y0 ?? 0.06, pitch = o.panel ?? 2.5, m = o.margin ?? 0.3, gates = o.gates || [];
  const runs = [], posts = [], bays = [], res = { runs, posts, bays, spans: 0, len: 0, gaps: 0 };
  let arc = 0, nextFan = o.fanEvery ? (o.fanFrom ?? o.fanEvery * 0.5) : Infinity, run = [];
  const flush = () => { if (run.length) runs.push(run); run = []; };
  const bad = (x, z) => cover(x, z) > -m || gates.some(([gx, gz, gw]) => Math.hypot(gx - x, gz - z) < gw) || (o.skip && o.skip(x, z));
  for (let i = 0; i + 1 < pts.length; i++) {
    const A = pts[i], B = pts[i + 1], dx = B[0] - A[0], dz = B[1] - A[1], len = Math.hypot(dx, dz); if (len < 0.2) continue;
    const n = Math.max(1, Math.round(len / pitch)), step = len / n, ux = dx / len, uz = dz / len;
    for (let k = 0; k < n; k++) {
      const ax = A[0] + ux * step * k, az = A[1] + uz * step * k, bx = A[0] + ux * step * (k + 1), bz = A[1] + uz * step * (k + 1), mx = (ax + bx) / 2, mz = (az + bz) / 2;
      const gap = bad(ax, az) || bad(bx, bz) || bad(mx, mz) || (o.cap && arc > (o.cap[1] ?? Infinity)) || (o.cap && arc < (o.cap[0] ?? 0));
      const useFan = o.fan && arc + step / 2 >= nextFan && (o.fanTo == null || arc < o.fanTo);
      if (useFan) nextFan += o.fanEvery;
      if (gap) { flush(); res.gaps++; arc += step; continue; }
      const rot = Math.atan2(-uz, ux);
      bays.push({ x0: ax, z0: az, x1: bx, z1: bz, y: 0, fan: !!useFan });      // the panel itself is the BAY (n4spb): drawn by fenceBays
      if (!run.length || Math.hypot(run[run.length - 1][2] - ax, run[run.length - 1][3] - az) > 0.05) { posts.push([ax, az, rot]); }
      posts.push([bx, bz, rot]);
      run.push([ax, az, bx, bz]); res.spans++; res.len += step; arc += step;
    }
  }
  flush();
  // posts at the panel ends: one per joint (drop the exact duplicates)
  const seen = new Set(); res.posts = posts.filter((p) => { const k = Math.round(p[0] * 20) + ',' + Math.round(p[1] * 20); if (seen.has(k)) return false; seen.add(k); return true; });
  return res;
}

/** square posts 0.1 m with a ball finial: one InstancedMesh per material; o: { h (1.7), mat (iron), ball (the finial material), spear: true for a pointed finial } */
export function postInstances(Q, name, posts, o = {}) {
  if (!posts.length) return 0;
  const M = Q.M, h = o.h ?? 1.7, iron = o.mat || M.iron;
  const parts = partsGeos((PP) => {
    PP.box(iron, -0.05, 0.05, 0, h, -0.05, 0.05, 'b', 1);
    PP.box(iron, -0.065, 0.065, h - 0.12, h - 0.06, -0.065, 0.065, '', 1);
    if (o.spear) PP.cyl(iron, [0, h, 0], [0, h + 0.2, 0], 0.045, 0.004, 4, false);
    else { const g = new THREE.SphereGeometry(0.075, 6, 4); PP.geo(iron, g, 0, h + 0.06, 0); g.dispose(); }
  });
  const mats = posts.map(([x, z, rot]) => mat4(x, o.y || 0, z, rot || 0, 1));
  const r = addInstanced(Q.ctx, Q.root, name, parts, mats);
  Q.extraTris += r.tris;
  return posts.length;
}

/**
 * the bays of fenceRun (and of any run of the same shape) as breakable bays: every panel is one bay with its collider (a thin box flagged `fence`, 0.3 m, up to `solidH`) and ONE knock record.
 * o: { h, y0 (the panel, as for fenceRun), bars, fan (materials), solidH (1.8), thick (0.3), mass (250), anchored (14), metal (true), far (320) } -> the number of bays
 */
export function fenceBays(Q, name, bays, o = {}) {
  if (!bays.length) return 0;
  const h = o.h ?? 1.6, y0 = o.y0 ?? 0.06, solidH = o.solidH ?? 1.8, thick = o.thick ?? 0.3;
  const panel = { geo: unitPanel(y0, y0 + h, { u1: 1 }), stretch: true, shadow: false, receive: false, noOutline: true };
  kBays(Q, { name, bays, far: o.far ?? 320,
    parts: [{ ...panel, mat: o.bars, name: 'panel', when: (b) => !b.fan }, ...(o.fan ? [{ ...panel, mat: o.fan, name: 'fan', when: (b) => b.fan }] : [])],
    collider: { y0: 0, y1: solidH, thick, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: o.mass ?? 250, h: solidH, anchored: o.anchored ?? 14, hitK: 0.4, metal: o.metal !== false, minDv: 0 }) });
  return bays.length;
}

/**
 * a solid wall as breakable bays (the closed Priboy wall of the canal, the church hoarding): bays of about `tile` m with a box body and a cap, y 0 .. h; `extra` parts (a poster) may follow.
 * o: { h, mat, capMat, capH (0.1), thick (the drawn wall, 0.12), capThick (0.2), uvs (1), capUvs (1), tile (the bay length the u coordinate is meant for), colThick (the collider, 0.3), solidH, mass, anchored, metal, extra: [part] }
 */
export function wallBays(Q, name, bays, o = {}) {
  if (!bays.length) return 0;
  const h = o.h ?? 2.0, tile = o.tile ?? 3, hw = (o.thick ?? 0.12) / 2, cw = (o.capThick ?? 0.2) / 2, ch = o.capH ?? 0.1, solidH = o.solidH ?? h;
  const parts = [{ geo: unitBox(0, h - ch, -hw, hw, { uLen: tile, uvs: o.uvs ?? 1 }), mat: o.mat, name: 'wall', stretch: true },
    ...(o.capMat ? [{ geo: unitBox(h - ch, h, -cw, cw, { uLen: tile, uvs: o.capUvs ?? 1 }), mat: o.capMat, name: 'cap', stretch: true, inset: -0.02 }] : []), ...(o.extra || [])];
  kBays(Q, { name, bays, far: o.far ?? 320, parts, collider: { y0: 0, y1: solidH, thick: o.colThick ?? 0.3, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: o.mass ?? 500, h: solidH, anchored: o.anchored ?? 16, hitK: 0.5, metal: !!o.metal, minDv: 0 }) });
  return bays.length;
}

/** thin wall colliders FLUSH with the footprint: every edge of the ring gets a box of thickness t whose OUTER face is the wall line (nothing sticks out over the pavement / asphalt). poly = { o, h } flat rings */
export function flushWalls(Q, poly, y0, y1, t = 0.3) {
  const rings = [poly.o, ...(poly.h || [])]; let n = 0;
  for (const flat of rings) {
    const pts = []; for (let i = 0; i < flat.length; i += 2) pts.push([flat[i], flat[i + 1]]);
    let A = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; A += p[0] * q[1] - q[0] * p[1]; }
    const sgn = A > 0 ? 1 : -1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.3) continue;
      const nx = dz / len * sgn, nz = -dx / len * sgn;                     // outward normal for this winding
      const cx = (a[0] + b[0]) / 2 - nx * t / 2, cz = (a[1] + b[1]) / 2 - nz * t / 2;
      Q.ctx.physics.addBox(cx, cz, len + t * 0.5, t, Math.atan2(-dz, dx), y0, y1); n++;
    }
  }
  return n;
}
