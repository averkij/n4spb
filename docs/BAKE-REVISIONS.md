# Bake revisions: one per area

Since 2026-10-29 every live area has its OWN bake revision. A source change makes stale exactly the areas whose dependency closure contains the changed file, so a round that only touches one area re-bakes one area
(about 5 GPU-minutes) instead of all five (about 25). Before, ONE global revision covered every `src/**/*.js`: any edit staled every area (history: section 10). Rule of the owner: `CLAUDE.md`, "Bake revisions are per area".
The background (what a bake is, determinism, deploy) is in [AREAS.md](AREAS.md) sections 4 and 6.1; this file is the manual.

## 1. What a revision is

`revisionOf(root, areaId)` in `tools/baked-revision.mjs`: the first 20 hex digits of a sha256 over

```
"n4spb-bake-rev/<BAKE_SCHEME>\narea\0<areaId>\n"
for every hashed file, sorted by POSIX path (plain string compare, not the native path order):
    <path> \0 <length of the bytes> \0 <bytes> \0
"three\0" + <version> + " " + <integrity>        (package-lock.json, packages["node_modules/three"]; no npm ci needed)
```

* **Bytes.** `.js .mjs .html .json .css`: CRLF read as LF (Windows develops, Linux hosts); everything else (a PNG) raw. The path and the length are part of the hash, so `{a:'bc'}` differs from `{ab:'c'}`.
* **The area id and `BAKE_SCHEME`** are in the preimage: two areas with identical closures still get different revisions, and a toolchain bump moves every revision (section 6).
* **Hashed files = the closure** minus `EXCLUDED` (`src/core/baked-revision.js`: the generated map cannot be an input of itself) minus `RUNTIME_ONLY` (`src/core/gates.js`, `handoff.js`, `version.js`, `src/areas/registry.js`: they build
  nothing that is baked; `tools/runtime-only-lint.mjs` enforces that only `src/main.js` imports them), plus the area's page. Runtime-only and excluded files are still TRAVERSED: a helper imported only by `gates.js` is hashed.
* **Not hashed on purpose:** the bake tooling itself (`tools/bake-scene.mjs`, `bake-osm`, the codec on the tools side), the Google Fonts bytes behind the page link, the Edge / GPU / driver versions. Change one of the tools or
  the browser and the revision does not move: bump `BAKE_SCHEME` (section 6).
* A pure function of the committed tree: the bake, the CI (`bake-manifest-check`), the dev servers and the hand-off all recompute it. It needs no `node_modules`, no git, no browser, so the CI `verify` job (no `npm ci`) can check it.

### 1.1 The closure (`tools/lib/closure.mjs`)

The set of files reachable from the area's entries by import. Entries: the page of the area (`REGISTRY[id].page`; `index.html` for the palace), its module scripts (`<script type=module src>` and the imports of inline module
scripts; at least one is required), `src/main.js`, and `src/world/<n>.js` for every `n` of `mainModules(id)` (`tools/modules-list.mjs`; must not be empty).

* **The import map of the page is applied** to every resolved URL: `src/world/data/city.js`, `src/world/area.js` and `src/world/city/known-data.js` map to the files of THAT area, so the data of another area is not in the closure. `three` and
  `three/addons/` are external.
* **Edges** found by a real tokenizer (strings, nested templates, comments, regex literals; not a regex over lines): `import ... from`, `export ... from`, `import 'x'`, `import('lit')`, computed `import(...)` (through the
  rules, section 5.3), `new URL('lit', import.meta.url)`, `new Worker('lit')`, `importScripts`. A specifier loses `?query` and `#hash`; the target must exist with EXACTLY that spelling (Windows develops, Linux hosts).
  Files outside `src/` that exist (`vendor/rapier/rapier.js`) are followed; `assets/bibliotochka.png` (`hash: true` in `RUNTIME_ASSETS`) is hashed by its bytes.
