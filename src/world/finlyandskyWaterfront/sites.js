// Surveyed Neva landings. Street frame metres; +v points toward open water.
// Official Mostotrest length: Lenin Square descent 136m. Its mapped central
// flights/side landings and the Bezborodko grotto/steps constrain these frames.
export const LENIN = { id:'finlyandsky-lenin-descent',x:203.1,z:-2291.05,rot:-Math.atan2(15.3,74.9),half:68,front:6,back:-17 };
export const GROTTO = { id:'finlyandsky-bezborodko-pier',x:2711.95,z:-2883.85,rot:-Math.atan2(3.5,8.5),half:16.5,front:15,back:-12 };
export function point(site,u,v){const c=Math.cos(site.rot),s=Math.sin(site.rot);return [site.x+c*u+s*v,site.z-s*u+c*v];}
// The ceremonial landing narrows at the lower promenade; its two rounded end
// platforms are NOT a rectangular bite out of the existing Neva coast.
export const LENIN_BACK=[[-68,-13.4],[-60,-14.6],[-52,-15.7],[-44,-16.5],[-36,-17],[68,-17]];
const leninOutline=[...LENIN_BACK,[67,-11],[66,-4],[64,0],[60,3.2],[55.3,4.6],[35.9,4.3],[35.9,6],[-40.6,6],[-40.6,4.25],[-55,4.25],[-60,3.7],[-64,1],[-67,-3],[-68,-11]];
const ring=s=>s===LENIN?leninOutline.map(p=>point(s,...p)):[point(s,-s.half,s.back),point(s,s.half,s.back),point(s,s.half,s.front),point(s,-s.half,s.front)];
export const WATER_RINGS=[LENIN,GROTTO].map(s=>({id:s.id,key:'neva',ring:ring(s)}));
export const BANK_RINGS=WATER_RINGS;
export const KEEP_OUT=[LENIN,GROTTO].map(s=>({id:s.id,c:[s.x,s.z],ax:[Math.cos(s.rot),-Math.sin(s.rot)],hl:s.half+1,hw:Math.max(Math.abs(s.back),s.front)+1}));
export const GROUPS_LIST=[
  {key:'finlyandsky-lenin-descent',name:'Парадный спуск площади Ленина',nameEn:'Lenin Square ceremonial landing',ids:[],osm:['w1151087787','w1151087788','w1151087789','w1151087790','w1151087791','w1151087792','w1192940641','w1192940642','w1192940643','w1192940644','w1192940645','w1192940646','w1192940647','w1192940648'],at:[LENIN.x,LENIN.z]},
  {key:'finlyandsky-bezborodko-pier',name:'Пристань с гротом и сфинксами',nameEn:'Bezborodko grotto and sphinx landing',ids:['r7357196'],osm:['w174641823','w174641825','n1219705794','n1219706742','n3634704063','n3634704064','n2088817312','n2088817321','n2088817442','n2088817470','n3634704065','n3634704066'],at:[GROTTO.x,GROTTO.z]},
];
export const SPHINXES=[
  {id:'n1219705794',x:2716.3,z:-2869.8,low:true},
  {id:'n1219706742',x:2699.8,z:-2876.8,low:true},
  {id:'n3634704063',x:2716.2,z:-2882.1,low:false},
  {id:'n3634704064',x:2707.7,z:-2885.6,low:false},
];
export const VASES=[
  {id:'n2088817312',x:2728.7,z:-2882.8},{id:'n2088817321',x:2722.9,z:-2885.3},
  {id:'n2088817442',x:2706.7,z:-2892.8},{id:'n2088817470',x:2701.1,z:-2895.2},
  {id:'n3634704065',x:2718.4,z:-2887.3},{id:'n3634704066',x:2710,z:-2891.2},
];
