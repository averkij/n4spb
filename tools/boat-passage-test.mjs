// tools/boat-passage-test.mjs - THE BOAT UNDER EVERY BRIDGE, and the bridge pillars are solid (docs/water-transport-bridges.md, docs/AREAS.md "The motor boat"), CPU only, no GPU, no bake:
//   node tools/area.mjs <palace|smolny|admiralty|vladimirsky> tools/boat-passage-test.mjs [--quick] [--only=<bridge id>]            npm run boatpass   (the four live areas)
// It builds the REAL modules of the area headlessly (tools/lib/headless-world.mjs: environment, bridges, streets, the landmark modules ... no city / people / traffic), the real Physics colliders, the real
// water (physics.waterLevel, holes, buildings, the territory) and drives the REAL boat handling (drive/boat/handling.js createBoatHandling: shore probes with the 0.4 m margin, the solids of drive/collision.js
// with SPEC_BOAT.hgt) with a simple autopilot.
//   a  EVERY BRIDGE: each crossing of a waterway (the BRIDGE_ZONES rows of the area plus any bridge of services.bridges that has no row) is sailed from one side to the other: a route over a 1 m grid of
//      "boat-free" water (water, no hole / building, the territory, no solid that stops a floating hull at that level, a 1.5 m clearance) is found and followed by the real boat handling; no 'hit', no stuck, never
//      off the water. Closed = the two sides are different bodies of free water, or the run gets no further. A bridge whose far side lies outside the territory is only reported (a partial waterway).
//   b  THE PILLARS: every wall that the bridges DRAW across the water surface in open water (the piers, cutwaters, abutment heads of the bridge meshes: wall triangles from under the surface to >= 0.5 m
//      over it, >= 2 m from the bank, in clusters of >= 0.8 m) is covered by a solid that stops a floating hull; and a boat driven at each pillar from open water gets a 'hit' and never ends inside the drawn footing.
//   c  THE WATER BODIES: the free water of the area as connected components. Water that joins (one connected body of wet cells: the Neva, the Moika, the Fontanka, the canals ...) must be ONE body of boat-free
//      water; a pocket of boat-free water in it must be smaller than a boat's turning space (400 m2), else the bridge / pier / wall that cuts it is named.
// A pose in water is never a failure; a wall of water is.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

const QUICK = process.argv.includes('--quick');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7) || process.env.ONLY || null;
const AREA = process.env.AREA || 'palace';
let checks = 0, fails = 0;
const check = (name, fn) => { try { fn(); checks++; console.log('PASS', name); } catch (e) { fails++; console.log('FAIL', name, '\n    ', String(e.message).split('\n').slice(0, 8).join('\n     ')); } };
const t0 = Date.now();
const { ctx, L, built, errors } = await buildWorld({});
console.log(`area ${AREA}: built ${built.length} modules in ${((Date.now() - t0) / 1000).toFixed(0)} s; ${ctx.physics.items.length} colliders${errors.length ? '; build errors: ' + errors.slice(0, 2).join(' | ') : ''}`);
const ph = ctx.physics;
ph.refreshDynamic();      // the dynamic solids (the bascule leaves of the Troitsky / Palace bridges) in their state at t = 0
const { createBoatHandling, SPEC_BOAT } = await import('../src/world/drive/boat/handling.js');
const { carContact } = await import('../src/world/drive/collision.js');
const { BRIDGE_ZONES } = await import('../src/world/environment/waterways.js');
const { WATER: WATER_TABLE } = await import('../src/world/lib/area-tables.js');
const { LOW_CLEARANCE: LOW_CLEARANCE_BRIDGES } = await import('../src/world/bridges/piers.js');
const DEG = Math.PI / 180, R_FREE = Number(process.env.RFREE || 1.5), HULL = SPEC_BOAT.hgt;

