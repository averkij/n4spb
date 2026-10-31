// landmarksYelaginPalace/walk.js - the colliders of the palace: the player may walk the lawn, the two ramps, the west stair with its landing and side flights, the whole terrace / podium (walk boxes at
// F = 2.8 over the floor polygon, cut in 0.8 m strips) including the portico between the wall and the columns, the east stair; he cannot walk through the walls (the interior is closed: the doors are
// painted shut), the columns, the cheek blocks, the lions, the vases, the lamp posts, the railing, the kerbs of the ramps.  Roofs are not colliders (core/roofmap.js captures what is drawn).
import { PA, W, F, P as PL, FLOOR, EAST_STAIR } from './frame.js';
import { floorPts } from './west.js';

const DEG = Math.PI / 180;

/** n steps rising along the local +z of the frame (centre cx, cz, rotY) from y0 to y1 over depth d, width w; every box overlaps its neighbour by 2 cm (addStairs leaves hairline gaps between boxes) */
function stairs(ph, cx, cz, w, d, rotY, y0, y1, n) {
  const s = Math.sin(rotY), c = Math.cos(rotY), out = [];
  for (let i = 0; i < n; i++) {
    const lz = -d / 2 + d * (i + 0.5) / n;
    const it = ph.addWalkBox(cx + lz * s, cz + lz * c, w, d / n + 0.04, rotY, y0 + (y1 - y0) * (i + 1) / n);
    it.sticky = true; out.push(it);
  }
  return out;
}

