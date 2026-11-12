// Avtovo's non-metro heritage. Anchors and the two claimed building footprints
// are mapped OSM features; references and modelling decisions are in
// docs/research/avtovo-sites.md. Separate bounded roots keep distant memorials
// out of one giant culling sphere. No animation or per-frame work.
import * as THREE from 'three';
import { Parts } from './landmarksOkrug65/kit.js';
import { MONUMENTS } from './data/city.js';

export const OWNS_GROUPS = true;

const SITES = [
  ['n8672158517', 'Николай Путилов', -5102.3, 5883.7],
  ['n2592593238', 'Александр Маринеско', -5160.2, 6919.8],
  ['n1340264515', 'Танк-победитель КВ-85', -5187.0, 7949.1],
  ['n1368607035', 'Блокадный трамвай', -5325.1, 8113.6],
];
const site = ([id, name, x, z]) => {
  const m = MONUMENTS.find(q => q.id === id);
  return { id, name: m?.name || name, x: m?.x ?? x, z: m?.z ?? z };
};
const point = (x, z, yaw, u, v) =>
  [x + Math.cos(yaw) * u + Math.sin(yaw) * v,
    z - Math.sin(yaw) * u + Math.cos(yaw) * v];
const ICO = new THREE.IcosahedronGeometry(1, 1);

// Small upright stroke letters: map naming and vehicle numbers without a font
// loader, canvas texture, logo, or extra draw call per character.
const GLYPHS = {
  'А': [[0,0,.5,1],[.5,1,1,0],[.2,.42,.8,.42]],
  'В': [[0,0,0,1],[0,1,.75,1],[.75,1,.9,.78],[.9,.78,.75,.55],[.75,.55,0,.55],[.75,.55,.9,.27],[.9,.27,.75,0],[.75,0,0,0]],
  'Д': [[0,0,.24,1],[.24,1,.8,1],[.8,1,1,0],[0,0,1,0],[-.08,0,-.08,-.17],[1.08,0,1.08,-.17]],
  'Е': [[1,1,0,1],[0,1,0,0],[0,0,1,0],[0,.5,.75,.5]],
  'З': [[0,1,1,1],[1,1,.52,.52],[.52,.52,1,0],[1,0,0,0],[.4,.52,.75,.52]],
  'И': [[0,0,0,1],[0,0,1,1],[1,1,1,0]],
  'Й': [[0,0,0,1],[0,0,1,1],[1,1,1,0],[.24,1.18,.75,1.18]],
  'К': [[0,0,0,1],[0,.48,1,1],[0,.48,1,0]],
  'Л': [[0,0,.4,1],[.4,1,1,1],[1,1,1,0]],
  'М': [[0,0,0,1],[0,1,.5,.45],[.5,.45,1,1],[1,1,1,0]],
  'Н': [[0,0,0,1],[0,.5,1,.5],[1,0,1,1]],
  'О': [[0,0,0,1],[0,1,1,1],[1,1,1,0],[1,0,0,0]],
  'П': [[0,0,0,1],[0,1,1,1],[1,1,1,0]],
  'Р': [[0,0,0,1],[0,1,.8,1],[.8,1,1,.76],[1,.76,.8,.52],[.8,.52,0,.52]],
  'С': [[1,1,0,1],[0,1,0,0],[0,0,1,0]],
  'Т': [[0,1,1,1],[.5,1,.5,0]],
  'У': [[0,1,.5,.48],[1,1,.25,0]],
  'Ы': [[0,0,0,1],[0,.53,.7,.53],[.7,.53,.85,.28],[.85,.28,.7,0],[.7,0,0,0],[1,0,1,1]],
  '2': [[0,1,1,1],[1,1,1,.58],[1,.58,0,.4],[0,.4,0,0],[0,0,1,0]],
  '4': [[0,1,0,.43],[0,.43,1,.43],[1,1,1,0]],
  '5': [[1,1,0,1],[0,1,0,.53],[0,.53,1,.53],[1,.53,1,0],[1,0,0,0]],
  '6': [[1,1,0,.55],[0,.55,0,0],[0,0,1,0],[1,0,1,.52],[1,.52,0,.52]],
  '8': [[0,0,0,1],[0,1,1,1],[1,1,1,0],[1,0,0,0],[0,.5,1,.5]],
  '3': [[0,1,1,1],[1,1,1,0],[1,0,0,0],[.28,.5,1,.5]],
  '1': [[.5,0,.5,1],[.25,.75,.5,1],[.25,0,.75,0]],
  '0': [[0,0,0,1],[0,1,1,1],[1,1,1,0],[1,0,0,0]],
  '9': [[0,1,1,1],[1,1,1,0],[1,0,0,0],[0,1,0,.5],[0,.5,1,.5]],
  '-': [[0,.5,1,.5]],
};
function lettering(P, mat, text, width, x, y, z) {
  const advance = width * .84;
  const start = x - (text.length - 1) * advance / 2;
  for (let i = 0; i < text.length; i++) {
    const strokes = GLYPHS[text[i]];
    if (!strokes) continue;
    for (const [u0,v0,u1,v1] of strokes)
      P.beam(mat, [[start+i*advance+u0*width,y+v0*width*1.18,z],
        [start+i*advance+u1*width,y+v1*width*1.18,z]],
      Math.max(.025,width*.08), Math.max(.02,width*.06), [0,0,1]);
  }
}

