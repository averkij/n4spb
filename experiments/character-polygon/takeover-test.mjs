import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const out='shots/character-polygon';fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,defaultViewport:{width:1440,height:900},args:['--use-angle=d3d11','--enable-gpu']});
const errors=[],results=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try {
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
  await page.goto('http://localhost:5186/character-test.html?test=1');await page.waitForFunction('window.__ready===true');await page.click('#start');
  for(const character of [0,1])for(const car of [1,2]) {
    await page.evaluate(({character,car})=>{__polygon.reset();document.querySelector(`[data-character="${character}"]`).click();__polygon.pose([4,10,16][car]-1.7,1.65);},{character,car});
    await wait(200);await page.keyboard.press('KeyE');await page.keyboard.press('KeyE');await page.keyboard.press(character===0?'Digit3':'Digit2');
    assert.equal(await page.evaluate(()=>__polygon.state.characterIndex),character,'Selection cannot replace the actor mid-interaction');
    const tracePromise=page.evaluate(()=>new Promise(resolve=>{
      const frames=[],start=performance.now();
      function sample(now){const s=structuredClone(__polygon.state);frames.push({time:now,state:s,pose:__polygon.driverPose,vehicles:__polygon.vehicleStates});if(now-start<12000&&s.mode!=='drive')requestAnimationFrame(sample);else resolve(frames);}requestAnimationFrame(sample);
    }));
    for(const phase of ['open','extract','climb','close']){
      await page.waitForFunction(ph=>__polygon.state.interaction?.phase===ph&&__polygon.state.interaction.progress>.35,{timeout:15000},phase);
      if(phase==='climb')assert.equal(await page.evaluate(i=>__polygon.vehicles[i].npc.reaction,car),'angry','Pulled-out driver raises and shakes his hands');
      await page.screenshot({path:`${out}/takeover-${character}-${car}-${phase}.png`});
    }
    const trace=await tracePromise,phases=[...new Set(trace.map(f=>f.state.interaction?.phase).filter(Boolean))];
    assert.equal(trace.at(-1).state.mode,'drive');assert.equal(trace.at(-1).vehicles[car].occupied,false);assert.equal(trace.at(-1).vehicles[car].door,0);
    for(const phase of ['open','reach','extract','recover','climb','close'])assert(phases.includes(phase),phase);
    let maxDisplacement=0;
    for(let i=1;i<trace.length;i++){
      const a=trace[i-1],b=trace[i],distance=Math.hypot(...b.pose.hips.map((v,j)=>v-a.pose.hips[j]));
      maxDisplacement=Math.max(maxDisplacement,distance);
      assert(distance<.12+(b.time-a.time)/1000*6,`No pose teleport: ${distance} at ${b.state.interaction?.phase}`);
      if(b.state.mode==='enter')assert(Math.abs(b.vehicles[car].speed)<.05,'Entry cannot accelerate the car');
    }
    const seated=await page.evaluate(()=>new Promise(resolve=>{
      const frames=[],start=performance.now();function sample(now){frames.push(__polygon.driverPose);if(now-start<1800)requestAnimationFrame(sample);else resolve(frames);}requestAnimationFrame(sample);
    }));
    const head=seated.map(p=>p.head[1]);assert(Math.max(...head)-Math.min(...head)<.015,'Stable seated pose');
    const wheel=await page.evaluate(i=>__polygon.vehicles[i].spec.wheel,car);
    for(const side of ['left','right']){
      const target=[wheel[0]+(side==='left'?-.165:.165),wheel[1]+.025,wheel[2]+.045];
      const error=Math.max(...seated.map(p=>Math.hypot(...p[side].map((v,i)=>v-target[i]))));assert(error<.09,`Wheel grip ${side}: ${error}`);
    }
    await page.screenshot({path:`${out}/takeover-${character}-${car}-seated.png`});
    const parked=await page.evaluate(()=>__polygon.state.carZ);
    await page.keyboard.down('KeyW');await wait(900);await page.keyboard.up('KeyW');
    assert(await page.evaluate(z=>__polygon.state.carZ<z-1,parked),'The taken city car is drivable');
    await page.keyboard.down('Space');await wait(1000);await page.keyboard.up('Space');
    await page.keyboard.press('KeyE');await page.waitForFunction('__polygon.state.mode==="foot"',{timeout:10000});
    await page.keyboard.press('KeyE');await page.waitForFunction('__polygon.state.mode==="drive"',{timeout:10000});
    results.push({character,car,frames:trace.length,phases,maxDisplacement,head:head[0]});
  }
  // Pause freezes the whole interaction; reset restores both NPC occupants.
  await page.evaluate(()=>{__polygon.reset();__polygon.pose(8.3,1.65);});await wait(100);await page.keyboard.press('KeyE');
  await page.waitForFunction('__polygon.state.interaction?.phase==="extract"');await page.keyboard.press('Escape');
  const paused=await page.evaluate(()=>({t:__polygon.state.interaction.time,pose:__polygon.driverPose}));await wait(400);
  assert.deepEqual(await page.evaluate(()=>({t:__polygon.state.interaction.time,pose:__polygon.driverPose})),paused,'Pause freezes action and bones');
  await page.click('#start');await page.keyboard.press('KeyR');await wait(100);
  assert(await page.evaluate(()=>__polygon.state.mode==='foot'&&__polygon.vehicleStates.every(v=>v.door===0)&&__polygon.vehicleStates.slice(1).every(v=>v.occupied&&v.npcTime===-1)));
  assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/takeover-results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({passed:true,results},null,2));
}finally{await browser.close();}
