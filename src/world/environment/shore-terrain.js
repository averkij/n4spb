// One continuous height field around a park's connected ponds. Independent
// offset ribbons fold over one another at narrow islands and acute corners;
// distance to the exposed water boundary keeps those places continuous too.
export function shoreTerrain(runs, waterways, isWater, boundaries = []) {
  if (!runs.length) return { surfaces: [], cuts: [] };
  const cell = 2, bucket = 32, grid = new Map(), candidates = new Map();
  const sources=[...runs.map(r=>({r,pts:r.pts,cut:true})),...boundaries.map(b=>({r:runs.find(r=>r.reach.key===b.key),pts:b.pts,cut:false})).filter(s=>s.r)];
  for (const {r,pts,cut} of sources) {
    const { water, bed } = waterways[r.reach.key];
    const radius = Math.max(r.reach.run, Math.max(3, (water - bed) * 2.5));
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      if (l2 < 1e-10) continue;
      const s = { ax, az, dx, dz, l2, r, water, bed, radius };
      const pad = radius + cell * 2;
      const x0 = Math.min(ax, bx) - pad, x1 = Math.max(ax, bx) + pad;
      const z0 = Math.min(az, bz) - pad, z1 = Math.max(az, bz) + pad;
      for (let x = Math.floor(x0 / bucket); x <= Math.floor(x1 / bucket); x++) for (let z = Math.floor(z0 / bucket); z <= Math.floor(z1 / bucket); z++) {
        const key = x * 8192 + z;
        let list = grid.get(key); if (!list) grid.set(key, list = []); list.push(s);
      }
      if(cut)for (let x = Math.floor(x0 / cell); x < Math.ceil(x1 / cell); x++) for (let z = Math.floor(z0 / cell); z < Math.ceil(z1 / cell); z++) candidates.set(x * 65536 + z, [x, z]);
    }
  }
  const nearest = (x, z) => {
    let d2 = Infinity, segment = null;
    for (const s of grid.get(Math.floor(x / bucket) * 8192 + Math.floor(z / bucket)) || []) {
      const t = Math.max(0, Math.min(1, ((x - s.ax) * s.dx + (z - s.az) * s.dz) / s.l2));
      const q = (x - s.ax - t * s.dx) ** 2 + (z - s.az - t * s.dz) ** 2;
      if (q < d2) { d2 = q; segment = s; }
    }
    return { d: Math.sqrt(d2), segment };
  };
  const vertices = new Map(), surfaces = [], rows = new Map();
  const vertex = (ix, iz) => {
    const id = ix * 65536 + iz;
    if (vertices.has(id)) return vertices.get(id);
    const x = ix * cell, z = iz * cell, { d, segment: s } = nearest(x, z);
    const level = s.water + .08, wet = isWater(x, z);
    const y = wet ? level + (s.bed - level) * Math.min(1, d / Math.max(3, (s.water - s.bed) * 2.5)) : level * (1 - Math.min(1, d / s.r.reach.run));
    const p = [Math.fround(x), Math.fround(y), Math.fround(z)]; vertices.set(id, p); return p;
  };
  for (const [ix, iz] of candidates.values()) {
    const { d, segment: s } = nearest((ix + .5) * cell, (iz + .5) * cell);
    if (!s || d > s.radius + Math.SQRT2 * cell) continue;
    const points = [vertex(ix, iz), vertex(ix, iz + 1), vertex(ix + 1, iz + 1), vertex(ix + 1, iz)];
    surfaces.push({ bank: s.r.bank, reach: s.r.reach, key: s.r.reach.key, kind: points.every(p => p[1] < s.water - .3) ? 'bed' : 'grass', points, walk: true, normal: [0, 1, 0] });
    let row = rows.get(iz); if (!row) rows.set(iz, row = []); row.push(ix);
  }
  // A low retaining edge belongs only to the island's river-facing coast.
  // Pond banks stay entirely green; no granite parapets or invisible barriers.
  const terrainHeight = (x, z) => {
    const ix = Math.floor(x / cell), iz = Math.floor(z / cell), u = x / cell - ix, v = z / cell - iz;
    const a = vertex(ix, iz)[1], b = vertex(ix, iz + 1)[1], c = vertex(ix + 1, iz + 1)[1], d = vertex(ix + 1, iz)[1];
    return v >= u ? a * (1 - v) + b * (v - u) + c * u : a * (1 - u) + c * v + d * (u - v);
  };
  for (const r of runs) {
    if (!r.reach.stoneEdge) continue;
    const water = waterways[r.reach.key].water;
    for (let i = 0; i + 1 < r.fr.length; i++) {
      const a = r.fr[i], b = r.fr[i + 1];
      if (!r.reach.stoneEdge((a.x + b.x) / 2, (a.z + b.z) / 2)) continue;
      const point = (q, d, y) => [q.x + q.mx * q.k * d, y, q.z + q.mz * q.k * d].map(Math.fround);
      const ay = Math.max(water + .18, terrainHeight(a.x, a.z) + .12), by = Math.max(water + .18, terrainHeight(b.x, b.z) + .12);
      const top = [point(a, -.04, ay), point(b, -.04, by), point(b, .32, by), point(a, .32, ay)];
      surfaces.push({ bank: r.bank, reach: r.reach, key: r.reach.key, kind: 'coping', points: top, walk: true, normal: [0, 1, 0] });
      surfaces.push({ bank: r.bank, reach: r.reach, key: r.reach.key, kind: 'wall', points: [point(a, -.04, water - .3), point(b, -.04, water - .3), top[1], top[0]], walk: false, normal: [-a.mx, 0, -a.mz] });
    }
  }
  // Ground clipping needs the same footprint, but a rectangle per contiguous
  // row is considerably cheaper than subtracting every terrain cell.
  const cuts = [], active = new Map();
  for (const iz of [...rows.keys()].sort((a, b) => a - b)) {
    const xs = rows.get(iz).sort((a, b) => a - b), intervals = [];
    for (const x of xs) {
      const last = intervals.at(-1);
      if (last && last[1] === x) last[1]++; else intervals.push([x, x + 1]);
    }
    for (const [a, b] of intervals) {
      const key = a + ',' + b, prev = active.get(key);
      if (prev && prev.z1 === iz) prev.z1++;
      else { const c = { x0: a, x1: b, z0: iz, z1: iz + 1 }; cuts.push(c); active.set(key, c); }
    }
  }
  return { surfaces, cuts: cuts.map(c => {
    const q = [[c.x0 * cell, c.z0 * cell], [c.x1 * cell, c.z0 * cell], [c.x1 * cell, c.z1 * cell], [c.x0 * cell, c.z1 * cell]];
    return { reach: runs[0].reach.id, key: runs[0].reach.key, vegetated: true, q, flat: q.flat() };
  }) };
}
