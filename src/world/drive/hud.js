// drive/hud.js - the driving interface, "Need for Speed, but simpler": a big italic speedometer with a tacho arc and the gear, a nitro bar, a drift counter, speed streaks + a vignette that grow with the speed
// (cyan while the nitro burns) and a key hint line that fades out. Everything is DOM / 2D canvas, created on demand, hidden with body.noui (H) and in screenshots (body.shot).
// The round street map + the current-street pill are NOT here any more: core/minimap.js serves walking and driving alike (main.js feeds it).
// HOP v3 (a car with a hop): the key hint reads 'X хоп · C бочка' (X = the simple hop, C = the barrel hop; no charge bar: both launch on key down); a press the tank cannot pay blinks the boost bar red (deny()). The old DOM touch buttons
// HOP / FLIP dim while the car is in the air or the tank is short (the core/touch.js layer draws its own HOP / FLIP buttons).

const CSS = `
#drive .d-condition { position: absolute; right: 24px; bottom: calc(370px + env(safe-area-inset-bottom, 0px)); padding: 8px 10px; border-radius: 8px; background: rgba(12,18,44,.72); font: 700 12px/1.4 "Noto Sans", sans-serif; }
#drive .d-condition button { pointer-events: auto; margin-left: 12px; background: transparent; color: #fff; border: 1px solid #8894ac; border-radius: 4px; padding: 3px 6px; cursor: pointer; }
@media (pointer: coarse) { #drive .d-condition { bottom: calc(280px + env(safe-area-inset-bottom, 0px)); } }
#drive { position: fixed; inset: 0; z-index: 3; pointer-events: none; display: none; font-family: "Rubik", "Noto Sans", "Segoe UI", sans-serif; color: #fff; }
body.driving #drive { display: block; }
body.noui #drive, body.shot #drive { display: none !important; }
body.driving #help .walk, body.driving #cross, body.driving #fly { display: none !important; }
body.driving #interact { display: none !important; }
#drive canvas.d-streaks { position: absolute; inset: 0; width: 100%; height: 100%; }
#drive .d-vig { position: absolute; inset: 0; opacity: 0; background: radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 52%, rgba(8,12,34,.55) 100%); transition: opacity .25s; }
#drive .d-vig.boost { background: radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 45%, rgba(0,150,255,.42) 100%); }
#drive .d-speedo { position: absolute; right: 22px; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); width: 300px; height: 300px; filter: drop-shadow(0 8px 18px rgba(0,0,0,.45)); }
#drive .d-speedo svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
#drive .d-num { position: absolute; left: 0; right: 0; top: 96px; text-align: center; font: 900 92px/1 "Rubik", sans-serif; font-style: italic; letter-spacing: -.02em; transform: skewX(-8deg); text-shadow: 0 3px 0 rgba(0,0,0,.35), 0 0 22px rgba(255,255,255,.18); font-variant-numeric: tabular-nums; }
#drive .d-unit { position: absolute; left: 0; right: 0; top: 190px; text-align: center; font: 700 15px/1 "Rubik", sans-serif; letter-spacing: .32em; color: rgba(255,255,255,.78); }
#drive .d-gear { position: absolute; right: 38px; top: 222px; width: 46px; height: 46px; border-radius: 10px; background: rgba(12,18,44,.72); border: 2px solid rgba(255,255,255,.85); font: 900 28px/42px "Rubik", sans-serif; text-align: center; transform: skewX(-8deg); }
#drive .d-gear.shift { background: #ffe05a; color: #1c2a5a; }
#drive .d-nitro { position: absolute; right: 22px; bottom: calc(318px + env(safe-area-inset-bottom, 0px)); width: 260px; height: 16px; background: rgba(12,18,44,.72); border: 2px solid rgba(255,255,255,.85); border-radius: 4px; transform: skewX(-18deg); overflow: hidden; }
#drive .d-nitro i { display: block; height: 100%; width: 100%; transform-origin: left; background: linear-gradient(90deg, #43489a, #35b8ff 55%, #b8f3ff); }
#drive .d-nitro.low i { background: linear-gradient(90deg, #ff4d57, #ffb347); }
#drive .d-nitro.burn { box-shadow: 0 0 18px 3px rgba(60,190,255,.85); }
#drive .d-nlab { position: absolute; right: 24px; bottom: calc(338px + env(safe-area-inset-bottom, 0px)); font: 700 11px/1 "Rubik", sans-serif; letter-spacing: .24em; color: rgba(255,255,255,.85); text-shadow: 0 1px 3px rgba(0,0,0,.6); }
#drive .d-nitro.deny { animation: d-deny .5s; }
@keyframes d-deny { 0%, 50%, 100% { box-shadow: none; } 25%, 75% { box-shadow: 0 0 16px 4px rgba(255,85,96,.95); } }
#drive .d-drift { position: absolute; top: 24%; left: 50%; transform: translateX(-50%) skewX(-8deg); text-align: center; font: 900 46px/1 "Rubik", sans-serif; font-style: italic; opacity: 0; transition: opacity .25s; text-shadow: 0 3px 0 rgba(0,0,0,.4); }
#drive .d-drift small { display: block; font: 700 13px/1.4 "Rubik", sans-serif; letter-spacing: .3em; color: #ffe05a; }
#drive .d-drift.on { opacity: 1; }
#drive .d-drift.bank { color: #9ef07a; }
#drive .d-keys { position: absolute; left: 50%; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); max-width: calc(100vw - 600px); min-width: 420px; text-align: center; font: 500 12px/1.9 "Noto Sans", sans-serif; color: #fff; background: rgba(12,18,44,.62); border-radius: 10px; padding: 6px 12px; transition: opacity 1.2s; }
#drive .d-keys.hide { opacity: 0; }
#drive .d-keys kbd { font: 700 11px/1 "Noto Sans", sans-serif; background: #fff; color: #1c2a5a; border-radius: 4px; padding: 2px 5px; margin: 0 2px; }
#drive .d-flash { position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(255,60,60,0) 40%, rgba(255,60,60,.55) 100%); opacity: 0; }
#drive .d-touch { position: absolute; right: 18px; top: 84px; display: none; flex-direction: column; gap: 10px; pointer-events: auto; }
#drive .d-touch.hop { gap: 6px; }
#drive .d-touch.hop button { padding: 10px 16px; }
#drive .d-touch button.off { opacity: .45; }
#drive .d-touch button { font: 700 14px/1 "Rubik", sans-serif; color: #fff; background: rgba(12,18,44,.78); border: 2px solid rgba(255,255,255,.85); border-radius: 12px; padding: 14px 16px; }
@media (pointer: coarse) { #drive .d-touch { display: flex; } #drive .d-keys { display: none; } #drive .d-speedo { transform: scale(.72); transform-origin: right bottom; } #drive .d-nitro { bottom: calc(232px + env(safe-area-inset-bottom, 0px)); } #drive .d-nlab { bottom: calc(252px + env(safe-area-inset-bottom, 0px)); } }
@media (max-width: 900px) { #drive .d-keys { display: none; } `;

