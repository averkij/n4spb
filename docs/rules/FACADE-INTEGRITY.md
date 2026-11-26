# Facade integrity: no see-through walls, no crossing labels (city module)

User reports 2026-10-06: "buildings with transparent parts" (poses `-363.5,1.5,579.8,-2.4,-5.5`, `-323.6,1.5,-44.7,125.1,-1.5`) and "labels on buildings crossed by each other, z-fights"
(`-328.9,1.5,553.7,20.3,9.6`, `-300,1.5,-33.2,-268,2.1`). Two root causes, found with two headless audits, fixed in the generator (`src/world/city/**`), not per building.
Read this before you touch `city/edges.js`, `walls.js`, `passages.js`, `shops.js`, `entrances.js`, `clutter.js` or add anything that hangs on a facade.

## 1. Root causes and the rules they gave

### A. Walls hid each other and left slits onto the hollow body

The city draws every house as a HOLLOW shell of one-sided wall quads (back faces are culled). A wall that is not drawn is a window onto the sky and onto the inside of the neighbours.

1. **Cracks between neighbours (the big one).** OSM nodes of a shared wall are rounded to ~0.1 m, so two houses that share a wall end up 2-12 cm apart. `edges.js` probed 12 cm in front of every wall, found the neighbour
   and hid BOTH walls (and the lower neighbour drew only above its own cornice): a slit 5-10 cm wide over the full height of the party wall, open to the sky at the street end (pose 2: the whole slit between two houses showed
   the courtyard behind). 254 000 audit samples (~26 km of wall) were affected. **Rule: a wall may only be hidden where the neighbour really touches it** (1.2 cm probe). Where the neighbour is within 12 cm but not touching,
   the part that stays hidden gets a plain blank LINER quad (`edge.liners`, `walls.js addLiners`: no wall record, no details, no collider, ~15 000 triangles in total).
