import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out='shots/character-polygon',wait=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,defaultViewport:{width:1200,height:850},args:['--use-angle=d3d11','--enable-gpu']});
const errors=[],results=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5186/character-test.html?test=1');await page.waitForFunction('window.__ready');await page.click('#start');
 for(const character of [0,1])for(const run of [false,true]){
  await page.evaluate(c=>{__polygon.reset();document.querySelector(`[data-character="${c}"]`).click();__polygon.pose(22,15);__polygon.look(Math.PI/2,.1);},character);
  await page.waitForFunction('__polygon.state.grounded && !__polygon.state.jump && __polygon.state.y<.06');
  if(run){await page.keyboard.down('KeyW');await page.keyboard.down('ShiftLeft');await wait(450);}
  const before=await page.evaluate(()=>({state:__polygon.state,pose:__polygon.bodyPose}));
  await page.keyboard.press('Space');
  const result=await page.evaluate(()=>new Promise(resolve=>{
   const frames=[],shots={},start=performance.now();
   function sample(now){
    const state=structuredClone(__polygon.state),pose=__polygon.bodyPose,jump=state.jump;
    frames.push({time:now,state,pose});
    const label=jump?.phase==='anticipation'&&jump.time>=.05?'crouch':jump?.phase==='air'&&state.vy>3?'takeoff':jump?.phase==='air'&&Math.abs(state.vy)<.5?'apex':jump?.phase==='land'&&jump.time>.03?'landing':null;
    if(label&&!shots[label])shots[label]=document.querySelector('canvas').toDataURL('image/png').split(',')[1];
    if(now-start<1250)requestAnimationFrame(sample);else resolve({frames,shots});
   }requestAnimationFrame(sample);
  }));
  await page.keyboard.up('KeyW');await page.keyboard.up('ShiftLeft');
  const frames=result.frames,anticipation=frames.filter(f=>f.state.jump?.phase==='anticipation'),air=frames.filter(f=>f.state.jump?.phase==='air');
  fs.writeFileSync(`${out}/jump-trace-${character}-${run}.json`,JSON.stringify(result.frames,null,2));
  assert(anticipation.length>=2,'Visible preparation before launch');assert(anticipation.every(f=>f.state.grounded),'Knee bend stays grounded');
  assert(Math.max(...anticipation.map(f=>Math.abs(f.state.y-before.state.y)))<.025,'Physics does not lift during preparation');
  const crouch=Math.min(...anticipation.map(f=>f.pose.hips[1]-f.state.y));assert(crouch<.87,'Knees visibly bend before takeoff');
  assert(air.length>20);assert(Math.max(...air.map(f=>f.state.y))>.85,'Physical jump retains its height');
  assert(frames.filter(f=>f.state.jump).every(f=>f.state.animation===(run?'RunningJump':'Jump')),'Jump clip cannot switch or restart midair');
  assert(Math.max(...air.map(f=>f.pose.hips[1]-f.state.y))<.97,'No double vertical root motion');
  assert(frames.some(f=>f.state.jump?.phase==='land'),'Physics contact triggers landing recovery');assert.equal(frames.at(-1).state.grounded,true);assert.equal(frames.at(-1).state.jump,null);
  let maxStep=0;
  for(let i=1;i<frames.length;i++){const a=frames[i-1],b=frames[i],d=Math.abs(a.pose.hips[1]-b.pose.hips[1]);maxStep=Math.max(maxStep,d);const poseDelta=Math.abs((b.pose.hips[1]-b.state.y)-(a.pose.hips[1]-a.state.y));assert(poseDelta<.15+(b.time-a.time)/2000,`Continuous pose relative to physics: ${poseDelta}`);}
  for(const [phase,png] of Object.entries(result.shots))fs.writeFileSync(`${out}/jump-${character}-${run?'running':'standing'}-${phase}.png`,Buffer.from(png,'base64'));
  results.push({character,run,frames:frames.length,crouch,maxStep,apex:Math.max(...air.map(f=>f.state.y)),phases:[...new Set(frames.map(f=>f.state.jump?.phase).filter(Boolean))]});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/jump-results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({passed:true,results},null,2));
}finally{await browser.close();}
