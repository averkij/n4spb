// Actual production page, real traffic service and character animations. Serial GPU job.
// node tools/bus-city-test.mjs --normal --out shots/bus-city-baked
// node tools/bus-city-test.mjs --base https://averkij.github.io/n4spb/ --out shots/bus-city-deployed
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {handleBakedRevision,ENDPOINT} from './lib/dev-revision.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),args={};
for(let i=2;i<process.argv.length;i++){const k=process.argv[i];if(k==='--normal')args.normal=true;else if(k==='--keep-open')args.keepOpen=true;else if(['--base','--out'].includes(k)){const value=process.argv[++i];if(!value||value.startsWith('--'))throw Error(`${k} needs a value`);args[k.slice(2)]=value;}else throw Error(`Unknown option ${k}`);}
const normal=!!(args.normal||args.base),out=path.resolve(root,args.out||'shots/bus-city');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{if(handleBakedRevision(req,res,root))return;const url=new URL(req.url,'http://local'),file=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(err?'':data);});});
if(!args.base)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=new URL(args.base||`http://127.0.0.1:${server.address().port}/index.html`);
if(!['http:','https:'].includes(url.protocol))throw Error('--base must be HTTP(S)');
if(!/\.html?$/i.test(url.pathname))url.pathname=url.pathname.replace(/\/$/,'')+'/index.html';
if(!normal)url.searchParams.set('baked','force');else url.searchParams.delete('baked');
for(const k of ['guard','gate','gates'])url.searchParams.set(k,'0');
const edge=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser=await puppeteer.launch({executablePath:edge,headless:true,protocolTimeout:180000,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--disable-extensions']});
const errors=[],results=[];let page;
async function capture(name,clear=false){
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const png=await page.screenshot({path:path.join(out,`${name}.png`)});
 if(clear){const stats=await page.evaluate(async base64=>{const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const c=canvas.getContext('2d');c.drawImage(img,0,0);const p=c.getImageData(400,140,600,350).data;let sum=0,square=0,bright=0;for(let i=0;i<p.length;i+=4){const v=(p[i]+p[i+1]+p[i+2])/3;sum+=v;square+=v*v;if(v>40)bright++;}const n=p.length/4;return{mean:sum/n,sd:Math.sqrt(square/n-(sum/n)**2),bright:bright/n};},Buffer.from(png).toString('base64'));assert(stats.sd>8&&stats.bright>.05,`${name}: camera is not obscured by a flat shell (${JSON.stringify(stats)})`);}
}
try{
 page=await browser.newPage();await page.setViewport({width:1440,height:900});
 await page.setRequestInterception(true);page.on('request',req=>{const m=/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());if(!args.base&&m){const f=path.join(root,'node_modules','three',m[1].split('?')[0]);if(fs.existsSync(f))return req.respond({status:200,contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(f)});}if(/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(req.url()))return req.abort();req.continue();});
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('console',message=>{if(message.type()==='error'&&!message.text().startsWith('Failed to load resource'))errors.push(message.text());});
 page.on('response',response=>{const pathname=new URL(response.url()).pathname;if(response.status()===404&&(pathname.endsWith('/favicon.ico')||args.base&&pathname.endsWith(ENDPOINT)))return;if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
 await page.goto(url.href,{waitUntil:'load',timeout:180000});
 await page.waitForFunction(()=>document.body.classList.contains('loaded')&&window.__ctx?.characters?.ready&&__ctx.services.traffic?.nearestEnterable,{timeout:180000});
 if(normal)assert(await page.evaluate(()=>!!__ctx.baked),'normal/deployed run requires baked world');
 await page.click('#go');await page.waitForFunction(()=>getComputedStyle(document.getElementById('intro')).visibility==='hidden');await page.evaluate(()=>document.exitPointerLock());
 await page.evaluate(()=>{window.__busTrace=[];__ctx.onUpdate(()=>{const d=__ctx.drive,t=d.interaction;__busTrace.push({phase:t?.phase,door:t?.vehicle.cabin.doorAmount,npc:t?.vehicle.cabin.npc?.reaction||d.vehicle.cabin?.npc?.reaction});if(__busTrace.length>1000)__busTrace.shift();});});
 await new Promise(r=>setTimeout(r,1500));
 const natural=await page.evaluate(()=>{const p=__ctx.playerObj.pos;return __ctx.services.traffic.sim.vehicles.filter(v=>v.bus&&!v.tram&&!v.arch.tour&&!v.wrecked&&v.rec).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0]?.kind;});
 assert(natural,'at least one naturally routed city bus exists');
 const kinds=[natural,...['bus','midi','artic','trolley','trolley2','dd','coach'].filter(k=>k!==natural)];
 for(const [index,kind] of kinds.entries()){
  const prepared=await page.evaluate(async({kind,naturalOnly})=>{
    const {ARCH,busDoorZ,ARTIC_REAR_OFFSET}=await import(new URL('./src/world/traffic/fleetdata.js',location.href));
    const {carContact}=await import(new URL('./src/world/drive/collision.js',location.href));
    const ctx=__ctx,sim=ctx.services.traffic.sim,p=ctx.playerObj,a=ARCH[kind];
    if(!naturalOnly&&kind!=='bus'){
      const v=sim.vehicles.filter(q=>!q.tram&&!q.wrecked&&!q.retired).sort((x,y)=>Math.hypot(x.x-p.pos.x,x.z-p.pos.z)-Math.hypot(y.x-p.pos.x,y.z-p.pos.z))[0],spec={...a,W:a.wid,centerZ:(a.front+a.rear)/2};
      if(!v)return null;
      const spots=[];
      for(const lane of sim.laneSeg.values()){
        const at=distance=>{let i=1;while(i<lane.n-1&&lane.cum[i]<distance)i++;const f=(distance-lane.cum[i-1])/(lane.cum[i]-lane.cum[i-1]);return{x:lane.xs[i-1]+(lane.xs[i]-lane.xs[i-1])*f,z:lane.zs[i-1]+(lane.zs[i]-lane.zs[i-1])*f};};
        for(let along=a.len/2+4;along<lane.len-a.len/2-4;along+=8){const q=at(along),lo=at(along-a.len/2-3),hi=at(along+a.len/2+3),dx=hi.x-lo.x,dz=hi.z-lo.z,len=Math.hypot(dx,dz),dist=Math.hypot(q.x-p.pos.x,q.z-p.pos.z);if(dist>350||len<a.len+5.8||Math.hypot(q.x-(hi.x+lo.x)/2,q.z-(hi.z+lo.z)/2)>.25)continue;spots.push({x:q.x-dx/len*spec.centerZ,z:q.z-dz/len*spec.centerZ,yaw:Math.atan2(dx,dz),dist});}
      }
      spots.sort((a,b)=>a.dist-b.dist);
      for(const pose of spots){
        pose.y=(ctx.L.heightAt(pose.x,pose.z)||0)+.03;
        if(!ctx.L.inPlay(pose.x,pose.z)||ctx.L.insideBuilding(pose.x,pose.z))continue;
        const blocked=[...ctx.physics.querySolids(pose.x,pose.z,a.len+4)].some(b=>b.source?.vehicle!==v&&carContact(pose,spec,b));if(blocked)continue;
        // Include remote AI records too: the physics provider only emits nearby
        // traffic. Keep room for a reviewable chase camera, not an overlapping queue.
        if(sim.vehicles.some(q=>q!==v&&!q.retired&&Math.hypot(q.x-pose.x,q.z-pose.z)<a.len+9))continue;
        const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw),ex=-a.wid/2-.75,ez=busDoorZ(kind)-.42,x=pose.x+c*ex+s*ez,z=pose.z-s*ex+c*ez;
        if(ctx.physics.columnBlocked(x,z,.3,pose.y+.2,pose.y+1.7))continue;
        await ctx.regions?.ensureAt(x,z);
        Object.assign(v,{kind,arch:a,len:a.len,wid:a.wid,wb:a.wb,fo:a.front-a.wb/2,bus:true,trolley:!!a.trolley,route:a.tour?null:60,rec:null,rec2:null,x:pose.x,px:pose.x,z:pose.z,pz:pose.z,rot:pose.yaw,prot:pose.yaw,x2:pose.x+s*ARTIC_REAR_OFFSET,px2:pose.x+s*ARTIC_REAR_OFFSET,z2:pose.z+c*ARTIC_REAR_OFFSET,pz2:pose.z+c*ARTIC_REAR_OFFSET,rot2:pose.yaw,prot2:pose.yaw,v:0,wrecked:true,collisionUntil:sim.time+180});
        // Wreck-owned poses are not overwritten by the lane solver. No wreck
        // body is created: this is only a frozen test fixture until normal claim.
        p.setPose(x,z,Math.atan2(s*busDoorZ(kind)-c*(a.wid/2+.4)+pose.x-x,c*busDoorZ(kind)+s*(a.wid/2+.4)+pose.z-z)*180/Math.PI+180,0,pose.y+.4,{stand:true});
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const tx=pose.x-c*(a.wid/2+.4)+s*busDoorZ(kind),tz=pose.z+s*(a.wid/2+.4)+c*busDoorZ(kind),d=ctx.services.traffic.nearestEnterable(tx,tz,.5);
        if(!d||d.kind!==kind)throw Error('Synthetic bus did not register at the selected clear road pose');
        window.__busOriginal={vehicle:v,record:v.rec,descriptor:d};window.__busTrace.length=0;
        return{id:d.id,kind,color:d.color.getHexString(),plate:d.plate,route:d.route,native:false,fixture:'clear-lane'};
      }
      throw Error(`No clear deterministic lane fixture for ${kind}; searched ${spots.length} points`);
    }
    const candidates=sim.vehicles.filter(v=>!v.tram&&!v.wrecked&&!v.rec?.wrecked&&(!naturalOnly||v.kind===kind)&&(naturalOnly||Math.hypot(v.x-p.pos.x,v.z-p.pos.z)<800)).sort((x,y)=>(x.kind===kind?0:1)-(y.kind===kind?0:1)||Math.hypot(x.x-p.pos.x,x.z-p.pos.z)-Math.hypot(y.x-p.pos.x,y.z-p.pos.z));
    for(const v of candidates){
      const fields=['kind','arch','len','wid','wb','fo','bus','trolley','route','rec','rec2','collisionUntil','v'],saved=Object.fromEntries(fields.map(k=>[k,v[k]]));let selected=false;
      try{
      const native=v.kind===kind;
      if(!native){Object.assign(v,{kind,arch:a,len:a.len,wid:a.wid,wb:a.wb,fo:a.front-a.wb/2,bus:true,trolley:!!a.trolley,route:a.tour?null:60,rec:null,rec2:null});}
      v.collisionUntil=sim.time+180;v.v=0;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const r=v.rec;if(!r)continue;
      const ex=-a.wid/2-.75,ez=busDoorZ(kind)-.42,x=r.x+r.c*ex+r.s*ez,z=r.z-r.s*ex+r.c*ez;
      await ctx.regions?.ensureAt(x,z);
      if(ctx.physics.columnBlocked(x,z,.3,r.y+.2,r.y+1.7))continue;
      const tx=r.x+r.c*(-a.wid/2-.4)+r.s*busDoorZ(kind),tz=r.z-r.s*(-a.wid/2-.4)+r.c*busDoorZ(kind);
      p.setPose(x,z,Math.atan2(-(tx-x),-(tz-z))*180/Math.PI,0,r.y+.4,{stand:true});
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const d=ctx.services.traffic.nearestEnterable(tx,tz,.5);if(!d||d.kind!==kind)continue;
      if(ctx.services.traffic.nearestEnterable(p.pos.x,p.pos.z,5.4)!==d||ctx.interact.update()?.id!=='drive-traffic')continue;
      // A larger synthetic body must fit here. In particular, replacing a short
      // sedan in a queue with an 18 m bus must not manufacture overlapping buses.
      const spec={...a,W:a.wid,centerZ:(a.front+a.rear)/2},pose={x:r.x,y:r.y,z:r.z,yaw:Math.atan2(r.s,r.c)};
      const blocked=[...ctx.physics.querySolids(r.x,r.z,a.len+2)].some(b=>b.source?.vehicle!==v&&b.source?.record!==r&&(!v.rec2||b.source?.record!==v.rec2)&&carContact(pose,spec,b));
      if(blocked)continue;
      selected=true;
      window.__busOriginal={vehicle:v,record:r,descriptor:d};window.__busTrace.length=0;
      return {id:d.id,kind,color:d.color.getHexString(),plate:d.plate,route:d.route,native};
      }finally{if(!selected)Object.assign(v,saved);}
    }
    return null;
  },{kind,naturalOnly:index===0});
  assert(prepared,`clear front passenger doorway found for ${kind}`);
  await page.waitForFunction(()=>__ctx.interact.update()?.id==='drive-traffic',{timeout:7000});await page.keyboard.press('KeyE');
  await page.waitForFunction(()=>__ctx.drive.interaction?.phase==='extract'&&__ctx.drive.interaction.progress>.45,{timeout:25000,polling:'raf'});
  await capture(`${kind}-extract`,true);
  await page.waitForFunction(()=>__ctx.drive.interaction?.phase==='climb'&&__ctx.drive.interaction.progress>.4,{timeout:25000,polling:'raf'});
  await capture(`${kind}-climb`,true);
  await page.waitForFunction(()=>__ctx.drive.active&&!__ctx.drive.interacting,{timeout:25000,polling:'raf'});
  assert.deepEqual(await page.evaluate(()=>window.__errors||[]),[],'caught production update errors');
  assert.deepEqual(errors,[],'production update loop remains healthy after boarding');
  const entered=await page.evaluate(()=>{const d=__ctx.drive,v=d.vehicle,o=__busOriginal;return{id:v.id,model:v.def.traffic.model,color:v.def.traffic.color.slice(1),plate:v.def.traffic.plate,route:v.def.traffic.route,mass:v.spec.mass,wheels:v.model.wheels.length,entrySide:v.cabin.spec.entrySide,seatX:v.cabin.spec.seat[0],eyeY:v.spec.eye.y,detached:!__ctx.services.traffic.sim.vehicles.includes(o.vehicle),sourceClaimed:o.record.claimed,tailClaimed:!o.record.trailer||o.record.trailer.claimed,stoppedRoute:o.vehicle.route,angry:__busTrace.some(f=>f.npc==='angry')};});
  assert.equal(entered.id,prepared.id);assert.equal(entered.model,kind);assert.equal(entered.color,prepared.color);assert.equal(entered.plate,prepared.plate);assert.equal(entered.route,prepared.route??undefined);
  assert(entered.detached&&entered.sourceClaimed&&entered.tailClaimed&&entered.angry);assert.equal(entered.stoppedRoute,null);assert.equal(entered.entrySide,1);assert(entered.seatX<0&&entered.eyeY>1.9);assert.equal(entered.wheels,kind==='artic'?6:4);
  await capture(`${kind}-driving`,true);
  entered.camera=await page.evaluate(()=>{const d=__ctx.drive,c=__ctx.camera,v=d.vehicle;return{world:c.position.toArray(),local:v.model.root.worldToLocal(c.position.clone()).toArray(),pose:{x:d.car.x,y:d.car.y,z:d.car.z,yaw:d.car.yaw},height:v.spec.hgt};});
  const wheelTargets=await page.evaluate(()=>{const m=__ctx.drive.model;return{count:m.wheelWorldPositions?.length,finite:m.wheelWorldPositions?.every(v=>[v.x,v.y,v.z].every(Number.isFinite))};});assert.equal(wheelTargets.count,entered.wheels);assert(wheelTargets.finite,'all visible axles have valid world-space effects targets');
  await page.evaluate(()=>__ctx.drive.setView(1));await capture(`${kind}-far`,true);
  // Entry may select a side orbit when the close boom is obstructed. Let its
  // ordinary idle return settle before reviewing the forward driver's view.
  await page.evaluate(()=>__ctx.drive.setView(2));await new Promise(r=>setTimeout(r,2500));await capture(`${kind}-cockpit`,true);await page.evaluate(()=>__ctx.drive.setView(0));
  const damage=await page.evaluate(()=>{const d=__ctx.drive;d.damage.hit({type:'hit',v:14,localX:0,localZ:d.vehicle.spec.front,localNX:0,localNZ:-1});return d.damage.amount;});assert(damage>0&&damage<1);
  assert(await page.evaluate(()=>__ctx.drive.requestExit()));await page.waitForFunction(()=>!__ctx.drive.active&&!__ctx.drive.interacting,{timeout:25000});
  const again=await page.evaluate(()=>{const d=__ctx.drive;window.__busTrace.length=0;return{ok:d.requestEnter(d.vehicle),damage:d.damage.amount,occupied:d.vehicle.cabin.occupied};});assert(again.ok&&!again.occupied);assert.equal(again.damage,damage);
  await page.waitForFunction(()=>__ctx.drive.active&&!__ctx.drive.interacting,{timeout:25000});assert(!await page.evaluate(()=>__busTrace.some(f=>f.phase==='extract')),'empty reentry does not respawn an occupant');
  const movement=await page.evaluate(()=>{const d=__ctx.drive,x=d.car.x,z=d.car.z;d.sim(.5,{thr:1});const moved=Math.hypot(d.car.x-x,d.car.z-z);d.sim(.7,{brk:1,hand:true});d.car.vx=d.car.vz=0;d.car.speed=0;return moved;});assert(movement>.005,`${kind} responds to throttle`);
  if(index===kinds.length-1){await page.evaluate(()=>{const d=__ctx.drive;d.damage.hit({type:'hit',v:300,localX:0,localZ:d.vehicle.spec.front,localNX:0,localNZ:-1});});await page.waitForFunction(()=>document.getElementById('wasted')?.classList.contains('on'),{timeout:5000});await page.screenshot({path:path.join(out,'bus-wasted.png')});assert.equal(await page.evaluate(()=>__ctx.drive.damage.amount),1);}
  results.push({...prepared,...entered,movement,damage});console.log(JSON.stringify(results.at(-1)));await page.evaluate(()=>__ctx.drive.exit(true));
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,url:url.href,normal,results,errors},null,2));console.log('PASS: seven production bus variants, actual routed takeover, right-door NPC extraction/exit/reentry, driving/damage/WASTED and retained appearance');
}catch(error){if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:false,url:url.href,results,errors,error:error.stack},null,2));if(args.keepOpen){fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify({endpoint:browser.wsEndpoint(),pid:process.pid}));console.log(error.stack);console.log('Browser retained for fixture diagnosis; connection details in browser.json');await new Promise(()=>{});}throw error;}
finally{await browser.close();if(server.listening)await new Promise(r=>server.close(r));}
