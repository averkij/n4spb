// props/state.js - the shared state of one props build: world raster, the occupancy registry (spatial hash of discs), the instance lists of every repeated
// prop type, the colliders, the published service lists, plus the pavement "stations" (resampled sidewalk centrelines of the streets module with the free
// width towards the building and towards the carriageway) that the placement modules walk along. Adapted from the Yakutsk props/state.js.
// Registry seeds (what earlier modules already put on the ground): streets lamps / bus stops / crossings, city entrances, monuments, landmarksA's forecourt
// furniture (benches, bins, racks, lamp groups, planters, pillars, booths: all inside the station frame zone, S.inForecourt), the rail module's lists, landmarksB entrances.
// KNOCKABLES (core/knock.js, only when ctx.knock exists; without it the module builds exactly what it always built): the KNOCK types below are filed per 384 m cell (S.kinst), and
// S.add(type) followed by the collider call (S.box / S.solidBox / S.solidCyl) at the same spot pairs the instance with its collider (S.link). flushInstances builds one Dynamic
// InstancedMesh per type and cell, registers every pair with ctx.knock and gives each mesh an explicit LOD distance. Everything else keeps its whole-strip static mesh.
import * as THREE from 'three';
import * as L from '../layout.js';
import { AREAS, GREEN } from '../data/city.js';
import { buildWorld, F } from './world.js';
import { placeM, vcMat, instanced, hash01, clamp, makePanels, nightMat, staticMesh, ringHas } from './kit.js';
import { signTextures } from './signs.js';
import { streetTrackDist } from '../streets/net.js';
import { registerLOD } from '../../core/spatial.js';

const INST_CELL = 384;

const BENCH_LENGTHS = { benchPark: 1.8, benchParkD: 1.8, benchParkL: 2.1, benchWhite: 1.9, benchWhiteL: 2.3, benchGranite: 2.0 };