* **Fail closed.** A missing target throws `Missing(file, importer)`; any other bare or absolute specifier throws; a computed `import()` without a rule throws; a rule row whose expression is gone throws; an asset-looking
  string literal without a row throws. The closure is never "best effort": an unknown dependency is an error, never "not hashed".
* **Over-inclusion is on purpose.** Whole-folder rules (the cars, the Academy parts, the Kirova garden, the VO statues) add every file of the folder to the areas that reach the site. The folders are single-purpose, so it costs
  nothing today; a file that is in a closure by rule but never loaded only stales its area in vain (the safe direction).

Closure sizes on the tree of 2026-10-29 (`811625c`; the bake revisions of section 10): palace 593 files / 21.5 MiB, smolny 416 / 17.3, vladimirsky 449 / 19.3, admiralty 616 / 23.1, vasilyevsky 766 / 22.7 (parked: strip 569, north 345).
The intersection of all five is the ENGINE (at least 250 files): an edit there stales all five areas.

## 2. What is stored

| Where | What |
|---|---|
| `assets/baked/<id>/<key>.<rev>.bin.gz` | the products; the NAME carries the revision of the area (`assets/baked/` itself for the strip, parked) |
| `assets/baked/<id>/manifest.json` | fetched by browsers on every load. `{format:1, scheme:2, area, revision, closure:{files,bytes}, files:{key:name}, sizes:{key:{raw,gzip}}, sha256:{key:hex of the gzip}}`. `format` stays 1 and every new field is additive; the loader reads only `revision`, `files` and `sizes[k].raw` |
| `assets/baked/<id>/inputs.json` | never fetched by a browser, about 25 KB, informational and never part of a verdict: `{format:1, area, revision, scheme, files:{path: sha256[0:12]}, bakeSeconds}`. It is how the check lists WHICH files changed since the bake, and the source of the time estimate of `--plan`. A missing file is a warning |
| `src/core/baked-revision.js` | GENERATED, never edit: `BAKED_REVISIONS = { admiralty, palace, smolny, vasilyevsky, vladimirsky }` (one line each, alphabetical) and `BAKED_REVISION`, the revision of THIS page (`document.documentElement.dataset.area`; `'none'` for an unknown or parked area and in Node, which never matches a manifest). Written only by `renderRevisionModule(map)` (`tools/lib/revision-module.mjs`), and the check compares the text byte for byte |
| `assets/baked/.bake.lock` | exists while a bake runs (the pid inside; created exclusively, so a second bake refuses to start). A lock whose process is gone is taken over; one with unreadable content: delete it by hand if no bake is running |

The map is built from the manifests of all areas, so a bake of one area changes one line. The parked areas (`strip`, `north`) get no entry: the strip falls back to a procedural build, the North shows the error card, exactly as
before. The loader `src/core/baked-world.js` and `src/main.js` are NOT part of the change of 2026-10-29 (they are in the hash of every area: editing them would stale every bake); `/__baked_revision` answered 404 on a static
host before and the loader falls back to the generated constant.

The gate preflight (`src/core/gates.js`, runtime-only) compares the manifest revision of the TARGET area with `BAKED_REVISIONS[target]`, not with the constant of the page it runs on (the old comparison would report every
cross-area hop as stale). A cached origin page with an older map fails safe: the hop shows the "stale" toast.

## 3. Status of an area and how to read it

`node tools/bake-status.mjs [--area id[,id]] [--json] [--no-sha]` (CPU only, no `node_modules`, no git, no GPU; exit 0 when every shown area is FRESH, else 1; a parked area only when named) prints one line per area.
`areaStatus` / `statusesOf` in `tools/lib/bake-status.mjs` give one of:

