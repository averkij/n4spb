// Rendering coverage is deliberately independent of PLAY / EXTENT. Keep only
// the first waterfront block, not the inland district behind the opposite bank.
export const BANK_DEPTH = 180;
export const VIEW_REACH = 1500;
export const WATERFRONT_RIVERS = new Set(['r1114249', 'r2599821', 'r1576175', 'r1576181', 'r1312677']);

export function rectDistance(rects, x, z) {
  let d = Infinity;
  for (const r of rects) d = Math.min(d, Math.hypot(Math.max(r.x0-x, 0, x-r.x1), Math.max(r.z0-z, 0, z-r.z1)));
  return d;
}
const segmentDistance = (x,z,ax,az,bx,bz) => {
  const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(x-ax-t*dx,z-az-t*dz);
};

export function shoreSegments(rivers) {
  const segments=[];
  for(const r of rivers) if(WATERFRONT_RIVERS.has(r.id)) for(const p of r.polys||[]) for(const o of [p.o,...(p.h||[])])
    for(let i=0,j=o.length-2;i<o.length;j=i,i+=2) segments.push([o[j],o[j+1],o[i],o[i+1]]);
  return segments;
}
export function hasWaterfront(play,segments) {
  // A district with no reachable river view (for example Moskovskaya) should
  // not pay for a distant shoreline that can only be seen after a hand-off.
  for(const [ax,az,bx,bz]of segments){
    const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/80));
    for(let i=0;i<=n;i++)if(rectDistance(play,ax+(bx-ax)*i/n,az+(bz-az)*i/n)<=120)return true;
  }
  return false;
}
const indexes=new WeakMap();
function shoreIndex(segments,depth){
  let byDepth=indexes.get(segments);if(!byDepth)indexes.set(segments,byDepth=new Map());
  if(byDepth.has(depth))return byDepth.get(depth);
  const cells=new Map(),cell=256;
  for(const s of segments){const [ax,az,bx,bz]=s;
    for(let x=Math.floor((Math.min(ax,bx)-depth)/cell);x<=Math.floor((Math.max(ax,bx)+depth)/cell);x++)
      for(let z=Math.floor((Math.min(az,bz)-depth)/cell);z<=Math.floor((Math.max(az,bz)+depth)/cell);z++){
        const k=x+','+z;let a=cells.get(k);if(!a)cells.set(k,a=[]);a.push(s);
      }
  }
  const at=(x,z)=>cells.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[];byDepth.set(depth,at);return at;
}
export function shoreDistance(segments, b, max=Infinity) {
  let d=Infinity;
  const at=Number.isFinite(max)?shoreIndex(segments,max):()=>segments;
  // Long mansions can have their centroid behind the 180m strip; their actual
  // waterfront edge still belongs to the panorama. Holes never add coverage.
  for(const p of b.polys||[]) for(let i=0;i<p.o.length;i+=2) {
    const x=p.o[i],z=p.o[i+1];
    for(const [ax,az,bx,bz] of at(x,z)) {
      if(x<Math.min(ax,bx)-d||x>Math.max(ax,bx)+d||z<Math.min(az,bz)-d||z>Math.max(az,bz)+d)continue;
      d=Math.min(d,segmentDistance(x,z,ax,az,bx,bz));
      if(d<=max&&Number.isFinite(max))return d;
    }
  }
  return d;
}

export function selectWaterfront({buildings, existing, play, segments, depth=BANK_DEPTH, reach=VIEW_REACH}) {
  if(!hasWaterfront(play,segments))return [];
  const have=new Set(existing.map(b=>b.id)), chosen=new Set(), families=new Set();
  for(const b of buildings) {
    if(have.has(b.id)||b.layer<0||b.underground||rectDistance(play,b.cx,b.cz)>reach)continue;
    if(shoreDistance(segments,b,depth)>depth)continue;
    chosen.add(b.id); families.add(b.parent||b.id);
  }
  // Parts and their outline travel together. Otherwise a clipped low outline
  // can suppress the only upper storey or roof of a waterfront ensemble.
  for(const b of buildings) if(!have.has(b.id)&&families.has(b.parent||b.id))chosen.add(b.id);
  return buildings.filter(b=>chosen.has(b.id)).map(b=>({...b,waterfront:true}));
}
