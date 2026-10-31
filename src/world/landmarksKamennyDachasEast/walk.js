// landmarksKamennyDachasEast/walk.js - colliders and services of the module.  Walkable: the sphinx pier (the flight of 14 treads and the landing at y -3.1).  Everything else is solid: the dacha with its porticoes and vestibule,
// the wing, the plank fences of the plot (the plot is a closed construction site), the cheek walls and pedestals of the pier; the lowest landing is fenced at its edge so nobody walks into the river.
import { D, DP, WG, WP, PR, PP } from './frame.js';
import { RIVER, WEST, NORTH } from './fence.js';
import { cheekTop } from './pier.js';
import * as L from '../layout.js';

export async function build(K) {
  const { ctx, svc } = K, ph = ctx.physics;
  const { HW, HD } = DP;
  if (ph) {
    // ---- the dacha: core, vestibule, porticoes (their columns are inside the boxes)
    D.box(ph, 0, 0, 2 * HW + 0.4, 2 * HD + 0.4, 0, -1, 17);
    D.box(ph, 0, -(HD + DP.vest.d) / 2, 2 * DP.vest.hw + 0.4, DP.vest.d - HD + 0.4, 0, -1, 11);
    D.box(ph, 0, (HD + DP.portS.d) / 2, 2 * DP.portS.hw + 0.4, DP.portS.d - HD + 0.4, 0, -1, 7);
    D.box(ph, (HW + DP.portE.d) / 2, 0, DP.portE.d - HW + 0.4, 2 * DP.portE.hw + 0.4, 0, -1, 7);
    D.box(ph, -(HW + DP.portW.d) / 2, 0, DP.portW.d - HW + 0.4, 2 * DP.portW.hw + 0.4, 0, -1, 7);
    // ---- the wing
    WG.box(ph, 0, 0, 2 * WP.hw + 0.4, 2 * WP.hl + 0.4, 0, -1, 10);
    // ---- the plot fences
    const seg = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], Ls = Math.hypot(dx, dz); if (Ls > 0.2) ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Ls + 0.3, 0.5, Math.atan2(-dz, dx), -1, 2.6); };
    for (const line of [RIVER, WEST, NORTH]) for (let i = 0; i + 1 < line.length; i++) seg(line[i], line[i + 1]);
    // ---- the sphinx pier: the flight (14 treads) and the landing; cheek walls, pedestals, the edge of the landing
    const RISE = -PP.low / PP.nSteps, TREAD = 0.58, RUN = 14 * TREAD;
    { const c = PR.W(0, 4.8); ph.addHole(c.x, c.z, 2 * PP.stairHW + 2 * PP.cheekW - 0.3, PP.run + 0.2, PR.rot); }   // the terrain under the flight is no floor (the walk boxes are); the water pit of the environment does the same once registered
    PR.stairs(ph, 0, RUN / 2, 2 * PP.stairHW, RUN, 0, 0, -14 * RISE, 14);
    PR.walk(ph, 0, (RUN + PP.run) / 2, 2 * PP.hw, PP.run - RUN, 0, PP.low, -4.0);
    const z1 = PP.pedZ - PP.pedL / 2, n = 6;
    for (const s of [-1, 1]) {
      for (let j = 0; j < n; j++) { const za = z1 * j / n, zb = z1 * (j + 1) / n; PR.box(ph, s * (PP.stairHW + PP.cheekW / 2), (za + zb) / 2, PP.cheekW, zb - za, 0, -4.0, cheekTop(za)); }
      PR.box(ph, s * (PP.stairHW + PP.pedOut) / 2, PP.pedZ, PP.pedOut - PP.stairHW, PP.pedL, 0, -4.0, PP.low + PP.pedH + 0.9);
      PR.box(ph, s * (PP.pedOut + PP.hw) / 2, (PP.pedZ - PP.pedL / 2 + PP.run) / 2, PP.hw - PP.pedOut, PP.run - (PP.pedZ - PP.pedL / 2), 0, -4.0, 0.2);
      PR.box(ph, s * (PP.hw + 0.25), (RUN + PP.run) / 2 + 0.4, 0.5, PP.run - RUN + 1.0, 0, -4.0, -0.5);
    }
    PR.box(ph, 0, PP.run + 0.3, 2 * PP.hw + 1.0, 0.6, 0, -4.0, -0.5);
  }
  // ---- services
  const spot = (x, z, tx, tz, name, pitch = 6) => { if (!L.insideBuilding(x, z, 1) && !L.isOnRoad(x, z, 0.5)) svc.photoSpots.push({ x, z, yaw: L.yawToward(x, z, tx, tz), pitch, name }); };
  svc.monuments.push({ id: 'w31065816', name: 'Дача принца Ольденбургского', x: D.ox, z: D.oz, h: 17 });
  svc.monuments.push({ id: 'w31065814', name: 'Флигель дачи Ольденбургского', x: WG.ox, z: WG.oz, h: 10 });
  svc.monuments.push({ id: 'r10254206', name: 'Пристань со сфинксами', x: PR.W(0, 4).x, z: PR.W(0, 4).z, h: 3.5 });
  { const p = PR.W(0, -5.5); spot(p.x, p.z, D.ox, D.oz, 'Пристань со сфинксами и дача Ольденбургского', 6); }
  { const p = PR.W(0, 8.4); spot(p.x, p.z, PR.W(4.4, 7.5).x, PR.W(4.4, 7.5).z, 'Сфинкс на пристани, вид с нижней площадки', 4); }
  { const p = WG.W(11.5, -3); spot(p.x, p.z, WG.ox, WG.oz, 'Флигель дачи Ольденбургского', 6); }
  (svc.crowd ||= []).push({ id: 'kamenny-sphinx-pier', kind: 'photo', x: PR.W(0, -4).x, z: PR.W(0, -4).z, r: 6, n: 3 });
}
