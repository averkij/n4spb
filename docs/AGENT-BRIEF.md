# Agent brief — read this and `docs/DESIGN.md` before you write any code

> **n4spb note.** This repository is the Nevsky-strip cut of `102_3d_piter` (what stays, what was dropped: [STRIP.md](STRIP.md)). The brief below was written for the whole city: only the modules listed in `src/main.js` exist here, the research dossiers (`docs/research/`), the photo references (`SP/refs`), the gallery (`docs/images/`) and the private Yandex screenshot were NOT carried over, and the sibling projects `../100_3d_moscow_city`, `../101_3d_yakutsk` are not part of this repository. The rules (ownership, road integrity, user content, performance) apply unchanged.

You are one specialist in a team that builds **102_3d_piter**: a walkable first-person **anime cel-shaded** three.js scene of the centre of **Saint Petersburg** (Russia), starting with the
**Moscow Railway Station** and Vosstaniya Square, then Nevsky Prospekt, the Fontanka and Anichkov Bridge, the side streets, and a **metro** the player can ride. It is the user's favourite city,
visited by millions of tourists: the user wants it **very realistic** — a person who knows the city must recognise every place — in the style of the finished siblings `../100_3d_moscow_city`
and `../101_3d_yakutsk` (same engine, same look). A realistic **summer day** with people, transport and trains; nothing fantastical.

## Ground rules

* You own the files named in your task and **only** those. Everything else is read-only for you: `src/core/*`, `src/main.js`, `src/world/layout.js`, `src/world/lib/*`, `src/world/data/*`, `index.html`, `tools/*`, `docs/*`
  (except the docs your task names), other modules. If something outside blocks you, work around it inside your module and say what you need in your final report. **Never run `git add` / `git commit`** (the lead commits).
  Never touch `../100_3d_moscow_city`, `../101_3d_yakutsk` or `../sakuragaoka-station` (read-only libraries).
* Other specialists work in the same tree at the same time. Your module must work **alone and together**: read services of earlier modules with optional chaining and fall back to what `layout.js` / `data/city.js` give you.
  A broken half-written file of yours breaks everybody's screenshots: keep your module loadable at all times (develop in small steps, run `node tools/check.mjs <you>` often; for risky rewrites write the new version beside the old
  one and swap when it works).
* Russian text in files: use the Write / Edit tools, never shell heredocs (they can garble Cyrillic). Real Russian names; no corporate logos or trademarks (plain wordmarks and generic pictograms).
* Temporary files, downloaded photos, scratch scripts: the session scratchpad `C:/Users/user/AppData/Local/Temp/claude/D--git2-agi-fun-tests/23e85c31-c728-41e5-866b-f4e9724d6358/scratchpad` (`SP` below), never the repo.
  Your screenshots go to `shots/<your-module>/` (git-ignored). Use a unique prefix for your own scratch scripts (e.g. `SP/<module>_*.mjs`): other agents share that folder.
* Be economical: the machine runs several agents at once (and the usage limit is shared: more than ~6 heavy agents once killed everybody). Run one screenshot job at a time, ask for few cameras per run, do not re-read huge files
  repeatedly, and stop when the result is good (typically 5-8 screenshot rounds). A finished, verified module beats a perfect unfinished one. If you are told to wrap up, leave the module in a stable, loadable state.

## What to read

For faster authoring, follow [AREA-DEVELOPMENT.md](AREA-DEVELOPMENT.md): use
`npm run dev:area -- <module>` for the local edit/review loop, keep the camera
across saves, and combine screenshot views in one load. Review the integrated
city and regenerate the shipping bake at verified checkpoints. Run GPU jobs
serially; an isolated preview is not integration or performance evidence.

0. **[PERFORMANCE-CONTRACT.md](PERFORMANCE-CONTRACT.md)** before extending an area or copying
   a landmark helper, and the latest measurements in **[PERFORMANCE.md](PERFORMANCE.md)**.
   New districts must not add city-wide rendering/update work. Prove the integrated
   scene still loads, walks and drives well in both the old centre and the new area.

