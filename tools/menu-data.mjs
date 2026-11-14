// Compact, reproducible menu geography from the planning map; no scene imports.
import fs from 'node:fs';
import { REGISTRY } from '../src/areas/registry.js';
import { geomOf, ringsFromWays, ringAreaM2, dpRing } from '../maps/intro-draft-src/lib.mjs';
function relRings(rel){const outer=[],inner=[];for(const m of rel.members||[])if(m.type==='way'&&m.geometry)(m.role==='inner'?inner:outer).push(geomOf(m.geometry));return {outer:ringsFromWays(outer).rings,inner:ringsFromWays(inner).rings};}
const html = fs.readFileSync('maps/intro-draft.html', 'utf8');
const data = JSON.parse(html.match(/<script id="data"[^>]*>([\s\S]*?)<\/script>/)[1]);
if (process.argv.includes('--inspect')) {
  console.log(Object.entries(data.layers).map(([k,v])=>[k,Array.isArray(v)?v.length:typeof v,JSON.stringify(v).slice(0,220)]));
} else {
  const project = p => [Math.round((p[0]-30.30)*111320*Math.cos(59.95*Math.PI/180)), Math.round(-(p[1]-59.95)*110950)];
  const path = rings => rings.map(r=>(dpRing(r,25)||r).map((p,i)=>(i?'L':'M')+project(p).join(',')).join('')+'Z').join('');
  const live = Object.values(REGISTRY).filter(r=>!r.parked&&r.status!=='planned');
  const areas = data.areas.map(a=>({key:a.k,name:a.ru,path:path(a.outer),id:live.find(r=>r.mapId===a.k)?.id||null}));
  const edits=JSON.parse(fs.readFileSync('maps/intro-draft-src/edits.json','utf8'));
  const rawPath='maps/intro-draft-src/raw/mo.json';
  const namesPath='assets/menu/names.json';
  let names=fs.existsSync(namesPath)?JSON.parse(fs.readFileSync(namesPath,'utf8')):{};
  if(fs.existsSync(rawPath)){
    const municipalities=JSON.parse(fs.readFileSync(rawPath,'utf8')).elements.filter(e=>e.type==='relation').map(e=>{const rings=relRings(e);return {name:e.tags?.name||'',size:rings.outer.reduce((s,r)=>s+Math.abs(ringAreaM2(r)),0)-rings.inner.reduce((s,r)=>s+Math.abs(ringAreaM2(r)),0)};});
    for(const edit of edits.merge){const parts=edit.names.map(n=>municipalities.find(m=>m.name===n||m.name.endsWith(' '+n)||m.name===n+' округ')).filter(Boolean).sort((a,b)=>b.size-a.size);if(parts.length)names[edit.ru]=parts[0].name.replace(/^(муниципальный )?округ /,'').replace(/ округ$/,'');}
    names['Крестовский—Каменный—Елагин']='Крестовский остров';
    fs.writeFileSync(namesPath,JSON.stringify(names,null,2)+'\n');
  }
  const catalogue = live.map(r=>{
    const a=data.areas.find(a=>a.k===r.mapId);
    return {id:r.id,page:r.page,mapId:r.mapId,name:r.id==='palace'?'Площадь Восстания':names[r.title]||r.title,images:Array.from({length:5},(_,i)=>`assets/splash/${r.id}/${i+1}.jpg`)};
  });
  fs.mkdirSync('assets/menu',{recursive:true});
  for(const row of catalogue)if(/^№/.test(row.name))row.name='Округ '+row.name;
  const water=path(data.layers.sea)+data.layers.water.filter(w=>w.o.reduce((sum,r)=>sum+Math.abs(ringAreaM2(r)),0)>25000).map(w=>path([...w.o,...w.i])).join('');
  fs.writeFileSync('assets/menu/map.json',JSON.stringify({areas,catalogue,water}));
  console.log(catalogue.map(a=>`${a.id}: ${a.name}`).join('\n'));
}
