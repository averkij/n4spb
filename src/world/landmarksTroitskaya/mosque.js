// landmarksTroitskaya/mosque.js - the Saint Petersburg Cathedral Mosque (N. V. Vasilyev, S. S. Krichinsky, A. I. von Gogen, 1909-20; Kronverksky pr. 7) in the frame MQ (frame.js: origin = the dome
// centre, local +x = south / qibla, +z = west / Kronverksky pr.).  Dossier docs/research/troitskaya.md section 2, photos refs/troitskaya 01 03 06 07 08 09 10 13 15 18.
// Volumes (m): body x -25..10.5, z -16.4..15.6, 17.5 high (rock-faced granite to 8.6, smooth ashlar above, a frieze of little pointed arches); south block to x 17 (12 m); north one-storey block to
// x -30.2 (9.8 m) with the tile portal panel; the PISHTAQ on the west face (x -25.7..-13.5: shoulders + the 8.2 x 19.5 m tile slab with the pointed iwan, a stepped muqarnas conch, three doors);
// minaret bases 6.5 m square to 12.5 m at (-25.3, +-12.6), shafts to 34 m, stalactite corbel, gallery to 42 m, pinnacles, tile turret, ribbed bulb, spike = 48.6 m; drum r 7.4 (18.9..22.5 m),
// corbel ring, the 64-rib turquoise dome (max r 8.35, 24.1..37 m), gilded ball and crescent (40 m).  Tile work = canvas sheets (art.js).  No flags.  ~60 k triangles.
// The precinct: paving, the turquoise fence with gilded ornament along Konny per. (OSM w1120136547 / 46: granite posts instanced, alpha panels), the white yard wall on the south (w85427337).
import * as THREE from 'three';
import * as L from '../layout.js';
import { BARRIERS, BARRIER_NODES, LANDUSE } from '../data/city.js';
import * as G from './geo.js';
import { MQ, pointedArch, pairs, planFence, panelQuad } from './frame.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { fillPolyClipped, coverFn } from './surfaces.js';
import { addPolyColliders } from '../lib/massing.js';

const TAU = Math.PI * 2;
export const H = { body: 17.5, south: 12.0, north: 9.8, base: 12.5, portal: 19.5, drum0: 18.9, drum1: 22.5, dome0: 24.1, dome1: 37.0, shaft: 34.0, gallery0: 35.8, gallery1: 42.0, turret: 45.6, top: 48.6 };
const MIN = [[-25.3, 12.6], [-25.3, -12.6]];