// ---------------------------------------------------------------- the 1 m grid of the play area
const P = L.WORLD.play, RES = 1, X0 = Math.floor(P.x0), Z0 = Math.floor(P.z0), NX = Math.ceil(P.x1 - X0), NZ = Math.ceil(P.z1 - Z0);
const idx = (x, z) => { const i = Math.floor((x - X0) / RES), j = Math.floor((z - Z0) / RES); return i < 0 || j < 0 || i >= NX || j >= NZ ? -1 : j * NX + i; };
const cx = (k) => X0 + ((k % NX) + 0.5) * RES, cz = (k) => Z0 + (Math.floor(k / NX) + 0.5) * RES;
const wl = new Float32Array(NX * NZ).fill(NaN);        // the water level of a wet cell (water, in the territory, no hole, no building footprint: what the boat's `dry()` calls water)
const wlx = new Float32Array(NX * NZ).fill(NaN);       // the same without the territory: the water that a rectangle of the play area cuts (the notch of an L-shaped territory) is still water here
let nWet = 0;
for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
  const x = X0 + (i + 0.5) * RES, z = Z0 + (j + 0.5) * RES, w = ph.waterLevel(x, z);
  if (w !== null && !ph.inHole(x, z, 0.2) && !L.insideBuilding(x, z)) { wlx[j * NX + i] = w; if (L.inPlay(x, z)) { wl[j * NX + i] = w; nWet++; } }
}
const isWet = (k) => k >= 0 && wl[k] === wl[k];
const solid = new Uint8Array(NX * NZ);        // a wet cell where a solid stops a floating hull (a square of 2.2 m round the cell centre, the hull's collision height, the level of the cell)
{
  const spec = { W: 2.2, len: 2.2, centerZ: 0, hgt: HULL }, car = { x: 0, z: 0, y: 0, yaw: 0, floats: true }, out = {};
  for (let k = 0; k < wlx.length; k++) {
    if (wlx[k] !== wlx[k]) continue;
    car.x = cx(k); car.z = cz(k); car.y = wlx[k];
    for (const b of ph.querySolids(car.x, car.z, 3)) if (carContact(car, spec, b, out)) { solid[k] = 1; break; }
  }
}
/** chamfer distance (m) from each cell to the nearest cell that is not boat-free; `free(k)` says which cells count as free */
function distance(free) {
  const D = new Float32Array(NX * NZ), B = Math.SQRT2;
  for (let k = 0; k < D.length; k++) D[k] = free(k) ? 1e4 : 0;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const k = j * NX + i; if (D[k] === 0) continue; let v = D[k];
    if (i === 0 || j === 0 || i === NX - 1 || j === NZ - 1) v = 1;      // the edge of the grid is an obstacle
    else { v = Math.min(v, D[k - 1] + 1, D[k - NX] + 1, D[k - NX - 1] + B, D[k - NX + 1] + B); }
    D[k] = v;
  }
  for (let j = NZ - 1; j >= 0; j--) for (let i = NX - 1; i >= 0; i--) {
    const k = j * NX + i; if (D[k] === 0) continue; let v = D[k];
    if (i < NX - 1 && j < NZ - 1) v = Math.min(v, D[k + 1] + 1, D[k + NX] + 1, D[k + NX + 1] + B, D[k + NX - 1] + B);
    D[k] = v;
  }
  return D;
}
const Dwet = distance((k) => isWet(k));                                  // the distance to the bank (dry ground / the edge of the territory)
const D = distance((k) => isWet(k) && !solid[k]);                          // the distance to the nearest bank or solid
const DX = distance((k) => wlx[k] === wlx[k] && !solid[k]);                // the same where the territory does not count
/** connected components (4-neighbour) of the cells with ok(k): { comp (Int32Array, 0 = none), sizes[], boxes[] } */
function components(ok) {
  const comp = new Int32Array(NX * NZ), sizes = [0], boxes = [null], q = new Int32Array(NX * NZ); let n = 0;
  for (let s = 0; s < comp.length; s++) {
    if (comp[s] || !ok(s)) continue;
    n++; let h = 0, t = 0, c = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; q[t++] = s; comp[s] = n;
    while (h < t) {
      const k = q[h++], i = k % NX, j = (k / NX) | 0; c++; x0 = Math.min(x0, i); x1 = Math.max(x1, i); z0 = Math.min(z0, j); z1 = Math.max(z1, j);
      if (i > 0 && !comp[k - 1] && ok(k - 1)) { comp[k - 1] = n; q[t++] = k - 1; }
      if (i < NX - 1 && !comp[k + 1] && ok(k + 1)) { comp[k + 1] = n; q[t++] = k + 1; }
      if (j > 0 && !comp[k - NX] && ok(k - NX)) { comp[k - NX] = n; q[t++] = k - NX; }
      if (j < NZ - 1 && !comp[k + NX] && ok(k + NX)) { comp[k + NX] = n; q[t++] = k + NX; }
    }
    sizes.push(c); boxes.push([X0 + x0, X0 + x1 + 1, Z0 + z0, Z0 + z1 + 1]);
  }
  return { comp, sizes, boxes };
}
const FREE = components((k) => D[k] >= R_FREE), WETC = components(isWet), FREEX = components((k) => DX[k] >= R_FREE);
// UNREACHABLE WATER: a body of water that no boat can reach, listed here with the reason (it is not a transport water: nothing is claimed about it, the checks a / c skip it). Only a body that is NOT joined to the main water by any wet cell counts;
// a name in this table is the waterway key of EVERY sampled cell of the body, and the body must be small (a lake of the map is no excuse).
const UNREACHABLE = { moat: 'the moat of the Mikhailovsky Castle: a separate 1.2 m deep body (1506 m2) behind the Fontanka quay, ringed by its own causeway decks (landmarksCastle/bridge.js); no connection to the Fontanka' };
const isolated = new Map();      // WETC component -> { key, size, reason }
{
  let main = 1; for (let c = 1; c < WETC.sizes.length; c++) if (WETC.sizes[c] > WETC.sizes[main]) main = c;
  const keys = new Map();
  for (let k = 0; k < WETC.comp.length; k++) {
    const c = WETC.comp[k]; if (!c || c === main || WETC.sizes[c] > 20000) continue;
    let e = keys.get(c); if (!e) keys.set(c, (e = { n: 0, ks: new Set() })); if (e.n++ % 25) continue; e.ks.add(L.waterwayAt(cx(k), cz(k)) || 'pond');
  }
  for (const [c, e] of keys) { const ks = [...e.ks]; if (ks.length === 1 && UNREACHABLE[ks[0]]) isolated.set(c, { key: ks[0], size: WETC.sizes[c], reason: UNREACHABLE[ks[0]] }); }
  for (const [c, v] of isolated) console.log(`     unreachable water: body ${c}, ${v.size} m2 (${v.key}): ${v.reason}`);
}
const isolatedAt = (x, z, r) => { for (let dz = -r; dz <= r; dz += 2) for (let dx = -r; dx <= r; dx += 2) { const c = WETC.comp[idx(x + dx, z + dz)]; if (c && isolated.has(c)) return isolated.get(c); } return null; };
const keyAt = (k) => L.waterwayAt(cx(k), cz(k)) || (isWet(k) ? 'pond' : '?');
console.log(`grid ${NX} x ${NZ} m: ${nWet} wet cells, ${solid.reduce((a, b) => a + b, 0)} of them stopped by a solid for a floating hull; ${FREE.sizes.length - 1} bodies of boat-free water (>= ${R_FREE} m clear), ${WETC.sizes.length - 1} bodies of water`);

