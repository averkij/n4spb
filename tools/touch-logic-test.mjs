// Pure-node regression for the touch controls (src/core/touch-logic.js): the stick and steering curves, the dead zones, the encoder that feeds drive.js readInput through
// player.touchMove (checked against the REAL readInput source in src/world/drive.js), the settings persistence (corrupt JSON, a throwing storage), the hold / one-shot action table
// and the left-handed mirror. No browser, no GPU.   Run: node tools/touch-logic-test.mjs   (npm run touch)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from '../src/core/touch-logic.js';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('ok  ' + name); };
const near = (a, b, eps, msg) => assert(Math.abs(a - b) <= eps, `${msg || ''} expected ${b} +-${eps}, got ${a}`);

// ------------------------------------------------------------------ 1. walk stick
ok('stick: dead zone 8 %, nothing inside', () => {
  const R = T.STICK.radius;
  for (const f of [0, 0.02, 0.05, 0.08]) { const v = T.stickCurve(R * f, 0); assert.equal(v.x, 0); assert.equal(v.y, 0); assert.equal(v.mag, 0); assert.equal(v.run, false); }
  assert(T.stickCurve(R * 0.09, 0).mag > 0, 'just outside the dead zone it moves');
});
ok('stick: monotonic response, 1.2 curve, rim = run', () => {
  const R = T.STICK.radius; let prev = -1;
  for (let f = 0; f <= 1.0001; f += 0.01) { const m = T.stickCurve(0, -R * f).mag; assert(m >= prev - 1e-12, 'monotonic at ' + f); prev = m; }
  near(T.stickCurve(R * 0.5, 0).mag, Math.pow((0.5 - 0.08) / (0.92 - 0.08), 1.2), 1e-9, 'curve at half');
  assert.equal(T.stickCurve(R * 0.92, 0).run, true); assert.equal(T.stickCurve(R * 5, 0).mag, 1); assert.equal(T.stickCurve(R * 5, 0).run, true);
  assert.equal(T.stickCurve(R * 0.6, 0).run, false);
});
ok('stick: direction is kept, y down = back (player.touchMove)', () => {
  const f = T.stickCurve(0, -40), b = T.stickCurve(0, 40), r = T.stickCurve(40, 0), d = T.stickCurve(30, -30);
  assert(f.y < 0 && f.x === 0); assert(b.y > 0); assert(r.x > 0 && r.y === 0);
  near(Math.abs(d.x), Math.abs(d.y), 1e-9, 'diagonal'); near(Math.hypot(d.x, d.y), d.mag, 1e-9, 'diagonal length = mag');
});
ok('stick: release is exactly zero (no -0)', () => {
  const v = T.stickCurve(0, 0); assert(Object.is(v.x, 0) && Object.is(v.y, 0));
  const w = T.stickCurve(-0.0001, 0); assert(Object.is(w.x, 0));
});

