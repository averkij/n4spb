// landmarksKamennyDachasWest/walk.js - colliders and services of the module.  The three plots are closed: every building is a solid block (collected in K.shared.cols by the house parts), every fence run
// and every closed gate is a thin solid wall (K.shared.fences).  Roofs are not colliders (core/roofmap.js captures what is drawn).  Services: monuments, photo spots along the embankment road and Bolshaya alleya.
import * as L from '../layout.js';

export async function build(K) {
  const { ctx, svc, shared } = K, ph = ctx.physics;
  if (ph) {
    for (const c of shared.cols || []) {
      if (c.box) { const [x, z, w, d, r, h] = c.box; ph.addBox(x, z, w, d, r, 0, h); }
      else if (c.cyl) { const [x, z, rad, h] = c.cyl; ph.addCylinder(x, z, rad, 0, h); }
    }
    for (const f of shared.fences || []) {
      const [a, b, h] = f, dx = b[0] - a[0], dz = b[1] - a[1], Ls = Math.hypot(dx, dz);
      if (Ls > 0.3) ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Ls + 0.3, 0.45, Math.atan2(-dz, dx), 0, h || 2.4);
    }
  }
  const spot = (x, z, tx, tz, name, pitch = 6) => { if (!L.insideBuilding(x, z, 1) && !L.isOnRoad(x, z, 0.5)) svc.photoSpots.push({ x, z, yaw: L.yawToward(x, z, tx, tz), pitch, name }); };
  svc.fenceRuns = shared.fences || [];
  const on = (k) => K.claimed.has(k);
  if (on('kamenny-polovtsov')) {
    svc.monuments.push({ id: 'w60703042', name: 'Дача Половцова', x: -4181.1, z: -5199.2, h: 14 });
    for (const [x, z] of [[-4244, -5199], [-4240, -5180], [-4240, -5220]]) spot(x, z, -4207, -5199, 'Дача Половцова: застеклённый эркер со стороны Средней Невки', 6);
  }
  if (on('kamenny-gauswald')) {
    svc.monuments.push({ id: 'w108029314', name: 'Дача Гаусвальд', x: -3786.9, z: -5053.5, h: 12 });
    for (const [x, z] of [[-3752, -5040], [-3760, -5075], [-3745, -5058]]) spot(x, z, -3787, -5053, 'Дача Гаусвальд: ограда и дом со стороны Большой аллеи', 8);
  }
  if (on('kamenny-follenweider')) {
    svc.monuments.push({ id: 'w108026879', name: 'Особняк Фолленвейдера', x: -3778.3, z: -5191.8, h: 18 });
    for (const [x, z] of [[-3830, -5170], [-3825, -5155], [-3810, -5135]]) spot(x, z, -3792, -5196, 'Особняк Фолленвейдера: ворота и шатровая крыша', 10);
  }
}
