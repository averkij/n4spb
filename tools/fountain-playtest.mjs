// Normal shipping pages, real renderer/input and fresh bakes. Run GPU jobs serially.
// Uses this repository's existing Edge/Puppeteer test workflow.
// node tools/fountain-playtest.mjs --areas palace,moskovskaya,vasilyevsky --q performance
// Add admiralty to inspect the already-animated Alexander Garden fountain.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import { handleBakedRevision } from './lib/dev-revision.mjs';
import { installFontTransport } from './font-transport.mjs';
import { REGISTRY } from '../src/areas/registry.js';

const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) {
  const k = process.argv[i].slice(2); args[k] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1';
}
if (args.help) {
  console.log('GPU, serial only: node tools/fountain-playtest.mjs [--areas palace,moskovskaya,vasilyevsky,admiralty] [--q medium|performance] [--bench 16] [--out shots/fountain-playtest-<q>]');
  process.exit(0);
}
const quality = args.q || 'performance', areas = (args.areas || 'palace,moskovskaya,vasilyevsky').split(',');
assert.ok(['medium', 'performance'].includes(quality), 'use a supported shipping quality tier');
for (const area of areas) assert.ok(REGISTRY[area], `known area ${area}`);
const root = fileURLToPath(new URL('../', import.meta.url)), out = path.resolve(root, args.out || `shots/fountain-playtest-${quality}`);
fs.mkdirSync(out, { recursive: true });
const report = { quality, areas, checks: [], errors: [], captures: [], loads: [], coverage: [], benchmarks: [] };
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  const f = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!f.startsWith(path.resolve(root) + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const executablePath = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const browser = await puppeteer.launch({ executablePath, headless: true, protocolTimeout: 300000,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions'],
  defaultViewport: { width: 1280, height: 720 } });
const sleep = ms => new Promise(r => setTimeout(r, ms));
function check(name, ok, detail) {
  report.checks.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' ' + JSON.stringify(detail) : ''}`); assert.ok(ok, name);
}
async function shot(page, name) {
  const file = `${name}.png`; await page.screenshot({ path: path.join(out, file) }); report.captures.push(file);
}
async function settle(page) { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))))); }

async function coverage(page, area) {
  const result = await page.evaluate(() => {
    const registry = __ctx.services.fountainCoverage, live = __ctx.services.liveFountains?.records || [];
    if (!registry) return { missing: true };
    const inPlay = registry.records.filter(f => __ctx.L.inPlay(f.x, f.z)), byId = new Map(registry.records.map(f => [f.id, f]));
    const resolve = f => {
      const seen = new Set();
      while (f?.status === 'alias' && !seen.has(f.id)) { seen.add(f.id); f = byId.get(f.alias); }
      return f;
    };
    const bad = inPlay.filter(f => !['animated', 'specialist'].includes(resolve(f)?.status)).map(f => ({ id: f.id, status: f.status, reason: f.reason }));
    const effectIds = live.map(f => f.id), duplicates = effectIds.filter((id, i) => effectIds.indexOf(id) !== i);
    const missingEffects = inPlay.filter(f => f.status === 'animated' && (!f.effects?.length || f.effects.some(e => !effectIds.includes(e.id)))).map(f => f.id);
    const fallback = inPlay.find(f => f.status === 'animated' && f.effects?.length && !f.flush) || inPlay.find(f => f.status === 'animated' && f.effects?.length);
    return { inPlay: inPlay.length, animated: inPlay.filter(f => f.status === 'animated').length, specialist: inPlay.filter(f => f.status === 'specialist').length,
      aliases: inPlay.filter(f => f.status === 'alias').length, bad, duplicates, missingEffects, fallbackId: fallback?.effects[0].id, fallbackMappedId: fallback?.id };
  });
  report.coverage.push({ area, ...result });
  check(`${area}: every mapped in-play fountain has live coverage`, !result.missing && result.inPlay > 0 && result.bad.length === 0 && result.missingEffects.length === 0, result);
  check(`${area}: effect IDs are unique`, result.duplicates.length === 0, result.duplicates);
  check(`${area}: generic mapped fallback available for rendered verification`, !!result.fallbackId, result.fallbackMappedId);
  return result;
}

async function visit(page, id) {
  return page.evaluate(async id => {
    const f = __ctx.services.liveFountains?.records.find(f => f.id === id); if (!f) throw Error('Missing live fountain ' + id);
    window.__fountainTestRecord = f;
    const width = Math.max(f.bounds.max.x - f.bounds.min.x, f.bounds.max.z - f.bounds.min.z);
    const distance = Math.max(11, width * 1.45), x = f.x + distance * .86, z = f.z + distance * .51;
    const y = f.group.position.y + 2.7, ty = f.group.position.y + Math.min(4, f.bounds.max.y * .42);
    await __regions?.ensureAt(f.x, f.z);
    __setCam(x, y, z, Math.atan2(x - f.x, z - f.z) * 180 / Math.PI, Math.atan2(ty - y, distance) * 180 / Math.PI);
    __ctx.gates?.teleported();
    return { id, x: f.x, z: f.z, jets: f.nozzles.length, quality: __ctx.quality, dropsPerJet: f.perDrop };
  }, id);
}

async function inspectShared(page, area, id, first) {
  const f = await visit(page, id); await settle(page);
  check(`${area}/${id}: effective shipping tier`, f.quality.name === quality && f.dropsPerJet === (quality === 'performance' ? 3 : 6), f);
  const before = await page.evaluate(() => {
    const f = __fountainTestRecord;
    return { arrays: f.meshes.map(m => Array.from(m.instanceMatrix.array)), emission: f.meshes[0].material.emissiveIntensity,
      active: f.stats.active, counts: f.meshes.map(m => m.count), materials: __ctx.services.liveFountains.records.flatMap(f => f.meshes.map(m => m.material.uuid)) };
  });
  check(`${area}/${id}: bounded live water active`, before.active && before.counts.every(n => n > 0));
  check(`${area}: shared fountain materials`, new Set(before.materials).size === 3);
  await sleep(450);
  const motion = await page.evaluate(before => {
    const f = __fountainTestRecord;
    return f.meshes.map((m, i) => m.instanceMatrix.array.some((v, k) => Math.abs(v - before.arrays[i][k]) > .000001));
  }, before);
  check(`${area}/${id}: jet, sparkle and ripple matrices move`, motion.every(Boolean), motion);
  await shot(page, `${area}-${id}-day`);
  if (first) {
    const bench = await page.evaluate(n => __bench(n), Number(args.bench || 16)); report.benchmarks.push({ area, id, quality, ...bench });
    console.log(`BENCH ${area} ${JSON.stringify(bench)}`);
    await page.evaluate(() => __tod.set('night', true)); await settle(page);
    const night = await page.evaluate(() => ({ night: __fountainTestRecord.stats.night, emission: __fountainTestRecord.meshes[0].material.emissiveIntensity }));
    check(`${area}/${id}: night water highlights`, night.night > .9 && night.emission > before.emission + .5, night);
    await shot(page, `${area}-${id}-night`);
    await page.evaluate(() => __tod.set('day', true)); await settle(page);
    const remote = await page.evaluate(async () => {
      const f = __fountainTestRecord, views = [__ctx.L.HERO, ...__ctx.L.VIEWS].filter(Boolean);
      const v = views.sort((a, b) => Math.hypot(b.x - f.x, b.z - f.z) - Math.hypot(a.x - f.x, a.z - f.z))[0];
      if (!v || Math.hypot(v.x - f.x, v.z - f.z) < f.far + f.radius + 50) throw Error('No sufficiently remote named viewpoint');
      await __regions?.ensureAt(v.x, v.z); __setCam(v.x, 5, v.z, v.yaw || 0, 0); __ctx.gates?.teleported();
      return { x: v.x, z: v.z };
    });
    await settle(page);
    const versions = await page.evaluate(() => __fountainTestRecord.meshes.map(m => m.instanceMatrix.version)); await sleep(400);
    const far = await page.evaluate(versions => ({ active: __fountainTestRecord.stats.active, visible: __fountainTestRecord.group.visible,
      unchanged: __fountainTestRecord.meshes.every((m, i) => m.instanceMatrix.version === versions[i]), counts: __fountainTestRecord.meshes.map(m => m.count) }), versions);
    check(`${area}/${id}: remote camera stops matrix uploads`, !far.active && !far.visible && far.unchanged && far.counts.every(n => n === 0), { ...remote, ...far });
    await visit(page, id); await settle(page);
    check(`${area}/${id}: returning restores animation`, await page.evaluate(() => __fountainTestRecord.stats.active && __fountainTestRecord.meshes.every(m => m.count > 0)));
  }
}

async function nativeLibrary(page) {
  await page.evaluate(async () => { await __regions.ensureAt(-1760, 7456); __setCam(-1760, 4, 7456, 90, 10); __ctx.gates?.teleported(); }); await settle(page);
  const before = await page.evaluate(() => {
    const m = __ctx.dynamicRoot.getObjectByName('rnb-water-droplets'); if (!m) throw Error('Library water missing');
    return Array.from(m.instanceMatrix.array);
  });
  await sleep(450);
  check('moskovskaya/library: original live droplets preserved', await page.evaluate(a => __ctx.dynamicRoot.getObjectByName('rnb-water-droplets').instanceMatrix.array.some((v, i) => v !== a[i]), before));
  await page.evaluate(() => __tod.set('night', true)); await settle(page);
  check('moskovskaya/library: original underwater lights preserved', await page.evaluate(() => __ctx.dynamicRoot.getObjectByName('rnb-water-uplights').material.opacity > .2));
  await shot(page, 'moskovskaya-library-night'); await page.evaluate(() => __tod.set('day', true));
}

async function nativeAlexander(page) {
  await page.evaluate(async () => { await __regions.ensureAt(-2334.8, -494.8); __setCam(-2310, 3, -466, 42, 14); __ctx.gates?.teleported(); }); await settle(page);
  const y = await page.evaluate(() => __ctx.dynamicRoot.getObjectByName('lmH-jets')?.scale.y); await sleep(450);
  check('admiralty/Alexander: original animation preserved', await page.evaluate(y => Number.isFinite(y) && __ctx.dynamicRoot.getObjectByName('lmH-jets')?.scale.y !== y, y));
  await shot(page, 'admiralty-alexander-day');
  await inspectSupplement(page, 'admiralty', 'w74168797');
}

async function inspectSupplement(page, area, id) {
  await visit(page, id); await settle(page);
  const before = await page.evaluate(() => {
    const f = __fountainTestRecord;
    return { drawStreams: f.drawStreams, draws: f.stats.draws, counts: f.meshes.map(m => m.count), version: f.meshes[0].instanceMatrix.version,
      arrays: f.meshes.slice(1).map(m => Array.from(m.instanceMatrix.array)) };
  });
  check(`${area}/${id}: authored streams have no duplicate shared geometry`, before.drawStreams === false && before.draws === 2 && before.counts[0] === 0 && before.counts.slice(1).every(n => n > 0) && before.version === 0, { counts: before.counts, draws: before.draws });
  await sleep(450);
  const motion = await page.evaluate(before => __fountainTestRecord.meshes.slice(1).map((m, i) => m.instanceMatrix.array.some((v, k) => Math.abs(v - before.arrays[i][k]) > .000001)), before);
  check(`${area}/${id}: supplemental droplets and ripples move`, motion.every(Boolean), motion);
  await shot(page, `${area}-${id}-supplement`);
}

async function wadeGlory(page) {
  const route = await page.evaluate(async () => {
    const f = __ctx.services.liveFountains.records.find(f => f.id === 'w32073130'), a = Math.PI / 12;
    const from = { x: f.x + Math.cos(a) * 15, z: f.z + Math.sin(a) * 15 }, to = { x: f.x + Math.cos(a) * 8, z: f.z + Math.sin(a) * 8 };
    await __regions.ensureAt(from.x, from.z); __setCam(from.x, null, from.z, 0, 0); __ctx.gates?.teleported();
    return { from, to, level: __ctx.physics.waterLevel(to.x, to.z) };
  });
  check('moskovskaya/Glory: destination is physical basin water', route.level !== null, route);
  const deadline = Date.now() + 25000;
  try {
    while (Date.now() < deadline) {
      const p = await page.evaluate(() => ({ x: __ctx.playerObj.pos.x, z: __ctx.playerObj.pos.z }));
      const dx = route.to.x - p.x, dz = route.to.z - p.z; if (Math.hypot(dx, dz) < .38) break;
      await page.evaluate(yaw => { __ctx.playerObj.yaw = yaw; __ctx.playerObj.pitch = 0; }, Math.atan2(-dx, -dz));
      await page.keyboard.down('KeyW'); await sleep(70);
    }
  } finally { await page.keyboard.up('KeyW'); }
  const p = await page.evaluate(() => { const p = __ctx.playerObj; return { x: p.pos.x, y: p.pos.y, z: p.pos.z, fly: p.fly, depth: p.depth, water: __ctx.physics.waterLevel(p.pos.x, p.pos.z) }; });
  check('moskovskaya/Glory: real walking enters fountain water', !p.fly && Math.hypot(p.x - route.to.x, p.z - route.to.z) < .5 && p.water !== null && p.depth > .025, p);
  await shot(page, 'moskovskaya-glory-wading');
}

try {
  for (const area of areas) {
    const page = await browser.newPage(); await installFontTransport(page, true);
    page.on('pageerror', e => report.errors.push({ area, message: e.message }));
    page.on('console', m => { if (/^\[module\s|Shader Error|CONTEXT_LOST|update error/.test(m.text())) report.errors.push({ area, message: m.text() }); });
    const t = Date.now();
    await page.goto(`http://127.0.0.1:${server.address().port}/${REGISTRY[area].page}?q=${quality}`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => document.body.classList.contains('loaded') || !!document.getElementById('fatal'), { timeout: 300000 });
    const boot = await page.evaluate(() => ({ area: __ctx.area.ID, manifest: __ctx.baked?.manifest?.area, baked: __ctx.services.baked,
      fatal: document.getElementById('fatal')?.innerText, errors: __errors, title: document.title,
      fountains: __ctx.services.liveFountains?.records.map(f => f.id) || [], canvas: { width: document.getElementById('scene')?.width, height: document.getElementById('scene')?.height } }));
    report.loads.push({ area, seconds: (Date.now() - t) / 1000, ...boot });
    check(`${area}: fresh normal shipping bake`, boot.area === area && boot.manifest === area && !!boot.baked?.revision && boot.baked.failures.length === 0 && !boot.fatal, { manifest: boot.manifest, baked: boot.baked });
    check(`${area}: meaningful page and no startup errors`, !!boot.title && boot.canvas.width > 0 && boot.canvas.height > 0 && boot.errors.length === 0);
    await page.click('#go'); await page.waitForFunction(() => document.body.classList.contains('playing')); await settle(page);
    const mapped = await coverage(page, area);
    if (area === 'palace') {
      await inspectShared(page, area, 'w101292107', true);
      const summer = await page.evaluate(() => __ctx.services.landmarksGarden?.fountains?.find(f => __ctx.services.liveFountains.records.some(r => r.id === f.id))?.id);
      check('palace: Summer Garden live fountains registered', !!summer, summer); await inspectShared(page, area, summer, false);
    } else if (area === 'moskovskaya') {
      await inspectShared(page, area, 'w32073130', true); await nativeLibrary(page); await wadeGlory(page);
    } else if (area === 'vasilyevsky') {
      await inspectShared(page, area, 'w214409237', true); await inspectShared(page, area, 'n12201012355', false);
    } else if (area === 'admiralty') await nativeAlexander(page);
    else {
      check(`${area}: at least one shared live fountain`, boot.fountains.length > 0); await inspectShared(page, area, boot.fountains[0], true);
    }
    await inspectShared(page, area, mapped.fallbackId, false);
    check(`${area}: no failed destination regions`, await page.evaluate(() => __regions.stats.failed === 0));
    check(`${area}: clean module/browser console`, report.errors.filter(e => e.area === area).length === 0, report.errors.filter(e => e.area === area));
    await page.close();
  }
} finally {
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); await new Promise(r => server.close(r));
}
