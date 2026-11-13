// Historic grounds, low enclosure and entrance details. All plan coordinates
// follow the surveyed ensemble; heights/lawn edges are photographic estimates.
import * as THREE from 'three';
import { BARRIERS, ROADS } from '../data/city.js';
import { Parts, archPath } from '../landmarksD/kit.js';
import { registerLOD } from '../../core/spatial.js';
import { splitBays, knockBays, unitBox } from '../lib/fence-bays.js';
import { COMPOUND_RING, WALL_IDS, FRONT_FENCE_IDS, COURT_WAYS, LAWNS, TREES, inCompound } from './compound-plan.js';
import { roofPieces } from './roofs.js';

const shape=(w,h,y=0)=>{const s=new THREE.Shape();archPath(s,0,y,w,h);return s;};
const rim=(w,h,y,t)=>{const s=shape(w,h,y),p=new THREE.Path();archPath(p,0,y+t,w-2*t,h-t,true);s.holes.push(p);return s;};
const hash=(x,z)=>{const a=Math.sin(x*127.1+z*311.7)*43758.5453;return a-Math.floor(a);};

export function compoundMats(ctx,M){
  // A single restrained repeating brick canvas serves the complete compound.
  // It is far smaller than any photo texture and keeps the original cel palette.
  const tex=ctx.tex.draw(512,512,(g,w,h)=>{
    g.fillStyle='#755b50';g.fillRect(0,0,w,h);
    const bw=w/16,bh=h/32;
    for(let y=0;y<32;y++)for(let x=-1;x<17;x++){
      const q=hash(x,y),r=Math.round(143+q*25),gg=Math.round(79+q*14),b=Math.round(58+q*12);
      g.fillStyle=`rgb(${r},${gg},${b})`;g.fillRect(x*bw+(y%2?bw/2:0)+.6,y*bh+.65,bw-1.15,bh-1.2);
      g.fillStyle='rgba(226,177,135,.08)';g.fillRect(x*bw+(y%2?bw/2:0)+1,y*bh+1,bw-2,1);
    }
  },{key:'finlyandsky-kresty-bond',repeat:[1,1]});
  return {...M,brick:ctx.mat.toon('#ffffff',{map:tex,paint:.012}),roofShade:ctx.mat.toon('#775b51',{paint:.02}),court:ctx.mat.toon('#777978',{paint:.012,polygonOffset:.5}),lawn:ctx.mat.toon('#617c47',{paint:.022}),gravel:ctx.mat.toon('#92918a',{paint:.02}),spruce:ctx.mat.toon('#3e6256',{paint:.025}),leaf:ctx.mat.toon('#50713d',{paint:.025}),bark:ctx.mat.toon('#5b5146',{paint:.02})};
}