function finish(ctx, P, name, cast = true) {
  const root = new THREE.Group(); root.name = name;
  P.build(root, { name, cast }); ctx.addStatic(root);
  return P.tris;
}

function factoryGate(ctx, M) {
  // The OSM guardhouse is 22 x 26 m overall, long axis NNE-SSW. Its street
  // face looks ESE. The photographed main passage is open to walking/driving.
  const x = -5215.5, z = 5889.5, yaw = 1.11, P = new Parts();
  P.push(x, 0, z, yaw);
  P.ranged(1150, () => {
    for (const s of [-1, 1]) {
      const a = s < 0 ? -12.4 : 4.45, b = s < 0 ? -4.45 : 12.4;
      P.box(M.ochre, a, b, .03, 4.72, -4.05, 3.9);
      P.box(M.pale, a-.13, b+.13, 4.57, 4.91, -4.18, 4.03);
      P.box(M.darkRoof, a-.18, b+.18, 4.91, 5.04, -4.23, 4.1);
      P.box(M.stone, a, b, .03, .3, 3.92, 4.06);
    }
    for (const s of [-1, 1]) {
      const u = s * 4.45;
      P.box(M.ochre, u-.36, u+.36, .02, 4.95, -4.15, 4.15);
      P.box(M.pale, u-.48, u+.48, 4.42, 4.97, -4.28, 4.23);
    }
    P.box(M.pale, -12.65, 12.65, 4.82, 5.55, -4.26, 4.2);
    P.box(M.stone, -12.85, 12.85, 5.49, 5.64, -4.35, 4.28);
    P.box(M.darkRoof, -12.85, 12.85, 5.64, 5.76, -4.35, 4.28);
    // Thin iron side leaves: the centre of the documented gate stays clear.
    for (const s of [-1,1]) for (let i=0; i<5; i++) {
      const u = s * (3.45 + i*.18);
      P.box(M.iron, u-.022,u+.022,.12,3.4,3.93,3.98);
    }
  });
  P.ranged(430, () => {
    // False-jointed yellow piers, photographed dark glass guard booth, and
    // the real facade words rather than a generic arch or factory logo.
    for (const s of [-1,1]) for (let y=.45; y<4.6; y+=.58)
      P.box(M.pale, s*4.45-.42,s*4.45+.42,y,y+.04,4.12,4.2);
    for (const u of [-9.55,-6.55,6.55,9.55]) {
      P.box(M.window, u-.98,u+.98,1.24,3.77,4.02,4.07);
      P.box(M.pale, u-1.05,u+1.05,3.7,3.84,4.08,4.13);
      P.box(M.pale, u-1.05,u-.95,1.18,3.83,4.08,4.13);
      P.box(M.pale, u+.95,u+1.05,1.18,3.83,4.08,4.13);
    }
    lettering(P,M.letters,'КИРОВСКИЙ ЗАВОД',.68,0,5.03,4.32);
    P.box(M.iron,-4.1,4.1,.04,.2,3.88,4.0);
  });
  P.pop();
  const triangles = finish(ctx,P,'avtovo-kirov-factory-gate');
  for (const u of [-8.45,8.45]) {
    const q=point(x,z,yaw,u,0);
    ctx.physics.addBox(q[0],q[1],7.85,8.1,yaw,.02,4.7);
  }
  for (const u of [-4.45,4.45]) {
    const q=point(x,z,yaw,u,0);
    ctx.physics.addBox(q[0],q[1],.72,8.3,yaw,.02,4.95);
  }
  return triangles;
}

