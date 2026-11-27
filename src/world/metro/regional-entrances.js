import * as THREE from 'three';
import { Parts } from '../landmarksD/kit.js';
import { registerLOD } from '../../core/spatial.js';
import { ringFromFlat } from '../lib/massing.js';
import { addPavilionEntrance, entrancePoint } from '../lib/metro-pavilion-entrance.js';
import { sculptureGeometry } from '../lib/sculpture-geometry.js';
import { architecture } from './regional-architecture-mesh.js';
import { regionalMetroSites, regionalBuildings, outlineEdges, portalSpan } from './regional-sites.js';

function sculpt(P,role,key,x,y,z,w,h,depth){
  P.geo(role,sculptureGeometry(architecture[key]),x,y,z,0,0,0,w,h,depth);
}
function finish(ctx,P,origin,rotY,name,range){
  const pos=[],norm=[],rgb=[],idx=[];
  for(const [css,b] of P.b){
    const offset=pos.length/3,c=new THREE.Color(css);
    for(let i=0;i<b.n;i++)rgb.push(c.r,c.g,c.b);
    for(const n of b.pos)pos.push(n);
    for(const n of b.nrm)norm.push(n);
    for(const n of b.idx)idx.push(n+offset);
  }
  const g=new THREE.BufferGeometry();
  for(const [key,arr] of [['position',pos],['normal',norm],['color',rgb]])g.setAttribute(key,new THREE.Float32BufferAttribute(arr,3));
  g.setIndex(idx);g.computeBoundingSphere();
  const mesh=new THREE.Mesh(g,ctx.mat.toon('#ffffff',{vertexColors:true,name:'metro-architectural-stone-glass'}));
  mesh.position.set(origin.x,0,origin.z);mesh.rotation.y=rotY;mesh.name=name;
  mesh.receiveShadow=true;mesh.castShadow=true;ctx.addStatic(mesh);
  mesh.updateWorldMatrix(true,false);registerLOD(mesh,range);
}

// Staraya Derevnya has an open street arcade across the full northern face.
// Each arch has a soffit and a sheltered gallery behind its masonry piers.
function openArcade(ctx,P,e,b,p,height){
  const bays=4, span=e.len/bays,hw=span/2-.53,spring=2.10,rise=height-spring-.52;
  const yaw=Math.atan2(e.nx,e.nz);
  for(let i=0;i<bays;i++){
    const t=(i+.5)*span,x=e.a[0]+t*e.dx,z=e.a[1]+t*e.dz;
    P.push(x-b.cx,0,z-b.cz,yaw);
    for(let j=0;j<20;j++){
      const a=Math.PI*j/20,c=Math.PI*(j+1)/20;
      const left=[hw*Math.cos(a),spring+rise*Math.sin(a)],right=[hw*Math.cos(c),spring+rise*Math.sin(c)];
      P.quad(p.stone,[...left,0],[...right,0],[right[0],height,0],[left[0],height,0],[0,0,1]);
      P.quad('#b2a693',[...right,0],[...left,0],[...left,-1.02],[...right,-1.02]);
    }
    for(const s of [-1,1]){
      const u=s*(span/2-.265);
      P.box(p.stone,u-.265,u+.265,.04,height,-1.02,.04);
      P.box('#a59f97',u-.29,u+.29,.02,.49,-1.05,.08);
      const point=entrancePoint({x,z,rotY:yaw},u,-.5);
      ctx.physics.addBox(point.x,point.z,.53,1.03,yaw,0,height);
    }
    sculpt(P,'#ddd1b8','voussoirs',0,spring,.015,hw,rise,.62);
    P.box('#938d82',-span/2,span/2,-.04,.11,-4.32,.29);
    P.box('#cec4b1',-span/2,span/2,height-.21,height,-4.3,.02);
    P.box('#58696d',-span/2,span/2,0,height,-4.38,-4.25);
    for(let k=-2;k<=2;k++)P.box('#877f6f',k*span/5-.045,k*span/5+.045,.17,height-.25,-4.25,-4.15);
    const point=entrancePoint({x,z,rotY:yaw},0,-4.32);
    ctx.physics.addBox(point.x,point.z,span,.14,yaw,0,height);
    const floor=entrancePoint({x,z,rotY:yaw},0,-2.0);
    ctx.physics.addWalkBox(floor.x,floor.z,span,4.58,yaw,.11,-.04);
    P.pop();
  }
}

