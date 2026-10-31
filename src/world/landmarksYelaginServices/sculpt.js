// landmarksYelaginServices/sculpt.js - the small things of the Stable block, each built once and placed as its own mesh (objs.js): the ROSSI LANTERN POSTS (white cast-iron palmette post on an octagonal pedestal with a
// rosette plate, hooked swan-neck arm, black lantern with milk glass; photos stb_06 stb_11 stb_03 stb_08), the two Manizer BRONZES of the round court on granite plinths (bronzes.js), the fences / gate of the Stable yard
// (fence.js) and the plate of the Stable (labels registry).  Positions of the posts are in the ST frame (frame.js), world positions of the bronzes from the dossier (Commons geotags).
import * as THREE from 'three';
import { figureMats } from '../lib/figures.js';
import * as D from '../data/city.js';
import { ST, STB as S, toWorld } from './frame.js';
import { stage } from './wall.js';
import { geosOf, put } from './objs.js';
import { fenceRun, gateAt } from './fence.js';
import { discobolusFig, discusThrowerFig } from './bronzes.js';

// ------------------------------------------------------------------------------------------------ the Rossi lantern post
export function lampGeo(M) {
  return geosOf((P) => {
    const R = 0.36, h = 1.05, o8 = [];
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; o8.push([Math.sin(a) * R, Math.cos(a) * R]); }
    for (let i = 0; i < 8; i++) {
      const a = o8[i], b = o8[(i + 1) % 8], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
      P.quad(M.white, [a[0] * 1.05, 0, a[1] * 1.05], [b[0] * 1.05, 0, b[1] * 1.05], [b[0], h, b[1]], [a[0], h, a[1]], [dz / l, 0, -dx / l], null);
    }
    P.fan(M.white, o8.map((p) => [p[0], h, p[1]]), [0, 1, 0]);
    P.cyl(M.white, [0, h, 0], [0, h + 0.12, 0], 0.17, 0.12, 8, true);
    P.cyl(M.white, [0, h + 0.12, 0], [0, h + 3.1, 0], 0.075, 0.045, 8, false);
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([s * (0.04 + 0.26 * Math.sin(t * Math.PI) * (1 - t * 0.5)), h + 0.15 + t * 1.45, 0]); }
      for (let i = 0; i < 10; i++) P.cyl(M.white, [pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], 0.022, 0.022, 4, false);
      const g = new THREE.TorusGeometry(0.07, 0.016, 4, 10); P.geo(M.white, g, s * 0.1, h + 0.28, 0, 0, 0, 0, 1, 1, 1); g.dispose();
    }
    const top = h + 3.1, arm = [];
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 0.95; arm.push([0.5 - 0.5 * Math.cos(a), top + 0.5 * Math.sin(a) * 0.9, 0]); }
    for (let i = 0; i < 12; i++) P.cyl(M.white, [arm[i][0], arm[i][1], 0], [arm[i + 1][0], arm[i + 1][1], 0], 0.035 - i * 0.0008, 0.034 - i * 0.0008, 5, false);
    const ex = arm[12][0], ey = arm[12][1];
    P.cyl(M.white, [ex, ey, 0], [ex, ey - 0.25, 0], 0.012, 0.012, 4, false);
    P.box(M.lampGlass, ex - 0.15, ex + 0.15, ey - 0.78, ey - 0.3, -0.15, 0.15, '', 1);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(M.dark, ex + sx * 0.15 - 0.02, ex + sx * 0.15 + 0.02, ey - 0.8, ey - 0.28, sz * 0.15 - 0.02, sz * 0.15 + 0.02, '', 1);
    P.box(M.dark, ex - 0.2, ex + 0.2, ey - 0.84, ey - 0.78, -0.2, 0.2, 'b', 1); P.box(M.dark, ex - 0.2, ex + 0.2, ey - 0.3, ey - 0.26, -0.2, 0.2, 'b', 1);
    const cap = [[ex - 0.2, ey - 0.26, -0.2], [ex + 0.2, ey - 0.26, -0.2], [ex + 0.2, ey - 0.26, 0.2], [ex - 0.2, ey - 0.26, 0.2]], apex = [ex, ey - 0.06, 0];
    for (let i2 = 0; i2 < 4; i2++) P.fan(M.dark, [cap[i2], cap[(i2 + 1) % 4], apex], [(cap[i2][0] + cap[(i2 + 1) % 4][0]) / 2 - ex, 0.6, (cap[i2][2] + cap[(i2 + 1) % 4][2]) / 2], null);
  });
}

