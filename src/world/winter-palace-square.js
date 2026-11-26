// The Palace Square Christmas slide on the Pevchesky Bridge approach, the
// New Year's post under its giant lampshade, and the walk-in light sculpture.
// Reference photos and measurements: docs/research/palace-square-winter.md.
import * as THREE from 'three';
import { registerLOD } from '../core/spatial.js';
import { toWorld, rotFacing } from './landmarksG/frame.js';
import { VB } from './traffic/vb.js';

const GOLD = '#ffc775', IVORY = '#fff0d4', WOOD = '#aa7350';
const GROUND = 0.09;
const TAU = 2 * Math.PI;

function clear(ctx, x, z, radius) {
  const net = ctx.services.streets?.net || ctx._roadPlan;
  return ctx.L.inPlay(x, z) && !ctx.L.insideBuilding(x, z, radius)
    && (net ? net.cover(x, z, {}) < -radius : !ctx.L.isOnRoad(x, z, radius));
}

function display(ctx, name, x, z, yaw, frame, lights, materials, far) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, GROUND, z);
  group.rotation.y = yaw;
  for (const [builder, material] of [[frame, materials.frame], [lights, materials.lights]]) {
    const mesh = new THREE.Mesh(builder.build(), material);
    mesh.castShadow = mesh.receiveShadow = material === materials.frame;
    group.add(mesh);
  }
  ctx.add(group);
  group.updateMatrixWorld(true);
  for (const mesh of group.children) {
    ctx.noOutline(mesh);
    registerLOD(mesh, far);
  }
  return group;
}

// Open five-point star in the YZ plane (normal faces the flanks of the slide).
function star(lights, x, y, z, r) {
  let last = [x, y + r, z];
  for (let i = 1; i <= 10; i++) {
    const a = i * Math.PI / 5, d = i % 2 ? 0.45 * r : r;
    const next = [x, y + Math.cos(a) * d, z + Math.sin(a) * d];
    lights.rod(last, next, 0.043, IVORY, 5);
    last = next;
  }
}

