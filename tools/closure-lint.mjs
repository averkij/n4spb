// CI lint of the dependency closure (tools/lib/closure.mjs, docs/AREAS.md section 4): the scanner is only as good as its rules, so the rules are checked against the whole of src/.
//   1. every computed import() has a row in DYNAMIC_IMPORTS, and every row still matches its file
//   2. every fetch( / new URL( / new Worker( / importScripts( / eval( / new Function( is a JS edge the scanner follows, or a counted row of RUNTIME_CALLS
//   3. every asset-looking string literal and non-JS new URL is a row of RUNTIME_ASSETS (and every row still matches)
//   4. orphans: every src .js file that is in no closure must be listed in tools/lib/closure-orphans.txt (and every listed file must be one)
//   5. cross-check: every specifier the old regex scanner (tools/lib/exact-case.mjs importsOf) finds is also an edge of the tokenizer
//   6. report (not a gate): a live area whose closure reaches the exclusive files of another area
// node tools/closure-lint.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, closureOf, edgesFor, tokenize, lineAt, ClosureError } from './lib/closure.mjs';
import { DYNAMIC_IMPORTS, RUNTIME_ASSETS, RUNTIME_CALLS } from './lib/closure-rules.mjs';
import { importsOf } from './lib/exact-case.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const problems = [], notes = [];
const ctx = createContext(root);
const jsFiles = ctx.list().filter((f) => /\.m?js$/.test(f) && (f.startsWith('src/') || f.startsWith('vendor/')));
const srcFiles = jsFiles.filter((f) => f.startsWith('src/'));

