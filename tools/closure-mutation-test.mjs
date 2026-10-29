// META-TEST of the revision oracles: the checks of tools/baked-revision-test.mjs (fixture trees) and tools/closure-real-test.mjs (the real tree) are run against 9 deliberately BROKEN scanners
// (makeScanner mutant flags). Every mutant must be killed (at least one check fails); the unmutated scanner must pass everything. An oracle that cannot fail proves nothing.
//   node tools/closure-mutation-test.mjs [--verbose]
import { fileURLToPath } from 'node:url';
import { makeScanner } from './lib/closure.mjs';
import { createRevisionContext } from './baked-revision.mjs';
import { fixtureChecks } from './baked-revision-test.mjs';
import { realChecks } from './closure-real-test.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const verbose = process.argv.includes('--verbose');
export const MUTANTS = [
  ['ignores template imports', { ignoreTemplates: true }],
  ['ignores export ... from', { ignoreExportFrom: true }],
  ['ignores the page remap (import map)', { ignorePageRemap: true }],
  ['skips tokenizing large files (> 50 KB)', { skipLargeFiles: 50000 }],
  ['narrows globs to names seen as literals', { narrowGlobs: true }],
  ['drops the dynamic table', { dropDynamicTable: true }],
  ['forgets the page', { forgetPage: true }],
  ['hashes the runtime-only files', { hashRuntimeOnly: true }],
  ['keeps ?query in specifiers', { keepQuery: true }],
];
const sharedCtx = createRevisionContext(root);          // the file reads are shared by all runs (the scans are not: every scanner has its own cache tag)

function runAll(opts) {
  const fails = [];
  for (const [kind, list] of [['fixture', fixtureChecks(opts)], ['real', realChecks(opts, { ctx: sharedCtx })]]) {
    for (const c of list) { try { c.run(); } catch (e) { fails.push({ kind, name: c.name, why: String(e.message).split('\n')[0].slice(0, 160) }); } }
  }
  return fails;
}
makeScanner();                                           // (the flags are validated: an unknown one throws)
let bad = 0, killed = 0; const t0 = Date.now();
const clean = runAll({});
if (clean.length) { bad++; console.log(`FAIL the unmutated scanner fails ${clean.length} check(s):`); for (const f of clean) console.log(`     [${f.kind}] ${f.name}: ${f.why}`); }
else console.log('ok   the unmutated scanner passes every check');
for (const [name, opts] of MUTANTS) {
  const fails = runAll(opts).filter((f) => !/golden/.test(f.name));        // the golden pin changes with ANY change of the algorithm: it does not count as a kill
  if (!fails.length) { bad++; console.log(`SURVIVED ${name}: no check failed (the golden pin does not count)`); continue; }
  killed++;
  console.log(`killed   ${name}  (${fails.length} check(s) fail; first: [${fails[0].kind}] ${fails[0].name.slice(0, 70)})`);
  if (verbose) for (const f of fails) console.log(`           [${f.kind}] ${f.name.slice(0, 90)} -> ${f.why}`);
}
console.log(`(${((Date.now() - t0) / 1000).toFixed(0)} s)`);
if (bad) { console.log(`RESULT: FAIL (${killed} of ${MUTANTS.length} mutants killed${clean.length ? '; the unmutated scanner fails' : ''})`); process.exit(1); }
console.log(`RESULT: OK (${MUTANTS.length} of ${MUTANTS.length} mutants killed)`);
