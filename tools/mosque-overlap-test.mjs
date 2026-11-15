// CPU regression: the mosque must use its authored silhouette in both overlap pages.
// Run directly for both areas, or through tools/area.mjs for one area.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (!process.env.AREA) {
  for (const area of ['kronverk', 'aptekarsky']) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./area.mjs', import.meta.url)), area, fileURLToPath(import.meta.url)], { stdio: 'inherit' });
    assert.equal(result.status, 0, `${area} mosque overlap regression`);
  }
} else {
  const { buildWorld } = await import('./lib/headless-world.mjs');
  const { ctx, L, THREE, built, errors } = await buildWorld({ modules: ['landmarksTroitskaya'] });
  const { ownedGroups, isOwned } = await import('../src/world/lib/claims.js');
  assert.deepEqual(errors, []);
  assert.deepEqual(built, ['landmarksTroitskaya'], 'the live area actually loads the specialist');
  const owned = await ownedGroups(ctx);
  for (const id of ['w28712430', 'w200396162', 'w200396163', 'w200396164']) {
    assert.ok(L.buildingById(id), `${id} is present in the overlap data`);
    assert.equal(L.claimedBy(id), 'landmarksTroitskaya');
    assert.ok(isOwned(owned, id), `${id} must not render as a generic city extrusion`);
  }
  const svc = ctx.services.landmarksTroitskaya, mosque = svc.mosque;
  assert.equal(mosque.minarets.length, 2);
  if (process.env.AREA === 'kronverk') {
    assert.deepEqual(Object.keys(svc.parts), ['mosque'], 'no unclaimed Troitskaya neighbours are drawn');
    assert.ok(svc.triangles < 20000, 'mosque-only addition remains bounded');
    assert.ok(!owned.has('kshesinskaya'), 'the neighbouring mansion remains with the existing city builder');
  }
  // Inspect actual transformed vertices, not just the landmark service metadata.
  // This catches a claimed-but-missing dome or either truncated minaret.
  const targets = [{ x: mosque.centre[0], z: mosque.centre[1], radius: 9, minY: 36 },
    ...mosque.minarets.map(({ x, z }) => ({ x, z, radius: 3, minY: 48 }))];
  const maxima = targets.map(() => -Infinity), point = new THREE.Vector3(), instance = new THREE.Matrix4(), matrix = new THREE.Matrix4();
  ctx.staticRoot.updateMatrixWorld(true);
  ctx.staticRoot.traverse(mesh => {
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.attributes.position;
    for (let k = 0; k < (mesh.isInstancedMesh ? mesh.count : 1); k++) {
      if (mesh.isInstancedMesh) { mesh.getMatrixAt(k, instance); matrix.multiplyMatrices(mesh.matrixWorld, instance); }
      else matrix.copy(mesh.matrixWorld);
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(matrix);
        assert.ok(Number.isFinite(point.x + point.y + point.z), 'finite authored geometry');
        targets.forEach((target, j) => {
          if (Math.hypot(point.x - target.x, point.z - target.z) < target.radius) maxima[j] = Math.max(maxima[j], point.y);
        });
      }
    }
  });
  targets.forEach((target, j) => assert.ok(maxima[j] > target.minY, `${j ? 'minaret' : 'dome'} silhouette survives: ${maxima[j]}`));
  console.log(`PASS ${process.env.AREA}: mosque parent + 3 parts owned; dome/minaret tops ${maxima.map(y => y.toFixed(1)).join('/')}; ${Object.keys(svc.parts).join(',')}`);
}
