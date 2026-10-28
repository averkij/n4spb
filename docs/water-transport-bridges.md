# Water transport: the boat under every bridge, and bridge pillars that are solid (branch `wt-bridges`)

The owner's report (2026-10-28): "all bridges should be opened for boats under them, so the water area will be a union for water transport ... now at least the Prachechny Bridge and the bridge at pose -738.9, 1.8, -1055.5, yaw 492.5 are closed" and "boats should not go through the bridge pillars, because it is strange".

The pose is the 1st Engineer Bridge (`eng1`, centre -754.7, -1042, the Moika where it leaves the Fontanka), seen from the Fontanka looking south-west. The Prachechny Bridge is `prachechny` (-829, -1717, the mouth of the Fontanka). Both were shut for the same main reason (below); the Prachechny Bridge also had piers without colliders, the Engineer Bridge a dry crack across its mouth.

Oracle: `node tools/area.mjs <palace|smolny|admiralty|vladimirsky> tools/boat-passage-test.mjs [--quick] [--only=<bridge id>]`, `npm run boatpass` (all four). CPU only, 1-4 minutes per area.

## Why the bridges were closed (root causes, in order of how many bridges they shut)

1. **The deck colliders.** Every deck of the `bridges` module is a chain of walk ramps registered with `thick 2.5` (a car or a walker under a deck must not be caught by the road above). `drive/collision.js carContact` lets a hull pass under a ramp only when `top - thick >= car.y + hgt`. With the boat (`SPEC_BOAT.hgt` 0.95 m) that put the underside of a Moika deck 0.5 m under the hull top: Kazansky, Italyansky, Teatralny, Green, Pevchesky, Hermitage, Zimny 1/2, Eng1, Garden 1/2, Malo-Konyushenny, Swan Upper/Lower, Prachechny, Panteleymonovsky (the Fontanka at -3.2 only by luck: the Anichkov and Belinsky decks pass) and the whole Admiralty-Haymarket set were walls. The free water of Palace-Liteyny was 30-odd separate pieces (every canal cut at every bridge), now one body.
2. **Pillars without colliders.** Belinsky, Prachechny, the Palace Bridge, the Troitsky Bridge, the Liteyny Bridge (north-bridges), the east bridges of Smolninskoye and Vladimirsky, Obukhovsky, Izmailovsky, Pikalov, Staro-Nikolsky, Torgovy, Dekabristov, Matveev, the Blagoveshchensky Bridge and the south Fontanka bridges of Admiralty-Haymarket drew piers, cutwaters, ice-breakers and abutment feet and registered nothing for them (only the Anichkov Bridge had hand-made pier boxes, and those missed its abutment feet). A boat sailed through the stone, and in the Admiralty area it ended INSIDE the Obukhovsky piers.
3. **Water that the data cuts.**
   * *Quay wall across a canal mouth.* A canal polygon that ends on the long straight edge of another polygon (the Swan Canal on the Moika at the Lower Swan Bridge, the Kryukov Canal on the Griboedov Canal at the Staro-Nikolsky Bridge) has its short end edge dropped as an open join, but the long edge of the other polygon stood as a quay wall (collider and all) right across the mouth.
   * *Hairline cracks.* Where two polygons meet in an open join their edges are 0.1 - 1.4 m apart (the Moika / Fontanka mouth under the Engineer Bridge, the Swan Canal mouth, the T of the Griboedov and Kryukov canals at the Krasnogvardeysky Bridge): a dry crack in the middle of the river. A swimmer never notices, a boat's shore probes (9 points, 0.4 m margin) stick on it. The pose of the report was one of these.
   * *Part seams.* The Fontanka polygons of Admiralty-Haymarket end on x = -800 and x = -720 in the middle of the river and were walled there (cutting the Fontanka of the east: 37 000 m2 + 4 000 m2).
4. **Solid columns.** The four footbridges of New Holland registered a walk box down to y -6 (the bed); the castle bridges over the moat of the Mikhailovsky Castle are drawn as causeways with the soffit AT the water level (-1.2) and a walk box to -1.3.

## What changed

