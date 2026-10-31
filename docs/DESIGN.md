# Санкт-Петербург — Builder Guide (read fully before writing code)

> **n4spb note.** Written for the whole city; this repository is the Nevsky strip (Moscow Station -> Nevsky -> Admiralty, see [STRIP.md](STRIP.md)). The module contract, ctx API, datums, rules and verification steps apply unchanged. Sentences about the "first build" area (x -595..835) describe the OLD rectangle, which is now one of the eight play rectangles; `docs/research/` and `docs/images/` of the original project are not carried over.

A walkable first-person **anime cel-shaded** Three.js scene of the centre of **Saint Petersburg** (Russia), the user's favourite city: the **Moscow Railway Station**
(Московский вокзал, Konstantin Thon, 1851) with its platforms and **Vosstaniya Square** (the Hero City obelisk), **Nevsky Prospekt** from Vosstaniya to the **Anichkov Bridge**
over the **Fontanka**, the side streets (Ligovsky, Marata, Mayakovskogo, Vladimirsky, Liteyny, Zhukovskogo ...) and a **metro** the player can enter, ride down 51-64 m on
a 100+ m escalator, board a train on, and ride to the next station. **Realistic**, not fantasy: a summer day with tourists, locals, traffic (cars, buses, trolleybuses),
trains. The engine, look and conventions come from the *Sakuragaoka Station* reference (git submodule `../sakuragaoka-station`, MIT) through the finished siblings
`../100_3d_moscow_city` and `../101_3d_yakutsk` (Yakutsk is the direct ancestor: its modules are a **code library**, read them and copy what helps); the world content here is new.
The scene is built on real OpenStreetMap footprints registered to the user's Yandex Maps screenshot (a private layout reference that is not in this repository; `docs/reference/calibration.md`).
Later the map will grow to the whole tourist centre: keep every module data-driven (read `data/city.js` / `layout.js`), never hard-code coordinates you could derive.

Stack: plain ES modules, **three@0.170.0** (import map -> jsDelivr in the browser, `node_modules` in node / the screenshot tool). No build step.
Entry `index.html` -> `src/main.js`. World contract: `src/world/layout.js`. Map data: `src/world/data/city.js`. Start: `node tools/serve.mjs` -> http://localhost:5176.

## 1. Your module

Each world module is one file `src/world/<name>.js` (you may add helpers in `src/world/<name>/*.js`) exporting `export async function build(ctx) { ... }` (may be sync).
You own ONLY your files. **Never edit** `src/core/*`, `src/main.js`, `src/world/layout.js`, `src/world/lib/*`, `index.html`, `tools/*`, `src/world/data/*`, `docs/DESIGN.md`, or another
module's files. If the core / layout blocks you, work around it inside your module and report it (what you need and why) in your final message. Do **not** run `git commit` (the lead commits).

Build order (`main.js` `MODULES`): environment, streets, city, rail, landmarksA, landmarksB, landmarksC, landmarksD, metro, props, traffic, people, wildlife. A module may read
`ctx.services.X` of an **earlier** module at build time and of any module at update time, always with optional chaining and a sensible fallback computed from `layout.js`
(your module must work alone).

