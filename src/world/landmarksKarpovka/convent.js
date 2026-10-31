// landmarksKarpovka/convent.js - the Ioannovsky convent (N. N. Nikonov, 1900-08; nab. reki Karpovki 45; OSM r3274778) in the frame CV (frame.js: origin = the SW corner of the church, local +x = east
// along the south facade, +z = out toward the river).  Dossier docs/research/karpovka.md section 2, photos refs/karpovka 01 02 07 10 15 16 18 20.
// The church is the south block (31.6 x 16.4 m): west wing 0..13 m (five axes, four storeys over the socle storey, cornice 16.2 m, lean-to roof, the nave above it), a tower bay 13..18.9, the centre
// 18.9..25.6 with the three tall windows and the stepped gable (apex 23.7), a second tower bay, the two-tier apse at the east end.  Crowns: the main drum r 4.9 (22.6..29.2 m) with a helmet dome to
// 34.6 m (cross 39.6), four small drums r 2.7 on the tower bays (cross 31.3), the bell tower at the NW corner (square shaft to 22 m, octagonal belfry, cross 36.4), a sixth dome on the east wing.
// Striped brick = one tiled sheet (stripes follow y everywhere); windows = alpha sheets over it (art.js).  The west range, the east wing (red roof, chimneys) and the north clergy house are generic
// striped blocks on the OSM part rings.  The Holy Gate (pink wall, arch, gable with seven icons, gilded cupola), the pink walls (OSM w1109643209, w101406617) and the row of limes by the quay.
import * as THREE from 'three';
import * as L from '../layout.js';
import { BARRIERS } from '../data/city.js';
import * as G from './geo.js';
import { CV, pairs, planFence, rotOf } from './frame.js';
import { ringEdges } from './prism.js';
import { inflate, coverFn } from './surfaces.js';
import { plantTrees } from './trees.js';
import { addPolyColliders } from '../lib/massing.js';

const TAU = Math.PI * 2;
const X = { t0: 13.0, c0: 18.9, c1: 25.74, t1: 31.64, end: 31.64 };            // wing | tower bay | centre | tower bay (m along the south facade)
const Y = { socle: 4.0, wing: 16.2, tower: 20.0, gable: 19.8, apex: 23.7, nave: 19.2, ridge: 21.5 };
const ZT = 0.3, ZC = 0.55, DT = 5.9, DEPTH = 16.4, CXM = 22.32, CZM = -8.2;  // projections of the tower bays / the centre, depth of a tower bay, of the block; the main dome axis
const SMALL = [[15.95, -2.95], [28.69, -2.95], [15.95, -13.45], [28.69, -13.45]];
const BELL = [2.9, -19.4];
export const H = { main: 40.2, small: 31.7, bell: 35.6 };

const stripe = (P, M, u0, u1, y0, y1, z = 0) => G.wall(P, M.stripe, u0, u1, y0, y1, z, 1.28, 1.32);
const sheet = (P, mat, cx, y0, w, h, z) => G.pane(P, mat, cx - w / 2, cx + w / 2, y0, y0 + h, z);
/** socle storey + plinth + string course + striped field of a wall u0..u1 at depth z up to `top` */
function field(P, M, u0, u1, top, z = 0) {
  G.wall(P, M.socle, u0, u1, 0, Y.socle, z, 2.0, 1.0);
  P.box(M.granite, u0, u1, 0, 0.55, z, z + 0.07, 'kb');
  P.box(M.pink, u0, u1, Y.socle, Y.socle + 0.22, z, z + 0.1, 'k');
  stripe(P, M, u0, u1, Y.socle + 0.22, top, z);
}
/** cornice with a dentil arcature under it */
function cornice(P, M, u0, u1, y, z, d = 0.45, deep = false) {
  if (deep) G.wall(P, M.arcature, u0, u1, y - 1.55, y - 0.5, z + 0.04, 0.55, 1.05); else G.wall(P, M.arcature, u0, u1, y - 0.62, y - 0.22, z + 0.04, 0.3, 0.4);
  P.box(M.pink, u0 - 0.02, u1 + 0.02, y - 0.24, y, z, z + d * 0.6, 'k'); P.box(M.pinkD, u0 - 0.04, u1 + 0.04, y, y + 0.2, z, z + d, 'k');
}
const bays = (len, pitch, m = 1.2) => { const n = Math.max(1, Math.round((len - 2 * m) / pitch)), out = []; for (let i = 0; i < n; i++) out.push(m + (i + 0.5) * (len - 2 * m) / n); return out; };