export function compoundGround(ctx,root,M,records,svc){
  const P=new Parts(),D=new Parts();
  // One coherent asphalt court, with deliberately shaped lawns, replaces the
  // default mottled grass/asphalt field. Road asphalt at .03 remains above it.
  // Remove lawns from the paving instead of relying on millimetre depth
  // separation between two large planes at an aerial viewing distance.
  for(const p of roofPieces({polys:[{o:COMPOUND_RING,h:[]}]},LAWNS.map(o=>({polys:[{o,h:[]}]}))))P.fan(M.court,p.map(([x,z])=>[x,.022,z]),[0,1,0],p=>[p[0]/5,p[2]/5]);
  for(const flat of LAWNS){
    const rec={polys:[{o:flat,h:[]}]};
    for(const p of roofPieces(rec,records.filter(r=>!r.part)))P.fan(M.lawn,p.map(([x,z])=>[x,.027,z]),[0,1,0],p=>[p[0]/5,p[2]/5]);
  }
  // The replaced narrow paths retain their surveyed routing but share the
  // court finish, instead of leaving isolated brick ribbons through the lawn.
  for(const r of ROADS.filter(r=>COURT_WAYS.includes(r.id)))for(let i=0;i+3<r.pts.length;i+=2){
    const[x,z,xx,zz]=r.pts.slice(i,i+4),dx=xx-x,dz=zz-z,l=Math.hypot(dx,dz),nx=-dz/l*(r.w||2.4)/2,nz=dx/l*(r.w||2.4)/2;
    D.quad(M.court,[x+nx,.039,z+nz],[xx+nx,.039,zz+nz],[xx-nx,.039,zz-nz],[x-nx,.039,z-nz],[0,1,0]);
  }
  let trees=0;
  for(const [x,z,h,kind]of TREES){
    if(!inCompound(x,z)||records.some(r=>r.polys.some(p=>pointInside(x,z,p.o))))continue;
    P.col(M.bark,x,z,.03,h*.8,.23,.13,6);
    if(kind==='spruce'){
      for(let i=0;i<7;i++){const y=1.2+i*h*.105,r=(h*.235)*(1-i*.105);P.col(M.spruce,x,z,y,y+h*.34,r,.025,9);}
    }else{
      const g=new THREE.IcosahedronGeometry(1,1);
      for(const[dx,dz,dy,s]of[[0,0,.68,1],[-1.6,.6,.62,.8],[1.5,-.5,.64,.82],[.4,1.2,.84,.73]])P.geo(M.leaf,g,x+dx,h*dy,z+dz,0,hash(x+dx,z)*6,0,h*.24*s,h*.25*s,h*.23*s);
      g.dispose();
    }
    ctx.physics.addCylinder(x,z,.23,0,h*.78);trees++;
  }
  for(const[p,far]of[[P,1350],[D,650]])for(const m of p.build(root,{name:'finlyandsky-kresty-grounds'})){
    // Preserve foliage provenance through batching and claims audits: a tree
    // overhanging a roof must never count as that building's structural shell.
    if([M.spruce,M.leaf,M.bark].includes(m.material))m.name='finlyandsky-kresty-trees';
    m.receiveShadow=true;registerLOD(m,far);
  }
  svc.triangles+=P.tris+D.tris;svc.compound={bounds:[602.5,868,-2493.2,-2285.1],trees,lawns:LAWNS.length,ways:COURT_WAYS.length,buildingRecords:records.length};
}
function pointInside(x,z,flat){let yes=false;for(let i=0,j=flat.length-2;i<flat.length;j=i,i+=2)if((flat[i+1]>z)!==(flat[j+1]>z)&&x<(flat[j]-flat[i])*(z-flat[i+1])/(flat[j+1]-flat[i+1])+flat[i])yes=!yes;return yes;}

