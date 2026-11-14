# Start menu and shared views

The normal root / `index.html` entry shows the city menu. It imports no Three.js,
scene modules or bake products. `?play=1` starts the central scene; another area's
page remains a direct scene entry. Existing `cam`, `ho`, `shot`, bake and diagnostic
parameters bypass the menu. `q` and `touch` alone do not bypass it.

The right-hand schematic map derives from `maps/intro-draft.html`. Grey areas
are unavailable and cannot be selected. Black areas are live registry entries;
purple is the selection. The map sits directly over the artwork: the gulf and
rivers reveal the background, without a card or opaque water layer. Framing is
fixed; there are no pan, zoom or reset controls. Click a district, focus it and
press Enter/Space, or use the previous/next arrows below the map.

The visible menu contains only the Saint City title, Start button, selected district,
sound icon and version. Error/loading messages appear only when needed. Oswald
and Manrope are served locally, with their OFL licenses in `assets/menu/fonts/`.
The condensed ivory title uses pink/lilac accents. Start is a simple black button
with white lettering (14.1.3 owner refinement).
Hover and keyboard focus softly lighten a district's fill without changing its
border. The Start label is centered; there is no decorative rule, arrow, skew or shadow.
District arrows occupy fixed columns, independent of the name's width; portrait
also reserves the name row's height so wrapping cannot move either arrow.
Fine horizontal scanlines sit above the background artwork and below all menu
controls and map geometry. They are CSS, not baked into the images.

Portrait screens use one centered column: the single-line title, the playable
city, the selected district and the Start button. The map has a fixed portrait
frame around the live districts, with subdued surrounding areas. The controls
fit the viewport with safe-area spacing; landscape keeps the split composition.
The Saint City branding and responsive menu layout belong to the root start
menu. From 14.1.4, scene preloaders share the menu's clean district labels and
show only that label above their image, without a kicker or city-name prefix.

`menu-variants.html` is a local review page with six original painted backgrounds,
desktop and phone previews of the actual menu, an image-only view and a scanline
toggle. It modifies only its embedded preview: the main game retains the original
background until the owner selects a replacement. Artwork files, prompts and
cinema references are documented in [MENU-ART-VARIANTS.md](MENU-ART-VARIANTS.md).

The Pages transform loads the same menu entry. On mobile it supplies the lighter
scene destination, but the entry follows that route only for Start or an explicit
scene link. Opening the root page on a phone therefore still displays the menu.
Generated diagnostic pages also use the menu entry to initialize loading images
and shared viewpoints before importing the scene.

`node tools/menu-data.mjs` regenerates `assets/menu/map.json`. Names of merged
territories use the largest original municipal polygon from the planning map's
cached OSM geometry. The resolved names are committed in `assets/menu/names.json`
so regeneration does not require that ignored cache. Authored player-facing
overrides in `assets/menu/labels.json` take priority and survive regeneration.
The same generator writes `src/menu/area-labels.js` for preloader headings, so
menu and loader names have one source of truth.
Planning suggestions in
`mergeGroup` are deliberately not treated as implemented mergers. The central
area is presented as **Центр**; technical IDs and boundaries stay intact.

The soft hover/click cues use Web Audio, enabled after the first gesture. The menu
sound preference is remembered locally and applied to gameplay on entry.

## Loading images

Each live area's `views.json` defines five camera views and captions in
`assets/splash/<area>/`, alongside the five JPEG screenshots captured from its
shipping bake (105 images across 21 areas). One random screenshot
is preserved for the whole load. Only destination images
are requested. A separate `facts.json` contains twenty short Russian facts for
each live area (420 total). One is picked randomly per load and stays fixed;
there are no image or fact rotation timers. Sight captions never overwrite it.
See [PRELOADER-FACTS.md](PRELOADER-FACTS.md) for the content files and sources.

`node tools/capture-menu-sights.mjs --prepare` prepares the camera manifests from
authored viewpoints and landmark groups. Review these before capture. Run
`node tools/capture-menu-sights.mjs` against current bakes to capture serially;
`--area <id> --force` replaces one area's screenshots after a camera correction.
Do not run capture concurrently with a bake or another GPU test.
The capture tool retains reviewed camera overrides for landmarks obscured by
foreground trees, poles, or nearby walls in the walking viewpoints.

## Share a viewpoint

Press **P** during exploration to copy a URL. Its `#view=` fragment contains a
URI-encoded JSON object with version `v:1`, `area`, `pos:[x,y,z]` at eye height,
`rot:[pitch,yaw,roll]` in radians (YXZ Euler order), `fov`, numeric `tod`, optional
weather variant `look` (null when absent), and `noui`. Links retain the deployment
subdirectory and omit diagnostic query parameters. Unbounded accumulated yaw is
normalized before sharing. Invalid versions, areas, non-finite values and excessive
payloads show the menu with an explanation.

Recipients go directly through the destination preloader to a held view. Press
**Исследовать** or Enter to continue in free-camera mode at that point. Vehicles,
pedestrians, destruction and other simulation history are not serialized. Aspect
ratio and device rendering settings can change framing and appearance. Links are
not guaranteed to remain visually identical after world updates.

The browser may deny clipboard access, particularly on non-HTTPS hosts. In that
case a dialog exposes the URL for manual copying and disables player movement.

## Artwork provenance

`assets/menu/petersburg-dusk.jpg` was generated with the built-in image generation
tool and converted to JPEG (quality 90). Original output:
`C:/Users/user/.codex/generated_images/01a1d94f-1fa4-7020-8499-5b0fbc485352/exec-d7f59b53-3aec-4f86-8677-f68d75d7be07.png`.

