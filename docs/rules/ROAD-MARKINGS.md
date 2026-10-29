# Road markings: the rule set and the audit

Code: `src/world/streets/markings.js` (`planMarkings` = the PLAN, pure data; `drawPlan` paints it), called from `surface.js buildMarkings` / `buildStopLines`; zebras `surface.js buildCrossings`;
tyre wear, the red bus lane of west Nevsky, kerb yellow, bay lines, bus-stop zigzag are other builders. Standard: GOST R 51256-2018 as used in Saint Petersburg (white paint only; yellow only on kerbs / zigzags).
**One rule per class of carriageway, never a patch per spot.** Change the rule in `markings.js` (`RULES`, `centreKindFor`, `edgesOf`), then run the audit.

## The rules

| marking | rule |
|---|---|
| nothing on | rank-0 ways (courtyards, service), living streets, pedestrian ways (`pedestrianOnly`), `skipDraw` ways, bridge decks drawn by the bridges module (`decks.js deckAt`) |
| centre line, two-way | T = lanes both ways. T >= 4: **double solid 1.3** (two 0.10 m lines, 0.10 m gap). T = 3: single solid 1.1 (0.14 m). T = 2: secondary and up (rank >= 3) solid 1.1; tertiary (rank 2) dashed 1.5; side street (rank 1) dashed 1.5 only if the carriageway >= 6.5 m. Carriageway < 5.5 m or T < 2: none |
| centre line, two one-way carriageways that meet (net.js `fillMedians`: Nevsky has no median) | ONE roadway: the shared edge gets the centre line of T = lanes of both (4+: the double solid), **drawn once** (`partnerDraws`: the lower-numbered carriageway draws where it has a lane range, else the other), at the middle of the two asphalt edges (`medOffsets`; they overlap by up to 1.4 m in the data) |
| lane lines | between two lanes of the same direction, dashed 1.5 (1 m dash, 3 m gap), lane >= 2.6 m wide. All dashes of one stretch are aligned (anchored at the start of the stretch). West Nevsky: the line of the red bus lane is solid 1.1 |
| edge lines | none along kerbs. A continuous 0.10 m line only between the lane and a parking pocket (pocket deeper than 1.8 m) |
| junction box | a junction of public streets (node with 3+ arms and a way of rank >= 1 besides this one, or a signalised crossing) is a no-marking zone: lines of the approach END at the stop line, the departure lines restart behind the far zebra: exactly the lane graph's trimming (`arm.dIn / dOut`, `lanegraph.js`; `edgesOf` repeats its shortening of short edges). A courtyard gateway is no junction: lines run through |
| zebra 1.14.1 | across every crossing in `net.crossings`; centre / lane lines stop 0.5 m before the bars and resume behind them (`nearCrossing(.., 1.0)`; line ends are refined to 2 cm) |
| stop line 1.12 | one continuous bar across all lanes of an approach, 0.4 m (0.6 m on primary streets), at the end of the lane range (1.5 m before the zebra when there is one), at every signalised approach and every give-way approach (`stopLines.give`: a minor street meeting a higher-ranked one). Approach lane shorter than 12 m (micro lane inside a junction complex) gets none |
| arrows | straight arrows 30 m before the stop line, one per lane, on approaches of the wide streets (rank >= 3, carriageway >= 10 m) |
| no stubs (`pruneStubs`) | after the rules ran, a solid centre / median / bus-lane piece shorter than 6 m (`RULES.stubMin`) is dropped unless BOTH its ends meet a stop bar / zebra / bridge deck within 3 m (`stubAnchor`) and it is >= 1.5 m long (`sliver`); the two lines of a double go together. A dashed stretch of which at most ONE dash shows (or 2 dashes with at least twice as many hidden under other asphalt) is dropped. Pocket (bay) lines stay |

## Audit (headless, no GPU, ~10 s)

```
node tools/streets-markings-audit.mjs [--near x,z,r] [--json file] [--verbose] [--strict] [--geom] [--legacy]
```

Prints: 1 road classes and the line rules per class + CONSISTENCY (same lanes / rank / width must give the same centre line); 2 COVERAGE of every rule (drawn / (asked - deck - zebra), hidden under other asphalt);
3 JUNCTION BOXES (centre / lane / pocket points inside a junction box); 4 stop bars of signalised approaches, zebras; 5 SHARED EDGES (exactly one median line per point: none / twice) and Nevsky piece by piece
(west x < -880, centre, east x > 150); 6 `--geom`: paints the plan and tests the geometry covers every solid line point. `--strict` exits 1 on failure (consistency, coverage < 92 %, box points > 0.05 %, signalised
approach without a bar, shared-edge gaps > 6 % / duplicates > 4 %). `--legacy` compares with the pre-2026-10-06 builder when `streets/surface.legacy.js` is present (it was removed after the rewrite was verified; the numbers below are from that run).