// ---------------------------------------------------------------- the crossings
/** a crossing: c the centre, a the unit vector across the water (the deck axis), l the unit vector along it, w the deck width along the water, len the span across */
const crossings = [];
const rowCross = (z) => { const a = z.axis * DEG, ax = Math.sin(a), az = -Math.cos(a); return { id: z.id, key: z.key, c: z.c, ax, az, lx: -az, lz: ax, w: z.w, len: z.len, src: 'zone' }; };
for (const z of BRIDGE_ZONES) crossings.push(rowCross(z));
const wetNear = (x, z, r) => { for (let dz = -r; dz <= r; dz += 2) for (let dx = -r; dx <= r; dx += 2) if (isWet(idx(x + dx, z + dz))) return true; return false; };
{ // a bridge of services.bridges that has no row: its direction from the water round it (the principal axis of the wet cells within 40 m)
  const list = (ctx.services.bridges && ctx.services.bridges.list) || [], seen = new Set();
  for (const b of list) {
    if (b.part || seen.has(b.id)) continue; seen.add(b.id);
    if (crossings.some((c) => c.id === b.id || Math.hypot(c.c[0] - b.x, c.c[1] - b.z) < Math.max(40, c.len / 2 + 15))) continue;
    if (!wetNear(b.x, b.z, 14)) continue;
    let sx = 0, sz = 0, sxx = 0, szz = 0, sxz = 0, n = 0;
    for (let dz = -40; dz <= 40; dz += 2) for (let dx = -40; dx <= 40; dx += 2) if (isWet(idx(b.x + dx, b.z + dz))) { sx += dx; sz += dz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; n++; }
    if (n < 30) continue;
    const mx = sx / n, mz = sz / n, vxx = sxx / n - mx * mx, vzz = szz / n - mz * mz, vxz = sxz / n - mx * mz, th = 0.5 * Math.atan2(2 * vxz, vxx - vzz);
    crossings.push({ id: b.id, key: L.waterwayAt(b.x, b.z) || 'derived', c: [b.x, b.z], lx: Math.cos(th), lz: Math.sin(th), ax: -Math.sin(th), az: Math.cos(th), w: 20, len: 30, src: 'bridge list' });
  }
}
{ // a deck that no row and no bridge list knows (the east / north / Tauride bridges, the footbridges of New Holland): walk ramps and boxes standing 1 m or more over the water, clustered; the axis of the cluster is the deck
  const pts = [];
  for (const it of ph.items) {
    if (it.type !== 'ramp' && it.type !== 'walk') continue;
    const k = idx(it.cx, it.cz); if (!isWet(k) || it.boatPass) continue;
    const top = it.type === 'walk' ? it.top : Math.max(it.yA, it.yB); if (top < wl[k] + 1.0) continue;
    pts.push([it.cx, it.cz]);
  }
  const par = pts.map((_, i) => i), find = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; }, cell = new Map();
  pts.forEach((p, i) => { const key = Math.floor(p[0] / 14) + ',' + Math.floor(p[1] / 14); (cell.get(key) || cell.set(key, []).get(key)).push(i); });
  for (const [key, ids] of cell) { const [a, b] = key.split(',').map(Number); for (let k = 1; k < ids.length; k++) par[find(ids[k])] = find(ids[0]); for (const [da, db] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { const o = cell.get((a + da) + ',' + (b + db)); if (o) par[find(o[0])] = find(ids[0]); } }
  const groups = new Map(); pts.forEach((p, i) => { const r = find(i); (groups.get(r) || groups.set(r, []).get(r)).push(p); });
  let n = 0;
  for (const g of groups.values()) {
    if (g.length < 3) continue;
    const mx = g.reduce((a, p) => a + p[0], 0) / g.length, mz = g.reduce((a, p) => a + p[1], 0) / g.length;
    if (crossings.some((c) => Math.hypot(c.c[0] - mx, c.c[1] - mz) < Math.max(45, c.len / 2 + 30))) continue;
    let sxx = 0, szz = 0, sxz = 0; for (const p of g) { sxx += (p[0] - mx) ** 2; szz += (p[1] - mz) ** 2; sxz += (p[0] - mx) * (p[1] - mz); }
    const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ax = Math.cos(th), az = Math.sin(th);      // th: the deck axis (the long way of the cluster)
    let u0 = 1e9, u1 = -1e9; for (const p of g) { const u = (p[0] - mx) * ax + (p[1] - mz) * az; u0 = Math.min(u0, u); u1 = Math.max(u1, u); }
    crossings.push({ id: `deck@${mx.toFixed(0)},${mz.toFixed(0)}`, key: g.map((p) => L.waterwayAt(p[0], p[1])).find((k) => k) || 'pond', c: [mx + ax * (u0 + u1) / 2, mz + az * (u0 + u1) / 2], ax, az, lx: -az, lz: ax, w: 20, len: Math.max(20, u1 - u0 + 6), src: 'deck' }); n++;
  }
}
console.log(`${crossings.length} bridge crossings: ${crossings.filter((c) => c.src === 'zone').length} rows of BRIDGE_ZONES, ${crossings.filter((c) => c.src !== 'zone').length} more (the bridge list, the decks over water): ${crossings.filter((c) => c.src !== 'zone').map((c) => c.id).join(', ') || 'none'}`);

/** the free cell nearest to the centre line of the section at distance d along the water from the crossing centre (side s = -1 / +1); looks over the width of the span + 12 m */
function sectionCell(c, s, d) {
  const half = Math.min(c.len / 2 + 12, 330); let best = null, wet = 0;
  for (let t = -half; t <= half; t += 1) {
    const x = c.c[0] + c.lx * s * d + c.ax * t, z = c.c[1] + c.lz * s * d + c.az * t, k = idx(x, z);
    if (isWet(k)) wet++;
    if (k >= 0 && D[k] >= R_FREE && (!best || Math.abs(t) < Math.abs(best.t))) best = { k, t };
  }
  return { cell: best && best.k, wet };
}
/** Dijkstra over the free cells (clearance >= R_FREE) from cell a to cell b inside a window; the cost keeps to the middle of the channel. Returns the cell list or null. */
function route(a, b, pad = 70) {
  const ai = a % NX, aj = (a / NX) | 0, bi = b % NX, bj = (b / NX) | 0;
  const i0 = Math.max(1, Math.min(ai, bi) - pad), i1 = Math.min(NX - 2, Math.max(ai, bi) + pad), j0 = Math.max(1, Math.min(aj, bj) - pad), j1 = Math.min(NZ - 2, Math.max(aj, bj) + pad);
  const W = i1 - i0 + 1, H = j1 - j0 + 1, dist = new Float64Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1);
  const loc = (k) => ((k / NX | 0) - j0) * W + (k % NX - i0), glob = (l) => (j0 + (l / W | 0)) * NX + (i0 + l % W);
  const heap = [[0, loc(a)]]; dist[loc(a)] = 0;
  const push = (e) => { heap.push(e); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let m = i; const l = 2 * i + 1, r = l + 1; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const goal = loc(b);
  while (heap.length) {
    const [d, l] = pop(); if (d > dist[l]) continue; if (l === goal) break;
    const k = glob(l);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const i = (l % W) + di, j = (l / W | 0) + dj; if (i < 0 || j < 0 || i >= W || j >= H) continue;
      const ln = j * W + i, kn = glob(ln); if (D[kn] < R_FREE) continue;
      const step = (di && dj ? Math.SQRT2 : 1) * (1 + 14 * Math.pow(Math.max(0, (7 - D[kn]) / 7), 2)), nd = d + step;
      if (nd < dist[ln]) { dist[ln] = nd; prev[ln] = l; push([nd, ln]); }
    }
  }
  if (!(dist[goal] < Infinity)) return null;
  const out = []; for (let l = goal; l >= 0; l = prev[l]) out.push(glob(l));
  return out.reverse();
}
/** the real boat handling on the real world, an autopilot along `path` (cells): { reached, hits, scrapes, off, stuck, t, minD } */
function sail(path, { maxT = 0, thr = 0.6 } = {}) {
  const boat = createBoatHandling(ctx);
  const pts = []; for (let i = 0; i < path.length; i += 4) pts.push([cx(path[i]), cz(path[i])]); pts.push([cx(path[path.length - 1]), cz(path[path.length - 1])]);
  const len = path.length * 1.1, T = maxT || 20 + len / 4;
  const a = pts[0], b = pts[Math.min(3, pts.length - 1)];
  boat.reset(a[0], a[1], Math.atan2(b[0] - a[0], b[1] - a[1]));
  const res = { reached: false, hits: [], scrapes: 0, off: 0, stuck: false, t: 0 };
  let near = 0, lastProg = 0, bestFar = 0;
  const goal = pts[pts.length - 1], angDiff = (p, q) => { let x = p - q; x -= Math.PI * 2 * Math.round(x / (Math.PI * 2)); return x; };
  for (let t = 0; t < T; t += 1 / 60) {
    // the target: the point of the path 14 m (more at speed) beyond the nearest one
    let bd = 1e9, bi = near; for (let i = near; i < Math.min(pts.length, near + 12); i++) { const dd = Math.hypot(pts[i][0] - boat.x, pts[i][1] - boat.z); if (dd < bd) { bd = dd; bi = i; } }
    near = bi; let ti = near, acc = 0; const la = 12 + boat.speed / 3.6 * 1.2;
    while (ti < pts.length - 1 && acc < la) { acc += Math.hypot(pts[ti + 1][0] - pts[ti][0], pts[ti + 1][1] - pts[ti][1]); ti++; }
    const tg = pts[ti], dy = angDiff(Math.atan2(tg[0] - boat.x, tg[1] - boat.z), boat.yaw);
    boat.step(1 / 60, { thr: Math.abs(dy) > 0.6 ? 0.25 : thr, brk: 0, steer: Math.max(-1, Math.min(1, dy * 2.2)), hand: false });
    for (const e of boat.events) if (e.type === 'hit') res.hits.push({ x: +boat.x.toFixed(1), z: +boat.z.toFixed(1), v: +e.v.toFixed(1) }); else res.scrapes++;
    if (ph.waterLevel(boat.x, boat.z) === null) res.off++;
    res.t = t;
    const far = near * 4; if (far > bestFar + 0.5) { bestFar = far; lastProg = t; } else if (t - lastProg > 14) { res.stuck = true; break; }
    if (Math.hypot(goal[0] - boat.x, goal[1] - boat.z) < 5) { res.reached = true; break; }
  }
  res.x = boat.x; res.z = boat.z;
  return res;
}

