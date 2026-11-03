// Land approaches on visible supports: preserve the span and the open pond.
import * as THREE from 'three';
import { knockBays, unitPanel } from '../../lib/fence-bays.js';
import { RAIL } from './mats.js';
import { frameOfPond, pondApproaches } from './specs.js';

export function bridgeApproaches(ctx,sp,M,Y) {
  const f=frameOfPond(sp),plans=pondApproaches(sp,ctx.L.heightAt),hw=sp.wd?sp.wd/2:sp.hw;
  const world=(u,v)=>[f.cx+u*f.c-v*f.s,f.cz+u*f.s+v*f.c];
  const top=(a,u)=>a.y0+(a.y1-a.y0)*(u-a.inner)/(a.outer-a.inner);
  const deck=sp.wd?Y.sluiceDeck:sp.deck==='wood'?Y.deckWood:M.asphalt;
  const structure=sp.wd?Y.concrete:Y.timber,posts=[],railBays=[];
  for(const a of plans) {
    const n=Math.max(1,Math.ceil((a.outer-a.inner)/2.4));
    for(const side of [-1,1])for(let i=0;i<n;i++){
      const u0=a.inner+(a.outer-a.inner)*i/n,u1=a.inner+(a.outer-a.inner)*(i+1)/n;
      const p=world(a.side*u0,side*(hw-.12)),q=world(a.side*u1,side*(hw-.12));
      railBays.push({x0:p[0],z0:p[1],x1:q[0],z1:q[1],y:top(a,u0)+.04,ye:top(a,u1)+.04});
    }
    for(let u=a.inner+.5;u<a.outer-.4;u+=2)for(const v of [-hw+.18,hw-.18]){
      const p=world(a.side*u,v),bottom=ctx.L.heightAt(...p)-.12,upper=top(a,u)-.14;
      if(upper>bottom+.15)posts.push({u:a.side*u,v,bottom,upper,x:p[0],z:p[1]});
    }
  }
  if(railBays.length){
    const spec=RAIL[sp.rail?.kind||'xlat'],mat=Y.rail(sp.rail?.kind||'xlat',sp.rail?.hex||'#cfd5d8');
    const panel=unitPanel(0,spec.H),post=new THREE.CylinderGeometry(.04,.04,spec.H+.08,5);post.translate(0,(spec.H+.08)/2,0);
    const result=knockBays(ctx,{name:'brg-ypond-'+sp.id+'-approach-rails',bays:railBays,
      parts:[{geo:panel,mat,name:'panel',stretch:true},{geo:post,mat:Y.post||M.steel,name:'post'}],
      collider:b=>({y0:Math.min(b.y,b.ye)-.1,y1:Math.max(b.y,b.ye)+spec.H,thick:.14}),
      rec:{kind:'fence',mass:70,h:spec.H,anchored:12,metal:true,hitK:.35},far:260});
    for(const it of result.items)if(it)it.bridgeItem=true;
  }
  return {
    plans,
    draw(P){
      for(const a of plans){const u0=a.side*a.inner,u1=a.side*a.outer,y0=a.y0,y1=a.y1,hd=hw-.1;
        P.quad(deck,[u0,y0,-hd],[u1,y1,-hd],[u1,y1,hd],[u0,y0,hd],[0,1,0],[[u0,-hd],[u1,-hd],[u1,hd],[u0,hd]]);
        for(const [u,y,normal]of [[u0,y0,-a.side],[u1,y1,a.side]])P.quad(structure,[u,y-.14,-hd],[u,y,-hd],[u,y,hd],[u,y-.14,hd],[normal,0,0]);
        for(const v of [-hd,hd])P.quad(structure,[u0,y0-.14,v],[u1,y1-.14,v],[u1,y1,v],[u0,y0,v],[0,0,v<0?-1:1]);
        P.quad(structure,[u0,y0-.14,-hd],[u0,y0-.14,hd],[u1,y1-.14,hd],[u1,y1-.14,-hd],[0,-1,0]);
      }
      for(const p of posts)P.cyl(structure,[p.u,p.bottom,p.v],[p.u,p.upper,p.v],.09,.09,6,true);
    },
    colliders(){
      let n=0;
      for(const a of plans){const p=world(a.side*(a.inner+a.outer)/2,0),rot=Math.atan2(a.side*f.c,a.side*f.s);
        const it=ctx.physics.addWalkRamp(p[0],p[1],2*hw-.2,a.outer-a.inner+.04,rot,a.y0,a.y1,.14);it.bridgeItem=true;n++;
      }
      for(const p of posts){const it=ctx.physics.addCylinder(p.x,p.z,.09,p.bottom,p.upper);it.bridgeItem=true;n++;}
      return n;
    },
    deckAt(x,z){const u=(x-f.cx)*f.c+(z-f.cz)*f.s,v=-(x-f.cx)*f.s+(z-f.cz)*f.c;if(Math.abs(v)>hw-.1)return null;
      for(const a of plans)if(u*a.side>=a.inner&&u*a.side<=a.outer)return top(a,u*a.side);return null;},
  };
}
