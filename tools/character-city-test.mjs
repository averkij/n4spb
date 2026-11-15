// Integrated production-page character/car regression. Serial GPU job.
// Local fresh bake: node tools/character-city-test.mjs --normal --out shots/character-city-baked
// Deployment: node tools/character-city-test.mjs --base https://averkij.github.io/n4spb/ --out shots/character-city-deployed
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args={};
for(let i=2;i<process.argv.length;i++){
  const name=process.argv[i];
  if(['--normal','--quick','--help'].includes(name))args[name.slice(2)]=true;
  else if(['--base','--out'].includes(name)){
    const value=process.argv[++i];if(!value||value.startsWith('--'))throw Error(`${name} requires a value`);args[name.slice(2)]=value;
  }else throw Error(`Unknown option: ${name}. Use --help.`);
}
if(args.help){console.log('Usage: node tools/character-city-test.mjs [--normal] [--quick] [--base https://host/game/] [--out shots/character-city]\n--normal: use the current baked scene without diagnostic bypass\n--base: test a deployed directory or HTML page; implies --normal and uses real CDN assets\n--quick: one traffic type instead of three; touch checks still run\n--out: evidence directory, relative to the repository or absolute');process.exit(0);}
const normal=!!(args.normal||args.base),targetCount=args.quick?1:3;
let deployedURL=null;
if(args.base){
  deployedURL=new URL(args.base);
  if(!['http:','https:'].includes(deployedURL.protocol))throw Error('--base must be an HTTP(S) URL');
  if(!/\.html?$/i.test(deployedURL.pathname))deployedURL.pathname=deployedURL.pathname.replace(/\/$/,'')+'/index.html';
}
const shots=path.resolve(root,args.out||'shots/character-city');fs.mkdirSync(shots,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local');const file=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'':data);});});
if(!deployedURL)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const targetURL=deployedURL||new URL(`http://127.0.0.1:${server.address().port}/index.html`);
if(normal)targetURL.searchParams.delete('baked');else targetURL.searchParams.set('baked','force');
for(const name of ['guard','gate','gates'])targetURL.searchParams.set(name,'0');
console.log(`Character city test: ${targetURL.href}\nEvidence: ${shots}`);
const edge=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser=await puppeteer.launch({executablePath:edge,headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--disable-extensions']});
const errors=[],results=[];let page;
try{
  page=await browser.newPage();await page.setViewport({width:1440,height:900});
  await page.setRequestInterception(true);
  page.on('request',req=>{const m=/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());if(!deployedURL&&m){const f=path.join(root,'node_modules','three',m[1].split('?')[0]);if(fs.existsSync(f))return req.respond({status:200,contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(f)});}if(/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(req.url()))return req.abort();req.continue();});
  page.on('pageerror',e=>errors.push(e.stack||e.message));
  await page.goto(targetURL.href,{waitUntil:'load',timeout:180000});
  await page.waitForFunction("document.body.classList.contains('loaded') && window.__ctx?.characters?.ready && __ctx.services.traffic?.nearestEnterable",{timeout:180000});
  if(normal)assert.equal(await page.evaluate(()=>!!__ctx.baked),true,'normal verification loads the baked world, without procedural fallback');
  assert.equal(await page.evaluate(()=>__ctx.characters.index),0);
  await page.click('#go');await page.waitForFunction(()=>getComputedStyle(document.getElementById('intro')).visibility==='hidden');await page.evaluate(()=>document.exitPointerLock());
  await page.waitForFunction(()=>__ctx.playerObj.view===0&&document.getElementById('cross').hidden);
  for(const expected of [1,2,0]){await page.keyboard.press('KeyV');await page.waitForFunction(v=>__ctx.playerObj.view===v&&document.getElementById('cross').hidden===(v!==2),{},expected);}
  await page.screenshot({path:path.join(shots,'city-foot-default.png')});
  await page.click('#character-settings-button');await page.select('#character-choice','1');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>localStorage.getItem('piter.character')),'man-jacket');
  await page.evaluate(()=>__ctx.characters.select(0));
  const candidates=await page.evaluate(()=>{const p=__ctx.playerObj.pos,t=__ctx.services.traffic;return t.parked.map(r=>{const d=t.nearestEnterable(r.x,r.z,.3);return d&&!d.spec.bus?{id:d.id,kind:d.kind,x:d.x,z:d.z,distance:Math.hypot(d.x-p.x,d.z-p.z)}:null;}).filter(Boolean).sort((a,b)=>a.distance-b.distance).slice(0,180);});
  const used=new Set(),skipped=[];
  await page.evaluate(()=>{window.__cityTrace=[];__ctx.onUpdate(()=>{const d=__ctx.drive,t=d.interaction;__cityTrace.push({phase:t?.phase||null,npc:t?.vehicle.cabin.npc?.reaction||d.vehicle.cabin?.npc?.reaction||null,fps:__stats.fps,calls:__stats.calls});if(__cityTrace.length>900)__cityTrace.shift();});});
  for(const candidate of candidates){
    if(used.has(candidate.kind))continue;
    const prepared=await page.evaluate(async candidate=>{
      const ctx=__ctx,t=ctx.services.traffic,p=ctx.playerObj,d=t.nearestEnterable(candidate.x,candidate.z,.3);if(!d||d.id!==candidate.id)return null;
      const half=d.spec.wid/2,s=Math.sin(d.rotY),c=Math.cos(d.rotY),side=half+.73,back=-.5;
      const x=d.x+c*side+s*back,z=d.z-s*side+c*back;
      await ctx.regions?.ensureAt(x,z);
      if(ctx.physics.columnBlocked(x,z,.3,d.y+.2,d.y+1.7))return null;
      const yaw=Math.atan2(-(d.x-x),-(d.z-z));p.setPose(x,z,yaw*180/Math.PI,0,d.y+.4,{stand:true});
      if(Math.abs(p.pos.y-d.y)>.8)return null;
      window.__cityOriginal={id:d.id,kind:d.kind,color:d.color.getHexString(),plate:d.plate,damage:d.damageState};window.__cityTrace.length=0;
      return {id:d.id,kind:d.kind,color:d.color.getHexString(),plate:d.plate};
    },candidate);
    if(!prepared){skipped.push(candidate.id);continue;}
    await page.waitForFunction(()=>__ctx.interact.update()?.id==='drive-traffic',{timeout:4000}).catch(()=>{});
    if(!await page.evaluate(()=>__ctx.interact.target?.id==='drive-traffic')){skipped.push(candidate.id);continue;}
    await page.keyboard.press('KeyE');
    const started=await page.waitForFunction(()=>__ctx.drive.interacting||__ctx.drive.active,{timeout:5000}).then(()=>true).catch(()=>false);
    if(!started){skipped.push(candidate.id+':blocked-entry');continue;}
    await page.waitForFunction(()=>__ctx.drive.interaction?.phase==='extract',{timeout:20000,polling:'raf'});
    await page.screenshot({path:path.join(shots,`${candidate.kind}-extract.png`)});
    await page.waitForFunction(()=>__ctx.drive.active&&!__ctx.drive.interacting,{timeout:20000,polling:'raf'});
    const promoted=await page.evaluate(()=>{const v=__ctx.drive.vehicle;return {id:v.id,kind:v.def.traffic.model,color:v.def.traffic.color.slice(1),plate:v.def.traffic.plate,phases:[...new Set(__cityTrace.map(f=>f.phase).filter(Boolean))],angry:__cityTrace.some(f=>f.npc==='angry')};});
    assert.equal(promoted.id,prepared.id);assert.equal(promoted.color,prepared.color);assert.equal(promoted.plate,prepared.plate);assert(promoted.angry);assert(promoted.phases.includes('extract'));
    await page.screenshot({path:path.join(shots,`${candidate.kind}-city-seated.png`)});
    const damaged=await page.evaluate(()=>{const d=__ctx.drive;d.damage.hit({type:'hit',v:14,localX:0,localZ:d.vehicle.spec.front,nx:0,nz:-1});return d.damage.amount;});assert(damaged>0&&damaged<1);
    assert.equal(await page.evaluate(()=>__ctx.drive.requestExit()),true);await page.waitForFunction(()=>!__ctx.drive.active&&!__ctx.drive.interacting,{timeout:20000});
    const reenter=await page.evaluate(()=>{const d=__ctx.drive,v=d.vehicle;return {ok:d.requestEnter(v),id:v.id,amount:v.damage.amount,color:v.def.traffic.color};});assert(reenter.ok);assert.equal(reenter.id,prepared.id);assert.equal(reenter.amount,damaged);assert.equal(reenter.color,'#'+prepared.color);
    await page.waitForFunction(()=>__ctx.drive.active&&!__ctx.drive.interacting,{timeout:20000});
    const phases=await page.evaluate(()=>__ctx.drive.interaction?.phase);assert.equal(phases,undefined);
    // Test driving after the clear original doorway has been used for exit and
    // re-entry: moving through a dense parking row can legitimately block it.
    const movement=await page.evaluate(()=>{const d=__ctx.drive,before={x:d.car.x,z:d.car.z};d.sim(.55,{thr:1});const moved=Math.hypot(d.car.x-before.x,d.car.z-before.z);d.sim(.8,{hand:true,brk:1});d.car.vx=d.car.vz=0;d.car.speed=0;return moved;});
    assert(movement>.01,'promoted car responds to throttle');
    if(used.size===targetCount-1){
      await page.evaluate(()=>{const d=__ctx.drive;d.damage.hit({type:'hit',v:200,localX:0,localZ:d.vehicle.spec.front,nx:0,nz:-1});});
      await page.waitForFunction(()=>document.getElementById('wasted')?.classList.contains('on'),{timeout:5000});
      await page.screenshot({path:path.join(shots,'traffic-wasted.png')});
      const wreck=await page.evaluate(()=>{const d=__ctx.drive,before={x:d.car.x,z:d.car.z};d.sim(1,{thr:1,nitro:true});return {amount:d.damage.amount,speed:d.car.speed,moved:Math.hypot(d.car.x-before.x,d.car.z-before.z)};});assert.equal(wreck.amount,1);assert(wreck.speed<1,'junked car cannot accelerate');
    }
    await page.evaluate(()=>__ctx.drive.exit(true));
    const result={...promoted,movement,damage:damaged};results.push(result);used.add(candidate.kind);console.log(JSON.stringify(result));if(used.size>=targetCount)break;
  }
  assert.equal(used.size,targetCount,`requested real city types were tested; skipped ${skipped.length}`);
  const perf=await page.evaluate(()=>new Promise(resolve=>{const values=[];let prior=performance.now();const next=now=>{values.push(now-prior);prior=now;if(values.length<90)requestAnimationFrame(next);else{values.sort((a,b)=>a-b);resolve({frameMedian:values[45],frameP95:values[85],calls:__stats.calls,triangles:__stats.triangles,sceneErrors:window.__errors||[]});}};requestAnimationFrame(next);}));
  fs.writeFileSync(path.join(shots,'desktop-result.json'),JSON.stringify({passed:true,url:targetURL.href,normal,results,skipped,perf,errors},null,2));
  const resetStarted=await page.evaluate(async()=>{const ctx=__ctx,v=ctx.drive.vehicle,c=v.cabin,p=ctx.playerObj;await ctx.regions?.ensureAt(v.parked.x,v.parked.z);const point=c.root.localToWorld(p.pos.clone().set(-c.spec.halfWidth-1.8,0,c.spec.seat[2]+.6));p.setPose(point.x,point.z,0,0,v.parked.y+.3,{stand:true});return ctx.drive.requestEnter(v);});
  if(resetStarted){await page.keyboard.press('KeyR');await page.waitForFunction(()=>!__ctx.drive.interacting&&!__ctx.drive.active,{timeout:8000});assert.equal(await page.evaluate(()=>__ctx.playerObj.inputLock),0,'R cancels approach without a lock leak');}
  await page.setViewport({width:844,height:390,deviceScaleFactor:1,isMobile:true,hasTouch:true,isLandscape:true});await page.reload({waitUntil:'load',timeout:180000});
  await page.waitForFunction(()=>document.body.classList.contains('loaded')&&window.__tc&&__ctx.characters?.ready,{timeout:180000});await page.tap('#go');await page.waitForFunction(()=>getComputedStyle(document.getElementById('intro')).visibility==='hidden');
  const tapButton=async id=>{const r=await page.evaluate(id=>{const b=__tc.btns[id],r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};},id);await page.touchscreen.tap(r.x,r.y);};
  for(const expected of [1,2,0]){await tapButton('cam');await page.waitForFunction(v=>__ctx.playerObj.view===v&&document.getElementById('cross').hidden===(v!==2),{},expected);}
  await tapButton('menu');await new Promise(r=>setTimeout(r,400)); // production menu suppresses ghost clicks for 350 ms
  const tapText=async text=>{const r=await page.evaluate(text=>{const b=[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes(text));if(!b)throw Error('Missing touch setting '+text);b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};},text);await page.touchscreen.tap(r.x,r.y);};
  await tapText('Controls settings');await page.waitForFunction(()=>[...document.querySelectorAll('#panel button')].some(b=>b.textContent.includes('Character')),{timeout:5000});await new Promise(r=>setTimeout(r,400));await tapText('Character');await page.waitForSelector('#character-choice');
  assert.equal(await page.evaluate(()=>__ctx.playerObj.inputLock),1,'nested character panel owns exactly one lock');
  await page.select('#character-choice','1');assert.equal(await page.evaluate(()=>__ctx.characters.index),1);
  await page.screenshot({path:path.join(shots,'mobile-character-settings.png')});await page.tap('.panel-x');
  assert.equal(await page.evaluate(()=>__ctx.playerObj.inputLock),0,'touch panel closes cleanly');
  await page.screenshot({path:path.join(shots,'mobile-character-foot.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(perf.sceneErrors,[]);
  fs.writeFileSync(path.join(shots,'result.json'),JSON.stringify({passed:true,url:targetURL.href,normal,results,skipped,perf,resetStarted,touch:true,errors},null,2));console.log(JSON.stringify({passed:true,perf,resetStarted,touch:true}));
}catch(error){if(page)await page.screenshot({path:path.join(shots,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(shots,'result.json'),JSON.stringify({passed:false,url:targetURL.href,results,errors,error:error.stack},null,2));throw error;}
finally{await browser.close();if(server.listening)await new Promise(r=>server.close(r));}
