# Комендантский аэродром — Озеро Долгое

Planning-map area 89 is implemented as 53 Q territory rectangles (17.7728 km²). Scene coordinates below use the project's calibrated Saint Petersburg projection, in metres.

## Source and mapped anchors

`tools/marine-data.mjs --area komendantsky` converted OpenStreetMap geometry from an Overpass **mapped** snapshot dated **2026-07-28 02:16:18 UTC** (61,597 elements), with a separate 600 m **water-ring** query dated **2026-11-12 13:01:19 UTC** (486 elements). These are distinct OSM base timestamps, not a single November survey. Generated `data/city-q*.js` files retain the source headers. Data © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright).

| Feature | OSM feature | Scene anchor (x, z) |
| --- | --- | ---: |
| Долгое озеро | [relation 6597846](https://www.openstreetmap.org/relation/6597846) | approximately (-4869, -9345) |
| First Russian aviators memorial, General Seleznyov Garden | [node 6039581494](https://www.openstreetmap.org/node/6039581494) | (-5190.9, -9366) |
| Seagull-shaped park gateway | [node 11115677390](https://www.openstreetmap.org/node/11115677390) | (-4567.4, -9312.7) |
| Park name artwork | [node 11115673187](https://www.openstreetmap.org/node/11115673187) | (-4553.1, -9327.5) |
| Aviators' memorial, Matsievich Garden | [node 7035735851](https://www.openstreetmap.org/node/7035735851) | (-3577.1, -7243) |
| Komendantsky Prospekt metro | [node 6242445475](https://www.openstreetmap.org/node/6242445475) | (-5300.3, -8678.8) |
| Pionerskaya metro | [node 96453108](https://www.openstreetmap.org/node/96453108) | (-3071.4, -8009.2) |

The mapped Dolgoye Lake relation spans about 60.015514–60.017189° N, 30.259776–30.268653° E. Seven busts in Matsievich Garden follow OSM nodes [7035735852–7035735857](https://www.openstreetmap.org/node/7035735852) and [7035735864](https://www.openstreetmap.org/node/7035735864).

## City references

- The [Primorsky district history](https://www.gov.spb.ru/gov/terr/reg_primorsk/raion_info/history/) describes the former airfield, the housing district built from 1973, and its aviation street names.
- The city's [park account](https://www.gov.spb.ru/gov/terr/reg_primorsk/news/170615/) describes paths, cycle routes, play and sports areas, planting, and a stage. Its [entrance account](https://www.gov.spb.ru/gov/terr/reg_primorsk/news/124665/) locates the seagull-shaped gateway at Marshal Novikov and Olkhovaya streets.
- The city identifies [two U-2 aircraft in the General Seleznyov Garden memorial](https://www.gov.spb.ru/gov/terr/reg_primorsk/news/143232/) and [seven aviator busts in Matsievich Garden](https://www.gov.spb.ru/gov/terr/reg_viborg/news/221230/).
- Reference photos show the [blue-green aircraft and slanted pylons](https://www.fiesta.ru/spb/places/pamyatnik-pervym-aviatoram-rossii/), the [large turf-faced park letters](https://kanoner.com/2018/01/25/158491/), and the [dark cylindrical bust pedestals and central paved alley](https://kanoner.com/2019/05/27/163088/).

## Coverage limits

The `102_3d_piter` whole-city house table supplied **zero matching surveyed facade records** for this area (`known-data.js`). Buildings and most street/park details use mapped OSM geometry and procedural rendering. The two aircraft, Matsievich memorial ensemble, park gateway, and park letters are simplified static models at mapped positions, not measured replicas. Sparse noncolliding reeds mark the mapped south/east shoreline; their individual stems are illustrative. The documented stage has no bespoke model because its exact location was not established.
