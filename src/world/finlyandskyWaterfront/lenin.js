import { LENIN, LENIN_BACK } from './sites.js';
import { makeKit, UPPER_Y, LOWER_Y } from './kit.js';

export function buildLenin(ctx,root,M,svc){
  const K=makeKit(ctx,root,LENIN,M),{P,D}=K;
  // The 136m frontage contains three transverse flights and two longitudinal
  // side flights, rather than a single invented staircase repeated on a bank.
  const left=-40.6,right=35.9,back=-10.5,front=-1.8,flights=[-28.1,-.4,26.3],width=7.2;
  // The left street kerb bends toward the river. Follow it instead of laying
  // a rectangular stone plate (or a terrain hole) over the live carriageway.
  K.polygon([...LENIN_BACK,[68,back],[-68,back]],UPPER_Y,-.24);
  let a=left;
  for(const u of flights){K.slab(a,u-width/2,back,front,UPPER_Y,LOWER_Y-.3);K.stairs([u,back],[u,front],width);a=u+width/2;}
  K.slab(a,right,back,front,UPPER_Y,LOWER_Y-.3);
  K.slab(left,right,front,6,LOWER_Y,LOWER_Y-.38);
  // Curved end platforms follow the mapped 1151087790 / 1151087792 outlines.
  // The outside extent is the official 136m; both landward noses follow the
  // actual upper footway. Their stair wells are true holes in the upper floor.
  const wings=[
    {ring:[[-68,-17],[left,-17],[left,4.25],[-55.0,4.25],[-60,3.7],[-64,1],[-67,-3],[-68,-11]],floor:[[-68,back],[left,back],[left,-2.05],[-54.7,-2.05],[-54.7,2.05],[left,2.05],[left,4.25],[-55,4.25],[-60,3.7],[-64,1],[-67,-3]],a:[-54.7,.1],b:[left,.27]},
    {ring:[[right,-17],[68,-17],[67,-11],[66,-4],[64,0],[60,3.2],[55.3,4.6],[right,4.3]],floor:[[right,back],[66.9,back],[66,-4],[64,0],[60,3.2],[55.3,4.6],[right,4.3],[right,2.5],[46.2,2.5],[46.2,-1.8],[right,-1.8]],a:[46.2,.43],b:[right,.27]},
  ];
  for(const w of wings){
    K.polygon(w.floor,UPPER_Y,LOWER_Y-.30);
    K.stairs(w.a,w.b,4.10);
    // The waterside semicircular returns remain several straight stone bays,
    // so a car can knock an individual segment out and reach the Neva.
    for(let i=2;i<w.ring.length-1;i++){const p=w.ring[i],q=w.ring[i+1];K.wall(...p,...q,UPPER_Y-.03);K.parapet(p,q,UPPER_Y,.85);}
  }
  // Thin retaining faces stop below the upper pavement. Railing/roll geometry
  // above either pavement is registered separately as breakable masonry.
  let u=left;
  for(const x of flights){K.wall(u,front,x-width/2,front,UPPER_Y-.03,LOWER_Y-.33);K.parapet([u,front],[x-width/2,front]);u=x+width/2;}
  K.wall(u,front,right,front,UPPER_Y-.03,LOWER_Y-.33);K.parapet([u,front],[right,front]);
  // Granite lower landing. The central boarding gap opens directly to the
  // river: no extra unmapped flights are invented on its front face.
  for(const span of[[left,-3.2],[3.2,right]]){K.wall(span[0],6,span[1],6,LOWER_Y-.02);K.parapet([span[0],5.86],[span[1],5.86],LOWER_Y,.75);}
  // Horizontal slab joints/edge strips are relief rather than decals on top of
  // the carriageway. The road is behind the last 6.5m-deep upper footway.
  D.box(M.coping,-36,68,UPPER_Y,UPPER_Y+.018,-16.77,-16.63,'b');
  D.box(M.coping,-68,68,UPPER_Y,UPPER_Y+.018,-10.77,-10.63,'b');
  svc.sites.push({id:LENIN.id,x:LENIN.x,z:LENIN.z,length:136,flights:5,lowerY:LOWER_Y});
  svc.photoSpots.push({name:'Парадный спуск площади Ленина',x:203,z:-2241,yaw:0,pitch:9});
  svc.triangles+=K.finish();
}
