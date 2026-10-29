// The dependency closure of an area: every file a page of the area can load from the repository, computed from the committed tree (docs/AREAS.md section 4, "bake revision").
// Promoted from the scanner prototype of the design round. A real tokenizer (strings, nested templates, comments, regex literals; NOT regex over lines) finds the edges:
//   import ... from, export ... from, import 'x', import('lit'), import(`tpl`) / import(expr) through the rules table, new URL('lit', import.meta.url), new Worker('lit'), importScripts('lit'),
//   and every asset-looking string literal (rows of RUNTIME_ASSETS). Entries: the page of the area, its module scripts, src/main.js and src/world/<n>.js of the area's MODULES.
// The page's import map is applied to every resolved URL. FAIL CLOSED: a missing target, a bare or absolute specifier, an unclassified computed import(), an unclassified asset literal and
// a rule row that matches nothing are errors, never "not hashed". Node only; needs no node_modules.
import fs from 'node:fs';
import path from 'node:path';
import { RUNTIME_ONLY, EXCLUDED, DYNAMIC_IMPORTS, RUNTIME_ASSETS } from './closure-rules.mjs';
import { modulesFromSource } from '../modules-list.mjs';

export { RUNTIME_ONLY, EXCLUDED };
const P = path.posix;

export class ClosureError extends Error { constructor(kind, msg) { super(`${kind}: ${msg}`); this.name = 'ClosureError'; this.kind = kind; } }

// ------------------------------------------------------------------------------------------------ tokenizer
const KW_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'in', 'of', 'instanceof', 'new', 'delete', 'void', 'throw', 'else', 'do', 'yield', 'await']);
/** tokens { t: 'str' | 're' | 'id' | 'num' | 'p', v, pos, tpl } of a JS source (comments dropped) */
const NUM = { t: 'num', pos: -1 }, PUNCT = Object.create(null);
export function tokenize(src) {
  const toks = []; let i = 0; const n = src.length; let prev = null;
  const push = (t) => { toks.push(t); prev = t; };
  const regexAllowed = () => !prev || (prev.t === 'p' && !(prev.v === ')' || prev.v === ']' || prev.v === '}')) || (prev.t === 'id' && KW_BEFORE_REGEX.has(prev.v));
  const readTemplate = (start) => { // at the opening backtick; returns the raw content (the ${...} kept verbatim, nested templates handled)
    let j = start + 1, raw = '';
    while (j < n) {
      const c = src[j];
      if (c === '\\') { raw += c + src[j + 1]; j += 2; continue; }
      if (c === '`') { j++; break; }
      if (c === '$' && src[j + 1] === '{') {
        let depth = 1; raw += '${'; j += 2;
        while (j < n && depth > 0) {
          const d = src[j];
          if (d === '{') depth++; else if (d === '}') depth--;
          else if (d === "'" || d === '"') { const q = d; raw += d; j++; while (j < n && src[j] !== q) { if (src[j] === '\\') raw += src[j++]; raw += src[j++]; } }
          else if (d === '`') { const r = readTemplate(j); raw += '`' + r.raw + '`'; j = r.end; continue; }
          raw += d; j++;
        }
        continue;
      }
      raw += c; j++;
    }
    return { raw, end: j };
  };
  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === "'" || c === '"') { let j = i + 1, v = ''; while (j < n && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') { v += src[j + 1]; j += 2; continue; } v += src[j++]; } push({ t: 'str', v, pos: i }); i = j + 1; continue; }
    if (c === '`') { const r = readTemplate(i); push({ t: 'str', v: r.raw, tpl: r.raw.includes('${'), pos: i, bt: true }); i = r.end; continue; }
    if (c === '/' && regexAllowed()) {
      let j = i + 1, cls = false; while (j < n) { const d = src[j]; if (d === '\\') { j += 2; continue; } if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break; else if (d === '\n') break; j++; }
      j++; while (j < n && /[a-z]/i.test(src[j])) j++; push({ t: 're', pos: i }); i = j; continue;
    }
    if (/[A-Za-z_$]/.test(c)) { let j = i + 1; while (j < n && /[\w$]/.test(src[j])) j++; push({ t: 'id', v: src.slice(i, j), pos: i }); i = j; continue; }
    if (/[0-9]/.test(c)) { let j = i + 1; while (j < n && /[\w.]/.test(src[j])) j++; push(NUM); i = j; continue; }
    push(c === '(' || c === ')' ? { t: 'p', v: c, pos: i } : (PUNCT[c] || (PUNCT[c] = { t: 'p', v: c, pos: -1 }))); i++;      // (only the parentheses need a position: exprOf; the rest is interned - a data file has millions of them)
  }
  return toks;
}
export const lineAt = (src, pos) => src.slice(0, pos).split('\n').length;

