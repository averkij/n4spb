// Integrated production-page character/car regression. Serial GPU job.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const shots=path.join(root,'shots','character-game');fs.mkdirSync(shots,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local');const file=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'':data);});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const edge=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser=await puppeteer.launch({executablePath:edge,headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--disable-extensions']});
const errors=[],results=[];
try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:900});
  await page.setRequestInterception(true);
  page.on('request',req=>{const m=/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());if(m){const f=path.join(root,'node_modules','three',m[1].split('?')[0]);if(fs.existsSync(f))return req.respond({status:200,contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(f)});}if(/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(req.url()))return req.abort();req.continue();});
  page.on('pageerror',e=>errors.push(e.stack||e.message));
  const url=`http://127.0.0.1:${server.address().port}/index.html?baked=0&only=drive&noroof=1&gate=0&guard=0`;
  const ready=async()=>{await page.waitForFunction("document.body.classList.contains('loaded') && window.__ctx?.characters?.ready",{timeout:120000});await page.click('#go');await page.waitForFunction(() => getComputedStyle(document.getElementById('intro')).visibility==='hidden');await page.evaluate(()=>document.exitPointerLock());};
  await page.goto(url,{waitUntil:'load',timeout:120000});await ready();
  assert.equal(await page.evaluate(()=>__ctx.characters.index),0,'girl is default');
  assert.equal(await page.$eval('#cross',e=>getComputedStyle(e).display),'none','default third-person view hides the aim dot');
  await page.screenshot({path:path.join(shots,'default.png')});
  for(const expected of [1,2,0]){await page.keyboard.press('KeyV');await page.waitForFunction(v=>__ctx.playerObj.view===v,{},expected);await page.waitForFunction(v=>(getComputedStyle(document.getElementById('cross')).display!=='none')===(v===2),{},expected);}
  await page.click('#character-settings-button');await page.select('#character-choice','1');await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>__ctx.characters.index),1);
  await page.reload({waitUntil:'load'});await ready();assert.equal(await page.evaluate(()=>__ctx.characters.index),1,'settings choice survives reload');
  await page.evaluate(()=>{
    window.__characterTrace=[];
    __ctx.onUpdate(()=>{const d=__ctx.drive,c=__ctx.characters,a=c.actor,t=d.interaction;const hips=a.rig.hips.getWorldPosition(a.root.position.clone());
      if(window.__inspectCharacter){const cabin=d.vehicle.cabin,position=cabin.root.localToWorld(a.root.position.clone().set(-2.7,1.45,-2.0)),target=cabin.root.localToWorld(a.root.position.clone().set(cabin.spec.seat[0],cabin.spec.seat[1]+.3,cabin.spec.seat[2]));__ctx.camera.position.copy(position);__ctx.camera.lookAt(target);}
      window.__characterTrace.push({active:d.active,phase:t?.phase||null,progress:t?.progress||0,clip:a.animation,hip:[hips.x,hips.y,hips.z],visible:a.root.visible,npc:t?.vehicle.cabin.npc?.reaction||d.vehicle.cabin?.npc?.reaction||null});if(__characterTrace.length>1200)__characterTrace.shift();});
  });
  for(const index of [0,1])for(const id of ['coupe','truck','lada','roadster']){
    const start=await page.evaluate(({index,id})=>{
      const ctx=__ctx,d=ctx.drive,v=d.vehicleById(id),c=v.cabin,p=ctx.playerObj;
      if(d.active)d.exit(true);ctx.characters.select(index);d.setView(0);
      c.occupied=true;c.npcTime=-1;c.npcOrigin=null;
      const point=c.root.localToWorld(p.pos.clone().set(-c.spec.halfWidth-.72,0,c.spec.seat[2]+.6));
      p.setPose(point.x,point.z,(v.car.yaw+Math.PI)*180/Math.PI,0,v.parked.y+.05,{stand:true});p.enabled=true;
      window.__characterTrace.length=0;return {entered:d.requestEnter(v),x:p.pos.x,z:p.pos.z};
    },{index,id});
    assert.equal(start.entered,true,`${index}/${id} entry starts`);
    await page.waitForFunction("__ctx.drive.interaction?.phase==='extract'",{timeout:15000,polling:'raf'});
    if(index===0)await page.screenshot({path:path.join(shots,`${index}-${id}-extract.png`)});
    await page.waitForFunction('__ctx.drive.active&&!__ctx.drive.interacting',{timeout:15000,polling:'raf'});
    const sample=await page.evaluate(()=>new Promise(resolve=>{const data=[];let n=0;function frame(){const ctx=__ctx,a=ctx.characters.actor,v=ctx.drive.vehicle,c=v.cabin,hips=a.rig.hips.getWorldPosition(a.root.position.clone()),seat=c.root.localToWorld(a.root.position.clone().set(...c.spec.seat));data.push({hipError:hips.distanceTo(seat),hands:['l','r'].map((side,i)=>{const target=c.root.localToWorld(a.root.position.clone().set(c.spec.wheel[0]+(i?1:-1)*.165,c.spec.wheel[1]+.025,c.spec.wheel[2]+.045));return a.rig.arms[side].end.getWorldPosition(a.root.position.clone()).distanceTo(target);}),visible:a.root.visible,npc:c.npc?.reaction});if(++n<18)requestAnimationFrame(frame);else resolve({data,phases:[...new Set(__characterTrace.map(f=>f.phase).filter(Boolean))],lock:ctx.playerObj.inputLock});}requestAnimationFrame(frame);}));
    assert.ok(sample.data.every(f=>f.hipError<.005),`${index}/${id} stable settled hip`);
    assert.ok(sample.phases.includes('extract')&&sample.phases.includes('climb')&&sample.phases.includes('close'),'actual door/extraction/climb phases execute');
    assert.ok(sample.data.some(f=>f.npc==='angry'),'occupant reacts angrily');assert.equal(sample.lock,1,'only driving owns input lock');
    await page.screenshot({path:path.join(shots,`${index}-${id}-seated-angry.png`)});
    await page.evaluate(()=>{window.__inspectCharacter=true;});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await page.screenshot({path:path.join(shots,`${index}-${id}-seated-close.png`)});
    await page.evaluate(()=>{window.__inspectCharacter=false;});
    // A cockpit exit must restore the shell and finish without input leakage.
    assert.equal(await page.evaluate(()=>{__ctx.drive.setView(2);return __ctx.drive.requestExit();}),true);
    await page.waitForFunction('!__ctx.drive.active&&!__ctx.drive.interacting',{timeout:15000,polling:'raf'});
    assert.equal(await page.evaluate(()=>__ctx.playerObj.inputLock),0);
    const result={index,id,phases:sample.phases,maxHipError:Math.max(...sample.data.map(f=>f.hipError)),maxHandError:Math.max(...sample.data.flatMap(f=>f.hands))};results.push(result);console.log(JSON.stringify(result));
  }
  await page.evaluate(()=>__ctx.characters.select(0));
  assert.deepEqual(errors,[],'no browser errors');
  fs.writeFileSync(path.join(shots,'result.json'),JSON.stringify({passed:true,results,errors},null,2));
  console.log('PASS: production character settings/cameras and both characters entering/exiting all four garage cars');
}catch(error){fs.writeFileSync(path.join(shots,'result.json'),JSON.stringify({passed:false,results,errors,error:error.stack},null,2));throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
