# `ctx.services.streets` - the road logic of Saint Petersburg (owner: `src/world/streets.js`, `src/world/streets/*`)

> **Strip cut.** The service contract is unchanged. The sections about Vasilievsky Island, Petrograd, Krestovsky, the islands rounds and the late-roads allowlist describe data and code that are no longer in this repository (the strip keeps only the OLD / W1 / N1 / W2a..e regions, see [STRIP.md](STRIP.md)); `tools/late-roads-ids.mjs`, `tools/islands2-*` and `docs/research/` mentioned below were removed. Counts (ways, lanes, lamps, crossings) are the whole-city numbers.

Everything below is plain data or a **pure function of the simulation time `t`** (seconds, the same `t` as `ctx.onUpdate((dt, t) => ...)`), so it is identical
in screenshots and in the game. The geometry is built once; nothing here changes at run time except what you compute from `t`.
Coordinates: metres, +X east, +Z south (north-up map). **Right-hand traffic.** Lane polylines are in the DRIVING direction. `rotY` follows three.js (0 faces +Z).
Read it with optional chaining: `const st = ctx.services.streets; if (!st) return;`. Build order: environment, **streets**, city, landmarks, props, traffic, people.
The network is made from OSM `ROADS` (drivable classes, no tunnels / arches / metro underpasses). **Almost every street is mapped as separate ONE-WAY carriageways**
(Nevsky = two adjacent carriageways of 3-5 lanes; Ligovsky, Marata, Vosstaniya st., Mayakovskogo ... likewise): `oneway` is 1 for them and the lanes follow the polyline.
Bridge ways (the Anichkov Bridge, `bridge: 1`) are part of the graph (lanes, connectors) but are **not drawn** while landmarksC owns them (`OWNS_GROUPS`).

## Roads and ways

| member | meaning |
|---|---|
| `roads: [{ id, pts:[[x,z]..], w, hw, name, oneway, bridge, rank, trolley }]` | every drivable way (OSM id, smoothed centreline, **carriageway width** `w` without parking pockets, highway class, name, `oneway` 0/1, `bridge` 0/1, `rank` 0 service / 1 residential / 2 tertiary / 3 secondary / 4 primary, `trolley` = trolleybus route refs on it). Service roads (courtyards) included. |
| `laneAt(x, z)` | `{ road, x, z, tx, tz, w, dist } \| null`: the drivable way under (x, z) (carriageway or its parking pocket), the centreline point and unit tangent. |
| `net` | the internal network (`streets/net.js`): `ways`, `nodes`, `fillets`, `crossings`, `kerbRuns`, `cover(x,z)`. Use `layout.isOnRoad` / `roadsNear` for simple tests instead. |
| `tram` | `[{ id, pts: [x,z,...] }]` the OSM tram rails (flush decals in the asphalt; only on Ligovsky south of Kuznechny and the Liteyny corner of the map). |

## Lanes (traffic module)

`lanes: [{ id, road, dir, idx, width, pts:[[x,z]..], len, from, to, speed, rank, hw, name, bridge }]`

* one record per way **edge** (between two junction nodes) and lane; `pts` run in the travel direction (`dir` +1 = with the OSM polyline, -1 = against it);
  `idx` = 0 for the right-most lane in the travel direction (on Nevsky the bus / trolleybus lane: it is separated from the others by a solid white line); `width` metres; `len` metres;
  `speed` free speed in m/s (13.5 avenue, 12 secondary, 11 tertiary, 8 residential, 4.5 service); `from` / `to` = node ids of the ends (`null` at the map edge / a dead end).
* lanes stop at the **stop line** (incoming) and start **after the zebra** (outgoing) of every junction; the gap is bridged by `connectors`.
* Two-arm OSM way seams also reserve longitudinal space for a curved connector
  (at least 8 m per arm when the adjoining links have room). Its end tangents
  follow the lanes. A 1–2 m change in lane offset must blend along the road,
  rather than form a sideways segment that makes an NPC pivot left and right.
  `tools/traffic-turn-test.mjs` checks the real embankment joins and verifies
  that stopped NPCs retain their heading.
* Nevsky: 3-5 lanes per carriageway (OSM `lanes`), 2 x 14 m; Ligovsky 3-6; side streets 1-3; courtyards 1 + 1 (rank 0, slow).

`junctions: [{ id, x, z, lanes:[incoming lane ids], out:[outgoing lane ids], signal: signalId|null, connectors:[ids], arms:[{ index, bearing, road, name, rank, crossing, in, out }] }]`
(only nodes with >= 3 arms; `bearing` = direction the arm leaves the node, degrees clockwise from north.)

`connectors: [{ id, from, to, junction, turn:'straight'|'left'|'right', pts:[[x,z]..], len, signal, approach, give }]` - curves through the junction box
(right turn from the right-most lane, left from the left-most, straight from every lane). `give: true` when the approach has lower rank than the main road of the junction
(give way); equal ranks: right-hand priority is the traffic module's decision.

`stopLines: [{ lane, s, x, z, signal, approach, give, junction, crossing }]` - `s` = distance from the lane start where the car must stop (`== lane.len` at junctions),
`signal` = signal id or `null` (give-way line only), `approach` = index in `signals[].approaches` / `junctions[].arms`.

## Signals

`signals: [{ id, x, z, mid, cycle, ofs, complex, approaches:[{ index, bearing, group, lanes:[lane ids], crossing, name }], crossings:[{ id, approach, group }] }]`

* ~114 signalised nodes (ids = the OSM SIGNALS node ids, `S<nodeId>` for signalised junctions that OSM maps only as crossings) + stand-alone pedestrian signals (`mid: true`, id `P<crossing id>`).
  Signals less than 45 m apart form one **complex** (the two carriageways of Nevsky at Liteyny / Vladimirsky, the corners of Vosstaniya Square): they share the plan offset `ofs`.
* **Plan (cycle 110 s, plus the complex offset):** group 0 (the through street, Nevsky): green 0-54, amber 54-57, red; group 1 (the cross street): green 62-98, amber 98-101, red
  (5 s all-red after the through street, 9 s after the cross street). Mid-block signals: cycle 60 s, green 0-44, amber 44-47, red 47-60 (pedestrians walk 49-56, flash 56-59).
