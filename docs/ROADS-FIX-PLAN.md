# FIX-PLAN: roads (furniture on the carriageways + non-asphalt surfaces) - plan critic, 2026-10-05

> Historical plan of the first build; its street names and counts refer to the whole city and some tools it lists were removed. The resulting rules are in `docs/AGENT-BRIEF.md` ("Road integrity rules") and `docs/rules/`; the audits that remain are `npm run roads | ribbons | markings | paving`.

Inputs: furn_report.md, surf_report.md, examples_report.md (+ their tools). Everything below was re-checked by the critic:
both tools were re-run on the current tree (reproduced: furniture 1,049 on road / 271 edge / 823 median<7.5 m; surface 72,989 offending samples, 66,994 not excepted),
the blamed code lines were read, 8 screenshots were viewed (a_0, b_0, b_4, whatif f_0, f_1, roadsurf a_0 ...), and extra probes were run (section 2).
Nothing under src/ was edited. Tools extended (not src): see section 6.

---------------------------------------------------------------------------------------------------------------------------------------
## 0. Verdict on the three reports

* All three agree on the two true generators and on their blame lines; numbers are consistent between reports (329/376/581 poles on asphalt; 1,724 corner patches; 872 pairs / 823 median objects).
* The two root causes that explain almost all of the user's poses:
  1. **`net.js fillMedians` is west-only (x < -880, rank >= 3).** Everywhere else two one-way carriageways keep a kerbed, paved strip between them; lamps, zebra poles, chain bollards and wire masts hang on the INNER kerbs
     (alongKerbs), and each carriageway's pavement strip (`walks.js`, 5.5-8.5 m wide) is only clipped by facades, so it overpaints the other carriageway. = poses 1 (Liteyny), 6 (Poltavskaya), 7 (Mytninskaya), also the lamp "ON the road".
  2. **`signals.js` approach poles / masts have no coverage test**, the offset is measured from the lane, not from the real asphalt edge (parking pocket, fillet) and the lane end itself lies in a foreign carriageway
     where `lanegraph.js` shortens both junction mouths. = poses 4, 5 and Mayakovskogo x Nevsky.
* Pose 2/3 is NOT streets: it is a landmarksA planter / bench / bin set (OWNER-OTHER).

### Conflicts between the reports and the decision

