// landmarksBotanicalGreenhouses/groups.js - the layout.GROUPS sub-groups of module landmarksBotanicalGreenhouses (pure data, no imports: layout.js merges them).  Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids], osm: [non-building OSM ids], at: [x, z], note }.  Dossier docs/research/aptekarsky-2026.md section 10 (MODULE PLAN, CRITIC LOG).
// Every id below is drawn by the module (walls, roofs and colliders): the 24 greenhouses, the stucco / corridor / vestibule / museum parts of the outline r1920691, the roof piece r13561123 and the
// five sheds of the courts.  NOT claimed on purpose: r20395047 (a tourism relation, not a building), w642234694 (a far greenhouse by LETI Corpus 7), the nursery greenhouses and the ticket pavilion
// (landmarksBotanicalGarden), the Peter I bust and the other statues (landmarksBotanicalGarden).  The outline r1920691 itself is hidden by the bake (91 % of it is covered by its parts).
const ON = ['botanical-greenhouses'];

const PARTS = [
  'r11491713', 'r13561122', 'r13561124', 'r13561125', 'r13561126', 'r13561127', 'r13561128', 'r13561129', 'r13561130', 'r13561131', 'r13561132', 'r13561133', 'r13561134', 'r13561135', 'r13561136', 'r13561137', 'r13561138',
  'r13561140', 'r13561141', 'r13561142', 'r13561143', 'r13561144', 'r13561145', 'r13561146', 'r13561147', 'r13561148', 'r13561149', 'r13561150', 'r13561493', 'r13561494', 'r13572222', 'r13572223', 'r13572224',
  'r19579807', 'r20398367', 'r20398541',
];
const ALL = [
  { key: 'botanical-greenhouses', name: 'Оранжерейный комплекс Ботанического сада Петра Великого', nameEn: 'Greenhouse complex of the Peter the Great Botanical Garden: Palm House, Victoria and Mangrove houses, Great Subtropical house, 24 houses of the two squares, vestibule rotunda, Botanical Museum',
    ids: ['r1920691', ...PARTS, 'r13561123', 'w28692711', 'w141816501', 'w881416378', 'w881416379', 'w413439428'], osm: ['n9346535790'], at: [-1560, -4250],
    note: 'the 36 parts of the outline r1920691 (claimed by id, the parent hidden by the bake) + the roof piece r13561123 + house 23 w28692711 + four sheds + the decorated door n9346535790; closed interiors, solid walls' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));
