// landmarksBotanicalGarden/groups.js - the layout.GROUPS sub-groups of module landmarksBotanicalGarden (pure data, no imports: layout.js merges them).  Fields as in layout.js GROUPS:
// { key, name, nameEn, ids: [OSM building ids + parents], osm: [non-building OSM ids], at: [x, z], note }.  Claim only what the module really draws (dossier docs/research/aptekarsky-2026.md section 10);
// a part of the module is built only when its claim key is in GROUPS_LIST (landmarksBotanicalGarden.js PARTS), so the claims and the drawing cannot drift apart.
// NOT claimed on purpose: the greenhouse complex r1920691 and its 36 parts (landmarksBotanicalGreenhouses), r20395047 (a tourism relation), the Japanese garden polygon r14150174 (the environment
// draws its lawn; the module adds the structures by position), the paths / ponds / trees / beds (environment, streets), the park benches and lamps of OSM (props; the module draws its own along the
// alleys and publishes them as ctx.services.landmarksBotanicalGarden.benches / lamps so that props skips the OSM nodes at the same spots).
const ON = ['institute', 'director', 'staff', 'houses', 'ticket', 'gazebo', 'fence', 'peter', 'statues', 'japan', 'stolypin', 'furniture'];      // flipped on one by one as each part is built (full list: institute director staff houses ticket gazebo fence peter statues japan stolypin furniture)

const ALL = [
  { key: 'institute', name: 'Ботанический институт им. В. Л. Комарова (литера А)', nameEn: 'Komarov Botanical Institute main building (lit A, yellow stucco, giant columns, semicircular west porch)', ids: ['r14150140'], osm: [], at: [-1746, -4050],
    note: 'footprint r14150140 (the 4-storey body w617020776 and the one-storey annexes r14150138 / r14150139 follow through the parent id); the porch faces WEST (dossier 4.1b CRITIC)' },
  { key: 'director', name: 'Дом директора ботанического сада (литера Г)', nameEn: "Director's House (lit G): ochre clapboard, columned loggia, semicircular lunette", ids: ['w501013186'], osm: [], at: [-1346, -4354], note: 'w501013186, project of I. I. Charlemagne 1824 (W)' },
  { key: 'staff', name: 'Служебный дом, литера Б (Дитрих, 1912-14)', nameEn: 'Staff house lit B (Komarov lived here 1913-45)', ids: ['r2123950'], osm: [], at: [-1721, -4271], note: 'r2123950 + the 4-storey wing r6189481 (follows through the parent id)' },
  { key: 'houses', name: 'Служебные дома сада', nameEn: 'Small garden houses: the green clapboard house (photo 46), lit V, lit K, the lab lit M', ids: ['w28692704', 'r13561492', 'w28692702', 'w28692697'], osm: [], at: [-1560, -4300],
    note: 'w28692704 "Зелёный домик" (mint clapboard, taken for the house of photo 46), r13561492 lit V (+ r13561490 r13561491), w28692702 lit K, w28692697 lit M (laboratory)' },
  { key: 'ticket', name: 'Билетный павильон и летние ворота', nameEn: 'Ticket pavilion and the closed summer gate on Prof. Popova', ids: ['w141816493'], osm: ['n1552314688'], at: [-1832, -4017], note: 'w141816493 5.4 x 3.3 m round roof; gate n1552314688 (summer, closed, drawn by fence.js). The main gate n1552530759 is NOT claimed: it stands 2.6 m from the east wall of the staff house lit B and no photo of it exists [?] (review 2026-10-14: it was claimed but never drawn)' },
  { key: 'gazebo', name: 'Беседка на холме', nameEn: 'Hill-top gazebo (photo D9)', ids: ['w141260379'], osm: [], at: [-1271, -4093], note: 'w141260379 round roof, 41 m2' },
  { key: 'fence', name: 'Ограда Ботанического сада', nameEn: 'Bar fence of the garden (2 m, granite plinth) with gates', ids: [], osm: ['w1013078862', 'w1013078863', 'w419006539', 'w1013078866', 'w1013078869', 'w1013078859', 'w141816491', 'w842482041', 'w842482038'], at: [-1500, -4200],
    note: 'the 2 m bars ways of the garden perimeter; gates stay open at the main gate and the mapped public ones, private ones are closed leaves' },
  { key: 'peter', name: 'Бюст Петра Великого', nameEn: 'Bust of Peter the Great on a tree-trunk pedestal with the boulder plate', ids: [], osm: ['n4146659535'], at: [-1572, -4283], note: 'n4146659535 (bronze bust, trunk pedestal, flowerbowl, pink boulder with the bronze plate)' },
  { key: 'statues', name: 'Скульптуры сада', nameEn: 'Garden sculptures: Thinker, Japanese lantern, mushrooms, dinosaur', ids: [], osm: ['n13807794875', 'n9483250706', 'n13917690931', 'n13917693769'], at: [-1600, -4200],
    note: 'Thinker, Japanese lantern, Symbiosis (mushrooms), the small dinosaur; NOT claimed (not drawn: no photo, shape unknown [?]): Lenin n4188185554, Schnittke tribute n5833171745, Dance / Boreas / Warm-air stones n5833171747..49' },
  { key: 'japan', name: 'Японский сад: павильон и мост', nameEn: 'Japanese garden: pavilion, yatsuhashi plank bridge, lanterns, boulders (the garden polygon r14150174 stays with the environment)', ids: ['w413384047', 'w413742268'], osm: ['w413383847'], at: [-1410, -4295], note: 'structures by position inside r14150174; w413383847 = its slat fence ring; w413384047 / w413742268 = the two OSM roofs of the garden = the eaves of the two pavilions drawn here' },
  { key: 'stolypin', name: 'Памятник П. А. Столыпину (Аптекарская наб.)', nameEn: 'Stolypin obelisk (Marfeld 1908) with its small square', ids: [], osm: ['n4119369495'], at: [-1335, -4543], note: 'n4119369495 obelisk; the park polygon w158590791 stays with the environment' },
  { key: 'furniture', name: 'Скамейки и фонари сада', nameEn: 'Park benches and lamps of the garden', ids: [], osm: [], at: [-1500, -4150], note: 'benches / lamps along the alleys (published as services)' },
];
export const GROUPS_LIST = ALL.filter((g) => ON.includes(g.key));

