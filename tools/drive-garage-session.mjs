// A long-lived browser session for the garage work (one page load, many evaluations): the page is loaded once (reduced module set, headless Edge), then this script watches a command
// file and evaluates its text (the body of an async function, `return` the result) in the page every time the file changes; the JSON result is written to the out file.
//   node tools/drive-garage-session.mjs --cmd <cmd.js> --out <out.json> [--real] [--tod night] [--only environment,streets,city,traffic,drive] [--w 1280 --h 720] [--q low]
// Stop it by writing the single word STOP into the command file (or kill the process). Screenshots: the command may `return { shot: '<path>' }` after calling window.__shotPath = ...
// (the script takes a screenshot into every command's `shot` field when the returned object has one).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleBakedRevision } from './lib/dev-revision.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const CMD = path.resolve(args.cmd), OUT = path.resolve(args.out);
const W = Number(args.w || 1280), H = Number(args.h || 720);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions', `--window-size=${W},${H}`], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: 600000 });
const logs = [];
const write = (o) => fs.writeFileSync(OUT, JSON.stringify(o, null, 1));
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
  page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning' || t === 'warn') { logs.push(`[console.${t}] ${m.text()}`); if (logs.length > 200) logs.shift(); } });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const q = new URLSearchParams({ w: String(W), h: String(H), t: String(args.t ?? 0), q: args.q || 'low', only: args.only || 'environment,streets,city,traffic,drive' });
  if (!args.real) q.set('shot', '1');          // --real: the normal page with the HUD (Start button pressed after the load), as tools/drive-garage-test.mjs
  if (args.tod) q.set('tod', args.tod);
  q.set('cam', `${args.x ?? 579},${args.z ?? 219},0,0`);
  await page.exposeFunction('__snap', async (file) => { await page.screenshot({ path: path.resolve(root, file) }); return true; });          // a command may take several screenshots: await window.__snap('shots/drive/x.png')
  write({ status: 'loading' });
  await page.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: 'load', timeout: 300000 });
  if (args.real) { await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 900000, polling: 500 }); await page.click('#go'); await new Promise((r) => setTimeout(r, 1500)); }
  else await page.waitForFunction('window.__ready === true', { timeout: 900000, polling: 500 });
  const errors = await page.evaluate(() => (window.__errors || []).map((e) => `[module ${e.module}] ${String(e.message).split('\n').slice(0, 4).join(' | ')}`));
  write({ status: 'ready', moduleErrors: errors });
  let last = '';
  for (;;) {
    await new Promise((r) => setTimeout(r, 700));
    let text; try { text = fs.readFileSync(CMD, 'utf8'); } catch (e) { continue; }
    if (text === last) continue; last = text;
    if (text.trim() === 'STOP') break;
    const t0 = Date.now();
    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      void AsyncFunction;
      const res = await page.evaluate(`(async () => { ${text}\n})()`);
      if (res && res.shot) { await page.screenshot({ path: path.resolve(root, res.shot) }); }
      write({ status: 'done', ms: Date.now() - t0, result: res, logs: logs.splice(0).filter((l) => !/X4000|Program Info Log/.test(l)).slice(-20) });
    } catch (e) { write({ status: 'error', message: e.message, logs: logs.splice(0).filter((l) => !/X4000|Program Info Log/.test(l)).slice(-20) }); }
  }
} catch (e) {
  write({ status: 'failed', message: e.message });
} finally {
  await browser.close(); server.close();
}
