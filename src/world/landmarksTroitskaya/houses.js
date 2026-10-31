// landmarksTroitskaya/houses.js - the three big houses of the sight that are not mansions (docs/research/troitskaya.md sections 4-5):
//  * the HOUSE OF POLITICAL PRISONERS (Дом политкаторжан, Troitskaya pl. 1; Simonov, Abrosimov, Khryakov 1929-33; OSM w28712329): constructivism: pale grey ribbon of six storeys with a glazed
//    ground floor on the square and the embankment, small balconies, flat roof, the taller stair block with corner balconies at the SW corner (photos 70 77);
//  * the LENPROEKT house (Troitskaya pl. 3, w28712286): yellow, a giant order of square pillars on a two-storey rusticated base toward the square and the lane, heavy cornice, attic (photos 70 81);
//  * the LIDVAL HOUSE (Kamennoostrovsky pr. 1-3, F. I. Lidval 1899-1904, r1273188 + coach house r21135361): three wings of different height round the cour d'honneur (south 14.5 m, cross block
//    21.5 m with the curved gable, north 18.5 m), pot-stone ground floor, sand stucco, bays with red roofs, high sheet roofs; the wrought-iron fence on red granite posts with two gates between
//    lantern pylons (w186087236) (photos 50 52 53 55 59).
// Walls are window sheets (art.js bay*: one bay x one storey per tile) on the OSM footprints: prism.js.  Footprint colliders from lib/massing.
import * as THREE from 'three';
import * as L from '../layout.js';
import { BARRIERS, BARRIER_NODES } from '../data/city.js';
import * as G from './geo.js';
import { pairs, planFence, panelQuad } from './frame.js';
import { walls, zones, baySheet, slabRing, ringEdges } from './prism.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { fillPolyClipped, coverFn } from './surfaces.js';
import { addPolyColliders } from '../lib/massing.js';

const TAU = Math.PI * 2;
const ringOf = (flat) => pairs(flat);
const unit = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
const mid = (e) => [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksTroitskaya] houses/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('polit', () => polit(K));
  stage('lenproekt', () => lenproekt(K));
  stage('lidval', () => lidval(K));
  // the two Stalinist houses that frame the sight: the long yellow one on the NE side of the garden and the concave one behind the Gorky monument (photos 81, 92 95)
  stage('kuybysheva1', () => stalinBlock(K, 'w28712450', { h: 26.5, wall: K.M.bayStalin, base: K.M.bayStalinBase, trim: K.M.stalinTrim }));
  stage('kamennoostrovsky2', () => stalinBlock(K, 'r3419581', { h: 25.5, wall: K.M.bayStone, base: K.M.bayStoneBase, trim: K.M.stoneTrim }));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ House of Political Prisoners
