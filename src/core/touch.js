// core/touch.js - THE owner of the touch UI (phones and tablets): a walk / fly / ride layout (floating stick, look drag, JUMP, RUN, FLY, UP / DOWN, a contextual USE button, menu) and an
// NFS-like drive layout (floating steering wheel or arrows or tilt, GAS / BRAKE pedals, NITRO, DRIFT, HOP / FLIP, camera, horn, exit), a settings panel, haptics, the mobile boot bits (fullscreen,
// orientation lock, screen wake lock) and the portrait "rotate your phone" hint. Design: docs/MOBILE.md.
//
// It does NOTHING unless <html> carries the class `tc` (the inline script of index.html sets it for (pointer: coarse) or ?touch=1; ?touch=0 forces it off), so the desktop page is untouched.
// Every control is a Pointer Events role (one pointer = one role, setPointerCapture); nothing here calls three.js. The values travel through the EXISTING input channels (Phase 1):
//   walk stick   -> player.touchMove (x right, y DOWN)                       look drag  -> player.look.dx / dy (the accumulator the mouse uses)
//   hold buttons -> player.keys (Space / ShiftLeft / KeyC)                  one-shots  -> a synthetic KeyboardEvent on window (the handlers read e.code, never isTrusted)
//   USE          -> ctx.interact.use()                                        EXIT       -> ctx.drive.exit()
//   car          -> player.touchMove through the exact inverse of drive.js readInput (touch-logic.js encodeDrive) AND the clean contract ctx.touch (Phase 2: readInput can read it).
// The pure parts (curves, settings, the encoder, the layout geometry) are in core/touch-logic.js and tested in node (tools/touch-logic-test.mjs).
import * as T from './touch-logic.js';

