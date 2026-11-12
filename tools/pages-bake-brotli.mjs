// Deployment-only recoding of large baked gzip products to Brotli. The source
// bakes, source manifests, revision hashes and browser bake format stay intact.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';
import { createGunzip, createBrotliDecompress, createBrotliCompress, constants } from 'node:zlib';
import assert from 'node:assert/strict';
import { REGISTRY } from '../src/areas/registry.js';

export const MANIFEST_PATH = 'vendor/pages-bake-manifest.json';
export const CODEC_PATH = 'src/core/baked-codec.js';
export const DECODER_PATH = 'vendor/pages-bake-brotli.js';
export const WASM_PATH = 'vendor/brotli-dec-wasm/brotli_dec_wasm_bg.wasm';
// Sub-250 kB gzip products rarely clear the 64 KiB saving gate. Lowering the
// previous 1 MB cutoff leaves room for additional mapped areas on Pages.
export const MIN_BYTES = 250_000;
const sha = b => createHash('sha256').update(b).digest('hex');
const hashFile = p => sha(fs.readFileSync(p));
const inside = (site, rel) => {
  assert(!path.isAbsolute(rel) && !rel.split('/').includes('..'), `unsafe path ${rel}`);
  const p = path.resolve(site, rel);
  assert(p.startsWith(path.resolve(site) + path.sep), `outside site: ${p}`);
  return p;
};

// One final output buffer already exists in readBakedBuffer. Recode only the
// transport stream; all product bytes after decompression must match exactly.
export const CODEC_SNIPPET = `const stream = response.url.endsWith('.bin.br')
    ? await (await import('../../vendor/pages-bake-brotli.js')).brotliReadable(response.body)
    : response.body.pipeThrough(new DecompressionStream('gzip'));`;
const ORIGINAL_SNIPPET = `const stream = response.body.pipeThrough(new DecompressionStream('gzip'));`;
export function patchedCodec(source) {
  assert.equal(source.split(ORIGINAL_SNIPPET).length, 2, 'baked codec anchor changed');
  return source.replace(ORIGINAL_SNIPPET, CODEC_SNIPPET);
}

async function rawDigest(file, format) {
  const hash = createHash('sha256'); let bytes = 0;
  const sink = new Writable({ write(chunk, _, done) { hash.update(chunk); bytes += chunk.length; done(); } });
  await pipeline(createReadStream(file), format === 'br' ? createBrotliDecompress() : createGunzip(), sink);
  return { sha256: hash.digest('hex'), bytes };
}
const liveRows = registry => Object.values(registry).filter(r => !r.parked && r.status !== 'planned');

