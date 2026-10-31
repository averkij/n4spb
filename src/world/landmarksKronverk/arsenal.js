// landmarksKronverk/arsenal.js - the ARSENAL ON THE KRONVERK = the Artillery Museum (P. Tamansky 1850-60; OSM r3243636) with its south enclosure (wall r3243671 / r3243667, the crenellated main gate r3243670, the low
// sheds) and the service houses of the island.  Dossier docs/research/kronverk.md section 2; photos refs/kronverk 01 04 05 06 07 08 09 12 13 20.
// The horseshoe is a band 28 m deep: every footprint edge is one or a few textured quads (mats.js M.bay: a painted bay per u unit): OUTER bays (granite socle, cellar window, two loophole slits, string course,
// one segment-headed window, corbel table), COURT bays (two tiers of round-arched windows between lesenes), the two MONOGRAM GATES in the long outer faces, the END PAVILIONS (last 15 m of both wings:
// parapet with a blind arcade, merlons, four square turrets with pyramid caps) and the central RISALIT (two crenellated towers, the museum door).  The roof is built from the two wall chains (outer / court):
// ridge = the midpoints of nearest-point pairs, hipped toward the pavilions.  Heights: eaves 17.5 m, parapets 19.6 m, ridge 22 m (photo estimates, +-1.5 m).
import * as THREE from 'three';
import { ringEdges, onEdge, band } from './kit.js';
import { addPolyColliders } from '../lib/massing.js';
import * as G from './geo.js';
import { byId, pairs, dist, lerp2, nearestOnLine, densify, rotOf, rotOut, centroid } from './frame.js';
import { walls, house, flatRoof } from './house.js';
import { C } from './mats.js';

export const H = 17.5, HP = 19.6, RISE = 4.6, PAV = 15;
export const GATE = { x: -2059.9, z: -2295.7, n: [0.31, 0.951], t: [0.951, -0.31] };          // the main gate of the south wall: centre, outward normal (SSE), wall axis

