// The public courts of the southwest. See docs/research/winter-southwest.md
// for seasonal photographs, the former Stachek light engine and the island fair.
import { VB, C } from './traffic/vb.js';
import { knockInstances } from './lib/knock-inst.js';

export const SOUTHWEST_SQUARES = [
  {id:'kanonersky-garden',tree:[-7292,3351,11],arches:[[-7304,3336,.25],[-7310,3339,.25]],
    orbs:[[-7328,3345],[-7298,3357]], huts:[[-7331,3333,1.7]],snow:[-7302,3345]},
  {id:'gutuevsky-church',tree:[-5292,2615,10],arches:[[-5301,2615,0],[-5292,2648,0]],
    orbs:[[-5283,2612],[-5298,2642]],snow:[-5283,2615]},
  {id:'gorky-palace-court',tree:[-4262,3573,11],arches:[[-4262,3558,-1.19],[-4277,3573,-1.19]],
    orbs:[[-4277,3582],[-4256,3585]],snow:[-4272,3564]},
  {id:'kirov-square',tree:[-4131,4044,13],arches:[[-4137,4053,.2],[-4113,4053,.2]],
    orbs:[[-4143,4047],[-4110,4047]],huts:[[-4125,4062,1.4]]},
  {id:'avtovo-vestibule',tree:[-5050,7249,12],arches:[[-5047,7237,-1.40],[-5050,7261,-1.40]],
    orbs:[[-5047,7228],[-5047,7268]],snow:[-5053,7255]},
  {id:'kirovsky-zavod-forecourt',tree:[-5033,5885,11],arches:[[-5027,5873,-2.02],[-5030,5888,-2.02]],
    orbs:[[-5021,5864],[-5042,5894]],snow:[-5027,5891]},
];

const gold='#ffd379',ice='#d9f1ff',ruby='#cc534f',teal='#79cad6',steel='#536a6d';
const PI=Math.PI;
function line(v,points,r,color){
  for(let i=1;i<points.length;i++)v.rod(points[i-1],points[i],r,color,5);
}
function star(v,x,y,z,r,color){
  const pts=Array.from({length:11},(_,i)=>{
    const a=i*PI/5+PI/2,d=i%2?r*.44:r;
    return [x+Math.cos(a)*d,y+Math.sin(a)*d,z];
  });
  line(v,pts,.035,color);
}
function sailingShip(){
  const frame=new VB(),lights=new VB();
  const stations=[[-2.15,.10,.98],[-1.58,.52,.78],[-.72,.77,.68],[.72,.77,.68],[1.63,.54,.77],[2.28,.06,1.16]];
  frame.box(2.82,.16,1.16,steel,[0,.14,0]);
  for(const s of [-1,1]){
    frame.box(2.38,.12,.18,steel,[0,.06,s*.44]);
    for(const [h,r,col] of [[0,.055,teal],[.24,.045,ice],[.45,.062,gold]])
      line(lights,stations.map(([x,w,y])=>[x,y-.45+h,s*w]),r,col);
    for(const [x,w,y] of stations)frame.rod([x,.23,s*w*.39],[x,y,s*w],.05,steel);
  }
  // Port and starboard sail boundaries bow out in opposite directions.
  for(const [x,h,w] of [[-.52,3.88,1.25],[.75,3.04,.94]]){
    frame.rod([x,.21,0],[x,h,0],.064,steel);
    lights.rod([x,.86,0],[x,h,0],.028,gold);
    for(const s of [-1,1]){
      const a=[x-.04,h-.18,0],b=[x-w*.49,h*.66,s*.20],c=[x-w,h*.38,s*.10],
        d=[x-.53*w,h*.42,s*.27],e=[x-.08,h*.49,0];
      line(lights,[a,b,c,d,e,a],.039,ice);
      line(lights,[[x-.06,h*.80,0],[x-w*.34,h*.60,s*.23],[x-w*.62,h*.40,s*.19]],.025,teal);
    }
  }
  line(lights,[[.76,3.01,0],[1.47,1.91,.13],[2.21,1.19,0],[.86,1.45,0],[.76,3.01,0]],.032,gold);
  return [frame,lights];
}