| topic | furn | surf | examples | DECISION |
|---|---|---|---|---|
| fillMedians scope | global, gap < 7.5, keep rank>=3 | global, rank >= 1 both sides | gap < 12, rank >= 2/3 | **global (remove WEST_FILL_X), gap < 7.5 unchanged, rank >= 1 for BOTH ways** (poses 6 and 7 are rank 1/2 pairs, rank>=3 would not fix them) **+ a pairing guard** (S1) so that two unrelated one-way streets are never merged. Do NOT raise to 12 m: Chernyshevskogo / Furshtatskaya / Zakharyevskaya / Ligovsky (12 m) / Obukhovskoy Oborony (10 m) are real boulevards; they are fixed by the pavement clip (S2) instead. |
| lamp spacing after merge | SPACING.A 36 -> 26 | - | re-seat lamps | **No spacing change.** After the merge every carriageway keeps its outer kerb row at 36 m = a lamp every 18 m on the avenue (same as the west Nevsky today). Revisit only if the night shot looks dark. |
| far-side-gap safety test in lamps / posts | add | - | - | **Drop it**: after S1 the remaining strips (gap >= 7.5 m) are real pavements after S2; a safety test would strip lamps from the boulevards. Only the OWN-way coverage test is added (F4). |
| brickRoad fix | - | y 0.026->0.02 AND polygonOffset -1.9->-1.6 (streets.js) | - | polygonOffset decides ties (the audit's own tie rule is 1.2 cm then polygonOffset), so BOTH edits are needed. paths.js is SURF's; the one-line streets.js edit is FURN's (F9). |
| quay rails vs asphalt | clip the pocket + skip rails | - | - | split: rails skip (environment/quay.js, OWNER-OTHER: environment is built BEFORE streets so `net.cover` does not exist there: use `L.roadsNear` layout widths) + pocket clamp near the quay (net.js, SURF: `L.shoreDist`). |
| stop-line / lanegraph.js (examples C3 iv) | - | - | never shrink dIn | **Out of scope** (traffic lane graph, drive-test risk). Probe shows 374 of 1,662 signalised stop points are > 1.5 m inside a foreign carriageway; most vanish with S1 (twin carriageways) and F1 moves the POLE regardless. Reported as an informational line by the audit (section 6); decision left to the lead (open question 2). |
| campus / Kazan landmark paving (surf RC7, examples C5) | - | clip or pedestrianOnly | clip | OWNER-OTHER, lead decides policy (open question 1); default below = flush asphalt, no 14 cm plinth. |

---------------------------------------------------------------------------------------------------------------------------------------
## 1. What is MISSING from the audits (found by the critic) and what was probed

| class | probe | result | action |
|---|---|---|---|
| metro entrances / shafts on asphalt (metro module is not built by the audits) | ENTRANCES 26 + SHAFTS 12 vs `net.cover` | 0 on asphalt | none |
| bus-stop shelters / poles (121) | cover test | 0 on asphalt | none (stops.js, barriers.js need NO change) |
| signalised stop POINTS inside a foreign carriageway (paint + where cars stop) | stopLines.signal, `net.cover(skip own way, noFillets) > 1.5` | **374 of 1,662** (472 > 0.5 m) | informational audit line + open question 2; S1 removes the twin-Nevsky share |
| parked cars in the roadway (traffic is not built; `parkedSlots` are data) | slots vs foreign asphalt | **176 lot slots (PARKING polygons) whose centre is > 1 m inside a rank >= 1 street** (e.g. Moika -954..-990,-1000; Lebyazhya kanavka); 687 more lie on rank-0 aisles (legit); 12 Moika parallel slots | **F8** (parking.js) |
| parked / driving cars, people | not built | people nav and props read `net.ways` hL/hR + fillets, so they follow S1 automatically (people/nav.js fastCover, props/world.js ROAD rings) | verify with `node tools/check.mjs people props` |
| corner patches drawn over another carriageway | in examples only | 1,724 patches / 28,900 m2 | S3, add to acceptance via the surface audit (fillet kind) |
| paint (zebra bars, stop lines, lane lines) hidden under paving | examples ex_audit9 only | 31,865 of 250,040 paint triangles, 558 zebra bars, 139 stop lines | consequence of S1-S3; acceptance = surface audit + the poses; no new tool needed |
| trolleybus wire masts / spans after the merge | read wires.js use | masts follow cover; spans are facade to facade; contact wires run over the KERB lane (right side, not touched by fillL) | `node tools/wires-test.mjs` is a hard gate |
| tram rails on the merged Liteyny / Vladimirsky | whatif f_1 | rails drawn in the asphalt, fine | none |
| baked data staleness | tools/baked-revision.mjs hashes every src/**/*.js (history: since 2026-10-29 the revision is per area, the hash of the dependency closure of the page, docs/BAKE-REVISIONS.md) | an src edit = the bakes of the areas whose closure contains the file are stale = procedural fallback | lead: `node tools/bake-scene.mjs --plan`, `npm run bake` + `npm run bakedcheck` as the LAST step |
| exit-code / whitelist semantics of the tools | read tools | furniture tool failed only on on_road, no whitelist; surface tool could not accept a documented residue | added `--allow`, `--strict`, `--extras-fail`, `--max-fail` (section 6) |

Not a defect (checked): doubled asphalt (same material), 2 cobble ways (see S8), kerbs across other carriageways (0.13 %), tree crowns, overhead arms.

---------------------------------------------------------------------------------------------------------------------------------------
## 2. Ordered work items

Legend: before -> expected after (tool numbers). Ownership: SURF = streets/net.js, surface.js, paths.js, walks.js, tex.js, style.js (+ docs/streets-api.md paragraph on fillMedians);
FURN = streets/lamps.js, signals.js, stops.js, barriers.js, extras.js, furn.js, wires.js, parking.js, streets/quay.js, src/world/streets.js (wiring); OTHER = files named per item.
Land in this order; items inside a stage are independent. **S1 first (it removes ~40 % of the furniture offenders by itself)**.

### STAGE A (parallel, then checkpoint commit "roads: merge paired carriageways, clip pavements, signal poles")

**S1 [SURF] net.js `fillMedians` (lines 488-519) - global merge of paired one-way carriageways**
* Remove `const WEST_FILL_X` and `|| w.x[0] > WEST_FILL_X || w.x[w.n - 1] > WEST_FILL_X`; `w.rank < 3` -> `w.rank < 1` and in the partner test `v.rank < 3` -> `v.rank < 1`. Keep `gap > -1.4 && gap < 7.5`, `!w.bridge`, `L.inRiver`.
* PAIRING GUARD (new, the critic's addition: the prototype produced 97 name-mismatch pairs, several unrelated, e.g. Poltavskaya x Mirgorodskaya, Bakunina x 2-ya Sovetskaya, Mayakovskogo x Nevsky link road): accept the partner only if
  `v.name === w.name || !v.name || (w.rank >= 3 && v.rank >= 3)` (the last clause = what already works in the west: Dvortsovaya / Admiralteyskaya, Vladimirsky / Liteyny, square arms), and the midpoint of the gap is not `L.insideBuilding`.
* Update the comment above the function and the "Nevsky west of Sadovaya" paragraph of docs/streets-api.md ("joined west of -880" -> "joined everywhere").
* Effect: median-strip objects with gap < 7.5 m **823 -> <= 40** (lamps 403, zebra poles 197, chain bollards 98, wire masts 31, props 52 disappear with the inner kerbs); surface RC2 median **30.4 km -> only gaps >= 7.5 m (exception)**; kerb stones between the carriageways disappear; double solid line is drawn once (surface.js already does it from `w.med`). Poses 1, 6, 7.
* Risk: `w.hL` grows by gap/2 -> `laneAt`, `crosswalks` (zebra spans the whole merged roadway, as in the west), people nav and props follow because they read hL. Lane graph is unchanged (uses `bnd`/`lw`). Triangles go DOWN (no inner kerbs, no inner strips).
  wires-test: gate. Visual check: 12 random new pairs outside the west (list them with `node scratch crit_med.mjs <root>` = scratchpad/crit_med.mjs prints every filled pair with names, ranks, gap) including all remaining name-mismatch pairs.
* Verify: furniture tool `median MEDIAN_STRIP/gap<7.5` <= 40; surface tool `kind=median` failing only with exception `wide-median`.

**S2 [SURF] walks.js `buildWalks` - clip every strip at the next carriageway** (after `reach = clearance(...)`, line 85)
* Rule: `for (let d = 0.6; d < reach; d += 0.6) if (net.cover(ex + nx*(KERB_W+d), ez + nz*(KERB_W+d), { skip: w }) > -0.1) { reach = Math.max(0, d - 0.6); break; }` (the existing `reach < 0.9` test then drops thin strips). Validated in whatif (+0.2 s build).
* Needed even after S1 for gaps >= 7.5 m (Ligovsky 12 m belt, Chernyshevskogo), service roads beside avenues, non-opposite neighbours.
* Effect: surface RC1 **34.2 km of carriageway under pavers/slabs -> ~0** (after S1+S2 whatif left 1,590 samples in total incl. S3-S6). Paint hidden under strips (13k triangles) returns.
* Risk: `reach` is part of the `dpKeep` thinning key (fine); chain-bollard test `a.reach > KERB_W + 1.2` now also fails on clipped strips (correct, no bollards on a strip that ends at asphalt).

**S3 [SURF] walks.js corner patches (line 201)**
* Remove `f.P[0] < -600 &&` so the guard runs everywhere (drops 1,656 of the 1,703 bad patches / 28,233 m2). For the ~47 residual: replace `continue` by a shrink loop: `while (Wc > 1.0 && (cover(qm) > 0.3 || cover(Q) > 0.3 || any arc point of seq > 0.3 with skip X.w,Y.w,noFillets)) { Wc -= 0.75; recompute qm, Q, k }` and skip when Wc < 1.0.
* Effect: **1,724 patches -> <= 5**; poses 6 and 7 (paver islands in the roadway) gone. Triangles down.

**S4 [SURF] paths.js `buildPassages` (line ~156) ribbon y `0.026 -> 0.02`, plus [FURN] streets.js `M.brickRoad` polygonOffset `-1.9 -> -1.6` (F9)**
* Effect: courtyard-arch ribbons no longer beat `pt-service`: **9.1 km -> 0** (validated). The ribbon stays the only surface inside the arch (no asphalt there).

**S5 [SURF] paths.js `buildAreas` (line 103) - carve raised footway / pedestrian AREAS and traffic islands where a carriageway runs**
* New optional 5th parameter `net` (default undefined = old behaviour, so landing order does not matter); use the prototype `capCarved` (subdivide to <= 3 m near roads, drop triangles with centroid `net.cover > -0.1`) for the RAISED branch and for `island`. [FURN] passes `net` in streets.js (F9).
* Effect: area-raised 1,092 m -> 116 m; islands (Tulskaya, Konnogvardeysky) -> only where no lane runs (the audit's `chevron/island` rows stay excepted by `island` flag in the furniture tool).
* Risk: triangle count + a few hundred; area polygons keep their vertical skirt (`wall`) - the skirt must not be drawn along carved edges (carve only the cap; the wall of the polygon outline is unchanged and still correct).

**S6 [SURF] paths.js `buildPaths` (line ~84)**: `net.cover(p) > 0.2` -> `> Math.min(0.2, 0.05 - w / 2)` (no part of the ribbon on asphalt). 693 m -> 0.

**S7 [SURF] net.js small data fixes**
* (a) `makeWay` line 146: `cobble: r.surface === 'cobblestone'` -> `cobble: false` (2 service ways, 117 m, x -1689..-1647; the user's rule "roads are asphalt" already holds for every other stone tag). Remove the dead `w.paved` branch only if trivially safe (leave otherwise).
* (b) `applyPockets` (line 287): skip / shrink the pocket (`parkL/parkR`, `hL/hR`) where the pocket's outer edge is closer than 0.8 m to the quay wall: `net.shore(x,z) < 0.8` with `net.shore = L.shoreDist` assigned at the top of `buildNet` (same pattern as the `facadeDist` test already there). Effect: quay posts/rails "on the road" **200 -> <= 15** together with O2 (Moika 95, Sadovaya 31, Tsaritsyn 24, Fontanka 16 ...).
* (c) `rawWays`: drop a vertex whose turn angle is > 150 degrees (the hairpin fold of OSM way w183489894 on Universitetskaya nab. at vertices 24-26, lamp at -2976.3,-739.7 was 4.3 m inside). Guard: only when both adjacent segments are shorter than 6 m. Check the lane graph / drive-test around that point.

**F1 [FURN] signals.js approach poles and mast arms (lines 101-143) - the biggest furniture item: 388 poles + 204 masts on asphalt (592), 24 leave a car < 3 m**
* Introduce a helper `clearSpot(a, lane0, s0)` used by pole and mast:
  1. lateral offset from the REAL asphalt edge: `off = max(lw/2 + KERB_W + 0.7, edgeRight(s) + KERB_W + 0.7)` where `edgeRight` = `wayAt(a.w, s).hR` (or `hL` when `lane0.dir < 0`) at the pole's own `s` (fixes the 119 poles in the arm's own parking pocket);
  2. accept the candidate only if `net.cover(x, z, {}) <= -0.5` (NO `skip`, fillets included), not `deckAt`, not `L.insideBuilding(x,z,0.3)`;
  3. else slide back along the arm in 1 m steps up to 30 m (`--simulate-fix`: 178 of 416 solved, median 3 m), else the nearest clear pavement spot within 14 m on the right-hand side (231 more, median 7 m), else skip (7).
* The mast must pass the same test with its own base; and everything that used `off` (arm length `len = clamp(hw + 0.6, 4, 9)`, head positions `d1`, ped sign `dd`) must use the REAL lateral distance from lane0 centre to the pole (`offReal`), with `len = clamp(offReal + hw - lw/2 + 0.6, 4, 11)`, otherwise a displaced mast gets heads that do not hang over the lanes.
* Mid-block poles (line 153) reuse the helper (same hR/hL fix; they already test cover).
* Heads still record `sig, ap` only, so state / countdown logic is unchanged. A pole that moved further than 8 m still faces the traffic (-t direction).
* Effect: SIGNAL_STOPLINE on road **592 -> 0**, edge 18 -> <= 10; every approach keeps a head except <= 10 documented skips (courtyard stubs). Poses 4, 5, Mayakovskogo.
* Risk: colliders move (drive-test); `heads` count unchanged +- 10; triangles +- 0; mast arms may lengthen slightly. Tests: `node tools/wires-test.mjs` (wire masts avoid signals via `avoid` list: passes graph.signals nodes, unchanged), `node tools/check.mjs streets`, `node tools/drive-test.mjs --nofuzz`.

**F2 [FURN] signals.js zebra poles (lines 166-185)**: `lat` must be taken at the pole's own `s` (`wayAt(c.road, c.s +- (half+0.9))`), then move outward in 0.2 m steps until `cover <= -0.65` (max 1.2 m) instead of dropping the pole. 50 on road + 72 on the kerb line (+ the 204 on median strips vanish with S1) -> **on road 0, edge <= 20**; the 29+64 "pocket" and 19 "fillet" cases keep their crossing signs.

**F4 [FURN] lamps.js (line 131)**: the own-way test: `net.cover(x, z, { skip: w })` ignores the own pocket / ramp: add `net.cover(x,z,{}) > -0.55` (own way included, at hL/hR of the sample) -> lamp skipped or moved 0.3 m outward. 13 on road + 49 edge -> **0 / <= 15**. Do NOT add the far-side test (see conflicts). Lamp light-pool and `lamps.list` follow automatically.

**F5 [FURN] extras.js `placeParkSigns` (lines 60-65) and `placeBaySigns`**: candidate `net.cover(x,z,{}) <= -0.5` else shift along the same way's kerb with `wayAt` (+-1 m steps up to 6 m) else skip. 35 on road + 7 quay anchor signs (env-quay-anchor-signs: O2) -> 0.

**F6 [FURN] wires.js `mastSide` (lines 81-90)**: after the final `+1.6 m` loop `while (cover(x,z,{}) > -0.5 && n++ < 8) step 0.6 outward`. 18 masts (16 in fillets) -> 0. Then `node tools/wires-test.mjs` (RESULT OK, 0 free ends).

**F8 [FURN] parking.js `planParking`**: skip a `lot` slot whose centre has `net.cover(x,z,{noFillets:true}) > 0.5` of a way with rank >= 1 (176 slots); keep slots on rank-0 aisles. `traffic` reads `parkedSlots` only as a list: fewer slots is safe.

**F9 [FURN] streets.js wiring (the only edits SURF needs there; all backward compatible)**: (1) `buildAreas(areaB, AREAS, (id)=>isOwned(owned,id), areaSkirt, net)`; (2) `brickRoad: ... polygonOffset: -1.6`; (3) nothing else: `walks`, `fillMedians`, `paths` need no new arguments. FURN applies these three literal edits; the code works whichever side lands first.

### STAGE B (parallel with A, files disjoint; checkpoint commit "roads: furniture of landmarks / quay / props off the carriageways")

**O1 [OTHER] landmarksA/square.js (lines 125-176) + common.js `wbox` callers**: `const offRoad = (u,d) => { const [x,z] = W(u,d); const st = ctx.services.streets; return !st || st.net.cover(x, z, {}) < -0.8; }`; skip every planter (146), bin (159), lamp3 (130), bench group, booth, advert pillar (`pillar(...)` at 609.5,171.5 and the forecourt one) that is not `offRoad`, drawing AND collider AND `Cc.svc.lamps` entry (they must not diverge). 30 landmark items (17 on Goncharnaya / Ligovsky / Nevsky / Vosstaniya Sq.) -> 0. Same one-line test in landmarksE/promenade.js:89, landmarksH/garden.js:125, landmarksD/house.js:89, landmarksTauride/paradny-courts.js:21 (6 items on a fillet). Poses 2, 3. Risk: the forecourt loses ~12 items; shot b_4/c_3 must still look furnished (benches along the facade at d=-14 stay: they are off the road).

**O2 [OTHER] environment/quay.js (gapAt / post and rail loops: lines ~400-420, 661, 690)**: also skip a post / rail piece whose footprint is inside the LAYOUT carriageway of a drivable road: `L.isOnRoad(x, z, -0.1)` (layout widths; `net` does not exist yet - environment is built first). Covers the 45 pieces across the Nizhny Lebyazhy, Fontanny, Panteleymonovsky, Prachechny, 1-y Inzhenerny bridges and Tsaritsyn pr. (the OSM `bridge:1` ways over canals with no `bridges/sites.js` zone) and the w3.8 Moika / Griboedov roads that run on the wall (free 1.1 m). The wall COLLIDER stays (nobody can fall in). With S7(b) quay rows 245 -> <= 15 (documented residue = real roads whose centreline lies on the coping).
  env-quay-anchor-signs (sign on road 5.3 m inside at 2252,830): move the sign to `shoreDist` side or skip when `L.isOnRoad`.

**O3 [OTHER] props/osm.js lines 49, 54, 59 (bench / bin / rack / post_box)**: `okPoint(f, 0.2)` accepts OSM nodes on rank-0 service lanes: shift the item 0.6 m off the lane axis away from the nearest way when `cover > 0.1`, skip if still covered (10 items on w4 service ways). Whitelist whatever remains with free >= 2.5 m (courtyard furniture).

**O4 [OTHER] landmarksKirochnaya/landscape.js (CAMPUS_ROADS loop, lines ~16-22) and landmarksF/garden.js (`P.cap(M.slab, ring, PAVE_Y...)`, line 31)** - surface RC7 (1.9 km). Default policy (change if the lead says "pedestrian"): the clinical-garden roads are real mapped service ways -> make them FLUSH asphalt: verge `0.04..0.095 -> 0.04..0.05`, road box top `0.145 -> 0.055` with an asphalt-named material (`lmK-asphalt`) so the audit sees `*asphalt*`; no 14 cm plinth. landmarksF: carve the Kazan slab cap where `net.cover > -0.1` for ways whose name is not `Казанская площадь` (Kazanskaya st, 120 m + 12 ways). Triangulated caps: reuse SURF's `capCarved` idea locally (do not import from streets/paths.js to keep ownership clean).
  Alternative for the lead: mark those ways `pedestrianOnly` (needs a streets.js hook = FURN) - NOT recommended (traffic lanes disappear).

**O5 [OTHER] environment/lawns.js (flowerbeds `env-flowerbed`, rims, coping at the Panteleymonovsky bridge end)**: skip a bed whose polygon centre is within a layout road (`L.roadsNear(x,z,0,{drivable:true})`) of rank 0..1; stop the coping at the bridge way. 250 m -> 0.

**O6 (optional, low value) environment/trees.js**: 39 trunks stand in parking pockets (street trees at the kerb are realistic). Accept as whitelisted residue (`--allow TREE`) unless a cheap fix exists: add 2.2 m to the road margin for rank 1-3 ways with w <= 7.5 that carry parking (needs the parking policy = net.js; do not duplicate it).

### STAGE C (lead)
* Re-run both audits, wires-test, check, drive-test, 8 poses, `npm run bake` + `npm run bakedcheck`, update docs/streets-api.md (SURF paragraph) and the module STATUS comment in src/world/streets.js (FURN, one line), commit.

---------------------------------------------------------------------------------------------------------------------------------------
## 3. Disjoint file ownership (no file twice)

| OWNER | files | items |
|---|---|---|
| SURF | src/world/streets/net.js, surface.js (no edit expected), paths.js, walks.js, tex.js, style.js (no edit expected), docs/streets-api.md (fillMedians paragraph only) | S1 S2 S3 S4a S5 S6 S7 |
| FURN | src/world/streets/lamps.js, signals.js, stops.js (no edit), barriers.js (no edit), extras.js, furn.js (only if a shared `clearSpot` helper is placed there), wires.js, parking.js, quay.js (streets), src/world/streets.js | F1 F2 F4 F5 F6 F8 F9 (S4b, S5 wiring) |
| OTHER | landmarksA/square.js + common.js, landmarksE/promenade.js, landmarksH/garden.js, landmarksD/house.js, landmarksTauride/paradny-courts.js, landmarksKirochnaya/landscape.js, landmarksF/garden.js, environment/quay.js, environment/lawns.js, environment/trees.js (optional), props/osm.js | O1-O6 |
| LEAD | tools/*, docs other than the paragraph above, baking, commits | stage C |

Cross-owner contracts: SURF exposes (a) `buildAreas(..., net)` optional 5th arg, (b) `net.shore` (L.shoreDist) on the network object; FURN promises only the three literal streets.js edits in F9. No other file is touched by two owners.
`ctx.services.streets.net.cover` is available to OTHER's landmark modules (they build after streets); environment modules must use `layout.js` (`L.isOnRoad`, `L.roadsNear`, `L.shoreDist`).

## 4. Risks / watch list
* Triangle budget: S1-S3 remove kerbs, strips and patches (net DOWN, tens of thousands of triangles); S5 adds a few hundred; F1 +-0. Check `STREETS_DEBUG=1 node tools/check.mjs streets` before / after.
* wires-test: S1 changes hL of ways with trolleybus wires (spans use facade rosettes, contact wires the kerb lane): run it after S1 and after F6.
* Traffic / lane graph: S1 and F1 do not touch lanes; S7(c) changes one OSM way geometry (check drive-test).
* People nav (`people/nav.js`) and props build from `net.ways` hL/hR: the former pavement medians become asphalt = walkers cross the merged roadway only at the zebras (the west already works this way). Run `node tools/check.mjs people props`.
* Baked data: every src edit invalidates it; the page falls back to the procedural build (about 10 s slower) until the final `npm run bake`.
* S1 pairing guard may leave a handful of paired roads unmerged (rank 1-2 pairs with different names, 12 pairs east): accepted residue, listed by the audit as `median gap<7.5`.
* F1 relocation can move poles up to 14 m from the stop line: acceptable (the head faces the approach), but the stop-line paint is unchanged.

## 5. Acceptance criteria (all must hold; run from D:/git2/agi-fun-tests/102_3d_piter)

1. `node tools/roads-furniture-audit.mjs --strict --allow GUARD_STONE,PROP,BIN,TREE --json furn_after.json` -> exit 0 where the allowed residue is documented:
   on_road <= 40 in total (guard stones 10 w4 gates, courtyard props/bins <= 10, trunks in pockets (optional) <= 39 if O6 skipped, quay rails on roads that lie on the coping <= 15); NO signal pole / mast, lamp, zebra pole, wire mast, park sign, landmark item or bridge-deck rail on the asphalt;
   `edge` 271 -> <= 60; `median gap<7.5` 823 -> <= 40; lot slots in a street 176 -> 0. (Extras line: signalised stop points in a foreign carriageway 374 -> report the new number; informational, see open question 2.)
2. `node tools/roads-surface-audit.mjs --cache <f> --max-fail 2170` -> exit 0 (<= 0.3 % of 723,041 samples, was 72,989 = 10.1 %). Residue listed per cluster in the report: only exceptions (wide-median >= 7.5 m, Palace Square field, Kazan Square way "Kazanskaya ploshchad", bridge decks) and the cluster notes the owners add to the plan. Kinds `carriageway` under pt-paver / pt-slab / pt-strip / pt-area-* / pt-brickroad / pt-cobble = 0; `fillet` patches = 0.
3. `node tools/wires-test.mjs` RESULT OK; `node tools/check.mjs streets` OK (0 errors, no NaN warnings); also `node tools/check.mjs people props landmarksA landmarksE landmarksH landmarksD landmarksTauride landmarksKirochnaya landmarksF environment` no errors; `node tools/drive-test.mjs --nofuzz` OK.
4. The 8 user poses (7 distinct; -185.7,1.5,-62.5,8.9,-1 appears twice) re-shot with `node tools/shot.mjs --cams "<pose>;..." --out shots/roads-final/p` (one job at a time, <= 4 cameras per run; the page uses the procedural build while baked data are stale) and visually clean:
   | pose | expected |
   |---|---|
   | -185.7,1.5,-62.5,8.9,-1 | one asphalt roadway with a double solid line, no slab strip, no flower-bowl lamp in the roadway (lamps on the outer pavements) |
   | 640.4,1.5,208.6,-130.4,-18.8 and 645.5,2.4,213.5,557.8,0 | no white planter / bins / benches in the Goncharnaya carriageway; the stop-line pole at 635.3,213.9 on the pavement |
   | 812.7,2.4,343.7,592.6,0 | no stop-line pole (821,347.3) or (820.7,351.6) inside the avenue; mast on the pavement or absent |
   | 1287.2,2.4,184,497,0 | no pole at 1280.9,186.4; no paver patches on Mytninskaya |
   | 1160.1,2.4,381,327.9,0 | continuous asphalt, no paver patches or brick ribbon on Poltavskaya |
   | 1298.8,2.4,165.8,326.1,0 | camera stands on asphalt, Mytninskaya = one roadway with the double line |
   plus 4 regression shots: Nevsky at Mayakovskogo (96,2.4,48.2,-100.3,-3), Ligovsky belt (285.7,1.7,962.5,-19.1,-3), Tsaritsyn bridge approach (-1170,2.4,-1000,102.1,-3), Razyezzhaya junction (-181,2.4,947,43.3,-3), and a night shot of the Liteyny avenue (lamps still lit on both outer pavements).
5. Triangle count of the streets module not higher than before (`STREETS_DEBUG=1 node tools/check.mjs streets`), build time within +0.5 s.
6. `npm run bake`, `npm run bakedcheck` OK, final commit(s). Suggested checkpoint commits (lead commits, owners never run git add/commit): CP1 after S1-S3 + audit tools; CP2 after F1-F9; CP3 after S4-S7 + O1-O5; CP4 bake + docs.

## 6. Tool changes made by the critic (tools only, no src)

* `tools/roads-furniture-audit.mjs`: new `--allow tok1,tok2` (on_road rows whose category or root cause contains a token do not fail; the count is printed), `--strict` (fails also on `median gap<7.5` rows and lot parking slots in a street), `--extras-fail`;
  always prints and exports (`extras` in the JSON) two new checks: signalised stop points inside a foreign carriageway (> 1.5 m, 374 now) and PARKING-lot slots inside a street (176 now). Verified on the current tree.
* `tools/roads-surface-audit.mjs`: new `--max-fail N` (documented residue budget; exit 0 when the failing samples are <= N).
* Scratch (not in the repo): `crit_med.mjs <root>` lists every merged pair of a src tree (works on the whatif prototype); `crit_probe_a2.mjs` the metro / bus stop / stop-line / parked-slot probes.

## 7. Open questions for the user / lead (default in brackets)
1. Hospital campus (landmarksKirochnaya clinical garden) and Kazan Square paving over mapped service / street ways: make the mapped ways flush asphalt [default], or declare them pedestrian-only (removes lanes)?
2. 374 signalised stop lines whose stop point lies in a cross carriageway (micro-gap junction clusters of Nevsky / Liteyny / Goncharnaya; lanegraph.js shortening): leave as is [default, not a prop/surface defect], or let a later pass change lanegraph.js (needs traffic regression)?
3. Pairs of one-way carriageways that the S1 guard cannot merge (different names, rank < 3): leave as paved strips [default].
