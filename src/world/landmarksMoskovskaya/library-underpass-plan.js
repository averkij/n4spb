// Mapped Park Pobedy pedestrian crossing, not an invented metro connection.
// OSM w32967047, w40349748/795, w1361718093/94 and w142389769/770/771/773.
// Photo 7 supplied by the owner defines the low glazed pavilion vocabulary.
export const UNDERPASS_BUILDING_IDS = ['w134205326','w134205325'];
export const UNDERPASS_FLOOR = -3.8; // estimated: 23 ordinary 16.5 cm risers
export const UNDERPASS_CEILING = -.72;
export const UNDERPASS_TUNNEL = { a:[-1736.8,7382.9], b:[-1691.2,7381.8], width:4 };
export function segmentFrame(a,b){
  const dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz);
  return {x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,d,rotY:Math.atan2(dx,dz),sx:dz/d,sz:-dx/d,tx:dx/d,tz:dz/d};
}
const route=(id,high,junction,width,steps,pavilion=null)=>{
  const f=segmentFrame(high,junction),landing=2.25;
  const low=[junction[0]-f.tx*landing,junction[1]-f.tz*landing];
  const flight=segmentFrame(high,low);
  return {id,high,junction,low,width,steps,pavilion,...flight};
};
export const UNDERPASS_STAIRS = [
  route('west-south',[-1736.3,7398.4],UNDERPASS_TUNNEL.a,3.35,23,'west'),
  route('west-north',[-1737.1,7368.3],UNDERPASS_TUNNEL.a,3.35,23,'west'),
  route('east-south',[-1690.8,7397.3],UNDERPASS_TUNNEL.b,4.35,23,'east'),
  route('east-north',[-1691.5,7366.6],UNDERPASS_TUNNEL.b,4.35,23,'east'),
  route('median-west',[-1720.1,7397.4],[-1720.4,7382.5],2.2,38),
  // The inferred 14m carriageway clips the mapped centreline's default stair
  // width. Keep the opening 0.9m inside the median; never cut live asphalt.
  route('median-east',[-1710.3,7396.9],[-1710.6,7382.2],2.2,44),
];
export const UNDERPASS_PAVILIONS = [
  {id:'west',building:'w134205326',north:[-1737.1,7368.3],south:[-1736.3,7398.4],width:4.9,junction:UNDERPASS_TUNNEL.a},
  {id:'east',building:'w134205325',north:[-1691.5,7366.6],south:[-1690.8,7397.3],width:6.55,junction:UNDERPASS_TUNNEL.b},
].map(p=>({...p,...segmentFrame(p.north,p.south)}));
// Both environment ground and street walking ribbons consume these same holes.
// Root integration appends the area's optional GROUND_HOLES to metro SHAFTS.
export const UNDERPASS_GROUND_HOLES = UNDERPASS_STAIRS.map(s=>({
  id:'library-underpass-'+s.id,kind:'stairs',x:s.x,z:s.z,w:s.width+.08,d:s.d,rotY:s.rotY,
}));
export function inUnderpassMouth(x,z,pad=0){
  return UNDERPASS_GROUND_HOLES.some(h=>{
    const dx=x-h.x,dz=z-h.z,c=Math.cos(h.rotY),s=Math.sin(h.rotY);
    return Math.abs(dx*c-dz*s)<h.w/2+pad&&Math.abs(dx*s+dz*c)<h.d/2+pad;
  });
}
export function inUnderpassPavilion(x,z,pad=0){
  return UNDERPASS_PAVILIONS.some(p=>{const dx=x-p.x,dz=z-p.z,c=Math.cos(p.rotY),s=Math.sin(p.rotY);
    return Math.abs(dx*c-dz*s)<p.width/2+pad&&Math.abs(dx*s+dz*c)<p.d/2+pad;
  });
}
