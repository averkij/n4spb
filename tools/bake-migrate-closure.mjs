// One-shot migration of the committed bakes from the GLOBAL revision (v3.1.0: 78fc35d9a53453f9fa9a) to PER-AREA revisions, WITHOUT a re-bake (docs/BAKE-REVISIONS.md section 10).
//   node tools/bake-migrate-closure.mjs --dry-run     check everything, scan every product, print the plan; changes nothing
//   node tools/bake-migrate-closure.mjs               do it (git mv of every product, new manifests, inputs.json, the generated src/core/baked-revision.js)
//   (--root <dir> another tree; --skip-scan for a repeated rehearsal: the product scan is the slow part, minutes of CPU)
// Why it is sound: the revision exists only in file names and manifests (a stream scan of every decompressed product for the old 20-hex string must find nothing: step 2), and the legacy equality of step 1
// proves that the tree IS the tree that was baked, so inputs.json can be written from it. The renamed bytes are re-hashed against the sha256 recorded before the rename (step 5).
// Steps:
//   1. git is clean; legacyGlobal(root) === every live manifest revision === the old BAKED_REVISION; every live directory holds exactly the products of its manifest
//   2. every decompressed product is scanned for the old revision string: no hit allowed
//   3. sha256 of every gzip is recorded
//   4. per live area: newRev = revisionOf(area); git mv <key>.<old>.bin.gz <key>.<newRev>.bin.gz; manifest (scheme 2, closure, sha256) + inputs.json + the map through publishArea
//   5. every renamed file is hashed again: equal to the record. Parked areas (strip, north) are not touched.
// Mid-way failure: `git checkout -- assets src/core/baked-revision.js && git clean -fd assets/baked` returns to the start (nothing is committed by this tool).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRevisionContext, areaRevision, liveAreas } from './baked-revision.mjs';
import { legacyGlobal } from './lib/legacy-revision.mjs';
import { areaDir, readManifest, REVISION_FILE } from './lib/revision-module.mjs';
import { PRODUCT_RE, sha256File, inputsOf } from './lib/bake-status.mjs';
import { publishArea } from './lib/bake-publish.mjs';
import { syncRevisionMap } from './baked-revision-sync.mjs';

/** stream-scan a .bin.gz for `needle` (decompressed bytes); resolves to the number of hits */
export function countInGzip(file, needle) {
  const n = Buffer.from(needle, 'latin1');
  return new Promise((resolve, reject) => {
    let hits = 0, tail = Buffer.alloc(0);
    const gz = zlib.createGunzip();
    gz.on('data', (chunk) => {
      const buf = tail.length ? Buffer.concat([tail, chunk]) : chunk;
      for (let at = buf.indexOf(n); at >= 0; at = buf.indexOf(n, at + 1)) hits++;
      tail = Buffer.from(buf.subarray(Math.max(0, buf.length - (n.length - 1))));
    });
    gz.on('end', () => resolve(hits)); gz.on('error', reject);
    fs.createReadStream(file).on('error', reject).pipe(gz);
  });
}

const git = (root, args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });

/** the whole migration. opts: dryRun, skipScan, log. Returns { plan: {id: {old, rev, files, bytes}}, renamed }. Throws an Error with the reason on any broken precondition. */
export async function migrate(root, opts = {}) {
  const log = opts.log || (() => {});
  // ---- 1. preconditions
  const dirty = git(root, ['status', '--porcelain']).trim();
  if (dirty) throw new Error(`the git tree is not clean (commit or stash first):\n${dirty.split('\n').slice(0, 10).join('\n')}`);
  const ctx = createRevisionContext(root), rows = liveAreas(root, ctx), legacy = legacyGlobal(root);
  const oldConst = (/BAKED_REVISION = '([0-9a-f]{20})'/.exec(fs.readFileSync(path.join(root, REVISION_FILE), 'utf8')) || [])[1];
  if (!oldConst) throw new Error(`${REVISION_FILE} is not the legacy single constant (already migrated?)`);
  if (oldConst !== legacy) throw new Error(`the legacy global revision of this tree is ${legacy}, but ${REVISION_FILE} says ${oldConst}: the tree is not the baked tree`);
  const plan = {};
  for (const row of rows) {
    const dir = areaDir(root, row), { manifest, error } = readManifest(dir);
    if (error || !manifest) throw new Error(`[${row.id}] no readable manifest: ${error || 'missing'}`);
    if (manifest.revision !== legacy) throw new Error(`[${row.id}] manifest revision ${manifest.revision} !== the legacy global ${legacy}`);
    if (manifest.scheme !== undefined) throw new Error(`[${row.id}] the manifest already has a scheme (${manifest.scheme}): migrated?`);
    if (manifest.area !== row.id) throw new Error(`[${row.id}] the manifest names area ${manifest.area}`);
    const listed = new Set(Object.values(manifest.files));
    for (const [k, n] of Object.entries(manifest.files)) {
      if (n !== `${k}.${legacy}.bin.gz`) throw new Error(`[${row.id}] product ${k} is named ${n}`);
      if (!fs.existsSync(path.join(dir, n))) throw new Error(`[${row.id}] product ${n} does not exist`);
      if (!manifest.sizes || !manifest.sizes[k] || manifest.sizes[k].gzip !== fs.statSync(path.join(dir, n)).size) throw new Error(`[${row.id}] product ${n}: size differs from the manifest`);
    }
    const extra = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile() && (PRODUCT_RE.test(e.name) || /\.(part|tmp)$/.test(e.name)) && !listed.has(e.name)).map((e) => e.name);
    if (extra.length) throw new Error(`[${row.id}] the directory holds files that the manifest does not list: ${extra.slice(0, 5).join(', ')}`);
    const info = areaRevision(root, row.id, ctx);
    plan[row.id] = { row, manifest, old: legacy, rev: info.revision, info, files: Object.keys(manifest.files).length, bytes: 0 };
    log(`[${row.id}] ${plan[row.id].files} products, ${legacy} -> ${info.revision} (closure ${info.files} files)`);
  }
  const revs = Object.values(plan).map((p) => p.rev);
  if (new Set(revs).size !== revs.length) throw new Error('two live areas share a per-area revision');
  if (revs.includes(legacy)) throw new Error('a per-area revision equals the legacy one');
  // ---- 2 + 3. scan and record
  const sums = {};
  for (const [id, p] of Object.entries(plan)) {
    sums[id] = {};
    for (const [k, n] of Object.entries(p.manifest.files)) {
      const f = path.join(areaDir(root, p.row), n);
      if (!opts.skipScan) { const hits = await countInGzip(f, legacy); if (hits) throw new Error(`[${id}] ${n} contains the old revision ${legacy} ${hits} times: a rename is NOT enough, re-bake (--area all --force)`); }
      sums[id][k] = sha256File(f); p.bytes += p.manifest.sizes[k].gzip;
    }
    log(`[${id}] scanned${opts.skipScan ? ' (SKIPPED)' : ''}: no occurrence of ${legacy} in ${p.files} products; sha256 recorded (${(p.bytes / 1048576).toFixed(1)} MiB)`);
  }
  if (opts.dryRun) return { plan, renamed: 0, dryRun: true };
  // ---- 4. rename + manifests
  let renamed = 0;
  for (const [id, p] of Object.entries(plan)) {
    const dir = areaDir(root, p.row), rel = path.relative(root, dir).replaceAll('\\', '/'), files = {};
    for (const [k, n] of Object.entries(p.manifest.files)) {
      const to = `${k}.${p.rev}.bin.gz`;
      git(root, ['mv', `${rel}/${n}`, `${rel}/${to}`]); files[k] = to; renamed++;
    }
    const inputs = inputsOf(ctx, id, p.info, null);
    publishArea({ root, row: p.row, revision: p.rev, files, sizes: p.manifest.sizes, sha256: sums[id], inputs, closure: { files: p.info.files, bytes: p.info.bytes }, bakeSeconds: null, rows: ctx.rows() });
    p.newFiles = files;
    log(`[${id}] renamed ${Object.keys(files).length} products, manifest + inputs.json written`);
  }
  const sync = syncRevisionMap(root, { purge: true });
  log(`${REVISION_FILE}: ${JSON.stringify(sync.map)}`);
  // ---- 5. the renamed bytes are the recorded bytes
  for (const [id, p] of Object.entries(plan)) {
    for (const [k, n] of Object.entries(p.newFiles)) {
      if (sha256File(path.join(areaDir(root, p.row), n)) !== sums[id][k]) throw new Error(`[${id}] ${n}: the bytes changed by the rename`);
    }
    log(`[${id}] ${Object.keys(p.newFiles).length} renamed products hash to the recorded sha256`);
  }
  return { plan, renamed, dryRun: false, map: sync.map };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const argv = process.argv.slice(2), has = (f) => argv.includes(f);
  const bad = argv.filter((a, i) => !['--dry-run', '--skip-scan', '--root'].includes(a) && argv[i - 1] !== '--root');
  if (bad.length) { console.error(`bake-migrate-closure: unknown argument ${bad[0]} (use --dry-run --skip-scan --root <dir>)`); process.exit(2); }
  const root = has('--root') ? path.resolve(argv[argv.indexOf('--root') + 1]) : fileURLToPath(new URL('../', import.meta.url));
  try {
    const r = await migrate(root, { dryRun: has('--dry-run'), skipScan: has('--skip-scan'), log: (m) => console.log(m) });
    console.log(r.dryRun ? 'RESULT: DRY RUN OK (nothing changed)' : `RESULT: MIGRATED ${r.renamed} products in ${Object.keys(r.plan).length} areas; now run node tools/bake-manifest-check.mjs and git diff -M --summary`);
  } catch (e) { console.error(`RESULT: FAIL: ${e.message}`); process.exit(1); }
}
