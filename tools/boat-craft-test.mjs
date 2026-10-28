// tools/boat-craft-test.mjs - the other WATER CRAFT are solids (docs/water-transport-boat-collisions.md), CPU only, no GPU, no bake:
//   node tools/area.mjs palace tools/boat-craft-test.mjs [--quick]      (smolny: no dock, no boat, no craft in the territory)
// The owner (2026-10-28): "the boats and all water transport should be collidable like the cars. now our boat is going through the other water stuff". The tourist boats of environment/boats.js and
// landmarksC/boats.js, their pontoons and the landing slabs of the quay stairs were decoration: the player's motor boat drove through them. Now every tourist boat is a kinematic hull box in the dynamic
// mechanism of core/physics.js (lib/craft-solids.js, source.vx / vz / spin / invMassRatio 0: the traffic protocol) and every floating deck is a float block, and the real drive/collision.js code does the rest.
// The scenarios use the poses of the modules' own services (wildlife/boats.js collectBoats: at(t), hull sizes) and the stair frame of environment/quay.js, NOT the new registry, so that the same run is a
// regression test of the old code (it drove through all of them: no hit, a deep overlap). Sections:
//   1  the registry: every craft of the page is a box in the territory, moored boxes still, moving boxes with a velocity, the pontoons are float blocks, a float block never stops a walker standing on its deck
//   2  (a) a moored tourist boat, (b) a moving one crossing the path (the clock advances), (c) the Fontanka boat, (d) the steppable pontoon and the landing of the Anichkov stair, (e) a hull sweeping into a
//      resting boat: a 'hit' / 'scrape', never inside (the hull OBB overlaps the craft's by <= 0.06 m at any step), the boat bounces off, the craft is not moved by it, no teleport, the centre stays on water
//   3  the dock: the boat leaves its dock and comes back with the craft running (no hit, no catch on the landing / pontoon); the walker and a car on the bed are stopped by a hull, a walker on a deck is not
//   4  other areas: no boat, no craft in the territory
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

const QUICK = process.argv.includes('--quick');
const AREA = process.env.AREA || 'palace';
let checks = 0, fails = 0;
const check = (name, fn) => { try { fn(); checks++; console.log('PASS', name); } catch (e) { fails++; console.log('FAIL', name, '\n    ', String(e.message).split('\n').slice(0, 6).join('\n     ')); if (process.env.DEBUG) console.log(e.stack); } };
const t0 = Date.now();
const { ctx, L, THREE, built, errors } = await buildWorld({ log: null });
console.log(`area ${AREA}: built ${built.length} modules in ${((Date.now() - t0) / 1000).toFixed(0)} s; ${ctx.physics.items.length} colliders`);
const ph = ctx.physics;
const { collectBoats } = await import('../src/world/wildlife/boats.js');
const { carContact } = await import('../src/world/drive/collision.js');
const { Player } = await import('../src/core/player.js');
const { createInteract } = await import('../src/core/ui.js');
document.body.classList = { toggle() {}, add() {}, remove() {}, contains: () => false };
ctx.audio = { context: null, muted: true, play() {} };
ctx.ui = { toast() {}, modalOpen: false };
const dom = { addEventListener() {}, requestPointerLock() {} };
const player = new Player(ctx.camera, dom, ph, L.WORLD.play);
player.enabled = true; player.clampXZ = L.clampToPlay; player.solidAt = L.insideBuilding; player.smoothing = 0;
player.setPose(L.HERO.x, L.HERO.z, L.HERO.yaw, L.HERO.pitch);
ctx.playerObj = player;
ctx.interact = createInteract({ camera: ctx.camera, player, ui: ctx.ui, doc: null });
await (await import('../src/world/drive.js')).build(ctx);
const d = ctx.drive;
const water = (x, z) => ph.waterLevel(x, z);
const craftSvc = ctx.services.craftSolids;
const tourists = collectBoats(ctx, L);                 // the independent description: { id, key, moving, hull { len, wid }, at(t) -> { x, z, rot } }, 'c-' = the Fontanka (long axis local z), else long axis local x

/** the input of the sim hook: a constant or a function of the time, with every field (a function result is not completed by drive.sim) */
const inp = (f, ctxr = null) => (t) => ({ thr: 0, brk: 0, steer: 0, hand: false, nitro: false, jump: false, flip: false, ...(typeof f === 'function' ? f(t, ctxr && ctxr()) : f) });

