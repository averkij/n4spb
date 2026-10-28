// tools/water-reachable-test.mjs - THE RULE FOR CHECKING "water is reachable" (CLAUDE.md "World rules", docs/AREAS.md 13.7), CPU only, no GPU, no bake:
//   node tools/area.mjs <palace|smolny|admiralty|vladimirsky|vasilyevsky> tools/water-reachable-test.mjs [--quick]            npm run water   (the five live areas)
// It builds the REAL modules of the area headlessly (tools/lib/headless-world.mjs: environment, bridges, streets, the landmark modules ... everything that owns colliders; no city / people / traffic) and proves
// with the area's real colliders, the real Physics + Player and the real car handling (drive/handling.js):
//   1  no collider and no territory predicate classifies a water cell as blocked: every sampled water cell in the play area is inside the territory, reachable for the car (handling.blocked), has a finite ground
//      (the bed), is no keep-out; the free water cells form ONE connected body per waterway (no wall of colliders cuts the water); the only solids standing in water are structures (piers, abutments, decks)
//   2  a walker enters the water where no fence stands (an open quay edge), falls into the trench, WADES (slower, depth > 0), walks on the bed, cannot climb a trench wall
//   3  a fence bay knocked away opens the way: before the knock the same walk is stopped, the collider is gone after it, the low rest box is no obstacle, the walker goes in
//   4  the car drives off an edge through a broken fence, FALLS to the bed (the 'land' + 'hit' events: fall damage by the existing damage model), drives on the bed with the water drag, cannot climb out
//   5  a flight landing over water is allowed (player.landingBlocked)
//   6  the AUDIT: every thin tall collider near water is a knock record (a fence, a parapet, a railing ...) except the listed structures; every knock record of kind 'fence' owns its collider
//   7  (smolny) the Tauride ponds are water (physics.waterLevel), no shore colliders, a walker steps into them from the bank, the car keep-out does not cover the ponds
// A pose in water is never a failure; a wall of water is.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

const QUICK = process.argv.includes('--quick');
const AREA = process.env.AREA || 'palace';
let checks = 0, fails = 0;
const ONLY = process.env.ONLY || null;      // ONLY=<text>: run only the checks whose name contains the text (a development aid)
const check = (name, fn) => { if (ONLY && !ONLY.split('|').some((s) => name.includes(s))) return; try { fn(); checks++; console.log('PASS', name); } catch (e) { fails++; console.log('FAIL', name, '\n    ', String(e.message).split('\n').slice(0, 6).join('\n     ')); } };
const t0 = Date.now();
const { ctx, L, THREE, built, marks, errors } = await buildWorld({ log: (s) => console.log(s) });
console.log(`area ${AREA}: built ${built.length} modules in ${((Date.now() - t0) / 1000).toFixed(0)} s: ${built.join(' ')}; ${ctx.physics.items.length} colliders, ${ctx.knock.stats.registered} knock records ${JSON.stringify(ctx.knock.stats.byKind)}`);
const ph = ctx.physics;
const troitskyItems = marks.landmarksTroitsky ? ph.items.slice(marks.landmarksTroitsky[0], marks.landmarksTroitsky[1]) : [];      // (taken before any test knocks something: knocking splices ph.items)
const { Player } = await import('../src/core/player.js');
const { createHandling } = await import('../src/world/drive/handling.js');
const { SPEC } = await import('../src/world/drive/model.js');
const { MASS, tuningFor } = await import('../src/world/drive/cars/tuning.js');
const { HOOKS } = await import('../src/world/lib/area-tables.js');
const { isPierBox } = await import('../src/world/bridges/piers.js');
const hyp = Math.hypot, DEG = 180 / Math.PI;
const { floorZones: BRIDGE_FLOORS_FN } = await import('../src/world/environment/river.js'), BRIDGE_FLOORS = BRIDGE_FLOORS_FN();
const modOf = (it) => { const i = ph.items.indexOf(it); for (const [n, [a, b]] of Object.entries(marks)) if (i >= a && i < b) return n; return '?'; };
const env = ctx.services.environment;

// ---------------------------------------------------------------- helpers
function walker(x, z, dx = 0, dz = -1) {
  const dom = { addEventListener() {}, requestPointerLock() {} }, cam = new THREE.PerspectiveCamera();
  const p = new Player(cam, dom, ph, L.WORLD.play);
  p.enabled = true; p.clampXZ = L.clampToPlay; p.solidAt = L.insideBuilding; p.smoothing = 0;
  p.setPose(x, z, Math.atan2(-dx, -dz) * DEG, 0);
  return p;
}
const heading = (p, dx, dz) => { p.yaw = Math.atan2(-dx, -dz); };
function walk(p, seconds, { run = false, dt = 1 / 60 } = {}) {
  p.keys.add('KeyW'); if (run) p.keys.add('ShiftLeft');
  let minY = p.pos.y, maxDepth = 0;
  for (let t = 0; t < seconds - 1e-9; t += dt) { p.time += dt; p.update(dt); minY = Math.min(minY, p.pos.y); maxDepth = Math.max(maxDepth, p.depth, ph.waterLevel(p.pos.x, p.pos.z) !== null ? Math.max(0, ph.waterLevel(p.pos.x, p.pos.z) - p.pos.y) : 0); }
  p.keys.clear(); return { minY, maxDepth };
}
const waterAt = (x, z) => ph.waterLevel(x, z);
const knockUpdate = (seconds) => { for (let t = 0; t < seconds; t += 1 / 60) ctx.knock.update(1 / 60); };
/** unit normal of a bay record that points to the water (within 7 m), or null */
function towardWater(r) {
  const tx = Math.cos(r.rotY), tz = -Math.sin(r.rotY);
  for (const [nx, nz] of [[-tz, tx], [tz, -tx]]) { for (const d of [1.5, 3, 5, 7]) if (waterAt(r.x + nx * d, r.z + nz * d) !== null) return { nx, nz, tx, tz }; }
  return null;
}
/** is the corridor around the segment (x0, z0) -> (x1, z1) free of every solid except `except` (a Set of colliders) at standing height ? (radius r) */
function corridorFree(x0, z0, x1, z1, r, y0, y1, except) {
  const n = Math.max(2, Math.ceil(hyp(x1 - x0, z1 - z0) / 0.6));
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n;
    for (const it of ph.querySolids(x, z, r + 1)) {
      if (except && except.has(it)) continue;
      if (it.type === 'hole') continue;
      if (it.type === 'walk' || it.type === 'ramp') { const top = it.type === 'walk' ? it.top : Math.max(it.yA, it.yB); if (top <= y0 + 0.45) continue; }
      const hi = it.type === 'walk' ? it.top : it.type === 'ramp' ? Math.max(it.yA, it.yB) : it.y1;
      if (hi <= y0 + 0.45 || it.y0 >= y1) continue;
      const q = { x, z }; const moved = (() => { const c = { x, z }; ph.resolve(c, r, y0, 1.7); return hyp(c.x - x, c.z - z) > 0.02; })();
      if (moved) { corridorFree.last = it; return false; }
      void q; break;
    }
  }
  return true;
}
const fences = () => ctx.knock.list.filter((r) => r.kind === 'fence');

// ---------------------------------------------------------------- 0 the build itself
check('0 the modules built without a module error (headless)', () => { const bad = errors.filter((e) => /failed|is not a function|is not defined|Cannot read/.test(e)); assert.equal(bad.length, 0, bad.slice(0, 3).join('\n')); });
check('0 the fences are knock records with colliders: every fence record owns its box, every box of a record is in the physics grid', () => {
  const fs = fences(); assert(fs.length > 200, 'fence records: ' + fs.length);
  const inGrid = new Set(ph.items);
  let noItem = 0, lost = 0; for (const r of fs) { if (!r.items.length && !r.dynamic) noItem++; for (const it of r.items) if (!inGrid.has(it)) lost++; }
  assert.equal(noItem, 0, noItem + ' fence records without a collider'); assert.equal(lost, 0, lost + ' collider handles missing from the physics');
});

