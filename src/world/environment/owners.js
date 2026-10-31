// Area-scoped compatibility for source landmark hand-over queries. Importing
// whole-city owners would drag unrelated districts into every northern scene.
import * as AREA from '../area.js';
const flat = r => Array.isArray(r?.[0]) ? r.flat() : r;
export const sightWater = () => (AREA.WATER?.ownerRings||[]).map(w=>({...w,o:flat(w.ring||w.o)}));
export const sightBanks = () => (AREA.WATER?.bankRings||[]).map(w=>({...w,o:flat(w.ring||w.o)}));
export const sightKeepOut = () => AREA.WATER?.keepOut||[];
export const sightPaved = () => AREA.PAVED_RINGS||[];
