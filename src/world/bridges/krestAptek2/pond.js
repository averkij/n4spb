// bridges/krestAptek2/pond.js - the road bridge over the pond neck in the Primorsky Victory Park (OSM w44389548 + the deck ring w368503773, 2 asphalt lanes, layer 1, unnamed): a 19 m plain RC slab bridge.
// The park ponds are a cut of the ground (bed -1.4, water -0.35, a grass rim that slopes inward, a 0.4 m collider box along the outline, like the Yelagin ponds of bridges/yelaginPonds.js): the street network draws
// the road flat across it and the environment lays an invisible fallback deck.  The bridge is the generic girder of krestAptek.js buildWith (fascia, asphalt, pavements, plain rod railing) with the pond water
// level; its colliders open the outline boxes where they cross the deck strip (the leftover pieces are put back).  [E] width 9.4 m = the deck ring, 2 x 3.6 m lanes; the name of the bridge is not known [?].
import { axisFrame, buildWith } from '../krestAptek.js';
import { toUV, toWorld } from '../sites.js';

const fPB = axisFrame([-5897.1, -4599.5], [-5872.9, -4618.1], 7.0, 26.0);
export const PB = {
  id: 'krestpond', name: 'Мост через пруд парка Победы', nameEn: 'Park road bridge over the pond neck (Primorsky Victory Park, unnamed)', ww: 'neva', waterY: -0.35, ...fPB, hw: 4.7, road: 3.6, kerbW: 0.25, kerbH: 0.15, crown: 0.12,
  piers: [], spans: ['girder'], look: { fas: 'fasPale', dark: 'concrete', granite: 'graniteGrey', parapet: 'parapet', pave: 'footAsphalt', kerb: 'kerb' },
  rail: { kind: 'plainrods', hex: '#5f625c', bay: 2.0 }, depth: { fascia: 0, pier: 0.62, mid: 0.5, bank: 0.62 }, marks: { solid: [], dash: [0] }, tracks: null, lowKerb: true,
  lamps: { kind: 'cobra', u: [], opts: { h: 9, mat: 'steel' } }, ka: { slabA: -fPB.wayBefore, slabB: fPB.len + fPB.wayAfter },
  osm: ['w44389548', 'w368503773'], at: [-5885, -4609],
  carLead: 8,   // the approaches are 2.4 m footways (trees stand beside / on them): the car test starts 8 m before the ends instead of 24 m
};

/** cuts the outline boxes of the pond (y -2 .. 1.25, 0.4 m thick) where they cross the deck strip |v| <= hw + 0.35, |u| <= U; puts the pieces outside the strip back */
function openRimBoxes(ph, sp, U, hw) {
  const R = U + hw + 14, strip = hw + 0.35; let n = 0;
  const W = (u, v) => toWorld(sp, u, v), UV = (x, z) => toUV(sp, x, z);
  for (const it of Array.from(ph._query(sp.cx + (U > 0 ? 0 : 0), sp.cz, R + sp.len))) {
    if (it.type !== 'box' || it.y0 !== -2 || it.y1 !== 1.25 || Math.abs(it.hd * 2 - 0.4) > 0.02) continue;
    const ax = it.c, az = -it.s, p0 = UV(it.cx - ax * it.hw, it.cz - az * it.hw), p1 = UV(it.cx + ax * it.hw, it.cz + az * it.hw);
    const dv = p1.v - p0.v, du = p1.u - p0.u; let t0 = 0, t1 = 1;
    if (Math.abs(dv) < 1e-6) { if (Math.abs(p0.v) > strip) continue; } else { const ta = (-strip - p0.v) / dv, tb = (strip - p0.v) / dv; t0 = Math.max(0, Math.min(ta, tb)); t1 = Math.min(1, Math.max(ta, tb)); if (t1 <= t0) continue; }
    const um = p0.u + du * (t0 + t1) / 2; if (um < -U - 0.4 || um > sp.len + U + 0.4) continue;
    if(it.source?.knock)continue; ph.remove(it); n++;
    const seg = (ta, tb) => { if ((tb - ta) * Math.hypot(du, dv) < 0.4) return; const a = W(p0.u + du * ta, p0.v + dv * ta), b = W(p0.u + du * tb, p0.v + dv * tb), l = Math.hypot(b.x - a.x, b.z - a.z); ph.addBox((a.x + b.x) / 2, (a.z + b.z) / 2, l + 0.1, 0.4, Math.atan2(-(b.z - a.z), b.x - a.x), -2, 1.25); };
    seg(0, t0); seg(t1, 1);
  }
  return n;
}
export function buildPond(env) {
  const sp = PB;
  return buildWith(env, sp, ({ B }) => ({ colliders: (ph) => { B.info.rimCut = openRimBoxes(ph, sp, 2.5, sp.hw); } }));
}
