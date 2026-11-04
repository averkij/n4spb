// Diagnose the real static host without replacing CDN scripts, fonts or assets.
// node tools/hosted-load-probe.mjs [--url URL] [--mobile] [--seconds 180] [--out DIR]
// --block URL_SUBSTRING deliberately fails matching requests for fault diagnosis.
// Mobile emulation is Chromium, NOT an iPhone/WebKit or a mobile memory budget.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import puppeteer from 'puppeteer-core';

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i];
  if (!k.startsWith('--')) throw new Error(`Unexpected argument: ${k}`);
  args[k.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
}
const url = new URL(args.url || 'https://averkij.github.io/n4spb/').href;
const seconds = Number(args.seconds || 180);
if (!(seconds > 0 && seconds <= 1800)) throw new Error('--seconds must be 1..1800');
const out = path.resolve(args.out || path.join(os.tmpdir(), `n4spb-hosted-${Date.now()}`));
fs.mkdirSync(out, { recursive: true });
const executablePath = process.env.CHROME_PATH || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(p => fs.existsSync(p));
if (!executablePath) throw new Error('Set CHROME_PATH to a Chromium browser executable');
const report = { url, mobileEmulation: !!args.mobile, blockedSubstring: args.block || null, started: new Date().toISOString(), samples: [], console: [], errors: [], network: [], workers: [], snapshots: [] };
const browser = await puppeteer.launch({ executablePath, headless: true, protocolTimeout: 20000,
  args: ['--use-angle=d3d11', '--enable-gpu', '--no-first-run', '--disable-extensions'] });
