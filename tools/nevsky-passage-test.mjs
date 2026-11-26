// Street -> carriage vault -> courtyard, with the actual player and coupe.
import assert from 'node:assert/strict';
import { buildWorld, SKIP } from './lib/headless-world.mjs';
import { Player } from '../src/core/player.js';
import { createHandling } from '../src/world/drive/handling.js';

const {ctx,L,THREE,errors}=await buildWorld({season:'winter',skip:SKIP.filter(m=>m!=='city')});
assert.deepEqual(errors,[]);
const car=createHandling(ctx);
const player=new Player(new THREE.PerspectiveCamera(),{addEventListener(){}},ctx.physics,L.WORLD.play);
player.enabled=true;
const street=[318.4,74.2], yard=[324.1,53.5];
for(const [a,b] of [[street,yard],[yard,street]]){
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len;
  const moved=p=>(p.x-a[0])*ux+(p.z-a[1])*uz;
  const x=a[0]-ux*3.0,z=a[1]-uz*3.0;
  player.setPose(x,z,Math.atan2(-ux,-uz)*180/Math.PI,0,1.6,{stand:true});
  player.keys.add('KeyW');
  for(let i=0;i<1200 && moved(player.pos)<len+2.5;i++)player.update(1/60);
  assert(moved(player.pos)>len+2,'walking through both mouths: '+moved(player.pos));
  car.reset(x,z,Math.atan2(ux,uz));
  for(let i=0;i<600 && moved(car)<len+2.5;i++)car.step(1/60,{thr:.3,brk:0,steer:0});
  assert(moved(car)>len+2,'driving through both mouths: '+moved(car));
}
console.log('PASS Nevsky carriage passage on foot and by car in both directions');
