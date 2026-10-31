// Building claims stay with their specialist. This module replaces only the
// surveyed docks/crane structures, and adds loose cargo within mapped yards.
import { DOCKS, CRANE_RAILS, DOCK_CRANES } from './survey.js';
export const GROUPS_LIST = [
  { key: 'sea-gates-docks', name: 'Канонерский судоремонтный завод: плавучие доки', nameEn: 'Kanonersky Ship Repair Yard floating docks', ids: [], osm: DOCKS.map(d => d.id), at: [-7058.89, 2420.83] },
  // w668687516 crosses mapped warehouse footprints: its surviving crane is
  // outside that narrow polygon, so it is not claimed as a replaced structure.
  { key: 'sea-gates-cranes', name: 'Портовые краны Морских ворот', nameEn: 'Sea Gates port and dock cranes', ids: [], osm: [...CRANE_RAILS.filter(c => c.id !== 'w668687516').map(c => c.id), ...DOCK_CRANES.map(c => c.id)], at: [-7060, 3290] },
  { key: 'sea-gates-cargo', name: 'Контейнерные площадки порта', nameEn: 'Port container yards', ids: [], osm: [], at: [-6900, 4100] },
];
export const PAVED_RINGS = [];
