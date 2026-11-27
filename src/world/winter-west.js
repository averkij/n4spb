// Fixtures on the western side of Vasilievsky Island. Coordinates follow
// the same pavement across area boundaries. See docs/research/winter-west.md.
import { VB } from './traffic/vb.js';
import { knockInstances } from './lib/knock-inst.js';

export const WEST_SQUARES = [
  { id:'sea-glory', tree:[-6350,651,14], arches:[[-6359,657,.72],[-6341,639,.72]], orbs:[[-6359,645],[-6341,657]], snow:[-6350,660] },
  { id:'sobchak-square', tree:[-5433,-70,12], arches:[[-5442,-64,-.52]], orbs:[[-5445,-73],[-5424,-61]], huts:[[-5433,-55,-2.95]], snow:[-5436,-91] },
  { id:'sevkabel-winter-port', tree:[-6246,872,11], arches:[[-6255,878,-.65]], orbs:[[-6252,863],[-6240,875]], huts:[[-6249,887,2.55]] },
  { id:'pribaltiyskaya-square', tree:[-7529,-758,13], arches:[[-7535,-755,.43],[-7517,-764,.43]], orbs:[[-7538,-764],[-7520,-752]], snow:[-7529,-749] },
  { id:'europe-square', tree:[-8040,-531,14], arches:[[-8049,-525,-.42]], orbs:[[-8046,-537],[-8031,-525]], huts:[[-8040,-519,3],[-8031,-537,-1.02]] },
  { id:'bellingshausen-square', tree:[-7887,-609,12], arches:[[-7896,-603,.42]], orbs:[[-7893,-615],[-7878,-603]], snow:[-7887,-597] },
  { id:'primorskaya-holiday', tree:[-6539,-1804,11], arches:[[-6548,-1798,-.24]], orbs:[[-6545,-1810],[-6533,-1801]], snow:[-6539,-1795] },
  { id:'volodin-garden', tree:[-7969,-2080,13], arches:[[-7978,-2074,.55],[-7963,-2086,.55]], orbs:[[-7978,-2086],[-7960,-2074]], huts:[[-7969,-2065,Math.PI]] },
  { id:'baltic-cadets', tree:[-5902,-2140,12], arches:[[-5911,-2134,-.55]], orbs:[[-5911,-2146],[-5893,-2134]], huts:[[-5902,-2128,Math.PI]], snow:[-5887,-2137] },
];

const gold='#ffdb85', warm='#fff2bb', cold='#91dbe9';

function parcelBox(solid,lights) {
  solid.box(.88,.13,.66,'#384147',[0,.105,0]);
  solid.cyl(.14,.22,.57,'#476069',[0,.45,0],null,8);
  solid.rbox(.96,1.27,.60,.14,'#b83a3b',[0,1.32,0]);
  solid.rbox(1.06,.12,.68,.045,'#efdcc0',[0,1.95,0]);
  solid.box(.52,.16,.04,'#552f32',[0,1.62,.307]);
  solid.box(.62,.06,.12,'#e9c191',[0,1.72,.33]);
  solid.box(.56,.34,.034,'#edded0',[0,1.19,.306]);
  for(const s of [-1,1]) solid.rod([s*.262,1.336,.328],[0,1.15,.328],.014,'#a3383a');
  for(let i=0;i<8;i++) lights.sph(.042,i%2?warm:gold,[(i-3.5)*.12,1.98,.31],6);
}

function lantern(solid,lights) {
  const body='#42605e', brass='#bd9e6f', foot=1.26;
  for(const x of [-foot,foot]) for(const z of [-foot,foot]) {
    solid.box(.42,.21,.42,body,[x,.14,z]);
    solid.rod([x,.17,z],[x,2.85,z],.10,body,8);
    lights.rod([x,.32,z],[x,2.75,z],.047,gold,6);
    solid.rod([x,2.8,z],[x*.81,3.72,z*.81],.10,brass,8);
    lights.rod([x*.81,3.7,z*.81],[0,4.35,0],.061,warm,6);
    for(const y of [2.86,3.07,3.70]) {
      const k=y>3.1?.81:1;
      if(x<0) solid.rod([x*k,y,z*k],[-x*k,y,z*k],.064,body,6);
      if(z<0) solid.rod([x*k,y,z*k],[x*k,y,-z*k],.064,body,6);
    }
  }
  solid.cyl(.15,.30,.25,brass,[0,4.34,0]);
  solid.torus(.28,.068,brass,[0,4.62,0],null,6,16);
  solid.rod([0,3.86,0],[0,3.35,0],.048,body);
  lights.sph(.32,warm,[0,3.19,0],10,[.84,1.3,.84]);
}

