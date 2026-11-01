// Normal shipping page, real keyboard movement at the reported pond bank.
// GPU: run serially, after the final matching bake.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import {fileURLToPath} from 'node:url';
import {handleBakedRevision} from './lib/dev-revision.mjs';
import {installFontTransport} from './font-transport.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'shots/park-repair/shipping');
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{if(handleBakedRevision(req,res,root))return;const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,b)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(err?'':b);});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const executablePath=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser=await puppeteer.launch({executablePath,headless:true,protocolTimeout:300000,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-sandbox','--no-first-run'],defaultViewport:{width:1280,height:720}});
const page=await browser.newPage(),report={checks:[],errors:[],screenshots:[]};await installFontTransport(page,true);
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(/^\[module\s|Shader Error|CONTEXT_LOST/.test(m.text()))report.errors.push(m.text());});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=(name,ok,detail)=>{report.checks.push({name,ok,detail});console.log(`${ok?'PASS':'FAIL'} ${name} ${JSON.stringify(detail??'')}`);assert(ok,name);};
async function state(){return page.evaluate(()=>{const p=__ctx.playerObj;return{x:p.pos.x,y:p.pos.y,z:p.pos.z,fly:p.fly,ground:p.onGround,water:__ctx.physics.waterLevel(p.pos.x,p.pos.z),surface:__ctx.physics.groundHeight(p.pos.x,p.pos.z,p.pos.y,false),rescues:window.__shoreRescues||0};});}
async function walk(yaw,ms){await page.evaluate(yaw=>{__ctx.playerObj.yaw=yaw*Math.PI/180;},yaw);await page.keyboard.down('KeyW');let minY=Infinity;try{for(let i=0;i<Math.ceil(ms/200);i++){await sleep(200);minY=Math.min(minY,(await state()).y);}}finally{await page.keyboard.up('KeyW');}await sleep(500);return{...await state(),minY};}
try{
  const t=Date.now();await page.goto(`http://127.0.0.1:${server.address().port}/moskovskaya.html?q=medium`,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>document.body.classList.contains('loaded')||!!document.getElementById('fatal'),{timeout:300000});report.loadSeconds=(Date.now()-t)/1000;
  const boot=await page.evaluate(()=>({fatal:document.getElementById('fatal')?.innerText,area:__ctx.baked?.manifest?.area,revision:__ctx.services.baked?.revision,failures:__ctx.services.baked?.failures}));
  check('fresh normal shipping bake',!boot.fatal&&boot.area==='moskovskaya'&&!!boot.revision&&boot.failures.length===0,boot);await page.click('#go');await page.waitForFunction(()=>document.body.classList.contains('playing'));
  await page.evaluate(async()=>{await __regions.ensureAt(-1407.9,7248.1);__setCam(-1407.9,null,7248.1,-61.9,-1.3);window.__shoreRescues=0;const p=__ctx.playerObj,old=p.onRescue;p.onRescue=()=>{window.__shoreRescues++;old?.();};__ctx.gates?.teleported();});await sleep(400);
  check('reported water position starts walking on a solid bed',!(await state()).fly&&(await state()).water!==null,await state());
  const exit=await walk(-61.9,8500);check('real W exits reported pond bank without falling',exit.water===null&&exit.ground&&exit.y>-.05&&exit.minY>=-2.42&&exit.rescues===0,exit);
  const enter=await walk(118.1,8500);check('real W returns into pond without falling through border',enter.water!==null&&enter.ground&&enter.minY>=-2.42&&enter.rescues===0,enter);
  const secondExit=await walk(-61.9,8500);check('second pond exit remains supported',secondExit.water===null&&secondExit.ground&&secondExit.y>-.05&&secondExit.rescues===0,secondExit);
  const poses=[[-1414.2,1.5,7319.3,-71.1,-12.8],[-1414.8,1.5,7316.4,-16.2,-11.4],[-1422.6,1.5,7289.4,-50.1,-14.2],[-1407.9,-.9,7248.1,-61.9,-1.3],[-1386,.2,7158.4,121.5,-10]];
  for(let i=0;i<poses.length;i++){await page.evaluate(async p=>{await __regions.ensureAt(p[0],p[2]);__setCam(...p);__ctx.gates?.teleported();},poses[i]);await sleep(500);const name=`reported-${i+1}.png`;await page.screenshot({path:path.join(out,name)});report.screenshots.push(name);}
  check('no failed regions or module/browser errors',await page.evaluate(()=>__regions.stats.failed===0)&&report.errors.length===0,report.errors);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r));}
