// landmarksKamennyPalace/palace.js - the KAMENNOOSTROVSKY PALACE (Каменноостровский дворец; Felten 1776-80, Quarenghi, Rusca 1808-11): the two-storey yellow body of the OSM footprint w28055973 with its rusticated plinth,
// ground- and upper-floor windows in pale grey-green surrounds, white corner strips and the main entablature (architrave, frieze with triglyph blocks, dentils, corona), the white roof balustrade, the hipped
// copper roofs with white chimneys and a glass skylight, the EIGHT-column Tuscan river colonnade on its terrace (iron railing, side stair) crowned by the attic block, the SIX-column court portico with
// pediment and granite stair.  Frame PF (frame.js): origin = the middle of the river front line, +x NNE along the front, +z ESE out of the river front; y above the lawn.  Dossier docs/research/kamenny-2026.md 5.1.
// Interior closed (solid walls, painted doors).  The closed garden: nothing here is reachable on foot (walk.js: the footprint is a solid collider).
import * as THREE from 'three';
import { ringEdges, onEdge, band, polyOf } from './kit.js';
import { holedWall, pane, surround, Q } from './facade.js';
import { tbox } from './geo.js';
import { geosOf, put } from './objs.js';
import { tuscan, entabRing, triglyphs, balustrade, hip } from './orders.js';
import { O, ROT, W, H, P as PL } from './frame.js';

const stage = (K, name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKamennyPalace] palace/${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };

/** the footprint without the colonnade terrace jog and without the court porch (those are built apart): [x, z] counter clockwise */
export const WALL_RING = [[34.3, 0], [-34.3, 0], [-34.35, -7.0], [-42.35, -7.0], [-42.4, -27.7], [-17.3, -27.7], [-17.3, -21.1], [15.0, -21.1], [15.0, -27.7], [41.6, -27.7], [41.6, -6.95], [34.3, -6.95]];

const rect = (cx, y0, w, h) => ({ x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + h });
const bays = (len, margin, pitch) => { const n = Math.max(0, Math.round((len - 2 * margin) / pitch)); return Array.from({ length: n }, (_, i) => margin + (i + 0.5) * (len - 2 * margin) / n); };

/** edge classification in the palace frame */
function kindOf(e) {
  const [nx, nz] = e.n, mz = (e.a[1] + e.b[1]) / 2;
  if (Math.abs(nz) > 0.9) return nz > 0 ? (mz > -1 ? 'front' : 'wingRiver') : (mz > -22 ? 'court' : 'wingCourt');
  return e.len > 15 ? 'wingEnd' : 'step';
}
/** window centres (facade u) of an edge */
function windowCentres(e, kind) {
  if (e.len < 4.0) return [];
  if (kind === 'front') {
    const u0 = 34.3, cc = 0.15, out = [];
    for (let k = -3; k <= 3; k++) out.push(u0 + cc + k * 2.9);
    for (const c of bays(34.3 - 11.2, 2.0, 3.5)) { out.push(u0 + 11.2 + c); out.push(u0 - 11.2 - (34.3 - 11.2 - c)); }
    return out.sort((a, b) => a - b);
  }
  const cs = bays(e.len, 1.9, 3.5);
  if (kind === 'court') return cs.filter((u) => Math.abs(u - (15.0 - (PL.porch.x0 + PL.porch.x1) / 2)) > 1.8);
  return cs;
}

