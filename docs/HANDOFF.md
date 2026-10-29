# n4spb handoff: the Nevsky strip

State of this repository (cut from `102_3d_piter`, 2026-10-16). What the strip is and how to deploy it: [STRIP.md](STRIP.md). The user-facing summary and controls are in the root `README.md`.

## What exists

* The engine (`src/core/`, `src/main.js`, `index.html`) is the full engine of the original, unchanged in behaviour: renderer with outlines and bloom, toon materials, batching, LOD, region streaming of baked products, physics, WebAudio.
* The world is the build list in `src/main.js` (`MODULES`): environment, landmarksNorth (partial), streets, city, rail, landmarksA..J, landmarksBelinsky, landmarksK, landmarksCastle, landmarksOktyabrsky, bridges (partial, about 24 sites), metro (7 stations),
  props, traffic, people, wildlife, drive. Data: `src/world/data/city*.js` (eight region parts clipped to the strip), `data/metro.js`, `data/east-water.js`.
* The shipping bake `assets/baked/` is produced by `npm run bake`. **An area's bake is stale after an edit of any file in that area's dependency closure** (`node tools/bake-scene.mjs --plan` says which areas; docs/BAKE-REVISIONS.md), and the repository carries a bake only at deployable checkpoints (`npm run bakecheck` says whether the committed one matches the source).

## Rules that still bind (read before editing)

* [PERFORMANCE-CONTRACT.md](PERFORMANCE-CONTRACT.md): no city-wide per-frame work, keep region streaming and baked loading, bake last.
* [AGENT-BRIEF.md](AGENT-BRIEF.md): file ownership, the "Road integrity rules", user content rules (no flags, no alarm sounds), Cyrillic only through Write / Edit tools (never shell heredocs).
* [DESIGN.md](DESIGN.md): module contract, ctx API, datums, services, z-fighting. [LOOK.md](LOOK.md), [UNDERGROUND.md](UNDERGROUND.md), [METRO.md](METRO.md), [city-api.md](city-api.md), [streets-api.md](streets-api.md), `rules/`.
* GPU jobs (bake, shot, smoke, load, drive-bench) run one at a time.

## Gotchas

* `.gitattributes` forces LF for text; the working tree on Windows may show CRLF. The source revision ignores line endings, but `tools/owns-table.mjs --check` (called by `layout-test`) compares `src/world/lib/owns-table.js` byte-for-byte as LF text.
* The repo-root template `.gitignore` of the parent repository ignores `lib/ parts/ env/ build/ dist/ var/ target/ downloads/`; this project's `.gitignore` re-includes them (`src/world/lib/` must show in `git status`).
* `ORIGIN` is not the middle of the map. Colliders are thin hollow wall boxes: anything that places the player or an NPC must test `L.insideBuilding` and `L.isOnRoad`. `OWNS_GROUPS` is a static export read before `build`.
* Static meshes are merged by the engine: do not set `noBatch` without a reason, use `userData.noND` to keep a mesh out of the outline proxies, do not use layers 2-4. Debug switches: `?nd=0`, `?nofreeze=`, `?ccell=`, `?icell=`, `?baked=0`, `?baked=force`, `?only=`, `?allcity`.
* The metro line ends are "option C" stations (generic hall, `built: false`): see STRIP.md section 4.
* `tools/bake-osm.mjs` and `tools/osm-lib.mjs` remain only because the data clipping uses `osm-lib.mjs`; do not re-fetch the map with them (STRIP.md section 3).
* `docs/PERFORMANCE.md`, `LOADING.md`, `PERFORMANCE-PLAN-2026-10-15.md` and the island / Vasilievsky sections of the API docs describe the whole city (numbers do not apply). `docs/research/` and `docs/images/` of the original were not carried over.

## How to resume

1. `npm ci` (dev tools only), `node tools/layout-test.mjs`, `npm run check` (all `RESULT: OK`).
2. Edit, then re-run the focused checks of the area you touched (`npm run roads | markings | walls | labels | facade | wires | paving`, `node tools/metro-test.mjs`, `node tools/people-test.mjs`, ...).
3. When the source is final: `npm run bake` (background, `BAKE_VERBOSE=1`), `npm run bakecheck`, `npm run bakedcheck`, `npm run smoke -- --q medium`, `npm run load`; then deploy the whitelist of STRIP.md section 7.
4. Record real strip numbers (bake size, load time, frame times) in STRIP.md; the figures there are estimates from the full-city bake until then.

## Open items

* The first strip bake and its real sizes / load times are not recorded yet.
* Three.js (jsDelivr) and the Google Fonts are still loaded from their CDNs; vendoring them would remove the external dependency but edits `index.html` (hashed: do it before the final bake).
* Performance on the strip (walk, drive, load) has to be re-measured; the numbers in the older performance docs are for the whole city.
* **Knockable furniture** (`src/core/knock.js`, ported from 103_doomgrad_3d; rules in [DRIVING-COLLISIONS.md](DRIVING-COLLISIONS.md)): knock meshes are Dynamic and loose, so each type x 384 m cell is its own draw: measure the densest families (`tools/drive-bench.mjs`) before shipping more of them.
  Known limits: the people navigation (baked snapshot of the colliders) keeps a knocked thing's old position as an obstacle and walks through a lying pole until the next bake; a traffic wreck does not break anchored things; chains, wires and panels merged into world-space
  geometry do not follow a knocked post. Every `src/` edit stales the bake: while developing use `?baked=force` (`tools/shot.mjs --params "baked=force"`), rebake once at the end.
