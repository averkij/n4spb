// The two surveyed monumental landings on the Finlyandsky Neva bank.
// Ordinary banks remain owned by environment / finlyandskyBanks.
import * as THREE from 'three';
import { makeMats } from './finlyandskyWaterfront/materials.js';
import { buildLenin } from './finlyandskyWaterfront/lenin.js';
import { buildGrotto } from './finlyandskyWaterfront/grotto.js';
import { BANK_RINGS } from './finlyandskyWaterfront/sites.js';
export const OWNS_GROUPS = true;
export function build(ctx){
  const root=new THREE.Group();root.name='finlyandskyWaterfront';
  const firstFloor=ctx.physics.items.length;
  const svc={sites:[],monuments:[],photoSpots:[],triangles:0};
  buildLenin(ctx,root,makeMats(ctx,'finlyandsky-lenin-bank'),svc);
  buildGrotto(ctx,root,makeMats(ctx,'finlyandsky-bezborodko-bank',true),svc);
  // Polygon slabs are exact walk triangles, represented by Physics as ramps.
  // Cars consume authored deck services (their generic low-floor path only
  // accepts walk boxes); use these actual floor handles for every tread/slab.
  const floors=new Set(ctx.physics.items.slice(firstFloor).filter(it=>it.type==='walk'||it.type==='ramp'));
  const bounds=BANK_RINGS.map(({ring})=>[Math.min(...ring.map(p=>p[0]))-.02,Math.max(...ring.map(p=>p[0]))+.02,Math.min(...ring.map(p=>p[1]))-.02,Math.max(...ring.map(p=>p[1]))+.02]);
  const hit={y:-Infinity,kind:null,item:null};
  svc.deckY=(x,z,ref=Infinity)=>{if(!bounds.some(b=>x>=b[0]&&x<=b[1]&&z>=b[2]&&z<=b[3]))return null;const q=ctx.physics.surfaceAt(x,z,ref,false,hit);return floors.has(q.item)?q.y:null;};
  svc.deckLift=()=>0;
  ctx.addStatic(root);ctx.services.finlyandskyWaterfront=svc;
  const common=ctx.services.landmarks||={};common.monuments=(common.monuments||[]).concat(svc.monuments);common.photoSpots=(common.photoSpots||[]).concat(svc.photoSpots);
}
