// The Metro entrance adjoins the railway station on the east. Its two public
// street doors and the internal railway connection have separate OSM nodes.
import * as THREE from 'three';
import { ENTRANCES } from '../data/city.js';
import { Parts, ringEdges, onEdge, localOnEdge, archPath } from '../landmarksD/kit.js';
import { addPolyColliders, ringFromFlat } from '../lib/massing.js';
import { addPavilionEntrance, entrancePoint } from '../lib/metro-pavilion-entrance.js';
import { registerLOD } from '../../core/spatial.js';

export function buildMetroPavilion(ctx, building) {
  const doors=ENTRANCES.filter(d=>d.bldg===building.id).map(d=>({...d,w:d.kind==='entrance'?4.65:3.65}));
  const P=new Parts(), stone=ctx.mat.toon('#d4c4a3'), cream=ctx.mat.toon('#e8dcbf'), shade=ctx.mat.toon('#a79882');
  const granite=ctx.mat.toon('#85807b'), glass=ctx.mat.toon('#44585c'), bronze=ctx.mat.toon('#947c5b');
  const fascia=ctx.mat.toon('#ebe0cd',{map:ctx.tex.sign({text:'БАЛТИЙСКАЯ',bg:'#e3d2b1',fg:'#5c4e3a',w:512,h:96,font:'serif'})});
  for(const poly of building.polys) {
    P.cap(shade,ringFromFlat(poly.o),10.55,true,3,poly.h.map(ringFromFlat));
    addPolyColliders(ctx,poly,0,10.55,.65,doors);
    for(const e of ringEdges(poly))onEdge(P,e,(len,f)=>{
      const here=doors.map(d=>({...d,...localOnEdge(e,d.x,d.z)})).filter(d=>Math.abs(d.d)<.5&&d.u>0&&d.u<len);
      const main=here.find(d=>d.kind==='entrance'), gap=here[0];
      for(const [a,b] of gap?[[0,gap.u-gap.w/2],[gap.u+gap.w/2,len]]:[[0,len]]) {
        P.box(stone,a,b,0,3.3,-.22,0,'k');
        P.box(granite,a,b,0,.57,-.22,.055,'bk');
      }
      P.box(stone,0,len,3.3,10.55,-.22,0,'k');
      P.box(cream,-.07,len+.07,9.44,9.68,-.22,.28,'k');
      P.box(cream,-.12,len+.12,10.22,10.5,-.23,.38,'k');
      for(const d of here){
        const x=f.x+f.xa[0]*d.u, z=f.z+f.xa[1]*d.u;
        const door={id:d.id,x,z,rotY:f.rot,y:.42,h:2.78,w:d.w,leaves:4,style:'walnut',approach:5.5};
        addPavilionEntrance(ctx,door);
        const stairsW=d.w+1.25;
        for(let j=0;j<3;j++){
          const height=(3-j)*.14, z0=.3+j*.44;
          P.box(granite,d.u-stairsW/2,d.u+stairsW/2,0,height,z0,z0+.44);
        }
        const steps=entrancePoint(door,0,.96);
        ctx.physics.addStairs(steps.x,steps.z,stairsW,1.32,f.rot+Math.PI,0,.42,3);
        ctx.physics.addWalkBox(x,z,stairsW,.68,f.rot,.42,.02);
      }
      if(!main)return;
      // Six round stone columns carry the inscribed entablature; a blind upper
      // frieze alternates ringed portrait medallions and semicircular windows.
      const a=2,b=len-1.7,n=6,span=b-a;
      P.box(cream,a-.52,b+.52,5.65,6.55,-.1,2.75);
      P.box(shade,a-.62,b+.62,6.5,6.65,-.15,2.88);
      P.quad(fascia,[a+2,5.91,2.76],[b-2,5.91,2.76],[b-2,6.34,2.76],[a+2,6.34,2.76],[0,0,1]);
      for(let j=0;j<n;j++) {
        const u=a+j*span/(n-1);
        P.col(stone,u,2.12,.12,5.42,.46,.395,16);
        P.col(cream,u,2.12,.10,.34,.59,.52,16);
        P.col(cream,u,2.12,5.37,5.60,.43,.58,16);
        P.box(cream,u-.64,u+.64,5.58,5.69,1.5,2.74);
        const at={x:f.x+f.xa[0]*u+e.n[0]*2.12,z:f.z+f.xa[1]*u+e.n[1]*2.12};
        ctx.physics.addCylinder(at.x,at.z,.47,.1,5.65);
        P.cyl(cream,[u,7.94,.02],[u,7.94,.17],.69,.64,16);
        P.cyl(bronze,[u,7.94,.17],[u,7.94,.21],.50,.49,18);
        P.cyl(shade,[u-.05,8.04,.21],[u-.05,8.04,.29],.21,.175,12);
        P.cyl(shade,[u,7.74,.21],[u,7.74,.28],.26,.21,12);
        if(j===n-1)continue;
        const fan=new THREE.Shape();archPath(fan,u+span/(n-1)/2,6.81,1.9,.07);
        P.face(glass,fan,.055);
      }
      for(let u=.5;u<len-.4;u+=.65)P.box(cream,u-.12,u+.12,9.22,9.44,.02,.24,'k');
    });
  }
  const root=new THREE.Group();
  for(const m of P.build(root,{name:'baltiyskaya-pavilion'}))registerLOD(m,700);
  ctx.addStatic(root);
}