export function compoundWalls(ctx,M,svc){
  const walls=BARRIERS.filter(r=>WALL_IDS.includes(r.id)),bays=[];
  const net=ctx.services.streets?.net;
  const roadSegments=ROADS.filter(r=>['primary','secondary','tertiary','residential','unclassified','living_street','service'].includes(r.hw)&&!r.bridge&&!r.tunnel).flatMap(r=>Array.from({length:r.pts.length/2-1},(_,i)=>({r,a:r.pts.slice(i*2,i*2+2),b:r.pts.slice(i*2+2,i*2+4)}))).filter(s=>Math.min(s.a[0],s.b[0])<894&&Math.max(s.a[0],s.b[0])>580&&Math.min(s.a[1],s.b[1])<-2256&&Math.max(s.a[1],s.b[1])>-2520);
  const distance=(x,z,a,b,extend=0)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,t=Math.max(-extend/l,Math.min(1+extend/l,((x-a[0])*dx+(z-a[1])*dz)/(l*l)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);};
  const cover=(x,z,ranked=false)=>net?.cover?net.cover(x,z,{minRank:ranked?1:0}):Math.max(-1e6,...roadSegments.filter(s=>!ranked||s.r.hw!=='service').map(s=>(s.r.w||7)/2-distance(x,z,s.a,s.b)));
  const clearBay=b=>{const dx=b.x1-b.x0,dz=b.z1-b.z0,l=Math.hypot(dx,dz)||1,nx=-dz/l,nz=dx/l;
    // Service ways continue through real gates. Extend their centreline a few
    // metres beyond a mapped end so a shifted screen cannot close the access.
    if(roadSegments.some(s=>s.r.hw==='service'&&distance((b.x0+b.x1)/2,(b.z0+b.z1)/2,s.a,s.b,6)<(s.r.w||4)/2+1.1))return false;
    return[0,.25,.5,.75,1].every(t=>[-.34,.34].every(v=>cover(b.x0+dx*t+nx*v,b.z0+dz*t+nz*v)<-.22));
  };
  for(const r of walls){
    const pts=[];
    for(let i=0;i+3<r.pts.length;i+=2){const[a,z,b,zz]=r.pts.slice(i,i+4),dx=b-a,dz=zz-z,l=Math.hypot(dx,dz),n=Math.ceil(l/5.6);
      for(let j=i?1:0;j<=n;j++){
        let x=a+dx*j/n,q=z+dz*j/n;
        // The same surveyed corner gets the same inward vector in either wall
        // record, so a clearance correction cannot tear their shared join.
        const vx=735-x,vz=-2380-q,vl=Math.hypot(vx,vz)||1,nx=vx/vl,nz=vz/vl;
        // Mapped road width and parking can extend past an old wall survey.
        // Follow the first clear line inside the compound, never the asphalt.
        for(let d=0;d<6&&cover(x,q,true)>-.65;d+=.25){x+=nx*.25;q+=nz*.25;}
        pts.push([x,q]);
      }
    }
    for(let i=0;i+1<pts.length;i++)bays.push(...splitBays(...pts[i],...pts[i+1],2.8,{y:0,id:r.id}).filter(clearBay));
  }
  // Even the masonry screen is segmented and knockable. Its thin architectural
  // coping never hides an unbreakable collider after a bay has fallen.
  knockBays(ctx,{name:'finlyandsky-kresty-brick-enclosure',bays,parts:[{name:'wall',geo:unitBox(0,3.6,-.24,.24,{uLen:1.72,uvs:2.56}),mat:M.brick,stretch:true},{name:'string',geo:unitBox(3.25,3.38,-.29,.29),mat:M.lightBrick,stretch:true},{name:'coping',geo:unitBox(3.57,3.74,-.32,.32),mat:M.roof,stretch:true}],collider:{y0:0,y1:3.74,thick:.64},rec:{kind:'fence',mass:480,h:3.74,anchored:17,hitK:.34,minDv:0},far:750});
  const fenceBays=[];for(const r of BARRIERS.filter(r=>FRONT_FENCE_IDS.includes(r.id)))for(let i=0;i+3<r.pts.length;i+=2)fenceBays.push(...splitBays(...r.pts.slice(i,i+4),2.2,{y:0,id:r.id}).filter(clearBay));
  const picket=new THREE.BoxGeometry(.023,.9,.023);picket.translate(0,.67,0);
  knockBays(ctx,{name:'finlyandsky-kresty-front-iron',bays:fenceBays,parts:[{geo:unitBox(0,.16,-.17,.17),mat:M.stone,stretch:true},{geo:unitBox(.19,.23,-.04,.04),mat:M.iron,stretch:true},{geo:unitBox(1.08,1.13,-.04,.04),mat:M.iron,stretch:true},{geo:picket,mat:M.iron,ats:()=>[0,.14,.28,.42,.56,.7,.84,1]}],collider:{y0:0,y1:1.13,thick:.16},rec:{kind:'fence',mass:28,h:1.13,anchored:8,hitK:.65,metal:true,minDv:0},far:360});
  svc.compound.wallBays=bays.length;svc.compound.frontFenceBays=fenceBays.length;
}

