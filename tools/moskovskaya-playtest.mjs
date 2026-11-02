// Normal shipping page, real input, full modules/streaming. Camera hooks only
// place a walking player beside actual vehicles and named viewpoints.
// node tools/moskovskaya-playtest.mjs (GPU: run serially)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import { handleBakedRevision } from './lib/dev-revision.mjs';
import { installFontTransport } from './font-transport.mjs';
import { REGISTRY } from '../src/areas/registry.js';
import { EDGE_DIRS } from '../src/core/gates.js';
import { edgeLens } from './lib/edge-geometry.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'shots/moskovskaya-playtest');
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  if(handleBakedRevision(req,res,root))return;
  const f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!f.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(f,(err,b)=>{if(err){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(b);});
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const exe=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser=await puppeteer.launch({executablePath:exe,headless:true,protocolTimeout:300000,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--enable-webgl','--disable-gpu-sandbox','--no-first-run'],defaultViewport:{width:1280,height:720}});
const report={checks:[],errors:[],screenshots:[]},sleep=ms=>new Promise(r=>setTimeout(r,ms));
function check(name,ok,detail){report.checks.push({name,ok,detail});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?' '+JSON.stringify(detail):''}`);assert(ok,name);}
const page=await browser.newPage();
await installFontTransport(page,true);
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',m=>{if(/^\[module\s|Shader Error|CONTEXT_LOST/.test(m.text()))report.errors.push(m.text());});
async function hold(keys,ms){for(const k of keys)await page.keyboard.down(k);try{await sleep(ms);}finally{for(const k of keys)await page.keyboard.up(k);}}
async function state(){return page.evaluate(()=>{const d=__drive,c=d.car,p=__ctx.playerObj;return{active:d.active,id:d.vehicle?.id,x:c.x,z:c.z,y:c.y,kmh:c.speed,yaw:c.yaw,view:d.viewIndex,player:{x:p.pos.x,y:p.pos.y,z:p.pos.z,fly:p.fly},water:__ctx.physics.waterLevel(c.x,c.z)};});}
async function beside(id){
  const prompt=await page.evaluate(async id=>{
    const ctx=__ctx,v=__drive.vehicles.find(v=>v.id===id);if(!v)throw Error('missing '+id);
    const p=v.parked,b=v.def.boarding||{x:0,z:v.spec.centerZ},s=Math.sin(p.yaw),c=Math.cos(p.yaw),side=v.def.boarding?b.x+1.8:v.spec.W/2+1.5;
    const x=p.x+c*side+s*b.z,z=p.z-s*side+c*b.z;
    await ctx.regions?.ensureAt(x,z);__setCam(x,null,z,0,0);
    const dx=p.x+c*b.x+s*b.z-x,dz=p.z-s*b.x+c*b.z-z;
    __setCam(x,null,z,Math.atan2(-dx,-dz)*180/Math.PI,Math.atan2(p.y+.8-__camera.position.y,Math.hypot(dx,dz))*180/Math.PI);ctx.gates?.teleported();
    return v.kind==='boat'?'drive-boat-'+id:'drive-'+id;
  },id);
  await page.waitForFunction(id=>__ctx.interact.target?.id===id&&document.getElementById('interact')?.classList.contains('show'),{timeout:10000},prompt);
  check('visible E boarding prompt '+id,true);
  await page.keyboard.press('KeyE');
  await page.waitForFunction(id=>__drive.active&&__drive.vehicle.id===id,{timeout:8000},id);
  check('E boards '+id,(await state()).active);
}
async function exit(){await hold(['Space'],4000);check('braking reaches exit speed',(await state()).kmh<.8);await page.keyboard.press('KeyE');await page.waitForFunction(()=>!__drive.active,{timeout:8000});check('E exits to walking',!(await state()).player.fly);await page.keyboard.press('KeyR');await sleep(700);}
async function walkTo(x,z){
  const deadline=Date.now()+20000;let current;
  try{
    while(Date.now()<deadline){
      current=(await state()).player;const dx=x-current.x,dz=z-current.z;
      if(Math.hypot(dx,dz)<.35)break;
      await page.evaluate(yaw=>{__ctx.playerObj.yaw=yaw;__ctx.playerObj.pitch=0;},Math.atan2(-dx,-dz));
      await page.keyboard.down('KeyW');await sleep(60);
    }
  }finally{await page.keyboard.up('KeyW');}
  current=(await state()).player;check('real walking waypoint '+x+','+z,!current.fly&&Math.hypot(x-current.x,z-current.z)<.45&&current.y>-5,current);
  return current;
}
async function hop(from,to){
  const ps=edgeLens(REGISTRY[from].play,REGISTRY[to].play,{backMax:0}).points;
  const stride=Math.max(1,Math.floor(ps.length/180)),candidates=ps.filter((_,i)=>i%stride===0).map(p=>({...p,d:EDGE_DIRS[p.k]}));
  const route=await page.evaluate(candidates=>{
    const {L,physics:ph}=__ctx;
    for(const p of candidates){
      const [dx,dz]=p.d,x=p.x-60*dx,z=p.z-60*dz;
      if(!L.nearestRoad(x,z,{drivable:true,maxDist:24}))continue;
      let good=true;
      for(let d=0;d<=64;d+=2){const qx=x+dx*d,qz=z+dz*d;if(!L.inPlay(qx,qz)||L.insideBuilding(qx,qz,.55)||Math.abs(L.heightAt(qx,qz))>.1||ph.columnBlocked(qx,qz,.45,0,1.8)){good=false;break;}}
      if(good)return{x,z,px:p.x,pz:p.z,yaw:Math.atan2(-dx,-dz)*180/Math.PI};
    }
    return null;
  },candidates);
  check('clear real walking approach '+from+' → '+to,!!route,route);
  await page.evaluate(async r=>{await __regions.ensureAt(r.x,r.z);__setCam(r.x,null,r.z,r.yaw,0);__ctx.gates.teleported();},route);
  await sleep(4000);
  const nav=page.waitForNavigation({waitUntil:'load',timeout:90000});
  await page.keyboard.down('KeyW');
  try{await nav;await page.waitForFunction(()=>document.body.classList.contains('playing')||!!document.getElementById('fatal'),{timeout:300000});}finally{await page.keyboard.up('KeyW');}
  const arrival=await page.evaluate(()=>({area:__ctx.area.ID,baked:__ctx.baked?.manifest?.area,pose:{x:__ctx.playerObj.pos.x,z:__ctx.playerObj.pos.z},fatal:document.getElementById('fatal')?.innerText}));
  check('normal baked walking hand-off '+from+' → '+to,arrival.area===to&&arrival.baked===to&&!arrival.fatal&&Math.hypot(arrival.pose.x-route.px,arrival.pose.z-route.pz)<100,arrival);
}
try{
  const t=Date.now();await page.goto(`http://127.0.0.1:${server.address().port}/moskovskaya.html?q=medium`,{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>document.body.classList.contains('loaded')||!!document.getElementById('fatal'),{timeout:300000});
  report.loadSeconds=(Date.now()-t)/1000;
  const boot=await page.evaluate(()=>({fatal:document.getElementById('fatal')?.innerText,area:__ctx.area.ID,baked:__ctx.services.baked,manifest:__ctx.baked?.manifest?.area,modules:Object.keys(__stats.modules),errors:window.__errors||[],fountain:__ctx.physics.waterLevel(-1618.5,7071.9)}));
  check('full page uses fresh normal shipping bake',!boot.fatal&&boot.area==='moskovskaya'&&boot.manifest==='moskovskaya'&&boot.baked?.revision&&boot.baked.failures.length===0,boot.baked);
  check('population, city and transport modules built', ['city','people','traffic','drive'].every(n=>boot.modules.includes(n))&&boot.errors.length===0);
  check('shallow fountain retains physical water after baked hydration',boot.fountain===.29,boot.fountain);
  await page.click('#go');await page.waitForFunction(()=>document.body.classList.contains('playing'));await sleep(1000);
  const a=(await state()).player;await hold(['KeyW'],1200);const b=(await state()).player;check('walking responds in integrated park',Math.hypot(a.x-b.x,a.z-b.z)>1);
  const ids=await page.evaluate(()=>__drive.vehicles.map(v=>({id:v.id,kind:v.kind})));
  check('station-less area has one purple Zhiguli',ids.filter(v=>v.kind!=='boat').length===1&&ids.some(v=>v.id==='lada'),ids);
  await beside('lada');const car=await state();await hold(['KeyW'],2200);const driven=await state();check('Zhiguli accelerates and moves',Math.hypot(driven.x-car.x,driven.z-car.z)>3&&driven.kmh>3,driven);await page.keyboard.press('KeyV');await sleep(200);await exit();
  const boat=ids.find(v=>v.kind==='boat').id;await beside(boat);const start=await state();await hold(['KeyW'],6500);const sailed=await state();check('motorboat sails on real park water',Math.hypot(sailed.x-start.x,sailed.z-start.z)>8&&sailed.water!==null,sailed);await hold(['KeyW','KeyA'],1200);check('boat steering changes heading',Math.abs((await state()).yaw-sailed.yaw)>.02);await page.keyboard.press('KeyV');await exit();
  await page.evaluate(async()=>{await __regions.ensureAt(-1795,7452);__setCam(-1795,null,7452,90,0);__ctx.gates.teleported();});
  const entrance=await walkTo(-1815,7452);check('library steps reach raised colonnade',entrance.y>1.3&&entrance.y<1.65,entrance);
  await walkTo(-1795,7452);
  await page.evaluate(async()=>{await __regions.ensureAt(-1232.9,7685.3);__setCam(-1232.9,null,7685.3,0,0);__ctx.gates.teleported();});
  await walkTo(-1232.9,7667);await walkTo(-1232.9,7685.3);
  check('Basseynaya pilotis crosses in both directions on the normal baked page',Math.abs((await state()).player.y)<.1);
  await page.screenshot({path:path.join(out,'basseynaya-pilotis.png')});report.screenshots.push('basseynaya-pilotis.png');
  await page.evaluate(async()=>{await __regions.ensureAt(-1760,7456);__setCam(-1760,4,7456,90,10);});
  const fountainBefore=await page.evaluate(()=>Array.from(__ctx.dynamicRoot.children.find(m=>m.name==='rnb-water-droplets').instanceMatrix.array));await sleep(600);
  check('integrated fountain droplets move',await page.evaluate(before=>__ctx.dynamicRoot.children.find(m=>m.name==='rnb-water-droplets').instanceMatrix.array.some((v,i)=>v!==before[i]),fountainBefore));
  await page.evaluate(async()=>{await __regions.ensureAt(-1736.3,7401);__setCam(-1736.3,null,7401,0,0);__ctx.gates.teleported();});
  await walkTo(-1736.3,7398.3);const down=await walkTo(-1736.8,7382.9);
  check('underpass stairs descend to actual tunnel floor',down.y<-3.5&&down.y>-4.1,down);
  for(const [x,z] of [[-1725,7382.6],[-1713,7382.3],[-1701,7382.0],[-1691.2,7381.8]])await walkTo(x,z);
  await page.screenshot({path:path.join(out,'library-underpass-inside.png')});report.screenshots.push('library-underpass-inside.png');
  await walkTo(-1690.8,7397.3);const up=await walkTo(-1690.8,7400);
  check('underpass east exit returns to street height',Math.abs(up.y)<.25,up);
  for(const key of ['Place.victory-park','Place.rnb-moskovsky','Place.house-with-spire','Place.strugatsky','Place.chesme']){
    await page.evaluate(async key=>{const v=__ctx.L.VIEWS.find(v=>v.key===key);await __regions.ensureAt(v.x,v.z);__setCam(v.x,null,v.z,v.yaw,v.pitch);__ctx.gates?.teleported();},key);await sleep(400);
    const file=key.replace('Place.','')+'.png';await page.screenshot({path:path.join(out,file)});report.screenshots.push(file);
  }
  check('teleported destinations load without failed regions',await page.evaluate(()=>__regions.stats.failed===0));
  if(process.argv.includes('--hops')){await hop('moskovskaya','semyonovsky');await hop('semyonovsky','moskovskaya');}
  check('no module or browser errors',report.errors.length===0,report.errors);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r));}
