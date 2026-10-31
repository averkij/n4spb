// Sytny market, М. С. Лялевич 1912–13. Commons street/rear photos 02/03/05:
// long cream hall with pink rusticated piers and a coffered arched portal,
// green metal barrel skylight. Adjacent modern mall buildings are not claimed.
import { THREE,building,ringEdges,ringFromFlat,onEdge,frameOf,band,wall,window,archWall,addPolyColliders,addSite,sign,photo } from './kit.js';
export function build(K){
  const b=building('w40016292'),poly=b.polys[0],edges=ringEdges(poly),P=K.P,M=K.M;
  for(const e of edges)onEdge(P,e,()=>{
    const main=e.len>90,c=e.len/2;
    if(main){
      // Portal wall is cut rather than covered by a dark rectangle. The
      // interior ends at a recessed timber/glass door: public hall not built.
      // A ground-reaching opening must be a notch in the outer boundary.
      // Earcut ignores a Shape hole that crosses the floor edge.
      const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(c-3.2,0);shape.lineTo(c-3.2,4.5);shape.absarc(c,4.5,3.2,Math.PI,0,true);shape.lineTo(c+3.2,0);shape.lineTo(e.len,0);shape.lineTo(e.len,7.9);shape.lineTo(c+9,7.9);shape.lineTo(c+9,10.7);shape.lineTo(c-9,10.7);shape.lineTo(c-9,7.9);shape.lineTo(0,7.9);shape.closePath();P.face(M.cream,shape,0,2,20);
      const n=24,step=e.len/n;
      for(let i=0;i<n;i++){const x=(i+.5)*step;if(Math.abs(x-c)<8.8)continue;window(K,x,4.35,1.2,2.62,{gridX:1,gridY:2});if(i%3===0)window(K,x,1.2,1.12,1.6,{gridX:1,gridY:2});}
      for(let i=0;i<=8;i++){const x=i*e.len/8;if(Math.abs(x-c)<6)continue;for(let y=.35;y<7.8;y+=.65)P.box(M.pink,x-.5,x+.5,y,y+.62,-.05,.18,'k');}
      for(const x of [c-8.65,c+8.65]){for(let y=.4;y<10.7;y+=.65)P.box(M.pink,x-.52,x+.52,y,y+.62,-.02,.22,'k');window(K,x>c?x-2.2:x+2.2,8.25,1.35,1.65,{gridX:2,gridY:2});}
      // Arch jambs, wedge-shaped voussoirs and actual soffit coffers.
      for(const x of [c-3.65,c+3.65])P.box(M.pink,x-.42,x+.42,.2,4.6,-.04,.27,'k');
      for(let i=0;i<20;i++){
        const a=i*Math.PI/20,aa=(i+1)*Math.PI/20,r0=3.24,r1=3.95;
        P.quad(M.pink,[c+Math.cos(a)*r0,4.5+Math.sin(a)*r0,.2],[c+Math.cos(aa)*r0,4.5+Math.sin(aa)*r0,.2],[c+Math.cos(aa)*r1,4.5+Math.sin(aa)*r1,.2],[c+Math.cos(a)*r1,4.5+Math.sin(a)*r1,.2],[0,0,1]);
        P.quad(M.trim,[c+Math.cos(a)*3.2,4.5+Math.sin(a)*3.2,.0],[c+Math.cos(aa)*3.2,4.5+Math.sin(aa)*3.2,.0],[c+Math.cos(aa)*3.2,4.5+Math.sin(aa)*3.2,-1.3],[c+Math.cos(a)*3.2,4.5+Math.sin(a)*3.2,-1.3],[-Math.cos((a+aa)/2),-Math.sin((a+aa)/2),0]);
        if(i%2===0){P.push(c+Math.cos((a+aa)/2)*3.14,4.5+Math.sin((a+aa)/2)*3.14,-.5);P.box(M.pinkShade,-.2,.2,-.12,.12,-.45,.32);P.pop();}
      }
      P.box(M.glassShade,c-3.18,c+3.18,.15,4.5,-1.34,-1.3,'k');for(const x of [c-3.2,c,c+3.2])P.box(M.iron,x-.05,x+.05,.15,4.5,-1.29,-1.23);
      // Final integrated review: the upper recess must close too; otherwise
      // the opposite street/sky appears above the closed rectangular doors.
      // This arched glazing sits behind the retained arch and soffit coffers.
      for(let i=0;i<20;i++){
        const a=i*Math.PI/20,aa=(i+1)*Math.PI/20,r=3.18;
        P.fan(M.glassShade,[[c,4.5,-1.3],[c+r*Math.cos(a),4.5+r*Math.sin(a),-1.3],[c+r*Math.cos(aa),4.5+r*Math.sin(aa),-1.3]],[0,0,1]);
      }
      P.box(M.iron,c-.05,c+.05,4.5,7.63,-1.29,-1.23);
      P.box(M.iron,c-3.18,c+3.18,4.45,4.55,-1.29,-1.23);
      P.box(M.trim,c-9.25,c+9.25,10.55,10.85,-.05,.4,'k');
      if(e.n[0]<0)sign(K,b,e,'СЫТНЫЙ РЫНОК',e.len*.22,7.4,12,0.55);
    }else{wall(P,M.cream,e.len,0,7.9);if(e.len>10){for(let x=2.4;x<e.len;x+=3.5)window(K,x,4.25,1.25,2.6,{gridX:1,gridY:2});}}
  });
  P.cap(M.roof,ringFromFlat(poly.o),7.9);
  band(P,edges,.1,.5,.08,{front:M.plinth,top:M.plinth});band(P,edges,7.6,8.03,.28,{front:M.pink,top:M.roof,under:M.pinkShade});
  for(const e of edges.filter(e=>e.len>90))onEdge(P,e,()=>{
    for(let x=.55;x<e.len;x+=.8)if(Math.abs(x-e.len/2)>9.2)P.box(M.pinkShade,x-.12,x+.12,7.3,7.58,-.05,.19,'k');
  });
  // Barrel skylight centred over the cross-hall, spanning the two portals.
  const front=edges.find(e=>e.len>90&&e.n[0]>.5),f=frameOf(front);
  P.push(f.x,0,f.z,f.rot);const c=front.len/2,r=8.9;
  P.box(M.pink,c-r,c+r,7.92,10.65,-29.6,-.05,'tb');
  for(let i=0;i<14;i++){
    const a=i*Math.PI/14,aa=(i+1)*Math.PI/14,pt=t=>[c+r*Math.cos(t),10.65+3.4*Math.sin(t)];const A=pt(a),B=pt(aa);
    P.quad(M.glass,[A[0],A[1],-.07],[B[0],B[1],-.07],[B[0],B[1],-29.6],[A[0],A[1],-29.6],[Math.cos((a+aa)/2),Math.sin((a+aa)/2),0]);
    for(const z of [-.1,-7.5,-15,-22.5,-29.55])P.cyl(M.green,[A[0],A[1]+.06,z],[B[0],B[1]+.06,z],.075,.075,6);
    P.cyl(M.green,[A[0],A[1]+.06,-.1],[A[0],A[1]+.06,-29.55],.055,.055,6);
  }
  // The semi-circular end glazing closes the skylight; no missing gable faces.
  for(const z of [-.075,-29.57])for(let i=0;i<14;i++){const a=i*Math.PI/14,aa=(i+1)*Math.PI/14;P.fan(M.glassShade,[[c,10.65,z],[c+r*Math.cos(a),10.65+3.4*Math.sin(a),z],[c+r*Math.cos(aa),10.65+3.4*Math.sin(aa),z]],[0,0,z>-1?1:-1]);}
  P.pop();addPolyColliders(K.ctx,poly,0,8,.22);
  addSite(K,b.id,'Исторический Сытный рынок',14.05);
  photo(K,-2382,-2736,b.cx,b.cz,'Сытный рынок: протяжённый фасад',8);
  K.svc.parts.market={id:b.id,height:14.05,interior:'recessed closed portal only'};
}
