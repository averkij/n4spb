// Breakable replacement for the older source's merged railing runs. Each 3 m
// bay owns its geometry and collider; its foot starts at the deck, leaving the
// river below bridges open to boats. Uses the shared dynamic cell/LOD contract.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { knockBays } from './fence-bays.js';
export function portedRailings(ctx,name,bays,mat,{height=1.2,thick=.18,solid=false}={}) {
  const bridge=/^bridges/.test(name)||name.startsWith('parkovy2'),net=ctx.services.streets?.net;
  if(bridge)name='brg-'+name;
  else if(net)bays=bays.filter(b=>[0,.25,.5,.75,1].every(t=>net.cover(b.x0+(b.x1-b.x0)*t,b.z0+(b.z1-b.z0)*t,{})<-.5-thick/2));
  if(!bays.length)return;
  let panel;
  if(solid||mat.alphaTest>0){panel=solid?new THREE.BoxGeometry(1,height,thick):new THREE.PlaneGeometry(1,height);panel.translate(.5,height/2,0);}
  else {
    const parts=[new THREE.BoxGeometry(1,.07,thick).translate(.5,height-.05,0),new THREE.BoxGeometry(1,.06,thick).translate(.5,.18,0)];
    for(let i=0;i<9;i++)parts.push(new THREE.BoxGeometry(.015,height-.18,.035).translate((i+.5)/9,height/2+.03,0));
    panel=mergeGeometries(parts);parts.forEach(p=>p.dispose());
  }
  const post=new THREE.BoxGeometry(thick,height+.08,thick);post.translate(0,(height+.08)/2,0);
  const result=knockBays(ctx,{name,bays,parts:[{geo:panel,mat,name:'panel',stretch:true},{geo:post,mat,name:'post',at:'start'}],
    collider:(b)=>({y0:Math.min(b.y||0,b.ye??b.y??0)-.1,y1:Math.max(b.y||0,b.ye??b.y??0)+height,thick}),
    rec:{kind:'fence',mass:solid?400:90,h:height,anchored:solid?18:12,hitK:.4,metal:!solid},far:260});
  if(bridge)for(const item of result.items)if(item)item.bridgeItem=true;
  return result;
}
