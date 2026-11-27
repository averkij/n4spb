// node tools/area.mjs <palace|admiralty|smolny|vladimirsky|strip> tools/central-metro-entrances-test.mjs [--winter]
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { buildWinter } from '../src/world/winter.js';
import { Player } from '../src/core/player.js';
import { DOORWAYS, PITS } from '../src/world/data/metro.js';
import { centralExtraDoors, centralMetroEntranceIds } from '../src/world/metro/central-locations.js';
import { buildCentralMetroEntrances } from '../src/world/metro/central-entrances.js';

const area = process.env.AREA || 'strip', historic = area === 'strip';
const season = process.argv.includes('--winter') ? 'winter' : 'summer';
const { ctx,L,THREE,errors } = await buildWorld({skip:['people','wildlife','traffic','drive','rail'], season});
assert.deepEqual(errors, []);
if (season === 'winter') buildWinter(ctx);
const service = ctx.services.centralMetroEntrances;
assert.ok(service?.doors.length, 'The normal page did not build the central entrances');
assert.equal(buildCentralMetroEntrances(ctx),service,'duplicate construction');
const expected = [...DOORWAYS,...centralExtraDoors].filter(d=>L.inPlay(d.x,d.z));
assert.deepEqual(service.doors.map(d=>d.id),expected.map(d=>d.id));
const admiral = service.doors.filter(d=>d.station==='admiralteyskaya');
if (admiral.length===3) assert.deepEqual(admiral.map(d=>[d.osm,d.kind]), [
  ['n5464315008','exit'],['n5464314991','entrance'],['n5464314995','entrance'],
]);
assert.deepEqual(service.pits.map(p=>p.id),PITS.filter(p=>L.inPlay(...p.mouth)).map(p=>p.id));
ctx.staticRoot.updateMatrixWorld(true);
const meshes=[];
ctx.staticRoot.traverse(o=>{if (o.isMesh && !o.isInstancedMesh) meshes.push(o);});
const ray = new THREE.Raycaster(); ray.layers.enableAll();
const problems=[];
const points=(d,side,depth)=>[d.x + side*Math.cos(d.rotY) + depth*Math.sin(d.rotY), d.z - side*Math.sin(d.rotY) + depth*Math.cos(d.rotY)];

function walk(points, limit=700) {
  const player=new Player(new THREE.PerspectiveCamera(),{addEventListener(){}},ctx.physics,L.WORLD.play);
  player.enabled=true; player.clampXZ=L.clampToPlay; player.solidAt=L.insideBuilding;
  player.setPose(...points[0]); player.keys.add('KeyW');
  let rescues=0; player.onRescue=()=>rescues++;
  const heights=[];
  for (const [x,z] of points.slice(1)) {
    let ticks=0;
    while (Math.hypot(player.pos.x-x,player.pos.z-z)>.14 && ticks++<limit) {
      player.yaw=Math.atan2(player.pos.x-x,player.pos.z-z); player.update(1/60);
    }
    assert.ok(ticks<limit, 'blocked towards '+[x,z].map(n=>n.toFixed(2))+' at '+player.pos.toArray().map(n=>n.toFixed(2)));
    heights.push(player.pos.y);
  }
  assert.equal(rescues,0,'player rescue');
  return heights;
}

