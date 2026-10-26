// CPU check of the "Потрачено" (WASTED) state, no browser: drive/wasted.js with the real damage model (damage.js) and the real handling (handling.js) on a flat world.
//   node tools/drive-wasted-test.mjs
// Proves: damage below 100% shows nothing and the car drives; the step the damage reaches 100% shows the label ONCE (exact text, 5 s of game time, then gone, never again while the car stays wrecked);
// the wrecked car ignores gas / steering / nitro / hop and brakes to a standstill without reversing; a repair (damage.repair) removes the label at once and gives the car its input back;
// reset() (getting into a wrecked car, a hand-off arrival) adopts the state without a label; hide() (exit, respawn) clears a running label; drive.js wires it and its repair() has no rule
// against a wrecked car (the only condition is the speed). To reach 100% by hand: drive at full speed into a wall 3-4 times (a 100+ km/h hit crumples one zone by ~0.5-1).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { createCarDamage } from '../src/world/drive/damage.js';
import { createHandling, COUPE_TUNING } from '../src/world/drive/handling.js';
import { createWasted, WASTED_SECONDS, WASTED_TEXT } from '../src/world/drive/wasted.js';

// ---- a fake document: just enough DOM for the label
const made = [];
const node = (tag) => ({ tag, id: '', children: [], style: {}, classes: new Set(), offsetWidth: 1, textContent: '', firstChild: null, innerHTML: '',
  classList: null, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } });
const doc = { body: node('body'), head: node('head'), createElement(tag) {
  const n = node(tag); n.classList = { add: (c) => n.classes.add(c), remove: (c) => n.classes.delete(c), contains: (c) => n.classes.has(c) };
  Object.defineProperty(n, 'innerHTML', { set() { n.firstChild = doc.createElement('div'); } }); made.push(n); return n; } };
let shows = 0;
const wasted = createWasted({ doc, onShow: () => shows++ });

// ---- the real damage model on a private shell, the real handling on a flat world
const root = new THREE.Group();
const g = new THREE.BoxGeometry(1.82, 1, 4.14, 4, 3, 12).toNonIndexed(); g.translate(0, .65, .05);
g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(.6), 3));
const body = new THREE.Mesh(g, new THREE.MeshBasicMaterial()); root.add(body);
const damage = createCarDamage({ root, body });
const flat = { inPlay: () => true, heightAt: () => 0, insideBuilding: () => false };
const ph = { surfaceAt: () => ({ y: 0.03, kind: null, item: null }), inHole: () => false, refreshDynamic() {}, querySolids: () => [] };
const car = createHandling({ L: flat, physics: ph, services: {} }, null); car.reset(0, 0, 0);
const DT = 1 / 60, label = () => made.find((n) => n.id === 'wasted');
const press = { thr: 1, brk: 0, steer: 1, nitro: true, hand: false, jump: true, flip: true };
/** one drive.js frame: the gate on the player's input, the car step, the wasted step after the impacts */
const frame = (inp) => { const i = wasted.gate({ ...inp }, car.vF, damage.amount); car.step(DT, i); wasted.step(DT, damage.amount); };

// 1. a healthy / damaged (< 100%) car drives, no label
for (let i = 0; i < 60; i++) frame(press);
assert(car.speed > 20, 'a healthy car accelerates'); assert.equal(wasted.visible, false); assert.equal(label(), undefined, 'no DOM before the first wreck');
damage.hit({ type: 'hit', v: 30, localX: 0, localZ: 2.1, localNX: 0, localNZ: -1 });
assert(damage.amount > .2 && damage.amount < .999, 'a 30 m/s blow leaves the car damaged, not wrecked');
for (let i = 0; i < 30; i++) frame(press);
assert.equal(wasted.visible, false); assert.equal(shows, 0); assert(car.speed > 20, 'a damaged car still drives');

// 2. the blow that reaches 100%: the label fires once, with the exact text
for (let i = 0; i < 20; i++) damage.hit({ type: 'hit', v: 60, localX: 0, localZ: 2.1, localNX: 0, localNZ: -1 });
assert.equal(damage.amount, 1, 'repeated hits crush the body to 100%');
const fired = wasted.step(DT, damage.amount);
assert.equal(fired, true, 'the step that sees 100% fires'); assert.equal(shows, 1); assert.equal(wasted.visible, true);
assert.equal(label().firstChild.textContent, WASTED_TEXT); assert.equal(WASTED_TEXT, 'Потрачено'); assert(label().classes.has('on'));
assert.equal(wasted.step(DT, damage.amount), false, 'not again on the next frame'); assert.equal(shows, 1);

