// CPU actual-triangle evidence for the reported Birzhevoy boat view.
// node tools/area.mjs vasilyevsky tools/bridge-underdeck-audit.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from './lib/headless-world.mjs';
import {BIRZHEVOY} from '../src/world/bridges/long.js';
import {frameOf} from '../src/world/bridges/sites.js';
import {deckAt,longDeckHeight,setDecksEnabled} from '../src/world/streets/decks.js';
import {buildLaneGraph} from '../src/world/streets/lanegraph.js';
import {planMarkings} from '../src/world/streets/markings.js';
const {ctx,THREE,errors}=await buildWorld({});
ctx.scene.updateMatrixWorld(true);const f=frameOf(BIRZHEVOY),v=new THREE.Vector3(),matrix=new THREE.Matrix4(),box=new THREE.Box3(),worldBox=new THREE.Box3(new THREE.Vector3(-2730,-3.41,-1570),new THREE.Vector3(-2655,2.7,-1515)),rows=new Map();
const uv=p=>{const x=p[0]-f.cx,z=p[2]-f.cz;return[x*f.c+z*f.s,-x*f.s+z*f.c];};
ctx.scene.traverse(m=>{if(!m.isMesh||!m.geometry?.attributes.position)return;const g=m.geometry,p=g.attributes.position,ix=g.index,n=ix?.count||p.count;g.computeBoundingBox();
 const inspect=instance=>{box.copy(g.boundingBox).applyMatrix4(matrix);if(!box.intersectsBox(worldBox))return;
  for(let i=0;i<n;i+=3){const pts=[0,1,2].map(j=>{v.fromBufferAttribute(p,ix?ix.getX(i+j):i+j).applyMatrix4(matrix);return[v.x,v.y,v.z];});const c=pts[0].map((_,k)=>pts.reduce((a,p)=>a+p[k],0)/3),[u,w]=uv(c);
   if(u<95||u>145||Math.abs(w)>15||Math.max(...pts.map(p=>p[1]))< -3.41||Math.min(...pts.map(p=>p[1]))>2.7)continue;
   const name=m.name||m.parent?.name||'(unnamed)',key=name+' '+(m.material.name||m.material.color?.getHexString()),row=rows.get(key)||{name,material:m.material.name||m.material.color?.getHexString(),triangles:0,yMin:Infinity,yMax:-Infinity,examples:[]};row.triangles++;row.yMin=Math.min(row.yMin,...pts.map(p=>p[1]));row.yMax=Math.max(row.yMax,...pts.map(p=>p[1]));if(row.examples.length<3)row.examples.push({instance,triangle:i/3,c,u,w,pts});rows.set(key,row);
  }
 };
 if(m.isInstancedMesh)for(let i=0;i<m.count;i++){m.getMatrixAt(i,matrix);matrix.premultiply(m.matrixWorld);inspect(i);}else{matrix.copy(m.matrixWorld);inspect(null);}
});
const report={area:process.env.AREA,frame:f,errors,meshes:[...rows.values()].sort((a,b)=>b.triangles-a.triangles)};
fs.mkdirSync('shots/bridge-underdeck',{recursive:true});fs.writeFileSync('shots/bridge-underdeck/birzhevoy.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.meshes.map(({examples,...r})=>r),null,2));
assert.equal(errors.length,0,'real world modules build without errors');
assert(ctx.services.bridges.list.some(b=>b.id==='birzhevoy'),'test must include the actual bridge module');
assert(!report.meshes.some(m=>m.name.startsWith('pt-')),'no flat generic paving, skirts or unraised wire mast intersects the reported underdeck window');
const world=(u,v)=>[f.cx+u*f.c-v*f.s,f.cz+u*f.s+v*f.c];
const streets=[];ctx.scene.traverse(m=>{if(m.isMesh&&m.name.startsWith('pt-'))streets.push(m);});
const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);let undersideRays=0;
for(let u=97;u<=143;u+=2)for(const w of[-12.2,-11.2,11.2,12.2]){
 const[x,z]=world(u,w);ray.set(new THREE.Vector3(x,2.35,z),down);ray.far=2.5;
 assert.equal(ray.intersectObjects(streets,false).length,0,'actual generic street triangles do not lie below the raised bridge at '+x+','+z);undersideRays++;
}
const masts=ctx.services.streets.wires.masts.filter(m=>longDeckHeight(m.x,m.z)!=null);assert(masts.length,'actual bridge trolley supports exercised');
for(const m of masts){const y=longDeckHeight(m.x,m.z);assert(Math.abs(m.y-(y+.12))<1e-6,'mast draw base rests on raised pavement');
 const cs=ctx.physics.items.filter(c=>c.type==='cyl'&&Math.abs(c.cx-m.x)<.001&&Math.abs(c.cz-m.z)<.001&&Math.abs(c.r-.22)<.001);
 assert(cs.some(c=>Math.abs(c.y0-y)<1e-6&&Math.abs(c.y1-y-4)<1e-6),'actual wire mast collider starts at its raised deck, never in the boat opening');
 assert(cs.some(c=>c.source?.knock?.kind==='mast'),'LONG deck support retains shared collision breakability');}