| Status | Meaning | Remedy |
|---|---|---|
| FRESH | the manifest verifies and its revision equals the revision of the closure on the tree; the map `baked-revision.js` carries it; the directory holds nothing else | nothing |
| STALE | the manifest does not describe a complete, current bake: the closure hashes to another revision, or another `scheme` / `area` / `format`, or a required product is missing, mis-named, of the wrong size or sha256 | a GPU bake of the area |
| MISSING | no manifest | bake it |
| UNSYNCED | the manifest IS the current bake, but the map `src/core/baked-revision.js` does not carry its revision (an interrupted publish, a hand edit), or the directory holds products of another revision or `.part` / `.tmp` files | `node tools/baked-revision-sync.mjs --purge` (CPU, no GPU; `bake-scene` does it by itself at start) |
| ERROR | the closure cannot be computed (a `ClosureError`: an unclassified dependency); fail closed | read the message, section 8 |

`node tools/bake-scene.mjs --plan` (CPU only: puppeteer is imported after the planning, so it works in CI) prints the same lines plus the `PLAN:` line: which areas the next bake takes and why, the estimated GPU-minutes (the
observed `bakeSeconds` of `inputs.json`, else 5 per area) and the command, the areas it skips, the areas it will sync without a GPU, and whether `node_modules/three` matches the lock. `--plan --check` exits 1 if anything is not
FRESH. Shape of a stale line (the same text is in the failure of `bake-manifest-check`):

```
[vasilyevsky] STALE: manifest a1b2c3d4e5f6... but closure (764 files) hashes to b2c3d4e5f6a1... ; changed since the bake: src/world/landmarksSmolensky/x.js, vasilyevsky.html (+3). Re-bake: node tools/bake-scene.mjs --area vasilyevsky (~5 GPU-min)
```

Read it this way: if the changed list names only files of one area, that area is the only one to re-bake; if it names an engine / lib file, all five are STALE and the round costs the full bake; `changed files unknown (no
inputs.json)` means the list is not available (it is informational only: the verdict never depends on it); `no digest changed since the bake (the tooling or the scheme)` means the files are the baked ones and the bake is stale
for another reason (a `BAKE_SCHEME` bump, a damaged product: the `also:` part names it). Ask `--plan` first, always.

## 4. Daily workflow

```
node tools/bake-status.mjs                  where every live area stands, in a second                      (CPU)
node tools/bake-scene.mjs --plan            what the next bake takes and why, ~minutes                      (CPU)
node tools/bake-scene.mjs                   bake the STALE or MISSING live areas; "all fresh" and exit 0 when there are none   (npm run bake)
node tools/bake-scene.mjs --area smolny     those areas if they need it; fresh: "use --force"; a parked area only by name
node tools/bake-scene.mjs --area all        the stale live areas (same as no flags)
node tools/bake-scene.mjs --area all --force  everything again (toolchain or GPU change); --force always needs --area
node tools/bake-scene.mjs --require-clean   refuse when a file of a selected closure has uncommitted changes (default: a warning)
node tools/bake-manifest-check.mjs [--area id] [--no-sha]   the gate of the CI, all failures at once   (npm run bakecheck)
node tools/baked-revision-sync.mjs [--check|--purge]   regenerate the map from the manifests / only verify it / also remove orphan products and unfinished files
node tools/closure-lint.mjs                 the rules vs the whole of src/
```

1. Make the change; run the CPU checks of the area as usual.
2. `--plan`. If it says an area you did not mean to touch is STALE, the change reached shared code: either that is intended (then the round re-bakes it) or move the edit (section 7).
3. `node tools/bake-scene.mjs` (one browser, the GPU lock of the session). Each area is published as soon as it succeeds, so an interrupted multi-area bake leaves valid areas and reports the rest stale; if any live area is
   still STALE after the run the script exits 3 and prints the command. Exit codes: 0 done or nothing to do, 1 a failure, 2 usage, 3 the bake ran but a live area is still stale.
4. `node tools/bake-manifest-check.mjs` must print `RESULT: OK`; then commit the bake of EVERY area your change made stale, in the same round (otherwise the CI is red), with the version bump of `CLAUDE.md`.

