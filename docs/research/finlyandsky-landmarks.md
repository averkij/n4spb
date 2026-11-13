# Финляндский: «Кресты» и храм на Минеральной

Research and modelling: 2026-11-13. These two sights were authored by a separate
specialist from the Finland Station / Lenin Square ensemble. Photographs are
reference material only and remain in the operating-system temporary directory.

## Geography and source coverage

The planning map's district **64** includes both sights. The old whole-city
scene at `D:/git2/agi-fun-tests/102_3d_piter` ends through the prison at
`z=-2370`: its `r17026343` is cut into two pieces and loses the northern arms.
Copying that footprint would destroy the two crosses. The new area's full OSM
geometry supplies the complete parent and its three parts. The current mapped
record for the Visitation church is `w366423247`; it was beyond the old source.

The Kresty parent is `r17026343`, Alexander Nevsky roof church `r17026341`,
western lower-rise part `r17026342`, former eastern observation drum
`r17026340`. The adjoining historical buildings use `r17026336`–`r17026339`
and `r17026344`. The boiler building `w60557313` is authored together with
its chimney so the shaft does not intersect another module's building. The
chimney is the surveyed `n5973556814` at
`(766,-2410.4)`. Building perimeters use the supplied complete OSM polygons;
the authoring code does not fabricate replacement rectangular footprints.

## Kresty reference set