// ---------------------------------------------------------------- bay painters (metres)
const socle = (D, h = 1.1) => { D.rect(0, 0, D.wM, h, C.socle); D.g.strokeStyle = 'rgba(80,66,60,0.5)'; D.g.lineWidth = 2; D.g.beginPath(); D.g.moveTo(0, D.Y(h * 0.5)); D.g.lineTo(D.w, D.Y(h * 0.5)); for (let x = 0; x <= D.wM; x += 1.2) { D.g.moveTo(D.X(x), D.Y(0)); D.g.lineTo(D.X(x), D.Y(h * 0.5)); D.g.moveTo(D.X(x + 0.6), D.Y(h * 0.5)); D.g.lineTo(D.X(x + 0.6), D.Y(h)); } D.g.stroke(); D.rect(0, h, D.wM, h + 0.07, '#cfc2b8'); };
const cornice = (D, yTop, n = 8) => { D.rect(0, yTop - 1.55, D.wM, yTop - 1.4, '#d27a56'); D.corbels(yTop - 1.4, yTop - 0.75, n); D.band(yTop - 0.75, yTop, '#cb6c48'); D.rect(0, yTop - 0.2, D.wM, yTop, '#dc8a66'); };
const grime = (D) => D.speck(900, ['rgba(70,30,20,0.16)', 'rgba(235,170,140,0.14)', 'rgba(40,20,14,0.10)']);
const outerBay = (D) => {
  const w = D.wM;
  D.bricks(0, 0, w, D.hM); socle(D);
  D.band(2.1, 2.25, '#d27a56');
  D.window(w / 2, 2.5, 1.0, 1.25, { rise: 0.3, surround: 0.18, nx: 3, ny: 3, bar: 'rgba(18,18,20,0.9)' });
  for (const k of [0.25, 0.75]) { D.rect(k * w - 0.17, 6.35, k * w + 0.17, 8.55, '#7a3323'); D.rect(k * w - 0.1, 6.45, k * w + 0.1, 8.45, '#1f1512'); D.rect(k * w - 0.24, 6.22, k * w + 0.24, 6.35, '#d7b9a6'); }
  D.band(11.25, 11.7, '#cf7450'); D.rect(0, 11.7, w, 11.78, '#e0906c');
  D.window(w / 2, 12.6, 1.15, 2.0, { rise: 0.35, surround: 0.2, nx: 1, ny: 2 });
  cornice(D, D.hM, 8); grime(D);
};
const courtWin = (D, cx, y0, ww = 1.7, hh = 3.9) => D.window(cx, y0, ww, hh, { surround: 0.5, ring: '#a8492f', ring2: '#d27a58', nx: 2, ny: 4 });
const dentils = (D, y0) => { D.band(y0, y0 + 0.25, '#cf7450'); for (let x = 0.06; x < D.wM; x += 0.3) D.rect(x, y0 + 0.25, x + 0.15, y0 + 0.55, '#a8492f'); D.band(y0 + 0.55, y0 + 0.8, '#d98660', false); };
const lesenes = (D, yTop, pipe = '#9aa3a8') => { for (const x of [0, D.wM - 0.38]) { D.rect(x, 1.1, x + 0.38, yTop, '#cf6c48'); } D.rect(0.38, 1.1, 0.43, yTop, 'rgba(60,24,16,0.3)'); if (pipe) { D.rect(0, 0.4, 0.085, yTop + 1.2, pipe); D.rect(D.wM - 0.085, 0.4, D.wM, yTop + 1.2, pipe); } };
const courtBay = (D) => { const w = D.wM; D.bricks(0, 0, w, D.hM); socle(D, 1.0); courtWin(D, w / 2, 2.5); dentils(D, 8.2); courtWin(D, w / 2, 10.2); lesenes(D, 15.95); cornice(D, D.hM, 8); grime(D); };
const doorBay = (D) => {
  const w = D.wM; D.bricks(0, 0, w, D.hM); socle(D, 1.0);
  D.fillArch(w / 2, 0, 3.3, 5.3, '#a8492f'); D.fillArch(w / 2, 0, 2.9, 5.05, '#d27a58'); D.fillArch(w / 2, 0, 2.4, 4.8, '#3a2a20');
  D.rect(w / 2 - 1.0, 0.1, w / 2 + 1.0, 3.1, '#7a4a2a'); D.rect(w / 2 - 0.03, 0.1, w / 2 + 0.03, 3.1, '#2a1a10'); for (const s of [-1, 1]) D.rect(w / 2 + s * 0.52 - 0.33, 0.5, w / 2 + s * 0.52 + 0.33, 2.7, '#8f5a34');
  D.rect(w / 2 - 1.2, 3.1, w / 2 + 1.2, 3.25, '#d2c4b6'); D.window(w / 2, 3.3, 2.2, 1.4, { surround: 0, nx: 3, ny: 1, sill: false });
  dentils(D, 8.2); courtWin(D, w / 2, 10.2, 2.0, 4.2); lesenes(D, 15.95, null); cornice(D, D.hM, 8); grime(D);
};
const pavBay = (D) => {
  const w = D.wM; D.bricks(0, 0, w, D.hM); socle(D, 1.1);
  courtWin(D, w / 2, 2.6, 2.0, 4.2); dentils(D, 8.2);
  D.window(w / 2, 10.0, 2.0, 5.6, { surround: 0.55, ring: '#a8492f', ring2: '#d27a58', nx: 2, ny: 5 });
  for (const x of [0, w - 0.6]) D.rect(x, 1.1, x + 0.6, 17.4, '#cf6c48');
  cornice(D, 17.5, 10);
  const n = 6; for (let i = 0; i < n; i++) D.fillArch((i + 0.5) * w / n, 17.95, w / n * 0.5, 1.1, '#8f3d2a');
  D.band(19.2, D.hM, '#cf7450'); D.rect(0, D.hM - 0.12, w, D.hM, '#e0906c'); grime(D);
};
const gateBay = (D) => {
  const w = D.wM, cx = w / 2, g = D.g;
  D.bricks(0, 0, w, D.hM); socle(D);
  D.rect(cx - 2.75, 0, cx + 2.75, 11.25, 'rgba(255,214,190,0.10)'); for (const s of [-1, 1]) D.rect(cx + s * 2.75 - 0.04, 0, cx + s * 2.75 + 0.04, 11.25, 'rgba(60,24,16,0.35)');
  for (const s of [-1, 1]) D.rect(cx + s * 2.4 - 0.5, 0, cx + s * 2.4 + 0.5, 2.6, C.socle);
  // the great blind arch with the bronze lunettes and the eagle
  D.fillArch(cx, 5.3, 5.0, 4.9, '#a8492f'); D.fillArch(cx, 5.5, 4.5, 4.45, '#d27a58'); D.fillArch(cx, 5.7, 4.1, 4.05, '#b4563a');
  for (const s of [-1, 1]) { D.fillArch(cx + s * 1.02, 5.95, 1.85, 1.45, '#2e261c'); D.fillArch(cx + s * 1.02, 6.0, 1.7, 1.35, C.bronze); D.text(s < 0 ? 'Н' : 'А', cx + s * 1.02, 6.75, 0.8, '#b79a5a', 'italic bold'); D.text(s < 0 ? '1850' : '1860', cx + s * 1.02, 6.2, 0.3, '#a58c58'); }
  g.fillStyle = '#2e261c'; g.beginPath(); g.arc(D.X(cx), D.Y(8.45), D.X(0.72), 0, 6.3); g.fill(); g.fillStyle = C.bronze; g.beginPath(); g.arc(D.X(cx), D.Y(8.45), D.X(0.62), 0, 6.3); g.fill();
  g.fillStyle = '#7a6a48'; g.beginPath(); g.ellipse(D.X(cx), D.Y(8.45), D.X(0.18), D.X(0.36), 0, 0, 6.3); g.fill(); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(D.X(cx + s * 0.3), D.Y(8.5), D.X(0.22), D.X(0.3), s * 0.5, 0, 6.3); g.fill(); }
  // the gate: archivolt, iron fan leaves
  D.fillArch(cx, 0, 4.9, 5.75, '#a8492f', 1.25); D.fillArch(cx, 0, 4.45, 5.55, '#d27a58', 1.12); D.fillArch(cx, 0, 4.0, 5.3, '#131518', 1.0);
  g.strokeStyle = '#3a3d40'; g.lineWidth = Math.max(1.5, D.X(0.05)); g.beginPath();
  for (let x = -1.9; x <= 1.91; x += 0.27) { g.moveTo(D.X(cx + x), D.Y(0.1)); g.lineTo(D.X(cx + x), D.Y(2.3)); }
  for (const y of [0.25, 2.3, 4.2]) { g.moveTo(D.X(cx - 2), D.Y(y)); g.lineTo(D.X(cx + 2), D.Y(y)); }
  for (const s of [-1, 1]) for (let a = 0; a <= 8; a++) { const t = a / 8 * Math.PI; g.moveTo(D.X(cx + s * 1.0), D.Y(3.25)); g.lineTo(D.X(cx + s * 1.0 + Math.cos(t) * 0.95), D.Y(3.25 + Math.sin(t) * 0.95 * (a % 2 ? 1 : 0.9))); g.moveTo(D.X(cx + s * 1.0), D.Y(3.25)); g.lineTo(D.X(cx + s * 1.0 + Math.cos(t) * 0.95), D.Y(3.25 - Math.sin(t) * 0.9)); }
  g.moveTo(D.X(cx), D.Y(0.1)); g.lineTo(D.X(cx), D.Y(5.2)); g.stroke();
  // tall blind niches beside the arch, slits further out
  for (const s of [-1, 1]) { D.fillArch(cx + s * 2.35, 6.2, 0.75, 3.0, '#a8492f'); D.fillArch(cx + s * 2.35, 6.9, 0.3, 1.7, '#3a1e16'); D.rect(cx + s * 4.0 - 0.1, 6.45, cx + s * 4.0 + 0.1, 8.45, '#1f1512'); D.rect(cx + s * 4.0 - 0.24, 6.22, cx + s * 4.0 + 0.24, 6.35, '#d7b9a6'); }
  D.band(11.25, 11.7, '#cf7450'); D.rect(0, 11.7, w, 11.78, '#e0906c');
  // the window above between two corbelled crenellated boxes
  D.fillArch(cx, 11.9, 2.6, 3.9, '#b4563a', 0.9); D.window(cx, 12.6, 1.2, 2.0, { rise: 0.4, surround: 0.2, nx: 1, ny: 2 });
  for (const s of [-1, 1]) { const x = cx + s * 2.2; D.rect(x - 0.95, 11.78, x + 0.95, 13.35, '#d0704c'); D.rect(x - 1.05, 13.35, x + 1.05, 13.5, '#dc8a66'); D.rect(x - 0.95, 11.78, x + 0.95, 11.9, 'rgba(60,24,16,0.4)'); for (let i = -2; i <= 2; i++) D.rect(x + i * 0.34 - 0.07, 12.3, x + i * 0.34 + 0.07, 13.1, '#7a3323'); D.window(cx + s * 4.1, 12.6, 1.0, 1.9, { rise: 0.32, surround: 0.18, nx: 1, ny: 2 }); }
  cornice(D, D.hM, 16); grime(D);
};
const wallBay = (D) => {
  const w = D.wM; D.bricks(0, 0, w, D.hM, undefined, 0.1, 0.28);
  D.rect(0, 0, w, 0.55, C.socle); D.rect(0, 0.55, w, 0.62, '#cfc2b8');
  const n = 3; for (let i = 0; i < n; i++) { const cx = (i + 0.5) * w / n; D.fillArch(cx, 1.45, 0.72, 1.75, '#a8492f'); D.fillArch(cx, 1.6, 0.46, 1.35, '#2a1712'); D.rect(cx - 0.3, 1.5, cx + 0.3, 1.6, '#d7b9a6'); }
  D.band(3.45, 3.6, '#d27a56'); D.corbels(3.6, 3.95, 8); D.band(3.95, 4.25, '#cb6c48'); D.rect(0, 4.25, w, D.hM, '#cfc6ba'); D.rect(0, 4.25, w, 4.3, 'rgba(60,40,30,0.4)'); grime(D);
};
const arcadeBay = (D) => { const w = D.wM; D.bricks(0, 0, w, D.hM, undefined, 0.1, 0.28); D.band(0, 0.18, '#dc8a66', false); for (let i = 0; i < 2; i++) D.fillArch((i + 0.5) * w / 2, 0.45, w / 2 * 0.5, 1.1, '#8f3d2a'); D.band(D.hM - 0.4, D.hM, '#cf7450'); D.rect(0, D.hM - 0.12, w, D.hM, '#e0906c'); };
const shedBay = (D) => { const w = D.wM; D.bricks(0, 0, w, D.hM, undefined, 0.1, 0.28); D.rect(0, 0, w, 0.45, C.socle); D.window(w / 2, 1.1, 1.1, 1.5, { rise: 0.3, surround: 0.16, nx: 1, ny: 2 }); D.band(D.hM - 0.45, D.hM, '#cb6c48'); };

