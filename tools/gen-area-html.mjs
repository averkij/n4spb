// Generates the HTML page of an area (index.html, smolny.html, north.html ...) from strip.html (the TEMPLATE: the page of the parked strip, the source of every generated page) and the area's text data
// src/areas/<id>/page.json (docs/AREAS.md section 2, 5 and 13). Since the world-map re-cut (docs/AREAS.md section 13) index.html is itself a generated page: the one of Palace-Liteyny, the start page of the app.
//   node tools/gen-area-html.mjs [--area <id>] [--check] [--force-planned] [--root <dir>]
//     no --area     every real area except the strip (rows of the registry that are not 'planned'; parked areas too: their pages stay current); none exist yet = nothing to do
//     --check       write nothing; exit 1 when a page on disk differs from the generated one (CI: tools run in the 'verify' job) or does not exist
//     --force-planned   also generate the page of a 'planned' registry row (the files of the area do not exist yet; the generated page then fails at its first import)
//     --root <dir>  a site root other than this repository (tests: a throw-away copy of strip.html + src/areas/<id>/page.json)
// strip.html is the SOURCE and is never edited by this tool: the page is strip.html with targeted replacements of stable anchors (every anchor must match exactly once, otherwise the tool
// stops: a strip.html edit that moves an anchor must be followed here). The replacements:
//   <html data-area>, <title>, apple-mobile-web-app-title, the canvas aria-label, the intro kicker / title, the phone "heavy scene" note (the area's MB from the registry; it also gets data-card-title, the
//   title of the phone's pre-start card: the intro kicker up to its first colon + " · Before you start"), the #places tooltip,
//   the two keyboard-help lines (#help .walk / .air), the import map (the registry's remap entries first, the 'three' entries stay), and the facts script (SIGHTS + FACTS).
// Everything else (every id, class, script, style) is strip.html byte for byte, so the engine finds all it needs.
//
// src/areas/<id>/page.json (SCHEMA 1; Cyrillic text only through an editor/Write tool, never through a shell):
// {
//   "schema": 1,
//   "title":       "<title> of the tab",
//   "appTitle":    "apple-mobile-web-app-title (home-screen label, short)",
//   "canvasLabel": "aria-label of the canvas (English)",
//   "intro":  { "kicker": "small caps line over the title", "title": "the h1 of the splash" },
//   "heavy":  { "ramGB": 1, "ru": "... ~{mb} МБ и ~{ram} ГБ ...", "en": "... ~{mb} MB and ~{ram} GB ..." },      // {mb} = REGISTRY[id].approxMB, {ram} = ramGB
//   "places": { "title": "tooltip of the Places list: which key goes where" },
//   "help":   { "walk": "text with <kbd>1</kbd> tags (walking help line)", "air": "text with <kbd> tags (flying help line)" },
//   "sights": ["splash-name", ...],                         // assets/splash/<name>.jpg; [] = no pictures (the splash keeps its plain colour)
//   "facts":  [ ["a true, checkable sentence"], ["another one", "splash-name"], ... ]      // [sentence, the sight whose picture shows it (one of "sights"), if any]
// }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PAGE_SCHEMA = 1;
/** the template page (the strip's own page) and the registry id whose page it is: never generated */
export const TEMPLATE_FILE = 'strip.html';
const nl = (s) => s.replaceAll('\r\n', '\n');

