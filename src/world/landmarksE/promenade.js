// landmarksE/promenade.js - the pedestrian promenade in front of the Nevsky front of Gostiny Dvor (u 506-731, v 13.5-36; docs/research/gostiny-dvor-ostrovsky.md section 3.6, photos refs/ostrovsky 001 008 013 029):
// pale grey granite slabs with darker strips (OSM area r16467256, clipped at the facade line), a double row of young small-leaved lindens (5-6 m) at the OSM tree nodes, each in a lawn island with a
// granite curb and clipped low shrubs (the 44 OSM flowerbed polygons), and the row of four-sided lanterns on slim dark-green poles with a round granite bench ring round each foot (11 units at
// v 24.5, none in front of the portico).  Bus shelters, the kerb lamps with two globes and the advertising pillars belong to streets / props.
// KNOCKABLE (core/knock.js, lib/knock-inst.js): with ctx.knock the 11 lanterns (pole + lantern, the glass vanishes at the knock) are instances a car at 22 km/h breaks off at the foot; the
// granite bench ring stays in the Parts with its own low collider (the car steps over it). Without ctx.knock the lantern is merged into the Parts as ever.
import * as THREE from 'three';
import { AREAS, GREEN, TREES } from '../data/city.js';
import { PITS } from '../data/metro.js';
import { toUV, toWorld, ringOf, inRing } from './frame.js';
import { Parts, band, ringEdges } from './kit.js';
import { knockInstances } from '../lib/knock-inst.js';

const IN = (x, z) => { const q = toUV(x, z); return q.u > 495 && q.u < 745 && q.v > 8 && q.v < 40; };

/** clip a polygon (uv) to v <= vmax (Sutherland-Hodgman against one half plane) */
function clipV(pts, vmax) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ain = a[1] <= vmax, bin = b[1] <= vmax;
    if (ain) out.push(a);
    if (ain !== bin) { const t = (vmax - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, vmax]); }
  }
  return out;
}

/** the lantern in the collector P: the green cast pole with its collar, the four-sided glass lantern and the pyramid roof; y = the foot level (the numbers are heights above it) */
function lantern(P, iron, glass, x, y, z) {
  P.cyl(iron, [x, y, z], [x, y + 0.28, z], 0.22, 0.17, 8, true);
  P.cyl(iron, [x, y + 0.28, z], [x, y + 4.28, z], 0.1, 0.075, 8, false);
  P.cyl(iron, [x, y + 0.78, z], [x, y + 0.98, z], 0.17, 0.12, 8, true);
  P.cyl(iron, [x, y + 4.23, z], [x, y + 4.48, z], 0.2, 0.16, 6, true);
  P.cyl(glass, [x, y + 4.48, z], [x, y + 5.28, z], 0.4, 0.42, 4, true);                           // four-sided lantern (4-gon prism)
  P.cyl(iron, [x, y + 5.28, z], [x, y + 5.83, z], 0.52, 0.03, 4, true);                           // pyramid roof with a spike
}
/** the knock template of the lantern (foot at y 0): one geometry per material, the glass part vanishes at the knock */
function lanternModel(iron, glass) {
  const T = new Parts();
  lantern(T, iron, glass, 0, 0, 0);
  return T.build(new THREE.Group()).map((m) => ({ geo: m.geometry, mat: m.material, shadow: m.castShadow, receive: m.receiveShadow, hide: m.material === glass }));
}
const LANTERN_Y = 0.12, LANTERN_H = 5.83;