// KNOCKABLE TYPES: what the driven car can knock over and throw (mass kg, size m: r for round things, w x d for boxes, hitK = how much of a wall's blow the car takes, anchored = the
// break speed in km/h of the car at contact, 0 = free, far = LOD range in m). The instance origin is the foot of every one of them. Not listed (stay solid): scooters, kiosks, stalls,
// cabins, A-frames, pillars, city-lights (their posters and fascias are merged world-space panels: S.attach / S.panelObj make them travel, see ads.js / stands.js), terraces, heaters, clocks.
const bench = (mass, w, o = {}) => ({ kind: 'bench', mass, h: 0.9, w, d: 0.6, hitK: 0.25, minDv: 0.5, far: 220, ...o });
const bin = (mass, h, r, hitK, o = {}) => ({ kind: 'bin', mass, h, r, hitK, metal: true, minDv: 0.5, far: 170, ...o });
const urn = (mass, h, r, hitK) => ({ kind: 'urn', mass, h, r, hitK, metal: true, minDv: 0.8, far: 200 });
const cart = (h) => ({ kind: 'cart', mass: 110, h, w: 1.3, d: 1.0, hitK: 0.3, minDv: 0.5, far: 220 });
const KNOCK = {
  benchPark: bench(45, 1.8), benchParkD: bench(45, 1.8), benchParkL: bench(52, 2.1), benchWhite: bench(48, 1.9), benchWhiteL: bench(58, 2.3), benchGranite: bench(420, 2.0, { hitK: 0.6, minDv: 0.8 }),
  binCast: bin(30, 0.78, 0.26, 0.15), binSteel: bin(14, 0.88, 0.2, 0.12), binCube: bin(70, 0.64, 0.3, 0.2, { metal: false }),
  pot0: { kind: 'pot', mass: 10, h: 0.5, r: 0.21, hitK: 0.08, minDv: 0.4, far: 150 }, pot1: { kind: 'pot', mass: 10, h: 0.5, r: 0.21, hitK: 0.08, minDv: 0.4, far: 150 },
  urnCast0: urn(110, 0.95, 0.4, 0.25), urnCast1: urn(110, 0.95, 0.4, 0.25), urnCastBig: urn(190, 1.14, 0.45, 0.3),
  tubBirch: { kind: 'tub', mass: 250, h: 2.7, r: 0.5, hitK: 0.3, minDv: 1.0, far: 220 }, tubMaple: { kind: 'tub', mass: 250, h: 2.7, r: 0.5, hitK: 0.3, minDv: 1.0, far: 220 }, tubLilac: { kind: 'tub', mass: 250, h: 2.7, r: 0.5, hitK: 0.3, minDv: 1.0, far: 220 },
  planterR0: { kind: 'planter', mass: 450, h: 0.5, r: 0.62, hitK: 0.35, minDv: 1.2, far: 200 }, planterR1: { kind: 'planter', mass: 450, h: 0.5, r: 0.62, hitK: 0.35, minDv: 1.2, far: 200 },
  rack3: { kind: 'rack', mass: 25, h: 0.75, w: 1.5, d: 0.4, anchored: 8, hitK: 0.1, metal: true, minDv: 0, far: 170 }, rack5: { kind: 'rack', mass: 25, h: 0.75, w: 2.7, d: 0.4, anchored: 8, hitK: 0.1, metal: true, minDv: 0, far: 170 },
  postBox: { kind: 'postbox', mass: 70, h: 1.28, w: 0.42, d: 0.36, anchored: 18, hitK: 0.3, metal: true, minDv: 0, far: 200 },
  cabinet: { kind: 'cabinet', mass: 120, h: 1.33, w: 0.66, d: 0.4, anchored: 20, hitK: 0.35, metal: true, minDv: 0, far: 170 },
  iceCart0: cart(3.0), iceCart1: cart(3.0), iceCart2: cart(3.0), cartRed: cart(2.3), iceCartHood: cart(2.0),
  // phase 2 (packages C, D: the types with detached posters / fascias; the rows are the plan's first values, tuned live)
  pillar: { kind: 'column', mass: 1500, h: 3.1, r: 0.68, anchored: 45, hitK: 1.0, metal: true, minDv: 0, far: 400 },
  cityLight: { kind: 'citylight', mass: 150, h: 2.5, w: 1.3, d: 0.45, anchored: 20, hitK: 0.4, metal: true, minDv: 0, far: 220 },
  pressKiosk: { kind: 'kiosk', mass: 650, h: 2.8, w: 2.4, d: 1.6, hitK: 0.8, minDv: 0.5, far: 420 }, pressKiosk2: { kind: 'kiosk', mass: 700, h: 2.6, w: 1.8, d: 1.8, hitK: 0.8, minDv: 0.5, far: 420 },
  excKiosk: { kind: 'kiosk', mass: 500, h: 2.7, w: 2.3, d: 2.3, hitK: 0.7, minDv: 0.5, far: 420 },
  cabinIce: { kind: 'kiosk', mass: 600, h: 2.6, w: 2.4, d: 1.8, hitK: 0.7, minDv: 0.5, far: 420 }, cabinSouv: { kind: 'kiosk', mass: 600, h: 2.6, w: 2.4, d: 1.8, hitK: 0.7, minDv: 0.5, far: 420 }, cabinBoats: { kind: 'kiosk', mass: 600, h: 2.6, w: 2.4, d: 1.8, hitK: 0.7, minDv: 0.5, far: 420 },
  ticketBooth: { kind: 'booth', mass: 400, h: 2.35, w: 1.5, d: 1.5, hitK: 0.6, minDv: 0.5, far: 300 },
  cartHot0: cart(1.1), cartHot1: cart(1.1), cartSouv: cart(1.1),
  aFrameR: { kind: 'aframe', mass: 6, h: 1.0, w: 0.6, d: 0.8, hitK: 0.05, minDv: 0.3, far: 150 }, aFrameK: { kind: 'aframe', mass: 6, h: 1.0, w: 0.6, d: 0.8, hitK: 0.05, minDv: 0.3, far: 150 },
};

class Placed {                                              // spatial hash of occupied discs
  constructor() { this.h = new Map(); this.n = 0; }
  k(x, z) { return Math.floor(x / 6) + ',' + Math.floor(z / 6); }
  add(x, z, r, tag = '') { const key = this.k(x, z); let a = this.h.get(key); if (!a) this.h.set(key, (a = [])); a.push([x, z, r, tag]); this.n++; }
  near(x, z, r, tag = null) {
    const i0 = Math.floor((x - r - 6) / 6), i1 = Math.floor((x + r + 6) / 6), j0 = Math.floor((z - r - 6) / 6), j1 = Math.floor((z + r + 6) / 6);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const a = this.h.get(i + ',' + j); if (a) for (const p of a) if ((tag === null || p[3] === tag) && Math.hypot(p[0] - x, p[1] - z) < p[2] + r) return true; }
    return false;
  }
}