function walls(K) {
  const P = K.P, M = K.M, edges = ringEdges(polyOf(WALL_RING));
  const N = edges.length;
  const conv = edges.map((e, i) => { const nx = edges[(i + 1) % N]; const d = [nx.b[0] - nx.a[0], nx.b[1] - nx.a[1]], l = Math.hypot(...d); return (d[0] * e.n[0] + d[1] * e.n[1]) / l < -0.5; });
  edges.forEach((e, i) => {
    const kind = kindOf(e), cs = windowCentres(e, kind);
    const doorIdx = kind === 'wingEnd' ? Math.max(0, cs.length - 2) : -1;
    onEdge(P, e, (len) => {
      // ---- the plinth panel (rusticated limestone) 0.1 m proud, with the small basement windows and the door cut
      const baseHoles = [];
      cs.forEach((u, j) => { if (j === doorIdx) baseHoles.push({ x0: u - 0.65, x1: u + 0.65, y0: 0.15, y1: H.plinth, door: true }); else baseHoles.push(rect(u, 0.55, 0.72, 0.5)); });
      P.push(0, 0, 0.1, 0);
      holedWall(P, M.plinth, -0.1, len + 0.1, 0, H.plinth, baseHoles, { depth: 0.4, uvs: 1.8 });
      for (const h of baseHoles) { if (h.door) pane(P, M.door, { x0: h.x0, x1: h.x1, y0: h.y0, y1: h.y1 }, 0.4); else pane(P, M.winB, h, 0.4); }
      P.pop();
      P.box(M.whiteFlat, -0.14, len + 0.14, H.plinth, H.plinth + 0.12, -0.02, 0.14, 'b', 3);                         // the plinth cap (a white ledge)
      // ---- the wall panel with the window openings
      const holes = [];
      cs.forEach((u, j) => {
        if (j === doorIdx) { holes.push({ x0: u - 0.65, x1: u + 0.65, y0: H.plinth + 0.12, y1: H.gSill + 1.25, door: true }); }
        else holes.push(rect(u, H.gSill, 1.35, H.gTop - H.gSill));
        holes.push(rect(u, H.uSill, 1.3, H.uTop - H.uSill));
      });
      holedWall(P, M.wall, 0, len, H.plinth + 0.12, H.arch, holes, { depth: 0.3, uvs: 3 });
      for (const h of holes) {
        if (h.door) { pane(P, M.door, h, 0.3); surround(P, M.surround, h, { sw: 0.2, proud: 0.07, sill: 0 }); continue; }
        const up = h.y0 > H.belt;
        pane(P, up ? M.winU : M.winG, h, 0.3);
        surround(P, M.surround, h, { sw: 0.17, proud: 0.06, sill: up ? 0.1 : 0.14 });
        if (!up) { P.box(M.whiteFlat, h.x0 - 0.3, h.x1 + 0.3, h.y1 + 0.2, h.y1 + 0.3, 0, 0.14, 'k', 3); }          // a small cornice over every ground-floor window (P05 P04)
      }
      // ---- the string course (white) is a mitred band below; wide white strips at the convex corners and the pilasters behind the colonnade
      if (conv[i]) P.box(M.white, len - 1.4, len + 0.14, H.plinth + 0.12, H.arch, 0, 0.14, 'k', 3);
      if (conv[(i + N - 1) % N]) P.box(M.white, -0.14, 1.4, H.plinth + 0.12, H.arch, 0, 0.14, 'k', 3);
      if (kind === 'front') for (let k = -3; k <= 4; k++) { const u = 34.3 + 0.15 + (k - 0.5) * 2.9; P.box(M.white, u - 0.45, u + 0.45, H.plinth + 0.12, H.arch, 0, 0.1, 'k', 3); }
      // ---- the frieze blocks
      triglyphs(P, M, 0.6, len - 0.6, H.frieze + 0.09, { pitch: 1.1 });
      // ---- the roof balustrade (the central part of the front is the attic block)
      const skip = kind === 'front' ? [34.3 - 12.9, 34.3 + 13.2] : null;
      const run = (a, b, o) => { if (b - a > 0.5) balustrade(P, M, a, b, H.cornice, 0.3, { step: 5.5, ...o }); };
      const x0 = 0.3, x1 = len - 0.3, o = { noEnd: conv[i], noStart: !conv[(i + N - 1) % N] };
      if (skip) { run(x0, skip[0], { noEnd: false, noStart: o.noStart }); run(skip[1], x1, { noStart: false, noEnd: o.noEnd }); }
      else run(x0, x1, o);
      // ---- a drain pipe near each end of a long wall
      if (len > 12) for (const u of [len - 1.0, 1.0]) P.col(M.shade, u, 0.2, 0.25, H.cornice - 0.2, 0.07, 0.07, 6, false);
    });
  });
  // ---- the mitred bands: the string course between the floors and the entablature
  band(P, edges, H.belt, H.beltTop, 0.1, { front: M.white, top: M.white, under: M.white }, { uvs: 3 });
  entabRing(P, M, edges, H.arch);
  return edges;
}

