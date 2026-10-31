// landmarksPetrovskyYacht/rops.js - the SITE OF THE ROPS COTTAGE (Дом управляющего АО нефтеперегонных заводов «Ропс и К», Петровская коса 9 лит. Б, 1900-10, regional heritage object; OSM way w31065055 is tagged
// ruined:building=yes / was:historic=building).  The two-storey wooden house in the Swiss style stood derelict behind a green wire fence (photos y18 y19) and BURNED DOWN ON 6 JULY 2026 (fontanka.ru 2026-07-06 /
// 2026-08-21, ru.wikipedia "Петровская коса": "сгорел в 2026 г."; only the historic brick chimneys stood, KGIOP plans a restoration from the surveys).  What the scene shows (October 2026): the fenced plot, the
// brick footing of the old plan (8-gon 23.8 x 17.3 m with the south porch wing, broken and sooty), the black ash floor with charred beams, mounds of debris and bent roof sheet, three tall brick chimneys, the granite door step,
// and on the fence the information board (plain text).  Closed, solid fence (no entry).  Frame: centre of the polygon, rotation -18 deg (local z = the south normal).
import { insetRing, ringEdges, pointIn, wallsAlong, fenceAlong, stripBetween } from './shapes.js';

export const DEG = Math.PI / 180;
export const ROP = { x: -5907.138, z: -3469.22, rot: -18 * DEG };
export const RING = [[-12, -11.2], [11.8, -11.3], [11.8, 6.6], [5.8, 6.7], [5.7, 14.9], [-5.6, 14.9], [-5.6, 6], [-12, 6.1]];
export const FENCE_OFF = 3.6;
export const ropWorld = (lx, lz) => ({ x: ROP.x + lx * Math.cos(18 * DEG) + lz * Math.sin(18 * DEG), z: ROP.z - lx * Math.sin(18 * DEG) + lz * Math.cos(18 * DEG) });
export const fenceRing = () => insetRing(RING, -FENCE_OFF);