* `signalState(signalId, approachIndex, t) -> 'green' | 'amber' | 'red'`; `signalInfo(...) -> { state, remain }` where `remain` = seconds until the next colour change (the LED countdown number).
* `pedState(crossingId, t) -> 'walk' | 'flash' | 'dont' | 'free'`; `pedInfo(...) -> { state, remain }`. A crossing over an arm of group 0 walks 64-91, flashes 91-98 (while the cross street runs);
  over an arm of group 1 it walks 2-47, flashes 47-54. `'free'` = unsignalised zebra (pedestrians cross when no car is close, **cars give way**).
* Pedestrians must start crossing on `'walk'` (finish on `'flash'`); cars stop at `stopLines[i]` while `signalState(...) !== 'green'`, amber is a stop unless closer than ~1.5 s to the line.
* The traffic lights in the scene show exactly these states with a two-digit countdown (green digits = seconds of green left, red digits = seconds of red left).

## Crossings and pavements (people module)

`crosswalks: [{ id, pts:[[x,z],[x,z]], w, road, x, z, nx, nz, tx, tz, signalised, signal }]` - `pts` = the walking line kerb to kerb across the **whole carriageway**
(zebra bars 0.5 m wide, 0.5 m gaps, `w` metres long along the traffic: 4 m, 6 m on the primary streets); (x, z) its middle, (nx, nz) the unit normal along `pts`, (tx, tz) the road tangent.
`crossingsAt(x, z)` -> crosswalks whose stripe zone contains / is within 3.5 m of the point.
`sidewalks: [{ pts:[[x,z]..], w }]` - centrelines of the generated pavements (strips run from the kerb to the facade; 2 m sampling, broken at crossings, junction mouths and bus stops).
`paths: [{ id, pts, w, hw }]` - mapped footways / paths (OSM). `nearestSidewalk(x, z, maxD=20) -> { x, z, tx, tz, w, dist } | null`.
Pavements are **visual only** (+0.12 m, granite kerb +0.15): the ground the player and NPCs stand on is y = 0. No walk boxes were added. Colliders exist for lamp pedestals, signal poles / masts,
bus shelters (back + sides), bus-stop poles, the Nevsky **chain bollards** (r 0.11) and the wire masts. The chains and the guard rails themselves have no collider: they leave gaps only at crossings,
bus stops and junction mouths (people should cross there).

## Parking (traffic module)

`parkedSlots: [{ x, z, rotY, kind, road?, side?, lot?, nx?, nz?, depth? }]` (the array also carries `.lines` = bay separator segments, already drawn):
* `kind: 'parallel'` 6.2 m bays in the 2.2 m pockets of the side streets (Marata, Pushkinskaya, Kolokolnaya, Rubinshteina, Zhukovskogo ..., both sides on two-way streets, the right side on one-way ones,
  left on the Fontanka embankment; **no parking on Nevsky, Ligovsky, the squares and the primary avenues**); `'lot'` slots of the PARKING polygons (2.5 x 5 m rows, back-to-back pairs, aisles 6 m).
* `rotY` = the direction the car FACES. Slot centres are on the asphalt (y = 0.03). The pockets widen the asphalt (`laneAt` includes them, `layout.roadWidth` does not).

## Bus / trolleybus stops (traffic, people)

`stops: [{ x, z, rotY, kind: 'bus'|'trolley'|'both', routes: { bus:[refs], trolley:[refs] }, name, id, road }]` - the **bay on the kerb lane** where a vehicle stops (x, z) and the direction it travels there (`rotY`);
`busStops: [{ id, name, x, z, rotY, shelter, side, road, kind, routes, s, bay: { x, z, tx, tz }, pole }]` - the shelter (or bench + pole) position (`rotY` faces the road) and the same bay.
45 platforms, 14 shelters. Yellow zig-zag marking at the kerb of the bay. Keep trees 3 m clear of the platforms.

## Trolleybus overhead wires (traffic, landmarksC, props)

`wires: { height, pairs, arcs, spans, masts, anchors, wireKm }`
* `pairs: [{ id, way, refs:[route refs], dir, lane, pts:[[x, y, z]..] }]` - the CENTRE line of each contact-wire pair (the + / - wires hang 0.25 m either side), y = 5.8 m +- sag, over the kerb lane (and the next
  lane on 3+ lane carriageways) of every way that carries trolleybus routes; `dir` = travel direction relative to the polyline. A trolleybus's two poles touch this line.
  A pair is one piece between two ends: it may be shorter than its way (junction cuts) and it STOPS ON A CROSS-SPAN (or at an arc / a tie), never in the air.
* `arcs: [{ from, to, refs, pts:[[x,y,z]..] }]` - the junction curves joining the pair of one way to the pair of the next: routes that turn / cross (kerb lane to kerb lane) and routes that go straight on
  (every lane to the same lane of the next way: also across the joints where one OSM way ends and the next begins, so a lane never stops at a joint). `pts` y = 5.8 (the drawn arc follows the sag of its end wires).
* `spans: [{ id, a:[x,y,z], b:[x,y,z], mid:[x,y,z], len, poles:[bool,bool] }]` - the cross-span wires (facade rosette to facade rosette, 24-34 m apart, ~6.4 m at mid-span; the drawn span is pulled down to
  <= 0.9 m above the contact wires where hangers stand, so `mid` is the parabola value 6.45 and the polyline may be lower near the wires). Besides the regular spans there are TERMINAL spans (a free wire end gets a span exactly there)
  and GAP spans (no contact wire runs more than ~44 m unsupported: squares, the edge of the data; masts at both kerbs when no facade exists). The two spans on the Anichkov Bridge approaches are
  `spans` whose `mid` lies near the river: landmarksC may hang pendant lamps on any span `mid`.
