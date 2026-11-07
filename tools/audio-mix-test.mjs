// Real WebAudio output, without loading the 3D scene or requiring a sound card.
// node tools/audio-mix-test.mjs [--baseline path/to/audio-before.js] [--url published-audio.js] [--out shots/audio-mix.json]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';

const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2);
const arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1];};
const before=arg('baseline',null),out=path.resolve(root,arg('out','shots/audio-mix.json'));
const url=arg('url',null);
let source;
if(url){const response=await fetch(url,{signal:AbortSignal.timeout(30000)});assert(response.ok,'published audio HTTP '+response.status);source=await response.text();}
else source=fs.readFileSync(path.join(root,'src/core/audio.js'),'utf8');
const sources=[...(before?[{id:'before',text:fs.readFileSync(path.resolve(before),'utf8')}]:[]),{id:'after',text:source}];
const executablePath=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser=await puppeteer.launch({executablePath,headless:true,protocolTimeout:300000,args:['--no-first-run','--disable-extensions'],defaultViewport:{width:320,height:200}});
const report={sampleRate:48000,source:url||'src/core/audio.js',runs:[]};
try{
  const page=await browser.newPage();
  for(const s of sources){
    const result=await page.evaluate(async encoded=>{
      const {createAudio}=await import('data:text/javascript;base64,'+encoded);
      const camera={position:{x:0,y:1.6,z:0}};
      const world={shared:{uNight:{value:0}},sunDir:{y:.35},indoor:{amount:0},L:{roadsNear:()=>[],waterwayAt:()=>null},services:{environment:{shoreDist:()=>1e4,kindAt:()=> 'paved'}}};
      globalThis.__ctx=world;
      async function render(name,positional=false){
        const duration=name==='birds'?45:5,sr=48000,ac=new OfflineAudioContext(2,sr*duration,sr);
        const audio=createAudio({context:ac,ambience:false,hrtf:false,seed:77});
        audio.start();audio.update(camera,0);
        if(name==='birds')audio.loop('birds');
        else if(name==='clank'){
          for(let i=0;i<8;i++)audio.play('clank',{volume:4,position:{x:0,y:1.6,z:0}});
          audio.loop('clank',{volume:4});
        }else audio.play(name,{volume:1.15,...(positional?{position:{x:8,y:1.6,z:0}}:{})});
        const pending=[];
        if(name==='birds')for(let t=.25;t<duration-.25;t+=.25)pending.push(ac.suspend(t).then(()=>{audio.update(camera,.25);return ac.resume();}));
        const pcm=await ac.startRendering();await Promise.all(pending);
        let sum=0,peak=0,count=0;
        for(let ch=0;ch<pcm.numberOfChannels;ch++)for(const v of pcm.getChannelData(ch)){if(!Number.isFinite(v))throw Error('non-finite PCM');sum+=v*v;peak=Math.max(peak,Math.abs(v));count++;}
        return {name,positional,duration,rms:Math.sqrt(sum/count),peak};
      }
      const cases=[];
      for(const name of ['crow','raven','magpie','gull','duck','wings'])for(const positional of [false,true])cases.push(await render(name,positional));
      for(const name of ['carHorn','clank','birds'])cases.push(await render(name));
      return cases;
    },Buffer.from(s.text).toString('base64'));
    report.runs.push({id:s.id,cases:result});
    console.log(s.id+': rendered '+result.length+' real WebAudio cases');
  }
  const final=report.runs.at(-1).cases;
  for(const c of final){
    if(c.name==='clank')assert(c.peak===0&&c.rms===0,'construction remains exactly silent, including repeated maximum-volume calls');
    else if(c.name!=='carHorn')assert(c.rms>0&&c.peak<.04,'quiet but audible bird output: '+JSON.stringify(c));
  }
  if(before){
    report.comparison=final.map((c,i)=>{
      const b=report.runs[0].cases[i];assert.equal(c.name,b.name);assert.equal(c.positional,b.positional);
      if(c.name==='carHorn')assert(Math.abs(c.rms-b.rms)<1e-8&&Math.abs(c.peak-b.peak)<1e-8,'non-bird sound output is preserved');
      const ratio=b.rms?c.rms/b.rms:null;
      if(c.name!=='carHorn'&&c.name!=='clank')assert(ratio>.115&&ratio<.14,'all bird paths reduce by about 18 dB: '+JSON.stringify({name:c.name,positional:c.positional,ratio}));
      return {name:c.name,positional:c.positional,rmsRatio:ratio,changeDB:ratio?20*Math.log10(ratio):null};
    });
  }
  report.ok=true;
  console.log('PASS real PCM: construction silence; quiet ambient, nearby and reverberant birds'+(before?'; unchanged non-bird audio':''));
}finally{
  await browser.close();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));
}