const CSS = `
html.tc, html.tc body { position: fixed; inset: 0; width: 100%; overscroll-behavior: none; touch-action: manipulation; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
html.tc canvas#scene { touch-action: none; }
html.tc select, html.tc input, html.tc button { font-size: 16px; }
html.tc .chip, html.tc #quality, html.tc #places { min-height: 44px; font-size: 16px; }      /* (the chips are replaced by the menu below, but a select under 16 px zooms iOS on focus) */
html.tc #places, html.tc #fly, html.tc #quality, html.tc #mute, html.tc #interact, html.tc #help, html.tc #coords { display: none !important; }
html.tc { --hud-surface: rgba(17,30,48,.82); --hud-ink: #f4f0e5; --hud-line: rgba(244,240,229,.32); --hud-accent: #efc76a; --hud-radius: 12px; --hud-x: max(16px, var(--tc-l, 0px)); --hud-y: max(12px, var(--tc-t, 0px)); --mm: 92px; }
html.tc #corner { left: 50%; right: auto; flex-wrap: nowrap; transform: translateX(-50%); top: var(--hud-y); }
html.tc #minimap { left: var(--hud-x); top: var(--hud-y); bottom: auto; }
html.tc #minimap canvas { box-shadow: 0 0 0 2px rgba(244,240,229,.75), 0 2px 8px rgba(0,0,0,.2); }
html.tc #minimap .mm-street { bottom: auto; left: calc(100% + 10px); top: 0; width: max-content; max-width: min(190px, calc(50vw - var(--hud-x) - 146px)); border: 1px solid var(--hud-line); border-radius: var(--hud-radius); background: var(--hud-surface); color: var(--hud-ink); padding: 8px 10px; box-shadow: none; }
html.tc #minimap .mm-street b { display: block; font-size: 12px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; }
html.tc #minimap .mm-street i { display: block; margin: 3px 0 0; font-size: 10px; color: #ccd3dc; }
html.tc #minimap .mm-n { width: 18px; height: 18px; margin: -9px 0 0 -9px; font-size: 10px; line-height: 18px; box-shadow: 0 0 0 1px var(--hud-ink); }
html.tc #stats { bottom: auto; right: auto; left: 50%; top: calc(max(20px, var(--tc-t, 0px) + 8px) + 40px); transform: translateX(-50%); }
html.tc .panel-x { min-height: 44px; padding: 0 22px; font-size: 14px; }
html.tc #panel .panel-body { touch-action: pan-y; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; -webkit-user-select: none; user-select: none; }
html.tc #panel { padding: max(12px, var(--tc-t, 0px)) max(12px, var(--tc-r, 0px)) max(12px, var(--tc-b, 0px)) max(12px, var(--tc-l, 0px)); }
html.tc #panel .panel-card { max-height: calc(100vh - 24px); max-height: calc(100dvh - 24px); }
/* Speed sits below the map; navigation messages share its street label. */
html.tc #toast { display: none !important; }
html.tc #minimap .mm-street.notice { white-space: normal; width: max-content; }
html.tc #minimap .mm-street.notice b { overflow: visible; }
html.tc #minimap .mm-street.notice i { display: none; }
html.tc #drive .d-touch, html.tc #drive .d-keys, html.tc #drive .d-nitro, html.tc #drive .d-nlab, html.tc #drive .d-condition { display: none !important; }
html.tc body.driving #drive .d-speedo { left: var(--hud-x); right: auto; top: calc(var(--hud-y) + var(--mm) + 8px); bottom: auto; width: var(--mm); height: 28px; transform: none; filter: none; display: flex; align-items: center; justify-content: center; padding: 0; border: 0; border-radius: 0; background: transparent; }
html.tc #drive .d-speedo svg { display: none; }
html.tc #drive .d-speedo { box-sizing: border-box; }
html.tc #drive .d-num { position: static; font: 700 24px/1 "Rubik", sans-serif; letter-spacing: -.03em; transform: none; text-shadow: none; color: var(--hud-ink); }
html.tc #drive .d-unit, html.tc #drive .d-gear { display: none; }
html.tc #drive .d-drift { top: calc(var(--hud-y) + 55px); font-size: 22px; }
html.tc #drive .d-drift small { font-size: 9px; letter-spacing: .12em; }
html.tc.tc-short body.driving { --mm: 56px; }
html.tc body.playing #diag-toggle { right: auto; min-height: 44px; padding: 0; border: 1px solid var(--hud-line); border-radius: var(--hud-radius); background: var(--hud-surface); color: var(--hud-ink); touch-action: manipulation; }
#diag-toggle svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
@media (orientation: portrait) {
  html.tc #tc-coach, #tc-coach { top: 24vh !important; }
  html.tc #corner { left: auto; right: max(16px, var(--tc-r, 0px)); top: calc(var(--hud-y) + 120px * var(--tc-u, 1)); transform: none; }
  html.tc #minimap .mm-street { top: calc(100% + 12px); left: 0; max-width: calc(100vw - 128px); }
  html.tc body.driving { --mm: 56px; }
  html.tc body.driving #minimap .mm-street { top: calc(100% + 54px); }
}
body.noui #tc .tc-b:not([data-id="menu"]), body.noui #tc .tc-ghost, body.noui #tc-label, body.noui #tc-coach { display: none !important; }

#tc { position: fixed; inset: 0; z-index: 4; display: none; pointer-events: none; font-family: "Rubik", "Noto Sans", "Segoe UI", sans-serif; color: var(--hud-ink); --tc-u: 1; touch-action: none; }
body.playing #tc { display: block; }
#tc * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; user-select: none; -webkit-user-select: none; }
#tc .tc-zone { position: absolute; pointer-events: auto; touch-action: none; }
#tc-look { inset: 0; }
#tc .tc-b { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; margin: 0; padding: 0; border: 1px solid var(--hud-line); border-radius: var(--hud-radius); background: var(--hud-surface);
  color: var(--hud-ink); font: 700 calc(11px * var(--tc-u)) / 1 "Rubik", "Noto Sans", sans-serif; letter-spacing: .025em; text-shadow: none; pointer-events: auto; touch-action: none; cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,.15); transition: background .1s, opacity .15s; overflow: visible; }
#tc .tc-b[hidden] { display: none !important; }
#tc .tc-b.down, #tc .tc-b.on { background: var(--hud-accent); color: #111e30; border-color: var(--hud-accent); }
#tc .tc-b.pedal { font-size: calc(12px * var(--tc-u)); }
#tc .tc-b.small { font-size: calc(10px * var(--tc-u)); }
#tc .tc-b.gas, #tc .tc-b[data-id="jump"], #tc .tc-b[data-id="up"] { background: var(--hud-accent); color: #111e30; border-color: #f5d991; }
#tc .tc-b.brake { border-bottom: 3px solid #d8958f; }
#tc .tc-b.flip { background: rgba(53,150,255,.5); border-color: rgba(190,235,255,.95); } #tc .tc-b.flip.down { background: rgba(120,200,255,.72); }
#tc .tc-b.gas.down { background: #ffe5a4; } #tc .tc-b.brake.down { background: #d8958f; color: #111e30; }
#tc .tc-b:focus-visible { outline: 3px solid var(--hud-accent); outline-offset: 3px; }
#tc .tc-b.dim { opacity: .55; }
#tc .tc-b svg { width: 38%; height: 38%; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
#tc .tc-b.arrow svg { width: 52%; height: 52%; }
#tc .tc-b span { pointer-events: none; }
#tc .tc-ring { position: absolute; left: 10px; right: 10px; bottom: 8px; height: 3px; border-radius: 3px; pointer-events: none; background: linear-gradient(to right, #8ccee3 calc(var(--p, 1) * 100%), rgba(255,255,255,.18) 0); }
#tc .tc-ring.low { background: linear-gradient(to right, #d8958f calc(var(--p, 1) * 100%), rgba(255,255,255,.18) 0); }
#tc .tc-ghost { position: absolute; width: calc(112px * var(--tc-u)); height: calc(112px * var(--tc-u)); margin: calc(-56px * var(--tc-u)) 0 0 calc(-56px * var(--tc-u)); border-radius: 50%; pointer-events: none; opacity: .0; transition: opacity .2s; }
#tc .tc-ghost.show { opacity: .9; }
#tc .tc-ghost .base { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(255,255,255,.7); background: rgba(12,18,44,.28); }
#tc .tc-ghost.idle { opacity: .45; }
#tc .tc-ghost.run .base { border-color: #f2c14e; background: rgba(242,193,78,.2); }
#tc .tc-ghost .knob { position: absolute; left: 50%; top: 50%; width: calc(48px * var(--tc-u)); height: calc(48px * var(--tc-u)); margin: calc(-24px * var(--tc-u)) 0 0 calc(-24px * var(--tc-u)); border-radius: 50%; background: rgba(255,255,255,.75); box-shadow: 0 2px 8px rgba(0,0,0,.35); }
#tc .tc-ghost.wheel { width: calc(112px * var(--tc-u)); height: calc(112px * var(--tc-u)); margin: calc(-56px * var(--tc-u)) 0 0 calc(-56px * var(--tc-u)); }
#tc .tc-ghost.wheel svg { position: absolute; inset: 0; width: 100%; height: 100%; stroke: #fff; fill: none; stroke-width: 6; filter: drop-shadow(0 2px 6px rgba(0,0,0,.5)); }
#tc .tc-ghost.wheel .base { background: transparent; border: 0; }
#tc-label { position: absolute; display: none; max-width: 230px; padding: 7px 12px; border-radius: 10px; background: rgba(247,240,225,.92); color: #1c2a5a; text-align: right; pointer-events: none; font: 700 calc(14px * var(--tc-u)) / 1.2 "Rubik", sans-serif; }
#tc-label small { display: block; margin-top: 2px; font: 500 calc(11px * var(--tc-u)) / 1.2 "Noto Sans", sans-serif; color: #5b6694; }
#tc-coach { position: absolute; left: 50%; transform: translateX(-50%); max-width: min(320px, calc(100vw - 32px)); padding: 8px 12px; border-radius: 12px; background: var(--hud-surface); text-align: center; pointer-events: none; opacity: 0; transition: opacity .5s;
  font: 500 calc(13px * var(--tc-u)) / 1.35 "Noto Sans", sans-serif; }
#tc-coach.show { opacity: 1; }
#tc-rotate { position: absolute; top: 32vh; left: 50%; width: min(320px, calc(100vw - 32px)); transform: translateX(-50%); display: none; align-items: center; gap: 10px; padding: 8px 8px 8px 14px; border-radius: 14px; background: var(--hud-surface); font: 500 12px/1.3 "Noto Sans", sans-serif; pointer-events: auto; }
#tc-rotate.show { display: flex; }
#tc-rotate button { flex: 0 0 auto; width: 44px; height: 44px; border-radius: 50%; border: 0; background: rgba(255,255,255,.16); color: #fff; font-size: 20px; cursor: pointer; }
#tc-rotate svg { flex: 0 0 auto; width: 28px; height: 28px; stroke: #f2c14e; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.tc-menu { display: grid; gap: 10px; }
.tc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
.tc-menu button, .tc-menu select { min-height: 48px; border-radius: 10px; border: 1px solid rgba(28,42,90,.25); background: #fff; color: #1c2a5a; font: 600 14px/1.2 "Noto Sans", sans-serif; padding: 8px 12px; text-align: left; touch-action: manipulation; }
.tc-menu button:active { background: #f2e3b8; }
.tc-menu h3 { margin: 8px 0 0; font: 800 13px/1.2 "Rubik", sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #9a6f1f; }
.tc-row { display: grid; grid-template-columns: 1fr minmax(120px, 52%); align-items: center; gap: 10px; min-height: 48px; }
.tc-row label { font: 600 14px/1.25 "Noto Sans", sans-serif; }
.tc-row small { display: block; font: 500 11px/1.3 "Noto Sans", sans-serif; color: #6a6f7d; }
.tc-row > div:not(.tc-nofl) { display: flex; align-items: center; gap: 10px; }
.tc-row input[type=range] { width: 100%; height: 44px; accent-color: #9a6f1f; touch-action: pan-y; }
.tc-row input[type=checkbox] { width: 28px; height: 28px; justify-self: end; accent-color: #9a6f1f; }
.tc-places { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 6px; }
.tc-places button { font-weight: 500; }
@media (prefers-reduced-motion: reduce) { #tc *, html.tc #minimap, html.tc #drive .d-drift { transition: none !important; } }
`;

