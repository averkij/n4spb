// Four-column ochre porticoes, six bronze reliefs, laurel frieze and the
// Glory fountain. Geometry/photo references: docs/research/moskovskaya-park.md.
import { site, porticoFrame, entranceApproach } from './sites.js';
import { safeSpot } from './kit.js';
import { liveFountain } from '../lib/live-fountain.js';

function relief(P,M,x,back) {
 P.push(0,0,back+2);
 // Three compressed, posed figures cast together on a bronze bracket. No flags.
 P.box(M.bronze,x,3.0,-1.72,1.65,.13,.24,240);
 for(let i=0;i<3;i++) {const u=x+(i-1)*.45,head=4.52+(i===1?.10:0);
  P.sphere(M.bronze,u,head,-1.57,.30,.37,.13);P.sphere(M.bronze,u,head-.68,-1.56,.45,.95,.18);
  P.beam(M.bronze,[u-.10,3.66,-1.53],[u-.13,3.12,-1.52],.065,240);P.beam(M.bronze,[u+.10,3.66,-1.53],[u+.18,3.13,-1.50],.066,240);
  P.beam(M.bronze,[u-.19,4.2,-1.51],[u-.26,3.63,-1.48],.065,240);P.beam(M.bronze,[u+.19,4.2,-1.5],[u+.3,4.35+(i===1?.25:0),-1.46],.063,240);
 }
 P.pop();
}
function portico(ctx,P,M,F,svc) {
 const {x,z,rot,w,d}=F,sw=w/15.85,front=d/2-1.3,back=-d/2+.8;
 if(!safeSpot(ctx,x,z,w,d,rot))throw new Error('Mapped Victory Park portico intersects asphalt '+F.id);
 P.push(x,0,z,rot);
 P.box(M.granite,0,.16,0,w-.65,.30,d-.6,900);
 ctx.physics.addWalkBox(x,z,w-.65,d-.6,rot,.31,0);
 P.box(M.ochre,0,4.65,back,w-1.2,8.65,.34,1100);
 for(const u of [-6.3,-2.1,2.1,6.3].map(v=>v*sw)){
  P.box(M.granite,u,.37,front,1.75,.30,1.7,700);
  P.cyl(M.trim,u,.64,front,.86,.26,700);P.cyl(M.ochre,u,4.30,front,.64,7.1,1100);
  P.cyl(M.trim,u,7.90,front,.78,.20,700);P.box(M.trim,u,8.15,front,1.76,.28,1.68,900);
  ctx.physics.addCylinder(x+Math.cos(rot)*u+Math.sin(rot)*front,z-Math.sin(rot)*u+Math.cos(rot)*front,.65,0,8.3);
 }
 for(const [y,dw,h,dd,mat] of [[8.5,.75,.50,.53,M.ochre],[8.85,.55,.12,.38,M.trim],[9.13,1.15,.45,.68,M.ochre],[9.45,.30,.18,.18,M.trim],[9.63,0,.12,0,M.trim]])P.box(mat,0,y,0,w-dw,h,d-dd,1100);
 const frieze=d/2-.34+.055;
 for(let i=0;i<13;i++) {const u=(-6.8+i*1.13)*sw;P.torus(M.trim,u,9.13,frieze,.23,.041,0,0,280);P.sphere(M.trim,u,9.13,frieze+.01,.085,.33,.075,280);}
 const seat=back+.9,benchLen=3.3*sw;
 for(const u of [-4.2,0,4.2].map(v=>v*sw)) {
  relief(P,M,u,back);
  const bx=x+Math.cos(rot)*u+Math.sin(rot)*seat,bz=z-Math.sin(rot)*u+Math.cos(rot)*seat;
  svc.benches.push({x:bx,z:bz,y:.31,rotY:rot,len:benchLen,stone:true});
 }
 ctx.physics.addBox(x+Math.sin(rot)*back,z+Math.cos(rot)*back,w-1.2,.35,rot,0,8.7);
 P.pop();return true;
}
export function entrance(ctx,P,M,svc) {
 const north=porticoFrame('r15756570'),south=porticoFrame('r15756569',true);
 portico(ctx,P,M,north,svc);portico(ctx,P,M,south,svc);
 const gate=entranceApproach((north.x+south.x)/2),photo=entranceApproach(north.x-15);
 svc.entrances.push({...gate,rotY:Math.PI+gate.yaw*Math.PI/180,name:'Главный вход в Московский парк Победы'});
 svc.photoSpots.push({...photo,pitch:10,name:'Пропилеи Московского парка Победы'});
 svc.porticoes=[north,south];
}
export function fountain(ctx,P,M,svc) {
 const f=site('w32073130',30.3222081,59.8689453);if(!safeSpot(ctx,f.x,f.z,26,26))return;
 P.push(f.x,0,f.z);
 // OSM ring measures approximately 25 m; a hollow basin, no disk of granite
 // over the park surface. Water lies above its base and below the coping.
 P.cyl(M.granite,0,.13,0,12.4,.20,1100);
 P.cyl(M.water,0,.29,0,11.9,.035,900);
 P.torus(M.granite,0,.40,0,12.2,.22,Math.PI/2,0,1100);
 P.torus(M.bronze,0,1.28,0,3.6,.27,Math.PI/2,0,650);
 const nozzles=[];
 for(let i=0;i<12;i++){const a=i*Math.PI/6,x=3.6*Math.cos(a),z=3.6*Math.sin(a);P.cyl(M.bronze,x,.73,z,.18,1.15,650);P.sphere(M.patina,x,1.39,z,.4,.6,.36,350);
  nozzles.push({x,y:1.21,z,height:1.15,width:.035,target:[x*1.95,.02,z*1.95]});
 }
 for(let i=0;i<24;i++){const a=i*Math.PI/12,x=10.8*Math.cos(a),z=10.8*Math.sin(a);P.cyl(M.bronze,x,.56,z,.13,.54,550);nozzles.push({x,y:.56,z,height:.7,width:.025,target:[x*.68,.02,z*.68]});}
 nozzles.push({height:11.5,width:.075,target:[.45,.02,0]});
 for(let i=0;i<8;i++){const a=i*Math.PI/4;nozzles.push({x:Math.cos(a)*.1,y:7.71,z:Math.sin(a)*.1,height:1.15,width:.025,target:[Math.cos(a)*1.2,.02,Math.sin(a)*1.2]});}
 liveFountain(ctx,{id:'w32073130',x:f.x,z:f.z,y:.29,r:11.9,nozzles,far:420});
 // The old source filled the basin with a blocking cylinder. Keep the visible
 // shallow floor walkable and leave the surrounding water completely open.
 ctx.physics.addWalkBox(f.x,f.z,17,17,0,.23,0);
 ctx.physics.addWater({ring:Array.from({length:48},(_,i)=>[f.x+11.9*Math.cos(i*Math.PI/24),f.z+11.9*Math.sin(i*Math.PI/24)]).flat(),level:.29});
 for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.physics.addCylinder(f.x+3.6*Math.cos(a),f.z+3.6*Math.sin(a),.18,.23,1.4);}
 P.pop();svc.monuments.push({...f,name:'Фонтан «Венок славы»',h:12});svc.photoSpots.push({x:f.x-29,z:f.z+14,yaw:-65,name:'Венок славы и Аллея Героев'});
}
