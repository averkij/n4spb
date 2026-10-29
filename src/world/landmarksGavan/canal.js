// landmarksGavan/canal.js - the SHKIPERSKY CANAL promenade (docs/research/gavan.md section 5; photos refs/gavan 24 25 26; frame C, the east bank is +u): the lawn strip between the granite coping and the black iron fence, the mapped fence
// w1174466370 redrawn as bar panels with a sunburst FAN panel every 40 m along the promenade (it continues round the Morskaya Rezidentsia compound as a plain bar fence), the gate of the path, twin-globe cast standards
// every 36 m at the fence and low single-ball lamps along the path, boulders on the lawn, and on the west bank the closed Priboy works wall (white-grey, 2 m).  The canal wall, coping, berm and water belong to environment.
// The service way w1174466371 (the cobble path) is the streets' carriageway: nothing is laid over it, every post / lamp / boulder keeps off the asphalt (net.cover < -0.5).  PROMENADE_OPEN (frame.js SW) decides the gate.
import * as THREE from 'three';
import * as L from '../layout.js';
import { BARRIERS } from '../data/city.js';
import { FC, SW, pairsOf } from './frame.js';
import { fenceRun, postInstances, fenceBays, wallBays } from './fence.js';
import { partsGeos } from './inst.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13, 15.v): the canal lamps are knock records
import { splitBays } from '../lib/fence-bays.js';
import { coverFn, fillPolyClipped, densify } from './surfaces.js';
import { ball } from './geo.js';

const FENCE_ID = 'w1174466370';
const GATE = [-6984.1, -11.2];                                          // n10913231731 (access=private): the north end of the path
export const FANS = { every: 40, to: 395 };

