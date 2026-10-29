// landmarksSmolensky/gravefield.js - the DETAILED GRAVE FIELD of the cemetery (docs/research/smolensky-detail.md section 7; replaces the 23 meshes of graves.js).
// Six instanced meshes in all (slab, taper, pyr, shaft: opaque, layer 0 = normal / depth + colour pass; cross, panel: alpha cut-outs, colour pass only) share ONE atlas (atlas.js) and two materials (gravemat.js):
// every grave is composed from instances of them (gravearch.js).  The plots live in 12 m cells; a cell is composed on first use (near parts: the full plot; far parts: one or two slabs) and cached as typed arrays.
// Every 4 m of camera travel (or a turn of 8 degrees) the instance buffers are repacked: cells within NEAR (55 m) give their near parts, cells out to FAR (118 m) their far parts, cells outside the view cone
// (half the horizontal field of view + 18 degrees, beyond 20 m) nothing; from above 40 m nothing (the canopy hides the graves).  The meshes cull themselves (frustumCulled = false, like the forest: a camera-repacked
// InstancedMesh is not registered with spatial.js / lod.js).  Colliders: the plot box of a fenced plot, the monument box of the others (placed with the plan, once).
import * as THREE from 'three';
import { makeGeos, makeGraveMats } from './gravemat.js';
import { makeComposer, plotInfo, Sink } from './gravearch.js';

const CELL = 12, NEAR = 55, FAR = 118, CAP = { slab: 9000, taper: 2500, pyr: 3500, shaft: 1500, cross: 3000, panel: 12000 };
const TYPES = ['slab', 'taper', 'pyr', 'shaft', 'cross', 'panel'];

