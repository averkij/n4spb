// Coastal OSM authoring: current mapped geometry, the established bake schema,
// and the planning map's B600 territory. Raw HTTP responses stay in the OS temp.
// node tools/marine-data.mjs --area morskie-vorota|okrug65 [--fetch-only]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { mapData, rectsOfRings } from './area-shape.mjs';
import { unproj, elementPolys } from './osm-lib.mjs';
import { grow, clipParts, readPart, partFileText, facadeTextOf } from './strip-data-clip.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2), arg = (n, d = null) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1]; };
const id = arg('--area', 'morskie-vorota');
const configs = { 'morskie-vorota': { k: 71, prefix: 'M' }, okrug65: { k: 100, prefix: 'O' } };
const cfg = configs[id]; if (!cfg) throw new Error('Unknown coastal area ' + id);
const area = mapData().areas.find(a => a.k === cfg.k);
const play = rectsOfRings(area.fp, 80, 4, [area.fp, area.wz || []], 600).map((r,i)=>({name:cfg.prefix+String(i+1).padStart(2,'0'),...r}));
const ext = play.map(r => grow(r,120));
const bbox = rs => ({x0:Math.min(...rs.map(r=>r.x0)),x1:Math.max(...rs.map(r=>r.x1)),z0:Math.min(...rs.map(r=>r.z0)),z1:Math.max(...rs.map(r=>r.z1))});
const bb = bbox(ext);
const boxQL = b => { const [w,n] = unproj(b.x0,b.z0),[e,s] = unproj(b.x1,b.z1); return [s,w,n,e].map(v=>v.toFixed(7)).join(','); };
const scratch = path.join(os.tmpdir(),'n4spb-coastal-osm',id); fs.mkdirSync(scratch,{recursive:true});
const endpoints = ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter'];
async function query(name,ql) {
  const file=path.join(scratch,name+'.json');
  if(fs.existsSync(file)&&!argv.includes('--refresh'))return JSON.parse(fs.readFileSync(file,'utf8'));
  let last;
  for(const endpoint of endpoints){
    try{
      console.log('fetch',name,endpoint);
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'n4spb-coastal-authoring/1.0 (OpenStreetMap research)'},body:new URLSearchParams({data:ql}),signal:AbortSignal.timeout(240000)});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const data=await r.json();if(data.remark)throw new Error(data.remark);if(!Array.isArray(data.elements))throw new Error('No elements');
      fs.writeFileSync(file,JSON.stringify(data));console.log(name,data.elements.length,'elements',fs.statSync(file).size,'bytes',data.osm3s?.timestamp_osm_base);return data;
    }catch(e){last=e;console.warn(endpoint,e.message);}
  }
  throw last;
}
const tag='^(building(:part)?|highway|natural|landuse|leisure|waterway|water|amenity|barrier|man_made|historic|tourism|shop|railway|entrance|public_transport|traffic_calming)$';
const data=await query('mapped',`[out:json][timeout:180];nwr[~"${tag}"~"."](${boxQL(bb)});out geom;`);
const water=argv.includes('--reuse-mapped-water') ? data : await query('water-ring',`[out:json][timeout:180];(nwr["natural"~"^(water|coastline)$"](${boxQL(grow(bb,600))});nwr["waterway"](${boxQL(grow(bb,600))}););out geom;`);
const all=[...new Map([...data.elements,...water.elements].map(e=>[e.type+e.id,e])).values()].sort((a,b)=>a.type.localeCompare(b.type)||a.id-b.id);
const categories={
  buildings:e=>e.tags?.building||e.tags?.['building:part'],
  roads:e=>e.tags?.highway,
  street:e=>e.type==='node'&&(e.tags?.highway||e.tags?.amenity||e.tags?.entrance||e.tags?.traffic_calming),
  transit:e=>e.tags?.public_transport||e.tags?.railway==='subway_entrance',
  water:e=>e.tags?.natural==='water'||e.tags?.waterway||e.tags?.water||e.tags?.landuse==='basin'||e.tags?.amenity==='fountain',
  green:e=>e.tags?.landuse||e.tags?.leisure||['wood','scrub','grassland','heath','wetland','tree_row','shrubbery'].includes(e.tags?.natural),
  trees:e=>e.type==='node'&&e.tags?.natural==='tree',
  parking:e=>/^(parking|parking_space|motorcycle_parking|bicycle_parking)$/.test(e.tags?.amenity||''),
  bridges:e=>e.tags?.bridge||e.tags?.man_made==='bridge',
  barriers:e=>e.tags?.barrier,
  manmade:e=>e.tags?.man_made,
  historic:e=>e.tags?.historic,
  pois:e=>e.tags&&(e.tags.shop||e.tags.amenity||e.tags.tourism||e.tags.office||e.tags.craft||e.tags.healthcare||e.tags.leisure||e.tags.historic),
  rail:e=>e.tags?.railway,
  routes:()=>false,subwayroutes:()=>false,
};
for(const [name,test] of Object.entries(categories))fs.writeFileSync(path.join(scratch,name+'.json'),JSON.stringify({elements:all.filter(test)}));
const sourceInfo={area:id,mapId:cfg.k,mapOsm:area.osm,timestamp:data.osm3s?.timestamp_osm_base,waterTimestamp:water.osm3s?.timestamp_osm_base,waterQuery:argv.includes('--reuse-mapped-water')?'full mapped relation geometry (supplemental Overpass water-ring unavailable)':'600m supplemental water ring',queryBounds:bb,play,counts:Object.fromEntries(Object.entries(categories).map(([n,test])=>[n,all.filter(test).length]))};
fs.writeFileSync(path.join(scratch,'source-info.json'),JSON.stringify(sourceInfo,null,2));
console.log(JSON.stringify(sourceInfo.counts));
if(argv.includes('--fetch-only'))process.exit(0);

