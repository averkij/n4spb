// CPU regression for first-E entry: run the real interaction listener and the drive module's real
// keydown listener in order, with a simulated delay during initial HUD/audio setup. No WebGL required.
// Also the Roadster's input: readInput (drive.js) turns the X key (the simple hop) and the touch HOP button into input.jump and the C key (the barrel hop) and the FLIP button into input.flip, the exhaust-point array fed to the fx has room for every nozzle of every car, and
// the door stays shut while the car is in the air (exit()).
// Run: node tools/drive-input-test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { createInteract, isInteractionKey } from '../src/core/ui.js';

const source = fs.readFileSync(new URL('../src/world/drive.js', import.meta.url), 'utf8');
const section = source.indexOf('// ---------------------------------------------------------------- keys / mouse');
const begin = source.indexOf("    addEventListener('keydown', (e) => {", section);
const end = source.indexOf("    addEventListener('mousemove'", begin);
assert(section >= 0 && begin > section && end > begin, 'drive keydown listener is present');
const driveListener = source.slice(begin, end);
const originalAdd = globalThis.addEventListener;
try {
  for (const key of [
    { code: 'KeyE', key: 'e' }, { code: 'KeyE', key: 'у' },
    { code: '', key: 'e' }, { code: '', key: 'у' },
    { code: 'Unidentified', key: 'У' },
  ]) for (const setupDelay of [0, 1000, 12000]) {
    const events = new EventTarget();
    globalThis.addEventListener = events.addEventListener.bind(events);
    const player = { fly: false, inputLock: 0 }, camera = new THREE.PerspectiveCamera(), ui = { modalOpen: false };
    const state = { active: false, enteredAt: 0 };
    let now = 10, exits = 0;
    const interact = createInteract({ camera, player, ui, doc: { getElementById: () => null } });
    interact.add({
      id: 'test-car', x: 0, y: 0, z: 0, enabled: () => !state.active,
      onUse: () => { state.active = true; state.enteredAt = now; player.inputLock = 1; now += setupDelay; },
    });
    interact.update();
    vm.runInNewContext(driveListener, {
      addEventListener, isInteractionKey, state, ctx: { ui }, performance: { now: () => now },
      exit: () => { exits++; state.active = false; player.inputLock = 0; },
    }, { filename: 'drive.js keydown listener' });
    const press = (repeat = false, extra = {}) => {
      const e = new Event('keydown', { cancelable: true }); Object.assign(e, { ...key, repeat, ...extra });
      events.dispatchEvent(e); return e;
    };
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'isComposing']) {
      assert.equal(press(false, { [modifier]: true }).defaultPrevented, false);
      assert.equal(state.active, false, modifier + ' cannot board');
    }
    for (const tag of ['INPUT', 'SELECT']) {
      events.tagName = tag; press();
      assert.equal(state.active, false, tag + ' keeps its text/control input');
    }
    delete events.tagName;
    assert.equal(press().defaultPrevented, true, 'interaction consumes entry event');
    assert.equal(state.active, true, `entry stays seated after ${setupDelay} ms setup`);
    assert.equal(exits, 0, 'entry cannot exit on the same event');
    interact.update();
    now += 1000; press(true);
    assert.equal(exits, 0, 'holding E cannot exit on auto-repeat');
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'isComposing']) {
      press(false, { [modifier]: true });
      assert.equal(state.active, true, modifier + ' cannot exit');
    }
    assert.equal(press().defaultPrevented, true, 'a fresh E consumes exit event');
    assert.equal(exits, 1, 'a subsequent E exits normally');
  }
} finally {
  if (originalAdd === undefined) delete globalThis.addEventListener;
  else globalThis.addEventListener = originalAdd;
}
for (const event of [
  { code: 'KeyT', key: 'e' }, { code: 'KeyT', key: 'у' },
  { code: '', key: 'е' }, { code: '', key: 'x' },
]) assert.equal(isInteractionKey(event), false, 'another physical key/letter cannot use the E action');
assert.equal(isInteractionKey({ code: 'Space', key: ' ' }, 'Space'), true, 'other explicit interaction bindings are preserved');
assert.equal(isInteractionKey({ code: '', key: 'e' }, 'Space'), false, 'fallback applies only to E interactions');
// ---- the hop key: the real readInput of drive.js with a fake key set / touch state
{
  const r0 = source.indexOf('  function readInput(out = {}) {'), r1 = source.indexOf('  const input = {};', r0);
  assert(r0 >= 0 && r1 > r0, 'drive readInput is present');
  const read = (codes, touch = {}, player = null) => {
    const fn = vm.runInNewContext(source.slice(r0, r1) + ' readInput;', { keys: new Set(codes), touch: { nitro: false, hand: false, brake: false, jump: false, flip: false, ...touch }, hopTap: !!touch.tap, flipTap: !!touch.tapC, player, clamp: (v, a, b) => Math.max(a, Math.min(b, v)) });
    return fn({});
  };
  assert.equal(read([]).jump, false, 'no key: no hop');
  assert.equal(read([], { tap: true }).jump, true, 'a latched tap (keydown + keyup between two frames) still hops');
  assert.equal(read(['KeyX']).jump, true, 'the X key hops');
  assert.equal(read([], { jump: true }).jump, true, 'the touch HOP button hops');
  assert.equal(read(['KeyW']).jump, false, 'W alone does not hop');
  // the barrel hop: C (and the touch FLIP button, and the latched press) -> input.flip; X and C are separate keys
  assert.equal(read([]).flip, false, 'no key: no barrel hop'); assert.equal(read(['KeyC']).flip, true, 'the C key is the barrel hop'); assert.equal(read([], { flip: true }).flip, true, 'the touch FLIP button is the barrel hop');
  assert.equal(read([], { tapC: true }).flip, true, 'a latched C press (keydown + keyup between two frames) still flips'); assert.equal(read(['KeyC']).jump, false, 'C is not the simple hop'); assert.equal(read(['KeyX']).flip, false, 'X is not the barrel hop');
  assert.equal(read([], { tapC: true }).jump, false); assert.equal(read([], { tap: true }).flip, false);
  const gc = read(['KeyW', 'KeyC', 'ShiftLeft']); assert(gc.flip && gc.thr === 1 && gc.nitro, 'gas + nitro + the barrel hop together');
  const both = read(['KeyW', 'KeyX', 'ShiftLeft']); assert(both.jump && both.thr === 1 && both.nitro, 'gas + nitro + hop together');
  assert.equal(read(['Space']).hand, true, 'the handbrake is still Space');
  // the exhaust points of every car fit the world-point array (four nozzles with an array of two crashed the first frame)
  const m = /exW = Array\.from\(\{ length: (\d+) \}/.exec(source); assert(m, 'drive exW is an Array.from of n vectors'); const room = Number(m[1]);
  const { loadGarage } = await import('../src/world/drive/cars/index.js');
  const warn = console.warn; console.warn = () => {};
  const garage = await loadGarage({}, { placeholders: true, paths: { truck: './none.js', lada: './none.js', roadster: './none.js' } }); console.warn = warn;
  assert.equal(garage.length, 4, 'the placeholder garage has four cars');
  for (const d of garage) assert(d.exhaust.length <= room && room >= 6, `exW (${room}) holds the ${d.exhaust.length} exhaust points of ${d.id}`);
  assert(garage.find((d) => d.id === 'roadster').exhaust.length === 4 && garage.find((d) => d.id === 'roadster').tuning.hop, 'the Roadster has four nozzles and a hop');
  // the keydown listener latches the press of X (hopTap) and of C (flipTap): immediately, only while driving, not on auto-repeat, not behind a modal; each key has its own latch
  {
    const events = new EventTarget(); globalThis.addEventListener = events.addEventListener.bind(events);
    const sb = { addEventListener, isInteractionKey, state: { active: true, enteredAt: 0 }, ctx: { ui: { modalOpen: false } }, performance: { now: () => 1e6 }, exit() {}, api: { setView() {}, repair() {} }, view: { mode: 0 }, sound: { horn() {} }, hopTap: false, flipTap: false };
    vm.runInNewContext(driveListener, sb, { filename: 'drive.js keydown listener (hop)' });
    const press = (code, repeat = false) => events.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { code, repeat }));
    for (const [code, latch, other] of [['KeyX', 'hopTap', 'flipTap'], ['KeyC', 'flipTap', 'hopTap']]) {
      press(code, true); assert.equal(sb[latch], false, code + ': auto-repeat does not latch');
      sb.ctx.ui.modalOpen = true; press(code); assert.equal(sb[latch], false, code + ': a modal swallows the key'); sb.ctx.ui.modalOpen = false;
      sb.state.active = false; press(code); assert.equal(sb[latch], false, code + ': not driving (walking / flying: C is the descend key there): no latch'); sb.state.active = true;
      press(code); assert.equal(sb[latch], true, 'a fresh ' + code + ' press while driving latches its hop on the frame of the key down'); assert.equal(sb[other], false, code + ' does not latch the other hop');
      sb.hopTap = sb.flipTap = false;
    }
    if (originalAdd === undefined) delete globalThis.addEventListener; else globalThis.addEventListener = originalAdd;
  }
  // hop v3: X and C are levels plus latches (drive.js passes them, handling.js makes the edge: the hop starts on the step of the key down), the HUD hint has no charge bar, the model gets flip / pulses (no charge)
  assert(source.includes("out.jump = k.has('KeyX') || touch.jump || hopTap"), 'readInput passes the X key as a level plus the latch'); assert(source.includes("out.flip = k.has('KeyC') || touch.flip || flipTap"), 'readInput passes the C key as a level plus the latch');
  const hudSrc = fs.readFileSync(new URL('../src/world/drive/hud.js', import.meta.url), 'utf8');
  assert(hudSrc.includes('<kbd>X</kbd> хоп · <kbd>C</kbd> бочка'), 'the key hint reads X хоп · C бочка'); assert(!hudSrc.includes('d-charge') && !hudSrc.includes('car.charging') && !hudSrc.includes('держите'), 'the HUD has no charge bar and no hold hint any more');
  assert(hudSrc.includes('data-k="hop"') && hudSrc.includes('data-k="flip"'), 'the DOM touch buttons HOP and FLIP exist');
  assert(/flip: c.flip/.test(source) && /s0: c.pulse0/.test(source) && !/charge: c.charge/.test(source), 'poseVehicle passes flip / side-jet pulses to the model (no charge)');
  assert(source.includes("ev.type === 'dry'") && source.includes('hud.deny()'), 'a press the tank cannot pay blinks the boost bar');
  assert(source.includes("car.jumpHeld = keys.has('KeyX')") && source.includes("car.flipHeld = keys.has('KeyC')"), 'a hop key that is down at the door starts no hop when the car is entered');
  // exit() refuses in mid-hop (unless forced)
  const e0 = source.indexOf('  function exit(force = false) {'), e1 = source.indexOf('EXIT_MAX_KMH', e0);
  assert(e0 >= 0 && /!force && car\.air\) return false/.test(source.slice(e0, e1)), 'exit() keeps the door shut while the car is airborne');
}
console.log('RESULT: OK - physical and Firefox-hidden E keys across 15 key/setup-delay combinations, modifier/IME/input guards, first-E entry, held key and subsequent exit; hop keys, exhaust-point room, no exit in the air.');
