// Run with node tools/pages-bake-brotli-test.mjs. Synthetic bake, no GPU.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { packBakedProducts, verifyBakedProducts, patchedCodec, MANIFEST_PATH } from './pages-bake-brotli.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv.includes('--actual')) {
  const result = await verifyBakedProducts(repo, path.join(repo, 'dist'));
  console.log(`PASS actual Brotli bake package: ${result.products} source/output products verified`);
  process.exit(0);
}
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'n4spb-brotli-pack-'));
const site = path.join(dir, 'dist');
const put = (p, data) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };
const hash = b => createHash('sha256').update(b).digest('hex');
try {
  const rel = 'assets/baked/alpha/field.abcdef.bin.gz';
  const raw = Buffer.alloc(8 * 1024 * 1024);
  let seed = 0x12345678;
  const pool = Array.from({ length: 128 }, () => Buffer.alloc(4096).map(() => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed & 255;
  }));
  for (let i = 0; i < raw.length / 4096; i++) pool[(i * 97) % pool.length].copy(raw, i * 4096);
  const gz = gzipSync(raw, { level: 6 });
  put(path.join(dir, rel), gz); put(path.join(site, rel), gz);
  const manifest = { format: 1, scheme: 2, area: 'alpha', revision: 'abcdef', files: { field: path.basename(rel) },
    sizes: { field: { raw: raw.length, gzip: gz.length } }, sha256: { field: hash(gz) } };
  put(path.join(dir, 'assets/baked/alpha/manifest.json'), JSON.stringify(manifest));
  put(path.join(site, 'assets/baked/alpha/manifest.json'), JSON.stringify(manifest));
  const codec = fs.readFileSync(path.join(repo, 'src/core/baked-codec.js'));
  put(path.join(dir, 'src/core/baked-codec.js'), codec); put(path.join(site, 'src/core/baked-codec.js'), codec);
  for (const p of ['vendor/pages-bake-brotli.js', 'vendor/brotli-dec-wasm/decoder.js', 'vendor/brotli-dec-wasm/brotli_dec_wasm_bg.wasm'])
    put(path.join(site, p), fs.readFileSync(path.join(repo, p)));
  const registry = { alpha: { id: 'alpha', bake: 'baked/alpha/' } };
  const result = await packBakedProducts(dir, site, { registry, minBytes: 0 });
  assert.equal(result.products, 1); assert(result.saved > 65536);
  assert.equal((await verifyBakedProducts(dir, site)).products, 1);
  assert.equal(fs.readFileSync(path.join(dir, rel)).compare(gz), 0, 'canonical gzip untouched');
  assert.equal(fs.readFileSync(path.join(site, 'src/core/baked-codec.js'), 'utf8'), patchedCodec(codec.toString('utf8')));
  const record = JSON.parse(fs.readFileSync(path.join(site, MANIFEST_PATH)));
  assert.equal(record.entries[0].rawSHA256, hash(raw));
  const output = path.join(site, record.entries[0].output), good = fs.readFileSync(output);
  // Exercise the same WASM streaming helper used by the deployment worker.
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => input instanceof URL && input.protocol === 'file:'
    ? new Response(fs.readFileSync(fileURLToPath(input)), { headers: { 'Content-Type': 'application/wasm' } })
    : originalFetch(input);
  try {
    const { brotliReadable } = await import('../vendor/pages-bake-brotli.js');
    const decoded = Buffer.from(await new Response(await brotliReadable(new Blob([good]).stream())).arrayBuffer());
    assert.equal(decoded.compare(raw), 0, 'WASM stream reproduces the baked payload');
  } finally { globalThis.fetch = originalFetch; }
  fs.appendFileSync(output, Buffer.from([0]));
  await assert.rejects(verifyBakedProducts(dir, site), /sha256|integrity|Expected values to be strictly equal/);
  fs.writeFileSync(output, good);
  assert.equal((await verifyBakedProducts(dir, site)).products, 1);
  console.log(`PASS Brotli bake pack: ${gz.length} -> ${gz.length - result.saved} bytes; provenance, payload, and corruption checks`);
} finally {
  assert(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(dir).startsWith('n4spb-brotli-pack-'));
  fs.rmSync(dir, { recursive: true, force: true });
}
