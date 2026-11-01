// Independent CPU shoreline audit. It compares generated banks/cuts and actual
// Float32 terrain triangles with original WATER rings, then real Physics floors.
// node tools/area.mjs moskovskaya tools/park-shore-topology-audit.mjs [--geometry]
// --near x,z,r; --step 1; --json shots/...json; --strict makes findings fail.
// This is a diagnostic, not a tolerance waiver. It deliberately does not use
// L.heightAt as the expected drawn height (that would accept phantom floors).
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as C from '../src/world/data/city.js';
import * as L from '../src/world/layout.js';
import { waterGeo, slopeRuns, slopeQuads, slopeAt, pointInFlat } from '../src/world/environment/waterways.js';
import { waterCuts } from '../src/world/environment/river.js';

const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const near=String(opt('near',process.env.AREA==='moskovskaya'?'-1260,7140,800':`${L.HERO.x},${L.HERO.z},800`)).split(',').map(Number);
const step=Number(opt('step',1)),inScope=(x,z)=>Math.hypot(x-near[0],z-near[1])<=near[2];
const report={area:process.env.AREA,near,step,revision:crypto.createHash('sha256').update(fs.readFileSync('src/world/environment/quay.js')).update(fs.readFileSync('src/world/environment/waterways.js')).digest('hex').slice(0,16),counts:{},examples:{},reported:[]};
const maxExamples=35;
function record(kind,value){report.counts[kind]=(report.counts[kind]||0)+1;const a=report.examples[kind]||=[];if(a.length<maxExamples)a.push(value);}
function segment(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(l2||1)));return {d:Math.hypot(x-ax-dx*t,z-az-dz*t),x:ax+dx*t,z:az+dz*t,t};}
const sourceWater=C.WATER.filter(w=>w.kind!=='fountain'&&w.polys?.some(p=>p.o.some((x,i)=>i%2===0&&inScope(x,p.o[i+1]))));
const edges=[];
for(const water of sourceWater)for(let pi=0;pi<water.polys.length;pi++){
 const p=water.polys[pi];for(let hi=0;hi<=p.h.length;hi++){const ring=hi?p.h[hi-1]:p.o;for(let i=0;i<ring.length;i+=2){const j=(i+2)%ring.length;if(!inScope((ring[i]+ring[j])/2,(ring[i+1]+ring[j+1])/2))continue;edges.push({water:water.id,name:water.name,poly:pi,hole:hi-1,index:i/2,ax:ring[i],az:ring[i+1],bx:ring[j],bz:ring[j+1]});}}
}
const rawWet=(x,z)=>sourceWater.some(w=>w.polys.some(p=>pointInFlat(x,z,p.o)&&!p.h.some(h=>pointInFlat(x,z,h))));
function nearestSource(x,z){let best=null;for(const e of edges){const q=segment(x,z,e.ax,e.az,e.bx,e.bz);if(!best||q.d<best.d)best={...q,...e};}return best;}
const generated=[];for(const bank of waterGeo().banks)for(let i=0;i<bank.pts.length-1;i++){const a=bank.pts[i],b=bank.pts[i+1];if(inScope((a[0]+b[0])/2,(a[1]+b[1])/2))generated.push({bank:bank.id,key:bank.key,closed:bank.closed,index:i,ax:a[0],az:a[1],bx:b[0],bz:b[1]});}
function nearestBank(x,z){let best=null;for(const e of generated){const q=segment(x,z,e.ax,e.az,e.bx,e.bz);if(!best||q.d<best.d)best={...q,...e};}return best;}
for(const e of generated){const len=Math.hypot(e.bx-e.ax,e.bz-e.az);if(len<.02)continue;const n=Math.ceil(len/step),nx=(e.bz-e.az)/len,nz=-(e.bx-e.ax)/len;
 for(let i=0;i<n;i++){const t=(i+.5)/n,x=e.ax+(e.bx-e.ax)*t,z=e.az+(e.bz-e.az)*t;if(!inScope(x,z))continue;const src=nearestSource(x,z),left=rawWet(x-nx*.25,z-nz*.25),right=rawWet(x+nx*.25,z+nz*.25);report.counts.generatedBankSamples=(report.counts.generatedBankSamples||0)+1;
 if(left===right)record('bankWithoutHydraulicBoundary',{x,z,...e,wetBothSides:left,nearestSource:src});
 if(src&&src.d>.25)record('bankOffSourceShore',{x,z,...e,d:src.d,nearestSource:src});
 }}
for(const e of edges){const len=Math.hypot(e.bx-e.ax,e.bz-e.az);if(len<.02)continue;const n=Math.ceil(len/step),nx=(e.bz-e.az)/len,nz=-(e.bx-e.ax)/len;
 for(let i=0;i<n;i++){const t=(i+.5)/n,x=e.ax+(e.bx-e.ax)*t,z=e.az+(e.bz-e.az)*t;if(rawWet(x+nx*.25,z+nz*.25)===rawWet(x-nx*.25,z-nz*.25))continue;const b=nearestBank(x,z);if(!b||b.d>.5)record('sourceBoundaryWithoutBank',{x,z,...e,nearestBank:b});}}