export function build(K, ctx) {
  const P = K.P, M = K.G.M, ph = ctx.physics;
  // ---- paving: the OSM polygon, clipped at v = 35.4 (the facade plane is v ~ 35.2), laid at the pavement level
  const area = AREAS.find((a) => a.id === 'r16467256');
  if (area) {
    const lineV = (u) => 35.8 - 0.0059 * (u - 522.8);
    const uv = ringOf(area.polys[0].o).map((p) => { const q = toUV(p[0], p[1]); return [q.u, q.v - lineV(q.u)]; });
    const clipped = clipV(uv, -0.06).map(([u, v]) => toWorld(u, v + lineV(u)));
    // One of the four Nevsky pedestrian underpasses opens inside this OSM paving.
    const holes = PITS.map(p => [[-2.30,0],[-2.30,4.60],[2.30,4.60],[2.30,0]].map(([side,along]) =>
      [p.mouth[0]+p.e[1]*side+p.e[0]*along, p.mouth[1]-p.e[0]*side+p.e[1]*along]))
      .filter(ring => ring.every(([x,z]) => inRing(clipped,x,z)));
    P.cap(M.pave, clipped, 0.12, true, 2.4, holes);
  }
  // ---- islands: lawn + curb + clipped shrubs, one young linden per OSM tree node
  const islandMat = M.lawn, shrub = K.mat('#4c7f40', { name: 'lmE-boxwood' });
  const ico = new THREE.IcosahedronGeometry(1, 0);
  let n = 0;
  for (const g of GREEN) {
    if (g.kind !== 'flowerbed') continue;
    const o = ringOf(g.polys[0].o); if (!IN(o[0][0], o[0][1])) continue;
    P.cap(islandMat, o, 0.145, true, 4);
    const ed = ringEdges({ o: g.polys[0].o, h: [] }, 0.1);
    band(P, ed, 0.12, 0.17, 0.12, { front: M.graniteGrey, top: M.graniteGrey }, {});
    let cx = 0, cz = 0; for (const p of o) { cx += p[0]; cz += p[1]; } cx /= o.length; cz /= o.length;
    for (const [dx, dz, r] of [[0.7, 0.5, 0.42], [-0.6, 0.6, 0.38], [0.1, -0.8, 0.4]]) P.geo(shrub, ico, cx + dx, 0.15 + r * 0.7, cz + dz, 0, 0, 0, r, r * 0.8, r);
    n++;
  }
  ico.dispose();
  let nt = 0;
  for (let i = 0; i + 1 < TREES.length; i += 2) { const x = TREES[i], z = TREES[i + 1]; if (!IN(x, z)) continue; K.trees.add(x, z, { kind: 'young', h: 5.6 + ((i * 7) % 5) * 0.2, r: 1.55, trunk: 2.1 }); nt++; }
  // ---- lanterns with granite bench rings (v 24.5), none in front of the portico (u 604-639)
  const iron = M.ironGreen, glass = K.G.M.lanternGlass || (K.G.M.lanternGlass = ctx.mat.emissive('#ffd9a0', 0.55));
  const us = [570, 581, 592, 604, 639, 650, 662, 674, 685, 696, 708];
  const lampSpots = [], lampItems = [];
  for (const u of us) {
    const [x, z] = toWorld(u, 24.5);
    if (ctx.knock) lampSpots.push({ x, y: LANTERN_Y, z, rotY: 0 }); else lantern(P, iron, glass, x, LANTERN_Y, z);
    // round granite bench ring, 2 m across, 0.45 m high
    const seg = 14, r0 = 0.95, r1 = 1.5;
    for (let k = 0; k < seg; k++) {
      const a0 = k / seg * Math.PI * 2, a1 = (k + 1) / seg * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      P.quad(M.graniteGrey, [x + c0 * r0, 0.45, z + s0 * r0], [x + c0 * r1, 0.45, z + s0 * r1], [x + c1 * r1, 0.45, z + s1 * r1], [x + c1 * r0, 0.45, z + s1 * r0], [0, 1, 0]);
      P.quad(M.graniteGrey, [x + c0 * r1, 0.0, z + s0 * r1], [x + c1 * r1, 0.0, z + s1 * r1], [x + c1 * r1, 0.45, z + s1 * r1], [x + c0 * r1, 0.45, z + s0 * r1], [c0 + c1, 0, s0 + s1]);
      P.quad(M.graniteGrey, [x + c1 * r0, 0.0, z + s1 * r0], [x + c0 * r0, 0.0, z + s0 * r0], [x + c0 * r0, 0.45, z + s0 * r0], [x + c1 * r0, 0.45, z + s1 * r0], [-(c0 + c1), 0, -(s0 + s1)]);
    }
    ph.addCylinder(x, z, 1.5, 0, 0.45); lampItems.push(ph.addCylinder(x, z, 0.2, 0, 5));
    K.svc.benches.push({ x, z, rotY: 0, len: 3.0 }); K.svc.lamps.push({ x, z, h: 6 });
  }
  if (ctx.knock && lampSpots.length) knockInstances(ctx, { name: 'lmE-lantern', parts: lanternModel(iron, glass), spots: lampSpots, items: lampItems, far: 260,
    rec: { kind: 'lamp', mass: 300, h: LANTERN_H, r: 0.2, anchored: 22, hitK: 0.5, metal: true } });
  K.svc.spots.promenade = { islands: n, trees: nt, lanterns: us.length };
  perinnayaPortico(K, ctx);
}

