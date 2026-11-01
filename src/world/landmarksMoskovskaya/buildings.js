// Measured footprint shells and photograph-derived facade rhythms. Main
// reference views: NLR's own history and Visit Petersburg's tower photograph.
// The tower's 76 m mapped tip is retained; the library's lower portico is open.
import * as THREE from 'three';
import { ringEdges, onEdge, band } from '../landmarksD/kit.js';
import { MeshBuilder, addCap } from '../lib/massing.js';

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

export function library(K, records) {
  const { body: P, detail: D, mats: M, ctx, svc } = K;
  K.use(true);
  for (const r of records.filter(b => !b.skip && !b.part)) {
    const main = r.id === 'r1806688', h = main ? 23.2 : 28.5;
    const edges = r.polys.flatMap(p => ringEdges(p));
    for (const p of r.polys) { const roof = new MeshBuilder(); addCap(roof,p,h); P.geo(M.roof,roof.build()); }
    for (const e of edges) {
      const mx = (e.a[0]+e.b[0])/2, mz = (e.a[1]+e.b[1])/2;
      const portico = main && !e.hole && mx > -1831 && mz > 7430 && mz < 7484;
      const entryGlass = main && e.hole && mx > -1844 && mz > 7430 && mz < 7484;
      onEdge(P,e,len => {
        // The curved upper drum bridges the tall open columns, as photographed.
        P.box(M.stone,0,len,portico || entryGlass ? 16.5 : 0,h,-.5,0);
        if(entryGlass) {
          P.box(M.dark,0,len,.3,16.5,-.35,-.05);
          // The hole's normal points INTO the courtyard. Both faces of the
          // recessed glazing need mullions: the colonnade sees its back face.
          for(const u of [0,len/2,len]) P.box(M.trim,u-.06,u+.06,.3,16.5,-.48,.06);
          for(const y of [.4,4.4,8.4,12.4,16.4]) P.box(M.trim,0,len,y,y+.12,-.48,.06);
          for(let y=.6;y<16;y+=4) P.quad(M.window,[.12,y,-.37],[len-.12,y,-.37],[len-.12,y+3.6,-.37],[.12,y+3.6,-.37],[0,0,-1]);
        }
        P.box(M.trim,0,len,h-.38,h+.12,-.52,.12);
        if (portico) P.box(M.shade,0,len,20.6,21.4,-.54,.025);
      });
      const dx=e.b[0]-e.a[0],dz=e.b[1]-e.a[1];
      ctx.physics.addBox(mx,mz,e.len,.75,Math.atan2(-dz,dx),portico?16.5:0,h);
      if (!portico) {
        if(!entryGlass)onEdge(D,e,len=>{ const n=len>2.3?Math.max(1,Math.floor(len/4.0)):0; for(let i=0;i<n;i++) for(let y=1.0;y+2.8<h-1;y+=4.2) K.window((i+.5)*len/n,y,1.7,2.8); });
      }
    }
    if (main) {
      const cx=-1842.1, cz=7456.3, rad=29.6;
      for(let i=0;i<9;i++) {
        const a=(-65+i*130/8)*Math.PI/180, x=cx+rad*Math.cos(a), z=cz+rad*Math.sin(a);
        P.col(M.trim,x,z,.3,16.5,.48,.48,4);
        ctx.physics.addCylinder(x,z,.68,0,16.5);
      }
      for (const [i,word] of ['РОССИЙСКАЯ','НАЦИОНАЛЬНАЯ','БИБЛИОТЕКА'].entries()) {
        const a=(34-i*34)*Math.PI/180;
        K.label('mz-library-name-'+i,word,cx+31.3*Math.cos(a),17.9,cz+31.3*Math.sin(a),15,1.05,Math.PI/2-a,{bg:'transparent',fg:'#363b40'});
      }
      svc.entrances.push({id:'mz-library',x:-1820,z:7456.3,rotY:Math.PI/2,name:'Российская национальная библиотека'});
    }
    svc.houses.push({id:r.id,name:'Российская национальная библиотека',x:r.cx,z:r.cz,h});
  }
  svc.photoSpots.push({name:'Российская национальная библиотека',x:-1760,z:7456,yaw:90,pitch:12});
}

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
