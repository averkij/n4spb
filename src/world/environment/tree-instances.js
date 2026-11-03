// environment/tree-instances.js - pack immutable tree transforms into camera-dependent LOD buckets.
// Trees only change their selected LOD or dead flag after placement. Opaque instances can retain their
// slots: removing one swaps in the last member, instead of shifting every following tree. Pending
// upload ranges survive hidden frames, and bounded range coalescing avoids a growing per-frame queue.
const persistentFlush = typeof location === 'undefined' || new URLSearchParams(location.search).get('treeflush') !== '0';
export function createTreeInstanceWriter(trees, shapeOf = null) {
  const matrices = new Float32Array(trees.length * 16), colors = new Float32Array(trees.length * 3), buckets = new WeakMap(), list = [];
  const membership = new Int32Array(trees.length).fill(-1), slots = new Int32Array(trees.length);
  for (let i = 0; i < trees.length; i++) {
    const t = trees[i], shape = shapeOf ? shapeOf(t) : t, o = i * 16, c = Math.cos(t.yaw), s = Math.sin(t.yaw);
    const sx = shape.sx ?? t.s, sy = shape.sy ?? t.sy ?? t.s, sz = shape.sz ?? sx;
    matrices[o] = sx * c; matrices[o + 2] = -sx * s; matrices[o + 5] = sy;
    matrices[o + 8] = sz * s; matrices[o + 10] = sz * c; matrices[o + 12] = t.x; matrices[o + 13] = shape.y ?? 0;
    matrices[o + 14] = t.z; matrices[o + 15] = 1;
    colors.set(shape.rgb || t.rgb, i * 3);
  }
  // Persistent scratch (perf plan item 2): dirty slots live in per-bucket typed arrays, and range
  // merging uses writer-wide int pairs that only grow. updateRanges entries are pooled per attribute,
  // so a flush allocates nothing. three.js may merge the pooled records in place when it uploads;
  // their values are copied out before reuse. ?treeflush=0 restores the original allocating flush.
  let pairsA = new Int32Array(256), pairsB = new Int32Array(256), pairsC = new Int32Array(256);
  const pools = new WeakMap();
  function bucket(mesh) {
    let b = buckets.get(mesh);
    if (!b) {
      const capacity = mesh.instanceMatrix.count;
      b = { id: list.length, mesh, count: 0, owners: new Int32Array(capacity).fill(-1), dirty: new Set(),
        flags: new Uint8Array(capacity), slots: new Int32Array(capacity), dirtyN: 0 };
      buckets.set(mesh, b); list.push(b);
    }
    return b;
  }
  function copy(b, slot, tree) {
    b.owners[slot] = tree;
    // Element loops, not array.set(subarray): each subarray is a new typed-array view on the heap.
    const m = b.mesh.instanceMatrix.array, c = b.mesh.instanceColor.array, mo = slot * 16, mi = tree * 16, co = slot * 3, ci = tree * 3;
    for (let k = 0; k < 16; k++) m[mo + k] = matrices[mi + k];
    c[co] = colors[ci]; c[co + 1] = colors[ci + 1]; c[co + 2] = colors[ci + 2];
    if (!persistentFlush) b.dirty.add(slot);
    else if (!b.flags[slot]) { b.flags[slot] = 1; b.slots[b.dirtyN++] = slot; }
  }
  function mark(attribute, ranges, stride) {
    // Never clear old pending writes merely because a mesh was hidden: three.js
    // clears ranges only after upload. Coalesce both generations together.
    const pending = attribute.updateRanges.map(r => ({ start: r.start, count: r.count }));
    for (const [start, end] of ranges) pending.push({ start: start * stride, count: (end - start) * stride });
    pending.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const r of pending) {
      const last = merged[merged.length - 1];
      if (last && r.start <= last.start + last.count) last.count = Math.max(last.count, r.start + r.count - last.start);
      else merged.push(r);
    }
    attribute.clearUpdateRanges();
    if (merged.length > 64) {
      const first = merged[0], last = merged[merged.length - 1];
      attribute.addUpdateRange(first.start, last.start + last.count - first.start);
    } else for (const r of merged) attribute.addUpdateRange(r.start, r.count);
    attribute.needsUpdate = true;
  }
  // pairsA[0, 2 * nNew) holds the new slot ranges [start, end), sorted and disjoint. Old pending
  // ranges (elements) are copied into pairsB and ordered (three.js sorts only at upload); the
  // coalesced union goes to pairsC and then into the pooled updateRanges records.
  function markPersistent(attribute, nNew, stride) {
    const ur = attribute.updateRanges, nOld = ur.length;
    if (pairsB.length < 2 * nOld) pairsB = new Int32Array(2 * nOld + 256);
    if (pairsC.length < 2 * (nOld + nNew)) pairsC = new Int32Array(2 * (nOld + nNew) + 256);
    for (let i = 0; i < nOld; i++) {
      const s = ur[i].start, e = s + ur[i].count; let k = i - 1;
      while (k >= 0 && pairsB[2 * k] > s) { pairsB[2 * k + 2] = pairsB[2 * k]; pairsB[2 * k + 3] = pairsB[2 * k + 1]; k--; }
      pairsB[2 * k + 2] = s; pairsB[2 * k + 3] = e;
    }
    let i = 0, j = 0, m = 0, cs = 0, ce = -1;
    while (i < nOld || j < nNew) {
      let s, e;
      const os = i < nOld ? pairsB[2 * i] : Infinity, ns = j < nNew ? pairsA[2 * j] * stride : Infinity;
      if (os <= ns) { s = os; e = pairsB[2 * i + 1]; i++; } else { s = ns; e = pairsA[2 * j + 1] * stride; j++; }
      if (ce >= s) { if (e > ce) ce = e; }
      else { if (ce >= 0) { pairsC[2 * m] = cs; pairsC[2 * m + 1] = ce; m++; } cs = s; ce = e; }
    }
    if (ce >= 0) { pairsC[2 * m] = cs; pairsC[2 * m + 1] = ce; m++; }
    if (m > 64) { pairsC[1] = pairsC[2 * m - 1]; m = 1; }               // bounded queue: one covering span
    let pool = pools.get(attribute); if (!pool) pools.set(attribute, (pool = []));
    ur.length = 0;
    for (let k = 0; k < m; k++) {
      const r = pool[k] || (pool[k] = { start: 0, count: 0 });
      r.start = pairsC[2 * k]; r.count = pairsC[2 * k + 1] - pairsC[2 * k]; ur.push(r);
    }
    attribute.needsUpdate = true;
  }
  function flush(b) {
    if (!b) return;
    if (persistentFlush) {
      const n = b.dirtyN; if (!n) return;
      const slots = b.slots;
      // insertion sort for small sets, the typed-array numeric sort otherwise (in place, no comparator)
      if (n < 48) for (let i = 1; i < n; i++) { const v = slots[i]; let k = i - 1; while (k >= 0 && slots[k] > v) { slots[k + 1] = slots[k]; k--; } slots[k + 1] = v; }
      else slots.subarray(0, n).sort();
      let r = 0;
      if (pairsA.length < 2 * n) pairsA = new Int32Array(2 * n + 256);
      for (let i = 0; i < n; i++) {
        const slot = slots[i]; b.flags[slot] = 0;
        if (r && slot === pairsA[2 * r - 1]) pairsA[2 * r - 1]++;
        else { pairsA[2 * r] = slot; pairsA[2 * r + 1] = slot + 1; r++; }
      }
      b.dirtyN = 0;
      markPersistent(b.mesh.instanceMatrix, r, 16); markPersistent(b.mesh.instanceColor, r, 3);
      return;
    }
    if (!b.dirty.size) return;
    const dirty = [...b.dirty].sort((a, b) => a - b), ranges = [];
    for (const slot of dirty) {
      const last = ranges[ranges.length - 1];
      if (last && slot === last[1]) last[1]++;
      else ranges.push([slot, slot + 1]);
    }
    mark(b.mesh.instanceMatrix, ranges, 16); mark(b.mesh.instanceColor, ranges, 3);
    b.dirty.clear();
  }
  return {
    // Register once and use a numeric bucket in the hot loop: no WeakMap lookup
    // for each unchanged tree. A tree belongs to one bucket per writer, or -1.
    bucket(mesh) { return bucket(mesh).id; },
    assign(id, tree) {
      const previous = membership[tree]; if (previous === id) return;
      if (previous >= 0) {
        const b = list[previous], slot = slots[tree], last = --b.count;
        if (slot !== last) { const moved = b.owners[last]; copy(b, slot, moved); slots[moved] = slot; }
        b.owners[last] = -1;
      }
      membership[tree] = id;
      if (id >= 0) {
        const b = list[id], slot = b.count++;
        if (slot >= b.owners.length) throw new Error('Tree instance bucket capacity exceeded');
        slots[tree] = slot; copy(b, slot, tree);
      }
    },
    finish() {
      for (const b of list) { b.mesh.count = b.count; b.mesh.visible = b.count > 0; flush(b); }
    },
    // Explicit slot API retained for callers comparing the original sorted pack.
    write(mesh, slot, tree) {
      const b = bucket(mesh); if (b.owners[slot] === tree) return;
      copy(b, slot, tree);
    },
    flush(mesh) { flush(buckets.get(mesh)); },
  };
}
