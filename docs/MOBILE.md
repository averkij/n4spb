# Mobile: touch controls and a hardened boot

Phones and tablets get their own control layer (`src/core/touch.js`), a lighter default tier and a boot that fails *honestly*. Desktop is untouched: everything below keys off one class, `<html class="tc">`,
which the inline script of `index.html` sets for a coarse pointer (`(pointer: coarse)`) or `?touch=1`; `?touch=0` forces it off. Without the class `createTouchControls()` returns `null`, creates nothing, listens to nothing.

The owner reports that the hosted full scene freezes on an iPhone 16 Pro Max in both Safari and Chrome, on Wi-Fi and cellular (2026-11-04; investigation below). The real-device checklist is still incomplete. `npm run touch` (pure node) and `npm run touchbrowser` (Edge, emulated touch, real multi-touch) do not establish full-scene iPhone compatibility.

## 1. What is where

| File | Role |
|---|---|
| `src/core/touch-logic.js` | the pure part: settings + persistence, stick / steering / tilt curves, the encoder for drive.js, the action -> key table, the layout geometry. No DOM, no three.js |
| `src/core/touch.js` | the DOM owner: zones, buttons, ghosts, menu + settings panels, haptics, fullscreen / orientation / wake lock, the rotate banner, per-frame work |
| `src/core/boot-guard.js` | the fatal card, `webglcontextlost`, errors while loading, the phone warning, the crash-loop guard |
| `index.html` | `html.tc` switch, PWA meta tags, the touch CSS (keys row, `#stall`), the 45 s loading watchdog |
| `manifest.webmanifest`, `assets/icons/*.png` | add-to-home-screen (fullscreen, landscape); icons from `node tools/make-icons.mjs` |
| `src/main.js` | the wiring (list in section 8) |
| `tools/touch-logic-test.mjs`, `tools/touch-browser-test.mjs` | the tests |

## 2. Layouts (landscape first; CSS px at UI scale 1, centres / gaps scale with the scale)

`u` = UI scale = shorter screen side / 390 kept in 0.9-1.25 (tablets 1.25; the settings can override). Every button is at least 44 px, primaries 56-124 px, gaps >= 8 px, offsets
`max(16 px, env(safe-area-inset-*))` (left / right insets included: a notched phone in landscape has 47 px). Positions come from `touch-logic.js LAYOUT` and are checked in node and in the browser.

**Walk / fly / ride (train car)**

* left 45 % of the screen from 25 % down: a **floating stick** (appears where the thumb lands, 112 px ring, 8 % dead zone, 1.2 response curve, full push = run, the ring turns gold);
  everything else is the **look drag** (2.2 px x sensitivity, like the old canvas look);
* bottom right: **JUMP** 72, **RUN** 56 (a latch), **FLY** 56 (label LAND while flying), contextual **USE** 80 (only while `ctx.interact.target`; its label sits beside it, never a keyboard letter); while flying JUMP becomes **UP**, RUN becomes **BOOST**, **DOWN** 56 appears;
* top right: **MENU** 48 and **SOUND** 48; the clock moves to the top centre; the street map (132 px) to the top left under the toast. The old chips (places, fly, quality, sound) are hidden; the menu has them.

**Drive (Need-for-Speed style: left thumb steers, right thumb has the pedals)**

