// bridges/krestAptek.js - the bridges of the Krestovsky / Kamenny / Aptekarsky round (docs/research/bridges-krestovsky-aptekarsky.md, 2026-10-13): the Maly Krestovsky Bridge (Krestovka, Kamenny <-> Krestovsky),
// the Bychy and Grebnoy bridges (the Rowing Canal protoka, Krestovsky <-> Bychy Island), the Kantemirovsky Bridge (Bolshaya Nevka, Aptekarsky <-> Vyborg side) and the other unclaimed decks that the environment
// closes with its invisible fallback box (see ./krestAptek2.js for the second group).
//   How it works: every bridge is a SPEC for the generic builder bridges/long.js buildLong() (frame: origin = the centre of the deck on the first bank line, +u toward the far bank, +v right of travel,
//   len = bank to bank, hw = half the width between the railings, road = half the roadway) plus EXTRAS drawn here: approach slabs over the part of the claimed OSM way that lies on land (streets/ stops drawing a
//   claimed bridge way altogether, so the land stretch must be asphalt too), the struts of the Maly Krestovsky frame, the masts of the Kantemirovsky bascule piers, tri-lamp standards, name plates, colliders.
//   Facts [W] ru.wikipedia: Maly Krestovsky (1961-62, Yurkov / Noskov): one-span RC two-hinged frame with inclined struts ("running doe"), span 46 m, rise 4 m, 56 m x 13 m, 2 lanes, granite kerbs, simple metal railing
//   ending in granite parapets at the abutments; Bychy (2016, east) 33.2 m and Grebnoy (2015, west) 36.2 m: one 28 m steel span of 4 I girders, 13 m wide (2 x 3.5 m lanes + 2 x 1.0 m, pavements 2 x 1.5 m), granite
//   kerbs, 1.1 m metal railing sections between posts every 2.44 m; Kantemirovsky (1979-82, Brudno / Ivanov): 57 + 75 + 33.3 + 75 + 57 m, 31 m between the railings (carriageway 24.5 m + pavements 2 x 3.0 m),
//   continuous welded steel girders with a curved lower chord, single-leaf bascule (shown closed), granite piers, white pyramidal masts with 12 lamps on the bascule piers, Tuchkov-pattern railing, steel barrier
//   between pavement and roadway.  NO flags / flagpoles / beacons (user rules).
import * as THREE from 'three';
import { frameOf, toUV, toWorld, frameBounds } from './sites.js';
import { buildLong, hump, closeBank, bankU } from './long.js';
import { lampCobra } from './sculpt4.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** frame of a bridge from the two ends of its axis (world x, z) and the u (from the first end) of the first / last bank line on the axis: { cx, cz, b, len, u0 } (origin = the first bank line) */
export function axisFrame(p0, p1, bank0, bank1) {
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), dx = (p1[0] - p0[0]) / L, dz = (p1[1] - p0[1]) / L;
  return { cx: p0[0] + dx * bank0, cz: p0[1] + dz * bank0, b: (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360, len: bank1 - bank0, wayBefore: bank0, wayAfter: L - bank1 };
}