/** textured wall quad in the current facade frame: u0..u1, y0..y1 at depth z, tile (tu, tv) metres */
const wq = (P, mat, u0, u1, y0, y1, z = 0, tu = 2.2, tv = tu) => G.wall(P, mat, u0, u1, y0, y1, z, tu, tv);
/** a sheet (uv 0..1, or `rep` tiles along u) */
const sheet = (P, mat, u0, u1, y0, y1, z, rep = 1) => G.pane(P, mat, u0, u1, y0, y1, z, [[0, 0], [rep, 0], [rep, 1], [0, 1]]);
/** tall lattice window with a granite frame */
function latticeWindow(P, M, u, y0, w, h) {
  sheet(P, M.latticeWin, u - w / 2, u + w / 2, y0, y0 + h, 0.05);
  P.box(M.graniteLight, u - w / 2 - 0.22, u - w / 2, y0 - 0.1, y0 + h + 0.22, 0, 0.12, 'kb'); P.box(M.graniteLight, u + w / 2, u + w / 2 + 0.22, y0 - 0.1, y0 + h + 0.22, 0, 0.12, 'kb');
  P.box(M.graniteLight, u - w / 2, u + w / 2, y0 + h, y0 + h + 0.22, 0, 0.12, 'kb'); P.box(M.graniteLight, u - w / 2 - 0.3, u + w / 2 + 0.3, y0 - 0.3, y0 - 0.1, 0, 0.2, 'k');
}
/** the standard hall wall: rock to 8.6, rock piers + ashlar field above, arcade frieze, parapet, three lattice windows + three pointed windows (+ two medallions) round uc */
function hallWall(P, M, len, uc, o = {}) {
  const top = o.top ?? H.body;
  wq(P, M.rock, 0, len, 0, 8.6);
  const p0 = o.pier0 ?? 3.0, p1 = o.pier1 ?? 3.0;
  if (p0) wq(P, M.rock, 0, p0, 8.6, top - 1.6); if (p1) wq(P, M.rock, len - p1, len, 8.6, top - 1.6);
  wq(P, M.ashlar, p0, len - p1, 8.6, top - 1.6, 0, 2.4, 1.2);
  wq(P, M.arcade, 0, len, top - 1.6, top - 0.5, 0, 0.55, 1.1);
  wq(P, M.ashlar, 0, len, top - 0.5, top, 0, 2.4, 1.2);
  P.box(M.graniteLight, 0, len, top - 0.5, top - 0.36, 0, 0.16, 'k'); P.box(M.graniteLight, 0, len, top - 1.72, top - 1.6, 0, 0.12, 'k'); P.box(M.graniteLight, 0, len, 8.52, 8.68, 0, 0.1, 'k');
  P.box(M.graniteDark, 0, len, 0, 0.55, 0, 0.16, 'kb');
  if (uc == null) return;
  for (const du of [-6, 0, 6]) { latticeWindow(P, M, uc + du, 2.0, 1.5, 6.2); sheet(P, M.pointedWin, uc + du - 1.15, uc + du + 1.15, 10.0, 13.6, 0.045); }
  if (o.medallions !== false) for (const du of [-3, 3]) sheet(P, M.medallion, uc + du - 0.85, uc + du + 0.85, 13.9, 15.6, 0.07);
}

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksTroitskaya] mosque/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  P.push(MQ.x, 0, MQ.z, MQ.rot);
  stage('body', () => body(P, M));
  stage('portal', () => portal(P, M));
  stage('north', () => north(P, M));
  stage('dome', () => dome(P, M));
  stage('minarets', () => { for (const [x, z] of MIN) minaret(P, M, x, z); });
  P.pop();
  stage('precinct', () => precinct(K));
  stage('colliders', () => {
    const rec = L.buildingById('w28712430');
    if (rec) for (const poly of rec.polys) addPolyColliders(ctx, poly, 0, 24, 1.0);
    for (const [x, z] of MIN) MQ.cyl(ph, x, z, 2.3, 12, 49);
    MQ.cyl(ph, 0, 0, 8.3, 18, 38);
  });
  K.svc.mosque = { centre: [MQ.x, MQ.z], dome: H.dome1, minarets: MIN.map(([x, z]) => MQ.W(x, z)), top: H.top };
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ body
function body(P, M) {
  const X0 = -25, X1 = 10.5, XS = 17.0, Z0 = -16.4, Z1 = 15.6;
  // west face of the hall (south of the pishtaq): left end at (-13.5, Z1)
  G.onFace(P, -13.5, Z1, 0, 1, () => hallWall(P, M, X1 + 13.5, 12, { pier0: 3.2 }));
  // east face of the whole body: left end (seen from the east) = the south end
  G.onFace(P, X1, Z0, 0, -1, () => {
    hallWall(P, M, X1 - X0, 12, { medallions: false });
    for (const u of [27.5, 31.5]) latticeWindow(P, M, u, 2.6, 1.2, 4.6);
  });
  // south face of the hall above the south block
  G.onFace(P, X1, Z1, 1, 0, () => { wq(P, M.ashlar, 0, Z1 - Z0, H.south, H.body - 1.6, 0, 2.4, 1.2); wq(P, M.arcade, 0, Z1 - Z0, H.body - 1.6, H.body - 0.5, 0, 0.55, 1.1); wq(P, M.ashlar, 0, Z1 - Z0, H.body - 0.5, H.body, 0, 2.4, 1.2); });
  // north face of the body above the north block (the star and the two pointed openings beside the minarets, photo 09)
  G.onFace(P, X0, Z0, -1, 0, () => {
    const len = Z1 - Z0;
    wq(P, M.ashlar, 0, len, 0, H.body - 1.6, 0, 2.4, 1.2); wq(P, M.arcade, 0, len, H.body - 1.6, H.body - 0.5, 0, 0.55, 1.1); wq(P, M.ashlar, 0, len, H.body - 0.5, H.body, 0, 2.4, 1.2);
    P.box(M.graniteLight, 0, len, H.body - 0.5, H.body - 0.36, 0, 0.16, 'k');
    const c = len / 2 - 0.5, sy = 13.2, pts = []; for (let i = 0; i < 16; i++) { const a = i * TAU / 16, r = i % 2 ? 0.72 : 1.05; pts.push([c + Math.sin(a) * r, sy + Math.cos(a) * r, 0.1]); }
    for (let i = 0; i < 16; i++) P.fan(M.graniteLight, [[c, sy, 0.1], pts[i], pts[(i + 1) % 16]], [0, 0, 1]);
    for (const u of [c - 9.3, c + 9.3]) G.planeShape(P, M.dark, pointedArch(1.0, 1.5, 6).map(([x, y]) => [u + x, 10.6 + y]).concat([[u - 1.0, 10.0], [u + 1.0, 10.0]]), 0.04);
  });
  // the south block (mihrab end, photo 03): rock, frieze, a projecting mihrab bay
  const sLen = Z1 - Z0 - 0.4, zs1 = Z1 - 0.3, zs0 = Z0 + 0.1;
  const lowWall = (len, wins) => {
    wq(P, M.rock, 0, len, 0, H.south - 1.5); wq(P, M.arcade, 0, len, H.south - 1.5, H.south - 0.4, 0, 0.55, 1.1); wq(P, M.ashlar, 0, len, H.south - 0.4, H.south, 0, 2.4, 1.2);
    P.box(M.graniteLight, 0, len, H.south - 0.4, H.south - 0.28, 0, 0.14, 'k'); P.box(M.graniteDark, 0, len, 0, 0.55, 0, 0.16, 'kb');
    for (const u of wins) { latticeWindow(P, M, u, 2.4, 1.3, 4.4); G.planeShape(P, M.dark, pointedArch(0.9, 1.4, 6).map(([x, y]) => [u + x, 8.6 + y]).concat([[u - 0.9, 7.7], [u + 0.9, 7.7]]), 0.04); }
  };
  G.onFace(P, X1, zs1, 0, 1, () => lowWall(XS - X1, [3.2]));
  G.onFace(P, XS, zs0, 0, -1, () => lowWall(XS - X1, [3.3]));
  G.onFace(P, XS, zs1, 1, 0, () => {
    lowWall(sLen, [5.5, sLen - 5.5]);
    const c = sLen / 2; G.tbox(P, M.ashlar, c - 2.6, c + 2.6, 0, 9.6, 0, 1.3, 2.4, 1.2, 'kb'); P.box(M.graniteDark, c - 2.7, c + 2.7, 0, 0.55, 0, 1.4, 'kb');
    sheet(P, M.pointedWin, c - 1.3, c + 1.3, 3.6, 7.8, 1.34);
  });
  // roofs (flat, lead grey)
  const cap = (x0, x1, z0, z1, y) => P.cap(M.roofLead, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y, true, 4);
  cap(X0, X1, Z0, Z1, H.body); cap(X1, XS, zs0, zs1, H.south);
  // the octagonal podium of the drum
  G.frustum(P, M.ashlar, 0, 0, H.body, H.drum0, 8, 9.9, 9.9, Math.PI / 8, 3, 1);
  P.cap(M.roofLead, G.ngon(8, 9.9, Math.PI / 8), H.drum0, true, 4);
}

