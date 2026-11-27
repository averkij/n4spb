// The Moscow Square fair, with its horse troika, and two pedestrian courts.
// Reference photographs and siting notes in docs/research/moskovskaya-winter.md.
import * as THREE from 'three';
import { VB } from './traffic/vb.js';
import { knockInstances } from './lib/knock-inst.js';

export const MOSKOVSKAYA_SQUARES = [
  { id: 'moscow-square-fair', tree: [-1618, 8933, 18],
    huts: [[-1630,8925,.9],[-1630,8933,.9],[-1630,8941,.9],[-1630,8949,.9]],
    arches: [[-1618,8921,0],[-1602,8933,Math.PI/2],[-1618,8953,0]],
    orbs: [[-1625,8920],[-1611,8920],[-1625,8953],[-1611,8953]] },
  { id: 'victory-park-entrance', tree: [-1657,7065,12],
    arches: [[-1654,7074,Math.PI/2],[-1664,7074,Math.PI/2]],
    orbs: [[-1651,7067],[-1669,7067]] },
  { id: 'national-library-square', tree: [-1758,7424,11],
    arches: [[-1768,7424,0],[-1781,7424,0]],
    orbs: [[-1752,7424],[-1756,7418]], snow: [-1763,7417] },
];

const ice='#ddf4ff', gold='#ffcb65', silver='#a4bbc5', garnet='#983c46';

function wire(builder, points, radius, color, segments, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal');
  const geo = new THREE.TubeGeometry(curve,segments,radius,5,closed);
  builder.add(geo,color);geo.dispose();
}

// Open wire figures with paired outlines and transverse hoops. The feet,
// raised foreleg, mane and arched neck read both in profile and from the front.
function horse(){
  const frame=new VB(), leds=new VB();
  const back=[[-1.22,1.42],[-1.40,1.13],[-1.85,.66],[-1.63,.62],[-1.18,1.07],
    [-.99,1.18],[-1.08,.65],[-1.44,.14],[-1.23,.09],[-.78,.58],[-.57,1.13],
    [.13,1.11],[.58,1.26],[.94,.96],[1.25,1.0],[1.42,1.35],[1.28,1.40],
    [1.13,1.16],[.95,1.20],[.81,1.66],[.89,2.20],[1.13,2.03],[1.43,2.02],
    [1.49,2.20],[1.21,2.44],[1.07,2.69],[1.01,2.95],[.90,2.74],
    [.76,2.88],[.71,2.65],[.47,2.53],[.21,2.18],[.01,1.81],[-.64,1.87],[-1.14,1.76]];
  frame.box(3.5,.12,.96,'#926a43',[-.12,.07,0]);
  for(const side of [-1,1]){
    const z=side*.30;
    wire(leds,back.map(([x,y])=>[x,y,z]),.029,ice,103,true);
    wire(leds,[[-.8,1.25,z],[-.65,.63,z],[-.32,.40,z],[-.15,.12,z],[.02,.11,z]],.045,silver,18);
    wire(leds,[[.58,1.3,z],[.55,.88,z],[.80,.46,z],[.76,.11,z],[.94,.11,z]],.043,silver,20);
    wire(leds,[[.08,1.78,z],[.35,2.16,z],[.49,2.38,z],[.81,2.63,z]],.055,gold,20);
    wire(leds,[[.14,1.16,z],[.25,1.49,z],[.12,1.79,z]],.06,gold,14);
    wire(leds,[[.68,1.88,z],[.99,2.0,z],[1.26,2.26,z]],.04,gold,14);
    leds.sph(.058,gold,[1.06,2.43,z+side*.014],6);
  }
  for(const [x,y,ry,rz] of [[-.91,1.50,.27,.30],[-.52,1.50,.30,.37],[-.12,1.49,.32,.38],[.26,1.56,.38,.35],[.53,2.1,.21,.29]]){
    const ring=Array.from({length:10},(_,i)=>[x,y+ry*Math.cos(i*Math.PI/5),rz*Math.sin(i*Math.PI/5)]);
    wire(leds,ring,.017,silver,16,true);
  }
  return [frame,leds];
}

function sleigh(){
  const frame=new VB(), leds=new VB();
  frame.box(2.35,.17,1.56,'#8f6444',[0,.64,0]);
  frame.box(.64,.16,1.50,garnet,[-.59,1.04,0]);
  frame.box(.14,1.04,1.54,garnet,[-.98,1.32,0],[0,0,-.15]);
  for(const s of [-1,1]){
    const z=s*.81;
    wire(leds,[[-1.73,.18,z],[-1.36,.13,z],[.80,.13,z],[1.45,.21,z],[1.69,.53,z],[1.55,.68,z],[1.43,.54,z]],.067,gold,38);
    for(const x of [-.79,.72])leds.rod([x-.18,.16,z],[x,.64,z],.052,gold);
    wire(leds,[[-1.0,.67,z],[-1.30,1.60,z],[-1.52,2.23,z],[-1.30,2.48,z],[-.99,2.31,z],
      [-.90,1.94,z],[-.62,1.36,z],[-.18,1.07,z],[.37,1.02,z],[.87,1.19,z],[1.13,1.57,z],
      [1.34,1.66,z],[1.41,1.49,z],[1.19,.83,z],[.76,.69,z]],.055,ice,60);
    for(const [x,y,r] of [[-.94,1.47,.30],[-.98,1.95,.18],[.83,1.0,.18],[-.32,.88,.12],[.28,.84,.1]]){
      const curl=Array.from({length:17},(_,i)=>{const a=i*.37,rad=r*(1-i/24);return [x+rad*Math.cos(a),y+rad*Math.sin(a),z];});
      wire(leds,curl,.027,gold,19);
    }
  }
  return [frame,leds];
}

export function buildMoskovskayaFestival(ctx,glow){
  const x=-1608,z=8945;
  if(!ctx.L.inPlay(x,z)||ctx.season!=='winter')return;
  // The paving rises to 0.145 m on the monument court. The central
  // pedestrian approach and all ten pool rings lie outside the installation.
  const stand={x,z,y:.15,rotY:0};
  const horses=[-.02, -1.65, 1.65].map((dz,i)=>({...stand,x:x+(i?1.65:2.52),z:z+dz}));
  const carriage={...stand,x:x-2.10};
  const net=ctx.services.streets?.net;
  const clear=s=>ctx.L.waterLevelAt(s.x,s.z)==null&&!ctx.L.insideBuilding(s.x,s.z,2)
    && !(net?net.cover(s.x,s.z,{})>=-2.5:ctx.L.isOnRoad(s.x,s.z,2.5))
    && !ctx.physics.columnBlocked(s.x,s.z,2,.32,2.95);
  if(![...horses,carriage].every(clear))return;
  const mat=ctx.mat.toon('#ffffff',{name:'moscow-square-sleigh-frame',vertexColors:true});
  for(const [kind,make,spots,w,d,h] of [['troika-horse',horse,horses,3.48,.94,2.98],['troika-sleigh',sleigh,[carriage],3.35,1.76,2.53]]){
    const [frame,leds]=make();
    knockInstances(ctx,{ name:kind, spots, far:225,
      parts:[{name:'frame',geo:frame.build(),mat},{name:'wire',geo:leds.build(),mat:glow,shadow:false,noOutline:true}],
      items:(_,s)=>ctx.physics.addBox(s.x,s.z,w,d,s.rotY,s.y,s.y+h),
      rec:{kind,w,d,h,mass:kind==='troika-horse'?70:128,metal:true},
    });
  }
}