export function arsenalMats(M) {
  return {
    outer: M.bay('ars-outer', 4.9, H, outerBay, [512, 1024]), court: M.bay('ars-court', 5.0, H, courtBay, [512, 1024]), door: M.bay('ars-door', 5.87, H, doorBay, [512, 1024]),
    pav: M.bay('ars-pav', 7.6, HP, pavBay, [512, 1024]), gate: M.bay('ars-gate', 9.8, H, gateBay, [1024, 1024]), wall: M.bay('ars-wall', 3.3, 4.6, wallBay, [256, 256]),
    arcade: M.bay('ars-arcade', 2.4, 2.1, arcadeBay, [256, 256]), shed: M.bay('ars-shed', 3.4, 3.8, shedBay, [256, 256]),
  };
}

export function build(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const A = arsenalMats(M);
  const rec = byId('r3243636'); if (!rec) throw new Error('arsenal: r3243636 missing');
  const poly = rec.polys[0], V = pairs(poly.o), N = V.length;
  const edges = ringEdges(poly, 0.01), E = (i) => edges.find((e) => e.i === i);
  /** a piece of edge e between distances s0..s1 from the LEFT end (seen from outside), as a pseudo edge for onEdge */
  const sub = (e, s0, s1) => {
    const xa = [e.n[1], -e.n[0]], fwd = (e.b[0] - e.a[0]) * xa[0] + (e.b[1] - e.a[1]) * xa[1] > 0, o = fwd ? e.a : e.b;
    const a = [o[0] + xa[0] * s0, o[1] + xa[1] * s0], b = [o[0] + xa[0] * s1, o[1] + xa[1] * s1];
    return { a, b, len: s1 - s0, n: e.n, i: e.i };
  };
  /** is vertex i the LEFT end (seen from outside) of edge i? */
  const leftIsA = (e) => { const xa = [e.n[1], -e.n[0]]; return (e.b[0] - e.a[0]) * xa[0] + (e.b[1] - e.a[1]) * xa[1] > 0; };
  const wallQ = (e, mat, Ht, bay, y0 = 0) => onEdge(P, e, (len) => { const nb = Math.max(1, Math.round(len / bay)); P.quad(mat, [0, y0, 0], [len, y0, 0], [len, Ht, 0], [0, Ht, 0], [0, 0, 1], [[0, 0], [nb, 0], [nb, 1], [0, 1]]); });
  const plainQ = (e, Ht, y0 = 0) => onEdge(P, e, (len) => P.quad(M.brickT, [0, y0, 0], [len, y0, 0], [len, Ht, 0], [0, Ht, 0], [0, 0, 1], [[0, y0 / 2], [len / 2, y0 / 2], [len / 2, Ht / 2], [0, Ht / 2]]));
  const bays = (e, mat, bay) => { if (e.len < bay * 0.55) plainQ(e, H); else wallQ(e, mat, H, bay); };
  /** parapet slab + merlons on top of a wall piece (the outer face is the wall quad itself) */
  const parapet = (e, y0, y1, o = {}) => onEdge(P, e, (len) => {
    P.box(M.brickT, 0, len, y0, y1, -0.5, 0, 'fb', 2);
    if (o.merlons !== false) { const n = Math.max(2, Math.round(len / 1.5)), w = len / n; for (let i = 0; i < n; i++) P.box(M.brickFlat, i * w + w * 0.2, i * w + w * 0.8, y1, y1 + 0.62, -0.5, 0.02, 'b', 2); }
  });
  /** a pavilion face: turret zone, one or three bays, turret zone */
  const pavFace = (e, nb) => {
    const tz = 3.0, bw = (e.len - 2 * tz) / nb;
    plainQ(sub(e, 0, tz), HP); plainQ(sub(e, e.len - tz, e.len), HP);
    onEdge(P, sub(e, tz, e.len - tz), (len) => P.quad(A.pav, [0, 0, 0], [len, 0, 0], [len, HP, 0], [0, HP, 0], [0, 0, 1], [[0, 0], [nb, 0], [nb, 1], [0, 1]]));
    parapet(e, H + 0.15, HP); void bw;
  };
  const turrets = [];
  // ================================================================== walls, edge by edge
  for (const e of edges) {
    const i = e.i, la = leftIsA(e);
    if (i === 22 || i === 44) { pavFace(e, 3); continue; }                                   // end faces of the wings
    if (i === 23 || i === 43 || i === 21 || i === 45) {
      // the pavilion takes PAV metres at the end that touches the end face (vertex 23 = start of edge 23, vertex 44 = end of edge 43, vertex 22 = end of edge 21, vertex 45 = start of edge 45)
      const atA = i === 23 || i === 45, atLeft = atA === la, L0 = Math.min(PAV, e.len);
      const pav = atLeft ? sub(e, 0, L0) : sub(e, e.len - L0, e.len), rest = e.len > L0 + 0.5 ? (atLeft ? sub(e, L0, e.len) : sub(e, 0, e.len - L0)) : null;
      pavFace(pav, 1);
      if (rest) {
        if (i === 23 || i === 43) {                                                         // long outer face: the monogram gate next to the pavilion, then the loophole bays
          const gw = 9.8, gate = atLeft ? sub(rest, 0, gw) : sub(rest, rest.len - gw, rest.len), main = atLeft ? sub(rest, gw, rest.len) : sub(rest, 0, rest.len - gw);
          wallQ(gate, A.gate, H, gw); bays(main, A.outer, 4.9);
          const c = lerp2(gate.a, gate.b, 0.5); svc.gates.push({ key: i === 23 ? 'west-monogram' : 'east-monogram', x: c[0] + e.n[0] * 0.5, z: c[1] + e.n[1] * 0.5, nx: e.n[0], nz: e.n[1], closed: true });
        } else bays(rest, A.court, 5.0);
      }
      continue;
    }
    if (i === 4 || i === 6) { plainQ(e, HP); parapet(e, H + 0.15, HP); continue; }             // risalit sides
    if (i === 5) {                                                                           // risalit front: tower, court bay, door, court bay, tower
      const tz = 4.2, bw = (e.len - 2 * tz) / 3;
      plainQ(sub(e, 0, tz), HP); plainQ(sub(e, e.len - tz, e.len), HP);
      wallQ(sub(e, tz, tz + bw), A.court, H, bw); wallQ(sub(e, tz + bw, tz + 2 * bw), A.door, H, bw); wallQ(sub(e, tz + 2 * bw, e.len - tz), A.court, H, bw);
      const mid = sub(e, tz, e.len - tz); onEdge(P, mid, (len) => { const nb = Math.round(len / 2.4); P.quad(A.arcade, [0, H, 0], [len, H, 0], [len, HP, 0], [0, HP, 0], [0, 0, 1], [[0, 0], [nb, 0], [nb, 1], [0, 1]]); });
      parapet(e, H + 0.15, HP);
      // the two towers (square, 0.35 m proud of the wall, crenellated)
      for (const s of [tz / 2, e.len - tz / 2]) onEdge(P, e, () => { tower(P, M, A, s, -tz / 2 + 0.35, tz, 21.2); });
      const dc = lerp2(e.a, e.b, 0.5); svc.entrances.push({ x: dc[0] + e.n[0] * 0.6, z: dc[1] + e.n[1] * 0.6, rotY: rotOut(e.n[0], e.n[1]), name: 'Артиллерийский музей', bldg: 'r3243636', closed: true });
      continue;
    }
    if (i >= 23 && i <= 43) bays(e, A.outer, 4.9); else bays(e, A.court, 5.0);
  }
  // socle and cornice bands all round (mitred)
  const outerEdges = edges;
  band(P, outerEdges, 0, 1.1, 0.1, { front: M.socle, top: M.socleFlat }, { uvs: 2, draw: (e) => e.i !== 5 });
  band(P, outerEdges, H - 0.5, H + 0.12, 0.34, { front: M.brickFlat, top: M.brickDark, under: M.brickDark });
  // court lesenes (0.14 m proud) and the white-capped vent posts over them
  for (const e of edges) {
    if ((e.i >= 21 && e.i <= 45) || e.i === 4 || e.i === 5 || e.i === 6 || e.len < 9) continue;
    onEdge(P, e, (len) => {
      const nb = Math.max(1, Math.round(len / 5.0)), w = len / nb;
      for (let k = 0; k <= nb; k++) {
        const x = Math.min(len - 0.38, Math.max(0.38, k * w));
        P.box(M.brickFlat, x - 0.38, x + 0.38, 1.1, H - 0.5, 0, 0.14, 'kb', 2); P.box(M.capMetal, x - 0.07, x + 0.07, 0.4, H + 0.1, 0.14, 0.27, 'kb', 2);
        for (const dx of [-0.42, 0.42]) { P.box(M.brickFlat, x + dx - 0.2, x + dx + 0.2, H + 0.12, H + 1.0, -0.42, -0.02, 'b', 2); P.box(M.white, x + dx - 0.26, x + dx + 0.26, H + 1.0, H + 1.14, -0.48, 0.04, '', 2); }
      }
    });
  }
  addPolyColliders(ctx, poly, 0, H + 3, 0.8);

  // ================================================================== pavilions: flat roofs, inner parapets, corner turrets
  const pavOf = (iEnd, iOut, iCourt, outAtStart) => {
    const eEnd = E(iEnd), eo = E(iOut), ec = E(iCourt);
    const B = outAtStart ? eo.a : eo.b, Bfar = outAtStart ? eo.b : eo.a, Aend = outAtStart ? ec.b : ec.a, Afar = outAtStart ? ec.a : ec.b;
    const d = [(Bfar[0] - B[0]) / dist(B, Bfar), (Bfar[1] - B[1]) / dist(B, Bfar)], dc = [(Afar[0] - Aend[0]) / dist(Aend, Afar), (Afar[1] - Aend[1]) / dist(Aend, Afar)];
    const Lc = Math.min(PAV, ec.len), Bi = [B[0] + d[0] * PAV, B[1] + d[1] * PAV], Ai = [Aend[0] + dc[0] * Lc, Aend[1] + dc[1] * Lc];
    const ring = [B, Bi, Ai, Aend];
    flatRoof(K, M.roof, ring, [], H + 0.14);
    // the inner parapet across the wing (faces the main roof)
    const nIn = [d[0], d[1]], pe = { a: Bi, b: Ai, len: dist(Bi, Ai), n: nIn };
    onEdge(P, pe, (len) => { P.box(M.brickT, 0, len, H + 0.1, HP, -0.5, 0, 'b', 2); const n = Math.round(len / 1.5), w = len / n; for (let k = 0; k < n; k++) P.box(M.brickFlat, k * w + w * 0.2, k * w + w * 0.8, HP, HP + 0.62, -0.5, 0.02, 'b', 2); });
    // turrets: 3 m square, 0.3 m proud of both faces at the four corners
    const inw = [(Aend[0] - B[0]) / dist(B, Aend), (Aend[1] - B[1]) / dist(B, Aend)], inwI = [(Ai[0] - Bi[0]) / dist(Bi, Ai), (Ai[1] - Bi[1]) / dist(Bi, Ai)];
    const rot = rotOf(d[0], d[1]);
    for (const [c, a, b] of [[B, d, inw], [Aend, dc, [-inw[0], -inw[1]]], [Bi, [-d[0], -d[1]], inwI], [Ai, [-dc[0], -dc[1]], [-inwI[0], -inwI[1]]]]) {
      const x = c[0] + (a[0] + b[0]) * 1.2, z = c[1] + (a[1] + b[1]) * 1.2;
      turrets.push({ x, z, rot });
    }
    return { ring, d, Bi, Ai };
  };
  const pavW = pavOf(22, 23, 21, true), pavE = pavOf(44, 43, 45, false);
  for (const t of turrets) { P.push(t.x, 0, t.z, t.rot); turret(P, M, 3.0, 21.6); P.pop(); }
  // risalit roof
  flatRoof(K, M.roof, [V[4], V[5], V[6], V[7]], [], H + 0.14);

  // ================================================================== the roof: ridge between the outer and the court chain
  const outerChain = [pavW.Bi]; for (let i = 24; i <= 43; i++) outerChain.push(V[i]); outerChain.push(pavE.Bi);
  const courtChain = [pavW.Ai]; for (const i of [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 4, 3, 2, 1, 0, 49, 48, 47, 46]) courtChain.push(V[i]); courtChain.push(pavE.Ai);
  // drop the court vertex 21 when the west pavilion already passed it (PAV < 19.5: it lies inside the pavilion side)
  if (dist(pavW.Ai, V[22]) >= dist(V[21], V[22]) - 0.05) courtChain.splice(1, 1);
  const os = densify(outerChain, 3), rows = [];
  let last = -1;
  for (const o of os) { const q = nearestOnLine(courtChain, o); const key = q.i + q.t; if (key < last - 1e-6) continue; last = key; rows.push({ o, c: q.p }); }
  rows[0] = { o: pavW.Bi, c: pavW.Ai }; rows[rows.length - 1] = { o: pavE.Bi, c: pavE.Ai };
  let acc = 0; const sAt = [0]; for (let k = 1; k < rows.length; k++) { acc += dist(lerp2(rows[k].o, rows[k].c, 0.5), lerp2(rows[k - 1].o, rows[k - 1].c, 0.5)); sAt.push(acc); }
  const yE = H + 0.14, over = 0.45;
  const pt = rows.map((r, k) => {
    const w = dist(r.o, r.c) || 1, ux = (r.o[0] - r.c[0]) / w, uz = (r.o[1] - r.c[1]) / w, m = lerp2(r.o, r.c, 0.5);
    const hip = Math.min(1, sAt[k] / 13, (acc - sAt[k]) / 13), ends = k === 0 || k === rows.length - 1 ? 0 : over;
    return { O: [r.o[0] + ux * ends, r.o[1] + uz * ends], Cc: [r.c[0] - ux * ends, r.c[1] - uz * ends], R: m, y: yE + RISE * hip, w };
  });
  for (let k = 0; k + 1 < pt.length; k++) {
    const a = pt[k], b = pt[k + 1], u0 = sAt[k] / 2.4, u1 = sAt[k + 1] / 2.4, v = a.w / 2 / 2.4;
    P.quad(M.roof, [a.O[0], yE, a.O[1]], [b.O[0], yE, b.O[1]], [b.R[0], b.y, b.R[1]], [a.R[0], a.y, a.R[1]], [0, 1, 0], [[u0, 0], [u1, 0], [u1, v], [u0, v]]);
    P.quad(M.roof, [a.Cc[0], yE, a.Cc[1]], [b.Cc[0], yE, b.Cc[1]], [b.R[0], b.y, b.R[1]], [a.R[0], a.y, a.R[1]], [0, 1, 0], [[u0, 0], [u1, 0], [u1, v], [u0, v]]);
  }
  // brick chimneys on the ridge and eyebrow dormers on the outer slope
  for (let k = 8; k + 8 < pt.length; k += 9) { const a = pt[k]; P.box(M.brickFlat, a.R[0] - 0.55, a.R[0] + 0.55, a.y - 0.6, a.y + 1.5, a.R[1] - 0.55, a.R[1] + 0.55, 'b', 2); P.box(M.white, a.R[0] - 0.65, a.R[0] + 0.65, a.y + 1.5, a.y + 1.66, a.R[1] - 0.65, a.R[1] + 0.65, '', 2); }
  svc.arsenal = { ridge: pt.map((p) => [p.R[0], p.R[1]]), H, HP };

  // ================================================================== the south enclosure: wall polygons, sheds, the main gate
  const wallRec = [byId('r3243671'), byId('r3243667')].filter(Boolean);
  for (const w of wallRec) for (const wp of w.polys) {
    walls(K, wp, 4.6, () => ({ mat: A.wall, bay: 3.3 }));
    try { P.cap(M.socleFlat, pairs(wp.o), 4.6, true, 2, []); } catch (e) { /* thin ring */ }
    addPolyColliders(ctx, wp, 0, 5.5, 0.6);
  }
  const shedStyle = { H: 3.8, bay: 3.4, mat: A.shed, trim: '#cb6c48', roof: 'roof', rise: 0.9, cornice: 0.25, plain: M.brickT };
  for (const id of ['r3243688', 'r3243687', 'r3243685', 'r3243686', 'w530124263', 'w530124264']) { const r = byId(id); if (r) house(K, r, shedStyle); }
  // the stores of the island: 7 lit. G and the long store on the west rampart, the substation
  const storeStyle = { H: 5.2, bay: 3.4, mat: M.bay('ars-store', 3.4, 5.2, (D) => { D.bricks(0, 0, D.wM, D.hM, undefined, 0.1, 0.28); D.rect(0, 0, D.wM, 0.5, C.socle); D.window(D.wM / 2, 1.3, 1.3, 2.3, { surround: 0.2, nx: 1, ny: 3 }); D.band(D.hM - 0.9, D.hM - 0.75, '#d27a56'); D.corbels(D.hM - 0.75, D.hM - 0.4, 8); D.band(D.hM - 0.4, D.hM, '#cb6c48'); }, [256, 256]), trim: '#cb6c48', roof: 'roof', cornice: 0.3, plain: M.brickT };
  for (const id of ['r3243634', 'w116404529']) { const r = byId(id); if (r) house(K, r, storeStyle); }
  { const r = byId('w116404528'); if (r) house(K, r, { ...shedStyle, H: 3.4 }); }
  mainGate(K, A);
  svc.photoSpots.push({ x: -2052, z: -2268, yaw: 14, name: 'Артиллерийский музей: главные ворота' }, { x: -2150, z: -2205, yaw: -40, name: 'Кронверк с набережной' });
  void THREE; void G; void centroid;
}

