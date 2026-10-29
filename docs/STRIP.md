# The Nevsky strip: what this repository is, what was cut, how to rebuild and deploy it

n4spb is `102_3d_piter` (a walkable cel-shaded three.js model of the whole centre of Saint Petersburg, about 80 km2) cut down to **one strip**:
**Moscow Railway Station -> Nevsky Prospekt -> the Admiralty**, the district around the prospect, Palace Square and the Hermitage. It keeps the engine, the
cars, people, trains, boats, birds, the drivable car and the metro stations of that area, and it is meant to be deployed as a **static site that loads fast**.
Everything the cut removed was removed on purpose; nothing in the kept code is stubbed to hide a missing part.

## 1. The strip

Metres, x east, z south, origin on Nevsky Prospekt at Mayakovskogo (the engine's street frame; `ORIGIN` lon 30.351279, lat 59.932421 in `src/world/data/city.js`).
The **play area** is the union of nine rectangles (the eight of the original cut and SG, added 2026-10-18: section 10) (`PLAY_RECTS`, names in `RECT_NAMES`); the **data extent** (`EXTENT_RECTS`) is each of them grown by 120 m.

| Name | x | z | Size (m) | Area (km2) | What is in it |
|---|---|---|---|---|---|
| OLD | -595 .. 835 | -405 .. 1060 | 1430 x 1465 | 2.095 | Moscow Station, Vosstaniya Square, the rail yard, Nevsky east of the Fontanka, Anichkov Bridge, Ligovsky, Vladimirsky Cathedral, Mayakovskaya / Vladimirskaya / Dostoevskaya, Oktyabrsky hall |
| W1 | -1750 .. -595 | -1000 .. 160 | 1155 x 1160 | 1.340 | Nevsky from the Fontanka to Kazan Cathedral, Gostiny Dvor, the Griboedov and Moika embankments, Mikhailovsky Castle, the Church of the Saviour on Blood, the Russian Museum |
| N1 | -595 .. -420 | -1000 .. -405 | 175 x 595 | 0.104 | the Fontanka north of Nevsky: Belinsky Bridge, the Circus |
| W2a | -1950 .. -1750 | -1300 .. 170 | 200 x 1470 | 0.294 | the Green and Pevchesky bridges over the Moika, the Winter Canal, the Hermitage Bridge, the Neva bank |
| W2b | -2200 .. -1950 | -1180 .. 170 | 250 x 1350 | 0.338 | Palace Square, the Alexander Column, the Hermitage (Winter Palace), Admiralteyskaya metro |
| W2c | -2450 .. -2200 | -1010 .. 170 | 250 x 1180 | 0.295 | the Admiralty, Alexander Garden, the Palace Bridge |
| W2d | -2700 .. -2450 | -800 .. 240 | 250 x 1040 | 0.260 | St Isaac's Cathedral and square, the Moika |
| W2e | -2900 .. -2700 | -620 .. 240 | 200 x 860 | 0.172 | Senate Square, the Bronze Horseman |
| SG | -1000 .. -600 | -1300 .. -1000 | 400 x 300 | 0.120 | the Fontanka mouth: the 1st Engineer and Panteleymonovsky bridges, the Chizhik-Pyzhik corner, the Moika source, the south half of the Summer Garden, the Swan Canal (section 10) |

* Union area **5.02 km2** (extent union 6.63 km2; 4.90 / 6.44 without SG); bounding box x -2900 .. 835, z -1300 .. 1060 = **3735 x 2360 m**; the strip is a staircase, so the bounding box has two empty notches (north-east and south-west). The length along Nevsky is about 3.1 km.
* `src/world/data/city.js` is the stitched data (OLD = `city-east.js`, then `city-w1.js`, `city-n1.js`, `city-w2a.js` .. `city-w2e.js`); every other region part is gone.
* The start is Vosstaniya Square (`HERO`, key 1); the viewpoint keys are defined in `src/world/layout.js` (`VIEWS`).

## 2. What was dropped, and why

The goal is a small, fast, honest strip, not a thinner city: every module whose play area lies outside the rectangles was removed from `MODULES` in `src/main.js`
(the engine builds and bakes exactly that list; claims are derived from it). Dropped: the east (Lavra, east bridges), the north (Smolny, Tauride, Suvorov, Kirochnaya, Transfiguration, Zhdanovka),
the Mars Field, Summer Garden, New Holland, Mariinsky, Yusupov, Nikolsky, the Peter and Paul Fortress, the Spit, University, Troitskaya, Aurora, Kronverk, Kamennoostrovsky, Vladimir, Karpovka,
all of Vasilievsky Island (Academy, Andrew, Mining, Menshikov, Naval Corps, Smolensky, Sevkabel, Sea Terminal, Marine Facade, Gavan, Sredny, Makarova, Kirova, Pribaltiyskaya, Modern VO, VO statues),
the Petrograd monuments and Petrovsky, Krestovsky, Yelagin, Kamenny and Botanical groups, the TV tower, LETI, the Moskovsky corridor and Victory Park, the central-south extension, the north-bridges and east-bridges families,
`undertest`. Partial: `landmarksNorth` keeps only the Podpisnye Izdaniya bookstore and the Mayakovskogo / Vosstaniya corridor houses; `bridges` keeps only the sites inside the extent (about 24); `metro` keeps seven stations.

* **Buildings that a dropped module used to claim become ordinary generic `city` buildings.** This is intended, in particular for the 120 m scenery margin around the play area.
* Bridges outside the extent, water outside it and the whole island / Petrograd / south-west data are gone; `src/world/data/east-water.js` (far Neva scenery) stays. The Malaya Neva (its mouth lies beside the Strelka, just north of the strip) is a third far-water source in `src/world/environment/neva-malaya.js` so that no wall is built across the channel.
* The docs, tools and reference data of the dropped areas were deleted with them (`docs/EAST.md`, `NORTH.md`, `VO-*`, `ISLANDS*`, `PETRO-*`, `MARS-BRIEF.md`, `SW-BRIEF.md`, `SOUTH-EXTENSION.md`, `WEST-*`, `SEVKABEL-CULTURE.md`, `INTEGRATION.md`, the island / VO json in `docs/reference/`, the 127 `tools/landmarks<Dropped>-*` tools, `islands*`, `yelagin-*`, `kamenny-*`, `petrovsky-*`, `krestovsky-*`, `vo-*`, `gaps-*` ..., and later the dev tools that imported deleted modules: `props-vo*`, `props-petro`, `props-islands`, `props-audit-vo|petro`, `props-harbour-probe*`, `environment-{islands-probe,petro-water,karpovka-west,vo-seal,vo-walk,vo-water}`, `traffic-vo-*`, `traffic-decks`, `water-rings`).
  `docs/research/` and `docs/images/` of the original project were never copied here: references to them in the older docs are historical.

## 3. How the data was clipped

The baked OSM extract of the original city was split into region parts (`city-east`, `city-w1`, ...). The strip keeps the eight parts of the OLD / W1 / N1 / W2a..e rectangles and `tools/strip-data-clip.mjs` cuts their records down to the
**extent union** (the play rectangles + 120 m) with the clip functions of `tools/osm-lib.mjs` (`clipRingUnion` for polygons, `clipLineUnion` for lines). Records are assigned to a part by a representative point, so before clipping
many records (roads, buildings, green, land use, rails, subway, piers, barriers, tree rows) reached hundreds of metres, some kilometres, past the strip border, and records that started outside but crossed into the strip were missing.
The script (a) clips every line and polygon record to the union (a line becomes one record per piece, same id and fields; a record with nothing left is dropped; untouched records stay byte-identical), (b) clips `RIVER` and `WATER` to the union grown by a further 600 m, so that
the far Neva and canal scenery is still drawn beyond the extent, (c) drops tree rows that lie entirely outside (rows that cross the edge stay whole, the tree module rejects the candidates outside itself), clips tram / trolley lines, never cuts buildings (a building belongs to the extent by its centroid;
only the ones entirely outside are dropped, with the overlaps that name them) and keeps `SUBWAY_ROUTES` / `BUS_ROUTES` whole (the metro net resolves stops by name), and (d) with `--recover <dir of the full-city data>` appends records of the original that cross the strip but lived in a region that is gone
(for example the Moika / Swan Canal water polygons the bridges look up by id). It is idempotent: `node tools/strip-data-clip.mjs --check` writes nothing and exits 1 when a part file would change.
`tools/bake-osm.mjs` and `tools/osm-lib.mjs` are still here **only** because the clipping reuses `osm-lib.mjs`; they encode the full-city frame rectangles and the raw OSM cache (`data/osm-raw`, not in this repository),
so they must not be used to re-fetch the map. If the strip is ever re-fetched they must be rewritten for the nine rectangles first (`tools/strip-data-extend.mjs` is the way new rectangles are added).

## 4. The metro

Exactly **seven stations** (all with real halls, vestibules, escalators and tunnels inside the play area): Ploshchad Vosstaniya (line 1), Mayakovskaya (3), Vladimirskaya (1), Dostoevskaya (4), Gostiny Dvor (3),
Nevsky Prospekt (2) and Admiralteyskaya (5). The four transfers between them are internal (Vosstaniya - Mayakovskaya, Vladimirskaya - Dostoevskaya, Gostiny Dvor - Nevsky Prospekt); Admiralteyskaya has none.

**Line ends ("option C").** Each line keeps exactly one out-of-strip neighbour per end as a `built: false` station served by the existing generic hall, which relabels itself with the neighbour's name and acts as the terminus
(doors stay open, the exit shows "Выход закрыт / Эта станция за пределами карты", the player can board the opposite track and ride back). The lines are therefore

| Line | Stations (real halls in capitals) |
|---|---|
| 1 | Chernyshevskaya, VOSSTANIYA, VLADIMIRSKAYA, Pushkinskaya |
| 2 | Sennaya Ploshchad, NEVSKY PROSPEKT, Gorkovskaya |
| 3 | Vasileostrovskaya, GOSTINY DVOR, MAYAKOVSKAYA, Ploshchad Aleksandra Nevskogo 1 |
| 4 | Spasskaya, DOSTOEVSKAYA, Ligovsky Prospekt |
| 5 | Sportivnaya, ADMIRALTEYSKAYA, Sadovaya |

Ride times between the stations are the real ones (`HOPS`). This keeps every platform train boardable in both directions (a pure truncation would leave lines 2, 4 and 5 with no boardable train). Line 6 and the other stations of the original are gone.
Details: [METRO.md](METRO.md).

## 5. How the border behaves

* **Invisible wall:** the player is clamped to the play union (`clampToPlay` in `main.js`) and slides along the border. The car meets a SOFT wall (`edgePush` in `drive/handling.js`): its origin is kept one footprint radius (about 2.3 m for the coupe, more for the long truck) inside the play union, the outward speed is removed (10 % bounce), the speed along the edge is kept and a nose that points into the edge is swung along it, so the car slides along the border at any heading and cannot be rotated into it. The hard footprint test used before froze the car for good as soon as steering turned a corner over the border (a pose that is itself blocked refuses every move). A car that is embedded in a building or the river may now move as long as it does not get worse. Tests: `npm run edge` (headless, 360 runs of the three garage cars, real strip shape) and `npm run edgereal` (real scene in the browser; the control run with the old handling got stuck in 20 of 45 runs, the new one in 0). The bridges and the walker are unchanged. Traffic despawns a little inside the extent.
* **Scenery margin:** the 120 m ring between the play area and the data extent is built (generic `city` buildings, streets, trees, water and quay walls) but cannot be entered.
* **Beyond the data:** the ground shader blends from the extent edge into a painted "city beyond the data" (a continued street grid, the rail ballast band, suburb colours), instanced perimeter blocks (`environment/far.js`), a suburb horizon ring at roughly 4.7 .. 5.9 km from Vosstaniya Square and the fog. The Neva keeps running to the horizon.
* **Water at cut edges:** where a river or canal leaves the clipped data (the Fontanka at the north and south-west, the Griboedov Canal in the south, the Moika in the west, the Neva staircase of W2a..e), water and quay walls simply end on the extent line, 120 m outside the play area; wall colliders only exist near the play area.
* **The staircase:** the notches of the union are not walkable; scenery data exists 120 m around them.

## 6. How to rebuild and verify

No bundler: the page imports `src/**/*.js` as modules. Node 18+ is enough for the CPU checks; `npm ci` installs `three` (0.170.0, the same version the importmap loads) and `puppeteer-core`.

CPU only (no GPU, any time):

```sh
node tools/owns-table.mjs                  # claims table src/world/lib/owns-table.js from MODULES (run after changing MODULES / groups)
node tools/layout-test.mjs                 # RESULT: OK (group ids, free view poses, road helpers, areas)
npm run check                              # headless build of every kept module (geometry, budget, warnings)
npm run roads; npm run markings; npm run walls; npm run labels; npm run facade; npm run wires; npm run paving
npm run touch                              # the touch controls' pure logic (curves, the drive.js input bridge against the real readInput, settings, layout geometry; docs/MOBILE.md)
```

GPU (one job at a time, nothing else running on the GPU; headless Edge through puppeteer-core, `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`):

```sh
npm run bakeplan                           # CPU: which areas are stale and why (node tools/bake-scene.mjs --plan); docs/BAKE-REVISIONS.md
npm run bake                               # LAST step after an edit that staled an area: bakes the stale live areas only; BAKE_VERBOSE=1, run it in the background (minutes)
npm run bakecheck                          # node tools/bake-manifest-check.mjs: per area: manifest == revision of the area's closure, the map src/core/baked-revision.js, product names / sizes / sha256, no *.part
npm run bakedcheck                         # node tools/baked-check.mjs medium|performance: hydrated nav, routes, field, teleport to the Admiralty, all regions
npm run smoke -- --q medium                # walk, fly, roof landing, NPCs (its own static server: a static-hosting simulation)
npm run touchbrowser                       # the touch UI in emulated multi-touch Edge (fast drive-only harness, screenshots in shots/touch/; --only full = the whole baked scene)
npm run load -- --q high --out shots/load/high
node tools/shot.mjs --base /n4spb --load --q medium --out shots/load/subpath    # sub-path hosting
```

`npm run bake` runs the real scene (the stages high, medium, low) of every stale live area and writes `assets/baked/<id>/*.bin.gz`, `assets/baked/<id>/manifest.json` and the generated `src/core/baked-revision.js`
(the strip is parked since the areas exist: it is baked by name, `--area strip`, and its bake lives in `assets/baked/`).
**The revision is per area** (since 2026-10-29; the text here described the one global revision of the strip era): the first 20 hex digits of a sha256 over the dependency closure of the area's page (docs/AREAS.md section 4,
docs/BAKE-REVISIONS.md), so **an edit makes stale exactly the areas whose closure contains the edited file**, and the stale page silently rebuilds everything procedurally (minutes of load, gigabytes of heap) and only prints `[baked]`
in the console. After the last edit: `node tools/bake-scene.mjs --plan`, re-bake what it lists, then `node tools/bake-manifest-check.mjs` must print `RESULT: OK` before anything is deployed.
`tools/` and `docs/` are not hashed (a change of the bake tooling needs a `BAKE_SCHEME` bump and `--area all --force`, BAKE-REVISIONS.md section 6).

