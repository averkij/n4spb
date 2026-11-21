// landmarksF/body.js - the body of Kazan Cathedral: the Latin cross (nave 31 m wide, transept 32.6 m wide, east apse) with giant pilasters, two rows of windows, a full entablature, an attic and a crown
// cornice (all as mitred bands around the footprint), the crossing block (up to 35 m) and the flat lead roofs.  Footprint numbers: docs/research/kazan-cathedral.md 2.3 (OSM u / v of r11763697):
// nave u -41.5..25.3 x v -88.4..-57.4, transept u -17.4..16.0 (made symmetric, +-16.3) x v -98..-41.3, apse R 8.5 centred (22.8, 72.9) in the model frame (mz = -v).
import * as THREE from 'three';
import { ringEdges, onEdge, band, localOnEdge } from './kit.js';
import { boxAt } from './frame.js';

export const TX = 16.3, NZ = 41.3, SZ = 98.0, NVN = 57.4, NVS = 88.4, L1 = -41.5, R1 = 25.3, DOME = { x: 0, z: 72.7 };
export const Y_FLOOR = 1.2, Y_ENT = 15.0, Y_WALL = 24.0, Y_ROOF = 24.9, Y_CROSS = 30.2;

export function outline() {
  const apse = [], A = Math.acos(2.5 / 8.5), cx = 22.8, cz = 72.9, R = 8.5;
  for (let i = 0; i <= 10; i++) { const a = -A + 2 * A * i / 10; apse.push([cx + R * Math.cos(a), cz + R * Math.sin(a)]); }
  return [[-TX, NZ], [TX, NZ], [TX, NVN], [R1, NVN], ...apse, [R1, NVS], [TX, NVS], [TX, SZ], [-TX, SZ], [-TX, NVS], [L1, NVS], [L1, NVN], [-TX, NVN]];
}

const mid = (e) => [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];
const isNorth = (e) => Math.abs(e.n[1] + 1) < 1e-3 && Math.abs(mid(e)[1] - NZ) < 0.1;
const isWest = (e) => Math.abs(e.n[0] + 1) < 1e-3 && Math.abs(mid(e)[0] - L1) < 0.1;
const isSouth = (e) => Math.abs(e.n[1] - 1) < 1e-3 && Math.abs(mid(e)[1] - SZ) < 0.1;
const isPortico = (e) => isNorth(e) || isWest(e) || isSouth(e);

/** window: dark glass 6 cm proud of the wall, stone surround (sides + lintel) and sill, frame lines */
export function win(P, M, x, y0, w, h, o = {}) {
  const sw = o.sw ?? 0.26, d = o.d ?? 0.16;
  P.quad(M.glass, [x - w / 2, y0, 0.05], [x + w / 2, y0, 0.05], [x + w / 2, y0 + h, 0.05], [x - w / 2, y0 + h, 0.05], [0, 0, 1]);
  P.box(M.stoneWarm, x - w / 2 - sw, x - w / 2, y0 - 0.12, y0 + h + sw, 0, d, 'kb'); P.box(M.stoneWarm, x + w / 2, x + w / 2 + sw, y0 - 0.12, y0 + h + sw, 0, d, 'kb');
  P.box(M.stoneWarm, x - w / 2, x + w / 2, y0 + h, y0 + h + sw, 0, d, 'kb'); P.box(M.stoneWarm, x - w / 2 - sw, x + w / 2 + sw, y0 - 0.2, y0 - 0.02, 0, d + 0.06, 'kb');
  if (o.bars !== false) { P.box(M.iron, x - 0.025, x + 0.025, y0, y0 + h, 0.05, 0.07, 'kb'); for (let k = 1; k < (o.rows ?? 3); k++) P.box(M.iron, x - w / 2, x + w / 2, y0 + h * k / (o.rows ?? 3) - 0.025, y0 + h * k / (o.rows ?? 3) + 0.025, 0.05, 0.07, 'kb'); }
}
/** engaged fluted pilaster with a base and a Corinthian-like capital block, in the facade frame */
export function pilaster(P, M, x, y0, y1, w = 1.0) {
  P.box(M.stone, x - w / 2, x + w / 2, y0, y1 - 1.3, 0, 0.34, 'kb');
  for (const sx of [-0.25, 0, 0.25]) P.box(M.stoneShade, x + sx * w - 0.02, x + sx * w + 0.02, y0 + 0.4, y1 - 1.5, 0.34, 0.36, 'kb');
  P.box(M.baseGranite, x - w / 2 - 0.1, x + w / 2 + 0.1, y0, y0 + 0.4, 0, 0.44, 'kb');
  P.box(M.stoneWarm, x - w / 2 - 0.12, x + w / 2 + 0.12, y1 - 1.3, y1 - 0.2, 0, 0.5, 'kb'); P.box(M.stoneShade, x - w / 2 - 0.05, x + w / 2 + 0.05, y1 - 1.1, y1 - 0.5, 0.5, 0.56, 'kb');
  P.box(M.stoneWarm, x - w / 2 - 0.2, x + w / 2 + 0.2, y1 - 0.2, y1, 0, 0.56, 'kb');
}