const SVG = {
  cam: '<svg viewBox="0 0 24 24"><path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="4"/></svg>',
  exit: '<svg viewBox="0 0 24 24"><path d="M10 4H4v16h6M9 12h12m-5-5 5 5-5 5"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M5 6h14M5 12h14M5 18h14"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>', right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V6M6 11l6-6 6 6"/></svg>', down: '<svg viewBox="0 0 24 24"><path d="M12 5v13M6 13l6 6 6-6"/></svg>',
  hand: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8.5"/></svg>',
  wheel: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/><circle cx="50" cy="50" r="9"/><path d="M8 50h33M59 50h33M50 59v33"/></svg>',
  rotate: '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M20.5 8a9 9 0 0 1 0 8M22 14l-1.5 2.5L18 15"/></svg>',
};
// id -> { label, cls, fire ('down' = at once | 'up' = on release inside the button), aria }
const BTN = {
  menu: { label: '', svg: SVG.menu, cls: 'small', fire: 'up', aria: 'Меню · Menu' }, mute: { label: 'SOUND', cls: 'small', fire: 'down', aria: 'Звук · Sound' },
  jump: { label: 'JUMP', fire: 'down', aria: 'Прыжок · Jump' }, run: { label: 'RUN', fire: 'down', aria: 'Бег · Run' }, fly: { label: 'FLY', fire: 'down', aria: 'Полёт · Fly' },
  interact: { label: '', fire: 'down', aria: 'Действие · Use' },
  up: { label: 'UP', fire: 'hold', aria: 'Вверх · Up' }, down: { label: 'DOWN', fire: 'hold', aria: 'Вниз · Down' }, boost: { label: 'BOOST', fire: 'hold', aria: 'Ускорение · Boost' },
  gas: { label: 'GAS', cls: 'pedal gas', fire: 'hold', aria: 'Газ · Gas' }, brake: { label: 'BRAKE', cls: 'brake', fire: 'hold', aria: 'Тормоз · Brake' },
  nitro: { label: 'NITRO', fire: 'hold', aria: 'Нитро · Nitro' }, hand: { label: 'DRIFT', fire: 'hold', aria: 'Ручник · Handbrake' }, hop: { label: 'HOP', fire: 'down', aria: 'Прыжок авто · Hop' }, flip: { label: 'FLIP', cls: 'flip', fire: 'down', aria: 'Прыжок с бочкой · Barrel hop' },
  cam: { label: '', svg: SVG.cam, cls: 'small', fire: 'down', aria: 'Камера · Camera' }, horn: { label: 'HORN', cls: 'small', fire: 'down', aria: 'Сигнал · Horn' }, auto: { label: 'AUTO', cls: 'small', fire: 'up', aria: 'Автогаз · Auto gas' },
  repair: { label: 'FIX', cls: 'small', fire: 'up', aria: 'Починить · Repair' }, exit: { label: '', svg: SVG.exit, cls: 'small', fire: 'up', aria: 'Выйти из машины · Exit the car' },
  arrowL: { label: '', cls: 'arrow', fire: 'hold', svg: SVG.left, aria: 'Руль влево · Steer left' }, arrowR: { label: '', cls: 'arrow', fire: 'hold', svg: SVG.right, aria: 'Руль вправо · Steer right' },
  recentre: { label: '0°', cls: 'small', fire: 'up', aria: 'Выровнять наклон · Recentre tilt' },
};
const MODES = ['walk', 'fly', 'ride', 'drive'];

const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const k in attrs) { if (k === 'class') el.className = attrs[k]; else if (k === 'html') el.innerHTML = attrs[k]; else if (k === 'text') el.textContent = attrs[k]; else if (attrs[k] !== undefined && attrs[k] !== false) el.setAttribute(k, attrs[k] === true ? '' : attrs[k]); }
  for (const c of kids.flat()) if (c != null) el.append(c);
  return el;
};

