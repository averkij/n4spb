// Recognisable bronze bust silhouettes with red-granite bases, military coat
// seams, medals and civilian variants. Locations are exact mapped OSM nodes.
import { HEROES, site } from './sites.js';
import { safeSpot } from './kit.js';
import * as CITY from '../data/city.js';

function head(P,M,x,y,z,s=1,variant=0) {
 P.sphere(M.bronze,x,y,z,.40*s,.53*s,.41*s,300);
 P.sphere(M.bronze,x,y-.15*s,z+.08*s,.30*s,.27*s,.31*s,250);
 P.box(M.bronze,x,y-.015*s,z+.24*s,.07*s,.14*s,.10*s,160);
 for(const u of [-.205,.205])P.sphere(M.bronze,x+u*s,y-.015*s,z,.10*s,.16*s,.085*s,160);
 if(variant===1) {P.sphere(M.patina,x,y+.14*s,z-.05*s,.43*s,.27*s,.40*s,200);P.box(M.bronze,x,y+.20*s,z+.11*s,.43*s,.045*s,.38*s,220);}
 if(variant===2)P.sphere(M.patina,x,y-.22*s,z+.13*s,.35*s,.30*s,.22*s,220);
 if(variant===3)for(const u of [-.11,.11])P.torus(M.patina,x+u*s,y+.02*s,z+.21*s,.062*s,.012*s,0,0,160);
 if(variant===4)P.sphere(M.bronze,x,y+.07*s,z-.17*s,.42*s,.58*s,.26*s,250);
}
function coat(P,M,y,s=1,civil=false) {
 P.sphere(M.bronze,0,y,0,1.00*s,.82*s,.54*s,400);
 P.sphere(M.bronze,0,y-.20*s,0,.66*s,.70*s,.46*s,400);
 P.box(M.bronze,0,y+.34*s,0,.24*s,.25*s,.27*s,260);
 for(const u of [-1,1])P.beam(M.patina,[u*.20*s,y+.26*s,.24*s],[u*.06*s,y-.21*s,.29*s],.045*s,200);
 if(!civil){for(const u of [-1,1])P.box(M.patina,u*.34*s,y+.22*s,.11*s,.26*s,.055*s,.27*s,200);for(let i=0;i<3;i++)P.sphere(M.patina,(-.23+i*.085)*s,y-.02*s,.28*s,.065*s,.065*s,.025*s,180);}
}
export function heroes(ctx,P,M,svc) {
 for(let i=0;i<HEROES.length;i++){
  const [id,name,lon,lat]=HEROES[i],q=site(id,lon,lat);if(!safeSpot(ctx,q.x,q.z,2,2))continue;
  const south=lat<59.86905,rot=south?Math.PI:0;P.push(q.x,0,q.z,rot);
  P.box(M.granite,0,.10,0,1.65,.18,1.50,750);P.box(M.red,0,.28,0,1.30,.20,1.20,750);
  P.box(M.red,0,1.72,0,.85,2.68,.78,850);P.box(M.red,0,3.12,0,1.10,.17,.95,700);
  coat(P,M,3.62,1,i>=7);head(P,M,0,4.32,.005,1,i===8?2:i===7?4:i<6?1:i%4===0?3:0);
  P.box(M.bronze,0,2.06,.405,.64,.43,.035,260);P.label(M.names,0,2.06,.449,.64,.43,id,0,220,i);
  ctx.physics.addBox(q.x,q.z,1.65,1.5,rot,0,4.6);P.pop();svc.monuments.push({...q,name,h:4.6});
 }
 // Standing figures complete the formal axis and its two diagonal paths.
 standing(ctx,P,M,svc,'n360040747','Г. К. Жуков',30.3287236,59.8690402,22,3.4,1,'marshal');
 standing(ctx,P,M,svc,'n3162854862','Зоя Космодемьянская',30.3238980,59.8682207,23,2.0,1.12,'zoya');
 standing(ctx,P,M,svc,'n4485862678','А. М. Матросов',30.3230474,59.8694395,24,2.0,1.15,'soldier');
 trolley(ctx,P,M,svc);
 westernSculptures(ctx,P,M,svc);
}

