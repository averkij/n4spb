// landmarksPetrovskyStadium/arena.js - the SMALL SPORTS ARENA ("Малая спортивная арена «Петровский»", 2 835 seats, 1994) on its own islet west of the main stadium: the red track r4609069, the turf and the
// pitch w328040082, the long covered stand r4609068 (blue folded-plate roof on steel posts, 9 rows of blue seats, white back wall: photo s09, [?] which of the two OSM strips carries the roof: the one
// tagged building=stadium), the three low bare seat blocks on the opposite strip r4609067, the 2 m blue steel fence round the track with the stands as its gaps, and the three floodlight poles
// n7617998956 / 58 / 59.  Dossier MODULE PLAN 1 (e), photo s09 (the covered stand and the blue seats), s01.  Closed territory: the fence and the stands are solid.
import * as L from '../layout.js';
import { PITCHES } from '../data/city.js';
import { ARENA_MASTS, Y, ringOf, offsetRing } from './frame.js';
import { fillFine, ovalFrame, lanes } from './field.js';
import { obb } from './apronprops.js';
import { pole } from './masts.js';

const ringOfP = (id) => { const p = PITCHES.find((q) => q.id === id); return p ? ringOf(p.polys[0].o) : null; };
const ringOfB = (id) => { const b = L.buildingById(id); return b ? ringOf(b.polys[0].o) : null; };
const centre = (r) => r.reduce((s, p) => [s[0] + p[0] / r.length, s[1] + p[1] / r.length], [0, 0]);

/** local frame of a strip: x along its long axis, z AWAY from the pitch centre (the stand faces -z) */
function stripFrame(ring, pc) {
  const O = obb(ring); let ox = O.vx, oz = O.vz; if (ox * (O.cx - pc[0]) + oz * (O.cz - pc[1]) < 0) { ox = -ox; oz = -oz; }
  return { cx: O.cx, cz: O.cz, ux: O.ux, uz: O.uz, rot: Math.atan2(ox, oz), hu: O.hu, hv: O.hv, ox, oz };
}

/** a raked block of seat rows over x0..x1 (local), from the front edge zF up to the back zB, n rows rising dy each from y0 */
function rake(P, M, x0, x1, zF, zB, y0, n, dy, tone) {
  const dz = (zB - zF) / n, seg = Math.max(1, Math.round((x1 - x0) / 6.6));
  for (let s = 0; s < seg; s++) {
    const xa = x0 + (x1 - x0) * s / seg, xb = x0 + (x1 - x0) * (s + 1) / seg, u0 = (tone + s) % 2 ? 0 : 0.5, v = n * 0.8 / 3.2;
    P.quad(M.seats, [xa, y0, zF], [xb, y0, zF], [xb, y0 + n * dy, zB], [xa, y0 + n * dy, zB], [0, 1, -0.4], [[u0, 0], [u0 + 0.498, 0], [u0 + 0.498, v], [u0, v]]);
  }
  void dz;
  P.quad(M.concrete, [x0, 0, zF], [x1, 0, zF], [x1, y0, zF], [x0, y0, zF], [0, 0, -1]);                               // the low front wall under the first row
  // the side cheeks
  for (const x of [x0, x1]) P.quad(M.concrete, [x, 0, zF], [x, 0, zB], [x, y0 + n * dy, zB], [x, y0, zF], [x === x0 ? -1 : 1, 0, 0]);
  P.quad(M.concrete, [x0, 0, zB], [x1, 0, zB], [x1, y0 + n * dy, zB], [x0, y0 + n * dy, zB], [0, 0, 1]);
}

