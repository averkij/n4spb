// Verify one authoritative stop plan feeds furniture, service records and road markings.
// Run through tools/area.mjs <area> tools/stop-plan-test.mjs.
import assert from 'node:assert/strict';
import { world } from './traffic-harness.mjs';
import { planStops } from '../src/world/streets/stops.js';
import { wayAt } from '../src/world/streets/net.js';
import { BUS_STOPS } from '../src/world/data/city.js';
const { ctx } = await world(['streets']);
const svc = ctx.services.streets, planned = planStops(svc.net);
assert.equal(planned.length, svc.busStops.length);
const source = new Map(BUS_STOPS.map((s) => [s.id, s]));
let moved = 0;
for (let i = 0; i < planned.length; i++) {
  const p = planned[i], b = svc.busStops[i], q = wayAt(p.w, p.s), src = source.get(p.id);
  assert.equal(p.id, b.id);
  assert(Math.hypot(p.x - b.x, p.z - b.z) < 1e-7, 'furniture service and plan positions');
  assert.equal(p.s, b.s, 'markings and bay use planned arclength');
  const edge = p.side > 0 ? q.hR : q.hL, nx = -q.tz * p.side, nz = q.tx * p.side;
  assert(Math.hypot(b.bay.x - q.x - nx * (edge - 1.75), b.bay.z - q.z - nz * (edge - 1.75)) < 1e-7, 'traffic bay follows planned road position');
  if (src && Math.hypot(src.x - p.x, src.z - p.z) > 0.5) moved++;
}
assert(planned.length > 0 && moved > 0, 'test exercises relocated plans');
console.log(`PASS ${planned.length} stop plans match built furniture/services and road bays; ${moved} moved from mapped hints`);