- [City heritage authority: ensemble and restoration parameters](https://www.gov.spb.ru/gov/otrasl/c_govcontrol/news/308595/)
  confirms Tomishko's two cruciform blocks and the associated historical buildings.
- [Kommersant aerial photograph](https://iy.kommersant.ru/Issues.photo/REGIONS/PITER_Online/2025/02/20/KSP_013068_00835_1_t222_120037.jpg),
  downloaded and visually inspected: two red-brick cross plans, narrow pitched
  arms, rounded observation centres, low courtyard structures and tall chimney.
- [Alexander Nevsky roof-church photograph](https://peterburg.center/sites/default/files/kresty-002.jpg),
  downloaded and visually inspected: red brick, pointed central facade, tall
  arched window, broad pale central dome, four smaller pale domes and dark drum windows.
- [Kresty article and archive gallery](https://ru.wikipedia.org/wiki/Кресты)
  supplies the five-storey configuration and historical context.

The module preserves the historic exterior rather than drawing an unbuilt
redevelopment proposal. Brick is muted terracotta with shallow pale-brick courses,
pilasters, small barred windows and projecting grey sills. Repetitive windows,
sills, bars and bands are immutable instanced boxes. Bars stop at 170 m;
window and architectural detail stops at 550–900 m; the roofs, domes and chimney
have a 2600 m authored range. No new frame callback is installed.

Vertical dimensions are **photographic modelling estimates**, not claimed
surveys: cell-block eaves 18.7 m, pitched ridges 22.2–22.35 m, observation crowns
29.35 m, roof church approximately 43.5 m including cross, chimney 62 m.
The real planar footprints and compass orientation are mapped; roof ridges and
small moulding dimensions are inferred from the inspected views. The review
corrected the eastern cross centre to **(793.8, −2359.2)** from the centre lines
between its opposite mapped arm edges; its previous centre was 7.1 m too far
north. The western centre is (665.5, −2380). This offset, and the earlier guessed
rectangular roof spans, had left broad flat-looking roof strips.

The roofs now clip to the complete mapped outline. Convex pieces are split at
ridge/valley equations before height is applied, producing actual planar slopes,
closed eaves and brick gable faces. The roof church has its own longitudinal and
transverse ridges fitted to its nave and projecting gable, taller arched glazing,
nested brick mouldings and window bars. There is no unsupported rectangular
roof overhang above the river facade. Ridge chimneys supply the small roofline
rhythm visible in the aerial reference.

The mapped western child `r17026342` is restored to its **9.9 m** eaves, and the
round exercise-yard child `r17026340` to **3.3 m**. The latter has open radial
partition tops and a low centre, rather than the previous five-storey circular
mass. The yard surface stays below shared asphalt, preserving mapped service
access. The full-compound review below replaces the previously generic
auxiliary buildings with authored historic shells.

Suggested review cameras (x, eye-y, z, yaw, pitch):

- `729,1.7,-2248,10.3,14`: riverfront church and brick ensemble.
- `770,110,-2180,6,-31`: both complete crosses and the surrounding streets.
- `719,2.4,-2270,0,10`: carriageway-height frontage and roof details.

## Full-compound review from the supplied street and aerial views

The user's street photograph exposes the missing hierarchy: the low brick
screen, the entrance building with guards' flats (7, letter K), its tall centre
and paired arched windows, and the substantial spruces between it and the roof
church. The user's aerial view shows service buildings and coherent court
surfaces around both crosses. These are now treated as an ensemble rather than
two decorated large blocks surrounded by generic houses.

Two additional photographs were downloaded to the temporary reference folder
and visually inspected:

- [Entrance building, close frontal view](https://kanoner.com/pics/2025/12/arsenalnaja-naberezhnaja-dom-7-lytera-k-vhodnoe-zdanye.jpg):
  the nested brick portal, paired upper arches, blind-arch cornice, corbelled
  corners, stone footing and zinc downpipes.
- [Whole river facade in winter](https://s0.rbk.ru/v6_top_pics/media/img/8/45/756695502298458.jpg):
  different heights of the three guards' houses, low connecting wall, raised
  entrance centre and the roof church's relation to the enclosing buildings.

The [city heritage authority's ensemble description](https://www.gov.spb.ru/gov/otrasl/c_govcontrol/news/308595/)
and the [owner's published preservation list](https://kvsspb.ru/novosti/sovet-po-sokhraneniyu-kulturnogo-naslediya-utverdil-klyuchevye-parametry-proekta-restavratsii-kresto/)
identify the entrance, church, crosses, guards' houses, kitchen/laundry, bath
and hospital/service buildings as elements of one historic complex. The model
preserves that historic ensemble; the unbuilt glass additions and redevelopment
renders are not used as existing geometry.

Twelve additional mapped building records are authored, with exact perimeters:
`w60557319`, `w60557331`, `w60557332`, `w60557312`, `w60557335`,
`w60557412`, `w1239726592`, `w1239726595`, `w1538997281`, `w60557323`,
`w60557390` and `w60557409`. They have individually estimated low eaves and
fitted pitched roofs, arched barred windows and brick courses. A single
512-square procedural bonded-brick texture adds close detail to the shells;
short-range instanced corbel teeth avoid a material or texture per facade.
The full-compound visual review adds standing seams down the actual main-cross
slopes and a restrained second metal tone on the opposite-facing planes. CPU
rays through the real triangles measure 22.250 m at the western roof ridge and
19.447 m at 6 m across it: a physical pitch of about 25 degrees, rather than a
flat deck suggested by the former uniform colour. The entrance's upper trim
is restricted to its raised centre and the side cap has full brick support;
there is no blue-sky gap between a floating cornice and the side-wing wall.
The neighbouring clinic quadrangle `r17026344` retains its separate identity
and courtyard roof rather than receiving a fictitious single pitched ridge.

The replacement ground ring follows the mapped wall chain and street-building
line. Its **41,488 m²** is an authoring coverage footprint, not a legal parcel
area. It spans `(602.5..868, -2493.2..-2285.1)`. One quiet asphalt finish and ten
deliberate lawn shapes replace the default mottled grass/asphalt mix. Lawns are
cut out of the paving, avoiding coincident flat planes at an aerial distance. The seven
replaced short front-court ways retain their surveyed centrelines with the same
neutral finish. Ordinary road asphalt is above this surface and remains intact.
The 22 curated mature conifers/broadleaf trees fit the visible yard pockets; each
trunk is checked against building footprints. Lawn edges and tree positions are
photographic reconstruction estimates, not a tree survey. The pure
`compound-plan.js` ring also supplies the area tree/tuft/prop rejection hook so
the generic generator does not plant a second landscape through this layout.

The five mapped masonry wall ways and three short street iron runs are rebuilt
as independently breakable bays. Every collider belongs to its knock
record. Architectural retaining/brick finishes do not leave a permanent
invisible wall after the bay falls. No frame callbacks, flags or flashing
effects are added. The authoring source check and focused strict claims audit
pass, with all **39** module-owned records drawn and no unclaimed building
intrusions. The lead performs integrated screenshot, road, bake and performance
checks before committing.

Boundary placement respects the real street-network asphalt, including parking
width. Where it reaches beyond the old wall survey the wall is moved to the
first clear line inside the grounds; shared corners keep one correction vector
so their joins remain continuous. Every bay corner is tested with a 0.22 m
clearance margin. Mapped service approaches retain openings, including the
rear drive off Komsomola and the east riverfront entry. This is a geometry fix,
not a new road-audit exemption.

An independent CPU index of the actual upward-facing roof triangles samples
**3,651** points inside the twelve newly authored auxiliary footprints: every
point has a roof, with no hole or missing slope. It uses built world geometry,
not the roof builder's own height function.

Additional review cameras: `722,1.7,-2279,0,14` (entrance),
`770,110,-2180,6,-31` (entire compound), and
`705,3,-2318,180,5` (inside the front court).

## Mineralnaya Visitation church reference set

- [The Catholic archdiocese parish record](https://cathmos.ru/org/sankt-peterburg-prihod-poseshheniya-presvyatoj-devoj-mariej-elizavety/)
  identifies the church at Mineralnaya 21, letter D.
- [Parish website](https://site-fd49cf6.1c-umi.ru/) shows its current appearance.
- [Fiesta exterior photograph](https://www.fiesta.ru/uploads/slider_image/image/105063/v880_kostel-na-myneralnoj-ulyce.jpg),
  downloaded and visually inspected: pale cream walls, very tall round-headed
  nave windows, stepped buttresses, arcaded cornice, a transverse gable with a
  circular rose window, octagonal clock/bell stages and a slender faceted spire.
- [City multicultural heritage entry](https://ethnospb.ru/p7/t62/l424/index.html)
  identifies Benois's church and its later clock-tower addition.
- [Mapped OSM building](https://www.openstreetmap.org/way/366423247)
  supplies the real nave/apse/transept/tower perimeter.

The current full footprint is centred at approximately `(999.5,-3770.4)`.
The tower's mapped position is `(1022,-3774.95)`. The module builds the exact
lower shell, tall arched window frames and mullions, grey sills, arcaded cornice,
rose-window spokes, transverse gable, square entrance tower, octagonal clock
and bell stages, ribbed eight-sided spire and small cross. No flagpole is added.
The detail review adds projecting stepped buttresses with grey weathering caps,
the lower round-headed plinth windows, gable tooth courses and the bell-stage
cornice. Its large hall, crossing rose-window gable and narrower narthex now
have separate fitted pitched surfaces. The transverse gable has a supported
roof behind it; the nave no longer uses a broad floating rectangle. The small
tower-footprint rim is closed and the height change to the narthex has a solid
gable wall.

Vertical dimensions are **inferred from photographs and mapped footprint scale**:
nave eaves 16.5 m, roof ridge 20.1 m, tower cornice 35.65 m, spire 46.4 m,
cross tip 48.1 m. These are modelling estimates. Opaque shared toon materials
avoid a separate reflection pass. Detailed tracery is finite at 500 m; the
silhouette remains to 2100 m. Review at `1040,1.7,-3725,47,17`.

## Verification

`node tools/area.mjs finlyandsky tools/check.mjs landmarksFinlyandsky` passes:
approximately 350,495 triangles including close barred-window instances,
61 meshes, 20 instanced meshes, 19 materials, 278,528 canvas pixels and
no update callbacks. The area lead performs integrated visual, road, claims,
loading, driving and final bake verification. This headless result is not an FPS
measurement. All authored geometry is static and receives normal batching,
cell splitting and authored LOD handling. The compound's fence/wall bays
use the shared knock system. Ordinary street lamps, benches and other furniture
remain with the area's shared generators.

The focused strict draw audit also passes with all 39 claimed records drawn
and no geometry intruding deeply into an unclaimed building:
`node tools/area.mjs finlyandsky tools/claims-draw-audit.mjs --modules landmarksFinlyandsky --strict`.

The roof review also raycast the actual built, upward-facing geometry from
above: **1,934** sampled Kresty interior roof points and **764** Visitation
points have complete roof coverage. A probe on the western low wing gives
11.60 m (its pitched roof), rather than the former 18.7 m body height. These
are CPU geometry checks, with real-renderer review and final bake by the lead.