export function entranceDetail(ctx,root,M,svc){
  const P=new Parts(),D=new Parts(),x=721.9,z=-2291.05,rot=.1875;
  P.push(x,0,z,rot);D.push(x,0,z,rot);
  // The real entrance is a raised centre with paired arches over the portal,
  // lower side wings, corbelled corners and a blind-arch cornice.
  P.box(M.brick,-4.9,4.9,9.6,12.4,-3.8,.05,'b',2.56);
  P.box(M.brick,-9.35,-4.9,10.35,11.05,-.32,.16,'b',2.56);P.box(M.brick,4.9,9.35,10.35,11.05,-.32,.16,'b',2.56);
  D.box(M.lightBrick,-5.12,5.12,12.1,12.35,-3.9,.27,'b');
  for(const xx of[-8.7,-5.15,5.15,8.7]){
    D.box(M.lightBrick,xx-.36,xx+.36,.35,10.25,-.12,.31,'b');
    for(let j=0;j<5;j++)D.box(M.lightBrick,xx-.35-j*.045,xx+.35+j*.045,9.7+j*.22,9.9+j*.22,-.09,.38+j*.04,'b');
    D.box(M.roof,xx-.61,xx+.61,10.85,11.01,-.23,.55,'b');
  }
  for(const yy of[.55,5.12,5.43,10.52])D.box(M.lightBrick,-9.4,9.4,yy,yy+.13,-.04,.19,'b');
  D.box(M.lightBrick,-4.95,4.95,11.25,11.38,-.04,.19,'b');
  // Slightly pointed nested brick portal surrounds a weathered double door.
  for(const[w,h,y,d]of[[5.0,2.65,.18,.28],[4.65,2.59,.26,.35],[4.22,2.51,.34,.42]])D.face(M.lightBrick,rim(w,h,y,.14),d,2.56,10);
  D.box(M.wood,-1.20,1.20,.1,3.35,.33,.48,'b');D.box(M.silver,-1.15,1.15,.15,3.28,.48,.52,'b');
  D.box(M.iron,-.035,.035,.18,3.23,.53,.57,'b');
  for(const xx of[-.64,.64]){D.box(M.iron,xx-.045,xx+.045,1.4,1.8,.55,.62,'b');D.box(M.stone,xx-.92,xx+.92,.10,.25,.6,1.25,'b');}
  for(const xx of[-1.25,1.25]){
    D.push(xx,0,0);D.face(M.lightBrick,rim(2.25,2.1,6.1,.21),.32);D.face(M.window,shape(1.73,2.08,6.23),.36);
    for(const u of[-.50,-.25,0,.25,.50])D.box(M.iron,u-.019,u+.019,6.3,8.75,.39,.44,'b');D.pop();
  }
  for(const xx of[-7.25,-5.4,5.4,7.25]){
    D.push(xx,0,0);D.face(M.lightBrick,rim(1.55,1.65,5.9,.15),.34);D.face(M.window,shape(1.16,1.6,6.05),.38);D.pop();
  }
  for(let i=0;i<11;i++){const u=-4.4+i*.88;D.push(u,0,0);D.face(M.darkBrick,shape(.47,.34,10.48),.17);D.face(M.lightBrick,rim(.65,.38,10.42,.10),.20);D.pop();}
  // Zinc downpipes bend into projecting hoppers and run to the stone footing.
  for(const u of[-5.4,5.4]){D.cyl(M.silver,[u,.25,.38],[u,9.6,.38],.065,.065,7);D.cyl(M.silver,[u,9.6,.38],[u-.22,10.14,.23],.065,.10,7);}
  if(ctx.tex?.sign){const tex=ctx.tex.sign({text:'7',bg:'#e4e3d4',fg:'#35616a',w:128,h:128,font:'sans'}),mat=ctx.mat.decal('#ffffff',{map:tex});D.quad(mat,[-8.8,4.15,.40],[-8.12,4.15,.40],[-8.12,4.88,.40],[-8.8,4.88,.40],[0,0,1]);}
  P.pop();D.pop();for(const[p,far]of[[P,1300],[D,420]])for(const m of p.build(root,{name:'finlyandsky-kresty-entrance'}))registerLOD(m,far);
  svc.triangles+=P.tris+D.tris;svc.entrances.push({x,z,rotY:rot,bldg:'r17026337'});
}