/** hipped copper roofs, chimneys, the skylight */
function roofs(K) {
  const P = K.P, M = K.M, ye = H.cornice + 0.1;
  hip(P, M.copper, -33.3, 33.3, -20.1, -1.0, ye, H.ridge, 1.24, M.copperFlat);
  hip(P, M.copper, -41.35, -18.3, -26.7, -8.0, ye, ye + 0.35 * 9.35, 1.24, M.copperFlat);
  hip(P, M.copper, 16.0, 40.6, -26.7, -8.0, ye, ye + 0.35 * 9.35, 1.24, M.copperFlat);
  // the court-face roof of the porch is part of porch()
  const chim = (x, z, y0, h = 2.0, w = 1.2, d = 0.9) => {
    P.box(M.wall, x - w / 2, x + w / 2, y0, y0 + h, z - d / 2, z + d / 2, 'b', 2);
    P.box(M.white, x - w / 2 - 0.1, x + w / 2 + 0.1, y0 + h, y0 + h + 0.18, z - d / 2 - 0.1, z + d / 2 + 0.1, 'b', 2);
    P.box(M.shade, x - w / 2 - 0.02, x + w / 2 + 0.02, y0 + h - 0.5, y0 + h - 0.35, z - d / 2 - 0.02, z + d / 2 + 0.02, '', 2);
    P.box(M.shade, x - w / 4, x - w / 4 + 0.3, y0 + h + 0.18, y0 + h + 0.42, z - 0.15, z + 0.15, 'b', 2); P.box(M.shade, x + w / 4 - 0.3, x + w / 4, y0 + h + 0.18, y0 + h + 0.42, z - 0.15, z + 0.15, 'b', 2);
  };
  for (const x of [-27, -17.5, -8, 7, 27.5]) chim(x, -10.55, H.ridge - 0.6, 2.0);                // along the ridge of the central roof (P02: five stacks)
  for (const [x, z] of [[-26, -16], [-33, -17.5], [28, -16], [35, -17.5]]) { const y0 = ye + 0.35 * Math.min(9.35, Math.abs(z + 17.35) < 9.35 ? 9.35 - Math.abs(z + 17.35) : 0) - 0.4; chim(x, z, y0, 1.8, 1.0, 0.8); }
  // the glass skylight on the ridge of the central roof, NNE half: a low gabled lantern 7 x 2.6 m with white bars (P02 right end)
  const gx0 = 12.5, gx1 = 19.5, gz = -10.55, gy = H.ridge - 0.05;
  const glass = M.skyGlass;
  P.box(M.white, gx0, gx1, gy, gy + 0.35, gz - 1.5, gz + 1.5, 'b', 2);
  P.quad(glass, [gx0, gy + 0.35, gz - 1.5], [gx1, gy + 0.35, gz - 1.5], [gx1, gy + 1.5, gz], [gx0, gy + 1.5, gz], [0, 0.8, -0.6]);
  P.quad(glass, [gx1, gy + 0.35, gz + 1.5], [gx0, gy + 0.35, gz + 1.5], [gx0, gy + 1.5, gz], [gx1, gy + 1.5, gz], [0, 0.8, 0.6]);
  P.fan(glass, [[gx0, gy + 0.35, gz - 1.5], [gx0, gy + 0.35, gz + 1.5], [gx0, gy + 1.5, gz]], [-1, 0, 0]); P.fan(glass, [[gx1, gy + 0.35, gz + 1.5], [gx1, gy + 0.35, gz - 1.5], [gx1, gy + 1.5, gz]], [1, 0, 0]);
  for (let x = gx0; x <= gx1 + 0.01; x += (gx1 - gx0) / 4) { P.cyl(M.white, [x, gy + 0.35, gz - 1.5], [x, gy + 1.5, gz], 0.04, 0.04, 4, false); P.cyl(M.white, [x, gy + 0.35, gz + 1.5], [x, gy + 1.5, gz], 0.04, 0.04, 4, false); }
  P.cyl(M.white, [gx0, gy + 1.5, gz], [gx1, gy + 1.5, gz], 0.05, 0.05, 4, false);
}