// Reuse the repository's reviewed OSM converter unchanged apart from its data
// source and spatial constants. It runs outside the repository, never mutating
// the strip's source facade or requiring a second divergent building schema.
const names=play.map(r=>r.name), pr=play.map(({x0,x1,z0,z1})=>({x0,x1,z0,z1}));
const overrides={PLAY:bbox(pr),EXTENT:bb,PLAY_RECTS:pr,EXTENT_RECTS:ext,RECT_NAMES:names,OLD_PLAY:pr[0],OLD_EXTENT:ext[0],EXTENT_GROW:120};
let baker=fs.readFileSync(path.join(root,'tools/bake-osm.mjs'),'utf8');
const replaced=new Set([...Object.keys(overrides),'regionOf','inExtent']);
baker=baker.replace(/import \{ ([^}]+) \} from '\.\/osm-lib\.mjs';/,(_,s)=>`import { ${s.split(',').map(x=>x.trim()).filter(n=>!replaced.has(n.replace(/ as .*$/,''))).join(', ')} } from '${pathToFileURL(path.join(root,'tools/osm-lib.mjs')).href}';\n${Object.entries(overrides).map(([k,v])=>`const ${k} = ${JSON.stringify(v)};`).join('\n')}\nconst inExtentXZ=(x,z)=>EXTENT_RECTS.some(r=>x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1);\nconst regionOf=(x,z)=>RECT_NAMES[EXTENT_RECTS.findIndex(r=>x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1)]||null;`);
baker=baker.replace("import { LATE_ROAD_IDS } from './late-roads-ids.mjs';",'const LATE_ROAD_IDS = new Set(); // New area: no strip-specific late roads.');
baker=baker.replace("const rawDir = path.join(root, 'data', 'osm-raw');",`const rawDir = ${JSON.stringify(scratch)};`);
// Buildings cross the scenery boundary intact; the area-data-cut ownership rule
// is their original centroid, rather than a slice through a neighbouring house.
baker=baker.replace('const polys = bakePolys(rawPolys);',`const polys = rawPolys.map(p=>({o:flat(orient(simplify(p.o,0.12),true).slice(0,-1)),h:p.h.map(h=>flat(orient(simplify(h,0.12),false).slice(0,-1)))})).filter(p=>p.o.length>=6);`);
baker=baker.replace('const c = polysCentre(polys);\n    recs.push', 'const c = polysCentre(polys);\n    if (!inExtent(c)) continue;\n    recs.push');
// Unlike the scenery/building extent, water geometry continues 600 m farther.
baker=baker.replace('function bakePolys(polys, tol = 0.12)', 'function bakePolys(polys, tol = 0.12, clipRects = EXTENT_RECTS)');
const polyStart=baker.indexOf('function bakePolys('),polyEnd=baker.indexOf('\nconst unflat',polyStart);
baker=baker.slice(0,polyStart)+baker.slice(polyStart,polyEnd).replaceAll('clipRingUnion(p.o, EXTENT_RECTS)','clipRingUnion(p.o, clipRects)').replaceAll('clipRingUnion(h, EXTENT_RECTS)','clipRingUnion(h, clipRects)')+baker.slice(polyEnd);
const waterStart=baker.indexOf('function bakeWater()'),waterEnd=baker.indexOf('\nconst GREEN_KINDS',waterStart);
baker=baker.slice(0,waterStart)+baker.slice(waterStart,waterEnd)
  .replace('const out = [], streams = [], rivers = new Map();','const out = [], streams = [], rivers = new Map();\n  const waterRects=EXTENT_RECTS.map(r=>({x0:r.x0-600,x1:r.x1+600,z0:r.z0-600,z1:r.z1+600}));')
  .replace('for (const s of clipLine(geomPts(e)))','for (const s of clipLineUnion(geomPts(e),waterRects))')
  .replace("t.waterway === 'riverbank' ? 0.4 : 0.15);", "t.waterway === 'riverbank' ? 0.4 : 0.15,waterRects);")+baker.slice(waterEnd);
