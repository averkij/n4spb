// Public street entrances. Coordinates are the ends of the mapped upper flight in
// city metres. A zero count denotes an estimated number of treads. Depths and
// clear widths are modelling dimensions. See docs/research/metro-entrances.md.
import { BUILDINGS, ENTRANCES } from '../data/city.js';

const entries = [];
function station(name, width, style, rows) {
  for (const [id, ref, way, x, z, bx, bz, surveyedSteps, canopy, options = {}] of rows) {
    const axis = Math.atan2(bx - x, bz - z);
    const length = Math.hypot(bx - x, bz - z);
    const steps = surveyedSteps || Math.round(length / .35);
    const run = length - (options.shared ? 1.1 : 0);
    const drop = options.shared ? 3.25 : Math.min(5.45, steps * .153);
    const mid = options.second ? 1.15 : 0;
    const extra = options.second ? Math.hypot(options.second[0] - bx, options.second[1] - bz) : 0;
    const extraSteps = options.second ? (options.second[2] || Math.round((extra - mid) / .36)) : 0;
    const flights = [{start:0, end:run, top:0, bottom:-drop, steps}];
    if (extraSteps) flights.push({start:run+mid, end:run+extra, top:-drop,
      bottom:-drop-extraSteps*.153, steps:extraSteps});
    const last = flights[flights.length-1];
    const landing = options.shared ? 1.25 : 2.25;
    // Only the flight that breaks through street level is open to the sky.
    const headroom = 2.5;
    const coverFlight = flights.find(f => -f.bottom >= headroom);
    const opening = coverFlight
      ? coverFlight.start + (coverFlight.end-coverFlight.start)*(headroom+coverFlight.top)/(coverFlight.top-coverFlight.bottom)
      : last.end + .4;
    const site = {id, name, ref, way, x, z, axis, width, style, canopy, flights, landing,
      shared:!!options.shared, depth:-last.bottom, end:last.end, opening};
    const center = localToWorld(site, 0, opening/2);
    site.hole = {id:'metro-underpass-'+id,kind:'stairs',x:center.x,z:center.z,w:width+.12,d:opening,rotY:axis};
    entries.push([id,site]);
  }
}

export function localToWorld(site, u, v) {
  const s=Math.sin(site.axis), c=Math.cos(site.axis);
  return {x:site.x+c*u+s*v,z:site.z-s*u+c*v};
}