const await_DOCKS = await import('../src/world/drive/boat/index.js');
if (AREA !== 'palace') {
  check(`area ${AREA}: a boat only where the dock is; every craft box that exists lies in this territory (${craftSvc ? craftSvc.list.length : 0} craft), nothing outside it is a solid`, () => {
    const { DOCKS } = await_DOCKS; const docks = DOCKS.filter((k) => L.inPlay(k.x, k.z) && ph.waterLevel(k.x, k.z) != null).length;
    assert.equal(d.boats.length, docks, 'a boat exactly where a dock lies in the territory'); assert.equal(d.vehicles.length, d.fleet.length + docks);
    for (const c of (craftSvc ? craftSvc.list : [])) { let inside = false; for (let k = 0; k < 16 && !inside; k++) { const o = { x: 0, z: 0, rot: 0 }; c.pose(k * 47, o); inside = L.inPlay(o.x, o.z, -40); if (!c.moving) break; } assert.ok(inside, `${c.id} is outside the territory`); }
    if (AREA === 'smolny') assert.ok(!craftSvc || craftSvc.list.length === 0, `${craftSvc.list.length} craft in the Smolninskoye`);
    ctx.time = 50; ctx.player.position.set(L.HERO.x, 0, L.HERO.z); ph.refreshDynamic();
    for (const i of ph._dynItems) if (i.source && i.source.craft) assert.ok(Math.hypot(i.cx - L.HERO.x, i.cz - L.HERO.z) < 400, 'a craft box far from the player');
  });
  check(`area ${AREA}: the cars are as before (each of the fleet enters, drives off and exits)`, () => { for (const v of d.fleet) { assert.ok(d.enter(v.id), v.id); d.sim(0.5, inp({ thr: 1 })); assert.ok(d.car.speed > 0.5, v.id); assert.ok(d.exit(true)); } });
  console.log(fails ? `
${fails} FAILED of ${checks + fails}` : `
ALL ${checks} PASSED`); process.exit(fails ? 1 : 0);
}

