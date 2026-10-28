// Provenance: copied verbatim from 102_3d_piter commit 0568f7af (src/world/bridges/long.js) for Admiralty-Haymarket (docs/AREAS.md 15.2); this line is the only change.
// bridges/long.js - the long bridges of the Petrograd side / the Spit of Vasilievsky Island as DATA (LONG) + one generic builder (buildLong): docs/research/petro-bridges.md sections 3 - 5,
// photos refs/petro-bridges 25 26 30 31 (Birzhevoy), 34 35 36 38 (Tuchkov), 40 41 44 45 46 (Sampsonievsky).
//   birzhevoy  Биржевой мост (1957-60) over the Malaya Neva, Spit -> Mytninskaya emb.: 5 spans 37.6 + 44.06 + 55.5 (double-leaf bascule) + 44.06 + 37.6, 239 m, 27.3 m; very flat green welded arches
//              (plain box rib, slender spandrel posts, fascia girder), two slim + two massive round-ended pink granite piers, railing `trident` (spear bars, a trident in a ring between paired posts),
//              16 green lamp standards with two cylindrical lanterns, 6 lanes, no tram
//   tuchkov    Тучков мост (1962-65, rebuilt 2016-18) over the Malaya Neva, Makarova emb. -> Bolshoy pr. P.S.: 3 spans 74.1 + 53.4 (double-leaf bascule) + 74.1, 226 m, 36 m; light grey steel plate
//              girders with a haunched soffit, two squat round-tower pink granite piers with domed pavilions on the upstream side, railing `hairpin`, plain grey poles, 3 + 3 lanes, two tram tracks in the centre
//   samps      Сампсониевский мост (1955-58) over the Bolshaya Nevka: 7 openings (granite-faced arch + 2 steel + double-leaf bascule + 2 steel + arch, lengths estimated from an aerial), 215 m, 27 m;
//              green haunched girders, salmon-pink granite piers with pedestal blocks that carry ring-of-globes lamp columns, railing `ringbal` (ring frieze + balusters), granite parapets over the
//              arches and the piers, 2 + 2 lanes, two tram tracks in the centre.  (Its Petrograd end lies outside the play rectangles: the deck works all the same.)
// A spec: frame like bridges/sites.js but the ORIGIN IS THE DECK CENTRE ON THE FIRST BANK LINE (cx, cz, b = bearing of +u toward the far bank, +v right of travel), len = bank to bank, hw = half the
// width between the railings, road = half the roadway, piers [u0, u1, kind], spans (kinds of the openings between the banks / piers, in order), crown (deck rise at mid-bridge above the +0.05 of the
// bank lines: our streets are flat, the real approaches rise), look (materials of mats.js), rail, lamps, marks, tracks.  Estimates [E]: crowns, girder depths of the bascule spans, pier nose shapes.
// Also exported: profile() (monotone cubic deck profile), bankU() / closeBank() (the bank line beside a deck and the wing wall + collider that closes the opened quay), used by troitsky.js / palace.js.
import * as THREE from 'three';
import { frameOf, toUV, frameBounds } from './sites.js';
import { lampCross, lampRing, lampCobra, lampGlobes5 } from './sculpt4.js';
import { knockBays } from '../lib/fence-bays.js';
import { postBatch } from './knock-posts.js';      // n4spb: the lamp standards of buildLong are knock records (bridges/knock-posts.js)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** monotone cubic (Fritsch-Carlson) through keys [[u, y] ...] -> y(u) (flat outside) */
export function profile(keys) {
  const x = keys.map((k) => k[0]), y = keys.map((k) => k[1]), d = [], m = [], n = x.length;
  for (let i = 0; i + 1 < n; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  for (let i = 0; i < n; i++) m.push(i === 0 ? d[0] : i === n - 1 ? d[i - 1] : d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]));
  return (u) => {
    if (u <= x[0]) return y[0]; if (u >= x[n - 1]) return y[n - 1];
    let i = 0; while (u > x[i + 1]) i++;
    const h = x[i + 1] - x[i], t = (u - x[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
/** the usual hump: +0.05 at both bank lines, +crown at mid-bridge */
export const hump = (len, crown) => profile([[0, 0.05], [len * 0.1, 0.05 + crown * 0.3], [len * 0.28, 0.05 + crown * 0.8], [len / 2, 0.05 + crown], [len * 0.72, 0.05 + crown * 0.8], [len * 0.9, 0.05 + crown * 0.3], [len, 0.05]]);

/** u of the bank line at cross coordinate v near uGuess (dir +1: the water lies toward +u = the first bank; -1: the far bank); null when no bank within 9 m */
export function bankU(L, site, v, uGuess, dir) {
  const f = frameOf(site), wet = (u) => { const x = f.cx + u * f.c - v * f.s, z = f.cz + u * f.s + v * f.c; return !!(L.waterwayAt ? L.waterwayAt(x, z) : L.inRiver(x, z)); };
  let prev = wet(uGuess - dir * 9);
  for (let k = -8.8; k <= 9.001; k += 0.2) { const u = uGuess + dir * k, w = wet(u); if (w && !prev) return u - dir * 0.1; prev = w; }
  return null;
}
/**
 * Closes the quay beside a deck end: the environment opens its wall / parapet / collider in a zone wider than the deck; from the deck edge (cross coordinate v0, side sg) a granite wing wall with a
 * parapet follows the real bank line outward for `len` metres (drawn), and a collider runs on until an existing solid (the quay wall of the environment) is met (at most 14 m).
 * o: { site, P (already in the bridge frame), M, L, ph, u (bank line guess on the axis), dir (+1 first bank, -1 far bank), sg, v0, len, yTop (ground / pavement level), mat, parapet, draw, collide }
 */
export function closeBank(o) {
  const { site, L, sg, v0, dir } = o, f = frameOf(site), world = (u, v) => ({ x: f.cx + u * f.c - v * f.s, z: f.cz + u * f.s + v * f.c });
  const pts = [];
  for (let k = 0; k <= 28; k++) { const v = sg * (v0 + k * 0.5), u = bankU(L, site, v, o.u, dir); pts.push(u === null ? null : [u, v]); }
  let last = null; for (let k = 0; k < pts.length; k++) { if (pts[k]) last = pts[k][0]; else if (last !== null) pts[k] = [last, sg * (v0 + k * 0.5)]; }
  if (!pts[0]) { const first = pts.find((q) => q); if (!first) return 0; for (let k = 0; k < pts.length && !pts[k]; k++) pts[k] = [first[0], sg * (v0 + k * 0.5)]; }
  const nDraw = Math.round((o.len || 3.4) / 0.5), yTop = o.yTop ?? 0.05, yb = o.yb ?? -4.7, th = 0.5;   // (o.yb: the foot of the wing face; a caller may stop it just under the water line so that no toon outline of an underwater edge shows through the water)
  if (o.P && o.draw !== false) {
    const P = o.P, M = o.M, mat = o.mat || M.granite, par = o.parapet || M.parapet;
    for (let k = 0; k < nDraw; k++) {
      const a = pts[k], b = pts[k + 1], ua = a[0] + dir * 0.12, ub = b[0] + dir * 0.12;                              // the face stands 0.12 m in front of the bank line (no sliver of water behind it)
      P.quad(mat, [ua, yb, a[1]], [ub, yb, b[1]], [ub, yTop, b[1]], [ua, yTop, a[1]], [dir, 0, 0], [[a[1] / 2.2, yb / 2.2], [b[1] / 2.2, yb / 2.2], [b[1] / 2.2, yTop / 2.2], [a[1] / 2.2, yTop / 2.2]]);
      P.quad(M.coping, [ua, yTop, a[1]], [ub, yTop, b[1]], [ub - dir * th, yTop, b[1]], [ua - dir * th, yTop, a[1]], [0, 1, 0]);
      for (const [du, nx] of [[0, dir], [-dir * th, -dir]]) P.quad(par, [ua + du, yTop, a[1]], [ub + du, yTop, b[1]], [ub + du, yTop + 1.0, b[1]], [ua + du, yTop + 1.0, a[1]], [nx, 0, 0], [[0, 0], [0.2, 0], [0.2, 1], [0, 1]]);
      P.quad(M.coping, [ua + dir * 0.03, yTop + 1.0, a[1]], [ub + dir * 0.03, yTop + 1.0, b[1]], [ub - dir * (th + 0.03), yTop + 1.0, b[1]], [ua - dir * (th + 0.03), yTop + 1.0, a[1]], [0, 1, 0]);
    }
    const e = pts[nDraw], ue = e[0] + dir * 0.12;                                                                    // the end face of the wing
    P.quad(par, [ue, yTop, e[1]], [ue - dir * th, yTop, e[1]], [ue - dir * th, yTop + 1.0, e[1]], [ue, yTop + 1.0, e[1]], [0, 0, sg], [[0, 0], [0.2, 0], [0.2, 1], [0, 1]]);
  }
  let n = 0;
  if (o.ph && o.collide !== false) {
    const ph = o.ph, probe = { x: 0, z: 0 }, ghosts = [];      // WATER IS REACHABLE (docs/AREAS.md 13.7, 15.2): with o.ctx the wing wall's collider is a row of breakable GHOST bays (lib/fence-bays.js): the wall stays drawn, the collider breaks like every fence
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1], um = (a[0] + b[0]) / 2 - dir * 0.15, vm = (a[1] + b[1]) / 2, w = world(um, vm);
      if (k >= nDraw) { probe.x = w.x; probe.z = w.z; ph.resolve(probe, 0.25, 0, 1.7); if (Math.hypot(probe.x - w.x, probe.z - w.z) > 0.04) break; }   // the quay collider of the environment takes over
      const rot = Math.atan2(-(b[0] - a[0]) * f.s - (b[1] - a[1]) * f.c, (b[0] - a[0]) * f.c - (b[1] - a[1]) * f.s);
      if (o.ctx) {
        const wa = world(a[0] - dir * 0.15, a[1]), wb = world(b[0] - dir * 0.15, b[1]);
        ghosts.push({ x0: wa.x, z0: wa.z, x1: wb.x, z1: wb.z, y: 0, ghost: true }); n++;
      } else { ph.addBox(w.x, w.z, Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.3, 0.5, rot, -8, yTop + 1.25); n++; }
      void rot;
    }
    if (ghosts.length) knockBays(o.ctx, { name: 'brg-wing', bays: ghosts, parts: [], far: 300, collider: { y0: -8, y1: yTop + 1.25, thick: 0.5, e0: 0.15, e1: 0.15 },
      rec: () => ({ kind: 'fence', mass: 900, h: 1.2, anchored: 24, hitK: 0.6, metal: false, minDv: 0 }) });
  }
  return n;
}

// ---------------------------------------------------------------------------------------------------- the three bridges (pure data)
export const BIRZHEVOY = { id: 'birzhevoy', name: 'Биржевой мост', nameEn: 'Exchange (Birzhevoy) Bridge', cx: -2686.29, cz: -1425.70, b: 3.63, len: 238.7, hw: 13.65, road: 10.5, kerbW: 0.3, kerbH: 0.55, crown: 3.0,
  piers: [[35.6, 38.9, 'slim'], [83.1, 92.2, 'tower'], [145.0, 154.3, 'tower'], [197.4, 201.0, 'slim']], spans: ['arch', 'arch', 'bascule', 'arch', 'arch'], rise: [3.2, 3.6, 0, 3.6, 3.2],
  look: { fas: 'fasBirzh', dark: 'fasBirzhDark', granite: 'granitePink', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'trident', hex: '#4e7558', bay: 2.5 }, depth: { fascia: 0.95, pier: 3.3, mid: 1.25 },
  marks: { solid: [3.38, 3.62], dash: [-7, -3.5, 0, 7] }, tracks: null,
  lamps: { kind: 'cross', u: [4, 37.25, 84.6, 90.7, 146.5, 152.8, 199.2, 234.7], opts: { h: 11.8, n: 2, mat: 'fasBirzh' } },
  osm: ['r4074054', 'w362785969', 'w362785970', 'w102582397', 'w128494897'] };
export const TUCHKOV = { id: 'tuchkov', name: 'Тучков мост', nameEn: 'Tuchkov Bridge', cx: -3739.33, cz: -1752.05, b: 34.69, len: 219.6, hw: 18.0, road: 14.5, kerbW: 0.3, kerbH: 0.75, crown: 3.2,
  piers: [[74.5, 82.3, 'tower'], [134.7, 142.5, 'tower']], spans: ['girder', 'bascule', 'girder'],
  look: { fas: 'fasTuchkov', dark: 'fasTuchkovDark', granite: 'granitePink', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'steel' },
  rail: { kind: 'hairpin', hex: '#56665e', bay: 2.4 }, depth: { fascia: 0, pier: 2.9, mid: 1.05, bank: 2.4 }, pavilions: 1,
  marks: { solid: [-3.3, 3.3], dash: [-11, -7.4, 7.4, 11] }, tracks: [[-3736.9, -1749.9, -3612.0, -1932.0, 1.75], [-3740.9, -1752.4, -3617.9, -1935.3, -1.75]],
  tramWires: true,                                                  // (Vasilievsky Island second pass) contact wires of the two tracks over the deck, hung from the lamps: streets stops its wires at the bridge
  lamps: { kind: 'cobra', u: [6, 34, 62, 96, 121, 158, 186, 213], opts: { h: 10, mat: 'steel' } },
  osm: ['r4074067', 'w305504281', 'w305509466', 'w305504282', 'w305509467', 'w305504283', 'w305504284'] };
export const SAMPS = { id: 'samps', name: 'Сампсониевский мост', nameEn: 'Sampsonievsky Bridge', cx: -885.02, cz: -2841.68, b: 85.84, len: 207, hw: 13.5, road: 10.5, kerbW: 0.3, kerbH: 0.4, crown: 2.4,
  piers: [[16.5, 25.5, 'abut'], [51.5, 56.5, 'slim'], [83.5, 88.5, 'slim'], [118.5, 123.5, 'slim'], [150.5, 155.5, 'slim'], [181.5, 190.5, 'abut']], spans: ['stone', 'girder', 'girder', 'bascule', 'girder', 'girder', 'stone'],
  stone: [[4.5, 16.5], [190.5, 202.5]],
  look: { fas: 'fasSamps', dark: 'fasSampsDark', granite: 'graniteSalmon', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'ringbal', hex: '#35543f', bay: 2.0, posts: 'round' }, depth: { fascia: 0, pier: 2.3, mid: 1.0 },
  marks: { solid: [-3.3, 3.3], dash: [-6.9, 6.9] }, tracks: [[-884.8, -2839.2, -679.3, -2854.3, 1.75], [-885.0, -2842.6, -680.2, -2857.7, -1.75]],
  lamps: { kind: 'ring', u: [21, 54, 86, 121, 153, 186], opts: { h: 9.5, n: 5, mat: 'fasSampsDark' }, onPier: true },
  osm: ['w117802281', 'w333119579', 'w333119586', 'w1172626338', 'w1172626340', 'w333119581', 'w333119584'] };
// ---- the Zhdanovka (Petrograd side <-> Petrovsky Island): two single-span bridges (docs/research/petro-bridges.md section 6, photos 49 - 52)
//   zhdanovsky  Ждановский мост (1989-92): the 35 m wide pedestrian deck to the Petrovsky stadium, a flat blue-grey girder with a curved soffit on light grey granite abutments, thin silver railing,
//               four corner poles with five white globes; asphalt deck without a roadway (ped: no kerb barriers, no markings)
//   kursant     мост Красного Курсанта (1962): a shallow haunched pale concrete girder (2.2 m at the abutments, 0.8 m at mid-span), grey granite abutments with a solid parapet block over each,
//               dark green railing `barsring` (bars under a double rail with small rings), four plain grey poles; 2 lanes
export const ZHDANOVSKY = { id: 'zhdanovsky', name: 'Ждановский мост', nameEn: 'Zhdanovsky Bridge', ww: 'zhdanovka', cx: -3613.39, cz: -2368.99, b: 215.11, len: 32.2, hw: 17.5, road: 17.0, kerbW: 0.2, kerbH: 0.15, crown: 0.45, ped: true, lowKerb: true,
  piers: [], spans: ['girder'], look: { fas: 'fasZhdan', dark: 'fasTuchkovDark', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'hpipes', hex: '#a9b8c2', bay: 2.0 }, depth: { fascia: 0, pier: 1.7, mid: 0.75 }, marks: { solid: [], dash: [] }, tracks: null, walk: [6, 14],
  lamps: { kind: 'globes5', u: [1.2, 31.0], v: 16.6, opts: { h: 6.6, mat: 'steel' } }, osm: ['w305509688', 'w78518198', 'w305509687'] };
export const KURSANT = { id: 'kursant', name: 'мост Красного Курсанта', nameEn: 'Krasnogo Kursanta Bridge', ww: 'zhdanovka', cx: -3944.14, cz: -2525.85, b: 34.62, len: 42.0, hw: 11.0, road: 6.0, kerbW: 0.3, kerbH: 0.15, crown: 0.4, lowKerb: true,
  piers: [], spans: ['girder'], solidEnds: 6.4, look: { fas: 'concrete', dark: 'fasTuchkovDark', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'barsring', hex: '#3f6048', bay: 2.25 }, depth: { fascia: 0, pier: 2.2, mid: 0.8 }, marks: { solid: [0], dash: [] }, tracks: null,
  lamps: { kind: 'cobra', u: [5, 37], opts: { h: 9, mat: 'steel' } }, osm: ['w305509759', 'w5133174', 'w117969579', 'w379599213'] };
// ---- the Malaya Nevka (Petrogradsky Island <-> Krestovsky Island; docs/research/petro-bridges.md section 7, photos 59 60 61 63 65)
//   bkrest      Большой Крестовский мост (1949-51, Noskov): 135 m, 25.5 m (roadway 21 = 6 lanes, pavements 2.25, a high granite barrier between), five spans with a double-leaf bascule in the
//               middle (22.9 m clear); welded green girders of constant depth; rectangular rusticated CONCRETE piers, the bascule piers PAIRED and joined by a decorative concrete arch; cast-iron
//               railing of slender balusters under interlaced pointed arches between square posts with a rosette (`lancetarc`), granite blocks over the piers with green two-lantern standards.
//               No source gives the span lengths: laid out symmetrically from the 22.9 m opening and photo 61 [E].
//   lazarev     Лазаревский мост (2008-09, Stroyproekt): one cable-stayed span (OSM 120.5 m bank to bank), silver-grey steel; the pylon = TWO parabolic arches across the roadway on common feet
//               at the Krestovsky end (the tall one leans over the span and carries five tube stays per side to the deck edges, the low one leans to the shore and carries the back stays), V struts
//               between them; 2 + 2 lanes, white barrier panels, steel tube railing, plain grey poles.  [E]: arch heights (30 / 18 m), stay anchor spacing.
export const BKREST = { id: 'bkrest', name: 'Большой Крестовский мост', nameEn: 'Bolshoy Krestovsky Bridge', cx: -3917.79, cz: -3808.84, b: 315.89, len: 133.0, hw: 12.75, road: 10.5, kerbW: 0.3, kerbH: 0.75, crown: 2.2,
  piers: [[18.3, 20.7, 'block'], [39.05, 42.85, 'block'], [51.25, 55.05, 'block'], [77.95, 81.75, 'block'], [90.15, 93.95, 'block'], [112.3, 114.7, 'block']], spans: ['girder', 'girder', 'stone', 'bascule', 'stone', 'girder', 'girder'],
  look: { fas: 'fasKrest', dark: 'fasKrestDark', granite: 'concreteRust', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'lancetarc', hex: '#4e8259', bay: 2.4, posts: 'square' }, depth: { fascia: 0, pier: 1.7, mid: 1.6 },
  marks: { solid: [-0.12, 0.12], dash: [-7, -3.5, 3.5, 7] }, tracks: null,
  lamps: { kind: 'cross', u: [2.5, 19.5, 40.95, 53.15, 79.85, 92.05, 113.5, 130.5], opts: { h: 8.5, n: 2, mat: 'fasKrest' }, onPier: true },
  osm: ['r5477979', 'w509508604', 'w509508606', 'w1082134872', 'w368644234', 'w368644239'] };
export const LAZAREV = { id: 'lazarev', name: 'Лазаревский мост', nameEn: 'Lazarevsky Bridge', cx: -4313.03, cz: -3576.86, b: 341.07, len: 120.5, hw: 11.4, road: 7.5, kerbW: 0.5, kerbH: 0.8, crown: 1.6,
  piers: [], spans: ['girder'], look: { fas: 'fasLazarev', dark: 'fasTuchkovDark', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'white' },
  rail: { kind: 'hpipes', hex: '#c3c8cc', bay: 2.0 }, depth: { fascia: 0, pier: 1.7, mid: 1.7 }, marks: { solid: [-0.12, 0.12], dash: [-3.75, 3.75] }, tracks: null,
  lamps: { kind: 'cobra', u: [12, 38, 64, 90], opts: { h: 10, mat: 'steel' } },
  walk: [4.1, 10.2],
  pylon: { u: 117.5, v: 8.5, tall: [30, -8], low: [18, 6], main: [[0.86, 22], [0.74, 42], [0.6, 62], [0.44, 82], [0.26, 100]], back: [[0.72, 12], [0.45, 22]] },
  osm: ['r5478186', 'w403795446', 'w403795447', 'w368663466', 'w368663469'] };
// ---- P7 / P9 (docs/research/petro-bridges.md section 8)
//   grenadersky  Гренадерский мост (1971-75) over the Bolshaya Nevka: 75.75 + 32.0 (double-leaf bascule, 30 m clear) + 75.75, 218.8 m between the abutment backs, 27 m; slender grey-olive steel
//                girders with a curved lower chord (depth 1/61 of the span), two pink granite bascule piers with round towers close together in the middle (OSM relation r3312311), two tram tracks
//   malopetr     Мало-Петровский мост (2016-18) over the Zhdanovka: one 37.5 m span, 36 m wide (12 + 2.6 + 12 m roadway, pavements 3.5), a plain light grey girder of constant depth, concrete barriers,
//                galvanised tube railing, tall poles
//   zhdanovsky4  4-й Ждановский мост (1983-84): a slender humped steel footbridge (66.7 x 2.7 m with its ramps), pale girders, thin dark green bar railing; here the steps of both ends are ramps
//                (the frame is the whole OSM deck way, 49.8 m: 4.5 m / 6.3 m of it lie on the banks, over the grass slopes of the Zhdanovka; the water is 39 m wide)
export const GRENADER = { id: 'grenadersky', name: 'Гренадерский мост', nameEn: 'Grenadersky Bridge', cx: -1022.52, cz: -3928.90, b: 71.2, len: 190.8, hw: 13.5, road: 10.2, kerbW: 0.3, kerbH: 0.5, crown: 2.6, towerRv: 3.6,
  piers: [[71.8, 79.3, 'tower'], [111.4, 118.8, 'tower']], spans: ['girder', 'bascule', 'girder'],
  look: { fas: 'fasGren', dark: 'fasGrenDark', granite: 'granitePink', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'plainrods', hex: '#56665e', bay: 2.0 }, depth: { fascia: 0, pier: 2.4, mid: 1.25, bank: 1.8 },
  marks: { solid: [-4.7, 3.5], dash: [-7.4, 6.6] }, tracks: [[-1022.0, -3927.5, -841.5, -3988.8, 1.55], [-1023.5, -3931.9, -842.5, -3992.5, -2.7]],
  lamps: { kind: 'cobra', u: [6, 36, 64, 127, 155, 185], opts: { h: 10, mat: 'steel' } },
  osm: ['r3312311', 'w36921682', 'w374827148', 'w153720344', 'w194247745', 'w157166680', 'w194299296'] };
export const MALOPETR = { id: 'malopetr', name: 'Мало-Петровский мост', nameEn: 'Malo-Petrovsky Bridge', ww: 'zhdanovka', cx: -4442.11, cz: -3201.61, b: 211.4, len: 36.3, hw: 18.0, road: 13.3, kerbW: 0.4, kerbH: 0.75, crown: 0.5,
  piers: [], spans: ['girder'], look: { fas: 'fasLazarev', dark: 'fasTuchkovDark', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'concrete' },
  rail: { kind: 'hpipes', hex: '#b9bfc4', bay: 2.0 }, depth: { fascia: 0, pier: 1.4, mid: 1.4 }, marks: { solid: [-1.3, 1.3], dash: [-8.8, -5.3, 5.3, 8.8] }, tracks: null,
  lamps: { kind: 'cobra', u: [5, 31], opts: { h: 12, mat: 'steel' } }, osm: ['w305511980', 'w403606022', 'w403606030', 'w253037052', 'w305511982'] };
export const ZHD4 = { id: 'zhdanovsky4', name: '4-й Ждановский мост', nameEn: '4th Zhdanovsky Bridge (footbridge)', ww: 'zhdanovka', cx: -4176.12, cz: -2872.69, b: 65.3, len: 49.8, hw: 1.45, road: 1.25, kerbW: 0.05, kerbH: 0.15, crown: 2.0, ped: true, lowKerb: true,
  piers: [], spans: ['girder'], look: { fas: 'fasPale', dark: 'fasTuchkovDark', granite: 'granitePink', parapet: 'parapetPink', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'plainrods', hex: '#3f5a46', bay: 2.0 }, depth: { fascia: 0, pier: 1.6, mid: 0.8 }, marks: { solid: [], dash: [] }, tracks: null, walk: [0.2, 0.5],
  lamps: { kind: 'cobra', u: [], opts: { h: 5, mat: 'steel' } }, osm: ['w305509975', 'w265080324', 'w933617464', 'w933617465'] };
export const LONG = [BIRZHEVOY, TUCHKOV, SAMPS, ZHDANOVSKY, KURSANT, BKREST, LAZAREV, GRENADER, MALOPETR, ZHD4];

// ---------------------------------------------------------------------------------------------------- the builder
export function buildLong(env, sp) {
  const { ctx, P, M, rails } = env, f = frameOf(sp), T = f.T, waterY = env.waterY, L = ctx.L;
  const LEN = sp.len, HW = sp.hw, ROAD = sp.road, KW = sp.kerbW, PAVE = 0.15, HV = HW + 0.35, yb = -4.7;
  const yDeck = hump(LEN, sp.crown), slopeOf = (u) => yDeck(u + 0.5) - yDeck(u - 0.5);
  const world = (u, v) => ({ x: f.cx + u * f.c - v * f.s, z: f.cz + u * f.s + v * f.c });
  const B = { id: sp.id, x: world(LEN / 2, 0).x, z: world(LEN / 2, 0).z, yDeck, info: { rails: 0, colliders: 0 }, masts: [], span: { a: world(0, 0), b: world(LEN, 0), hw: HW } };
  const U0 = -1.2, U1 = LEN + 1.2;
  B.at = world(LEN / 2, sp.ped ? 0 : (HW + ROAD + KW) / 2);           // photo spot: a pavement at mid-bridge
  B.bounds = frameBounds(sp, U0, U1, -HW - 0.3, HW + 0.3, 1.5);
  B.deckAt = (x, z) => { const q = toUV(sp, x, z); return Math.abs(q.v) <= HW + 0.3 && q.u >= U0 && q.u <= U1 ? yDeck(clamp(q.u, 0, LEN)) : null; };
  const lk = sp.look, fas = M[lk.fas], dark = M[lk.dark], gran = M[lk.granite], par = M[lk.parapet], pave = M[lk.pave], kerbM = M[lk.kerb];
  const faceShape = (mat, pts, v, sg, tile = 2.4, holes = []) => {
    const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
    for (const h of holes) sh.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p[0], p[1]))));
    const g = new THREE.ShapeGeometry(sh, 1), pa = g.attributes.position, ua = g.attributes.uv, na = g.attributes.normal;
    for (let i = 0; i < pa.count; i++) { ua.setXY(i, pa.getX(i) / tile, pa.getY(i) / tile); na.setZ(i, sg); }
    if (sg < 0) { const ix = g.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } }
    P.geo(mat, g, 0, 0, v); g.dispose();
  };
  // the openings: between the bank lines and the piers, in order (a stone span may be shorter than its interval: the rest is the abutment wall)
  const edges = [0, ...sp.piers.flatMap((p) => [p[0], p[1]]), LEN], SP = [];
  for (let k = 0; k < sp.spans.length; k++) { let a = edges[2 * k], b = edges[2 * k + 1]; const kind = sp.spans[k]; if (kind === 'stone' && sp.stone) { const s = sp.stone[k === 0 ? 0 : 1]; a = s[0]; b = s[1]; } SP.push({ a, b, kind, k, bankA: k === 0, bankB: k === sp.spans.length - 1 }); }
  const D = sp.depth, SPRING = waterY + 1.3;
  /** girder depth under the deck at u of span s (haunched: deep at the river piers, thinnest in between) */
  const depthOf = (s, u) => {
    const t = (u - s.a) / (s.b - s.a), dA = s.bankA ? (D.bank ?? D.pier) : D.pier, dB = s.bankB ? (D.bank ?? D.pier) : D.pier, t0 = s.bankA && !s.bankB ? 0.42 : s.bankB && !s.bankA ? 0.58 : 0.5;
    return t < t0 ? D.mid + (dA - D.mid) * Math.pow(1 - t / t0, 2) : D.mid + (dB - D.mid) * Math.pow((t - t0) / (1 - t0), 2);
  };
  const stoneArc = (s, n = 14, grow = 0) => {
    const c = (s.b - s.a) / 2, mid = (s.a + s.b) / 2, cy = yDeck(mid) - 1.0, fr = cy - SPRING, R = (c * c + fr * fr) / (2 * fr), y0 = cy - R, a0 = Math.asin(c / R), pts = [];
    for (let i = 0; i <= n; i++) { const al = -a0 + 2 * a0 * i / n; pts.push([mid + Math.sin(al) * (R + grow), y0 + Math.cos(al) * (R + grow)]); }
    return pts;
  };
  const ribOf = (s, u) => { const mid = (s.a + s.b) / 2, t = (u - mid) / ((s.b - s.a) / 2), yc = Math.min(SPRING + sp.rise[s.k], yDeck(mid) - D.fascia - 0.75); return SPRING + (yc - SPRING) * (1 - t * t); };   // centre line of a welded arch rib

  P.push(f.cx, 0, f.cz, -T);
  // ------------------------------------------------------------------ fascia + structure per opening (both faces), soffits
  for (const s of SP) {
    const { a, b } = s, Ls = b - a, n = Math.max(6, Math.round(Ls / 2.5));
    if (s.kind === 'stone') {
      const w0 = s.bankA ? U0 : a - 0.01, w1 = s.bankB ? U1 : b + 0.01, arc = stoneArc(s), nT = Math.max(2, Math.ceil((w1 - w0) / 3));
      for (const sg of [-1, 1]) {
        const top = []; for (let i = nT; i >= 0; i--) { const u = w0 + (w1 - w0) * i / nT; top.push([u, yDeck(u) + PAVE - 0.02]); }
        faceShape(gran, [[w0, yb], [w1, yb], ...top], sg * HV, sg, 2.2, [[[a, yb + 0.2], ...arc, [b, yb + 0.2]]]);
        const out = stoneArc(s, 14, 0.7), vz = sg * (HV + 0.06);
        for (let i = 0; i < 14; i++) { P.quad(M.voussoir, [arc[i][0], arc[i][1], vz], [arc[i + 1][0], arc[i + 1][1], vz], [out[i + 1][0], out[i + 1][1], vz], [out[i][0], out[i][1], vz], [0, 0, sg], [[i * 0.5, 0], [i * 0.5 + 0.5, 0], [i * 0.5 + 0.5, 0.35], [i * 0.5, 0.35]]); P.quad(M.voussoir, [out[i][0], out[i][1], vz], [out[i + 1][0], out[i + 1][1], vz], [out[i + 1][0], out[i + 1][1], sg * HV], [out[i][0], out[i][1], sg * HV], [0, 1, 0]); }
        for (let i = 0; i < nT; i++) { const u0 = w0 + (w1 - w0) * i / nT, u1 = w0 + (w1 - w0) * (i + 1) / nT, y0 = yDeck(u0) + PAVE, y1 = yDeck(u1) + PAVE, vo = sg * (HV + 0.16); P.quad(M.coping, [u0, y0 - 0.28, vo], [u1, y1 - 0.28, vo], [u1, y1 - 0.04, vo], [u0, y0 - 0.04, vo], [0, 0, sg]); P.quad(M.coping, [u0, y0 - 0.04, vo], [u1, y1 - 0.04, vo], [u1, y1 - 0.04, sg * HV], [u0, y0 - 0.04, sg * HV], [0, 1, 0]); }
      }
      for (let i = 0; i < 14; i++) P.quad(M.graniteDark, [arc[i][0], arc[i][1], -HV], [arc[i + 1][0], arc[i + 1][1], -HV], [arc[i + 1][0], arc[i + 1][1], HV], [arc[i][0], arc[i][1], HV], [0, -1, 0], [[arc[i][0] / 2.2, -HV / 2.2], [arc[i + 1][0] / 2.2, -HV / 2.2], [arc[i + 1][0] / 2.2, HV / 2.2], [arc[i][0] / 2.2, HV / 2.2]]);
      for (const [uu, nx] of [[a, 1], [b, -1]]) if (!sp.piers.some((q) => Math.abs(q[0] - uu) < 0.02 || Math.abs(q[1] - uu) < 0.02)) P.quad(M.graniteDark, [uu, yb, -HV], [uu, yb, HV], [uu, SPRING, HV], [uu, SPRING, -HV], [nx, 0, 0], [[-HV / 2.2, yb / 2.2], [HV / 2.2, yb / 2.2], [HV / 2.2, SPRING / 2.2], [-HV / 2.2, SPRING / 2.2]]);
      continue;
    }
    if (s.kind === 'arch') {
      // fascia girder under the deck, the flat box rib, slender spandrel posts; four ribs across (the inner ones dark)
      const fb = (u) => yDeck(u) - 0.2 - D.fascia;
      for (const sg of [-1, 1]) { const pts = []; for (let i = 0; i <= n; i++) { const u = a + Ls * i / n; pts.push([u, fb(u)]); } for (let i = n; i >= 0; i--) { const u = a + Ls * i / n; pts.push([u, yDeck(u) - 0.2]); } faceShape(fas, pts, sg * (HW + 0.02), sg, 2.6); }
      for (let i = 0; i < n; i++) { const u0 = a + Ls * i / n, u1 = a + Ls * (i + 1) / n; P.quad(dark, [u0, fb(u0), -HW], [u1, fb(u1), -HW], [u1, fb(u1), HW], [u0, fb(u0), HW], [0, -1, 0]); }
      for (const vv of [-HW + 0.5, HW - 0.5, -HW / 3, HW / 3]) {
        const outer = Math.abs(vv) > HW / 2, sg0 = vv < 0 ? -1 : 1, lo = [], hi = [];
        for (let i = 0; i <= n; i++) { const u = a + Ls * i / n, y = ribOf(s, u); lo.push([u, y - 0.48]); hi.push([u, Math.min(y + 0.48, fb(u) + 0.05)]); }
        for (const side of outer ? [sg0] : [-1, 1]) faceShape(outer ? fas : dark, lo.concat(hi.slice().reverse()), vv + side * 0.4, side, 2.6);
        if (!outer) continue;
        for (let i = 0; i < n; i++) P.quad(dark, [lo[i][0], lo[i][1], vv - 0.4], [lo[i + 1][0], lo[i + 1][1], vv - 0.4], [lo[i + 1][0], lo[i + 1][1], vv + 0.4], [lo[i][0], lo[i][1], vv + 0.4], [0, -1, 0]);
        const np = Math.round(Ls / 3.0);
        for (let i = 1; i < np; i++) { const u = a + Ls * i / np, y0 = ribOf(s, u) + 0.44, y1 = fb(u); if (y1 - y0 > 0.25) P.box(fas, u - 0.15, u + 0.15, y0, y1, vv + sg0 * 0.4 - 0.3, vv + sg0 * 0.4, 'tb', 1); }
      }
    } else {
      // plate girder with a haunched soffit (a double-leaf bascule: deep at both piers, a joint at mid-span): face, stiffeners, bottom flange, soffit, inner girders
      const lo = (u) => yDeck(u) - 0.2 - depthOf(s, u);
      for (const sg of [-1, 1]) {
        const pts = []; for (let i = 0; i <= n; i++) { const u = a + Ls * i / n; pts.push([u, lo(u)]); } for (let i = n; i >= 0; i--) { const u = a + Ls * i / n; pts.push([u, yDeck(u) - 0.2]); }
        const vf = sg * (HW + 0.02); faceShape(fas, pts, vf, sg, 2.6);
        const ns = Math.round(Ls / 2.6);
        for (let i = 1; i < ns; i++) { const u = a + Ls * i / ns; P.box(fas, u - 0.05, u + 0.05, lo(u) + 0.05, yDeck(u) - 0.45, Math.min(vf, vf + sg * 0.09), Math.max(vf, vf + sg * 0.09), 'tb', 1); }
        for (let i = 0; i < n; i++) { const u0 = a + Ls * i / n, u1 = a + Ls * (i + 1) / n; P.quad(fas, [u0, lo(u0), vf + sg * 0.14], [u1, lo(u1), vf + sg * 0.14], [u1, lo(u1) + 0.16, vf + sg * 0.14], [u0, lo(u0) + 0.16, vf + sg * 0.14], [0, 0, sg]); P.quad(fas, [u0, lo(u0) + 0.16, vf + sg * 0.14], [u1, lo(u1) + 0.16, vf + sg * 0.14], [u1, lo(u1) + 0.16, vf], [u0, lo(u0) + 0.16, vf], [0, 1, 0]); }
        if (s.kind === 'bascule') { const um = (a + b) / 2; P.box(dark, um - 0.06, um + 0.06, lo(um) - 0.02, yDeck(um) - 0.2, Math.min(vf, vf + sg * 0.16), Math.max(vf, vf + sg * 0.16), 'b', 1); }
      }
      for (let i = 0; i < n; i++) { const u0 = a + Ls * i / n, u1 = a + Ls * (i + 1) / n; P.quad(dark, [u0, lo(u0), -HW - 0.16], [u1, lo(u1), -HW - 0.16], [u1, lo(u1), HW + 0.16], [u0, lo(u0), HW + 0.16], [0, -1, 0]); }
    }
  }
  // the deck cornice (both faces, the whole length) and the soffit strip over the piers
  { const nc = Math.ceil((U1 - U0) / 3);
    for (const sg of [-1, 1]) for (let i = 0; i < nc; i++) { const u0 = U0 + (U1 - U0) * i / nc, u1 = U0 + (U1 - U0) * (i + 1) / nc, y0 = yDeck(u0), y1 = yDeck(u1), v = sg * HW, um = (u0 + u1) / 2, stone = SP.some((s) => s.kind === 'stone' && um > (s.bankA ? U0 : s.a) - 0.1 && um < (s.bankB ? U1 : s.b) + 0.1); if (stone) continue; const cm = M.copingDark;
      P.quad(cm, [u0, y0 - 0.22, v + sg * 0.14], [u1, y1 - 0.22, v + sg * 0.14], [u1, y1 + PAVE, v + sg * 0.14], [u0, y0 + PAVE, v + sg * 0.14], [0, 0, sg]);
      P.quad(cm, [u0, y0 + PAVE, v + sg * 0.14], [u1, y1 + PAVE, v + sg * 0.14], [u1, y1 + PAVE, v - sg * 0.3], [u0, y0 + PAVE, v - sg * 0.3], [0, 1, 0]);
      P.quad(cm, [u0, y0 - 0.22, v + sg * 0.14], [u1, y1 - 0.22, v + sg * 0.14], [u1, y1 - 0.22, v], [u0, y0 - 0.22, v], [0, -1, 0]); } }
  // ------------------------------------------------------------------ piers
  const nose = (mat, pm, sg, vc, R, rv, y0, y1, seg = 10, cap = M.coping) => {      // half elliptic cylinder beyond the line v = sg * vc (radius R along u, rv across), with a flat top
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * i / seg, a1 = Math.PI * (i + 1) / seg, p0 = [pm - Math.cos(a0) * R, sg * (vc + Math.sin(a0) * rv)], p1 = [pm - Math.cos(a1) * R, sg * (vc + Math.sin(a1) * rv)], am = (a0 + a1) / 2;
      P.quad(mat, [p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]], [-Math.cos(am), 0, sg * Math.sin(am)], [[a0 * R / 2.2, y0 / 2.2], [a1 * R / 2.2, y0 / 2.2], [a1 * R / 2.2, y1 / 2.2], [a0 * R / 2.2, y1 / 2.2]]);
      if (cap) P.fan(cap, [[pm, y1, sg * vc], [p0[0], y1, p0[1]], [p1[0], y1, p1[1]]], [0, 1, 0]);
    }
  };
  const pedestals = [];                                               // granite blocks at the deck edge over the piers: { u, hu, sg } (the railing stops at them, lamps stand on them)
  for (const [pa, pb, kind] of sp.piers) {
    const pm = (pa + pb) / 2, hu = (pb - pa) / 2, top = yDeck(pm) - 0.22, deckTop = yDeck(pm) + PAVE;
    P.box(gran, pa, pb, yb, top, -HV, HV, 'tbfk', 2.2);                                                              // the two faces toward the openings
    for (const sg of [-1, 1]) {
      faceShape(gran, [[pa, yb], [pb, yb], [pb, yDeck(pb) + PAVE - 0.02], [pa, yDeck(pa) + PAVE - 0.02]], sg * HV, sg, 2.2);
      if (kind === 'tower') {                                         // a massive bascule pier: round towers beyond both faces up to the deck, a cornice ring, a solid parapet round the balcony
        const R = hu + 0.1, rv = sp.towerRv || (sp.id === 'tuchkov' ? 4.2 : 6.2), yT = deckTop - 0.02;
        nose(gran, pm, sg, HV, R, rv, yb, yT, 12);
        nose(M.coping, pm, sg, HV, R + 0.18, rv + 0.18, yT - 1.5, yT - 1.22, 12, M.coping);
        nose(par, pm, sg, HV, R, rv, yT, yT + 1.0, 12, M.coping);
        if (sp.pavilions && sg > 0) {                                 // Tuchkov: a round pavilion with a band of dark windows and a shallow light dome on the upstream tower
          const pv = sg * (HV + 1.3);
          P.cyl(M.pavilion, [pm, yT, pv], [pm, yT + 2.9, pv], 2.3, 2.3, 16, false);
          P.cyl(M.darkGlass, [pm, yT + 1.15, pv], [pm, yT + 2.2, pv], 2.34, 2.34, 16, false);
          P.cyl(M.pavilion, [pm, yT + 2.9, pv], [pm, yT + 3.1, pv], 2.55, 2.55, 16, true);
          P.geo(M.pavilionRoof, new THREE.SphereGeometry(1, 16, 4, 0, Math.PI * 2, 0, Math.PI / 2), pm, yT + 3.1, pv, 0, 0, 0, 2.45, 0.9, 2.45);
        }
        pedestals.push({ u: pm, hu: hu + 0.3, sg, full: true });
      } else {                                                        // a slim pier / an abutment pier: a rounded cutwater with a cone cap, a pedestal block up to the parapet level
        const R = hu + 0.12, rv = Math.min(R * 0.9, 3.2), yT = top - 1.4;
        if (kind === 'block') { const q0 = Math.min(sg * HV, sg * (HV + 0.14)), q1 = Math.max(sg * HV, sg * (HV + 0.14)); P.box(M.coping, pa - 0.12, pb + 0.12, top - 1.0, top - 0.72, q0, q1, '', 1.4); P.box(M.coping, pa - 0.1, pb + 0.1, waterY + 0.5, waterY + 0.75, q0, q1, '', 1.4); }   // a rectangular pier (no cutwater): a cornice and a plinth band on its face
        else {
        nose(gran, pm, sg, HV, R, rv, yb, yT, 10, null);
        nose(M.coping, pm, sg, HV, R + 0.12, rv + 0.12, yT - 0.24, yT, 10, null);
        for (let i = 0; i < 10; i++) { const a0 = Math.PI * i / 10, a1 = Math.PI * (i + 1) / 10; P.fan(gran, [[pm, yT + 1.0, sg * (HV + 0.2)], [pm - Math.cos(a0) * R, yT, sg * (HV + Math.sin(a0) * rv)], [pm - Math.cos(a1) * R, yT, sg * (HV + Math.sin(a1) * rv)]], [-Math.cos((a0 + a1) / 2) * 0.5, 0.8, sg * 0.5], (p) => [p[0] / 2.2, p[2] / 2.2]); }
        }
        const pw = Math.min(hu, 1.3), v0 = sg * (HW - 0.34), v1 = sg * (HV + 0.5);
        P.box(gran, pm - pw, pm + pw, top - 1.0, deckTop + 1.1, Math.min(v0, v1), Math.max(v0, v1), 'b', 2.2);
        P.box(M.coping, pm - pw - 0.08, pm + pw + 0.08, deckTop + 1.1, deckTop + 1.24, Math.min(v0, v1) - 0.08, Math.max(v0, v1) + 0.08, '', 1.4);
        pedestals.push({ u: pm, hu: pw, sg, top: deckTop + 1.24 });
      }
    }
  }
  // abutment faces under the deck at both bank lines
  for (const [uu, nx] of [[0, 1], [LEN, -1]]) P.quad(gran, [uu + nx * 0.1, yb, -HV], [uu + nx * 0.1, yb, HV], [uu + nx * 0.1, yDeck(uu) - 0.2, HV], [uu + nx * 0.1, yDeck(uu) - 0.2, -HV], [nx, 0, 0], [[-HV / 2.2, yb / 2.2], [HV / 2.2, yb / 2.2], [HV / 2.2, 0], [-HV / 2.2, 0]]);

  // ------------------------------------------------------------------ deck: asphalt roadway, barrier kerbs, pavements, markings, tram rails
  const trk = (sp.tracks || []).map(([x0, z0, x1, z1, vm]) => { const a = toUV(sp, x0, z0), b = toUV(sp, x1, z1); return [a.v, b.v, vm]; });
  const trackV = (k, u) => { const [v0, v1, vm] = trk[k], e = (t) => t * t * (3 - 2 * t); return u < 30 ? v0 + (vm - v0) * e(clamp(u / 30, 0, 1)) : u > LEN - 30 ? v1 + (vm - v1) * e(clamp((LEN - u) / 30, 0, 1)) : vm; };
  const nD = Math.ceil((U1 - U0) / 3.2);
  for (let i = 0; i < nD; i++) {
    const u0 = U0 + (U1 - U0) * i / nD, u1 = U0 + (U1 - U0) * (i + 1) / nD, y0 = yDeck(u0), y1 = yDeck(u1), um = (u0 + u1) / 2;
    P.quad(M.asphalt, [u0, y0, -ROAD], [u1, y1, -ROAD], [u1, y1, ROAD], [u0, y0, ROAD], [0, 1, 0], [[u0 / 4, -ROAD / 4], [u1 / 4, -ROAD / 4], [u1 / 4, ROAD / 4], [u0 / 4, ROAD / 4]]);
    const kh = um < 2.5 || um > LEN - 2.5 ? PAVE : sp.kerbH;
    for (const sg of [-1, 1]) {
      const va = sg * ROAD, vk = sg * (ROAD + KW), vb = sg * (HW + 0.1);
      P.quad(pave, [u0, y0 + PAVE, vk], [u1, y1 + PAVE, vk], [u1, y1 + PAVE, vb], [u0, y0 + PAVE, vb], [0, 1, 0], [[u0 / 2.4, vk / 2.4], [u1 / 2.4, vk / 2.4], [u1 / 2.4, vb / 2.4], [u0 / 2.4, vb / 2.4]]);
      P.quad(kerbM, [u0, y0, va], [u1, y1, va], [u1, y1 + kh, va], [u0, y0 + kh, va], [0, 0, -sg], [[u0, 0], [u1, 0], [u1, kh], [u0, kh]]);
      P.quad(kerbM, [u0, y0 + kh, va], [u1, y1 + kh, va], [u1, y1 + kh, vk], [u0, y0 + kh, vk], [0, 1, 0], [[u0, 0], [u1, 0], [u1, KW], [u0, KW]]);
      if (kh > PAVE) P.quad(kerbM, [u0, y0 + PAVE, vk], [u1, y1 + PAVE, vk], [u1, y1 + kh, vk], [u0, y0 + kh, vk], [0, 0, sg], [[u0, 0], [u1, 0], [u1, kh], [u0, kh]]);
    }
    const mk = (vc, hw) => P.quad(M.mark, [u0, y0 + 0.03, vc - hw], [u1, y1 + 0.03, vc - hw], [u1, y1 + 0.03, vc + hw], [u0, y0 + 0.03, vc + hw], [0, 1, 0]);
    if (um > 5 && um < LEN - 5) { for (const vc of sp.marks.solid) mk(vc, 0.06); if (i % 3 !== 2) for (const vc of sp.marks.dash) mk(vc, 0.06); }
    const ra = Math.max(u0, 0), rb = Math.min(u1, LEN);              // the rails stop at the bank lines (the street rails run on from there)
    if (rb > ra + 0.05) for (let k = 0; k < trk.length; k++) { const vc0 = trackV(k, ra), vc1 = trackV(k, rb), ya = yDeck(ra), yc = yDeck(rb); for (const dv of [-0.76, 0.76]) P.quad(M.tramRail, [ra, ya + 0.035, vc0 + dv - 0.035], [rb, yc + 0.035, vc1 + dv - 0.035], [rb, yc + 0.035, vc1 + dv + 0.035], [ra, ya + 0.035, vc0 + dv + 0.035], [0, 1, 0]); }
  }
  // ------------------------------------------------------------------ railings: cast panels (instanced) between the granite blocks; granite parapets over stone spans and tower piers
  const solid = [];                                                   // [u0, u1] intervals with a granite parapet instead of the metal railing
  for (const s of SP) if (s.kind === 'stone') solid.push([s.bankA ? U0 : s.a - 0.01, s.bankB ? U1 : s.b + 0.01]);
  for (const [pa, pb, kind] of sp.piers) if (kind === 'tower' || kind === 'abut') solid.push([pa - 0.3, pb + 0.3]);
  if (sp.solidEnds) solid.push([U0, sp.solidEnds], [LEN - sp.solidEnds, U1]);                     // a solid granite parapet block over each abutment
  solid.sort((p, q) => p[0] - q[0]);
  const merged = []; for (const iv of solid) { const l = merged[merged.length - 1]; if (l && iv[0] <= l[1] + 0.05) l[1] = Math.max(l[1], iv[1]); else merged.push(iv.slice()); }
  for (const sg of [-1, 1]) {
    const v = sg * (HW - 0.14), cuts = merged.concat(pedestals.filter((q) => q.sg === sg && !q.full).map((q) => [q.u - q.hu, q.u + q.hu])).sort((p, q) => p[0] - q[0]);
    let u = U0; const runs = [];
    for (const c of cuts) { if (c[0] > u + 0.3) runs.push([u, c[0]]); u = Math.max(u, c[1]); }
    if (U1 > u + 0.3) runs.push([u, U1]);
    for (const [ra, rb] of runs) {
      const nb = Math.max(1, Math.round((rb - ra) / sp.rail.bay)), bw = (rb - ra) / nb, ironMat = ctx.mat.toon(sp.rail.hex, { paint: 0.03, name: 'brg-' + sp.id + '-rail' });
      for (let i = 0; i < nb; i++) {
        const ua = ra + bw * i, w = world(ua + 0.03, v);
        rails.add({ kind: sp.rail.kind, hex: sp.rail.hex, x: w.x, y: yDeck(ua) + PAVE, z: w.z, rotY: -T, roll: Math.atan(slopeOf(ua + bw / 2)), len: bw - 0.06 }); B.info.rails++;
      }
      if (sp.rail.posts === 'square') for (let i = 0; i <= nb; i++) { const up = ra + bw * i, y = yDeck(up) + PAVE; P.box(ironMat, up - 0.11, up + 0.11, y, y + 1.14, v - 0.11, v + 0.11, 'b', 1); P.box(ironMat, up - 0.14, up + 0.14, y + 1.14, y + 1.2, v - 0.14, v + 0.14, 'b', 1); for (const s2 of [-1, 1]) P.cyl(ironMat, [up, y + 0.95, v + s2 * 0.11], [up, y + 0.95, v + s2 * 0.13], 0.06, 0.06, 8, true); }   // square posts with a rosette
      if (sp.rail.posts === 'round') for (let i = 0; i <= nb; i++) { const up = ra + bw * i, y = yDeck(up) + PAVE; P.cyl(ironMat, [up, y, v], [up, y + 1.15, v], 0.1, 0.1, 8, false); P.cyl(ironMat, [up, y, v], [up, y + 0.12, v], 0.14, 0.12, 8, false); P.geo(ironMat, new THREE.SphereGeometry(1, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2), up, y + 1.15, v, 0, 0, 0, 0.12, 0.1, 0.12); }
    }
    // n4spb (docs/AREAS.md 13.7): the solid granite parapet runs are rows of breakable SECTIONS (bridges/rails.js parapet(): a plain 0.46 m box section, instanced, one knock record and one collider each) instead of merged quads
    for (const [pa, pb] of merged) {
      const n = Math.max(1, Math.ceil((pb - pa) / 2.4));
      for (let i = 0; i < n; i++) {
        const u0 = pa + (pb - pa) * i / n, u1 = pa + (pb - pa) * (i + 1) / n, p0 = world(u0, v), p1 = world(u1, v);
        rails.parapet({ x0: p0.x, z0: p0.z, x1: p1.x, z1: p1.z, y: yDeck(u0) + PAVE - 0.05, ye: yDeck(u1) + PAVE - 0.05, h: 1.15, th: 0.46, mat: par, box: true, center: true }); B.info.rails++;
      }
    }
  }
  // ------------------------------------------------------------------ lamp standards
  // n4spb (docs/AREAS.md 13.7): a standard that stands on the deck is a KNOCK record (bridges/knock-posts.js: one geometry per kind, instanced, a collider and a record each); one on a pier block (`ped`) stays in the merged geometry
  const lampAt = [], KP = postBatch('brg-' + sp.id);
  for (const sg of [-1, 1]) for (const u of sp.lamps.u) {
    const ped = sp.lamps.onPier && pedestals.find((q) => q.sg === sg && Math.abs(q.u - u) < 6 && q.top !== undefined);
    const uu = ped ? ped.u : u, v = sg * (ped ? HW + 0.25 : sp.lamps.v ? sp.lamps.v : sp.lamps.kind === 'cross' ? HW - 0.75 : ROAD + KW + 0.35), y = ped ? ped.top : yDeck(uu) + PAVE, mat = M[sp.lamps.opts.mat];
    const rot = sp.lamps.kind === 'cobra' && sg > 0 ? Math.PI : 0, opts = { ...sp.lamps.opts, mat };
    const drawLamp = (Q, x, yy, z, r) => {
      if (sp.lamps.kind === 'cross') lampCross(Q, M, x, yy, z, r, opts);
      else if (sp.lamps.kind === 'ring') lampRing(Q, M, x, yy, z, r, opts);
      else if (sp.lamps.kind === 'globes5') lampGlobes5(Q, M, x, yy, z, r, opts);
      else lampCobra(Q, M, x, yy, z, r, opts);
    };
    if (ped) drawLamp(P, uu, y, v, rot);
    else { const w = world(uu, v); KP.add(sp.lamps.kind + (rot ? 'r' : ''), (Q) => drawLamp(Q, 0, 0, 0, 0), { x: w.x, y, z: w.z, rotY: -T + rot }, { x: w.x, z: w.z, r: sp.lamps.kind === 'globes5' ? 0.16 : 0.28, y0: yDeck(uu) - 1, y1: yDeck(uu) + 9 }, sp.lamps.opts.h); }
    lampAt.push({ u: uu, v, ped: !!ped }); B.masts.push({ ...world(uu, v), y, h: sp.lamps.opts.h, kind: sp.lamps.kind });
  }
  // tram contact wires over the deck (streets/wires.js does not wire tracks on bridges: request 10 of vo-requests-streets.md; second pass of the Vasilievsky Island round, only for specs with tramWires: Tuchkov): one
  // wire 5.7 m over the axis of each track from bank line to bank line, hung with hangers from cross-spans between the cobra lamps of the two sides (cable 9.2 m over the deck, 1.1 m sag), the two ends
  // anchored by a stay to the nearest lamp top
  if (sp.tramWires && sp.tracks && ctx.wires && lampAt.length) {
    const W = ctx.wires, H = 5.7, vals = lampAt.filter((l) => l.v < 0).map((l) => l.u).filter((u) => lampAt.some((l) => l.v > 0 && Math.abs(l.u - u) < 0.5)).sort((a, b) => a - b);
    if (vals.length >= 2) {
      const wy = (u) => yDeck(clamp(u, 0, LEN)) + PAVE + H, hl = sp.lamps.opts.h - 0.8;
      const vL = lampAt.find((l) => l.v < 0).v, vR = lampAt.find((l) => l.v > 0).v;
      const sup = [0, ...vals.filter((u) => u > 6 && u < LEN - 6), LEN];
      for (let k = 0; k < trk.length; k++) {
        const pts = [];
        for (let a = 0; a + 1 < sup.length; a++) {
          const n = Math.max(2, Math.round((sup[a + 1] - sup[a]) / 3));
          for (let i = a ? 1 : 0; i <= n; i++) { const t = i / n, u = sup[a] + (sup[a + 1] - sup[a]) * t, w = world(u, trackV(k, u)); pts.push([w.x, wy(u) - 0.12 * 4 * t * (1 - t), w.z]); }
        }
        W.add(pts, { width: 0.03, color: '#1d1f22' });
      }
      for (const u of sup.slice(1, -1)) {
        const cab = [], n = 12, y0 = yDeck(u) + PAVE + hl;
        for (let i = 0; i <= n; i++) { const t = i / n, w = world(u, vL + (vR - vL) * t); cab.push([w.x, y0 - 1.1 * 4 * t * (1 - t), w.z]); }
        W.add(cab, { width: 0.022, color: '#2a2d31' });
        for (let k = 0; k < trk.length; k++) { const v = trackV(k, u), t = (v - vL) / (vR - vL), w = world(u, v); W.add([[w.x, y0 - 1.1 * 4 * t * (1 - t), w.z], [w.x, wy(u), w.z]], { width: 0.018, color: '#2a2d31' }); }
      }
      for (const [uEnd, uLamp, vLamp] of [[0, vals[0], vL], [LEN, vals[vals.length - 1], vR]]) for (let k = 0; k < trk.length; k++) {
        const a = world(uEnd, trackV(k, uEnd)), b = world(uLamp, vLamp);
        W.add([[a.x, wy(uEnd), a.z], [b.x, yDeck(uLamp) + PAVE + hl, b.z]], { width: 0.02, color: '#2a2d31' });
      }
      B.info.tramWires = trk.length;
    }
  }
  // the cable-stayed pylon (Lazarevsky): two parabolic steel arches across the roadway on common feet, the tall one leaning over the span, the low one toward the shore, zigzag struts between
  // them, tube stays to the deck edges, back stays to anchor blocks behind the abutment (an anchor is skipped where a building, a carriageway or water lies)
  const pylonFeet = [], anchors = [];
  if (sp.pylon) {
    const py = sp.pylon, u0 = py.u, hv = py.v, yB = yDeck(u0) + PAVE, pm = M.pylonSilver, stay = M.white;
    const arch = (a, t) => [u0 + a[1] * (1 - t * t), yB + a[0] * (1 - t * t), hv * t];
    for (const a of [py.tall, py.low]) { const n = 28; for (let i = 0; i < n; i++) { const t0 = -1 + 2 * i / n, t1 = -1 + 2 * (i + 1) / n; P.cyl(pm, arch(a, t0), arch(a, t1), 0.62 + 0.3 * Math.abs(t0), 0.62 + 0.3 * Math.abs(t1), 8, false); } }
    for (const sg of [-1, 1]) {
      P.box(pm, u0 - 1.0, u0 + 1.0, yB - 0.02, yB + 1.3, sg * hv - 0.7, sg * hv + 0.7, 'b', 1);
      P.box(M.fasTuchkovDark, u0 - 1.08, u0 + 1.08, yB - 0.02, yB + 0.25, sg * hv - 0.78, sg * hv + 0.78, 'b', 1);
      pylonFeet.push([u0, sg * hv]);
      const tT = [0.62, 0.72, 0.82, 0.9], tL = [0.35, 0.55, 0.75];
      for (let i = 0; i < tL.length; i++) { P.cyl(pm, arch(py.tall, sg * tT[i]), arch(py.low, sg * tL[i]), 0.13, 0.13, 6, false); P.cyl(pm, arch(py.low, sg * tL[i]), arch(py.tall, sg * tT[i + 1]), 0.13, 0.13, 6, false); }
      for (const [t, du] of py.main) { const ua = u0 - du, A = arch(py.tall, sg * t), Bq = [ua, yDeck(ua) + sp.kerbH - 0.05, sg * (ROAD + KW / 2)]; P.cyl(stay, A, Bq, 0.11, 0.11, 6, false); P.box(pm, ua - 0.3, ua + 0.3, yDeck(ua) + sp.kerbH - 0.02, yDeck(ua) + sp.kerbH + 0.22, Bq[2] - 0.2, Bq[2] + 0.2, 'b', 1); }
      for (const [t, du] of py.back) {
        const ua = u0 + du, va = sg * (hv + 0.4), w = world(ua, va);
        if (L.insideBuilding(w.x, w.z, 1.0) || L.isOnRoad(w.x, w.z, 0.7) || (L.waterwayAt ? L.waterwayAt(w.x, w.z) : L.inRiver(w.x, w.z)) || !L.inPlay(w.x, w.z, 0)) continue;
        P.cyl(stay, arch(py.low, sg * t), [ua, 0.85, va], 0.11, 0.11, 6, false);
        P.box(M.graniteGrey, ua - 0.6, ua + 0.6, 0.02, 0.9, va - 0.6, va + 0.6, 'b', 1.6);
        anchors.push([ua, va]);
      }
    }
  }
  // the wing walls that close the opened quay beside both deck ends (2.4 m, then the wall of the environment)
  for (const [uu, dir] of [[0, 1], [LEN, -1]]) for (const sg of [-1, 1]) closeBank({ site: sp, P, M, L, u: uu, dir, sg, v0: HV, len: 2.4, yTop: 0.05, mat: gran, parapet: par, collide: false });
  P.pop();

  // ------------------------------------------------------------------ colliders
  B.colliders = () => {
    const ph = ctx.physics, rampRot = Math.atan2(f.c, f.s), m = Math.ceil((U1 - U0) / 6);
    for (let i = 0; i < m; i++) { const u0 = U0 + (U1 - U0) * i / m, u1 = U0 + (U1 - U0) * (i + 1) / m, w = world((u0 + u1) / 2, 0); ph.addWalkRamp(w.x, w.z, 2 * HW + 0.2, u1 - u0 + 0.04, rampRot, yDeck(u0), yDeck(u1), 2.5); B.info.colliders++; }
    // n4spb (docs/AREAS.md 13.7): the 8 m solid rail boxes (-8 .. rail top, a wall from the bed across the river) are gone: every railing panel and every granite parapet section is a breakable bay with its own collider (bridges/rails.js)
    const K0 = 3.5, K1 = LEN - 3.5, nK = Math.ceil((K1 - K0) / 8);
    // the barrier kerbs between the roadway and the pavement stay solid: the granite kerb of the deck structure inside the railings, as at the Palace Bridge (water-reachable-test ALLOW 'barrier kerbs')
    if (!sp.lowKerb) for (const sg of [-1, 1]) for (let i = 0; i < nK; i++) { const u0 = K0 + (K1 - K0) * i / nK, u1 = K0 + (K1 - K0) * (i + 1) / nK, w = world((u0 + u1) / 2, sg * (ROAD + KW / 2)); ph.addBox(w.x, w.z, u1 - u0, KW, -T, Math.min(yDeck(u0), yDeck(u1)) - 1, Math.max(yDeck(u0), yDeck(u1)) + Math.max(0.55, sp.kerbH)); B.info.colliders++; }
    { const r = KP.flush(ctx); B.info.colliders += r.colliders; B.extraTris = (B.extraTris || 0) + r.tris; }      // the lamp standards: colliders + knock records
    for (const [pu, pv] of pylonFeet) { const w = world(pu, pv); ph.addBox(w.x, w.z, 2.0, 1.4, -T, -2, yDeck(pu) + 7); B.info.colliders++; }
    for (const [au, av] of anchors) { const w = world(au, av); ph.addBox(w.x, w.z, 1.2, 1.2, -T, -1, 0.95); B.info.colliders++; }
    for (const q of pedestals) if (!q.full) { const w = world(q.u, q.sg * (HW + 0.1)); ph.addBox(w.x, w.z, 2 * q.hu + 0.1, 1.0, -T, -8, yDeck(q.u) + 3); B.info.colliders++; }
    for (const [uu, dir] of [[0, 1], [LEN, -1]]) for (const sg of [-1, 1]) B.info.colliders += closeBank({ site: sp, L, ph, ctx, u: uu, dir, sg, v0: HW - 0.3, len: 2.4, yTop: 0.05, draw: false });
  };
  return B;
}