function polit(K) {
  const P = K.P, M = K.M, ctx = K.ctx, rec = L.buildingById('w28712329'); if (!rec) return;
  const ring = ringOf(rec.polys[0].o), HB = 19.6, HT = 23.6, G0 = 3.6;
  const v = (i) => ring[i];
  // street faces: the square (v23-v24), the embankment (v21-v18), the tower faces (v21-v22-v23)
  const dLine = (p, a, b) => { const u = unit(a, b); return Math.abs((p[0] - a[0]) * u[1] - (p[1] - a[1]) * u[0]); };
  const streety = (e) => { const m = mid(e); return (e.n[0] < -0.7 && (dLine(m, v(23), v(24)) < 1.5 || dLine(m, v(21), v(22)) < 1.5)) || (e.n[1] > 0.7 && dLine(m, v(21), v(18)) < 2.5); };
  walls(P, ring, (len, e) => {
    const st = streety(e) && len > 6;
    zones(P, len, [[HB - 0.5, HB, M.polit, 3]]);
    if (st) { baySheet(P, M.bayPolitGlass, 0, len, 0, G0, 3.4, 1); baySheet(P, M.bayPolitBalc, 0, len, G0, HB - 0.5, 3.2, 5); P.box(M.polit, 0, len, G0 - 0.12, G0 + 0.1, 0, 0.5, 'k'); for (let u = 1.7; u < len; u += 3.4) P.box(M.politShade, u - 0.12, u + 0.12, 0, G0 - 0.12, 0.3, 0.5, 'b'); }
    else if (len > 3) baySheet(P, M.bayPolit, 0, len, 0, HB - 0.5, 3.2, 6);
    else zones(P, len, [[0, HB - 0.5, M.polit, 3]]);
    // balcony slabs on the square face (every second bay, storeys 2-6)
    if (st && len > 40) for (let f = 1; f < 6; f++) for (let u = 4.8; u < len - 3; u += 6.4) P.box(M.politShade, u - 1.1, u + 1.1, G0 + f * 3.1 - 0.02, G0 + f * 3.1 + 0.1, 0, 0.9, 'k');
  });
  slabRing(P, ring, HB, HB + 0.16, 0.25, M.politShade);
  P.cap(M.roofSilver, ring, HB, true, 4);
  // the stair / corner block at the SW corner (v21): 12 m along the embankment, to v22 along the square, 6 m taller, corner balconies
  const u1 = unit(v(21), v(18)), tower = [v(21), [v(21)[0] + u1[0] * 12.5, v(21)[1] + u1[1] * 12.5], [v(22)[0] + u1[0] * 12.5, v(22)[1] + u1[1] * 12.5], v(22)];
  walls(P, tower, (len, e) => {
    zones(P, len, [[HB - 0.3, HT, M.polit, 3]]);
    const west = Math.abs(e.n[0]) > Math.abs(e.n[1]) && e.n[0] < 0;
    if (!west) { for (let y = HB + 0.6; y < HT - 1.5; y += 3.0) G.pane(P, M.bayPolitGlass, 1.2, len - 1.2, y, y + 1.6, 0.04, [[0, 0.2], [2, 0.2], [2, 0.8], [0, 0.8]]); }
    else for (let f = 1; f < 7; f++) P.box(M.politShade, 0.4, Math.min(len - 0.4, 7.5), G0 + f * 3.05 - 0.02, G0 + f * 3.05 + 0.12, 0, 1.3, 'k');
  });
  slabRing(P, tower, HT, HT + 0.16, 0.2, M.politShade);
  P.cap(M.roofSilver, tower, HT, true, 4);
  addPolyColliders(ctx, rec.polys[0], 0, HT, 0.9);
  K.svc.monuments.push({ id: 'w28712329', name: 'Дом политкаторжан', x: rec.cx, z: rec.cz, h: HT });
}

// ------------------------------------------------------------------------------------------------ Lenproekt house
function lenproekt(K) {
  const P = K.P, M = K.M, ctx = K.ctx, rec = L.buildingById('w28712286'); if (!rec) return;
  const ring = ringOf(rec.polys[0].o), HBASE = 8.4, HCOL = 24.6, HENT = 27.0, HTOP = 29.0;
  const pillarG = partsGeos((Q) => { Q.box(M.stalinTrim, -0.6, 0.6, 0, HCOL - HBASE - 0.9, -0.6, 0.6, 'b', 3); Q.box(M.stalinTrim, -0.78, 0.78, HCOL - HBASE - 0.9, HCOL - HBASE, -0.78, 0.78, 'b', 3); Q.box(M.stalinTrim, -0.72, 0.72, 0, 0.5, -0.72, 0.72, 'b', 3); });
  const pm = [];
  for (const e of ringEdges(ring)) {
    const front = e.len > 18 && (e.n[0] < -0.5 || e.n[1] > 0.5);            // the faces to the square (WSW) and to the lane (SSE)
    G.onFace(P, e.o[0], e.o[1], e.n[0], e.n[1], () => {
      baySheet(P, M.bayStalinBase, 0, e.len, 0, HBASE, 3.6, 2);
      baySheet(P, M.bayStalin, 0, e.len, HBASE, HCOL, 3.6, 4);
      zones(P, e.len, [[HCOL, HENT, M.stalinTrim, 3], [HENT, HTOP, M.stalin, 3]]);
      P.box(M.stalinTrim, 0, e.len, HBASE - 0.25, HBASE + 0.2, 0, front ? 1.5 : 0.25, 'k');
      P.box(M.stalinTrim, -0.02, e.len + 0.02, HENT - 0.3, HENT + 0.25, 0, front ? 1.75 : 0.6, 'k');
      if (front) { P.box(M.stalinTrim, 0, e.len, HCOL, HENT - 0.3, 0, 1.45, 'k'); const n = Math.round(e.len / 4.3); for (let i = 0; i <= n; i++) { const u = 0.85 + i * (e.len - 1.7) / n, w = { x: e.o[0], z: e.o[1] }, xa = [e.n[1], -e.n[0]]; pm.push(mat4(w.x + xa[0] * u + e.n[0] * 0.82, HBASE + 0.2, w.z + xa[1] * u + e.n[1] * 0.82, Math.atan2(e.n[0], e.n[1]), 1)); } }
    });
  }
  K.extraTris += addInstanced(ctx, K.root, 'lmT-lenproektPillars', pillarG, pm).tris;
  P.cap(M.roofSilver, ring, HTOP, true, 4);
  addPolyColliders(ctx, rec.polys[0], 0, HTOP, 0.9);
}