| module | owns |
|---|---|
| **environment** | ground plane (tessellated, painted: asphalt / granite / gravel / lawn patches, NOT two huge triangles), the **Fontanka trench** (granite quay walls, water surface at y = -3.2 with ripples, bed, mooring rings, steps / landing stages), lawns / gardens (`GREEN`), flowerbeds, **trees** (species in `docs/research/streets.md`: Nevsky itself has none; side streets, courtyards, gardens, the embankment do), hedges, far scenery (the roofline of the rest of Saint Petersburg to the horizon, the rail yard, TV tower, domes), ground service `groundAt`; the ground mesh leaves **holes** where `layout.GROUND_HOLES` says (metro shafts) |
| **streets** | roads / lane markings / zebra crossings / kerbs (granite) / granite-slab pavements / bus + trolleybus stops and shelters, road furniture (the Nevsky flower-bowl lamps, chain bollards, guard rails, traffic lights, signs, navy street-name plates, house-number plates), the **trolleybus overhead wire network** (cross-spans on facade rosettes, switches), parking lanes. Traffic itself is the `traffic` module |
| **city** | every OSM building not claimed by a landmark module: the Petersburg facade grammar (14 archetypes in `docs/research/architecture.md`: rusticated ground floor + shopfront band, piano nobile, window surrounds, cornice, mansard / sheet-iron roofs, chimneys, roof railings, arches to courtyards, entrances), roofs, courtyard wells, its own wall material / shader, shop signage from `POIS`, facade scaffolding nets (a few) |
| **rail** | the Moscow station's **track field and platforms**: 11 tracks / 6 platforms, white Y-column canopies, catenary masts + wires, signals, buffer stops, the fences, **trains** (long-distance + commuter, arriving / standing / departing as pure functions of t), platform furniture, the yard to the horizon (`docs/research/station.md`) |
| **landmarksA** | the **Moscow Railway Station building** (facade, clock tower, side wings, the hall with its glass roof, interior concourse), **Vosstaniya Square** (obelisk, paving, flowerbeds, taxi rank, kiosks), Hotel Oktyabrskaya and the corner houses |
| **landmarksB** | Nevsky Prospekt landmark buildings between Vosstaniya and Liteyny (Nevsky Centre, Nevsky Atrium with the Mayakovskaya metro arches, Yusupova / Menyaev houses ...) |
| **landmarksC** | the Fontanka: Anichkov Bridge (arches, railings, the four Klodt horse-tamer groups), Beloselsky-Belozersky Palace, the quay buildings, tourist boats + landing stages |
| **landmarksD** | sights in the north and south of the map: National Library, Mariinsky hospital block, Vladimirsky Cathedral + bell tower, Tolstoy House, Vladimirskaya square surroundings |
| **metro** | everything underground (`docs/UNDERGROUND.md`, `docs/research/metro.md`): vestibules, escalator tunnels, station halls (Ploshchad Vosstaniya, Mayakovskaya, Vladimirskaya, Dostoevskaya + generic stubs for the rest of the network), transfer passages, tunnels, trains, the ride, the network map UI |
| **props** | benches, urns, kiosks, advertising pillars, light boxes, flower pots / hanging baskets, tourist stalls, bike / scooter racks, café terraces (summer verandas), phone booths, street clocks |
| **traffic** | **vehicles** (`docs/research/transport.md`): moving cars, buses, trolleybuses (on the wires), taxis, delivery vans on the lanes (signals, crossings, queues, one-way system), **parked** cars along the kerbs |
| **people** | pedestrians, tourist groups with guides, the station crowd with luggage, kids, cyclists / scooters / couriers, performers (`docs/research/people.md`); they use the metro entrances and the station exits |
| **wildlife** | pigeons, gulls, crows, sparrows, ducks on the Fontanka + ambience triggers; retunes `core/audio.js` for a Saint Petersburg city |

### Landmark groups and claims (layout.GROUPS)

