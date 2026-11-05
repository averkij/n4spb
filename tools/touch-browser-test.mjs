// Browser regression + screenshots for the touch controls (src/core/touch.js, boot-guard.js, the touch CSS of index.html): Edge via puppeteer-core with isMobile + hasTouch emulation,
// real multi-touch (page.touchscreen.touchStart handles: several fingers at once), the fast harness (?baked=0&only=drive&noroof=1: a drive-only build, ~6 s per page).
//   node tools/touch-browser-test.mjs [--only desktop,mobile,layout,portrait,boot,failure,settings,full] [--out shots/touch]
// GPU / browser tools run ONE AT A TIME (the lead serialises them: gpulock.sh node tools/touch-browser-test.mjs). Exit code 1 when a check fails. Screenshots: <out>/*.png (LOOK at them).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {}; for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const ONLY = args.only ? new Set(args.only.split(',')) : null;
const OUT = path.resolve(root, args.out || 'shots/touch'); fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/index.html`;
const FAST = 'baked=0&only=drive&noroof=1&gate=0&guard=0&teleports=1'; // explicit development mode: fixtures exercise the otherwise disabled Places menu
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const threeRoot = path.join(root, 'node_modules', 'three');

let fails = 0, passes = 0;
const check = (name, ok, detail = '') => { if (ok) { passes++; console.log('  ok   ' + name); } else { fails++; console.log('  FAIL ' + name + (detail !== '' ? '  -> ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); } };
const near = (a, b, eps) => Math.abs(a - b) <= eps;

/** a fresh incognito context + page (own sessionStorage / localStorage), viewport / UA / init script set, three.js served from node_modules, console errors collected */
async function open(o = {}) {
  const ctxB = await browser.createBrowserContext();
  const page = await ctxB.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.location().url || '') && !/favicon|__baked_revision/.test(m.location().url || '')) errors.push('console.error ' + m.text().slice(0, 200) + ' ' + (m.location().url || '')); });      // (/__baked_revision is a 404 on a static host, handled by the page)
  page.on('pageerror', (e) => errors.push('pageerror ' + String(e.message).slice(0, 240)));
  if (o.mobile !== false) await page.setViewport({ width: o.w || 844, height: o.h || 390, deviceScaleFactor: o.dsf || 2, isMobile: true, hasTouch: true, isLandscape: (o.w || 844) > (o.h || 390) });
  else await page.setViewport({ width: o.w || 1280, height: o.h || 720, deviceScaleFactor: 1 });
  if (o.ua) await page.setUserAgent(o.ua);
  if (o.init) await page.evaluateOnNewDocument(o.init);
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());
    if (m) { const f = path.join(threeRoot, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); }
    if (o.block && o.block.test(req.url())) return req.abort('failed');
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(req.url())) return req.abort('failed');      // offline-safe: the page falls back to system fonts (the loader times the fonts out after 6 s)
    req.continue();
  });
  return { page, errors, ctxB, close: () => ctxB.close() };
}
async function load(page, query, o = {}) {
  await page.goto(`${BASE}?${query}`, { waitUntil: 'load', timeout: 120000 });
  if (o.noWait) return;
  await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 120000, polling: 400 });
}
async function start(page) { await page.tap('#go'); await page.waitForFunction("document.body.classList.contains('playing')", { timeout: 10000 }); await sleep(1000); }      // (the intro fades out over 0.9 s)
const shot = async (page, name) => { const f = path.join(OUT, name + '.png'); await page.screenshot({ path: f }); console.log('       screenshot ' + path.relative(root, f)); return f; };

const snap = (page) => page.evaluate(() => {
  const p = __ctx.playerObj, d = window.__drive, c = d && d.active ? d.car : null;
  return { pos: { x: p.pos.x, y: p.pos.y, z: p.pos.z }, camY: __camera.position.y, yaw: p.yaw, pitch: p.pitch, fly: p.fly, keys: [...p.keys], tm: [p.touchMove.x, p.touchMove.y], mode: window.__tc ? __tc.mode : null, held: window.__tc ? [...__tc.held] : [],
    drive: d ? d.active : false, view: d ? d.view.mode : null,
    car: c ? { speed: c.speed, yaw: c.yaw, steer: c.steer, boosting: c.boosting, boost: c.boost, drifting: c.drifting, vF: c.vF, vL: c.vL, damage: c.damage, x: c.x, z: c.z } : null,
    ts: window.__tc ? { steer: __tc.state.steer, thr: __tc.state.thr, brk: __tc.state.brk, nitro: __tc.state.nitro, hand: __tc.state.hand, active: __tc.state.active } : null };
});
const centre = (page, id) => page.evaluate((id) => { const b = __tc.btns[id].getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height, hidden: __tc.btns[id].hidden }; }, id);
const fwd = (yaw) => [-Math.sin(yaw), -Math.cos(yaw)];
const wrapPi = (d) => ((d + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
async function tapBtn(page, id) {
  const secondary = { horn: 'Horn', auto: 'Auto gas:', repair: 'Repair car' };
  if (secondary[id]) {
    await tapBtn(page, 'menu'); await sleep(450);
    const c = await page.evaluate((text) => {
      const b = [...document.querySelectorAll('.tc-menu button')].find(b => b.textContent.includes(text));
      if (!b) throw new Error('Missing menu action: ' + text);
      b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, secondary[id]);
    await page.touchscreen.tap(c.x, c.y); await sleep(100); return c;
  }
  const c = await centre(page, id); await page.touchscreen.tap(c.x, c.y); return c;
}
async function holdBtn(page, id) { const c = await centre(page, id); return page.touchscreen.touchStart(c.x, c.y); }

/** the geometry audit of the visible touch buttons against each other and the HUD (page coordinates) */
const layoutAudit = (page) => page.evaluate(() => {
  const R = (el) => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, right: b.right, bottom: b.bottom, w: b.width, h: b.height }; };
  const vis = (el) => { const cs = getComputedStyle(el); return !el.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && el.getBoundingClientRect().width > 0; };
  const btns = [...document.querySelectorAll('#tc .tc-b')].filter(vis).map((b) => ({ id: b.dataset.id, ...R(b) }));
  const hud = {};
  for (const [k, s] of Object.entries({ speedo: '#drive .d-speedo', minimap: '#minimap', clock: '#clock', toast: '#toast .sign' })) { const el = document.querySelector(s); if (el && vis(el) && (k !== 'speedo' || document.body.classList.contains('driving')) && (k !== 'toast' || document.getElementById('toast').classList.contains('show'))) hud[k] = R(el); }
  const cs = getComputedStyle(document.documentElement);
  return { btns, hud, W: innerWidth, H: innerHeight, ins: { l: parseFloat(cs.getPropertyValue('--tc-l')) || 0, r: parseFloat(cs.getPropertyValue('--tc-r')) || 0, t: parseFloat(cs.getPropertyValue('--tc-t')) || 0, b: parseFloat(cs.getPropertyValue('--tc-b')) || 0 } };
});
const hit = (a, b, gap = 0) => a.x < b.right + gap && b.x < a.right + gap && a.y < b.bottom + gap && b.y < a.bottom + gap;
function auditChecks(tag, A, { strictInsets = true } = {}) {
  const bad = [];
  for (const b of A.btns) {
    if (Math.min(b.w, b.h) < 43.9) bad.push(`${b.id} is ${b.w.toFixed(0)}x${b.h.toFixed(0)}`);
    if (b.x < A.ins.l - 0.5 || b.right > A.W - A.ins.r + 0.5 || b.y < 0 || b.bottom > A.H - A.ins.b + 0.5) bad.push(`${b.id} outside the safe area`);
  }
  check(`${tag}: every visible button >= 44 px and inside the safe area (${A.btns.map((b) => b.id).join(' ')})`, bad.length === 0, bad);
  const ov = [];
  for (let i = 0; i < A.btns.length; i++) for (let j = i + 1; j < A.btns.length; j++) if (hit(A.btns[i], A.btns[j], 7.9)) ov.push(`${A.btns[i].id}/${A.btns[j].id}`);
  check(`${tag}: no two buttons overlap or sit closer than 8 px`, ov.length === 0, ov);
  const hv = [];
  for (const b of A.btns) for (const [k, r] of Object.entries(A.hud)) if (k !== 'toast' && hit(b, r, 0)) hv.push(`${b.id} x ${k}`);
  check(`${tag}: no button covers the minimap / speedometer / clock`, hv.length === 0, hv);
  const toast = A.hud.toast ? A.btns.filter((b) => hit(b, A.hud.toast, 0)).map((b) => b.id + ' x toast') : [];
  check(`${tag}: the (transient) toast does not sit under a button`, toast.length === 0, toast);
}

// =================================================================================================================================================================================
const SCENARIOS = {};

// ---------------------------------------------------------------- 5. the desktop page is untouched
SCENARIOS.desktop = async () => {
  const s = await open({ mobile: false });
  try {
    await load(s.page, FAST + '&cam=560,219.9,-90,0');
    const a = await s.page.evaluate(() => ({ tc: document.documentElement.classList.contains('tc'), tcEl: !!document.getElementById('tc'), tcObj: typeof window.__tc, q: __ctx.quality.name, shadow: __ctx.quality.shadowMap, msaa: __ctx.quality.msaa,
      dTouch: getComputedStyle(document.querySelector('.d-touch')).display, sel: getComputedStyle(document.body).userSelect, overscroll: getComputedStyle(document.documentElement).overscrollBehaviorY, places: getComputedStyle(document.getElementById('places')).display,
      help: getComputedStyle(document.getElementById('help')).display, pos: getComputedStyle(document.documentElement).position, requestLock: String(__ctx.playerObj.requestLock).includes('{}') || String(__ctx.playerObj.requestLock).length < 40 }));
    check('desktop: no html.tc, no #tc, no window.__tc', !a.tc && !a.tcEl && a.tcObj === 'undefined', a);
    check('desktop: tier performance (the default) with the full GPU settings (shadow 2048, MSAA 4)', a.q === 'performance' && a.shadow === 2048 && a.msaa === 4, a);
    check('desktop: the old chips and help are shown, the old .d-touch buttons hidden, no touch CSS (user-select, overscroll, position)', a.places !== 'none' && a.help !== 'none' && a.dTouch === 'none' && a.sel !== 'none' && a.overscroll === 'auto' && a.pos === 'static', a);
    await s.page.click('#go'); await sleep(500);
    const p0 = await snap(s.page);
    await s.page.keyboard.down('w'); await sleep(900); await s.page.keyboard.up('w');
    const p1 = await snap(s.page), [fx, fz] = fwd(p1.yaw), moved = (p1.pos.x - p0.pos.x) * fx + (p1.pos.z - p0.pos.z) * fz;
    check('desktop: keyboard W still walks (>= 1.5 m in 0.9 s)', moved > 1.5, moved);
    await s.page.keyboard.press('e'); await sleep(200);
    check('desktop: no console errors', s.errors.length === 0, s.errors);
  } finally { await s.close(); }
  // ?touch=1 forces the touch UI on a desktop (hybrid laptops, tests), ?touch=0 forces it off on a phone
  const f = await open({ mobile: false });
  try { await load(f.page, FAST + '&touch=1'); check('desktop ?touch=1: html.tc, #tc, tier performance', await f.page.evaluate(() => document.documentElement.classList.contains('tc') && !!document.getElementById('tc') && __ctx.quality.name === 'performance')); check('desktop ?touch=1: no console errors', f.errors.length === 0, f.errors); } finally { await f.close(); }
  const z = await open({});
  try { await load(z.page, FAST + '&touch=0'); check('phone ?touch=0: the touch UI is off (no html.tc, no #tc), tier performance', await z.page.evaluate(() => !document.documentElement.classList.contains('tc') && !document.getElementById('tc') && __ctx.quality.name === 'performance')); } finally { await z.close(); }
};

// ---------------------------------------------------------------- 6-18 walk, fly, interact, drive, release safety (one page, 844 x 390 landscape)
SCENARIOS.mobile = async () => {
  const s = await open({ w: 844, h: 390 });
  const page = s.page;
  try {
    await load(page, FAST + '&cam=560,219.9,-90,0');
    await shot(page, 'intro-844x390');
    await start(page);
    const info = await page.evaluate(() => ({ tc: document.documentElement.classList.contains('tc'), q: __ctx.quality.name, shadow: __ctx.quality.shadowMap, msaa: __ctx.quality.msaa, mode: __tc.mode,
      overscroll: getComputedStyle(document.documentElement).overscrollBehaviorY, sel: getComputedStyle(document.documentElement).userSelect, ta: getComputedStyle(document.documentElement).touchAction, callout: getComputedStyle(document.documentElement).webkitTouchCallout,
      canvasTa: getComputedStyle(document.getElementById('scene')).touchAction, lookTa: getComputedStyle(document.getElementById('tc-look')).touchAction, placesFs: parseFloat(getComputedStyle(document.getElementById('places')).fontSize), qualityFs: parseFloat(getComputedStyle(document.getElementById('quality')).fontSize),
      pos: getComputedStyle(document.documentElement).position, ctxMenu: (() => { const e = new Event('contextmenu', { cancelable: true, bubbles: true }); document.getElementById('tc-look').dispatchEvent(e); return e.defaultPrevented; })(),
      gesture: (() => { const e = new Event('gesturestart', { cancelable: true, bubbles: true }); document.dispatchEvent(e); return e.defaultPrevented; })(), help: getComputedStyle(document.getElementById('help')).display, keysRow: getComputedStyle(document.querySelector('#intro .keys .kb')).display,
      manifest: document.querySelector('link[rel=manifest]')?.getAttribute('href'), apple: document.querySelector('meta[name=apple-mobile-web-app-capable]')?.content, icon: document.querySelector('link[rel=apple-touch-icon]')?.getAttribute('href') }));
    check('phone: html.tc, the lighter tier by default, mobile GPU overrides (shadow map 1024, MSAA 2)', info.tc && info.q === 'performance' && info.shadow === 1024 && info.msaa === 2, info);
    check('browser chrome: overscroll none, user-select none, touch-action manipulation (html), none on the game surface, no callout, html fixed', info.overscroll === 'none' && info.sel === 'none' && info.ta === 'manipulation' && info.canvasTa === 'none' && info.lookTa === 'none' && info.pos === 'fixed', info);
    check('browser chrome: select fonts >= 16 px (no iOS focus zoom); context menu and iOS gesturestart are cancelled; the key-hint help and the keyboard keys row are hidden', info.placesFs >= 16 && info.qualityFs >= 16 && info.ctxMenu && info.gesture && info.help === 'none' && info.keysRow === 'none', info);
    check('page: manifest link, apple-mobile-web-app-capable, apple-touch-icon present', info.manifest === './manifest.webmanifest' && info.apple === 'yes' && !!info.icon, info);
    const man = await page.evaluate(() => fetch('./manifest.webmanifest').then((r) => r.json()).catch(() => null));
    check('manifest: fullscreen + landscape, icons 192 / 512 / maskable', !!man && man.display === 'fullscreen' && man.orientation === 'landscape' && man.icons.some((i) => i.sizes === '192x192') && man.icons.some((i) => i.sizes === '512x512') && man.icons.some((i) => i.purpose === 'maskable'), man);
    const iconsOk = await page.evaluate(async () => { const r = []; for (const u of ['assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/icon-maskable-512.png', 'assets/icons/apple-touch-icon.png']) r.push((await fetch(u)).ok); return r; });
    check('icons: all four PNGs are served', iconsOk.every(Boolean), iconsOk);
    check('walk layout: jump run fly menu; sound lives in Menu', await page.evaluate(() => Object.entries(__tc.btns).filter(([, b]) => !b.hidden).map(([k]) => k).sort().join(',') === 'fly,jump,menu,run'), await page.evaluate(() => Object.entries(__tc.btns).filter(([, b]) => !b.hidden).map(([k]) => k).sort().join(',')));
    await sleep(6800);      // the coach mark fades
    await shot(page, 'walk-844x390');
    auditChecks('walk 844x390', await layoutAudit(page));

    // ---- 6. the stick moves the walker, the look does not move it
    const sz = await page.evaluate(() => { const r = document.getElementById('tc-stick').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    let a0 = await snap(page);
    let hs = await page.touchscreen.touchStart(150, 300); await hs.move(150, 240);      // 60 px up = full push (run)
    await sleep(1000);
    let a1 = await snap(page); let [fx, fz] = fwd(a0.yaw);
    const moved = (a1.pos.x - a0.pos.x) * fx + (a1.pos.z - a0.pos.z) * fz;
    check(`stick: a full push walks (and runs) forward: ${moved.toFixed(1)} m in 1 s`, moved > 4 && a1.keys.length === 0 && a1.tm[1] < -0.95, { moved, a1 });
    check('stick: the yaw did not change', near(a1.yaw, a0.yaw, 0.01), [a0.yaw, a1.yaw]);
    await hs.end(); await sleep(450);
    a0 = await snap(page); await sleep(500); a1 = await snap(page);
    check('stick: released -> touchMove exactly 0 and the walker stops', a1.tm[0] === 0 && a1.tm[1] === 0 && Math.hypot(a1.pos.x - a0.pos.x, a1.pos.z - a0.pos.z) < 0.05, { tm: a1.tm, d: Math.hypot(a1.pos.x - a0.pos.x, a1.pos.z - a0.pos.z) });
    a0 = await snap(page); hs = await page.touchscreen.touchStart(150, 300); await hs.move(150, 272); await sleep(1000); a1 = await snap(page);
    const half = ((a1.pos.x - a0.pos.x) * fwd(a0.yaw)[0] + (a1.pos.z - a0.pos.z) * fwd(a0.yaw)[1]);
    check(`stick: a half push is an analogue walk (not a run): ${half.toFixed(2)} m in 1 s`, half > 0.6 && half < 2.4, half); await hs.end(); await sleep(300);

    // ---- 7. look drag
    a0 = await snap(page);
    let hl = await page.touchscreen.touchStart(480, 200);
    for (let i = 1; i <= 10; i++) { await hl.move(480 + i * 20, 200); await sleep(16); }
    await sleep(500); a1 = await snap(page); await hl.end();
    const dyaw = wrapPi(a1.yaw - a0.yaw), want = -0.0022 * 2.2 * 200;
    check(`look: a 200 px drag right turns the view by ${want.toFixed(3)} rad (+-6 %): got ${dyaw.toFixed(3)}`, near(dyaw, want, Math.abs(want) * 0.06), { dyaw, want });
    a0 = await snap(page); hl = await page.touchscreen.touchStart(480, 200);
    for (let i = 1; i <= 40; i++) { await hl.move(480, 200 - i * 12); await sleep(8); }
    await sleep(500); a1 = await snap(page); await hl.end();
    check('look: pitch clamps at 85 degrees', near(a1.pitch, 85 * Math.PI / 180, 0.02), a1.pitch);
    hl = await page.touchscreen.touchStart(480, 100); for (let i = 1; i <= 50; i++) { await hl.move(480, 100 + i * 12); await sleep(8); } await sleep(400); await hl.end();

    // ---- 8. stick + look at once; two fingers in the look zone = ONE finger; a third finger is ignored
    a0 = await snap(page);
    hs = await page.touchscreen.touchStart(150, 300); await hs.move(150, 262);
    hl = await page.touchscreen.touchStart(500, 160);
    for (let i = 1; i <= 8; i++) { await hl.move(500 + i * 12, 160); await sleep(16); }
    await sleep(700); a1 = await snap(page);
    const yawBoth = wrapPi(a1.yaw - a0.yaw), movedBoth = Math.hypot(a1.pos.x - a0.pos.x, a1.pos.z - a0.pos.z);
    check(`stick + look at once: the view turned (${yawBoth.toFixed(2)} rad) AND the walker moved (${movedBoth.toFixed(1)} m)`, yawBoth < -0.3 && movedBoth > 1.2, { yawBoth, movedBoth });
    const third = await page.touchscreen.touchStart(650, 300); await third.move(700, 300); await sleep(200);
    const a2 = await snap(page); await third.end();
    check('a third finger is ignored (no role)', a2.held.length === 0 && (await page.evaluate(() => __tc.ptrs.size)) === 2, { held: a2.held });
    await hs.end(); await hl.end(); await sleep(500);
    a0 = await snap(page);
    const f1 = await page.touchscreen.touchStart(480, 150), f2 = await page.touchscreen.touchStart(620, 250);
    for (let i = 1; i <= 10; i++) { await f1.move(480 + i * 10, 150); await f2.move(620 + i * 10, 250); await sleep(16); }
    await sleep(500); a1 = await snap(page); await f1.end(); await f2.end();
    const two = wrapPi(a1.yaw - a0.yaw), one = -0.0022 * 2.2 * 100;
    check(`two fingers in the look zone turn the view like ONE finger (${two.toFixed(3)} vs ${one.toFixed(3)} rad)`, near(two, one, Math.abs(one) * 0.15), { two, one });

    // ---- 9. jump, run latch, fly (up / down)
    const poll = (ms) => page.evaluate((ms) => new Promise((res) => { const p = __ctx.playerObj, y0 = p.pos.y, t0 = performance.now(); let mx = 0; (function f() { mx = Math.max(mx, p.pos.y - y0); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(mx); })(); }), ms);
    const pj = poll(700); await tapBtn(page, 'jump'); const jumped = await pj;
    check(`JUMP: the walker leaves the ground (${jumped.toFixed(2)} m)`, jumped > 0.4, jumped);
    await sleep(300);
    await tapBtn(page, 'run'); await sleep(150);
    let st = await snap(page); const saved1 = await page.evaluate(() => JSON.parse(localStorage.getItem('piter.touch') || '{}'));
    check('RUN latch: ShiftLeft is held, the setting is saved', st.keys.includes('ShiftLeft') && saved1.runLatch === true, { keys: st.keys, saved1 });
    hs = await page.touchscreen.touchStart(150, 300); await hs.move(150, 272); a0 = await snap(page); await sleep(1000); a1 = await snap(page);
    const latchSpeed = Math.hypot(a1.pos.x - a0.pos.x, a1.pos.z - a0.pos.z);
    check(`RUN latch: the same half push now runs (${latchSpeed.toFixed(2)} m/s vs ${half.toFixed(2)} walking)`, latchSpeed > half * 1.8, { latchSpeed, half }); await hs.end();
    await tapBtn(page, 'run'); await sleep(150); st = await snap(page);
    check('RUN latch: off again, ShiftLeft released', !st.keys.includes('ShiftLeft'), st.keys);
    await sleep(500);
    await tapBtn(page, 'fly'); await sleep(1600); st = await snap(page);
    check('FLY: the walker takes off, the layout switches to the flight buttons (up down boost fly)', st.fly && st.mode === 'fly' && await page.evaluate(() => Object.entries(__tc.btns).filter(([, b]) => !b.hidden).map(([k]) => k).sort().join(',') === 'boost,down,fly,menu,up'), { fly: st.fly, mode: st.mode });
    await shot(page, 'fly-844x390');
    auditChecks('fly 844x390', await layoutAudit(page));
    a0 = await snap(page); const hu = await holdBtn(page, 'up'); await sleep(250); const mid = await snap(page); await sleep(750); a1 = await snap(page); await hu.end(); await sleep(150); const after = await snap(page);
    check(`UP (hold): the flyer climbs (${(a1.camY - a0.camY).toFixed(1)} m), Space held while pressed and released after`, a1.camY - a0.camY > 4 && mid.keys.includes('Space') && !after.keys.includes('Space'), { d: a1.camY - a0.camY, mid: mid.keys, after: after.keys });
    await sleep(500); a0 = await snap(page); const hd = await holdBtn(page, 'down'); await sleep(700); a1 = await snap(page); await hd.end();
    check(`DOWN (hold): the flyer sinks (${(a0.camY - a1.camY).toFixed(1)} m)`, a0.camY - a1.camY > 2, { a0: a0.camY, a1: a1.camY });
    await sleep(300);
    await tapBtn(page, 'fly'); await sleep(2500); st = await snap(page);
    check('LAND: back to the walk layout', !st.fly && st.mode === 'walk', { fly: st.fly, mode: st.mode });

    // ---- 10. USE: the contextual interact button gets into the car, EXIT gets out
    await page.evaluate(() => __setCam(576.2, null, 219.9, -90, 0)); await sleep(600);
    let ib = await centre(page, 'interact'); const lbl = await page.evaluate(() => document.getElementById('tc-label').textContent);
    check(`USE: a button appears next to the car with its label ("${lbl}")`, !ib.hidden && /машин|car/i.test(lbl) && !/\[E\]|^E\b/.test(lbl), { hidden: ib.hidden, lbl });
    await shot(page, 'walk-near-car-844x390');
    auditChecks('walk + USE 844x390', await layoutAudit(page));
    await page.touchscreen.tap(ib.x, ib.y); await sleep(1500); st = await snap(page);
    check('USE: tap -> driving the car, drive layout', st.drive && st.mode === 'drive', st);
    // walk away from the car: USE disappears when nothing is in reach
    const driveBtns = await page.evaluate(() => Object.entries(__tc.btns).filter(([, b]) => !b.hidden).map(([k]) => k).sort().join(','));
    check('drive layout: compact pedals and actions; occasional controls live in Menu', driveBtns === 'brake,cam,exit,gas,hand,menu,nitro', driveBtns);
    await sleep(6500);
    await shot(page, 'drive-844x390');
    auditChecks('drive 844x390', await layoutAudit(page));

    // ---- 12/13. pedals, analogue steering
    let hw = await page.touchscreen.touchStart(150, 280);
    await hw.move(150 + 70, 280); await sleep(700); st = await snap(page);
    check(`wheel: a full-lock swipe at a standstill -> steer ~ -1 (state ${st.ts.steer.toFixed(2)}, car ${st.car.steer.toFixed(2)})`, near(st.ts.steer, -1, 0.02) && near(st.car.steer, -1, 0.1), st.ts);
    await hw.end(); await sleep(500); hw = await page.touchscreen.touchStart(150, 280);
    await hw.move(150 + 40.7, 280); await sleep(700); st = await snap(page);
    check(`wheel: a half-lock swipe -> car steer ~ -0.5 (analogue; car ${st.car.steer.toFixed(2)})`, st.car.steer < -0.45 && st.car.steer > -0.56, st.car);
    await hw.end(); await sleep(300); hw = await page.touchscreen.touchStart(150, 280); await hw.move(150 - 70, 280); await sleep(600); st = await snap(page);
    check('wheel: a swipe to the other side steers left (steer > 0), symmetric', near(st.ts.steer, 1, 0.02) && st.car.steer > 0.8, st.ts);
    await hw.move(150, 280); await sleep(400); st = await snap(page);
    check('wheel: back at the touch point -> steer 0 (dead zone)', st.ts.steer === 0, st.ts);
    await hw.end(); await sleep(300);
    const nevsky = () => page.evaluate(() => { __drive.teleport(502, 158, -1.797); __ctx.playerObj.touchMove.set(0, 0); });      // Nevsky, heading west-south-west: ~120 m of free road
    await nevsky(); await sleep(300);
    const yaw0 = (await snap(page)).car.yaw;
    const hg = await holdBtn(page, 'gas'); await sleep(1300); st = await snap(page);
    check(`GAS (hold): the car accelerates (${st.car.speed.toFixed(0)} km/h after 1.3 s), thr 1 through the encoder (touchMove y ${st.tm[1].toFixed(2)})`, st.car.speed > 25 && st.ts.thr === 1 && near(st.tm[1], -1 / 1.3, 0.01), { speed: st.car.speed, tm: st.tm });
    hw = await page.touchscreen.touchStart(150, 280); await hw.move(150 + 30, 280); await sleep(1100); st = await snap(page);
    const yawRate = wrapPi(st.car.yaw - yaw0);
    check(`steer + gas at once (the old single-stick limit): the car turns (${yawRate.toFixed(2)} rad) while the gas stays on (speed ${st.car.speed.toFixed(0)} km/h, held ${st.held.join(',')})`, Math.abs(yawRate) > 0.12 && st.car.speed > 25 && st.held.includes('gas'), { yawRate, speed: st.car.speed, held: st.held });
    // ---- 14. nitro with gas + steer
    await hw.end(); await nevsky(); await sleep(200); hw = await page.touchscreen.touchStart(150, 280); await hw.move(150 + 30, 280); await sleep(500);
    const hn = await holdBtn(page, 'nitro'); await sleep(500); st = await snap(page);
    const p1ring = await page.evaluate(() => parseFloat(__tc.btns.nitro.querySelector('.tc-ring').style.getPropertyValue('--p')));
    check(`NITRO + steer + gas (three fingers): the boost burns (boosting ${st.car.boosting}, tank ${st.car.boost.toFixed(2)}, ring ${p1ring.toFixed(2)})`, st.car.boosting === true && st.car.boost < 0.97 && p1ring < 0.99 && st.keys.includes('ShiftLeft'), { st, p1ring });
    await shot(page, 'drive-nitro-844x390');
    // ---- 15. drift (handbrake) with gas + steer
    await hn.end(); await sleep(100); await page.evaluate(() => { const c = __drive.car; __drive.teleport(502, 158, -1.797); }); await sleep(1100);
    const hh = await holdBtn(page, 'hand'); await sleep(900); st = await snap(page);
    check(`DRIFT: gas + steer + handbrake -> car.drifting (vL ${st.car.vL.toFixed(1)}, ${st.car.speed.toFixed(0)} km/h)`, st.car.drifting === true && st.keys.includes('Space'), { car: st.car, keys: st.keys });
    await hh.end(); await hw.end(); await sleep(300);
    st = await snap(page);
    check('released nitro + handbrake: their keys are gone, no boost', !st.keys.includes('ShiftLeft') && !st.keys.includes('Space') && (await sleep(200), (await snap(page)).car.boosting === false), st.keys);
    // without GAS no boost
    await hg.end(); await sleep(200);
    const hn2 = await holdBtn(page, 'nitro'); await sleep(400); st = await snap(page); await hn2.end();
    check('NITRO without GAS does not boost (handling.js needs thr > 0.05)', st.car.boosting === false, st.car);
    // ---- brake, reverse
    await nevsky(); await sleep(200); const hg2 = await holdBtn(page, 'gas'); await sleep(1200); await hg2.end();
    const before = (await snap(page)).car.speed;
    let hb = await holdBtn(page, 'brake'); await sleep(1200); st = await snap(page);
    check(`BRAKE (hold) brakes the car (${before.toFixed(0)} -> ${st.car.speed.toFixed(0)} km/h) through touchMove y +1`, st.car.speed < before * 0.35 && st.ts.brk === 1 && near(st.tm[1], 1, 0.001), { speed: st.car.speed, tm: st.tm });
    await sleep(3000); st = await snap(page); await hb.end();
    check(`BRAKE at a standstill reverses (vF ${st.car.vF.toFixed(1)} m/s)`, st.car.vF < -1, st.car.vF);
    // ---- 17. camera, horn, hop, repair, auto-gas
    await page.evaluate(() => { window.__horns = 0; __drive.sound.horn = () => { window.__horns++; }; window.__keysSeen = []; addEventListener('keydown', (e) => window.__keysSeen.push(e.code)); });
    const v0 = (await snap(page)).view; await tapBtn(page, 'cam'); await sleep(200); const v1 = (await snap(page)).view;
    check(`CAM: V cycles the view (${v0} -> ${v1})`, v1 === (v0 + 1) % 3, [v0, v1]);
    await tapBtn(page, 'horn'); await sleep(150);
    check('HORN: G reaches sound.horn()', (await page.evaluate(() => window.__horns)) === 1);
    check('HOP and FLIP are hidden for the coupe', (await centre(page, 'hop')).hidden === true && (await centre(page, 'flip')).hidden === true);
    await page.evaluate(() => { __drive.vehicle.def.hop = true; }); await sleep(250);
    check('HOP and FLIP appear for a car whose def has a hop (the Roadster)', (await centre(page, 'hop')).hidden === false && (await centre(page, 'flip')).hidden === false);
    await shot(page, 'drive-hop-844x390');
    auditChecks('drive + HOP + FLIP 844x390', await layoutAudit(page));
    await tapBtn(page, 'hop'); await sleep(150);
    check('HOP: a tap sends KeyX (drive.js latches it and hops on that very step)', (await page.evaluate(() => window.__keysSeen.includes('KeyX'))) === true);
    await tapBtn(page, 'flip'); await sleep(150);
    check('FLIP: a tap sends KeyC (the barrel hop; in fly mode C stays the descend key)', (await page.evaluate(() => window.__keysSeen.includes('KeyC'))) === true);
    st = await snap(page); check('HOP / FLIP are presses, not holds: no KeyX / KeyC left in player.keys, nothing held', !st.keys.includes('KeyX') && !st.keys.includes('KeyC') && st.held.length === 0, { keys: st.keys, held: st.held });
    await page.evaluate(() => { delete __drive.vehicle.def.hop; });
    await page.evaluate(() => { const d = __drive; d.teleport(d.car.x, d.car.z, d.car.yaw); d.damage.hit({ type: 'hit', v: 14, localX: 0, localZ: 2, localNX: 0, localNZ: -1 }); }); await sleep(400);
    check('damaged car keeps repair in the menu, away from driving controls', await page.evaluate(() => !__tc.btns.repair && __drive.car.damage > 0));
    await shot(page, 'drive-repair-844x390');
    auditChecks('drive + FIX 844x390', await layoutAudit(page));
    await tapBtn(page, 'repair'); await sleep(250); st = await snap(page);
    check('menu REPAIR: the car is repaired and returns to play', st.car.damage === 0 && (await page.evaluate(() => __drive.damage.amount === 0 && !__ctx.ui.open)), st.car.damage);
    await tapBtn(page, 'auto'); await sleep(1300); st = await snap(page);
    check(`AUTO gas: the car pulls away without the pedal (${st.car.speed.toFixed(0)} km/h), setting saved`, st.car.speed > 20 && await page.evaluate(() => JSON.parse(localStorage.getItem('piter.touch')).autoGas === true), st.car);
    // ---- EXIT is refused at speed, works at a standstill
    await tapBtn(page, 'exit'); await sleep(400); st = await snap(page);
    check(`EXIT above 25 km/h is refused (still driving at ${st.car && st.car.speed.toFixed(0)} km/h)`, st.drive === true, st.car);
    await tapBtn(page, 'auto'); await page.evaluate(() => { const d = __drive; d.teleport(d.car.x, d.car.z, d.car.yaw); }); await sleep(300);
    await tapBtn(page, 'exit'); await sleep(900); st = await snap(page);
    check('EXIT at a standstill: out of the car, the walk layout is back, ctx.touch inactive, no key / touchMove left behind', !st.drive && st.mode === 'walk' && st.ts.active === false && st.keys.length === 0 && st.tm[0] === 0 && st.tm[1] === 0, st);
    // ---- 17b. the Roadster's two hop buttons for real (hop v3): HOP = X (the simple hop), FLIP = C (the barrel hop); each fires on the PRESS, with a second finger while the GAS is held
    {
      const has = await page.evaluate(() => !!(__drive.vehicleById && __drive.vehicleById('roadster')));
      if (!has) console.log('       (no roadster in this harness: the hop buttons were only checked with the def.hop switch above)');
      else {
        await page.evaluate(() => { __drive.enter('roadster'); window.__keysSeen = []; }); await sleep(1500);
        const vis = await page.evaluate(() => ['hop', 'flip'].map((id) => __tc.btns[id].hidden));
        check('Roadster drive layout: HOP and FLIP both appear (no def hack)', vis.join() === 'false,false', vis);
        await shot(page, 'drive-roadster-844x390'); auditChecks('drive Roadster 844x390 (HOP + FLIP)', await layoutAudit(page));
        const hc = await centre(page, 'hop'), fc = await centre(page, 'flip');
        check(`HOP (${hc.w.toFixed(0)} px) and FLIP (${fc.w.toFixed(0)} px) keep fingertip-sized targets`, hc.w >= 44 && fc.w >= 44, { hop: hc.w, flip: fc.w });
        await page.evaluate(() => { __drive.car.boost = 1; });
        const gas = await holdBtn(page, 'gas'); await sleep(900);                           // finger 1: the GAS pedal stays down
        const K = () => page.evaluate(() => { const c = __drive.car; return { air: !!c.air, h: +c.h.toFixed(2), vy: +c.vy.toFixed(1), barrel: !!c.barrel, flipOn: !!c.flipOn, flip: c.flip, boost: +c.boost.toFixed(3), held: __tc.held.size, keys: [...__ctx.playerObj.keys].filter((x) => x === 'KeyX' || x === 'KeyC'), dimH: __tc.btns.hop.classList.contains('dim'), dimF: __tc.btns.flip.classList.contains('dim') }; });
        const k0 = await K(); check('GAS held by finger 1, on the ground, both buttons lit', k0.held === 1 && !k0.air && !k0.dimH && !k0.dimF, k0);
        await page.touchscreen.tap(hc.x, hc.y); await sleep(70); const x1 = await K();           // finger 2: HOP
        check(`HOP: the simple hop starts on the press (70 ms later ${x1.h} m up, vy ${x1.vy}), no roll, GAS still held`, x1.air && x1.h > 0.1 && x1.vy > 0 && !x1.barrel && !x1.flipOn && x1.held === 1 && x1.keys.length === 0 && x1.dimH && x1.dimF, x1);
        await sleep(1900); const x2 = await K(); check('HOP: back on the road (the buttons light up again)', !x2.air && x2.h === 0 && !x2.dimH, x2);
        await page.evaluate(() => { __drive.car.boost = 1; }); await sleep(250);
        await page.touchscreen.tap(fc.x, fc.y); await sleep(70); const c1 = await K();          // finger 2: FLIP
        check(`FLIP: the barrel hop starts on the press (70 ms later ${c1.h} m up), rolling`, c1.air && c1.h > 0.1 && c1.barrel && c1.flipOn && c1.held === 1 && c1.keys.length === 0, c1);
        await sleep(500); const c2 = await K(); check(`FLIP: the barrel height (${c2.h} m after 0.57 s: higher than the simple hop ever gets, 1.86 m)`, c2.air && c2.h > 2.4 && Math.abs(c2.flip) > 0.5, c2);
        await page.touchscreen.tap(hc.x, hc.y); await sleep(100); const c3 = await K();          // HOP in the air: nothing
        check('HOP in the air does nothing (still the same barrel hop, the tank untouched)', c3.air && c3.barrel && Math.abs(c3.boost - c2.boost) < 0.04, { c2, c3 });
        await sleep(2500); const c4 = await K(); check(`FLIP: lands level (flip ${c4.flip}) with GAS still held`, !c4.air && c4.h === 0 && c4.flip === 0 && !c4.flipOn && c4.held === 1, c4);
        await gas.end().catch(() => {}); await page.evaluate(() => { __drive.exit(true); }); await sleep(900);
      }
    }
    // ---- 18. release safety
    await page.evaluate(() => { __drive.enter('coupe'); }); await sleep(900);
    let hgas = await holdBtn(page, 'gas'); await sleep(500);
    let held = await page.evaluate(() => __tc.held.size), spd = (await snap(page)).car.speed;
    check(`release safety: GAS held (speed ${spd.toFixed(0)})`, held === 1 && spd > 5);
    const hmenu = await holdBtn(page, 'menu'); await sleep(50); await hmenu.end(); await sleep(500);
    st = await snap(page);
    check('release safety: opening the MENU releases every role (held, keys, touchMove) while the car coasts', st.held.length === 0 && st.tm[0] === 0 && st.tm[1] === 0 && !st.keys.includes('ShiftLeft') && (await page.evaluate(() => !!__ctx.ui.open)), st);
    await shot(page, 'menu-844x390');
    await page.evaluate(() => __ctx.ui.close()); await hgas.end().catch(() => {}); await sleep(300);
    hgas = await holdBtn(page, 'gas'); await sleep(300);
    await page.evaluate(() => { window.dispatchEvent(new Event('blur')); }); await sleep(100);
    check('release safety: window blur releases GAS', (await page.evaluate(() => __tc.held.size)) === 0);
    await hgas.end().catch(() => {}); await sleep(100);
    hgas = await holdBtn(page, 'gas'); await sleep(300);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); }); await sleep(100);
    check('release safety: a hidden tab releases GAS', (await page.evaluate(() => __tc.held.size)) === 0);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await hgas.end().catch(() => {}); await sleep(100);
    hgas = await holdBtn(page, 'gas'); await sleep(300);
    await page.evaluate(() => { const id = [...__tc.ptrs.keys()][0]; document.getElementById('tc').dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: id })); }); await sleep(100);
    check('release safety: pointercancel releases GAS', (await page.evaluate(() => __tc.held.size)) === 0);
    await hgas.end().catch(() => {});
    check('mobile: no console errors', s.errors.length === 0, s.errors);
  } finally { await s.close(); }
};

// ---------------------------------------------------------------- 19/20 layouts at other sizes and in portrait, safe-area insets, the rotate banner
SCENARIOS.portrait = async () => {
  const s = await open({ w: 390, h: 844 });
  const page = s.page;
  try {
    await load(page, FAST + '&cam=560,219.9,-90,0');
    await start(page);
    const banner = await page.evaluate(() => { const b = document.getElementById('tc-rotate'); return { shown: b.classList.contains('show'), text: b.textContent, pe: getComputedStyle(b).pointerEvents }; });
    check('portrait 390x844: the "rotate your phone" banner is shown', banner.shown && /Rotate|Поверните/.test(banner.text), banner);
    await sleep(6800);
    await shot(page, 'walk-390x844');
    auditChecks('walk 390x844', await layoutAudit(page));
    await page.evaluate(() => { __drive.enter('coupe'); }); await sleep(1000);
    await shot(page, 'drive-390x844');
    auditChecks('drive 390x844', await layoutAudit(page));
    await page.evaluate(() => { __drive.exit(true); }); await sleep(500);
    // the banner does not block the game: a stick drag below it works in portrait too
    const a0 = await snap(page); const hs = await page.touchscreen.touchStart(100, 600); await hs.move(100, 540); await sleep(700); const a1 = await snap(page); await hs.end();
    check('portrait: the stick still walks', Math.hypot(a1.pos.x - a0.pos.x, a1.pos.z - a0.pos.z) > 1, a1.pos);
    await page.tap('#tc-rotate button'); await sleep(200);
    check('banner: dismissed', !(await page.evaluate(() => document.getElementById('tc-rotate').classList.contains('show'))));
    await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true }); await sleep(500);
    check('landscape 844x390: no banner', !(await page.evaluate(() => document.getElementById('tc-rotate').classList.contains('show'))));
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: false }); await sleep(500);
    check('the dismissal is remembered for the session (portrait again: still hidden)', !(await page.evaluate(() => document.getElementById('tc-rotate').classList.contains('show'))));
    check('portrait: no console errors', s.errors.length === 0, s.errors);
  } finally { await s.close(); }
};

SCENARIOS.layout = async () => {
  const s = await open({ w: 844, h: 390, dsf: 1 });
  const page = s.page;
  try {
    await load(page, FAST + '&cam=560,219.9,-90,0');
    await start(page); await sleep(6800);
    for (const [w, h] of [[915, 412], [667, 375], [568, 320], [1180, 820], [820, 1180], [360, 640]]) {
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true, isLandscape: w > h }); await sleep(450);
      auditChecks(`walk ${w}x${h}`, await layoutAudit(page));
      await page.evaluate(() => { __drive.enter('coupe'); }); await sleep(900);
      await page.evaluate(() => { __drive.vehicle.def.hop = true; }); await sleep(250);
      auditChecks(`drive ${w}x${h} (hop shown)`, await layoutAudit(page));
      if (w === 667 || w === 1180) await shot(page, `drive-${w}x${h}`);
      await page.evaluate(() => { delete __drive.vehicle.def.hop; __drive.exit(true); }); await sleep(500);
    }
    // landscape safe-area insets (a notched phone: 47 px left / right, 21 px bottom), through the --sai-* test override
    await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1, isMobile: true, hasTouch: true, isLandscape: true }); await sleep(300);
    await page.evaluate(() => { const r = document.documentElement.style; r.setProperty('--sai-l', '47px'); r.setProperty('--sai-r', '47px'); r.setProperty('--sai-b', '21px'); window.dispatchEvent(new Event('resize')); }); await sleep(400);
    auditChecks('walk 844x390 with 47 px notch insets', await layoutAudit(page));
    await page.evaluate(() => { __drive.enter('coupe'); }); await sleep(900);
    auditChecks('drive 844x390 with 47 px notch insets', await layoutAudit(page));
    const g = await page.evaluate(() => ({ gas: __tc.btns.gas.getBoundingClientRect().right, minimap: document.getElementById('minimap').getBoundingClientRect().left }));
    check(`insets: the pedals keep 47 px from the right edge (${g.gas}), the minimap from the left (${g.minimap})`, g.gas <= 844 - 47 + 0.5 && g.minimap >= 46.5, g);
    await shot(page, 'drive-insets-844x390');
    check('layout: no console errors', s.errors.length === 0, s.errors);
  } finally { await s.close(); }
};

// ---------------------------------------------------------------- 22/23 settings panel, persistence, left-handed, tilt, places
SCENARIOS.settings = async () => {
  const s = await open({ w: 844, h: 390 });
  const page = s.page;
  try {
    await load(page, FAST + '&cam=560,219.9,-90,0');
    await start(page); await sleep(500);
    await tapBtn(page, 'menu'); await sleep(500);
    check('MENU opens the panel (game input locked)', await page.evaluate(() => !document.getElementById('panel').hidden && __ctx.playerObj.inputLock > 0));
    const places = await page.evaluate(() => document.querySelectorAll('.tc-places button').length);
    check(`MENU lists the places as 44 px+ rows (${places})`, places >= 5 && await page.evaluate(() => [...document.querySelectorAll('.tc-places button')].every((b) => b.getBoundingClientRect().height >= 44)));
    await shot(page, 'menu-places-844x390');
    const x0 = await snap(page);
    await page.evaluate(() => [...document.querySelectorAll('.tc-places button')][4].click()); await sleep(900);
    const x1 = await snap(page);
    check('MENU -> a place teleports the walker (and closes the panel)', Math.hypot(x1.pos.x - x0.pos.x, x1.pos.z - x0.pos.z) > 20 && await page.evaluate(() => document.getElementById('panel').hidden), { x0: x0.pos, x1: x1.pos });
    await tapBtn(page, 'menu'); await sleep(700);
    await page.evaluate(() => [...document.querySelectorAll('.tc-menu button')].find((b) => /Controls settings|Управление/.test(b.textContent)).click()); await sleep(700);
    await shot(page, 'settings-844x390');
    const sliders = await page.evaluate(() => document.querySelectorAll('.tc-menu input[type=range]').length);
    check(`settings panel: sliders and toggles present (${sliders} sliders)`, sliders >= 4);
    await page.evaluate(() => { const r = [...document.querySelectorAll('.tc-row')].find((x) => /Look sensitivity/.test(x.textContent)).querySelector('input'); r.value = '1.7'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.evaluate(() => { const r = [...document.querySelectorAll('.tc-row')].find((x) => /Auto gas/.test(x.textContent)).querySelector('input'); r.click(); });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('piter.touch')));
    check('settings: a slider and a toggle are saved to localStorage at once', near(saved.lookSens, 1.7, 1e-9) && saved.autoGas === true, saved);
    await page.evaluate(() => { const r = [...document.querySelectorAll('.tc-row')].find((x) => /Left-handed/.test(x.textContent)).querySelector('input'); r.click(); }); await sleep(300);
    const lh = await page.evaluate(() => ({ stick: document.getElementById('tc-stick').getBoundingClientRect().left, jump: __tc.btns.jump.getBoundingClientRect().left, menu: __tc.btns.menu.getBoundingClientRect().left, cls: document.documentElement.classList.contains('tc-lh') }));
    check('left-handed: the stick zone moves to the right, JUMP to the left, the top corner stays', lh.stick > 300 && lh.jump < 100 && lh.menu > 700 && lh.cls, lh);
    await page.evaluate(() => __ctx.ui.close()); await sleep(200);
    await shot(page, 'walk-lefthanded-844x390');
    auditChecks('walk left-handed 844x390', await layoutAudit(page));
    // the left-handed stick walks
    const a0 = await snap(page); const sz = await page.evaluate(() => { const r = document.getElementById('tc-stick').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const hs = await page.touchscreen.touchStart(sz.x, sz.y); await hs.move(sz.x, sz.y - 40); await sleep(900); const a1 = await snap(page); await hs.end();
    check('left-handed: the mirrored stick zone walks', Math.hypot(a1.pos.x - a0.pos.x, a1.pos.z - a0.pos.z) > 0.8);
    // persistence across a reload
    await page.reload({ waitUntil: 'load' }); await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 120000, polling: 400 });
    const re = await page.evaluate(() => ({ s: __tc.settings, cls: document.documentElement.classList.contains('tc-lh') }));
    await start(page);
    check('settings persist across a reload (look sensitivity, auto gas, left-handed)', near(re.s.lookSens, 1.7, 1e-9) && re.s.autoGas === true && re.s.leftHanded === true, re);
    // tilt steering: a synthetic devicemotion rolls the wheel
    await page.evaluate(() => { __tc.settings.leftHanded = false; __tc.settings.autoGas = false; __tc.settings.steerMode = 'tilt'; __tc.layout(); __drive.enter('coupe'); }); await sleep(900);
    await page.evaluate(() => __tc.enableTilt()); await sleep(100);
    const motion = (rollDeg) => page.evaluate((rollDeg) => {
      const th = rollDeg * Math.PI / 180, g = 9.81, sx = g * Math.sin(th), sy = g * Math.cos(th), ang = (screen.orientation && screen.orientation.angle) || 0;
      const inv = [[sx, sy], [sy, -sx], [-sx, -sy], [-sy, sx]][((Math.round(ang / 90) % 4) + 4) % 4];
      window.dispatchEvent(new DeviceMotionEvent('devicemotion', { accelerationIncludingGravity: { x: inv[0], y: inv[1], z: 0 } }));
    }, rollDeg);
    await motion(0); await sleep(100); await motion(0); await sleep(150);
    let st = await snap(page);
    check('tilt: upright -> steer 0; the recentre button and the wheel gauge are shown, arrows are not', st.ts.steer === 0 && !(await centre(page, 'recentre')).hidden && (await centre(page, 'arrowL')).hidden, st.ts);
    await motion(20); await sleep(150); st = await snap(page);
    check(`tilt: +20 degrees (wheel turned counter-clockwise) -> steer left (${st.ts.steer.toFixed(2)})`, st.ts.steer > 0.5 && st.ts.steer < 0.75, st.ts);
    await motion(-45); await sleep(150); st = await snap(page);
    check('tilt: -45 degrees -> full lock right', near(st.ts.steer, -1, 0.001), st.ts);
    await shot(page, 'drive-tilt-844x390');
    // arrows with the ramp
    await page.evaluate(() => { __tc.settings.steerMode = 'arrows'; __tc.layout(); }); await sleep(400);
    await shot(page, 'drive-arrows-844x390');
    auditChecks('drive arrows 844x390', await layoutAudit(page));
    const ha = await holdBtn(page, 'arrowL'); await sleep(60); const early = (await snap(page)).ts.steer; await sleep(500); const late = (await snap(page)).ts.steer; await ha.end();
    check(`arrows: a gentle start then full lock (${early.toFixed(2)} -> ${late.toFixed(2)})`, early > 0.25 && early < 0.9 && late > 0.99, { early, late });
    check('settings: no console errors', s.errors.length === 0, s.errors);
  } finally { await s.close(); }
};

// ---------------------------------------------------------------- 24 mobile boot: fullscreen, orientation lock, wake lock
const STUBS = `(() => { window.__calls = [];
  Object.defineProperty(document, 'fullscreenEnabled', { get: () => true });
  Element.prototype.requestFullscreen = function () { window.__calls.push('fullscreen'); return Promise.resolve(); };
  try { Object.defineProperty(screen, 'orientation', { value: { angle: 90, lock: (o) => { window.__calls.push('lock:' + o); return Promise.resolve(); }, addEventListener() {}, removeEventListener() {} }, configurable: true }); } catch (e) {}
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: (t) => { window.__calls.push('wake:' + t); const s = new EventTarget(); s.release = () => {}; window.__sentinel = s; return Promise.resolve(s); } } });
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (p) => { (window.__vibes = window.__vibes || []).push(p); return true; } });
})();`;
SCENARIOS.boot = async () => {
  const s = await open({ w: 844, h: 390, dsf: 1, init: STUBS });
  try {
    const page = s.page;
    await load(page, FAST + '&cam=560,219.9,-90,0');
    await page.tap('#go'); await sleep(900);
    const calls = await page.evaluate(() => window.__calls.slice());
    check(`#go: fullscreen requested, THEN the orientation lock, plus the wake lock (${calls.join(' > ')})`, calls[0] === 'fullscreen' && calls.includes('wake:screen') && calls.indexOf('lock:landscape') > calls.indexOf('fullscreen'), calls);
    await page.evaluate(() => { window.__sentinel.dispatchEvent(new Event('release')); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(100);
    await page.evaluate(() => { delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); }); await sleep(300);
    const calls2 = await page.evaluate(() => window.__calls.filter((c) => c === 'wake:screen').length);
    check('visibilitychange back to visible re-requests the wake lock', calls2 === 2, calls2);
    // haptics: a button press vibrates; the setting turns it off
    const hv = await page.evaluate(() => (window.__vibes || []).length);
    await page.touchscreen.tap(...(await (async () => { const c = await centre(page, 'jump'); return [c.x, c.y]; })())); await sleep(100);
    const hv2 = await page.evaluate(() => (window.__vibes || []).length);
    check(`haptics: a button press vibrates through navigator.vibrate (${hv} -> ${hv2})`, hv2 > hv);
    check('boot: no console errors', s.errors.length === 0, s.errors);
  } finally { await s.close(); }
  const iph = await open({ w: 390, h: 844, dsf: 1, init: STUBS.replace("Object.defineProperty(document, 'fullscreenEnabled', { get: () => true });", '').replace(/try \{ Object.defineProperty\(screen, 'orientation'[^\n]*\n/, '').replace(/Object.defineProperty\(navigator, 'vibrate'[^\n]*\n/, ''),
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1' });
  try {
    await load(iph.page, FAST); await start(iph.page);
    const calls = await iph.page.evaluate(() => window.__calls.slice());
    check(`iPhone UA: no fullscreen request, nothing throws (${calls.join(',')})`, !calls.includes('fullscreen') && iph.errors.length === 0, { calls, errors: iph.errors });
    await iph.page.evaluate(() => { window.__evs = []; for (const t of ['pointerdown', 'pointerup', 'click']) addEventListener(t, (e) => window.__evs.push(t + ':' + (e.target.id || e.target.className || e.target.tagName)), true); });
    const menu = await (async () => { await iph.page.touchscreen.tap(...(await (async () => { const c = await centre(iph.page, 'menu'); return [c.x, c.y]; })())); await sleep(400); await sleep(300); return iph.page.evaluate(() => (document.querySelector('.tc-menu') || { textContent: 'NO MENU' }).textContent); })();
    check('iPhone UA: the menu explains Add to Home Screen and offers no fullscreen button', /Домой|Home Screen/.test(menu) && !/Полный экран|Fullscreen/.test(menu), menu.slice(0, 160) + ' ' + JSON.stringify(await iph.page.evaluate(() => ({ evs: window.__evs, open: __ctx.ui.open, errs: window.__errors }))));
  } finally { await iph.close(); }
};

// ---------------------------------------------------------------- 25 failure UI: lost context, an error while loading, the crash-loop guard, the phone warning, the loading watchdog
SCENARIOS.failure = async () => {
  let s = await open({ w: 844, h: 390, dsf: 1 });
  try {
    await load(s.page, FAST); await start(s.page);
    await s.page.evaluate(() => document.getElementById('scene').dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
    await sleep(300);
    const f = await s.page.evaluate(() => { const el = document.getElementById('fatal'); return el ? { text: el.textContent, btn: [...el.querySelectorAll('button')].map((b) => b.textContent) } : null; });
    check('webglcontextlost -> a fatal card with a Reload button (no restore attempt)', !!f && /graphics|Графика/.test(f.text) && f.btn.some((b) => /Reload|Перезагрузить/.test(b)), f);
    await shot(s.page, 'fatal-contextlost-844x390');
  } finally { await s.close(); }
  s = await open({ w: 844, h: 390, dsf: 1, init: `HTMLCanvasElement.prototype.getContext = function () { return null; };` });
  try {
    await s.page.goto(`${BASE}?${FAST}`, { waitUntil: 'load' }); await sleep(2500);
    const f = await s.page.evaluate(() => { const el = document.getElementById('fatal'); return el ? { text: el.textContent, detail: el.querySelector('pre') ? el.querySelector('pre').textContent : '' } : null; });
    check('an error while the page loads -> a readable error card (title, advice, the message), not a blank splash', !!f && /could not start|Не удалось/.test(f.text) && f.detail.length > 3, f);
  } finally { await s.close(); }
  // the crash-loop guard: two unfinished starts within a minute (sessionStorage) -> the card instead of loading again
  s = await open({ w: 844, h: 390, dsf: 1, init: `if (!sessionStorage.getItem('piter.boots')) sessionStorage.setItem('piter.boots', JSON.stringify([{ t: Date.now() - 20000, ok: false }, { t: Date.now() - 8000, ok: false }]));` });
  try {
    await s.page.goto(`${BASE}?baked=0&only=drive&noroof=1&q=medium`, { waitUntil: 'load' }); await sleep(1500);
    const c = await s.page.evaluate(() => { const el = document.getElementById('fatal'); return el ? { text: el.textContent, btn: [...el.querySelectorAll('button')].map((b) => b.textContent), loaded: document.body.classList.contains('loaded') } : null; });
    check('crash-loop guard: after two unfinished starts the card offers the Performance tier / try anyway and the build has NOT started', !!c && /перезагружается|reloading/i.test(c.text) && c.btn.some((b) => /Performance|Лёгкий/.test(b)) && c.btn.some((b) => /anyway|Всё равно/.test(b)), c);
    await shot(s.page, 'fatal-crashloop-844x390');
    await s.page.evaluate(() => { [...document.querySelectorAll('#fatal button')].find((b) => /anyway|Всё равно/.test(b.textContent)).click(); });
    await s.page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 120000, polling: 400 });
    await sleep(300);
    const ok = await s.page.evaluate(() => JSON.parse(sessionStorage.getItem('piter.boots') || '[]'));
    check('crash-loop guard: after try anyway the list was cleared and the finished load is marked ok', ok.length >= 1 && ok[ok.length - 1].ok === true, ok);
  } finally { await s.close(); }
  // the phone warning: the first visit of a session asks, the second does not
  s = await open({ w: 844, h: 390, dsf: 1 });
  try {
    await s.page.goto(`${BASE}?baked=0&only=drive&noroof=1&guard=0`, { waitUntil: 'load' }); await sleep(1200);
    const w = await s.page.evaluate(() => { const el = document.getElementById('fatal'); return el ? { text: el.textContent, btn: [...el.querySelectorAll('button')].map((b) => b.textContent), loaded: document.body.classList.contains('loaded') } : null; });
    check('phone warning: heavy-scene note with a "Continue anyway" button; the build waits', !!w && /51/.test(w.text) && w.btn.some((b) => /Continue anyway|Продолжить/.test(b)) && !w.loaded, w);
    await shot(s.page, 'phone-warning-844x390');
    await s.page.tap('#fatal button'); await s.page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 120000, polling: 400 });
    check('phone warning: Continue anyway starts the load and the card is gone', await s.page.evaluate(() => !document.getElementById('fatal')));
    await s.page.reload({ waitUntil: 'load' }); await s.page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 120000, polling: 400 });
    check('phone warning: not shown again in the same session', await s.page.evaluate(() => !document.getElementById('fatal')));
  } finally { await s.close(); }
  // the loading watchdog: main.js never loads (blocked) -> after 45 s without progress the intro card says so
  s = await open({ w: 844, h: 390, dsf: 1, block: /\/src\/main\.js/, init: `(() => { const n = Date.now.bind(Date); let off = 0; Date.now = () => n() + off; window.__warp = (ms) => { off += ms; }; })();` });
  try {
    await s.page.goto(`${BASE}?${FAST}`, { waitUntil: 'load' }); await sleep(2200);
    await s.page.evaluate(() => window.__warp(50000)); await sleep(2500);
    const st = await s.page.evaluate(() => { const el = document.getElementById('stall'); return { hidden: el.hidden, text: el.textContent }; });
    check('loading watchdog: 45 s without progress -> a helpful message with Reload (scripts did not start)', !st.hidden && /Скрипты не загрузились|scripts did not load/i.test(st.text) && /Reload|Перезагрузить/.test(st.text), st);
    await shot(s.page, 'watchdog-844x390');
  } finally { await s.close(); }
};