// ---------------------------------------------------------------- the helpers
const boat = d.boats[0], SPEC = boat.spec;
const DOCK = { x: boat.parked.x, z: boat.parked.z, yaw: boat.parked.yaw };
const walker = (x, z) => { player.inputLock = 0; player.setPose(x, z, 0, 0); return player; };
/** an oriented box { cx, cz, hw, hd, c, s } (the physics convention: local x -> (c, -s), local z -> (s, c)) */
const obb = (cx, cz, w, dd, rot) => ({ cx, cz, hw: w / 2, hd: dd / 2, c: Math.cos(rot), s: Math.sin(rot) });
/** the penetration depth of two oriented boxes (0 when apart): the smallest overlap over the four separating axes */
const pen = (a, b) => {
  let m = Infinity;
  for (const ax of [[a.c, -a.s], [a.s, a.c], [b.c, -b.s], [b.s, b.c]]) {
    const r = (o) => o.hw * Math.abs(ax[0] * o.c - ax[1] * o.s) + o.hd * Math.abs(ax[0] * o.s + ax[1] * o.c);
    const p = r(a) + r(b) - Math.abs((b.cx - a.cx) * ax[0] + (b.cz - a.cz) * ax[1]); if (p <= 0) return 0; m = Math.min(m, p);
  }
  return m;
};
const hullOf = (car) => obb(car.x + Math.sin(car.yaw) * SPEC.centerZ, car.z + Math.cos(car.yaw) * SPEC.centerZ, SPEC.W, SPEC.len, car.yaw);
/** the footprint of a tourist boat from its service description at time t */
// (the Fontanka hulls by kind: landmarksC/boats.js SPECS Ln x B; the wildlife table rounds them to 24 x 4.4 / 18 x 4.0)
const FONT = { tramA: [24, 4.4], tramB: [22, 4.2], vintageRed: [18, 4.0], vintageNavy: [17, 3.9] }, fontKind = new Map((ctx.services.landmarksC.boats || []).map((q) => ['c-' + q.id, q.kind]));
const craftObb = (b, t) => { const a = b.at(t); if (b.id.startsWith('c-')) { const [len, wid] = FONT[fontKind.get(b.id)]; return obb(a.x, a.z, wid, len, a.rot); } return obb(a.x, a.z, b.hull.len, b.hull.wid, a.rot); };
const by = (id) => tourists.find((b) => b.id === id);
/** the float blocks (static) and the hull boxes the physics sees now: what the player's boat can hit */
const floatBlocks = () => ph.items.filter((i) => i.floatBlock);
const wet = (x, z) => water(x, z) !== null;
/** the straight run from (sx, sz) to (tx, tz) over water, with the beam of the boat (+-1.3 m) */
const clearRun = (sx, sz, tx, tz) => {
  const l = Math.hypot(tx - sx, tz - sz), ux = (tx - sx) / l, uz = (tz - sz) / l;
  for (let s = 0; s <= l; s += 1) for (const o of [-1.3, 0, 1.3]) if (!wet(sx + ux * s - uz * o, sz + uz * s + ux * o) || !L.inPlay(sx + ux * s, sz + uz * s, 8)) return false;
  return true;
};
/** drive the boat from a start (x, z, yaw, v0) for T seconds with the clock running from tStart; `targets` = [{ name, obb(t) }] are what it may hit. Returns what happened. */
function run({ x, z, yaw, v0 = 0, tStart = 0, T = 8, input, targets = [], tol = 0.06, watch = null }) {
  ctx.time = tStart; ctx.player.position.set(x, 0, z);
  d.exit(true); walker(x, z); d.enter('boat'); d.teleport(x, z, yaw);
  d.car.vx = Math.sin(yaw) * v0; d.car.vz = Math.cos(yaw) * v0;
  const r = { hits: [], scrapes: 0, maxPen: 0, penAt: null, off: 0, jump: 0, jumpAt: null, minGap: Infinity, firstHit: null, relAfter: null, recoil: 0, trace: [] };
  let prev = { x: d.car.x, z: d.car.z }, hitFrame = -1, sep0 = 0;
  const sepN = (c, i) => { const tg = targets[0]; if (!tg || !r.firstHit) return 0; const o = tg.obb(tStart + i / 60); return (c.x - o.cx) * r.firstHit.nx + (c.z - o.cz) * r.firstHit.nz; };
  d.sim(T, inp(input || { thr: 1 }, () => r), (i, c) => {
    const t = tStart + i / 60, hull = hullOf(c);
    // the boxes the physics used in this very step (the clock moves after it)
    for (const tg of targets) { const p = pen(hull, tg.obb(t)); if (p > r.maxPen) { r.maxPen = p; r.penAt = { name: tg.name, t: +t.toFixed(2), depth: +p.toFixed(3) }; } }
    for (const e of c.events) {
      if (!e.obstacle) continue;
      const src = e.obstacle.source, hitCraft = src && src.craft, hitFloat = e.obstacle.floatBlock;
      const hid = hitCraft ? hitCraft.id : hitFloat ? 'float' : '?';
      if (e.type === 'hit') { r.hits.push({ t: +t.toFixed(2), v: +e.v.toFixed(1), craft: hid }); if (!r.firstHit && (!watch || hid === watch)) { r.firstHit = { nx: e.nx, nz: e.nz, v: e.v }; hitFrame = i; sep0 = sepN(c, i); r.relAfter = (c.vx - (src && src.vx || 0)) * e.nx + (c.vz - (src && src.vz || 0)) * e.nz; } } else r.scrapes++;
    }
    if (hitFrame >= 0) {
      r.recoil = Math.max(r.recoil, sepN(c, i) - sep0);
    }       // the boat's distance from the struck hull along the first contact normal, after the blow
    if (!wet(c.x, c.z)) r.off++;
    const mv = Math.hypot(c.x - prev.x, c.z - prev.z); if (mv > 0.9) { r.jump++; r.jumpAt = r.jumpAt || { i, mv: +mv.toFixed(2), x: +c.x.toFixed(1), z: +c.z.toFixed(1) }; } prev = { x: c.x, z: c.z };
    for (const tg of targets) { const o = tg.obb(t); r.minGap = Math.min(r.minGap, Math.hypot(c.x - o.cx, c.z - o.cz)); }
    ctx.time = tStart + (i + 1) / 60; ctx.player.position.set(c.x, c.y, c.z);
    if (i % 30 === 0) r.trace.push([+c.x.toFixed(1), +c.z.toFixed(1), +c.speed.toFixed(0)]);
    if (process.env.TRACE && hitFrame >= 0 && i < hitFrame + 40) console.log('      frame', i, 'v', c.vx.toFixed(2), c.vz.toFixed(2), 'yaw', c.yaw.toFixed(2), 'spin', c.impactSpin.toFixed(2), 'sep', sepN(c, i).toFixed(2), 'ev', c.events.map((e) => e.type).join());
  });
  r.tol = tol; return r;
}
/** a start for a run at a target point: 16 directions, the broadside ones first (the normal of `axis` = the unit long axis of the target, or none), over water the whole way */
function approach(tx, tz, dist, axis = null) {
  const cands = [];
  for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, dx = Math.sin(a), dz = Math.cos(a); cands.push({ dx, dz, score: axis ? Math.abs(dx * axis[0] + dz * axis[1]) : 0 }); }
  cands.sort((p, q) => p.score - q.score);          // the smallest |cos| with the long axis = the most broadside
  for (const c of cands) { const sx = tx - c.dx * dist, sz = tz - c.dz * dist; if (clearRun(sx, sz, tx, tz)) return { x: sx, z: sz, yaw: Math.atan2(c.dx, c.dz), dx: c.dx, dz: c.dz }; }
  return null;
}
const axisOf = (b, t = 0) => { const a = b.at(t); return b.id.startsWith('c-') ? [Math.sin(a.rot), Math.cos(a.rot)] : [Math.cos(a.rot), -Math.sin(a.rot)]; };
const report = (name, r) => console.log(`     ${name}: ${r.hits.length} hit(s) ${JSON.stringify(r.hits.slice(0, 3))}, ${r.scrapes} scrape(s), deepest overlap ${r.maxPen.toFixed(3)} m ${r.penAt ? JSON.stringify(r.penAt) : ''}, closest centre ${r.minGap.toFixed(1)} m, ${r.firstHit ? `first blow ${r.firstHit.v.toFixed(1)} m/s (relative velocity along the normal after it ${r.relAfter.toFixed(2)}), recoil ${r.recoil.toFixed(2)} m` : 'no blow'}, off ${r.off}, jumps ${r.jump}${r.jumpAt ? ' ' + JSON.stringify(r.jumpAt) : ''}`);
const solidRun = (r, what) => {
  assert.ok(r.hits.length > 0, `${what}: the boat went through (no hit, deepest overlap ${r.maxPen.toFixed(2)} m at ${JSON.stringify(r.penAt)})`);
  assert.ok(r.maxPen <= r.tol, `${what}: the hull was inside the craft by ${r.maxPen.toFixed(3)} m ${JSON.stringify(r.penAt)}`);
  assert.ok(r.recoil > 0.05 && r.relAfter > -0.6, `${what}: no bounce (it got ${r.recoil.toFixed(2)} m away from the hull along the contact normal after the blow; relative velocity along the normal right after it ${r.relAfter === null ? 'n/a' : r.relAfter.toFixed(2)})`);
  assert.equal(r.off, 0, `${what}: the centre left the water`); assert.equal(r.jump, 0, `${what}: a jump / teleport ${JSON.stringify(r.jumpAt)}`);
};

