# Vasilyevsky-Okrug 7, cluster M1: the Spit, the University embankment and the knock work on the Academy (branch `vo-m1`)

Part of the fifth live area (`vasilyevsky`, docs/AREAS.md 15.v). Source modules copied from `102_3d_piter` commit `0568f7af`, one provenance line each.

## What was ported

| Module | Files | Sub-groups claimed (all in the territory) | Triangles (`check --area-modules`) | Colliders |
|---|---|---|---|---|
| `landmarksStrelka` | `landmarksStrelka.js` + 15 files | `exchange`, `rostral-columns`, `strelka-garden`, `strelka-descent`, `exchange-warehouses`, `customs-house` | 184,785 (BUDGET 213 k) | 681 (280 knock) |
| `landmarksUniversity` | `landmarksUniversity.js` + 13 files | `kunstkamera`, `academy-of-sciences`, `twelve-collegia`, `university-monuments`, `rector-wing`, `peter2-palace`, `novobirzhevoy-gostiny-dvor` | 57,786 (BUDGET 67 k) | 444 (135 knock) |
| `landmarksAcademy` (existing; the remaining parts knock-adapted) | `garden.js`, `square.js` | all five sub-groups were already claimed by `area.js` | 193,116 (was 192,706) | 544 (183 knock) |

Both new modules gate each part by `ctx.L.GROUPS.<module>` (fallback `groups.js GROUPS_LIST`) exactly as `landmarksAcademy.js` does; the claim keys are unique across the area's `GROUPS`. `landmarks-groups-check`: all 19 groups at 100 % of ids / osm ids, 0 problems.

Changes against the source (besides the provenance line and the claim gating):
- `landmarksStrelka/groups.js` exports `WATER_RINGS = [{ id: 'strelka-descent', key: 'neva', ring: DESCENT_RING }]` and `KEEP_OUT = [{ id: 'strelka', c: [-2519.2, -1286.7], r: 96 }]` (both were hard-coded in the source `environment/waterways.js`); `src/areas/vasilyevsky/rings.js` collects them into `WATER.ownerRings` / `WATER.keepOut` like the Academy pit. With the ring the descent is built in its real SUNK form (ramps down to the landing at -2.8 m, three steps into the Neva); `tools/strelka-descent-test.mjs` proves it.
- `area.js` (marker lines only): import, module, label, `GROUPS`, HUD rows (Rostral columns, Stock Exchange, Pushkin House, the Spit, Kunstkamera, Academy of Sciences, Lomonosov, Twelve Collegia), `TEST.claimed` (one row each), `PRUNE_SERVICES`. `tools/check.mjs`: two BUDGET rows. `src/world/lib/owns-table.js` regenerated (38 modules; it will conflict between the parallel branches: regenerate).
- No shared engine file was edited. `check --area-modules` of `palace` and `admiralty` (the two areas that build `landmarksAcademy`) is identical before and after: same triangles, mesh and collider counts per module and the same knock record counts (compared against `area-vasilyevsky`). The Academy garden / square / dom parts are built only where the area claims them (Vasilyevsky).

## World rules: what is breakable, what stays structure

