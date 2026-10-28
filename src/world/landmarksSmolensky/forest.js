// landmarksSmolensky/forest.js - the OLD FOREST of the cemetery (docs/research/smolensky.md section 3.6; photos refs/smolensky 72 77 80 139: a continuous canopy 18-25 m of small-leaved lime, Norway maple, silver birch,
// ash / elm, a little oak and spruce, hazel / elder / snowberry undergrowth along the alleys).  Instanced trees with the species and crown geometry of the environment module (treegeo.js, leafmat.js: copies).
// DRAW-CALL BUDGET (detail pass 2026-10-09, docs/research/smolensky.md 18): the first build had one InstancedMesh per family and level (about 64 meshes, ~160 calls a frame with the normal / depth and shadow passes).
// Now: levels 0 and 1 (< 32 m, < 95 m) keep a mesh per family (limeA, mapleA, elm, ash, oak, birchA, spruceA, shrub: the B twins were folded into the A families by place.js), the two far levels (< 240 m, beyond)
// are ONE mesh each for every family (a unit crown blob scaled to the family's envelope ellipsoid in the instance matrix, plus a stick), and the mid-level trunks (< 95 m) are ONE shared tapered stem mesh tinted per
// family; level 3 is colour pass only (beyond the 200 m reach of the outline pass), mid trunks and level-1 crowns beyond 75 m cast no shadow.  Repacked from the camera position when it has moved 2.5 m or turned
// 6 degrees; far trees outside the view cone (half the horizontal field of view + 18 degrees) are left out, like environment/trees.js.  A trunk collider for every tree.
// plantForest(K, list): list = [{ x, z, fam, s (crown scale), sy, yaw, rgb: [r, g, b], tr (collider radius) }].
import * as THREE from 'three';
import { createTreeInstanceWriter } from '../environment/tree-instances.js';
import { SPECIES, canopyGeometry, trunkGeometry, envelopeOf, farBlobGeometry, stemGeometry } from './treegeo.js';
import { canopyMaterial, coniferMaterial, trunkMaterial } from './leafmat.js';
const hyp = (a, b) => Math.sqrt(a * a + b * b);      // (round 4, 2026-10-16: Math.hypot allocates in V8 (117 MB per 20 s of driving); every use in this file has two arguments)

/** leaf colours per family (summer; per-tree brightness jitter is applied by the planner) */
export const LEAF = { limeA: ['#4f7a2e', '#5a8434', '#62893a'], limeB: ['#467028', '#4f7a2e', '#5a8434'], mapleA: ['#5e9a35', '#6aa43c', '#548e2f'], elm: ['#4a7430', '#527c36', '#58803a'], ash: ['#5a8a38', '#639240', '#4e7e30'], birchA: ['#7aa840', '#86b04a', '#6fa03c'], birchB: ['#7aa840', '#86b04a', '#6fa03c'], spruceA: ['#33605a', '#3a6a62', '#2f5a52'], spruceB: ['#33605a', '#3a6a62', '#2f5a52'], oak: ['#4a7430', '#527c36', '#3f6a2a'], shrub: ['#3f7a34', '#488238', '#386c2e'], poplar: ['#5a8a38', '#639240', '#4e7e30'] };
const LOD_D = [32, 95, 240];
const BARK = { lime: ['#5e5044', 0], ash: ['#8a857c', 0], oak: ['#6c5e4e', 0], maple: ['#7a6e62', 0], pale: ['#9a9488', 0], brown: ['#5a4638', 0], birch: ['#e4e1d6', 1] };
/** the stem the shared mid-level trunk draws for a family: [height m, foot radius factor], bark tint (the shared texture is a neutral furrowed grey) */
const STEM = { limeA: [4.3, 0.62], mapleA: [3.8, 0.62], elm: [5.2, 0.62], ash: [4.6, 0.62], oak: [3.9, 0.7], birchA: [5.6, 0.3], spruceA: [2.4, 0.2], shrub: [0, 0] };
const BARK_TINT = { lime: [0.30, 0.25, 0.21], maple: [0.40, 0.35, 0.30], ash: [0.50, 0.48, 0.44], oak: [0.34, 0.29, 0.25], pale: [0.6, 0.59, 0.56], brown: [0.28, 0.22, 0.18], birch: [1.25, 1.22, 1.14] };

