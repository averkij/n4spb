// Render-only sole support. Physics intentionally keeps decorative paving out
// of its walk surfaces. Capture its upward triangles before batching releases
// CPU arrays; queries use compact local bins, never scene traversal/raycasting.
const LEVELS=[8,64,512,4096],STRIDE=9,CHUNK=2048,RISE=.30,EPS=1e-6;
const clock=()=>typeof performance==='undefined'?Date.now():performance.now();
const key=(x,z)=>x*1048576+z; // city coordinates are far inside this signed range
function levelFor(x0,z0,x1,z1){
  for(let i=0;i<LEVELS.length;i++){const s=LEVELS[i],n=(Math.floor(x1/s)-Math.floor(x0/s)+1)*(Math.floor(z1/s)-Math.floor(z0/s)+1);if(n<=64)return i;}
  return LEVELS.length-1;
}
function transparent(material){return !material||material.visible===false||material.transparent||material.opacity<.99||material.depthWrite===false;}

// Full-region audit: Moskovskaya is 451k triangles, Palace 325k, Vasilyevsky
// 334k. Capacity is allocated on demand; the two hard caps bound typed payload
// below 40 MB while leaving room for later street/landmark additions.
export function createVisualFloor(physics,{heightPatches=[],maxTriangles=750000,maxReferences=3000000,warn=message=>console.warn(message)}={}){
  const grids=LEVELS.map(()=>new Map()),supports=LEVELS.map(()=>new Map()),chunks=[],seen=new WeakSet();
  const stats={triangles:0,meshes:0,scannedTriangles:0,references:0,cells:0,bytes:0,buildMs:0,queries:0,queryTests:0,queryMs:0,maxQueryTests:0,truncated:0,terrainChecks:0,supports:0};
  const patches=heightPatches.filter(p=>Array.isArray(p.box)&&p.box.length===4&&typeof p.at==='function');
  let supportCount=-1,warned=false;
  function refreshSupports(){
    const items=physics.items||[];if(items.length===supportCount)return;supportCount=items.length;
    for(const grid of supports)grid.clear();stats.supports=0;
    for(const item of items){
      if(!['walk','ramp'].includes(item.type)||item.dynamic||item.conv)continue;
      const lo=item.type==='walk'?item.top:Math.min(item.yA,item.yB),hi=item.type==='walk'?item.top:Math.max(item.yA,item.yB);
      if(!Number.isFinite(lo)||!Number.isFinite(hi))continue;
      const dx=Math.abs(item.c)*item.hw+Math.abs(item.s)*item.hd,dz=Math.abs(item.s)*item.hw+Math.abs(item.c)*item.hd;
      const b={x0:item.cx-dx,x1:item.cx+dx,z0:item.cz-dz,z1:item.cz+dz,lo:lo-.01,hi:hi+RISE};
      const level=levelFor(b.x0,b.z0,b.x1,b.z1),size=LEVELS[level],grid=supports[level];
      for(let x=Math.floor(b.x0/size);x<=Math.floor(b.x1/size);x++)for(let z=Math.floor(b.z0/size);z<=Math.floor(b.z1/size);z++){
        const k=key(x,z);let bucket=grid.get(k);if(!bucket)grid.set(k,bucket=[]);bucket.push(b);
      }
      stats.supports++;
    }
  }
  function nearSupport(x0,z0,x1,z1,y0,y1,a,b,c){
    for(let level=0;level<LEVELS.length;level++){
      const size=LEVELS[level],grid=supports[level];
      // Four probes, not every bin in a large roof/terrain triangle's AABB.
      // Real deck triangles are continuous; the query still checks the exact
      // triangle and the player's physical support height at the final point.
      for(let probe=0;probe<4;probe++){
        const x=probe===0?(a[0]+b[0]+c[0])/3:probe===1?a[0]:probe===2?b[0]:c[0];
        const z=probe===0?(a[2]+b[2]+c[2])/3:probe===1?a[2]:probe===2?b[2]:c[2];
        const bucket=grid.get(key(Math.floor(x/size),Math.floor(z/size)));if(!bucket)continue;
        for(const b of bucket)if(y1>=b.lo&&y0<=b.hi&&x1>=b.x0&&x0<=b.x1&&z1>=b.z0&&z0<=b.z1)return true;
      }
    }
    return false;
  }
  function nearTerrain(x,z,y){
    for(const p of patches){const b=p.box;if(x<b[0]||x>b[1]||z<b[2]||z>b[3])continue;
      stats.terrainChecks++;const h=p.at(x,z);if(h!=null)return Number.isFinite(h)&&y>=h-.01&&y<=h+RISE;
    }
    return false;
  }
  function addTriangle(a,b,c,touched){
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    if(ny<=EPS||ny*ny<.49*(nx*nx+ny*ny+nz*nz))return; // upward and walkable slope
    const x0=Math.min(a[0],b[0],c[0]),x1=Math.max(a[0],b[0],c[0]),z0=Math.min(a[2],b[2],c[2]),z1=Math.max(a[2],b[2],c[2]);
    const y0=Math.min(a[1],b[1],c[1]),y1=Math.max(a[1],b[1],c[1]);
    if(!Number.isFinite(x0)||!Number.isFinite(x1)||!Number.isFinite(z0)||!Number.isFinite(z1)||!Number.isFinite(y0)||!Number.isFinite(y1))return;
    // Exact y=0 ground needs no correction, and omitting its huge triangles
    // avoids building a redundant city-wide ground index.
    if(y0>=-.004&&y1<=.004)return;
    if(!(y0>=-.01&&y1<=.40)&&!nearSupport(x0,z0,x1,z1,y0,y1,a,b,c)&&!nearTerrain((a[0]+b[0]+c[0])/3,(a[2]+b[2]+c[2])/3,(a[1]+b[1]+c[1])/3))return;
    const level=levelFor(x0,z0,x1,z1),size=LEVELS[level],ix0=Math.floor(x0/size),ix1=Math.floor(x1/size),iz0=Math.floor(z0/size),iz1=Math.floor(z1/size),refs=(ix1-ix0+1)*(iz1-iz0+1);
    if(stats.triangles>=maxTriangles||stats.references+refs>maxReferences){stats.truncated++;return;}
    const id=stats.triangles++,chunkIndex=Math.floor(id/CHUNK),offset=id%CHUNK*STRIDE;
    if(!chunks[chunkIndex])chunks[chunkIndex]=new Float32Array(CHUNK*STRIDE);
    const data=chunks[chunkIndex];data.set(a,offset);data.set(b,offset+3);data.set(c,offset+6);
    const grid=grids[level];
    for(let x=ix0;x<=ix1;x++)for(let z=iz0;z<=iz1;z++){
      const k=key(x,z);let bucket=grid.get(k);
      if(!bucket){grid.set(k,bucket=[]);stats.cells++;}
      else if(bucket instanceof Uint32Array)grid.set(k,bucket=Array.from(bucket));
      bucket.push(id);touched[level].add(k);
    }
    stats.references+=refs;
  }
  function addGroup(root){
    if(!root)return;const start=clock();refreshSupports();root.updateWorldMatrix?.(true,true);
    const touched=LEVELS.map(()=>new Set()),a=[0,0,0],b=[0,0,0],c=[0,0,0];
    function visit(object,dynamic=false){
      dynamic||=!!(object.userData?.dynamic||object.userData?.visualFloorIgnore);
      if(dynamic||object.isSkinnedMesh||object.isInstancedMesh)return;
      if(object.isMesh&&!seen.has(object)){
        seen.add(object);const g=object.geometry,materials=Array.isArray(object.material)?object.material:[object.material];
        if(g?.attributes?.position&&materials.some(m=>!transparent(m))){
          stats.meshes++;const p=g.attributes.position,ids=g.index,m=object.matrixWorld.elements;
          const point=(i,out)=>{const x=p.getX(i),y=p.getY(i),z=p.getZ(i);out[0]=m[0]*x+m[4]*y+m[8]*z+m[12];out[1]=m[1]*x+m[5]*y+m[9]*z+m[13];out[2]=m[2]*x+m[6]*y+m[10]*z+m[14];};
          const end=Math.min(ids?ids.count:p.count,g.drawRange.start+g.drawRange.count),groups=Array.isArray(object.material)&&g.groups.length?g.groups:[{start:0,count:Infinity,materialIndex:0}];
          for(const group of groups){if(transparent(materials[group.materialIndex||0]))continue;
            const from=Math.max(g.drawRange.start,group.start),to=Math.min(end,group.start+group.count);
            for(let i=from;i+2<to;i+=3){stats.scannedTriangles++;point(ids?ids.getX(i):i,a);point(ids?ids.getX(i+1):i+1,b);point(ids?ids.getX(i+2):i+2,c);addTriangle(a,b,c,touched);}
          }
        }
      }
      for(const child of object.children||[])visit(child,dynamic);
    }
    visit(root);
    for(let level=0;level<LEVELS.length;level++)for(const k of touched[level])grids[level].set(k,Uint32Array.from(grids[level].get(k)));
    // Retained typed payload, excluding engine-dependent Map/bucket overhead.
    stats.bytes=chunks.length*CHUNK*STRIDE*4+stats.references*4;stats.buildMs+=clock()-start;
    if(stats.truncated&&!warned){warned=true;warn(`[visual-floor] Capacity reached (${maxTriangles} triangles / ${maxReferences} references); ${stats.truncated} surface triangles omitted. Review the area floor budget.`);}
  }
  function heightAt(x,z,feetY){
    const start=clock(),base=Number.isFinite(feetY)?feetY:0;let highest=base,tests=0;
    for(let level=0;level<LEVELS.length;level++){
      const size=LEVELS[level],bucket=grids[level].get(key(Math.floor(x/size),Math.floor(z/size)));if(!bucket)continue;
      for(const id of bucket){
        tests++;const d=chunks[Math.floor(id/CHUNK)],i=id%CHUNK*STRIDE;
        const ax=d[i],az=d[i+2],ux=d[i+3]-ax,uz=d[i+5]-az,vx=d[i+6]-ax,vz=d[i+8]-az,dx=x-ax,dz=z-az,det=ux*vz-uz*vx;
        if(Math.abs(det)<1e-8)continue;
        const u=(dx*vz-dz*vx)/det,v=(ux*dz-uz*dx)/det;if(u< -EPS||v< -EPS||u+v>1+EPS)continue;
        const y=d[i+1]+u*(d[i+4]-d[i+1])+v*(d[i+7]-d[i+1]);if(y>highest&&y<=base+RISE+EPS)highest=y;
      }
    }
    stats.queries++;stats.queryTests+=tests;stats.maxQueryTests=Math.max(stats.maxQueryTests,tests);stats.queryMs+=clock()-start;
    return highest;
  }
  return {addGroup,heightAt,stats,dispose(){for(const grid of [...grids,...supports])grid.clear();chunks.length=0;}};
}
