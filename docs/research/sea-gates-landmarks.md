# Морские ворота: harbour landmarks and container ship

Researched and authored 2026-10-31. The harbour author owns the floating docks,
crane equipment, loose cargo and the operable ship model. The separate area/data
author supplies coastlines, water holes, roads, railways and generic buildings;
the Epiphany church is a separate specialist's building. Coordinates below use
the project's WGS84 projection from `tools/osm-lib.mjs`.

## Primary references inspected

- [Kanonersky Ship Repair Yard: docks and equipment](https://ksz.spb.ru/dock.htm)
  gives three floating docks: usable lengths 90 / 139.5 / 246.4 m, clear internal
  widths 21 / 24 / 35.4 m, and capacities 4,000 / 8,500 / 35,600 tonnes. Its
  [official dock photograph](https://ksz.spb.ru/pic/dock1.jpg) was downloaded and
  visually inspected: pale tall side towers, rust-red pontoon ends, narrow top
  walkways and handrails, repeated plate seams, square control huts and slender
  cream cranes. The docking channel has open water around the installation.
- [The yard's tanker docking project](https://ksz.spb.ru/project_docking_of_tankers.htm)
  confirms the distinctive large dock and the use of several dock cranes.
- [First Container Terminal, terminal operator](https://world.delo-group.ru/en/global-ports/pkt/)
  identifies portal/mobile harbour cranes and rail-mounted gantries. The authored
  port contains both open portal cranes and wide cargo gantries, without logos.
- [Hapag-Lloyd's Manila Express fleet specification](https://www.hapag-lloyd.com/en/services-information/cargo-fleet/vessels/vessel/manila-express.html)
  identifies the 2023 vessel, approximately 399 m long, 61 m wide and 23,664 TEU.
- [Port of Hamburg: Manila Express](https://www.hafen-hamburg.de/en/vessels/manila-express/)
  refines overall length to 399.9 m. Two primary gallery photographs were
  downloaded and visually inspected:
  [bow quarter](https://www.hafen-hamburg.de/site/assets/files/607182/9540120-69.jpg)
  and [stern aerial](https://www.hafen-hamburg.de/site/assets/files/607158/9540120-12.jpg).
  Recognisable details carried into the model are a dark hull with a red lower
  belt, sharply flared bow, almost rectangular transom, 24 container rows across,
  a forward white accommodation/bridge island with full-beam wings, a separate
  orange funnel island aft, red braced lashing bridges, lifeboats, foredeck winches
  and radar equipment. The photographs remain reference-only in the system temp
  directory; no photograph is shipped or copied into a game texture.
- [OpenStreetMap attribution and licence](https://www.openstreetmap.org/copyright).
  The fresh 2026-10-31 geometry is recorded in `landmarksSeaGates/survey.js`.

## Survey and authoring decisions

| Object | OSM identifier | Centre x / z | Authored treatment |
| --- | --- | --- | --- |
| Floating dock №3 | w537286433 | -7409.23 / 2824.28 | Pale twin towers, 21 m clear basin |
| Floating dock №4 | w537286434 | -7346.32 / 2809.40 | Longer twin towers, 24 m clear basin |
| Floating dock №5 | w537286435 | -7058.89 / 2420.83 | Largest twin towers, 35.4 m clear basin |
| Dock №5 cranes | n6991139132 / 133 / 134 | Surveyed individually | Three cream dock-mounted cranes |
| Ship anchorage | Authoring placement | -8100.00 / 3350.00 | Heading 150°, complete hull on open water |

Mapped dock envelopes include the pontoon/end structures and are larger than
the usable staple-deck figures quoted by the yard. The dock walls follow those
mapped long axes and outer widths; the usable clear basin follows the official
specification. All three basins remain open at both ends. The irregular chamfer
of the smallest mapped pontoon is simplified within its surveyed envelope.

Fifteen mapped crane rail strips supply the crane axes and quay locations:
w668685737, w668686694, w668687034, w668687516, w668687724, w668688108,
w668688311, w668691372, w668692045, w668692453, and w747160227 / 228 / 229 /
233 / 234. Crane stations along a strip are authored representative placements;
they are not a claim about a crane's current position on its rails. Existing
Baltic Shipyard crane strips farther north are left to their existing owner.

Container stacks occupy only surveyed yards w256736097, w136446403 and
w136355344, with wide access lanes. Every candidate footprint is checked
against the yard ring, playable territory, water, buildings and mapped roads;
a conservative 8 m railway clearance protects the rail corridor. Cargo colours,
stack heights and exact positions are authored because operating yards change.
There are no brand names, flags, pennants, banners or alarm effects.

## Scene contracts and performance

Every dock tower is split into approximately 12 m knockable bays, including
its handrails and any control hut. Each crane has four separate leg colliders,
so its portal stays open underneath; all four belong to its knock record. Each
two-, three- or four-tier container stack also has a knock record. Furniture is
built with the shared `knockInstances`/`knockBays` helpers: 384 m spatial cells,
finite authored ranges, and registration during the module build. The module
adds no frame callback. No water surface, shore polygon or bridge is replaced.

The ship is an intentionally fictional Easter egg inspired by the real class,
not a claim that Manila Express can enter this port or pass underneath its
bridges. It retains the ordinary boat control/interaction contract, a full-size
61 × 399.9 m hull, 16 m draft and 62 m collision height. Its shoreline probes
span the hull. Its slow thrust, reverse and rudder tuning provide a sense of
scale without changing the existing motor boat. Low bridges must stop the
container ship while the existing motor boat retains its normal clearances.

The model has 4,862 individually coloured container instances, plus a cheaper
stack representation beyond 1,600 m. Lashing/rail details disappear beyond
1,100 m. These are moving `THREE.LOD` groups with computed bounds and normal
frustum culling, rather than static sector registrations. Its geometry spans
exactly x ±30.5 m, z ±199.95 m and y -16…61 m. The helm view uses the forward
bridge; only its roof and the outside helmsman hide for that camera.

CPU checks before integrated review:

- `node tools/area.mjs morskie-vorota tools/check.mjs landmarksSeaGates` passed:
  107,624 triangles, two shared materials, 48 meshes including 44 spatial knock
  meshes, 409 colliders, 292 knock records, no frame callbacks; 160 ms build in
  this run. Records comprise 88 dock bays, 39 cranes and 165 cargo stacks.
- Ship construction/pose/view smoke passed: eight meshes including both LOD
  representations, 72,384 combined LOD triangles, 4,862 cargo instances, finite
  positions throughout and the dimension bounds above. Only one cargo LOD is
  rendered at a time.
- `node tools/area.mjs morskie-vorota tools/coastal-ship-test.mjs` exercises the
  real environment, harbour, church, bridges and drive together: wet and clear
  boat/ship starts, boarding interaction, thrust/turn/brake/reverse, helm and
  chase cameras, exit/reboard, R, full-size pier/bridge/shore contacts and vessel
  identity through a hand-off round trip. All 14 checks passed, including the
  ordinary-boat dock check and the blocked-boarding-exit regression.

GPU screenshots, integrated driving, shipping bakes and final performance are
the lead integration checkpoint; this dossier does not label CPU mesh checks
as visual approval.

The first integrated collision survey caught the original proposed anchorage
(-7731.7 / 3166.4): it was wet, but 55 WHSD bridge solids intersected the tall
ship. The replacement (-8100 / 3350, 150°) was checked against the real complete
environment, landmark and bridge colliders: every footprint probe is wet and
inside the area, with zero solid contacts. A centre-only water check would have
missed this failure.

The integrated claims audit also found two representative crane stations
inside warehouses w53500995 and w722994569. Portal centres and all four feet
now reject mapped building footprints; the boom chooses the closest water side
out to 130 m, rather than arbitrarily reversing when neither side is wet at
30 m. The narrow crossing rail strip w668687516 is left unclaimed because its
surviving crane stands outside that polygon. The final complete-area audit
reports all 20 harbour claims drawn, no geometry deep inside any unclaimed
building, and no harbour warnings. This does not claim the warehouse buildings.

## Transition integration

The B600 raster receives three explicit overlap refinements through
`tools/marine-data-territory.mjs`: x -6880…-6320 / z 1120…1520,
x -5360…-4880 / z 1440…1520, and x -8080…-6560 / z 800…1440. The first two
remove dead boundary notches. The last gives the Gavan transition its own
working border: without it Gavan and Vasilyevsky compete for almost the same
points and no priority can let both fire at half their working run-ups. The
additional northern strip received a fresh OSM supplement down to z 680,
including the usual 120 m scenery margin. The final Sea Gates territory is
56 canonical rectangles, 16.0128 km² after the final wet-route corner repair.

`tools/connect-coastal-areas.mjs` creates reverse edge pairs for every live
coastal neighbour and searches their order using the real gate state machine.
The current neighbours are Vasilyevsky, Gavan and Kolomna; all six lenses pass
the unchanged 1,000 m working-boundary, 300 m dead-strip and 10% bounce rules.
The longest dead strip is 280 m and the largest bounce share is 7.3%. The full
`tools/gates-test.mjs` run passed all 95 checks. Rerunning the connector after
the Petrograd island areas land discovers their new coastal overlaps without
editing a fixed list of neighbours.
