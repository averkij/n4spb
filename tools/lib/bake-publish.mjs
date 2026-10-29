// Publishing the bake of ONE area, atomically per area (docs/AREAS.md section 4). The area is valid as soon as its manifest is renamed into place; the revision map and the purge follow.
//   publishArea({ root, row, revision, files, sizes, sha256, inputs, closure, bakeSeconds, rows, fault })
//     1. inputs.json.tmp -> inputs.json            (informational)
//     2. manifest.json.tmp -> manifest.json        THE COMMIT POINT of the area
//     3. src/core/baked-revision.js.tmp -> src/core/baked-revision.js, merged from ALL current manifests (so a crash after 2 is repaired by `node tools/baked-revision-sync.mjs`)
//     4. purge of the area's own old products (its directory only, files only)
//   fault: 'after-inputs' | 'after-manifest' | 'after-map' throws at that point (tests/bake-plan-test.mjs: the state left behind must be reported, never trusted)
//   purgeProducts(dir, keepNames)  the purge of step 4 (also used by the sync tool)
//   finishArea(...)                everything the bake does between "both quality stages ran" and the publish: served-file audit, re-digest of the closure, product checks, sha256, publishArea
import fs from 'node:fs';
import path from 'node:path';
import { BAKE_SCHEME, createRevisionContext, areaRevision, digestsOf, threeLockOf } from '../baked-revision.mjs';
import { areaDir, renderRevisionModule, mapFromManifests, REVISION_FILE } from './revision-module.mjs';
import { PURGE_RE, REQUIRED, sha256File, diffInputs } from './bake-status.mjs';
import { auditServed } from './bake-guard.mjs';

export function writeAtomic(file, text) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, text); fs.renameSync(tmp, file);
}
/** delete the products of other revisions and the unfinished chunks of a directory: files only, never a subdirectory (the strip's directory holds the other areas'). Returns the names removed. */
export function purgeProducts(dir, keep) {
  const removed = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isFile() && !keep.has(e.name) && (PURGE_RE.test(e.name) || /\.(part|tmp)$/.test(e.name))) { fs.unlinkSync(path.join(dir, e.name)); removed.push(e.name); }
  }
  return removed;
}

/** delete the .part / .tmp files of a directory (a crashed bake); the caller holds the bake lock */
export function removeUnfinished(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isFile() && /.(part|tmp)$/.test(e.name)) fs.unlinkSync(path.join(dir, e.name));
}

/**
 * The state of the bake of one area (what the bake server writes into and finishArea publishes): a FRESH read of the tree at the start of this area, its revision and closure, the digests of the closure
 * and an empty set of served files. The directory is cleaned of the unfinished chunks of a crashed bake (the caller holds the bake lock); the products of earlier revisions stay until the publish.
 */
export function beginArea({ root, row }) {
  const actx = createRevisionContext(root), info = areaRevision(root, row.id, actx), closure = actx.scanner.closureOf(root, row.id, actx), lock = threeLockOf(actx), output = areaDir(root, row);
  fs.mkdirSync(output, { recursive: true }); removeUnfinished(output);
  return { row, output, revision: info.revision, info, closure, digests: digestsOf(actx, info.hashed), three: `${lock.version} ${lock.integrity}`, files: {}, sizes: {}, served: new Set() };
}

export function publishArea({ root, row, revision, files, sizes, sha256, inputs, closure, bakeSeconds, rows, fault }) {
  if (!/^[0-9a-f]{20}$/.test(revision)) throw new Error(`publishArea: bad revision ${revision}`);
  const dir = areaDir(root, row);
  fs.mkdirSync(dir, { recursive: true });
  for (const [k, n] of Object.entries(files)) if (n !== `${k}.${revision}.bin.gz`) throw new Error(`publishArea: product ${k} is named ${n}, expected ${k}.${revision}.bin.gz`);
  const manifest = { format: 1, scheme: BAKE_SCHEME, area: row.id, revision, closure, files, sizes, sha256 };
  writeAtomic(path.join(dir, 'inputs.json'), JSON.stringify({ ...inputs, area: row.id, revision, scheme: BAKE_SCHEME, bakeSeconds: bakeSeconds ?? null }));
  if (fault === 'after-inputs') throw new Error('fault injection: after-inputs');
  writeAtomic(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  if (fault === 'after-manifest') throw new Error('fault injection: after-manifest');
  rows = rows || createRevisionContext(root).rows();
  const map = mapFromManifests(root, rows);
  writeAtomic(path.join(root, REVISION_FILE), renderRevisionModule(map));
  if (fault === 'after-map') throw new Error('fault injection: after-map');
  const purged = purgeProducts(dir, new Set(Object.values(files).map(String)));
  return { manifest, map, purged };
}

/**
 * The end of the bake of one area. `current`: { row, revision, info (areaRevision result at the start), closure (closureOf at the start: .seen), digests (digestsOf at the start), three, output, files, sizes, served:Set<string> }.
 * Throws an Error whose message names what is wrong; nothing is published then. Returns the publishArea result.
 */
export function finishArea({ root, current, bakeSeconds, rows, fault }) {
  const { row, revision, info, closure } = current, id = row.id;
  // 1. the independent runtime check on the scanner: every repository file the page loaded must be in the closure (or on the allowlist)
  const bad = auditServed({ served: current.served, seen: closure.seen, area: id });
  if (bad.length) throw new Error(`served-file audit of ${id} failed (nothing published):\n  ${bad.join('\n  ')}`);
  // 2. the source must not have changed during the bake: re-digest the closure on a FRESH read of the tree
  const ctx2 = createRevisionContext(root), info2 = areaRevision(root, id, ctx2);
  const l2 = threeLockOf(ctx2);
  if (info2.revision !== revision) {
    const d = diffInputs({ files: current.digests, three: current.three, scheme: BAKE_SCHEME }, digestsOf(ctx2, info2.hashed), `${l2.version} ${l2.integrity}`);
    throw new Error(`the source changed during the bake of ${id} (${revision} -> ${info2.revision}): ${d.names.slice(0, 12).join(', ') || '?'}; refusing to publish stale assets`);
  }
  // 3. the products
  for (const k of REQUIRED) if (!current.files[k]) throw new Error(`missing product ${k} of area ${id}`);
  const dir = areaDir(root, row), sha256 = {};
  for (const [k, n] of Object.entries(current.files)) {
    const f = path.join(dir, n);
    if (n !== `${k}.${revision}.bin.gz`) throw new Error(`product ${k} is named ${n}, expected ${k}.${revision}.bin.gz`);
    if (!fs.existsSync(f)) throw new Error(`product file ${n} does not exist`);
    const size = fs.statSync(f).size;
    if (!current.sizes[k] || current.sizes[k].gzip !== size) throw new Error(`product ${n} is ${size} bytes, the bake recorded ${current.sizes[k] && current.sizes[k].gzip}`);
    sha256[k] = sha256File(f);
  }
  const inputs = { format: 1, files: current.digests, three: current.three };
  return publishArea({ root, row, revision, files: current.files, sizes: current.sizes, sha256, inputs, closure: { files: info.files, bytes: info.bytes }, bakeSeconds, rows, fault });
}
