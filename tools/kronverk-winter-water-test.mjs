// Run for each overlapping page, e.g. node tools/area.mjs kronverk tools/kronverk-winter-water-test.mjs
// and node tools/area.mjs aptekarsky tools/kronverk-winter-water-test.mjs.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { Player } from '../src/core/player.js';

const area = process.env.AREA;
assert(['kronverk', 'aptekarsky'].includes(area), 'run under tools/area.mjs kronverk or aptekarsky');
const modules = ['environment', 'streets', 'props', area === 'kronverk' ? 'landmarksKronverk' : 'grottoPool'];
const close = (a, b, message) => assert(Math.abs(a-b) < .002, message + ' (' + a + ' vs ' + b + ')');
const troughFootprints = [];
for (const season of ['summer', 'winter']) {
  const { ctx, L, THREE, errors } = await buildWorld({ modules, season });
  assert.deepEqual(errors, []);
  const winter = season === 'winter', ph = ctx.physics;
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
  ray.layers.enableAll();
  const hits = (meshes, x, z, from = 2) => {
    ray.set(new THREE.Vector3(x, from, z), down);
    return ray.intersectObjects(meshes, false);
  };
  ctx.scene.updateMatrixWorld(true);
  const liquids = [], ice = [];
  ctx.staticRoot.traverse(mesh => {
    if (/^(lmKr-water|env-water-)/.test(mesh.material?.name)) liquids.push(mesh);
    if (mesh.material?.name === 'grotto-ice') ice.push(mesh);
  });
  // Surveyed centre of OSM w609619503. Sample the open water around its central boulder.
  const cx = -1712.56, cz = -2467.39;
  assert(L.inPlay(cx, cz));
  for (const [dx, dz] of [[1.3,.2], [-1.6,.3], [.9,1.7], [.2,-2.1], [2.73,.11]]) {
    const x = cx+dx, z = cz+dz;
    const wet = hits(liquids, x, z), frozen = hits(ice, x, z);
    assert.equal(wet.length, winter ? 0 : 1, 'only the summer pool contains a water film');
    assert.equal(frozen.length, winter ? 1 : 0, 'only the winter pool contains an ice sheet');
    const y = (winter ? frozen : wet)[0].point.y;
    close(y, .12, 'pond surface above the path datum');
    close(ph.groundHeight(x,z,0,false), winter ? y : y-.02, 'support beneath the walker');
    if (winter) assert.equal(ph.waterLevel(x,z), null, 'ice has no liquid at the feet');
    else close(ph.waterLevel(x,z), y, 'summer wading level at the drawn film');
  }
  assert.equal(ph.waterLevel(cx+3.6,cz), null, 'bank stays dry');
  // Walk a chord of the pool, skirting the central boulder; a cylinder around
  // the whole pond, a stray environment tree or a quay wall will block it.
  const pawn = new Player(ctx.camera, { addEventListener(){}, requestPointerLock(){} }, ph, L.WORLD.play);
  pawn.enabled = true; pawn.clampXZ = L.clampToPlay; pawn.solidAt = L.insideBuilding;
  pawn.setPose(cx+4, cz+1.35, 90, 0, 0, {stand:true});
  pawn.keys.add('KeyW');
  let crossed = false;
  for (let i = 0; i < 220 && pawn.pos.x > cx-3.6; i++) {
    pawn.update(1/60);
    if (Math.abs(pawn.pos.x-cx)<.15) {
      close(pawn.pos.y, winter ? .12 : .10, 'player crosses the actual pool floor');
      crossed = true;
    }
  }
  assert(crossed && pawn.pos.x <= cx-3.6, 'player reached the far bank');

  if (area === 'kronverk') {
    const trough = ctx.services.landmarksKronverk.steregushchyFountain;
    const snow = ctx.staticRoot.getObjectByName('snow-filled-steregushchy-seacock');
    const flow = ctx.services.liveFountains?.records.find(f => f.id === 'steregushchy-seacock');
    assert.equal(!!snow, winter); assert.equal(!!flow, !winter);
    const film = winter ? [snow] : liquids.filter(m => m.material.name === 'lmKr-water');
    const footprint = [], [x,,z] = trough.landing;
    for (let dx = -1.53; dx <= 1.6; dx += .12) {
      for (let dz = -1.63; dz <= 1.63; dz += .10) {
        const [hit] = hits(film, x+dx, z+dz);
        footprint.push(!!hit);
        if (hit) {
          close(hit.point.y, trough.waterY+(winter ? .035 : 0), 'trough fill height');
          if (winter) close(ph.groundHeight(x+dx,z+dz,2,false),hit.point.y,'firm snow follows the drawn trough');
        }
      }
    }
    assert(footprint.filter(Boolean).length > 120);
    troughFootprints.push(footprint);
    if (winter) assert.equal(ph.waterLevel(x,z), null);
    else close(ph.waterLevel(x,z), trough.waterY, 'summer jet lands in receiving water');
  }
}
if (area === 'kronverk') assert.deepEqual(troughFootprints[0], troughFootprints[1], 'snow fits the real summer trough');
console.log('PASS', area, 'summer and winter grotto pool, path across both banks' + (area === 'kronverk' ? ', Steregushchy trough footprint' : ''));
