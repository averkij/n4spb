# Aurora visitor boarding, 7 November 2026

Area: `aptekarsky`. Owner: `landmarksAurora/ship.js`. The existing historical model
retains the fourteen Canet guns, hull, eight boats, moorings, water datum and
near/far silhouette. This change opens the visitor route onto its weather decks.

## Evidence and scope

* [Central Naval Museum: Aurora branch](https://navalmuseum.ru/filials/cruiser_aurora)
  identifies the museum ship at Petrogradskaya Embankment 2 and links its
  [official virtual tour](https://navalmuseum.ru/filials/cruiser_aurora/3dtour/).
  Its [2026 visit tariff](https://navalmuseum.ru/Files/file/avrora.pdf) explicitly
  includes the upper deck in the museum visit.
* [Gangway photograph](https://media-1.gorbilet.com/b2/6e/c5/DSC_3616.jpg), visually
  inspected: narrow grey bridge with side banner, guardrails, a higher ship end,
  and a granite shore platform. Historical guns remain on projecting sponsons.
* Existing surveyed data: ship `r3272566`, pier `w518595697`, ticket pavilion
  `w486091825`, retaining wall `w88735046`. Pavilion polygon is retained exactly:
  `(-795.9,-2584),(-790.1,-2586.6),(-786.6,-2578),(-792.3,-2575.5)`.
  Source dossier `D:/git2/agi-fun-tests/102_3d_piter/docs/research/aurora.md`
  sections 2.1–2.3 and photographs 17/29 describe the same boarding structure.

The shore stair arrangement inside the opened pavilion and the paired forecastle
companionways are circulation adaptations to the existing authored deck levels;
their exact tread geometry is inferred, not claimed as a fresh survey. Museum
interiors and the upper navigation bridge are outside this change.

## Construction and collision

The old model deliberately closed the pavilion, shore landing and entire ship:
full-height gate panels, a 2.2 m approach box and a full-beam hull wall extending
to 10.6 m above street level. Gun geometry itself was not blocking the entrance.

The opened pavilion retains its glass side bays and roof, with a 2.34 m central
aisle aligned to the gangway. Seven shallow treads lead from the quay to a steel
landing at world Y=1.25 m above the existing parapet. The 1.7 m gangway rises to
the quarterdeck at Y≈2.519 m and overlaps the deck edge; the quarterdeck guardrail
has a 2.2 m opening. No interaction, jump, flight or broken railing is required.

Exact rendered weather-deck quads supply triangle walking surfaces. Immersed
hull boxes stop below those decks, retaining boat collision with the hull.
Deckhouses, hatches, capstans and all fourteen gun shields have bounded local
collision. Visitor routes run inboard of the side guns. Paired fifteen-tread
companionways connect the waist to the forecastle, allowing close inspection of
the bow gun from both sides. The stern gun can likewise be walked around.

All 44 new/replaced railing bays use one shared `knockBays` fixture family,
ordinary spatial cells and 180 m LOD. They break through the existing knock
scheduler; the module adds no frame callback or new material. Architecture uses
the existing static collector and 180 m ship detail range.

## Verification and review positions

`node tools/area.mjs aptekarsky tools/aurora-boarding-test.mjs --integrated`
builds real environment, streets and the landmark. A real `Player` uses the
area's play union, clamp and building predicate. The route starts and ends on
the quay, visits both sides of the stern and bow guns, and traverses both
forecastle companionways. It uses no flight/jump/teleport or rescue.

The test checks actual rendered floor hits against grounded feet, nine boat
clearance probes under the gangway, the immersed hull, finite geometry/LOD,
bounded geometry cost and real breakable rail ownership/removal. Isolated mode
also proves that only the pre-existing shared knock callback is registered.
`--mutant-closed` reinstates a shore gate in test physics and must fail the walk.

Final isolated and integrated results: 4,901 walking frames, zero rescues, 212
grounded floor rays, maximum foot/render discrepancy 0.0000053 m; 33,512 near-ship
triangles including the 44 rail bays. The gate mutant fails at its expected shore
landing. The final normal baked scene also passes a native browser walk from
the quay through the pavilion, across the gangway, around the stern gun and
back to street level: twelve waypoints, no flight or rescue, no module or region
failure. Reviewed screenshots include the entrance, gangway, quarterdeck,
forecastle companionway and bow gun in `shots/aurora-10.1.0/`.

Suggested context cameras (x,eyeY,z,yaw,pitch):

* Shore entrance: `-794.8,1.8,-2578.4,-65.4,4`.
* Quarterdeck looking forward: `-771.2,4.2,-2590.9,-155.4,0`.
* Gangway side context: `-796,9,-2600,-130,-12`.

Gangway deck threshold: `(-772.608,2.519,-2588.586)`; shore walking start:
`(-793.775,0,-2578.880)`. Final Aptekarsky bake revision is
`84ec87115b525f30f72f` (108 products); the other sixteen area revisions are
unchanged. No source in other areas, shared engine or water tables is changed.
