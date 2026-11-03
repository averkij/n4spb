// landmarksYelaginSpits/hedges.js - the clipped hedge strips that finish the cobble wings on both sides of the wall (photos spit 22, 23: "side wings: cobblestone slopes finished by a strip of trimmed shrubs
// instead of a parapet"; dossier 5.1).  They follow the mapped embankment lines w1217811700 (north wing) and w1217811701 (south wing), 1.4 m landward of the top of the cobble slope, from 4 m beyond the head of
// the flight for 44 m: 0.8 m wide, 1.0 m high pieces of 2.6 m (vertical body, chamfered shoulders, leaf texture), solid for the player.  OSM maps no hedge here (BARRIERS has none within 50 m of the wall).
import { PIT_CLEAR } from './stairs.js';
import * as THREE from 'three';
import { Parts } from './parts.js';
import { knockBays } from '../lib/fence-bays.js';

const START = 4.0, LEN = 44.0, OFF = 1.4, HW = 0.4, H = 1.0, STEP = 2.6;

/** one clipped hedge piece of length l along x: vertical lower body, chamfered shoulders (0.17 m), flat top, both end faces; leaf texture 1.2 m per tile */
function piece(P, mat, l) {
  const x0 = -l / 2, x1 = l / 2, ys = H - 0.2, hs = HW - 0.17, T = 1.2, u = l / T;
  for (const s of [1, -1]) {
    P.quad(mat, [x0, 0, s * HW], [x1, 0, s * HW], [x1, ys, s * HW], [x0, ys, s * HW], [0, 0, s], [[0, 0], [u, 0], [u, ys / T], [0, ys / T]]);
    P.quad(mat, [x0, ys, s * HW], [x1, ys, s * HW], [x1, H, s * hs], [x0, H, s * hs], [0, 0.6, s * 0.8], [[0, ys / T], [u, ys / T], [u, H / T], [0, H / T]]);
  }
  P.quad(mat, [x0, H, -hs], [x1, H, -hs], [x1, H, hs], [x0, H, hs], [0, 1, 0], [[0, 0], [u, 0], [u, hs * 2 / T], [0, hs * 2 / T]]);
  P.quad(mat, [x0, 0, HW], [x1, 0, HW], [x1, 0, -HW], [x0, 0, -HW], [0, -1, 0]);
  for (const e of [x0, x1]) {
    const n = [e < 0 ? -1 : 1, 0, 0];
    P.quad(mat, [e, 0, -HW], [e, 0, HW], [e, ys, HW], [e, ys, -HW], n, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(mat, [e, ys, -HW], [e, ys, HW], [e, H, hs], [e, H, -hs], n, [[0, 0], [1, 0], [0.9, 0.3], [0.1, 0.3]]);
  }
}

export function hedges(ctx, P, M, svc, EMB) {
  const bays=[];
  for (const [id, nearFirst] of [['w1217811700', false], ['w1217811701', true]]) {
    const e = EMB.find((q) => q.id === id); if (!e) continue;
    let pts = []; for (let i = 0; i < e.pts.length; i += 2) pts.push([e.pts[i], e.pts[i + 1]]);
    if (!nearFirst) pts.reverse();
    // walk the polyline: samples every STEP metres from START to START + LEN
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const at = (s) => { let i = 1; while (i < pts.length - 1 && cum[i] < s) i++; const t = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1), a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, tx: (b[0] - a[0]) / l, tz: (b[1] - a[1]) / l }; };
    const samples = []; for (let s = START; s <= START + LEN + 1e-6; s += STEP) if (s < cum[cum.length - 1]) samples.push(at(s));
    if (samples.length < 2) continue;
    // landward side: the one that is not water
    const m = samples[Math.floor(samples.length / 2)], side = ctx.L.inRiver(m.x - m.tz * 3, m.z + m.tx * 3) ? 1 : -1;
    const off = samples.map((q) => [q.x - q.tz * side * OFF, q.z + q.tx * side * OFF]);
    for (let i = 0; i + 1 < off.length; i++) {
      const [x0, z0] = off[i], [x1, z1] = off[i + 1], mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, l = Math.hypot(x1 - x0, z1 - z0);
      if (ctx.L.insideBuilding(mx, mz, 1) || ctx.L.isOnRoad(mx, mz, 0.3) || PIT_CLEAR(mx, mz)) continue;
      const nx=-(z1-z0)/l,nz=(x1-x0)/l;
      const ground=(x,z)=>Math.min(...[-HW,0,HW].map(d=>ctx.L.heightAt(x+nx*d,z+nz*d)))-.04;
      // Bury the root across the full hedge footprint; the shared bay rolls
      // with the bank. Register the real closed hedge rather than allowing
      // the older solid adapter to replace a green box with a picket fence.
      if(ctx.L.waterwayAt(mx,mz))continue;
      bays.push({x0,z0,x1,z1,y:ground(x0,z0),ye:ground(x1,z1)});
    }
  }
  if(bays.length) {
    const model=new Parts();piece(model,M.hedge,1);
    const geo=model.build(new THREE.Group())[0].geometry;geo.translate(.5,0,0);
    const result=knockBays(ctx,{name:'yspit-hedges',bays,parts:[{geo,mat:M.hedge,name:'body',stretch:true}],
      collider:b=>({y0:Math.min(b.y,b.ye)-.1,y1:Math.max(b.y,b.ye)+H,thick:HW*2}),
      rec:{kind:'hedge',mass:100,h:H,anchored:8,hitK:.35,metal:false},far:260});
    for(const it of result.items)if(it)it.authoredVegetation=true;
  }
  svc.hedges = bays.length;
}
