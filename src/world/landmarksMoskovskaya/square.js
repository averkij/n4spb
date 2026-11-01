// Four real Strugatsky gardens, mapped circular seating rooms and the steel
// book memorial at Boris's Pobedy 4 home. Existing generators retain paths,
// streets and mapped paths. Locally restore lawns/canopy suppressed by the
// generic square-paving polygon. Photo/map dossier and estimated dimensions:
// docs/research/strugatsky-square.md. No invented literary statue.
import * as THREE from 'three';
import { GREEN, ROADS, FURNITURE, TREES, BUILDINGS } from '../data/city.js';
import { knockInstances } from '../lib/knock-inst.js';
import { ringEdges } from '../landmarksD/kit.js';
import { registerLOD } from '../../core/spatial.js';
import { canopyGeometry, trunkGeometry } from '../environment/treegeo.js';
import { roadClear, boxClear } from './common.js';

const GARDEN_IDS=['w29171389','w29171421','w29382034','w31264819'];
const CENTRES=[[-1743.3,7937.1],[-1654.1,7934.0]];
const nearSquare=(x,z)=>x>-1780&&x<-1620&&z>7800&&z<7980;
const inRing=(o,x,z)=>{let yes=false;for(let i=0,j=o.length-2;i<o.length;j=i,i+=2)if((o[i+1]>z)!==(o[j+1]>z)&&x<(o[j]-o[i])*(z-o[i+1])/(o[j+1]-o[i+1])+o[i])yes=!yes;return yes;};
function segmentDistance(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-ax-dx*t,z-az-dz*t);}
function staticInstances(K,name,geo,mat,spots,far=300){
  if(!spots.length)return;
  const mesh=new THREE.InstancedMesh(geo,mat,spots.length),m=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),s=new THREE.Vector3();
  spots.forEach((v,i)=>{p.set(v.x,v.y,v.z);q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,v.rotY||0);s.set(v.sx||1,v.sy||1,v.sz||1);mesh.setMatrixAt(i,m.compose(p,q,s));});
  mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.computeBoundingBox();K.ctx.addStatic(mesh);registerLOD(mesh,far);
}

