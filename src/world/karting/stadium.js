import * as THREE from 'three';
import { MeshBuilder, addPrism, addCap, addPolyColliders } from '../lib/massing.js';
import { mesh, paintStrip, siteFence } from './course.js';
import { SHELTER_ID, STADIUM_GROUP } from './site.js';

const FLAT = () => 0;
const FIELD = [-4586.9, 3514.6];
const AXIS = [.386, .922];
const CROSS = [AXIS[1], -AXIS[0]];
const onField = (across, along) => [FIELD[0] + across * CROSS[0] + along * AXIS[0], FIELD[1] + across * CROSS[1] + along * AXIS[1]];

export function buildStadium(ctx, root) {
  const concrete = ctx.mat.toon('#a7a39b'), blue = ctx.mat.toon('#2b4d8d');
  const plaster = ctx.mat.toon('#d6cab2'), roof = ctx.mat.toon('#737d89'), dark = ctx.mat.toon('#363b44');
  const walls = new MeshBuilder(), slabs = new MeshBuilder(), turf = new MeshBuilder(), running = new MeshBuilder(), lines = new MeshBuilder();
  const records = ctx.L.groupMembers(STADIUM_GROUP.key);
  const polyOf = id => records.find(record => record.id === id)?.polys[0];
  const wing = polyOf('w1344693627'), main = polyOf('w222938662'), head = polyOf('w1344693628');
  if (wing) {
    addPrism(walls, slabs, wing, 0, 3.9);
    addPolyColliders(ctx, wing, 0, 3.9, .25);
  }
  if (main) {
    addPrism(walls, slabs, main, 3.5, 10.1);
    addPolyColliders(ctx, main, 3.5, 10.1, .25);
    const at = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t];
    const p = Array.from({length:4}, (_,i) => main.o.slice(i*2, i*2+2));
    // The route crosses the long sides close to the stadium end of the hall.
    const bay = { o: [p[0], at(p[0], p[1], .73), at(p[3], p[2], .73), p[3]].flat(), h: [] };
    addPrism(walls, slabs, bay, 0, 3.49);
    addPolyColliders(ctx, bay, 0, 3.49, .25);
  }
  if (head) {
    addPrism(walls, slabs, head, 3.55, 10.1);
    addPolyColliders(ctx, head, 3.55, 10.1, .25);
  }

  const box = new THREE.BoxGeometry(1, 1, 1);
  function block(x, y, z, w, h, d, yaw, mat) {
    const m = new THREE.Mesh(box, mat);
    m.position.set(x, y, z);
    m.rotation.y = yaw;
    m.scale.set(w, h, d);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
  }
  const shelter = polyOf(SHELTER_ID);
  if (shelter) {
    const corners = Array.from({ length: shelter.o.length / 2 }, (_, i) => shelter.o.slice(i * 2, i * 2 + 2));
    const [a, ...open] = corners, b = open.pop();
    addPrism(walls, slabs, shelter, 3.06, 3.3, { floorCap: true });
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2, span = Math.hypot(dx, dz), yaw = Math.atan2(-dz, dx);
    block(x, 1.53, z, span, 3.06, .20, yaw, ctx.mat.toon('#718076'));
    ctx.physics.addBox(x, z, span, .20, yaw, 0, 3.06);
    for (const [px, pz] of open) {
      block(px, 1.53, pz, .18, 3.06, .18, yaw, dark);
      ctx.physics.addBox(px, pz, .18, .18, yaw, 0, 3.06);
    }
  }
  const pitchYaw = Math.atan2(...AXIS);
  for (const side of [-1, 1]) {
    // Six blue tiers on the two straights, with four concrete aisles.
    for (let row = 0; row < 6; row++) {
      const across = side * ((side === -1 ? 49 : 52) + row * .92);
      for (let section = 0; section < 5; section++) {
        const along = -36 + section * 18;
        const [x,z] = onField(across, along);
        const y = .3 + row * .56;
        block(x, y, z, .93, 2 * y, 17.1, pitchYaw, concrete);
        block(x, 2 * y + .09, z, .69, .18, 16.55, pitchYaw, blue);
      }
    }
    const [x, z] = onField(side * (side === -1 ? 51.1 : 54.1), 0);
    ctx.physics.addBox(x, z, 6, 89, pitchYaw, 0, 4.6);
  }
  mesh(root, walls, plaster, 'kirovets-historic-building');
  mesh(root, slabs, roof, 'kirovets-roofs');

  // Oval is generated in the surveyed pitch frame. Use a common radius at
  // each straight-to-curve transition so all painted lanes join cleanly.
  const oval = (r) => {
    const p = [];
    for (const end of [1, -1]) for (let i = 0; i <= 24; i++) {
      const a = i * Math.PI / 24;
      p.push(onField(end * r * Math.cos(a), end * (42 + r * Math.sin(a))));
    }
    return p;
  };
  const flat = ring => ring.flat();
  addCap(turf, { o: flat(oval(36)), h: [] }, () => .049);
  addCap(running, { o: flat(oval(41.1)), h: [flat(oval(36))] }, () => .046);
  for (const r of [36.12, 37.28, 38.44, 39.6, 40.76]) {
    const loop = oval(r);
    loop.forEach((p, i) => paintStrip(lines, p, loop[(i+1) % loop.length], .07, .056, FLAT));
  }

  const fieldLine = (a, b, c, d) => paintStrip(lines, onField(a, b), onField(c, d), .105, .059, FLAT);
  const fieldRect = (a, b, c, d) => {
    fieldLine(a,b,c,b); fieldLine(c,b,c,d); fieldLine(c,d,a,d); fieldLine(a,d,a,b);
  };
  fieldRect(-32, -51.5, 32, 51.5);
  fieldLine(-32, 0, 32, 0);
  for (let i = 0; i < 40; i++) {
    const a = i*Math.PI/20, b = (i+1)*Math.PI/20;
    fieldLine(9.15*Math.cos(a),9.15*Math.sin(a),9.15*Math.cos(b),9.15*Math.sin(b));
  }
  for (const side of [-1, 1]) {
    fieldRect(-20.16, side*51.5, 20.16, side*35);
    fieldRect(-9.16, side*51.5, 9.16, side*46);
    const [gx, gz] = onField(0, side * 51.7);
    for (const x of [-3.66, 3.66]) block(gx + x*CROSS[0], 1.22, gz + x*CROSS[1], .11, 2.44, .11, pitchYaw, plaster);
    block(gx, 2.44, gz, 7.42, .11, .11, pitchYaw, plaster);
  }
  mesh(root, turf, ctx.mat.toon('#4f744d'), 'kirovets-football-field');
  mesh(root, running, ctx.mat.toon('#805250'), 'kirovets-running-oval');
  mesh(root, lines, ctx.mat.toon('#dddacb'), 'kirovets-sport-marking');

  // Gatehouse, open approach arch and the pit awning visible from the stands.
  const arch = [-4586.3, 3389], angle = -.66;
  const run = (across, along) => [arch[0] + across * Math.cos(angle) + along * Math.sin(angle),
    arch[1] - across * Math.sin(angle) + along * Math.cos(angle)];
  for (const s of [-1, 1]) {
    const [x,z] = run(s*2.35, 0);
    block(x, 1.65, z, .48, 3.3, .78, angle, plaster);
    ctx.physics.addBox(x, z, .48, .78, angle, 0, 3.3);
  }
  block(arch[0], 3.55, arch[1], 5.25, .65, .85, angle, plaster);
  if (typeof document !== 'undefined') {
    const signMat = ctx.mat.decal('#fff', { map: ctx.tex.sign({ text: 'ПИТ-СТОП НАРВСКАЯ', bg: '#263d64', fg: '#f3ece0', w: 512, h: 64, font: 'sans' }) });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, .44), signMat);
    const [x, z] = run(0, -.434);
    sign.position.set(x, 3.55, z);
    sign.rotation.y = angle + Math.PI;
    root.add(sign);
  }
  const [boothX, boothZ] = run(-4.6, 1);
  block(boothX, 1.3, boothZ, 3.2, 2.6, 3.3, angle, plaster);
  block(boothX, 2.67, boothZ, 3.5, .18, 3.6, angle, roof);
  const [winX, winZ] = run(-2.98, 1);
  block(winX, 1.54, winZ, .08, .88, 1.7, angle, dark);
  ctx.physics.addBox(boothX, boothZ, 3.2, 3.3, angle, 0, 2.6);

  const canopy = [-4674.2, 3568.8], pitYaw = .36;
  block(canopy[0], 2.78, canopy[1], 3.7, .24, 17.6, pitYaw, blue);
  for (const s of [-1, 1]) for (const d of [-8.5, 0, 8.5]) {
    const x = canopy[0] + .36*d + s*1.75*.94, z = canopy[1] + .94*d - s*1.75*.36;
    block(x, 1.3, z, .10, 2.6, .10, pitYaw, dark);
  }
  siteFence(ctx, [[-4741,3495],[-4761,3511],[-4778,3549],[-4771,3591],[-4748,3672],[-4720,3679],[-4695,3669],[-4679,3685],[-4660,3690],[-4622,3674],[-4600,3661],[-4598,3647],[-4614,3631],[-4642,3624],[-4661,3629],[-4670,3620]]);
  siteFence(ctx, [[-4690,3540],[-4681.5,3558]]);
  siteFence(ctx, [[-4655,3589],[-4652,3602],[-4648,3614]]);
  addTrees(ctx, root);
}

