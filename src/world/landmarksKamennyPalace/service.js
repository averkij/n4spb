// landmarksKamennyPalace/service.js - the service buildings of the palace (dossier docs/research/kamenny-2026.md 5.1 [C]; photos P12 P14 P22 for the kitchen block, P17 for the gardener's house):
//   the KITCHEN BLOCK + RIDING HALL r10254212 (1785; 179 m x 8.1 / 11.2 m): a long two-storey pale-yellow block with a limestone plinth, a string course with a green fillet, white window surrounds, a white cornice,
//   a green hipped copper roof with a thin black roof railing and two big stacks at the west end; iron door canopies on brackets every 12 m on the garden (north) face, cream drain pipes;
//   the GARDENER'S HOUSE w28055968 (18.6 x 14.3 m, two storeys, yellow with white pilasters and dark window frames, hipped copper roof, white stacks) on the embankment road;
//   the unknown service shed w28055969 ("lit. D", 39.8 x 8.8 m [?]: drawn as a plain yellow one-storey shed with a low hipped roof).
//   Frames: KB = the block frame (origin = the west end of its north wall (-2834.7, -5323.7), +x along the block to the ESE, +z to the south (the yard side), rotation -26.42 deg).
import { ringEdges, onEdge, band, polyOf } from './kit.js';
import { holedWall, pane, surround, Q } from './facade.js';
import { hip, balustrade } from './orders.js';
import { archPts, planeShape } from './geo.js';
import { KITCHEN, GARDENER, LITD } from './frame.js';

const stage = (K, name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKamennyPalace] service/${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };
const rect = (cx, y0, w, h) => ({ x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + h });
const bays = (len, margin, pitch) => { const n = Math.max(0, Math.round((len - 2 * margin) / pitch)); return Array.from({ length: n }, (_, i) => margin + (i + 0.5) * (len - 2 * margin) / n); };

/**
 * a plain two-storey block walled from a world ring: plinth, wall with window holes (M.winK), white surrounds, a string course, a cornice; o = { plinth, g: [y0, y1] ground windows, u: [y0, y1] upper windows, wall, strHi, corn, pitch, margin,
 * doors(edge, centres) -> indices, canopy(P, M, u) }.  Returns the edges.
 */
function blockWalls(K, ring, o) {
  const P = K.P, M = K.M, edges = ringEdges(polyOf(ring)), N = edges.length;
  const conv = edges.map((e, i) => { const nx = edges[(i + 1) % N]; const d = [nx.b[0] - nx.a[0], nx.b[1] - nx.a[1]], l = Math.hypot(...d); return (d[0] * e.n[0] + d[1] * e.n[1]) / l < -0.5; });
  edges.forEach((e, i) => {
    const cs = e.len > (o.minLen ?? 4) ? bays(e.len, o.margin, o.pitch) : [];
    const doorSet = new Set(o.doors ? o.doors(e, cs) : []);
    onEdge(P, e, (len) => {
      P.box(M.plinth, -0.05, len + 0.05, 0, o.plinth, -0.02, 0.1, 'b', 1.8);
      const holes = [];
      cs.forEach((u, j) => {
        if (doorSet.has(j)) holes.push({ x0: u - 0.7, x1: u + 0.7, y0: o.plinth, y1: o.g[1] + 0.4, door: true });
        else holes.push(rect(u, o.g[0], o.w, o.g[1] - o.g[0]));
        holes.push(rect(u, o.u[0], o.w, o.u[1] - o.u[0]));
      });
      holedWall(P, M.wall, 0, len, o.plinth, o.hi, holes, { depth: 0.3, uvs: 3 });
      for (const h of holes) {
        if (h.door) { pane(P, M.door, h, 0.3); surround(P, M.white, h, { sw: 0.14, proud: 0.05, sill: 0 }); if (o.canopy) o.canopy(P, M, (h.x0 + h.x1) / 2, h.y1 + 0.35); continue; }
        pane(P, M.winK, h, 0.3); surround(P, M.white, h, { sw: 0.12, proud: 0.05, sill: 0.08 });
      }
      if (conv[i]) P.box(M.white, len - 0.9, len + 0.1, o.plinth, o.hi, 0, 0.1, 'k', 3);
      if (conv[(i + N - 1) % N]) P.box(M.white, -0.1, 0.9, o.plinth, o.hi, 0, 0.1, 'k', 3);
      if (len > 12 && o.pipes) for (const u of o.pipes(len)) P.col(M.shade, u, 0.17, 0.2, o.hi - 0.1, 0.06, 0.06, 6, false);
    });
  });
  band(P, edges, o.str[0], o.str[1], 0.08, { front: M.white, top: M.white, under: M.white }, { uvs: 3 });
  band(P, edges, o.str[0] + 0.28, o.str[0] + 0.34, 0.1, { front: M.copperFlat, top: null, under: null }, { uvs: 3 });             // the green fillet under the string course
  band(P, edges, o.hi, o.hi + 0.3, 0.28, { front: M.white, top: M.white, under: M.shade }, { uvs: 3 });
  band(P, edges, o.hi + 0.3, o.hi + 0.62, 0.5, { front: M.white, top: M.white, under: M.shade }, { uvs: 3 });
  return edges;
}

