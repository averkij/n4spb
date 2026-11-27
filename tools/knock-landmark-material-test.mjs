// node tools/area.mjs vasilyevsky tools/knock-landmark-material-test.mjs
// The same authored parts go through the tile-atlas shader and the car physics.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

for (const season of ['summer', 'winter']) {
  const { ctx, THREE, errors } = await buildWorld({
    season, modules: ['landmarksMakarova', 'landmarksSredny', 'landmarksKirova'],
  });
  assert.deepEqual(errors, []);
  const meshes = [];
  ctx.scene.traverse(o => {
    if (!o.isMesh && !o.isLine && !o.isPoints) return;
    for (const m of [].concat(o.material)) {
      assert(m?.isMaterial && typeof m.type === 'string', o.name);
    }
    if (o.isInstancedMesh) meshes.push(o);
  });
  const find = prefix => {
    const mesh = meshes.find(m => m.name.startsWith(prefix));
    assert(mesh, prefix);
    assert(mesh.material.visible && mesh.material.vertexColors && mesh.userData.knock, prefix);
    return mesh;
  };
  const seat = find('lmsredn-parkbenches-p0|');
  const paint = new THREE.Color().fromBufferAttribute(seat.geometry.attributes.color, 0);
  assert.equal(paint.getHex(), 0x8a4a30, 'linear painted bench colour');
  const panel = find('lmKir-fence-panel|'), gate = find('lmKir-gate-leaves-leaf|');
  assert.equal(gate.material, panel.material);
  assert(panel.material.alphaTest > 0);
  const tile = mesh => {
    const b = mesh.geometry.attributes.color.getZ(0) * 255;
    return Math.floor((b - Math.floor(b)) * 64);
  };
  assert.notEqual(tile(gate), tile(panel), 'gate leaf and repeating fence have different atlas tiles');
  assert(panel.geometry.attributes.uv.array.some(x => x > 1.5), 'the fence repeats its tile');
  const leaves = ctx.knock.list.filter(r => r.parts.some(p => p.mesh === gate));
  assert.equal(leaves.length, 2);
  const [a, b] = leaves;
  assert.equal(ctx.knock.hit(a.x, a.z, 45, 1, 0, 'fence'), a);
  assert.equal(a.state, 'fly');
  assert.equal(a.items.length, 0);
  assert.equal(b.state, 'stand');
  assert(b.items.length > 0);
  console.log(season, 'PASS: landmarks use Three materials, gate and fence atlas IDs, independent gate leaves');
}