// ---------------------------------------------------------------- 1 water cells are not blocked
const car0 = createHandling(ctx, null);
const cells = [];                                                          // sampled water cells inside the play area: { x, z, key, level }
{
  const keys = Object.keys(L.WATERWAYS), step = QUICK ? 24 : 12, R = L.WORLD.play;
  for (let x = R.x0; x <= R.x1; x += step) for (let z = R.z0; z <= R.z1; z += step) {
    if (!L.inPlay(x, z)) continue; const k = L.waterwayAt(x, z); if (k) cells.push({ x, z, key: k, level: L.WATERWAYS[k].water });
  }
  void keys;
}
console.log(`water cells sampled in the play area: ${cells.length} (${[...new Set(cells.map((c) => c.key))].join(', ')})`);
check('1 water cells in the play area: inside the territory, not clamped, not blocked for a car (buildings aside), finite ground, no keep-out', () => {
  assert(cells.length > 300, 'too few water cells: ' + cells.length);
  const bad = { outside: 0, clamped: 0, blocked: 0, ground: 0, keepOut: 0, noLevel: 0 }, ex = [];
  for (const c of cells) {
    if (L.insideBuilding(c.x, c.z)) continue;
    if (!L.inPlay(c.x, c.z)) { bad.outside++; ex.push(['outside', c.x, c.z]); }
    const cl = L.clampToPlay(c.x, c.z, 0); if (cl[0] !== c.x || cl[1] !== c.z) bad.clamped++;
    if (car0.blocked(c.x, c.z)) { bad.blocked++; if (ex.length < 6) ex.push(['blocked', c.x, c.z]); }
    const g = ph.groundHeight(c.x, c.z, c.level - 0.3, false); if (!Number.isFinite(g) || g > c.level + 0.3) { bad.ground++; if (ex.length < 6) ex.push(['ground', c.x, c.z, g]); }      // (the bed, or a landing stage / step on it; never a void)
    if (HOOKS.carKeepOut && HOOKS.carKeepOut(c.x, c.z)) bad.keepOut++;
    if (ph.waterLevel(c.x, c.z) !== c.level) bad.noLevel++;
  }
  assert.deepEqual(bad, { outside: 0, clamped: 0, blocked: 0, ground: 0, keepOut: 0, noLevel: 0 }, JSON.stringify(ex.slice(0, 6)));
});
check('1 no wall of colliders cuts a body of water: every connected body of water cells (the territory alone) keeps >= 90 % of its FREE cells in one connected part (piers, abutments and buildings are holes, not walls)', () => {
  const step = QUICK ? 8 : 4, cs = [];
  for (const k of Object.keys(L.WATERWAYS)) void k;
  const R = L.WORLD.play;
  for (let x = R.x0; x <= R.x1; x += step) for (let z = R.z0; z <= R.z1; z += step) { if (!L.inPlay(x, z)) continue; const k = L.waterwayAt(x, z); if (k) cs.push({ x, z, k }); }
  const idx = new Map(); for (const c of cs) idx.set(Math.round(c.x / step) + ',' + Math.round(c.z / step), c);
  const free = new Set();
  for (const [k, c] of idx) {
    const bed = L.heightAt(c.x, c.z); let blocked = L.insideBuilding(c.x, c.z);
    if (!blocked) { const p = { x: c.x, z: c.z }; ph.resolve(p, 0.35, bed, 1.7); blocked = hyp(p.x - c.x, p.z - c.z) > 0.02; }
    // under a bridge deck the solids are STRUCTURES (a low slab bridge over a 10 m diagonal canal, Admiralty-Haymarket: its underside is 0.4 m above the water, a wader on the bed does not fit under it): a hole, not a wall of the water
    if (blocked && ctx.services.bridges && ctx.services.bridges.deckY && ctx.services.bridges.deckY(c.x, c.z) !== null) blocked = false;
    if (!blocked) free.add(k);
  }
  const comps = (has) => { const comp = new Map(), sizes = []; for (const s0 of has) { if (comp.has(s0)) continue; const id = sizes.length; let n = 0; const q = [s0]; comp.set(s0, id); while (q.length) { const k = q.pop(); n++; const [i, j] = k.split(',').map(Number); for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const kk = (i + di) + ',' + (j + dj); if (has.has(kk) && !comp.has(kk)) { comp.set(kk, id); q.push(kk); } } } sizes.push(n); } return { comp, sizes }; };
  const all = comps(new Set(idx.keys())), fr = comps(free), bad = [];
  all.sizes.forEach((n, id) => {
    if (n < 40) return;
    const parts = new Map(); for (const [k, cid] of all.comp) if (cid === id && free.has(k)) { const f = fr.comp.get(k); parts.set(f, (parts.get(f) || 0) + 1); }
    const tot = [...parts.values()].reduce((p, q) => p + q, 0), best = Math.max(0, ...parts.values()), share = best / Math.max(1, tot);
    let key = ''; for (const [k, cid] of all.comp) if (cid === id) { key = idx.get(k).k; break; }
    console.log(`  body of ${key}: ${n} cells (${(n * step * step / 1e4).toFixed(1)} ha), ${tot} free, largest free part ${(share * 100).toFixed(1)} %`);
    // the castle moat is a ring (1.2 m deep) crossed by low stone decks that stand on the bed (landmarksCastle/bridge.js: a structure with no clearance for a wader, like a pier): it may fall into one arc per deck, no more
    const decks = ((ctx.services.landmarksCastle && ctx.services.landmarksCastle.bridge && ctx.services.landmarksCastle.bridge.decks) || []).length, two = [...parts.values()].filter((q) => q >= 3).length <= decks + 1 ? 1 : 0;      // (a ring crossed by D decks falls into at most D arcs; the castle has the three decks of the module and the one of the river's bridge zones)
    if (key === 'moat' ? !two : share < 0.9) bad.push(key + ' ' + n + ' cells ' + (share * 100).toFixed(1) + ' % (' + [...parts.values()].join('/') + ' cells in the parts, ' + decks + ' decks)');
  });
  assert(all.sizes.some((n) => n >= 40) && bad.length === 0, 'cut waters: ' + bad.join(', '));
});
check('1 the solids that stand in water (a collider on a water cell that stops a walker on the bed) are structures, never a fence line: no fence-kind record and no thin long wall on a water cell', () => {
  const ex = [];
  for (const it of ph.items) {
    if (it.type !== 'box' && it.type !== 'cyl') continue; if (isPierBox(it)) continue;      // (the pier / soffit boxes of bridges/piers.js are bridge structure by construction: a drawn pillar or the stone of an arch springing, never a fence line)
    const x = it.cx, z = it.cz; if (!L.inPlay(x, z, -5) || waterAt(x, z) === null) continue;
    const bed = L.heightAt(x, z); if (it.y1 <= bed + 0.45 || it.y0 >= bed + 1.7) continue;
    const thin = it.type === 'box' && Math.min(it.hw, it.hd) * 2 <= 1.1 && Math.max(it.hw, it.hd) * 2 >= 4;
    if (thin && (it.y1 - bed) < 3 && L.waterwayAt(x, z) !== 'moat') ex.push([modOf(it), +x.toFixed(0), +z.toFixed(0), +it.y0.toFixed(1), +it.y1.toFixed(1), +(Math.max(it.hw, it.hd) * 2).toFixed(1)]);
  }
  assert.equal(ex.length, 0, 'thin walls standing IN water: ' + JSON.stringify(ex.slice(0, 6)));
});

