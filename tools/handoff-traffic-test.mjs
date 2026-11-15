import assert from 'node:assert/strict';
import { makeHo, validateHo, encodeHo, decodeHo, arrivalUrl, MAX_HO_CHARS, TRAFFIC_HANDOFF_MODELS, TRAFFIC_HANDOFF_PLATES,TRAFFIC_HANDOFF_ROUTES } from '../src/core/handoff.js';
import { carHandoff, planArrival } from '../src/core/gates.js';
import { DRIVABLE_KINDS, PLATES_COUNT,ROUTES } from '../src/world/traffic/fleetdata.js';
assert.deepEqual(TRAFFIC_HANDOFF_MODELS,DRIVABLE_KINDS,'Runtime-only protocol catalogue matches enterable fleet');assert.equal(TRAFFIC_HANDOFF_PLATES,PLATES_COUNT);assert.equal(TRAFFIC_HANDOFF_ROUTES,ROUTES.length);
const state={front:.3224,rear:0,left:.021,right:1},base={from:'palace',to:'smolny',via:'place',gate:'cross-place',ret:{x:234.123,z:-439.933,yaw:37,pitch:0}};
let largest=0;
for(const model of DRIVABLE_KINDS)for(const livery of [0,1,2,4,7]){
  const traffic={model,color:'#ABCDEF',plate:35,livery,route:60};
  const drive={vehicle:{id:'traffic-car-1234567890',kind:'traffic',def:{traffic}},damage:{state},view:{mode:2}};
  const ho=makeHo({...base,car:carHandoff(drive)}),encoded=encodeHo(ho);largest=Math.max(largest,encoded.length);
  assert.equal(validateHo(ho).ok,true);assert.deepEqual(decodeHo(encoded).ho,ho);assert.equal(ho.car.traffic.color,'#abcdef');assert.equal(ho.car.id,drive.vehicle.id);assert.equal(ho.car.view,2);assert.deepEqual(ho.car.d,[.322,0,.021,1]);
  traffic.color='#000000';assert.equal(ho.car.traffic.color,'#abcdef','Handoff owns a copy of its metadata');
  const url=arrivalUrl({page:'smolny.html',pose:{x:10,z:20,yaw:0},ho});
  const L={inPlay:()=>true,insideBuilding:()=>false,inRiver:()=>true,roadsNear:()=>[],HERO:{x:0,z:0,yaw:0}};
  const arrival=planArrival({L,A:{ID:'smolny'},params:new URL(url,'http://local/').searchParams});
  assert(arrival&&!arrival.invalid);assert.equal(arrival.ho.car.traffic.model,model);assert.equal(arrival.mode,'car');
}
const good=makeHo({...base,car:{id:'traffic-car-1',kind:'traffic',view:0,d:[0,0,0,0],traffic:{model:'sedan',color:'#112233',plate:0,livery:0}}});
for(const [key,bad] of [['model','../sedan'],['model','tram'],['model','artic_r'],['color','red'],['color','#fff'],['color','#1234567'],['plate',-1],['plate',36],['plate',1.5],['plate',NaN],['livery',8],['livery',-1],['livery','1'],['route',-1],['route',61],['route',.5]]){
  const ho=structuredClone(good);ho.car.traffic[key]=bad;assert.equal(validateHo(ho).ok,false,`${key}: ${bad}`);
}
for(const bad of [undefined,null,[],{}, {...good.car.traffic,extra:1}]){const ho=structuredClone(good);ho.car.traffic=bad;assert.equal(validateHo(ho).ok,false);}
for(const id of ['roadster','traffic-car-','traffic-car-12345678901','../traffic-car-1'])assert.equal(validateHo({...good,car:{...good.car,id}}).ok,false);
for(const kind of [undefined,'boat'])assert.equal(validateHo({...good,car:{...good.car,kind}}).ok,false);
assert.equal(validateHo({...good,car:{...good.car,view:'near'}}).ok,false);
assert(largest<MAX_HO_CHARS,`Traffic handoff fits existing limit: ${largest}`);
console.log(`PASS ${DRIVABLE_KINDS.length} traffic archetypes, identity/livery/route/damage/view round trips, cross-area planning, malformed payload rejection; largest ${largest}/${MAX_HO_CHARS} characters`);
