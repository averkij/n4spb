// landmarksKamennyTheatre/walk.js - colliders and services of the module.  Walkable: the granite stylobate of the portico (1.2 m) and its five steps (the doors are closed); everything else is solid: the body, the two annexes,
// the rear landings, the columns, the kiosks, the dacha houses and the plot fence with the closed gate.  Roofs are not colliders (core/roofmap.js captures what is drawn).
import { T, K as KF, TP, COLS } from './frame.js';
import { VENTS, POSTER } from './props.js';
import { LINE, GATE_W } from './fence.js';
import * as L from '../layout.js';

export async function build(K) {
  const { ctx, svc } = K, ph = ctx.physics;
  const { HW, ZE, ZF, ZS, platEdge, platH, annexL, annexD: D, annexTop } = TP;
  if (ph) {
    // ---- the theatre
    T.box(ph, 0, (ZE + ZF) / 2, 2 * HW + 0.2, ZF - ZE, 0, 0, 16);
    const PW = 11.1;
    T.walk(ph, 0, (ZF + platEdge) / 2, 2 * PW, platEdge - ZF, 0, platH);
    T.stairs(ph, 0, (platEdge + ZS) / 2, 2 * (PW + 0.12), ZS - platEdge, Math.PI, 0, platH - 0.2, 5);
    for (let i = 0; i < COLS.n; i++) T.cyl(ph, -COLS.axis + i * COLS.step, TP.colAxis, 0.62, platH, 11.2);
    for (const s of [-1, 1]) {
      T.box(ph, s * (HW + D / 2), TP.annexZ0 + annexL / 2, D + 0.1, annexL, 0, 0, annexTop + 1.0);
      const mx0 = s > 0 ? 4.55 : -HW, mx1 = s > 0 ? HW : -4.55;
      T.box(ph, (mx0 + mx1) / 2, ZE - 0.7, mx1 - mx0, 1.4, 0, 0, TP.plinth);
    }
    for (const [x, z] of VENTS) T.box(ph, x, z, 1.9, 1.9, 0, 0, 3.0);
    T.cyl(ph, POSTER[0], POSTER[1], 1.1, 0, 2.6);
    // ---- the Kleinmichel dacha (exterior only)
    const kb = (x0, x1, z0, z1, h) => KF.box(ph, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0, 0, h);
    kb(-6.5, 11.9, -15.4, 12.66, 12); kb(11.9, 17.3, -15.4, 2.4, 7); kb(-21.2, -17.0, -12.0, 12.8, 7); kb(2.7, 11.9, 12.66, 15.67, 6);
    kb(11.9, 26.9, 2.3, 11.4, 16); kb(-17.0, -7.0, -11.0, 13.3, 11);
    const tw = KF.W(0.2, 13.2); KF.box(ph, 0.2, 13.2, 5.2, 5.2, 0, 0, 22);
    void tw;
    // ---- the plot fence and the closed gate
    const seg = (a, b) => {
      const dx = b[0] - a[0], dz = b[1] - a[1], Ls = Math.hypot(dx, dz);
      if (Ls > 0.3) ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Ls + 0.3, 0.45, Math.atan2(-dz, dx), 0, 2.4);
    };
    const f = K.shared.fence;
    if (f) { for (const [a, b] of f.parts) seg(a, b); if (f.gate) { const g = f.gate, ux = Math.cos(g.rot), uz = -Math.sin(g.rot); seg([g.p[0] - ux * GATE_W / 2, g.p[1] - uz * GATE_W / 2], [g.p[0] + ux * GATE_W / 2, g.p[1] + uz * GATE_W / 2]); } }
    else for (let i = 0; i + 1 < LINE.length; i++) seg(LINE[i], LINE[i + 1]);
  }
  // ---- services
  const spot = (x, z, tx, tz, name, pitch = 6) => { if (!L.insideBuilding(x, z, 1) && !L.isOnRoad(x, z, 0.5)) svc.photoSpots.push({ x, z, yaw: L.yawToward(x, z, tx, tz), pitch, name }); };
  const door = T.W(0, ZS), doorOut = T.W(0, ZS + 3.0);
  svc.entrances.push({ x: doorOut.x, z: doorOut.z, rotY: T.face(0, 1), kind: 'theatre' });
  svc.monuments.push({ id: 'w39358614', name: 'Каменноостровский театр (вторая сцена БДТ)', x: T.ox, z: T.oz, h: 17 });
  svc.monuments.push({ id: 'w60703051', name: 'Дача Клейнмихель (Дом приёмов)', x: KF.ox, z: KF.oz, h: 21 });
  { const p = T.W(2, 44); spot(p.x, p.z, door.x, door.z, 'Каменноостровский театр: портик со стороны площади Старого Театра', 8); }
  { const p = T.W(-26, -34); spot(p.x, p.z, T.ox, T.oz, 'Каменноостровский театр: торец со стороны Крестовки и боковая терраса', 7); }
  { const p = KF.W(0, 32), q = KF.W(0.2, 13.2); spot(p.x, p.z, q.x, q.z, 'Дача Клейнмихель: башня за оградой', 12); }
  (svc.crowd ||= []).push({ id: 'kamenny-theatre', kind: 'photo', x: T.W(0, 40).x, z: T.W(0, 40).z, r: 8, n: 4 });
}
