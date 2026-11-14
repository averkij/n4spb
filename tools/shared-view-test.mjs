import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import puppeteer from 'puppeteer-core';
import { encodeView } from '../src/menu/share-codec.js';
import { REGISTRY } from '../src/areas/registry.js';
import { installFontTransport } from './font-transport.mjs';
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://x').pathname);try{const data=fs.readFileSync(path.join(process.cwd(),name));res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.gz':'application/octet-stream'})[path.extname(name)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-sandbox'],protocolTimeout:300000,defaultViewport:{width:1280,height:720}});
try{
 const page=await browser.newPage();await installFontTransport(page);
 await page.setRequestInterception(true);page.on('request',req=>{const m=/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());if(m){const f=path.join('node_modules/three',m[1]);if(fs.existsSync(f))return req.respond({status:200,contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(f)});}req.continue();});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text;window.__copyCount=(window.__copyCount||0)+1;}}});});
 await page.goto(base+'index.html',{waitUntil:'load'});await page.waitForSelector('#menu-start:not([disabled])');
 await page.click('#menu-start');await page.waitForFunction(()=>document.body?.classList.contains('playing'),{timeout:300000});
 assert.equal(await page.$('#start-menu'),null);assert.equal(new URL(page.url()).searchParams.get('play'),'1');
 await page.waitForFunction(()=>getComputedStyle(document.getElementById('intro')).opacity==='0');
 await page.screenshot({path:path.join(os.tmpdir(),'n4spb-menu-started-scene.png')});
 console.log('PASS menu Start: central scene loads and enters play automatically');
 for(const area of ['palace','finlyandsky']){
  const cam=JSON.parse(fs.readFileSync(`assets/splash/${area}/views.json`))[0].cam;
  const pos=cam.length===4?[cam[0],20,cam[1]]:cam.slice(0,3);
  const view={area,pos,rot:[.13,-.78,.002],fov:71,tod:1.35,look:'cloudy',noui:false};
  const url=new URL(encodeView(view,base,REGISTRY[area].page));if(process.argv.includes('--diagnostic-force'))url.searchParams.set('baked','force');
  await page.goto(url.href,{waitUntil:'load',timeout:120000});await page.waitForSelector('#shared-resume',{timeout:300000});
  const read=()=>page.evaluate(()=>({pos:__camera.position.toArray(),rot:[__camera.rotation.x,__camera.rotation.y,__camera.rotation.z],fov:__camera.fov,tod:__tod.k}));
  const check=await read();assert.deepEqual(check,{pos:view.pos,rot:view.rot,fov:view.fov,tod:view.tod});
  await new Promise(r=>setTimeout(r,1000));assert.deepEqual(await read(),check);
  await page.keyboard.press('p');await page.waitForFunction('!!window.__copied');
  assert.equal(new URL(await page.evaluate(()=>__copied)).search,'');
  await page.evaluate(()=>dispatchEvent(new KeyboardEvent('keydown',{code:'KeyP',repeat:true})));assert.equal(await page.evaluate(()=>__copyCount),1);
  await page.click('#shared-resume');assert.equal(await page.$('#shared-resume'),null);
  // Capture the rendered camera while riding (world yaw differs from player yaw),
  // and an underwater viewpoint that must not be snapped back to dry ground.
  await page.evaluate(area=>{if(area==='palace'){const h=__ctx.L.HERO;__ctx.playerObj.fly=false;__drive.enter();__drive.place(h.x,h.z,h.yaw);}else __setCam(480,-3,-2160,70,-10);},area);
  if(area==='palace')assert.equal(await page.evaluate(()=>__drive.active),true,'car viewpoint is captured from an occupied car');
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.keyboard.press('p');
  const copied=new URL(await page.evaluate(()=>__copied)),captured=JSON.parse(decodeURIComponent(copied.hash.slice(6)));
  if(process.argv.includes('--diagnostic-force'))copied.searchParams.set('baked','force');
  await page.goto(copied.href,{waitUntil:'load',timeout:120000});await page.waitForSelector('#shared-resume',{timeout:300000});
  assert.deepEqual(await read(),{pos:captured.pos,rot:captured.rot,fov:captured.fov,tod:captured.tod});
  await page.click('#shared-resume');
  await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{value:async()=>{throw Error('denied')}}));
  await page.keyboard.press('p');await page.waitForSelector('dialog[open] input');assert.ok((await page.$eval('dialog input',i=>i.value)).includes('#view='));await page.click('dialog button');
  console.log('PASS '+area+': direct boot, held exact camera/roll/FOV/lighting, '+(area==='palace'?'car':'underwater')+' round trip, clipboard success/fallback, explore');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();await new Promise(r=>server.close(r));}
