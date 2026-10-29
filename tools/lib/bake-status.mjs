// Is the committed bake of an area fresh? (docs/AREAS.md section 4, "bake revision"). Pure Node, no node_modules, no git: the CI verify job runs it.
//   verifyArea(root, row, rev, opts)   { ok, problems[], warnings[], manifest }  the manifest and its products against the revision of the closure
//   areaStatus(root, row, opts)        { status: MISSING | STALE | UNSYNCED | FRESH | ERROR, ... }
//   statusesOf(root, opts)             the status of every (non-planned) row, one shared tree snapshot
//   planBake(statuses, args)           which areas a bake run takes (pure)
//   parseBakeArgs(argv)                the command line of tools/bake-scene.mjs (pure)
//   inputsOf / diffInputs              inputs.json of a bake and the informational list of the files that changed since it
// Status words:
//   MISSING   no manifest
//   STALE     the manifest does not describe a complete, current bake: another revision / scheme / area, a missing or mis-named or damaged product ... -> a GPU bake is needed
//   UNSYNCED  the manifest IS the current bake, but src/core/baked-revision.js does not carry its revision, or the directory holds products of another revision / unfinished files -> `node tools/baked-revision-sync.mjs --purge`, no GPU
//   FRESH     nothing to do
//   ERROR     the closure of the area cannot be computed (a scanner error: an unclassified dependency); fail closed
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { BAKE_SCHEME, createRevisionContext, areaRevision, digestsOf, threeLockOf } from '../baked-revision.mjs';
import { areaDir, readManifest, readRevisionMap, isLiveRow } from './revision-module.mjs';

export const REQUIRED = ['field', 'roof', 'street-textures', 'street-kerbs', 'street-surfaces', 'city-base', 'nav-medium', 'nav-low'];
/** a product of a bake: <key>.<revision>.bin.gz (also the purge regex of the bake, with its unfinished .part) */
export const PRODUCT_RE = /^([a-zA-Z0-9_-]+)\.([a-f0-9]{20})\.bin\.gz$/;
export const PURGE_RE = /^[a-zA-Z0-9_-]+\.[a-f0-9]{20}\.(bin\.gz|part)$/;
const UNFINISHED_RE = /\.(part|tmp)$/;
const DEFAULT_MINUTES = 5;

export function sha256File(file) {
  const h = createHash('sha256'), fd = fs.openSync(file, 'r'), buf = Buffer.allocUnsafe(8 << 20);
  try { for (;;) { const n = fs.readSync(fd, buf, 0, buf.length, null); if (!n) break; h.update(n === buf.length ? buf : buf.subarray(0, n)); } } finally { fs.closeSync(fd); }
  return h.digest('hex');
}
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * The manifest of `row` and its products against the revision `rev` of the closure. Every problem is { code, kind, msg }, kind 'missing' | 'stale' | 'cruft':
 * cruft (products of another revision, unfinished files) does not make the bake stale - the directory just needs a purge. opts.sha256 (default true) hashes the products.
 */
