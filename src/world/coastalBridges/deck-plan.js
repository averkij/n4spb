// Shared coastal deck geometry. Adjacent ways use the same bounded miter
// cross-section; acute forks use a bevel confined to their endpoint envelope.
// Every returned planar triangle is both the drawn face and a physical ramp.
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const area=p=>{if(!p.length)return 0;const x=p[0][0],z=p[0][2];let a=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];a+=(p[i][0]-x)*(q[2]-z)-(q[0]-x)*(p[i][2]-z);}return a/2;};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function intersection(a,u,b,v){const d=cross(u,v);if(Math.abs(d)<1e-8)return null;const t=cross([b[0]-a[0],b[1]-a[1]],v)/d;return[a[0]+u[0]*t,a[1]+u[1]*t];}
function hull(points){
  const ps=points.slice().sort((a,b)=>a[0]-b[0]||a[2]-b[2]),turn=(a,b,c)=>(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);
  const lo=[],hi=[];for(const p of ps){while(lo.length>1&&turn(lo.at(-2),lo.at(-1),p)<=1e-9)lo.pop();lo.push(p);}
  for(const p of ps.slice().reverse()){while(hi.length>1&&turn(hi.at(-2),hi.at(-1),p)<=1e-9)hi.pop();hi.push(p);}
  return lo.slice(0,-1).concat(hi.slice(0,-1));
}
function halfClip(poly,a,b,inside){
  const out=[],d=p=>(b[0]-a[0])*(p[2]-a[2])-(b[2]-a[2])*(p[0]-a[0]);
  for(let i=0;i<poly.length;i++){
    const p=poly[i],q=poly[(i+1)%poly.length],dp=d(p),dq=d(q),pi=inside?dp>=-1e-9:dp<=1e-9,qi=inside?dq>=-1e-9:dq<=1e-9;
    if(pi)out.push(p);if(pi!==qi&&Math.abs(dp-dq)>1e-12)out.push(mix(p,q,dp/(dp-dq)));
  }
  return out;
}
// Non-overlapping convex pieces of subject minus one convex clipping face.
function subtract(subject,clip){
  let rest=subject;const pieces=[];
  if(area(clip)<0)clip=clip.slice().reverse();
  let overlap=subject;for(let i=0;i<clip.length&&overlap.length>=3;i++)overlap=halfClip(overlap,clip[i],clip[(i+1)%clip.length],true);
  if(overlap.length<3||Math.abs(area(overlap))<1e-6)return[subject];
  for(let i=0;i<clip.length&&rest.length>=3;i++){
    const a=clip[i],b=clip[(i+1)%clip.length],outside=halfClip(rest,a,b,false);
    if(outside.length>=3&&Math.abs(area(outside))>1e-6)pieces.push(outside);
    rest=halfClip(rest,a,b,true);
  }
  return pieces;
}
export function triangleHeight(p,x,z){
  const[a,b,c]=p,dx=b[0]-a[0],dz=b[2]-a[2],ex=c[0]-a[0],ez=c[2]-a[2],det=dx*ez-ex*dz;
  if(Math.abs(det)<1e-10)return null;
  const u=((x-a[0])*ez-(z-a[2])*ex)/det,v=(dx*(z-a[2])-dz*(x-a[0]))/det;
  return a[1]+(b[1]-a[1])*u+(c[1]-a[1])*v;
}
export function deckAtTriangles(triangles,x,z,ref=Infinity){
  let top=null;
  for(const face of triangles){
    const p=face.points||face;let sign=0,inside=true;
    for(let i=0;i<3;i++){const a=p[i],b=p[(i+1)%3],dx=b[0]-a[0],dz=b[2]-a[2],d=dx*(z-a[2])-dz*(x-a[0]);
      if(Math.abs(d)<1e-7*Math.hypot(dx,dz))continue;const s=Math.sign(d);if(sign&&sign!==s){inside=false;break;}sign=s;}
    if(!inside)continue;const y=triangleHeight(p,x,z);if(y!==null&&y<=ref+1.2)top=top===null?y:Math.max(top,y);
  }
  return top;
}

