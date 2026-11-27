import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';
import { Parts } from '../landmarksD/kit.js';
import { sculptureGeometry } from './sculpture-geometry.js';
import { JOINERY } from './metro-pavilion-joinery.js';

const PALETTES = {
  aluminium: { frame:'#b8c0c0', glass:'#566d74', hardware:'#d7d7cf', kick:'#8f9c9c' },
  wrought: { frame:'#544936', glass:'#596c6f', hardware:'#c7a568', kick:'#968052' },
  bronze: { frame:'#675c4e', glass:'#4c6166', hardware:'#bfac80', kick:'#867c68' },
  oak: { frame:'#825331', glass:'#637676', hardware:'#c19b54', kick:'#927740' },
  walnut: { frame:'#704635', glass:'#586b71', hardware:'#b6a57e', kick:'#827565' },
};

export function entrancePoint(d, u, v) {
  return { x:d.x + Math.cos(d.rotY)*u + Math.sin(d.rotY)*v,
    z:d.z - Math.sin(d.rotY)*u + Math.cos(d.rotY)*v };
}

// One vertex-coloured draw for the leaves, fittings, stone threshold and small public lobby.
// The two middle leaves are held open. Their colliders follow their actual hinge angles.
export function addPavilionEntrance(ctx, d) {
  const { w, h = 2.35, y = .10, leaves = 2, style = 'aluminium', lobby = true, approach = 4 } = d;
  const wood = style === 'oak' || style === 'walnut';
  const colors = { ...PALETTES[style], bead:'#2c3635', mould:PALETTES[style].frame, panel:PALETTES[style].frame,
    ring:'#b49b61', stripe:'#e6be45', sill:'#98928c', groove:'#534f4b', wall:wood?'#cdb89a':'#ccc2b0', skirting:'#6c6863', floor:'#88837d', lamp:'#efe5bf' };
  const P = new Parts(), hw = w/2, pitch = (w-.14)/leaves;
  function solid(u, v, width, depth, ry, bottom, top) {
    const p = entrancePoint(d,u,v);
    const item = ctx.physics.addBox(p.x, p.z, width, depth, d.rotY + ry, bottom, top);
    if (item) item.metroPavilionDoor = true;
  }
  P.push(0,y,0);
  for (const side of [-1,1]) P.box('frame', side*hw-.047,side*hw+.047,0,h+.08,-.11,.075);
  P.box('frame',-hw,hw,h,h+.085,-.11,.075);
  for (const part of ['sill','groove']) P.geo(part,sculptureGeometry(JOINERY[part]),0,.008,0,0,0,0,w,1,1);
  for (let i=0; i<leaves; i++) {
    const side = i < leaves/2 ? 1 : -1;
    const hinged = i === leaves/2-1 || i === leaves/2;
    const hinge = -hw+.07+(side === 1 ? i : i+1)*pitch;
    // Negative local depth keeps the street apron and steps free.
    const yaw = hinged ? side*1.46 : 0;
    P.push(hinge,0,0,yaw);
    for (const [part,packed] of Object.entries(JOINERY)) {
      if (part === 'sill' || part === 'groove' || (part === 'ring' && style !== 'wrought') || (part === 'stripe' && !d.stripes) || ((part === 'panel'||part === 'mould') && !wood)) continue;
      // A right-hand leaf uses a half turn, keeping front-facing triangle winding.
      P.geo(part,sculptureGeometry(packed),0,.025,0,0,side < 0 ? Math.PI : 0,0,pitch-.015,(h-.05)/2.3,1);
    }
    P.pop();
    solid(hinge + side*Math.cos(yaw)*pitch/2,-side*Math.sin(yaw)*pitch/2,pitch-.015,.095,yaw,y,y+h);
  }
  if (lobby) {
    const depth = d.depth || 2.75;
    P.box('floor',-hw-.25,hw+.25,-.14,0,-depth,.12);
    P.box('wall',-hw-.25,hw+.25,0,h+.21,-depth-.12,-depth);
    P.box('skirting',-hw-.25,hw+.25,0,.19,-depth,-depth+.03);
    P.box('wall',-hw-.25,-hw,0,h+.21,-depth,.03);
    P.box('wall',hw,hw+.25,0,h+.21,-depth,.03);
    P.box('wall',-hw-.25,hw+.25,h+.16,h+.24,-depth,.03);
    P.box('lamp',-.48,.48,h-.22,h-.10,-depth+.018,-depth+.085);
    solid(0,-depth-.06,w+.50,.12,0,y,y+h+.24);
    for (const side of [-1,1]) solid(side*(hw+.125),-depth/2,.25,depth,0,y,y+h+.24);
    const p = entrancePoint(d,0,-depth/2+.06);
    ctx.physics.addWalkBox(p.x,p.z,w+.5,depth+.12,d.rotY,y,y-.18);
  }
  P.pop();
  // Keep the transparent glass in a single draw. Its own pass leaves the metal
  // fittings crisp and the warm light behind closed leaves visible at night.
  function geometry(parts) {
    const positions=[], normals=[], tints=[], indices=[];
    for (const [part,bucket] of parts) {
      const offset=positions.length/3, ink=new THREE.Color(colors[part]);
      for (let i=0;i<bucket.n;i++) tints.push(ink.r,ink.g,ink.b);
      positions.push(...bucket.pos); normals.push(...bucket.nrm);
      for (const idx of bucket.idx) indices.push(offset+idx);
    }
    const g=new THREE.BufferGeometry();
    for(const [name,data] of [['position',positions],['normal',normals],['color',tints]])
      g.setAttribute(name,new THREE.Float32BufferAttribute(data,3));
    g.setIndex(indices);g.computeBoundingSphere();
    return g;
  }
  const glass=P.b.get('glass'),lamp=P.b.get('lamp');
  P.b.delete('glass');P.b.delete('lamp');
  const mesh=new THREE.Mesh(geometry(P.b),ctx.mat.toon('#ffffff',{vertexColors:true,name:'metro-pavilion-door-joinery'}));
  mesh.name='metro-door-'+d.id;
  mesh.userData.metroPavilionDoor=true;
  mesh.position.set(d.x,0,d.z);mesh.rotation.y=d.rotY;mesh.receiveShadow=true;mesh.castShadow=true;
  const glazing=new THREE.Mesh(geometry([['glass',glass]]),ctx.mat.toon('#d0e2e5',{transparent:true,opacity:.42,depthWrite:false,paint:0,name:'metro-pavilion-glazing'}));
  glazing.name=mesh.name+'-glass';
  mesh.add(glazing);ctx.noOutline?.(glazing);
  if(lamp){
    const light=new THREE.Mesh(geometry([['lamp',lamp]]),ctx.mat.toon('#ffdf9a',{emissive:'#ffba65',emissiveIntensity:.92,paint:0,name:'metro-foyer-light'}));
    light.name=mesh.name+'-light';mesh.add(light);ctx.noOutline?.(light);
  }
  ctx.addStatic(mesh);mesh.updateWorldMatrix(true,true);
  registerLOD(mesh,155);
  for(const child of mesh.children)registerLOD(child,child===glazing?155:85);
  (ctx.services.metroPavilionDoors ||= []).push({...d, y, h, approach, lobby});
}