function goldGallery(ctx,P,b,doors){
  const [a,c]=doors,rotY=a.rotY,cs=Math.cos(rotY),sn=Math.sin(rotY);
  const x=(a.x+c.x)/2,z=(a.z+c.z)/2,width=Math.abs((a.x-c.x)*cs-(a.z-c.z)*sn)+a.w+5.8;
  const d={x,z,rotY,w:width,inset:Math.max(a.inset,c.inset)+.35},hw=width/2,top=5.5;
  P.push(x-b.cx,0,z-b.cz,rotY);
  P.box('#9e8770',-hw,hw,.025,.115,-.16,d.inset+.15);
  P.box('#aa875b',-hw,hw,top,top+.18,-.21,d.inset+.34);
  const spans=doors.map(s=>{
    const u=(s.x-x)*cs-(s.z-z)*sn;
    return [u-s.w/2-.19,u+s.w/2+.19];
  }).sort((m,n)=>m[0]-n[0]);
  let left=-hw;
  for(const [right,next] of [...spans,[hw,hw]]){
    if(right>left){
      P.box('#697676',left,right,.12,top,-.30,-.18);
      for(let u=left+.08;u<right;u+=1.18)P.box('#8e7759',u-.035,u+.035,.15,top,-.18,-.10);
      const pt=entrancePoint(d,(left+right)/2,-.23);
      ctx.physics.addBox(pt.x,pt.z,right-left,.13,rotY,.12,top);
    }
    left=next;
  }
  for(const side of [-1,1]){
    const u=side*hw, pt=entrancePoint(d,u,d.inset/2);
    P.box('#957957',u-.09,u+.09,.115,top,0,d.inset);
    ctx.physics.addBox(pt.x,pt.z,.18,d.inset,rotY,.115,top);
  }
  for(let u=-hw+.5;u<hw;u+=1.6){
    P.cyl('#d6ac69',[u,top-.035,.03],[Math.min(hw,u+2.45),top-.035,d.inset],.055,.055,7);
    P.cyl('#c09a64',[u,top-.06,d.inset*.39],[Math.max(-hw,u-.72),top-.06,d.inset*.91],.041,.027,7);
  }
  const floor=entrancePoint(d,0,d.inset/2);
  ctx.physics.addWalkBox(floor.x,floor.z,width,d.inset+.32,rotY,.115,.012);
  P.pop();return {...d,aperture:top};
}

