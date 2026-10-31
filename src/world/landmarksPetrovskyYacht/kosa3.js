// landmarksPetrovskyYacht/kosa3.js - PETROVSKAYA KOSA 3/6: the small OFFICE ("контора", OSM part r21379094 of the untagged way w31065398, 11.9 x 11.6 m, 3 levels) and the TRANSFORMER HUT beside the road (the
// "электростанция", OSM r21379092, 4.3 x 4.5 m), with the prefab concrete fence and its sliding gate between them.  Photos (Commons "Петровская коса 3 (контора и электростанция)" 01 / 02, "(контора)" 01 / 02 / 03 / 04,
// "(электростанция)" 01, local copies refs/petrovsky-zhdanovka-2026/yacht + yacht2 k3_1..k3_5) settled the mapping that the dossier left open: the office is r21379094, NOT w31065336.
// Office: a three-storey cube of pale yellow limestone ashlar (#e4d29a, blocks 0.6 x 0.3 m) on a grey rock-faced plinth, rock-faced white-grey QUOINS at the four corners (alternating long / short blocks),
// two rock-faced string courses (above the ground floor and above the first floor), a low hipped roof of grey sheet with deep eaves, white fascia, grey drainpipes at three corners and a small antenna mast.
// South face (to the road): ground floor with three grilled windows and the OVAL WINDOW in its stucco garland between the first two, flanked by two stacks of rock-faced blocks (the walled-up door);
// the upper floors carry plain white-framed windows (the middle ones with a rock-faced lintel).  Hut: yellow ashlar, big rock-faced quoins and a rock-faced belt under the eaves, a steel door and a vent grille
// on the road side, a low hipped roof.  Fence: 2.2 m prefab concrete panels (ochre) on posts, a white sliding gate, from the office to the hut along the north edge of the carriageway.  All solid; no entry.
// Frames: the office frame has local x along its road edge (ESE), local +z = the south face; the hut frame x along its south edge.  The photographed "3/6 Петровская коса" lantern plate is not drawn (street plates:
// docs/rules/SIGNS-AND-PLATES.md), no shop / rental signs, no logos.
import * as L from '../layout.js';

const PI = Math.PI;
export const OFFICE = { id: 'r21379094', ring: [[-5714, -3375.4], [-5710.2, -3386.7], [-5699.1, -3383], [-5703, -3371.6]] };
export const HUT = { id: 'r21379092', ring: [[-5679.7, -3366.8], [-5683.8, -3368.1], [-5682.4, -3372.4], [-5678.3, -3371.1]] };
/** frame of a ring: local x along the edge ring[a] -> ring[b], local +z outward at that edge; c = the corner next to a on the other axis */
const frameOf = (ring, a, b, c) => {
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const dx = ring[b][0] - ring[a][0], dz = ring[b][1] - ring[a][1], rot = -Math.atan2(dz, dx);
  const f = { x: cx, z: cz, rot, hx: Math.hypot(dx, dz) / 2, hz: Math.hypot(ring[a][0] - ring[c][0], ring[a][1] - ring[c][1]) / 2 };
  // the edge a -> b must lie on the +z side (outward = south for both frames)
  const nz = (ring[a][0] - cx) * Math.sin(rot) + (ring[a][1] - cz) * Math.cos(rot);
  if (nz < 0) throw new Error('kosa3: frame orientation');
  return f;
};
export const OF = frameOf(OFFICE.ring, 0, 3, 1);
export const HF = frameOf(HUT.ring, 1, 0, 2);
// the OSM hut stands about 0.5 m inside the mapped carriageway (the photos show it at the kerb): slide it 0.7 m to its north (local -z) so that its walls and collider stay off the asphalt (road integrity)
HF.x += -0.7 * Math.sin(HF.rot); HF.z += -0.7 * Math.cos(HF.rot);
const wl = (f, lx, lz) => ({ x: f.x + lx * Math.cos(f.rot) + lz * Math.sin(f.rot), z: f.z - lx * Math.sin(f.rot) + lz * Math.cos(f.rot) });
export const officeWorld = (lx, lz) => wl(OF, lx, lz);
export const hutWorld = (lx, lz) => wl(HF, lx, lz);
const sides = (f) => [{ n: 'S', rot: 0, hu: f.hx, hd: f.hz }, { n: 'E', rot: PI / 2, hu: f.hz, hd: f.hx }, { n: 'N', rot: PI, hu: f.hx, hd: f.hz }, { n: 'W', rot: -PI / 2, hu: f.hz, hd: f.hx }];

