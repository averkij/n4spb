// landmarksLETI/groups.js - the layout.GROUPS sub-groups of module landmarksLETI (pure data, no imports: layout.js merges them).  Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (dossier docs/research/aptekarsky-2026.md section 10).
// NOT claimed on purpose: the parents r11983443 / r11983444 (claiming a parent claims all its parts: Corpus 2 r11983461, C r11983457 and their sheds stay generic), the sheds r11983458 / 459 / 460,
// the benches / bins / bicycle racks (props), the paths and the carriageways (streets).
const ON = ['corpus1', 'corpus5', 'corpus7', 'corpusD', 'busts', 'fence'];

const ALL = [
  { key: 'corpus1', name: 'ЛЭТИ: Корпус 1 (здание Векшинского, 1899-1903)', nameEn: 'LETI Corpus 1: the striped old building by A. N. Vekshinsky (clock gable and round towers, west porch, lantern)',
    ids: ['r1915364'], osm: [], at: [-1723, -4369],
    note: 'footprint r1915364 (39 vertices + the small inner court); the parent r11983443 is hidden by the bake and is not claimed' },
  { key: 'corpus5', name: 'ЛЭТИ: Корпус 5 (красный кирпичный комплекс, парадная лестница)', nameEn: 'LETI Corpus 5: the red-brick teaching complex with the entrance stair',
    ids: ['r11983462', 'r11983463', 'r11983464'], osm: ['w141425873'], at: [-1540, -4425],
    note: 'three rings (auditorium hall with the entrance, tall laboratory wing, tall auditorium wing); the steps way w141425873 is replaced by the stair of entrance5.js' },
  { key: 'corpus7', name: 'ЛЭТИ: Корпус 7 (кирпичное здание 1890-х, крестообразное в плане)', nameEn: 'LETI Corpus 7: the dark-red-brick cross-shaped archive building',
    ids: ['w28370226'], osm: [], at: [-1605.8, -4471.8], note: 'cross plan of 12 edges, 4 levels; the plate "Корпус 7" at the north-west arm end' },
  { key: 'corpusD', name: 'ЛЭТИ: Корпус Д (профессорский дом, музей-квартира А. С. Попова)', nameEn: "LETI Corpus D: the professors' house with the Popov memorial flat",
    ids: ['r11983465'], osm: [], at: [-1607.7, -4381.1], note: 'look estimated (no photo of the building): cream stucco, rusticated ground floor' },
  { key: 'busts', name: 'ЛЭТИ: бюсты А. С. Попова и В. П. Вологдина, памятник погибшим студентам и сотрудникам', nameEn: 'LETI: busts of Popov and Vologdin, the war memorial',
    ids: [], osm: ['n10272936450', 'n10272936442', 'n6057829971'], at: [-1563, -4473], note: 'bronze figures from lib/figures.js on granite pedestals' },
  { key: 'fence', name: 'ЛЭТИ: ограда у юго-западного угла корпуса 1', nameEn: 'LETI: the low fence with pale piers round the south-west corner of Corpus 1',
    ids: [], osm: ['w141425875'], at: [-1755, -4300], note: 'plinth wall, stucco piers, black iron grille (photos 63, leti/02)' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));
