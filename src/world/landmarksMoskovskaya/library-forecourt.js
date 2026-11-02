// Current Chasha Znaniy forecourt; surveyed outer scallops, reconstructed
// unified basin/six bowls from the owner's seven photographs and Vodokanal.
// docs/research/russian-national-library.md. Water animation: library-water.js.
import * as THREE from 'three';
import { GREEN, MONUMENTS } from '../data/city.js';
import { triangulateRing, subtractConvex, clipHalf } from '../environment/clip.js';
import { knockInstances } from '../lib/knock-inst.js';
import { roadClear, boxClear } from './common.js';
import { libraryWater } from './library-water.js';

import { FORECOURT_PAVED_RING, FORECOURT_POOL, forecourtContains, forecourtPointInRing as pointInFlat } from './library-forecourt-plan.js';
export * from './library-forecourt-plan.js';
const circle=(x,z,r,n=48)=>Array.from({length:n},(_,i)=>[x+r*Math.cos(i*Math.PI*2/n),z+r*Math.sin(i*Math.PI*2/n)]).flat();
const BOWLS=[{x:-1771.5,z:7453.5,r:5.4,h:1.45},{x:-1758.3,z:7453.3,r:5.6,h:1.65},
 {x:-1774.4,z:7443,r:1.85,h:1.32},{x:-1755.2,z:7433.6,r:1.95,h:1.32},
 {x:-1773.6,z:7464.4,r:1.85,h:1.32},{x:-1754.1,z:7473.7,r:1.95,h:1.32}];