function suitedFigure(P, M, base, naval = false) {
  const C = naval ? M.navyBronze : M.bronze;
  const top = base + 2.72;
  // Different historic poses: Putilov holds papers with his right hand on
  // his hip; Marinesko holds his naval cap low in front of his greatcoat.
  P.beam(C, [[-.29,base,.02],[-.29,base+1.02,.02]], .33,.32);
  P.beam(C, [[.3,base,.02],[.3,base+1.02,-.05]], .33,.32);
  P.geo(C,ICO,0,base+1.55,0,0,0,0,.54,.8,.33);
  P.box(C,-.58,.58,base+1.75,base+2.12,-.26,.22);
  P.beam(C,[[-.52,base+1.99,0],[-.74,base+1.13,.13]],.25,.23);
  if (naval) {
    // A long double-breasted greatcoat, its split hem and prominent lapels.
    P.vpoly(C,[[-.6,base+.13],[-.47,base+1.85],[-.11,base+2.1],
      [.47,base+1.86],[.65,base+.1],[.11,base+.16],[0,base+.38],
      [-.12,base+.12]],.285);
    for (const side of [-1,1]) {
      P.beam(M.navyLight,[[side*.5,base+2.08,.28],
        [side*.17,base+1.68,.35],[side*.07,base+1.54,.36]],.09,.055,[0,0,1]);
      P.box(M.navyLight,side*.43-.18,side*.43+.18,
        base+2.11,base+2.16,.23,.39);
    }
    for(const y of [base+1.3,base+1.5,base+1.7])
      P.col(M.bronzeLight,.15,.365,y,y+.025,.042,.042,8);
    P.box(M.navyLight,-.5,.5,base+.93,base+1.02,.22,.31);
    P.beam(C,[[.52,base+1.99,0],[.42,base+1.2,.27],[.12,base+1.11,.36]],.23,.22);
    P.beam(C,[[-.73,base+1.13,.13],[-.1,base+1.08,.36]],.18,.18);
    P.col(C,0,.48,base+.99,base+1.17,.34,.29,10); // cap in both hands
    P.box(M.navyLight,-.39,.39,base+1.07,base+1.12,.34,.78); // visor
    P.box(M.bronzeLight,-.34,.34,base+1.13,base+1.17,.43,.55);
    P.box(M.bronzeLight,-.36,.36,base+2.07,base+2.16,.26,.3);
    P.beam(C,[[0,base+2.13,.29],[0,base+1.18,.31]],.08,.07);
  } else {
    P.beam(C,[[.52,base+1.99,0],[.72,base+1.52,.1],[.45,base+1.33,.28]],.24,.22);
    P.box(C,-.82,-.57,base+.48,base+1.38,.05,.36); // rolled plans
  }
  P.col(C,0,0,base+2.08,base+2.22,.2,.2,9);
  P.geo(C,ICO,0,base+2.42,.05,0,0,0,.25,.32,.23);
  if (naval) {
    P.geo(M.faceBronze,ICO,0,base+2.42,.267,0,0,0,.175,.235,.035);
    P.cyl(M.faceBronze,[0,base+2.47,.29],[0,base+2.36,.35],.055,.025,6);
    P.box(C,-.26,.26,top-.16,top-.02,-.18,.24); // short hair
    for(const u of [-.105,.105])
      P.box(M.navyLight,u-.032,u+.032,base+2.48,base+2.505,.298,.322);
  } else {
    P.geo(C,ICO,0,base+2.26,.27,0,0,0,.19,.2,.1); // beard
  }
}

