// Run through tools/area.mjs. Exercise the area's actual fountain owners and
// the generic fallback together, including plots on a road and aliased nozzles.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { mainModules } from './modules-list.mjs';
import { placeFountains, SPECIALIST_FOUNTAINS } from '../src/world/props/fountains.js';
import { buildNet } from '../src/world/streets/net.js';

const modules = mainModules().filter(name => Object.values(SPECIALIST_FOUNTAINS).includes(name));
const { ctx, L, THREE, errors } = await buildWorld({ modules, season: 'winter' });
assert.deepEqual(errors, []);
ctx.services.streets = { net: buildNet(L) };
const root = new THREE.Group();
ctx.addStatic(root);
const { records } = placeFountains({ ctx, root, svc: {}, stats: {}, tris: 0, levelAt: () => 0 });
assert.equal(ctx.services.liveFountains?.records?.length ?? 0, 0, 'no live spray in winter');
const snow = new Map();
ctx.staticRoot.traverse(obj => {
  if (!obj.name.startsWith('snow-filled-')) return;
  const id = obj.name.slice('snow-filled-'.length);
  assert(!snow.has(id), 'duplicate snow surface for ' + id);
  snow.set(id, obj);
});
let checked = 0, flush = 0;
for (const site of records) {
  const ids = site.status === 'specialist' ? [site.id] : (site.effects ?? []).map(f => f.id);
  for (const id of ids) {
    const mesh = snow.get(id);
    if (site.flush) {
      flush++;
      assert(!mesh, id + ' dry deck stays flush with the street');
      continue;
    }
    assert(mesh, id + ' has snow in its bowl');
    // Sample triangle interiors. A central pedestal may stand over some of
    // them, but the bowl must contain at least one reachable patch of snow.
    const g = mesh.geometry, pos = g.attributes.position;
    let supported = false;
    for (let i = 0; i < g.index.count && !supported; i += 3) {
      const vertices = [0,1,2].map(j => g.index.getX(i+j));
      const x = mesh.position.x + vertices.reduce((n,v) => n+pos.getX(v)/3,0);
      const z = mesh.position.z + vertices.reduce((n,v) => n+pos.getZ(v)/3,0);
      const y = mesh.position.y;
      supported = Math.abs(ctx.physics.groundHeight(x,z,y+.03,false)-y)<1e-4
        && !ctx.physics.columnBlocked(x,z,.1,y+.03,y+1.68);
    }
    assert(supported, id + ' has a walkable snow surface');
    checked++;
  }
}
assert(checked+flush>0, 'district has winter fountain coverage');
console.log(process.env.AREA, 'PASS', checked, 'reachable snow-filled bowls,', flush, 'dry flush fountains');