const regionStart=baker.indexOf('function regionIdx(name, r)'),regionEnd=baker.indexOf('// ---- REGION LOCK',regionStart);
baker=baker.slice(0,regionStart)+`function regionIdx(name,r){
  if(name==='OVERLAPS'){const b=bById.get(r.a);return b?regionIdx('BUILDINGS',b):0;}
  const p=name==='BUILDINGS'?[r.cx,r.cz]:r.x!=null?[r.x,r.z]:r.pts?.length?r.pts.slice(0,2):r.polys?.[0]?.o?.slice(0,2);
  return p?Math.max(0,EXTENT_RECTS.findIndex(q=>p[0]>=q.x0&&p[0]<=q.x1&&p[1]>=q.z0&&p[1]<=q.z1)):0;
}
`+baker.slice(regionEnd);
const script=path.join(scratch,'bake-local.mjs');fs.writeFileSync(script,baker);
const out=path.join(root,'src','areas',id,'data');
const result=spawnSync(process.execPath,[script,'--out',out,'--lock',path.join(scratch,'no-region-lock')],{cwd:root,encoding:'utf8',maxBuffer:8e6});
console.log(result.stdout);if(result.status!==0)throw new Error(result.stderr||'Local OSM bake failed');

// Bake clips buildings at extent boundaries; retain only whole mapped building
// footprints whose original centroid lies in this territory, like area-data-cut.
const files=fs.readdirSync(out).filter(f=>/^city-.+\.js$/.test(f));
const parts=files.map(f=>readPart(out,f));
clipParts(parts,{extRects:ext,waterRing:600});
// OSM models the open Gulf as natural=bay rather than natural=water. Keep the
// current bay relation's true coastline, including Kanonersky/Bely island holes.
// The engine's waterway bank index consumes outer rings, so split each interior
// hole through its interior into a few hole-free polygons. Shared cuts are open
// water seams, never invented banks. Shapely is an offline authoring dependency.
const bays=all.filter(e=>e.type==='relation'&&[1114253,7699801,2713652].includes(e.id));
const bayInput={rects:ext.map(r=>grow(r,600)),bays:bays.map(e=>({id:'r'+e.id,name:e.tags['name:ru']||e.tags.name,polys:elementPolys(e)}))};
const python=`import json,sys\nfrom shapely.geometry import Polygon,box,LineString\nfrom shapely.ops import unary_union,split\nfrom shapely import make_valid\nd=json.load(sys.stdin)\nclip=unary_union([box(r['x0'],r['z0'],r['x1'],r['z1']) for r in d['rects']])\ndef polygons(g):\n if g.geom_type=='Polygon': return [g]\n return [p for q in getattr(g,'geoms',[]) for p in polygons(q)]\ndef hole_free(p):\n if not p.interiors: return [p]\n h=Polygon(p.interiors[0]).representative_point()\n a,b,c,e=p.bounds\n pieces=polygons(split(p,LineString([(a-1,h.y),(c+1,h.y)])))\n if len(pieces)<2: raise RuntimeError('Unable to split water island')\n return [q for part in pieces for q in hole_free(part)]\nout=[]\nfor b in d['bays']:\n pieces=[]\n for p in b['polys']:\n  g=make_valid(Polygon(p['o'],p['h'])).intersection(clip)\n  for q in polygons(g):\n   for s in hole_free(q):\n    if s.area>1: pieces.append({'o':[round(v,1) for pt in list(s.exterior.coords)[:-1] for v in pt],'h':[]})\n if pieces: out.append({'id':b['id'],'name':b['name'],'nameEn':'Neva Bay','kind':'river','width':None,'length':0,'line':[],'polys':pieces,'key':'neva','drop':3.4})\njson.dump(out,sys.stdout,ensure_ascii=False)\n`;
const sea=spawnSync('python',['-c',python],{input:JSON.stringify(bayInput),encoding:'utf8',maxBuffer:16e6});
if(sea.status!==0)throw new Error('Coastline processing: '+sea.stderr);
const seaRecords=JSON.parse(sea.stdout);
parts[0].arrays.get('RIVER').push(...seaRecords);
console.log('current OSM bay coastline',seaRecords.map(r=>r.id+':'+r.polys.length+' pieces').join(', '));
for(const P of parts)fs.writeFileSync(path.join(out,P.file),partFileText(P.lines,P.order,P.arrays));
let facade=fs.readFileSync(path.join(out,'city.js'),'utf8');
facade=facade.replace('// GENERATED by tools/bake-osm.mjs',`// GENERATED by tools/marine-data.mjs --area ${id} via tools/bake-osm.mjs`)
  .replace(/\/\/ Saint Petersburg centre .*?\n/,`// ${area.en}, planning-map area ${cfg.k}; current OpenStreetMap geometry (${sourceInfo.timestamp}). B600 territory, all mapped roads, buildings, waterways and props. No water collision exclusion.\n`);
facade=`// SOURCE: Overpass API current OSM snapshot ${sourceInfo.timestamp}; water ring ${sourceInfo.waterTimestamp}; ODbL https://www.openstreetmap.org/copyright\n`+facade;
fs.writeFileSync(path.join(out,'city.js'),facadeTextOf(facade,parts));
console.log('written',path.relative(root,out));
