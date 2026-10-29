# Vasilyevsky-Okrug 7, cluster M2: the embankment palaces and institutes (branch `vo-m2`)

Four landmark modules of the source project (`102_3d_piter`, commit 0568f7af) ported into the fifth live area `vasilyevsky` (docs/AREAS.md 15.v). Every module is a verbatim copy plus the changes listed here
(one provenance line in the header of each `src/world/<module>.js`). No shared engine file was touched: the area tables `WATER.ownerRings / keepOut` and `PAVED_RINGS` already existed; the module hand-over goes through the port slots of
`src/areas/vasilyevsky/area.js` and `rings.js`. The version, `package.json` and `CHANGELOG.md` are the lead's.

## The modules

| module | files | sub-groups claimed (all in the territory and in its data: `landmarks-groups-check` OK) | triangles (`check --area-modules`) | budget |
|---|---|---|---|---|
| `landmarksMenshikov` | 23 | `menshikov-palace`, `first-cadet-corps`, `rumyantsev-garden`, `rumyantsevsky-descent` | 263,278 | 303 k |
| `landmarksMakarova` | 20 (+ `bays.js`) | `sportivnaya2`, `lions-pier`, `catherine-church`, `makarova-row`, `lutheran-catherine`, `brullov-house`, `lutheran-michael` | 97,043 | 112 k |
| `landmarksNavalCorps` | 21 | `naval-corps`, `krusenstern`, `dormition`, `s189` | 71,622 | 83 k |
| `landmarksMining` | 21 (+ `inst.js`) | `mining-university`, `krasin`, `mining-descents` | 65,610 | 76 k |

The module builds a part only when THE AREA claims its sub-group (`ctx.L.GROUPS.<module>` with the fallback `GROUPS_LIST`, one line in each main file; `area.js` sets `GROUPS.<module> = GROUPS_LIST` of the module: all keys).
The sub-group keys are unique across the area. `src/world/lib/owns-table.js` was regenerated (the integrator regenerates it again: the parallel branches conflict there).

## Water: rings, keep-outs, paved rings (`rings.js`)

| module | WATER_RINGS (`WATER.ownerRings`) | KEEP_OUT (`WATER.keepOut`) | PAVED_RINGS |
|---|---|---|---|
| Menshikov | `rumyantsev-apron` (Neva) | `rumyantsev-west-ramp`, `palace-front`, `rumyantsev-apron` | 7 |
| Makarova | `lions-pit` (Neva) | `lions-pier` | none |
| NavalCorps | `krusenstern-stair` (Neva) | `krusenstern`, `s189` | 1 |
| Mining | `descent-1`, `descent-2` (Neva) | `krasin-berth` (r 62), `descent-1`, `descent-2` | 3 |

All six rings are Neva water (`layout.inRiver`) at their centres; the keep-outs keep generated descents / landing stages / boats away. `water-reachable-test` check 1 (no wall of colliders cuts a body of water) passes.

## World rules in the ported modules

**Knock records (breakable), 543 in all.**
- Menshikov (466): the iron fence of the Rumyantsev garden (167 bays, a plinth wall + cap + ironwork panel per post pitch of 2.6 m), the four palace forecourt fences (limestone wall + spears; `fence.js ironFence` is now a row of `knockBays`, the
  shut east service gate is a bay of its own), the palace forecourt hedges (`plants.js hedgeWall` with a collider: bays of a hedge box), the 20 garden benches and the 14 garden lamps (`knockFurniture`, the colliders are the record items),
  and at the Rumyantsevsky descent the railing on the coping (ghost bays where the old code drew none), the granite curb along the river edge (it kept walkers off the water: bays that follow the slope of the ramps), the rails of the
  two river-tram pontoons and of their gangways.
- Makarova (10): the iron fence of St Catherine with its two closed gates (span bays with the stone base, gate bays), the two closed iron gates of the Lutheran church, the two cheek walls of the Lions pier (ghost bays: the collider is 0.8 m,
  the drawn wall 0.12 m over the street).
- NavalCorps (28): the cast-iron railing on the Krusenstern tumba (8 panel bays), the low iron railing along the Optina church plinth (20 bays with posts and pickets).
- Mining (39): the 35 chain bollards (kind `bollard`; the chains between them stay drawn, they have no collider), the two ornate lamps, the two Krasin benches.

**Removed on purpose (water is reachable): every "nobody walks on the water" guard.** The invisible barrier along the bottom step of the Krusenstern stair (22.8 m), the toe wall of the Lions pier (14.4 m, y -4 .. -2.4), the barrier along the water
edge of Mining descent D1 (24 m) and of D2: the walker steps off the last tread into the Neva (wades, falls to the bed, cannot climb back), as in the Academy port.

