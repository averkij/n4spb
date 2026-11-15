# Character playground

Standalone review prototype for a GTA-inspired third-person walker and drivable
cars. Open **`/character-test.html`** through the repository's HTTP server:

```powershell
npm start
# http://localhost:5176/character-test.html
```

For a separate server: `node tools/serve.mjs 5186`, then
http://localhost:5186/character-test.html. Three.js comes from the existing local
`node_modules`; run `npm ci` if needed. Models and Rapier are local, so the page
does not need Sketchfab access, an API key, or a CDN. Opening the HTML as `file://`
is not supported by browser ES modules.

## Controls

| Control | On foot | In a car |
| --- | --- | --- |
| WASD / arrows | Camera-relative movement | Accelerate, brake/reverse, steer |
| Mouse | Orbit/look; drag fallback | Orbit, with automatic recentering while moving |
| Shift | Run | — |
| Space | Jump | Handbrake |
| E | Enter / take a nearby car | Animated exit when nearly stopped, with a clear driver side |
| V | Near third person → far → first person | Chase → far chase → driver seat |
| R | Reset player, all three cars and NPC drivers | Reset player, all three cars and NPC drivers |
| 2 / 3 | Red-beret woman / overshirt man | Select seated character |
| Escape | Release mouse and pause | Release mouse and pause |

Third person is the initial walking view. Each transport mode keeps its own view
selection for the current session. The question-mark button expands controls and
the attribution link. The prototype targets desktop keyboard and mouse; narrow
viewport layout is checked but touch movement is not implemented.

## Test ground

The flat 96 × 96 m arena contains parking bays, a wide marked driving loop, a wall
corner for testing camera obstruction, and three blocks for jump/landing tests.
Low perimeter walls stop the player and car. The three orange cones are visual
steering markers outside the driving lane, not physical obstacles.

Two selectable low-poly characters offer a woman in a navy dress and red beret
(default, key 2) and a clean-shaven man in a blue overshirt, straight-leg jeans
and a brown baseball cap
(key 3). Each has six clips: Idle, Walk, Run, Jump, RunningJump and Sitting.
Walking is 2.7 m/s and running is 8 m/s, with full-speed animation cadence of
1.3x and 1.65x. Speed scales cadence during acceleration, and clips blend
between movement states. The blue sedan has animated wheel rotation/steering,
an interior, a seated driver, and a first-person driving view.

The red Bibliott GT and grey everyday traffic sedan are instantiated from the
city's actual model factories (`src/world/drive/model.js` and
`src/world/traffic/models.js`). Playground adapters split their merged geometry
at the driver-door boundaries, hinge the extracted panels and windows, hollow
the old decorative cabin deck, and add usable seats, floor and steering fittings.
The original blue sedan remains available as an empty car.

Both city cars start with the original Kobi male character at the wheel. E runs
an approach, door-open, reach, extraction, recovery, climb-in, close and settle
sequence. After approaching, an occupied-car takeover takes about 2.3 seconds;
empty entry and exit take about 1.32 / 1.24 seconds. The NPC steps out, raises and shakes his hands angrily for 2.2 seconds, then walks
away. Hands track the door handle, occupant's shoulders and steering wheel;
feet clear the sill, and the player ducks before moving under the roof. These
are authored procedural poses and two-bone IK on the existing low-poly rigs,
not a newly recorded motion-capture clip. The original NPC has independent foot
controls; virtual shin endpoints preserve his feet during IK.

Approaches route around the car footprint and reject paths blocked by physics
colliders. Driving inputs and repeated E presses cannot interrupt entry;
character selection is disabled until it completes. Getting out reverses the
empty-entry sequence. Escape freezes the whole action; R restores the cars,
closed doors and both NPC drivers. Each car has its own collider and driving
state, so taking one leaves the others parked.

Driving samples the settled portion of the source Sitting clip into a constant
pose, excluding its standing lead-in. Two-bone arm/leg IK fits the driver to the
seat, steering-wheel grips and footwell. `driving-test.mjs` checks both drivers
for 9.5 seconds each (beyond the old clip wrap), rejecting head-height flashes
and hands that miss the steering-wheel targets.

Jumping uses a grounded 120-140 ms knee-bend before the physics impulse. The
clip's airborne pose follows actual vertical velocity, and contact starts a
short landing recovery. Baked upward root motion is removed so it cannot add a
second lift on top of physics. `jump-test.mjs` checks standing and running jumps
for both characters, including grounded preparation, uninterrupted clip choice,
physical apex, visual root height and landing.

Physics uses Rapier at a fixed 60 Hz: a kinematic capsule with collision sliding,
ground snapping and small-step handling, plus three dynamic cars with an arcade planar
drive model. Camera collision uses a sphere sweep with immediate contraction and
smoothed extension. The character hides when the camera is extremely close to
avoid seeing the inside of the head/body.

The floor uses an exact physics half-space. A wide thin cuboid caused sporadic
zero-displacement capsule steps on flat ground, flashing Idle and restarting
the locomotion clip. Continuous curved walk/run regression tests cover this fix.