// ---------------------------------------------------------------------------------------------------- the Betancourt Bridge head (a curved rising viaduct, not a river span)
// мост Бетанкура (2018): only its Petrovsky Island approach lies in the data: the viaduct leaves the street at (-4525, -3078), rises WSW over two link roads and Petrovsky pr., turns SSW
// and leaves the data at z -2880 on its way over the Malaya Neva (the cable-stayed part is outside).  The play area ends at z -3000, about 150 - 215 m along it.  Built honestly as what it is
// here: the deck follows the OSM carriageways (centre line = their midline in the frame below), +0.05 at the street, 5.4 m over the link roads, 8.2 m over Petrovsky pr., 10 m from there on,
// light grey box girder on round column pairs, retaining walls under the low part, 3 + 3 lanes, a cycle / foot pavement on each side behind concrete barriers, tube railing, plain poles; it ends
// with a closing wall at the edge of the data (the lanes of the street network end there too).  [E]: the heights (our streets are flat: the real approach starts on an embankment, so the first
// 50 m are steeper here, ~12 %), the column spacing.  docs/research/petro-bridges.md section 8.
export const BETANCOURT = { id: 'betancourt', name: 'мост Бетанкура', nameEn: 'Betancourt Bridge (Petrovsky Island viaduct)', frame: { cx: -4525, cz: -3077.5, b: 244.6 },
  line: [[0, 0.5], [36, -8.5], [67, -11], [109, -8.9], [160, -5.5], [187, -8.5], [212, -19], [234, -30.5], [254, -44.5], [293, -79]], hw: 17.0, road: 13.0, kerbW: 0.4, kerbH: 0.75,
  prof: [[0, 0.05], [14, 0.6], [52, 5.4], [70, 6.3], [120, 8.2], [200, 10.0], [400, 10.0]], osm: ['w409159831', 'w409159832', 'w589195047', 'w590176833'] };