function celestialGlobe(solid,lights) {
  const metal='#496473', brass='#b9965c', yc=2.36;
  solid.cyl(.70,.89,.24,metal,[0,.16,0],null,16);
  solid.cyl(.23,.40,.63,brass,[0,.58,0],null,12);
  solid.torus(1.49,.082,brass,[0,yc,0],null,6,48);
  lights.torus(1.31,.041,gold,[0,yc,0],[Math.PI/2,0,-.45],6,48);
  for(let i=0;i<6;i++) lights.torus(1.26,.028,cold,[0,yc,0],[0,i*Math.PI/6,.26],5,40);
  for(const k of [-.72,-.38,.38,.72]) lights.torus(1.26*Math.sqrt(1-k*k),.029,warm,[0,yc+k*1.26,0],[Math.PI/2,0,0],5,32);
  solid.rod([-.36,yc-1.39,0],[.36,yc+1.39,0],.044,metal);
  for(let i=0;i<16;i++) {
    const a=i*Math.PI/8; lights.sph(i%4?.048:.082,gold,[1.49*Math.cos(a),yc+1.49*Math.sin(a),.06],6);
  }
}

export function buildWestFestival(ctx, glow) {
  if(ctx.season!=='winter') return;
  const places=[
    { id:'sevkabel-holiday-post', x:-6237,z:866, yaw:-.65,r:.72,h:2.1, geometry:parcelBox },
    { id:'bellingshausen-celestial-globe', x:-7872,z:-606, yaw:.25,r:1.53,h:4.0, geometry:celestialGlobe },
    { id:'primorskaya-photo-lantern', x:-6527,z:-1807, yaw:0,r:2.09,h:5.0, geometry:lantern },
  ];
  for(const p of places) {
    const road=ctx.services.streets?.net || ctx._roadPlan;
    if(!ctx.L.inPlay(p.x,p.z) || ctx.L.waterLevelAt(p.x,p.z)!=null || ctx.L.insideBuilding(p.x,p.z,p.r) ||
        (road ? road.cover(p.x,p.z,{})>=-p.r-.5 : ctx.L.isOnRoad(p.x,p.z,p.r+.5)) || ctx.physics.columnBlocked(p.x,p.z,p.r,.32,p.h)) continue;
    const solid=new VB(),lights=new VB();
    p.geometry(solid,lights);
    const {records}=knockInstances(ctx,{name:p.id,spots:[{x:p.x,y:.04,z:p.z,rotY:p.yaw}],far:220,
      parts:[{geo:solid.build(),mat:ctx.mat.toon('#ffffff',{vertexColors:true,name:'west-festival-metal'})},
        {geo:lights.build(),mat:glow,shadow:false,noOutline:true}],
      items:()=>{
        if(p.geometry!==lantern) return ctx.physics.addCylinder(p.x,p.z,p.r,0,p.h);
        const feet=[];
        for(const dx of [-1.26,1.26]) for(const dz of [-1.26,1.26]) feet.push(ctx.physics.addCylinder(p.x+dx,p.z+dz,.21,0,2.95));
        feet.push(ctx.physics.addBox(p.x,p.z,2.6,2.6,0,2.87,4.32));
        return feet;
      },rec:{kind:'stand',r:p.r,h:p.h,mass:145,metal:true}});
    if(p.geometry===parcelBox && ctx.interact) {
      let posted=false;
      ctx.interact.add({id:p.id,x:p.x,y:1.48,z:p.z,radius:2.5,
        label:'Опустить праздничную открытку',labelEn:'Post a holiday card',
        enabled:()=>!posted && (!records[0] || records[0].state==='stand'),
        onUse:()=>{posted=true;ctx.ui?.toast?.('Открытка в новогоднем ящике Севкабель Порта');}});
    }
  }
}
