// Synthetic hydraulic topology, using the real waterGeo builder and queries.
// node tools/water-join-topology-test.mjs
// A 25 m source edge is shore for 5 m and an open regional join for 20 m;
// a separate dry island has a genuine shore exactly on that same clip line.
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {pathToFileURL} from 'node:url';
const rect=(x0,z0,x1,z1)=>[x0,z0,x1,z0,x1,z1,x0,z1];
const rings=[rect(-10,-15,0,10),rect(0,-10,10,10),
 rect(-10,15,10,20),rect(-10,25,10,35),rect(-10,20,0,25),rect(5,20,10,25)];
const hole=rect(0,20,5,25),source={RIVER:[{id:'fixture',key:'moat',polys:rings.map(o=>({o,h:[]}))}],
 WATER:[{id:'island',polys:[{o:rect(-10,15,10,35),h:[hole]}]}],EXTENT_RECTS:[{x0:0,x1:100,z0:-100,z1:100}]};
const tables={farCenter:[0,0],farRadius:1000,farSources:[],dataRings:[],keyByName:{},riverKeys:{},plugs:[],ownerRings:[],keepOut:[],bankRings:[],bridgeZones:[],bridgeShades:[],clipLines:[],forcedBanks:[],openMouths:[],channels:[],skipRiverNames:[],skipRiverKeys:[],dataWater:[],riverRings:{},slopeReaches:[]};
const dataUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const urls={
 [pathToFileURL(process.cwd()+'/src/world/data/city.js').href]:dataUrl(Object.entries(source).map(([k,v])=>`export const ${k}=${JSON.stringify(v)};`).join('\n')),
 [pathToFileURL(process.cwd()+'/src/world/lib/area-tables.js').href]:dataUrl(`export const WATER=${JSON.stringify(tables)};`)
};
register(dataUrl(`let urls;export function initialize(data){urls=data;}export async function resolve(s,c,next){const r=await next(s,c);return urls[r.url]?{...r,url:urls[r.url],shortCircuit:true}:r;}`),{parentURL:import.meta.url,data:urls});
const {waterGeo,waterwayAt}=await import('../src/world/environment/waterways.js');
const distance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);};
const nearest=(x,z)=>Math.min(...waterGeo().banks.flatMap(b=>b.pts.slice(1).map((p,i)=>distance(x,z,b.pts[i],p))));
assert.equal(waterwayAt(-.1,0),'moat');assert.equal(waterwayAt(.1,0),'moat');
assert(nearest(0,0)>9,'a partial shore retains the long regional edge across open water');
assert(nearest(0,-12.5)<1e-6,'the true shore portion of a mixed regional edge was erased');
assert(nearest(0,22.5)<1e-6,'the exact clip-line island edge was erased');
for(let x=.25;x<5;x+=.5)for(let z=20.25;z<25;z+=.5)assert.equal(waterwayAt(x,z),null,'gap repair floods an authoritative dry island');
console.log('PASS: mixed shore/open regional join is split; exact clip-line island shore retained; all100 island interior probes dry.');