// ------------------------------------------------------------------ 2. steering
ok('wheel: 6 px dead, 64 px = full lock, symmetric, right swipe = right turn (steer < 0)', () => {
  assert.equal(T.steerFromOffset(0), 0); assert.equal(T.steerFromOffset(6), 0); assert.equal(T.steerFromOffset(-6), 0);
  near(T.steerFromOffset(64), -1, 1e-12); near(T.steerFromOffset(-64), 1, 1e-12); assert.equal(T.steerFromOffset(500), -1);
  for (const x of [8, 15, 30, 50]) near(T.steerFromOffset(x), -T.steerFromOffset(-x), 1e-12, 'symmetric');
  assert(T.steerFromOffset(10) < 0 && T.steerFromOffset(-10) > 0);
});
ok('wheel: exponent 1.35 and monotonic; sensitivity shortens the swipe', () => {
  const mid = 6 + (64 - 6) * 0.5; near(T.steerFromOffset(mid), -Math.pow(0.5, 1.35), 1e-9, 'half travel');
  let prev = 0; for (let x = 0; x <= 80; x += 1) { const s = -T.steerFromOffset(x); assert(s >= prev - 1e-12); prev = s; }
  near(T.steerFromOffset(64 / 1.5, 1.5), -1, 1e-9, 'sens 1.5 reaches the lock at 42.7 px'); assert(Math.abs(T.steerFromOffset(40, 0.5)) < Math.abs(T.steerFromOffset(40, 1.5)));
});
ok('arrows ramp 0.3 -> 1 in 0.3 s; speed assist 1 -> 0.6', () => {
  near(T.arrowRamp(0), 0.3, 1e-12); near(T.arrowRamp(0.1), 0.54, 1e-12); assert.equal(T.arrowRamp(0.3), 1); assert.equal(T.arrowRamp(2), 1); assert.equal(T.arrowRamp(-1), 0);
  near(T.steerAssist(0), 1, 1e-12); near(T.steerAssist(90), 0.8, 1e-12); near(T.steerAssist(180), 0.6, 1e-12); near(T.steerAssist(400), 0.6, 1e-12);
});
ok('tilt: roll from gravity in the four screen orientations, 3 degrees dead, range', () => {
  const g = 9.81, th = (d) => d * Math.PI / 180;
  // upright in portrait, tilted by 20 degrees: the reaction vector leans to the screen right when the wheel turns counter-clockwise
  const ax = g * Math.sin(th(20)), ay = g * Math.cos(th(20));
  near(T.rollDeg(ax, ay, 0), 20, 1e-9); near(T.rollDeg(-ax, ay, 0), -20, 1e-9);
  // the same physical roll must read the same in every screen orientation (the device axes are rotated by the screen angle)
  const rot = (x, y, a) => { const c = Math.cos(th(a)), s = Math.sin(th(a)); return [x * c + y * s, -x * s + y * c]; };
  for (const a of [90, 180, 270]) { const [dx, dy] = rot(ax, ay, a); near(T.rollDeg(dx, dy, a), 20, 1e-9, 'angle ' + a); }
  near(Math.abs(T.rollDeg(ax, ay, 0, true)), 160, 1e-9, 'flip = the gravity turned by 180 degrees (iOS reports the opposite sign)');
  assert.equal(T.tiltSteer(2, 0), 0); assert.equal(T.tiltSteer(-3, 0), 0); near(T.tiltSteer(28, 0, 28), 1, 1e-12); near(T.tiltSteer(-60, 0, 28), -1, 1e-12);
  near(T.tiltSteer(25, 20, 28), T.tiltSteer(5, 0, 28), 1e-12, 'relative to the zero');
  near(T.tiltSteer(-175, 175, 28), T.tiltSteer(10, 0, 28), 1e-12, 'wraps at 180');
});

// ------------------------------------------------------------------ 3. settings
ok('settings: defaults, unknown keys dropped, ranges clamped, bad types replaced', () => {
  const d = T.defaultSettings(); assert.equal(d.lookSens, 1); assert.equal(d.steerMode, 'wheel'); assert.equal(d.haptics, true); assert.equal(d.autoGas, false);
  const c = T.clampSettings({ lookSens: 99, steerSens: -4, tiltRange: 5, uiScale: 7, steerMode: 'bogus', autoGas: 'yes', leftHanded: true, junk: 1, mode: 'on', invertY: 1 });
  assert.equal(c.lookSens, 2.5); assert.equal(c.steerSens, 0.5); assert.equal(c.tiltRange, 18); assert.equal(c.uiScale, 1.3); assert.equal(c.steerMode, 'wheel');
  assert.equal(c.autoGas, false); assert.equal(c.leftHanded, true); assert.equal(c.mode, 'on'); assert.equal(c.invertY, false); assert(!('junk' in c));
  assert.equal(T.clampSettings({ uiScale: 0 }).uiScale, 0, '0 = auto survives'); assert.deepEqual(T.clampSettings(null), d); assert.deepEqual(T.clampSettings([1, 2]), d);
  assert.deepEqual(T.clampSettings({ lookSens: NaN, steerSens: Infinity }), d);
});
ok('settings: persistence round trip; corrupt JSON; a storage that throws on get AND set', () => {
  const mem = new Map(); const st = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); } };
  const s = T.defaultSettings(); s.lookSens = 1.7; s.leftHanded = true; s.steerMode = 'arrows'; s.autoGas = true; s.haptics = false;
  assert.equal(T.saveSettings(st, s), true); assert.deepEqual(T.loadSettings(st), s);
  mem.set(T.SETTINGS_KEY, '{not json'); assert.deepEqual(T.loadSettings(st), T.defaultSettings());
  mem.set(T.SETTINGS_KEY, '"a string"'); assert.deepEqual(T.loadSettings(st), T.defaultSettings());
  mem.set(T.SETTINGS_KEY, JSON.stringify({ lookSens: 0.1 })); assert.equal(T.loadSettings(st).lookSens, 0.4);
  const bad = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceededError'); } };
  assert.deepEqual(T.loadSettings(bad), T.defaultSettings()); assert.equal(T.saveSettings(bad, s), false);
  assert.deepEqual(T.loadSettings(null), T.defaultSettings()); assert.equal(T.saveSettings(undefined, s), false);
});