// ------------------------------------------------------------------------------------------------ the pishtaq (west portal)
function portal(P, M) {
  const W0 = 12.2, CW = 8.2, U0 = 2.0, ZS = 2.2, ZC = 3.4, R = 2.5, YS = 8.6, RISE = 4.6, CX = U0 + CW / 2, DEPTH = 2.6;
  G.onFace(P, -25.7, 15.6, 0, 1, () => {
    // shoulders (smooth granite) and the tile slab
    G.tbox(P, M.ashlar, 0, U0, 0, H.portal - 0.9, 0, ZS, 2.4, 1.2, 'kbr'); G.tbox(P, M.ashlar, U0 + CW, W0, 0, H.portal - 0.9, 0, ZS, 2.4, 1.2, 'kbl');
    P.box(M.graniteDark, -0.06, U0, 0, 0.6, 0, ZS + 0.08, 'kb'); P.box(M.graniteDark, U0 + CW, W0 + 0.06, 0, 0.6, 0, ZS + 0.08, 'kb');
    P.box(M.turq, U0, U0 + CW, 0, H.portal, 0, ZC, 'fkb');                                       // sides + top of the slab
    // the face with the iwan hole (uv over the whole slab)
    const arch = pointedArch(R, RISE, 10).map(([x, y]) => [CX + x, YS + y]);
    const hole = [[CX + R, 0], ...arch, [CX - R, 0]];
    const sh = G.shapeOf([[U0, 0], [U0 + CW, 0], [U0 + CW, H.portal], [U0, H.portal]], [hole]);
    const g = new THREE.ShapeGeometry(sh, 4), pa = g.attributes.position, ua = g.attributes.uv;
    for (let i = 0; i < pa.count; i++) ua.setXY(i, (pa.getX(i) - U0) / CW, pa.getY(i) / H.portal);
    P.geo(M.portal, g, 0, 0, ZC); g.dispose();
    // jambs and the back wall below the springing
    const zb = ZC - DEPTH;
    P.quad(M.jamb, [CX - R, 0, ZC], [CX - R, 0, zb], [CX - R, YS, zb], [CX - R, YS, ZC], [1, 0, 0], [[0, 0], [DEPTH / 1.2, 0], [DEPTH / 1.2, YS / 2.4], [0, YS / 2.4]]);
    P.quad(M.jamb, [CX + R, 0, zb], [CX + R, 0, ZC], [CX + R, YS, ZC], [CX + R, YS, zb], [-1, 0, 0], [[0, 0], [DEPTH / 1.2, 0], [DEPTH / 1.2, YS / 2.4], [0, YS / 2.4]]);
    sheet(P, M.iwanBack, CX - R, CX + R, 0, YS, zb);
    // the stepped muqarnas conch above the springing
    const S = [1, 0.84, 0.66, 0.46], Dp = [0, 0.7, 1.4, 2.1, DEPTH];
    const at = (s) => pointedArch(R, RISE, 10).map(([x, y]) => [CX + x * s, YS + y * s]);
    for (let k = 0; k < S.length; k++) {
      const a = at(S[k]), z0 = ZC - Dp[k], z1 = ZC - Dp[k + 1];
      for (let i = 0; i + 1 < a.length; i++) P.quad(M.muqarnas, [a[i][0], a[i][1], z0], [a[i + 1][0], a[i + 1][1], z0], [a[i + 1][0], a[i + 1][1], z1], [a[i][0], a[i][1], z1], null, [[i / 3, 0], [(i + 1) / 3, 0], [(i + 1) / 3, (z0 - z1) / 1.1], [i / 3, (z0 - z1) / 1.1]]);
      if (k + 1 < S.length) {
        const b = at(S[k + 1]);
        for (let i = 0; i + 1 < a.length; i++) P.quad(M.muqarnas, [a[i][0], a[i][1], z1], [a[i + 1][0], a[i + 1][1], z1], [b[i + 1][0], b[i + 1][1], z1], [b[i][0], b[i][1], z1], [0, 0, 1], [[a[i][0] / 1.1, a[i][1] / 1.1], [a[i + 1][0] / 1.1, a[i + 1][1] / 1.1], [b[i + 1][0] / 1.1, b[i + 1][1] / 1.1], [b[i][0] / 1.1, b[i][1] / 1.1]]);
        for (const sg of [-1, 1]) { const xa = CX + sg * R * S[k + 1], xb = CX + sg * R * S[k]; P.quad(M.muqarnas, [xa, YS, z1], [xb, YS, z1], [xb, YS, zb], [xa, YS, zb], [0, -1, 0], [[0, 0], [0.4, 0], [0.4, 1.5], [0, 1.5]]); }
      } else G.planeShape(P, M.jamb, a, zb + 0.01);
    }
    // top cornice of the slab and the steps
    P.box(M.turq, U0 - 0.12, U0 + CW + 0.12, H.portal, H.portal + 0.25, 0, ZC + 0.12, 'b');
    P.box(M.graniteSmooth, CX - R, CX + R, 0, 0.16, zb, ZC + 0.9, 'b'); P.box(M.graniteSmooth, CX - R - 0.6, CX + R + 0.6, 0, 0.08, ZC, ZC + 1.5, 'b');
    // the green railing each side of the steps (photo 10)
    for (const sg of [-1, 1]) { const x0 = CX + sg * (R + 1.3), x1 = CX + sg * (CW / 2 + 1.8); P.box(M.railGreen, Math.min(x0, x1), Math.max(x0, x1), 1.0, 1.06, ZC + 0.7, ZC + 0.76, ''); P.box(M.railGreen, Math.min(x0, x1), Math.max(x0, x1), 0.15, 0.2, ZC + 0.7, ZC + 0.76, ''); for (let i = 0; i <= 6; i++) { const x = x0 + (x1 - x0) * i / 6; P.box(M.railGreen, x - 0.02, x + 0.02, 0, 1.06, ZC + 0.71, ZC + 0.75, 'b'); } }
  });

}