`layout.GROUPS = { landmarksA: [subgroup...], ..., metro: [...] }`; a sub-group is `{ key, name, nameEn, ids, osm, at, note }` (`ids` = building ids + their `parent` parts; `osm` = non-building
ids: paving, bridge decks, monuments). Helpers: `groupMembers(key)` (sub-group or module key -> building records), `groupOsm(key)`, `groupOf(id)`, `claimedBy(id)`, `isClaimed(id)`, `groupBounds(key)`, `SUBGROUPS`.
**A claim takes effect only when the owner says it draws the group.** Until then `city` / `environment` / `streets` still draw the claimed objects (buildings in a terracotta blockout tint). When you
implement a sub-group, export from your module file `export const OWNS_GROUPS = true;` (all of its module's sub-groups) or `['station','square']` (just these); then **you** build those buildings, their colliders
(`addPolyColliders` from `lib/massing.js`: building colliders are thin wall boxes), and you may draw the claimed paving / monuments. `lib/claims.js` (`ownedGroups(ctx)`, `isOwned(owned, id)`) is what the generic
modules use; `?allcity` in the URL ignores all claims. Pattern in the generic modules: `const owned = await ownedGroups(ctx); if (isOwned(owned, b.id)) continue;`. The data records may have `dupOf` (a duplicate: draw
only one) and `OVERLAPS` lists footprint overlaps (z-fighting hazards, `docs/reference/DATA-REPORT.md` section 5).

## 2. The ctx API (see `src/core/ctx.js`) — same as the reference, plus `facade` and the underground additions

| member | what |
|---|---|
| `ctx.THREE` | three.js namespace (or `import * as THREE from 'three'`) |
| `ctx.L` | everything from `layout.js` (`heightAt`, `inRiver`, `GROUPS`, `groupMembers`, `isClaimed`, `heightOf`, `eraOf`, `roadsNear`, `nearestRoad`, `isOnRoad`, `insideBuilding`, `WORLD`, `VIEWS`, `SQUARE`, `OBELISK`, `STATION`, `RIVER_Y`, `METRO_DEPTH`, `GROUND_HOLES`, `toGrid`, ...) |
| `ctx.buildList` | names of the modules being built (`?only=...`); `lib/claims.js` uses it |
| `ctx.addStatic(obj)` | static scenery. After all modules build, meshes are **merged by material** (never keep a reference to a static mesh to animate it). Underground meshes: tag them (`ctx.underground(obj)`, section 8) |
| `ctx.add(obj)` | animated / dynamic objects (never merged) |
| `ctx.onUpdate((dt, t) => ...)` | per frame. `t` = sim seconds (deterministic: screenshots fast-forward `t`). Prefer animation as a **pure function of t** |
| `ctx.mat.toon(color, opts)` | the cel material (MeshToonMaterial + 4-band ramp + world-space hand-painted variation). opts: `map, alphaMap, alphaTest, transparent, opacity, side:'double', vertexColors, emissive, emissiveIntensity, paint (0..0.15), polygonOffset, depthWrite`. Cached: same args -> same material |
| `ctx.mat.decal(color, opts)` | markings / posters on surfaces (polygonOffset). Still lift 5 mm off the surface |
| `ctx.mat.emissive(color, intensity, opts)` | unlit / self-lit (screens, lamps, lit signs). intensity > ~1.1 blooms softly |
| `ctx.mat.glass({tint, opacity, streaks, frost})` | anime glass for small panes (shelters, shop windows). Put a dim interior behind it |
| `ctx.mat.foliage(color, map, opts)` | alpha-tested double-sided cards (grass, leaves) |
| **`ctx.mat.facade(opts)`** | the **curtain-wall shader** (section 4): for the glass blocks, not for stucco walls |
| `ctx.palette` | named sRGB colours (`core/materials.js` PALETTE, the **Petersburg palette**: `docs/LOOK.md` lists every key). Local colours from the research docs are fine too |
| `ctx.tex.draw(w,h,(g,w,h)=>{...},{key,repeat})` | canvas texture; `ctx.tex.sign({...})`, `fitText`, `roundRect`, `FONTS` (`sans, serif, round, hand, en`: Noto Sans / Rubik / Caveat, loaded before build; Cyrillic included). <= 1024 px, reuse via `key` |
| `ctx.kit(parent)` | `box(w,h,d,mat,[x,y,z],[rx,ry,rz])`, `boxB` (bottom at y), `rbox`, `cyl(rTop,rBot,h,mat,pos,rot,seg)`, `sphere`, `plane` (faces +Z), `mesh`, `group(pos, rotY)`. Sets cast/receive shadow |
| `ctx.geo` | `G` shared unit geometries, `extrude(points2D, depth)`, `catenary(a,b,sag,seg)`, `mergeGeometries`, `mergeMeshes` |
| `ctx.wires.add(points, {width, color})` | thin lines (overhead wires, catenary, cables, ropes). Screen-space-aware ribbons, one draw call for the whole scene |
| `ctx.physics` | `addBox(cx,cz,w,d,rotY,y0,y1)`, `addAABB`, `addCylinder`, `addWalkBox(cx,cz,w,d,rotY,topY,bottom)` (floors / steps / platforms), `addWalkRamp`, `addStairs`, **`addEscalator`, `addConveyor`, `addHole`**, `addFromObject`, `addDynamic`, `groundHeight`, `surfaceAt` (see `docs/UNDERGROUND.md`). Building colliders are thin wall boxes around the footprints (hollow inside). **Roofs are not colliders**: `core/roofmap.js` captures the drawn static scene top-down into a height map inside every ground-standing footprint, so the player lands on / walks over the surface that is drawn (F to fly, F again over a roof to land on it). Nothing to register: draw a roof and it is walkable; a wall, a step over 0.45 m or a steep crown blocks. Keep flat roofs flat, put parapets / plant rooms where they belong |
| `ctx.knock` | the **knockable street furniture** (`core/knock.js`, created in `main.js` before any module; absent in the headless tools, so **guard every use: `if (ctx.knock) ...`** and build exactly what you built before when it is missing). `register({ kind, x, z, y, originY, rotY, mass, h, r or (w, d), anchored, hitK, metal, minDv, item or items, parts: [{ mesh, index, hide? } or { obj }], onKnock })` -> record `{ state: 'stand' / 'fly' / 'rest' / 'lost', ... }` or `null`; `listen(fn(record, body))` (seated people, perched crows); `list`; `stats`. Register **during the module build**, never anything built by `city/*` (baked colliders). A record may carry many parts (a signal pole + its head and lens instances). Build the instances with `knockInstances` (`world/lib/knock-inst.js`); contract: [DRIVING-COLLISIONS.md](DRIVING-COLLISIONS.md) and [PERFORMANCE-CONTRACT.md](PERFORMANCE-CONTRACT.md) |
| `ctx.zones` / `ctx.interact` / `ctx.ui` / `player.board` | indoor lighting zones, "[E]" prompts, modal panels, train rides: **`docs/UNDERGROUND.md`** (the metro module reads it fully; everyone else needs only `ctx.interact.add` for "[E] enter / take" prompts) |
| `ctx.noOutline(obj)` | layer 1: excluded from the outline pass. **Required** for alpha cut-outs, particles, water, vertex-animated meshes, decals |
| `ctx.noBatch(obj)` | exclude static meshes from merging |
| `ctx.rng(seed)` | seeded PRNG (`r()`, `r.range`, `r.int`, `r.pick`, `r.chance`). Never `Math.random()` |
| `ctx.shared` | `uTime`, `uWind`, `uGust`, `uSunDir`, `uNight` (0 day ... 1 night), `uIndoor` (0 outside ... 1 in an indoor zone) - share these uniforms in custom shaders |
| `ctx.sunDir` | direction TO the sun (`layout.SUN_DIR`; the look work retunes the sun path) |
| `ctx.audio` | `loop(name,{position,volume})`, `play(name,{position,volume})` (names in `src/core/audio.js`) |
| `ctx.player.position` | player feet position |
| `ctx.quality` | `{name:'high'|'medium'|'low', petals}`: scale particle counts |
| `ctx.services` | cross-module data (section 7) |

For a planar bridge or shore face, `ctx.physics.addWalkTriangle([[x,y,z], [x,y,z], [x,y,z]], thickness)` uses the exact visible triangle. It stores an ordinary ramp with an optional convex footprint: walking, driving, head clearance and roof exclusions respect that footprint, including the empty corners of its bounding box. Use the drawn slab thickness so boats can pass underneath. The existing collider codec preserves these optional fields; ordinary rectangular ramps keep their existing behaviour.

Shared building helpers (import from `./lib/massing.js`): `MeshBuilder`, `addPrism`, `addWalls`, `addCap`, `addPolyColliders`, `roofProfile` (flat / skillion), `ringFromFlat`, `polyBounds`, `polyCentroid`, `polyArea`,
`hash01`. Claims: `./lib/claims.js`. Road / building queries without a module: `L.roadsNear(x,z,r,{drivable})`, `L.nearestRoad(x,z,{drivable,named,maxDist})`, `L.isOnRoad(x,z,margin)`, `L.insideBuilding(x,z,r)`,
`L.buildingAt(x,z)`, `L.heightOf(b)`, `L.areaAt(x,z)`. Procedural trees, people rigs, cars, props, facade work: copy from `../101_3d_yakutsk/src/world/**` / `../100_3d_moscow_city/src/world/**` into your own module folder and retune.

## 3. Coordinates, datums and the map

Metres. **+X east, -Z north, +Y up; the map is north-up.** Origin = 59.932421 N, 30.351279 E (`data/city.js` `ORIGIN`): the `ll` of the Yandex URL, on the Nevsky roadway at Mayakovskogo ul. — NOT the middle of the play area.
Model forward = local **+Z**; `rotY` as in three.js (0 faces south / +Z, PI north, +PI/2 east, -PI/2 west). Camera yaw (degrees): 0 = north, 90 = west, 180 = south, -90 = east (`L.yawToward(x0,z0,x1,z1)`).
`L.rotYBearing(deg)` = rotY of a model whose front faces a compass bearing.

* **The city is flat (street level y = 0)**. Drawn layers: ground 0 < footways 0.02 < asphalt 0.03 < decals 0.04; **granite kerb 0.15, pavement +0.12 m (`L.SURFACE`)**. Pavements are visual only: the player's feet stay at y = 0
  (**never add walk boxes for kerbs / pavements**). The Fontanka lies in a trench: water surface **y = -3.2** (`L.RIVER_Y`), granite walls from -3.6 to 0; `L.heightAt` is the bed (-4.6) inside the river polygon (nobody walks there:
  the quay walls are solid; the bridges are walk-box decks). The metro lies 51-64 m BELOW (`L.METRO_DEPTH`): `docs/UNDERGROUND.md`.
* **Play area** `L.WORLD.play` = x -595...835, z -405...1060 (the whole screenshot ground plus the Moscow station complex and its 520-640 m platforms to the south); data extent `L.EXTENT` = play + 120 m of scenery (everything in `data/city.js`
  is clipped to it). Beyond the extent the world must still look like Saint Petersburg to the horizon (environment far scene).
* **The grid is not axis aligned.** Nevsky runs at bearing 103.9 deg (WNW-ESE): `L.toGrid(x,z)` -> `{u,v}` (u along Nevsky to the ESE, v to the NNE, origin Vosstaniya Square) and `L.fromGrid(u,v)`. Ligovsky / Marata ~17 deg,
  Liteyny / Vladimirsky ~1.5 deg (almost N-S). The **Moscow station faces NNW (facade normal bearing ~348 deg)** with the obelisk on its axis; its tracks run SSE (bearing ~167 deg).
* **Start pose** `L.HERO` (provisional, tuned later): Vosstaniya Square in front of the station. `L.VIEWS` keys 1-5. Every pose is a free spot (`node tools/layout-test.mjs` checks it).

```
Hero City obelisk w1214651508 (36 m)        (592, 165)    on the island between the two Nevsky carriageways (north carriageway eastbound z~145, south westbound z~190)
Moscow Railway Station r2404499 (parts)     (612, 305)    facade z~250, clock tower base r16492039 (602, 246) (32 m tower, 36 m with the rod), ticket hall w662697920 (650, 417), canopy w662697923
Station platforms (6, tracks 1-11)          heads z 414-484, run SSE to z 936-1055; platform polygons PLATFORMS (refs 1, 2;3, 4;5, 6;7, 8;9, 10;11); rails RAILS
Hotel Oktyabrskaya r1598177                 (648, -1)     Nevsky / Ligovsky corner, 6 levels
Metro vestibule Ploshchad Vosstaniya w28962850   (516, 92) 1955 rotunda with a spire; entrances n318455877 (535, 95) / exit n318455870 (496, 89); station platform (431, 275) depth 58 m (line 1 red)
Metro Mayakovskaya (line 3 green)           platform (359, 212), depth 51 m; entrances in Nevsky Atrium r15081493 (196, 93) / (216, 115)
Metro Dostoevskaya (line 4 orange) (-304, 623) depth 64 m; Vladimirskaya (line 1) (-220, 717) depth 55 m; entrances near (-277, 465) / (-187, 532)
Nevsky Centre r1784115 (443, 39) · Yusupova house w60196034 (-52, -33) · Menyaev house w60195756 (62, -17) · Dom Kozhevnikova r3323319 (-129, 39)
Anichkov Bridge deck r5537267 (-441, -93)   54.6 x 37.9 m; Beloselsky-Belozersky Palace r1588865 (-374, -30); Fontanka centre line RIVER (54 m wide)
National Library r3801087 (-334, -311) · Mariinsky hospital w60353337 (-102, -295) · Vladimirsky Cathedral w38611014 (-165, 470) + bell tower w38611013 (-155, 413) · Tolstoy House r1588827 (-517, 335)
```

All from OpenStreetMap, baked once for the whole city by `tools/bake-osm.mjs` and then clipped to the strip by `tools/strip-data-*.mjs` (`data/city.js` header explains every export; `docs/reference/DATA-REPORT.md` counts and gaps of the un-stripped extract; see [STRIP.md](STRIP.md)).
Counts: ~1500 building records (1280 outlines + 215 parts), ~4300 road ways (many are service / footways / arches), 3200 doors, 3700 POIs, 12 metro entrances, 24 trolleybus route records, 43 rail ways, 16 platforms.
**Heights**: only 1.7 % of the buildings have a `height`, 66 % have `building:levels`, 32 % nothing: **use `L.heightOf(b)`** (era tables of `docs/research/architecture.md`: a 5-level rent house = 21 m cornice, 6 = 23.5 m cap) and never `levels * 3.3`.
Landmarks get their real heights from the research docs. Door nodes lie exactly on facade edges: push things 2-5 cm out. OSM trees / lamps are sparse: scatter procedurally on `GREEN`, along the embankment, in courtyards and where the research says.
`ROADS[].tunnel` is 1 also for building passages (arches) and metro underpasses; `layout.js` ignores them in its queries. **Nevsky is two one-way carriageways** (the obelisk island between them near the square).

The Yandex screenshot was the layout truth for the pattern of streets and buildings of the first build (it is not in this repository; `tools/overlay.mjs` that compared a top-down render with it was removed).

## 4. The facade shader (glass blocks)

`ctx.mat.facade({ glass, glassLit, frame, spandrel, bay, floor, mullion, transom, spandrelH, reflect, lit, blinds, mech:{every,h,offset}, streak, sparkle, grad:{bottom,top,height}, metal, side, seed, name })` returns a cached
ShaderMaterial that draws one window bay per unit cell of the mesh's **uv = (bay index along the wall, floor index)**. Build walls with `addWalls` / `addPrism` (`massing.js`) passing the same `bay` / `floor` you give the
material. In Saint Petersburg use it for the few glass-and-steel infill buildings (Nevsky Atrium, the station's 1970s light hall, modern offices); **stucco facades with painted surrounds are `ctx.mat.toon` with canvas textures
or the city module's own wall shader** (`src/world/city/wallmat.js`). Custom shaders must include the fog chunks (`fog: true`, `#include <fog_*>`), never use PBR, and must not add vertex attributes other than
`position/normal/uv` (the batcher only keeps those).

## 5. Look (cel shading) and Saint Petersburg rules

* Materials from `ctx.mat` only (custom ShaderMaterials allowed for special effects). No `MeshStandardMaterial`. Outlines are automatic (screen-space, colour-aware): chunky, readable silhouettes, avoid noisy micro-geometry.
  Shadows are blue-grey (cool sky ambient). Darkest albedo ~ `#33384a`, keep albedos <= ~0.92 brightness; saturated colour only for accents.
* **Colours of Petersburg**: stucco in muted pastels with white or cream trim: ochre / pale yellow `#e3c288`, terracotta, salmon / dusty rose, mint / grey-green, peach, sand, orange-brown, grey-olive, pale blue; grey and pink granite
  plinths and quays; green / red / grey sheet-iron roofs; black cast iron (lamps, railings, bollards); the station is sand-yellow with white columns, the Anichkov Bridge pink-red granite with green mermaid railings, the Beloselsky Palace coral pink.
  Exact values: `docs/research/{architecture,nevsky,station,fontanka,streets}.md` and `docs/LOOK.md`.
* The street wall is **continuous** (cornice 17-26 m), courtyards behind arches, tall windows with white frames, shopfronts with dark-red awnings and sign bands, **trolleybus wires on facade cross-spans**, black chain bollards, flower-bowl lamps, navy street plates.
* Light: a summer day at 60 N (sun path in `docs/research/streets.md`; the look work sets the day / dusk / white-night cycle: do not retune `core/sky.js` or `core/timeofday.js` from a module). Sky: cumulus on blue, sometimes milky grey.
* **Text: real Russian**; plain wordmarks and generic pictograms only (**no corporate logos or trademarks**: shop names from the lists in `docs/research/streets.md` / `architecture.md`; the metro "М" is drawn as a plain blue-lettered M pictogram).
* Scale sanity: door 2.1 x 0.9 m (arches / gateways 3-4 m wide); storey 3.6-4.5 m (pre-1917), 2.8-3.2 m (panel); bench seat 0.45 m; person 1.5-1.85 m; lamp post 5-9 m; car 4.5 x 1.8 m (bus 12 m, trolleybus 12 m, articulated 18 m); obelisk 36 m; clock tower 32 m;
  metro escalator 100-130 m long at 30 deg, platform hall ~11 m wide.
* Life & wear: summer crowds on Nevsky (8-14 people per 10 m of pavement near Mayakovskaya-Vosstaniya), luggage at the station, buskers, boats on the Fontanka; but a tidy, restored centre.

## User content rules (explicit requests: they override anything in the research docs)

* **No flags in the scene for now**: no national / city / company / event flags, no pennants, no flag-bearing flagpoles (do not draw flagpoles at all), no tour-guide flags or flag-on-a-stick (guides carry a plain coloured umbrella or a bare pole-less sign instead), no flags on the obelisk / hotels / government buildings / boats / stations, no flag banners hanging from facades, no rail "flags". Plain street banners and signs are fine only if they are not flag-shaped. (Research docs mention flags; ignore those parts.)
* **No alarm sounds**: no sirens, no ambulance / police / fire-engine sirens or horns, no car alarms, no train horns / crossing bells, no alarm-like or harsh warning beeps (ordinary short **car horns are allowed**: the user confirmed they stay as in the engine) (`core/audio.js` modules: only calm ambience: footsteps, soft traffic bed, birds, water, a quiet metro hum, soft announcement chimes are fine). Emergency vehicles may stand or drive silently, **without flashing beacons** too (keep their plain livery).

## 6. Performance

The mandatory extension and verification rules are in
[PERFORMANCE-CONTRACT.md](PERFORMANCE-CONTRACT.md). Read them before adding a district,
copying a landmark helper or changing rendering/loading code. Historical budgets below
do not replace integrated frame-time measurements in the old centre and the new area.

* Budgets (triangles, indicative): environment 600k, streets 700k, city 1200k, rail 400k, landmarksA 500k, landmarksB 400k, landmarksC 400k, landmarksD 300k, **metro 1500k (underground: hidden from the street by tags, so it costs
  nothing on the surface)**, props 300k, traffic 500k, people 300k, wildlife 100k. Frame time target < 12 ms on a 3090 Ti on the street, < 6 ms underground.
* **The frame is CPU bound (draw calls, ~5.5 us each, every mesh counts 2-3 times: outline pass, colour, shadow)**: see `docs/PERFORMANCE.md` (numbers, how to measure, what the engine does for you: batching, `core/ndproxy.js`
  proxies for the outline pass, frozen static matrices, empty-mesh culling). Rules for modules: static meshes get merged by the engine, so do not flag `noBatch` without a reason (night-animated materials are one);
  keep per-frame animated things in `ctx.add` (dynamic root) and give moving InstancedMeshes a fixed `boundingSphere` + `frustumCulled = true` when they stay in a known area; do not use layers 2-4 (engine);
  `userData.noND = true` keeps a static mesh out of the outline proxies.
* Reuse geometries and materials (cached by args). `InstancedMesh` for anything repeated > ~40 times (lamps, bollards, benches, trees, cars, people). Instanced / dynamic meshes are not merged: keep their count low.
* Canvas textures: share via `key`, <= 1024^2, total <= 24 Mpx per module. Distant stuff (> 300 m) = simple. Depth precision: near plane 0.25 m on foot (grows with the eye height), far 7000: keep coplanar layers apart with
  `polygonOffset` and 2-5 cm of height (section 9).

## 7. Cross-module services (publish exactly these; consumers must tolerate absence)

```js
ctx.services.environment = { groundAt(x,z), trees: [{x,z,r,h}], green: [{id,kind,o,h}], quay: { water: -3.2, segments: [...] } }
ctx.services.streets     = { roads: [{id, pts:[[x,z]..], w, hw, name, oneway}], laneAt(x,z) -> {road,x,z,tx,tz,w,dist}|null, parkedSlots: [{x,z,rotY,kind}], crosswalks: [{id, pts, w}], stops: [{x,z,rotY,kind,routes}], wires: {...} }
ctx.services.city        = { buildings, triangles, entrances: [{x,z,rotY,bldg}] }              // entrances: rotY faces outward
ctx.services.rail        = { platforms: [...], tracks: [...], trains: [{id, kind, track, state(t)}], gates: [{x,z,rotY}] }   // people use gates / platform paths
ctx.services.landmarks   = { squareCentre: {x,z}, monuments: [{id,name,x,z,h}], flagpoles: [{x,z,h}], photoSpots: [{x,z,yaw,name}] }   // A / B / C / D merge into it
ctx.services.metro       = { stations: [...], entrances: [{id,x,z,rotY,station,kind}], ride(...), network }   // people use entrances
ctx.services.props       = { benches: [{x,z,rotY,len}], lamps: [{x,z,h}], bins, shelters }
ctx.services.traffic     = { vehicles: [{id, kind, x, z, rotY, speed}], parked: [{x,z,rotY,kind}], blockers() }   // people use it to keep off the roads
ctx.services.people      = { walkerPaths: [{id, pts, kind}], crossingBusy(crossingId) -> bool }
ctx.services.wildlife    = { birds, dogs }
```

## 8. Underground and the metro (summary; the full contract is `docs/UNDERGROUND.md`)

Everything the metro draws is **tagged**: `ctx.underground(obj)` (drawn only while the camera is below y = -2), street-side pieces that must vanish at depth `ctx.surfaceOnly(obj)`, always-visible bridges between worlds
`ctx.alwaysVisible(obj)`. The ground plane has holes only where a shaft opens. Zones (`ctx.zones.add`) give the interior its own light (no sun, flat warm ambient). Colliders underground need explicit y-ranges (default -300..400).
Other modules must not draw below y = -0.5 (the Fontanka trench excepted) and must not assume the sky is visible from below the ground.

## 9. Verify like you mean it

1. `node tools/check.mjs <module> [more]` -> must end `RESULT: OK`, within budget, no fixable warnings (check a landmark module together with `city` to test the claims).
2. `node tools/layout-test.mjs` -> `RESULT: OK` (group ids, free start / view poses, road helpers, areas). Re-run after touching a view.
3. Screenshots with the real renderer (headless GPU Edge/Chrome, ~5-40 s):
   `node tools/shot.mjs --only environment,streets,city,<module> --cams "hero;v2;x,z,yaw,pitch;x,y,z,yaw,pitch" --out shots/<module>/a --t 20` (4 numbers = walking eye height; 5 numbers = free camera; 6 = standing on the surface at or below y;
   names `hero`, `v1`..`v5`, `views`, `overview`, `aerial`, `top`; `--params "allcity=1"` ignores the claims). Then **look at every PNG with the Read tool** and fix what you see: floating / sunken objects, z-fighting, mirrored text,
   wrong scale, missing or inverted faces, harsh colours, clutter. Iterate; include close-ups (1-3 m), mid shots, the hero view and a high overview. Save into `shots/<module>/` only (git-ignored).
4. `node tools/smoke.mjs` -> walking, flying and landing on a roof; `node tools/under-test.mjs` -> the underground engine tests; `node tools/tour.mjs` -> a set of scripted screenshots (`--set splash` rewrites the loading-screen images).
5. Research with **real photos**: the researchers saved ~800 photos in the scratchpad `refs/<topic>/` (the research docs list what each shows; the lead tells you the scratchpad path). Compare your render with them side by side. Download more from
   Wikimedia Commons (`https://commons.wikimedia.org/wiki/Special:FilePath/<File_name>?width=1200`, send a User-Agent header, ~1 request/s); never put photos in the repo.
6. The map data is committed (`src/world/data/city*.js`, already clipped to the strip). The OSM fetch tools and the raw data of the whole city are not part of this repository (`tools/bake-osm.mjs` / `osm-lib.mjs` still encode the full-city frame rectangles and would regenerate the wrong parts: see [STRIP.md](STRIP.md)).

## 10. Z-fighting (the user asked for it explicitly: treat it as a bug class)

Depth is 24 bit; near 0.25 m on foot (growing with the eye height), far 7000: resolution at distance z is about z^2 / (near x 16.7e6): a layer 2 cm above another is safe to ~100 m, 5 cm to ~160 m.
**Never put two surfaces on the same plane**: no duplicate faces (a wall drawn by two modules or two parts of one building: check `dupOf` / `OVERLAPS`), no window / glass pane exactly on a wall (recess 3-5 cm), no decal closer than 2 cm to its surface
(+ `polygonOffset`), no overlapping coplanar roofs / decks / pavements at the same height (layers: ground 0 < footway 0.02 < asphalt 0.03 < marking 0.045 < pavement 0.12; platforms 1.1 m up), trim shared walls between adjacent parts,
keep floors / podiums / plinths off roof planes, split huge triangles into cells (float interpolation near the near plane). **The street wall is continuous: the shared party walls of neighbouring houses must not both be drawn**
(shrink 2-3 cm or draw one). Metro: tunnel linings vs floors, tiles vs walls, escalator steps vs their balustrade, train bodies vs windows, track bed vs rails. The tool `node tools/zfight.mjs` finds them in the real renderer
(header explains; `--grid 80,2 --quiet --params "tr=nopark,nomove&people=off&wl=nobirds"` is the static sweep; cameras inside cars / tree crowns give false alarms). Target: < 0.02 % noisy pixels in every frame that shows your module.

## 11. Gotchas

* The repo-root `.gitignore` is a Python template that ignores folders named `lib/ parts/ env/ build/ dist/ var/`; this project's `.gitignore` re-includes them (check `git status` shows `src/world/lib/`).
* **Colliders are thin wall boxes, hollow inside.** Anything that places the player or an NPC (spawn, views, landing, walker paths) must test `L.insideBuilding(x, z, r)` and `L.isOnRoad(x, z, margin)`.
* Everything drawn inside a footprint is walkable after the roof-map pass, and the roof map stores the **highest** drawn surface per 0.5 m cell: a flagpole, sign or antenna on a roof becomes an obstacle, a canopy becomes a floor.
* `ORIGIN` is not the middle of the play area (the obelisk is at x 592, the Anichkov Bridge at x -441). Do not centre things on (0, 0).
* `OWNS_GROUPS` is a **static** export (city / environment / streets read it before your `build` runs). Forgetting it leaves the blockout prisms inside your landmark (z-fighting walls).
* Debug URL switches: `?allcity`, `?nofog`, `?only=a,b`, `?tod=day|dusk|night`, `?cam=x,z,yaw,pitch` (or the 5/6-number forms), `?noroof`, `?stats`; `window.__ctx`, `window.__camera`, `window.__setCam(x,y|null,z,yaw,pitch)`.
* Headless runs: puppeteer + Edge (see `tools/shot.mjs`); with several agents at once the GPU is shared, so use few cameras per run. Windows: use the Write / Edit tools for Cyrillic files, never shell heredocs.
