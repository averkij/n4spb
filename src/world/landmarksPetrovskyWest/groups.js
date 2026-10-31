// landmarksPetrovskyWest/groups.js - the layout.GROUPS sub-groups of module landmarksPetrovskyWest (pure data, no imports: layout.js merges them).  Dossier docs/research/petrovsky-zhdanovka-2026.md.
// Fields as in layout.js GROUPS: { key, name, nameEn, ids: [OSM building ids + parents], osm: [non-building OSM ids], at: [x, z], note }.
// A part of the module is built only when its key is listed here (landmarksPetrovskyWest.js PARTS), so a claim is on together with the drawing.  Claims are flipped on only for objects the module draws.
// NOT claimed on purpose: the Savina Home (w31065483: landmarksPetrovskyYacht draws it), the rest of the Gote works (the long rope hall r3345289, the lit. B / Zh / D / SH blocks: generic brick blocks), Petrovskaya square.
const ALL = [
  { key: 'pwest-malthouse', name: 'Солодовня пивоваренного завода «Новая Бавария» (Ремесленная ул., 7 лит. К)', nameEn: 'Bavaria brewery malthouse: derelict seven-floor brick hall with three stepped gables, a recessed arched loading bay and a taller south block; birch saplings on the roof deck',
    ids: ['w938558332'], osm: [], at: [-4810.1, -3147.1],
    note: 'OSM w938558332 (68.8 x 23.1 m, axis 107 deg; Remeslennaya 7 lit. K); photos t21 t22 t23 t24; the gables face west [?]; status in Oct 2026 unknown, built as photographed in 2021' },
  { key: 'pwest-ruin', name: 'Руины кирпичного корпуса пивзавода (Ремесленная ул.)', nameEn: 'Roofless brick shell of the Bavaria brewery (OSM ruins=yes): window holes, broken wall tops, birches inside',
    ids: ['w44425076'], osm: [], at: [-4841.4, -3166.6],
    note: 'OSM w44425076 (33 x 20.1 m, axis 17 deg, ruins=yes); no photo of the shell itself: wall heights 6.4-9.6 m are estimates [E]' },
  { key: 'pwest-mansion', name: 'Особняк Готе (Петровский пр., 20, корп. 3)', nameEn: 'Gote mansion: the wooden house of 1882-83 on a high stone basement, weatherboard walls, bracketed cornice, pedimented wings, iron fence',
    ids: ['w44425059'], osm: [], at: [-4796.1, -3050.1],
    note: 'OSM w44425059 (Petrovsky pr. 20 k3, 20-vertex plan); photos g06 g07 g11; A. A. Ritter, V. I. Schaub; renovated 2019' },
  { key: 'pwest-hallv', name: 'Канатный завод Готе: производственный корпус, Петровский пр., 20 лит. В', nameEn: 'Gote rope works production hall of 1898: red brick, arched windows under a dentil frieze, limestone plinth, grey hipped roof',
    ids: ['w44425062'], osm: [], at: [-4849.6, -2915.5],
    note: 'OSM w44425062 (20 litV, 10-vertex ring); photos g01 g09 g10; F. Nagel 1898' },
  { key: 'pwest-tower', name: 'Водонапорная башня канатного завода Готе', nameEn: 'Gote works water tower: cream plaster shaft with a red-brick tank house and hip roof',
    ids: ['w861142938'], osm: [], at: [-4927.4, -2941.1],
    note: 'OSM building:part w861142938 (5 x 5 m, parent w248349888 lit. G stays generic); photos g02 g09; heights estimated [E]' },
  { key: 'pwest-almaz', name: 'Судостроительная фирма «Алмаз», Петровский пр., 26', nameEn: 'Almaz shipbuilding company office: three-storey yellow-and-white stucco block with the entrance canopy and the two-tier stone relief of workers at the corner',
    ids: ['r20673867'], osm: [], at: [-5350.1, -3235.4],
    note: 'OSM r20673867 (Petrovsky pr. 26, 3 levels); photo misc/m09; plain wordmark only, no emblem' },
];
// parts that are not built yet are listed in PENDING and move to ALL when their file exists
export const GROUPS_PENDING = [];
export const GROUPS_LIST = ALL.filter((g) => ['pwest-malthouse', 'pwest-ruin', 'pwest-mansion', 'pwest-hallv', 'pwest-tower', 'pwest-almaz'].includes(g.key));
