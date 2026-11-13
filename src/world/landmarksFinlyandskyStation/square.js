// Lenin Square's deliberate red/grey paving and fountain lawn panels. The
// owner's aerial reference controls the pattern; the surveyed road and basin
// rings control its edges. Generic fountains remain the sole live-water owner.
import { GREEN, WATER } from '../data/city.js';
import { Parts } from '../landmarksD/kit.js';
import { ccw, triangulateRing, subtractConvex, boxOfPoly } from '../environment/clip.js';
import { registerLOD } from '../../core/spatial.js';
import { SQUARE_OUTLINE, LAWN_IDS, SMALL_BASIN } from './square-layout.js';

const pairs=r=>Array.from({length:r.length/2},(_,i)=>r.slice(i*2,i*2+2));
const rect=(u0,u1,v0,v1)=>[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
const intersects=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];
const contains=(ring,x,z)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++)if((ring[i][1]>z)!==(ring[j][1]>z)&&x<(ring[j][0]-ring[i][0])*(z-ring[i][1])/(ring[j][1]-ring[i][1])+ring[i][0])yes=!yes;return yes;};
function pavingTexture(ctx,key,colour){
  return ctx.tex.draw(256,256,g=>{
    g.fillStyle=colour;g.fillRect(0,0,256,256);
    // Quiet slab joints; no random grass, asphalt or red blotches. One tile
    // spans four metres, so joints remain a restrained architectural texture.
    for(let y=0;y<4;y++)for(let x=0;x<4;x++){
      const f=((x*7+y*3)%5-2)*.008;g.fillStyle=`rgba(${f<0?'0,0,0':'255,255,255'},${Math.abs(f)})`;g.fillRect(x*64,y*64,64,64);
    }
    g.strokeStyle='rgba(67,64,60,.23)';g.lineWidth=1;
    for(let a=0;a<=256;a+=64){g.beginPath();g.moveTo(a,0);g.lineTo(a,256);g.stroke();g.beginPath();g.moveTo(0,a);g.lineTo(256,a);g.stroke();}
  },{key,anisotropy:4});
}

