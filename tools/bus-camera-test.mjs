import assert from 'node:assert/strict';
import {busChaseFloor} from '../src/world/drive/chase-clearance.js';
const spec={bus:true,W:2.55,len:18,front:5.55,rear:-12.45,hgt:3.15};
for(const yaw of [0,Math.PI/2,-.72]){
 const car={x:40,z:-12,y:.03,yaw,pitch:0,roll:0};
 const point=(x,z)=>[car.x+Math.cos(yaw)*x+Math.sin(yaw)*z,car.z-Math.sin(yaw)*x+Math.cos(yaw)*z];
 for(const z of [0,-6,-12])assert.equal(busChaseFloor(spec,car,...point(0,z)),3.53,'retracted boom above full front and tail body');
 assert.equal(busChaseFloor(spec,car,...point(0,-14)),null,'ordinary rear chase stays unchanged');
 assert.equal(busChaseFloor(spec,car,...point(3,-6)),null,'clear side view stays unchanged');
 assert.equal(busChaseFloor({...spec,bus:false},car,...point(0,-6)),null,'car/boat camera behavior unchanged');
 car.pitch=.1;car.roll=.08;assert(busChaseFloor(spec,car,...point(0,-6))>4.7,'pitched/rolled roof is also cleared');
}
console.log('PASS bus chase camera clears full asymmetric body at every heading, with unchanged unobstructed/car views');