const canopy = (P, M, u, y) => {             // a wrought-iron door canopy on two scroll brackets (P12 P22): a dark sloped plate 1.9 x 0.9 m
  P.quad(M.iron, [u - 0.95, y, 0.05], [u + 0.95, y, 0.05], [u + 0.95, y - 0.22, 0.95], [u - 0.95, y - 0.22, 0.95], [0, 0.97, 0.22]);
  for (const s of [-0.8, 0.8]) { P.cyl(M.iron, [u + s, y - 0.55, 0.05], [u + s, y - 0.2, 0.9], 0.025, 0.025, 4, false); P.cyl(M.iron, [u + s, y - 0.2, 0.05], [u + s, y - 0.2, 0.9], 0.02, 0.02, 4, false); }
};

/** the kitchen block */
function kitchen(K) {
  const P = K.P, M = K.M, ring = KITCHEN;
  const o = { plinth: 0.9, g: [1.35, 3.35], u: [5.45, 7.25], w: 1.1, hi: 8.0, str: [4.55, 4.9], margin: 1.6, pitch: 2.9,
    doors: (e, cs) => (e.n[1] < -0.5 && e.len > 100 ? cs.map((u, j) => (j % 4 === 2 ? j : -1)).filter((j) => j >= 0) : []),
    canopy, pipes: (len) => { const a = []; for (let u = 6; u < len - 4; u += 12) a.push(u + 3); return a; } };
  blockWalls(K, ring, o);
  // roofs in the block frame
  const th = -26.4216 * Math.PI / 180, ye = o.hi + 0.62 + 0.05, rise = 0.55;
  P.push(ring[6][0], 0, ring[6][1], th);
  hip(P, M.copper, 45.2 + 0.0, 178.7 - 0.5, 0.5, 11.15 - 0.5, ye, ye + rise * 4.6, 1.24, M.copperFlat);
  hip(P, M.copper, 0.5, 45.2 + 0.4, 0.5, 8.14 - 0.5, ye, ye + rise * 3.1, 1.24, M.copperFlat);
  // chimney stacks: two big at the west end (P22 P12), small ones along the ridge
  const stack = (x, z, y0, h, w, d) => { P.box(M.wall, x - w / 2, x + w / 2, y0, y0 + h, z - d / 2, z + d / 2, 'b', 3); P.box(M.copperFlat, x - w / 2 - 0.12, x + w / 2 + 0.12, y0 + h, y0 + h + 0.2, z - d / 2 - 0.12, z + d / 2 + 0.12, 'b', 3); };
  stack(5.6, 3.9, ye + 1.0, 2.8, 1.5, 1.3); stack(7.5, 3.9, ye + 1.0, 2.8, 1.5, 1.3);
  for (let x = 62; x < 170; x += 31) stack(x, 5.6, ye + rise * 4.6 - 0.4, 1.7, 0.9, 0.8);
  // the arched dormers on the garden (north) slope every ~5.8 m (P14): a yellow box with an arched window and a small copper cap
  for (let x = 9; x < 172; x += 5.8) {
    if (Math.abs(x - 6.5) < 3.2) continue;
    P.box(M.wall, x - 0.6, x + 0.6, ye + 0.62, ye + 2.1, 1.9, 3.3, 'b', 3);
    P.push(x, 0, 1.885, Math.PI); planeShape(P, M.winU, archPts(0, ye + 0.85, 0.8, 1.15, 8), 0); P.pop();
    P.box(M.white, x - 0.66, x + 0.66, ye + 2.1, ye + 2.22, 1.82, 3.35, 'b', 3);
  }
  // the roof railing: thin black rails at the eave line, 1.0 m (north and south long sides)
  const rail = (x0, x1, z, zsign) => { const n = Math.max(1, Math.round((x1 - x0) / 2.0)), k = (x1 - x0) / n; for (let i = 0; i < n; i++) Q(P, M.roofRail, [x0 + k * i, ye + 0.05, z], [x0 + k * (i + 1), ye + 0.05, z], [x0 + k * (i + 1), ye + 1.05, z], [x0 + k * i, ye + 1.05, z], [0, 0, zsign]); };
  rail(0.6, 178.2, 0.55, -1); rail(0.6, 45.2, 8.14 - 0.55, 1); rail(45.2, 178.2, 11.15 - 0.55, 1);
  P.pop();
}

