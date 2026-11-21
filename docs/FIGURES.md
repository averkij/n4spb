# Figure kit (src/world/lib/figures.js) and the monuments built with it

One shared kit for every statue of the scene: lofted, smooth-shaded geometry (the technique of the Bronze Horseman rebuild: `landmarksH/bronze_geom.js`, copied into `lib/figures/geom.js`
so that no module imports another).  Everything is pure geometry: it needs no `ctx` except `figureMats(ctx)`.  Figures face +z, stand on y = 0, +x is the figure's LEFT.

```js
import { human, horse, lion, griffin, bust, camel, addWing, serpent, extend, cached, figureMats, Sculpt, V } from '../lib/figures.js';
const mk = figureMats(ctx).keys('bronze', 'bronze');                 // { main, dark, accent } materials (ctx.mat.toon, cached by name)
cached('myKey', () => human({ ... })).place(P, mk, x, y, z, rotY, scale);   // P = the module's Parts collector (kit.js `P.geo`): merged by the engine
```

| file | what |
|---|---|
| `figures/geom.js` | `tube` (lofted elliptic tube along a Catmull-Rom path, per-point radii, caps, sector sheets, bump), `blob` / `blobBetween` (oriented ellipsoids), `ik2` (two-bone IK), `V` (vector helpers), `Sculpt` (collector with a matrix stack, one merged BufferGeometry per material key, patina uv), `Figure` (`place`, `toGroup`, `bounds`), `extend(fig, fn)` (add a cloak / sword / cross to a finished figure), `cached` |
| `figures/horse.js` | `horse({ pose: 'stand' / 'walk' / 'trot' / 'prance' / 'rear' / 'rearHigh' / {...}, mane, tail, bridle, detail })`: body pitched about the hips, IK legs (knee forward, hock back), neck / head angles, bridle, mane strands, tail |
| `figures/human.js` | `human({ pose, body, outfit, face, detail })`: IK skeleton (pelvis, spine, head, arms to a wrist target, legs to a foot target), muscles, clothing (greatcoat / uniform / dress / robe / tunic / cuirass, cape, mantle, epaulettes, buttons, sash, hats: laurel, crown, Roman helmet, plumed helmet); `bust(o)` |
| `figures/anatomy.js` | `headGeometry` / `face` (ONE sculpted head surface: brow, eye sockets and lids, nose, lips, chin, hair, beard, moustache; ~1.3 k triangles at detail 0.6), `hand` (palm, 4 fingers, thumb, 7 grips), `foot` (bare or boot) |
| `figures/creatures.js` | `lion` (stand / walk with a paw on a ball / sit, mane), `griffin`, `addWing` (one lofted feathered sheet, folded / half / spread / raised), `serpent`, `camel` (lying, loaded) |
| `figures/materials.js` | `figureMats(ctx)`: bronze (verdigris on up-facing surfaces through the patina uv), copper, gold, marble, plaster, granite |

`detail` scales sides / rings / blob resolution (1 = a near figure ~12-15 k triangles, 0.3 = a far one ~3-4 k).  `tools/figures-view.mjs` renders a kit figure in a bare scene in seconds
(`node tools/figures-view.mjs --script <file.mjs> --out shots/figures/x --cams "yaw,pitch,dist,tx,ty,tz"`), without building the city.

## Monuments (module, file, triangles after)
Kutuzov 13.3 k / Barclay 12.4 k (`landmarksF/statues.js`), Catherine II 6.4 k + nine associates 23 k (`landmarksE/statues.js`), Apollo quadriga 25 k (`landmarksE/statues.js`), Nicholas I group 13 k + four
women 10 k (`landmarksJ/statues.js`), Alexander Column angel + cross + serpent (`landmarksG/angel.js`), Palace Pier lions 6 k each (`environment/lions.js`, vertex coloured), Admiralty nymph groups 5.9 k each and
seated warriors 3.5 k (`landmarksH/statues.js`), Alexander Garden busts 2.8 k each, Przhevalsky + camel, Hercules 7 k, Flora 4.6 k (same file), Klodt horse tamers, four individually posed groups in `assets/sculptures/klodt.glb` (about 17-24 k triangles each, one shared 1024 px bronze map with scanned surface relief),
Bankovsky griffins 4.4 k each (`bridges/sculpt.js` + kit), Dostoevsky 6.6 k (`landmarksD/statues.js`), Hermitage atlantes (`landmarksI/hermitage.js`), Chariot of Glory warriors / Victory (`landmarksG/sculpt.js`).
