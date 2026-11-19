import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { kartTyres } from './handling.js';
import { sr5Body, sr5Steering } from './sr5-body.js';
import { blendPose, leanTorso, placeHips, solveLimb } from '../character/pose.js';
import { createKartRoughness } from './surfaces.js';

const SPEC = {
  W: 1.332, len: 1.914, hgt: .67, R: .137, tw: .16, track: 1.0, wb: 1.07,
  front: .968, rear: -.946, centerZ: .011, mass: 225,
  eye: { x: 0, y: .91, z: -.24 }, fovRest: 76,
};

// Different launch, top-end and front grip within each ten-kart fleet.
const VARIATION = [
  [-.10, .08, -.05], [.05, -.07, .09], [-.05, .02, .04], [.07, -.06, -.07],
  [-.02, .06, .02], [.03, -.02, -.02], [-.07, .07, .07], [.09, -.04, -.03],
  [.02, -.03, .06], [-.04, .01, -.08],
];

const workshops = new WeakMap();
const driverBacks = new WeakMap();

/** Portable vehicle definition. Its identity determines its model and tuning;
 * parking and the optional authored surface belong to the destination world. */
export function createKart(ctx, id, parked, course = {}) {
  const match = /^narvskaya-(rental|club)-(10|[1-9])$/.exec(id);
  if (!match) return null;
  const side = match[1] === 'club' ? 1 : 0, num = Number(match[2]);
  const [launch, top, steering] = VARIATION[num - 1];
  const label = side ? 'Клубный карт' : 'Прокатный карт';
  const labelEn = side ? 'Club kart' : 'Rental kart';
  const vmax = (side ? 24.45 : 21.02) + top*.72;
  return {
    id, kind: 'kart', spec: SPEC, parked: { ...parked },
    tuning: {
      spec: SPEC, noBoost: true, hf: .95, hr: .92, hw: .65,
      acc: (side ? 3.55 : 3.12) * (1 + launch), vmax, engineFalloff: 1.7 + top*3,
      drag: .00039, brake: 4.45, revAcc: 2.6, vrev: 2.2, engBrake: .53,
      physicalReverseSteer: true, steerIn: 8.6*(1+steering), steerOut: 24, steerLock: .49*(1+steering),
      tyres: kartTyres, kerbAt: course.kerbAt,
      roughnessAt: course.roughnessAt ?? createKartRoughness(ctx),
      frontMu: 1.32 + 1.17*steering*.60, rearMu: 1.38,
      rollK: .0023, pitchK: .0041, impactDecay: 10,
      gearTop: [vmax], maxGear: 1, handDecel: 3.6, handYawMax: 1.65, smokeZ: -.55, smokeY: .17,
    },
    label: label + ' №' + num, labelEn: labelEn + ' #' + num,
    toast: label + ' №' + num + ' · Sodi SR5', reach: 1.55, far: 145,
    boarding: { x: 1.02, y: .5, z: -.15 },
    chase: { near: 3.3, far: 6.4, height: 1.68, lookAhead: 3, lookY: .46 },
    exhaust: [], hud: { noBoost: true, noCondition: true, keys: 'WASD · Пилотирование &nbsp; V · Камера &nbsp; E · Выйти' },
    sound: { types: ['sawtooth', 'triangle', 'triangle'], f0: 21, fk: 62, lpBase: 165, lpRpm: 740, blip: false, volume: .82 },
    makeModel: () => {
      if (!workshops.has(ctx)) workshops.set(ctx, buildGeometry());
      return createModel(ctx, workshops.get(ctx), side, num);
    },
  };
}

function buildGeometry() {
  const panels = Object.fromEntries(Object.entries(sr5Body).map(([name, { vertices, triangles }]) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(triangles);
    geometry.computeVertexNormals();
    return [name, geometry];
  }));
  const merge = parts => {
    const unindexed = parts.map(p => p.index ? p.toNonIndexed() : p);
    const g = mergeGeometries(unindexed);
    for (const p of new Set([...parts, ...unindexed])) p.dispose();
    return g;
  };

  const wheel = new THREE.CylinderGeometry(.137,.137,.181,14).rotateZ(Math.PI/2);
  const hub = new THREE.CylinderGeometry(.073,.073,.187,11).rotateZ(Math.PI/2);
  const steering = new THREE.BufferGeometry();
  steering.setAttribute('position', new THREE.Float32BufferAttribute(sr5Steering.vertices, 3));
  steering.setIndex(sr5Steering.triangles);
  steering.computeVertexNormals();
  return { ...panels, wheel, hub, steering };

}

