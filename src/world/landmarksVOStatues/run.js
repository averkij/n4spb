// landmarksVOStatues/run.js - the piece runner: a PIECE is one monument { id, key, name, x, z, yaw?, h, share?, solid?, build(P, M, K) }; `placePiece(K, pc)` builds its geometry once in a local frame (origin on the ground,
// +z = front, figures face +z), puts it at (x, z) turned by yaw (default: toward the nearest way, so that a visitor on the path sees the front), adds its solid colliders (plinths and basins block, nobody walks onto a
// pedestal) and publishes it in the monuments list.  Pieces that repeat (Lenin twice) pass `share: key`: the geometry is built once.
// Piece frame for colliders: { w, d, h, ox, oz, rot } boxes and { r, h, ox, oz } cylinders, local metres, rot about y.
import { geosOf, put } from './objs.js';
import { wallMount } from './sty.js';

const SHARED = new WeakMap();

/** yaw (rotY, 0 faces south) toward the nearest way (footway / road) within `reach` metres, or toward the south when none */
export function yawToWay(L, x, z, reach = 40) {
  let best = null;
  try { const list = L.roadsNear(x, z, reach, {}); if (list.length) best = list[0]; } catch (e) { best = null; }
  if (!best) return 0;
  const dx = best.x - x, dz = best.z - z; if (Math.hypot(dx, dz) < 0.2) return 0;
  return Math.atan2(dx, dz);
}

/** yaw turned AWAY from the water (a monument on an embankment looks at the people on the land): the mean direction to the river within 40 m, reversed */
export function yawAwayWater(L, x, z) {
  let vx = 0, vz = 0;
  for (let r = 6; r <= 40; r += 6) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a); if (L.inRiver(x + dx * r, z + dz * r)) { vx += dx / r; vz += dz / r; } }
  return Math.hypot(vx, vz) < 1e-6 ? 0 : Math.atan2(-vx, -vz);
}

export function placePiece(K, pc0) {
  const { ctx, M, root, svc } = K, L = ctx.L;
  let pc = pc0;
  if (pc0.mount) { const m = wallMount(L, pc0.mount, pc0.x, pc0.z, pc0.mountOff ?? 0.04); if (m) pc = { ...pc0, x: m.x, z: m.z, yaw: m.yaw, mountD: m.d }; }
  if (pc.clear) {                                   // keep the footprint clear of a way: push the piece away from the nearest way until its edge is `r` metres from it
    let x = pc.x, z = pc.z;
    for (let it = 0; it < 5; it++) {
      const h = L.roadsNear(x, z, pc.clear.r, { drivable: !!pc.clear.drivable })[0]; if (!h) break;
      let dx = x - h.x, dz = z - h.z, d = Math.hypot(dx, dz); if (d < 1e-3) { dx = -h.tz; dz = h.tx; d = 1; }
      const want = h.w / 2 + pc.clear.r; x = h.x + dx / d * want; z = h.z + dz / d * want;
    }
    pc = { ...pc, x, z, moved: Math.hypot(x - pc0.x, z - pc0.z) };
  }
  const yaw = pc.yaw === undefined || pc.yaw === 'auto' ? yawToWay(L, pc.x, pc.z, pc.reach || 40) : pc.yaw === 'awayWater' ? yawAwayWater(L, pc.x, pc.z) : pc.yaw;
  const Kp = { ...K, x: pc.x, z: pc.z, yaw, piece: pc };
  let set;
  if (pc.share) { const cache = SHARED.get(root) || SHARED.set(root, new Map()).get(root); set = cache.get(pc.share); if (!set) cache.set(pc.share, set = geosOf((P) => pc.build(P, M, Kp))); }
  else set = geosOf((P) => pc.build(P, M, Kp));
  const tris = put(root, set, pc.x, pc.y || 0, pc.z, yaw, pc.scale || 1, 'vos-' + pc.key);
  svc.triangles += tris; svc.parts[pc.key] = { tris, id: pc.id, yaw, x: pc.x, z: pc.z, open: !!pc.open, moved: pc.moved || 0 };
  const ph = ctx.physics;
  if (ph && pc.solid) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    for (const s of pc.solid) {
      const ox = s.ox || 0, oz = s.oz || 0, wx = pc.x + ox * cs + oz * sn, wz = pc.z - ox * sn + oz * cs;
      if (s.r !== undefined) ph.addCylinder(wx, wz, s.r, s.y0 ?? 0, s.h);
      else ph.addBox(wx, wz, s.w, s.d, yaw + (s.rot || 0), s.y0 ?? 0, s.h);
    }
  }
  svc.monuments.push({ id: pc.id, name: pc.name, x: pc.x, z: pc.z, h: pc.h || 3 });
  if (pc.spot) svc.photoSpots.push({ x: pc.x + Math.sin(yaw) * pc.spot, z: pc.z + Math.cos(yaw) * pc.spot, yaw: (((yaw * 180 / Math.PI) % 360) + 540) % 360 - 180, name: pc.name });
  svc.drawn.push(pc.id);
  return tris;
}
