// landmarksPetrovskyYacht/walk.js - the colliders and services of the module.  Main building: the player can walk the lawn, the three step flights (south entrance, north hall west end, west terrace), the stone apron
// (0.5 m) and the terrace under the first slab (1.0 m, 2.4 m deep between the Y pillars and the walls); the ground-floor walls, the Y pillars and the podium faces are solid; the club is closed, the doors are
// painted shut.  Roofs are not colliders (core/roofmap.js captures what is drawn).  Services: monument, photo spots, entrance, tourist stay zone.
import * as L from '../layout.js';
import { MAIN, H, P as PL, POD, ANNEX_N, ANNEX_W, mainWorld } from './frame.js';

const { F, apron, s1b } = H;
const { hx, hz, gi } = PL;
const sideLocal = (rot, u, z) => ({ lx: u * Math.cos(rot) + z * Math.sin(rot), lz: -u * Math.sin(rot) + z * Math.cos(rot) });

export function build(K) {
  const ph = K.ctx.physics;
  if (!ph) return;
  const R = MAIN.rot, A = POD.A, B = POD.B;
  const box = (lx, lz, wd, d, y0, y1) => { const p = mainWorld(lx, lz); ph.addBox(p.x, p.z, wd, d, R, y0, y1); };
  const walk = (lx, lz, wd, d, top) => { const p = mainWorld(lx, lz); return ph.addWalkBox(p.x, p.z, wd, d, R, top); };
  // ---- podium: apron B (0.5 m) and terrace A (1.0 m); the faces block from the lawn except at the steps
  walk((B.x0 + B.x1) / 2, (B.z0 + B.z1) / 2, B.x1 - B.x0, B.z1 - B.z0, apron);
  walk((A.x0 + A.x1) / 2, (A.z0 + A.z1) / 2, A.x1 - A.x0, A.z1 - A.z0, F);
  // ---- step flights: side frame (u, z outward); the flight rises toward the building
  const flight = (rot, u0, u1, zEdge, n, tread, y0, y1) => {
    const depth = n * tread, c = sideLocal(rot, (u0 + u1) / 2, zEdge + depth / 2), p = mainWorld(c.lx, c.lz);
    for (const it of ph.addStairs(p.x, p.z, u1 - u0, depth, R + rot + Math.PI, y0, y1, n)) it.sticky = true;
  };
  const fl = (rot, u0, u1, zA, zB) => { flight(rot, u0, u1, zB, 3, 0.42, 0, apron); flight(rot, u0, u1, zA, 3, 0.38, apron, F); };
  fl(0, -1.7, 8.7, A.z1, B.z1); fl(Math.PI / 2, 0.7, 4.7, A.x1, B.x1); fl(Math.PI, 21.0, 26.0, -A.z0, -B.z0); fl(-Math.PI / 2, 1.3, 5.3, -A.x0, -B.x0);
  // ---- the annexes: solid walls round the north hall and the west pavilion
  { const N = ANNEX_N, Wn = ANNEX_W;
    box((N.x0 + N.x1) / 2, N.z0 + 0.5, N.x1 - N.x0, 0.4, 0, 6); box(N.x1, (N.z0 + N.z1) / 2, 0.4, N.z1 - N.z0 + 4, 0, 6); box(N.x0 + 0.2, N.z0 - 0.0 + 3, 0.4, 6, 0, 6);
    box(Wn.x0 + 0.5, (Wn.z0 + Wn.z1) / 2, 0.4, Wn.z1 - Wn.z0, 0, 6); box((Wn.x0 + Wn.x1) / 2, Wn.z0 + 0.05, Wn.x1 - Wn.x0, 0.4, 0, 6); box((Wn.x0 + Wn.x1) / 2, Wn.z1 - 0.05, Wn.x1 - Wn.x0, 0.4, 0, 6); }
  // ---- ground-floor walls (recessed behind the pillars), solid from the lawn up to the first slab
  const wx = hx - gi, wz = hz - gi;
  box(0, wz, 2 * wx + 0.4, 0.4, 0, s1b + 1); box(0, -wz, 2 * wx + 0.4, 0.4, 0, s1b + 1);
  box(wx, 0, 0.4, 2 * wz + 0.4, 0, s1b + 1); box(-wx, 0, 0.4, 2 * wz + 0.4, 0, s1b + 1);
  // ---- Y pillars (stems and flared feet)
  for (const s of K.shared.stems || []) { const p = mainWorld(s.lx, s.lz); ph.addCylinder(p.x, p.z, 0.46, 0, s1b); }
  for (const p of K.shared.planters || []) { const q = mainWorld(p.x, p.z); ph.addCylinder(q.x, q.z, 0.55, 0, 2); }
  for (const b of K.shared.benches || []) { const q = mainWorld(b.x, b.z); ph.addBox(q.x, q.z, 1.9, 0.6, R + b.rot, 0, 1.3); }
  // ---- services
  const c = mainWorld(0, 0);
  K.svc.monuments.push({ id: MAIN.id, name: 'Главное здание Речного яхт-клуба', x: c.x, z: c.z, h: H.par + 19 });
  const spot = (lx, lz, name) => { const p = mainWorld(lx, lz); K.svc.photoSpots.push({ x: p.x, z: p.z, yaw: Math.round(L.yawToward(p.x, p.z, c.x, c.z)), name }); };
  spot(0, hz + 30, 'Речной яхт-клуб: главное здание со стороны входа');
  spot(-hx - 32, -4, 'Речной яхт-клуб: терраса и «хрустальный» каркас');
  spot(10, -hz - 24, 'Речной яхт-клуб: северный фасад над Малой Невкой');
  const e = mainWorld(3.5, hz + 0.2);
  K.svc.entrances.push({ x: e.x, z: e.z, rotY: R, bldg: MAIN.id });
  const g = mainWorld(0, hz + 12);
  (K.svc.crowd ||= []).push({ id: 'yacht-club-steps', kind: 'photo', x: g.x, z: g.z, r: 6, n: 3 });
}
