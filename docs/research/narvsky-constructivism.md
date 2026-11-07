# Нарвский: ДК имени Горького

Authored 2026-11-07 by the constructivist-landmark specialist. This module owns
only OSM `w42342130`, at площадь Стачек, 4. The modern OSM name is «Дворец
искусств Ленинградской области»; its `old_name` is «Дворец культуры имени
Горького». Neighbouring university, technical-education and commercial buildings
remain with the generic city. The Narva Gate is a separate specialist's work.

## Map evidence and source limits

The correct historical source scene is `D:/git2/agi-fun-tests/102_3d_piter`.
Inspection of its building table found no Gorky palace, district council or
Stachek Square source coverage; the retained central-south source ends north of
these landmarks. There is consequently no old Gorky helper to port.

The current Kolomna supplemental data already retains `w42342130` as a whole
five-level civic footprint: centroid `(-4220.5,3556.6)`, area 4,179 m², no parts.
A fresh Overpass geometry query on 2026-11-07 independently confirmed this ID,
address, current/old names and `building:architecture=constructivism`:

```
[out:json][timeout:60];
way[building](59.899,30.271,59.902,30.280);
out tags center geom;
```

The curved west-facing front is explicitly present in the mapped polygon, from
`(-4242.7,3577)` through `(-4248.5,3564.9)` to `(-4250.8,3551.7)`. The two stair
tower front edges are also surveyed and fan outward from the middle. The local
authoring frame is `(-4248,3564.9)`, rotation `-1.192 rad`.

Map links: [palace footprint](https://www.openstreetmap.org/way/42342130),
[Stachek Square neighbourhood](https://www.openstreetmap.org/#map=18/59.9007/30.2752).

OSM's small rounded southern stair projection overlaps the mapped 4 m service
road `w908243863` by under a metre. The builder reconciles perimeter vertices
towards the palace interior whenever the actual street net (or headless layout
road query) reports less than 0.8 m clearance. Both geometry and physical walls
use the adjusted closed ring; the source record is never mutated. This is a
continuous architectural setback, not a gap in the wall. The focused test samples
all ground-level wall boxes against mapped drivable carriageways.

## Architectural and photographic references

* [Culture.ru / Museum of Architecture catalogue](https://www.culture.ru/institutes/13940/dvorec-kultury-im-a-m-gorkogo-dom-kultury-moskovsko-narvskogo-raiona):
  the theatre core, convex glazed foyer, flanking stair towers and connected club
  wings establish the plan and front composition. The catalogue attributes the
  final design to Gegello and Krichevsky with engineer Raylyan, following
  Dmitriev's initial arrangement, and dates construction to the 1920s.
* [Building passport / reproduced heritage protection description](https://prawdom.ru/k_konstruktivizm.php?hm=Stachek-pl-spb_4&r=99101):
  rectangular openings, six pentagonal front pilasters, three double-leaf entrance
  openings and a balcony with six cube brackets; metal roofs combine several
  slopes. This is a secondary reproduction of the protection description, used
  alongside the museum catalogue and photographs.
* [Front-on photographic reference](https://therapy.irkutsk.ru/photo/7/56g.jpg),
  downloaded to the session temp directory and visually inspected: muted sandy
  cement walls, dark blue-grey gridded glazing, pale projecting cornices, square
  stair towers with a higher floor, dark stone entrance base, wooden doors and
  fine roof railings. The large glazed middle and flanking towers dominate the
  view; there is no classical column portico or dome.
* [Second front / oblique photographic reference](https://4traveler.me/sites/default/files/travel/collections/952668777/DSC01133.jpg):
  identifies the same façade from an oblique angle. Temporary event banners and
  commercial advertisements in photographs are not copied.

No photo files or textures from these sources are shipped. Geometry is authored;
the street footprint is OpenStreetMap data, subject to the existing ODbL credits.

## Implemented interpretation

The exact mapped shell receives a continuous thin physical perimeter, individual
window grids, a flat metal roof cap and a separate modest pitched auditorium roof.
The convex middle is dark opaque architectural glazing with distinct horizontal
transoms, closely spaced vertical mullions and six five-sided stucco pilasters.
The balcony/canopy follows its curvature and has six supporting cube brackets.
Tower caps follow their respective surveyed front edge orientations; their front
windows are placed on those wall planes. Four-sided fine roof rails complete the
tower silhouettes. Window treatments continue around all other perimeter edges.

Vertical proportions are photographic estimates, not survey measurements: main
cornice 22.35 m; tower cap 27.2 m; roof rail top 28.1 m; auditorium ridge 25.1 m.
The OSM height of 16.5 m is an inferred five-level fallback, not a measured height,
and does not reproduce the monumental front proportions in the inspected photo.
The exterior palette uses sandy stucco `#c2af87`, pale stone `#d0c4a7`, charcoal
granite `#62625b`, blue-grey glazing `#354957` and grey-green metal `#737a77`.

All three entrance portals are genuinely open in both the drawn lower façade
and physics. Wooden leaves stand along the reveals, leaving a 2.5 m clear passage.
They lead into a small, street-level hollow foyer with a drawn floor clipped to
the front polygon and a physical rear wall. It is an exterior/foyer interpretation;
the auditorium, stair interiors and functional theatre programme are not authored.
The entrance floor intentionally remains flush for the existing walking contract.
Two plain cultural-event panels reserve the shared facade-label registry first.
No flags, detached furniture or additional lights are introduced.

## Integration and cost

Import `GROUPS_LIST` from `landmarksNarvsky/constructivism-groups.js` into the
Narvsky area group table and include `narvsky-gorky` in its landmark module's
`OWNS_GROUPS`. Call `buildConstructivism(ctx, svc)` once in that module. The helper
uses `ctx.L.groupMembers('narvsky-gorky')`; its optional third argument accepts a
mapped record for isolated tests. It appends `entrances`, `photoSpots`,
`landmarkBuildings` and `triangles` to the supplied service object.

Current headless build: **13,161 triangles, 17 pre-batch meshes, 10 materials**
including the two generated event-panel materials. The shell/roof silhouette has
a finite 2,600 m range; windows and cornices 650 m; mullions, labels and roof rails
220 m. Every mesh is immutable `ctx.addStatic` geometry with one authored LOD
registration. There are no update callbacks, dynamic roots, new rendering passes,
uncullable meshes, bypass flags or furniture collision registrations.

Validation command:

```
node tools/area.mjs kolomna tools/narvsky-constructivism-test.mjs
```

It passes mapped claim scope, all three entrance approaches, hollow foyer and
solid rear wall, adjacent facade collision, road clearance, finite vertex buffers,
world placement, tower height, material/mesh budgets and one LOD per mesh.
The same test can run under the Narvsky area after its integration. The lead owns
GPU screenshot review, integrated road/marking audits, bake/revision integration
and performance measurements; CPU success does not establish those results.

Suggested combined screenshot cameras (x,y,z,yaw,pitch): front street
`-4293,1.7,3582,-68,12`, tower/centre oblique
`-4290,10,3520,-43,4`, entrance close-up `-4253.6,1.7,3567,-68,2`, and aerial
`-4312,72,3595,-68,-31`. These are authoring suggestions, not measured safe car poses.
