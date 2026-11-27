// node tools/area.mjs {okrug65|komendantsky|islands} tools/northwest-winter-test.mjs [--summer]
import assert from 'node:assert/strict';
import { buildWorld } from './lib/headless-world.mjs';
import { buildWinter } from '../src/world/winter.js';
import { NORTHWEST_SQUARES } from '../src/world/winter-northwest.js';
import { PITCHES } from '../src/world/data/city.js';
import { SITES } from '../src/world/landmarksOkrug65/sites.js';
import { inRing } from '../src/world/city/kit.js';
import { ringFromFlat } from '../src/world/lib/massing.js';

const area = process.env.AREA, winter = !process.argv.includes('--summer');
assert(['okrug65','komendantsky','islands'].includes(area));
const {ctx,L,THREE,errors} = await buildWorld({season:winter?'winter':'summer',
  skip:['traffic','people','wildlife','metro','drive']});
assert.deepEqual(errors,[]);
if (winter) buildWinter(ctx);
const ph=ctx.physics, mesh=n=>ctx.scene.getObjectByName(n);
const fixtures=n=>ctx.knock.list.filter(o=>o.parts.some(p=>p.mesh?.name.startsWith(n)));
const open=(x,z,y=.29)=>!ph.columnBlocked(x,z,.36,y,y+1.65);
for (const {id,tree,arches,orbs,huts,snow} of NORTHWEST_SQUARES) {
  const visible=winter && L.inPlay(tree[0],tree[1]);
  assert.equal(!!mesh('holiday-'+id),visible,id);
  if (!visible) continue;
  for (const [kind,spots] of [['arch',arches],['bauble',orbs],['market-hut',huts]]) {
    for (const [x,z] of spots || []) {
      assert(fixtures('festive-'+kind).some(o=>o.x===x && o.z===z),id+' '+kind);
      if (kind==='arch') assert(open(x,z),id+' arch passage');
    }
  }
  if (snow) assert(ctx.knock.list.some(o=>o.kind==='snowman' && o.x===snow[0] && o.z===snow[1]));
}
if (area==='islands') {
  const vases=[];
  ctx.scene.traverse(o=>{if(o.name==='yel-vase') vases.push(o);});
  assert.equal(new Set(vases.map(o=>[o.position.x,o.position.z].join(','))).size,4,'four stair vases');
  assert(vases.every(o=>winter ? o.geometry.index.count/3<400 : o.geometry.index.count/3>4000));
  const rink=mesh('yelagin-rink-ice');
  assert.equal(!!rink,winter);
  // Five full lighting runs cross the measured, clipped square.
  assert.equal(fixtures('yelagin-rink-garlands').length,winter?10:0);
  if (rink) {
    const outer=ringFromFlat(PITCHES.find(p=>p.id==='r19991039').polys[0].o);
    assert(fixtures('yelagin-rink-boards').length>70);
    for(const i of [9,6]) {
      const [ax,az]=outer[i], [bx,bz]=outer[(i+1)%outer.length], len=Math.hypot(bx-ax,bz-az);
      for(let d=-2;d<=2;d+=.25)
        assert(open((ax+bx)/2+(bz-az)/len*d,(az+bz)/2-(bx-ax)/len*d),'rink entrance '+i);
    }
    for(const x of [-4760,-4720]) {
      assert(open(x,-5388),'skating lane');
      assert(Math.abs(ph.groundHeight(x,-5388,.5)-rink.position.y)<1e-5);
    }
    for(const [x,z] of NORTHWEST_SQUARES.find(s=>s.id==='yelagin-grand-square').huts)
      assert(!inRing(outer,x,z),'market stall on ice');
  }
}
if (area==='komendantsky') {
  const towers=fixtures('dolgoe-concert-lights');
  assert.equal(towers.length,winter?2:0);
  assert.equal(fixtures('dolgoe-concert-stage').length,winter?1:0);
  if(winter) {
    assert.equal(ph.groundHeight(-4584,-9324,.5),.25);
    assert(open(-4584,-9324),'stage deck');
    const [first,other]=towers;
    assert(first.items.every(c=>c.source===first.src));
    assert(ctx.knock.hit(first.x,first.z,48,1,0,'lamp')===first);
    assert(other.items.every(c=>c.source===other.src));
  }
}
if(area==='okrug65') {
  assert.equal(fixtures('park300-wave').length,winter?2:0);
  const snow=mesh('snow-filled-r5255799');
  assert.equal(!!snow,winter);
  if(snow) {
    snow.updateMatrixWorld(true);
    const pool=SITES.find(s=>s.id==='r5255799').polys[0];
    const dry=ringFromFlat(pool.h[0]);
    const x=dry.reduce((n,p)=>n+p[0],0)/dry.length, z=dry.reduce((n,p)=>n+p[1],0)/dry.length;
    assert(inRing(dry,x,z));
    const ray=new THREE.Raycaster(new THREE.Vector3(x,2,z),new THREE.Vector3(0,-1,0));
    assert.equal(ray.intersectObject(snow).length,0,'lighthouse island stays dry');
    const pos=snow.geometry.attributes.position, indices=snow.geometry.index;
    const outer=ringFromFlat(pool.o);
    for(let j=0;j<indices.count;j+=3) {
      const vertices=[0,1,2].map(k=>indices.getX(j+k));
      const x=snow.position.x+vertices.reduce((n,v)=>n+pos.getX(v),0)/3;
      const z=snow.position.z+vertices.reduce((n,v)=>n+pos.getZ(v),0)/3;
      assert(inRing(outer,x,z) && !inRing(dry,x,z),'snow confined to basin');
    }
  }
}
console.log('PASS',area,winter?'winter':'summer');
