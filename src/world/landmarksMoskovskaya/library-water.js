// Chasha Znaniy: flowing parabolic jets, ballistic droplets, impact rings and
// submerged aqua/amber luminaires. Geometry is local to this one forecourt;
// four bounded dynamic instance buffers, one allocation-free nearby callback.
import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';

export function libraryWater(ctx,bowls){
 const jets=[];
 const ring=(b,y,r,n,h,inward)=>{for(let i=0;i<n;i++){
  const a=i*Math.PI*2/n,c=Math.cos(a),s=Math.sin(a),travel=inward?-.65*r:.6;
  jets.push({x:b.x+c*r,z:b.z+s*r,y,h,dx:c*travel,dz:s*travel,phase:i*.73+jets.length*.17});
 }};
 for(const b of bowls){
  ring(b,b.h-.1,b.r*.54,b.r>3?24:8,b.r>3?3.6:1.15,true);
  if(b.r>3){ring(b,b.h-.1,b.r*.15,8,5.1,false);ring(b,.25,b.r+1,24,1.25,true);}
 }
 const stream=ctx.mat.toon('#afd9df',{name:'rnb-flowing-water',paint:0,emissive:'#60bfc9',emissiveIntensity:.08});
 const sparkle=ctx.mat.emissive('#d8ebdf',.95,{name:'rnb-water-sparkles'});
 const glow=ctx.mat.emissive('#6bd5e2',1.6,{name:'rnb-underwater-glow',transparent:true,opacity:0,depthWrite:false});
 const segments=8,drops=ctx.quality.name==='low'?3:6;
 const streams=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,5,1,true),stream,jets.length*segments);
 const droplets=new THREE.InstancedMesh(new THREE.OctahedronGeometry(1),sparkle,jets.length*drops);
 // Ripple torus is horizontal, its centre is 2 cm above the native water.
 const rings=new THREE.InstancedMesh(new THREE.TorusGeometry(1,.025,3,24).rotateX(-Math.PI/2),sparkle,jets.length);
 const lamps=new THREE.InstancedMesh(new THREE.CircleGeometry(1,24).rotateX(-Math.PI/2),glow,bowls.length*2);
 const meshes=[streams,droplets,rings,lamps],matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),pos=new THREE.Vector3(),scale=new THREE.Vector3(),axis=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 const set=(mesh,i,x,y,z,sx,sy,sz,rotation=null)=>{pos.set(x,y,z);scale.set(sx,sy,sz);matrix.compose(pos,rotation||q,scale);mesh.setMatrixAt(i,matrix);};
 const day=new THREE.Color('#d8ebdf'),night=new THREE.Color('#8ae2ec');
 const state={jets:jets.length,droplets:jets.length*drops,draws:4,active:false,night:0,time:0};
 const update=(t,force=false)=>{
  const camera=ctx.camera?.position,near=!camera||Math.hypot(camera.x+1765,camera.z-7454)<390;
  state.active=near;for(const mesh of meshes)mesh.visible=near;
  if(!near&&!force)return;
  const n=ctx.shared.uNight.value,sun=ctx.shared.uSunDir.value;
  const dusk=Math.max(0,(.22-sun.y)/.22)*.55;
  const lit=Math.min(1,Math.max(dusk,(n-.03)/.55,0));
  stream.emissiveIntensity=.08+lit*1.5;sparkle.color.copy(day).lerp(night,lit);glow.opacity=lit*.24;
  state.night=lit;state.time=t;
  for(let i=0;i<jets.length;i++){
   const j=jets[i],h=j.h*(.94+.06*Math.sin(t*1.7+j.phase));
   // Reuse the two vectors throughout; no geometry/materials/arrays per frame.
   let ax=j.x,ay=j.y,az=j.z;
   for(let s=0;s<segments;s++){
    const u=(s+1)/segments,bx=j.x+j.dx*u,by=j.y+4*h*u*(1-u),bz=j.z+j.dz*u;
    axis.set(bx-ax,by-ay,bz-az);const len=axis.length();axis.multiplyScalar(1/Math.max(len,1e-6));q.setFromUnitVectors(up,axis);
    const width=(.038+.007*Math.sin(t*4+j.phase+s))*(1-u*.55);
    set(streams,i*segments+s,(ax+bx)/2,(ay+by)/2,(az+bz)/2,width,len,width,q);ax=bx;ay=by;az=bz;
   }
   q.identity();
   for(let d=0;d<drops;d++){
    const u=((t*(.40+1/Math.sqrt(h)*.16)+d/drops+j.phase*.137)%1+1)%1;
    const spread=Math.sin(u*Math.PI)*.1,twist=j.phase+d*2.4;
    const size=(.025+.035*Math.pow(Math.sin(t*5+j.phase+d),8))*(.7+u*.6);
    set(droplets,i*drops+d,j.x+j.dx*u+Math.sin(twist)*spread,j.y+4*h*u*(1-u)+.04,j.z+j.dz*u+Math.cos(twist)*spread,size,size*(1.8-u*.6),size);
   }
   const f=((t*.62+j.phase*.17)%1+1)%1,r=.12+f*.48;
   set(rings,i,j.x+j.dx,j.y+.025,j.z+j.dz,r,.3*(1-f)+.05,r);
  }
  for(let i=0;i<bowls.length;i++){const b=bowls[i];for(let k=0;k<2;k++)set(lamps,i*2+k,b.x+(k?1:-1)*b.r*.38,b.h-.115,b.z,b.r*.43,1,b.r*.43);}
  for(const mesh of meshes)mesh.instanceMatrix.needsUpdate=true;
 };
 for(const [i,mesh]of meshes.entries()){
  mesh.name=['rnb-water-jets','rnb-water-droplets','rnb-water-impact-rings','rnb-water-uplights'][i];
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=false;mesh.receiveShadow=false;ctx.noOutline(mesh);ctx.add(mesh);
 }
 update(0,true);
 for(const mesh of meshes){
  // A fixed envelope contains every pulse, falling drop and expanding ring.
  mesh.boundingBox=new THREE.Box3(new THREE.Vector3(-1788,.1,7428),new THREE.Vector3(-1745,7.5,7479));
  mesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(-1766.5,3.8,7453.5),36);
  registerLOD(mesh,350);
 }
 ctx.onUpdate((dt,t)=>update(t));
 return state;
}