// ---------------------------------------------------------------- a  every bridge
const report = [];
/** the principal axis of the wet cells within 40 m of (x, z): the way the water runs (th), or null when there is hardly any */
function waterAxis(x, z) {
  let sx = 0, sz = 0, sxx = 0, szz = 0, sxz = 0, n = 0;
  for (let dz = -40; dz <= 40; dz += 2) for (let dx = -40; dx <= 40; dx += 2) if (isWet(idx(x + dx, z + dz))) { sx += dx; sz += dz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; n++; }
  if (n < 30) return null;
  const mx = sx / n, mz = sz / n; return 0.5 * Math.atan2(2 * (sxz / n - mx * mz), (sxx / n - mx * mx) - (szz / n - mz * mz));
}
const unverified = [];      // { id, why }: a crossing the oracle could NOT sail, with the reason (printed in full: nothing is skipped silently)
for (const c0 of crossings) {
  if (ONLY && c0.id !== ONLY) continue;
  let c = c0;
  if (c.key === 'pond') { unverified.push({ id: c.id, why: 'over a pond / basin, not a waterway (not transport water)' }); continue; }
  { const iso = isolatedAt(c.c[0], c.c[1], Math.min(12, Math.max(4, c.len / 2))); if (iso) { unverified.push({ id: c.id, why: 'UNREACHABLE water (' + iso.key + ', ' + iso.size + ' m2): ' + iso.reason.split(':')[0] }); continue; } }
  // the cluster axis of a deck is a guess (a chain of decks along a river clusters into one long deck): the first try is that axis, the second the way the water runs
  const sections = (o) => { const d = o.w / 2 + 22; return { d, A: sectionCell(o, -1, d), B: sectionCell(o, 1, d) }; };
  let S = sections(c);
  if (c.src === 'deck' && !(S.A.cell && S.B.cell)) {
    const th = waterAxis(c.c[0], c.c[1]);
    if (th !== null) { const o = { ...c, lx: Math.cos(th), lz: Math.sin(th), ax: -Math.sin(th), az: Math.cos(th), len: 30, retried: true }, S2 = sections(o); if ((S2.A.cell && S2.B.cell) || (S2.A.wet && S2.B.wet && !(S.A.wet && S.B.wet))) { c = o; S = S2; } }
  }
  const { d, A, B } = S;
  const where = `${c.id} (${c.key}, ${c.src}${c.retried ? ', across the way the water runs' : ''}) at ${c.c[0].toFixed(0)}, ${c.c[1].toFixed(0)}`;
  const here = wetNear(c.c[0], c.c[1], Math.min(12, c.len / 2));
  if (!here && !A.wet && !B.wet) { if (c.src === 'deck') unverified.push({ id: c.id, why: 'no water in the territory at the deck' }); else report.push(`${where}: no water in the territory`); continue; }
  if (!A.cell || !B.cell) {
    if (!A.wet || !B.wet) { const why = `PARTIAL, ${!A.wet && !B.wet ? 'both sides' : !A.wet ? 'the -along side' : 'the +along side'} lie outside the territory (no water cell in the section ${d.toFixed(0)} m from the centre)`; if (c.src === 'deck') unverified.push({ id: c.id, why }); else report.push(`${where}: ${why}`); continue; }
    if (c.src === 'deck') { unverified.push({ id: c.id, why: `no ${R_FREE} m clear water at the section ${d.toFixed(0)} m from the deck on a side (${A.wet} / ${B.wet} wet cells): a narrow or winding channel, the derived deck axis is not reliable here` }); continue; }
    check(`a ${where}: a boat fits in the water on both sides`, () => assert.fail(`no ${R_FREE} m clear water at the section ${d.toFixed(0)} m ${!A.cell ? 'before' : 'after'} the bridge (${A.wet} / ${B.wet} wet cells in it): a solid or a narrow channel`));
    continue;
  }
  let path = null, territory = false;
  check(`a ${where}: the water on both sides is one body of boat-free water (a route under the bridge exists)`, () => {
    const ca = FREE.comp[A.cell], cb = FREE.comp[B.cell];
    if (ca !== cb && FREEX.comp[A.cell] === FREEX.comp[B.cell]) { territory = true; return; }      // joined outside the territory: the edge of the play area cuts it, not the bridge
    assert.equal(ca, cb, `closed: the water ${d.toFixed(0)} m before the bridge (body #${ca}, ${FREE.sizes[ca]} m2) and after it (#${cb}, ${FREE.sizes[cb]} m2) are separate bodies for a boat`);
    path = route(A.cell, B.cell); assert.ok(path, "no route: the water on both sides is connected only by a way round, the bridge itself is shut");
  });
  if (territory) { report.push(`${where}: PARTIAL, the two sides join only outside the territory (the play area cuts the water here)`); continue; }
  if (!path) continue;
  const run = sail(path), meters = path.length;
  check(`a ${where}: the boat sails under it (${meters} m route): no hit, no stuck, on the water`, () => {
    report.push(`${where}: sailed ${meters} m in ${run.t.toFixed(0)} s, ${run.scrapes} scrapes, ${run.hits.length} hits`);
    assert.ok(run.reached, `${run.stuck ? 'stuck' : 'timeout'} at ${run.x.toFixed(1)}, ${run.z.toFixed(1)} (${Math.hypot(run.x - cx(path[path.length - 1]), run.z - cz(path[path.length - 1])).toFixed(0)} m from the far side)`);
    assert.equal(run.hits.length, 0, `${run.hits.length} hits: ${JSON.stringify(run.hits.slice(0, 3))}`);
    assert.equal(run.off, 0, `${run.off} frames off the water`);
  });
}
{ // New Holland: the footbridges (landmarksNewHolland, services.landmarksNewHolland.bridges) cross the water of the Admiralty canals; the water under every one of them must be part of the MAIN body of boat-free water
  // (an explicit assertion: the generic deck search above can miss or mis-orient them, and a footbridge whose column or soffit walls the water would otherwise go unnoticed)
  const NH = ctx.services.landmarksNewHolland, foot = (NH && NH.bridges) || [];
  if (foot.length) {
    let mainFree = 1; for (let f = 1; f < FREE.sizes.length; f++) if (FREE.sizes[f] > FREE.sizes[mainFree]) mainFree = f;
    check(`a New Holland: the ${foot.length} footbridges (${foot.map((b) => b.id).join(', ')}) are crossed by the main body of boat-free water (${FREE.sizes[mainFree]} m2)`, () => {
      assert.ok(foot.length >= 4, 'expected the footbridges of New Holland (4 or more), the module publishes ' + foot.length);
      const bad = [];
      for (const b of foot) {
        const ux = Math.cos(b.rot), uz = -Math.sin(b.rot), n = Math.ceil(b.len); let wet = 0, free = 0, inMain = 0, walled = 0;
        for (let i = 0; i <= n; i++) { const t = -b.len / 2 + b.len * i / n, k = idx(b.x + ux * t, b.z + uz * t); if (!isWet(k)) continue; wet++; if (FREE.comp[k]) { free++; if (FREE.comp[k] === mainFree) inMain++; } else if (solid[k] && Dwet[k] >= R_FREE) walled++; }      // (the cells within 1.5 m of the quay are no boat-free water by definition)
        if (free < 3 || inMain !== free || walled) bad.push(`${b.id} at ${b.x.toFixed(0)}, ${b.z.toFixed(0)}: ${inMain} of ${free} boat-free cells of the span (${wet} wet, ${walled} walled by a solid in open water) lie in the main free body`);
        else report.push(`${b.id} (New Holland footbridge, ${b.kind}) at ${b.x.toFixed(0)}, ${b.z.toFixed(0)}: ${free} boat-free cells of the span (${wet} wet), all in the main free body`);
      }
      assert.equal(bad.length, 0, bad.join('; '));
    });
  }
}
console.log(report.map((s) => '     ' + s).join('\n'));
if (unverified.length) console.log(`     ${unverified.length} UNVERIFIED crossings (not sailed, each with its reason):\n` + unverified.map((u) => `       ${u.id}: ${u.why}`).join('\n'));