function gardens(K){
  const {ctx,svc,mats:M}=K,gardens=GREEN.filter(g=>GARDEN_IDS.includes(g.id));
  const paths=ROADS.filter(r=>r.hw==='footway'&&r.pts?.some((v,i)=>i%2===0&&nearSquare(v,r.pts[i+1])));
  const segments=paths.flatMap(r=>{const a=[];for(let i=0;i+3<r.pts.length;i+=2)a.push(r.pts.slice(i,i+4));return a;});
  const seats=FURNITURE.filter(f=>f.kind==='bench'&&nearSquare(f.x,f.z));
  const trees=[];for(let i=0;i<TREES.length;i+=2)if(nearSquare(TREES[i],TREES[i+1]))trees.push([TREES[i],TREES[i+1]]);
  const inLawn=(x,z,r=0)=>gardens.some(g=>g.polys.some(p=>[[0,0],[r,0],[-r,0],[0,r],[0,-r]].every(([dx,dz])=>inRing(p.o,x+dx,z+dz)&&!p.h.some(h=>inRing(h,x+dx,z+dz)))));
  const pathGap=(x,z)=>segments.reduce((d,e)=>Math.min(d,segmentDistance(x,z,...e)),Infinity);
  const grass=ctx.mat.toon('#718b46',{paint:.065});
  // The source's broad square polygon paints paving across all four parks.
  // Restore their lawns above that surface, clipped around every mapped path
  // and sitting pad. Small cells keep the irregular real edges inexpensive.
  const lawnAt=(x,z)=>inLawn(x,z)&&roadClear(ctx,x,z,.15)&&pathGap(x,z)>1.35&&CENTRES.every(([cx,cz],i)=>Math.hypot(x-cx,z-cz)>(i?8.65:9.5));
  const step=1;let lawnCells=0;
  for(let x=-1770;x<-1630;x+=step)for(let z=7815;z<7970;z+=step){
    if(![[0,0],[step,0],[step,step],[0,step],[step/2,step/2]].every(([dx,dz])=>lawnAt(x+dx,z+dz)))continue;
    K.detail.quad(grass,[x,.145,z],[x+step,.145,z],[x+step,.145,z+step],[x,.145,z+step],[0,1,0]);lawnCells++;
  }
  const plantedTrees=[];
  // Sparse source coverage contains no tree nodes in these gardens. Restore
  // photo-derived lime/maple groups on lawn, with real path/trunk clearance.
  // Area treeReject excludes these four rings from generic tree generation.
  const envTrees=ctx.services.environment?.trees||[];
  for(let g=0;g<gardens.length;g++){
    const candidates=[];
    for(let z=7824;z<7964;z+=8.9)for(let x=-1761;x<-1637;x+=8.3){
      if(!gardens[g].polys.some(p=>inRing(p.o,x,z))||!inLawn(x,z,2.3)||pathGap(x,z)<2.7||!roadClear(ctx,x,z,3.1)||CENTRES.some(([cx,cz])=>Math.hypot(x-cx,z-cz)<12)||envTrees.some(t=>Math.hypot(x-t.x,z-t.z)<5)||plantedTrees.some(t=>Math.hypot(x-t.x,z-t.z)<6.9))continue;
      candidates.push({x,z});
    }
    const count=Math.min(12,candidates.length);
    for(let i=0;i<count;i++){
      const {x,z}=candidates[Math.floor((i+.5)*candidates.length/count)];
      plantedTrees.push({x,z,y:.145,sx:.66+(g%2)*.08,sy:.74+(i%3)*.05,sz:.66+(g%2)*.08,rotY:i*1.27,family:g%2?'mapleA':'limeA'});
      ctx.physics.addCylinder(x,z,.24,0,4.5);
    }
  }
  for(const fam of ['limeA','mapleA']){const spots=plantedTrees.filter(t=>t.family===fam);
    staticInstances(K,'mz-strugatsky-trees-'+fam,canopyGeometry(fam,1),ctx.mat.toon('#688645',{vertexColors:true,paint:.035}),spots,800);
    staticInstances(K,'mz-strugatsky-trunks-'+fam,trunkGeometry(fam,0),ctx.mat.toon('#716550',{vertexColors:true,paint:.035}),spots,600);
  }
  const clear=(x,z,r=.7)=>inLawn(x,z,r)&&roadClear(ctx,x,z,r+.3)&&pathGap(x,z)>r+1.3&&seats.every(b=>Math.hypot(x-b.x,z-b.z)>2.2+r)&&trees.every(t=>Math.hypot(x-t[0],z-t[1])>1.8+r)&&CENTRES.every(([cx,cz],i)=>Math.hypot(x-cx,z-cz)>(i?8.7:9.6)+r);
  const shrubs=[],flowers=[],rnd=ctx.rng('strugatsky-gardens');
  // Photo-derived low clipped hedges, inside the real lawn borders. Shrubs
  // remain permeable scenery, never a new continuous collision barrier.
  for(const g of gardens)for(const p of g.polys)for(const e of ringEdges(p))for(let u=.9;u<e.len-.7;u+=1.25){
    const t=u/e.len,x=e.a[0]+(e.b[0]-e.a[0])*t-e.n[0]*1.35,z=e.a[1]+(e.b[1]-e.a[1])*t-e.n[1]*1.35;
    if(clear(x,z,.8)){const rotY=rnd()*3;if(boxClear(ctx,x,z,1.6,1.6,rotY))shrubs.push({x,z,y:.43,sx:.8,sy:.37+rnd()*.12,sz:.78,rotY});}
  }
  // Restrained seasonal borders outside the mapped sitting pads; leave their
  // radial path entrances free. Planting choice/density are visual estimates.
  for(const [cx,cz] of CENTRES)for(let i=0;i<80;i++){const a=i*Math.PI/40,r=10.5,x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r;if(clear(x,z,.3))flowers.push({x,z,y:.17,sx:.23,sy:.16,sz:.23});}
  staticInstances(K,'mz-strugatsky-clipped-hedges',new THREE.IcosahedronGeometry(1,1),ctx.mat.toon('#43663c',{paint:.045}),shrubs);
  staticInstances(K,'mz-strugatsky-seasonal-border',new THREE.IcosahedronGeometry(.4,1),ctx.mat.toon('#bb889b',{paint:.035}),flowers.map(v=>({...v,y:.22,sy:.12})),220);
  // Lawn-side edging follows existing paths, without redrawing their surface.
  const edging=[];
  for(const e of segments){const dx=e[2]-e[0],dz=e[3]-e[1],len=Math.hypot(dx,dz);if(len<3)continue;
    for(let u=1.1;u<len-1;u+=1.3)for(const side of [-1,1]){
      const x=e[0]+dx*u/len+dz/len*1.46*side,z=e[1]+dz*u/len-dx/len*1.46*side;
      if(!inLawn(x,z,.2)||!roadClear(ctx,x,z,.85)||CENTRES.some(([cx,cz],i)=>Math.hypot(x-cx,z-cz)<(i?8.8:9.7))||segments.some(o=>o!==e&&segmentDistance(x,z,...o)<1.5))continue;
      edging.push({x,z,y:.09,rotY:Math.atan2(-dz,dx)});
    }
  }
  staticInstances(K,'mz-strugatsky-path-edge',new THREE.BoxGeometry(1.18,.14,.16),M.granite,edging);
  svc.strugatskyGardens=gardens.map(g=>({id:g.id,rings:g.polys.map(p=>p.o)}));
  svc.strugatskyPlanting={shrubs:shrubs.length,flowers:flowers.length,edging:edging.length};
  svc.strugatskyTrees=plantedTrees;svc.strugatskyPlanting.trees=plantedTrees.length;svc.strugatskyPlanting.lawnCells=lawnCells;
  svc.strugatskyFixtures=edging.map(v=>({...v,w:1.18,d:.16}));svc.strugatskyFixtures.push(...shrubs.map(v=>({...v,w:1.6,d:1.6})));
}

