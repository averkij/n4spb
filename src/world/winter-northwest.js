// Winter routes in Primorsky District and on the islands. Survey and photos
// are in docs/research/winter-northwest.md.
import { buildHolidayRink } from './lib/holiday-rink.js';
import { VB } from './traffic/vb.js';
import { knockInstances } from './lib/knock-inst.js';

export const NORTHWEST_SQUARES = [
  { id: 'park300-lighthouse', tree: [-8410,-5446,15],
    arches: [[-8400,-5446,-.25],[-8420,-5446,-.25]], orbs: [[-8410,-5456],[-8418,-5438]],
    huts: [[-8395,-5454,1.32],[-8425,-5454,-1.82]], snow: [-8395,-5438] },
  { id: 'begovaya-forecourt', tree: [-8235,-6261,10],
    arches: [[-8225,-6261,.92]], orbs: [[-8245,-6261],[-8243,-6269]] },
  { id: 'piterland-waterfront', tree: [-7922,-5330,12],
    arches: [[-7932,-5330,.3],[-7912,-5330,.3]], orbs: [[-7930,-5338],[-7922,-5320]],
    huts: [[-7937,-5338,-.65],[-7907,-5322,2.35]] },
  { id: 'dolgoe-park', tree: [-4564,-9321,13],
    arches: [[-4572,-9313,.55],[-4556,-9313,.55]], orbs: [[-4549,-9313],[-4579,-9329]],
    huts: [[-4579,-9313,.6]] },
  { id: 'seleznev-square', tree: [-5191,-9350,9],
    arches: [[-5201,-9350,.5]], orbs: [[-5176,-9358],[-5183,-9358]], snow: [-5206,-9358] },
  { id: 'komendantskaya-square', tree: [-5318,-8676,12],
    arches: [[-5326,-8684,-.55]], orbs: [[-5310,-8668],[-5333,-8684]], huts: [[-5333,-8668,1.05]] },
  { id: 'yelagin-grand-square', tree: [-4740,-5388,18],
    orbs: [[-4744,-5391],[-4736,-5385],[-4744,-5385],[-4736,-5391]],
    huts: [[-4773,-5356,-.3],[-4765,-5354,-.3],[-4757,-5352,-.3]] },
  { id: 'old-theatre-square', tree: [-4289,-4931,10], arches: [[-4297,-4923,.25]],
    orbs: [[-4289,-4921],[-4299,-4931]], snow: [-4281,-4923] },
  { id: 'zenit-square', tree: [-6881,-4483,15],
    arches: [[-6881,-4473,0],[-6881,-4493,0]], orbs: [[-6873,-4475],[-6889,-4491]],
    huts: [[-6896,-4475,1.57],[-6896,-4491,1.57],[-6866,-4491,-1.57]] },
];

const yelagin = {
  pitch: 'r19991039', cx: -4740.2, cz: -5388.2, name: 'yelagin-rink', fixtures: 'yelagin',
  openings: [9,6], rows: [-31,-22,-12,12,22,31], yaw: -.04,
};

// Two freestanding wave silhouettes face the lighthouse apron. The parallel
// ribbons rise to a curling crest above each weighted steel shoe.
function waterfrontWaves(ctx, glow) {
  const spots = [[-8425,-5438,.38],[-8419,-5429,.72]].filter(([x,z]) =>
    ctx.L.inPlay(x,z) && ctx.L.waterLevelAt(x,z)==null && !ctx.L.insideBuilding(x,z,2.7)
    && !ctx.L.isOnRoad(x,z,3) && !ctx.physics.columnBlocked(x,z,2.7,.32,3.5)
  ).map(([x,z,rotY]) => ({x,z,rotY}));
  if (!spots.length) return;
  const base = new VB(), ribbons = new VB();
  const crest = [[-2.38,.48],[-1.84,.53],[-1.29,.71],[-.75,1.06],[-.16,1.74],
    [.32,2.36],[.79,2.78],[1.25,2.95],[1.72,2.87],[2.12,2.53],[2.24,2.19],
    [2.04,2.31],[1.73,2.35],[1.44,2.23],[1.25,1.98],[1.23,1.67],[1.41,1.38],
    [1.78,1.16],[2.28,1.08]];
  base.box(5.05,.13,.76,'#536573',[0,.065,0]);
  for (const [dx,top] of [[-1.8,.53],[-.14,1.74],[1.44,2.23],[2.11,1.08]]) {
    base.rod([dx,.13,0],[dx,top,0],.042,'#658391',6);
  }
  for (const [scale,tint,offset] of [[1,'#ffeece',0],[.80,'#99ecf6',-.025],[.61,'#63b9dd',-.05]]) {
    for (let i=1;i<crest.length;i++) {
      const [ax,ay]=crest[i-1], [bx,by]=crest[i];
      ribbons.rod([ax,ay*scale,offset],[bx,by*scale,offset],.044,tint,6);
    }
  }
  knockInstances(ctx,{name:'park300-wave',spots,far:240,
    parts:[{geo:base.build(),mat:ctx.mat.toon('#ffffff',{vertexColors:true})},
      {geo:ribbons.build(),mat:glow,shadow:false,noOutline:true}],
    items:(_,s)=>ctx.physics.addBox(s.x,s.z,5.05,.76,s.rotY,0,2.98),
    rec:{kind:'lamp',w:5.05,d:.76,h:2.98,mass:125,metal:true}});
}

