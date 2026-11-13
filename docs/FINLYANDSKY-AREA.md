# Финляндский

`finlyandsky.html` implements planning-map district **64**, badge **F**.
The 56 territory rectangles cover **16.4736 km²**, including shared streets,
the Neva and the southern-bank overlap needed for usable handoffs. Reciprocal
transitions lead to Дворцовый–Литейный, Смольнинское and
Сампсониевское–Ланское. The planning map shows the actual playable overlay and
links directly to the scene; its municipal core remains a separate planning shape.

The old whole-city extract ends inside this district. Its matching architectural
dossiers are retained, while fresh OpenStreetMap geometry supplies the complete
territory: 4,194 building records, 10,377 road records, 305 railway ways and 31
mapped fountains. The source metadata records the official OSM map API tiles,
complete relation downloads and inspected original repository revision.
The converter's duplicate filter now compares vertical intervals as well as
footprints, retaining Europolis's stacked floors beneath its cantilever roof.
See [geography and provenance](research/finlyandsky-geography.md).

Separate specialists researched and authored
[Finland Station and Lenin Square](research/finlyandsky-station.md) and
[Kresty and the Visitation church](research/finlyandsky-landmarks.md), using
multiple photographic references and complete mapped footprints. The terminal
has a glass clock tower, steel spire, relief panels, silver lettering, platforms,
mapped rail approaches and an unbranded suburban train. Kresty retains its two
cross-shaped blocks, barred windows, roof church, five domes and boiler chimney.
The church on Mineralnaya has arched windows, a rose window and an octagonal spire.
Inferred heights and simplified sculpture detail are identified in the dossiers.

The existing mapped-fountain builder supplies live spray, droplets, ripples and
evening illumination. Shared generators retain traffic, people, street plates,
trees and movable/breakable furniture. One purple Zhiguli follows the garage rule;
a motorboat is available on the Neva. Water remains reachable on foot and by car.
Liteyny uses the existing detailed bridge and the common navigable water datum.

Regeneration and focused checks:

```powershell
node tools/prepare-finlyandsky-area.mjs --api-map
node tools/configure-finlyandsky-area.mjs
node tools/connect-finlyandsky-area.mjs
node tools/owns-table.mjs
node tools/gen-area-html.mjs --area finlyandsky
node maps/intro-draft-src/refresh-live.mjs
node tools/finlyandsky-area-test.mjs
node tools/areas-test.mjs --area finlyandsky
node tools/area.mjs finlyandsky tools/layout-test.mjs
node tools/area.mjs finlyandsky tools/views-check.mjs
node tools/area.mjs finlyandsky tools/area-garage-check.mjs
node tools/area.mjs finlyandsky tools/roads.mjs
node tools/area.mjs finlyandsky tools/streets-markings-audit.mjs --geom --strict
node tools/each-area.mjs tools/water-level-test.mjs
node tools/area.mjs finlyandsky tools/water-reachable-test.mjs --quick
node tools/area.mjs finlyandsky tools/boat-passage-test.mjs --quick
node tools/bake-scene.mjs
node tools/bake-manifest-check.mjs
```

The geography regression protects northern/eastern coverage beyond the original
source, intact landmark relations, railway approaches and the navigable Neva.
All 23 area water-level checks pass; the new area's water-access and boat-passage
suites pass 17 and 26 checks. Liteyny is sailed without scrapes; all eleven drawn
open-water piers are solid and the playable Neva stays connected for boats.
The older North-specific data audit has limitations documented in the geography
dossier. Performance measurements and final bake evidence are in
[PERFORMANCE.md](PERFORMANCE.md). Local screenshots and logs are under
`shots/finlyandsky/` (ignored).