Measured strip bake (2026-10-16, revision 67dc8314d0f73f796934): **63 files, 50.7 MiB gzip** (full city: 538 files, 450 MiB). Largest products: city-base meta 8.0 MiB, field-dtex 6.6 MiB, three nav graphs 3.7 MiB each, the 23 city-base regions 0.3-1.4 MiB each. The streamer cuts the strip into 48 regions of 640 m; 18 of them are awaited before the first frame at the hero pose, the rest stream in while walking or driving.
Measured on an RTX 3090 Ti (headless Edge, 1280 x 720, local server without compression, new profile): intro ready after 26.2 s at high and 25.0 s at medium through a sub-path (full city: 43 s with its bake), JS heap 1.16 GB after load, walking 52 fps and driving 57 fps at medium (the display is vsync-limited), 0 console errors. The source tree that is downloaded is 16 MB raw (about 4 MB gzip on a compressing host).
The full city bake was 450 MiB in 538 files.

## 7. Deployment

There is no build step: deploying is copying files. The whitelist:

```
index.html
manifest.webmanifest       (PWA: fullscreen + landscape for add-to-home-screen, docs/MOBILE.md)
src/                       (all .js; every module in MODULES is imported at page start)
vendor/rapier/rapier.js    (+ vendor/rapier/LICENSE: Apache-2.0)
assets/                    (assets/baked/<id>/manifest.json + *.bin.gz per area, assets/splash/*.jpg, assets/icons/*.png (the PWA icons), assets/bibliotochka.png)
```

