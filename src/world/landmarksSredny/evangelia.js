// landmarksSredny/evangelia.js - the DOM EVANGELIA (Дом Евангелия, 24th line 3-7 lit. A, the Baptist prayer house of 1910-11 by I. B. Kaliberda; abandoned since 2013 / in clean-up since 2024): OSM w117952605 (lit. A) and its
// neighbours w116609892 (lit. B) and w117952630 (lit. D).  Dossier docs/research/sredny.md section 5 (critic C8), photos refs/sredny 90 91 92, cw_674-690908 / 09 (the 1910 project), frame E (origin (-4948, 135), rot 29.6 deg,
// X ENE 0 .. 38, Z SSE 0 .. 44; the street front faces WSW (-X) toward the 24-25 line street).  State in October 2026: a cracked ochre stucco shell (`#c8a66b`, bare-brick patches), broken panes, rusty roof.
//   lit. A: the MAIN BLOCK X 14.7 .. 37.5 (22.8 m wide, 4 storeys + a parapet, top 19.0 m, windows 1.2 x 1.9 m on a 2.8 m pitch, floors 4.3 m) with the tall narrow volume at its north end (Z 0 .. 6, 1.6 m above the
//   parapet, stepped, two caps) and a drive-through arch 3.2 x 3.6 m at its foot; the WEST WING X 0 .. 14.7 (Z 16.4 .. 41.8): two tall storeys (about 5 m) under a steep roof (eaves 10.5, ridge 17.2) with three small
//   dormers and one large pedimented Dutch dormer at Z = 29, rectangular windows 1.3 x 2.2 m in five bays; lit. B and lit. D: plain 3-storey ochre blocks (eaves 12 m) with flat grey-brown roofs.
//   A 2.2 m galvanised lattice fence closes the old plot line (E X = -30, Z 0 .. 44; the rolling gate is drawn closed).  Nothing here is walkable: thin-wall colliders, the fence is solid.
// Not drawn: the old bulb sign «Бог есть любовь», the SIVIL bell tower (a project), the mural.
import * as L from '../layout.js';
import { FR, ringOf } from './frame.js';
import { ringEdges, onEdge, polyOf } from './kit.js';
import { wallFace, rectC, segC, rectOutline, band, roofGable, roofHip, fenceLine, panelBays, onWest } from './wall.js';
import { tbox } from './geo.js';
import { addPolyColliders } from '../lib/massing.js';