// ------------------------------------------------------------------------------------------------ the north block
function north(P, M) {
  const XN = -30.2, X0 = -25, ZA = -12.0, ZB = 10.0, len = ZB - ZA;
  G.onFace(P, XN, ZA, -1, 0, () => {
    wq(P, M.ashlar, 2.4, len - 2.4, 0, H.north, 0, 2.4, 1.2); wq(P, M.rock, 0, 2.4, 0, H.north); wq(P, M.rock, len - 2.4, len, 0, H.north);
    wq(P, M.arcade, 0, 2.4, H.north - 1.5, H.north - 0.4, 0.03, 0.55, 1.1); wq(P, M.arcade, len - 2.4, len, H.north - 1.5, H.north - 0.4, 0.03, 0.55, 1.1);
    P.box(M.graniteDark, 0, len, 0, 0.55, 0, 0.16, 'kb'); P.box(M.graniteLight, 0, len, H.north - 0.16, H.north, 0, 0.14, 'k');
    const c = len / 2;
    P.box(M.turq, c - 2.42, c + 2.42, 0.3, 9.62, 0, 0.1, 'kb'); sheet(P, M.northPortal, c - 2.3, c + 2.3, 0.4, 9.5, 0.11);
    for (const u of [c - 6.2, c + 6.2]) latticeWindow(P, M, u, 2.8, 1.3, 4.6);
    for (let k = 0; k < 2; k++) P.box(M.graniteSmooth, c - 1.6, c + 1.6, 0, 0.16 * (2 - k), 0, 0.5 + 0.35 * k, 'b');
  });
  G.onFace(P, XN, ZB, 0, 1, () => { wq(P, M.rock, 0, X0 - XN, 0, H.north); });           // west side: seen from the west the left end is the north one
  G.onFace(P, X0, ZA, 0, -1, () => { wq(P, M.rock, 0, X0 - XN, 0, H.north); });          // east side
  P.cap(M.roofLead, [[XN, ZA], [X0, ZA], [X0, ZB], [XN, ZB]], H.north, true, 4);
  // minaret bases (square rock-faced towers with two blind medallions on the outer faces)
  for (const [mx, mz] of MIN) {
    G.tbox(P, M.rock, mx - 3.25, mx + 3.25, 0, H.base, mz - 3.25, mz + 3.25, 2.2, 2.2, 'bt');
    P.cap(M.roofLead, [[mx - 3.25, mz - 3.25], [mx + 3.25, mz - 3.25], [mx + 3.25, mz + 3.25], [mx - 3.25, mz + 3.25]], H.base, true, 4);
    G.tbox(P, M.ashlar, mx - 3.35, mx + 3.35, H.base - 1.3, H.base, mz - 3.35, mz + 3.35, 2.4, 1.2, 'b');
    P.cap(M.roofLead, [[mx - 3.35, mz - 3.35], [mx + 3.35, mz - 3.35], [mx + 3.35, mz + 3.35], [mx - 3.35, mz + 3.35]], H.base + 0.01, true, 4);
  }
}

