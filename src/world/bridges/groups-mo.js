// Provenance: the rows are copied from the source project 102_3d_piter, commit 0568f7af (src/world/bridges/groups.js lines 72 .. 82, 62 .. 64), for the Morskoy / Gavan / Dekabristov areas (docs/gdm-B.md); the helpers at the end are n4spb.
// bridges/groups-mo.js - PURE DATA: the sub-groups (claims) of the bridges of the west coast of Vasilyevsky Island and of the Petrovsky side that the Vasilyevsky area does not list (bridges/groups-vo.js is the one of Vasilyevsky and
// is imported by the old areas; THIS file is imported only by the three new areas, so a change here stales only their bakes through the import closure):
//   korablestroiteley  the Shipbuilders' Bridge (arch.js, sites-vo2.js VO2_SITES + styles5.js 'korable', its four corner stairs through pits.js)
//   smol1 .. smol4     the four bridges over the arms of the Smolenka mouth (arch.js + styles5.js 'mouth'; the 3rd and 4th have a wide stair beside the south-west abutment: pits.js)
//   whsd               the Western High-Speed Diameter: the twin viaduct decks, the at-grade stretch, the portals, the pylons (bridges/whsd.js, whsd-ground.js, cutting.js; every area builds the part of the line that lies in its data extent)
//   whsd-crossings     the decks that cross the at-grade WHSD (the Mikhmanskaya overpass and the park footbridges: their invisible fallback decks are released)
//   betancourt, serny-bridge   the Betancourt Bridge and the Serny Bridge of the Petrovsky side (bridges/petrovsky/*.js), Dekabristov Island
// An area module takes the rows it needs with `only(GROUPS_MO, [...])` (src/areas/<id>/area.js), the pit rings of its bridges with `pitsOf` of groups-vo.js (src/areas/<id>/rings.js).
import { pitsOf } from './groups-vo.js';
import { bank as cuttingBank } from './cutting.js';