2. **Sampling every 0.9 m lost the ends of party walls.** Runs shorter than 0.45 m were dropped, boundaries were only known to 0.9 m: slivers 0.2-0.9 m wide beside every party wall end showed through
   (the 30 cm slit in pose 2). **Rule: wall pieces come from EXACT intervals** (the probe lines cross the neighbours' footprint boundaries at computed parameters, every elementary interval is classified once), every visible
   interval down to 5 cm becomes a quad, and a facade piece narrower than a bay (0.9 m) is a plain blank wall (`walls.js blankQuad`, same for the remainder beside a carriage arch).
3. **Arches cut into raised parts.** A room over a passage (OSM part with `min_level`) got a carriage-arch gate cut into its wall; the arch spring line (2.55 m + radius) is above the part's top: the face collapsed to
   nothing (a hole over the passage, Bankovsky pereulok). **Rule: gates only on ground records** (`passages.js planPassages` skips `minH > 0.5`).
4. **Roofless twins.** `city.js dupSkip` removed the deck of the later twin of every same-footprint pair, but `prep.js` had already dropped the OTHER twin (`dupOf`): both lost the deck (w1185754667, w535381121).
   **Rule: a record only loses its deck when its twin is drawn by this module.**
5. Hand-built towers (`towers.js`, the City Duma tower) are occluders for their neighbours: their footprint edges count as faces in the audit (reason `custom-tower`).

### B. Facade labels crossed each other: a coordinate bug, not a z-fight

`walls.js addSubWall` writes `units[].s`, `units[].door`, `doors[].s` **local to `w.a`** (`w.a` already includes `w.s0`; `city-facade-test.mjs` asserts it). Checkpoint 44 changed `shops.js`, `entrances.js`
and `erkers.js` to `x = w.a + dir * (u.s - w.s0)`, i.e. it subtracted `s0` a SECOND time: every sub-wall that does not start at the start of its edge (walls longer than 30 m, party-wall pieces, the part beyond an arch -
a large share of all shop walls) got its shop signs, awnings, shop entrances, door steps and canopies shifted `s0` metres BACK, on top of the first sub-wall's: 6015 pairs of shop signs overlapped (35 % of all signs), most of the
rest hung over neighbours or the street. **Rule: `u.s`, `u.door`, `d.s`, `w.bal` bays are local to `w.a`; never subtract `w.s0`.** `tools/city-label-audit.mjs` measures "floating signs" (> 40 cm from the footprint edge of their own
building) and fails on them.

Facade slot allocation (new, `city/slots.js`, shared registry `ctx.services.labels`, `docs/rules/LABELS-API.md`):

| order | who | kind | rectangle (wall plane) | standoff |
|---|---|---|---|---|
| 1 | `streets/plates.js` (built before the city) | `plate`, `number` | their own | 3 cm |
| 2 | `shops.js` fascia sign | `shop` | W (6.2 / 5 / 4 / 3 / 2.2 / 1.8 / 1.4) x 0.62 at `yBand - 0.57`, W <= unit width - 0.15 | 3.5 cm |
| 3 | `shops.js` awning | `awning` | unit width, 1 m tall below the fascia; starts `proj + 0.1` m away from a wall CORNER (QUOIN flag), skipped when a wall stands < 1 m in front (slit between houses) | 3D box |
| 4 | `shops.js` address plate | `plate-city` | 0.62 x 0.32; skipped when streets already hung a `number` plate for the building | 4 cm |
| 5 | `entrances.js` canopy, steps | `canopy`, `steps` | 2.1 m; a door nearer than 1.2 m to a wall end / 2.7 m to a corner gets none; no two sets of steps within 2.4 m (any orientation) | - |
| 6 | `entrances.js` downpipes | `pipe` | 0.17 x height; nearest of (ideal, -1, +1) bay boundary that is free, else none | 12 cm |
| 7 | `clutter.js` AC units | `ac` | 0.74 x 0.46, >= 0.6 m from a wall end | 6 cm |

Rules: reserve BEFORE you draw, skip (or shift) when `reserve()` says no; two labels never overlap, so the standoff only matters against the painted wall shader (flat at 0); keep every standoff >= 1.5 cm and the
sign material's polygonOffset. A later module (props ads, clocks) asks the same registry. Never draw two things on one wall rectangle, never anchor a detail by a wall-relative number you did not check in `city-facade-test.mjs`.

## 2. Audits (headless, no GPU, seconds)

```
node tools/city-wall-audit.mjs                     # every wall edge has a face or an allow-listed reason; roofs, floors, winding.  --owned all|none  --near x,z,r  --json file  --list N
node tools/city-label-audit.mjs                    # shop signs / plates / awnings / steps / pipes / AC: pairwise overlap + floating items.  --near x,z,r  --list N  --max N
node tools/city-facade-test.mjs                    # unit / door offsets are local to the sub-wall
node tools/party-wall-test.mjs                     # indexed party-wall lookups of the landmark modules
node tools/check.mjs city                          # triangles (budget warning is old: 2.5 M), build time
node tools/zfight.mjs --only environment,streets,city --cams "x,z,yaw,pitch;..." --t 10 --quiet --out shots/<you>/z     # pixels
```

**Always pass `--only ...` to `zfight.mjs` / `qa-pick.mjs`** (or `--params baked=0`): without it they load `assets/baked/city-base` when its revision matches and you measure the BAKED (old) city, not your source.
Re-bake (`npm run bake`) after any `src/` edit, then re-run the pixel probe on the baked scene once.

Wall audit method (`city-wall-audit.mjs`): runs the city pipeline (prepare, describe, analyse, planPassages, buildWalls with a RECORDING builder) and, for every ring edge of every drawn record, samples every 0.3 m at three heights;
a point 2 cm outside the wall that is not inside another mass (drawn record, landmark-owned occluder, custom tower) is exposed and must have a face that `buildWalls` really emitted (same facing, 6 cm in front .. 30 cm behind the wall
line, covering that height). Allow-list (the only legitimate reasons; everything else exits 1): `arch-opening`, `embedded-sliver` (corner slivers <= 3 m of a wall hidden by an embedded neighbour), `below-raised`
(room over a passage / ground body), `low-steps` (records < 0.6 m), `custom-tower`, `landmark-owned`.

Numbers (whole map, 6003 records, 61 537 edges, 9.0 M samples): unexplained gap runs **10 751 -> 0** (254 017 -> 52 gap samples, the rest allow-listed slivers), roofless records 2 -> 0, raised parts without a body 23 (all over passages,
allowed). Label audit (play area + 50 m, 6199 buildings, 91 480 items): overlapping shop signs **6015 -> 0**, colliding items of all kinds 6015+ -> 2 (oblique-corner canopy / awning pairs, allow-listed by `--max 3`), floating signs 0.
Pixel probe, Nevsky sweep of 36 frames (procedural city): 427 noisy pixels in total, worst frame 0.005 %.

### C. Street wall or courtyard wall?
`edges.js` marks an edge as a street wall when a drivable road is within 11 m, or when it faces open public ground: AREAS polygons with `hw` square / pedestrian (2.5 m or 5 m in front of the wall). Before this, walls facing Konyushennaya Square (stables block, ~(-1400,-1024)) were courtyard walls (khaki courtyard colour, no shop fronts). Parking lots and service areas stay courtyards. `edge.street.square = true`, `road = null` for these.

### D. Landmark houses (`landmarks*/house.js sharedWall`)
The landmark kit hid a whole facade edge when 2 of 3 sample points were within 0.7 m of an antiparallel edge of any other building (and `partyOpts.tol` raised it to 0.6-0.7 m): cracks and partly shared walls left holes (the Beloselsky palace corner beside Nevsky 41, pose `-323.6,1.5,-44.7,125.1,-1.5`). Now all kit copies (B, C, D, E, G, J, K, Mars) use the CONTACT rule: an edge is a party wall only when ALL 9 sample points along it touch (1.2 cm) an antiparallel edge of a building at least as tall (`e.hc`); `o.tol` is ignored. Anything else is drawn (the wall inside a neighbour is never seen). `tools/party-wall-test.mjs` checks the indexed lookups against a full scan of this rule, including synthetic exact party walls, 5 cm cracks and lower neighbours. Modules without `house.js` (F, H, I, Castle, Garden, Tauride ...) draw every edge and need nothing.

### E. Claims
`city-wall-audit.mjs` also fails when a drawn city record is claimed by an owned landmark group (id or parent) or stands inside the footprint of an owned building (a part / raised part / synthesised `~f` base of a claimed house would keep drawing deck, railings and walls in the air). Today: 0. Remember that walls are one-sided: standing INSIDE a footprint (a teleport pose such as `-3382,1.7,128`, inside `w97546619`) shows only decks, balconies and railings, as if hung in the air.

## 3. Checklist for a new generator that draws walls or facade details

1. Walls: never hide a wall because a neighbour is NEAR; hide only on contact (1.2 cm), keep a liner for the near-but-not-touching part. Keep every visible interval >= 5 cm. Raised parts get no arch.
2. Anything that is cut out of or added to a wall is positioned in `w.a`-local metres. Run `city-facade-test.mjs`.
3. Reserve your rectangle in `ctx.services.labels` (or `city/slots.js labelRegistry(ctx)` in the city) before drawing.
4. Run both city audits and the pixel probe (`--only`) before you report. A new district: nothing to add, the audits walk the whole data.
5. A landmark module that draws its own walls next to generic houses: use the same contact rule for its `sharedWall` (`landmarksD/kit.js ringEdges` lookups) - the crack class applies there too (not audited here).


## Through passages and projecting masonry

Generate the facade opening, reveal, inner vault and side-wall collision from the same mouth on each surveyed facade. Both ends of a bent passage must join their respective facade planes. Retain narrow strips of masonry beside a gateway. Where a mapped lane crosses another building part, cut its wall and collision to the vault profile. At bends and junctions, trim the side lining and its collider together so both branches stay open. A building footprint may contain a drive-through lane. Check the clear width and trace a walker and a car from the street into the courtyard and back, including the inner mouth at (324.1, 53.5).

Give deep projecting pavilions and rusticated podiums their visible side faces and matching collision envelope. Inspect them diagonally at street height. Check the Beloselsky-Belozersky frontage near (-390, -64) and the Admiralty's east Neva pavilion from (-2315.7, -819.9), including the riverfront panorama.
