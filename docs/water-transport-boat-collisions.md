# Water craft are solids (branch `wt-boatcollide`, the owner's request of 2026-10-28)

> "the boats and all water transport should be collidable like the cars. now our boat is going through the other water stuff"

Before this round the player's motor boat (`drive/boat/*`, collisions through `drive/collision.js createCarCollisions`, the code of the cars) hit the quay, the bridge piers and fallen furniture, but drove straight through everything
that floats by itself: the tourist boats of `environment/boats.js` (moored at the pontoons, running back and forth on the Moika, the Griboedov Canal, the Winter Canal and the Neva) and of `landmarksC/boats.js` (the five
boats of the Fontanka loop, the boat moored at every landing stage), and over the pontoons and landing slabs (they are walker floors, `addWalkBox` tops 0.22 / 0.32 / 0.48 m over the water, which is UNDER the boat's step
height 0.45 + the boat's own level: a boat "steps over" them). docs/AREAS.md 15.x "Known gaps" said so ("the tourist boats and their pontoons have no colliders"); this file replaces that sentence.

## What was wrong and why

`carContact` ignores a solid whose top is at most `STEP_HEIGHT` (0.45 m) above the vehicle's `y`; a boat's `y` is the water level. The decks of the pontoons (water + 0.32 / 0.48) and the lower landings of the stair flights
(water + 0.22) are under that line, the tourist hulls were no colliders at all. Nothing in the old code could stop the boat there.

## What changed

* NEW `src/world/lib/craft-solids.js` (the one module of this round):
  * `craftSolids(ctx)` -> `ctx.services.craftSolids` (one registry per page): `add({ id, kind, key, y, w, d, h, pose(t, out), moving, speed })` registers a craft as ONE hull box in the existing dynamic mechanism
    (`physics.addDynamic` with `stableBoxes`, `refreshDynamic`, `querySolids`): the same path the traffic cars, the bascule leaves and the trains use. `remove(c)` drops one.
  * the pose is a PURE FUNCTION OF THE GAME TIME: `pose(t, out)` writes `{ x, z, rot }` with the very function that poses the mesh (`ctx.time`, set by main.js before the updates run, is the `t` of `onUpdate`).
    A moored craft is read once and never moves.
  * the box is the traffic protocol: `source` = the box itself with `cx cz vx vz spin invMassRatio inertia`; the velocity comes from the change of the BOX since the last distinct game time (or from a 0.05 s look back when
    that is stale), `spin` is the yaw rate in the car's convention (the contact point moves with `spin * (rz, -rx)`). `invMassRatio` is 0: **a scripted tourist boat is heavy and on rails; it neither reacts nor stops**.
    `drive/collision.js` is unchanged: the impulse uses the RELATIVE velocity, so the player's boat is thrown back from a hull that comes at it and is carried along by one that sweeps past, gets 'hit' (relative normal speed
    over 2.2 m/s) or 'scrape' events (the thump / shake / HUD flash of the boat profile already exist), and is pushed out of the hull by the penetration depth in the same substep (never inside; see "Known limits" for a squeeze).
  * **the guard (review round, 2026-10-28): a pinch is never a squeeze.** A scripted hull that comes CLOSER than `PINCH` (6.2 m: a motor boat is 5.6 m long, 5.9 m across its diagonal) to a static float block or a resting craft
    (closing faster than `CLOSE` 0.3 m/s; or nearer than `TOUCH` 0.3 m whatever it does) is **not a solid** while it does. Why: a boat caught between a hull that comes at it and a block that stands is crushed, and the SAT
    push-out of `drive/collision.js` (5 iterations, a full push per contact) throws it out across the block: the review measured 10.7 m in one frame at the Moika pontoon, 1 m between the Fontanka loop and a moored boat.
    The ghost never turns solid on top of the player: it stays a ghost until the player is `HOLD` (3.6 m) clear of its box. A hull that keeps its distance (a tourist boat that glides along a pier at 2 m) is a plain solid:
    a boat in that gap is wedged, nothing more. The registry reads the float blocks from `physics.floatBlocks` (`addFloatBlock` fills it) and the resting craft from its own list; the gap is a lower bound from the four SAT
    axes (`obbGap`). **In the game the guard is a net under a failure of a track, not a feature of it**: the sweep (below) keeps every scripted track clear of what stands, in every live area.
  * **a script that snaps moves its BOX gradually.** The Fontanka loop used to jump 1.2 m / 4 deg once per lap and 0.3 .. 0.8 m at every 4 m sample point of a bend (the tangent was one constant per segment, the lane is 16 m off the
    centre line: 16 m x the change of the tangent); the loop now interpolates the tangent along the segment (`landmarksC/boats.js makeLoop`: no snap left), and the registry carries any remaining jump of a script (a step of
    more than 1.6 x the nominal speed + 0.5 m/s, or 1.3 rad/s) as an OFFSET of the box that eases out over `EASE` 1.5 s: the box never jumps, the velocity is the change of the box, a snap is never a phantom velocity (74 m/s before).
  * only craft within 200 m of `ctx.player.position` are boxes; the poses are computed once per distinct game time (the frame refresh and every `car.step` hit a cache), the boxes are reused objects (the physics keeps one OBB
    per box and rewrites it in place), a registered craft that never comes into the play area of the page (`L.inPlay(.., -40)` over 16 sampled times) is dropped at `add`. Measured: 33 us per `refreshDynamic` with ~100 dynamic
    boxes around the Anichkov dock (the Fontanka fleet, the tourist boats, the bridge leaves, wrecks), no allocation in the box code (the per-call `state(t)` objects of the two boat modules are the existing ones).
  * hull heights: from `y - 0.15` (the hulls are drawn 0.1 m under the waterline) to `y + h` (the roof: 2.0 .. 4.2 m as modelled, times the size). `y` is the water level of the waterway (a moored boat: of its pier).
    So the player's hull test (`y .. y + hgt`) meets it, and a walker or a car on the bed meets the same box as it meets any car (in a deep river, the Neva, a wader's head is under the hull: he walks under it, as he should).
  * `addFloatBlock(physics, cx, cz, w, d, rot, wl)`: a static box from `wl - 0.4` to `wl + FLOAT_TOP` (0.55) for a pontoon deck / landing slab.
    The walker's floors are unchanged: they stay `addWalkBox` with their old tops. The block is **just above the boat's step height** (0.55 > 0.45, so a boat floating at `wl` is stopped) and **just under what a walker standing
    on any of those floors reaches** (a landing at `wl + 0.22`, a deck at `wl + 0.32 / 0.48`: feet + 0.45 >= 0.55, so `physics.resolve` skips it): nobody who stands on a deck is pushed, the walker still steps from the stair onto
    the pontoon. A wader on the bed is blocked by it, as the walk boxes (bottom -8) always blocked him.
