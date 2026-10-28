# intro-draft.html: how it is built

`maps/intro-draft.html` is a single self-contained page (data embedded, no network): a draft of the START MAP of the app, where a visitor picks the part of Saint Petersburg to walk in.

* **Areas** = the 111 real municipal districts (`admin_level=8`, the "okrugs") of the federal city and its towns, coloured by the 18 real city districts (`admin_level=5`). Their borders follow streets, rivers and canals (OpenStreetMap).
* **Size classes** against area B (the North, 3.947 km2): `b` = B +-20 % (3.16-4.74 km2), `large` = up to 1.5 x B (can stay), `big` = more (to split, `split` = about area / B), `small` = less than B -20 % (to merge; `mergeGroup` pairs small neighbours so the sum is close to B).
* Land area is rasterised (40 m cells) from the OSM polygons minus the sea (coastline) and inland water.
* The LIVE areas come from `src/areas/registry.js` (`build-intro.mjs`: every row with a `mapId` that is not `parked`; the badge letters are the `LIVE_LETTER` table there): P Palace-Liteyny (98), S Smolninskoye (96), A Admiralty-Haymarket (46), V Vladimirsky-Ligovka (97). Each is drawn as dashed rectangles (the registry's `play` rectangles = the walkable territory), its district gets an orange outline, a `Live` badge in the list and a `Live scene` block on the card (sights, approxMB, walkable km2 as the union of the rectangles, the seamless-crossing neighbours from the edge gates). The parked strip and North (old A / B scenes) are no longer drawn; 'area B' (3.95 km2) stays only the size reference. A new live area = a registry row with `mapId` + one letter in `LIVE_LETTER`, then rebuild (`build-intro.mjs`, `build-streets.mjs`, `build-overlap.mjs`, `assemble.mjs`). The 'By source' mode and its counters describe the SOURCE project's coverage, not the live areas, and do not change with them.

## Rebuild

```
cd maps/intro-draft-src
node fetch.mjs            # (optional) the base layers of the earlier map: coast, districts, boundary, rivers, water, roads, c_* ; cached in ./raw
node fetch2.mjs           # municipal districts, places, main roads (Overpass); cached in ./raw
node fetch-tiles.mjs      # (optional) named secondary / tertiary streets for the outskirts, in tiles (the one-shot query times out)
node extract-source-coverage.mjs   # the playable rectangles + sights of the source project (coverage.html) -> raw/source-coverage.json
                          # the street names of the centre come from the source project's raw OSM (data/osm-raw/roads.json) when it is present
node build-intro.mjs      # -> intro-data.json (git-ignored)
node build-streets.mjs    # adds the named street chains, label anchors and each area's border streets to intro-data.json
node build-overlap.mjs    # the area overlap rules of docs/AREAS.md section 12: walkable territory (fp), overlap zones (ext), water (wz), shared junctions, bridges between areas
node assemble.mjs         # -> ../intro-draft.html
node check-edits.mjs      # (optional) the edits of edits.json did what they promise (merged areas present, live areas at their registry mapId, territory reach); exit 1 on a failure
node shot-intro.mjs out "" 1500 900   # a PNG of the page through Edge (puppeteer-core from the repo's node_modules)
```

## Manual edits (edits.json)

The 111 districts are cut and merged by hand in `edits.json`; the page shows 106 areas.

* `merge`: `{ names, ru, en, stable? }` unions the districts `names` (plain names without "округ"; the FIRST one keeps the OSM id, the city district and the label point) into one area called `ru` / `en`. By default the removed districts shift the index `k` of every later area down by one; `"stable": true` fills the freed slot with the LAST district instead, so the `k` of all other areas stays (the registry `mapId` of the live areas, `docs/AREAS.md`, `tools/area-shape.mjs --k` depend on it; any merge that frees a slot below a live area needs it). Done: Дворцовый–Литейный, Владимирский–Лиговка, Адмиралтейский–Сенной (all live) and **Васильевский–Округ № 7 / Vasilyevsky–Okrug № 7** (5.76 km2, `large`; stable: Коломяги moved from 106 to 50). The new area is a Василеостровский район area (district of the first name; OSM puts Округ № 7 itself into the Адмиралтейский район, so that district goes from 6 to 5 areas and 17.0 to 13.5 km2).
* `cut`: `{ street, end?, to?, maxM? }`, read by `build-overlap.mjs`. It closes the gap between the END of a named street (the chain end that lies furthest in the compass direction `end`: n, s, e, w, ne, nw, se, sw; every end when omitted) and the nearest water cell within `maxM` (default 300 m; `to` may also be a `[lon, lat]` point) with a barrier line, as if the street ran on to the coast. The block faces of the overlap build (`R2`) are the faces of the street network; where a street stops short of the shore the two sides are ONE face, owned by whichever district has most of its cells, and every neighbour of that face reaches 320 m into the whole of it. Done: Большой проспект В.О., `end: sw`, 200 m to the Gulf shore. Before, the shore strip of Gavan west of it was one face with the south-west tip of Okrug 7 and the territory of Okrug 7 (the red line on hover) ran 1.75 km west along the harbour as a ragged tentacle; now the merged area reaches at most 370 m beyond its land. The land cells (the district rasters) are not touched by a cut, so no area changes its km2.

`raw/` and `intro-data.json` are git-ignored (about 25 MB of Overpass responses). Data: OpenStreetMap contributors (ODbL).

## Source project coverage (D:/git2/agi-fun-tests/102_3d_piter)

The source scene plays in 76 rectangles (~86 km2 incl. water) and has 411 authored sights. The page shows them as green hatching, a colour mode ('By source') and a card line per area: 19 of the 111 areas are covered >= 90 % (the whole historic core), 5 are partial, 13 are touched at the edge, 74 have nothing. Its raw OSM (`data/osm-raw/roads.json`, box lon 30.179-30.415, lat 59.844-59.988) supplies every named street of the centre.
