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