const escHtml = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const escAttr = (s) => escHtml(s).replaceAll('"', '&quot;');
const jsStr = (s) => `'${String(s).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

/** Validate a parsed page.json. Returns a list of problems (empty = fine). `splashDir`: when given, every sight must have a picture there. */
export function validatePage(page, { id = '?', splashDir = null } = {}) {
  const p = [];
  const str = (v, name, min, max) => { if (typeof v !== 'string' || v.length < min || v.length > max || /[\r\n]/.test(v)) p.push(`${name}: a single-line string of ${min}..${max} characters`); };
  if (!page || typeof page !== 'object') return [`page.json of ${id} is not an object`];
  if (page.schema !== PAGE_SCHEMA) p.push(`schema must be ${PAGE_SCHEMA}`);
  str(page.title, 'title', 3, 90); str(page.appTitle, 'appTitle', 2, 24); str(page.canvasLabel, 'canvasLabel', 8, 160);
  str(page.intro?.kicker, 'intro.kicker', 3, 120); str(page.intro?.title, 'intro.title', 3, 80);
  str(page.heavy?.ru, 'heavy.ru', 10, 300); str(page.heavy?.en, 'heavy.en', 10, 300);
  if (!(page.heavy?.ramGB > 0 && page.heavy.ramGB <= 8)) p.push('heavy.ramGB: a number in (0, 8]');
  for (const k of ['ru', 'en']) if (typeof page.heavy?.[k] === 'string' && !(page.heavy[k].includes('{mb}') && page.heavy[k].includes('{ram}'))) p.push(`heavy.${k} must contain {mb} and {ram}`);
  str(page.places?.title, 'places.title', 10, 700);
  for (const k of ['walk', 'air']) {
    const t = page.help?.[k]; str(t, `help.${k}`, 10, 1500);
    if (typeof t === 'string' && /<\/?(?!kbd\b)[a-z]/i.test(t.replace(/<\/?kbd>/g, ''))) p.push(`help.${k}: only <kbd> tags are allowed`);
    if (typeof t === 'string' && (t.match(/<kbd>/g) || []).length !== (t.match(/<\/kbd>/g) || []).length) p.push(`help.${k}: unbalanced <kbd>`);
  }
  if (!Array.isArray(page.sights) || page.sights.some((s) => typeof s !== 'string' || !/^[a-z0-9-]+$/.test(s))) p.push('sights: a list of lower-case file names (a-z, 0-9, -)');
  else {
    if (new Set(page.sights).size !== page.sights.length) p.push('sights: a name twice');
    if (splashDir) for (const s of page.sights) if (!fs.existsSync(path.join(splashDir, s + '.jpg'))) p.push(`sights: assets/splash/${s}.jpg does not exist`);
  }
  if (!Array.isArray(page.facts) || page.facts.length < 8) p.push('facts: at least 8 entries');
  else {
    const seen = new Set();
    page.facts.forEach((f, i) => {
      if (!Array.isArray(f) || f.length < 1 || f.length > 2) { p.push(`facts[${i}]: [sentence] or [sentence, sight]`); return; }
      const [s, sight] = f;
      if (typeof s !== 'string' || s.length < 30 || s.length > 400 || /[\r\n<>]/.test(s)) p.push(`facts[${i}]: one line of 30..400 characters without < or >`);
      else { if (seen.has(s)) p.push(`facts[${i}]: a duplicate sentence`); seen.add(s); }
      if (sight !== undefined && !(Array.isArray(page.sights) && page.sights.includes(sight))) p.push(`facts[${i}]: sight "${sight}" is not in "sights"`);
    });
  }
  return p;
}

/** Replace the ONLY match of `re` (a missing or a second match is an error: the anchor moved in strip.html). */
function once(html, re, fn, label) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const ms = [...html.matchAll(g)];
  if (ms.length !== 1) throw new Error(`gen-area-html: anchor "${label}" matches ${ms.length} times in strip.html (expected exactly 1); update tools/gen-area-html.mjs`);
  const m = ms[0];
  return html.slice(0, m.index) + fn(...m) + html.slice(m.index + m[0].length);
}

/** Registry remap keys are relative to the site root without './' ('src/world/area.js'); the import map wants URL-like keys ('./src/world/area.js'). */
const urlLike = (k) => (/^(\.{0,2}\/)/.test(k) ? k : './' + k);

/**
 * templateHtml: the text of strip.html; row: the registry row of the area; page: the parsed page.json.
 * Returns the text of the area page (LF line endings). Pure: no file access.
 */
export function generatePage(templateHtml, row, page) {
  let html = nl(templateHtml);
  const id = row.id;
  html = once(html, /(<html\b[^>]*\sdata-area=")[^"]*(")/, (m, a, b) => a + id + b, '<html data-area>');
  html = once(html, /<title>[^<]*<\/title>/, () => `<title>${escHtml(page.title)}</title>`, '<title>');
  html = once(html, /(<meta name="apple-mobile-web-app-title" content=")[^"]*(")/, (m, a, b) => a + escAttr(page.appTitle) + b, 'apple-mobile-web-app-title');
  html = once(html, /(<canvas id="scene"[^>]*\saria-label=")[^"]*(")/, (m, a, b) => a + escAttr(page.canvasLabel) + b, 'canvas aria-label');
  html = once(html, /(<div class="kicker">)[^<]*(<\/div>)/, (m, a, b) => a + escHtml(page.intro.kicker) + b, 'intro kicker');
  html = once(html, /(<h1 class="title" id="stname">)[^<]*(<\/h1>)/, (m, a, b) => a + escHtml(page.intro.title) + b, 'intro title');
  const fill = (t) => t.replaceAll('{mb}', String(row.approxMB)).replaceAll('{ram}', String(page.heavy.ramGB));
  // the heavy-scene note also carries the title of the phone's pre-start card (core/boot-guard.js pageSizes reads data-card-title; strip.html has none and the strip keeps its own text): the intro
  // kicker up to its first colon («Прогулка по северу города: Таврический сад и Смольный» -> «Прогулка по северу города»), then the English half of the strip's card
  const cardTitle = `${page.intro.kicker.split(':')[0].trim()} · Before you start`;
  html = once(html, /<span class="tk">([^<]*Heavy scene:[^<]*)<\/span>/, () => `<span class="tk" data-card-title="${escAttr(cardTitle)}">` + escHtml(fill(page.heavy.ru)) + ' · ' + escHtml(fill(page.heavy.en)) + '</span>', 'heavy-scene note');
  html = once(html, /(<select id="places"[^>]*\stitle=")[^"]*(")/, (m, a, b) => a + escAttr(page.places.title) + b, '#places title');
  html = once(html, /(<span class="desk walk">)[\s\S]*?(<\/span>)/, (m, a, b) => a + page.help.walk + b, '#help walk line');
  html = once(html, /(<span class="desk air">)[\s\S]*?(<\/span>)/, (m, a, b) => a + page.help.air + b, '#help air line');
  // the import map: the area's remap first, then whatever strip.html maps (three, three/addons/)
  html = once(html, /<script type="importmap">\s*([\s\S]*?)\s*<\/script>/, (m, json) => {
    const base = JSON.parse(json).imports;
    const remap = Object.fromEntries(Object.entries(row.remap || {}).map(([k, v]) => [urlLike(k), urlLike(v)]));
    for (const k of Object.keys(remap)) if (k in base) throw new Error(`gen-area-html: strip.html's import map already maps ${k}`);
    const lines = Object.entries({ ...remap, ...base }).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
    return `<script type="importmap">\n{ "imports": {\n${lines.join(',\n')}\n} }\n</script>`;
  }, 'import map');
  // the facts script
  html = once(html, /^( *const SIGHTS = )\[[^\]\n]*\];[^\n]*$/m, (m, a) => `${a}[${page.sights.map(jsStr).join(', ')}];      // assets/splash/<name>.jpg${page.sights.length ? '' : ' (this area has no splash pictures: the splash keeps its plain colour)'}`, 'SIGHTS');
  html = once(html, /^( *const FACTS = \[[^\n]*\n)[\s\S]*?\n( *\];)$/m, (m, head, tail) => `${head}${page.facts.map((f) => `      [${f.map(jsStr).join(', ')}],`).join('\n')}\n${tail}`, 'FACTS');
  if (!page.sights.length && !html.includes('const show = () =>')) {
    // pick(SIGHTS) of an empty list is undefined: do not request assets/splash/undefined.jpg
    html = once(html, /^( *)(document\.getElementById\('intro'\)\.style\.setProperty\('--art', `url\("\.\/assets\/splash\/\$\{sight \|\| pick\(SIGHTS\)\}\.jpg"\)`\);)$/m, (m, ind, stmt) => `${ind}if (sight || SIGHTS.length) ${stmt}`, 'splash picture line');
  }
  // a generated file says so, right after the doctype
  html = once(html, /^<!doctype html>\n/i, (m) => `${m}<!-- GENERATED by tools/gen-area-html.mjs from strip.html and src/areas/${id}/page.json: do not edit (node tools/gen-area-html.mjs regenerates it; --check runs in the CI). -->\n`, 'doctype');
  return html;
}