/** a Stalinist block on its OSM footprint: two-storey base sheet, upper sheet, frieze, cornice, a balustrade parapet */
function stalinBlock(K, id, o) {
  const P = K.P, M = K.M, rec = L.buildingById(id); if (!rec) return;
  const ring = ringOf(rec.polys[0].o), h = o.h, base = 8.4, top = h - 2.2, floors = Math.round((top - base) / 3.6);
  for (const e of ringEdges(ring)) G.onFace(P, e.o[0], e.o[1], e.n[0], e.n[1], () => {
    if (e.len > 2.4) { baySheet(P, o.base, 0, e.len, 0, base, 3.6, 2); baySheet(P, o.wall, 0, e.len, base, top, 3.6, floors); } else zones(P, e.len, [[0, top, o.trim, 3]]);
    zones(P, e.len, [[top, h - 1.0, o.trim, 3]]);
    P.box(o.trim, 0, e.len, base - 0.2, base + 0.15, 0, 0.22, 'k');
    P.box(o.trim, -0.02, e.len + 0.02, h - 1.2, h - 0.8, 0, 0.7, 'k');
    if (e.len > 4) { for (let u = 0.3; u < e.len; u += 2.4) P.box(o.trim, u - 0.18, u + 0.18, h - 0.8, h + 0.25, -0.4, -0.04, 'b'); P.box(o.trim, 0, e.len, h + 0.05, h + 0.22, -0.4, -0.04, 'b'); P.box(o.trim, 0, e.len, h - 0.8, h - 0.3, -0.34, -0.1, 'b'); }
  });
  P.cap(M.roofSilver, ring, h - 0.8, true, 4);
  addPolyColliders(K.ctx, rec.polys[0], 0, h, 0.9);
}

// ------------------------------------------------------------------------------------------------ Lidval house
const LID = { o: [-1711.3, -2742.0], a: [0.39, 0.92], c: [0.92, -0.39] };                 // court centre, the avenue direction (to the SSE), the court axis (into the court, ENE)
const lidPA = (p) => (p[0] - LID.o[0]) * LID.a[0] + (p[1] - LID.o[1]) * LID.a[1];
const lidPC = (p) => (p[0] - LID.o[0]) * LID.c[0] + (p[1] - LID.o[1]) * LID.c[1];
const LH = { S: 14.5, C: 21.5, N: 18.5 }, SPLIT = 13.8, ROOF = 1.6;
const lidRegion = (p) => { const a = lidPA(p); return a > SPLIT ? 'S' : a < -SPLIT ? 'N' : 'C'; };
/** Sutherland-Hodgman clip of a ring by the half plane f(p) <= 0 (f linear) */
function clipRing(ring, f) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], fa = f(a), fb = f(b);
    if (fa <= 0) out.push(a);
    if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