/** rock-faced quoins up the four corners of a box (side frames, u runs to the right seen from outside): alternating long / short blocks, jittered protrusion */
function quoins(P, M, f, y0, y1, ch, long, short, r) {
  const S = sides(f); let j = 0;
  for (let y = y0; y + ch <= y1 + 0.001; y += ch + 0.03, j++) {
    for (let i = 0; i < 4; i++) {
      const s = S[i];
      P.push(0, 0, 0, s.rot);
      const rp = 0.035 + r() * 0.03, lp = 0.035 + r() * 0.03;
      const wr = (j % 2 === 0 ? long : short) * (0.92 + r() * 0.16), wlf = (j % 2 === 0 ? short : long) * (0.92 + r() * 0.16);
      P.box(M.granite, s.hu - wr, s.hu, y, y + ch, s.hd, s.hd + rp, 'kb', 1.2);
      P.box(M.granite, -s.hu, -s.hu + wlf, y, y + ch, s.hd, s.hd + lp, 'kb', 1.2);
      P.pop();
    }
  }
}
/** a window of the side frame at u: white PVC frame block (7 cm proud), mullion, glass, granite sill, optional rock-faced lintel with imposts and a grille */
function win(P, M, hd, u, yb, ww, hh, o = {}) {
  const gl = o.grille ? M.glassLattice : M.glassGround;
  P.box(M.white, u - ww / 2 - 0.06, u + ww / 2 + 0.06, yb - 0.06, yb + hh + 0.06, hd - 0.02, hd + 0.07, 'bk', 1);
  P.quad(gl, [u - ww / 2, yb, hd + 0.075], [u + ww / 2, yb, hd + 0.075], [u + ww / 2, yb + hh, hd + 0.075], [u - ww / 2, yb + hh, hd + 0.075], [0, 0, 1], o.grille ? [[0.12, 0.1], [0.5, 0.1], [0.5, 0.86], [0.12, 0.86]] : [[0.1, 0.12], [0.9, 0.12], [0.9, 0.88], [0.1, 0.88]]);
  if (!o.grille) P.box(M.white, u - 0.02, u + 0.02, yb, yb + hh, hd + 0.075, hd + 0.095, 'kb', 1);
  P.box(M.granite, u - ww / 2 - 0.12, u + ww / 2 + 0.12, yb - 0.13, yb - 0.04, hd, hd + 0.17, 'kb', 1.2);
  if (o.lintel) {
    P.box(M.granite, u - ww / 2 - 0.22, u + ww / 2 + 0.22, yb + hh + 0.06, yb + hh + 0.34, hd, hd + 0.08, 'kb', 1.2);
    for (const sg of [-1, 1]) P.box(M.granite, sg < 0 ? u - ww / 2 - 0.42 : u + ww / 2 + 0.06, sg < 0 ? u - ww / 2 - 0.06 : u + ww / 2 + 0.42, yb + hh * 0.5, yb + hh * 0.5 + 0.3, hd, hd + 0.07, 'kb', 1.2);
  }
}

