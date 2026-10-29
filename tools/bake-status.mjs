// What does the bake of every area look like right now? CPU only (no GPU, no node_modules, no git).
//   node tools/bake-status.mjs                  the live areas
//   node tools/bake-status.mjs --area strip     named areas (parked ones only when named)
//   --json  machine-readable          --no-sha  skip the sha256 of the products          --root <dir>  another tree
// Status: FRESH | STALE (a GPU bake is needed) | MISSING | UNSYNCED (node tools/baked-revision-sync.mjs --purge fixes it, no GPU) | ERROR (the closure cannot be computed). Exit 0 when every shown area is FRESH, else 1.
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { statusesOf, describeStatus } from './lib/bake-status.mjs';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const argv = process.argv.slice(2), val = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : null);
  const unknown = argv.filter((a, i) => !['--area', '--root', '--json', '--no-sha'].includes(a) && argv[i - 1] !== '--area' && argv[i - 1] !== '--root');
  if (unknown.length) { console.error(`bake-status: unknown argument ${unknown[0]}`); process.exit(2); }
  const root = val('--root') ? path.resolve(val('--root')) : fileURLToPath(new URL('../', import.meta.url));
  const ids = val('--area') ? val('--area').split(',').filter(Boolean) : undefined;
  const all = statusesOf(root, { ids, sha256: !argv.includes('--no-sha') });
  const unknownIds = (ids || []).filter((id) => !all.some((s) => s.id === id));
  if (unknownIds.length) { console.error(`bake-status: unknown area "${unknownIds[0]}"`); process.exit(2); }
  const shown = all.filter((s) => s.status !== 'PLANNED');
  if (argv.includes('--json')) console.log(JSON.stringify(shown.map((s) => ({ id: s.id, status: s.status, revision: s.revision, manifestRevision: s.manifestRevision, closure: s.closure, problems: s.problems, changed: s.diff && s.diff.names, estMinutes: s.estMinutes })), null, 1));
  else for (const s of shown) console.log(describeStatus(s));
  process.exit(shown.every((s) => s.status === 'FRESH') ? 0 : 1);
}
