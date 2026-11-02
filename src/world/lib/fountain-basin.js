// Shallow ornamental basins are real water over a walkable floor. Their low
// stone perimeters can break; only the authored central support remains solid.
// Drawing stays with each landmark so this helper never duplicates its masonry.
import { knockBays } from './fence-bays.js';

export function fountainBasin(ctx, { id, x, z, r, waterY, bedY = 0, rimR = r + .2,
  rimTop = waterY + .15, rimBottom = bedY, segments = 20, pedestal = null }) {
  const ph = ctx.physics, ring = Array.from({ length: segments }, (_, i) => {
    const a = i * Math.PI * 2 / segments; return [x + Math.sin(a) * r, z + Math.cos(a) * r];
  });
  ph.addWater({ ring: ring.flat(), level: waterY });
  for (let i = 0; i < segments; i++) ph.addWalkTriangle([[x, bedY, z],
    [ring[i][0], bedY, ring[i][1]], [ring[(i + 1) % segments][0], bedY, ring[(i + 1) % segments][1]]], .12);
  if (pedestal) ph.addCylinder(x, z, pedestal.r, pedestal.y0 ?? bedY, pedestal.y1);
  const bays = ring.map((a, i) => {
    const b = ring[(i + 1) % segments], s = rimR / r;
    return { x0: x + (a[0] - x) * s, z0: z + (a[1] - z) * s,
      x1: x + (b[0] - x) * s, z1: z + (b[1] - z) * s, y: rimBottom, ghost: true };
  });
  const rim = knockBays(ctx, { name: id + '-rim', bays, parts: [], far: 300,
    collider: { y0: rimBottom, y1: rimTop, thick: Math.max(.12, (rimR - r) * 2), e0: .02, e1: .02 },
    rec: { kind: 'fence', mass: 700, h: rimTop - rimBottom, anchored: 12, hitK: .3, metal: false, minDv: 0 } });
  const basin = { id, x, z, r, ring, waterY, bedY, rim, pedestal };
  (ctx.services.fountainBasins ||= []).push(basin);
  return basin;
}
