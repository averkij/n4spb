// landmarksMarineFacade/terminals.js - the four passenger terminals of the Marine Facade port (A-Len, 2008-11; dossier docs/research/marinefacade.md sections 4.2 / 4.3, CRITIC 17.1 / 17.2) and the control
// centre (17.3).  Every terminal is the same WEDGE (photos alen_01 02 03 07 08, V 30 37 10): ONE inclined roof plane rises from a 2-storey low end (rear fascia top 9.5 m) to the 3-storey glazed HIGH end (fascia top
// 15.0 m at the glass line) and goes on as a pointed wing of ~6-10 m (tip 17 m); the roof is a 1.3 m plate (white-grey metal cap 0.35 m over an orange-copper timber band 0.95 m, timber-slat soffit), the strut
// side and the high end carry a fan of light-grey inclined tubes under the cantilever, white tapered concrete piers stand at the ground floor, the plain berth-side wall is grey composite panels with a ribbon
// window band per storey and vertical timber-slat screens; a white plate «МОРСКОЙ ВОКЗАЛ N TERMINAL» sits above the entrance.  No flags, no logos.
// Frames: every terminal is built in its own frame (a = from the LOW end to the high end along the roof, b = across with +b on the strut side, y up) placed on the port frame F from the measured roof
// rectangle TERMS[i].roof; the OSM polygon only gives the strut-side overhang and the wing length.  Closed territory: the body is a solid collider, nobody enters.
import * as THREE from 'three';
import { FW, U_DIR, V_DIR, TERMS, CUP } from './frame.js';
import { coverFn, fillPolyClipped } from './surfaces.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const DIRS = { u0: [-1, 0], u1: [1, 0], v0: [0, -1], v1: [0, 1] };