function westernSculptures(ctx,P,M,svc) {
 const ray=CITY.MONUMENTS.find(q=>q.id==='n4485866600');
 if(ray&&safeSpot(ctx,ray.x,ray.z,3.2,3.2)) {
  P.push(ray.x,0,ray.z,-Math.PI/2);
  P.box(M.granite,0,.15,0,2.4,.28,2.3,850);P.box(M.red,0,1.0,0,2.0,1.42,1.9,950);P.box(M.granite,0,1.76,0,2.2,.12,2.1,850);
  // Seated/kneeling figure on rails, one hand raised. The cloth in some
  // photographs is omitted under the owner's flag prohibition.
  for(const u of [-.55,.55])P.box(M.bronze,u,1.92,0,.08,.12,1.95,550);
  P.sphere(M.bronze,-.22,2.27,-.15,1.35,.50,1.15,650);
  P.sphere(M.bronze,.10,2.75,.28,.64,1.08,.48,650);
  head(P,M,.17,3.42,.31,.95,4);
  P.beam(M.bronze,[-.10,3.12,.29],[-.44,3.85,.32],.10,650);
  P.beam(M.bronze,[-.44,3.85,.32],[-.56,4.38,.29],.075,650);
  P.sphere(M.bronze,-.57,4.46,.28,.16,.25,.14,550);
  P.beam(M.bronze,[.37,3.02,.28],[.70,2.01,.33],.09,550);
  P.sphere(M.bronze,.76,1.97,.34,.27,.11,.22,500);
  P.pop();ctx.physics.addBox(ray.x,ray.z,2.4,2.3,0,0,4.6);svc.monuments.push({...ray,h:4.6});
 }
 const pair=CITY.MONUMENTS.find(q=>q.id==='n4369354189');
 if(pair&&safeSpot(ctx,pair.x,pair.z,3.8,3.0)) {
  P.push(pair.x,0,pair.z,0);
  P.box(M.granite,0,.16,0,3.0,.3,2.4,900);P.box(M.red,0,1.0,0,2.5,1.4,2.0,1000);
  for(const side of [-1,1]) {
   P.push(side*.56,1.72,0,side*.20);
   for(const u of [-.17,.17])P.beam(M.bronze,[u,.05,.06],[u,.90,0],.14,650);
   coat(P,M,1.29,1.12);head(P,M,0,2.01,0,1.04,side<0?1:0);
   P.beam(M.bronze,[side*.45,1.45,.1],[side*.51,.82,.05],.11,550);
   P.beam(M.bronze,[-side*.4,1.45,.12],[-side*.69,1.20,.45],.10,600);
   P.pop();
  }
  P.sphere(M.bronze,0,2.9,.45,.30,.16,.2,550);
  P.pop();ctx.physics.addBox(pair.x,pair.z,3,2.4,0,0,4.2);svc.monuments.push({...pair,h:4.2});
 }
}
function standing(ctx,P,M,svc,id,name,lon,lat,tile,pedestal,s,kind) {
 const q=site(id,lon,lat);if(!safeSpot(ctx,q.x,q.z,3.3,3.3))return;P.push(q.x,0,q.z,kind==='marshal'?-Math.PI/2:0);
 P.box(M.granite,0,.16,0,3.10,.28,2.8,850);P.box(M.red,0,.4,0,2.5,.22,2.2,850);P.box(M.red,0,pedestal/2+.49,0,1.65,pedestal,1.5,1000);
 const base=pedestal+.50;
 for(const u of [-1,1]){P.box(M.bronze,u*.19*s,base+.10,.18*s,.26*s,.20,.54*s,550);P.beam(M.bronze,[u*.16*s,base+.21,0],[u*.20*s,base+1.04*s,0],.15*s,600);}
 P.sphere(M.bronze,0,base+1.45*s,0,.9*s,1.13*s,.55*s,650);
 if(kind==='zoya'){P.sphere(M.bronze,0,base+.90*s,0,.7*s,.75*s,.52*s,600);P.beam(M.bronze,[-.40*s,base+1.74*s,0],[-.47*s,base+.91*s,.07],.1*s,400);P.beam(M.bronze,[.40*s,base+1.75*s,0],[.46*s,base+1.02*s,0],.1*s,400);}
 else {coat(P,M,base+1.50*s,s);P.beam(M.bronze,[-.4*s,base+1.72*s,0],[-.43*s,base+1.1*s,.15],.12*s,400);P.beam(M.bronze,[.4*s,base+1.72*s,0],[.30*s,base+1.35*s,.34],.12*s,400);P.box(M.patina,0,base+1.23*s,.285*s,.65*s,.08*s,.065*s,300);}
 head(P,M,0,base+2.17*s,0,s,kind==='zoya'?4:1);
 P.label(M.names,0,1.2,.79,1.25,.62,id,0,250,tile);ctx.physics.addBox(q.x,q.z,3.1,2.8,0,0,base+2.6*s);P.pop();svc.monuments.push({...q,name,h:base+2.6*s});
}
function trolley(ctx,P,M,svc) {
 const q=site('n1521009686',30.3273004,59.8661825);if(!safeSpot(ctx,q.x,q.z,4,4))return;P.push(q.x,0,q.z,-.21);
 P.box(M.granite,0,.3,0,3.8,.55,3.8,850);P.box(M.iron,0,.9,0,1.65,.28,2.9,600);
 for(const x of [-.75,.75])for(const z of [-.97,.97])P.shape('trolley-wheel',P.geometry('trolley-wheel',()=>new ctx.THREE.CylinderGeometry(.31,.31,.13,12)),M.iron,x,.84,z,1,1,1,0,0,Math.PI/2,350);
 P.box(M.iron,0,1.6,0,1.65,1.03,2.7,600);P.box(M.bronze,0,2.20,0,1.85,.17,2.88,650);
 for(const z of [-.8,0,.8])P.box(M.patina,0,1.75,z,1.7,.055,.06,260);
 P.label(M.names,0,.33,1.94,1.8,.31,q.id,0,220,25);ctx.physics.addBox(q.x,q.z,3.8,3.8,-.21,0,2.3);P.pop();svc.monuments.push({...q,name:'Памятный знак «Вагонетка»',h:2.3});
}
