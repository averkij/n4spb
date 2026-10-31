// bridges/krestAptek2/yachtny.js - the Yachtny Bridge (Яхтенный мост, 2017): the long curved pedestrian / cycle bridge over the Bolshaya Nevka between the Primorsky bank (Yakhtennaya street) and the north end of
// Krestovsky Island (the stadium car park).  Dossier: docs/research/bridges-krestovsky-aptekarsky.md (section Yachtny), photos refs/bridges-krestovsky-aptekarsky y01 - y09.
//   Facts [W] ru.wikipedia "Яхтенный мост": 940 m crossing in all, the bridge proper 490 m x 17 m (pavement 2.25 m + cycle track 3.5 m + a two-lane roadway for special vehicles only), fixed (no bascule), two
//   viewing platforms 9.2 x 3.25 m on the Gulf side, built 2016-17 for the Confederations Cup / World Cup and given to the city; opened 27 May 2017.  [V] photos: white concrete girder on V-shaped piers with
//   a wide footing, concrete jersey barriers between the roadway and the two side tracks, red-brown rubber cycle track with white lines, grey pavement, galvanised horizontal-rod railing with curved flat posts,
//   grey single-arm lamp standards every ~25 m, a bronze plaque at the foot.  [OSM] the way w419266626 (7.2 m, 585 m long incl. both approaches), the 13 m deck ring w496841253, the footway w496586332 (west) and
//   the cycleway w496586337 (east).  [E] the profile (peak 11 m over the fairway, slopes <= 5 %), the girder depth, the pier spacing (~36 m: photo y07 counts 11 piers over the water).
//   Frame: the centre line = the OSM way (densified, arc-length stations every ~2.5 m), +v = right of travel (west, the Gulf side), travel from the Primorsky end (north-west) to Krestovsky (south-east).
//   The bridge is built in WORLD coordinates in chunks of ~100 m (one Parts per chunk: the meshes cull one by one).  Pedestrians + cyclists only (bollards across the roadway at both mouths).
//   NO flags / flagpoles / beacons (user rules).
import { profile, closeBank } from '../long.js';
import { lampCobra } from '../sculpt4.js';
import { platePole } from '../krestAptek.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** the OSM way w419266626 with its bridge-layer nodes (world x, z; travel from the Primorsky end) */
const PATH = [-7789.1, -5342.3, -7790.1, -5326.7, -7789.9, -5310.9, -7788.3, -5291.5, -7785.3, -5273.3, -7781.2, -5258.2, -7776.7, -5243.7, -7767.4, -5217.4, -7743.4, -5157.7, -7721.2, -5106.1, -7714.9, -5090.4,
  -7702.7, -5063.3, -7690.4, -5035, -7671.7, -4994.8, -7660.8, -4973.6, -7648.5, -4956.3, -7615.4, -4917.3, -7537.9, -4827.7];
export const YA = {
  id: 'yachtny', name: 'Яхтенный мост', nameEn: 'Yachtny Bridge (Bolshaya Nevka, pedestrian / cycle bridge)', ww: 'neva', hw: 8.2, ped: true, noCar: true,
  osm: ['w419266626', 'w496841253', 'w496586332', 'w496586337'], at: [-7664, -5000],
  // cross section (v from the centre line, + = right of travel = west = the Gulf side)
  X: { road: 4.2, barrier: 0.5, track: 3.3 },
  // deck height over the street (m) at s / L (peak ~11 m over the fairway, <= 5 % slope), [E]
  keys: [[0, 0.05], [0.10, 3.0], [0.24, 7.0], [0.38, 10.6], [0.48, 11.0], [0.62, 9.4], [0.75, 5.6], [0.89, 1.9], [1, 0.05]],
  spanLen: 36, skirtY: 3.6,
};

