import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,defaultViewport:{width:1440,height:900},args:['--use-angle=d3d11','--enable-gpu']});
const out='shots/character-polygon';fs.mkdirSync(out,{recursive:true});const errors=[],results=[];
try {
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5186/character-test.html?test=1');await page.waitForFunction('window.__ready===true');await page.click('#start');
 for(const key of ['Digit2','Digit3']) {
  await page.keyboard.press(key);
  await page.evaluate(()=>{__polygon.reset();__polygon.pose(2.3,1);});
  await new Promise(r=>setTimeout(r,200));await page.keyboard.press('KeyE');
  await new Promise(r=>setTimeout(r,300));
  const trace=await page.evaluate(()=>new Promise(resolve=>{
   const frames=[],start=performance.now();function sample(t){frames.push({state:__polygon.state,pose:__polygon.driverPose});if(t-start<9500)requestAnimationFrame(sample);else resolve(frames);}requestAnimationFrame(sample);
  }));
  assert(trace.every(f=>f.state.animation==='Sitting'&&f.state.mode==='drive'),'Driver stays seated');
  const heights=trace.map(f=>f.pose.head[1]);assert(Math.max(...heights)-Math.min(...heights)<.015,'No standing flash when the old sitting clip would wrap');
  for(const side of ['left','right']) {
   const target=[-.37+(side==='left'?-.165:.165),1.175,-.465];
   const error=Math.max(...trace.map(f=>Math.hypot(...f.pose[side].map((v,i)=>v-target[i]))));
   assert(error<.08,`Hand reaches wheel: ${side} ${error}`);
  }
  await page.evaluate(()=>__polygon.look(Math.PI/2,.06));
  await new Promise(r=>setTimeout(r,100));await page.screenshot({path:`${out}/driver-${key}-side.png`});
  results.push({key,frames:trace.length,headRange:[Math.min(...heights),Math.max(...heights)],pose:trace[0].pose});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/driving-results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({passed:true,results},null,2));
}finally{await browser.close();}