Knock bays (`lib/fence-bays.js knockBays`: one thin collider + one record + the drawn section per bay):
- **Spit descent** (`descent.js`): the terrace parapet (90 bays, 0.57 x 1.05 m pink granite, collider 0.7 m thick, `y 0 .. 1.15`) and the thick outer parapets of the two ramps (48 bays, 0.6 x 0.95 m, rolling with the ramp slope) are drawn as bay sections and break (granite: mass 900, anchored 24 km/h). The retaining wall under the terrace parapet (`y -6 .. 0`, masonry) stays a structure. The source's invisible guard along the last landing step ("nobody walks on the water") is gone: a walker steps off the landing into the Neva.
- **Rostral columns** (`rostral.js`): the source's one solid disc of r 11.7 m round each island (a 23 m wide invisible "fence") is replaced by 24 bollards per column (`bollard` knock records, 250 kg, anchored 30 km/h, each with its own collider) and 24 chain bays between them (the sagging chain is one unit geometry stretched over the bay; collider 0.12 m x 1.2 m). Inside the ring the island is walkable once a chain is down. The column cylinder (r 5.4), the stepped base (box 10.4 m), the two figure pedestals and the two door blocks per column are structures.
- **Garden of the Spit** (`garden.js`): 12 benches and 8 lanterns are knock records (`knockFurniture`, the colliders kept as the record items); the 0.8 m hedge collider is a row of ghost bays (the drawn hedge stays when a bay is knocked, like the wing walls of the Blagoveshchensky Bridge).
- **Twelve Collegia garden fence** (`collegia.js`): plinth + pickets per 3.6 m bay, posts instanced, one collider and one record per bay (iron: mass 600, anchored 24).
- **Academy of Sciences portico railing** (`academy.js`): 7 bays between the columns (the podium front keeps its granite box, now only up to the podium floor `y 0 .. 2.8`).
- **Academic Garden** (`landmarksAcademy/garden.js`): the cast-iron fence (3 m sections, footing + panel; sections on the service road are ghost bays), its closed gate leaves (one bay each, breakable), the hedges outside the east fence (ghost bays), 8 benches (knock records).
- **Trezzini Square** (`square.js`): the pavement railing in front of the Trezzini house (bays), the 7 hemispheres and the 7 chained posts of the monument (bollard records; the drawn chains between the posts have no collider, as in the source).

Solid on purpose (structures, none breakable, none a fence): the walls of all buildings (`addPolyColliders`, `edgeColliders`); the Exchange podium with its stairs, ramps, the outer ramp wall (the drawn side wall of the ramps) and 44 columns, the cella; the Customs house; the Gostiny Dvor piers and shop wall; the gate wall of the University (w142418184, masonry on the embankment, away from the water edge); the granite podium front and the stair-flight cheek walls of the Academy of Sciences; the base of the Rostral columns; the two granite spheres of the descent; the Lomonosov, Sakharov and "genius" monuments, the Pushkin bust, the anchor and the memorial sign of the Spit, the column of 1847, the Klodt and Khetagurov pedestals, the Trezzini monument; the columns of the House of Academicians (`dom.js`); the trees. The Academy sphinx pier was already adapted (docs/AREAS.md 15.z).

Water rings added: `strelka-descent` (Neva, 53 vertices) and the keep-out `strelka` (r 96). The Academy pit (`sphinx-pit`, keep-out `sphinx-pier`) was already collected by `rings.js`; the Academy's `PAVED_RINGS` stay hard-wired in `environment/claims.js`.

## Oracles (CPU only)

- `node tools/area.mjs vasilyevsky tools/check.mjs --area-modules`: OK, no module error. environment 1,026,408 (was 1,152,944 before the claims: the Spit and the University take their generic content away; the foundation BUDGET of 1.33 M is now loose, the lead may tighten it), landmarksStrelka 184,785, landmarksUniversity 57,786, landmarksAcademy 193,116.
- `landmarks-groups-check`: OK. `layout-test`: OK. `claims-draw-audit`: OK, 1 warning (the sphinx steps way w628771368, as in Admiralty; no waiver for the new modules). `import-lint`, `runtime-only-lint`, `owns-table --check`: OK.
- `water-reachable-test --quick`: 16 of 17, the one failure is check 9 (the undrawn bridges: Uralsky, Nalichny, Smolensky ..., the bridge wave), identical to the foundation. Check 6 passes with no new `ALLOW` row; check 1 (no wall across water) passes with the descent ring as a water body.
- `tools/strelka-descent-test.mjs` (new, 24 s): 5 of 5 (the ring is Neva water and the descent is sunk; a walker goes down the ramp to the landing and into the Neva; the terrace parapet stops a walker from the garden and a knocked bay drops him onto the descent; the ramp parapet keeps him on the ramp and a knocked bay lets him into the Neva; bollards and chains of a Rostral column are records, a knocked chain opens the island, the base stays solid).
- `tools/knock-stands-test.mjs` fails on `vasilyevsky` at "a standing press kiosk" (the area has no kiosk; the test assumes the north, as noted for vladimirsky); not caused by this cluster.

## Open

- The Exchange construction fence w765373941 stays claimed and not drawn (the restoration is over).
- Not run, as asked: views-check, area-garage-check, crowd / traffic / people tests, any GPU or bake. No view pose was added for the Spit or the University (the foundation has the Spit view).
