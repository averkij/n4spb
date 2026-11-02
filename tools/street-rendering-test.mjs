// Regressions for roof closure, straight paired-road dividers, raised tram
// paving and independently breakable station flower fences.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ColorBuilder, addCornice, CORNICE_SIMPLE, CORNICE_H } from '../src/world/city/cornice.js';
import { medOffsets } from '../src/world/streets/markings.js';
import { buildWorld } from './lib/headless-world.mjs';
import { buildTramRails } from '../src/world/streets/extras.js';
import { MB } from '../src/world/streets/util.js';

const ring = { pts: [[0,0],[4,0],[4,4],[0,4]] }, B = new ColorBuilder();
addCornice(B, { ring, i: 0, a: [0,0], b: [4,0], len: 4, dx: 1, dz: 0, nx: 0, nz: -1, pieces: [{t0:0,t1:4}] }, 0, new THREE.Color('white'), 1, CORNICE_SIMPLE);
const cornice = new THREE.Mesh(B.build(), new THREE.MeshBasicMaterial());
cornice.updateMatrixWorld();
const ray = new THREE.Raycaster();
for(let y=.025;y<CORNICE_H;y+=.05){
  ray.set(new THREE.Vector3(2,y,-2),new THREE.Vector3(0,0,1));
  assert(ray.intersectObject(cornice).length, `courtyard cornice must close the shell at ${y.toFixed(2)}m`);
}

const partner = {n:5,x:[40,30,20,10,0],z:[-14,-14,-14,-14,-14],hL:[7,8,9,7,7],hb:[7,7,7,7,7]};
const way = {n:5,x:[0,10,20,30,40],z:[0,0,0,0,0],hL:[7,9,8,7,7],hb:[7,7,7,7,7],med:[1,1,1,1,1],medPartner:Array(5).fill(partner)};
assert(medOffsets(way).every(v=>Math.abs(v+7)<1e-9),'junction flares must not bend a straight shared divider');
delete way._medOff; partner.x=[30,20,10,0,-10];
assert(medOffsets(way).every(v=>Math.abs(v+7)<1e-9),'a carriageway endpoint must not pull the divider diagonally');

const {ctx,L,errors} = await buildWorld({modules:['streets']});
assert.deepEqual(errors,[]);
const panels=ctx.knock.list.filter(r=>r.parts.some(p=>p.mesh?.name.startsWith('pt-guard-rails')));
if(L.inPlay(589,173)){
assert(panels.length>100,'real station and Ligovsky flower panels must register');
assert(panels.every(r=>r.parts.length===3&&(!r.item||r.item.fence)),'iron, pickets and flowers share one body; road-clipped collider handles remain with their panel');
const solidPanels=panels.filter(r=>r.item);
assert(solidPanels.length>100);
const panel=solidPanels.reduce((a,b)=>Math.hypot(a.x-589,a.z-173)<Math.hypot(b.x-589,b.z-173)?a:b);
const neighbor=panels.find(r=>r!==panel&&Math.hypot(r.x-panel.x,r.z-panel.z)<4);
assert(neighbor);
const collider=panel.item, before=panel.parts.map(p=>{const m=new THREE.Matrix4();p.mesh.getMatrixAt(p.index,m);return m.toArray();});
ctx.knock.hit(panel.x,panel.z,40,1,0,'fence');
for(let i=0;i<120;i++)ctx.knock.update(.05);
assert.notEqual(panel.state,'stand');
assert(!ctx.physics.items.includes(collider),'hit panel opens a passable gap');
assert.equal(neighbor.state,'stand','adjacent panels stay standing');
assert(panel.parts.every((p,i)=>{const m=new THREE.Matrix4();p.mesh.getMatrixAt(p.index,m);return m.toArray().some((v,k)=>Math.abs(v-before[i][k])>1e-5);}), 'flowers and pickets move with the iron');
console.log(`  flower panel (${panel.x.toFixed(1)},${panel.z.toFixed(1)}): gap opened, all three parts moved, neighbor standing`);
}

if(L.inPlay(-1717.9,7325.7)){
  const rails=new MB(true); buildTramRails(ctx.services.streets.net,rails,null);
  const near=[];
  for(let i=0;i<rails.pos.length;i+=3) if(Math.hypot(rails.pos[i]+1717.9,rails.pos[i+2]-7325.7)<8)near.push(rails.pos[i+1]);
  assert(near.length>=4&&near.every(y=>y>.12),'tram heads at the reported Moskovsky median must be above its paving');
}
console.log(`PASS roof closure, stable dividers and ${panels.length} breakable flower panels (${L.ID || process.env.AREA || 'strip'})`);
