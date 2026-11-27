// Shallow ornamental basin in Alexander Park, shared by the Kronverk and
// Aptekarsky pages. Street datum is 0, and the stone bed is just below the lip.
import * as THREE from 'three';
import { WATER } from './data/city.js';
import { Parts } from './landmarksKronverk/kit.js';
import { frustum } from './landmarksKronverk/geo.js';
import { registerLOD } from '../core/spatial.js';

export function build(ctx) {
  const ring = WATER.find(w => w.id === 'w609619503')?.polys[0].o;
  if (!ring) return;
  let x = 0, z = 0;
  for (let i = 0; i < ring.length; i += 2) { x += ring[i]; z += ring[i + 1]; }
  x /= ring.length / 2; z /= ring.length / 2;
  const radius = 2.8, waterY = 0.12, bedY = 0.10, winter = ctx.season === 'winter';
  const surface = winter ? ctx.mat.toon('#afc8d3', { name: 'grotto-ice', paint: 0.08 }) :
    ctx.mat.toon('#3f6a86', { name: 'lmKr-water', emissive: '#0c2030', emissiveIntensity: 0.25, transparent: true, opacity: 0.9 });
  const rock = ctx.mat.toon('#9a8c86', { name: 'lmKr-rock', paint: 0.08 });
  const rockD = ctx.mat.toon('#857871', { name: 'lmKr-rockD', paint: 0.08 });
  const P = new Parts();
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, s = 0.85 + (i * 7 % 5) * 0.07;
    P.push(x + Math.cos(a) * 3.05, 0, z + Math.sin(a) * 3.05, a * 1.7);
    frustum(P, i % 2 ? rock : rockD, 0, 0, 0, 0.42*s, 5, 0.55*s, 0.38*s, 0, 1, 1, { capTop: rock });
    P.pop();
  }
  // A single horizontal face supplies both the drawn film and its exact footprint.
  const rim = Array.from({ length: 20 }, (_, i) => {
    const a = i * Math.PI / 10;
    return [x + radius * Math.cos(a), z + radius * Math.sin(a)];
  });
  P.cap(surface, rim, waterY, true, 2);
  P.col(rockD, x, z, 0, bedY, radius+0.05, radius+0.05, 20, true);
  frustum(P, rock, x, z, bedY, 0.5, 6, 0.6, 0.3, 0.4, 1, 1, { capTop: rockD });

  const group = new THREE.Group(); group.name = 'grotto-pool';
  const meshes = P.build(group, { name: 'grotto-pool-mesh' });
  ctx.addStatic(group);
  group.updateMatrixWorld(true);
  for (const mesh of meshes) registerLOD(mesh, 220);
  const floorY = winter ? waterY : bedY;
  for (let i = 0; i < rim.length; i++) {
    const a = rim[i], b = rim[(i+1) % rim.length];
    ctx.physics.addWalkTriangle([[x,floorY,z], [a[0],floorY,a[1]], [b[0],floorY,b[1]]], 0.12);
  }
  if (!winter) ctx.physics.addWater({ ring: rim.flat(), level: waterY });
  ctx.physics.addCylinder(x, z, 0.58, bedY, 0.5);
  return [x, z];
}