station('Выборгская', 3.35, 'granite', [
  ['n1397865571','', 'w125988492',-184.5,-4314.3,-186.9,-4324.7,0,null,{shared:true}],
  ['n1559513119','', 'w142505059',-188.9,-4332.5,-186.9,-4324.7,0,null,{shared:true}],
  ['n1397865573','', 'w125988493',-148.4,-4324.6,-150.5,-4333.7,0],
  ['n1426979795','', 'w129316453',-171.6,-4318.1,-173.9,-4327.9,0],
  ['n1426979796','', 'w129316451',-160.1,-4320.8,-162.4,-4330.7,0],
]);
station('Комендантский проспект', 4.5, 'greenhouse', [
  ['n1394248524','1','w125560626',-5168.9,-8508.9,-5160.2,-8494.6,37,'w149357846'],
  ['n1394248522','2','w153596148',-5210.3,-8483.8,-5201.7,-8469.4,0,'w149357842'],
  ['n1394248520','3','w194540839',-5146.8,-8472.2,-5154.8,-8485.6,37,'w149357846'],
  ['n1394248514','4','w194540830',-5188.4,-8447.4,-5196.1,-8460,36,'w149357842'],
]);
station('Московская', 3.75, 'moscow', [
  ['n255154184','1','w586124533',-1682.9,9282.8,-1683.1,9271.4,0,'w1019543423'],
  ['n648222971','2','w586124530',-1683.4,9256.1,-1683.2,9264.2,0,'w1019543422'],
  ['n648222973','3','w50826368',-1638.2,9285.5,-1638.3,9277.1,0],
  ['n410853960','4','w50826367',-1639.2,9238.2,-1639,9245.6,0],
  ['n648242364','5','w586124537',-1698.6,8822.4,-1698.8,8814.2,24],
  ['n648242362','6','w586124535',-1699.3,8796.5,-1699.1,8804.8,23],
  ['n648242366','7','w50828632',-1650.4,8832.8,-1650.6,8824.5,25],
  ['n648242369','8','w50828629',-1651.9,8784.8,-1651.7,8792.5,27],
]);
// The OSM entrance nodes for these two indicate the bottom. Both mapped ways go up.
station('Петроградская', 3.65, 'arcade', [
  ['n1720800873','2','w160015877',-2249.4,-3753.4,-2253.4,-3761.7,20,'w160015874'],
  ['n1720800885','3','w160015881',-2265.2,-3786.1,-2260.7,-3776.7,20,'w160015874'],
]);
station('Садовая', 4.35, 'pinkgranite', [
  ['n923969835','1','w79054310',-1862.9,678,-1854.3,670.9,41],
  ['n923969862','2','w183817647',-1828.3,649.1,-1836.7,656.1,40],
  ['n1043074280','3','w448355768',-1929.2,620.6,-1920.7,613.5,37],
  ['n92715802','4','w79054303',-1883.2,582.4,-1891.6,589.3,37],
]);
station('Спортивная', 3.8, 'sport', [
  ['n846585665','1','w71080949',-3392,-2157.1,-3381.6,-2171.3,39],
  ['n846585677','2','w1436478791',-3361.6,-2210,-3350.1,-2203.8,33,'w938411790'],
  ['n8611538005','3','w1436478790',-3319.7,-2186.8,-3331.1,-2193.3,31,'w938411789'],
  ['n846585667','4','w71080946',-3315.7,-2148.2,-3329.8,-2155.5,39],
  ['n846585678','5','w71080945',-3332.7,-2134.5,-3337.3,-2149.5,39],
  ['n5930135059','8','w627859235',-3804.7,-1768.5,-3796,-1765.4,18,null,{second:[-3787.9,-1762.4,29]}],
  ['n5930135058','9','w627859220',-3765.5,-1754.7,-3773.1,-1757.4,18,null,{second:[-3783.3,-1760.9,35]}],
  ['n3566607212','10','w627859227',-3713.4,-1717.5,-3720,-1720.9,13,null,{second:[-3725.4,-1723.9,14]}],
]);

export const regionalUnderpassSites = new Map(entries);
export const regionalUnderpassBuildingIds = new Set(entries.map(([,s])=>s.canopy).filter(Boolean));
const areaEntrances = new Set(ENTRANCES.map(e=>e.id));
export const areaUnderpasses = entries.map(([,s])=>s).filter(s=>areaEntrances.has(s.id));
export const regionalUnderpassHoles = areaUnderpasses.map(s=>s.hole);

// On the public square between Zenit's two larger entrances. The two small square
// OSM footprints are the overhanging roofs, not opaque walls down to the pavement.
export const regionalLiftBuildingIds = new Set(['w590181286','w590181289']);
export const areaUnderpassLifts = BUILDINGS.filter(b=>regionalLiftBuildingIds.has(b.id)).map(b=>{
  const flat=b.polys[0].o, n=flat.length/2;
  let x=0,z=0;
  for(let i=0;i<flat.length;i+=2){x+=flat[i]/n;z+=flat[i+1]/n;}
  return {id:b.id,bldg:b.id,name:'Зенит',x,z,axis:b.id==='w590181286'?-Math.PI/2:Math.PI/2,
    roofWidth:Math.max(...flat.filter((_,i)=>i%2))-Math.min(...flat.filter((_,i)=>i%2)),
    roofDepth:Math.max(...flat.filter((_,i)=>!(i%2)))-Math.min(...flat.filter((_,i)=>!(i%2)))};
});