// ---- hand-over to environment (environment/owners.js SIGHTS lists the modules that may export these; the lead adds landmarksBotanicalGarden there): ground that must stay free of the generic trunks, hedges, beds
// and grass tufts, so that the sights can be SEEN from walking height (photos 49 50: a straight alley, an open lawn and a few spruces beside it, not a woodland in front of the porch).  World metres
// (x, z) from frame.js (IB / DH) and the pavilion / gazebo / ticket frames; the numbers are written out because this file must not import (layout.js merges it).
export const PAVED_RINGS = [
  { id: 'institute-forecourt', ring: [-1757.1, -4055.1, -1752.1, -4042, -1781.7, -4030.9, -1786.7, -4044] },        // 14 x 32 m in front of the west porch, along its axis
  { id: 'director-lawn', ring: [-1350.5, -4340.4, -1334.7, -4346.8, -1325.9, -4325, -1341.7, -4318.6] },             // the lawn in front of the loggia of the Director's House
  { id: 'japan-pavilion', ring: [-1406.9, -4300.1, -1403.4, -4292.1, -1409.2, -4289.7, -1412.8, -4297.7] },
  { id: 'japan-pavilion-2', ring: [-1412.6, -4306.9, -1406.5, -4309.5, -1404.1, -4304.2, -1410.2, -4301.4] },
  { id: 'japan-bridge', ring: [-1430.5, -4293.8, -1424.5, -4293.8, -1424.5, -4283.2, -1430.5, -4283.2] },
  { id: 'ticket', ring: [-1837.2, -4018.2, -1829.7, -4020.7, -1827.3, -4013.6, -1834.9, -4011.1] },
  { id: 'gazebo', ring: [-1271.8, -4087.8, -1267.8, -4088.9, -1265.7, -4092.5, -1266.8, -4096.5, -1270.4, -4098.6, -1274.4, -4097.5, -1276.5, -4093.9, -1275.4, -4089.9] },
];
