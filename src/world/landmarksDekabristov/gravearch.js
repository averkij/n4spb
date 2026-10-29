// PROVENANCE: copied verbatim from src/world/landmarksSmolensky/gravearch.js of this repository (itself copied from the source project 102_3d_piter, commit 0568f7af); only the texture / material / mesh name prefix lmsmol- became lmdek- (the texture cache is scene-wide) and the module name in the log lines. The header below is the original one.
// landmarksSmolensky/gravearch.js - the grave ARCHETYPES of the detailed field (docs/research/smolensky-detail.md section 1: crosses X1-X7, stelae S1-S8, pedestals / obelisks / urns T1-T3, chapel-tombs C1-C6,
// beds / tubs / kerbs K1-K6, the 13 iron fence patterns F1-F13, flowers, plants).  A plot is composed from instances of the six shared geometries (gravemat.js) with an atlas cell and a tint each:
//   compose(plot, sink)       the full plot (within ~55 m): kerb frames, tubs, plinths, the monument, the iron fence panels, flower bunches, plant cards round the foot
//   composeFar(plot, sink)    one or two slabs (the monument and a bed block: beyond ~55 m)
// Plot frame: origin at the plot centre, +z towards the alley (the monument faces +z, the head of the grave is at -z), y up.  plot = { x, z, rot, type, zone, v: [h0..h5], fence, fam }.
// `plotInfo(plot)` returns the half sizes and the collider.  No names, no text, no portraits (blank ovals only), no skulls, no flags.  Dimensions in metres from the catalogue; colours as tints of the atlas cells.
const mulT = (t, k) => [Math.min(1, t[0] * k), Math.min(1, t[1] * k), Math.min(1, t[2] * k)];
export const TN = {
  black: [0.17, 0.18, 0.19], black2: [0.13, 0.14, 0.15], grey: [0.46, 0.47, 0.50], greyL: [0.62, 0.62, 0.62], red: [0.50, 0.28, 0.25], redD: [0.40, 0.22, 0.20], pale: [0.84, 0.82, 0.76], marble: [0.97, 0.97, 0.95],
  green: [0.30, 0.42, 0.34], conc: [0.66, 0.65, 0.62], concW: [0.88, 0.87, 0.84], lime: [0.82, 0.78, 0.68], pink: [0.72, 0.55, 0.52], iron: [0.11, 0.11, 0.12], rust: [0.26, 0.16, 0.12], rustD: [0.16, 0.12, 0.10],
  blue: [0.16, 0.28, 0.46], silver: [0.76, 0.77, 0.78], white: [0.92, 0.92, 0.90], wood: [0.60, 0.42, 0.20], woodD: [0.30, 0.20, 0.12], woodG: [0.44, 0.38, 0.32], one: [1, 1, 1], soil: [0.34, 0.26, 0.19], roofIron: [0.30, 0.20, 0.16], gold: [0.85, 0.70, 0.30],
};
/** the fence patterns: [cell, height m, weight, may be blue] (F9 is the tomb arcade, F10 the chain link) */
export const FENCES = [['f1', 0.9, 16], ['f2', 0.7, 6], ['f3', 0.8, 6], ['f4', 1.05, 16], ['f5', 0.7, 9], ['f6', 1.0, 3], ['f7', 1.0, 8], ['f8', 0.75, 6], ['f10', 1.2, 10], ['f11', 1.1, 12], ['f13', 0.55, 6]];
const FW_TOT = FENCES.reduce((s, f) => s + f[2], 0);
const pickFence = (h) => { let a = h * FW_TOT; for (const f of FENCES) { if ((a -= f[2]) < 0) return f; } return FENCES[0]; };
/** the native size (m) of the cross cells (270 px per metre): [w, h] */
const XN = { x1: [0.667, 1.896], x2: [0.667, 1.8], x3: [0.652, 1.6], x4: [0.704, 1.6], x5: [0.74, 1.407], x6: [0.593, 2.222], x7: [0.5, 1.48] };
/** type weights per zone: iron pebble trefoil granite wood stele soviet tomb chapel */
const TYPES = ['iron', 'pebble', 'trefoil', 'granite', 'wood', 'stele', 'soviet', 'tomb', 'chapel'];
const ZW = { A: [12, 8, 18, 29, 13, 12, 4, 3, 1], B: [18, 6, 18, 25, 11, 12, 4, 3, 3], C: [23, 8, 20, 26, 7, 5, 7, 2, 2], D: [1, 1, 5, 3, 11, 70, 9, 0, 0], E: [4, 2, 6, 6, 20, 40, 18, 0, 0] };
export const FENCED = { A: 0.45, B: 0.40, C: 0.55, D: 0.08, E: 0.05 };
export function pickType(zone, h) { const w = ZW[zone] || ZW.C; let a = h * w.reduce((s, x) => s + x, 0); for (let i = 0; i < w.length; i++) { if ((a -= w[i]) < 0) return TYPES[i]; } return 'stele'; }

