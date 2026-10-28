// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/bridges/foot3.js) for Vasilyevsky-Okrug 7 (docs/vo-br.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7), the rest is verbatim.
// bridges/foot3.js - the Novo-Andreevsky footbridge (Ново-Андреевский мост, 2009; photos refs/bridges2 f01 f02, ru.wikipedia): a single welded span of 30 m (34.8 m overall, 3.3 m wide) of two plate girders
// with a curved lower chord (thin at mid-span, deep at the abutments) joined by an orthotropic deck, mid-grey steel, concrete abutments, a forged railing of a chain of tall loops, four steel torcheres with
// two cream globes each at the entrances; the deck rises 1.25 m over the street level at mid-span (our streets are flat).  Frame / data: sites-vo2.js FOOT (origin = the middle of the OSM deck polygon
// w386219560, +u toward SSW).  The quay opening the environment leaves (the polygon + 1 m) is closed beside the abutments by granite-free concrete wing walls (closeBank).
// NO flags / flagpoles / beacons (user rules).
import { frameOf, toUV, frameBounds } from './sites.js';
import { FOOT, footY } from './sites-vo2.js';
import { closeBank, bankU } from './long.js';
import { torchereFoot } from './sculpt6.js';
import { postBatch } from './knock-posts.js';      // n4spb: the four torcheres are knock records (bridges/knock-posts.js)