function putilov(ctx,M,s) {
  const P = new Parts(), yaw = 1.23;
  P.push(s.x,0,s.z,yaw);
  P.ranged(850, () => {
    P.box(M.stone,-1.55,1.55,.02,.22,-1.28,1.28);
    P.box(M.granite,-1.36,1.36,.22,1.17,-1.02,1.02);
    P.box(M.stone,-1.48,1.48,1.13,1.32,-1.1,1.1);
    P.box(M.bronze,-.69,.7,1.32,1.8,-.55,.58);
    suitedFigure(P,M,1.78);
  });
  P.ranged(310, () => lettering(P,M.letters,'ПУТИЛОВ',.22,0,.65,1.05));
  P.pop();
  ctx.physics.addBox(s.x,s.z,3.1,2.56,yaw,.02,1.32);
  return finish(ctx,P,'avtovo-putilov');
}

function marinesko(ctx,M,s) {
  const P = new Parts(), yaw = .9;
  P.push(s.x,0,s.z,yaw);
  P.ranged(830, () => {
    const low=[[-1.85,-1.28],[-.9,-1.48],[.76,-1.3],[1.8,-.64],
      [1.75,.95],[.76,1.42],[-.98,1.3],[-1.94,.4]];
    const high=[[-1.54,-.85],[-.78,-1.05],[.72,-.96],[1.43,-.46],
      [1.44,.63],[.66,1.05],[-.82,1.0],[-1.56,.29]];
    for(let i=0;i<low.length;i++) {
      const j=(i+1)%low.length;
      P.quad(i%3===0?M.roughStone2:i%3===1?M.roughStone:M.roughStone3,
        [low[i][0],.12,low[i][1]],
        [low[j][0],.12,low[j][1]],[high[j][0],1.37,high[j][1]],
        [high[i][0],1.37,high[i][1]]);
    }
    P.cap(M.roughStone2,high,1.37);
    suitedFigure(P,M,1.39,true);
  });
  P.ranged(300, () => {
    P.box(M.roughStone3,-.73,.73,.34,1.03,1.29,1.315);
    lettering(P,M.ivory,'МАРИНЕСКО',.17,0,.65,1.325);
  });
  P.pop();
  ctx.physics.addBox(s.x,s.z,3.9,3,yaw,.02,1.39);
  return finish(ctx,P,'avtovo-marinesko');
}

