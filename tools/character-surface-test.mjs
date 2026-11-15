// Production character soles, jump, camera dot and door sound. Serial GPU job.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const shots=path.join(root,'shots','character-surface');fs.mkdirSync(shots,{recursive:true});
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
  const ready=async()=>{await page.waitForFunction("document.body.classList.contains('loaded') && window.__ctx?.characters?.ready && window.__ctx?.visualFloor",{timeout:120000});await page.click('#go');await page.waitForFunction(() => getComputedStyle(document.getElementById('intro')).visibility==='hidden');await page.evaluate(()=>document.exitPointerLock());};
  await page.goto(url,{waitUntil:'load',timeout:120000});await ready();

  const identity=await page.evaluate(()=>({title:document.title,url:location.href}));
  assert(identity.title.includes('Saint Petersburg')&&identity.url.includes('only=drive'));
  await page.evaluate(async()=>{
    const THREE=await import('three'),ctx=__ctx,p=ctx.playerObj,ph=ctx.physics;
    const x=(p.bounds.x0+p.bounds.x1)/2,z=(p.bounds.z0+p.bounds.z1)/2;
    const fixtures=[
      {id:'paving',x,z,physical:0,visual:.12},
      {id:'kerb',x:x+8,z,physical:0,visual:.15},
      {id:'dropped-kerb',x:x+16,z,physical:0,visual:.075,slope:.025},
      {id:'walk-platform',x:x+24,z,physical:1,visual:1.12},
      {id:'bare-ground',x:x+32,z,physical:0,visual:0,noDraw:true},
      {id:'water-bed',x:x+40,z,physical:-1.2,visual:-1.2,water:true,noDraw:true},
      {id:'hole-floor',x:x+48,z,physical:-1,visual:-1,hole:true,noDraw:true},
    ];
    const terrain=ph.heightAt.bind(ph),water=fixtures.find(f=>f.water),hole=fixtures.find(f=>f.hole);
    ph.heightAt=(px,pz)=>Math.abs(px-water.x)<3&&Math.abs(pz-z)<3?-1.2:Math.abs(px-x)<60&&Math.abs(pz-z)<10?0:terrain(px,pz);
    ph.addWalkBox(x+24,z,6,4,0,1,.5);ph.addHole(hole.x,z,6,4);ph.addWalkBox(hole.x,z,6,4,0,-1,-1.3);
    ph.addWater({fn:(px,pz)=>Math.abs(px-water.x)<3&&Math.abs(pz-z)<2?.06:null});
    const group=new THREE.Group();group.name='character-surface-fixtures';
    for(const f of fixtures){
      if(f.noDraw&&!f.water)continue;
      const geometry=new THREE.PlaneGeometry(6,4).rotateX(-Math.PI/2),position=geometry.attributes.position;
      for(let i=0;i<position.count;i++)position.setY(i,(f.water?.06:f.visual)+(f.slope||0)*position.getX(i));
      geometry.computeVertexNormals();
      const material=f.water?new THREE.MeshBasicMaterial({color:'#4a8398',transparent:true,opacity:.5}):ctx.mat.toon(f.id==='kerb'?'#ccbb99':'#929b9e');
      const mesh=new THREE.Mesh(geometry,material);mesh.position.set(f.x,0,f.z);mesh.receiveShadow=true;group.add(mesh);
    }
    ctx.scene.add(group);ctx.visualFloor.addGroup(group);
    const sample=()=>{const a=ctx.characters.actor;a.root.updateMatrixWorld(true);a.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
      return{feet:p.pos.y,root:a.root.position.y,minY:new THREE.Box3().setFromObject(a.root,true).min.y,onGround:p.onGround,phase:p.jump?.phase||null,jumpTime:p.jump?.time||0,
        hip:a.rig.hips.getWorldPosition(new THREE.Vector3()).y,standHip:a.standHip,
        joints:['l','r'].map(side=>a.rig.legs[side].end.getWorldPosition(new THREE.Vector3()).y),
        expected:ctx.visualFloor.heightAt(p.pos.x,p.pos.z,p.pos.y),view:p.view,dotDisplay:getComputedStyle(document.getElementById('cross')).display};};
    window.__surface={THREE,fixtures,sample,trace:[],record:false,inspect:false};
    ctx.onUpdate(()=>{const t=__surface;if(t.record)t.trace.push(t.sample());if(t.inspect){ctx.camera.position.set(p.pos.x+1.3,p.pos.y+.48,p.pos.z+1.5);ctx.camera.lookAt(p.pos.x,p.pos.y+.28,p.pos.z);ctx.camera.fov=50;ctx.camera.updateProjectionMatrix();}});
  });
  const settle=async()=>page.evaluate(()=>new Promise(r=>{let n=0;function frame(){if(++n<24)requestAnimationFrame(frame);else r();}requestAnimationFrame(frame);}));
  for(const index of process.argv.includes('--audio-only')?[]:[0,1]){
    await page.evaluate(index=>{__ctx.characters.select(index);__ctx.playerObj.setView(0);},index);
    const fixtures=await page.evaluate(()=>__surface.fixtures);
    for(const f of fixtures){
      await page.evaluate(f=>{const p=__ctx.playerObj;p.keys.clear();p.setPose(f.x,f.z,0,0,f.physical+.05,{stand:true});p.enabled=true;p.inputLock=0;},f);
      await settle();
      const samples=await page.evaluate(()=>new Promise(resolve=>{const rows=[];function frame(){rows.push(__surface.sample());if(rows.length<10)requestAnimationFrame(frame);else resolve(rows);}requestAnimationFrame(frame);}));
      for(const s of samples){assert(Math.abs(s.feet-f.physical)<.002,`${index}/${f.id}: physical feet stay on their collider`);assert(Math.abs(s.expected-f.visual)<.002,`${index}/${f.id}: visible-floor query`);assert(Math.abs(s.minY-f.visual)<.002,`${index}/${f.id}: skinned soles ${s.minY} meet drawn floor ${f.visual}`);}
      results.push({index,id:f.id,minY:Math.min(...samples.map(s=>s.minY)),maxY:Math.max(...samples.map(s=>s.minY)),physical:f.physical,visual:f.visual});
      if(['kerb','dropped-kerb','walk-platform'].includes(f.id)){await page.evaluate(()=>{__surface.inspect=true;});await settle();await page.screenshot({path:path.join(shots,`${index}-${f.id}-feet.png`)});await page.evaluate(()=>{__surface.inspect=false;});}
    }
    // The sloped dropped kerb is interpolated continuously at both ends.
    for(const dx of [-1.5,1.5]){
      const s=await page.evaluate(dx=>{const f=__surface.fixtures.find(f=>f.slope),p=__ctx.playerObj;p.setPose(f.x+dx,f.z,0,0,.05,{stand:true});__ctx.characters.update(0);return __surface.sample();},dx);
      assert(Math.abs(s.minY-(.075+.025*dx))<.002,`${index}: slope interpolation follows the drawn ramp at ${dx}: ${JSON.stringify(s)}`);
    }
    const start=await page.evaluate(()=>{const f=__surface.fixtures[0],p=__ctx.playerObj;p.setPose(f.x,f.z,0,0,.05,{stand:true});__ctx.characters.update(0);return __surface.sample();});
    await settle();await page.evaluate(()=>{__surface.trace=[];__surface.record=true;});
    await page.keyboard.press('Space');
    await page.waitForFunction(()=>__surface.trace.some(s=>s.phase==='air'),{timeout:5000});
    await page.waitForFunction(()=>__surface.trace.some(s=>s.phase==='land')&&!__ctx.playerObj.jump,{timeout:5000});
    const trace=await page.evaluate(()=>{__surface.record=false;return __surface.trace;});
    const anticipation=trace.filter(s=>s.phase==='anticipation'),air=trace.filter(s=>s.phase==='air');
    assert(anticipation.length>=2&&air.length>=10,`${index}: real Space drives crouch and flight phases`);
    for(const s of anticipation){assert(Math.abs(s.feet-start.feet)<.001,'anticipation does not lift physical feet');s.joints.forEach((y,i)=>assert(Math.abs(y-start.joints[i])<.003,`${index}: anticipation keeps both foot joints planted`));}
    const apex=Math.max(...air.map(s=>s.feet));
    assert(apex>.6&&apex<.8,'physics retains its normal jump apex');
    for(const s of air)assert(s.hip-s.feet<=s.standHip+.12+.005,`${index}: baked root lift never doubles the physics jump`);
    await settle(); // the landing-to-idle animation crossfade must complete
    const landed=await page.evaluate(()=>__surface.sample());
    assert(Math.abs(landed.minY-.12)<.002,`landing returns the soles to the raised paving: ${JSON.stringify(landed)}`);
    results.push({index,jump:{anticipation:anticipation.length,air:air.length,maxPhysics:Math.max(...air.map(s=>s.feet)),transitionEnd:trace.at(-1),settledMinY:landed.minY}});
    for(const view of [1,2,0]){
      await page.keyboard.press('KeyV');await page.waitForFunction(v=>__ctx.playerObj.view===v,{},view);await settle();
      const s=await page.evaluate(()=>__surface.sample());assert.equal(s.dotDisplay==='none',view!==2,`${index}: dot only appears in first person`);
    }
  }
  // Run one real E entry and observe the production carDoor audio event exactly
  // when the closing animation reaches its shut pose. The sound still plays.
  await page.evaluate(async()=>{
    const ctx=__ctx,d=ctx.drive,v=d.vehicleById('coupe'),c=v.cabin,p=ctx.playerObj;
    if(d.active)d.exit(true);c.occupied=false;__surface.inspect=false;
    const point=c.root.localToWorld(p.pos.clone().set(-c.spec.halfWidth-.72,0,c.spec.seat[2]+.6));
    const yaw=Math.atan2(point.x-v.parked.x,point.z-v.parked.z)*180/Math.PI;
    p.setPose(point.x,point.z,yaw,0,v.parked.y+.05,{stand:true});p.enabled=true;
    ctx.audio.muted=false;ctx.audio.start();if(ctx.audio.context?.state!=='running')await ctx.audio.context?.resume();
    window.__doorClaps=[];const play=ctx.audio.play.bind(ctx.audio);ctx.audio.play=(name,options)=>{if(name==='carDoor')__doorClaps.push({phase:d.interaction?.phase,door:c.doorAmount,rotation:c.door.rotation.y,position:options.position?.toArray()});return play(name,options);};
    ctx.interact.update();
  });
  await settle();await page.keyboard.press('KeyE');
  try { await page.waitForFunction(()=>__ctx.drive.interacting||__ctx.drive.active,{timeout:5000}); }
  catch(error){error.message+=' '+JSON.stringify(await page.evaluate(()=>({active:__ctx.drive.active,interaction:__ctx.drive.interaction,lock:__ctx.playerObj.inputLock,fly:__ctx.playerObj.fly,enabled:__ctx.playerObj.enabled,pos:__ctx.playerObj.pos.toArray(),car:__ctx.drive.vehicleById('coupe').parked,prompt:document.getElementById('prompt')?.textContent,toast:document.getElementById('toast')?.textContent,claps:__doorClaps})));throw error;}
  await page.waitForFunction(()=>__ctx.drive.active&&!__ctx.drive.interacting,{timeout:12000});await settle();
  const claps=await page.evaluate(()=>__doorClaps);assert.equal(claps.length,1,'one real entry causes one audible door-close event');assert.equal(claps[0].phase,'close');assert.equal(claps[0].door,0);assert.equal(claps[0].rotation,0);assert(claps[0].position.every(Number.isFinite));
  assert.deepEqual(errors,[],'no production page runtime errors');
  fs.writeFileSync(path.join(shots,process.argv.includes('--audio-only')?'audio-result.json':'result.json'),JSON.stringify({passed:true,identity,results,claps,errors},null,2));
  console.log(process.argv.includes('--audio-only')?'PASS real E entry emits one door-close sound at the shut pose':'PASS production soles on paving/kerbs/slope/raised platform/water/hole, jump, camera dot and door-close sound');
}catch(error){fs.writeFileSync(path.join(shots,'result.json'),JSON.stringify({passed:false,results,errors,error:error.stack},null,2));throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