// ---------------------------------------------------------------- 1 the registry
check('1 the tourist boats of both modules are described (the services exist: environment boats + the Fontanka fleet)', () => {
  assert.ok(tourists.length >= 20, `${tourists.length} boats`); assert.ok(tourists.some((b) => b.id.startsWith('c-') && b.moving) && tourists.some((b) => b.id.startsWith('e-') && !b.moving) && tourists.some((b) => b.id.startsWith('e-') && b.moving));
});
check('1 every boat of the page is a hull box of the dynamic mechanism (the registry), the moving ones carry the velocity and spin, the moored ones stand still, all with invMassRatio 0', () => {
  assert.ok(craftSvc, 'no craft registry (ctx.services.craftSolids)'); assert.ok(craftSvc.list.length >= tourists.length, `${craftSvc.list.length} craft for ${tourists.length} boats`);
  ctx.time = 100; ctx.player.position.set(DOCK.x, 0, DOCK.z); ph.refreshDynamic();
  const near = ph._dynItems.filter((i) => i.source && i.source.craft);
  assert.ok(near.length >= 4, `${near.length} craft boxes around the dock`);
  for (const i of near) { assert.equal(i.source.invMassRatio, 0); assert.ok(i.y1 - i.y0 > 1.5 && i.y0 < water(i.cx, i.cz) && i.y1 > water(i.cx, i.cz) + 1.5, `heights ${i.y0} .. ${i.y1}`); }
  const mv = near.find((i) => i.source.craft.moving), st = near.find((i) => !i.source.craft.moving);
  assert.ok(mv && Math.hypot(mv.source.vx, mv.source.vz) > 1 && Math.hypot(mv.source.vx, mv.source.vz) < 4, `a moving boat of the Fontanka: ${mv && Math.hypot(mv.source.vx, mv.source.vz)} m/s`);
  assert.ok(st && st.source.vx === 0 && st.source.vz === 0 && st.source.spin === 0, 'a moored boat moves');
  // the box is the pose of the service at that very time (the same pure function)
  for (const b of tourists) { const o = craftObb(b, 100), box = near.find((i) => i.source.craft.id === b.id.replace(/^e-/, '')); if (!box) continue; assert.ok(Math.hypot(box.cx - o.cx, box.cz - o.cz) < 1e-6 && Math.abs(box.c - o.c) < 1e-6 && Math.abs(box.hw - o.hw) < 1e-6 && Math.abs(box.hd - o.hd) < 1e-6, b.id); }
  const a = ph._dynItems.filter((i) => i.source && i.source.craft); ph.refreshDynamic(); const b2 = ph._dynItems.filter((i) => i.source && i.source.craft); assert.equal(b2.length, a.length); assert.ok(b2.every((i) => a.includes(i)), 'the boxes are reused objects between refreshes');
});
check('1 far away there are no craft boxes (only the boats near the player are boxes), and the registry only has craft that belong to this territory', () => {
  ctx.time = 100; ctx.player.position.set(L.HERO.x, 0, L.HERO.z + 6000); ph.refreshDynamic();
  assert.equal(ph._dynItems.filter((i) => i.source && i.source.craft).length, 0);
  for (const c of craftSvc.list) { const b = c.box; assert.ok(L.inPlay(b.cx, b.cz, -400) || c.moving, `${c.id} at ${b.cx.toFixed(0)}, ${b.cz.toFixed(0)} is outside the territory`); }
});
const fbs = floatBlocks();
check('1 the pontoons and the landing slabs are float blocks: a top over the boat step height (0.45), under what a walker standing on a deck / landing reaches', () => {
  assert.ok(fbs.length >= 20, `${fbs.length} float blocks`);
  for (const b of fbs) { const wl = water(b.cx, b.cz); assert.ok(wl !== null, 'a float block on dry land'); assert.ok(b.y1 - wl > 0.45 && b.y1 - wl <= 0.45 + 0.22 + 1e-9, `top ${b.y1 - wl} over the water`); }
});
const q = ctx.services.environment.quay, openStair = q.allStairs.find((s) => s.walk && s.pontoonTop !== undefined);
const PONT = openStair && { len: 15, wid: 3.0, top: openStair.pontoonTop };
check('1 a walker standing on the pontoon deck / the lower landing of the Anichkov stair is NOT pushed by the float blocks (they are floors for him, as before) and can step from the landing onto the deck', () => {
  assert.ok(openStair, 'no steppable stair');
  const { x, z, tx, tz, nx, nz } = openStair, Pq = (u, v) => [x + tx * u - nx * v, z + tz * u - nz * v], uL = 1.6 + 11 * 0.4;
  const stand = (u, v, feet) => { const p = { x: Pq(u, v)[0], z: Pq(u, v)[1] }; const x0 = p.x, z0 = p.z; ph.resolve(p, 0.3, feet, 1.75); return Math.hypot(p.x - x0, p.z - z0); };
  assert.ok(stand(uL + 1.5, 1.0, openStair.landingY) < 1e-6, 'pushed on the landing');
  for (const u of [10, 14, 20, 23]) for (const v of [0.6, 1.5, 2.5]) assert.ok(stand(u, v, PONT.top) < 1e-6, `pushed on the deck at u ${u}, v ${v}`);
  assert.ok(stand(uL + 3.2, 1.5, PONT.top) < 1e-6 && ph.groundHeight(Pq(uL + 3.2, 1.5)[0], Pq(uL + 3.2, 1.5)[1], openStair.landingY, false) === PONT.top, 'the deck is still the floor above the landing');
  // a wader on the bed is stopped by the pontoon (as by the walk box before) and by the landing
  assert.ok(stand(14, 1.5, -4.6) > 0.5, 'a wader walks through the pontoon');
});

