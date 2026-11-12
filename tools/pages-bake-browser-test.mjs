// Manual final deployment check after `node tools/pages-assets.mjs --assemble`.
// Exercises the deployed WASM codec and normal loading of representative new pages.
// GPU/browser work: run serially, not alongside other screenshot benchmarks.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startStaticServer } from './lib/static-readonly.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'dist');
const record = JSON.parse(fs.readFileSync(path.join(site, 'vendor/pages-bake-manifest.json'), 'utf8'));
const sample = record.entries.slice().sort((a, b) => a.rawBytes - b.rawBytes)[0];
assert(sample, 'no transformed bake products');
const gtmURL = 'https://www.googletagmanager.com/gtm.js?id=GTM-53ZVSJV3';
const gtmTag = `<script async src="${gtmURL}"></script>`;
const edge = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(p => fs.existsSync(p));
assert(edge, 'Edge/Chrome executable not found');
const server = await startStaticServer(site);
let browser;
try {
  browser = await puppeteer.launch({ executablePath: edge, headless: true,
    args: ['--no-first-run', '--disable-extensions', '--window-size=1280,720'],
    defaultViewport: { width: 1280, height: 720 }, protocolTimeout: 300000 });
  const probe = await browser.newPage();
  await probe.setRequestInterception(true);
  probe.on('request', req => req.url().endsWith('/__brotli_probe')
    ? req.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Brotli probe</title>' })
    : req.continue());
  await probe.goto(`http://127.0.0.1:${server.port}/__brotli_probe`);
  const decoded = await probe.evaluate(async ({ output, rawBytes }) => {
    const { readBakedBuffer } = await import('/src/core/baked-codec.js');
    const response = await fetch('/' + output);
    const bytes = await readBakedBuffer(response, rawBytes);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return { size: bytes.byteLength, sha256: [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('') };
  }, sample);
  assert.deepEqual(decoded, { size: sample.rawBytes, sha256: sample.rawSHA256 });
  console.log(`PASS deployed browser Brotli codec: ${sample.area}/${sample.name}, ${sample.rawBytes} raw bytes`);
  await probe.close();

  for (const [id, pageName] of [['sampson', 'sampson.html'], ['komendantsky', 'komendantsky.html'], ['avtovo', 'avtovo.html']]) {
    const html = fs.readFileSync(path.join(site, pageName), 'utf8').replace(/\r\n/g, '\n');
    assert(html.includes(`<head>\n${gtmTag}\n`), `${id}: exact GTM tag is not first after <head>`);
    assert.equal(html.split(gtmTag).length, 2, `${id}: GTM tag must occur exactly once`);
    const page = await browser.newPage(), errors = [];
    await (await import('./font-transport.mjs')).installFontTransport(page);
    const threeRoot = path.join(root, 'node_modules', 'three');
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (req.url().startsWith('https://www.googletagmanager.com/gtm.js?'))
        return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', body: '' });
      const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());
      if (m) {
        const file = path.join(threeRoot, m[1].split('?')[0]);
        if (fs.existsSync(file)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8',
          headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(file) });
      }
      req.continue();
    });
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('console', m => {
      if (m.type() === 'error' && !/\/(?:__baked_revision|favicon\.ico)$/.test(m.location().url || ''))
        errors.push(`console: ${m.text()} (${m.location().url || 'page'})`);
    });
    const start = Date.now();
    await page.goto(`http://127.0.0.1:${server.port}/${pageName}?q=medium`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 300000, polling: 250 });
    const state = await page.evaluate(() => ({ area: document.documentElement.dataset.area,
      loaded: document.body.classList.contains('loaded'), bake: window.__ctx?.baked?.manifest?.area || null,
      gtm: {
        first: document.head.firstElementChild?.outerHTML,
        count: [...document.querySelectorAll('script[src]')].filter(s => s.src.startsWith('https://www.googletagmanager.com/gtm.js?')).length,
        initialized: Array.isArray(window.dataLayer) && window.dataLayer.some(e =>
          e?.[0] === 'js' && e[1] instanceof Date),
      } }));
    assert.equal(state.area, id); assert(state.loaded);
    assert.equal(state.bake, id, `${id}: normal load fell back to procedural construction`);
    assert.equal(state.gtm.first, `<script async="" src="${gtmURL}"></script>`, `${id}: GTM is not first head element`);
    assert.equal(state.gtm.count, 1, `${id}: GTM script count`);
    assert(state.gtm.initialized, `${id}: dataLayer initialization missing`);
    assert.equal(errors.length, 0, `${id}: ${errors.join('\n')}`);
    console.log(`PASS deployed ${id} page: normal load in ${Date.now() - start} ms, no page/console errors`);
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