export function makeState(ctx) {
  const env = ctx.services.environment, st = ctx.services.streets, city = ctx.services.city, lm = ctx.services.landmarks, rail = ctx.services.rail;
  const S = {
    ctx, L, F, W: buildWorld(ctx), R: ctx.rng('spb-props'), placed: new Placed(),
    svc: { benches: [], lamps: [], bins: [], shelters: [], kiosks: [], racks: [], terraces: [], pillars: [], planters: [], clocks: [], stalls: [], urns: [], boxes: [] },
    inst: new Map(), geos: new Map(), stats: {}, tris: 0,
    kinst: new Map(), knockables: [], last: null,              // knock types by 'type|cx,cz' -> { name, list: Matrix4[] }; the linked (instance, collider) pairs; the instance added last
    root: new THREE.Group(),
  };
  S.root.name = 'props'; ctx.addStatic(S.root);
  S.vc = vcMat(ctx);
  S.panels = makePanels(ctx); S.sign = signTextures(ctx);
  S.env = env; S.st = st; S.city = city; S.lm = lm; S.rail = rail;

  /** warm lamp lens that glows at night (vertex-coloured, instanced) */
  S.nightGlow = (color = '#fff3d0') => nightMat(ctx, color, 0.65, 2.8, { vertexColors: true });
  /** a Geo as one static mesh at the origin (the batcher merges it by material) */
  S.addStaticGeo = (geo, name = 'pr-static', mat = null, o = {}) => staticMesh(ctx, geo, mat || S.vc, 0, 0, 0, 0, { name, ...o });
  /** register an instanced prop type: S.type(name, () => Geo, {mat}) once; S.add(name, x, z, rotY, {y, s}) per instance */
  S.type = (name, mk, o = {}) => { S.geos.set(name, { mk, o }); };
  S.add = (name, x, z, rotY = 0, o = {}) => {
    const y = o.y ?? S.levelAt(x, z), m = placeM(x, y, z, rotY, o.s ?? 1, new THREE.Matrix4());
    if (ctx.knock && KNOCK[name]) {                              // a knockable: filed per 384 m cell, remembered for the collider call that follows
      const key = name + '|' + Math.floor(x / INST_CELL) + ',' + Math.floor(z / INST_CELL);
      let a = S.kinst.get(key); if (!a) S.kinst.set(key, (a = { name, list: [] }));
      a.list.push(m); S.last = { name, m, x, y, z, rotY, s: o.s ?? 1, linked: false, extra: [], rec: null };
      return;
    }
    let a = S.inst.get(name); if (!a) S.inst.set(name, (a = []));
    a.push(m); S.last = null;
  };
  /** the collider just added belongs to the instance just added (same spot, within 1 m, not yet linked): remember the pair for the knock registry; returns the collider */
  S.link = (item, cx, cz) => {
    const l = S.last; if (!l || l.linked || !item || Math.hypot(l.x - cx, l.z - cz) > 1.0) return item;
    l.linked = true; l.rec = { ...l, item }; S.knockables.push(l.rec); S.lastLinked = l.rec; return item;
  };
  /** an extra object (a standalone poster / fascia from S.panelObj, a wrap) that travels with the knockable just linked; false when the last instance is not a linked knockable */
  S.attach = (obj) => { const r = S.last && S.last.rec; if (!r || !obj) return false; r.extra.push({ obj }); return true; };
  /** a textured quad as a standalone mesh in the dynamic root (see makePanels.object); S.attach it to a knockable */
  S.panelObj = (tex, cx, cy, cz, nx, nz, w, h, o = {}) => S.panels.object(tex, cx, cy, cz, nx, nz, w, h, o);
  /** disc registry + raster reservation in one call */
  S.occupy = (x, z, r, tag = '') => { S.placed.add(x, z, r, tag); S.W.reserve(x, z, Math.min(r, 2.5)); };
  S.solidBox = (cx, cz, w, d, rotY, h = 1.0, y0 = 0) => S.link(ctx.physics.addBox(cx, cz, w, d, rotY, y0, h), cx, cz);
  S.solidCyl = (x, z, r, h = 1.0) => S.link(ctx.physics.addCylinder(x, z, r, 0, h), x, z);
  S.box = (cx, cz, w, d, rotY, h, o = {}) => {                 // collider + raster reservation + registry for an oriented box
    if (o.collide !== false) S.solidBox(cx, cz, w, d, rotY, h);
    S.W.reserveBox(cx, cz, w, d, rotY); S.placed.add(cx, cz, Math.min(Math.hypot(w, d) / 2, o.r ?? 1.2), o.tag || '');
  };

  /** Final bench footprint, after OSM nudging / facade or path alignment. The
   * actual variant and collider share these conservative dimensions. A sampled
   * 1.9 m tram-axis margin leaves more than the audit's 1.35 m clearance even
   * between the <= 0.5 m grid samples. Commit render, collision and service data
   * together only after both the asphalt and open-tram checks pass. */
  S.placeBench = (name, x, z, rotY, depth = 0.6, radius = 1.0) => {
    const len = BENCH_LENGTHS[name]; if (!len) throw new Error(`Unknown bench variant: ${name}`);
    const d = Math.max(0.6, depth), c = Math.cos(rotY), s = Math.sin(rotY), nx = Math.ceil(len / 0.5), nz = Math.ceil(d / 0.5);
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
      const u = -len / 2 + len * i / nx, v = -d / 2 + d * j / nz, px = x + c * u + s * v, pz = z - s * u + c * v;
      if (st?.net ? st.net.cover(px, pz, {}) >= -0.5 : L.isOnRoad(px, pz, 0.5)) return false;
      if (streetTrackDist(px, pz) < 1.9) return false;
    }
    S.add(name, x, z, rotY); S.svc.benches.push({ x, z, rotY, len });
    S.box(x, z, len, d, rotY, 0.9, { r: radius, tag: 'bench' });
    return true;
  };

  // ---- gardens (park / garden / grass / recreation ground, claimed or not): S.gardenAt(x, z) -> true inside one (the benches there are the white-painted garden benches)
  { const ga = new Map(), rings = [];
    for (const g of GREEN) { if (!(g.kind === 'park' || g.kind === 'garden' || g.kind === 'grass' || g.kind === 'recreation_ground')) continue;
      for (const p of g.polys) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < p.o.length; i += 2) { x0 = Math.min(x0, p.o[i]); x1 = Math.max(x1, p.o[i]); z0 = Math.min(z0, p.o[i + 1]); z1 = Math.max(z1, p.o[i + 1]); }
        const e = { o: p.o, h: p.h || [], b: [x0, x1, z0, z1] }; rings.push(e);
        for (let i = Math.floor(x0 / 64); i <= Math.floor(x1 / 64); i++) for (let j = Math.floor(z0 / 64); j <= Math.floor(z1 / 64); j++) { const k = i + ',' + j; let a = ga.get(k); if (!a) ga.set(k, (a = [])); a.push(e); } } }
    S.gardenAt = (x, z) => { for (const e of ga.get(Math.floor(x / 64) + ',' + Math.floor(z / 64)) || []) { if (x < e.b[0] || x > e.b[1] || z < e.b[2] || z > e.b[3]) continue; if (ringHas(e.o, x, z) && !e.h.some((h) => ringHas(h, x, z))) return true; } return false; }; }
  // ---- levels: paving of the squares (0.10), pavement strips (0.12), else the ground (0)
  const ROAD_AREA = new Set(['primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'service', 'living_street', 'traffic_island', 'yes']);
  const areaRings = AREAS.filter((a) => !a.tunnel && !a.bridge && !ROAD_AREA.has(a.hw)).flatMap((a) => a.polys.map((p) => p.o)).map((o) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < o.length; i += 2) { x0 = Math.min(x0, o[i]); x1 = Math.max(x1, o[i]); z0 = Math.min(z0, o[i + 1]); z1 = Math.max(z1, o[i + 1]); } return { o, b: [x0, x1, z0, z1] }; });
  const areaGrid = new Map();                                          // 32 m hash grid of the paving rings
  for (const a of areaRings) for (let i = Math.floor(a.b[0] / 32); i <= Math.floor(a.b[1] / 32); i++) for (let j = Math.floor(a.b[2] / 32); j <= Math.floor(a.b[3] / 32); j++) { const k = i + ',' + j; let g = areaGrid.get(k); if (!g) areaGrid.set(k, (g = [])); g.push(a); }
  S.levelAt = (x, z) => {
    for (const a of areaGrid.get(Math.floor(x / 32) + ',' + Math.floor(z / 32)) || []) if (x >= a.b[0] && x <= a.b[1] && z >= a.b[2] && z <= a.b[3] && ringHas(a.o, x, z)) return L.SURFACE.sidewalk - 0.02;
    if (!st || !st.nearestSidewalk) return 0;
    const q = st.nearestSidewalk(x, z, 4.2); if (!q) return 0;
    const rd = S.W.roadDist(x, z);
    return q.dist <= 3.7 && rd > 0.1 && rd < 9.5 ? L.SURFACE.sidewalk : 0;
  };

  // ---- the station frame of landmarksA (u along the facade, d towards the tracks): the forecourt is furnished by that module
  const sf = (lm && lm.stationFrame) || { O: { x: 602.7, z: 242.9 }, theta: 10.05 * Math.PI / 180 };
  const E = [Math.cos(sf.theta), -Math.sin(sf.theta)], B = [Math.sin(sf.theta), Math.cos(sf.theta)];
  S.stationW = (u, d) => [sf.O.x + E[0] * u + B[0] * d, sf.O.z + E[1] * u + B[1] * d];
  S.stationUV = (x, z) => { const dx = x - sf.O.x, dz = z - sf.O.z; return [dx * E[0] + dz * E[1], dx * B[0] + dz * B[1]]; };
  /** the part of the station forecourt that landmarksA has furnished (benches, bins, racks, lamp groups, planters, pillars, booths) */
  S.inForecourt = (x, z, m = 0) => { const [u, d] = S.stationUV(x, z); return u > -86 - m && u < 86 + m && d > -80 - m && d < 12 + m; };

  // ---- registry seeds: what the earlier modules already put on the ground
  S.doorBoxes = [];
  const doorGrid = new Map();                                          // 8 m hash grid of the door boxes (24 k entrances in the west map: a linear scan per query was the slowest part of the veranda search)
  const addDoorBox = (b) => { S.doorBoxes.push(b); const k = Math.floor(b.cx / 8) + ',' + Math.floor(b.cz / 8); let a = doorGrid.get(k); if (!a) doorGrid.set(k, (a = [])); a.push(b); };
  /** exact test against the porch / shop-door boxes (3.0 x 3.2 m in front of every entrance), r metres of margin */
  S.inDoorBox = (x, z, r = 0) => {
    const i0 = Math.floor((x - 4 - r) / 8), i1 = Math.floor((x + 4 + r) / 8), j0 = Math.floor((z - 4 - r) / 8), j1 = Math.floor((z + 4 + r) / 8);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const a = doorGrid.get(i + ',' + j); if (!a) continue; for (const b of a) { const dx = x - b.cx, dz = z - b.cz; if (Math.abs(dx) > 4 + r || Math.abs(dz) > 4 + r) continue; const lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c; if (Math.abs(lx) < b.hw + r && Math.abs(lz) < b.hd + r) return true; } }
    return false;
  };
  for (const l of (st && st.lamps) || []) S.placed.add(l.x, l.z, 0.9, 'lamp');
  for (const s of (st && st.busStops) || []) { S.placed.add(s.x, s.z, s.shelter ? 5 : 2.6, 'stop'); S.W.reserve(s.x, s.z, s.shelter ? 4 : 2); }
  for (const c of (st && st.crosswalks) || []) for (const p of c.pts) { S.placed.add(p[0], p[1], 3.6, 'cross'); S.W.reserve(p[0], p[1], 2.8); }   // the kerb ramps + waiting areas at both zebra ends
  const entrances = [...((city && city.entrances) || []), ...(((lm && lm.landmarksB && lm.landmarksB.entrances) || []).map((e) => ({ x: e.x, z: e.z, rotY: e.rotY })))];
  for (const e of entrances) {                                         // porches / shop doors: keep the stoop and the approach free
    const c = Math.cos(e.rotY), s = Math.sin(e.rotY), nx = s, nz = c;
    S.W.reserveBox(e.x + nx * 0.9, e.z + nz * 0.9, 3.0, 3.2, e.rotY, F.DOOR, 0.0);
    addDoorBox({ cx: e.x + nx * 0.9, cz: e.z + nz * 0.9, c, s, hw: 1.5, hd: 1.6 });
  }
  for (const m of (lm && lm.monuments) || []) S.placed.add(m.x, m.z, 3, 'mon');
  for (const l of [...((ctx.services.landmarksE && ctx.services.landmarksE.lamps) || []), ...((ctx.services.landmarksH && ctx.services.landmarksH.lamps) || [])]) if (l && l.x != null) S.placed.add(l.x, l.z, 1.6, 'lamp');      // the lanterns + their granite bench rings of the Gostiny Dvor promenade ...
  // benches that the landmark modules draw themselves (Kazan + Voronikhin gardens: benchPoints / vorBenches, the Catherine garden + Gostiny promenade: landmarksE.benches (also merged into lm.benches), Admiralty / Isaac's:
  // H / J benches when they publish any): the OSM bench nodes at those points are NOT drawn again (no duplicates), every other prop keeps 0.5 m + its own half length away from them
  S.lmBench = [];
  { const sv = ctx.services, seen = new Set(), add = (b) => { if (!b || b.x == null) return; const k = Math.round(b.x * 4) + ',' + Math.round(b.z * 4); if (seen.has(k)) return; seen.add(k); S.lmBench.push([b.x, b.z]); S.placed.add(b.x, b.z, 0.5, 'bench'); };
    for (const list of [lm && lm.benches, sv.landmarksE && sv.landmarksE.benches, sv.landmarksF && sv.landmarksF.benchPoints, sv.landmarksF && sv.landmarksF.vorBenches, sv.landmarksF && sv.landmarksF.benches, sv.landmarksH && sv.landmarksH.benches, sv.landmarksJ && sv.landmarksJ.benches, sv.landmarksJ && sv.landmarksJ.benchPoints, sv.landmarksG && sv.landmarksG.benches, sv.landmarksI && sv.landmarksI.benches]) if (Array.isArray(list)) for (const b of list) add(b); }
  for (const k of [...((rail && rail.benches) || []), ...((rail && rail.bins) || []), ...((rail && rail.kiosks) || [])]) if (k && k.x != null) S.placed.add(k.x, k.z, 1.4, 'rail');
  for (const e of (ctx.services.metro && ctx.services.metro.entrances) || []) S.placed.add(e.x + Math.sin(e.rotY) * 2, e.z + Math.cos(e.rotY) * 2, 4.5, 'metro');
  for (const h of L.GROUND_HOLES || []) S.placed.add(h.x, h.z, Math.hypot(h.w, h.d) / 2 + 3, 'metro');
  // landmarksA's two advertising pillars (the island beside the obelisk + the forecourt) and its lamp groups, planters, racks (positions known from its frame)
  S.placed.add(609.5, 171.5, 0.7, 'pillar'); { const p = S.stationW(-58, -26); S.placed.add(p[0], p[1], 0.7, 'pillar'); }
  return S;
}

