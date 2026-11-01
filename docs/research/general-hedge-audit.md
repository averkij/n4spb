# Hedge end and underside audit

Reviewed 2026-11-01 after the reported park view at
`-1422.6,1.5,7289.4,-50.1,-14.2`.

## Cause and repair

The shared `environment/lawns.js` hedge generator lofted a four-point trapezoid
along each run, with two sides and a top. It omitted both end caps and the
underside. Its existing faces had correct winding; the missing faces let the
single-sided foliage material reveal the background at exposed ends.

The generator now closes both ends with outward-facing triangles and closes the
underside along the same tapered profile. The original footprint, profile,
colour variation, run spacing, material, colliders and animation behaviour are
retained. The change adds geometry to the existing mesh, with no new mesh,
material or frame callback. Zero-length runs are ignored.

The Academy garden has a separate hedge generator. Its side tops were at 1.15m
while its top surface was at 1.20m, leaving a five-centimetre slit; it also omitted
the ends. Its side tops now meet the existing top, and its ends and underside
are closed. This repair retains the existing routes and collision behaviour.

No material was changed to double-sided. All area bakes must be regenerated
because the shared environment source changed.

## Other implementations inspected

- Garden and Fortress `wall3D` surfaces already close exposed line ends.
- Kirova hedges use closed box bays registered as breakable objects.
- Station and Mikhailovsky hedge boxes include end faces; some omit the bottom
  where it rests on terrain.
- Kazan and Strugatsky use closed mound or sphere volumes.
- Horseman and Mars ring hedges have no exposed line ends.

These implementations did not need the shared run-end correction. Elevated
flower-bed ground surfaces were not treated as hedge volumes.

## Regression coverage

`tools/hedge-geometry-test.mjs` builds actual environment hedge meshes with the
normal integrated module claims. It also rebuilds every real run individually
and checks short, reversed and oblique synthetic runs. It welds positions to
check that every individual run edge has exactly two opposite face incidences,
rejects degenerate faces, and checks triangle winding against the shading normals.
The aggregate mesh accepts even, balanced edge multiplicity where independently
closed runs meet at exactly the same position; individual runs remain strict.
Front-sided ray probes cover both ends at three heights and three widths, both
sides, the top and the underside. The Academy option checks its actual bespoke
mesh. The real scene material must remain front-sided.

| Command after `node tools/area.mjs` | Result |
| --- | --- |
| `moskovskaya tools/hedge-geometry-test.mjs` | 703 real/varied runs, 704 closed meshes, 15,466 ray probes passed. |
| `palace tools/hedge-geometry-test.mjs` | 230 real/varied runs, 231 closed meshes, 5,060 ray probes passed. |
| `vasilyevsky tools/hedge-geometry-test.mjs` | 486 real/varied runs, 487 closed meshes, 10,692 ray probes passed. |
| `vasilyevsky tools/hedge-geometry-test.mjs --academy` | Actual five-segment, 60-triangle Academy hedge passed. |

The totals include four varied runs per area. Removing a cap with
`--mutant-open-ends` fails the manifold test; reversing a cap triangle with
`--mutant-reverse-cap` fails the winding test. Both mutation checks failed as
intended, establishing that the regression detects the original hole and an
incorrectly oriented repair.

### All live areas

The serial CPU audit also passed all 16 live registry areas, without skips or
empty hedge populations. Counts below separate actual runs from the four varied
runs added to each area; probes include both populations.

| Area | Actual runs | Outward probes |
| --- | ---: | ---: |
| palace | 226 | 5,060 |
| smolny | 320 | 7,128 |
| vladimirsky | 423 | 9,394 |
| admiralty | 353 | 7,854 |
| vasilyevsky | 482 | 10,692 |
| gavan | 283 | 6,314 |
| morskoy | 253 | 5,654 |
| dekabristov | 326 | 7,260 |
| kolomna | 455 | 10,098 |
| semyonovsky | 611 | 13,530 |
| morskie-vorota | 59 | 1,386 |
| okrug65 | 545 | 12,078 |
| moskovskaya | 699 | 15,466 |
| kronverk | 450 | 9,988 |
| aptekarsky | 430 | 9,548 |
| islands | 394 | 8,756 |
| **Total** | **6,309** | **140,206** |

The complete audit includes 64 varied runs, 6,389 mesh checks and 1,196,168
cumulative test triangles. Of the probes, 138,798 cover actual runs and 1,408
cover varied runs. These totals include the aggregate mesh and individual run
copies, so they are not rendered scene triangle totals.

Smolny's aggregate has 132 balanced coincident edges between separate closed
runs. The initial strict aggregate weld reported these as four-face edges;
allowing balanced even multiplicity only in the aggregate resolved the test
false positive. All 320 Smolny runs separately pass the strict two-face check.
Both mutation checks were then rerun in Smolny and still failed as intended.
Academy's previously passing dedicated test was not repeated during this sweep.

Per-area logs, original Smolny assertion, mutation logs, machine-readable summary
and totals are preserved in `shots/hedge-caps/regression-all/`.

At the hedge checkpoint, before the final bank fitting,
`moskovskaya tools/check.mjs environment` passed with 878,249 triangles against
the 980,000 limit. The final combined repair measures 893,242 triangles,
850 meshes, 37 materials and seven existing update callbacks. These are
geometry-budget checks; final baked loading and frame timing are recorded in
[PERFORMANCE.md](../PERFORMANCE.md).

## Procedural visual verification

All captures used `baked=0` and explicit environment, streets, city and the
relevant landmark modules, to inspect the new source before rebaking.

- `shots/hedge-caps/park_0.png`: exact reported view; exposed end is opaque.
- `shots/hedge-caps/park_1.png`: opposite end of the same 17.5m hedge.
- `shots/hedge-caps/park_2.png`: low, face-on end inspection.
- `shots/hedge-caps/academy_0.png`: Academy end and former side/top slit.
- `shots/hedge-caps/zfight_0.png`: reported-view jitter check, one noisy pixel
  (0.000%), identical-diff zero and no listed offenders.

Every PNG was opened and inspected. Both park ends and the Academy end are
closed, and no module or page errors were reported. These targeted authoring
views do not replace the parent task's final baked integration checks.