// ---------------------------------------------------------------- 2 driving into the craft
const TL = QUICK ? 6 : 8;
// (a) a moored tourist boat of the Neva
const moored = tourists.filter((b) => !b.moving && b.id.startsWith('e-')).filter((b) => L.inPlay(b.at(0).x, b.at(0).z, 60));
let mooredPick = null;
for (const b of moored) { const a = b.at(0), ax = axisOf(b), ap = approach(a.x, a.z, 24, ax); if (ap && Math.abs(ap.dx * ax[0] + ap.dz * ax[1]) < 0.4) { mooredPick = { b, ap }; break; } }
check('2a a moored tourist boat: the boat hits its side at speed, a hit, never inside, bounces off', () => {
  assert.ok(mooredPick, 'no open broadside approach to any moored boat'); const { b, ap } = mooredPick, a = b.at(0);
  const r = run({ x: ap.x, z: ap.z, yaw: ap.yaw, T: TL, watch: b.id.replace(/^e-/, ''), targets: [{ name: b.id, obb: (t) => craftObb(b, t) }], input: (t, r) => ({ thr: r.firstHit || t > 4.5 ? 0 : 1 }) });
  report(`${b.id} (${b.hull.len.toFixed(0)} x ${b.hull.wid.toFixed(1)} m at ${a.x.toFixed(0)}, ${a.z.toFixed(0)})`, r); solidRun(r, b.id);
});
// (b) a moving boat crossing the path: the clock runs, the boat arrives at the same moment at the hull's side
function crossingRun(b, { v0 = 9, lead = 2.6, from = 30, to = 400, step = 3.7, tries = 14 } = {}) {
  let first = null, n = 0;
  for (let t1 = from; t1 < to && n < tries; t1 += step) {
    const X = b.at(t1 + lead), X2 = b.at(t1 + lead + 0.1), sp = Math.hypot(X2.x - X.x, X2.z - X.z) / 0.1; if (sp < 1.5) continue;
    const hx = (X2.x - X.x) / (sp * 0.1), hz = (X2.z - X.z) / (sp * 0.1);
    for (const sg of [1, -1]) {
      const nx = -hz * sg, nz = hx * sg, S = { x: X.x + nx * v0 * lead * 0.9, z: X.z + nz * v0 * lead * 0.9 };
      if (!clearRun(S.x, S.z, X.x, X.z)) continue;
      const r = { t1, sp, ...run({ x: S.x, z: S.z, yaw: Math.atan2(-nx, -nz), v0, tStart: t1, T: lead + 3.5, watch: b.id.replace(/^e-/, ''), targets: [{ name: b.id, obb: (t) => craftObb(b, t) }], input: (t, rr) => ({ thr: rr.firstHit || t > lead + 0.5 ? 0 : 1 }) }) };
      n++; first = first || r; if (r.firstHit) return r;       // (the first run that touches the hull: the aim depends on the lanes and the bank)
      break;
    }
  }
  return first;
}
for (const [id, o] of [['neva-tour', {}], ['neva-hydro', {}]]) {
  const b = by('e-' + id);
  check(`2b ${id}: a moving tourist boat crosses the path: the boat hits its side, never inside, bounces off, the clock runs`, () => {
    assert.ok(b && b.moving, 'no such boat'); const r = crossingRun(b, o); assert.ok(r, 'no feasible crossing');
    report(`${id} at ${r.sp.toFixed(1)} m/s, t1 ${r.t1.toFixed(0)}`, r); solidRun(r, id);
  });
}
// (c) the Fontanka boats (the long axis is local z)
for (const id of ['c-3', 'c-1']) {
  const b = by(id);
  check(`2c the Fontanka boat ${id}: the boat hits its side, never inside, bounces off`, () => {
    assert.ok(b, 'no such boat');
    const r = crossingRun(b, { v0: 8, lead: 2.0, from: 5, to: 420, step: 2.3 }); assert.ok(r, 'no feasible crossing on the Fontanka');
    report(`${id} at ${r.sp.toFixed(1)} m/s, t1 ${r.t1.toFixed(0)}`, r); solidRun(r, id);
  });
}
// (d) the pontoon and the landing slab of the steppable Anichkov stair: along the river toward the end of the pontoon, then at the lower landing from the water
check('2d the pontoon of the Anichkov stair (a floating deck 0.48 m over the water): the boat is stopped by it with a hit, never inside it, bounces off', () => {
  const { x, z, tx, tz, nx, nz } = openStair, Pq = (u, v) => [x + tx * u - nx * v, z + tz * u - nz * v], rot = Math.atan2(-tz, tx);
  const uL = 1.6 + 11 * 0.4, deck = (() => { const c = Pq(uL + 3.0 - 0.05 + 7.5 + 0.0, 1.55); return obb(c[0], c[1], 15, 2.9, rot); })();
  let best = null;
  for (const [v, end] of [[2.2, 1], [1.5, 1], [2.6, 1], [2.2, -1]]) {       // aim at the outer half of an end face, along the pontoon's axis, from the open river
    const tgt = Pq(end > 0 ? uL + 3.0 + 15 : uL + 3.0, v), sx = tgt[0] + tx * end * 22, sz = tgt[1] + tz * end * 22;
    if (!clearRun(sx, sz, tgt[0], tgt[1])) continue;
    const r = run({ x: sx, z: sz, yaw: Math.atan2(-tx * end, -tz * end), T: TL, watch: 'float', targets: [{ name: 'pontoon', obb: () => deck }], input: (t, rr) => ({ thr: rr.firstHit || t > 3.5 ? 0 : 1 }) });
    report(`pontoon end ${end} at v ${v}`, r); best = r; if (r.firstHit) break;
  }
  assert.ok(best, 'no open run at the pontoon'); solidRun(best, 'the pontoon');
});
check('2d the lower landing slab of a stair descent into the Neva / a canal (3 m x the flight width, 0.22 m over the water): the boat comes down the river along the flight, is stopped by the slab, never inside, bounces off', () => {
  let best = null, tried = 0;
  for (const st of q.allStairs) {
    if (!st.walk || st.pier || st.key === 'fontanka' || !L.inPlay(st.endX, st.endZ, 30) || tried >= 6) continue;
    const { x, z, tx, tz, nx, nz } = st, Pq = (u, v) => [x + tx * u - nx * v, z + tz * u - nz * v], rot = Math.atan2(-tz, tx);
    const uE = st.length, c = Pq(uE - 1.5, st.w / 2), slab = obb(c[0], c[1], 3.0, st.w, rot), tgt = Pq(uE, st.w / 2);
    const sx = tgt[0] + tx * 24, sz = tgt[1] + tz * 24;                                      // from the open water beyond the end of the landing, along the flight
    let wetRun = true; for (let s = 0; s <= 24 && wetRun; s += 1) wetRun = wet(tgt[0] + tx * s, tgt[1] + tz * s) && L.inPlay(tgt[0] + tx * s, tgt[1] + tz * s, 8);
    if (!wetRun) continue;
    tried++;
    const r = run({ x: sx, z: sz, yaw: Math.atan2(-tx, -tz), T: 6, watch: 'float', targets: [{ name: 'landing', obb: () => slab }], input: (t, rr) => ({ thr: rr.firstHit || t > 2.6 ? 0 : 1 }) });
    report(`landing of the flight at ${x.toFixed(0)}, ${z.toFixed(0)} (${st.key}, ${st.w} m wide)`, r); best = r; if (r.firstHit) break;
  }
  assert.ok(best, 'no open run at a landing'); solidRun(best, 'the landing slab');
});
// (e) a hull sweeping into a RESTING boat: it is pushed along, never run through, nothing teleports; the craft is not moved by it
check('2e a moving hull comes down on a resting boat: contact events, the boat is carried and pushed, never inside it, the craft keeps its scripted pose', () => {
  const b = by('e-neva-tour'); assert.ok(b);
  let done = false;
  for (let t1 = 30; t1 < 300 && !done; t1 += 4.1) {
    const X = b.at(t1 + 5), X2 = b.at(t1 + 5.1), sp = Math.hypot(X2.x - X.x, X2.z - X.z) / 0.1; if (sp < 2) continue;
    const hx = (X2.x - X.x) / (sp * 0.1), hz = (X2.z - X.z) / (sp * 0.1), ahead = { x: X.x + hx * 15, z: X.z + hz * 15 };       // dead ahead of the bow, in its path
    if (!clearRun(ahead.x, ahead.z, ahead.x + hx * 12, ahead.z + hz * 12) || !clearRun(ahead.x - hx * 12, ahead.z - hz * 12, ahead.x, ahead.z)) continue;
    const r = run({ x: ahead.x, z: ahead.z, yaw: Math.atan2(hx, hz) + 0.4, tStart: t1 + 5, T: 8, input: { thr: 0 }, targets: [{ name: b.id, obb: (t) => craftObb(b, t) }] });
    report(`${b.id} at ${sp.toFixed(1)} m/s onto a boat at rest`, r);
    assert.ok(r.hits.length + r.scrapes > 0, `the hull went through the resting boat (deepest overlap ${r.maxPen.toFixed(2)} m)`);
    assert.ok(r.maxPen <= r.tol, `inside the hull by ${r.maxPen.toFixed(3)} m ${JSON.stringify(r.penAt)}`); assert.equal(r.off, 0); assert.equal(r.jump, 0);
    const a = b.at(ctx.time), box = craftSvc.list.find((c) => c.id === b.id.replace(/^e-/, '')).box;
    assert.ok(Math.hypot(box.cx - a.x, box.cz - a.z) < 0.2, `the craft was moved by the contact (${Math.hypot(box.cx - a.x, box.cz - a.z).toFixed(2)} m off its script)`);
    done = true;
  }
  assert.ok(done, 'no feasible sweep');
});

