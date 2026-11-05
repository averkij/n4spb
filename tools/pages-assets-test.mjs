import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { copyLiveAssets, checkSiteSize, sizeOf, prepareMobileEntries } from './pages-assets.mjs';
import { publishedEntry } from './lib/pages-entry.mjs';
import { REGISTRY } from '../src/areas/registry.js';

const tempRoot = fs.realpathSync(os.tmpdir());
const tmp = fs.mkdtempSync(path.join(tempRoot, 'n4spb-pages-assets-'));
const put = (rel, data) => { const p = path.join(tmp, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };
const registry = {
  strip: { id: 'strip', bake: 'baked/', parked: true },
  north: { id: 'north', bake: 'baked/north/', parked: true },
  alpha: { id: 'alpha', bake: 'baked/alpha/' },
  beta: { id: 'beta', bake: 'baked/beta/' },
  future: { id: 'future', bake: 'baked/future/', status: 'planned' },
};
try {
  for (const id of ['alpha', 'beta', 'north']) {
    put(`assets/baked/${id}/manifest.json`, JSON.stringify({ area: id }));
    put(`assets/baked/${id}/part.bin.gz`, Buffer.from([0, 1, 255, 7]));
  }
  put('assets/baked/manifest.json', '{"area":"strip"}');
  put('assets/baked/old.bin.gz', 'parked strip');
  put('assets/icons/icon.png', 'icon'); put('assets/splash/day.jpg', 'splash'); put('assets/bibliotochka.png', 'library');
  const dst = path.join(tmp, 'dist/assets');
  assert.deepEqual(copyLiveAssets(tmp, dst, registry), ['alpha', 'beta']);
  for (const id of ['alpha', 'beta']) for (const file of ['manifest.json', 'part.bin.gz'])
    assert.deepEqual(fs.readFileSync(path.join(dst, 'baked', id, file)), fs.readFileSync(path.join(tmp, 'assets/baked', id, file)));
  for (const file of ['icons/icon.png', 'splash/day.jpg', 'bibliotochka.png']) assert(fs.existsSync(path.join(dst, file)), `${file} shipped`);
  for (const file of ['baked/manifest.json', 'baked/old.bin.gz', 'baked/north', 'baked/future']) assert(!fs.existsSync(path.join(dst, file)), `${file} not shipped`);
  assert(fs.existsSync(path.join(tmp, 'assets/baked/north/part.bin.gz')), 'parked source remains intact');
  assert.throws(() => copyLiveAssets(tmp, dst, registry), /destination must not exist/);
  const bad = { wrong: { id: 'wrong', bake: 'baked/alpha/' } }, invalid = path.join(tmp, 'invalid');
  assert.throws(() => copyLiveAssets(tmp, invalid, bad), /manifest belongs/);
  assert(!fs.existsSync(invalid), 'validate all live manifests before creating the output');
  assert.throws(() => copyLiveAssets(tmp, invalid, { x: { id: 'x', bake: '../' } }), /unexpected bake path/);
  const size = sizeOf(path.join(tmp, 'dist'));
  assert.equal(size.files, 7);
  assert.deepEqual(checkSiteSize(path.join(tmp, 'dist'), size.bytes), size);
  assert.throws(() => checkSiteSize(path.join(tmp, 'dist'), size.bytes - 1), /over the/);
  // Exercise the exact deployment transform, including every live area and
  // project-subdirectory URLs. A mobile redirect must not also start main.js.
  const main = '<script type="module" src="./src/main.js"></script>';
  const entries = path.join(tmp, 'entries'); fs.mkdirSync(entries);
  for (const row of Object.values(REGISTRY).filter(r => !r.parked && r.status !== 'planned')) {
    fs.writeFileSync(path.join(entries, row.page), main);
    fs.writeFileSync(path.join(entries, row.page === 'index.html' ? 'diagnostics.html' : 'diagnostics-' + row.page), 'diagnostic');
  }
  prepareMobileEntries(entries);
  for (const row of Object.values(REGISTRY).filter(r => !r.parked && r.status !== 'planned')) {
    const source = fs.readFileSync(path.join(entries, row.page), 'utf8');
    const code = /<script data-pages-entry>([^]*?)<\/script>/.exec(source)[1];
    for (const [ua, touches, expectedMobile, search] of [
      ['iPhone', 5, true, '?cam=1,2,3,4&tod=1.2'], ['Android', 5, true, ''], ['Macintosh', 5, true, ''],
      ['Macintosh', 0, false, ''], ['Windows NT', 5, false, ''], ['iPhone', 5, false, '?mobileprofile=0'],
      ['iPhone', 5, false, '?bake=1'], ['iPhone', 5, false, '?shot=1'], ['iPhone', 5, false, '?only=city']
    ]) {
      let redirect, loaded, ticket;
      const href = 'https://example.test/n4spb/' + row.page + search;
      vm.runInNewContext(code, { URL, URLSearchParams, navigator: { userAgent: ua, maxTouchPoints: touches },
        location: { href, search, hash: '', replace: url => { redirect = url; } },
        sessionStorage: { setItem: (_, value) => { ticket = value; } },
        document: { createElement: () => ({}), body: { append: node => { loaded = node; } } } });
      if (expectedMobile) {
        assert.equal(loaded, undefined); assert.equal(ticket, redirect);
        const url = new URL(redirect);
        assert.equal(url.pathname, '/n4spb/' + (row.page === 'index.html' ? 'diagnostics.html' : 'diagnostics-' + row.page));
        for (const [key, value] of Object.entries({ test: 'scene-js-gzip', diagshadows: '0', diagatlas: '0', diagtexture: '256',
          diagground: 'plain', diagsignatlas: '1024', diagcanvasupload: 'pixels', diaguploader: 'staged', diagpack: '1', mobileprofile: '1', nd: '0', supercells: '0' }))
          assert.equal(url.searchParams.get(key), value);
        if (search) assert.equal(url.searchParams.get('cam'), '1,2,3,4');
      } else { assert.equal(redirect, undefined); assert.equal(loaded.src, './src/main.js'); assert.equal(loaded.type, 'module'); }
    }
  }
  assert.throws(() => publishedEntry(main + main, 'diagnostics.html'), /exactly one/);
  console.log('PASS Pages assets: live products and static art intact, parked bakes excluded, bad manifests and oversize uploads rejected');
} finally {
  const resolved = fs.realpathSync(tmp);
  assert.equal(path.dirname(resolved), tempRoot);
  assert(path.basename(resolved).startsWith('n4spb-pages-assets-'));
  fs.rmSync(resolved, { recursive: true });
}