// ---------------------------------------------------------------------------------------------------- the specs (pure data)
const fMK = axisFrame([-3838.15, -4596.9], [-3869.9, -4508.75], 30.9, 69.6);
/** Maly Krestovsky Bridge: Kamenny (north) -> Krestovsky (south) over the Krestovka. Banks are skewed ~21 deg to the axis: bank line u = sk * v (sk0 first bank, sk1 far bank). */
export const MK = {
  id: 'malokrestovsky', name: 'Мало-Крестовский мост', nameEn: 'Maly Krestovsky Bridge', ww: 'neva', ...fMK, hw: 5.75, road: 3.55, kerbW: 0.3, kerbH: 0.18, crown: 0.9,
  piers: [], spans: ['girder'], look: { fas: 'fasLazarev', dark: 'concrete', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'plainrods', hex: '#6a695e', bay: 2.0 }, depth: { fascia: 0, pier: 1.55, mid: 0.9, bank: 1.55 }, marks: { solid: [], dash: [0] }, tracks: null, lowKerb: true,
  lamps: { kind: 'cobra', u: [], opts: { h: 9, mat: 'steel' } },
  ka: { sk0: -0.386, sk1: -0.42, slabA: -fMK.wayBefore, slabB: fMK.len + fMK.wayAfter, strutRun: 7.2, strutDeep: 3.4, lampU: [-5, fMK.len + 5], skewExt: 3.4 },
  osm: ['w369108197', 'w10372499', 'w685145307', 'w857206233'], at: [-3854, -4552],
};
const fBY = axisFrame([-6363.55, -4884.95], [-6328.1, -4881.9], 0, 35.58);
/** Bychy Bridge (east of the two, 2016): the whole OSM way is the bridge (abutments included); water only north of the axis (the protoka ends in the canal bank) */
export const BYCHY = {
  id: 'bychy', name: 'Бычий мост', nameEn: 'Bychy Bridge', ww: 'neva', ...fBY, hw: 6.5, road: 4.5, kerbW: 0.3, kerbH: 0.3, crown: 0.3,
  piers: [], spans: ['girder'], look: { fas: 'fasLazarev', dark: 'fasTuchkovDark', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'plainrods', hex: '#9aa5aa', bay: 2.44 }, depth: { fascia: 0, pier: 1.15, mid: 1.15, bank: 1.15 }, marks: { solid: [], dash: [0] }, tracks: null, lowKerb: true,
  lamps: { kind: 'cobra', u: [4.5, 17.8, 31.0], opts: { h: 10, mat: 'steel' } },
  ka: {}, osm: ['w1350836102', 'w372374381', 'w711850176', 'w711850179', 'w1350836103', 'w1350836104'], at: [-6346, -4883],
};
const fGR = axisFrame([-7342.2, -4972.55], [-7303.1, -4969.35], 2.0, 37.23);
/** Grebnoy Bridge (west, 2015): twin of the Bychy Bridge, 36.2 m */
export const GREB = {
  id: 'grebnoy', name: 'Гребной мост', nameEn: 'Grebnoy Bridge', ww: 'neva', ...fGR, hw: 6.5, road: 4.5, kerbW: 0.3, kerbH: 0.3, crown: 0.3,
  piers: [], spans: ['girder'], look: { fas: 'fasLazarev', dark: 'fasTuchkovDark', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'plainrods', hex: '#9aa5aa', bay: 2.44 }, depth: { fascia: 0, pier: 1.15, mid: 1.15, bank: 1.15 }, marks: { solid: [], dash: [0] }, tracks: null, lowKerb: true,
  lamps: { kind: 'cobra', u: [3.5, 17.6, 31.5], opts: { h: 10, mat: 'steel' } },
  ka: {}, osm: ['w1350836101', 'w345390939', 'w711850170', 'w711850171'], at: [-7322, -4971],
};
const fKA = axisFrame([-1754.55, -5022.15], [-1538.1, -5245.2], 53.1, 255.0);
/** Kantemirovsky Bridge: Aptekarsky Island (south-west) -> the Vyborg side (north-east) over the Bolshaya Nevka. Piers: the two granite bascule piers; the thin bank columns stand on the quay lines. */
export const KANT = {
  id: 'kantemirovsky', name: 'Кантемировский мост', nameEn: 'Kantemirovsky Bridge', ww: 'neva', ...fKA, hw: 15.5, road: 12.25, kerbW: 0.5, kerbH: 0.75, crown: 4.0,
  piers: [[75.0, 84.3, 'block'], [117.6, 126.9, 'block']], spans: ['girder', 'bascule', 'girder'],
  look: { fas: 'kaSteel', dark: 'kaSteelDark', granite: 'granitePeach', parapet: 'parapetPeach', pave: 'footAsphalt', kerb: 'steel' },
  rail: { kind: 'hairpin', hex: '#a9b5a3', bay: 2.4 }, depth: { fascia: 0, pier: 2.7, mid: 1.4, bank: 1.7 }, marks: { solid: [-0.12, 0.12], dash: [-4.08, 4.08, -8.17, 8.17] }, tracks: null,
  lamps: { kind: 'cobra', u: [], opts: { h: 10, mat: 'steel' } },
  ka: { slabA: -fKA.wayBefore, slabB: fKA.len + fKA.wayAfter, lampU: [-47, -22, 8, 38, 64, 96, 106, 138, 168, 196, 226, 251] },
  osm: ['w305095448', 'w157365373', 'w157365375', 'w201078791', 'w201078798', 'w305095451', 'w305095452'], at: [-1646, -5136],
};
export const SPECS = [MK, BYCHY, GREB, KANT];

