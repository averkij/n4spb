// Provenance: copied from the source project 102_3d_piter, commit 0568f7af (src/world/bridges/petrovsky/serny.js), for Dekabristov Island (docs/gdm-B.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7):
// the four cobra lamps are knock posts (bridges/knock-posts.js), the two 0.28 m railing boxes are gone (the tube railing is a row of knock bays: rails.add), the granite wings beside the abutments get breakable ghost colliders
// (closeBank with ctx); the environment's quay boxes that poke into the pavement are removed only where they are no knock record. Solid on purpose: the abutment faces (structure), the deck walk ramp (the floor).
// bridges/petrovsky/serny.js - the Serny Bridge (Серный мост, 2018, named 18 June 2019): a short two-lane beam bridge over the channel between Serny Island and the end of the Makarova embankment on Petrovsky Island.
//   Facts [W ru.wikipedia "Серный мост (Серный остров)"]: 18.7 m long, 13 m wide, 2 lanes, reinforced-concrete beams, granite-faced abutments, railing 1.1 m; OSM w588474209 (the road way, 15 m), w589319945 (the deck polygon
//   14.5 x 13.9 m at (-4930, -2551)), footways w589319941 / w589319943 on both sides.  No Commons photograph exists [?]: the look follows the other 2018-19 bridges of the district (pale concrete fascia, galvanised
//   tube railing, plain grey cobra lamp standards, granite abutment faces) and is marked [E] in the dossier.
//   Frame: origin = the middle of the water gap on the axis of w588474209, +u toward the north-east (7.6, -13 per 15 m), +v right of travel.  The deck is at street level +0.05 and flat; the channel is crossed by
//   a 0.9 m deep girder (clearance ~2.6 m over the marina channel); a granite abutment face stands at each bank line (found at build time), the quay opening beside the deck is closed with granite wings (closeBank).
//   Own file: bridges/petrovsky/serny.js.  NO flags / flagpoles (user rules).
import { frameOf, toUV, toWorld, frameBounds } from '../sites.js';
import { closeBank, bankU } from '../long.js';
import { lampCobra } from '../sculpt4.js';
import { postBatch } from '../knock-posts.js';      // n4spb: the lamps are knock posts

const A = [-4934.4, -2544.7], Bp = [-4926.8, -2557.7], D = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), UX = (Bp[0] - A[0]) / D, UZ = (Bp[1] - A[1]) / D;
const MID = 33.5;                                                          // the water gap is s 26 .. 41 on the axis that starts 25 m before the OSM way (measured in the environment)
export const SERNY = {
  id: 'serny-bridge', name: 'Серный мост', nameEn: 'Serny Bridge', ww: 'neva',
  cx: A[0] - UX * 25 + UX * MID, cz: A[1] - UZ * 25 + UZ * MID, b: Math.atan2(UZ, UX) * 180 / Math.PI + 90, len: 18.7, hw: 6.5, road: 3.5, at: [-4930, -2551],
  osm: ['w589319945', 'w588474209', 'w589319941', 'w589319943'],
};
const HL = SERNY.len / 2, HW = SERNY.hw, ROAD = SERNY.road, PAVE = 0.15, Y0 = 0.05, GIR = 0.9;