| file | change |
|---|---|
| `src/world/drive/collision.js` | `HULL_DECK_SLAB = 0.5`: for a FLOATING hull (`car.floats`) a ramp deck counts as a slab of at most 0.5 m below its surface, whatever its `thick`. Cars and walkers are untouched. |
| `src/world/drive/boat/handling.js` | `SPEC_BOAT.hgt` 0.95 -> 0.70 (the gunwale is 0.55 - 0.62 m amidships, the stem rises to 1.0 over the last 0.3 m). With the slab: a deck passes over a boat when its surface is >= 1.2 m over the water; the 2nd Engineer Bridge over the 1.2-m-deep moat (deck 0.1 - 0.3, parapet bays from -0.4) needs the lower hull. |
| `src/world/bridges/piers.js` (new) | `solidPiers(ctx, meshes)`: the pillars are taken FROM WHAT IS DRAWN. Wall triangles of the bridge meshes that cross the water surface in open water (nearly vertical, from under the surface to >= 0.5 m over it, >= 1.2 m from the bank) are clustered into pillars; a pillar becomes one oriented box (minimum-area rectangle of its hull) or, where that would wall off much more than the pillar covers (fill < 0.72), a row of 1 m boxes along its long axis. Range: the bed (-8) up to 1.6 m over the water: above the hull, far below any deck, so nothing on the deck is touched (the range of the Anichkov piers). A pillar that a solid already covers (>= 90 % of probes) is left alone, so the hand-made Anichkov piers stay. Piers are structure, not knockable. A lone wall (two distinct corners) becomes a 0.5 m thick box. |
| `bridges.js` (every `flush`), `landmarksTroitsky.js`, `landmarksC.js` (Anichkov, the feet only), `northBridges.js`, `eastBridges.js` | call `solidPiers` on the meshes they just built. A new bridge builder only has to do the same; the oracle names the one that forgets. |
| `src/world/environment/waterways.js` | (1) an `openMouths` segment that is SHORTER than the edge it lies on splits that edge at the mouth's two ends (only the piece along the mouth is open). (2) HAIRLINES: where the short edge of one polygon lies along the edge of another (the join tolerance of `coincides`), the sliver between them becomes a thin water polygon (`kind 'data'`, id `join*`; 3 in Palace-Liteyny, 12 in Admiralty-Haymarket, plugs excluded: a plug's short edge lies on the shore of the Spit). No new bank: every edge of the sliver lies along an existing edge. |
| `src/areas/palace/area.js`, `src/world/area.js` | `openMouths`: + the Swan Canal end edge on the Moika (-859.3, -992, -849.4, -997.8). |
| `src/areas/admiralty/area.js` | `openMouths`: + the Kryukov Canal on the Griboedov Canal (-2946.2, 1291.7, -2922.6, 1282.3); `clipLines`: + x = -800 and x = -720 (the Fontanka part seams). |
| `src/world/landmarksNewHolland/water.js` | footbridge walk box bottom: the drawn soffit (-1.15 granite, -0.6 timber, -0.5 flush) instead of -6. |
| `src/world/landmarksCastle/bridge.js` | the moat decks: soffit and collider bottom -0.45 instead of the water level (-1.2): a 0.6 - 0.8 m slab, the hull (-0.5 at the moat) passes under. Visible change: the marble faces of the three castle bridges end 0.75 m higher. |
| `tools/boat-passage-test.mjs`, `package.json` `boatpass` | the oracle. |
| `tools/water-reachable-test.mjs` | the pier boxes are not "plain solids" of the Troitsky audit (6); the car run of check 4 (4) picked its fence by a pseudo-random walk whose order changed when the number of fence records changed by 8 (the Swan mouth lost its wall): it now walks the fences in a fixed (x, z) order and takes only a bay with the trench behind it (the ground 3 m beyond is >= 1 m below the street: a bay at the approach of a bridge leads onto its deck). The oracle failed for a reason unrelated to the product. |

## Decisions (the judgement calls)