export function buildFoot3(env) {
  const { ctx, P, M, rails } = env, sp = FOOT, f = frameOf(sp), T = f.T, L = ctx.L, waterY = env.waterY;
  const LEN = sp.len, HL = LEN / 2, HW = sp.hw, yDeck = footY, slopeOf = (u) => yDeck(u + 0.5) - yDeck(u - 0.5), yb = waterY - 0.45;
  const world = (u, v) => ({ x: f.cx + u * f.c - v * f.s, z: f.cz + u * f.s + v * f.c });
  const B = { id: sp.id, x: f.cx, z: f.cz, yDeck, info: { rails: 0, colliders: 0 }, masts: [] };
  const wA = world(HL + 5, 1.6); B.at = [wA.x, wA.z];
  B.bounds = frameBounds(sp, -HL - 3, HL + 3, -HW - 1, HW + 1, 1.5);
  B.deckAt = (x, z) => { const q = toUV(sp, x, z); return Math.abs(q.v) <= HW + 0.05 && Math.abs(q.u) <= HL + 0.3 ? yDeck(q.u) : null; };
  const steel = M.footSteel, dark = M.footSteelDark, black = M.ironBlack, conc = M.concrete;
  const dg = (u) => 0.48 + 0.97 * Math.pow(Math.abs(u) / HL, 2);           // girder depth under the deck: thin at the crown, deep over the abutments (photos f01 f02)
  const soff = (u) => yDeck(u) - dg(u);

  P.push(f.cx, 0, f.cz, -T);
  // ------------------------------------------------------------------ the two girders, the soffit, the deck
  const n = 30, F = 0.34;                                                   // segments along u; the top flange 0.34 m wide
  for (let i = 0; i < n; i++) {
    const u0 = -HL + LEN * i / n, u1 = -HL + LEN * (i + 1) / n, y0 = yDeck(u0), y1 = yDeck(u1), s0 = soff(u0), s1 = soff(u1);
    for (const sg of [-1, 1]) {
      const v = sg * HW;
      P.quad(steel, [u0, s0, v], [u1, s1, v], [u1, y1 + 0.06, v], [u0, y0 + 0.06, v], [0, 0, sg], [[u0 / 2.4, s0 / 2.4], [u1 / 2.4, s1 / 2.4], [u1 / 2.4, y1 / 2.4], [u0 / 2.4, y0 / 2.4]]);
      P.quad(steel, [u0, y0 + 0.06, v], [u1, y1 + 0.06, v], [u1, y1 + 0.06, v - sg * F], [u0, y0 + 0.06, v - sg * F], [0, 1, 0]);                       // the top flange
      P.quad(steel, [u0, y0 + 0.02, v - sg * F], [u1, y1 + 0.02, v - sg * F], [u1, y1 + 0.06, v - sg * F], [u0, y0 + 0.06, v - sg * F], [0, 0, -sg]);       // the 4 cm riser between the flange and the deck plate
      P.quad(steel, [u0, s0 - 0.0, v], [u1, s1, v], [u1, s1, v - sg * 0.3], [u0, s0, v - sg * 0.3], [0, -1, 0]);                                           // the bottom flange (underside)
      P.quad(dark, [u0, s0 + 0.05, v - sg * 0.3], [u1, s1 + 0.05, v - sg * 0.3], [u1, y1 - 0.1, v - sg * 0.3], [u0, y0 - 0.1, v - sg * 0.3], [0, 0, -sg]);        // the inner web, seen from the deck side below the deck plate (dark)
    }
    P.quad(dark, [u0, s0, -HW], [u1, s1, -HW], [u1, s1, HW], [u0, s0, HW], [0, -1, 0]);                                                                  // the soffit
    P.quad(M.footAsphalt, [u0, y0 + 0.02, -HW + F], [u1, y1 + 0.02, -HW + F], [u1, y1 + 0.02, HW - F], [u0, y0 + 0.02, HW - F], [0, 1, 0], [[u0 / 2.4, -HW / 2.4], [u1 / 2.4, -HW / 2.4], [u1 / 2.4, HW / 2.4], [u0 / 2.4, HW / 2.4]]);
  }
  for (const sg of [-1, 1]) {                                                // the end plates of the girders
    const ue = sg * HL, y = yDeck(ue), s = soff(ue);
    P.quad(steel, [ue, s, -HW], [ue, s, HW], [ue, y + 0.06, HW], [ue, y + 0.06, -HW], [sg, 0, 0]);
  }
  // ------------------------------------------------------------------ the concrete abutments (a block under each girder end, cheeks flush with the street at the sides)
  const abut = [];
  for (const sg of [-1, 1]) {
    const u0 = sg * (HL - 1.9), u1 = sg * (HL + 0.5), ua = Math.min(u0, u1), ub = Math.max(u0, u1);
    P.box(conc, ua, ub, yb, soff(sg * HL) + 0.02, -HW - 0.05, HW + 0.05, 'b', 2.2);
    for (const sv of [-1, 1]) P.box(conc, ua, ub, yb, 0.02, Math.min(sv * (HW + 0.05), sv * 2.95), Math.max(sv * (HW + 0.05), sv * 2.95), 'b', 2.2);
    P.box(M.coping, ua - 0.04, ub + 0.04, -0.02, 0.04, -2.99, 2.99, 'b', 1.4);
    abut.push({ ua, ub, sg });
  }
  // ------------------------------------------------------------------ the railing: a chain of loops between thin posts, a plain handrail on top
  const RA = HL - 0.35, nb = Math.round(2 * RA / 2.0), bw = 2 * RA / nb;
  for (const sg of [-1, 1]) {
    const v = sg * (HW - 0.1);
    for (let i = 0; i < nb; i++) {
      const ua = -RA + bw * i, w = world(ua + 0.05, v);
      rails.add({ kind: 'ovalchain', hex: '#1c2024', x: w.x, y: yDeck(ua) + 0.08, z: w.z, rotY: -T, roll: Math.atan(slopeOf(ua + bw / 2)), len: bw - 0.1, h: 1.02 }); B.info.rails++;
    }
    for (let i = 0; i <= nb; i++) { const u = -RA + bw * i, y = yDeck(u) + 0.06; P.box(black, u - 0.05, u + 0.05, y, y + 1.12, v - 0.05, v + 0.05, 'b', 1); P.box(black, u - 0.08, u + 0.08, y + 1.1, y + 1.14, v - 0.08, v + 0.08, 'b', 1); }
    for (let i = 0; i < nb; i++) {
      const ua = -RA + bw * i, ub = ua + bw, ya = yDeck(ua) + 1.18, yb2 = yDeck(ub) + 1.18;
      P.quad(black, [ua, ya, v - 0.045], [ub, yb2, v - 0.045], [ub, yb2, v + 0.045], [ua, ya, v + 0.045], [0, 1, 0]);
      P.quad(black, [ua, ya - 0.06, v + 0.045], [ub, yb2 - 0.06, v + 0.045], [ub, yb2, v + 0.045], [ua, ya, v + 0.045], [0, 0, 1]);
      P.quad(black, [ub, yb2 - 0.06, v - 0.045], [ua, ya - 0.06, v - 0.045], [ua, ya, v - 0.045], [ub, yb2, v - 0.045], [0, 0, -1]);
    }
  }
  // ------------------------------------------------------------------ the four torcheres at the entrances (street level, beside the path)
  const torches = [], KP = postBatch('brg-' + sp.id);
  for (const su of [-1, 1]) for (const sv of [-1, 1]) {
    const u = su * (HL + 1.7), v = sv * 2.5;
    const w = world(u, v); KP.add('torchere', (Q) => torchereFoot(Q, M, 0, 0, 0, 0, { h: 4.3 }), { x: w.x, y: 0, z: w.z, rotY: -T }, { x: w.x, z: w.z, r: 0.22, y0: -0.5, y1: 4.4 }, 4.3); B.masts.push({ x: w.x, z: w.z, y: 0, h: 4.3, kind: 'torchere' }); torches.push(w);      // n4spb: a knock record, drawn by colliders()
  }
  // ------------------------------------------------------------------ the quay opening beside the abutments: concrete wings along the bank line + a collider (closeBank, as blag.js)
  const openLen = (sg, u0, dir) => {
    const zs = env.zones || []; if (!zs.length) return 1.4;
    let last = -1;
    for (let k = 0; k <= 16; k++) { const v = sg * (HW + k * 0.5), ub = bankU(L, sp, v, u0, dir); if (ub === null) break; const w = world(ub - dir * 0.25, v); if (zs.some((z) => z.test(w.x, w.z, 0.15))) last = k; }
    return last < 0 ? 1.4 : Math.min(8, Math.max(1.4, (last + 1) * 0.5 + 1.0));
  };
  const wings = [];
  const bank = sp.bank;
  for (const [dir, u0] of [[1, bank[0]], [-1, bank[1]]]) for (const sg of [-1, 1]) { const len = openLen(sg, u0, dir); wings.push({ u: u0, dir, sg, len }); closeBank({ site: sp, P, M, L, u: u0, dir, sg, v0: HW + 0.05, len, yTop: 0.05, yb, mat: conc, parapet: M.concrete, collide: false }); }
  P.pop();
  B.info.wings = wings.map((w) => w.len);

  // ------------------------------------------------------------------ colliders
  B.colliders = () => {
    const ph = ctx.physics, rampRot = Math.atan2(f.c, f.s), m = Math.ceil((LEN + 0.6) / 4);
    for (let i = 0; i < m; i++) { const u0 = -HL - 0.3 + (LEN + 0.6) * i / m, u1 = -HL - 0.3 + (LEN + 0.6) * (i + 1) / m, w = world((u0 + u1) / 2, 0); ph.addWalkRamp(w.x, w.z, 2 * HW - 0.1, u1 - u0 + 0.04, rampRot, yDeck(u0), yDeck(u1), 2.5); B.info.colliders++; }
    for (const sg of [-1, 1]) {
      // n4spb (docs/AREAS.md 13.7): the 7 m solid rail boxes (from the bed) are a request to the fence batch (rails.wall): the railing panels have their own breakable bays, a ghost bay stands only where no panel does
      const a = world(-HL, sg * (HW - 0.1)), b = world(HL, sg * (HW - 0.1));
      rails.wall({ x0: a.x, z0: a.z, x1: b.x, z1: b.z, th: 0.28, y0: Math.min(yDeck(-HL), yDeck(HL)) - 0.8, y1: yDeck(0) + 1.2, y: Math.min(yDeck(-HL), yDeck(HL)) - 0.8 }); B.info.colliders++;
    }
    for (const a of abut) for (const sv of [-1, 1]) { const w = world((a.ua + a.ub) / 2, sv * (HW + 0.6)); ph.addBox(w.x, w.z, a.ub - a.ua, 1.0, -T, -6, 0.3); B.info.colliders++; }
    { const r = KP.flush(ctx); B.info.colliders += r.colliders; B.extraTris = (B.extraTris || 0) + r.tris; }      // the four torcheres: colliders + knock records
    void torches;
    for (const w of wings) B.info.colliders += closeBank({ site: sp, L, ph, ctx, u: w.u, dir: w.dir, sg: w.sg, v0: HW - 0.3, len: w.len, yTop: 0.05, draw: false });
  };
  return B;
}
