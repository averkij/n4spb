// landmarksSevkabel/promenade.js - the public ground of Sevkabel Port (docs/research/sevkabel.md sections 4.5-4.9, 10; photos 003 016 017 021 022 027 032 034).
//   * THE EMBANKMENT STRIP along the river face of the hall (frame H): a larch DECK (lz 25 .. 37, +0.15 m) with the ribs' benches, a gravel edging, a LAWN strip that tapers towards the sea square (4 leaning timber
//     boards "прислонялки", 4.5 m tall, tilted 65 deg towards the water), a stone-slab PATH (2.2 m) along the quay and the longest bar counter in Petersburg: a larch top rail (0.28 m) on flat steel posts every 4 m
//     (dark concrete curb below), interrupted at the pier stretch (two yellow bollards on concrete blocks; the boat is the environment's).
//   * THE PAVED YARD: dark pavers (0.3 x 0.6 m, lighter bands every 8 m) on the sea square, the inner alley, the inner square and the gate lane; fine reddish gravel on the pier plaza (SE of the hall); everything is cut EXACTLY
//     at the building walls, the quay water and the asphalt (surfaces.paveRows; road integrity: nothing laid over a carriageway).
//   * The blue ticket container «ПРИЧАЛ» with its timber booth, the small kiosk of the SE plaza (OSM w1239372696), the raised stage deck in front of the NW gable.
//   Services: photo spots, crowd discs, benches (the 12 hall benches come from hall.js), fences.
import * as THREE from 'three';
import * as L from '../layout.js';
import { BUILDINGS } from '../data/city.js';
import { H, HALL, quayLz } from './frame.js';
import { coverFnSkipping, paveRows, pairs } from './surfaces.js';

const LX0 = HALL.lx0, LX1 = HALL.lx1;
/** outer edge of the deck: 12 m deep, but never closer than 2.5 m to the quay edge */
const deckOut = (lx) => Math.min(37, quayLz(lx) - 2.5);

export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSevkabel] promenade/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  P.push(H.x, 0, H.z, H.rot);
  try {
    stage('strip', () => strip(K));
    stage('rail', () => quayRail(K));
    stage('leaners', () => leaners(K));
    stage('props', () => props(K));
    stage('paving', () => paving(K));
  } finally { P.pop(); }
  stage('services', () => services(K));
  void ph; void THREE; void L;
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ deck, edging, lawn, slab path
function strip(K) {
  const { P, M } = K;
  const xs = []; for (let x = LX0; x < LX1 - 1e-6; x += 6) xs.push(x); xs.push(LX1);
  // the deck (a platform 0.15 m high: top boards along lx, a skirt towards the lawn)
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i], b = xs[i + 1], za = deckOut(a), zb = deckOut(b);
    P.quad(M.deck, [a, 0.15, 25.0], [b, 0.15, 25.0], [b, 0.15, zb], [a, 0.15, za], [0, 1, 0], [[25.0 / 1.12, a / 2.4], [25.0 / 1.12, b / 2.4], [zb / 1.12, b / 2.4], [za / 1.12, a / 2.4]]);
    P.quad(M.deck, [a, 0, za], [b, 0, zb], [b, 0.15, zb], [a, 0.15, za], [0, 0, 1], [[0, 0], [1, 0], [1, 0.1], [0, 0.1]]);
  }
  // gravel edging 0.5 m + lawn + slab path
  const lawnA = []; for (let x = -68; x < 78.6; x += 3) lawnA.push(x); lawnA.push(78.6);
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i], b = xs[i + 1];
    P.quad(M.edging, [a, 0.07, deckOut(a)], [b, 0.07, deckOut(b)], [b, 0.07, deckOut(b) + 0.5], [a, 0.07, deckOut(a) + 0.5], [0, 1, 0]);
    P.quad(M.slabPath, [a, 0.08, quayLz(a) - 2.5], [b, 0.08, quayLz(b) - 2.5], [b, 0.08, quayLz(b) - 0.3], [a, 0.08, quayLz(a) - 0.3], [0, 1, 0], [[a / 1.0, (quayLz(a) - 2.5) / 1.0], [b / 1.0, (quayLz(b) - 2.5) / 1.0], [b / 1.0, (quayLz(b) - 0.3) / 1.0], [a / 1.0, (quayLz(a) - 0.3) / 1.0]]);
  }
  for (let i = 0; i + 1 < lawnA.length; i++) {
    const a = lawnA[i], b = lawnA[i + 1];
    const za0 = deckOut(a) + 0.5, za1 = quayLz(a) - 2.5, zb0 = deckOut(b) + 0.5, zb1 = quayLz(b) - 2.5;
    if (za1 - za0 < 0.15 && zb1 - zb0 < 0.15) continue;
    const a1 = Math.max(za0, za1), b1 = Math.max(zb0, zb1);
    P.quad(M.lawn, [a, 0.06, za0], [b, 0.06, zb0], [b, 0.06, b1], [a, 0.06, a1], [0, 1, 0], [[a / 6, za0 / 6], [b / 6, zb0 / 6], [b / 6, b1 / 6], [a / 6, a1 / 6]]);
  }
}

