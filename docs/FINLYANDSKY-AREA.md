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

The 13.1.0 detail pass reconstructs the right-bank lower promenade along about
2.1 km of the mapped Arsenalnaya–Sverdlovskaya shore. The retaining tier changes
to a grass slope near Vatutin; seven mapped access flights, a maintenance ramp
and its diagonal footpath meet the lower walk. Drawn slopes and terrain heights
agree, old flat ground/paving is cut away, and each low parapet bay is breakable.
The 136 m Lenin Square descent has its five mapped flights and curved end
platforms. Bezborodko's landing has two side flights, a hollow vaulted grotto,
four inward-facing sphinxes, six vases and breakable scrollwork/gate panels.
See [waterfront research and reconstruction limits](research/finlyandsky-waterfront.md).
The lower walk is 1.4 m above the shared Neva level; this vertical section is a
photographic estimate, while plan positions follow the survey. Keys **6–8**
visit the ceremonial descent, sphinx landing and lower promenade.

The same review corrects the station's rear glazing and mapped platform
shelters, Kresty's cross centres and low wings, and the Visitation church's
pitched roofs, gables and buttresses. Underground grotto claims are verified
at their actual elevation rather than an above-street building band.

The 13.2.0 follow-up fixes the car support and blue slit at the ceremonial
landing's curved street edge, and gives the ordinary descent opposite Kresty
a coherent granite apron. Real car runs and dense rendered/physical edge
probes cover the supplied positions. Kresty's complete compound now includes
twelve formerly generic auxiliary buildings, its detailed street gate,
surveyed walls with road-access gaps, pitched metal roofs, deliberate court
paving and lawns, and mature trees. Square paving follows the supplied aerial
reference; Lenin uses a dedicated sculpture, and local pedestrian density is
reduced by 25% with a gradual transition outside the square.

The long central fountain was a mapped pond plus a point-only fountain node.
The area reconciles those records into one full basin with eleven live jets;
all 31 fountain records remain. The bridge fix separates transverse embankment
traffic/paint from the raised road and restores its paired-carriageway divider.
Aurora is visible from both independent areas using the existing detailed ship
builder, and three wrongly suppressed lower tiers of Orenburgskaya 2 are
restored in the Sampson overlap. See the
[overlap diagnosis and repair](research/finlyandsky-aurora-overlap.md).

The existing mapped-fountain builder supplies live spray, droplets, ripples and
evening illumination. Shared generators retain traffic, people, street plates,
trees and movable/breakable furniture. One purple Zhiguli follows the garage rule;
a motorboat is available on the Neva. Water remains reachable on foot and by car.
Liteyny uses the existing detailed bridge and the common navigable water datum.

Regeneration and focused checks:

```powershell
node tools/prepare-finlyandsky-area.mjs --api-map
node tools/area.mjs finlyandsky tools/prepare-finlyandsky-banks.mjs
node tools/configure-finlyandsky-area.mjs
node tools/connect-finlyandsky-area.mjs
node tools/owns-table.mjs
node tools/gen-area-html.mjs --area finlyandsky
node maps/intro-draft-src/refresh-live.mjs
node tools/finlyandsky-area-test.mjs
node tools/area.mjs finlyandsky tools/finlyandsky-waterfront-test.mjs
node tools/area.mjs finlyandsky tools/finlyandsky-square-test.mjs
node tools/area.mjs finlyandsky tools/finlyandsky-aurora-test.mjs
node tools/area.mjs sampson tools/finlyandsky-aurora-test.mjs
node tools/repair-sampson-vertical-duplicates.mjs
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
