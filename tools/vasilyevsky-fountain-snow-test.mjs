// Compare actual winter meshes to the independently drawn summer water films.
// node tools/area.mjs vasilyevsky tools/vasilyevsky-fountain-snow-test.mjs
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

assert.equal(process.env.AREA, 'vasilyevsky');
const modules = ['landmarksAndrew', 'landmarksMenshikov', 'landmarksVOStatues'];
const summer = await buildWorld({ modules });
const winter = await buildWorld({ modules, season: 'winter' });
assert.deepEqual(summer.errors, []);
assert.deepEqual(winter.errors, []);
const { THREE } = summer, water = [], down = new THREE.Vector3(0, -1, 0);
const ray = new THREE.Raycaster();
ray.layers.enableAll();
summer.ctx.staticRoot.updateMatrixWorld(true);
winter.ctx.staticRoot.updateMatrixWorld(true);
summer.ctx.staticRoot.traverse(mesh => {
  if (['lmAnd-water', 'lmmensh-water', 'lmvos-water'].includes(mesh.material?.name)) water.push(mesh);
});
const footprints = [
  ['n12201012355', 5, .17], ['n5808194383', 1.2, .045],
  ['w214409235', 2.7, .075], ['w214409237', 2.7, .075],
  ['w84045811', 4.1, .11], ['w84045881', 4.1, .11],
];
for (const [id, radius, step] of footprints) {
  const flow = summer.ctx.services.liveFountains.records.find(f => f.id === id);
  const snow = winter.ctx.staticRoot.getObjectByName('snow-filled-' + id);
  assert(flow && snow, id);
  let wet = 0, mismatch = 0;
  for (let dx = -radius + .013; dx <= radius; dx += step) {
    for (let dz = -radius + .021; dz <= radius; dz += step) {
      const x = flow.x + dx, z = flow.z + dz;
      ray.set(new THREE.Vector3(x, flow.group.position.y + .05, z), down);
      const drawnWater = ray.intersectObjects(water, false).some(hit => hit.distance < .051);
      const drawnSnow = ray.intersectObject(snow, false).length > 0;
      if (drawnWater) wet++;
      if (drawnWater !== drawnSnow) mismatch++;
    }
  }
  assert(wet > 60, id + ' summer film is measurable');
  assert.equal(mismatch, 0, id + ' snow must fit the entire drawn bowl and leave its surrounds dry');
}
const wall = summer.ctx.services.liveFountains.records.find(f => f.id === 'n5808194383');
const jet = wall.nozzles[0];
assert.equal(summer.ctx.physics.waterLevel(wall.x + jet.tx, wall.z + jet.tz), wall.group.position.y);
console.log('PASS all six authored fountain footprints; drawn water and snow match');
