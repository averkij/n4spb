# Морские ворота and Округ № 65

The first coastal checkpoint is `b0c849e` (fresh OSM data and initial
territories), followed by the complete 7.0.0 build at `e2886b7`. Release 8.0.0
integrates the completed Petrograd port from `70b1d80`, connecting all 15 live
areas while preserving both branches' water, collision and hand-off changes.

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
discovers live neighbours and searches actual gate-machine priorities. The
combined release adds the paired Okrug 65 / islands seam, with 4.8 / 7.24 km
of working boundary. It preserves the Petrograd gates and the existing
geometry and priority tests.

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
Both sides have boarding prompts, including when an obstacle forces an exit
on the opposite side. Blocked exits cannot use a fallback inside the hull.

Shoreline probes follow the same hull stations as the model, including its
wide forward shoulders and square stern, at no more than 2 m along the
perimeter. Hand-off placement also checks the hull interior for dry ground or
terrain holes and uses full-size collision queries for distant piers. These
additional placement checks run when placing the ship, outside normal frame
updates; the ordinary motorboat keeps its existing probes and formulas.

Continuous real handling and the actual gate machine also pass ship crossings
in both directions on the marine/Gavan and marine/Vasilyevsky water seams.
All four destinations accept the complete hull directly, without moving it,
and preserve the container-ship identity.

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
The ship suite has 19 passing checks, including narrow-island contact at two
headings, reverse stern contact, blocked exits, and real hand-off refusal for
an interior terrain hole or an off-centre pier. The focused Palace motorboat
regression passes 28 checks, and the pure hand-off suite passes 31.

Water car arrivals stay in valid open water without a lane requirement. Dry
arrivals retain their aligned-road search. The marine car suite retains all
960 arrivals, with no HERO fallback; the Palace regression retains all 948.
The bounded walking search also finds Piterland's narrow free corner without
increasing its 60 m search radius or weakening physical-clearance checks.

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

The initial data checkpoint contained 130 pending Petrograd files. Those areas
are now live, and their temporary orphan classifications have been removed.
The combined build uses the completed port instead of copying unfinished
files from its working checkout.

### Combined Petrograd verification

The shared Yacht Bridge now has the same geometry and driving surface on both
the Okrug 65 and Islands pages: a 16 m navigation clearance, 16.4 m deck width
and a maximum 7.06% approach grade. Each page passes the same 57 physical car
poses. The Okrug–Islands overlap has reciprocal gates selected against the full
registry, including the other Petrograd districts.
The inner concrete dividers retain their trapezoid section as individual
collidable knock panels, alongside the breakable outer railings; they use
384 m cells and a finite 260 m detail range.

Integration also repairs two visible Kronverk defects: the printworks lamp is
on the pavement with its body, glow, pool, knock record and collider moved
together; the stadium's narrow stand now retains its road-clear seat panels.
A real knock test confirms the relocated 140 kg lamp still falls on collision.

Pure Petrograd water data now uses a repository-local triangulator rather than
importing the rendering library. Its output matches the previous triangulator
exactly for 350 polygons, 34 holes and 11,508 triangles. This keeps the layout
CI job independent of installed packages without changing the water geometry.

The claims audit inspects final geometry after all builders have completed.
It keeps creator provenance through reparenting, distinguishes fully covered
aggregate OSM parents from their parts, and applies a low but nonzero height
band to the mapped burned guardhouse ruin. Explicit parent/child buildings
retain separate ownership with a bounded 1.5 m child apron. Failure probes
still reject missing child geometry, a generic parent drawn outside that apron,
missing ruin geometry, and foliage substituted for a building.
