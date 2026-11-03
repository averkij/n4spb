// Ship current areas only: parked strip/North bakes stay in git, outside Pages.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { REGISTRY } from '../src/areas/registry.js';

export function copyLiveAssets(root, target, registry = REGISTRY) {
  const source = path.resolve(root, 'assets');
  target = path.resolve(target);
  assert(!fs.existsSync(target), 'asset destination must not exist');
  assert(target !== source && !target.startsWith(source + path.sep), 'destination must be outside source assets');
  const live = Object.values(registry).filter(r => !r.parked && r.status !== 'planned');
  assert(live.length, 'there must be live areas');
  for (const row of live) {
    assert(/^baked\/[a-z0-9-]+\/$/.test(row.bake), `unexpected bake path ${row.bake}`);
    const manifest = JSON.parse(fs.readFileSync(path.join(source, row.bake, 'manifest.json'), 'utf8'));
    assert.equal(manifest.area, row.id, `manifest belongs to ${row.id}`);
  }
  fs.mkdirSync(target, { recursive: true });
  for (const e of fs.readdirSync(source, { withFileTypes: true })) {
    if (e.name !== 'baked') fs.cpSync(path.join(source, e.name), path.join(target, e.name), { recursive: true });
  }
  for (const row of live) fs.cpSync(path.join(source, row.bake), path.join(target, row.bake), { recursive: true });
  return live.map(r => r.id);
}

export function sizeOf(dir) {
  let bytes = 0, files = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    assert(!e.isSymbolicLink(), `unexpected symlink ${p}`);
    if (e.isDirectory()) { const s = sizeOf(p); bytes += s.bytes; files += s.files; }
    else { bytes += fs.statSync(p).size; files++; }
  }
  return { bytes, files };
}

export function checkSiteSize(dir, limit = 1_000_000_000) {
  const size = sizeOf(dir);
  assert(size.bytes <= limit, `Pages site is ${size.bytes} bytes, over the ${limit} byte budget`);
  return size;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const site = path.join(root, 'dist');
  const live = copyLiveAssets(root, path.join(site, 'assets'));
  const size = checkSiteSize(site);
  console.log(`Pages: ${live.length} live bakes, ${size.files} files, ${size.bytes} bytes (limit 1000000000)`);
}