/** a crenellated square tower on a wall (edge frame: centre s along the wall, zc = its centre depth, side w, top y1) */
function tower(P, M, A, s, zc, w, y1) {
  const h = w / 2;
  P.box(M.brickT, s - h, s + h, 0, y1, zc - h, zc + h, 'b', 2);
  // arched openings (dark) on the three free faces, a cornice ring, merlons
  for (const [nx, nz] of [[0, 1], [1, 0], [-1, 0]]) { for (const k of [-0.7, 0.7]) { const cx = s + nx * (h + 0.02) + nz * k, cz = zc + nz * (h + 0.02) + nx * k; if (nz) P.quad(M.dark, [cx - 0.3, 17.9, cz], [cx + 0.3, 17.9, cz], [cx + 0.3, 19.7, cz], [cx - 0.3, 19.7, cz], [0, 0, 1]); else P.quad(M.dark, [cx, 17.9, cz - 0.3], [cx, 17.9, cz + 0.3], [cx, 19.7, cz + 0.3], [cx, 19.7, cz - 0.3], [nx, 0, 0]); } }
  P.box(M.brickFlat, s - h - 0.18, s + h + 0.18, y1 - 0.9, y1 - 0.55, zc - h - 0.18, zc + h + 0.18, '', 2);
  const n = 3, mw = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if (i > 0 && i < n - 1 && j > 0 && j < n - 1) continue; P.box(M.brickFlat, s - h + i * mw + 0.12, s - h + (i + 1) * mw - 0.12, y1, y1 + 0.7, zc - h + j * mw + 0.12, zc - h + (j + 1) * mw - 0.12, 'b', 2); }
}
/** a corner turret of an end pavilion in its own frame (centre at the origin): square shaft, slot niches, cornice, grey pyramid cap */
function turret(P, M, w, y1) {
  const h = w / 2;
  P.box(M.brickT, -h, h, 0, y1, -h, h, 'b', 2);
  for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const d = h + 0.02; if (nz) P.quad(M.brickDark, [-0.32, 17.2, nz * d], [0.32, 17.2, nz * d], [0.32, 20.2, nz * d], [-0.32, 20.2, nz * d], [0, 0, nz]); else P.quad(M.brickDark, [nx * d, 17.2, -0.32], [nx * d, 17.2, 0.32], [nx * d, 20.2, 0.32], [nx * d, 20.2, -0.32], [nx, 0, 0]); }
  P.box(M.brickFlat, -h - 0.16, h + 0.16, 0, 1.1, -h - 0.16, h + 0.16, 'b', 2);
  P.box(M.brickFlat, -h - 0.2, h + 0.2, y1 - 0.5, y1, -h - 0.2, h + 0.2, '', 2);
  P.box(M.white, -h - 0.26, h + 0.26, y1, y1 + 0.14, -h - 0.26, h + 0.26, '', 2);
  G.frustum(P, M.capMetal, 0, 0, y1 + 0.14, y1 + 1.75, 4, (h + 0.2) * Math.SQRT2, 0, Math.PI / 4, 1, 1);
}

