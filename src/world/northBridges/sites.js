// The drawn Neva deck frames, shared by the builder and street paint.
import * as A from '../area.js';

export const SITES = [
  { key: 'bolsheokhtinsky', x: 2622.4, z: -1150.1, ex: 2961.1, ez: -1131.1, width: 26, ramp: 110, h: 7.0 },
  { key: 'liteyny', x: -123.6, z: -1972.35, ex: -77.6, ez: -2356.45, width: 34.6, ramp: 80, h: 6.0 },
];
const claimed = new Set((A.GROUPS?.northBridges || []).map(g => g.key));
const decks = SITES.filter(b => claimed.has('north-' + b.key)).map(b => {
  const len = Math.hypot(b.ex-b.x,b.ez-b.z), tx = (b.ex-b.x)/len, tz = (b.ez-b.z)/len;
  return {...b,len,tx,tz,step:(len+2*b.ramp)/Math.ceil((len+2*b.ramp)/6)};
});
let enabled = true;
export function setNorthDecksEnabled(on) { enabled = !!on; }
export function deckProfile(b,d) { return Math.max(.035,b.h*Math.min(1,(d+b.ramp)/b.ramp,(b.len+b.ramp-d)/b.ramp)); }
/** Height of the actual triangulated deck, including both approach ramps.
 * The short segments straddling a bank interpolate between profile samples. */
export function northDeckHeight(x,z,tx=null,tz=null) {
  if (!enabled) return null;
  for (const b of decks) {
    // A road crossing below the approach shares its X/Z, not its elevation.
    if(tx!==null&&Math.abs(tx*b.tx+tz*b.tz)<.75)continue;
    const dx=x-b.x,dz=z-b.z,d=dx*b.tx+dz*b.tz,u=dx*b.tz-dz*b.tx;
    if(d < -b.ramp || d > b.len+b.ramp || Math.abs(u)>b.width/2-2.3) continue;
    const a=-b.ramp+Math.floor((d+b.ramp)/b.step)*b.step;
    return deckProfile(b,a)+(deckProfile(b,a+b.step)-deckProfile(b,a))*(d-a)/b.step;
  }
  return null;
}

/** Intersections with deck tessellation seams; paint must bend with the slab. */
export function northDeckCuts(a,b) {
  if(!enabled) return [];
  const out=[];
  for(const d of decks){
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
    if(len<1e-9||Math.abs((dx*d.tx+dz*d.tz)/len)<.75)continue;
    const s0=(a.x-d.x)*d.tx+(a.z-d.z)*d.tz,s1=(b.x-d.x)*d.tx+(b.z-d.z)*d.tz;
    if(Math.max(s0,s1)<-d.ramp || Math.min(s0,s1)>d.len+d.ramp || Math.abs(s1-s0)<1e-9)continue;
    const midX=(a.x+b.x)/2-d.x,midZ=(a.z+b.z)/2-d.z;
    if(Math.abs(midX*d.tz-midZ*d.tx)>d.width/2)continue;
    const lo=Math.max(0,Math.ceil((Math.min(s0,s1)+d.ramp)/d.step));
    const hi=Math.min(Math.round((d.len+2*d.ramp)/d.step),Math.floor((Math.max(s0,s1)+d.ramp)/d.step));
    for(let k=lo;k<=hi;k++){const t=(-d.ramp+k*d.step-s0)/(s1-s0);if(t>1e-8&&t<1-1e-8)out.push(t);}
  }
  return out.sort((a,b)=>a-b);
}