// ---------------------------------------------------------------- b  the pillars
const BRIDGE_MESH = /bridge|^brg-|troitsky|palace/i, NOT_PILLAR = /leaf|weight|boat|swan|duck|pontoon|env-piers|quay/i;
const pillars = [];      // { owner, pts: [[x, z, w, ymax, covered]], x, z, ext }
{
  const tiny = { W: 0.6, len: 0.6, centerZ: 0, hgt: HULL }, car = { x: 0, z: 0, y: 0, yaw: 0, floats: true }, out = {};
  const covered = (x, z, w) => { car.x = x; car.z = z; car.y = w; for (const b of ph.querySolids(x, z, 1.5)) if (carContact(car, tiny, b, out)) return true; return false; };
  ctx.scene.updateMatrixWorld(true);
  const samples = new Map();      // owner -> [[x, z, w, covered]]
  ctx.scene.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || !m.geometry || (m.userData && m.userData.submerged) || !m.geometry.attributes.position) return;
    const owner = `${m.name || '?'}<${m.parent && m.parent.name}`;
    if (!BRIDGE_MESH.test(m.name) && !BRIDGE_MESH.test(String(m.parent && m.parent.name))) return;
    if (NOT_PILLAR.test(m.name)) return;
    const pos = m.geometry.attributes.position, ix = m.geometry.index, e = m.matrixWorld.elements, n = ix ? ix.count : pos.count;
    const V = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let t = 0; t + 2 < n; t += 3) {
      let ymin = 1e9, ymax = -1e9;
      for (let k = 0; k < 3; k++) { const i = ix ? ix.getX(t + k) : t + k, x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), v = V[k]; v[0] = e[0] * x + e[4] * y + e[8] * z + e[12]; v[1] = e[1] * x + e[5] * y + e[9] * z + e[13]; v[2] = e[2] * x + e[6] * y + e[10] * z + e[14]; ymin = Math.min(ymin, v[1]); ymax = Math.max(ymax, v[1]); }
      const px = (V[0][0] + V[1][0] + V[2][0]) / 3, pz = (V[0][2] + V[1][2] + V[2][2]) / 3, k = idx(px, pz); if (!isWet(k)) continue;
      const w = ph.waterLevel(px, pz); if (w === null) continue; if (!(ymin < w + 0.05 && ymax > w + 0.5)) continue;
      const ux = V[1][0] - V[0][0], uy = V[1][1] - V[0][1], uz = V[1][2] - V[0][2], vx = V[2][0] - V[0][0], vy = V[2][1] - V[0][1], vz = V[2][2] - V[0][2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (Math.abs(ny / (Math.hypot(nx, ny, nz) || 1)) > 0.5) continue;
      if (Dwet[k] < 2) continue;      // beside the bank: the quay wall is the environment's
      for (const [qx, qz] of [[px, pz], [V[0][0], V[0][2]], [V[1][0], V[1][2]], [V[2][0], V[2][2]]]) { const q = idx(qx, qz); if (!isWet(q) || Dwet[q] < 1.5) continue; (samples.get(owner) || samples.set(owner, []).get(owner)).push([qx, qz, wl[q], covered(qx, qz, wl[q]), process.env.DBGP ? m.name + ' tri ' + V.map((v) => v[0].toFixed(1) + ',' + v[1].toFixed(1) + ',' + v[2].toFixed(1)).join(' | ') + ' mesh ' + m.id : '']); }
    }
  });
  // clusters of the samples of one owner (2.5 m cells, 8 neighbours); a cluster under 0.8 m across is a facet, not a pillar
  for (const [owner, S] of samples) {
    const cells = new Map(); S.forEach((s, i) => { const key = Math.floor(s[0] / 2.5) + ',' + Math.floor(s[1] / 2.5); (cells.get(key) || cells.set(key, []).get(key)).push(i); });
    const par = new Map([...cells.keys()].map((k) => [k, k])), find = (k) => { while (par.get(k) !== k) { par.set(k, par.get(par.get(k))); k = par.get(k); } return k; };
    for (const key of cells.keys()) { const [a, b] = key.split(',').map(Number); for (const [da, db] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { const k2 = (a + da) + ',' + (b + db); if (cells.has(k2)) par.set(find(key), find(k2)); } }
    const groups = new Map(); for (const [key, ids] of cells) { const r = find(key); (groups.get(r) || groups.set(r, []).get(r)).push(...ids.map((i) => S[i])); }
    for (const g of groups.values()) {
      const xs = g.map((s) => s[0]), zs = g.map((s) => s[1]), ext = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
      if (ext < 0.8) continue;
      pillars.push({ owner, pts: g, x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2, ext });
    }
  }
}
const open = pillars.filter((p) => p.pts.some((s) => !s[3]));
console.log(`${pillars.length} drawn pillars in open water (${[...new Set(pillars.map((p) => p.owner))].join(', ') || 'none'}); ${pillars.length - open.length} fully covered by a solid`);
check(`b every drawn pillar in open water is covered by a solid that stops a floating hull (${pillars.length} pillars)`, () => {
  const bad = open.filter((p) => p.pts.filter((s) => !s[3]).length / p.pts.length > 0.1);
  assert.equal(bad.length, 0, `${bad.length} pillars without (enough of) a collider: ` + bad.slice(0, 12).map((p) => `${p.owner} at ${p.x.toFixed(0)}, ${p.z.toFixed(0)} (${p.ext.toFixed(1)} m, ${p.pts.filter((s) => !s[3]).length}/${p.pts.length} samples bare, e.g. ${p.pts.filter((s) => !s[3]).slice(0, 2).map((s) => s[0].toFixed(1) + ', ' + s[1].toFixed(1) + ' ' + s[4]).join(' | ')})`).join('; '));
});
{ // ram each pillar from open water: a hit, never inside the drawn footing
  const list = ONLY ? [] : pillars.filter((p, i) => !QUICK || i % 4 === 0);
  const inside = (p, x, z) => { // point in the convex hull of the samples (cheap: inside the polygon of the hull)
    const H = hull(p.pts.map((s) => [s[0], s[1]])); let pos = 0, neg = 0;
    for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length], cr = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]); if (cr > 0) pos++; else if (cr < 0) neg++; }
    return H.length >= 3 && (pos === 0 || neg === 0);
  };
  function hull(P2) {
    const p = P2.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  const results = [];
  for (const p of list) {
    // an approach: the direction (of 16) with the longest straight run of open water (clearance >= 1.6 m) toward the pillar from at most 32 m
    let best = null;
    for (let a = 0; a < 16; a++) {
      const dx = Math.sin(a * Math.PI / 8), dz = Math.cos(a * Math.PI / 8); let run = 0;
      for (let r = p.ext / 2 + 2; r <= 34; r += 1) { const k = idx(p.x + dx * r, p.z + dz * r); if (!(k >= 0 && D[k] >= 1.6)) break; run = r; }
      if (run >= 14 && (!best || run > best.run)) best = { dx, dz, run };
    }
    if (!best) { results.push({ p, skipped: true }); continue; }
    const boat = createBoatHandling(ctx), sx = p.x + best.dx * best.run, sz = p.z + best.dz * best.run;
    boat.reset(sx, sz, Math.atan2(-best.dx, -best.dz));
    let hit = 0, inPillar = false, off = 0;
    for (let t = 0; t < 9; t += 1 / 60) {
      boat.step(1 / 60, { thr: 1, brk: 0, steer: 0, hand: false });
      for (const e of boat.events) if (e.type === 'hit') hit++;
      if (inside(p, boat.x, boat.z)) inPillar = true;
      if (ph.waterLevel(boat.x, boat.z) === null) off++;
    }
    results.push({ p, hit, inPillar, off, v: boat.speed });
  }
  const ran = results.filter((r) => !r.skipped);
  console.log(`     rammed ${ran.length} pillars (${results.length - ran.length} without a 14 m straight approach skipped)`);
  check(`b a boat driven at each pillar from open water gets a hit and never ends inside the drawn footing (${ran.length} pillars)`, () => {
    const bad = ran.filter((r) => !r.hit || r.inPillar);
    assert.equal(bad.length, 0, `${bad.length} pillars did not stop the boat: ` + bad.slice(0, 8).map((r) => `${r.p.owner} at ${r.p.x.toFixed(0)}, ${r.p.z.toFixed(0)} (${r.hit} hits${r.inPillar ? ', INSIDE' : ''}, ${r.v.toFixed(0)} km/h)`).join('; '));
  });
}

