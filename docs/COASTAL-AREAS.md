# Морские ворота and Округ № 65

The coastal work lives on `feat/coastal-areas`, isolated from the concurrent
Petrograd port in the original checkout. The first checkpoint is `b0c849e`
(fresh OSM data and initial territories). The integrated release is 7.0.0.

## Geography and scene content

| Planning map | Scene | Content |
| --- | --- | --- |
| 71, H | `morskie-vorota.html` | Kanonersky and Bely islands, port streets and basins, three surveyed floating repair docks, portal cranes and loose cargo, Epiphany Church, WHSD fairway crossings |
| 100, O | `okrug65.html` | Primorsky streets and residential blocks, Park 300th Anniversary, open fountain and granite lighthouse, mapped sandy beaches, Piterland dome, Fly Arena and its raised connector |

Source coverage was checked in the correct full-city project: two building
outlines for Sea Gates and about three percent of Okrug 65. Fresh OSM extracts
supply the missing territory; [data provenance](NEW-COAST-DATA.md) records the
queries, snapshots, coastline geometry and regeneration commands. The research
dossiers record primary references and photo-derived estimates:
[port and ship](research/sea-gates-landmarks.md),
[park and Piterland](research/okrug65-landmarks.md), and
[Epiphany Church](research/port-church-landmark.md).

The play territories follow B600, with small documented marine overlap bands
that give Gavan and Vasilyevsky distinct usable exits. A two-cell accidental
Okrug–Dekabristov overlap was removed. `tools/connect-coastal-areas.mjs`
discovers live neighbours and searches actual gate-machine priorities. Rerun it
after integrating the three Petrograd areas to connect their Okrug 65 border.
It preserves other gates and imposes the existing geometry and priority tests.

## Container ship easter egg

A neutral vessel inspired by the Hamburg Express class waits west of the
Kanonersky harbour, at **−8100, 3350**, heading 150 degrees. It is 399.9 m long,
61 m wide, with 4,862 individually instanced deck containers, a forward bridge,
separate aft funnel, hull and lashing details. There are no flags or company logos.

Walk or take the nearby motorboat to its starboard boarding point, approximately
**−8091, 3267**, then press **E**. **W/S** control thrust and reverse, **A/D**
steer, **Space** stops, **V** switches between chase views and the bridge,
**E** exits, and **R** returns the player to the scene start. Its inertia and
turning rate differ from the motorboat. The complete hull checks shores,
structures and bridge clearance; the model keeps its identity during hand-offs.
Blocked boarding-side exits cannot use a fallback inside the hull.

Shoreline probes follow the same hull stations as the model, including its
wide forward shoulders and square stern, at no more than 2 m along the
perimeter. Hand-off placement also checks the hull interior for dry ground or
terrain holes and uses full-size collision queries for distant piers. These
additional placement checks run when placing the ship, outside normal frame
updates; the ordinary motorboat keeps its existing probes and formulas.

## World and performance contracts

Water has a walkable bed and remains reachable by car. Accurate bay polygons
keep island holes dry and port channels open. Each area has a motorboat and one
purple Zhiguli. Loose port cargo, cranes, dock tower bays, furniture and bridge
railing panels use the shared knock system. Bridges provide matching visual
surfaces, physical ramps and height-aware driving queries; the two stacked
WHSD decks remain separate, with the documented 52 m lower navigation clearance.

Static landmark geometry uses cell batching and authored ranges. The moving
ship uses its own bounded LODs and full-size culling bounds. Park tree rejection
preserves mapped trees, rows and groves while leaving designed lawns open; its
32 m query buckets matched 94,418 reference decisions and reduced the measured
query run from 1,410 ms to 102 ms. Landmarks add no frame callbacks.

## Verification

`npm run coast` checks real geographic data, open water, bridge continuity and
grades, both physical WHSD floors, and the real ship's controls, collisions,
boarding, blocked exits, respawn and hand-off identity. These checks also run in
CI. Normal motorboat, knock, hand-off, car and area regressions remain in place.
The ship suite has 18 passing checks, including narrow-island contact at two
headings, reverse stern contact, blocked exits, and real hand-off refusal for
an interior terrain hole or an off-centre pier. The focused Palace motorboat
regression and pure hand-off suite each pass 28 checks.

The saved legacy car sequence includes one camera-occluded stopped frame
(`shots/coastal-car/drive_7_stopped.png`); its preceding cockpit and following
walking frames are clear. The car camera path is unchanged by the ship-specific
branches. This remains an observed legacy/harness limitation, with no
speculative shared camera change included in the coastal work.

The road-audit wrapper now reinstalls the selected area in child processes;
otherwise a coastal run silently audited the parked strip. Claims, surfaces,
markings, rendered views, z-fighting and final shipping bakes are verified at
integration. Measurements and reproduction commands belong in
[PERFORMANCE.md](PERFORMANCE.md).

The preceding data-only checkpoint contains 130 pending Petrograd files. They
are explicitly classified by `tools/classify-pending-area-data.mjs` until those
areas gain `area.js`; rerun it after merging their completed work. No pending
source files from that separate checkout were committed by this work.