// ------------------------------------------------------------------------------------------------ dome
let ribGeo = null;
/** the ribbed dome: `ribs` half-round ribs over a profile [[r, y]..] (metres above the dome base); uv u across one rib, v = y / height */
function ribDome(prof, ribs = 64, nu = 3, bulge = 0.042) {
  const nv = prof.length, pos = [], uv = [], idx = [], hT = prof[nv - 1][1];
  for (let g = 0; g < ribs; g++) {
    const base = pos.length / 3;
    for (let i = 0; i < nv; i++) for (let j = 0; j <= nu; j++) {
      const f = j / nu, th = (g + f) * TAU / ribs, r = prof[i][0] * (1 + bulge * Math.sin(Math.PI * f) * Math.min(1, prof[i][0] / 3));
      pos.push(Math.sin(th) * r, prof[i][1], Math.cos(th) * r); uv.push(f, prof[i][1] / hT);
    }
    for (let i = 0; i < nv - 1; i++) for (let j = 0; j < nu; j++) { const a = base + i * (nu + 1) + j, b = a + 1, c = a + (nu + 1), d = c + 1; idx.push(a, b, c, b, d, c); }
  }
  const g1 = new THREE.BufferGeometry();
  g1.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g1.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g1.setIndex(idx); g1.computeVertexNormals();
  return g1;
}
const DOME = [[7.9, 0], [8.2, 1.3], [8.35, 3.2], [8.25, 5.2], [7.8, 7.1], [6.9, 8.8], [5.5, 10.3], [3.7, 11.6], [2.0, 12.45], [0.55, 12.9]];

