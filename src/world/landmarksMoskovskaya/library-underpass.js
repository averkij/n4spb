// Low glazed Park Pobedy crossing pavilions and the actual pedestrian route.
// Coordinates are mapped; depth/profile are photographic engineering estimates.
// No per-frame work. Finite slabs permit walking UNDER the live road deck.
import * as THREE from 'three';
import { Parts } from '../landmarksD/kit.js';
import { registerLOD } from '../../core/spatial.js';
import { knockInstances } from '../lib/knock-inst.js';
import { UNDERPASS_FLOOR as FY, UNDERPASS_CEILING as CY, UNDERPASS_TUNNEL as T,
  UNDERPASS_STAIRS as STAIRS, UNDERPASS_GROUND_HOLES as HOLES,
  UNDERPASS_PAVILIONS as PAVILIONS, segmentFrame } from './library-underpass-plan.js';

export function libraryUnderpass(K){
  const {ctx,svc}=K,ph=ctx.physics,P=K.body,D=K.detail,U=new Parts();
  const M={stone:ctx.mat.toon('#b3afa3',{paint:.025}),floor:ctx.mat.toon('#b8b7ac',{paint:.035}),
    skirt:ctx.mat.toon('#4b5150',{paint:.03}),metal:ctx.mat.toon('#59635f',{paint:.025}),
    roof:ctx.mat.toon('#788075',{paint:.035}),wall:ctx.mat.toon('#d5cfc0',{paint:.02}),
    glass:ctx.mat.glass({tint:'#91a6a8',opacity:.26,streaks:true}),light:ctx.mat.emissive('#ffe9bd',1.2)};
  K.decals.add(M.glass);
  const under=new THREE.Group();under.name='library-underpass-below';under.userData.undergroundOnly=true;under.userData.zone='library-underpass';K.root.add(under);
  const service={floor:FY,ceiling:CY,stairs:[],floors:[],deck:null,rails:[],pavilions:PAVILIONS.map(p=>p.building)};
  const solid=(x,z,w,d,rot,y0,y1)=>ph.addBox(x,z,w,d,rot,y0,y1);
  function slab(B,mat,f,w,top,bottom){
    B.push(f.x,0,f.z,f.rotY);B.box(mat,-w/2,w/2,bottom,top,-f.d/2,f.d/2);B.pop();
    const item=ph.addWalkBox(f.x,f.z,w,f.d,f.rotY,top,bottom);service.floors.push(item);return item;
  }
  const tunnel=segmentFrame(T.a,T.b),length=tunnel.d,tx=tunnel.tx,tz=tunnel.tz;
  // u east along passage, v south across passage. Its four full-height walls
  // have real gaps at all six stair/landing joins.
  const world=(u,v)=>[T.a[0]+tx*u-tz*v,T.a[1]+tz*u+tx*v];
  const floorFrame={...tunnel,d:length+5};
  slab(U,M.floor,floorFrame,T.width,FY,FY-.36);
  // Top is below the street's visible asphalt; the existing street mesh owns
  // all markings. Physics top=0 and bottom=CY makes a finite overhead deck.
  P.push(tunnel.x,0,tunnel.z,tunnel.rotY);P.box(M.stone,-T.width/2,T.width/2,CY,-.045,-floorFrame.d/2,floorFrame.d/2);P.pop();
  service.deck=ph.addWalkBox(tunnel.x,tunnel.z,T.width,floorFrame.d,tunnel.rotY,0,CY);
  const uOf=p=>(p[0]-T.a[0])*tx+(p[1]-T.a[1])*tz;
  function wall(u0,u1,v){
    if(u1-u0<.05)return;const a=world(u0,v),b=world(u1,v),f=segmentFrame(a,b);
    U.push(f.x,0,f.z,f.rotY);U.box(M.wall,-.12,.12,FY,CY,-f.d/2,f.d/2);
    U.box(M.skirt,-.145,.145,FY,FY+.38,-f.d/2,f.d/2);U.pop();solid(f.x,f.z,.24,f.d,f.rotY,FY,CY);
  }
  for(const sign of [-1,1]){
    const gaps=STAIRS.filter(s=>Math.sign((s.high[0]-s.junction[0])*(-tz)+(s.high[1]-s.junction[1])*tx)===sign)
      .map(s=>[uOf(s.junction)-s.width/2-.23,uOf(s.junction)+s.width/2+.23]).sort((a,b)=>a[0]-b[0]);
    let u=-2.5;for(const[a,b]of gaps){wall(u,Math.max(u,a),sign*T.width/2);u=Math.max(u,b);}wall(u,length+2.5,sign*T.width/2);
  }
  for(const u of [-2.5,length+2.5]){const a=world(u,-T.width/2),b=world(u,T.width/2),f=segmentFrame(a,b);
    U.push(f.x,0,f.z,f.rotY);U.box(M.wall,-.12,.12,FY,CY,-f.d/2,f.d/2);U.pop();solid(f.x,f.z,.24,f.d,f.rotY,FY,CY);}

  const rails=[];
  for(const s of STAIRS){
    const hole=HOLES.find(h=>h.id==='library-underpass-'+s.id);ph.addHole(hole.x,hole.z,hole.w,hole.d,hole.rotY);
    const items=[],steps=s.steps,rise=FY/steps;
    U.push(s.x,0,s.z,s.rotY);
    for(let i=0;i<steps;i++){
      const z0=-s.d/2+i*s.d/steps,z1=-s.d/2+(i+1)*s.d/steps,top=rise*(i+1);
      U.box(M.floor,-s.width/2,s.width/2,top-.30,top,z0,z1);
      const lz=(z0+z1)/2,item=ph.addWalkBox(s.x+Math.sin(s.rotY)*lz,s.z+Math.cos(s.rotY)*lz,s.width,s.d/steps,s.rotY,top,top-.30);
      item.sticky=true;items.push(item);
      // Pale nosing is part of each tread, separated from the riser face.
      U.box(M.stone,-s.width/2+.04,s.width/2-.04,top+.006,top+.014,z0+.035,Math.min(z1-.035,z0+.11),'b');
    }
    U.pop();
    const landing=segmentFrame(s.low,s.junction);landing.d+=.14;slab(U,M.floor,landing,s.width,FY,FY-.36);
    // Low retaining cheeks contain the excavated stairwell. Upper rail panels
    // are independent knockable pieces; the walking centre remains clear.
    for(const side of [-1,1]){
      const thick=s.pavilion?.24:.12;
      const x=s.x+s.sx*side*(s.width/2+thick/2),z=s.z+s.sz*side*(s.width/2+thick/2);
      U.push(x,0,z,s.rotY);U.box(M.skirt,-thick/2,thick/2,FY-.32,s.pavilion?.50:.10,-s.d/2,s.d/2);U.pop();
      solid(x,z,thick,s.d,s.rotY,FY-.32,s.pavilion?.50:.10);
      const count=Math.ceil(s.d/2);
      for(let j=0;j<count;j++){
        const a=j/count,b=(j+1)/count,point=t=>[s.high[0]+(s.low[0]-s.high[0])*t+s.sx*side*(s.width/2-.07),FY*t,s.high[1]+(s.low[1]-s.high[1])*t+s.sz*side*(s.width/2-.07)];
        const A=point(a),B=point(b);rails.push({x:(A[0]+B[0])/2,y:(A[1]+B[1])/2,z:(A[2]+B[2])/2,rotY:s.rotY,A,B,last:j===count-1});
      }
    }
    service.stairs.push({...s,items,landing:service.floors.at(-1)});
    const c=Math.cos(s.rotY),sn=Math.sin(s.rotY),hx=Math.abs(c)*s.width/2+Math.abs(sn)*s.d/2,hz=Math.abs(sn)*s.width/2+Math.abs(c)*s.d/2;
    ctx.zones?.add({id:'library-underpass-mouth-'+s.id,box:{x0:s.x-hx-.3,x1:s.x+hx+.3,z0:s.z-hz-.3,z1:s.z+hz+.3,y0:FY-.1,y1:2.8},showUnder:true,
      indoor:{name:'Подземный переход',sun:.3,sky:true,shadows:true,ambient:{color:'#eee4d2',ground:'#8a8981',intensity:1.45},far:320}});
  }

  // Six reusable rail part meshes at most: posts + sloped handrail per cell.
  const post=new THREE.CylinderGeometry(.035,.043,1,6).translate(0,.5,0),beam=new THREE.CylinderGeometry(.036,.036,1,6).rotateX(Math.PI/2);
  const matrix=(p,scale,quat=new THREE.Quaternion())=>new THREE.Matrix4().compose(new THREE.Vector3(...p),quat,new THREE.Vector3(...scale));
  const railItems=rails.map(r=>solid(r.x,r.z,.13,Math.hypot(r.B[0]-r.A[0],r.B[2]-r.A[2]),r.rotY,Math.min(r.A[1],r.B[1])+.1,Math.max(r.A[1],r.B[1])+1.06));
  const railOut=knockInstances(ctx,{name:'mz-library-underpass-handrail',far:260,spots:rails,items:railItems,
    parts:[{geo:post,mat:M.metal,place:r=>[r.A,...(r.last?[r.B]:[])].map(p=>matrix(p,[1,1,1]))},
      {geo:beam,mat:M.metal,place:r=>{const d=new THREE.Vector3(r.B[0]-r.A[0],r.B[1]-r.A[1],r.B[2]-r.A[2]),len=d.length();
        return matrix([r.x,r.y+1,r.z],[1,1,len],new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),d.normalize()));}}],
    rec:r=>({kind:'underpass-handrail',mass:45,h:1.2,w:.14,d:Math.hypot(r.B[0]-r.A[0],r.B[2]-r.A[2]),anchored:18,metal:true,originY:.5})});
  service.rails=railOut.records;

  // The two long low glazed buildings are entrance shelters, not apartment
  // blocks. Photo-derived metal skylight roofs, central shop and open ends.
  for(const p of PAVILIONS){
    P.push(p.x,0,p.z,p.rotY);D.push(p.x,0,p.z,p.rotY);
    for(const side of [-1,1]){
      const x=side*p.width/2;
      P.box(M.skirt,x-.10,x+.10,0,.55,-p.d/2,p.d/2);
      P.box(M.metal,x-.12,x+.12,2.25,2.45,-p.d/2-.15,p.d/2+.15);
      for(let z=-p.d/2+.12;z<p.d/2;z+=3.3){
        P.box(M.metal,x-.07,x+.07,.5,2.3,z-.055,z+.055);
        const z1=Math.min(p.d/2-.12,z+3.15);if(z1-z>.15)D.quad(M.glass,[x,.6,z+.08],[x,.6,z1],[x,2.22,z1],[x,2.22,z+.08],[side,0,0]);
      }
      // Two roof slopes keep the shelter open and recognisably low.
      D.quad(M.glass,[x,2.43,-p.d/2],[0,2.94,-p.d/2],[0,2.94,p.d/2],[x,2.43,p.d/2],[side*.2,1,0]);
    }
    P.box(M.roof,-.07,.07,2.9,3.02,-p.d/2-.18,p.d/2+.18);
    for(let z=-p.d/2;z<=p.d/2+.01;z+=3.3)for(const side of [-1,1])P.cyl(M.metal,[side*p.width/2,2.45,z],[0,2.95,z],.035,.035,5);
    P.pop();D.pop();
    // Keep both stair ends open. Shop occupies only the raised central bay;
    // its finite ground-level solid never blocks the corridor below it.
    const shop={x:p.junction[0],z:p.junction[1],rotY:p.rotY,d:3.3};
    P.push(shop.x,0,shop.z,shop.rotY);P.box(M.metal,-p.width/2,p.width/2,.05,3.22,-shop.d/2,shop.d/2);
    P.box(M.roof,-p.width/2-.18,p.width/2+.18,3.22,3.42,-shop.d/2-.18,shop.d/2+.18);
    for(const side of [-1,1]){
      const x=side*(p.width/2+.012);P.quad(M.glass,[x,.38,-1.35],[x,.38,1.35],[x,2.8,1.35],[x,2.8,-1.35],[side,0,0]);
    }P.pop();solid(shop.x,shop.z,p.width,shop.d,shop.rotY,.05,3.22);
    for(const side of [-1,1]){const x=shop.x+Math.cos(shop.rotY)*side*(p.width/2+.04),z=shop.z-Math.sin(shop.rotY)*side*(p.width/2+.04);
      K.label('underpass-shop-'+p.id+'-'+side,'КАФЕ',x,2.55,z,2.2,.42,shop.rotY+side*Math.PI/2,{bg:'#444e4b',fg:'#e3ddd0'});}
  }
  // Modest ceiling fixtures replace reliance on direct sun below the avenue.
  U.push(tunnel.x,0,tunnel.z,tunnel.rotY);
  for(let z=-length/2+3;z<length/2;z+=6){U.box(M.metal,-.38,.38,CY-.12,CY-.035,z-.7,z+.7);U.box(M.light,-.31,.31,CY-.145,CY-.125,z-.62,z+.62);}
  U.pop();
  for(const m of U.build(under,{name:'mz-library-underpass-underground'})){m.castShadow=false;m.updateMatrixWorld(true);registerLOD(m,650);}
  svc.triangles+=U.tris;
  const corners=[world(-3,-3),world(length+3,3)];
  ctx.zones?.add({id:'library-underpass-crossing',box:{x0:Math.min(...corners.map(p=>p[0]))-3,x1:Math.max(...corners.map(p=>p[0]))+3,z0:Math.min(...corners.map(p=>p[1]))-3,z1:Math.max(...corners.map(p=>p[1]))+3,y0:FY-.1,y1:-.65},showUnder:true,
    indoor:{name:'Подземный переход · Парк Победы',sun:0,key:{color:'#fff0d5',intensity:1.1,dir:[.3,.8,.4]},ambient:{color:'#eee4d2',ground:'#aaa397',intensity:1.7},fog:{color:'#b5b3a8',density:.004},sky:false,shadows:false,far:150}});
  svc.libraryUnderpass=service;
  // A street camera just outside a mouth must see the real stairwell, not sky
  // through the ground cut. Reveal only this crossing on its approach aprons;
  // it does not enable other metro interiors or change outdoor lighting.
  ctx.zones?.reveal?.({id:'library-underpass-approaches',zones:['library-underpass'],test:(x,y,z)=>{
    if(y<FY-.4||y>5)return false;
    return STAIRS.some(s=>{const dx=x-s.high[0],dz=z-s.high[1],along=dx*s.tx+dz*s.tz,across=dx*s.sx+dz*s.sz;
      return along>-12&&along<s.d+3&&Math.abs(across)<s.width/2+3;});
  }});
  svc.photoSpots.push({name:'Переход у Парка Победы',x:-1746,z:7401,yaw:-25,pitch:0});
}
