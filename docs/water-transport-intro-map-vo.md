# Intro map: Vasilyevsky island (Okrug 7) tidy-up

Owner request (2026-10-28): on `maps/intro-draft.html` merge Округ № 7 and Васильевский, cut the little appendix of Округ № 7 on its west side along Большой проспект В.О. ("it looks strange") and add a short coast line instead. Draft map only: no `src/` change, no game version bump. Sources and rebuild: `maps/intro-draft-src/README.md`.

## What the "appendix" really was

The ragged red outline on hover is the WALKABLE TERRITORY of the area (`fp` = own land + overlaps, rules R2-R5 of `docs/AREAS.md` 12), not its land. The land of Округ № 7 (3.51 km2, one piece, a strip between Большой проспект В.О. and the Neva) has no appendix: 2,736 cells, no cell west of the harbour. The tentacle (1.75 km west along the harbour, about 1.97 km2 of overlap) came from the overlap build (`build-overlap.mjs`):

* a "block" is a face of the street network (street cells, rivers and water are barriers; 4-connected flood), owned by the district with most cells in it; an area reaches ONE block (320 m deep) into every neighbouring block that touches a border street cell;
* OSM ends Большой проспект В.О. about 200 m before the Gulf shore (node 30.23926, 59.92639). Past the end the shore strip of Гавань (243 cells) and the south-west tip of Округ № 7 (381 cells) were ONE block (624 cells, size-wise the largest block owned by Округ № 7). So Округ № 7 "owned" a strip of Гавань's coast, bordered every street along it, and reached 320 m into all Gavan blocks next to it: the far west blob across the Shkiperskiy canal, the strip along Наличная улица.

## What was changed

* `edits.json` `merge` Васильевский + № 7 = **Васильевский–Округ № 7 / Vasilyevsky–Okrug № 7**, 5.76 km2 (2.25 + 3.51, class `large`, 1.46 x B; before: one `small` and one `b`), walkable territory 8.04 km2 (was 4.30 and 5.48). Name: both real municipal names in the form of the three existing merges (Дворцовый–Литейный, ...); there is no single real name for the pair. The district (`rayon`) is the one of the FIRST name, Василеостровский (OSM puts Округ № 7 itself into the Адмиралтейский район: that district goes from 6 to 5 areas, 17.0 to 13.5 km2). Swap the two names in the entry (one line) to get Адмиралтейский instead.
* `"stable": true` on the merge (new `build-intro.mjs` option): the freed slot is filled by the last district (Коломяги 106 -> 50) so the indices `k` of all other areas stay. The live areas depend on it: registry `mapId` 46 / 96 / 97 / 98, `docs/AREAS.md`, `tools/area-shape.mjs --k`. A plain splice would have moved 96 / 97 / 98 to 95 / 96 / 97.
* `edits.json` `cut` (new op in `build-overlap.mjs`): `{ street: "Большой проспект В.О.", end: "sw", to: "coast", maxM: 400 }` draws a 5-cell barrier line from the south-west end of the street to the nearest water cell. This is the "short coast line": the street now runs on to the shore, the shore strip of Гавань is its own block again, and the territory of the merged area ends at the street instead of running along the harbour. Generic: any named street end, compass selector, nearest water or a given point.
* `check-edits.mjs`: merges present once, parts gone, live areas at their `mapId`, territory of the merged area at most 450 m beyond its land. Before the cut: 1,753 m (Округ № 7) and 690 m (merge alone), after: 370 m.

## Checks

* Total land 1380.43 km2 before and after (no land cell changes owner; the raster of the districts is not edited by a cut). Every other area: name, km2, class, outline, label, `exist`, territory, overlap and water zone identical, except: Гавань territory 7.09 -> 7.04 km2 (the tentacle no longer counts it), Петровский water zone (probably because the pair is one competitor for the Neva water instead of two, so Петровский gets into the nearest three; not traced further), the colour shade of Морской (greedy colouring), and the references to Округ № 7 (border streets, bridges Дворцовый / Благовещенский / Биржевой, the junction of Vasilyevsky / Gavan / Okrug 7 is gone: 108 -> 107 junctions) and to Коломяги's new index.
* The four live areas (P 98, S 96, A 46, V 97) are unchanged (fp / ext / wz identical).
* Classes: 23 b / 10 large / 57 big / 17 small -> 22 / 11 / 57 / 16.

## Alternatives (one line each in `edits.json`)

* If the owner wants the territory to stop AT Большой проспект (no reach across it into Гавань at all) that is a change of rule R2 for every border street, not an edit; the remaining blobs inside Гавань along the street are the normal one-block reach (ragged because the raster is 40 m and the blocks are thin).
* A different merged name: `ru` / `en` of the merge entry. A cut of the other end of the street: `end: "ne"` or omit `end` (both ends).
