# Petrograd and the northern islands — 6.0.0

The planning-map territories 86, 84 and 85 are live as `kronverk.html`,
`aptekarsky.html` and `islands.html`. Their registry rows, import maps, data cuts,
garages, water and paired edge gates belong to the individual pages.

## Source and coverage

The Petersburg source is `D:/git2/agi-fun-tests/102_3d_piter`, revision
`022e72ca8b3a2d0bf716367e7399187cacca019e`. The requested `104_picnic_3d`
directory was inspected: it is the different Roadside Picnic/Harmont scene.
No content from that scene was imported.

The port uses the three outlines and water envelopes in `maps/intro-draft.html`,
rasterised at 80 m, with scenery outside the walkable union. Transition cells
complete the Troitsky north approach and the northern/western overlaps. The
Aptekarsky page also carries the complete western Karpovka water corridor,
avoiding an isolated reach behind its original page edge. The tiny southern
Kronverk/Admiralty overlap is served through Palace and Vasilyevsky: a direct
gate there immediately triggered its reverse. No lens thresholds were relaxed.

Reproduce the final cuts and water context with:

```powershell
node tools/refine-petro-territories.mjs
node tools/bake-petro-context.mjs
node tools/order-petro-gates.mjs
node tools/gen-area-html.mjs --check
```

The cut headers identify the source revision. `territory.json` mirrors the
registry; `docs/AREAS.md` and the registry remain authoritative for live areas.

## Content

* **Kronverk–Vvedensky–Petrovsky:** the Peter and Paul Fortress, cathedral,
  ramparts, gates, beach, timber bridges, Kronverk, Vladimir Cathedral,
  Petrograd-side blocks, Petrovsky stadium, yacht club, western Petrovsky
  waterfront and Zhdanovka.
* **Aptekarsky–Posadsky:** Troitskaya Square, Aurora and its waterfront,
  Kamennoostrovsky Avenue, Karpovka, the Botanical Garden and greenhouses,
  television tower, LETI and the Transfiguration ensemble.
* **Krestovsky–Kamenny–Yelagin:** Krestovsky arena, park and promenades;
  Yelagin Palace, kitchen/service buildings, Rossi pavilions, spits and park;
  Kamenny Palace, church, theatre and eastern/western dachas.

Existing shared modules were retained. Northern bridges already present in
`bridges/long.js` are built once by the current engine. Missing source modules
were imported with their dependencies and adapted to the current contracts.

## Water, transport and objects

Each station-less page has one purple Zhiguli and one verified boat berth.
Driven cars and boats use the existing handoff protocol. A bounded road-segment
projection supplements the car-arrival ring search where narrow marina roads
fall between its radial samples.

Water remains reachable on foot and by car. The river context is clipped per
area; smaller source water records are included, and island holes in park water
are preserved. Mapped bridge and sluice necks receive navigable water beneath
their decks. The omitted second Park Bridge and the northern WHSD approaches
were authored from their mapped road axes. Short canal spans/supports were
adapted to leave boat passages. Drawn submerged bridge supports remain solid.

Source merged fences and fixtures are converted during construction to the
shared knock system. Railing bays own their geometry and colliders, use dynamic
384 m cells and finite LOD, and leave the river under a bridge open. Old invisible
guard extensions were removed. Architectural walls and structural masonry stay
solid. Complex marina/pond pontoons follow their comb-shaped footprints instead
of blocking their open slips with one bounding rectangle.

The Yelagin aggregate water relation duplicates the individual pond polygons.
Its duplicate edges are excluded from the bank generator; all individual ponds
and their island holes remain. Aurora has an authored low-detail mass of the
actual hull, funnels, deck houses and tall masts out to 1.4 km, with the detailed
model kept nearby. This preserves its silhouette across the Nevka.

The fortress beach has no invisible apron barrier. Its sand ramps remain usable
for walkers/cars; the physics water query excludes sand above the actual
waterline, so a boat cannot sail through the beach mesh.

## Verification and known limits

The area topology/arrival suite passes **490 checks**, the real gate machine
passes **95 checks**, and layout and landmark-claim checks cover all 15 real
registry rows. The final northern water suites, boat passage runs, garages,
handoffs and normal-loading browser/performance evidence are recorded with the
6.0.0 entry in `docs/PERFORMANCE.md`.

The road audits distinguish a mapped pedestrian square/traffic island from an
inferred median between roads; actual carriageway samples are still checked.
The old strip's Castle railing intrusion reports and the Palace, Smolny,
Vladimirsky and Dekabristov marking failures were reproduced in a detached
`f55930c` baseline. They predate this port. New-area audit results and any
remaining paving residuals are reported explicitly in the performance handoff.

The historical brief's whole-city ownership assignments were not reinstated.
The new pages keep the current people, traffic, water transport, streaming and
rendering machinery. Full-city source coverage and authored detail are finite;
the ordinary area scenery/generic buildings cover the surrounding cut.
