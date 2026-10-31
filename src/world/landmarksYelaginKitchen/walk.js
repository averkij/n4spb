// landmarksYelaginKitchen/walk.js - colliders and services of the Kitchen block.  The interior is CLOSED (the door is painted shut, the courtyard is unreachable): the ring of walls (facets 1.2 m thick along the drum, the
// chord behind the south portico and the whole north wall) is solid up to the roof; the player walks the lawn, the three low steps and the stylobate of the SOUTH portico (0.5 m) and the five steps and stylobate of the
// NORTH portico (1.0 m) between the columns (columns, the lamp posts, bollards, gate piers and fences are solid).  Services: monuments (the block and the 14 statues), photo spots, tourist stay zones, the entrance.
import { C, TH, D, PS, PN, POR, W } from './frame.js';
import { ringPoints } from './body.js';

export function build(K) {
  const ph = K.ctx.physics;
  if (!ph) return;
  const topY = 8.3;
  // ---- the ring of walls (every edge: drum facets, the chord of the south portico, the north wall), 1.2 m thick, inside the outline
  const ring = ringPoints(), n = ring.length;
  let cu = 0, cw = 0; for (const p of ring) { cu += p[0]; cw += p[1]; } cu /= n; cw /= n;
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.05) continue;
    let nu = (b[1] - a[1]) / l, nw = -(b[0] - a[0]) / l;                                    // an edge normal; flip toward the centroid (the inside)
    if ((cu - (a[0] + b[0]) / 2) * nu + (cw - (a[1] + b[1]) / 2) * nw < 0) { nu = -nu; nw = -nw; }
    const mu = (a[0] + b[0]) / 2 + nu * 0.55, mw = (a[1] + b[1]) / 2 + nw * 0.55, p = W(mu, mw), wa = W(a[0], a[1]), wb = W(b[0], b[1]);
    ph.addBox(p.x, p.z, l + 0.12, 1.1, Math.atan2(-(wb.z - wa.z), wb.x - wa.x), 0, topY);
  }
  // ---- the two porticos: stylobate (walk box), steps, columns
  const box = (u0, u1, w0, w1, y) => { const p = W((u0 + u1) / 2, (w0 + w1) / 2); return ph.addWalkBox(p.x, p.z, u1 - u0, w1 - w0, TH, y); };
  for (const [PX, sg, tread] of [[PS, 1, 0.42], [PN, -1, 0.38]]) {
    const out = (d) => PX.back + sg * d, hw = POR.halfW + 0.25, rise = PX.floor / PX.steps;
    { const w0 = Math.min(out(-0.05), out(3.1)), w1 = Math.max(out(-0.05), out(3.1)); box(-hw, hw, w0, w1, PX.floor); }
    for (let i = 1; i < PX.steps; i++) {
      const wa = out(3.1 + (i - 1) * tread - 0.02), wb = out(3.1 + i * tread);
      const it = box(-hw, hw, Math.min(wa, wb), Math.max(wa, wb), PX.floor - i * rise); if (it) it.sticky = true;
    }
    for (const u of POR.cols) { const p = W(u, out(2.0)); ph.addCylinder(p.x, p.z, 0.56, 0, PX.floor + 6.2); }
    // the half-height blocks of the antae at the back corners
    for (const s of [-1, 1]) { const p = W(s * (POR.halfW - 0.4), out(0.35)); ph.addBox(p.x, p.z, 0.8, 0.7, TH, PX.floor, PX.floor + 6.3); }
  }
  // ---- services
  const S = K.svc, c = W(0, 8);
  S.monuments.push({ id: 'r1444351', name: 'Кухонный корпус Елагина дворца', x: c.x, z: c.z, h: 11.7 });
  const a = W(0, 64), b = W(0, -46), e = W(0, 41), f = W(0, -12);
  S.photoSpots.push({ x: a.x, z: a.z, yaw: 4.3, name: 'Кухонный корпус: портик и четырнадцать статуй' }, { x: b.x, z: b.z, yaw: -175.7, name: 'Кухонный корпус: северный портик с вазами' });
  (S.crowd ||= []).push({ id: 'yelagin-kitchen-south', kind: 'photo', x: e.x, z: e.z, r: 7, n: 5 }, { id: 'yelagin-kitchen-north', kind: 'photo', x: f.x, z: f.z, r: 5, n: 3 });
  { const p = W(0, PS.front + 1.7); S.entrances.push({ x: p.x, z: p.z, rotY: TH + Math.PI, bldg: 'r1444351' }); }
  void C; void D;
}
