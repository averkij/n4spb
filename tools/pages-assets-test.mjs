import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { copyLiveAssets, checkSiteSize, sizeOf } from './pages-assets.mjs';

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
  console.log('PASS Pages assets: live products and static art intact, parked bakes excluded, bad manifests and oversize uploads rejected');
} finally {
  const resolved = fs.realpathSync(tmp);
  assert.equal(path.dirname(resolved), tempRoot);
  assert(path.basename(resolved).startsWith('n4spb-pages-assets-'));
  fs.rmSync(resolved, { recursive: true });
}
