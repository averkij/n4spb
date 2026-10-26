// Provenance: copied verbatim from 102_3d_piter commit 0568f7af (src/world/bridges/blag.js) for Admiralty-Haymarket (docs/AREAS.md 15.2); this line is the only change.
// bridges/blag.js - the Blagoveshchensky Bridge (Благовещенский мост, 1850 Kerbedz / Briullov, 1936-39 beam bridge, 2005-07 reconstruction; 1855-1918 Nikolaevsky, 1918-2007 Lieutenant Schmidt Bridge) over the
// Bolshaya Neva, COMPLETE from the Admiralty (Truda Square / English embankment) bank to the Vasilievsky Island bank (Trezzini Square): 334.7 m, 37.4 m between the railings, ten openings 37.6 + 41.3 + 47.1 |
// bascule 25.56 + 25.56 | 47.1 + 41.3 + 37.6 | the old 5.91 m pier block | 25.7 m, pale sage-grey steel girders (a straight fascia plate, an X-lattice web and a curved haunched lower chord that is deep over the
// piers), pink granite round-nosed piers with granite tumbas that carry the 22 historic standards, two massive bascule piers with round balconies and the two glazed control pavilions (downstream side),
// the cast railing with sea-horses and a trident (hippocamp, rails2.js), 2 x 15 m roadway + a 1.4 m median + two 3 m pavements, a deck that rises 3.4 m to the bascule (shown CLOSED: summer day, no
// lifting, no warning bells), wing walls that close the quay beside both ends.  Frame / data: sites-vo.js BLAG (origin = the south abutment, +u toward Vasilievsky Island).
// Dossier docs/research/vo-roster-bridges.md 2.1 + docs/research/vo-bridges-wave1.md; photos refs/bridges b01 b02 b03 b04 b05 b07 b10 b11 b12 b13 (SP scratchpad).  NO flags, no flagpoles on the piers or the standards.
// REVIEW 2026-10-07 (review-bridges, photos refs/review-bridges r01 .. r12): the girder soffit is an ARCH (HAUNCH_EXP, deeper haunches beside the bascule piers, thinner fascia plate so that the lattice reads), the bascule piers
// are a granite plinth under PAINTED CONCRETE drums with pale balcony walls (they were pink granite to the deck), the ice-breaker prows are granite (were near-black), the toothed steel plate of the bascule joint is drawn
// across the carriageways and pavements, and the abutment / wing faces stop just under the water line (no outline of an underwater edge shows through the water).
import * as THREE from 'three';
import { frameOf, toUV, frameBounds } from './sites.js';
import { BLAG, blagY } from './sites-vo.js';
import { closeBank, bankU } from './long.js';
import { lampBlag, pavilionBlag, tumba } from './sculpt5.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const HAUNCH_EXP = 1.8;                                                 // shape of the girder soffit between a support and mid-span: depth = dMid + (dSup - dMid) * q^HAUNCH_EXP (1 = straight V, 2+ = arch)

