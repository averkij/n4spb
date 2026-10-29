// CPU lint (CI): no development / test server answers /__baked_revision by itself, and nobody asks for the GLOBAL bake revision any more (docs/AREAS.md section 4).
//   A hand-written handler answers one revision for every page; with per-area bakes that reads "stale" for every area but one (or, worse, fresh for a page whose own bake is stale).
//   Every server calls handleBakedRevision(req, res, root) of tools/lib/dev-revision.mjs, which answers the revision of THE AREA OF THE PAGE (Referer).
// Fails when a tools script outside the exempt files
//   - contains a string literal with `__baked_revision` (a handler left unconverted), or
//   - names the identifiers bakedRevision / bakedRevisionFiles (the removed global function: an import, a re-export, a call).
// Comments are ignored (the tokenizer drops them). The imports of the removed names would fail at load anyway once baked-revision.mjs stops exporting them; this lint is what finds the callers that are
// not loaded by any test, and what keeps a new server from copying the old handler.
//   node tools/dev-servers-lint.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenize, lineAt } from './lib/closure.mjs';

/** the files that may hold the endpoint string: the one shared handler, the bake server's own answer (it serves the revision of the area it bakes), the closure rule row for the loader's fetch, and the tests of this lint */
export const ENDPOINT_EXEMPT = ['tools/lib/dev-revision.mjs', 'tools/bake-scene.mjs', 'tools/lib/closure-rules.mjs', 'tools/dev-revision-test.mjs', 'tools/dev-servers-lint.mjs'];
/** the files that define or re-export the removed global (until the last caller is gone) */
export const GLOBAL_EXEMPT = ['tools/lib/legacy-revision.mjs', 'tools/baked-revision.mjs', 'tools/dev-revision-test.mjs', 'tools/dev-servers-lint.mjs'];
export const REMOVED = ['bakedRevision', 'bakedRevisionFiles'];
const ENDPOINT = '__baked_revision';

/** problems[] of a { 'tools/x.mjs': source } map (pure: the tests feed it virtual trees) */
export function lintDevServers(files) {
  const problems = [];
  for (const [rel, src] of Object.entries(files)) {
    const endpoint = !ENDPOINT_EXEMPT.includes(rel), global = !GLOBAL_EXEMPT.includes(rel);
    if (!endpoint && !global) continue;
    if (!(src.includes(ENDPOINT) || REMOVED.some((n) => src.includes(n)))) continue;
    for (const t of tokenize(src)) {
      if (endpoint && t.t === 'str' && t.v.includes(ENDPOINT)) problems.push(`${rel}:${lineAt(src, t.pos)} answers ${ENDPOINT} by itself: call handleBakedRevision(req, res, root) of tools/lib/dev-revision.mjs`);
      if (global && t.t === 'id' && REMOVED.includes(t.v)) problems.push(`${rel}:${lineAt(src, t.pos)} uses ${t.v}, the global bake revision that no longer exists: ask tools/baked-revision.mjs revisionOf(root, areaId) / tools/lib/dev-revision.mjs liveRevision(root, areaId)`);
    }
  }
  return problems;
}

/** every .mjs / .js under tools/ (not the fixtures): { rel: source } */
export function toolSources(root) {
  const out = {}, walk = (dir) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (e.name !== 'fixtures' && e.name !== 'node_modules') walk(rel); }
      else if (/\.(mjs|js)$/.test(e.name)) out[rel] = fs.readFileSync(path.join(root, rel), 'utf8');
    }
  };
  walk('tools');
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), files = toolSources(root), problems = lintDevServers(files);
  for (const p of problems) console.error('FAIL ' + p);
  console.log(problems.length ? `RESULT: FAIL: ${problems.length} problem(s) in ${Object.keys(files).length} tool files` : `dev-servers-lint OK: ${Object.keys(files).length} tool files, no hand-written ${ENDPOINT} handler, no use of the global bake revision`);
  process.exit(problems.length ? 1 : 0);
}