// ------------------------------------------------------------------------------------------------ domes
const domeCache = new Map();
/** ribbed helmet dome: profile [[r, y]..] (unit radius / height), `ribs` standing-seam ribs (uv u across one rib) */
function ribDome(ribs, nu = 2, bulge = 0.02) {
  const key = ribs + '|' + nu; if (domeCache.has(key)) return domeCache.get(key);
  const prof = [[1.0, 0], [1.02, 0.07], [1.0, 0.22], [0.94, 0.4], [0.83, 0.58], [0.67, 0.74], [0.47, 0.87], [0.25, 0.96], [0.08, 1.01], [0.0, 1.03]];
  const nv = prof.length, pos = [], uv = [], idx = [];
  for (let k = 0; k < ribs; k++) {
    const base = pos.length / 3;
    for (let i = 0; i < nv; i++) for (let j = 0; j <= nu; j++) {
      const f = j / nu, th = (k + f) * TAU / ribs, r = prof[i][0] * (1 + bulge * Math.sin(Math.PI * f) * Math.min(1, prof[i][0] * 3));
      pos.push(Math.sin(th) * r, prof[i][1], Math.cos(th) * r); uv.push(f, prof[i][1] * 3);
    }
    for (let i = 0; i < nv - 1; i++) for (let j = 0; j < nu; j++) { const a = base + i * (nu + 1) + j, b = a + 1, c = a + (nu + 1), d = c + 1; idx.push(a, b, c, b, d, c); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  domeCache.set(key, g); return g;
}
/** gilded base, ball and cross of a dome (arms across the church axis); s = size (1 = the main dome) */
function crown(P, M, x, y, z, s) {
  P.col(M.gold, x, z, y - 0.15 * s, y + 0.55 * s, 0.5 * s, 0.16 * s, 10, false);
  G.ball(P, M.gold, x, y + 0.8 * s, z, 0.3 * s, 10);
  P.col(M.gold, x, z, y + 1.05 * s, y + 1.45 * s, 0.06 * s, 0.05 * s, 6, false);
  G.cross(P, M.gold, x, y + 1.4 * s, z, 3.2 * s, Math.PI / 2);
}
/** a round drum with `n` window bays, the scalloped cornice, the helmet dome and its crown; returns the top of the cross */
function drumDome(P, M, x, z, y0, y1, r, n, o = {}) {
  G.tube(P, M.pink, x, z, y0 - 0.45, y0, r + 0.22, r + 0.12, n * 2, 1, 1);
  G.tube(P, o.bay || M.drumBay, x, z, y0, y1, r, r, n * 2, n, 1);
  const sc = Math.max(8, Math.round(TAU * r / 0.75));
  G.tube(P, M.scallop, x, z, y1, y1 + 0.8, r + 0.04, r + 0.34, n * 2, sc, 1);
  G.tube(P, M.pinkD, x, z, y1 + 0.8, y1 + 1.0, r + 0.4, r + 0.3, n * 2, 1, 1, { capTop: M.domeFlat });
  const rd = r + 0.26, hd = rd * (o.hk ?? 1.02);
  P.geo(M.dome, ribDome(o.ribs || n * 2), x, y1 + 1.0, z, 0, 0, 0, rd, hd, rd);
  const s = o.s ?? r / 4.9;
  crown(P, M, x, y1 + 1.0 + hd * 1.03, z, s);
  return y1 + 1.0 + hd * 1.03 + 4.6 * s;
}

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKarpovka] convent/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  P.push(CV.x, 0, CV.z, CV.rot);
  stage('south', () => southFront(P, M));
  stage('body', () => body(P, M));
  stage('apse', () => apse(P, M));
  stage('crowns', () => crowns(P, M));
  stage('belltower', () => bellTower(P, M));
  P.pop();
  stage('ranges', () => ranges(K));
  stage('gate', () => gateAndWalls(K));
  stage('limes', () => limes(K));
  stage('colliders', () => {
    const rec = L.buildingById('r3274778');
    if (rec) for (const poly of rec.polys) addPolyColliders(ctx, poly, 0, 22, 1.0);
    CV.cyl(ctx.physics, CXM, CZM, 5.0, 20, 36); CV.box(ctx.physics, BELL[0], BELL[1], 5.8, 5.8, 0, 34);
  });
  const c = CV.W(CXM, CZM), door = CV.W(11.2, 1.2), vault = CV.W(32.6, 1.6);
  K.svc.convent = { centre: [c.x, c.z], top: H.main, bell: [CV.W(BELL[0], BELL[1]).x, CV.W(BELL[0], BELL[1]).z] };
  K.svc.monuments.push({ id: 'r3274778', name: 'Иоанновский монастырь на Карповке', x: c.x, z: c.z, h: H.main });
  K.svc.entrances.push({ x: door.x, z: door.z, rotY: CV.rot, kind: 'church', bldg: 'r3274778', name: 'Иоанновский монастырь' }, { x: vault.x, z: vault.z, rotY: CV.rot, kind: 'church', bldg: 'r3274778', name: 'Усыпальница св. Иоанна Кронштадтского' });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the south front (drawn directly in CV: u = x, out = +z)
function southFront(P, M) {
  // ---- west wing: two sub-bays (three + two axes), the portal in the second
  field(P, M, 0, X.t0, Y.wing, 0);
  const ax = [1.9, 4.45, 7.0, 9.9, 12.0];
  for (const u of ax) { sheet(P, M.winArch, u, 4.75, 1.7, 3.4, 0.04); sheet(P, M.winArch, u, 9.55, 1.75, 3.5, 0.04); }
  for (const u of [1.3, 3.2, 4.5, 6.4, 7.7, 9.6, 10.9, 12.2]) sheet(P, M.winSmall, u, 13.42, 1.1, 1.85, 0.04);
  G.wall(P, M.panelFrieze, 0.5, X.t0, 8.55, 9.15, 0.03, 1.3, 0.62); P.box(M.pink, 0, X.t0, 13.12, 13.3, 0, 0.09, 'k');
  for (const [u0, u1] of [[0, 0.5], [8.2, 8.7]]) P.box(M.stripe, u0, u1, Y.socle + 0.22, Y.wing - 0.24, 0, 0.12, 'kb', 1.32);
  cornice(P, M, 0, X.t0, Y.wing, 0);
  for (const u of [1.9, 4.45, 7.0]) sheet(P, M.socleWin, u, 1.15, 1.2, 2.1, 0.03);
  sheet(P, M.portal, 10.95, 0.02, 3.0, 4.0, 0.09);
  P.box(M.granite, 9.7, 12.2, 0, 0.16, 0, 1.3, 'kb'); P.box(M.granite, 9.9, 12.0, 0.16, 0.3, 0, 0.9, 'kb');
  // the metal hood over the portal (a curved sheet on two brackets)
  for (let i = 0; i < 8; i++) { const a0 = (22 + i * 17) * Math.PI / 180, a1 = (22 + (i + 1) * 17) * Math.PI / 180, r = 1.75, cx = 10.95, cy = 2.75, am = (a0 + a1) / 2;
    const p = (a, rr) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    P.quad(M.hood, [...p(a0, r), 0.08], [...p(a1, r), 0.08], [...p(a1, r), 1.15], [...p(a0, r), 1.15], [Math.cos(am), Math.sin(am), 0]);
    P.quad(M.hood, [...p(a0, r - 0.06), 0.08], [...p(a1, r - 0.06), 0.08], [...p(a1, r - 0.06), 1.15], [...p(a0, r - 0.06), 1.15], [-Math.cos(am), -Math.sin(am), 0]);
    P.quad(M.hood, [...p(a0, r - 0.06), 1.15], [...p(a1, r - 0.06), 1.15], [...p(a1, r), 1.15], [...p(a0, r), 1.15], [0, 0, 1]); }
  // drainpipes (they articulate the front on every photograph)
  for (const [u, z, top] of [[8.45, 0.12, 16.0], [12.82, 0.1, 16.0], [19.08, ZC + 0.1, 19.6], [25.56, ZC + 0.1, 19.6], [31.46, ZT + 0.1, 19.6], [0.18, 0.1, 16.0]]) { P.col(M.pipe, u, z, 0.25, top, 0.085, 0.085, 6, false); P.box(M.pipe, u - 0.16, u + 0.16, top, top + 0.3, z - 0.12, z + 0.2, 'b'); }
  // the lean-to roof of the wing up to the nave wall
  P.quad(M.roof, [-0.3, Y.wing + 0.2, 0.45], [X.t0, Y.wing + 0.2, 0.45], [X.t0, 18.4, -DT], [-0.3, 18.4, -DT], [0, 0.93, 0.36], [[0, 0], [X.t0 / 0.6, 0], [X.t0 / 0.6, 4], [0, 4]]);
  // ---- tower bays
  for (const [u0, u1] of [[X.t0, X.c0], [X.c1, X.t1]]) {
    const c = (u0 + u1) / 2;
    G.tbox(P, M.socle, u0, u1, 0, Y.socle, -DT, ZT, 2.0, 1.0, 'kbt');
    P.box(M.granite, u0 - 0.05, u1 + 0.05, 0, 0.55, ZT, ZT + 0.07, 'kb'); P.box(M.pink, u0 - 0.06, u1 + 0.06, Y.socle, Y.socle + 0.22, -DT, ZT + 0.1, 'kb');
    P.box(M.stripe, u0, u1, Y.socle + 0.22, Y.tower, -DT, ZT, 'kbt', 1.32);
    for (const u of [u0, u1 - 0.45]) P.box(M.stripe, u, u + 0.45, Y.socle + 0.22, Y.tower - 1.6, ZT, ZT + 0.12, 'kb', 1.32);
    for (const du of [-1.15, 1.15]) sheet(P, M.socleWin, c + du, 1.15, 1.1, 2.1, ZT + 0.03);
    sheet(P, M.winPair, c, 4.7, 3.7, 3.6, ZT + 0.04);
    G.wall(P, M.panelFrieze, u0 + 0.5, u1 - 0.5, 8.55, 9.15, ZT + 0.03, 1.3, 0.62);
    sheet(P, M.biforium, c, 9.45, 4.5, 6.85, ZT + 0.04);
    G.wall(P, M.crossFrieze, u0 + 0.5, u1 - 0.5, 16.75, 17.6, ZT + 0.03, 1.2, 0.85);
    cornice(P, M, u0, u1, Y.tower, ZT, 0.5, true);
    // side cornices of the tower above the neighbours' roofs
    G.onFace(P, u0, -DT, -1, 0, () => { cornice(P, M, 0, DT + ZT, Y.tower, 0, 0.5, true); });
    G.onFace(P, u1, ZT, 1, 0, () => { cornice(P, M, 0, DT + ZT, Y.tower, 0, 0.5, true); });
  }
  // ---- the centre: three windows, the three tall windows of the upper church, the roundel, the stepped gable
  const c = (X.c0 + X.c1) / 2;
  G.tbox(P, M.socle, X.c0, X.c1, 0, Y.socle, 0, ZC, 2.0, 1.0, 'kbt');
  P.box(M.granite, X.c0 - 0.05, X.c1 + 0.05, 0, 0.55, ZC, ZC + 0.07, 'kb'); P.box(M.pink, X.c0, X.c1, Y.socle, Y.socle + 0.22, 0, ZC + 0.1, 'kb');
  P.box(M.stripe, X.c0, X.c1, Y.socle + 0.22, Y.gable, 0, ZC, 'kbt', 1.32);
  for (const du of [-2.15, 0, 2.15]) sheet(P, M.winArch, c + du, 4.75, 1.7, 3.4, ZC + 0.04);
  for (const du of [-2.3, -0.2]) sheet(P, M.socleWin, c + du, 1.15, 1.1, 2.1, ZC + 0.03);
  sheet(P, M.mosaic, c + 2.0, 0.85, 1.15, 2.95, ZC + 0.03);
  P.box(M.pinkD, c + 1.33, c + 2.67, 0.72, 0.85, ZC, ZC + 0.14, 'k');
  sheet(P, M.text('ЗДЕСЬ ПОКОЯТСЯ МОЩИ\nСВЯТОГО ПРАВЕДНОГО\nИОАННА КРОНШТАДТСКОГО', { bg: '#3a2c28', fg: '#e4c26a', rim: '#c9a24b', w: 256, h: 128 }), c + 0.95, 1.5, 0.74, 0.37, ZC + 0.03);
  G.wall(P, M.panelFrieze, X.c0 + 0.2, X.c1 - 0.2, 8.55, 9.15, ZC + 0.03, 1.3, 0.62);
  sheet(P, M.tall3, c, 9.4, 6.5, 8.2, ZC + 0.04);
  for (const du of [-2.84, -0.94, 0.94, 2.84]) P.col(M.pinkD, c + du, ZC + 0.1, 9.72, 14.9, 0.11, 0.11, 8, false);
  sheet(P, M.roundel, c, 18.2, 1.15, 1.15, ZC + 0.04);
  const g0 = X.c0 - 0.25, g1 = X.c1 + 0.25, tri = [[g0, Y.gable], [g1, Y.gable], [c, Y.apex]];
  G.solid(P, M.stripe, tri, -DT, DT + ZC - 0.02, 1.32);
  G.planeShape(P, M.gable, tri, ZC + 0.02);
  const chev = [[g0 - 0.35, Y.gable - 0.2], [g0, Y.gable - 0.2], [c, Y.apex], [g1, Y.gable - 0.2], [g1 + 0.35, Y.gable - 0.2], [c, Y.apex + 0.42]];
  G.solid(P, M.domeFlat, chev, -DT, DT + ZC - 0.3, 1.3); G.solid(P, M.pink, chev, ZC - 0.3, 0.7, 1.3);
  P.box(M.pinkD, X.c0, X.c1, Y.gable - 0.25, Y.gable, ZC, ZC + 0.3, 'k');
  P.box(M.pink, c - 0.3, c + 0.3, Y.apex + 0.3, Y.apex + 0.75, ZC - 0.25, ZC + 0.35, 'b');
  G.cross(P, M.cream, c, Y.apex + 0.75, ZC + 0.05, 1.5, 0);
}

// ------------------------------------------------------------------------------------------------ the rest of the church block: west face, nave, north side, east gable, roofs, podium
function body(P, M) {
  const c = (X.c0 + X.c1) / 2, N0 = -DT, N1 = -(DEPTH - DT);                                   // nave walls
  // west face (seen from the west: left = the north end)
  G.onFace(P, 0, -DEPTH, -1, 0, () => {
    field(P, M, 0, DEPTH, Y.wing, 0);
    for (const u of [2.2, 14.2]) { sheet(P, M.winArch, u, 4.75, 1.7, 3.4, 0.04); sheet(P, M.winArch, u, 9.55, 1.75, 3.5, 0.04); sheet(P, M.winSmall, u, 13.42, 1.1, 1.85, 0.04); }
    for (const u of [6.3, 8.2, 10.1]) { sheet(P, M.winArch, u, 4.75, 1.6, 3.4, 0.04); sheet(P, M.winArch, u, 10.2, 1.7, 6.0, 0.04); }
    G.wall(P, M.panelFrieze, 0.5, DEPTH - 0.5, 8.55, 9.15, 0.03, 1.3, 0.62);
    cornice(P, M, 0, DT, Y.wing, 0); cornice(P, M, DEPTH - DT, DEPTH, Y.wing, 0);
    const suv = (p) => [p[0] / 1.28, p[1] / 1.32];
    P.fan(M.stripe, [[DEPTH - DT, Y.wing, 0], [DEPTH, Y.wing, 0], [DEPTH - DT, 18.4, 0]], [0, 0, 1], suv); P.fan(M.stripe, [[0, Y.wing, 0], [DT, Y.wing, 0], [DT, 18.4, 0]], [0, 0, 1], suv);
    // the nave gable between the aisles
    stripe(P, M, DT, DEPTH - DT, Y.wing, Y.nave);
    const tri = [[DT - 0.2, Y.nave], [DEPTH - DT + 0.2, Y.nave], [DEPTH / 2, Y.ridge + 0.6]];
    G.solid(P, M.stripe, tri, -1.0, 1.0, 1.32);
    for (const [du, hh] of [[-1.5, 1.2], [0, 1.9], [1.5, 1.2]]) G.pane(P, M.winSmall, DEPTH / 2 + du - 0.45, DEPTH / 2 + du + 0.45, Y.nave - 0.9, Y.nave - 0.9 + hh, 0.04);
    G.solid(P, M.pink, [[DT - 0.55, Y.nave - 0.2], [DT - 0.2, Y.nave - 0.2], [DEPTH / 2, Y.ridge + 0.6], [DEPTH - DT + 0.2, Y.nave - 0.2], [DEPTH - DT + 0.55, Y.nave - 0.2], [DEPTH / 2, Y.ridge + 1.0]], -1.0, 1.35, 1.3);
    G.cross(P, M.cream, DEPTH / 2, Y.ridge + 1.0, 0.1, 1.3, 0);
  });
  // nave: clerestory walls above the lean-to roofs, the gable roof (ridge along x) running into the podium
  const xe = CXM - 4.0;
  G.onFace(P, 0, N0, 0, 1, () => stripe(P, M, 0, X.t0, 18.2, Y.nave));
  G.onFace(P, X.t0, N1, 0, -1, () => stripe(P, M, 0, X.t0, 18.2, Y.nave));
  const uvr = (l, d) => [[0, 0], [l / 0.6, 0], [l / 0.6, d], [0, d]];
  P.quad(M.roof, [-0.35, Y.nave, N0 + 0.35], [xe, Y.nave, N0 + 0.35], [xe, Y.ridge, CZM], [-0.35, Y.ridge, CZM], [0, 0.8, 0.6], uvr(xe, 4));
  P.quad(M.roof, [xe, Y.nave, N1 - 0.35], [-0.35, Y.nave, N1 - 0.35], [-0.35, Y.ridge, CZM], [xe, Y.ridge, CZM], [0, 0.8, -0.6], uvr(xe, 4));
  // north lean-to and the north wall of the church toward the light court
  P.quad(M.roof, [X.t0, Y.wing + 0.2, -DEPTH - 0.3], [-0.3, Y.wing + 0.2, -DEPTH - 0.3], [-0.3, 18.4, N1], [X.t0, 18.4, N1], [0, 0.93, -0.36], uvr(X.t0, 4));
  G.onFace(P, X.end, -DEPTH, 0, -1, () => { stripe(P, M, 0, X.end - X.t0, 0, Y.tower); cornice(P, M, 0, X.end - X.t0, Y.tower, 0, 0.5, true); for (const u of [3, 9.3, 15.6]) { sheet(P, M.winArch, u, 4.75, 1.7, 3.4, 0.04); sheet(P, M.winArch, u, 9.55, 1.75, 3.5, 0.04); } });
  // the back tower bays (their outer faces) and the flat roofs
  for (const [u0, u1] of [[X.t0, X.c0], [X.c1, X.t1]]) { P.box(M.stripe, u0, u1, Y.wing, Y.tower, -DEPTH, -DEPTH + DT, 'fkbt', 1.32); G.onFace(P, u0, -DEPTH, -1, 0, () => cornice(P, M, 0, DT, Y.tower, 0, 0.5, true)); G.onFace(P, u1, -DEPTH + DT, 1, 0, () => cornice(P, M, 0, DT, Y.tower, 0, 0.5, true)); }
  P.cap(M.roof, [[X.t0, -DEPTH], [X.end, -DEPTH], [X.end, ZT], [X.t0, ZT]], Y.tower + 0.225, true, 0.6);
  // north arm gable (mirror of the south one, plain) and the east arm above the apse
  G.onFace(P, X.c1 + 0.25, -DEPTH, 0, -1, () => { const w = X.c1 - X.c0 + 0.5, tri = [[0, Y.gable], [w, Y.gable], [w / 2, Y.apex]]; G.solid(P, M.stripe, tri, -DT, DT - 0.02, 1.32); G.solid(P, M.pink, [[-0.35, Y.gable - 0.2], [0, Y.gable - 0.2], [w / 2, Y.apex], [w, Y.gable - 0.2], [w + 0.35, Y.gable - 0.2], [w / 2, Y.apex + 0.42]], -DT, DT + 0.4, 1.3); });
  G.onFace(P, X.end, -DT + 0.25, 1, 0, () => {
    const w = DEPTH - 2 * DT + 0.5, tri = [[0, Y.gable], [w, Y.gable], [w / 2, Y.apex - 0.4]];
    stripe(P, M, 0.25, w - 0.25, 0, Y.gable); G.solid(P, M.stripe, tri, -DT, DT - 0.02, 1.32);
    G.solid(P, M.pink, [[-0.35, Y.gable - 0.2], [0, Y.gable - 0.2], [w / 2, Y.apex - 0.4], [w, Y.gable - 0.2], [w + 0.35, Y.gable - 0.2], [w / 2, Y.apex]], -DT, DT + 0.4, 1.3);
    G.cross(P, M.cream, w / 2, Y.apex, 0.1, 1.3, 0);
  });
  // east faces of the two east tower bays beside the apse
  G.onFace(P, X.end, ZT, 1, 0, () => { field(P, M, 0, DT + ZT, Y.tower, 0); sheet(P, M.winArch, 2.6, 4.75, 1.7, 3.4, 0.04); sheet(P, M.winArch, 2.6, 9.55, 1.75, 3.5, 0.04); });
  G.onFace(P, X.end, -DEPTH + DT, 1, 0, () => { field(P, M, 0, DT, Y.tower, 0); });
  // the podium of the main drum
  G.tbox(P, M.stripe, CXM - 5.1, CXM + 5.1, Y.tower, 22.6, CZM - 5.1, CZM + 5.1, 1.28, 1.32, 'bt');
  P.cap(M.roof, [[CXM - 5.1, CZM - 5.1], [CXM + 5.1, CZM - 5.1], [CXM + 5.1, CZM + 5.1], [CXM - 5.1, CZM + 5.1]], 22.6, true, 0.6);
  void c;
}

// ------------------------------------------------------------------------------------------------ the apse: two elliptical tiers with half-cone roofs
function apse(P, M) {
  const cx = X.end, cz = CZM;
  const tier = (a, b, y0, y1, n, wins, socle) => {
    const pt = (i) => { const t = -Math.PI / 2 + i * Math.PI / n; return [cx + Math.cos(t) * a, cz - Math.sin(t) * b]; };       // i = 0: the south end, n: the north end
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const p = pt(i), q = pt(i + 1), len = Math.hypot(q[0] - p[0], q[1] - p[1]), nx = -(q[1] - p[1]) / len, nz = (q[0] - p[0]) / len, sg = nx * (p[0] + q[0] - 2 * cx) + nz * (p[1] + q[1] - 2 * cz) < 0 ? -1 : 1;
      const nn = [nx * sg, 0, nz * sg], u0 = acc / 1.28, u1 = (acc + len) / 1.28;
      const band = (mat, ya, yb, tv) => P.quad(mat, [p[0], ya, p[1]], [q[0], ya, q[1]], [q[0], yb, q[1]], [p[0], yb, p[1]], nn, [[u0, ya / tv], [u1, ya / tv], [u1, yb / tv], [u0, yb / tv]]);
      if (socle) { band(M.socle, y0, Y.socle, 1.0); band(M.stripe, Y.socle, y1, 1.32); } else band(M.stripe, y0, y1, 1.32);
      band(M.pinkD, y1, y1 + 0.3, 1.3);
      if (wins && i % 2 === 1) {
        const mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2;
        P.push(mx, 0, mz, Math.atan2(nn[0], nn[2]));
        for (const [mat, yy, ww, hh] of wins) sheet(P, mat, 0, yy, ww, hh, 0.05);
        P.pop();
      }
      // the roof: a fan to the apex on the wall
      P.fan(M.roof, [[p[0] + nn[0] * 0.3, y1 + 0.3, p[1] + nn[2] * 0.3], [q[0] + nn[0] * 0.3, y1 + 0.3, q[1] + nn[2] * 0.3], [cx, y1 + 0.3 + a * 0.42, cz]], [nn[0] * 0.5, 0.86, nn[2] * 0.5], () => [0.5, 0.5]);
      acc += len;
    }
  };
  tier(5.6, 7.7, 0, 10.4, 12, [[M.socleWin, 1.15, 1.0, 2.0], [M.winArch, 4.75, 1.5, 3.3]], true);
  tier(4.1, 5.3, 10.4, 17.2, 10, [[M.winArch, 11.6, 1.5, 3.8]], false);
}