/** the colonnade terrace: ashlar block, flags, iron railing with posts, side stair at the SSW end */
function terrace(K) {
  const P = K.P, M = K.M, T = PL.terrace, h = H.terrace;
  tbox(P, M.plinth, T.x0, T.x1, 0, h, 0, T.z, 1.8, 1.8, 'tb');
  P.quad(M.flags, [T.x0 - 0.05, h, T.z + 0.05], [T.x1 + 0.05, h, T.z + 0.05], [T.x1 + 0.05, h, 0], [T.x0 - 0.05, h, 0], [0, 1, 0], [[(T.x0 - 0.05) / 2.4, 2.15 / 2.4], [(T.x1 + 0.05) / 2.4, 2.15 / 2.4], [(T.x1 + 0.05) / 2.4, 0], [(T.x0 - 0.05) / 2.4, 0]]);
  P.box(M.plinth, T.x0 - 0.12, T.x1 + 0.12, h - 0.18, h, -0.02, T.z + 0.12, 'tb', 1.8);       // the coping slab
  // railing on the front edge and the NNE end; posts every bay
  const zr = T.z - 0.05, rh = 1.0;
  const bayRun = (x0, x1, z, rotY) => {
    P.push(0, 0, 0, 0);
    const n = Math.max(1, Math.round(Math.abs(x1 - x0) / 1.8)), k = (x1 - x0) / n;
    for (let i = 0; i <= n; i++) { const x = x0 + k * i; P.box(M.iron, x - 0.04, x + 0.04, h, h + rh + 0.05, z - 0.04, z + 0.04, 'b', 1); }
    for (let i = 0; i < n; i++) Q(P, M.railX, [x0 + k * i, h + 0.05, z], [x0 + k * (i + 1), h + 0.05, z], [x0 + k * (i + 1), h + rh, z], [x0 + k * i, h + rh, z], [0, 0, 1]);
    P.pop(); void rotY;
  };
  bayRun(T.x0 + 0.05, T.x1 - 0.05, zr, 0);
  // the NNE end (x = T.x1): a rail along z, drawn as a quad facing +x
  { const x = T.x1 - 0.05, n = 1, z0 = 0.05, z1 = zr; Q(P, M.railX, [x, h + 0.05, z1], [x, h + 0.05, z0], [x, h + rh, z0], [x, h + rh, z1], [1, 0, 0]); void n; }
  // the stair at the SSW end: 5 steps down toward -x, 2.1 m wide (z 0 .. 2.1)
  const steps = 5, run = 0.36, rise = h / (steps + 1);
  for (let k = 1; k <= steps; k++) {
    const xa = T.x0 - run * (k - 1), xb = T.x0 - run * k, top = h - rise * k;
    P.box(M.plinth, xb, xa + 0.001, 0, top, 0, T.z, 'b', 1.8);
    P.quad(M.flags, [xb, top, T.z], [xa, top, T.z], [xa, top, 0], [xb, top, 0], [0, 1, 0], [[xb / 2.4, 0.9], [xa / 2.4, 0.9], [xa / 2.4, 0], [xb / 2.4, 0]]);
  }
  // side cheek of the stair (a low ashlar wall along the z = 2.1 side) with the rail continuing
  P.box(M.plinth, T.x0 - run * steps, T.x0, 0, h - rise * 0.2, T.z - 0.06, T.z + 0.18, 'b', 1.8);
  // the rail along the stair: posts + sloped sheet
  { const xa = T.x0, xb = T.x0 - run * steps, z = T.z + 0.0, y0 = h + 0.0, y1 = h - rise * steps + 0.0; Q(P, M.railX, [xa, y0 + 0.05, z], [xb, y1 + 0.05, z], [xb, y1 + rh, z], [xa, y0 + rh, z], [0, 0, 1]); }
}