function steamEngine(){
  const frame=new VB(),lights=new VB();
  frame.box(3.78,.20,1.34,'#315258',[0,.52,0]);
  frame.cyl(.49,.49,1.98,'#355f62',[.47,1.22,0],[0,0,PI/2],16);
  frame.cyl(.26,.14,.70,'#784845',[.99,1.98,0],null,12);
  frame.cyl(.31,.28,.13,'#aa7962',[.99,2.38,0],null,12);
  frame.sph(.22,'#aa7962',[.23,1.74,0],10,[1,1.28,1]);
  frame.box(1.58,.17,1.66,'#934946',[-1.02,2.31,0]);
  for(const s of [-1,1]){
    frame.box(3.80,.07,.12,steel,[0,.035,s*.70]);
    for(const x of [-1.66,-.38])frame.box(.10,1.67,.10,steel,[x,1.40,s*.71]);
    line(lights,[[-1.65,.71,s*.72],[-1.65,2.22,s*.72],[-.39,2.22,s*.72],[-.39,.71,s*.72]],.043,gold);
    lights.rod([-1.89,2.41,s*.8],[-.16,2.41,s*.8],.047,ice);
    for(const x of [-1.32,-.49,.45,1.23]){
      const z=s*.70;frame.cyl(.36,.36,.12,'#3c5052',[x,.42,z],[PI/2,0,0],12);
      lights.torus(.337,.034,ruby,[x,.42,z+s*.08],null,5,16);
      for(let i=0;i<4;i++){const a=i*PI/4,dx=.30*Math.cos(a),dy=.30*Math.sin(a);
        lights.rod([x-dx,.42-dy,z+s*.08],[x+dx,.42+dy,z+s*.08],.019,gold);}
    }
    lights.rod([-1.37,.33,s*.84],[1.26,.33,s*.84],.046,ice);
  }
  for(const x of [-.26,.56,1.40])lights.torus(.503,.037,gold,[x,1.22,0],[0,PI/2,0],5,18);
  lights.sph(.145,ice,[1.51,1.68,0],9);
  return [frame,lights];
}

// A small group of diamond-cut lanterns echoes the pressed glass columns
// below Avtovo station. Each lantern stands on its own stepped stone foot.
function crystal(){
  const frame=new VB(),lights=new VB(),n=8;
  frame.cyl(.46,.56,.25,steel,[0,.125,0],null,n);
  for(const [h,r] of [[.28,.48],[.47,.39],[2.65,.39],[2.83,.51]]){
    const ring=Array.from({length:n+1},(_,i)=>[r*Math.cos(i*2*PI/n),h,r*Math.sin(i*2*PI/n)]);
    line(lights,ring,.045,gold);
  }
  for(let j=0;j<4;j++)for(let i=0;i<n;i++){
    const p=(k,y)=>[.40*Math.cos(k*2*PI/n),y,.40*Math.sin(k*2*PI/n)];
    const h=.47+j*.545;
    line(lights,[p(i,h),p(i+.5,h+.272),p(i,h+.545)],.030,i%2?ice:teal);
    line(lights,[p(i,h),p(i-.5,h+.272),p(i,h+.545)],.022,ice);
  }
  star(lights,0,3.22,0,.45,gold);
  return [frame,lights];
}

export function buildSouthwestFestival(ctx,glow){
  if(ctx.season!=='winter')return;
  const definitions=[
    {name:'kanonersky-light-ship',make:sailingShip,w:4.5,d:1.54,h:3.94,spots:[[-7329,3339,.32]]},
    {name:'stachek-light-engine',make:steamEngine,w:3.84,d:1.72,h:2.50,spots:[[-4261,3566,-1.19]]},
    {name:'avtovo-crystal-lantern',make:crystal,w:1.12,d:1.12,h:3.71,spots:[[-5050,7255,0],[-5047,7242,.4],[-5047,7273,.8]]},
  ];
  for(const {name,make,w,d,h,spots} of definitions){
    const radius=Math.hypot(w,d)/2;
    const placements=spots.filter(([x,z])=>ctx.L.inPlay(x,z)&&ctx.L.waterLevelAt(x,z)==null&&
      !ctx.L.insideBuilding(x,z,radius)&&!ctx.physics.columnBlocked(x,z,radius,.32,h)&&
      (ctx.services.streets?.net?ctx.services.streets.net.cover(x,z,{})< -radius-.5:!ctx.L.isOnRoad(x,z,radius+.5)))
      .map(([x,z,rotY])=>({x,z,rotY,y:ctx.physics.groundHeight(x,z,.5,false)}));
    if(!placements.length)continue;
    const [frame,lights]=make();
    const {records}=knockInstances(ctx,{name,spots:placements,far:235,
      parts:[{geo:frame.build(),mat:ctx.mat.toon('#ffffff',{vertexColors:true,name:'southwest-festival-frame'})},
        {name:'garland',geo:lights.build(),mat:glow,color:()=>'#ffffff',noOutline:true,shadow:false}],
      items:(_,s)=>ctx.physics.addBox(s.x,s.z,w,d,s.rotY,s.y,s.y+h),
      rec:{kind:name,w,d,h,mass:w*27,metal:true},
    });
    for(const [i,record] of records.entries()){
      const lamps=record?.parts.find(p=>p.mesh?.name.startsWith(name+'-garland'));
      if(!lamps)continue;
      let phase=0;
      const {x,z}=placements[i], colors=['#ffffff','#8feaff','#ffab78'];
      ctx.interact?.add({id:name+'-'+i,radius:3.35,label:'Переключить гирлянду',labelEn:'Change the festive lights',
        at:()=>({x,y:1.35,z}),enabled:()=>record.state==='stand'&&!ctx.drive?.active,
        onUse:()=>{phase=(phase+1)%colors.length;lamps.mesh.setColorAt(lamps.index,C(colors[phase]));lamps.mesh.instanceColor.needsUpdate=true;},
      });
    }
  }
}
