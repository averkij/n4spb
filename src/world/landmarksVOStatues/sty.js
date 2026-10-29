// landmarksVOStatues/sty.js - helpers for the hand-made figures and small forms of the sculpture park (stylised, elongated bronze people, animals, scrap pieces): cached Sculpt figures, head frames,
// limb tubes, pedestals for busts, non-uniform figure placement, wall mounting.  Everything works in the piece frame (origin on the ground, +z = front).
import { Sculpt, V, face, cached, bust, hand } from '../lib/figures.js';
import { loft, ball } from './solids.js';

/** head frame (unit axes) for a head centred at c, rotated by pitch (+ = looks down), yaw (+ = turns to the figure's left), roll */
export function HF(c, pitch = 0, yaw = 0, roll = 0) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw), cr = Math.cos(roll), sr = Math.sin(roll);
  // R = Ry(yaw) * Rx(pitch) * Rz(roll) applied to the basis
  const rot = (v) => { let [x, y, z] = v; [x, y] = [x * cr - y * sr, x * sr + y * cr]; [y, z] = [y * cp - z * sp, y * sp + z * cp]; [x, z] = [x * cy + z * sy, -x * sy + z * cy]; return [x, y, z]; };
  return { c, x: rot([1, 0, 0]), y: rot([0, 1, 0]), z: rot([0, 0, 1]) };
}

/** a cached Figure built by fn(S, helpers) on a fresh Sculpt (detail d) */
export function sculpt(key, fn, d = 0.6) { return cached('vos-' + key + '-' + d, () => { const S = new Sculpt({ detail: d }); fn(S); return S.finish({}); }); }

/** a tapering limb through the points (radii per point, a single number = constant) */
export function limb(S, pts, rad, o = {}) { S.tube(o.key || 'main', pts, Array.isArray(rad) ? rad.map((r) => (Array.isArray(r) ? r : [r, r])) : pts.map(() => [rad, rad]), { seg: o.seg ?? 8, per: o.per ?? 3, ref: o.ref, cap: o.cap }); }

/** a hooded figure: a robe cone (height h, base radius r), shoulders, a hood with a face shadow; lean = forward bend (rad), arms optional (hand targets in the frame) */
export function hooded(S, x, z, rot, h = 0.9, r = 0.22, lean = 0.1, arms = null) {
  S.push(x, 0, z, 0, rot, 0);
  S.tube('main', [[0, 0, 0], [0, h * 0.45, h * 0.04 * lean * 10], [0, h * 0.8, h * 0.1 * lean * 10]], [[r, r * 0.9], [r * 0.62, r * 0.55], [r * 0.4, r * 0.38]], { seg: 10, per: 4 });
  S.blob('main', [0, h * 0.86, h * 0.1 * lean * 10 + 0.01], [r * 0.5, r * 0.48, r * 0.46], { w: 9, h: 7 });
  S.blob('dark', [0, h * 0.84, h * 0.1 * lean * 10 + r * 0.32], [r * 0.3, r * 0.3, r * 0.14], { w: 7, h: 5 });
  if (arms) for (const a of arms) S.tube('main', [[a[0], h * 0.7, h * 0.08], [a[0] * 1.5, h * 0.62, a[2] * 0.6], [a[0] * 1.4, a[1], a[2]]], [[r * 0.2, r * 0.2], [r * 0.17, r * 0.17], [r * 0.13, r * 0.13]], { seg: 6, per: 3 });
  S.pop();
}

/** place a Figure with non-uniform scale (sx, sy, sz): a thin tall Blok, a broad ... (P.geo per key; tints optional) */
export function placeXYZ(P, fig, mats, x, y, z, rotY, sx, sy, sz, tints = null) {
  for (const [key, g] of Object.entries(fig.geos)) { if (tints) P.tint(tints[key] || tints.main); P.geo(mats[key] || mats.main, g, x, y, z, 0, rotY, 0, sx, sy, sz); }
}

/** plinth + bust: a bronze bust (kit `bust`) on a pedestal.  o: ped { w, d, h, color, cap }, bust { style, face, turn }, scale, y0 */
export function bustOn(P, M, o) {
  const { w = 0.5, d = 0.4, h = 1.2, color = '#8e8e88', cap = '#7c7c77', base = true } = o.ped || {};
  P.tint(cap); if (base) P.box(M.vc, -w / 2 - 0.08, w / 2 + 0.08, 0, 0.1, -d / 2 - 0.08, d / 2 + 0.08, 'b');
  P.tint(color); P.box(M.vc, -w / 2, w / 2, base ? 0.1 : 0, h, -d / 2, d / 2, 'b');
  P.tint(cap); P.box(M.vc, -w / 2 - 0.04, w / 2 + 0.04, h, h + 0.06, -d / 2 - 0.04, d / 2 + 0.04, 'b');
  const fig = cached('vos-bust-' + o.key, () => bust({ detail: o.detail ?? 0.45, style: o.style || 'civil', turn: o.turn ?? 0.15, face: o.face }));
  fig.place(P, o.mats || M.bronzeMono, 0, h + 0.06, o.bz ?? 0, 0, o.scale ?? 1.0);
  return h + 0.06 + 0.62 * (o.scale ?? 1.0);
}

/** the court-side wall mount of a node that lies inside the wall of building `id`: { x, z, yaw } on the nearest edge of the courtyard ring (hole), facing INTO the court */
export function wallMount(L, id, x, z, off = 0.04) {
  const b = L.buildingById(id); if (!b || !b.polys) return null;
  let best = null;
  for (const poly of b.polys) for (const h of poly.h || []) {
    for (let i = 0; i < h.length; i += 2) {
      const j = (i + 2) % h.length, ax = h[i], az = h[i + 1], bx = h[j], bz = h[j + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz);
      if (!best || d < best.d) best = { d, px, pz, dx, dz, hole: h };
    }
  }
  if (!best) return null;
  const l = Math.hypot(best.dx, best.dz) || 1; let nx = best.dz / l, nz = -best.dx / l;
  // inward normal: toward the centroid of the hole ring
  let cx = 0, cz = 0, n = best.hole.length / 2; for (let i = 0; i < best.hole.length; i += 2) { cx += best.hole[i]; cz += best.hole[i + 1]; } cx /= n; cz /= n;
  if ((cx - best.px) * nx + (cz - best.pz) * nz < 0) { nx = -nx; nz = -nz; }
  return { x: best.px + nx * off, z: best.pz + nz * off, yaw: Math.atan2(nx, nz), d: best.d };
}

export { V, face, hand, loft, ball };
