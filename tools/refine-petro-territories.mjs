import fs from 'node:fs';
import { REGISTRY, GATES } from '../src/areas/registry.js';
import { petroTerritory } from './petro-territory.mjs';
import { cutArea } from './area-data-cut.mjs';
const defs=[['kronverk',86,'R'],['aptekarsky',84,'A'],['islands',85,'E']];
let source=fs.readFileSync('src/areas/registry.js','utf8');
for(const [id,k,p] of defs){
 const row=REGISTRY[id];row.play=petroTerritory(k,p);
 source=source.replace(new RegExp('REGISTRY\\.'+id+' = [\\s\\S]*?\\n};'), 'REGISTRY.'+id+' = '+JSON.stringify(row,null,2)+';');
 const result=await cutArea({area:id,orig:'D:/git2/agi-fun-tests/102_3d_piter/src/world/data',command:'node tools/refine-petro-territories.mjs'}),dir='src/areas/'+id+'/data';
 const keep=new Set(result.parts.map(p=>p.file).concat('city.js'));
 for(const f of fs.readdirSync(dir))if(/^city.*\.js$/.test(f)&&!keep.has(f))fs.unlinkSync(dir+'/'+f);
 result.parts.forEach((p,i)=>fs.writeFileSync(dir+'/'+p.file,result.partTexts[i]));fs.writeFileSync(dir+'/city.js',result.facade);
 fs.writeFileSync('src/areas/'+id+'/territory.json',JSON.stringify(row,null,2)+'\n');
 console.log(id,row.play.length,'rectangles');
}
source=source.split('// Northern districts: crossings work')[0];
const live=Object.values(REGISTRY).filter(a=>!a.parked&&a.status!=='planned'),extra=[];let n=37;
for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
 const a=live[i],b=live[j];if(!defs.some(d=>d[0]===a.id||d[0]===b.id))continue;
 if(!a.play.some(r=>b.play.some(t=>r.x0<t.x1&&r.x1>t.x0&&r.z0<t.z1&&r.z1>t.z0)))continue;
 const id='e'+n++,rev='e'+n++;extra.push({id,kind:'edge',from:a.id,to:b.id,zone:40,reverse:rev},{id:rev,kind:'edge',from:b.id,to:a.id,zone:40,reverse:id});
}
source+='// Northern districts: crossings work on land, in a car and in open water.\nGATES.push(...'+JSON.stringify(extra,null,2)+');\n';
fs.writeFileSync('src/areas/registry.js',source);
