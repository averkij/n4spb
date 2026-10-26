// CPU test of the gate geometry and state machine (src/core/gates.js, docs/AREAS.md section "Arming, hysteresis"). node tools/gates-test.mjs
// Synthetic gate: the border is the segment z = 0, x 0..200; "inward" (0, +1) points into the gate's own area (z > 0). A player at z = d is d metres inside.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DEFAULTS, depthFor, chipFor, gateCoords, createGateMachine, createGates, planArrival, promptTexts, crossPlaces, isDoor, backLink, inUnion, seamEntryOk, seamWrite, seamRead, seamClear, createSeam, grabFrame, SEAM_LEAD } from '../src/core/gates.js';
import { REGISTRY, GATES } from '../src/areas/registry.js';
import { decodeHo, makeHo, encodeHo, camParam, parseCamParam } from '../src/core/handoff.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let fails = 0, passes = 0;
const acheck = async (name, fn) => { try { await fn(); passes++; console.log('  ok   ' + name); } catch (e) { fails++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n').slice(0, 5).join('\n       ')); } };
const check = (name, fn) => { try { fn(); passes++; console.log('  ok   ' + name); } catch (e) { fails++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n').slice(0, 5).join('\n       ')); } };
const G = { id: 'g', from: 'a', to: 'b', seg: [[0, 0], [200, 0]], inward: [0, 1], zone: 30 };
const H = { id: 'h', from: 'a', to: 'c', seg: [[300, 0], [500, 0]], inward: [0, 1], zone: 30 };
const DT = 1 / 30;

/** move from (x, z0) to (x, z1) at `speed` m/s in `mode`; returns the log of { d, chip, offer } per step (stops at the first offer when stopAtOffer) */
function run(m, { x = 100, z0, z1, speed, mode = 'walk', blocked = false, stopAtOffer = true, settle = 2 }) {
  const out = []; const n = Math.ceil(Math.abs(z1 - z0) / speed / DT); let z = z0;
  for (let i = 0; i < settle / DT; i++) m.update({ dt: DT, x, z, mode, blocked });       // stand still first, so that the speed estimate is 0 at the start
  for (let i = 0; i <= n; i++) {
    z = z0 + (z1 - z0) * Math.min(1, i / n);
    const r = m.update({ dt: DT, x, z, mode, blocked }); out.push({ z, d: z, chip: !!r.chip, offer: r.offer, v: r.v });
    if (stopAtOffer && r.offer) break;
  }
  return out;
}
const firstOffer = (log) => log.find((s) => s.offer);
const firstChip = (log) => log.find((s) => s.chip);
const fresh = (gates = [G], cfg = {}) => { const m = createGateMachine({ gates, config: { graceS: 0, ...cfg } }); return m; };

console.log('geometry:');
check('gateCoords: d is the depth into the own area, s the position along the border', () => { const c = gateCoords(G, 50, 12); assert.equal(c.d, 12); assert.equal(c.s, 50); assert.equal(c.len, 200); const w = gateCoords({ ...G, inward: [1, 0], seg: [[0, 0], [0, 100]] }, 30, 40); assert.equal(w.d, 30); assert.equal(w.s, 40); });
check('depth: a walker 30 m, a vehicle clamp(30 + 0.5 v + v^2/60, 40, 160)', () => {
  assert.equal(depthFor('walk', 20), 30); assert.equal(depthFor('car', 0), 40); assert.equal(Math.round(depthFor('car', 48)), 92); assert.equal(depthFor('car', 79), 160); assert.equal(depthFor('car', 200), 160); assert.equal(depthFor('fly', 30), depthFor('car', 30));
});
check('chip distance: 90 m for a walker, depth + 30 for a vehicle', () => { assert.equal(chipFor('walk', 0), 90); assert.equal(Math.round(chipFor('car', 48)), 122); });

console.log('a walker:');
check('the chip shows from 90 m, the question at 30 m while approaching', () => {
  const log = run(fresh(), { z0: 150, z1: 0, speed: 1.5 });
  assert(Math.abs(firstChip(log).d - 90) < 2, 'chip at ' + firstChip(log).d); const o = firstOffer(log); assert(o, 'no offer'); assert(o.d <= 30 && o.d > 27, 'offer at ' + o.d);
});
check('standing still at 29 m asks nothing; standing within 8 m asks', () => {
  assert.equal(firstOffer(run(fresh(), { z0: 29, z1: 29.01, speed: 0.01, stopAtOffer: false, settle: 5 })), undefined);
  assert(firstOffer(run(fresh(), { z0: 7, z1: 7.01, speed: 0.01, settle: 1 })));
});
check('walking AWAY inside the zone asks nothing', () => assert.equal(firstOffer(run(fresh(), { z0: 12, z1: 80, speed: 1.5, stopAtOffer: false })), undefined));
check('outside the segment (lateral) nothing happens, even close to the border', () => { const log = run(fresh(), { x: -30, z0: 100, z1: 0, speed: 1.5, stopAtOffer: false }); assert(!firstChip(log) && !firstOffer(log)); });
check('a blocked player (panel open, travelling, underground, not started) is never asked and sees no chip', () => { const log = run(fresh(), { z0: 100, z1: 0, speed: 1.5, blocked: true, stopAtOffer: false }); assert(!firstChip(log) && !firstOffer(log)); });
check('no question in the first graceS seconds', () => { const m = createGateMachine({ gates: [G], config: { graceS: 6 } }); let asked = null; for (let i = 0; i < 6 / DT - 2; i++) { const r = m.update({ dt: DT, x: 100, z: 5, mode: 'walk', blocked: false }); if (r.offer) asked = i * DT; } assert.equal(asked, null); assert(m.update({ dt: DT * 4, x: 100, z: 5, mode: 'walk', blocked: false }).offer, 'asked after the grace'); });

console.log('decline:');
check('after a decline: not asked again for 45 s AND until the player has left the zone by 20 m', () => {
  const m = fresh(); const log = run(m, { z0: 60, z1: 0, speed: 1.5 }); const g = firstOffer(log).offer; m.markOpen(g); m.decline(g);
  // the player stays put in the zone for 60 s: no question (time passes but the zone was never left)
  let asked = false; for (let i = 0; i < 60 / DT; i++) if (m.update({ dt: DT, x: 100, z: 5, mode: 'walk', blocked: false }).offer) asked = true; assert(!asked, 'asked while still in the zone');
  // leaves by 25 m beyond the zone (z = 55 + ...), waits out the time, comes back: asked again
  for (let i = 0; i < 2 / DT; i++) m.update({ dt: DT, x: 100, z: 60, mode: 'walk', blocked: false });
  const again = run(m, { z0: 60, z1: 0, speed: 1.5, settle: 0 }); assert(firstOffer(again), 'not asked after leaving the zone and waiting');
});
check('leaving the zone is not enough before the 45 s have passed', () => {
  const m = fresh(); const log = run(m, { z0: 60, z1: 0, speed: 1.5 }); const g = firstOffer(log).offer; m.markOpen(g); m.decline(g);
  for (let i = 0; i < 1 / DT; i++) m.update({ dt: DT, x: 100, z: 70, mode: 'walk', blocked: false });          // left by 40 m after ~1 s
  const again = run(m, { z0: 70, z1: 0, speed: 3, stopAtOffer: false, settle: 0 }); assert(!firstOffer(again), 'asked inside the cooldown');
});
check('a failed preflight cools the gate for 30 s without needing an exit', () => {
  const m = fresh(); const log = run(m, { z0: 60, z1: 0, speed: 1.5 }); const g = firstOffer(log).offer; m.markOpen(g); m.cooldown(g);
  let asked = false; for (let i = 0; i < 29 / DT; i++) if (m.update({ dt: DT, x: 100, z: 5, mode: 'walk', blocked: false }).offer) asked = true; assert(!asked);
  for (let i = 0; i < 3 / DT; i++) if (m.update({ dt: DT, x: 100, z: 5, mode: 'walk', blocked: false }).offer) asked = true; assert(asked, 'asked after 30 s');
});
check('a question that is open is not asked twice', () => { const m = fresh(); m.update({ dt: DT, x: 100, z: 90, mode: 'walk', blocked: false }); const r = run(m, { z0: 60, z1: 0, speed: 1.5 }); const g = firstOffer(r).offer; m.markOpen(g); let n = 0; for (let i = 0; i < 100; i++) if (m.update({ dt: DT, x: 100, z: 3, mode: 'walk', blocked: false }).offer) n++; assert.equal(n, 0); });

console.log('vehicles and flyers:');
check('a car at 30 m/s is asked at its stopping depth (30 + 15 + 15 = 60 m), a car at 60 m/s at 120 m', () => {
  const a = firstOffer(run(fresh(), { z0: 300, z1: 0, speed: 30, mode: 'car' })); assert(a && Math.abs(a.d - 60) < 3, 'at ' + a?.d);
  const b = firstOffer(run(fresh(), { z0: 400, z1: 0, speed: 60, mode: 'car' })); assert(b && Math.abs(b.d - 120) < 4, 'at ' + b?.d);
});
check('the chip of a car shows 30 m before its question', () => { const l = run(fresh(), { z0: 300, z1: 0, speed: 30, mode: 'car', stopAtOffer: false }); const c = firstChip(l), o = firstOffer(l); assert(c.d - o.d > 25 && c.d - o.d < 40, `${c.d} ${o.d}`); });
check('a flyer may overshoot the border by up to 100 m and is still asked, a walker beyond the segment end is not', () => {
  const fly = firstOffer(run(fresh(), { x: 260, z0: 150, z1: 20, speed: 10, mode: 'fly' })); assert(fly, 'a flyer 60 m beyond the end of the segment is asked');
  const walk = firstOffer(run(fresh(), { x: 260, z0: 60, z1: 5, speed: 1.5, mode: 'walk', stopAtOffer: false })); assert(!walk, 'a walker 60 m beyond the end is not');
});
check('a flyer that is past the border (d < 0) is still asked', () => { const m = fresh(); const r = firstOffer(run(m, { z0: 10, z1: -40, speed: 10, mode: 'fly' })); assert(r, 'no offer'); });

console.log('teleports:');
check('a jump of hundreds of metres does not look like speed: no question on landing next to the border while the estimate is held', () => {
  const m = fresh(); for (let i = 0; i < 60; i++) m.update({ dt: DT, x: 100, z: 300, mode: 'walk', blocked: false });
  m.teleported();
  let asked = false; for (let i = 0; i < 1.4 / DT; i++) { const r = m.update({ dt: DT, x: 100, z: 25, mode: 'walk', blocked: false }); if (r.offer) asked = true; }
  assert(!asked, 'asked in the hold');
});
check('an unannounced jump is detected as one', () => { const m = fresh(); for (let i = 0; i < 60; i++) m.update({ dt: DT, x: 100, z: 300, mode: 'car', blocked: false }); const r = m.update({ dt: DT, x: 100, z: 25, mode: 'car', blocked: false }); assert.equal(r.v, 0); });

console.log('several gates:');
check('the nearest gate is the chip, each gate has its own state', () => {
  const m = fresh([G, H]); const l = run(m, { x: 400, z0: 100, z1: 0, speed: 1.5, stopAtOffer: false }); const o = firstOffer(l); assert.equal(o.offer.id, 'h');
  m.markOpen(o.offer); m.decline(o.offer);
  const g = firstOffer(run(m, { x: 100, z0: 100, z1: 0, speed: 1.5, settle: 0 })); assert.equal(g.offer.id, 'g');          // declining h says nothing about g
});


console.log('preflight (the real logic, fakes for the network):');
/** a createGates with fakes for the DOM: over.ctx / player / ui / A ... replace the defaults; the fake ui records every confirm() in ui.asked */
const fakeDoc = () => ({ getElementById: () => null, documentElement: { classList: { contains: () => false } }, body: { classList: { contains: () => false } }, createElement: () => ({ className: '', textContent: '', append() {} }) });
const fakeUi = () => ({ open: false, asked: [], confirm(o) { this.asked.push(o); } });
// (the default is the DEVELOPMENT mode ?gateprompt=1 that restores the old chip + question: most of the checks below are about that question; 'noprompt' in the params = the real default, no question)
const mkGates = (over = {}, params0 = new URLSearchParams('devgates=1')) => {
  const params = new URLSearchParams(params0); if (params.has('noprompt')) params.delete('noprompt'); else params.set('gateprompt', '1');
  const doc = fakeDoc(), win = { location: { href: 'http://h/index.html', search: '' }, addEventListener() {} };
  const ctx = { onUpdate() {}, drive: null };
  return createGates({ ctx, player: { inputLock: 0, riding: false, fly: false, pos: { x: 0, z: 0 }, yaw: 0, pitch: 0, isUnderground: () => false }, camera: { position: {} }, ui: fakeUi(), tod: { k: 0, variant: null }, audio: { muted: false }, guard: null, params, A: { ID: 'strip' }, isStarted: () => true, toast() {}, win, doc, ...over });
};
{
  const mk = mkGates;
  const head = (ok) => async () => ({ ok, status: ok ? 200 : 404 });
  const fresh = { revision: 'r1', area: 'strip' };
  const cases = [
    ['a reachable page and a fresh manifest pass', { fetchImpl: head(true), peekManifest: async () => fresh, bakedRevision: 'r1' }, { ok: true }],
    ['a missing page fails as "page"', { fetchImpl: head(false), peekManifest: async () => fresh, bakedRevision: 'r1' }, { ok: false, why: 'page' }],
    ['an unreadable manifest fails as "manifest"', { fetchImpl: head(true), peekManifest: async () => null, bakedRevision: 'r1' }, { ok: false, why: 'manifest' }],
    ['a manifest of another area fails as "area"', { fetchImpl: head(true), peekManifest: async () => ({ revision: 'r1', area: 'north' }), bakedRevision: 'r1' }, { ok: false, why: 'area' }],
    ['a stale manifest fails as "stale"', { fetchImpl: head(true), peekManifest: async () => ({ revision: 'old', area: 'strip' }), bakedRevision: 'r1' }, { ok: false, why: 'stale' }],
    ['a network error fails as "offline"', { fetchImpl: async () => { throw new TypeError('Failed to fetch'); }, peekManifest: async () => fresh, bakedRevision: 'r1' }, { ok: false, why: 'offline' }],
  ];
  for (const [name, deps, want] of cases) {
    const g = mk(deps); const got = await g.preflight('strip');
    check('preflight: ' + name, () => { assert.equal(got.ok, want.ok); if (want.why) assert.equal(got.why, want.why); });
  }
  { const g = mk({}); const got = await g.preflight('nowhere'); check('preflight: an unknown area is refused (no throw)', () => assert.equal(got.ok, false)); }
  { const g = mk({ fetchImpl: head(false) }, new URLSearchParams('devgates=1&baked=0')); const got = await g.preflight('strip'); check('preflight: development flags (baked=0) skip the manifest check', () => assert(got.ok && got.dev)); }
  check('the registry has the area the dev gate leads to', () => assert(REGISTRY.strip));
}

// ---------------------------------------------------------------------------------------------- M7: indoors, the metro door g3, the places of the other area
const G2 = GATES.find((g) => g.id === 'g2'), G3 = GATES.find((g) => g.id === 'g3'), G1 = GATES.find((g) => g.id === 'g1');
const stripA = await import(pathToFileURL(path.join(root, 'src/world/area.js')).href);
console.log('indoors (M7, docs/AREAS.md 8.7: the Podpisnye Izdaniya bookstore of the North lies inside the prompt zone of g2):');
// the bookstore's interior (w96123542, docs/AREAS.md 8.7: z -249 .. -206; its facade stands on Liteyny at x -201, the shop extends west of it, its middle is (-204.9, -227.8)): an approximate rectangle stands in for the zone
// test of core/zones.js (the real zone is proven by tools/cross-places-test.mjs under the North); the gate g2 is the real row: border z = -205, inward (0, -1), zone 30 m
const inShop = (x, z) => x > -214 && x < -201.5 && z > -249 && z < -206;
/** stand 2 s at (x, z0), then walk to (x, z1) at `speed` (toward the border of g2 when z1 > z0: the strip lies south, z = -205); `indoors(x, z)` feeds the machine's indoors flag */
const walkToBorder = (m, x, z0, z1, { indoors = () => false, speed = 1.5 } = {}) => {
  const out = []; const n = Math.ceil(Math.abs(z1 - z0) / speed / DT); let z = z0;
  for (let i = 0; i < 2 / DT; i++) m.update({ dt: DT, x, z, mode: 'walk', blocked: false, indoors: indoors(x, z) });
  for (let i = 0; i <= n; i++) { z = z0 + (z1 - z0) * Math.min(1, i / n); const r = m.update({ dt: DT, x, z, mode: 'walk', blocked: false, indoors: indoors(x, z) }); out.push({ z, chip: !!r.chip, offer: r.offer }); }
  return out;
};
check('g2 is a border gate and g3 a door; the machine runs border gates only', () => { assert(G2 && !isDoor(G2)); assert(G3 && isDoor(G3)); assert(G1 && !isDoor(G1)); });
check('a walker inside the bookstore at (-206, -230) walking toward the border gets no chip and no offer; on the street at the same depth (-175, -230) he does', () => {
  const inside = walkToBorder(fresh([G2]), -206, -245, -210, { indoors: inShop });
  assert(!firstChip(inside) && !firstOffer(inside), 'offered inside the shop');
  assert(inShop(-206, -230) && !inShop(-175, -230), 'the fixture itself');
  const street = walkToBorder(fresh([G2]), -175, -245, -210, { indoors: inShop });
  assert(firstChip(street), 'no chip on the street'); const o = firstOffer(street); assert(o, 'no offer on the street'); assert(o.z <= -210 && o.z >= -235, 'offered at z ' + o.z);
});
check('stepping out of the shop re-arms the gate: the walk continues on the street and is offered', () => {
  const m = fresh([G2]);
  const inside = walkToBorder(m, -206, -245, -210, { indoors: inShop }); assert(!firstOffer(inside));
  for (let i = 0; i < 1 / DT; i++) m.update({ dt: DT, x: -206 + i * DT * 20, z: -222, mode: 'walk', blocked: false, indoors: inShop(-206 + i * DT * 20, -222) });      // out through the door, eastward
  const street = walkToBorder(m, -190, -222, -208, { indoors: inShop, speed: 1.5 }); assert(firstOffer(street), 'not offered after stepping out');
});
check('indoors does not touch the decline state: a decline inside the zone, then leaving the zone indoors still counts as leaving', () => {
  const m = fresh([G2]); const o = firstOffer(walkToBorder(m, -175, -245, -210)); m.markOpen(o.offer); m.decline(o.offer);
  for (let i = 0; i < 50 / DT; i++) m.update({ dt: DT, x: -175, z: -270, mode: 'walk', blocked: false, indoors: true });      // 65 m from the border (beyond zone + margin), 50 s, "indoors"
  assert(firstOffer(walkToBorder(m, -175, -270, -210)), 'not re-armed');
});
check('the DOM layer: ctx.indoor.zone (core/zones.js) silences the chip and the question; the strip never has it (no zone: isIndoors() is false)', () => {
  const ctx = { onUpdate() {}, drive: null, indoor: { amount: 1, zone: { id: 'podpisnye-shop' } } };
  const player = { inputLock: 0, riding: false, fly: false, pos: { x: -175, z: -210 }, yaw: 0, pitch: 0, isUnderground: () => false };
  const api = mkGates({ ctx, player, A: { ID: 'north' } }, new URLSearchParams(''));
  assert(api && api.gates.map((g) => g.id).join() === 'g2' && api.doors.map((g) => g.id).join() === 'g3', 'the North has g2 and the door g3');
  assert.equal(api.isIndoors(), true);
  for (let i = 0; i < 8 / DT; i++) api.tick(DT);      // 5 m from the border, standing: an offer after the 6 s grace, were he outdoors
  assert.equal(api.chipGate, null); assert.equal(player.inputLock, 0);
  ctx.indoor.zone = null;
  let asked = 0; const api2 = mkGates({ ctx, player, A: { ID: 'north' }, ui: { open: false, confirm() { asked++; } } }, new URLSearchParams(''));
  for (let i = 0; i < 8 / DT; i++) api2.tick(DT);
  assert.equal(asked, 1, 'outdoors at 5 m the question is asked once');
  assert.equal(mkGates({}).isIndoors(), false, 'a ctx without indoor state is outdoors');
});
check('the strip page is unchanged: g1 and the dev gate g0, no door, the default isIndoors is false, the machine knows no door', () => {
  const api = mkGates({}); assert.deepEqual(api.gates.map((g) => g.id), ['g1', 'g0']); assert.deepEqual(api.doors, []); assert.equal(api.isIndoors(), false);
  assert.equal(api.machine.state(G3), null); api.machine.markOpen(G3); api.machine.decline(G3); api.machine.cooldown(G3);      // (no throw: a door is not the machine's)
});

console.log('the metro door g3 (M7, plan 3.3: north -> strip, an interact item at the Chernyshevskaya vestibule):');
check('the registry row: at the vestibule (461.05, -1350.15), r 4, the pose of the strip VIEWS AltDigit1, via door, no reverse', () => {
  assert.equal(G3.from, 'north'); assert.equal(G3.to, 'strip'); assert.deepEqual(G3.at, { x: 461.05, z: -1350.15 }); assert.equal(G3.r, 4); assert.equal(G3.reverse, null);
  assert.deepEqual(G3.pose, { x: 534, z: 125, yaw: 28.61, pitch: 10 }); assert.equal(G3.view, 'AltDigit1');
});
check('the prompt texts of the door name the metro and the page load; a border gate keeps the area texts', () => {
  const T = promptTexts('strip', { gate: G3 }); assert(/Чернышевская/.test(T.title) && /Восстания/.test(T.title), T.title); assert(/25–40/.test(T.scene) && /перезагруз/.test(T.scene), T.scene); assert(/Пешком/.test(T.fine));
  const U = promptTexts('strip', { gate: G2 }); assert(/Новая область/.test(U.title)); assert.equal(U.scene, promptTexts('strip').scene);
});
check('a PLACE asked through the door keeps the area title / scene (no metro ride, no rotunda), names the place and keeps the door\'s walk-out line', () => {
  const place = { key: 'p', label: 'Площадь Восстания', labelEn: 'Vosstaniya Square' }, T = promptTexts('strip', { gate: G3, place }), A = promptTexts('strip');
  assert.equal(T.title, A.title); assert.equal(T.scene, A.scene); assert(/Сразу к месту: Площадь Восстания · Straight to Vosstaniya Square/.test(T.sights), T.sights); assert.equal(T.fine, G3.prompt.fine);
  assert(/Чернышевская/.test(promptTexts('strip', { gate: G3 }).title), 'the door itself still names the metro');
});
{
  const items = [], interact = { add(d) { items.push(d); return d; } };
  const ctx = { onUpdate() {}, drive: null, interact };
  const player = { inputLock: 0, riding: false, fly: false, pos: { x: 458, z: -1350 }, yaw: -Math.PI / 2, pitch: 0, isUnderground: () => false };
  const api = mkGates({ ctx, player, A: { ID: 'north' } }, new URLSearchParams('devgates=1&baked=0'));
  check('createGates registers ONE interact item for the door: id gate-g3 at the door point, radius 4, Russian and English labels, enabled while the game runs', () => {
    assert.equal(items.length, 1); const it = items[0];
    assert.equal(it.id, 'gate-g3'); assert.equal(it.x, 461.05); assert.equal(it.z, -1350.15); assert.equal(it.radius, 4); assert(/Метро/.test(it.label) && /Metro/.test(it.labelEn)); assert.equal(it.enabled(), true);
  });
  const ui = fakeUi(); const api2 = mkGates({ ctx: { onUpdate() {}, drive: null, interact: { add(d) { ctx.door = d; } } }, player, ui, A: { ID: 'north' } }, new URLSearchParams('devgates=1&baked=0'));
  check('E at the door: ui.confirm with the metro title; "Not now" leaves g2 untouched (no decline booked)', () => {
    ctx.door.onUse(); assert.equal(ui.asked.length, 1); assert(/Чернышевская/.test(ui.asked[0].title), ui.asked[0].title); assert.equal(ui.asked[0].yes, 'Загрузить · Load');
    ui.asked[0].onNo(); assert.deepEqual(api2.machine.state(G2), { until: -1e9, needExit: false, open: false });
  });
  let url = null; api2.navigate = (u) => { url = u; };
  const went = await api2.go(G3, 'door');
  check('accepting hands off to index.html at the AltDigit1 pose ON FOOT: cam = 534,125,28.61,10, no fly, ho { via door, gate g3, car null, ret = the vestibule pose }', () => {
    assert.equal(went, true); assert(url, 'no navigation'); const [page, qs] = url.split('?'); assert.equal(page, 'strip.html');
    const q = new URLSearchParams(qs); assert.equal(q.get('cam'), '534,125,28.61,10'); assert(!q.has('fly'));
    const ho = decodeHo(q.get('ho'), { to: 'strip' }); assert(ho.ok, ho.why); assert.equal(ho.ho.via, 'door'); assert.equal(ho.ho.gate, 'g3'); assert.equal(ho.ho.car, null); assert.equal(ho.ho.from, 'north');
    assert.deepEqual(ho.ho.ret, { x: 458, z: -1350, yaw: -90, pitch: 0 });
  });
  // a driver at the door: the car stays behind (no car in the hand-off, the pose is the door's, not the car's)
  const drive = { active: true, car: { x: 470, z: -1370, yaw: 0 }, vehicle: { id: 'lada' }, view: { mode: 0 }, damage: { state: { front: 0, rear: 0, left: 0, right: 0 } } };
  let url2 = null; const api3 = mkGates({ ctx: { onUpdate() {}, drive, interact: { add() {} } }, player, A: { ID: 'north' } }, new URLSearchParams('devgates=1&baked=0')); api3.navigate = (u) => { url2 = u; };
  await api3.go(G3, 'door');
  check('a driver who uses the door walks: the hand-off carries no car and the door pose, the return pose is the car\'s', () => {
    const q = new URLSearchParams(url2.split('?')[1]); assert.equal(q.get('cam'), '534,125,28.61,10'); const ho = decodeHo(q.get('ho'), { to: 'strip' }).ho; assert.equal(ho.car, null); assert.equal(ho.ret.x, 470);
  });
  const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);
  check('the strip page entered through g3 offers the way back to the North AT THE DOOR: backLink(ho) is north.html?cam=<where he stood> (within the use radius of the door point), the quality tier kept', () => {
    const ho = decodeHo(new URLSearchParams(url.split('?')[1]).get('ho'), { to: 'strip' }).ho, b = backLink(ho, { qName: 'performance', base: 'http://h/index.html' });
    assert(b, 'no link'); const u = new URL(b.url); assert.equal(u.pathname, '/north.html'); assert.equal(u.searchParams.get('q'), 'performance');
    const [x, z, yaw, pitch] = u.searchParams.get('cam').split(',').map(Number); assert.deepEqual([x, z, yaw, pitch], [458, -1350, -90, 0]);
    assert(Math.hypot(x - G3.at.x, z - G3.at.z) <= G3.r, 'the return pose is not within the door radius'); assert(/Север/.test(b.text) && /North/.test(b.text), b.text);
    assert.equal(parseCamParam(u.searchParams.get('cam')).x, 458, 'the URL parses back with the page\'s own ?cam= reader');
  });
  check('planArrival on the strip accepts ho=g3 and places the player at that pose on foot (direct, no rectangle, no car even if a forged ho carries one)', () => {
    const q = new URLSearchParams(url.split('?')[1]);
    const h = planArrival({ L, A: { ID: 'strip' }, params: q }); assert(h && !h.invalid, JSON.stringify(h)); assert.equal(h.mode, 'walk'); assert.equal(h.how, 'direct'); assert.equal(h.gate.id, 'g3');
    assert.deepEqual(h.pose, { x: 534, y: null, z: 125, yaw: 28.61, pitch: 10 });
    const forged = makeHo({ from: 'north', to: 'strip', via: 'door', gate: 'g3', car: { id: 'lada', view: 0, d: [0, 0, 0, 0] } });
    const q2 = new URLSearchParams({ cam: camParam(G3.pose, false), fly: '1', ho: encodeHo(forged) });
    const h2 = planArrival({ L, A: { ID: 'strip' }, params: q2 }); assert.equal(h2.mode, 'walk'); assert.equal(h2.fly, false); assert.equal(h2.pose.y, null); assert.equal(h2.how, 'direct');
  });
  check('a border gate still clamps into its rectangle: g2 with the same ho fields but gate g2 and the strip pose (-1985, -715) lands in the rectangle z -300 .. -230', () => {
    const ho = makeHo({ from: 'north', to: 'strip', via: 'gate', gate: 'g2' });
    const h = planArrival({ L, A: { ID: 'strip' }, params: new URLSearchParams({ cam: '-1985,-715,31.52,6', ho: encodeHo(ho) }) });
    assert(h.pose.z >= -300 && h.pose.z <= -230 && h.pose.x >= -225, JSON.stringify(h.pose));
  });
  check('planArrival via place skips the rectangle: the same pose with via place lands at the place itself; with a car the pose is still the walker\'s (Palace Square has no lane) and the mode is car', () => {
    const ho = makeHo({ from: 'north', to: 'strip', via: 'place', gate: 'g2' });
    const h = planArrival({ L, A: { ID: 'strip' }, params: new URLSearchParams({ cam: '-1985,-715,31.52,6', ho: encodeHo(ho) }) });
    assert.equal(h.how, 'direct'); assert.deepEqual([h.pose.x, h.pose.z, h.pose.yaw], [-1985, -715, 31.52]); assert.equal(h.mode, 'walk');
    const hc = makeHo({ from: 'north', to: 'strip', via: 'place', gate: 'g2', car: { id: 'coupe', view: 0, d: [0, 0, 0, 0] } });
    const h2 = planArrival({ L, A: { ID: 'strip' }, params: new URLSearchParams({ cam: '-1985,-715,31.52,6', ho: encodeHo(hc) }) });
    assert.equal(h2.how, 'direct'); assert.equal(h2.mode, 'car'); assert.deepEqual([h2.pose.x, h2.pose.z], [-1985, -715]);
    const hg = planArrival({ L, A: { ID: 'strip' }, params: new URLSearchParams({ cam: '-1985,-715,31.52,6', ho: encodeHo({ ...hc, via: 'gate' }) }) });
    assert.notEqual(hg.pose.z, -715, 'a border crossing with a car still goes through the rectangle and a lane');
  });
}

console.log('the places of the other area (M7, plan 3.5: CROSS_PLACES -> an optgroup of the HUD list -> the gate question via place):');
check('crossPlaces keeps only rows whose gate leaves this area and leads to the row\'s area; an empty or missing table gives nothing', () => {
  const rows = [{ key: 'a', area: 'north', gate: 'g1' }, { key: 'b', area: 'north', gate: 'g2' }, { key: 'c', area: 'strip', gate: 'g1' }, { key: 'd', area: 'north', gate: 'nope' }, null, { area: 'north', gate: 'g1' }];
  assert.deepEqual(crossPlaces(rows, 'strip').map((p) => p.key), ['a']); assert.deepEqual(crossPlaces(rows, 'north'), []); assert.deepEqual(crossPlaces(undefined, 'strip'), []); assert.deepEqual(crossPlaces([], 'strip'), []);
});
check('the strip\'s table lists 4-6 places of the North through g1, every row with key, Russian label, view, x, z, yaw, pitch; the North\'s lists 4-6 places of the strip through g2', () => {
  const t = stripA.CROSS_PLACES; assert(t.length >= 4 && t.length <= 6, String(t.length));
  for (const p of t) { assert.equal(p.area, 'north'); assert.equal(p.gate, 'g1'); assert(/[А-Яа-я]/.test(p.label), p.key); for (const k of ['x', 'z', 'yaw', 'pitch']) assert(Number.isFinite(p[k]), `${p.key}.${k}`); assert(typeof p.view === 'string'); }
  assert.equal(new Set(t.map((p) => p.key)).size, t.length);
  assert.equal(crossPlaces(t, 'strip').length, t.length, 'every strip row travels through a gate the strip has');
});
{
  const ui = fakeUi(); const player = { inputLock: 0, riding: false, fly: false, pos: { x: 560, z: 192 }, yaw: 0.5, pitch: 0.1, isUnderground: () => false };
  const api = mkGates({ ui, player, A: stripA }, new URLSearchParams('devgates=1&baked=0'));
  const smolny = stripA.CROSS_PLACES.find((p) => p.key === 'smolny-cathedral');
  check('createGates lists the strip\'s places; the gates and doors are as before (g1, g0; none)', () => { assert.equal(api.places.length, stripA.CROSS_PLACES.length); assert.deepEqual(api.gates.map((g) => g.id), ['g1', 'g0']); assert.deepEqual(api.doors, []); });
  check('offerPlace(key) asks the area question with the place in the sights line; "Not now" books nothing on g1; an unknown key asks nothing', () => {
    assert.equal(api.offerPlace('smolny-cathedral'), true); assert.equal(ui.asked.length, 1); assert(/Новая область: Север/.test(ui.asked[0].title));
    ui.asked[0].onNo(); assert.deepEqual(api.machine.state(G1), { until: -1e9, needExit: false, open: false });
    assert.equal(api.offerPlace('nowhere'), false); assert.equal(ui.asked.length, 1);
    assert(/Смольный собор/.test(promptTexts('north', { place: smolny }).sights));
  });
  let url = null; api.navigate = (u) => { url = u; };
  await api.go(G1, 'place', smolny);
  check('accepting lands at the place: north.html?cam=<the place pose>, ho { via place, gate g1 }, the return pose where the player stood', () => {
    const [page, qs] = url.split('?'); assert.equal(page, 'north.html'); const q = new URLSearchParams(qs); assert.equal(q.get('cam'), '2335,-1833,-90,21'); assert(!q.has('fly'));
    const ho = decodeHo(q.get('ho'), { to: 'north' }).ho; assert.equal(ho.via, 'place'); assert.equal(ho.gate, 'g1'); assert.equal(ho.car, null); assert.deepEqual([ho.ret.x, ho.ret.z], [560, 192]);
  });
  player.fly = true; const camera = { position: { x: 560, y: 80, z: 192 } }; let url2 = null;
  const apiF = mkGates({ ui: fakeUi(), player, camera, A: stripA }, new URLSearchParams('devgates=1&baked=0')); apiF.navigate = (u) => { url2 = u; }; await apiF.go(G1, 'place', smolny);
  check('a flyer who picks a place arrives standing at it (no fly, a 4-number cam)', () => { const q = new URLSearchParams(url2.split('?')[1]); assert(!q.has('fly')); assert.equal(q.get('cam'), '2335,-1833,-90,21'); });
  player.fly = false; const drive = { active: true, car: { x: 579, z: 219, yaw: 1 }, vehicle: { id: 'coupe' }, view: { mode: 1 }, damage: { state: { front: 0, rear: 0, left: 0, right: 0 } } }; let url3 = null;
  const apiD = mkGates({ ui: fakeUi(), player, ctx: { onUpdate() {}, drive }, A: stripA }, new URLSearchParams('devgates=1&baked=0')); apiD.navigate = (u) => { url3 = u; }; await apiD.go(G1, 'place', smolny);
  check('a driver who picks a place takes the car along to the place (the arrival resolves the viewpoint as a walker\'s, drive.arrive parks the car beside it: tools/cross-places-test.mjs)', () => { const q = new URLSearchParams(url3.split('?')[1]); assert.equal(q.get('cam'), '2335,-1833,-90,21'); const ho = decodeHo(q.get('ho'), { to: 'north' }).ho; assert.equal(ho.car.id, 'coupe'); assert.equal(ho.ret.x, 579); });
  let url4 = null; const apiG = mkGates({ ui: fakeUi(), player, ctx: { onUpdate() {}, drive }, A: stripA }, new URLSearchParams('devgates=1&baked=0')); apiG.navigate = (u) => { url4 = u; }; await apiG.go(G1, 'gate');
  check('a border crossing (via gate) is unchanged: cam = the car\'s own pose, the car along', () => { const q = new URLSearchParams(url4.split('?')[1]); assert.equal(q.get('cam').split(',')[0], '579'); assert.equal(decodeHo(q.get('ho'), { to: 'north' }).ho.via, 'gate'); });
}

// review fix: the per-frame update() of the machine no longer allocates (it runs every frame on the strip too). The old implementation is kept here as the oracle: same chips and offers, step for step, over a long random drive of the three modes
{
  const legacy = ({ gates, config = {} }) => {
    const C = { ...DEFAULTS, ...config }; const st = new Map(gates.map((g) => [g.id, { until: -1e9, needExit: false, open: false }]));
    let clock = 0, lastX = null, lastZ = null, vx = 0, vz = 0, holdUntil = 0, graceUntil = C.graceS;
    return { st, update(inp) {
      const { dt, x, z, mode } = inp, blocked = inp.blocked || !!inp.indoors; clock += dt;
      if (lastX === null) { lastX = x; lastZ = z; } else if (dt > 0) { const dx = x - lastX, dz = z - lastZ;
        if (inp.teleported || Math.hypot(dx, dz) > 40 + 80 * dt) { vx = vz = 0; holdUntil = clock + C.holdS; } else { const k = Math.min(1, dt / C.emaS); vx += (dx / dt - vx) * k; vz += (dz / dt - vz) * k; } lastX = x; lastZ = z; }
      const held = clock < holdUntil, v = held ? 0 : Math.hypot(vx, vz); let chip = null, offer = null;
      for (const g of gates) { const s = st.get(g.id), c = gateCoords(g, x, z);
        const depth = depthFor(mode, v, { ...C, depthWalk: g.zone || C.depthWalk }), chipD = chipFor(mode, v, { ...C, depthWalk: g.zone || C.depthWalk, chipWalk: Math.max(C.chipWalk, (g.zone || C.depthWalk) * 3) });
        const tol = mode === 'fly' ? C.flyTol : C.lateralTol, lateral = c.s >= -tol && c.s <= c.len + tol;
        if (!lateral || c.d > depth + C.exitMargin) s.needExit = false;
        if (blocked || !lateral || c.d < -C.behind || c.d > chipD) continue;
        if (!chip || c.d < chip.d) chip = { gate: g, d: c.d, depth };
        if (s.open || clock < graceUntil) continue;
        const vIn = held ? 0 : vx * g.inward[0] + vz * g.inward[1];
        if (c.d <= depth && (vIn <= -C.approachV || c.d <= C.nearD) && clock >= s.until && !s.needExit && !offer) offer = g; }
      return { chip, offer, v }; },
      decline(g) { const s = st.get(g.id); s.open = false; s.until = clock + C.cooldownS; s.needExit = true; } };
  };
  check('the machine (allocation-free update) answers exactly like the previous implementation over 60,000 random steps (walk / fly / car, declines, jumps)', () => {
    const gs = GATES.filter((g) => g.from === 'strip' && g.seg && g.inward), gz = gs.map((g, i) => (i % 2 ? { ...g, zone: 55 } : g));
    assert.ok(gz.length >= 2, 'border gates: ' + gz.length);
    const a = createGateMachine({ gates: gz }), b = legacy({ gates: gz });
    let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const mid = gz[0].seg[0]; let x = mid[0] + 20, z = mid[1] + 20, offers = 0, chips = 0;
    for (let i = 0; i < 60000; i++) {
      const mode = ['walk', 'fly', 'car'][Math.floor(i / 2000) % 3], sp = mode === 'walk' ? 6 : mode === 'fly' ? 40 : 30, dt = 1 / 60;
      const jump = rnd() < 0.0005; if (jump) { const g = gz[Math.floor(rnd() * gz.length)]; x = g.seg[0][0] + g.inward[0] * (rnd() * 120 - 20); z = g.seg[0][1] + g.inward[1] * (rnd() * 120 - 20); }
      else { const ang = (i % 600 < 300 ? 0 : Math.PI) + (rnd() - 0.5) * 2.4 + Math.floor(i / 300); x += Math.cos(ang) * sp * dt; z += Math.sin(ang) * sp * dt; }
      const inp = { dt, x, z, mode, blocked: i % 5000 > 4800, indoors: false, teleported: jump };
      const ra = a.update(inp), rb = b.update(inp);
      assert.equal(ra.offer && ra.offer.id, rb.offer && rb.offer.id, 'offer at step ' + i); assert.equal(ra.chip && ra.chip.gate.id, rb.chip && rb.chip.gate.id, 'chip at step ' + i);
      if (ra.chip) { assert.equal(ra.chip.d, rb.chip.d); assert.ok(Math.abs(ra.chip.depth - rb.chip.depth) < 1e-9); chips++; }
      assert.ok(Math.abs(ra.v - rb.v) < 1e-9, 'speed at step ' + i);
      if (ra.offer) { offers++; a.decline(ra.offer); b.decline(rb.offer); }
    }
    assert.ok(offers >= 5 && chips >= 200, offers + ' offers, ' + chips + ' chips: the drive must exercise the machine');
  });
  check('createGateMachine update() has no object spread and no Math.hypot (the allocation of the old loop)', () => {
    const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/core/gates.js'), 'utf8'), i = src.indexOf('update(inp) {'), j = src.indexOf('markOpen(g)', i), body = src.slice(i, j);
    assert.ok(i > 0 && j > i); assert.ok(!/\{\s*\.\.\./.test(body) && !/Math\.hypot/.test(body) && !/gateCoords\(/.test(body), 'a spread, Math.hypot or gateCoords is back in the per-frame loop');
  });
}


// ---------------------------------------------------------------------------------------------- the seamless hand-off: territory (edge) gates, no question, the freeze veil
console.log('inUnion (the territory test, the semantics of layout.js _inUnion):');
check('one rectangle: inside, outside, and the margin counts from the boundary (a margin of 60 at 59 m inside is false, at 61 m true; a negative margin also takes the outside band)', () => {
  const R = [{ x0: 0, x1: 100, z0: 0, z1: 200 }];
  assert(inUnion(R, 50, 50) && !inUnion(R, 150, 50) && inUnion(R, 0, 0));
  assert.equal(inUnion(R, 50, 100, 40), true); assert.equal(inUnion(R, 50, 100, 51), false); assert.equal(inUnion(R, 59, 100, 60), false); assert.equal(inUnion(R, 40, 100, 40), true);
  assert.equal(inUnion(R, 110, 100, -15), true); assert.equal(inUnion(R, 130, 100, -15), false); assert.equal(inUnion([], 1, 1), false); assert.equal(inUnion(undefined, 1, 1, 5), false);
});
check('an L-shaped union: a shared edge of two rectangles is interior (no margin from it), the outer boundary counts', () => {
  const U = [{ x0: 0, x1: 100, z0: 0, z1: 100 }, { x0: 100, x1: 300, z0: 0, z1: 50 }];
  assert.equal(inUnion(U, 100, 25, 20), true, 'on the seam, 25 m from the nearest outer edge'); assert.equal(inUnion(U, 100, 25, 26), false); assert.equal(inUnion(U, 120, 75, 1), false, 'the notch');
  assert.equal(inUnion(U, 90, 75, 10), true); assert.equal(inUnion(U, 95, 95, 10), false);
});
{
  const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);
  check('inUnion(REGISTRY.strip.play) == layout.inPlay over 3,000 random points and the margins 0 / 25 / 60 / -30', () => {
    let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); let inside = 0;
    for (let i = 0; i < 3000; i++) { const x = -3000 + rnd() * 4000, z = -1500 + rnd() * 3000, m = [0, 25, 60, -30][i % 4], a = inUnion(REGISTRY.strip.play, x, z, m), b = L.inPlay(x, z, m); assert.equal(a, b, `${x},${z},${m}`); if (a) inside++; }
    assert(inside > 300 && inside < 2700, 'the sample must hit both sides: ' + inside);
  });
}

console.log('edge gates (kind "edge": territories that overlap, a probe point ahead of the player):');
// A = a square 0..1000, B = 800..2000 east of it (a 200 m overlap), C = 0..1000 x 800..2000 south of A; the player is in A
const TERR = { A: [{ x0: 0, x1: 1000, z0: 0, z1: 1000 }], B: [{ x0: 800, x1: 2000, z0: 0, z1: 1000 }], C: [{ x0: 0, x1: 1000, z0: 800, z1: 2000 }] };
const EAB = { id: 'e1', kind: 'edge', from: 'A', to: 'B', reverse: 'e2' }, EAC = { id: 'e2', kind: 'edge', from: 'A', to: 'C', zone: 40, reverse: null };
const rectsOf = (id) => TERR[id];
const edgeM = (gates = [EAB], cfg = {}) => createGateMachine({ gates, config: { graceS: 0, ...cfg }, rectsOf });
/** walk (x0, z0) -> (x1, z1) at `speed` in `mode`, after standing still for `settle` s; returns the first step that offers: { x, z, offer, dir } or null */
function walkTo(m, x0, z0, x1, z1, { speed = 1.5, mode = 'walk', settle = 2, blocked = false } = {}) {
  for (let i = 0; i < settle / DT; i++) m.update({ dt: DT, x: x0, z: z0, mode, blocked });
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / speed / DT));
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n, r = m.update({ dt: DT, x, z, mode, blocked }); if (r.offer) return { x, z, offer: r.offer, dir: r.dir }; }
  return null;
}
check('a walker heading for the edge triggers when the probe 40 m ahead leaves FROM (x 960) and lands in TO; the probe direction is east (EDGE_DIRS 2)', () => {
  const o = walkTo(edgeM(), 900, 500, 1000, 500); assert(o, 'no trigger'); assert.equal(o.offer.id, 'e1'); assert.equal(o.dir, 2); assert(o.x >= 959 && o.x <= 962, 'at x ' + o.x);
});
check('the probe point must be INSIDE TO by 60 m: near the corner of TO (z 30: the probe is 30 m from TO\'s north edge) nothing happens, 70 m from it the gate triggers; the destination\'s own rim is never the arrival', () => {
  assert.equal(walkTo(edgeM(), 900, 30, 1000, 30), null); assert(walkTo(edgeM(), 900, 70, 1000, 70));
  const rim = walkTo(edgeM(), 900, 950, 1000, 950); assert(!rim || rim.x >= 990, 'z 950 (50 m from TO\'s south rim): the east probe never qualifies, only the near-edge diagonal does, at the very edge: x ' + (rim && rim.x));
  const ok = walkTo(edgeM(), 900, 930, 1000, 930); assert(ok && ok.x < 962, 'z 930: 70 m from the rim, the east probe qualifies at x 960');
});
check('a probe point outside TO as well (a territory edge with nothing beyond it: the north side of A) triggers nothing', () => assert.equal(walkTo(edgeM(), 500, 100, 500, -50), null));
check('standing still 30 m from the edge asks nothing; standing within 8 m of it triggers (nearD)', () => {
  assert.equal(walkTo(edgeM(), 970, 500, 970.01, 500, { speed: 0.01, settle: 5 }), null); assert(walkTo(edgeM(), 995, 500, 995.01, 500, { speed: 0.01, settle: 1 }));
});
check('walking AWAY from the edge inside the zone, or ALONG it (x 975, 25 m from the edge, heading north), triggers nothing; heading diagonally toward it does', () => {
  assert.equal(walkTo(edgeM(), 980, 500, 900, 500), null); assert.equal(walkTo(edgeM(), 975, 600, 975, 300), null, 'along the edge');
  const d = walkTo(edgeM(), 940, 500, 1000, 440); assert(d && d.dir === 1, 'NE: ' + JSON.stringify(d));
});
check('a player outside FROM\'s territory (he is in TO already) is never offered the gate, and the cooldown / decline state clears there', () => {
  const m = edgeM(); assert.equal(walkTo(m, 1100, 500, 1200, 500), null); m.cooldown(EAB); assert.equal(m.state(EAB).needExit, false);
});
check('blocked (panel open, travelling, not started, indoors) never triggers; no trigger in the first graceS seconds', () => {
  assert.equal(walkTo(edgeM(), 900, 500, 1000, 500, { blocked: true }), null);
  const m = createGateMachine({ gates: [EAB], config: { graceS: 6 }, rectsOf }); let asked = false; for (let i = 0; i < 5 / DT; i++) if (m.update({ dt: DT, x: 995, z: 500, mode: 'walk', blocked: false }).offer) asked = true; assert(!asked);
  const m2 = edgeM(); let a2 = false; for (let i = 0; i < 3 / DT; i++) if (m2.update({ dt: DT, x: 995, z: 500, mode: 'walk', blocked: false, indoors: true }).offer) a2 = true; assert(!a2, 'indoors');
});
check('cooldown(g) (a failed preflight): no trigger for 30 s, then it triggers again without having to leave; markOpen(g) holds it while the travel runs', () => {
  const m = edgeM(); const o = walkTo(m, 900, 500, 1000, 500); m.markOpen(o.offer); m.cooldown(o.offer);
  let asked = false; for (let i = 0; i < 25 / DT; i++) if (m.update({ dt: DT, x: 995, z: 500, mode: 'walk', blocked: false }).offer) asked = true; assert(!asked, 'inside the cooldown');
  for (let i = 0; i < 10 / DT; i++) if (m.update({ dt: DT, x: 995, z: 500, mode: 'walk', blocked: false }).offer) asked = true; assert(asked, 'after it');
  const m2 = edgeM(); const o2 = walkTo(m2, 900, 500, 1000, 500); m2.markOpen(o2.offer); let again = false; for (let i = 0; i < 20 / DT; i++) if (m2.update({ dt: DT, x: 995, z: 500, mode: 'walk', blocked: false }).offer) again = true; assert(!again, 'open: no second trigger');
});
check('decline (the gateprompt question): not again for 45 s AND until the player has left the zone by 20 m (x < 940 for the walker), then it re-arms', () => {
  const m = edgeM(); const o = walkTo(m, 900, 500, 1000, 500); m.markOpen(o.offer); m.decline(o.offer);
  let asked = false; for (let i = 0; i < 60 / DT; i++) if (m.update({ dt: DT, x: 990, z: 500, mode: 'walk', blocked: false }).offer) asked = true; assert(!asked, 'still in the zone');
  for (let i = 0; i < 3 / DT; i++) m.update({ dt: DT, x: 850, z: 500, mode: 'walk', blocked: false });      // 150 m from the edge
  const back = walkTo(m, 850, 500, 1000, 500, { settle: 0 }); assert(back && back.offer.id === 'e1', 'not re-armed');
});
check('a car\'s zone is deeper: at 30 m/s the probe is depthFor(car, v) = 60 m ahead, so it triggers earlier than the walker (x ~940; at 8 m/s the 40 m minimum applies: x ~960); a flyer uses the vehicle depth too', () => {
  const car = walkTo(edgeM(), 600, 500, 1000, 500, { speed: 30, mode: 'car' }); assert(car, 'no car trigger'); assert(car.x >= 935 && car.x <= 945, 'car x ' + car.x);
  const slow = walkTo(edgeM(), 800, 500, 1000, 500, { speed: 8, mode: 'car' }); assert(slow && slow.x >= 958 && slow.x <= 962, 'slow car x ' + (slow && slow.x));
  const fly = walkTo(edgeM(), 600, 500, 1000, 500, { speed: 60, mode: 'fly' }); assert(fly && fly.x < car.x, 'a flyer at 60 m/s probes 100 m: x ' + (fly && fly.x));
});
check('several edge gates leave one area (one per neighbour): the east edge offers B, the south edge offers C, the first match wins at the corner; the machine keeps a state per gate', () => {
  const m = edgeM([EAB, EAC]); const e = walkTo(m, 900, 500, 1000, 500); assert.equal(e.offer.id, 'e1');
  const m2 = edgeM([EAB, EAC]); const s = walkTo(m2, 500, 900, 500, 1000); assert.equal(s.offer.id, 'e2'); assert.equal(s.dir, 4);
  const BIG = { A: TERR.A, B: [{ x0: 800, x1: 2000, z0: 0, z1: 2000 }], C: [{ x0: 0, x1: 2000, z0: 800, z1: 2000 }] };      // the corner (996, 996) leads into both
  const at = (gates) => { const mm = createGateMachine({ gates, config: { graceS: 0 }, rectsOf: (id) => BIG[id] }); for (let i = 0; i < 40; i++) { const r = mm.update({ dt: DT, x: 996, z: 996, mode: 'walk', blocked: false }); if (r.offer) return r.offer.id; } return null; };
  assert.equal(at([EAB, EAC]), 'e1'); assert.equal(at([EAC, EAB]), 'e2');
  m.markOpen(EAB); assert.equal(m.state(EAC).open, false);
});
check('inFrom is injectable (the page\'s own inPlay): a player outside the injected territory is never offered, one inside is', () => {
  const m = createGateMachine({ gates: [EAB], config: { graceS: 0 }, rectsOf, inFrom: (g, x, z) => x <= 900 });      // FROM ends at x 900
  const o = walkTo(m, 850, 500, 900, 500); assert(o && o.offer.id === 'e1' && o.x >= 859 && o.x <= 862, JSON.stringify(o));
});
check('a gate row whose territories are unknown (no REGISTRY play) is inert, a border gate in the same machine still works', () => {
  const m = createGateMachine({ gates: [{ id: 'x', kind: 'edge', from: 'nowhere', to: 'B' }, G], config: { graceS: 0 }, rectsOf }); const log = run(m, { z0: 100, z1: 0, speed: 1.5 }); assert.equal(firstOffer(log).offer.id, 'g');
});
check('the real registry territories: a strip -> north edge row triggers on the strip side of the shared band (x 100, heading north at z -380) and not 100 m south of it', () => {
  const E = { id: 'edev-t', kind: 'edge', from: 'strip', to: 'north' }, m = createGateMachine({ gates: [E], config: { graceS: 0 } });
  const o = walkTo(m, 100, -330, 100, -380); assert(o && o.dir === 0, JSON.stringify(o)); assert.equal(walkTo(createGateMachine({ gates: [E], config: { graceS: 0 } }), 100, 0, 100, -100), null);
});
check('the update() of an edge gate allocates nothing per call (no spread, no array literal, no Math.hypot in the per-frame loop)', () => {
  const src = fs.readFileSync(path.join(root, 'src/core/gates.js'), 'utf8'), i = src.indexOf('function edgeDir('), j = src.indexOf('const machine = {', i), body = src.slice(i, j);
  assert(i > 0 && j > i); assert(!/\{\s*\.\.\./.test(body) && !/Math\.hypot/.test(body) && !/=>\s*\[/.test(body) && !/\[\s*[a-z]/.test(body.replace(/EDGE_DIRS\[k\]\[[01]\]/g, '').replace(/EDGE_DIRS\[k\]/g, '')), 'allocation in edgeDir');
});

console.log('no question, the freeze veil (the DOM layer with fakes):');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fakeStorage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, m }; };
const fakeSeam = () => ({ shown: [], hidden: 0, show(s) { this.shown.push(s); return true; }, hide() { this.hidden++; }, progress() {}, finish() {}, remove() {} });
const SNAP = { img: 'data:image/jpeg;base64,/9j/AAAA', w: 640, h: 360 };
/** a createGates in the REAL default mode (no ?gateprompt): the fake ui records any question, win.sessionStorage is a Map, the veil and the frame grab are fakes */
const mkReal = (over = {}, qs = 'devgates=1&baked=0') => {
  const storage = over.storage || fakeStorage(), seam = fakeSeam(), ui = fakeUi(), toasts = [], navs = [];
  const player = over.player || { inputLock: 0, riding: false, fly: false, pos: { x: 100, z: -380 }, yaw: 0, pitch: 0, isUnderground: () => false };
  const ctx = over.ctx || { onUpdate() {}, drive: null };
  const win = { location: { href: 'http://h/index.html', search: '' }, addEventListener() {}, sessionStorage: storage, stop() { this.stopped = true; } };
  const api = mkGates({ ui, seam, toast: (t) => toasts.push(t), win, player, ctx, captureFrame: over.captureFrame === undefined ? async () => SNAP : over.captureFrame, ...(over.deps || {}) }, new URLSearchParams(qs + '&noprompt=1'));
  if (api) api.navigate = (u) => navs.push(u);
  return { api, storage, seam, ui, toasts, navs, player, ctx, win };
};
await acheck('a border gate triggers go() directly: no ui.confirm, the frame is captured, the veil is shown with it, the entry is stored for the next page, then ONE navigation (the player stands 25 m inside g1, in the strip)', async () => {
  const r = mkReal({ player: { inputLock: 0, riding: false, fly: false, pos: { x: 100, z: -376 }, yaw: 0, pitch: 0, isUnderground: () => false } }, 'baked=0');
  // (the strip's g1 is the border z = -405, inward +z: the player walks toward it from 29 m, at 1.5 m/s)
  r.api.preflight = async () => ({ ok: true }); r.api.machine.grace(0);
  for (let i = 0; i < 40; i++) { r.player.pos.z -= 1.5 * DT; r.api.tick(DT); await sleep(1); }
  await sleep(20);
  assert.equal(r.ui.asked.length, 0, 'a question was asked'); assert.equal(r.navs.length, 1, 'navigations: ' + r.navs.length); assert.equal(r.seam.shown.length, 1); assert.equal(r.seam.shown[0], SNAP);
  const e = JSON.parse(r.storage.getItem('n4spb.seam')); assert.equal(e.img, SNAP.img); assert.equal(e.from, 'strip'); assert.equal(e.to, 'north'); assert(Math.abs(Date.now() - e.t) < 5000);
  assert(seamEntryOk(e, { to: 'north' }) && !seamEntryOk(e, { to: 'strip' }) && !seamEntryOk(e, { now: e.t + 61000 }), 'freshness / destination'); assert.equal(r.api.traveling, true); assert.equal(r.player.inputLock, 1); assert.equal(r.ctx.travelPending, true);
});
await acheck('?gateprompt=1 restores the old question: the zone asks (ui.confirm, no navigation, no veil), "Load" travels', async () => {
  const ui = fakeUi(), navs = []; const player = { inputLock: 0, riding: false, fly: false, pos: { x: 100, z: -376 }, yaw: 0, pitch: 0, isUnderground: () => false }; const seam = fakeSeam();
  const api = mkGates({ ui, seam, player, captureFrame: async () => SNAP }, new URLSearchParams('baked=0&gateprompt=1')); api.navigate = (u) => navs.push(u); api.machine.grace(0);
  for (let i = 0; i < 40; i++) { player.pos.z -= 1.5 * DT; api.tick(DT); }
  assert.equal(ui.asked.length, 1); assert.equal(navs.length, 0); assert.equal(seam.shown.length, 0); assert.equal(api.promptMode, true); ui.asked[0].onYes(); await sleep(20); assert.equal(navs.length, 1); assert.equal(seam.shown.length, 1);
});
await acheck('E at a door and a HUD place pick go straight to go() (no ui.confirm)', async () => {
  const items = []; const r = mkReal({ ctx: { onUpdate() {}, drive: null, interact: { add(d) { items.push(d); } } }, player: { inputLock: 0, riding: false, fly: false, pos: { x: 458, z: -1350 }, yaw: 0, pitch: 0, isUnderground: () => false }, deps: { A: { ID: 'north' } } }, 'baked=0');
  r.api.preflight = async () => ({ ok: true }); items[0].onUse(); await sleep(20); assert.equal(r.ui.asked.length, 0); assert.equal(r.navs.length, 1); assert(/^strip\.html\?/.test(r.navs[0]));
  const r2 = mkReal({ deps: { A: stripA } }, 'baked=0'); r2.api.preflight = async () => ({ ok: true }); assert.equal(r2.api.offerPlace('smolny-cathedral'), true); await sleep(20);
  assert.equal(r2.ui.asked.length, 0); assert.equal(r2.navs.length, 1); assert(/^north\.html\?/.test(r2.navs[0]) && new URLSearchParams(r2.navs[0].split('?')[1]).get('cam') === '2335,-1833,-90,21', r2.navs[0]);
});
await acheck('a failed preflight: a short toast, no veil, the cooldown starts, the freeze is released (inputLock 0, travelPending false), no navigation', async () => {
  const r = mkReal({ player: { inputLock: 0, riding: false, fly: false, pos: { x: 100, z: -376 }, yaw: 0, pitch: 0, isUnderground: () => false } }, 'baked=0'); r.api.preflight = async () => ({ ok: false, why: 'offline' }); r.api.machine.grace(0);
  for (let i = 0; i < 40; i++) { r.player.pos.z -= 1.5 * DT; r.api.tick(DT); await sleep(1); } await sleep(20);
  assert.equal(r.navs.length, 0); assert.equal(r.seam.shown.length, 0); assert.equal(r.toasts.length, 1); assert(/Нет связи/.test(r.toasts[0]), r.toasts[0]);
  assert.equal(r.api.traveling, false); assert.equal(r.player.inputLock, 0); assert.equal(r.ctx.travelPending, false); assert(r.api.machine.state(r.api.gates[0]).until > r.api.machine.clock + 20, 'cooldown');
});
await acheck('no frame (captureFrame null / throws / absent) or a blocked sessionStorage: the travel still happens, the veil is the plain dark one (show(null)), nothing is stored', async () => {
  for (const [name, over] of [['null', { captureFrame: async () => null }], ['throws', { captureFrame: async () => { throw new Error('x'); } }], ['absent', { captureFrame: null }],
    ['quota', { storage: { getItem() { return null; }, setItem() { throw new Error('QuotaExceededError'); }, removeItem() {} } }], ['blocked', { storage: { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); }, removeItem() { throw new Error('SecurityError'); } } }]]) {
    const r = mkReal(over, 'baked=0'); r.api.preflight = async () => ({ ok: true }); await r.api.go(r.api.gates[0], 'gate'); assert.equal(r.navs.length, 1, name); assert.equal(r.seam.shown.length, 1, name);
    if (name === 'null' || name === 'throws' || name === 'absent') { assert.equal(r.seam.shown[0], null, name); assert.equal(r.storage.getItem('n4spb.seam'), null, name); }
  }
});
await acheck('the edge gate in the DOM layer: a strip -> north edge row (injected) triggers go() from the page\'s own inPlay; the hand-off is the same pose (cam = x,z,yaw,pitch) and ho { via gate, gate edev-t }', async () => {
  const E = { id: 'edev-t', kind: 'edge', from: 'strip', to: 'north' }, L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);
  const player = { inputLock: 0, riding: false, fly: false, pos: { x: 100, z: -366 }, yaw: 0.25, pitch: 0.05, isUnderground: () => false };
  const r = mkReal({ player, deps: { gates: [E], inPlay: (x, z) => L.inPlay(x, z) } }, 'baked=0'); assert.deepEqual(r.api.edges.map((g) => g.id), ['edev-t']); assert.deepEqual(r.api.gates.map((g) => g.id), ['edev-t']);
  r.api.preflight = async () => ({ ok: true }); r.api.machine.grace(0);
  for (let i = 0; i < 60; i++) { player.pos.z -= 1.5 * DT; r.api.tick(DT); await sleep(1); } await sleep(20);
  assert.equal(r.ui.asked.length, 0); assert.equal(r.navs.length, 1, 'navigations ' + r.navs.length);
  const q = new URLSearchParams(r.navs[0].split('?')[1]), cam = q.get('cam').split(',').map(Number), ho = decodeHo(q.get('ho'), { to: 'north' });
  assert(ho.ok, ho.why); assert.equal(ho.ho.gate, 'edev-t'); assert.equal(ho.ho.via, 'gate'); assert.equal(cam.length, 4); assert.equal(cam[0], 100); assert(cam[1] < -365 && cam[1] >= player.pos.z, 'z at the trigger ' + cam[1]); assert(Math.abs(cam[2] - 0.25 * 180 / Math.PI) < 0.01);
  // the destination: planArrival with that row has NO arrival rectangle, the pose is walkable in the strip's sibling (here the real strip layout stands in for the destination), and the arrival is the same x,z
  const h = planArrival({ L, A: { ID: 'north' }, params: q, gates: [{ ...E, from: 'strip', to: 'north' }] });
  assert(h && !h.invalid && h.gate.id === 'edev-t'); assert(h.how === 'direct' || h.how === 'ring');
});
check('the dev switch: ?gateprompt=0 is the default again (no question)', () => { const r = mkReal({}, 'baked=0&gateprompt=0'); assert.equal(r.api.promptMode, false); });
check('seam helpers: seamWrite / seamRead / seamClear never throw; seamEntryOk refuses a non-image, a stale or a future entry', () => {
  const st = fakeStorage(), w = { sessionStorage: st }; assert.equal(seamWrite(w, { img: SNAP.img, t: 1 }), true); assert.equal(seamRead(w).img, SNAP.img); seamClear(w); assert.equal(seamRead(w), null);
  assert.equal(seamRead({ sessionStorage: { getItem() { throw new Error('x'); } } }), null); assert.equal(seamWrite({}, {}), false); seamClear({});
  const now = 1e12, ok = { img: SNAP.img, t: now - 1000, to: 'north' };
  assert(seamEntryOk(ok, { now })); assert(!seamEntryOk({ ...ok, img: 'javascript:alert(1)' }, { now })); assert(!seamEntryOk({ ...ok, t: now - 61000 }, { now })); assert(!seamEntryOk({ ...ok, t: now + 60000 }, { now })); assert(!seamEntryOk(null, { now })); assert(!seamEntryOk({ ...ok, t: 'x' }, { now }));
});
check('createSeam on a tiny fake DOM: show() sets the picture and the classes on / anim / blur (a plain veil without a picture), progress() drives the fill and the percentage, finish() fades out and drops the key, hide() resets', () => {
  const cls = new Set(), st = {}, mk = () => ({ style: {}, setAttribute() {}, textContent: '' });
  const snap = mk(), fill = mk(), pct = mk(), track = mk(), el = { classList: { add: (...a) => a.forEach((c) => cls.add(c)), remove: (...a) => a.forEach((c) => cls.delete(c)), contains: (c) => cls.has(c) }, offsetWidth: 0, remove() { el.gone = true; }, querySelector: (s) => ({ '.seam-snap': snap, '.seam-fill': fill, '.seam-pct': pct, '.seam-track': track })[s] };
  const storage = fakeStorage(); storage.setItem('n4spb.seam', '{}'); const doc = { getElementById: (id) => (id === 'seam' ? el : null), documentElement: { classList: { remove() {} } } };
  const s = createSeam({ doc, win: { sessionStorage: storage } }); assert.equal(s.active, false);
  assert.equal(s.show(SNAP), true); assert(cls.has('on') && cls.has('blur') && cls.has('anim') && !cls.has('plain')); assert(/^url\("data:image\/jpeg/.test(snap.style.backgroundImage)); assert.equal(s.active, true);
  s.progress(0.426); assert.equal(fill.style.transform, 'scaleX(0.426)'); assert.equal(pct.textContent, '43%'); s.progress(7); assert.equal(pct.textContent, '100%'); s.progress(NaN); assert.equal(pct.textContent, '0%');
  s.hide(); assert(!cls.has('on') && !cls.has('blur')); s.show(null); assert(cls.has('plain'));
  s.finish(); assert(cls.has('out')); assert.equal(storage.getItem('n4spb.seam'), null); assert.equal(pct.textContent, '100%'); s.remove(); assert.equal(el.gone, true);
  assert.equal(createSeam({ doc: { getElementById: () => null }, win: {} }).show(SNAP), false);
});
check('the preloader rule: the bar continues across pages (lead -> entry.p -> base..1 mapping), fill and label come from ONE value', () => {
  const cls = new Set(), mk = () => ({ style: {}, setAttribute() {}, textContent: '' });
  const snap = mk(), fill = mk(), pct = mk(), track = mk(), el = { dataset: {}, classList: { add: (...a) => a.forEach((c) => cls.add(c)), remove: (...a) => a.forEach((c) => cls.delete(c)), contains: (c) => cls.has(c) }, offsetWidth: 0, remove() {}, querySelector: (s) => ({ '.seam-snap': snap, '.seam-fill': fill, '.seam-pct': pct, '.seam-track': track })[s] };
  const doc = { getElementById: (id) => (id === 'seam' ? el : null), documentElement: { classList: { remove() {} } } };
  const origin = createSeam({ doc, win: { sessionStorage: fakeStorage() } }); origin.show(SNAP); origin.lead();
  assert.equal(pct.textContent, Math.round(SEAM_LEAD * 100) + '%'); assert.equal(fill.style.transform, 'scaleX(' + SEAM_LEAD + ')'); assert.equal(el.dataset.p, String(SEAM_LEAD));
  // the destination page (its inline script writes data-base and the drawn start): real progress 0..1 maps onto base..1, so 0 shows the base and 1 shows 100
  const el2 = { ...el, dataset: { base: String(SEAM_LEAD), p: String(SEAM_LEAD) } }; fill.style.transform = 'scaleX(' + SEAM_LEAD + ')';
  const dest = createSeam({ doc: { getElementById: () => el2, documentElement: doc.documentElement }, win: {} });
  dest.progress(0); assert.equal(pct.textContent, '12%'); dest.progress(0.5); assert.equal(pct.textContent, '56%'); dest.progress(1); assert.equal(pct.textContent, '100%'); assert.equal(fill.style.transform, 'scaleX(1)');
  // with animation frames the bar eases, and the first call continues from the value drawn by the inline script (never from 0)
  { const q = []; fill.style.transform = 'scaleX(' + SEAM_LEAD + ')'; pct.textContent = '12%'; const seen = [];
    const d2 = createSeam({ doc: { getElementById: () => el2, documentElement: doc.documentElement }, win: { requestAnimationFrame: (f) => q.push(f) } });
    d2.progress(0.3); for (let i = 0; i < 60 && q.length; i++) { q.shift()(); seen.push(parseInt(pct.textContent, 10)); }
    assert(seen.every((v, i) => v >= 12 && (i === 0 || v >= seen[i - 1])), 'monotonic from the base: ' + seen.join(',')); assert.equal(seen[seen.length - 1], Math.round((0.12 + 0.88 * 0.3) * 100)); }
  const e = JSON.parse(seamWriteProbe()); assert.equal(e.p, SEAM_LEAD);
  function seamWriteProbe() { const st = fakeStorage(); seamWrite({ sessionStorage: st }, { img: SNAP.img, t: Date.now(), from: 'a', to: 'b', p: SEAM_LEAD }); return st.getItem('n4spb.seam'); }
});
check('the preloader rule: every generated page sets html.seam-in in the HEAD (before the first paint), carries the veil as the FIRST thing in the body (before the canvas and the splash), and the watchdog never removes the veil', () => {
  for (const f of ['strip.html', 'index.html', 'north.html', 'smolny.html', 'vladimirsky.html']) {
    const h = fs.readFileSync(path.join(root, f), 'utf8'), head = h.slice(0, h.indexOf('<body>')), body = h.slice(h.indexOf('<body>'));
    assert(/classList\.add\('seam-in'\)/.test(head) && /html\.seam-in #intro \{ display: none !important; \}/.test(head) && /html\.seam-in, html\.seam-in body \{ background: #0b1230; \}/.test(head), f + ': the head script + CSS');
    assert(body.startsWith('<body>\n<div id="seam"'), f + ': the veil is the first element of the body');
    const iSeam = body.indexOf('<div id="seam"'), iScript = body.indexOf('// The veil of a page reached by a hand-off'), iCanvas = body.indexOf('<canvas id="scene"'), iIntro = body.indexOf('<div id="intro">');
    assert(iSeam < iScript && iScript < iCanvas && iCanvas < iIntro, f + ': order veil, veil script, canvas, splash');
    assert(!/sm\.remove\(\)/.test(body), f + ': the loading watchdog must not remove the veil');
  }
});
check('grabFrame: a black or a zero-sized canvas gives null, a drawn one a JPEG data URL scaled to at most maxW (fake 2D canvases)', () => {
  const mkDoc = (sum) => ({ createElement: () => { const c = { width: 0, height: 0, getContext: () => ({ drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(8 * 8 * 4).fill(sum) }) }), toDataURL: (t, q) => `data:${t};q=${q};${c.width}x${c.height}` }; return c; } });
  assert.equal(grabFrame({ width: 0, height: 0 }, { doc: mkDoc(9) }), null); assert.equal(grabFrame({ width: 800, height: 600 }, { doc: mkDoc(0) }), null);
  const g = grabFrame({ width: 2560, height: 1440 }, { doc: mkDoc(9) }); assert.equal(g.w, 1280); assert.equal(g.h, 720); assert(g.img.startsWith('data:image/jpeg;q=0.72;1280x720'), g.img); assert.equal(grabFrame({ width: 640, height: 360 }, { doc: mkDoc(9) }).w, 640); assert.equal(grabFrame(null), null);
});

console.log(`gates-test: ${passes} passed, ${fails} failed`);
console.log(fails ? 'RESULT: FAIL' : 'RESULT: OK');
process.exit(fails ? 1 : 0);
