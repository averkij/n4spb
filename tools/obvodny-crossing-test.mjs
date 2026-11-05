// Run with: node tools/area.mjs vladimirsky tools/obvodny-crossing-test.mjs
import assert from 'node:assert/strict';
import { buildGeometry } from '../src/world/rail/geom.js';
import { railLift,DECK_Y,DECK_THICKNESS,buildObvodnyDecks } from '../src/world/rail/obvodny.js';
import { Buckets } from '../src/world/rail/gb.js';
import * as L from '../src/world/layout.js';
import { buildNet } from '../src/world/streets/net.js';
import { buildLaneGraph } from '../src/world/streets/lanegraph.js';
import { planMarkings } from '../src/world/streets/markings.js';
import { Physics } from '../src/core/physics.js';

const G=buildGeometry();
const bridge=G.paths.find(p=>p.id==='w128393677');
assert(bridge,'real Obvodny crossing is present');
for(let s=0;s<=bridge.len;s+=2)assert(bridge.at(s).dy>6,'bridge rails clear the embankment roads');
for(const p of G.paths){
  let prev=p.at(0);
  for(let s=1;s<=p.len;s++){
    const q=p.at(s);
    assert(Math.abs(q.dy-prev.dy)<.08,`${p.id}: railway height jumps at ${s}: ${prev.dy} -> ${q.dy}`);
    prev=q;
  }
}
assert.equal(G.paths.find(p=>p.id==='w128393677').electrified,false,'electrified=no must not create overhead wires');
assert(G.paths.find(p=>p.id==='w128393675').electrified,'electrified tracks retain their wires');
assert(Object.values(G.tracks).every(p=>p.at(p.len/2).dy===0),'Moscow station platforms remain at their established datum');
assert.equal(railLift(600,600),0);
const triangles=[],boxes=[];
const bk=new Buckets(48);
buildObvodnyDecks({L,physics:{addWalkTriangle:(p,t)=>triangles.push({p,t}),addBox:(...b)=>boxes.push(b)}},bk);
assert(triangles.length>20,'raised decks have real walkable surfaces and approaches');
assert(triangles.some(({p})=>p.every(q=>q[1]===DECK_Y)));
assert(triangles.every(({t})=>t===DECK_THICKNESS),'thin slabs leave the roads and water open beneath');
assert(boxes.every(b=>!L.isOnRoad(b[0],b[1],2)&&!L.inRiver(b[0],b[1])),'abutments keep out of roads and water');
const physics=new Physics(()=>0);
for(const {p,t} of triangles)physics.addWalkTriangle(p,t);
for(let s=8;s<bridge.len-8;s+=4){
  const q=bridge.at(s);
  assert(!physics.columnBlocked(q.x,q.z,.7,0,3),'walker, car and boat clearance below the slab');
  assert(Math.abs(physics.groundHeight(q.x,q.z,8,false)-DECK_Y)<.01,'deck is walkable from above');
}
console.log(`Rail crossing: ${triangles.length} walk triangles, ${boxes.length} abutments; heights continuous and roads clear`);

const net=buildNet(L),graph=buildLaneGraph(net),plan=planMarkings(net,graph);
const branchIds=new Set(['w180061361','w223469930']);
const duplicate=plan.lines.filter(l=>l.kind.startsWith('median')&&branchIds.has(net.ways[l.way].id)&&l.pts.some(p=>Math.hypot(p.x+902,p.z-2014)<23));
assert.equal(duplicate.length,0,'fork branches must not draw extra dividers beside the opposite carriageway');
const owner=plan.lines.filter(l=>l.kind==='median-double'&&net.ways[l.way].id==='w290481976');
assert.equal(owner.length,2,'the main carriageway retains exactly one double centre line');
console.log('PASS Obvodny raised railway and single fork divider');
