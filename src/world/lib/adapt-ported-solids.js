// Older source modules merge fences into architectural meshes and add solid
// guards afterwards. Convert those non-architectural runs during their build,
// before engine batching: remove their upper geometry, replace it with bounded
// breakable bays, and remove invisible duplicate guards. Building walls and
// structural quays are preserved. Instance furniture uses knock-furniture.
import * as THREE from 'three';
import { splitBays } from './fence-bays.js';
import { portedRailings } from './ported-railings.js';
import { registerLOD } from '../../core/spatial.js';
import { knockInstances } from './knock-inst.js';

export function adaptPortedSolids(ctx,roots,items,name) {
  const candidates=items.filter(it=>(it.type==='box'&&Math.min(it.hw,it.hd)*2<=1.2||it.type==='cyl'&&it.r<=.4)&&!it.source?.knock&&
    it.y1>.55&&it.y1<(name==='bridgesPetro'?50:12)&&it.y1-it.y0>.7&&
    (!ctx.L.insideBuilding(it.cx,it.cz,.05)||it.y0>1)).map(it=>{
      const cyl=it.type==='cyl',swap=!cyl&&it.hw<it.hd,rot=cyl?0:it.rotY+(swap?Math.PI/2:0),half=cyl?it.r:swap?it.hd:it.hw;
      const fixture=cyl||half<.65;
      return {it,rot,half,c:Math.cos(rot),s:Math.sin(rot),th:cyl?it.r*2:Math.min(it.hw,it.hd)*2,fixture,
        y:it.y0<-.5?Math.max(0,it.y1-(fixture?Math.min(6,it.y1):1.3)):Math.max(0,it.y0),materials:new Map(),parts:new Map(),instParts:new Map(),removed:0};
    });
  if(!candidates.length)return;
  // Conservative spatial bins: triangle centroids query only nearby rail runs.
  const grid=new Map(),cell=32;
  candidates.forEach(q=>{
    const reach=q.half+q.th+1;
    for(let x=Math.floor((q.it.cx-reach)/cell);x<=Math.floor((q.it.cx+reach)/cell);x++)
      for(let z=Math.floor((q.it.cz-reach)/cell);z<=Math.floor((q.it.cz+reach)/cell);z++){
        const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(q);
      }
  });
  const v=new THREE.Vector3();
  for(const root of roots){root.updateMatrixWorld(true);root.traverse(mesh=>{
    if(!mesh.isMesh||mesh.userData.knock||!mesh.geometry?.attributes.position||Array.isArray(mesh.material))return;
    if(mesh.isInstancedMesh){
      if(/tree|foliage|leaf|trunk/i.test(mesh.name))return;
      const matrix=new THREE.Matrix4(),hide=new THREE.Matrix4().makeScale(0,0,0);let moved=0;
      for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);v.setFromMatrixPosition(matrix);
        const q=candidates.find(q=>q.fixture&&Math.hypot(v.x-q.it.cx,v.z-q.it.cz)<.4&&Math.abs(v.y-q.y)<1);
        if(!q)continue;
        q.instParts.set(mesh.uuid,{geo:mesh.geometry,mat:mesh.material,matrix:matrix.clone(),color:mesh.instanceColor?new THREE.Color().fromBufferAttribute(mesh.instanceColor,i):null});q.removed++;
        mesh.setMatrixAt(i,hide);moved++;
      }
      if(moved===mesh.count){mesh.count=0;mesh.visible=false;}else if(moved){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
      return;
    }
    const geo=mesh.geometry,p=geo.attributes.position,idx=geo.index,kept=[],n=idx?idx.count:p.count;
    let removed=0;
    for(let i=0;i<n;i+=3){
      const ids=[0,1,2].map(j=>idx?idx.getX(i+j):i+j);
      const pts=ids.map(j=>v.fromBufferAttribute(p,j).applyMatrix4(mesh.matrixWorld).clone());
      const x=(pts[0].x+pts[1].x+pts[2].x)/3,z=(pts[0].z+pts[1].z+pts[2].z)/3,y=(pts[0].y+pts[1].y+pts[2].y)/3;
      const q=(grid.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[]).find(q=>{
        const dx=x-q.it.cx,dz=z-q.it.cz;
        const pad=q.fixture?.8:.3;
        return Math.abs(dx*q.c-dz*q.s)<=q.half+pad&&Math.abs(dx*q.s+dz*q.c)<=q.th/2+pad&&y>q.y+(q.fixture?-.05:.18)&&y<q.it.y1+.35;
      });
      if(q){
        q.materials.set(mesh.material,(q.materials.get(mesh.material)||0)+1);q.removed++;removed++;
        if(q.fixture){
          if(!q.parts.has(mesh.material))q.parts.set(mesh.material,{pos:[],nrm:[],uv:[]});
          const out=q.parts.get(mesh.material),normal=geo.attributes.normal,uv=geo.attributes.uv,nm=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
          ids.forEach((j,k)=>{
            const p=pts[k];out.pos.push(p.x-q.it.cx,p.y-q.y,p.z-q.it.cz);
            if(normal)v.fromBufferAttribute(normal,j).applyMatrix3(nm).normalize();else v.set(0,1,0);
            out.nrm.push(v.x,v.y,v.z);out.uv.push(uv?uv.getX(j):0,uv?uv.getY(j):0);
          });
        }
      }
      else kept.push(...ids);
    }
    if(!removed)return;
    // Retain the original attributes and only replace the index; source geometry
    // may be shared by siblings, so clone before altering this mesh's topology.
    const copy=geo.clone();copy.setIndex(kept);mesh.geometry=copy;copy.computeBoundingBox();copy.computeBoundingSphere();
  });}
  const groups=new Map(),instFixtures=[];
  for(const q of candidates){
    ctx.physics.remove(q.it);
    // A guard with no drawn part is an obsolete invisible barrier. Existing
    // dynamic rails own their own collider and were deliberately excluded above.
    if(!q.removed)continue;
    if(q.fixture){
      if(!/^bridges/.test(name)&&ctx.services.streets?.net?.cover(q.it.cx,q.it.cz,{})>-.5-q.half)continue;
      const parts=[];
      for(const [mat,a] of q.parts){
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(a.pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(a.nrm,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(a.uv,2));geo.computeBoundingSphere();
        const obj=new THREE.Mesh(geo,mat);obj.name=name+'-fixture';obj.position.set(q.it.cx,q.y,q.it.cz);obj.castShadow=obj.receiveShadow=true;ctx.add(obj);obj.updateMatrixWorld(true);registerLOD(obj,260);if(mat.alphaTest>0)ctx.noOutline(obj);parts.push({obj});
      }
      const item=q.it.type==='cyl'?ctx.physics.addCylinder(q.it.cx,q.it.cz,q.it.r,q.y,q.it.y1):ctx.physics.addBox(q.it.cx,q.it.cz,q.it.hw*2,q.it.hd*2,q.it.rotY,q.y,q.it.y1);
      if(/^bridges/.test(name))item.bridgeItem=true;
      const rec={kind:q.it.y1-q.y>2?'lamp':'fence',mass:90,h:q.it.y1-q.y,r:q.half,anchored:12,hitK:.4,metal:true};
      if(q.instParts.size)instFixtures.push({q,item,parts,rec});
      else ctx.knock?.register({...rec,x:q.it.cx,y:q.y,z:q.it.cz,rotY:q.rot,item,parts});
      continue;
    }
    const mat=[...q.materials].sort((a,b)=>b[1]-a[1])[0][0];
    const h=Math.min(4,Math.max(.7,q.it.y1-q.y)),solid=/granite|stone|brick|concrete|marble/i.test(mat.name);
    const key=mat.uuid+'|'+h.toFixed(1)+'|'+solid;
    if(!groups.has(key))groups.set(key,{mat,h,solid,bays:[]});
    const dx=q.c*q.half,dz=-q.s*q.half;
    groups.get(key).bays.push(...splitBays(q.it.cx-dx,q.it.cz-dz,q.it.cx+dx,q.it.cz+dz,3,{y:q.y}));
  }
  let i=0;for(const g of groups.values())portedRailings(ctx,name+'-rail-'+i++,g.bays,g.mat,{height:g.h,solid:g.solid,thick:g.solid?.4:.15});
  if(instFixtures.length){
    const templates=new Map();for(const f of instFixtures)for(const [key,p] of f.q.instParts)templates.set(key,p);
    knockInstances(ctx,{name:name+'-fixtures',spots:instFixtures.map(f=>({x:f.q.it.cx,y:f.q.y,z:f.q.it.cz,rotY:f.q.rot})),
      parts:[...templates].map(([key,p])=>({geo:p.geo,mat:p.mat,when:(_,i)=>instFixtures[i].q.instParts.has(key),place:(_,i)=>instFixtures[i].q.instParts.get(key).matrix,color:(_,i)=>instFixtures[i].q.instParts.get(key).color})),
      items:i=>instFixtures[i].item,extraParts:i=>instFixtures[i].parts,rec:(_,i)=>instFixtures[i].rec,far:260});
  }
}