export function build(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksGavan] canal/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = Q.P, M = Q.M, ph = Q.ctx.physics, cover = coverFn(Q.ctx), svc = Q.svc;
  const wet = (x, z) => { try { return !!L.waterwayAt(x, z); } catch (e) { return false; } };
  const fb = BARRIERS.find((b) => b.id === FENCE_ID);
  const fpts = fb ? pairsOf(fb.pts) : [[-6976.1, -10.8], [-6962.4, 141.3], [-6935.2, 370.8]];
  const promenade = fpts.slice(0, 3);                                    // along the canal: (-6976, -11) -> (-6962, 141) -> (-6935, 371)
  let fence = null;

  stage('lawn', () => {
    // the strip between the coping (u 15.9) and the fence, v 8 .. 445 of the canal frame
    const off = (p, q, d) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [-dz / l * d, dx / l * d]; };          // normal (-dz, dx) / l: points to the WEST side for a polyline running south
    const o1 = off(promenade[0], promenade[1], 0.7), o2 = off(promenade[1], promenade[2], 0.7);
    const edge = [promenade[0], promenade[1], promenade[2]].map((p, i) => { const o = i === 2 ? o2 : i === 0 ? o1 : [(o1[0] + o2[0]) / 2, (o1[1] + o2[1]) / 2]; return [p[0] + o[0], p[1] + o[1]]; });
    const a = FC.W(16.1, 8), b = FC.W(16.1, 448);
    const ring = [[a.x, a.z], [b.x, b.z], edge[2], edge[1], edge[0]];
    const keep = (x, z) => (cover(x, z) > -0.15 || wet(x, z) ? 1 : -5);
    fillPolyClipped(P, M.lawn, ring, 0.05, keep, { tile: 6, maxEdge: 5, margin: 0.15 });
  });

  stage('fence', () => {
    fence = fenceRun(Q, fpts, { h: 1.6, y0: 0.06, bars: M.fenceBars, fan: M.fenceFan, fanEvery: FANS.every, fanTo: FANS.to, panel: 2.5, margin: 0.3, skip: wet });
    postInstances(Q, 'lmgavan-fenceposts', fence.posts, { h: 1.72, spear: true });
    if (SW.PROMENADE_OPEN) {                                              // the gate of the path: two posts and an open leaf swung back against the fence
      const g = { x: GATE[0], z: GATE[1] };
      for (const s of [-1, 1]) { const px = g.x + s * 1.5 * 0.99, pz = g.z + s * 1.5 * 0.13; if (cover(px, pz) < -0.5) postInstances(Q, 'lmgavan-gateposts' + s, [[px, pz, 0.1]], { h: 2.0, spear: false }); }
    } else {                                                              // the closed gate (switch off here): one breakable bay across the opening (the source: a plain 3 m fence box)
      const gx = Math.cos(0.13) * 1.5, gz = -Math.sin(0.13) * 1.5;
      fenceBays(Q, 'lmgavan-gate', [{ x0: GATE[0] - gx, z0: GATE[1] - gz, x1: GATE[0] + gx, z1: GATE[1] + gz, y: 0, fan: false }], { h: 1.6, y0: 0.06, bars: M.fenceBars });
    }
    // the cross fence at the MChS corner: the mapped fence turns east there, the strip between its corner and the coping is closed (the mole beyond is MChS territory)
    const cv = FC.M(fpts[2][0], fpts[2][1]), cp = FC.W(16.3, cv.v);
    const cross = fenceRun(Q, [fpts[2], [cp.x, cp.z]], { h: 1.6, y0: 0.06, bars: M.fenceBars, panel: 2.5, margin: 0.3, skip: wet });
    postInstances(Q, 'lmgavan-crossposts', cross.posts, { h: 1.72, spear: true });
    fence.runs.push(...cross.runs); fence.bays.push(...cross.bays);
    // n4spb: every panel of the promenade fence (and the cross fence at the MChS corner) is a breakable bay (collider 0.3 m x 1.8 m as the source's solid boxes, one knock record each); the posts stay static
    const n = fenceBays(Q, 'lmgavan-fence', fence.bays, { h: 1.6, y0: 0.06, bars: M.fenceBars, fan: M.fenceFan, solidH: 1.8, mass: 250, anchored: 14 });
    svc.fences.push({ id: FENCE_ID, pts: fpts, gates: [{ id: 'n10913231731', x: GATE[0], z: GATE[1], w: 3, open: SW.PROMENADE_OPEN }], spans: fence.spans, posts: fence.posts.length, boxes: n });
  });

  stage('lamps', () => {
    // twin-globe standards at the fence (every 36 m, 1.3 m on the canal side), low ball lamps along the path (every 18 m, 3 m west of the path axis)
    const twin = partsGeos((PP) => {
      PP.box(M.iron, -0.17, 0.17, 0, 0.5, -0.17, 0.17, 'b', 1); PP.cyl(M.iron, [0, 0.5, 0], [0, 3.75, 0], 0.095, 0.05, 8, false); PP.cyl(M.iron, [0, 0.5, 0], [0, 0.9, 0], 0.15, 0.1, 8, false);
      for (const s of [-1, 1]) { PP.cyl(M.iron, [0, 3.55, 0], [s * 0.55, 3.95, 0], 0.025, 0.02, 4, false); PP.cyl(M.iron, [s * 0.55, 3.95, 0], [s * 0.7, 3.8, 0], 0.02, 0.02, 4, false); const g = new THREE.SphereGeometry(0.19, 8, 6); PP.geo(M.lampWhite, g, s * 0.7, 3.62, 0); g.dispose(); PP.cyl(M.iron, [s * 0.7, 3.84, 0], [s * 0.7, 3.88, 0], 0.07, 0.04, 6, true); }
    });
    const low = partsGeos((PP) => { PP.cyl(M.iron, [0, 0, 0], [0, 1.15, 0], 0.06, 0.04, 6, false); PP.cyl(M.iron, [0, 0, 0], [0, 0.3, 0], 0.1, 0.07, 6, false); const g = new THREE.SphereGeometry(0.19, 8, 6); PP.geo(M.lampWhite, g, 0, 1.4, 0); g.dispose(); });
    const along = (pts, step, from, off, ok) => {                          // points along a polyline `step` apart, shifted `off` m to the west of its direction
      const out = []; let acc = from, next = from;
      for (let i = 0; i + 1 < pts.length; i++) {
        const A = pts[i], B = pts[i + 1], dx = B[0] - A[0], dz = B[1] - A[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
        while (next <= acc + len) { const s = next - acc, x = A[0] + ux * s - uz * off, z = A[1] + uz * s + ux * off; if (ok(x, z)) out.push([x, z, Math.atan2(ux, uz)]); next += step; }
        acc += len;
      }
      return out;
    };
    const free = (x, z) => cover(x, z) < -0.7 && !wet(x, z);
    const t = along(promenade, 36, 14, 1.3, (x, z) => free(x, z));
    const path = [[-6984.1, -11.2], [-6938.5, 370.8]];
    const l = along(path, 18, 20, 3.4, (x, z) => free(x, z) && Math.hypot(x - GATE[0], z - GATE[1]) > 3);
    // n4spb (docs/AREAS.md 13, 15.v): the twin-globe standards and the low ball lamps are knock records (the collider of each is removed at the knock); the source drew them as static instances with solid cylinders
    const iT = [], iL = [];
    for (const [x, z] of t) { svc.lamps.push({ x, z, h: 4.2 }); iT.push(ph.addCylinder(x, z, 0.2, 0, 4.2)); }
    for (const [x, z] of l) { svc.lamps.push({ x, z, h: 1.4 }); iL.push(ph.addCylinder(x, z, 0.12, 0, 1.4)); }
    Q.extraTris += knockFurniture(Q.ctx, 'lmgavan-twinlamps', twin, t.map(([x, z, ry]) => ({ x, y: 0, z, rotY: ry + Math.PI / 2 })), iT, FURNITURE_REC.lamp(4.2), 300);
    Q.extraTris += knockFurniture(Q.ctx, 'lmgavan-lowlamps', low, l.map(([x, z]) => ({ x, y: 0, z, rotY: 0 })), iL, { ...FURNITURE_REC.lamp(1.4), mass: 40, r: 0.12, anchored: 12 }, 260);
  });

  stage('boulders', () => {
    // pink-grey granite boulders on the lawn beside the path (photo 24): none on the service way
    const g = new THREE.IcosahedronGeometry(1, 1);
    [[19.0, 60, 0.8], [18.6, 118, 0.7], [19.4, 205, 0.85], [18.8, 290, 0.75], [19.2, 350, 0.7]].forEach(([u, v, r], i) => {
      const pt = FC.W(u, v); if (cover(pt.x, pt.z) > -1.2 || wet(pt.x, pt.z)) return;
      P.geo(M.boulder, g, pt.x, r * 0.42, pt.z, 0, i * 1.3, 0, r, r * 0.62, r * 0.8); ph.addCylinder(pt.x, pt.z, r * 0.8, 0, r * 0.7);
    });
    g.dispose();
  });

  stage('west', () => {
    // the Priboy works wall on the west coping: white-grey plaster 2 m with a darker cap (closed). n4spb: a wall is breakable too (docs/AREAS.md 13.7): bays of 4 m (the source: segments of 8 m + solid boxes)
    const pts = []; for (let v = 19; v <= 411; v += 8) { const p = FC.W(-16.5, v); pts.push([p.x, p.z]); }
    const path = pts, bays = [];
    for (let i = 0; i + 1 < path.length; i++) {
      const [ax, az] = path[i], [bx, bz] = path[i + 1];
      if (cover(ax, az) > -0.3 || cover(bx, bz) > -0.3 || wet(ax, az)) continue;
      bays.push(...splitBays(ax, az, bx, bz, 4, { y: 0 }));
    }
    wallBays(Q, 'lmgavan-westwall', bays, { h: 2.1, capH: 0.15, mat: M.wallGrey, capMat: M.whiteShade, thick: 0.2, capThick: 0.32, uvs: 3, capUvs: 2, tile: 4, solidH: 2.1, colThick: 0.3, mass: 700, anchored: 18, metal: false });
  });

  // services: crowd discs on the promenade near the bridge
  svc.crowd.push({ id: 'promenade', kind: 'stroll', x: -6968, z: 20, r: 12, n: 5 }, { id: 'promenade-mouth', kind: 'photo', x: -6946.0, z: 345.4, r: 5, n: 3 }, { id: 'promenade-mid', kind: 'photo', x: -6970.0, z: 150.4, r: 5, n: 2 });
  svc.photoSpots.push({ x: -6946.0, z: 345.4, yaw: -166, pitch: 4, name: 'Набережная Шкиперского протока: Восточный кроншпиц' }, { x: -6970.0, z: 150.4, yaw: -177, pitch: 2, name: 'Шкиперский проток: канал и кроншпицы' });
  void ball; void densify;
  if (errs.length) throw new Error(errs.join('\n'));
}
