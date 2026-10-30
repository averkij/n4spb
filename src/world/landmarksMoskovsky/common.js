import { Parts } from '../landmarksD/kit.js';
import { registerLOD } from '../../core/spatial.js';
import { makeLabels } from '../streets/labels.js';

// Gate-only kit adapted from 102_3d_piter. Immutable meshes use the existing
// static batching and distance ranges; the columns have their own colliders.
export function makeKit(ctx, root, svc) {
  ctx.services.labels ||= makeLabels();
  const mats = Object.fromEntries(Object.entries({ granite: '#857f77', bronze: '#394a40' })
    .map(([key, color]) => [key, ctx.mat.toon(color, { paint: .025 })]));
  const K = { ctx, root, svc, mats, body: new Parts(), detail: new Parts(), decals: new Set() };
  K.flush = () => {
    for (const [part, far] of [[K.body, 2600], [K.detail, 380]]) {
      for (const mesh of part.build(root, { name: 'moskovsky-gate' })) {
        if (K.decals.has(mesh.material)) ctx.noOutline(mesh);
        mesh.updateMatrixWorld(true);
        registerLOD(mesh, far);
      }
    }
    svc.triangles = K.body.tris + K.detail.tris;
  };
  K.label = (id, text, x, y, z, w, h, rotY = 0) => {
    const n = [Math.sin(rotY), Math.cos(rotY)];
    if (!ctx.services.labels.reserve(id, x, y, z, w, h, ...n, 'landmark')) return;
    const texture = ctx.tex.sign({ text, bg: '#343c40', fg: '#e2ded1', w: 1024, h: 128, font: 'serif' });
    const mat = ctx.mat.decal('#ffffff', { map: texture });
    K.decals.add(mat);
    K.detail.push(x, y, z, rotY);
    K.detail.quad(mat, [-w/2,-h/2,0], [w/2,-h/2,0], [w/2,h/2,0], [-w/2,h/2,0], [0,0,1]);
    K.detail.pop();
  };
  return K;
}

export function roadClear(ctx, x, z, r = 0) {
  const net = ctx.services.streets?.net;
  for (const [dx, dz] of [[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]]) {
    if (net ? net.cover(x+dx, z+dz, {}) >= -.5 : ctx.L.isOnRoad(x+dx, z+dz, .5)) return false;
  }
  return true;
}
