// landmarksMarineFacade/spots.js - the photo spots of the port and the Golden City quarter (dossier 9 + the CRITIC audit 9.1): every spot stands on PUBLIC ground (outside the fenced port landuse w704134882,
// or on the open bus loop of Terminal 4), never on a carriageway (net.cover < -0.8), never inside a building, and never within 1.2 m of a fence run; the nominal point of the dossier is moved on a ring
// until it passes (the search radius is 0 .. 9 m).  `yaw` looks at the named target (L.yawToward), `pitch` in degrees.  Published through ctx.services.landmarksMarineFacade.photoSpots and merged into
// ctx.services.landmarks.photoSpots by the module file.
import * as L from '../layout.js';
import { LANDUSE, BARRIERS } from '../data/city.js';
import { FW } from './frame.js';
import { coverFn } from './surfaces.js';
import { FENCE_IDS } from './fences.js';
import { shipCentre, SHIPS } from './ships.js';

const inRing = (x, z, o) => { let c = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) if ((o[i + 1] > z) !== (o[j + 1] > z) && x < (o[j] - o[i]) * (z - o[i + 1]) / (o[j + 1] - o[i + 1]) + o[i]) c = !c; return c; };

export function build(K) {
  const { ctx, svc } = K, cover = coverFn(ctx);
  const port = (LANDUSE.find((l) => l.id === 'w704134882') || { polys: [] }).polys[0];
  const fences = FENCE_IDS.map((id) => BARRIERS.find((b) => b.id === id)).filter(Boolean).map((b) => b.pts);
  const fenceDist = (x, z) => { let best = 1e9; for (const p of fences) for (let i = 0; i + 3 < p.length; i += 2) { const ax = p[i], az = p[i + 1], dx = p[i + 2] - ax, dz = p[i + 3] - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)); best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return best; };
  const good = (x, z, o) => cover(x, z) < -0.8 && !L.insideBuilding(x, z, 0.6) && fenceDist(x, z) > 1.2 && (o.allowPort || !port || !inRing(x, z, port.o)) && L.heightAt(x, z) > -1;
  const find = (x, z, o = {}) => {
    if (good(x, z, o)) return [x, z];
    for (let r = 1; r <= 9; r += 1) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 + r, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (good(px, pz, o)) return [px, pz]; }
    return null;
  };
  const spots = [];
  const spot = (name, x, z, tx, tz, pitch = 4, o = {}) => {
    const p = find(x, z, o); if (!p) { svc.counts.spotsDropped = (svc.counts.spotsDropped || 0) + 1; return; }
    spots.push({ x: Math.round(p[0] * 10) / 10, z: Math.round(p[1] * 10) / 10, yaw: L.yawToward(p[0], p[1], tx, tz), pitch, name });
  };
  const tc = (key) => { const t = svc.terminals.find((q) => q.key === key); return t ? [t.x, t.z] : null; };
  const t3 = tc('t3'), t1 = tc('t1'), t4 = tc('t4'), la = shipCentre(SHIPS[0]);
  if (t3) spot('Морской вокзал: терминал 3 от восточных ворот', -8699, -1800, t3[0], t3[1], 4);
  spot('Морской вокзал: лайнер у причалов 4-5 через акваторию', -8699, -1800, la.x, la.z, 3);
  spot('Морской вокзал: пост управления и контрольно-пропускной пункт', -8735, -1618, -8832.8, -1638.6, 3);
  if (t1) spot('Морской вокзал: терминал 1 с улицы Челюскина', -9300, -1215, t1[0], t1[1], 4);
  spot('Golden City: шпиль с улицы Лисянского', -8700, -806, -8715.7, -967, 28);
  spot('Golden City: башня со шпилем и арт-объект «Маяк»', -8700, -806, -8683.7, -810.8, 6);
  spot('Арт-объект «Маяк» у бульвара Вилькицкого', -8660, -528, -8666.9, -541.2, 6);
  spot('Golden City: ряд башен с золотыми коронами', -9107, -986, -8870, -990, 24);
  spot('Морской вокзал: терминал 4 от автобусной площадки', -9098, -2268, ...(t4 || [-9100, -2222]), 6, { allowPort: true });
  svc.photoSpots.push(...spots);
  svc.counts.photoSpots = spots.length;
}