**Preflight before any GPU time:** the closure of every selected area must compute (this proves the dynamic-import allowlist), `node_modules/three/package.json` must have the version of the lock, and the lock file `.bake.lock` must
be free. **Before the publish of an area:** the served-file audit (every repository file the bake server served must be in the closure or in `ALLOW_SERVED`; a violation aborts that area and names the file and the rule to
add), a re-digest of the closure (a file edited DURING the bake aborts that area and names it), the 8 required products exist with the recorded sizes; then the sha256 of each product is recorded.

Order of publication per area (`publishArea` in `tools/lib/bake-publish.mjs`): `inputs.json`, then `manifest.json` (the commit point), then the merged `src/core/baked-revision.js`, then the purge of the area's old products
(files only, its own directory). A crash between the manifest and the map leaves UNSYNCED (repaired by the sync tool); a crash between the map and the purge leaves old products, which are also UNSYNCED (`--purge` removes them).
The fault-injection tests (`bake-plan-test`) stop `publishArea` after each step and require that the state left behind is reported, never trusted.

Dev servers (`tools/serve.mjs`, `shot`, `area-dev`, the drive and probe tools) answer `/__baked_revision` through `tools/lib/dev-revision.mjs` (`handleBakedRevision(req, res, root)`): the area comes from the `Referer` (`/` and `/index.html` are the palace,
`/<name>.html` the area with that page) and the answer is the revision of the LIVE tree, cached by a stat signature of the closure files (a request stats the files and re-walks only when one differs, never per request). The loader accepts the baked path only when
the manifest revision equals BOTH that answer and `BAKED_REVISION` of the page, so a development edit of a file in the closure shows as a stale bake (the procedural fallback; `?baked=force` is the labelled bypass for performance work
on code that does not change what the bake contains). A closure that cannot be scanned right now (a missing import while somebody is editing) is answered with revision `unscannable`, never with a stale-looking good one. No Referer
or an unknown page gives 404 and the page uses the generated constant.
`tools/dev-servers-lint.mjs` fails if any other tool contains `__baked_revision` or imports the removed global `bakedRevision`.

## 5. How to add things

The rule behind all of it: **the scanner never guesses.** What it cannot read from the source is classified in `tools/lib/closure-rules.mjs` (pure data) and `tools/lib/closure-orphans.txt`; `node tools/closure-lint.mjs`
(CI, ~5 s) fails with the file, the line and the row to add.

### 5.1 A new file or module

* A file that is imported (statically, `import('lit')`, `export ... from`) is picked up by itself: nothing to do. Nothing else does it: do not rely on a naming convention.
* A new landmark module of an area: add it to `MODULES` of the area module (`src/areas/<id>/area.js`; `src/main.js` for the palace). The module list is an entry source of the closure (`src/world/<n>.js`), so it is in the closure of that
  area and of no other. `import-lint` (the file exists with that spelling) is unchanged.
* A new file that NOTHING imports (a port waiting for its caller): `closure-lint` fails ("orphan, not listed"). List it in `tools/lib/closure-orphans.txt`, one POSIX path per line. The list is the inventory of ports that
  are in no closure (10 on 2026-10-29: `landmarksMakarova/inst`, `landmarksMining/prims`, `landmarksNavalCorps/util`, `landmarksNorthFull/doors`, `landmarksPalaceBridge/groups`, `landmarksSeaTerminal/util`,
  `landmarksSevkabel/util`, `landmarksSmolensky/trees`, `landmarksSredny/util`, `landmarksYusupov/parts`). When the file gets its importer, delete the line (the lint fails on a listed file that is reached after all).
* A new area: a registry row and a page; its page is an entry. Add its id to the lists in `tools/closure-real-test.mjs` (the five live ids and the closure size bands are hard-coded there) and record its loads (5.4).

### 5.2 A new engine or lib file