export const pageJsonFile = (siteRoot, id) => path.join(siteRoot, 'src/areas', id, 'page.json');

/** Read the inputs of an area from a site root and generate its page. Throws on a missing or invalid page.json. */
export function generateFor(siteRoot, row) {
  const pj = pageJsonFile(siteRoot, row.id);
  if (!fs.existsSync(pj)) throw new Error(`gen-area-html: ${path.relative(siteRoot, pj)} does not exist (the text data of the area; see the header of tools/gen-area-html.mjs)`);
  const page = JSON.parse(fs.readFileSync(pj, 'utf8'));
  const problems = validatePage(page, { id: row.id, splashDir: path.join(siteRoot, 'assets/splash') });
  if (problems.length) throw new Error(`gen-area-html: ${path.relative(siteRoot, pj)}:\n  - ${problems.join('\n  - ')}`);
  return generatePage(fs.readFileSync(path.join(siteRoot, TEMPLATE_FILE), 'utf8'), row, page);
}

/** First differing line between two texts, for the --check message. */
function firstDiff(a, b) {
  const x = a.split('\n'), y = b.split('\n');
  for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) return `line ${i + 1}:\n    on disk:    ${String(x[i]).slice(0, 160)}\n    generated:  ${String(y[i]).slice(0, 160)}`;
  return 'no difference';
}