* left thumb: a **floating wheel** (default: only the horizontal offset counts, full lock = 64 px, 6 px dead zone, curve 1.35, the wheel icon turns; the wheel follows the thumb past the lock so straightening needs a small move back), or two big **arrows** (96 px, ramping 0.3 -> 1 in 0.3 s), or **tilt** (phone roll);
* right thumb: **GAS** 100 x 124, **BRAKE** 80 (at a standstill = reverse), **NITRO** 76 (its ring is the tank; the word comes from the car's HUD profile, so the Roadster says THRUSTER), **DRIFT** 64 (handbrake), **HOP** 60 and **FLIP** 68 (only when the current car has the gas hops: `vehicle.def.hop` or `id === 'roadster'`; each FIRES ON THE PRESS, no hold and no ring: HOP = the simple hop (`KeyX`, 1.86 m), FLIP = the barrel hop (`KeyC`, 3.72 m with the roll; the accent-blue button, a little bigger). They sit in the thumb zone above DRIFT / BRAKE, HOP 126 px and FLIP 200 px from the right edge, both 184 px up; both dim while the car is in the air or the tank cannot pay them);
* top right second row: **CAM** (V), **HORN** (G), **AUTO** (auto-gas toggle), **FIX** (repair, only when damaged and stopped); top left beside the 108 px map: **EXIT** (refused above 25 km/h like E, with the toast);
* the speedometer is scaled to half and sits at the bottom centre (above the pedals in portrait), the nitro bar, key hints, old `.d-touch` buttons and the damage pill are hidden (`html.tc` CSS, no hud.js edit);
* a drag on the free part of the screen orbits the chase camera (a synthetic `mousemove` with `movementX`, the path drive.js already has for the mouse).

**Portrait** keeps the same anchors (the arrows shrink so that they clear the pedals; the toast and the hint go to the middle of the screen) and shows a non-blocking dismissible banner "rotate your phone" (the dismissal is remembered for the session).
An iPhone cannot lock the orientation, so the banner is the only mechanism there.

## 3. How touch reaches the game (Phase 1: the existing channels)

| Control | Channel |
|---|---|
| walk stick | `player.touchMove.set(x, y)` (y down = back); run = the player's own `length > 0.95` or the RUN latch (`ShiftLeft` in `player.keys`) |
| look | `player.look.dx / dy += delta * 2.2 * sensitivity` (the mouse accumulator); in the car a synthetic `mousemove` |
| JUMP, CAM, HORN, SOUND | a synthetic `KeyboardEvent` keydown + keyup on `window` (`Space`, `KeyV`, `KeyG`, `KeyM`): every handler reads `e.code`, none checks `isTrusted` |
| UP / DOWN / BOOST / NITRO / DRIFT | the code is held in `player.keys` while the finger is down (`Space`, `KeyC`, `ShiftLeft`); no keydown is dispatched, so no jump |
| HOP / FLIP (`ACTIONS.hop` / `ACTIONS.flip`, `kind = 'tap'`, `fire: 'down'`) | the press sends a synthetic keydown + keyup of `KeyX` / `KeyC` (never a held key: `desiredKeys` ignores them); drive.js latches it (`hopTap` / `flipTap`), `readInput` makes it `input.jump` / `input.flip` and handling.js launches on that very step. In fly mode `KeyC` stays the descend key: the FLIP button only exists in drive mode and drive.js ignores `KeyC` unless the car is driven |
| USE / EXIT / FIX / FLY | `ctx.interact.use()` / `ctx.drive.exit()` / `ctx.drive.repair()` / `player.toggleFly()` |
| steering + pedals | the exact inverse of drive.js `readInput`: `player.touchMove = (-steer / 1.4, thr > 0 ? -thr / 1.3 : brk)`; the brake wins over the gas; a neutral y of 0.12 keeps small steering above the 0.1 threshold; gas below 0.2 is lifted to 0.2 (`touch-logic.js encodeDrive`) |
| the clean contract (Phase 2) | `ctx.touch = { active, mode, steer (+left), thr, brk, nitro, hand, hop, flip, look: {dx, dy} }`, written every frame (`hop` / `flip` = a HOP / FLIP press in the last three frames); `active` is true while driving |

**Merge warning.** The steering bridge is only valid while drive.js `readInput` still reads `player.touchMove`. `tools/touch-logic-test.mjs` extracts the real `readInput` source from `src/world/drive.js` and runs the encoder through it, and
fails loudly when `readInput` reads neither `player.touchMove` nor `ctx.touch`. Phase 2 (after the drive input rewrite lands): in `readInput` take `ctx.touch` when `active` (`out.steer = t.steer; out.thr = t.thr; out.brk = t.brk; out.nitro ||= t.nitro; out.hand ||= t.hand`),
drop the `player.touchMove` hack, the `touch` object and the `.d-touch` buttons in hud.js, and delete the canvas touch handlers in `player.js` (nothing reaches them any more: the touch layer sits on top of the canvas).

One role per pointer (stick / look / wheel / a button), `setPointerCapture`, `pointercancel` and `lostpointercapture` release it; extra fingers in a zone are ignored; **every** role is released on a mode switch (walk / fly / ride / drive), on a panel opening, on `blur`, a hidden tab,
`pagehide` and an orientation change, and `player.keys` / `touchMove` go back to zero. A panel opened by a touch swallows the browser's ghost click for 350 ms (it would hit the close button under the finger).

## 4. Settings (the menu -> Controls; `localStorage['piter.touch']`, try / catch everywhere)

| Setting | Default | Range |
|---|---|---|
| look sensitivity | 1.0 | 0.4-2.5 (x the 2.2 px multiplier); invert Y off |
| steering | wheel | wheel / arrows / tilt (tilt asks for motion access inside the tap on iOS) |
| steering sensitivity | 100 % | 50-150 % (a shorter swipe to full lock) |
| speed steering assist | on | the lock shrinks 1 -> 0.6 from 0 to 180 km/h |
| tilt range | 28 deg | 18-40; the centre is captured on entering the car and by the 0 deg button |
| auto gas | off | the pedal reads AUTO; the brake still wins |
| left-handed | off | swaps the stick zone and the right cluster (the top corners stay) |
| haptics | on | `navigator.vibrate` (Android only; disabled in the panel where it does not exist) |
| button size | auto | 0.8-1.3 |
| run by default | off | the RUN latch |

The menu also has places (44 px rows), time of day, sound, hide UI, respawn, FPS, fullscreen (not on iPhone) and the quality select (reloads). Corrupt JSON, blocked storage and unknown keys fall back to defaults.

## 5. Tier and boot on a phone

* **Default tier = performance** on touch devices (a remembered `piter.q` or `?q=` still wins). On touch the GPU side is trimmed whatever the tier: shadow map 1024, MSAA 2, pixel ratio <= 1 (`main.js`; `level`, far plane and the bake are untouched, so no new bake is needed).
* **`#go` is the one user gesture** (touch.js adds its own click listener): fullscreen (Android Chrome, iPad; never iPhone, which has no element fullscreen), then `screen.orientation.lock('landscape')` after the fullscreen promise (Android only), the screen **wake lock** (re-requested when the tab returns), tilt permission when tilt is the saved scheme.
* **Hidden tab**: all roles released, `player.keys` cleared, the main loop skips the frame, the wake lock is re-acquired on return.
* **iPhone fullscreen** is only possible as an installed web app: `manifest.webmanifest` (display fullscreen, landscape) plus the `apple-mobile-web-app-*` meta tags; the menu explains Share -> Add to Home Screen.
* **Failure handling** (`boot-guard.js`): an uncaught error while loading, a failed `main()` or a lost WebGL context shows a full-screen card with the message and a Reload button (no restore attempt: main.js frees the CPU copies of the geometry after the upload frame, so a restored context could not be refilled).
  The loading screen has a **45 s no-progress watchdog** (inline in `index.html`: "scripts did not load: check the connection / iOS 16.4+" when main.js never started, "still loading, keep the tab open" when it is just slow; never kills the load).
  Phones see a **pre-start warning once per session** ("heavy scene, ~51 MB, ~1 GB RAM; Continue anyway", stronger when `navigator.deviceMemory` < 4 or on a cellular / save-data connection; `?gate=0` skips it) and a **crash-loop guard**: two unfinished starts within a minute (sessionStorage `piter.boots`) and the next start shows a card
  that offers the performance tier or "try anyway" instead of loading again (`?guard=0` switches it off).

## 6. Known limits

* **Memory is the real blocker on phones.** The bake is ~357 MB of typed arrays; the measured JS heap after load is ~1.2 GB on desktop (docs/STRIP.md). iOS Safari reloads tabs over its budget (reports: ~1.5 GB iPhone 12 Pro, ~3 GB iPhone 15 Pro) with no catchable exception; Android Chrome shows "Aw, Snap". Expect trouble on low-RAM phones, likely fine on iPad Pro and 8 GB+ Android.
  The controls cannot fix this; the warning, the card and the crash-loop guard only make it honest. A memory diet (release the `field-*` products after the build, a 1 m roof map, tiling) is a separate project.
* OS gates: `DecompressionStream` and import maps need iOS 16.4+ / a current Chrome (below that the watchdog tells so).
* Haptics: Android only. iOS Safari has no `navigator.vibrate`.
* Orientation lock: Android Chrome in fullscreen / installed only; iOS only has the rotate banner.
* The tilt sign on iOS (gravity is reported with the opposite sign) is a best guess until tested on a device; the settings panel can fall back to the wheel.
* Hybrid laptops report a fine pointer: use `?touch=1`.
* WebGL specifics to confirm on devices: half-float render targets with MSAA (`EXT_color_buffer_float`), `KHR_parallel_shader_compile` (the compile is serial where it is missing).

## 7. Testing

```sh
npm run touch                      # pure node: curves, dead zones, the encoder vs the REAL drive.js readInput, settings (corrupt JSON, throwing storage), action table, layout geometry in 7 viewports
npm run touchbrowser               # Edge + puppeteer-core, isMobile + hasTouch, real multi-touch; screenshots in shots/touch/ (LOOK at them)
node tools/touch-browser-test.mjs --only mobile,portrait     # scenarios: desktop mobile portrait layout settings boot failure (full = the whole baked scene, opt-in)
node tools/make-icons.mjs          # rewrites assets/icons/*.png
```

The browser test uses the fast harness (`?baked=0&only=drive&noroof=1`, ~6 s per page) and, for the real scene, `?baked=force` (needed while the bake is stale). Run browser tools one at a time (GPU).
It covers: the desktop page untouched (and `?touch=1` / `?touch=0`), the stick, look, stick + look at once, two fingers in a zone, a third finger, JUMP, RUN latch, FLY with UP / DOWN, USE -> the car, wheel (full / half / other side / dead zone), GAS, steer + gas at once, NITRO, DRIFT, BRAKE and reverse,
CAM / HORN / HOP / FLIP / FIX / AUTO, EXIT at speed and standing, release safety (menu, blur, hidden tab, `pointercancel`), layouts at 844x390, 915x412, 667x375, 1180x820, 820x1180, 390x844, 360x640 and with 47 px notch insets (no overlaps, >= 44 px, nothing over the map / speedometer / clock),
the rotate banner, the settings panel and persistence across a reload, left-handed, tilt, arrows, places, the boot stubs (fullscreen -> orientation lock, wake lock, re-request, haptics, an iPhone user agent), the fatal card, the crash-loop guard, the phone warning and the watchdog.

## 8. Wiring in `src/main.js` (what to re-apply when merging)

1. imports of `createTouchControls` and `installBootGuard`;
2. `const isTouch = document.documentElement.classList.contains('tc')` (was the `(pointer: coarse)` query);
3. the default tier `'performance'` (since 2026-10-17 on every device; phones add the touch GPU overrides below) and, right after `const quality = ...`, the touch GPU overrides (`pixelRatio`, `shadowMap` 1024, `msaa` 2);
4. `const guard = installBootGuard({ canvas, params, isTouch, qName })` right after `const canvas = ...` (before the renderer, so that a renderer failure shows the card);
5. `createTouchControls({ ctx, player, canvas, params })` after `ctx.interact = ...`;
6. `frame()` starts with `if (guard.dead || document.hidden) { last = now; return; }`;
7. the last line is `guard.gate().then(() => main()).catch(guard.fatal)` instead of `main()`.

## 9. Testing on a real phone

* **iPhone / iPad**: open the GitHub Pages URL (https://averkij.github.io/n4spb/, HTTPS, so wake lock and device motion work); Safari Web Inspector from a Mac (Settings -> Safari -> Advanced -> Web Inspector, then Develop -> the iPhone) for the console and the memory timeline. Also test the home-screen install (Share -> Add to Home Screen) for fullscreen.
* **Android**: Chrome `chrome://inspect` over USB debugging; `adb reverse tcp:5176 tcp:5176` and `http://localhost:5176` is a secure context (wake lock, device motion) without HTTPS (`node tools/serve.mjs` listens on all interfaces, but a LAN IP over plain HTTP is not secure).

**Real-device checklist** (cannot be automated here): iPhone (Safari + standalone), iPad, a mid Android, a flagship Android.

- [ ] the page loads and starts (jetsam / "Aw, Snap" during the load?), the phone warning and the 45 s watchdog read well
- [ ] stick and look feel right at the default sensitivities; no accidental pinch / double-tap zoom, no pull-to-refresh, no rubber banding, no callout / text selection, no focus zoom in the menu
- [ ] JUMP / RUN / FLY / UP / DOWN / USE; the USE button appears at the red car, the metro doors, the trains
- [ ] driving: wheel, arrows and tilt (**the tilt sign on iOS vs Android, and in landscape-secondary**), GAS / BRAKE / NITRO / DRIFT, camera, horn, exit; thumb reach with large and small hands; the left-handed swap
- [ ] safe-area insets on a notched phone in both landscape directions (the clusters keep 47 px from the edges)
- [ ] fullscreen from `#go` (Android, iPad), the orientation lock after it (Android), the wake lock in the browser and in standalone, re-acquired after switching apps
- [ ] haptics on Android (impact, nitro), none expected on iOS
- [ ] audio against the iOS ringer switch (the page is silent when the switch is on silent), after a phone call (the AudioContext resumes)
- [ ] frame rate and heat on the performance tier; WebGL extensions (half-float MSAA targets)

## 10. Hosted loading investigation (2026-11-04, 9.5.2)

The owner's iPhone 16 Pro Max freezes in Safari and Chrome on both Wi-Fi and
cellular. Initial reports were 0% or 17-20%. The controlled URL
`?q=performance&earlycompile=0` still froze at 3%. Adding `&bakedworker=0`
advanced to 100%, restarted at 0%, reached 100% again and crashed. These are
real-device observations, not a successful mobile validation. Disabling the
worker changes concurrency, memory ownership and scheduling; it implicates
that path but does not prove a particular WebKit worker defect.

The landing page is Palace-Liteyny. Its progress counts modules, not bytes:

| Display | Work about to run / still running |
| --- | --- |
| 0% | Static imports, phone confirmation, manifest/revision, fonts, riverfront |
| 3% | Environment: field planes, ground, quays, vegetation, water, boats |
| 17% | Streets: textures, road graph, nearby surface regions, furniture |
| 20% | City: colliders, materials/textures, nearby building regions |
| 97% | Batching, outline setup and final shader compilation |
| 100% | `build()` ended; roof setup, simulation, first render and proxy uploads can still be pending |

Only `document.body.classList.contains('loaded')` means normal startup finished.
The 100% label is set earlier. No automatic reload at this point was found in
the normal entry path. OS/browser termination is a leading explanation for the
reported restart, but requires device logs to distinguish memory, GPU and other
process failures.

### Reproduce on the actual host

```powershell
node tools/hosted-load-probe.mjs --mobile
node tools/hosted-load-probe.mjs
node tools/hosted-load-probe.mjs --block __baked_revision --seconds 30
node tools/hosted-load-probe.mjs --block cdn.jsdelivr.net --seconds 52
```

Run browser jobs serially. This uses the existing Puppeteer/Edge harness stack
in a fresh browser profile, real HTTPS assets and real CDN/font requests. It
does not replace Three.js with local files or use `shot`, `only`, `baked=force`
or `ensureAll`. `--mobile` emulates 956 x 440 CSS pixels, DPR 3 and touch; it is
still desktop Chromium with desktop memory/GPU, not iOS. `CHROME_PATH` can select
another Chromium executable. `--url`, `--seconds` and `--out` are supported;
artifacts default to a unique directory under the OS temporary directory.

`report.json` records progress, completed modules, bake diagnostics, CDP heap
and backing storage separately, long tasks, errors and page/worker network
events. It saves incrementally so a hung/crashed page leaves evidence. Worker
network attachment is best effort; incomplete entries alone are not proof of
a stuck request. Screenshots show readiness/start or the failure. A successful
run clicks the start button and verifies `playing`; failures exit nonzero.
The two `--block` commands deliberately fail and should exit 1.

Normal hosted runs passed: desktop in 43.4 s, touch emulation in 64.3 s, with
no module failures. Both start-button interactions entered `playing`, and
screenshots were reviewed. These are independent cold-profile diagnostic runs,
not a mobile-vs-desktop performance comparison. See PERFORMANCE.md for memory.

### Confirmed weaknesses and next fixes

* `__baked_revision` is a development-server endpoint. Its normal hosted 404
  falls back to `BAKED_REVISION` and did not prevent either successful run.
  However, `openBakedWorld()` awaits it in the manifest's `Promise.all`:
  deliberately failing the request produces a fatal `Failed to fetch` at 0%.
  A hanging probe has no application timeout. Remove the deployed probe or
  make the optional request bounded and independent, preserving dev stale-bake
  checks and their tests.
* Main-module imports require `cdn.jsdelivr.net`. Blocking it reproduces 0%
  with `__mainStarted === false`; the inline watchdog appears after 45 s.
  The boot guard cannot catch a static import failure before it is installed.
  Consider shipping the pinned Three.js dependency with the site and validate
  import-map/closure/deployment contracts.
* Asset fetches and worker requests have no deadline/progress heartbeat.
  An unresolved fetch, decompression or worker reply can keep a module pending
  indefinitely. `onerror` fallback covers explicit worker failures only.
  Report the last phase/asset and elapsed time; use bounded failure handling
  that does not leave concurrent retries allocating large buffers.
* Required bake currently guards the manifest, not all products. `bakedData()`
  returns null after a product error; `loadFieldBake()` can then invoke the
  expensive field generator even on a required-bake phone load. Required
  production assets should fail explicitly, while preserving deliberate
  development generator fallback. This is a source finding, not an observed
  failed field request in the successful hosted runs.
* Field planes expand to 169.6 MiB, alongside early prefetch of the 67.5 MiB
  roof, 15.0 MiB nav and 35.0 MiB city-base payloads. Field hydration then
  constructs its compact representations synchronously on the main thread.
  Prioritize peak memory/lifetimes, deferring roof/nav work until needed,
  bounded worker work, and ground hydration. At the later 100% stage, inspect
  first-frame/proxy GPU uploads. The Performance tier already was selected;
  the current touch overrides mainly reduce GPU settings, not these payloads.
* Add real phase milestones through the first rendered frame, a persistent
  bounded diagnostic journal, and an export action available during stalls.
  The existing watchdog requires the main event loop and cannot run during a
  synchronous stall or after the OS kills the process. The crash-loop guard
  only counts unfinished boots within 60 seconds and marks a boot successful
  at `body.loaded`; it can miss slower failures and post-load termination.

No runtime fix or bake change was made in the initial investigation. Changing shared
loading code requires the normal version/revision, all stale-area bakes and
integration validation; do not relabel the current bake to bypass those checks.

### Capture the actual iPhone failure

Enable Safari's Advanced > Web Inspector setting on the phone, connect it to
a Mac, enable Safari's developer features, then select the phone's game tab
from Develop. Record Network and Timelines while reloading; when stuck, pause
JavaScript to locate synchronous work or examine outstanding fetches/worker
messages. See [WebKit's remote inspection instructions](https://webkit.org/web-inspector/enabling-web-inspector/).

For a restart/crash, open Settings > Privacy & Security > Analytics &
Improvements > Analytics Data and inspect a `JetsamEvent` or WebKit/Safari
crash log matching the attempt's timestamp. A matching WebContent/GPU process
termination and its reason matter; an unrelated JetsamEvent is not proof.
[Apple's log collection guide](https://developer.apple.com/documentation/xcode/acquiring-crash-reports-and-diagnostic-logs)
and [jetsam interpretation](https://developer.apple.com/documentation/xcode/identifying-high-memory-use-with-jetsam-event-reports)
describe how to distinguish memory termination. Total phone RAM alone does not
establish the available browser-process budget.

In the remote console, collect this small state snapshot (avoid dumping the
entire scene or expanding field `.data`, which itself allocates):

```javascript
JSON.stringify({
  url: location.href,
  percent: document.getElementById('loadpct')?.textContent,
  label: document.getElementById('loadlabel')?.textContent,
  mainStarted: !!window.__mainStarted,
  loaded: document.body.classList.contains('loaded'),
  modules: window.__stats?.modules,
  timing: window.__stats?.timing,
  baked: window.__ctx?.services?.baked,
  fieldReady: !!window.__ctx?.services?.environment?.field,
  environmentPhases: window.__ctx?.services?.environment?.buildPhases,
  errors: window.__errors
}, null, 2)
```

## 11. On-phone loading report (9.6.0)

Open `diagnostics.html` beside the normal landing page. This standalone support
page loads the same full Palace scene after **Start test**. It defaults to the
Performance tier, the normal worker and early shader compilation. Record the
device/iOS version in the optional field; then reproduce the failure once.

The **Diagnostics** button opens the report during loading. After a crash or
reload, reopen the same URL in the same browser: the game stays paused so the
last saved report can be recovered without another heavy load. Choose **Copy
report**, **Download report**, or **Show report text**. Keep the first report
before trying **Main thread (comparison)** or disabling early compilation.
The latest two attempts are retained; starting a third replaces the oldest.

### Isolate decoding from the scene (9.7.0)

The first recovered iPhone report (Chrome on iOS 26.7, default settings) stopped
at 5.401 s, `0% landmarksRiverfront`, with no completed modules. It had queued
all seven prefetch requests but recorded no worker replies. The manifest loaded,
the revision endpoint's 404 was handled, and a WebGL 2 context existed. The
heartbeat stopped too, so this does not establish that a worker request alone
was hung: synchronous work or a process failure can also prevent delivery of
worker messages and recording. Early compilation had no recorded elapsed time;
the snapshot does not locate the exact instruction that stalled.

Select **Assets only: one at a time**, or open
`diagnostics.html?test=assets-sequential`, then press **Start test**. This uses
the shipping worker to decode the seven actual startup assets without importing
the game or creating a renderer. It drops decoded values after each response.
If that succeeds, **Assets only: seven together** (`?test=assets-burst`) exercises
the original concurrent request burst. Both tests stop after 90 seconds while
the event loop is responsive, terminate the worker, and never retry or build a
procedural scene. A frozen/killed process still requires reopening the page.

Passing these tests narrows the investigation to work absent from the probe
(scene construction/rendering, retained scene data and combined peak memory);
it does not establish that worker loading is safe alongside a full scene.
The test does not hydrate field planes or build geometry from decoded data.
The user subsequently confirmed that both one-at-a-time and seven-together
tests passed on the affected iPhone. Worker decoding in isolation therefore
works there; combined scene loading remains the failing case.
Both real-data modes passed in desktop Chromium, including saved-report
recovery; an injected nonresponding worker verified bounded failure and cleanup.

### Isolate the first geometry module (9.8.0)

`diagnostics.html?test=riverfront` selects **Riverfront geometry only**. It imports
the actual Palace layout, context and riverfront module using the page's import
map, then constructs its geometry with the normal context and Performance
population settings. It records separate import, context and construction
milestones, followed by part/triangle counts. It creates no WebGL renderer and
does not request baked assets or load the other scene modules. An import wait
has a 90-second watchdog; synchronous construction cannot be interrupted by a
JavaScript timer. Reopen the page for the last saved phase if it freezes.

Desktop Chromium completed the probe with 472,853 triangles. This is a CPU
construction test, not a visual correctness or full-scene performance test;
successful construction would still leave shader compilation, GPU uploads and
combined scene memory to investigate. The normal game code and all area bakes
remain unchanged by these support tests.
The user also confirmed that this test passed on the affected iPhone.

### Test combined loading with reduced decoding overlap (9.9.0)

`diagnostics.html?test=scene-staged` selects **Full scene: staged decoding**.
The real Palace game runs with its normal settings and early shader compilation.
Only the diagnostic wrapper changes request scheduling: it holds baked-worker
requests until the riverfront module has completed construction and its early
compile has returned, then forwards one request at a time. Replies, decoded
values, and all scene content use the original loader. Queued requests and sent
requests are recorded separately. Ordinary diagnostics and normal game pages
retain the original scheduling. This is an experiment, not a confirmed fix;
it reduces simultaneous decoding but does not remove the scene's retained data.

Both full-scene diagnostic modes also journal entry and return around renderer
`compile`, `compileAsync`, and the first 20 startup `render` calls. The wrapper
samples completed-module state immediately before entering a GPU call. This
closes a gap in the original report: construction and early shader compilation
run in the same turn, so a shader stall could previously leave a saved snapshot
with no completed modules. Asynchronous compilation has separate start/end
events; a start without an end identifies an outstanding call, not its cause.
The wrapper preserves the original result/Promise and stops logging after the
loaded marker. It does not measure total GPU memory or catch an OS termination.

`node tools/loading-diagnostics-test.mjs --full --staged` exercises the real
scene, records all worker events outside the bounded UI log, verifies a maximum
of one outstanding decode and the initial riverfront gate, and enters play.
This passed in desktop Chromium with touch-sized viewports; report recovery
after reload also passed and screenshots were reviewed. Nearby-region streaming
can legitimately have one request in flight after play starts. All 16 live
area manifests remain fresh.

The affected iPhone's staged test reached 20% and waited for more than a minute
with a responsive main thread (largest recorded heartbeat gap 1.929 s). It had
decoded 22 products, including all field planes and the first city region, and
was awaiting `city-base-0_-1` (10,996,296 raw bytes). All recorded early shader
compiles returned. The 322,649,123 decoded bytes are a cumulative counter, not
live memory usage. This report isolates an outstanding worker request; it does
not establish whether the worker is waiting on the network, decompressor,
decoder, transfer, or has stopped responding.

### Worker-side phase trace (9.9.1)

The staged full-scene test now selects `baked-worker-trace.js`, a support-only
worker using the same shipping codec and transfer reply contract. It journals
fetch, response headers, body decompression, metadata/object decoding, transfer
entry and transfer return. While a request is active it sends a small heartbeat
once per second. The diagnostic wrapper consumes these trace messages before
the game's loader receives them, so a phase message cannot complete an asset
request. The ordinary game still uses its original worker.

Use the same `?test=scene-staged` link, reload the support page, and start a new
test. If progress stops but the UI responds, wait about 20 seconds and use the
Diagnostics button to copy the report directly. A pending request's
`workerPhase`, `workerTrace.heartbeatMs` and the main `elapsedMs` distinguish a
responsive worker waiting on asynchronous work from an unresponsive worker.
Decompression includes reading the response body, so that phase alone does not
distinguish a network-body stall from a decompression-stream stall. A missing
heartbeat is not by itself proof of a process crash. This trace does not add
timeouts/retries or change memory limits.

Validation: the traced staged scene loaded and entered play in desktop Chromium;
all six phase markers appeared, worker scheduling stayed serial, and saved-report
recovery passed. A deliberately unanswered fetch kept emitting worker heartbeats
without delivering a false asset reply; a 404 produced the original error reply.
Closure lint, manifest checks and generated-page checks passed. No area bake or
normal game-loader code changed.

### JavaScript gzip comparison and visible version (9.10.0)

The next iPhone trace stopped on a different chunk, `city-base-0_0`, after HTTP
200 at the `decompress` phase. The worker's last message was at 6.253 s, while
the page report continued to 78.648 s; no worker heartbeat was received during
the long stall. The previously stuck `city-base-0_-1` decoded successfully in
this attempt. This narrows the failure to the response-body/decompression path
or a worker failure there, rather than a consistently invalid individual asset.
It does not prove a particular WebKit bug or memory termination.

`diagnostics.html?test=scene-js-gzip` selects **Full scene: JS gzip decoder**.
It retains staged/serial worker scheduling but reads the compressed response
with `arrayBuffer()`, then inflates using the locally vendored fflate 0.8.2 from
the pinned Three.js package. It bypasses native `DecompressionStream` entirely.
The diagnostic logs `download-compressed`, `import-js-inflater` and `inflate-js`
separately. The final output is preallocated to the manifest's declared size;
size and gzip CRC32 are checked before the ordinary baked-data decoder runs.
This path temporarily retains a compressed buffer as well as the decoded buffer
and has additional JavaScript CPU work. It is a comparison/workaround candidate,
not yet a verified iPhone fix. The normal game continues to use its original path.

The Diagnostics badge and panel now show the current version before the game
starts. A recovered report's game version is labelled separately, and new reports
also include `diagnosticsVersion`. Regenerate `diagnostics.html` after a version
bump as well as after changes to `index.html`; CI checks both inputs.

`node tools/baked-gzip-js-test.mjs` verified all 108 Palace products (486,951,363
decoded bytes) byte-for-byte against Node zlib and checked invalid CRC, declared
size and truncation rejection. `node tools/loading-diagnostics-test.mjs --full
--js-gzip` exercises the full-scene alternative and verifies that no native
decompression phases are used. The fflate source and its MIT licence are copied
explicitly into the Pages site by the deployment workflow.
The full-scene JS-gzip run passed in desktop Chromium, entered play, and recovered
its report after reload. Screenshots confirmed the visible version in the paused
panel and running-game badge. All live bakes remained fresh, and closure,
deployment-asset and generated-page checks passed.

The next iPhone JS-gzip report reached 97% at 14.167 s: all 29 scene modules
built, all 29 requested baked products decoded, no pending requests and no bake
failures. This demonstrates passage through the earlier 20% worker stall with
the alternative decoder. The user reported that it appeared loaded, but this
snapshot still has `loaded: false` and `playing: false`. First-frame readiness
and sustained interaction need separate confirmation; do not treat this snapshot
as proof that the complete phone load or the later memory/GPU workload is fixed.
At 97%, the remaining path includes batching, render-proxy construction, final
shader compilation, first-frame uploads and the readiness marker.

The user subsequently saw a 0% loading screen after choosing Show game, both
after reopening diagnostics and reportedly in the same page after the test.
Reopening deliberately pauses the game but previously left Show game enabled;
that exposed the initial, unstarted loader. Version 9.10.1 disables that button
until a scene test starts and labels reports Live attempt or Saved attempt.
This UI correction does not establish the cause of the reported same-page reset
or prove that the phone completed the work after 97%.

Exports now include `currentPage` (identity, opening time, navigation type,
whether a test/scene was started, current visible progress and readiness) and
each new attempt records its originating `page`. `reportFromCurrentPage` is
null for older reports without an identity. Export samples the live attempt
immediately; selecting old reports does not rewrite their state. Show current
game records its progress/readiness before hiding the panel, and a decreasing
percentage in one document records `progress:regressed`. A different page ID
establishes a new document, not why it was created or whether iOS killed it.
The focused browser regression covers live Show current game preserving 100%,
a simulated same-document progress drop, saved-report recovery after reload,
and disabling game display for unstarted/completed asset-only tests.

### First colour-frame investigation (9.11.0)

The next iPhone report reached 100% at 17.553 s. Batching/finalization and final
`compileAsync` completed; the first `renderer.render` returned in 18 ms, then
the second render entered at 18.005 s without a recorded return. `loaded` and
`playing` remained false. In the current pipeline these are the normal/depth
pass followed by the colour pass, including its sun-shadow rendering. This is
still the first warm-up frame, not the later all-proxy upload frame.

The recovered document had a different page ID and `navigationType: back_forward`,
opening about 234 ms after the last saved event. This establishes a new document
displaying a saved attempt, rather than a same-document percentage reset. It
does not establish whether navigation, browser recovery or process termination
caused the replacement, nor prove that memory was the reason.

`diagnostics.html?test=scene-js-gzip&diagshadows=0` selects the same staged JS
decoder with only sun shadows disabled, before shader compilation. The normal
game is unaffected. The panel's Sun shadows checkbox can restore the baseline.
All full-scene tests now record the first 20 render calls' target (normal/depth,
colour, postprocess or screen), layer mask, target dimensions/sample count,
shadow state and Three.js resource counts. Shadow generation has separate
entry/return markers. These distinguish a shadow-stage failure from subsequent
colour work, although GPU execution can be asynchronous.

`sceneBuffers` records a single post-batching, pre-upload inventory: unique
reachable geometry backing buffers, material/texture counts, data-texture
backing buffers and the ten largest texture dimensions. It does not retain
scene references, expand field storage or include canvas backing stores,
unreachable allocations awaiting collection, all CPU services, driver memory
or total GPU memory. Do not equate it with the cumulative baked decoder bytes.
In the desktop no-shadow run, reachable geometry buffers were 588,882,076 bytes
and data-texture buffers 41,833,520 bytes; four canvas textures were 4096 square.
This is substantial combined load, but it is not an iPhone memory measurement.

The browser regression supports `--full --js-gzip --no-shadows` and the baseline
`--full --js-gzip`, checking render-pass identification, shadow state, scene
inventory, real-scene readiness/play and report recovery. The comparison is
diagnostic, not yet a validated phone fix.
Both runs passed in desktop Chromium: readiness, entering play and recovery
worked, normal/depth was render #1 and colour was #2, and shadow entry/return
events appeared only in the baseline. The baseline's first colour call included
112 ms in the shadow wrapper; its full colour call took 2437 ms on that desktop.
Screenshots of both playable scenes were reviewed. Closure, generated-page and
all 16 live bake-manifest checks passed; no normal game or bake changes.

### Batching allocation comparison (9.12.0)

The phone's shadows-disabled attempt ended earlier, with its last checkpoint at
97% (13.402 s), all 29 baked products decoded and no pending requests. No final
compile or render entry was recorded. A new document opened about 503 ms after
the last saved event. This does not isolate shadows as the cause; the changing
stopping point leaves combined memory pressure as a working hypothesis.

`diagnostics.html?test=scene-js-gzip&diagshadows=0&diagatlas=0` retains that test's
decoder/shadow settings and disables only texture-atlas construction in the
initial static batch. It calls the existing `batchStatic` implementation with
its supported `atlasTextures: false` option. Original textures remain in use;
draw calls/material count can increase. This is a diagnostic memory comparison,
not a production performance setting or a confirmed phone fix.

The support page's generated import map scopes main.js's finalization imports
to `loading-finalize-diagnostics.js`. The adapter calls the original batching,
instance splitting, fixture grouping, attribute compaction and outline-proxy
builders, recording entry/return/error for each. Original modules imported by
other builders and all ordinary area entry points remain unchanged. The adapter
does not duplicate or modify the geometry algorithms or bypass bake validation.

`buildPhase` identifies the latest finalization step, and `batch` records the
atlas page count. `sceneBuffers` additionally counts unique reachable texture
canvases and their pixel area, with an explicitly labelled RGBA8 byte estimate.
That estimate excludes other references/caches and actual browser/driver storage.
In the desktop no-atlas test, batching allocated zero atlas pages; the remaining
scene still had one 4096-square original texture, 588,769,030 geometry-buffer
bytes and 438,247,168 estimated canvas RGBA8 bytes. Disabling atlas creation
does not by itself make this scene small enough for a phone.

Run `node tools/loading-diagnostics-test.mjs --full --js-gzip --no-shadows
--no-atlas` and the same command without `--no-atlas` for the controlled baseline.
The harness checks every finalization checkpoint, the original batching stats,
loaded/playing state and report/option recovery after reload. Screenshots and
raw reports remain in the temporary evidence directory.
Both desktop runs passed readiness/play and recovery, with screenshots reviewed.
The baseline created three 4096-square atlas pages (192 MiB of raw RGBA8 pixels)
from 293 source textures. Its reachable canvas estimate was 516,631,296 bytes,
versus 438,247,168 without atlases; this difference is smaller than the avoided
allocations because the no-atlas scene keeps more original textures directly
reachable. Neither number measures total retained browser memory. All five
finalization stages emitted start/end checkpoints in both runs. Closure and
generated-page checks passed and all 16 live bakes remained fresh.

### Static texture memory and first-colour draw checkpoints (9.13.0)

The phone's next two no-atlas attempts still failed, one at 97% and one at 100%.
The latter completed batching, splitting, fixtures, compaction and outline setup,
then final shader compilation. Normal/depth render #1 returned; colour render #2
entered with shadows disabled and did not record a return. Its pre-upload
inventory was 588,769,446 geometry bytes, 41,833,520 data-texture bytes and an
estimated 438,247,168 canvas RGBA8 bytes. This excludes many additional process
allocations and GPU copies. It demonstrates a substantial retained load but is
not proof of an OS memory kill or a particular failing GPU command.

`diagtexture=256` on the diagnostic page reduces static CanvasTexture images in
place immediately before batching, preserving aspect ratio and normalized UVs.
It uses a small scratch canvas, resizes the original backing and invalidates
texture aliases. Data textures, canvases referenced from the dynamic root, and
canvases on meshes marked dynamic/using dynamic instance matrices are excluded.
The comparison is deliberately lossy: signs and surface detail may be blurry.
It is not a production visual policy and cannot guarantee correctness for a
custom animated canvas on an unmarked static mesh. The normal game is unchanged.

`diagdrawtrace=1` records entry/return around each `renderBufferDirect` call in
the first colour pass, including object/material labels and texture dimensions.
A separate small localStorage checkpoint avoids rewriting the full event journal
for each draw. Recovery merges it only into the matching attempt ID. The trace
adds overhead; a returned submission does not mean the GPU completed it, and
the last entered draw is a location clue, not automatically the root cause.

The next controlled phone link is
`diagnostics.html?test=scene-js-gzip&diagshadows=0&diagatlas=0&diagtexture=256&diagdrawtrace=1`.
In the desktop capped run, 362 canvases were resized with 216,729,600 estimated
RGBA8 bytes avoided among those candidates. The post-batch reachable canvas
estimate fell from 438,247,168 to 226,531,072 bytes; geometry and data-texture
inventories were unchanged. It loaded and entered play; all 705 first-colour
draw submissions returned. The subsequent phone result is recorded below.

The browser harness adds `--texture-cap --draw-trace` to the previous full test.
It checks shared texture aliases, dirty versions, aspect ratio, colour placement,
unchanged UVs, dynamic/shared and data-texture exclusions, materially reduced
canvas storage, first-colour tracing and recovery of a newer draw checkpoint
after reload. Screenshots show the playable scene; inspect close-up text before
considering any similar tradeoff for production.
Both the capped and uncapped no-shadow/no-atlas runs passed in desktop Chromium
with draw tracing enabled. Generated-page/closure checks passed and all 16 live
bakes remained fresh. No production game or bake changes were made.

#### Ground draw isolation (9.14.0)

The phone's 9.13.0 capped run still failed: one attempt stopped at 97%, another
at 100%. Its canvas estimate fell to 226,531,072 bytes as intended, while the
geometry inventory remained 588,769,446 bytes. The last persisted submission
was colour draw 3, `env-ground`, entered with 3,198 vertices/indices and no
return. The normal-depth pass had returned; shadows and atlases were disabled.
This narrows the investigation but does not prove ground is the root cause:
native GPU work is asynchronous and resource pressure can surface later.

The ground's MeshToonMaterial injects class/palette/distance/noise uniforms in
`onBeforeCompile`. The old per-draw inventory only saw its 16x1 gradient map.
The trace now also reads the compiled uniforms stored by the pinned Three r170
renderer, and saves compact entry/return checkpoints for ground texture uploads,
program binding and draw calls as `lastGroundGL`. It records sizes and scalar
arguments, never array contents. The existing scene-wide memory inventory does
not include all injected uniforms and is not a measurement of process/GPU RAM.
A native call returning still does not prove GPU completion.

`diagground=plain` replaces only materials named `env-ground` with a shared
plain grey MeshBasicMaterial before final batching. Geometry, transforms, field
construction, collisions and navigation stay intact; procedural ground shading
and its texture bindings are omitted. This is a diagnostic comparison, not a
production appearance change or a confirmed iPhone fix. Early compilation can
still have processed the original ground shader before this replacement.

The next phone comparison is
`diagnostics.html?test=scene-js-gzip&diagshadows=0&diagatlas=0&diagtexture=256&diagdrawtrace=1&diagground=plain`.
Confirm 9.14.0, press Start test once, and copy the saved report after reopening
if it crashes. A successful run should reach the actual playable scene, not just
100%. The browser harness adds `--plain-ground` to the capped full-scene test,
checks retained geometry/material sharing, compiled-uniform tracing and native
call returns, then enters play and verifies recovery without restarting.

Both original-ground and plain-ground runs passed the full desktop Edge harness
at touch-sized portrait/landscape viewports, including loaded/playing markers
and report recovery. The plain comparison replaced 639 meshes sharing one
material. The original draw trace captured `uCls` at 3920x3780 (14,817,600 bytes)
and `uDist` at 2112x4950 (41,817,600 bytes); all traced native calls returned on
desktop. Playing screenshots were reviewed. Generated-page, closure and all
16 live bake-manifest checks passed. This does not establish iPhone success.

#### Shared road-sign atlas comparison (9.15.0)

The phone's 9.14.0 plain-ground attempt also crashed after reaching 100%.
All 29 baked files and finalization steps completed. Normal-depth returned in
27 ms; the last colour submission was now draw 82, `pt-signpanel`, using the
4096x4096 `pt-sign-atlas`. No return was persisted. This is further through the
submission list, but the plain material changes draw ordering: an absent ground
native-call checkpoint does not prove the ground was already drawn successfully.

`diagatlas=0` disables final scene batching atlases, not the street builder's
own sign atlas. The 256px static cap excluded this atlas because it is shared
with dynamic/knockable signs. Inspection of `streets/furn.js` shows its pixels
are immutable after `makePanels.finish`; night changes material colour, and
knockable signs reuse its normalized atlas UVs. `diagsignatlas=1024` therefore
resizes only maps named `pt-sign-atlas`, including shared dynamic references,
in place before final batching. It preserves geometry, UV layout, texture
filtering and mipmap settings. It makes small sign lettering blurrier and is
an explicit comparison, not a shipping texture policy. One 4096-square RGBA8
base level is 64 MiB; 1024-square is 4 MiB, before mipmaps or upload copies.

Native entry/return tracing now covers every draw in the first colour pass,
not only ground, and recovers `lastColourGL` alongside `lastColourDraw`.
Each new draw clears the previous call so a missing call is not mistaken for
one belonging to that draw. Method replacement failures are reported. These
checkpoints locate synchronous API entry/return; they cannot confirm GPU
completion or diagnose process termination on their own.

Next phone link:
`diagnostics.html?test=scene-js-gzip&diagshadows=0&diagatlas=0&diagtexture=256&diagdrawtrace=1&diagground=plain&diagsignatlas=1024`.
The harness adds `--sign-atlas`; it checks shared static/dynamic atlas aliases,
UV preservation and invalidation, reduced atlas dimensions, native sign draw
completion, and recovery of a native upload checkpoint after reopening.

The capped desktop run resized one atlas, avoiding 62,914,560 estimated RGBA8
bytes and reducing the reachable canvas estimate to 163,616,512 bytes. Its
`pt-signpanel` submission used the 1024-square texture and returned from native
`drawElements` with 45,714 indices. The full scene reached loaded/playing and
recovered its report after reload; the playing screenshot was reviewed.
The original 4096-square comparison also passed with native sign-call tracing;
its canvas estimate stayed at 226,531,072 bytes. Generated-page/closure checks
passed and all 16 live bakes remained fresh. Neither desktop run establishes
that the iPhone crash is fixed.

#### Canvas-source upload isolation (9.16.0)

The 9.15.0 phone run still failed after 100%, but the last colour draw moved to
166, `rail-strela-decal` / `rail-decal-strela`. The native checkpoint now records
`texSubImage2D` entered, without a return, for a 512x96 RGBA/UNSIGNED_BYTE canvas
source (196,608 base pixel bytes). The sign cap was applied and the reachable
canvas estimate was 163,616,512 bytes. Geometry stayed about 589 MB; that is not
total process memory, and cumulative decoded bytes are not a resident heap
measurement. All asset replies and finalization steps had completed. A small
texture failing later after reducing a large one supports investigating total
resource pressure and the canvas upload path; it does not establish a defective
train decal, a specific browser bug, or a measured iOS memory limit.

`diagcanvasupload=pixels` wraps this diagnostic renderer's `texImage2D` and
`texSubImage2D` after module construction, before the warm-up frame. For 2D
HTMLCanvasElement sources only, it reads fresh `ImageData` and passes that to
the same native overload. WebGL accepts both source types (see the
[Khronos WebGL 2 reference](https://www.khronos.org/files/webgl20-reference-guide.pdf)).
Dimensions, pixel-store flags, offsets, filtering, mipmaps, texture objects and
geometry remain unchanged. Typed-array/DataTexture and other source types pass
through. Original canvases stay intact and every update reads their current
pixels, so animated painters are not frozen. This adds CPU work and transient
pixel copies; it is not a claim of lower overall memory usage. Read failures are
recorded and propagated, not silently replaced with the original upload path.

The compact recoverable `canvasUpload` checkpoint separates `read:entered`,
`upload:entered` and `upload:returned`, records dimensions and cumulative bytes
read (not resident bytes), and stores no pixel payloads. Native call metadata
now identifies the source type and byte length. The checkpoint can be recovered
even if no colour draw was recorded yet. Existing first-colour call tracing
still records whether the native function returned; GPU completion remains
asynchronous.

Phone comparison:
`diagnostics.html?test=scene-js-gzip&diagshadows=0&diagatlas=0&diagtexture=256&diagdrawtrace=1&diagground=plain&diagsignatlas=1024&diagcanvasupload=pixels`.
The harness adds `--canvas-pixels`. Eight real WebGL tests compare native canvas
and ImageData uploads with flip-Y/premultiplication both on/off and both full
and offset subimage uploads. It also checks live repainting, ImageData
pass-through and recovered upload phases. All passed in desktop Edge. The full
scene reached loaded/playing with 176 converted uploads and 27,294,720 cumulative
pixel bytes read; geometry and canvas inventory matched the previous comparison.
The playing screenshot was reviewed. Actual iPhone success remains unverified.
The original canvas-source full-scene comparison also passed with the new
recorder. Generated-page and closure checks passed; all 16 live bakes stayed
fresh. The ordinary game entry and its bake products are unchanged.

#### Geometry working set and pre-draw calls (9.17.0)

The phone's 9.16.0 ImageData attempt still failed. The 1024-square atlas read and
native upload both returned (`canvasUpload` 3, 4,390,912 cumulative bytes read).
The last colour submission was 83, an instanced `pt-kp-signal-face1_0.8x0.8|0,0`
using that shared sign atlas. `lastColourGL` was null: none of the then-wrapped
native calls had been entered for this submission. This does not establish a
bad sign or an instancing defect. Shader/program queries and attribute setup
were gaps in the earlier trace, and previous GPU submissions are asynchronous.

The trace now covers shader/program logs, status and uniform/attribute queries,
compilation/linking, vertex-array/buffer setup, and both the first normal-depth
and colour passes. `lastDraw` and `lastDrawGL` identify the pass; the previous
colour-specific fields are retained. It also records geometry buffer bytes
after the first depth pass. These diagnostics add synchronous storage overhead
and are not performance benchmarks.

The bounded geometry inventory assigns each unique backing ArrayBuffer to its
first encountered mesh name (or parent name for unnamed meshes). This is an
attribution aid, not exclusive ownership or total process memory. In the
desktop baseline, far-super copies accounted for 53,694,006 bytes and ground
super-cell copies for 10,796,598 bytes. Far-proxy source meshes used another
108,941,046 bytes and remain present in the following comparison.

`diaggeometry=lean` explicitly sets existing runtime switches `supercells=0`
and `nd=0` before importing main. The first avoids extra merged distant copies,
retaining member meshes. The second draws source meshes in the normal-depth
pass instead of building lazy outline proxies; outlines remain enabled. It
also avoids the lazy-proxy source-buffer holds that defer upload-time CPU
release. Draw calls can increase and distant triangle detail can differ from
the simplified super-cell version. This is a loading-memory comparison, not a
validated mobile quality/performance policy; no new geometry algorithm is
introduced and ordinary game defaults are unchanged.

Phone link:
`diagnostics.html?test=scene-js-gzip&diagshadows=0&diagatlas=0&diagtexture=256&diagdrawtrace=1&diagground=plain&diagsignatlas=1024&diagcanvasupload=pixels&diaggeometry=lean`.
The harness adds `--lean-geometry`, verifies that the switches are applied,
super-cells are absent, far member meshes remain, initial geometry storage is
lower, the full scene reaches play, and the controls/report survive reopening.
The first desktop comparison reduced initial reachable geometry bytes from
588,769,030 to 519,295,036 and reached loaded/playing.
With the expanded trace, the lean run also reached play and retained 519,295,036
geometry bytes after depth rendering. The original configuration reached play
with 602,978,092 bytes immediately before depth and 594,654,862 after it: lazy
outline construction occurs after the initial compile-time inventory. Therefore
initial versus post-depth bytes alone cannot measure upload-time release. The
observed working-set difference at colour entry was about 75 MB. Both playing
screenshots were reviewed; no iPhone success is claimed. Recovery tests include
a depth-pass shader-query checkpoint with no preceding colour draw.

#### v9.18: staged immutable geometry uploads

The v9.17 phone report still died in the first colour pass, this time at
`bindBuffer` on a small `city-roofs` mesh. Its 64x64 canvas upload had returned.
The lean configuration took effect (519,295,452 retained geometry bytes), but
did not fix the crash. The changing last draw/native operation does not identify
a single defective texture, mesh or shader, nor prove an out-of-memory kill.

`diaguploader=staged` adds a comparison that uploads immutable geometry before
final compilation and the first full scene render. The control also enables
`diaggeometry=lean`, `nd=0` and `supercells=0`: lazy outline builders must not read
arrays after their upload callbacks release them. Only static, non-interleaved,
non-morph geometry with existing upload callbacks is queued. It uses the same
Three r170 geometry/attribute cache, a texture-free material, a 1x1 target and
zero draw count. Attributes and indices upload without drawing triangles;
existing callbacks release CPU arrays. Geometry, materials, LOD registrations,
dynamic buffers and source textures remain owned by the real scene.

Each batch ends after 4 MiB or 64 geometries (one larger geometry is indivisible),
drains GPU work with a one-pixel readback, and yields to the event loop. The report
keeps batch progress and `geometryUpload` totals, including unique backing-buffer
bytes before and after. These are reachable CPU geometry bytes, not process RAM
or GPU memory. GPU allocations occur earlier; this does not reduce their final
size or guarantee garbage collection. Preparation renders do not consume the
first depth/colour trace slots. Renderer state and draw ranges restore on success
or failure, and preparation never disposes scene-owned geometry.

Desktop touch-mode verification uploaded 1,873 geometries in 53 batches, releasing
370,178,710 CPU bytes before the first frame: 519,295,036 -> 149,116,326 bytes.
The complete Palace scene reached loaded/playing, with the playing screenshot
reviewed. Focused real-WebGL tests compare pixels after CPU release, ensure no
second vertex/index upload on the real render, cover shared geometry and dynamic
exclusion, and check state restoration after an injected failure. Full draw tracing
also passed. A second full run on v9.18 with draw tracing disabled reached play
with the same 149,116,326 pre-depth bytes; its screenshot was reviewed. Phone
success remains unverified. The next phone comparison can omit
`diagdrawtrace=1` to avoid thousands of synchronous storage writes; batch and
render-pass checkpoints remain available without that extra instrumentation.

#### v9.19: smaller immutable geometry buffers

The v9.18 phone attempt died during preparation, before the first full frame:
1,399/1,873 geometries and 239,892,953 submitted bytes, after batch 38. Staging did
not solve the failure. Its zero `afterBytes`/`releasedBytes` fields were placeholders
until completion, not evidence that callbacks freed nothing. These values are now
measured at every batch boundary. The submitted-byte count is not a demonstrated
device memory limit, and a saved checkpoint cannot identify the termination cause.

`diagpack=1` enables an explicitly lossy, diagnostic-only packing comparison before
the final compile/upload. It also enables the lean geometry configuration. It
retains the full scene, physics, triangle/draw order and LOD registrations, and
does not change production pages or bakes. Eligibility is limited to immutable
geometry with existing release callbacks and standard basic/toon materials; custom
shaders, morphs, instanced/skinned objects, child-bearing meshes and dynamic buffers
are excluded. Geometry shared with an excluded object is excluded as a whole.

First, an exact hash-and-compare pass merges vertices only when every attribute's
raw components match. UV seams, hard normals, colours and paint stay distinct.
Index order, groups and draw ranges remain equivalent. Temporary typed hash tables
are per geometry, with a one-million-vertex cap, and the pass yields periodically.
Then eligible positions become normalized unsigned 16-bit values with a uniform
decode transform in the mesh matrix. The world-position error bound is at most
2 cm, including parent scaling/shear; thin paving/decal geometry and meshes with
non-decomposable local matrices keep float positions. Conservative bounds transform
with the geometry. Normals/colours use normalized 8-bit components, and UVs use
normalized 16-bit values only when all coordinates lie in [0,1]. HDR colours and
repeating UVs retain their existing representation. All upload callbacks survive.

Desktop measurement: retained geometry before uploads fell from 519,295,036 to
366,874,325 bytes. Preparation submitted 217,757,999 bytes instead of 370,178,710
(about 41% less). The combined saving was 152,420,711 bytes; exact welding accounted
for 69,663,769 bytes before subsequent packing. The measured conservative world
position-error bound was 0.01828 m. The full scene reached play. Focused tests cover
exact expanded vertex streams and UV seams after welding, transformed/shared
meshes, bounds, excluded geometry, repeated UVs and upload callback preservation.
The final v9.19 desktop run also checked the station and Palace Square views;
both rendered without obvious visual regressions or browser errors. Closure and
bake-manifest checks passed, with all 16 baked areas fresh.
Phone success is still unverified; this is a controlled comparison, not a claimed
fix or a universal mobile memory budget.

The report records module progress, environment milestones, pending fetches and
worker asset replies, decoder failures, errors, heartbeat gaps, graphics context
loss and whether the first-frame/loaded marker was reached. Fetch completion
means response headers arrived, not that its body was decoded. Worker completion
records the reply after decoding. The event journal is bounded to 140 entries;
it saves at progress changes and once per second. It does not retain scene
objects or decoded buffers. Reports stay in localStorage until copied/downloaded
or site data is cleared; nothing is uploaded automatically. Request labels omit
query strings, but review device notes and error text before sharing.

A killed process cannot log its own termination. The last persisted phase is
evidence of where execution stopped, not proof of the cause. Storage can be
unavailable or lost, and Safari does not expose the Chromium heap measurements.
The recorder reports storage failures and still allows an in-memory export.
Logging adds some overhead, so diagnostic timings are not benchmark results.
Area transitions navigate to the ordinary game pages and end this recording.

### Test from a phone on the local network, without pushing

On the development computer, run:

```sh
node tools/serve.mjs 5183
```

Find the computer's physical Ethernet/Wi-Fi IPv4 address (`ipconfig` on Windows).
Connect the phone to the same router and open
`http://<computer-ip>:5183/diagnostics.html`. The computer may use Ethernet while
the phone uses Wi-Fi. Keep the server running. If the page cannot be reached,
check guest-network client isolation and the local firewall's Node/private-network
access; mobile data alone cannot reach this private address. HTTP clipboard access
may be unavailable, in which case the copy action selects report text instead.
The normal game is at `http://<computer-ip>:5183/`. Local serving still uses the
page's external CDN imports and differs from GitHub Pages in transport and the
development revision endpoint, so compare failures by recorded phase.

### Maintenance and verification

`node tools/gen-loading-diagnostics.mjs` derives the support page from `index.html`;
its `--check` runs in Pages CI. The normal landing page and scene modules do not
import the recorder. It is explicitly classified as standalone in closure rules;
all 16 existing area bakes remain fresh. The Pages root-page copy includes the
support page and the existing source copy includes its recorder.

```sh
node tools/loading-diagnostics-test.mjs
node tools/loading-diagnostics-test.mjs --full
```

The browser tests cover recovery without auto-start, report history, bounded
events, unchanged fetch/worker transfer behavior, copy fallback, unavailable
storage, import failure and context loss. The full test also loads the real
Palace scene and enters play. Both passed on desktop Chromium with touch-sized
viewports; screenshots were reviewed. This does not validate an actual iPhone
or establish a fix for its crash. Screenshots/reports are written to a unique
OS temporary directory printed by the test.
