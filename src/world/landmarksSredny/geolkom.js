// landmarksSredny/geolkom.js - the GEOLOGICAL COMMITTEE building (Геологический комитет, now VSEGEI and the Chernyshev Central Geological Prospecting Museum; Sredny pr. 74; A. A. Poleschuk 1912-14), OSM w45965990.
// Dossier docs/research/sredny.md section 4 (critic C1 / C2: the OSM central step is 8 m too narrow; heights about 1.4 x the first draft), photos refs/sredny 32 33 36 46 48 n09 n10 n11, frame G (origin (-5030.7, -615.3),
// rot 29.6 deg, X ENE 0 .. 121.5, Z toward the SSE 0 .. 49, front toward -Z, the carriageway of Sredny pr. at Z <= -4.4).
// PLAN: the OSM ring corrected to a 24 m wide central block X 48.8 .. 72.7 (its loggia back wall at Z = 4.5 like the wings), pavilions X 0 .. 16.6 / 104.7 .. 121.5 with their front at Z 0.75, three rear wings with two courtyards.
// WALLS: every ring edge gets the three-storey wall of geolWall.js (plinth / floor 1 / floor 2 / floor 3 / cornice); the central portico, the stair, the pylons, the attic with the lettering and the dome are in geolPortico.js;
// the two end pavilions have four-column loggias (below); the roofs are flat green with a glass hip lantern per block.  FENCE: slate-blue iron fence 2.0 m on a granite curb round a lawn strip (front Z -1.3 with the
// stair gap between the cheek walls, flanks X -3.3 and 128.0 back to Z 49), solid colliders marked fence = true.  Colliders: thin walls on the corrected ring, the portico parts in geolPortico.js.
// Services: monuments, photo spots, crowd (stair), fences, entrances (the three doors are closed).
import * as L from '../layout.js';
import { FR } from './frame.js';
import { ringEdges, onEdge, polyOf } from './kit.js';
import { tbox } from './geo.js';
import { wallFace, rectC, archC, rectOutline, cornice, fenceLine, panelBays, roofFrustum, band } from './wall.js';
import { wallRows, GH } from './geolWall.js';
import { portico, onFront, column, XC, X0, X1, PLAT, ST } from './geolPortico.js';
import { fillPolyClipped, coverFn } from './surfaces.js';

/** the corrected plan ring in G coordinates [X, Z] */
export const RING = [[121.5, 0.75], [121.5, 47.0], [95.3, 47.1], [95.2, 23.3], [79.3, 23.4], [79.4, 42.4], [70.8, 42.5], [70.8, 46.3], [51.1, 46.2], [51.0, 43.1], [42.4, 43.1], [42.3, 24.2], [27.6, 24.1], [27.7, 48.9],
  [0.0, 49.0], [0.0, 0.75], [16.6, 0.75], [16.6, 4.5], [48.8, 4.5], [72.7, 4.5], [104.7, 4.5], [104.7, 0.75]];
