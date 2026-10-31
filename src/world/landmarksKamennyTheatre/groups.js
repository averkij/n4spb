// landmarksKamennyTheatre/groups.js - the layout.GROUPS sub-groups of module landmarksKamennyTheatre (pure data, no imports: layout.js merges them).  Claims are ON only for what the module draws
// (docs/research/kamenny-2026.md section 8 entry 3, the critic's plan; BUILD LOG at the end of the dossier):
//   * the theatre w39358614 (the OSM outline; the BDT second stage) and the Kleinmichel dacha w60703051 (exterior only, the Дом приёмов);
//   * the plot fence w124708539 (207 m: the Kleinmichel plot's north side along the square and its east side; drawn here as the black iron fence with the cream gate piers).
// NOT claimed: the square paving ways w36361039 / w124651776 / w159046632, the parking w1154257494, the roads, the substation w923401338, the trees (generic); the Kirov bust belongs to landmarksYelaginPark.
const ON = ['kamenny-theatre', 'kamenny-kleinmichel', 'kamenny-kfence'];

const ALL = [
  { key: 'kamenny-theatre', name: 'Каменноостровский театр (вторая сцена БДТ)', nameEn: 'Kamennoostrovsky Theatre (the pink wooden theatre of Shustov 1827, 8 Corinthian columns, BDT second stage)',
    ids: ['w39358614'], osm: [], at: [-4238.1, -4931.2],
    note: 'footprint w39358614 (1293 m2, 12 vertices): drawn as the box of the photos with the low annexes at the ESE end; portico at the WNW end facing the Starogo Teatra square' },
  { key: 'kamenny-kleinmichel', name: 'Дача Клейнмихель (Дом приёмов)', nameEn: 'Kleinmichel dacha: timber tower, glazed hall and the plaster house with the steep slate roof (exterior only)',
    ids: ['w60703051'], osm: [], at: [-4285.3, -4885.6], note: 'footprint w60703051 (1171 m2, 10 vertices)' },
  { key: 'kamenny-kfence', name: 'Ограда дачи Клейнмихель', nameEn: 'Iron fence with cream ogee gate piers along the Kleinmichel plot',
    ids: [], osm: ['w124708539'], at: [-4288.5, -4909.5], note: 'fence w124708539 (207 m, from (-4350,-4962) to (-4224,-4842))' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));