export async function packBakedProducts(root, site, { registry = REGISTRY, minBytes = MIN_BYTES } = {}) {
  root = fs.realpathSync(root); site = fs.realpathSync(site);
  assert(root !== site && site.startsWith(root + path.sep), 'deployment copy must be separate and inside root');
  assert(!fs.existsSync(inside(site, MANIFEST_PATH)), 'Brotli package already exists');
  const entries = [];
  let saved = 0;
  for (const row of liveRows(registry)) {
    const dir = `assets/${row.bake}`;
    const sourcePath = inside(root, `${dir}manifest.json`), targetPath = inside(site, `${dir}manifest.json`);
    const sourceText = fs.readFileSync(sourcePath, 'utf8');
    assert.equal(fs.readFileSync(targetPath, 'utf8'), sourceText, `${row.id}: manifest copy differs`);
    const manifest = JSON.parse(sourceText);
    assert.equal(manifest.area, row.id);
    for (const [name, file] of Object.entries(manifest.files)) {
      if (!file.endsWith('.bin.gz')) throw new Error(`${row.id}/${name}: unexpected product ${file}`);
      const rel = `${dir}${file}`, src = inside(root, rel), dst = inside(site, rel);
      assert.equal(fs.statSync(src).size, manifest.sizes[name].gzip, `${rel}: source size`);
      assert.equal(hashFile(src), manifest.sha256[name], `${rel}: source hash`);
      assert.equal(hashFile(dst), manifest.sha256[name], `${rel}: copied hash`);
      if (fs.statSync(src).size < minBytes) continue;
      const br = file.slice(0, -3) + '.br', brRel = `${dir}${br}`, brPath = inside(site, brRel);
      assert(!fs.existsSync(brPath), `${brRel} already exists`);
      const tmp = brPath + '.tmp';
      try {
        await pipeline(createReadStream(src), createGunzip(), createBrotliCompress({ params: {
          [constants.BROTLI_PARAM_QUALITY]: 6, [constants.BROTLI_PARAM_LGWIN]: 24,
        } }), createWriteStream(tmp));
        const brBytes = fs.statSync(tmp).size;
        if (brBytes >= fs.statSync(src).size - 65536) { fs.unlinkSync(tmp); continue; }
        const a = await rawDigest(src, 'gz'), b = await rawDigest(tmp, 'br');
        assert.deepEqual(b, a, `${row.id}/${name}: decoded payload differs`);
        assert.equal(a.bytes, manifest.sizes[name].raw, `${row.id}/${name}: raw length`);
        fs.renameSync(tmp, brPath);
        const brSHA256 = hashFile(brPath), sourceSHA256 = manifest.sha256[name];
        manifest.files[name] = br;
        manifest.sizes[name] = { ...manifest.sizes[name], gzip: brBytes, brotli: brBytes };
        manifest.sha256[name] = brSHA256;
        fs.unlinkSync(dst);
        entries.push({ area: row.id, name, source: rel, sourceSHA256, sourceBytes: fs.statSync(src).size,
          output: brRel, outputSHA256: brSHA256, outputBytes: brBytes, rawSHA256: a.sha256, rawBytes: a.bytes });
        saved += fs.statSync(src).size - brBytes;
      } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
    }
    if (entries.some(e => e.area === row.id)) fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2) + '\n');
  }
  if (!entries.length) return { products: 0, saved: 0 };
  const sourceCodec = fs.readFileSync(inside(root, CODEC_PATH), 'utf8');
  const outputCodec = patchedCodec(sourceCodec);
  fs.writeFileSync(inside(site, CODEC_PATH), outputCodec);
  const decoder = inside(site, DECODER_PATH), wasm = inside(site, WASM_PATH);
  assert(fs.existsSync(decoder) && fs.existsSync(wasm), 'deployment decoder missing');
  const provenance = { schema: 1, codec: { path: CODEC_PATH, sourceSHA256: sha(sourceCodec), outputSHA256: sha(outputCodec) },
    decoder: { path: DECODER_PATH, sha256: hashFile(decoder) }, wasm: { path: WASM_PATH, sha256: hashFile(wasm) }, entries };
  fs.writeFileSync(inside(site, MANIFEST_PATH), JSON.stringify(provenance, null, 1) + '\n');
  return { products: entries.length, saved };
}

export async function verifyBakedProducts(root, site) {
  const record = JSON.parse(fs.readFileSync(inside(site, MANIFEST_PATH), 'utf8'));
  assert.equal(record.schema, 1);
  const sourceCodec = fs.readFileSync(inside(root, CODEC_PATH), 'utf8');
  assert.equal(sha(sourceCodec), record.codec.sourceSHA256);
  assert.equal(fs.readFileSync(inside(site, CODEC_PATH), 'utf8'), patchedCodec(sourceCodec));
  assert.equal(hashFile(inside(site, CODEC_PATH)), record.codec.outputSHA256);
  for (const item of [record.decoder, record.wasm]) assert.equal(hashFile(inside(site, item.path)), item.sha256);
  for (const e of record.entries) {
    const sourceManifest = JSON.parse(fs.readFileSync(inside(root, `assets/baked/${e.area}/manifest.json`)));
    const outputManifest = JSON.parse(fs.readFileSync(inside(site, `assets/baked/${e.area}/manifest.json`)));
    assert.equal(sourceManifest.files[e.name], path.basename(e.source));
    assert.equal(sourceManifest.sha256[e.name], e.sourceSHA256);
    assert.equal(outputManifest.files[e.name], path.basename(e.output));
    assert.equal(outputManifest.sha256[e.name], e.outputSHA256);
    assert.equal(hashFile(inside(root, e.source)), e.sourceSHA256);
    assert(!fs.existsSync(inside(site, e.source)), `${e.source} gzip still shipped`);
    assert.equal(hashFile(inside(site, e.output)), e.outputSHA256);
    assert.deepEqual(await rawDigest(inside(site, e.output), 'br'), { sha256: e.rawSHA256, bytes: e.rawBytes });
  }
  return { products: record.entries.length };
}