It enters the closure of every area that imports it. If it is imported by shared code, all five areas go stale: expected. Land engine work in its OWN round, apart from area content (section 7).

### 5.3 A new computed `import()`

`import(\`./x/${name}.js\`)` or `import(variable)` cannot be resolved by reading. Add a row to `DYNAMIC_IMPORTS[file][expression without whitespace]`:

| Rule | Meaning |
|---|---|
| `area-modules` | `src/world/<n>.js` for the `n` of the area's module list (the entries anyway) |
| `dir { dir, recursive }` | every `.js` file of the directory subtree (the site picks the file by a variable) |
| `glob { dir, pattern }` | the `.js` files directly in the folder that match (`'*'` = any name); a template over a name |

Real rows today: `src/main.js` `./world/${n}.js` (`area-modules`), `src/world/lib/claims.js` `../${m}.js` (`area-modules`; adds nothing, `OWNS_TABLE` covers every module), `drive/cars/index.js` `import(path)` (`dir`),
`landmarksAcademy/academy.js` `import(file)` (`dir`), `landmarksKirova/garden.js` (`glob`), `landmarksVOStatues.js` (`glob`). Read the site and choose the SMALLEST folder that really holds every possible target.
A row whose expression no longer exists in its file is an error too: remove the row with the code.

### 5.4 A new loaded asset or a new way of loading

`fetch(`, `new URL(`, `new Worker(`, `importScripts(`, `eval(`, `new Function(` and string literals that look like an asset (`.png .jpg .webp .svg .json .wasm .glb .bin .ogg .mp3`, or containing `assets/`) are checked by
`closure-lint`. Each must be a JS edge the scanner already follows, or a row of `RUNTIME_ASSETS[file][literal] = { path, hash, why }`, or a counted row of `RUNTIME_CALLS` (the exact number of `fetch(` in that file).

* `hash: true`: the bytes can change what the bake sees (the car logo `assets/bibliotochka.png`): they enter the revision of every area that reaches the literal.
* `hash: false`: used at run time only (splash, icons, the webmanifest, the baked products themselves): then the bake-time served-file audit must accept it, so list it in `ALLOW_SERVED` as well when the bake page requests it.

After adding any rule or touching the scanner, prove it against a real page: `node tools/closure-groundtruth.mjs <area|all> [--record]`. It loads the page in headless Edge with software GL (SwiftShader, so a running bake keeps
the GPU; ONE browser at a time, 40 to 60 s per area), records every repository file the page asked for and compares with the static closure. A file fetched but outside the closure is a hole of the scanner (exit 1); a file in the
closure that was not fetched is fine (conditional code). `--record` rewrites `tools/fixtures/closure-loads/<area>.json`, which `closure-real-test` checks on the CPU in CI (fixture `⊆` closure). Needs `node_modules`, Edge and
no other bake; not for CI. Run it before a release and after any scanner change.

## 6. After a toolchain change: `BAKE_SCHEME`

The revision hashes the SOURCE. It cannot see a change in how the source is turned into products: `tools/bake-scene.mjs`, `bake-osm`, the codec (the tools side), the headless Edge / GPU / driver, a three.js build that is
not the lock entry. After such a change the old products are still "fresh" by the hash and wrong by the tool. Procedure:

1. Raise `BAKE_SCHEME` in `tools/baked-revision.mjs` (it is in every preimage and in every manifest, `scheme`).
2. `node tools/bake-scene.mjs --area all --force` (about 25 GPU-minutes).
3. Run the oracle: `node tools/bake-product-compare.mjs` against the previous products if the change was meant to be neutral; then `bake-manifest-check`, then the version bump and commit.

`bake-manifest-check` refuses a manifest whose `scheme` differs from `BAKE_SCHEME`, so a forgotten re-bake cannot be deployed. A change of the SOURCE of the tools only (docs, tests, lints) needs nothing.

## 7. How to spend fewer GPU-minutes

