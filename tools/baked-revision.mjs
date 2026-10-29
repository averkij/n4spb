// The bake revision of an AREA (docs/AREAS.md section 4): the sha256 of its dependency closure - its page, the targets of the page's import map and every file reachable from them by import
// (tools/lib/closure.mjs) - plus the lock entry of three.js and the area id. A pure function of the committed tree: the bake, the CI, the dev servers and the hand-off all recompute it, and every unknown
// dependency is an error. A change stales exactly the areas whose closure contains the changed file. The generated src/core/baked-revision.js holds one revision per live area.
//
//   revisionOf(root, areaId, ctx?)    the 20 hex digits of one area
//   revisionsOf(root, opts?)          { id: { revision, files, bytes, hashed[] } } for every area of the registry (one directory walk, one read cache)
//   liveAreas(root, ctx?)             the registry rows that are baked (not parked, not planned)
//   createRevisionContext(root, opts) a tree snapshot: { overlay, virtual, read, areas, rules, scanner } (tests overlay in-memory files; see tools/lib/closure.mjs createContext)
//   digestsOf(ctx, hashed)            { rel: sha256[0:12] } of the hashed bytes (inputs.json)
//
// Not hashed on purpose: the bake tooling itself (tools/bake-scene.mjs, bake-osm, the codec on the tools side), Google Fonts bytes and the Edge / GPU versions: change those -> bump BAKE_SCHEME
// and re-bake everything (node tools/bake-scene.mjs --area all --force).
import { createHash } from 'node:crypto';
import path from 'node:path';
import { createContext, makeScanner, scanner as defaultScanner, ClosureError } from './lib/closure.mjs';
import { RUNTIME_ONLY, EXCLUDED } from './lib/closure-rules.mjs';

/** Bump when the bake TOOLCHAIN changes what a bake produces (renderer, codec, bake-osm, driver): it is part of every revision. */
export const BAKE_SCHEME = 2;
/** Runtime-only files (gates, hand-off codec, version, registry): traversed by the scan, never hashed (tools/runtime-only-lint.mjs: only src/main.js imports them). */
export { RUNTIME_ONLY, EXCLUDED, ClosureError };
export const TEXT_EXT = ['.js', '.mjs', '.html', '.json', '.css'];

/** a revision context: the tree snapshot with the scanner it is read by (default: the real one) */
export function createRevisionContext(root, opts = {}) {
  const ctx = createContext(root, opts);
  ctx.scanner = opts.scanner || defaultScanner;
  return ctx;
}
/** the bytes that enter the hash: text files with CRLF read as LF, everything else raw (cached per file in the context) */
function hashBytes(ctx, rel) {
  return ctx.memo(rel, 'hash', () => {
    const b = ctx.bytes(rel);
    return TEXT_EXT.includes(path.posix.extname(rel).toLowerCase()) ? Buffer.from(b.toString('utf8').replaceAll('\r\n', '\n'), 'utf8') : b;
  });
}
/** the lock entry of three.js (package-lock.json: version + integrity); no npm ci needed. Throws when it is missing: the revision would silently ignore a three.js upgrade. */
export function threeLockOf(ctx) {
  return ctx.memo('package-lock.json', 'three', () => {
    let lock; try { lock = JSON.parse(ctx.text('package-lock.json')); } catch (e) { throw new ClosureError('Lock', `package-lock.json cannot be read (${e.message})`); }
    const e = lock && lock.packages && lock.packages['node_modules/three'];
    if (!e || !e.version || !e.integrity) throw new ClosureError('Lock', 'package-lock.json has no node_modules/three entry with a version and an integrity');
    return { version: e.version, integrity: e.integrity };
  });
}
/** { revision, files, bytes, hashed } of one area on the tree of `ctx` */
export function areaRevision(root, areaId, ctx) {
  ctx = ctx || createRevisionContext(root);
  const { hashed } = (ctx.scanner || defaultScanner).closureOf(root, areaId, ctx);
  const h = createHash('sha256'); let bytes = 0;
  h.update(`n4spb-bake-rev/${BAKE_SCHEME}\narea\0${areaId}\n`);
  for (const rel of hashed) {
    const buf = hashBytes(ctx, rel); bytes += buf.length;
    h.update(rel + '\0' + buf.length + '\0'); h.update(buf); h.update('\0');
  }
  const lock = threeLockOf(ctx);
  h.update('three\0' + lock.version + ' ' + lock.integrity);
  return { revision: h.digest('hex').slice(0, 20), files: hashed.length, bytes, hashed };
}
export function revisionOf(root, areaId, ctx) { return areaRevision(root, areaId, ctx).revision; }
/** { rel: sha256[0:12] } of the bytes that enter the hash, for the files of a closure (inputs.json of a bake: the informational diff of bake-manifest-check) */
export function digestsOf(ctx, hashed) {
  const out = {};
  for (const rel of hashed) out[rel] = createHash('sha256').update(hashBytes(ctx, rel)).digest('hex').slice(0, 12);
  return out;
}
/** the registry rows that are baked: not parked, not planned */
export function liveAreas(root, ctx) {
  ctx = ctx || createRevisionContext(root);
  return ctx.rows().filter((r) => !r.parked && r.status !== 'planned');
}
/** every area of the registry (live and parked; planned rows have no files), one shared walk and read cache: { id: { revision, files, bytes, hashed } }. opts: the context options, plus `ids` to restrict. */
export function revisionsOf(root, opts = {}) {
  const ctx = opts.ctx || createRevisionContext(root, opts), out = {};
  for (const row of ctx.rows()) {
    if (row.status === 'planned') continue;
    if (opts.ids && !opts.ids.includes(row.id)) continue;
    out[row.id] = areaRevision(root, row.id, ctx);
  }
  return out;
}

// ---- transitional: the GLOBAL revision of v3.1.0 and before. bake-scene.mjs / bake-manifest-check.mjs and the dev servers still import these two until they are moved to the per-area functions above
// (the legacy algorithm lives on in tools/lib/legacy-revision.mjs for the migration only). They disappear when the last caller does; tools/dev-servers-lint.mjs then guards the door.
export { bakedRevision, bakedRevisionFiles } from './lib/legacy-revision.mjs';
export { makeScanner };