export function build(K) {
  const { P, M, ctx } = K;
  const r = ctx.rng(5517);
  P.push(ROP.x, 0, ROP.z, ROP.rot);
  P.far = 600;
  const inner = insetRing(RING, 0.5);
  // ---- the brick footing: an outer face, an inner face and the top of every edge (heights vary: it is broken and sooty)
  const E = ringEdges(RING), EI = ringEdges(inner), hs = [0.55, 0.4, 0.62, 0.3, 0.5, 0.46, 0.34, 0.6];
  for (let i = 0; i < RING.length; i++) {
    const j = (i + 1) % RING.length, h = hs[i], a = RING[i], b = RING[j], c = inner[i], d = inner[j], e = E[i];
    P.quad(M.brickSoot, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], h, b[1]], [a[0], h, a[1]], [e.n[0], 0, e.n[1]], [[0, 0], [e.len, 0], [e.len, h], [0, h]]);
    P.quad(M.brickSoot, [d[0], 0, d[1]], [c[0], 0, c[1]], [c[0], h, c[1]], [d[0], h, d[1]], [-e.n[0], 0, -e.n[1]], [[0, 0], [EI[i].len, 0], [EI[i].len, h], [0, h]]);
    P.quad(M.brickSoot, [a[0], h, a[1]], [b[0], h, b[1]], [d[0], h, d[1]], [c[0], h, c[1]], [0, 1, 0], [[a[0], a[1]], [b[0], b[1]], [d[0], d[1]], [c[0], c[1]]]);
  }
  // ---- the ash floor (a flat decal) and the debris
  P.cap(M.ash, inner, 0.05, true, 4);
  const inside = (x, z) => pointIn(inner, x, z);
  const pick = () => { for (let k = 0; k < 40; k++) { const x = r.range(-11, 11), z = r.range(-10, 14); if (inside(x, z)) return [x, z]; } return [0, 0]; };
  P.ranged(260, () => {
    for (let i = 0; i < 8; i++) { const [x, z] = pick(), R = r.range(0.9, 2.1); P.cyl(M.ash, [x, 0.05, z], [x, r.range(0.35, 0.8), z], R, R * 0.35, 9, true); }                         // mounds of ash and debris
    for (let i = 0; i < 30; i++) {                                                                                                                                             // charred beams, lying and leaning
      const [x, z] = pick(), a = r.range(0, Math.PI * 2), len = r.range(1.1, 3.8), lift = r.chance(0.35) ? r.range(0.4, 1.3) : r.range(0.05, 0.35);
      const x2 = Math.max(-11.8, Math.min(11.6, x + Math.cos(a) * len)), z2 = z + Math.sin(a) * len;
      P.beam(M.charred, [[x, 0.2, z], [x2, 0.2 + lift, z2]], r.range(0.12, 0.26), r.range(0.1, 0.2), null, 0.5);
    }
    for (let i = 0; i < 5; i++) { const [x, z] = pick(), a = r.range(0, Math.PI * 2), w = r.range(0.8, 1.6), l = r.range(1.2, 2.2), ca = Math.cos(a), sa = Math.sin(a);       // bent sheets of the metal roof
      P.quad(M.rust, [x, 0.5, z], [x + ca * l, 0.18, z + sa * l], [x + ca * l - sa * w, 0.3, z + sa * l + ca * w], [x - sa * w, 0.62, z + ca * w], [0, 1, 0]); }
  });
  // ---- the three surviving chimneys (brick, tapering, corbelled cap, a flue pot) and the granite door step of the south wing
  for (const [x, z, h] of [[-2.2, -3.0, 6.8], [8.2, -6.4, 6.2], [-9.2, -5.6, 5.6]]) {
    P.box(M.brickSoot, x - 0.55, x + 0.55, 0, h, z - 0.4, z + 0.4, 'b', 1); P.box(M.brickSoot, x - 0.4, x + 0.4, h, h + 0.5, z - 0.3, z + 0.3, 'b', 1);
    P.box(M.brickSoot, x - 0.66, x + 0.66, h - 0.12, h + 0.0, z - 0.5, z + 0.5, '', 1); P.box(M.brickSoot, x - 0.7, x + 0.7, 0, 0.55, z - 0.55, z + 0.55, 'b', 1);
  }
  P.box(M.granite, -0.8, 0.8, 0.0, 0.22, 14.9 - 0.2, 14.9 + 0.7, '', 1.5);
  // ---- the fence: welded green mesh 1.8 m on posts every panel, round the plot at FENCE_OFF; the info board on its south side
  const F = insetRing(RING, -FENCE_OFF);
  P.ranged(300, () => {
    fenceAlong(P, M.wireGreen, F, 0, 1.8, 2.5, true);
    for (let i = 0; i < F.length; i++) {
      const a = F[i], b = F[(i + 1) % F.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 2.5));
      for (let k = 0; k < n; k++) { const t = k / n; P.box(M.black, a[0] + (b[0] - a[0]) * t - 0.045, a[0] + (b[0] - a[0]) * t + 0.045, 0, 1.95, a[1] + (b[1] - a[1]) * t - 0.045, a[1] + (b[1] - a[1]) * t + 0.045, '', 1); }
    }
    const zS = 14.9 + FENCE_OFF + 0.04;
    P.quad(M.infoRops, [-1.8, 0.35, zS], [1.0, 0.35, zS], [1.0, 1.85, zS], [-1.8, 1.85, zS], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  });
  P.pop();
  const ph = K.ctx.physics;
  if (ph) for (let i = 0; i < F.length; i++) {
    const a = ropWorld(F[i][0], F[i][1]), b = ropWorld(F[(i + 1) % F.length][0], F[(i + 1) % F.length][1]), len = Math.hypot(b.x - a.x, b.z - a.z);
    ph.addBox((a.x + b.x) / 2, (a.z + b.z) / 2, len + 0.2, 0.3, Math.atan2(-(b.z - a.z), b.x - a.x), 0, 1.9);
  }
  { const c = ropWorld(0, 0); K.svc.monuments.push({ id: 'w31065055', name: 'Дом Ропса (сгорел 6 июля 2026)', x: c.x, z: c.z, h: 7 }); }
  K.shared.rops = { fence: F.map(([x, z]) => ropWorld(x, z)) };
  void wallsAlong; void stripBetween;
}