/** the centre line of a viaduct spec as ~5 m stations: { pts [[x, z]], S (arc length), tan [[tx, tz]], at(i, v) } (+v to the right of travel) */
export function viaductLine(sp) {
  const f0 = frameOf(sp.frame), ctrl = sp.line.map(([u, v]) => [f0.cx + u * f0.c - v * f0.s, f0.cz + u * f0.s + v * f0.c]), pts = [];
  for (let i = 0; i + 1 < ctrl.length; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)], n = Math.max(2, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 5));
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; pts.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
  }
  pts.push(ctrl[ctrl.length - 1]);
  const S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const N = pts.length, tan = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; });
  return { pts, S, tan, at: (i, v) => [pts[i][0] - v * tan[i][1], pts[i][1] + v * tan[i][0]] };
}
export function buildViaduct(env, sp) {
  const { ctx, P, M, rails } = env, L = ctx.L, V = viaductLine(sp), { pts, S, tan, at } = V, N = pts.length, yOf = profile(sp.prof);
  const HW = sp.hw, ROAD = sp.road, KW = sp.kerbW, KH = sp.kerbH, PAVE = 0.15, DEPTH = 1.6, railHex = '#b9bfc4', Y = S.map((s) => yOf(s));
  const mid = Math.round(N * 0.3), B = { id: sp.id, x: pts[mid][0], z: pts[mid][1], at: { x: at(mid, HW - 1.8)[0], z: at(mid, HW - 1.8)[1] }, yDeck: yOf, info: { rails: 0, colliders: 0 }, masts: [] };
  B.anchors = [0.08, 0.55, 0.8, 1].map((q) => { const i = Math.min(N - 1, Math.round((N - 1) * q)); return { x: pts[i][0], z: pts[i][1] }; });
  let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9; for (const p of pts) { bx0 = Math.min(bx0, p[0]); bx1 = Math.max(bx1, p[0]); bz0 = Math.min(bz0, p[1]); bz1 = Math.max(bz1, p[1]); }
  B.bounds = [bx0 - HW - 2, bz0 - HW - 2, bx1 + HW + 2, bz1 + HW + 2];
  B.deckAt = (x, z) => {
    if (x < bx0 - HW - 2 || x > bx1 + HW + 2 || z < bz0 - HW - 2 || z > bz1 + HW + 2) return null;
    for (let i = 0; i + 1 < N; i++) { const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l2 = dx * dx + dz * dz, t = ((x - pts[i][0]) * dx + (z - pts[i][1]) * dz) / l2; if (t < (i ? 0 : -0.25) || t > 1.0001) continue; const l = Math.sqrt(l2), lat = (-(x - pts[i][0]) * dz + (z - pts[i][1]) * dx) / l; if (Math.abs(lat) <= HW + 0.3) return Y[i] + (Y[i + 1] - Y[i]) * Math.max(0, t); }
    return null;
  };
  const q3 = (i, v, dy) => { const p = at(i, v); return [p[0], Y[i] + dy, p[1]]; };
  const strip = (mat, i, va, vb, dy, n = [0, 1, 0]) => P.quad(mat, q3(i, va, dy), q3(i + 1, va, dy), q3(i + 1, vb, dy), q3(i, vb, dy), n, [[S[i] / 4, va / 4], [S[i + 1] / 4, va / 4], [S[i + 1] / 4, vb / 4], [S[i] / 4, vb / 4]]);
  for (let i = 0; i + 1 < N; i++) {
    const low = Math.min(Y[i], Y[i + 1]) < 2.6, t = tan[i];
    strip(M.asphalt, i, -ROAD, ROAD, 0);
    if (S[i] > 6) { strip(M.mark, i, -0.2, -0.08, 0.03); strip(M.mark, i, 0.08, 0.2, 0.03); if (i % 3 !== 2) for (const vc of [-7.7, -4.2, 4.2, 7.7]) strip(M.mark, i, vc - 0.06, vc + 0.06, 0.03); }
    for (const sg of [-1, 1]) {
      const n = [-sg * t[1], 0, sg * t[0]], va = sg * ROAD, vk = sg * (ROAD + KW), vb = sg * HW;
      P.quad(M.concrete, q3(i, va, 0), q3(i + 1, va, 0), q3(i + 1, va, KH), q3(i, va, KH), [-n[0], 0, -n[2]]); strip(M.concrete, i, va, vk, KH); P.quad(M.concrete, q3(i, vk, PAVE), q3(i + 1, vk, PAVE), q3(i + 1, vk, KH), q3(i, vk, KH), n);
      strip(M.footAsphalt, i, vk, vb, PAVE);
      const a0 = q3(i, vb + sg * 0.12, PAVE), a1 = q3(i + 1, vb + sg * 0.12, PAVE), b0 = low ? [a0[0], -0.2, a0[2]] : q3(i, vb + sg * 0.12, -DEPTH), b1 = low ? [a1[0], -0.2, a1[2]] : q3(i + 1, vb + sg * 0.12, -DEPTH);
      P.quad(low ? M.graniteGrey : M.fasLazarev, b0, b1, a1, a0, n, [[S[i] / 2.4, b0[1] / 2.4], [S[i + 1] / 2.4, b1[1] / 2.4], [S[i + 1] / 2.4, a1[1] / 2.4], [S[i] / 2.4, a0[1] / 2.4]]);
      const r0 = at(i, sg * (HW - 0.14)), r1 = at(i + 1, sg * (HW - 0.14)), rl = Math.hypot(r1[0] - r0[0], r1[1] - r0[1]);
      rails.add({ kind: 'hpipes', hex: railHex, x: r0[0], y: Y[i] + PAVE, z: r0[1], rotY: Math.atan2(-(r1[1] - r0[1]), r1[0] - r0[0]), roll: Math.atan((Y[i + 1] - Y[i]) / rl), len: rl }); B.info.rails++;
    }
    if (!low) strip(M.fasTuchkovDark, i, -HW, HW, -DEPTH, [0, -1, 0]);
  }
  // column pairs under the high part (never on a carriageway), plain poles on both pavements, the closing wall at the end of the data
  const cols = [], net = ctx.services.streets && ctx.services.streets.net, cover = net && typeof net.cover === 'function' ? net.cover.bind(net) : null;   // road integrity: a column keeps 1.6 m (its radius + 0.65) off every asphalt edge
  for (let s = 40, i = 0; s < S[N - 1] - 8; s += 28) { while (S[i] < s) i++; if (Y[i] < 3.2) continue; for (const v of [-7.5, 7.5]) { const p = at(i, v); if ((cover ? cover(p[0], p[1], {}) > -1.6 : L.isOnRoad(p[0], p[1], 1.4)) || L.insideBuilding(p[0], p[1], 1.2)) continue; P.cyl(M.concrete, [p[0], 0, p[1]], [p[0], Y[i] - DEPTH, p[1]], 0.95, 0.95, 12, false); cols.push(p); } }
  for (let s = 24, i = 0, k = 0; s < S[N - 1] - 6; s += 34, k++) { while (S[i] < s) i++; for (const sg of [-1, 1]) { const p = at(i, sg * (ROAD + KW + 0.4)); lampCobra(P, M, p[0], Y[i] + PAVE, p[1], Math.atan2(sg * tan[i][1], -sg * tan[i][0]), { h: 10, mat: M.steel }); B.masts.push({ x: p[0], z: p[1], y: Y[i] + PAVE, h: 10, kind: 'cobra' }); } }
  { const e = N - 1, a = q3(e, -HW - 0.12, -DEPTH), b = q3(e, HW + 0.12, -DEPTH), c = q3(e, HW + 0.12, 1.3), d = q3(e, -HW - 0.12, 1.3); P.quad(M.concrete, a, b, c, d, [tan[e][0], 0, tan[e][1]]); P.quad(M.concrete, b, a, d, c, [-tan[e][0], 0, -tan[e][1]]); }
  B.colliders = () => {
    const ph = ctx.physics;
    for (let i = 0; i + 1 < N; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, mz = (pts[i][1] + pts[i + 1][1]) / 2, dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dz), rot = -Math.atan2(dz, dx), yLo = Math.min(Y[i], Y[i + 1]), yHi = Math.max(Y[i], Y[i + 1]);
      ph.addWalkRamp(mx, mz, 2 * HW + 0.2, l + 0.5, Math.atan2(dx, dz), Y[i], Y[i + 1], 2.5); B.info.colliders++;
      for (const sg of [-1, 1]) { const ox = -sg * dz / l, oz = sg * dx / l; ph.addBox(mx + ox * (HW - 0.14), mz + oz * (HW - 0.14), l + 0.4, 0.4, rot, yLo - 2.5, yHi + PAVE + 1.2); if (S[i] > 4) ph.addBox(mx + ox * (ROAD + KW / 2), mz + oz * (ROAD + KW / 2), l + 0.2, KW, rot, yLo - 1, yHi + 0.8); B.info.colliders += 2; }
    }
    const e = N - 1; ph.addBox(pts[e][0] + tan[e][0] * 0.3, pts[e][1] + tan[e][1] * 0.3, 0.6, 2 * HW + 0.6, -Math.atan2(tan[e][1], tan[e][0]), Y[e] - 3, Y[e] + 4); B.info.colliders++;
    for (const p of cols) { ph.addCylinder(p[0], p[1], 1.0, -1, 9); B.info.colliders++; }
  };
  return B;
}