const start = Date.now();
const elapsed = () => Date.now() - start;
const save = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  report.browser = await browser.version();
  const page = await browser.newPage();
  await page.setViewport(args.mobile
    ? { width: 956, height: 440, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: true }
    : { width: 1280, height: 720, deviceScaleFactor: 1 });
  const cdp = await page.createCDPSession();
  async function watchNetwork(session, source) {
    const requests = new Map();
    session.on('Network.requestWillBeSent', e => {
      const row = { source, url: e.request.url, type: e.type, startMs: elapsed() };
      requests.set(e.requestId, row); report.network.push(row);
    });
    session.on('Network.responseReceived', e => {
      Object.assign(requests.get(e.requestId) || {}, { status: e.response.status, mime: e.response.mimeType, encoding: e.response.headers['content-encoding'], responseMs: elapsed(), cache: !!e.response.fromDiskCache });
    });
    session.on('Network.loadingFinished', e => Object.assign(requests.get(e.requestId) || {}, { endMs: elapsed(), encodedBytes: e.encodedDataLength }));
    session.on('Network.loadingFailed', e => Object.assign(requests.get(e.requestId) || {}, { endMs: elapsed(), error: e.errorText }));
    await session.send('Network.enable');
  }
  await watchNetwork(cdp, 'page');
  if (args.block) {
    await page.setRequestInterception(true);
    page.on('request', request => request.url().includes(String(args.block)) ? request.abort('failed') : request.continue());
  }
  browser.on('targetcreated', async target => {
    if (target.type() !== 'other') return;
    try { await watchNetwork(await target.createCDPSession(), target.url()); }
    catch (e) { report.errors.push({ source: 'worker-network', message: String(e) }); }
  });
  page.on('console', m => {
    if (['error', 'warn'].includes(m.type())) report.console.push({ ms: elapsed(), type: m.type(), text: m.text(), location: m.location() });
  });
  page.on('pageerror', e => report.errors.push({ ms: elapsed(), message: String(e) }));
  page.on('error', e => report.errors.push({ ms: elapsed(), source: 'page-crash', message: String(e) }));
  await page.evaluateOnNewDocument(() => {
    performance.setResourceTimingBufferSize(10000);
    window.__loadProbe = { longTasks: [], events: [] };
    try { new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (window.__loadProbe.longTasks.length < 300) window.__loadProbe.longTasks.push({ start: Math.round(e.startTime), duration: Math.round(e.duration) });
      }
    }).observe({ type: 'longtask', buffered: true }); } catch {}
    addEventListener('webglcontextlost', () => window.__loadProbe.events.push('webglcontextlost'), true);
    addEventListener('unhandledrejection', e => window.__loadProbe.events.push(String(e.reason)));
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => report.errors.push({ source: 'navigation', message: String(e) }));
  let last = '', continued = false;
  while (elapsed() < seconds * 1000) {
    const sample = await page.evaluate(() => ({
      title: document.title, area: document.documentElement.dataset.area,
      percent: document.querySelector('#loadpct')?.textContent,
      label: document.querySelector('#loadlabel')?.textContent,
      mainStarted: !!window.__mainStarted, loaded: document.body.classList.contains('loaded'),
      fatal: document.querySelector('#fatal')?.innerText,
      modules: window.__stats?.modules, timing: window.__stats?.timing,
      baked: window.__ctx?.services?.baked, errors: window.__errors,
      environmentPhases: window.__ctx?.services?.environment?.buildPhases,
      environmentFieldReady: !!window.__ctx?.services?.environment?.field,
      stallNotice: document.querySelector('#stall')?.hidden === false ? document.querySelector('#stall')?.innerText : null,
      memory: performance.memory && { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize },
    }));
    sample.ms = elapsed();
    sample.heap = await cdp.send('Runtime.getHeapUsage');
    report.samples.push(sample);
    const key = `${sample.percent}|${sample.label}|${sample.loaded}|${sample.fatal}`;
    if (key !== last) {
      console.log(JSON.stringify({ ms: sample.ms, percent: sample.percent, label: sample.label,
        loaded: sample.loaded, fatal: sample.fatal, heapMiB: Math.round(sample.heap.usedSize / 1048576),
        backingMiB: Math.round(sample.heap.backingStorageSize / 1048576), decoder: sample.baked?.decoder.mode }));
      last = key;
    }
    save();
    if (!continued && sample.fatal?.includes('Continue anyway')) {
      await page.click('#fatal button'); continued = true;
    } else if (sample.fatal) { report.failure = sample.fatal; break; }
    if (sample.loaded) {
      report.loadedMs = sample.ms;
      await page.screenshot({ path: path.join(out, 'loaded.png') });
      report.snapshots.push('loaded.png');
      await page.click('#go');
      await sleep(2000);
      report.interaction = await page.evaluate(() => ({ bodyClass: document.body.className, introClass: document.querySelector('#intro')?.className, touchControls: !!window.__tc, errors: window.__errors }));
      await page.screenshot({ path: path.join(out, 'started.png') });
      report.snapshots.push('started.png');
      break;
    }
    await sleep(1000);
  }
  report.final = await page.evaluate(() => ({ url: location.href, probe: window.__loadProbe,
    resources: performance.getEntriesByType('resource').map(e => ({ name: e.name, duration: e.duration, transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, decodedBodySize: e.decodedBodySize })),
    stats: window.__stats, quality: window.__ctx?.quality,
  }));
  for (const worker of page.workers()) {
    try { report.workers.push({ url: worker.url(), resources: await worker.evaluate(() => performance.getEntriesByType('resource').map(e => ({ name: e.name, duration: e.duration, transferSize: e.transferSize, decodedBodySize: e.decodedBodySize }))) }); } catch {}
  }
  if (!report.loadedMs) { await page.screenshot({ path: path.join(out, 'stalled.png'), timeout: 10000 }); report.snapshots.push('stalled.png'); }
} catch (e) { report.errors.push({ source: 'probe', message: String(e) }); }
finally {
  report.elapsedMs = elapsed(); save();
  console.log(`Report: ${path.join(out, 'report.json')}`);
  await browser.close();
}
const moduleErrors = report.samples.some(s => s.errors?.length);
const playing = report.interaction?.bodyClass?.split(' ').includes('playing');
if (!report.loadedMs || !playing || report.failure || moduleErrors || report.errors.length) process.exitCode = 1;