export function createTouchControls({ ctx, player, canvas, params = new URLSearchParams(), doc = document, win = window }) {
  const root = doc.documentElement;
  if (!root.classList.contains('tc')) return null;       // desktop: nothing is created, nothing listens
  const body = doc.body, nav = win.navigator;
  let storage = null; try { storage = win.localStorage; } catch (e) { storage = null; }
  const settings = T.loadSettings(storage);
  const save = () => T.saveSettings(storage, settings);
  const style = h('style', { text: CSS }); doc.head.appendChild(style);
  player.requestLock = () => {};      // no pointer lock on a touch screen (Android Chrome would grab it and swallow the pointer events); the look is the drag zone

  // ---------------------------------------------------------------- state
  const state = { active: false, mode: 'walk', steer: 0, thr: 0, brk: 0, nitro: false, hand: false, hop: false, flip: false, look: { dx: 0, dy: 0 } };      // = ctx.touch, the Phase 2 contract
  ctx.touch = state;
  let mode = 'walk';
  const held = new Set(), since = new Map(), ptrs = new Map(), ownedKeys = new Set();
  let stickPtr = null, lookPtr = null, steerPtr = null, wheelBase = 0, wheelSteer = 0, hopTicks = 0, lookAcc = { dx: 0, dy: 0 };
  let ins = { l: 0, r: 0, t: 0, b: 0 }, u = 1, W = win.innerWidth, H = win.innerHeight;
  let tiltOn = false, tiltRoll = 0, tiltZero = 0, tiltAt = 0, wake = null, started = false, lastDamage = 0, lastBoost = false, coachTimer = 0;
  const isIPhone = /iPhone|iPod/.test(nav.userAgent || '') && !/iPad/.test(nav.userAgent || '');
  const standalone = !!(nav.standalone || (win.matchMedia && win.matchMedia('(display-mode: standalone)').matches));

  // ---------------------------------------------------------------- DOM
  const tc = h('div', { id: 'tc' });
  const look = h('div', { id: 'tc-look', class: 'tc-zone' });
  const stickZone = h('div', { id: 'tc-stick', class: 'tc-zone' });
  const stickGhost = h('div', { class: 'tc-ghost', 'data-ghost': 'stick' }, h('div', { class: 'base' }), h('div', { class: 'knob' }));
  const wheelGhost = h('div', { class: 'tc-ghost wheel', 'data-ghost': 'wheel' }, h('div', { class: 'base', html: SVG.wheel }));
  const label = h('div', { id: 'tc-label' });
  const coach = h('div', { id: 'tc-coach' });
  const rotate = h('div', { id: 'tc-rotate' }, h('span', { html: SVG.rotate }), h('span', { text: 'Поверните телефон горизонтально · Rotate your phone to landscape' }), h('button', { type: 'button', 'aria-label': 'Закрыть · Dismiss', text: '×' }));
  const probe = h('div', { id: 'tc-probe', style: 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:var(--sai-t, env(safe-area-inset-top, 0px)) var(--sai-r, env(safe-area-inset-right, 0px)) var(--sai-b, env(safe-area-inset-bottom, 0px)) var(--sai-l, env(safe-area-inset-left, 0px))' });
  tc.append(look, stickZone, stickGhost, wheelGhost);
  const btns = {};
  const allIds = new Set(); for (const m of ['common', ...MODES]) for (const id in T.LAYOUT[m]) allIds.add(id);
  for (const id of allIds) {
    const d = BTN[id]; if (!d) continue;
    const el = h('button', { type: 'button', class: 'tc-b ' + (d.cls || ''), 'data-id': id, 'aria-label': d.aria, hidden: true }, d.svg ? h('span', { html: d.svg, style: 'display:contents' }) : null, d.label ? h('span', { text: d.label }) : null);
    if (id === 'interact') el.append(h('span', { html: SVG.hand, style: 'display:contents' }));
    if (id === 'nitro') el.append(h('i', { class: 'tc-ring', style: '--p:1' }));
    btns[id] = el; tc.append(el);
  }
  tc.append(label, coach, rotate);
  body.append(tc, probe);
  const ring = btns.nitro && btns.nitro.querySelector('.tc-ring'), wheelSvg = wheelGhost.querySelector('svg');

  // ---------------------------------------------------------------- helpers
  const buzz = (ms) => { if (settings.haptics && typeof nav.vibrate === 'function') { try { nav.vibrate(ms); } catch (e) { /* no vibration */ } } };
  const key = (type, code, extra = {}) => { try { win.dispatchEvent(new win.KeyboardEvent(type, { code, key: code, bubbles: true, cancelable: true, ...extra })); } catch (e) { /* ignore */ } };
  const tap = (code) => { key('keydown', code); key('keyup', code); };
  const toast = (t) => { try { ctx.ui && ctx.ui.toast && ctx.ui.toast(t); } catch (e) { /* ignore */ } };
  const drive = () => ctx.drive || null;
  const lab = (v) => (typeof v === 'function' ? v() : v);
  const hasHop = (v) => !!(v && ((v.def && (v.def.hop || v.def.id === 'roadster' || (v.def.tuning && v.def.tuning.hop))) || v.id === 'roadster'));      // the Roadster arrives with another agent: its def may carry `hop`
  const setHidden = (el, hidden) => { if (el.hidden !== hidden) el.hidden = hidden; };

  // ---------------------------------------------------------------- layout
  function measure() {
    const cs = win.getComputedStyle(probe);
    ins = { l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0, t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0 };
    W = win.innerWidth; H = win.innerHeight;
    u = T.uiScale(W, H, settings.uiScale);
    root.style.setProperty('--tc-u', String(u)); tc.style.setProperty('--tc-u', String(u));
    root.style.setProperty('--tc-l', ins.l + 'px'); root.style.setProperty('--tc-r', ins.r + 'px'); root.style.setProperty('--tc-t', ins.t + 'px'); root.style.setProperty('--tc-b', ins.b + 'px');
    root.classList.toggle('tc-lh', !!settings.leftHanded);
    root.classList.toggle('tc-short', W > H && (H - ins.t - ins.b) / u < 370);
  }
  const rectOf = (id, m = mode) => { const a = T.anchors(m, W, H - ins.t - ins.b, u)[id]; return a ? T.placeRect(a, W, H, u, settings.leftHanded, ins) : null; };
  function layout() {
    measure();
    const anc = T.anchors(mode, W, H - ins.t - ins.b, u), z = T.zones(mode, W, H, settings.leftHanded);
    Object.assign(look.style, { left: '0px', top: '0px', width: W + 'px', height: H + 'px' });
    Object.assign(stickZone.style, { left: z.stick.x + 'px', top: z.stick.y + 'px', width: z.stick.w + 'px', height: z.stick.h + 'px' });
    for (const id in btns) {
      const a = anc[id], el = btns[id];
      if (!a) { el.dataset.inMode = '0'; setHidden(el, true); continue; }
      const r = T.placeRect(a, W, H, u, settings.leftHanded, ins);
      Object.assign(el.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
      el.dataset.inMode = '1';
    }
    const report = doc.getElementById('diag-toggle'), reportRect = rectOf('report');
    if (report && reportRect) Object.assign(report.style, { left: reportRect.x + 'px', top: reportRect.y + 'px', width: reportRect.w + 'px', height: reportRect.h + 'px' });
    // ghosts (the faint hint of where the thumb goes) and the wheel gauge
    const inset = settings.leftHanded ? ins.r : ins.l;
    const thumbX = Math.max(16, inset) + 60 * u;
    const gx = settings.leftHanded ? W - thumbX : thumbX, gy = H - Math.max(16, ins.b) - 60 * u;
    for (const g of [stickGhost, wheelGhost]) { g.style.left = gx + 'px'; g.style.top = gy + 'px'; g.dataset.hx = gx; g.dataset.hy = gy; }
    const ay = (n) => `calc(max(12px, ${ins.t}px) + ${n * u}px)`;
    coach.style.top = ay(154);
    const lr = rectOf('interact', mode === 'ride' ? 'ride' : 'walk');
    if (lr) { label.style.right = Math.round(W - lr.x) + 'px'; label.style.top = Math.round(lr.y - 56) + 'px'; label.style.left = 'auto'; label.style.maxWidth = Math.min(200, W * .42) + 'px'; if (settings.leftHanded) { label.style.right = 'auto'; label.style.left = Math.round(lr.right - lr.w) + 'px'; label.style.textAlign = 'left'; } else label.style.textAlign = 'right'; }
    refresh(true);
  }
  let rafLayout = 0;
  const relayout = () => { if (!rafLayout) rafLayout = win.requestAnimationFrame(() => { rafLayout = 0; layout(); }); };

  // ---------------------------------------------------------------- mode + visibility
  const shown = new Map();
  function refresh(force = false) {
    const dv = drive(), car = dv && dv.active ? dv.car : null, tgt = ctx.interact ? ctx.interact.target : null;
    const vis = {
      interact: (mode === 'walk' || mode === 'ride') && !!tgt,
      hop: mode === 'drive' && hasHop(dv && dv.vehicle), flip: mode === 'drive' && hasHop(dv && dv.vehicle),
      repair: mode === 'drive' && !!car && (car.damage || 0) > 0.03 && Math.hypot(car.vx || 0, car.vz || 0) < 1.4,
      arrowL: mode === 'drive' && settings.steerMode === 'arrows', arrowR: mode === 'drive' && settings.steerMode === 'arrows',
      recentre: mode === 'drive' && settings.steerMode === 'tilt',
      run: mode === 'walk', jump: mode === 'walk',
    };
    for (const id in btns) {
      const el = btns[id]; if (el.dataset.inMode !== '1') { setHidden(el, true); continue; }
      const v = id in vis ? vis[id] : true;
      if (force || shown.get(id) !== v) { shown.set(id, v); setHidden(el, !v); }
    }
    if (btns.fly) { const t = player.fly ? 'LAND' : 'FLY'; const s = btns.fly.firstChild; if (s && s.textContent !== t) s.textContent = t; btns.fly.classList.toggle('on', !!player.fly); }
    if (btns.run) btns.run.classList.toggle('on', !!settings.runLatch);
    if (btns.auto) btns.auto.classList.toggle('on', !!settings.autoGas);
    // the steering controls of the chosen scheme
    const wheelMode = mode === 'drive' && settings.steerMode === 'wheel', tiltMode = mode === 'drive' && settings.steerMode === 'tilt';
    setHidden(stickZone, !(mode !== 'drive' || wheelMode)); stickZone.style.pointerEvents = (mode !== 'drive' || wheelMode) ? '' : 'none';
    stickGhost.style.display = mode === 'drive' ? 'none' : ''; wheelGhost.style.display = mode === 'drive' && (wheelMode || tiltMode) ? '' : 'none';
    stickGhost.classList.toggle('idle', !stickPtr); stickGhost.classList.toggle('show', !!stickPtr);
    wheelGhost.classList.toggle('idle', !steerPtr && !tiltMode); wheelGhost.classList.toggle('show', !!steerPtr || tiltMode);
    if (tiltMode) { const r = rectOf('recentre'); if (r) { wheelGhost.style.left = (r.x + r.w / 2 + (settings.leftHanded ? -1 : 1) * 70 * u) + 'px'; wheelGhost.style.top = (r.y + r.h / 2) + 'px'; } }
    // the NITRO label is the car's own word (THRUSTER for the Roadster)
    if (btns.nitro && dv && dv.vehicle) { const w = (dv.vehicle.def && dv.vehicle.def.hud && dv.vehicle.def.hud.boost) || 'NITRO'; const s = btns.nitro.querySelector('span'); if (s && s.textContent !== w) s.textContent = w; }
    // the contextual USE label sits beside the button
    if (tgt && (mode === 'walk' || mode === 'ride')) {
      const ru = lab(tgt.label) || '', en = lab(tgt.labelEn) || '', k = ru + '|' + en;
      if (label.dataset.k !== k) { label.dataset.k = k; label.replaceChildren(h('span', { text: ru || en }), ru && en ? h('small', { text: en }) : null); }
      label.style.display = 'block';
    } else label.style.display = 'none';
  }
  function setMode(m) {
    releaseAll();
    mode = m; state.mode = m; state.active = m === 'drive';
    for (const id in btns) btns[id].classList.remove('down');
    if (m === 'drive') {
      const car = drive() && drive().car; lastDamage = car ? car.damage || 0 : 0; lastBoost = false;
      if (settings.steerMode === 'tilt') tiltZero = tiltRoll;
      showCoach('drive');
    }
    layout();
  }
  function updateMode() {
    const dv = drive();
    const m = dv && dv.active ? 'drive' : player.riding ? 'ride' : player.fly ? 'fly' : 'walk';
    if (m !== mode) setMode(m);
  }

  // ---------------------------------------------------------------- releasing every role (blur, hidden tab, mode switch, a panel, orientation)
  function releaseAll() {
    for (const [id, p] of ptrs) { try { p.el.releasePointerCapture(id); } catch (e) { /* already gone */ } }
    ptrs.clear(); stickPtr = lookPtr = steerPtr = null; held.clear(); since.clear(); wheelBase = 0; wheelSteer = 0; lookAcc = { dx: 0, dy: 0 };
    stickGhost.style.left = stickGhost.dataset.hx + 'px'; stickGhost.style.top = stickGhost.dataset.hy + 'px'; stickGhost.firstChild.nextSibling.style.transform = '';
    player.touchMove.set(0, 0);
    state.steer = state.thr = state.brk = 0; state.nitro = state.hand = state.hop = state.flip = false; state.look.dx = state.look.dy = 0;
    for (const id in btns) btns[id].classList.remove('down');
    syncKeys();
    stickGhost.classList.remove('run');
  }
  function syncKeys() {
    const want = T.desiredKeys(mode, held, mode === 'walk' && settings.runLatch);
    for (const c of ownedKeys) if (!want.has(c)) { player.keys.delete(c); ownedKeys.delete(c); }
    for (const c of want) { if (!player.keys.has(c)) player.keys.add(c); ownedKeys.add(c); }
  }

  // ---------------------------------------------------------------- pointer roles
  const inRect = (e, el) => { const b = el.getBoundingClientRect(); return e.clientX >= b.left - 6 && e.clientX <= b.right + 6 && e.clientY >= b.top - 6 && e.clientY <= b.bottom + 6; };
  const reportPanel = doc.getElementById('load-diag');
  const inputBlocked = () => !!(ctx.ui && ctx.ui.open) || !!(reportPanel && !reportPanel.hidden);
  const active = () => started && !inputBlocked();
  function capture(e, el) { try { el.setPointerCapture(e.pointerId); } catch (err) { /* the pointer is already gone */ } }
  tc.addEventListener('pointerdown', (e) => {
    if (!active() || ptrs.has(e.pointerId)) return;
    const btn = e.target.closest && e.target.closest('.tc-b');
    if (btn) { e.preventDefault(); e.stopPropagation(); capture(e, btn); buttonDown(btn, e); return; }
    if (e.target === stickZone) {
      e.preventDefault(); if (stickPtr !== null) return; capture(e, stickZone);
      ptrs.set(e.pointerId, { role: mode === 'drive' ? 'steer' : 'stick', el: stickZone, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY });
      if (mode === 'drive') { steerPtr = e.pointerId; wheelBase = e.clientX; wheelGhost.style.left = e.clientX + 'px'; wheelGhost.style.top = e.clientY + 'px'; }
      else { stickPtr = e.pointerId; stickGhost.style.left = e.clientX + 'px'; stickGhost.style.top = e.clientY + 'px'; }
      refresh();
      return;
    }
    if (e.target === look) {
      e.preventDefault(); if (lookPtr !== null) return; capture(e, look);
      lookPtr = e.pointerId; ptrs.set(e.pointerId, { role: 'look', el: look, x: e.clientX, y: e.clientY });
    }
  });
  tc.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    e.preventDefault();
    if (p.role === 'stick') {
      const R = T.STICK.radius * u, v = T.stickCurve(e.clientX - p.x0, e.clientY - p.y0, R);
      player.touchMove.set(v.x, v.y);
      const m = Math.min(R, Math.hypot(e.clientX - p.x0, e.clientY - p.y0)), a = Math.atan2(e.clientY - p.y0, e.clientX - p.x0);
      stickGhost.firstChild.nextSibling.style.transform = `translate(${Math.cos(a) * m}px, ${Math.sin(a) * m}px)`;
      stickGhost.classList.toggle('run', v.run);
    } else if (p.role === 'steer') {
      const lock = T.WHEEL.lock / Math.max(0.25, settings.steerSens);
      let dx = e.clientX - wheelBase; if (Math.abs(dx) > lock) { wheelBase = e.clientX - Math.sign(dx) * lock; dx = Math.sign(dx) * lock; }      // the wheel follows the thumb past the lock, so straightening needs only a small move back
      wheelSteer = T.steerFromOffset(dx, settings.steerSens);
    } else if (p.role === 'look') {
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      lookDelta(dx, dy);
    }
  });
  const pointerEnd = (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    ptrs.delete(e.pointerId);
    try { p.el.releasePointerCapture(e.pointerId); } catch (err) { /* released */ }
    if (p.role === 'stick') { stickPtr = null; player.touchMove.set(0, 0); stickGhost.classList.remove('run'); stickGhost.firstChild.nextSibling.style.transform = ''; stickGhost.style.left = stickGhost.dataset.hx + 'px'; stickGhost.style.top = stickGhost.dataset.hy + 'px'; refresh(); }
    else if (p.role === 'steer') { steerPtr = null; wheelSteer = 0; wheelGhost.style.left = wheelGhost.dataset.hx + 'px'; wheelGhost.style.top = wheelGhost.dataset.hy + 'px'; refresh(); }
    else if (p.role === 'look') lookPtr = null;
    else if (p.role === 'btn') buttonUp(p, e);
  };
  tc.addEventListener('pointerup', pointerEnd); tc.addEventListener('pointercancel', pointerEnd); tc.addEventListener('lostpointercapture', pointerEnd);
  tc.addEventListener('contextmenu', (e) => e.preventDefault());
  tc.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });

  function lookDelta(dx, dy) {
    const k = 2.2 * settings.lookSens, sy = settings.invertY ? -1 : 1;
    if (mode === 'drive') { lookAcc.dx += dx; lookAcc.dy += dy; try { win.dispatchEvent(new win.MouseEvent('mousemove', { buttons: 1, movementX: dx * settings.lookSens, movementY: dy * sy * settings.lookSens })); } catch (err) { /* ignore */ } }
    else { player.look.dx += dx * k; player.look.dy += dy * k * sy; }
  }

  // ---------------------------------------------------------------- buttons
  function buttonDown(btn, e) {
    const id = btn.dataset.id, d = BTN[id], a = T.ACTIONS[id]; if (!a || !a.modes.includes(mode)) return;
    ptrs.set(e.pointerId, { role: 'btn', id, el: btn });
    btn.classList.add('down'); buzz(6);
    if (d.fire === 'hold') { held.add(id); since.set(id, performance.now()); syncKeys(); return; }
    if (d.fire === 'down') fire(id);
  }
  function buttonUp(p, e) {
    const id = p.id, d = BTN[id];
    p.el.classList.remove('down');
    if (d.fire === 'hold') { held.delete(id); since.delete(id); syncKeys(); }
    else if (d.fire === 'up' && e.type === 'pointerup' && inRect(e, p.el)) fire(id);
  }
  function fire(id) {
    const a = T.ACTIONS[id], dv = drive();
    switch (a.kind) {
      case 'tap': tap(a.code); break;
      case 'latch': settings.runLatch = !settings.runLatch; save(); syncKeys(); refresh(true); break;
      case 'call':
        if (a.call === 'toggleFly') player.toggleFly();
        else if (a.call === 'interact') { if (ctx.interact && ctx.interact.use()) buzz(18); }
        else if (a.call === 'exit') { if (dv) dv.exit(); }
        else if (a.call === 'repair') { if (dv && dv.repair) dv.repair(); else tap('KeyJ'); }
        else if (a.call === 'autoGas') { settings.autoGas = !settings.autoGas; save(); refresh(true); }
        else if (a.call === 'menu') openMenu();
        else if (a.call === 'recentre') tiltZero = tiltRoll;
        break;
      default: break;
    }
    if (id === 'recentre') tiltZero = tiltRoll;
    if (id === 'hop' || id === 'flip') { state[id] = true; hopTicks = 3; }      // (the hop itself starts from the synthetic keydown: drive.js latches X / C and launches on the next physics step)
  }
  btns.recentre && btns.recentre.addEventListener('pointerup', () => { tiltZero = tiltRoll; });

  // ---------------------------------------------------------------- per-frame work
  let lastT = performance.now();
  let blockedLastFrame = false;
  function tick(now) {
    win.requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (!started) { if (body.classList.contains('playing')) { started = true; layout(); showCoach('walk'); } else return; }
    if (inputBlocked()) { if (!blockedLastFrame || ptrs.size || held.size) releaseAll(); blockedLastFrame = true; return; }
    blockedLastFrame = false;
    updateMode();
    portraitBanner();
    if (mode === 'drive') driveFrame(dt, now);
    if (hopTicks > 0 && --hopTicks === 0) state.hop = state.flip = false;
    syncKeys();
    refresh();
    state.look.dx = lookAcc.dx; state.look.dy = lookAcc.dy; lookAcc.dx = lookAcc.dy = 0;
  }
  function steerSource(now) {
    if (settings.steerMode === 'arrows') {
      const l = held.has('arrowL') ? T.arrowRamp((now - since.get('arrowL')) / 1000) : 0, r = held.has('arrowR') ? T.arrowRamp((now - since.get('arrowR')) / 1000) : 0;
      return l - r;
    }
    if (settings.steerMode === 'tilt') return tiltOn ? T.tiltSteer(tiltRoll, tiltZero, settings.tiltRange) : 0;
    return wheelSteer;
  }
  function driveFrame(dt, now) {
    const dv = drive(), car = dv && dv.car; if (!car) return;
    const raw = steerSource(now);
    const steer = Math.max(-1, Math.min(1, raw * (settings.steerAssist ? T.steerAssist(car.speed || 0) : 1)));
    const gas = held.has('gas') || (settings.autoGas && !held.has('brake'));
    state.steer = steer; state.thr = gas ? 1 : 0; state.brk = held.has('brake') ? 1 : 0; state.nitro = held.has('nitro'); state.hand = held.has('hand');
    const enc = T.encodeDrive({ steer, thr: state.thr, brk: state.brk });
    player.touchMove.set(enc.x, enc.y);
    // feedback: the wheel turns, the NITRO ring shows the tank, the GAS pedal says AUTO, haptics on bumps and on the boost
    wheelSvg.style.transform = `rotate(${-steer * 90}deg)`;
    if (ring) { const p = Math.max(0, Math.min(1, car.boost == null ? 1 : car.boost)); if (Math.abs((ring._p ?? -1) - p) > 0.01) { ring._p = p; ring.style.setProperty('--p', p.toFixed(3)); ring.classList.toggle('low', p < 0.22); } }
    const HP = car.tuning && car.tuning.hop; if (HP && btns.hop && btns.flip) { btns.hop.classList.toggle('dim', !!car.air || car.boost < HP.minTank); btns.flip.classList.toggle('dim', !!car.air || car.boost < (HP.minTankFlip ?? HP.minTank)); }      // HOP / FLIP dim in the air and when the tank cannot pay them
    const gl = btns.gas && btns.gas.firstChild; if (gl) { const t = settings.autoGas ? 'AUTO' : 'GAS'; if (gl.textContent !== t) gl.textContent = t; }
    if (car.boosting && !lastBoost) buzz(20); lastBoost = !!car.boosting;
    const dmg = car.damage || 0; if (dmg > lastDamage + 0.002) buzz(Math.min(140, 40 + (dmg - lastDamage) * 900)); lastDamage = dmg;
  }

  function portraitBanner() {
    let dismissed = false; try { dismissed = win.sessionStorage.getItem('piter.rot') === '1'; } catch (e) { /* ignore */ }
    rotate.classList.toggle('show', win.innerHeight > win.innerWidth && !dismissed);
  }
  rotate.querySelector('button').addEventListener('click', () => { try { win.sessionStorage.setItem('piter.rot', '1'); } catch (e) { /* ignore */ } rotate.classList.remove('show'); });

  function showCoach(which) {
    const k = which === 'drive' ? 'coachDrive' : 'coachWalk'; if (settings[k]) return;
    settings[k] = true; save();
    coach.replaceChildren(h('div', { text: which === 'drive' ? 'Левый палец — руль, правый — газ и тормоз · Left thumb steers, right thumb is gas and brake' : 'Левый палец — идти, правый — смотреть, кнопка у машины — сесть · Left thumb walks, right thumb looks, the button near a car gets you in' }));
    coach.classList.add('show'); win.clearTimeout(coachTimer); coachTimer = win.setTimeout(() => coach.classList.remove('show'), 6500);
  }

  // ---------------------------------------------------------------- tilt steering
  function onMotion(e) {
    const g = e.accelerationIncludingGravity; if (!g || g.x == null || g.y == null) return;
    const ang = (win.screen && win.screen.orientation && win.screen.orientation.angle) || win.orientation || 0;
    const iosFlip = typeof win.DeviceMotionEvent !== 'undefined' && typeof win.DeviceMotionEvent.requestPermission === 'function';      // iOS reports the gravity with the opposite sign [VERIFY on a device]
    tiltRoll = T.rollDeg(g.x, g.y, ang, iosFlip); tiltAt = performance.now();
    if (!tiltOn) { tiltOn = true; tiltZero = tiltRoll; }
  }
  let tiltListening = false;
  async function enableTilt() {      // MUST run inside a user gesture on iOS (a tap on the selector / the #go click)
    if (tiltListening) return true;
    try { const DM = win.DeviceMotionEvent; if (DM && typeof DM.requestPermission === 'function') { const r = await DM.requestPermission(); if (r !== 'granted') throw new Error('denied'); } } catch (e) { fallbackWheel('Нет доступа к датчику · Motion access denied'); return false; }
    win.addEventListener('devicemotion', onMotion); tiltListening = true;
    win.setTimeout(() => { if (!tiltAt) fallbackWheel('Нет датчика наклона · No motion sensor'); }, 1500);
    return true;
  }
  function fallbackWheel(msg) { settings.steerMode = 'wheel'; save(); tiltOn = false; toast(msg); layout(); }
  if (settings.steerMode === 'tilt' && !(win.DeviceMotionEvent && typeof win.DeviceMotionEvent.requestPermission === 'function')) enableTilt();

  // ---------------------------------------------------------------- menu + settings panels
  /** a panel opened by a touch (pointerup of MENU) appears under the finger: the click the browser sends right after would hit its close button; swallow clicks for a moment */
  function swallowGhostClick() {
    const r = doc.getElementById('panel'); if (!r) return;
    const stop = (e) => { e.stopPropagation(); e.preventDefault(); };
    r.addEventListener('click', stop, true); win.setTimeout(() => r.removeEventListener('click', stop, true), 350);
  }
  function closePanelThen(fn) { if (ctx.ui && ctx.ui.close) ctx.ui.close(); win.setTimeout(fn, 30); }
  function openMenu() {
    if (!ctx.ui || !ctx.ui.panel) return;
    const act = (text, fn) => { const b = h('button', { type: 'button', text }); b.addEventListener('click', fn); return b; };
    const places = doc.getElementById('places'), list = h('div', { class: 'tc-places' });
    if (places && doc.documentElement.classList.contains('teleports')) for (const o of places.options) { if (!o.value) continue; const b = act(o.textContent, () => closePanelThen(() => { places.value = o.value; places.dispatchEvent(new win.Event('change')); })); list.append(b); }
    const q = doc.getElementById('quality'), qsel = h('select', { 'aria-label': 'Качество · Quality' });
    if (q) { for (const o of q.options) qsel.append(h('option', { value: o.value, text: o.textContent })); qsel.value = q.value; qsel.addEventListener('change', () => { q.value = qsel.value; q.dispatchEvent(new win.Event('change')); }); }
    const fsOk = !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled) && !isIPhone;
    const stats = doc.getElementById('stats');
    const muted = (doc.getElementById('mute') || {}).getAttribute && doc.getElementById('mute').getAttribute('aria-pressed') === 'true';
    const el = h('div', { class: 'tc-menu' },
      mode === 'drive' ? h('div', { class: 'tc-grid' },
        act('Сигнал · Horn', () => closePanelThen(() => fire('horn'))),
        act(settings.autoGas ? 'Автогаз: вкл · Auto gas: on' : 'Автогаз: выкл · Auto gas: off', () => closePanelThen(() => fire('auto'))),
        act('Починить автомобиль · Repair car', () => closePanelThen(() => fire('repair')))) : null,
      h('div', { class: 'tc-grid' },
        act('Время суток · Time of day', () => closePanelThen(() => tap('KeyT'))),
        act(muted ? 'Звук: выкл · Sound: off' : 'Звук: вкл · Sound: on', () => closePanelThen(() => tap('KeyM'))),
        act('Скрыть интерфейс · Hide UI', () => closePanelThen(() => { body.classList.add('noui'); toast('Меню: кнопка справа вверху · Menu button stays top right'); })),
        act('В начало · Respawn', () => closePanelThen(() => tap('KeyR'))),
        fsOk ? act(doc.fullscreenElement ? 'Выйти из полного экрана · Exit fullscreen' : 'Полный экран · Fullscreen', () => closePanelThen(() => toggleFullscreen())) : null,
        act('FPS', () => closePanelThen(() => { if (stats) stats.hidden = !stats.hidden; })),
        act('Управление · Controls settings', () => openSettings())),
      isIPhone && !standalone ? h('div', { class: 'tc-row' }, h('label', { html: 'На весь экран: «Поделиться» → «На экран Домой»<small>Full screen on iPhone: Share → Add to Home Screen</small>' })) : null,
      q ? h('h3', { text: 'Качество · Quality' }) : null, q ? qsel : null,
      list.childElementCount ? h('h3', { text: 'Места · Places' }) : null, list);
    ctx.ui.panel(el, { title: 'Меню · Menu', closeLabel: 'Закрыть · Close' }); swallowGhostClick();
  }
  const SPEC_AUTO = { uiScale: 1 };
  function openSettings() {
    const row = (name, sub, control) => h('div', { class: 'tc-row' }, h('label', {}, name, sub ? h('small', { text: sub }) : null), control);
    const range = (k, min, max, step, fmt) => {
      const out = h('span', { style: 'font:700 12px Rubik,sans-serif;color:#9a6f1f' });
      const inp = h('input', { type: 'range', min, max, step, value: settings[k] || (SPEC_AUTO[k] ?? 1), 'aria-label': k });
      const upd = () => { out.textContent = fmt(Number(inp.value)); };
      inp.addEventListener('input', () => { settings[k] = Number(inp.value); upd(); save(); relayout(); }); upd();
      return h('div', {}, inp, out);
    };
    const check = (k, after) => { const c = h('input', { type: 'checkbox' }); c.checked = !!settings[k]; c.addEventListener('change', () => { settings[k] = c.checked; save(); relayout(); if (after) after(c); }); return c; };
    const steerSel = h('select', { 'aria-label': 'Steering' }, h('option', { value: 'wheel', text: 'Колесо · Wheel (swipe)' }), h('option', { value: 'arrows', text: 'Стрелки · Arrows' }), h('option', { value: 'tilt', text: 'Наклон · Tilt' }));
    steerSel.value = settings.steerMode;
    steerSel.addEventListener('change', async () => {      // a user gesture: iOS asks for the motion permission here
      settings.steerMode = steerSel.value; save();
      if (settings.steerMode === 'tilt') { const ok = await enableTilt(); if (!ok) steerSel.value = settings.steerMode; }
      relayout();
    });
    const vib = typeof nav.vibrate === 'function';
    const reset = h('button', { type: 'button', text: 'Сбросить настройки · Reset to defaults' });
    reset.addEventListener('click', () => { const d = T.defaultSettings(); d.coachWalk = d.coachDrive = true; Object.assign(settings, d); save(); relayout(); openSettings(); });
    const el = h('div', { class: 'tc-menu' },
      h('h3', { text: 'Ходьба · Walking' }),
      row('Чувствительность обзора · Look sensitivity', null, range('lookSens', 0.4, 2.5, 0.05, (v) => v.toFixed(2) + '×')),
      row('Инвертировать вертикаль · Invert look Y', null, check('invertY')),
      row('Бег включён · Run by default', 'Кнопка RUN · the RUN button', check('runLatch', () => { syncKeys(); refresh(true); })),
      h('h3', { text: 'Машина · Driving' }),
      row('Руль · Steering', 'Наклон просит доступ к датчикам · Tilt asks for motion access', steerSel),
      row('Чувствительность руля · Steering sensitivity', null, range('steerSens', 0.5, 1.5, 0.05, (v) => Math.round(v * 100) + '%')),
      row('Помощь на скорости · Speed steering assist', 'Руль мягче на скорости · gentler lock at speed', check('steerAssist')),
      row('Диапазон наклона · Tilt range', 'Градусов до упора · degrees to full lock', range('tiltRange', 18, 40, 1, (v) => v + '°')),
      row('Автогаз · Auto gas', 'Педаль газа не нужна · no need to hold GAS', check('autoGas', () => refresh(true))),
      h('h3', { text: 'Интерфейс · Interface' }),
      row('Для левши · Left-handed', 'Зоны меняются местами · swaps the thumbs', check('leftHanded')),
      row('Вибрация · Haptics', vib ? null : 'iOS не даёт вибрацию · iOS does not allow vibration', (() => { const c = check('haptics'); if (!vib) c.disabled = true; return c; })()),
      row('Размер кнопок · Button size', null, range('uiScale', 0.8, 1.3, 0.05, (v) => v.toFixed(2) + '×')),
      row('Размер кнопок: авто · Button size: auto', null, (() => { const c = h('input', { type: 'checkbox' }); c.checked = !settings.uiScale; c.addEventListener('change', () => { settings.uiScale = c.checked ? 0 : T.uiScale(W, H); save(); relayout(); openSettings(); }); return c; })()),
      reset);
    ctx.ui.panel(el, { title: 'Управление · Controls', closeLabel: 'Готово · Done' }); swallowGhostClick();
  }
  
  // ---------------------------------------------------------------- mobile boot: fullscreen, orientation lock, wake lock (inside the #go gesture)
  async function toggleFullscreen() {
    try { if (doc.fullscreenElement) await doc.exitFullscreen(); else if (doc.fullscreenEnabled && root.requestFullscreen) await root.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { /* refused */ }
  }
  async function acquireWake() {
    try {
      if (!nav.wakeLock || doc.visibilityState !== 'visible' || wake) return;
      wake = await nav.wakeLock.request('screen');
      wake.addEventListener('release', () => { wake = null; });
    } catch (e) { wake = null; /* not allowed (battery saver, insecure origin) */ }
  }
  async function onGo() {      // the first user gesture: the only moment these are allowed
    let fs = null;
    try { if ((doc.fullscreenEnabled || doc.webkitFullscreenEnabled) && !isIPhone && !doc.fullscreenElement && root.requestFullscreen) fs = root.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { fs = null; }
    acquireWake();
    if (settings.steerMode === 'tilt') enableTilt();
    try { if (fs) await fs; } catch (e) { /* refused */ }
    try { const o = win.screen && win.screen.orientation; if (o && o.lock) await o.lock('landscape'); } catch (e) { /* iOS Safari and desktop browsers refuse */ }
  }
  const go = doc.getElementById('go'); if (go) go.addEventListener('click', onGo);
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden) { releaseAll(); } else if (started) acquireWake();
  });
  win.addEventListener('pagehide', () => { releaseAll(); try { if (wake) wake.release(); } catch (e) { /* ignore */ } });
  win.addEventListener('blur', releaseAll);
  win.addEventListener('orientationchange', () => { releaseAll(); relayout(); });
  win.addEventListener('resize', relayout);
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) doc.addEventListener(t, (e) => e.preventDefault());      // iOS pinch
  doc.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------------------------------------------------------------- go
  measure(); layout();
  win.requestAnimationFrame(tick);
  const api = { state, settings, get mode() { return mode; }, held, ptrs, ownedKeys, btns, layout, refresh, releaseAll, rect: rectOf, enableTilt, openMenu, openSettings, dispose() { tc.remove(); style.remove(); root.classList.remove('tc-lh'); releaseAll(); } };
  win.__tc = api;
  return api;
}
