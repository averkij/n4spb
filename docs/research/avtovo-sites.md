# Автово: non-metro sights

This module covers the mapped industrial and wartime landmarks along Prospekt Stachek. The two metro vestibules are authored separately in `landmarksAvtovoMetro`. The whole-city source scene has no coverage or authored sight within this planned area, so these shapes are authored from the current OSM snapshot and documentary references, not copied from the source.

## Mapped anchors and claims

Coordinates are metres in the project's north-up frame, with positive Z south. They come from the Avtovo OSM bake (12 November 2026). The monument records are read by ID from `MONUMENTS`; the table gives fallback coordinates. OSM building IDs are claimed in `GROUPS.landmarksAvtovoSites`, so their generic city shells are replaced by the authored forms.

| Sight | OSM feature | Scene anchor (X, Z) | Modelled form |
| --- | --- | ---: | --- |
| [Central Kirov Factory gate](https://www.openstreetmap.org/way/128500581) | `w128500581`, guardhouse footprint | `(-5215.5, 5889.5)` | Low yellow guardhouse, open central passage, narrow glass bays and the visible factory-name inscription. Footprint is roughly 25 × 8 m at yaw 1.11 rad, matching the mapped NNE–SSW long axis and 22 × 26 m bounding box. |
| [N. I. Putilov monument](https://www.openstreetmap.org/node/8672158517) | `n8672158517` | `(-5102.3, 5883.7)` | Bronze standing figure with papers and one hand at hip on pale granite plinth. The mapped node is 113 m east of the gate. |
| [A. I. Marinesko monument](https://www.openstreetmap.org/node/2592593238) | `n2592593238` | `(-5160.2, 6919.8)` | Naval officer holding his cap in front of a greatcoat, standing on an irregular dark boulder. |
| [“Tank-Pobeditel”](https://www.openstreetmap.org/node/1340264515) | `n1340264515` | `(-5187.0, 7949.1)` | Olive KV-85 with gun, ten-sided turret, six wheels per side, treads and white 283 on a raised granite pedestal. |
| [DOT No. 930, Kirovsky Val](https://www.openstreetmap.org/way/119225860) | `w119225860`, `building=bunker`, `bunker_type=pillbox`, mapped height 3.3 m | `(-5130.5, 7953.9)` | Dark, low concrete pillbox with a long embrasure, white 1941–1945 date and a low commemorative slab beside it. |
| [Blockade tram](https://www.openstreetmap.org/node/1368607035) | `n1368607035` | `(-5325.1, 8113.6)` | Red and cream MS car on short isolated rails and a pale stone display platform, route 12, car number 2465, overhead pole and historical-photo-toned window strips. |

The factory gate is east-facing, with its long side following the mapped guardhouse ring. Its central 8.2 m passage has no physics box. The tram's long axis follows the parallel service road, leaving approximately 3.8 m from its display platform to the mapped road centreline. The tank plinth and bunker have bounded boxes; there are no broad asphalt covers or blockers across the main footways. All geometry is static and built in separate culling roots for each site.

## References used for form and history

- [Saint Petersburg administration, Putilov monument unveiling](https://www.gov.spb.ru/press/governor/198121/) and [district report](https://www.gov.spb.ru/gov/terr/reg_kirovsk/news/198153/): monument in the square by the factory gate, bronze by Konstantin Garapach, unveiled 2020. The [city square improvement report](https://www.gov.spb.ru/gov/otrasl/blago/news/199445/) locates the square between the gate and Kirovsky Zavod metro. [Photograph of the standing figure and plinth](https://sdelanounas.ru/blogs/136481/) guided silhouette and inscription.
- [Photo of the Kirov Factory entrance](https://vodokanal.spb-i.ru/catalog/heavy_energy_and_transp_engineering/kirovskiy_zavod/): low pale-yellow structure, flat parapet, narrow glazed bays, central open gates and name lettering, unlike a generic old masonry arch.
- [Kirov District Centralized Library wartime route](https://kircbs.akir.gov.spb.ru/kraevedcheskij-marshrut-avtovskij-rubezh.-ot-blokadyi-do-pobedyi/): identifies the Stachek 108 tank/DOT, Stachek 114 tram, and Marinesko at Stachek 67 as local route stops.
- [Saint Petersburg administration on the Kirovsky Val memorial](https://www.gov.spb.ru/gov/otrasl/inspek/news/281076/) and [Presidential Library photo album](https://www.prlib.ru/item/468123): identify the KV-85, DOT No. 930 and stele as a memorial group on Stachek 106–108. The Presidential Library image guided the tank's olive body, white 283, elevated stone plinth and turret silhouette. [Photograph of the bunker](https://rusversia.ru/object/memorialnyy-kompleks-na-prospekte-stachek) guided its dark surface, long embrasure, white date and adjacent low slab; the slab is placed within the same clearing because OSM has no separate feature for it.
- [Gorelektrotrans, January 2026](https://electrotrans.spb.ru/novosti/2026/3799_rabotniki_tramvaynogo_parka_8_vozlozhili_cveti_k_blokadnomu_tramvau): preserved MS tram at Stachek 114, beside tram park No. 8, honoring the wartime tram. [Vehicle photograph](https://www.free-photos.biz/images/transportation/other_vehicles/blockade_tramway_monument.jpg) guided the red lower body, cream frames, roof equipment and display rails. No photograph is included as a shipped texture.
- [Saint Petersburg housing administration](https://www.gov.spb.ru/gov/otrasl/gilfond/news/276274/) describes the Stachek 67 architectural ensemble around the Marinesko memorial. [Monument photograph](https://www.companybest.ru/publications/60-svoboda/3048-pamyatnik-a-i-marinesko-na-pr-stachek.html) shows the cap held in front, long naval coat and rough dark boulder plinth.

The factory-name letters and vehicle numbers are small batched geometry rather than textures. No source reference photo is shipped in the project. The monument meshes do not animate or add frame callbacks.

## Verification

- `node tools/area.mjs avtovo tools/check.mjs landmarksAvtovoSites`: passes with 8,160 triangles, 61 bounded meshes, 12 colliders, zero update functions and no canvas texture.
- Integrated live-area camera pass with environment, streets, city and props: `shots/avtovo/sites-review_0..5.png`, `sites-final_0..4.png`, and final `sites-verify_0..1.png`. The final pass rendered the module in about 16 ms with no page errors. GPU shader compiler warnings are shared engine warnings, not module errors.
- The final southeast path view of Marinesko shows the officer and the figure's inscription after a 13 m tree keepout at the mapped node. The modeled figure remains intentionally faceted to match the scene's low-poly art direction.