Prompt: “Create an original ultra-wide 16:9 illustrated background for a Saint
Petersburg exploration game menu. Neon Petersburg dusk: recognizable Neva
embankment granite, elegant historic Petersburg facades, distant Admiralty spire
and Saint Isaac dome, bridge silhouettes, wet pavement and river reflecting
magenta and lavender dusk. Cinematic hand-painted cel-shaded game key art, bold
architectural silhouettes, deep plum shadows, hot pink highlights, restrained
cyan accents. Strong scenic architecture in left third and bottom, calmer soft
atmospheric sky in right two thirds to sit behind an opaque UI map. No text, no
typography, no logos, no flags, no palm trees, no UI. This is Petersburg not Miami.
Premium atmospheric game artwork.”

The November 14 refinement used the existing artwork and the owner's fixed-map
reference to generate this full-screen design concept:
`C:/Users/user/.codex/generated_images/01a1d94f-1fa4-7020-8499-5b0fbc485352/exec-f9812e1a-f33a-4763-8e21-4d1f3bba5882.png`.
The concept is a layout reference, not a flattened UI asset. Map geography remains
the planning map's real polygons, simplified at 25 m; tiny ponds are omitted from
the menu only. The background image remains the original artwork.

## Design verification (14.1.0)

Browser/IAB was attempted but its host was unavailable. The project's Puppeteer
harness rendered Edge screenshots at 1440×900, 1672×941 (concept native size),
2048×1080 (owner's desktop width), and 390×844. The generated concept and the
latest renders were inspected with `view_image`.

| Comparison | Render / correction |
| --- | --- |
| Copy | All requested slogans, descriptions, hints and map chrome removed. Only the allowed functional text and version remain. |
| Typography | Local Cyrillic Oswald replaces Arial; title size, condensed proportions, slant and spacing tuned against the concept. |
| Start button | Angled plum surface and lilac outline. The final review centers the label and removes the decorative rule and arrow as requested. |
| Map treatment | No card, border or water fill. SVG water mask shows the artwork through the gulf and rivers. |
| Framing | Fixed wide gulf/city view. Corrected the lower bound so every playable district remains inside the view. |
| Palette and assets | Original dusk artwork, ivory type, black/grey territories and purple selection retained. |
| Responsive layout | Desktop keeps the split composition; mobile stacks controls above the map without horizontal page overflow. |

Intentional differences from the generated concept: real geographic boundaries
and the correct central selection replace the generated imaginary map geometry;
a small version remains per project convention; mobile uses a stacked layout.
The copy diff found no extra marketing text. Selection by mouse, keyboard and
arrows, sound preference, static framing and Start routing are browser-checked.

## Checks

### Portrait and artwork review (14.1.2)

Browser plugin runtime was unavailable in this session. Verification used the
repository's Puppeteer/Edge harness; no new browser dependency was installed.
The portrait concept is
`C:/Users/user/.codex/generated_images/01a1d94f-1fa4-7020-8499-5b0fbc485352/exec-0ed96bc8-fb7d-4945-b0d6-5e8bd06a380e.png`.
The concept and latest rendered screenshots were inspected with `view_image`,
including its native 1067 × 1475 dimensions. Other menu checks used 1440 × 900,
2048 × 1080, 390 × 844, 320 × 568, 430 × 932, 735 × 1414 and 844 × 390.

| Comparison | Result / intentional difference |
| --- | --- |
| Copy | Saint City and the 11 owner-supplied district labels applied only to menu. No new menu slogans or hints. |
| Composition | Portrait title, fixed city map, district and Start form a centered column, all within the viewport. |
| Typography | Local Oswald remains; title is one line in portrait and two on desktop. |
| Navigation | Fixed arrow columns and reserved portrait name height; all 21 names cycled at the same pointer coordinates on every tested viewport. |
| Button | Owner's latest instruction replaces the concept's angled outlined button with a plain ivory rectangle. |
| Geography | Actual city polygons replace generated shapes; grey surrounding districts remain per the owner's original requirement. |
| Artwork | Six original candidates retain plum/pink tones; two show sky bounded on all sides by courtyard walls. Main-game background awaits selection. |
| Treatment | Subtle CSS scanlines affect artwork, below sharp map geometry and controls. |

`menu-variants.html` was checked at 1440 × 1100 and 390 × 844. The review flow
selects each of six candidates, switches desktop/phone/image-only modes, toggles
scanlines and reloads the selected hash. Fixed thumbnail aspect ratios and a lazy
iframe startup race found during review. No missing images, console errors or
scene imports remain. Review screenshots are in the OS temp folder as
`n4spb-variants-{desktop,mobile,twilight}.png`; menu screenshots use
`n4spb-menu-{desktop,mobile,portrait-concept,...}.png`.

Menu selection, keyboard activation, hover fill, sound preference and Start's
destination routing passed. Closure lint, version synchronization, generated
diagnostic checks and the bake plan passed; all 21 shipping bakes remain fresh.
Scene preloader content and artwork were not changed. These menu-only changes
were not used to justify a new full-scene performance run.

- `node tools/menu-test.mjs --assets`: codec, catalogue, image existence, lazy
  startup, selection, invalid links, desktop/mobile layout and browser errors.
- `node tools/shared-view-test.mjs`: real integrated direct loading, exact held
  camera/light restoration, copying, clipboard rejection and resuming exploration.
- Existing area HTML, closure, runtime-only, handoff and gate checks still apply.
- Startup changes to `src/main.js` or area HTML stale the shipping bakes. Run the
  ordinary bake and manifest checks before shipping, never relabel old products.
