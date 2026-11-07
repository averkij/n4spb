// OSM w685882720 is the elevated toll canopy over covered WHSD ramp
// w685882716, not a ground-level house. Its exact surveyed footprint is kept;
// the lightweight metal roof has 5 m clearance over the maintained bridge deck.
// The canopy has no booth/brand/sign invention, and no wall across the lanes.
import * as THREE from 'three';
import { MeshBuilder, addPrism, ringFromFlat } from '../lib/massing.js';
import { Parts } from '../landmarksD/kit.js';
import { registerLOD } from '../../core/spatial.js';
import * as L from '../layout.js';
import { COASTAL_BRIDGES } from '../../areas/narvsky/bridge-sites.js';

const coveredRamp = COASTAL_BRIDGES.find(b => b.road.id === 'w685882716');
function rampHeight(x, z) {
  if (!coveredRamp) return 6.025;
  const p = coveredRamp.pts;
  let best = Infinity, y = coveredRamp.y;
  for (let i = 0; i + 3 < p.length; i += 2) {
    const dx = p[i + 2] - p[i], dz = p[i + 3] - p[i + 1];
    const t = Math.max(0, Math.min(1, ((x - p[i]) * dx + (z - p[i + 1]) * dz) / (dx * dx + dz * dz || 1)));
    const dist = (x - p[i] - t * dx) ** 2 + (z - p[i + 1] - t * dz) ** 2;
    if (dist < best) { best = dist; y = coveredRamp.heights[i / 2] + t * (coveredRamp.heights[i / 2 + 1] - coveredRamp.heights[i / 2]); }
  }
  return y + .025;
}

function tollCanopy(K, records) {
  const record = records.find(b => b.id === 'w685882720');
  if (!record) return;
  const { ctx, body: P, mats: M, svc } = K;
  const deck = rampHeight(record.cx, record.cz), under = deck + 5, top = under + .32;
  let columns = 0;
  for (const poly of record.polys) {
    const walls = new MeshBuilder(), caps = new MeshBuilder();
    addPrism(walls, caps, poly, under, top, { floorCap: true });
    P.geo(M.roof, walls.build()); P.geo(M.trim, caps.build());
    const ring = ringFromFlat(poly.o);
    const contour = ring.map(p => new THREE.Vector2(...p));
    for (const tri of THREE.ShapeUtils.triangulateShape(contour, [])) {
      ctx.physics.addWalkTriangle(tri.map(i => [ring[i][0], top, ring[i][1]]), .32);
    }
    for (const [x0, z0] of ring) {
      const dx = record.cx - x0, dz = record.cz - z0, length = Math.hypot(dx, dz) || 1;
      const x = x0 + dx / length * .32, z = z0 + dz / length * .32;
      if (!roadClear(ctx, x, z, .28)) continue;
      P.col(M.shade, x, z, deck, under, .18, .18, 8);
      P.col(M.dark, x, z, deck, deck + .16, .3, .3, 8);
      ctx.physics.addCylinder(x, z, .18, deck, under);
      columns++;
    }
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      P.cyl(M.dark, [a[0], under + .06, a[1]], [b[0], under + .06, b[1]], .09, .09, 4);
    }
    // A steel underside spine carries the long span across the toll lanes.
    // It stays within the canopy slab's vertical range and surveyed outline.
    let axis = null;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
      if (!axis || len > axis.len) axis = { dx: dx / len, dz: dz / len, len };
    }
    if (axis) {
      const half = Math.max(.5, axis.len / 2 - 1.2), dx = axis.dx * half, dz = axis.dz * half;
      P.cyl(M.dark, [record.cx - dx, under + .10, record.cz - dz], [record.cx + dx, under + .10, record.cz + dz], .09, .09, 4);
    }
  }
  svc.houses.push({ id: record.id, name: 'Навес пункта оплаты ЗСД', x: record.cx, z: record.cz, h: top, minH: under, columns });
}

// Area-local preservation of the existing Moskovskaya overlap asset. Four shared
// material collectors, finite static LOD, no textures or per-frame work.
function roadClear(ctx,x,z,r=0){
  const net=ctx.services.streets?.net;
  for(const [dx,dz] of [[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]])if(net?net.cover(x+dx,z+dz,{})>=-.5:L.isOnRoad(x+dx,z+dz,.5))return false;
  return true;
}
export function buildTollCanopy(ctx,svc){
  const records=L.groupMembers('narvsky-toll-canopy');
  if(!records.length)return;
  const root=new THREE.Group();root.name='narvsky-toll-roof';
  const body=new Parts(),mats=Object.fromEntries(Object.entries({roof:'#929ca0',trim:'#e2ded1',shade:'#999585',dark:'#343c40'}).map(([k,v])=>[k,ctx.mat.toon(v,{paint:.025})]));
  tollCanopy({ctx,root,body,mats,svc},records);
  let meshes=0;for(const mesh of body.build(root,{name:'narvsky-toll-roof'})){mesh.updateMatrixWorld(true);registerLOD(mesh,2600);meshes++;}
  ctx.addStatic(root);svc.triangles+=body.tris;svc.parts.tollCanopy={triangles:body.tris,meshes};
  return root;
}