* A file of shared code (engine, lib, drive, bridges, the north hooks `src/areas/north/hooks*` that all five areas import) stales ALL five areas. Estimated saving of the scheme: about 20% of area-bakes over the last 60 commits
  (240 of 300), and none in a round that contains an engine commit. The gain comes from landing engine work and area work in SEPARATE rounds.
* `--plan` after each commit tells which area a file touched; `node tools/bake-scene.mjs --area <id>` bakes just that one.
* Runtime-only files (`gates.js`, `handoff.js`, `version.js`, `registry.js`) never stale anything: gate rectangles, prompt texts and the version are free.
* The closure of an area is also a map of its dependencies: `node tools/closure-lint.mjs` reports (not a gate) a live area whose closure reaches the exclusive `src/areas/<other>/` files of another.

## 8. Troubleshooting `bake-manifest-check` and the bake

The check computes the status of every live area (a parked one only with `--area`), checks the map against the manifests and prints ALL failures, one line per area and one `[map]` line per map problem, then
`RESULT: FAIL: stale: vasilyevsky, palace; unsynced: smolny; map: 1 problem; fresh: admiralty, vladimirsky` (or `RESULT: OK (fresh: ...; N complete products; M MiB gzip)`). Exit 1 on any failure, 2 on usage. What each failure means:

| Failure | Cause | Remedy |
|---|---|---|
| `STALE: manifest A but closure (N files) hashes to B ; changed since the bake: ...` | a file of the closure changed after the bake. The list is the diff against `inputs.json` | `node tools/bake-scene.mjs --area <id>`. If the list is empty or names a file you did not touch: a stray edit, a `package-lock.json` change of the three entry (`package-lock.json (three)`), or a binary file with a text extension (only CRLF is normalised) |
| `MISSING: no manifest in assets/<dir>` | the area was never baked, or its directory was removed | bake it |
| `the manifest says area "x" but it lives in the directory of y` | the files of another area were copied into this directory | re-bake the area; never copy bakes between directories |
| `manifest scheme none (a bake of the global-revision era)` or `scheme 1 but the tools are at BAKE_SCHEME 2` | the bake was made by an older toolchain (section 6) | `--area all --force` after the `BAKE_SCHEME` bump |
| `missing required product <key>` / `product file <name> does not exist` | one of the 8 products (`field roof street-textures street-kerbs street-surfaces city-base nav-medium nav-low`) is not in the manifest or not in the directory (a file deleted by hand, an interrupted copy) | restore from git, or re-bake |
| `product <key> is named "x", expected <key>.<revision>.bin.gz` | renamed by hand, or a product of another revision referenced by the manifest | re-bake; do not rename |
| `product <name> is N bytes, the manifest says M` / `does not match its sha256 (damaged or replaced)` | the file differs from the manifest (`sizes[k].gzip`, `sha256[k]` of the gzip): a truncated or edited product, a text-mode checkout | `git checkout -- assets/baked/<id>`, or re-bake |
| `UNSYNCED: ... unfinished file x.part` / `orphan product ...` | a bake died mid-download, or the purge after the publish never ran. The bake itself is fine | `node tools/baked-revision-sync.mjs --purge` (no GPU) |
| `UNSYNCED: ... src/core/baked-revision.js says X for <id>, the manifest says Y` | the map does not carry the manifest's revision (crash between the manifest and the map) | `node tools/baked-revision-sync.mjs` |
| `[map] ... has an entry for <id>, which is not a live area (extra key)` / `<id> is missing but its manifest says ...` / `has an entry but no usable manifest` | the map is not `{id: manifest.revision}` of the live areas | `node tools/baked-revision-sync.mjs` (regenerates it; no GPU) |
| `[map] ... is not exactly what the generator writes (hand-edited?)` / `is not the generated per-area map` | the generated file was edited by hand, or is still the legacy single constant | run the sync tool; never edit the file |
| `warning: the manifest has no sha256 section` | a manifest written before the sha256 field | informational; the next bake writes it |
| `ERROR: the closure cannot be computed: <Kind>: ...` (a `ClosureError`: `Missing`, `Unclassified`, `Unsupported`, `StaleRule`, `Rule`, `NoModules`, `NoModuleScript`, `ImportMap`, `Escape`, `Lock`, `UnknownArea`) | the scanner met something it cannot place. `Missing`: an import target that does not exist with that spelling (the message names the importer). `Unclassified`: a computed `import()` or a loaded asset without a row (5.3, 5.4). `Unsupported`: a bare or absolute specifier, a non-script import. `StaleRule`: a row whose expression is gone. `Lock`: `package-lock.json` has no `node_modules/three` entry | read the message, which names the file and the line: fix the import or add / remove the row; `node tools/closure-lint.mjs` shows all of them at once |