export function arena(P, M, ph, svc, clip = null) {
  const track = ringOfP('r4609069'), pitch = ringOfP('w328040082'), strip1 = ringOfB('r4609068'), strip2 = ringOfB('r4609067'); if (!track || !pitch) return;
  const pc = centre(pitch), O = obb(pitch);
  // ---- surfaces: the red track over its whole ring with its lanes and the mown infield, the pitch with its markings on it
  fillFine(P, M.track, track, Y.track, { tile: 8, maxEdge: 20 });
  let bu = 0, bl = 0; for (let i = 0; i < 4; i++) { const a = pitch[i], b = pitch[(i + 1) % 4], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > bl) { bl = l; bu = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
  lanes(P, M, ovalFrame(track, pc, Math.cos(bu), Math.sin(bu)));
  const p = (u, v) => [O.cx + O.ux * u + O.vx * v, Y.pitch, O.cz + O.uz * u + O.vz * v];
  P.quad(M.pitch, p(-O.hu, -O.hv), p(O.hu, -O.hv), p(O.hu, O.hv), p(-O.hu, O.hv), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  // ---- the covered stand (r4609068); local frame: +x along the strip, +z away from the pitch (the stand faces -z)
  const zones = [];
  if (strip1) {
    const F = stripFrame(strip1, pc), hv = F.hv, hu = F.hu, rot = F.rot;
    P.push(F.cx, 0, F.cz, rot);
    rake(P, M, -hu + 0.6, hu - 0.6, -hv + 0.3, hv - 0.5, 0.6, 9, 0.42, 0);
    P.box(M.white, -hu + 0.2, hu - 0.2, 0, 7.4, hv - 0.5, hv - 0.2, 'b');                                                   // the white back wall
    // the roof: a blue folded plate, front edge 5.9, back 7.4, a 0.85 m fascia, steel posts every 6.6 m
    const f = (x, z, y) => [x, y, z];
    for (let x = -hu + 0.2, i = 0; x < hu - 0.5; x += 3.3, i++) {
      const xb = Math.min(hu - 0.2, x + 3.3), up = i % 2 ? 0.35 : 0;
      P.quad(M.blue, f(x, -hv + 0.1, 5.9 + up), f(xb, -hv + 0.1, 5.9 + up), f(xb, hv - 0.2, 7.4), f(x, hv - 0.2, 7.4), [0, 1, -0.2]);
      P.quad(M.concrete, f(x, -hv + 0.1, 5.4 + up), f(xb, -hv + 0.1, 5.4 + up), f(xb, hv - 0.2, 7.0), f(x, hv - 0.2, 7.0), [0, -1, 0.2]);
    }
    P.quad(M.blue, f(-hu + 0.2, -hv + 0.1, 5.4), f(hu - 0.2, -hv + 0.1, 5.4), f(hu - 0.2, -hv + 0.1, 6.25), f(-hu + 0.2, -hv + 0.1, 6.25), [0, 0, -1]);
    for (let x = -hu + 1.0; x <= hu - 0.9; x += 6.6) P.box(M.steelGrey, x - 0.12, x + 0.12, 0, 5.6, -hv + 0.25, -hv + 0.5, 'b');
    P.pop();
    zones.push({ cx: F.cx, cz: F.cz, rot, hu, hv });
    ph.addBox(F.cx, F.cz, hu * 2, hv * 2, rot, 0, 7.5);
  }
  // ---- the bare seat blocks (r4609067): three blocks of 22 m, five rows
  if (strip2) {
    const F = stripFrame(strip2, pc), hv = F.hv, hu = F.hu, rot = F.rot, cs = Math.cos(rot), sn = Math.sin(rot);
    P.push(F.cx, 0, F.cz, rot);
    const W = (x, z) => [F.cx + cs * x + sn * z, F.cz - sn * x + cs * z];
    for (const xc of [-hu * 0.62, 0, hu * 0.62]) for (let xa = xc - 11; xa < xc + 11 - 0.01; xa += 2) {
      const xb = Math.min(xc + 11, xa + 2), zF = -hv + 0.2;
      let zB = hv - 0.2;
      // The parallel service lane clips the rear of this narrow mapped stand.
      // Keep the front rows instead of dropping an entire 22 m block when one
      // rear corner touches asphalt. Every drawn panel and its box share the cut.
      const clear = z => !clip || [xa, (xa + xb) / 2, xb].every(x => [zF, (zF + z) / 2, z].every(v => { const p = W(x, v); return !clip.on(p[0], p[1]); }));
      while (zB - zF >= 1.4 && !clear(zB)) zB -= 0.1;
      if (zB - zF < 1.4) continue;
      const rows = Math.min(5, Math.floor((zB - zF) / 0.36));
      rake(P, M, xa, xb, zF, zB, 0.3, rows, 0.38, 1);
      const c = W((xa + xb) / 2, (zF + zB) / 2);
      ph.addBox(c[0], c[1], xb - xa, zB - zF, rot, 0, 0.3 + rows * 0.38);
    }
    P.pop();
    zones.push({ cx: F.cx, cz: F.cz, rot, hu, hv });
  }
  // ---- the blue steel fence round the track (gaps where the stands are)
  const near = (x, z) => zones.some((q) => { const dx = x - q.cx, dz = z - q.cz, u = dx * Math.cos(q.rot) - dz * Math.sin(q.rot), o = dx * Math.sin(q.rot) + dz * Math.cos(q.rot); return Math.abs(o) < q.hv + 2.5 && Math.abs(u) < q.hu + 3; });
  const fr = offsetRing(track, 0.6);
  for (let i = 0; i < fr.length; i++) {
    const a = fr[i], b = fr[(i + 1) % fr.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(l / 4));
    for (let j = 0; j < k; j++) {
      const x0 = a[0] + (b[0] - a[0]) * j / k, z0 = a[1] + (b[1] - a[1]) * j / k, x1 = a[0] + (b[0] - a[0]) * (j + 1) / k, z1 = a[1] + (b[1] - a[1]) * (j + 1) / k;
      if (near((x0 + x1) / 2, (z0 + z1) / 2)) continue;
      const sl = l / k;
      P.quad(M.fence, [x0, 0, z0], [x1, 0, z1], [x1, 2.0, z1], [x0, 2.0, z0], [0, 0, 1], [[0, 0], [sl / 2.4, 0], [sl / 2.4, 1], [0, 1]]);
      ph.addBox((x0 + x1) / 2, (z0 + z1) / 2, sl + 0.1, 0.3, Math.atan2(-(z1 - z0), x1 - x0), 0, 2.0);
    }
  }
  // ---- the three floodlight poles (n7617998956 / 58 / 59), leaning their panels toward the pitch
  // (a pole that stands in a service road (n7617998959 is mapped on the gate road w44425123) slides to the nearest spot clear of asphalt: nothing stands on a carriageway)
  const clear = (x, z) => !clip || [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7]].every(([a, b]) => !clip.on(x + a, z + b));
  for (const [x0, z0] of ARENA_MASTS) {
    let x = x0, z = z0;
    if (!clear(x, z)) outer: for (let r = 0.5; r <= 5; r += 0.5) for (let a = 0; a < 360; a += 20) { const xx = x0 + Math.cos(a * Math.PI / 180) * r, zz = z0 + Math.sin(a * Math.PI / 180) * r; if (clear(xx, zz)) { x = xx; z = zz; break outer; } }
    const dx = pc[0] - x, dz = pc[1] - z, l = Math.hypot(dx, dz) || 1; pole(P, M, x, z, dx / l, dz / l); ph.addBox(x, z, 1.0, 1.0, 0, 0, 16);
  }
  svc.photoSpots.push({ x: -3790, z: -2290, yaw: L.yawToward(-3790, -2290, pc[0], pc[1]), name: 'Малая арена «Петровский»' });
}
