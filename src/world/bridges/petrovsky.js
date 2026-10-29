// Provenance: adapted from the source project 102_3d_piter, commit 0568f7af (src/world/bridges/petrovsky.js), for Dekabristov Island (docs/gdm-B.md).
// bridges/petrovsky.js - the bridges of the Petrovsky side that Dekabristov Island holds (the source's "bridges-petrovsky" group, docs/research/petrovsky-bridges-2026.md of the source project):
//   * the BETANCOURT BRIDGE, complete (petrovsky/betancourt.js: 917 m, the approach viaduct on Petrovsky Island, the cable-stayed span with its two pylon portals and 48 stays, Serny Island, the south channel, the ramp to Dekabristov
//     Island): drivable (the car crosses) and walkable bank to bank
//   * the SERNY BRIDGE (petrovsky/serny.js: 18.7 m beam bridge, 13 m, two lanes, between the end of the Makarova embankment and Serny Island)
//   * the WHSD fairway bridge pylons and spans (petrovsky/whsd.js: skyline scenery over the Petrovsky fairway, two white 124 m pylons)
// The Bolshoy Petrovsky Bridge of the source's list lies outside every territory of the new areas and is not ported.
// LIST = [{ id, name, nameEn, build(env) -> B }]: bridges.js builds each with its own Parts where the area claims the id (`BRIDGE_GROUP_KEYS`, bridges/groups-mo.js) and publishes it (list entry, deckY, masts).
import { buildBetancourt } from './petrovsky/betancourt.js';
import { buildSerny } from './petrovsky/serny.js';
import { buildWhsdPetrovsky } from './petrovsky/whsd.js';

export const LIST = [
  { id: 'betancourt', name: 'мост Бетанкура', nameEn: 'Betancourt Bridge', build: buildBetancourt },
  { id: 'serny-bridge', name: 'Серный мост', nameEn: 'Serny Bridge', build: buildSerny },
  { id: 'whsd-petrovsky', name: 'Мост через Петровский фарватер (ЗСД)', nameEn: 'WHSD cable-stayed bridge over the Petrovsky fairway (skyline)', build: buildWhsdPetrovsky },
];
