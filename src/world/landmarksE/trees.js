// landmarksE/trees.js - the trees of the Ostrovsky ensemble (the environment module plants none on paving / in the Catherine Garden): instanced low-poly crowns (broad lime / maple / elm, round
// clipped crowns, blue spruce) + trunks, one InstancedMesh per kind, instance colours in July greens.  K.trees.add(x, z, o) from any part; K.trees.build(root) once at the end.
//   o = { kind: 'broad' | 'round' | 'spruce' | 'young', r (crown radius), h (total height), trunk (trunk height, default 0.38 h), hex, solid (trunk collider, default true) }
// Sources: docs/research/gostiny-dvor-ostrovsky.md 3.6 (young lindens 5-6 m, crown 2.5-3 m on the promenade), 5.5 (garden crowns 15-22 m, #2f5a30 shade / #4f8a4a light), 8.2 (blue spruce 8-14 m, birches).
import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';
import { SPECIES, winterTreeGeometry } from '../environment/treegeo.js';

const LEAF = {
  broad: ['#4a7a30', '#548634', '#427228', '#5d8c3a', '#3f6a2a'],
  round: ['#5fa03a', '#68a843', '#58993a'],
  young: ['#6fa356', '#7bae5c', '#66994e'],
  spruce: ['#3f6b66', '#46746e', '#386058', '#355f50'],
};

function blobs(list) {
  // list of [x, y, z, r, sy]: a crown as merged low-poly blobs (icosahedra, detail 0 / 1)
  const geos = [];
  for (const [x, y, z, r, sy, det] of list) {
    const g = new THREE.IcosahedronGeometry(1, det ?? 0); g.scale(r, r * (sy ?? 0.85), r); g.translate(x, y, z);
    // non-indexed -> indexed unify: IcosahedronGeometry is non-indexed; keep it so
    geos.push(g);
  }
  return mergeNonIndexed(geos);
}
function mergeNonIndexed(geos) {
  let n = 0; for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  for (const g of geos) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3); nrm.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2); o += c; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}
function cones(list) {
  const geos = [];
  for (const [y, r, h] of list) { const g = new THREE.ConeGeometry(r, h, 8, 1, false); g.translate(0, y + h / 2, 0); geos.push(g.toNonIndexed()); }
  return mergeNonIndexed(geos);
}

export function makeTrees(K) {
  const ctx = K.ctx, T = ctx.mat.toon, list = { broad: [], round: [], young: [], spruce: [] }, trunks = [];
  const geo = {
    // unit crowns: radius 1 at the widest, height 1.0 above the crown base (y 0)
    broad: () => blobs([[0, 0.55, 0, 0.9, 0.62, 1], [0.6, 0.4, 0.2, 0.55, 0.75, 1], [-0.58, 0.42, -0.2, 0.58, 0.75, 1], [0.1, 0.38, 0.6, 0.55, 0.75], [-0.15, 0.4, -0.58, 0.55, 0.75], [0.08, 0.88, -0.1, 0.5, 0.75]]),
    round: () => blobs([[0, 0.5, 0, 1.0, 0.95, 1]]),
    young: () => blobs([[0, 0.5, 0, 0.9, 0.9], [0.4, 0.3, 0.2, 0.6, 0.8], [-0.35, 0.35, -0.2, 0.6, 0.8]]),
    spruce: () => cones([[0, 1.0, 0.45], [0.2, 0.84, 0.4], [0.4, 0.66, 0.38], [0.6, 0.46, 0.36], [0.8, 0.26, 0.34]]),
  };
  const mat = { broad: T('#ffffff', { name: 'lmE-crown', paint: 0.06 }), round: T('#ffffff', { name: 'lmE-crownR', paint: 0.06 }), young: T('#ffffff', { name: 'lmE-crownY', paint: 0.06 }), spruce: T('#ffffff', { name: 'lmE-spruce', paint: 0.04 }) };
  const bark = T('#5a4a3c', { name: 'lmE-bark' });
  let seed = 4711; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const api = {
    count: 0,
    add(x, z, o = {}) {
      const kind = o.kind || 'broad', h = o.h ?? 10, r = o.r ?? 3.5, trunkH = o.trunk ?? (kind === 'spruce' ? 0.8 : h * 0.38), ry = rnd() * 6.283;
      const pal = LEAF[kind], hex = o.hex || pal[Math.floor(rnd() * pal.length)];
      list[kind].push({ x, z, r, h: Math.max(1, h - trunkH * (kind === 'spruce' ? 0.2 : 0.75)), base: trunkH * (kind === 'spruce' ? 0.2 : 0.75), ry, hex });
      if (kind !== 'spruce') trunks.push({ x, z, r: Math.max(0.12, r * 0.07), h: trunkH + h * 0.25 });
      if (o.solid !== false) ctx.physics.addCylinder(x, z, Math.max(0.2, r * 0.07 + 0.1), 0, 6);
      api.count++;
    },
    build(parent) {
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
      let tris = 0;
      for (const kind of Object.keys(list)) {
        const arr = list[kind]; if (!arr.length) continue;
        const winter = ctx.season === 'winter', bare = winter && kind !== 'spruce';
        const fam = kind === 'young' ? 'limeY' : 'limeA';
        const g = bare ? winterTreeGeometry(fam, 1) : geo[kind]();
        if (bare) g.scale(1 / SPECIES[fam].R, 1 / SPECIES[fam].H, 1 / SPECIES[fam].R);
        const im = new THREE.InstancedMesh(g, mat[kind], arr.length);
        arr.forEach((t, i) => {
          e.set(0, t.ry, 0); q.setFromEuler(e); s.set(t.r, t.h, t.r); p.set(t.x, t.base, t.z); m4.compose(p, q, s); im.setMatrixAt(i, m4);
          col.set(bare ? '#6a5c52' : winter ? '#89a7a2' : t.hex); im.setColorAt(i, col);
        });
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.castShadow = true; im.receiveShadow = true; im.name = 'lmE-trees-' + kind; im.computeBoundingSphere();
        parent.add(im); im.updateWorldMatrix(true, false);
        // Crowns use unit geometry with per-instance scales. Keep their original unlimited
        // visibility range when the engine splits this immutable set into spatial cells.
        registerLOD(im, Infinity); tris += g.attributes.position.count / 3 * arr.length;
      }
      if (trunks.length) {
        const g = new THREE.CylinderGeometry(0.6, 1.0, 1, 6, 1, false).toNonIndexed(); g.translate(0, 0.5, 0);
        const im = new THREE.InstancedMesh(g, bark, trunks.length);
        trunks.forEach((t, i) => { s.set(t.r, t.h, t.r); p.set(t.x, 0, t.z); q.identity(); m4.compose(p, q, s); im.setMatrixAt(i, m4); });
        im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.name = 'lmE-trunks'; im.computeBoundingSphere(); parent.add(im); im.updateWorldMatrix(true, false); registerLOD(im, Infinity); tris += 12 * trunks.length;
      }
      K.tris += tris; return tris;
    },
  };
  return api;
}