// ------------------------------------------------------------------------ CLI
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const { REGISTRY } = await import('../src/areas/registry.js');
  const argv = process.argv.slice(2), has = (f) => argv.includes(f), val = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : null);
  const siteRoot = val('--root') ? path.resolve(val('--root')) : toolRoot, check = has('--check'), force = has('--force-planned'), only = val('--area');
  let rows;
  if (only) {
    const r = REGISTRY[only];
    if (!r) { console.error(`gen-area-html: unknown area "${only}" (known: ${Object.keys(REGISTRY).join(', ')})`); process.exit(2); }
    if (r.page === TEMPLATE_FILE) { console.error(`gen-area-html: the page of ${r.id} IS ${TEMPLATE_FILE} (the source of every generated page)`); process.exit(2); }
    if (r.status === 'planned' && !force) { console.error(`gen-area-html: area "${only}" is planned (its files do not exist yet); pass --force-planned to generate its page anyway`); process.exit(2); }
    rows = [r];
  } else rows = Object.values(REGISTRY).filter((r) => r.page !== TEMPLATE_FILE && r.status !== 'planned');
  if (!rows.length) { console.log('gen-area-html: no generated area page to check (every area except the strip is planned)'); process.exit(0); }
  let bad = 0;
  for (const row of rows) {
    let text;
    try { text = generateFor(siteRoot, row); } catch (e) { console.error(e.message); bad++; continue; }
    const file = path.join(siteRoot, row.page);
    if (check) {
      const disk = fs.existsSync(file) ? nl(fs.readFileSync(file, 'utf8')) : null;
      if (disk === null) { console.log(`gen-area-html: ${row.page} is MISSING (run node tools/gen-area-html.mjs --area ${row.id})`); bad++; }
      else if (disk !== text) { console.log(`gen-area-html: ${row.page} is STALE (run node tools/gen-area-html.mjs --area ${row.id}); first difference at ${firstDiff(disk, text)}`); bad++; }
      else console.log(`gen-area-html: ${row.page} OK (${text.length} chars)`);
    } else {
      fs.writeFileSync(file, text);
      console.log(`gen-area-html: wrote ${row.page} (${text.length} chars)`);
    }
  }
  process.exit(bad ? 1 : 0);
}
