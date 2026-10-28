// landmarksKirova/dkrear.js - the REAR of the Kirov Palace: the horseshoe CINEMA in the courtyard (OSM w65623799: dark rusticated base #6a5f58 to 3.6 m, orange render above, ribbon windows on two levels, 9.5 m), the
// annex w65623790 (plain two-storey box, 8 m, dark roof), the round glass-block stair tower at the end of the west arm, concrete balconies and stair strips on the courtyard wall of the strip (docs/research/kirova.md
// 5.8; photos dk09 dk10 dk16 dk17 dk32 dk33 dk34).  The west arm itself (volumes arma / armb / armc, 10 m, orange-salmon pebbledash) and every other courtyard wall come from dk.js (VOLUMES).
// The cinema and the annex are drawn from their baked rings (world frame, kit.js ringEdges / onEdge): every ring edge gets a wall, the edge on the strip's rear wall is skipped (a shared party wall).
import { FD, FRONT as F, ringOf } from './frame.js';
import { ringEdges, onEdge } from './kit.js';
import { tube } from './geo.js';
import { addPolyColliders } from '../lib/massing.js';
import * as L from '../layout.js';

const polyOf = (id) => { const o = ringOf(id); return o ? { o: Array.from(o), h: [] } : null; };

/** extrude a baked ring to height h with a textured wall (tile tu x tv metres: tv = h means one tile high) and a roof; edges listed in `skip(e)` are not drawn */
function ringBox(K, id, h, mat, tu, tv, skip) {
  const { P, M } = K, poly = polyOf(id);
  if (!poly) throw new Error('missing ring ' + id);
  const edges = ringEdges(poly);
  for (const e of edges) {
    if (skip && skip(e)) continue;
    onEdge(P, e, (len) => { P.quad(mat, [0, 0, 0], [len, 0, 0], [len, h, 0], [0, h, 0], [0, 0, 1], [[0, 0], [len / tu, 0], [len / tu, h / tv], [0, h / tv]]); });
  }
  const ring = []; for (let i = 0; i < poly.o.length; i += 2) ring.push([poly.o[i], poly.o[i + 1]]);
  P.cap(M.roof, ring, h, true, 2);
  return { poly, edges };
}

/** the cinema's flat side lies on the strip's rear wall (plan q = -8): skip the edge whose both ends have q within 0.6 of -8 in frame FD */
const onStripRear = (e) => { const a = FD.M(e.a[0], e.a[1]), b = FD.M(e.b[0], e.b[1]); return Math.abs(a.b - F.rear) < 0.9 && Math.abs(b.b - F.rear) < 0.9; };

function cinema(K) {
  const { P, M } = K;
  const { poly } = ringBox(K, 'w65623799', 9.5, M.cinema, 4, 9.5, onStripRear);
  // a slim cornice band at the top of the horseshoe wall
  const edges = ringEdges(poly);
  for (const e of edges) { if (onStripRear(e)) continue; onEdge(P, e, (len) => { P.box(M.cornice, 0, len, 9.0, 9.5, 0, 0.18, 'bk', 2); }); }
}

function annex(K) { ringBox(K, 'w65623790', 8.0, K.M.rear, 2.9, 3.7, null); }

/** the round glass-block stair tower: D 4.6, door section 2.5 m, six bands of glass blocks between stone belts, a solid pebbledash drum on top; at the north wall of the west arm [?] */
function armTower(K) {
  const { P, M } = K;
  FD.push(P);
  const r = -136.0, z = -(38.8), R = 2.3;
  tube(P, M.concrete, r, z, 0, 2.5, R + 0.05, R + 0.05, 14, 3, 1);
  let y = 2.5;
  for (let i = 0; i < 6; i++) {
    tube(P, M.glassBlock, r, z, y, y + 1.1, R, R, 14, 2, 1); y += 1.1;
    tube(P, M.concrete, r, z, y, y + 0.35, R + 0.08, R + 0.08, 14, 3, 0.2); y += 0.35;
  }
  tube(P, M.armWall, r, z, y, y + 1.6, R + 0.05, R + 0.05, 14, 3, 1, { capTop: M.roof });
  P.pop();
}

/** concrete cantilever balconies (1.8 x 0.9 m) under one row of the courtyard wall of the strip and two stair strips (tall narrow windows) */
function courtyardDetails(K) {
  const { P, M } = K;
  FD.push(P);
  const q = F.rear;
  for (const c of [-30.6, -27.8, -24.9, -22.0]) P.box(M.balcony, c - 0.9, c + 0.9, 11.9, 12.1, -q - 0.9, -q, 'f', 2);                       // four balconies on the rear of W1 (pitch 2.9 m)
  for (const [c, y1] of [[-41, 22.2], [33.5, 22.2], [8.0, 22.2]]) P.quad(M.rearTall, [c - 1.45, 0, -q - 0.03], [c + 1.45, 0, -q - 0.03], [c + 1.45, y1, -q - 0.03], [c - 1.45, y1, -q - 0.03], [0, 0, -1], [[0, 0], [1, 0], [1, y1 / 3.7], [0, y1 / 3.7]]);
  P.pop();
}

export function build(K) {
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKirova] dkrear/${name}:`, e); throw e; } };
  stage('cinema', () => cinema(K)); stage('annex', () => annex(K)); stage('armTower', () => armTower(K)); stage('courtyard', () => courtyardDetails(K));
}

export function colliders(K) {
  const { ctx } = K;
  for (const id of ['w65623799', 'w65623790']) { const p = polyOf(id); if (p) addPolyColliders(ctx, p, -0.3, 10, 0.9); }
  // the glass-block tower
  const p = FD.W(-136.0, 38.8); ctx.physics.addCylinder(p.x, p.z, 2.4, 0, 14);
  void L;
}