* `anchors: [{ x, y, z, nx, nz }]` - the rosettes on the facades (normal pointing out of the wall); `masts` = the black masts that stand where a side of the street is open (also the end of a short tie wire where no span fits: only at the data edge so far).
Draw nothing between y = 5.4 and 9.6 m over the carriageways (banners, signs).
**Invariant (tools/wires-test.mjs, `npm run wires`, exit code 1 on failure; no GPU needed):** every end of every drawn wire (contact wire, arc, span, hanger, tie) lies within 0.5 m (3D) of a rosette, a mast top or another
wire (the + / - sibling of the same pair does not count), every group of touching wires contains a rosette / mast, every rosette has a facade behind it and none hangs inside a building, no mast stands in a building, no contact
wire runs more than 60 m between hangers / ties / ends. `node tools/wires-test.mjs --plan x0,z0,x1,z1,pxPerM,out.png` draws a plan (buildings, roads, wires by kind, supports white / black, free ends red);
`--spans`, `--ties`, `--near x,z,r`, `--verbose`, `--tol m`; `WIRES_DEBUG=1 WIRES_ID=<wire id>` prints the builder's decisions; `WIRES_SNAP` / `WIRES_GAP` change the two snapping distances (robustness runs).
The builder is generic (network only, no coordinates; ~170 ms for the first 12 km of wire); when the data grows re-run the test.

## Furniture lists (props / people / environment)

* `lamps: [{ x, z, h, kind }]` - `kind 'A'`: the Nevsky pedestal lamp (black, flower bowl, two globes or two stacked globes, 7.6 / 8.4 m; Nevsky, Ligovsky, Suvorovsky, Goncharnaya, other primary / secondary streets);
  `'D'`: swan-neck lamp 5.6 m (side streets). Props must not add lamps; the lamp positions are also the places where the chain bollards give way.
* `streetPlates: [{ x, z, y, nx, nz, text }]` - navy street-name plates (corner houses, 3.9 m) and house-number plates (2.75 m, text = `street number`); `(nx, nz)` points out of the wall.
* `guardRails: [{ id, pts }]` - the black guard-rail runs (Ligovsky first 340 m, around Vosstaniya Square, flower boxes on the road side). The city module does not need to skip any OSM id.
* Metro: nothing is drawn within 3.6 m of ENTRANCES / GROUND_HOLES; pavements there are plain slabs at 0.12.

## Layers and conventions (for anything standing on or next to the street)

ground 0 < passage ribbons 0.02 (under the service asphalt of the arch mouth) < asphalt 0.03 (decals to 0.045) < mapped footways 0.04-0.05 < paving areas 0.10 < pavement 0.12 < kerb top 0.15 (`layout.SURFACE`); traffic islands 0.15. Pedestrians walk at y = 0 visually 12 cm into the
pavement: put objects on pavements at y = 0.12. Kerbs are granite with a yellow painted line on Nevsky; the pavement stops 0.45 m before the Fontanka quay edge.

## Debug switches (URL)

`?st=nolamps,nosig,nostops,nowires,nopool` skip parts of the module (bisecting artefacts); `?st=ground,bld` adds a flat ground and blockout houses so the module can be judged alone;
`STREETS_DEBUG=1 node tools/check.mjs streets` prints the module stats (triangles per mesh, instanced counts, wire counts).

## West extension (session 3, 2026-10-03)

The network of the west (Fontanka to the Admiralty, Palace Square, St Isaac's, the Moika / Griboedov Canal / Winter Canal embankments, 4 500 west lanes, 88 signalised nodes, 30 bus platforms, 466
plates, ~840 lamps) comes from the baked OSM data with the same builders; what is specific to the west:

* **Lamp families** (`lamps[].kind`, `streets/style.js lampFamily`, models in `streets/lamps.js`): `'A'` Nevsky pedestal lamp (Nevsky, Sadovaya, Ligovsky ...), `'S'` Admiralty swan neck 9.2 m with ONE
  globe + a hanging petunia basket on every third pole (Admiralteysky pr., Dvortsovaya / Admiralteyskaya / Angliyskaya / Universitetskaya embankments, Dvortsovy proezd, the Palace Square roads, Senate /
  Birzhevaya squares), `'L'` black embankment lantern 4.4 m with a gold collar (Moika, Griboedov Canal, Winter Canal, Isaac's / Kazan / Konyushennaya squares), `'D'` side-street swan neck 5.6 m (Bolshaya /
  Malaya Morskaya, Gorokhovaya, Konyushennaya streets, Italyanskaya, Millionnaya ...), `'L2'` Gostiny Dvor square lantern 4.7 m (the 11 mapped lamps of the promenade, 6-32 m from the kerb).
  Lamps keep off bridge decks and off squares that a landmark module paves (they place their own: Palace Square candelabra, Kazan).
* **Nevsky west of Sadovaya (x < -880)**: the kerb lane of every 4-lane carriageway is painted red-brown (`#a05a46`, own decal mesh `pt-buslane`), zebras alternate white / red-brown bars, pavements are
  grey-pink slabs that run to the facade (up to 24 m: the Gostiny Dvor promenade), kerb line yellow, chain bollards. There is no median anywhere on the west Nevsky (dossiers west-nevsky-1..3: see the next point).
* **Paired one-way carriageways (`net.js fillMedians`, everywhere in the city)**: two one-way carriageways of the same street (same name, or an unnamed twin; both arterial, rank >= 3, when the names differ
  as on Dvortsovaya / Admiralteyskaya) that run in opposite directions and whose asphalt edges are less than 7.5 m apart are joined (two carriageways less than 3 m apart are joined whatever their names, an unnamed one counts from rank 2): each grows by half the gap on its left (`w.hL`, `w.fillL`; four passes: the
  centrelines wobble against each other, each pass closes half of what is left open), so there
  is no kerbed strip, no pavement and no lamp row between them (Liteyny, Mytninskaya, Poltavskaya, the west Nevsky ...), and the shared edge gets ONE double solid white line (`w.med`, drawn by the
  lower-numbered way, `w.medDraw`). Gaps of 7.5 m and more stay real medians (boulevards: Chernyshevskogo, Ligovsky, Obukhovskoy Oborony); the pavement strips of `walks.js` are clipped where the other
  carriageway begins (the last probe is the outer edge of the strip), so they never overpaint it. Pairs whose names differ and that are not both arterial (and not closer than 3 m) stay apart, and a gap whose
  middle is inside a building is no median. Where a pair starts to diverge (a gap that grows from 0 to the 7.5 m of a real median within one segment) a wedge of 0 - 7.5 m stays open: the start of the boulevard (the
  surface audit counts it as 'median', about 360 of 440 residual samples).