* `environment/boats.js`: every pier (`piers`, including the ones moved beside a descent by `quay.pierOverride`) gets a float block (deck + the tyre fenders, `wid + 0.4`); every boat of `list` (moored 24, moving 9 in Palace-Liteyny,
  `size` and the model's `h` included) is registered with the pose function of its mesh. The registry ids are the service ids (`moored<i>`, `neva-tour` ...), so `wildlife/boats.js` and the tests can pair them (that module is untouched).
  **The tracks were cleared (review round):** (1) the Moika pairs (`moika-green` / `-green2`, `-red` / `-red2`, `-garden` / `-garden2`) had `off: +x` and `off: -x` on REVERSED points, whose normal is the reverse of the first one's: both boats ran on
  the SAME lane and sailed through each other head on (a pre-existing glitch). The second boat now has the same sign (= the other lane) and the lanes are far enough apart for a hull that turns on the spot to clear a boat that passes on the other
  lane (green 8.6 m, red 8.6 m, garden 9 m; half the lane distance >= the radius of the turning hull + half the beam of the passing one). (2) `inset` (11 / 8 / 10 m): the second boat of a pair turns that far inside the ends of the track,
  its lap time is unchanged (it is a little slower between the turns), so the two turning zones are always more than the sum of the two radii apart: **they never meet, whatever the phases of the two laps are** (the periods differ, the
  pair drifts through every relative phase). (3) `moika-green` followed a polyline 4 .. 6 m west of the middle of the channel and ran straight through the pontoon at -1777, -586 (a 16 m float block) and its moored pair
  (`moored20` / `moored21`, overlaps up to 2.4 m, 40 - 60 s per lap): the track is now a Catmull-Rom curve through the middle of the channel that keeps 3.7 m off the moored boats (`GREEN`, resampled every 10 m so that no vertex
  of the polyline jumps the lane sideways). Lap times: 289.1 / 315.8 s -> 290.6 / 317.5 s (+0.5 %: the new reach is 1.7 m longer); the boats, ids, types, sizes, speeds and the service shape are the same (`state(t) -> { x, z, yaw, speed }`, the
  gull slots are in the boat's own frame). (4) a berth beside a landing stage is not used when its boat would overlap another stage's float block or an earlier moored boat (`moored22` of the Admiralty lay 6.4 m inside the float block of the
  next stage): that boat is not drawn (one fewer in the Admiralty, none in the Palace-Liteyny).
* `landmarksC/boats.js` (review round): the moored boat lies 0.2 m closer to its pontoon (against the fenders: `wid + 2.25`, was 2.45) and the float block of a stage is `wid + 0.1` wide (there are no tyre fenders in this module's stage), so the moored hulls and the
  blocks no longer overlap and the loop keeps 0.2 m more; a berth whose boat would overlap an earlier moored boat or a float block gets the next boat kind of the table that fits, or none (two stairs 18 m apart cannot both carry a 24 m
  tram: `cm-4` / `cm-5` of the Vladimirsky overlapped by 4.3 m, `cm-0` / `cm-1` of the Admiralty by 1.5 m: one fewer boat there); the loop's tangent is interpolated (no snap); the five Fontanka loop boats (`speed` 3 m/s, the long axis is the local z: `w` = beam, `d` = length from the model `SPECS`, 17 .. 24 m) and the five moored ones (`cm-<i>`) are registered; every pontoon gets a float
  block (`buildPier` now returns `centre`, `len`, `wid`, `rot`).
* `environment/quay.js`: the lower landing of every generated descent (`buildDescent`, play area only) gets a float block; the steppable Fontanka flight (`OPEN_FONTANKA_STAIRS`) gets one for its lower landing too.

### What stays `boatPass`, what became solid for a boat (the decision)

`boatPass` (drive/collision.js: a floating boat ignores it) stays on **the steps of the stair (treads, the top landing, the hidden sill) and the walker floors themselves**: they belong to the quay wall, the shore logic of the boat
(`handling.js` nine probes 0.4 m off the water edge) already keeps the boat off them, and the dock must not be caught by them. What a boat can hit now: **the lower landing slab, the pontoon decks (both modules), every tourist
hull** and (as before) the piers of the bridges and every ordinary collider. The floors are still floors: `boatPass` is not removed from the walk boxes, the float block is a separate box.

**The boat's own dock.** The Anichkov dock (`drive/boat/index.js DOCKS`, the table now lives in `lib/docks.js` and is re-exported) lies 0.3 m off the edge of the lower landing of the steppable flight and must stay free to leave
(`tools/boat-test.mjs` 1: nothing within 0.5 m of the hull). The landing slab was first cut by a strip of 0.9 m over its whole length (`DOCK_INSET`), and a boat rode over that strip. The slab is now the landing MINUS the footprint of the dock hull grown by
`DOCK_CLEAR` (0.6 m: the 0.5 m of the test, the 0.06 m skin of `drive/collision.js`, a hand of slack), cut as pieces in the frame of the flight (`quay.js landingBlocks`: before and behind the hull along the flight, and beside it across the flight): of the 5.5 m^2
of the landing the notch takes 0.3 m^2 (a strip 0.14 m wide and 1.8 m long beside the hull) - the landing is a block for a boat everywhere except the dock's own footprint plus its margin (`boat-craft-test` 1 samples 540 points of it; the hull numbers of
`DOCK_HULL` are asserted equal to `SPEC_BOAT`). The area's own docks (`GARAGE.boats`) are honoured the same way. The shore logic keeps the boat 1.35 m off the water edge anyway; the pontoon starts 2.2 m beyond the stern; the moored boat
`cm-3` is 12.7 m from the dock, the five moving boats of the loop never come closer than 8 m (centre to centre, no overlap with the dock hull at any time of a 500 s scan).

### Walker, car, wildlife

* The walker meets the hulls and the float blocks because `physics.resolve` / `columnBlocked` iterate every dynamic item: the same choice as for cars ("cars are solids for walkers"). Checked: a wader in the Moika is pushed aside by a hull
  that sweeps over him (never inside), a walker on the Anichkov pontoon deck / landing is not touched, a car on the bed meets the hull.
* Breakability is untouched: nothing breakable was made unbreakable (a float block is a new box under the walker floors, not a fence); the player's boat does not break anything it did not break before.
* Wildlife: `wildlife/boats.js` is untouched (gull slots, hull index for the ducks); `wildlife-test` passes.

## Tests

`node tools/area.mjs <area> tools/boat-craft-test.mjs [--quick]` (CPU; 23 checks in palace, 3 in each of the other areas: the registry, the cars, the sweep). `SWEEP_ONLY=1` runs the sweep alone (a quick loop while a track is tuned), `SWEEP_LINES=n` prints more of its report. The scenarios use the poses of the modules' services (`wildlife/boats.js collectBoats`) and the stair frame of
`quay.js`, not the new registry, so the same run is a regression test of the old code:

| scenario | old code | new code |
|---|---|---|
| 2a the boat runs into the side of a moored Neva boat at 14 m/s | no hit, 4.6 m inside the hull | hit 10.8 m/s, 0.000 m inside, recoil 0.08 m |
| 2b / 2c a moving boat (neva-tour, neva-hydro, Fontanka c-3, c-1) crosses the path, clock running | no hit, 4.7 .. 5.5 m inside | hit 7.9 .. 11.2 m/s, 0.000 m inside, recoil 0.2 .. 0.4 m |
| 2d the Anichkov pontoon from the river, the lower landing of a Neva descent | no hit, 1.75 m inside the pontoon, 2.35 .. 3.25 m inside the landings | hit 8.2 .. 10.8 m/s, 0.000 m inside, recoil 0.6 .. 1.9 m |
| 2e a hull sweeps into a resting boat | passes through (4.3 m) | contact, carried, 0.000 m inside, the craft keeps its scripted pose |
| 2f a hull squeezes a resting boat against the quay (fixture hull through the registry) | (no registry) | no teleport, stays on water, deepest overlap 0.25 m |
| 3 dock: out 3 s and back to the dock, the fleet running | pass | pass (0 hits, 0.000 m overlap with any box) |
| 3 wader pushed by a hull, car on the bed meets a hull | not pushed / no box | pushed, never inside / contact |

**The review round** (sections 1 landing, 4 and 5 of the test; run with the `src/` changes of the round reverted to 3e8d069, 6 of the 23 checks fail: the landing, the three pinch fixtures, the ghost rules, the sweep):

| scenario | before | now |
|---|---|---|
| 4 a hull (12 x 3.4 m, 3 m/s) comes at a resting boat with the player's boat (engine off, 3 yaws) in the gap and goes through it | the boat is squeezed 4.5 m deep and thrown 9.1 m in one frame (185 hits) | no step over 0.05 m, no overlap with the resting boat, the hull is a ghost from 6.2 m |
| 4 the same against a pontoon (a float block of the page) | squeezed 2.4 m, thrown 2.5 m in a frame (168 hits, 98 scrapes) | no step, no overlap |
| 4 a script that snaps 1.2 m / 4 deg into a boat beside it | the box jumps 1.2 m in a frame | the box moves 0.036 m per frame at most (2.2 m/s), the boat 0.04 m |
| 4 the ghost rules (closing / end-on / gliding past at 2 m / opening / the player inside) | a solid at every gap | a ghost only while closing inside 6.2 m; solid when gliding past or opening; a retreating hull stays a ghost until the player is 3.6 m clear |
| 5 the sweep, Palace-Liteyny, 900 s | 8 overlaps (the pontoon 2.4 m, `moored20` / `21` 1.3 m, the Moika pairs 3.4 and 3.6 m) | 0 |
| 5 the sweep, Admiralty / Vladimirsky | 12 / 4 overlaps (+ the pair `red` 2.8 m, `moored22` 6.4 m, `cm` pairs 1.5 and 4.3 m, loop x moored 0.1 .. 0.23 m) | 0 / 0 |
| 1 the Anichkov landing | a strip 0.9 m wide along the whole landing is open | the open part is the dock hull's footprint + 0.6 m (0.14 m of the old strip's width remains beside the hull) |

**The sweep (5), the long-term oracle against this class of bug.** It runs the REAL pose function of every craft of the page (the one that poses its mesh; the Smolninskoye has none) for 3600 s of the clock (900 s with `--quick`) in steps of 0.1 s
(a 7.5 m/s hydrofoil moves 0.75 m per step; the laps take 130 - 320 s) and fails if a scripted hull box overlaps by more than 0.1 m: a float block, a bridge pier, a quay wall or any other static collider that stands in the water (judged by
`carContact`, the code that stops the player's boat: the hull as a floating car; `boatPass` floors excepted; bridge decks and ramps are not judged: the 3.1 m roof of a Fontanka tram clips the Anichkov deck, 2.2 m over the water, and nobody is
hurt by that), a resting craft, or another craft. Every new track, every new craft, every moved pier is judged by it in all live areas; the failure names the pair, the depth and the time. It is not a measure of the clear distance: a
track may pass a hull at 0.1 m (only the guard cares about the gap, and it ghosts a hull only while it closes).

Old code of the first round (the three `src/world` files of the round reverted to d616843) = 14 of 17 failed (the 3 passes are the tourist-boat description, the walker on the deck and the dock, which must not change). The overlap measure is the exact hull OBB of the boat against the exact OBB of the craft after every 1/60 s step
(tolerance 0.06 m; 0.000 everywhere: the contact code leaves the 0.06 m skin of `carContact`).

## Known limits / things found on the way

* The guard covers a pinch between a scripted hull and a float block or a resting craft. A pinch against the QUAY or a bridge pier (a hull sweeping a boat against a wall) is not covered; no scripted track comes near a wall (the sweep), and the
  fixture of test 2f shows the old behaviour: no teleport, a shallow squeeze.
* The ghost is a whole hull, not the part of it that overlaps: while a hull closes on a pier it is not solid for anyone (the player's boat sails through it). In the live areas this happens for 1 .. 3 s when a Fontanka loop boat
  runs up to the end of a pontoon or of a moored boat (it is solid again when it glides alongside), and nowhere else.
* A boat squeezed between a sweeping hull and the quay is not teleported; the shore refuses a contact push onto land (an old rule of `boat/handling.js`: "the push is undone, the impulse stays"), so the hull runs 0.2 .. 0.3 m
  into it for the seconds the squeeze lasts. The tourist lanes keep clear of the banks except on a few Moika reaches; a real fix is a rescue shove along the hull (not done).
* The bounce is the engine's: restitution 0.12 above 2 m/s plus spin, and the keel then kills the sideways speed, so the boat is stopped and slides off rather than rebounds (recoil 0.1 .. 1.9 m after a 10 m/s blow).
* The scripted paths had kinks the meshes showed: the Fontanka loop snapped (1.2 m / 4 deg once per lap, 0.3 .. 0.8 m at every sample point of a bend: fixed at the source, the tangent is interpolated), the Moika boats jumped 0.2 m / 5 deg at the vertices of their polyline (the three pairs now run on smoothed or gentle tracks; griboedov-s, winter and the Neva boats keep their old polylines). A snap that remains is eased by the box (above), so the box can lag the mesh by up to the jump for 1.5 s: the only time the box and the mesh differ.
* The hull is one rectangle (length x beam of the model): the pointed bow of a tourist boat has invisible corners of up to 1.3 m. The same rectangle is what the gull and duck code already assumes.
* Floating hazards in areas other than the live four are not covered (none exist). Dynamic craft added later: `craftSolids(ctx).add({...})` with a pure pose function; a craft that reacts needs a `source.applyCarImpulse` and an `invMassRatio`.
* Not run (no GPU, no browser by the rules of the round): a look at the float blocks cannot show anything (they are invisible); nothing was baked. Every `src/` change makes the bake revision stale as always (the lead re-bakes).
