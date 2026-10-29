// End-to-end test of the knockable street furniture (core/knock.js) in the REAL page (Edge / Chrome with GPU, puppeteer-core), plan T5:
//   1. census: __knock.stats.registered / byKind against the expected range of EVERY family; no console error, no page error, no module error
//   2. every kind: the record nearest Vosstaniya Square (589,173) and the one nearest the Admiralty (-2433,-622) is hit with __knock.hit (40 km/h), 60 x __advance(0.05):
//      stand -> fly -> rest (or lost over open water), the parts moved, the hide parts are zero-scaled, the collider swapped for a rest box (top <= 0.42), no page error
//   3. car-driven: each of the four garage cars (coupe, taxi pickup 'truck', Zhiguli 'lada', 'roadster') drives at 15, 30 and 50 km/h into a bin, a bench, a lamp, a signal pole, a sign post, a mast arm
//      (a fresh record with a clear run-up every time); the table says what held / what broke and the speed the car lost; the tuning expectations are checked
//   node tools/knock-scene-test.mjs [--q medium] [--only census,kinds,cars] [--cars coupe,truck] [--kinds bin,lamp] [--speeds 15,30,50] [--params "a=b"] [--json out.json]
//   While the bake is stale (any src edit) the page needs ?baked=force: the tool adds it by itself when the manifest revision of the area of the page (index.html: palace) differs from the revision of the live tree.
//   Run through the GPU lock when other agents share the machine. Exit code 1 on a failed check.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleBakedRevision, areaOfPath, liveRevision } from './lib/dev-revision.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; }
const only = new Set((args.only || 'census,kinds,cars').split(','));
const CARS = (args.cars || 'coupe,truck,lada,roadster').split(',');
const CAR_KINDS = (args.kinds || 'bin,bench,lamp,signal,sign,arm').split(',');
const SPEEDS = (args.speeds || '15,30,50').split(',').map(Number);