// ---------------------------------------------------------------- b2 no invisible wall in the river
{ // every solid that stops a floating hull in open water (>= 2.5 m from the bank) has something drawn at the waterline within 6 m of it (the middle of a wide pier is 5 m from its walls): a pier, a pontoon, a boat, a wall. A collider that is wider than its pillar (or has none) is a wall of water.
  const drawn = new Set(), key = (x, z) => Math.floor(x) + ',' + Math.floor(z);
  ctx.scene.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || !m.geometry || !m.geometry.attributes.position) return;
    const pos = m.geometry.attributes.position, ix = m.geometry.index, e = m.matrixWorld.elements, n = ix ? ix.count : pos.count, V = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let t = 0; t + 2 < n; t += 3) {
      let ymin = 1e9, ymax = -1e9;
      for (let k = 0; k < 3; k++) { const i = ix ? ix.getX(t + k) : t + k, x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), v = V[k]; v[0] = e[0] * x + e[4] * y + e[8] * z + e[12]; v[1] = e[1] * x + e[5] * y + e[9] * z + e[13]; v[2] = e[2] * x + e[6] * y + e[10] * z + e[14]; ymin = Math.min(ymin, v[1]); ymax = Math.max(ymax, v[1]); }
      const k0 = idx((V[0][0] + V[1][0] + V[2][0]) / 3, (V[0][2] + V[1][2] + V[2][2]) / 3); if (k0 < 0 || wlx[k0] !== wlx[k0]) continue;
      const w = wlx[k0]; if (!(ymin < w + 0.3 && ymax > w + 0.3)) continue;      // (touches or crosses the surface; the walls of a boat hull, a pontoon, a pier)
      for (let a = 0; a < 3; a++) { const p = V[a], q = V[(a + 1) % 3], l = Math.hypot(q[0] - p[0], q[2] - p[2]), nn = Math.max(1, Math.ceil(l)); for (let i = 0; i <= nn; i++) drawn.add(key(p[0] + (q[0] - p[0]) * i / nn, p[2] + (q[2] - p[2]) * i / nn)); }
    }
  });
  // n4spb (Vasilyevsky, the Rumyantsevsky apron): the pit ring of a landmark module (WATER.ownerRings) may hold a walkable PLATFORM that stands over the water (the apron floor, 2.2 m over the Neva, its pink skirt drawn along the river edge):
  // the walk slabs stop a hull, and the middle of an 18 m wide platform is more than 6 m from any drawn waterline surface. A solid cell under such a platform is the platform itself, not a wall of water: the skirt at the river edge
  // is what a boat meets (it is drawn and tested here like every other wall). Bridges are not owner rings: the decks of a bridge stay under the rule.
  const platRings = WATER_TABLE.ownerRings.map((w) => (w.ring || w.o || []).flat()).filter((o) => o.length >= 6);
  const inRing = (o, x, z) => { let c = false; for (let i = 0, j = o.length / 2 - 1; i < o.length / 2; j = i++) { const xi = o[2 * i], zi = o[2 * i + 1], xj = o[2 * j], zj = o[2 * j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const underPlatform = (x, z, w) => platRings.some((o) => inRing(o, x, z)) && ph.groundHeight(x, z, 1e9, false) > w + 0.3;
  const bad = new Map();
  for (let k = 0; k < solid.length; k++) {
    if (!solid[k] || !isWet(k) || Dwet[k] < 2.5) continue;
    if (underPlatform(cx(k), cz(k), wl[k])) continue;
    const x = cx(k), z = cz(k); if (!L.waterwayAt(x, z)) continue;      // (a waterway: the ponds of the gardens have islands, rocks and trees of their own)
    let near = false;
    for (let dz = -6; dz <= 6 && !near; dz++) for (let dx = -6; dx <= 6; dx++) if (drawn.has(key(x + dx, z + dz))) { near = true; break; }
    if (!near) { const c = Math.floor(x / 20) + ',' + Math.floor(z / 20), e = bad.get(c) || { n: 0, x, z, ids: new Set() }; e.n++; bad.set(c, e); }
  }
  const total = [...bad.values()].reduce((a, e) => a + e.n, 0);
  check('b no invisible wall in the river: every solid cell of open water has a drawn wall within 6 m (' + total + ' cells without)', () => {
    assert.equal(total, 0, total + ' blocked water cells with nothing drawn near them, e.g. ' + [...bad.values()].sort((a, b) => b.n - a.n).slice(0, 6).map((e) => e.n + ' at ' + e.x.toFixed(0) + ', ' + e.z.toFixed(0)).join('; '));
  });
}

// ---------------------------------------------------------------- e  the plane scan: no stone in the hull's reach
{ // every point where a drawn bridge surface (soffit, spandrel face, pier, deck edge) crosses the plane 0.62 m over the water (the gunwale: SPEC_BOAT.hgt is 0.7) and has open water around it (1.5 m or more from the bank: the shore probes keep the hull's centre 1.35 m off the bank, a stone strip nearer than that is out of reach, the colliders start at 1 m) must stop a floating hull
  // (carContact with the hull's collision height): else a boat enters the stone near the springings of an arch bridge. A bridge that is a known low-clearance one (bridges/piers.js LOW_CLEARANCE: its drawn soffit is lower than the hull over the whole width of the channel; making it solid would wall the water) is excluded here and listed below.
  const LOW_CLEARANCE = new Set(Object.keys(LOW_CLEARANCE_BRIDGES));
  const tiny = { W: 0.6, len: 0.6, centerZ: 0, hgt: HULL }, car = { x: 0, z: 0, y: 0, yaw: 0, floats: true }, out = {};
  const stops = (x, z, w) => { car.x = x; car.z = z; car.y = w; for (const b of ph.querySolids(x, z, 1.5)) if (carContact(car, tiny, b, out)) return true; return false; };
  const openWater = (x, z, r) => { for (let a = 0; a < 16; a++) if (ph.waterLevel(x + Math.cos(a * Math.PI / 8) * r, z + Math.sin(a * Math.PI / 8) * r) === null) return false; return true; };      // (water all round at r metres)
  const bare = new Map(), seenE = new Set(); let tested = 0, pondPts = 0;
  ctx.scene.updateMatrixWorld(true);
  ctx.scene.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || !m.geometry || (m.userData && m.userData.submerged) || !m.geometry.attributes.position) return;
    if (!BRIDGE_MESH.test(m.name) && !BRIDGE_MESH.test(String(m.parent && m.parent.name))) return;
    if (NOT_PILLAR.test(m.name)) return;
    const owner = m.name || '?', pos = m.geometry.attributes.position, ix = m.geometry.index, e = m.matrixWorld.elements, n = ix ? ix.count : pos.count, V = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let t = 0; t + 2 < n; t += 3) {
      for (let k = 0; k < 3; k++) { const i = ix ? ix.getX(t + k) : t + k, x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), v = V[k]; v[0] = e[0] * x + e[4] * y + e[8] * z + e[12]; v[1] = e[1] * x + e[5] * y + e[9] * z + e[13]; v[2] = e[2] * x + e[6] * y + e[10] * z + e[14]; }
      let w = NaN; for (const q of [[(V[0][0] + V[1][0] + V[2][0]) / 3, (V[0][2] + V[1][2] + V[2][2]) / 3], [V[0][0], V[0][2]], [V[1][0], V[1][2]], [V[2][0], V[2][2]]]) { const l = ph.waterLevel(q[0], q[1]); if (l !== null) { w = l; break; } }
      if (w !== w) continue;
      const pl = w + 0.62, d = [V[0][1] - pl, V[1][1] - pl, V[2][1] - pl], cross = [];
      for (let a = 0; a < 3; a++) { const b = (a + 1) % 3; if ((d[a] > 0) !== (d[b] > 0)) { const f = d[a] / (d[a] - d[b]); cross.push([V[a][0] + (V[b][0] - V[a][0]) * f, V[a][2] + (V[b][2] - V[a][2]) * f]); } }
      if (cross.length < 2) continue;
      const [p, q] = cross, l = Math.hypot(q[0] - p[0], q[1] - p[1]), nn = Math.max(1, Math.ceil(l / 0.4));
      for (let i = 0; i <= nn; i++) {
        const x = p[0] + (q[0] - p[0]) * i / nn, z = p[1] + (q[1] - p[1]) * i / nn, k = idx(x, z); if (!isWet(k) || !openWater(x, z, 1.4)) continue;
        if (!L.waterwayAt(x, z)) { pondPts++; continue; }      // (a pond / basin of a garden: no transport water, no boat reaches it)
        const gk = Math.floor(x * 2) + ',' + Math.floor(z * 2); if (seenE.has(gk)) continue; seenE.add(gk); tested++;
        if (!stops(x, z, wl[k])) { const r = bare.get(owner) || { n: 0, x, z }; r.n++; bare.set(owner, r); }
      }
    }
  });
  for (const [o, why] of Object.entries(LOW_CLEARANCE_BRIDGES)) if (bare.has(o)) console.log(`     known low-clearance bridge ${o} (no soffit collider, not part of check e): ${why}`);
  const list = [...bare.entries()].sort((a, b) => b[1].n - a[1].n);
  console.log(`     plane scan 0.62 m over the water: ${tested} points of drawn bridge surface in open water of the waterways (${pondPts} more over ponds, not transport water, skipped), ${list.reduce((a, [, r]) => a + r.n, 0)} without a collider that stops the hull${list.length ? ' (' + list.slice(0, 6).map(([o, r]) => o + ' ' + r.n + ' e.g. at ' + r.x.toFixed(1) + ', ' + r.z.toFixed(1)).join('; ') + ')' : ''}`);
  check(`e plane scan: every point of a drawn bridge surface 0.62 m over open water stops a floating hull (${tested} points)`, () => {
    const bad = list.filter(([o]) => !LOW_CLEARANCE.has(o));
    assert.equal(bad.length, 0, bad.length + ' meshes with stone in reach of the hull and no collider: ' + bad.slice(0, 8).map(([o, r]) => `${o}: ${r.n} points, e.g. at ${r.x.toFixed(1)}, ${r.z.toFixed(1)}`).join('; '));
  });
}

