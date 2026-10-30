# Southern area port

Коломна–Екатерингофский (map area 42) and Семёновский–Измайловский
(map area 45) are live areas, connected to their neighbours by edge gates
`e27`–`e36`. Their playable rectangles are based on the planning map footprint
and its water zones, rasterised at 80 m with a 600 m shore water band and a
120 m scenery margin. A few boundary cells are extended to keep transition
approaches and navigable water connected; these adjustments are documented and
validated in `tools/prepare-area-port.mjs`.

The data cuts in `src/areas/kolomna/data/` and `src/areas/semyonovsky/data/`
contain 4,745 and 6,082 building records respectively. Recreate them with
`node tools/prepare-area-port.mjs --orig D:/git2/n4spb-work/south-data/out`
from the supplemented `102_3d_piter` source, revision
`022e72ca8b3a2d0bf716367e7399187cacca019e`. See
[south-osm-data.md](research/south-osm-data.md) for fetch provenance and
reproduction. The map's whole-city source-coverage estimates are 64% and 75%
of the two core areas; supplementary OSM fills the source's geographic gaps,
though coverage does not mean every individual landmark is custom authored.

The port uses existing Mariinsky, Nikolsky, New Holland, Trinity-Izmailovsky
Cathedral, Technological Institute and Vitebsky Station groups, plus the Moscow
Triumphal Gate, Narva Gate, Baltic Station and Yekateringof Park additions.
The [city historical account](https://www.gov.spb.ru/gov/terr/reg_moscow/information/istor/),
[city archive on the Moscow Triumphal Gate](https://www.gov.spb.ru/gov/otrasl/c_govcontrol/news/171679/)
and [local library account of Yekateringof](https://kircbs.akir.gov.spb.ru/vstrecha-ekateringof-zabyityie-straniczyi-istorii/)
are among the references. Individual authored landmark modules and research
notes record further references and modelling choices.

Six southern crossings also have integrated visual treatments: Matisov, Banny,
Bumazhny, Molvinsky, Yekateringofsky and Gutuevsky bridges. They add simplified
side faces and rail motifs to the existing fallback decks. Intermediate piers
are omitted to preserve the open water passage until their placement is
verified. Integrated boat-passage, road-furniture and knock checks passed;
Matisov was reviewed in the normal-loaded scene, while visual and vehicle
checks on both approaches of every crossing remain outstanding. The
[bridge research notes](research/kolomna-fallback-bridges.md) describe the
reference structures and modelling approximations.

Water is reachable and breakable barriers and movable furniture follow the
project's existing rules. Both districts have a usable boat dock; boat state is
preserved across supported area crossings. Run the area, road, water, passage,
handoff and bake checks described in `package.json` and `docs/AREA-DEVELOPMENT.md`
after changes. The planning map and the registry remain separate: regenerate the
map after changing live registry geometry, and review the cut before recutting.

## Road audit follow-up

The strict road-marking checks passed in both areas. A pavement-strip correction
in `src/world/streets/walks.js` samples emitted triangles against the actual
road network and subdivides those crossing asphalt. It reduced the ribbon audit
from 169 to 2 intruding surface triangles in Kolomna and from 220 to 1 in
Semyonovsky; both passed the existing limit of 150. The original strip ribbon
audit also passed, with 2 wall segments and 1 surface triangle. In those
concurrent authoring runs the Kolomna and Semyonovsky streets builds rose from
about 12.2 to 14.4 seconds and 13.6 to 16.3 seconds respectively. These are
headless build timings, not shipping load or driving performance measurements.

The full road-surface audit reports 90 non-exempt samples in Kolomna (within
the unchanged budget of 120) and 169 in Semyonovsky (above budget). These are
source-build measurements and should be rerun after further changes. They
supersede earlier counts of 168 and 323: the audit was corrected to interpolate
the partner road's width at the projected point, use the road generator's
direction, name, water and building guards, and reject projections beyond a
candidate segment's ends, with a 0.2 m tolerance. Other segments remain
candidates. The earlier calculations could mistake wider reservations or
clamped endpoints for narrow gaps. A Nikolsky Garden fix also clips its sett
apron against roads, removing 13 reported carriageway samples.

Do not treat every remaining median sample as a carriageway defect without
checking the mapped geometry: some fall outside the street network's nominal
asphalt coverage and may be real reservations, while some bare-ground samples
lie inside nominal coverage. An abrupt taper in the median fill near улица
Марата is one confirmed case to investigate. Carriageway cases include bare
ground, passage ribbons, bridge paving and five New Holland service-path
samples; check whether the landmark paving is appropriate before changing it. Examples include:

- Kolomna: bare ground on Staro-Petergofsky Prospekt at `-4036.98, 1829.66`,
  square paving near Stachek Prospekt at `-4296.39, 3616.2`, and New Holland
  service-path paving at `-3267.11, 285.13`.
- Semyonovsky: bare ground at `-642.6, 1403.08` near Marata Street and at
  `-1821.03, 3369.66` and `-1797.6, 3999.62` on Moskovsky Prospekt.

Reproduce the checks from the project root:

```powershell
node tools/area.mjs kolomna tools/streets-ribbon-audit.mjs --max-walls 4 --max-surf 150
node tools/area.mjs semyonovsky tools/streets-ribbon-audit.mjs --max-walls 4 --max-surf 150
node tools/area.mjs kolomna tools/roads-surface-audit.mjs --max-fail 120 --json shots/south-k-surface.json
node tools/area.mjs semyonovsky tools/roads-surface-audit.mjs --max-fail 120 --json shots/south-i-surface.json
node tools/area.mjs kolomna tools/streets-markings-audit.mjs --geom --strict
node tools/area.mjs semyonovsky tools/streets-markings-audit.mjs --geom --strict
```

For individual residuals, inspect `offenderSamples` with `exception === null`
in the JSON output: a cluster may aggregate both exempt and non-exempt samples.
Three representative Semyonovsky pavement locations were visually reviewed
after the ribbon correction. Normal-loaded Kolomna landmark, park and
waterfront views were subsequently reviewed, but individual Kolomna overlap
sites still need visual review.
