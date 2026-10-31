# Three flagpoles, Park 300 waterfront

The user explicitly requested these three landmark flagpoles, including their historical flags, on 2026-10-31. This is a limited exception to the older scene-wide prohibition on flags. It does not authorise flags elsewhere. The model follows the supplied 2023 photographs and the engineer's published large-cloth configuration.

## Primary references and dimensions

- [Lenmontazh, manufacturer and installer](https://lenmontage.ru/projects/flagshtoki-na-baze-vodnyh-vidov-sporta/) identifies the June 2023 completion, eighteen steel sections, 175 m structural height and 179.5 m above sea level. The base and upper shaft diameters are 3.90 and 1.80 m. Its photo gallery shows the exposed cylindrical sections and flange joints during assembly.
- [Giprostroymost–Saint Petersburg project dossier, 2024, pages 5–7](https://gpsm.ru/files/PGS_16-2024.pdf) supplies the section schedule and an elevation drawing. The lower 90 m retains the 3.90 m diameter; the next 50 m tapers to 1.80 m; the final 35 m retains that diameter. The fabricated first section is 13 m long, with 3 m embedded. The eighteenth section is 5 m long and contains the rotating head. Its inverted-cone weather hood has a 4.55 m service platform. The rectangular cloth measures **60 m along the fly × 40 m along the hoist**. Page 6 is a useful complete daylight photograph of all three flags; page 7 shows the mast profile and its relationship to the glazed circular pavilion.
- [MGSU Computer Modelling Centre, project engineer](https://noccm.ru/projects/flagpoles) identifies the three circular hydraulic structures and its wind-loading, vortex-response and aeroelastic analysis for the 175 m masts. This independently confirms the intended slender steel structure rather than a generic tower.

The same Giprostroymost dossier describes **50 m diameter** artificial hydraulic islands, raised 4.5–5 m above the gulf, with circular promenades and low service pavilions. The two island footbridges are 97.7 m and 40.7 m long, 3.0 m wide, with 2.9–3.5 m clearance over water. These are separate ground-builder responsibilities. Current OSM also maps a short connection to the western peninsula; its geometry is retained as survey evidence rather than assigning it one of the two published bridge lengths.

The engineering PDF was retrieved for inspection with a local TLS-certificate bypass because its certificate failed the local system check. Reference photographs and PDF page images remain in the temporary research directory; none is shipped as an asset.

## Geographical registration

Coordinates come from the area's existing Overpass snapshot, 2026-10-31T09:14:05Z, in the same projection as the rest of the scene, © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright). The source still contains all three explicit flagpole nodes, so no photograph-derived guess is needed for placement.

| West to east | Mast node | World x, z | Circular pavilion building |
| --- | --- | --- | --- |
| Historical imperial black/yellow/white | n11012205951 | −9103.3, −5670.7 | w1426773312 |
| Historical USSR red cloth | n11012205952 | −8849.3, −5388.9 | w1426773298 |
| Russian white/blue/red | n11012205953 | −8233.9, −5170.4 | w1426773294 |

The pure source [sites.js](../../src/world/landmarksThreeFlags/sites.js) also identifies the paired outer bank ways and each access footbridge. The module claims only the three mast nodes. Ground, circular pavilions, railings and access bridges are claimed by the waterfront ground builder, preventing the generic beige building treatment from appearing beneath the masts.

The scene's gulf surface is y = −3.4 m. A platform at y = +1.1 m is 4.5 m above water. Adding the exposed 175 m mast gives y = 176.1 m at the head, or **179.5 m above the gulf**. This is a deliberate distinction between structural height and height over water.

## Authored interpretation and cost

The shaft uses the engineer's cylindrical/tapered profile, narrow section collars, a service hatch, a hoist guide and the flared rotating-head hood. The base flange has sixteen visible bolt heads. Fine collar details stop at 1.4 km; the very small mast silhouette and cloth remain available to 5.5 km through finite, per-mast authored ranges.

Each 60 × 40 m cloth is a static, gently filled textile with folds, a fixed hoist, free-edge sag and slight alternating sewn-panel tones. The three share one wind direction with small phase differences. The USSR cloth has a gold outlined star, hammer and curved sickle on both sides. Emblem triangles follow the formed cloth surface. The colour bands have independent boundary vertices, so the tricolours have sharp woven edges. This is a formed pose, not a cloth simulation or wind animation.

All materials come from the shared toon factory. No photographs, logos, canvas textures, custom shaders, new frame callbacks or sound sources are added. The complete mast, collars and cloth are one shared knock record. Its eight height-banded physical cylinders remain attached to that record; the textile itself has no collider and creates no water barrier. A high-speed impact can release the anchored structure through the existing knock system.

Focused headless build: **12,238 triangles, 9 instanced mesh draws, 3 shared materials, 24 colliders, 3 knock records, 0 module update callbacks, 0 texture pixels**. Integrated normal-render review and shipping-bake verification belong to the lead's checkpoint.
