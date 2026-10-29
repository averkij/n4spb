// Regenerates src/core/baked-revision.js (the map area -> bake revision) from the manifests of the live areas. The manifests are the truth; the map is a copy that the pages carry.
//   node tools/baked-revision-sync.mjs             write the map when it differs
//   node tools/baked-revision-sync.mjs --check     exit 1 when the map differs (writes nothing)
//   node tools/baked-revision-sync.mjs --purge     also remove the products of other revisions and the unfinished files from every directory whose manifest is complete and consistent
//   (--root <dir>: another tree, for tests)
// Needs no GPU, no node_modules. A bake calls it by itself at the start when it finds an UNSYNCED area (a crash between the manifest and the map of tools/lib/bake-publish.mjs).
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRevisionContext } from './baked-revision.mjs';
import { renderRevisionModule, mapFromManifests, readRevisionModuleText, areaDir, isLiveRow, REVISION_FILE } from './lib/revision-module.mjs';
import { verifyArea } from './lib/bake-status.mjs';
import { writeAtomic, purgeProducts } from './lib/bake-publish.mjs';

/** { map, text, changed, written, purged: {id: [names]}, refused: {id: why}, cruft: {id: [names]} } - opts: check (write nothing), purge, rows */
export function syncRevisionMap(root, opts = {}) {
  const rows = opts.rows || createRevisionContext(root).rows(), map = mapFromManifests(root, rows), text = renderRevisionModule(map);
  const changed = readRevisionModuleText(root) !== text, out = { map, text, changed, written: false, purged: {}, refused: {}, cruft: {} };
  if (changed && !opts.check) { writeAtomic(path.join(root, REVISION_FILE), text); out.written = true; }
  for (const row of rows.filter(isLiveRow)) {
    if (!map[row.id]) continue;
    const v = verifyArea(root, row, map[row.id], { sha256: false });
    const cruft = v.problems.filter((p) => p.kind === 'cruft').map((p) => p.msg);
    if (v.problems.some((p) => p.kind !== 'cruft')) { if (opts.purge && cruft.length) out.refused[row.id] = `the manifest is not consistent (${v.problems.find((p) => p.kind !== 'cruft').msg}): nothing purged`; continue; }
    if (!cruft.length) continue;
    out.cruft[row.id] = cruft;
    if (opts.purge && !opts.check) out.purged[row.id] = purgeProducts(areaDir(root, row), new Set(Object.values(v.manifest.files)));
  }
  return out;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const argv = process.argv.slice(2), has = (f) => argv.includes(f);
  const bad = argv.filter((a, i) => !['--check', '--purge', '--root'].includes(a) && argv[i - 1] !== '--root');
  if (bad.length) { console.error(`baked-revision-sync: unknown argument ${bad[0]} (use --check --purge --root <dir>)`); process.exit(2); }
  const root = has('--root') ? path.resolve(argv[argv.indexOf('--root') + 1]) : fileURLToPath(new URL('../', import.meta.url));
  const r = syncRevisionMap(root, { check: has('--check'), purge: has('--purge') });
  const ids = Object.keys(r.map);
  console.log(`baked-revision-sync: ${ids.length} live areas with a current manifest (${ids.join(', ') || 'none'})`);
  if (has('--check')) {
    const cruft = Object.entries(r.cruft);
    if (r.changed) console.log(`DIFFERS: ${REVISION_FILE} is not render(manifests): run node tools/baked-revision-sync.mjs`);
    for (const [id, c] of cruft) console.log(`[${id}] cruft: ${c.join('; ')}`);
    if (r.changed || (has('--purge') && cruft.length)) { console.log('RESULT: FAIL'); process.exit(1); }
    console.log('RESULT: OK'); process.exit(0);
  }
  console.log(r.written ? `wrote ${REVISION_FILE}` : `${REVISION_FILE} is in sync`);
  for (const [id, names] of Object.entries(r.purged)) console.log(`[${id}] purged ${names.length}: ${names.slice(0, 6).join(', ')}${names.length > 6 ? ', ...' : ''}`);
  for (const [id, why] of Object.entries(r.refused)) console.log(`[${id}] ${why}`);
  for (const [id, c] of Object.entries(r.cruft)) if (!has('--purge')) console.log(`[${id}] cruft remains (${c.length}): run with --purge`);
}