function buildShell(ctx,b,doors){
  const p=doors[0].profile, height=p.shell, P=new Parts(), origin={x:b.cx,z:b.cz};
  const canopy=p.kind==='skillion',front=doors[0];
  const rearAt=(x,z)=>(front.x-x)*Math.sin(front.rotY)+(front.z-z)*Math.cos(front.rotY);
  const run=Math.max(1,...b.polys.flatMap(poly=>ringFromFlat(poly.o).map(([x,z])=>rearAt(x,z))));
  const roofY=(x,z)=>canopy?height-5.15*Math.max(0,Math.min(1,rearAt(x,z)/run)):height;
  const glass='#647f87',mullion='#9ba8a8';
  const gold=p.kind==='gold' && doors.length===2?goldGallery(ctx,P,b,doors):null;
  for(const poly of b.polys){
    const ring=ringFromFlat(poly.o);
    const local=r=>r.map(([x,z])=>[x-b.cx,z-b.cz]);
    if(canopy){
      const roof=ring.map(([x,z])=>[x-b.cx,roofY(x,z),z-b.cz]);
      P.fan(p.trim,roof,[0,1,0]);
    }else{
      P.cap(p.trim,local(ring),height,true,4,poly.h.map(h=>local(ringFromFlat(h))));
    }
    for(const e of outlineEdges(poly.o)){
      if(p.kind==='arcade' && e.nz<-.9 && e.len>35){
        openArcade(ctx,P,e,b,p,height);continue;
      }
      const cuts=(gold?[gold]:doors).map(d=>({span:portalSpan(e,d,.16),top:d.aperture || d.y+d.h+.115})).filter(c=>c.span);
      const stops=[...new Set([0,e.len,...cuts.flatMap(c=>c.span)])].sort((a,b)=>a-b);
      const at=(t,y)=>[e.a[0]+t*e.dx-b.cx,y,e.a[1]+t*e.dz-b.cz];
      const roofAt=t=>roofY(e.a[0]+t*e.dx,e.a[1]+t*e.dz);
      const face=(color,a,b,lo,hi,topEnd=hi,lowEnd=lo)=>{
        if(b-a<.01 || (hi<=lo+.001 && topEnd<=lowEnd+.001))return;
        P.quad(color,at(a,lo),at(b,lowEnd),at(b,topEnd),at(a,hi),[e.nx,0,e.nz]);
      };
      const yaw=Math.atan2(e.nx,e.nz);
      const mid=at(e.len/2,0);
      P.push(mid[0],0,mid[2],yaw);
      if(['ribbon','terrace','rounded','clerestory','ribs'].includes(p.kind)){
        const thick=p.kind==='terrace'?.65:.42, over=p.kind==='ribbon'?1.43:.81;
        P.box(p.trim,-e.len/2,e.len/2,height-.19,height+thick,-.13,over);
        P.box('#9d9e96',-e.len/2,e.len/2,height+thick,height+thick+.07,-.13,over+.04);
      }else if(p.kind==='cupola'){
        sculpt(P,'#d6bd95','cornice',0,height-.12,0,e.len,1.4,1.48);
        for(let u=-e.len/2+.9;u<e.len/2-.3;u+=1.55)
          P.box('#c7b08e',u-.14,u+.14,height-.38,height-.12,.05,.29);
      }else if(p.kind==='folded' && e.len>=13){
        const n=Math.max(2,Math.round(e.len/3.55)), pitch=e.len/n;
        for(let i=0;i<n;i++)sculpt(P,'#aaa9a3','fold',-e.len/2+(i+.5)*pitch,height-.18,-.1,pitch,2.9,2.55);
      }else if(p.kind==='gold'){
        P.box('#b6a38c',-e.len/2,e.len/2,height-.94,height+.22,-.30,.33);
      }
      P.pop();
      for(let i=1;i<stops.length;i++){
        const a=stops[i-1],c=stops[i],center=(a+c)/2,len=c-a;
        const under=Math.max(0,...cuts.filter(k=>center>=k.span[0] && center<=k.span[1]).map(k=>k.top));
        const ha=roofAt(a),hc=roofAt(c),low=Math.min(.54,ha-.4,hc-.4);
        if(!under)face(p.stone,a,c,0,low);
        face(p.glass && !gold?glass:p.stone,a,c,Math.max(low,under),Math.max(under,ha-.33),Math.max(under,hc-.33));
        face(p.trim,a,c,Math.max(under,ha-.33),ha,hc,Math.max(under,hc-.33));
        const pt=at(center,0);
        if(under<Math.max(ha,hc))ctx.physics.addBox(pt[0]+b.cx,pt[2]+b.cz,len,.27,yaw,under,Math.max(ha,hc));
        if(!p.glass || gold || len<.6)continue;
        const count=Math.max(1,Math.round(len/1.65));
        for(let k=0;k<count;k++){
          const t=a+(k+.34)*len/count, pos=at(t,0),h=roofAt(t)-.32;
          if(h<=under+.09)continue;
          P.push(pos[0],0,pos[2],yaw);
          P.box(mullion,-.035,.035,Math.max(low,under),h,-.025,.075);
          P.pop();
        }
        if(canopy && len>3.8 && !under){
          const n=Math.max(1,Math.round(len/4.2));
          for(let k=0;k<n;k++){
            const t0=a+k*len/n,t1=a+(k+1)*len/n;
            const low=at(t0,.62),high=at(t1,roofAt(t1)-.37);
            low[0]+=e.nx*.085;low[2]+=e.nz*.085;high[0]+=e.nx*.085;high[2]+=e.nz*.085;
            P.cyl('#b7c4c3',low,high,.055,.055,7);
          }
        }
        if(ha>3.3 && hc>3.3){
          P.push(pt[0],0,pt[2],yaw);P.box(mullion,-len/2,len/2,Math.max(2.78,under),Math.max(2.78,under)+.055,-.02,.055);P.pop();
        }
      }
    }
  }
  if(p.kind==='cupola'){
    const rad=Math.min(11,Math.sqrt(b.area)*.30);
    P.col(p.stone,0,0,height,height+2.60,rad*.98,rad*.98,40);
    for(let j=0;j<12;j++){
      const a=j*Math.PI/6;
      P.push(Math.sin(a)*rad*.98,height+.45,Math.cos(a)*rad*.98,a);
      P.box('#536b60',-.46,.46,0,1.27,-.05,.045);
      sculpt(P,'#536b60','fan-glass',0,1.27,.01,.46,.52,.9);P.pop();
    }
    sculpt(P,'#748479','dome',0,height+2.60,0,rad,5.7,rad);
    P.col('#65766c',0,0,height+7.54,height+8.28,.28,.13,12);
  }
  finish(ctx,P,origin,0,'metro-pavilion-'+b.id,430);
}