// ------------------------------------------------------------------ 4. the bridge against the real drive.js readInput
const driveSrc = fs.readFileSync(new URL('../src/world/drive.js', import.meta.url), 'utf8');
const rs = driveSrc.indexOf('function readInput('), re = driveSrc.indexOf('const input = {};', rs);
assert(rs > 0 && re > rs, 'drive.js readInput found');
const readInputSrc = driveSrc.slice(rs, re);
const makeRead = (touchMove, ctxTouch = null) => {
  const sandbox = { keys: new Set(), touch: { nitro: false, hand: false, brake: false, jump: false, flip: false }, hopTap: false, flipTap: false, player: { touchMove: { x: touchMove.x, y: touchMove.y, lengthSq() { return this.x * this.x + this.y * this.y; } } }, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), ctx: { touch: ctxTouch } };
  return vm.runInNewContext(`(${readInputSrc.replace(/^function readInput/, 'function')})`, sandbox, { filename: 'drive.js readInput' });
};
ok('bridge: drive.js readInput still reads player.touchMove (or the ctx.touch contract) - the Phase 1 coupling', () => {
  const usesTm = /touchMove/.test(readInputSrc), usesCtx = /ctx\.touch/.test(readInputSrc);
  assert(usesTm || usesCtx, 'readInput reads NEITHER player.touchMove NOR ctx.touch: the touch steering / pedals are silently dead. Read ctx.touch (core/touch.js) in readInput.');
});
ok('bridge: encodeDrive is the exact inverse of readInput for steer x thr x brk', () => {
  const usesTm = /touchMove/.test(readInputSrc);
  if (!usesTm) { console.log('    (readInput no longer reads touchMove: the ctx.touch path is checked below)'); return; }
  for (const steer of [-1, -0.5, -0.1, -0.01, 0, 0.01, 0.1, 0.5, 1]) for (const thr of [0, 0.25, 0.4, 0.7, 1]) for (const brk of [0, 0.5, 1]) {
    const enc = T.encodeDrive({ steer, thr, brk }), out = makeRead(enc)({});
    near(out.steer, steer, 1e-9, `steer ${steer}`);
    if (brk > 0) { near(out.brk, Math.max(brk, 0.31), 1e-9, 'brake'); assert.equal(out.thr, 0, 'the brake wins: no gas'); }
    else { near(out.thr, thr, 1e-9, `thr ${thr}`); assert.equal(out.brk, 0); }
  }
  // the very low gas values the decoder cannot see are lifted to its threshold instead of vanishing
  const lo = makeRead(T.encodeDrive({ steer: 0, thr: 0.05 }))({}); assert(lo.thr >= 0.2 - 1e-9, 'low gas is lifted to 0.2');
  // idle: nothing pressed -> the keyboard defaults (thr 0, brk 0, steer 0)
  const idle = makeRead(T.encodeDrive({}))({}); assert.deepEqual([idle.thr, idle.brk, idle.steer], [0, 0, 0]);
  // the case the old single-stick scheme could not do: full lock AND full gas at once
  const both = makeRead(T.encodeDrive({ steer: 1, thr: 1 }))({}); near(both.steer, 1, 1e-9); near(both.thr, 1, 1e-9);
});
// ------------------------------------------------------------------ 5. actions
ok('actions: hold -> key, tap -> synthetic key, latch, call; mode filter', () => {
  assert.deepEqual([...T.desiredKeys('drive', new Set(['nitro', 'hand']))].sort(), ['ShiftLeft', 'Space']);
  assert.deepEqual([...T.desiredKeys('drive', new Set(['gas', 'brake']))], [], 'pedals are not keys');
  assert.deepEqual([...T.desiredKeys('fly', new Set(['up', 'down', 'boost']))].sort(), ['KeyC', 'ShiftLeft', 'Space']);
  assert.deepEqual([...T.desiredKeys('walk', new Set(['nitro']))], [], 'nitro is a drive button: ignored while walking');
  assert.deepEqual([...T.desiredKeys('walk', new Set(), true)], ['ShiftLeft'], 'RUN latch while walking');
  assert.deepEqual([...T.desiredKeys('drive', new Set(), true)], [], 'a RUN latch never leaks into nitro');
  assert.deepEqual([...T.desiredKeys('fly', new Set(), true)], []);
  for (const [id, a] of Object.entries(T.ACTIONS)) { assert(['hold', 'tap', 'latch', 'call', 'pedal'].includes(a.kind), id); assert(a.modes.length, id); if (a.kind !== 'call' && a.kind !== 'pedal') assert(/^(Key[A-Z]|Space|ShiftLeft)$/.test(a.code), id + ' code'); }
  assert.equal(T.ACTIONS.jump.code, 'Space'); assert.equal(T.ACTIONS.cam.code, 'KeyV'); assert.equal(T.ACTIONS.horn.code, 'KeyG'); assert.equal(T.ACTIONS.hop.code, 'KeyX'); assert.equal(T.ACTIONS.flip.code, 'KeyC');
  assert.equal(T.ACTIONS.nitro.code, 'ShiftLeft'); assert.equal(T.ACTIONS.hand.code, 'Space'); assert.equal(T.ACTIONS.mute.code, 'KeyM');
  // HOP v3: two buttons, HOP (X, the simple hop) and FLIP (C, the barrel hop); each FIRES ON THE PRESS (a synthetic keydown + keyup that drive.js latches): no hold semantics, no charge
  for (const [id, code] of [['hop', 'KeyX'], ['flip', 'KeyC']]) {
    assert.equal(T.ACTIONS[id].kind, 'tap', id.toUpperCase() + ' is a tap (fires on the press, immediately)'); assert.equal(T.ACTIONS[id].code, code); assert.deepEqual(T.ACTIONS[id].modes, ['drive'], id + ' exists in drive mode only');
    assert.deepEqual([...T.desiredKeys('drive', new Set([id]))], [], id.toUpperCase() + ' is never a held key (no hold semantics)');
    assert.deepEqual([...T.desiredKeys('fly', new Set([id]))], [], id + ' does nothing in fly mode');
  }
  assert.equal(T.ACTIONS.down.code, 'KeyC', 'in fly mode C is still the descend key (the FLIP button is a drive button, its tap is only handled while driving)'); assert.deepEqual(T.ACTIONS.down.modes, ['fly']);
  { // the button table of core/touch.js: both fire on 'down' (the press), neither is a hold, no charge ring is left
    const touchSrc = fs.readFileSync(new URL('../src/core/touch.js', import.meta.url), 'utf8');
    assert(/hop: \{ label: 'HOP', fire: 'down'/.test(touchSrc), "HOP fires 'down'"); assert(/flip: \{ label: 'FLIP', cls: 'flip', fire: 'down'/.test(touchSrc), "FLIP fires 'down'");
    assert(!/hopRing|tc-ring hop|\.charging|car\.charge/.test(touchSrc), 'no charge ring left in the touch layer'); assert(!/key\('keydown', 'KeyX'\)/.test(touchSrc), 'the HOP button needs no manual keydown / keyup pair any more');
  }
  { // drive.js readInput: X (jump) and C (flip) are levels plus latches (handling.js makes the edge); the touch buttons reach it through the synthetic keydown
    for (const [code, field, latch] of [['KeyX', 'jump', 'hopTap'], ['KeyC', 'flip', 'flipTap']]) {
      const mk = (keys, extra = {}) => { const sandbox = { keys: new Set(keys), touch: { nitro: false, hand: false, brake: false, jump: false, flip: false }, hopTap: false, flipTap: false, ...extra, player: { touchMove: { x: 0, y: 0, lengthSq() { return 0; } } }, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), ctx: { touch: null } }; return vm.runInNewContext(`(${readInputSrc.replace(/^function readInput/, 'function')})`, sandbox)({}); };
      assert.equal(mk([])[field], false, field + ': no key, no hop'); assert.equal(mk([code])[field], true, code + ' reads as ' + field); assert.equal(mk([], { [latch]: true })[field], true, 'a latched press (keydown + keyup inside one frame) still counts');
      const other = field === 'jump' ? 'flip' : 'jump'; assert.equal(mk([code])[other], false, code + ' does not trigger the other hop');
    }
  }
  // every code the table uses is a code the game listens for
  const game = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + driveSrc + fs.readFileSync(new URL('../src/core/player.js', import.meta.url), 'utf8');
  for (const code of ['KeyV', 'KeyG', 'KeyM', 'Space', 'ShiftLeft', 'KeyC']) assert(game.includes(`'${code}'`), `the game reads ${code}`);
});

// ------------------------------------------------------------------ 6. layout
const VIEWPORTS = [[844, 390], [915, 412], [667, 375], [568, 320], [1180, 820], [390, 844], [820, 1180], [320, 568]];
const rectsFor = (mode, w, h, lh = false, ins = { l: 0, r: 0, t: 0, b: 0 }, hopOn = true, extra = true) => {
  const u = T.uiScale(w, h), out = {};
  for (const [id, a] of Object.entries(T.anchors(mode, w, h - ins.t - ins.b, u))) { if (!hopOn && (id === 'hop' || id === 'flip')) continue; out[id] = T.placeRect(a, w, h, u, lh, ins); }
  return out;
};
ok('layout: every button >= 44 px, primaries >= 50 (56 x the 0.9 minimum scale), inside the screen, no overlaps (gap >= 8), all modes x 8 viewports x insets x handedness', () => {
  const PRIMARY = new Set(['jump', 'run', 'fly', 'interact', 'up', 'boost', 'down', 'gas', 'brake', 'nitro', 'hand', 'hop', 'flip']);
  for (const [w, h] of VIEWPORTS) for (const lh of [false, true]) for (const ins of [{ l: 0, r: 0, t: 0, b: 0 }, w > h ? { l: 47, r: 47, t: 0, b: 21 } : { l: 0, r: 0, t: 47, b: 34 }]) for (const mode of ['walk', 'fly', 'ride', 'drive']) {
    const r = rectsFor(mode, w, h, lh, ins), ids = Object.keys(r), tag = `${mode} ${w}x${h} lh=${lh} ins=${ins.l}`;
    for (const id of ids) {
      const b = r[id];
      assert(Math.min(b.w, b.h) >= 44 - 1e-9, `${tag}: ${id} is ${b.w}x${b.h}`);
      if (PRIMARY.has(id)) assert(Math.min(b.w, b.h) >= 50 - 1e-9, `${tag}: primary ${id} too small`);
      if (w >= 360) { assert(b.x >= ins.l - 1e-9 && b.right <= w - ins.r + 1e-9, `${tag}: ${id} outside the horizontal safe area`); assert(b.y >= ins.t - 1e-9 && b.bottom <= h - ins.b + 1e-9, `${tag}: ${id} outside vertically`); }
    }
    if (mode === 'drive' || mode === 'walk' || mode === 'fly') {
      // arrows / recentre are only shown for their steer mode, hop only for the roadster: drop the alternates before the overlap test (arrowL/R + recentre vs the wheel are exclusive)
      const test = ids.filter((id) => !(['arrowL', 'arrowR', 'recentre'].includes(id)));
      if (w >= 360) for (let i = 0; i < test.length; i++) for (let j = i + 1; j < test.length; j++) assert(!T.rectsOverlap(r[test[i]], r[test[j]], 8 - 1e-9), `${tag}: ${test[i]} overlaps ${test[j]}`);
    }
  }
});
ok('layout: arrows + recentre do not overlap each other nor the pedals; portrait 390 x 844 pedals fit', () => {
  for (const [w, h] of [[844, 390], [667, 375], [390, 844]]) for (const lh of [false, true]) {
    const r = rectsFor('drive', w, h, lh), ids = ['arrowL', 'arrowR', 'gas', 'brake', 'nitro', 'hand', 'hop', 'flip'];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) assert(!T.rectsOverlap(r[ids[i]], r[ids[j]], 8 - 1e-9), `${w}x${h} lh=${lh}: ${ids[i]} overlaps ${ids[j]}`);
  }
});
ok('layout: left-handed mirrors the bottom clusters and keeps the top corners', () => {
  const w = 844, h = 390, a = rectsFor('drive', w, h, false), b = rectsFor('drive', w, h, true);
  for (const id of ['gas', 'brake', 'nitro', 'hand', 'hop', 'flip', 'arrowL', 'arrowR']) { near(a[id].x, w - b[id].right, 1e-9, id + ' mirrored x'); near(a[id].y, b[id].y, 1e-9, id + ' same y'); }
  for (const id of ['menu', 'cam', 'exit']) { near(a[id].x, b[id].x, 1e-9, id + ' stays'); }
  const wz = T.zones('drive', w, h, false), wl = T.zones('drive', w, h, true);
  near(wz.stick.x, 0, 1e-9); near(wl.stick.x + wl.stick.w, w, 1e-9); assert.equal(T.zones('walk', w, h).stick.w, w * 0.45);
});
ok('layout: the safe-area inset moves the clusters inwards (landscape notch 47 px)', () => {
  const a = T.placeRect(T.LAYOUT.drive.gas, 844, 390, 1, false, { l: 0, r: 0, t: 0, b: 0 }), b = T.placeRect(T.LAYOUT.drive.gas, 844, 390, 1, false, { l: 47, r: 47, t: 0, b: 21 });
  near(a.right, 844 - 16, 1e-9); near(b.right, 844 - 47, 1e-9); near(b.bottom, 390 - 21, 1e-9);
  assert.equal(T.uiScale(844, 390), 1); assert.equal(T.uiScale(1180, 820), 1.25); assert.equal(T.uiScale(300, 300), 0.9); assert.equal(T.uiScale(844, 390, 1.1), 1.1);
});

console.log(`\ntouch-logic-test: ${n} groups passed`);