function dome(P, M) {
  G.tube(P, M.drum, 0, 0, H.drum0, H.drum1, 7.4, 7.4, 48, 16, 1);
  G.tube(P, M.graniteLight, 0, 0, H.drum0, H.drum0 + 0.35, 7.6, 7.6, 48, 1, 1);
  G.tube(P, M.corbel, 0, 0, H.drum1, H.drum1 + 0.8, 7.42, 7.85, 64, 32, 0.5); G.tube(P, M.corbel, 0, 0, H.drum1 + 0.8, H.dome0, 7.85, 8.05, 64, 32, 0.5);
  ribGeo ||= ribDome(DOME);
  P.geo(M.rib, ribGeo, 0, H.dome0, 0);
  // gilded ball, rod, crescent (open to the sky, no flag)
  const y = H.dome0 + 12.9;
  P.col(M.goldFlat, 0, 0, y - 0.1, y + 0.5, 0.6, 0.25, 12, false);
  G.ball(P, M.goldFlat, 0, y + 0.95, 0, 0.55, 14);
  P.col(M.goldFlat, 0, 0, y + 1.4, y + 2.1, 0.07, 0.05, 6, false); G.ball(P, M.goldFlat, 0, y + 1.75, 0, 0.16, 8);
  const cr = new THREE.TorusGeometry(0.62, 0.075, 6, 18, Math.PI * 1.45); P.geo(M.goldFlat, cr, 0, y + 2.7, 0, 0, 0, Math.PI * 0.65); cr.dispose();
}

// ------------------------------------------------------------------------------------------------ minaret
let bulbGeo = null;
function minaret(P, M, x, z) {
  // octagonal foot, the shaft with the diamond net, the stalactite corbel
  G.frustum(P, M.ashlar, x, z, H.base, H.base + 1.6, 8, 3.2, 2.25, Math.PI / 8, 1, 1);
  G.tube(P, M.shaft, x, z, H.base + 1.6, H.shaft, 2.0, 1.8, 20, 4, (H.shaft - H.base - 1.6) / 4.4);
  G.tube(P, M.corbel, x, z, H.shaft, H.shaft + 0.9, 1.8, 2.15, 20, 10, 0.5); G.tube(P, M.corbel, x, z, H.shaft + 0.9, H.gallery0, 2.15, 2.42, 20, 10, 0.5);
  // gallery drum with 8 pointed openings, cornice, 8 cone pinnacles
  G.tube(P, M.gallery, x, z, H.gallery0, H.gallery1, 2.3, 2.3, 24, 8, 1);
  G.tube(P, M.graniteLight, x, z, H.gallery1, H.gallery1 + 0.3, 2.45, 2.45, 24, 1, 1, { capTop: M.roofLead });
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) * TAU / 8, px = x + Math.sin(a) * 2.05, pz = z + Math.cos(a) * 2.05; P.col(M.graniteSmooth, px, pz, H.gallery1 + 0.3, H.gallery1 + 0.75, 0.3, 0.3, 8, false); P.col(M.graniteSmooth, px, pz, H.gallery1 + 0.75, H.gallery1 + 1.35, 0.3, 0.02, 8, false); }
  // the tile turret, its ring, the ribbed bulb and the spike
  G.tube(P, M.turret, x, z, H.gallery1 + 0.3, H.turret, 0.88, 0.88, 16, 4, 1);
  G.tube(P, M.cobalt, x, z, H.turret, H.turret + 0.3, 1.0, 1.0, 16, 1, 1, { capTop: M.cobalt });
  bulbGeo ||= ribDome([[0.7, 0], [1.05, 0.35], [1.12, 0.8], [0.95, 1.3], [0.6, 1.7], [0.2, 1.95], [0.03, 2.05]], 16, 2, 0.1);
  P.geo(M.turq, bulbGeo, x, H.turret + 0.3, z);
  P.col(M.goldFlat, x, z, H.turret + 2.3, H.top, 0.05, 0.015, 5, false);
}