function lidval(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics, rec = L.buildingById('r1273188'); if (!rec) return;
  const poly = rec.polys[0], outer = ringOf(poly.o), holes = poly.h.map(ringOf), G0 = 4.3, ST = 3.55;
  const wallOf = (ring, isHole) => {
    for (const e0 of ringEdges(ring)) {
      const e = isHole ? { ...e0, n: [-e0.n[0], -e0.n[1]], o: e0.fwd ? e0.b : e0.a } : e0;
      const h = LH[lidRegion(mid(e))], floors = Math.max(1, Math.round((h - G0) / ST));
      G.onFace(P, e.o[0], e.o[1], e.n[0], e.n[1], () => {
        if (e.len > 2.2) { baySheet(P, M.bayLidvalStone, 0, e.len, 0, G0, 2.9, 1); baySheet(P, M.bayLidval, 0, e.len, G0, h, 2.9, floors); }
        else zones(P, e.len, [[0, G0, M.potStone, 3], [G0, h, M.lidval, 3]]);
        P.box(M.lidvalTrim, 0, e.len, G0 - 0.12, G0 + 0.12, 0, 0.1, 'k');
        P.box(M.lidvalTrim, -0.02, e.len + 0.02, h - 0.3, h, 0, 0.45, 'k');
        // the high sheet roof: a roof-coloured attic band set back above the cornice (the flat cap is its eave)
        G.wall(P, M.roofLidval, 0, e.len, h, h + ROOF, -0.25, 3);
      });
    }
  };
  wallOf(outer, false); for (const h of holes) wallOf(h, true);
  // the faces on the avenue: a shaped gable over a two-storey bay with a red roof, iron balconies (photos 53 59)
  for (const e of ringEdges(outer)) {
    if (e.n[0] * LID.c[0] + e.n[1] * LID.c[1] > -0.8 || e.len < 10 || lidPC(mid(e)) > -8) continue;
    const h = LH[lidRegion(mid(e))];
    G.onFace(P, e.o[0], e.o[1], e.n[0], e.n[1], () => {
      for (const c of (e.len > 22 ? [e.len * 0.24, e.len * 0.76] : [e.len / 2])) {
        G.solid(P, M.lidval, [[c - 3.6, h], [c + 3.6, h], [c + 3.4, h + 1.7], [c + 2.0, h + 2.3], [c + 1.3, h + 3.6], [c, h + 4.0], [c - 1.3, h + 3.6], [c - 2.0, h + 2.3], [c - 3.4, h + 1.7]], -0.3, 0.55, 3);
        G.pane(P, M.glassDark, c - 0.9, c + 0.9, h + 0.9, h + 1.7, 0.27);
        P.box(M.lidval, c - 1.6, c + 1.6, G0 + ST, h - 0.6, 0, 0.75, 'kb', 3); G.pane(P, M.bayLidval, c - 1.5, c + 1.5, G0 + ST, h - 0.6, 0.77, [[0.05, 0], [0.95, 0], [0.95, Math.max(1, Math.round((h - 0.6 - G0 - ST) / ST))], [0.05, Math.max(1, Math.round((h - 0.6 - G0 - ST) / ST))]]);
        P.quad(M.roofRed, [c - 1.7, h - 0.6, 0.85], [c + 1.7, h - 0.6, 0.85], [c + 1.6, h + 0.05, 0], [c - 1.6, h + 0.05, 0], [0, 0.8, 0.6]);
      }
      for (const u of [3.2, e.len - 3.2]) { const y = G0 + ST + 0.35; P.box(M.lidvalTrim, u - 1.2, u + 1.2, y - 0.16, y, 0, 0.8, 'k'); P.quad(M.lfence, [u - 1.2, y, 0.78], [u + 1.2, y, 0.78], [u + 1.2, y + 1.0, 0.78], [u - 1.2, y + 1.0, 0.78], null, [[0, 0.35], [1.7, 0.35], [1.7, 1], [0, 1]]); }
    });
  }
  // roofs: the footprint clipped into the three wings, each capped at the top of its mansard; the step walls between the wings
  const regions = [['S', (p) => SPLIT - lidPA(p)], ['N', (p) => lidPA(p) + SPLIT]];
  const capOf = (ring, y) => { if (ring.length >= 3) try { P.cap(M.roofLidval, ring, y, true, 4); } catch (e) { /* a degenerate clip: skip */ } };
  for (const [key, f] of regions) capOf(clipRing(outer, f), LH[key] + ROOF);
  const cRing = clipRing(clipRing(outer, (p) => lidPA(p) - SPLIT), (p) => -lidPA(p) - SPLIT);
  capOf(cRing, LH.C + ROOF);
  for (let i = 0; i < cRing.length; i++) {
    const a = cRing[i], b = cRing[(i + 1) % cRing.length], pa = lidPA(a), pb = lidPA(b);
    if (Math.abs(Math.abs(pa) - SPLIT) > 0.05 || Math.abs(Math.abs(pb) - SPLIT) > 0.05 || Math.sign(pa) !== Math.sign(pb)) continue;
    const lo = LH[pa > 0 ? 'S' : 'N'] + ROOF, s = pa > 0 ? 1 : -1;
    P.quad(M.lidval, [a[0], lo, a[1]], [b[0], lo, b[1]], [b[0], LH.C + ROOF, b[1]], [a[0], LH.C + ROOF, a[1]], [LID.a[0] * s, 0, LID.a[1] * s]);
  }
  // the cross block's court face: the curved gable, the central bay with a red roof (photo 50)
  const W = (pa, pc) => [LID.o[0] + LID.a[0] * pa + LID.c[0] * pc, LID.o[1] + LID.a[1] * pa + LID.c[1] * pc];
  const faceC = ringEdges(outer).filter((e) => lidRegion(mid(e)) === 'C' && e.n[0] * LID.c[0] + e.n[1] * LID.c[1] < -0.8 && lidPC(mid(e)) > 10).sort((p, q) => q.len - p.len)[0];
  if (faceC) G.onFace(P, faceC.o[0], faceC.o[1], faceC.n[0], faceC.n[1], () => {
    const c = faceC.len / 2, h = LH.C;
    const gable = [[c - 4.2, h], [c + 4.2, h], [c + 4.0, h + 1.6], [c + 2.6, h + 2.4], [c + 1.9, h + 4.0], [c + 1.0, h + 4.9], [c, h + 5.1], [c - 1.0, h + 4.9], [c - 1.9, h + 4.0], [c - 2.6, h + 2.4], [c - 4.0, h + 1.6]];
    G.solid(P, M.lidval, gable, -0.3, 0.6, 3);
    G.pane(P, M.glassDark, c - 0.6, c + 0.6, h + 1.6, h + 2.5, 0.32);
    P.box(M.lidval, c - 1.5, c + 1.5, G0 + 0.4, h - 3.6, 0, 0.9, 'kb', 3); G.pane(P, M.bayLidval, c - 1.4, c + 1.4, G0 + 0.4, h - 3.6, 0.92, [[0.1, 0], [0.9, 0], [0.9, 3], [0.1, 3]]);
    P.quad(M.roofRed, [c - 1.6, h - 3.6, 1.0], [c + 1.6, h - 3.6, 1.0], [c + 1.5, h - 3.0, 0], [c - 1.5, h - 3.0, 0], [0, 0.85, 0.5]);
    for (const dc of [-9.5, 9.5]) { if (c + dc < 1.5 || c + dc > faceC.len - 1.5) continue; P.box(M.lidval, c + dc - 1.3, c + dc + 1.3, G0 + 3.6, h - 4.0, 0, 0.8, 'k', 3); G.pane(P, M.bayLidval, c + dc - 1.2, c + dc + 1.2, G0 + 3.6, h - 4.0, 0.82, [[0.1, 0], [0.9, 0], [0.9, 2], [0.1, 2]]); P.quad(M.roofRed, [c + dc - 1.4, h - 4.0, 0.9], [c + dc + 1.4, h - 4.0, 0.9], [c + dc + 1.3, h - 3.4, 0], [c + dc - 1.3, h - 3.4, 0], [0, 0.85, 0.5]); }
  });
  for (const p of rec.polys) addPolyColliders(ctx, p, 0, LH.C, 0.9);
  // the coach house in the yard (one storey)
  const ch = L.buildingById('r21135361');
  if (ch) { const r = ringOf(ch.polys[0].o); walls(P, r, (len) => zones(P, len, [[0, 4.6, M.lidval, 3]])); P.cap(M.roofLidval, r, 4.6, true, 4); addPolyColliders(ctx, ch.polys[0], 0, 4.6, 0.9); }
  // the court: lawn with a round bed, the fence with granite posts and the two gates with lantern pylons
  const cover = coverFn(ctx), court = [W(-12.5, -21), W(12.5, -21), W(12.5, 30), W(-12.5, 30)];
  fillPolyClipped(P, M.pavers, court, 0.05, cover, { maxEdge: 2.5, tile: 2 }); fillPolyClipped(P, M.lawn, [W(-6.5, -14), W(6.5, -14), W(6.5, 22), W(-6.5, 22)], 0.065, cover, { maxEdge: 2.5, tile: 6, margin: 0.6 });
  const fb = BARRIERS.find((b) => b.id === 'w186087236');
  if (fb) {
    const gates = BARRIER_NODES.filter((n) => n.kind === 'gate' && Math.hypot(n.x + 1716, n.z + 2730) < 45).map((n) => ({ x: n.x, z: n.z, half: 2.0 }));
    const plan = planFence(pairs(fb.pts), 3.3, gates, 0.3), posts = [], pylons = [];
    for (const p of plan.posts) (p.gate ? pylons : posts).push(mat4(p.x, 0, p.z, p.rot, 1));
    for (const q of plan.panels) {
      panelQuad(P, M.lfence, q.a, q.b, 0.5, 2.3, 1.4); ph.addBox((q.a.x + q.b.x) / 2, (q.a.z + q.b.z) / 2, q.len, 0.14, q.rot, 0, 2.3);
      P.push(q.a.x, 0, q.a.z, q.rot); P.box(M.redGranite, 0, q.len, 0, 0.5, -0.18, 0.18, 'b', 2); P.pop();
    }
    const postG = partsGeos((Q) => { Q.box(M.redGranite, -0.28, 0.28, 0, 2.3, -0.28, 0.28, 'b', 2); G.frustum(Q, M.redGranite, 0, 0, 2.3, 2.6, 4, 0.4, 0.2, Math.PI / 4, 1, 1, { capTop: M.redGranite }); });
    const pylonG = partsGeos((Q) => {
      Q.box(M.redGranite, -0.42, 0.42, 0, 2.9, -0.42, 0.42, 'b', 2); G.frustum(Q, M.redGranite, 0, 0, 2.9, 3.2, 4, 0.6, 0.36, Math.PI / 4, 1, 1, { capTop: M.redGranite });
      Q.col(M.iron, 0, 0, 3.2, 3.45, 0.06, 0.06, 6, false); Q.box(M.lampGlass, -0.2, 0.2, 3.45, 3.95, -0.2, 0.2, 'b'); G.frustum(Q, M.bronzeGreen, 0, 0, 3.95, 4.3, 4, 0.36, 0.04, Math.PI / 4, 1, 1);
      for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [0.2, 0.2], [-0.2, 0.2]]) Q.box(M.bronzeGreen, x - 0.025, x + 0.025, 3.45, 3.95, z - 0.025, z + 0.025, 'b');
    });
    K.extraTris += addInstanced(ctx, K.root, 'lmT-lidvalPosts', postG, posts).tris + addInstanced(ctx, K.root, 'lmT-lidvalPylons', pylonG, pylons).tris;
    for (const m of posts.concat(pylons)) ph.addBox(m.elements[12], m.elements[14], 0.7, 0.7, 0, 0, 3);
    K.svc.fences.push({ id: 'w186087236', pts: pairs(fb.pts), h: 2.3, kind: 'iron', gates: plan.opens });
  }
  const c0 = W(0, -26);
  K.svc.monuments.push({ id: 'r1273188', name: 'Доходный дом И. Б. Лидваль', x: LID.o[0], z: LID.o[1], h: 26.5 });
  if (!L.insideBuilding(c0[0], c0[1], 0.6) && !L.isOnRoad(c0[0], c0[1], 0.3)) K.svc.photoSpots.push({ x: c0[0], z: c0[1], yaw: L.yawToward(c0[0], c0[1], W(0, 20)[0], W(0, 20)[1]), pitch: 10, name: 'Дом Лидваль: курдонёр' });
}