function tank(ctx,M,s) {
  const P = new Parts(), yaw = -.7;
  P.push(s.x,0,s.z,yaw);
  P.ranged(1300, () => {
    // The real KV-85 is elevated broadside on a pale rectangular stone plinth.
    P.box(M.stone,-2.65,2.65,.02,.35,-5.48,5.48);
    P.box(M.granite,-2.48,2.48,.35,2.04,-5.28,5.28);
    P.box(M.stone,-2.57,2.57,1.98,2.18,-5.37,5.37);
    for(const u of [-1.33,1.33]) {
      P.box(M.tracks,u-.45,u+.45,2.17,3.08,-3.5,3.5);
      P.box(M.oliveDark,u-.52,u+.52,3.03,3.25,-3.32,3.32);
    }
    P.box(M.olive,-1.17,1.17,2.78,3.38,-3.42,3.42);
    P.box(M.olive,-1.52,1.52,3.19,3.77,-2.7,2.28);
    P.box(M.olive,-1.12,1.12,3.17,3.53,2.29,3.69);
    P.cyl(M.olive,[0,3.75,-.43],[0,4.75,-.43],1.72,1.42,12);
    P.prism(M.oliveDark,0,-.43,1.13,10,4.72,4.96,Math.PI/10);
    P.cyl(M.oliveDark,[0,4.15,.53],[0,4.15,1.16],.56,.56,10);
    P.cyl(M.olive,[0,4.15,1.14],[0,4.15,5.3],.23,.17,10);
    P.cyl(M.iron,[0,4.15,5.26],[0,4.15,5.42],.19,.19,10);
  });
  P.ranged(380, () => {
    for(const u of [-1.84,1.84]) {
      for(let i=0;i<6;i++) {
        const q=-2.65+i*1.05;
        P.cyl(M.wheels,[u-.06,2.64,q],[u+.06,2.64,q],.37,.37,10);
        P.cyl(M.olive,[u-.075,2.64,q],[u+.075,2.64,q],.23,.23,10);
      }
      for(let i=0;i<14;i++) {
        const q=-3.35+i*.51;
        P.box(M.trackLink,u-.46,u+.46,2.13,2.21,q-.035,q+.035);
      }
      P.push(u<0?-1.5:1.5,0,-.35,u<0?-Math.PI/2:Math.PI/2);
      lettering(P,M.ivory,'283',.37,-.24,4.14,.12);
      const star=[];
      for(let i=0;i<10;i++) {
        const a=i*Math.PI/5, r=i%2?.095:.23;
        star.push([.72+Math.sin(a)*r,4.25+Math.cos(a)*r]);
      }
      P.vpoly(M.tramRed,star,.13);
      P.pop();
    }
    P.col(M.oliveDark,.63,-.95,4.93,5.12,.45,.45,10);
    P.cyl(M.iron,[.63,5.1,-.95],[.63,5.27,-.95],.24,.24,10);
    P.box(M.oliveDark,-.43,.43,3.65,3.75,2.76,3.64);
    P.box(M.oliveDark,-1.21,1.21,3.15,3.26,-3.8,-3.37);
    P.box(M.letters,-1.05,1.05,.82,1.22,5.39,5.402);
  });
  P.pop();
  ctx.physics.addBox(s.x,s.z,5.3,10.96,yaw,.02,2.18);
  ctx.physics.addBox(s.x,s.z,3.04,7.4,yaw,2.18,3.77);
  return finish(ctx,P,'avtovo-kv85');
}

function bunker(ctx,M) {
  const x=-5130.5,z=7953.9,yaw=-1.58,P=new Parts();
  P.push(x,0,z,yaw);
  P.ranged(780, () => {
    P.prism(M.concrete,0,0,4.12,10,.02,2.65,Math.PI/10);
    P.prism(M.stone,0,0,4.32,10,2.63,3.1,Math.PI/10);
    P.box(M.concrete,-2.2,2.2,1.04,2.38,3.67,4.05);
    // The low horizontal commemorative slab stands beside the actual DOT.
    P.box(M.stone,6.0,9.0,.02,.22,1.3,2.3);
    P.box(M.concrete,6.2,8.8,.22,1.28,1.67,2.06);
  });
  P.ranged(330, () => {
    // One long recessed embrasure, bright date over weathered dark concrete.
    P.box(M.iron,-1.92,1.92,1.04,1.44,4.055,4.09);
    P.box(M.darkStone,-2.03,2.03,1.0,1.04,4.1,4.14);
    lettering(P,M.ivory,'1941-1945',.36,0,2.0,4.13);
    P.box(M.darkStone,-.55,.55,.25,1.16,-4.14,-4.06);
    P.box(M.letters,6.3,8.7,.62,.94,2.07,2.095);
    for(let i=0;i<3;i++)
      P.box(M.ivory,6.88,8.53,.86-i*.095,.875-i*.095,2.097,2.105);
  });
  P.pop();
  ctx.physics.addBox(x,z,8.4,8.4,yaw,.02,3.12);
  const q=point(x,z,yaw,7.5,1.8);
  ctx.physics.addBox(q[0],q[1],3.0,1.0,yaw,.02,1.28);
  return finish(ctx,P,'avtovo-dot-930');
}