export const GROUPS_MO = [
  { key: 'korablestroiteley', name: 'мост Кораблестроителей', nameEn: 'Korablestroiteley Bridge (Smolenka)', ids: [], osm: ['r5574927', 'w374757408', 'w374757414', 'w374757413', 'w374757402', 'w1102801992', 'w1161949783'], at: [-7532, -1948], note: 'RC frame, 6 lanes, median, granite pedestals with lamp poles, black lattice railing, four wide corner stairs (the OSM steps w1102801992 / w1161949783 are replaced by the flights of stairs.js)' },
  { key: 'smol1', name: '1-й Смоленский мост', nameEn: '1st Smolensky Bridge', ids: [], osm: ['w452791087', 'w350477983'], at: [-8060, -2005], note: 'pale frame bridge over the left arm of the mouth, sheet-metal fascia, granite parapets' },
  { key: 'smol2', name: '2-й Смоленский мост', nameEn: '2nd Smolensky Bridge', ids: [], osm: ['w452791047', 'w350477982'], at: [-8009, -2182], note: 'pale frame bridge over the right arm of the mouth' },
  { key: 'smol3', name: '3-й Смоленский мост', nameEn: '3rd Smolensky Bridge', ids: [], osm: ['w300952664', 'w1419130491', 'w1216234891', 'w1053534564', 'w1286773458', 'w1286773733'], at: [-7956, -1975], note: 'wide granite plaza deck over the left arm, a wide stair on each bank beside the south-west abutment (the OSM steps w1286773458 / w1286773733 are replaced by the flights of stairs.js)' },
  { key: 'smol4', name: '4-й Смоленский мост', nameEn: '4th Smolensky Bridge', ids: [], osm: ['w300952668', 'w362259166', 'w1286551406', 'w532906970', 'w533214696'], at: [-7903, -2152], note: 'wide granite plaza deck over the right arm, a wide stair on each bank beside the south-west abutment (the OSM steps w532906970 / w533214696 are replaced by the flights of stairs.js)' },
  { key: 'whsd', name: 'Западный скоростной диаметр', nameEn: 'Western High-Speed Diameter (viaduct decks, bridges/whsd.js)', ids: [], osm: ['w688149995', 'w688149996', 'w119176958', 'w373871040'], at: [-7840, 150], note: 'twin pale box-girder viaduct from the end of the open cutting over the Gulf shore to the Korabelny cable-stayed bridge (pylons 124 m), tunnel portals' },
  // the decks that cross the at-grade WHSD (bridges/whsd-ground.js): the Mikhmanskaya street overpass (OSM decks w1257246775 / w1257246770) and the two park footbridges (w1428211376 / w1428213485), all over the dry
  // motorway corridor, not over water. Their invisible fallback decks (environment/quay.js: a walk box + two 0.5 m parapets) stood across the motorway; the streets of the island are flat, so the crossing is at street level
  // and the corridor is open under it. ONLY the deck polygons are claimed: the street ways and the footways on them stay streets' (drawn flat as before).
  { key: 'whsd-crossings', name: 'Мичманская улица: путепровод и пешеходные мосты над ЗСД', nameEn: 'Mikhmanskaya overpass and the two park footbridges over the WHSD (decks only: the crossing is at street level)', ids: [], osm: ['w1257246775', 'w1257246770', 'w1428211376', 'w1428213485'], at: [-8242, -1625], note: 'the invisible fallback decks are released so that the at-grade motorway can be crossed; the street ways stay streets\'' },
  // ---- the Petrovsky side (bridges/petrovsky.js; source groups.js lines 62 .. 64)
  { key: 'betancourt', name: 'мост Бетанкура', nameEn: 'Betancourt Bridge (cable-stayed, 917 m, bank to bank: bridges/petrovsky/betancourt.js)', ids: [], osm: ['w409159831', 'w409159832', 'w589195047', 'w590176833', 'w758386928', 'w641971736', 'w641971737', 'w641971739', 'w641971740'], at: [-4600, -3040], note: 'the approach viaduct on Petrovsky Island, the cable-stayed span with two pylon portals over the Malaya Neva channel, the girder over Serny Island and the south channel, the ramp to Dekabristov Island; the car crosses' },
  { key: 'serny-bridge', name: 'Серный мост', nameEn: 'Serny Bridge (18.7 m beam bridge, 13 m)', ids: [], osm: ['w589319945', 'w588474209', 'w589319941', 'w589319943'], at: [-4930, -2551], note: 'two-lane beam bridge over the Serny - Petrovsky channel, granite-faced abutments, 1.1 m railing' },
  // the WHSD cable-stayed bridge over the Petrovsky fairway: skyline scenery, the source's group list does not claim its ways (it draws it without owning them: the motorway class is no drivable class of streets); the key only gates the builder
  { key: 'whsd-petrovsky', name: 'Мост через Петровский фарватер (ЗСД)', nameEn: 'WHSD cable-stayed bridge over the Petrovsky fairway (skyline, bridges/petrovsky/whsd.js)', ids: [], osm: [], at: [-7540, -3800], note: 'two white 124 m pylons, 580 m, scenery without a walk floor' },
];

/** the rows of GROUPS_MO with the given keys, in the order of the list; `over` = { key: { osm, at ... } } replaces fields of a row for ONE area: a territory holds only part of the OSM ids of a bridge (the data cut of an area has what touches its
 *  extent: the Mikhmanskaya overpass is in Morskoy only, the viaduct ways in Morskoy and Gavan, the at-grade ways and the tunnel in Dekabristov), and tools/landmarks-groups-check.mjs wants every claimed id in the data and `at` inside it */
export const mo = (keys, over = {}) => GROUPS_MO.filter((g) => keys.includes(g.key)).map((g) => (over[g.key] ? { ...g, ...over[g.key] } : g));
/** { WATER_RINGS, KEEP_OUT, PAVED_RINGS } of an area's bridges of this file: the stair pits of the listed bridges (`pitPrefixes`: 'korablestroiteley-', 'smol3-', 'smol4-') and, with `cutting`, the grass embankments of the open cutting of the at-grade WHSD (PAVED_RINGS: no trunks, hedges,
 *  beds or tufts on them; a ring that lies outside the area is harmless: claims.js clips to the data) */
export const ringsOf = (pitPrefixes, { cutting = false } = {}) => {
  const r = pitsOf(pitPrefixes);
  return { WATER_RINGS: r.WATER_RINGS, KEEP_OUT: r.KEEP_OUT, PAVED_RINGS: r.PAVED_RINGS.concat(cutting ? cuttingBank().map((b) => b.ring) : []) };
};