/** the eight river columns (separate meshes), the portico entablature with its returns, the attic block */
function colonnade(K) {
  const P = K.P, M = K.M, root = K.root;
  const set = (K.shared.tuscan ||= geosOf((Q) => tuscan(Q, M.whiteFlat, H.colTop - H.terrace, { capMat: M.whiteFlat })));
  let tris = 0;
  for (const x of PL.cols) { const p = W(x + 0.15, PL.colAxisZ); tris += put(root, set, p.x, H.terrace, p.z, ROT, 1, 'kpal-col'); }
  K.extraTris += tris;
  // the entablature over the columns and its two returns to the wall (a mitred band over a rectangle, the wall side omitted)
  const x0 = -11.6, x1 = 11.9, z0 = 0, z1 = 1.95;
  const edges = ringEdges(polyOf([[x0, z0], [x1, z0], [x1, z1], [x0, z1]])).filter((e) => e.n[1] > -0.5);
  const o = { proj: 1, arch: 0.4, frieze: 0.65, dentil: 0.2, corona: 0.3, cyma: 0.1 };
  const top = entabRing(P, M, edges, H.colTop, o);
  for (const e of edges) if (e.n[1] > 0.5) onEdge(P, e, (len) => triglyphs(P, M, 0.7, len - 0.7, H.colTop + 0.4 + 0.02, { pitch: 1.1, h: 0.55, proud: 0.1 }));
  // the soffit of the portico ceiling
  P.quad(M.shade, [x0, H.colTop, z0], [x1, H.colTop, z0], [x1, H.colTop, z1], [x0, H.colTop, z1], [0, -1, 0]);
  // the attic block over the colonnade (white with yellow fields, a cornice and a flat copper roof)
  const ay0 = top, ay1 = H.atticTop - 0.4, ax0 = -12.2, ax1 = 12.5, az0 = -3.5, az1 = 0.5;
  const ae = ringEdges(polyOf([[ax0, az0], [ax1, az0], [ax1, az1], [ax0, az1]]));
  for (const e of ae) onEdge(P, e, (len) => {
    P.box(M.white, 0, len, ay0, ay1, -0.1, 0.0, 'kb', 3);
    P.box(M.wall, 0, len, ay0 + 0.35, ay1 - 0.3, -0.1, 0.06, 'kb', 3);
    const n = Math.max(1, Math.round(len / 5)), k = len / n;
    for (let i = 0; i <= n; i++) P.box(M.white, i * k - 0.3, i * k + 0.3, ay0, ay1, -0.1, 0.16, 'kb', 3);
    P.box(M.white, 0, len, ay0 + 0.28, ay0 + 0.4, -0.1, 0.14, 'kb', 3); P.box(M.white, 0, len, ay1 - 0.4, ay1 - 0.28, -0.1, 0.14, 'kb', 3);
  });
  band(P, ae, ay1, H.atticTop, 0.34, { front: M.white, top: M.white, under: M.shade }, { uvs: 3 });
  P.quad(M.copperFlat, [ax0, H.atticTop, az0], [ax1, H.atticTop, az0], [ax1, H.atticTop, az1], [ax0, H.atticTop, az1], [0, 1, 0]);
  // a few window-like blind lights in the attic fields are left plain (P08: yellow fields with white frames)
}

