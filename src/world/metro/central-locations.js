import { DOORWAYS } from '../data/metro.js';

// Street ends of the OSM pedestrian routes. The station-side nodes of the
// Dostoyevskaya and Sadovaya routes lie inside the respective buildings.
export const centralExtraDoors = [
  { id:'vosstaniya-ligovsky', station:'vosstaniya', bldg:'r2404500', osm:'n1109163125', x:543.18, z:350.20, rotY:-1.38382, w:3.0, kind:'entrance' },
  { id:'vosstaniya-court', station:'vosstaniya', bldg:'r2404501', osm:'n1109163132', x:555.40, z:291.00, rotY:1.24905, w:2.8, kind:'exit' },
  { id:'vosstaniya-colonnade', station:'vosstaniya', bldg:'r2404501', osm:'n1109163144', x:537.43, z:292.31, rotY:-1.89255, w:2.8, kind:'exit' },
  { id:'vladimirskaya-kuznechny', station:'vladimirskaya', bldg:'w61738351', osm:'n5369186809', x:-150.09, z:533.87, rotY:2.92579, w:3.0, kind:'exit' },
  { id:'dostoevskaya-passage-in', station:'dostoevskaya', bldg:'w38578114', osm:'n7473625771', x:-264.04, z:453.44, rotY:2.8129, w:2.85, kind:'entrance', steps:4 },
  { id:'dostoevskaya-passage-out', station:'dostoevskaya', bldg:'w38578114', osm:'n3773175874', x:-266.81, z:478.12, rotY:.6876, w:2.45, kind:'exit', steps:3 },
  { id:'admiralteyskaya-east', station:'admiralteyskaya', bldg:'w52153127', osm:'n5464314995', x:-2022.33, z:-402.58, rotY:2.19357, w:2.4, kind:'entrance' },
  { id:'gostiny-sadovaya', station:'gostiny', bldg:'r1147588', osm:'n6226095895', x:-998.172, z:-125.289, rotY:.6974, w:3.15, kind:'entrance' },
];
// The historical door IDs anchor the working platform; the strip originally
// associated the two western arches with the next OSM doorway to the east.
const admiralStreetRoles = {
  'admiralteyskaya-in': { osm: 'n5464315008', kind: 'exit' },
  'admiralteyskaya-in2': { osm: 'n5464314991', kind: 'entrance' },
};
export const centralStreetDoors = [
  ...DOORWAYS.map(d => admiralStreetRoles[d.id] ? { ...d, ...admiralStreetRoles[d.id] } : d),
  ...centralExtraDoors,
];
export const centralMetroEntranceIds = new Set([
  ...centralStreetDoors.map(d=>d.osm),
  'n7473625773', 'n5628361779',
  'n9177013551', 'n9177013556', 'n808071481', 'n808071410',
]);
