// Emit the readable, independently tested decoder source; never stringify code.
import fs from 'node:fs';
import assert from 'node:assert/strict';
export {MAX_JSON_BYTES,unpackJSON} from './pages-data-runtime.mjs';
export function emittedCodec() {
  const source=fs.readFileSync(new URL('./pages-data-runtime.mjs',import.meta.url),'utf8');
  const from="from '../vendor/fflate/fflate.module.js'";
  assert.equal(source.split(from).length,2,'one existing vendor import');
  return '// Generated from tools/pages-data-runtime.mjs for deployment only. No JavaScript evaluation.\n'+source.replace(from,"from './fflate/fflate.module.js'");
}
