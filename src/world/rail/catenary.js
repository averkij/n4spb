// rail/catenary.js - 3 kV DC overhead contact line of the station field: messenger wire + zig-zag contact wire per electrified track (ctx.wires, one draw call),
// droppers, brackets off the canopy girders (supports come from canopy.js), single steel masts with cantilevers beyond the canopies and in the throat / yard,
// and two lattice signal gantries over the throat. Heights above the rail head: contact wire 5.9 m, messenger 7.3 m (docs/research/station.md: 5.8 / 7.0).
import { RAIL_TOP, HG } from './geom.js';
import { col } from './gb.js';

const CONTACT = 5.9, MESSENGER = 7.3;
const WIRE = '#3c3836', CWIRE = '#6a5143';

export function buildCatenary(ctx, G, bk, canopy) {
  const out = { masts: 0, wires: 0, gantries: 0, tris: 0 };
  const mastGrid = new Map();
  const mastNear = (x, z, r) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = mastGrid.get((Math.floor(x / 8) + i) + ',' + (Math.floor(z / 8) + j)); if (a) for (const m of a) if (Math.hypot(m.x - x, m.z - z) < r) return true; } return false; };
  const addMast = (x, z) => { const k = Math.floor(x / 8) + ',' + Math.floor(z / 8); (mastGrid.get(k) || mastGrid.set(k, []).get(k)).push({ x, z }); };
  const Bv = (x, z) => bk.get('vc', x, z);
  const GREY = col('#a7adb3'), CONC = col('#b9b7b0'), INS = col('#7a5a48');

  for (const p of G.paths) {
    if (!p.electrified) continue;
    // --- support list: canopy supports (platform tracks) + masts elsewhere
    const sup = [];
    const can = p.no ? canopy.supports[p.no] : null;
    let cMin = 1e9, cMax = -1e9;
    if (can && can.length) {
      for (const c of can) { const s = p.project(c.x, c.z); sup.push({ s, hw: true, c }); cMin = Math.min(cMin, s); cMax = Math.max(cMax, s); }
    }
    // virtual supports under the station hall (north of the canopy) and masts south of it
    const sFirst = can && can.length ? cMin : p.len * 0.5;
    if (can && can.length) for (let s = Math.max(6, cMin - 12); s > 4; s -= 12) sup.push({ s, virtual: true });
    const mastFrom = can && can.length ? cMax + 22 : 14;
    for (let s = mastFrom; s < p.len - 4; s += 50) sup.push({ s, mast: true });
    sup.push({ s: Math.min(p.len - 0.5, Math.max(...sup.map((q) => q.s), 0) + 1), virtual: true, end: true });
    sup.sort((a, b) => a.s - b.s);
    void sFirst;
    // --- hardware
    for (const q of sup) {
      const t = p.at(q.s); q.t = t;
      if (q.mast) {
        // choose the side with more free room (distance to the nearest other path)
        let bestSide = null, bestFree = -1;
        for (const sd of [-1, 1]) {
          const px = t.x + t.tz * 2.7 * sd, pz = t.z - t.tx * 2.7 * sd;
          const net = ctx.services.streets?.net;
          // Test the final mast + footing against real asphalt, including
          // merged carriageways and junction fillets in the enlarged rail map.
          if (net ? net.cover(px,pz,{}) >= -.85 : ctx.L.isOnRoad(px,pz,.85)) continue;
          let free = 1e9; for (const o of G.paths) { if (o === p) continue; const d = o.nearest(px, pz).d; if (d < free) free = d; }
          if (free > bestFree) { bestFree = free; bestSide = sd; }
        }
        if (bestSide == null) { q.mast=false; q.virtual=true; continue; }
        const sd = bestSide, mx = t.x + t.tz * 2.7 * sd, mz = t.z - t.tx * 2.7 * sd;
        q.side = sd; q.mx = mx; q.mz = mz;
        if (!mastNear(mx, mz, 3.0)) {
          addMast(mx, mz);
          const B = Bv(mx, mz), base=t.dy, top = base + RAIL_TOP + MESSENGER + 1.0;
          B.box(mx, base+0.25, mz, 0.28, 0.25, 0.28, 0, CONC);
          B.prism(mx, base+0.5, mz, 0.2, 0.13, top, 8, GREY, true);
          // cantilever: upper tube to the messenger, lower brace to the contact wire arm
          const ax = t.x, az = t.z;
          B.bar([mx, top - 0.35, mz], [ax, base + RAIL_TOP + MESSENGER + 0.05, az], 0.1, 0.1, GREY);
          B.bar([mx, top - 1.5, mz], [ax, base + RAIL_TOP + MESSENGER - 0.05, az], 0.07, 0.07, GREY);
          B.box(mx + (ax - mx) * 0.5, base + RAIL_TOP + MESSENGER + 0.2, mz + (az - mz) * 0.5, 0.05, 0.05, 0.05, 0, INS);
          ctx.physics.addCylinder(mx, mz, 0.3, base, top);
          out.masts++;
        }
      } else if (q.hw) {
        // bracket from the girder to the track axis (horizontal) + insulator
        const c = q.c, B = Bv(c.gx, c.gz);
        const y = RAIL_TOP + MESSENGER + 0.12;
        B.bar([c.gx, y, c.gz], [c.x, y, c.z], 0.09, 0.09, GREY);
        B.box(c.gx + (c.x - c.gx) * 0.55, y - 0.14, c.gz + (c.z - c.gz) * 0.55, 0.045, 0.14, 0.045, 0, INS);
        // registration arm for the contact wire
        B.bar([c.gx, y - 0.9, c.gz], [c.x + c.sgn * -0.0, RAIL_TOP + CONTACT + 0.05, c.z], 0.05, 0.05, GREY);
      }
    }
    // --- wires: subdivide spans, follow the path, zig-zag the contact wire
    for (let i = 0; i + 1 < sup.length; i++) {
      const A = sup[i], Bq = sup[i + 1], span = Bq.s - A.s; if (span < 1) continue;
      const nseg = Math.max(1, Math.round(span / 12));
      const zA = (i % 2 ? 0.28 : -0.28), zB = (i % 2 ? -0.28 : 0.28);
      const sag = Math.min(1.1, span * span / 2400);
      const mp = [], cp = [];
      for (let k = 0; k <= nseg; k++) {
        const u = k / nseg, t = p.at(A.s + span * u), zz = zA + (zB - zA) * u;
        const lat = zz;
        cp.push([t.x + t.tz * lat, t.dy + RAIL_TOP + CONTACT, t.z - t.tx * lat]);
        mp.push([t.x, t.dy + RAIL_TOP + MESSENGER - sag * 4 * u * (1 - u), t.z]);
        if (k > 0 && k < nseg || span > 14) { /* droppers handled below */ }
      }
      ctx.wires.add(mp, { width: 0.025, color: WIRE });
      ctx.wires.add(cp, { width: 0.022, color: CWIRE });
      out.wires += 2;
      const nd = Math.max(0, Math.round(span / 9) - 1);
      for (let d = 1; d <= nd; d++) {
        const u = d / (nd + 1), t = p.at(A.s + span * u), zz = zA + (zB - zA) * u;
        ctx.wires.add([[t.x, t.dy + RAIL_TOP + MESSENGER - sag * 4 * u * (1 - u), t.z], [t.x + t.tz * zz, t.dy + RAIL_TOP + CONTACT, t.z - t.tx * zz]], { width: 0.014, color: WIRE });
      }
    }
  }
  return out;
}
