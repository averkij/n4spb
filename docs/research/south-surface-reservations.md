# Southern surface-audit reference checks

The road-surface audit samples narrow strips between mapped opposite one-way
carriageways. Those samples are useful diagnostics, but a narrow strip is not
necessarily ordinary asphalt. Review the actual surface before authoring a
repair; do not raise the audit budget or blanket-exempt all medians.

The checks below used the city's existing OSM cut and Esri World Imagery tiles
at zoom 19 as visual references. The imagery capture dates have not been
established. Coordinates below are in the project's local metre frame.

- **Marata junction:** the repaired point `(-642.60, 1403.08)` is at pixel
  `(132, 73)` of [Esri tile 19/152486/306329](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/152486/306329).
  It appears to be in the open paved junction. The retained repair is between
  mapped ways `w511116164` and `w142647140`. The focused test checks asphalt,
  collisions, mapped green areas, water, buildings and traffic islands.
- **Zagorodny junction:** the checked patch around `(-1358.52, 1378.98)` lies
  within pixels approximately `(217..254, 138..185)` of [Esri tile
  19/152485/306310](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/152485/306310),
  and appears paved, with embedded tram tracks. Mapped carriageways are
  `w459816017` and `w308301794`; tram ways `w141926229` and `w141926228`
  pass nearby. The tram geometry is built at y=0.051 m, above the road surface
  at y=0.03 m. Recheck the focused test and bake after any area-data change.
- **Moskovsky tram reservation:** audit samples near `(-1797.60, 3999.62)`
  and `(-1795.61, 4002.75)` lie on the centre tram reservation visible in
  [Esri tile 19/152553/306299](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/152553/306299)
  (pixels approximately 111..132,251) and [adjacent tile 19/152554/306299](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/152554/306299)
  (pixels approximately 124..127,16). The appearance is consistent with a
  distinct tram bed, not proof that the area should be paved as road. This
  location lacks a mapped GREEN polygon, illustrating why the absence of GREEN
  alone is insufficient to approve a repair.
- **Mapped grass medians:** previously considered strips near Ligovsky
  `(-527, 3147)` and Moskovsky `(-1820, 3370)` intersect OSM grass polygons
  `r11787864` and `w409259823` respectively and were removed from the repair
  list. Additional unpatched Ligovsky audit samples near `(-1344, 4304)` and
  `(-1572, 4405)` overlap grass polygons `w1024250640` and `w806662696`.
  Preserve these areas and their landscaping.

Reproduce the area report with:

```sh
node tools/area.mjs semyonovsky tools/roads-surface-audit.mjs --max-fail 120 --json <report.json>
node tools/area.mjs semyonovsky tools/local-gap-test.mjs
```

Investigate further findings using the audit's `--near` and `--probe` options,
then compare actual bounded patch geometry against mapped GREEN/traffic-island
polygons, tram and rail reservations, landmark surfaces, water and colliders.
Confirm the visible surface with current imagery or a site reference before
adding each candidate. Treat discrepancies between the audit's synthetic
median model and a confirmed real reservation as audit findings requiring a
narrow, evidence-backed correction; do not pave the reservation to meet a
sample count.
