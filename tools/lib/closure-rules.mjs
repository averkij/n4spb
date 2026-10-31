// The hand-kept rules of the dependency closure (tools/lib/closure.mjs). PURE DATA. The closure of an area is computed from the committed tree; whatever the scanner cannot read from the
// source itself is classified HERE, and everything unclassified is a hard error (fail closed): a new computed import(), a new loaded asset kind or a new file nothing imports needs a row
// here (or a line in closure-orphans.txt): tools/closure-lint.mjs enforces it in the CI.

/** Files the bake revision never hashes though the scan may reach them: runtime-only (docs/AREAS.md: gates, hand-off codec, version, registry; tools/runtime-only-lint.mjs) ... */
export const RUNTIME_ONLY = ['src/core/gates.js', 'src/core/handoff.js', 'src/core/version.js', 'src/areas/registry.js'];
/** ... and the generated revision map itself (it is written by the bake from the revision, so it cannot be an input of it). */
export const EXCLUDED = ['src/core/baked-revision.js'];

/**
 * Computed import() sites: DYNAMIC_IMPORTS[file][normalised expression] = rule. The expression is the source between the parentheses with all whitespace removed.
 * Rules:
 *   area-modules              src/world/<n>.js for every n of the area's MODULES list (these are entries of the closure anyway)
 *   dir  { dir, recursive }   every .js file of the directory subtree (recursive !== false) - the site picks the file by a variable
 *   glob { dir, pattern }     the .js files directly in dir that match pattern ('*' = any name) - the site is a template over a name
 * A row whose expression is gone from its file is a hard error; so is a computed import() without a row.
 */
export const DYNAMIC_IMPORTS = {
  // MODULES template: the module list of the area (src/areas/<id>/area.js; src/main.js for the strip)
  'src/main.js': { '`./world/${n}.js`': { rule: 'area-modules', why: 'the page imports the modules of its MODULES list' } },
  // fallback for a module that is missing in OWNS_TABLE (src/world/lib/owns-table.js covers every module today, so it loads nothing)
  'src/world/lib/claims.js': { '`../${m}.js`': { rule: 'area-modules', why: 'fallback for a module that is not in OWNS_TABLE' } },
  // optional car models: paths.truck || './cybertruck.js' ... (the cars of the garage; each model folder is single-purpose)
  'src/world/drive/cars/index.js': { 'path': { rule: 'dir', dir: 'src/world/drive/cars', recursive: true, why: 'the garage cars: ./cybertruck.js ./lada2106.js ./roadster.js and their folders' } },
  // the sub-parts of the Academy of Arts: ['front','./front.js'], ['dome','./dome.js'] ...
  'src/world/landmarksAcademy/academy.js': { 'file': { rule: 'dir', dir: 'src/world/landmarksAcademy', recursive: true, why: 'the sub-parts front / dome / rear / court of the academy' } },
  // `./${f}.js` over a literal list of garden parts
  'src/world/landmarksKirova/garden.js': { '`./${f}.js`': { rule: 'glob', dir: 'src/world/landmarksKirova', pattern: '*.js', why: 'the garden parts (whole folder: the list is a literal of the file)' } },
  // F('name') -> import(`./landmarksVOStatues/${name}.js`)
  'src/world/landmarksVOStatues.js': { '`./landmarksVOStatues/${name}.js`': { rule: 'glob', dir: 'src/world/landmarksVOStatues', pattern: '*.js', why: 'the statue parts (whole folder)' } },
};

/**
 * Non-JS things named by a string literal (or by new URL(lit, import.meta.url)) of a source file: RUNTIME_ASSETS[file][literal] = { path, hash, why }.
 *   path  the file in the repository (POSIX, relative to the root), or null when the literal is not a repository file (a directory of bake products, a server endpoint)
 *   hash  true: the BYTES of the file are part of the revision of every area whose closure reaches the literal (they can change what the bake sees)
 *         false: loaded at run time only (splash, icons, manifest ...): the served-file audit of the bake lists them in ALLOW_SERVED instead
 * A row whose literal is gone from its file is a hard error; so is an asset-looking literal without a row.
 */
export const RUNTIME_ASSETS = {
  'vendor/rapier/rapier.js': { 'rapier_wasm3d_bg.wasm': { path: null, hash: false, why: 'the default URL of the wasm in the compat bundle (new URL(..., "<deleted>")): the wasm is embedded in rapier.js, nothing is fetched' } },
  'src/areas/registry.js': Object.fromEntries(['strip.html', 'north.html', 'index.html', 'smolny.html', 'vladimirsky.html', 'admiralty.html', 'vasilyevsky.html', 'gavan.html', 'morskoy.html', 'dekabristov.html', 'kolomna.html', 'semyonovsky.html', 'morskie-vorota.html', 'okrug65.html']
    .map((p) => [p, { path: null, hash: false, why: 'the page name of a registry row (runtime-only file: a hand-off navigates to it; the page of an area is an entry of its own closure)' }])),
  'src/world/drive/model.js': { './assets/bibliotochka.png': { path: 'assets/bibliotochka.png', hash: true, why: 'the car logo texture (drawn into the model)' } },
  'src/core/baked-world.js': {
    '../../assets/baked/': { path: null, hash: false, why: 'the directory of the baked products (their name carries the revision)' },
    '../../assets/': { path: null, hash: false, why: 'the base of setBakeDir / peekManifest: a directory of bake products' },
    'manifest.json': { path: null, hash: false, why: 'the manifest of the bake of the area (its revision is checked by the loader)' },
    '../../__baked_revision': { path: null, hash: false, why: 'the dev-server answer with the revision of the live tree (404 on the host: the generated constant is used)' },
  },
};

/** Paths the bake-time served-file audit accepts outside the closure (bake-scene.mjs): exact paths and prefixes (a prefix ends with '/'). Everything else served from the repository must be in the closure. */
export const ALLOW_SERVED = {
  exact: ['src/core/baked-revision.js', 'manifest.webmanifest', 'favicon.ico'],
  prefix: ['node_modules/three/', 'assets/baked/', 'assets/icons/', 'assets/splash/', '__'],
};
/** true when the served repository path (POSIX, no leading slash) is allowed by ALLOW_SERVED */
export function isAllowedServed(rel) {
  return ALLOW_SERVED.exact.includes(rel) || ALLOW_SERVED.prefix.some((p) => rel.startsWith(p));
}

/**
 * Calls of the lint (closure-lint.mjs) that load something at run time and are neither a JS edge the scanner follows nor a literal asset row: CALLS[file][call] = { count, why }.
 * The count is exact, so a new fetch( in the same file fails the lint until somebody reads it.
 */
export const RUNTIME_CALLS = {
  'src/core/baked-world.js': {
    'fetch(': { count: 6, why: 'manifest, bake products and the dev-server endpoints (/__bake_inputs, /__bake/<name>, /__baked_revision)' },
    'new URL(': { count: 2, why: 'new URL(file, assetBase): a product of the manifest under assets/baked/ (the literal URLs are rows of RUNTIME_ASSETS, the worker is a followed JS edge)' },
  },
  'src/core/baked-worker.js': { 'fetch(': { count: 1, why: 'fetches the product URL it is given' } },
  'src/core/gates.js': {
    'new URL(': { count: 3, why: 'the page of the neighbour area (runtime-only file)' },
    'fetch(': { count: 1, why: 'injectable fetch of the preflight (runtime-only file)' },
  },
  'src/main.js': { 'new URL(': { count: 1, why: 'new URL(location.href): the query of the page' } },
};
