import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';
import { REGISTRY } from '../src/areas/registry.js';
import { encodeView,decodeView } from '../src/menu/share-codec.js';
import { publishedEntry } from './lib/pages-entry.mjs';
const sample={area:'palace',pos:[-100,12,30],rot:[.1,.2,.003],fov:62,tod:1.25,look:'cloudy',noui:true};
const url=encodeView(sample,'https://example.org/game/index.html?debug=1','index.html');
assert.equal(new URL(url).pathname,'/game/index.html');assert.equal(new URL(url).search,'');
assert.deepEqual(decodeView(new URL(url).hash,REGISTRY),{v:1,...sample});
for(const change of [{v:2},{area:'missing'},{area:'__proto__'},{pos:[null,0,0]},{rot:[0,0]},{fov:0},{tod:9},{look:'bad'}])assert.equal(decodeView('#view='+encodeURIComponent(JSON.stringify({v:1,...sample,...change})),REGISTRY).invalid,true);
assert.ok(!decodeView(new URL(encodeView({...sample,rot:[0,12345,0]},'https://example.org/game/','index.html')).hash,REGISTRY).invalid);
assert.equal(decodeView('#other',REGISTRY),null);
const map=JSON.parse(fs.readFileSync('assets/menu/map.json'));
assert.equal(map.catalogue.length,Object.values(REGISTRY).filter(r=>!r.parked&&r.status!=='planned').length);
assert.equal(new Set(map.catalogue.map(a=>a.name)).size,map.catalogue.length);
for(const a of map.catalogue){assert.equal(a.images.length,5);assert.ok(map.areas.some(r=>r.id===a.id));if(process.argv.includes('--assets'))for(const image of a.images)assert.ok(fs.statSync(image).size>10000,image);}
const server=http.createServer((req,res)=>{let p=decodeURIComponent(new URL(req.url,'http://x').pathname);const published=p.startsWith('/published/');if(published)p=p.slice('/published'.length);if(p.endsWith('/'))p+='index.html';const f=path.join(process.cwd(),p);try{let data=fs.readFileSync(f);const row=published&&Object.values(REGISTRY).find(r=>'/'+r.page===p);if(row)data=publishedEntry(data.toString('utf8'),row.page==='index.html'?'diagnostics.html':'diagnostics-'+row.page);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.ttf':'font/ttf'})[path.extname(f)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-first-run'],defaultViewport:{width:1440,height:900}});
try{
 const page=await browser.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 for(const [i,background] of ['well-sky','tram','rooftops'].entries()){
   const fixedRandom=await page.evaluateOnNewDocument(value=>{Math.random=()=>value;},(i+.5)/3);
   const firstRequest=requests.length;
   await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForSelector('#menu-start:not([disabled])');
   await page.removeScriptToEvaluateOnNewDocument(fixedRandom.identifier);
   assert.equal(await page.title(),'Питер');assert.equal(await page.$eval('#start-menu h1',e=>e.textContent),'Питер');
   const artwork=await page.$eval('#start-menu',e=>getComputedStyle(e).backgroundImage);
   assert.ok(artwork.endsWith(`/assets/menu/backgrounds/${background}.jpg")`),'selected artwork is used');
   await page.evaluate(async()=>{await document.fonts.ready;const image=new Image();image.src=getComputedStyle(document.querySelector('#start-menu')).backgroundImage.slice(5,-2);await image.decode();});
   assert.deepEqual([...new Set(requests.slice(firstRequest).filter(u=>/assets\/menu\/.*\.jpg$/.test(u)).map(u=>new URL(u).pathname))],[`/assets/menu/backgrounds/${background}.jpg`],'only the selected background loads');
   await page.click('#area-next');await page.click('#area-prev');
   assert.equal(await page.$eval('#start-menu',e=>getComputedStyle(e).backgroundImage),artwork,'area selection preserves the background');
   for(const [label,width,height] of [['desktop',1440,900],['mobile',390,844]]){
     await page.setViewport({width,height});
     await page.screenshot({path:path.join(os.tmpdir(),`n4spb-menu-${background}-${label}.png`),fullPage:true});
     assert.equal(await page.$eval('#start-menu',e=>getComputedStyle(e).backgroundImage),artwork,'resizing preserves the background');
   }
   await page.setViewport({width:1440,height:900});
 }
 assert.equal(await page.$eval('#selected-name',e=>e.textContent),'Центр');assert.ok(!requests.some(u=>/src\/main.js|assets\/baked|three.*\.js/.test(u)),'menu must not load scene');
 await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.$eval('#start-menu h1',e=>getComputedStyle(e).fontFamily),'MenuDisplay, sans-serif');
 assert.equal(await page.$eval('.menu-map',e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 assert.equal(await page.$('#area-choice, .map-zoom, .map-heading, .map-legend, .menu-description, .eyebrow, .menu-brand, #start-menu footer'),null);
 assert.equal(await page.$('#menu-start svg'),null);
 assert.equal(await page.$eval('#menu-start',e=>getComputedStyle(e,'::before').content),'none');
 const box=await page.$eval('#city-map',e=>e.getAttribute('viewBox'));
 await page.mouse.move(1100,400);await page.mouse.wheel({deltaY:300});
 await page.mouse.move(800,300);await page.mouse.down();await page.mouse.move(900,350);await page.mouse.up();
 assert.equal(await page.$eval('#city-map',e=>e.getAttribute('viewBox')),box,'map framing stays fixed');
 const clickPoint=await page.$eval('#city-map [data-area="vasilyevsky"]',e=>{
   const b=e.getBBox(),matrix=e.getScreenCTM();
   for(let y=.2;y<1;y+=.1)for(let x=.2;x<1;x+=.1){const local=new DOMPoint(b.x+x*b.width,b.y+y*b.height),screen=local.matrixTransform(matrix);if(e.isPointInFill(local)&&document.elementFromPoint(screen.x,screen.y)===e)return {x:screen.x,y:screen.y};}
 });
 assert.ok(clickPoint,'district can be reached by the pointer');
 await page.mouse.move(1,1);
 const districtStyle=()=>page.$eval('#city-map [data-area="vasilyevsky"]',e=>{const s=getComputedStyle(e);return {fill:s.fill,stroke:s.stroke,width:s.strokeWidth};});
 const resting=await districtStyle();await page.mouse.move(clickPoint.x,clickPoint.y);
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#city-map [data-area="vasilyevsky"]')).fill==='rgb(48, 36, 62)');
 const hovered=await districtStyle();assert.notEqual(hovered.fill,resting.fill);assert.equal(hovered.stroke,resting.stroke);assert.equal(hovered.width,resting.width);
 await page.screenshot({path:path.join(os.tmpdir(),'n4spb-menu-hover.png')});
 await page.mouse.click(clickPoint.x,clickPoint.y);
 assert.equal(await page.$eval('#city-map [data-area="vasilyevsky"]',p=>p.getAttribute('aria-pressed')),'true');
 await page.$eval('#city-map [data-area="aptekarsky"]',e=>e.focus());await page.keyboard.press('Enter');
 assert.equal(await page.$eval('#city-map [data-area="aptekarsky"]',p=>p.getAttribute('aria-pressed')),'true');
 await page.click('#area-next');assert.equal(await page.$eval('#city-map [data-area="islands"]',p=>p.getAttribute('aria-pressed')),'true');
 await page.click('#area-next');assert.equal(await page.$eval('#city-map [data-area="palace"]',p=>p.getAttribute('aria-pressed')),'true');
 await page.click('#area-prev');assert.equal(await page.$eval('#city-map [data-area="islands"]',p=>p.getAttribute('aria-pressed')),'true');
 await page.click('#area-next');
 await page.click('#menu-sound');assert.equal(await page.$eval('#menu-sound',b=>b.getAttribute('aria-pressed')),'true');
 assert.equal(await page.evaluate(()=>localStorage.getItem('piter.menuMute')),'1');
 await page.click('#menu-sound');
 await page.$eval('#menu-sound',b=>b.blur());await page.mouse.move(1,1);
 for(const [label,width,height] of [['desktop',1440,900],['wide',2048,1080],['mobile',390,844],['small',320,568],['phone',430,932],['reference',735,1414],['portrait-concept',1067,1475],['landscape',844,390]]){
   await page.setViewport({width,height});await page.evaluate(()=>document.fonts.ready);
   await page.screenshot({path:path.join(os.tmpdir(),`n4spb-menu-${label}.png`),fullPage:true});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' has no horizontal overflow');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),label+' fits in the viewport');
   assert.ok(await page.$eval('#city-map',svg=>{const v=svg.viewBox.baseVal;return [...svg.querySelectorAll('.live')].every(p=>{const b=p.getBBox();return b.x>=v.x&&b.y>=v.y&&b.x+b.width<=v.x+v.width&&b.y+b.height<=v.y+v.height;});}),label+' frames all playable districts');
   if(height>=width&&width<=1100){
     const layout=await page.evaluate(()=>{
       const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,center:r.x+r.width/2};};
       return {title:box('#start-menu h1'),map:box('#city-map'),district:box('.area-navigation'),start:box('#menu-start'),width:innerWidth,height:innerHeight};
     });
     assert.ok(layout.title.bottom<=layout.map.top&&layout.map.bottom<=layout.district.top&&layout.district.bottom<=layout.start.top,label+' follows title, map, district, Start order');
     assert.ok(Math.abs(layout.start.center-width/2)<1&&Math.abs(layout.district.center-width/2)<1,label+' centers the bottom controls');
     assert.ok(layout.start.bottom<height&&layout.start.left>=0&&layout.start.right<=width,label+' keeps the complete Start button visible');
   }
   // Repeated clicks must hit the same arrow even when the district name wraps.
   const arrowPositions=()=>page.$$eval('.area-navigation button',buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return [r.x,r.y,r.width,r.height];}));
   const fixedArrows=await arrowPositions();
   const nextPoint={x:fixedArrows[1][0]+22,y:fixedArrows[1][1]+22};
   const seen=new Set();
   for(let i=0;i<map.catalogue.length;i++){
     await page.mouse.click(nextPoint.x,nextPoint.y);
     seen.add(await page.$eval('#city-map .chosen',p=>p.dataset.area));
     assert.deepEqual(await arrowPositions(),fixedArrows,label+' keeps arrows fixed for every district');
   }
   assert.equal(seen.size,map.catalogue.length,label+' cycles all districts from one pointer position');
 }
 await page.goto(`http://127.0.0.1:${server.address().port}/?menu=1#view=bad`);await page.waitForSelector('#menu-start:not([disabled])');assert.match(await page.$eval('#menu-status',e=>e.textContent),/недействительна/);
 await page.$eval('#city-map [data-area="aptekarsky"]',e=>e.focus());await page.keyboard.press('Enter');
 await page.setRequestInterception(true);
 const navigation=new Promise(resolve=>page.on('request',r=>{if(r.isNavigationRequest()&&r.url().includes('play=1')){resolve(r.url());r.respond({status:200,contentType:'text/html',body:'Menu navigation verified'});}else r.continue();}));
 await page.click('#menu-start');assert.match(await navigation,/aptekarsky\.html\?play=1$/);
 const mobile=await browser.newPage();mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1');
 await mobile.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 const mobileRequests=[];mobile.on('request',r=>mobileRequests.push(r.url()));
 await mobile.goto(`http://127.0.0.1:${server.address().port}/published/`);await mobile.waitForSelector('#menu-start:not([disabled])');
 assert.ok(!mobileRequests.some(u=>/src\/main.js|assets\/baked|diagnostics\.html/.test(u)),'published mobile entry stays at menu');
 await mobile.$eval('#city-map [data-area="aptekarsky"]',e=>e.focus());await mobile.keyboard.press('Enter');
 await mobile.setRequestInterception(true);
 const mobileNavigation=new Promise(resolve=>mobile.on('request',r=>{if(r.isNavigationRequest()&&r.url().includes('diagnostics-aptekarsky.html')){resolve(r.url());r.respond({status:200,contentType:'text/html',body:'Mobile scene routing verified'});}else r.continue();}));
 await mobile.click('#menu-start');const mobileTarget=new URL(await mobileNavigation);assert.equal(mobileTarget.pathname,'/published/diagnostics-aptekarsky.html');assert.equal(mobileTarget.searchParams.get('play'),'1');assert.equal(mobileTarget.searchParams.get('mobileprofile'),'1');
 assert.deepEqual(errors,[]);console.log('PASS codec, invalid links, catalogue, lazy menu, fixed framing, selection, sound preference, start navigation, desktop/mobile, console. Screenshots in '+os.tmpdir());
}finally{await browser.close();await new Promise(r=>server.close(r));}