// (f) a boat caught between a hull and the quay is not teleported: the existing code pushes it as it pushes a car (the shore refuses a push onto land, the impulse stays), it stays on the water. The hull is a fixture
// registered through the registry (a scripted hull that glides toward the quay wall 3 m off the west bank of the Fontanka and stops with its side 0.6 m over the resting boat).
check('2f a resting boat between a sweeping hull and the quay wall: no teleport, it stays on the water, the squeeze stays shallow and nothing is NaN', () => {
  const z = -138, yaw = 0, hullW = 3.0, t0 = 200, T = 7;
  let wx = DOCK.x; while (wet(wx - 1, z)) wx--;                                      // the water edge (the quay) on that row
  const bx = wx + 1.7, xEnd = bx + 0.95 - 0.6 + hullW / 2, xStart = xEnd + 11;       // the boat 1.7 m off the edge; the sweeper's final centre puts its west face 0.6 m inside the boat's east side
  const sweeper = craftSvc.add({ id: 'test-sweeper', kind: 'test', key: 'fontanka', y: water(bx, z), w: hullW, d: 12, h: 2.2, moving: true, speed: 3, pose: (t, o) => { const k = Math.max(0, Math.min(1, (t - t0) / 4)); o.x = xStart + (xEnd - xStart) * k; o.z = z; o.rot = 0; } });
  assert.ok(sweeper, 'the fixture is not in the territory');
  try {
    const r = run({ x: bx, z, yaw, tStart: t0, T, input: { thr: 0 }, targets: [{ name: 'sweeper', obb: (t) => { const k = Math.max(0, Math.min(1, (t - t0) / 4)); return obb(xStart + (xEnd - xStart) * k, z, hullW, 12, 0); } }], tol: 1.1 });
    report(`a hull at ${(xStart - xEnd) / 4} m/s onto a boat 1.7 m off the quay`, r);
    assert.ok(r.hits.length + r.scrapes > 0, 'no contact'); assert.equal(r.jump, 0, `teleported ${JSON.stringify(r.jumpAt)}`); assert.equal(r.off, 0, 'the boat left the water');
    assert.ok(r.maxPen < 1.1, `squeezed ${r.maxPen.toFixed(2)} m deep`); assert.ok(Number.isFinite(d.car.x) && Number.isFinite(d.car.vx) && Number.isFinite(d.car.yaw), 'NaN');
  } finally { craftSvc.remove(sweeper); }
});