const CORN = 20.3;                                                                       // the pavilions' cornice base (crown 21.5)

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSredny] geolkom/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const G = FR.G, P = K.P;
  G.enter(P);
  try {
    stage('walls', () => walls(K));
    stage('pavilions', () => { pavilion(K, 0, 16.6); pavilion(K, 104.7, 121.5); });
    stage('portico', () => portico(K));
    stage('roofs', () => roofs(K));
  } finally { G.leave(P); }
  stage('fence', () => fence(K));
  stage('colliders', () => colliders(K));
  stage('services', () => services(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the walls of the ring
function walls(K) {
  const { P, M } = K;
  const edges = ringEdges(polyOf(RING));
  for (const e of edges) {
    const [nx, nz] = e.n, mx = (e.a[0] + e.b[0]) / 2, mz = (e.a[1] + e.b[1]) / 2;
    onEdge(P, e, (len, f) => {
      if (nz < -0.9) {
        // fronts: the pavilions (Z 0.75) and the central loggia back wall (X 48.8 .. 72.7) are drawn elsewhere; the wings are the full wall
        if (Math.abs(mz - 4.5) < 0.2 && (mx < XC - 12 || mx > XC + 12)) wallRows(P, M, len, {});
        return;
      }
      if (Math.abs(nx) > 0.9) {
        if (len < 5) { wallRows(P, M, len, { plain: true, centres: [len / 2], top: CORN, noPlinthWin: true }); return; }
        // flanks: the front block part (Z < 24) is the taller block (crown 21.5 on the outer ends), the rear wing part crown 20.3; local x runs toward +Z (west faces) or -Z (east faces).  Courtyard walls are plain.
        const west = nx < 0, z0 = Math.min(e.a[1], e.b[1]), z1 = Math.max(e.a[1], e.b[1]);
        const outer = Math.abs(e.a[0]) < 1 || Math.abs(e.a[0] - 121.5) < 1;
        const xAt = (Z) => (west ? Z - z0 : z1 - Z), split = Math.min(Math.max(24.0, z0), z1);
        const tall = [Math.min(xAt(z0), xAt(split)), Math.max(xAt(z0), xAt(split))], low = [Math.min(xAt(split), xAt(z1)), Math.max(xAt(split), xAt(z1))];
        const bays = Math.max(1, Math.round(len / 3.58)), pitch = len / bays, centres = Array.from({ length: bays }, (_, i) => (i + 0.5) * pitch);
        const pil = outer ? Array.from({ length: bays + 1 }, (_, i) => i * pitch) : [];
        if (split - z0 > 1) wallRows(P, M, len, { plain: !outer, centres, ox: tall, top: outer ? CORN : GH.corn, pil });
        if (z1 - split > 1) wallRows(P, M, len, { plain: !outer, centres, ox: low, top: GH.corn, pil });
        return;
      }
      // rear walls and the courtyard faces of the front block: plain rows
      wallRows(P, M, len, { plain: true, top: GH.corn });
      void f;
    });
  }
}

// ------------------------------------------------------------------------------------------------ an end pavilion X xa .. xb (front plane Z = 0.75, loggia back wall Z = 4.5)
function pavilion(K, xa, xb) {
  const { P, M, ctx } = K, ph = ctx.physics, G = FR.G, W = xb - xa, xm = (xa + xb) / 2, PY = 1.2;
  // plinth front with basement windows, the loggia floor (+3.5), the end piers, four columns on pedestals
  onFront(P, xb, 0.75, () => {
    wallFace(P, M.granRust, rectOutline(0, W, 0, 3.5), [{ c: rectC(W * 0.3, 1.4, 1.6, 1.0), glass: M.glassDark, reveal: M.granRust, depth: 0.2 }, { c: rectC(W * 0.7, 1.4, 1.6, 1.0), glass: M.glassDark, reveal: M.granRust, depth: 0.2 }], { tu: 3.6, tv: 1.8 });
    band(P, M.granString, 0, W, 3.38, 3.63, 0, 0.2);
    // the attic above the entablature: a plain wall with three windows, the cornice (crown 21.5)
    wallFace(P, M.dolo, rectOutline(0, W, 16.8, CORN), [-4, 0, 4].map((d) => ({ c: rectC(W / 2 + d, 17.5, 1.5, 2.4), glass: M.glassRect, reveal: M.doloShade, depth: 0.28, withSill: true, sillMat: M.doloFlat })), { tu: 4.4, tv: 4.4 });
    cornice(P, M.doloFlat, M.doloShade, 0, W, 0, CORN, 0.25, 0.25);
    band(P, M.doloFlat, 0, W, 16.5, 16.8, 0, 0.4);
  });
  P.quad(M.granLight, [xa, 3.5, 0.75], [xb, 3.5, 0.75], [xb, 3.5, 4.5], [xa, 3.5, 4.5], [0, 1, 0], [[xa / 2.4, 0], [xb / 2.4, 0], [xb / 2.4, 1.6], [xa / 2.4, 1.6]]);
  tbox(P, M.dolo, xa, xa + PY, 3.5, 16.5, 0.75, 4.5, 4.4, 4.4, 'btl'); tbox(P, M.dolo, xb - PY, xb, 3.5, 16.5, 0.75, 4.5, 4.4, 4.4, 'btr');
  // entablature (frieze) over the loggia and its underside
  P.box(M.doloFlat, xa, xb, 15.6, 16.5, 0.65, 4.5, 'b', 2);
  P.quad(M.soffit, [xa + PY, 15.6, 4.5], [xb - PY, 15.6, 4.5], [xb - PY, 15.6, 0.65], [xa + PY, 15.6, 0.65], [0, -1, 0]);
  // the loggia back wall at Z = 4.5: floor-1 windows and floor-2 arches between the columns
  onFront(P, xb, 4.5, () => wallRows(P, M, W, { centres: [W / 2 + 4, W / 2, W / 2 - 4], pil: [], y0: 3.5, top: 16.5, noF3: true, noCornice: true, noBalus: true, plain: false }));
  // columns: pedestal (granite 1.4 m + limestone 1.0 m) on the loggia floor, shaft 8.4 m, capital 1.1 m
  for (const d of [-6, -2, 2, 6]) {
    const x = xm + d, z = 1.7;
    tbox(P, M.granLight, x - 0.75, x + 0.75, 3.5, 4.9, z - 0.75, z + 0.75, 2.4, 2.4, 'b');
    P.box(M.doloFlat, x - 0.7, x + 0.7, 4.9, 5.9, z - 0.7, z + 0.7, 'b', 2);
    column(P, M, x, z, 5.9);
  }
  // roof: flat, a low glazed hip lantern with a steel rim
  P.quad(M.roofGrey, [xa, 21.5, 0.75], [xb, 21.5, 0.75], [xb, 21.5, 24.0], [xa, 21.5, 24.0], [0, 1, 0]);
  roofFrustum(P, M.skylight, xm - 4.2, xm + 4.2, 8.0, 16.0, 21.5, xm - 2.6, xm + 2.6, 10.5, 13.5, 23.2, 2.4);
  P.box(M.darkSteel, xm - 2.7, xm + 2.7, 23.2, 23.45, 10.4, 13.6, 'b', 1);
  // colliders: the pavilion plinth + piers are the ring walls; the columns are solid from the loggia floor (not reachable from the ground)
  void ph; void G;
}

// ------------------------------------------------------------------------------------------------ roofs of the wings and the rear wings: flat green sheet with a glass hip lantern per block
function roofs(K) {
  const { P, M } = K;
  const flat = (x0, x1, z0, z1, y) => P.quad(M.greenRoof, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], [[x0 / 2, z0 / 2], [x1 / 2, z0 / 2], [x1 / 2, z1 / 2], [x0 / 2, z1 / 2]]);
  // front wings (the two 32.2 m blocks Z 4.5 .. 24): roof at 20.3, a lantern 22 x 9 m rising 2.7 m
  for (const [xa, xb] of [[16.6, 48.8], [72.7, 104.7]]) {
    flat(xa, xb, 4.5, xa < 50 ? 24.0 : 23.3, CORN);                                  // the east court wall (Z 23.3) carries its own cornice crown at 20.3: the roof stops at the wall line
    const xm = (xa + xb) / 2;
    roofFrustum(P, M.skylight, xm - 11, xm + 11, 9.75, 18.75, CORN, xm - 6.5, xm + 6.5, 14.25, 14.25, CORN + 2.7, 2.4);
    P.box(M.darkSteel, xm - 6.6, xm + 6.6, CORN + 2.65, CORN + 2.8, 14.15, 14.35, 'b', 1);
  }
  // rear wings: flat green + a ridge lantern 1.2 m
  for (const [xa, xb, za, zb] of [[0, 27.6, 24.1, 49.0], [42.4, 79.4, 24.0, 46.3], [95.2, 121.5, 23.4, 47.1]]) {
    if (xa === 42.4) {                                                                 // the middle wing has a jog at its rear: the roof follows the ring (nothing outside the walls: the cornice crowns lie there)
      P.cap(M.greenRoof, [[42.4, 24.0], [79.4, 24.0], [79.4, 42.4], [70.8, 42.5], [70.8, 46.3], [51.1, 46.2], [51.0, 43.1], [42.4, 43.1]], GH.corn + 1.2, true, 2);
    } else flat(xa, xb, za, zb, GH.corn + 1.2 - 0.0);
    const xm = (xa + xb) / 2, zm = (za + zb) / 2;
    roofFrustum(P, M.skylight, xm - (xb - xa) * 0.3, xm + (xb - xa) * 0.3, zm - 3, zm + 3, GH.corn + 1.2, xm - (xb - xa) * 0.3 + 2, xm + (xb - xa) * 0.3 - 2, zm, zm, GH.corn + 2.4, 2.4);
  }
}

// ------------------------------------------------------------------------------------------------ fence (slate-blue, 2.0 m, spear heads, rings) on a granite curb, a lawn strip behind it
function fence(K) {
  const { P, M, ctx } = K, ph = ctx.physics, G = FR.G, cover = coverFn(ctx);
  const line = [[-3.3, 49], [-3.3, -1.3], [128.0, -1.3], [128.0, 49]].map(([a, b]) => G.xz(a, b));
  const s1 = 50.3, gap0 = s1 + (ST.x0 - ST.cheek + 3.3), gap1 = s1 + (ST.x1 + ST.cheek + 3.3);
  const bays = [], r = fenceLine(P, ph, M.fenceSlate, line, { pw: 3.4, h: 2.0, y0: 0.3, gaps: [[gap0, gap1]], bays });
  panelBays(ctx, 'lmsredn-geolkom-fence', bays, M.fenceSlate, { h: 2.0, y0: 0.3 });      // breakable bays (docs/AREAS.md 13.7)
  { const gc = G.W((ST.x0 + ST.x1) / 2, -1.3); K.svc.fences.push({ id: 'geolkom', pts: line, h: 2.0, kind: 'iron', gates: [{ x: gc.x, z: gc.z, w: ST.x1 - ST.x0 + 2 * ST.cheek }] }); }
  // posts: square 0.1 m, a pointed pyramid top, standing on the curb
  for (const [x, z, rotY] of r.posts) {
    P.push(x, 0.3, z, rotY);
    P.box(M.slate, -0.06, 0.06, 0, 2.05, -0.06, 0.06, 'tb', 1);
    for (const [ax, az, bx, bz] of [[-0.07, -0.07, 0.07, -0.07], [0.07, -0.07, 0.07, 0.07], [0.07, 0.07, -0.07, 0.07], [-0.07, 0.07, -0.07, -0.07]]) P.fan(M.slate, [[ax, 2.05, az], [bx, 2.05, bz], [0, 2.35, 0]], [ax + bx, 0.5, az + bz]);
    P.pop();
  }
  // curb 0.3 m along the line (skipping the stair gap) and the lawn strip
  const pieces = [[0, gap0], [gap1, 1e9]];
  let s = 0;
  for (let i = 0; i + 1 < line.length; i++) {
    const A = line[i], B = line[i + 1], len = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / len, uz = (B[1] - A[1]) / len;
    for (const [pa, pb] of pieces) {
      const a = Math.max(pa, s), b = Math.min(pb, s + len); if (b - a < 0.2) continue;
      P.push(A[0] + ux * (a - s), 0, A[1] + uz * (a - s), Math.atan2(-uz, ux));
      P.box(M.granGrey, 0, b - a, 0, 0.3, -0.15, 0.15, 'b', 2);
      P.pop();
    }
    s += len;
  }
  // lawn inside the fence (G coordinates): the front strip, the two flanks; clipped at the buildings by drawing only outside the ring
  const lawn = (xa, xb, za, zb) => { const ring = [G.xz(xa, za), G.xz(xb, za), G.xz(xb, zb), G.xz(xa, zb)]; fillPolyClipped(P, M.lawn, ring, 0.17, (x, z) => cover(x, z), { margin: 0.3, maxEdge: 3, tile: 4 }); };
  lawn(-3.1, ST.x0 - ST.cheek - 0.1, -1.1, 0.0); lawn(ST.x1 + ST.cheek + 0.1, 127.8, -1.1, 0.0);
  lawn(-3.1, 0.0, 0.0, 48.8); lawn(121.5, 127.8, 0.0, 48.8);
  lawn(0.0, 16.6, 0.0, 0.75); lawn(104.7, 121.5, 0.0, 0.75);
  lawn(16.6, 48.8, 0.0, 4.5); lawn(72.7, 104.7, 0.0, 4.5);
}

// ------------------------------------------------------------------------------------------------ colliders: the ring walls (the building is solid), the loggia is open to the platform
function colliders(K) {
  const ph = K.ctx.physics, G = FR.G, T = 28;
  const edges = ringEdges(polyOf(RING));
  for (const e of edges) {
    // the central loggia back wall is the wall at Z = 4.5 (the doors are closed and solid); the pavilion fronts are walls at Z 0.75 (the loggia floor is 3.5 m up)
    G.wall(ph, e.a, e.b, 0, T, 0.6);
  }
  void XC; void X0; void X1; void PLAT; void archC;
}

function services(K) {
  const G = FR.G, svc = K.svc, cover = coverFn(K.ctx);
  const c = G.W(60.75, 12);
  svc.monuments.push({ id: 'w45965990', name: 'Геологический комитет (ЦНИГР им. Ф. Н. Чернышёва)', x: c.x, z: c.z, h: 29.5 });
  const spot = (x, z, yaw, pitch, name) => { if (cover(x, z) < -0.5 && !L.insideBuilding(x, z, 0.5)) svc.photoSpots.push({ x, z, yaw, pitch, name }); };
  spot(-4990.6, -671.3, -150, 8, 'Геологический комитет: фасад с портиком');
  spot(-4978.2, -649.4, -150, 14, 'Геологический комитет: у лестницы');
  svc.crowd.push({ id: 'geolkom-stair', kind: 'photo', x: G.W(60.75, -7.0).x, z: G.W(60.75, -7.0).z, r: 7, n: 4 });
}
