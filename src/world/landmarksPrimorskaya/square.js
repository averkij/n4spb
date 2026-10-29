// landmarksPrimorskaya/square.js - the SQUARE before the west end of the vestibule and the frontage of the Metro Museum: the two benches and two litter bins of the OSM data (the claimed nodes n8048805552 / n10795206854 /
// n12736971860 / n12736971861: props/osm.js leaves a claimed bench / bin to the owner), a blue М totem, three lamp posts, six granite planters, the signboard of the Museum of the Petersburg Metro. EVERYTHING is a knock record
// (lib/knock-furniture.js: its collider is removed at the knock, a rest box of at most 0.42 m takes its place): benches, bins, planters, the lamps and the totem (anchored poles), the museum sign (a post-and-board record).
// The positions of the extra pieces are searched on free ground (not in a building, not on a road or a footway, 40 m from the water): see `spot`.
import * as L from '../layout.js';
import { FURNITURE } from '../data/city.js';
import { partsGeos } from './inst.js';
import { knockInstances } from '../lib/knock-inst.js';
import { FURNITURE_REC } from '../lib/knock-furniture.js';

const NODES = { bench: ['n8048805552', 'n10795206854'], bin: ['n12736971860', 'n12736971861'] };
const FRONT = [-6533.6, -1795.0];                                      // the middle of the west end of the hall: the benches turn to it
const MUSEUM = [-6496, -1754];
const free = (x, z, r = 1) => !L.insideBuilding(x, z, r) && !L.isOnRoad(x, z, r, { all: true }) && L.waterLevelAt(x, z) == null && L.shoreDist(x, z) > 12;
/** a free spot at about (x, z): the first of a ring search (step 1 m up to rmax) that passes `free` with the margin r and the extra test */
function spot(x, z, r = 1, rmax = 14, test = null) {
  if (free(x, z, r) && (!test || test(x, z))) return [x, z];
  for (let d = 1; d <= rmax; d++) for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (free(px, pz, r) && (!test || test(px, pz))) return [px, pz]; }
  return null;
}
const yawTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);          // the rotY that turns a local +z (the front of the piece) to the target