## Isolation and future integration

This is an authoring/test tool, not a shipped city change. All implementation,
vendor code and GLBs live here; the root HTML is its only entry point. It imports
the city's two geometry factories, but does not change the city's player, driving
controls, model factories, areas, version, or bake products. `node tools/bake-scene.mjs --plan` confirms all area bakes remain fresh.
The main game's version should be raised when the approved behavior is integrated.

The eventual integration must adapt to the existing player/vehicle physics,
water, metro/flight behavior, material factories, area handoffs, mobile controls,
loading contracts and integrated performance tests. Prototype performance is
not evidence of city performance.

## Assets

See [CREDITS.md](CREDITS.md) for the original Sketchfab URLs, authors, CC BY 4.0
licenses and modifications. The models were inspected/exported in Blender
through MCP, then deduplicated/pruned with glTF Transform 4.5.1. The runtime loads
GLB only. `clean-glb-scenes.mjs` removes empty scenes left by Blender's selection
export without changing binary geometry/animation data.

`prepare-variants.py` records the Blender preparation, accessory construction,
and pose-relative animation transfer. Its source object names refer to the live
import session; reimporting the originals requires updating those names. It
bakes every bone channel so missing constant channels cannot retain a seated
pose when changing back to walking. `civilian.glb` is both the original
animation reference and the two cloned NPC drivers loaded by this page.

Run `repair-characters.py` after initial preparation to produce the final two
variants: fitted arm/hand swing, face-surface eye placement, welded and thickened
skirt with shared waist-seam weights, and beard removal. Its source backups live
in the Blender session so the repair pass can be repeated without accumulating
edits. Both scripts depend on the imported source objects and action names.
Run `style-man.py` last for the man's broader silhouette, relaxed denim and
head-attached baseball cap. It preserves the skinning by inverting each vertex's
blended skin transform after reshaping the neutral pose. The waist uses a shared
deformation across material boundaries so the shirt/jeans seam stays closed.

Khronos/glTF validation has no errors. Imported rigs retain advisory
`NODE_SKINNED_MESH_NON_ROOT` warnings; skinning,
all six animations and transformed placement are verified in Three.js.
The sedan has no validation warnings. No geometry simplification or lossy
animation compression was applied.

## Verification

```powershell
node experiments/character-polygon/simulation-test.mjs
node experiments/character-polygon/playtest.mjs
# With the review server on 5186:
node experiments/character-polygon/driving-test.mjs
node experiments/character-polygon/takeover-test.mjs
node experiments/character-polygon/jump-test.mjs
npx --yes @gltf-transform/cli validate experiments/character-polygon/assets/civilian.glb
npx --yes @gltf-transform/cli validate experiments/character-polygon/assets/sedan.glb
npx --yes @gltf-transform/cli validate experiments/character-polygon/assets/woman-beret.glb
npx --yes @gltf-transform/cli validate experiments/character-polygon/assets/man-jacket.glb
```

The browser test starts and stops its own server on port 5194 and uses the
repository's Puppeteer/Edge setup. It exercises actual keyboard input for walking,
running, jumping/landing, all camera views, wall collision, vehicle proximity,
entering, acceleration, steering, braking, safe exit, reset and pause. It checks
a narrow viewport and saves screenshots and measurements under the ignored
`shots/character-polygon/` directory. Simulation tests additionally cover diagonal
speed normalization, full-throttle boundary collision, and 20 seconds each of
uninterrupted curved walking/running. The browser test switches both
characters and samples every rendered frame during walking/running to reject
idle flashes and action restarts; it also captures jumping and seated poses.
It verifies the new travel speeds and animation cadence. With the review server
running on 5186, `node experiments/character-polygon/motion-review.mjs` captures
front/side/rear contact sheets of exact walk/run phases and close face views.
Add `--man` to review the man instead of the default woman.
The Blender pass was also checked across all 68 walk/run poses: finger endpoints
remained at least 0.245 m from the body centreline and the maximum waist seam
separation was below 0.001 mm.
Diagnostic hooks are
available only with `?test=1`.

Latest local check (2026-11-15): simulation, browser movement/driving, seated
loop regression and the four character/car takeover combinations passed with
zero browser or asset errors. The takeover test samples every frame for pelvis
continuity (largest observed step 0.130 m), checks wheel grips, all stages,
re-entry, input locking, pause/resume and reset. Both original seated-loop checks
sampled 571 frames over 9.5 seconds without a head-height flash. At 1440 x 900,
a five-second idle sample recorded 300 frames, median 16.7 ms and p95 16.8 ms,
with 118 draws and 21,240 triangles. These are headless Edge measurements of this
empty test ground, not the city.
The two selectable GLBs total approximately 1.10 MB (470.7 / 625.8 KB).
The original character reference is 393.6 KB and the car is 241.0 KB; the vendored Rapier module
with embedded WASM is 4.34 MB. First startup includes compilation of that WASM.