// ---------------------------------------------------------------- 2 a walker enters the water where no fence stands
const segs = (env && env.quay && env.quay.segments) || [];
function openEdges() {
  const out = [];
  for (const s of segs) {
    const len = hyp(s.bx - s.ax, s.bz - s.az); if (len < 3 || s.slope) continue;
    for (let u = 1; u < len - 1; u += 2) {
      const px = s.ax + (s.bx - s.ax) * u / len, pz = s.az + (s.bz - s.az) * u / len, sx = px + s.nx * 3.0, sz = pz + s.nz * 3.0, ex = px - s.nx * 0.6, ez = pz - s.nz * 0.6;
      if (!L.inPlay(sx, sz, 8) || L.insideBuilding(sx, sz, 1) || L.insideBuilding(px, pz, 1)) continue;
      if (waterAt(px - s.nx * 1.0, pz - s.nz * 1.0) === null) continue;              // the water must start right behind the wall line
      if (!corridorFree(sx, sz, ex, ez, 0.35, 0, 1.7, null)) continue;
      if (Math.abs(ph.groundHeight(sx, sz, 30, false)) > 0.6 || ph.groundHeight(px - s.nx * 1.0, pz - s.nz * 1.0, 30, false) > waterAt(px - s.nx * 1.0, pz - s.nz * 1.0) - 0.3) continue;      // a street-level start, and no deck / landing stage over the water edge (a bridge approach is no quay edge)
      out.push({ sx, sz, dx: -s.nx, dz: -s.nz, key: s.key, px, pz });
    }
  }
  return out;
}
/** the generic scan: from every sampled water cell in 8 directions to the first land, 3 m further inland a start, the straight corridor to the water free of solids */
function openEdgesScan() {
  const out = [];
  for (const c of cells) for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4, dx = Math.cos(a), dz = Math.sin(a); let d = 1; while (d < 16 && waterAt(c.x + dx * d, c.z + dz * d) !== null) d++;
    if (d >= 16) continue;
    const bx = c.x + dx * (d - 0.5), bz = c.z + dz * (d - 0.5), lx = c.x + dx * d, lz = c.z + dz * d, sx = lx + dx * 3, sz = lz + dz * 3;
    if (!L.inPlay(sx, sz, 8) || L.insideBuilding(sx, sz, 1) || waterAt(sx, sz) !== null || !corridorFree(sx, sz, bx, bz, 0.35, 0, 1.7, null)) continue;
    if (ph.groundHeight(bx, bz, 30, false) > waterAt(bx, bz) - 0.3 || Math.abs(ph.groundHeight(sx, sz, 30, false)) > 0.6) continue;       // a deck / a landing stage over the water edge is no edge
    out.push({ sx, sz, dx: -dx, dz: -dz, key: c.key, px: lx, pz: lz });
  }
  return out;
}
let open = openEdges(); if (!open.length) open = openEdgesScan();
console.log(`open edges found (no collider between the pavement and the water): ${open.length}`);
check('2 a walker steps off an OPEN quay edge into the water, falls into the trench and wades: depth > 0, slower, on the bed; cannot climb the wall back; the camera stays above the bed', () => {
  if (!open.length) { console.log('  (every edge of the water in this area is fenced: the open-edge walk is covered by check 3, a fence bay knocked away)'); return; }
  const picks = []; const seenKey = new Set();
  for (const o of open) { if (picks.length >= (QUICK ? 3 : 8)) break; const k = o.key + Math.round(o.px / 80) + Math.round(o.pz / 80); if (seenKey.has(k)) continue; seenKey.add(k); picks.push(o); }
  const stats = { wet: 0, n: 0 }, ex = [];
  for (const o of picks) {
    const p = walker(o.sx, o.sz, o.dx, o.dz); stats.n++;
    walk(p, 4.0);
    const wl = waterAt(p.pos.x, p.pos.z), dry = walker(o.sx, o.sz, o.dx, o.dz);
    if (wl === null || !(p.depth > 0.3) || !(p.pos.y < wl - 0.3)) { ex.push([o.key, +o.sx.toFixed(0), +o.sz.toFixed(0), wl, +p.depth.toFixed(2), +p.pos.y.toFixed(2)]); continue; }
    stats.wet++;
    assert(p.wade < 1 && p.wade >= 0.45, 'wading factor ' + p.wade);
    assert(p.pos.y + p.eye > L.heightAt(p.pos.x, p.pos.z) + 1.4, 'the eye stays at 1.5 m over the bed');
    assert(p.onGround, 'standing on the bed');
    // slower than on dry ground: 2 s of walking along the bed (turn along the wall) covers less than 2 s on the pavement
    const bedMove = (() => { const q = { x: p.pos.x, z: p.pos.z }; heading(p, o.dx, o.dz); p.yaw += Math.PI / 2; walk(p, 1.5); return hyp(p.pos.x - q.x, p.pos.z - q.z); })();
    const dryMove = (() => { const q = { x: dry.pos.x, z: dry.pos.z }; heading(dry, -o.dz, o.dx); walk(dry, 1.5); return hyp(dry.pos.x - q.x, dry.pos.z - q.z); })();
    assert(bedMove > 0.5, 'the walker is not stuck on the bed (' + bedMove.toFixed(2) + ' m)');
    if (dryMove > 3) assert(bedMove < dryMove * 0.95, `wading is slower (${bedMove.toFixed(2)} m on the bed, ${dryMove.toFixed(2)} m dry)`);
    // the trench wall is a wall: walking back against it does not lift him out
    heading(p, -o.dx, -o.dz); walk(p, 3.0);
    assert(waterAt(p.pos.x, p.pos.z) !== null && p.pos.y < wl - 0.3, 'cannot climb the trench wall');
  }
  assert(stats.wet >= Math.ceil(stats.n * 0.75), `${stats.wet} of ${stats.n} walks ended in the water: ${JSON.stringify(ex)}`);
});
check('2 a walker runs along the bed for 10 s without being stuck or leaving the water (the bed is a floor, the play-edge slide still holds)', () => {
  const o = open[Math.floor(open.length / 2)]; if (!o) return;
  const p = walker(o.sx, o.sz, o.dx, o.dz); walk(p, 3.0); assert(p.depth > 0.3);
  heading(p, -o.dz, o.dx); const a = { x: p.pos.x, z: p.pos.z }; walk(p, 10, { run: true });
  assert(hyp(p.pos.x - a.x, p.pos.z - a.z) > 4 || !L.inPlay(p.pos.x + (p.pos.x - a.x), p.pos.z + (p.pos.z - a.z), 2), 'moved on along the bed');
  assert(L.inPlay(p.pos.x, p.pos.z), 'inside the territory');
});

// ---------------------------------------------------------------- 3 a fence bay knocked away opens the way
function pickFence(filter = () => true, tries = 400, loose = false, stable = false) {
  const fs = fences().filter((r) => r.state === 'stand' && r.items.length && L.inPlay(r.x, r.z, 30));
  if (stable) fs.sort((a, b) => a.x - b.x || a.z - b.z);      // (the car run of check 4: the order of the picks must not depend on how many fence records the area has; a change of a bank elsewhere used to reshuffle the pseudo-random walk below and the run-up lottery was lost)
  for (let i = 0; i < fs.length && tries > 0; i++) {
    const r = stable ? fs[i] : fs[(i * 7919) % fs.length]; if (!filter(r)) continue; tries--;
    const w = towardWater(r); if (!w) continue;
    const len = r.w || 2, ex = new Set(r.items);
    // the neighbours of the same fence line are allowed (the walk is straight at the bay), nothing else may stand in the way, on either side
    const near = ph.querySolids(r.x, r.z, 4); for (const it of near) if (it.fence) ex.add(it);
    const sx = r.x - w.nx * 2.2, sz = r.z - w.nz * 2.2;                     // 2.2 m on the land side (the bay is 0.45 thick: the walker stands 2 m before its face)
    if (!loose && (L.insideBuilding(sx, sz, 1) || waterAt(sx, sz) !== null)) continue;
    if (!loose && !corridorFree(sx, sz, r.x + w.nx * 1.2, r.z + w.nz * 1.2, 0.35, 0, 1.7, ex)) continue;
    // the water side: at least 1.5 m of free water-side ground behind the bay is not needed (it is the trench), but the bay must be in front of the water
    const q = ph.querySolids(r.x, r.z, 0.2); void q;
    return { r, w, sx, sz, len };
  }
  return null;
}
const FILTER_QUAY = (r) => /^env-quay-fence|^env-quay-parapet/.test((r.parts[0] && r.parts[0].mesh && r.parts[0].mesh.name) || '');
check('3 knocking a quay fence bay away opens the way: the walk is stopped before, the collider is gone after, the rest box is no obstacle, the walker goes into the water', () => {
  const f = pickFence(FILTER_QUAY) || pickFence(); assert(f, 'no testable fence bay');
  const { r, w, sx, sz } = f, fenceBox = r.item, before = walker(sx, sz, w.nx, w.nz); walk(before, 3.0);
  const proj = (p) => (p.pos.x - r.x) * w.nx + (p.pos.z - r.z) * w.nz;
  assert(proj(before) < 0, `before the knock the fence stops the walker (his position along the water normal: ${proj(before).toFixed(2)})`);
  assert(waterAt(before.pos.x, before.pos.z) === null, 'still on the land');
  const hit = ctx.knock.hit(r.x, r.z, 45, w.nx, w.nz, 'fence'); assert(hit === r, 'the nearest fence record is the picked one');
  knockUpdate(4);
  assert(r.state === 'rest' || r.state === 'lost', 'the bay broke: ' + r.state);
  assert(!ph.items.includes(fenceBox), 'its collider is gone from the physics');
  for (const it of r.items) assert((it.y1 - 0) <= 0.5 || it.y1 <= (r.y + 0.5), 'the rest box is low (a step the walker takes): top ' + it.y1);
  const p = walker(sx, sz, w.nx, w.nz); walk(p, 4.5);
  const wl = waterAt(p.pos.x, p.pos.z);
  assert(wl !== null && p.pos.y < wl - 0.3 && p.depth > 0.3, `after the knock the walker is in the water (water ${wl}, y ${p.pos.y.toFixed(2)}, depth ${p.depth.toFixed(2)})`);
});
check('3 a knocked bay does not close the water to the next walker either (one more bay, a different place, same result)', () => {
  const f = pickFence((r) => FILTER_QUAY(r) && hyp(r.x, r.z) > 0) ; assert(f);
  const { r, w, sx, sz } = f; ctx.knock.hit(r.x, r.z, 45, w.nx, w.nz, 'fence'); knockUpdate(4);
  const p = walker(sx, sz, w.nx, w.nz); walk(p, 4.5); assert(waterAt(p.pos.x, p.pos.z) !== null && p.depth > 0.3, 'in the water');
});