const ASSET_EXT = 'png|jpe?g|gif|webp|svg|ico|json|wasm|glb|gltf|bin|ogg|mp3|wav|gz|webmanifest|woff2?|ttf|otf|css|html?|txt|csv';
const ASSET_RE = new RegExp(`\\.(${ASSET_EXT})(\\?[^\\s]*)?$`, 'i');
/** a text without any of these words has no edge of any kind (a data file of numbers): it is not tokenized (the token objects of a 5 MB data file cost seconds of GC) */
const EDGE_WORDS = new RegExp(`\\bimport\\b|\\bfrom\\b|\\bURL\\b|\\bWorker\\b|\\.(${ASSET_EXT})\\b|assets/`, 'i');
/** a string literal that names a loadable non-JS file: one word (no space) that ends in an asset extension or contains assets/ */
export const looksLikeAsset = (v) => v.length > 0 && (v.includes('assets/') || (v.includes('.') && ASSET_RE.test(v))) && !/\s/.test(v);
const isJsPath = (p) => /\.(m?js)$/.test(p);

// ------------------------------------------------------------------------------------------------ the scanner (mutant flags: all off by default, tools/closure-mutation-test.mjs)
const MUTANTS = ['ignoreTemplates', 'ignoreExportFrom', 'ignorePageRemap', 'skipLargeFiles', 'narrowGlobs', 'dropDynamicTable', 'forgetPage', 'hashRuntimeOnly', 'keepQuery'];
export function makeScanner(opts = {}) {
  for (const k of Object.keys(opts)) if (!MUTANTS.includes(k)) throw new Error(`makeScanner: unknown option ${k}`);
  const o = { ignoreTemplates: false, ignoreExportFrom: false, ignorePageRemap: false, skipLargeFiles: 0 /* bytes; 0 = off */, narrowGlobs: false, dropDynamicTable: false, forgetPage: false, hashRuntimeOnly: false, keepQuery: false, ...opts };

  /**
   * edges of one source text: { kind, spec, pos, expr?, kw? }
   *   kind 'static' (import/export ... from 'x', import 'x'), 'dynamic' (import('lit'), importScripts('lit')), 'worker' (new Worker('lit'): relative to the page), 'url' (new URL('lit', import.meta.url)),
   *   'template' (import(`..${}..`)) and 'nonliteral' (import(expr)) with `expr` = the argument without whitespace, 'asset' (an asset-looking string literal that is nothing of the above)
   */
  function edgesOf(src) {
    if (o.skipLargeFiles && src.length > o.skipLargeFiles) return [];
    if (!EDGE_WORDS.test(src)) return [];
    const T = tokenize(src), out = [], used = new Set();
    const exprOf = (open) => { // tokens after the '(' at index `open` up to its matching ')': the source text, whitespace removed
      let depth = 1, j = open + 1;
      while (j < T.length && depth > 0) { const x = T[j]; if (x.t === 'p') { if (x.v === '(') depth++; else if (x.v === ')') { depth--; if (!depth) break; } } j++; }
      const end = j < T.length ? T[j].pos : src.length;
      return src.slice(T[open].pos + 1, end).replace(/\s+/g, '');
    };
    for (let k = 0; k < T.length; k++) {
      const t = T[k];
      if (t.t !== 'id') continue;
      if (t.v === 'import') {
        const a = T[k + 1], b = T[k + 2];
        if (a && a.t === 'str') { out.push({ kind: 'static', spec: a.v, pos: t.pos, kw: 'import' }); used.add(k + 1); continue; }                       // import 'x'
        if (a && a.t === 'p' && a.v === '(') {                                                                                                          // import(...)
          const c = T[k + 3];
          if (b && b.t === 'str' && !b.tpl && c && c.t === 'p' && (c.v === ')' || c.v === ',')) { out.push({ kind: 'dynamic', spec: b.v, pos: t.pos }); used.add(k + 2); }
          else if (b && b.t === 'str' && b.tpl && c && c.t === 'p' && (c.v === ')' || c.v === ',')) out.push({ kind: 'template', spec: b.v, pos: t.pos, expr: exprOf(k + 1) });
          else out.push({ kind: 'nonliteral', spec: exprOf(k + 1), pos: t.pos, expr: exprOf(k + 1) });
        }
        continue;
      }
      if (t.v === 'from' && T[k + 1] && T[k + 1].t === 'str' && !T[k + 1].tpl) {
        let j = k - 1, kw = null; while (j >= 0 && k - j < 4000) { const x = T[j]; if (x.t === 'id' && (x.v === 'import' || x.v === 'export')) { kw = x.v; break; } if (x.t === 'p' && x.v === ';') break; j--; }
        if (kw) { used.add(k + 1); if (!(o.ignoreExportFrom && kw === 'export')) out.push({ kind: 'static', spec: T[k + 1].v, pos: t.pos, kw }); }
        continue;
      }
      if (t.v === 'new' && T[k + 1] && T[k + 1].v === 'URL' && T[k + 2] && T[k + 2].v === '(' && T[k + 3] && T[k + 3].t === 'str' && !T[k + 3].tpl) {
        const rest = T.slice(k + 4, k + 10).map((x) => x.v ?? x.t).join('');
        if (/^,import\.meta\.url/.test(rest)) { out.push({ kind: 'url', spec: T[k + 3].v, pos: t.pos }); used.add(k + 3); }
        continue;
      }
      if (t.v === 'new' && T[k + 1] && T[k + 1].v === 'Worker' && T[k + 2] && T[k + 2].v === '(' && T[k + 3] && T[k + 3].t === 'str' && !T[k + 3].tpl) { out.push({ kind: 'worker', spec: T[k + 3].v, pos: t.pos }); used.add(k + 3); continue; }
      if (t.v === 'importScripts' && T[k + 1] && T[k + 1].v === '(' && T[k + 2] && T[k + 2].t === 'str' && !T[k + 2].tpl) { out.push({ kind: 'dynamic', spec: T[k + 2].v, pos: t.pos, kw: 'importScripts' }); used.add(k + 2); }
    }
    for (let k = 0; k < T.length; k++) { const t = T[k]; if (t.t === 'str' && !t.tpl && !used.has(k) && looksLikeAsset(t.v)) out.push({ kind: 'asset', spec: t.v, pos: t.pos }); }
    return out;
  }

  /** the pieces of an HTML page that the closure needs: { importmap, scripts: [{ module, src, text }] } (HTML comments removed first; a commented-out script is no script) */
  function pageOf(html, page) {
    const clean = html.replace(/<!--[\s\S]*?-->/g, '');
    const scripts = [], maps = [];
    for (const m of clean.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const attrs = {}; for (const a of m[1].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4];
      const type = (attrs.type || '').toLowerCase();
      if (type === 'importmap') maps.push(m[2]); else if (type === 'module') scripts.push({ src: attrs.src || null, text: m[2] });
    }
    if (maps.length > 1) throw new ClosureError('ImportMap', `${page} has ${maps.length} import maps`);
    let importmap = { imports: {} };
    if (maps.length) { try { importmap = JSON.parse(maps[0]); } catch (e) { throw new ClosureError('ImportMap', `${page}: the import map is not JSON (${e.message})`); } }
    if (importmap.scopes && Object.keys(importmap.scopes).length) throw new ClosureError('ImportMap', `${page}: import map scopes are not supported by the closure scan`);
    return { importmap, scripts };
  }
  /** the import map as { rel: Map(path -> target path | {external}), bare: Map(spec -> target | {external}) } relative to the page */
  function importMapOf(html, page = 'index.html') {
    const { importmap } = pageOf(html, page), pageDir = P.dirname(page);
    const rel = new Map(), bare = new Map();
    const target = (v) => (/^[a-z][a-z0-9+.-]*:/i.test(v) ? { external: v } : P.normalize(P.join(pageDir, v)));
    for (const [k, v] of Object.entries(importmap.imports || {})) {
      if (/^\.{0,2}\//.test(k)) rel.set(P.normalize(P.join(pageDir, k)) + (k.endsWith('/') ? '/' : ''), typeof v === 'string' ? target(v) : (() => { throw new ClosureError('ImportMap', `${page}: ${k} has a non-string value`); })());
      else bare.set(k, target(v));
    }
    return { rel, bare };
  }

  const edgeCaches = new WeakMap();
  const edgesFor = (ctx, f) => { let m = edgeCaches.get(ctx); if (!m) edgeCaches.set(ctx, m = new Map()); let e = m.get(f); if (!e) m.set(f, e = edgesOf(ctx.text(f))); return e; };

  /** closure of one area: { area, page, seen:Set, hashed:[sorted], edges:Map(file -> [{kind,spec,target}]), assets:[{from,literal,path,hash}], external:Set, entries:[], modules:[] } */
  function closureOf(root, areaId, ctx) {
    ctx = ctx || createContext(root);
    const row = ctx.row(areaId), page = row.page;
    if (!ctx.has(page)) throw new ClosureError('Missing', `page ${page} of the area ${areaId} does not exist`);
    const pageDir = P.dirname(page);
    const html = ctx.text(page), pg = pageOf(html, page), map = importMapOf(html, page);
    const seen = new Set(), stack = [], edges = new Map(), assets = [], external = new Set(), entries = [];
    const modulesFile = areaId === 'strip' ? 'src/main.js' : `src/areas/${areaId}/area.js`;
    if (!ctx.has(modulesFile)) throw new ClosureError('Missing', `module list ${modulesFile} of the area ${areaId} does not exist`);
    const modules = modulesFromSource(ctx.text(modulesFile), modulesFile, 1);
    if (!modules.length) throw new ClosureError('NoModules', `MODULES of ${modulesFile} is empty`);

    const missing = (target, importer, why) => {
      const hint = ctx.realSpelling(target);
      return new ClosureError('Missing', `${target} does not exist${hint && hint !== target ? ` with this spelling (the file is ${hint}: the host is case sensitive)` : ''} - imported by ${importer} (${why}; area ${areaId})`);
    };
    const applyMap = (target, importer) => {
      if (o.ignorePageRemap) return target;
      let m = map.rel.get(target);
      if (m === undefined) for (const [k, v] of map.rel) if (k.endsWith('/') && target.startsWith(k)) { m = typeof v === 'string' ? v + target.slice(k.length) : v; break; }
      if (m === undefined) return target;
      if (typeof m !== 'string') { external.add(m.external); return null; }
      return m;
    };
    /** resolve a specifier written in `from` to a repo path (or null: external) */
    const resolve = (spec, from, how, base = P.dirname(from)) => {
      let s = spec; if (!o.keepQuery) s = s.replace(/[?#].*$/, '');
      if (s.startsWith('./') || s.startsWith('../')) {
        const t = P.normalize(P.join(base, s));
        if (t.startsWith('../') || t === '..') throw new ClosureError('Escape', `${spec} leaves the repository (imported by ${from}; area ${areaId})`);
        return applyMap(t, from);
      }
      if (s.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(s)) throw new ClosureError('Unsupported', `absolute specifier ${spec} in ${from} (${how}; area ${areaId}): the closure scan resolves relative paths and import-map keys only`);
      // bare: the import map
      let m = map.bare.get(s);
      if (m === undefined) for (const [k, v] of map.bare) if (k.endsWith('/') && s.startsWith(k)) { m = typeof v === 'string' ? v + s.slice(k.length) : { external: v.external + s.slice(k.length) }; break; }
      if (m === undefined) throw new ClosureError('Unsupported', `bare specifier ${spec} in ${from} (${how}; area ${areaId}) is not in the import map of ${page}`);
      if (typeof m !== 'string') { external.add(m.external); return null; }
      return m;
    };
    const add = (target, importer, how) => {
      if (target === null) return;
      if (!ctx.has(target)) throw missing(target, importer, how);
      if (seen.has(target)) return;
      seen.add(target); if (isJsPath(target)) stack.push(target);
    };
    const edgeList = (f) => { let e = edges.get(f); if (!e) { e = []; edges.set(f, e); } return e; };

    // ---- entries
    if (!o.forgetPage) seen.add(page);
    let moduleScripts = 0;
    for (const s of pg.scripts) {
      moduleScripts++;
      if (s.src) { const t = resolve(s.src, page, 'module script', pageDir); entries.push(t); add(t, page, 'module script'); }
      else for (const e of edgesOf(s.text)) {
        if (e.kind === 'static' || e.kind === 'dynamic') { const t = resolve(e.spec, page, 'inline module script', pageDir); entries.push(t); add(t, page, 'inline module script'); }
        else if (e.kind === 'template' || e.kind === 'nonliteral') throw new ClosureError('Unclassified', `computed import() in an inline module script of ${page}`);
      }
    }
    if (!moduleScripts) throw new ClosureError('NoModuleScript', `${page} (area ${areaId}) has no <script type="module">`);
    entries.push('src/main.js'); add('src/main.js', '<entry>', 'entry');
    for (const m of modules) { const t = `src/world/${m}.js`; entries.push(t); add(t, modulesFile, 'MODULES'); }

    // ---- the walk
    const rules = ctx.rules, dyn = rules.DYNAMIC_IMPORTS, assetTable = rules.RUNTIME_ASSETS;
    const ruleFiles = (rule, file) => {
      if (rule.rule === 'area-modules') return modules.map((m) => `src/world/${m}.js`);
      if (rule.rule === 'dir') { const d = rule.dir.replace(/\/*$/, '/'); return ctx.list().filter((p) => p.startsWith(d) && isJsPath(p) && (rule.recursive !== false || !p.slice(d.length).includes('/'))); }
      if (rule.rule === 'glob') {
        const d = rule.dir.replace(/\/*$/, '/'), re = new RegExp('^' + rule.pattern.split('*').map((x) => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
        return ctx.list().filter((p) => p.startsWith(d) && !p.slice(d.length).includes('/') && re.test(p.slice(d.length)));
      }
      throw new ClosureError('Rule', `unknown rule ${rule.rule} (${file})`);
    };
    const mutated = o.dropDynamicTable || o.ignoreTemplates;       // a mutant skips the consistency checks of the tables: it must be caught by what it changes, not by them
    while (stack.length) {
      const f = stack.pop(), src = ctx.text(f), list = edgeList(f);
      const rulesOfFile = dyn[f] || {}, hit = new Set(), assetRows = assetTable[f] || {}, assetHit = new Set();
      let strings = null;
      for (const e of edgesFor(ctx, f)) {
        if (e.kind === 'template' && o.ignoreTemplates) continue;
        if (e.kind === 'template' || e.kind === 'nonliteral') {
          const r = o.dropDynamicTable ? null : rulesOfFile[e.expr];
          if (r) hit.add(e.expr);
          if (!r) { if (o.dropDynamicTable) continue; throw new ClosureError('Unclassified', `computed import(${e.expr}) at ${f}:${lineAt(src, e.pos)} has no row in DYNAMIC_IMPORTS (tools/lib/closure-rules.mjs; area ${areaId}): list the directory it can load from`); }
          let files = ruleFiles(r, f);
          if (o.narrowGlobs && r.rule !== 'area-modules') { strings = strings || new Set(tokenize(src).filter((t) => t.t === 'str').map((t) => t.v)); files = files.filter((x) => strings.has(P.basename(x).replace(/\.m?js$/, ''))); }
          if (!files.length && r.rule !== 'area-modules') throw new ClosureError('Rule', `the DYNAMIC_IMPORTS row ${f} ${e.expr} matches no file`);
          for (const x of files) { if (x === f) continue; list.push({ kind: 'rule', spec: e.expr, target: x }); add(x, f, `rule ${r.rule} for import(${e.expr})`); }
          continue;
        }
        if (e.kind === 'asset') { handleAsset(f, e.spec, assetRows, assetHit, list); continue; }
        if (e.kind === 'url') {
          if (isJsPath(e.spec.replace(/[?#].*$/, ''))) { const t = resolve(e.spec, f, 'new URL(..., import.meta.url)'); list.push({ kind: 'url', spec: e.spec, target: t }); add(t, f, 'new URL'); }
          else handleAsset(f, e.spec, assetRows, assetHit, list, true);
          continue;
        }
        const base = e.kind === 'worker' ? pageDir : P.dirname(f);
        const t = resolve(e.spec, f, e.kind, base);
        if (t !== null && !isJsPath(t) && !/\.(json|css)$/.test(t)) throw new ClosureError('Unsupported', `${f} imports ${e.spec}, which is not a script (${t}); classify it in RUNTIME_ASSETS`);
        list.push({ kind: e.kind, spec: e.spec, target: t }); add(t, f, e.kind);
      }
      if (!mutated) {
        for (const expr of Object.keys(rulesOfFile)) if (!hit.has(expr)) throw new ClosureError('StaleRule', `DYNAMIC_IMPORTS row ${f} ${expr} matches nothing in the file (tools/lib/closure-rules.mjs)`);
        for (const lit of Object.keys(assetRows)) if (!assetHit.has(lit)) throw new ClosureError('StaleRule', `RUNTIME_ASSETS row ${f} ${lit} matches nothing in the file (tools/lib/closure-rules.mjs)`);
      }
    }
    function handleAsset(f, literal, assetRows, assetHit, list, isUrl) {
      const row = assetRows[literal];
      if (!row) throw new ClosureError('Unclassified', `${f} names ${literal}, a non-script file${isUrl ? ' (new URL)' : ''}, without a row in RUNTIME_ASSETS (tools/lib/closure-rules.mjs; area ${areaId})`);
      assetHit.add(literal);
      assets.push({ from: f, literal, path: row.path, hash: !!row.hash });
      if (row.path && row.hash) { list.push({ kind: 'asset', spec: literal, target: row.path }); add(row.path, f, `asset ${literal}`); }
    }

    // ---- the hashed set
    let hashed = [...seen];
    if (!o.hashRuntimeOnly) hashed = hashed.filter((x) => !RUNTIME_ONLY.includes(x));
    hashed = hashed.filter((x) => !EXCLUDED.includes(x));
    if (o.forgetPage) hashed = hashed.filter((x) => x !== page);
    hashed.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return { area: areaId, page, seen, hashed, edges, assets, external, entries, modules };
  }
  return { options: o, tokenize, edgesOf, edgesFor, pageOf, importMapOf, closureOf };
}

// ------------------------------------------------------------------------------------------------ the tree the scan reads
/**
 * A snapshot context of one tree: the file list (exact spelling), cached reads, the registry rows. `root` is the repository root.
 *   overlay  { 'rel/path': string | Buffer | null }  in-memory replacements (null = the file is absent); tests need no tree copy
 *   virtual  true: the tree is the overlay only (no disk at all)
 *   read     (rel) => string | Buffer | null | undefined   called first for every read; undefined falls through to the overlay and the disk
 *   areas    registry rows { id: { id, page, parked } } or an array of rows (default: src/areas/registry.js of the tree)
 *   rules    { DYNAMIC_IMPORTS, RUNTIME_ASSETS } (default: tools/lib/closure-rules.mjs)
 */
export function createContext(root, opts = {}) {
  const { overlay = {}, virtual = false, read: hook = null } = opts;
  const rules = opts.rules || { DYNAMIC_IMPORTS, RUNTIME_ASSETS };
  let listing = null, lower = null; const bytesCache = new Map(), textCache = new Map(); let rowsCache = null;
  const walk = (abs, rel, out) => {
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { if (r === 'assets/baked') continue; walk(path.join(abs, e.name), r, out); } else out.push(r);
    }
  };
  const build = () => {
    const set = new Set();
    if (!virtual) {
      const out = [];
      for (const e of fs.readdirSync(root, { withFileTypes: true })) if (e.isFile()) out.push(e.name);
      for (const d of ['src', 'vendor', 'assets']) if (fs.existsSync(path.join(root, d))) walk(path.join(root, d), d, out);
      for (const r of out) set.add(r);
    }
    for (const [r, v] of Object.entries(overlay)) { if (v === null) set.delete(r); else set.add(r); }
    listing = [...set].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)); lower = new Map(listing.map((r) => [r.toLowerCase(), r]));
    return set;
  };
  let fileSet = null;
  const files = () => fileSet || (fileSet = build());
  const ctx = {
    root, rules, opts,
    /** every file of the tree (src, vendor, assets without assets/baked, the root files), sorted by plain string order */
    list() { files(); return listing; },
    has(rel) { return files().has(rel); },
    realSpelling(rel) { files(); return lower.get(rel.toLowerCase()) || null; },
    /** raw bytes of a file (Buffer); throws when it is absent */
    bytes(rel) {
      let b = bytesCache.get(rel); if (b) return b;
      let v = hook ? hook(rel) : undefined;
      if (v === undefined && Object.prototype.hasOwnProperty.call(overlay, rel)) v = overlay[rel];
      if (v === undefined) { if (virtual || !files().has(rel)) throw new ClosureError('Missing', `${rel} does not exist`); v = fs.readFileSync(path.join(root, rel)); }
      if (v === null) throw new ClosureError('Missing', `${rel} does not exist`);
      b = Buffer.isBuffer(v) ? v : Buffer.from(String(v), 'utf8'); bytesCache.set(rel, b); return b;
    },
    text(rel) { let t = textCache.get(rel); if (t === undefined) textCache.set(rel, t = ctx.bytes(rel).toString('utf8')); return t; },
    /** registry rows in registry order */
    rows() {
      if (rowsCache) return rowsCache;
      let reg;
      if (opts.areas) reg = Array.isArray(opts.areas) ? Object.fromEntries(opts.areas.map((r) => [r.id, r])) : opts.areas;
      else { const text = ctx.text('src/areas/registry.js'); reg = new Function(text.replace(/^export\s+/gm, '') + '\nreturn REGISTRY;')(); }
      return (rowsCache = Object.values(reg));
    },
    row(id) { const r = ctx.rows().find((x) => x.id === id); if (!r) throw new ClosureError('UnknownArea', `area ${id} is not in the registry`); if (!r.page) throw new ClosureError('UnknownArea', `registry row ${id} has no page`); return r; },
  };
  return ctx;
}

/** the real scanner (no mutant flag) */
export const scanner = makeScanner();
export const { edgesOf, edgesFor, importMapOf, pageOf } = scanner;
/** closureOf(root, areaId, ctx?) -> { area, page, seen:Set, hashed:[sorted POSIX paths], edges, assets, external, entries, modules } */
export const closureOf = scanner.closureOf;
