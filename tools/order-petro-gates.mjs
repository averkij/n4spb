// Find gate precedence against the real gate machine, using the same run-ups
// as gates-test. This prevents a broad overlap starving a neighbouring district.
import fs from 'node:fs';
import { REGISTRY,GATES } from '../src/areas/registry.js';
import { createGateMachine,inUnion,EDGE_DIRS } from '../src/core/gates.js';
import { edgeLens } from './lib/edge-geometry.mjs';
const DT=1/30,orders={};
for(const from of [...new Set(GATES.filter(g=>g.kind==='edge').map(g=>g.from))]){
 const gates=GATES.filter(g=>g.kind==='edge'&&g.from===from),samples=[];
 for(let want=0;want<gates.length;want++){
  const pts=edgeLens(REGISTRY[from].play,REGISTRY[gates[want].to].play,{backMax:0}).points,stride=Math.max(1,Math.floor(pts.length/40));
  const masks=[];
  for(let pi=0;pi<pts.length;pi+=stride){
   const p=pts[pi],d=EDGE_DIRS[p.k],sx=p.x-60*d[0],sz=p.z-60*d[1];if(!inUnion(REGISTRY[from].play,sx,sz,0))continue;
   const n=Math.max(1,Math.ceil(Math.hypot(p.x+d[0]-sx,p.z+d[1]-sz)/1.5/DT)),times=gates.map(g=>{
    const m=createGateMachine({gates:[g],config:{graceS:0}});
    for(let i=0;i<60;i++)m.update({dt:DT,x:sx,z:sz,mode:'walk',blocked:false});
    for(let i=0;i<=n;i++){const o=m.update({dt:DT,x:sx+(p.x+d[0]-sx)*i/n,z:sz+(p.z+d[1]-sz)*i/n,mode:'walk',blocked:false});if(o.offer)return i;}
    return Infinity;
   });
   const first=Math.min(...times);if(!Number.isFinite(first))throw new Error('No offer '+gates[want].id);
   let mask=0;times.forEach((t,i)=>{if(t===first)mask|=1<<i;});masks.push(mask);
  }
  samples.push(masks);
 }
 function search(order,used){
  if(order.length===gates.length)return order;
  for(let i=0;i<gates.length;i++)if(!(used&(1<<i))){
   const available=samples[i].filter(mask=>(mask&used)===0&&(mask&(1<<i))).length;
   if(available<samples[i].length*.5)continue;
   const result=search([...order,i],used|(1<<i));if(result)return result;
  }
  return null;
 }
 const order=search([],0);if(!order){console.log(gates.map((g,i)=>[g.id,g.to,samples[i].length,samples[i].filter(m=>m&(1<<i)).length]));throw new Error('No non-starving precedence for '+from);}
 orders[from]=order.map(i=>gates[i].id);console.log(from,orders[from].join(','));
}
const file='src/areas/registry.js';let source=fs.readFileSync(file,'utf8').split('// Measured northern gate order')[0];
source+='// Measured northern gate order (tools/order-petro-gates.mjs, gates-test run-ups).\nconst EDGE_ORDER = '+JSON.stringify(orders,null,2)+';\n';
source+="const FROM_ORDER = Object.keys(EDGE_ORDER);\nGATES.sort((a,b)=>FROM_ORDER.indexOf(a.from)-FROM_ORDER.indexOf(b.from)||(EDGE_ORDER[a.from]||[]).indexOf(a.id)-(EDGE_ORDER[b.from]||[]).indexOf(b.id));\n";
fs.writeFileSync(file,source);
