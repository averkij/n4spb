# Birzhevoy underdeck repair

The reported boat view `-2705.5,1.3,-1540.9,623.3,0` looks under the
Birzhevoy Bridge. A CPU build of the actual Vasilyevsky modules identified
136 `pt-area-paver` triangles at `y=0.1`, four `pt-skirt` triangles, and 24
`pt-poles` triangles descending to `y=0.12` inside the reported opening.
These were separate from the legitimate green bridge fascia and granite
piers. One offending surveyed sidewalk is `w1229548655`: its source polygon
has no bridge/layer flag. The two black poles were trolley-wire supports,
not the bridge's decorative lamps.

`streets/decks.js` previously reserved the short arch bridges only. Active
LONG bridges now expose the same complete deck footprint to street builders,
using unchanged descriptors and hump profiles extracted into pure
`bridges/long-sites.js`. Pedestrian-area caps are clipped exactly at those
footprints; their skirts and lower path ribbons are suppressed there. The
approaches remain outside the reservation, and a streets-only build retains
its fallback crossing. This removes duplicate ground surfaces rather than
covering the boat opening with another deck.

Wire supports, actual cylinder colliders, connected overhead strands and
published trolley-service points now use the shared raised deck profile.
LONG supports retain the existing finite-range shared knock instances;
ordinary small-deck behavior and the existing moving-span exclusions remain.
No per-frame callback was added. Reserving LONG decks also exposed a missing
signal bar at the Birzhevoy approach near `-2684.1,-1434.4`. The normal lane
graph still determines its position, width and depth; its paint now follows
the raised approach at each corner. Restoring ground-level paint would not
have fixed this regression.

## Verification and limits

- `node tools/area.mjs vasilyevsky tools/bridge-underdeck-audit.mjs` checks
  actual static and instanced triangles, 96 underside rays, 42 raised support
  meshes/colliders, 598 contact-service points, reservation ends and the
  streets-only fallback. It snaps a real raised mast and advances its shared
  knock simulation. Eighteen independent paint/asphalt ray pairs cover the
  raised stop bar, including paint's separate no-outline render layer.
- `node tools/area.mjs vasilyevsky tools/boat-passage-test.mjs --quick
  --only=birzhevoy` passes all eight checks, including a real 72 m sail with
  zero hits/scrapes, 40 solid drawn pillars, 3,713 hull-height mesh probes,
  and connected transport water. The quick run does not ram individual piers.
- `node tools/area.mjs vasilyevsky tools/wires-test.mjs` reports zero free
  ends, floating groups or other problems. That tool builds streets without
  active bridge reservations; the actual raised-bridge assertions above
  supply the complementary coverage.
- Strict Vasilyevsky markings pass with 100% solid-plan geometry coverage.
  The road wrapper's surface audit passes at its existing 120-sample residual
  budget, and its ribbon audit passes. The furniture audit still fails:
  53 objects on roads, 37 at road edges and 29 on medians. The same counts
  and blocking locations reproduce when the five changed bridge/street
  modules are remapped to `c9e9f2c`; these are not reported as passes.

Evidence is in `shots/bridge-underdeck-{fixed,boat,wires,markings,roads}.txt`
and the `-head` marking/road comparisons. Baseline remapping isolates the
changed modules while retaining the current area and other scene modules.
The strict marking geometry audit mainly checks XZ coverage, which is why
the independent paint-height rays are necessary. The underside test covers
the reported opening and the active supports, not every possible camera ray
under every long bridge. It does not replace normal-page visual review,
whole-area road audits or GPU performance measurements.
