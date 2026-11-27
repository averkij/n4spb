// Inspect both actual instances through a complete gait cycle in each season.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildWorld } from './lib/headless-world.mjs';
import { createCrowd, makeSpec } from '../src/world/people/chars.js';
import { newState, MODE } from '../src/world/people/contract.js';

function inspectLast(geometry) {
  const p = geometry.attributes.position, points = [];
  for (let i = 0; i < p.count; i++) points.push(new THREE.Vector3().fromBufferAttribute(p, i));
  const at = z => Math.max(...points.filter(v => Math.abs(v.z-z)<.0001).map(v => Math.abs(v.x)));
  assert(at(.119)>at(.041) && at(.041)>at(-.068) && at(.178)>at(.2), 'heel, waist, ball and tapered toe');
  assert(geometry.index.count / 3 <= 26, 'near shoe triangle budget');
  assert(Math.max(...points.map(v=>v.y)) >= .02, 'collar meets the end of the shin');
  assert(Math.abs(Math.min(...points.map(v=>v.y)) + .09) < 1e-6);
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i=0; i<geometry.index.count; i+=3) {
    const [v0,v1,v2] = [0,1,2].map(j => points[geometry.index.getX(i+j)]);
    assert(a.subVectors(v1,v0).cross(b.subVectors(v2,v0)).lengthSq() > 1e-12, 'nondegenerate shoe panel');
  }
  return points;
}

for (const season of ['summer','winter']) {
  const {ctx, errors} = await buildWorld({modules:[],season});
  assert.deepEqual(errors, []);
  const crowd = createCrowd(ctx), rng = ctx.rng('shoe-contact'), actors = [];
  for (const fem of [false,true]) for (const kind of ['sneaker','flat','sandal']) {
    const spec = makeSpec(rng, {arch:fem?'office_f':'office_m', fem});
    spec.look.foot = kind;
    actors.push({id:crowd.add(spec), kind:season === 'winter' ? 'boot' : kind});
  }
  crowd.finalize();
  const shoes = ctx.dynamicRoot.children.filter(m=>m.name.startsWith('ppl-ft|'));
  assert.equal(shoes.length, season==='summer' ? 3 : 1);
  assert.equal(new Set(shoes.map(m=>m.material)).size,1, 'all shoe variants share their instanced material');
  const shapes = new Map(shoes.map(m=>[m.name,inspectLast(m.geometry)]));
  if (season === 'winter') {
    const shins = ctx.dynamicRoot.children.filter(m=>m.name.startsWith('ppl-sh|'));
    for (const {geometry:g} of shins) {
      const slots=g.attributes.aSlot, p=g.attributes.position, cuff=[];
      for (let i=0;i<p.count;i++) if(slots.getX(i)===2) cuff.push(p.getY(i));
      assert(Math.max(...cuff)-Math.min(...cuff)>.125,'articulated boot shaft reaches trouser cuff');
    }
  }
  const matrix = new THREE.Matrix4(), v = new THREE.Vector3();
  let samples = 0;
  for (const {id,kind} of actors) {
    const person = crowd.persons[id], st = newState(), mesh = shoes.find(m=>m.name==='ppl-ft|'+kind);
    const shapesBySide = ['L','R'].map(side=>shapes.get('ppl-'+person.ref['ft'+side].key));
    st.mode = MODE.WALK; st.y = .18; st.yaw = .73;
    const contacts = [0,0], swings = [0,0], heelFirst = [0,0], toeLast = [0,0];
    for (let i=0; i<=180; i++) {
      st.speed = i ? 1.32 : 0;
      st.dist = i / 90 * person.strideW;
      st.x = st.dist * Math.sin(st.yaw); st.z = st.dist * Math.cos(st.yaw);
      crowd.render(id, st, 1 + i / 60);
      for (const [j, side] of ['L','R'].entries()) {
        const slot = person.slots['ft'+side];
        assert.equal(mesh.geometry.attributes.iA.getX(slot.s),j ? 0 : 1,'mirrored last and straps');
        matrix.fromArray(slot.arr, slot.off);
        let floor=Infinity, heel=Infinity, toe=Infinity;
        for (const vertex of shapesBySide[j]) {
          const height = v.copy(vertex).applyMatrix4(matrix).y-st.y;
          floor = Math.min(floor,height);
          if (vertex.z < -.06) heel=Math.min(heel,height);
          if (vertex.z > .17) toe=Math.min(toe,height);
        }
        assert(floor>-.016,'outsole penetrates the ground by '+(-floor).toFixed(3)+' m');
        if (!i) assert(Math.abs(floor)<.019, 'both feet settle on the surface at rest');
        if (floor<.018) {
          contacts[j]++;
          if (toe-heel>.035) heelFirst[j]++;
          if (heel-toe>.035) toeLast[j]++;
        }
        if (floor>.055) swings[j]++;
        samples++;
      }
    }
    for (const phases of [contacts, swings, heelFirst, toeLast]) assert(phases.every(n=>n>2),kind+' gait phases '+phases);
    crowd.renderFar(id,st);
    assert(crowd.isFar(id) && !person.shown,'far figure frees both detailed shoes');
  }
  console.log(season,'PASS',actors.length,'walkers,',samples,'foot poses,',shoes.length,'instanced shoe variants');
}
