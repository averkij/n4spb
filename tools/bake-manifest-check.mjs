// Verifies the committed bakes against the source, PER AREA (docs/AREAS.md section 4): the bake revision of an area is the hash of its dependency closure (tools/baked-revision.mjs), so a change
// stales exactly the areas whose closure contains it. For every live area (src/areas/registry.js: not planned, not parked) it checks, and it reports ALL failures, not the first:
//   the manifest (format 1, scheme, area), manifest.revision === the revision of the closure, the 8 required products, every product named exactly <key>.<revision>.bin.gz, its size and sha256,
//   no unfinished (.part / .tmp) file and no orphan product of another revision in the directory; and src/core/baked-revision.js === render(the revisions of the manifests), byte for byte.
//   node tools/bake-manifest-check.mjs                    every live area      (npm run bakecheck)
//   node tools/bake-manifest-check.mjs --area strip,north parked areas are checked only when named
//   --no-sha  skip the sha256 of the products (about 2 s per 280 MiB)       --root <dir>  another tree (tests)
// A stale area names the files that changed since its bake (the digests in inputs.json) and the command that re-bakes it. Needs no node_modules, no browser, no git: the CI verify job runs it.
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRevisionContext } from './baked-revision.mjs';
import { statusesOf, describeStatus } from './lib/bake-status.mjs';
import { renderRevisionModule, parseRevisionModule, readRevisionModuleText, mapFromManifests, isLiveRow, REVISION_FILE } from './lib/revision-module.mjs';

/** { ok, lines[], statuses[], mapProblems[], fresh[], bytes, products } - opts: ids (named areas), ctx, sha256 (default true) */
export function checkBakes(root, opts = {}) {
  const ctx = opts.ctx || createRevisionContext(root), all = ctx.rows();
  const out = { ok: true, lines: [], statuses: [], mapProblems: [], fresh: [], usage: null, bytes: 0, products: 0 };
  if (opts.ids) {
    for (const id of opts.ids) {
      const row = all.find((r) => r.id === id);
      if (!row) { out.usage = `unknown area "${id}" (known: ${all.map((r) => r.id).join(', ')})`; return out; }
      if (row.status === 'planned') { out.usage = `area "${id}" is planned: it has no bake`; return out; }
    }
  }
  const map = parseRevisionModule(readRevisionModuleText(root) ?? '');
  out.statuses = statusesOf(root, { ctx, ids: opts.ids, sha256: opts.sha256, map }).filter((s) => s.status !== 'PLANNED');
  // ---- the revision map against the manifests (always the whole map: it is one file)
  const text = readRevisionModuleText(root), manifestMap = mapFromManifests(root, all), live = new Set(all.filter(isLiveRow).map((r) => r.id));
  if (text === null) out.mapProblems.push(`${REVISION_FILE} does not exist`);
  else if (!map) out.mapProblems.push(`${REVISION_FILE} is not the generated per-area map (BAKED_REVISIONS): node tools/baked-revision-sync.mjs`);
  else {
    for (const id of Object.keys(map)) if (!live.has(id)) out.mapProblems.push(`${REVISION_FILE} has an entry for ${id}, which is not a live area (extra key)`);
    for (const [id, rev] of Object.entries(manifestMap)) if (map[id] !== rev) out.mapProblems.push(`${REVISION_FILE}: ${id} is ${map[id] ?? 'missing'} but its manifest says ${rev}`);
    for (const id of Object.keys(map)) if (live.has(id) && !(id in manifestMap)) out.mapProblems.push(`${REVISION_FILE}: ${id} has an entry (${map[id]}) but no usable manifest`);
    if (!out.mapProblems.length && text !== renderRevisionModule(manifestMap)) out.mapProblems.push(`${REVISION_FILE} is not exactly what the generator writes (hand-edited?): node tools/baked-revision-sync.mjs`);
  }
  // ---- report
  for (const s of out.statuses) {
    out.lines.push(describeStatus(s));
    if (s.status === 'FRESH') { out.fresh.push(s.id); for (const k of Object.keys(s.manifest.files)) { out.products++; out.bytes += s.manifest.sizes[k].gzip; } }
    else out.ok = false;
    for (const w of s.warnings || []) out.lines.push(`[${s.id}] warning: ${w}`);
  }
  for (const m of out.mapProblems) { out.lines.push(`[map] ${m}`); out.ok = false; }
  const group = (st) => out.statuses.filter((s) => s.status === st).map((s) => s.id);
  if (out.ok) out.lines.push(`RESULT: OK (fresh: ${out.fresh.join(', ')}; ${out.products} complete products; ${(out.bytes / 1048576).toFixed(1)} MiB gzip)`);
  else {
    const parts = ['stale', 'missing', 'unsynced', 'error'].map((w) => [w, group(w.toUpperCase())]).filter(([, ids]) => ids.length).map(([w, ids]) => `${w}: ${ids.join(', ')}`);
    if (out.mapProblems.length) parts.push(`map: ${out.mapProblems.length} problem${out.mapProblems.length > 1 ? 's' : ''}`);
    if (out.fresh.length) parts.push(`fresh: ${out.fresh.join(', ')}`);
    out.lines.push(`RESULT: FAIL: ${parts.join('; ')}`);
  }
  return out;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const argv = process.argv.slice(2), val = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : null);
  const unknown = argv.filter((a, i) => !['--area', '--root', '--no-sha'].includes(a) && argv[i - 1] !== '--area' && argv[i - 1] !== '--root');
  if (unknown.length) { console.error(`bake-manifest-check: unknown argument ${unknown[0]} (use --area id[,id] --no-sha --root <dir>)`); process.exit(2); }
  const root = val('--root') ? path.resolve(val('--root')) : fileURLToPath(new URL('../', import.meta.url));
  const r = checkBakes(root, { ids: val('--area') ? val('--area').split(',').filter(Boolean) : null, sha256: !argv.includes('--no-sha') });
  if (r.usage) { console.error(`bake-manifest-check: ${r.usage}`); process.exit(2); }
  for (const l of r.lines) console.log(l);
  process.exit(r.ok ? 0 : 1);
}