for (const d of service.doors) {
  try {
    const group=ctx.staticRoot.getObjectByName('central-metro-'+d.id);
    const joinery=group?.children.find(c=>c.name.startsWith('Blender-'));
    assert.ok(joinery?.isMesh && joinery.geometry.attributes.color && joinery.material.vertexColors,'coloured Blender prototype');
    assert.ok(centralMetroEntranceIds.has(d.osm),'unclaimed OSM station door');
    const outside=points(d,0,d.steps ? .60+d.steps*.33+.50 : 1.65), inside=points(d,0,-1.45);
    if (d.steps) {
      const upper = .14 * d.steps + .112;
      const sample = depth => ctx.physics.groundHeight(...points(d,0,depth), upper, false);
      assert.ok(Math.abs(sample(.55)-upper)<.02,'gap between upper step and lobby');
      for (let i=0; i<d.steps; i++) {
        const depth=.60+(i+.5)*.33, expectedTop=.14*(d.steps-i-1)+.098;
        assert.ok(Math.abs(sample(depth)-expectedTop)<.02,'unsupported exterior step '+(i+1));
      }
    }
    const heights=walk([outside,points(d,0,.26),inside,points(d,0,.26),outside]);
    assert.ok(Math.abs(heights[1]-(d.steps||0)*.14)<.35,'unsupported lobby floor');
    if (historic && ['gostiny-in','gostiny-out'].includes(d.id)) {
      const sliding=ctx.staticRoot.getObjectByName('gostiny-portals');
      const bank=sliding?.children.find(g=>Math.hypot(g.position.x-d.x,g.position.z-d.z)<.1);
      assert.equal(bank?.children.length,4,'original automatic four-leaf door bank');
      ctx.camera.position.set(d.x,1.65,d.z);
      for (const update of ctx._updates) update(.5,ctx.time);
      bank.updateWorldMatrix(true,true);
      assert.ok(bank.children[2].position.x-bank.children[1].position.x>d.w*.70,'sliding doors did not open');
    }
    const normal=new THREE.Vector3(Math.sin(d.rotY),0,Math.cos(d.rotY));
    ray.set(new THREE.Vector3(d.x,1.57+(d.steps||0)*.14,d.z).addScaledVector(normal,1.30),normal.negate());
    ray.near=0;ray.far=2.70;
    const hit=ray.intersectObjects(meshes,false)[0];
    assert.ok(!hit,'visible panel in doorway at '+hit?.distance.toFixed(2)+' m ('+hit?.object.parent?.name+')');
    for (const side of [-.20,.20]) {
      const [x,z]=points(d,side*d.w,1.30);
      ray.set(new THREE.Vector3(x,4.04+(d.steps||0)*.14,z),normal);
      assert.ok(ray.intersectObjects(meshes,false).length,'open sky above doorway');
    }
  } catch(e) { problems.push(d.id+' '+e.message); }
}
for (const p of service.pits) {
  try {
    const at=t=>[p.mouth[0]+p.e[0]*t,p.mouth[1]+p.e[1]*t];
    for (const t of [.15,1.6,3.75]) {
      const [x,z]=at(t);
      ray.set(new THREE.Vector3(x,1.35,z),new THREE.Vector3(0,-1,0));
      ray.near=0; ray.far=5.0;
      const top=ray.intersectObjects(meshes,false)[0];
      assert.equal(top?.object.parent?.name,'central-metro-'+p.id,'paving covers stair at '+t);
    }
    const floor=walk([at(-.65),at(2),at(4.9),at(p.end-.45),at(4.9),at(2),at(-.65)]);
    assert.ok(floor[1]<-2.1 && floor[2]<-4.2 && floor.at(-1)>-.25,'stair levels '+floor.join(','));
    assert.ok(ctx.physics.columnBlocked(...at(4.49),.08,.3,.95),'rear edge guard');
    if(!historic) assert.ok(ctx.physics.columnBlocked(...at(p.end),.12,-4,-2.7),'bottom landing back wall');
  } catch(e) { problems.push(p.id+' '+e.message); }
}
if (historic) {
  assert.equal(ctx.services.metro.stations.filter(s=>expected.some(d=>d.station===s.id)).length,7);
  ctx.playerObj = new Player(ctx.camera,{addEventListener(){}},ctx.physics,L.WORLD.play);
  ctx.ui = {toast(){}};
  for (const [a,b] of [['vosstaniya','vladimirskaya'],['gostiny','mayakovskaya'],['dostoevskaya','ligovsky'],['nevsky','sennaya'],['admiralteyskaya','sportivnaya']]) {
    const ride = ctx.services.metro.ride(a,b);
    assert.ok(ride.seconds>0 && Number.isFinite(ride.seconds),'missing timetable '+a+' → '+b);
    const station = ctx.metro.stations[a];
    const network = ctx.services.metro.network.BY_ID;
    const track = station.platform.tracks.find(t=>t.dir===Math.sign(network[b].idx-network[a].idx));
    ctx.playerObj.setPose(station.frame.x,station.frame.z,0,0,station.frame.y+1.65);
    const train = ctx.metro.ride.board(station,track);
    assert.equal(train.legs[0].to.id,b);
    assert.ok(ctx.playerObj.ride);
    const leg = train.legs[0];
    const mid = ctx.metro.ride.carFrame(train,(leg.tDepart+leg.tArrive)/2);
    assert.ok(Number.isFinite(mid.x) && Number.isFinite(mid.z) && Number.isFinite(mid.y));
    ctx.time = leg.tOpen + .1;
    ctx.metro.ride.alight();
    assert.equal(ctx.metro.ride.session,null);
    assert.ok(!ctx.playerObj.ride);
  }
}
assert.deepEqual(problems,[]);
console.log(area,season,service.doors.length,'walkable door groups,',service.pits.length,'two-way stair runs'+(historic?', 7 stations and 5 live lines':''));