// ---------------------------------------------------------------- c  the bodies of water
{
  const bodies = []; // per body of wet cells: the boat-free bodies inside it (only the bodies of a WATERWAY of WATERWAYS: a garden pond or a basin is not a transport water)
  const inWet = new Map(), isWaterway = new Set();
  for (let k = 0; k < WETC.comp.length; k++) if (WETC.comp[k] && !isWaterway.has(WETC.comp[k]) && L.waterwayAt(cx(k), cz(k))) isWaterway.add(WETC.comp[k]);
  for (let k = 0; k < FREE.comp.length; k++) { const f = FREE.comp[k]; if (!f) continue; const w = WETC.comp[k]; if (!isWaterway.has(w)) continue; let m = inWet.get(w); if (!m) inWet.set(w, (m = new Set())); m.add(f); }
  for (const w of [...inWet.keys()]) if (isolated.has(w)) inWet.delete(w);      // (unreachable water: listed above, not a transport water)
  for (const [w, set] of inWet) bodies.push({ w, size: WETC.sizes[w], box: WETC.boxes[w], free: [...set].map((f) => ({ f, size: FREE.sizes[f], box: FREE.boxes[f] })).sort((a, b) => b.size - a.size) });
  bodies.sort((a, b) => b.size - a.size);
  const keysOf = (box) => { const ks = new Set(); for (let i = 0; i < 40; i++) { const k = idx(box[0] + (box[1] - box[0]) * (i % 8 + 0.5) / 8, box[2] + (box[3] - box[2]) * (Math.floor(i / 8) + 0.5) / 5); if (isWet(k)) ks.add(keyAt(k)); } return [...ks]; };
  for (const b of bodies.slice(0, 12)) {
    const keys = new Set(); for (const f of b.free.slice(0, 4)) for (const kk of keysOf(f.box)) keys.add(kk);
    console.log(`     water body ${b.w}: ${b.size} m2 in [${b.box.map((v) => v.toFixed(0)).join(', ')}], ${b.free.length} boat-free part(s): ${b.free.slice(0, 5).map((f) => f.size).join(' + ')}${b.free.length > 5 ? ' + ...' : ''} m2${keys.size ? '; waterways ' + [...keys].join(', ') : ''}`);
  }
  /** the body of FREEX (the boat-free water where the territory does not count) that a boat-free body f belongs to */
  const anyCellX = (f) => { const bx = FREE.boxes[f]; for (let j = Math.floor(bx[2] - Z0); j <= Math.ceil(bx[3] - Z0); j++) for (let i = Math.floor(bx[0] - X0); i <= Math.ceil(bx[1] - X0); i++) if (FREE.comp[j * NX + i] === f) return FREEX.comp[j * NX + i]; return -1; };
  /** where a cut-off pocket f comes closest to the main body m: { d, x, z } (the barrier between them is there: a bridge, a pier, a quay wall across a mouth) */
  const closest = (f, m) => {
    let best = { d: 1e9 };
    const bx = FREE.boxes[f], i0 = Math.floor(bx[0] - X0), i1 = Math.ceil(bx[1] - X0), j0 = Math.floor(bx[2] - Z0), j1 = Math.ceil(bx[3] - Z0), R = 30;
    for (let j = j0; j <= j1; j += 2) for (let i = i0; i <= i1; i += 2) {
      const k = j * NX + i; if (FREE.comp[k] !== f) continue;
      for (let dj = -R; dj <= R; dj += 2) for (let di = -R; di <= R; di += 2) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= NX || jj >= NZ) continue; if (FREE.comp[jj * NX + ii] === m) { const d = Math.hypot(di, dj); if (d < best.d) best = { d, x: X0 + i + di / 2, z: Z0 + j + dj / 2 }; } }
    }
    return best;
  };
  check('c water that joins is ONE body of boat-free water: no pocket of >= 400 m2 cut off by a bridge, pier or wall', () => {
    const cut = [];
    for (const b of bodies) for (const f of b.free.slice(1)) if (f.size >= 400) { const c = closest(f.f, b.free[0].f); if (anyCellX(f.f) === anyCellX(b.free[0].f)) { console.log(`     (a pocket of ${f.size} m2 at [${f.box.map((v) => v.toFixed(0)).join(', ')}] joins the main part only outside the territory: the edge of the play area cuts it)`); continue; } cut.push(`water body ${b.w} (${b.size} m2): a boat-free part of ${f.size} m2 at [${f.box.map((v) => v.toFixed(0)).join(', ')}] is cut off from the main part of ${b.free[0].size} m2${c.d < 1e9 ? '; the barrier is near ' + c.x.toFixed(0) + ', ' + c.z.toFixed(0) + ' (' + c.d.toFixed(0) + ' m apart)' : ''}`); }
    assert.equal(cut.length, 0, cut.slice(0, 8).join('\n     '));
  });
}
console.log(fails ? `\n${fails} FAILED of ${checks + fails}` : `\nALL ${checks} PASSED`);
process.exit(fails ? 1 : 0);