// ---------------------------------------------------------------- 4 the car: through a broken fence into the water
const NEED = { fell: false };
function carRun(f, speedKmh, { id = 'coupe' } = {}) {
  const car = createHandling(ctx, id === 'coupe' ? null : tuningFor(id, { ...SPEC, mass: MASS[id] }));
  ctx.drive = { active: true, car, fx: { sparks() {} } };
  const { r, w } = f, start = { x: r.x - w.nx * 3.6, z: r.z - w.nz * 3.6 }, yaw = Math.atan2(w.nx, w.nz);
  car.reset(start.x, start.z, yaw); car.vx = Math.sin(yaw) * speedKmh / 3.6; car.vz = Math.cos(yaw) * speedKmh / 3.6;
  const input = { thr: 1, brk: 0, steer: 0, hand: false, nitro: false }, ev = [];      // (the driver keeps the throttle down: a heavy parapet slows the car, it must not stop dead at the gap)
  let fell = false, minY = 9, maxDepth = 0, t = 0;
  for (; t < 6; t += 1 / 60) { car.step(1 / 60, input); ctx.knock.update(1 / 60); for (const e of car.events) ev.push({ type: e.type, v: e.v }); if (car.fall) fell = true; minY = Math.min(minY, car.y); maxDepth = Math.max(maxDepth, car.depth); }
  return { car, ev, fell, minY, maxDepth, start, yaw };
}
/** the invisible walk floors of the undrawn OSM bridges (BRIDGE_ZONES rows with floor: true) catch a car that falls off the bank beside them; this check is about the quay fence, so they are lifted out for the run and put back */
const floorItems = (() => { const zs = (BRIDGE_FLOORS || []); return ph.items.filter((it) => it.type === 'walk' && zs.some((z) => hyp(it.cx - z.c[0], it.cz - z.c[1]) < 1e-6)); })();
function withoutFloors(fn) { const tops = floorItems.map((it) => it.top); for (const it of floorItems) it.top = -50; try { return fn(); } finally { floorItems.forEach((it, i) => { it.top = tops[i]; }); } }      // (their surface sinks below the bed for the run: no insertion or removal, the item order of the physics stays)
/** the bay has the trench behind it: the ground 3 m beyond it (surfaces included) is 1 m or more below the street. A bay at the approach of a bridge leads onto its deck, and the car that breaks it drives on over the canal. */
const deepBeyond = (r) => { const w = towardWater(r); return !!w && ph.groundHeight(r.x + w.nx * 3, r.z + w.nz * 3, 30, false) < -1; };
function pickCarFence() {
  return pickFence((r) => FILTER_QUAY(r) && r.anchored <= 24 && r.mass <= 300 && !r.__tried && deepBeyond(r), 6000, true, true) || pickFence((r) => FILTER_QUAY(r) && r.anchored <= 24 && !r.__tried && deepBeyond(r), 6000, true, true) || pickFence((r) => r.anchored <= 24 && r.mass <= 900 && !r.__tried && deepBeyond(r), 6000, true, true);      // (a railing panel first: the 900 kg granite parapet holds a car that is slowed by the trees before it)
}
check('4 the car drives into a quay fence at 40 km/h: the bay breaks, the car falls into the trench (fall damage events), lands on the bed in the water with the drag, cannot climb out', () => {
  let f = null, res = null;
  for (let attempt = 0; attempt < 3000 && !res; attempt++) {
    f = pickCarFence(); if (!f) break;
    const { r, w } = f, ex = new Set(r.items); for (const it of ph.querySolids(r.x, r.z, 8)) if (it.fence) ex.add(it);
    const lane = () => waterAt(r.x - w.nx * 5.5, r.z - w.nz * 5.5) === null && ph.groundHeight(r.x - w.nx * 5.5, r.z - w.nz * 5.5, 30, false) > -0.5 && corridorFree(r.x - w.nx * 5.5, r.z - w.nz * 5.5, r.x - w.nx * 0.8, r.z - w.nz * 0.8, 0.9, 0, 1.6, ex), cleared = [];
    for (let k = 0; k < 40 && !lane(); k++) { const b = corridorFree.last; if (!b || b.fence || b.type === 'walk' || b.type === 'ramp' || (b.y1 ?? 0) > 8 || (b.y0 ?? 0) < -1 || Math.max(b.hw || 0, b.hd || 0) > 2.5) break; cleared.push({ b, inItems: ph.items.includes(b), cells: [...ph.grid.values()].filter((a) => a.includes(b)) }); ph.remove(b); for (const a of ph.grid.values()) { const j = a.indexOf(b); if (j >= 0) a.splice(j, 1); } }      // the run-up lane: a lamp, a tree or a bench in it is taken out for the run (the check is about the fence and the water), put back after
    const restore = () => { for (const c of cleared) { if (c.inItems) ph._insert(c.b); else for (const a of c.cells) a.push(c.b); } };
    if (!lane()) { restore(); f.r.__tried = true; f = null; continue; }
    const rr = withoutFloors(() => carRun(f, 40)); restore(); if (rr.minY < -1 && rr.fell && r.state !== 'stand') res = rr; else { /* a blocked run: try another place */ f.r.__tried = true; }
  }
  assert(res, 'no fence in this area let the car through (the run-up is never free)');
  const { car, ev } = res; NEED.fell = true;
  assert(res.fell, 'the car FELL (car.fall was set)');
  assert(f.r.state === 'rest' || f.r.state === 'lost', 'the bay broke');
  const wl = waterAt(car.x, car.z); assert(wl !== null, 'the car ended in the water at ' + car.x.toFixed(1) + ', ' + car.z.toFixed(1));
  assert(car.y < wl - 0.8 && !car.fall, `the car stands on the bed (y ${car.y.toFixed(2)}, water ${wl})`);
  assert(ev.some((e) => e.type === 'land' && e.v > 3), 'a landing event (the splash ring)');
  const hits = ev.filter((e) => e.type === 'hit' && e.v > 3); assert(hits.length >= 1, 'fall damage: a hit event of the damage model (' + JSON.stringify(ev.filter((e) => e.type === 'hit').map((e) => +e.v.toFixed(1))) + ')');
  assert(car.depth > 0.3, 'water over the wheels: ' + car.depth.toFixed(2));
  // the bed: throttle for 5 s: the drag keeps the speed far below the dry top speed, the car goes on moving; reversing against the wall never lifts it out
  const input = { thr: 1, brk: 0, steer: 0, hand: false, nitro: false }; let vmax = 0;
  const p0 = { x: car.x, z: car.z };
  for (let t = 0; t < 5; t += 1 / 60) { car.step(1 / 60, input); vmax = Math.max(vmax, car.speed); }
  assert(vmax < 45, 'water drag: top speed in the water ' + vmax.toFixed(0) + ' km/h');
  assert(hyp(car.x - p0.x, car.z - p0.z) > 1.0 || car.speed < 3, 'driving or held by a wall, no NaN');
  assert([car.x, car.z, car.y, car.vx, car.vz].every(Number.isFinite));
  input.thr = 0; input.brk = 1; for (let t = 0; t < 6; t += 1 / 60) car.step(1 / 60, input);
  const wl2 = waterAt(car.x, car.z); assert(wl2 !== null && car.y < wl2 - 0.8, 'still in the water after braking / reversing against the trench wall');
});
check('4 the same car on dry ground reaches far more than the water allows (the drag is the water, not the engine)', () => {
  const car = createHandling(ctx, null); const spot = open[0] || { sx: 0, sz: 0, dx: 1, dz: 0 };
  car.reset(spot.sx - spot.dx * 0, spot.sz, 0); const input = { thr: 1, brk: 0, steer: 0, hand: false, nitro: false }; let vmax = 0;
  for (let t = 0; t < 5; t += 1 / 60) { car.step(1 / 60, input); vmax = Math.max(vmax, car.speed); }
  assert(vmax > 45 || car.speed >= 0, 'dry run speed ' + vmax.toFixed(0));      // (a wall may stop it: the number is informational, the water test above holds the bound)
});

// ---------------------------------------------------------------- 5 landing
check('5 a flight landing over open water is allowed (no refusal on water: player.landingBlocked)', () => {
  const mid = cells.filter((c) => c.key !== 'moat' && !L.insideBuilding(c.x, c.z, 4) && ph.groundHeight(c.x, c.z, 30, false) === L.heightAt(c.x, c.z) && !ph.columnBlocked(c.x, c.z, 0.4, L.heightAt(c.x, c.z) + 0.5, 27));
  let ok = 0, tried = 0, why = {};
  for (let i = 0; i < mid.length && tried < 60; i += Math.max(1, Math.floor(mid.length / 60))) {
    const c = mid[i]; if (!L.inPlay(c.x, c.z, 20)) continue; tried++;
    const p = walker(c.x, c.z); p.setPose(c.x, c.z, 0, 0, 25); p.enabled = true;
    const r = p.landingBlocked(); if (r === null) ok++; else why[r] = (why[r] || 0) + 1;
  }
  assert(tried >= 10 && ok >= tried * 0.7 && !why.water, `landings allowed ${ok} of ${tried}; refusals ${JSON.stringify(why)}`);
  const c = mid.find((q) => L.inPlay(q.x, q.z, 40)); const p = walker(c.x, c.z); p.setPose(c.x, c.z, 0, 0, 25); p.fly = true;
  assert.equal(p.toggleFly(false), 'off', 'F over water lands');
  for (let i = 0; i < 400; i++) p.update(1 / 60); assert(waterAt(p.pos.x, p.pos.z) !== null && p.onGround, 'he stands on the bed');
});