// ---------------------------------------------------------------- the whole scene (opt-in: --only full; needs ?baked=force while the bake is stale, ~1-2 min)
SCENARIOS.full = async () => {
  const s = await open({ w: 844, h: 390 });
  const page = s.page;
  try {
    const t0 = Date.now();
    await page.goto(`${BASE}?baked=force&gate=0&guard=0`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 400000, polling: 1000 });
    const info = await page.evaluate(() => ({ q: __ctx.quality.name, ms: Math.round(performance.now()), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, errors: window.__errors.length, baked: !!__ctx.baked }));
    console.log(`       full scene ready in ${((Date.now() - t0) / 1000).toFixed(0)} s, heap ${info.heapMB} MB`);
    check('full scene: loaded from the bake on the performance tier, no module errors', info.q === 'performance' && info.baked && info.errors === 0, info);
    await start(page); await sleep(7000);
    await shot(page, 'full-walk-844x390');
    auditChecks('full walk 844x390', await layoutAudit(page));
    const a0 = await snap(page); const hs = await page.touchscreen.touchStart(150, 300); await hs.move(150, 262); await sleep(1500); const a1 = await snap(page); await hs.end();
    check('full scene: the stick walks', Math.hypot(a1.pos.x - a0.pos.x, a1.pos.z - a0.pos.z) > 1.5, a1.pos);
    await page.evaluate(() => __setCam(576.2, null, 219.9, -90, 0)); await sleep(1500);
    const ib = await centre(page, 'interact');
    check('full scene: USE appears at the red car', !ib.hidden);
    if (!ib.hidden) { await page.touchscreen.tap(ib.x, ib.y); await sleep(2000); }
    check('full scene: tap USE -> driving', (await snap(page)).drive === true);
    const hg = await holdBtn(page, 'gas'); await sleep(2500);
    await shot(page, 'full-drive-844x390');
    const fps = await page.evaluate(() => __stats.fps);
    console.log(`       headless fps while driving: ${fps.toFixed(0)} (desktop GPU; a phone is far slower)`);
    auditChecks('full drive 844x390', await layoutAudit(page));
    await hg.end();
    check('full scene: no console errors', s.errors.length === 0, s.errors);
  } finally { await s.close(); }
};

for (const name of Object.keys(SCENARIOS)) {
  if (ONLY ? !ONLY.has(name) : name === 'full') continue;      // full is opt-in
  console.log(`\n== ${name}`);
  try { await SCENARIOS[name](); } catch (e) { fails++; console.log('  FAIL scenario ' + name + ' threw: ' + (e && e.stack || e)); }
}
await browser.close(); server.close();
console.log(`\ntouch-browser-test: ${passes} passed, ${fails} failed  (screenshots in ${path.relative(root, OUT)})`);
process.exit(fails ? 1 : 0);