function fill(K,mat,o,y,physical=false){for(const t of triangulateRing(o)){K.P.fan(mat,t.map(([x,z])=>[x,y,z]),[0,1,0],p=>[p[0]/4,p[2]/4]);if(physical)K.ctx.physics.addWalkTriangle(t.map(([x,z])=>[x,y,z]),.12);}}
function rim(K,o,mat,y=.43,width=.36,physical=true,y0=.15,draw=true){for(let i=0;i<o.length;i+=2){const j=(i+2)%o.length,ax=o[i],az=o[i+1],bx=o[j],bz=o[j+1],dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz);if(l<.01)continue;const cx=(ax+bx)/2,cz=(az+bz)/2,rot=Math.atan2(dx,dz);if(draw){K.P.push(cx,0,cz,rot);K.P.box(mat,-width/2,width/2,y0,y,-l/2,l/2);K.P.pop();}if(physical)K.ctx.physics.addWalkBox(cx,cz,width,l,rot,y,y0);}}
function fountain(K,M){
 const {ctx}=K;fill(K,M.floor,FORECOURT_POOL,.16,true);fill(K,M.water,FORECOURT_POOL,.24);rim(K,FORECOURT_POOL,M.rim);
 for(const b of BOWLS){
  // Hollow upper basin, a real pedestal and thin wall; never a filled cylinder
  // blocking the whole pool. The shallow upper water is native too.
  K.P.col(M.rim,b.x,b.z,.16,.66,b.r*.30,b.r*.21,12);
  // Photo 1: the two principal bowls are broad stepped drums, while the
  // corner cups flare above small pedestals. Preserve the hollow water floor.
  const profile=b.r>3?[[b.r*.93,.16],[b.r*.93,b.h-.68],[b.r,b.h-.68],[b.r,b.h-.54],[b.r*.95,b.h-.54],[b.r*.95,b.h-.30],[b.r,b.h-.30],[b.r,b.h],[b.r-.16,b.h],[b.r-.18,b.h-.15],[b.r*.70,b.h-.27],[0,b.h-.27]]
   :[[b.r*.21,.62],[b.r*.75,b.h-.33],[b.r,b.h-.12],[b.r,b.h],[b.r-.16,b.h],[b.r-.18,b.h-.15],[b.r*.70,b.h-.27],[0,b.h-.27]];
  K.P.geo(M.rim,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),32),b.x,0,b.z);
  const inner=circle(b.x,b.z,b.r-.25),floor=b.h-.24;
  fill(K,M.floor,inner,floor,true);fill(K,M.water,inner,b.h-.14);ctx.physics.addWater({ring:inner,level:b.h-.14});
  // Match the visible tapered masonry support instead of treating its narrow
  // upper diameter as a freestanding post. Planar surfaces retain exact side
  // collision and a genuine top, while the surrounding basin stays open.
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6,c=(i+1)*Math.PI/6;
   const p=(t,r,y)=>[b.x+Math.cos(t)*r,y,b.z+Math.sin(t)*r];
   const A=p(a,b.r*.30,.16),B=p(c,b.r*.30,.16),C=p(c,b.r*.21,.66),D=p(a,b.r*.21,.66);
   for(const t of[[A,B,C],[A,C,D],[[b.x,.66,b.z],D,C]])ctx.physics.addWalkTriangle(t,.5);
  }
  // The lathe already draws this coping. Supply only its physical top;
  // duplicate boxes would add internal/coplanar faces to every upper rim.
  rim(K,circle(b.x,b.z,b.r-.08,24),M.rim,b.h,.18,true,b.h-(b.r>3?.30:.14),false);
  if(b.r>3){
   // Thin rings follow the three visible drum courses. The interior remains
   // hollow: no full-radius cylinder fills the upper water or lower pool.
   for(const [r,lo,hi]of[[b.r*.93,.16,b.h-.68],[b.r,b.h-.68,b.h-.54],[b.r*.95,b.h-.54,b.h-.30]])rim(K,circle(b.x,b.z,r,24),M.rim,hi,.12,true,lo,false);
   // Broad low treads seen on the front drum, also supplying an actual
   // step-height route into each shallow upper basin from the surrounding
   // pool/plaza. Opposite approaches keep the inter-bowl space open.
   const sg=b===BOWLS[0]?-1:1;
   for(let i=0;i<4;i++){const xa=b.x+sg*(b.r-.25+(3-i)*.5),xb=xa+sg*.5,y=.16+(floor-.16)*(i+1)/4;
    K.P.box(M.rim,Math.min(xa,xb),Math.max(xa,xb),.16,y,b.z-2.25,b.z+2.25);
    ctx.physics.addWalkBox((xa+xb)/2,b.z,.5,4.5,0,y,.16);
   }
  }
 }
 // The registry returns its first matching surface, so upper bowl water
 // precedes the main pool underneath it.
 ctx.physics.addWater({ring:FORECOURT_POOL,level:.24});
 const animation=libraryWater(ctx,BOWLS);
 K.svc.libraryFountain={id:'chasha-znaniy',ring:FORECOURT_POOL,level:.24,bowls:BOWLS,animation};
}
function landscaping(K,M){
 const gardens=GREEN.flatMap(g=>g.kind==='grass'?g.polys.filter(p=>p.o.some((x,i)=>!(i%2)&&forecourtContains(x,p.o[i+1]))):[]);
 const lawn=(x,z)=>gardens.some(p=>pointInFlat(x,z,p.o)&&!(p.h||[]).some(h=>pointInFlat(x,z,h)));
 const tex=K.ctx.tex.draw(256,256,(g,w,h)=>{g.fillStyle='#a6a7a2';g.fillRect(0,0,w,h);for(let z=0;z<8;z++)for(let x=0;x<8;x++){g.fillStyle=(x+z*3)%5===0?'#626765':(x+z)%2?'#b4b5af':'#9fa29e';g.fillRect(x*32+1,z*32+1,30,30);}},{key:'rnb-plaza-grey-blocks',repeat:[1,1]});
 const paving=K.ctx.mat.toon('#ffffff',{map:tex,paint:.01});
 // Exact convex subtraction keeps every mapped curving edge continuous;
 // area groundHoles suppresses the generic surface underneath this owner.
 const site=triangulateRing(FORECOURT_PAVED_RING),lawnTriangles=gardens.flatMap(p=>triangulateRing(p.o,p.h||[]));
 const bounds=p=>[Math.min(...p.map(q=>q[0])),Math.max(...p.map(q=>q[0])),Math.min(...p.map(q=>q[1])),Math.max(...p.map(q=>q[1]))];
 let tiles=site.slice();for(const cut of [...lawnTriangles,...triangulateRing(FORECOURT_POOL)]){const b=bounds(cut);tiles=tiles.flatMap(p=>{const a=bounds(p);return a[1]<b[0]||a[0]>b[1]||a[3]<b[2]||a[2]>b[3]?[p]:subtractConvex([p],cut);});}
 const drawFloor=(mat,poly,y)=>{if(poly.length<3)return;K.P.fan(mat,poly.map(([x,z])=>[x,y,z]),[0,1,0],p=>[p[0]/4,p[2]/4]);for(let i=1;i+1<poly.length;i++)K.ctx.physics.addWalkTriangle([poly[0],poly[i],poly[i+1]].map(([x,z])=>[x,y,z]),.12);};
 for(const p of tiles)drawFloor(paving,p,.145);
 for(const lawnTri of lawnTriangles)for(const boundary of site){let poly=lawnTri;for(let e=0;e<3&&poly.length>=3;e++)poly=clipHalf(poly,boundary[e],boundary[(e+1)%3],true);drawFloor(M.grass,poly,.15);}
 K.svc.libraryForecourtPaving={polygons:tiles.length,ring:FORECOURT_PAVED_RING,y:.145};
 for(const p of gardens){
  // Clipped low planting inside the existing lawn, never on a path or road.
  for(let x=-1808;x< -1740;x+=3.7)for(let z=7405;z<7502;z+=3.8)if(pointInFlat(x,z,p.o)&&forecourtContains(x,z)&&roadClear(K.ctx,x,z,1.2)&&!K.ctx.L.insideBuilding(x,z,1.3)){
   K.detail.geo(M.shrub,new THREE.IcosahedronGeometry(1,0),x,.65,z,0,0,0,1.05,.65,1.05);
  }
 }
 const bloom=K.ctx.mat.toon('#b64e4c',{paint:.02});
 for(const [cx,cz]of[[-1797,7424],[-1796,7484],[-1755,7500],[-1756,7405]])for(let i=0;i<36;i++){
  const a=i*2.4,r=Math.sqrt((i+.5)/36)*1.35,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(lawn(x,z)&&forecourtContains(x,z))K.detail.geo(bloom,new THREE.OctahedronGeometry(.17),x,.26,z,0,0,0,1,.6,1);
 }
 K.svc.libraryForecourtLawns=gardens;
}
function fixtures(K,M){
 const {ctx}=K;const spots=[[-1794,7424],[-1793,7484],[-1788,7418],[-1786,7490],[-1741,7419],[-1740,7487],[-1787,7438],[-1786,7470]].map(([x,z])=>({x,z,y:.145,rotY:x< -1779?Math.PI/2:-Math.PI/2})).filter(s=>boxClear(ctx,s.x,s.z,2.2,.8,s.rotY));
 const tr=(s,x,y,z)=>new THREE.Matrix4().makeRotationY(s.rotY).setPosition(s.x+Math.cos(s.rotY)*x+Math.sin(s.rotY)*z,.145+y,s.z-Math.sin(s.rotY)*x+Math.cos(s.rotY)*z);
 const benches=knockInstances(ctx,{name:'rnb-forecourt-seats',spots,parts:[
  {geo:new THREE.BoxGeometry(2,.07,.11),mat:M.metal,place:s=>[-.22,-.1,.02,.14,.26].map(z=>tr(s,0,.45,z))},
  {geo:new THREE.BoxGeometry(2,.13,.065),mat:M.metal,place:s=>[.65,.82,.99].map(y=>tr(s,0,y,-.28))},
  {geo:new THREE.BoxGeometry(.10,.46,.55),mat:M.metal,place:s=>[-.76,.76].map(x=>tr(s,x,.23,0))},
  {geo:new THREE.BoxGeometry(.07,.62,.07),mat:M.metal,place:s=>[-.76,.76].map(x=>tr(s,x,.72,-.28))},
 ],items:(_,s)=>ctx.physics.addBox(s.x,s.z,2,.74,s.rotY,.145,1.23),rec:{kind:'bench',mass:75,h:1.08,w:2,d:.74,anchored:false,metal:.8},far:280});
 const lampSpots=[[-1796,7419],[-1794,7487],[-1787,7430],[-1786,7478],[-1741,7421],[-1739,7485]].map(([x,z])=>({x,z,y:.145})).filter(s=>roadClear(ctx,s.x,s.z,.5));
 const lamps=knockInstances(ctx,{name:'rnb-forecourt-lamps',spots:lampSpots,parts:[
  {geo:new THREE.CylinderGeometry(.075,.13,5.8,10).translate(0,2.9,0),mat:M.metal},
  {geo:new THREE.BoxGeometry(.44,.6,.44).translate(0,.3,0),mat:M.metal},
  {geo:new THREE.CylinderGeometry(.2,.2,.08,12).translate(0,.66,0),mat:M.metal},
  {geo:new THREE.BoxGeometry(1.55,.075,.075).translate(0,5.55,0),mat:M.metal},
  {geo:new THREE.SphereGeometry(.25,12,8).scale(1,.75,1),mat:M.glass,place:s=>[-.64,.64].map(x=>new THREE.Matrix4().makeTranslation(s.x+x,5.49,s.z))},
  {geo:new THREE.ConeGeometry(.31,.22,12),mat:M.metal,place:s=>[-.64,.64].map(x=>new THREE.Matrix4().makeTranslation(s.x+x,5.76,s.z))},
  {geo:new THREE.SphereGeometry(.12,8,6).translate(0,6.13,0),mat:M.metal},
 ],items:(_,s)=>ctx.physics.addCylinder(s.x,s.z,.17,.145,6.4),rec:{kind:'lamp',mass:110,h:6.2,r:.2,anchored:true,metal:1},far:400});
 const bins=knockInstances(ctx,{name:'rnb-forecourt-bins',spots:lampSpots.slice(0,4).map(s=>({...s,x:s.x+.75})),parts:[{geo:new THREE.CylinderGeometry(.25,.2,.72,12).translate(0,.36,0),mat:M.metal},{geo:new THREE.TorusGeometry(.21,.035,5,16).rotateX(Math.PI/2).translate(0,.73,0),mat:M.rim}],items:(_,s)=>ctx.physics.addCylinder(s.x,s.z,.25,.145,.9),rec:{kind:'bin',mass:35,h:.76,r:.25,anchored:false,metal:.8},far:220});
 const urns=knockInstances(ctx,{name:'rnb-memorial-flower-urns',spots:[{x:-1807.7,z:7489.3,y:.15},{x:-1807.7,z:7493.9,y:.15},{x:-1809.8,z:7408.7,y:.15},{x:-1809.8,z:7413.3,y:.15}],parts:[
  {geo:new THREE.LatheGeometry([[.37,0],[.40,.12],[.54,.7],[.58,.8],[.5,.83]].map(p=>new THREE.Vector2(...p)),16),mat:M.rim},
  {geo:new THREE.IcosahedronGeometry(.54,1).scale(1,.5,1).translate(0,.82,0),mat:M.shrub},
  {geo:new THREE.IcosahedronGeometry(.13,0),mat:M.glass,place:s=>Array.from({length:16},(_,i)=>new THREE.Matrix4().makeTranslation(s.x+Math.cos(i*2.4)*(.15+i%3*.13),1.06+Math.sin(i)*.09,s.z+Math.sin(i*2.4)*(.15+i%3*.13)))},
 ],items:(_,s)=>ctx.physics.addCylinder(s.x,s.z,.52,.15,1.1),rec:{kind:'planter',mass:110,h:1,r:.55,anchored:false,metal:0},far:220});
 K.svc.libraryFixtures={benches:benches.records,lamps:lamps.records,bins:bins.records,urns:urns.records};
 (ctx.services.landmarks||={}).benches||=[];ctx.services.landmarks.benches.push(...spots.map(s=>({...s,len:2})));
}
function statues(K,M){
 const nodes=MONUMENTS.filter(m=>['n14090538301','n14090538201'].includes(m.id));
 for(const n of nodes){const sper=n.id==='n14090538301';K.P.push(n.x,0,n.z,Math.PI/2);
  K.P.box(M.black,-1.55,1.55,.15,.40,-1.4,1.4);K.P.box(M.black,-1.1,1.1,.4,.65,-.95,.95);K.P.box(M.black,-.82,.82,.65,2.6,-.7,.7);K.P.box(M.black,-.91,.91,2.6,2.76,-.8,.8);
  K.P.geo(M.bronze,new THREE.SphereGeometry(1,12,8),0,5.42,0,0,0,0,.26,.36,.27);
  K.P.col(M.bronze,0,0,4.0,5.13,.53,.42,12);
  K.P.col(M.bronze,-.21,0,2.88,4.05,.19,.23,10);K.P.col(M.bronze,.21,0,2.88,4.05,.19,.23,10);
  // Long coat tails and a lapel/button line, rather than a generic obelisk.
  K.P.col(M.bronze,0,0,3.18,4.43,.57,.47,12);for(const x of [-.22,.22])K.P.box(M.bronze,x-.18,x+.18,2.76,2.92,-.18,.36);
  K.P.cyl(M.bronze,[-.44,4.91,.02],[-.58,4.39,.22],.15,.13,10);K.P.cyl(M.bronze,[-.58,4.39,.22],[-.22,4.34,.42],.13,.10,10);
  K.P.cyl(M.bronze,[.43,4.91,0],[.58,4.27,.05],.15,.11,10);K.P.cyl(M.bronze,[.58,4.27,.05],[.57,3.94,.15],.11,.085,10);
  for(let i=0;i<5;i++)K.P.geo(M.black,new THREE.SphereGeometry(.025,6,4),.07,4.15+i*.16,.485);
  K.P.pop();K.ctx.physics.addBox(n.x,n.z,1.82,1.6,Math.PI/2,.15,2.8);K.ctx.physics.addCylinder(n.x,n.z,.53,2.76,5.8);
  K.label(n.id,sper?'МИХАИЛУ МИХАЙЛОВИЧУ СПЕРАНСКОМУ':'АНАТОЛИЮ ФЕДОРОВИЧУ КОНИ',n.x+.835,1.7,n.z,1.4,.30,Math.PI/2,{bg:'#292b2a',fg:'#b8b5a8'});
  K.svc.monuments.push({id:n.id,name:n.name,x:n.x,z:n.z,h:5.8});
 }
}
export function libraryForecourt(K){
 const mat=(c,p=.02)=>K.ctx.mat.toon(c,{paint:p});
 const M={rim:mat('#9c9c94'),floor:mat('#7d918b'),water:mat('#7eaaa8',0),foam:mat('#cfe5df',0),grass:mat('#71864a'),shrub:mat('#466342'),metal:mat('#3e4545'),glass:mat('#d2d6c8'),bronze:mat('#404940'),black:mat('#303332')};
 K.decals.add(M.water);K.decals.add(M.foam);landscaping(K,M);fountain(K,M);fixtures(K,M);statues(K,M);
 K.svc.photoSpots.push({name:'Чаша знаний · площадь РНБ',x:-1726.1,z:7452.6,yaw:-269.8,pitch:2.1});
}
