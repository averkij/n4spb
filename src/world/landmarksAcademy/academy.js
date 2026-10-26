// landmarksAcademy/academy.js - the main building of the Imperial Academy of Arts (OSM r165182: one polygon of 32 outer vertices + 5 holes; parts w866473808 / w866449061 / w866449060 follow through the
// parent id): docs/research/academy.md section 3.  The walls are edge-based (shell.js): every edge of the baked footprint gets a wall of BAY tiles (one window axis per tile, painted in
// metres: art.js), the giant pilasters / engaged columns are real geometry, mitred bands (plinth, string course, architrave, frieze, bed mould, corona) run round the ring, a low hipped roof
// covers the block, chimneys and two glazed studio lanterns sit on it.  The front centre (front.js), the dome stack (dome.js), the rear centre + corner pavilions (rear.js) and the round court
// (court.js) are built in the academy frame (frame.js) by their own files, one try / catch each.
//   Tiers (m above the street): plinth 0..0.9, ground floor (rusticated) .. 6.9, string course 6.9..7.05, first floor .. 13.9, top floor .. 17.7, entablature 17.8..20.2 (architrave 0.65,
//   frieze 0.95 with square tablets, bed mould, corona 0.55 projecting 0.9).  Front wings 9 axes of 4.35 m, front corner pavilions 3 axes of 4.4 m with 4 engaged columns, flanks 3 + 21 + 3 axes of
//   4.35 m, rear wings 11 axes of 3.8 m, rear corner pavilions 3 axes with 4 flat pilasters.
import * as THREE from 'three';
import * as L from '../layout.js';
import { ringEdges, onEdge, band } from './kit.js';
import { texQuad, ringRoof, hipRect, edgeColliders } from './shell.js';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';
import { ACAD, W, M as toLocal, H, OUT, HOLES, POLY, AF } from './frame.js';
import { pilaster, engaged } from './orders.js';

const TOP = 17.8;
const lv = (p) => { const q = toLocal(p[0], p[1]); return [q.u, q.v]; };

/** world poly { o, h } of the Academy: the baked polygon, else the dossier ring */
function worldPoly() {
  if (POLY) return POLY;
  const flat = (r) => r.flatMap((p) => { const w = W(p[0], p[1]); return [w.x, w.z]; });
  return { o: flat(OUT), h: HOLES.map((h) => flat(h.ring)) };
}

/** which wall is this edge?  (local coordinates of the ends; tolerances from the critic-checked ring) */
function classify(e) {
  if (e.hole) return e.holeKind === 'round' ? 'round' : 'inner';
  const a = lv(e.a), b = lv(e.b), du = Math.abs(b[0] - a[0]), dv = Math.abs(b[1] - a[1]), mu = (a[0] + b[0]) / 2, mv = (a[1] + b[1]) / 2, len = e.len;
  const horiz = dv < 0.9 && du > 1.0, vert = du < 0.9 && dv > 1.0, vmax = Math.max(a[1], b[1]);
  if (vmax > 59.8 && Math.abs(mu) < 11 && !(horiz && mv > 60.5 && len > 15)) return 'podium';
  if (horiz && mv > 56.5 && mv < 58 && len > 30) return 'frontWing';
  if (horiz && mv > 60 && mv < 62 && len > 14 && len < 18) return 'frontCorner';
  if (vert && mv > 58 && mv < 60.2 && len > 3 && len < 4.5 && Math.abs(mu) > 50) return 'frontCornerSide';
  if (horiz && mv > 59 && mv < 60.2 && len < 2.6) return 'cpStub';
  if (vert && mv > 57.5 && mv < 59.2 && len < 3 && Math.abs(mu) > 9 && Math.abs(mu) < 13) return 'cpSide';
  if (vert && len > 100) return 'flank';
  if (horiz && mv < -46 && mv > -48 && len > 30) return 'rearWing';
  if (horiz && mv < -57.5 && mv > -59.5 && len > 14 && len < 18) return 'rearCorner';
  if (vert && mv < -50 && mv > -55 && len > 10 && len < 12.5 && Math.abs(mu) > 50) return 'rearCornerSide';
  if (horiz && mv < -52.5 && mv > -54 && len > 20) return 'rearCentre';
  if (vert && mv < -49 && mv > -52 && len > 5 && len < 7 && Math.abs(mu) < 14) return 'rearCentreSide';
  return 'flank';
}

