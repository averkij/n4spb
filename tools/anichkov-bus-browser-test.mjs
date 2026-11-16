// Rendered production vehicles crossing the real Anichkov deck, with its real colliders.
// Default: small authoring scene. --normal: full fresh baked city. --base URL: deployed city.
// --baseline REV serves only the frozen vehicle physics from that revision and expects the old stalls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
import {handleBakedRevision,ENDPOINT} from './lib/dev-revision.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),args={};
for(let i=2;i<process.argv.length;i++){
 const name=process.argv[i];
 if(name==='--normal')args.normal=true;
 else if(['--base','--baseline','--out'].includes(name)){const value=process.argv[++i];assert(value&&!value.startsWith('--'));args[name.slice(2)]=value;}
 else throw Error(`Unknown argument ${name}`);
}
assert(!(args.baseline&&(args.normal||args.base)),'baseline override is an isolated diagnostic only');
const out=path.resolve(root,args.out||'shots/anichkov-bus-browser');fs.mkdirSync(out,{recursive:true});
const frozen=new Map();
if(args.baseline)for(const file of ['src/world/drive/collision.js','src/world/drive/handling.js','src/world/drive/vehicle-profiles.js'])frozen.set('/'+file,execFileSync('git',['show',`${args.baseline}:${file}`],{windowsHide:true}));
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 if(handleBakedRevision(req,res,root))return;
 const pathname=new URL(req.url,'http://local').pathname;
 if(frozen.has(pathname)){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end(frozen.get(pathname));}
 const file=path.join(root,pathname==='/'?'index.html':decodeURIComponent(pathname));
 fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(error?'':data);});
});
if(!args.base)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=new URL(args.base||`http://127.0.0.1:${server.address().port}/index.html`);
if(!url.pathname.endsWith('.html'))url.pathname=url.pathname.replace(/\/$/,'')+'/index.html';
for(const [key,value] of Object.entries({q:'medium',guard:'0',gate:'0',gates:'0'}))url.searchParams.set(key,value);
// Isolate bridge geometry from moving queues accumulating between the eight
// repeated crossings. Keep the fresh baked city, parked cars and all colliders.
if(args.normal||args.base)url.searchParams.set('tr','nomove');
if(!args.normal&&!args.base)for(const [key,value] of Object.entries({only:'environment,streets,landmarksC,drive',baked:'0',noroof:'1'}))url.searchParams.set(key,value);
const executablePath=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser=await puppeteer.launch({executablePath,headless:true,protocolTimeout:180000,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
const results=[],errors=[];let page;
try{
 page=await browser.newPage();await page.setViewport({width:1440,height:900});
 await (await import('./font-transport.mjs')).installFontTransport(page);
 if(!args.base){await page.setRequestInterception(true);page.on('request',req=>{
  const match=/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());
  if(match){const file=path.join(root,'node_modules/three',match[1].split('?')[0]);if(fs.existsSync(file))return req.respond({status:200,contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(file)});}
  req.continue();
 });}
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('response',r=>{const p=new URL(r.url()).pathname;if(r.status()>=400&&!p.endsWith('/favicon.ico')&&!(args.base&&r.status()===404&&p.endsWith(ENDPOINT)))errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(url.href,{waitUntil:'load',timeout:180000});
 await page.waitForFunction(()=>document.body.classList.contains('loaded')&&window.__ctx?.characters?.ready&&__ctx.services.landmarksC?.bridge,{timeout:180000});
 if(args.normal||args.base)assert(await page.evaluate(()=>!!__ctx.baked));
 await page.click('#go');await page.waitForFunction(()=>getComputedStyle(document.getElementById('intro')).visibility==='hidden');await page.evaluate(()=>document.exitPointerLock());
 await page.evaluate(async()=>{const F=await import('./src/world/landmarksC/frame.js');await __ctx.regions?.ensureAt(F.CX,F.CZ);});
 for(const kind of ['bus','artic'])for(const direction of [1,-1])for(const reverse of [false,true]){
  const name=`${kind}-${direction===1?'east':'west'}-${reverse?'reverse':'forward'}`;
  const start=await page.evaluate(async({kind,direction,reverse})=>{
   const F=await import('./src/world/landmarksC/frame.js'),{ARCH}=await import('./src/world/traffic/fleetdata.js'),{carContact}=await import('./src/world/drive/collision.js');
   const d=__ctx.drive,a=ARCH[kind],spec={...a,W:a.wid,centerZ:(a.front+a.rear)/2},yaw=Math.atan2(F.CU,F.SU)+(direction===1?0:Math.PI)+(reverse?Math.PI:0);
   if(d.active){const park=F.toWorld(350+(kind==='bus'?0:40),50);d.teleport(park.x,park.z,0);d.exit(true);}
   let lane=null;
   for(const v of [6,-6,10,-10,2,-2,0]){
    let clear=true;
    for(let u=-46;u<=46&&clear;u+=2){const p=F.toWorld(u,v),car={...p,y:Math.abs(u)<=F.EXT?F.yDeck(u)+.03:.03,yaw};
     for(const b of __ctx.physics.querySolids(p.x,p.z,spec.len/2+Math.abs(spec.centerZ)+2))if(b.type!=='ramp'&&b.type!=='walk'&&carContact(car,spec,b)){clear=false;break;}
    }
    if(clear){lane=v;break;}
   }
   if(lane===null)throw Error('No clear bridge corridor; traffic fixture is obstructed');
   const p=F.toWorld(-direction*46,lane),ok=d.arrive({id:`traffic-car-${kind==='bus'?91000:91001}`,kind:'traffic',traffic:{model:kind,color:'#5fc4b8',plate:7},view:0},p.x,p.z,yaw*180/Math.PI-180);
   if(!ok)throw Error('Could not place the test bus on the approach');
   d.teleport(p.x,p.z,yaw);window.__crossing={F,d,direction,reverse,lane,startU:-direction*46,maxY:d.car.y,hits:[],elapsed:0,lastU:-direction*46,still:0};
   return{lane,start:F.toUV(d.car.x,d.car.z),yaw};
  },{kind,direction,reverse});
  let end,crest=false;
  for(let step=0;step<400;step++){
   end=await page.evaluate(fullCity=>{const q=__crossing,{d,F}=q;
    // The integrated scene has the surrounding road cambers.
    // Follow the clear lane using steering input; do not expect an unattended
    // zero-steer bus to retain centimetre accuracy over the entire approach.
    let steer=0;if(fullCity){const p=F.toUV(d.car.x,d.car.z),target=F.toWorld(p.u+q.direction*12,q.lane),yaw=Math.atan2(target.x-d.car.x,target.z-d.car.z)+(q.reverse?Math.PI:0),error=Math.atan2(Math.sin(yaw-d.car.yaw),Math.cos(yaw-d.car.yaw));steer=Math.max(-.25,Math.min(.25,error*2))*(q.reverse?-1:1);}
    d.sim(.1,{...(q.reverse?{brk:.7}:{thr:.7}),steer},(_,car)=>{q.maxY=Math.max(q.maxY,car.y);for(const e of car.events)if(e.type==='hit'&&q.hits.length<20)q.hits.push({v:e.v,type:e.obstacle?.type,u:F.toUV(car.x,car.z).u});});q.elapsed+=.1;const p=F.toUV(d.car.x,d.car.z);q.still=Math.abs(p.u-q.lastU)<.002?q.still+.1:0;q.lastU=p.u;return{...p,y:d.car.y,slope:d.car.slope,pitch:d.car.pitch,speed:d.car.speed,elapsed:q.elapsed,maxY:q.maxY,hits:q.hits,crossed:p.u*q.direction>=46,stalled:q.still>3};},!!(args.normal||args.base));
   if(!crest&&Math.abs(end.u)<2){crest=true;await page.screenshot({path:path.join(out,name+'-crest.png')});}
   if(end.crossed||end.stalled)break;
  }
  await page.screenshot({path:path.join(out,name+'-end.png')});
  results.push({kind,direction,reverse,...start,...end});console.log(JSON.stringify(results.at(-1)));
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:false,url:url.href,baseline:args.baseline,results,errors},null,2));
  if(args.baseline)assert(!end.crossed,`${name}: reproduce the old bridge stall`);
  else {assert(end.crossed,`${name}: crosses the complete bridge`);assert(end.maxY>1.3,`${name}: follows the raised deck`);assert(Math.abs(end.v-start.lane)<.3,`${name}: stays in its lane`);}
 }
 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__errors||[]),[]);
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,url:url.href,baseline:args.baseline,results,errors},null,2));
 console.log(args.baseline?'PASS old bus bridge stalls reproduced':'PASS buses cross Anichkov in both directions, forward and reverse');
}catch(error){if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:false,url:url.href,baseline:args.baseline,results,errors,error:error.stack},null,2));throw error;}
finally{await browser.close();if(server.listening)await new Promise(r=>server.close(r));}