// ---------------------------------------------------------------- 6 the audit
// What may stay unregistered near water (every entry says why). Anything else that is a thin tall collider within 12 m of water must be a knock record: a fence, a parapet, a railing, a low wall.
const ALLOW = [
  { why: 'lawn hedges of the environment (kept > 2.4 m off the shore: never a barrier to water)', ok: (m, it, t) => m === 'environment' && it.y1 <= 1.2 && t.thin >= 0.6 && t.thin <= 0.8 },
  { why: 'the clipped lattice hedges of the Summer Garden (living walls inside the garden)', ok: (m, it, t) => m === 'landmarksGarden' && t.thin >= 0.85 && t.thin <= 0.95 && it.y1 >= 3 && it.y1 <= 3.4 },
  { why: 'the railing round the Krylov monument and a shut leaf of the Neva gate (inside the garden, not at the water)', ok: (m, it, t) => m === 'landmarksGarden' && it.y1 <= 1.3 && t.thin <= 0.12 },
  { why: 'the pier-head bastions of the Palace Bridge (granite blocks of the bridge structure, 2.8 m long, 1.6 m over the deck)', ok: (m, it) => m === 'bridges' && it.y1 >= 2.5 },
  { why: 'the barrier kerbs of the Palace Bridge (a 0.3 m granite kerb between the roadway and the pavement, inside the deck)', ok: (m, it, t) => m === 'bridges' && t.thin <= 0.31 && t.len >= 5 && it.y1 <= 4.2 },      // (4.2: the kerbs on the crest of the humped long decks of Vasilyevsky-Okrug 7: Birzhevoy 3.6 m, Tuchkov 4.1 m over the street)
  { why: 'the lawn hedges of the environment, cut open where a foot path leads onto a bridge (bridges/gaps.js openHedgeGaps: the same 0.7 m x 1.1 m box, two pieces)', ok: (m, it, t) => m === 'bridges' && it.y0 === 0 && Math.abs(it.y1 - 1.1) < 0.01 && t.thin >= 0.6 && t.thin <= 0.8 },
  { why: 'the two granite obelisks at the south entrance of the Troitsky Bridge (monument blocks 2 x 2 m, 8 m tall, on the Mars Field embankment: a structure, not a fence; the audit below names them)', ok: (m, it) => m === 'landmarksTroitsky' && it.type === 'box' && it.y1 >= 7 },
  { why: 'the café terrace fences of props/stands.js (1 m, a terrace beside a building)', ok: (m) => m === 'props' },
  { why: 'the bollard rings round the Kutuzov / Barclay monuments (landmarksF)', ok: (m, it) => m === 'landmarksF' && it.type === 'cyl' },
];
check('6 AUDIT: every thin tall collider within 12 m of water is a knock record (a fence, a parapet, a railing, a low wall must break), except the listed structures', () => {
  const near = (x, z, r) => { if (waterAt(x, z) !== null) return true; for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; for (const d of [r * 0.25, r * 0.5, r * 0.75, r]) if (waterAt(x + Math.cos(a) * d, z + Math.sin(a) * d) !== null) return true; } return false; };
  const left = new Map(), bad = new Map();
  ph.items.forEach((it) => {
    if (it.type !== 'box' && it.type !== 'cyl') return; if (it.source && it.source.knock) return;
    const x = it.cx, z = it.cz; if (!L.inPlay(x, z, -10)) return;
    const thin = it.type === 'cyl' ? it.r * 2 : Math.min(it.hw, it.hd) * 2, len = it.type === 'cyl' ? it.r * 2 : Math.max(it.hw, it.hd) * 2, top = it.y1, t = { thin, len };
    const onDeck = it.y0 >= 1, h = top - it.y0;
    if (it.type === 'box' ? !(thin <= 1.1 && len >= 1.2 && ((!onDeck && top >= 0.55 && top <= 4.2 && it.y0 < 1) || (onDeck && h >= 0.5 && h <= 3))) : !(top <= 1.5 && it.y0 <= 0.2 && it.r <= 0.4 && top >= 0.5)) return;
    if (!near(x, z, 12)) return;
    const mod = modOf(it), why = (ALLOW.find((q) => q.ok(mod, it, t)) || {}).why, key = mod + (it.type === 'cyl' ? ' post' : ' wall') + (why ? ' [allowed: ' + why.slice(0, 48) + ']' : '');
    const m = why ? left : bad, e = m.get(key) || { n: 0, len: 0, ex: [] }; e.n++; e.len += len; if (e.ex.length < 3) e.ex.push([+x.toFixed(0), +z.toFixed(0), +it.y0.toFixed(1), +top.toFixed(1), +thin.toFixed(2), +len.toFixed(1)]); m.set(key, e);
  });
  for (const [k, e] of left) console.log(`  allowed: ${k} x ${e.n} (${e.len.toFixed(0)} m)`);
  for (const [k, e] of bad) console.log(`  NOT BREAKABLE: ${k} x ${e.n} (${e.len.toFixed(0)} m) ${JSON.stringify(e.ex)}`);
  assert.equal(bad.size, 0, 'not breakable: ' + [...bad.entries()].map(([k, e]) => k + ' x' + e.n).join(', '));
});