// ------------------------------------------------------------------------------------------------ crowns
function crowns(P, M) {
  drumDome(P, M, CXM, CZM, 22.6, 29.2, 4.9, 12, { ribs: 28 });
  for (const [x, z] of SMALL) {
    P.box(M.pink, x - 2.9, x + 2.9, Y.tower + 0.225, 20.75, z - 2.9, z + 2.9, 'b');
    drumDome(P, M, x, z, 20.75, 25.1, 2.7, 8, { ribs: 16 });
  }
}

function bellTower(P, M) {
  const [x, z] = BELL, h = 2.9, T = 22.0;
  G.tbox(P, M.socle, x - h, x + h, 0, Y.socle, z - h, z + h, 2.0, 1.0, 'bt');
  G.tbox(P, M.stripe, x - h, x + h, Y.socle, T, z - h, z + h, 1.28, 1.32, 'bt');
  for (const [nx, nz] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
    P.push(x + nx * h, 0, z + nz * h, Math.atan2(nx, nz));
    for (const y of [4.75, 9.55]) sheet(P, M.winArch, 0, y, 1.6, 3.4, 0.04);
    sheet(P, M.winArch, 0, 16.6, 1.7, 3.8, 0.04);
    G.wall(P, M.arcature, -h, h, T - 1.55, T - 0.5, 0.04, 0.55, 1.05);
    P.box(M.pinkD, -h - 0.3, h + 0.3, T - 0.3, T, 0, 0.4, 'k');
    P.pop();
  }
  P.cap(M.roof, [[x - h - 0.3, z - h - 0.3], [x + h + 0.3, z - h - 0.3], [x + h + 0.3, z + h + 0.3], [x - h - 0.3, z + h + 0.3]], T, true, 0.6);
  // the octagonal belfry, its cornice, dome and cross
  const R8 = 3.1, y0 = T, y1 = 28.4;
  G.frustum(P, M.belfryBay, x, z, y0, y1, 8, R8, R8, Math.PI / 8, 1, 1);
  G.tube(P, M.scallop, x, z, y1, y1 + 0.8, R8 * 0.94, R8 * 0.94 + 0.3, 16, 24, 1);
  G.tube(P, M.pinkD, x, z, y1 + 0.8, y1 + 1.0, R8 * 0.94 + 0.36, R8 * 0.94 + 0.26, 16, 1, 1, { capTop: M.domeFlat });
  const rd = R8 * 0.94 + 0.22;
  P.geo(M.dome, ribDome(16), x, y1 + 1.0, z, 0, 0, 0, rd, rd * 1.02, rd);
  crown(P, M, x, y1 + 1.0 + rd * 1.05, z, 0.62);
}

