# Lakhta Center: architecture and geometry repair

Researched 2026-10-31. Photos are visual references, kept in the temporary
reference directory, rather than distributed as game assets.

The previous city generator treated the tower as unrelated generic buildings.
In the current OSM extract, `w566178962` is marked as a duplicate of the ground
part and `w566178964` as its duplicate, although their height intervals are
115–231 m and 231–347 m. Suppressing those records left the upper parts hanging
above the lower building. The authored landmark replaces the entire stack in
one operation; it does not change the shared duplicate or facade rules.

## Primary references

- [Lakhta Center: official description](https://lakhta.center/en/about/):
  462 m, 87 floors, 90° total petal rotation; the 260 m boomerang building with
  a longitudinal atrium, the entrance arch, stylobate and administrative block.
  The official page states that the multifunctional building varies from
  23 to 85 m, with negatively inclined facades and membrane roofing. It also
  documents the 16,505 cold-bent glazing units.
- [GORPROJECT: Lakhta Center](https://gorproject.ru/en/projects/lakhta-center/):
  the built project's general designer explains that each of the five wings
  rotates about **its own centre**, at approximately 0.82° per floor. Its
  four-stage geometry diagram distinguishes extrusion, petal rotation, taper
  and bowing. This is the modelling basis; rotating a rigid star about the
  whole tower axis would produce a different building.
- [Ilyukhina, Lakhman, Miller and Travush, 2019, structural design paper](https://www.researchgate.net/publication/336350085_Konstruktivnye_resenia_vysotnogo_zdania_Lahta_Centrv_Sankt-Peterburge):
  DOI `10.22337/2077-9038-2019-3-110-121`. The authors include the developer and
  GORPROJECT engineers. The column-axis pentagon side grows from 35.2 m on the
  first floor to 36.6 m on floor 16, then diminishes. The approximately 118 m
  spire starts at 344.4 m; the upper technical enclosure above 377.35 m is steel
  mesh. These structural dimensions are not the external facade diameter.
- [Lakhta Center's engineer account of the entrance arch](https://habr.com/ru/companies/lakhtacenter/articles/406465/),
  2017, with construction-control engineer Igor Romanenko: maximum west height
  23.8 m and east height 17.81 m; 98 m between the convergence axes, over 125 m
  in projected span. The entrance has a double-curved crescent plan and glass
  load-bearing facade fins, rather than a rectangular flat roof. The current
  official description retains the 98 m convention.
- [Kettle Collective: concept architect's account](https://www.kettle.co/projects/lakhta-centre):
  confirms the five-sided twisting form and double skin. The concept architect
  describes the tower in terms of changing water and reflections.

## Photographs actually inspected

The operator's [full tower from the north-east](https://lakhta.center/files/-/8e1fc02b9f22eb81351a19e287fa90e1/Lahta-spb.webp)
shows the cool blue-grey glazing, fine horizontal pane rows, silver maintenance
rails, slight lower shoulder and continuous pointed crown. The [sea elevation](https://lakhta.center/files/-/65564a53dc3c56f486a9a9fccb84f972/stroitelstvo.webp)
establishes the proportion of the tower and its sharply rising adjacent roof.
The [whole complex aerial](https://lakhta.center/files/-/93e3f6ebe41ab5e028bc30bc7072f719/architecture.webp)
shows the east crescent entrance, west boomerang and further administrative
wings. The [membrane roof close-up](https://lakhta.center/files/-/03deafa0f6956f6e05ecd0ebe9c9728b/roof_1.webp)
and [designer's facade/roof close-up](https://gorproject.ru/wp-content/uploads/2020/07/lakhta_dji_0173-1400x787.jpg)
show pale membranes, dark longitudinal glass and regular curved ribs.
The [designer's geometry diagram](https://gorproject.ru/wp-content/uploads/2020/07/lakhta_kruchenie-700x322.jpg)
and [drawn overall elevation](https://gorproject.ru/wp-content/uploads/2020/07/lakhta_lahta-wb-e1594043473600-700x611.jpg)
were also inspected. A linked operator image of St Isaac's Cathedral was
rejected as an architectural reference for this tower.

## Map ownership and interpretation

The OSM tower centre is **(-9683.1, -6084.1)** in scene metres. Claim
`okrug65-lakhta` owns the aggregate `r14667933`, tower parent `r18102137`,
ground part `r18102140`, and every tower interval `w566178960` through
`w566178964`. It also owns east entrance `r18102141`, west multifunctional
building `w305677141`, and administrative building `w674245127`.
Standalone authoring uses exact copies of those mapped outlines; integrated
area records take precedence. Ground-level building-wall colliders are hollow
and remain confined to the built footprints. The tower's upper taper uses the
normal roof capture, without a 462 m high rectangular obstacle.

The tower is a continuous union of five rotating square petals and a core,
with a gentle lower widening, smoothly diminishing shoulders and a five-sided
technical crown. The survey's external rings guide the envelope radii; these
are facade approximations, not a claim of BIM-level precision. Shared facade
materials represent the fine cold-bent panes. Major seams and the full tip
remain skyline geometry; narrow ribs and crown mesh have finite detail ranges.
The adjacent buildings retain their mapped ground plans and height families,
with sloping membrane roofs, curved glazed atria and inclined curtain walls.

All geometry is immutable and uses normal static batching and bounded authored
LOD registrations. There are no per-frame callbacks, new textures, special
culling bypasses, company logos or additional waterfront barriers. The three
flagpoles and waterfront surfaces are separate modules, so this builder does
not cover their platforms or the navigable water.
