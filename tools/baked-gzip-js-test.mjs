// Byte-for-byte comparison with Node zlib, plus corruption/size rejection.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { gzipSync, gunzipSync } from 'node:zlib';
import { inflateBakedGzip } from '../src/core/baked-gzip-js.js';
const source = Buffer.from('baked gzip test '.repeat(100));
const gzip = gzipSync(source);
assert.deepEqual(Buffer.from(inflateBakedGzip(gzip, source.length)), source);
const corrupt = Buffer.from(gzip); corrupt[corrupt.length - 8] ^= 1;
assert.throws(() => inflateBakedGzip(corrupt, source.length), /checksum/);
assert.throws(() => inflateBakedGzip(gzip, source.length + 1), /size/);
assert.throws(() => inflateBakedGzip(gzip.subarray(0, 10), source.length), /Truncated/);
assert.throws(() => inflateBakedGzip(gzip, 1024 ** 3), /size/);
const base = new URL('../assets/baked/palace/', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', base), 'utf8'));
let bytes = 0, count = 0;
for (const [name, file] of Object.entries(manifest.files)) {
  const compressed = fs.readFileSync(new URL(file, base));
  const actual = Buffer.from(inflateBakedGzip(compressed, manifest.sizes[name].raw));
  assert.deepEqual(actual, gunzipSync(compressed), name);
  bytes += actual.length; count++;
}
console.log(`PASS JS gzip: ${count} Palace products, ${bytes} decoded bytes identical to zlib; corruption/size guards passed`);
