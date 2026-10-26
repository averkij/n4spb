// bridges/groups-pal.js - PURE DATA: the sub-groups (claims) of the three small bridges of Palace-Liteyny (sites: bridges/sites-pal.js, docs/AREAS.md 15.z).  `osm` = the bridge relation (deck polygon) and its road and two footway
// ways: the module draws the deck itself, streets leaves it alone (the lanes of the road stay).  The area module of Palace-Liteyny appends them to its GROUPS.bridges; no other area lists them.
export const GROUPS_PAL = [
  { key: 'prachechny', name: 'Прачечный мост', nameEn: 'Prachechny Bridge (Laundry, the mouth of the Fontanka)', ids: [], osm: ['r3808074', 'w548349392', 'w420044392', 'w461739409'], at: [-829, -1717], note: 'three unequal pink-granite arches, solid rolled parapet, corner posts, lucarnes over the piers' },
  { key: 'swan-upper', name: 'Верхний Лебяжий мост', nameEn: 'Upper Swan Bridge (Swan Canal at the Neva)', ids: [], osm: ['r3808095', 'w548349395', 'w287052711', 'w287052712'], at: [-1069, -1611], note: 'grey-pink humpback arch, solid granite parapet' },
  { key: 'eng2', name: '2-й Инженерный мост', nameEn: '2nd Engineer Bridge (the castle moat)', ids: [], osm: ['r15750441', 'w466200209', 'w364227577', 'w466200212'], at: [-637, -864], note: 'shallow granite arch over the moat, black bar railing between granite posts' },
];