* **Kerbs without pavement** (`walks.js kerbBacking`, used by `surface.js buildKerbs`): the pavement strips and the corner patches are planned once per network (`planSide`, `cornerPlan`: samples with `vis`, `reach` and
  the reason `why`: cut / road / facade / lawn). A kerb stone is not drawn where its strip is missing because another carriageway lies behind it (the free-standing kerb of an island between two roadways,
  a service road beside the avenue, a corner arc whose patch would lie on asphalt), and a run shorter than 3 m that touches no other run is dropped. Kerb arcs inside the asphalt of their own widened way are not
  generated (net.js buildKerbRuns). `net.kerbRuns` itself keeps every run (the furniture placement along the kerb reads it). Guard rails (`walks.rails`) keep >= 0.3 m outside every asphalt.
* **Bridges**: streets draws NOTHING (asphalt, kerbs, pavements, markings, zebras, stop lines, poles, lamps) on the decks of the road bridges of `bridges/sites.js` (`streets/decks.js deckAt(x, z, margin)`:
  bank to bank + 0.8 m over the land, entered 0.4 m inside the edge so no seam opens). The ways stay in the network (lanes, signals, wires), `w.deck[i]` marks the deck vertices. The decks are only
  reserved when the `bridges` module is in the build list. The Kazan Bridge ways (OSM layer 2) are in the network now (the lane graph had a hole in the middle of Nevsky).
* **Claims**: pavement slabs / pavers and lamps are not drawn inside the AREAS polygons that a landmark module owns (`isOwned`: Palace Square r1947507 / r1947508, Kazan Square w638329474): the 0.5 m
  kerb band stays, people still walk there (`sidewalks` lists the strip). The road asphalt of the ways on those squares is drawn (they are real roads), under the landmark paving (0.03 < 0.04).
* **Area layers** (`paths.js buildAreas`): `square` polygons (the whole square incl. its carriageways) = flush slab paving at 0.012 with no skirt; road areas 0.02; asphalt ribbons 0.03; raised paving of
  footways / pedestrian areas 0.10 + 0.004 per larger overlapping polygon (a vertical edge down to the ground); traffic islands 0.15. No two polygons share a plane (the Isaac's Square /
  Blue Bridge plaza flickered 1.3 % of the pixels: now 0.003 %). `buildAreas(B, AREAS, skip, skirt, net)`: with the optional 5th parameter `net` the raised paving and the islands are carved out where a
  carriageway runs (`capCarved`: triangles sampled on a 2 m lattice, the ones that straddle a road edge are split down to 2 m edges, pieces whose middle or a corner lies on asphalt are dropped; the lattice is
  answered per 8 m cell from a cache (`clearCells`) where no road comes near, so the carve costs ~0.5 s); the vertical skirt of the outline stays and is skipped only along edges that run over a carriageway.
  Without `net` the polygons are drawn whole. Mapped footways (`buildPaths`) stop at the asphalt (no part of the ribbon on it) and at the pavement band of a ranked street.
* **Plates**: `plates.js plateInfo` reads every west street form: `X ulitsa / prospekt / ploshchad / bulvar / liniya / nab.`, `nab. reki X`, `nab. kanala X`, `nab. X` (Zimney Kanavki), `ulitsa X`,
  with the Latin line of the dossier (`Griboyedova canal emb.`, `Admiralteysky pr.`) and `short` text on the house-number plates.
* **Parking**: no pockets on the Palace Square roads, Dvortsovaya nab., Dvortsovy proezd, Admiralteysky pr. / proezd, Sadovaya; the Moika / Griboedov embankments, Admiralteyskaya nab., Isaac's
  Square, Konnogvardeysky bul. keep their kerbside bays (`parkedSlots`).
* **Lane graph additions**: `connectors` with ids `CB<from>><to>` link lanes across a micro gap (two junction nodes closer than a lane fits: node clusters, 6 m bridge ways) and `CX<from>><to>` give a lane
  that the turn rules left without an exit the nearest outgoing lane of its junction (smallest turn, no U turn). Same fields as the other connectors. `lanes[].bridge` is 1 on the bridge ways.
* **Furniture added**: speed cameras (OSM `speed_camera`: grey box on a pole, no flash), mapped gateway guard stones (stone / metal posts, `MANMADE guard_stone`), granite chain bollards on the Neva kerb
  of Admiralteyskaya nab. (`pt-neva-bollards` + chains), the Fontanka guard stones as before. No flags, no sirens.
* **Triangles / time**: 1.87 M -> ~0.86 M triangles (poles 366 k -> 114 k, lamps 516 k -> 175 k, pavements / kerbs / paint 560 k -> 330 k), page build 5.6 s -> ~3.4 s.
  `STREETS_DEBUG=1 node tools/check.mjs streets` prints triangles per mesh, instanced counts, paint per feature and ms per phase (`stats.ms`).
* **Wires**: `node tools/wires-test.mjs` is RESULT OK on the west (0 free ends, longest unsupported run 44 m, masts at the bridges every <= 56 m, ties <= 36 m). Fixes: arcs to deleted wires un-join their
  partner so it is terminated; bridge gap 56 m; ties never longer than ~36 m.

## Petrograd side / Spit of Vasilievsky Island (2026-10-06)

The network of the regions P1..P5, V1, V2 comes from the same builders. What is new, and the one mechanism that keeps the older districts as the user reviewed them:

* **Reviewed districts are frozen (`streets/region.js`)**: `isOpen(x, z)` = inside the extent of a region from `FIRST_OPEN` ('P1') on (+ 100 m for the straight-on stubs) and outside every older
  PLAY rectangle. Every rule below that could move something in an older district asks `isOpen` first (the rules stay generic: no ids, no coordinates; only their reach is the open area).
  Proof per change: `node tools/streets-signature.mjs --export-rev <git rev> <dir>` writes the module of a revision with absolute imports, `--src <dir> --out a.json` / `--out b.json` digest the
  module (triangles + vertex hash per mesh, instances, colliders, wires, service lists per 640 m cell and zone), `--diff a.json b.json [--allow "cx,cz;..."]` exits 1 when a cell of the reviewed zone
  differs (`--dump lists.json` writes the furniture lists to see what). When the open area has been reviewed, move `FIRST_OPEN`.
