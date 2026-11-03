// Boundary of a union of already-noded water rings, restricted to an area's
// natural shoreline. Each directed edge has water on its left and occurs once.
export function exposedShoreChains(rings, inScope, wetAt, includeOwners = false) {
  const nodes = new Map(), edges = [], seen = new Set();
  const node = (x, z) => {
    const key = `${Math.round(x * 1e5)},${Math.round(z * 1e5)}`;
    let q = nodes.get(key);
    if (!q) nodes.set(key, q = { key, p: [x, z], outgoing: [], incoming: 0 });
    return q;
  };
  for (const g of rings) {
    if (g.owner && !includeOwners) continue;
    for (let i = 0; i < g.o.length; i += 2) {
      const j = (i + 2) % g.o.length, ax = g.o[i], az = g.o[i + 1], bx = g.o[j], bz = g.o[j + 1];
      const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      if (len < 1e-5 || !inScope((ax + bx) / 2, (az + bz) / 2)) continue;
      const nx = -dz / len * .01, nz = dx / len * .01, x = (ax + bx) / 2, z = (az + bz) / 2;
      const left = wetAt(x + nx, z + nz), right = wetAt(x - nx, z - nz);
      if (left === right) continue;
      const a = left ? node(ax, az) : node(bx, bz), b = left ? node(bx, bz) : node(ax, az);
      const key = a.key < b.key ? `${a.key}:${b.key}` : `${b.key}:${a.key}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const edge = { a, b, key: g.key, used: false };
      a.outgoing.push(edge); b.incoming++; edges.push(edge);
    }
  }
  const chains = [];
  const trace = first => {
    const pts = [first.a.p]; let edge = first;
    while (edge && !edge.used) {
      edge.used = true; pts.push(edge.b.p);
      if (edge.b === first.a) break;
      const dx = edge.b.p[0] - edge.a.p[0], dz = edge.b.p[1] - edge.a.p[1];
      let next = null, best = -Infinity;
      for (const q of edge.b.outgoing) if (!q.used && q.key === first.key) {
        const vx = q.b.p[0] - q.a.p[0], vz = q.b.p[1] - q.a.p[1];
        const score = (dx * vx + dz * vz) / (Math.hypot(dx, dz) * Math.hypot(vx, vz));
        if (score > best) { best = score; next = q; }
      }
      edge = next;
    }
    chains.push({ key: first.key, pts, closed: pts.at(-1) === pts[0], natural: true });
  };
  for (const edge of edges) if (!edge.used && edge.a.incoming === 0) trace(edge);
  for (const edge of edges) if (!edge.used) trace(edge);
  return chains;
}
