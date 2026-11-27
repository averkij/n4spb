// The same gate stands in the overlap of the Kolomna and Narvsky pages.
import * as L from './layout.js';
import { buildGate } from './landmarksNarvsky/gate.js';
export { buildGate, gateFrame, OWNS_GROUPS } from './landmarksNarvsky/gate.js';

export function build(ctx) {
  const rec = L.groupMembers('narva-gate').find(b => b.id === 'w73174258');
  if (rec) buildGate(ctx, rec);
}
