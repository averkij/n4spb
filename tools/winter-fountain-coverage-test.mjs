// Run through tools/area.mjs. Exercise the area's actual fountain owners and
// the generic fallback together, including plots on a road and aliased nozzles.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { mainModules } from './modules-list.mjs';
import { placeFountains, mappedFountains, SPECIALIST_FOUNTAINS } from '../src/world/props/fountains.js';
import { buildNet } from '../src/world/streets/net.js';
import { FORECOURT_SOURCE_FOUNTAINS } from '../src/world/landmarksMoskovskaya/library-forecourt-plan.js';

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
const librarySites = new Set();
if (modules.includes('landmarksMoskovskaya')) {
  const fountain = ctx.services.landmarksMoskovskaya.libraryFountain;
  assert.equal(fountain.bowls.length, 6, 'Chasha Znaniy has six upper bowls');
  assert.equal(fountain.animation.jets, 0, 'Chasha Znaniy has no winter jets');
  ctx.staticRoot.updateMatrixWorld(true);
  const meshes = [];
  ctx.staticRoot.traverseVisible(obj => { if (obj.isMesh) meshes.push(obj); });
  const ray = new THREE.Raycaster();
  ray.layers.enableAll();
  function checkLibrarySnow(x, z, y, label) {
    ray.set(new THREE.Vector3(x, y + 1.7, z), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObjects(meshes, false)[0];
    assert.equal(hit?.object.material?.name, 'rnb-basin-snow', label + ' has visible snow');
    assert(Math.abs(hit.point.y - y) < .002, label + ' snow is at its drawn level');
    assert(Math.abs(ctx.physics.groundHeight(x, z, y + .03, false) - y) < 1e-4,
      label + ' snow supports the player');
    assert(!ctx.physics.columnBlocked(x, z, .1, y + .03, y + 1.68), label + ' has standing room');
  }
  // The two original surveyed pool centres lie in opposite halves of today's common basin.
  for (const id of FORECOURT_SOURCE_FOUNTAINS) {
    const site = records.find(record => record.id === id);
    assert.equal(site?.owner, 'landmarksMoskovskaya', id + ' uses the library forecourt model');
    checkLibrarySnow(site.x, site.z, fountain.level, id);
    librarySites.add(id);
  }
  for (const bowl of fountain.bowls) {
    checkLibrarySnow(bowl.x, bowl.z, bowl.h - .14, 'upper bowl at ' + [bowl.x, bowl.z]);
  }
  checked += 1 + fountain.bowls.length;
}
for (const site of records) {
  if (librarySites.has(site.id)) continue;
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
const mapped = mappedFountains().filter(f => L.inPlay(f.x, f.z));
assert.deepEqual(records.filter(r=>r.status !== 'outside').map(r=>r.id).sort(), mapped.map(f=>f.id).sort());
if (mapped.length) assert(checked+flush>0, 'district has winter fountain coverage');
else assert.equal(snow.size, 0, 'no fountain snow outside mapped sites');
console.log(process.env.AREA, 'PASS', checked, 'reachable snow-filled bowls,', flush, 'dry flush fountains');
