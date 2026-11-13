// Historic Kresty and the neo-Gothic Mineralnaya church: exact mapped shells,
// reference-authored rooflines and architectural detail. See the research dossier.
import * as THREE from 'three';
import * as L from './layout.js';
import { Parts, archPath } from './landmarksD/kit.js';
import { ringFromFlat, signedArea } from './lib/massing.js';
import { registerLOD } from '../core/spatial.js';
import { roofPieces, clippedPieces, fittedRoof, insideRecord } from './landmarksFinlyandsky/roofs.js';

export const OWNS_GROUPS = true;
const ROT=.1875;

function arch(w,h,y=0){const s=new THREE.Shape();archPath(s,0,y,w,h);return s;}
function archRim(w,h,y,t=.16){const s=arch(w,h,y),p=new THREE.Path();archPath(p,0,y+t,w-2*t,h-t,true);s.holes.push(p);return s;}
function pointed(w,y,h){const s=new THREE.Shape();s.moveTo(-w/2,y);s.lineTo(w/2,y);s.lineTo(w/2,y+h*.68);s.quadraticCurveTo(w*.40,y+h*.88,0,y+h);s.quadraticCurveTo(-w*.40,y+h*.88,-w/2,y+h*.68);s.closePath();return s;}
function cross(P,M,x,z,y,h=2){P.cyl(M,[x,y,z],[x,y+h,z],.075,.06,6);P.cyl(M,[x-h*.28,y+h*.65,z],[x+h*.28,y+h*.65,z],.065,.065,6);}
function dome(P,M,x,z,y,r,h){
  // Broad low hemispherical Russian cupolas, not onion-shaped cones.
  const g=new THREE.SphereGeometry(r,16,8,0,Math.PI*2,0,Math.PI/2);
  P.geo(M,g,x,y,z,0,0,0,1,h/r,1);g.dispose();
}
function edges(poly){
  const out=[];
  for(const [j,flat]of[poly.o,...(poly.h||[])].entries()){
    const r=ringFromFlat(flat),sgn=(signedArea(r)>0?1:-1)*(j? -1:1);
    for(let i=0;i<r.length;i++){
      const a=r[i],b=r[(i+1)%r.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.05)continue;
      const nx=sgn*dz/len,nz=-sgn*dx/len;
      out.push({a,b,len,nx,nz,rot:Math.atan2(nx,nz)});
    }
  }return out;
}
function shell(P,M,rec,y0,y1,ctx,collide=true,cap=true){
  for(const poly of rec.polys){
    for(const e of edges(poly)){
      const[a,b]=[e.a,e.b],top=typeof y1==='function'?y1((a[0]+b[0])/2,(a[1]+b[1])/2):y1;
      P.quad(M,[a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],top,b[1]],[a[0],top,a[1]],[e.nx,0,e.nz]);
      if(collide)ctx.physics.addBox((a[0]+b[0])/2,(a[1]+b[1])/2,e.len,.4,Math.atan2(- (b[1]-a[1]),b[0]-a[0]),y0,top);
    }
    if(cap)P.cap(M,ringFromFlat(poly.o),y1,true,4,(poly.h||[]).map(ringFromFlat));
  }
}
class Repeat {
  constructor(){this.groups=new Map();this.tris=0;}
  box(mat,x,y,z,w,h,d,rot=0,far=500){const key=mat.uuid+'/'+far;let row=this.groups.get(key);if(!row){row={mat,far,mats:[]};this.groups.set(key,row);}const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rot),new THREE.Vector3(w,h,d));row.mats.push(m);this.tris+=12;}
  flush(root){const geo=new THREE.BoxGeometry(1,1,1);for(const row of this.groups.values()){const mesh=new THREE.InstancedMesh(geo,row.mat,row.mats.length);row.mats.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.name='finlyandsky-repeated-facade';mesh.userData.buildingFacade=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.computeBoundingBox();root.add(mesh);registerLOD(mesh,row.far);}}
}
function trimAlong(R,mat,e,y,h,depth=.12,far=700){R.box(mat,(e.a[0]+e.b[0])/2+e.nx*.08,y,(e.a[1]+e.b[1])/2+e.nz*.08,e.len,h,depth,e.rot,far);}
function kresty(ctx,root,M,svc){
  const records=L.groupMembers('finlyandsky-kresty');if(!records.length)return;
  const P=new Parts(),D=new Parts(),R=new Repeat();
  const main=records.find(b=>b.id==='r17026343'),chapel=records.find(b=>b.id==='r17026341');
  const low=records.find(b=>b.id==='r17026342'),yards=records.find(b=>b.id==='r17026340');
  const mainHeight=(x,z)=>insideRecord(low,x,z)?9.9:insideRecord(yards,x,z)?3.3:18.7;
  // The complete 5-storey parent includes both cruciform cell blocks. Its
  // partial lower-rise parts are already inside that footprint, not duplicate shells.
  for(const rec of records.filter(b=>!b.part&&!b.skip)){
    const isMain=rec===main,h=isMain?18.7:rec.id==='w60557313'?7.5:rec.id==='r17026344'?12.4:rec.id==='r17026337'?12.0:rec.id==='r17026338'?6.3:9.7;
    shell(P,M.brick,rec,0,isMain?mainHeight:h,ctx,true,false);
    for(const poly of rec.polys)for(const e of edges(poly)){
      const h=isMain?mainHeight((e.a[0]+e.b[0])/2,(e.a[1]+e.b[1])/2):rec.id==='w60557313'?7.5:rec.id==='r17026344'?12.4:rec.id==='r17026337'?12.0:rec.id==='r17026338'?6.3:9.7;
      trimAlong(R,M.darkBrick,e,.52,.65,.14,900);trimAlong(R,M.lightBrick,e,h-.25,.45,.30,900);
      for(let y=3.65;y<h-1;y+=3.25)trimAlong(R,M.lightBrick,e,y,.13,.12,550);
      const count=Math.floor((e.len-.8)/3.35);if(count<1)continue;
      for(let j=0;j<count;j++){
        const t=(j+.5)/count,x=e.a[0]+(e.b[0]-e.a[0])*t,z=e.a[1]+(e.b[1]-e.a[1])*t;
        const width=isMain?.92:1.10;
        for(let y=1.65;y<h-1;y+=3.25){
          R.box(M.lightBrick,x+e.nx*.09,y+.02,z+e.nz*.09,width+.30,1.65,.11,e.rot,600);
          R.box(M.window,x+e.nx*.17,y+.02,z+e.nz*.17,width,1.38,.11,e.rot,600);
          R.box(M.stone,x+e.nx*.23,y-.80,z+e.nz*.23,width+.35,.13,.36,e.rot,600);
          // Close bars are short-range immutable instances; no animation work.
          for(const u of[-.27,0,.27])R.box(M.iron,x+e.nx*.25+Math.cos(e.rot)*u,y+.02,z+e.nz*.25-Math.sin(e.rot)*u,.035,1.38,.05,e.rot,170);
        }
      }
      // Brick pilaster stacks separate the high wall bays, as in Tomishko's
      // utilitarian brick architecture; they remain shallow of the road frontage.
      for(let j=0;j<=Math.floor(e.len/8);j++){
        const t=j/Math.max(1,Math.floor(e.len/8));R.box(M.lightBrick,e.a[0]+(e.b[0]-e.a[0])*t+e.nx*.1,h/2,e.a[1]+(e.b[1]-e.a[1])*t+e.nz*.1,.35,h-.8,.22,e.rot,650);
      }
    }
    if(!isMain){for(const poly of rec.polys)P.cap(M.roof,ringFromFlat(poly.o),h+.06,true,4,(poly.h||[]).map(ringFromFlat));}
    svc.houses.push({id:rec.id,name:'Исторический комплекс «Кресты»',x:rec.cx,z:rec.cz,h});
  }
  if(main){
    // The original parent also contains a three-storey western wing and the
    // low radial exercise-yard structure. Neither is a five-storey cell wing.
    const pieces=roofPieces(main,[low,yards,chapel]);
    for(const [side,x,z]of[[true,665.5,-2380.0],[false,793.8,-2359.2]]){
      const half=clippedPieces(pieces,[729,-3000],[729,-2000],side);
      fittedRoof(P,M.roof,half,{x,z,rot:ROT,eave:18.7,profiles:[{axis:'v',run:8.0,rise:3.55},{axis:'u',run:7.6,rise:3.55}],boundary:[main,low,yards,chapel],wallMat:M.brick});
    }
    if(low){
      fittedRoof(P,M.roof,roofPieces(low),{x:616.7,z:-2411.8,rot:-.055,eave:9.9,profiles:[{axis:'u',run:6.1,rise:1.7}],boundary:[low],wallMat:M.brick});
    }
    if(yards){
      // The aerial reference shows an open low circular exercise yard with
      // radial partition tops, rather than the old tall drum-and-flat-roof mass.
      // Below the shared asphalt layer: any surveyed service access stays drawn.
      for(const p of yards.polys)P.cap(M.stone,ringFromFlat(p.o),.015,true,4,(p.h||[]).map(ringFromFlat));
      for(let i=0;i<16;i++){
        const a=i*Math.PI/8,ex=829.4+Math.sin(a)*11.7,ez=-2336.1+Math.cos(a)*11.7;
        D.cyl(M.silver,[829.4,3.4,-2336.1],[ex,3.4,ez],.095,.095,5);
      }
      P.col(M.stone,829.4,-2336.1,0,3.45,.8,.8,12);
    }
    // Close the real height changes where a low child adjoins the taller mass.
    for(const child of[low,yards].filter(Boolean))for(const p of child.polys)for(const e of edges(p)){
      const x=(e.a[0]+e.b[0])/2,z=(e.a[1]+e.b[1])/2;
      if(!insideRecord(main,x+e.nx*.2,z+e.nz*.2,0)||!insideRecord(main,x-e.nx*.2,z-e.nz*.2,0))continue;
      const lo=child===low?9.9:3.3;
      P.quad(M.brick,[e.a[0],lo,e.a[1]],[e.b[0],lo,e.b[1]],[e.b[0],18.7,e.b[1]],[e.a[0],18.7,e.a[1]],[-e.nx,0,-e.nz]);
    }
    // Surveyed cross centres retain their round observation crowns. Chimneys
    // stand on the pitched ridges, with finite-range immutable detail.
    for(const [x,z]of[[665.5,-2380.0],[793.8,-2359.2]]){
      P.col(M.brick,x,z,18.7,25.1,7.1,7.1,16);
      P.col(M.lightBrick,x,z,24.7,25.25,7.45,7.45,16);
      dome(P,M.roof,x,z,25.25,7.55,4.1);
      for(let i=0;i<12;i++){const a=i*Math.PI/6,nx=Math.sin(a),nz=Math.cos(a);D.push(x+nx*7.14,0,z+nz*7.14,a);D.face(M.lightBrick,arch(1.7,2.55,21.05),0);D.face(M.window,arch(1.25,2.35,21.22),.06);D.pop();}
      for(const [u,v]of[[-30,0],[30,0],[0,-31],[0,31]]){
        const xx=x+Math.cos(ROT)*u+Math.sin(ROT)*v,zz=z-Math.sin(ROT)*u+Math.cos(ROT)*v;
        R.box(M.brick,xx,23.0,zz,1.0,1.7,.8,ROT,650);R.box(M.lightBrick,xx,23.8,zz,1.15,.18,.95,ROT,650);
      }
    }
  }
  if(chapel){
    // The roof church rises above the common block, so no coplanar duplicate
    // wall is drawn at lower stories. Five domes have distinct broad profiles.
    shell(P,M.brick,chapel,18.7,28.5,ctx,false,false);
    const x=713.6,z=-2336.3;
    fittedRoof(P,M.roof,roofPieces(chapel),{x,z,rot:ROT,eave:28.5,profiles:[{axis:'v',run:11.8,rise:3.3},{axis:'u',at:.3,run:8.4,rise:5.2}],boundary:[chapel],wallMat:M.brick});
    for(const side of[-1,1]){
      const xx=x+Math.sin(ROT)*side*13.49,zz=z+Math.cos(ROT)*side*13.49;
      D.push(xx,0,zz,ROT+(side<0?Math.PI:0));
      const w=side>0?16.1:6.1,h=side>0?11.5:9.1;
      D.face(M.darkBrick,pointed(w,22.2,h),0);D.face(M.lightBrick,pointed(w-.7,22.45,h-.6),.07);D.face(M.brick,pointed(w-1.45,22.7,h-1.2),.14);
      const ww=side>0?6.3:3.3;
      D.face(M.darkBrick,arch(ww+1.3,10.4,20.45),.21);D.face(M.lightBrick,archRim(ww+1.0,10.2,20.55,.25),.28);D.face(M.window,arch(ww,9.9,20.7),.35);
      for(const u of[-ww*.3,0,ww*.3])D.box(M.iron,u-.055,u+.055,20.9,29.8,.40,.47);
      D.pop();
    }
    for(const [u,v,r,y,h]of[[0,0,5.1,37.0,4.2],[-7,-6.3,2.3,32.4,2.35],[-7,6.3,2.3,32.4,2.35],[7,-6.3,2.3,32.4,2.35],[7,6.3,2.3,32.4,2.35]]){
      const xx=x+Math.cos(ROT)*u+Math.sin(ROT)*v,zz=z-Math.sin(ROT)*u+Math.cos(ROT)*v;
      P.col(M.brick,xx,zz,y-5.7,y,r*.86,r*.86,12);P.col(M.lightBrick,xx,zz,y-.25,y+.15,r,r,12);dome(P,M.silver,xx,zz,y+.15,r*1.04,h);cross(P,M.gold,xx,zz,y+h+.12,r>3?2.2:1.2);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;D.push(xx+Math.sin(a)*r*.87,0,zz+Math.cos(a)*r*.87,a);D.face(M.lightBrick,arch(r*.66,3.15,y-4.9),0);D.face(M.window,arch(r*.46,2.95,y-4.75),.05);D.pop();}
    }
    svc.monuments.push({id:chapel.id,name:'Церковь Александра Невского · Кресты',x,z,h:43.5});
  }
  // The measured brick boiler chimney belongs to this courtyard, behind the
  // church in river views. Taper and collars avoid a featureless square tower.
  P.col(M.darkBrick,766.0,-2410.4,0,61.5,3.05,2.05,14);P.col(M.lightBrick,766,-2410.4,60.5,62.0,2.25,2.2,14);
  ctx.physics.addCylinder(766,-2410.4,3.05,0,62);
  for(const y of[4,20,38,56])D.col(M.lightBrick,766,-2410.4,y,y+.22,3.1-y*.016,3.1-y*.016,14);
  R.flush(root);for(const[p,far]of[[P,2600],[D,650]])for(const m of p.build(root,{name:'finlyandsky-kresty'}))registerLOD(m,far);
  svc.triangles+=P.tris+D.tris+R.tris;
  svc.photoSpots.push({name:'Кресты · Арсенальная набережная',x:729,z:-2248,yaw:10.3,pitch:14});
}