function tram(ctx,M,s) {
  const P=new Parts(),yaw=.80;
  P.push(s.x,0,s.z,yaw);
  P.ranged(1050, () => {
    P.box(M.stone,-3.16,3.16,.02,.2,-6.73,6.73);
    P.box(M.granite,-2.77,2.77,.2,.47,-6.32,6.32);
    for(const u of [-.77,.77]) P.box(M.iron,u-.055,u+.055,.48,.56,-5.78,5.78);
    for(let z=-5.5;z<5.7;z+=.82)
      P.box(M.darkStone,-1.12,1.12,.47,.52,z-.11,z+.11);
    P.box(M.redDark,-1.25,1.25,1.19,1.46,-4.5,4.5);
    P.box(M.tramRed,-1.32,1.32,1.46,2.31,-4.52,4.52);
    P.box(M.cream,-1.32,1.32,2.28,3.36,-4.52,4.52);
    P.box(M.tramBrown,-1.36,1.36,3.29,3.48,-4.57,4.57);
    P.box(M.darkRoof,-1.48,1.48,3.48,3.77,-4.64,4.64);
    P.box(M.cream,-1.28,1.28,2.31,3.31,4.53,4.59);
    P.box(M.cream,-1.28,1.28,2.31,3.31,-4.59,-4.53);
    for(const u of [-1.1,1.1]) for(const z of [-2.7,2.7])
      P.cyl(M.wheels,[u-.09,1.04,z],[u+.09,1.04,z],.49,.49,12);
  });
  P.ranged(360, () => {
    for(const side of [-1,1]) {
      const u=side*1.335;
      for(let i=0;i<7;i++) {
        const z=-3.9+i*1.3;
        if (i===6) {
          P.box(M.tramBrown,u-.055,u+.055,1.48,3.26,z-.57,z+.57);
          P.box(M.cream,u-.064,u+.064,1.5,3.31,z-.61,z-.55);
          P.box(M.cream,u-.064,u+.064,1.5,3.31,z+.55,z+.61);
          P.box(M.glass,u-.069,u+.069,2.48,3.2,z-.48,z-.055);
          P.box(M.glass,u-.069,u+.069,2.48,3.2,z+.055,z+.48);
          P.box(M.cream,u-.075,u+.075,2.42,2.48,z-.52,z+.52);
          P.box(M.iron,u-.2,u+.2,1.24,1.36,z-.55,z+.55);
          P.box(M.iron,u-.09,u+.09,2.0,2.1,z+.38,z+.48);
        } else {
          P.box(M.glass,u-.014,u+.014,2.48,3.22,z-.52,z+.52);
          const a=u+side*.023,b=u+side*.038;
          P.box(M.photo,Math.min(a,b),Math.max(a,b),2.51,2.88,z-.43,z+.43);
        }
        P.box(M.cream,u-.04,u+.04,2.34,3.29,z-.57,z-.52);
        P.box(M.redDark,u-.034,u+.034,1.47,2.3,z-.57,z-.55);
      }
      P.box(M.cream,u-.045,u+.045,2.3,3.35,-4.55,-4.48);
      P.box(M.cream,u-.045,u+.045,2.3,3.35,4.48,4.55);
      P.box(M.tramBrown,u-.05,u+.05,2.29,2.42,-4.48,4.48);
      for(const z of [-2.67,2.67]) {
        P.box(M.redDark,u-.05,u+.05,1.3,1.42,z-.75,z+.75);
        P.box(M.iron,u-.1,u+.1,1.37,1.47,z-.62,z+.62);
      }
    }
    // End windows, route 12, car 2465 and characteristic roof trolley pole.
    for(const side of [-1,1]) {
      const z=side*4.61;
      for(const u of [-.61,.61]) P.box(M.glass,u-.5,u+.5,2.43,3.25,z-.018,z+.018);
      P.box(M.redDark,-.72,.72,1.76,2.13,z-.03,z+.03);
      P.box(M.cream,-.66,.66,3.27,3.58,z-.035,z+.035);
      P.push(0,0,z,side<0?Math.PI:0);
      lettering(P,M.letters,'12',.22,0,3.32,.05);
      lettering(P,M.ivory,'2465',.18,0,1.86,.058);
      P.pop();
    }
    for(const z of [-3.6,3.6]) P.box(M.cream,-1.36,1.36,3.22,3.29,z-.06,z+.06);
    P.beam(M.trolley,[[0,3.77,-1.1],[0,4.13,-.4],[0,5.36,.7]],.11,.09);
    P.beam(M.trolley,[[0,5.36,.7],[0,5.65,1.4]],.065,.055);
    P.box(M.iron,-.52,.52,5.59,5.64,1.3,1.38);
    for(const z of [-4.2,4.2])
      P.box(M.iron,-1.06,1.06,1.02,1.13,z-.12,z+.12);
  });
  P.pop();
  ctx.physics.addBox(s.x,s.z,6.32,13.46,yaw,.02,.47);
  ctx.physics.addBox(s.x,s.z,2.72,9.18,yaw,1.18,3.77);
  return finish(ctx,P,'avtovo-blockade-tram');
}

