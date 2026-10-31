// landmarksYelaginServices/walk.js - the colliders and the services of the Stable block: the walls of the closed buildings (pavilions, wings, cross wall with the open arch passage, the apse ring round the round court),
// the 20 Doric columns, the iron fences between the front columns (the central opening and the gate leaves stay open), the raised side bays of the colonnade (walk boxes at the ledge height 0.45), the lantern posts, the
// bronzes, the fences and the gate piers of the yard.  The player may walk: the forecourt, the central gate between the columns, the front court, the arch passage, the round court (all open).  Roofs are not colliders.
import { ST, STB as S, toWorld } from './frame.js';
import { COLONNADE } from './stable.js';
import { apseRing } from './stable.js';
import { BRONZES } from './sculpt.js';
import { stage } from './wall.js';
import { ringEdges } from './kit.js';

export function build(K) {
  const ph = K.ctx.physics;
  if (!ph) return;
  // a solid box in the ST frame: local centre (x, z), size w (along x) x d (along z)
  const box = (x, z, w, d, y0, y1) => { const p = toWorld(ST, x, z); ph.addBox(p.x, p.z, w, d, ST.rot, y0, y1); };
  const walk = (x, z, w, d, top) => { const p = toWorld(ST, x, z); return ph.addWalkBox(p.x, p.z, w, d, ST.rot, top); };
  stage(K, 'walk/blocks', () => {
    for (const s of [-1, 1]) {
      box(s * (S.pav.x0 + S.pav.x1) / 2, (S.pav.z0 + S.pav.z1) / 2, S.pav.x1 - S.pav.x0, S.pav.z1 - S.pav.z0, 0, 11);              // pavilions
      box(s * (S.wing.x0 + S.wing.x1) / 2, (S.wing.z0 + S.wing.z1) / 2, S.wing.x1 - S.wing.x0, S.wing.z1 - S.wing.z0, 0, 9.5);       // wings
    }
    const ax = 0.3, hw = S.archW / 2, c = S.cross;                                                                                         // the cross wall with the arch passage
    box((c.x0 + ax - hw) / 2, (c.z0 + c.z1) / 2, ax - hw - c.x0, c.z1 - c.z0, 0, 9.8);
    box((c.x1 + ax + hw) / 2, (c.z0 + c.z1) / 2, c.x1 - ax - hw, c.z1 - c.z0, 0, 9.8);
    box(ax, (c.z0 + c.z1) / 2, S.archW, c.z1 - c.z0, S.archH + 0.2, 9.8);
    // the apse ring: thin boxes just inside the wall edges of the baked outline (inward = -normal), 0.9 m thick
    const ring = apseRing(K), edges = ringEdges({ o: ring.flat(), h: [] }, 0.3);
    for (const e of edges) {
      if (Math.abs(e.a[1] - S.round.zCut) < 0.5 && Math.abs(e.b[1] - S.round.zCut) < 0.5) continue;
      const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], mx = (e.a[0] + e.b[0]) / 2 - e.n[0] * 0.45, mz = (e.a[1] + e.b[1]) / 2 - e.n[1] * 0.45;
      const p = toWorld(ST, mx, mz); ph.addBox(p.x, p.z, e.len + 0.3, 0.9, ST.rot + Math.atan2(-dz, dx), 0, S.hApse + 1.5);
    }
  });
  stage(K, 'walk/colonnade', () => {
    const { xs, zf, zb, zm, floorY, ledges } = COLONNADE;
    for (const x of xs) for (const z of [zf, zb]) { const p = toWorld(ST, x, z); ph.addCylinder(p.x, p.z, 0.5, 0, 5.2); }
    // the fences along the front row (gaps for the central opening), two ends
    box(-(1.44 + 10.6) / 2, zf, 10.6 - 1.44, 0.3, 0, 2.4); box((1.44 + 10.6) / 2, zf, 10.6 - 1.44, 0.3, 0, 2.4);
    // the two raised ledges under the rows of columns (0.45) and the three granite steps at each aisle door (the cobbled aisle between the ledges runs E-W to the doors of the pavilions)
    for (const s of [-1, 1]) {
      const x0 = 1.9 + 0.46, x1 = 10.6;
      for (const [z0, z1] of ledges) walk(s * (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, floorY);
      for (let i = 0; i < 3; i++) walk(s * (x1 - (0.4 * i + 0.8) / 2), zm, 0.4 * i + 0.8, 2.7, 0.06 + 0.13 * (3 - i));
    }
  });
  stage(K, 'walk/small', () => {
    for (const w of K.shared.lampPos || []) ph.addCylinder(w.x, w.z, 0.4, 0, 4.6);
    for (const b of BRONZES) ph.addCylinder(b.x, b.z, 0.62, 0, 2.7);
    for (const f of K.shared.fenceSegs || []) ph.addBox(f.x, f.z, f.len, 0.25, f.rot, 0, 2.2);
    for (const p of K.shared.piers || []) ph.addCylinder(p[0], p[1], 0.45, 0, 2.7);
  });
  // services: the stable as a monument, photo spots, a stay zone in the forecourt and in the round court, the entrance (the colonnade gate)
  { const m = toWorld(ST, 0, -30); K.svc.monuments.push({ id: 'r2420060', name: 'Конюшенный корпус', x: m.x, z: m.z, h: S.hApex }); }
  { const a = toWorld(ST, 0, 30), b = toWorld(ST, 0, -26), c = toWorld(ST, 0, -30);
    const yawN = -ST.rot * 180 / Math.PI * -1;
    K.svc.photoSpots.push({ x: a.x, z: a.z, yaw: yawN, name: 'Конюшенный корпус: колоннада у Масляного луга' }, { x: b.x, z: b.z, yaw: yawN, name: 'Конюшенный корпус: арка в круглый двор' });
    const d = toWorld(ST, 0, 18), e = toWorld(ST, 1.5, -36);
    K.svc.crowd.push({ id: 'yelagin-stable-gate', kind: 'photo', x: d.x, z: d.z, r: 6, n: 5 }, { id: 'yelagin-stable-court', kind: 'photo', x: e.x, z: e.z, r: 6, n: 4 });
    void c; }
  { const p = toWorld(ST, 0, 10); K.svc.entrances.push({ x: p.x, z: p.z, rotY: ST.rot + Math.PI, bldg: 'r2420060' }); }
}
