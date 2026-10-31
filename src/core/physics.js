// Simple, deterministic walking physics: oriented boxes, cylinders, walkable tops, ramps, escalators / conveyors and terrain holes,
// terrain height function. Player = vertical capsule approximated by a circle in XZ.
//
// MULTI-LEVEL (underground, see docs/UNDERGROUND.md):
//  * every y-range is in world metres and the defaults reach from -300 to +400, so geometry 70 m below the street is as solid as a house;
//  * the terrain (heightAt) is only ONE of the floors: it counts when it is not above feet + STEP_HEIGHT, so a player at y = -55 is never
//    lifted to the street; a `hole` (addHole) switches the terrain off inside its footprint (the mouth of a metro escalator shaft);
//  * groundHeight() returns the highest surface not above feet + STEP_HEIGHT, or -Infinity when there is none (a void);
//  * addEscalator / addConveyor make a walkable ramp (a continuous surface up to ~40 degrees) that carries the player along its slope.
// Everything that happens above the terrain behaves exactly as before.
import * as THREE from 'three';
import { NONE, UNIT } from './roofmap.js';
const hyp = (a, b) => Math.sqrt(a * a + b * b);      // (round 4, 2026-10-16: Math.hypot allocates in V8 (117 MB per 20 s of driving); every use in this file has two arguments)

const CELL = 8;
export const STEP_HEIGHT = 0.45;
/** Deepest drop a walker accepts onto a lower surface while it is below the terrain or at a terrain hole (a larger step is refused like a wall). */
export const DROP_MAX = 1.2;
export const Y_MIN = -300, Y_MAX = 400;     // default vertical range of the solids

/** point in a flat ring [x, z, x, z, ...] (even-odd) */
const ringIn = (o, x, z) => { let ins = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const xi = o[i], zi = o[i + 1], xj = o[j], zj = o[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ins = !ins; } return ins; };

const _S = { y: -Infinity, kind: null, item: null };   // scratch result of surfaceAt (callers that keep it pass their own)
const NO_SURFACES = [];