/** a square frustum (tapered pier): centre (cx, cz), half sizes at the foot (hw0 x hd0) and the top (hw1 x hd1) */
export function frustum(P, mat, cx, cz, hw0, hd0, hw1, hd1, y0, y1) {
  const c = (sx, sz, hw, hd, y) => [cx + sx * hw, y, cz + sz * hd];
  const A = [c(-1, -1, hw0, hd0, y0), c(1, -1, hw0, hd0, y0), c(1, 1, hw0, hd0, y0), c(-1, 1, hw0, hd0, y0)];
  const B = [c(-1, -1, hw1, hd1, y1), c(1, -1, hw1, hd1, y1), c(1, 1, hw1, hd1, y1), c(-1, 1, hw1, hd1, y1)];
  const side = (i, j, n) => P.quad(mat, A[i], A[j], B[j], B[i], n, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  side(0, 1, [0, 0, -1]); side(1, 2, [1, 0, 0]); side(2, 3, [0, 0, 1]); side(3, 0, [-1, 0, 0]);
  P.quad(mat, B[0], B[1], B[2], B[3], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}

export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics, labels = ctx.services?.labels;
  const step = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMarineFacade/terminals] ${name}:`, e); } };
  const ac = [], pads = [];                                                                          // roof plant boxes in world coordinates
  for (const T of TERMS) step(T.key, () => terminal(K, T, ac, labels, pads));
  // the brick-paver forecourt in front of every entrance (alen_07: red-brown pavers 20 x 10 cm, clipped at the asphalt)
  const cover = coverFn(ctx);
  for (const ring of pads) step('pad', () => fillPolyClipped(P, M.pavers, ring, 0.05, cover, { margin: 0.3, maxEdge: 3, tile: 3 }));
  svc.pads = pads.map((r) => r.map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]));
  step('cup', () => cup(K));
  // roof plant: white AC boxes 1.5 x 1.0 x 1.0 m (69 of them, built into the terminal mesh)
  for (const o of ac) { P.push(o.x, o.y, o.z, o.rot); try { P.box(M.white, -0.75, 0.75, 0, 1.0, -0.5, 0.5, 'b', 1); P.box(M.grey, -0.7, 0.7, 1.0, 1.08, -0.45, 0.45, 'b', 1); } finally { P.pop(); } }
  svc.counts.ac = ac.length;
}

function terminal(K, T, ac, labels, pads) {
  const { ctx, P, M, svc } = K, ph = ctx.physics, cover = coverFn(ctx);
  const R = T.roof, Q0 = T.poly;
  const ea = DIRS[T.high], eb = DIRS[T.strut];
  const Lr = Math.abs(ea[0]) ? R.u1 - R.u0 : R.v1 - R.v0, Wr = Math.abs(ea[0]) ? R.v1 - R.v0 : R.u1 - R.u0;
  // the strut-side overhang and the wing length from the polygon (clamped: a 16 m cantilever is not credible)
  const ext = (side) => (side === 'u0' ? Q0.u0 - R.u0 : side === 'u1' ? R.u1 - Q0.u1 : side === 'v0' ? Q0.v0 - R.v0 : R.v1 - Q0.v1);
  const ov = clamp(ext(T.strut), 3.5, 9), wing = clamp(ext(T.high), 6.0, 10.5);
  const L = Lr - wing, W2 = Wr / 2;
  // placement: origin = the middle of the LOW end of the roof rectangle
  const low = T.high === 'u0' ? [R.u1, (R.v0 + R.v1) / 2] : T.high === 'u1' ? [R.u0, (R.v0 + R.v1) / 2] : T.high === 'v0' ? [(R.u0 + R.u1) / 2, R.v1] : [(R.u0 + R.u1) / 2, R.v0];
  const o = FW(low[0], low[1]);
  const ew = [ea[0] * U_DIR[0] + ea[1] * V_DIR[0], ea[0] * U_DIR[1] + ea[1] * V_DIR[1]];            // world direction of +a
  const rot = Math.atan2(-ew[1], ew[0]), zdir = [-ew[1], ew[0]];
  const ebw = [eb[0] * U_DIR[0] + eb[1] * V_DIR[0], eb[0] * U_DIR[1] + eb[1] * V_DIR[1]];
  const sb = ebw[0] * zdir[0] + ebw[1] * zdir[1] > 0 ? 1 : -1;                                      // +b (the strut side) = sb * local z
  const wld = (a, b) => ({ x: o.x + ew[0] * a + zdir[0] * sb * b, z: o.z + ew[1] * a + zdir[1] * sb * b });
  // frame helpers (a, b, y) -> the Parts frame (x = a, z = sb * b)
  const pt = (a, y, b) => [a, y, sb * b];
  const Q = (mat, p, nh, uv) => P.quad(mat, pt(...p[0]), pt(...p[1]), pt(...p[2]), pt(...p[3]), [nh[0], nh[1], sb * nh[2]], uv);
  const FAN = (mat, pts, nh, uvf) => P.fan(mat, pts.map((p) => pt(...p)), [nh[0], nh[1], sb * nh[2]], (q) => uvf(q[0], q[1], sb * q[2]));
  const BX = (mat, a0, a1, y0, y1, b0, b1, skip = '') => {
    let z0 = Math.min(sb * b0, sb * b1), z1 = Math.max(sb * b0, sb * b1);
    if (sb < 0) skip = skip.replace(/f/g, '#').replace(/k/g, 'f').replace(/#/g, 'k');
    P.box(mat, a0, a1, y0, y1, z0, z1, skip, 1);
  };
  const CYL = (mat, a0, y0, b0, a1, y1, b1, r0, r1 = r0, seg = 7, caps = false) => P.cyl(mat, pt(a0, y0, b0), pt(a1, y1, b1), r0, r1, seg, caps);
  const yTop = (a) => (a <= L ? 9.5 + 5.5 * a / L : 15.0 + 2.0 * (a - L) / wing);
  const soff = (a) => yTop(a) - 1.3;
  const TH = 1.3, CAPH = 0.35;
  const bB0 = -W2 + 0.6, bB1 = W2 - ov, aLow = 0.8;
  const Wt = 0.38 * W2;                                                                  // half width of the wing tip
  P.push(o.x, 0, o.z, rot);
  try {
    // ------------------------------------------------------------------------------------- the roof plate: body panel (a 0 .. L) and the wing (a L .. L + wing)
    const UP = [0, 1, 0], DN = [0, -1, 0];
    Q(M.roofTop, [[0, yTop(0), -W2], [L, yTop(L), -W2], [L, yTop(L), W2], [0, yTop(0), W2]], UP, [[0, -W2 / 2], [L / 2, -W2 / 2], [L / 2, W2 / 2], [0, W2 / 2]].map((q) => q));
    Q(M.soffit, [[0, soff(0), -W2], [L, soff(L), -W2], [L, soff(L), W2], [0, soff(0), W2]], DN, [[0, -W2 / 2], [L / 2, -W2 / 2], [L / 2, W2 / 2], [0, W2 / 2]]);
    Q(M.roofTop, [[L, yTop(L), -W2], [L + wing, yTop(L + wing), -Wt], [L + wing, yTop(L + wing), Wt], [L, yTop(L), W2]], UP, [[L / 2, -W2 / 2], [(L + wing) / 2, -Wt / 2], [(L + wing) / 2, Wt / 2], [L / 2, W2 / 2]]);
    Q(M.soffit, [[L, soff(L), -W2], [L + wing, soff(L + wing), -Wt], [L + wing, soff(L + wing), Wt], [L, soff(L), W2]], DN, [[L / 2, -W2 / 2], [(L + wing) / 2, -Wt / 2], [(L + wing) / 2, Wt / 2], [L / 2, W2 / 2]]);
    // fascia: white cap over the orange band, on the two long edges (body), the two slanted edges (wing), the low end and the tip
    const fascia = (a0, b0, a1, b1, nh) => {
      const y0a = yTop(a0), y0b = yTop(a1);
      Q(M.cap, [[a0, y0a - CAPH, b0], [a1, y0b - CAPH, b1], [a1, y0b, b1], [a0, y0a, b0]], nh);
      Q(M.band, [[a0, y0a - TH, b0], [a1, y0b - TH, b1], [a1, y0b - CAPH, b1], [a0, y0a - CAPH, b0]], nh);
    };
    fascia(0, -W2, L, -W2, [0, 0, -1]); fascia(0, W2, L, W2, [0, 0, 1]); fascia(0, -W2, 0, W2, [-1, 0, 0]);
    { const dl = [wing, W2 - Wt]; const nl = Math.hypot(...dl); fascia(L, -W2, L + wing, -Wt, [dl[1] / nl, 0, -dl[0] / nl]); fascia(L, W2, L + wing, Wt, [dl[1] / nl, 0, dl[0] / nl]); }
    fascia(L + wing, -Wt, L + wing, Wt, [1, 0, 0]);
    // the flat joint between body panel and wing (the roof plane kinks 4 deg): close the under-gap with the soffit quads above (shared edge at a = L)

    // ------------------------------------------------------------------------------------- the body: plain berth wall, low end wall, glazed strut side, glazed high end
    const aF = L + 1.0, topF = soff(L - 1.2);
    FAN(M.panel, [[aLow, 0, bB0], [aF, 0, bB0], [aF, 5.2, bB0], [L - 1.2, topF, bB0], [aLow, soff(aLow), bB0]], [0, 0, -1], (a, y) => [a / 4.8, y / 4.2]);
    Q(M.panel, [[aLow, 0, bB1], [aLow, 0, bB0], [aLow, soff(aLow), bB0], [aLow, soff(aLow), bB1]], [-1, 0, 0], [[bB1 / 4.8, 0], [bB0 / 4.8, 0], [bB0 / 4.8, soff(aLow) / 4.2], [bB1 / 4.8, soff(aLow) / 4.2]]);
    // strut side: lower glass (ground floor) and upper glass, the ledge between them
    const gl = (a, y) => [a / 1.6, y / 1.4];
    Q(M.glassWall, [[aLow, 0.0, bB1], [aF, 0.0, bB1], [aF, 5.0, bB1], [aLow, 5.0, bB1]], [0, 0, 1], [gl(aLow, 0), gl(aF, 0), gl(aF, 5.0), gl(aLow, 5.0)]);
    FAN(M.glassWall, [[aLow, 5.6, bB1], [aF, 5.6, bB1], [L - 1.2, topF, bB1], [aLow, soff(aLow), bB1]], [0, 0, 1], (a, y) => gl(a, y));
    // high end: the ground-floor glass at a = aF and the glazing leaning back 10 deg from the ledge up to the soffit
    Q(M.glassWall, [[aF, 0.0, bB0], [aF, 0.0, bB1], [aF, 5.0, bB1], [aF, 5.0, bB0]], [1, 0, 0], [[bB0 / 1.6, 0], [bB1 / 1.6, 0], [bB1 / 1.6, 5.0 / 1.4], [bB0 / 1.6, 5.0 / 1.4]]);
    { const yl = topF, ln = Math.hypot(aF - (L - 1.2), yl - 5.6), na = (yl - 5.6) / ln, ny = (aF - (L - 1.2)) / ln;
      Q(M.glassWall, [[aF, 5.6, bB0], [aF, 5.6, bB1], [L - 1.2, yl, bB1], [L - 1.2, yl, bB0]], [na, ny, 0], [[bB0 / 1.6, 5.6 / 1.4], [bB1 / 1.6, 5.6 / 1.4], [bB1 / 1.6, yl / 1.4], [bB0 / 1.6, yl / 1.4]]); }
    // ledge / canopy line (grey metal) along the strut side and the high end, y 5.0 .. 5.6
    BX(M.canopy, aLow, aF + 1.4, 5.0, 5.6, bB1 - 0.1, bB1 + 1.4, 'b');
    BX(M.canopy, aF - 0.1, aF + 1.4, 5.0, 5.6, bB0, bB1 + 1.4, 'b');
    // the entrance: a grey canopy wing 4 x 6 m over two sliding doors, the name plate on the glass beside it
    const bE = bB0 + 10.5;
    BX(M.canopy, aF + 1.4, aF + 4.6, 5.1, 5.9, bE - 3.0, bE + 3.0, '');
    Q(M.doorGlass, [[aF + 0.04, 0.0, bE - 1.2], [aF + 0.04, 0.0, bE + 1.2], [aF + 0.04, 2.5, bE + 1.2], [aF + 0.04, 2.5, bE - 1.2]], [1, 0, 0]);
    BX(M.doorFrame, aF + 0.02, aF + 0.1, 0, 2.6, bE - 1.3, bE - 1.2, ''); BX(M.doorFrame, aF + 0.02, aF + 0.1, 0, 2.6, bE + 1.2, bE + 1.3, ''); BX(M.doorFrame, aF + 0.02, aF + 0.1, 2.5, 2.6, bE - 1.3, bE + 1.3, '');
    { const q = [wld(aF + 0.4, bE - 11), wld(aF + 11, bE - 11), wld(aF + 11, bE + 11), wld(aF + 0.4, bE + 11)]; pads.push(q.map((p) => [p.x, p.z])); }
    // ---- piers: tapered white concrete (1.5 m at the foot, 1.0 m at the top, 5.2 m), 7 m pitch, along the high-end front and the strut side
    const piers = [];
    for (let b = bB0 + 2; b < bB1 + 1.0; b += 7) if (Math.abs(b - bE) > 3.6) piers.push([aF + 1.1, b]);
    for (let a = aLow + 4; a < aF - 3; a += 7) piers.push([a, bB1 + 1.0]);
    // road integrity: a pier whose footprint touches the asphalt (net.cover) is left out (counted)
    for (const [a, b] of piers) { const pw = wld(a, b); if (cover(pw.x, pw.z) > -0.9) { svc.counts.piersSkipped = (svc.counts.piersSkipped || 0) + 1; continue; } frustum(P, M.pier, a, sb * b, 0.75, 0.75, 0.5, 0.5, 0, 5.2); svc.counts.piers = (svc.counts.piers || 0) + 1; }
    // ---- struts: the fan at the high end and a pair every 6.2 m along the strut side (light grey tubes d 0.48 m, leaning out ~32 deg from the vertical)
    const nf = 9;
    for (let k = 0; k < nf; k++) {
      const b = bB0 + 1.5 + (bB1 + 0.5 - bB0 - 1.5) * k / (nf - 1), run = 5.5, ah = aF + 1.1 + run, t = (ah - L) / wing, bh = b * (1 - 0.62 * clamp(t, 0, 1));
      CYL(M.strut, aF + 1.1, 5.6, b, ah, soff(ah) - 0.15, bh, 0.24, 0.2);
    }
    const strutLen = L - 12;
    for (let a = 7; a < L - 5; a += 6.2) {
      for (const d of [0, 1.15]) CYL(M.strut, a + d, 5.6, bB1 + 1.0, a + d + 0.3, soff(a + d) - 0.12, bB1 + ov - 0.4, 0.24, 0.2);
      // a secondary rod between the pair (thin)
      CYL(M.rod, a + 0.1, 5.6, bB1 + 1.0, a + 1.3, soff(a + 1.2) - 0.2, bB1 + ov - 0.5, 0.09, 0.09, 5);
    }
    void strutLen;
    // ---- doors along the plain wall (5 small glass doors 1.1 x 2.2 m), vertical timber-slat screens (1.2 x 6 m) at the glass end and near the low end
    for (let k = 0; k < 5; k++) { const a = aLow + 12 + k * Math.max(8, (L - 36) / 4); if (a > L - 14) break; Q(M.doorGlass, [[a, 0, bB0 - 0.03], [a + 1.1, 0, bB0 - 0.03], [a + 1.1, 2.2, bB0 - 0.03], [a, 2.2, bB0 - 0.03]], [0, 0, -1]); BX(M.doorFrame, a - 0.08, a + 1.18, 2.2, 2.3, bB0 - 0.06, bB0, 'b'); }
    for (const a of [L - 5.6, L - 9.2, aLow + 6, aLow + 9.6]) Q(M.screen, [[a, 0.0, bB0 - 0.05], [a + 1.2, 0.0, bB0 - 0.05], [a + 1.2, Math.min(soff(a) - 0.3, 7.0), bB0 - 0.05], [a, Math.min(soff(a) - 0.3, 7.0), bB0 - 0.05]], [0, 0, -1], [[0, 0], [1, 0], [1, 2], [0, 2]]);
    // the name plate: white rounded plate 3.2 x 1.1 m, centre 3.7 m up on the glass, left of the doors
    { const pb = bE - 5.0, pa = aF + 0.05;
      const pw = wld(pa, pb), nrm = ew;
      const free = !labels || labels.reserve(T.id, pw.x, 3.7, pw.z, 3.9, 1.2, nrm[0], nrm[1], 'plate');
      if (free) { { const v0 = 1 - T.n / 4, v1 = 1 - (T.n - 1) / 4; Q(M.plates, [[pa, 3.1, pb + sb * 1.95], [pa, 3.1, pb - sb * 1.95], [pa, 4.3, pb - sb * 1.95], [pa, 4.3, pb + sb * 1.95]], [1, 0, 0], [[0, v0], [1, v0], [1, v1], [0, v1]]); } svc.plates.push({ id: T.id, n: T.n, x: pw.x, z: pw.z }); } }
    // ---- roof plant (instanced AC boxes) and two small antennas at the low end
    const nPl = T.plant;
    for (let i = 0; i < nPl; i++) {
      const row = i % 2, a = 8 + (L - 16) * ((i / 2 | 0) + 0.5) / Math.ceil(nPl / 2), b = (row ? 1 : -1) * (W2 * 0.16 + (T.key === 't1' ? 0 : 3));
      const p = wld(a, b); ac.push({ x: p.x, y: yTop(a) + 0.0, z: p.z, rot: rot + Math.PI / 2 * 0 });
    }
    { const p = wld(6, W2 * 0.3); ac.push({ x: p.x, y: yTop(6), z: p.z, rot });
      P.col(M.rod, ...[pt(5.0, 0, W2 * 0.35)[0], pt(5.0, 0, W2 * 0.35)[2]], yTop(5.0), yTop(5.0) + 6.5, 0.06, 0.04, 5, false);
      P.col(M.rod, pt(7.0, 0, -W2 * 0.3)[0], pt(7.0, 0, -W2 * 0.3)[2], yTop(7.0), yTop(7.0) + 4.5, 0.05, 0.035, 5, false); }
    // ------------------------------------------------------------------------------------- colliders (closed territory: the body is solid)
    const ca = (aLow + aF + 1.4) / 2, cb = (bB0 + bB1 + 1.4) / 2, w0 = wld(ca, cb);
    ph.addBox(w0.x, w0.z, aF + 1.4 - aLow, bB1 + 1.4 - bB0, rot, 0, 15);
    svc.monuments.push({ id: T.id, name: 'Морской вокзал: терминал ' + T.n, x: wld(L / 2, 0).x, z: wld(L / 2, 0).z, h: 17 });
    svc.terminals.push({ id: T.id, key: T.key, n: T.n, x: wld(L / 2, 0).x, z: wld(L / 2, 0).z, a: { L, wing, W: Wr, ov }, rot, high: ew, entrance: wld(aF + 2.4, bE) });
  } finally { P.pop(); }
}

/** the control centre (w95606142, F u -60.6 .. -37.3 / v 413.8 .. 433.8, 23.3 x 20.1 m): 3 storeys, graphite panels on the E / N faces, salmon on the W face, an upper volume that cantilevers 2 m over the
 *  recessed ground floor on two sides, flat roof with a parapet and two antenna masts (alen_05).  Solid. */
function cup(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const u0 = CUP.u0, u1 = CUP.u1, v0 = CUP.v0, v1 = CUP.v1, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, c = FW(cu, cv);
  P.push(c.x, 0, c.z, 2.8489);                                                               // local x = u, local z = v
  try {
    const hu = (u1 - u0) / 2, hv = (v1 - v0) / 2, ov = 2.0;
    // ground floor, recessed 2 m on the +u (west) and -v sides
    P.box(M.dark, -hu + ov * 0, hu - ov, 0, 3.8, -hv + ov, hv, 'b', 1);
    P.box(M.cupGlass, -hu + 0.5, hu - ov - 0.05, 0.4, 3.0, -hv + ov - 0.04, -hv + ov + 0.04, '', 1);
    // the upper volume (3.8 .. 10.6): walls of two tones, ribbon windows in bands
    const top = 10.6;
    P.box(M.graphite, -hu, hu, 3.8, top, -hv, hv, '', 1);
    // west (+u... the F frame's +u is WNW): salmon face
    P.quad(M.salmon, [hu + 0.02, 3.8, hv], [hu + 0.02, 3.8, -hv], [hu + 0.02, top, -hv], [hu + 0.02, top, hv], [1, 0, 0]);
    // ribbon windows: two bands per floor on the long faces
    for (const [y0, y1] of [[4.6, 5.8], [6.4, 7.6], [8.2, 9.4]]) {
      P.quad(M.cupGlass, [-hu + 1, y0, -hv - 0.03], [hu - 1, y0, -hv - 0.03], [hu - 1, y1, -hv - 0.03], [-hu + 1, y1, -hv - 0.03], [0, 0, -1]);
      P.quad(M.cupGlass, [hu - 1, y0, hv + 0.03], [-hu + 1, y0, hv + 0.03], [-hu + 1, y1, hv + 0.03], [hu - 1, y1, hv + 0.03], [0, 0, 1]);
      P.quad(M.cupGlass, [-hu - 0.03, y0, hv - 1], [-hu - 0.03, y0, -hv + 1], [-hu - 0.03, y1, -hv + 1], [-hu - 0.03, y1, hv - 1], [-1, 0, 0]);
    }
    P.box(M.graphite, -hu - 0.05, hu + 0.05, top, top + 0.9, -hv - 0.05, hv + 0.05, 'b', 1);                 // parapet (solid block)
    P.box(M.grey, -hu + 0.4, hu - 0.4, top + 0.9, top + 0.95, -hv + 0.4, hv - 0.4, 'b', 1);
    P.col(M.rod, 5, 3, top + 0.9, top + 7, 0.07, 0.05, 6, false); P.col(M.rod, -6, -4, top + 0.9, top + 5, 0.06, 0.04, 6, false);
    P.box(M.white, 2, 4.4, top + 0.95, top + 2.2, -6, -3.4, 'b', 1);
  } finally { P.pop(); }
  ph.addBox(c.x, c.z, u1 - u0, v1 - v0, 2.8489, 0, 12);
  svc.cup = { x: c.x, z: c.z };
}