export function verifyArea(root, row, rev, opts = {}) {
  const dir = areaDir(root, row), problems = [], warnings = [];
  const add = (code, kind, msg) => problems.push({ code, kind, msg });
  const fin = (manifest) => ({ ok: problems.length === 0, problems, warnings, manifest });
  const { manifest, error } = readManifest(dir);
  if (error) { add('manifest-json', 'stale', error); return fin(null); }
  if (!manifest) { add('no-manifest', 'missing', `no manifest in assets/${row.bake}`); return fin(null); }
  if (manifest.format !== 1) add('format', 'stale', `manifest format ${JSON.stringify(manifest.format)} (expected 1)`);
  if (manifest.scheme !== BAKE_SCHEME) add('scheme', 'stale', `manifest scheme ${manifest.scheme === undefined ? 'none (a bake of the global-revision era)' : JSON.stringify(manifest.scheme)} but the tools are at BAKE_SCHEME ${BAKE_SCHEME}`);
  if (manifest.area !== row.id) add('area', 'stale', `the manifest says area ${JSON.stringify(manifest.area)} but it lives in the directory of ${row.id}`);
  if (manifest.revision !== rev) add('revision', 'stale', `manifest revision ${manifest.revision} but the closure hashes to ${rev}`);
  const revision = typeof manifest.revision === 'string' ? manifest.revision : '';
  const files = isObj(manifest.files) ? manifest.files : (add('files', 'stale', 'manifest.files is not an object'), {});
  const sizes = isObj(manifest.sizes) ? manifest.sizes : (add('sizes', 'stale', 'manifest.sizes is not an object'), {});
  const sums = manifest.sha256 === undefined ? null : (isObj(manifest.sha256) ? manifest.sha256 : (add('sha256', 'stale', 'manifest.sha256 is not an object'), null));
  if (manifest.sha256 === undefined) warnings.push('the manifest has no sha256 section (the integrity of the products is not checked)');
  for (const key of REQUIRED) if (!files[key]) add('required', 'stale', `missing required product ${key}`);
  const listed = new Set();
  for (const [key, name] of Object.entries(files)) {
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) { add('key', 'stale', `product key ${JSON.stringify(key)} is not a valid name`); continue; }
    const expected = `${key}.${revision}.bin.gz`;
    if (name !== expected) { add('name', 'stale', `product ${key} is named ${JSON.stringify(name)}, expected ${expected}`); continue; }
    listed.add(name);
    const file = path.join(dir, name);
    let st; try { st = fs.statSync(file); } catch { add('product-missing', 'stale', `product file ${name} does not exist`); continue; }
    const size = sizes[key];
    if (!isObj(size) || !Number.isFinite(size.gzip) || !Number.isFinite(size.raw) || size.raw <= 0) add('sizes', 'stale', `sizes.${key} lacks raw / gzip numbers`);
    else if (size.gzip !== st.size) add('size', 'stale', `product ${name} is ${st.size} bytes, the manifest says ${size.gzip}`);
    if (sums && opts.sha256 !== false) {
      if (typeof sums[key] !== 'string') add('sha256', 'stale', `sha256.${key} is missing`);
      else if (sha256File(file) !== sums[key]) add('sha256', 'stale', `product ${name} does not match its sha256 (damaged or replaced)`);
    }
  }
  // direct children only: the directory of the strip holds the other areas' directories
  let entries = []; try { entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name); } catch { /* the manifest was read from here: cannot happen */ }
  for (const n of entries) {
    if (UNFINISHED_RE.test(n)) add('leftover', 'cruft', `unfinished file ${n}`);
    else if (PRODUCT_RE.test(n) && !listed.has(n)) add('orphan', 'cruft', `orphan product ${n} (not listed in the manifest of revision ${revision || '?'})`);
  }
  return fin(manifest);
}

