// COPY of landmarksKarpovka/trees.js (modules never import each other); used by landmarksKirova for the birches / lilacs / limes at the monument.
// landmarksKirova/trees.js - instanced garden trees for the places this module owns (Arts Square garden): the species / canopy geometry of the environment module (copied: treegeo.js, leafmat.js, util.js) with
// per-family InstancedMeshes (canopy + trunk), per-instance colour, trunk colliders.  plantTrees(K, list): list = [{ x, z, fam, s, yaw, y }].
import * as THREE from 'three';
import { prepareTreeLods } from '../lib/tree-bounds.js';
import { SPECIES, canopyGeometry, trunkGeometry } from './treegeo.js';
import { canopyMaterial, trunkMaterial } from './leafmat.js';

export const LEAF = { limeA: ['#4f7a2e', '#5a8434', '#62893a'], limeB: ['#467028', '#4f7a2e', '#5a8434'], mapleA: ['#5e9a35', '#6aa43c', '#548e2f'], elm: ['#4a7430', '#527c36', '#58803a'], ash: ['#5a8a38', '#639240', '#4e7e30'], birchA: ['#7aa840', '#86b04a', '#6fa03c'], birchB: ['#7aa840', '#86b04a', '#6fa03c'], spruceA: ['#3a6a62', '#3f6f68', '#35625a'], spruceB: ['#3a6a62', '#3f6f68', '#35625a'], limeY: ['#5a8434', '#62893a', '#4f7a2e'], rowan: ['#6a9a3a', '#5a8a32', '#74a040'], shrub: ['#3f7a34', '#488238', '#386c2e'], oak: ['#4a7430', '#527c36', '#3f6a2a'], chestnut: ['#3f6a2e', '#4a7634', '#436e30'], poplar: ['#5a8a38', '#639240', '#4e7e30'], ball: ['#4f7a2e', '#5a8434', '#62893a'] };

/** the far crown (lod 3) carries its thin trunk in the SAME geometry (dark vertex colour x the leaf tint): a separate far trunk mesh costs a draw call in each of the three passes for a stem nobody sees beyond 110 m */
function withStem(cg, tg) {
  const g = new THREE.BufferGeometry(), nc = cg.attributes.position.count, nt = tg.attributes.position.count;
  const cat = (name, size, fill) => { const a = new Float32Array((nc + nt) * size); a.set(cg.attributes[name].array, 0); const tgA = tg.attributes[name]; for (let i = 0; i < nt; i++) for (let k = 0; k < size; k++) a[(nc + i) * size + k] = tgA ? tgA.array[i * size + k] : fill; g.setAttribute(name, new THREE.BufferAttribute(a, size)); };
  cat('position', 3, 0); cat('normal', 3, 0); cat('uv', 2, 0); cat('color', 3, 0.45);
  const ci = cg.index.array, ti = tg.index.array, ix = new Uint16Array(ci.length + ti.length); ix.set(ci, 0); for (let i = 0; i < ti.length; i++) ix[ci.length + i] = ti[i] + nc;
  g.setIndex(new THREE.BufferAttribute(ix, 1));
  return g;
}