// ---------------------------------------------------------------- 3 the dock, the walker, a car on the bed
check('3 the dock: the boat leaves the dock south (the Fontanka fleet running, the clock advancing) and comes back to the dock without a single hit and without being caught by the landing or the pontoon', () => {
  let hits = 0, maxPen = 0, minD = 1e9, off = 0; const hitInfo = [];
  const all = () => [...floatBlocks(), ...ph._dynItems.filter((i) => i.source && i.source.craft)];
  const sample = (c) => { const h = hullOf(c); for (const o of all()) maxPen = Math.max(maxPen, pen(h, o)); for (const e of c.events) if (e.type === 'hit') { hits++; const ob = e.obstacle; hitInfo.push(`${ob && (ob.floatBlock ? 'float' : ob.source && ob.source.craft ? ob.source.craft.id : ob.type)}@${ob && ob.cx.toFixed(1)},${ob && ob.cz.toFixed(1)} v${e.v.toFixed(1)} boat ${c.x.toFixed(1)},${c.z.toFixed(1)}`); } if (!wet(c.x, c.z)) off++; };
  ctx.time = 37; ctx.player.position.set(DOCK.x, 0, DOCK.z);
  d.exit(true); walker(DOCK.x - 3, DOCK.z); d.enter('boat'); d.teleport(DOCK.x, DOCK.z, DOCK.yaw);
  const T1 = 3;
  d.sim(T1, inp({ thr: 1 }), (i, c) => { sample(c); ctx.time = 37 + (i + 1) / 60; ctx.player.position.set(c.x, c.y, c.z); });
  // back: aim at the dock, brake when near
  const T2 = QUICK ? 26 : 34;
  d.sim(T2, inp((t) => { const c = d.car, dx = DOCK.x - c.x, dz = DOCK.z - c.z, dist = Math.hypot(dx, dz), want = Math.atan2(dx, dz); let dy = want - c.yaw; dy -= 2 * Math.PI * Math.round(dy / (2 * Math.PI)); return { thr: dist > 28 ? 1 : dist > 9 ? (c.speed > 14 ? 0 : 0.5) : 0, brk: dist <= 9 && c.speed > 7 ? 1 : 0, steer: Math.max(-1, Math.min(1, dy * 2.4)) }; }),
    (i, c) => { sample(c); minD = Math.min(minD, Math.hypot(c.x - DOCK.x, c.z - DOCK.z)); ctx.time = 37 + T1 + (i + 1) / 60; ctx.player.position.set(c.x, c.y, c.z); });
  console.log(`     out ${T1} s and back: ${hits} hit(s) ${JSON.stringify(hitInfo)}, deepest overlap with any craft / float block ${maxPen.toFixed(3)} m, closest to the dock ${minD.toFixed(1)} m, ended at ${d.car.x.toFixed(1)}, ${d.car.z.toFixed(1)} at ${d.car.speed.toFixed(0)} km/h`);
  assert.equal(hits, 0, 'a hit on the way out or back'); assert.ok(maxPen <= 0.06, `inside a craft / pontoon by ${maxPen.toFixed(3)} m`); assert.equal(off, 0);
  assert.ok(minD < 3.5, `did not come back to the dock (closest ${minD.toFixed(1)} m)`);
});
check('3 a walker is stopped by a hull (a boat that sweeps over him pushes him aside: never inside it), as he is stopped by a car', () => {
  const b = by('e-moika-garden'); let inside = 0, moved = 0, n = 0;       // (a canal 1.5 m deep: the head of a wader reaches the hull; on the 2.6 m Neva bed he would walk under it)
  for (let t1 = 30; t1 < 300 && !n; t1 += 4.1) {
    const X = b.at(t1 + 3), X2 = b.at(t1 + 3.1), sp = Math.hypot(X2.x - X.x, X2.z - X.z) / 0.1; if (sp < 2) continue;
    const p = { x: X.x, z: X.z }, bed = ph.heightAt(p.x, p.z); if (water(p.x, p.z) === null) continue;
    ctx.time = t1; ctx.player.position.set(p.x, bed, p.z);
    for (let i = 0; i < 360; i++) { ctx.time = t1 + i / 60; ph.refreshDynamic(); const x0 = p.x, z0 = p.z; ph.resolve(p, 0.3, bed, 1.75); moved += Math.hypot(p.x - x0, p.z - z0); const o = craftObb(b, ctx.time), dx = p.x - o.cx, dz = p.z - o.cz, lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c; if (Math.abs(lx) < o.hw && Math.abs(lz) < o.hd) inside++; n++; }
  }
  assert.ok(n > 0, 'no feasible run'); assert.ok(moved > 1, `the walker was not pushed (${moved.toFixed(2)} m)`); assert.equal(inside, 0, `${inside} frames with the walker's centre inside the hull`);
});
check('3 a car on the river bed (feet far under the water) meets the same hull; a floating boat meets it at its waterline', () => {
  const b = by('c-3'), o = craftObb(b, ctx.time), a = b.at(ctx.time), bed = ph.heightAt(a.x, a.z), wl = water(a.x, a.z);
  ph.refreshDynamic(); ctx.player.position.set(a.x, 0, a.z); ph.refreshDynamic();
  const it = ph._dynItems.find((i) => i.source && i.source.craft && i.source.craft.id === b.id); assert.ok(it, 'the box is not there');
  const lada = d.fleet.find((f) => f.id === 'lada').spec;
  const bedCar = { x: a.x, z: a.z, yaw: a.rot, y: bed, floats: false }, floatCar = { x: a.x, z: a.z, yaw: a.rot, y: wl, floats: true };
  assert.ok(carContact(bedCar, lada, it), 'a car on the bed passes through the hull'); assert.ok(carContact(floatCar, SPEC, it), 'a floating boat passes through the hull');
  void o;
});
console.log(fails ? `\n${fails} FAILED of ${checks + fails}` : `\nALL ${checks} PASSED`);
void THREE; void errors;
process.exit(fails ? 1 : 0);
