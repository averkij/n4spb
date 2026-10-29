# n4spb · Need for Saint Petersburg — Невский проспект

*Пешеходная аниме-сцена с cel-shading: от Московского вокзала по Невскому проспекту до Адмиралтейства, Дворцовой площади и Эрмитажа, с метро, машинами, людьми, поездами, корабликами и управляемой машиной.*

A walkable, first-person **anime cel-shaded** 3D strip of **Saint Petersburg** (Russia), built with plain [three.js](https://threejs.org/): no build step, no external 3D assets, everything is generated in code.
You start on **Vosstaniya Square** (the Hero City obelisk) in front of the **Moscow Railway Station** (Konstantin Thon, 1851), walk into its hall and out onto the platforms, walk (or drive a red sports car)
along **Nevsky Prospekt** over the **Fontanka** and the **Anichkov Bridge**, past **Gostiny Dvor** and **Kazan Cathedral**, all the way to the **Admiralty**, **Palace Square**, the **Hermitage**, **St Isaac's Cathedral** and the **Bronze Horseman**,
and go **down into the metro**: seven real stations with escalators up to 116 m long, halls 51-86 m deep and trains you can ride.
The streets are made of **real OpenStreetMap footprints**, on a July afternoon with about a thousand pedestrians, hundreds of moving cars, buses and trolleybuses, timetabled trains, tourist boats and birds,
and a golden evening, a white night and an overcast day (key **T**).
The driven car **knocks over and throws the street furniture** by weight (`src/core/knock.js`): benches, litter bins, flower pots and urns slide and tumble, lamp posts, traffic-signal and sign poles, bollards and cabinets hold below a break speed and then topple, and what lies on the ground can be driven over.

This is a cut-down copy of the whole-city project `102_3d_piter`: **one strip of 5.0 km2** (3.7 x 2.4 km bounding box), kept small so that it can be deployed as a static site and load fast.
What the strip is, what was dropped and why, how to rebuild and deploy it: [`docs/STRIP.md`](docs/STRIP.md).

## Gallery

Screenshots of the shipping scene (Medium, a July afternoon unless the caption says otherwise), made with `tools/shot.mjs` from the real baked page; the cameras are authored view poses and a few free cameras (the place teleport keys are off in the scene).

### Sights

| | |
|---|---|
| ![Moscow Railway Station (Thon, 1851) with its clock tower, seen from Vosstaniya Square](docs/screenshots/station.jpg)<br>**Moscow Railway Station** (Thon, 1851) with its clock tower, seen from Vosstaniya Square | ![The Hero City obelisk and Hotel Oktyabrskaya](docs/screenshots/obelisk.jpg)<br>The **Hero City obelisk** and Hotel Oktyabrskaya |
| ![The Anichkov Bridge over the Fontanka with Klodt's horse tamers and the traffic lights](docs/screenshots/anichkov-bridge.jpg)<br>The **Anichkov Bridge** over the Fontanka with Klodt's horse tamers and the traffic lights | ![Gostiny Dvor on Nevsky Prospekt, behind the black chain bollards](docs/screenshots/gostiny-dvor.jpg)<br>**Gostiny Dvor** on Nevsky Prospekt, behind the black chain bollards |
| ![Kazan Cathedral with its colonnade, seen from the Kazan Square garden](docs/screenshots/kazan-cathedral.jpg)<br>**Kazan Cathedral** with its colonnade, seen from the Kazan Square garden | ![The Church of the Saviour on Spilled Blood on the Griboedov Canal](docs/screenshots/saviour-on-blood.jpg)<br>The **Church of the Saviour on Spilled Blood** on the Griboedov Canal |
| ![The Winter Palace from the Palace Embankment, a turquoise bus in front](docs/screenshots/winter-palace.jpg)<br>The **Winter Palace** from the Palace Embankment, a turquoise bus in front | ![Palace Square and the Alexander Column in the golden evening (key T)](docs/screenshots/palace-square-golden.jpg)<br>**Palace Square** and the Alexander Column in the golden evening (key **T**) |
| ![St Isaac's Cathedral across its square](docs/screenshots/st-isaac.jpg)<br>**St Isaac's Cathedral** across its square | ![The Bronze Horseman on Senate Square](docs/screenshots/bronze-horseman.jpg)<br>The **Bronze Horseman** on Senate Square |
| ![The Mayakovskaya metro hall, 51 m underground (one of seven real stations)](docs/screenshots/metro-mayakovskaya.jpg)<br>The **Mayakovskaya** metro hall, 51 m underground (one of seven real stations) | ![The 1st Engineer Bridge at the Moika source: flat arch with medallions, trophy posts, lamp standards](docs/screenshots/engineer-bridge.jpg)<br>The **1st Engineer Bridge** at the Moika source: flat arch with medallions, trophy posts, lamp standards |
| ![The Fontanka mouth from above: the Summer Garden, the Panteleymonovsky and 1st Engineer bridges](docs/screenshots/summer-garden.jpg)<br>The **Fontanka mouth** from above: the Summer Garden, the Panteleymonovsky and 1st Engineer bridges | ![The Chizhik-Pyzhik, the little bronze siskin, on its granite ledge of the Fontanka wall (an Easter egg: look down from the quay by the 1st Engineer Bridge, E gives its story)](docs/screenshots/chizhik.jpg)<br>The **Chizhik-Pyzhik**, the little bronze siskin, on its granite ledge of the Fontanka wall (an Easter egg: look down from the quay by the 1st Engineer Bridge, **E** gives its story) |

### Cars

Four garage cars wait on the Moscow station forecourt (press **E** next to one). Each has its own model, engine voice, handling, cockpit and damage; all of them break and throw the street furniture by weight.

| | |
|---|---|
| ![The red sports car at the Moscow station's taxi rank](docs/screenshots/car-coupe.jpg)<br>The **red sports car** at the Moscow station's taxi rank | ![The white Tesla Roadster (2026): thrusters on Shift, hops on X and C](docs/screenshots/car-roadster.jpg)<br>The white **Tesla Roadster** (2026): thrusters on **Shift**, hops on **X** and **C** |
| ![The taxi pickup (heavier, a bit slower, roof sign "ТАКСИ")](docs/screenshots/car-taxi-pickup.jpg)<br>The **taxi pickup** (heavier, a bit slower, roof sign "ТАКСИ") | ![The eggplant Zhiguli (VAZ-2106): lighter and loose](docs/screenshots/car-zhiguli.jpg)<br>The eggplant **Zhiguli** (VAZ-2106): lighter and loose |
| ![Driving the Roadster with the chase camera: the four thruster nozzles at the back](docs/screenshots/drive-roadster.jpg)<br>Driving the Roadster with the chase camera: the four thruster nozzles at the back | ![The Roadster's barrel hop (C): a roll with side thruster streams](docs/screenshots/drive-roadster-barrel-hop.jpg)<br>The Roadster's **barrel hop** (**C**): a roll with side thruster streams |
| ![Drifting the sports car round the corner with the handbrake](docs/screenshots/drive-coupe-drift.jpg)<br>Drifting the sports car round the corner with the handbrake | ![The taxi pickup at a red light (the countdown box shows the seconds left)](docs/screenshots/drive-taxi-pickup.jpg)<br>The taxi pickup at a red light (the countdown box shows the seconds left) |


The strip, west to east (x east, z south in metres; start at about x 560, z 192):

| Part | What you can walk to |
|---|---|
| Station end | Moscow Railway Station (hall, ticket hall with the bust of Peter I, platforms with trains), Vosstaniya Square and the obelisk, Hotel Oktyabrskaya, the Galereya mall, the rail yard, the Oktyabrsky concert hall, Ligovsky Prospekt |
| Nevsky east | Nevsky Atrium and the Mayakovskaya metro portal, Vladimirsky Cathedral, the National Library, Anichkov Bridge with Klodt's horse tamers, Anichkov Palace, Belinsky Bridge and the Circus |
| Nevsky centre | Gostiny Dvor, the Catherine Garden and the Alexandrinsky Theatre, Singer House, Kazan Cathedral, the Griboedov Canal with the Church of the Saviour on Blood, the Russian Museum, the Mikhailovsky Castle and Garden |
| The Fontanka mouth | The Summer Garden (south half) with the Swan Canal, the Moika source with the **1st Engineer Bridge**, the **Panteleymonovsky Bridge**, the **Chizhik-Pyzhik** on its ledge of the Fontanka wall |
| The west | Palace Square with the General Staff arch and the Alexander Column, the Winter Palace and the Hermitage, the Admiralty and Alexander Garden, St Isaac's Cathedral, Senate Square with the Bronze Horseman, the Palace Bridge |

## Start it

You need **Node.js 18+** (the bundled server uses only the standard library) and a current desktop browser with WebGL 2 (Chrome, Edge, Firefox) on a decent GPU.
An internet connection is needed for three.js (jsDelivr) and the fonts (Google Fonts). `npm install` (or `npm ci`) is **only** needed for the developer tools (three for the headless checks, puppeteer-core for screenshots, bake and tests).

```bash
node tools/serve.mjs        # or:  npm start        (port 5176)
```

Open <http://localhost:5176> and press **«В Питер»** (or Enter). Any static file server works too (ES modules need HTTP, not `file://`): see [`docs/STRIP.md`](docs/STRIP.md) section 7 for the deployment whitelist and the static-host requirements.
Note that the page loads fast only while the shipping bake in `assets/baked/` matches the source: after an edit that reaches the closure of an area (every area has its own bake revision, docs/BAKE-REVISIONS.md) that area has to be rebuilt (`node tools/bake-scene.mjs --plan` shows which, `npm run bake` rebakes the stale ones, then `npm run bakecheck`), otherwise the page builds everything procedurally and takes minutes.

### Controls

| Key | Action |
|---|---|
| Mouse | Look (click the canvas to lock the pointer) |
| W A S D / arrows | Walk |
| Shift | Run |
| Space | Jump |
| F | Take off / land. While flying **W / S fly along the view**, A / D strafe, Space or E up, Q or C down, Shift boost. Roofs are walkable: fly over a building, press F and you land on its roof |
| E | Use: enter the metro, board / leave a train, switch an escalator, get into the car ("[E] ..." prompts) |
| E at a parked car | **Drive**: four cars wait on the station forecourt, each with its own handling, engine voice and cockpit: the red sports car (beside the Moscow station's taxi rank), the taxi pickup, the eggplant Zhiguli and the white **Tesla Roadster** (2026; its **Shift** is a THRUST from four cold-gas nozzles, **X** is a gas hop over kerbs, benches and bins (1.9 m high), **C** is the barrel hop, twice as high (3.7 m) with a 360 degree roll and side jets; both start the instant the key goes down); E at the nearest one gets in, every car carries the Bibliotechka roof logo. In the car: **W / S** gas / brake + reverse, **A / D** steer, **Shift** nitro, **Space** handbrake (drift), **G** horn, **V** camera (chase / high / cockpit), mouse looks around, **E** gets out (below 25 km/h); R teleports the car to the start |
| Street map (bottom left) | A round heading-up map that labels the named streets and a pill above it that names the street you are on (hidden underground and in the metro, **H** hides it with the rest of the UI) |
| T | Time of day: 15:20 **day** → 19:10 **golden evening** → 00:20 **white night** (never black, lit windows and lamps) → 11:20 **overcast** ("Petersburg milk") |
| L | Copy the current pose `x,y,z,yaw,pitch` to the clipboard (paste it into `?cam=` or `tools/shot.mjs --cams`) |
| H | Hide the UI |
| M | Mute |
| R | Reset to the start view (while driving: teleports the car there) |

Touch (phones and tablets): see **Mobile** below. Quality (Medium / Performance) is in the top-right corner on desktop and in the menu on touch devices (remembered; phones start on Performance).
The player cannot leave the strip: the border is an invisible wall (the scenery goes on for 120 m beyond it and then fades into the city beyond the data).

URL parameters: `?tod=day|golden|night|overcast` (or a number 0..4), `?look=overcast|cloudy` (weather overlay), `?q=performance|medium` (performance is the default), `?t=40` (start time, s), `?cam=x,z,yaw,pitch` (yaw 0 = north, 90 = west; 5 numbers = free camera `x,y,z,yaw,pitch`),
`?only=environment,streets,city` (build only some modules), `?allcity` (ignore landmark claims: plain prisms), `?noroof`, `?stats`, `?people=off`, `?tr=nomove`, `?wl=nobirds`, `?pdens=1.3` (crowd density), `?baked=0` (procedural build, no baked assets).
Debug hooks: `window.__ctx`, `window.__setCam`, `window.__sim(t)`, `window.__bench(n)`, `window.__knock` (`hit(x, z, kmh, dx, dz, kind)` knocks the nearest standing thing; `stats`, `list`; `tools/shot.mjs --pre` steps it before a shot).

## Mobile

The page runs on phones and tablets with an on-screen control layer (`src/core/touch.js`, design and the real-device checklist in [`docs/MOBILE.md`](docs/MOBILE.md)). It switches on for a coarse pointer (or `?touch=1`; `?touch=0` forces it off); the desktop page does not change. **Landscape is the intended orientation** (a portrait phone gets a "rotate your phone" hint).

| Where | Control |
|---|---|
| Walking: left thumb | floating stick (push all the way to run) |
| Walking: right thumb | drag to look |
| Walking: bottom right | **JUMP**, **RUN** (latch), **FLY** (take off / land; while flying: **UP**, **DOWN**, **BOOST**), and a **USE** button that appears when something is in reach (a car, a metro door, a train) with its label |
| Top right | **MENU** (time of day, sound, hide UI, respawn, FPS, fullscreen, quality, settings) and **SOUND** |
| Driving: left thumb | steering: a floating wheel (swipe left / right, proportional), or arrows, or tilt the phone |
| Driving: right thumb | **GAS**, **BRAKE** (reverse at a standstill), **NITRO**, **DRIFT** (handbrake), **HOP** and **FLIP** (cars that can hop: HOP is the simple hop, FLIP the high barrel hop; each fires on the press) |
| Driving: top | **CAM** (camera), **HORN**, **AUTO** (auto-gas), **FIX** (repair), **EXIT** (below 25 km/h); a drag on the free screen orbits the camera |

Settings (menu -> Controls, saved on the device): look and steering sensitivity, invert Y, steering scheme (wheel / arrows / tilt), speed steering assist, tilt range, auto-gas, left-handed layout, haptics (Android only), button size, run by default.
On a phone the first visit shows a heavy-scene warning (about 51 MB to download and about 1 GB of memory), the quality starts on **Performance** (shadow map 1024, MSAA 2, pixel ratio 1), and the page tries fullscreen, a landscape lock (Android) and the screen wake lock when you press the start button.

* **iPhone / iPad**: Safari needs iOS 16.4 or newer. An iPhone has no element fullscreen: use Share -> Add to Home Screen (the page ships a web-app manifest) to get a fullscreen app; it cannot lock the orientation and has no vibration. iPads can go fullscreen from the menu.
* **Android**: Chrome. Fullscreen + the landscape lock work from the start button; vibration on impacts and the nitro.
* **Known limits**: the scene is heavy (the load decodes about 350 MB of baked data; the measured JS heap is about 1.2 GB on desktop). Low-RAM phones may run out of memory and reload: the page then explains it and offers the lighter tier, but the safe bets are a recent phone or a tablet.
  Not yet tested on real devices (the tilt direction on iOS in particular): see the checklist in `docs/MOBILE.md`. Tests: `npm run touch` (pure node) and `npm run touchbrowser` (Edge, emulated multi-touch).

## What is built

The world is the build list `MODULES` in `src/main.js` (each module is `src/world/<module>.js` + `<module>/`; the header of each file has a status block). `node tools/smoke.mjs` prints the live numbers.

| Module | What it builds |
|---|---|
| `environment` | Tessellated ground with a painterly shader, the Fontanka, the Moika, the Griboedov Canal and the Neva in granite trenches (quay walls, railings, mooring rings, stairs, colliders), flowerbeds, hedges, trees, gardens, the far skyline and the city beyond the data |
| `streets` | The road network of the strip: markings, zebra crossings, granite kerbs and slab pavements, chain bollards, flower-bowl lamps, traffic signals with countdowns, street-name plates, bus stops, trolleybus overhead wires on facade rosettes, tram rails, a lane graph with signal plans and parking slots |
| `city` | Every OSM building no landmark claims: 14 facade archetypes in one wall shader (shopfronts, arches, belt courses, friezes), carriage arches, cornices, roofs with mansards, dormers and chimneys, balconies, bay windows, corner turrets, shop signs, awnings, address plates |
| `rail` | The Moscow Station track field: tracks, high platforms with white Y-column canopies, catenary, buffer stops, signals, the yard and timetabled trains (Sapsan, Lastochka, Krasnaya Strela, double-deck and RZD sets) that arrive, stand with open doors and depart |
| `landmarksA` | **Moscow Railway Station** (facade, clock tower with live hands, ticket hall with the bronze bust of Peter I, concourse), **Vosstaniya Square** with the obelisk, **Hotel Oktyabrskaya**, the **Galereya mall** |
| `landmarksB` | Nevsky landmarks: **Nevsky Atrium** with the Mayakovskaya portal, the Yusupova house, the "San Remo" corner, Dom Kozhevnikova, Dom zhurnalista, Nevsky Centre |
| `landmarksC` | The **Anichkov Bridge** with the four **Klodt horse-tamer groups**, the Beloselsky-Belozersky Palace, **tourist boats** cruising the river through the arches, landing stages |
| `landmarksD` | Vladimirsky Cathedral + bell tower, the National Library, the Mariinsky hospital block, the Tolstoy House, Vladimirsky Passage, the Dostoevsky statue |
| `landmarksE` | The Ostrovsky ensemble: Gostiny Dvor (arcade, portico, corner pavilions), the Catherine Garden, the Alexandrinsky Theatre with the Apollo quadriga, the National Library corner, the Anichkov Palace garden front, the houses of Ostrovsky Square |
| `landmarksF` | **Kazan Cathedral** with its colonnade and walkable interior, the Kazan Square garden with the Kutuzov and Barclay de Tolly monuments, the Voronikhin garden, **Singer House** |
| `landmarksG` | **Palace Square**: the General Staff Building with the Triumphal Arch and the Chariot of Glory, the Guards Corps Headquarters, the Alexander Column, the stone-field paving |
| `landmarksH` | The **Admiralty** with its gilded spire, the Alexander Garden, **Senate Square** with the **Bronze Horseman**, the Senate and Synod buildings |
| `landmarksI` | The **Winter Palace** and the **Hermitage** (Small, Old and New Hermitage, the atlantes portico, the Hermitage Theatre), the lions of the Palace Pier |
| `landmarksJ` | **St Isaac's Cathedral** and St Isaac's Square |
| `landmarksK` | The **Church of the Saviour on Spilled Blood**, the Mikhailovsky Palace (Russian Museum), the Rossi pavilion, Arts Square with the Pushkin monument |
| `landmarksCastle` | The Engineering (Mikhailovsky) Castle, the Peter I monument, the Three-part bridge |
| `landmarksBelinsky` | The Ciniselli Circus on the Fontanka next to the Belinsky Bridge |
| `landmarksOktyabrsky` | The Bolshoy Concert Hall Oktyabrsky on Greek Square |
| `landmarksNorth` | The Podpisnye Izdaniya bookstore and the Mayakovskogo / Vosstaniya corridor houses |
| `bridges` | The bridges inside the strip (Belinsky, Kazansky, Green, Pevchesky, Red, Blue, Hermitage, Zimny, Bankovsky, Mucny, Italyansky, Pochtamtsky, Fonarny, Palace Bridge, ...) in one family |
| `metro` | **Seven stations with real halls** (see below), signed entrances, escalators, interchange passages, real tunnels, trains you ride in real time, the Petersburg wayfinding signs and a generic hall for the line ends |
| `props` | Benches, bins, urns, flower pots, summer cafe verandas, press kiosks, ice-cream carts, stalls, rental scooters, advertising pillars, street clocks |
| `traffic` | Moving and parked vehicles of 20+ Petersburg archetypes (Lada, crossovers, SUVs, taxis, vans, turquoise buses, trolleybuses with poles on the wires, the red double-decker "City Tour"), a car-following simulation with signals, queues, bus stops and giving way to pedestrians |
| `people` | About a thousand anime pedestrians on pavements, zebras, the squares, the station hall and platforms; they board the real trains, use the metro doors, queue for taxis, photograph the horses and the obelisk, follow tour guides with umbrellas, busk, push prams, ride scooters, walk dogs |
| `wildlife` | Pigeon flocks, sparrows, hooded crows, gulls, swifts at golden hour, mallards with ducklings; calm WebAudio ambience (city bed, lapping water, cafe murmur, metro hum) |
| `drive` | The drivable garage of four cars (`drive/cars/`: red coupe, taxi pickup, Zhiguli, Tesla Roadster; per-car arcade handling, nitro / THRUST, drift, two gas hops for the Roadster (X = a 1.9 m hop, C = a 3.7 m barrel hop with a roll; both start on key down), collisions with the same solids as the walker, speedometer / tacho HUD, engine / tyre / wind sound) |

Engine (`src/core/`): renderer with colour-aware outlines and bloom, toon materials, sky, facade shader, physics with multi-level floors, first-person player, static batcher + outline proxies, canvas textures, WebAudio synth, region streaming of baked products.
The look (four light presets, about 430 colours) is documented in [`docs/LOOK.md`](docs/LOOK.md).

## The metro: a guide

Seven stations have real halls: Ploshchad Vosstaniya, Mayakovskaya, Vladimirskaya, Dostoevskaya, Gostiny Dvor, Nevsky Prospekt and Admiralteyskaya.

* **Where to go down.** *Ploshchad Vosstaniya*: the round 1955 **rotunda** on the Nevsky side of the square (blue «М МЕТРО» signs; doors at (535, 91), exit at (497, 93)); a second entrance, **Vosstaniya-2**, is in the west facade arch of the station wing at (597, 341).
  *Mayakovskaya*: the portal in the **Nevsky Atrium** at Nevsky 71 / Marata (196, 93; exit corridor to Marata at (216, 115)). *Vladimirskaya*: the arch in the chamfered corner of the house at (-187, 532) near Vladimirsky Prospekt.
  *Dostoevskaya*: the arched door in the **Regent / Renaissance Hall** (-277, 452). *Gostiny Dvor*: the ticket hall inside Bolshoy Gostiny Dvor (doors at (-976, -183)). *Nevsky Prospekt*: four stair pits in the pavement of Nevsky (around (-1170, -260)) that lead to an underpass and the escalators,
  and an exit in the house on the Griboedov Canal at (-1352, -339). *Admiralteyskaya*: the "Senator" business centre at (-2029, -412), near Malaya Morskaya. Every entrance has a blue «М» totem and an `[E]` prompt «Вход в метро · Enter the metro»; the doors are open, you can also simply walk in.
* **Escalators.** Lanes: left and middle go **down**, the right one goes **up** (moving steps and moving handrails). Vosstaniya is 116 m long and 58 m deep; Admiralteyskaya is the deepest station of the strip (86 m). You can also walk beside the steps. At the bottom: the hall (pylon, column or closed type), the platform, the trains.
* **Riding.** Trains arrive on both tracks about every 2 minutes. Step through an open door (or press `[E]` at it) and you are on board. **There is no map and nothing to choose**: the train runs to the end of its line in real time (real run times between stations) and **stops at every station** with open doors.
  Orient yourself the way passengers do: read the **line strip above the car doors** (the current stop is marked), the station name on the track walls and the toasts with the announcements («Станция …, следующая станция …»). Get off at any stop with `[E]` («Выйти на платформу») or by walking out through a platform-side door.
* **The line ends.** Each line of the strip continues by one station that is not built (line 1: Chernyshevskaya / Pushkinskaya; line 2: Sennaya Ploshchad / Gorkovskaya; line 3: Vasileostrovskaya / Ploshchad Aleksandra Nevskogo 1; line 4: Spasskaya / Ligovsky Prospekt; line 5: Sportivnaya / Sadovaya).
  The train runs there and stops at the **terminus**: a generic hall that carries the right name, with the doors open and an "exit closed" sign; board the opposite track to ride back.
* **Reading the signs.** Hanging boards: ultramarine = way out to the street, line colour = to the trains (the terminus and the line badge), white with a badge = transfer; cream line schemes on the track walls and pylons show the stations of the line (passed ones grey); network maps hang on pylons and vestibule walls.
* **Transfers on foot.** Change trains by getting off and walking the passage of the interchange, then boarding the next train: Vosstaniya ⇄ Mayakovskaya (via the junction hall, about 209 m), Vladimirskaya ⇄ Dostoevskaya (about 190 m), Gostiny Dvor ⇄ Nevsky Prospekt. Follow the transfer boards.
* **Ways out.** Every built station has a way up to the street: take the **up lane** of the escalator.

More: [`docs/METRO.md`](docs/METRO.md), [`docs/UNDERGROUND.md`](docs/UNDERGROUND.md).

## Architecture and docs map

```
index.html            the page + UI (start card, panels, HUD)
src/main.js           boots the engine, imports the modules in parallel, quality tiers, loop (MODULES = the build list)
src/core/             engine (renderer, materials, sky, physics, player, batching, ndproxy, audio, zones, baked-world loader ...)
src/world/layout.js   THE contract: names, datums, GROUPS (which module owns which OSM building), views, hero, areas, road / building queries
src/world/data/       city.js + city-*.js (the OSM extract clipped to the strip), metro.js (static metro tables), east-water.js (far Neva scenery)
src/world/<module>.js + <module>/   the world modules
assets/baked/         the shipping bake (manifest.json + *.bin.gz); assets/splash/ the loading-screen images
vendor/rapier/        Rapier physics (unmodified ESM bundle)
tools/                dev tools, tests and the bake
docs/                 the guides (below)
```

| Doc | Read it for |
|---|---|
| [`docs/STRIP.md`](docs/STRIP.md) | The strip: the nine rectangles, what was dropped, the clipped data, the metro scheme, the border, rebuild / bake / deploy |
| [`docs/MOBILE.md`](docs/MOBILE.md) | Phones and tablets: the touch layouts, how touch reaches the game, settings, the hardened boot, tests, the real-device checklist |
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | The state of this repository, gotchas, how to resume |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Builder guide: module contract, ctx API, coordinates, performance, verification, z-fighting |
| [`docs/AGENT-BRIEF.md`](docs/AGENT-BRIEF.md), [`docs/PERFORMANCE-CONTRACT.md`](docs/PERFORMANCE-CONTRACT.md) | Ground rules, road integrity rules, user content rules; what a change may cost |
| [`docs/AREA-DEVELOPMENT.md`](docs/AREA-DEVELOPMENT.md) | The fast edit / review loop (`npm run dev:area -- <module>`) |
| [`docs/LOOK.md`](docs/LOOK.md), [`docs/FIGURES.md`](docs/FIGURES.md) | Sky, light presets, palette; the statue kit |
| [`docs/UNDERGROUND.md`](docs/UNDERGROUND.md), [`docs/METRO.md`](docs/METRO.md) | Engine support for levels / escalators / train rides; the metro module |
| [`docs/streets-api.md`](docs/streets-api.md), [`docs/city-api.md`](docs/city-api.md), [`docs/rules/`](docs/rules) | Service contracts of streets and city; marking, sign, label and facade rules |
| [`docs/DRIVING-COLLISIONS.md`](docs/DRIVING-COLLISIONS.md), [`docs/BELINSKY.md`](docs/BELINSKY.md) | The drivable car; the Belinsky Bridge and the Circus |
| [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md), [`docs/LOADING.md`](docs/LOADING.md) | What costs what, how to measure, the baked loading (numbers are for the whole city before the cut) |

### Developer tools

`npm install` first. `npm run check` (headless build of every kept module with its triangle budget), `node tools/layout-test.mjs` (`npm run layout`), `node tools/smoke.mjs` (walk, fly, land on a roof, fps; ends with `RESULT: OK`),
`node tools/physics-test.mjs`, `node tools/metro-test.mjs` (walks in through every door, rides in real time, climbs out), `node tools/drive-test.mjs`, `node tools/people-test.mjs`, `node tools/traffic-test.mjs`, `node tools/wildlife-test.mjs`, `node tools/audio-test.mjs`,
the audits `npm run roads | markings | walls | labels | facade | wires | paving`, `node tools/shot.mjs --cams "hero;x,z,yaw,pitch;x,y,z,yaw,pitch" --out shots/a` (headless GPU screenshots), `node tools/zfight.mjs` (z-fighting finder),
`node tools/tour.mjs` (scripted screenshots; `--set splash` rewrites the loading-screen images), `npm run bake` / `npm run bakecheck` / `npm run bakedcheck` (the shipping bake and its gates, see STRIP.md).
The headless tools drive Edge or Chrome through `puppeteer-core` (paths for Windows are listed at the top of each tool).

## User content rules

* **No flags** anywhere in the scene (no national / city / company flags, pennants, flagpoles, flag banners, tour-guide flags — guides carry a plain coloured umbrella instead).
* **No alarm sounds**: no sirens, car alarms, train horns, crossing bells or harsh warning beeps; police and ambulances are silent and carry no beacons. Ordinary short **car horns are fine** (key **G** in the car, taxis in traffic).
* Real Russian names; no corporate logos (generic wordmarks and pictograms; the car's logo is the project's own).

## Known limits

* **Seven metro stations have real halls**; the line ends are one generic hall each (re-labelled while the train is in the tunnel) with no way out. Line 6 and the other stations of the city are not part of the strip. Rides run in real time; you cannot walk from car to car.
* The strip is 5.0 km2: beyond its border there is only scenery. Buildings that the whole-city project drew as separate landmarks outside the strip (and in the 120 m margin) are ordinary generic buildings here.
* Ordinary houses have flat sheet-iron roofs (no pitched roofs) and few interiors (the station hall, Kassovy zal, Kazan Cathedral, the Galereya mall, metro vestibules, shopfronts with painted interiors). Architectural ornament is stylised and photo-derived; this is not a survey-accurate digital twin.
* Startup is heavy when the baked assets do not match the source (see above). Medium / Low in the corner help on weaker machines.

## Credits

Engine and look: **Sakuragaoka Station** (MIT, licence text in [`LICENSE-sakuragaoka-station.txt`](LICENSE-sakuragaoka-station.txt)); map data: **OpenStreetMap** contributors (ODbL); physics: **Rapier** (Apache-2.0); fonts: Rubik, Noto Sans / Serif, Caveat, Golos Text, Oranienbaum (Google Fonts, OFL).
Reference photographs from Wikimedia Commons were used for research only and are not included. This repository is licensed under Apache-2.0 ([`LICENSE`](LICENSE)); see [`NOTICE.md`](NOTICE.md) for all third-party notices.