function buildTerrace(ctx,P,d,half){
  const {upper,lower,via}=d.terrace,y=d.y;
  const x=lower.x-upper.x,z=lower.z-upper.z,len=Math.hypot(x,z),vx=x/len,vz=z/len;
  const points=[entrancePoint(d,0,-.14),...via,upper,lower];
  const local=(p,h)=>[(p.x-d.x)*Math.cos(d.rotY)-(p.z-d.z)*Math.sin(d.rotY),h,
    (p.x-d.x)*Math.sin(d.rotY)+(p.z-d.z)*Math.cos(d.rotY)];
  const offsets=points.map((p,i)=>{
    if(i===0)return [Math.cos(d.rotY)*half,-Math.sin(d.rotY)*half];
    if(i===points.length-1 || i===points.length-2)return [vz*half,-vx*half];
    const prev=points[i-1],next=points[i+1],a=Math.hypot(p.x-prev.x,p.z-prev.z),b=Math.hypot(next.x-p.x,next.z-p.z);
    const rx=(p.z-prev.z)/a+(next.z-p.z)/b,rz=-(p.x-prev.x)/a-(next.x-p.x)/b;
    const scale=half/Math.max(.55,rx*(p.z-prev.z)/a-rz*(p.x-prev.x)/a);
    return [rx*scale,rz*scale];
  });
  const edges=points.map((p,i)=>[-1,1].map(s=>({x:p.x+s*offsets[i][0],z:p.z+s*offsets[i][1]})));
  for(let i=1;i<points.length-1;i++){
    const corners=[edges[i-1][0],edges[i-1][1],edges[i][1],edges[i][0]];
    const c=corners.map(pt=>local(pt,y));
    P.quad('#958981',...c,[0,1,0]);
    for(const [a,b] of [[0,3],[1,2]])P.quad('#87796e',c[a],local(corners[a],.02),local(corners[b],.02),c[b]);
    for(const ids of [[0,1,2],[0,2,3]])ctx.physics.addWalkTriangle(ids.map(k=>[corners[k].x,y,corners[k].z]),y);
  }
  const t=len/d.steps,stairYaw=Math.atan2(vx,vz),u=local(upper,0),rail='#666d68';
  P.push(u[0],0,u[2],stairYaw-d.rotY);
  for(let i=0;i<d.steps;i++){
    const h=y-i*.15;
    P.box('#958981',-half,half,.02,h,i*t,(i+1)*t);
    P.box('#b2a496',-half,half,h-.028,h,(i+1)*t-.06,(i+1)*t+.002);
    ctx.physics.addWalkBox(upper.x+vx*(i+.5)*t,upper.z+vz*(i+.5)*t,2*half,t,stairYaw,h,.01);
  }
  for(const s of [-1,1]){
    const side=s*(half-.12);
    for(const [v,h] of [[0,y],[len,.27]])P.col(rail,side,v,h,h+.90,.033,.033,8);
    P.cyl(rail,[side,y+.9,-.12],[side,1.17,len+.12],.044,.044,8);
  }
  P.pop();
}

function buildApron(ctx,P,d,half){
  if(d.terrace){buildTerrace(ctx,P,d,half);return;}
  const {y,steps,rotY}=d,stone='#958981',edge='#aa9f94',rail='#616967';
  const depth=d.id==='n1646568762'?4.5:steps?1.48:.43,tread=.35;
  function slab(lo,hi,top){
    const mid=entrancePoint(d,0,(lo+hi)/2);
    P.box(stone,-half,half,.025,top,lo,hi);
    P.box(edge,-half,half,top-.033,top,hi-.057,hi+.006);
    ctx.physics.addWalkBox(mid.x,mid.z,half*2,hi-lo,rotY,top,.012);
  }
  slab(-.13,depth,y);
  for(let i=1;i<steps;i++)slab(depth+(i-1)*tread,depth+i*tread,y-i*.15);
  if(!steps)return;
  const outer=depth+(steps-1)*tread;
  for(const side of [-1,1]){
    const u=side*(half-.14),endY=y-(steps-1)*.15;
    for(const [v,top] of [[.66,y],[depth,y],[outer,endY]]){
      P.col(rail,u,v,top,top+.88,.031,.031,8);
      const pt=entrancePoint(d,u,v);
      ctx.physics.addBox(pt.x,pt.z,.085,.085,rotY,top,top+.92);
    }
    P.cyl(rail,[u,y+.89,.56],[u,y+.89,depth],.044,.044,10);
    P.cyl(rail,[u,y+.89,depth],[u,endY+.89,outer+.12],.044,.044,10);
    P.cyl(rail,[u,y+.55,depth],[u,endY+.55,outer],.021,.021,8);
  }
}

