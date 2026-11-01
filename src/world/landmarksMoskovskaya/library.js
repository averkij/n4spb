// National Library, Moskovsky165: the photographed circular entrance is an
// open colonnade around a sky-lit court, with its glazed entrance at the BACK.
// The exact source perimeter and every courtyard hole remain authoritative.
import * as THREE from 'three';
import {ringEdges,onEdge} from '../landmarksD/kit.js';
import {LIBRARY_PLAN as A,LIBRARY_PIERS,LIBRARY_STEPS,libraryFrontEdge,libraryPortalEdge,libraryMainCourt,libraryPoint} from './library-plan.js';

function flat(P,mat,ring,holes,y,physics,thick=0){
  const contour=[];for(let i=0;i<ring.length;i+=2)contour.push(new THREE.Vector2(ring[i],ring[i+1]));
  const hh=holes.map(h=>{const r=[];for(let i=0;i<h.length;i+=2)r.push(new THREE.Vector2(h[i],h[i+1]));return r;});
  const pts=[...contour,...hh.flat()];
  for(const t of THREE.ShapeUtils.triangulateShape(contour,hh)){
    const ps=t.map(i=>[pts[i].x,y,pts[i].y]);P.fan(mat,ps,[0,1,0]);
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
function arch(P,M,u,y,w,h){
  const shape=(inset,depth,mat)=>{
    const r=w/2-inset,base=y+inset,spring=y+h-w/2;
    const pts=[[u-r,base,depth],[u+r,base,depth],[u+r,spring,depth]];
    for(let i=1;i<=12;i++){const a=i*Math.PI/12;pts.push([u+r*Math.cos(a),spring+r*Math.sin(a),depth]);}
    P.fan(mat,pts,[0,0,1]);
  };
  shape(0,.035,M.stone);shape(.14,.06,M.glass);
  P.box(M.frame,u-.045,u+.045,y+.15,y+h-.18,.07,.11);
  for(const yy of [y+.65,y+2.25,y+h-w/2])P.box(M.frame,u-w/2+.15,u+w/2-.15,yy,yy+.07,.07,.11);
}
function glazing(D,M,e,{entry=false}={}){
  onEdge(D,e,len=>{
    const n=Math.max(1,Math.round(len/2.25));
    // Upper arched windows are real curved silhouettes, above the two tall
    // rectangular glazed storeys seen through the open outer colonnade.
    for(let i=0;i<n;i++){
      const u=(i+.5)*len/n,bw=Math.min(1.85,len/n-.24);
      arch(D,M,u,12.1,bw,4.35);
      for(const [y,h]of(entry?[[6.5,4.6]]:[[A.floor+.3,3.7],[6.5,4.6]])){
        D.box(M.frame,u-bw/2-.09,u+bw/2+.09,y-.12,y+h+.12,.025,.1);
        D.quad(M.glass,[u-bw/2,y,.12],[u+bw/2,y,.12],[u+bw/2,y+h,.12],[u-bw/2,y+h,.12],[0,0,1]);
        D.box(M.frame,u-.045,u+.045,y,y+h,.13,.17);
        D.box(M.frame,u-bw/2,u+bw/2,y+h*.55,y+h*.55+.08,.13,.17);
        // Warm interior ceiling strips remain static geometry behind the
        // photographic reflections; there are no per-pane lights/callbacks.
        if(i%2===0)D.box(M.light,u-bw*.34,u+bw*.34,y+h-.55,y+h-.50,.135,.15);
      }
    }
    for(const y of [5.85,11.45,17.35])D.box(M.stone,0,len,y,y+.28,-.03,.09);
  });
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
    glass:ctx.mat.toon('#42606b',{paint:.015}),light:ctx.mat.emissive('#e7dcb7',.7),dark:K.mats.dark};
  K.decals.add(M.glass);K.decals.add(M.light);K.decals.add(M.joint);
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
          if(entrance){
            // The opening leads to a short lit vestibule, not a painted door
            // on an impassable full-footprint wall.
            wall(P,M.stone,e,5.5,h,ph);
          }else wall(P,M.stone,e,A.floor,h,ph);
          glazing(D,M,e,{entry:entrance});continue;
        }
        wall(P,M.stone,e,isMain?A.floor:0,h,ph);
        onEdge(D,e,len=>{
          const n=len>2.4?Math.floor(len/3.8):0;
          for(let i=0;i<n;i++)for(let y=isMain?3.0:1.2;y+2.6<h-.5;y+=isMain?4.1:3.8){
            const u=(i+.5)*len/n;
            D.box(M.frame,u-.83,u+.83,y,y+2.5,.025,.08);
            D.quad(M.glass,[u-.73,y+.1,.09],[u+.73,y+.1,.09],[u+.73,y+2.4,.09],[u-.73,y+2.4,.09],[0,0,1]);
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
    D.box(M.joint,s.x1-.035,s.x1,s.y-.025,s.y+.008,s.z0,s.z1);
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
  // A modest accessible vestibule beyond the actual rear entrance opening.
  P.box(M.granite,-1870,-1861.1,A.floor-.2,A.floor,A.z-2.5,A.z+2.5);ph.addWalkBox(-1865.55,A.z,8.9,5,0,A.floor,.0);
  P.box(M.stone,-1870.3,-1870,A.floor,5.6,A.z-2.5,A.z+2.5);ph.addBox(-1870.15,A.z,.3,5,0,A.floor,5.6);
  for(const z of[A.z-2.5,A.z+2.5]){P.box(M.stone,-1870,-1861.4,A.floor,5.6,z-.15,z+.15);ph.addBox(-1865.7,z,8.6,.3,0,A.floor,5.6);}
  P.box(M.stone,-1870,-1861.4,5.6,5.9,A.z-2.5,A.z+2.5);ph.addWalkBox(-1865.7,A.z,8.6,5,0,5.9,5.6);
  D.box(M.light,-1868,-1863,5.52,5.56,A.z-.12,A.z+.12);
  for(const z of[A.z-2.23,A.z+2.23]){
    D.box(M.frame,-1864.1,-1861.9,A.floor+.08,4.7,z-.045,z+.045);
    D.box(M.glass,-1864,-1862,A.floor+.2,4.55,z-.052,z+.052);
    ph.addBox(-1863,z,2.2,.11,0,A.floor,4.7);
  }
  K.label('mz-library-entrance','ВХОД · ЧИТАЛЬНЫЕ ЗАЛЫ',-1861.65,5.25,A.z,3.5,.42,Math.PI/2,{bg:'transparent',fg:'#30383a'});
  const titleSegments=title(K,frontEdges);
  svc.entrances.push({id:'mz-library',x:-1861.3,y:A.floor,z:A.z,rotY:Math.PI/2,name:'Российская национальная библиотека'});
  svc.photoSpots.push({name:'Российская национальная библиотека',x:-1760,z:A.z,yaw:90,pitch:12});
  svc.library={floor:A.floor,piers:LIBRARY_PIERS,stairs:LIBRARY_STEPS,court,frontEdges,updates:0,titleSegments,oculus:true};
}
