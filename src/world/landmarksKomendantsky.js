// Mapped aviation memorials and Park Ozero Dolgoye entrance. OSM node IDs and
// city/photo references are recorded in the area's README. All geometry is
// static and bounded, with no per-frame work.
import * as THREE from 'three';
import { Parts } from './landmarksOkrug65/kit.js';
import { MONUMENTS, WATER } from './data/city.js';

const FIRST_PILOTS = 'n6039581494', MATSIEVICH = 'n7035735851';
const PARK_GATE = 'n11115677390', PARK_LETTERS = 'n11115673187';
const BUST_IDS = ['n7035735852', 'n7035735853', 'n7035735854',
  'n7035735855', 'n7035735856', 'n7035735857', 'n7035735864'];
const byId = id => MONUMENTS.find(m => m.id === id);
const headMesh = new THREE.IcosahedronGeometry(1, 1);
const worldPoint = (x, z, yaw, u, v) =>
  [x + Math.cos(yaw) * u + Math.sin(yaw) * v, z - Math.sin(yaw) * u + Math.cos(yaw) * v];

function star(P, M, x, z, y, up) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = i * Math.PI / 5, r = i % 2 ? .18 : .4;
    return [x + Math.sin(a) * r, z + Math.cos(a) * r];
  });
  P.cap(M.red, pts, y, up);
}

function wing(P, M, span, z, y, upper) {
  const edge = [[-span,z-.48],[-span+.3,z-.7],[span-.3,z-.7],[span,z-.48],
    [span,z+.48],[span-.3,z+.66],[-span+.3,z+.66],[-span,z+.48]];
  P.cap(upper ? M.upperWing : M.lowerWing, edge, y + .055);
  P.cap(M.wingShade, edge, y - .055, false);
  for (let i = 0; i < edge.length; i++) {
    const a = edge[i], b = edge[(i + 1) % edge.length];
    P.quad(M.wingShade, [a[0],y-.055,a[1]], [b[0],y-.055,b[1]],
      [b[0],y+.055,b[1]], [a[0],y+.055,a[1]]);
  }
  for (const sx of [-span * .62, span * .62]) {
    star(P, M, sx, z, y + .066, true);
    if (!upper) star(P, M, sx, z, y - .066, false);
  }
}

function biplane(P, M, x, z, yaw, lift, number) {
  P.push(x, 0, z, yaw);
  // The two real U-2s stand on long pale, slanted pylons, rather than posts.
  P.box(M.granite, -2.1, -.6, .02, .3, 2.15, 3.45);
  P.beam(M.pylon, [[-1.55,.3,2.75],[-.85,lift*.53,1.55],[0,lift-.56,.05]], .43, .34);
  P.beam(M.pylonShade, [[-1.05,.45,2.8],[-.42,lift*.47,1.6],[.22,lift-.8,.38]], .12, .12);

  wing(P, M, 3.05, .1, lift, false);
  wing(P, M, 3.37, -.18, lift + 1.13, true);
  P.beam(M.fuselage, [[0,lift-.2,2.65],[0,lift+.08,.35]], .22, .26, [1,0,0], 1, 2.9);
  P.beam(M.fuselage, [[0,lift+.08,.35],[0,lift+.35,-2.47]], .62, .6, [1,0,0], 1, .68);
  P.cyl(M.nose, [0,lift+.35,-2.43], [0,lift+.4,-2.76], .33, .25, 10);
  P.cyl(M.dark, [0,lift+.4,-2.76], [0,lift+.4,-2.87], .16, .16, 8);
  P.beam(M.dark, [[-.06,lift-.45,-2.88],[.08,lift+1.24,-2.88]], .13, .08);
  for (const cz of [-.68, .22]) {
    P.box(M.dark, -.27, .27, lift+.36, lift+.39, cz-.28, cz+.24);
    P.beam(M.frame, [[-.32,lift+.38,cz-.3],[0,lift+.61,cz-.4],
      [.32,lift+.38,cz-.3]], .045, .045);
  }
  for (const sx of [-2.38,-1.13,1.13,2.38]) for (const dz of [-.39,.47])
    P.beam(M.frame, [[sx,lift+.06,dz],[sx*.96,lift+1.08,dz-.17]], .055, .065);
  for (const sx of [-2.38,2.38]) {
    P.beam(M.wire, [[sx,lift+.08,.46],[sx*.48,lift+1.09,-.48]], .018, .018);
    P.beam(M.wire, [[sx,lift+.08,-.38],[sx*.48,lift+1.09,.31]], .018, .018);
  }
  for (const sx of [-.7,.7]) {
    P.beam(M.frame, [[sx*.45,lift-.2,-1.05],[sx,lift-.75,-.82]], .075, .075);
    P.cyl(M.dark, [sx-.1,lift-.78,-.82], [sx+.1,lift-.78,-.82], .27, .27, 10);
    P.cyl(M.pylon, [sx-.11,lift-.78,-.82], [sx-.105,lift-.78,-.82], .075, .075, 8);
  }
  const tail = [[-1.35,1.93],[-1.17,2.55],[1.17,2.55],[1.35,1.93]];
  P.cap(M.lowerWing, tail, lift-.12);
  P.cap(M.wingShade, tail, lift-.2, false);
  const fin = [[0,lift-.12,1.92],[0,lift+.77,2.06],
    [0,lift+.75,2.7],[0,lift-.2,2.7]];
  P.fan(M.nose, fin, [1,0,0]); P.fan(M.nose, fin, [-1,0,0]);
  if (number) {
    // Pale number strokes echo the photographed "20" on the forward aircraft.
    P.beam(M.ivory, [[-.37,lift+.03,1.25],[-.37,lift+.28,1.04],
      [-.37,lift+.28,.91],[-.37,lift+.03,.71]], .055, .045);
    P.beam(M.ivory, [[-.37,lift+.03,.55],[-.37,lift+.28,.55],
      [-.37,lift+.28,.38],[-.37,lift+.03,.38],[-.37,lift+.03,.55]], .055, .045);
  }
  P.pop();
  return worldPoint(x, z, yaw, -1.55, 2.75);
}