const quads=slopeQuads();
for(const r of slopeRuns()){
 if(!r.bank.closed||r.s0>.01||Math.abs(r.s1-r.bank.len)>.01)continue;
 const a=r.fr[0],b=r.fr.at(-1);if(!inScope(a.x,a.z))continue;
 const delta=Math.hypot(a.mx*a.k-b.mx*b.k,a.mz*a.k-b.mz*b.k)*r.reach.run;
 if(delta>.01)record('closedSlopeMitreSeam',{bank:r.bank.id,x:a.x,z:a.z,delta,first:a,last:b,source:nearestSource(a.x,a.z)});
}
for(let qi=0;qi<quads.length;qi++){const q=quads[qi],x=q.q.reduce((a,p)=>a+p[0],0)/4,z=q.q.reduce((a,p)=>a+p[1],0)/4;if(!inScope(x,z))continue;report.counts.slopeQuads=(report.counts.slopeQuads||0)+1;
 let pos=0,neg=0;for(let i=0;i<4;i++){const a=q.q[i],b=q.q[(i+1)%4],c=q.q[(i+2)%4],cross=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);if(cross>1e-7)pos++;if(cross< -1e-7)neg++;}
 if(pos&&neg)record('nonConvexSlopeCut',{qi,x,z,q:q.q,reach:q.reach});
 if(rawWet(x,z)&&nearestSource(x,z)?.d>.25)record('slopeCutInsideOpenWater',{qi,x,z,q:q.q,nearestSource:nearestSource(x,z)});
}
const locations=process.env.AREA==='moskovskaya'?[[-1414,7319],[-1423,7289],[-1386,7158.4],[-1408,7248]]:[[near[0],near[1]]];
const cuts=waterCuts();
for(const cut of cuts){if(cut.kind!=='slope')continue;const x=cut.poly.reduce((a,p)=>a+p[0],0)/cut.poly.length,z=cut.poly.reduce((a,p)=>a+p[1],0)/cut.poly.length;if(!inScope(x,z))continue;report.counts.finalSlopeCuts=(report.counts.finalSlopeCuts||0)+1;let pos=false,neg=false;for(let i=0;i<cut.poly.length;i++){const a=cut.poly[i],b=cut.poly[(i+1)%cut.poly.length],c=cut.poly[(i+2)%cut.poly.length],cross=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);pos||=cross>1e-7;neg||=cross< -1e-7;}if(pos&&neg)record('nonConvexFinalSlopeCut',cut);}
for(const[x,z]of locations){const source=nearestSource(x,z),bank=nearestBank(x,z),b=waterGeo().banks.find(b=>b.id===bank?.bank);report.reported.push({x,z,rawWet:rawWet(x,z),layoutWater:L.waterwayAt(x,z),layoutHeight:L.heightAt(x,z),slopeAt:slopeAt(x,z),source,bank,bankEnds:b?{first:b.pts[0],last:b.pts.at(-1),len:b.len,runs:slopeRuns().filter(r=>r.bank===b).map(r=>({s0:r.s0,s1:r.s1,first:r.fr[0],last:r.fr.at(-1)}))}:null,cuts:cuts.filter(c=>pointInFlat(x,z,c.poly.flat())).map(c=>({kind:c.kind,key:c.key,poly:c.poly}))});}

