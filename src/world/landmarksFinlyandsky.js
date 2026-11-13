// Historic Kresty and the neo-Gothic Mineralnaya church: exact mapped shells,
// reference-authored rooflines and architectural detail. See the research dossier.
import * as THREE from 'three';
import * as L from './layout.js';
import { Parts, archPath } from './landmarksD/kit.js';
import { ringFromFlat, signedArea } from './lib/massing.js';
import { registerLOD } from '../core/spatial.js';

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
function shell(P,M,rec,y0,y1,ctx,collide=true){
  for(const poly of rec.polys){
    for(const e of edges(poly)){
      const[a,b]=[e.a,e.b];P.quad(M,[a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]],[e.nx,0,e.nz]);
      if(collide)ctx.physics.addBox((a[0]+b[0])/2,(a[1]+b[1])/2,e.len,.4,Math.atan2(- (b[1]-a[1]),b[0]-a[0]),y0,y1);
    }
    P.cap(M,ringFromFlat(poly.o),y1,true,4,(poly.h||[]).map(ringFromFlat));
  }
}
class Repeat {
  constructor(){this.groups=new Map();this.tris=0;}
  box(mat,x,y,z,w,h,d,rot=0,far=500){const key=mat.uuid+'/'+far;let row=this.groups.get(key);if(!row){row={mat,far,mats:[]};this.groups.set(key,row);}const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rot),new THREE.Vector3(w,h,d));row.mats.push(m);this.tris+=12;}
  flush(root){const geo=new THREE.BoxGeometry(1,1,1);for(const row of this.groups.values()){const mesh=new THREE.InstancedMesh(geo,row.mat,row.mats.length);row.mats.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.name='finlyandsky-repeated-facade';mesh.userData.buildingFacade=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.computeBoundingBox();root.add(mesh);registerLOD(mesh,row.far);}}
}
function trimAlong(R,mat,e,y,h,depth=.12,far=700){R.box(mat,(e.a[0]+e.b[0])/2+e.nx*.08,y,(e.a[1]+e.b[1])/2+e.nz*.08,e.len,h,depth,e.rot,far);}
function gable(P,M,x,z,length,width,eave,ridge,rot){
  P.push(x,0,z,rot);
  // A roof is a closed, shallow solid. A single-sided plane leaves a sky slit
  // when its eave overhang is seen from a foot-level camera.
  for(const side of[-1,1]){
    const a=[-length/2,eave,side*width/2],b=[length/2,eave,side*width/2],c=[length/2,ridge,0],d=[-length/2,ridge,0];
    if(side>0)P.quad(M,a,b,c,d,[0,1,side]);
    else P.quad(M,b,a,d,c,[0,1,side]);
    P.quad(M,[-length/2,eave-.18,side*width/2],[length/2,eave-.18,side*width/2],[length/2,ridge-.18,0],[-length/2,ridge-.18,0],[0,-1,-side]);
    P.quad(M,[-length/2,eave-.18,side*width/2],[length/2,eave-.18,side*width/2],[length/2,eave,side*width/2],[-length/2,eave,side*width/2],[0,0,side]);
  }
  for(const side of[-1,1])P.fan(M,[[side*length/2,eave,-width/2],[side*length/2,eave,width/2],[side*length/2,ridge,0]],[side,0,0]);
  P.pop();
}
function kresty(ctx,root,M,svc){
  const records=L.groupMembers('finlyandsky-kresty');if(!records.length)return;
  const P=new Parts(),D=new Parts(),R=new Repeat();
  const main=records.find(b=>b.id==='r17026343'),chapel=records.find(b=>b.id==='r17026341');
  // The complete 5-storey parent includes both cruciform cell blocks. Its
  // partial lower-rise parts are already inside that footprint, not duplicate shells.
  for(const rec of records.filter(b=>!b.part&&!b.skip)){
    const isMain=rec===main,h=isMain?18.7:rec.id==='w60557313'?7.5:rec.id==='r17026344'?12.4:rec.id==='r17026337'?12.0:rec.id==='r17026338'?6.3:9.7;
    shell(P,M.brick,rec,0,h,ctx);
    for(const poly of rec.polys)for(const e of edges(poly)){
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
    // Surveyed centres and the common 10.7-degree wing axis. Each cross has
    // four long pitched arms and a raised circular observation drum.
    for(const [x,z]of[[665.5,-2380.0],[793.9,-2366.3]]){
      gable(P,M.roof,x,z,96,15.2,18.76,22.2,ROT);
      gable(P,M.roof,x,z,105,14.0,18.8,22.35,ROT+Math.PI/2);
      P.col(M.brick,x,z,18.7,25.1,7.1,7.1,16);
      P.col(M.lightBrick,x,z,24.7,25.25,7.45,7.45,16);
      dome(P,M.roof,x,z,25.25,7.55,4.1);
      for(let i=0;i<12;i++){const a=i*Math.PI/6,nx=Math.sin(a),nz=Math.cos(a);D.push(x+nx*7.14,0,z+nz*7.14,a);D.face(M.lightBrick,arch(1.7,2.55,21.05),0);D.face(M.window,arch(1.25,2.35,21.22),.06);D.pop();}
    }
  }
  if(chapel){
    // The roof church rises above the common block, so no coplanar duplicate
    // wall is drawn at lower stories. Five domes have distinct broad profiles.
    shell(P,M.brick,chapel,18.75,28.5,ctx,false);
    const x=713.6,z=-2336.3;gable(P,M.roof,x,z,46,27,28.56,33.8,ROT);
    for(const side of[-1,1]){
      const xx=x+Math.sin(ROT)*side*13.8,zz=z+Math.cos(ROT)*side*13.8;
      D.push(xx,0,zz,ROT+(side<0?Math.PI:0));
      const ped=pointed(13,22.2,10.5);D.face(M.lightBrick,ped,0);D.face(M.brick,pointed(11.5,22.6,9.1),.06);
      D.face(M.darkBrick,arch(6.4,6.8,20.9),.12);D.face(M.window,arch(4.8,6.4,21.25),.18);
      D.box(M.lightBrick,-.12,.12,21.4,29.2,.20,.27);D.pop();
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
  shell(P,M.cream,rec,0,16.5,ctx);
  for(const poly of rec.polys)for(const e of edges(poly)){
    trimAlong(R,M.stone,e,.55,.75,.18,900);trimAlong(R,M.white,e,15.9,.65,.30,900);
    if(e.len<9)continue;
    const count=Math.max(1,Math.floor(e.len/5));
    for(let j=0;j<count;j++){
      const t=(j+.5)/count,xx=e.a[0]+(e.b[0]-e.a[0])*t,zz=e.a[1]+(e.b[1]-e.a[1])*t;
      D.push(xx+e.nx*.07,0,zz+e.nz*.07,e.rot);
      D.face(M.white,arch(2.6,7.1,4.3),0);D.face(M.window,arch(2.12,6.9,4.5),.08);
      D.box(M.wood,-.045,.045,4.55,12.4,.12,.17);D.box(M.wood,-1.03,1.03,8.2,8.27,.12,.17);D.box(M.silver,-1.35,1.35,4.15,4.34,0,.38);D.pop();
    }
    for(let i=0;i<Math.floor(e.len/1.1);i++){
      const t=(i+.5)/Math.floor(e.len/1.1),xx=e.a[0]+(e.b[0]-e.a[0])*t,zz=e.a[1]+(e.b[1]-e.a[1])*t;
      D.push(xx+e.nx*.14,0,zz+e.nz*.14,e.rot);D.face(M.white,archRim(.64,.7,14.6,.11),0);D.pop();
    }
  }
  // The projecting rounded apse keeps its exact shallow cap. The pitched nave
  // stops within the straight walls rather than cantilevering over that apse.
  gable(P,M.silver,995.5,-3768.8,25,22.2,16.58,20.1,rot);
  const point=(u,v)=>[x+Math.cos(rot)*u+Math.sin(rot)*v,z-Math.sin(rot)*u+Math.cos(rot)*v];
  // Transverse gable and a real circular rose window are prominent in the
  // southern three-quarter photograph, alongside the tall nave windows.
  const [rx,rz]=point(-7,11.8);D.push(rx,0,rz,rot);
  D.fan(M.white,[[-6,16.5,0],[0,21.2,0],[6,16.5,0]],[0,0,1]);D.fan(M.cream,[[-5.4,16.55,.07],[0,20.65,.07],[5.4,16.55,.07]],[0,0,1]);
  D.cyl(M.white,[0,14,.16],[0,14,.27],2.05,2.05,24);D.cyl(M.window,[0,14,.29],[0,14,.36],1.62,1.62,24);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;D.cyl(M.white,[0,14,.39],[Math.sin(a)*1.52,14+Math.cos(a)*1.52,.39],.055,.055,5);}D.pop();
  const tx=1022.0,tz=-3774.95;
  // Square entrance tower changes into an octagonal clock stage, open bell
  // stage and slender eight-sided spire. No decorative flagpoles are present.
  P.push(tx,0,tz,rot);D.push(tx,0,tz,rot);
  // The mapped lower shell already contains the tower's ground footprint.
  // Start this authored continuation above its roof, avoiding duplicate walls.
  P.box(M.cream,-4.1,4.1,16.55,22.4,-4.1,4.1);P.box(M.white,-4.35,4.35,21.8,22.55,-4.35,4.35);
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