function aviators(ctx, M, site) {
  const root = new THREE.Group(); root.name = 'komendantsky-first-aviators';
  const P = new Parts();
  let feet;
  P.ranged(1700, () => {
    feet = [biplane(P,M,site.x-3.5,site.z+.8,-.42,7.25,true),
      biplane(P,M,site.x+3.55,site.z-.9,.28,8.2,false)];
  });
  P.build(root, { name: 'first-aviators' }); ctx.addStatic(root);
  for (const [x,z] of feet) ctx.physics.addBox(x,z,1.5,1.3,0,.02,.3);
  return P.tris;
}

// Open strokes make the photographed turf-faced park letters legible from the
// mapped east entrance without a new texture or a font loader.
const GLYPHS = {
  'П': [[0,0,0,1],[0,1,1,1],[1,1,1,0]],
  'А': [[0,0,.5,1],[.5,1,1,0],[.2,.44,.8,.44]],
  'Р': [[0,0,0,1],[0,1,.82,1],[.82,1,1,.82],[1,.82,.82,.55],[.82,.55,0,.55]],
  'К': [[0,0,0,1],[0,.46,1,1],[0,.46,1,0]],
  'О': [[0,0,0,1],[0,1,1,1],[1,1,1,0],[1,0,0,0]],
  'З': [[0,1,1,1],[1,1,.52,.5],[.52,.5,1,0],[1,0,0,0],[.28,.5,.7,.5]],
  'Е': [[1,1,0,1],[0,1,0,0],[0,0,1,0],[0,.5,.8,.5]],
  'Д': [[0,0,.3,1],[.3,1,.86,1],[.86,1,1,0],[0,0,1,0],[-.12,0,-.12,-.16],[1.12,0,1.12,-.16]],
  'Л': [[0,0,.44,1],[.44,1,1,1],[1,1,1,0]],
  'Г': [[0,0,0,1],[0,1,1,1]],
};