// ---- 1 + 3: computed imports and asset literals, in EVERY file of src/ and vendor/ (not only the files of a closure)
const hitsDyn = new Set(), hitsAsset = new Set();
for (const f of jsFiles) {
  const src = ctx.text(f);
  for (const e of edgesFor(ctx, f)) {
    if (e.kind === 'template' || e.kind === 'nonliteral') {
      if (DYNAMIC_IMPORTS[f] && DYNAMIC_IMPORTS[f][e.expr]) hitsDyn.add(`${f} ${e.expr}`);
      else problems.push(`${f}:${lineAt(src, e.pos)}: computed import(${e.expr}) has no row in DYNAMIC_IMPORTS (tools/lib/closure-rules.mjs)`);
    } else if (e.kind === 'asset' || (e.kind === 'url' && !/\.m?js$/.test(e.spec.replace(/[?#].*$/, '')))) {
      if (RUNTIME_ASSETS[f] && RUNTIME_ASSETS[f][e.spec]) hitsAsset.add(`${f} ${e.spec}`);
      else problems.push(`${f}:${lineAt(src, e.pos)}: the literal ${e.spec} names a non-script file and has no row in RUNTIME_ASSETS (tools/lib/closure-rules.mjs)`);
    }
  }
}
for (const [f, rows] of Object.entries(DYNAMIC_IMPORTS)) for (const expr of Object.keys(rows)) if (!hitsDyn.has(`${f} ${expr}`)) problems.push(`DYNAMIC_IMPORTS row ${f} ${expr}: ${ctx.has(f) ? 'the expression is gone from the file' : 'the file does not exist'}`);
for (const [f, rows] of Object.entries(RUNTIME_ASSETS)) for (const lit of Object.keys(rows)) if (!hitsAsset.has(`${f} ${lit}`)) problems.push(`RUNTIME_ASSETS row ${f} ${lit}: ${ctx.has(f) ? 'the literal is gone from the file' : 'the file does not exist'}`);
for (const [f, rows] of Object.entries(DYNAMIC_IMPORTS)) for (const [expr, r] of Object.entries(rows)) {
  if (r.rule === 'dir' || r.rule === 'glob') { if (!ctx.list().some((p) => p.startsWith(r.dir.replace(/\/*$/, '/')) && /\.m?js$/.test(p))) problems.push(`DYNAMIC_IMPORTS row ${f} ${expr}: the directory ${r.dir} has no .js file`); }
}
for (const [f, rows] of Object.entries(RUNTIME_ASSETS)) for (const [lit, r] of Object.entries(rows)) if (r.path && !ctx.has(r.path)) problems.push(`RUNTIME_ASSETS row ${f} ${lit}: the file ${r.path} does not exist`);

// ---- 2: calls that load something
const CALLS = ['fetch', 'new URL', 'new Worker', 'importScripts', 'eval', 'new Function'];
const counted = new Map();
for (const f of srcFiles) {
  const src = ctx.text(f);
  if (!/\b(fetch|URL|Worker|importScripts|eval|Function)\b/.test(src)) continue;          // (a data file of numbers is not tokenized)
  const T = tokenize(src);
  for (let k = 0; k < T.length; k++) {
    const t = T[k]; if (t.t !== 'id') continue;
    let call = null, at = k;
    if (t.v === 'fetch' && T[k + 1] && T[k + 1].v === '(' && !(T[k - 1] && T[k - 1].v === 'function')) call = 'fetch(';
    else if (t.v === 'importScripts' && T[k + 1] && T[k + 1].v === '(') call = 'importScripts(';
    else if (t.v === 'eval' && T[k + 1] && T[k + 1].v === '(' && !(T[k - 1] && T[k - 1].v === '.')) call = 'eval(';
    else if (t.v === 'new' && T[k + 1] && T[k + 2] && T[k + 2].v === '(') {
      if (T[k + 1].v === 'URL') call = 'new URL('; else if (T[k + 1].v === 'Worker') call = 'new Worker('; else if (T[k + 1].v === 'Function') call = 'new Function(';
    }
    if (!call) continue;
    // followed JS edges: new URL('lit.js', import.meta.url), new Worker('lit.js'), new Worker(new URL('lit.js', import.meta.url)), importScripts('lit.js')
    const a = call === 'new URL(' || call === 'new Worker(' ? T[k + 3] : T[k + 2];
    const lit = (x) => x && x.t === 'str' && !x.tpl && /\.m?js([?#].*)?$/.test(x.v);
    if (call === 'new URL(' && lit(a) && T[k + 4] && T[k + 4].v === ',' && T[k + 5] && T[k + 5].v === 'import') continue;
    if ((call === 'new Worker(' || call === 'importScripts(') && lit(a)) continue;
    if (call === 'new Worker(' && a && a.v === 'new' && T[k + 4] && T[k + 4].v === 'URL' && lit(T[k + 6]) && T[k + 7] && T[k + 7].v === ',' && T[k + 8] && T[k + 8].v === 'import') continue;
    // a new URL(lit) of a non-JS literal is covered by its RUNTIME_ASSETS row (check 3)
    if (call === 'new URL(' && a && a.t === 'str' && !a.tpl && RUNTIME_ASSETS[f] && RUNTIME_ASSETS[f][a.v]) continue;
    const key = `${f} ${call}`; counted.set(key, (counted.get(key) || 0) + 1);
    void at;
  }
}
for (const [key, n] of counted) {
  const sp = key.indexOf(' '), f = key.slice(0, sp), call = key.slice(sp + 1), row = RUNTIME_CALLS[f] && RUNTIME_CALLS[f][call];
  if (!row) problems.push(`${f}: ${n} x ${call} is neither a followed edge nor a row of RUNTIME_CALLS (tools/lib/closure-rules.mjs): read what it loads and classify it`);
  else if (row.count !== n) problems.push(`${f}: ${n} x ${call} but RUNTIME_CALLS says ${row.count}: a new call appeared (or one went): read it and update the row`);
}
for (const [f, rows] of Object.entries(RUNTIME_CALLS)) for (const call of Object.keys(rows)) if (!counted.has(`${f} ${call}`)) problems.push(`RUNTIME_CALLS row ${f} ${call}: no such call in the file any more`);

// ---- 4 + 6: closures of every area of the registry (live and parked)
const closures = {};
for (const row of ctx.rows()) {
  if (row.status === 'planned') continue;
  try { closures[row.id] = closureOf(root, row.id, ctx); } catch (e) { if (e instanceof ClosureError) problems.push(`closure of ${row.id}: ${e.message}`); else throw e; }
}
const inAny = new Set(); for (const c of Object.values(closures)) for (const f of c.seen) inAny.add(f);
const orphans = srcFiles.filter((f) => !inAny.has(f));
const listed = fs.readFileSync(path.join(root, 'tools/lib/closure-orphans.txt'), 'utf8').split('\n').map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
if (Object.keys(closures).length === ctx.rows().filter((r) => r.status !== 'planned').length) {
  for (const f of orphans) if (!listed.includes(f)) problems.push(`${f}: imported by no area (an orphan) and not listed in tools/lib/closure-orphans.txt - if it is meant to be loaded, the scanner has a blind spot; otherwise list it`);
  for (const f of listed) { if (!ctx.has(f)) problems.push(`closure-orphans.txt lists ${f}, which does not exist`); else if (inAny.has(f)) problems.push(`closure-orphans.txt lists ${f}, but it is in a closure now: remove the line`); }
}
const live = ctx.rows().filter((r) => !r.parked && r.status !== 'planned').map((r) => r.id);
for (const id of live) {
  if (!closures[id]) continue;
  for (const other of ctx.rows().map((r) => r.id)) {
    if (other === id) continue;
    const pre = `src/areas/${other}/`, hit = [...closures[id].seen].filter((f) => f.startsWith(pre));
    if (hit.length) notes.push(`${id} reaches ${hit.length} file(s) of src/areas/${other}/ (${hit.slice(0, 3).join(', ')}${hit.length > 3 ? ', ...' : ''})`);
  }
}

// ---- 5: the regex scanner must not see an import the tokenizer misses
let regexChecked = 0;
const SPEC_LIKE = /^[\w@./$\-{}]+$/;        // a string that only looks like `from "..."` (prose in a data file) is no specifier
for (const f of srcFiles) {
  const src = ctx.text(f), tokenSpecs = new Set(edgesFor(ctx, f).map((e) => e.spec));
  for (const r of importsOf(src)) { if (!SPEC_LIKE.test(r.spec)) continue; regexChecked++; if (!tokenSpecs.has(r.spec)) problems.push(`${f}:${r.line}: the regex scanner finds ${r.kind} import '${r.spec}', the tokenizer does not (a tokenizer blind spot, or a string that only looks like an import)`); }
}

for (const n of notes) console.log('  note: ' + n);
if (problems.length) { for (const p of problems) console.error('  FAIL ' + p); console.error(`closure-lint: ${problems.length} problem(s)`); process.exit(1); }
console.log(`closure-lint: ${srcFiles.length} src files, ${Object.keys(closures).length} closures (${Object.entries(closures).map(([id, c]) => `${id} ${c.seen.size}`).join(', ')}), ${orphans.length} orphans listed, ${regexChecked} regex imports cross-checked`);
console.log('RESULT: OK');