1. `docs/DESIGN.md` (ctx API, datums, rules, services, verify, z-fighting) — fully. `docs/LOOK.md` (palette keys, sky, light). `docs/UNDERGROUND.md` if you touch anything below the street.
2. The research documents of your topic in `docs/research/` — they cite Commons photos and say what the place really looks like, with modelling specs (hex colours, dimensions, counts):
   `station.md` (station, square, tracks, trains), `nevsky.md` (Nevsky block by block, street cross-section, lamps, wires), `fontanka.md` (river, quays, Anichkov Bridge, palaces, boats), `architecture.md` (14 building archetypes, heights),
   `metro.md` (network, stations, trains, tunnels), `transport.md` (22 vehicle archetypes), `people.md` (crowds, outfits, vignettes, spots), `streets.md` (furniture, surfaces, trees, signs, sky / light, shop names),
   `osm-landmarks.md` (names -> OSM ids), `docs/reference/DATA-REPORT.md` (the map data: counts, gaps, z-fighting audit; it describes the first, un-stripped extract).
3. **The reference photos** the researchers downloaded: `SP/refs/<topic>/NN_*.jpg` with topics `station nevsky fontanka architecture metro transport people streets` (~700 photos; open them with the Read tool; each research doc lists what each
   file shows). More: Wikimedia Commons geosearch (`https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord=59.931|30.36&gsradius=1000&gslimit=500&gsnamespace=6&format=json`), downloads via
   `curl -L -A "piter-anime-walk/1.0 (research; nepo7771@gmail.com)" "https://commons.wikimedia.org/wiki/Special:FilePath/<File_name>?width=1400" -o ...` (about one request per second). Photographs are references only, never in the repo.
4. The private Yandex map screenshot the original extract was registered to (0.934 m/px, `calibration.md` in `docs/reference/`) is not in this repository.
5. The Yakutsk and Moscow siblings are **code libraries**: `../101_3d_yakutsk/src/world/**` (environment ground / trees, streets with fillets and lane graph, city wall shader and archetypes, traffic lane-graph simulation,
   people rig and crowd, wildlife, props, landmarks) and `../100_3d_moscow_city/src/world/**` (rail + station + trains, boats, towers). Read and **copy what helps** into your own module folder and retune it for Petersburg
   (colours, proportions, species). Do not import across projects at runtime. **Use the LATEST Yakutsk code** (git log of 101_3d_yakutsk): e.g. commit fafd4c9 fixed road signs (`streets/furn.js panels.mount()`: sign face in front of the pole on a back plate with clamp bands, alphaTest corners; `props/ads.js` depth clearance) and made the ambulance siren silent.

## User content rules (explicit requests: they override anything in the research docs)

* **No flags in the scene for now**: no national / city / company / event flags, no pennants, no flag-bearing flagpoles (do not draw flagpoles at all), no tour-guide flags or flag-on-a-stick (guides carry a plain coloured umbrella or a bare pole-less sign instead), no flags on the obelisk / hotels / government buildings / boats / stations, no flag banners hanging from facades, no rail "flags". Plain street banners and signs are fine only if they are not flag-shaped. (Research docs mention flags; ignore those parts.)
* **No alarm sounds**: no sirens, no ambulance / police / fire-engine sirens or horns, no car alarms, no train horns / crossing bells, no alarm-like or harsh warning beeps (ordinary short **car horns are allowed**: the user confirmed they stay as in the engine) (`core/audio.js` modules: only calm ambience: footsteps, soft traffic bed, birds, water, a quiet metro hum, soft announcement chimes are fine). Emergency vehicles may stand or drive silently, **without flashing beacons** too (keep their plain livery).

