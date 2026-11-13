// The two surveyed monumental landings on the Finlyandsky Neva bank.
// Ordinary banks remain owned by environment / finlyandskyBanks.
import * as THREE from 'three';
import { makeMats } from './finlyandskyWaterfront/materials.js';
import { buildLenin } from './finlyandskyWaterfront/lenin.js';
import { buildGrotto } from './finlyandskyWaterfront/grotto.js';
export const OWNS_GROUPS = true;
export function build(ctx){
  const root=new THREE.Group();root.name='finlyandskyWaterfront';
  const svc={sites:[],monuments:[],photoSpots:[],triangles:0};
  buildLenin(ctx,root,makeMats(ctx,'finlyandsky-lenin-bank'),svc);
  buildGrotto(ctx,root,makeMats(ctx,'finlyandsky-bezborodko-bank',true),svc);
  ctx.addStatic(root);ctx.services.finlyandskyWaterfront=svc;
  const common=ctx.services.landmarks||={};common.monuments=(common.monuments||[]).concat(svc.monuments);common.photoSpots=(common.photoSpots||[]).concat(svc.photoSpots);
}