export function square(K) {
  const { ctx, M, S } = { ctx: K.ctx, M: K.M, S: K.svc }, PAL = M.PAL;
  const T = K.THREE;
  const geos = {
    bench: partsGeos((P) => { P.tint('#6e7378').box(M.vc, -0.9, -0.82, 0, 0.42, -0.2, 0.2, 'b', 1).box(M.vc, 0.82, 0.9, 0, 0.42, -0.2, 0.2, 'b', 1); P.tint(PAL.wood); for (const z of [-0.18, 0.02, 0.2]) P.box(M.vc, -0.95, 0.95, 0.42, 0.47, z - 0.08, z + 0.08, '', 1); for (const y of [0.62, 0.8]) P.box(M.vc, -0.95, 0.95, y, y + 0.1, -0.25, -0.2, '', 1); }),
    bin: partsGeos((P) => { P.tint('#34393d').cyl(M.vc, [0, 0, 0], [0, 0.78, 0], 0.26, 0.3, 10, true); P.tint('#1f2326').cyl(M.vc, [0, 0.78, 0], [0, 0.84, 0], 0.32, 0.32, 10, true); }),
    planter: partsGeos((P) => { P.tint(PAL.concreteDark).box(M.vc, -0.6, 0.6, 0, 0.5, -0.3, 0.3, 'b', 1); P.tint('#4a3a2c').box(M.vc, -0.52, 0.52, 0.5, 0.52, -0.22, 0.22, 'b', 1); P.tint(PAL.shrub); for (const x of [-0.3, 0.1, 0.4]) P.geo(M.vc, new T.IcosahedronGeometry(0.3, 0), x, 0.78, 0, 0, 0, 0, 1, 0.85, 0.9); }),
    lamp: partsGeos((P) => { P.tint('#585e64').box(M.vc, -0.06, 0.06, 0, 6.2, -0.06, 0.06, 'b', 1).box(M.vc, -0.14, 0.14, 0, 0.7, -0.14, 0.14, 'b', 1); P.box(M.vc, -0.5, 0.5, 6.1, 6.18, -0.05, 0.05, '', 1); for (const x of [-0.45, 0.45]) P.tint('#d8d6cc').box(M.vc, x - 0.22, x + 0.22, 6.2, 6.32, -0.12, 0.12, 'b', 1); }),
    totem: partsGeos((P) => { P.tint('#e4e4de').box(M.vc, -0.2, 0.2, 0, 4.4, -0.2, 0.2, 'b', 1); P.tint('#2f6fa1').box(M.vc, -0.3, 0.3, 4.4, 5.6, -0.3, 0.3, '', 1); for (const z of [-0.305, 0.305]) P.quad(M.signM, [-0.5, 4.5, z], [0.5, 4.5, z], [0.5, 5.5, z], [-0.5, 5.5, z], [0, 0, z > 0 ? 1 : -1]); }),
    sign: partsGeos((P) => { P.tint('#5b6066').box(M.vc, -1.08, -1.0, 0, 2.2, -0.05, 0.05, 'b', 1).box(M.vc, 1.0, 1.08, 0, 2.2, -0.05, 0.05, 'b', 1); for (const z of [-0.06, 0.06]) P.quad(M.signMuseumMat, [-1.0, 1.35, z], [1.0, 1.35, z], [1.0, 2.15, z], [-1.0, 2.15, z], [0, 0, z > 0 ? 1 : -1]); P.tint('#3d4247').box(M.vc, -1.02, 1.02, 1.3, 1.35, -0.07, 0.07, '', 1).box(M.vc, -1.02, 1.02, 2.15, 2.2, -0.07, 0.07, '', 1); }),
  };
  const kinds = [];
  // the four OSM pieces
  const osm = (ids, kind) => ids.map((id) => FURNITURE.find((f) => f.id === id)).filter(Boolean).map((f) => ({ x: f.x, z: f.z, yaw: kind === 'bench' ? yawTo(f.x, f.z, FRONT[0], FRONT[1]) : 0 }));
  kinds.push({ name: 'bench', geo: geos.bench, list: osm(NODES.bench, 'bench'), rec: FURNITURE_REC.bench, col: (s) => ctx.physics.addBox(s.x, s.z, 1.9, 0.6, s.rotY, 0, 0.9), far: 260 });
  kinds.push({ name: 'bin', geo: geos.bin, list: osm(NODES.bin, 'bin'), rec: FURNITURE_REC.bin, col: (s) => ctx.physics.addCylinder(s.x, s.z, 0.3, 0, 0.9), far: 220 });
  // the extra pieces on free ground round the west end of the hall: the totem on the approach footway, lamps, planters
  const extra = (pts, r, rmax, test) => pts.map(([x, z]) => spot(x, z, r, rmax, test)).filter(Boolean);
  const keepApart = (a) => { const out = []; for (const p of a) if (!out.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 3)) out.push(p); return out; };
  const nearHall = (x, z) => Math.hypot(x - FRONT[0], z - FRONT[1]) > 4;
  const totem = extra([[-6541, -1790]], 1.2, 8, nearHall).map(([x, z]) => ({ x, z, yaw: yawTo(x, z, -6560, -1795) }));
  const lamps = keepApart(extra([[-6540, -1786], [-6545, -1803], [-6528, -1810], [-6514, -1782]], 1, 8, nearHall)).map(([x, z]) => ({ x, z, yaw: 0 }));
  const planters = keepApart(extra([[-6537, -1800.5], [-6539, -1790], [-6535.5, -1788], [-6530, -1807.5], [-6542.5, -1795.5], [-6526.5, -1812]], 0.9, 6, nearHall)).map(([x, z]) => ({ x, z, yaw: yawTo(x, z, FRONT[0], FRONT[1]) + Math.PI / 2 }));
  kinds.push({ name: 'totem', geo: geos.totem, list: totem, rec: FURNITURE_REC.lamp(5.6), col: (s) => ctx.physics.addCylinder(s.x, s.z, 0.35, 0, 5.6), far: 500 });
  kinds.push({ name: 'lamp', geo: geos.lamp, list: lamps, rec: FURNITURE_REC.lamp(6.3), col: (s) => ctx.physics.addCylinder(s.x, s.z, 0.2, 0, 6.3), far: 420 });
  kinds.push({ name: 'planter', geo: geos.planter, list: planters, rec: { kind: 'planter', mass: 220, h: 1.1, w: 1.2, d: 0.6, hitK: 0.2 }, col: (s) => ctx.physics.addBox(s.x, s.z, 1.2, 0.6, s.rotY, 0, 0.55), far: 220 });
  // the museum signboard at its frontage: the first free spot 4 m south of the POI (the complex w85426975 is a skip parent with raised parts: no ground footprint in the data; the footway w386389914 runs 5 m further south), the board faces south
  const sg = spot(MUSEUM[0], MUSEUM[1] + 4, 1.4, 14);
  if (sg) kinds.push({ name: 'museum-sign', geo: geos.sign, list: [{ x: sg[0], z: sg[1], yaw: 0 }], rec: { kind: 'sign', mass: 120, h: 2.2, w: 2.2, d: 0.2, anchored: 14, hitK: 0.25, metal: true, minDv: 0 }, col: (s) => ctx.physics.addBox(s.x, s.z, 2.2, 0.2, s.rotY, 0, 2.2), far: 300 });
  let tris = 0;
  for (const k of kinds) {
    if (!k.list.length) continue;
    const spots = k.list.map((p) => ({ x: p.x, y: 0, z: p.z, rotY: p.yaw }));
    const items = spots.map((s) => { S.colliders++; return k.col(s); });
    const parts = k.geo.list.map((p, i) => ({ geo: p.geo, mat: p.mat, name: 'p' + i, noOutline: p.mat === M.signM || p.mat === M.signMuseumMat || undefined }));
    knockInstances(ctx, { name: 'lmprim-' + k.name, parts, spots, items, rec: k.rec, far: k.far });
    for (const { geo } of k.geo.list) tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3 * spots.length;
    S.knock += spots.length; S.furniture[k.name] = spots.map((s) => [Math.round(s.x * 10) / 10, Math.round(s.z * 10) / 10]);
  }
  return tris;
}
