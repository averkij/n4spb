// bridges/sites-pal.js - PURE DATA: the three small OSM-deck bridges of Palace-Liteyny that the strip's tables do not carry (docs/AREAS.md 15.z): the Prachechny (Laundry) Bridge over the mouth of the Fontanka, the Upper Swan
// Bridge over the Swan Canal at the Neva and the 2nd Engineer Bridge over the castle moat.  Their deck polygons / ways are in the data of Palace-Liteyny only (BRIDGES r3808074, r3808095, r15750441), so the area appends their
// sub-groups (bridges/groups-pal.js) to its GROUPS.bridges and sites.js builds exactly the ones an area lists (the strip and the other areas build none).  Frame as in sites.js: the origin is the middle of the OSM road way,
// +u along it (b = the compass bearing of the way), +v across; v0 / v1 = the two faces taken from the deck polygon of the relation, the zones from the ways (the asphalt of the street is w / 2 each side: the road
// meets the deck without a step, the pavements = the two footway ways at v about -6.5 / +5.5 (Prachechny), -6.8 / +6.3 (Upper Swan), -4.1 / +4.5 (2nd Engineer)).  The styles are the ones of the Mars Field reach kit:
// 'arch3' (the Laundry Bridge: three unequal arches, solid rolled parapet, lucarnes + cutwaters, + granite corner posts here), 'swan-upper' (grey-pink humpback arch, solid parapet) and 'eng2' (styles-pal.js).
export const PAL_SITES = [
  { id: 'prachechny', name: 'Прачечный мост', nameEn: 'Prachechny Bridge (Laundry)', kind: 'road', style: 'arch3', stone: true, posts: true, water: 'r1201709', ww: 'fontanka',
    cx: -828.9, cz: -1717.1, b: 246.86, v0: -8.4, v1: 8.0, spans: [9.6, 12.6, 9.6], crowns: [-0.8, -0.5, -0.8], pier: 2.2,
    zones: [[-8.4, -6, 'pave'], [-6, 6, 'asphalt'], [6, 8.0, 'pave']], hump: 0.2, soffitCrown: -0.5, spring: 0.45, at: [-829, -1717] },
  { id: 'swan-upper', name: 'Верхний Лебяжий мост', nameEn: 'Upper Swan Bridge', kind: 'road', style: 'swan-upper', stone: true, water: 'r2653741', ww: 'swan-canal',
    cx: -1069.3, cz: -1610.8, b: 246.8, v0: -8.4, v1: 7.5, bank: [-5.6, 5.8],
    zones: [[-8.4, -3.6, 'pave'], [-3.6, 3.6, 'asphalt'], [3.6, 7.5, 'pave']], hump: 0.4, soffitCrown: -0.4, spring: 0.2, at: [-1069, -1611] },
  { id: 'eng2', name: '2-й Инженерный мост', nameEn: '2nd Engineer Bridge', kind: 'road', style: 'eng2', look: 'swan-upper', stone: true, water: 'r15750440', ww: 'moat',
    cx: -636.8, cz: -863.9, b: 326.6, v0: -5.4, v1: 5.4,
    zones: [[-5.4, -3.6, 'pave'], [-3.6, 3.6, 'asphalt'], [3.6, 5.4, 'pave']], hump: 0.15, soffitCrown: -0.35, spring: 0.0, at: [-637, -864] },
];