/** crown levels of the environment geometry that are used here: the 270-triangle crown < 110 m, the 28-triangle blob beyond (2 levels, not 4: every level of every family is a draw call) */
const LODS = [1, 3];
export function plantTrees(K, list, name = 'lmKir-trees') {
  const ctx = K.ctx, ph = ctx.physics, rng = ctx.rng(7711);
  const byFam = {}; for (const t of list) (byFam[t.fam] ||= []).push(t);
  const matLobe = canopyMaterial(ctx), col = new THREE.Color(), m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const barkMats = {}, group = new THREE.Group(); group.name = name;
  const sets = [];
  for (const [fam, items] of Object.entries(byFam)) {
    const F = SPECIES[fam], n = items.length;
    const mats = items.map((t) => { qt.setFromAxisAngle(up, t.yaw || 0); return new THREE.Matrix4().compose(new THREE.Vector3(t.x, t.y ?? 0.05, t.z), qt.clone(), new THREE.Vector3(t.s, t.sy ?? t.s, t.s)); });
    const cols = items.map((t, i) => new THREE.Color(t.col || (LEAF[fam] || LEAF.limeA)[i % 3]).multiplyScalar(0.94 + rng() * 0.12));
    const bk = F.bark;
    const bm = barkMats[bk] || (barkMats[bk] = trunkMaterial(ctx, ctx.tex.draw(128, 256, (g, w, h) => {
      const r = ctx.rng('bark-lmKir-' + bk); g.fillStyle = bk === 'ash' ? '#8a857c' : bk === 'larch' ? '#6a4a38' : bk === 'oak' ? '#6c5e4e' : bk === 'maple' ? '#7a6e62' : '#5e5044'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 36; i++) { const x = r() * w; g.strokeStyle = `rgba(32,26,20,${0.35 + r() * 0.35})`; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x + (r() - 0.5) * 8, y); g.stroke(); }
    }, { key: 'lmKir-bark-' + bk, repeat: [1, 1] }), 'lmKir-bark-' + bk));
    const lods = (fam === 'larch' ? [0, 3] : LODS).map((lod) => {
      const tg = trunkGeometry(fam, lod);
      const im = new THREE.InstancedMesh(lod === 3 && tg ? withStem(canopyGeometry(fam, lod), tg) : canopyGeometry(fam, lod), matLobe, n); im.setColorAt(0, col.setRGB(1, 1, 1));
      im.frustumCulled = true; im.castShadow = true; im.receiveShadow = true; im.name = `${name}-${fam}-${lod}`; im.count = 0; im.visible = false;
      ctx.noBatch(im); group.add(im);
      let tm = null;
      if (tg && lod !== 3) { tm = new THREE.InstancedMesh(tg, bm, n); tm.frustumCulled = true; tm.castShadow = true; tm.receiveShadow = true; tm.name = `${name}-trunk-${fam}-${lod}`; tm.count = 0; tm.visible = false; ctx.noBatch(tm); group.add(tm); }
      return { im, tm };
    });
    prepareTreeLods(lods, mats);
    sets.push({ items, mats, cols, lods });
    for (const t of items) ph.addCylinder(t.x, t.z, t.tr ?? Math.max(0.25, F.trunk * t.s * 0.7), 0, 4.5);
  }
  // distance LOD (the environment's four crown levels): full crown < 45 m, 270 triangles < 120 m, 88 triangles < 320 m, a 28-triangle blob beyond (repacked when the player has moved 4 m)
  const LOD_D = [110];
  let lx = 1e9, lz = 1e9;
  const repack = (px, pz) => {
    for (const S of sets) {
      const cnt = [0, 0];
      S.items.forEach((t, i) => {
        const d = Math.hypot(t.x - px, t.z - pz), l = d < LOD_D[0] ? 0 : 1, L = S.lods[l], k = cnt[l]++;
        L.im.setMatrixAt(k, S.mats[i]); L.im.setColorAt(k, S.cols[i]); if (L.tm) L.tm.setMatrixAt(k, S.mats[i]);
      });
      S.lods.forEach((L, l) => { L.im.count = cnt[l]; L.im.visible = cnt[l] > 0; if (L.tm) L.tm.visible = cnt[l] > 0; L.im.instanceMatrix.needsUpdate = true; if (L.im.instanceColor) L.im.instanceColor.needsUpdate = true; if (L.tm) { L.tm.count = cnt[l]; L.tm.instanceMatrix.needsUpdate = true; } });
    }
  };
  // Start empty; the first update assigns camera-distance LODs. prepareTreeLods marks every bucket
  // dynamic so static outlines cannot freeze its first (or any later) membership.
  ctx.onUpdate(() => { const p = ctx.player && ctx.player.position; if (!p) return; if (Math.hypot(p.x - lx, p.z - lz) > 4) { lx = p.x; lz = p.z; repack(p.x, p.z); } });
  K.root.add(group);
  return group;
}
export { SPECIES };
