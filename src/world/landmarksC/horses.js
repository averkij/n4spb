// landmarksC/horses.js - the four bronze "Horse Tamers" (Клодтовы кони, 1838-1851) and their pink granite pedestals at the four ends of the Anichkov Bridge.
// Each Blender-authored group has its own pose and handedness. Geometry is
// merged into the bridge's static batch alongside the original pedestals.
import { bronzeMaterial, loadHorseTamers } from './klodt.js';
import { CX, CZ, TH, EDGE, FACE, ROAD, yDeck, toWorld, BOX_ROT } from './frame.js';

const SCALE = 1.02;

/** the pedestal block (centre uc, vc at the outer edge, stands on the deck at height y0) */
function pedestal(P, M, uc, vc, y0) {
  const dx = 2.1, dz = 1.3, yb = y0, yd = yb + 0.45, yc = yd + 2.2, ys = yc + 0.3;
  P.box(M.coping, uc - dx - 0.2, uc + dx + 0.2, yb - 0.1, yd, vc - dz - 0.15, vc + dz + 0.15, 'b', 2.2);
  P.box(M.granite, uc - dx, uc + dx, yd, yc, vc - dz, vc + dz, 'b', 2.2);
  P.box(M.coping, uc - dx - 0.15, uc + dx + 0.15, yc, ys, vc - dz - 0.15, vc + dz + 0.15, '', 2.2);
  // The cast base has clipped corners, a rolled edge and a shallow bevel.
  const tiers = [[ys,2.04,1.25],[ys+.035,2.08,1.29],[ys+.09,2.07,1.28],[ys+.20,2.01,1.22],[ys+.25,1.96,1.18]];
  const rings = tiers.map(([y,x,z]) => [[-x+.19,-z],[x-.19,-z],[x,-z+.19],[x,z-.19],[x-.19,z],[-x+.19,z],[-x,z-.19],[-x,-z+.19]].map(([u,v])=>[uc+u,y,vc+v]));
  for(let i=1;i<rings.length;i++)for(let j=0;j<8;j++){
    const k=(j+1)%8,a=rings[i-1][j],b=rings[i-1][k];
    P.quad(M.bronzePlinth,a,b,rings[i][k],rings[i][j],[(a[0]+b[0])*.5-uc,0,(a[2]+b[2])*.5-vc]);
  }
  P.fan(M.bronzePlinth,rings.at(-1),[0,1,0]);
  return ys + 0.25;
}

export async function buildHorses(K, M, ctx) {
  const P = K.P, sculptures = await loadHorseTamers(), bronze = bronzeMaterial(ctx);
  const rng = ctx.rng('lmC-scars');
  const groups = [];
  P.push(CX, 0, CZ, -TH);
  // OSM artwork nodes 1594944814 (NW), 1594950131 (SW), 1594950136 (NE), 1594950120 (SE).
  const CORNERS = [
    { id: 'NE', sx: 1, side: -1, pose: 'C' }, { id: 'SE', sx: 1, side: 1, pose: 'D' },
    { id: 'SW', sx: -1, side: 1, pose: 'B' }, { id: 'NW', sx: -1, side: -1, pose: 'A' },
  ];
  for (const c of CORNERS) {
    const uc = c.sx * 25.0, vc = c.side * (EDGE - 1.3), y0 = yDeck(uc);
    const top = pedestal(P, M, uc, vc, y0);
    const yaw = c.sx > 0 ? Math.PI / 2 : -Math.PI / 2;
    P.geo(bronze, sculptures[c.pose], uc + c.sx * .18, top, vc + c.side * .22, 0, yaw, 0, SCALE);
    const w = toWorld(uc, vc);
    ctx.physics.addBox(w.x, w.z, 4.6, 3.0, BOX_ROT, -6, top + 0.5);
    groups.push({ id: c.id, pose: c.pose, x: w.x, z: w.z, top });
    if (c.id === 'NW') {
      // the plaque and the 1942 shell scars on the west and north faces (decals 2 cm off the granite, polygonOffset via the materials)
      const yp = y0 + 0.45 + 1.15, uf = uc - 2.1 - 0.025;
      P.quad(M.plaque, [uf, yp - 0.15, vc - 0.3], [uf, yp - 0.15, vc + 0.3], [uf, yp + 0.15, vc + 0.3], [uf, yp + 0.15, vc - 0.3], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(M.black, [uf - 0.008, yp - 0.1, vc - 0.24], [uf - 0.008, yp - 0.1, vc + 0.24], [uf - 0.008, yp - 0.08, vc + 0.24], [uf - 0.008, yp - 0.08, vc - 0.24], [-1, 0, 0]);
      for (let i = 0; i < 16; i++) {
        const onWest = i < 9, r = 0.05 + rng() * 0.09, yy = y0 + 0.9 + rng() * 1.5;
        const v = vc + (rng() - 0.5) * 2.2, u = uc + (rng() - 0.5) * 3.6;
        const pts = []; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; pts.push(a); }
        if (onWest) { const uf2 = uc - 2.1 - 0.02; P.fan(M.scar, pts.map((a) => [uf2, yy + Math.sin(a) * r, v + Math.cos(a) * r]), [-1, 0, 0]); }
        else { const vf = vc - 1.3 - 0.02; P.fan(M.scar, pts.map((a) => [u + Math.cos(a) * r, yy + Math.sin(a) * r, vf]), [0, 0, -1]); }
      }
    }
  }
  P.pop();
  K.svc.photoSpots.push({ x: toWorld(0, 26).x, z: toWorld(0, 26).z, yaw: 180 - 14, pitch: 4, name: 'Аничков мост · Клодтовы кони' });
  K.svc.monuments.push(...groups.map((g) => ({ id: 'klodt-' + g.id, name: 'Клодтовы кони · ' + g.id, x: g.x, z: g.z, h: g.top + 3.4 })));
  void FACE; void ROAD;
  return groups;
}
