import * as THREE from 'three';
import { VB } from '../../traffic/vb.js';
import { riderSeat } from './rider.js';

export const SLED = { name: 'snowmobile', W: 1.24, len: 3.32, front: 1.76, rear: -1.56, centerZ: .10,
  hgt: .95, wb: 1.8, R: .2, mass: 315, durability: 4, eye: { x: 0, y: 1.47, z: -.28 }, fovRest: 74, exhaust: [] };

export function createSnowmobile(ctx) {
  const root = new THREE.Group(), v = new VB(), rubber = '#242831', steel = '#82929b', accent = '#bf5633';
  root.name = 'drive-snowmobile'; root.rotation.order = 'YXZ';
  // Belt and bogie wheels sit below the aluminium tunnel. Two steerable skis carry the nose.
  v.rbox(.48,.43,1.96,.19,rubber,[0,.23,-.55]);
  for (let z=-1.38; z<.32; z+=.14) v.box(.52,.045,.045,'#40434a',[0,.041,z]);
  for (const sign of [-1,1]) {
    for (const z of [-1.27,-.82,-.39,.20]) {
      v.cyl(.144,.144,.055,steel,[sign*.235,.23,z],[0,0,Math.PI/2],12);
      v.cyl(.074,.074,.061,rubber,[sign*.238,.23,z],[0,0,Math.PI/2],10);
    }
    v.box(.18,.055,1.14,steel,[sign*.32,.39,-.36]);
    v.rod([sign*.22,.47,.74],[sign*.50,.18,.91],.042,accent,8);
    v.rod([sign*.18,.38,.47],[sign*.50,.18,.91],.033,steel,8);
    v.rod([sign*.31,.65,.68],[sign*.49,.18,.91],.048,rubber,8);
  }
  v.rbox(.62,.23,2.24,.095,steel,[0,.46,-.40]);
  v.rbox(.41,.24,1.33,.105,rubber,[0,.69,-.40]);
  v.rbox(.44,.28,.11,.05,rubber,[0,.87,-1.03],[-.13,0,0]);
  v.sph(.55,accent,[0,.65,.69],10,[.84,.67,1.38],[-.14,0,0]);
  v.sph(.41,'#37414d',[0,.84,.55],10,[.94,.62,1.35],[-.2,0,0]);
  for(const sign of [-1,1]) v.box(.20,.075,.055,'#e8f5ff',[sign*.205,.90,.97],[-.39,sign*.27,0]);
  v.rod([0,.73,.35],[0,1.08,.18],.04,steel,8);
  v.rod([-.29,1.035,.13],[0,1.08,.18],.024,rubber,8);
  v.rod([0,1.08,.18],[.29,1.035,.13],.024,rubber,8);
  const material = ctx.mat.toon('#ffffff',{vertexColors:true,paint:.02});
  const body = new THREE.Mesh(v.build(),material); body.castShadow = true; root.add(body);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(.61,.46,.022),ctx.mat.toon('#b3d6e4',{transparent:true,opacity:.45,depthWrite:false}));
  glass.position.set(0,1.18,.49); glass.rotation.x=-.43; root.add(glass);
  const ski = new VB();
  ski.rbox(.16,.064,1.20,.028,rubber,[0,.062,.09]);
  ski.rbox(.15,.055,.33,.025,rubber,[0,.125,.77],[-.43,0,0]);
  ski.rod([0,.13,.47],[0,.21,.85],.019,accent,6);
  const skiGeo=ski.build(), skis=[-1,1].map(sign=>{
    const m=new THREE.Mesh(skiGeo,material);m.position.set(sign*.50,0,.83);root.add(m);return m;
  });
  return { root, body, glass, wheels: [], flames: [], boat:true, spec:SLED,
    poseDriver:riderSeat(root,[0,.87,-.25],[0,1.04,.13,.28],[0,.42,.04,.29]),
    set(p){root.position.set(p.x,p.y,p.z);root.rotation.set(-p.pitch,p.yaw,p.roll);
      for(const ski of skis) ski.rotation.y=p.steerAngle||0;},
    setView(){} };
}