export function churchBody(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics;
  const ring = outline(), edges = ringEdges({ o: ring.flat(), h: [] });
  K.footprint = ring;
  // ---- plinth, entablature, crown (mitred bands; the portico edges have their own platforms / entablatures)
  band(P, edges, 0, Y_FLOOR, 0.35, { front: M.step, top: M.step }, { draw: (e) => !isPortico(e), uvs: 3 });
  const nb = (e) => !isPortico(e);
  band(P, edges, Y_ENT, 16.0, 0.2, { front: M.stoneWarm, top: M.stoneWarm, under: M.stoneWarm }, { draw: nb });
  band(P, edges, 16.0, 17.1, 0.12, { front: M.stoneShade, top: M.stoneShade, under: M.stoneShade }, { draw: nb });
  band(P, edges, 17.1, 17.5, 0.55, { front: M.dentil, top: M.stoneWarm, under: M.stoneWarm }, { draw: nb, uvs: 0.9 });
  band(P, edges, 17.5, 18.6, 0.95, { front: M.stoneWarm, top: M.stoneWarm, under: M.stoneWarm }, { draw: nb });
  band(P, edges, Y_WALL, Y_ROOF, 0.65, { front: M.stoneWarm, top: M.stoneWarm, under: M.stoneWarm }, { uvs: 3 });
  // ---- walls
  for (const e of edges) {
    onEdge(P, e, (len) => {
      const wall = M.stone;
      if (isPortico(e)) {
        // the wall behind a portico: ashlar up to the crown (the door cases are drawn by portico.js)
        if (isWest(e) && K.interior) {                                              // the main entrance is open: a flat-headed opening 3.6 x 7 m in the middle of the west wall
          const sh = new THREE.Shape(); sh.moveTo(0, Y_FLOOR); sh.lineTo(len, Y_FLOOR); sh.lineTo(len, Y_WALL); sh.lineTo(0, Y_WALL); sh.lineTo(0, Y_FLOOR);
          const c = len / 2, hole = new THREE.Path(); hole.moveTo(c - 1.8, 1.35); hole.lineTo(c - 1.8, 8.35); hole.lineTo(c + 1.8, 8.35); hole.lineTo(c + 1.8, 1.35); hole.lineTo(c - 1.8, 1.35); sh.holes.push(hole);
          P.face(wall, sh, 0, 2.4);
          return;
        }
        P.quad(wall, [0, Y_FLOOR, 0], [len, Y_FLOOR, 0], [len, Y_WALL, 0], [0, Y_WALL, 0], [0, 0, 1], [[0, Y_FLOOR / 2.4], [len / 2.4, Y_FLOOR / 2.4], [len / 2.4, Y_WALL / 2.4], [0, Y_WALL / 2.4]]);
        return;
      }
      P.quad(wall, [0, Y_FLOOR, 0], [len, Y_FLOOR, 0], [len, Y_WALL, 0], [0, Y_WALL, 0], [0, 0, 1], [[0, Y_FLOOR / 2.4], [len / 2.4, Y_FLOOR / 2.4], [len / 2.4, Y_WALL / 2.4], [0, Y_WALL / 2.4]]);
      const n = Math.max(1, Math.round(len / 4.6)), p = len / n, small = len < 3.2;
      for (let k = 0; k < n; k++) {
        const x = p * (k + 0.5);
        if (small) { win(P, M, x, 2.8, 1.2, 4.0, { rows: 2 }); win(P, M, x, 9.2, 1.0, 3.4, { rows: 2 }); continue; }
        win(P, M, x, 2.7, 1.7, 4.3); win(P, M, x, 9.3, 1.4, 3.6);
        P.quad(M.relief, [x - 1.3, 6.9 + 0.6, 0.04], [x + 1.3, 6.9 + 0.6, 0.04], [x + 1.3, 8.4, 0.04], [x - 1.3, 8.4, 0.04], [0, 0, 1], [[0, 0], [0.6, 0], [0.6, 1], [0, 1]]);
        P.box(M.stoneShade, x - 1.55, x + 1.55, 19.7, 23.0, 0, 0.1, 'kb'); P.box(M.stoneWarm, x - 1.3, x + 1.3, 20.0, 22.7, 0, 0.14, 'kb');           // attic panels
      }
      for (let k = 0; k < n; k++) pilaster(P, M, p * k, Y_FLOOR, Y_ENT, small ? 0.7 : 1.1);
    });
  }
  // ---- roof of the cross
  P.cap(M.roof, ring, Y_ROOF, true, 8);
  // ---- the crossing block (above the nave / transept roofs): ashlar with big recessed panels, crown cornice
  const x0 = -TX, x1 = TX, z0 = NVN, z1 = NVS, yb = Y_ROOF, yt = Y_CROSS - 0.6;
  for (const [fx, fz, rot, len] of [[0, z0, Math.PI, x1 - x0], [0, z1, 0, x1 - x0], [x1, 0, Math.PI / 2, z1 - z0], [x0, 0, -Math.PI / 2, z1 - z0]]) {
    P.push(fx, 0, fz === 0 ? (z0 + z1) / 2 : fz, rot);
    const h = len / 2;
    P.quad(M.stone, [-h, yb, 0], [h, yb, 0], [h, yt, 0], [-h, yt, 0], [0, 0, 1], [[-h / 2.4, yb / 2.4], [h / 2.4, yb / 2.4], [h / 2.4, yt / 2.4], [-h / 2.4, yt / 2.4]]);
    const m = Math.round(len / 5.5);
    for (let i = 0; i < m; i++) { const xc = -h + len * (i + 0.5) / m; P.box(M.stoneShade, xc - 1.9, xc + 1.9, yb + 1.9, yt - 1.8, 0, 0.1, 'kb'); P.box(M.stoneWarm, xc - 1.6, xc + 1.6, yb + 2.2, yt - 2.1, 0, 0.14, 'kb'); }
    P.pop();
  }
  P.box(M.stoneWarm, x0 - 0.6, x1 + 0.6, yt, Y_CROSS, z0 - 0.6, z1 + 0.6, '');
  // ---- the apse: the icon of the Kazan Mother of God in a gilded niche with a sunburst (photo 18), on the axis of the nave
  P.push(31.3, 0, 72.9, Math.PI / 2);
  P.box(M.gold, -0.62, 0.62, 5.1, 7.7, 0.0, 0.18, 'kb'); P.box(M.patina, -0.5, 0.5, 5.2, 7.5, 0.18, 0.22, 'kb');
  P.box(M.gold, -0.75, 0.75, 7.7, 7.95, 0.0, 0.3, 'kb');
  P.cyl(M.gold, [0, 9.6, 0.1], [0, 9.6, 0.16], 0.8, 0.8, 12, true);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; P.cyl(M.gold, [Math.cos(a) * 0.9, 9.6 + Math.sin(a) * 0.9, 0.12], [Math.cos(a) * 1.5, 9.6 + Math.sin(a) * 1.5, 0.12], 0.06, 0.02, 3, false); }
  P.pop();
  // ---- colliders: thin walls along the footprint (the portico platforms and steps are separate); the doors stay closed in stage 1
  K.wallBoxes = [];
  const gaps = K.interior ? doorGaps() : [];
  for (const e of edges) {
    const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], len = Math.hypot(dx, dz);
    let segs = [[0, len]];
    for (const g of gaps) { if (!g.edge(e)) continue; const u = g.u(e); segs = segs.flatMap(([s0, s1]) => (u[1] <= s0 || u[0] >= s1) ? [[s0, s1]] : [[s0, Math.max(s0, u[0])], [Math.min(s1, u[1]), s1]].filter((s) => s[1] - s[0] > 0.05)); }
    for (const [s0, s1] of segs) {
      const t = (s0 + s1) / 2 / len, cx = e.a[0] + dx * t, cz = e.a[1] + dz * t;
      boxAt(ph, cx, cz, s1 - s0 + 0.1, 0.5, Math.atan2(-dz, dx) + 0, -1, 40);
      K.wallBoxes.push([cx, cz, s1 - s0]);
    }
  }
}
/** door openings of the walls (stage 2): [{ edge(e): bool, u(e): [u0, u1] along the edge }] */
export function doorGaps() { return [{ edge: isWest, u: () => [15.5 - 1.8, 15.5 + 1.8] }]; }
export { isWest, isNorth, isSouth };
void localOnEdge;