// U is measured towards the staff arch, V towards the Admiralty. The slide
// occupies the strip of pavement between the drive and the eastern staff wing.
const SLIDE_U = 41.9, SLIDE_V = -162, HALF = 2;
const SLIDE_SKEW = 0.02;
const PROFILE = [[0, 8], [18, 3.75], [40, 0.95], [65, 0.04]];
function slide(ctx, materials) {
  // A slight turn follows the staff pavement and leaves the two permanent
  // Montferrand lamps standing just outside the western board.
  const yaw = rotFacing(Math.sin(SLIDE_SKEW), Math.cos(SLIDE_SKEW));
  const [x, z] = toWorld(SLIDE_U, SLIDE_V);
  const point = (xx, zz) => [x + xx * Math.cos(yaw) + zz * Math.sin(yaw),
    z - xx * Math.sin(yaw) + zz * Math.cos(yaw)];
  for (let s = -20; s <= 65; s += 1) {
    for (const side of [-HALF, 0, HALF]) {
      if (!clear(ctx, ...point(side, s), 0.60)) return;
    }
  }
  const frame = new VB(), lights = new VB();
  const width = HALF * 2;
  function incline(builder, xx, a, b, ya, yb, w, h, color) {
    const angle = Math.atan2(ya - yb, b - a);
    builder.box(w, h, Math.hypot(b - a, ya - yb), color,
      [xx, (ya + yb) / 2 - h / 2 * Math.cos(angle), (a + b) / 2 - h / 2 * Math.sin(angle)], [angle, 0, 0]);
  }
  // Three snow-covered lanes with timber runners. The same sampled profile
  // drives the conveyor surfaces, so the player can climb and ride the hill.
  for (let i = 1; i < PROFILE.length; i++) {
    const [a, ya] = PROFILE[i - 1], [b, yb] = PROFILE[i], mid = (a + b) / 2;
    incline(frame, 0, a, b, ya, yb, width, 0.28, '#d5e5e7');
    const [cx, cz] = point(0, mid);
    ctx.physics.addConveyor({ cx, cz, w: width, d: b - a, rotY: yaw,
      yA: GROUND + ya, yB: GROUND + yb, speed: [0, 4.5, 7.8, 5][i], thick: 0.28 });
    for (const lane of [-HALF, -HALF / 3, HALF / 3, HALF]) {
      const outer = Math.abs(lane) === HALF, lip = outer ? 0.64 : 0.16;
      incline(frame, lane, a, b, ya + lip, yb + lip, 0.16, lip + 0.33, WOOD);
      if (outer) {
        incline(lights, lane, a, b, ya + lip + 0.03, yb + lip + 0.03, 0.11, 0.055, GOLD);
        ctx.physics.addWalkRamp(...point(lane, mid), 0.16, b - a, yaw,
          ya + lip + GROUND, yb + lip + GROUND, lip + 0.33);
      }
    }
  }
  // A straight flight and a full-width landing at the high end.
  const bottom = -20, landing = -4;
  const risers = 44, tread = (landing - bottom) / risers;
  for (let i = 0; i < risers; i++) {
    frame.box(width, 0.2, tread, i % 2 ? '#bb8a5e' : '#c18e62',
      [0, (i + 1) * 8 / risers - 0.1, bottom + (i + 0.5) * tread]);
  }
  ctx.physics.addWalkRamp(...point(0, (bottom + landing) / 2), width, landing - bottom, yaw, GROUND, GROUND + 8, 0.25);
  frame.box(width, 0.26, -landing, WOOD, [0, 7.87, landing / 2]);
  ctx.physics.addWalkBox(...point(0, landing / 2), width, -landing, yaw, GROUND + 8, GROUND + 7.74);
  const height = s => {
    if (s < landing) return 8 * (s - bottom) / (landing - bottom);
    if (s <= 0) return 8;
    const i = PROFILE.findIndex(p => p[0] >= s);
    const [a, ya] = PROFILE[i - 1], [b, yb] = PROFILE[i];
    return ya + (yb - ya) * (s - a) / (b - a);
  };
  for (const side of [-HALF, HALF]) {
    for (const [a, b, ya, yb] of [[bottom, landing, 0, 8], [landing, 0, 8, 8]]) {
      incline(frame, side, a, b, ya + 1, yb + 1, 0.15, 0.11, WOOD);
      incline(lights, side, a, b, ya + 1.055, yb + 1.055, 0.075, 0.055, GOLD);
      ctx.physics.addWalkRamp(...point(side, (a + b) / 2), 0.15, b - a, yaw, ya + GROUND + 1, yb + GROUND + 1, 1.2);
    }
    // Closely spaced slats on the high stand, open timber trestles below.
    for (let s = bottom; s <= 40; s += s < 10 ? 0.53 : 2) {
      const h = height(s) + (s < 0 ? 1 : 0.62);
      frame.box(0.17, h, 0.16, WOOD, [side, h / 2, s]);
    }
    for (let s = -14; s <= 26; s += 4) {
      const h = height(s);
      star(lights, side + Math.sign(side) * 0.18, h * 0.62, s, Math.min(0.85, h / 3));
      if (s < 10) lights.rod([side, h + 0.4, s], [side + Math.sign(side) * 0.18, h * 0.62 + 0.6, s], 0.022, GOLD, 4);
    }
  }
  display(ctx, 'palace-christmas-slide', x, z, yaw, frame, lights, materials, 360);
}