Not needed at run time: `tools/`, `docs/`, `node_modules/`, `shots/`, `package*.json`, `.git`. LICENSE, NOTICE.md, README.md and LICENSE-sakuragaoka-station.txt are good to ship next to them.

```sh
mkdir dist && cp -r index.html src assets manifest.webmanifest dist/ && mkdir -p dist/vendor/rapier && cp vendor/rapier/rapier.js vendor/rapier/LICENSE dist/vendor/rapier/
```

Required static-host behaviour:

* **`*.bin.gz` must be served as plain bytes, WITHOUT `Content-Encoding: gzip`.** The page gunzips them itself (`DecompressionStream` in a module Worker); a host that adds the header or auto-decompresses `.gz` breaks the load, and the failed core products fall back to procedural generation.
* Content types: `text/javascript` for `.js` (modules and the worker, same origin), `application/json` for the bake manifest, `application/manifest+json` (or any JSON type) for `manifest.webmanifest` (GitHub Pages serves it correctly; `tools/serve.mjs` does too).
* Cache headers (what `tools/serve.mjs` does): `*.<20 hex>.bin.gz` -> `public, max-age=31536000, immutable` (content-addressed by the revision); `assets/baked/**/manifest.json`, the pages and `src/**/*.js` -> `no-cache` / revalidate
  (they are not content-hashed: a cached old `baked-revision.js` against a new manifest is a revision mismatch, i.e. the silent procedural rebuild; the gate preflight of a cached older map fails safe with the stale toast); `vendor/` and `assets/splash/` may use a moderate `max-age`.
