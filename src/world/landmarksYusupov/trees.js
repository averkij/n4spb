// landmarksYusupov/trees.js - instanced garden trees for the places this module owns (Arts Square garden): the species / canopy geometry of the environment module (copied: treegeo.js, leafmat.js, util.js) with
// per-family InstancedMeshes (canopy + trunk), per-instance colour, trunk colliders.  plantTrees(K, list): list = [{ x, z, fam, s, yaw, y }].
import * as THREE from 'three';
import { prepareTreeLods } from '../lib/tree-bounds.js';
import { SPECIES, canopyGeometry, trunkGeometry } from './treegeo.js';
import { canopyMaterial, trunkMaterial } from './leafmat.js';

export const LEAF = { limeA: ['#4f7a2e', '#5a8434', '#62893a'], limeB: ['#467028', '#4f7a2e', '#5a8434'], mapleA: ['#5e9a35', '#6aa43c', '#548e2f'], elm: ['#4a7430', '#527c36', '#58803a'], ash: ['#5a8a38', '#639240', '#4e7e30'], birchA: ['#7aa840', '#86b04a', '#6fa03c'], birchB: ['#7aa840', '#86b04a', '#6fa03c'], spruceA: ['#3a6a62', '#3f6f68', '#35625a'], spruceB: ['#3a6a62', '#3f6f68', '#35625a'], limeY: ['#5a8434', '#62893a', '#4f7a2e'], rowan: ['#6a9a3a', '#5a8a32', '#74a040'], shrub: ['#3f7a34', '#488238', '#386c2e'], oak: ['#4a7430', '#527c36', '#3f6a2a'], chestnut: ['#3f6a2e', '#4a7634', '#436e30'], poplar: ['#5a8a38', '#639240', '#4e7e30'], ball: ['#4f7a2e', '#5a8434', '#62893a'] };

export function plantTrees(K, list, name = 'lmY-trees') {
  const ctx = K.ctx, ph = ctx.physics, rng = ctx.rng(7711);
  const byFam = {}; for (const t of list) (byFam[t.fam] ||= []).push(t);
  const matLobe = canopyMaterial(ctx), col = new THREE.Color(), m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const barkMats = {}, group = new THREE.Group(); group.name = name;
  const sets = [];
  for (const [fam, items] of Object.entries(byFam)) {
    const F = SPECIES[fam], n = items.length;
    const mats = items.map((t) => { qt.setFromAxisAngle(up, t.yaw || 0); return new THREE.Matrix4().compose(new THREE.Vector3(t.x, t.y ?? 0.05, t.z), qt.clone(), new THREE.Vector3(t.s, t.s, t.s)); });
    const cols = items.map((t, i) => new THREE.Color((LEAF[fam] || LEAF.limeA)[i % 3]).multiplyScalar(0.94 + rng() * 0.12));
    const bk = F.bark;
    const bm = barkMats[bk] || (barkMats[bk] = trunkMaterial(ctx, ctx.tex.draw(128, 256, (g, w, h) => {
      const r = ctx.rng('bark-lmY-' + bk); g.fillStyle = bk === 'ash' ? '#8a857c' : bk === 'oak' ? '#6c5e4e' : bk === 'maple' ? '#7a6e62' : '#5e5044'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 36; i++) { const x = r() * w; g.strokeStyle = `rgba(32,26,20,${0.35 + r() * 0.35})`; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x + (r() - 0.5) * 8, y); g.stroke(); }
    }, { key: 'lmY-bark-' + bk, repeat: [1, 1] }), 'lmY-bark-' + bk));
    const lods = [0, 1, 2, 3].map((lod) => {
      const im = new THREE.InstancedMesh(canopyGeometry(fam, lod), matLobe, n); im.setColorAt(0, col.setRGB(1, 1, 1));
      im.castShadow = true; im.receiveShadow = true; im.name = `${name}-${fam}-${lod}`; im.count = lod === 3 ? n : 0;
      ctx.noBatch(im); group.add(im);
      const tg = trunkGeometry(fam, lod); let tm = null;
      if (tg) { tm = new THREE.InstancedMesh(tg, bm, n); tm.castShadow = true; tm.receiveShadow = true; tm.name = `${name}-trunk-${fam}-${lod}`; tm.count = lod === 3 ? n : 0; ctx.noBatch(tm); group.add(tm); }
      return { im, tm };
    });
    prepareTreeLods(lods, mats);
    sets.push({ items, mats, cols, lods });
    for (const t of items) ph.addCylinder(t.x, t.z, Math.max(0.25, F.trunk * t.s * 0.7), 0, 4.5);
  }
  // distance LOD (the environment's four crown levels): full crown < 45 m, 270 triangles < 120 m, 88 triangles < 320 m, a 28-triangle blob beyond (repacked when the player has moved 4 m)
  const LOD_D = [45, 120, 320];
  let lx = 1e9, lz = 1e9;
  const repack = (px, pz) => {
    for (const S of sets) {
      const cnt = [0, 0, 0, 0];
      S.items.forEach((t, i) => {
        const d = Math.hypot(t.x - px, t.z - pz), l = d < LOD_D[0] ? 0 : d < LOD_D[1] ? 1 : d < LOD_D[2] ? 2 : 3, L = S.lods[l], k = cnt[l]++;
        L.im.setMatrixAt(k, S.mats[i]); L.im.setColorAt(k, S.cols[i]); if (L.tm) L.tm.setMatrixAt(k, S.mats[i]);
      });
      S.lods.forEach((L, l) => { L.im.count = cnt[l]; L.im.visible = cnt[l] > 0; if (L.tm) L.tm.visible = cnt[l] > 0; L.im.instanceMatrix.needsUpdate = true; if (L.im.instanceColor) L.im.instanceColor.needsUpdate = true; if (L.tm) { L.tm.count = cnt[l]; L.tm.instanceMatrix.needsUpdate = true; } });
    }
  };
  repack(1e9, 1e9);
  ctx.onUpdate(() => { const p = ctx.player && ctx.player.position; if (!p) return; if (Math.hypot(p.x - lx, p.z - lz) > 4) { lx = p.x; lz = p.z; repack(p.x, p.z); } });
  K.root.add(group);
  return group;
}
export { SPECIES };
