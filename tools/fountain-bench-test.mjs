// CPU regression for mapped benches inside the Swan Lake fountain in both cuts.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (!process.env.AREA) {
  for (const area of ['kronverk', 'aptekarsky']) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./area.mjs', import.meta.url)), area, fileURLToPath(import.meta.url)], { stdio: 'inherit' });
    assert.equal(result.status, 0, `${area} fountain bench regression`);
  }
} else {
  const { buildWorld } = await import('./lib/headless-world.mjs');
  const { ctx } = await buildWorld({ modules: [] });
  const { makeState } = await import('../src/world/props/state.js');
  const { FURNITURE } = await import('../src/world/data/city.js');
  // Isolate the fountain guard from road/tram fixtures: these bench nodes are
  // invalid regardless of any nearby carriageway nudging or footway rotation.
  ctx.services.streets = { net: { cover: () => -Infinity } };
  const S = makeState(ctx), ids = ['n13755010097', 'n13755016101', 'n13755016110'];
  const before = ctx.physics.items.length;
  for (const id of ids) {
    const bench = FURNITURE.find(f => f.id === id);
    assert.ok(bench, `mapped bench ${id}`);
    for (const yaw of [0, Math.PI / 4, Math.PI / 2]) {
      assert.equal(S.placeBench('benchWhite', bench.x, bench.z, yaw), false, `${id} must not stand in the basin`);
    }
  }
  // A long bench whose centre is on dry ground but whose end crosses the rim.
  assert.equal(S.placeBench('benchWhiteL', -1779, -2838.8, 0), false, 'full footprint clears the water/coping');
  assert.equal(S.svc.benches.length, 0);
  assert.equal(S.kinst.size, 0, 'rejected benches leave no render instances');
  assert.equal(ctx.physics.items.length, before, 'rejected benches leave no colliders');
  assert.equal(S.placeBench('benchWhite', -1782, -2838.8, 0), true, 'nearby dry bench remains available');
  assert.equal(S.svc.benches.length, 1);
  assert.equal(S.knockables.length, 1, 'accepted bench remains movable/breakable');
  assert.equal(ctx.physics.items.length, before + 1);
  const actual = await buildWorld({ modules: ['props'] });
  assert.deepEqual(actual.errors, []);
  const { makeFountainKeepout } = await import('../src/areas/fountain-keepout.js');
  const { mappedFountains } = await import('../src/world/props/fountains.js');
  const basin = mappedFountains().find(f => f.id === 'w946425790');
  const wet = makeFountainKeepout([basin]);
  const benches = actual.ctx.services.props.benches;
  assert.ok(benches.length > 100, 'the real props phase retains ordinary benches');
  for (const b of benches.filter(b => Math.hypot(b.x - basin.x, b.z - basin.z) < 15)) {
    for (let u = -b.len / 2; u <= b.len / 2; u += .2) for (const v of [-.3, 0, .3]) {
      assert.ok(!wet(b.x + Math.cos(b.rotY) * u + Math.sin(b.rotY) * v, b.z - Math.sin(b.rotY) * u + Math.cos(b.rotY) * v, .05), 'real props bench footprint clears the basin');
    }
  }
  assert.equal(actual.ctx.services.props.fountains.find(f => f.id === basin.id).status, 'animated', 'the reachable live fountain remains');
  const mansionFountain = actual.ctx.services.props.fountains.find(f => f.id === 'n10245075680');
  assert.ok(mansionFountain);
  if (process.env.AREA === 'kronverk') assert.notEqual(mansionFountain.status, 'specialist', 'mosque-only module cannot suppress the unclaimed mansion fountain');
  else assert.equal(mansionFountain.status, 'specialist', 'Aptekarsky keeps its authored mansion fountain');
  console.log(`PASS ${process.env.AREA}: 3 mapped basin benches and rim overlap rejected; dry knockable bench preserved; actual props ${benches.length} benches, fountain animated`);
}
