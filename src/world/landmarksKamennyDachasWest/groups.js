// landmarksKamennyDachasWest/groups.js - the layout.GROUPS sub-groups of module landmarksKamennyDachasWest (pure data, no imports: layout.js merges them).  Claims are ON only for what the module draws
// (docs/research/kamenny-2026.md section 8 entry 6, the critic's plan; BUILD LOG at the end of the dossier):
//   * the Polovtsov dacha w60703042, the Gauswald dacha w108029314 (+ the three small houses of its compound w158330617 / 618 / 619), the Follenweider mansion w108026879 (exterior only, closed plots);
//   * the plot fences: w128092326 (Polovtsov, along the Srednyaya Nevka embankment), w108026876 + w242395135 (Follenweider), w793224546 + w440416235 (Gauswald compound): the same lines are drawn as the real iron fences.
// NOT claimed: Blue dacha, K-1 / K-2, Mertens, Yakovenko, Melzer, Chaev, Bekhterev, Verevkina, Mikhin, Schwartz plots (generic, closed, collider on their fences).
const ON = ['kamenny-polovtsov', 'kamenny-gauswald', 'kamenny-follenweider', 'kamenny-dw-fence-pol', 'kamenny-dw-fence-fol', 'kamenny-dw-fence-gau'];

const ALL = [
  { key: 'kamenny-polovtsov', name: 'Дача Половцова', nameEn: 'Polovtsov dacha (Fomin 1912-16, neoclassical U-plan with the glazed winter garden, Navy officers club)',
    ids: ['w60703042'], osm: [], at: [-4181.1, -5199.2], note: 'footprint w60703042 (2738 m2, 21 vertices): the OSM outline is drawn exactly; garden portico EAST, semicircular bay WEST' },
  { key: 'kamenny-gauswald', name: 'Дача Гаусвальд', nameEn: 'Gauswald dacha (1898, pale-green clapboard, red tiles, buff-brick tower) with the three small houses of its compound',
    ids: ['w108029314', 'w158330617', 'w158330618', 'w158330619'], osm: [], at: [-3786.9, -5053.5], note: 'w108029314 (563 m2) + compound houses lit. P / R / N (58 / 125 / 134 m2)' },
  { key: 'kamenny-follenweider', name: 'Особняк Фолленвейдера', nameEn: 'Follenweider mansion (Meltzer 1904-05, white roughcast, tent roof, granite gate piers)',
    ids: ['w108026879'], osm: [], at: [-3778.3, -5191.8], note: 'footprint w108026879 (701 m2, 25 vertices)' },
  { key: 'kamenny-dw-fence-pol', name: 'Ограда дачи Половцова', nameEn: 'Black iron fence with arc motif on a rose granite socle along the Srednyaya Nevka embankment (Polovtsov plot)',
    ids: [], osm: ['w128092326'], at: [-4240, -5100], note: 'fence w128092326 (485 m, from (-4235,-4980) to (-4063,-5324))' },
  { key: 'kamenny-dw-fence-fol', name: 'Ограда особняка Фолленвейдера', nameEn: 'Black iron fence with granite gate piers (Follenweider plot)',
    ids: [], osm: ['w108026876', 'w242395135'], at: [-3820, -5190], note: 'fences w108026876 and w242395135' },
  { key: 'kamenny-dw-fence-gau', name: 'Ограда дачи Гаусвальд', nameEn: 'Pale-green iron fence with red-and-buff brick piers (Gauswald compound)',
    ids: [], osm: ['w793224546', 'w440416235'], at: [-3790, -5020], note: 'fences w793224546 and w440416235 (a closed ring of two ways)' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));