// ------------------------------------------------------------------------------------------------ precinct: paving, fence, yard wall
function precinct(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics, cover = coverFn(ctx);
  const lu = (LANDUSE || []).find((l) => l.id === 'w753042748');
  if (lu) for (const p of lu.polys) fillPolyClipped(P, M.pavers, pairs(p.o), 0.045, cover, { maxEdge: 3, tile: 2 });   // the yard drive (a mapped service way) stays asphalt
  const byId = new Map(BARRIERS.map((b) => [b.id, b]));
  const gates = BARRIER_NODES.filter((n) => n.kind === 'gate' && n.x > -1560 && n.x < -1470 && n.z > -2610 && n.z < -2480).map((n) => ({ x: n.x, z: n.z, half: 1.7 }));
  const posts = [], fences = [];
  for (const id of ['w1120136547', 'w1120136546']) {
    const b = byId.get(id); if (!b) continue;
    const plan = planFence(pairs(b.pts), 3.2, gates, 0.22);
    for (const p of plan.posts) posts.push(mat4(p.x, 0, p.z, p.rot, p.gate ? 1.15 : 1));
    for (const q of plan.panels) { panelQuad(P, M.mosqueFence, q.a, q.b, 0.3, 2.1, 1.6); ph.addBox((q.a.x + q.b.x) / 2, (q.a.z + q.b.z) / 2, q.len, 0.12, q.rot, 0, 2.1);
      P.quad(M.graniteSmooth, [q.a.x, 0, q.a.z], [q.b.x, 0, q.b.z], [q.b.x, 0.3, q.b.z], [q.a.x, 0.3, q.a.z], null); }
    fences.push({ id, pts: pairs(b.pts), h: 2.1, kind: 'mosque', gates: plan.opens });
  }
  const postG = partsGeos((Q) => {
    Q.box(M.graniteSmooth, -0.24, 0.24, 0, 2.25, -0.24, 0.24, 'b'); Q.box(M.graniteLight, -0.3, 0.3, 2.25, 2.4, -0.3, 0.3, 'b');
    G.frustum(Q, M.graniteSmooth, 0, 0, 2.4, 2.75, 4, 0.36, 0.03, Math.PI / 4, 1, 1);
    for (const [fx, fz] of [[0, 1], [0, -1]]) { Q.push(fx * 0.25, 0, fz * 0.25, Math.atan2(fx, fz)); G.pane(Q, M.postPanel, -0.17, 0.17, 0.5, 2.0, 0); Q.pop(); }
  });
  K.extraTris += addInstanced(ctx, K.root, 'lmT-mosquePosts', postG, posts).tris;
  for (const p of posts) { const e = p.elements; ph.addBox(e[12], e[14], 0.5, 0.5, 0, 0, 2.6); }
  // the white yard wall on the south (photo 03): rendered wall with green caps
  for (const id of ['w85427337']) {
    const b = byId.get(id); if (!b) continue; const pts = pairs(b.pts);
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], c = pts[i + 1], len = Math.hypot(c[0] - a[0], c[1] - a[1]), rot = Math.atan2(-(c[1] - a[1]), c[0] - a[0]);
      P.push(a[0], 0, a[1], rot); P.box(M.white, 0, len, 0, 2.3, -0.15, 0.15, 'b'); P.box(M.railGreen, -0.05, len + 0.05, 2.3, 2.42, -0.2, 0.2, 'b'); P.pop();
      ph.addBox((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, len, 0.3, rot, 0, 2.4);
    }
    fences.push({ id, pts, h: 2.4, kind: 'wall' });
  }
  K.svc.fences.push(...fences);
}