Messages of `bake-scene.mjs`:

* `another bake is running (assets/baked/.bake.lock, pid N). If no bake is running, delete that file.`
* `preflight: node_modules/three is X but package-lock.json locks Y: the bake would load another three.js than the revision names (npm ci)` (or `node_modules/three is not installed`).
* `WARNING <id>: N files of its closure have uncommitted changes (...): commit the bake together with them` (an error with `--require-clean`): the bake is made from the working tree, so the revision names files that are not committed yet.
* `served-file audit of <id> failed (nothing published)` followed by `<file> was served to the page of <id> but is not in its closure`: a file the bake page loaded that the scanner does not know. For `src/` add the rule to `DYNAMIC_IMPORTS` /
  `RUNTIME_ASSETS` (5.3, 5.4); for a harmless runtime file add it to `ALLOW_SERVED` in `tools/lib/closure-rules.mjs`. Then run `closure-groundtruth`.
* `the source changed during the bake of <id> (A -> B): <files>; refusing to publish stale assets`: someone edited the closure while the bake ran. Bake again, in a worktree nobody touches.
* `bake-scene: NOT published: ...` and then `the areas published before it stay valid; re-run node tools/bake-scene.mjs for the rest`.
* `bake-scene: --force needs --area <id[,id]> or --area all`, `unknown area "x"`, `area "x" is planned`: usage errors, exit 2.

## 9. Tests

All CPU, none needs `node_modules`, a browser or git, unless marked. They live in `.github/workflows/pages.yml` (`verify`) and as `npm run` scripts.

| Test | What it proves |
|---|---|
| `tools/closure-lint.mjs` | every computed `import()` and asset literal is classified, every orphan listed, the regex `importsOf` of `exact-case.mjs` finds nothing the tokenizer missed (4361 specifiers on 2026-10-29) |
| `tools/baked-revision-test.mjs` | the hash on fixture trees (an in-memory overlay): order, CRLF, delimiters, exclusions, isolation of two areas, import-map remap, dynamic rules, `?query`, missing target, page edits, lock entry, scheme and area id in the preimage, a PINNED golden revision (any change of the algorithm is deliberate) |
| `tools/closure-real-test.mjs` | the real tree: an edit of a one-area file moves only that area, shared files move all five, runtime-only and dead files move none, the five revisions differ, closure size bands, recorded loads `⊆` closure |
| `tools/closure-mutation-test.mjs` | the oracle can fail: 9 broken scanners (ignore templates, `export ... from`, the page remap, large files, narrowed globs, the dynamic table, the page, hash runtime-only files, keep `?query`) must ALL be killed by the tests above |
| `tools/bake-manifest-check-test.mjs` | one fabricated directory per failure of section 8, all failures reported together |
| `tools/bake-plan-test.mjs` | the selection of areas (`planBake`), the exit codes, the fault injection of `publishArea` (`after-manifest` gives UNSYNCED, `after-map` leaves orphans) |
| `tools/dev-revision-test.mjs`, `tools/dev-servers-lint.mjs` | the dev-server endpoint and that no tool bypasses it |
| `tools/baked-revision-js-test.mjs` | the generated module for each area, `'none'` for an unknown area and without `document` |
| `tools/gates-test.mjs` | the preflight against `BAKED_REVISIONS[target]`, including the cross-area regression |
| `tools/closure-groundtruth.mjs` | NOT CPU, local: the real page loads (headless Edge, SwiftShader) against the closure |