/** the status of one area: { id, row, status, revision (of the closure), manifestRevision, problems, warnings, manifest } - opts: rev (known revision, else the closure is not scanned here), map (BAKED_REVISIONS), sha256 */
export function areaStatus(root, row, opts) {
  const v = verifyArea(root, row, opts.rev, opts);
  const out = { id: row.id, row, revision: opts.rev, manifestRevision: v.manifest ? v.manifest.revision : null, problems: [...v.problems], warnings: v.warnings, manifest: v.manifest };
  const kinds = new Set(v.problems.map((p) => p.kind));
  if (kinds.has('missing')) out.status = 'MISSING';
  else if (kinds.has('stale')) out.status = 'STALE';
  else {
    if (isLiveRow(row) && (!opts.map || opts.map[row.id] !== v.manifest.revision)) {
      out.problems.push({ code: 'map', kind: 'cruft', msg: `src/core/baked-revision.js ${opts.map ? `says ${opts.map[row.id] ?? 'nothing'} for ${row.id}` : 'is not a generated per-area map'}, the manifest says ${v.manifest.revision}` });
    }
    out.status = out.problems.length ? 'UNSYNCED' : 'FRESH';
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ inputs.json
/** inputs.json: the digests of the closure at the bake (informational, never part of the verdict) */
export function inputsOf(ctx, area, info, bakeSeconds) {
  const lock = threeLockOf(ctx);
  return { format: 1, area, revision: info.revision, scheme: BAKE_SCHEME, files: digestsOf(ctx, info.hashed), three: `${lock.version} ${lock.integrity}`, bakeSeconds: bakeSeconds ?? null };
}
export function readInputs(root, row) {
  try { return JSON.parse(fs.readFileSync(path.join(areaDir(root, row), 'inputs.json'), 'utf8')); } catch { return null; }
}
/** the files that differ between an inputs.json and the digests of the tree now: { changed[], added[], removed[], three, scheme, names[] } */
export function diffInputs(inputs, digests, three) {
  const old = isObj(inputs && inputs.files) ? inputs.files : {};
  const changed = Object.keys(digests).filter((f) => f in old && old[f] !== digests[f]).sort();
  const added = Object.keys(digests).filter((f) => !(f in old)).sort(), removed = Object.keys(old).filter((f) => !(f in digests)).sort();
  const threeChanged = inputs && typeof inputs.three === 'string' && three ? inputs.three !== three : false, scheme = inputs ? inputs.scheme !== BAKE_SCHEME : false;
  const names = [...changed, ...added.map((f) => `${f} (new)`), ...removed.map((f) => `${f} (gone)`), ...(threeChanged ? ['package-lock.json (three)'] : []), ...(scheme ? [`BAKE_SCHEME ${inputs.scheme}->${BAKE_SCHEME}`] : [])];
  return { changed, added, removed, three: threeChanged, scheme, names };
}
/** "a, b, c (+3)" - the first `max` names */
export function listShort(names, max = 5) { return names.length <= max ? names.join(', ') : `${names.slice(0, max).join(', ')} (+${names.length - max})`; }

// ------------------------------------------------------------------------------------------------ the statuses of all areas
/**
 * opts: ctx (a revision context; default: the tree of root), ids (restrict), parked (true: also the parked rows; an array: those ids; default: only the ones named in ids), sha256 (default true), map (default: read from the tree)
 * Returns [{ id, row, status, revision, closure:{files,bytes}, hashed, manifestRevision, problems, warnings, diff, inputs, estMinutes, error }] in registry order; planned rows come with status PLANNED.
 */
export function statusesOf(root, opts = {}) {
  const ctx = opts.ctx || createRevisionContext(root, opts), map = opts.map !== undefined ? opts.map : readRevisionMap(root), out = [];
  for (const row of ctx.rows()) {
    if (opts.ids && !opts.ids.includes(row.id)) continue;
    if (row.status === 'planned') { out.push({ id: row.id, row, status: 'PLANNED', problems: [], warnings: [] }); continue; }
    if (row.parked && !(opts.parked === true || (Array.isArray(opts.parked) && opts.parked.includes(row.id)) || (opts.ids && opts.ids.includes(row.id)))) continue;
    let info;
    try { info = areaRevision(root, row.id, ctx); } catch (e) { out.push({ id: row.id, row, status: 'ERROR', error: e.message, problems: [{ code: 'closure', kind: 'stale', msg: e.message }], warnings: [] }); continue; }
    const st = areaStatus(root, row, { rev: info.revision, map, sha256: opts.sha256 });
    st.closure = { files: info.files, bytes: info.bytes }; st.hashed = info.hashed;
    const inputs = readInputs(root, row);
    st.inputs = inputs && st.manifest && inputs.revision === st.manifest.revision ? inputs : null;      // an inputs.json of a bake that never got its manifest (a crash) describes nothing
    st.diff = null;
    if (st.status === 'STALE' && st.inputs) { try { st.diff = diffInputs(st.inputs, digestsOf(ctx, info.hashed), (() => { const l = threeLockOf(ctx); return `${l.version} ${l.integrity}`; })()); } catch { /* informational */ } }
    st.estMinutes = st.inputs && Number.isFinite(st.inputs.bakeSeconds) && st.inputs.bakeSeconds > 0 ? Math.max(1, Math.ceil(st.inputs.bakeSeconds / 60)) : DEFAULT_MINUTES;
    out.push(st);
  }
  return out;
}

export const bakeCommand = (ids) => `node tools/bake-scene.mjs --area ${ids.join(',')}`;
/** the one-line description of a status, with the command that repairs it */
export function describeStatus(s) {
  const tag = `[${s.id}] `;
  if (s.status === 'FRESH') return `${tag}FRESH: ${s.manifestRevision} (${s.closure ? `${s.closure.files} files in the closure` : ''}${s.manifest ? `, ${Object.keys(s.manifest.files || {}).length} products` : ''})`;
  if (s.status === 'PLANNED') return `${tag}PLANNED: no files yet, no bake`;
  if (s.status === 'ERROR') return `${tag}ERROR: the closure cannot be computed: ${s.error}`;
  if (s.status === 'MISSING') return `${tag}MISSING: ${s.problems[0].msg}. Bake: ${bakeCommand([s.id])} (~${s.estMinutes ?? DEFAULT_MINUTES} GPU-min)`;
  const short = (r) => (r ? `${String(r).slice(0, 12)}…` : 'none');
  if (s.status === 'UNSYNCED') return `${tag}UNSYNCED: the bake ${short(s.manifestRevision)} is current but ${s.problems.map((p) => p.msg).join('; ')}. Repair (no GPU): node tools/baked-revision-sync.mjs --purge`;
  const revision = s.problems.find((p) => p.code === 'revision');
  const others = s.problems.filter((p) => p.code !== 'revision' && p.kind !== 'cruft');
  let msg = revision ? `manifest ${short(s.manifestRevision)} but closure (${s.closure.files} files) hashes to ${short(s.revision)}` : 'the manifest does not describe a complete bake';
  if (revision) msg += s.diff ? (s.diff.names.length ? ` ; changed since the bake: ${listShort(s.diff.names)}` : ' ; no digest changed since the bake (the tooling or the scheme)') : ' ; changed files unknown (no inputs.json)';
  const extra = others.map((p) => p.msg);
  if (extra.length) msg += `${revision ? ' ; also: ' : ': '}${extra.slice(0, 4).join('; ')}${extra.length > 4 ? ` (+${extra.length - 4})` : ''}`;
  return `${tag}STALE: ${msg}. Re-bake: ${bakeCommand([s.id])} (~${s.estMinutes ?? DEFAULT_MINUTES} GPU-min)`;
}

// ------------------------------------------------------------------------------------------------ the command line of the bake, and which areas it takes
/** parseBakeArgs(argv) -> { area: null | 'stale' | 'all' | string[], force, plan, check, requireClean, root, errors[] } */
export function parseBakeArgs(argv) {
  const a = { area: null, force: false, plan: false, check: false, requireClean: false, root: null, errors: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--force') a.force = true;
    else if (x === '--plan') a.plan = true;
    else if (x === '--check') a.check = true;
    else if (x === '--require-clean') a.requireClean = true;
    else if (x === '--area' || x === '--root') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) { a.errors.push(`${x} needs a value`); i--; continue; }
      if (x === '--root') a.root = v;
      else if (a.area !== null) a.errors.push('--area given twice');
      else if (v === 'all' || v === 'stale') a.area = v;
      else { a.area = [...new Set(v.split(',').map((s) => s.trim()).filter(Boolean))]; if (!a.area.length) { a.errors.push('--area is empty'); a.area = null; } }
    } else a.errors.push(`unknown argument ${x}`);
  }
  if (a.check && !a.plan) a.errors.push('--check only goes with --plan');
  return a;
}
const needsBake = (s) => s.status === 'STALE' || s.status === 'MISSING' || s.status === 'ERROR';
/**
 * Which areas does a bake run take? Pure. statuses: statusesOf() rows (planned ones as PLANNED); args: parseBakeArgs().
 *   none / --area stale     the STALE and MISSING live areas
 *   --area all              the same (every live area with --force)
 *   --area a,b              those areas when they need a bake (any status with --force; a parked area only by name)
 *   --force without --area  is a usage error: name the areas
 * Returns { selected: [{id, reason}], skipped: [{id, why}], repair: [ids to sync without a GPU], errors: [msg], usage: bool }
 */
