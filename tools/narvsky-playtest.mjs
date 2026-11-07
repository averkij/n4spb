// Normal baked integrated page, real keyboard input. Only positioning and
// destination preloading use hooks: no simulated movement, enter/exit or gates.
// GPU: run serially, after final bakes. node tools/narvsky-playtest.mjs
// Optional: --q medium --out shots/narvsky-playtest --skip-hops; --plan is CPU only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import { handleBakedRevision } from './lib/dev-revision.mjs';
import { installFontTransport } from './font-transport.mjs';
import { REGISTRY, GATES } from '../src/areas/registry.js';
import { EDGE_DIRS, createGateMachine } from '../src/core/gates.js';
import { edgeLens } from './lib/edge-geometry.mjs';
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf(k);return i<0?d:args[i+1];};
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.resolve(root,arg('--out','shots/narvsky-playtest'));
fs.mkdirSync(out,{recursive:true});
const report={area:'narvsky',quality:arg('--q','medium'),normalBake:true,checks:[],errors:[],network:[],screenshots:[],handoffs:[]},started=Date.now();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  if(handleBakedRevision(req,res,root))return;
  const f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!f.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(b);});
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,page,stage='launch';
const check=(name,ok,detail)=>{report.checks.push({name,ok,detail});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?' '+JSON.stringify(detail):''}`);assert(ok,name);};
async function hold(keys,ms){for(const k of keys)await page.keyboard.down(k);try{await sleep(ms);}finally{for(const k of keys)await page.keyboard.up(k);}}
async function state(){return page.evaluate(()=>{const d=__drive,c=d.car,p=__ctx.playerObj;return{area:__ctx.area.ID,active:d.active,id:d.vehicle?.id,x:c.x,z:c.z,y:c.y,speed:c.speed,yaw:c.yaw,player:{x:p.pos.x,y:p.pos.y,z:p.pos.z,fly:p.fly},water:__ctx.physics.waterLevel(c.x,c.z)};});}
async function shot(name){await page.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');}
async function place(x,z,yaw,pitch=0,y=null){await page.evaluate(async p=>{await __regions.ensureAt(p.x,p.z);__setCam(p.x,p.y,p.z,p.yaw,p.pitch);},{x,z,yaw,pitch,y});await sleep(200);}
async function beside(id){
  const prompt=await page.evaluate(async id=>{
    const ctx=__ctx,v=__drive.vehicles.find(v=>v.id===id);if(!v)throw Error('missing vehicle '+id);
    const p=v.parked,b=v.def.boarding||{x:0,z:v.spec.centerZ},s=Math.sin(p.yaw),c=Math.cos(p.yaw),side=v.def.boarding?b.x+1.8:v.spec.W/2+1.5;
    let x=p.x+c*side+s*b.z,z=p.z-s*side+c*b.z,bank=null;
    if(v.kind==='boat'){
      await ctx.regions.ensureAt(p.x,p.z);const water=ctx.physics.waterLevel(p.x,p.z);
      for(const r of [2.5,3.5,4.5,5.2]){for(let k=0;k<24;k++){
        const a=k*Math.PI/12,px=p.x+Math.cos(a)*r,pz=p.z+Math.sin(a)*r,y=ctx.physics.groundHeight(px,pz,10,false);
        const targetX=p.x+c*b.x+s*b.z,targetZ=p.z-s*b.x+c*b.z;
        const distance=Math.hypot(px-targetX,pz-targetZ,y+1.52-(p.y+.8));
        if(y>water+.15&&y<=.4&&distance<v.def.reach&&ctx.L.inPlay(px,pz)&&!ctx.L.insideBuilding(px,pz,.3)&&!ctx.physics.columnBlocked(px,pz,.3,y+.45,y+1.75)){bank={x:px,z:pz,y,distance};break;}
      }if(bank)break;}
      if(!bank)throw Error('No real bank/pontoon E boarding floor for '+id);
      x=bank.x;z=bank.z;
    }
    await ctx.regions.ensureAt(x,z);__setCam(x,null,z,0,0);
    const dx=p.x+c*b.x+s*b.z-x,dz=p.z-s*b.x+c*b.z-z;
    __setCam(x,null,z,Math.atan2(-dx,-dz)*180/Math.PI,Math.atan2(p.y+.8-__camera.position.y,Math.hypot(dx,dz))*180/Math.PI);
    return{id:v.kind==='boat'?'drive-boat-'+id:'drive-'+id,bank};
  },id);
  await page.waitForFunction(id=>__ctx.interact.target?.id===id&&document.getElementById('interact')?.classList.contains('show'),{timeout:10000},prompt.id);
  check('visible E boarding prompt '+id,true,prompt.bank);await shot(id+'-boarding');
  await page.keyboard.press('KeyE');
  await page.waitForFunction(id=>__drive.active&&__drive.vehicle.id===id,{timeout:8000},id);
  check('E boards '+id,(await state()).active);
}
async function brakeExitReset(label){
  await hold(['Space'],4000);const stopped=await state();
  check(label+' brakes to exit speed',Math.abs(stopped.speed)<.8,stopped);
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>!__drive.active,{timeout:8000});
  const exited=await state();check(label+' E exits to walking',!exited.active&&!exited.player.fly,exited.player);
  await page.keyboard.press('KeyR');await sleep(700);
  const reset=await page.evaluate(()=>({p:{x:__ctx.playerObj.pos.x,y:__ctx.playerObj.pos.y,z:__ctx.playerObj.pos.z,fly:__ctx.playerObj.fly},hero:__ctx.L.HERO}));
  check(label+' R returns walker to start',!reset.p.fly&&Math.hypot(reset.p.x-reset.hero.x,reset.p.z-reset.hero.z)<1,reset.p);
}
// A route must select the intended row with the REAL gate priority, before
// spending a browser load on it. Runtime receives only geometric candidates.
function hopCandidates(from,to){
  const ps=edgeLens(REGISTRY[from].play,REGISTRY[to].play,{backMax:0}).points;
  const stride=Math.max(1,Math.ceil(ps.length/160)),out=[];
  for(let i=0;i<ps.length;i+=stride){
    const p=ps[i],[dx,dz]=EDGE_DIRS[p.k],x=p.x-52*dx,z=p.z-52*dz;
    const machine=createGateMachine({gates:GATES.filter(g=>g.kind==='edge'&&g.from===from),config:{graceS:0}});
    for(let j=0;j<60;j++)machine.update({dt:1/30,x,z,mode:'walk',blocked:false});
    let selected;
    for(let j=0;j<440&&!selected;j++)selected=machine.update({dt:1/30,x:x+dx*j*.15,z:z+dz*j*.15,mode:'walk',blocked:false}).offer;
    if(selected?.to===to)out.push({x,z,px:p.x,pz:p.z,dx,dz,yaw:Math.atan2(-dx,-dz)*180/Math.PI,gate:selected.id});
  }
  return out;
}
async function hop(from,to){
  stage='handoff '+from+' -> '+to;
  const candidates=hopCandidates(from,to);
  const route=await page.evaluate(async candidates=>{
    const {L,physics:ph}=__ctx;
    for(const r of candidates){
      if(!L.nearestRoad(r.x,r.z,{drivable:true,maxDist:28}))continue;
      let clear=true;
      for(let d=0;d<=52;d+=2){const x=r.x+r.dx*d,z=r.z+r.dz*d;
        if(!L.inPlay(x,z)||L.insideBuilding(x,z,.55)||Math.abs(L.heightAt(x,z))>.1){clear=false;break;}}
      if(!clear)continue;
      await __regions.ensureAt(r.x,r.z);
      for(let d=0;d<=52;d+=2)if(ph.columnBlocked(r.x+r.dx*d,r.z+r.dz*d,.45,0,1.8)){clear=false;break;}
      if(clear)return r;
    }
    return null;
  },candidates);
  check('clear actual seam approach '+from+' -> '+to,!!route,route);
  await place(route.x,route.z,route.yaw);
  // Arrival grace and automatic teleport velocity hold remain unmodified.
  await sleep(6500);await shot(from+'-seam-approach');
  const t=Date.now(),nav=page.waitForNavigation({waitUntil:'load',timeout:45000});
  await page.keyboard.down('KeyW');
  try{await nav;await page.waitForFunction(()=>(document.body.classList.contains('playing')&&document.body.classList.contains('loaded'))||!!document.getElementById('fatal'),{timeout:90000});}
  finally{await page.keyboard.up('KeyW');}
  // The handoff resumes input before its loading veil finishes fading. Review
  // the destination after that visual transition, with the real world ready.
  await page.waitForFunction(()=>{const e=document.getElementById('intro');return !e||getComputedStyle(e).visibility==='hidden';},{timeout:10000});
  await page.waitForFunction(()=>{const e=document.getElementById('seam');return !e||!e.classList.contains('on');},{timeout:10000});
  await sleep(500);
  const arrived=await page.evaluate(()=>({area:__ctx.area.ID,baked:__ctx.baked?.manifest?.area,revision:__ctx.services.baked?.revision,failures:__ctx.services.baked?.failures,errors:window.__errors||[],fatal:document.getElementById('fatal')?.innerText,p:{x:__ctx.playerObj.pos.x,z:__ctx.playerObj.pos.z,fly:__ctx.playerObj.fly},url:location.href}));
  check('real normal-baked seam '+from+' -> '+to,arrived.area===to&&arrived.baked===to&&arrived.revision&&!arrived.failures?.length&&!arrived.errors.length&&!arrived.fatal&&!arrived.p.fly&&Math.hypot(arrived.p.x-route.px,arrived.p.z-route.pz)<100,arrived);
  report.handoffs.push({from,to,seconds:(Date.now()-t)/1000,route,arrival:arrived});await shot(to+'-seam-arrival');
}
if(args.includes('--plan')){
  console.log(JSON.stringify({quality:report.quality,normalBake:true,screenshotDirectory:out,seams:[['narvsky','kolomna'],['kolomna','narvsky']].map(([from,to])=>({from,to,candidates:hopCandidates(from,to).length})),input:['W walk through arch','E enter car/boat','W accelerate/navigate','A boat steering','Space brake','E exit','R respawn'],browserLaunched:false},null,2));
  await new Promise(r=>server.close(r));process.exit(0);
}
try{
  const exe=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
  browser=await puppeteer.launch({executablePath:exe,headless:true,protocolTimeout:120000,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--enable-webgl','--disable-gpu-sandbox','--no-first-run'],defaultViewport:{width:1280,height:720}});
  page=await browser.newPage();await installFontTransport(page,true);
  page.on('pageerror',e=>report.errors.push({stage,message:e.message}));
  page.on('console',m=>{if(m.type()==='error'||/Shader Error|CONTEXT_LOST|Failed to load baked/.test(m.text()))report.errors.push({stage,message:m.text()});});
  page.on('response',r=>{if(r.status()>=400&&/\.(?:js|json|bin|png|jpg|woff2)(?:\?|$)/.test(r.url()))report.network.push({stage,status:r.status(),url:r.url()});});
  stage='normal baked boot';const t=Date.now();
  await page.goto(`http://127.0.0.1:${server.address().port}/narvsky.html?q=${report.quality}`,{waitUntil:'load',timeout:90000});
  await page.waitForFunction(()=>document.body.classList.contains('loaded')||!!document.getElementById('fatal'),{timeout:120000});
  report.loadSeconds=(Date.now()-t)/1000;
  const boot=await page.evaluate(()=>({fatal:document.getElementById('fatal')?.innerText,area:__ctx.area.ID,baked:__ctx.services.baked,manifest:__ctx.baked?.manifest?.area,modules:Object.keys(__stats.modules),errors:window.__errors||[]}));report.boot=boot;
  check('fresh normal shipping bake',!boot.fatal&&boot.area==='narvsky'&&boot.manifest==='narvsky'&&boot.baked?.revision&&boot.baked.failures.length===0,boot.baked);
  check('full integrated modules', ['city','landmarksNarvsky','people','traffic','drive'].every(n=>boot.modules.includes(n))&&boot.errors.length===0,boot.modules);
  await page.click('#go');await page.waitForFunction(()=>document.body.classList.contains('playing'));await sleep(700);
  stage='walk through Narva arch';
  const gate=await page.evaluate(()=>{
    const f=__ctx.services.landmarksNarvsky.parts.gate,c=Math.cos(f.rot),s=Math.sin(f.rot);
    return{start:{x:f.x-s*8,z:f.z-c*8},end:{x:f.x+s*8,z:f.z+c*8},yaw:Math.atan2(-s,-c)*180/Math.PI};
  });
  await place(gate.start.x,gate.start.z,gate.yaw,12);
  await shot('narva-arch-approach');
  await page.keyboard.down('KeyW');let walked;
  try{const deadline=Date.now()+14000;while(Date.now()<deadline){walked=(await state()).player;const dx=gate.end.x-gate.start.x,dz=gate.end.z-gate.start.z;
    if((walked.x-gate.start.x)*dx+(walked.z-gate.start.z)*dz>=dx*dx+dz*dz-6)break;await sleep(100);}}
  finally{await page.keyboard.up('KeyW');}
  check('actual W crosses the open arch',!walked.fly&&Math.hypot(walked.x-gate.end.x,walked.z-gate.end.z)<1.5&&Math.abs(walked.y)<.2,walked);
  await shot('narva-arch-through');
  stage='purple Lada input';
  const ids=await page.evaluate(()=>__drive.vehicles.map(v=>({id:v.id,kind:v.kind})));
  check('one purple Zhiguli in station-less area',ids.filter(v=>v.kind!=='boat').length===1&&ids.some(v=>v.id==='lada'),ids);
  await beside('lada');const car=await state();await hold(['KeyW'],2000);const driven=await state();
  check('W accelerates the Lada',Math.hypot(driven.x-car.x,driven.z-car.z)>3&&Math.abs(driven.speed)>3,driven);await shot('lada-driving');await brakeExitReset('Lada');
  stage='harbour boat input';const boat=ids.find(v=>v.kind==='boat');check('harbour boat is available',!!boat,ids);
  await beside(boat.id);const initial=await state();await hold(['KeyW'],4500);const sailed=await state();
  check('W navigates actual harbour water for30m',Math.hypot(sailed.x-initial.x,sailed.z-initial.z)>30&&Math.abs(sailed.speed)>10&&sailed.water!==null,sailed);
  await hold(['KeyW','KeyA'],1100);check('boat steering changes heading',Math.abs((await state()).yaw-sailed.yaw)>.15);await shot('harbour-boat-driving');await brakeExitReset('boat');
  stage='integrated landmark review';
  for(const [key,file] of [['Place.narva-gate','narva-gate-street'],['Place.gorky-palace','gorky-palace-street']]){
    const v=await page.evaluate(key=>__ctx.L.VIEWS.find(v=>v.key===key),key);await place(v.x,v.z,v.yaw,v.pitch);await sleep(400);await shot(file);
  }
  // This registered street viewpoint is outside mapped building footprints.
  await place(-4277,3571,40,6,8);await sleep(400);await shot('narvsky-context-skyline');await page.keyboard.press('KeyR');await sleep(500);
  check('teleport destinations load without failed regions',await page.evaluate(()=>__regions.stats.failed===0));
  if(!args.includes('--skip-hops')){await hop('narvsky','kolomna');await hop('kolomna','narvsky');}
  check('no browser, module or asset failures',report.errors.length===0&&report.network.length===0,{errors:report.errors,network:report.network});
}catch(e){report.failure={stage,message:e.message,stack:e.stack};console.error('FAIL',stage,e.stack);if(page)try{await shot('failure');}catch{}process.exitCode=1;}
finally{report.seconds=(Date.now()-started)/1000;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));if(browser)await browser.close();await new Promise(r=>server.close(r));console.log('report',path.join(out,'report.json'),report.seconds.toFixed(1)+'s');}
