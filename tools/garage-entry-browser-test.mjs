// Serial GPU check on the full city: actual E-key entry/exit for both rigs.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
import {handleBakedRevision} from './lib/dev-revision.mjs';
const normal=process.argv.includes('--normal'),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,normal?'shots/garage-entry-normal':'shots/garage-entry');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json'};
const server=http.createServer((req,res)=>{if(handleBakedRevision(req,res,root))return;const f=path.join(root,new URL(req.url,'http://local').pathname);fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});res.end(e?'':b);});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const executablePath=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser=await puppeteer.launch({executablePath,headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']}),errors=[],results=[];let page;
try{
 page=await browser.newPage();await page.setViewport({width:1440,height:900});await page.setRequestInterception(true);
 page.on('request',r=>{const m=/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(r.url());if(m){const f=path.join(root,'node_modules/three',m[1].split('?')[0]);if(fs.existsSync(f))return r.respond({status:200,contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(f)});}if(/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(r.url()))return r.abort();r.continue();});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/index.html?${normal?'':'baked=force&'}guard=0&gate=0`,{waitUntil:'load',timeout:180000});
 await page.waitForFunction(()=>document.body.classList.contains('loaded')&&__ctx.characters?.ready,{timeout:180000});if(normal)assert.equal(await page.evaluate(()=>!!__ctx.baked),true,'normal URL must load the fresh bake');await page.click('#go');await page.waitForFunction(()=>getComputedStyle(document.getElementById('intro')).visibility==='hidden');await page.evaluate(()=>document.exitPointerLock());
 for(const actor of [0,1])for(const id of ['coupe','lada']){
  await page.evaluate(async({actor,id})=>{
   const ctx=__ctx,v=ctx.drive.fleet.find(v=>v.id===id),c=v.cabin,p=ctx.playerObj;ctx.characters.select(actor);c.occupied=true;
   c.root.updateWorldMatrix(true,true);const target=c.root.localToWorld(p.pos.clone().set(-c.spec.halfWidth-.8,0,c.spec.seat[2]+.4));
   await ctx.regions?.ensureAt(target.x,target.z);const yaw=Math.atan2(-(v.parked.x-target.x),-(v.parked.z-target.z));p.setPose(target.x,target.z,yaw*180/Math.PI,0,v.parked.y+.3,{stand:true});
   window.__garagePhases=[];if(!window.__garageTrace){window.__garageTrace=true;ctx.onUpdate(()=>{const t=ctx.drive.interaction;if(t)__garagePhases.push(t.phase);});}
  },{actor,id});
  await page.keyboard.press('KeyE');await page.waitForFunction(id=>__ctx.drive.interaction?.vehicle.id===id,{timeout:8000},id);
  await page.waitForFunction(()=>__ctx.drive.interaction?.phase==='climb',{timeout:15000,polling:'raf'});await page.screenshot({path:path.join(out,`${id}-${actor}-enter.png`)});
  await page.waitForFunction(id=>__ctx.drive.active&&!__ctx.drive.interacting&&__ctx.drive.vehicle.id===id,{timeout:15000},id);
  const phases=await page.evaluate(()=>[...new Set(__garagePhases)]);assert(phases.includes('extract'));assert(phases.includes('close'));
  await page.screenshot({path:path.join(out,`${id}-${actor}-seated.png`)});
  for(const action of ['exit','reenter','exit']){
   // The driving E handler ignores input for 350 ms after taking the seat.
   await new Promise(r=>setTimeout(r,400));
   if(action==='reenter')await page.evaluate(()=>{const p=__ctx.playerObj,v=__ctx.drive.vehicle;p.yaw=Math.atan2(-(v.parked.x-p.pos.x),-(v.parked.z-p.pos.z));p.facingYaw=p.yaw;p.applyCamera(0);});
   await page.keyboard.press('KeyE');const active=action==='reenter';await page.waitForFunction(active=>__ctx.drive.active===active&&!__ctx.drive.interacting,{timeout:15000},active);
  }
  assert.equal(await page.evaluate(()=>__ctx.playerObj.inputLock),0);results.push({id,actor,phases,occupiedEntry:true,emptyReentry:true,exit:true});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__errors||[]),[]);
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,normal,results,errors},null,2));console.log('PASS: both characters, red coupe and Lada, actual E-key occupied entry/extraction/exit/empty re-entry; no runtime errors');
}catch(error){await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:false,results,errors,error:error.stack},null,2));throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
