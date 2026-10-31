// landmarksYelaginPark/physgate.js - open a gate in the pond-edge colliders for a pier.
// environment/water.js lays a 0.4 m thick collider (y -2 .. 1.25) along the whole outline of every park pond ("nobody walks on the water"); a boat pier that starts on the bank must cross that
// line, so the collider is split around the pier entrance (physics.remove + two shorter boxes with the same y range).  Only boxes of exactly that signature (y0 -2, y1 1.25, thickness 0.4) within
// reach of the gate are touched; the pier's own edge colliders (rails) keep the water side closed.  No-op when no such collider exists (isolated module checks).
export function openGate(ctx, gx, gz, width = 3.2) {
  const ph = ctx.physics, items = ph.items || [], hit = [];
  for (const it of items) if (it.type === 'box' && it.y0 === -2 && it.y1 === 1.25 && Math.abs(it.hd - 0.2) < 1e-6 && Math.hypot(it.cx - gx, it.cz - gz) < it.hw + width) hit.push(it);
  let opened = 0;
  for (const it of hit) {
    if (it.source?.knock) continue; // A live breakable bay keeps its record and visual parts together.
    const ax = it.c, az = -it.s;                                           // the local x axis of the box in the world (x, z)
    const t = (gx - it.cx) * ax + (gz - it.cz) * az, off = (gx - it.cx) * -az + (gz - it.cz) * ax;
    if (Math.abs(off) > 1.2 + width / 2 || Math.abs(t) > it.hw + width / 2) continue;
    ph.remove(it);
    const keep = (t0, t1) => { const len = t1 - t0; if (len < 0.25) return; const m = (t0 + t1) / 2; ph.addBox(it.cx + ax * m, it.cz + az * m, len, it.hd * 2, it.rotY, -2, 1.25); };
    keep(-it.hw, t - width / 2); keep(t + width / 2, it.hw);
    opened++;
  }
  return opened;
}