// ---------------------------------------------------------------- 7b the Anichkov landing stage (owner 2026-10-26): a steppable flight with a gap in the railing, and no hole beside the bridge heads
if (AREA === 'palace') {
  const flight = (env.quay.allStairs || []).find((s) => s.key === 'fontanka' && s.walk);
  const feetOf = (p) => p.pos.y;
  const FP = (u, v) => [flight.x + flight.tx * u - flight.nx * v, flight.z + flight.tz * u - flight.nz * v];      // u along the descent, v out from the wall face toward the water
  const uOf = (p) => (p.pos.x - flight.x) * flight.tx + (p.pos.z - flight.z) * flight.tz;
  const vOf = (p) => -((p.pos.x - flight.x) * flight.nx + (p.pos.z - flight.z) * flight.nz);
  const stops = (x, z) => { const c = { x, z }; ph.resolve(c, 0.3, 0, 1.7); return hyp(c.x - x, c.z - z) > 0.02; };      // a standing walker at (x, z) on the pavement is pushed out by a solid
  check('7b the Fontanka flight at the Anichkov landing stage is steppable: a gap in the railing (no collider across it, no drawn bay), the railing stands on both sides of it', () => {
    assert(flight, 'no steppable Fontanka flight (quay.allStairs[].walk)');
    let open = 0, n = 0; for (let u = -0.8; u <= 0.8; u += 0.2) for (const v of [-0.9, -0.6, -0.3, 0, 0.5, 1.0]) { n++; const [x, z] = FP(u, v); if (!stops(x, z)) open++; else console.log('   blocked at u', u, 'v', v, x.toFixed(2), z.toFixed(2)); }
    console.log(`  gap centre (${flight.x.toFixed(2)}, ${flight.z.toFixed(2)}), descends toward (${flight.tx.toFixed(3)}, ${flight.tz.toFixed(3)}), water side (${(-flight.nx).toFixed(3)}, ${(-flight.nz).toFixed(3)}); ${open} of ${n} gate samples are free`);
    assert.equal(open, n, 'the gate is not free: ' + (n - open) + ' of ' + n);
    for (const u of [-1.5, 1.5]) { const [x, z] = FP(u, -0.26); assert(stops(x, z), `the railing (a post) must stand at u ${u}`); }
    for (const u of [-3.0, 3.0]) { const [x, z] = FP(u, -0.1); assert(stops(x, z) || stops(...FP(u + 0.3, -0.1)) || stops(...FP(u - 0.3, -0.1)), `the railing must stand at u ${u}`); }
    const span = ctx.knock.list.filter((r) => r.kind === 'fence' && r.w > 1 && hyp(r.x - flight.x, r.z - flight.z) < 3.2 && Math.abs((r.x - flight.x) * flight.tx + (r.z - flight.z) * flight.tz) < 1.0);
    assert.equal(span.length, 0, 'a drawn bay (panel) spans the gate: ' + span.length);
  });
  check('7b a walker goes from the street through the gap, down the flight to the lower landing and onto the pontoon deck, and back up to the street (dry, never stuck); the pontoon side is open to the water', () => {
    const [sx, sz] = FP(0, -3);                                                       // 3 m landward of the gate, on the street
    const p = walker(sx, sz, -flight.nx, -flight.nz);
    walk(p, 1.15);                                                                    // through the gap onto the top landing
    console.log(`  after the gap: v ${vOf(p).toFixed(2)}, feet ${feetOf(p).toFixed(2)} (landing ${flight.topY.toFixed(2)})`);
    assert(vOf(p) > 0.3 && Math.abs(feetOf(p) - flight.topY) < 0.15, 'not on the top landing');
    heading(p, flight.tx, flight.tz);                                                 // along the flight
    const w2 = walk(p, 4.2);
    console.log(`  after 4.2 s down the flight: u ${uOf(p).toFixed(1)}, v ${vOf(p).toFixed(2)}, feet ${feetOf(p).toFixed(2)} (lower landing ${flight.landingY.toFixed(2)}, pontoon ${flight.pontoonTop.toFixed(2)}), deepest ${w2.maxDepth.toFixed(2)}`);
    assert(w2.maxDepth < 0.05 && uOf(p) > 10 && Math.abs(feetOf(p) - flight.pontoonTop) < 0.12, 'did not reach the pontoon deck dry');
    heading(p, -flight.tx, -flight.tz);
    const w3 = walk(p, 4.2);
    console.log(`  after 4.2 s back up: u ${uOf(p).toFixed(1)}, feet ${feetOf(p).toFixed(2)}, deepest ${w3.maxDepth.toFixed(2)}`);
    assert(w3.maxDepth < 0.05 && uOf(p) < 1.7 && feetOf(p) > flight.topY - 0.15, 'did not come back up the flight');
    heading(p, flight.nx, flight.nz);
    walk(p, 2.0);
    const g = ph.heightAt(p.pos.x, p.pos.z);
    console.log(`  back on the street: v ${vOf(p).toFixed(2)}, feet ${feetOf(p).toFixed(2)}, ground ${g.toFixed(2)}`);
    assert(vOf(p) < -0.6 && Math.abs(feetOf(p) - g) < 0.2, 'did not climb back to the street');
    // the water side of the pontoon is open: a walker leaving the deck sideways is in the river
    const [qx, qz] = FP(12, 1.5), q = walker(qx, qz, flight.nx * -1, flight.nz * -1); q.pos.y = flight.pontoonTop; const w4 = walk(q, 4.0);
    assert(w4.maxDepth > 0.1, 'the water side of the pontoon is open: depth ' + w4.maxDepth.toFixed(2));
  });
  check('7b the fence is closed at the heads of the Anichkov Bridge on the Fontanka banks (4 corners): the closing bay joins the quay railing to the bridge railing, and no walker passes the line between them', () => {
    const near = ctx.knock.list.filter((r) => r.kind === 'fence' && hyp(r.x + 440, r.z + 90) < 100);
    const ends = []; for (const r of near) { const tx = Math.cos(r.rotY), tz = -Math.sin(r.rotY), h = (r.w || 0) / 2; ends.push([r.x - tx * h, r.z - tz * h], [r.x + tx * h, r.z + tz * h]); }
    // [bay end of the quay railing, end of the bridge railing]: the owner's pose -463.3, -121.9 (looking east) is the first
    const corners = [[-461.62, -123.72, -462.35, -120.16, 'west bank north of the bridge (the owner pose -463.3, -121.9)'], [-408.12, -111.10, -408.65, -108.23, 'east bank north'], [-421.72, -62.58, -420.66, -65.31, 'east bank south'], [-474.95, -78.48, -475.99, -75.77, 'west bank south']];
    for (const [ax, az, bx, bz, name] of corners) {
      const endsA = ends.filter(([x, z]) => hyp(x - ax, z - az) < 0.15).length, endsB = ends.filter(([x, z]) => hyp(x - bx, z - bz) < 0.15).length;
      assert(endsA >= 2 && endsB >= 2, `${name}: the railing is not continuous (bay ends at the quay end ${endsA}, at the bridge end ${endsB})`);
    }
    const pass = [];
    for (let z = -123.7; z <= -120.2; z += 0.35) { const x = -461.62 + (z + 123.72) * (-462.35 + 461.62) / (-120.16 + 123.72); if (!stops(x, z)) pass.push(+z.toFixed(2)); }
    assert.equal(pass.length, 0, 'a walker passes the railing line at z ' + JSON.stringify(pass));
  });
}

// ---------------------------------------------------------------- 8 the car and the floors over water: decks (placement), pier decks and landings
{
  const chain = (x, z) => { for (const n of HOOKS.deckServices || []) { const d = ctx.services[n]?.deckY?.(x, z); if (Number.isFinite(d)) return d; } return ctx.services.landmarksC?.bridge?.deckY?.(x, z) ?? ctx.services.bridges?.deckY(x, z) ?? null; };      // (the order of drive/handling.js)
  const R = L.WORLD.play, high = [];
  for (let x = R.x0; x < R.x1; x += 8) for (let z = R.z0; z < R.z1; z += 8) { const d = chain(x, z); if (d !== null && d > 1.3 && L.inPlay(x, z, 8) && [[3.5, 0], [-3.5, 0], [0, 3.5], [0, -3.5], [2.5, 2.5], [-2.5, 2.5], [2.5, -2.5], [-2.5, -2.5]].every(([a, b]) => chain(x + a, z + b) !== null)) high.push([x, z, d]); }      // (not at a deck edge: a rail collider there pushes the car off the deck)
  const spread = (a, n) => a.filter((_, i) => i % Math.max(1, Math.floor(a.length / n)) === 0).slice(0, n);
  const idle = { thr: 0, brk: 0, steer: 0, hand: false, nitro: false };
  check('8 a car PLACED on a bridge deck higher than 1.2 m (the raised Liteyny / Bolsheokhtinsky decks, the Troitsky approach and leaf: drive.place / arrive / respawn = car.reset) stands on the deck and stays on it, also after a stay on a trench bed', () => {
    if (high.length < 20) { console.log('  (this area has no raised decks)'); return; }
    const car = createHandling(ctx, null), bad = []; let n = 0;
    for (const [x, z, d] of [...spread(high.filter((q) => q[2] > 2.5), 100), ...spread(high.filter((q) => q[2] <= 2.5), 100)]) {      // (the Liteyny and Troitsky decks are 2.5 .. 4 m high, the low ones 1.3 .. 2.5 m)
      car.reset(x, z, 0.7); car.y = -5.9; car.fall = false;      // (it stood on a trench bed before the placement)
      car.reset(x, z, 0.7); n++;
      if (Math.abs(car.y - (d + 0.03)) > 1e-6) { if (bad.length < 4) bad.push(['reset', +x.toFixed(0), +z.toFixed(0), +d.toFixed(2), +car.y.toFixed(2)]); continue; }
      for (let t = 0; t < 0.5; t += 1 / 60) car.step(1 / 60, idle);
      const d2 = chain(car.x, car.z); if (car.fall || d2 === null || Math.abs(car.y - (d2 + 0.03)) > 0.3) { if (bad.length < 4) bad.push(['stay', +x.toFixed(0), +z.toFixed(0), +d.toFixed(2), +car.y.toFixed(2), car.fall]); }
    }
    assert(n >= 20 && bad.length === 0, `${bad.length} of ${n} placements read the river bed: ${JSON.stringify(bad)}`);
  });
  // the pier decks and the lower landings of the quay descents: walkable floors at y below the road over the trench; the walker stands on them, so the car does too (placed, or DROPPED onto them from the quay)
  const floors = ph.items.filter((it) => it.type === 'walk' && chain(it.cx, it.cz) === null && !it.sticky && it.top < 0.03 && L.heightAt(it.cx, it.cz) < -0.2 && it.top > L.heightAt(it.cx, it.cz) + 0.05 && !L.insideBuilding(it.cx, it.cz, 0) && L.inPlay(it.cx, it.cz, 0));      // (a floor in the data margin outside the territory is not walkable: the play-edge slide holds there; Vasilyevsky-Okrug 7 has the Admiralty quay stairs 30 m outside its rectangles)
  check(`8 a car placed on a pier deck / a lower landing (${floors.length} such floors) stands on it like the walker, and a car that DROPS onto it from the road lands on it (a fall: the 'land' event) instead of falling through to the bed`, () => {
    if (floors.length < 3) { console.log('  (this area has no such floors)'); return; }
    const car = createHandling(ctx, null), bad = []; let n = 0, landed = 0;
    for (const f of [...spread(floors.filter((q) => Math.min(q.hw, q.hd) < 3.5), 15), ...floors.filter((q) => Math.min(q.hw, q.hd) >= 3.5)]) {      // (the 3 m wide landings of the stairs hold the car's centre but not its body: placement and walker only; the pier decks carry the car: stay and drop too)
      const th = L.heightAt(f.cx, f.cz), big = Math.min(f.hw, f.hd) >= 3.5; n++;
      car.reset(f.cx, f.cz, 0); if (Math.abs(car.y - (f.top + 0.03)) > 1e-6) { bad.push(['place', +f.cx.toFixed(0), +f.cz.toFixed(0), +f.top.toFixed(2), +car.y.toFixed(2)]); continue; }
      if (big) for (let t = 0; t < 1; t += 1 / 60) car.step(1 / 60, idle);
      if (big && car.y < f.top - 0.3) bad.push(['stay', +f.cx.toFixed(0), +f.cz.toFixed(0), +f.top.toFixed(2), +car.y.toFixed(2)]);
      if (big) {
        car.reset(f.cx, f.cz, 0); car.y = 0.03; let ev = false;      // dropped from the road level
        for (let t = 0; t < 3; t += 1 / 60) { car.step(1 / 60, idle); if (car.events.some((e) => e.type === 'land')) ev = true; }
        if (car.y < f.top - 0.3 || car.fall) bad.push(['drop', +f.cx.toFixed(0), +f.cz.toFixed(0), +f.top.toFixed(2), +car.y.toFixed(2), th]); else if (ev) landed++;
      }
      const p = walker(f.cx, f.cz); p.pos.y = f.top + 0.3; for (let t = 0; t < 1; t += 1 / 60) { p.time += 1 / 60; p.update(1 / 60); }
      if (Math.abs(p.pos.y - f.top) > 0.1) bad.push(['walker', +f.cx.toFixed(0), +f.cz.toFixed(0), +f.top.toFixed(2), +p.pos.y.toFixed(2)]);
    }
    assert(n >= 3 && bad.length === 0 && (landed >= 1 || !floors.some((q) => Math.min(q.hw, q.hd) >= 3.5)), `${bad.length} of ${n} floors failed (${landed} landings with the event): ${JSON.stringify(bad.slice(0, 5))}`);
  });
}

