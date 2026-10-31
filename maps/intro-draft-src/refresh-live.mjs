// Refresh live scenes without refetching or changing the planning polygons.
// The full build-intro pipeline uses the same registry and badge catalogue.
import fs from 'node:fs';
import { REGISTRY, GATES } from '../../src/areas/registry.js';
import { LIVE_LETTER } from './live-areas.mjs';
const file = new URL('../intro-draft.html',import.meta.url);
const html = fs.readFileSync(file,'utf8'), re=/<script id="data" type="application\/json">([\s\S]*?)<\/script>/;
const data=JSON.parse(html.match(re)[1]);
const lat=59.932421*Math.PI/180;
const kx=111412.84*Math.cos(lat)-93.5*Math.cos(3*lat)+.118*Math.cos(5*lat),ky=111132.954-559.822*Math.cos(2*lat)+1.175*Math.cos(4*lat);
const pt=(x,z)=>[+(30.351279+x/kx).toFixed(5),+(59.932421-z/ky).toFixed(5)];
const unionArea=rs=>{const xs=[...new Set(rs.flatMap(r=>[r.x0,r.x1]))].sort((a,b)=>a-b);let area=0;for(let i=0;i+1<xs.length;i++){let end=-Infinity,n=0;for(const[a,b]of rs.filter(r=>r.x0<=xs[i]&&r.x1>=xs[i+1]).map(r=>[r.z0,r.z1]).sort((a,b)=>a[0]-b[0]))if(b>end){n+=b-Math.max(a,end);end=b;}area+=n*(xs[i+1]-xs[i]);}return Math.round(area/1e4)/100;};
const live=Object.values(REGISTRY).filter(r=>r.mapId!=null&&!r.parked&&r.status!=='planned');
data.existing=live.map(row=>{const id=LIVE_LETTER[row.id];if(!id)throw Error('Add badge for '+row.id);return{id,key:row.id,page:row.page,title:row.title,titleEn:row.titleEn,status:'Live',km2:unionArea(row.play),rects:row.play.map(r=>[pt(r.x0,r.z0),pt(r.x1,r.z0),pt(r.x1,r.z1),pt(r.x0,r.z1)]),mapId:row.mapId,approxMB:row.approxMB,sights:row.sights,rectN:row.play.length,edges:GATES.filter(g=>g.kind==='edge'&&g.from===row.id).map(g=>LIVE_LETTER[g.to]).filter(Boolean)};});
for(const area of data.areas){delete area.live;const row=data.existing.find(r=>r.mapId===area.k);if(row)area.live=row.id;}
const json=JSON.stringify(data).replace(/<\//g,'<\\/');
fs.writeFileSync(file,html.replace(re,()=>'<script id="data" type="application/json">'+json+'</script>'));
fs.writeFileSync(new URL('./intro-data.json',import.meta.url),json);
console.log('Refreshed live map: '+data.existing.map(r=>r.id+' '+r.key).join(', '));