export async function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  const poly = worldPoly();
  const edges = ringEdges(poly, 0.3);
  // hole kinds: the edge list is outer ring first, then every hole in order (i resets at each ring)
  { let ring = -1, prev = 1e9; for (const e of edges) { if (!e.hole) continue; if (e.i <= prev) ring++; prev = e.i; e.ringIdx = ring; const kind = poly.h[ring] && poly.h[ring].length / 2 >= 19 && poly.h[ring].length / 2 <= 21 ? 'round' : 'court'; e.holeKind = kind; } }
  const outer = edges.filter((e) => !e.hole), holes = edges.filter((e) => e.hole);
  for (const e of outer) e.kind = classify(e);
  for (const e of holes) e.kind = classify(e);
  const count = {}; for (const e of outer) count[e.kind] = (count[e.kind] || 0) + 1;
  K.svc.debug = { kinds: count };

  // ------------------------------------------------------------------------------------------ bay runs
  /** tiled run in the facade frame of an edge: [x0, x1] holds n bays of tile `mat`; blank strips of `blank` fill the margins [0, x0] and [x1, len]; returns the pitch */
  const run = (len, xa, xb, n, mat, blank) => {
    if (blank && xa > 0.02) texQuad(P, blank, 0, xa, 0, TOP, 0, 1, TOP, 0, 0);
    texQuad(P, mat, xa, xb, 0, TOP, 0, n, TOP, 0, 0);
    if (blank && xb < len - 0.02) texQuad(P, blank, xb, len, 0, TOP, 0, 1, TOP, 0, 0);
    return (xb - xa) / n;
  };
  const wallOf = (e, fn) => onEdge(P, e, (len, f) => fn(len, f));
  const pil = (xs, y0, y1, o) => { for (const x of xs) pilaster(P, M, x, y0, y1, o); };
  const evenly = (x0, pitch, n) => Array.from({ length: n + 1 }, (_, i) => x0 + i * pitch);

  for (const e of outer) {
    try {
      switch (e.kind) {
        case 'frontWing': wallOf(e, (len) => { const n = 9, pitch = 4.35, m = (len - n * pitch) / 2; run(len, m, len - m, n, M.bFront, M.bFrontBlank); pil(evenly(m, pitch, n), H.ground, H.top); }); break;
        case 'frontCorner': wallOf(e, (len) => {
          const n = 3, pitch = 4.4, m = (len - n * pitch) / 2; run(len, m, len - m, n, M.bFrontCorner, M.bFrontBlank);
          for (const x of evenly(m, pitch, n)) engaged(P, M, x, 0.12, H.ground, H.top, 0.75);
        }); break;
        case 'frontCornerSide': wallOf(e, (len) => { run(len, 0, len, 1, M.bFrontCorner, null); pil([0.5, len - 0.5], H.ground, H.top, { w: 0.9 }); }); break;
        case 'cpStub': wallOf(e, (len) => { texQuad(P, M.rust, 0, len, 0, H.podium, 0, len / 3, 3, 0, 0); }); break;                  // front.js draws the wall above the podium level (one tile)
        case 'cpSide': wallOf(e, (len) => { texQuad(P, M.bFrontBlank, 0, len, 0, TOP, 0, 1, TOP, 0, 0); pil([0.5, len - 0.5], H.ground, H.top, { w: 0.9 }); }); break;
        case 'flank': wallOf(e, (len) => {
          const pitch = 4.35, m = Math.max(0, (len - 27 * pitch) / 2), x1 = m + 3 * pitch, x2 = x1 + 21 * pitch, x3 = x2 + 3 * pitch;
          if (len < 27 * pitch - 1) { run(len, 0, len, Math.max(1, Math.round(len / pitch)), M.bFlank, null); return; }
          // the three runs are laid side by side; the blank margins are only the strips [0, m] and [x3, len] (run() would blank everything outside ITS run: the blank tile then lay coplanar over
          // the 21 plain bays and the far end, a z-fight that left the flank without windows - found by review-academy 2026-10-08)
          if (m > 0.02) texQuad(P, M.bFlankEndBlank, 0, m, 0, TOP, 0, 1, TOP, 0, 0);
          run(len, m, x1, 3, M.bFlankEnd, null); run(len, x1, x2, 21, M.bFlank, null); run(len, x2, x3, 3, M.bFlankEnd, null);
          if (x3 < len - 0.02) texQuad(P, M.bFlankEndBlank, x3, len, 0, TOP, 0, 1, TOP, 0, 0);
          pil(evenly(m, pitch, 3).concat(evenly(x2, pitch, 3)), H.ground, H.top);
        }); break;
        case 'rearWing': wallOf(e, (len) => { const n = 11, pitch = 3.8, m = (len - n * pitch) / 2; run(len, m, len - m, n, M.bRear, M.bRearBlank); }); break;
        case 'rearCorner': wallOf(e, (len) => {
          const n = 3, pitch = 4.4, m = (len - n * pitch) / 2; run(len, m, len - m, n, M.bRearCorner, M.bRearCornerBlank);
          pil(evenly(m, pitch, n), H.ground, H.top, { w: 1.0, proj: 0.5 });
        }); break;
        case 'rearCornerSide': wallOf(e, (len) => {
          const n = 3, pitch = len / 3; run(len, 0, len, n, M.bRearCorner, null);
          pil(evenly(0.5, (len - 1.0) / 3, 3), H.ground, H.top, { w: 0.9, proj: 0.4 });
        }); break;
        case 'rearCentre': break;                                                       // rear.js draws the pavilion front (door, grilles, columns)
        case 'rearCentreSide': wallOf(e, (len) => { texQuad(P, M.bRearCornerBlank, 0, len, 0, TOP, 0, 1, TOP, 0, 0); }); break;
        case 'podium': break;                                                           // front.js: rusticated podium and shoulders
        default: wallOf(e, (len) => { run(len, 0, len, Math.max(1, Math.round(len / 4.35)), M.bFlank, null); });
      }
    } catch (err) { console.warn('[landmarksAcademy] wall', e.kind, err.message); }
  }
  // the inner light courts and the round court: plain bays, full height
  for (const e of holes) {
    try {
      const mat = e.kind === 'round' ? M.bCourt : M.bInner, pitch = e.kind === 'round' ? 4.75 : 4.2;
      wallOf(e, (len) => { const n = Math.max(1, Math.round(len / pitch)); texQuad(P, mat, 0, len, 0, TOP, 0, n, TOP, 0, 0); });
    } catch (err) { console.warn('[landmarksAcademy] court wall', err.message); }
  }

  // ------------------------------------------------------------------------------------------ bands: plinth, string course, entablature (outer ring: every edge but the podium; holes: entablature only)
  const rings = [outer, ...[...new Set(holes.map((e) => e.ringIdx))].map((i) => holes.filter((e) => e.ringIdx === i))];
  const notPodium = (e) => e.kind !== 'podium' && e.kind !== 'rearCentre';
  try {
    band(P, outer, 0, H.plinth, 0.1, { front: M.granitePlinth, top: M.granitePlinth }, { uvs: 2.4 });
    band(P, outer, H.ground, H.ground + 0.15, 0.22, { front: M.order, top: M.order, under: M.soffit }, { draw: (e) => e.kind !== 'podium' && e.kind !== 'cpStub' && e.kind !== 'rearCentre' });
    for (const r of rings) {
      const dr = r === outer ? notPodium : undefined;
      band(P, r, H.top + 0.1, 18.45, 0.08, { front: M.order, top: M.order }, { draw: dr });                                           // architrave
      band(P, r, 18.45, 19.4, 0.0, { front: M.frieze }, { draw: dr, uvs: 1.25, vBase: 18.45 });                                         // frieze (square tablets)
      band(P, r, 19.4, 19.65, 0.42, { front: M.orderShade, top: M.order, under: M.soffit }, { draw: dr });                              // bed mould
      band(P, r, 19.65, H.eave, 0.9, { front: M.order, top: M.order, under: M.soffit }, { draw: dr });                                  // corona
    }
  } catch (err) { console.warn('[landmarksAcademy] bands', err.message); }

  // ------------------------------------------------------------------------------------------ the roof: a low hip over the wings (sheet metal) with the courts cut out
  const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map((p) => { const w = W(p[0], p[1]); return [w.x, w.z]; });
  try {
    const hole = (h) => (h.kind === 'round' ? HOLES.find((x) => x.kind === 'round').ring.map((p) => { const w = W(p[0], p[1]); return [w.x, w.z]; })
      : (() => { let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const p of h.ring) { u0 = Math.min(u0, p[0]); u1 = Math.max(u1, p[0]); v0 = Math.min(v0, p[1]); v1 = Math.max(v1, p[1]); } return rect(u0, u1, v0, v1); })());
    const holeRings = (HOLES.length ? HOLES : []).map(hole);
    ringRoof(P, rect(-70.4, 67.9, -47.1, 57.3), holeRings, H.eave, M.roof, { inset: 4.2, rise: 1.6, over: 0.4 });
  } catch (err) { console.warn('[landmarksAcademy] roof', err.message); }
  const YR = H.eave + 0.02;                                                              // eave of the roof
  P.push(ACAD.x, 0, ACAD.z, ACAD.rot);
  try {
    // corner pavilions: shallow pyramids over the pavilion bodies
    hipRect(P, M.roof, -70.2, -54.2, 46.5, 61.2, YR, 2.0, { over: 0.3 });
    hipRect(P, M.roof, 52.2, 67.9, 46.5, 61.2, YR, 2.0, { over: 0.3 });
    hipRect(P, M.roof, -70.4, -54.4, -58.6, -45.0, YR, 2.0, { over: 0.3 });
    hipRect(P, M.roof, 51.9, 67.7, -58.6, -45.0, YR, 2.0, { over: 0.3 });
    // the terrace strip in front of the attic of the front centre (between the pavilion wall and the attic wall)
    P.quad(M.roofLight, [-12.8, YR, 60.1], [10.8, YR, 60.1], [10.8, YR, 56.8], [-12.8, YR, 56.8], [0, 1, 0], [[0, 0], [10, 0], [10, 2], [0, 2]]);
    // the glazed studio lanterns on the front wings (steel frame, gabled glass) and a small glazed pyramid above the west corner pavilion
    const lantern = (u0, u1, v0, v1, y) => {
      const h = 2.0, vm = (v0 + v1) / 2, yb = y + 0.35, top = y + h, uvq = [[0, 0], [(u1 - u0) / 1.5, 0], [(u1 - u0) / 1.5, 2], [0, 2]];
      P.box(M.steel, u0, u1, y, yb, v0, v1, 'b');
      P.quad(M.glassRoof, [u0, yb, v0], [u1, yb, v0], [u1, top, vm], [u0, top, vm], [0, 0.8, -0.6], uvq);
      P.quad(M.glassRoof, [u0, top, vm], [u1, top, vm], [u1, yb, v1], [u0, yb, v1], [0, 0.8, 0.6], uvq);
      for (const [x, s] of [[u0, -1], [u1, 1]]) P.fan(M.glassRoof, [[x, yb, v0], [x, yb, v1], [x, top, vm]], [s, 0, 0], (p) => [p[2] / 1.5, p[1] / 1.5]);
      const n = Math.max(2, Math.round((u1 - u0) / 1.5));
      for (let i = 0; i <= n; i++) {                                                     // steel glazing bars up both slopes
        const x = u0 + ((u1 - u0) * i) / n;
        P.quad(M.steel, [x - 0.04, yb + 0.01, v0 - 0.01], [x + 0.04, yb + 0.01, v0 - 0.01], [x + 0.04, top + 0.03, vm], [x - 0.04, top + 0.03, vm], [0, 0.8, -0.6]);
        P.quad(M.steel, [x - 0.04, top + 0.03, vm], [x + 0.04, top + 0.03, vm], [x + 0.04, yb + 0.01, v1 + 0.01], [x - 0.04, yb + 0.01, v1 + 0.01], [0, 0.8, 0.6]);
      }
      P.box(M.steel, u0, u1, top - 0.02, top + 0.09, vm - 0.08, vm + 0.08, '');
    };
    lantern(-33.5, -17.2, 38.5, 43.5, 21.82);
    lantern(16.3, 30.7, 38.5, 43.5, 21.82);
    for (const [cu, cv] of [[-62.2, 52.8]]) { const r = 1.6, y = 21.9; for (let i = 0; i < 4; i++) { const a0 = i * Math.PI / 2 + Math.PI / 4, a1 = a0 + Math.PI / 2; P.fan(M.glassRoof, [[cu + Math.cos(a0) * r * 1.4, y, cv + Math.sin(a0) * r * 1.4], [cu + Math.cos(a1) * r * 1.4, y, cv + Math.sin(a1) * r * 1.4], [cu, y + 1.8, cv]], [Math.cos((a0 + a1) / 2), 0.9, Math.sin((a0 + a1) / 2)], (p) => [p[0] / 1.5, p[1] / 1.5]); } }
    // chimneys: cream-peach plaster, white caps; rows near the ridge lines of the wings (about 12 visible along the front ridge)
    const chim = (u, v) => { const y0 = 21.55; P.box(M.chimney, u - 0.45, u + 0.45, y0, y0 + 2.0, v - 0.6, v + 0.6, 'b'); P.box(M.chimneyCap, u - 0.52, u + 0.52, y0 + 2.0, y0 + 2.12, v - 0.67, v + 0.67, ''); };
    let nChim = 0;
    const row = (u0, u1, v0, v1, k) => { for (let i = 0; i < k; i++) { const t = k === 1 ? 0.5 : i / (k - 1); chim(u0 + (u1 - u0) * t, v0 + (v1 - v0) * t); nChim++; } };
    row(-51, -14, 52.2, 52.2, 6); row(13, 50, 52.2, 52.2, 6);                            // front ridge
    row(-51, -16, -42.0, -42.0, 5); row(14, 50, -42.0, -42.0, 5);                       // rear ridge (the rear dome sits at u -1.1)
    row(-65.2, -65.2, -40, 50, 10); row(62.8, 62.8, -40, 50, 10);                       // flank ridges
    K.svc.chimneys = nChim;
  } catch (err) { console.warn('[landmarksAcademy] roof details', err.message); }
  P.pop();

  // ------------------------------------------------------------------------------------------ the sub-parts in the academy frame (own try / catch each)
  for (const [name, file] of [['front', './front.js'], ['dome', './dome.js'], ['rear', './rear.js'], ['court', './court.js']]) {
    try { const m = await import(file); await m.build(K); } catch (err) { console.error('[landmarksAcademy] ' + name + ' failed:', err); K.svc.failed = (K.svc.failed || []).concat(name + ': ' + (err && err.message || err)); }
  }
  // ------------------------------------------------------------------------------------------ colliders: the whole footprint (outer walls and the five courts) is solid
  try { addPolyColliders(ctx, poly, 0, 24); } catch (err) { console.warn('[landmarksAcademy] colliders', err.message); }
  void L; void THREE; void edgeColliders; void ringFromFlat; void AF; void ph;
}
