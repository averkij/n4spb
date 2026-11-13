// OSM station footprint and its elevated tower parts. Platform furniture remains
// permeable; the real square fountains stay with the shared mapped-fountain builder.
import { BUILDINGS } from '../data/city.js';

export const STATION_IDS = [...new Set(['r2123616', 'w158544845', 'w158544862', 'w314291447', 'w820662808',
  ...BUILDINGS.filter(b => b.parent === 'r2123616').map(b => b.id)])];
export const GROUPS_LIST = [
  { key: 'finlyandsky-station', name: 'Финляндский вокзал', nameEn: 'Finland Station', ids: STATION_IDS, osm: [], at: [286.9, -2578.1] },
  { key: 'finlyandsky-lenin', name: 'Ленин на броневике', nameEn: 'Lenin at Finland Station', ids: [], osm: ['r8850275'], at: [233.4, -2407.8] },
  { key: 'finlyandsky-platform-canopies', name: 'Перроны Финляндского вокзала', nameEn: 'Finland Station platforms', ids: ['w158544503', 'w158544582'], osm: ['r12715182'], at: [341, -2823.9] },
];
