// Equivalence of the nav bake format against the generator, inside the real scene of an area (the bake under test is recorded into memory and hydrated from there, so the products on disk
// are not what is compared; the page still needs the area's bake directory to boot with ?baked=force, see below).
//   node tools/nav-bake-equiv.mjs [--area <id>] [--q medium]      prints PASS / FAIL lines and RESULT: OK / FAIL (see tools/nav-bake-equiv-page.js for what is compared)
// The area (docs/AREAS.md section 5.2): --area north opens north.html (tools/lib/area-page.mjs resolves the page, as shot.mjs / baked-check.mjs do); the default is the strip, exactly the run of before.
// What the page asserts follows the DATA of the area, not its id: the long-bridge chain (nav.longK, nav.longs: the pavements of the Palace Bridge) is asserted only when the nav of the area built one,
// the Anichkov deck nodes, the crossings, the entrances, benches, stops, spots, stats and 40 routes always.
// The bake on disk: the page is opened with ?baked=force, so a STALE bake is accepted (the committed strip bake is stale since M1 and stays so until the bake of M8; the stale products only
// feed the 'old' path of the page, and the structure is compared anyway), but the area's manifest must exist: the North has no committed bake, so run a scratch bake first
//   node tools/bake-scene.mjs --area north        (GPU; writes assets/baked/north/; a scratch bake changes the products and the manifest of that area only (per-area revision), do not commit it)
//   node tools/nav-bake-equiv.mjs --area north
// A missing manifest is reported as FAIL before the browser starts. Needs the GPU / a browser (shot.mjs).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveArea, root } from './lib/area-page.mjs';

const args = process.argv.slice(2), qi = args.indexOf('--q'), q = qi >= 0 ? args[qi + 1] : 'medium', ai = args.indexOf('--area');
let AREA;
try { AREA = resolveArea({ area: ai >= 0 ? args[ai + 1] : undefined }); } catch (e) { console.log(`FAIL: ${e.message}`); console.log('RESULT: FAIL'); process.exit(2); }
const manifest = path.join(root, 'assets', AREA.row.bake, 'manifest.json');
if (!fs.existsSync(manifest)) {
  console.log(`FAIL: area ${AREA.id} has no bake (${path.relative(root, manifest)} is missing): the page cannot boot with ?baked=force. Run a scratch bake first: node tools/bake-scene.mjs --area ${AREA.id}`);
  console.log('RESULT: FAIL');
  process.exit(1);
}
const out = AREA.id === 'strip' ? 'shots/perf/nav-equiv' : `shots/perf/nav-equiv-${AREA.id}`;
const r = spawnSync(process.execPath, [fileURLToPath(new URL('./shot.mjs', import.meta.url)), '--area', AREA.id, '--q', q, '--cams', 'hero', '--params', 'baked=force', '--out', out,
  '--eval', "(async()=>{try{const m=await import('/tools/nav-bake-equiv-page.js');return await m.run()}catch(e){return {error:String(e&&e.stack||e)}}})()"], { encoding: 'utf8' });
const line = (r.stdout || '').split('\n').find((l) => l.startsWith('eval:')) || '';
console.log(line || r.stdout.slice(-2000));
const ok = line.includes('"ok":true');
let info = null; try { info = JSON.parse(line.slice(5)); } catch (e) { info = null; }
if (ok) console.log(`PASS: nav bake of area ${AREA.id} is equivalent to the generator (${info.nodes} nodes, ${info.edges} edges, ${info.bakeBytes} bytes; long-bridge chain ${info.hasLong ? 'asserted (' + info.longK + ' nodes)' : 'absent in this area, not asserted'}; old-format path ${info.ms && info.ms.old != null ? 'compared' : 'not available'})`);
else console.log(`FAIL: nav bake of area ${AREA.id}: ${info && info.error ? info.error.split('\n')[0] : 'no eval result (the page did not boot: is the bake directory present and the GPU free?)'}`);
console.log(ok ? 'RESULT: OK' : 'RESULT: FAIL');
process.exit(ok ? 0 : 1);