function benches(K){
  const {ctx,svc,mats:M}=K,spots=[];
  for(const f of FURNITURE.filter(f=>f.kind==='bench'&&nearSquare(f.x,f.z))){
    const centre=CENTRES.reduce((a,b)=>Math.hypot(f.x-a[0],f.z-a[1])<Math.hypot(f.x-b[0],f.z-b[1])?a:b),rotY=Math.atan2(centre[0]-f.x,centre[1]-f.z);
    if(boxClear(ctx,f.x,f.z,1.9,.66,rotY)&&!ctx.L.insideBuilding(f.x,f.z,.7))spots.push({id:f.id,x:f.x,z:f.z,rotY});
  }
  const tr=(s,dx,y,dz)=>new THREE.Matrix4().makeRotationY(s.rotY).setPosition(s.x+Math.cos(s.rotY)*dx+Math.sin(s.rotY)*dz,y,s.z-Math.sin(s.rotY)*dx+Math.cos(s.rotY)*dz);
  const wood=ctx.mat.toon('#997142');
  knockInstances(ctx,{name:'mz-strugatsky-benches',spots,parts:[
    {geo:new THREE.BoxGeometry(1.9,.065,.09),mat:wood,place:s=>[-.2,-.1,0,.1,.2].map(dz=>tr(s,0,.48,dz))},
    {geo:new THREE.BoxGeometry(1.9,.10,.065),mat:wood,place:s=>[.69,.84,.99].map(y=>tr(s,0,y,-.25))},
    {geo:new THREE.BoxGeometry(.075,.49,.5),mat:M.bronze,place:s=>[-.68,.68].map(dx=>tr(s,dx,.245,0))},
    {geo:new THREE.BoxGeometry(.065,.66,.065),mat:M.bronze,place:s=>[-.68,.68].map(dx=>tr(s,dx,.67,-.28))},
    {geo:new THREE.BoxGeometry(.065,.065,.46),mat:M.bronze,place:s=>[-.75,.75].map(dx=>tr(s,dx,.7,0))},
  ],items:(_,s)=>ctx.physics.addBox(s.x,s.z,1.9,.66,s.rotY,0,1.04),rec:{kind:'bench',mass:60,h:1.04,w:1.9,d:.66,anchored:false,metal:.4},far:260});
  svc.benches=spots.map(s=>({...s,len:1.9}));
  // props/state.js reads this established shared list and suppresses the
  // matching mapped nodes, so these seats cannot be duplicated by props.
  const all=ctx.services.landmarks ||= {};(all.benches ||= []).push(...svc.benches);
}

