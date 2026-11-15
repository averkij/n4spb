# Character playground credits

The assets are downloaded locally through Sketchfab using Blender MCP. No Sketchfab credentials are included or needed at runtime.

## Selectable characters

All three base models below are by **Razvan Savescu (razvansavescu)** and licensed
under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).

| Variant | Original model | Local file |
| --- | --- | --- |
| White T-shirt and jeans | [Low-poly Man](https://sketchfab.com/3d-models/7b93db2d46d847f191cf5e841b322856) | `assets/man-white.glb` |
| Woman in a red beret | [Low-poly Girl](https://sketchfab.com/3d-models/3e79fef9da5f4db7b6a46f3e0ff89328) | `assets/woman-beret.glb` |
| Blue overshirt and dark trousers | [Low-poly Man Casual Clothes 2](https://sketchfab.com/3d-models/4a834adf1e33405c979e94555e7955c6) | `assets/man-jacket.glb` |

Changes: normalized and grounded in Blender; original red beret, short male hair
and simple eyes added; native motion baked with complete bone transforms;
missing idle/walk/run motion transferred from Low-poly Man and jump/running-jump/
sitting motion transferred from Kobi's model below. All three export six clips.
GLBs deduplicated/pruned, empty export scenes removed, and runtime materials
converted to toon shading. The original girl model supplies her walking clip.

## Supplemental animation source and previous character

- **Low-poly animated Man** by **Kobi (kobiS21)**
- Source: https://sketchfab.com/3d-models/fec7bd66fe67411ca58645c9e983f14c
- License: Creative Commons Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/
- File: `assets/civilian.glb`
- Changes: normalized to approximately 1.8 m, grounded, exported through Blender to GLB, retained idle/walk/run/jump/running-jump/sitting clips; glTF Transform dedup/prune and removal of empty export scenes; runtime materials converted to toon shading.

## Car

- **Low-Poly Sedan car** by **scailman**
- Source: https://sketchfab.com/3d-models/aeb2699532b4402e8b75ec8888b800b9
- License: Creative Commons Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/
- File: `assets/sedan.glb`
- Changes: normalized to 4.5 m length, grounded, exported through Blender to GLB; glTF Transform dedup/prune and removal of empty export scenes; runtime toon materials, blue body tint, transparent windows and wheel animation pivots.

## Software

- Three.js 0.170.0 — MIT, supplied by the repository's existing dependency.
- Rapier 3D compat 0.21.0 — Apache-2.0, https://github.com/dimforge/rapier.js. Vendored `rapier.mjs` contains its WASM payload. Full license in `vendor/RAPIER-LICENSE`.

The environment and controller are original prototype code. This is a GTA-inspired camera/movement study, with no Rockstar game assets.