* **A deck lower than the hull.** Prefer the collider over the picture: `HULL_DECK_SLAB` leaves the visible decks as they are. The real arch soffits of the generic bridges are above the 0.5 m slab at the crown and near the abutments they are not: a boat that hugs the quay wall under an arch can show the windshield (1.34 m over the water) inside the vault soffit near the springing. Kept: the channel is open in the middle of every arch, the hull is below every deck, nothing is walled.
* **Moat of the Mikhailovsky Castle.** The only waterway of the live areas that is 1.2 m deep. The castle decks were solid causeways; they now have a real soffit (the picture changes, the collider follows it).
* **Ponds are no transport water.** The Tauride ponds and the garden pond of the Mikhailovsky Garden (with its footbridge) are separate bodies of the data. The oracle names them and does not sail them; they are not a union with anything.
* **Piers from the picture, not from a table.** A table per builder (7 builders, 5 kinds of pier) would go stale the next time a bridge is redrawn; the helper reads the triangles.
* **Territory.** A bridge whose far side lies outside the territory (the east approaches of Smolninskoye, the 2nd Engineer Bridge over the moat stub, Vladimirsky's south edge) is reported, not failed; a pocket that is joined to the main water only outside the territory (the L-shaped notch of Vladimirsky at -1045, 2160) is reported, not failed.

## The oracle (`tools/boat-passage-test.mjs`)

Builds the real modules of the area, then a 1 m grid of the play area: wet cells (`physics.waterLevel`, no hole, no building, in the territory), solid cells (`drive/collision.js carContact` with a 2.2 m square at the water level of the cell and `SPEC_BOAT.hgt`), a clearance of 1.5 m, components. Then:

* **a** every crossing (the `BRIDGE_ZONES` rows, the `services.bridges` list, and every deck of walk ramps / boxes standing >= 1 m over a wet cell) is sailed with the REAL `createBoatHandling`: a Dijkstra route through the boat-free cells that keeps to the middle of the channel, a pure-pursuit autopilot; it must arrive within 5 m of the far end with no `hit`, never off the water, not stuck (14 s without progress). "Closed" (a) = the two sides are different bodies of boat-free water (not joined outside the territory either), or no route exists in the window around the bridge, or the run does not arrive.
* **b** every pillar the bridges DRAW (wall triangles across the surface of open water, owners named `brg-*`, `bridge`, `troitsky`, `palace`, `north-bridges`, `east-bridges` ...; not pontoons / boats / leaf weights) has a solid within 0.3 m of >= 90 % of its samples; each is rammed from the best of 16 approaches at full throttle: a `hit` and the centre never inside the convex hull of the drawn footing. **b2** no invisible wall: every solid cell of a waterway, >= 2.5 m from the bank, has a drawn wall within 6 m (a collider wider than its pillar, or a collider with nothing drawn, is a wall of water).
* **c** the boat-free water of every body of waterway water (a connected body of wet cells that contains a waterway) is ONE body: a pocket >= 400 m2 cut off from the main part names the barrier (the point of closest approach).

Results (before the fix -> after, same oracle on `d616843` and on this branch):

| area | crossings sailed | before | after |
|---|---|---|---|
| palace | 26 (22 of the 24 rows: Bankovsky has no water in the territory, the Eng2 moat stub lies half outside; + 4 decks) | 19 of 39 checks FAILED (16 bridges closed, pillars, pockets) | ALL 56 PASSED, one body of 1.78 M m2 |
| smolny | 2 decks sailed (no row, no bridges module); 22 decks partly outside the territory or over the Tauride ponds are only listed | 2 of 7 FAILED (16 east-bridges pillars bare) | ALL 8 PASSED (17 pillars) |
| admiralty | 45 (32 of the 36 rows: 2 outside, 2 partial; 9 from the bridge list; 4 decks) | 32 of 65 FAILED (53 pillars bare, the boat INSIDE Obukhovsky) | ALL 94 PASSED, one body of 1.15 M m2 |
| vladimirsky | 10 (the Anichkov row, the south bridges of the bridge list, 2 more decks; 1 joined only outside the territory, 1 outside) | 6 of 21 FAILED | ALL 25 PASSED |

Other oracles: `boat-test` palace 28 / 28; `water` 22 / 18 / 17 / 16 passed (palace, smolny, admiralty, vladimirsky); `areas-test` 196 passed; `layout` OK; `golden` identical; `check.mjs --area-modules` OK for the four areas; `runtime-only-lint`, `import-lint` OK; `claims-draw`, `drive-collision-test` OK. Failing before and after, unrelated: `garage` (strip: "the garage must hold lada"), `knock-scene-test` (mast census 158, expected 115 - 125).

## Known limits and open risks

* **Look, not checked on a GPU.** The hairline polygons add up to ~20 m2 of water in slivers (same level as their neighbours); the castle bridges lose 0.75 m of marble face; the quay is open at the Swan mouth and the Kryukov mouth (the walls of the long edges are gone there). A `baked=0` shot of those four places is the one thing to look at.
* **Bake revision.** Sources of the bake hash changed (`environment/waterways.js`, the bridge modules): the committed bake of the four areas is stale for the revision check. Nothing in the bake products changes shape; a re-bake is for the revision.
* **Open leaves.** The oracle runs at t = 0 (both bascule leaves down). An open leaf only removes solids; the span between the hinge piers stays free. Not run.
* **Hull / windshield against a low arch.** See the decisions above.
* **Crossings the tool does not know.** It finds decks of walk ramps / boxes standing >= 1 m over a wet cell; a bridge drawn with no collider at all is not a crossing, but its piers are still checked by (b).
* The AREAS.md text of "The motor boat" still says the collision height is 0.95 m and that the Anichkov piers are the only ones; the lead links this file.

## One-line changelog text

Boats sail under every bridge of the four live areas and stop at their piers: deck colliders no longer wall a floating hull, the drawn pillars of every bridge are solid (new `bridges/piers.js`), the canal mouths and polygon seams that walled the water are open, the New Holland footbridges and the castle moat decks have headroom; new oracle `npm run boatpass`.