function memorial(K){
  const home=BUILDINGS.find(b=>b.id==='w44499732');if(!home)return;
  const {ctx,svc,detail:P,mats:M}=K;
  // White-brick corner face on the Pobedy side near Varshavskaya. Its normal
  // comes from the real footprint; the along-wall mount is photo-estimated.
  const edge=home.polys.flatMap(p=>ringEdges(p)).find(e=>e.n[1]>.95&&e.len>25&&e.a[1]>8230&&e.b[1]>8230);if(!edge)return;
  const t=1.2/edge.len,x=edge.a[0]+(edge.b[0]-edge.a[0])*t+edge.n[0]*.30,z=edge.a[1]+(edge.b[1]-edge.a[1])*t+edge.n[1]*.30;
  const y=2.65,w=1.06,h=1.56,rot=Math.atan2(...edge.n);
  if(!ctx.services.labels.reserve(home.id,x,y,z,w+.10,h+.10,...edge.n,'memorial'))return;
  // The real mounting bay is blank painted brick. Cover the generic builder's
  // placeholder windows in this 2.4 m corner bay before mounting the memorial.
  const brick=ctx.tex.draw(256,256,(g,w,h)=>{g.fillStyle='#c1c8c5';g.fillRect(0,0,w,h);g.strokeStyle='#8b9695';g.lineWidth=2;
    for(let j=0;j<8;j++){const yy=j*32;g.beginPath();g.moveTo(0,yy);g.lineTo(w,yy);for(let xx=(j%2)*32;xx<w;xx+=64){g.moveTo(xx,yy);g.lineTo(xx,yy+32);}g.stroke();}
  },{key:'mz-pobedy4-painted-brick',repeat:[1,1]});
  const brickMat=ctx.mat.toon('#ffffff',{map:brick,paint:.02});
  P.push(x,0,z,rot);P.quad(brickMat,[-1.2,.7,-.04],[1.2,.7,-.04],[1.2,4.45,-.04],[-1.2,4.45,-.04],[0,0,1],[[0,0],[2,0],[2,3],[0,3]]);P.pop();
  const steel=ctx.mat.toon('#a6b1b5',{paint:.015}),page=ctx.mat.toon('#777f80',{paint:.01});P.push(x,y,z,rot);
  P.box(M.dark,-w/2,w/2,-h/2,h/2,-.035,.018);P.box(page,-w/2+.035,w/2-.035,-h/2+.025,h/2-.025,.025,.10);
  P.box(steel,-w/2,w/2,-h/2,h/2,.105,.145);P.box(steel,-w/2-.055,-w/2+.018,-h/2,h/2,.012,.16);
  for(let i=0;i<7;i++)P.box(M.dark,-w/2-.057,-w/2-.052,-h/2+.09+i*.21,-h/2+.095+i*.21,.025,.115);
  P.geo(ctx.mat.toon('#aa9e78'),new THREE.CylinderGeometry(.255,.255,.018,32).rotateX(Math.PI/2),0,.35,.158);
  // A small low-relief profile, including the identifying wire spectacles.
  P.geo(M.dark,new THREE.SphereGeometry(1,12,8),-.025,.385,.185,0,0,-.12,.125,.18,.035);
  const profile=new THREE.Shape();profile.moveTo(-.02,.49);for(const p of [[.08,.46],[.105,.41],[.155,.37],[.11,.345],[.12,.30],[.075,.255],[.04,.22],[-.1,.25]])profile.lineTo(...p);profile.closePath();P.extrude(M.dark,profile,.175,.026,1,2);
  P.cyl(steel,[.015,.393,.215],[.091,.385,.215],.006,.006,5);P.geo(steel,new THREE.TorusGeometry(.034,.004,4,12),.075,.391,.213,0,0,-.08,1,.8,1);
  const collar=new THREE.Shape();collar.moveTo(-.14,.24);for(const p of [[-.02,.16],[.11,.205],[.055,.255],[-.045,.27]])collar.lineTo(...p);collar.closePath();P.extrude(M.dark,collar,.174,.025,1,2);
  for(const u of [-.47,.47])for(const v of [-.71,0,.71])P.geo(page,new THREE.SphereGeometry(.009,6,4),u,v,.154);
  const tex=ctx.tex.draw(768,512,(g,w,h)=>{
    g.fillStyle='#a6b1b5';g.fillRect(0,0,w,h);g.fillStyle='#363e3c';g.textAlign='center';g.textBaseline='middle';
    const lines=['В ЭТОМ ДОМЕ','С 1964 ПО 2012 ГОД','ЖИЛ ПИСАТЕЛЬ-ФАНТАСТ','БОРИС НАТАНОВИЧ','СТРУГАЦКИЙ'];
    lines.forEach((line,i)=>ctx.tex.fitText(g,line,w/2,h*(.11+i*.19),w*.94,i>2?65:44,ctx.tex.FONTS.serif,700));
  },{key:'mz-boris-strugatsky-memorial'});
  const label=ctx.mat.decal('#ffffff',{map:tex});K.decals.add(label);P.quad(label,[-.47,-.65,.153],[.47,-.65,.153],[.47,-.03,.153],[-.47,-.03,.153],[0,0,1]);P.pop();
  svc.strugatskyMemorial={id:'boris-strugatsky',building:home.id,x,y,z,w,h,rotY:rot};
  svc.monuments.push({id:'boris-strugatsky',name:'Мемориальная доска Борису Стругацкому',x,z,h:y+h/2});
  svc.photoSpots.push({name:'Борис Стругацкий · улица Победы, 4',x:x+edge.n[0]*5,z:z+edge.n[1]*5,yaw:ctx.L.yawToward(x+edge.n[0]*5,z+edge.n[1]*5,x,z),pitch:10});
}
export function square(K){gardens(K);benches(K);memorial(K);K.svc.photoSpots.push({name:'Площадь Братьев Стругацких',x:-1747,z:7910,yaw:-90,pitch:4});}
