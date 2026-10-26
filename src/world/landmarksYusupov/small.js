// landmarksYusupov/small.js - the small service buildings of the estate that the group claims (OSM w70732352, w70732354, w123246602; one storey in OSM, not photographed: plain ochre blocks with small windows,
// flat red-brown roofs).  w123243375 (the gate block) is drawn by courtyard.js, w123243368 (gate-house) by pavilion.js.
import { BUILDINGS } from '../data/city.js';
import { buildHouse } from './house.js';

export function build(K) {
  const M = K.M;
  const spec = [['w70732352', 5.2], ['w70732354', 5.0], ['w123246602', 4.2]];
  for (const [id, hc] of spec) {
    const rec = BUILDINGS.find((b) => b.id === id); if (!rec) continue;
    buildHouse(K, { name: id, recs: [rec], hc, wall: M.C.wall, court: M.C.wall, plinth: 0.5, plinthMat: M.granite, floors: [hc - 0.6], courtPitch: 3.6, roofMat: M.roofDark, railing: false, collideH: hc + 1 });
  }
}