/** the main gate of the south wall (r3243670): two crenellated turrets, the great arch with an arcaded, crenellated top, open iron leaves, the two red plaques, lanterns */
function mainGate(K, A) {
  const { P, M, ctx, svc } = K, ph = ctx.physics, g = GATE, rot = rotOut(g.n[0], g.n[1]);
  P.push(g.x, 0, g.z, rot);
  const ow = 4.2, sp = 3.5, hw = 2.9, top = 8.6;
  // the arch wall between the turrets
  const sh = new THREE.Shape(); sh.moveTo(-hw, 0); sh.lineTo(-ow / 2, 0); sh.lineTo(-ow / 2, sp); sh.absarc(0, sp, ow / 2, Math.PI, 0, true); sh.lineTo(ow / 2, 0); sh.lineTo(hw, 0); sh.lineTo(hw, top); sh.lineTo(-hw, top); sh.lineTo(-hw, 0);
  P.extrude(M.brickT, sh, -0.9, 1.8, 2, 14);
  // archivolt rings on both faces
  for (const [z, s] of [[0.9, 1], [-0.9, -1]]) { const ring = new THREE.Shape(), R0 = ow / 2 + 0.5, R1 = ow / 2 + 0.01; ring.moveTo(-R0, 0); ring.lineTo(-R0, sp); ring.absarc(0, sp, R0, Math.PI, 0, true); ring.lineTo(R0, 0); ring.lineTo(R1, 0); ring.lineTo(R1, sp); ring.absarc(0, sp, R1, 0, Math.PI, false); ring.lineTo(-R1, 0); ring.lineTo(-R0, 0); P.extrude(M.brickFlat, ring, s > 0 ? z : z - 0.12, 0.12, 2, 14); }
  // arcade band and merlons
  for (const s of [1, -1]) { const z = s * 0.92; P.quad(A.arcade, [-hw * s, 6.5, z], [hw * s, 6.5, z], [hw * s, 8.6, z], [-hw * s, 8.6, z], [0, 0, s], [[0, 0], [3, 0], [3, 1], [0, 1]]); }
  for (let i = 0; i < 5; i++) { const x = -hw + 0.35 + i * (2 * hw - 0.7) / 5; P.box(M.brickFlat, x + 0.12, x + (2 * hw - 0.7) / 5 - 0.12, top, top + 0.65, -0.9, 0.9, 'b', 2); }
  // turrets
  for (const s of [-1, 1]) {
    const x0 = s * hw, x1 = s * (hw + 1.9), xa = Math.min(x0, x1), xb = Math.max(x0, x1);
    P.box(M.brickT, xa, xb, 0, 9.7, -1.15, 1.15, 'b', 2);
    P.box(M.socle, xa - 0.08, xb + 0.08, 0, 0.9, -1.23, 1.23, 'b', 2);
    P.box(M.brickFlat, xa - 0.14, xb + 0.14, 8.9, 9.25, -1.29, 1.29, '', 2);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) P.box(M.brickFlat, xa + 0.1 + i * 0.95, xa + 0.85 + i * 0.95, 9.7, 10.35, -1.05 + j * 1.2, -0.15 + j * 1.2, 'b', 2);
    P.quad(M.brickDark, [(xa + xb) / 2 - 0.25, 5.2, 1.17], [(xa + xb) / 2 + 0.25, 5.2, 1.17], [(xa + xb) / 2 + 0.25, 7.6, 1.17], [(xa + xb) / 2 - 0.25, 7.6, 1.17], [0, 0, 1]);
    // lantern on a bracket
    const lx = s * (hw - 0.15); P.box(M.iron, lx - 0.04, lx + 0.04, 4.05, 4.12, 0.9, 1.5, '', 1); P.box(M.lanternGlass, lx - 0.16, lx + 0.16, 3.5, 4.0, 1.3, 1.62, '', 1); P.box(M.iron, lx - 0.2, lx + 0.2, 4.0, 4.08, 1.26, 1.66, '', 1);
    // open gate leaf swung into the court
    P.push(s * ow / 2, 0, -0.75, s * (Math.PI / 2 - 0.12));
    const lw = ow / 2, dir = s;
    for (let k = 0; k <= 8; k++) { const x = dir * k * lw / 8; P.box(M.iron, x - 0.025, x + 0.025, 0.15, 3.4, -0.025, 0.025, 'b', 1); }
    for (const y of [0.2, 1.2, 3.35]) P.box(M.iron, Math.min(0, dir * lw), Math.max(0, dir * lw), y - 0.04, y + 0.04, -0.03, 0.03, '', 1);
    P.pop();
  }
  // the fixed iron fan of the arch (photo 09): a transom of circles and radial bars
  P.box(M.iron, -ow / 2, ow / 2, sp - 0.05, sp + 0.05, -0.05, 0.05, '', 1); P.box(M.iron, -ow / 2, ow / 2, sp + 0.45, sp + 0.52, -0.04, 0.04, '', 1);
  for (let a = 1; a < 10; a++) { const t = a / 10 * Math.PI, r = ow / 2 - 0.05; P.cyl(M.iron, [Math.cos(t) * 0.5, sp + 0.5 + Math.sin(t) * 0.1, 0], [Math.cos(t) * r, sp + Math.sin(t) * r, 0], 0.022, 0.022, 5, false); }
  // the two red plaques
  const plaques = [
    [-1, M.sign('museum-ru', 256, 384, ['ВОЕННО-', 'ИСТОРИЧЕСКИЙ', 'МУЗЕЙ', 'артиллерии,', 'инженерных войск', 'и войск связи'], { bg: '#a8322a', fg: '#f3ead6', border: '#e6d9b0', bw: 5, font: M.FONT.sans })],
    [1, M.sign('museum-en', 256, 384, ['MILITARY-', 'HISTORICAL', 'MUSEUM', 'of artillery,', 'engineer', 'and signal corps'], { bg: '#a8322a', fg: '#f3ead6', border: '#e6d9b0', bw: 5, font: M.FONT.sans })],
  ];
  const labels = ctx.services?.labels;
  for (const [s, mat] of plaques) {
    const x = s * (hw + 0.95), lw = 0.8, lh = 1.2, y = 2.3, z = 1.18;
    const wx = g.x + g.t[0] * x + g.n[0] * z, wz = g.z + g.t[1] * x + g.n[1] * z;
    if (labels && !labels.reserve('r3243670', wx, y, wz, lw, lh, g.n[0], g.n[1], 'plaque')) continue;
    P.quad(mat, [x - lw / 2, y - lh / 2, z], [x + lw / 2, y - lh / 2, z], [x + lw / 2, y + lh / 2, z], [x - lw / 2, y + lh / 2, z], [0, 0, 1]);
  }
  P.pop();
  // colliders: the two turrets and the wall stubs; the 4.2 m opening stays free
  for (const s of [-1, 1]) { const c = s * (ow / 2 + (hw + 1.9 - ow / 2) / 2), wdt = hw + 1.9 - ow / 2; ph.addBox(g.x + g.t[0] * c, g.z + g.t[1] * c, wdt, 2.4, rot, 0, 10.4); }
  svc.gates.push({ key: 'main', x: g.x, z: g.z, nx: g.n[0], nz: g.n[1], w: ow, closed: false, name: 'Главные ворота Артиллерийского музея' });
  svc.entrances.push({ x: g.x + g.n[0] * 2, z: g.z + g.n[1] * 2, rotY: rot, name: 'Артиллерийский музей (двор)', bldg: 'r3243636' });
}