function holidayPost(ctx, materials) {
  const [x, z] = toWorld(-34, 17);
  if (!clear(ctx, x, z, 3.5)) return;
  const frame = new VB(), lights = new VB();
  frame.cyl(0.42, 0.63, 0.24, '#816947', [0, 0.12, 0]);
  lights.cyl(0.10, 0.15, 6.9, GOLD, [0, 3.54, 0]);
  // The real lampshade is transparent. Each strand runs between two hoops,
  // with a short beaded fringe hanging below the lower rim.
  for (const [r, h] of [[1.67, 7.0], [2.85, 4.25]]) {
    lights.torus(r, 0.065, IVORY, [0, h, 0], [Math.PI / 2, 0, 0], 6, 48);
  }
  for (let i = 0; i < 48; i++) {
    const a = i * TAU / 48, c = Math.cos(a), s = Math.sin(a);
    lights.rod([1.67 * c, 7.0, 1.67 * s], [2.85 * c, 4.25, 2.85 * s], 0.025, GOLD, 4);
    lights.sph(0.057, IVORY, [2.85 * c, 4.12, 2.85 * s], 6);
    if (i % 8 === 0) frame.rod([0, 6.8, 0], [1.67 * c, 7, 1.67 * s], 0.03, WOOD);
  }
  const lamp = display(ctx, 'palace-post-lampshade', x, z, 0, frame, lights, materials, 250);
  const lampBase = ctx.physics.addCylinder(x, z, 0.62, GROUND, 7 + GROUND);
  ctx.knock?.register({ kind: 'lamp', x, z, y: GROUND, h: 7.1, r: 0.62, mass: 260, anchored: 23,
    item: lampBase, parts: [{ obj: lamp }] });
  const box = new VB(), accents = new VB(), blue = '#32688d';
  box.box(0.40, 0.67, 0.37, '#454e5a', [0, 0.335, 0]);
  box.rbox(0.82, 0.88, 0.54, 0.07, blue, [0, 1.08, 0]);
  box.box(0.58, 0.045, 0.06, '#192e43', [0, 1.36, 0.274]);
  accents.box(0.63, 0.044, 0.10, IVORY, [0, 1.41, 0.275]);
  box.box(0.43, 0.27, 0.02, '#e1d9c2', [0, 1.05, 0.278]);
  for (const s of [-1, 1]) box.rod([s * 0.20, 1.17, 0.295], [0, 1.01, 0.295], 0.012, blue);
  const [mx, mz] = toWorld(-33, 19);
  const post = display(ctx, 'palace-post-box', mx, mz, 0, box, accents, materials, 100);
  const item = ctx.physics.addBox(mx, mz, 0.82, 0.54, 0, GROUND, 1.55 + GROUND);
  const record = ctx.knock?.register({ kind: 'post-box', x: mx, z: mz, y: GROUND, h: 1.55, w: 0.82, d: 0.54,
    mass: 45, item, parts: [{ obj: post }] });
  ctx.interact?.add({ id: 'palace-holiday-post', radius: 2.6,
    label: 'Опустить новогоднюю открытку', labelEn: 'Post a New Year card',
    at: () => ({ x: mx, y: 1.38, z: mz }),
    enabled: () => (!record || record.state === 'stand') && !ctx.drive?.active,
    onUse: () => ctx.ui?.toast?.('На открытке штемпель «Дворцовая площадь». С Новым годом!'),
  });
}

// Two open ends leave a straight, walkable passage through the ornament.
function snowGlobe(ctx, materials) {
  const [x, z] = toWorld(15, 44), r = 2.8;
  if (!clear(ctx, x, z, r + 0.5)) return;
  const frame = new VB(), lights = new VB(), roots = [];
  for (const side of [-1, 1]) {
    for (let i = -2; i <= 2; i++) {
      const angle = i * 0.48, ux = Math.cos(angle) * side, uz = Math.sin(angle);
      const rib = [];
      for (let step = 0; step <= 18; step++) {
        const a = -0.98 + (Math.PI / 2 + 0.98) * step / 18;
        rib.push([r * ux * Math.cos(a), r * (Math.sin(a) + Math.sin(0.98)) + 0.10, r * uz * Math.cos(a)]);
      }
      lights.tube(rib, 0.051, i % 2 ? IVORY : '#94cde5', 18, 5);
      const [fx, , fz] = rib[0];
      frame.cyl(0.19, 0.24, 0.17, '#927444', [fx, 0.085, fz]);
      roots.push(ctx.physics.addCylinder(x + fx, z + fz, 0.20, GROUND, GROUND + 1.4));
    }
    for (const y of [0.45, 1.45, 2.45, 3.45, 4.45]) {
      const rr = Math.sqrt(r * r - (y - r * Math.sin(0.98) - 0.10) ** 2);
      const points = Array.from({length: 13}, (_, i) => {
        const a = (i - 6) * 0.16;
        return [rr * side * Math.cos(a), y, rr * Math.sin(a)];
      });
      lights.tube(points, 0.043, GOLD, 12, 5);
    }
  }
  const top = r * (1 + Math.sin(0.98)) + 0.10;
  frame.cyl(0.44, 0.56, 0.32, '#c69d57', [0, top + 0.06, 0]);
  lights.torus(0.39, 0.066, GOLD, [0, top + 0.55, 0], null, 6, 18);
  const globe = display(ctx, 'palace-snow-globe', x, z, 0, frame, lights, materials, 230);
  ctx.knock?.register({kind: 'light-sculpture', x, z, y: GROUND, r, h: top + 1,
    anchored: 18, mass: 185, items: roots, parts: [{ obj: globe }]});
}

export function buildPalaceFestival(ctx, glow) {
  if (!ctx.L.inPlay(...toWorld(0, 0))) return;
  const materials = { frame: ctx.mat.toon('#ffffff', { vertexColors: true, name: 'palace-festival' }), lights: glow };
  slide(ctx, materials);
  holidayPost(ctx, materials);
  snowGlobe(ctx, materials);
}