**Targeted exception, user request 2026-10-31:** the three monumental
flagpoles beside Park 300th Anniversary and their reference historical flags
are requested landmarks. Author those three at their surveyed positions and
dimensions. The general flag prohibition continues to apply elsewhere.

## Knockable street furniture (user request 2026-10-17)

* The driven car knocks over and throws benches, litter bins, pots, lamp posts, traffic-signal and sign poles, bollards and similar furniture (`src/core/knock.js`, `ctx.knock`; masses, break speeds and rules:
  [DRIVING-COLLISIONS.md](DRIVING-COLLISIONS.md), [DESIGN.md](DESIGN.md) `ctx.knock` row). A module that builds such furniture registers it **during its build**, behind `if (ctx.knock)`, through
  `knockInstances` (`world/lib/knock-inst.js`: Dynamic cell meshes + explicit `registerLOD`, never `attach`), keeps its service lists and collider handles, and builds exactly the old single static meshes when `ctx.knock` is missing.
* Never register anything built by `city/*`, nor continuous runs (quay panels, railings, fences). Panels that hang on a knockable thing (a sign face, a poster, a name band) must be detached meshes that move with it (`{ obj }` parts), not merged world-space geometry.
* Sounds: only the calm `clank` one-shot (steel struck), never an alarm. Tests: `npm run knock`; `node tools/check.mjs <module>` prints `knock: registered N by kind`.

## Road integrity rules (user request 2026-10-05: they apply to EVERY module and every new area; audits: `docs/ROADS-FIX-PLAN.md`)

* **Nothing stands on a carriageway.** Lamps, traffic-light poles / mast arms, signs, bollards, planters, bins, benches, trolleybus masts, quay posts, trees, props: the footprint must keep clear of the real asphalt
  (`ctx.services.streets.net.cover(x, z, {}) < -0.5`, which includes parking pockets, junction fillets and merged carriageways; before `streets` exists, i.e. in `environment`, use `layout.isOnRoad(x, z, -0.1)` / `roadsNear`).
  Measure offsets from the **real asphalt edge** (`wayAt(w, s).hL / hR`), never from the lane or the OSM centreline, and test the FINAL position, not the intended one. If a spot fails, slide along the kerb, move to the pavement,
  or skip: a missing lamp is better than a pole in the roadway. Narrow streets (carriageway < ~7 m, no pavement) get no free-standing poles. A drawn object, its collider and its entry in a service list (`lamps`, ...) are placed together or not at all.
* **Every drivable road is asphalt.** Nothing may be laid over a carriageway: no slab / paver / cobble / brick ribbons, no raised footway or square polygons, no pavement strips, corner patches or landmark paving
  (clip them at `net.cover`). Exceptions are only: bridge decks drawn by the bridges module, real pedestrian zones where `pedestrianOnly` / the landmark owns the surface (Palace Square stone field), and OSM `highway=pedestrian/footway`.
  Two one-way carriageways of one street closer than 7.5 m are ONE roadway (`net.js fillMedians`: no kerbed strip, no lamps on it, one double line): wider gaps are real boulevards and need their own pavement clip.
* **Audit before you report** (headless, no GPU, a minute or two): `npm run roads` (= `tools/roads.mjs`: `tools/roads-furniture-audit.mjs --strict` + `tools/roads-surface-audit.mjs --max-fail 2170`) must exit 0
  (`--near x,z,r` narrows the area, `--json file` lists every offender with its cause). New generators and new districts (a bake of more OSM data, another extension) add their area to these audits; fix the RULE in the generator, not the single spot.
  Then look at car height (eye y 2.4) along three roads of different classes. The user checks by driving the red car.

## Road markings, plates, signs and facade labels (user request 2026-10-06: they apply to EVERY module and every new area)

