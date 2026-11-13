// Surveyed landing geometry in an embankment frame (+v toward water).
import * as THREE from 'three';
import { Parts } from '../landmarksD/kit.js';
import { registerLOD } from '../../core/spatial.js';
import { knockBays, splitBays, unitBox, unitProfile } from '../lib/fence-bays.js';
import { NAVIGABLE_WATER_Y } from '../environment/water-level.js';
import { point } from './sites.js';

export const UPPER_Y = .10, LOWER_Y = NAVIGABLE_WATER_Y + 1.4;
export const FOOT_Y = NAVIGABLE_WATER_Y + .35;
export function makeKit(ctx, root, site, mats) {
  const P = new Parts(), D = new Parts(), parapets=new Map(), rails=new Map();
  P.push(site.x,0,site.z,site.rot); D.push(site.x,0,site.z,site.rot);
  const physical = (u,v,w,d,y0,y1,rot=0) => {const [x,z]=point(site,u,v);return ctx.physics.addBox(x,z,w,d,site.rot+rot,y0,y1);};
  // Small physical overlap closes floating-point seams between independently
  // rotated treads and landings; the visible stone edges remain exact.
  const walk = (u,v,w,d,y,rot=0,bottom=y-.32) => {const [x,z]=point(site,u,v);return ctx.physics.addWalkBox(x,z,w+.008,d+.008,site.rot+rot,y,bottom);};
  function slab(u0,u1,v0,v1,y,bottom=y-.30,mat=mats.floor) {
    P.box(mat,u0,u1,bottom,y,v0,v1,'b',2.4);walk((u0+u1)/2,(v0+v1)/2,u1-u0,v1-v0,y,0,bottom);
  }
  function polygon(ring,y,bottom=y-.3,holes=[],mat=mats.floor) {
    P.cap(mat,ring,y,true,2.4,holes);
    const verts=ring.concat(...holes),tri=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),holes.map(h=>h.map(p=>new THREE.Vector2(...p))));
    for(const t of tri)ctx.physics.addWalkTriangle(t.map(i=>{const[x,z]=point(site,...verts[i]);return[x,y,z];}),y-bottom);
    for(const r of[ring,...holes])for(let i=0;i<r.length;i++){
      const a=r[i],b=r[(i+1)%r.length];P.quad(mats.wall,[a[0],bottom,a[1]],[b[0],bottom,b[1]],[b[0],y,b[1]],[a[0],y,a[1]],null,[[a[0]/4,bottom/2.2],[b[0]/4,bottom/2.2],[b[0]/4,y/2.2],[a[0]/4,y/2.2]]);
    }
  }
  function wall(u0,v0,u1,v1,top,bottom=NAVIGABLE_WATER_Y-.35,thick=.40) {
    const dx=u1-u0,dz=v1-v0,len=Math.hypot(dx,dz),rot=Math.atan2(-dz,dx);
    P.push((u0+u1)/2,0,(v0+v1)/2,rot);P.box(mats.wall,-len/2,len/2,bottom,top,-thick/2,thick/2,'b',2.2);P.pop();
    physical((u0+u1)/2,(v0+v1)/2,len,thick,bottom,top,rot);
    // A narrow water stain belongs below the walking level, never a black band
    // across the dry granite terrace.
    if(bottom<NAVIGABLE_WATER_Y+.12){P.push((u0+u1)/2,0,(v0+v1)/2,rot);P.box(mats.wet,-len/2,len/2,NAVIGABLE_WATER_Y-.13,Math.min(top,NAVIGABLE_WATER_Y+.12),-thick/2-.006,thick/2+.006,'tb',2.2);P.pop();}
  }
  function stairs(a,b,width,y0=UPPER_Y,y1=LOWER_Y,count=Math.ceil(Math.abs(y1-y0)/.16)) {
    const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),rot=Math.atan2(dx,dz),run=len/count,tx=dx/len,tz=dz/len;
    P.push(a[0],0,a[1],rot);D.push(a[0],0,a[1],rot);
    for(let i=0;i<count;i++){
      const top=y0+(y1-y0)*(i+1)/count;
      P.box(i%2?mats.stepB:mats.stepA,-width/2,width/2,Math.min(y0,y1)-.28,top,i*run,(i+1)*run,'b',2.4);
      // Projecting dressed nosings remain visible in a shallow river view.
      D.box(mats.coping,-width/2,width/2,top-.065,top+.008,(i+1)*run-.09,(i+1)*run+.025,'b');
      walk(a[0]+tx*run*(i+.5),a[1]+tz*run*(i+.5),width,run,top,rot,Math.min(y0,y1)-.28);
    }
    P.pop();D.pop();
    return {a,b,width,y0,y1,rot};
  }
  function parapet(a,b,y=UPPER_Y,h=.86,tile=2.2,ye=y) {
    const p=point(site,...a),q=point(site,...b),bays=splitBays(...p,...q,tile,{y});
    bays.forEach((bay,i)=>{bay.y=y+(ye-y)*i/bays.length;bay.ye=y+(ye-y)*(i+1)/bays.length;});
    const key=h+'/'+tile;let row=parapets.get(key);if(!row){row={h,tile,bays:[]};parapets.set(key,row);}row.bays.push(...bays);
  }
  function flushParapet({h,tile,bays}){
    const foot=unitBox(0,.12,-.32,.32,{uLen:tile,uvs:2.2});
    const roll=unitProfile([[-.26,.12],[-.26,h-.16],[-.20,h-.055],[-.10,h],[.10,h],[.20,h-.055],[.26,h-.16],[.26,.12]],{uLen:tile,uvs:2.2});
    return knockBays(ctx,{name:site.id+'-granite-parapet',bays,parts:[{name:'dressed-granite-foot',geo:foot,mat:mats.coping,stretch:true},{name:'rounded-granite-roll',geo:roll,mat:mats.coping,stretch:true}],collider:bay=>({y0:Math.min(bay.y,bay.ye)-.03,y1:Math.max(bay.y,bay.ye)+h,thick:.56}),rec:{kind:'fence',mass:190,h,anchored:15,hitK:.42,metal:false,minDv:0},far:620});
  }
  function rail(a,b,y=UPPER_Y,h=.90) {
    const p=point(site,...a),q=point(site,...b),tile=1.9,bays=splitBays(...p,...q,tile,{y});
    let row=rails.get(h);if(!row){row={h,bays:[]};rails.set(h,row);}row.bays.push(...bays);
  }
  function flushRail({h,bays}){
    const post=new THREE.BoxGeometry(.055,h,.055);post.translate(0,h/2,0);
    const bar=new THREE.BoxGeometry(.023,h-.32,.023);bar.translate(0,h/2,0);
    const scroll=new THREE.TorusGeometry(.060,.009,4,10,Math.PI*1.5),at=()=>[.125,.25,.375,.5,.625,.75,.875];
    return knockBays(ctx,{name:site.id+'-iron-railing',bays,parts:[{name:'slim-iron-uprights',geo:post,mat:mats.iron,at:'start'},{name:'rail-head',geo:unitBox(h-.045,h+.025,-.035,.035),mat:mats.iron,stretch:true},{name:'rail-low',geo:unitBox(.14,.18,-.022,.022),mat:mats.iron,stretch:true},{name:'vertical-iron-bars',geo:bar,mat:mats.iron,ats:at},{name:'upper-volute-band',geo:scroll,mat:mats.iron,ats:at,y:h-.10},{name:'lower-volute-band',geo:scroll,mat:mats.iron,ats:at,y:.085}],collider:bay=>({y0:bay.y,y1:bay.y+h,thick:.14}),rec:{kind:'fence',mass:28,h,anchored:8,hitK:.65,metal:true,minDv:0},far:320});
  }
  function finish(){for(const row of parapets.values())flushParapet(row);for(const row of rails.values())flushRail(row);P.pop();D.pop();for(const m of P.build(root,{name:site.id+'-masonry'}))registerLOD(m,1450);for(const m of D.build(root,{name:site.id+'-stone-detail'}))registerLOD(m,450);return P.tris+D.tris;}
  return {ctx,site,P,D,slab,polygon,wall,stairs,parapet,rail,physical,walk,finish};
}