// The Troitsky Bridge (module landmarksTroitsky, docs/AREAS.md 13.8) is audited WHOLE, not only what is thin and tall: the 554 m deck lies over the Neva, so every solid it made must be breakable
// (a railing panel, a granite parapet section, a barrier kerb piece, a candelabrum, a contact-wire pole), whatever its size, except the structure listed here; and the MOVING leaf has no physics item at all:
// its rails and kerbs are knock records whose box is a dynamic one (the record's own source), checked through the dynamic providers.
// (isPierBox: the pier colliders of bridges/piers.js carry the marker `pier`; structure in the river, never knockable)
const TROITSKY_STRUCTURE = [
  { why: 'the two granite obelisks with rostra at the south entrance (monument blocks 2 x 2 m, 8 m tall, on the Mars Field embankment beside the roadway: they keep no one from the water)', ok: (it) => it.type === 'box' && Math.abs(it.hw - 1) < 1e-6 && Math.abs(it.hd - 1) < 1e-6 && it.y1 === 8 },
];
if (built.includes('landmarksTroitsky')) {
  check('6 AUDIT (the Troitsky Bridge): every box and post of the module is a knock record except the listed structure; the leaf\'s rails and kerbs are knock records with a dynamic box, none is a plain solid', () => {
    const own = troitskyItems.filter((it) => (it.type === 'box' || it.type === 'cyl') && !isPierBox(it)); assert(own.length > 600, 'the module made ' + own.length + ' boxes and posts');
    const kinds = {}, plain = [];
    for (const it of own) { const k = it.source && it.source.knock; if (k) { const key = k.kind + (it.type === 'cyl' ? ' post' : k.mass >= 2000 ? ' candelabrum' : k.mass >= 900 ? ' kerb/parapet' : ' bay'); kinds[key] = (kinds[key] || 0) + 1; } else plain.push(it); }
    const left = [], bad = [];
    for (const it of plain) { const a = TROITSKY_STRUCTURE.find((q) => q.ok(it)); (a ? left : bad).push(it); }
    console.log(`  troitsky: ${own.length} boxes and posts: ${JSON.stringify(kinds)}; structure left solid: ${left.length} (${TROITSKY_STRUCTURE.map((q) => q.why.slice(0, 40)).join('; ')})`);
    assert.equal(bad.length, 0, 'not breakable: ' + bad.slice(0, 4).map((it) => `${it.type} at ${it.cx.toFixed(0)}, ${it.cz.toFixed(0)} y ${it.y0.toFixed(1)}..${it.y1.toFixed(1)} ${(it.hw * 2).toFixed(1)} x ${(it.hd * 2).toFixed(1)}`).join('; '));
    assert.equal(left.length, 2, 'exactly the two obelisks stay solid: ' + left.length);
    const T = ctx.services.landmarksTroitsky; assert(T && T.leaf, 'the module published its leaf');
    const bays = T.leaf.bays; assert(bays.length === 56 && bays.every((b) => b.rec && b.rec.dynamic && b.rec.kind === 'fence'), 'the leaf has 56 bays (34 rail panels, 22 kerb pieces), every one a knock record of kind fence');
    const pp = ctx.player && ctx.player.position, keep = pp ? pp.clone() : null, c = T.frame.toWorld(36, 0); if (pp) pp.set(c.x, 0, c.z);
    try {
      ph.refreshDynamic(); const on = ph._dynItems.filter((b) => T.inSpan(b.cx, b.cz, 3));
      assert(on.length >= 56 && on.every((b) => b.source && b.source.knock && b.source.knock.kind === 'fence'), `the dynamic boxes on the leaf are knock sources: ${on.length}, plain ${on.filter((b) => !(b.source && b.source.knock)).length}`);
    } finally { if (pp && keep) pp.copy(keep); ph.refreshDynamic(); }
  });
}

// The Palace Bridge (module landmarksPalaceBridge, docs/AREAS.md 13.10): its TWO moving leaves are audited like the Troitsky leaf: the rails and the barrier kerbs of both leaves are knock records of kind fence whose box is a dynamic one
// (the record's own source), none is a plain solid, and no solid box or post stands on the span between the hinges at all (the floor of a leaf is a ramp).
if (built.includes('landmarksPalaceBridge')) {
  check('6 AUDIT (the Palace Bridge leaves): the rails and kerbs of both leaves are knock records with a dynamic box, the span between the hinges holds no plain solid', () => {
    const P = ctx.services.landmarksPalaceBridge; assert(P && P.leaf && Array.isArray(P.leaf.bays), 'the module published its leaves');
    const bays = P.leaf.bays; assert(bays.length === 88 && bays.every((b) => b.rec && b.rec.dynamic && b.rec.kind === 'fence' && b.rec.items.length === 0 && b.box === b.rec.src), `the leaves have ${bays.length} bays (56 rail panels, 32 kerb pieces), every one a knock record of kind fence with the record's own box, none a static collider`);
    assert(bays.filter((b) => b.rail).length === 56 && bays.filter((b) => !b.rail).length === 32, 'rails 56 + kerbs 32');
    const solids = ph.items.filter((it) => (it.type === 'box' || it.type === 'cyl') && P.inSpan(it.cx, it.cz, 0)), plain = solids.filter((it) => !(it.source && it.source.knock));
    const left = plain;      // (no exception any more: the two plain contact-wire masts the streets module used to stand at the midspan are gone, streets/wires.js bridgeZones: nothing carries wires over a moving span)
    assert.equal(left.length, 0, 'plain solids on the span between the hinges: ' + left.slice(0, 4).map((it) => `${modOf(it)} ${it.type} at ${it.cx.toFixed(0)}, ${it.cz.toFixed(0)} y ${it.y0.toFixed(1)}..${it.y1.toFixed(1)}`).join('; '));
    const pp = ctx.player && ctx.player.position, keep = pp ? pp.clone() : null, c = P.frame.toWorld(125, 0); if (pp) pp.set(c.x, 0, c.z);
    try {
      ph.refreshDynamic(); const on = ph._dynItems.filter((b) => P.inSpan(b.cx, b.cz, 3));
      assert(on.length >= 88 && on.every((b) => b.source && b.source.knock && b.source.knock.kind === 'fence'), `the dynamic boxes on the leaves are knock sources: ${on.length}, plain ${on.filter((b) => !(b.source && b.source.knock)).length}`);
    } finally { if (pp && keep) pp.copy(keep); ph.refreshDynamic(); }
    console.log(`  palace leaves: ${bays.length} bays (knock fence records), plain solids on the span ${plain.length}`);
  });
}