/** Catmull-Rom densified, arc-length stations every ~ds m: { n, X[], Z[], S[], tx[], tz[], L } */
export function stationsOf(path = PATH, ds = 2.5) {
  const P = []; for (let i = 0; i < path.length; i += 2) P.push([path[i], path[i + 1]]);
  const dense = [];
  for (let i = 0; i + 1 < P.length; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)], m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 1.0));
    for (let k = 0; k < m; k++) { const t = k / m, t2 = t * t, t3 = t2 * t; dense.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  dense.push(P[P.length - 1]);
  const cum = [0]; for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const L = cum[cum.length - 1], n = Math.round(L / ds), step = L / n, X = [], Z = [], S = [];
  let j = 1;
  for (let i = 0; i <= n; i++) { const s = i * step; while (j < cum.length - 1 && cum[j] < s) j++; const t = (s - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1); X.push(dense[j - 1][0] + (dense[j][0] - dense[j - 1][0]) * t); Z.push(dense[j - 1][1] + (dense[j][1] - dense[j - 1][1]) * t); S.push(s); }
  const tx = [], tz = [];
  for (let i = 0; i <= n; i++) { const a = Math.max(0, i - 1), b = Math.min(n, i + 1), dx = X[b] - X[a], dz = Z[b] - Z[a], l = Math.hypot(dx, dz) || 1; tx.push(dx / l); tz.push(dz / l); }
  return { n, X, Z, S, tx, tz, L, step };
}
const ST = stationsOf();
/** deck height over the street at s */
export const deckProfile = profile(YA.keys.map(([t, y]) => [t * ST.L, y]));
export const STATIONS = ST;
/** world point at station coordinate s and lateral v (+ = right of travel) */
export function pointAt(s, v) {
  const f = clamp(s / ST.step, 0, ST.n), i = Math.min(ST.n - 1, Math.floor(f)), t = f - i;
  const x = ST.X[i] + (ST.X[i + 1] - ST.X[i]) * t, z = ST.Z[i] + (ST.Z[i + 1] - ST.Z[i]) * t, dx = ST.X[i + 1] - ST.X[i], dz = ST.Z[i + 1] - ST.Z[i], l = Math.hypot(dx, dz) || 1;
  return { x: x - v * dz / l, z: z + v * dx / l, tx: dx / l, tz: dz / l };
}

