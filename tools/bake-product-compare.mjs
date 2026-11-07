// Memory/runtime-only changes should leave shipping world data identical.
// Usage: node tools/bake-product-compare.mjs <baseline assets/baked directory> [<current assets/baked directory>]
// Two bakes of the SAME source must be byte-identical (no wall-clock field is recorded any more, docs/AREAS.md); a baseline made before that still carries the build timings of
// city-base (service.buildMs / buildPhases) and the roof capture time (ms): those fields are the only differences that are ignored.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { isDeepStrictEqual } from 'node:util';
import { decodeBaked } from '../src/core/baked-codec.js';
const current = process.argv[3] ? path.resolve(process.argv[3]) : fileURLToPath(new URL('../assets/baked/', import.meta.url));
assert(process.argv[2], 'Pass the frozen baseline assets/baked directory');
const baseline = path.resolve(process.argv[2]);
const manifests = [baseline, current].map(dir => JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'))));
assert.deepEqual(Object.keys(manifests[1].files).sort(), Object.keys(manifests[0].files).sort(), 'same products');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const ignoredTiming = [], byteIdentical = [];
for (const name of Object.keys(manifests[0].files)) {
  const buffers = [baseline, current].map((dir, i) => fs.readFileSync(path.join(dir, manifests[i].files[name])));
  if (digest(buffers[0]) === digest(buffers[1])) { byteIdentical.push(name); continue; }
  assert(['city-base', 'roof'].includes(name), `World product changed: ${name}`);
  const decoded = buffers.map(b => { const raw = gunzipSync(b); return decodeBaked(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)); });
  // the timings are removed from the BASELINE side only; the CURRENT bake must not record any (otherwise the determinism fix would not be tested at all)
  if (name === 'roof') assert(!('ms' in decoded[1]), 'the current roof product still records its capture time');
  else assert(!('buildMs' in decoded[1].service) && !decoded[1].service.buildPhases, 'the current city-base product still records build timings');
  { const value = decoded[0];
    if (name === 'roof') { if ('ms' in value) { assert.equal(typeof value.ms, 'number'); delete value.ms; } }
    else {
      if ('buildMs' in value.service) { assert.equal(typeof value.service.buildMs, 'number'); delete value.service.buildMs; }
      if (value.service.buildPhases) {
        for (const key of Object.keys(value.service.buildPhases)) {
          assert(['classify', 'edges', 'passages', 'walls', 'details', 'flush'].includes(key), `Unexpected phase ${key}`);
          assert.equal(typeof value.service.buildPhases[key], 'number');
        }
        delete value.service.buildPhases;
      }
    } }
  // Do not format both multi-megabyte texture/mesh trees into an assertion diff.
  // Keep exactly the same strict comparison, with a bounded failure message.
  assert(isDeepStrictEqual(decoded[1], decoded[0]), `Only explicitly listed build timings may differ: ${name}`);
  ignoredTiming.push(name);
}
console.log(JSON.stringify({ ok: true, before: manifests[0].revision, after: manifests[1].revision,
  products: byteIdentical.length + ignoredTiming.length, byteIdentical: byteIdentical.length, onlyBuildTimings: ignoredTiming }));