/** pavement stations: the sidewalk centrelines of the streets module, each point with the tangent, the unit normal towards the carriageway and the free span to the
 *  wall (eb) and to the carriageway (ek). Used by the benches, bins, tubs, racks, stands and verandas. */
export function pavementStations(S) {
  const { W, st } = S, out = [];
  if (!st || !st.sidewalks) return out;
  let li = 0;
  for (const line of st.sidewalks) {
    const p = line.pts; li++;
    if (p.length < 3) continue;
    let acc = 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
      let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      if (i > 0) acc += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      const x = p[i][0], z = p[i][1];
      if (!W.inArea(x, z, 2)) continue;
      const rd = S.L.roadsNear(x, z, 14, { drivable: true })[0];
      if (!rd) continue;
      let nx = rd.x - x, nz = rd.z - z; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
      // the sidewalk centrelines of one strip run parallel to the road: use the road normal, not the (possibly noisy) tangent normal
      const eb = W.span(x, z, -nx, -nz, 10, W.F.BLD | W.F.TREE | W.F.WATER), ek = W.span(x, z, nx, nz, 10, W.F.ROAD);
      out.push({ x, z, tx, tz, nx, nz, eb, ek, road: rd.road, rn: rd.road.name || '', hw: rd.road.hw, line: li, s: acc, i, gapRoad: rd.gap });
    }
  }
  return out;
}

