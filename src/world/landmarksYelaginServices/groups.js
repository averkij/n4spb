// landmarksYelaginServices/groups.js - the layout.GROUPS sub-groups of module landmarksYelaginServices (pure data, no imports: layout.js merges them).  Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (dossier docs/research/yelagin-palace-2026.md section 10).
// NOT claimed on purpose: the Kitchen block and its 14 statues (landmarksYelaginKitchen), the Palace, the toilets w192061311, the fast-food kiosks w736544131 / w736544137 / w738578606, the sports pavilion w111636419,
// the yard sheds w181423903 / w181423905 / w181424637 / w736544143 and the unidentified w718932108 (low generic boxes, dossier 6.10); the footways w717881704 / 707 on the Stable forecourt (they stay with streets).
const ON = ['yelagin-stable', 'yelagin-orangery', 'yelagin-houses'];

const ALL = [
  { key: 'yelagin-stable', name: 'Конюшенный корпус Елагина дворца', nameEn: 'Yelagin Stable block (Rossi 1818-22): the Doric colonnade gate, pavilions, wings, front court, arch, apse and the round court with the Manizer bronzes',
    ids: ['r2420060'], osm: ['w717881705', 'w717881706', 'w736544132', 'w736544145', 'w736544146', 'w738578586', 'w738578604', 'n6916123786'], at: [-4818, -5314],
    note: 'r2420060 (the parts w736544124 colonnade, w736544149 pavilions + wings + cross wall, w736544126 apse follow through the parent id); the four footways through the colonnade, the front court and the arches (w717881705 / 706, w736544132 / 145) are paved by the module; fences / gate at the north and west edge of the Stable yard' },
  { key: 'yelagin-orangery', name: 'Оранжерея Елагина дворца (Музей художественного стекла)', nameEn: 'Yelagin Orangery (Museum of Art Glass): the glass central pavilion with herm pilasters, two dormer galleries, two end pavilions',
    ids: ['w23150126'], osm: ['w736544133', 'n6896052611', 'n1145292923'], at: [-4630, -5332],
    note: 'w23150126 is a skip outline whose parts w736544144 / w736544134 / w736544122 / w736544136 / w736544128 follow through the parent id; the fence w736544133 and the two gates at the east end of the Orangery yard' },
  { key: 'yelagin-houses', name: 'Службы Елагина дворца', nameEn: 'Yelagin service houses: Stone storerooms, Fraulein house, Cavalier / Hoffurier house, Gardener Buk house, glass-blowing workshop',
    ids: ['w181423911', 'w100820382', 'w181423910', 'w181423909', 'w181423904'], osm: [], at: [-4900, -5350],
    note: 'five single buildings of the Rossi service court (4 litera Z, L, K, G, I)' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));

// ---- hand-over to environment (environment/owners.js SIGHTS lists the modules that may export these; the lead adds landmarksYelaginServices there): ground the module paves or builds on, so that the generic
// environment plants no trunks, hedges, beds or grass tufts there.  Rings are world metres (x, z).
export const PAVED_RINGS = [
  { id: 'stable-forecourt', ring: [-4846.3, -5275.8, -4786.5, -5280.6, -4784.6, -5257.6, -4844.4, -5252.9] },
  { id: 'orangery-front', ring: [-4693.9, -5317.2, -4566.4, -5327.9, -4565.5, -5316.9, -4693.0, -5306.2] },
  // the Oil Meadow (Масляный луг) between the Stable colonnade and the palace lawn (landmarksYelaginPalace 'lawn-west', x -4660 .. -4580): an open mown lawn in the photos (pal_03, kit_02, stb_03), a forest in the generic park;
  // review 2026-10-14: the Stable gate and the palace could not see each other.  Same mechanism as 'lawn-west': no generic trunks / hedges / beds / tufts, the ground stays lawn.
  { id: 'oil-meadow', ring: [-4790, -5264, -4658, -5272, -4658, -5184, -4790, -5190] },
];