export function square(K,point){
  const {ctx,svc}=K,P=new Parts(),mat={
    rose:ctx.mat.toon('#ffffff',{map:pavingTexture(ctx,'finlyandsky-square-rose','#b49a91'),paint:.008}),
    grey:ctx.mat.toon('#ffffff',{map:pavingTexture(ctx,'finlyandsky-square-grey','#b5b4a9'),paint:.008}),
    border:ctx.mat.toon('#858a84',{paint:.012}),
    lawn:ctx.mat.toon('#5c7c42',{paint:.018}),
    flowers:ctx.mat.toon('#8b3f4a',{paint:.025}),
  };
  const toWorld=ring=>ring.map(([u,v])=>{const p=point(u,v);return[p.x,p.z];});
  const toLocal=(x,z)=>{const a=point(0,0),b=point(1,0),c=point(0,1);return[(x-a.x)*(b.x-a.x)+(z-a.z)*(b.z-a.z),(x-a.x)*(c.x-a.x)+(z-a.z)*(c.z-a.z)];};
  // Actual street-section clipping rounds the southern corners on the narrow
  // approach to Arsenalnaya; both flanking roads remain the street builder's.
  const outline=toWorld(SQUARE_OUTLINE),apron=toWorld(rect(-50,50,1,26)),box=boxOfPoly([...outline,...apron]);
  const waters=WATER.filter(w=>['pond','fountain'].includes(w.kind)).flatMap(w=>(w.polys||[]).filter(p=>intersects(box,boxOfPoly(pairs(p.o)))).map(p=>({id:w.id,p})));
  const cuts=waters.flatMap(w=>triangulateRing(w.p.o,w.p.h||[]));
  const net=ctx.services.streets?.net,roadCuts=[];
  if(net){
    for(const w of net.ways)if(!w.pedestrianOnly&&!w.skipDraw)for(let i=0;i+1<w.x.length;i++){
      const ax=w.x[i],az=w.z[i],bx=w.x[i+1],bz=w.z[i+1],dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),h=Math.max(w.hL[i],w.hR[i],w.hL[i+1],w.hR[i+1])+1;
      if(!l||!intersects(box,[Math.min(ax,bx)-h,Math.max(ax,bx)+h,Math.min(az,bz)-h,Math.max(az,bz)+h]))continue;
      const ux=dx/l,uz=dz/l,nx=-uz,nz=ux;
      roadCuts.push(ccw([[ax-ux*h-nx*h,az-uz*h-nz*h],[bx+ux*h-nx*h,bz+uz*h-nz*h],[bx+ux*h+nx*h,bz+uz*h+nz*h],[ax-ux*h+nx*h,az-uz*h+nz*h]]));
    }
    for(const f of net.fillets)if(intersects(box,f.box))roadCuts.push(ccw(f.poly));
  }
  const surface=(key,ring,y=.135,physical=false)=>{
    // The full square contains all twenty basin rings. Triangulate its holes
    // directly, rather than exploding two huge triangles into thousands of
    // skinny pieces; this also keeps the physical walk surface inexpensive.
    const holes=physical?waters.filter(w=>pairs(w.p.o).every(p=>contains(ring,...p))).map(w=>w.p.o):[];
    let pieces=triangulateRing(ring.flat(),holes);
    for(const cut of physical?roadCuts:[...roadCuts,...cuts])pieces=subtractConvex(pieces,cut);
    for(const p of pieces){const t=p.map(([x,z])=>[x,y,z]);P.fan(mat[key],t,[0,1,0],a=>{const[u,v]=toLocal(a[0],a[2]);return[u/4,v/4];});if(physical)for(let i=1;i+1<t.length;i++)ctx.physics.addWalkTriangle([t[0],t[i],t[i+1]],.135);}
  };
  const slab=(key,u0,u1,v0,v1,y)=>surface(key,toWorld(rect(u0,u1,v0,v1)),y);
  surface('rose',outline,.135,true);
  surface('grey',apron,.135,true);
  // Grey spine, broad cross avenues and thin edging organise the full square.
  slab('grey',-14.2,2.2,52,241,.142);
  for(const v of[61,84,98,164,179,224,237])slab('grey',-55,40,v-.85,v+.85,.144);
  for(const u of[-15.1,3.1])slab('border',u-.12,u+.12,52,241,.145);
  // Surveyed clipped lawn outlines preserve both tree avenues and the lawn
  // around the statue. The old field's arbitrary material blotches disappear.
  for(const id of LAWN_IDS){
    const r=GREEN.find(g=>g.id===id);for(const p of r?.polys||[])surface('lawn',pairs(p.o),.151);
  }
  // Sixteen individual lawn panels around the two rows of little basins.
  // Each remains punctured by its exact mapped water ring; the grey collars
  // are flat walkable paving, not walls preventing access to the basin.
  for(const w of waters.filter(w=>SMALL_BASIN.test(w.id))){
    const q=pairs(w.p.o),us=q.map(p=>toLocal(...p)[0]),vs=q.map(p=>toLocal(...p)[1]),u=(Math.min(...us)+Math.max(...us))/2,v=(Math.min(...vs)+Math.max(...vs))/2;
    const hu=(Math.max(...us)-Math.min(...us))/2,hv=(Math.max(...vs)-Math.min(...vs))/2;
    slab('lawn',u-hu-3.2,u+hu+3.2,v-hv-1.35,v+hv+1.35,.152);
    slab('grey',u-hu-.75,u+hu+.75,v-hv-.75,v+hv+.75,.158);
  }
  // The long pool and the two octagonal pools have contrasting grey aprons.
  for(const w of waters.filter(w=>['r8850268','r8850255','r8850256','r8850257'].includes(w.id))){
    const q=pairs(w.p.o),us=q.map(p=>toLocal(...p)[0]),vs=q.map(p=>toLocal(...p)[1]);
    slab('grey',Math.min(...us)-1,Math.max(...us)+1,Math.min(...vs)-1,Math.max(...vs)+1,.158);
  }
  // Long narrow flower parterre below the statue; its exact grass bed ring
  // retains the same plan position as the supplied aerial reference.
  const flower=GREEN.find(g=>g.id==='w240014031');for(const p of flower?.polys||[])surface('flowers',pairs(p.o),.16);
  for(const m of P.build(K.root,{name:'finlyandsky-square-paving',cast:false})){m.receiveShadow=true;registerLOD(m,1250);}
  svc.triangles+=P.tris;svc.square={outline: outline.flat(),basins:waters.length,panels:16,triangles:P.tris,y:.135};
}