// ------------------------------------------------------------------------------------------------ the west range, the east wing, the north house (generic striped blocks on the OSM part rings)
/** hipped roof: the ring at y rises to an inset ring at y + rise */
function hipRoof(P, mat, ring, y, inset, rise) {
  const inner = inflate(ring, -inset), n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], c = inner[(i + 1) % n], d = inner[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    P.quad(mat, [a[0], y, a[1]], [b[0], y, b[1]], [c[0], y + rise, c[1]], [d[0], y + rise, d[1]], [0, 1, 0], [[0, 0], [l / 0.6, 0], [l / 0.6, 3], [0, 3]]);
  }
  P.cap(mat, inner, y + rise, true, 0.6);
}
function clipRing(ring, f) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], fa = f(a), fb = f(b);
    if (fa <= 0) out.push(a);
    if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
function block(K, ring, o) {
  const P = K.P, M = K.M, top = o.top, floors = o.floors;
  for (const e of ringEdges(ring, 0.3)) {
    if (o.skip && o.skip(e)) continue;
    G.onFace(P, e.o[0], e.o[1], e.n[0], e.n[1], () => {
      field(P, M, 0, e.len, top, 0);
      if (e.len > 3.2) for (const u of bays(e.len, o.pitch || 2.9)) { for (const [mat, y, w, h] of floors) sheet(P, mat, u, y, w, h, 0.04); sheet(P, M.socleWin, u, 1.15, 1.1, 2.1, 0.03); }
      cornice(P, M, 0, e.len, top, 0, 0.4);
    });
  }
  hipRoof(P, o.roof, inflate(ring, 0.42), top + 0.225, o.inset ?? 4.5, o.rise ?? 2.4);
}
function ranges(K) {
  const P = K.P, M = K.M;
  const F4 = [[M.winArch, 4.75, 1.6, 3.3], [M.winArch, 9.55, 1.6, 3.3], [M.winSmall, 13.42, 1.1, 1.85]];
  const F3 = [[M.winArch, 4.75, 1.6, 3.3], [M.winArch, 9.3, 1.6, 3.2]];
  const F5 = [[M.winArch, 4.6, 1.5, 3.0], [M.winArch, 8.3, 1.5, 3.0], [M.winArch, 12.0, 1.5, 3.0], [M.winSmall, 15.6, 1.1, 1.85]];
  const mxOf = (p) => CV.M(p[0], p[1]).mx, mzOf = (p) => CV.M(p[0], p[1]).mz;
  const onChurch = (e) => Math.abs(mzOf(e.a) + DEPTH) < 0.6 && Math.abs(mzOf(e.b) + DEPTH) < 0.6;       // the shared wall with the church
  const rec = L.buildingById('r6875903');
  if (rec) {
    const ring = pairs(rec.polys[0].o);
    const west = clipRing(ring, (p) => mxOf(p) - 27), east = clipRing(ring, (p) => 27 - mxOf(p));
    const onCut = (e) => Math.abs(mxOf(e.a) - 27) < 0.3 && Math.abs(mxOf(e.b) - 27) < 0.3;
    if (west.length > 2) block(K, west, { top: Y.wing, floors: F4, roof: M.roof, skip: onChurch, inset: 3.0, rise: 1.9 });
    if (east.length > 2) {
      block(K, east, { top: 14.6, floors: F3, roof: M.roofRed, skip: (e) => onChurch(e) || onCut(e), inset: 3.5, rise: 2.2 });
      // chimneys of the east wing and the sixth dome on its rounded SE corner
      P.push(CV.x, 0, CV.z, CV.rot);
      for (const [x, z] of [[33, -27], [38, -29], [43, -31], [46, -37], [36, -40], [41, -42]]) { P.box(M.chimney, x - 0.5, x + 0.5, 15.6, 19.2, z - 0.4, z + 0.4, 'b'); P.box(M.pinkD, x - 0.6, x + 0.6, 19.2, 19.4, z - 0.5, z + 0.5, 'b'); }
      G.tube(P, M.stripe, 43.4, -23.6, 14.8, 16.3, 2.7, 2.7, 16, 13, 1.2);
      drumDome(P, M, 43.4, -23.6, 16.3, 18.6, 2.5, 8, { ribs: 16, s: 0.5 });
      P.pop();
    }
  }
  const north = L.buildingById('r3274779');
  if (north) block(K, pairs(north.polys[0].o), { top: 19.2, floors: F5, roof: M.roof, inset: 4, rise: 2.2 });
}