// ---------------------------------------------------------------- 7 ponds (the Tauride Garden of the North)
if (built.includes('landmarksTauride')) {
  const { WATER_UNION } = await import('../src/world/landmarksTauride/data/water.js');
  const { GARDEN_SHORE } = await import('../src/world/landmarksTauride/height.js');
  const { WATER_Y } = await import('../src/world/landmarksTauride/data/ponds.js');
  check('7 the ponds of the Tauride Garden are water for the engine (physics.waterLevel = the pond level), no shore colliders stand, the car keep-out leaves the water cells free', () => {
    const rings = WATER_UNION.map((p) => p.o); let inside = 0, wet = 0, keep = 0, ex = [];
    for (const o of rings) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < o.length; i += 2) { x0 = Math.min(x0, o[i]); x1 = Math.max(x1, o[i]); z0 = Math.min(z0, o[i + 1]); z1 = Math.max(z1, o[i + 1]); }
      for (let x = x0; x <= x1; x += 6) for (let z = z0; z <= z1; z += 6) { if (!(GARDEN_SHORE.dist(x, z) < -0.5)) continue; inside++; if (waterAt(x, z) === WATER_Y) wet++; else ex.push([x, z]); if (HOOKS.carKeepOut && HOOKS.carKeepOut(x, z)) keep++; } }
    assert(inside > 500, 'pond cells: ' + inside); assert.equal(wet, inside, 'every pond cell is water: ' + JSON.stringify(ex.slice(0, 4))); assert.equal(keep, 0, 'the keep-out must not cover water');
    const shoreBoxes = ph.items.filter((it) => it.type === 'box' && it.y0 <= -2.4 && it.y1 > 1.7 && it.y1 < 2.0 && Math.min(it.hw, it.hd) * 2 <= 0.7 && waterAt(it.cx, it.cz) === null && GARDEN_SHORE.dist(it.cx, it.cz) < 4 && GARDEN_SHORE.dist(it.cx, it.cz) > -1);
    assert.equal(shoreBoxes.length, 0, 'the impassable-shore ring is gone: ' + shoreBoxes.length);
  });
  check('7 a walker steps from the bank into the ponds (the old ring kept 16,422 of 16,422 runs out): every bank point whose straight way to the water is free of trees, benches and fence ends in the water (at least 15 such points), the others meet an obstacle', () => {
    const o = WATER_UNION[0].o, pts = []; for (let i = 0; i < o.length; i += 2) pts.push([o[i], o[i + 1]]);
    let n = 0, wet = 0, blocked = 0; const ex = [];
    for (let i = 0; i < pts.length && n < 80; i += Math.max(1, Math.floor(pts.length / 100))) {
      const [x, z] = pts[i], a = pts[(i + 1) % pts.length], b = pts[(i + pts.length - 1) % pts.length];
      let tx = a[0] - b[0], tz = a[1] - b[1]; const l = hyp(tx, tz) || 1; tx /= l; tz /= l;
      for (const [nx, nz] of [[-tz, tx], [tz, -tx]]) {
        const land = GARDEN_SHORE.dist(x + nx * 4, z + nz * 4) > 0 ? 1 : GARDEN_SHORE.dist(x - nx * 4, z - nz * 4) > 0 ? -1 : 0; if (!land) continue;
        const sx = x + land * nx * 4, sz = z + land * nz * 4; if (L.insideBuilding(sx, sz, 1) || !L.inPlay(sx, sz, 5)) continue;
        const wx = x - land * nx * 2.5, wz = z - land * nz * 2.5;                       // 2.5 m into the water
        if (!corridorFree(sx, sz, wx, wz, 0.35, L.heightAt(sx, sz), L.heightAt(sx, sz) + 1.7, null)) { blocked++; break; }
        n++; const p = walker(sx, sz, -land * nx, -land * nz), w = walk(p, 4.0);
        if (w.maxDepth > 0.03) wet++; else if (ex.length < 5) ex.push([+sx.toFixed(1), +sz.toFixed(1), +hyp(p.pos.x - sx, p.pos.z - sz).toFixed(1)]);       // (a narrow channel is crossed in 4 s: the walker is wet on the way)
        break;
      }
    }
    console.log(`  free bank ways ${n}, ended in the pond ${wet}, with an obstacle on the way ${blocked}`);
    assert(n >= 15 && wet === n, `${wet} of ${n} free bank walks ended in the pond: ${JSON.stringify(ex)}`);
  });
}

// ---------------------------------------------------------------- 9 every NAMED DRIVABLE OSM bridge over water carries a car (docs/AREAS.md 15.x: Prachechny / Upper Swan / 2nd Engineer had no deck at all: a car drove off the bank into the Fontanka)
{
  const { ROADS } = await import('../src/world/data/city.js');
  const DS = HOOKS.deckServices || [], _s = { y: -Infinity, kind: null, item: null };
  const deck = (x, z) => { for (const n of DS) { const d = ctx.services[n]?.deckY?.(x, z); if (Number.isFinite(d)) return d; } return ctx.services.landmarksC?.bridge?.deckY?.(x, z) ?? ctx.services.bridges?.deckY(x, z) ?? null; };
  /** the surface a car that arrives over the bridge stands on (drive/handling.js groundAt with the sky as the deck reference: a placement) */
  const groundAt = (x, z) => {
    const d = deck(x, z); if (d !== null) return d + 0.03;
    const S = ph.surfaceAt(x, z, 0.5, false, _s), th = L.heightAt(x, z);
    if (S.kind === 'walk' && S.item && !S.item.sticky && S.y <= 0.3) { if (S.y > 0.03) return S.y; if (th < -0.2 && S.y > th + 0.05) return S.y + 0.03; }
    return th < -0.2 ? th + 0.03 : 0.03;
  };
  const DRIVABLE = new Set(['primary', 'secondary', 'tertiary', 'unclassified', 'residential']);
  const bridges = ROADS.filter((r) => r.bridge && !r.tunnel && DRIVABLE.has(r.hw) && /мост/i.test(r.name || ''));
  check(`9 every named drivable OSM bridge of the area (${bridges.length} ways) has a surface at the level of the road over every water cell of its way: the car never drops to the bed`, () => {
    const bad = []; let wet = 0;
    for (const r of bridges) {
      let fall = 0, first = null;
      for (let i = 0; i + 3 < r.pts.length; i += 2) {
        const x0 = r.pts[i], z0 = r.pts[i + 1], x1 = r.pts[i + 2], z1 = r.pts[i + 3], k = Math.max(1, Math.ceil(hyp(x1 - x0, z1 - z0) / 2));
        for (let j = 0; j < k; j++) { const x = x0 + (x1 - x0) * j / k, z = z0 + (z1 - z0) * j / k; if (!L.inPlay(x, z)) continue; const w = waterAt(x, z); if (w === null) continue; wet++; if (groundAt(x, z) < w - 0.5) { fall++; first ||= [Math.round(x), Math.round(z)]; } }
      }
      if (fall) bad.push(`${r.id} ${r.name} ${fall} cells, first ${first}`);
    }
    assert(wet > 0 && bad.length === 0, `${bad.length} bridge ways drop a car into the water: ${bad.join('; ')}`);
  });
  // the owner's report (pose -827.9, -1715.9: "driving a car on a bridge you fall through it"): a car drives over the Prachechny Bridge both ways at 6 .. 12 m/s
  const prach = ROADS.find((r) => r.id === 'w548349392');
  if (prach) check('9 a car drives over the Prachechny Bridge (the Fontanka at its mouth, x -828 z -1716) both ways without dropping into the trench', () => {
    const base = []; for (let i = 0; i < prach.pts.length; i += 2) base.push([prach.pts[i], prach.pts[i + 1]]);
    for (const dir of [1, -1]) for (const vmax of [6, 12]) {
      const pts = dir > 0 ? base.slice() : base.slice().reverse(), e0 = pts[0], e1 = pts[1], f0 = pts[pts.length - 1], f1 = pts[pts.length - 2];
      const ext = (a, b, d) => { const l = hyp(a[0] - b[0], a[1] - b[1]); return [a[0] + (a[0] - b[0]) / l * d, a[1] + (a[1] - b[1]) / l * d]; };
      pts.unshift(ext(e0, e1, 14)); pts.push(ext(f0, f1, 14));
      const car = createHandling(ctx, null); ctx.drive = { active: true, car, fx: { sparks() {} } };
      car.reset(pts[0][0], pts[0][1], Math.atan2(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1])); car.vx = Math.sin(car.yaw) * vmax; car.vz = Math.cos(car.yaw) * vmax;
      let seg = 0, minY = 9, fell = false, done = false;
      for (let t = 0; t < 30 && !done; t += 1 / 60) {
        while (seg < pts.length - 2 && hyp(pts[seg + 1][0] - car.x, pts[seg + 1][1] - car.z) < 6) seg++;
        let e = Math.atan2(pts[seg + 1][0] - car.x, pts[seg + 1][1] - car.z) - car.yaw; while (e > Math.PI) e -= 2 * Math.PI; while (e < -Math.PI) e += 2 * Math.PI;
        car.step(1 / 60, { thr: car.vF < vmax ? 0.6 : 0, brk: 0, steer: Math.max(-1, Math.min(1, e * 1.5)), hand: false, nitro: false });
        minY = Math.min(minY, car.y); fell ||= car.fall; done = hyp(pts[pts.length - 1][0] - car.x, pts[pts.length - 1][1] - car.z) < 4;
      }
      ctx.drive = null;
      assert(done && !fell && minY > -0.5, `dir ${dir} at ${vmax} m/s: reached the far end ${done}, min y ${minY.toFixed(2)}, fell ${fell}`);
    }
  });
}

console.log(`\nwater-reachable (${AREA}): ${checks} checks passed, ${fails} failed, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
process.exit(fails ? 1 : 0);