// ------------------------------------------------------------------------------------------------ the quay curb and the larch rail
function quayRail(K) {
  const { P, M, svc } = K;
  const pts = [];
  for (let x = -126.8; x <= 125; x += 4) { if (x > 80 && x < 108) continue; pts.push(x); }
  // curb under the rail line (dark concrete 0.35 m high, 0.35 m wide) along the walked stretch (the pier gap stays open)
  const runs = [[-126.8, 80], [108, 125]];
  for (const [r0, r1] of runs) {
    const xs = []; for (let x = r0; x < r1 - 1e-6; x += 4) xs.push(x); xs.push(r1);
    for (let i = 0; i + 1 < xs.length; i++) {
      const a = xs[i], b = xs[i + 1], za = quayLz(a) - 0.25, zb = quayLz(b) - 0.25, dx = b - a, dz = zb - za, len = Math.hypot(dx, dz);
      P.push(a, 0, za, Math.atan2(-dz, dx));
      P.box(M.curb, 0, len, 0, 0.35, -0.18, 0.18, 'b', 2);
      P.box(M.railTop, 0, len, 1.08, 1.14, -0.14, 0.14, 'b', 1);
      P.pop();
      // posts (flat steel 0.06 x 0.12 m, 1.1 m) at the start of every piece
      P.push(a, 0, za, Math.atan2(-dz, dx));
      P.box(M.bolt, -0.03, 0.03, 0.35, 1.08, -0.06, 0.06, 'b', 1);
      P.pop();
    }
    const e = r1, ze = quayLz(e) - 0.25; P.box(M.bolt, e - 0.03, e + 0.03, 0.35, 1.08, ze - 0.06, ze + 0.06, 'b', 1);
    svc.fences.push({ id: 'quay-rail', a: H.W(r0, quayLz(r0) - 0.25), b: H.W(r1, quayLz(r1) - 0.25), h: 1.1 });
  }
  void pts;
  // the pier stretch: two yellow bollards on 0.8 x 0.8 m concrete blocks at the quay edge
  for (const x of [88, 101]) {
    const z = quayLz(x) - 1.0;
    P.box(M.conc, x - 0.4, x + 0.4, 0, 0.4, z - 0.4, z + 0.4, 'b', 1.2);
    P.cyl(M.bollardY, [x, 0.4, z], [x, 0.85, z], 0.2, 0.17, 10, true);
    P.cyl(M.bollardY, [x, 0.85, z], [x, 0.95, z], 0.26, 0.26, 10, true);
  }
}

// ------------------------------------------------------------------------------------------------ the four leaning boards
function leaners(K) {
  const { P, M } = K;
  const g = new THREE.BoxGeometry(1.2, 4.5, 0.15); g.translate(0, 2.25, 0);
  for (const lx of [-50, -20, 10, 40]) {
    const z = Math.min(quayLz(lx) - 6.5, 43);
    P.geo(M.leaner, g, lx, 0.06, z, 25 * Math.PI / 180, 0, 0);
    for (let k = 0; k < 3; k++) for (const sx of [-0.45, 0.45]) {
      const y = 1.0 + k * 1.3, a = 25 * Math.PI / 180;
      P.box(M.bolt, lx + sx - 0.05, lx + sx + 0.05, 0.06 + y * Math.cos(a) - 0.05, 0.06 + y * Math.cos(a) + 0.05, z + y * Math.sin(a) + 0.07, z + y * Math.sin(a) + 0.12, 'b', 1);
    }
  }
  g.dispose();
}

