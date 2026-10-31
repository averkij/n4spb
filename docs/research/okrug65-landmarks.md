# Округ №65: waterfront landmark authoring

Researched and authored 2026-10-31 for planning-map territory `k100`. This is
new landmark geometry, using the current OSM outlines rather than a copy of the
whole-city landmark modules. The whole-city extract contains the column and a
clipped part of Piterland at its northern coverage edge; it does not provide the
complete new district. The current coastal OSM query supplies the full rings.

## Selected sites and plan control

| Site | Coordinates in scene, m | OSM ownership | Measured or documented form |
|---|---|---|---|
| Piterland aquapark dome | `-7870.5, -5389.2` | `w317789257`, parent `w55498111` | Footprint radius about 45.6 m; mapped height 51 m, dome rise 43 m; architect gives nominal diameter 90 m. |
| Piterland shopping wings | `-7892.9, -5489.0` | `w1041714586` | Complete irregular OSM plan, height 27 m; four shopping floors, silver horizontal bands and dark blue curtain wall. |
| Piterland waterfront low strip | `-7866.5, -5353.0` | `w1041714585` | Curved crescent following the dome frontage; mapped height 4 m. |
| Small roof lantern | `-7890.0, -5478.8` | `w317789256` | Mapped roof element from 27 to 30 m. |
| Fly Arena pavilion and connector | `-7952.6, -5348.4` | `w294050494`, `w886683713` | Silver/glazed football-shaped volume and elevated glazed connection, identified in the operator's waterfront photograph. |
| Park 300 lighthouse | `-8415.3, -5470.7` | `w163902553` | Three tapered granite stages and flared, slotted collars; nominal height 22 m. |
| Lighthouse fountain | `-8410.0, -5487.4` | `r5255799` | Long rectangular basin, rotated with the park's central ray; dry central island retained from the multipolygon. |

The nominal longitude/latitude of the column is approximately
`30.20078 E, 59.98153 N`. Both sites are inside the planned Округ №65 territory.
The Buddhist Datsan is east of this territory and the Lakhta wooden church is
west of it; neither is placed here merely because it is a nearby attraction.

## References examined