function parkLetters(ctx, M, site) {
  const root = new THREE.Group(); root.name = 'dolgoe-park-letters';
  const P = new Parts(), yaw = 1.36;
  P.ranged(720, () => {
    P.push(site.x, 0, site.z, yaw);
    P.box(M.granite, -8.75, 8.75, .02, .38, -.38, .38);
    P.box(M.ivory, -8.26, -6.57, .58, 1.96, -.09, .12);
    P.box(M.turf, -8.36, -8.2, .48, 2.06, -.15, .22);
    P.box(M.turf, -6.63, -6.47, .48, 2.06, -.15, .22);
    P.box(M.turf, -8.36, -6.47, 1.9, 2.06, -.15, .22);
    P.box(M.turf, -8.36, -6.47, .48, .64, -.15, .22);
    for (const y of [.86,1.13,1.4])
      P.beam(M.wave, [[-8.06,y,.25],[-7.73,y+.1,.25],
        [-7.4,y,.25],[-6.82,y+.06,.25]], .075, .07, [0,0,1]);
    let x = -6.02;
    for (const c of 'ПАРК ОЗЕРО ДОЛГОЕ') {
      if (c === ' ') { x += .48; continue; }
      for (const [u0,v0,u1,v1] of GLYPHS[c])
        P.beam(M.turf, [[x+u0*.68,.61+v0*1.2,.13],
          [x+u1*.68,.61+v1*1.2,.13]], .16, .15, [0,0,1]);
      x += .83;
    }
    P.pop();
  });
  P.build(root, { name: 'dolgoe-letters' }); ctx.addStatic(root);
  // Small plinth colliders avoid a broad wall across the parallel footway.
  for (const u of [-6,-2,2,6]) {
    const [x,z] = worldPoint(site.x,site.z,yaw,u,0);
    ctx.physics.addBox(x,z,1.3,1.3,0,.02,.38);
  }
  return P.tris;
}

function seagullGate(ctx, M, site) {
  const root = new THREE.Group(); root.name = 'dolgoe-seagull-entrance';
  const P = new Parts(), yaw = -1.78;
  P.ranged(720, () => {
    P.push(site.x, 0, site.z, yaw);
    for (const s of [-1,1]) {
      P.box(M.granite, s*3.6-.4, s*3.6+.4, .02, .36, -.45, .45);
      P.beam(M.pylon, [[s*3.6,.36,0],[s*3.42,2.55,0],
        [s*2.55,3.37,0],[s*1.18,4.02,0],[0,3.48,0]],
        .34, .26, [0,0,1]);
      P.beam(M.pylonShade, [[s*3.38,2.55,-.16],
        [s*2.5,3.29,-.16],[s*1.16,3.93,-.16]], .075, .055, [0,0,1]);
    }
    P.beam(M.ivory, [[-.5,3.55,0],[0,3.3,.35],[.5,3.55,0]], .17, .16);
    P.pop();
  });
  P.build(root, { name: 'dolgoe-gate' }); ctx.addStatic(root);
  for (const s of [-1,1]) {
    const [x,z] = worldPoint(site.x,site.z,yaw,s*3.6,0);
    ctx.physics.addBox(x,z,.8,.8,0,.02,.36);
  }
  return P.tris;
}

function lakeShore(ctx, M) {
  const ring = WATER.find(w => w.id === 'r6597846')?.polys?.[0]?.o;
  if (!ring) return 0;
  const root = new THREE.Group(); root.name = 'dolgoe-south-shore-reeds';
  const P = new Parts();
  let last = null, count = 0;
  P.ranged(230, () => {
    for (let i = 0; i < ring.length; i += 2) {
      const x = ring[i], z = ring[i+1];
      // Sparse tufts at the mapped south/east bank, away from the walking path.
      if (x < -4835 || x > -4610 || z < -9450 || z > -9355) continue;
      if (last && Math.hypot(x-last[0],z-last[1]) < 13) continue;
      last = [x,z]; count++;
      for (let j = 0; j < 4; j++) {
        const a = i*.61+j*1.77, dx = Math.sin(a)*.52, dz = Math.cos(a)*.52;
        const h = .6+(j%3)*.21;
        P.beam(j === 0 ? M.reedGold : M.reed,
          [[x+dx,-.68,z+dz],[x+dx*1.35,h-.48,z+dz*1.35]], .048, .036);
        P.fan(M.sedge, [[x+dx,-.32,z+dz],[x+dx+.22,h-.25,z+dz+.1],
          [x+dx+.38,-.2,z+dz+.24]], [0,0,1]);
      }
    }
  });
  if (!count) return 0;
  P.build(root, { name: 'dolgoe-reeds', cast: false }); ctx.addStatic(root);
  return P.tris;
}