/** lamp spots of the Stable in the ST frame: [x, z, arm direction (+1 = towards +x, -1 = towards -x, 's' = south, 'n' = north)] */
export const LAMP_SPOTS = [
  [-9.4, 9.5, 1], [9.4, 9.5, -1], [-3.4, 9.5, 1], [3.4, 9.5, -1],             // the forecourt side of the colonnade
  [-3.6, -19.2, 1], [3.6, -19.2, -1],                                          // flanking the arch in the cross wall
  [-8.0, -38.0, 1], [8.6, -37.0, -1],                                          // the round court
];
function lamps(K) {
  const M = K.M, root = K.root, lamp = lampGeo(M);
  let tris = 0; const placed = [];
  for (const [x, z, dir] of LAMP_SPOTS) {
    const w = toWorld(ST, x, z);
    const rot = ST.rot + (dir > 0 ? 0 : dir < 0 ? Math.PI : dir === 's' ? -Math.PI / 2 : Math.PI / 2);
    tris += put(root, lamp, w.x, 0, w.z, rot, 1, 'yes-lamp');
    K.svc.lamps.push({ x: w.x, z: w.z, h: 4.7 }); placed.push(w);
  }
  K.extraTris += tris; K.shared.lampPos = placed;
}

// ------------------------------------------------------------------------------------------------ the bronzes
export const BRONZES = [
  { id: 'yelagin-discobolus', name: 'Дискобол', x: -4823.0, z: -5329.0, fig: discobolusFig, s: 1.12, nameFull: 'Дискобол. М. Г. Манизер, 1930-е' },
  { id: 'yelagin-discus-thrower', name: 'Метательница диска', x: -4825.0, z: -5323.0, fig: discusThrowerFig, s: 1.12, nameFull: 'Метательница диска. М. Г. Манизер, 1930-е' },
];
function bronzes(K) {
  const M = K.M, root = K.root, mk = figureMats(K.ctx).keys('bronze', 'bronze');
  const cx = -4819.9, cz = -5321.8;
  let tris = 0;
  for (const b of BRONZES) {
    const set = geosOf((P) => b.fig().place(P, mk, 0, 0, 0, 0, b.s));
    const rot = Math.atan2(cx - b.x, cz - b.z);
    // low granite plinth 1.1 x 1.1 x 0.5 (world frame, turned with the court)
    K.P.push(b.x, 0, b.z, ST.rot);
    K.P.box(M.ashlar, -0.55, 0.55, 0, 0.5, -0.55, 0.55, 'b', 1.8); K.P.box(M.ashlar, -0.62, 0.62, 0.5, 0.58, -0.62, 0.62, 'b', 1.8);
    K.P.pop();
    tris += put(root, set, b.x, 0.58, b.z, rot, 1, 'yes-bronze');
    K.svc.monuments.push({ id: b.id, name: b.name, x: b.x, z: b.z, h: 2.3 });
  }
  K.extraTris += tris;
}

// ------------------------------------------------------------------------------------------------ fences and the gate of the Stable yard
function fences(K) {
  const byId = new Map(D.BARRIERS.map((b) => [b.id, b]));
  const gate = D.BARRIER_NODES.find((n) => n.id === 'n6916123786');
  const gates = gate ? [{ x: gate.x, z: gate.z, w: 3.2 }] : [];
  for (const id of ['w736544146', 'w738578586', 'w738578604']) {
    const b = byId.get(id); if (!b) continue;
    const pts = []; for (let i = 0; i < b.pts.length; i += 2) pts.push([b.pts[i], b.pts[i + 1]]);
    fenceRun(K, pts, { h: 2.0, gates: id === 'w738578586' ? gates : [] });
    if (id === 'w738578586' && gate) { const a = pts[1], c = pts[2], l = Math.hypot(c[0] - a[0], c[1] - a[1]); gateAt(K, gate.x, gate.z, (c[0] - a[0]) / l, (c[1] - a[1]) / l); }
  }
}

export function build(K) {
  stage(K, 'sculpt/lamps', () => lamps(K));
  stage(K, 'sculpt/bronzes', () => bronzes(K));
  stage(K, 'sculpt/fences', () => fences(K));
  if (K.errs) throw new Error(K.errs.join('\n'));
}
