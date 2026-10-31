# Park 300 waterfront correction

Authored 2026-10-31 after the user's ground view at
`-8969.5,21.8,-5568.4,-107.1,-11.6` and their aerial reference of the
three flagpoles. The old model placed exact sand polygons over the generic
city courtyard shader, leaving noisy asphalt, granite setts and grass between
the park paths. It also treated the three low circular flagpole pavilions as
ordinary unmeasured buildings and generated generic bridge decks to them.

## Plan and primary references

- [Giprostroymost–Saint Petersburg, project dossier PGS 16/2024](https://gpsm.ru/files/PGS_16-2024.pdf),
  pp. 5–7: the three hydraulic islands are **50 m in diameter**, raised
  **4.5–5 m above sea level**. Their circular promenades surround low glazed
  pavilions. Access bridges are **3 m wide**, with girders no deeper than
  **1 m** and **2.9–3.5 m** water clearance. The text gives nominal bridge
  lengths 97.7 m and 40.7 m; the current mapped centreline lengths differ,
  so the scene retains the actual OSM endpoints rather than extending decks
  into either shore. Its drawing shows the low pavilion roof about 6.5 m
  above the promenade. The dossier's photograph and section were inspected.
- [SSU-5, Park 300 landscaping contractor](https://ssu-5.ru/landshaftnyie-rabotyi/sadovo-parkovoe-stroitelstvo-i-restavracziya-landshafta/%C2%ABpark-300-letiya-sankt-peterburga%C2%BB.html):
  primary account and gallery of the park's designed lawns, alleys, fountain
  and sandy southern coast; it is a landscape composition rather than a
  worn urban courtyard.
- [Vozrozhdenie, Park 300 stonework](https://vozrtd.ru/portfolio/park-300-letiya-sankt-peterburga/):
  primary contractor record of granite paving, fountain finishing and benches;
  referenced alongside the earlier Park 300 landmark dossier.
- [Gazprom 2024 social report](https://sustainability.gazpromreport.ru/2024/regional-social-and-economic-development/charity-and-volunteering/):
  primary context for continued shoreline, sporting and park improvements.
- Current OSM snapshot `2026-10-31T09:14:05Z`, already committed under
  `src/areas/okrug65/data/`: exact park `r2186244`, beaches `r2186246`,
  `w1426773249`, `w886696094`, island rings and pavilion outlines below.
  OpenStreetMap contributors, ODbL.

| Island | Pavilion | Hydraulic ring ways | Access way | Scene centre X, Z |
|---|---|---|---|---|
| Western / imperial | `w1426773312` | `w1359856862`, `w1426775563` | `w1426773313` | `-9103.3, -5670.7` |
| Middle / USSR | `w1426773298` | `w1359856861`, `w1426775562` | `w1426773301` | `-8849.3, -5388.9` |
| Eastern / Russian Federation | `w1426773294` | `w1359856860`, `w1426775560` | `w1426773295` | `-8233.9, -5170.4` |

The mast specialist owns the three masts and cloths. The waterfront specialist
owns these physical islands, low halls, access walks and adjoining mainland
surfaces. Mast and promenade share world datum **+1.1 m**: sea **−3.4 m**
plus the documented island height **4.5 m**. The mast passes through the hall
roof to its foundation, as in the engineer's section.

## Authored surfaces and practical limits

The exact mapped park gets a clean, gently varied green lawn cap, below the
existing mapped path layer. It leaves the fountain basin to its existing
builder, preserves the mapped groves and trees, and keeps off the generated
road-asphalt plan. The exact three beach polygons get pale sand, also below
paths. The mainland promenade follows ways `w37898228`, `w163856761`,
`w163902539` and `w163902501`, with grey granite and pale edge bands. Its
**8 m width is a photographic estimate**, not an OSM surveyed width; the
source records use the generic 2.4 m footway default. Parallel narrow mapped
paths remain visible and connected. The western park and beach rings leave a
10–25 m interstitial strip; it receives continuous promenade paving rather
than leaving the courtyard mask between them. This cap is clipped against
the exact path ribbons, generated road asphalt and newly opened water. A
second curved apron follows the exact sand and gulf-bank contours on the
water side of the western beach; its mainland island entrance is paved too.

The islands use their mapped faceted rings, rather than oversized circle
bounding boxes. Matching floor strips stay inside the ring; the maximum
outer-edge inset is about 22 cm. Their circular halls use mapped footprints,
blue-grey glazing and metal mullions, with an entrance facing each bridge.
Pavilion facade detailing is an interpretation of the engineer's photograph,
not a construction survey. Access decks follow all original centreline bends,
rise from mainland level over the first 14 m and then meet the island at
+1.1 m. This short 7.3% entry ramp adapts the real raised islands to the
project's flat mainland datum. Bridge decks have visible undersides and
matching physical depth; their low approach portions are not represented as
full-height navigation spans. Normal full-height spans have 3.5 m clearance.
The western deck starts 2.6 m farther along its mapped axis, beyond the complete
service-road asphalt width; its rails therefore leave that road open.

The raw gulf shoreline still closes the three documented bridges with dry
construction causeways. Water cross-sections found a 7.5–10.5 m causeway under
the middle bridge. The western platform lay inside a much broader unfinished
apron, about 37 m from existing water on its west side. Merely drawing a raised
bridge there would leave boats blocked by dry ground and old pink quays.

`waterfront-channels.js` supplies a local `WATER.ownerRings` correction through
the current engine contract. The middle and eastern channel side limits come
from dry-to-wet cross-sections of the raw mapped shoreline. Their outer ends
overlap existing water by 0.75 m. The west contour connects existing harbour
water to the mapped park shore and is **a photographic inference**, not a
surveyed coastline. Its endpoints and short neutral-stone bank are recorded
explicitly in that file. All three exact mapped hydraulic-island rings are
subtracted from the water pieces, retaining their complete dry platforms.
The exact mapped sand-beach polygons are also subtracted: otherwise the east
channel's broad construction-causeway outline would tag exposed sand as water
(`-8228,-5216` was the strict-regression witness). Real navigable spans remain
wet beyond the beach, including the eastern crossing 31 m along its bridge.
The authoring calculation uses the repository's established Shapely/GEOS
Boolean workflow, then triangulates three valid contours with one island
hole. The shipping data is a bounded 29.2 KB pure static table. It does not
ship the Boolean engine or a fragmented series of triangle subtractions.
The 3 m access decks provide matching physical floors and a spatially indexed
`deckY` service for the car. Each visible bank toe has the shared float-block
collider, which stops a boat at the actual stone face and leaves the promenade
walkable. There is no fence, invisible channel wall or blanket water exclusion.

On the broad Park 300 beach, 32 shore segments (918 m total) receive sand
slopes up to 12 m inland from the exact mapped waterline. Narrow technical
beach strips beside Piterland's retaining structures keep their existing
banks. The same 128 convex triangles control slope drawing, ground cuts and
the pure 32 m indexed terrain-height patch. Each drawn triangle also has an
exact one-metre-thick `Physics.addWalkTriangle` solid, keeping floating hulls
out of exposed sand without a broad bounding-box obstruction. A 6 m submerged sandy shelf joins
the surf line to the scene's Neva bed at −6 m, avoiding a 2.6 m drop at the
waterline. The shelf remains water for boats and wading. No dry-water masking
is added. Adjacent source sand polygons remain separate from raised paving.

The access
rails use the shared knock system, per-cell dynamic instances and a finite
650 m detail range. There are no new frame callbacks, textures or sounds.

## Focused verification

The standalone module check passed with real shared knock registration.
The CPU geometry proof uses the actual road plan and Physics implementation:

- 192 island-floor probes at centres and 22 m-radius promenade points;
- 375 half-metre access-centreline poses, with continuous visible, walk and
  car-service deck height;
- 423 adjacent-water and under-bridge checks, excluding exposed sand itself;
- 28,409 lawn, paving and deck triangles checked clear of generated asphalt
  at their vertices, centres and every two metres along each edge; the
  promenade starts beyond the complete service-road width, and flat caps
  refine curved road boundary cells before removing their asphalt overlap;
- 2,688 shoreline triangle samples, including 128 raycasts against the actual
  drawn mesh; maximum rendered / terrain-height difference below 0.14 mm;
- no dry-beach slope samples outside the mapped broad beach;
- 23 walking routes from land, through surf and into real sea water: 1,725
  Physics steps without a fall or a blocked movement;
- six routes through the three actual bridge underpasses in both directions,
  using the ordinary boat handling: no hits, scrapes or frames off water;
- 141 access-rail bays registered in the integrated context; a real
  `createKnock.hit` at 70 km/h removes
  its matching collider and changes the bay from standing state.

These checks pass in `tools/okrug65-waterfront-test.mjs`, with the real
environment, streets, all landmarks, bridge builders and props loaded. The
regression is included in the engine CI's coastal checkpoint. The standalone
isolated builder has 163 rail bays because its
missing road plan does not trim the road connection. Both paths use the same
finite knock/LOD mechanism. The suggested dry shore photo pose
`-8840,-5580` is confirmed as ordinary dry terrain, facing the middle pole.

The full Marine and Okrug 65 road wrappers pass. Okrug 65 retains its existing
140 residual road-surface samples out of 520,977, with no new paving offenders
or expanded exceptions. Both coastal strict marking-geometry audits pass at
100% coverage. Independent full Okrug 65 water-reachability and boat-passage
audits pass 17/17 and 54/54 respectively, including ordinary boat hand-off and
garage entry.

Integrated normal-render screenshots and claims are run by the integration
agent after source freeze and rebaking. Research photographs and diagnostic
output remain under ignored `shots/` or the system temp folder.