export function buildBlag(env) {
  const { ctx, P, M, rails } = env, sp = BLAG, f = frameOf(sp), T = f.T, waterY = env.waterY, L = ctx.L;
  const LEN = sp.len, HW = sp.hw, HV = HW + 0.35, ROAD = sp.road, KW = sp.kerbW, KH = sp.kerbH, MED = sp.median, PAVE = 0.15, yb = waterY - 0.45, U0 = -0.4, U1 = LEN + 0.4, yPier = waterY - 0.45;   // (piers stop just under the water line: the toon outline of an underwater footing shows through the water)
  const yDeck = blagY, slopeOf = (u) => yDeck(u + 0.5) - yDeck(u - 0.5);
  const world = (u, v) => ({ x: f.cx + u * f.c - v * f.s, z: f.cz + u * f.s + v * f.c });
  const B = { id: sp.id, x: world(LEN / 2, 0).x, z: world(LEN / 2, 0).z, yDeck, info: { rails: 0, colliders: 0 }, masts: [], span: { a: world(0, 0), b: world(LEN, 0), hw: HW } };
  B.at = world(105, HW - 1.4);                                           // photo spot: the upstream pavement before the bascule pier
  B.bounds = frameBounds(sp, U0, U1, -HW - 0.3, HW + 0.3, 1.5);
  B.anchors = [world(30, 0), world(LEN - 30, 0)];                        // (traffic prefilters deckY by 190 m round a list entry)
  B.deckAt = (x, z) => { const q = toUV(sp, x, z); return Math.abs(q.v) <= HW + 0.3 && q.u >= U0 && q.u <= U1 ? yDeck(clamp(q.u, 0, LEN)) : null; };
  const gran = M.granitePink, granD = M.graniteDark, par = M.parapetPink, fas = M.fasBlag, dark = M.fasBlagDark, rib = M.ribBlag, lat = M.latticeBlag;

  // ------------------------------------------------------------------ the openings
  const SUP = sp.sup, SP = [];
  for (let k = 0; k < sp.spans.length; k++) SP.push({ ...sp.spans[k], a: SUP[k], b: SUP[k + 1], k });
  const F = 0.62, RIB = 0.45;                                            // the straight fascia plate under the deck edge; the thickness of the rolled lower chord [E]
  /** girder depth under the deck edge at u (deep over the supports, thin at mid-span) */
  const depthAt = (s, u) => { const t = clamp((u - s.a) / (s.b - s.a), 0, 1), q = Math.abs(2 * t - 1); return s.dMid + (s.dSup - s.dMid) * Math.pow(q, HAUNCH_EXP); };   // (review 2026-10-07: q^1.05 was a straight V; the real lower chord is a curved arch rib, flat at mid-span and springing steeply from the pier: photos b10 b12 r10)
  const yTopOf = (u) => yDeck(u) - 0.2;                                  // the underside of the cornice
  /** a quad strip along u between lo(u) and hi(u) on the plane v, facing sg (uv in metres / tile) */
  const strip = (mat, lo, hi, a, b, v, sg, tile = 2.4, n = 0) => {
    n = n || Math.max(2, Math.round((b - a) / 1.7));
    for (let i = 0; i < n; i++) {
      const u0 = a + (b - a) * i / n, u1 = a + (b - a) * (i + 1) / n, l0 = lo(u0), l1 = lo(u1), h0 = hi(u0), h1 = hi(u1);
      if (h0 - l0 < 0.004 && h1 - l1 < 0.004) continue;
      P.quad(mat, [u0, l0, v], [u1, l1, v], [u1, h1, v], [u0, h0, v], [0, 0, sg], [[u0 / tile, l0 / tile], [u1 / tile, l1 / tile], [u1 / tile, h1 / tile], [u0 / tile, h0 / tile]]);
    }
  };
  /** half-elliptic cylinder beyond the line v = sg * vc (radius R along u, rv across), flat top: the round nose of a pier */
  const nose = (mat, pm, sg, vc, R, rv, y0, y1, seg = 12, cap = M.coping) => {
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * i / seg, a1 = Math.PI * (i + 1) / seg, p0 = [pm - Math.cos(a0) * R, sg * (vc + Math.sin(a0) * rv)], p1 = [pm - Math.cos(a1) * R, sg * (vc + Math.sin(a1) * rv)], am = (a0 + a1) / 2;
      P.quad(mat, [p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]], [-Math.cos(am), 0, sg * Math.sin(am)], [[a0 * R / 2.2, y0 / 2.2], [a1 * R / 2.2, y0 / 2.2], [a1 * R / 2.2, y1 / 2.2], [a0 * R / 2.2, y1 / 2.2]]);
      if (cap) P.fan(cap, [[pm, y1, sg * vc], [p0[0], y1, p0[1]], [p1[0], y1, p1[1]]], [0, 1, 0]);
    }
  };

  P.push(f.cx, 0, f.cz, -T);
  // ------------------------------------------------------------------ girders: per opening and face the fascia plate, the X lattice, the rolled lower chord; across: the soffit and the dark webs seen through the lattice
  for (const s of SP) {
    if (s.kind === 'block') continue;
    const a = s.a, b = s.b, plain = s.kind !== 'haunch';
    const yl = (u) => yTopOf(u) - depthAt(s, u);                         // the soffit line
    const pb = (u) => Math.max(yTopOf(u) - F, yl(u));                    // the bottom of the straight fascia plate (it never reaches below the soffit)
    const plateLo = plain ? yl : pb;
    for (const sg of [-1, 1]) {
      const vf = sg * (HW + 0.02);
      strip(fas, plateLo, yTopOf, a, b, vf, sg, 2.6);                    // the plate (the whole girder face of a plain span)
      if (!plain) {
        strip(rib, yl, (u) => Math.min(yl(u) + RIB, pb(u)), a, b, vf + sg * 0.05, sg, 2.6);        // the rolled lower chord stands 5 cm proud of the lattice plane
        strip(lat, (u) => Math.min(yl(u) + RIB, pb(u)), pb, a, b, vf - sg * 0.02, sg, 1.2);         // the X lattice (alpha cut)
        strip(dark, yl, pb, a, b, sg * (HW - 1.3), sg, 2.6);              // the inner web seen through the openings
      } else {
        const um = (a + b) / 2;
        if (s.kind === 'bascule') P.box(dark, um - 0.07, um + 0.07, yl(um) + 0.02, yTopOf(um), Math.min(vf, vf + sg * 0.1), Math.max(vf, vf + sg * 0.1), 'b', 1);   // the joint of the two leaves
        const ns = Math.round((b - a) / 3.4);
        for (let i = 1; i < ns; i++) { const u = a + (b - a) * i / ns; P.box(rib, u - 0.07, u + 0.07, yl(u) + 0.05, yTopOf(u) - 0.1, Math.min(vf, vf + sg * 0.08), Math.max(vf, vf + sg * 0.08), 'b', 1); }   // vertical stiffeners
        strip(rib, (u) => yl(u) - 0.0, (u) => yl(u) + 0.14, a, b, vf + sg * 0.05, sg, 2.6);        // the bottom flange
      }
    }
    const n = Math.max(4, Math.round((b - a) / 2.2));
    for (let i = 0; i < n; i++) { const u0 = a + (b - a) * i / n, u1 = a + (b - a) * (i + 1) / n; P.quad(dark, [u0, yl(u0), -HW - 0.16], [u1, yl(u1), -HW - 0.16], [u1, yl(u1), HW + 0.16], [u0, yl(u0), HW + 0.16], [0, -1, 0]); }
  }
  // the deck cornice (both faces, the whole length): a rolled edge of the fascia
  { const nc = Math.ceil((U1 - U0) / 3);
    for (const sg of [-1, 1]) for (let i = 0; i < nc; i++) {
      const u0 = U0 + (U1 - U0) * i / nc, u1 = U0 + (U1 - U0) * (i + 1) / nc, y0 = yDeck(u0), y1 = yDeck(u1), v = sg * HW, cm = rib;
      P.quad(cm, [u0, y0 - 0.2, v + sg * 0.16], [u1, y1 - 0.2, v + sg * 0.16], [u1, y1 + PAVE, v + sg * 0.16], [u0, y0 + PAVE, v + sg * 0.16], [0, 0, sg]);
      P.quad(cm, [u0, y0 + PAVE, v + sg * 0.16], [u1, y1 + PAVE, v + sg * 0.16], [u1, y1 + PAVE, v - sg * 0.3], [u0, y0 + PAVE, v - sg * 0.3], [0, 1, 0]);
      P.quad(cm, [u0, y0 - 0.2, v + sg * 0.16], [u1, y1 - 0.2, v + sg * 0.16], [u1, y1 - 0.2, v], [u0, y0 - 0.2, v], [0, -1, 0]);
    } }

  // ------------------------------------------------------------------ piers (pink granite): round-nosed, the bascule piers with balconies; tumbas over the slim piers carry the standards
  const tumbas = [], towers = [];
  for (const [pa, pb2, kind] of sp.piers) {
    const pm = (pa + pb2) / 2, hu = (pb2 - pa) / 2, yDk = yDeck(pm), yT = yDk - 0.2, deckTop = yDk + PAVE;
    if (kind === 'tower') {
      // (review 2026-10-07: photos b12 / r07 / r10 show the bascule piers as a granite plinth about 2.3 m high under PAINTED CONCRETE of the sage-grey of the girders, not granite to the deck: M.pierConcrete was defined and unused)
      const yG = waterY + 2.3, conc = M.pierConcrete || gran;
      P.box(gran, pa, pb2, yPier, yG, -HV, HV, 'tb', 2.2);
      P.box(conc, pa, pb2, yG, yT - 0.05, -HV, HV, 'tb', 2.2);
      for (const sg of [-1, 1]) {
        // measured on the OSM deck polygon r3284878 in this frame: UPSTREAM (+v) a straight block to v 22.0 and a round balcony of radius 4.9 out to v 26.9 (u 121.5 .. 131.2 and 172.8 .. 182.2);
        // DOWNSTREAM (-v) only a shallow bulge to v -21.6.  The control pavilions stand on the big upstream balconies.
        const up = sg > 0, vc = up ? 22.0 : 19.9, R = hu, rv = up ? 4.9 : 1.7, ve = sg * HV;
        if (vc > HV + 0.05) {                                                                         // the straight block between the deck edge and the balcony circle (solid parapet on top)
          P.box(gran, pa, pb2, yPier, yG, Math.min(ve, sg * vc), Math.max(ve, sg * vc), 'tb', 2.2);
          P.box(conc, pa, pb2, yG, deckTop - 0.02, Math.min(ve, sg * vc), Math.max(ve, sg * vc), 'tb', 2.2);
          P.box(M.pavBlag, pa, pb2, deckTop - 0.02, deckTop + 0.95, Math.min(ve, sg * vc), Math.max(ve, sg * vc), 'b', 2.2);
        }
        nose(gran, pm, sg, vc, R + 0.2, rv + 0.2, yPier, waterY + 1.0, 14, null);                    // the wider plinth at the water
        nose(gran, pm, sg, vc, R, rv, waterY + 1.0, yG, 14, null);                                   // the granite plinth
        nose(conc, pm, sg, vc, R, rv, yG, deckTop - 0.02, 14, null);                                 // the painted concrete drum
        nose(M.coping, pm, sg, vc, R + 0.16, rv + 0.16, deckTop - 1.7, deckTop - 1.4, 14, M.coping); // the cornice ring
        nose(M.pavBlag, pm, sg, vc, R, rv, deckTop - 0.02, deckTop + 0.95, 14, M.coping);            // the solid balcony parapet (pale painted, photo b12)
        towers.push({ pm, sg, vc, rv, up });
      }
    } else {
      const vc = HV - 2.1, rv = 2.5;
      P.box(gran, pa, pb2, yPier, yT - 0.05, -vc, vc, 'tb', 2.2);
      for (const sg of [-1, 1]) {
        nose(gran, pm, sg, vc, hu + 0.25, rv + 0.25, yPier, waterY + 1.2, 12, null);                    // the plinth ring
        nose(gran, pm, sg, vc, hu, rv, waterY + 1.2, yT, 12, M.coping);
        nose(M.coping, pm, sg, vc, hu + 0.1, rv + 0.1, yT - 0.4, yT - 0.18, 12, null);               // a string course under the top
        // the ice-breaker prow on the upstream (+v) nose: a sloped wedge from the water line down to a point (the river runs from the east)
        if (sg > 0) {
          const tip = vc + rv + 0.9, y1 = waterY + 1.2, y0 = waterY - 0.2;
          P.quad(gran, [pm - 0.1, y0, tip], [pm + 0.1, y0, tip], [pm + hu * 0.8, y1, vc + rv * 0.85], [pm - hu * 0.8, y1, vc + rv * 0.85], [0, 0.6, 0.8]);
          P.fan(gran, [[pm - 0.1, y0, tip], [pm - hu * 0.8, y1, vc + rv * 0.85], [pm - hu * 0.55, y0, vc + rv * 0.5]], [-0.8, 0, 0.3]);
          P.fan(gran, [[pm + 0.1, y0, tip], [pm + hu * 0.8, y1, vc + rv * 0.85], [pm + hu * 0.55, y0, vc + rv * 0.5]], [0.8, 0, 0.3]);
        }
        if (kind === 'slim') {                                                                       // the granite tumba over the pier head at the railing line (the standard stands on it)
          const tv = sg * (HW + 0.05), top = tumba(P, M, pm, yT - 0.02, tv, 1.35, deckTop + 1.12 - (yT - 0.02), gran);
          tumbas.push({ u: pm, v: tv, top, sg });
        }
      }
    }
  }
  // the abutments: granite faces under the deck at both bank lines (the quay of the environment stands beside them)
  for (const [uu, nx] of [[0, 1], [LEN, -1]]) P.quad(gran, [uu + nx * 0.1, yb, -HV], [uu + nx * 0.1, yb, HV], [uu + nx * 0.1, yTopOf(uu), HV], [uu + nx * 0.1, yTopOf(uu), -HV], [nx, 0, 0], [[-HV / 2.2, yb / 2.2], [HV / 2.2, yb / 2.2], [HV / 2.2, 0], [-HV / 2.2, 0]]);
  // the Kryukov canal: its last reach runs in a pipe under Truda Square (docs/research/sw-canals-bridges.md 2.2) and enters the Neva at the Blagoveshchensky Bridge: a round-arched granite portal in the quay
  // wall of the bay west of the south abutment (the baked Neva polygon steps back there: the bank stands at u -6.0 for v -50 .. -34, 8 m behind the line of the abutment).  [?] The exact place of the mouth is not mapped.
  { const pc = -41.5, pw = 3.4, ub = bankU(L, sp, pc, -6, 1);
    if (ub !== null) {
      const pu = ub + 0.14, yB = waterY - 0.3, yS = waterY + 2.5, rise = 1.0, nA = 14, arc = [];
      for (let i = 0; i <= nA; i++) { const a = Math.PI * i / nA; arc.push([pc + Math.cos(a) * pw, yS + Math.sin(a) * rise]); }
      P.quad(M.blagVoid, [pu, yB, pc - pw], [pu, yB, pc + pw], [pu, yS, pc + pw], [pu, yS, pc - pw], [1, 0, 0]);
      for (let i = 0; i < nA; i++) P.fan(M.blagVoid, [[pu, yS, pc], [pu, arc[i][1], arc[i][0]], [pu, arc[i + 1][1], arc[i + 1][0]]], [1, 0, 0]);
      for (let i = 0; i < nA; i++) { const a0 = arc[i], a1 = arc[i + 1], o0 = [pc + (a0[0] - pc) * 1.13, yS + (a0[1] - yS) * 1.13 + 0.25], o1 = [pc + (a1[0] - pc) * 1.13, yS + (a1[1] - yS) * 1.13 + 0.25];
        P.quad(M.voussoir, [pu + 0.05, a0[1], a0[0]], [pu + 0.05, a1[1], a1[0]], [pu + 0.05, o1[1], o1[0]], [pu + 0.05, o0[1], o0[0]], [1, 0, 0], [[i * 0.5, 0], [i * 0.5 + 0.5, 0], [i * 0.5 + 0.5, 0.4], [i * 0.5, 0.4]]); }
      for (const sgp of [-1, 1]) P.quad(M.voussoir, [pu + 0.05, yB, pc + sgp * pw], [pu + 0.05, yS, pc + sgp * pw], [pu + 0.05, yS, pc + sgp * (pw + 0.5)], [pu + 0.05, yB, pc + sgp * (pw + 0.5)], [1, 0, 0]);
    }
  }
  // pink granite end pedestals at the four deck corners (the railing ends on them, photo b13)
  const corners = [];
  for (const [uc, sgu] of [[0.9, 1], [LEN - 0.9, -1]]) for (const sg of [-1, 1]) {
    const v0 = sg * (HW - 1.0), v1 = sg * (HV + 0.1), y0 = yDeck(uc) - 0.05;
    P.box(gran, uc - 0.75, uc + 0.75, y0, y0 + 1.5, Math.min(v0, v1), Math.max(v0, v1), 'b', 1.6);
    P.box(M.coping, uc - 0.85, uc + 0.85, y0 + 1.5, y0 + 1.66, Math.min(v0, v1) - 0.1, Math.max(v0, v1) + 0.1, 'b', 1.4);
    corners.push({ u: uc, v: (v0 + v1) / 2, hv: Math.abs(v1 - v0) / 2 + 0.1, sgu, sg });
  }

  // ------------------------------------------------------------------ deck: asphalt, median, barrier kerbs, pavements, markings
  const KE = 0.9, nM = Math.ceil((LEN - 2 * KE) / 3.2), brk = [U0, KE];                  // the kerbs / median stop 0.9 m short of the abutments (the streets of the squares take over there: no kerb on their asphalt)
  for (let i = 1; i <= nM; i++) brk.push(KE + (LEN - 2 * KE) * i / nM); brk.push(U1);
  for (let i = 0; i + 1 < brk.length; i++) {
    const u0 = brk[i], u1 = brk[i + 1], y0 = yDeck(u0), y1 = yDeck(u1), um = (u0 + u1) / 2, ends = u0 < KE - 1e-6 || u1 > LEN - KE + 1e-6;
    P.quad(M.asphalt, [u0, y0, -ROAD], [u1, y1, -ROAD], [u1, y1, ROAD], [u0, y0, ROAD], [0, 1, 0], [[u0 / 4, -ROAD / 4], [u1 / 4, -ROAD / 4], [u1 / 4, ROAD / 4], [u0 / 4, ROAD / 4]]);
    const kh = um < 2.5 || um > LEN - 2.5 ? PAVE : KH, mh = um < 4 || um > LEN - 4 ? 0.03 : 0.14;
    if (!ends) P.quad(M.kerb, [u0, y0 + mh, -MED], [u1, y1 + mh, -MED], [u1, y1 + mh, MED], [u0, y0 + mh, MED], [0, 1, 0], [[u0, -MED], [u1, -MED], [u1, MED], [u0, MED]]);                // the dividing strip
    for (const sg of [-1, 1]) {
      if (!ends) P.quad(M.kerb, [u0, y0, sg * MED], [u1, y1, sg * MED], [u1, y1 + mh, sg * MED], [u0, y0 + mh, sg * MED], [0, 0, sg], [[u0, 0], [u1, 0], [u1, mh], [u0, mh]]);
      const va = sg * ROAD, vk = sg * (ROAD + KW), vb = sg * (HW - 0.3);                     // the pavement ends where the cornice top begins (no coplanar overlap)
      M.footAsphalt && P.quad(M.footAsphalt, [u0, y0 + PAVE, vk], [u1, y1 + PAVE, vk], [u1, y1 + PAVE, vb], [u0, y0 + PAVE, vb], [0, 1, 0], [[u0 / 2.4, vk / 2.4], [u1 / 2.4, vk / 2.4], [u1 / 2.4, vb / 2.4], [u0 / 2.4, vb / 2.4]]);
      if (!ends) P.quad(M.kerb, [u0, y0, va], [u1, y1, va], [u1, y1 + kh, va], [u0, y0 + kh, va], [0, 0, -sg], [[u0, 0], [u1, 0], [u1, kh], [u0, kh]]);
      if (!ends) P.quad(M.kerb, [u0, y0 + kh, va], [u1, y1 + kh, va], [u1, y1 + kh, vk], [u0, y0 + kh, vk], [0, 1, 0], [[u0, 0], [u1, 0], [u1, KW], [u0, KW]]);
      else P.quad(M.footAsphalt, [u0, y0 + PAVE, va], [u1, y1 + PAVE, va], [u1, y1 + PAVE, vk], [u0, y0 + PAVE, vk], [0, 1, 0]);
      if (!ends && kh > PAVE) P.quad(M.kerb, [u0, y0 + PAVE, vk], [u1, y1 + PAVE, vk], [u1, y1 + kh, vk], [u0, y0 + kh, vk], [0, 0, sg], [[u0, 0], [u1, 0], [u1, kh], [u0, kh]]);
    }
    const mk = (vc, hw) => P.quad(M.mark, [u0, y0 + 0.03, vc - hw], [u1, y1 + 0.03, vc - hw], [u1, y1 + 0.03, vc + hw], [u0, y0 + 0.03, vc + hw], [0, 1, 0]);
    if (um > 5 && um < LEN - 5) { for (const sg of [-1, 1]) { mk(sg * (ROAD - 0.25), 0.07); if (i % 3 !== 2) for (const vc of [0.7 + 3.75, 0.7 + 7.5, 0.7 + 11.25]) mk(sg * vc, 0.06); } }
  }

  // the joint of the two bascule leaves (review 2026-10-07, photo r03 "Стыки разводного"): a dark steel plate 0.55 m wide with comb teeth across each carriageway and each pavement at mid-span of the bascule
  { const bs = SP.find((s) => s.kind === 'bascule'), um = (bs.a + bs.b) / 2, y0 = yDeck(um), hw2 = 0.275, T0 = 0.42, TL = 0.26, steel = M.jointSteel || M.fasBlagDark;
    const plate = (va, vb, y) => {
      P.quad(steel, [um - hw2, y, va], [um + hw2, y, va], [um + hw2, y, vb], [um - hw2, y, vb], [0, 1, 0]);
      const n = Math.max(2, Math.floor((vb - va) / T0));
      for (let i = 0; i < n; i++) {                                                                         // the teeth of the two combs interlock: the left comb in the first half of every period, the right comb in the second
        const v0 = va + (vb - va) * i / n, v1 = va + (vb - va) * (i + 1) / n, vm = (v0 + v1) / 2;
        P.fan(steel, [[um - hw2, y, v0 + (v1 - v0) * 0.1], [um - hw2 - TL, y, vm - (v1 - v0) * 0.25], [um - hw2, y, vm]], [0, 1, 0]);
        P.fan(steel, [[um + hw2, y, vm], [um + hw2 + TL, y, vm + (v1 - v0) * 0.25], [um + hw2, y, v1 - (v1 - v0) * 0.1]], [0, 1, 0]);
      }
    };
    for (const sg of [-1, 1]) {
      plate(Math.min(sg * MED, sg * ROAD), Math.max(sg * MED, sg * ROAD), y0 + 0.07);                      // the carriageway (above the lane lines at +0.03)
      plate(Math.min(sg * (ROAD + KW), sg * (HW - 0.3)), Math.max(sg * (ROAD + KW), sg * (HW - 0.3)), y0 + PAVE + 0.03);   // the pavement
    }
  }

  // ------------------------------------------------------------------ railings: cast panels (instanced) between cast pillars on both faces, the whole length
  const bascule = SP.find((s) => s.kind === 'bascule'), isBasc = (u) => u > bascule.a && u < bascule.b;
  const RA = 1.9, RB = LEN - 1.9;                                        // between the corner pedestals
  const cuts = tumbas.map((q) => [q.u - 1.45, q.u + 1.45]);
  for (const sg of [-1, 1]) {
    const v = sg * (HW - 0.14), mine = cuts.slice().sort((p, q) => p[0] - q[0]);
    let u = RA; const runs = [];
    for (const c of mine) { if (c[0] > u + 0.3) runs.push([u, c[0]]); u = Math.max(u, c[1]); }
    if (RB > u + 0.3) runs.push([u, RB]);
    for (const [ra, rb] of runs) {
      const nb = Math.max(1, Math.round((rb - ra) / 2.8)), bw = (rb - ra) / nb;
      for (let i = 0; i < nb; i++) {
        const ua = ra + bw * i, w = world(ua + 0.15, v), hex = isBasc(ua + bw / 2) ? '#c6cdc8' : '#9aa597';   // the bascule leaves carry the railing of duralumin (lighter) [W-ru]
        rails.add({ kind: 'hippocamp', hex, x: w.x, y: yDeck(ua) + PAVE + 0.04, z: w.z, rotY: -T, roll: Math.atan(slopeOf(ua + bw / 2)), len: bw - 0.3 }); B.info.rails++;
      }
      for (let i = 0; i <= nb; i++) {                                    // cast pillars with a cap
        const up = ra + bw * i, y = yDeck(up) + PAVE;
        P.box(M.railBlagPost, up - 0.14, up + 0.14, y, y + 1.28, v - 0.14, v + 0.14, 'b', 1);
        P.box(M.railBlagPost, up - 0.19, up + 0.19, y + 1.28, y + 1.36, v - 0.19, v + 0.19, 'b', 1);
        P.box(M.railBlagPost, up - 0.19, up + 0.19, y, y + 0.14, v - 0.19, v + 0.19, 'b', 1);
      }
      for (let i = 0; i < nb; i++) {                                     // the continuous hand rail under the panels' top (a clean silhouette from afar)
        const ua = ra + bw * i, ub = ua + bw, ya = yDeck(ua) + PAVE + 1.24, yb2 = yDeck(ub) + PAVE + 1.24;
        P.quad(M.railBlagPost, [ua, ya, v - 0.07], [ub, yb2, v - 0.07], [ub, yb2, v + 0.07], [ua, ya, v + 0.07], [0, 1, 0]);
      }
    }
  }

  // ------------------------------------------------------------------ the bascule pier pavilions (downstream balconies) and the clearance boards
  for (const t of towers) {
    const pv = (sp.pavilions || []).find((q) => q.sg === t.sg && Math.abs(q.u - t.pm) < 8);
    if (!pv) continue;
    pavilionBlag(P, M, t.pm, yDeck(t.pm) + PAVE + 0.93, t.sg * (t.vc + 0.3), 2.6);
  }
  for (const bd of sp.boards || []) {
    const vv = bd.sg * (HW + 0.2), yy = yTopOf(bd.u) - 1.45;                                        // on the fascia of the bascule span (0.18 m in front of the plate)
    P.quad(M.clear(bd.txt), [bd.u - 0.45, yy, vv], [bd.u + 0.45, yy, vv], [bd.u + 0.45, yy + 0.9, vv], [bd.u - 0.45, yy + 0.9, vv], [0, 0, bd.sg]);
  }

  // ------------------------------------------------------------------ the 22 historic standards
  const lampAt = [];
  for (const sg of [-1, 1]) for (const u of sp.lamps) {
    const tb = tumbas.find((q) => q.sg === sg && Math.abs(q.u - u) < 0.2), v = tb ? tb.v : sg * (HW - 0.55), y = tb ? tb.top : yDeck(u) + PAVE, h = tb ? 8.4 : 10.4;
    lampBlag(P, M, u, y, v, sg > 0 ? 0 : Math.PI, { h });
    lampAt.push({ u, v, y, tumba: !!tb }); B.masts.push({ ...world(u, v), y, h, kind: 'blag' });
  }

  // ------------------------------------------------------------------ the quay beside both ends: wing walls up to the end of the opening the environment leaves (river.js bridgeZones)
  const openLen = (sg, u0, dir) => {
    const zs = env.zones || []; if (!zs.length) return 2.4;
    let last = -1;
    for (let k = 0; k <= 30; k++) {
      const v = sg * (HV + k * 0.5), ub = bankU(L, sp, v, u0, dir); if (ub === null) break;
      const w = world(ub - dir * 0.25, v);
      if (zs.some((z) => z.test(w.x, w.z, 0.15))) last = k;
    }
    return last < 0 ? 2.4 : Math.min(15, Math.max(2.4, (last + 1) * 0.5 + 1.0));
  };
  const wings = [];
  for (const [uu, dir] of [[0, 1], [LEN, -1]]) for (const sg of [-1, 1]) { const len = openLen(sg, uu, dir); wings.push([uu, dir, sg, len]); closeBank({ site: sp, P, M, L, u: uu, dir, sg, v0: HV, len, yTop: 0.05, yb: yPier, mat: gran, parapet: par, collide: false }); }
  P.pop();
  B.info.wings = wings.map((w) => w[3]);

  // ------------------------------------------------------------------ colliders
  B.colliders = () => {
    const ph = ctx.physics, rampRot = Math.atan2(f.c, f.s), m = Math.ceil((U1 - U0) / 6);
    for (let i = 0; i < m; i++) { const u0 = U0 + (U1 - U0) * i / m, u1 = U0 + (U1 - U0) * (i + 1) / m, w = world((u0 + u1) / 2, 0); ph.addWalkRamp(w.x, w.z, 2 * HW + 0.2, u1 - u0 + 0.04, rampRot, yDeck(u0), yDeck(u1), 2.5); B.info.colliders++; }
    // (since the areas round of 2026-10-26 / docs/AREAS.md 13.7: the plain 8 m rail boxes that stood under the railing are gone: every rail panel of the hippocamp railing is a breakable knock bay of the rail batch (rails.js) with its own collider,
    //  "a collider exists if and only if a fence is drawn")
    const K0 = 3.5, K1 = LEN - 3.5, nK = Math.ceil((K1 - K0) / 8);
    for (const sg of [-1, 1]) for (let i = 0; i < nK; i++) { const u0 = K0 + (K1 - K0) * i / nK, u1 = K0 + (K1 - K0) * (i + 1) / nK, w = world((u0 + u1) / 2, sg * (ROAD + KW / 2)); ph.addBox(w.x, w.z, u1 - u0, KW, -T, Math.min(yDeck(u0), yDeck(u1)) - 1, Math.max(yDeck(u0), yDeck(u1)) + 0.6); B.info.colliders++; }
    for (const q of lampAt) if (!q.tumba) { const w = world(q.u, q.v); ph.addCylinder(w.x, w.z, 0.3, yDeck(q.u) - 1, yDeck(q.u) + 9); B.info.colliders++; }
    for (const q of tumbas) { const w = world(q.u, q.v); ph.addCylinder(w.x, w.z, 1.4, yDeck(q.u) - 2, q.top + 8); B.info.colliders++; }
    for (const c of corners) { const w = world(c.u, c.v); ph.addBox(w.x, w.z, 1.7, 2 * c.hv, -T, -6, yDeck(c.u) + 1.7); B.info.colliders++; }
    for (const [uu, dir, sg] of wings) B.info.colliders += closeBank({ site: sp, L, ph, ctx, u: uu, dir, sg, v0: HW - 0.3, len: wings.find((w) => w[0] === uu && w[2] === sg)[3], yTop: 0.05, draw: false });
  };
  return B;
}
void THREE;