**Float blocks (docs/water-transport-boat-collisions.md).** The two river-tram pontoons of the Rumyantsevsky descent and the floating pier of the submarine S-189 are `addFloatBlock`s (they stop the motor boat, a walker's deck is not touched).
The S-189 hull itself (source: no collider at all, a boat and a walker went through the submarine) is three solid blocks (bow, parallel body, stern) from below the keel to the casing, like the Krasin hull; the quay side of the hull stays
open water and both ends of the 218 m pier are open (the water is not walled: check 1 passes). The Krasin hull (slices, `ship.js`) and its gangway stay solid structures; the hull is moored along the quay and does not block the channel.

**Structures left solid (documented):**
- walls of buildings (`addPolyColliders`, `shell.js` walls): the palace, the Cadet Corps, the Naval Corps, the church and the front house of the compound, the Mining University wings, the Lutheran churches, St Catherine, the Brullov house,
  the glazed Sportivnaya pavilions; the Rumyantsev garden toilet block (a small OSM building redrawn as a kiosk: its four walls are building walls);
- columns, portico pedestals, monuments and pedestals: the obelisk base, the two fountains, the Surikov and Repin busts, the music pavilion, the Krusenstern tumba and pedestal, the Amundsen pedestal, the lion pedestals and the stepped granite
  barriers of the Lions pier (three blocks of 1.3 x 1.2 m each, no thin wall), the end blocks of the Krusenstern stair, the bastions and side walls of Mining D1 (1.2 m of granite);
- the retaining wall body of the Rumyantsevsky apron (y -3.6 .. the coping, masonry; the railing above it is the bays), (its 0.6 m granite pylons and the cast-iron posts of the Krusenstern railing are knock records since the fix A of AREAS.md 15.v) the gate piers of the iron fences, the stone piers of St Catherine's fence;
- (the 1900 stucco fence of the Optina compound is a row of breakable bays since the fix A of AREAS.md 15.v);
- the tree trunks (cylinders 4.5 m high), the Amundsen pedestal, the cafe superstructure on the east pontoon (11 x 2.9 m closed), the steel bell frame posts.
`water-reachable-test` check 6 (every thin tall collider within 12 m of water is a knock record) passes with NO `ALLOW` row.

## Engine glue and shared files

- `src/areas/vasilyevsky/area.js` and `rings.js`: only the marker lines of the four modules (import, module, label, groups, HUD rows, `TEST.claimed`, the Menshikov prune entry). No view poses (the lead does the views).
- `src/world/lib/owns-table.js`: regenerated (`node tools/owns-table.mjs`).
- `tools/check.mjs`: the four `PORT-BUDGET` rows (measured + 15 %).
- `tools/claims-draw-audit.mjs`: `OWNER_SKIPS.vasilyevsky` (the bell frame w216655313, the 42 m2 shed w82802180) and `KNOWN_UNCLAIMED.vasilyevsky` (the compound outline r4164970), added with `Object.assign` after the tables.
- `tools/water-reachable-test.mjs` check 8: the list of floors skips a floor that lies under a higher surface of its own descent (the landing rows of Mining D2 run under the last treads on purpose: "the higher step surface wins");
  one condition appended to the `floors` filter.
- Nothing else shared: no engine file (`environment/`, `bridges/`, `lib/`) was edited, so palace, smolny, admiralty and vladimirsky build bit for bit as before (no triangle comparison needed).

## Oracles (CPU, all with `node tools/area.mjs vasilyevsky ...`)

`check --area-modules` (no module error; numbers above), `landmarks-groups-check` OK, `layout-test` OK, `claims-draw-audit` OK (2 warnings: the steps way of the Academy and w942921898, a 2-step flight of the Rumyantsevsky descent, claimed but with no geometry of its own on the footprint, like the sphinx steps way of the Academy; 1 note: the Optina compound outline), `owns-table --check` OK, `runtime-only-lint` OK, `import-lint` OK, `water-reachable-test --quick` 16 of 17 (the one failure is check 9: the undrawn drivable bridges, the lead's bridge wave).

## Open

- Sportivnaya-2 exits: two glazed pavilions without a metro below (no metro module in this area); the doors stand open on an empty room.
- Hedges, garden hoops and the lawns of Menshikov are drawn as in the source; the hoops have no collider.
- The Rumyantsevsky apron and the Mining descents are hand-built pits: their walkers are checked by `water-reachable-test` (checks 1, 2, 6, 8), not by a dedicated descent walk test.
- `tools/knock-stands-test.mjs` fails in this area on "a standing press kiosk" (props, not these modules).
