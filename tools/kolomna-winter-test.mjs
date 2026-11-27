// node tools/area.mjs {kolomna|admiralty|narvsky} tools/kolomna-winter-test.mjs [--summer]
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { buildWinter } from '../src/world/winter.js';
import { PITCHES } from '../src/world/data/city.js';
import { KOLOMNA_SQUARES } from '../src/world/winter-kolomna.js';
import { Player } from '../src/core/player.js';
import { createInteract } from '../src/core/ui.js';
import { build as buildDrive } from '../src/world/drive.js';

const area = process.env.AREA, winter = !process.argv.includes('--summer');
assert(['kolomna','admiralty','narvsky'].includes(area));
const { ctx, L, errors } = await buildWorld({ season: winter ? 'winter' : 'summer',
  skip: ['traffic', 'people', 'wildlife', 'metro', 'drive'] });
assert.deepEqual(errors, []);
if (winter) buildWinter(ctx);
const ph = ctx.physics, objects = ctx.knock.list, mesh = name => ctx.scene.getObjectByName(name);
const noSolid = (x,z,r=.38,y0=.26,y1=2.15) => !ph.columnBlocked(x,z,r,y0,y1);

if (['kolomna','narvsky'].includes(area)) {
  const victory = mesh('narva-winged-victory');
  assert(victory);
  victory.geometry.computeBoundingBox();
  const box = victory.geometry.boundingBox;
  assert(box.max.y+victory.position.y > 31 && box.max.y+victory.position.y < 31.4);
  assert(box.max.x-box.min.x > 3.5 && box.max.z-box.min.z > 5.7);
  assert(victory.geometry.index.count/3 < 4750 && victory.userData.lodFar === 850);
  for (let dist=-12; dist<=12; dist+=.25) {
    const x=-4329.2+Math.sin(victory.rotation.y)*dist, z=3510.4+Math.cos(victory.rotation.y)*dist;
    assert(noSolid(x,z,1.15,.3,3.2),'the gate passage is obstructed at '+dist);
  }
}
for (const {id,tree,arches,orbs,huts,snow} of KOLOMNA_SQUARES) {
  const shown = winter && L.inPlay(tree[0], tree[1]);
  assert.equal(!!mesh('holiday-'+id), shown, id);
  if (!shown) continue;
  for (const [kind,spots] of [['arch',arches],['bauble',orbs],['market-hut',huts]]) {
    for (const [x,z] of spots || []) {
      const o = objects.find(o => Math.hypot(o.x-x,o.z-z)<.01 && o.parts.some(p=>p.mesh?.name.startsWith('festive-'+kind)));
      assert(o, id+' lacks '+kind);
      if (kind==='arch') assert(noSolid(x,z), id+' arch opening blocked');
    }
  }
  if (snow) assert(objects.some(o=>o.kind==='snowman' && Math.hypot(o.x-snow[0],o.z-snow[1])<.01));
}
if (area !== 'narvsky') {
  const rink = mesh('new-holland-rink-ice');
  assert.equal(!!rink, winter);
  const boardCount = objects.filter(o => o.parts.some(p => p.mesh?.name.startsWith('holland-rink-boards'))).length;
  const garlands = objects.filter(o => o.parts.some(p => p.mesh?.name.startsWith('holland-rink-garlands')));
  assert.equal(garlands.length,winter ? 12 : 0);
  if (winter) {
    assert(boardCount > 55 && boardCount < 85);
    const pos = rink.geometry.attributes.position, index = rink.geometry.index, r = PITCHES.find(p => p.id==='w1011443504').polys[0].o;
    assert.equal(pos.count, r.length/2);
    let samples = 0;
    for (let i=0; i<index.count; i+=3) {
      const tri = [0,1,2].map(j=>index.getX(i+j));
      const x = rink.position.x + tri.reduce((a,v)=>a+pos.getX(v),0)/3;
      const z = rink.position.z + tri.reduce((a,v)=>a+pos.getZ(v),0)/3;
      assert(Math.abs(ph.groundHeight(x,z,.5)-rink.position.y)<1e-5,'visual and physical ice diverge');
      if (Math.hypot(x-rink.position.x,z-rink.position.z)<23) {
        assert(noSolid(x,z), 'rink interior obstructed'); samples++;
      }
    }
    assert(samples>=2);
    for (const i of [2,10]) {
      const j=2*i, dx=r[j+2]-r[j], dz=r[j+3]-r[j+1], len=Math.hypot(dx,dz);
      const x=r[j]+dx*.5, z=r[j+1]+dz*.5;
      for (let d=-2;d<=2;d+=.25) assert(noSolid(x-dz/len*d,z+dx/len*d,.52), 'closed rink entrance');
    }
    for (const o of garlands) assert(o.items.every(c=>c.source===o.src));
  } else assert.equal(boardCount,0);
  const fountains = ctx.services.landmarksNikolsky?.fountains || [];
  for (const f of fountains) {
    if (winter) assert(ph.groundHeight(f.x,f.z,.5) > .38, 'snow cover underfoot');
    else assert.equal(ph.waterLevel(f.x,f.z),.36);
  }
  if (winter) assert.equal(ctx.services.liveFountains?.records?.length || 0,0);
}
if (area === 'kolomna') {
  document.body.classList = { toggle() {}, add() {}, remove() {}, contains: () => false };
  ctx.audio = { context: null, muted: true, play() {} };
  ctx.ui = { toast() {}, modalOpen: false };
  const player = new Player(ctx.camera,{ addEventListener() {}, requestPointerLock() {} },ph,L.WORLD.play);
  player.enabled=true; player.clampXZ=L.clampToPlay; player.solidAt=L.insideBuilding;
  ctx.playerObj=player; ctx.interact=createInteract({ camera:ctx.camera, player, ui:ctx.ui, doc:null });
  await buildDrive(ctx);
  const boat=ctx.drive.boats.find(v=>v.id==='boat-kolomna');
  assert(boat);
  assert.equal(boat.def.labelEn, winter ? 'Ride snowmobile' : 'Get in the motor boat');
  const p=boat.parked, lvl=ph.waterLevel(p.x,p.z);
  assert(Number.isFinite(lvl) && Math.abs(p.y-lvl)<.5);
  const target=ctx.interact.list().find(d=>d.id==='drive-boat-boat-kolomna');
  const at=target.at(), candidates=[];
  for (let dx=-6; dx<=6; dx+=.20) for (let dz=-6; dz<=6; dz+=.20) {
    const x=p.x+dx,z=p.z+dz,h=ph.groundHeight(x,z,1,false);
    if (!Number.isFinite(h) || h<lvl+.02 || !noSolid(x,z,.28,h+.18,h+1.75)) continue;
    const d=Math.hypot(x-at.x,h+1.2-at.y,z-at.z);
    if (d>=target.radius || ph.waterLevel(x,z)!=null) continue;
    const length=Math.hypot(dx,dz);
    const sx=dx/length, sz=dz/length;
    if ([0,1,2,3,4].every(t=>ph.waterLevel(x+sx*t,z+sz*t)==null && noSolid(x+sx*t,z+sz*t,.32,h+.18,h+1.75))) {
      candidates.push({x,z,h,d,sx,sz});
    }
  }
  const shore=candidates.sort((a,b)=>a.d-b.d)[0];
  assert(shore,'no dry boarding position within interaction reach');
  const yaw=Math.atan2(shore.sx,shore.sz)*180/Math.PI;
  player.setPose(shore.x+shore.sx*4,shore.z+shore.sz*4,yaw,0,shore.h,{stand:true});
  player.keys.add('KeyW');
  for (let i=0;i<180 && Math.hypot(player.pos.x-shore.x,player.pos.z-shore.z)>.08;i++) player.update(1/60);
  player.keys.clear();
  assert(Math.hypot(player.pos.x-shore.x,player.pos.z-shore.z)<.08,'walker cannot approach the mooring');
  ctx.camera.lookAt(at.x,at.y,at.z); player.inputLock=0;
  assert.equal(ctx.interact.update()?.id,target.id);
  assert(ctx.interact.use() && ctx.drive.vehicle===boat);
  ctx.drive.sim(3,{thr:.75});
  assert(Math.hypot(boat.car.x-p.x,boat.car.z-p.z)>5,'craft cannot leave its mooring');
  assert.equal(ph.waterLevel(boat.car.x,boat.car.z),lvl);
  assert(ctx.drive.exit(true));
}
console.log('PASS',area,winter ? 'winter' : 'summer');
