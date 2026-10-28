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
  * the box is the traffic protocol: `source` = the box itself with `cx cz vx vz spin invMassRatio inertia`; the velocity comes from the change of the pose since the last distinct game time (or from a 0.05 s look back when
    that is stale), `spin` is the yaw rate in the car's convention (the contact point moves with `spin * (rz, -rx)`). `invMassRatio` is 0: **a scripted tourist boat is heavy and on rails; it neither reacts nor stops**.
    `drive/collision.js` is unchanged: the impulse uses the RELATIVE velocity, so the player's boat is thrown back from a hull that comes at it and is carried along by one that sweeps past, gets 'hit' (relative normal speed
    over 2.2 m/s) or 'scrape' events (the thump / shake / HUD flash of the boat profile already exist), and is pushed out of the hull by the penetration depth in the same substep (never inside; see "Known limits" for a squeeze).
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
* `landmarksC/boats.js`: the five Fontanka loop boats (`speed` 3 m/s, the long axis is the local z: `w` = beam, `d` = length from the model `SPECS`, 17 .. 24 m) and the five moored ones (`cm-<i>`) are registered; every pontoon gets a float
  block (`buildPier` now returns `centre`, `len`, `wid`, `rot`).
* `environment/quay.js`: the lower landing of every generated descent (`buildDescent`, play area only) gets a float block; the steppable Fontanka flight (`OPEN_FONTANKA_STAIRS`) gets one for its lower landing too.

### What stays `boatPass`, what became solid for a boat (the decision)

`boatPass` (drive/collision.js: a floating boat ignores it) stays on **the steps of the stair (treads, the top landing, the hidden sill) and the walker floors themselves**: they belong to the quay wall, the shore logic of the boat
(`handling.js` nine probes 0.4 m off the water edge) already keeps the boat off them, and the dock must not be caught by them. What a boat can hit now: **the lower landing slab, the pontoon decks (both modules), every tourist
hull** and (as before) the piers of the bridges and every ordinary collider. The floors are still floors: `boatPass` is not removed from the walk boxes, the float block is a separate box.

**The boat's own dock.** The Anichkov dock (`drive/boat/index.js DOCKS`) lies 0.3 m off the edge of the lower landing of the steppable flight: the outer strip of that one landing (`DOCK_INSET`, 0.9 m) is left out of its float block
so that the dock stays free to leave (`tools/boat-test.mjs` 1: nothing within 0.5 m of the hull; the pontoon starts 2.2 m beyond the stern; the moored boat `cm-3` is 12.7 m from the dock, the five moving boats of the loop never come closer than 8 m
(centre to centre, no overlap with the dock hull at any time of a 500 s scan)). The shore logic keeps the boat 1.35 m off the water edge anyway.

### Walker, car, wildlife

* The walker meets the hulls and the float blocks because `physics.resolve` / `columnBlocked` iterate every dynamic item: the same choice as for cars ("cars are solids for walkers"). Checked: a wader in the Moika is pushed aside by a hull
  that sweeps over him (never inside), a walker on the Anichkov pontoon deck / landing is not touched, a car on the bed meets the hull.
* Breakability is untouched: nothing breakable was made unbreakable (a float block is a new box under the walker floors, not a fence); the player's boat does not break anything it did not break before.
* Wildlife: `wildlife/boats.js` is untouched (gull slots, hull index for the ducks); `wildlife-test` passes.

## Tests

`node tools/area.mjs palace tools/boat-craft-test.mjs [--quick]` (CPU, 17 checks in palace; 2 each in the other areas). The scenarios use the poses of the modules' services (`wildlife/boats.js collectBoats`) and the stair frame of
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

Old code (the three `src/world` files of the round reverted to d616843) = 14 of 17 failed (the 3 passes are the tourist-boat description, the walker on the deck and the dock, which must not change). The overlap measure is the exact hull OBB of the boat against the exact OBB of the craft after every 1/60 s step
(tolerance 0.06 m; 0.000 everywhere: the contact code leaves the 0.06 m skin of `carContact`).

## Known limits / things found on the way

* A boat squeezed between a sweeping hull and the quay is not teleported; the shore refuses a contact push onto land (an old rule of `boat/handling.js`: "the push is undone, the impulse stays"), so the hull runs 0.2 .. 0.3 m
  into it for the seconds the squeeze lasts. The tourist lanes keep clear of the banks except on a few Moika reaches; a real fix is a rescue shove along the hull (not done).
* The bounce is the engine's: restitution 0.12 above 2 m/s plus spin, and the keel then kills the sideways speed, so the boat is stopped and slides off rather than rebounds (recoil 0.1 .. 1.9 m after a 10 m/s blow).
* The scripted paths have kinks the meshes already showed: the Fontanka loop snaps 1.2 m / 4 deg once per lap (e.g. t = 61.74 s for `c-0`, -440 / -39), the Moika boats jump 0.2 m / 5 deg at the vertices of their polyline
  (lateral offset). The collision pose follows the mesh exactly (so there is no overlap the player does not see); the velocity of such a frame is not trusted (above 1.6 x the nominal speed + 0.5 m/s or 1.3 rad/s the last real
  velocity stays), so a snap is never a 74 m/s blow.
* The hull is one rectangle (length x beam of the model): the pointed bow of a tourist boat has invisible corners of up to 1.3 m. The same rectangle is what the gull and duck code already assumes.
* Floating hazards in areas other than the live four are not covered (none exist). Dynamic craft added later: `craftSolids(ctx).add({...})` with a pure pose function; a craft that reacts needs a `source.applyCarImpulse` and an `invMassRatio`.
* Not run (no GPU, no browser by the rules of the round): a look at the float blocks cannot show anything (they are invisible); nothing was baked. Every `src/` change makes the bake revision stale as always (the lead re-bakes).