// Portable stage wings frame the open audience side of the holiday concert at
// Dolgoye. Each independent metal tower carries its own lamps and collision.
function concertLights(ctx, glow) {
  const x=-4584, z=-9324;
  if (!ctx.L.inPlay(x,z) || ctx.L.waterLevelAt(x,z)!=null || ctx.L.insideBuilding(x,z,4.4)
      || (ctx.services.streets?.net || ctx._roadPlan)?.cover(x,z,{}) >= -4.9
      || ctx.physics.columnBlocked(x,z,4.4,.32,4.5)) return;
  const spots = [{x:x-3.2,z:z-.6,rotY:0},{x:x+3.2,z:z-.6,rotY:0}];
  const stage = new VB(), mat = ctx.mat.toon('#ffffff',{vertexColors:true});
  stage.box(6.5,.18,3.2,'#49505b',[0,.09,0]);
  for (let i=0;i<12;i++) stage.box(6.6,.07,.272,i%2 ? '#ac8970' : '#b3957d',[0,.215,-1.53+i*.277]);
  knockInstances(ctx,{name:'dolgoe-concert-stage',spots:[{x,z}],far:210,
    parts:[{geo:stage.build(),mat}],
    items:()=>ctx.physics.addWalkBox(x,z,6.6,3.33,0,.25,0),
    rec:{kind:'stand',mass:360,h:.25,w:6.6,d:3.33}});
  const frame = new VB(), lenses = new VB();
  frame.box(1.2,.16,1,'#46505a',[0,.08,0]);
  for (const dx of [-.26,.26]) for (const dz of [-.22,.22]) {
    frame.rod([dx,.14,dz],[dx,4.2,dz],.045,'#8695a3',6);
  }
  for (let j=0;j<5;j++) {
    const y=.2+j*.78;
    for (const dz of [-.22,.22]) frame.rod([-.26,y,dz],[.26,y+.77,dz],.025,'#a3acaf',5);
    for (const dx of [-.26,.26]) frame.rod([dx,y,-.22],[dx,y+.77,.22],.025,'#a3acaf',5);
  }
  frame.box(1.5,.12,.25,'#4e5b65',[0,4.18,0]);
  for (const [x,tint] of [[-.53,'#ffe6a7'],[0,'#91d9e5'],[.53,'#fac0bc']]) {
    frame.box(.34,.31,.42,'#343946',[x,3.96,.12],[-.21,0,0]);
    lenses.sph(.145,tint,[x,3.91,.34],8,[1,1,.28]);
  }
  knockInstances(ctx,{name:'dolgoe-concert-lights',spots,far:240,
    parts:[{geo:frame.build(),mat},
      {geo:lenses.build(),mat:glow,shadow:false,noOutline:true}],
    items:(_,p)=>ctx.physics.addBox(p.x,p.z,1.2,1,p.rotY,0,4.3),
    rec:{kind:'lamp',mass:120,h:4.3,w:1.2,d:1,metal:true}});
}

export function buildNorthwestFestival(ctx,glow) {
  buildHolidayRink(ctx,glow,yelagin);
  concertLights(ctx,glow);
  waterfrontWaves(ctx,glow);
}