if(args.includes('--geometry')){
 const {buildWorld}=await import('./lib/headless-world.mjs');
 const {ctx,THREE,errors}=await buildWorld({});report.moduleErrors=errors;
 ctx.staticRoot.updateMatrixWorld(true);const v=new THREE.Vector3(),matrix=new THREE.Matrix4(),triangles=[],cells=new Map(),cell=8;
 // Terrain is selected by its producer name, not by a copied height function.
 // Exclude tree crowns, walls, water and furniture. Both one-sided and double-
 // sided top faces count, and preserve triangle winding for backface reports.
 ctx.staticRoot.traverse(mesh=>{if(!mesh.isMesh||!mesh.geometry?.attributes.position||!/^(env-ground|env-quay-grass|env-quay-coping|brg-|coastal-bridges)/.test(mesh.name))return;const g=mesh.geometry,p=g.attributes.position,ix=g.index,n=ix?.count||p.count;
  const visit=()=>{for(let i=0;i<n;i+=3){const pts=[0,1,2].map(j=>{const k=ix?ix.getX(i+j):i+j;v.fromBufferAttribute(p,k).applyMatrix4(matrix);return [v.x,v.y,v.z];});const[a,b,c]=pts,normalY=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);if(Math.abs(normalY)<1e-8)continue;const cx=(a[0]+b[0]+c[0])/3,cz=(a[2]+b[2]+c[2])/3;if(!inScope(cx,cz)&&!pts.some(q=>inScope(q[0],q[2])))continue;
   const tri={pts,name:mesh.name,normalY,side:mesh.material.side},ti=triangles.length;triangles.push(tri);let x0=Math.min(a[0],b[0],c[0]),x1=Math.max(a[0],b[0],c[0]),z0=Math.min(a[2],b[2],c[2]),z1=Math.max(a[2],b[2],c[2]);for(let x=Math.floor(x0/cell);x<=Math.floor(x1/cell);x++)for(let z=Math.floor(z0/cell);z<=Math.floor(z1/cell);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(ti);}
  }};
  if(mesh.isInstancedMesh)for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);visit();}else{matrix.copy(mesh.matrixWorld);visit();}
 });
 function surface(x,z,allFaces=false){let best=null;for(const ti of cells.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[]){const t=triangles[ti],[a,b,c]=t.pts,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,w=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,vv=1-u-w;if(Math.min(u,w,vv)<-1e-6||!allFaces&&t.side!==THREE.DoubleSide&&t.normalY<0)continue;const y=u*a[1]+w*b[1]+vv*c[1];if(!best||y>best.y)best={y,name:t.name,triangle:ti,normalY:t.normalY};}return best;}
 const ph=ctx.physics;
 for(const t of triangles){if(t.name!=='env-quay-grass')continue;const[a,b,c]=t.pts;
  // Interior plus near-each-edge/vertex barycentrics expose seams that a
  // single triangle centroid misses, independently of the generating frames.
  for(const[u,w]of [[1/3,1/3],[.8,.1],[.1,.8],[.1,.1],[.45,.45],[.05,.45],[.45,.05]]){const vv=1-u-w,x=u*a[0]+w*b[0]+vv*c[0],z=u*a[2]+w*b[2]+vv*c[2],y=u*a[1]+w*b[1]+vv*c[1];if(!inScope(x,z))continue;report.counts.renderSlopeSamples=(report.counts.renderSlopeSamples||0)+1;
   const visible=surface(x,z);if(!visible){record('missingFrontFacingSlope',{x,z,y,triangle:t});continue;}
   if(Math.abs(visible.y-y)>.015)continue; // hidden lower sheet is checked by topmost visible surface only.
   const physical=ph.groundHeight(x,z,1,false),fromBelow=ph.groundHeight(x,z,y+.02,false);
   if(Math.abs(physical-y)>.06||Math.abs(fromBelow-y)>.06){const s=ph.surfaceAt(x,z,y+.02,false,{}),item=s.item||{};record('visibleSlopePhysicsMismatch',{x,z,render:y,physical,fromBelow,layout:L.heightAt(x,z),support:{kind:s.kind,type:item.type,id:item.id,cx:item.cx,cz:item.cz,w:item.w,d:item.d,y0:item.y0,y1:item.y1,rotY:item.rotY},rawWet:rawWet(x,z),source:nearestSource(x,z)});}
  }
 }
 // Sample every actual shoreline across the wet edge and through the full
 // apron; unlike an interior boat course this detects holes with no triangles.
 for(const e of edges){const len=Math.hypot(e.bx-e.ax,e.bz-e.az);if(len<.05)continue;const n=Math.ceil(len/(step*2)),nx=(e.bz-e.az)/len,nz=-(e.bx-e.ax)/len;
  for(let i=0;i<n;i++){const t=(i+.5)/n,x=e.ax+(e.bx-e.ax)*t,z=e.az+(e.bz-e.az)*t;const plus=rawWet(x+nx*.2,z+nz*.2),minus=rawWet(x-nx*.2,z-nz*.2);if(plus===minus)continue;const side=plus?-1:1;
   for(const off of [.12,.35,.7,1.2,1.8,2.25,2.6,3]){const px=x+nx*off*side,pz=z+nz*off*side;if(rawWet(px,pz))continue;const front=surface(px,pz),all=front||surface(px,pz,true);report.counts.dryApronSamples=(report.counts.dryApronSamples||0)+1;
    if(!front)record(all?'backFacingDryShore':'missingDryShoreSurface',{x:px,z:pz,off,source:e,layout:L.heightAt(px,pz),all});
   }
  }
 }
 for(const row of report.reported){row.renderSurface=surface(row.x,row.z);row.backfaceSurface=surface(row.x,row.z,true);row.physicalFloor=ph.groundHeight(row.x,row.z,1,false);row.physicsAtReportedSlope=ph.groundHeight(row.x,row.z,-.88,false);}
 report.counts.terrainTriangles=triangles.length;
}
if(opt('json',null)){const file=opt('json');fs.mkdirSync(new URL('.',new URL(file,'file:///'+process.cwd().replaceAll('\\','/')+'/')),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2));}
console.log(JSON.stringify({area:report.area,revision:report.revision,counts:report.counts,reported:report.reported},null,2));
// Concave raw footprints are diagnostic; river.js triangulates each one before
// convex subtraction. Strictness applies to the final cuts and actual surfaces.
if(args.includes('--strict')&&Object.keys(report.examples).some(k=>k!=='nonConvexSlopeCut'))process.exitCode=1;
