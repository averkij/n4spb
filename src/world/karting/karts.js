import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { kartTyres } from './handling.js';

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

export function loadKarts(ctx) {
  const workshop = buildGeometry();
  return ['rental', 'club'].flatMap((fleet, side) => VARIATION.map(([launch, top, steering], index) => {
    const num = index + 1, label = side ? 'Клубный карт' : 'Прокатный карт';
    const labelEn = side ? 'Club kart' : 'Rental kart';
    const stagger = num % 2 ? 0 : .18;
    const x = -4674.9 + index*.64 + side*3.55 + stagger, z = 3559.5 + index*1.62 - side*1.28;
    const vmax = (side ? 24.46 : 21.46) + top*.72;
    return {
      id: 'narvskaya-' + fleet + '-' + num, kind: 'kart', spec: SPEC,
      parked: { x, z, yaw: .362 + (side ? Math.PI/2 : -Math.PI/2) },
      tuning: {
        spec: SPEC, noBoost: true, hf: .95, hr: .92, hw: .65,
        acc: (side ? 4.7 : 4.25) * (1 + launch), vmax, engineFalloff: 1.7 + top*3,
        drag: .00039, brake: 4.8, revAcc: 2.6, vrev: 2.2, engBrake: .53,
        steerIn: 8.6*(1+steering), steerOut: 13, steerLock: .49*(1+steering),
        tyres: kartTyres, frontMu: 1.17*(1+steering*.60), rearMu: 1.30,
        rollK: .0023, pitchK: .0041, impactDecay: 10,
        gearTop: [vmax], maxGear: 1, handDecel: 3.6, handYawMax: 1.65, smokeZ: -.55, smokeY: .17,
      },
      label: label + ' №' + num, labelEn: labelEn + ' #' + num,
      toast: label + ' №' + num + ' · Sodi SR5', reach: 1.55, far: 145,
      boarding: { x: 1.02, y: .5, z: -.15 },
      chase: { near: 3.3, far: 6.4, height: 1.68, lookAhead: 3, lookY: .46 },
      exhaust: [], hud: { noBoost: true, noCondition: true, keys: 'WASD · Пилотирование &nbsp; V · Камера &nbsp; E · Выйти' },
      sound: { types: ['sawtooth', 'triangle', 'triangle'], f0: 21, fk: 62, lpBase: 165, lpRpm: 740, blip: false, volume: .82 },
      makeModel: () => createModel(ctx, workshop, side, num),
    };
  }));
}

const box = (x, y, z, w, h, d, tilt = 0) => new THREE.BoxGeometry(w, h, d).rotateX(tilt).translate(x,y,z);
const round = (x, y, z, w, h, d) => new THREE.SphereGeometry(1, 10, 6).scale(w,h,d).translate(x,y,z);