export function build(K) {
  const ph = K.ctx.physics;
  if (!ph) return;
  const L = PL.halfLen;
  const box = (u, w, du, dw, y0, y1) => { const p = W(u, w); ph.addBox(p.x, p.z, dw, du, 0, y0, y1); };          // world x extent = dw (w runs west = -x), world z extent = du
  const cyl = (u, w, r, y0, y1) => { const p = W(u, w); ph.addCylinder(p.x, p.z, r, y0, y1); };
  // ---- walls of the closed body (0.8 m slabs on the wall planes)
  box(0, -0.2, 2 * L + 0.4, 0.8, 0, F + 14);                                    // west wall
  box(0, PL.wallE + 0.2, 2 * L + 0.4, 0.8, 0, F + 14);                          // east wall (the rotunda is added below)
  box(-L - 0.2 + 0.4, PL.wallE / 2, 0.8, -PL.wallE + 0.4, 0, F + 14);           // north wall
  box(L + 0.2 - 0.4, PL.wallE / 2, 0.8, -PL.wallE + 0.4, 0, F + 14);            // south wall
  // ---- rotunda: five facets
  const c = W(0, PL.rotC);
  for (const thd of [-72, -36, 0, 36, 72]) {
    const th = thd * DEG, a = 4.5, cx = c.x + a * Math.cos(th), cz = c.z + a * Math.sin(th);
    ph.addBox(cx, cz, 0.9, 3.4, Math.atan2(Math.cos(th), Math.sin(th)) - Math.PI / 2 + Math.PI / 2, 0, F + 12);
  }
  // ---- columns
  for (const u of [...PL.singles, ...PL.pairs]) cyl(u, PL.colW, 0.58, 0, F + 8);
  for (const u of PL.pairs) cyl(u, PL.colE, 0.58, 0, F + 8);
  for (let i = 0; i < 6; i++) { const th = (-90 + 36 * i) * DEG; cyl(PL.rotRc * Math.sin(th), PL.rotC - PL.rotRc * Math.cos(th), 0.58, 0, F + 8); }
  // ---- the terrace / podium floor: strips over the polygon
  const pts = floorPts(), step = 0.8;
  for (let u = -26 + step / 2; u < 26; u += step) {
    const ws = [];
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[0] > u) !== (b[0] > u)) ws.push(a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0])); }
    ws.sort((x, y) => x - y);
    for (let k = 0; k + 1 < ws.length; k += 2) { const w0 = ws[k], w1 = ws[k + 1]; if (w1 - w0 < 0.1) continue; const p = W(u, (w0 + w1) / 2); ph.addWalkBox(p.x, p.z, w1 - w0, step + 0.02, 0, F); }
  }
  // ---- the railing along the closed edges (a thin box from the floor to 1.1 m)
  for (let i = 0; i < FLOOR.length; i++) {
    if (!Array.isArray(FLOOR[i]) && FLOOR[i].open) continue;
    const a = pts[i], b = pts[(i + 1) % pts.length], pa = W(a[0], a[1]), pb = W(b[0], b[1]), len = Math.hypot(pb.x - pa.x, pb.z - pa.z);
    if (len < 0.1) continue;
    ph.addBox((pa.x + pb.x) / 2, (pa.z + pb.z) / 2, len, 0.3, Math.atan2(-(pb.z - pa.z), pb.x - pa.x), F - 0.1, F + 1.1);
  }
  // ---- the west stair: 13 steps, landing, cheek blocks (with the lions), side flights
  const S = PL.stair, sc = W(0, (S.wTop + S.wFoot) / 2);
  stairs(ph, sc.x, sc.z, 2 * S.half, S.wFoot - S.wTop, Math.PI / 2, 0, S.top, S.n);
  const lc = W(0, (7.6 + S.wTop) / 2);
  ph.addWalkBox(lc.x, lc.z, S.wTop - 7.6, 2 * S.half, 0, S.top);
  for (const s of [-1, 1]) {
    box(s * (S.half + S.cheekW / 2), (S.wTop + S.wFoot) / 2, S.cheekW, S.wFoot - S.wTop, 0, 3.4);
    const fc = W(s * (S.half + (9.4 - S.half) / 2), (7.6 + S.wTop) / 2);
    stairs(ph, fc.x, fc.z, S.wTop - 7.6, 9.4 - S.half, s > 0 ? 0 : Math.PI, 2.0, F, 4);
  }
  for (const s of [-1, 1]) { const p2 = W(s * (S.half + 9.4) / 2 * 1.0 + 0, S.wTop - 0.16); ph.addBox(p2.x, p2.z, 0.3, 9.4 - S.half, 0, 2.0, F + 1.2); }
  // ---- the east stair and its cheeks
  const E = EAST_STAIR, d = E.run / E.n, ec = W(0, E.wTop - (d * (E.n - 1)) / 2);
  stairs(ph, ec.x, ec.z, 2 * E.half, d * (E.n - 1), -Math.PI / 2, 0, F - 0.2, E.n - 1);
  for (const s of [-1, 1]) {
    box(s * (E.half + 1.2), E.wTop - 1.8, 2.4, 3.6, 0, F + 1.6);
    box(s * (E.half + 1.2), E.wTop - 3.6 - 2.3, 2.4, 4.6, 0, 2.6);
  }
  // ---- the ramps: walk ramps along the band + kerb boxes
  for (const R of K.shared.ramps || []) {
    for (const sg of R.segs) ph.addWalkRamp(sg.c[0], sg.c[1], sg.w, sg.len, sg.rot, sg.yA, sg.yB);
    const hOf = (i) => 0.05 + (F - 0.05) * (1 - i / (R.n - 1));
    const kerb = (X, X2, i) => {
      const a = W(X[i][0], X[i][1]), b = W(X[i + 1][0], X[i + 1][1]), a2 = W(X2[i][0], X2[i][1]), b2 = W(X2[i + 1][0], X2[i + 1][1]);
      const cx = (a.x + b.x + a2.x + b2.x) / 4, cz = (a.z + b.z + a2.z + b2.z) / 4, len = Math.hypot(b.x - a.x, b.z - a.z) + 0.1;
      ph.addBox(cx, cz, len, 0.45, Math.atan2(-(b.z - a.z), b.x - a.x), 0, Math.max(hOf(i), hOf(i + 1)) + 0.7);
    };
    for (let i = 0; i < R.n - 1; i++) { kerb(R.B, R.B2, i); if (R.aKerb(i) && R.aKerb(i + 1)) kerb(R.A, R.A2, i); }
  }
  // ---- small things: vases on their pedestals, lamp posts, balls, gate piers
  for (const s of [-1, 1]) {
    const uC = s * (E.half + 1.2);
    cyl(uC, E.wTop - 0.9, 0.55, 0, F + 2.4); cyl(uC, E.wTop - 2.7, 0.9, 0, F + 0.6); cyl(uC, E.wTop - 3.6 - 3.7, 0.5, 0, 3.2);
  }
  for (const sp of K.shared.lampSpots || []) { const p = W(sp.u, sp.w); ph.addCylinder(p.x, p.z, 0.4, 0, 4.5); }
  for (const b of K.shared.ballSpots || []) ph.addCylinder(b[0], b[2], 0.55, 0, 1.5);
  for (const g of [{ x: -4582.0, z: -5186.5, dx: 9.8, dz: 6.5 }, { x: -4637.5, z: -5166.1, dx: -0.595, dz: -0.803 }]) {
    const l = Math.hypot(g.dx, g.dz), nx = -g.dz / l, nz = g.dx / l;
    for (const s of [-1, 1]) ph.addCylinder(g.x + nx * s * 2.1, g.z + nz * s * 2.1, 0.5, 0, 2.6);
  }
  // services: the palace as a monument, three photo spots on the lawns, tourist stay zones at the stair feet
  { const p = W(0, -12); K.svc.monuments.push({ id: 'w717881701', name: 'Елагин дворец', x: p.x, z: p.z, h: F + 19.6 }); }
  { const a = W(0, 42), b = W(0, -62), c = W(0, 24);
    K.svc.photoSpots.push({ x: a.x, z: a.z, yaw: -90, name: 'Елагин дворец: западный фасад с колоннадой' }, { x: b.x, z: b.z, yaw: 90, name: 'Елагин дворец: ротонда парадного двора' }, { x: c.x, z: c.z, yaw: -90, name: 'Елагин дворец: лестница и чугунные львы' });
    const d = W(0, 26), e = W(0, -50);
    (K.svc.crowd ||= []).push({ id: 'yelagin-west-stair', kind: 'photo', x: d.x, z: d.z, r: 7, n: 6 }, { id: 'yelagin-east-stair', kind: 'photo', x: e.x, z: e.z, r: 8, n: 5 }); }
  { const p = W(0, PL.stair.wFoot + 1.5); K.svc.entrances.push({ x: p.x, z: p.z, rotY: PA.rot + Math.PI, bldg: 'w717881701' }); }
}