* **Road markings** follow one rule set per road class (GOST R 51256: double solid centre line for paired one-way carriageways, dashed lane lines, stop line before a junction, zebra at every crossing, nothing painted inside a junction box): `docs/rules/ROAD-MARKINGS.md`. Fix the RULE in `streets/markings.js`, never a single street; run `npm run markings` before reporting (Nevsky is the reference case).
* **Street-name and house-number plates** are the standard Petersburg plates (navy field, green rim with rivets, ship emblem, type word + big name + Latin line; number plate below with the neighbouring numbers) and **road signs** use the GOST R 52290 faces from one atlas (pedestrian crossing 5.19 with the lime frame, priority, no parking ...): `docs/rules/SIGNS-AND-PLATES.md`; `npm run plates` writes a contact sheet to `shots/streets2`. Never draw a sign face by hand in a landmark module: add it to `streets/signs.js`.
* **Facade labels never overlap.** Anything that hangs flat on a wall (plates, shop signs, ads, clocks, address plates) reserves its rectangle through `ctx.services.labels.reserve(...)` first and skips when it returns false: `docs/rules/LABELS-API.md`. Two coplanar labels z-fight; the registry makes that impossible by construction.
* **Walls have no holes**: every footprint edge of a building has a wall face or a documented reason: `docs/rules/FACADE-INTEGRITY.md` (written by the city fix; run its audit with `npm run walls`).

## Look rules (short)

Materials only from `ctx.mat` (toon / decal / emissive / glass / foliage / facade); outlines are automatic; chunky readable silhouettes; blue-grey shadows; albedo <= ~0.92; no PBR.
Scale: door 2.1 x 0.9 m, storey 3.6-4.5 m (pre-1917 houses), person 1.5-1.85 m, car 4.5 x 1.8 m, lamp post 5-9 m. Pavements are +0.12 m and kerbs +0.15 m visually only; the ground the player walks on is y = 0.
Everything repeated more than ~40 times is an `InstancedMesh`. Never use `Math.random()` (use `ctx.rng(seed)`); animation = pure function of `t`.
Use `layout.insideBuilding(x,z,r)` and `layout.isOnRoad(x,z,margin)` / `roadsNear` before placing anything the player could collide with.

## Verification (do all of it)

1. `node tools/check.mjs <module> [other modules]` -> `RESULT: OK`, triangles within the budget in DESIGN.md section 6, no fixable warnings. Check a landmark module together with `city`.
2. Real-renderer screenshots: `node tools/shot.mjs --only environment,streets,city,<module> --cams "hero;x,z,yaw,pitch;x,y,z,yaw,pitch" --out shots/<module>/a --t 20` (read the header of `tools/shot.mjs` for the camera names).
   **Open every PNG with the Read tool** and compare it with the reference photos of the same place side by side: proportions, colours, storeys, details, scale, floating / sunken objects, z-fighting,
   missing or inverted faces, text mirrored or unreadable, clutter. Fix and repeat. Include a close-up (1-3 m), a street-level view (eye height 1.7 m) and an overview.
3. Keep a header comment in each file of your module: what it draws, which photos / documents it is based on, parameters worth knowing.
4. Z-fighting is a bug class the user cares about (section 10 of DESIGN.md). Run `node tools/zfight.mjs` on your frames before you report (`--only <modules> --cams "..." --out shots/zfight/<yours>`; `--grid 80,2 --quiet` sweeps the play area;
   header of the tool explains). Target: < 0.02 % noisy pixels in every frame that shows your module; your meshes must not be at the top of the OFFENDERS table.

5. If your module puts anything on or beside a street or draws ground-level surfaces: the two road audits of "Road integrity rules" above exit 0 with your module built.

## Final report (your last message, under 35 lines)

What you built (and what is deliberately not built), the exports / services you publish (`ctx.services.*`, `OWNS_GROUPS`), triangles / draw calls / build time from `tools/check.mjs`, files you created, problems you could not solve,
anything the lead must change outside your files (with exact proposals), and ideas for the next iteration. Do not paste code.
