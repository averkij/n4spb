// landmarksVladimir/fence.js - the enclosure of the Prince Vladimir Cathedral and the chapel of St Alexander Nevsky (docs/research/vladimir.md 2.4).
//  * the IRON FENCE (OSM w753042753; N. F. Bryullov 1872-73; photo refs/vladimir cath_13_fence): black spear-topped pickets with a band of rings and a lattice base, 1.9 m on a low granite kerb,
//    one alpha panel per 2.6 m (the post is painted into the tile); openings at the OSM gate nodes;
//  * the WEST GATE on the axis of the main door (photo cath_11_door, cath_25): two yellow pylons 4.6 m with white panels, pyramid caps, gilded balls and crosses, an iron overthrow, open leaves;
//  * the CHAPEL (OSM w117478061, N. N. Kovrigin 1882-86; photos chap_01..03): a canted square kiosk with paired columns on the corners, arched glazed fronts under segmental pediments,
//    a low bell-shaped dome with a gilded cupola and cross (~14 m).  Colliders: thin boxes along the fence, cylinders for the pylons and the chapel.
import { BARRIERS, BARRIER_NODES } from '../data/city.js';
import * as G from './geo.js';
import * as S from './stucco.js';
import { CATH, CHAPEL, onWall } from './frame.js';
import { roadTest } from './surfaces.js';
import { segBand, segFill, doric, pil } from './cathedral.js';