export function planCoastalDecks(bridges){
  const segments=[],nodes=new Map(),bevels=[];
  for(const b of bridges)for(let i=0;i+3<b.pts.length;i+=2){
    const ax=b.pts[i],az=b.pts[i+1],bx=b.pts[i+2],bz=b.pts[i+3],len=Math.hypot(bx-ax,bz-az);if(len<.1)continue;
    const s={ax,az,bx,bz,len,ya:b.heights[i/2],yb:b.heights[i/2+1],yaw:Math.atan2(bx-ax,bz-az),w:b.w,id:b.id,bridge:b,index:i/2,x:(ax+bx)/2,z:(az+bz)/2};segments.push(s);
    for(const[end,x,z,y,otherX,otherZ,key]of[['a',ax,az,s.ya,bx,bz,b.nodeKeys[i/2]],['b',bx,bz,s.yb,ax,az,b.nodeKeys[i/2+1]]]){
      if(!nodes.has(key))nodes.set(key,{key,x,z,y,edges:[]});const node=nodes.get(key),ux=(otherX-x)/len,uz=(otherZ-z)/len;
      const e={s,end,ux,uz,half:b.w/2,node};node.edges.push(e);
      const right=[x+uz*b.w/2,y,z-ux*b.w/2],left=[x-uz*b.w/2,y,z+ux*b.w/2];
      e.right=right;e.left=left;
    }
  }
  let mitered=0,beveled=0;
  for(const node of nodes.values()){
    const es=node.edges;
    if(es.length===2){
      const[a,b]=es,dot=a.ux*b.ux+a.uz*b.uz,limit=Math.max(a.half,b.half)*3;
      let okay=true;const corners=[];
      for(const side of[-1,1]){
        const A=[node.x+a.uz*a.half*side,node.z-a.ux*a.half*side],B=[node.x-b.uz*b.half*side,node.z+b.ux*b.half*side];
        let p=intersection(A,[a.ux,a.uz],B,[b.ux,b.uz]);
        if(!p&&dot<-.9999){const h=Math.max(a.half,b.half);p=[node.x+a.uz*h*side,node.z-a.ux*h*side];}
        if(!p||Math.hypot(p[0]-node.x,p[1]-node.z)>limit||dot>.85||
          Math.abs((p[0]-node.x)*a.ux+(p[1]-node.z)*a.uz)>a.s.len*.4||
          Math.abs((p[0]-node.x)*b.ux+(p[1]-node.z)*b.uz)>b.s.len*.4){okay=false;break;}
        corners.push([p[0],node.y,p[1]]);
      }
      if(okay){a.left=corners[0];a.right=corners[1];b.right=corners[0];b.left=corners[1];mitered++;}
      else{bevels.push(node);beveled++;}
    }else if(es.length>2){bevels.push(node);beveled++;}
    for(const e of es){
      // Reversing an edge swaps its two side labels in the span frame.
      const cap=e.end==='a'?{left:e.left,right:e.right}:{left:e.right,right:e.left};e.s[e.end]=cap;
    }
  }
  const raw=[];
  for(const s of segments){
    const pts=[s.a.left,s.a.right,s.b.right,s.b.left].map(p=>[p[0],p[1]+.025,p[2]]);
    for(const p of[[pts[0],pts[1],pts[2]],[pts[0],pts[2],pts[3]]])if(Math.abs(area(p))>1e-8)raw.push({points:p,segment:s,b:s.bridge,depth:s.bridge.depth});
  }
  // Bevel/fork patches fill ONLY the missing endpoint wedges. Their footprint
  // never exceeds the convex envelope of the real endpoint cross-sections.
  for(const node of bevels){
    const outline=hull(node.edges.flatMap(e=>[e.left,e.right]).map(p=>[p[0],node.y+.025,p[2]]));
    if(outline.length<3)continue;
    let pieces=[outline];
    const nearby=raw.filter(f=>f.points.some(p=>Math.hypot(p[0]-node.x,p[2]-node.z)<30));
    for(const face of nearby)pieces=pieces.flatMap(p=>subtract(p,face.points));
    for(const p of pieces)for(let i=1;i+1<p.length;i++)raw.push({points:[p[0],p[i],p[i+1]],segment:null,b:node.edges[0].s.bridge,depth:Math.max(...node.edges.map(e=>e.s.bridge.depth)),joint:node.key});
  }
  // Joined flat fork arms can overlap by design. Remove their duplicate faces
  // exactly, instead of lifting one asphalt layer and inventing height steps.
  const triangles=[],grid=new Map(),size=32;
  const keys=p=>{const xs=p.map(v=>v[0]),zs=p.map(v=>v[2]),out=[];for(let x=Math.floor(Math.min(...xs)/size);x<=Math.floor(Math.max(...xs)/size);x++)for(let z=Math.floor(Math.min(...zs)/size);z<=Math.floor(Math.max(...zs)/size);z++)out.push(x+','+z);return out;};
  for(const face of raw){
    let pieces=[face.points];const ks=keys(face.points),near=new Set(ks.flatMap(k=>grid.get(k)||[]));
    for(const previous of near){
      if(face.points.every(p=>Math.abs(triangleHeight(previous.points,p[0],p[2])-p[1])<1e-6))pieces=pieces.flatMap(p=>subtract(p,previous.points));
      if(!pieces.length)break;
    }
    for(const p of pieces)for(let i=1;i+1<p.length;i++){
      const points=[p[0],p[i],p[i+1]];if(Math.abs(area(points))<1e-8)continue;
      // The renderer uploads Float32 positions. A clipped remnant that is
      // collinear there must not survive as an invisible physical floor.
      if(area(points.map(p=>[Math.fround(p[0]),Math.fround(p[1]),Math.fround(p[2])]))===0)continue;
      const f={...face,points};triangles.push(f);for(const k of keys(points)){if(!grid.has(k))grid.set(k,[]);grid.get(k).push(f);}
    }
  }
  return{segments,triangles,nodes,mitered,beveled};
}
