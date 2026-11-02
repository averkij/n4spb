// Architectural parts worth retaining in the cross-river panorama. These use
// the existing researched models; grounds, fixtures and population stay local.
import { GROUPS_LIST as F } from '../../src/world/landmarksFortress/groups.js';
import { GROUPS_LIST as S } from '../../src/world/landmarksStrelka/groups.js';
import { GROUPS_LIST as U } from '../../src/world/landmarksUniversity/groups.js';
import { GROUPS_LIST as I } from '../../src/world/landmarksI/groups.js';
import { GROUPS_LIST as H } from '../../src/world/landmarksH/groups.js';
export const RIVERFRONT_SOURCES = [
  ['landmarksFortress',F.filter(g=>g.ids.length)],
  ['landmarksStrelka',S.filter(g=>g.ids.length)],
  ['landmarksUniversity',U.filter(g=>g.ids.length)],
  ['landmarksI',I.filter(g=>g.ids.length)],
  ['landmarksH',H.filter(g=>g.ids.length&&g.key!=='bronze-horseman')],
];
