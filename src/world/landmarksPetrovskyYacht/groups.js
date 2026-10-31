// landmarksPetrovskyYacht/groups.js - the layout.GROUPS sub-groups of module landmarksPetrovskyYacht (pure data, no imports: layout.js merges them).  Dossier docs/research/petrovsky-zhdanovka-2026.md.
// Fields as in layout.js GROUPS: { key, name, nameEn, ids: [OSM building ids + parents], osm: [non-building OSM ids], at: [x, z], note }.
// A part of the module is built only when its key is listed here (landmarksPetrovskyYacht.js PARTS), so a claim is on together with the drawing.  Claims are flipped on only for objects the module draws.
// NOT claimed on purpose: the club sheds (boat houses w31065043 / w31065044 / w31065039, hangars w31065049 / w31065052, cafe w200731335, Milo w555260899),
// the boiler house w44425020, the big kosa-3 industrial blocks (w31065336, r21379093 / r21379095), the harbour piers and breakwater (water / props owners: docs/research/islands2-requests-landmarksPetrovskyYacht.md),
// the Savina outbuildings / guest house.  The two annexes w200731324 / w200731329 of the main building ARE claimed (pyacht-main draws them).
const ALL = [
  { key: 'pyacht-main', name: 'Главное здание Речного яхт-клуба (Петровская коса, 9 лит. К)', nameEn: 'St Petersburg River Yacht Club main building: the crystal frame of 1969-80 on Y-shaped concrete pillars, glazed first floor, sloped glazed band, lantern and mast, stone podium',
    ids: ['w174319543', 'w200731324', 'w200731329'], osm: [], at: [-6252.4, -3632.1],
    note: 'OSM w174319543 (39.85 x 39.63 m, axis 16 deg, 3 levels); the two annexes w200731329 (glazed north hall, 21 x 6 m) and w200731324 (west pavilion, 5.4 x 15 m) are drawn with it' },
  { key: 'pyacht-standart', name: 'Верфь «Штандарт»: ангар с пушкой и якорем', nameEn: 'Standart shipyard shed (dark green corrugated hangar) with the cast cannon on its carriage, the rusty anchor, the log bench and the compass-rose sign',
    ids: ['w200731337'], osm: [], at: [-5953.6, -3490.2],
    note: 'OSM w200731337 (19.5 x 15 m); the cannon, anchor, bench and compass sign stand on the yard beside its long north-east wall (photo y12)' },
  { key: 'pyacht-rops', name: 'Дом Ропса: место сгоревшего особняка', nameEn: 'Rops cottage site: the wooden house (1900-10, heritage) burned on 6 July 2026; the fenced plot with the stone footing, the surviving chimneys and the debris',
    ids: [], osm: [], at: [-5906, -3468],
    note: 'OSM way w31065055 (ruined:building=yes, not a building any more: nothing for the city to hide); fenced plot drawn by the module' },
  { key: 'pyacht-savina', name: 'Дом ветеранов сцены имени М. Г. Савиной', nameEn: 'Savina Veterans of the Stage Home: yellow two-storey neoclassical wings with the pedimented portico, balconies, gate and iron fence (exterior only)',
    ids: ['w31065483'], osm: [], at: [-5397, -3376.7],
    note: 'OSM w31065483 (the whole zig-zag complex, 4 187 m2, axes 16 / 106 deg); built 1900-02 by M. F. Geisler, federal monument' },
  { key: 'pyacht-kosa3', name: 'Петровская коса, 3/6: контора и трансформаторная будка', nameEn: 'Petrovskaya kosa 3/6: the three-storey ashlar office with the oval garland window, the transformer hut by the road and the prefab concrete fence with its gate',
    ids: ['r21379094', 'r21379092'], osm: [], at: [-5700, -3376],
    note: 'OSM r21379094 (part of the untagged w31065398, 11.9 x 11.6 m, 3 levels) = the office of photos "Петровская коса 3 (контора)"; r21379092 (4.3 x 4.5 m) = the hut "(электростанция)"; mapping settled with the Commons photos 2026-10-13' },
  { key: 'pyacht-savfence', name: 'Ограда усадьбы Дома ветеранов сцены', nameEn: 'Cast-iron fence of the Savina Home estate: linked-oval panels on a granite footing between pale stucco piers',
    ids: [], osm: ['w112174612', 'w501166129'], at: [-5437, -3380],
    note: 'OSM barrier ways (metal fence, 1.5 m); photo v03; the generic city draws no OSM fences, the claim only documents the owner' },
];
// parts that are not built yet are listed in PENDING and move to ALL when their file exists
export const GROUPS_PENDING = [];
export const GROUPS_LIST = ALL.filter((g) => ['pyacht-main', 'pyacht-standart', 'pyacht-rops', 'pyacht-savina', 'pyacht-kosa3', 'pyacht-savfence'].includes(g.key));

// ---- hand-over to environment (environment/owners.js SIGHTS lists the modules that may export these): ground the module paves itself, so the generic environment plants no trunks, hedges, beds or grass tufts there.
// Rings are world metres (x, z).  The main building podium (terrace A 43.4 x 43.1 m + apron B 49 x 48.8 m) in the building frame (centre -6252.375 / -3632.075, rotation -16 deg).
const C16 = Math.cos(16 * Math.PI / 180), S16 = Math.sin(16 * Math.PI / 180);
const wl = (lx, lz) => [Math.round((-6252.375 + lx * C16 - lz * S16) * 10) / 10, Math.round((-3632.075 + lx * S16 + lz * C16) * 10) / 10];
const rect = (a, b) => [wl(-a, -b), wl(a, -b), wl(a, b), wl(-a, b)];
// the burned Rops plot: the footprint of the old house grown by 1.6 m (frame: centre -5907.138 / -3469.22, rotation -18 deg, rops.js RING): no trunks, hedges or grass tufts of the environment through the ruin
const R18 = 18 * Math.PI / 180, wr = (lx, lz) => [Math.round((-5907.138 + lx * Math.cos(R18) + lz * Math.sin(R18)) * 10) / 10, Math.round((-3469.22 - lx * Math.sin(R18) + lz * Math.cos(R18)) * 10) / 10];
const ROPS_RING = [[-12, -11.2], [11.8, -11.3], [11.8, 6.6], [5.8, 6.7], [5.7, 14.9], [-5.6, 14.9], [-5.6, 6], [-12, 6.1]];
const outset = (ring, d) => ring.map((p, i) => {
  const a = ring[(i + ring.length - 1) % ring.length], b = ring[(i + 1) % ring.length];
  const n = (u, v) => { const dx = v[0] - u[0], dz = v[1] - u[1], l = Math.hypot(dx, dz) || 1; return [dz / l, -dx / l]; };      // outward for a ring of positive signed area (checked below)
  const n0 = n(a, p), n1 = n(p, b), k = d / Math.max(0.3, 1 + n0[0] * n1[0] + n0[1] * n1[1]);
  return [p[0] + (n0[0] + n1[0]) * k, p[1] + (n0[1] + n1[1]) * k];
});
const ropsOut = (() => { const sa = ROPS_RING.reduce((s, p, i) => { const q = ROPS_RING[(i + 1) % ROPS_RING.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0); return outset(ROPS_RING, sa > 0 ? 1.6 : -1.6); })();
export const PAVED_RINGS = [
  { id: 'yacht-main-apron', ring: [wl(-31.5, -31.5), wl(24.5, -31.5), wl(24.5, 24.4), wl(-31.5, 24.4)].flat() },
  { id: 'rops-ruin', ring: ropsOut.map(([x, z]) => wr(x, z)).flat() },
];