// ------------------------------------------------------------------------------------------------ the Perinnaya-line portico (Nevsky 35, "Перинные ряды", Rusca 1805, rebuilt 1972)
// The north wall of the building at Dumskaya 2 is OSM w53610231. City owns
// its walls and roof. The colonnade and pediment project from its surveyed edge.
import { tuscan } from './columns.js';
export function perinnayaPortico(K, ctx) {
  const P = K.P, M = K.G.M, white = M.white, wall = K.wall('#f0d890');
  const a = [-1203.3,-222.6], b = [-1190.2,-214.4];
  const x = (a[0]+b[0])/2, z = (a[1]+b[1])/2;
  const width = Math.hypot(b[0]-a[0],b[1]-a[1]), half = width/2;
  const yaw = Math.atan2(b[1]-a[1],a[0]-b[0]);
  P.push(x,0,z,yaw);
  P.box(M.plinth,-half,half,0,.27,-.02,2.68,'b');
  P.box(wall,-half,half,.27,6.42,-.02,.34,'b');
  for (const t of [-.88,-.67,-.22,.22,.67,.88]) {
    const u = t*half;
    tuscan(K,white,u,1.77,.27,5.86,.34,12);
    const e=P.m.elements;
    ctx.physics.addCylinder(e[0]*u+e[8]*1.77+e[12], e[2]*u+e[10]*1.77+e[14],.36,0,6.18);
  }
  for (const t of [-.63,0,.63]) {
    P.push(0,0,.34,0);
    K.window({x:t*half,y:.40,w:2.02,h:4.3,head:'arch',sw:.18,d:.10,frame:'white',surMat:white,sillMat:white,sill:false});
    P.pop();
  }
  P.box(white,-half-.16,half+.16,6.10,6.48,-.06,2.29,'b');
  P.box(wall,-half,half,6.48,6.90,-.04,2.21,'b');
  P.box(white,-half-.27,half+.27,6.90,7.13,-.08,2.38,'b');
  const pediment=new THREE.Shape();
  pediment.moveTo(-half-.25,7.13);pediment.lineTo(half+.25,7.13);pediment.lineTo(0,9.23);pediment.closePath();
  P.extrude(white,pediment,-.03,2.36,1,4);
  const field=new THREE.Shape();
  field.moveTo(-half+.69,7.35);field.lineTo(half-.69,7.35);field.lineTo(0,9.00);field.closePath();
  P.extrude(wall,field,2.34,.055,1,4);
  P.pop();
  K.svc.monuments.push({id:'perinnaya-portico',name:'Портик Перинной линии',nameEn:'Perinnaya line portico',x,z,h:9.23});
}
