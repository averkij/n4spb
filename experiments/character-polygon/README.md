# Character playground

Standalone review prototype for a GTA-inspired third-person walker and drivable
sedan. Open **`/character-test.html`** through the repository's HTTP server:

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

| Control | On foot | In the sedan |
| --- | --- | --- |
| WASD / arrows | Camera-relative movement | Accelerate, brake/reverse, steer |
| Mouse | Orbit/look; drag fallback | Orbit, with automatic recentering while moving |
| Shift | Run | — |
| Space | Jump | Handbrake |
| E | Enter a nearby car | Exit when nearly stopped, using a clear side |
| V | Near third person → far → first person | Chase → far chase → driver seat |
| R | Reset player and car | Reset player and car |
| 1 / 2 / 3 | Select character | Select seated character |
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

Three selectable low-poly characters offer a white T-shirt with jeans, a woman
in a navy dress and red beret, and a bearded man in a blue overshirt with dark
trousers. Each has six clips: Idle, Walk, Run, Jump, RunningJump and Sitting.
Speed controls animation cadence, and clips blend
between movement states. The blue sedan has animated wheel rotation/steering,
an interior, a seated driver, and a first-person driving view. Entry/exit is an
instant state transition; animated door opening and climbing in are not included.

Physics uses Rapier at a fixed 60 Hz: a kinematic capsule with collision sliding,
ground snapping and small-step handling, plus a dynamic car with an arcade planar
drive model. Camera collision uses a sphere sweep with immediate contraction and
smoothed extension. The character hides when the camera is extremely close to
avoid seeing the inside of the head/body.

The floor uses an exact physics half-space. A wide thin cuboid caused sporadic
zero-displacement capsule steps on flat ground, flashing Idle and restarting
the locomotion clip. Continuous curved walk/run regression tests cover this fix.

## Isolation and future integration

This is an authoring/test tool, not a shipped city change. All implementation,
vendor code and models live here; the root HTML is its only entry point. It does
not import or change the city's player, driving controls, areas, version, or bake
products. `node tools/bake-scene.mjs --plan` confirms all area bakes remain fresh.
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
pose when changing back to walking. `civilian.glb` remains as the original
animation reference but is not loaded by the page.

Khronos/glTF validation has no errors. Imported rigs retain advisory
`NODE_SKINNED_MESH_NON_ROOT` warnings; skinning,
all six animations and transformed placement are verified in Three.js.
The sedan has no validation warnings. No geometry simplification or lossy
animation compression was applied.

## Verification

```powershell
node experiments/character-polygon/simulation-test.mjs
node experiments/character-polygon/playtest.mjs
npx --yes @gltf-transform/cli validate experiments/character-polygon/assets/civilian.glb
npx --yes @gltf-transform/cli validate experiments/character-polygon/assets/sedan.glb
npx --yes @gltf-transform/cli validate experiments/character-polygon/assets/man-white.glb
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
uninterrupted curved walking/running. The browser test switches all three
characters and samples every rendered frame during walking/running to reject
idle flashes and action restarts; it also captures jumping and seated poses.
Diagnostic hooks are
available only with `?test=1`.

Latest local check (2026-11-15): both test programs passed, with zero browser or
asset errors. At 1440 × 900, a five-second uninterrupted idle sample recorded
301 frames, median 16.7 ms and p95 16.8 ms, with about 96 draws and 10,400 triangles.
These are headless Edge measurements of this empty test ground, not the city.
The three selectable GLBs total 1.70 MB (630.0 / 472.5 / 594.2 KB).
The original character reference is 393.6 KB and the car is 241.0 KB; the vendored Rapier module
with embedded WASM is 4.34 MB. First startup includes compilation of that WASM.