function addTrees(ctx, root) {
  const net = ctx.services.streets?.net;
  const skipSet = new Set(net?.ways.filter(w => w.skipDraw || w.pedestrianOnly));
  const places = [
    [-4712.7,3490.6],[-4706.8,3496.5],[-4709.9,3507],[-4701.7,3506.1],
    [-4699.2,3514.7],[-4690.9,3525.8],[-4696.6,3534.1],[-4689.7,3537.1],
    [-4706.2,3486.1],[-4736,3503.5],[-4737,3488],
    [-4729,3483],[-4756,3494],[-4763.7,3501.3],[-4771,3516],[-4611,3682],[-4620,3684],
    [-4632,3687],[-4650,3693],[-4669,3693],[-4683,3684],
  ].filter(([x, z]) => !ctx.L.insideBuilding(x, z, 3.5) && (!net || net.cover(x, z, { skipSet }) < -2.25));
  const rng = ctx.rng('narvskaya-track-trees'), matrix = new THREE.Matrix4(), q = new THREE.Quaternion();
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.095,.17,1,7), ctx.mat.toon('#676051'), places.length);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), ctx.mat.toon('#5e7752'), places.length * 3);
  const p = new THREE.Vector3(), scale = new THREE.Vector3();
  const tint = new THREE.Color();
  places.forEach(([x,z],i) => {
    const h = rng.range(4.2,7.1), y = ctx.L.heightAt(x,z);
    trunks.setMatrixAt(i,matrix.compose(p.set(x,y+h*.3,z),q,scale.set(1,h*.6,1)));
    ctx.physics.addCylinder(x,z,.18,y,y+h*.56);
    for (let k = 0; k < 3; k++) {
      const w = rng.range(1.25,2.65);
      p.set(x+rng.range(-.85,.85), y+h*(.68+k*.115), z+rng.range(-.85,.85));
      crowns.setMatrixAt(i*3+k,matrix.compose(p,q,scale.set(w,w*.86,w)));
      const s = rng.range(.74,1);
      crowns.setColorAt(i*3+k,tint.setRGB(s,s,s));
    }
  });
  trunks.castShadow = crowns.castShadow = true;
  trunks.receiveShadow = crowns.receiveShadow = true;
  root.add(trunks,crowns);
}
