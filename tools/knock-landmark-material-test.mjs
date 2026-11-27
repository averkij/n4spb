// node tools/area.mjs vasilyevsky tools/knock-landmark-material-test.mjs
// The same authored parts go through the tile-atlas shader and the car physics.
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';

function checkGateBowls(ctx, THREE, season) {
  const bowls = ctx.knock.list.filter(r => r.parts.some(p => p.mesh?.name.startsWith('lmKir-bowls-')));
  assert.equal(bowls.length, 6, 'three bowls in front of each gate pavilion');
  assert.equal(new Set(bowls.map(r => r.item)).size, 6, 'each bowl has a separate collider');
  const matrix = new THREE.Matrix4(), point = new THREE.Vector3();
  for (const bowl of bowls) {
    assert.equal(bowl.kind, 'planter');
    assert.equal(bowl.items.length, 1);
    assert.equal(bowl.item.source.knock, bowl);
    let top = -Infinity, red = false, snow = false;
    for (const { mesh, index } of bowl.parts) {
      mesh.getMatrixAt(index, matrix);
      const { position, color } = mesh.geometry.attributes;
      for (let i = 0; i < position.count; i++) {
        const height = point.fromBufferAttribute(position, i).applyMatrix4(matrix).y - bowl.y;
        const r = color.getX(i), g = color.getY(i), b = color.getZ(i);
        top = Math.max(top, height);
        red ||= r > 0.25 && r > 3 * Math.max(g, b);
        // The concrete rim stops at 0.58 m. A pale top above it is the snow cap.
        snow ||= height > 0.6 && Math.min(r, g, b) > 0.5;
      }
    }
    if (season === 'winter') {
      assert.equal(red, false, 'winter bowl still has red bedding');
      assert(snow, 'winter bowl needs a pale snow cap above the rim');
      assert(top <= 0.72, `winter bowl reaches ${top.toFixed(2)} m`);
    } else {
      assert(red, 'summer bowl needs red bedding');
      assert(top > 0.85, `summer flower spikes reach only ${top.toFixed(2)} m`);
    }
  }
  for (const bowl of bowls) {
    assert.equal(bowl.state, 'stand', 'neighbouring bowls survive earlier hits');
    assert.equal(ctx.knock.hit(bowl.x, bowl.z, 45, 1, 0, 'planter'), bowl);
    assert.equal(bowl.state, 'fly');
    assert.equal(bowl.items.length, 0);
  }
}

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
  checkGateBowls(ctx, THREE, season);
  console.log(season, 'PASS: landmark materials, gate and fence atlas IDs, independent gate leaves and six seasonal bowls');
}