/** half sizes of the plot footprint and its collider box (local frame): { hw, hl, bw, bl, bz, bh } */
export function plotInfo(p) {
  if (p.type === 'edge') return { hw: 0.5, hl: 0.5, cw: 0, cl: 0, cz: 0, ch: 0, solid: false };
  const fam = !!p.fam && p.type !== 'chapel';
  if (p.type === 'chapel') return { hw: 1.4, hl: 1.5, cw: 2.6, cl: 2.8, cz: 0, ch: 3.4, solid: true };
  const hw = fam ? 1.15 : 0.62, hl = fam ? 1.45 : 1.2;
  if (p.fence) return { hw, hl, cw: hw * 2 + 0.1, cl: hl * 2 + 0.1, cz: 0, ch: 0.95, solid: true };
  if (p.type === 'tomb' || p.type === 'granite') return { hw, hl, cw: 1.2, cl: 1.2, cz: -hl + 0.55, ch: 1.5, solid: true };
  return { hw, hl, cw: 0.9, cl: 0.4, cz: -hl + 0.4, ch: 1.2, solid: false };
}

export class Sink {
  constructor() { this.P = { x: 0, z: 0, c: 1, s: 0 }; this.t = {}; }
  plot(p) { this.P.x = p.x; this.P.z = p.z; this.P.c = Math.cos(p.rot); this.P.s = Math.sin(p.rot); }
  bucket(type) { return this.t[type] || (this.t[type] = { m: [], c: [], t: [], n: 0 }); }
  /** one instance: local position, size (sx, sy, sz of the unit geometry), yaw about y, tilt about x (forward) and z (sideways) */
  add(type, cell, tint, lx, ly, lz, sx, sy, sz, yaw = 0, tx = 0, tz = 0) {
    const b = this.bucket(type), P = this.P, cy = Math.cos(yaw), sy_ = Math.sin(yaw), cx = Math.cos(tx), sxn = Math.sin(tx), cz = Math.cos(tz), szn = Math.sin(tz);
    const a00 = cz, a01 = -szn, a10 = cx * szn, a11 = cx * cz, a12 = -sxn, a20 = sxn * szn, a21 = sxn * cz, a22 = cx;
    const r00 = cy * a00 + sy_ * a20, r01 = cy * a01 + sy_ * a21, r02 = sy_ * a22, r10 = a10, r11 = a11, r12 = a12, r20 = -sy_ * a00 + cy * a20, r21 = -sy_ * a01 + cy * a21, r22 = cy * a22;
    const c = P.c, s = P.s;
    // columns scaled by (sx, sy, sz), then turned by the plot rotation (x' = c x + s z, z' = -s x + c z)
    const m = b.m;
    m.push(c * r00 * sx + s * r20 * sx, r10 * sx, -s * r00 * sx + c * r20 * sx, 0,
      c * r01 * sy + s * r21 * sy, r11 * sy, -s * r01 * sy + c * r21 * sy, 0,
      c * r02 * sz + s * r22 * sz, r12 * sz, -s * r02 * sz + c * r22 * sz, 0,
      P.x + c * lx + s * lz, ly, P.z - s * lx + c * lz, 1);
    b.c.push(cell.u0, cell.v0, cell.du, cell.dv); b.t.push(tint[0], tint[1], tint[2]); b.n++;
  }
  /** typed arrays per geometry */
  finish() { const o = {}; for (const [k, b] of Object.entries(this.t)) o[k] = { n: b.n, m: new Float32Array(b.m), c: new Float32Array(b.c), t: new Float32Array(b.t) }; return o; }
}

