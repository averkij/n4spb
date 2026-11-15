// Integrated production-page character/car regression. Serial GPU job.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const shots=path.join(root,'shots','character-touch');fs.mkdirSync(shots,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local');const file=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'':data);});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const edge=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser=await puppeteer.launch({executablePath:edge,headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--disable-extensions']});
const errors=[],results=[];
try{
  const page=await browser.newPage();await page.setViewport({width:844,height:390,deviceScaleFactor:1,isMobile:true,hasTouch:true,isLandscape:true});
  await page.setRequestInterception(true);
  page.on('request',req=>{const m=/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());if(m){const f=path.join(root,'node_modules','three',m[1].split('?')[0]);if(fs.existsSync(f))return req.respond({status:200,contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(f)});}if(/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(req.url()))return req.abort();req.continue();});
  page.on('pageerror',e=>errors.push(e.stack||e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?baked=0&only=drive&noroof=1&gate=0&gates=0&guard=0`,{waitUntil:'load'});
  await page.waitForFunction(()=>document.body.classList.contains('loaded')&&window.__tc&&__ctx.characters?.ready,{timeout:120000});await page.tap('#go');await page.waitForFunction(()=>getComputedStyle(document.getElementById('intro')).visibility==='hidden');
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const tapButton=async id=>{const r=await page.evaluate(id=>{const r=__tc.btns[id].getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};},id);await page.touchscreen.tap(r.x,r.y);};
  for(const expected of [1,2,0]){await tapButton('cam');await page.waitForFunction(v=>__ctx.playerObj.view===v,{},expected);}
  await tapButton('menu');await wait(400);
  const tapText=async text=>{const r=await page.evaluate(text=>{const b=[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes(text));if(!b)throw Error('Missing touch setting '+text);b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};},text);await page.touchscreen.tap(r.x,r.y);};
  await tapText('Controls settings');await page.waitForFunction(()=>[...document.querySelectorAll('#panel button')].some(b=>b.textContent.includes('Character')));await wait(400);await tapText('Character');await page.waitForSelector('#character-choice');
  assert.equal(await page.evaluate(()=>__ctx.playerObj.inputLock),1);
  await page.select('#character-choice','1');assert.equal(await page.evaluate(()=>__ctx.characters.index),1);assert.equal(await page.evaluate(()=>localStorage.getItem('piter.character')),'man-jacket');
  await page.screenshot({path:path.join(shots,'settings.png')});await page.tap('.panel-x');assert.equal(await page.evaluate(()=>__ctx.playerObj.inputLock),0);
  await page.screenshot({path:path.join(shots,'selected-man.png')});
  const started=await page.evaluate(()=>{const ctx=__ctx,v=ctx.drive.fleet[0],c=v.cabin,p=ctx.playerObj,point=c.root.localToWorld(p.pos.clone().set(-c.spec.halfWidth-2,0,c.spec.seat[2]+.6));p.setPose(point.x,point.z,0,0,v.parked.y+.3,{stand:true});return ctx.drive.requestEnter(v);});assert(started);
  await page.keyboard.press('KeyR');await page.waitForFunction(()=>!__ctx.drive.interacting&&!__ctx.drive.active,{timeout:5000});assert.equal(await page.evaluate(()=>__ctx.playerObj.inputLock),0);
  assert.deepEqual(errors,[]);console.log('PASS: touch CAM near/far/first, nested character Settings selection/persistence and balanced panel locks; R cancels approach');
}finally{await browser.close();await new Promise(r=>server.close(r));}
