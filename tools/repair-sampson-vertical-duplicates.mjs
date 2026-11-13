// Repair the three stacked Orenburgskaya2 levels suppressed by an old
// footprint-only duplicate pass. No height, footprint, parent or genuine
// duplicate is changed. Run after a Sampson source regeneration if necessary.
import fs from 'node:fs';
import path from 'node:path';
import { BUILDINGS } from '../src/areas/sampson/data/city.js';
const ids=new Set(['r3287703','r2972323','r2972322']),byId=new Map(BUILDINGS.map(b=>[b.id,b]));
for(const id of ids){const b=byId.get(id),base=byId.get('r20187384');
  if(!b||!base||b.parent!=='r2972320'||base.parent!=='r2972320')throw Error('Orenburgskaya2 family changed: '+id);
  if(b.dupOf&&b.dupOf!==base.id)throw Error('Unexpected duplicate target: '+id);
  if(!(b.minH>=base.h-.01&&b.h>b.minH&&base.minH===0))throw Error('Mapped stacked vertical intervals changed: '+id);
}
const dir='src/areas/sampson/data';let changed=0;
for(const name of fs.readdirSync(dir).filter(n=>/^city-.*\.js$/.test(n))){
  const file=path.join(dir,name),source=fs.readFileSync(file,'utf8'),re=/export const BUILDINGS = JSON\.parse\(("(?:[^"\\]|\\.)*")\);/;
  const m=source.match(re);if(!m)continue;
  const records=JSON.parse(JSON.parse(m[1]));let dirty=false;
  for(const b of records)if(ids.has(b.id)&&b.dupOf){delete b.dupOf;dirty=true;changed++;}
  if(dirty)fs.writeFileSync(file,source.replace(re,'export const BUILDINGS = JSON.parse('+JSON.stringify(JSON.stringify(records))+');'));
}
console.log(`Restored ${changed} stacked Orenburgskaya2 records; mapped heights/footprints unchanged.`);