* **Temporary structures** (`net.js DROPPED`): the timber bypass bridge of 2025-26 beside the Kronverksky Bridge (w1360562178, deck, two footways) and the approach stubs that only lead to it
  (any road / footway under 40 m with an end on an end of a temporary way: 9 records) are not in the network and not among the mapped footways.
* **Tram reservation** (`net.js tramReservation`, `w.tramBed`): a `highway=service` + `service=emergency_access` way with a tram track within 3 m on BOTH sides along >= 60 % of its length
  (Kronverksky pr. along the Alexander Park: w1114728860, w1114749013 and three connectors) is the paved bed of a double track, no road: pedestrian-only (no lanes, cars, asphalt, lamps,
  fillets), as wide as the bed (outer track + 1.3 m each side, ~7 m), drawn by `extras.js buildTramRails` as ONE setts ribbon (`pt-cobble`, y 0.027) with the rails on it. `net.cover` still
  counts the bed (pavements, furniture and other modules keep off it); `net.cover(x, z, { noBed: true })` ignores it. `net.js trackDist(x, z[, nx, nz, sg, out])` = distance to the nearest
  track axis within 4 m. A track that runs off the asphalt WITHOUT such a way (the same reservation east of the Gorkovskaya stop) keeps its 3.2 m bed too: the pavement strips end 1.75 m
  before its axis (`walks.js`: `why: 'bed'`, the kerb stays), lamps and pole bases keep 1.1 - 1.2 m off the axis.
* **Tram rails**: TRAMWAYS records that a built module claims and that touch the open districts are not drawn (the Trinity, Tuchkov and Sampsonievsky bridges lay the rails on their own
  decks); the rails of the streets end on the first vertex of the claimed record. No track of the data has a free end (all 290 ends join another track or lie on the data edge).
  There is still NO tram contact wire anywhere (only the trolleybus network): next step.
* **Strip patches (`net.js buildStripPatches`, `net.patches`)**: `fillMedians` closes the gap of a paired street vertex by vertex, each carriageway by its own measure, with widths interpolated
  between the vertices: where a pair diverges into a real median a wedge of bare ground / pavement / traffic island stayed in the roadway. After the merge the gap from the left asphalt edge of
  every one-way carriageway to the edge of the opposite one (pairing guard of `fillMedians`, directions within ~41 degrees of opposite) is measured again every 2 m with the final widths, and
  every piece where it is under 7.5 m becomes an asphalt patch from edge to edge (0.35 m into both ribbons, cut where the gap reaches 7.5 m: the blunt nose of the median). A mapped traffic
  island of which more than half lies on carriageway asphalt is swallowed (its polygon + 0.4 m becomes a patch; islands a landmark module claims are left alone). `net.cover` counts the
  patches as carriageway for everybody (kerbs, pavements, islands, furniture) except for a caller that passes `skip` (paint hidden under a FOREIGN carriageway: the median line runs across a
  patch); `surface.js buildAsphalt` draws them (`pt-asphalt`), `paths.js clearCells` knows their boxes. ~1 150 patches / 2 700 m2 in the open districts.
* **Chevron posts** (`signals.js`): a post stands ON the island that is really drawn: inside its polygon, >= 0.3 m off the asphalt that carves it, not on a merged strip; a tip that is not such
  a spot slides towards the middle of the island (0.5 m steps, 40 % of the way), else the island has no post there.
* **Stops** (`stops.js kerbSpot / spotClear / fixStop`): the footprint of the shelter (3.5 x 1.7 m) and the stop pole stand on no asphalt (tram beds included) and on no tram track. A stop that
  fails is re-placed: a tram platform beside its track (PLATFORMS line) gets the shelter on the platform, on the side away from the rails (`busStops[].x, z` there, no zigzag); else the stop
  moves to the kerb of the ranked way the platform really stands behind (nearest kerb first, +-3 / 6 / 9 m along it); else it has no furniture and is not in `busStops`.