export function buildSerny(env) {
  const { ctx, P, M, rails } = env, sp = SERNY, f = frameOf(sp), T = f.T, L = ctx.L, TM = ctx.mat.toon, waterY = env.waterY;
  const world = (u, v) => toWorld(sp, u, v);
  const conc = TM('#c3c5c0', { paint: 0.06, name: 'brg-serny-concrete' });             // pale beam fascia
  const B = { id: sp.id, x: f.cx, z: f.cz, info: { rails: 0, colliders: 0 }, masts: [], at: sp.at };
  B.bounds = frameBounds(sp, -HL - 4, HL + 4, -HW - 4, HW + 4, 2);
  B.yDeck = () => Y0;
  B.deckAt = (x, z) => { const q = toUV(sp, x, z); return Math.abs(q.v) <= HW + 0.05 && Math.abs(q.u) <= HL + 0.3 ? Y0 : null; };
  const wetAt = (u, v = 0) => { const w = world(u, v); return !!(L.waterwayAt ? L.waterwayAt(w.x, w.z) : L.inRiver(w.x, w.z)); };
  let bank0 = -7.5, bank1 = 7.5;                                                       // the bank lines along the axis (first / last wet sample)
  { let a = null, b = null; for (let u = -HL - 8; u <= HL + 8; u += 0.25) if (wetAt(u)) { if (a === null) a = u; b = u; } if (a !== null) { bank0 = a; bank1 = b; } }
  B.info.bank = [+bank0.toFixed(2), +bank1.toFixed(2)];
  const yb = waterY - 0.2;
  P.push(f.cx, 0, f.cz, -T);
  // ---- deck: asphalt, kerbs, pavements, centre line, the pale beam fascia with its cornice, the soffit
  P.quad(M.asphalt, [-HL, Y0, -ROAD], [HL, Y0, -ROAD], [HL, Y0, ROAD], [-HL, Y0, ROAD], [0, 1, 0], [[-HL / 4, -ROAD / 4], [HL / 4, -ROAD / 4], [HL / 4, ROAD / 4], [-HL / 4, ROAD / 4]]);
  for (const sg of [-1, 1]) {
    const va = sg * ROAD, vb = sg * (HW - 0.05);
    P.quad(M.kerb, [-HL, Y0, va], [HL, Y0, va], [HL, Y0 + PAVE, va], [-HL, Y0 + PAVE, va], [0, 0, -sg]);
    P.quad(M.footAsphalt, [-HL, Y0 + PAVE, va], [HL, Y0 + PAVE, va], [HL, Y0 + PAVE, vb], [-HL, Y0 + PAVE, vb], [0, 1, 0], [[-HL / 2.4, va / 2.4], [HL / 2.4, va / 2.4], [HL / 2.4, vb / 2.4], [-HL / 2.4, vb / 2.4]]);
    P.quad(conc, [-HL, Y0 - GIR, sg * (HW + 0.1)], [HL, Y0 - GIR, sg * (HW + 0.1)], [HL, Y0 + PAVE, sg * (HW + 0.1)], [-HL, Y0 + PAVE, sg * (HW + 0.1)], [0, 0, sg]);
    P.quad(conc, [-HL, Y0 + PAVE, sg * (HW + 0.1)], [HL, Y0 + PAVE, sg * (HW + 0.1)], [HL, Y0 + PAVE, sg * (HW - 0.05)], [-HL, Y0 + PAVE, sg * (HW - 0.05)], [0, 1, 0]);
  }
  P.quad(M.fasTuchkovDark, [-HL, Y0 - GIR, -HW - 0.1], [-HL, Y0 - GIR, HW + 0.1], [HL, Y0 - GIR, HW + 0.1], [HL, Y0 - GIR, -HW - 0.1], [0, -1, 0]);
  for (const u of [-HL, HL]) P.quad(conc, [u, Y0 - GIR, -HW - 0.1], [u, Y0 - GIR, HW + 0.1], [u, Y0 + PAVE, HW + 0.1], [u, Y0 + PAVE, -HW - 0.1], [Math.sign(u), 0, 0]);
  for (const sg of [-1, 1]) P.quad(M.mark, [-HL + 1, Y0 + 0.03, sg * 0.1 - 0.05], [HL - 1, Y0 + 0.03, sg * 0.1 - 0.05], [HL - 1, Y0 + 0.03, sg * 0.1 + 0.05], [-HL + 1, Y0 + 0.03, sg * 0.1 + 0.05], [0, 1, 0]);
  // ---- abutments: a granite face under the deck at each bank line (to the bed), 1.3 m deep
  for (const [ub, dir] of [[bank0, 1], [bank1, -1]]) {
    const ua = dir > 0 ? ub - 0.05 : ub - 1.3, uc = dir > 0 ? ub + 1.3 : ub + 0.05;
    P.box(M.graniteGrey, ua, uc, yb - 0.1, Y0 - GIR + 0.02, -HW + 0.05, HW - 0.05, 'b', 2.2);
  }
  // ---- the railing (1.1 m, galvanised tubes) and four lamp standards
  const nb = Math.round(2 * HL / 2.2), bw = 2 * HL / nb;
  for (const sg of [-1, 1]) for (let i = 0; i < nb; i++) { const ua = -HL + bw * i, w = world(ua + 0.03, sg * (HW - 0.14)); rails.add({ kind: 'hpipes', hex: '#c9ced1', x: w.x, y: Y0 + PAVE, z: w.z, rotY: -T, roll: 0, len: bw - 0.06 }); B.info.rails++; }
  const lampPts = [];
  const KP = postBatch('brg-serny');      // n4spb: the lamp standards are knock posts (spot = the foot in the world; the frame turns by -T, the post by 0 or pi in it)
  for (const sg of [-1, 1]) for (const u of [-HL + 2.2, HL - 2.2]) { const v = sg * (HW - 0.9), w = world(u, v); KP.add('cobra', (Q) => lampCobra(Q, M, 0, 0, 0, 0, { h: 9, mat: M.steel }), { x: w.x, y: Y0 + PAVE, z: w.z, rotY: -T + (sg > 0 ? Math.PI : 0) }, { x: w.x, z: w.z, r: 0.22, y0: -0.5, y1: 6 }, 9); lampPts.push(w); B.masts.push({ x: w.x, y: Y0 + PAVE, z: w.z, h: 9, kind: 'cobra' }); }
  // ---- the quay opening beside the abutments: granite wings along the bank line (closeBank)
  const wings = [];
  for (const [dir, u0] of [[1, bank0], [-1, bank1]]) for (const sg of [-1, 1]) { const len = 5.0; wings.push({ u: u0, dir, sg, len }); closeBank({ site: sp, P, M, L, u: u0, dir, sg, v0: HW + 0.05, len, yTop: 0.05, yb, mat: M.granitePink || M.granite, parapet: M.parapetPink || M.parapet, collide: false }); }
  P.pop();
  B.info.buckets = P.b.size; B.info.tris = P.tris;
  if (ctx.services) ctx.services.sernyBridge = { info: B.info, spec: sp };
  B.colliders = () => {
    const ph = ctx.physics, w = world(0, 0), rampRot = Math.atan2(f.c, f.s);
    // the environment's quay-wall boxes (0.5 m thick, y -8 .. 1.25 / 1.3) that stand on the deck: the banks are skewed to the axis, so a bank piece beside the zone of the mapped way pokes into the pavement (measured: u 6.9, v 4.85)
    for (const it of ph.items.slice()) { if (it.type !== 'box' || it.y0 > -7 || it.y1 > 1.35 || it.hd * 2 > 0.6 || it.hw * 2 > 4 || (it.source && it.source.knock)) continue; const q = toUV(sp, it.cx, it.cz); if (Math.abs(q.u) <= HL + 0.3 && Math.abs(q.v) <= HW + 0.3) { ph.remove(it); B.info.quayRemoved = (B.info.quayRemoved || 0) + 1; } }      // n4spb: not a knock record's collider
    ph.addWalkRamp(w.x, w.z, 2 * HW - 0.1, 2 * HL + 0.6, rampRot, Y0, Y0, 2.5); B.info.colliders++;
    // n4spb: no railing boxes (the tube railing above is a row of knock bays), the lamps are knock posts, the wings' colliders are breakable ghost bays (ctx)
    { const k = KP.flush(ctx); B.info.colliders += k.colliders; B.extraTris = (B.extraTris || 0) + k.tris; }
    for (const q of wings) B.info.colliders += closeBank({ site: sp, L, ph, ctx, u: q.u, dir: q.dir, sg: q.sg, v0: HW - 0.3, len: q.len, yTop: 0.05, draw: false });
  };
  void bankU;
  return B;
}