const pairs=ctx.services.streets.wires.pairs.flatMap(q=>q.pts).filter(p=>longDeckHeight(p[0],p[2])!=null);assert(pairs.length,'actual trolley contact wires exercised');
for(const p of pairs)assert(p[1]-longDeckHeight(p[0],p[2])>5,'published trolley contact service has safe height above the deck');
const center=world(BIRZHEVOY.len/2,0);assert.equal(deckAt(...center)?.id,'birzhevoy');
for(const u of[-3,BIRZHEVOY.len+3])assert.notEqual(deckAt(...world(u,0))?.id,'birzhevoy','long-bridge reservation ends before the approaches');
setDecksEnabled(false);assert.equal(deckAt(...center),null,'streets-only builds retain their fallback crossing');assert.equal(longDeckHeight(...center),null);setDecksEnabled(true);
const mast=masts.find(m=>{const[u]=uv([m.x,0,m.z]);return u>100&&u<140;});assert(mast);
const rec=ctx.knock.list.find(r=>r.kind==='mast'&&Math.hypot(r.x-mast.x,r.z-mast.z)<.01);assert(rec&&rec.y>2.5,'knock model is anchored on elevated deck');
ctx.knock.snap(rec,f.c,f.s,12);assert(rec.items.every(c=>c.dead),'a car impact removes the elevated mast collider');
for(let i=0;i<120;i++)ctx.knock.update(1/60);
const part=rec.parts[0];part.mesh.getMatrixAt(part.index,matrix);assert(matrix.elements.every(Number.isFinite),'toppled raised mast keeps a finite instance transform');
// Reserving a deck must not delete the traffic planner's signalised stop bar.
// Strict marking coverage only tests XZ, so independently ray-test its height
// against the actual authored humped asphalt, rather than repeating its formula.
const net=ctx.services.streets.net,plan=planMarkings(net,buildLaneGraph(net));
const signal=ctx.services.streets.signals.find(s=>s.id==='n3670418898');assert(signal);
const sl=ctx.services.streets.stopLines.find(s=>s.signal===signal.id&&s.approach===0);assert(sl);
const bar=plan.bars.find(b=>b.junction===sl.junction&&b.approach===sl.approach&&b.longDeck);assert(bar,'the real Birzhevoy signal approach retains its planned stop bar');
const paint=[],asphalt=[];ctx.scene.traverse(m=>{if(!m.isMesh)return;if(m.material?.name==='pt-paint')paint.push(m);if(m.name==='brg-birzhevoy'&&m.material?.name==='brg-asphalt')asphalt.push(m);});
ray.layers.enableAll(); // Paint deliberately uses the no-outline layer.
let stopBarRays=0;
for(const u of[-bar.depth*.2,-bar.depth*.8])for(let k=1;k<10;k++){
 const c=bar.a+(bar.b-bar.a)*k/10,x=bar.x+bar.tx*u-bar.tz*c,z=bar.z+bar.tz*u+bar.tx*c;
 ray.set(new THREE.Vector3(x,3,z),down);ray.far=4;const ink=ray.intersectObjects(paint,false)[0],road=ray.intersectObjects(asphalt,false)[0];
 assert(ink&&road,'actual stop-bar and bridge asphalt cover the same lane point');assert(ink.point.y-road.point.y>.005&&ink.point.y-road.point.y<.06,'stop bar follows the visible raised approach surface');stopBarRays++;
}
console.log('PASS Birzhevoy actual underside: '+undersideRays+' rays; '+masts.length+' raised mast meshes/colliders; '+pairs.length+' raised contact-service points; approach and streets-only reservations');
console.log('PASS actual raised signal stop bar: '+stopBarRays+' independent paint/asphalt ray pairs');