export function build(ctx) {
  const M={
    ochre:ctx.mat.toon('#c5ab74'), pale:ctx.mat.toon('#e2d5b6'),
    stone:ctx.mat.toon('#a8a39b'), granite:ctx.mat.toon('#8b8986'),
    roughStone:ctx.mat.toon('#565658'), roughStone2:ctx.mat.toon('#67686a'),
    roughStone3:ctx.mat.toon('#4c4e50'), darkStone:ctx.mat.toon('#3d4142'),
    darkRoof:ctx.mat.toon('#383b3c'), iron:ctx.mat.toon('#252a2a'),
    window:ctx.mat.toon('#3d4749'), glass:ctx.mat.toon('#4b514b'),
    letters:ctx.mat.toon('#493c33'), ivory:ctx.mat.toon('#d9d5c6'),
    bronze:ctx.mat.toon('#64554b'), navyBronze:ctx.mat.toon('#4b5656'),
    navyLight:ctx.mat.toon('#687171'), faceBronze:ctx.mat.toon('#777c79'),
    bronzeLight:ctx.mat.toon('#858076'), concrete:ctx.mat.toon('#3d3e3d'),
    olive:ctx.mat.toon('#708358'), oliveDark:ctx.mat.toon('#506044'),
    tracks:ctx.mat.toon('#333832'), trackLink:ctx.mat.toon('#525750'),
    wheels:ctx.mat.toon('#687359'), tramRed:ctx.mat.toon('#864033'),
    redDark:ctx.mat.toon('#5e2926'), cream:ctx.mat.toon('#d2bc96'),
    tramBrown:ctx.mat.toon('#7a6248'), photo:ctx.mat.toon('#aaa292'),
    trolley:ctx.mat.toon('#767b75'),
  };
  const [put,mar,tan,trm]=SITES.map(site);
  const triangles=factoryGate(ctx,M)+putilov(ctx,M,put)+marinesko(ctx,M,mar)
    +tank(ctx,M,tan)+bunker(ctx,M)+tram(ctx,M,trm);
  const monuments=[
    {id:'w128500581',name:'Центральная проходная Кировского завода',x:-5215.5,z:5889.5},
    put,mar,tan,{id:'w119225860',name:'ДОТ № 930 «Кировский вал»',x:-5130.5,z:7953.9},trm,
  ];
  const common=(ctx.services.landmarks ||= {});
  common.monuments=(common.monuments||[]).concat(monuments);
  ctx.services.landmarksAvtovoSites={monuments,triangles};
}
