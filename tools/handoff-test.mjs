// CPU test of src/core/handoff.js: the hand-off contract (docs/AREAS.md). node tools/handoff-test.mjs
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as H from '../src/core/handoff.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fails = 0, passes = 0;
const check = (name, fn) => { try { fn(); passes++; console.log('  ok   ' + name); } catch (e) { fails++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n').slice(0, 5).join('\n       ')); } };

console.log('the ho object:');
const car = { id: 'roadster', view: 1, d: [0.2, 0, 0.5, 0.0004] };
const ho0 = H.makeHo({ from: 'strip', to: 'north', via: 'gate', gate: 'g1', car, mute: true, noui: false, ret: { x: 100.123, z: -400.456, yaw: 91.234, pitch: 3 }, n: 2 });
check('round trip: encode -> decode returns an equal object', () => { const r = H.decodeHo(H.encodeHo(ho0), { to: 'north' }); assert(r.ok, r.why); assert.deepEqual(r.ho, ho0); });
check('the encoded value is URL-safe and short', () => { const s = H.encodeHo(ho0); assert(/^[A-Za-z0-9_-]+$/.test(s)); assert(s.length < H.MAX_HO_CHARS, String(s.length)); });
check('Cyrillic inside a field survives (UTF-8)', () => { const o = { ...ho0, gate: 'врата' }; assert.equal(JSON.parse(H.b64uDecode(H.b64uEncode(JSON.stringify(o)))).gate, 'врата'); });
check('a car-less hand-off is valid', () => assert(H.validateHo(H.makeHo({ from: 'strip', to: 'north' }), { to: 'north' }).ok));
check('boat identity survives the URL and invalid vehicle kinds are rejected', () => {
  const h = H.makeHo({ from: 'palace', to: 'smolny', car: { id: 'boat', kind: 'boat', dock: 'anichkov', view: 1, d: [0, 0, 0, 0] } });
  assert.deepEqual(H.decodeHo(H.encodeHo(h), { to: 'smolny' }).ho.car, h.car);
  assert.equal(H.validateHo({ ...h, car: { ...h.car, kind: 'plane' } }).ok, false);
  assert.equal(H.validateHo({ ...h, car: { ...h.car, dock: '../bad' } }).ok, false);
});
check('via door (the metro ride, M7) and via place (the HUD list) are valid ways; a door carries no car', () => {
  const door = H.makeHo({ from: 'north', to: 'strip', via: 'door', gate: 'g3', ret: { x: 458, z: -1350, yaw: -90, pitch: 0 } });
  assert(H.validateHo(door, { to: 'strip' }).ok); assert.equal(door.car, null); assert.deepEqual(H.decodeHo(H.encodeHo(door), { to: 'strip' }).ho, door);
  assert(H.validateHo(H.makeHo({ from: 'strip', to: 'north', via: 'place', gate: 'g1', car }), { to: 'north' }).ok);
});
check('wrong destination area is rejected', () => assert.equal(H.decodeHo(H.encodeHo(ho0), { to: 'strip' }).ok, false));
check('unknown version is rejected', () => assert.equal(H.validateHo({ ...ho0, v: 2 }, { to: 'north' }).ok, false));
check('NaN / Infinity / out-of-range numbers are rejected', () => {
  for (const bad of [{ ...ho0, ret: { ...ho0.ret, x: NaN } }, { ...ho0, ret: { ...ho0.ret, z: 1e9 } }, { ...ho0, car: { ...ho0.car, d: [0, 0, 0, Infinity] } }, { ...ho0, car: { ...ho0.car, d: [0, 0, 0] } }, { ...ho0, n: 0 }, { ...ho0, n: 51 }]) assert.equal(H.validateHo(bad, { to: 'north' }).ok, false, JSON.stringify(bad).slice(0, 80));
});
check('bad strings are rejected (area id, via, car id)', () => {
  for (const bad of [{ ...ho0, from: 'Strip!' }, { ...ho0, to: '' }, { ...ho0, via: 'teleport' }, { ...ho0, car: { ...ho0.car, id: '../x' } }, { ...ho0, mute: 'yes' }]) assert.equal(H.validateHo(bad, { to: 'north' }).ok, false);
});
check('corrupt input never throws', () => {
  for (const s of ['', '!!!', 'AAAA', H.b64uEncode('not json'), H.b64uEncode('[]'), H.b64uEncode('null'), 'x'.repeat(H.MAX_HO_CHARS + 1), undefined, null, 42]) assert.equal(H.decodeHo(s, { to: 'north' }).ok, false);
});
check('an over-long hand-off cannot be encoded', () => assert.throws(() => H.encodeHo({ ...ho0, gate: 'x'.repeat(700) })));

console.log('the URL:');
check('walking pose: 4 numbers, no fly', () => { const u = H.arrivalUrl({ page: 'north.html', pose: { x: 1.234, z: -405.5, yaw: 12.34, pitch: 4 }, tod: 1.5, search: '' }); assert.equal(u.split('?')[0], 'north.html'); const q = new URLSearchParams(u.split('?')[1]); assert.equal(q.get('cam'), '1.23,-405.5,12.34,4'); assert(!q.has('fly')); assert.equal(q.get('tod'), '1.5'); });
check('flying pose: 5 numbers (y = eye height) and fly=1', () => { const q = new URLSearchParams(H.arrivalUrl({ page: 'north.html', pose: { x: 1, y: 80, z: 2, yaw: 3, pitch: -10 }, fly: true }).split('?')[1]); assert.equal(q.get('cam'), '1,80,2,3,-10'); assert.equal(q.get('fly'), '1'); });
check('parseCamParam inverts camParam in both forms', () => {
  assert.deepEqual(H.parseCamParam(H.camParam({ x: 5, z: -6, yaw: 7, pitch: 8 }, false)), { x: 5, y: null, z: -6, yaw: 7, pitch: 8 });
  assert.deepEqual(H.parseCamParam(H.camParam({ x: 5, y: 9, z: -6, yaw: 7, pitch: 8 }, true)), { x: 5, y: 9, z: -6, yaw: 7, pitch: 8 });
  assert.equal(H.parseCamParam('1,2,3'), null); assert.equal(H.parseCamParam('a,b,c,d'), null);
});
check('pass-through keeps the page flags and drops the arrival ones', () => {
  const q = new URLSearchParams(H.arrivalUrl({ page: 'index.html', pose: { x: 1, z: 2, yaw: 3, pitch: 4 }, search: '?q=medium&baked=0&only=drive&cam=9,9,9,9&fly=1&tod=3&look=overcast&ho=zzz&t=5&hop=2&touch=1' }).split('?')[1]);
  assert.equal(q.get('q'), 'medium'); assert.equal(q.get('baked'), '0'); assert.equal(q.get('only'), 'drive'); assert.equal(q.get('touch'), '1');
  assert.equal(q.get('cam'), '1,2,3,4'); assert(!q.has('fly')); assert(!q.has('tod')); assert(!q.has('ho')); assert(!q.has('t')); assert(!q.has('hop'));
});
check('the whole URL stays short', () => assert(H.arrivalUrl({ page: 'north.html', pose: { x: 1, y: 2, z: 3, yaw: 4, pitch: 5 }, fly: true, tod: 2.123456, look: 'overcast', ho: ho0, search: '?q=medium' }).length < 800));
check('yaw convention: 0 = north (-z), 90 = west (-x), 180 = south, -90 = east', () => {
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  const f0 = H.forwardOf(0), f90 = H.forwardOf(90), f180 = H.forwardOf(180), fm = H.forwardOf(-90);
  assert(near(f0[0], 0) && near(f0[1], -1)); assert(near(f90[0], -1) && near(f90[1], 0)); assert(near(f180[0], 0) && near(f180[1], 1)); assert(near(fm[0], 1) && near(fm[1], 0));
});

console.log('resolveArrival (fake probe):');
const fake = (opts = {}) => ({ inside: (x, z) => Math.abs(x) < 500 && Math.abs(z) < 500 && !(opts.deadRect && x > opts.deadRect[0] && x < opts.deadRect[1] && z > opts.deadRect[2] && z < opts.deadRect[3]), blocked: () => false, lane: opts.lane || (() => ({ tx: 1, tz: 0 })), hero: { x: 7, z: 8, yaw: 9 } });
check('a valid point inside the rect is taken as it is', () => { const r = H.resolveArrival(fake(), { x: 10, z: 20, yaw: 90 }, 'walk', { x0: 0, x1: 100, z0: 0, z1: 100 }); assert.equal(r.how, 'direct'); assert.equal(r.x, 10); assert.equal(r.z, 20); assert.equal(r.moved, 0); });
check('a point outside the rect is clamped into it', () => { const r = H.resolveArrival(fake(), { x: 300, z: -50, yaw: 0 }, 'walk', { x0: 0, x1: 100, z0: 0, z1: 100 }); assert.equal(r.x, 100); assert.equal(r.z, 0); assert.equal(r.how, 'direct'); });
check('an invalid point falls back to the nearest valid one on a ring', () => { const r = H.resolveArrival(fake({ deadRect: [-20, 20, -20, 20] }), { x: 0, z: 0, yaw: 0 }, 'walk', null); assert.equal(r.how, 'ring'); assert(r.moved >= 20 && r.moved <= 30, String(r.moved)); });
check('nothing valid within 60 m -> the destination HERO', () => { const r = H.resolveArrival(fake({ deadRect: [-200, 200, -200, 200] }), { x: 0, z: 0, yaw: 0 }, 'walk', null); assert.equal(r.how, 'hero'); assert.equal(r.x, 7); assert.equal(r.yaw, 9); });
check('a car needs a lane within 30 degrees of its heading (either direction)', () => {
  const lane = () => ({ tx: 1, tz: 0 });                                    // an east-west road
  assert.equal(H.resolveArrival(fake({ lane }), { x: 0, z: 0, yaw: 90 }, 'car', null).how, 'direct');      // heading west on an east-west road
  assert.equal(H.resolveArrival(fake({ lane }), { x: 0, z: 0, yaw: -90 }, 'car', null).how, 'direct');     // heading east
  assert.notEqual(H.resolveArrival(fake({ lane }), { x: 0, z: 0, yaw: 0 }, 'car', null).how, 'direct');    // heading north across the road: not a valid arrival
  assert.notEqual(H.resolveArrival(fake({ lane: () => null }), { x: 0, z: 0, yaw: 90 }, 'car', null).how, 'direct');
});

console.log('an EDGE-gate arrival (the seamless hand-off: no arrival rectangle, the same x,z,yaw):');
check('a walker lands exactly where he stood (direct, moved 0, the yaw kept); something in the way: the nearest free spot of the ring search, no clamp', () => {
  const r = H.resolveArrival(fake(), { x: 123.4, z: -56.7, yaw: 211 }, 'walk', undefined); assert.equal(r.how, 'direct'); assert.equal(r.x, 123.4); assert.equal(r.z, -56.7); assert.equal(r.yaw, 211); assert.equal(r.moved, 0);
  const b = H.resolveArrival(fake({ deadRect: [100, 140, -80, -40] }), { x: 123.4, z: -56.7, yaw: 211 }, 'walk', undefined); assert.equal(b.how, 'ring'); assert(b.moved > 0 && b.moved <= 60, String(b.moved));
});
check('a car needs a lane: the same spot is kept when a lane runs along its heading, moved along the ring to one otherwise; a car with no lane within 60 m falls back to the HERO', () => {
  const lane = (x, z) => (Math.abs(z) < 3 ? { tx: 1, tz: 0 } : null);      // an east-west road along z = 0
  assert.equal(H.resolveArrival(fake({ lane }), { x: 50, z: 1, yaw: 90 }, 'car', undefined).how, 'direct');
  const off = H.resolveArrival(fake({ lane }), { x: 50, z: 20, yaw: 90 }, 'car', undefined); assert.equal(off.how, 'ring'); assert(Math.abs(off.z) < 3 && off.moved <= 60);
  assert.equal(H.resolveArrival(fake({ lane }), { x: 50, z: 200, yaw: 90 }, 'car', undefined).how, 'hero');
});

console.log('resolveArrival (the real strip layout):');
check('road projection finds a narrow lane missed by the radial rays and still validates it', () => {
  const probe=fake({lane:(x,z)=>Math.abs(x-17.13)<.1&&Math.abs(z-24.71)<.1?{tx:1,tz:0}:null});
  probe.candidates=()=>[{x:17.13,z:24.71,tx:1,tz:0}];
  const r=H.resolveArrival(probe,{x:0,z:0,yaw:90},'car',null);
  assert.equal(r.how,'ring');assert.equal(r.x,17.13);assert.equal(r.z,24.71);
  probe.blocked=()=>true;
  assert.equal(H.resolveArrival(probe,{x:0,z:0,yaw:90},'car',null).how,'hero');
});
{
  const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);
  const probe = H.makeProbe(L);
  let direct = 0, ring = 0, hero = 0, bad = 0, n = 0;
  for (let x = -2800; x <= 800; x += 211) for (let z = -1250; z <= 1000; z += 197) {
    for (const mode of ['walk', 'car']) {
      n++; const r = H.resolveArrival(probe, { x, z, yaw: 37 }, mode, null);
      if (r.how === 'direct') direct++; else if (r.how === 'ring') ring++; else hero++;
      // independent of makeProbe: the layout is asked directly, with the literal numbers of the contract (25 m inset, 1.5 m building clearance, a vehicle road, 30 degrees)
      if (r.how !== 'hero') {
        if (!L.inPlay(r.x, r.z, 25) || L.insideBuilding(r.x, r.z, 1.5)) bad++;      // (water is reachable, CLAUDE.md "World rules": an arrival in the river is fine, only a building blocks)
        if (mode === 'car') { const h = L.roadsNear(r.x, r.z, 0, { drivable: true }).find((q) => q.gap <= 0); const [fx, fz] = H.forwardOf(37); if (!h || Math.abs(h.tx * fx + h.tz * fz) < Math.cos(30 * Math.PI / 180)) bad++; }
      }
    }
  }
  console.log(`       ${n} probes over the strip lattice: ${direct} direct, ${ring} ring, ${hero} hero`);
  check('every non-hero arrival is inside the play area (25 m inset), not in a building (water is walkable: a player in the river arrives in the river), and a car sits on a lane within 30 degrees of its heading', () => assert.equal(bad, 0));
  check('the lattice really exercises all three outcomes (a test that only ever sends the player to the HERO proves nothing)', () => { assert(direct >= 20, 'direct ' + direct); assert(ring >= 20, 'ring ' + ring); assert(hero >= 1, 'hero ' + hero); });
  check('the HERO fallback is itself a valid walking spot', () => assert(probe.inside(L.HERO.x, L.HERO.z) && !probe.blocked(L.HERO.x, L.HERO.z)));
}
console.log(`handoff-test: ${passes} passed, ${fails} failed`);
console.log(fails ? 'RESULT: FAIL' : 'RESULT: OK');
process.exit(fails ? 1 : 0);
