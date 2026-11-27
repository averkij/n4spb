# Street entrances of the seven central metro stations

The 13 established door positions serve the historic train and escalator routes on `strip.html`. Eight further doors follow the street ends of mapped pedestrian routes. Four stairwells on Nevsky Prospekt descend 4.5 m. On the current district pages each entrance opens onto a bounded landing that the player can leave on foot. The full metro route takes over behind the original doors on the historical strip.

## Reference photographs and placement

| Station | Prototype and site evidence |
|---|---|
| Ploshchad Vosstaniya | The Ligovsky rotunda has ochre stone archivolts, a grille in each fanlight, oak leaves with brass-framed circular windows, and a lower kick plate. The second vestibule by Moscow Station has a rectangular glazed aluminium entrance. The west annex has three separately mapped street accesses including the covered colonnade. [Rotunda doors](https://www.metrowalks.com/f/spb/plvosst/210605-1130961.jpg) · [Both vestibules and the station-side entrance](https://www.metrowalks.com/ru/petersburg/kirovsko-vyborgskaya/pl-vosstaniya) |
| Mayakovskaya | The entrances sit in the recess behind the arches of the Nevsky Atrium and in the Marata Street wall. The peach stucco and rustication belong to the existing Atrium model. The new narrow metal leaves, glazed transoms and handles fit inside those openings. [Nevsky and Marata corner](https://www.metrowalks.com/ru/petersburg/nevsko-vasileostrovskaya/mayakovskaya) |
| Vladimirskaya | The square-facing entrance has a projecting green cornice, a decorative upper grille and varnished oak leaves. The separate 2008 exit opens onto Kuznechny Lane and uses oak doors made to the 1955 designs. [Main entrance, August 2025](https://www.metrowalks.com/ru/petersburg/kirovsko-vyborgskaya/vladimirskaya) · [History of the separate exit and oak joinery](https://mirmetro.net/articles/stanciya-vladimirskaya) |
| Dostoyevskaya | The old exposed curtain wall was enclosed by the Renaissance Hall complex. Two short, distinct outdoor stairs lead from the street to the modern passage doors. The rectangular glazed joinery is recessed under a stone head. The original game entrance still serves the working train route. [Photographs identifying the enclosed facade](https://www.metrowalks.com/ru/petersburg/pravoberezhnaya/dostoyevskaya) · [North stairs](https://www.openstreetmap.org/way/799119952) · [South stairs](https://www.openstreetmap.org/way/373886367) |
| Admiralteyskaya | The pale green commercial building has a series of deep, round-headed reveals, metal rails inside and a recessed glazed door bank. The existing two central-strip apertures are on the chamfer of the simplified building. The separate eastern bay follows the continuation of that facade. [Entrance arcade and close-up](https://www.metrowalks.com/ru/petersburg/frunzensko-primorskaya/admiralteyskaya) |
| Gostiny Dvor | The paired doors are in the back of the yellow Nevsky shopping arcade, below broad arches and suspended identification plates. The strip preserves its moving glass pair. A third access follows the indoor connection to the covered Sadovaya gallery. [Nevsky arcade and canal entrance](https://www.metrowalks.com/ru/petersburg/nevsko-vasileostrovskaya/gostiny-dvor) · [OSM interior passage to the Sadovaya gallery](https://www.openstreetmap.org/way/589412308) |
| Nevsky Prospekt | The Engelhardt House has turquoise piers, white arch surrounds and contrasting iron frames. The four underpass mouths on Nevsky have low pink-brown granite parapets, visible yellow top treads and descending handrails. Their identification panels are mounted on the far parapet, below sight level from across the street. [Street-level stairwell and Engelhardt House](https://www.metrowalks.com/ru/petersburg/moskovsko-petrogradskaya/nevskiy-prospekt) |

The game uses the strip's established coordinates for its historical connections. Some surveyed OSM station nodes sit behind the street door. The geometry uses these actual places.

- The indoor entrance and exit nodes `n7473625772` and `n7473625773` connect through Renaissance Hall to the upper ends of two exterior stairs, `n7473625771` and `n3773175874`. The adjoining door groups have four and three represented rises respectively. The OSM stairs establish position and direction. The rise counts are an approximation. [Entrance connection](https://www.openstreetmap.org/way/1097251579) · [Exit connection](https://www.openstreetmap.org/way/1097251580)
- At Gostiny Dvor, `n5628361779` is inside the shopping complex. The mapped route meets the Sadovaya gallery through `n6226095895`. Its model uses the nearest complete arcade bay, 1.97 m from that point. [Indoor node](https://www.openstreetmap.org/node/5628361779) · [Gallery door](https://www.openstreetmap.org/node/6226095895)
- At Admiralteyskaya, the standing strip door at the west end is within 0.8 m of exit `n5464315008`. The centre and eastern arches represent the two entrances. Their opening widths follow the simplified facade and retain the metro room clearance. [West](https://www.openstreetmap.org/node/5464315008) · [Centre](https://www.openstreetmap.org/node/5464314991) · [East](https://www.openstreetmap.org/node/5464314995)
- The second vestibule at Moscow Station has three exterior connections in addition to the historic station-side portal `n1109163066`. The Ligovsky door and courtyard exit share the outer wall line. The colonnade route starts under the arcade 2.8 m from the simplified west facade, so the opening is aligned with that facade. [Ligovsky entrance](https://www.openstreetmap.org/node/1109163125) · [Courtyard exit](https://www.openstreetmap.org/node/1109163132) · [Covered path at exit 3](https://www.openstreetmap.org/way/233358795)

## Models and checks

Rebuild the ten shared joinery prototypes with `blender --background --factory-startup --python-exit-code 1 --python tools/model-central-metro-entrances.py`. The Blender meshes store the millimetre coordinates, split normals and per-face colour palette in a synchronous game asset. Each door uses one shared-material vertex-coloured mesh. The surrounding architecture remains the responsibility of the building module.

Run `node tools/area.mjs <id> tools/central-metro-entrances-test.mjs` on `palace`, `admiralty`, `vladimirsky`, `smolny` and `strip`. Add `--winter` for winter ground, ice and the seasonal world decorations. The archived strip normally opens in summer. Its winter run explicitly selects the cold scene inside the test harness. The test walks through each door and back, checks the street sightline at eye height, descends every stairwell to its landing and returns. On the strip it also boards and exits trains on all five lines.

The same street positions can appear on adjacent pages. Counts below are per page, in each season.

| Page | Door groups walked both ways | Stairwells descended and climbed |
|---|---:|---:|
| Palace | 16 | 4 |
| Admiralty | 8 | 4 |
| Vladimirsky | 13 | 0 |
| Smolny | 6 | 0 |
| Historical strip | 21 | 4 |

The OSM paving at Gostiny Dvor (r16467256) is cut at the southern stair mouth. The neighbouring Rusca portico follows the north face of the mapped building at 2 Dumskaya Street (w53610231). The city heritage register confirms the street address. [Building outline](https://www.openstreetmap.org/way/53610231) · [Heritage boundary and address, 11 December 2024](https://base.garant.ru/411099286/)

The strip run also exercises the proximity-operated glass doors at Gostiny Dvor and boards and alights on all five lines. Two high sightlines per door check the recessed transom, and three vertical samples per stairwell check that street paving leaves the steps visible. The two Renaissance Hall stairways have physical support under each tread and at the threshold. An independent Blender 5.2.3 export produced the identical 207,899-byte mesh module (SHA-256 `bc050bc74df805774c26501d37dae5b224a47c6791bbb4cf102a2483556849a1`).