function buildFacade(ctx,d,siblings){
  const P=new Parts(), p=d.profile, half=d.w/2, y=d.y, top=y+d.h+.11;
  const left='#7c7368',glass='#738c93',silver='#a9b3b0';
  let extent=half+1.38;
  for(const other of siblings){
    if(other===d)continue;
    const dx=other.x-d.x,dz=other.z-d.z;
    const width=Math.abs(dx*Math.cos(d.rotY)-dz*Math.sin(d.rotY));
    if(Math.abs(dx*Math.sin(d.rotY)+dz*Math.cos(d.rotY))<1.1 && width>.1)extent=Math.min(extent,Math.max(half+.18,width*.48));
  }
  buildApron(ctx,P,d,extent);
  if(d.inset>.30 && p.kind!=='gold'){
    const end=d.inset+.08,ceiling=d.aperture;
    P.box(p.stone,-half-.29,-half-.15,y,ceiling,0,end);
    P.box(p.stone,half+.15,half+.29,y,ceiling,0,end);
    P.box(p.kind==='gold'?'#b3905c':p.trim,-half-.29,half+.29,ceiling,ceiling+.10,0,end);
    P.box('#978c7e',-half-.15,half+.15,.014,.095,.38,end);
    const floor=entrancePoint(d,0,(end+.38)/2);
    ctx.physics.addWalkBox(floor.x,floor.z,d.w+.30,end-.38,d.rotY,.095,.012);
    for(const side of [-1,1]){
      const pt=entrancePoint(d,side*(half+.22),end/2);
      ctx.physics.addBox(pt.x,pt.z,.14,end,d.rotY,y,ceiling);
    }
  }
  const historic=['fanlight','cupola','arcade'].includes(p.kind) && (p.kind!=='fanlight' || d.kind==='exit');
  const columnWidth=historic?.45:.22;
  for(const side of [-1,1]){
    const u=side*(half+columnWidth/2+.08);
    P.box(p.stone,u-columnWidth/2,u+columnWidth/2,.07,top+.64,-.20,.30);
    if(historic || p.kind==='rusticated' || p.kind==='cornice'){
      P.box(left,u-columnWidth*.61,u+columnWidth*.61,.05,.33,-.19,.36);
      for(let h=.66;h<top+.44;h+=.48)P.box(p.trim,u-columnWidth*.51,u+columnWidth*.51,h,h+.024,.29,.315);
    }
  }
  if(historic){
    const a=half+.07, h=p.kind==='cupola'?2.25:p.kind==='arcade'?1.82:1.45;
    sculpt(P,glass,'fan-glass',0,top,.33,a,h,1);
    sculpt(P,p.kind==='cupola'?'#445d50':left,'fanlight',0,top,.41,a,h,1);
    sculpt(P,p.stone,'voussoirs',0,top,.32,a,h,1.35);
    P.box(p.trim,-a-.19,a+.19,top-.065,top+.055,.05,.49);
  }else{
    const h=p.kind==='gold'?1.35:p.kind==='clerestory'?.99:.63;
    P.box(glass,-half,half,top,top+h,.06,.16);
    for(let i=0;i<=d.leaves;i++){
      const u=-half+d.w*i/d.leaves;
      P.box(silver,u-.032,u+.032,top,top+h,.145,.225);
    }
    const roof=top+h, over=p.kind==='recess'?.67:p.kind==='gold'?1.92:1.33;
    if(p.kind==='folded'){
      const folds=3,span=2*extent/folds;
      for(let i=0;i<folds;i++)sculpt(P,p.trim,'fold',-extent+(i+.5)*span,roof,.10,span,1.86,2);
    }else if(p.kind==='cornice' || p.kind==='rusticated'){
      sculpt(P,p.stone,'cornice',0,roof,.02,extent*2.12,1.34,1.44);
    }else{
      P.box(p.trim,-extent,extent,roof,roof+.19,-.24,over);
      P.box(p.stone,-extent,extent,roof+.19,roof+.27,-.23,over-.02);
      if(p.kind==='flared')for(const side of [-1,1])sculpt(P,p.stone,'flare',side*(extent-.37),.08,over-.20,1.05,roof-.08,1.05);
      if(p.kind==='gold' || p.kind==='louvres'){
        for(let j=0;j<6;j++)P.box(p.trim,-extent,extent,roof+.33+j*.16,roof+.405+j*.16,-.06,.41);
        if(p.kind==='gold')for(let i=-8;i<=8;i++)P.box('#c6a671',i*extent/9-.032,i*extent/9+.032,roof-.037,roof,.2,over-.10);
      }else if(p.kind==='ribs'){
        for(let i=-7;i<=7;i++)sculpt(P,p.trim,'rib',i*extent/7,roof+.21,.31,1,1.03,.8);
      }else if(p.kind==='faceted'){
        for(const side of [-1,1]){
          const u=side*(extent-.40);
          P.quad(p.stone,[u-.5,roof+.22,.06],[u,roof+.22,.66],[u,roof+1.44,.66],[u-.5,roof+1.44,.06]);
          P.quad(p.trim,[u,roof+.22,.66],[u+.5,roof+.22,.06],[u+.5,roof+1.44,.06],[u,roof+1.44,.66]);
        }
      }
    }
  }
  finish(ctx,P,d,d.rotY,'metro-street-approach-'+d.id,215);
  addPavilionEntrance(ctx,d);
  const exit=d.kind==='exit',word=exit?'Выход':p.name;
  const map=ctx.tex.draw(512,80,(c,w,h)=>{
    c.fillStyle='#ece8df';c.fillRect(0,0,w,h);
    c.fillStyle='#254977';ctx.tex.fitText(c,'М',39,40,54,51,'sans-serif',700);
    c.fillStyle='#29383d';ctx.tex.fitText(c,word,280,40,430,43,'sans-serif',600);
  },{key:'regional-metro-'+(exit?'exit':d.bldg)});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(d.w*.77,3.1),.39),ctx.mat.decal('#ffffff',{map}));
  const pt=entrancePoint(d,0,.51);
  sign.position.set(pt.x,top+.18,pt.z);sign.rotation.y=d.rotY;sign.name='metro-plate-'+d.id;
  ctx.addStatic(sign);sign.updateWorldMatrix(true,false);registerLOD(sign,95);
}
export function buildRegionalMetroEntrances(ctx){
  const grouped=new Map();
  for(const d of regionalMetroSites){
    if(!grouped.has(d.bldg))grouped.set(d.bldg,[]);
    grouped.get(d.bldg).push(d);
  }
  for(const [id,doors] of grouped){
    if(doors[0].profile.kind==='closed'){
      const d=doors[0],P=new Parts();
      P.box('#8b9793',-4.35,4.35,.025,2.55,.11,.29);
      for(let i=-20;i<=20;i++)P.box('#adb4ab',i*.21-.014,i*.21+.014,.035,2.54,.28,.32);
      for(const u of [-4.22,0,4.22])P.box('#697575',u-.041,u+.041,.02,2.62,.27,.36);
      const pad=entrancePoint(d,0,.22);ctx.physics.addBox(pad.x,pad.z,8.7,.23,d.rotY,.02,2.60);
      finish(ctx,P,d,d.rotY,'metro-reconstruction-'+id,145);
      const notice=ctx.tex.draw(512,128,(c,w,h)=>{
        c.fillStyle='#f2eee3';c.fillRect(0,0,w,h);c.fillStyle='#24426a';
        ctx.tex.fitText(c,'М   Фрунзенская',256,41,465,47,'sans-serif',700);
        ctx.tex.fitText(c,'Закрыта на реконструкцию',256,91,466,33,'sans-serif',500);
      },{key:'metro-closed-frunzenskaya'});
      const board=new THREE.Mesh(new THREE.PlaneGeometry(2.64,.66),ctx.mat.decal('#ffffff',{map:notice}));
      const pt=entrancePoint(d,0,.365);board.position.set(pt.x,1.59,pt.z);board.rotation.y=d.rotY;
      ctx.addStatic(board);board.updateWorldMatrix(true,false);registerLOD(board,80);
      continue;
    }
    if(doors[0].profile.shell)buildShell(ctx,regionalBuildings.get(id),doors);
    for(const door of doors)buildFacade(ctx,door,doors);
  }
  ctx.services.regionalMetroEntrances=regionalMetroSites;
}
