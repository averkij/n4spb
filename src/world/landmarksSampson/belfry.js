import * as THREE from 'three';
import { belfryMesh } from './belfry-mesh.js';

export function belfry(shell, detail, M, x, z) {
  const shapes = {};
  for (const [key, [positions, indices]] of Object.entries(belfryMesh)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.scale(.001, .001, .001);
    g.setIndex(indices);
    g.computeVertexNormals();
    shapes[key] = g;
  }
  shell.push(x, 31.22, z, 0);
  detail.push(x, 31.22, z, 0);
  for (let side = 0; side < 4; side++) {
    const yaw = side * Math.PI / 2, dx = 4.1 * Math.sin(yaw), dz = 4.1 * Math.cos(yaw);
    shell.geo(M.blueWall, shapes.pediment, dx, 0, dz, 0, yaw);
    shell.geo(M.white, shapes.cornice, dx, 0, dz, 0, yaw);
  }
  shell.geo(M.tent, shapes.tent);
  shell.geo(M.white, shapes.drum, 0, 8.05, 0);
  shell.geo(M.blue, shapes.cupola, 0, 9.42, 0, 0, 0, 0, .85);
  shell.cyl(M.gold, [0,10.80,0], [0,12.34,0], .065,.048,7);
  shell.cyl(M.gold, [-.45,11.76,0], [.45,11.76,0], .05,.05,6);
  shell.cyl(M.gold, [-.22,12.03,0], [.22,12.03,0], .035,.035,6);
  shell.cyl(M.gold, [-.26,11.34,0], [.26,11.19,0], .036,.036,6);
  // Three shrinking ranks of blind dormers set into the sloping facets.
  for (let side = 0; side < 8; side++) {
    const yaw = side*Math.PI/4, nx = Math.sin(yaw), nz = Math.cos(yaw);
    for (const [level, size] of [[2.15,.90],[4.10,.73],[5.72,.52]]) {
      const r = (4.32 - (level-.22)*3.41/7.5) * Math.cos(Math.PI/8) + .08;
      detail.geo(M.white, shapes.dormer, r*nx, level, r*nz, 0, yaw, 0, size);
      detail.geo(M.window, shapes.recess, r*nx, level, r*nz, 0, yaw, 0, size);
    }
  }
  shell.pop(); detail.pop();

  // In the open third tier the full-size 1763 bell hangs from its crown.
  // Backing timbers also carry the graded restored bells by the side openings.
  detail.push(x, 0, z, 0);
  detail.box(M.door, -3.65, 3.65, 28.65, 28.96, -.72, -.40);
  detail.geo(M.bell, shapes.bell, -.32, 26.64, -.56);
  detail.geo(M.window, shapes.clapper, -.32, 26.64, -.56);
  detail.box(M.door, 1.78, 2.00, 27.04, 27.35, -2.65, 2.60);
  for (const [offset, scale] of [[-1.85,.49],[-.56,.38],[.48,.29],[1.37,.22],[2.07,.16]]) {
    const y = 27.18 - 1.92*scale;
    detail.geo(M.bell, shapes.smallBell, 1.89, y, offset, 0, 0, 0, scale);
  }
  detail.pop();
  for (const g of Object.values(shapes)) g.dispose();
}