export function planBake(statuses, args) {
  const out = { selected: [], skipped: [], repair: [], errors: [], usage: false };
  const byId = new Map(statuses.map((s) => [s.id, s]));
  const live = statuses.filter((s) => !s.row.parked && s.status !== 'PLANNED');
  out.repair = live.filter((s) => s.status === 'UNSYNCED').map((s) => s.id);
  const pick = (s, forced) => {
    if (s.status === 'ERROR') { out.errors.push(`area ${s.id}: the closure cannot be computed: ${s.error}`); return; }
    if (needsBake(s)) out.selected.push({ id: s.id, reason: s.status });
    else if (forced) out.selected.push({ id: s.id, reason: 'forced' });
    else out.skipped.push({ id: s.id, why: `${s.status === 'UNSYNCED' ? 'fresh (to be synced)' : 'fresh'}, use --force to bake it again` });
  };
  const area = args.area;
  if (area === null || area === undefined) {
    if (args.force) { out.errors.push('--force needs --area <id[,id]> or --area all (it rebakes fresh areas: say which)'); out.usage = true; return out; }
    for (const s of live) pick(s, false);
  } else if (area === 'stale') { for (const s of live) pick(s, false); }
  else if (area === 'all') { for (const s of live) pick(s, !!args.force); }
  else {
    for (const id of area) {
      const s = byId.get(id);
      if (!s) { out.errors.push(`unknown area "${id}" (known: ${statuses.map((x) => x.id).join(', ')})`); out.usage = true; continue; }
      if (s.status === 'PLANNED') { out.errors.push(`area "${id}" is planned (its files do not exist yet): nothing to bake`); out.usage = true; continue; }
      pick(s, !!args.force);
    }
  }
  const order = new Map(statuses.map((s, i) => [s.id, i]));
  out.selected.sort((x, y) => order.get(x.id) - order.get(y.id));
  out.skipped = out.skipped.filter((x) => !out.selected.some((y) => y.id === x.id));
  return out;
}