// ---------------------------------------------------------------------------------------------------- shared pieces
/** flat approach slab over the land stretch of a claimed way: asphalt, low kerbs, pavements, dashes (u0 .. u1 in the frame of sp; y = +0.05 over the street plane) */
export function slab(P, M, sp, u0, u1, o = {}) {
  if (u1 - u0 < 0.2) return;
  const ROAD = sp.road, KW = sp.kerbW, HW = sp.hw, PV = 0.15, y = 0.05, vb = HW + 0.1, kerbM = M.kerb, pave = M[sp.look.pave];
  P.quad(M.asphalt, [u0, y, -ROAD], [u1, y, -ROAD], [u1, y, ROAD], [u0, y, ROAD], [0, 1, 0], [[u0 / 4, -ROAD / 4], [u1 / 4, -ROAD / 4], [u1 / 4, ROAD / 4], [u0 / 4, ROAD / 4]]);
  for (const sg of [-1, 1]) {
    const va = sg * ROAD, vk = sg * (ROAD + KW), vo = sg * vb;
    P.quad(kerbM, [u0, y, va], [u1, y, va], [u1, y + PV, va], [u0, y + PV, va], [0, 0, -sg], [[u0, 0], [u1, 0], [u1, PV], [u0, PV]]);
    P.quad(kerbM, [u0, y + PV, va], [u1, y + PV, va], [u1, y + PV, vk], [u0, y + PV, vk], [0, 1, 0], [[u0, 0], [u1, 0], [u1, KW], [u0, KW]]);
    P.quad(pave, [u0, y + PV, vk], [u1, y + PV, vk], [u1, y + PV, vo], [u0, y + PV, vo], [0, 1, 0], [[u0 / 2.4, vk / 2.4], [u1 / 2.4, vk / 2.4], [u1 / 2.4, vo / 2.4], [u0 / 2.4, vo / 2.4]]);
    P.quad(pave, [u0, 0, vo], [u1, 0, vo], [u1, y + PV, vo], [u0, y + PV, vo], [0, 0, sg], [[u0 / 2.4, 0], [u1 / 2.4, 0], [u1 / 2.4, 0.2], [u0 / 2.4, 0.2]]);
  }
  const mk = (vc, hw, ua, ub) => P.quad(M.mark, [ua, y + 0.03, vc - hw], [ub, y + 0.03, vc - hw], [ub, y + 0.03, vc + hw], [ua, y + 0.03, vc + hw], [0, 1, 0]);
  for (const vc of sp.marks.solid) mk(vc, 0.06, u0 + 1, u1 - 1);
  for (const vc of sp.marks.dash) for (let ua = u0 + 1; ua + 3 < u1; ua += 6) mk(vc, 0.06, ua, ua + 3);
  void o;
}
/** a tri-lamp standard of the Kantemirovsky pavements: a grey tapered pole, a cross bar with three cylindrical heads (photo k05) */
function lampTri(P, M, u, y, v, rot, steel) {
  P.push(u, y, v, rot);
  P.cyl(steel, [0, 0, 0], [0, 0.4, 0], 0.22, 0.17, 8, true);
  P.cyl(steel, [0, 0.4, 0], [0, 9.6, 0], 0.13, 0.075, 8, false);
  P.cyl(steel, [0, 9.4, 0], [0, 9.9, 0.55], 0.05, 0.04, 5, false);
  P.box(steel, -1.0, 1.0, 9.78, 9.9, 0.45, 0.62, '', 1);
  for (const x of [-0.75, 0, 0.75]) { P.cyl(steel, [x, 9.78, 0.52], [x, 9.98, 0.52], 0.17, 0.2, 8, false); P.cyl(M.lampGlass, [x, 9.7, 0.52], [x, 9.78, 0.52], 0.15, 0.15, 8, false); }
  P.pop();
}
/** the white pyramidal mast of a Kantemirovsky bascule pier: tapered pole 13.5 m, three cross bars, 12 cylindrical lamps (photos k01 k02 k03); (x, y, z) = its foot */
function mastKant(P, M, white, u, y, v) {
  P.cyl(white, [u, y, v], [u, y + 0.5, v], 0.46, 0.36, 8, true);
  P.cyl(white, [u, y + 0.5, v], [u, y + 13.8, v], 0.3, 0.13, 8, false);
  for (const h of [8.2, 10.6, 12.9]) {
    P.box(white, u - 0.07, u + 0.07, y + h, y + h + 0.1, v - 1.35, v + 1.35, '', 1);
    for (const dv of [-1.2, 1.2]) for (const du of [-0.22, 0.22]) { P.cyl(white, [u + du, y + h - 0.12, v + dv], [u + du, y + h + 0.5, v + dv], 0.1, 0.1, 6, true); P.cyl(M.lampGlass, [u + du, y + h - 0.2, v + dv], [u + du, y + h - 0.12, v + dv], 0.09, 0.09, 6, false); }
  }
  P.cyl(white, [u, y + 13.8, v], [u, y + 14.3, v], 0.06, 0.02, 5, false);
}
/** the blue enamel name plate on a black pole (both faces, facing along +-u), standing on a rough granite block at the end of a railing (photo mk03); (u, v) = the pole */
export function platePole(P, M, plateM, u, y, v) {
  P.box(M.graniteGrey, u - 0.55, u + 0.55, y - 0.3, y + 0.8, v - 0.55, v + 0.55, 'b', 1.4);
  P.cyl(M.black, [u, y + 0.8, v], [u, y + 3.3, v], 0.055, 0.045, 6, true);
  P.cyl(M.black, [u, y + 0.8, v], [u, y + 1.7, v], 0.16, 0.06, 6, false);
  if (plateM) for (const s of [-1, 1]) { const x = u + s * 0.05; P.quad(plateM, [x, y + 2.6, v + 0.6 * s], [x, y + 2.6, v - 0.6 * s], [x, y + 3.15, v - 0.6 * s], [x, y + 3.15, v + 0.6 * s], [s, 0, 0]); }
}
/** girder depth under the deck of a single span (the same formula as long.js depthOf for one span between two banks) */
const depthSingle = (sp, u) => { const D = sp.depth, t = clamp(u / sp.len, 0, 1), t0 = 0.5; return t < t0 ? D.mid + (D.bank - D.mid) * Math.pow(1 - t / t0, 2) : D.mid + (D.bank - D.mid) * Math.pow((t - t0) / (1 - t0), 2); };