function createModel(ctx, geometry, club, number) {
  const root = new THREE.Group();
  root.name = (club ? 'club-sr5-' : 'rental-sr5-') + number;
  root.rotation.order = 'YXZ';
  const rubber = ctx.mat.toon('#252932'), alloy = ctx.mat.toon('#8e96a2');
  const color = club ? ['#255db2','#2d65ba','#2e56ab'][number % 3] : ['#b73030','#c63932','#ba3a37'][number % 3];
  const add = (kind, material, parent = root) => {
    const object = new THREE.Mesh(geometry[kind], material);
    object.name = kind;
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  add('bumper', rubber);
  add('chassis', ctx.mat.toon('#21242a'));
  add('painted', ctx.mat.toon(color));
  add('trim', ctx.mat.toon('#d9dfe6'));
  add('metal', alloy);
  const steering = add('steering', rubber);
  steering.position.fromArray(sr5Steering.position);
  steering.quaternion.fromArray(sr5Steering.quaternion);
  steering.scale.fromArray(sr5Steering.scale);
  const wheelRest = steering.quaternion.clone(), wheelTurn = new THREE.Quaternion();
  const wheelAxis = new THREE.Vector3(0, 0, 1);
  const driverFrame = new THREE.Group();
  driverFrame.rotation.y = Math.PI;
  root.add(driverFrame);
  const driverSeat = new THREE.Vector3(0, .30, .22);
  const contact = new THREE.Vector3(), bend = new THREE.Vector3();
  const numberPanel = new THREE.Group();
  numberPanel.position.set(0, .553, .275);
  numberPanel.rotation.x = Math.atan(.49);
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(.125, .086), ctx.mat.toon('#e9e6d9'));
  badge.rotation.x = -Math.PI / 2;
  numberPanel.add(badge);
  const digits = new THREE.Group();
  digits.position.y = .002;
  addNumber(digits, number, rubber);
  numberPanel.add(digits);
  root.add(numberPanel);

  const wheels = [];
  for (const side of [-1, 1]) for (const front of [false, true]) {
    const pivot = new THREE.Group(), spin = new THREE.Group();
    const radius = front ? .131 : .1455;
    pivot.position.set((front ? .495 : .500) * side, radius, front ? .535 : -.535);
    spin.scale.set(front ? .77 : 1.07, radius / .137, radius / .137);
    pivot.add(spin); root.add(pivot);
    add('wheel', rubber, spin); add('hub', alloy, spin);
    wheels.push({ pivot, spin, front });
  }
  return {
    root, wheels, spec: SPEC,
    setView() {},
    poseDriver(actor) {
      blendPose(actor, 1);
      if (!driverBacks.has(actor.rig)) {
        let spine = actor.rig.chest;
        while (spine.parent?.isBone && spine.parent !== actor.rig.hips) spine = spine.parent;
        const grips = {};
        for (const side of ['l', 'r']) {
          const hand = actor.rig.arms[side].end;
          const finger = hand.children.find(b => /fingermiddle/i.test(b.name)) ?? hand.children.find(b => b.isBone);
          grips[side] = finger.position.clone().multiplyScalar(.9);
        }
        driverBacks.set(actor.rig, { root: actor.root, chest: spine, grips });
      }
      leanTorso(driverBacks.get(actor.rig), -.08);
      driverFrame.updateWorldMatrix(true, false);
      driverFrame.getWorldQuaternion(actor.root.quaternion);
      placeHips(actor.rig, driverFrame.localToWorld(contact.copy(driverSeat)));
      for (const [side, sign] of [['l', -1], ['r', 1]]) {
        steering.updateWorldMatrix(true, false);
        steering.localToWorld(contact.set(-sign * .100, -.078, 0));
        bend.set(sign, -.5, -.1).transformDirection(driverFrame.matrixWorld);
        holdWheel(actor.rig.arms[side], contact, bend, driverBacks.get(actor.rig).grips[side]);
        driverFrame.localToWorld(contact.set(sign * .105, .145 + (actor.rig.soleOffsets?.[side] ?? .04), -.60));
        bend.set(0, 1, -.3).transformDirection(driverFrame.matrixWorld);
        solveLimb(actor.rig.legs[side], contact, bend);
      }
    },
    set({x, y, z, yaw, pitch, roll, steerAngle, spin, driven}) {
      root.position.set(x,y,z); root.rotation.set(-pitch,yaw,roll);
      steering.quaternion.copy(wheelRest).multiply(wheelTurn.setFromAxisAngle(wheelAxis, -steerAngle * 2.7));
      for (const w of wheels) {
        w.pivot.rotation.y = w.front ? steerAngle : 0;
        if (driven) w.spin.rotation.x += spin;
      }
    },
  };
}

// The palm grips the rim; putting the wrist itself on the rim overextends the
// short stylised arms and forces the driver to lean forward off the backrest.
function holdWheel(limb, target, pole, palm) {
  const wrist = limb.end.getWorldPosition(new THREE.Vector3());
  const reach = limb.end.localToWorld(palm.clone()).distanceTo(wrist);
  const direction = target.clone().sub(limb.upper.getWorldPosition(new THREE.Vector3())).normalize();
  solveLimb(limb, target.clone().addScaledVector(direction, -reach), pole);
  limb.end.getWorldPosition(wrist);
  const current = limb.end.localToWorld(palm.clone()).sub(wrist).normalize();
  const desired = target.clone().sub(wrist).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(current, desired).multiply(limb.end.getWorldQuaternion(new THREE.Quaternion()));
  limb.end.quaternion.copy(limb.end.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));
  limb.end.updateWorldMatrix(false, true);
}

const SEGMENT_ON = ['abcedf','bc','abged','abgcd','fgbc','afgcd','afgecd','abc','abcdefg','abfgcd'];
const SEGMENT = { a:[0,-1,.03,.007], b:[1,-.5,.007,.027], c:[1,.5,.007,.027],
  d:[0,1,.03,.007], e:[-1,.5,.007,.027], f:[-1,-.5,.007,.027], g:[0,0,.03,.007] };
function addNumber(root, number, material) {
  const chars = String(number);
  const geometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI/2);
  const segments = new THREE.InstancedMesh(geometry, material, [...chars].reduce((n,d) => n + SEGMENT_ON[d].length, 0));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  const p = new THREE.Vector3(), s = new THREE.Vector3();
  let count = 0;
  for (let i = 0; i < chars.length; i++) for (const id of SEGMENT_ON[chars[i]]) {
    const [x,z,w,l] = SEGMENT[id];
    segments.setMatrixAt(count++, m.compose(p.set((i - (chars.length-1)/2)*.052+x*.018,0,z*.036),q,s.set(w,1,l)));
  }
  root.add(segments);
}