1. [OAM / Intercolumnium: Piterland](https://oam-spb.ru/projects/razvlekatelnyj-kompleks-piterland/).
   Primary architectural project description: the glued-timber dome is 90 m in
   diameter, with a 43 m rise; the complex has three volumes, including the
   two-storey aquapark and four-storey shopping wings on a parking stylobate.
2. [Piterland operator: about the complex](https://piterland.ru/about/).
   Primary exterior photograph inspected: a pale silver membrane with narrow
   meridional seams, dark glazed drum, blue glazed wings, broad horizontal
   spandrels, silver side piers and an entrance canopy beside the beach.
   [Photograph](https://piterland.ru/upload/webp/resize_cache/914/726_484_2/hpdv2k3n3t1gth7jv10o3yjb4xpe203c.webp).
3. [Saint Petersburg engineering committee: the three Park 300 fountains](https://www.gov.spb.ru/gov/otrasl/ingen/news/50178/).
   Primary municipal record identifies the lighthouse fountain on the central
   ray, with its three column stages representing the city's three centuries.
4. [Vozrozhdenie: construction of Park 300](https://vozrtd.ru/portfolio/park-300-letiya-sankt-peterburga/).
   Primary stonework contractor documents granite paving, benches, basin
   finishing and the park's construction. Its overview photograph confirms the
   long basin aligned with the central promenade, with the column at the end.
5. [Column and fountain photograph](https://peterburg.center/sites/default/files/4._park_of_300_years_spb._fountain._2015.jpg).
   Inspected at full available size: tapered dark polished granite shafts,
   flared projecting collars, narrow dark slots below each collar, low pale
   pool copings, dry island and inward-arching rows of fountain jets.
6. [OpenStreetMap Piterland outline](https://www.openstreetmap.org/way/55498111),
   [dome](https://www.openstreetmap.org/way/317789257),
   [column](https://www.openstreetmap.org/way/163902553),
   [fountain](https://www.openstreetmap.org/relation/5255799).
   The fresh coastal query is projected with the repository's established
   `elementPolys` / `proj` helpers. OSM data © OpenStreetMap contributors, ODbL.
7. [Park aerial photograph, 2018](https://travel-big-planet.ru/uploads/1200/park-300-letiya-sankt-peterburga-2.jpg).
   Inspected to verify the designed open lawns, concentric and radial allées,
   discrete groves and broad pale-sand coast. Current mapped grove polygons,
   trees and rows control which vegetation remains; this historical photograph
   supplies the landscape composition rather than a late-2026 tree survey.
8. [Fly Arena operator contacts](https://flyarena.ru/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D1%8B/)
   and [Piterland operator listing](https://piterland.ru/stores/fly-arena/)
   confirm the wind-tunnel attraction at Primorsky 72. The faceted exterior
   appears in the already inspected Piterland waterfront photograph. Its
   exterior size is a photographic estimate; the current mapped pavilion and
   elevated connector footprints are retained.

Downloaded photographs are local research-only files under
`shots/refs-okrug65/`; they are not shipped textures or game assets. The model's
colours and fixtures are authored geometry using the shared material factory.

## Modelling and rules

The Piterland outline and all four building parts are claimed together. Generic
neighbouring apartment blocks remain with the city builder. The large dome
preserves its 51 m summit in the distant silhouette; narrow seams have an
authored 1,100 m range and facade detail 600 m. The exact irregular mall plan
and all mapped roof parts are retained. Glazing is opaque cel glass with
alternating reflection panels, avoiding many transparent facade layers.
The adjacent Fly Arena is a truncated icosahedron with silver hexagonal panels
and glazed pentagons. Its connector starts at 3.3 m above ground, including
its wall colliders, so the space beneath it remains open.

The lighthouse's real flag-shaped weather vane is omitted under the scene's
standing prohibition on flags and flagpoles. There are no commercial logos,
sound callbacks or warning sounds. The granite column itself and eight stone
benches use the shared knock system with finite authored ranges. The benches'
positions, facade grids, entrance details and minor stone dimensions are
photo-derived estimates rather than a measured architectural survey.

The fountain is open to feet and vehicles. Its water has no wall or exclusion
collider; low lips and the central pedestal are walkable surfaces. No fence,
quay wall, blanket water blocker or object is placed across the shore or the
yacht-bridge boat channel. Building collision follows the complete mall wall
rings and leaves the surrounding promenade and water unobstructed.

The basin registers `Physics.addWater` at `+0.077 m`, keeping shallow water
over its ground-level floor, like the existing garden ponds. Its multipolygon
is exported as `FOUNTAIN_WATER_BODIES` for the area's `HOOKS.waterBodies` field
mask and as `PAVED_RINGS` for vegetation rejection. It deliberately is not a
Neva `WATER.ownerRings` descent, whose `-3.4 m` datum would wrongly excavate the
park. No ground hole or negative height patch is needed for this shallow basin.

`park-hooks.js` is a pure data helper for the area: inside the exact park ring
it retains 71 mapped groves, 418 mapped tree points and 106 tree-row segments,
while rejecting the generic procedural fill on the remaining designed lawns.
Vegetation outside the park is unchanged. Sand is drawn from the exact mapped
beaches `r2186246`, `w1426773249` and `w886696094` in one source mesh. Its fine
triangles are kept off the drivable road plan; it sits below normal paths and
asphalt and adds no collider or shoreline obstruction. `inBeach` supplies the
area's grass-tuft rejection, and `pavedRings` exports the beach polygons.
The pure hook uses precomputed 32 m spatial buckets. A comparison over 94,418
regular-grid, actual mapped-tree and mapped-row positions found zero decision
changes against the original exhaustive predicate; the same loop fell from
about 1,410 ms to 102 ms. This is startup predicate cost, not frame time.

## Verification

`node tools/check.mjs landmarksOkrug65` passes: 58,781 triangles, 41 meshes
including five instanced meshes, 19 shared materials, no textures, 143
colliders, nine knock records (one column, eight benches), and zero frame
callbacks. The standalone headless build took approximately 215 ms on this
machine. This is a geometry/API check, not an integrated FPS measurement.

Focused physics verification sampled 1,035 basin positions with the real
Physics and car handling: the water level is +0.077 m, with zero walker
push-outs or car-blocked samples. All nine fixture colliders have knock
sources; the four skywalk wall colliders start at 3.3 m; no invalid vertices
were found. The street/furniture audit with `streets,landmarksOkrug65` within
800 m of the lighthouse tested 8,239 objects and reported zero objects on a
road, on an edge or on a median. These are focused checks, not the final
whole-area regression.

A subsequent road-surface audit found eight service-lane samples covered by
the Piterland fascia's projecting 0.52 m cap. That low decorative band now
clips against the actual `streets.net.cover` mask, preserving the wall and
upper bands. The matching focused audit over 700 m around Piterland reduced
this module's surface offenders from eight to zero. The integration owner
then corrected the nine concrete bridge approach samples with asphalt,
preserving ramp heights: a matching focused landing audit tested 279 samples
and found zero offenders. One bare-ground sample was outside this module.

The first integrated screenshots under `shots/coastal-author/okrug_*.png`
confirmed the main dome and fountain, and exposed two fidelity issues that
were corrected: a generic historic house on the mapped Fly Arena site and a
continuous procedural forest over the park's open lawn design. Final visual
review follows those corrections.

Useful visual review poses (x, y, z, yaw, pitch):

- Piterland beach: `-7955, 2, -5292, -41, 10`.
- Piterland overview: `-8060, 88, -5220, -48, -10`.
- Lighthouse from the south: `-8400.3, 1.7, -5435.7, 23, 12`.
- Fountain from the north: `-8410, 3, -5535, -170, 8`.

Serial GPU screenshots, z-fighting review, integrated road/water/boat checks,
shipping bake and old-centre/new-area performance evidence are handled by the
integration owner before the checkpoint is committed.
