// CPU test of the development / test server answer to /__baked_revision (tools/lib/dev-revision.mjs) and of tools/dev-servers-lint.mjs. No browser, no three.js, no GPU, no node_modules.
//   1. the page -> area mapping (Referer pathname: '/' is index.html, '/<name>.html', a base path, query / fragment, unknown pages)
//   2. a REAL http server on the real tree answers, for each of the five live areas, exactly revisionOf(area) of the tool that CI and the bake use (a multi-area server: one server, five Referers)
//   3. 404 without a Referer, for an unknown page, for a foreign path; the query string of the request is harmless; other URLs are not handled (the caller serves them)
//   4. the stat-signature cache on a small fixture tree on disk: the second request does not re-walk; an edit of a closure file does; an edit of a file outside every closure does not;
//      a new file in a folder that a whole-folder rule reads does; a runtime-only file does not change the revision; a broken tree answers 'unscannable' (fail closed, the server survives) and recovers
//   5. every converted server really calls the shared handler (the codemod list), and dev-servers-lint flags an unconverted handler / the global function on virtual trees (and ignores comments)
//   node tools/dev-revision-test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleBakedRevision, areaOfPath, areaOfReferer, liveRevision, liveStatus, resetDevRevisionCache, stats, ENDPOINT } from './lib/dev-revision.mjs';
import { revisionsOf } from './baked-revision.mjs';
import { lintDevServers, toolSources, ENDPOINT_EXEMPT } from './dev-servers-lint.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0, failed = 0;
async function check(name, fn) {
  try { await fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + String(e && e.message || e).split('\n').slice(0, 6).join('\n       ')); }
}