function barkMat(ctx, kind) {
  const [col, birch] = BARK[kind] || BARK.lime, key = 'lmsmol-bark-' + kind;
  const map = ctx.tex.draw(128, 256, (g, w, h) => {
    const r = ctx.rng('bark-lmsmol-' + kind); g.fillStyle = col; g.fillRect(0, 0, w, h);
    if (birch) { for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(28,26,24,${0.5 + r() * 0.4})`; g.fillRect(r() * w, r() * h, 6 + r() * 20, 3 + r() * 5); } }
    else for (let i = 0; i < 36; i++) { const x = r() * w; g.strokeStyle = `rgba(32,26,20,${0.35 + r() * 0.35})`; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x + (r() - 0.5) * 8, y); g.stroke(); }
  }, { key, repeat: [1, 1] });
  return trunkMaterial(ctx, map, key);
}
/** the one bark of the shared stem: a light neutral furrowed grey with a few dark marks (the per-family tint makes it lime-brown or birch-white) */
function stemMat(ctx) {
  const map = ctx.tex.draw(64, 128, (g, w, h) => {
    const r = ctx.rng('bark-lmsmol-stem'); g.fillStyle = '#b4b0a8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { const x = r() * w; g.strokeStyle = `rgba(40,36,30,${0.3 + r() * 0.35})`; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 24) g.lineTo(x + (r() - 0.5) * 6, y); g.stroke(); }
    for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(30,28,24,0.55)'; g.fillRect(r() * w, r() * h, 6 + r() * 10, 2 + r() * 4); }
  }, { key: 'lmsmol-bark-stem', repeat: [1, 1] });
  return trunkMaterial(ctx, map, 'lmsmol-bark-stem');
}
const FOLD = { limeB: 'limeA', birchB: 'birchA', spruceB: 'spruceA' };

export function plantForest(K, list, name = 'lmsmol-forest') {
  const ctx = K.ctx, ph = ctx.physics, T = THREE;
  const group = new T.Group(); group.name = name;
  const matLobe = canopyMaterial(ctx), matTier = coniferMaterial(ctx), bark = {};
  for (const t of list) if (FOLD[t.fam]) t.fam = FOLD[t.fam];
  const fams = {}; for (const t of list) (fams[t.fam] ||= []).push(t);
  const col = new T.Color(), total = list.length;
  const C0 = {}, C1 = {}, T0 = {};                                                  // near and mid crowns per family, near trunks per family
  const mk = (geo, mat, cap, nm, o = {}) => {
    const im = new T.InstancedMesh(geo, mat, cap);
    im.instanceMatrix.setUsage(T.DynamicDrawUsage); if (o.color !== false) { im.setColorAt(0, col.setRGB(1, 1, 1)); im.instanceColor.setUsage(T.DynamicDrawUsage); }
    im.count = 0; im.frustumCulled = false; im.castShadow = !!o.cast; im.receiveShadow = !!o.cast; im.name = nm; im.visible = false; ctx.noBatch(im); group.add(im); return im;
  };
  for (const [fam, items] of Object.entries(fams)) {
    const F = SPECIES[fam], n = items.length, mat = F.kind === 'tiers' ? matTier : matLobe;
    C0[fam] = mk(canopyGeometry(fam, 0), mat, n, `${name}-${fam}-0`, { cast: true });
    C1[fam] = mk(canopyGeometry(fam, 1), mat, n, `${name}-${fam}-1`, { cast: true });
    const tg = trunkGeometry(fam, 0);
    if (tg) { const bm = bark[F.bark] || (bark[F.bark] = barkMat(ctx, F.bark)); const tm = mk(tg, bm, n, `${name}-trunk-${fam}-0`, { cast: true, color: false }); tm.instanceMatrix = C0[fam].instanceMatrix; T0[fam] = tm; }
  }
  const far2 = mk(farBlobGeometry(2), matLobe, total, `${name}-far2`), far3 = mk(farBlobGeometry(3), matLobe, total, `${name}-far3`);
  ctx.noOutline(far3);                                                              // beyond the 200 m reach of the outline pass: colour pass only
  const stem = mk(stemGeometry(), stemMat(ctx), total, `${name}-stem`);
  const env = {}; for (const fam of Object.keys(fams)) env[fam] = envelopeOf(fam);
  let colliders = 0;
  // n4spb (docs/AREAS.md 13.7, 15.v): a low shrub (1.4 m) within 14 m of the water has no collider: a bush is not a wall, and water is never fenced by one (the audit of tools/water-reachable-test.mjs, check 6); trunks (4.5 m) stay solid
  const nearWater = (x, z) => { if (!ph.waterLevel) return false; if (ph.waterLevel(x, z) !== null) return true; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; for (const d of [3.5, 7, 10.5, 14]) if (ph.waterLevel(x + Math.cos(a) * d, z + Math.sin(a) * d) !== null) return true; } return false; };
  for (const t of list) { if (t.fam === 'shrub' && nearWater(t.x, t.z)) continue; ph.addCylinder(t.x, t.z, t.tr, 0, t.fam === 'shrub' ? 1.4 : 4.5); colliders++; }
  // ---- LOD assignment
  const state = new Int8Array(list.length).fill(-1);
  const _dir = new T.Vector3();
  let fx = 0, fz = -1, cosLim = -2;
  function aimCone() {
    const cam = ctx.camera; if (!cam || !cam.getWorldDirection) { cosLim = -2; return; }
    const dir = cam.getWorldDirection(_dir), hl = hyp(dir.x, dir.z);
    if (hl < 0.55 || cam.position.y > 45) { cosLim = -2; return; }
    fx = dir.x / hl; fz = dir.z / hl;
    const half = Math.atan(Math.tan((cam.fov || 62) * Math.PI / 360) * (cam.aspect || 1.78)) + 18 * Math.PI / 180;
    cosLim = half >= 1.75 ? -2 : Math.cos(half);
  }
  // Near crowns, far ellipsoids and stems each have one immutable transform per
  // tree. Keep their opaque instance slots until LOD/cone membership changes.
  const nearWriter = createTreeInstanceWriter(list);
  const farWriter = createTreeInstanceWriter(list, t => {
    const e = env[t.fam], sy = t.sy ?? t.s;
    return { sx: t.s * e.r[0], sy: sy * e.r[1], sz: t.s * e.r[2], y: e.c[1] * sy };
  });
  const stemWriter = createTreeInstanceWriter(list, t => {
    const sm = STEM[t.fam] || [0, 0], F = SPECIES[t.fam], sx = F.trunk * sm[1] * t.s;
    return { sx, sy: sm[0] * (t.sy ?? t.s), sz: sx, rgb: BARK_TINT[F.bark] || BARK_TINT.lime };
  });
  const nearBuckets = {};
  for (const f in fams) nearBuckets[f] = [nearWriter.bucket(C0[f]), nearWriter.bucket(C1[f])];
  const farBuckets = [farWriter.bucket(far2), farWriter.bucket(far3)], stemBucket = stemWriter.bucket(stem);
  function move(i, l) {
    if (state[i] === l) return;
    state[i] = l;
    const fam = list[i].fam;
    nearWriter.assign(l >= 0 && l <= 1 ? nearBuckets[fam][l] : -1, i);
    farWriter.assign(l >= 2 ? farBuckets[l - 2] : -1, i);
    stemWriter.assign(l === 1 && STEM[fam]?.[0] > 0 ? stemBucket : -1, i);
  }
  function assign(cx, cz) {
    for (let i = 0; i < list.length; i++) {
      const t = list[i], dx = t.x - cx, dz = t.z - cz, d = hyp(dx, dz);
      let l = d < LOD_D[0] ? 0 : d < LOD_D[1] ? 1 : d < LOD_D[2] ? 2 : 3;
      if (l === 3 && t.fam === 'shrub') { if (state[i] !== -1) move(i, -1); continue; } // undergrowth is not drawn beyond 240 m
      if (l >= 2 && cosLim > -2 && dx * fx + dz * fz < cosLim * d) { if (state[i] !== -1) move(i, -1); continue; }
      const pv = state[i];
      if (pv >= 0 && pv !== l) { const lo = pv === 0 ? 0 : LOD_D[pv - 1] * 0.9, hi = pv === 3 ? 1e9 : LOD_D[pv] * 1.1; if (d >= lo && d < hi) l = pv; }
      if (pv !== l) move(i, l);
    }
    nearWriter.finish(); farWriter.finish(); stemWriter.finish();
    for (const f in T0) { const c = C0[f].count; T0[f].count = c; T0[f].visible = c > 0; }
  }
  // the first pack: a distant viewpoint keeps the whole forest as far blobs (the check counts these); the real camera takes over on the first update
  const lastAt = { x: 1e9, z: 1e9, t: -10, fx: 0, fz: 0 };
  assign(1e9, 1e9);
  ctx.onUpdate((dt, t) => {
    const p = ctx.camera && ctx.camera.position; if (!p) return;
    const moved = hyp(p.x - lastAt.x, p.z - lastAt.z), was = cosLim > -2;
    aimCone();
    const turned = (cosLim > -2) !== was || (cosLim > -2 && fx * lastAt.fx + fz * lastAt.fz < 0.9945);
    if (moved > 2.5 || (Math.abs(t - lastAt.t) > 1.5 && moved > 0.5) || turned) { assign(p.x, p.z); lastAt.x = p.x; lastAt.z = p.z; lastAt.t = t; lastAt.fx = fx; lastAt.fz = fz; }
  });
  K.root.add(group);
  return { group, colliders, count: list.length };
}