function matsievich(ctx, M, site) {
  const root = new THREE.Group(); root.name = 'komendantsky-matsievich-garden';
  const P = new Parts();
  P.ranged(950, () => {
    // A light paved central alley lies between the seven mapped bust nodes.
    P.cap(M.paving, [[-3584.1,-7241.6],[-3568.6,-7243.8],
      [-3560.5,-7198.5],[-3579.8,-7196.1]], .026);
    P.box(M.granite, site.x-1.55, site.x+1.55, .03, .32,
      site.z-1.22, site.z+1.22);
    P.beam(M.darkStone, [[site.x,.32,site.z],[site.x,3.63,site.z]],
      1.74, 1.28, [1,0,0], 1, .54);
    P.prism(M.darkStone, site.x,site.z,.89,4,3.55,3.82,Math.PI/4);
    P.beam(M.darkStone, [[site.x,3.76,site.z],[site.x,4.38,site.z]],
      .92,.68,[1,0,0],1,.05);
    P.box(M.enamel, site.x-.42,site.x+.42,1.15,2.5,
      site.z-.69,site.z-.65);
    P.box(M.bronze, site.x-.04,site.x+.04,4.34,4.9,
      site.z-.06,site.z+.06);
    P.box(M.bronze, site.x-.28,site.x+.28,4.64,4.73,
      site.z-.06,site.z+.06);
    for (const id of BUST_IDS) {
      const m = byId(id); if (!m) continue;
      const towardPath = m.x < -3573 ? Math.PI/2 : -Math.PI/2;
      P.push(m.x,0,m.z,towardPath);
      P.box(M.granite,-.62,.62,.025,.16,-.62,.62);
      P.col(M.darkStone,0,0,.16,1.56,.47,.43,12);
      P.col(M.darkStone,0,0,1.52,1.61,.49,.49,12);
      P.box(M.bronze,-.31,.31,.83,1.31,.47,.5);
      P.geo(M.bronze,headMesh,0,1.79,0,0,0,0,.41,.34,.27);
      P.col(M.bronze,0,.08,1.92,2.22,.19,.2,9);
      P.geo(M.bronze,headMesh,0,2.25,.08,0,0,0,.21,.25,.21);
      P.pop();
      ctx.physics.addBox(m.x,m.z,1.15,1.15,0,.025,1.61);
    }
  });
  P.build(root, { name: 'matsievich-garden' }); ctx.addStatic(root);
  ctx.physics.addBox(site.x,site.z,3.1,2.45,0,.03,3.82);
  return P.tris;
}

export function build(ctx) {
  const M = {
    granite:ctx.mat.toon('#8c8e89'), darkStone:ctx.mat.toon('#454247'),
    paving:ctx.mat.toon('#a4a19a'), pylon:ctx.mat.toon('#d2d5ce'),
    pylonShade:ctx.mat.toon('#a6afb0'), upperWing:ctx.mat.toon('#31556a'),
    lowerWing:ctx.mat.toon('#367c8b'), wingShade:ctx.mat.toon('#29485b'),
    fuselage:ctx.mat.toon('#497f82'), nose:ctx.mat.toon('#769248'),
    frame:ctx.mat.toon('#4a5452'), wire:ctx.mat.toon('#838985'),
    dark:ctx.mat.toon('#292d30'), ivory:ctx.mat.toon('#d9d9c8'),
    red:ctx.mat.toon('#b73330'), turf:ctx.mat.toon('#426436'),
    wave:ctx.mat.toon('#4d8e9f'), reed:ctx.mat.toon('#607243'),
    reedGold:ctx.mat.toon('#8e7e4a'), sedge:ctx.mat.toon('#6c844d'),
    bronze:ctx.mat.toon('#6b5549'), enamel:ctx.mat.toon('#394c64'),
  };
  const pilots=byId(FIRST_PILOTS), mats=byId(MATSIEVICH);
  const gate=byId(PARK_GATE), letters=byId(PARK_LETTERS);
  const triangles=(pilots?aviators(ctx,M,pilots):0)
    +(mats?matsievich(ctx,M,mats):0)
    +(gate?seagullGate(ctx,M,gate):0)
    +(letters?parkLetters(ctx,M,letters):0)+lakeShore(ctx,M);
  const monuments=[pilots,mats,gate,letters].filter(Boolean).map(m=>({
    id:m.id, name:m.name||(m.id===PARK_GATE?'Вход в парк «Озеро Долгое»':'Парк «Озеро Долгое»'),
    x:m.x,z:m.z,
  }));
  const all=(ctx.services.landmarks ||= {});
  all.monuments=(all.monuments||[]).concat(monuments);
  ctx.services.landmarksKomendantsky={monuments,triangles};
}
