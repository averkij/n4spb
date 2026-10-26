// drive/wasted.js - the "Потрачено" (GTA "WASTED") state of a car junked to 100%.
// The instant the body damage of the car the player drives reaches 100% (damage.js: the worst of the four zones is at 1) a big centred red label appears for 5 seconds (pure DOM / CSS,
// pointer-events none, a grey vignette behind it), and from that moment the car cannot be driven: gate() turns the player's input into the same "held car" input a panel uses (handling.js
// holdInput: no gas, no steering, no nitro, no hop; the car brakes to a stop and never reverses), so physics (a push, a slope) can still move it. E (exit) and J (repair, drive.js
// api.repair, also the HUD / touch Repair button) work as ever; the repair brings the damage under 100%, which lifts the hold and removes the label at once.
// The label fires ONCE per wreck event (the edge junked false -> true), never per frame; reset() (get into a car, hand-off arrival) only adopts the state without a label, hide() removes it
// (exit, respawn R, repair). The 5 s run on the game clock (step(dt)), the CSS animation only draws them.
import { holdInput } from './handling.js';

export const WASTED_AT = 0.999;        // damage.amount is Math.min(1, ...) per zone: 1 exactly when a zone is crushed through; the margin only guards float noise
export const WASTED_SECONDS = 5;
export const WASTED_TEXT = 'Потрачено';

const CSS = `
#wasted { position: fixed; inset: 0; z-index: 6; pointer-events: none; display: none; align-items: center; justify-content: center; }
#wasted.on { display: flex; animation: w-veil 5s linear forwards; }
#wasted::before { content: ""; position: absolute; inset: 0; backdrop-filter: grayscale(.85) brightness(.82); -webkit-backdrop-filter: grayscale(.85) brightness(.82);
  background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,.05) 25%, rgba(20,0,0,.62) 100%); }
#wasted .w-text { position: relative; padding: 0 .1em 0 .22em; text-align: center; text-transform: uppercase; white-space: nowrap; font: 900 clamp(44px, 12vw, 168px)/1 "Rubik", Impact, "Arial Black", sans-serif; letter-spacing: .22em;
  color: #c4151c; text-shadow: 0 .03em 0 #3a0508, 0 .06em .02em #000, 0 0 .35em rgba(0,0,0,.85), 0 0 .9em rgba(120,0,0,.55); -webkit-text-stroke: .012em rgba(30,0,2,.9); }
#wasted.on .w-text { animation: w-pop 5s cubic-bezier(.2,.8,.2,1) forwards; }
@keyframes w-veil { 0% { opacity: 0; } 6% { opacity: 1; } 84% { opacity: 1; } 100% { opacity: 0; } }
@keyframes w-pop { 0% { transform: scale(1.7); opacity: 0; } 7% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.07); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { #wasted.on .w-text { animation: none; } }
body.noui #wasted, body.shot #wasted { display: none !important; }`;

/** `doc`: the document (absent in node: the logic runs without a label element); `onShow`: called once at each wreck event (drive.js: a toast with the J hint) */
export function createWasted({ doc = typeof document !== 'undefined' ? document : null, onShow = null } = {}) {
  let junked = false, left = 0, el = null;
  const build = () => {
    if (el || !doc || !doc.body) return el;
    const style = doc.createElement('style'); style.textContent = CSS; doc.head.appendChild(style);
    el = doc.createElement('div'); el.id = 'wasted'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="w-text"></div>'; el.firstChild.textContent = WASTED_TEXT;
    doc.body.appendChild(el); return el;
  };
  const api = {
    /** the label is on screen / counting */
    get visible() { return left > 0; }, get seconds() { return left; }, get junked() { return junked; },
    /** damage amount (0..1) -> is the car wrecked */
    isJunked: (amount) => amount >= WASTED_AT,
    /** adopt the state without a label (getting into an already wrecked car, a hand-off arrival) */
    reset(amount) { junked = amount >= WASTED_AT; api.hide(); },
    hide() {
      left = 0;
      if (el) { el.classList.remove('on'); }
    },
    show() {
      left = WASTED_SECONDS;
      const e = build(); if (e) { e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); }
      onShow?.();
    },
    /** once per physics step, after the impacts: the edge to 100% shows the label (true), a repair removes it, the 5 s run out. */
    step(dt, amount) {
      const now = amount >= WASTED_AT;
      let fired = false;
      if (now && !junked) { junked = true; api.show(); fired = true; }
      else if (!now && junked) { junked = false; api.hide(); }
      if (left > 0 && !fired) { left -= dt; if (left <= 0) api.hide(); }
      return fired;
    },
    /** the player's input of a wrecked car: nothing steered / boosted / hopped, the car brakes to a standstill (holdInput); any other car gets its input back untouched. Writes into `inp`. */
    gate(inp, vF, amount) { return amount >= WASTED_AT ? holdInput(inp, vF) : inp; },
  };
  return api;
}