export function makeComposer(atlas) {
  const C = atlas.cells, cell = (n) => (typeof n === 'string' ? C[n] || C.sPlain : n);
  /** a sub-rectangle (fractions of the cell) as a derived cell: kerb bars sample a thin horizontal band so the grain is not stretched */
  const sub = (n, a, b, c, d) => { const q = C[n]; return { u0: q.u0 + a * q.du, v0: q.v0 + b * q.dv, du: (c - a) * q.du, dv: (d - b) * q.dv }; };
  const KB = sub('sKerb', 0, 0.42, 1, 0.58), KT = sub('sKerb', 0, 0.2, 0.9, 0.8);
  let K;                                                                  // the sink of the plot being composed
  const slab = (cn, t, x, y, z, w, h, d, yaw = 0) => K.add('slab', cell(cn), t, x, y, z, w, h, d, yaw);
  const taper = (cn, t, x, y, z, w, h, d, yaw = 0) => K.add('taper', cell(cn), t, x, y, z, w, h, d, yaw);
  const pyr = (cn, t, x, y, z, w, h, d, yaw = 0) => K.add('pyr', cell(cn), t, x, y, z, w, h, d, yaw);
  const shaft = (cn, t, x, y, z, w, h, d) => K.add('shaft', cell(cn), t, x, y, z, w, h, d);
  const panel = (cn, t, x, y, z, w, h, yaw = 0, tx = 0) => K.add('panel', cell(cn), t, x, y, z, w, h, 1, yaw, tx, 0);
  const flat = (cn, t, x, y, z, w, l) => K.add('panel', cell(cn), t, x, y, z + l / 2, w, l, 1, 0, -Math.PI / 2, 0);       // a card lying on the ground, centre (x, z)
  const card2 = (cn, t, x, y, z, w, h, yaw = 0) => { panel(cn, t, x, y, z, w, h, yaw); panel(cn, t, x, y, z, w, h, yaw + Math.PI / 2); };
  const crossAt = (cn, t, x, y, z, h, tx = 0, tz = 0) => { const n = XN[cn] || XN.x1, f = h / n[1]; K.add('cross', cell(cn), t, x, y, z, n[0] * f, h, n[0] * f, 0, tx, tz); };
  const tinted = (name, v) => mulT(TN[name], 0.9 + 0.2 * v);
  const stoneTint = (h) => (h < 0.62 ? 'black' : h < 0.74 ? 'grey' : h < 0.84 ? 'red' : h < 0.90 ? 'pale' : h < 0.94 ? 'green' : 'black2');

  /** kerb frame (K3): four low beams with pyramid corner posts */
  function kerbFrame(w, l, h, t, posts) {
    const k = 0.13;
    slab(KB, t, 0, 0, l / 2 - k / 2, w, h, k); slab(KB, t, 0, 0, -l / 2 + k / 2, w, h, k);
    slab(KB, t, -w / 2 + k / 2, 0, 0, k, h, l - 2 * k); slab(KB, t, w / 2 - k / 2, 0, 0, k, h, l - 2 * k);
    if (posts) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { slab('sKerb', t, sx * (w / 2 - 0.05), 0, sz * (l / 2 - 0.05), 0.15, h + 0.05, 0.15); pyr('sKerb', t, sx * (w / 2 - 0.05), h + 0.05, sz * (l / 2 - 0.05), 0.15, 0.1, 0.15); }
  }
  /** a bed fill lying inside a frame: soil / gravel / lawn */
  const fill = (kind, x, y, z, w, l) => flat(kind === 'g' ? 'cGravel' : kind === 'l' ? 'cGrass' : 'cSoil', TN.one, x, y, z, w, l);
  /** cobble-faced tub (K1): the four sides are cobble panels, a pale rim and the soil on top */
  function tub(x, z, w, l, h, festoon, vv) {
    const t = mulT(TN.one, 0.85 + 0.2 * vv), cn = festoon ? 'cFestoon' : 'cCobble', rt = tinted('concW', vv), r = 0.1;
    const side = (len, cx, cz, yaw) => { const n = Math.max(1, Math.round(len / 1.2)), pw = len / n, c = Math.cos(yaw), s = Math.sin(yaw); for (let i = 0; i < n; i++) { const o = -len / 2 + pw * (i + 0.5); panel(cn, t, cx + c * o, 0, cz - s * o, pw + 0.02, h, yaw); } };
    side(w, x, z + l / 2, 0); side(w, x, z - l / 2, 0); side(l, x - w / 2, z, Math.PI / 2); side(l, x + w / 2, z, Math.PI / 2);
    slab(KB, rt, x, h - 0.05, z + l / 2 - r / 2, w + 0.04, 0.07, r); slab(KB, rt, x, h - 0.05, z - l / 2 + r / 2, w + 0.04, 0.07, r); slab(KB, rt, x - w / 2 + r / 2, h - 0.05, z, r, 0.07, l - 2 * r); slab(KB, rt, x + w / 2 - r / 2, h - 0.05, z, r, 0.07, l - 2 * r);
    flat('cSoil', TN.one, x, h - 0.02, z, w - 2 * r, l - 2 * r);
  }
  /** bouquets, wreath, grave lamps at a spot */
  function flowers(x, z, y, v, n = 1) { for (let i = 0; i < n; i++) { const a = v[(i + 2) % 6]; card2(a < 0.5 ? 'bqA' : 'bqB', TN.one, x + (i - (n - 1) / 2) * 0.28, y, z + (i % 2) * 0.12, 0.34 + a * 0.12, 0.27 + a * 0.08, a * 3); } }
  /** plant cards (goutweed / nettle / fern) round the foot of a plot */
  function plants(hw, hl, zone, v, n) {
    for (let i = 0; i < n; i++) {
      const a = v[(i + 3) % 6], b = v[(i + 1) % 6], side = i % 4, cn = zone === 'D' ? 'pTuft' : (a < 0.5 ? 'pGout' : a < 0.75 ? 'pNet' : 'pFern'), s = 0.55 + b * 0.5;
      const x = side < 2 ? (side ? 1 : -1) * (hw + 0.15 + b * 0.25) : (b - 0.5) * 2 * hw, z = side < 2 ? (a - 0.5) * 2 * hl : (side === 2 ? 1 : -1) * (hl + 0.1 + b * 0.2);
      card2(cn, mulT(TN.one, 0.85 + 0.3 * a), x, 0, z, s * 1.1, s * 0.85, a * 6);
    }
  }
  /** iron panels round a rectangle (hw, hl): panels about 1.2 m wide, the pattern f = [cell, h] */
  function fenceAround(hw, hl, f, t, gate) {
    const run = (len, cx, cz, yaw) => { const n = Math.max(1, Math.round(len / 1.2)), pw = len / n, c = Math.cos(yaw), s = Math.sin(yaw); for (let i = 0; i < n; i++) { const o = -len / 2 + pw * (i + 0.5); panel(f[0], t, cx + c * o, 0, cz - s * o, pw + 0.04, f[1], yaw); } };
    run(hw * 2, 0, hl, 0); run(hw * 2, 0, -hl, 0); run(hl * 2, -hw, 0, Math.PI / 2); run(hl * 2, hw, 0, Math.PI / 2);
    void gate;
  }
  const fenceTint = (v) => (v < 0.55 ? TN.iron : v < 0.9 ? TN.rust : TN.rustD);

  // ------------------------------------------------------------------------------------------------ archetypes
  const A = {
    edge(p) {                                                             // a tuft of grass / goutweed / nettle at the ragged edge of an alley (photos sd204 sd236: no kerb, a grass strip of 0.5-1 m)
      const { v } = p, n = 2 + (v[2] > 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) { const a = v[(i + 1) % 6], b = v[(i + 3) % 6]; card2(a < 0.45 ? 'pTuft' : a < 0.7 ? 'pGout' : a < 0.85 ? 'pNet' : 'pFern', mulT(TN.one, 0.85 + 0.3 * b), (b - 0.5) * 1.2, 0, (a - 0.5) * 0.8, 0.8 + b * 0.5, 0.45 + a * 0.35, a * 6); }
    },
    stele(p) {                                                            // S1 modern polished stele on a plinth, kerb frame, gravel or soil, flowers (D: the common one)
      const { v } = p, st = stoneTint(v[0]), t = tinted(st, v[1]), w = 0.55 + v[2] * 0.75, h = 0.9 + v[3] * 0.45, z0 = -1.2 + 0.4;
      const face = v[4] < 0.45 ? 'sCross' : v[4] < 0.75 ? 'sOval' : 'sBorder';
      if (p.zone === 'D' || v[5] < 0.55) { kerbFrame(1.05, 2.3, 0.17, mulT(TN[st === 'pale' ? 'grey' : st], 1.0), v[1] < 0.7); fill(v[2] < 0.6 ? 'g' : 's', 0, 0.15, 0.1, 0.8, 1.9); } else { slab('sKerb', tinted('conc', v[1]), 0, 0, 0.1, 0.95, 0.12, 2.0); fill('s', 0, 0.115, 0.1, 0.8, 1.8); }
      slab('sKerb', mulT(TN.black, 1.0), 0, 0, z0, w + 0.16, 0.2, 0.28);
      slab(face, t, 0, 0.2, z0, w, h - 0.1, 0.1); if (v[0] > 0.15) taper('sKerb', t, 0, 0.2 + h - 0.1, z0, w, 0.12, 0.1);
      flowers(w * 0.3, z0 + 0.5, 0.18, v, v[3] < 0.5 ? 2 : 1); if (v[4] > 0.7) card2('candle', TN.one, -w * 0.3, 0.18, z0 + 0.4, 0.1, 0.14, 0);
      return { hw: 0.55, hl: 1.15 };
    },
    soviet(p) {                                                           // S2 Soviet stele with a pebble face / S3 boulder with a plaque / S7 sloping slab
      const { v } = p, z0 = -0.75, k = v[0];
      if (k < 0.5) {
        const t = k < 0.2 ? mulT(TN.pink, 1.0) : k < 0.35 ? TN.conc : tinted('grey', v[1]), w = 0.6 + v[2] * 0.4, h = 0.85 + v[3] * 0.5;
        slab('sKerb', TN.conc, 0, 0, 0.1, 0.9, 0.14, 2.0); fill('s', 0, 0.135, 0.1, 0.7, 1.8);
        slab('sSoviet', t, 0, 0, z0, w, h, 0.12); taper('sSoviet', t, 0, h, z0, w, 0.14, 0.12);
        flowers(0.15, z0 + 0.45, 0.14, v, 1);
      } else if (k < 0.75) {
        taper('sRust', mulT(TN.red, 0.8 + 0.4 * v[1]), 0, 0, z0 + 0.05, 1.2 + v[2] * 0.7, 0.9 + v[3] * 0.9, 0.9, v[2] * 3); slab('sMarble', TN.marble, 0, 0.45, z0 + 0.5, 0.45, 0.32, 0.04, 0.2);
        crossAt('x5', TN.red, 0, 0.9 + v[3] * 0.9 - 0.02, z0 + 0.05, 0.7); fill('s', 0, 0.045, 0.5, 1.0, 1.2); flowers(0.1, 0.2, 0.05, v, 2);
      } else {
        slab('sMarble', tinted('pale', v[1]), 0, 0.0, 0.0, 0.78, 0.14, 1.7); taper('sMarble', tinted('pale', v[1]), 0, 0.14, 0.0, 0.7, 0.06, 1.6); flowers(0, 0.5, 0.2, v, 1);
      }
      return {};
    },
    iron(p) {                                                             // X1 cast-iron openwork cross / X2 forged cross on a stone pedestal or in a cobble tub
      const { v } = p, hl = plotInfo(p).hl, z0 = -hl + 0.5, cn = v[0] < 0.7 ? 'x1' : 'x2', t = v[1] < 0.5 ? TN.iron : v[1] < 0.78 ? TN.silver : TN.rust;
      const lean = v[2] < 0.3 ? (v[3] - 0.5) * 0.28 : 0, back = v[2] < 0.15 ? (v[4] - 0.5) * 0.12 : 0;
      let base = 0;
      if (v[3] < 0.55) { slab('sKerb', tinted('grey', v[4]), 0, 0, z0, 0.74, 0.14, 0.74); slab('sDado', tinted('conc', v[2]), 0, 0.14, z0, 0.52, 0.55, 0.52); slab('sKerb', tinted('grey', v[4]), 0, 0.69, z0, 0.62, 0.08, 0.62); base = 0.77; }
      else { tub(0, z0 + 0.45, 0.95, 1.7, 0.34, v[4] < 0.35, v[1]); base = 0.34; }
      crossAt(cn, t, 0, base - 0.02, z0 - (v[3] < 0.55 ? 0 : 0.0) + (v[3] < 0.55 ? 0 : -0.45 + 0.45), 1.35 + v[4] * 0.55, back, lean);
      if (v[3] < 0.55) { if (v[5] < 0.5) fill('s', 0, 0.045, 0.35, 0.9, 1.5); else fill('l', 0, 0.045, 0.35, 0.9, 1.5); flowers(0.1, 0.2, 0.02, v, v[5] < 0.5 ? 2 : 1); } else flowers(0.0, z0 + 0.7, 0.36, v, 2);
      return {};
    },
    pebble(p) {                                                           // X3 pebble-mosaic cross on a cobble tub (leaning), festoon on one in three
      const { v } = p, z0 = -0.55, lean = (v[1] - 0.5) * (v[0] < 0.35 ? 0.6 : 0.24);
      tub(0, 0.15, 1.0, 1.9, 0.4, v[2] < 0.34, v[3]); crossAt('x3', mulT(TN.one, 0.85 + 0.2 * v[1]), 0, 0.37, -0.6, 1.25 + v[4] * 0.4, (v[2] - 0.5) * 0.1, lean);
      flowers(0.05, 0.45, 0.4, v, 2); if (v[4] > 0.6) card2('cMoss', TN.one, 0, 0.3, 0.9, 0.9, 0.3, 0);
      void z0; return {};
    },
    trefoil(p) {                                                          // X4 painted stone trefoil cross, a small base, a low kerb
      const { v } = p, hl = plotInfo(p).hl, z0 = -hl + 0.5, t = v[0] < 0.5 ? TN.white : v[0] < 0.8 ? mulT(TN.greyL, 1.15) : [0.62, 0.56, 0.48];
      slab('sKerb', tinted('conc', v[1]), 0, 0, z0, 0.5, 0.3, 0.5); crossAt('x4', t, 0, 0.28, z0, 1.2 + v[2] * 0.45, 0, (v[3] - 0.5) * (v[3] < 0.3 ? 0.4 : 0.1));
      kerbFrame(1.0, 2.1, 0.12, tinted('conc', v[4]), false); fill(v[1] < 0.5 ? 'g' : 's', 0, 0.11, 0.1, 0.78, 1.82); flowers(0.1, 0.35, 0.12, v, 1);
      return {};
    },
    granite(p) {                                                          // X5 granite cross on a stepped pedestal / T2 obelisk / T1 column with an urn
      const { v } = p, hl = plotInfo(p).hl, z0 = -hl + 0.6, st = v[1] < 0.6 ? 'black' : v[1] < 0.82 ? 'red' : 'grey', t = tinted(st, v[2]), pk = v[0];
      slab('sKerb', tinted('grey', v[3]), 0, 0, z0, 1.15, 0.12, 1.15);
      if (pk < 0.58) {                                                    // cross on a dado
        slab('sKerb', tinted('grey', v[3]), 0, 0.12, z0, 0.92, 0.12, 0.92); slab('sDado', t, 0, 0.24, z0, 0.68, 0.95, 0.68); slab('sKerb', t, 0, 1.19, z0, 0.78, 0.1, 0.78);
        crossAt('x5', mulT(t, 1.0), 0, 1.27, z0, 1.2 + v[4] * 0.2, 0, (v[4] - 0.5) * 0.04);
      } else if (pk < 0.78) {                                             // obelisk with a lead ball / pyramid cap
        slab('sKerb', tinted('grey', v[3]), 0, 0.12, z0, 0.92, 0.12, 0.92); slab('sDado', t, 0, 0.24, z0, 0.66, 0.5, 0.66); taper('sDado', t, 0, 0.74, z0, 0.5, 2.0 + v[4] * 0.8, 0.5); pyr('sDado', t, 0, 2.74 + v[4] * 0.8, z0, 0.31, 0.3, 0.31);
      } else {                                                            // baluster column with an urn (T1), broken top on one in four
        slab('sKerb', tinted('grey', v[3]), 0, 0.12, z0, 0.9, 0.12, 0.9); slab('sDado', t, 0, 0.24, z0, 0.62, 0.5, 0.62); shaft('sKerb', mulT(TN.lime, 0.9), 0, 0.74, z0, 0.36, 1.35 + v[4] * 0.5, 0.36);
        if (v[5] > 0.25) { slab('sKerb', mulT(TN.lime, 0.9), 0, 2.1 + v[4] * 0.5, z0, 0.5, 0.1, 0.5); shaft('sKerb', mulT(TN.lime, 0.9), 0, 2.2 + v[4] * 0.5, z0, 0.34, 0.3, 0.34); taper('sKerb', mulT(TN.lime, 0.9), 0, 2.5 + v[4] * 0.5, z0, 0.42, 0.14, 0.42); }
      }
      kerbFrame(1.2, 2.4, 0.14, tinted('grey', v[3]), v[5] < 0.5); fill(v[4] < 0.5 ? 'g' : 's', 0, 0.13, 0.15, 0.95, 2.1); flowers(0.1, 0.4, 0.14, v, 1);
      return {};
    },
    wood(p) {                                                             // X6 gabled wooden cross / X7 plain weathered cross, small plinth, mound, flowers, a grave lamp
      const { v } = p, hl = plotInfo(p).hl, z0 = -hl + 0.55, cn = v[0] < 0.55 ? 'x6' : 'x7', t = cn === 'x6' ? (v[1] < 0.5 ? TN.wood : TN.woodD) : TN.woodG;
      slab('sKerb', TN.concW, 0, 0, z0, 0.45, 0.14, 0.45); crossAt(cn, t, 0, 0.12, z0, cn === 'x6' ? 1.7 + v[2] * 0.6 : 1.2 + v[2] * 0.4, (v[3] - 0.5) * 0.06, (v[3] - 0.5) * 0.1);
      taper('sKerb', mulT(TN.soil, 0.7), 0, 0, 0.1, 0.9, 0.2, 1.7); fill('s', 0, 0.185, 0.1, 0.5, 1.2);
      flowers(0, 0.55, 0.19, v, v[4] < 0.6 ? 2 : 1); if (v[4] > 0.5) card2('candle', TN.one, 0.25, 0.19, z0 + 0.35, 0.1, 0.14, 0.4); if (v[5] > 0.82) card2('wreath', TN.one, -0.3, 0.19, 0.4, 0.45, 0.55, 0.2);
      return {};
    },
    tomb(p) {                                                             // T3 sarcophagus on a stepped plinth / T5 white marble mourning tomb with an urn
      const { v } = p, hl = plotInfo(p).hl, z0 = -hl + 1.0, k = v[0], st = v[1] < 0.5 ? 'red' : v[1] < 0.8 ? 'grey' : 'black', t = k < 0.7 ? tinted(st, v[2]) : TN.marble;
      slab('sKerb', tinted('grey', v[3]), 0, 0, z0, 1.7, 0.14, 2.5); slab('sKerb', tinted('grey', v[3]), 0, 0.14, z0, 1.45, 0.14, 2.25);
      if (k < 0.7) { slab('sDado', t, 0, 0.28, z0, 0.95, 0.75, 1.85); taper('sDado', t, 0, 1.03, z0, 1.05, 0.3, 1.95); crossAt('x5', t, 0, 1.28, z0 - 0.7, 0.55); }
      else { slab('sMarble', t, 0, 0.28, z0, 0.9, 1.1, 1.0); slab('sMarble', t, 0, 1.38, z0, 1.0, 0.1, 1.1); shaft('sMarble', t, 0, 1.48, z0, 0.42, 0.5, 0.42); taper('sMarble', t, 0, 1.98, z0, 0.5, 0.16, 0.5); }
      kerbFrame(1.9, 2.8, 0.1, tinted('grey', v[3]), false); fill('g', 0, 0.09, z0 + 0.0, 1.6, 2.5); flowers(0.3, z0 + 1.15, 0.14, v, 2);
      return {};
    },
    chapel(p) {                                                           // C1 classical aedicule / C2 Neo-Gothic canopy / C3 iron gazebo / C4 small white chapel / C6 red-granite four-pier pavilion
      const { v } = p, k = v[0];
      if (k < 0.3) {                                                      // C1: four shafts, entablature, a low hip, an arched niche with a grille
        const t = tinted('lime', v[1]), pt = tinted('red', v[2]);
        slab('sKerb', pt, 0, 0, 0, 2.7, 0.22, 2.9); slab('sKerb', pt, 0, 0.22, 0, 2.4, 0.2, 2.6);
        for (const [x, z] of [[-0.85, -1.0], [0.85, -1.0], [-0.85, 1.0], [0.85, 1.0]]) { shaft('sMarble', t, x, 0.42, z, 0.3, 2.2, 0.3); slab('sKerb', t, x, 2.62, z, 0.42, 0.14, 0.42); slab('sKerb', t, x, 0.42, z, 0.4, 0.12, 0.4); }
        slab('sAedi', t, 0, 0.42, -1.12, 1.9, 2.2, 0.14); slab('sKerb', t, 0, 2.76, 0, 2.2, 0.3, 2.6); pyr('sKerb', TN.concW, 0, 3.06, 0, 2.4, 0.7, 2.8); crossAt('x5', TN.iron, 0, 3.74, 0, 0.7);
        panel('grille', TN.iron, 0, 0.42, 1.06, 1.7, 1.7);
      } else if (k < 0.5) {                                               // C2: clustered shafts, ogee gables, a stepped cap, an iron door
        const t = tinted('lime', v[1]);
        slab('sKerb', tinted('grey', v[2]), 0, 0, 0, 2.3, 0.2, 2.3); for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const d of [-0.07, 0.07]) shaft('sMarble', t, sx * 0.85 + d, 0.2, sz * 0.85 + d, 0.13, 2.4, 0.13);
        slab('sGothic', t, 0, 0.2, -0.95, 1.6, 2.3, 0.12); slab('sKerb', t, 0, 2.6, 0, 2.0, 0.22, 2.0); pyr('sKerb', mulT(TN.grey, 0.9), 0, 2.82, 0, 1.9, 0.8, 1.9); pyr('sKerb', mulT(TN.grey, 0.9), 0, 3.62, 0, 0.6, 0.5, 0.6);
        panel('grille', TN.iron, 0, 0.2, 0.98, 1.4, 2.0); crossAt('x5', TN.iron, 0, 4.1, 0, 0.6);
      } else if (k < 0.7) {                                               // C3: lattice walls on three sides, an open front with a low gate, a pitched iron roof
        const t = v[1] < 0.6 ? TN.rust : TN.iron;
        for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) slab('sKerb', t, x * 0.98, 0, z * 0.98, 0.1, 2.6, 0.1);
        panel('lat', t, 0, 0, -0.98, 2.0, 2.6); panel('lat', t, -0.98, 0, 0, 2.0, 2.6, Math.PI / 2); panel('lat', t, 0.98, 0, 0, 2.0, 2.6, Math.PI / 2);
        pyr('sKerb', TN.roofIron, 0, 2.6, 0, 2.5, 0.75, 2.5); slab('sKerb', tinted('grey', v[2]), 0, 0, 0, 1.7, 0.1, 1.7); panel('f11', t, 0, 0, 1.0, 1.8, 1.0); slab('sKerb', tinted('red', v[3]), 0, 0.0, -0.3, 1.1, 0.35, 0.7);
        crossAt('x7', TN.iron, 0, 3.3, 0, 0.55);
      } else if (k < 0.85) {                                              // C4: a small white chapel-tomb
        slab('sPlain', mulT(TN.concW, 1.0), 0, 0, 0, 1.5, 2.3, 1.5); slab('sKerb', TN.white, 0, 0, 0, 1.64, 0.2, 1.64); slab('sKerb', TN.white, 0, 2.3, 0, 1.7, 0.14, 1.7); pyr('sPlain', tinted('rust', v[2]), 0, 2.44, 0, 1.8, 0.9, 1.8);
        crossAt('x5', TN.gold, 0, 3.32, 0, 0.6); panel('grille', TN.iron, 0, 0.2, 0.76, 0.7, 1.7); slab('sKerb', tinted('grey', v[3]), 0, 0, 1.1, 1.0, 0.12, 0.5);
      } else {                                                            // C6: four tapering red-granite piers under a low pediment
        const t = tinted('red', v[1]);
        slab('sKerb', t, 0, 0, 0, 1.9, 0.16, 1.9); slab('sKerb', t, 0, 0.16, 0, 1.7, 0.14, 1.7);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) taper('sDado', t, sx * 0.68, 0.3, sz * 0.68, 0.3, 1.5, 0.3);
        slab('sKerb', t, 0, 1.8, 0, 1.75, 0.2, 1.75); pyr('sKerb', t, 0, 2.0, 0, 1.85, 0.45, 1.85); slab('sPlain', mulT(TN.red, 0.7), 0, 0.3, -0.55, 1.1, 1.3, 0.08);
      }
      return {};
    },
  };

  /** near level: the full plot */
  function compose(p, sink) {
    K = sink; sink.plot(p);
    const info = plotInfo(p), fn = A[p.type] || A.stele;
    fn(p);
    if (p.type === 'edge') { K = null; return; }
    if (p.fence && p.type !== 'chapel') {
      const f = p.fam ? pickFence(p.v[2]) : pickFence(p.v[1]), t = f[0] === 'f6' ? TN.blue : fenceTint(p.v[3]);
      fenceAround(info.hw, info.hl, f, t, true);
    }
    if (p.type !== 'chapel') plants(info.hw, info.hl, p.zone, p.v, p.zone === 'D' ? 2 : 3 + (p.v[5] > 0.5 ? 1 : 0));
    else plants(1.3, 1.5, p.zone, p.v, 3);
    K = null;
  }
  /** far level: the monument and a bed block */
  function composeFar(p, sink) {
    if (p.type === 'edge') return;
    K = sink; sink.plot(p);
    const info = plotInfo(p), v = p.v, st = stoneTint(v[0]);
    switch (p.type) {
      case 'chapel': slab('sPlain', TN.concW, 0, 0, 0, 2.2, 2.6, 2.2); pyr('sPlain', TN.roofIron, 0, 2.6, 0, 2.6, 1.0, 2.6); break;
      case 'tomb': slab('sKerb', TN.grey, 0, 0, -info.hl + 1.0, 1.5, 1.1, 2.4); break;
      case 'granite': slab('sKerb', tinted(v[1] < 0.6 ? 'black' : 'red', v[2]), 0, 0, -info.hl + 0.6, 0.7, 1.4, 0.7); if (!p.fence) slab('sKerb', TN.conc, 0, 0, 0.1, 1.1, 0.14, 2.3); break;
      case 'stele': case 'soviet': slab('sKerb', tinted(st, v[1]), 0, 0, -0.8, 0.8, 1.1, 0.1); slab('sKerb', TN.conc, 0, 0, 0.1, 1.0, 0.14, 2.2); break;
      case 'pebble': slab('sKerb', TN.conc, 0, 0, 0.15, 1.0, 0.4, 1.9); slab('sKerb', mulT(TN.greyL, 1.1), 0, 0.4, -0.6, 0.16, 1.2, 0.08); break;
      default: slab('sKerb', p.type === 'wood' ? TN.woodG : p.type === 'iron' ? TN.iron : mulT(TN.greyL, 1.15), 0, 0, -info.hl + 0.5, 0.14, 1.5, 0.08);
    }
    if (p.fence && p.type !== 'chapel') slab('sKerb', TN.rustD, 0, 0, 0, info.hw * 2, 0.3, info.hl * 2);
    K = null;
  }
  return { compose, composeFar };
}
