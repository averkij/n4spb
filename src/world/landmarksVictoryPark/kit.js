// Immutable Victory Park geometry collector. Repeated shapes share static,
// bounded instance buckets in 192 m cells; authored ranges use the engine LOD.
import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';
import { makeLabels } from '../streets/labels.js';

export class ParkKit {
  constructor(ctx, root) { this.ctx = ctx; this.root = root; this.buckets = new Map(); this.frame = new THREE.Matrix4(); this.stack = []; this.geos = new Map(); this.noOutlineMaterials=new Set(); }
  push(x, y, z, rot = 0) { this.stack.push(this.frame.clone()); const m = new THREE.Matrix4().makeRotationY(rot); m.setPosition(x,y,z); this.frame.multiply(m); }
  pop() { this.frame = this.stack.pop(); }
  geometry(key, make) { if (!this.geos.has(key)) this.geos.set(key, make()); return this.geos.get(key); }
  shape(key, geo, mat, x,y,z, sx,sy,sz, rx=0,ry=0,rz=0, far=420) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz)); m.premultiply(this.frame);
    const p = new THREE.Vector3().setFromMatrixPosition(m), cell = `${Math.floor(p.x/192)},${Math.floor(p.z/192)}`;
    const k = `${key}|${mat.uuid}|${far}|${cell}`; let b=this.buckets.get(k);
    if(!b) {b={geo,mat,far,matrices:[],key};this.buckets.set(k,b);} b.matrices.push(m); return m;
  }
  box(mat,x,y,z,w,h,d,far=420,ry=0) { return this.shape('box',this.ctx.geo.G.box(),mat,x,y,z,w,h,d,0,ry,0,far); }
  sphere(mat,x,y,z,w,h=w,d=w,far=260) {return this.shape('sphere',this.ctx.geo.G.sphere(10),mat,x,y,z,w,h,d,0,0,0,far);}
  cyl(mat,x,y,z,r,h,far=420) {const seg=r>6?64:16;return this.shape(`cylinder-${seg}`,this.ctx.geo.G.cyl(seg),mat,x,y,z,r*2,h,r*2,0,0,0,far);}
  beam(mat,a,b,r,far=420) {
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av),p=av.clone().add(bv).multiplyScalar(.5);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()),e=new THREE.Euler().setFromQuaternion(q);
    return this.shape('beam',this.ctx.geo.G.cyl(8),mat,p.x,p.y,p.z,r*2,d.length(),r*2,e.x,e.y,e.z,far);
  }
  torus(mat,x,y,z,r,tube,rx=0,ry=0,far=420) {
    const key=`torus:${r}:${tube}`;return this.shape(key,this.geometry(key,()=>new THREE.TorusGeometry(r,tube,6,40)),mat,x,y,z,1,1,1,rx,ry,0,far);
  }
  label(mat,x,y,z,w,h,id,ry=0,far=200,tile=0) {
    const m = new THREE.Matrix4().makeRotationY(ry);m.setPosition(x,y,z);m.premultiply(this.frame);
    const p=new THREE.Vector3().setFromMatrixPosition(m),n=new THREE.Vector3(0,0,1).transformDirection(m);
    this.ctx.services.labels ||= makeLabels();
    if(!this.ctx.services.labels.reserve(id,p.x,p.y,p.z,w,h,n.x,n.z,'monument'))return;
    const key=`label-${tile}`;
    const geo=this.geometry(key,()=>{const g=this.ctx.geo.G.plane().clone(),uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const v=tile===26?.25+uv.getY(i)*.5:uv.getY(i);uv.setXY(i,(tile%4+uv.getX(i))*.25,1-(Math.floor(tile/4)+1-v)*.125);}return g;});
    this.shape(key,geo,mat,x,y,z,w,h,1,0,ry,0,far);
  }
  finish() {
    let tris=0; const meshes=[];
    for(const b of this.buckets.values()) {
      const o=new THREE.InstancedMesh(b.geo,b.mat,b.matrices.length);o.name=`victory-park-${b.key}`;
      b.matrices.forEach((m,i)=>o.setMatrixAt(i,m));o.computeBoundingBox();o.computeBoundingSphere();o.castShadow=true;o.receiveShadow=true;
      if(b.key.startsWith('label-') || this.noOutlineMaterials.has(b.mat))this.ctx.noOutline(o);
      this.root.add(o);o.updateMatrixWorld(true);registerLOD(o,b.far);
      tris+=(b.geo.index?.count??b.geo.attributes.position.count)/3*b.matrices.length;meshes.push(o);
    }
    return {tris,meshes};
  }
}

// Placement must clear the FINAL footprint, not merely its centre. Sampling
// covers interiors as well as edges; optional streets service keeps isolated checks usable.
export function safeSpot(ctx,x,z,w,d,rot=0) {
  const c=Math.cos(rot),s=Math.sin(rot),nu=Math.max(1,Math.ceil(w/.6)),nv=Math.max(1,Math.ceil(d/.6));
  for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){
    const u=-w/2+w*i/nu,v=-d/2+d*j/nv;
    const px=x+c*u+s*v,pz=z-s*u+c*v;
    if(ctx.services.streets?.net?.cover ? ctx.services.streets.net.cover(px,pz,{})>=-.5 : ctx.L.isOnRoad(px,pz,.5))return false;
  }
  return true;
}
