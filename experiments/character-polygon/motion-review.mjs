// Visual contact sheets of exact animation phases, using the running test server.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const out='shots/character-polygon';fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,defaultViewport:{width:900,height:900},args:['--use-angle=d3d11','--enable-gpu']});
try {
  const page=await browser.newPage();
  await page.goto('http://localhost:5186/character-test.html?test=1');await page.waitForFunction('window.__ready===true');
  await page.click('#start');
  await page.evaluate(()=>{__polygon.camera.fov=32;__polygon.camera.updateProjectionMatrix();});
  for(const [name,duration] of [['Walk',39/30],['Run',27/30]]) {
    const tiles=[];
    for(let view=0;view<3;view++)for(let phase=0;phase<4;phase++) {
      await page.evaluate(({name,time,yaw})=>{__polygon.look(yaw,.05);__polygon.previewAnimation(name,time);},{name,time:duration*phase/4,yaw:[Math.PI,Math.PI/2,0][view]});
      await new Promise(r=>setTimeout(r,60));
      const png=await page.screenshot({clip:{x:270,y:160,width:360,height:650}});
      tiles.push({input:Buffer.from(png).toString('base64'),left:phase*360,top:view*650});
    }
    const sheet=await page.evaluate(async tiles=>{
      const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=1950;
      const ctx=canvas.getContext('2d');
      for(const tile of tiles){const img=new Image();img.src='data:image/png;base64,'+tile.input;await img.decode();ctx.drawImage(img,tile.left,tile.top);}
      return canvas.toDataURL('image/png').split(',')[1];
    },tiles);
    fs.writeFileSync(`${out}/review-${name}.png`,Buffer.from(sheet,'base64'));
  }
  // Idle face details from both front and side, then the clean-shaven man.
  for(const [index,label] of [[0,'woman'],[1,'man']]) {
    await page.evaluate(index=>document.querySelector(`[data-character="${index}"]`).click(),index);
    for(const [yaw,view] of [[Math.PI,'front'],[Math.PI/2,'side']]) {
      await page.evaluate(yaw=>{__polygon.look(yaw,.05);__polygon.previewAnimation('Idle',0);},yaw);
      await new Promise(r=>setTimeout(r,100));
      await page.screenshot({path:`${out}/face-${label}-${view}.png`,clip:{x:290,y:140,width:320,height:380}});
    }
  }
  console.log('Motion contact sheets and face views saved');
} finally {await browser.close();}