/** the inclined struts of the Maly Krestovsky frame: two sheared slabs across the whole deck width, feet on the bank lines (photos mk01 mk02 mk05) */
function mkStruts(P, M, sp, yDeck, waterY) {
  const V = sp.hw + 0.03, run = sp.ka.strutRun, yw = waterY + 0.15, fas = M[sp.look.fas], dark = M[sp.look.dark];
  for (const end of [0, 1]) {
    const sk = end ? sp.ka.sk1 : sp.ka.sk0, base = end ? sp.len : 0, dir = end ? -1 : 1;
    const U = (r, v) => base + dir * r + sk * v;
    const ys = (r) => yDeck(base + dir * r) - 0.2 - depthSingle(sp, base + dir * r) + 0.02;
    const r0 = -0.1, r1 = 1.7, r2 = run + 3.4, r3 = run;                       // upper face: r0 -> r3 (meets the soffit), lower face: r1 -> r2
    const A = [r0, yw - 0.1], Bf = [r1, yw - 0.1], C = [r2, ys(r2)], D = [r3, ys(r3)];
    for (const sg of [-1, 1]) {
      const v = sg * V, pts = [A, Bf, C, D].map((q) => [U(q[0], v), q[1], v]);
      P.quad(fas, pts[0], pts[1], pts[2], pts[3], [0, 0, sg], [[A[0] / 2.4, A[1] / 2.4], [Bf[0] / 2.4, Bf[1] / 2.4], [C[0] / 2.4, C[1] / 2.4], [D[0] / 2.4, D[1] / 2.4]]);
    }
    const q = (a, v) => [U(a[0], v), a[1], v];
    P.quad(dark, q(Bf, -V), q(Bf, V), q(C, V), q(C, -V), [dir * (C[1] - Bf[1]), -(C[0] - Bf[0]), 0]);        // lower face (looks down and toward the span centre)
    P.quad(M.concrete, q(A, -V), q(D, -V), q(D, V), q(A, V), [-dir * (D[1] - A[1]), (D[0] - A[0]), 0]);      // upper face (looks up and toward the bank)
    P.quad(M.concrete, q(A, -V), q(A, V), q(Bf, V), q(Bf, -V), [0, -1, 0]);                                     // the foot
  }
}

