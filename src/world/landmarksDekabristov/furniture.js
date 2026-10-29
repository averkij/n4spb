// landmarksDekabristov/furniture.js - benches, litter bins and lamps of the sites, all KNOCK RECORDS (lib/knock-furniture.js, docs/AREAS.md 13 / 15.v: objects stay movable and breakable): the drawing is the one of
// landmarksSmolensky/furniture.js (slatted bench with cast-iron ends, black steel bin drum, cast-iron lantern post; this repository), the placements are the OSM FURNITURE nodes that the site claims (props/osm.js skips a
// claimed bench / waste_basket node: the claimed ones are drawn here, once) and the lamps the part asks for.  A spot on asphalt (net.cover), inside a building or in water is skipped.
import * as L from '../layout.js';
import { partsGeos } from './inst.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';
import * as G from './geo.js';

const benchParts = (M) => (P) => {
  for (const s of [-1, 1]) { P.box(M.benchIron, s * 0.8 - 0.04, s * 0.8 + 0.04, 0, 0.45, -0.22, 0.22, 'b'); P.box(M.benchIron, s * 0.8 - 0.04, s * 0.8 + 0.04, 0.45, 0.85, -0.22, -0.16, 'b'); }
  for (let k = 0; k < 3; k++) P.box(M.benchSlat, -0.9, 0.9, 0.45, 0.5, -0.2 + k * 0.14, -0.1 + k * 0.14, 'b');
  for (let k = 0; k < 3; k++) P.box(M.benchSlat, -0.9, 0.9, 0.58 + k * 0.1, 0.65 + k * 0.1, -0.22, -0.17, 'b');
};
const binParts = (M) => (P) => { P.col(M.bin, 0, 0, 0, 0.8, 0.28, 0.3, 8, false); G.frustum(P, M.bin, 0, 0, 0.8, 0.95, 8, 0.32, 0.05, 0, 1, 1, { capTop: M.bin }); };
const lampParts = (M) => (P) => {
  P.box(M.lamp, -0.14, 0.14, 0, 0.5, -0.14, 0.14, 'b'); P.col(M.lamp, 0, 0, 0.5, 3.0, 0.07, 0.05, 8, false); P.col(M.lamp, 0, 0, 3.0, 3.1, 0.12, 0.12, 8, true);
  P.box(M.lampGlass, -0.2, 0.2, 3.1, 3.7, -0.2, 0.2, 'b'); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.box(M.lamp, a * 0.2 - 0.02, a * 0.2 + 0.02, 3.1, 3.7, b * 0.2 - 0.02, b * 0.2 + 0.02, 'tb');
  G.frustum(P, M.lamp, 0, 0, 3.7, 4.05, 4, 0.34, 0.0, Math.PI / 4, 1, 1, {}); P.col(M.lamp, 0, 0, 4.05, 4.2, 0.03, 0.01, 4, false);
};

/** the rotation (rotY of the bench frame: +z = the front) that makes a bench at (x, z) look at the nearest alley segment, 0 without alleys */
export function faceAlley(pl, x, z) {
  let best = null;
  for (const s of pl ? pl.grid.segs : []) { const a = s[0], b = s[1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)), qx = a[0] + dx * t, qz = a[1] + dz * t, d = Math.hypot(x - qx, z - qz); if (!best || d < best.d) best = { d, qx, qz }; }
  return best && best.d > 0.3 ? Math.atan2(best.qx - x, best.qz - z) + Math.PI : 0;
}

/**
 * furnish(K, name, { benches: [{ x, z, rot }], bins: [{ x, z }], lamps: [{ x, z, h? }] }, pl?) - registers the spots as knock records, returns { benches, bins, lamps } counts.
 * K.svc.benches / lamps get the service rows (the people module sits on the benches).
 */
export function furnish(K, name, { benches = [], bins = [], lamps = [] }, pl = null) {
  const ctx = K.ctx, M = K.M, ph = ctx.physics, net = ctx.services?.streets?.net, cover = net && net.cover ? (x, z) => net.cover(x, z, {}) : () => -5;
  const wet = (x, z) => !!ph.waterLevel && ph.waterLevel(x, z) !== null;
  const ok = (x, z) => cover(x, z) < -0.5 && !L.insideBuilding(x, z, 0.4) && !wet(x, z);
  const out = { benches: 0, bins: 0, lamps: 0 };
  const put = (nm, geo, list, rec, far) => { K.extraTris += knockFurniture(ctx, `lmdek-${name}-${nm}`, geo, list.map((q) => q.spot), list.map((q) => q.item), rec, far); };
  const B = [], N = [], Lm = [];
  for (const b of benches) {
    if (!ok(b.x, b.z)) continue; const rot = b.rot ?? faceAlley(pl, b.x, b.z);
    B.push({ spot: { x: b.x, y: 0, z: b.z, rotY: rot }, item: ph.addBox(b.x, b.z, 1.9, 0.6, rot, 0, 0.9) }); K.svc.benches.push({ x: b.x, z: b.z, rotY: rot, len: 1.8 });
  }
  for (const b of bins) { if (!ok(b.x, b.z)) continue; N.push({ spot: { x: b.x, y: 0, z: b.z, rotY: 0 }, item: ph.addCylinder(b.x, b.z, 0.32, 0, 1) }); }
  for (const l of lamps) { if (!ok(l.x, l.z)) continue; const h = l.h || 4.2; Lm.push({ spot: { x: l.x, y: 0, z: l.z, rotY: 0 }, item: ph.addCylinder(l.x, l.z, 0.2, 0, h) }); K.svc.lamps.push({ x: l.x, z: l.z, h, kind: 'lantern' }); }
  if (B.length) put('benches', partsGeos(benchParts(M)), B, { ...FURNITURE_REC.bench, w: 1.8 }, 200);
  if (N.length) put('bins', partsGeos(binParts(M)), N, FURNITURE_REC.bin, 170);
  if (Lm.length) put('lamps', partsGeos(lampParts(M)), Lm, FURNITURE_REC.lamp(4.2), 260);
  out.benches = B.length; out.bins = N.length; out.lamps = Lm.length;
  return out;
}