// expected census (tools/check.mjs full module list, plan section 8 T4 + the phase-2 packages); the range is [min, max]
const EXPECT = {
  lamp: [1380, 1470], bench: [940, 1010], bin: [700, 760], bollard: [1560, 1650], chain: [1180, 1250], pot: [205, 225], urn: [60, 70], tub: [30, 36], planter: [30, 36], rack: [118, 128],
  postbox: [4, 6], cabinet: [84, 92], cart: [17, 21], column: [22, 24], citylight: [34, 38], kiosk: [20, 24], booth: [3, 5], aframe: [33, 37], shelter: [33, 35], sign: [720, 770],
  signal: [810, 870], arm: [255, 280], camera: [10, 12], mast: [115, 125],
};
const REQUIRED = new Set(['bin', 'bench', 'lamp', 'signal', 'sign', 'arm']);       // the car-driven families that must always find a record with a clear run-up
const REF = { vosstaniya: [589, 173], admiralty: [-2433, -622] };

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--window-size=1280,720'], defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 }, protocolTimeout: Number(args['protocol-timeout'] || 600000) });
const problems = [], logs = [], result = { census: null, kinds: [], cars: [] };
const fail = (m) => { problems.push(m); console.log('FAIL', m); };
try {
  const page = await browser.newPage();
  await (await import('./font-transport.mjs')).installFontTransport(page);
  const threeRoot = path.join(root, 'node_modules', 'three');
  if (fs.existsSync(threeRoot)) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());
      if (m) { const f = path.join(threeRoot, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); }
      req.continue();
    });
  }
  page.on('console', async (m) => {
    if (m.type() !== 'error') return;
    let t = m.text(); try { const a = await Promise.all(m.args().map((h) => h.evaluate((v) => (v instanceof Error ? v.stack : String(v))).catch(() => '?'))); t = a.join(' ').split('\n').slice(0, 6).join(' / '); } catch (e) { /* keep the text */ }
    logs.push(`[console.error] ${t}`);
  });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.stack || e.message}`));
  const q = new URLSearchParams({ q: args.q || 'medium', t: '30' });
  if (args.params) for (const [k, v] of new URLSearchParams(args.params)) q.set(k, v);
  try {
    const id = areaOfPath(root, '/index.html'), live = liveRevision(root, id);       // the area of THE PAGE it loads (index.html: palace), not a global revision
    const man = JSON.parse(fs.readFileSync(path.join(root, 'assets/baked', id, 'manifest.json'), 'utf8'));
    if (man.revision !== live && !q.has('baked')) { q.set('baked', 'force'); console.log(`the bake of ${id} is stale (${man.revision} vs ${live}): loading with baked=force`); }
  } catch (e) { /* no bake: the page builds procedurally */ }
  await page.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: Number(args['load-timeout'] || 600000), polling: 250 });
  const moduleErrors = await page.evaluate(() => (window.__errors || []).map((e) => `[module ${e.module}] ${String(e.message).split('\n').slice(0, 3).join(' | ')}`));
  for (const e of moduleErrors) fail(e);
  await page.click('#go'); await new Promise((r) => setTimeout(r, 1500));

  // ------------------------------------------------------------------------------------------------------------------------------------------ 1. census
  if (only.has('census')) {
    const cen = await page.evaluate(() => { const s = window.__knock.stats; return { registered: s.registered, byKind: { ...s.byKind }, modules: Object.entries(window.__stats.modules || {}).filter(([, v]) => v && v.ok === false).map(([k]) => k) }; });
    result.census = cen;
    console.log('census:', cen.registered, JSON.stringify(cen.byKind));
    for (const [k, [lo, hi]] of Object.entries(EXPECT)) { const n = cen.byKind[k] || 0; if (n < lo || n > hi) fail(`census: ${k} = ${n}, expected ${lo}..${hi}`); }
    for (const k of Object.keys(cen.byKind)) if (!EXPECT[k]) console.log('note: kind without an expected range:', k, cen.byKind[k]);
    if (cen.modules.length) fail('modules not ok: ' + cen.modules.join(','));
  }

  // ------------------------------------------------------------------------------------------------------------------------------------------ 2. every kind, hit + settle
  if (only.has('kinds')) {
    const kinds = await page.evaluate(() => Object.keys(window.__knock.stats.byKind));
    for (const kind of kinds) for (const [rn, [rx, rz]] of Object.entries(REF)) {
      const r = await page.evaluate(async (kind, rx, rz) => {
        const K = window.__knock, ph = window.__ctx.physics, out = { kind, ok: true, notes: [] };
        let best = null, bd = 1e9;
        for (const it of K.list) if (it.kind === kind && it.state === 'stand') { const d = Math.hypot(it.x - rx, it.z - rz); if (d < bd) { bd = d; best = it; } }
        if (!best) return { kind, ok: false, notes: ['no standing record'] };
        out.x = +best.x.toFixed(1); out.z = +best.z.toFixed(1); out.dist = Math.round(bd); out.mass = best.mass; out.anchored = best.anchored;
        try { await window.__regions?.ensureAt(best.x, best.z); } catch (e) { /* no streamer */ }
        const snap = (p) => p.obj ? Array.from(p.obj.matrix.elements) : Array.from(p.mesh.instanceMatrix.array.slice(p.index * 16, p.index * 16 + 16));
        const before = best.parts.map(snap), items0 = best.items.slice();
        out.items0 = items0.length; out.inGrid0 = items0.filter((c) => ph.items.includes(c)).length;
        const knocked0 = K.stats.knocked, ang = (best.x * 7.3 + best.z * 3.1) % 6.283, dx = Math.cos(ang), dz = Math.sin(ang);
        const hit = K.hit(best.x, best.z, 40, dx, dz, kind);
        if (hit !== best) { out.ok = false; out.notes.push('hit returned another record'); }
        out.state1 = best.state;
        if (best.state !== 'fly') { out.ok = false; out.notes.push('state after hit = ' + best.state); }
        if (K.stats.knocked < knocked0 + 1) { out.ok = false; out.notes.push('stats.knocked did not grow'); }      // a bollard also drops its chain spans (onKnock): more than one
        let sawFly = best.state === 'fly', maxY = best.y, minY = best.y;
        for (let i = 0; i < 60; i++) { window.__advance(0.05); if (best.state === 'fly') sawFly = true; if (best.body) { maxY = Math.max(maxY, best.body.y); minY = Math.min(minY, best.body.y); } }
        out.state = best.state; out.rise = +(maxY - best.y).toFixed(2); out.sink = +(best.y - minY).toFixed(2);
        if (!sawFly) { out.ok = false; out.notes.push('never flew'); }
        if (best.state !== 'rest' && best.state !== 'lost') { out.ok = false; out.notes.push('not settled after 3 s: ' + best.state); }
        const zeroScale = (e) => [0, 1, 2, 4, 5, 6, 8, 9, 10].every((i) => Math.abs(e[i]) < 1e-9);
        let moved = 0, stayed = 0, hid = 0, shown = 0;
        best.parts.forEach((p, i) => {
          const a = snap(p), d = a.reduce((s, v, j) => s + Math.abs(v - before[i][j]), 0);
          if (best.state === 'lost') { if (!zeroScale(a)) { out.ok = false; out.notes.push('lost but part ' + i + ' visible'); } return; }
          if (p.hide) { if (zeroScale(a)) hid++; else { out.ok = false; out.notes.push('hide part ' + i + ' not zero-scaled'); } }
          else if (d > 1e-5) moved++; else { stayed++; out.notes.push('part ' + i + ' did not move'); }
          if (!p.hide && zeroScale(a)) { out.ok = false; out.notes.push('shown part ' + i + ' is zero-scaled'); }
        });
        if (best.state === 'rest' && stayed) out.ok = false;
        out.moved = moved; out.hidden = hid; out.parts = best.parts.length;
        // the collider swap
        out.oldGone = items0.every((c) => !ph.items.includes(c));
        if (items0.length && !out.oldGone) { out.ok = false; out.notes.push('the old collider is still in physics'); }
        if (best.state === 'rest') {
          const c = best.item;
          if (!c || !ph.items.includes(c)) { out.ok = false; out.notes.push('no rest collider'); }
          else { out.restTop = +(c.y1 - c.y0 - 0.05).toFixed(2); if (out.restTop > 0.4201) { out.ok = false; out.notes.push('rest top ' + out.restTop); } if (c.source) { out.ok = false; out.notes.push('rest collider carries a source'); } }
        } else if (best.state === 'lost') { if (best.item || (best.items && best.items.length)) { out.ok = false; out.notes.push('a lost record keeps a collider'); } }
        return out;
      }, kind, rx, rz);
      r.ref = rn; result.kinds.push(r);
      console.log((r.ok ? 'PASS ' : 'FAIL ') + `kind ${kind.padEnd(9)} @${rn.padEnd(10)} (${r.x},${r.z}) d=${r.dist} m=${r.mass}kg a=${r.anchored} -> ${r.state} moved ${r.moved}/${r.parts} hide ${r.hidden} rise ${r.rise} sink ${r.sink} restTop ${r.restTop ?? '-'} ${r.notes.join('; ')}`);
      if (!r.ok) problems.push(`kind ${kind} @${rn}: ${r.notes.join('; ') || 'failed'}`);
    }
    const st = await page.evaluate(() => window.__knock.stats); console.log('after the kinds:', JSON.stringify({ knocked: st.knocked, live: st.live, updateMs: +st.updateMs.toFixed(2) }));
    if (st.live) fail('records still live after the kinds loop: ' + st.live);
  }

  // ------------------------------------------------------------------------------------------------------------------------------------------ 3. car-driven
  if (only.has('cars')) {
    await page.evaluate(() => {
      window.__kcase = async function kcase(carId, kindSpec, kmh, ref, skipIds) {
        const [kind, massF] = kindSpec.split(':');
        const D = window.__drive, K = window.__knock, ph = window.__ctx.physics, { carContact } = await import('/src/world/drive/collision.js');
        const veh = D.vehicleById(carId); if (!veh) return { carId, kind, kmh, error: 'no such car' };
        if (D.active) D.exit(true);
        D.enter(carId);
        const car = D.car, spec = veh.spec, TAU = Math.PI * 2;
        const cands = K.list.filter((r) => r.kind === kind && (!massF || r.mass === Number(massF)) && r.state === 'stand' && !skipIds.has(r)).map((r) => ({ r, d: Math.hypot(r.x - ref[0], r.z - ref[1]) })).sort((a, b) => a.d - b.d);
        const RUN = 11;
        const clear = async (r, yaw, behind) => {
          const dx = Math.sin(yaw), dz = Math.cos(yaw);
          for (let t = RUN; t >= -behind; t -= 0.4) {
            const x = r.x - dx * t, z = r.z - dz * t;
            if (!window.__ctx.L.inPlay(x, z) || car.blocked(x, z)) return false;
            const pc = { x, z, yaw, y: ph.surfaceAt ? Math.max(0, car.groundAt(x, z) - 0.03) : 0 };
            for (const b of ph.querySolids(x, z, 6)) if (!(b.source && b.source.knock === r) && carContact(pc, spec, b, {})) return false;
          }
          return true;
        };
        const tried = [];
        for (let attempt = 0; attempt < 5; attempt++) {
          let pick = null;
          outer: for (const { r } of cands.slice(0, 200)) {
            if (tried.includes(r) || skipIds.has(r) || r.state !== 'stand') continue;
            try { await window.__regions?.ensureAt(r.x, r.z); } catch (e) { /* none */ }
            for (let k = 0; k < 8; k++) { const yaw = k * TAU / 8 + 0.17; if (await clear(r, yaw, 12)) { pick = { r, yaw }; break outer; } }
          }
          if (!pick) outer1: for (const { r } of cands.slice(0, 200)) {
            if (tried.includes(r) || skipIds.has(r) || r.state !== 'stand') continue;
            for (let k = 0; k < 8; k++) { const yaw = k * TAU / 8 + 0.17; if (await clear(r, yaw, 6)) { pick = { r, yaw, walled: true }; break outer1; } }
          }
          if (!pick) outer2: for (const { r } of cands.slice(0, 300)) {                    // against a wall (cabinets, post boxes, kiosks): only the run-up is clear, the speed after the break is then not meaningful
            if (tried.includes(r) || skipIds.has(r) || r.state !== 'stand') continue;
            for (let k = 0; k < 8; k++) { const yaw = k * TAU / 8 + 0.17; if (await clear(r, yaw, 1.8)) { pick = { r, yaw, walled: true }; break outer2; } }
          }
          if (!pick) return { carId, kind: kindSpec, kmh, error: 'no record with a clear run-up' };
          const { r, yaw } = pick, dx = Math.sin(yaw), dz = Math.cos(yaw), v0 = kmh / 3.6;
          tried.push(r);
          D.teleport(r.x - dx * RUN, r.z - dz * RUN, yaw);
          if (D.damage.amount > 0) { car.vx = car.vz = 0; D.repair(); }
          car.vx = dx * v0; car.vz = dz * v0;
          const src = r.src, oi = src.onCarHit, oa = src.applyCarImpulse;
          var o = { carId, kind: kindSpec, kmh, x: +r.x.toFixed(1), z: +r.z.toFixed(1), mass: r.mass, anchored: r.anchored, hitK: r.hitK, attempt, walled: !!pick.walled };
          let contactFrame = -1, v0m = 0, last = kmh, frame = 0, minDist = 99, foreign = null; const post = [];
          const mark = () => { if (contactFrame < 0) { contactFrame = frame; v0m = last; } };
          src.onCarHit = function (...a) { mark(); return oi.apply(this, a); };
          src.applyCarImpulse = function (...a) { mark(); return oa.apply(this, a); };
          const dmg0 = D.damage.amount, series = [];
          const T = RUN / v0 + 1.6;
          D.sim(T, (t) => { last = car.speed; return { thr: contactFrame >= 0 && frame - contactFrame < 25 ? 0 : Math.max(0, Math.min(1, (kmh - car.speed) / 5)), brk: contactFrame < 0 && car.speed > kmh + 3 ? 0.3 : 0, steer: 0, hand: false, nitro: false, jump: false }; }, (i, c) => {
            frame = i + 1; K.update(1 / 60); series.push(c.speed);
            minDist = Math.min(minDist, Math.hypot(c.x - r.x, c.z - r.z));
            if (contactFrame >= 0 && frame - contactFrame > 3) for (const e of c.events) if (e.obstacle && post.length < 4) post.push({ t: frame - contactFrame, v: +e.v.toFixed(1), kind: e.obstacle.source && e.obstacle.source.knock ? e.obstacle.source.knock.kind + ':' + e.obstacle.source.knock.state : e.obstacle.type, y: [+(e.obstacle.y0 ?? 0).toFixed(2), +(e.obstacle.y1 ?? 0).toFixed(2)], at: [+e.x.toFixed(1), +e.z.toFixed(1)] });
            for (const e of c.events) if (e.obstacle && !(e.obstacle.source && e.obstacle.source.knock === r) && e.v > 0.4 && contactFrame < 0 && !foreign) foreign = { v: +e.v.toFixed(1), at: [+e.x.toFixed(1), +e.z.toFixed(1)], src: e.obstacle.source && e.obstacle.source.knock ? e.obstacle.source.knock.kind : (e.obstacle.source ? 'wreck' : e.obstacle.type) };
          });
          src.onCarHit = oi; src.applyCarImpulse = oa; o.post = post; o.items = r.items.length; o.minDist = +minDist.toFixed(2); o.yaw = +yaw.toFixed(2);
          K.update(0.05); D.teleport(ref[0], ref[1], 0); D.exit(true);
          if (foreign) { o.foreign = foreign; continue; }                               // something else was in the way (traffic, a pedestrian): another record
          o.contact = contactFrame >= 0; o.state = r.state; o.wobble = !!r.wobble;
          o.approach = +v0m.toFixed(1);
          if (contactFrame >= 0) {
            const j = Math.min(series.length - 1, contactFrame + 18);                    // 0.3 s after the contact (after1: 1.1 s after, the throttle is back on from 0.4 s: the car must roll over the debris)
            o.after = +series[j].toFixed(1); o.after1 = +series[Math.min(series.length - 1, contactFrame + 66)].toFixed(1); o.lostKmh = +(v0m - series[j]).toFixed(1); o.lostPct = +(100 * (v0m - series[j]) / Math.max(1, v0m)).toFixed(0);
          }
          o.dmg = +(D.damage.amount - dmg0).toFixed(3);
          skipIds.add(r);
          return o;
        }
        o.error = 'foreign contact on every attempt ' + JSON.stringify(o.foreign);
        return o;
      };
    });
    const used = new Set();
    for (const carId of CARS) for (const kind of CAR_KINDS) for (const kmh of SPEEDS) {
      const refName = Object.keys(REF)[(SPEEDS.indexOf(kmh) + CAR_KINDS.indexOf(kind)) % 2], ref = REF[refName];
      let o;
      try { o = await page.evaluate(async (carId, kind, kmh, ref) => { window.__kskip = window.__kskip || new Set(); return window.__kcase(carId, kind, kmh, ref, window.__kskip); }, carId, kind, kmh, ref); }
      catch (e) { o = { carId, kind, kmh, error: (e.stack || e.message).split('\n').slice(0, 5).join(' / ') }; }
      result.cars.push(o);
      if (o.error) {
        if (/no record with a clear run-up/.test(o.error) && !REQUIRED.has(kind.split(':')[0])) { console.log(`SKIP car ${carId} ${kind} ${kmh}: ${o.error} (wall-hugging family)`); continue; }       // cabinets, post boxes, pots, urns, A-frames stand against facades
        fail(`car case ${carId} ${kind} ${kmh}: ${o.error}`); continue;
      }
      console.log(`car ${carId.padEnd(8)} ${kind.padEnd(7)} ${String(kmh).padStart(2)} km/h  ${o.mass}kg/a${o.anchored}  ${o.contact ? (o.state === 'stand' ? 'HELD  ' : 'BROKE ') : 'NO CONTACT'} approach ${o.approach} -> ${o.after ?? '-'} (lost ${o.lostKmh ?? '-'} km/h, ${o.lostPct ?? '-'} %) dmg ${o.dmg}${o.walled ? ' (wall behind)' : ''}`);
    }
    // the expectations of the tuning (docs/DRIVING-COLLISIONS.md)
    const row = (c, k, s) => result.cars.filter((o) => (!c || o.carId === c) && o.kind === k && o.kmh === s && !o.error);
    const expect = (cond, msg) => { if (!cond) fail('tuning: ' + msg); };
    for (const o of result.cars) {
      if (o.error) continue;
      const tag = `${o.carId} ${o.kind} ${o.kmh}`, bk = o.kind.split(':')[0];
      if (!o.contact) { expect(false, `${tag}: the car never touched the record`); continue; }
      const broke = o.state !== 'stand';
      if (['lamp', 'signal'].includes(bk) && o.kmh <= 15) expect(!broke, `${tag}: a parking-speed scrape broke it`);
      if (['lamp', 'signal', 'sign'].includes(bk) && o.kmh >= 25 && o.approach >= 24.5) expect(broke, `${tag}: a ${o.approach} km/h hit did not break it`);
      if (broke && ['lamp', 'signal', 'sign', 'mast', 'bin', 'bench'].includes(bk) && o.approach >= 24.5 && !o.walled) expect(o.after1 >= 6, `${tag}: the car stopped on the lying debris (${o.after1} km/h 1.1 s after the contact)`);
      if (bk === 'arm' || bk === 'column') { if (o.kmh <= 35) expect(!broke, `${tag}: broke below 40 km/h`); if (o.approach >= 46) expect(broke, `${tag}: held at ${o.approach} km/h`); }
      if (bk === 'bin' || bk === 'pot' || bk === 'aframe') expect(broke, `${tag}: a small free thing did not fly`);
      if (['bin', 'bench'].includes(bk)) { expect(broke, `${tag}: a free thing did not fly`); if (bk === 'bin') expect(o.lostPct <= 30, `${tag}: a bin cost the car ${o.lostPct} %`); }
    }
    void row;
  }

  const fin = await page.evaluate(() => ({ errors: (window.__errors || []).length, stats: window.__knock.stats }));
  if (fin.errors) fail(fin.errors + ' module errors after the run');
  for (const l of logs) fail(l.slice(0, 400));
  if (args.json) fs.writeFileSync(path.resolve(root, args.json), JSON.stringify(result, null, 1));
} catch (e) { problems.push(`[test] ${e.stack || e.message}`); }
finally { await browser.close(); server.close(); }
if (problems.length) { console.log('PROBLEMS:'); for (const p of problems) console.log(' -', String(p).slice(0, 500)); process.exit(1); }
console.log('knock scene test OK');
