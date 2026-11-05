// core/touch-logic.js - the PURE part of the touch controls (no DOM, no three.js): settings + persistence, the stick / steering / tilt curves, the encoder that feeds the
// drive.js readInput through player.touchMove, the action -> key table and the layout geometry. core/touch.js (the DOM owner) imports it; tools/touch-logic-test.mjs tests it in node.
// docs/MOBILE.md has the design.

// ------------------------------------------------------------------ settings
export const SETTINGS_KEY = 'piter.touch';
/** every setting with its default and range; clampSettings() drops unknown keys and replaces a bad value by the default */
export const SPEC = {
  mode:        { def: 'auto',  oneOf: ['auto', 'on', 'off'] },          // touch controls: auto (coarse pointer) / forced on / forced off
  lookSens:    { def: 1,       min: 0.4, max: 2.5 },                    // x the 2.2 px multiplier of the old canvas look
  invertY:     { def: false },
  steerMode:   { def: 'wheel', oneOf: ['wheel', 'arrows', 'tilt'] },
  steerSens:   { def: 1,       min: 0.5, max: 1.5 },                    // 1.5 = a shorter swipe reaches full lock
  steerAssist: { def: true },                                           // the lock shrinks with speed (steerAssist())
  tiltRange:   { def: 28,      min: 18, max: 40 },                      // degrees of phone roll for full lock
  autoGas:     { def: false },
  leftHanded:  { def: false },                                          // swaps the left zone and the right cluster
  haptics:     { def: true },
  uiScale:     { def: 0,       min: 0.8, max: 1.3, zeroIsAuto: true },  // 0 = automatic (uiScale())
  runLatch:    { def: false },                                          // RUN button stays on (walking)
  coachWalk:   { def: false },                                          // the one-time hints have been shown
  coachDrive:  { def: false },
};
export function defaultSettings() { const o = {}; for (const k in SPEC) o[k] = SPEC[k].def; return o; }
export function clampSettings(raw) {
  const out = defaultSettings();
  if (!raw || typeof raw !== 'object') return out;
  for (const k in SPEC) {
    const s = SPEC[k], v = raw[k];
    if (v === undefined) continue;
    if (typeof s.def === 'boolean') { if (typeof v === 'boolean') out[k] = v; }
    else if (s.oneOf) { if (s.oneOf.includes(v)) out[k] = v; }
    else if (typeof v === 'number' && Number.isFinite(v)) { out[k] = (v === 0 && s.zeroIsAuto) ? 0 : Math.min(s.max, Math.max(s.min, v)); }
  }
  return out;
}
/** read the settings from a Storage-like object; never throws (blocked storage, private mode, corrupt JSON -> defaults) */
export function loadSettings(storage) {
  try { const t = storage && storage.getItem(SETTINGS_KEY); return clampSettings(t ? JSON.parse(t) : null); } catch (e) { return defaultSettings(); }
}
/** write the settings; returns false (and keeps going) when the storage refuses */
export function saveSettings(storage, settings) {
  try { storage.setItem(SETTINGS_KEY, JSON.stringify(clampSettings(settings))); return true; } catch (e) { return false; }
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const nz = (v) => (v === 0 ? 0 : v);      // no -0

// ------------------------------------------------------------------ walk stick
export const STICK = { radius: 56, dead: 0.08, expo: 1.2, full: 0.92, run: 0.95 };
/** the floating stick: the finger is (dx, dy) px from where it landed. Dead zone 8 %, then a 1.2 power curve that reaches 1 at 92 % of the ring (run = the player's own 0.95 test).
 *  Returns { x, y } (x right, y DOWN = back: player.touchMove), mag (0..1) and run. */
export function stickCurve(dx, dy, radius = STICK.radius, o = STICK) {
  const len = Math.hypot(dx, dy), m = Math.min(1, len / radius);
  if (!(m > o.dead)) return { x: 0, y: 0, mag: 0, run: false };
  const s = Math.pow(clamp((m - o.dead) / (o.full - o.dead), 0, 1), o.expo);
  return { x: nz(dx / len * s), y: nz(dy / len * s), mag: s, run: s > o.run };
}

// ------------------------------------------------------------------ steering
export const WHEEL = { lock: 64, dead: 6, expo: 1.35 };
/** the floating wheel: only the horizontal offset counts. A drag to the RIGHT is a right turn (steer < 0: the car's steer > 0 = left, handling.js). sens > 1 shortens the swipe to full lock. */
export function steerFromOffset(dx, sens = 1, o = WHEEL) {
  const lock = o.lock / clamp(sens, 0.25, 4), a = Math.abs(dx);
  if (!(a > o.dead)) return 0;
  const t = Math.pow(clamp((a - o.dead) / (lock - o.dead), 0, 1), o.expo);
  return nz(-Math.sign(dx) * t);
}
/** the on-screen arrows ramp up while held so a short tap is a gentle correction: 0.3 at once, full lock after 0.3 s */
export function arrowRamp(heldSeconds) { return heldSeconds < 0 ? 0 : Math.min(1, 0.3 + 2.4 * heldSeconds); }
/** speed-sensitive lock: 1 at a stand, 0.6 at 180 km/h and more */
export function steerAssist(kmh) { return 1 - 0.4 * clamp(Math.abs(kmh) / 180, 0, 1); }

// ------------------------------------------------------------------ tilt
/** gravity (accelerationIncludingGravity) in device axes -> the screen frame (x right, y up) for screen.orientation.angle 0 / 90 / 180 / 270 */
export function screenGravity(ax, ay, angle = 0) {
  switch (((Math.round(angle / 90) % 4) + 4) % 4) {
    case 1: return { x: -ay, y: ax };
    case 2: return { x: -ax, y: -ay };
    case 3: return { x: ay, y: -ax };
    default: return { x: ax, y: ay };
  }
}
/** roll of the phone around the screen normal in degrees, 0 = upright, > 0 = the wheel turned counter-clockwise (steer left). iOS reports the gravity with the opposite sign (flip). [VERIFY on a device] */
export function rollDeg(ax, ay, angle = 0, flip = false) {
  const g = screenGravity(flip ? -ax : ax, flip ? -ay : ay, angle);
  return Math.atan2(g.x, g.y) * 180 / Math.PI;
}
const wrap180 = (d) => ((d + 540) % 360) - 180;
/** steer from the roll relative to the zero captured at calibration: 3 degrees dead zone, full lock at `range` degrees, a 1.2 curve */
export function tiltSteer(roll, zero = 0, range = 28, dead = 3, expo = 1.2) {
  const d = wrap180(roll - zero), a = Math.abs(d);
  if (!(a > dead)) return 0;
  return nz(Math.sign(d) * Math.pow(clamp((a - dead) / (range - dead), 0, 1), expo));
}

// ------------------------------------------------------------------ the bridge into drive.js readInput (Phase 1)
// drive.js (readInput) reads the WALK stick player.touchMove = tm:  if (tm.lengthSq() > 0.01) { steer = clamp(-tm.x * 1.4, -1, 1); if (tm.y < -0.15) thr = clamp(-tm.y * 1.3, 0, 1); else if (tm.y > 0.3) brk = clamp(tm.y, 0, 1); }
// encodeDrive() is the exact inverse; decodeDrive() is a copy of that formula (the tests keep the two honest, and tools/touch-browser-test.mjs checks the real car).
export const BRIDGE = { steerK: 1.4, thrK: 1.3, thrMin: 0.2, brkMin: 0.31, idleY: 0.12 };
export function encodeDrive({ steer = 0, thr = 0, brk = 0 }) {
  steer = clamp(steer, -1, 1);
  let y = 0;
  if (brk > 0) y = clamp(Math.max(brk, BRIDGE.brkMin), 0, 1);                       // the brake wins over the gas (a held brake at a stand = reverse)
  else if (thr > 0) y = -clamp(Math.max(thr, BRIDGE.thrMin), 0, 1) / BRIDGE.thrK;
  else if (steer !== 0) y = BRIDGE.idleY;                                            // neutral pedal value: keeps |tm| above the 0.1 threshold so small steering is not dropped
  return { x: nz(-steer / BRIDGE.steerK), y: nz(y) };
}
export function decodeDrive(tmx, tmy, base = { steer: 0, thr: 0, brk: 0 }) {
  const out = { ...base };
  if (tmx * tmx + tmy * tmy > 0.01) { out.steer = clamp(-tmx * 1.4, -1, 1); if (tmy < -0.15) out.thr = clamp(-tmy * 1.3, 0, 1); else if (tmy > 0.3) out.brk = clamp(tmy, 0, 1); }
  return out;
}

// ------------------------------------------------------------------ actions
// kind: hold = a key code kept in player.keys while the finger is down; tap = a synthetic keydown + keyup (window handlers read e.code, never isTrusted); latch = a toggle that holds a key;
// call = a direct call. 'modes' = where the button exists.
export const ACTIONS = {
  jump:     { kind: 'tap',   code: 'Space',     modes: ['walk'] },
  run:      { kind: 'latch', code: 'ShiftLeft', modes: ['walk'] },
  fly:      { kind: 'call',  call: 'toggleFly', modes: ['walk', 'fly'] },
  up:       { kind: 'hold',  code: 'Space',     modes: ['fly'] },
  down:     { kind: 'hold',  code: 'KeyC',      modes: ['fly'] },
  boost:    { kind: 'hold',  code: 'ShiftLeft', modes: ['fly'] },
  interact: { kind: 'call',  call: 'interact',  modes: ['walk', 'ride'] },
  gas:      { kind: 'pedal', modes: ['drive'] },        // pedals and arrows are held buttons that are not keys: they feed ctx.touch / the encoder
  brake:    { kind: 'pedal', modes: ['drive'] },
  arrowL:   { kind: 'pedal', modes: ['drive'] },
  arrowR:   { kind: 'pedal', modes: ['drive'] },
  recentre: { kind: 'call',  call: 'recentre', modes: ['drive'] },
  nitro:    { kind: 'hold',  code: 'ShiftLeft', modes: ['drive'] },
  hand:     { kind: 'hold',  code: 'Space',     modes: ['drive'] },
  hop:      { kind: 'tap',   code: 'KeyX',      modes: ['drive'] },        // the simple hop: fires on the press (a synthetic keydown, drive.js latches it)
  flip:     { kind: 'tap',   code: 'KeyC',      modes: ['drive'] },        // the barrel hop: the same, KeyC (drive only: in fly mode C is the descend key and there is no FLIP button)
  cam:      { kind: 'tap',   code: 'KeyV',      modes: ['drive'] },
  horn:     { kind: 'tap',   code: 'KeyG',      modes: ['drive'] },
  repair:   { kind: 'call',  call: 'repair',    modes: ['drive'] },
  auto:     { kind: 'call',  call: 'autoGas',   modes: ['drive'] },
  exit:     { kind: 'call',  call: 'exit',      modes: ['drive'] },
  mute:     { kind: 'tap',   code: 'KeyM',      modes: ['walk', 'fly', 'ride', 'drive'] },
  menu:     { kind: 'call',  call: 'menu',      modes: ['walk', 'fly', 'ride', 'drive'] },
};
/** the key codes that must be in player.keys: the held buttons (and the RUN latch while walking) */
export function desiredKeys(mode, held, runLatched = false) {
  const keys = new Set();
  for (const id of held) { const a = ACTIONS[id]; if (a && a.kind === 'hold' && a.modes.includes(mode)) keys.add(a.code); }
  if (runLatched && mode === 'walk') keys.add(ACTIONS.run.code);
  return keys;
}

// ------------------------------------------------------------------ layout
/** UI scale: the shorter screen side / 390, kept in 0.9..1.25; tablets (shorter side >= 700) 1.25; settings.uiScale overrides */
export function uiScale(w, h, setting = 0) {
  if (setting > 0) return setting;
  const m = Math.min(w, h);
  return m >= 700 ? 1.25 : clamp(m / 390, 0.9, 1.25);
}
// Anchors: side 'r' | 'l' = the thumb side (swapped by left-handed), v 'b' | 't' = from the bottom / top; gx, gy = the gap from that screen edge to the button (at u = 1, before the safe area:
// the effective gap is never below the 16 px / 12 px base), w, h = the size.
const A = (side, v, gx, gy, w, h = w) => ({ side, v, gx, gy, w, h });
export const LAYOUT = {
  common: {                                                      // always (all modes)
    menu: A('r', 't', 16, 12, 44),
  },
  walk: {
    jump: A('r', 'b', 16, 16, 68), run: A('r', 'b', 96, 16, 56), fly: A('r', 'b', 16, 96, 56), interact: A('r', 'b', 96, 88, 64),
  },
  fly: {
    up: A('r', 'b', 16, 16, 68), boost: A('r', 'b', 96, 16, 56), fly: A('r', 'b', 16, 96, 56), down: A('r', 'b', 96, 88, 64),
  },
  ride: {
    interact: A('r', 'b', 16, 16, 68),
  },
  drive: {
    gas: A('r', 'b', 16, 16, 68, 86), brake: A('r', 'b', 96, 16, 68, 86), nitro: A('r', 'b', 16, 114, 68, 56), hand: A('r', 'b', 96, 114, 68, 56), hop: A('r', 'b', 96, 182, 56), flip: A('r', 'b', 16, 182, 56),
    cam: A('r', 't', 16, 72, 60, 44), exit: A('r', 't', 88, 72, 60, 44),
    arrowL: A('l', 'b', 16, 16, 64), arrowR: A('l', 'b', 92, 16, 64), recentre: A('l', 'b', 16, 92, 48),
  },
};
/** the anchors of a mode (plus the always-there ones) for a w x h screen; a narrow (portrait phone) screen gets smaller steering arrows so that they clear the pedals */
export function anchors(mode, w, h = Infinity, u = 1) {
  const a = { ...LAYOUT.common, ...LAYOUT[mode] };
  if (mode === 'drive' && w < 480) { a.arrowL = A('l', 'b', 12, 16, 50); a.arrowR = A('l', 'b', 74, 16, 50); }
  // On short landscape screens (or enlarged controls), optional car tricks sit
  // above the steering thumb instead of colliding with camera / exit.
  if (mode === 'drive' && w > h && h / u < 370) {
    a.hop = A('l', 'b', 16, 152, 56); a.flip = A('l', 'b', 84, 152, 56);
  }
  return a;
}
/** the rect of an anchor on a w x h screen: u = UI scale, lh = left-handed, ins = the safe-area insets { l, r, t, b } in px. The gap from the screen edge is the anchor gap x u plus whatever the inset exceeds the 16 px base by. */
export function placeRect(a, w, h, u = 1, lh = false, ins = { l: 0, r: 0, t: 0, b: 0 }) {
  let side = a.side;
  if (lh && a.v === 'b') side = side === 'r' ? 'l' : 'r';        // left-handed swaps the bottom clusters (the thumbs); the top corners stay
  const sw = Math.max(44, a.w * u), sh = Math.max(44, a.h * u);        // never below a fingertip
  const gx = a.gx * u + Math.max(0, (side === 'r' ? ins.r : ins.l) - 16 * u);
  const gy = a.gy * u + Math.max(0, (a.v === 'b' ? ins.b : ins.t) - (a.v === 'b' ? 16 : 12) * u);
  const x = side === 'r' ? w - gx - sw : gx, y = a.v === 'b' ? h - gy - sh : gy;
  return { x, y, w: sw, h: sh, right: x + sw, bottom: y + sh };
}
/** the zones: walk = the stick (left 45 %, from 25 % down) over a full-screen look layer; drive = the wheel (left 42 %, lower 70 %) */
export function zones(mode, w, h, lh = false) {
  const stick = mode === 'drive' ? { x: 0, y: h * 0.3, w: w * 0.42, h: h * 0.7 } : { x: 0, y: h * 0.25, w: w * 0.45, h: h * 0.75 };
  if (lh) stick.x = w - stick.w;
  return { stick, look: { x: 0, y: 0, w, h } };
}
export const rectsOverlap = (a, b, gap = 0) => a.x < b.right + gap && b.x < a.right + gap && a.y < b.bottom + gap && b.y < a.bottom + gap;
