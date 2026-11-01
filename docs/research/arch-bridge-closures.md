# Generic arch bridge end closures

The reported Palace pose `-1214.4,1.7,-1021.6,428.7,0` looks toward the
Teatralny / Malo-Konyushenny junction of Triple Bridge. The original generic
builder drew the vault, water-facing abutments and two fascias, but omitted
the landward abutment faces, bottom faces and terminal cornice caps. Oblique
views exposed hollow triangles. Deck strips also used the minimum left and
maximum right bank coordinates of both strip ends, producing unsupported
rectangles where the surveyed banks skewed.

`src/world/bridges/arch.js` now lofts each deck strip between its own two bank
intervals, clips kerb faces to the local interval, and closes exposed structural
ends. Exact surveyed stations are retained instead of rounded to millimetres:
rounding could leave a small gap at a fascia with a non-round mapped width.
The new structural support uses triangle-clipped colliders with the same bank
footprints. Existing central deck ramps and breakable parapets remain in place.

A declared springing can face another canal, rather than dry land. At Triple
Bridge the Malo-Konyushenny end meets the Griboedov mouth. Extending every end
closure to the bed would create a dam. The builder therefore checks the actual
water union behind each bank, locates wet/dry transitions with samples at most
0.5 m apart and refines each detected transition by bisection. Land-backed
pieces descend to the existing bed datum; wet junction pieces retain only a
0.5 m slab. The two 0.12 m fascia returns retain finite structural thickness.
Transition faces close the change in depth. No closure spans the open arch.

## Verification

`node tools/each-area.mjs tools/arch-bridge-envelope-test.mjs` passes all 18
registry rows, skipping areas with no generic arch sites. The tool builds
actual generic bridge meshes and physics, casts rays against end and cornice
caps, verifies matching structural solids, checks deck vertices against their
local bank interval and probes wet junctions at the real boat hull height.
Palace covers 18 bridges, 332 closed-end rays and matching solid probes,
72 cornice ends, 6,500 deck vertices and 10 wet-junction probes.

Mutations remove actual closing triangles, restore the old skewed deck
rectangle, and insert a full-depth blocker at a wet junction. The corresponding
ray, footprint and boat-contact checks detect these defects. The separate
Palace boat-passage suite passes all 108 checks, including connected transport
water through the Griboedov mouth. Logs are in
`shots/bridge-seams/arch-envelope-all-junctions-final.txt` and
`shots/bridge-seams/boat-palace-junctions.txt`. Serialized GPU review approved
the repaired Triple Bridge view.

`node tools/area.mjs palace tools/bridge-jump-test.mjs --quiet` also passes
136 checks with zero failures. This CPU test builds the actual Palace and
Troitsky bridge modules and exercises car launches, landings, low-speed falls,
closing-leaf contact and breakable road booms. Its log is
`shots/bridge-seams/bridge-jump-final.txt`.

## Scope and limits

This repair covers sites built by `makeArch`; separately authored bascule,
long-span and Belinsky bridge geometry is outside the envelope test. It does
not change water polygons, boat handling, bridge-site bank overrides or the
existing central-span collision model. Wet/dry classification uses mapped
water and finite sampling, so sub-sample water features are not an exhaustive
geometry proof. The mesh probes and complete Palace boat-route suite provide
independent checks for the affected junction. Decorative rails and parapets
retain their shared breakable-object behavior.
