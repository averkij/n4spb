// Yelagin's outer edge has a low stone waterline; its park waterways and small
// islands have open grass banks. The coast ring is the mapped island outline.
import { ISLANDS2_COAST } from '../../world/environment/islands2-context.js';

const coast = ISLANDS2_COAST.yelagin;
const bounds=[Infinity,-Infinity,Infinity,-Infinity];
for(let i=0;i<coast.length;i+=2){bounds[0]=Math.min(bounds[0],coast[i]);bounds[1]=Math.max(bounds[1],coast[i]);bounds[2]=Math.min(bounds[2],coast[i+1]);bounds[3]=Math.max(bounds[3],coast[i+1]);}
function inside(x, z) {
  let hit = false;
  for (let i = 0, j = coast.length - 2; i < coast.length; j = i, i += 2) {
    const ax = coast[i], az = coast[i + 1], bx = coast[j], bz = coast[j + 1];
    if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) hit = !hit;
  }
  return hit;
}
export function onYelaginCoast(x, z) {
  for (let i = 0; i + 3 < coast.length; i += 2) {
    const ax = coast[i], az = coast[i + 1], dx = coast[i + 2] - ax, dz = coast[i + 3] - az;
    if (x < Math.min(ax, ax + dx) - 4 || x > Math.max(ax, ax + dx) + 4 || z < Math.min(az, az + dz) - 4 || z > Math.max(az, az + dz) + 4) continue;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    if (Math.hypot(x - ax - t * dx, z - az - t * dz) < 4) return true;
  }
  return false;
}
export const yelaginShoreRegion = (x, z) => x >= bounds[0]-4 && x <= bounds[1]+4 && z >= bounds[2]-4 && z <= bounds[3]+4 && (inside(x, z) || onYelaginCoast(x, z));
export const YELAGIN_SLOPES = [{
  id: 'yelagin', key: 'neva', run: 8, kerb: .35, lip: 0,
  continuous: true,
  stoneEdge: onYelaginCoast,
  rail: () => null, test: (x, z, nx, nz, bank) => !!bank.natural,
}];
