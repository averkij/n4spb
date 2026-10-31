// Pure claims for the two researched coastal landmarks. OSM geometry is ODbL.
import { SITES } from './sites.js';

// This is shallow fountain water at +0.077 m, registered by the builder with
// Physics.addWater. It must not be a WATER.ownerRings entry: those are river
// descent cuts at the Neva's -3.4 m datum, which would excavate this park.
export const FOUNTAIN_WATER_BODIES = SITES.find(s => s.id === 'r5255799').polys.map((p, i) => ({ id: 'okrug65-mayak-water-' + i, o: p.o, h: p.h }));
export const PAVED_RINGS = FOUNTAIN_WATER_BODIES.map(p => Array.from({ length: p.o.length / 2 }, (_, i) => [p.o[i * 2], p.o[i * 2 + 1]]));

export const GROUPS_LIST = [
  {
    key: 'okrug65-piterland', name: 'Питерлэнд', nameEn: 'Piterland waterfront dome',
    ids: ['w55498111', 'w317789256', 'w317789257', 'w1041714585', 'w1041714586', 'w294050494', 'w886683713'], osm: [],
    at: [-7870.5, -5389.2],
    note: 'Current complete OSM footprint and all four building parts; 90 m ribbed translucent dome, 43 m rise above the 8 m drum, 27 m glass shopping wings. Exterior interpretation from architect and operator photographs.',
  },
  {
    key: 'okrug65-mayak', name: 'Колонна-маяк и фонтан', nameEn: 'Tricentenary lighthouse fountain',
    ids: [], osm: ['w163902553', 'r5255799'], at: [-8415.3, -5470.7],
    note: 'The real three-stage granite column and long fountain on the central ray of Park 300. No flags or flagpole. The basin is open, its low lips are walkable, its column and benches use knock physics.',
  },
];