const ARC = { cx: 150, cy: 150, r: 124, a0: 135, a1: 405 };
const pt = (a, r) => [ARC.cx + r * Math.cos(a * Math.PI / 180), ARC.cy + r * Math.sin(a * Math.PI / 180)];
const arcPath = (a0, a1, r) => { const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r); return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };

export function createDriveHud({ isTouch, onExit, onRepair, onNitro, onHand, onBrake, onJump, onFlip }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const root = document.createElement('div'); root.id = 'drive';
  const ticks = [];
  for (let i = 0; i <= 14; i++) { const a = ARC.a0 + (ARC.a1 - ARC.a0) * i / 14, [x0, y0] = pt(a, ARC.r + 6), [x1, y1] = pt(a, ARC.r + (i % 2 ? 12 : 17)); ticks.push(`<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${i >= 12 ? '#ff4d57' : 'rgba(255,255,255,.8)'}" stroke-width="${i % 2 ? 2 : 3.5}"/>`); }
  const full = arcPath(ARC.a0, ARC.a1, ARC.r), len = (ARC.a1 - ARC.a0) * Math.PI / 180 * ARC.r;
  root.innerHTML = `
    <canvas class="d-streaks"></canvas>
    <div class="d-condition"><span>BODY 100%</span><button type="button" title="Stop, then repair the car (J)">J · Repair</button></div>
    <div class="d-vig"></div><div class="d-flash"></div>
    <div class="d-nlab">NITRO</div><div class="d-nitro"><i></i></div>
    <div class="d-speedo">
      <svg viewBox="0 0 300 300">
        <defs><linearGradient id="dg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#6fb000"/><stop offset=".55" stop-color="#ffe05a"/><stop offset="1" stop-color="#ff4d57"/></linearGradient></defs>
        <circle cx="150" cy="150" r="146" fill="rgba(12,18,44,.55)"/>
        <path d="${full}" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="14" stroke-linecap="round"/>
        <path class="d-rpm" d="${full}" fill="none" stroke="url(#dg)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)}" stroke-dashoffset="${len.toFixed(1)}"/>
        ${ticks.join('')}
      </svg>
      <div class="d-num">0</div><div class="d-unit">KM/H</div><div class="d-gear">N</div>
    </div>
    <div class="d-drift"><small>ДРИФТ · DRIFT</small><span></span></div>
    <div class="d-keys"><kbd>W</kbd><kbd>S</kbd> газ · тормоз &nbsp; <kbd>A</kbd><kbd>D</kbd> руль &nbsp; <kbd>Shift</kbd> нитро &nbsp; <span class="d-hopk" hidden><kbd>X</kbd> хоп · <kbd>C</kbd> бочка &nbsp; </span><kbd>Space</kbd> ручник (дрифт) &nbsp; <kbd>G</kbd> сигнал &nbsp; <kbd>V</kbd> камера &nbsp; <kbd>1</kbd>–<kbd>5</kbd>/<kbd>R</kbd> телепорт &nbsp; <kbd>E</kbd> выйти · exit</div>
    <div class="d-touch"><button data-k="nitro">NITRO</button><button data-k="hop" hidden>HOP</button><button data-k="flip" hidden>FLIP</button><button data-k="hand">DRIFT</button><button data-k="brake">STOP</button><button data-k="exit">EXIT</button></div>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const condition = $('.d-condition span');
  $('.d-condition button').addEventListener('click', () => onRepair?.());
  const el = { rpm: $('.d-rpm'), num: $('.d-num'), gear: $('.d-gear'), nitro: $('.d-nitro'), nbar: $('.d-nitro i'), vig: $('.d-vig'), flash: $('.d-flash'), drift: $('.d-drift'), driftN: $('.d-drift span'), keys: $('.d-keys'),
    streaks: $('.d-streaks'), hopKey: $('.d-hopk'), hopBtn: $('.d-touch [data-k="hop"]'), flipBtn: $('.d-touch [data-k="flip"]'), touch: $('.d-touch') };
  const sctx = el.streaks.getContext('2d'), keysDefault = el.keys.innerHTML;
  let keysShown = keysDefault;
  let prof = {};         // per-car words (drive/cars/tuning.js HUD): the label of the boost bar, 'D' for a one-gear (electric) car
  let hasHop = false, hopOff = false, flipOff = false;       // the car can hop (set by its profile); the HOP / FLIP buttons are dimmed
  let shown = false, keyT = 0, lastNum = -1, lastGear = '', flashA = 0, bankT = 0, driftPts = 0, driftShown = 0;
  const streaks = []; for (let i = 0; i < 70; i++) streaks.push({ a: Math.random() * 6.283, r: Math.random(), l: 0.15 + Math.random() * 0.3, w: 0.6 + Math.random() * 1.8 });
  // touch buttons
  for (const b of root.querySelectorAll('.d-touch button')) {
    const k = b.dataset.k, down = (v) => (e) => { e.preventDefault(); if (k === 'nitro') onNitro(v); else if (k === 'hand') onHand(v); else if (k === 'brake') onBrake(v); else if (k === 'hop') onJump?.(v); else if (k === 'flip') onFlip?.(v); else if (v) onExit(); };
    b.addEventListener('pointerdown', down(true)); b.addEventListener('pointerup', down(false)); b.addEventListener('pointercancel', down(false)); b.addEventListener('pointerleave', down(false));
  }
  const resizeStreaks = () => { el.streaks.width = innerWidth; el.streaks.height = innerHeight; };
  addEventListener('resize', resizeStreaks); resizeStreaks();

  return {
    root,
    /** per-car words: { boost: 'NITRO' | 'BOOST', gearD: true }; hop = the car has the gas hops (tuning.hop): the X / C key hint and the HOP / FLIP touch buttons appear */
    setProfile(p, hop = false) {
      prof = p || {}; $('.d-nlab').textContent = prof.boost || 'NITRO'; lastGear = '';
      // the motor boat has no nitro tank, no body damage and its own key line (drive/boat/index.js); a car profile restores all three (the key line is only rewritten when it changes: its hop span is looked up again)
      $('.d-nlab').style.display = $('.d-nitro').style.display = prof.noBoost ? 'none' : ''; $('.d-condition').style.display = prof.noCondition ? 'none' : '';
      const keys = prof.keys || keysDefault;
      if (keys !== keysShown) { keysShown = keys; el.keys.innerHTML = keys; el.hopKey = $('.d-hopk') || { hidden: true }; }
      hasHop = hop; el.hopKey.hidden = el.hopBtn.hidden = el.flipBtn.hidden = !hop; el.touch.classList.toggle('hop', hop);
    },
    show(on) {
      if (on === shown) return; shown = on; document.body.classList.toggle('driving', on);
      if (on) { keyT = 9; el.keys.classList.remove('hide'); driftPts = 0; }
    },
    flash(a) { flashA = Math.max(flashA, a); },
    /** a hop key press the tank could not pay: the boost bar blinks red */
    deny() { el.nitro.classList.remove('deny'); void el.nitro.offsetWidth; el.nitro.classList.add('deny'); },
    /** car: handling.js state; opts { yaw (camera-independent heading), dt, night } */
    update(car, dt) {
      if (!shown) return;
      const body = Math.round(100 * (1 - (car.damage || 0)));
      condition.textContent = body === 100 ? 'BODY 100%' : `${car.damageStage || 'Damaged'} · ${body}%`; condition.style.color = body < 40 ? '#ff917b' : '#fff';
      const kmh = Math.round(car.speed);
      if (kmh !== lastNum) { lastNum = kmh; el.num.textContent = String(kmh); }
      let gear = car.gear === 0 ? 'R' : (car.speed < 1 && car.throttle < 0.05 ? 'N' : String(car.gear));
      if (prof.gearD && gear !== 'R' && gear !== 'N') gear = 'D';
      if (gear !== lastGear) { lastGear = gear; el.gear.textContent = gear; el.gear.classList.add('shift'); setTimeout(() => el.gear.classList.remove('shift'), 140); }
      const f = Math.max(0, Math.min(1, car.rpm));
      el.rpm.setAttribute('stroke-dashoffset', (((ARC.a1 - ARC.a0) * Math.PI / 180 * ARC.r) * (1 - f)).toFixed(1));
      if (hasHop) {      // the HOP / FLIP buttons dim while the tank is too low or the car is in the air
        const H = car.tuning.hop, off = car.air || car.boost < (H?.minTank ?? 0), offF = car.air || car.boost < (H?.minTankFlip ?? H?.minTank ?? 0);
        if (off !== hopOff) { hopOff = off; el.hopBtn.classList.toggle('off', off); }
        if (offF !== flipOff) { flipOff = offF; el.flipBtn.classList.toggle('off', offF); }
      }
      el.nbar.style.transform = `scaleX(${car.boost.toFixed(3)})`; el.nitro.classList.toggle('low', car.boost < 0.22); el.nitro.classList.toggle('burn', car.boosting);
      // streaks + vignette
      const spd = Math.max(0, (car.speed - 95) / 130) + (car.boosting ? 0.45 : 0);
      el.vig.style.opacity = String(Math.min(1, spd * 0.9)); el.vig.classList.toggle('boost', car.boosting);
      const c = sctx, W = el.streaks.width, H = el.streaks.height; c.clearRect(0, 0, W, H);
      if (spd > 0.03) {
        const cx = W / 2, cy = H * 0.52, R0 = Math.hypot(W, H) / 2;
        c.lineCap = 'round';
        for (const s of streaks) {
          s.r += dt * (0.5 + spd * 1.7); if (s.r > 1) { s.r = 0.02; s.a = Math.random() * 6.283; s.l = 0.12 + Math.random() * 0.3; }
          const r0 = (0.30 + 0.7 * s.r * s.r) * R0, r1 = r0 + (0.04 + s.l * spd) * R0 * s.r;
          c.strokeStyle = car.boosting ? `rgba(160,235,255,${(0.5 * spd * s.r).toFixed(3)})` : `rgba(255,255,255,${(0.34 * spd * s.r).toFixed(3)})`;
          c.lineWidth = s.w * (0.5 + s.r * 1.5);
          c.beginPath(); c.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0 * 0.8); c.lineTo(cx + Math.cos(s.a) * r1, cy + Math.sin(s.a) * r1 * 0.8); c.stroke();
        }
      }
      // collision flash
      flashA = Math.max(0, flashA - dt * 2.4); el.flash.style.opacity = String(flashA.toFixed(3));
      // drift counter
      if (car.drifting) { driftPts += Math.abs(car.vL) * Math.max(0, car.speed) * dt * 0.8; bankT = 0; el.drift.classList.remove('bank'); }
      else if (driftPts > 0) { bankT += dt; if (bankT > 0.9) { if (driftPts > 150) { /* banked */ } driftPts = 0; } else el.drift.classList.add('bank'); }
      const dp = Math.round(driftPts / 5) * 5;
      if (dp !== driftShown) { driftShown = dp; el.driftN.textContent = dp ? String(dp) : ''; }
      el.drift.classList.toggle('on', driftPts > 60 && (car.drifting || bankT < 0.9));
      // key hint
      if (keyT > 0) { keyT -= dt; if (keyT <= 0) el.keys.classList.add('hide'); }
    },
  };
}
