import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { REGISTRY } from '../src/areas/registry.js';
import { AREA_LABELS } from '../src/menu/area-labels.js';
import { publishedEntry } from './lib/pages-entry.mjs';

const areas=Object.values(REGISTRY).filter(r=>!r.parked&&r.status!=='planned');
const catalogue=JSON.parse(fs.readFileSync('assets/menu/map.json')).catalogue;
const facts=Object.fromEntries(areas.map(r=>[r.id,JSON.parse(fs.readFileSync(`assets/splash/${r.id}/facts.json`))]));
for(const area of areas){
 const rows=facts[area.id];
 assert.equal(rows.length,20,area.id+' has twenty facts');
 assert.equal(new Set(rows).size,20,area.id+' has no duplicate facts');
 assert.ok(rows.every(s=>typeof s==='string'&&s.length>=30&&s.length<=240&&/[а-яё]/i.test(s)&&!/[<>\n]/.test(s)),area.id+' has short plain Russian sentences');
 assert.equal(AREA_LABELS[area.id],catalogue.find(r=>r.id===area.id).name,area.id+' shares its menu name');
}
const server=http.createServer((req,res)=>{
 let p=decodeURIComponent(new URL(req.url,'http://x').pathname);
 const published=p.startsWith('/published/');if(published)p=p.slice('/published'.length);
 if(p.endsWith('/'))p+='index.html';
 try{
  let data=fs.readFileSync(path.join(process.cwd(),p));
  const row=published&&areas.find(r=>'/'+r.page===p);
  if(row)data=publishedEntry(data.toString('utf8'),row.id==='palace'?'diagnostics.html':'diagnostics-'+row.page);
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf'})[path.extname(p)]||'application/octet-stream');res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-first-run'],defaultViewport:{width:1440,height:900}});
try{
 const page=await browser.newPage(), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 let failFile='';
 await page.setRequestInterception(true);
 page.on('request',r=>{
  if(new URL(r.url()).pathname.endsWith('/src/main.js'))r.respond({status:200,contentType:'text/javascript',body:'// Hold at the actual preloader without loading WebGL.'});
  else if(failFile&&r.url().endsWith('/'+failFile))r.respond({status:503,body:'Test asset failure'});
  else r.continue();
 });
 await page.evaluateOnNewDocument(()=>{
  const originalSet=window.setInterval,originalClear=window.clearInterval;
  window.__preloaderTicks=new Map();let id=-1;
  const forced=new URL(location.href).searchParams.get('__testRandom');
  if(forced!==null)Math.random=()=>Number(forced);
  window.setInterval=(callback,ms,...args)=>{
   if(ms===4500){const token=id--;window.__preloaderTicks.set(token,()=>callback(...args));return token;}
   return originalSet(callback,ms,...args);
  };
  window.clearInterval=token=>{window.__preloaderTicks.delete(token);originalClear(token);};
 });
 const ready=async area=>{
  await page.waitForFunction((rows,name)=>rows.includes(document.getElementById('fact')?.textContent)&&document.getElementById('stname')?.textContent===name,{},facts[area.id],AREA_LABELS[area.id]);
  assert.equal(await page.$('#intro .kicker'),null,area.id+' removes kicker');
 };
 for(const area of areas){
  await page.goto(base+'/'+area.page+'?play=1');await ready(area);
  assert.equal(await page.evaluate(()=>window.__preloaderTicks.size),0,area.id+' schedules no slideshow or fact rotation');
  const art=await page.$eval('#intro',e=>e.style.getPropertyValue('--art'));
  assert.ok(art.includes('/'+area.id+'/'),'uses an image of the selected area');
  if(['palace','vasilyevsky','finlyandsky'].includes(area.id)){
   await page.screenshot({path:path.join(os.tmpdir(),`n4spb-preloader-${area.id}.png`)});
  }
 }
 // Every fact and all five images remain reachable on separate visits.
 const seen=new Set(), images=new Set();
 for(let i=0;i<20;i++){
  await page.goto(base+'/index.html?play=1&__testRandom='+((i+.25)/20));await ready(REGISTRY.palace);
  assert.equal(await page.$eval('#fact',e=>e.textContent),facts.palace[i]);
  seen.add(await page.$eval('#fact',e=>e.textContent));
  const art=await page.$eval('#intro',e=>e.style.getPropertyValue('--art'));images.add(art);
  assert.ok(art.includes('/'+(Math.floor((i+.25)/20*5)+1)+'.jpg'),'preserves the original inline image choice');
 }
 assert.equal(seen.size,20);assert.equal(images.size,5);
 const stationary=()=>page.evaluate(()=>[document.getElementById('fact').textContent,document.getElementById('intro').style.getPropertyValue('--art')]);
 const original=await stationary();await new Promise(r=>setTimeout(r,9500));
 assert.deepEqual(await stationary(),original,'one fact and image stay fixed beyond the old rotation intervals');
 // Missing photo metadata must not suppress facts; missing facts preserve the inline fallback.
 for(const file of ['views.json','facts.json']){
  failFile=file;await page.goto(base+'/vasilyevsky.html?play=1');
  await page.waitForSelector('#fact[data-ready]');
  assert.equal(await page.$eval('#stname',e=>e.textContent),'Васька 1');
  assert.equal(await page.$('#intro .kicker'),null);
  if(file==='views.json')assert.ok(facts.vasilyevsky.includes(await page.$eval('#fact',e=>e.textContent)));
  else assert.ok((await page.$eval('#fact',e=>e.textContent)).length>30);
 }
 failFile='';
 await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1');
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 for(const id of ['vasilyevsky','finlyandsky']){
  const area=REGISTRY[id];await page.goto(base+'/published/'+area.page+'?play=1');await ready(area);
  assert.ok(page.url().includes('diagnostics-'+area.page),'published mobile uses its real diagnostic preloader');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no mobile horizontal overflow');
  await page.screenshot({path:path.join(os.tmpdir(),`n4spb-preloader-${id}-mobile.png`),fullPage:true});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS 21 clean area names, 420 short facts, all random choices reachable, static fact/image per load, no caption overwrite, asset failure fallback and published mobile preloaders.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
