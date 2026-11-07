// Serial real-renderer validation of the assembled deployment, never the source server.
// node tools/pages-assets-browser-test.mjs --site dist --pages palace,moskovskaya,narvsky --mobile narvsky --out shots/packed-deployment
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
import {startStaticServer} from './lib/static-readonly.mjs';
import {ENDPOINT} from './lib/dev-revision.mjs';
import {installFontTransport} from './font-transport.mjs';
import {REGISTRY} from '../src/areas/registry.js';
import {CODEC_PATH,PACK_MANIFEST} from './pages-data-pack.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2),arg=(key,def)=>{const i=args.indexOf('--'+key);return i<0?def:args[i+1];};
const site=fs.realpathSync(path.resolve(root,arg('site','dist'))),out=path.resolve(root,arg('out','shots/packed-deployment'));
const pages=arg('pages','palace,moskovskaya,narvsky');
const ids=pages==='none'?[]:pages.split(',').filter(Boolean),mobile=args.includes('--no-mobile')?null:arg('mobile','narvsky');
assert(ids.length||mobile,'select at least one desktop or mobile boot');
assert(fs.existsSync(path.join(site,PACK_MANIFEST))&&fs.existsSync(path.join(site,CODEC_PATH)),'assemble the packed deployment first');
for(const id of[...ids,...(mobile?[mobile]:[])])assert(REGISTRY[id]&&!REGISTRY[id].parked&&REGISTRY[id].status!=='planned','known live area '+id);
fs.mkdirSync(out,{recursive:true});const report={site,normalBake:true,quality:'medium',runs:[]};
const server=await startStaticServer(site);let browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
  const exe=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
  browser=await puppeteer.launch({executablePath:exe,headless:true,protocolTimeout:300000,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--enable-webgl','--disable-gpu-sandbox','--no-first-run'],defaultViewport:{width:1280,height:720}});
  for(const [id,isMobile]of[...ids.map(id=>[id,false]),...(mobile?[[mobile,true]]:[])]){
    const row=REGISTRY[id],entry={area:id,mobile:isMobile,errors:[],consoleErrors:[],failedRequests:[],expectedRevisionProbes:[],expectedRevisionProbeCancellations:[],helper:false},page=await browser.newPage();report.runs.push(entry);
    try{
      if(isMobile){await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1});await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1');}
      // Published mobile entry redirects immediately to diagnostics, which can
      // cancel pending font tokens. Let the browser load its fonts normally on
      // that route; desktop keeps the existing offline-safe Node font transport.
      if(!isMobile)await installFontTransport(page);await page.setRequestInterception(true);
      page.on('request',req=>{const match=/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());if(match){const f=path.join(root,'node_modules/three',match[1].split('?')[0]);if(fs.existsSync(f))return req.respond({status:200,contentType:'text/javascript; charset=utf-8',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(f)});}if(!req.isInterceptResolutionHandled())req.continue();});
      page.on('pageerror',e=>entry.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')entry.consoleErrors.push(m.text().slice(0,600));});
      page.on('response',r=>{const url=new URL(r.url());if(url.pathname==='/'+CODEC_PATH&&r.ok())entry.helper=true;
        // Static Pages has no development revision endpoint. Its exact expected
        // 404 falls back to the generated revision, verified against the bake below.
        if(r.status()===404&&url.pathname===ENDPOINT){entry.expectedRevisionProbes.push({status:404,url:r.url()});return;}
        if(r.status()>=400&&!url.pathname.endsWith('/favicon.ico'))entry.failedRequests.push({status:r.status(),url:r.url()});});
      page.on('requestfailed',req=>{
        const failure={url:req.url(),error:req.failure()?.errorText};
        if(new URL(req.url()).pathname===ENDPOINT&&failure.error==='net::ERR_ABORTED'&&entry.expectedRevisionProbes.some(probe=>probe.status===404&&probe.url===failure.url)){entry.expectedRevisionProbeCancellations.push(failure);return;}
        if(!req.url().includes('fonts.'))entry.failedRequests.push(failure);
      });
      const started=Date.now();await page.goto(`http://127.0.0.1:${server.port}/${row.page}?q=medium`,{waitUntil:'load',timeout:120000});
      await page.waitForFunction(()=>document.body.classList.contains('loaded')||!!document.getElementById('fatal'),{timeout:300000});
      if(isMobile){
        const warning=await page.evaluate(()=>{const card=document.getElementById('fatal'),button=card?.querySelector('button');return card?{title:card.querySelector('h2')?.textContent||'',text:card.textContent||'',button:button?.textContent||''}:null;});
        if(warning&&/Continue anyway/.test(warning.button)&&(/Before you start/i.test(warning.title)||/A heavy 3D scene/.test(warning.text))){
          entry.mobileStartupWarning={title:warning.title,button:warning.button};
          // Exercise the published native warning action, retaining its normal
          // session state and load path. Actual fatal/reload cards are not dismissed.
          await page.click('#fatal button');
          await page.waitForFunction(()=>(document.body.classList.contains('loaded')&&window.__ctx?.baked?.manifest&&!document.getElementById('go')?.disabled)||!!document.getElementById('fatal'),{timeout:300000});
        }
      }
      entry.loadSeconds=(Date.now()-started)/1000;
      const state=await page.evaluate(()=>({area:window.__ctx?.area?.ID,manifest:window.__ctx?.baked?.manifest?.area,revision:window.__ctx?.services?.baked?.revision,failures:window.__ctx?.services?.baked?.failures,modules:Object.keys(window.__stats?.modules||{}),moduleErrors:window.__errors||[],fatal:document.getElementById('fatal')?.innerText,goEnabled:!!document.getElementById('go')&&!document.getElementById('go').disabled,rects:window.__ctx?.L?.WORLD?.rects,url:location.href}));entry.state=state;
      const manifest=JSON.parse(fs.readFileSync(path.join(site,'assets',row.bake,'manifest.json')));
      assert.equal(state.area,id);assert.equal(state.manifest,id);assert.equal(state.revision,manifest.revision,'normal generated revision must match shipping bake');
      assert(!state.fatal&&state.goEnabled);assert.deepEqual(state.failures,[]);assert.deepEqual(state.moduleErrors,[]);
      assert.deepEqual(state.rects.map(r=>[r.x0,r.x1,r.z0,r.z1]),row.play.map(r=>[r.x0,r.x1,r.z0,r.z1]),'loaded layout belongs to the selected area');
      for(const key of['city','people','traffic','drive'])assert(state.modules.includes(key),'real integrated module '+key);
      assert(entry.helper,'the deployed data helper was actually fetched');assert.equal(new URL(state.url).searchParams.get('baked'),null,'no forced bake');
      for(const canceled of entry.expectedRevisionProbeCancellations)assert(entry.expectedRevisionProbes.some(probe=>probe.status===404&&probe.url===canceled.url),'a revision cancellation is allowed only after its exact static 404 was observed');
      if(isMobile)assert(new URL(state.url).pathname.includes('diagnostics-'),'published mobile entry loads its diagnostic page');
      await page.click('#go');await page.waitForFunction(()=>document.body.classList.contains('playing'),{timeout:20000});
      await page.waitForFunction(()=>{const e=document.getElementById('intro');return !e||getComputedStyle(e).visibility==='hidden';},{timeout:15000});await pause(700);
      entry.screenshot=`${id}${isMobile?'-mobile':''}.png`;await page.screenshot({path:path.join(out,entry.screenshot)});
      entry.final=await page.evaluate(()=>({area:__ctx.area.ID,playing:document.body.classList.contains('playing'),failures:__ctx.services.baked?.failures,moduleErrors:window.__errors||[]}));
      assert.deepEqual(entry.final.failures,[]);assert.deepEqual(entry.final.moduleErrors,[]);assert.deepEqual(entry.errors,[]);assert.deepEqual(entry.failedRequests,[]);
      entry.ok=true;console.log(`PASS packed ${id}${isMobile?' mobile diagnostics':''}: ${entry.loadSeconds.toFixed(1)}s, revision ${state.revision}, ${state.modules.length} integrated modules, helper fetched, no failed regions/modules`);
    }catch(error){entry.ok=false;entry.error=error.stack;console.error(`FAIL packed ${id}: ${error.message}`);try{await page.screenshot({path:path.join(out,id+(isMobile?'-mobile':'')+'-failure.png')});}catch{}}
    finally{await page.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
  }
}finally{if(browser)await browser.close();await server.close();}
assert(report.runs.every(r=>r.ok),'packed deployment browser validation failed; see report.json');