export function build(K) {
  const { P, M, ctx } = K, r = ctx.rng(3306), ph = ctx.physics;
  const colliders = (K.shared.kosa3 = { boxes: [] });
  // =============================================================================================== the office
  {
    const f = OF, { hx, hz } = f, PL = 0.55, Y1 = 3.4, Y2 = 6.55, EV = 9.55;
    P.push(f.x, 0, f.z, f.rot);
    P.far = 500;
    for (const s of sides(f)) {
      P.push(0, 0, 0, s.rot);
      const { hu, hd } = s, tile = 1.2;
      P.quad(M.granite, [-hu, 0, hd], [hu, 0, hd], [hu, PL, hd], [-hu, PL, hd], [0, 0, 1], [[-hu / 1.5, 0], [hu / 1.5, 0], [hu / 1.5, PL / 1.5], [-hu / 1.5, PL / 1.5]]);   // the plinth (rock-faced granite)
      P.box(M.granite, -hu, hu, PL - 0.1, PL + 0.04, hd, hd + 0.05, 'kb', 1.5);                                                                                       // its ledge
      P.quad(M.ashlar, [-hu, PL, hd], [hu, PL, hd], [hu, EV, hd], [-hu, EV, hd], [0, 0, 1], [[0, PL / tile], [2 * hu / tile, PL / tile], [2 * hu / tile, EV / tile], [0, EV / tile]]);
      for (const y of [Y1, Y2]) P.box(M.granite, -hu, hu, y - 0.17, y + 0.17, hd, hd + 0.045, 'kb', 1.2);                                                          // rock-faced string courses
      P.pop();
    }
    quoins(P, M, f, PL + 0.02, EV - 0.05, 0.4, 0.95, 0.5, r);
    // ---- windows (u from the left as seen from outside)
    const W = (n, fn) => { const s = sides(f).find((q) => q.n === n); P.push(0, 0, 0, s.rot); fn(s.hd, s.hu); P.pop(); };
    W('S', (hd) => {
      for (const u of [-4.4, 0.35, 3.0]) win(P, M, hd, u, 1.0, 1.0, 1.55, { grille: true, lintel: true });
      for (const u of [-4.1, -0.9, 3.0]) win(P, M, hd, u, 4.4, 0.95, 1.5, { lintel: true });
      for (const u of [-2.4, 1.0]) win(P, M, hd, u, 7.5, 0.95, 1.5);
      // the oval window in its stucco garland (rx 0.5, ry 0.38 at y 2.35), the two walled-up stacks of rock-faced blocks below it
      const ox = -2.2, oy = 2.35, a = 0.5, b = 0.38, n = 20, ring = (k, dz) => { const t = k / n * PI * 2; return [ox + Math.cos(t) * a, oy + Math.sin(t) * b, hd + dz]; };
      P.fan(M.glassGround, Array.from({ length: n }, (_, k) => ring(k, 0.05)), [0, 0, 1], (p) => [0.3 + (p[0] - ox) * 0.4, 0.5 + (p[1] - oy) * 0.5]);
      for (let k = 0; k < n; k++) {
        const t0 = k / n * PI * 2, t1 = (k + 1) / n * PI * 2, A = (t, e) => [ox + Math.cos(t) * (a + e), oy + Math.sin(t) * (b + e), hd + 0.07];
        P.quad(M.white, A(t0, 0), A(t1, 0), A(t1, 0.17), A(t0, 0.17), [0, 0, 1]);
      }
      P.box(M.white, ox - 0.3, ox + 0.3, oy + b + 0.16, oy + b + 0.4, hd, hd + 0.1, 'kb', 1);                            // the bow of the garland
      // the garland is a plain white plaster ring with a bow on top (the leaf sprays of the photo are too fine for the geometry: a texture job)
      P.quad(M.white, [ox, oy + b + 0.2, hd + 0.08], [ox + 0.34, oy + b + 0.4, hd + 0.08], [ox + 0.1, oy + b + 0.12, hd + 0.08], [ox, oy + b + 0.2, hd + 0.08], [0, 0, 1]);
      P.quad(M.white, [ox, oy + b + 0.2, hd + 0.08], [ox - 0.34, oy + b + 0.4, hd + 0.08], [ox - 0.1, oy + b + 0.12, hd + 0.08], [ox, oy + b + 0.2, hd + 0.08], [0, 0, 1]);
      for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) { const wd = k % 2 ? 0.45 : 0.75, x = ox + sg * 0.62; P.box(M.granite, sg < 0 ? x - wd : x, sg < 0 ? x : x + wd, 0.6 + k * 0.38, 0.6 + k * 0.38 + 0.34, hd, hd + 0.06, 'kb', 1.2); }
    });
    W('E', (hd) => { for (const u of [-2.0, 2.2]) win(P, M, hd, u, 4.4, 0.95, 1.5, { lintel: u < 0 }); for (const u of [-1.2, 2.4]) win(P, M, hd, u, 7.5, 0.95, 1.5); });
    W('N', (hd) => {
      win(P, M, hd, 0.4, 4.4, 0.95, 1.5, { lintel: true }); for (const u of [-2.6, 1.6]) win(P, M, hd, u, 7.5, 0.95, 1.5);
      P.box(M.metal, 2.0, 3.1, 0.55, 2.55, hd, hd + 0.1, 'kb', 1); P.box(M.white, 1.9, 3.2, 2.5, 2.62, hd, hd + 0.16, 'kb', 1);                       // a steel service door with a canopy lip
      P.box(M.white, -2.6, -1.8, 1.2, 1.8, hd, hd + 0.45, 'kb', 1);                                                                                         // an air-conditioner box
    });
    W('W', (hd) => {
      for (const u of [-3.4, 0, 3.4]) win(P, M, hd, u, 1.0, 1.0, 1.55, { grille: true, lintel: true });
      for (const u of [-3.4, 0, 3.4]) win(P, M, hd, u, 4.4, 0.95, 1.5, { lintel: u === 0 });
      for (const u of [-2.2, 1.6]) win(P, M, hd, u, 7.5, 0.95, 1.5);
    });
    // ---- the eaves, the low hipped roof, the drainpipes, the antenna
    const oh = 0.75, ex = hx + oh, ez = hz + oh, ix = 1.3, iz = 1.3, yE = EV - 0.1, yR = 11.05;
    P.quad(M.white, [-ex, EV, -ez], [ex, EV, -ez], [ex, EV, ez], [-ex, EV, ez], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const s of sides(f)) {
      P.push(0, 0, 0, s.rot);
      const eu = s.hu + oh, ed = s.hd + oh, iu = s.n === 'S' || s.n === 'N' ? ix : iz, id = s.n === 'S' || s.n === 'N' ? iz : ix, k = (yR - yE) / (ed - id), sl = Math.hypot(1, k);
      P.quad(M.tin, [-eu, yE, ed], [eu, yE, ed], [iu, yR, id], [-iu, yR, id], [0, 1 / sl, k / sl], [[-eu / 1.2, 0], [eu / 1.2, 0], [iu / 1.2, (ed - id) * sl / 1.2], [-iu / 1.2, (ed - id) * sl / 1.2]]);
      P.box(M.white, -eu, eu, yE - 0.22, yE + 0.04, ed - 0.04, ed + 0.04, 'kb', 1);                                                                                 // fascia
      P.box(M.metal, -eu, eu, yE - 0.1, yE + 0.0, ed + 0.04, ed + 0.16, 'kb', 1);                                                                                     // gutter
      P.pop();
    }
    P.quad(M.tin, [-ix, yR, -iz], [ix, yR, -iz], [ix, yR, iz], [-ix, yR, iz], [0, 1, 0]);
    P.ranged(300, () => {
      for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1]]) P.cyl(M.metal, [sx * (hx + 0.1), 0.25, sz * (hz + 0.1)], [sx * (hx + 0.1), yE - 0.05, sz * (hz + 0.1)], 0.065, 0.065, 6, false);
      P.cyl(M.metal, [0.4, yR, 0.2], [0.4, yR + 3.2, 0.2], 0.035, 0.03, 5, true); P.box(M.metal, -0.45, 1.25, yR + 2.6, yR + 2.65, 0.15, 0.25, '', 1);
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4; P.cyl(M.metal, [0.4, yR + 2.8, 0.2], [0.4 + Math.cos(a) * 1.7, yR + 0.05, 0.2 + Math.sin(a) * 1.7], 0.008, 0.008, 3, false); }
    });
    P.pop();
    if (ph) { const c = wl(f, 0, 0); ph.addBox(c.x, c.z, 2 * hx + 0.2, 2 * hz + 0.2, f.rot, 0, 11); }
  }
  // =============================================================================================== the transformer hut
  {
    const f = HF, { hx, hz } = f, PL = 0.45, EV = 3.15, yE = EV - 0.05, yR = 4.15;
    P.push(f.x, 0, f.z, f.rot);
    P.far = 420;
    for (const s of sides(f)) {
      P.push(0, 0, 0, s.rot);
      const { hu, hd } = s, tile = 1.2;
      P.quad(M.granite, [-hu, 0, hd], [hu, 0, hd], [hu, PL, hd], [-hu, PL, hd], [0, 0, 1], [[-hu / 1.5, 0], [hu / 1.5, 0], [hu / 1.5, PL / 1.5], [-hu / 1.5, PL / 1.5]]);
      P.quad(M.ashlar, [-hu, PL, hd], [hu, PL, hd], [hu, EV, hd], [-hu, EV, hd], [0, 0, 1], [[0, PL / tile], [2 * hu / tile, PL / tile], [2 * hu / tile, EV / tile], [0, EV / tile]]);
      P.box(M.granite, -hu, hu, EV - 0.5, EV - 0.04, hd, hd + 0.05, 'kb', 1.2);                      // the rock-faced belt under the eaves
      P.pop();
    }
    quoins(P, M, f, PL + 0.02, EV - 0.55, 0.45, 0.85, 0.55, r);
    P.push(0, 0, 0, 0);                                                                                 // the road side (south): the steel door in a rock-faced surround, the vent grille above it
    const hd = hz;
    P.box(M.granite, 0.35 - 0.7, 0.35 + 0.7, PL, 2.45, hd, hd + 0.05, 'kb', 1.2);
    P.box(M.metal, 0.35 - 0.52, 0.35 + 0.52, PL, 2.2, hd + 0.05, hd + 0.1, 'kb', 1);
    P.box(M.black, 0.35 - 0.5, 0.35 - 0.46, PL, 2.2, hd + 0.1, hd + 0.115, 'kb', 1); P.box(M.black, 0.35 + 0.46, 0.35 + 0.5, PL, 2.2, hd + 0.1, hd + 0.115, 'kb', 1);
    P.box(M.black, 0.35 + 0.3, 0.35 + 0.42, 1.1, 1.14, hd + 0.1, hd + 0.13, 'kb', 1);                // the handle
    P.box(M.metal, -0.8, -0.3, 2.5, 2.7, hd, hd + 0.05, 'kb', 1); P.box(M.black, -0.74, -0.36, 2.55, 2.65, hd + 0.05, hd + 0.06, 'kb', 1);   // the vent grille
    P.pop();
    const oh = 0.55, ex = hx + oh, ez = hz + oh, ix = 0.55, iz = 0.55;
    P.quad(M.white, [-ex, EV, -ez], [ex, EV, -ez], [ex, EV, ez], [-ex, EV, ez], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const s of sides(f)) {
      P.push(0, 0, 0, s.rot);
      const eu = s.hu + oh, ed = s.hd + oh, iu = s.n === 'S' || s.n === 'N' ? ix : iz, id = s.n === 'S' || s.n === 'N' ? iz : ix, k = (yR - yE) / (ed - id), sl = Math.hypot(1, k);
      P.quad(M.tin, [-eu, yE, ed], [eu, yE, ed], [iu, yR, id], [-iu, yR, id], [0, 1 / sl, k / sl], [[-eu / 1.2, 0], [eu / 1.2, 0], [iu / 1.2, (ed - id) * sl / 1.2], [-iu / 1.2, (ed - id) * sl / 1.2]]);
      P.box(M.white, -eu, eu, yE - 0.18, yE + 0.04, ed - 0.04, ed + 0.04, 'kb', 1);
      P.pop();
    }
    P.quad(M.tin, [-ix, yR, -iz], [ix, yR, -iz], [ix, yR, iz], [-ix, yR, iz], [0, 1, 0]);
    P.pop();
    if (ph) { const c = wl(f, 0, 0); ph.addBox(c.x, c.z, 2 * hx + 0.2, 2 * hz + 0.2, f.rot, 0, 4.2); }
  }
  // =============================================================================================== the prefab concrete fence with the sliding gate, from the office to the hut
  {
    const f = OF, x0 = f.hx + 0.02, a = wl(HF, -HF.hx, HF.hz - 0.3), la = ((a.x - f.x) * Math.cos(f.rot) - (a.z - f.z) * Math.sin(f.rot)), x1 = la - 0.05;
    // the fence runs along the office-local z = zf; start at the south edge of the north part of the carriageway: the largest zf (nearest the road) whose samples are off the asphalt
    let zf = 3.0;
    const net = ctx.services.streets && ctx.services.streets.net;           // the finished asphalt (parking pockets, fillets) when the streets module exists, else the coarse drivable-road test
    const clear = (x, z) => (net && net.cover ? net.cover(x, z, {}) < -0.75 : !L.isOnRoad(x, z, 1.0));
    for (const cand of [2.6, 2.2, 1.8, 1.4, 1.0, 0.6, 0.2, -0.2, -0.6, -1.0]) { let ok = true; for (let x = x0; x <= x1; x += 1) { const p = wl(f, x, cand); if (!clear(p.x, p.z)) { ok = false; break; } } zf = cand; if (ok) break; }
    const pa = wl(f, x0, zf), pb = wl(f, x1, zf), len = x1 - x0;
    P.push(f.x, 0, f.z, f.rot);
    P.far = 380;
    const H = 2.2, gate0 = 7.2, gate1 = 11.4, n = Math.max(2, Math.round(len / 2.5)), pw = len / n;
    for (let i = 0; i < n; i++) {
      const xa = x0 + i * pw, xb = xa + pw, hasGate = xb > gate0 && xa < gate1;
      if (hasGate) {
        if (xa < gate0) P.box(M.ochre, xa, gate0, 0, H, zf - 0.08, zf + 0.08, 'b', 1.4);
        if (xb > gate1) P.box(M.ochre, gate1, xb, 0, H, zf - 0.08, zf + 0.08, 'b', 1.4);
        continue;
      }
      P.box(M.ochre, xa, xb, 0.35, H, zf - 0.08, zf + 0.08, 'b', 1.4);
      P.box(M.granite, xa, xb, 0, 0.35, zf - 0.09, zf + 0.09, 'b', 1.5);
    }
    // the gate leaf (white sheet) and its rail, between two posts
    P.box(M.white, gate0 + 0.1, gate1 - 0.1, 0.12, H - 0.08, zf - 0.07, zf + 0.07, 'b', 1);
    P.box(M.metal, gate0, gate1 + 1.5, 0.05, 0.12, zf - 0.04, zf + 0.04, '', 1);
    for (let i = 0; i <= n; i++) { const x = x0 + i * pw; P.box(M.ochre, x - 0.14, x + 0.14, 0, H + 0.12, zf - 0.14, zf + 0.14, 'b', 1.4); }
    P.pop();
    if (ph) {
      const mid = wl(f, (x0 + x1) / 2, zf);
      ph.addBox(mid.x, mid.z, len + 0.2, 0.34, f.rot, 0, H);
    }
    K.shared.kosa3.fence = { a: pa, b: pb, zf };
  }
}