Verify with eye-level and top-down shots (`tools/shot.mjs`, e.g. Nevsky at Mayakovskogo `141,45,48,0,-90`, Vosstaniya Square `560,60,150,0,-90`, Anichkov `-420,45,-85,0,-90`, Liteyny `-179,45,-184,0,-90`, Marata `51,45,665,0,-90`).

## Petrograd side / Spit (2026-10-06, later the same day)

No rule changed: the regions P1..P5, V1, V2 are painted by the same rule set (the audit covers every way of the data; `--near x,z,r` narrows it). Two things of the network touch the paint:
* a tram reservation (`net.js tramReservation`, pedestrian-only) carries no markings, no stop bars and no zebras of its own;
* the asphalt patches between merged carriageways (`net.js buildStripPatches`) do not hide paint: `hidOf` asks `net.cover` with `skip`, which ignores the patches, so the one median line of a
  pair runs across them (coverage of the solid lines 95.2 % before and after; shared edges with exactly one line 92.2 %; 0 signalised approaches without a stop bar; ALL CHECKS PASSED).

## Vasilievsky Island (2026-10-07)

One rule added (open districts only, `markings.js tramHid`): **no centre line and no shared-edge (median) line within 2.6 m of a tram track axis**: the double track lies in the middle of the roadway (Sredny pr., Kosaya liniya, Gavanskaya: the
photos show flush rails with a dashed lane line on both sides and nothing between), the rails divide the two directions. The rule asks for no line there ('gate', counted as "not asked"); `tools/streets-markings-audit.mjs` skips the same
points in its "exactly one median line" check. Lane lines, pocket lines, stop bars and zebras are unchanged. The flush concrete-slab median of Nalichnaya ulitsa has no merged shared edge at all (the carriageways stay apart: each keeps its lane lines).

## Numbers (2026-10-06, whole city)

| | before | after |
|---|---|---|
| solid centre / median / pocket points the rules ask for that were painted | 74 % | 100 % (plan) |
| shared edge of paired carriageways with exactly one line | ~50 % on Nevsky centre (the double line vanished) | 94-96 % (rest: junction ends) |
| paint triangles inside junction boxes | 3672 | 887 (stop bars and zebra margins) |
| stop bars | 1697 per-lane bars (signalised) | 561 per-approach bars (signalised + give way) |
| markings triangles | 122 708 | ~106 000 |

## Wide junction interiors (2026-10-29, Birzhevaya ploshchad / Palace bridge)

At a junction complex (the 6-way node of Birzhevaya ploshchad -2507,-1104 with its neighbours: seven overlapping carriageways, links of 5-30 m between the nodes) the rules asked for lines on stretches that the
other carriageways' asphalt, the zebras and the partner share then cut into orphans: a 5 m piece of a double line, 1-2 m slivers of it, lone dashes (one dash of a lane line of a 6 m link). The rules stay as they are;
`pruneStubs` (markings.js, called at the end of `planMarkings`) removes the leftovers, see the "no stubs" row. `plan.dropped` keeps the dropped solid pieces, `rec.pruned` the metres, and the audit counts them out of the coverage denominator
(and out of the "exactly one median line" gaps).
Audit before -> after (`node tools/area.mjs <area> tools/streets-markings-audit.mjs --strict`): solid pieces dropped / dashed stretches dropped / centre-lane-pocket points inside junction boxes / solid coverage:
palace 359 / 124 / 21 -> 6 / 95.5 -> 95.4 %; admiralty 397 / 168 / 12 -> 0 / 95.5 -> 95.4 %; vasilyevsky 335 / 112 / 12 -> 0 / 97.0 -> 96.9 %; smolny 473 / 194 / 15 -> 6 / 95.0 -> 94.9 %;
vladimirsky 382 / 204 / 9 -> 6 / 94.1 -> 94.1 %; stop bars, arrows and zebras unchanged; the shared-edge "drawn twice" count falls (palace 718 -> 522, admiralty 449 -> 227, vladimirsky 1103 -> 865).
Markings are part of the baked street surfaces: a re-bake is needed to see this in the baked build.
