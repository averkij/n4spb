# Aurora and the Sampson overlap

The user supplied Aurora views at `(-570.9,6.7,-2595.7,85.7,-1.3)` and
`(-691.8,6.6,-2495.8,34.5,2)`. The mapped ship parts identify these views as
the **Sampson** side of the western overlap: its data contains
the ship relation `r3272566` and its complete mapped part family. The
Finlyandsky facade has no ship records at this position. Treating the funnels,
deck houses and mast yards as independent ordinary buildings produced the
windows, brick funnels and detached cornice-like spars in the screenshots.

`src/world/finlyandskyAurora.js` now reuses the maintained
`landmarksAurora/ship.js`, its surveyed hull/frame and `far.js` closed mass.
It includes the hull, green/white waterline, three funnels, two masts, gun
shields, ventilators, boats, portholes, rigging and open boarding route. It
does not build the school, cabin, lions or their gardens. The ship owner claims
the parent and all parts on Sampson so the generic city draws none of them;
the same ship wrapper supplies the visible landmark across the Finlyandsky
water overlap. No new scripted tour group or frame callback is added.

The existing original-source dossier was read at
`D:/git2/agi-fun-tests/102_3d_piter/docs/research/aurora.md`. Its source plans
place the ship at `(-753.05,-2561.8)`, with bow axis `(0.4168,0.9090)` and
126.8 m overall length. The length and broad structural layout are consistent
with the museum's primary [ship structure description](https://navalmuseum.ru/filials/cruiser_aurora/structure).
The area wrapper preserves the maintained model's estimates for small fittings,
deck heights and late refit details. It uses the shared navigable water level.

All new source meshes use finite authored ranges. Detailed masses and
porthole instances use the existing 180 m detail range about the 90 m ship
bounding circle; the closed silhouette extends to 1400 m. The source rail
adapter and boarding rails retain breakable physics. Exact deck triangles
are also available through a bounded deck service for cars. The standalone
builder contains approximately 36,553 triangles, 39 meshes including 12 instanced,
329 colliders, 80 wires and zero updates; the materials are shared with the
existing Aurora builder.

## The floating Orenburgskaya tower

The separate screenshot at `(-655.6,13.1,-2791.9,324.7,6)` points northeast
to the building family `r2972320` at `(-599,-2903.8)`, Orenburgskaya 2.
It is not the malformed hotel part `w223950037`, which lies behind that camera.

The Sampson extract carried three incorrect old `dupOf:r20187384` flags:
`r3287703`, `r2972323` and `r2972322`. These are the building body and two
intermediate storey ranges. `r20187384` is only their ground plinth. The old
converter compared plan overlap while disregarding vertical intervals, so
it suppressed the body and left the top tiers visible in mid-air.

`tools/repair-sampson-vertical-duplicates.mjs` deletes only those three flags,
after checking the exact parent and distinct vertical intervals. Heights,
footprints, parentage and legitimate raised parts are unchanged. The current
city preparation now retains a continuous supported stack with tier boundaries
at 0, 5, 40.2, 46.8, 53.4, 56.7 and 63.3 m, then the final crown/spire.
Those are the existing city's
storey-height interpretation; the source records themselves retain their
mapped level counts and estimated heights. The current converter already
requires equivalent vertical spans for duplicate suppression, so the repair
tool is also an explicit idempotent correction for the older frozen extract.

## Focused verification

```powershell
node tools/area.mjs finlyandsky tools/finlyandsky-aurora-test.mjs
node tools/area.mjs sampson tools/finlyandsky-aurora-test.mjs
```

The regression checks real source deck triangles against Physics at bow,
waist and stern; finite ranges; the common waterline; breakable rail records;
open boat water beside the hull; complete generic-city suppression of the
Sampson ship family; and the restored tower's supported prepared tier stack.
Root integration owns final rendered screenshots and bake publication.

The integrated Sampson water-access suite passes 17/17 checks and the latest
Finlyandsky waterfront regression passes 10/10. The generic raised-deck parking
probe originally selected `(-736,-2528)` beside Aurora's real forecastle break.
Its centre and two front wheels stand at 5.20 m, while both rear wheels are on
the 2.50 m waist deck. A car cannot remain flat across that 2.7 m step. Parking
candidate selection now checks that the existing car-sized neighbour footprint
is continuous within the normal 0.45 m drop tolerance; it previously tested
only whether each neighbour had some floor at any height. There is no area or
ship exception, and the real placement/idle assertions remain unchanged for
the valid continuous deck candidates. The deck source geometry is unchanged.

The Sampson boat-passage quick suite reports 76/81 passing checks. A second
run with only the new Aurora module omitted reports 74/79 passing checks and
the exact same five failures: bridge-zone clearance at `w162934079-4` and
`w221309602-0`, a tiny isolated section at `w102676678-0`, a 1595 m² remote
boat-free pocket, and six transport-water pockets cut by the territory edge.
The pocket coordinates/components are unchanged between those two runs.
The real ship removes 2572 m² of main-body boat-free cells through its hull and
mooring structure, with no new disconnected component. This comparison
isolates the Aurora change; it is not a claim that the complete Sampson boat
suite passes. Logs are `sampson-boat-passage-final.log` and
`sampson-boat-noaurora.log` under `shots/finlyandsky-review/`.