const E = FR.E;
export const RING_E = [[38, 41.9], [32.3, 41.9], [32.3, 43.8], [20.8, 43.9], [20.9, 41.6], [0.2, 41.8], [0, 16.4], [5.6, 16.4], [5.7, 22.2], [14.8, 22.2], [14.7, 0.1], [37.5, 0]];

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSredny] evangelia/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('litA', () => { E.enter(K.P); try { litA(K); } finally { E.leave(K.P); } });
  stage('litBD', () => { blockWorld(K, 'w116609892'); blockWorld(K, 'w117952630'); });
  stage('fence', () => fence(K));
  stage('colliders', () => colliders(K));
  stage('services', () => services(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

function rows(K, len, h, o = {}) {
  const { P, M } = K, step = o.step || 2.8, bays = Math.max(1, Math.round(len / step)), pitch = len / bays, ops = [];
  const flo = o.floors || [[1.2, 1.9], [5.6, 1.9], [9.9, 1.9], [14.2, 1.9]], w = o.w || 1.2;
  if (len > 2.4 && !o.blind) for (let i = 0; i < bays; i++) { const cx = (i + 0.5) * pitch; if (cx - w / 2 < 0.4 || cx + w / 2 > len - 0.4) continue; for (const [y, hh] of flo) if (y + hh < h - 0.3) ops.push({ c: rectC(cx, y, w, hh), glass: M.winEv, reveal: M.stuccoFlat, depth: 0.2 }); }
  for (const x of (o.holes || [])) ops.push(x);
  wallFace(P, M.stucco, rectOutline(0, len, -0.3, h), ops, { tu: 4, tv: 4 });
  band(P, M.stuccoFlat, -0.05, len + 0.05, h - 0.45, h + 0.3, 0, 0.35, 2);
  return ops;
}

function litA(K) {
  const { P, M } = K;
  for (const e of ringEdges(polyOf(RING_E))) {
    const mx = (e.a[0] + e.b[0]) / 2, mz = (e.a[1] + e.b[1]) / 2, main = mx > 14.2, wingLow = !main;
    onEdge(P, e, (len) => {
      if (main) {
        // the street front of the main block (X = 14.7, facing -X): the drive-through arch at the foot of the tall volume (x = Z - 0.1, arch at Z about 3)
        const street = e.n[0] < -0.9 && Math.abs(e.a[0] - 14.7) < 0.3;
        rows(K, len, 19.0, { holes: street ? [{ c: segC(3.1, 0, 3.2, 3.6, 0.7, 8), glass: M.glassDark, reveal: M.brickBare, depth: 0.5 }] : [], blind: len < 3 });
      } else rows(K, len, 10.5, { floors: [[1.4, 2.2], [6.4, 2.2]], w: 1.3, step: 5.08 });
      void mz; void wingLow;
    });
  }
  // flat roof of the main block with a parapet and two chimney caps on the tall volume; the stepped block of the courtyard side
  P.cap(M.flatRoof, [[14.7, 0.1], [37.5, 0], [38, 41.9], [32.3, 41.9], [32.3, 43.8], [20.8, 43.9], [20.9, 41.6], [14.8, 41.7], [14.8, 22.2]], 19.0, true, 4);
  // the tall narrow volume at the north end (Z 0 .. 6): 1.6 m above the parapet, stepped, with two caps
  P.box(M.stuccoFlat, 14.7, 21.4, 19.0, 20.6, 0.05, 6.0, 'b', 4);
  P.box(M.stuccoFlat, 14.9, 20.9, 20.6, 21.0, 0.3, 5.7, 'b', 4);
  for (const z of [0.8, 5.0]) P.box(M.capEv, 15.0, 15.7, 21.0, 21.7, z - 0.35, z + 0.35, 'b', 1);
  // the west wing: a steep roof (eaves 10.5, ridge 17.2) over X 0 .. 14.7, Z 16.4 .. 41.8 with dormers; the small piece X 0 .. 5.6 at Z 16.4 .. 22.2 is covered by the same roof
  roofGable(P, M.roofRust, M.stucco, -0.4, 14.9, 22.0, 42.0, 10.5, 6.7, false, 2);
  roofGable(P, M.roofRust, M.stucco, -0.4, 5.9, 16.2, 22.4, 10.5, 2.8, false, 2);
  // the west wall of the main block above the wing eaves (Z 22.2 .. 41.7, facing -X, from 10.5 to 19.0): one row of windows
  onWest(P, 14.8, 22.2, () => { const ops = []; for (let i = 0; i < 7; i++) ops.push({ c: rectC((i + 0.5) * 19.5 / 7, 14.2, 1.2, 1.9), glass: M.winEv, reveal: M.stuccoFlat, depth: 0.2 }); wallFace(P, M.stucco, rectOutline(0, 19.5, 10.0, 19.0), ops, { tu: 4, tv: 4 }); band(P, M.stuccoFlat, -0.05, 19.55, 18.55, 19.3, 0, 0.35, 2); });
  for (const z of [24.0, 34.5, 39.0]) { P.box(M.stuccoFlat, 1.2, 2.9, 10.8, 12.4, z - 0.8, z + 0.8, 'b', 2); P.quad(M.winEv, [1.18, 10.95, z - 0.55], [1.18, 10.95, z + 0.55], [1.18, 12.2, z + 0.55], [1.18, 12.2, z - 0.55], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]); roofGable(P, M.roofRust, M.stucco, 1.2, 2.9, z - 0.9, z + 0.9, 12.4, 0.7, true, 2); }
  { const z = 29.0; P.box(M.stuccoFlat, 0.6, 3.4, 10.7, 13.8, z - 1.3, z + 1.3, 'b', 2); P.quad(M.winEv, [0.58, 11.1, z - 0.5], [0.58, 11.1, z + 0.5], [0.58, 13.0, z + 0.5], [0.58, 13.0, z - 0.5], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.fan(M.stuccoFlat, [[0.6, 13.8, z - 1.5], [0.6, 13.8, z + 1.5], [0.6, 15.1, z + 0.6], [0.6, 15.6, z], [0.6, 15.1, z - 0.6]], [-1, 0, 0]); roofGable(P, M.roofRust, M.stucco, 0.6, 3.4, z - 1.4, z + 1.4, 13.8, 1.6, true, 2); }
}

/** lit. B / D: plain 3-storey ochre blocks (eaves 12 m), flat grey-brown roofs, drawn from the baked ring in world coordinates */
function blockWorld(K, id) {
  const { P, M } = K, ring = ringOf(id); if (!ring) throw new Error('no ring ' + id);
  for (const e of ringEdges(polyOf(ring))) onEdge(P, e, (len) => rows(K, len, 12.0, { floors: [[1.2, 1.9], [5.2, 1.9], [9.0, 1.9]], step: 3.0 }));
  P.cap(M.flatRoof, ring, 12.0, true, 4);
}

function fence(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const line = [E.xz(-30, -1), E.xz(-30, 45)];
  const bays = [], r = fenceLine(P, ph, M.fenceLattice, line, { pw: 4.0, h: 2.2, y0: 0.0, gaps: [], bays });
  panelBays(ctx, 'lmsredn-evangelia-fence', bays, M.fenceLattice, { h: 2.2, y0: 0.0 });      // breakable bays (docs/AREAS.md 13.7)
  for (const [x, z, rotY] of r.posts) { P.push(x, 0, z, rotY); P.box(M.ironLight, -0.06, 0.06, 0, 2.3, -0.06, 0.06, 'b', 1); P.pop(); }
  K.svc.fences.push({ id: 'dom-evangelia', pts: line, h: 2.2, kind: 'iron', gates: [] });
}

function colliders(K) {
  const ph = K.ctx.physics;
  for (const e of ringEdges(polyOf(RING_E))) E.wall(ph, e.a, e.b, 0, 17, 0.6);
  for (const id of ['w116609892', 'w117952630']) { const b = L.buildingById(id); if (b && b.polys) for (const poly of b.polys) addPolyColliders(K.ctx, poly, 0, 13, 0.6); }
  void tbox; void roofHip; void onWest;
}
function services(K) {
  const c = E.W(26, 22);
  K.svc.monuments.push({ id: 'w117952605', name: 'Дом Евангелия (24-я линия В.О.)', x: c.x, z: c.z, h: 21.7 });
}