## 10. History

* **Before 2026-10-29:** one global revision (the sha256 of `index.html`, every page with a `data-area` and every `*.js` under `src/` except the runtime-only files; `tools/lib/legacy-revision.mjs` keeps the algorithm, for the
  migration and its tests). Any edit staled every area; a committed bake was always `--area all` (about 25 GPU-minutes and about 280 MB of new blobs).
* **2026-10-29: per-area revisions** (judged from three designs: the closure recomputed from the tree, a stored dependency list, an engine hash plus an area hash; the first won because it has the fewest trusted artefacts and
  every unknown is a hard error; the others contributed the golden pin, the orphan inventory, the lock file, the served-file audit, the recorded loads and the fault-injection tests).
* **The migration was a rename, not a re-bake.** All 479 live products (2514 MiB raw) were streamed (by the design scouts, and again by the migration tool itself, which refuses to rename on a single hit) and the legacy revision `78fc35d9a53453f9fa9a` occurs in none of them (the scouts also found no `72b2768af6595614e8cb`); the
  codec metadata is `{root,nodes,schemas}` only, so the revision exists only in file names and manifests. `tools/bake-migrate-closure.mjs` asserted that `legacyGlobal(root)` equalled every manifest, renamed the products
  with `git mv` (`<key>.<old>.bin.gz` to `<key>.<new>.bin.gz`; `git diff -M --summary` shows 479 renames at 100%, no new blobs), rewrote the manifests with the new fields, wrote `inputs.json` and the map, and re-hashed
  every renamed file against the recorded sha256. Rollback: `git revert` the migration commit, or one `--area all --force`.
* Revisions on the tree of the migration (`811625c` content): palace `94985718be22bd4e19a1`, smolny `ef98e125fd8348982945`, vladimirsky `14970360cb4fc427e1de`, admiralty `53ccc53190d6c0d3bc0c`, vasilyevsky `d4dfd3ab134a72f0290c`
  (parked, computed and not baked: strip `30241f53e2f4cac9aa0d`, north `ce2dd2ddb1e35d02bdcd`). The parked areas keep their legacy bakes (`72b2768...`, about 80 MB), which are stale and still shipped by `cp -r assets`:
  whether to drop them from the deploy is an owner decision.
* Version: a PATCH (no new capability, manifest `format` stays 1 and additive, the loader is unchanged). `CLAUDE.md` calls a "bake format break" a major change; the owner confirms the level.

## 11. Residual risks

1. **A scanner blind spot** would let a stale bake pass the CI. Defences: the fail-closed errors, the regex cross-check, the orphan inventory, the recorded loads, the bake-time served-file audit (the only check against a live
   page of the current tree) and the 9-mutant test. Re-run `closure-groundtruth` before releases and after scanner changes.
2. **Unhashable inputs:** Google Fonts bytes, Edge / GPU / driver: unchanged from before; `BAKE_SCHEME` and `bake-product-compare` are the answer.
3. **`vendor/rapier` and `assets/bibliotochka.png`** are hashed for the first time: editing either stales the areas that reach it (the safe direction).
4. **A dev server without a Referer** loses the live-tree hint and falls back to the generated constant. Not a production risk.
5. **Without batching** a round still costs about 5 area-bakes. Further levers, not done: move `src/areas/north/hooks*` (imported by all five areas) and the 8 `landmarksTauride` files it pulls in out of the area directory,
   split `owns-table.js`, bake per product (field, roof, nav, street) with separate closures.