* **Lamps**: never on a strip that `fillMedians` merged (the audit's own measure: 0.15 m rays, gap < 7.5 m). This one rule is NOT gated: it also removes the lamp on the merged strip of
  Ambarnaya ulitsa (2067.7, 742.2) in the east, the only old lamp the strict furniture audit failed on.
* **Plates** (`plates.js`, `buildSignals(..., { isOwned })`): a building that a built landmark module claims gets no street-name / house-number plate of ours (the module models the real
  front and hangs its own plaques); the number of such a neighbour is not borrowed for a corner plate either.
* **Footways** (`paths.js`): a mapped footway or flight of steps inside a GREEN / AREAS polygon that a built landmark module claims is not drawn (the line stays in `paths`).
* **Wires**: when the seven places round the middle of an unsupported run all fail, every 3 m of the run is tried for the gap span (Bolshaya Pushkarskaya: courtyard gateways every few
  metres). `node tools/wires-test.mjs`: RESULT OK, 0 free ends, longest unsupported run 53 m.
* **A street under reconstruction is drawn finished (`net.js restoreClosedCarriageways`, `net.restored`, open districts; P6 round)**: OSM has the closed carriageway of a divided street as
  `highway=construction` (the bake drops that class) and, around it, the temporary scheme: the carriageway that stays open is tagged two-way for the stretch and two short unnamed one-way
  crossover links lead the closed direction onto it and back. Drawn as mapped, the street loses one carriageway for the length of the works. The pattern is undone by topology alone
  (no ids): T = a two-way way of a named street on whose first vertex a one-way way of the street ends and on whose last one starts; X / Y = unnamed one-way links of at most 25 m between
  T's ends and the ends of two one-way ways A / B of the street. Then T is one-way again, X and Y go, and the closed carriageway is a straight way from the end of A to the start of B
  with the class and width of A (id = T's id + `c`). One match today: Pionerskaya ulitsa, `w1332608578c`, 219 m between (-3683, -3005) and (-3851, -3145) (the real w1332608580); the
  street is two merged carriageways with one double line from Bolshoy pr. to the Admiral Lazarev embankment. A street that is under construction as a WHOLE (ul. Speranskogo, Birzhevoy
  proezd, the Pesochnaya embankment roads) is not in the baked data at all and stays undrawn: see docs/research/petro-requests-streets.md.
* **Tram beds lie 1.4 cm under the asphalt** (`extras.js BED_Y` 0.016, open districts; P6..P9 round): the ribbon of a tram reservation and the 3.2 m bed of an off-road track were at
  0.027, 3 mm under a crossing service road, and the setts won the depth tie against `pt-service` (63 samples "cobble on a carriageway" round the tram depot at Bolshaya Posadskaya);
  now the asphalt of every road that crosses or runs along a bed stays on top. Reviewed districts keep 0.027.
* **Pole bases, one more probe** (`furn.js poleClear`, open districts): the four diagonals of the 0.3 m ring are tested too (a sliver of a fillet / strip patch between the four axis
  probes held a signal mast 0.6 m inside the asphalt at the head of the Bolshoy Krestovsky Bridge).
* **No paving over an open metro stair pit (`streets/holes.js`, EVERY district)**: inside a `layout.GROUND_HOLES` rectangle of kind `'stairs'` (the four Nevsky Prospekt pits, the three
  Sportivnaya stairs) grown by 0.3 m the module lays no walking surface: `cutHoles(builder)` clips the finished pavement slabs / pavers / kerb band, corner patches, ramps, skirts, mapped
  footways and `steps` ribbons, paving areas and lots by the four vertical planes of the rectangle (a triangle that only comes near is left alone; ~110 triangles, 0.1 s; `stats.holeCuts`).
  `holeAt(x, z)` answers the point test. The CARRIAGEWAY is never cut (asphalt, kerb stones, gutter, wear, paint): Nevsky pits 3 and 4 reach 0.27 / 0.49 m into the asphalt of the south
  carriageway in the data, the road edge runs on over them. Escalator shafts (kind `'escalator'`, under the vestibules) are not touched. This rule is deliberately NOT gated by `region.js`:
  it changes one reviewed cell (the Nevsky pits), on the lead's request.

## Vasilievsky Island (2026-10-07, build-streets; dossier `docs/research/streets-vo.md`, requests `docs/research/vo-requests-streets.md`)

The island (V3..V12 and the Spit) is an open district (FIRST_OPEN = 'P1'): every rule below reaches the open districts only, except the three marked EVERY DISTRICT. Evidence: the photos of the dossier.

* **Tram, the way it looks** (the brief's "median 6 m with stops" is wrong for Sredny pr., photos 01 / 03 / 04): Sredny, Kosaya, Detskaya, Gavanskaya, the Kadetskaya / 1st trunk keep the double track FLUSH in a wide asphalt roadway (the carriageways
  are merged by `fillMedians`); `markings.js tramHid` paints no centre line / shared-edge line within 2.6 m of a track axis. Stops that only trams serve carry the sign 5.17 (`signs.js`, `busStops[].tram = 1`; their `kind` stays 'bus').
* **Slab median** (`net.js SLAB_MEDIAN = {'Наличная улица'}`): where a tram track lies in the gap (> 3.2 m) of two carriageways of such a street they are NOT merged; `net.slabs = [{ way, v, pts: [{ s, ax, az, mx, mz }] }]` are the half-ribbons
  (own edge + 0.35 m under its asphalt .. the middle) drawn by `extras.js buildTramRails` as `pt-tramslab` (y 0.016, under the asphalt); `slabAt(net, x, z)` is the point test; the median side of both carriageways has `w.cuts.L` (no kerb,
  no pavement, no lamp), `buildStripPatches` skips it, `walks.js onBed` and `buildKerbRuns` ask `slabAt`. The surface audit lists it as the exception `tram-slab-median`.
* **Depot yard** (`extras.js`, `X = { slab, ballast }` of `buildTramRails`): `service=yard` tracks get steel rails (0.11 m) on a 2.8 m ballast strip with sleepers (`pt-ballast`, y 0.010 + 0.0055 x (track % 3): three levels 5.5 mm apart against z-fighting between neighbouring strips) where no asphalt lies.
* **Tram contact wires** (`wires.js`): one wire (kind 'contact', width 0.028) 5.7 m over the axis of every main track of the island (`stats.tram`: 25 tracks, 14.4 km, ~620 supports); supports = the trolleybus cross-spans that cross the track, plus spans of its
  own (`stats.tram.newSpans`) at the free ends and wherever a gap exceeds 34 m; service `wires.tramWires = [{ id: 'TW<track id>', track, pts: [[x, y, z] ...] }]`. Not wired: the depot yard tracks, the bridge decks. `node tools/wires-test.mjs` covers it.
* **Pendant lamps** (`wires.js`, `stats.pendants`): a dome-shaded lamp on a 0.55 m cable under every second cross-span of the old island (x > -6000, `lib/vo-island.js inIsland`).
* **Lamp families** (`style.js lampFamily`): `'M'` (`lamps.js lampM`: galvanised pole 9.2 m, straight arm 2.1 m, cobra head, spacing 32 m) west of x -6000 on the island; `'D'` on the prospects of the old island (rank >= 3 there used to be 'A');
  `'A'` stays Nevsky's, Ligovsky's ... and Bolshoy pr. V.O.'s. `lamps[].kind` can be 'M' now.
* **Rail clearance** (`furn.js TRACK_CLEAR = 1.35`, `net.js streetTrackDist` = the tracks of the streets without the bridge decks): `poleClear`, lamps and stop shelters keep 1.35 m off a track axis (was 1.1 / 1.2 / 0.9); the mast scan of `wires.js`
  skips places between rails; `tools/roads-furniture-audit.mjs --strict` fails on objects within TRACK_CLEAR of a rail axis (`extras.railObjects`).
* **The Lines in pairs** (`streets/names.js`): `plateName(wayName, east)` = the name the plate of a wall shows: Line pairs ('4-5-я линии В.О.'), single carriageways ('14-я линия Васильевского острова', '22-я линии В.О.') and the Kadetskaya line map to the
  line of the wall's side (EVEN line = east wall, nearer the Spit; ODD = west wall; the Kadetskaya line east of the 1st); `addrNames(wayName, east)` = the address spellings (`BUILDINGS addr.street`) of those lines, so the house-number plates of the
  Lines (which never matched the way names) exist now. `plates.js ADDRESS_PLATES` = plates a landmark module asked for (the standard name + number pair at a fixed wall point: «Лиговский проспект 6» for the Bolshoy Concert Hall).
* **Andreevsky boulevard** (`paths.js ALLEY_W`): the central alley (way ids w214409218, w532429067) is drawn 5.8 m wide as block paving with a granite kerb band on both sides (`pt-alley-kerb`); a module that claims the ids draws it itself.
* **Late roads** (`net.js rawWays`, `data/late-roads.js`, `tools/late-roads-ids.mjs`, `tools/streets-late-roads.mjs`): the roads the bake drops as `highway=construction` but that are lasting streets (w241229734 Birzhevoy proezd, w1412166279 the 6-7 line stub,
  w1096055337 Kadetsky pereulok) come AFTER the last ROADS record (`w.i` of every other way is unchanged). A bake with the allowlist of `tools/bake-osm.mjs` keeps them in ROADS (flag `late: 1`, last part file) and the list may be emptied.
* **EVERY DISTRICT**: (1) a kerb arc that lies inside another junction's asphalt is not drawn (`net.js buildKerbRuns`: the arc point shifted 0.35 m towards the arc centre must not be asphalt; was open districts only; 22 old cells, -482 `pt-kerb`
  triangles); (2) the Oktyabrsky address plate (1 old cell); (3) none else. The open-only S1 rule: corner patches also avoid the fillet fans of other junctions (`walks.js cornerPlan`, `fans`).
* Debug / probes: `WIRES_DEBUG=1 node tools/wires-test.mjs` prints the tram gaps that could not be filled; `STREETS_DEBUG=1 node tools/check.mjs streets` prints `stats.tramRails` ({ ways, slabQuads, ballastQuads }) and `stats.wires.tram / pendants`.

## Vasilievsky Island, second pass (2026-10-09, streets-2; requests and answers: `docs/research/vo-requests-streets.md` "SECOND PASS", dossier `docs/research/streets-vo.md`)

Open districts only (`region.js isOpen`) except where said; `node tools/streets-signature.mjs --diff` against the revision before the pass: the 82 old cells are identical.

* **Water pits of the sights and island waters** (`bld.js`, `walks.js`, `waterclip.js`): the rings of `environment/waterways.js ownerWater()` (WATER_RINGS of the claiming sight modules + the Spit descent + the Shi-Tsza pit) and `islandWaterRings()` are edges of the facade grid with flag 2: `clearance(x, z, dx, dz, maxD, noWater, info)` stops a pavement strip 0.45 m before them (`noWater` = bridge ways, whose pavements run over the water on purpose; `info.flag` tells the limiting edge: 0 facade, 1 RIVER / slope, 2 owner / island water); `inWaterRing(x, z)` and `waterVertices()` are exported; `walks.js waterStations(way)` adds two samples 3 cm either side of every ring vertex abeam of a way; `waterclip.js` exports `cutWaters(builder)` (every walking surface, exact cut of a triangle against the earcut pieces of every owner ring), `cutIslandWaters(builder)` (mapped footways, steps, paving areas, lots, skirts against the island rings; never the strips) and `waterOwnerAt(x, z)`. The carriageway (asphalt, kerb stones, paint) is never cut. `?st=nowater` (`ST_NOWATER=1` in node) restores the behaviour before the pass. `ctx.services.streetsStats.waterCuts / islandWaterCuts` count the triangles cut or dropped.
* **Dead ends and the sea** (`net.js`): `trimWaterEnds` pulls a dead end of a way that is not a bridge back along its last segment until the whole cap (half a width beyond the last vertex) is on land; `net.trimmed = [{ id, atEnd, x, z, was, back, dropped }]`; `clipAtSea` ends a bridge / layer-1 way at the Gulf shore (the WHSD ramp w172999967).
* **Blagoveshchensky Bridge** (`wires.js`): wire heights `wr.hAt` + `blagDeckY` (clearance over the deck 5.16 .. 5.80 m), cross-spans between the standards of the bridge (`BLAG.lamps`, v +-18.15; span ends 7.4 m over the deck; `sp.G` = the deck height at mid-span, `sp.std = true`); `wires.masts` has entries `{ x, z, h, kind: 'blag' }` (h = height over y 0); no mast of ours stands on the deck.
* **`plates.js`**: `ADDRESS_PLATES` rows may omit the number (`no: null`: the name plate alone, centred on y) and hang only when `ctx.buildList` includes `owner`; `PLATES_ALLOWED` = landmark building ids whose generic plates stay; `PLATES_PIER` (the Mining University r2902646, whose walls are the module's bay tiles of 3.95 .. 4.1 m with the window at the tile centre) = the plates of such a building hang on the corner pier (centre `PIER_T` 0.69 m from the nearer end of the wall edge) and only on an edge whose bay pitch is at least 3.9 m (`pierOK`), so no plate covers a window. Rows: Oktyabrsky (1), Menshikov (2), NavalCorps (4), Sea Terminal (1).
* **`furn.js FURN_CLEAR`** (pure data, 7 rows: Mining forecourt + its two ornate lamps, Academy pier block, Menshikov apron wall, Sea Terminal NE deck, Sevkabel skyway abutments) and `furnZone(x, z, margin)`: no lamp, sign, mast or other pole of this module inside (rectangles in a frame, or circles). `poleClear` and `lamps.js` ask it. Since the review of the pass `furnZone` is also true inside the footprint of the WHSD viaduct / ramps (`bridges/sites-vo2.js whsdDeckY(x, z) !== null`, pure data): the bridges module hangs its own lamps on the median barrier; ten `M` lamps of ours had stood in the carriageway (at z -300 .. 180).
* **Lamps** (`lamps.js`): family S in the open districts uses model `S2` (flower bowl on the pole) instead of `S1` (basket on an arm); `ctx.services.streets.lamps[].kind` is still 'S'.
* **Stops** (`stops.js`): shelters of the open districts use the glass panes of `shelterModel().glassOpen` (the back pane 1 cm behind the frame).
* **Claimed service decks** (`streets.js`): an owned rank-0 `service` BRIDGE way in an open district is `pedestrianOnly` (no lanes, asphalt, lamps, markings): the four ways of the Sea Terminal deck; claimed bridges of other classes keep their lanes.
* **Audit tool**: `tools/roads-surface-audit.mjs` probes the 'median' strip along the line to the partner it measured the gap to (it walked along the left normal before: at a Y-split node it left the pair). Residual samples of the full run 1041 -> 847.


### Vasilievsky Island, third pass (2026-10-09, streets-3)
* **`plates.js`**: `ADDRESS_PLATES` rows may carry `pole: h` (a street-name sign on a post of height h: collider, grey tube, clamp bands; plate centre at `y`; needs the `post` / `poles` handed over by `signals.js`) and `near: m` (the post goes to the nearest clear pavement base within m: `furn.js clearNear` + 1 m off every island water ring); `PLATES_BLOCK` (8) = circles `[x, z, r, why]` where the generic placers hang nothing (open districts only); `PLATES_ALLOWED` +27 ids (Gavan town slabs and fire reserve, Sevkabel, the 14 ModernVO claims); the type word «проток» (`ПРОТОК` / `PROTOK`) is part of `plateText`. Rows now: 1 Oktyabrsky, 2 Menshikov, 4 NavalCorps, 1 Sea Terminal, 12 of the third pass (Kirova 3, ModernVO 6, Sevkabel 1, Gavan 2 poles).
* **`furn.js FURN_CLEAR`**: 27 rows (+20: the forecourts and stairs of Kirova, Erarta, Sevkabel, Sredny, Makarova, Pribaltiyskaya, Gavan and the nine metro doors / pits). Rotated frames are written with `AX(rad)` (axes of a three.js `rotation.y`).
* **`ways[].noCover`** (`streets.js`): set for a CLAIMED rank-0 ground way of the open districts (`pedestrianOnly` + owned + no bridge); `net.cover` and `net.coverLocal` skip such a way (fillets / strip patches do not). The ways stay in `net.ways` and in `ctx.services.streets.roads` (rank 0, no lanes).
* **`lamps.js portRows`**: family `M` on the rank-0 `service` ways inside the port landuse w704134882 (spacing `PORT_LAMP_SPACING` 35 m, ends 10 m clear, one side per way); same rules as the kerb lamps.
* **`extras.js EXTRA_LOTS`**: asphalt cells (1.5 m) in plan frames where a sight asked for ground that no OSM polygon covers (Kirov Palace, `landmarksKirova` in the build list); `buildLots(B, ctx, net)`.
* **`net.js clipAtSea`**: a bridge way cut at the open Gulf ends `SEA_BACK` = 1.6 m before the shore line.
* **Tools**: `roads-furniture-audit.mjs` skips instances whose base is above 2.5 m (`elevated instances skipped`); `streets-signature.mjs --dump` writes the plate normals (`plates: [x, z, y, text, zone, nx, nz]`).

## Islands round 2 (2026-10-14, streets integration owner; Yelagin, Kamenny, Aptekarsky, Petrovsky, Krestovsky; report `docs/research/islands2-streets.md`)

Every rule asks `region.js isIsland(x, z)` first: an OPEN district (`isOpen`) inside the extent rectangles of K1..K4, YE1, KA1..KA5, AP1..AP7, PE1..PE6 or inside the outline of Petrovsky Island (`island-polys.js`: the stadium lies in P6 / P9). `?st=noisl` switches all of it off (before / after screenshots). `node tools/streets-signature.mjs --diff`: the 76 old cells are identical; the 35 differing cells of the open zone are all on the islands.

* **`streets/island-data.js`** (pure data): `CLOSED_WALKS` (the permissive footways w546166965, w640402009..11 inside the fenced palace garden of Kamenny Island: no ribbon, no `streets.paths` line, so people never route into it), `WAY_FIX` (Petrovskaya kosa w218269115: carriageway 5.5 m instead of 7.2 m by class, no parking pockets, a 2 m cosine bump of the centre line away from the office r21379094 / the hut r21379092: `net.js rawWays` bumps the points, `makeWay` takes the width, `parkPolicy` returns null).
* **`streets/islands.js`**: `makePierTest` (a PIERS polygon that a module claims, `ypark-piers`: the mapped footways on it w1215034617..20 / w367173806 get no ribbon on the deck + 0.6 m, a stub <= 8 m that ends at the pier gets none at all; the routing lines stay), `makePavedCut` (the PAVED_RINGS that a module paves itself - palace podium / ramps / stair feet, east-spit plaza of the Rossi pavilion, the spit terrace - cut the footway ribbons that run over them; lawns stay open), `buildIslands` (the asphalt apron with a granite kerb in front of the Stable colonnade = a lot + three kerb runs, local frame ST, x +-30, z 10 .. 31; the asphalt footway ring round the Kitchen drum, R 33 m, 3 m wide, joined to w231033012 and w233508888 and published as a routing line `ye-kitchen-ring`; the 0.7 m granite edge bands along the four service ring roads of the Petrovsky stadium inside the apron ring: the apron is clipped on a lattice by its module, the bands hide the saw-tooth). `stats.islands = { aprons, kerbs, paths, bands }`.
* **`plates.js`**: on the islands the type words АЛЛЕЯ / ДОРОГА / КОСА are set under the name (`plateText(full, ext)`, `paintNamePlate(..., ext)`), and the expressway «ЗСД» and bridge names get no plate on the houses beside them (`NO_PLATE`). Open districts outside the islands keep the old text.
* **`walks.js pave()`**: on the islands a fan piece of a pavement polygon whose middle lies on a carriageway (`net.cover > 0.1`) is dropped (a sliver of the corner patch of ploshchad Starogo Teatra lay 0.7 m over the parking pocket of its neighbour: the last offender of `roads-surface-audit` there).
* **Footway ribbons on piers**: `paths.js buildPaths(..., pier, cut)`; a `part` way is re-densified to 0.5 m so that the ribbon ends 0.6 m from the deck edge.
* Not changed on purpose: the cobbles of the Stable / Kitchen courts (drawn by the modules); the bear-bed floor, the garden / spit / Kirov-bed ground blotches and the thin outline lines (3 sliver triangles of `env-ground`) belong to environment. Markings: the generic rule set passes `npm run markings` (whole city, `ALL CHECKS PASSED`); a `--near` run over the whole Petrovsky Island finds 7 % of the shared-edge points of the paired carriageways without a median line (Uralskaya ul. w416066760 / 61, Zhdanovskaya ul. w403615202 / w763759434: the lower-indexed way of a pair asks `partnerDraws`, the line is hidden; the city-wide share is 4.5 %, the gate 6 %): open, see `docs/research/islands2-streets.md`.