function buildGeometry() {
  const bumper = new THREE.Shape(), inner = new THREE.Path();
  function trace(path, w, a, b, c) {
    path.moveTo(-w+c,a);
    path.lineTo(w-c,a);
    path.quadraticCurveTo(w,a,w,a+c);
    path.lineTo(w,b-c);
    path.quadraticCurveTo(w,b,w-c,b);
    path.lineTo(-w+c,b);
    path.quadraticCurveTo(-w,b,-w,b-c);
    path.lineTo(-w,a+c);
    path.quadraticCurveTo(-w,a,-w+c,a);
  }
  trace(bumper,.666,-.968,.946,.235);
  trace(inner,.547,-.848,.823,.215);
  bumper.holes.push(inner);
  const guard = new THREE.ExtrudeGeometry(bumper, { depth: .09, bevelEnabled: true, bevelSize: .026, bevelThickness: .024, bevelSegments: 2, curveSegments: 5 })
    .rotateX(-Math.PI/2).translate(0,.145,0);
  const merge = parts => {
    const unindexed = parts.map(p => p.index ? p.toNonIndexed() : p);
    const g = mergeGeometries(unindexed);
    for (const p of new Set([...parts, ...unindexed])) p.dispose();
    return g;
  };

  const chassis = merge([
    guard, box(0,.105,.16,.96,.035,1.22), box(0,.18,-.23,.56,.07,.51),
    box(0,.37,-.48,.45,.08,.41,-.87), round(0,.268,-.24,.235,.085,.232),
    box(-.324,.255,-.513,.27,.23,.36), box(-.36,.396,-.47,.23,.085,.26),
  ]);
  const painted = merge([
    round(0,.25,.727,.475,.088,.197),
    box(0,.318,.475,.27,.08,.505,-.32),
    round(-.463,.261,.04,.16,.092,.40), round(.463,.261,.04,.16,.092,.40),
    round(0,.273,-.731,.337,.087,.12),
  ]);
  const metal = merge([
    box(0,.14,-.53,1.07,.029,.029),
    box(.284,.213,-.55,.17,.11,.33),
    box(-.29,.321,-.682,.13,.09,.17),
    ...Array.from({length: 5}, (_, i) => box(-.325,.226+i*.027,-.635,.266,.012,.118)),
    box(0,.335,.197,.056,.36,.056,-.44),
    box(-.106,.144,.645,.097,.085,.052,-.4), box(.106,.144,.645,.097,.085,.052,-.4),
  ]);
  const wheel = new THREE.CylinderGeometry(.137,.137,.181,14).rotateZ(Math.PI/2);
  const hub = new THREE.CylinderGeometry(.073,.073,.187,11).rotateZ(Math.PI/2);
  const steering = merge([
    new THREE.TorusGeometry(.131,.019,6,15),
    box(0,0,0,.246,.024,.019), box(0,-.059,0,.025,.132,.02),
  ]);
  const driver = merge([round(0,.624,-.288,.195,.222,.119), round(0,.891,-.277,.116,.126,.115),
    round(-.15,.512,.012,.072,.062,.269), round(.15,.512,.012,.072,.062,.269)]);
  return { chassis, painted, metal, wheel, hub, steering, driver };
}

function createModel(ctx, geometry, club, number) {
  const root = new THREE.Group();
  root.name = (club ? 'club-sr5-' : 'rental-sr5-') + number;
  root.rotation.order = 'YXZ';
  const rubber = ctx.mat.toon('#252932'), alloy = ctx.mat.toon('#8e96a2');
  const color = club ? ['#255db2','#2d65ba','#2e56ab'][number % 3] : ['#b73030','#c63932','#ba3a37'][number % 3];
  const add = (kind, material, parent = root) => {
    const object = new THREE.Mesh(geometry[kind], material);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  add('chassis', rubber); add('painted', ctx.mat.toon(color)); add('metal', alloy);
  const steering = add('steering', rubber);
  steering.position.set(0,.515,.139);
  steering.rotation.x = -.78;
  const driver = add('driver', ctx.mat.toon(club ? '#283951' : '#77544c'));
  driver.visible = false;
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(.156, .113), ctx.mat.toon('#e9e6d9'));
  badge.rotation.x = -Math.PI/2;
  badge.position.set(0,.374,.472);
  root.add(badge);
  const digits = new THREE.Group();
  digits.position.copy(badge.position);
  digits.position.y += .003;
  addNumber(digits, number, rubber);
  root.add(digits);

  const wheels = [];
  for (const side of [-1, 1]) for (const front of [false, true]) {
    const pivot = new THREE.Group(), spin = new THREE.Group();
    pivot.position.set(.51*side,.137,front ? .535 : -.535);
    if (!front) spin.scale.x = 1.13;
    pivot.add(spin); root.add(pivot);
    add('wheel', rubber, spin); add('hub', alloy, spin);
    wheels.push({ pivot, spin, front });
  }
  let cockpit = false;
  return {
    root, wheels, spec: SPEC,
    setView(firstPerson) { cockpit = firstPerson; },
    set({x, y, z, yaw, pitch, roll, steerAngle, spin, driven}) {
      root.position.set(x,y,z); root.rotation.set(-pitch,yaw,roll);
      driver.visible = driven && !cockpit;
      steering.rotation.z = -steerAngle*2.7;
      for (const w of wheels) {
        w.pivot.rotation.y = w.front ? steerAngle : 0;
        if (driven) w.spin.rotation.x += spin;
      }
    },
  };
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