* **Sub-path hosting works**: every URL is relative (`./src/main.js`, `new URL('../../assets/baked/', import.meta.url)`, the worker, the manifest). `/__baked_revision` is a 404 on a static host, which is handled (the page falls back to `BAKED_REVISION`, the entry of its own area in the generated `BAKED_REVISIONS`; an SPA fallback answering `text/html` is fine too).
* **Phones** (docs/MOBILE.md): the page needs HTTPS for the wake lock and device motion (GitHub Pages is), `manifest.webmanifest` + the `apple-mobile-web-app-*` meta tags make Add to Home Screen open fullscreen (the only fullscreen on an iPhone), and the pages workflow copies the manifest next to `index.html` (the icons are under `assets/icons/`, regenerate with `node tools/make-icons.mjs`).
* No service worker, no `SharedArrayBuffer`, no COOP / COEP requirement. The largest single strip product is a few MiB, far below the 100 MB limit of GitHub-Pages-style hosts.
* External run-time dependencies (not vendored): three 0.170.0 and its addons from `cdn.jsdelivr.net` (importmap in `index.html`), and Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`; the loader gives up after 6 s and uses system fonts).

**Git:** every re-bake of an area renames every baked file of THAT area (the area's revision is in the name), so each committed one-area bake adds about 55-63 MiB of new, non-deltaable blobs to the history (a full five-area bake about 280 MB).
Commit source whenever you like (a source-only commit that stales an area leaves its manifest stale: say so in the message), but bake and commit `assets/baked/` and `src/core/baked-revision.js` only at deployable checkpoints, never more than the final bake of a series,
and the bake of EVERY area the series staled (the CI check is per area). The 2026-10-29 migration to per-area revisions renamed the products (git renames, no new blobs): docs/BAKE-REVISIONS.md section 10.

## 8. Reading the older docs

[PERFORMANCE.md](PERFORMANCE.md), [LOADING.md](LOADING.md), [PERFORMANCE-PLAN-2026-10-15.md](PERFORMANCE-PLAN-2026-10-15.md) and the island / Vasilievsky / Petrograd sections of [city-api.md](city-api.md), [streets-api.md](streets-api.md) and `rules/` describe the whole city: their method applies,
their numbers do not (re-measure on the strip). [HANDOFF.md](HANDOFF.md) is the state of this repository; [DESIGN.md](DESIGN.md), [AGENT-BRIEF.md](AGENT-BRIEF.md) and [PERFORMANCE-CONTRACT.md](PERFORMANCE-CONTRACT.md) are the working rules.

## 9. Easter eggs

* **Chizhik-Pyzhik** (user request 2026-10-18): the little bronze siskin of the Fontanka, `src/world/landmarksCastle/chizhik.js`, on its real place: a small granite ledge fixed to the wall of the Fontanka west bank 5 m south-east of the 1st Engineer Bridge (about (-736, -1029)), 1.15 m above the water, with the bird (about twice the real 11 cm) looking toward the bridge and a few coins on the ledge. It is below the street, so it is seen from the water, from flight, or by looking down over the railing; `[E]` on the quay above it gives a toast with the story; pedestrians stop on the quay to photograph it (it is in `landmarks.monuments`). The first version (a copy on a plinth on the pavement of the east bank) was replaced when the area north of z = -1000 became playable (section 10).

## 10. The Summer Garden extension (SG, 2026-10-18)

The first cut ended at z = -1000 north of the Mikhailovsky Garden, so the Fontanka mouth (the Moika source with the 1st Engineer Bridge, the Panteleymonovsky Bridge, the corner where the Chizhik-Pyzhik sits) was scenery. It is now the ninth play rectangle, **SG** (x -1000 .. -600, z -1300 .. -1000, 0.12 km2; extent x -1120 .. -480, z -1420 .. -880). Walking, flying and driving work there like anywhere else (the car edge test `npm run edge` runs on the nine-rectangle shape).

* **Data:** the part `src/world/data/city-sg.js` (region `SG`, listed in `RECT_NAMES` / `REGIONS`) holds only what the old extent union did not cover: the band x -1120 .. -480, z -1420 .. -1120 (24 buildings, 166 road pieces, 57 green polygons, 270 trees, 312 furniture points ...). `tools/strip-data-extend.mjs` builds it from the full-city data of `102_3d_piter` (`--orig <its src/world/data>`, default `D:/git2/agi-fun-tests/102_3d_piter/src/world/data`): it selects whole records of the original (buildings by centroid, points inside, lines / polygons whose bbox touches the band), clips them with the clip functions of `tools/strip-data-clip.mjs` run on a one-rectangle scratch facade, writes the part and patches `city.js` once (import, rectangles, concat lists). `strip-data-clip.mjs --check` stays idempotent with it. Lines and polygons that cross z = -1120 are split there like at every other seam of the strip. The water already reached 600 m beyond the old extent, so no water was added (the Fontanka is cut at z about -1720, 300 m beyond the new extent).
* **Code:** `city/district.js` lists `SG` among the frozen regions (generic facade grammar). The Mars Field / Summer Garden modules of the original are still not part of the strip: the Summer Garden is OSM green, paths, fountains and trees, the buildings around it are generic `city` buildings.
* **Chizhik-Pyzhik** (`landmarksCastle/chizhik.js`) now sits on its real place, a granite ledge on the Fontanka wall 5 m south-east of the 1st Engineer Bridge, 1.15 m above the water (see section 9).