export function plantGraveField(K, plots, atlas) {
  const ctx = K.ctx, ph = ctx.physics, T = THREE;
  const geos = makeGeos(), mats = makeGraveMats(ctx, atlas), comp = makeComposer(atlas);
  const group = new T.Group(); group.name = 'lmsmol-gravefield';
  const meshes = {};
  for (const ty of TYPES) {
    const geo = geos[ty], cap = CAP[ty];
    geo.setAttribute('aCell', new T.InstancedBufferAttribute(new Float32Array(cap * 4), 4).setUsage(T.DynamicDrawUsage));
    const im = new T.InstancedMesh(geo, ty === 'cross' || ty === 'panel' ? mats.cut : mats.stone, cap);
    im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.setColorAt(0, new T.Color(1, 1, 1)); im.instanceColor.setUsage(T.DynamicDrawUsage);
    im.count = 0; im.visible = false; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = true; im.name = 'lmsmol-gf-' + ty;
    ctx.noBatch(im); if (ty === 'cross' || ty === 'panel') ctx.noOutline(im);
    group.add(im); meshes[ty] = im;
  }
  // ---- cells
  const cells = new Map();
  for (const p of plots) { const cx = Math.floor(p.x / CELL), cz = Math.floor(p.z / CELL), k = cx * 8192 + cz; let c = cells.get(k); if (!c) cells.set(k, (c = { cx: (cx + 0.5) * CELL, cz: (cz + 0.5) * CELL, plots: [], near: null, far: null })); c.plots.push(p); }
  const list = [...cells.values()];
  let composedNear = 0, composedFar = 0, tNear = 0;
  const build = (c, far) => { const t0 = performance.now(); const s = new Sink(); for (const p of c.plots) (far ? comp.composeFar : comp.compose)(p, s); const r = s.finish(); if (far) { c.far = r; composedFar++; } else { c.near = r; composedNear++; } tNear += performance.now() - t0; return r; };
  // ---- colliders (once): a fenced plot is one box; the others a box for the monument (a stele / cross / tomb)
  let colliders = 0;
  for (const p of plots) {
    if (p.type === 'edge') continue;
    const info = plotInfo(p), c = Math.cos(p.rot), s = Math.sin(p.rot);
    const cx = p.x + s * info.cz, cz = p.z + c * info.cz;                                  // local (0, cz) -> world: x' = c * 0 + s * cz, z' = c * cz
    ph.addBox(cx, cz, info.cw, info.cl, p.rot, 0, info.ch); colliders++;
  }
  // ---- repack
  const _dir = new T.Vector3();
  let fx = 0, fz = -1, cosLim = -2, high = false;
  function aimCone() {
    const cam = ctx.camera; if (!cam || !cam.getWorldDirection) { cosLim = -2; return; }
    high = cam.position.y > 40;
    const dir = cam.getWorldDirection(_dir), hl = Math.hypot(dir.x, dir.z);
    if (hl < 0.55) { cosLim = -2; return; }
    fx = dir.x / hl; fz = dir.z / hl;
    const half = Math.atan(Math.tan((cam.fov || 62) * Math.PI / 360) * (cam.aspect || 1.78)) + 18 * Math.PI / 180;
    cosLim = half >= 1.75 ? -2 : Math.cos(half);
  }
  const cnt = {}; let nearPlots = 0;
  function assign(px, pz) {
    for (const ty of TYPES) cnt[ty] = 0;
    nearPlots = 0;
    if (!high) {
      const r0 = Math.floor((px - FAR - 9) / CELL), r1 = Math.floor((px + FAR + 9) / CELL), q0 = Math.floor((pz - FAR - 9) / CELL), q1 = Math.floor((pz + FAR + 9) / CELL);
      for (let ix = r0; ix <= r1; ix++) for (let iz = q0; iz <= q1; iz++) {
        const c = cells.get(ix * 8192 + iz); if (!c) continue;
        const dx = c.cx - px, dz = c.cz - pz, d = Math.hypot(dx, dz);
        if (d > FAR + 8.5) continue;
        if (d > 22 && cosLim > -2 && dx * fx + dz * fz < cosLim * d - 9) continue;       // outside the view cone (a cell is 17 m across)
        const near = d < NEAR, src = near ? (c.near || build(c, false)) : (c.far || build(c, true));
        if (near) nearPlots += c.plots.length;
        for (const ty of TYPES) {
          const a = src[ty]; if (!a) continue;
          const im = meshes[ty], o = cnt[ty], n = Math.min(a.n, CAP[ty] - o); if (n <= 0) continue;
          im.instanceMatrix.array.set(n === a.n ? a.m : a.m.subarray(0, n * 16), o * 16);
          im.instanceColor.array.set(n === a.n ? a.t : a.t.subarray(0, n * 3), o * 3);
          im.geometry.attributes.aCell.array.set(n === a.n ? a.c : a.c.subarray(0, n * 4), o * 4);
          cnt[ty] = o + n;
        }
      }
    }
    for (const ty of TYPES) {
      const im = meshes[ty], n = cnt[ty]; im.count = n; im.visible = n > 0;
      if (n > 0) { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.geometry.attributes.aCell.needsUpdate = true; }
    }
  }
  const lastAt = { x: 1e9, z: 1e9, t: -10, fx: 0, fz: 0 };
  ctx.onUpdate((dt, t) => {
    const p = ctx.camera && ctx.camera.position; if (!p) return;
    const moved = Math.hypot(p.x - lastAt.x, p.z - lastAt.z), was = cosLim > -2, wasHigh = high;
    aimCone();
    const turned = (cosLim > -2) !== was || (cosLim > -2 && fx * lastAt.fx + fz * lastAt.fz < 0.99) || wasHigh !== high;
    if (moved > 4 || (Math.abs(t - lastAt.t) > 1.5 && moved > 0.8) || turned) { assign(p.x, p.z); lastAt.x = p.x; lastAt.z = p.z; lastAt.t = t; lastAt.fx = fx; lastAt.fz = fz; }
  });
  K.root.add(group);
  const stats = () => ({ plots: plots.length, cells: list.length, composedNear, composedFar, composeMs: Math.round(tNear), counts: { ...cnt }, nearPlots });
  return { group, count: plots.length, colliders, meshes, assign, stats, geos, tris: 0 };
}
