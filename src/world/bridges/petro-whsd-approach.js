// The source model stops at the fairway span. The northern playable island
// also contains the curved approach viaduct: its OSM carriageways are elevated
// ribbons joining the source's 19 m north end. Shallow floors leave water open.
import { ROADS } from '../data/city.js';
import { makeRoute } from './petrovsky/route.js';
import { buildDeck } from './petrovsky/deck.js';
const IDS=new Set(['w123232666','w123232674','w589047648','w589047650']);
export function buildWhsdApproaches(env) {
 const out=[];
 for(const r of ROADS.filter(r=>IDS.has(r.id))){
  const R=makeRoute(Array.from({length:r.pts.length/2},(_,i)=>r.pts.slice(i*2,i*2+2)),6),P=new env.Parts();
  const B={id:'whsd-'+r.id,name:'ЗСД · северная эстакада',nameEn:'WHSD northern approach',info:{rails:0,colliders:0},masts:[],anchors:[]},M=env.M;
  const D=buildDeck({...env,P},R,{y:()=>19,hwR:()=>8.3,hwL:()=>8.3,med:0,road:7.3,lanes:4,bar:.4,barH:.8,
   mats:{conc:M.whsdBarrier,fas:M.whsdConcrete,soff:M.whsdSoffit,pave:M.whsdConcrete,skirt:M.whsdConcrete},
   girder:{depth:2.2,flat:6,lip:.7},low:-1,endCaps:true,
   rail:{kind:'hpipes',hex:'#c7cbce'},lamps:{every:55,h:12,from:25,to:R.len-20}},B);
  B.deckAt=D.deckAt;B.bounds=D.bounds;B.colliders=()=>D.colliders(env.ctx.physics);
  for(let s=0;s<=R.len;s+=90){const p=R.pos(s);B.anchors.push({x:p.x,z:p.z});}
  const mid=R.pos(R.len/2);B.x=mid.x;B.z=mid.z;B.at=[mid.x,mid.z];
  B.colliders();env.flush(P,B.id);out.push({id:B.id,name:B.name,nameEn:B.nameEn,x:B.x,z:B.z,at:B.at,B});
 }
 return out;
}