export function buildYachtny(env) {
  const { ctx, M, rails, Parts, flush } = env, L = ctx.L, waterY = env.waterY, sp = YA, HW = sp.hw, TM = ctx.mat.toon, n = ST.n;
  const wetAt = (x, z) => !!(L.waterwayAt ? L.waterwayAt(x, z) : L.inRiver(x, z));
  // ---- the materials of this bridge
  if (!M.yaConcrete) {
    M.yaConcrete = TM('#d6d8d3', { paint: 0.05, name: 'brg-ya-concrete' }); M.yaBarrier = TM('#c7cac4', { paint: 0.05, name: 'brg-ya-barrier' });
    M.yaTrack = TM('#8d4a42', { paint: 0.06, name: 'brg-ya-track' }); M.yaPave = TM('#6e7378', { paint: 0.06, name: 'brg-ya-pave' }); M.yaSteel = TM('#a9b3b7', { paint: 0.03, name: 'brg-ya-steel' });
    M.yaLamp = TM('#9ea5a8', { paint: 0.03, name: 'brg-ya-lamp' });
  }
  const conc = M.yaConcrete, barM = M.yaBarrier, trackM = M.yaTrack, paveM = M.yaPave, asph = M.asphalt, mark = M.mark, steel = M.yaSteel;
  // ---- per station: deck height, wet flag (centre or either edge over water), skirt flag (solid embankment face down to the ground)
  const Y = [], wet = [], skirt = [];
  for (let i = 0; i <= n; i++) {
    Y.push(deckProfile(ST.S[i]));
    const w = (v) => { const q = pointAt(ST.S[i], v); return wetAt(q.x, q.z); };
    wet.push(w(0) || w(-HW) || w(HW));
  }
  let iA = wet.indexOf(true), iB = wet.lastIndexOf(true);
  if (iA < 0) { iA = Math.round(n * 0.06); iB = Math.round(n * 0.72); }
  const sA = ST.S[iA], sB = ST.S[iB];
  for (let i = 0; i <= n; i++) skirt.push(!wet[i] && Y[i] <= sp.skirtY + 0.001);
  // ---- the piers: over the water every ~spanLen, on the far bank until the deck comes down to the embankment
  const nP = Math.max(2, Math.round((sB - sA) / sp.spanLen)), piers = [];
  for (let k = 1; k < nP; k++) piers.push({ s: sA + (sB - sA) * k / nP, wet: true });
  for (let s = sB + 4; s < ST.L; s += 31) if (deckProfile(s) > sp.skirtY + 0.4) piers.push({ s, wet: false });
  for (let s = sA - 31; s > 0; s -= 31) if (deckProfile(s) > sp.skirtY + 0.4) piers.push({ s, wet: false });
  piers.sort((a, b) => a.s - b.s);
  const dPier = (s) => { let d = 99; for (const p of piers) d = Math.min(d, Math.abs(p.s - s)); return d; };
  const DEP = (i) => skirt[i] ? Y[i] + 0.15 : 1.5 + 0.95 * Math.pow(Math.max(0, 1 - dPier(ST.S[i]) / 15), 2);          // girder depth under the deck top
  const chunkOf = (i) => Math.min(Math.floor(i / 40), Math.floor(n / 40 - 0.001));
  const nCh = chunkOf(n) + 1, parts = [], chBox = [];
  for (let c = 0; c < nCh; c++) { parts.push(new Parts()); chBox.push([1e9, 1e9, -1e9, -1e9]); }
  const info = { rails: 0, colliders: 0, tris: 0, piers: piers.length, bank: [+sA.toFixed(1), +sB.toFixed(1)], chunks: nCh };
  const B = { id: sp.id, x: pointAt(ST.L / 2, 0).x, z: pointAt(ST.L / 2, 0).z, info, masts: [], anchors: [], at: sp.at, flushed: true };
  const stepOf = ST.step, V = sp.X;
  const wp = (s, v, y) => { const q = pointAt(s, v); return [q.x, y, q.z]; };

  // ---- deck: strips (asphalt roadway, barriers, red cycle track, grey pavement, concrete edges), fascia, soffit, dashes
  for (let i = 0; i < n; i++) {
    const P = parts[chunkOf(i)], s0 = ST.S[i], s1 = ST.S[i + 1], y0 = Y[i], y1 = Y[i + 1], Rn = [-ST.tz[i], 0, ST.tx[i]];
    const q = (v, yy0, yy1, s_a = s0, s_b = s1) => [wp(s_a, v, yy0), wp(s_b, v, yy1)];
    const strip = (mat, va, vb, dy = 0) => { const A = q(va, y0 + dy, y1 + dy), Bq = q(vb, y0 + dy, y1 + dy); P.quad(mat, A[0], A[1], Bq[1], Bq[0], [0, 1, 0], [[s0 / 4, va / 4], [s1 / 4, va / 4], [s1 / 4, vb / 4], [s0 / 4, vb / 4]]); };
    strip(asph, -V.road, V.road);
    strip(paveM, V.road + V.barrier, HW - 0.1);                      // west pavement (right of travel)
    strip(trackM, -(HW - 0.1), -(V.road + V.barrier));               // east cycle track
    for (const sg of [-1, 1]) strip(conc, sg * (HW - 0.1), sg * (HW + 0.15));
    // jersey barriers: a trapezoid profile 0.5 m at the foot, 0.2 m at the top, 0.85 m high
    for (const sg of [-1, 1]) {
      const vi = sg * V.road, vo = sg * (V.road + V.barrier), vti = sg * (V.road + 0.16), vto = sg * (V.road + V.barrier - 0.12), h = 0.85;
      let A = q(vi, y0, y1), Bq = q(vti, y0 + h, y1 + h); P.quad(barM, A[0], A[1], Bq[1], Bq[0], [-sg * Rn[0], 0.2, -sg * Rn[2]]);
      A = q(vto, y0 + h, y1 + h); Bq = q(vo, y0, y1); P.quad(barM, A[0], A[1], Bq[1], Bq[0], [sg * Rn[0], 0.2, sg * Rn[2]]);
      A = q(vti, y0 + h, y1 + h); Bq = q(vto, y0 + h, y1 + h); P.quad(barM, A[0], A[1], Bq[1], Bq[0], [0, 1, 0]);
    }
    // markings: dashed centre line, solid edge lines of the roadway, the white divider of the cycle track, the edge lines of the pavement side
    const mk = (va, vb, dy = 0.025) => { const A = q(va, y0 + dy, y1 + dy), Bq = q(vb, y0 + dy, y1 + dy); P.quad(mark, A[0], A[1], Bq[1], Bq[0], [0, 1, 0]); };
    if ((s0 % 9) < 3.0) mk(-0.06, 0.06);
    mk(V.road - 0.45, V.road - 0.33); mk(-V.road + 0.33, -V.road + 0.45);
    mk(-(V.road + V.barrier + V.track / 2) - 0.05, -(V.road + V.barrier + V.track / 2) + 0.05);
    mk(-(HW - 0.45), -(HW - 0.35)); mk(-(V.road + V.barrier + 0.1), -(V.road + V.barrier + 0.2));
    // girder: fascia both sides, soffit (not under the solid embankment)
    const d0 = DEP(i), d1 = DEP(i + 1);
    for (const sg of [-1, 1]) { const v = sg * (HW + 0.15); P.quad(conc, wp(s0, v, y0 - d0), wp(s1, v, y1 - d1), wp(s1, v, y1 + 0.05), wp(s0, v, y0 + 0.05), [sg * Rn[0], 0, sg * Rn[2]], [[s0 / 2.4, -d0 / 2.4], [s1 / 2.4, -d1 / 2.4], [s1 / 2.4, 0], [s0 / 2.4, 0]]); }
    if (!skirt[i]) { const A = [wp(s0, -HW - 0.15, y0 - d0), wp(s1, -HW - 0.15, y1 - d1)], Bq = [wp(s0, HW + 0.15, y0 - d0), wp(s1, HW + 0.15, y1 - d1)]; P.quad(conc, A[0], A[1], Bq[1], Bq[0], [0, -1, 0], [[s0 / 4, -2], [s1 / 4, -2], [s1 / 4, 2], [s0 / 4, 2]]); }
    for (const [x, z] of [wp(s0, -HW - 0.2, 0), wp(s0, HW + 0.2, 0), wp(s1, -HW - 0.2, 0), wp(s1, HW + 0.2, 0)].map((p) => [p[0], p[2]])) { const b = chBox[chunkOf(i)]; b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], z); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], z); }
  }
  // end walls of the solid embankment faces (where the skirt stops, facing the span)
  for (let i = 0; i < n; i++) if (skirt[i] !== skirt[i + 1]) {
    const P = parts[chunkOf(i)], s = ST.S[i + 1], y = Y[i + 1], d = DEP(skirt[i] ? i : i + 1), up = skirt[i] ? 1 : -1;
    const a = wp(s, -HW - 0.15, y - d), b = wp(s, HW + 0.15, y - d), c = wp(s, HW + 0.15, y), e = wp(s, -HW - 0.15, y);
    P.quad(conc, a, b, c, e, [up * ST.tx[i], 0, up * ST.tz[i]], [[0, 0], [2 * HW / 2.4, 0], [2 * HW / 2.4, d / 2.4], [0, d / 2.4]]);
  }
  // ---- the piers: a wide round footing at the water line, two splayed legs to the girder, a cap beam under the girder
  const legs = [];
  for (const pr of piers) {
    const i = Math.round(pr.s / stepOf), P = parts[chunkOf(i)], pt = pointAt(pr.s, 0), th = Math.atan2(pt.tz, pt.tx), yDk = deckProfile(pr.s), dep = DEP(i), yU = yDk - dep;
    const yF = pr.wet ? waterY - 0.2 : -0.2, yBase = pr.wet ? waterY + 1.5 : 0.3;
    P.push(pt.x, 0, pt.z, -th);
    if (pr.wet) { P.cyl(conc, [0, yF, 0], [0, yBase, 0], 2.6, 2.3, 10, false); P.cyl(conc, [0, yBase, 0], [0, yBase + 0.12, 0], 2.3, 2.3, 10, true); }
    else P.box(conc, -1.6, 1.6, yF, yBase, -3.4, 3.4, 'b', 2.4);
    for (const sg of [-1, 1]) { P.cyl(conc, [0, yBase, sg * 1.2], [0, yU + 0.25, sg * 5.3], 1.25, 0.9, 8, false); legs.push({ x: pt.x - sg * 1.2 * pt.tz, z: pt.z + sg * 1.2 * pt.tx, y: yDk, wet: pr.wet }); }
    P.box(conc, -1.0, 1.0, yU - 0.55, yU + 0.05, -6.9, 6.9, 'b', 2.4);
    P.pop();
    const b = chBox[chunkOf(i)]; for (const [x, z] of [[pt.x - 8 * pt.tz, pt.z + 8 * pt.tx], [pt.x + 8 * pt.tz, pt.z - 8 * pt.tx]]) { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], z); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], z); }
  }
  // ---- railing (galvanised horizontal rods, curved flat posts every bay), 2.5 m bays on both sides
  for (const sg of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const s0 = ST.S[i], s1 = ST.S[i + 1], a = pointAt(s0, sg * (HW - 0.02)), bq = pointAt(s1, sg * (HW - 0.02)), bl = Math.hypot(bq.x - a.x, bq.z - a.z), y0 = Y[i], y1 = Y[i + 1];
      rails.add({ kind: 'hpipes', hex: '#b4bdc1', x: a.x, y: y0 + 0.05, z: a.z, rotY: -Math.atan2(bq.z - a.z, bq.x - a.x), roll: Math.atan((y1 - y0) / bl), len: bl, h: 1.15 }); info.rails++;
      parts[chunkOf(i)].cyl(steel, [a.x, y0 + 0.05, a.z], [a.x, y0 + 1.2, a.z], 0.06, 0.05, 6, true);
    }
  }
  // ---- lamp standards every ~25 m (grey pole, one flat head on an arm over the walkway), alternating sides; platforms at the ends carry the name plates
  const lampH = 8.5;
  for (let k = 0, s = 12; s < ST.L - 8; k++, s += 12.5) {
    const sg = k % 2 ? -1 : 1, i = Math.round(s / stepOf), P = parts[chunkOf(i)], v = sg * (HW - 0.75), p = pointAt(s, v), y = deckProfile(s) + 0.05;
    lampCobra(P, M, p.x, y, p.z, Math.atan2(sg * p.tz, -sg * p.tx), { h: lampH, mat: M.yaLamp, arm: 2.2 });
    B.masts.push({ x: p.x, y, z: p.z, h: lampH, kind: 'cobra', id: sp.id });
  }
  const plateM = M.namePlate ? M.namePlate('ЯХТЕННЫЙ МОСТ') : null;
  const platePts = [];
  for (const s of [7, ST.L - 7]) { const p = pointAt(s, HW - 1.3), i = Math.round(s / stepOf), P = parts[chunkOf(i)]; P.push(p.x, 0, p.z, -Math.atan2(p.tz, p.tx)); platePole(P, M, plateM, 0, deckProfile(s) + 0.05, 0); P.pop(); platePts.push({ x: p.x, z: p.z, y: deckProfile(s) }); }
  // ---- bollards across the roadway at both mouths (the carriageway is for special vehicles only)
  const bollards = [];
  for (const s of [3.5, ST.L - 3.5]) for (let k = -3; k <= 3; k++) { const p = pointAt(s, k * 1.2), i = Math.round(s / stepOf); parts[chunkOf(i)].cyl(steel, [p.x, deckProfile(s) + 0.05, p.z], [p.x, deckProfile(s) + 0.9, p.z], 0.1, 0.1, 6, true); bollards.push(p); }
  // ---- the quay under the deck at both shores: a granite wall across the whole width + wings to the end of the quay opening (closeBank, v0 = 0)
  const wings = [];
  const openLen = (site, sg, dir) => { const zs = env.zones || []; if (!zs.length) return 1.8; let last = -1; for (let k = 0; k <= 22; k++) { const v = sg * (HW + k * 0.5); const q = pointAt(site.s, v); if (zs.some((z) => z.test(q.x, q.z, 0.15))) last = k; } return last < 0 ? 1.8 : Math.min(5.4, Math.max(1.8, (last + 1) * 0.5 + 1.0)); };
  for (const [s, dir] of [[sA, 1], [sB, -1]]) {
    const q = pointAt(s, 0), site = { cx: q.x, cz: q.z, b: Math.atan2(q.tz, q.tx) * 180 / Math.PI + 90, s };
    for (const sg of [-1, 1]) {
      const ln = HW + openLen(site, sg, dir), w = { site, dir, sg, len: ln }; wings.push(w);
      const P = parts[chunkOf(Math.round(s / stepOf))]; P.push(site.cx, 0, site.cz, -(Math.atan2(q.tz, q.tx)));
      closeBank({ site, P, M, L, u: 0, dir, sg, v0: 0.0, len: ln, yTop: 0.05, yb: waterY - 0.2, mat: M.granite, parapet: M.parapet, collide: false }); P.pop();
    }
  }
  info.wings = wings.map((w) => +w.len.toFixed(1));
  // ---- flush the chunks
  for (let c = 0; c < nCh; c++) { info.tris += parts[c].tris; flush(parts[c], sp.id + '-' + c); }
  // ---- deckAt: per chunk AABB, then the nearest station segment
  const cb = chBox.map((b) => [b[0] - 1, b[1] - 1, b[2] + 1, b[3] + 1]);
  B.bounds = [Math.min(...cb.map((b) => b[0])), Math.min(...cb.map((b) => b[1])), Math.max(...cb.map((b) => b[2])), Math.max(...cb.map((b) => b[3]))];
  const chI = []; for (let c = 0; c < nCh; c++) chI.push([Math.max(0, c * 40 - 2), Math.min(n - 1, (c + 1) * 40 + 2)]);
  B.deckAt = (x, z) => {
    for (let c = 0; c < nCh; c++) {
      const b = cb[c]; if (x < b[0] || x > b[2] || z < b[1] || z > b[3]) continue;
      for (let i = chI[c][0]; i <= chI[c][1]; i++) {
        const ax = ST.X[i], az = ST.Z[i], dx = ST.X[i + 1] - ax, dz = ST.Z[i + 1] - az, l2 = dx * dx + dz * dz, t = ((x - ax) * dx + (z - az) * dz) / l2;
        if (t < -0.0001 || t > 1.0001) continue;
        const px = ax + dx * t, pz = az + dz * t, v = ((x - px) * -dz + (z - pz) * dx) / Math.sqrt(l2);
        if (Math.abs(v) <= HW + 0.2) return Y[i] + (Y[i + 1] - Y[i]) * clamp(t, 0, 1) + 0.0;
      }
    }
    return null;
  };
  for (let s = 140; s < ST.L; s += 150) { const p = pointAt(s, 0); B.anchors.push({ x: p.x, z: p.z }); }
  B.yDeck = (s) => deckProfile(s);
  // ---- colliders: walk ramps every ~7.5 m along the curve, side boxes, pier legs on land, bollards, the bank wings
  B.colliders = () => {
    const ph = ctx.physics, k = 3;
    for (let i = 0; i < n; i += k) {
      const j = Math.min(n, i + k), a = pointAt(ST.S[i], 0), b = pointAt(ST.S[j], 0), len = Math.hypot(b.x - a.x, b.z - a.z), th = Math.atan2(b.z - a.z, b.x - a.x);
      const mid = pointAt((ST.S[i] + ST.S[j]) / 2, 0), thick = skirt[i] ? 3.6 : Math.max(0.6, DEP(i) - 0.1);
      ph.addWalkRamp(mid.x, mid.z, 2 * HW + 0.3, len + 0.25, Math.atan2(Math.cos(th), Math.sin(th)), Y[i], Y[j], Math.min(thick, 3.6)); info.colliders++;
      for (const sg of [-1, 1]) { const m = pointAt((ST.S[i] + ST.S[j]) / 2, sg * (HW + 0.05)); ph.addBox(m.x, m.z, len + 0.3, 0.3, -th, -8, Math.max(Y[i], Y[j]) + 1.3); info.colliders++; }
    }
    for (const lg of legs) if (!lg.wet) { ph.addCylinder(lg.x, lg.z, 1.3, -1, lg.y); info.colliders++; }
    for (const m of B.masts) { ph.addCylinder(m.x, m.z, 0.16, m.y - 1, m.y + m.h); info.colliders++; }
    for (const q of platePts) { ph.addCylinder(q.x, q.z, 0.6, q.y - 0.5, q.y + 3.4); info.colliders++; }
    for (const b of bollards) { ph.addCylinder(b.x, b.z, 0.12, -1, 1.6); info.colliders++; }
    for (const w of wings) info.colliders += closeBank({ site: w.site, L, ph, u: 0, dir: w.dir, sg: w.sg, v0: 0.0, len: w.len, yTop: 0.05, draw: false });
  };
  return B;
}
export const YACHTNY_LIST = { id: YA.id, name: YA.name, nameEn: YA.nameEn, ww: YA.ww, spec: YA, build: buildYachtny, multi: true };