/** the gardener's house */
function gardener(K) {
  const P = K.P, M = K.M;
  const o = { plinth: 0.8, g: [1.5, 3.5], u: [4.7, 6.5], w: 1.05, hi: 6.8, str: [4.1, 4.4], margin: 1.4, pitch: 3.0, minLen: 5 };
  const edges = blockWalls(K, GARDENER, o);
  const ye = o.hi + 0.62 + 0.05, a = GARDENER[0], b = GARDENER[1], th = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
  P.push(a[0], 0, a[1], th);
  hip(P, M.copper, 0.5, 18.6 - 0.5, 0.5, 14.3 - 0.5, ye, ye + 0.42 * 6.7);
  for (const [x, z] of [[6.5, 7.2], [11.8, 7.2]]) { P.box(M.wall, x - 0.55, x + 0.55, ye + 1.8, ye + 4.2, z - 0.45, z + 0.45, 'b', 3); P.box(M.white, x - 0.65, x + 0.65, ye + 4.2, ye + 4.4, z - 0.55, z + 0.55, 'b', 3); }
  P.pop(); void edges;
}

/** the service shed (lit. D) */
function shed(K) {
  const P = K.P, M = K.M;
  const o = { plinth: 0.5, g: [1.2, 2.9], u: [9, 9.1], w: 0.9, hi: 4.4, str: [2.0, 2.1], margin: 2.0, pitch: 3.6, minLen: 6 };
  const o2 = { ...o, g: [1.0, 2.5], u: [30, 30.1] };
  // one storey: the upper window row is dropped by placing it above the wall (the holes are clipped away)
  const edges = ringEdges(polyOf(LITD)), N = edges.length;
  edges.forEach((e) => {
    const cs = e.len > 6 ? bays(e.len, 2.0, 3.6) : [];
    onEdge(P, e, (len) => {
      P.box(M.plinth, -0.05, len + 0.05, 0, 0.5, -0.02, 0.1, 'b', 1.8);
      const holes = cs.map((u) => rect(u, 1.2, 0.9, 1.5));
      holedWall(P, M.wall, 0, len, 0.5, 4.4, holes, { depth: 0.3, uvs: 3 });
      for (const h of holes) { pane(P, M.winK, h, 0.3); surround(P, M.white, h, { sw: 0.1, proud: 0.05, sill: 0.08 }); }
    });
  });
  band(P, edges, 4.4, 4.7, 0.3, { front: M.white, top: M.white, under: M.shade }, { uvs: 3 });
  const a = LITD[0], b = LITD[1], th = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
  P.push(a[0], 0, a[1], th);
  hip(P, M.copper, 0.4, 39.8 - 0.4, 0.4, 8.8 - 0.4, 4.75, 4.75 + 0.3 * 4.0);
  P.pop(); void N; void o2; void balustrade;
}

export function build(K) {
  stage(K, 'kitchen', () => kitchen(K));
  stage(K, 'gardener', () => gardener(K));
  stage(K, 'shed', () => shed(K));
  if (K.errs) throw new Error(K.errs.join('\n'));
}