/** GET <url path> with optional headers on a server: { status, headers, body } */
const get = (port, urlPath, headers = {}) => new Promise((resolve, reject) => {
  const req = http.request({ host: '127.0.0.1', port, path: urlPath, method: 'GET', headers }, (res) => {
    const chunks = []; res.on('data', (c) => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
  });
  req.on('error', reject); req.end();
});
/** a server shaped like every converted tool: the shared handler first, then "its own" static part (here: 'static') */
const serverOf = (rootDir, opts) => new Promise((resolve) => {
  const s = http.createServer((req, res) => {
    if (handleBakedRevision(req, res, rootDir, opts)) return;
    res.writeHead(200); res.end('static');
  });
  s.listen(0, '127.0.0.1', () => resolve({ port: s.address().port, close: () => new Promise((r) => s.close(r)) }));
});

// ---------------------------------------------------------------------------------------------------------- a fixture tree on disk (default rules of tools/lib/closure-rules.mjs apply)
const FIX_PAGE = (id) => `<!doctype html>\n<html lang="en" data-area="${id}">\n<head>\n<script type="importmap">\n{ "imports": { "./src/world/area.js": "./src/areas/${id}/area.js", "three": "https://cdn.example/three.js", "three/addons/": "https://cdn.example/jsm/" } }\n</script>\n</head>\n<body>\n<script type="module" src="./src/main.js"></script>\n</body>\n</html>\n`;
const FIX = {
  'package-lock.json': JSON.stringify({ packages: { '': {}, 'node_modules/three': { version: '0.170.0', integrity: 'sha512-AAAA' } } }),
  'index.html': FIX_PAGE('alpha'), 'beta.html': FIX_PAGE('beta'), 'gamma.html': FIX_PAGE('gamma'),
  'src/main.js': "import { MODULES } from './world/area.js';\nimport './core/gates.js';\nconst imports = new Map(MODULES.map((n) => { const p = import(`./world/${n}.js`); return [n, p]; }));\n",
  'src/areas/registry.js': "export const REGISTRY = {\n  alpha: { id: 'alpha', page: 'index.html' },\n  beta: { id: 'beta', page: 'beta.html' },\n  gamma: { id: 'gamma', page: 'gamma.html', parked: true },\n};\n",
  'src/world/area.js': "export const AREA = 'default';\nexport const MODULES = [\n  'zz',\n];\n",
  'src/areas/alpha/area.js': "export const AREA = 'alpha';\nexport const MODULES = [\n  'm1',\n  'm2',\n];\n",
  'src/areas/beta/area.js': "export const AREA = 'beta';\nexport const MODULES = [\n  'm1',\n];\n",
  'src/areas/gamma/area.js': "export const AREA = 'gamma';\nexport const MODULES = [\n  'm1',\n];\n",
  'src/world/m1.js': "import './shared.js';\nimport './landmarksVOStatues.js';\nexport const build = () => 1;\n",
  'src/world/m2.js': "import './alpha-only.js';\nexport const build = () => 2;\n",
  'src/world/shared.js': 'export const S = 1;\n',
  'src/world/alpha-only.js': 'export const A = 1;\n',
  'src/world/landmarksVOStatues.js': "const F = (name) => import(`./landmarksVOStatues/${name}.js`);\nexport const parts = [F('one')];\n",
  'src/world/landmarksVOStatues/one.js': 'export const one = 1;\n',
  'src/core/gates.js': 'export const G = 1;\n',
  'src/world/unused.js': 'export const unused = 1;\n',
};
function writeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'n4spb-devrev-'));
  const past = new Date(Date.now() - 60000);
  for (const [rel, text] of Object.entries(FIX)) { const f = path.join(dir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); }
  // every file and folder starts in the past, so that a later write always changes its mtime (no same-millisecond luck)
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); fs.utimesSync(f, past, past); } };
  walk(dir); fs.utimesSync(dir, past, past);
  return dir;
}
const edit = (dir, rel, text) => { const f = path.join(dir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };

console.log('dev-revision-test');

// ---------------------------------------------------------------------------------------------------------- 1. page -> area
console.log('the page of a request -> its area:');
await check('"/" and "/index.html" are the registry row whose page is index.html (palace); /<name>.html is the row with that page', () => {
  assert.equal(areaOfPath(root, '/'), 'palace');
  assert.equal(areaOfPath(root, '/index.html'), 'palace');
  for (const id of ['smolny', 'vladimirsky', 'admiralty', 'vasilyevsky', 'north', 'strip']) assert.equal(areaOfPath(root, `/${id}.html`), id, id);
});
await check('a Referer is a full URL: its query and fragment do not matter, a base path is stripped', () => {
  assert.equal(areaOfReferer(root, 'http://127.0.0.1:5176/?q=medium&baked=force'), 'palace');
  assert.equal(areaOfReferer(root, 'http://127.0.0.1:5176/smolny.html?q=low#x'), 'smolny');
  assert.equal(areaOfReferer(root, 'http://h/n4spb/admiralty.html?a=b', '/n4spb'), 'admiralty');
  assert.equal(areaOfReferer(root, 'http://h/n4spb/', '/n4spb'), 'palace');
});
await check('no Referer, garbage, an unknown page, a non-page: no area', () => {
  assert.equal(areaOfReferer(root, undefined), null);
  assert.equal(areaOfReferer(root, ''), null);
  assert.equal(areaOfReferer(root, 'not a url'), null);
  assert.equal(areaOfReferer(root, 'http://h/nowhere.html'), null);
  assert.equal(areaOfReferer(root, 'http://h/src/main.js'), null);
  assert.equal(areaOfReferer(root, 'http://h/%E0%A4%A.html'), null, 'a malformed percent escape is not a crash');
});

// ---------------------------------------------------------------------------------------------------------- 2. the real tree
console.log('a real http server on the real tree:');
resetDevRevisionCache();
const expected = revisionsOf(root);
const real = await serverOf(root);
const LIVE = ['palace', 'smolny', 'vladimirsky', 'admiralty', 'vasilyevsky'];
const PAGE = { palace: '/', smolny: '/smolny.html', vladimirsky: '/vladimirsky.html', admiralty: '/admiralty.html', vasilyevsky: '/vasilyevsky.html' };
await check('the five live areas: one server, five Referers, five answers equal to revisionOf(area) (the revision CI and the bake compute)', async () => {
  const seen = new Set();
  for (const id of LIVE) {
    const r = await get(real.port, ENDPOINT, { Referer: `http://127.0.0.1:${real.port}${PAGE[id]}?q=medium` });
    assert.equal(r.status, 200, id); assert(/^application\/json/.test(r.headers['content-type']), 'the loader requires a JSON content type'); assert.equal(r.headers['cache-control'], 'no-store');
    const j = JSON.parse(r.body); assert.equal(j.revision, expected[id].revision, id); assert.equal(j.area, id);
    assert(/^[0-9a-f]{20}$/.test(j.revision)); seen.add(j.revision);
  }
  assert.equal(seen.size, 5, 'five different revisions: an answer that ignores the page would give one');
});
await check('the parked areas answer too (their pages are registry pages): strip, north', async () => {
  for (const id of ['strip', 'north']) { const r = await get(real.port, ENDPOINT, { Referer: `http://h/${id}.html` }); assert.equal(r.status, 200); assert.equal(JSON.parse(r.body).revision, expected[id].revision, id); }
});
await check('the query string of the request is harmless', async () => {
  const r = await get(real.port, ENDPOINT + '?t=123', { Referer: 'http://h/smolny.html' });
  assert.equal(r.status, 200); assert.equal(JSON.parse(r.body).revision, expected.smolny.revision);
});
await check('no Referer -> 404 (the loader falls back to the generated constant); an unknown page -> 404; a foreign path -> not handled', async () => {
  const a = await get(real.port, ENDPOINT); assert.equal(a.status, 404); assert.equal(a.body, '');
  const b = await get(real.port, ENDPOINT, { Referer: 'http://h/nowhere.html' }); assert.equal(b.status, 404);
  const c = await get(real.port, '/__baked_revision/x', { Referer: 'http://h/' }); assert.equal(c.body, 'static');
  const d = await get(real.port, '/index.html', { Referer: 'http://h/' }); assert.equal(d.body, 'static');
});
await check('the second round of requests is served from the signature cache (no closure walk)', async () => {
  const w = stats.walks;
  for (const id of LIVE) await get(real.port, ENDPOINT, { Referer: `http://h${PAGE[id]}` });
  assert.equal(stats.walks, w, 'walks');
});
await real.close();
await check('a server under a base path (shot.mjs --base) answers at <base>/__baked_revision for the page under the base', async () => {
  const s = await serverOf(root, { base: '/n4spb' });
  try {
    const ok = await get(s.port, '/n4spb/__baked_revision', { Referer: 'http://h/n4spb/vasilyevsky.html' });
    assert.equal(ok.status, 200); assert.equal(JSON.parse(ok.body).revision, expected.vasilyevsky.revision);
    const no = await get(s.port, '/__baked_revision', { Referer: 'http://h/n4spb/vasilyevsky.html' }); assert.equal(no.body, 'static', 'without the base prefix it is not the endpoint');
  } finally { await s.close(); }
});

// ---------------------------------------------------------------------------------------------------------- 4. the cache on a fixture tree
console.log('the stat-signature cache (fixture tree on disk):');
const fx = writeFixture();
try {
  resetDevRevisionCache();
  const A = () => liveRevision(fx, 'alpha'), B = () => liveRevision(fx, 'beta');
  await check('the first request walks, the second does not, and both give the same revision', () => {
    const r1 = A(); assert.equal(stats.walks, 1); const r2 = A(); assert.equal(stats.walks, 1); assert.equal(r1, r2); assert.equal(stats.hits, 1);
    const st = liveStatus(fx, 'alpha'); assert(st.files > 5 && st.bytes > 100);
  });
  await check('the live revision equals revisionsOf() of the same tree (the dev answer and CI agree)', () => {
    const e = revisionsOf(fx); assert.equal(A(), e.alpha.revision); assert.equal(B(), e.beta.revision);
  });
  await check('areas are cached separately: gamma (parked) walks once on its first request, alpha and beta stay cached', () => {
    const w = stats.walks; liveRevision(fx, 'gamma'); assert.equal(stats.walks, w + 1); A(); B(); liveRevision(fx, 'gamma'); assert.equal(stats.walks, w + 1);
  });
  await check('an edit of a file in the closure of alpha only (alpha-only.js) re-walks alpha, moves alpha, leaves beta (cached)', () => {
    const a0 = A(), b0 = B(), w = stats.walks;
    edit(fx, 'src/world/alpha-only.js', 'export const A = 2;\n');
    assert.notEqual(A(), a0); assert.equal(stats.walks, w + 1); assert.equal(B(), b0); assert.equal(stats.walks, w + 1, 'beta did not re-walk: alpha-only.js is not in its closure');
  });
  await check('an edit of a shared file moves both', () => {
    const a0 = A(), b0 = B(); edit(fx, 'src/world/shared.js', 'export const S = 2;\n');
    assert.notEqual(A(), a0); assert.notEqual(B(), b0);
  });
  await check('an edit of a file outside every closure (unused.js) neither re-walks nor moves anything', () => {
    const a0 = A(), w = stats.walks; edit(fx, 'src/world/unused.js', 'export const unused = 2;\n');
    assert.equal(A(), a0); assert.equal(stats.walks, w);
  });
  await check('a runtime-only file (gates.js) re-walks but cannot change the revision; the lock entry of three moves everything', () => {
    const a0 = A();
    const w = stats.walks; edit(fx, 'src/core/gates.js', 'export const G = 2;\n');
    assert.equal(A(), a0, 'runtime-only'); assert.equal(stats.walks, w + 1, 'the file is part of the scan, so the cache is dropped');
    edit(fx, 'package-lock.json', JSON.stringify({ packages: { '': {}, 'node_modules/three': { version: '0.171.0', integrity: 'sha512-AAAA' } } }));
    assert.notEqual(A(), a0, 'lock');
  });
  await check('a NEW file in a folder read by a whole-folder rule enters the closure (the folder signature), without an edit of any known file', () => {
    const a0 = A(), w = stats.walks;
    edit(fx, 'src/world/landmarksVOStatues/two.js', 'export const two = 2;\n');
    assert.notEqual(A(), a0); assert.equal(stats.walks, w + 1);
  });
  await check('the registry decides the pages: a page added to the registry is known after the edit (the page map is cached by the registry signature)', () => {
    assert.equal(areaOfPath(fx, '/beta.html'), 'beta'); assert.equal(areaOfPath(fx, '/delta.html'), null);
    edit(fx, 'src/areas/registry.js', FIX['src/areas/registry.js'].replace('};', "  delta: { id: 'delta', page: 'delta.html' },\n};"));
    assert.equal(areaOfPath(fx, '/delta.html'), 'delta');
  });
  await check('a tree that does not hold together answers revision "unscannable" (200, fail closed: the page takes the stale path) and the server survives; the repaired tree answers again', async () => {
    const good = A(); fs.rmSync(path.join(fx, 'src/world/shared.js'));
    const s = await serverOf(fx);
    try {
      const r = await get(s.port, ENDPOINT, { Referer: 'http://h/' }); assert.equal(r.status, 200);
      const j = JSON.parse(r.body); assert.equal(j.revision, 'unscannable'); assert(/shared\.js/.test(j.error), j.error);
      edit(fx, 'src/world/shared.js', 'export const S = 3;\n');
      const r2 = await get(s.port, ENDPOINT, { Referer: 'http://h/' }); const j2 = JSON.parse(r2.body);
      assert(/^[0-9a-f]{20}$/.test(j2.revision)); assert.notEqual(j2.revision, good);
    } finally { await s.close(); }
  });
} finally { fs.rmSync(fx, { recursive: true, force: true }); }

// ---------------------------------------------------------------------------------------------------------- 5. the codemod and the lint
console.log('the servers and the lint:');
const CONVERTED = ['serve', 'shot', 'area-dev', 'areas-hop-test', 'knock-scene-test', 'metro-surface-probe', 'nav-memory-probe', 'people-shots', 'wildlife-shots',
  'drive-bench', 'drive-test', 'drive-cockpit-shots', 'drive-garage-keys-test', 'drive-garage-recon', 'drive-garage-session', 'drive-garage-test', 'drive-lada-game', 'drive-roadster-shots', 'drive-truck-shots'];
const sources = toolSources(root);
await check(`the ${CONVERTED.length} servers of the codemod import the shared handler and call it first in their request handler`, () => {
  for (const n of CONVERTED) {
    const src = sources[`tools/${n}.mjs`]; assert(src, n);
    assert(/import\s*\{[^}]*\bhandleBakedRevision\b[^}]*\}\s*(from\s*'\.\/lib\/dev-revision\.mjs'|=\s*await import\('\.\/lib\/dev-revision\.mjs'\))/.test(src) || /const \{[^}]*\bhandleBakedRevision\b[^}]*\} = await import\('\.\/lib\/dev-revision\.mjs'\)/.test(src), n + ': import');
    assert(/if \(handleBakedRevision\(req, res, root[^)]*\)\) return;/.test(src), n + ': call');
  }
});
const tree = (patch) => ({ 'tools/a.mjs': 'export const x = 1;\n', ...patch });
await check('lint: a hand-written handler is flagged (string literal, any quote, template)', () => {
  for (const q of ["'", '"', '`']) assert.equal(lintDevServers(tree({ 'tools/s.mjs': `http.createServer((req, res) => { if (req.url === ${q}/__baked_revision${q}) return res.end('{}'); });\n` })).length, 1, q);
  assert.equal(lintDevServers(tree({ 'tools/s.mjs': "if (req.url === BASE + '/__baked_revision') {}\n" })).length, 1);
});
await check('lint: the global function is flagged as an import, a dynamic import, a re-export and a call; the problem names file and line', () => {
  const p = lintDevServers(tree({
    'tools/b.mjs': "import { bakedRevision } from './baked-revision.mjs';\n",
    'tools/c.mjs': "const { bakedRevisionFiles } = await import('./baked-revision.mjs');\n",
    'tools/d.mjs': "export { bakedRevision } from './baked-revision.mjs';\n",
    'tools/e.mjs': "import * as R from './baked-revision.mjs';\n\nconst r = R.bakedRevision(root);\n",
  }));
  assert.equal(p.length, 4, p.join('\n')); assert(p.some((x) => x.startsWith('tools/e.mjs:3 ')), p.join('\n')); assert(p.every((x) => /tools\/[bcde]\.mjs:\d+ /.test(x)));
});
await check('lint: comments, regex literals and unrelated words are not flagged; the converted form passes', () => {
  assert.deepEqual(lintDevServers(tree({
    'tools/t.mjs': "// the old /__baked_revision handler and bakedRevision(root) are gone\n/* '/__baked_revision' */\nconst re = /favicon|__baked_revision/;\nconst bakedRevisions = {};\nimport { handleBakedRevision } from './lib/dev-revision.mjs';\nhttp.createServer((req, res) => { if (handleBakedRevision(req, res, root)) return; });\n",
  })), []);
});
await check('lint: only the exempt files may hold the endpoint string (the shared handler, the bake server, the rule row, the tests of this lint)', () => {
  for (const f of ENDPOINT_EXEMPT) assert.deepEqual(lintDevServers({ [f]: "const E = '/__baked_revision';\n" }), [], f);
  assert.equal(lintDevServers({ 'tools/bake-manifest-check.mjs': "const E = '/__baked_revision';\n" }).length, 1);
  assert.equal(lintDevServers({ 'tools/bake-scene.mjs': "import { bakedRevision } from './baked-revision.mjs';\n" }).length, 1, 'the bake server keeps its own endpoint answer, not the global function');
});
await check('the real tool tree: no hand-written handler is left outside the exempt files (the global function is the business of the bake tools: see the lint CLI)', () => {
  const p = lintDevServers(sources).filter((x) => /__baked_revision/.test(x));
  assert.deepEqual(p, []);
});

console.log(`dev-revision-test: ${passed} passed, ${failed} failed`);
console.log(failed ? 'RESULT: FAIL' : 'RESULT: OK');
process.exit(failed ? 1 : 0);