/** the court portico: platform, six columns, entablature, pediment, gable roof, granite stair */
function porch(K) {
  const P = K.P, M = K.M, root = K.root, B = PL.porch, c = (B.x0 + B.x1) / 2, h = 1.1, zf = B.z, zw = PL.court;
  tbox(P, M.plinth, B.x0, B.x1, 0, h, zf, zw, 1.8, 1.8, 'tb');
  P.quad(M.flags, [B.x0 - 0.05, h, zf - 0.05], [B.x1 + 0.05, h, zf - 0.05], [B.x1 + 0.05, h, zw], [B.x0 - 0.05, h, zw], [0, 1, 0], [[B.x0 / 2.4, zf / 2.4], [B.x1 / 2.4, zf / 2.4], [B.x1 / 2.4, zw / 2.4], [B.x0 / 2.4, zw / 2.4]]);
  P.box(M.plinth, B.x0 - 0.1, B.x1 + 0.1, h - 0.16, h, zf - 0.12, zw, 'tb', 1.8);
  const set = (K.shared.tuscanC ||= geosOf((Q) => tuscan(Q, M.whiteFlat, H.arch - h, { capMat: M.whiteFlat })));
  let tris = 0;
  for (const dx of [-8.5, -5.1, -1.7, 1.7, 5.1, 8.5]) { const p = W(c + dx, zf + 1.05); tris += put(root, set, p.x, h, p.z, ROT, 1, 'kpal-col'); }
  K.extraTris += tris;
  // entablature over the three sides of the porch (wall side open)
  const edges = ringEdges(polyOf([[B.x0 + 0.25, zf + 0.25], [B.x1 - 0.25, zf + 0.25], [B.x1 - 0.25, zw], [B.x0 + 0.25, zw]])).filter((e) => e.n[1] < 0.5);
  entabRing(P, M, edges, H.arch, { proj: 1, arch: 0.45, frieze: 0.8, dentil: 0.25, corona: 0.35, cyma: 0.15 });
  for (const e of edges) if (e.n[1] < -0.5) onEdge(P, e, (len) => triglyphs(P, M, 0.7, len - 0.7, H.frieze + 0.09, { pitch: 1.1 }));
  P.quad(M.shade, [B.x0 + 0.25, H.arch, zf + 0.25], [B.x1 - 0.25, H.arch, zf + 0.25], [B.x1 - 0.25, H.arch, zw], [B.x0 + 0.25, H.arch, zw], [0, -1, 0]);
  // the pediment (tympanum in the wall colour, raking cornice white) and the gable roof behind it
  const y0 = H.cornice, rise = 2.5, xl = B.x0 - 0.3, xr = B.x1 + 0.3, zt = zf + 0.25 - 0.1;
  P.fan(M.wall, [[xl + 0.4, y0, zt], [xr - 0.4, y0, zt], [c, y0 + rise - 0.3, zt]], [0, 0, -1], (p) => [p[0] / 3, p[1] / 3]);
  const sl = Math.atan2(rise, (xr - xl) / 2), len = Math.hypot((xr - xl) / 2, rise);
  for (const sg of [-1, 1]) {
    const cx = c + sg * (xr - xl) / 4, cy = y0 + rise / 2;
    P.push(cx, cy, zt + 0.15, 0);
    const g1 = new THREE.BoxGeometry(len + 0.5, 0.3, 0.9), g2 = new THREE.BoxGeometry(len, 0.18, 0.5);
    P.geo(M.white, g1, 0, 0.1, 0, 0, 0, sg < 0 ? sl : -sl); P.geo(M.white, g2, 0, -0.14, 0.12, 0, 0, sg < 0 ? sl : -sl);
    P.pop(); g1.dispose(); g2.dispose();
  }
  // the gable roof (two copper slopes from the raking cornices back to the wall)
  const rz = zw + 0.5;
  P.quad(M.copper, [xl, y0 + 0.1, zt], [c, y0 + rise - 0.1, zt], [c, y0 + rise - 0.1, rz], [xl, y0 + 0.1, rz], [-0.35, 0.9, 0]);
  P.quad(M.copper, [c, y0 + rise - 0.1, zt], [xr, y0 + 0.1, zt], [xr, y0 + 0.1, rz], [c, y0 + rise - 0.1, rz], [0.35, 0.9, 0]);
  // the granite stair across the whole front: five steps
  const n = 5, run = 0.42, rs = h / n;
  for (let k = 1; k <= n; k++) {
    const za = zf - run * (k - 1), zb = zf - run * k, top = h - rs * k;
    if (top < 0.01) break;
    P.box(M.plinth, B.x0 - 0.3, B.x1 + 0.3, 0, top, zb, za + 0.001, 'b', 1.8);
    P.quad(M.flags, [B.x0 - 0.3, top, zb], [B.x1 + 0.3, top, zb], [B.x1 + 0.3, top, za], [B.x0 - 0.3, top, za], [0, 1, 0], [[(B.x0 - 0.3) / 2.4, zb / 2.4], [(B.x1 + 0.3) / 2.4, zb / 2.4], [(B.x1 + 0.3) / 2.4, za / 2.4], [(B.x0 - 0.3) / 2.4, za / 2.4]]);
  }
  // the central door of the court face (behind the columns): a pair of doors with a surround
  { const h0 = { x0: c - 0.9, x1: c + 0.9, y0: h, y1: h + 3.2 }; Q(P, M.door, [h0.x1, h0.y0, zw - 0.012], [h0.x0, h0.y0, zw - 0.012], [h0.x0, h0.y1, zw - 0.012], [h0.x1, h0.y1, zw - 0.012], [0, 0, -1]);
    const sx = 0.25; P.box(M.surround, h0.x0 - sx, h0.x0, h0.y0, h0.y1 + sx, zw - 0.07, zw + 0.02, 'b', 3); P.box(M.surround, h0.x1, h0.x1 + sx, h0.y0, h0.y1 + sx, zw - 0.07, zw + 0.02, 'b', 3); P.box(M.surround, h0.x0, h0.x1, h0.y1, h0.y1 + sx, zw - 0.07, zw + 0.02, 'b', 3); }
}

export function build(K) {
  const P = K.P;
  P.push(O.x, 0, O.z, ROT);
  try {
    stage(K, 'walls', () => walls(K));
    stage(K, 'roofs', () => roofs(K));
    stage(K, 'terrace', () => terrace(K));
    stage(K, 'colonnade', () => colonnade(K));
    stage(K, 'porch', () => porch(K));
  } finally { P.pop(); }
  if (K.errs) throw new Error(K.errs.join('\n'));
}
