// National Library, Moskovsky165: the photographed circular entrance is an
// open colonnade around a sky-lit court, with its glazed entrance at the BACK.
// The exact source perimeter and every courtyard hole remain authoritative.
import * as THREE from 'three';
import {ringEdges,onEdge} from '../landmarksD/kit.js';
import {LIBRARY_PLAN as A,LIBRARY_HALL as H,LIBRARY_PIERS,LIBRARY_STEPS,libraryFrontEdge,libraryPortalEdge,libraryMainCourt,libraryPoint} from './library-plan.js';

function flat(P,mat,ring,holes,y,physics,thick=0,up=true){
  const contour=[];for(let i=0;i<ring.length;i+=2)contour.push(new THREE.Vector2(ring[i],ring[i+1]));
  const hh=holes.map(h=>{const r=[];for(let i=0;i<h.length;i+=2)r.push(new THREE.Vector2(h[i],h[i+1]));return r;});
  const pts=[...contour,...hh.flat()];
  for(const t of THREE.ShapeUtils.triangulateShape(contour,hh)){
    const ps=t.map(i=>[pts[i].x,y,pts[i].y]);P.fan(mat,ps,[0,up?1:-1,0]);
    if(physics)physics.addWalkTriangle(ps,thick);
  }
}
function wall(P,mat,e,y0,y1,physics,thick=.5){
  onEdge(P,e,len=>P.box(mat,0,len,y0,y1,-thick,0));
  if(physics)physics.addBox((e.a[0]+e.b[0])/2,(e.a[1]+e.b[1])/2,e.len,thick,Math.atan2(-(e.b[1]-e.a[1]),e.b[0]-e.a[0]),y0,y1);
}
function mappedDrum(P,M,court,frontEdges,ph){
  const inner=[];for(let i=0;i<court.length;i+=2)inner.push({a:[court[i],court[i+1]],b:[court[(i+2)%court.length],court[(i+3)%court.length]]});
  const angle=p=>Math.atan2(p[1]-A.z,p[0]-A.x),cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
  const angles=frontEdges.flatMap(e=>[angle(e.a),angle(e.b)]),lo=Math.min(...angles),hi=Math.max(...angles);
  const cuts=[...new Set([...angles,...inner.map(e=>angle(e.a)).filter(a=>a>lo&&a<hi)])].sort((a,b)=>a-b);
  const hit=(edges,a)=>{
    const d=[Math.cos(a),Math.sin(a)];let best=null;
    for(const e of edges){const v=[e.b[0]-e.a[0],e.b[1]-e.a[1]],p=[e.a[0]-A.x,e.a[1]-A.z],det=cross(d,v);if(Math.abs(det)<1e-9)continue;
      const t=cross(p,v)/det,u=cross(p,d)/det;if(t>0&&u>=-1e-7&&u<=1.0000001&&(!best||t<best.t))best={t,p:[A.x+t*d[0],A.z+t*d[1]]};
    }return best?.p;
  };
  for(let i=0;i+1<cuts.length;i++){
    const a=cuts[i],b=cuts[i+1],ia=hit(inner,a),ib=hit(inner,b),oa=hit(frontEdges,a),ob=hit(frontEdges,b);if(!ia||!ib||!oa||!ob)throw Error('library drum/source arc mismatch');
    const top=[ia,oa,ob,ib].map(p=>[p[0],A.drumTop,p[1]]),bottom=top.map(p=>[p[0],A.columnTop,p[2]]);
    P.quad(M.roof,...top,[0,1,0]);P.quad(M.stone,...bottom.slice().reverse(),[0,-1,0]);
    for(const [u,v,sign]of[[1,2,1],[3,0,-1]])P.quad(M.stone,bottom[u],bottom[v],top[v],top[u],[Math.cos((a+b)/2)*sign,0,Math.sin((a+b)/2)*sign]);
    if(i===0)P.quad(M.stone,bottom[0],bottom[1],top[1],top[0],[Math.sin(a),0,-Math.cos(a)]);
    if(i===cuts.length-2)P.quad(M.stone,bottom[2],bottom[3],top[3],top[2],[-Math.sin(b),0,Math.cos(b)]);
    ph.addWalkTriangle([top[0],top[1],top[2]],A.drumTop-A.columnTop);ph.addWalkTriangle([top[0],top[2],top[3]],A.drumTop-A.columnTop);
  }
}
function arch(P,D,M,u,y,w,h){
  const r=w/2,spring=y+h-r,pts=[[u-r,y,-.18],[u+r,y,-.18],[u+r,spring,-.18]];
  for(let i=1;i<=12;i++){const a=i*Math.PI/12;pts.push([u+r*Math.cos(a),spring+r*Math.sin(a),-.18]);}
  P.fan(M.clear,pts,[0,0,1]);
  // Real arched apertures: stone above the curve and deep reveals around
  // it, rather than opaque stone with a window decal in front of it.
  for(let i=0;i<12;i++){
    const a=i*Math.PI/12,b=(i+1)*Math.PI/12,p=[u+r*Math.cos(a),spring+r*Math.sin(a)],q=[u+r*Math.cos(b),spring+r*Math.sin(b)];
    const cover=[[p[0],p[1],0],[q[0],q[1],0]];
    if(q[1]<y+h-1e-7)cover.push([q[0],y+h,0]);
    if(p[1]<y+h-1e-7)cover.push([p[0],y+h,0]);
    P.fan(M.stone,cover,[0,0,1]);
    P.fan(M.stone,cover.map(p=>[p[0],p[1],-.5]),[0,0,-1]);
    P.quad(M.stone,[p[0],p[1],-.5],[q[0],q[1],-.5],[q[0],q[1],0],[p[0],p[1],0],[-Math.cos((a+b)/2),-Math.sin((a+b)/2),0]);
    D.quad(M.frame,[u+(r-.09)*Math.cos(a),spring+(r-.09)*Math.sin(a),.07],[u+(r-.09)*Math.cos(b),spring+(r-.09)*Math.sin(b),.07],[q[0],q[1],.07],[p[0],p[1],.07],[0,0,1]);
  }
  for(const x of[u-r,u+r])D.box(M.frame,x-.05,x+.05,y,spring,.025,.08);
  D.box(M.frame,u-.045,u+.045,y,y+h-.08,.055,.105);
  for(const yy of[y+.65,y+2.25,spring])D.box(M.frame,u-r,u+r,yy,yy+.07,.055,.105);
}
function glazing(P,D,M,e,{entry=false}={}){
  onEdge(P,e,len=>onEdge(D,e,()=>{
    const n=Math.max(1,Math.round(len/2.25));
    for(const [low,high]of(entry?[[5.5,6.5],[11.1,12.1],[16.45,A.bodyTop]]:[[A.floor,A.floor+.3],[5.44,6.5],[11.1,12.1],[16.45,A.bodyTop]]))P.box(M.stone,0,len,low,high,-.5,0);
    for(let i=0;i<n;i++){
      const u=(i+.5)*len/n,bw=Math.min(1.85,len/n-.24);
      const left=i*len/n,right=(i+1)*len/n;
      P.box(M.stone,left,u-bw/2,entry?5.5:A.floor,A.bodyTop,-.5,0);
      P.box(M.stone,u+bw/2,right,entry?5.5:A.floor,A.bodyTop,-.5,0);
      arch(P,D,M,u,12.1,bw,4.35);
      for(const [y,h]of(entry?[[6.5,4.6]]:[[A.floor+.3,3.7],[6.5,4.6]])){
        // Glazing is centred in the .5m reveal and ends inside the jambs;
        // the pane must not intersect the frame's side faces from the hall.
        P.quad(M.clear,[u-bw/2+.06,y+.04,-.18],[u+bw/2-.06,y+.04,-.18],[u+bw/2-.06,y+h-.04,-.18],[u-bw/2+.06,y+h-.04,-.18],[0,0,1]);
        for(const x of[u-bw/2,u+bw/2])D.box(M.frame,x-.055,x+.055,y,y+h,-.54,.09);
        D.box(M.frame,u-.045,u+.045,y,y+h,.055,.105);
        for(const yy of[y,y+h*.55,y+h])D.box(M.frame,u-bw/2,u+bw/2,yy-.035,yy+.035,.055,.105);
      }
    }
    if(entry)for(const x of[.07,len-.07])P.box(M.stone,x-.07,x+.07,A.floor,5.5,-.5,0);
    for(const y of [5.85,11.45,17.35])D.box(M.stone,0,len,y,y+.28,-.03,.09);
  }));
}
function interiorHall(K,M){
  const {body:P,detail:D,ctx}=K,ph=ctx.physics;
  // This is the actual room BEHIND the curved entrance, not the outdoor
  // circular court. Source light wells remain beyond its side partitions.
  flat(P,M.stone,H.ring,[],H.ceiling,null,0,false);
  for(const e of ringEdges({o:H.ring,h:[]}).filter(e=>e.a[0]===-1902||e.b[0]===-1902)){
    wall(P,M.stone,e,H.floor,H.ceiling,ph,.65);
    onEdge(D,e,len=>{
      for(const y of[H.floor+.1,H.mezzanine-.3,H.mezzanine+2.7,12.0])D.box(M.joint,0,len,y,y+.12,-.68,.04);
    });
  }
  // Close the cut-away facade ends into the surveyed outer skin. Without
  // these substantial returns the circular entrance is only a floating
  // panel, exposing the backs of the library's small cylindrical wells.
  const returns=[[-1840.2,7436.5,-1827.9,7429.2],[-1843.9,7476.3,-1826.5,7482.4]];
  for(const [ax,az,bx,bz]of returns){
    const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),e={a:[ax,az],b:[bx,bz],len,n:[dz/len,-dx/len]};
    wall(P,M.stone,e,H.floor,A.bodyTop,ph,.65);
    onEdge(D,e,()=>{
      for(const y of[5.85,11.45,17.35])D.box(M.joint,0,len,y,y+.22,-.69,.04);
      for(let u=1.2;u<len;u+=2.6)D.box(M.joint,u,u+.04,H.floor+.2,A.bodyTop,-.66,.02);
    });
  }
  // A broad, physically walkable ceremonial stair reaches the upper
  // gallery. Its finite-thickness slab leaves the lower hall accessible.
  const stair={x0:-1888.6,x1:-1876,z0:A.z-3.5,z1:A.z+3.5,steps:28,top:H.mezzanine};
  for(let i=0;i<stair.steps;i++){
    const x1=stair.x1-(stair.x1-stair.x0)*i/stair.steps,x0=stair.x1-(stair.x1-stair.x0)*(i+1)/stair.steps;
    const y=H.floor+(H.mezzanine-H.floor)*(i+1)/stair.steps;
    P.box(M.stone,x0,x1,H.floor,y,stair.z0,stair.z1);
    D.quad(M.joint,[x1-.10,y+.012,stair.z0+.08],[x1-.035,y+.012,stair.z0+.08],[x1-.035,y+.012,stair.z1-.08],[x1-.10,y+.012,stair.z1-.08],[0,1,0]);
    const it=ph.addWalkBox((x0+x1)/2,A.z,x1-x0,7,0,y,H.floor);it.sticky=true;
  }
  const gallery={x0:-1901.35,x1:stair.x0,z0:7440,z1:7474,y:H.mezzanine};
  P.box(M.stone,gallery.x0,gallery.x1,gallery.y-.34,gallery.y,gallery.z0,gallery.z1);
  ph.addWalkBox((gallery.x0+gallery.x1)/2,(gallery.z0+gallery.z1)/2,gallery.x1-gallery.x0,gallery.z1-gallery.z0,0,gallery.y,gallery.y-.34);
  for(const x of[-1898.5,-1874.3])for(const z of[7442.6,7470.0]){
    P.box(M.stone,x-.48,x+.48,H.floor,H.ceiling,z-.48,z+.48);
    P.box(M.joint,x-.65,x+.65,H.ceiling-.55,H.ceiling,z-.65,z+.65);
    P.box(M.granite,x-.52,x+.52,H.floor,H.floor+.6,z-.52,z+.52);
    ph.addBox(x,z,.96,.96,0,H.floor,H.ceiling);
  }
  // Gallery balustrade and sloping handrails are architectural trim; the
  // stair/floor, not an invisible barrier, supports movement throughout.
  const rail=(a,b)=>{
    const n=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/1.8);
    for(let i=0;i<=n;i++){
      const t=i/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,z=a[2]+(b[2]-a[2])*t;
      D.box(M.frame,x-.035,x+.035,y+.04,y+1.05,z-.035,z+.035);
    }
    for(const h of[.55,1.05])D.cyl(M.frame,[a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]],.035,.035,4);
  };
  for(const z of[stair.z0,stair.z1])rail([stair.x1,H.floor,z],[stair.x0,H.mezzanine,z]);
  for(const [z0,z1]of[[gallery.z0,stair.z0],[stair.z1,gallery.z1]])rail([gallery.x1,H.mezzanine,z0],[gallery.x1,H.mezzanine,z1]);
  for(const z of[gallery.z0,gallery.z1])rail([gallery.x0,H.mezzanine,z],[gallery.x1,H.mezzanine,z]);
  // Deep ceiling beams, repeated coffers and warm strips make the volume
  // readable through real glazing, without lights or per-frame callbacks.
  for(const x of[-1896,-1885,-1874]){
    P.box(M.joint,x-.17,x+.17,H.ceiling-.6,H.ceiling,7435.4,7478.3);
    for(const z of[7440,7447.8,7464.8,7472.5])D.box(M.light,x-2.4,x+2.4,H.ceiling-.67,H.ceiling-.62,z-.11,z+.11);
  }
  for(const z of[7446,7467]){
    // Upper reading-room door surrounds give the gallery an architectural
    // destination while preserving the open central stair approach.
    D.box(M.frame,-1901.3,-1901.2,H.mezzanine,H.mezzanine+3.1,z-1.55,z+1.55);
    D.box(M.glass,-1901.19,-1901.15,H.mezzanine+.12,H.mezzanine+2.95,z-1.4,z+1.4);
    D.box(M.stone,-1901.14,-1901.1,H.mezzanine+.12,H.mezzanine+2.95,z-.04,z+.04);
  }
  return {ring:H.ring,floor:H.floor,ceiling:H.ceiling,mezzanine:H.mezzanine,stair,gallery,
    route:[[-1857,A.z],[-1865,A.z],[-1874,A.z],[-1891,A.z],[-1897,A.z]],
    lowerRoute:[[-1865,A.z+7],[-1885,A.z+7],[-1896,A.z+7]]};
}
function title(K,frontEdges){
  const text='РОССИЙСКАЯ НАЦИОНАЛЬНАЯ БИБЛИОТЕКА';
  const map=K.ctx.tex.draw(1024,64,(g,w,h)=>{
    g.clearRect(0,0,w,h);g.fillStyle='#303638';g.font='500 52px "Noto Sans", sans-serif';g.textBaseline='middle';
    // The atlas covers a much wider physical strip than its pixel aspect.
    // Compress glyphs BEFORE mapping, keeping readable physical proportions
    // and the widely spaced monumental lettering in the photographs.
    const squeeze=.32,widths=[...text].map(s=>g.measureText(s).width*squeeze),sum=widths.reduce((s,w)=>s+w,0),gap=(w-160-sum)/(text.length-1);let x=80;
    for(let i=0;i<text.length;i++){g.save();g.translate(x,h/2);g.scale(squeeze,1);g.fillText(text[i],0,0);g.restore();x+=widths[i]+gap;}
  },{key:'mz-library-curved-title-v3'});
  const mat=K.ctx.mat.decal('#ffffff',{map});mat.name='mz-library-curved-title';K.decals.add(mat);
  const edges=frontEdges.slice().sort((a,b)=>(b.a[1]+b.b[1])-(a.a[1]+a.b[1]));
  const total=edges.reduce((sum,e)=>sum+e.len,0);let done=0,segments=0;
  for(const e of edges){
    onEdge(K.detail,e,len=>{for(let i=0;i<4;i++){
      const x0=i*len/4,x1=(i+1)*len/4,u0=(done+x0)/total,u1=(done+x1)/total;
      K.detail.quad(mat,[x0,18.0,.06],[x1,18.0,.06],[x1,19.35,.06],[x0,19.35,.06],[0,0,1],[[u0,0],[u1,0],[u1,1],[u0,1]]);segments++;
    }});done+=e.len;
  }
  return segments;
}