const TAU = Math.PI * 2;
const RUN = 'w753042753', TILE = 2.6, HF = 1.9, KERB = 0.25;
const GATES = { n7036256979: 2.2, n7036256980: 1.3, n7036256981: 1.3 };       // gate node -> half opening
const CAPDOME = [[1.0, 0], [1.02, 0.08], [0.96, 0.3], [0.8, 0.55], [0.55, 0.78], [0.36, 0.9], [0.3, 1.0]];

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksVladimir] fence/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('fence', () => fence(K));
  stage('gate', () => gate(K));
  stage('chapel', () => chapel(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

function fence(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics, onRoad = roadTest(K.ctx);
  const rec = BARRIERS.find((b) => b.id === RUN); if (!rec) return;
  const pts = []; for (let i = 0; i < rec.pts.length; i += 2) pts.push([rec.pts[i], rec.pts[i + 1]]);
  // ROAD INTEGRITY: OSM draws the south run 0.9 m from the centre line of the driveway round the cathedral (service way w116531044, 4 m wide).  A run that lies ALONG asphalt (more
  // than a quarter of its samples on or within 0.35 m of it) is moved outwards, away from the cathedral, by the smallest offset that clears it; the corners are re-mitred.  What still
  // crosses asphalt afterwards (the two driveway gates at the west corners) becomes an opening, like the OSM gate nodes.
  const c = CATH.W(0, 10), n = pts.length;
  const badFrac = (a, b) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(2, Math.ceil(len / 0.5)); let bad = 0; for (let k = 0; k <= m; k++) if (onRoad(a[0] + (b[0] - a[0]) * k / m, a[1] + (b[1] - a[1]) * k / m, 0.35)) bad++; return bad / (m + 1); };
  const lines = [];
  for (let i = 0; i + 1 < n; i++) {
    const a = pts[i], b = pts[i + 1]; let nx = -(b[1] - a[1]), nz = b[0] - a[0]; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
    if (nx * ((a[0] + b[0]) / 2 - c.x) + nz * ((a[1] + b[1]) / 2 - c.z) < 0) { nx = -nx; nz = -nz; }
    let d = 0;
    if (badFrac(a, b) > 0.25) { for (d = 0.2; d <= 3.01; d += 0.2) if (badFrac([a[0] + nx * d, a[1] + nz * d], [b[0] + nx * d, b[1] + nz * d]) < 0.08) break; if (d > 3.01) d = 0; }
    lines.push({ a: [a[0] + nx * d, a[1] + nz * d], b: [b[0] + nx * d, b[1] + nz * d] });
  }
  const meet = (p, q) => {                                                   // intersection of two offset runs (their own end points when they are nearly parallel)
    const ux = p.b[0] - p.a[0], uz = p.b[1] - p.a[1], vx = q.b[0] - q.a[0], vz = q.b[1] - q.a[1], den = ux * vz - uz * vx;
    if (Math.abs(den) < 0.05 * Math.hypot(ux, uz) * Math.hypot(vx, vz)) return [(p.b[0] + q.a[0]) / 2, (p.b[1] + q.a[1]) / 2];
    const t = ((q.a[0] - p.a[0]) * vz - (q.a[1] - p.a[1]) * vx) / den; return [p.a[0] + ux * t, p.a[1] + uz * t];
  };
  const moved = pts.map((p, i) => (i === 0 ? lines[0].a : i === n - 1 ? lines[n - 2].b : meet(lines[i - 1], lines[i])));
  const gates = BARRIER_NODES.filter((g) => GATES[g.id]).map((g) => ({ x: g.x, z: g.z, half: GATES[g.id] }));
  let runLen = 0;
  for (let i = 0; i + 1 < n; i++) {
    const a = moved[i], b = moved[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len;
    // openings on this segment: the OSM gates and every stretch that would stand on asphalt (+ 0.4 m)
    const cuts = [];
    for (const g of gates) { const s = (g.x - a[0]) * ux + (g.z - a[1]) * uz, d = Math.abs((g.x - a[0]) * -uz + (g.z - a[1]) * ux); if (d < 3.2 && s > -g.half && s < len + g.half) cuts.push([Math.max(0, s - g.half), Math.min(len, s + g.half)]); }
    for (let s = 0, run = null; s <= len + 0.25; s += 0.25) {
      const t = Math.min(len, s), bad = onRoad(a[0] + ux * t, a[1] + uz * t, 0.35);
      if (bad && run === null) run = t; if ((!bad || s > len) && run !== null) { cuts.push([Math.max(0, run - 0.4), Math.min(len, t + 0.4)]); run = null; }
    }
    cuts.sort((p, q) => p[0] - q[0]);
    const spans = []; let s0 = 0;
    for (const cc of cuts) { if (cc[0] - s0 > 0.3) spans.push([s0, cc[0]]); s0 = Math.max(s0, cc[1]); }
    if (len - s0 > 0.3) spans.push([s0, len]);
    for (const [p0, p1] of spans) {
      const l = p1 - p0, nn = Math.max(1, Math.round(l / TILE)), ax = a[0] + ux * p0, az = a[1] + uz * p0, bx = a[0] + ux * p1, bz = a[1] + uz * p1;
      P.quad(M.fence, [ax, KERB, az], [bx, KERB, bz], [bx, KERB + HF, bz], [ax, KERB + HF, az], null, [[0, 0], [nn, 0], [nn, 1], [0, 1]]);
      // granite kerb
      const nx = -uz * 0.14, nz = ux * 0.14;
      P.quad(M.granite, [ax + nx, 0, az + nz], [bx + nx, 0, bz + nz], [bx + nx, KERB, bz + nz], [ax + nx, KERB, az + nz], [-uz, 0, ux]);
      P.quad(M.granite, [bx - nx, 0, bz - nz], [ax - nx, 0, az - nz], [ax - nx, KERB, az - nz], [bx - nx, KERB, bz - nz], [uz, 0, -ux]);
      P.quad(M.granite, [ax + nx, KERB, az + nz], [bx + nx, KERB, bz + nz], [bx - nx, KERB, bz - nz], [ax - nx, KERB, az - nz], [0, 1, 0]);
      ph.addBox((ax + bx) / 2, (az + bz) / 2, l, 0.25, Math.atan2(-uz, ux), 0, 2.1);
      runLen += l;
    }
  }
  K.svc.fences.push({ id: RUN, kind: 'cathedral enclosure', len: Math.round(runLen) });
}

/** one gate pylon in the current frame at (x, z) */
function pylon(P, M, x, z) {
  const h = 0.55;
  P.box(M.plinth, x - h - 0.1, x + h + 0.1, 0, 0.7, z - h - 0.1, z + h + 0.1, 'b');
  P.box(M.yellow, x - h, x + h, 0.7, 3.5, z - h, z + h, 'bt');
  for (const [dx, dz, r] of [[0, 1, 0], [1, 0, Math.PI / 2], [0, -1, Math.PI], [-1, 0, -Math.PI / 2]]) { P.push(x + dx * h, 0, z + dz * h, r); P.box(M.white, -0.3, 0.3, 1.2, 3.0, 0, 0.05, 'bk'); P.pop(); }
  P.box(M.white, x - h - 0.12, x + h + 0.12, 3.5, 3.75, z - h - 0.12, z + h + 0.12, '');
  P.box(M.yellow, x - h + 0.06, x + h - 0.06, 3.75, 4.15, z - h + 0.06, z + h - 0.06, 'bt');
  P.box(M.white, x - h - 0.2, x + h + 0.2, 4.15, 4.4, z - h - 0.2, z + h + 0.2, '');
  G.frustum(P, M.roof, x, z, 4.4, 5.2, 4, (h + 0.2) * Math.SQRT2, 0.12, Math.PI / 4, 1, 1);
  G.ball(P, M.gold, x, 5.45, z, 0.26, 10);
  G.cross(P, M.gold, x, 5.68, z, 1.0, 0);
}
function gate(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics;
  const g = BARRIER_NODES.find((n) => n.id === 'n7036256979'), m = g ? CATH.M(g.x, g.z) : { mx: -1.9, mz: 69.8 };
  P.push(CATH.ox, 0, CATH.oz, CATH.rot);
  const z = m.mz, cx = m.mx, half = 2.2;
  for (const s of [-1, 1]) {
    pylon(P, M, cx + s * (half + 0.55), z);
    CATH.cyl(ph, cx + s * (half + 0.55), z, 0.75, 0, 5);
    // open leaf swung into the yard
    P.push(cx + s * half, 0, z, 0);
    P.quad(M.fence, [0, 0.12, 0], [0, 0.12, -1.95], [0, 0.12 + 2.3, -1.95], [0, 0.12 + 2.3, 0], null, [[0, 0], [0.75, 0], [0.75, 1], [0, 1]]);
    P.pop();
  }
  // overthrow: an iron arc with a small cross between the pylons
  P.push(cx, 0, z, 0);
  G.solid(P, M.iron, segBand(0, 3.3, half, 0.8, 0.07, 10), -0.03, 0.06); G.solid(P, M.iron, segBand(0, 3.3, half, 0.5, 0.05, 10), -0.03, 0.06);
  G.cross(P, M.gold, 0, 4.15, 0, 0.7, 0);
  P.pop();
  P.pop();
}

function chapel(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics, F = CHAPEL;
  P.push(F.ox, 0, F.oz, F.rot);
  const a = 3.3, c = 1.25, y0 = 0.6, yc = 5.5, ye = 6.5;
  const ring = [[a - c, a], [a, a - c], [a, -(a - c)], [a - c, -a], [-(a - c), -a], [-a, -(a - c)], [-a, a - c], [-(a - c), a]];
  // podium with a step all round
  P.cap(M.granite, ring.map(([x, z]) => [x * 1.34, z * 1.34]), 0.3, true, 2); P.cap(M.granite, ring.map(([x, z]) => [x * 1.17, z * 1.17]), y0, true, 2);
  for (let i = 0; i < 8; i++) for (const [k, yA, yB] of [[1.34, 0, 0.3], [1.17, 0.3, y0]]) { const p = ring[i], q = ring[(i + 1) % 8]; onWall(P, [p[0] * k, p[1] * k], [q[0] * k, q[1] * k], [0, 0], (len) => P.quad(M.granite, [0, yA, 0], [len, yA, 0], [len, yB, 0], [0, yB, 0], [0, 0, 1])); }
  for (let i = 0; i < 8; i++) {
    const p = ring[i], q = ring[(i + 1) % 8], card = i % 2 === 1;
    onWall(P, p, q, [0, 0], (len) => {
      P.quad(M.yellow, [0, y0, 0], [len, y0, 0], [len, yc, 0], [0, yc, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, 1.6], [0, 1.6]]);
      P.box(M.plinth, 0, len, y0, y0 + 0.5, 0, 0.1, 'bk');
      S.entablature(P, M, -0.06, len + 0.06, yc, 0.4, { hA: 0.3, hF: 0.35, hC: 0.35 });
      if (card) {
        S.archGlass(P, M.winArch, len / 2, y0 + 0.5, 1.9, 4.0, 0.05); S.archFrame(P, M.white, len / 2, y0 + 0.5, 1.9, 4.0, 0.26, 0, 0.18);
        for (const u of [0.32, len - 0.32]) pil(P, M, u, y0 + 0.5, yc, 0.5, 0.16);
        G.solid(P, M.yellow, segFill(len / 2, ye, len / 2 + 0.2, 1.1, 8), -0.3, 0.5); G.solid(P, M.white, segBand(len / 2, ye - 0.02, len / 2 + 0.5, 1.2, 0.26, 8), -0.3, 0.75);
      } else {
        // paired columns on pedestals in front of the canted corner
        for (const u of [len / 2 - 0.42, len / 2 + 0.42]) { P.box(M.white, u - 0.3, u + 0.3, y0, y0 + 0.9, 0.12, 0.72, 'b'); doric(P, M, u, 0.42, y0 + 0.9, yc, 0.2); }
        S.entablature(P, M, len / 2 - 0.85, len / 2 + 0.85, yc, 0.82, { hA: 0.3, hF: 0.35, hC: 0.35, z0: 0.4 });
      }
    });
  }
  P.cap(M.roof, ring.map(([x, z]) => [x * 1.08, z * 1.08]), ye + 0.02, true, 2.4);
  // low octagonal attic, the bell-shaped dome, the gilded cupola and cross
  G.frustum(P, M.white, 0, 0, ye, ye + 0.9, 8, 2.75, 2.75, Math.PI / 8, 1, 1);
  G.frustum(P, M.whiteShade, 0, 0, ye + 0.9, ye + 1.1, 8, 2.95, 2.95, Math.PI / 8, 1, 1, { capTop: M.white });
  G.lathe(P, M.dome, 'capdome', CAPDOME, 0, ye + 1.1, 0, 2.7, 2.7, 24, 12);
  P.col(M.white, 0, 0, ye + 3.7, ye + 4.3, 0.75, 0.7, 10, true);
  G.onion(P, M.gold, 0, ye + 4.3, 0, 0.5, 1, 16, 12);
  G.cross(P, M.gold, 0, ye + 4.3 + 1.1, 0, 1.5, 0);
  P.pop();
  ph.addCylinder(F.ox, F.oz, 3.9, 0, 12);
  K.svc.monuments.push({ id: 'w117478061', name: 'Часовня Александра Невского', x: F.ox, z: F.oz, h: 14 });
  void TAU;
}
