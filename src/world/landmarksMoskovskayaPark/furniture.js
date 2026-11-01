// White garden benches and the six stone portico seats are separate knockable
// fixtures. Shared part geometries, Dynamic matrices in 384 m cells, finite LOD.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { knockInstances } from '../lib/knock-inst.js';
import { safeSpot } from './kit.js';

const box=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x,y,z);
function merged(parts) {const g=mergeGeometries(parts);parts.forEach(g=>g.dispose());return g;}

export function furniture(ctx,M,svc) {
  for(const stone of [false,true]) {
    const spots=svc.benches.filter(s=>!!s.stone===stone&&safeSpot(ctx,s.x,s.z,s.len,.85,s.rotY));
    if(!spots.length)continue;
    const seats=stone?merged([box(1,.18,.65,0,.30,0),box(.13,.30,.6,-.36,.15,0),box(.13,.30,.6,.36,.15,0)]):merged([
      ...Array.from({length:4},(_,i)=>box(1,.085,.13,0,.47,-.26+i*.17)),
      ...Array.from({length:3},(_,i)=>box(1,.12,.075,0,.68+i*.16,-.32)),
    ]);
    const frames=merged([box(.055,.46,.58,-.35,.23,0),box(.055,.46,.58,.35,.23,0),box(.055,.55,.07,-.35,.75,-.32),box(.055,.55,.07,.35,.75,-.32)]);
    const matrix=(spot)=>new THREE.Matrix4().compose(new THREE.Vector3(spot.x,spot.y||0,spot.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),spot.rotY||0),new THREE.Vector3(spot.len,1,1));
    const items=spots.map(s=>ctx.physics.addBox(s.x,s.z,s.len,.83,s.rotY,s.y||0,(s.y||0)+(stone?.44:1.1)));
    const parts=[{geo:seats,mat:stone?M.granite:M.trim,place:matrix}];
    if(!stone)parts.push({geo:frames,mat:M.iron,place:matrix});
    const built=knockInstances(ctx,{name:stone?'moskovskaya-park-stone-benches':'moskovskaya-park-white-benches',spots,parts,items,far:300,
      rec:s=>({kind:'bench',mass:stone?180:65,h:stone?.44:1.1,w:s.len,d:.83,anchored:stone?15:9,hitK:.5,metal:!stone})});
    spots.forEach((s,i)=>s.knock=built.records[i]);
  }
  if(!svc.lamps.length)return;
  const pole=merged([new THREE.CylinderGeometry(.085,.13,5.1,8).translate(0,2.55,0),new THREE.CylinderGeometry(.24,.29,.35,10).translate(0,.175,0),new THREE.CylinderGeometry(.29,.21,.35,10).translate(0,5.55,0),new THREE.SphereGeometry(.10,8,4).translate(0,5.91,0)]);
  const glow=new THREE.SphereGeometry(.26,10,7).scale(1,1.35,1).translate(0,5.24,0);
  const items=svc.lamps.map(s=>ctx.physics.addCylinder(s.x,s.z,.18,s.y||0,(s.y||0)+5.9));
  const built=knockInstances(ctx,{name:'moskovskaya-park-lanterns',spots:svc.lamps,parts:[{geo:pole,mat:M.iron},{geo:glow,mat:M.trim}],items,far:360,
    rec:{kind:'lamp',mass:100,h:5.95,r:.3,anchored:13,hitK:.45,metal:true}});
  svc.lamps.forEach((s,i)=>s.knock=built.records[i]);
}