/** the common wrapper: buildLong + extras (materials, slabs, deckAt / bounds over the whole claimed way) */
export function buildWith(env, sp, extras) {
  const { ctx, P, M } = env;
  if (!M.kaSteel) {
    M.kaSteel = ctx.mat.toon('#8a9690', { paint: 0.05, name: 'brg-ka-steel' }); M.kaSteelDark = ctx.mat.toon('#626e68', { paint: 0.05, name: 'brg-ka-steel-d' });
    M.kaWhite = ctx.mat.toon('#e7eae6', { paint: 0.03, name: 'brg-ka-white' });
  }
  const B = buildLong(env, sp), f = frameOf(sp), T = f.T, ka = sp.ka || {}, LEN = sp.len, yDeck = B.yDeck, HW = sp.hw;
  const world = (u, v) => toWorld(sp, u, v), colls = [];
  const sA = ka.slabA !== undefined ? ka.slabA : -1.2, sB = ka.slabB !== undefined ? ka.slabB : LEN + 1.2;
  P.push(f.cx, 0, f.cz, -T);
  if (ka.slabA !== undefined) slab(P, M, sp, sA, -1.2);
  if (ka.slabB !== undefined) slab(P, M, sp, LEN + 1.2, sB);
  const X = extras ? extras({ ...env, sp, B, f, T, yDeck, world, colls }) : null;
  P.pop();
  const inner = B.deckAt, U0 = -1.2, U1 = LEN + 1.2;
  B.deckAt = (x, z) => { const q = toUV(sp, x, z); if (Math.abs(q.v) > HW + 0.3 || q.u < Math.min(sA, U0) || q.u > Math.max(sB, U1)) return null; return q.u >= U0 && q.u <= U1 ? inner(x, z) : 0.05; };
  B.bounds = frameBounds(sp, Math.min(sA, U0) - 1, Math.max(sB, U1) + 1, -HW - 1, HW + 1, 2);
  const baseCol = B.colliders;
  B.colliders = () => {
    baseCol(); const ph = ctx.physics; for (const c of colls) { c(ph); B.info.colliders++; } if (X && X.colliders) X.colliders(ph);
    // a deck over SKEWED banks: the water reaches ka.skewExt m past the last deck row at one corner of each end (the bank line is u = sk * v): a walk strip at street level closes the corner (found by tools/bridges-krestovsky-aptekarsky-leaks.mjs)
    if (ka.skewExt) for (const [ua, ub] of [[U0 - ka.skewExt, U0 + 0.1], [U1 - 0.1, U1 + ka.skewExt]]) { const w = world((ua + ub) / 2, 0); ph.addWalkBox(w.x, w.z, ub - ua, 2 * HW + 0.2, -T, 0.05, -1.2); B.info.colliders++; }
  };
  B.info.slab = [sA, sB];
  B.frame = f;
  return B;
}