// ------------------------------------------------------------------------------------------------ the Holy Gate and the pink walls
function gateAndWalls(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics, cover = coverFn(ctx);
  const byId = new Map(BARRIERS.map((b) => [b.id, b]));
  const wallRun = (pts, gates, h) => {
    const plan = planFence(pts, 5.2, gates, 0.0);
    for (const q of plan.panels) {
      const mx = (q.a.x + q.b.x) / 2, mz = (q.a.z + q.b.z) / 2;
      if (cover(mx, mz) > -0.5 || cover(q.a.x, q.a.z) > -0.5 || cover(q.b.x, q.b.z) > -0.5) continue;                      // never on a carriageway
      P.push(q.a.x, 0, q.a.z, q.rot);
      P.box(M.pinkWallD, 0, q.len, 0, 0.5, -0.3, 0.3, 'b'); P.box(M.pinkWall, 0, q.len, 0.5, h, -0.24, 0.24, 'b'); P.box(M.pinkWallD, -0.02, q.len + 0.02, h, h + 0.16, -0.32, 0.32, 'b');
      P.box(M.pinkWall, 0.5, q.len - 0.5, 1.0, h - 0.5, 0.24, 0.3, 'kb'); P.box(M.pinkWall, 0.5, q.len - 0.5, 1.0, h - 0.5, -0.3, -0.24, 'fb');
      P.pop();
      ph.addBox(mx, mz, q.len, 0.6, q.rot, 0, h + 0.2);
    }
    for (const p of plan.posts) { if (cover(p.x, p.z) > -0.5) continue; P.push(p.x, 0, p.z, p.rot); P.box(M.pinkWallD, -0.36, 0.36, 0, h + 0.3, -0.36, 0.36, 'b'); G.frustum(P, M.pinkWallD, 0, 0, h + 0.3, h + 0.6, 4, 0.55, 0.12, Math.PI / 4, 1, 1); P.pop(); }
    return plan;
  };
  // ---- the Holy Gate at the gate node of w1109643209 (east of the apse), facing the river
  const east = byId.get('w1109643209');
  if (east) {
    const pts = pairs(east.pts), gx = -2828.4, gz = -4240.7, a = pts[1], b = pts[2], rot = rotOf(a, b), W = 4.2;
    // outward (river side) = local +z of the gate frame
    P.push(gx, 0, gz, rot);
    const yS = 1.9, R = 1.75, top = 4.0, apex = 6.3, n = 10;
    const arch = [[R, 0], [R, yS]]; for (let i = 1; i < n; i++) { const t = Math.PI * i / n; arch.push([Math.cos(t) * R, yS + Math.sin(t) * R]); } arch.push([-R, yS], [-R, 0]);
    const body = [[-W, 0], [-R, 0], ...arch.slice().reverse().slice(1, -1), [R, 0], [W, 0], [W, top], [0, apex], [-W, top]];
    G.solid(P, M.pinkWall, body, -0.45, 0.9, 2);
    G.solid(P, M.pinkWallD, [[-W - 0.3, top - 0.1], [-W, top - 0.1], [0, apex], [W, top - 0.1], [W + 0.3, top - 0.1], [0, apex + 0.35]], -0.6, 1.2, 2);
    P.box(M.pinkWallD, -W, W, 3.55, 3.75, 0.45, 0.6, 'k');
    // icons: five in the stepped row of the gable, two on the piers
    const IC = [[-2.1, 3.85, 0.8, 1.15, 1], [-1.05, 3.95, 0.9, 1.5, 2], [0, 4.05, 0.95, 1.95, 3], [1.05, 3.95, 0.9, 1.5, 4], [2.1, 3.85, 0.8, 1.15, 5], [-3.15, 1.3, 0.85, 2.1, 0], [3.15, 1.3, 0.85, 2.1, 6]];
    for (const [x, y, w, h, k] of IC) G.pane(P, M.icons, x - w / 2, x + w / 2, y, y + h, 0.49, [[k / 7, 0], [(k + 1) / 7, 0], [(k + 1) / 7, 1], [k / 7, 1]]);
    G.pane(P, M.gateLeaf, -R, R, 0, yS + R, -0.1);
    // the gilded cupola with a cross
    P.col(M.pinkWallD, 0, 0, apex + 0.2, apex + 0.55, 0.3, 0.3, 8, true); G.onion(P, M.gold, 0, apex + 0.55, 0, 0.3, 1, 12, 10); G.cross(P, M.gold, 0, apex + 1.25, 0, 0.9, 0);
    P.pop();
    const ux = Math.cos(rot), uz = -Math.sin(rot);
    for (const s of [-1, 1]) ph.addBox(gx + ux * s * (R + (W - R) / 2), gz + uz * s * (R + (W - R) / 2), W - R, 0.9, rot, 0, 6);
    ph.addBox(gx, gz, 2 * R, 0.3, rot, 0, 4);
    // the wall east of the gate and along Ioannovsky pereulok
    const g1 = [gx + ux * W, gz + uz * W];
    wallRun([g1, ...pts.slice(2)], [], 3.2);
    K.svc.fences.push({ id: 'w1109643209', pts, h: 3.2, kind: 'wall' });
    K.svc.photoSpots.push({ x: gx + Math.sin(rot) * 7, z: gz + Math.cos(rot) * 7, yaw: L.yawToward(gx + Math.sin(rot) * 7, gz + Math.cos(rot) * 7, gx, gz), pitch: 10, name: 'Святые ворота Иоанновского монастыря' });
  }
  // ---- the short wall with the yard gate at the SW corner
  const sw = byId.get('w101406617');
  if (sw) { wallRun(pairs(sw.pts), [{ x: -2864.3, z: -4225.7, half: 2.4 }], 3.0); K.svc.fences.push({ id: 'w101406617', pts: pairs(sw.pts), h: 3.0, kind: 'wall' }); }
}

// ------------------------------------------------------------------------------------------------ the limes between the drive and the quay
function limes(K) {
  const cover = coverFn(K.ctx), list = [], rng = K.ctx.rng(4545);
  for (let i = 0; i < 8; i++) {
    const p = CV.W(-2 + i * 6.0, 11.8);
    if (cover(p.x, p.z) > -0.8 || L.inRiver(p.x, p.z) || L.insideBuilding(p.x, p.z, 1)) continue;
    list.push({ x: p.x, z: p.z, fam: 'limeY', s: 0.86 + rng() * 0.12, yaw: rng() * 6.28 });
  }
  if (list.length) plantTrees(K, list, 'lmKarp-limes');
  K.svc.trees.push(...list.map((t) => ({ x: t.x, z: t.z, r: 1.8, h: 5.5 })));
}