// ------------------------------------------------------------------------------------------------ props: container, booth, kiosk, stage
function props(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  // the blue ticket container with the white outline wordmark (H 89.6, +33.9; 6 x 2.4 x 2.6 m) and the timber booth beside it (4 x 2.4 x 2.5 m)
  { const cx = 89.6, cz = 33.9;
    P.box(M.blueBox, cx - 3, cx + 3, 0, 2.6, cz - 1.2, cz + 1.2, 'f', 2);
    P.quad(M.container, [cx - 3, 0.1, cz + 1.2], [cx + 3, 0.1, cz + 1.2], [cx + 3, 2.6, cz + 1.2], [cx - 3, 2.6, cz + 1.2], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.box(M.timberBooth, cx - 7.0, cx - 3.0, 0, 2.5, cz - 1.2, cz + 1.2, '', 2);
    P.box(M.roofMem, cx - 7.1, cx - 2.9, 2.5, 2.62, cz - 1.3, cz + 1.3, 'b', 2);
    for (const x of [cx - 6.2, cx - 5.2, cx - 4.2]) P.box(M.portHole, x - 0.3, x + 0.3, 1.2, 1.9, cz + 1.2, cz + 1.24, 'b', 1);
    H.box(ph, cx, cz, 6, 2.4, 0, 2.7); H.box(ph, cx - 5, cz, 4, 2.4, 0, 2.7); }
  // the small kiosk of the SE plaza (OSM w1239372696: H lx 85.4..91.4, lz -5.5..-0.2): a timber-clad box with a flat roof and a glazed front (plain, no signage)
  { const x0 = 85.5, x1 = 91.3, z0 = -5.5, z1 = -0.3;
    P.box(M.timberBooth, x0, x1, 0, 3.0, z0, z1, '', 2);
    P.box(M.roofMem, x0 - 0.15, x1 + 0.15, 3.0, 3.12, z0 - 0.15, z1 + 0.15, 'b', 2);
    P.box(M.darkWin, x0 + 0.5, x1 - 0.5, 0.9, 2.4, z1, z1 + 0.04, 'b', 1);
    H.box(ph, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0, 3.2); }
  // The summer stage is authored by culture.js beside the gable, leaving the
  // fair entrance level and clear instead of placing a 0.6 m deck across it.
}

// ------------------------------------------------------------------------------------------------ the paved yard (rows, exact)
/** local [lx, lz] rings of every building whose outline touches the box (world), except raised parts and the pass-over boxes (alley bridge, skyway) */
function buildingRings(x0, z0, x1, z1) {
  const out = [];
  for (const b of BUILDINGS) {
    if (b.minH > 1.5 || b.id === 'w1239372698' || b.id === 'w335462132') continue;
    for (const p of b.polys) {
      const o = p.o; let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
      for (let i = 0; i < o.length; i += 2) { bx0 = Math.min(bx0, o[i]); bx1 = Math.max(bx1, o[i]); bz0 = Math.min(bz0, o[i + 1]); bz1 = Math.max(bz1, o[i + 1]); }
      if (bx1 < x0 || bx0 > x1 || bz1 < z0 || bz0 > z1) continue;
      out.push(pairs(o).map(([x, z]) => { const q = H.M(x, z); return [q.u, q.v]; }));
    }
  }
  return out;
}
/** the paved yard (frame H): the whole rectangle round the hall except the river strip in front of the hall (deck, lawn, path), cut exactly at buildings / water / asphalt */
const YARD_LANES = ['w559480717', 'w559486264'];
export const YARD_REGION = [[-128, -99], [111, -99], [111, 52], [LX1, 52], [LX1, 25], [LX0, 25], [LX0, 52], [-128, 52]];
function paving(K) {
  const { ctx, P, M } = K, cover = coverFnSkipping(ctx, YARD_LANES);       // the two claimed yard lanes are pavers in reality (groups.js osm): streets draws no asphalt there
  const holes = buildingRings(H.x - 260, H.z - 260, H.x + 260, H.z + 260);
  const ok = (a, b) => { const w = H.W(a, b); return !L.inRiver(w.x, w.z) && cover(w.x, w.z) < -0.25; };
  const matAt = (a, b) => (a > LX1 + 0.4 && (b > -25 || a > 81.4) ? M.gravel : M.pavers);
  K.svc.pavingQuads = paveRows(P, M.pavers, YARD_REGION, holes, ok, { y: 0.05, step: 0.5, tile: 8, sample: 1.2, matAt });
}

// ------------------------------------------------------------------------------------------------ services: photo spots, crowd discs
function services(K) {
  const { svc } = K;
  const spot = (x, z, yaw, pitch, name) => { if (!L.insideBuilding(x, z, 0.6)) svc.photoSpots.push({ x, z, yaw, pitch, name }); };
  spot(-6123, 1013, 51.5, 3, 'Севкабель Порт: набережная и рёбра главного корпуса');
  spot(-6258, 862, -118, 14, 'Севкабель Порт: морская площадь и торец корпуса');
  spot(-6200, 858, 66, 8, 'Севкабель Порт: внутренняя аллея и «катушка Теслы»');
  spot(-6172, 971, -61, 12, 'Севкабель Порт: трубы ТЭЦ и корпус с набережной');
  const c = (id, kind, lx, lz, r, n) => { const w = H.W(lx, lz); svc.crowd.push({ id, kind, x: w.x, z: w.z, r, n }); };
  for (const lx of [-55, -28, 0, 28, 55]) c('promenade-' + lx, 'promenade', lx, 31, 14, 9);
  c('lawn', 'lawn', 15, 43, 12, 12);
  c('sea-square', 'square', -100, -10, 25, 14);
  c('inner-alley', 'alley', 20, -37, 18, 8);
  c('pier-plaza', 'plaza', 95, 20, 14, 8);
  c('gate', 'gate', -14, -76, 8, 5);
}
