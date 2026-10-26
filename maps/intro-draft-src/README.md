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
node shot-intro.mjs out "" 1500 900   # a PNG of the page through Edge (puppeteer-core from the repo's node_modules)
```

`raw/` and `intro-data.json` are git-ignored (about 25 MB of Overpass responses). Data: OpenStreetMap contributors (ODbL).

## Source project coverage (D:/git2/agi-fun-tests/102_3d_piter)

The source scene plays in 76 rectangles (~86 km2 incl. water) and has 411 authored sights. The page shows them as green hatching, a colour mode ('By source') and a card line per area: 19 of the 111 areas are covered >= 90 % (the whole historic core), 5 are partial, 13 are touched at the edge, 74 have nothing. Its raw OSM (`data/osm-raw/roads.json`, box lon 30.179-30.415, lat 59.844-59.988) supplies every named street of the centre.
