// Serial integrated GPU captures, five distinct authored places per live area.
// --prepare only records the cameras; default captures from current shipping bakes.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { REGISTRY } from '../src/areas/registry.js';
import { activateArea } from './lib/area-page.mjs';
// Raised camera positions keep foreground trees and poles out of these sights.
const PHOTO_CAMERAS = {
  admiralty: { 'Исаакиевский собор': [-2410,65,60,25,-6] },
  vasilyevsky: { 'Дворцовый мост · Дворцовая набережная': [-2337,40,-848,34.84,-10] },
  kolomna: { 'Мариинский театр': [-2870,55,930,44,-8] },
  semyonovsky: { 'Троицкий собор': [-2350,80,1980,43,-10] },
  'morskie-vorota': { 'Контейнеровоз': [-7230,55,2250,-57.3,-6] },
  kronverk: { 'Кронверкское–Введенский–Петровский': [-2233,70,-2320,0,-14] },
  islands: { 'Стадион на Крестовском острове': [-6880,170,-4060,43,-12] },
};
const displayNames=Object.fromEntries(JSON.parse(fs.readFileSync('assets/menu/map.json','utf8')).catalogue.map(a=>[a.id,a.name]));
const arg=process.argv.indexOf('--prepare-area');
if(arg>=0){
 const id=process.argv[arg+1];await activateArea(REGISTRY[id]);
 const L=await import('../src/world/layout.js');
 const unique=[];
 for(const v of L.VIEWS){if(unique.every(p=>Math.hypot(p.x-v.x,p.z-v.z)>65))unique.push({...v});if(unique.length===5)break;}
 const groups=Object.entries(L.GROUPS).flatMap(([module,gs])=>gs.map(g=>({...g,module}))).filter(g=>g.at&&L.inPlay(...g.at)&&!/(fence|furniture|walls|lamps|props|trees|bank|road)/i.test(g.key));
 const used=new Set();
 for(const g of groups){if(unique.length===5)break;if(used.has(g.module))continue;const [x,z]=g.at;if(unique.some(p=>Math.hypot(p.x-x,p.z-z)<180))continue;unique.push({label:g.name,x:x+100,y:65,z:z+120,yaw:Math.atan2(100,120)*180/Math.PI,pitch:-17});used.add(g.module);}
 if(unique.length<5)for(const g of groups){if(unique.length===5)break;const [x,z]=g.at;if(unique.some(p=>Math.hypot(p.x-x,p.z-z)<120))continue;unique.push({label:g.name,x:x+100,y:65,z:z+120,yaw:39.8,pitch:-17});}
 if(unique.length<5)unique.push({...L.HERO,y:160,z:L.HERO.z+240,yaw:0,pitch:-30,label:'Панорама · '+REGISTRY[id].title});
 if(unique.length!==5)throw Error(id+': fewer than five sights');
 fs.mkdirSync(`assets/splash/${id}`,{recursive:true});fs.writeFileSync(`assets/splash/${id}/views.json`,JSON.stringify(unique.map(v=>({caption:v.label===REGISTRY[id].title?displayNames[id]:v.label,cam:PHOTO_CAMERAS[id]?.[v.label]||(v.y===undefined?[v.x,v.z,v.yaw,v.pitch]:[v.x,v.y,v.z,v.yaw,v.pitch])})),null,2)+'\n');
 console.log(id+': '+unique.map(v=>v.label).join(' / '));
}else{
 const only=process.argv.indexOf('--area'),rows=Object.values(REGISTRY).filter(r=>!r.parked&&r.status!=='planned'&&(only<0||r.id===process.argv[only+1]));
 for(const row of rows){
   const views=`assets/splash/${row.id}/views.json`;
   if(!fs.existsSync(views)||process.argv.includes('--prepare')){const result=spawnSync(process.execPath,[import.meta.filename,'--prepare-area',row.id],{stdio:'inherit'});if(result.status)process.exit(result.status);}
   if(process.argv.includes('--prepare'))continue;
   const cameras=JSON.parse(fs.readFileSync(views));const prefix=`shots/menu-sights/${row.id}`;
   if(cameras.every((_,i)=>fs.existsSync(`assets/splash/${row.id}/${i+1}.jpg`))&&!process.argv.includes('--force'))continue;
   const result=spawnSync(process.execPath,['tools/shot.mjs','--area',row.id,'--cams',cameras.map(v=>v.cam.join(',')).join(';'),'--out',prefix,'--q','medium','--w','1440','--h','810'],{stdio:'inherit'});
   if(result.status)process.exit(result.status);
   for(let i=0;i<5;i++){const r=spawnSync('python',['-c','from PIL import Image; import sys; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2],quality=87)',`${prefix}_${i}.png`,`assets/splash/${row.id}/${i+1}.jpg`],{stdio:'inherit'});if(r.status)process.exit(r.status);}
 }
}
