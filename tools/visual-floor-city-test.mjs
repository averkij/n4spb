// Serial GPU diagnostic: real drawn paving versus the compact runtime lookup.
// keepcpu is intentional: independent test raycasts need uploaded geometry's
// arrays. It does not change the floor collector, but is not a heap benchmark.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const normal=process.argv.includes('--normal'),quick=process.argv.includes('--quick');
const outArg=process.argv.indexOf('--out'),out=path.resolve(root,outArg>=0?process.argv[outArg+1]:'shots/visual-floor-city');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local'),f=path.join(root,decodeURIComponent(u.pathname));fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});res.end(e?'':b);});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const executablePath=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser=await puppeteer.launch({executablePath,headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--disable-extensions']});
const results=[];
try{
  for(const name of quick?['index']:['index','admiralty']){
    const page=await browser.newPage(),errors=[];await page.setViewport({width:1440,height:900});await page.setRequestInterception(true);
    page.on('request',r=>{const m=/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(r.url());if(m){const f=path.join(root,'node_modules/three',m[1].split('?')[0]);if(fs.existsSync(f))return r.respond({status:200,contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(f)});}if(/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(r.url()))return r.abort();r.continue();});
    page.on('pageerror',e=>errors.push(e.stack||e.message));
    const start=Date.now();await page.goto(`http://127.0.0.1:${server.address().port}/${name}.html?keepcpu=1&guard=0&gate=0${normal?'':'&baked=force'}`,{waitUntil:'load',timeout:180000});
    await page.waitForFunction(()=>document.body.classList.contains('loaded')&&__ctx.characters?.ready&&__ctx.visualFloor,{timeout:180000});
    const loadMs=Date.now()-start;
    await page.click('#go');await page.waitForFunction(()=>getComputedStyle(document.getElementById('intro')).visibility==='hidden');await page.evaluate(()=>document.exitPointerLock());
    const result=await page.evaluate(async()=>{
      const THREE=await import('three'),ctx=__ctx,p=ctx.playerObj,floor=ctx.visualFloor;
      const candidates=[];
      for(const line of ctx.services.streets.sidewalks){for(let i=1;i<line.pts.length;i++){
        const a=line.pts[i-1],b=line.pts[i],x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<1)continue;
        const distance=Math.hypot(x-p.pos.x,z-p.pos.z);if(distance>600)continue;
        for(const offset of [0,line.w*.5,line.w*.5+.12,-line.w*.5])candidates.push({x:x-dz/len*offset,z:z+dx/len*offset,distance,offset});
      }}
      candidates.sort((a,b)=>a.distance-b.distance);
      const sources=[];ctx.staticRoot.updateWorldMatrix(true,true);ctx.staticRoot.traverse(o=>{const m=o.material;if(o.isMesh&&!o.isInstancedMesh&&!o.isSkinnedMesh&&o.geometry?.attributes.position?.array&&!Array.isArray(m)&&m&&!m.transparent&&m.opacity>=.99&&m.depthWrite!==false)sources.push(o);});
      const ray=new THREE.Raycaster(),direction=new THREE.Vector3(0,-1,0),origin=new THREE.Vector3(),normal=new THREE.Vector3(),samples=[];
      for(const c of candidates.slice(0,180)){
        const base=ctx.physics.groundHeight(c.x,c.z,0,false);if(!Number.isFinite(base)||Math.abs(base)>.01||ctx.physics.columnBlocked(c.x,c.z,.3,.2,1.7))continue;
        ray.set(origin.set(c.x,base+.305,c.z),direction);ray.near=0;ray.far=.306;
        const hit=ray.intersectObjects(sources,false).find(h=>h.face&&normal.copy(h.face.normal).transformDirection(h.object.matrixWorld).y>.7);
        if(!hit||hit.point.y<base+.015)continue;
        const actual=floor.heightAt(c.x,c.z,base);samples.push({...c,base,drawn:hit.point.y,actual,error:actual-hit.point.y});if(samples.length>=48)break;
      }
      const before={...floor.stats},begin=performance.now();for(let repeat=0;repeat<100;repeat++)for(const s of samples)floor.heightAt(s.x,s.z,s.base);const queryMs=performance.now()-begin;
      window.__floorEvidence={THREE,samples};
      return{baked:!!ctx.baked,stats:{...floor.stats},samples,queryCount:samples.length*100,queryMs,averageQueryTests:(floor.stats.queryTests-before.queryTests)/(samples.length*100),sceneErrors:window.__errors||[]};
    });
    results.push({name,loadMs,...result,errors});fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(results,null,2));
    assert(result.baked,'diagnostic loads the authored baked geometry');assert(result.samples.length>=12,'enough actual nearby pavement/kerb samples');assert.equal(result.stats.truncated,0,'full-city floor index stays inside its budget');
    assert(result.samples.every(s=>Math.abs(s.error)<.002),'lookup matches independent rendered mesh raycast within 2 mm');
    for(const index of [0,1]){
      await page.evaluate(index=>{const ctx=__ctx,p=ctx.playerObj,s=__floorEvidence.samples.find(s=>Math.abs(s.drawn-.12)<.003)||__floorEvidence.samples[0];ctx.characters.select(index);p.setPose(s.x,s.z,0,0,s.base+.05,{stand:true});p.setView(0);window.__floorShot=true;if(!window.__floorShotHook){window.__floorShotHook=true;ctx.onUpdate(()=>{if(!__floorShot)return;ctx.camera.position.set(p.pos.x+1.6,p.pos.y+.75,p.pos.z+2.7);ctx.camera.lookAt(p.pos.x,p.pos.y+.7,p.pos.z);});}},index);
      await page.evaluate(()=>new Promise(r=>{let n=0;const f=()=>++n>30?r():requestAnimationFrame(f);requestAnimationFrame(f);}));await page.screenshot({path:path.join(out,`${name}-${index===0?'girl':'man'}-paving.png`)});
    }
    assert.deepEqual(errors,[]);assert.deepEqual(result.sceneErrors,[]);
    console.log(JSON.stringify({name,loadMs,stats:result.stats,samples:result.samples.length,maxError:Math.max(...result.samples.map(s=>Math.abs(s.error))),queryMs:result.queryMs,queryCount:result.queryCount,averageQueryTests:result.averageQueryTests}));await page.close();
  }
}finally{await browser.close();await new Promise(r=>server.close(r));}
