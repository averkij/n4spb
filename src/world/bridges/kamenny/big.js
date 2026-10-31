// bridges/kamenny/big.js - the two big road bridges of Kamenny Island (spec data in kamenny/spec.js): the Kamennoostrovsky Bridge and the Ushakovsky Bridge.
// A cousin of bridges/long.js buildLong (same vocabulary: haunched plate girders with a soffit, stone arcade spans with a voussoir ring, round-nosed tower piers with a cornice ring and a parapet balcony, slim
// piers with a pedestal block, cast-panel railings (instanced), lamps, tram rails flush with the asphalt) with the differences this pair needs:
//   * the deck carries on over the LAND stubs of the OSM ways (`s0` / `s1` metres before / after the bank lines): the ways are claimed, streets does not draw them, so the asphalt, kerbs, pavements,
//     markings and tram rails run the whole way to the OSM ends (flat at +0.05, continuous with the approach streets)
//   * the arcade spans of the Ushakovsky Bridge are separated by a plain 'abut' pier (no cutwater: a straight wall with the dentil cornice), tower piers have their own radius across (towerRv)
//   * tram tracks are polylines in the OSM-start frame (they leave the straight line at the Aptekarsky end of the Kamennoostrovsky Bridge)
//   * lamps stand on the tower balconies (Kamennoostrovsky) or between the piers (Ushakovsky); fluted columns with the bronze trophy on the Ushakovsky bastions; granite obelisks at the
//     abutments of the Kamennoostrovsky Bridge; a name tripod at each end
// NO flags / flagpoles (user rules); no alarm sounds.  Own files: bridges/kamenny/* + bridges/kamenny.js.
import * as THREE from 'three';
import { frameOf, toUV, toWorld, frameBounds } from '../sites.js';
import { hump, bankU } from '../long.js';
import { closeBankFollow as closeBank } from './wing.js';
import { lampKam, lampUsh, columnUsh } from './pieces.js';
import { obelisk, tripod } from '../sculpt.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function buildBig(env, sp, K) {
  const { ctx, P, M, rails } = env, f = frameOf(sp), T = f.T, waterY = env.waterY, L = ctx.L;
  const LEN = sp.len, HW = sp.hw, ROAD = sp.road, KW = sp.kerbW, PAVE = 0.15, HV = HW + 0.35, yb = waterY - 0.3;
  const UD0 = -sp.s0, UD1 = LEN + sp.s1, UR0 = -1.2, UR1 = LEN + 1.2;                    // deck surfaces (the whole OSM way) / the structure + railings (the bank lines +- 1.2 m)
  const yDeck = hump(LEN, sp.crown), slopeOf = (u) => yDeck(u + 0.5) - yDeck(u - 0.5);
  const world = (u, v) => toWorld(sp, u, v);
  const B = { id: sp.id, x: world(LEN / 2, 0).x, z: world(LEN / 2, 0).z, yDeck, info: { rails: 0, colliders: 0, tris: 0 }, masts: [], span: { a: world(UD0, 0), b: world(UD1, 0), hw: HW } };
  B.at = world(LEN * 0.28, HW - 1.4);                                                    // photo spot: the pavement a quarter of the way
  B.bounds = frameBounds(sp, UD0 - 1, UD1 + 1, -HW - 0.3, HW + 0.3, 1.5);
  B.deckAt = (x, z) => { const q = toUV(sp, x, z); return Math.abs(q.v) <= HW + 0.3 && q.u >= UD0 && q.u <= UD1 ? yDeck(clamp(q.u, 0, LEN)) : null; };
  const lk = sp.look, fas = K[lk.fas], dark = K[lk.dark], gran = K[lk.granite], par = K[lk.parapet], pave = K[lk.pave], kerbM = K[lk.kerb];
  const faceShape = (mat, pts, v, sg, tile = 2.4, holes = []) => {
    const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
    for (const h of holes) sh.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p[0], p[1]))));
    const g = new THREE.ShapeGeometry(sh, 1), pa = g.attributes.position, ua = g.attributes.uv, na = g.attributes.normal;
    for (let i = 0; i < pa.count; i++) { ua.setXY(i, pa.getX(i) / tile, pa.getY(i) / tile); na.setZ(i, sg); }
    if (sg < 0) { const ix = g.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } }
    P.geo(mat, g, 0, 0, v); g.dispose();
  };
  // the openings: between the bank lines and the piers, in order
  const edges = [0, ...sp.piers.flatMap((p) => [p[0], p[1]]), LEN], SP = [];
  for (let k = 0; k < sp.spans.length; k++) SP.push({ a: edges[2 * k], b: edges[2 * k + 1], kind: sp.spans[k], k, bankA: k === 0, bankB: k === sp.spans.length - 1 });
  const D = sp.depth, SPRING = waterY + 1.3;
  /** girder depth under the deck at u of span s (haunched: deep at the river piers, thinnest in between) */
  const depthOf = (s, u) => {
    const t = (u - s.a) / (s.b - s.a), dA = s.bankA ? (D.bank ?? D.pier) : D.pier, dB = s.bankB ? (D.bank ?? D.pier) : D.pier, t0 = s.bankA && !s.bankB ? 0.42 : s.bankB && !s.bankA ? 0.58 : 0.5;
    return t < t0 ? D.mid + (dA - D.mid) * Math.pow(1 - t / t0, 2) : D.mid + (dB - D.mid) * Math.pow((t - t0) / (1 - t0), 2);
  };
  const stoneArc = (s, n = 14, grow = 0) => {
    const c = (s.b - s.a) / 2, mid = (s.a + s.b) / 2, cy = yDeck(mid) - 1.0, fr = Math.max(0.6, cy - SPRING), R = (c * c + fr * fr) / (2 * fr), y0 = cy - R, a0 = Math.asin(Math.min(0.999, c / R)), pts = [];
    for (let i = 0; i <= n; i++) { const al = -a0 + 2 * a0 * i / n; pts.push([mid + Math.sin(al) * (R + grow), y0 + Math.cos(al) * (R + grow)]); }
    return pts;
  };

  P.push(f.cx, 0, f.cz, -T);
  // ------------------------------------------------------------------ fascia + structure per opening (both faces), soffits
  for (const s of SP) {
    const { a, b } = s, Ls = b - a, n = Math.max(6, Math.round(Ls / 2.5));
    if (s.kind === 'stone') {
      const w0 = s.bankA ? UR0 : a - 0.01, w1 = s.bankB ? UR1 : b + 0.01, arc = stoneArc(s), nT = Math.max(2, Math.ceil((w1 - w0) / 3));
      for (const sg of [-1, 1]) {
        const top = []; for (let i = nT; i >= 0; i--) { const u = w0 + (w1 - w0) * i / nT; top.push([u, yDeck(u) + PAVE - 0.02]); }
        faceShape(gran, [[w0, yb], [w1, yb], ...top], sg * HV, sg, 2.2, [[[a, yb + 0.2], ...arc, [b, yb + 0.2]]]);
        const out = stoneArc(s, 14, 0.7), vz = sg * (HV + 0.06);
        for (let i = 0; i < 14; i++) { P.quad(M.voussoir, [arc[i][0], arc[i][1], vz], [arc[i + 1][0], arc[i + 1][1], vz], [out[i + 1][0], out[i + 1][1], vz], [out[i][0], out[i][1], vz], [0, 0, sg], [[i * 0.5, 0], [i * 0.5 + 0.5, 0], [i * 0.5 + 0.5, 0.35], [i * 0.5, 0.35]]); P.quad(M.voussoir, [out[i][0], out[i][1], vz], [out[i + 1][0], out[i + 1][1], vz], [out[i + 1][0], out[i + 1][1], sg * HV], [out[i][0], out[i][1], sg * HV], [0, 1, 0]); }
        for (let i = 0; i < nT; i++) { const u0 = w0 + (w1 - w0) * i / nT, u1 = w0 + (w1 - w0) * (i + 1) / nT, y0 = yDeck(u0) + PAVE, y1 = yDeck(u1) + PAVE, vo = sg * (HV + 0.16); P.quad(M.coping, [u0, y0 - 0.28, vo], [u1, y1 - 0.28, vo], [u1, y1 - 0.04, vo], [u0, y0 - 0.04, vo], [0, 0, sg]); P.quad(M.coping, [u0, y0 - 0.04, vo], [u1, y1 - 0.04, vo], [u1, y1 - 0.04, sg * HV], [u0, y0 - 0.04, sg * HV], [0, 1, 0]); }
        // the dentil band under the cornice (photos 21 24): small blocks every 0.6 m
        const nd = Math.floor((w1 - w0) / 0.6);
        for (let i = 0; i < nd; i++) { const u = w0 + 0.3 + i * 0.6, y0 = yDeck(u) + PAVE - 0.5, vo = sg * (HV + 0.14); P.box(M.coping, u - 0.12, u + 0.12, y0 - 0.14, y0, Math.min(vo, vo + sg * 0.1), Math.max(vo, vo + sg * 0.1), 'tbk', 1); }
      }
      for (let i = 0; i < 14; i++) P.quad(M.graniteDark, [arc[i][0], arc[i][1], -HV], [arc[i + 1][0], arc[i + 1][1], -HV], [arc[i + 1][0], arc[i + 1][1], HV], [arc[i][0], arc[i][1], HV], [0, -1, 0], [[arc[i][0] / 2.2, -HV / 2.2], [arc[i + 1][0] / 2.2, -HV / 2.2], [arc[i + 1][0] / 2.2, HV / 2.2], [arc[i][0] / 2.2, HV / 2.2]]);
      for (const [uu, nx] of [[a, 1], [b, -1]]) if (!sp.piers.some((q) => Math.abs(q[0] - uu) < 0.02 || Math.abs(q[1] - uu) < 0.02)) P.quad(M.graniteDark, [uu, yb, -HV], [uu, yb, HV], [uu, SPRING, HV], [uu, SPRING, -HV], [nx, 0, 0], [[-HV / 2.2, yb / 2.2], [HV / 2.2, yb / 2.2], [HV / 2.2, SPRING / 2.2], [-HV / 2.2, SPRING / 2.2]]);
      continue;
    }
    // plate girder with a haunched soffit (a bascule: deep at both piers, a joint at mid-span): face, stiffeners, bottom flange, soffit
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
  // the deck cornice (both faces, the whole bridge) except over the stone spans
  { const nc = Math.ceil((UR1 - UR0) / 3);
    for (const sg of [-1, 1]) for (let i = 0; i < nc; i++) {
      const u0 = UR0 + (UR1 - UR0) * i / nc, u1 = UR0 + (UR1 - UR0) * (i + 1) / nc, y0 = yDeck(u0), y1 = yDeck(u1), v = sg * HW, um = (u0 + u1) / 2;
      if (SP.some((s) => s.kind === 'stone' && um > (s.bankA ? UR0 : s.a) - 0.1 && um < (s.bankB ? UR1 : s.b) + 0.1)) continue;
      const cm = M.copingDark;
      P.quad(cm, [u0, y0 - 0.22, v + sg * 0.14], [u1, y1 - 0.22, v + sg * 0.14], [u1, y1 + PAVE, v + sg * 0.14], [u0, y0 + PAVE, v + sg * 0.14], [0, 0, sg]);
      P.quad(cm, [u0, y0 + PAVE, v + sg * 0.14], [u1, y1 + PAVE, v + sg * 0.14], [u1, y1 + PAVE, v - sg * 0.3], [u0, y0 + PAVE, v - sg * 0.3], [0, 1, 0]);
      P.quad(cm, [u0, y0 - 0.22, v + sg * 0.14], [u1, y1 - 0.22, v + sg * 0.14], [u1, y1 - 0.22, v], [u0, y0 - 0.22, v], [0, -1, 0]);
    } }
  // ------------------------------------------------------------------ piers
  const nose = (mat, pm, sg, vc, R, rv, y0, y1, seg = 10, cap = M.coping) => {      // half elliptic cylinder beyond the line v = sg * vc (radius R along u, rv across), with a flat top
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * i / seg, a1 = Math.PI * (i + 1) / seg, p0 = [pm - Math.cos(a0) * R, sg * (vc + Math.sin(a0) * rv)], p1 = [pm - Math.cos(a1) * R, sg * (vc + Math.sin(a1) * rv)], am = (a0 + a1) / 2;
      P.quad(mat, [p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]], [-Math.cos(am), 0, sg * Math.sin(am)], [[a0 * R / 2.2, y0 / 2.2], [a1 * R / 2.2, y0 / 2.2], [a1 * R / 2.2, y1 / 2.2], [a0 * R / 2.2, y1 / 2.2]]);
      if (cap) P.fan(cap, [[pm, y1, sg * vc], [p0[0], y1, p0[1]], [p1[0], y1, p1[1]]], [0, 1, 0]);
    }
  };
  const pedestals = [], balconies = [];                                // pedestals: granite blocks at the deck edge over slim piers; balconies: { u, y } the cap of a tower drum (lamps / columns stand there)
  for (const [pa, pb, kind, rvIn] of sp.piers) {
    const pm = (pa + pb) / 2, hu = (pb - pa) / 2, top = yDeck(pm) - 0.22, deckTop = yDeck(pm) + PAVE;
    P.box(gran, pa, pb, yb, top, -HV, HV, 'tbfk', 2.2);                                                              // the two faces toward the openings
    for (const sg of [-1, 1]) {
      faceShape(gran, [[pa, yb], [pb, yb], [pb, yDeck(pb) + PAVE - 0.02], [pa, yDeck(pa) + PAVE - 0.02]], sg * HV, sg, 2.2);
      if (kind === 'tower') {                                         // a round tower beyond the face up to the deck, a cornice ring with corbels, a parapet round the balcony
        const R = hu + 0.1, rv = rvIn || 3, yT = deckTop - 0.02;
        nose(gran, pm, sg, HV, R, rv, yb, yT, 14);
        nose(M.coping, pm, sg, HV, R + 0.18, rv + 0.18, yT - 1.5, yT - 1.22, 14, M.coping);
        for (let i = 0; i < 9; i++) { const al = Math.PI * (i + 0.5) / 9, cu = pm - Math.cos(al) * (R + 0.02), cv = sg * (HV + Math.sin(al) * (rv + 0.02)); P.box(M.coping, cu - 0.16, cu + 0.16, yT - 1.22 - 0.3, yT - 1.22, cv - 0.16, cv + 0.16, 'tb', 1); }   // the corbel row under the cornice (photo 05 / 19)
        nose(par, pm, sg, HV, R, rv, yT, yT + 1.0, 14, M.coping);
        pedestals.push({ u: pm, hu: hu + 0.3, sg, full: true });
        balconies.push({ u: pm, sg, y: yT + 1.0, v: sg * (HV + Math.min(0.5, rv * 0.35)) });
      } else if (kind === 'abut') {                                    // a straight pier of the arcade: only the wall (the box above); the parapet is solid over it
        pedestals.push({ u: pm, hu: hu + 0.3, sg, full: true });
      } else {                                                        // a slim pier: a rounded cutwater with a cone cap, a pedestal block up to the parapet level
        const R = hu + 0.12, rv = Math.min(R * 0.9, 3.2), yT = top - 1.4;
        if (kind === 'block') { const q0 = Math.min(sg * HV, sg * (HV + 0.14)), q1 = Math.max(sg * HV, sg * (HV + 0.14)); P.box(M.coping, pa - 0.12, pb + 0.12, top - 1.0, top - 0.72, q0, q1, '', 1.4); P.box(M.coping, pa - 0.1, pb + 0.1, waterY + 0.5, waterY + 0.75, q0, q1, '', 1.4); }
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

  // ------------------------------------------------------------------ deck: asphalt roadway, kerbs, pavements, markings, tram rails (the whole OSM way)
  const trk = (sp.tracks || []).map((poly) => poly.map(([u, v]) => [u - sp.bank0, v]));
  const trackV = (k, u) => { const q = trk[k]; if (u <= q[0][0]) return q[0][1]; for (let i = 0; i + 1 < q.length; i++) if (u <= q[i + 1][0]) return q[i][1] + (q[i + 1][1] - q[i][1]) * (u - q[i][0]) / (q[i + 1][0] - q[i][0]); return q[q.length - 1][1]; };
  const nD = Math.ceil((UD1 - UD0) / 3.2);
  for (let i = 0; i < nD; i++) {
    const u0 = UD0 + (UD1 - UD0) * i / nD, u1 = UD0 + (UD1 - UD0) * (i + 1) / nD, y0 = yDeck(u0), y1 = yDeck(u1), um = (u0 + u1) / 2;
    P.quad(M.asphalt, [u0, y0, -ROAD], [u1, y1, -ROAD], [u1, y1, ROAD], [u0, y0, ROAD], [0, 1, 0], [[u0 / 4, -ROAD / 4], [u1 / 4, -ROAD / 4], [u1 / 4, ROAD / 4], [u0 / 4, ROAD / 4]]);
    for (const sg of [-1, 1]) {
      const va = sg * ROAD, vk = sg * (ROAD + KW), vb = sg * (HW + 0.1);
      P.quad(pave, [u0, y0 + PAVE, vk], [u1, y1 + PAVE, vk], [u1, y1 + PAVE, vb], [u0, y0 + PAVE, vb], [0, 1, 0], [[u0 / 2.4, vk / 2.4], [u1 / 2.4, vk / 2.4], [u1 / 2.4, vb / 2.4], [u0 / 2.4, vb / 2.4]]);
      P.quad(kerbM, [u0, y0, va], [u1, y1, va], [u1, y1 + PAVE, va], [u0, y0 + PAVE, va], [0, 0, -sg], [[u0, 0], [u1, 0], [u1, PAVE], [u0, PAVE]]);
      P.quad(kerbM, [u0, y0 + PAVE, va], [u1, y1 + PAVE, va], [u1, y1 + PAVE, vk], [u0, y0 + PAVE, vk], [0, 1, 0], [[u0, 0], [u1, 0], [u1, KW], [u0, KW]]);
    }
    const mk = (vc, hw) => P.quad(M.mark, [u0, y0 + 0.03, vc - hw], [u1, y1 + 0.03, vc - hw], [u1, y1 + 0.03, vc + hw], [u0, y0 + 0.03, vc + hw], [0, 1, 0]);
    if (um > 5 && um < LEN - 5) { for (const vc of sp.marks.solid) mk(vc, 0.06); if (i % 3 !== 2) for (const vc of sp.marks.dash) mk(vc, 0.06); }
    for (let k = 0; k < trk.length; k++) { const vc0 = trackV(k, u0), vc1 = trackV(k, u1); for (const dv of [-0.76, 0.76]) P.quad(M.tramRail, [u0, y0 + 0.035, vc0 + dv - 0.035], [u1, y1 + 0.035, vc1 + dv - 0.035], [u1, y1 + 0.035, vc1 + dv + 0.035], [u0, y0 + 0.035, vc0 + dv + 0.035], [0, 1, 0]); }
  }
  // ------------------------------------------------------------------ railings: cast panels (instanced) between the granite blocks; granite parapets over stone spans and tower / abut piers
  const solid = [];                                                   // [u0, u1] intervals with a granite parapet instead of the metal railing
  for (const s of SP) if (s.kind === 'stone') solid.push([s.bankA ? UR0 : s.a - 0.01, s.bankB ? UR1 : s.b + 0.01]);
  for (const [pa, pb, kind] of sp.piers) if (kind === 'tower' || kind === 'abut') solid.push([pa - 0.3, pb + 0.3]);
  solid.sort((p, q) => p[0] - q[0]);
  const merged = []; for (const iv of solid) { const l = merged[merged.length - 1]; if (l && iv[0] <= l[1] + 0.05) l[1] = Math.max(l[1], iv[1]); else merged.push(iv.slice()); }
  const ironMat = ctx.mat.toon(sp.rail.hex, { paint: 0.03, name: 'brg-' + sp.id + '-rail' });
  for (const sg of [-1, 1]) {
    const v = sg * (HW - 0.14), cuts = merged.concat(pedestals.filter((q) => q.sg === sg && !q.full).map((q) => [q.u - q.hu, q.u + q.hu])).sort((p, q) => p[0] - q[0]);
    let u = UR0; const runs = [];
    for (const c of cuts) { if (c[0] > u + 0.3) runs.push([u, c[0]]); u = Math.max(u, c[1]); }
    if (UR1 > u + 0.3) runs.push([u, UR1]);
    for (const [ra, rb] of runs) {
      const nb = Math.max(1, Math.round((rb - ra) / sp.rail.bay)), bw = (rb - ra) / nb;
      for (let i = 0; i < nb; i++) {
        const ua = ra + bw * i, w = world(ua + 0.03, v);
        rails.add({ kind: sp.rail.kind, hex: sp.rail.hex, x: w.x, y: yDeck(ua) + PAVE, z: w.z, rotY: -T, roll: Math.atan(slopeOf(ua + bw / 2)), len: bw - 0.06 }); B.info.rails++;
      }
      for (const up of [ra, rb]) { const y = yDeck(up) + PAVE; P.box(ironMat, up - 0.1, up + 0.1, y, y + 1.14, v - 0.1, v + 0.1, 'b', 1); P.box(ironMat, up - 0.13, up + 0.13, y + 1.14, y + 1.2, v - 0.13, v + 0.13, 'b', 1); }   // end posts
    }
    for (const [pa, pb] of merged) {
      const n = Math.max(1, Math.ceil((pb - pa) / 2.4));
      for (let i = 0; i < n; i++) {
        const u0 = pa + (pb - pa) * i / n, u1 = pa + (pb - pa) * (i + 1) / n, y0 = yDeck(u0) + PAVE, y1 = yDeck(u1) + PAVE, h = 1.1, va = v - 0.2, vb2 = v + 0.2;
        for (const [vv, nz] of [[va, -1], [vb2, 1]]) P.quad(par, [u0, y0 - 0.05, vv], [u1, y1 - 0.05, vv], [u1, y1 + h, vv], [u0, y0 + h, vv], [0, 0, nz], [[0, 0], [0.5, 0], [0.5, 1], [0, 1]]);
        P.quad(M.coping, [u0, y0 + h, va - 0.03], [u1, y1 + h, va - 0.03], [u1, y1 + h, vb2 + 0.03], [u0, y0 + h, vb2 + 0.03], [0, 1, 0]);
      }
      for (const [uu, nx] of [[pa, -1], [pb, 1]]) P.quad(par, [uu, yDeck(uu) + PAVE, v - 0.2], [uu, yDeck(uu) + PAVE, v + 0.2], [uu, yDeck(uu) + PAVE + 1.1, v + 0.2], [uu, yDeck(uu) + PAVE + 1.1, v - 0.2], [nx, 0, 0], [[0, 0], [0.1, 0], [0.1, 1], [0, 1]]);
    }
  }
  // ------------------------------------------------------------------ lamps: on the tower balconies (Kamennoostrovsky: a pair at every pier, photos 05 07 12) and / or on the pavements between the piers (Ushakovsky)
  const lampAt = [];
  const lampFn = sp.lamps.kind === 'ush' ? lampUsh : lampKam;
  if (sp.lamps.piers) for (const bl of balconies) {
    const r = lampFn(P, K, bl.u, bl.y, bl.v, {}); B.masts.push({ ...world(bl.u, bl.v), y: bl.y, h: r.h, kind: 'kam' });
  }
  for (const sg of [-1, 1]) for (const u of sp.lamps.spans || []) {
    const v = sg * (HW - 0.62), y = yDeck(u) + PAVE, r = lampFn(P, K, u, y, v, {}); lampAt.push({ u, v }); B.masts.push({ ...world(u, v), y, h: r.h, kind: sp.lamps.kind });
  }
  // the lamps at the abutments (Kamennoostrovsky: a pair on each granite wall end): on the pavement, 3.4 m inside the bank line
  if (sp.id === 'kamennoostrovsky') for (const u of [2.2, LEN - 2.2]) for (const sg of [-1, 1]) { const v = sg * (HW - 0.62), y = yDeck(u) + PAVE, r = lampKam(P, K, u, y, v, {}); lampAt.push({ u, v }); B.masts.push({ ...world(u, v), y, h: r.h, kind: 'kam' }); }
  // ------------------------------------------------------------------ columns (Ushakovsky bastions), obelisks (Kamennoostrovsky ends), name tripods
  for (const [cu, sg] of sp.columns || []) { const bl = balconies.find((q) => Math.abs(q.u - cu) < 0.5 && q.sg === sg); if (bl) { columnUsh(P, K, bl.u, bl.y, bl.v, {}); lampAt.push({ u: bl.u, v: bl.v, col: true }); } }
  const obeliskAt = [];
  for (const [ou, sg] of sp.obelisks || []) { const v = sg * (HW + 0.9), y = yDeck(clamp(ou, 0, LEN)); P.box(M.coping, ou - 0.9, ou + 0.9, y - 0.05, y + 0.9, v - 0.9, v + 0.9, 'b', 1.4); obelisk(P, M, ou, y + 0.9, v, 0, 6.3, false); obeliskAt.push({ u: ou, v }); }
  const tripodAt = [];
  for (const [tu, sg] of sp.plates || []) { const v = sg * (HW - 0.45), y = yDeck(clamp(tu, 0, LEN)) + PAVE; tripod(P, M, tu, y, v, sp.name.toUpperCase(), Math.PI / 2); tripodAt.push({ u: tu, v }); }
  // ------------------------------------------------------------------ the wing walls that close the opened quay beside both bank ends
  const openLen = (sg, u0, dir) => {
    const zs = env.zones || []; if (!zs.length) return 2.4;
    let last = -1, g = u0;
    for (let k = 0; k <= 28; k++) { const v = sg * (HV + k * 0.5), ub = bankU(L, sp, v, g, dir); if (ub === null) break; g = ub; const w = world(ub - dir * 0.25, v); if (zs.some((z) => z.test(w.x, w.z, 3.2))) last = k; }
    return last < 0 ? 2.4 : Math.min(14, Math.max(2.4, (last + 1) * 0.5 + 1.0));
  };
  const wings = [];
  for (const [uu, dir] of [[0, 1], [LEN, -1]]) for (const sg of [-1, 1]) { const len = openLen(sg, uu, dir); wings.push({ u: uu, dir, sg, len }); closeBank({ site: sp, P, M, L, u: uu, dir, sg, v0: HV, len, yTop: 0.05, yb, mat: gran, parapet: par, collide: false }); }
  B.info.wings = wings.map((w) => w.len);
  P.pop();
  B.info.tris = P.tris;

  // ------------------------------------------------------------------ colliders
  B.colliders = () => {
    const ph = ctx.physics, rampRot = Math.atan2(f.c, f.s), m = Math.ceil((UD1 - UD0) / 6);
    for (let i = 0; i < m; i++) { const u0 = UD0 + (UD1 - UD0) * i / m, u1 = UD0 + (UD1 - UD0) * (i + 1) / m, w = world((u0 + u1) / 2, 0); ph.addWalkRamp(w.x, w.z, 2 * HW + 0.2, u1 - u0 + 0.04, rampRot, yDeck(clamp(u0, 0, LEN)), yDeck(clamp(u1, 0, LEN)), 2.5); B.info.colliders++; }
    const nR = Math.ceil((UR1 - UR0) / 8);
    for (const sg of [-1, 1]) for (let i = 0; i < nR; i++) { const u0 = UR0 + (UR1 - UR0) * i / nR, u1 = UR0 + (UR1 - UR0) * (i + 1) / nR, w = world((u0 + u1) / 2, sg * (HW - 0.14)); ph.addBox(w.x, w.z, u1 - u0, 0.4, -T, -8, Math.max(yDeck(u0), yDeck(u1)) + PAVE + 1.2); B.info.colliders++; }
    for (const q of lampAt) if (!q.col && Math.abs(q.v) < HW) { const w = world(q.u, q.v); ph.addCylinder(w.x, w.z, 0.3, yDeck(q.u) - 1, yDeck(q.u) + 9); B.info.colliders++; }
    for (const q of pedestals) if (!q.full) { const w = world(q.u, q.sg * (HW + 0.1)); ph.addBox(w.x, w.z, 2 * q.hu + 0.1, 1.0, -T, -8, yDeck(q.u) + 3); B.info.colliders++; }
    for (const q of obeliskAt) { const w = world(q.u, q.v); ph.addBox(w.x, w.z, 1.8, 1.8, -T, -1, 7.2); B.info.colliders++; }
    for (const q of tripodAt) { const w = world(q.u, q.v); ph.addCylinder(w.x, w.z, 0.12, -0.5, 3.2); B.info.colliders++; }
    for (const w of wings) B.info.colliders += closeBank({ site: sp, L, ph, u: w.u, dir: w.dir, sg: w.sg, v0: HW - 0.3, len: w.len, yTop: 0.05, draw: false });
  };
  return B;
}
