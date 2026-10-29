// The answer of the development / test servers to GET /__baked_revision (docs/AREAS.md section 4): the bake revision of THE AREA OF THE PAGE that asks, computed from the live tree.
// The loader (src/core/baked-world.js openBakedWorld) fetches it next to the manifest and compares the manifest's revision with it AND with the generated constant of the page; a server without the
// endpoint answers 404 and the loader falls back to the generated constant, which is safe (the committed map). So every server that serves the repository calls handleBakedRevision() and nothing else:
//   if (handleBakedRevision(req, res, root)) return;                  // tools/dev-servers-lint.mjs fails when a server keeps a handler of its own
//
//   area of the page   the Referer pathname: '/' and '/index.html' -> the registry row whose page is index.html, '/<name>.html' -> the row with that page (a server under a base path passes opts.base,
//                      or just serves the page from a sub-directory: only the last path segment is looked at). No Referer or an unknown page -> 404.
//   liveRevision       revisionOf() of the area, cached per (root, area) by a STAT SIGNATURE (mtimeMs + size) of the files the closure reached (and of the folders the whole-folder rules read, the
//                      lock file and the registry): a request stats ~700 files and re-walks only when one differs. Never a re-walk per request.
//   a closure that cannot be scanned (a missing import while somebody edits ...) is answered with revision 'unscannable' (HTTP 200): fail closed, the page takes the stale-bake path, never the
//                      baked path of a tree nobody could verify.
import fs from 'node:fs';
import path from 'node:path';
import { createRevisionContext, areaRevision } from '../baked-revision.mjs';

export const ENDPOINT = '/__baked_revision';
/** counters for the tests: how many closure walks were done, how many requests were served from the signature cache */
export const stats = { walks: 0, hits: 0 };

const cache = new Map();            // root -> { reg: {sig, pages:Map(page -> id)}, areas: Map(id -> { dep, sig, result }) }
const sigOfFile = (abs) => { try { const s = fs.statSync(abs); return `${s.mtimeMs}:${s.size}`; } catch (e) { return 'absent'; } };
const rootCache = (root) => { const k = path.resolve(root); let c = cache.get(k); if (!c) cache.set(k, c = { reg: null, areas: new Map() }); return c; };
/** forget everything (tests) */
export function resetDevRevisionCache() { cache.clear(); stats.walks = 0; stats.hits = 0; }

/** Map(page -> area id) of the registry rows of the tree under `root` (cached by the stat signature of src/areas/registry.js) */
export function pagesOf(root) {
  const c = rootCache(root), sig = sigOfFile(path.join(root, 'src/areas/registry.js'));
  if (c.reg && c.reg.sig === sig) return c.reg.pages;
  const pages = new Map();
  for (const row of createRevisionContext(root).rows()) if (row.page && row.status !== 'planned') pages.set(row.page, row.id);
  c.reg = { sig, pages };
  return pages;
}

/** the area whose page is the pathname `pathname` of a server (optionally under `base`), or null */
export function areaOfPath(root, pathname, base = '') {
  let p = String(pathname || '');
  try { p = decodeURIComponent(p); } catch (e) { return null; }
  if (base && (p === base || p.startsWith(base + '/'))) p = p.slice(base.length) || '/';
  const name = p.endsWith('/') ? 'index.html' : p.slice(p.lastIndexOf('/') + 1);
  if (!name) return null;
  return pagesOf(root).get(name) || null;
}
/** the area of the page that sent the request (its Referer header), or null */
export function areaOfReferer(root, referer, base = '') {
  if (!referer) return null;
  let u; try { u = new URL(String(referer)); } catch (e) { return null; }
  return areaOfPath(root, u.pathname, base);
}

/** the files whose stat decides whether the cached revision is still the revision of the tree, and the folders the whole-folder rules read (a new file there enters the closure without an edit of any known file) */
function dependenciesOf(closure, ctx) {
  const files = [...new Set([...closure.seen, 'package-lock.json', 'src/areas/registry.js'])];
  const dirs = new Set();
  for (const list of closure.edges.values()) for (const e of list) if (e.kind === 'rule') dirs.add(path.posix.dirname(e.target));
  for (const [file, rows] of Object.entries(ctx.rules.DYNAMIC_IMPORTS)) if (closure.seen.has(file)) for (const r of Object.values(rows)) if (r.dir) dirs.add(r.dir.replace(/\/+$/, ''));
  return { files, dirs: [...dirs] };
}
const signatureOf = (root, dep) => dep.files.map((f) => sigOfFile(path.join(root, f))).join('|') + '#' + dep.dirs.map((d) => sigOfFile(path.join(root, d))).join('|');

/**
 * { revision, files, bytes } of one area on the live tree. Cached by the stat signature; throws when the closure cannot be scanned (a ClosureError for a tree that does not hold together).
 * The signature is taken after the read: an edit in between is caught by the next request (the cached signature then differs from the file).
 */
export function liveStatus(root, id) {
  const c = rootCache(root), hit = c.areas.get(id);
  if (hit && hit.sig === signatureOf(root, hit.dep)) { stats.hits++; return hit.result; }
  stats.walks++;
  c.areas.delete(id);
  const ctx = createRevisionContext(root);
  const closure = ctx.scanner.closureOf(root, id, ctx), res = areaRevision(root, id, ctx), dep = dependenciesOf(closure, ctx);
  const entry = { dep, sig: signatureOf(root, dep), result: { revision: res.revision, files: res.files, bytes: res.bytes } };
  c.areas.set(id, entry);
  return entry.result;
}
/** the revision string of the live tree for an area (see liveStatus) */
export function liveRevision(root, id) { return liveStatus(root, id).revision; }

/**
 * Answer GET <base>/__baked_revision. Returns true when the request was handled (the caller returns), false otherwise.
 *   200 { revision, area }                 the live revision of the area of the page (Referer)
 *   200 { revision: 'unscannable', error } the closure of that area cannot be scanned right now
 *   404                                    no Referer, or a page that is not a registry page: the loader uses the generated constant
 */
export function handleBakedRevision(req, res, root, opts = {}) {
  const base = opts.base || '';
  let pathname; try { pathname = new URL(req.url, 'http://x').pathname; } catch (e) { return false; }
  if (pathname !== base + ENDPOINT) return false;
  let id = null;
  try { id = areaOfReferer(root, req.headers && (req.headers.referer || req.headers.referrer), base); } catch (e) { id = null; }
  if (!id) { res.writeHead(404, { 'Cache-Control': 'no-store' }); res.end(); return true; }
  let body;
  try { body = { revision: liveRevision(root, id), area: id }; }
  catch (e) { body = { revision: 'unscannable', area: id, error: String((e && e.message) || e).slice(0, 400) }; }      // a dev server never dies of a half-edited tree
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body));
  return true;
}
