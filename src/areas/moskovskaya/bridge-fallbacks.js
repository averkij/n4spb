// The legacy quay creates rectangular fallback floors unless the page includes
// the historical `bridges` module. This district uses the maintained planar
// coastal bridge owner instead. Remove only those exact obsolete fallback
// boxes; its actual curved/triangular deck slabs are built later in the page.
// Matching the complete constructor signature preserves every real structure.
import { COASTAL_BRIDGE_ZONES } from './bridge-sites.js';

const near = (a, b) => Math.abs(a - b) < .001;
export function removeBridgeFallbacks(ctx) {
  const ph = ctx.physics;
  if (!ph?.remove || !Array.isArray(ph.items)) return [];
  const byCentre = new Map();
  const key = (x, z) => x.toFixed(3) + ',' + z.toFixed(3);
  for (const zone of COASTAL_BRIDGE_ZONES) {
    if (!zone.own) continue;
    const axis = zone.axis * Math.PI / 180;
    const rot = Math.atan2(Math.cos(axis), Math.sin(axis));
    const spec = { id: zone.id, x: zone.c[0], z: zone.c[1], hw: (zone.len + 28) / 2, hd: zone.w / 2, c: Math.cos(rot), s: Math.sin(rot) };
    const k = key(spec.x, spec.z);
    if (!byCentre.has(k)) byCentre.set(k, []);
    byCentre.get(k).push(spec);
  }
  const removed = [];
  for (const item of ph.items.slice()) {
    if (item.type !== 'walk' || !near(item.y0, -1.2) || !near(item.top, 0)) continue;
    const spec = (byCentre.get(key(item.cx, item.cz)) || []).find(s => near(item.cx, s.x) && near(item.cz, s.z) && near(item.hw, s.hw) && near(item.hd, s.hd) && near(item.c, s.c) && near(item.s, s.s));
    if (spec && ph.remove(item)) removed.push(spec.id);
  }
  return removed;
}