// ---------------------------------------------------------------------------------------------------- the four bridges
function buildMK(env) {
  const sp = MK, { P, M, rails, waterY } = env;
  return buildWith(env, sp, ({ B, yDeck, world, colls, T }) => {
    const ka = sp.ka, HW = sp.hw, LEN = sp.len, plateM = M.namePlate ? M.namePlate('МАЛО-КРЕСТОВСКИЙ МОСТ') : null, steel = M.steel;
    mkStruts(P, M, sp, yDeck, waterY);
    // the land beams of the real bridge (8 m beyond each bank line): railing bays on the pavement, ended by a granite block that carries the name plate (photo mk03)
    const bays = [[-8.0, -1.2], [LEN + 1.2, LEN + 8.0]];
    for (const [ua, ub] of bays) for (const sg of [-1, 1]) {
      const v = sg * (HW - 0.14), n = Math.max(1, Math.round((ub - ua) / 2)), bw = (ub - ua) / n;
      for (let i = 0; i < n; i++) { const w = world(ua + bw * i + 0.03, v); rails.add({ kind: sp.rail.kind, hex: sp.rail.hex, x: w.x, y: 0.2, z: w.z, rotY: -T, roll: 0, len: bw - 0.06 }); B.info.rails++; }
      const w = world((ua + ub) / 2, v); colls.push((ph) => ph.addBox(w.x, w.z, ub - ua, 0.3, -T, -1, 1.4));
    }
    for (const sg of [-1, 1]) for (const [u, s2] of [[bays[0][0] - 0.5, -1], [bays[1][1] + 0.5, 1]]) {
      const v = sg * (HW - 0.14); platePole(P, M, plateM, u, 0.2, v); void s2; const w = world(u, v);
      colls.push((ph) => ph.addCylinder(w.x, w.z, 0.6, -0.5, 4));
    }
    // lamps: pale grey single-arm standards at the abutment ends (photos mk01 mk02: a pole at each end of the bridge on both sides, arm over the roadway)
    for (const u of ka.lampU) for (const sg of [-1, 1]) {
      const v = sg * (sp.road + sp.kerbW + 0.4), y = u < 0 || u > LEN ? 0.2 : yDeck(u) + 0.15, w = world(u, v);
      lampCobra(P, M, u, y, v, sg > 0 ? Math.PI : 0, { h: 9, mat: steel, arm: 1.9 }); B.masts.push({ x: w.x, y, z: w.z, h: 9, kind: 'cobra', id: sp.id });
      colls.push((ph) => ph.addCylinder(w.x, w.z, 0.25, y - 1, y + 9));
    }
    return null;
  });
}
function buildBychy(env) { return buildWith(env, BYCHY, null); }
function buildGreb(env) { return buildWith(env, GREB, null); }
function buildKant(env) {
  const sp = KANT, { P, M } = env;
  return buildWith(env, sp, ({ B, yDeck, world, colls }) => {
    const ka = sp.ka, HW = sp.hw, LEN = sp.len, white = M.kaWhite, steel = M.steel, masts = [];
    // the white masts with 12 lamps on the four pedestal blocks of the bascule piers (the blocks are drawn by buildLong: top = deck + 1.39 m)
    for (const [pa, pb] of sp.piers) for (const sg of [-1, 1]) { const pm = (pa + pb) / 2, y = yDeck(pm) + 0.15 + 1.24, v = sg * (HW + 0.0), w = world(pm, v); mastKant(P, M, white, pm, y, v); masts.push({ x: w.x, z: w.z, y, h: 14.3 }); B.masts.push({ x: w.x, y, z: w.z, h: 14.3, kind: 'mast', id: sp.id }); }
    // tri-lamp standards on the pavements
    for (const u of ka.lampU) for (const sg of [-1, 1]) {
      const v = sg * (HW - 0.6), y = u < 0 || u > LEN ? 0.2 : yDeck(u) + 0.15, w = world(u, v);
      lampTri(P, M, u, y, v, sg > 0 ? Math.PI : 0, steel); B.masts.push({ x: w.x, y, z: w.z, h: 10, kind: 'tri', id: sp.id });
      colls.push((ph) => ph.addCylinder(w.x, w.z, 0.22, y - 1, y + 10));
    }
    return { colliders: (ph) => { for (const m of masts) { ph.addCylinder(m.x, m.z, 0.5, m.y - 1, m.y + 14); B.info.colliders++; } } };
  });
}

/** the list the bridges module walks: { id, name, nameEn, ww, spec, build(env) } */
export const KA_BRIDGES = [
  { id: MK.id, name: MK.name, nameEn: MK.nameEn, ww: MK.ww, spec: MK, build: buildMK },
  { id: BYCHY.id, name: BYCHY.name, nameEn: BYCHY.nameEn, ww: BYCHY.ww, spec: BYCHY, build: buildBychy },
  { id: GREB.id, name: GREB.name, nameEn: GREB.nameEn, ww: GREB.ww, spec: GREB, build: buildGreb },
  { id: KANT.id, name: KANT.name, nameEn: KANT.nameEn, ww: KANT.ww, spec: KANT, build: buildKant },
];
void THREE; void hump; void bankU; void closeBank;
