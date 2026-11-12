// Ship current areas only: parked strip/North bakes stay in git, outside Pages.
// Generated JSON leaves and large gzip bake products are losslessly packed in
// the deployment copy only, with source/output/helper hashes in vendor manifests.
// Original data, baked products and revisions remain authoritative.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { REGISTRY } from '../src/areas/registry.js';
import { handoffPage } from '../src/core/handoff.js';
import { publishedEntry } from './lib/pages-entry.mjs';
import { packGeneratedData } from './pages-data-pack.mjs';
import { packBakedProducts } from './pages-bake-brotli.mjs';

export function prepareMobileEntries(site, registry = REGISTRY) {
  for (const row of Object.values(registry).filter(r => !r.parked && r.status !== 'planned')) {
    const destination = handoffPage(row.page, 'diagscene=1');
    assert(fs.existsSync(path.join(site, destination)), `missing mobile entry ${destination}`);
    const page = path.join(site, row.page);
    fs.writeFileSync(page, publishedEntry(fs.readFileSync(page, 'utf8'), destination));
  }
}

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

export function copyBrotliDecoder(root, site) {
  for (const rel of ['vendor/pages-bake-brotli.js', 'vendor/brotli-dec-wasm']) {
    const dest = path.join(site, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    assert(!fs.existsSync(dest), `decoder destination already exists: ${dest}`);
    fs.cpSync(path.join(root, rel), dest, { recursive: true });
  }
}

// Local counterpart of the workflow's explicit deployment whitelist. Rebuild only
// the derived <repository>/dist directory, so tests cannot accidentally serve an
// earlier source/bake snapshot while checking the current deployment transform.
export function assembleSite(root) {
  root=fs.realpathSync(root);const site=path.resolve(root,'dist');
  assert.equal(path.dirname(site),root);assert.equal(path.basename(site),'dist');
  if(fs.existsSync(site)){assert.equal(fs.realpathSync(site),site,'dist must not be a symlink');fs.rmSync(site,{recursive:true});}
  fs.mkdirSync(site);
  for(const rel of['src','manifest.webmanifest','LICENSE','LICENSE-sakuragaoka-station.txt','NOTICE.md','README.md'])fs.cpSync(path.join(root,rel),path.join(site,rel),{recursive:true});
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){const source=fs.readFileSync(path.join(root,file),'utf8');if(file==='index.html'||/<html[^>]* data-area=/.test(source))fs.copyFileSync(path.join(root,file),path.join(site,file));}
  for(const rel of['vendor/rapier/rapier.js','vendor/rapier/LICENSE','vendor/fflate/fflate.module.js','vendor/fflate/LICENSE']){fs.mkdirSync(path.dirname(path.join(site,rel)),{recursive:true});fs.cpSync(path.join(root,rel),path.join(site,rel),{recursive:true});}
  fs.writeFileSync(path.join(site,'.nojekyll'),'');return site;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const site = process.argv.includes('--assemble')?assembleSite(root):path.join(root, 'dist');
  const live = copyLiveAssets(root, path.join(site, 'assets'));
  copyBrotliDecoder(root, site);
  const brotli = await packBakedProducts(root, site);
  const packed = packGeneratedData(root,site);
  prepareMobileEntries(site);
  const size = checkSiteSize(site);
  console.log(`Pages: ${live.length} live bakes, ${size.files} files, ${size.bytes} bytes (limit 1000000000)`);
  console.log(`Brotli bake transport: ${brotli.products} products, ${brotli.saved} bytes saved; provenance vendor/pages-bake-manifest.json`);
  console.log(`Generated data: ${packed.modules} lossless packed leaf modules, ${packed.exports} verified exports, ${packed.saved} bytes saved; provenance vendor/pages-data-manifest.json`);
}
