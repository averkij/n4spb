import assert from 'node:assert/strict';
import { GATES } from '../src/areas/registry.js';
import { createGateMachine } from '../src/core/gates.js';
import { toWorld } from '../src/world/landmarksTroitsky/frame.js';

for(const mode of ['walk','car','fly'])for(const speed of mode==='walk'?[1.5]:[18,30,60])for(const lateral of [-11,-6,6,11]){
  const machine=createGateMachine({gates:GATES.filter(g=>g.from==='palace'&&g.kind==='edge'),config:{graceS:0}});
  const dt=1/30;
  let offer;
  for(let s=80;s<680;s+=speed*dt){
    const p=toWorld(s,lateral),r=machine.update({dt,x:p.x,z:p.z,mode,blocked:false});
    if(r.offer){offer=r.offer;break;}
  }
  assert.equal(offer?.to,'kronverk',`${mode} at ${speed} m/s, lateral ${lateral}: Troitsky must enter Kronverk by default`);
}
assert(GATES.some(g=>g.from==='palace'&&g.to==='aptekarsky'),'Aptekarsky stays reachable');
assert(GATES.some(g=>g.from==='kronverk'&&g.to==='palace'),'the return gate stays available');
// Without the requested local preference, the ordinary overlap order still
// chooses Aptekarsky. The corridor changes the destination, not eligibility.
const ordinary=createGateMachine({gates:GATES.filter(g=>g.from==='palace'&&g.kind==='edge').map(({preferWithin,...g})=>g),config:{graceS:0}});
let fallback;
for(let s=80;s<680;s+=.5){const p=toWorld(s,6),r=ordinary.update({dt:1/30,x:p.x,z:p.z,mode:'walk',blocked:false});if(r.offer){fallback=r.offer;break;}}
assert.equal(fallback?.to,'aptekarsky');
console.log('PASS Troitsky → Kronverk: walking, driving and flying on both lanes and pavements; alternative and reverse gates retained');
