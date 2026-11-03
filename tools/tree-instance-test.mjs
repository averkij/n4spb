// Headless check of tree repacking against the original matrix writer, including deferred GPU uploads.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createTreeInstanceWriter } from '../src/world/environment/tree-instances.js';
const N = 5000, trees = Array.from({ length: N }, (_, i) => ({ x: (i % 100) * 8 - 400, z: Math.floor(i / 100) * 8 - 200, yaw: i * 1.781, s: 0.4 + i % 19 / 13, sy: 0.5 + i % 13 / 9, rgb: [i % 5 / 5, i % 7 / 7, i % 13 / 13] }));
for(let i=0;i<N;i+=3)trees[i].y=-(i%8)*.25; // sloping park banks, alongside legacy flat-ground trees
const writer = createTreeInstanceWriter(trees), bucket = () => ({ instanceMatrix: new THREE.InstancedBufferAttribute(new Float32Array(N * 16), 16), instanceColor: new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3) });
const actual = Array.from({ length: 4 }, bucket), expected = Array.from({ length: 4 }, bucket), uploaded = new WeakMap();
let uploadFloats = 0, fullFloats = 0, checks = 0, stable = 0;
function original(mesh, slot, t) {
  const a = mesh.instanceMatrix.array, o = slot * 16, c = Math.cos(t.yaw), s = Math.sin(t.yaw), sx = t.s, sy = t.sy;
  a[o] = sx * c; a[o + 1] = 0; a[o + 2] = -sx * s; a[o + 3] = 0; a[o + 4] = 0; a[o + 5] = sy; a[o + 6] = 0; a[o + 7] = 0;
  a[o + 8] = sx * s; a[o + 9] = 0; a[o + 10] = sx * c; a[o + 11] = 0; a[o + 12] = t.x; a[o + 13] = t.y ?? 0; a[o + 14] = t.z; a[o + 15] = 1;
  const ca = mesh.instanceColor.array; ca[slot * 3] = t.rgb[0]; ca[slot * 3 + 1] = t.rgb[1]; ca[slot * 3 + 2] = t.rgb[2];
}
for (let frame = 0; frame < 40; frame++) {
  const cx = Math.floor(frame / 2) * 7 - 70, cz = Math.floor(frame / 2) * 3, count = [0, 0, 0, 0];
  for (let i = 0; i < N; i++) {
    const t = trees[i]; if (frame >= 20 && i % 17 === 0) continue; // Pruned trees never return.
    const distance = Math.hypot(t.x - cx, t.z - cz), lod = distance < 50 ? 0 : distance < 150 ? 1 : distance < 300 ? 2 : 3;
    if (lod >= 2 && t.x - cx < -30) continue;
    const slot = count[lod]++; original(expected[lod], slot, t); writer.write(actual[lod], slot, i);
  }
  for (let lod = 0; lod < 4; lod++) {
    const before = actual[lod].instanceMatrix.version; writer.flush(actual[lod]);
    if (frame % 2 && actual[lod].instanceMatrix.version === before) stable++;
    for (const key of ['instanceMatrix', 'instanceColor']) {
      const a = actual[lod][key], e = expected[lod][key], end = count[lod] * a.itemSize;
      assert.deepEqual(a.array.subarray(0, end), e.array.subarray(0, end)); checks += count[lod];
      // Mimic a bucket skipped by the renderer for several repacks. Pending writes must survive.
      if (frame % 4 === 0 || !count[lod]) continue;
      let gpu = uploaded.get(a); if (!gpu) uploaded.set(a, gpu = { version: -1, array: new Float32Array(a.array.length) });
      if (gpu.version !== a.version) {
        for (const r of a.updateRanges) { gpu.array.set(a.array.subarray(r.start, r.start + r.count), r.start); uploadFloats += r.count; }
        gpu.version = a.version; a.clearUpdateRanges();
      }
      assert.deepEqual(gpu.array.subarray(0, end), e.array.subarray(0, end), 'rendered prefix after deferred uploads');
      fullFloats += a.array.length;
    }
  }
}
assert(stable > 20, 'unchanged packs need no upload');
console.log(`RESULT: OK - ${checks} exact tree matrix/color instances, deferred uploads, pruning; ${stable} unchanged buckets; uploaded ${(uploadFloats / fullFloats * 100).toFixed(1)}% of previous full-capacity data.`);