/** build all the registered instanced types from their lists */
export function flushInstances(S) {
  const ctx = S.ctx; let tris = 0, n = 0;
  for (const [name, list] of S.inst) {
    const def = S.geos.get(name); if (!def || !list.length) continue;
    const g = def.mk(); const geo = g.build(false);
    const mat = def.o.mat || S.vc;
    instanced(ctx, geo, mat, list, { name: 'pr-' + name, cast: def.o.cast, noOutline: def.o.noOutline });
    tris += (geo.index.count / 3) * list.length; n += list.length; (S.stats.byType = S.stats.byType || {})[name] = [list.length, geo.index.count / 3];
  }
  // the knock types: one Dynamic mesh per type and cell (a type with fewer than 16 instances in the strip: ONE mesh), the instance of a placement found by the IDENTITY of its matrix
  if (S.kinst.size) {
    const total = new Map(), cells = new Map(), built = new Map(), where = new Map(), lod = new Set(), bt = (S.stats.byType = S.stats.byType || {});
    for (const [, a] of S.kinst) total.set(a.name, (total.get(a.name) || 0) + a.list.length);
    for (const [key, a] of S.kinst) { const k = total.get(a.name) < 16 ? a.name + '|all' : key; let c = cells.get(k); if (!c) cells.set(k, (c = { name: a.name, list: [] })); c.list.push(...a.list); }
    for (const [key, a] of cells) {
      const def = S.geos.get(a.name); if (!def || !a.list.length) continue;
      let geo = built.get(a.name); if (!geo) { geo = def.mk().build(false); built.set(a.name, geo); }
      const mesh = instanced(ctx, geo, def.o.mat || S.vc, a.list, { name: 'pr-' + key, cast: def.o.cast, noOutline: def.o.noOutline });
      for (let i = 0; i < a.list.length; i++) where.set(a.list[i], { mesh, index: i });
      const t = geo.index.count / 3; tris += t * a.list.length; n += a.list.length;
      bt[a.name] = bt[a.name] ? [bt[a.name][0] + a.list.length, t] : [a.list.length, t];
    }
    let kn = 0;
    for (const k of S.knockables) {
      const def = KNOCK[k.name], at = where.get(k.m); if (!def || !at) continue;
      const sc = k.s;
      const rec = ctx.knock.register({ ...def, x: k.x, z: k.z, y: k.y, rotY: k.rotY, h: def.h * sc, r: def.r ? def.r * sc : undefined, w: def.w ? def.w * sc : undefined, d: def.d ? def.d * sc : undefined,
        mass: def.mass * sc * sc, item: k.item, parts: [{ mesh: at.mesh, index: at.index }, ...k.extra] });
      if (!rec) continue;
      kn++; if (!lod.has(at.mesh)) { lod.add(at.mesh); registerLOD(at.mesh, def.far); }       // after register(): its bounds are inflated for the thrown pieces
    }
    const linked = new Set(S.knockables.map((k) => k.m)), loose = {};          // knock-type instances that found no collider within 1 m (they stay as plain solid scenery)
    for (const a of cells.values()) for (const m of a.list) if (!linked.has(m)) { loose[a.name] = (loose[a.name] || 0) + 1; if (typeof process !== 'undefined' && process.env && process.env.KNOCK_DEBUG) console.log('KNOCK loose', a.name, Math.round(m.elements[12] * 10) / 10, Math.round(m.elements[14] * 10) / 10); }
    S.stats.knockables = kn; S.stats.knockMeshes = lod.size; S.stats.knockCells = cells.size; S.stats.knockLoose = loose;
  }
  S.stats.instTris = Math.round(tris); S.stats.instances = n;
  return tris;
}
export { hash01, clamp };
