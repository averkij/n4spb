// landmarksAcademy/groups.js - the layout.GROUPS sub-groups of module landmarksAcademy (pure data, no imports: layout.js merges them). Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parts parents], osm: [non-building OSM ids], at: [x, z], note }. Claim only what the module really draws (dossier docs/research/academy.md 8.1).
// A part of the module is built only when its key is in GROUPS_LIST (landmarksAcademy.js PARTS): ON lists the parts that exist, flip a claim on together with its part.
// NOT claimed on purpose: the footways, the lamp nodes, the roads, the Rumyantsev side, the ordinary houses of academy-houses.json, the courtyard wing w82802115 and the garages (they stay generic).
const ON = ['academy-of-arts', 'sphinx-pier', 'academic-garden', 'trezzini-square', 'dom-akademikov'];

const ALL = [
  { key: 'academy-of-arts', name: 'Императорская Академия художеств', nameEn: 'Imperial Academy of Arts (1764-88): outline with five courts, front centre with the portico and the dome of Minerva, the rear centre with the second dome',
    ids: ['r165182'], osm: ['n8075917053', 'n1271441034'], at: [-3431, -597],
    note: 'relation r165182 (32 outer vertices + 5 holes); the parts w866473808 (front pavilion body), w866449061 (front dome circle) and w866449060 (rear dome circle) follow through the parent id; the nodes of Minerva n8075917053 and of the Shuvalov monument n1271441034 are drawn by the module' },
  { key: 'sphinx-pier', name: 'Египетские сфинксы и пристань', nameEn: 'Egyptian sphinx pier (Thon 1831-34): stair pit in the Neva wall, benches with griffins, lamp columns, two sphinxes on red-granite pedestals',
    ids: [], osm: ['w628771368', 'n1191476119', 'n1191476126', 'w1172768022', 'w1172768024', 'w1172768025'], at: [-3378, -507],
    note: 'the steps way w628771368 is drawn by streets as a flat strip across the quay wall: claiming removes it; the sphinx nodes only clear grass; the retaining-wall pieces have no generic consumer (claimed for safety); the OSM pier relation r15853954 is NOT baked (nothing to claim: its outline is the WATER_RINGS toe)' },
  { key: 'academic-garden', name: 'Академический сад', nameEn: 'Academic Garden: the column of 1847, the Klodt and Khetagurov statues, the garden pavilion, the Mosaic and Battle-painting workshops, lawns, old trees, the fence with its gates',
    ids: ['w82802146', 'w82802189', 'w82802132'], osm: ['w111640487', 'n1271393054', 'n1271393055', 'n1271393056'], at: [-3496, -698],
    note: 'garden pavilion complex w82802146 (parts w957243310 / 11 / 21 / 22 follow), Mosaic workshop w82802189, Battle workshop w82802132 (+ part w867059265); the paths stay with streets' },
  { key: 'trezzini-square', name: 'Площадь Трезини: дом Трезини, дом Черкасского, памятник', nameEn: 'Trezzini Square: the Trezzini house (hotel), the Cherkassky house in its facade banner, the Trezzini monument',
    ids: ['w82802160', 'w82802097'], osm: ['n2586283111'], at: [-3545, -505],
    note: 'Trezzini house w82802160, Cherkassky house w82802097 (parts w982044280 / 85 / 94 follow), monument node n2586283111; the square, the roads and the bridge landing stay with streets / bridges' },
  { key: 'dom-akademikov', name: 'Дом академиков', nameEn: 'House of Academicians (Volkov house): 13 axes, portico of four fluted Doric columns',
    ids: ['w79566434', 'w975447630'], osm: [], at: [-3678, -488], note: 'building w79566434 (7-я линия 2/1, Lt Schmidt emb. 1) and the gymnasium wing w975447630' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));

// ---- hand-over to environment (environment/owners.js): active only while the module has claims, so the sphinx pit is switched on together with its part
const PIER_ON = ON.includes('sphinx-pier');
/** the stair pit AND the toe of the pier: academy (u, v) (-20.4, 104.3) (18.0, 104.3) (18.0, 109.8) (19.9, 109.8) (19.9, 112.0) (-22.1, 112.0) (-22.1, 109.8) (-20.4, 109.8).  The OSM pier polygon r15853954 is cut out of the water polygon (the 2 m strip v 109.8..111.8 would be LAND at street level with a quay wall at its edge): the whole ring counts as Neva water (a hole in the ground, the quay opens exactly there); pier.js draws the flights, benches, landing and cheek walls over it */
export const WATER_RINGS = PIER_ON ? [{ id: 'sphinx-pit', key: 'neva', ring: [[-3397.2, -501.2], [-3364.0, -520.5], [-3361.2, -515.8], [-3359.6, -516.7], [-3358.5, -514.8], [-3394.8, -493.7], [-3395.9, -495.6], [-3394.4, -496.4]] }] : [];
/** no generated descent, landing stage or boat on the pier front */
export const KEEP_OUT = PIER_ON ? [{ id: 'sphinx-pier', c: [-3379.0, -508.1], ax: [0.8643, -0.5030], hl: 27, hw: 7 }] : [];

// ground the module keeps free of vegetation: the strip between the Academy front and the quay (the real embankment has lamps and a railing but no trees there)
export const PAVED_RINGS = [[[-3472, -511.2], [-3340.6, -587.7], [-3314.7, -543.3], [-3446.1, -466.8]]];
