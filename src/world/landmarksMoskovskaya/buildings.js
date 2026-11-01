// Measured footprint shells and photograph-derived facade rhythms. Main
// reference views: NLR's own history and Visit Petersburg's tower photograph.
// The tower's 76 m mapped tip is retained; the library's lower portico is open.
import * as THREE from 'three';
import { onEdge, band } from '../landmarksD/kit.js';

function facades(K, edges, h, { floor = 3.6, bay = 3.7, bottom = 1.4, w = 1.5 } = {}) {
  K.use(true);
  for (const e of edges) onEdge(K.detail, e, len => {
    const n = Math.floor(len / bay);
    for (let i = 0; i < n; i++) for (let y = bottom; y + 2.1 < h - .6; y += floor)
      K.window((i + .5) * len / n, y, w, 2.1);
  });
}

function figure(P, M, x, y, z, scale = 1) {
  P.push(x, y, z);
  P.col(M.stone, 0, 0, 0, .4 * scale, .55 * scale, .55 * scale, 8);
  P.col(M.stone, 0, 0, .4 * scale, 1.55 * scale, .30 * scale, .43 * scale, 8);
  P.geo(M.stone, new THREE.IcosahedronGeometry(.27 * scale, 1), 0, 1.94 * scale, 0);
  for (const s of [-1, 1]) {
    P.cyl(M.stone, [s * .15 * scale, .4 * scale, 0], [s * .12 * scale, 1.3 * scale, 0], .14 * scale);
    P.cyl(M.stone, [s * .3 * scale, 1.55 * scale, 0], [s * .48 * scale, .8 * scale, .1 * scale], .14 * scale);
  }
  P.pop();
}

export function spire(K, records) {
  const r = records.find(b => b.id === 'w32272976'); if (!r) return;
  const { body: P, detail: D, mats: M, ctx, svc } = K, x = r.cx, z = r.cz, rot = .029;
  const edges = K.shell(r, 31.5, M.stone);
  facades(K, edges, 31.5, { floor: 3.5, bay: 4.0, bottom: 1.8, w: 1.65 });
  for (const y of [3.8, 7.4, 28.3, 30.9]) band(P, edges, y, y + .32, .32, { front: M.trim, top: M.trim, under: M.shade });
  P.push(x, 0, z, rot); D.push(x, 0, z, rot);
  P.box(M.trim, -9, 9, 31.4, 32.15, -9, 9);
  // Narrow solid core with an open, four-sided colonnade around it.
  P.box(M.stone, -3.3, 3.3, 32.15, 43.7, -3.3, 3.3);
  for (let side = 0; side < 4; side++) {
    P.push(0, 0, 0, side * Math.PI / 2);
    for (const u of [-5.5, -1.83, 1.83, 5.5]) {
      P.box(M.trim, u - .37, u + .37, 32.1, 43.6, 5.5, 6.3);
      P.box(M.trim, u - .53, u + .53, 43.35, 43.75, 5.35, 6.45);
    }
    P.pop();
  }
  P.box(M.trim, -6.7, 6.7, 43.65, 44.6, -6.7, 6.7);
  // Four sloped roof planes meet the octagonal needle's base.
  for (let s = 0; s < 4; s++) {
    P.push(0, 0, 0, s * Math.PI / 2);
    P.quad(M.roof, [-6.5,44.6,6.5],[6.5,44.6,6.5],[1.8,49.4,1.8],[-1.8,49.4,1.8],[0,1,1]);
    P.pop();
  }
  P.col(M.roof, 0, 0, 49.4, 50.8, 2.1, 1.8, 8);
  P.col(M.gold, 0, 0, 50.8, 74.0, .86, .035, 8);
  D.geo(M.gold, new THREE.TorusGeometry(.95, .13, 5, 20), 0, 73.8, 0);
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, r0 = i % 2 ? .42 : 1.05; const u = Math.sin(a) * r0, v = Math.cos(a) * r0 + 75; if (i) star.lineTo(u,v); else star.moveTo(u,v); }
  star.closePath(); D.extrude(M.gold, star, -.12, .24, 1, 2);
  for (const a of [-1,1]) for (const b of [-1,1]) {
    figure(D, M, a * 8.15, 32.1, b * 8.15, 1.4);
    D.geo(M.stone, new THREE.SphereGeometry(.45, 8, 5), a * 6.3, 45.1, b * 6.3);
  }
  D.pop(); P.pop();
  ctx.physics.addBox(x,z,13.4,13.4,rot,43.65,44.6);
  svc.houses.push({id:r.id,name:'Дом со шпилем',x,z,h:76});
  svc.photoSpots.push({name:'Дом со шпилем · Московский, 190',x:-1726,z:7593,yaw:-126,pitch:24});
}

export { library } from './library.js';

export function council(K, records) {
  const { mats:M, body:P, svc } = K;
  for(const r of records.filter(b=>!b.skip)) {
    const round = r.id === 'r3483967', h = round ? 24.5 : 17.5;
    const edges=K.shell(r,h,M.stone);
    K.cornice(edges,h);
    for(const y of [1,4.2])band(P,edges,y,y+.18,.10,{front:M.shade,top:M.shade,under:M.shade});
    facades(K,edges,h,{floor:3.6,bay:3.3,bottom:1.4,w:round?2.0:1.65});
    svc.houses.push({id:r.id,name:'Московский райсовет',x:r.cx,z:r.cz,h});
  }
  K.label('mz-council-name','МОСКОВСКИЙ РАЙОН',-1794.9,6.8,5198,15,1.0,Math.PI/2);
  svc.photoSpots.push({name:'Московский райсовет · конструктивизм',x:-1758,z:5295,yaw:67,pitch:12});
}