// 3. the wrecked car cannot be driven: gas / steer / nitro / hop ignored, it brakes to a standstill and never reverses
const yaw0 = car.yaw;
let minVF = Infinity;
for (let i = 0; i < 60 * 12; i++) { frame(press); minVF = Math.min(minVF, car.vF); }
assert(car.speed < 0.5, 'the wrecked car stops although the gas is held: ' + car.speed.toFixed(2)); assert(minVF > -0.5, 'it never reverses');
assert(Math.abs(car.yaw - yaw0) < 0.6, 'it did not steer away');
const z0 = car.z, yawStop = car.yaw;
for (let i = 0; i < 60 * 5; i++) frame({ ...press, brk: 0 });
assert(Math.abs(car.z - z0) < 0.05, 'gas moves a wrecked car by nothing: ' + (car.z - z0).toFixed(3));
assert.equal(car.yaw, yawStop, 'steering turns nothing'); assert.equal(car.boosting, false, 'no nitro'); assert(!car.air, 'no hop');

// 4. the label runs out after 5 s of game time and stays gone while the car stays wrecked (it fired once)
assert.equal(wasted.visible, false, 'the label is gone after the 12 s above'); assert(!label().classes.has('on')); assert.equal(shows, 1, 'once per wreck event');

// 5. the label lasts WASTED_SECONDS: a second wreck after a repair, counted frame by frame
damage.repair(); frame({ thr: 0, brk: 0, steer: 0 });
assert.equal(damage.amount, 0); assert.equal(wasted.junked, false, 'repair clears the wrecked state');
for (let i = 0; i < 60; i++) frame(press);
assert(car.speed > 10, 'after the repair the car obeys the gas again: ' + car.speed.toFixed(1));
for (let i = 0; i < 20; i++) damage.hit({ type: 'hit', v: 60, localX: 0, localZ: 2.1, localNX: 0, localNZ: -1 });
let frames = 0; wasted.step(DT, damage.amount); assert.equal(shows, 2, 'a new wreck event shows the label again');
while (wasted.visible && frames < 60 * 20) { wasted.step(DT, damage.amount); frames++; }
assert(Math.abs(frames * DT - WASTED_SECONDS) < 0.1, `the label runs ${WASTED_SECONDS} s (${(frames * DT).toFixed(2)} s)`);

// 6. a repair inside the 5 s removes the label at once
damage.repair(); wasted.step(DT, 0); wasted.step(DT, damage.amount);
for (let i = 0; i < 20; i++) damage.hit({ type: 'hit', v: 60, localX: 0, localZ: 2.1, localNX: 0, localNZ: -1 });
wasted.step(DT, damage.amount); assert.equal(wasted.visible, true); assert.equal(shows, 3);
damage.repair(); wasted.step(DT, damage.amount); assert.equal(wasted.visible, false, 'repaired within the 5 s: the label is gone'); assert(!label().classes.has('on'));

// 7. exit / respawn / hand-off arrival
for (let i = 0; i < 20; i++) damage.hit({ type: 'hit', v: 60, localX: 0, localZ: 2.1, localNX: 0, localNZ: -1 });
wasted.step(DT, damage.amount); assert.equal(wasted.visible, true); assert.equal(shows, 4);
wasted.hide(); assert.equal(wasted.visible, false, 'hide() (exit / respawn R) clears a running label'); assert.equal(wasted.step(DT, damage.amount), false, 'and the same wreck does not fire it again');
wasted.reset(damage.amount); assert.equal(wasted.step(DT, damage.amount), false, 'getting into an already wrecked car shows no label'); assert.equal(shows, 4);
assert.equal(wasted.gate({ thr: 1, steer: 1 }, 0, damage.amount).thr, 0, 'but it is still immobile'); damage.repair();
assert.equal(wasted.gate({ thr: 1, steer: 1 }, 0, damage.amount).thr, 1, 'and drives after the repair');

// 8. drive.js wiring and the repair rule
const src = fs.readFileSync(new URL('../src/world/drive.js', import.meta.url), 'utf8');
for (const needle of ["import { createWasted } from './drive/wasted.js'", 'wasted.gate(input, car.vF, damage.amount)', 'wasted.step(dt, damage.amount)', 'wasted.reset(damage.amount)', 'wasted.hide()'])
  assert(src.includes(needle), 'drive.js wires: ' + needle);
assert(/wasted\.gate\(\{ \.\.\.\(typeof inp === 'function'/.test(src) && src.includes('wasted.step(dt, damage.amount); if (wake') , 'the sim() test hook runs the same gate and step');
const r0 = src.indexOf('    repair() {'), r1 = src.indexOf('damage.repair()', r0);
const rule = src.slice(r0, r1);
assert(/if \(Math\.hypot\(car\.vx, car\.vz\) > 1\.4\)/.test(rule) && (rule.match(/return false/g) || []).length === 2, 'repair() refuses only a moving car (> 1.4 m/s): a wrecked, stopped car is repairable');
assert(src.includes("e.code === 'KeyJ'") && src.includes('api.repair()'), 'the J key calls repair()');
console.log('PASS wasted: label once per wreck event (5 s, exact text), wrecked car immobile (brakes to a stop, no reverse), repair / exit / respawn clear it, J repair rule unchanged');