export function library(K,records){
  const {body:P,detail:D,ctx,svc}=K,ph=ctx.physics;
  const M={stone:ctx.mat.toon('#c6c6bc',{paint:.018}),joint:ctx.mat.toon('#b6b9b3',{paint:.015}),
    granite:ctx.mat.toon('#756463',{paint:.03}),roof:K.mats.roof,frame:ctx.mat.toon('#303b3e',{paint:.01}),
    glass:ctx.mat.toon('#42606b',{paint:.015}),clear:ctx.mat.glass({tint:'#42606b',opacity:.2,streaks:false}),light:ctx.mat.emissive('#e7dcb7',.7),dark:K.mats.dark};
  K.decals.add(M.glass);K.decals.add(M.clear);K.decals.add(M.light);K.decals.add(M.joint);
  const main=records.find(r=>r.id==='r1806688');if(!main)return;
  let court=null,frontEdges=[];
  for(const r of records.filter(r=>!r.skip&&!r.part)){
    const isMain=r.id===main.id,h=isMain?A.bodyTop:A.storageTop;
    for(const p of r.polys){
      const bigCourt=isMain?libraryMainCourt(p):[];if(bigCourt.length)court=bigCourt;
      const edges=ringEdges(p),roofHole=p.h;
      flat(P,M.roof,p.o,roofHole,h);
      if(isMain){
        // Whole raised footprint follows the source exactly. Small courtyard
        // wells stay unfilled; the main entrance court has its outdoor floor.
        flat(P,M.granite,p.o,p.h,A.floor,ph,A.floor);
        if(bigCourt.length)flat(P,M.granite,bigCourt,[],A.floor,ph,A.floor);
      }
      for(const e of edges){
        const mx=(e.a[0]+e.b[0])/2,mz=(e.a[1]+e.b[1])/2;
        const front=isMain&&libraryFrontEdge(e),portal=isMain&&libraryPortalEdge(e);
        const courtEdge=isMain&&e.hole&&Math.hypot(mx-A.x,mz-A.z)<22;
        if(isMain&&!e.hole)wall(P,M.granite,e,0,A.floor,null);
        if(front){frontEdges.push(e);continue;}
        if(portal)continue;
        if(courtEdge&&mx>A.x-.5)continue; // sky-lit front opening, never glazing across it
        if(courtEdge){
          const entrance=mx< -1860&&mz>7453&&mz<7461;
          // Physical glass closes the real apertures. The central door bay
          // remains open, allowing entry to the large foyer behind this curve.
          ph.addBox(mx,mz,e.len,.5,Math.atan2(-(e.b[1]-e.a[1]),e.b[0]-e.a[0]),entrance?5.5:A.floor,h);
          glazing(P,D,M,e,{entry:entrance});continue;
        }
        wall(P,M.stone,e,isMain?A.floor:0,h,ph);
        onEdge(D,e,len=>{
          // Rounded wings contain many 1.5–3.7 m source edges. Floor(len/3.8)
          // silently removed every window there, leaving blank curved walls.
          const n=len>.85?Math.max(1,Math.round(len/3.8)):0;
          for(let i=0;i<n;i++)for(let y=isMain?3.0:1.2;y+2.6<h-.5;y+=isMain?4.1:3.8){
            const u=(i+.5)*len/n,half=Math.min(.83,len/n*.5-.18);
            D.quad(M.frame,[u-half,y,.08],[u+half,y,.08],[u+half,y+2.5,.08],[u-half,y+2.5,.08],[0,0,1]);
            D.quad(M.glass,[u-half+.1,y+.1,.09],[u+half-.1,y+.1,.09],[u+half-.1,y+2.4,.09],[u-half+.1,y+2.4,.09],[0,0,1]);
            D.quad(M.stone,[u-.035,y+.1,.14],[u+.035,y+.1,.14],[u+.035,y+2.4,.14],[u-.035,y+2.4,.14],[0,0,1]);
            D.quad(M.stone,[u-half+.1,y+1.65,.14],[u+half-.1,y+1.65,.14],[u+half-.1,y+1.71,.14],[u-half+.1,y+1.71,.14],[0,0,1]);
            // The open portico also exposes the RETURNS of the small light
            // wells. Finish their outward backing as well as the well-facing
            // skin; otherwise this viewpoint sees an entirely blank cylinder.
            {
              const z=-.54;
              D.quad(M.frame,[u-half,y,z],[u+half,y,z],[u+half,y+2.5,z],[u-half,y+2.5,z],[0,0,-1]);
              D.quad(M.glass,[u-half+.1,y+.1,z-.025],[u+half-.1,y+.1,z-.025],[u+half-.1,y+2.4,z-.025],[u-half+.1,y+2.4,z-.025],[0,0,-1]);
              D.quad(M.stone,[u-.035,y+.1,z-.05],[u+.035,y+.1,z-.05],[u+.035,y+2.4,z-.05],[u-.035,y+2.4,z-.05],[0,0,-1]);
            }
          }
        });
      }
    }
    svc.houses.push({id:r.id,name:'Российская национальная библиотека',x:r.cx,z:r.cz,h:r.id===main.id?A.drumTop:h});
  }
  // Exact mapped arc, high open lower bays and continuous clerestory band.
  for(const e of frontEdges){
    onEdge(D,e,len=>{
      D.quad(M.glass,[0,A.clerestoryBottom,.025],[len,A.clerestoryBottom,.025],[len,A.clerestoryTop,.025],[0,A.clerestoryTop,.025],[0,0,1]);
      D.box(M.joint,0,len,A.columnTop,A.columnTop+.16,.015,.08);
      const n=Math.max(1,Math.ceil(len/.85));for(let i=1;i<n;i++)D.box(M.frame,i*len/n-.045,i*len/n+.045,A.clerestoryBottom,A.clerestoryTop,.02,.09);
      for(let y=A.columnTop+.8;y<A.clerestoryBottom;y+=.8)D.box(M.joint,0,len,y,y+.018,.01,.025);
    });
  }
  // Annular soffit leaves the entire measured oculus clear. It is thick
  // architectural construction with an exact walk-triangle underside/top.
  mappedDrum(P,M,court,frontEdges,ph);
  for(const c of LIBRARY_PIERS){
    const rot=-c.angle;
    P.push(c.x,0,c.z,rot);
    P.box(M.stone,-A.columnDepth/2,A.columnDepth/2,A.floor,A.columnTop,-A.columnWidth/2,A.columnWidth/2);
    P.box(M.granite,-A.columnDepth/2-.03,A.columnDepth/2+.03,A.floor,A.floor+1.15,-A.columnWidth/2-.03,A.columnWidth/2+.03);
    D.push(c.x,0,c.z,rot);for(let y=A.floor+1.2;y<A.columnTop;y+=.9)D.box(M.joint,-A.columnDepth/2-.004,A.columnDepth/2+.004,y,y+.012,-A.columnWidth/2-.004,A.columnWidth/2+.004);D.pop();P.pop();
    ph.addBox(c.x,c.z,A.columnDepth,A.columnWidth,rot,A.floor,A.columnTop);
  }
  // Side portal wings: genuinely open rectangular frames, with deeply
  // recessed glazing beyond. Their measured outer ends remain in place.
  for(const [z0,z1,x]of[[7416.1,7427,-1823.2],[7484.5,7495,-1821.3]]){
    const w=z1-z0;
    P.box(M.stone,x-8,x,A.columnTop,22.1,z0,z1);ph.addBox(x-4,(z0+z1)/2,8,w,0,A.columnTop,22.1);
    for(const z of[z0+.58,z1-.58]){P.box(M.stone,x-1.1,x,A.floor,A.columnTop,z-.58,z+.58);ph.addBox(x-.55,z,1.1,1.16,0,A.floor,A.columnTop);}
    const back=x-7.8,low=A.floor,high=A.columnTop,left=z0+1.16,right=z1-1.16;
    D.box(M.frame,back-.1,back,low,high,left,right);
    // Recessed three-storey glazing occupies the rear of the open portal;
    // a lone narrow frame here reads as an unsupported black pole.
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const y0=low+(high-low)*row/3+.1,y1=low+(high-low)*(row+1)/3-.1;
      const a=left+(right-left)*col/3+.09,b=left+(right-left)*(col+1)/3-.09;
      D.quad(M.glass,[back+.025,y0,a],[back+.025,y1,a],[back+.025,y1,b],[back+.025,y0,b],[1,0,0]);
    }
    ph.addBox(back-.05,(left+right)/2,.1,right-left,0,low,high);
  }
  // Granite upper apron outside the surveyed facade. Each patch begins at
  // its exact source edge; it cannot overlap the coplanar footprint floor.
  for(const e of frontEdges){
    let lo=Math.max(Math.min(e.a[1],e.b[1]),A.z-17),hi=Math.min(Math.max(e.a[1],e.b[1]),A.z+17);if(hi<=lo)continue;
    const xAt=z=>e.a[0]+(e.b[0]-e.a[0])*(z-e.a[1])/(e.b[1]-e.a[1]);
    const q=[[xAt(lo),A.floor,lo],[A.stairBack,A.floor,lo],[A.stairBack,A.floor,hi],[xAt(hi),A.floor,hi]];
    P.quad(M.granite,...q,[0,1,0]);ph.addWalkTriangle([q[0],q[1],q[2]],A.floor);ph.addWalkTriangle([q[0],q[2],q[3]],A.floor);
    if(Math.abs(lo-(A.z-17))<1e-7)P.quad(M.granite,q[0],[q[0][0],0,lo],[A.stairBack,0,lo],q[1],[0,0,-1]);
    if(Math.abs(hi-(A.z+17))<1e-7)P.quad(M.granite,q[2],[A.stairBack,0,hi],[q[3][0],0,hi],q[3],[0,0,1]);
  }
  for(const s of LIBRARY_STEPS){
    P.box(M.granite,s.x0,s.x1,0,s.y,s.z0,s.z1);
    const it=ph.addWalkBox((s.x0+s.x1)/2,A.z,s.x1-s.x0,s.z1-s.z0,0,s.y,0);it.sticky=true;
    // Inset tread nosing: the old box shared its vertical face with the
    // granite riser and flickered across the full stair width in depth QA.
    D.quad(M.joint,[s.x1-.10,s.y+.025,s.z0],[s.x1-.04,s.y+.025,s.z0],[s.x1-.04,s.y+.025,s.z1],[s.x1-.10,s.y+.025,s.z1],[0,1,0]);
  }
  // Two granite spheres flank the climb, as in both supplied front photos.
  for(const z of[A.z-18.1,A.z+18.1]){
    P.box(M.granite,-1809.2,-1806.5,.0,1.75,z-1.1,z+1.1);ph.addBox(-1807.85,z,2.7,2.2,0,0,1.75);
    P.geo(M.granite,new THREE.SphereGeometry(.86,16,10),-1807.85,2.61,z);ph.addCylinder(-1807.85,z,.86,1.75,3.47);
  }
  // Coffered soffit and small recessed luminaires between the piers.
  for(let i=0;i<LIBRARY_PIERS.length-1;i++){
    const a=LIBRARY_PIERS[i].angle,b=LIBRARY_PIERS[i+1].angle,mid=(a+b)/2;
    for(const radius of[22.5,25.4,28.1]){
      const p=libraryPoint(radius,mid,A.columnTop-.035);D.push(...p,Math.PI/2-mid);
      D.box(M.joint,-1.65,1.65,-.04,0,-.8,.8);D.box(M.stone,-1.5,1.5,-.02,.025,-.65,.65);
      D.col(M.light,0,0,-.075,-.025,.11,.11,8);D.pop();
    }
  }
  const hall=interiorHall(K,M);
  K.label('mz-library-entrance','ВХОД · ЧИТАЛЬНЫЕ ЗАЛЫ',-1861.65,5.25,A.z,3.5,.42,Math.PI/2,{bg:'transparent',fg:'#30383a'});
  const titleSegments=title(K,frontEdges);
  svc.entrances.push({id:'mz-library',x:-1861.3,y:A.floor,z:A.z,rotY:Math.PI/2,name:'Российская национальная библиотека'});
  svc.photoSpots.push({name:'Российская национальная библиотека',x:-1760,z:A.z,yaw:90,pitch:12});
  svc.library={floor:A.floor,piers:LIBRARY_PIERS,stairs:LIBRARY_STEPS,court,frontEdges,updates:0,titleSegments,oculus:true,hall};
}