export class Physics {
  /** heightAt(x, z) = the terrain; waterway(x, z) = the surface y of a waterway at (x, z) or null (layout.waterLevelAt: the trench of a river / canal; the ponds and basins of an area come with addWater) */
  constructor(heightAt, waterway = null) {
    this.heightAt = heightAt;
    this.waterway = waterway;
    this.waters = [];       // ponds / fountain basins: { box, fn, ring, holes, level } (addWater)
    this.waterShores = []; // Authored beach ramps: the visible sand displaces water above its waterline.
    this.grid = new Map();
    this.items = [];
    this.dynamic = [];
    this._dynItems = [];
    this.roof = null;       // height map of the building roofs (roofmap.js), set once the scene is drawn
  }
  setRoofMap(m) { this.roof = m; }
  /** WATER IS REACHABLE (docs/AREAS.md 13.7): water is terrain, never a wall: the river / canal bed is `heightAt` below the water level, a walker or a car goes in and wades on the bed. This registry only answers
   *  "how deep" (wading speed, the car's drag, the underwater tint, the knock floor). A pond or fountain basin of a module: addWater({ ring: [x, z, ...], holes?: [[x, z, ...]], level }) (a polygon) or addWater({ fn: (x, z) => y | null }). */
  addWater(w) {
    const o = { fn: w.fn || null, ring: w.ring || null, holes: w.holes || [], level: w.level ?? 0, box: null };
    if (o.ring) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < o.ring.length; i += 2) { x0 = Math.min(x0, o.ring[i]); x1 = Math.max(x1, o.ring[i]); z0 = Math.min(z0, o.ring[i + 1]); z1 = Math.max(z1, o.ring[i + 1]); } o.box = [x0, x1, z0, z1]; }
    this.waters.push(o); return o;
  }
  /** y of the water surface at (x, z): a waterway, a pond or a basin; null on dry ground */
  waterLevel(x, z) {
    const k = this.waterway ? this.waterway(x, z) : null;
    if(k!==null&&k!==undefined){
      for(const b of this.waterShores){const dx=x-b.cx,dz=z-b.cz,u=dx*b.c-dz*b.s,v=dx*b.s+dz*b.c;
        if(Math.abs(u)<=b.hw&&Math.abs(v)<=b.hd&&b.yA+(b.yB-b.yA)*(v/(2*b.hd)+.5)>k-.15)return null;}
      return k;
    }
    for (let i = 0; i < this.waters.length; i++) {
      const w = this.waters[i];
      if (w.fn) { const y = w.fn(x, z); if (y !== null && y !== undefined) return y; continue; }
      const b = w.box; if (x < b[0] || x > b[1] || z < b[2] || z > b[3] || !ringIn(w.ring, x, z)) continue;
      let hole = false; for (const h of w.holes) if (ringIn(h, x, z)) { hole = true; break; }
      if (!hole) return w.level;
    }
    return null;
  }
  /** Roof surface height at (x,z) in metres; NaN where there is no roof. */
  roofTop(x, z) {
    const m = this.roof; if (!m) return NaN;
    const i = Math.floor((x - m.x0) / m.res), j = Math.floor((z - m.z0) / m.res);
    if (i < 0 || j < 0 || i >= m.w || j >= m.h) return NaN;
    const v = m.data[j * m.w + i];
    return v === NONE ? NaN : v * UNIT;
  }
  _cells(minx, minz, maxx, maxz, fn) {
    const x0 = Math.floor(minx / CELL), x1 = Math.floor(maxx / CELL), z0 = Math.floor(minz / CELL), z1 = Math.floor(maxz / CELL);
    for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) fn(ix + ',' + iz);
  }
  _insert(it) {
    this.items.push(it);
    const r = it.type === 'cyl' ? it.r : hyp(it.hw, it.hd);
    const surface = it.type === 'walk' || it.type === 'ramp' || it.type === 'hole';
    this._cells(it.cx - r, it.cz - r, it.cx + r, it.cz + r, (k) => {
      let a = this.grid.get(k); if (!a) this.grid.set(k, (a = [])); a.push(it);
      // Ground-height queries need floors/ramps/holes, not every nearby wall or
      // tree. Keep their references in the same cell and insertion order, so a
      // grid clear also drops this index and equal-height surfaces keep their tie.
      if (surface) (a.surfaces || (a.surfaces = [])).push(it);
    });
    return it;
  }
  /** Remove an item returned by one of the add* methods (rare: a closed door, a removed stall). */
  remove(it) {
    const i = this.items.indexOf(it); if (i < 0) return false;
    this.items.splice(i, 1);
    const r = it.type === 'cyl' ? it.r : hyp(it.hw, it.hd);
    this._cells(it.cx - r, it.cz - r, it.cx + r, it.cz + r, (k) => {
      const a = this.grid.get(k); if (!a) return;
      const j = a.indexOf(it); if (j >= 0) a.splice(j, 1);
      if (a.surfaces) { const s = a.surfaces.indexOf(it); if (s >= 0) a.surfaces.splice(s, 1); }
    });
    return true;
  }
  _obb(type, cx, cz, w, d, rotY, extra) {
    return { type, cx, cz, hw: w / 2, hd: d / 2, c: Math.cos(rotY), s: Math.sin(rotY), rotY, ...extra };
  }

  /** Solid oriented box: footprint w (local x) × d (local z) rotated by rotY about its centre; vertical range y0..y1. */
  addBox(cx, cz, w, d, rotY = 0, y0 = Y_MIN, y1 = Y_MAX) { return this._insert(this._obb('box', cx, cz, w, d, rotY, { y0, y1 })); }
  /** Solid axis-aligned box from min/max corners. */
  addAABB(minx, minz, maxx, maxz, y0 = Y_MIN, y1 = Y_MAX) { return this.addBox((minx + maxx) / 2, (minz + maxz) / 2, maxx - minx, maxz - minz, 0, y0, y1); }
  /** Solid vertical cylinder. */
  addCylinder(cx, cz, r, y0 = Y_MIN, y1 = Y_MAX) { return this._insert({ type: 'cyl', cx, cz, r, y0, y1 }); }
  /** Walkable flat top (floor, platform, step, bench-free deck). Blocks the player like a wall when
   *  its top is more than STEP_HEIGHT above the feet. bottom: y below which it no longer blocks (a solid column from `bottom` up to `top`):
   *  pass top - thickness for a slab that people can walk UNDER (a mezzanine above a platform). */
  addWalkBox(cx, cz, w, d, rotY, topY, bottom = Y_MIN) { return this._insert(this._obb('walk', cx, cz, w, d, rotY, { top: topY, y0: bottom })); }
  /** Walkable ramp: local z from -d/2 (height yA) to +d/2 (height yB). A continuous surface (slopes up to ~40 degrees are walkable at running speed).
   *  thick: the ramp is a solid wedge from its surface down to `thick` m below it (default 50: as before; use ~1-2 for a ramp that a tunnel can cross under). */
  addWalkRamp(cx, cz, w, d, rotY, yA, yB, thick = 50) { return this._insert(this._obb('ramp', cx, cz, w, d, rotY, { yA, yB, thick, y0: Math.min(yA, yB) - thick, sticky: true })); }
  /** Stairs helper: n steps rising along local +z from y0 to y1 inside footprint (w × d). y1 < y0 = stairs going down. The steps are flagged
   *  `sticky`: a walker that goes down them keeps its feet on the treads (no airborne flicker at running speed). */
  addStairs(cx, cz, w, d, rotY, y0, y1, n) {
    const c = Math.cos(rotY), s = Math.sin(rotY), out = [];
    for (let i = 0; i < n; i++) {
      const lz = -d / 2 + d * (i + 0.5) / n;
      const it = this.addWalkBox(cx + lz * s, cz + lz * c, w, d / n, rotY, y0 + (y1 - y0) * (i + 1) / n);
      it.sticky = true; out.push(it);
    }
    return out;
  }
  /** Terrain hole: inside this footprint the terrain (heightAt) is not a floor. Used for the mouth of an escalator shaft / stairwell, where the
   *  surfaces below (ramp, stairs, floor) are the only floors. A walker never steps from the street onto a surface far below it (see DROP_MAX). */
  addHole(cx, cz, w, d, rotY = 0) { return this._insert(this._obb('hole', cx, cz, w, d, rotY, {})); }
  /** Conveyor: a walkable ramp (yA at local -z, yB at +z; yA == yB is a flat moving walkway) whose surface carries the player along its slope
   *  at `speed` m/s (along the slope), toward local +z when along * dir > 0. The player may still walk on it. Change `item.dir` at runtime
   *  (+1 / -1 / 0 = stopped; or item.setDir(d)); `item.speed` is live too. hole: true also cuts a terrain hole of the same footprint.
   *  opts { along = +1, speed = 0.9, dir = 1, thick = 1.2, hole = false } */
  addConveyor(o) {
    const { cx, cz, w, d, rotY = 0, yA = 0, yB = 0, along = 1, speed = 0.9, dir = 1, thick = 1.2, hole = false } = o;
    const it = this.addWalkRamp(cx, cz, w, d, rotY, yA, yB, thick);
    it.conv = true; it.along = along >= 0 ? 1 : -1; it.speed = speed; it.dir = dir; it.cosSlope = Math.cos(Math.atan2(Math.abs(yB - yA), d));
    it.setDir = (v) => { it.dir = v; return it; };
    if (hole) it.holeItem = this.addHole(cx, cz, w, d, rotY);
    return it;
  }
  /** Escalator helper. Object form: addEscalator({ bottom: {x,y,z}, top: {x,y,z}, w = 1.1, dir = 0, speed = 0.9, hole = true, thick = 1.2 })
   *  positional form: addEscalator(cx, cz, w, len, rotY, yBottom, yTop, dir = 0): len = horizontal run, rotY points UPHILL (local +z = toward the top).
   *  dir: +1 carries the player up, -1 down, 0 stopped (a plain ramp). The steps are drawn by the module. The terrain hole under it is automatic. */
  addEscalator(a, ...r) {
    let cx, cz, w, len, rotY, yBottom, yTop, dir, speed = 0.9, hole = true, thick = 1.2;
    if (typeof a === 'object' && a !== null) {
      const b = a.bottom, t = a.top; w = a.w ?? 1.1; dir = a.dir ?? 0; speed = a.speed ?? 0.9; hole = a.hole ?? true; thick = a.thick ?? 1.2;
      const dx = t.x - b.x, dz = t.z - b.z;
      len = hyp(dx, dz); rotY = Math.atan2(dx, dz); cx = (b.x + t.x) / 2; cz = (b.z + t.z) / 2; yBottom = b.y; yTop = t.y;
    } else { [cx, cz, w, len, rotY, yBottom, yTop, dir = 0] = [a, ...r]; }
    const it = this.addConveyor({ cx, cz, w, d: len, rotY, yA: yBottom, yB: yTop, along: 1, speed, dir, thick, hole });
    it.escalator = true;
    return it;
  }
  /** Solid box from an Object3D's world-space AABB (call after positioning it). pad expands XZ. */
  addFromObject(obj, pad = 0) {
    obj.updateWorldMatrix(true, true);
    const b = new THREE.Box3().setFromObject(obj);
    if (b.isEmpty()) return null;
    return this.addAABB(b.min.x - pad, b.min.z - pad, b.max.x + pad, b.max.z + pad, b.min.y, b.max.y);
  }
  /** Moving colliders: fn() returns an array of {cx,cz,w,d,rotY,y0,y1} each frame. */
  addDynamic(fn) { this.dynamic.push(fn); }

  /** Nearby collider records for driving's rigid-body narrow phase. */
  querySolids(x, z, r) { return this._query(x, z, r, new Set()); }      // (a caller may keep this set: its own copy)

  _local(it, x, z) { const dx = x - it.cx, dz = z - it.cz, o = this._loc || (this._loc = [0, 0]); o[0] = dx * it.c - dz * it.s; o[1] = dx * it.s + dz * it.c; return o; }      // (round 4: one scratch pair, read at once by every caller)
  _query(x, z, r, out = null) {
    out = out || this._qset || (this._qset = new Set()); out.clear();      // (round 4: the internal queries iterate at once: one reusable set, 80 MB per 20 s of driving before)
    this._cells(x - r, z - r, x + r, z + r, (k) => { const a = this.grid.get(k); if (a) for (const it of a) out.add(it); });
    for (const it of this._dynItems) out.add(it);
    return out;
  }
  _querySurfaces(x, z, r) {
    const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), z0 = Math.floor((z - r) / CELL), z1 = Math.floor((z + r) / CELL);
    // The usual point query lies in one cell: no temporary Set or solid scan.
    // Dynamic providers produce boxes only (refreshDynamic), never floor surfaces.
    if (x0 === x1 && z0 === z1) return this.grid.get(x0 + ',' + z0)?.surfaces || NO_SURFACES;
    const out = new Set();
    for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
      const a = this.grid.get(ix + ',' + iz)?.surfaces; if (a) for (const it of a) out.add(it);
    }
    return out;
  }
  refreshDynamic() {
    const items = this._dynItems; items.length = 0;
    for (const fn of this.dynamic) {
      const arr = fn(); if (!arr) continue;
      if (!fn.stableBoxes) { for (const b of arr) items.push(this._obb('box', b.cx, b.cz, b.w, b.d, b.rotY || 0, { y0: b.y0 ?? Y_MIN, y1: b.y1 ?? Y_MAX, source: b })); continue; }
      // a provider that marks itself `stableBoxes` returns the SAME box objects every call (a bascule leaf's bays): one OBB per source box is KEPT between calls and rewritten in place only when the box moved,
      // so a leaf that lies allocates and computes nothing here
      const cache = this._dynObb || (this._dynObb = new WeakMap());
      for (let i = 0; i < arr.length; i++) {
        const b = arr[i], rot = b.rotY || 0, y0 = b.y0 ?? Y_MIN, y1 = b.y1 ?? Y_MAX;
        let it = cache.get(b);
        if (!it) { it = this._obb('box', b.cx, b.cz, b.w, b.d, rot, { y0, y1, source: b }); cache.set(b, it); }
        else if (it.cx !== b.cx || it.cz !== b.cz || it.hw !== b.w / 2 || it.hd !== b.d / 2 || it.rotY !== rot || it.y0 !== y0 || it.y1 !== y1) {
          it.cx = b.cx; it.cz = b.cz; it.hw = b.w / 2; it.hd = b.d / 2; it.y0 = y0; it.y1 = y1;
          if (it.rotY !== rot) { it.rotY = rot; it.c = Math.cos(rot); it.s = Math.sin(rot); }
        }
        items.push(it);
      }
    }
  }

  /** True when (x,z), grown by r, touches a terrain hole (addHole / addEscalator). */
  inHole(x, z, r = 0) {
    for (const it of this._querySurfaces(x, z, r + 0.01)) {
      if (it.type !== 'hole') continue;
      const [lx, lz] = this._local(it, x, z);
      if (Math.abs(lx) <= it.hw + r && Math.abs(lz) <= it.hd + r) return true;
    }
    return false;
  }

  /** The surface under (x,z) for feet at feetY: the highest walkable top not above feet + STEP_HEIGHT among the terrain (unless a hole cuts it out
   *  or it is above feet + STEP), walk boxes, ramps / escalators and (roofs = true) building roofs. Writes { y, kind, item } into `out`:
   *  kind 'terrain' | 'walk' | 'ramp' | 'roof' | null (no surface: y = -Infinity). ignoreHoles: the terrain counts inside holes too (flight). */
  surfaceAt(x, z, feetY = 1e9, roofs = true, out = _S, ignoreHoles = false) {
    const lim = feetY + STEP_HEIGHT;
    let y = -Infinity, kind = null, item = null, terrain = true;
    for (const it of this._querySurfaces(x, z, 0.01)) {
      const t = it.type;
      if (t !== 'walk' && t !== 'ramp' && t !== 'hole') continue;
      const [lx, lz] = this._local(it, x, z);
      if (Math.abs(lx) > it.hw || Math.abs(lz) > it.hd) continue;
      if (t === 'hole') { if (!ignoreHoles) terrain = false; continue; }
      const top = t === 'walk' ? it.top : it.yA + (it.yB - it.yA) * (lz / (2 * it.hd) + 0.5);
      if (top <= lim && top > y) { y = top; kind = t; item = it; }
    }
    const th = this.heightAt(x, z);
    if (terrain && th <= lim && th >= y) { y = th; kind = 'terrain'; item = null; }
    if (roofs) { const rt = this.roofTop(x, z); if (rt <= lim && rt > y) { y = rt; kind = 'roof'; item = null; } }     // NaN (no roof) fails both tests
    out.y = y; out.kind = kind; out.item = item;
    return out;
  }
  /** Surface height under (x,z) for feet at feetY (highest walkable top not above feet+STEP). Building roofs count (roofs = false: teleports ignore them).
   *  -Infinity where there is no surface at all (underground void, terrain hole without a floor). */
  groundHeight(x, z, feetY = 1e9, roofs = true) { return this.surfaceAt(x, z, feetY, roofs, _S).y; }
  /** Floor for a FLYER: like groundHeight but the terrain also counts inside holes, so flying down an escalator shaft stops at the street. */
  flightFloor(x, z, feetY) { return this.surfaceAt(x, z, feetY, true, _S, true).y; }

  /** Velocity (m/s, world XZ) that the conveyor / escalator `item` imparts on whoever stands on it; written into out {x,z}. */
  conveyorVelocity(item, out) {
    out.x = out.z = 0;
    if (!item || !item.conv) return out;
    const v = item.dir * item.along * item.speed * item.cosSlope;      // horizontal part of the speed along the slope
    out.x = item.s * v; out.z = item.c * v;                           // local +z in world = (sin rotY, cos rotY)
    return out;
  }

  /** True when a solid (building, tree, car, quay wall, or a deck's volume above y0) fills the column at (x,z) anywhere in (y0, y1).
   *  Used to refuse a landing: a floor the player would stand on (top <= y0) is not in the way. */
  columnBlocked(x, z, r, y0, y1) {
    for (const it of this._query(x, z, r + 0.5)) {
      if (it.type === 'hole') continue;
      let hi = it.y1;
      if (it.type === 'walk') hi = it.top;
      else if (it.type === 'ramp') { const [, lz] = this._local(it, x, z); hi = it.yA + (it.yB - it.yA) * (Math.max(-it.hd, Math.min(it.hd, lz)) / (2 * it.hd) + 0.5); }
      if (hi <= y0 || it.y0 >= y1) continue;
      if (it.type === 'cyl') { if (hyp(x - it.cx, z - it.cz) < r + it.r) return true; continue; }
      const [lx, lz] = this._local(it, x, z);
      if (Math.abs(lx) < it.hw + r && Math.abs(lz) < it.hd + r) return true;
    }
    return false;
  }

  /** Push circle (x,z,r) out of solids overlapping the vertical span [feetY, feetY+height]. Mutates p. */
  resolve(p, r, feetY, height) {
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const it of this._query(p.x, p.z, r + 0.5)) {
        let y0, y1;
        if (it.type === 'hole') continue;
        if (it.type === 'box') { y0 = it.y0; y1 = it.y1; if (feetY + STEP_HEIGHT >= y1 || feetY + height <= y0) continue; }
        else if (it.type === 'cyl') { if (feetY + STEP_HEIGHT >= it.y1 || feetY + height <= it.y0) continue; }
        else if (it.type === 'walk') { if (it.top <= feetY + STEP_HEIGHT || feetY + height <= it.y0) continue; }
        else if (it.type === 'ramp') {
          // blocks only where the ramp surface is far above feet (and its wedge reaches the head: a tunnel below the ramp is not blocked)
          const [lx, lz] = this._local(it, p.x, p.z);
          const lzC = Math.max(-it.hd, Math.min(it.hd, lz));
          const top = it.yA + (it.yB - it.yA) * (lzC / (2 * it.hd) + 0.5);
          if (top <= feetY + STEP_HEIGHT || top - it.thick >= feetY + height) continue;
        }
        if (it.type === 'cyl') {
          const dx = p.x - it.cx, dz = p.z - it.cz, d = hyp(dx, dz), m = r + it.r;
          if (d < m) { const k = d > 1e-6 ? (m - d) / d : 0; p.x += dx * k; p.z += dz * k; if (d <= 1e-6) p.x += m; moved = true; }
          continue;
        }
        const [lx, lz] = this._local(it, p.x, p.z);
        const qx = Math.max(-it.hw, Math.min(it.hw, lx)), qz = Math.max(-it.hd, Math.min(it.hd, lz));
        let dx = lx - qx, dz = lz - qz, d = hyp(dx, dz);
        let nx, nz, pen;
        if (d > 1e-6) { if (d >= r) continue; nx = dx / d; nz = dz / d; pen = r - d; }
        else { // centre inside: push out along the smallest axis
          const ex = it.hw - Math.abs(lx), ez = it.hd - Math.abs(lz);
          if (ex < ez) { nx = Math.sign(lx) || 1; nz = 0; pen = ex + r; } else { nx = 0; nz = Math.sign(lz) || 1; pen = ez + r; }
        }
        // local -> world (inverse rotation)
        const wx = nx * it.c + nz * it.s, wz = -nx * it.s + nz * it.c;
        p.x += wx * pen; p.z += wz * pen; moved = true;
      }
      if (!moved) break;
    }
    return p;
  }

  get count() { return this.items.length; }
}