function visitation(ctx,root,M,svc){
  const rec=L.groupMembers('finlyandsky-visitation').find(b=>b.id==='w366423247');if(!rec)return;
  const P=new Parts(),D=new Parts(),R=new Repeat(),x=998,z=-3770,rot=.188;
  // Exact OSM shell includes rounded western apse, transept and eastern tower.
  shell(P,M.cream,rec,0,16.5,ctx,true,false);
  for(const poly of rec.polys)for(const e of edges(poly)){
    trimAlong(R,M.stone,e,.55,.75,.18,900);trimAlong(R,M.white,e,15.9,.65,.30,900);
    if(e.len<9)continue;
    const count=Math.max(1,Math.floor(e.len/5));
    for(let j=0;j<count;j++){
      const t=(j+.5)/count,xx=e.a[0]+(e.b[0]-e.a[0])*t,zz=e.a[1]+(e.b[1]-e.a[1])*t;
      D.push(xx+e.nx*.07,0,zz+e.nz*.07,e.rot);
      D.face(M.white,arch(2.6,7.1,4.3),0);D.face(M.window,arch(2.12,6.9,4.5),.08);
      D.box(M.wood,-.045,.045,4.55,12.4,.12,.17);D.box(M.wood,-1.03,1.03,8.2,8.27,.12,.17);D.box(M.silver,-1.35,1.35,4.15,4.34,0,.38);D.pop();
      D.push(xx+e.nx*.10,0,zz+e.nz*.10,e.rot);
      D.face(M.white,arch(1.45,1.45,.62),0);D.face(M.window,arch(1.07,1.30,.69),.08);
      D.box(M.stone,-.82,.82,.48,.66,0,.27);D.pop();
    }
    // The real nave is articulated by stepped projecting buttresses; flat
    // painted pilaster strips miss a characteristic silhouette at close range.
    for(let j=0;j<=count;j++){
      const t=(j+.05)/(count+.1),xx=e.a[0]+(e.b[0]-e.a[0])*t,zz=e.a[1]+(e.b[1]-e.a[1])*t;
      D.push(xx+e.nx*.09,0,zz+e.nz*.09,e.rot);
      D.box(M.cream,-.43,.43,.55,8.7,0,.82);D.box(M.white,-.47,.47,8.55,8.80,-.02,.91);
      D.box(M.cream,-.32,.32,8.8,13.8,0,.54);
      D.quad(M.silver,[-.51,8.81,.94],[.51,8.81,.94],[.51,9.34,-.04],[-.51,9.34,-.04],[0,1,1]);
      D.quad(M.silver,[-.39,13.81,.64],[.39,13.81,.64],[.39,14.36,-.03],[-.39,14.36,-.03],[0,1,1]);
      D.box(M.white,-.37,.37,13.65,13.84,-.02,.62);D.pop();
    }
    for(let i=0;i<Math.floor(e.len/1.1);i++){
      const t=(i+.5)/Math.floor(e.len/1.1),xx=e.a[0]+(e.b[0]-e.a[0])*t,zz=e.a[1]+(e.b[1]-e.a[1])*t;
      D.push(xx+e.nx*.14,0,zz+e.nz*.14,e.rot);D.face(M.white,archRim(.64,.7,14.6,.11),0);D.pop();
    }
  }
  const point=(u,v)=>[x+Math.cos(rot)*u+Math.sin(rot)*v,z-Math.sin(rot)*u+Math.cos(rot)*v];
  // Fit both the wide hall and the narrower eastern narthex to the surveyed
  // outline. The rose-window projection has its own crossing ridge, so its
  // gable is supported by an actual roof rather than standing in the sky.
  const allRoof=roofPieces(rec),cutA=point(6.32,-1000),cutB=point(6.32,1000);
  fittedRoof(P,M.silver,clippedPieces(allRoof,cutA,cutB),{x,z,rot,eave:16.5,profiles:[{axis:'v',run:12,rise:3.7},{axis:'u',at:-7,run:6.1,rise:4.7}],boundary:[rec],wallMat:M.cream});
  fittedRoof(P,M.silver,clippedPieces(clippedPieces(allRoof,cutA,cutB,false),point(21.1,-1000),point(21.1,1000)),{x,z,rot,eave:16.5,profiles:[{axis:'v',run:6.35,rise:2.5}],boundary:[rec],wallMat:M.cream});
  for(const piece of clippedPieces(allRoof,point(21.1,-1000),point(21.1,1000),false))P.fan(M.silver,piece.map(([x,z])=>[x,16.5,z]),[0,1,0]);
  P.push(x,0,z,rot);
  for(const[a,b]of[[-6.25,0],[0,6.08]])P.quad(M.cream,[6.32,16.5,a],[6.32,16.5,b],[6.32,20.2-Math.abs(b)/12*3.7,b],[6.32,20.2-Math.abs(a)/12*3.7,a],[1,0,0]);
  P.pop();
  // Transverse gable and a real circular rose window are prominent in the
  // southern three-quarter photograph, alongside the tall nave windows.
  const [rx,rz]=point(-7,11.8);D.push(rx,0,rz,rot);
  D.fan(M.white,[[-6.1,16.5,0],[0,21.2,0],[6.1,16.5,0]],[0,0,1]);D.fan(M.cream,[[-5.45,16.55,.08],[0,20.65,.08],[5.45,16.55,.08]],[0,0,1]);
  // Broad recessed blind arches and tooth courses beneath the pointed eaves.
  for(const side of[-1,1])for(let j=0;j<5;j++){
    const u=side*(.75+j),yy=20.1-j*.76;
    D.box(M.white,u-.25,u+.25,yy-.5,yy,.13,.29);
  }
  D.cyl(M.white,[0,14,.16],[0,14,.27],2.05,2.05,24);D.cyl(M.window,[0,14,.29],[0,14,.36],1.62,1.62,24);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;D.cyl(M.white,[0,14,.39],[Math.sin(a)*1.52,14+Math.cos(a)*1.52,.39],.055,.055,5);}D.pop();
  const tx=1022.0,tz=-3774.95;
  // Square entrance tower changes into an octagonal clock stage, open bell
  // stage and slender eight-sided spire. No decorative flagpoles are present.
  P.push(tx,0,tz,rot);D.push(tx,0,tz,rot);
  // The mapped lower shell already contains the tower's ground footprint.
  // Start this authored continuation above its roof, avoiding duplicate walls.
  P.box(M.cream,-4.1,4.1,16.5,22.4,-4.1,4.1);P.box(M.white,-4.35,4.35,21.8,22.55,-4.35,4.35);
  for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5]){
    D.push(Math.sin(a)*4.17,0,Math.cos(a)*4.17,a);
    D.face(M.white,pointed(3.9,.2,5.6),0);D.face(M.wood,pointed(3.15,.2,5.15),.08);
    D.face(M.white,arch(2.6,7.5,10.2),.03);D.face(M.window,arch(2.0,7.25,10.4),.10);
    for(const u of[-3.65,3.65]){D.box(M.white,u-.23,u+.23,.6,21.8,-.04,.24);D.box(M.silver,u-.4,u+.4,9.2,9.55,-.14,.34);}
    D.pop();
  }
  P.col(M.cream,0,0,22.5,27.5,3.62,3.62,8);P.col(M.white,0,0,27.25,27.8,3.93,3.93,8);
  P.col(M.cream,0,0,27.8,35.3,3.62,3.62,8);P.col(M.white,0,0,35.05,35.65,3.97,3.97,8);
  for(let i=0;i<8;i++){
    const a=Math.PI/8+i*Math.PI/4;D.push(Math.sin(a)*3.36,0,Math.cos(a)*3.36,a);
    D.face(M.white,arch(1.88,4.5,28.35),0);D.face(M.window,arch(1.35,4.25,28.55),.07);
    D.cyl(M.white,[0,25.1,.02],[0,25.1,.12],.67,.67,12);D.cyl(M.window,[0,25.1,.14],[0,25.1,.20],.42,.42,12);D.pop();
  }
  for(let i=0;i<8;i++){
    const a=Math.PI/8+i*Math.PI/4;D.push(Math.sin(a)*3.73,0,Math.cos(a)*3.73,a);
    for(const u of[-.72,0,.72])D.box(M.white,u-.105,u+.105,34.65,35.05,0,.13);
    D.pop();
  }
  P.col(M.roof,0,0,35.6,46.4,3.83,.08,8);cross(P,M.gold,0,0,46.4,1.7);
  for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;P.cyl(M.silver,[Math.sin(a)*3.84,35.6,Math.cos(a)*3.84],[0,46.4,0],.05,.035,5);}
  P.pop();D.pop();R.flush(root);
  for(const[p,far]of[[P,2100],[D,500]])for(const m of p.build(root,{name:'finlyandsky-visitation'}))registerLOD(m,far);
  svc.triangles+=P.tris+D.tris+R.tris;svc.houses.push({id:rec.id,name:'Храм Посещения',x:rec.cx,z:rec.cz,h:48.1});
  svc.monuments.push({id:rec.id,name:'Храм Посещения Пресвятой Девой Марией Елизаветы',x:rec.cx,z:rec.cz,h:48.1});
  svc.photoSpots.push({name:'Храм Посещения · Минеральная улица',x:1040,z:-3725,yaw:47.0,pitch:17});
}

export function build(ctx){
  const M=Object.fromEntries(Object.entries({brick:'#a35b45',darkBrick:'#714939',lightBrick:'#b66d51',stone:'#92918a',roof:'#8c6b5e',silver:'#a7b2b5',window:'#3c464a',iron:'#343a39',gold:'#b8a06b',cream:'#d9cda9',white:'#e8e1cc',wood:'#665549'}).map(([k,c])=>[k,ctx.mat.toon(c,{paint:.02})]));
  const root=new THREE.Group();root.name='landmarksFinlyandsky';
  const svc={houses:[],monuments:[],entrances:[],photoSpots:[],triangles:0};
  kresty(ctx,root,M,svc);visitation(ctx,root,M,svc);ctx.addStatic(root);
  ctx.services.landmarksFinlyandsky=svc;const common=ctx.services.landmarks||={};
  common.monuments=(common.monuments||[]).concat(svc.monuments);common.photoSpots=(common.photoSpots||[]).concat(svc.photoSpots);
}
