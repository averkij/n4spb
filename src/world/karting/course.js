import * as THREE from 'three';
import { KERB_PROFILE, createTrackSurfaceIndex } from './kerbs.js';
import { MeshBuilder, addCap } from '../lib/massing.js';
import { knockBays, splitBays } from '../lib/fence-bays.js';
import { COURSE, COURSE_LAWN, KERB_RUNS, PIT_LANE, START_FINISH, SPEED_CHECK, WALK_IN, distSqToLine, relief } from './site.js';
import { createKartRoughness } from './surfaces.js';

const spline = (points, closed) => new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), closed);
export const racingLine = spline(COURSE, true);
racingLine.arcLengthDivisions = 2048;
const length = racingLine.getLength();
const circuit = racingLine.getSpacedPoints(Math.ceil(length / 1.35));
const clamp = THREE.MathUtils.clamp;
const PAD = [[-4682.5, .073, 3555.4], [-4668.5, .073, 3550.1], [-4657.7, .073, 3581.5], [-4670.2, .073, 3587.2]];
const PAD_ACCESS = [[-4678.05, 3581.5], [-4674, 3587.2], [-4665.4, 3583], [-4668.1, 3577.5]]
  .map(([x, z], i) => [x, i < 2 ? relief(x, z) + .004 : .0735, z]);
function onCourseLawn(x, z) {
  if (x < -4773 || x > -4598 || z < 3479 || z > 3694) return false;
  let inside = false;
  for (let i = 0, j = COURSE_LAWN.length - 1; i < COURSE_LAWN.length; j = i++) {
    const [ax, az] = COURSE_LAWN[j], [bx, bz] = COURSE_LAWN[i];
    if ((az > z) !== (bz > z) && x < ax + (bx - ax) * (z - az) / (bz - az)) inside = !inside;
  }
  return inside;
}
const cornerWidth = (i) => {
  const p = circuit[i], next = circuit[(i + 5) % (circuit.length - 1)], prev = circuit[(i - 5 + circuit.length - 1) % (circuit.length - 1)];
  const a = Math.atan2(p.z - prev.z, p.x - prev.x), b = Math.atan2(next.z - p.z, next.x - p.x);
  return 3.7 + .25 * clamp(Math.abs(Math.atan2(Math.sin(b-a), Math.cos(b-a))), 0, 1);
};

const lane = spline(PIT_LANE, false).getSpacedPoints(54);
const lane2D = lane.map(p => [p.x, p.z]);

function offsets(points, closed) {
  const n = points.length - (closed ? 1 : 0);
  return points.map((p, i) => {
    const a = points[closed ? (i + n - 1) % n : Math.max(0, i - 1)];
    const b = points[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz);
    return [-dz / l, dx / l];
  });
}

function corner(p, normal, off, y, base) {
  const x = p.x + normal[0] * off, z = p.z + normal[1] * off;
  return [x, base(x, z) + y, z];
}

function quad(mesh, points) {
  const a = new THREE.Vector3().fromArray(points[0]);
  const ab = new THREE.Vector3().fromArray(points[1]).sub(a), ac = new THREE.Vector3().fromArray(points[2]).sub(a);
  const n = ab.cross(ac).normalize();
  const v = points.map(([x, y, z]) => mesh.vert(x, y, z, n.y < 0 ? -n.x : n.x, Math.abs(n.y), n.y < 0 ? -n.z : n.z, x / 10, z / 10));
  if (n.y < 0) mesh.quad(v[0], v[3], v[2], v[1]); else mesh.quad(...v);
}

function face(points, normals, i, lo, hi, base, y0 = 0, y1 = y0) {
  return [
    corner(points[i], normals[i], lo(i), y0, base), corner(points[i + 1], normals[i + 1], lo(i + 1), y0, base),
    corner(points[i + 1], normals[i + 1], hi(i + 1), y1, base), corner(points[i], normals[i], hi(i), y1, base),
  ];
}

function ribbon(builder, points, normals, lo, hi, shift, base, from = 0, to = points.length - 1, high = shift) {
  for (let i = from; i < to; i++) quad(builder, face(points, normals, i, lo, hi, base, shift, high));
}

// Border paint stops at a joining pavement edge. Subdivide only at junctions
// so that even a shallow-angle merge does not leave a crossing white line.
function edgePaint(builder, points, acrossJunction) {
  if (!acrossJunction) {
    quad(builder, points);
    return;
  }
  const [a, b, c, d] = points;
  const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[2] - a[2]) / .16));
  const lerp = (from, to, t) => from.map((value, i) => value + (to[i] - value) * t);
  for (let k = 0; k < steps; k++) {
    const start = k / steps, end = (k + 1) / steps, t = (start + end) / 2;
    const lo = lerp(a, b, t), hi = lerp(d, c, t);
    if (!acrossJunction((lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2)) {
      quad(builder, [lerp(a, b, start), lerp(a, b, end), lerp(d, c, end), lerp(d, c, start)]);
    }
  }
}

export function mesh(root, builder, material, name) {
  if (builder.empty) return;
  const object = new THREE.Mesh(builder.build(), material);
  object.name = name;
  object.receiveShadow = true;
  root.add(object);
  return object;
}

export function paintStrip(builder, a, b, width, y, heightAt = relief) {
  const [ax, az] = a, [bx, bz] = b, l = Math.hypot(bx - ax, bz - az);
  const x = -(bz - az) * width / (2 * l), z = (bx - ax) * width / (2 * l);
  quad(builder, [[ax+x, az+z], [bx+x, bz+z], [bx-x, bz-z], [ax-x, az-z]].map(([u, v]) => [u, heightAt(u, v) + y, v]));
}

function markingAt(builder, line, precision) {
  const [a, b] = line;
  const vx = b[0] - a[0], vz = b[1] - a[1], span = Math.hypot(vx, vz);
  let hit = null;
  for (let i = 1; i < circuit.length; i++) {
    const p = circuit[i - 1], q = circuit[i], dx = q.x - p.x, dz = q.z - p.z;
    const det = vx * dz - vz * dx;
    if (Math.abs(det) < 1e-5) continue;
    const u = ((p.x - a[0]) * dz - (p.z - a[1]) * dx) / det;
    const t = ((p.x - a[0]) * vz - (p.z - a[1]) * vx) / det;
    if (u < 0 || u > 1 || t < 0 || t > 1) continue;
    const x = a[0] + u * vx, z = a[1] + u * vz, half = cornerWidth(i) - .17;
    paintStrip(builder, [x - vx / span * half, z - vz / span * half], [x + vx / span * half, z + vz / span * half], precision, .025);
    hit = [x, z];
  }
  return hit;
}

export function buildCourse(ctx, root) {
  const cityRoughness = createKartRoughness(ctx);
  const normals = offsets(circuit, true);
  const kerbs = createTrackSurfaceIndex();
  const track = createTrackSurfaceIndex(), pit = createTrackSurfaceIndex(), paddock = createTrackSurfaceIndex();
  const verge = createTrackSurfaceIndex();
  function support(points, index, section) {
    index.addFace(points, section);
    const [a, b, c, d] = points;
    ctx.physics.addWalkTriangle([a, b, c], .1);
    ctx.physics.addWalkTriangle([a, c, d], .1);
  }
  support(PAD, paddock);
  support(PAD_ACCESS, paddock);
  function groundY(x, z) {
    let height = -Infinity;
    for (const surface of surfaces) height = Math.max(height, surface.at(x, z)?.height(x, z) ?? -Infinity);
    return height === -Infinity ? null : height;
  }
  const surfaces = [track, pit, paddock, verge, kerbs];
  const asphalt = new MeshBuilder(), white = new MeshBuilder(), red = new MeshBuilder();
  const grass = new MeshBuilder(), rubber = new MeshBuilder();
  quad(asphalt, PAD_ACCESS);
  const left = i => -cornerWidth(i), right = i => cornerWidth(i);

  // A graded, narrow verge meets the site's base grade, so the raised asphalt has no floating edges.
  // The far ends of the strips stay below the authored lawn overlay.
  for (let i = 0; i < circuit.length - 1; i++) {
    const innerLeft = [corner(circuit[i], normals[i], left(i), -.012, relief), corner(circuit[i+1], normals[i+1], left(i+1), -.012, relief)];
    const outerLeft = [corner(circuit[i+1], normals[i+1], left(i+1) - 2.05, .017, () => 0), corner(circuit[i], normals[i], left(i) - 2.05, .017, () => 0)];
    const innerRight = [corner(circuit[i], normals[i], right(i), -.012, relief), corner(circuit[i+1], normals[i+1], right(i+1), -.012, relief)];
    const outerRight = [corner(circuit[i+1], normals[i+1], right(i+1) + 2.05, .017, () => 0), corner(circuit[i], normals[i], right(i) + 2.05, .017, () => 0)];
    for (const points of [innerLeft.concat(outerLeft), innerRight.concat(outerRight)]) {
      quad(grass, points);
      support(points, verge);
    }
  }
  const tyreRuns = [
    [2, 14, -1], [106, 168, 1], [193, 227, -1], [276, 310, 1], [327, 377, -1],
    [380, 423, 1], [441, 482, -1], [521, 554, -1], [567, 592, 1],
    [609, 636, -1], [708, 748, 1], [752, 774, -1], [785, length, 1],
  ];
  for (const [from, to, side] of KERB_RUNS) {
    const start = Math.floor(from / length * (circuit.length - 1));
    const end = Math.min(circuit.length - 1, Math.ceil(to / length * (circuit.length - 1)));
    const at = i => side * (cornerWidth(i) - .06);
    for (let i = start; i < end; i++) {
      const edge = corner(circuit[i], normals[i], at(i), 0, relief);
      if (distSqToLine(edge[0], edge[2], lane2D) < 6.25) continue;
      const color = (i - start) % 4 < 2 ? red : white;
      const point = (j, profile) => {
        const { offset, height } = KERB_PROFILE[profile];
        const uneven = profile === 1 || profile === 2 ? .009 * Math.sin(j * 2.4) : 0;
        return corner(circuit[j], normals[j], at(j) + side * offset, height + uneven, relief);
      };
      for (let section = 0; section < KERB_PROFILE.length - 1; section++) {
        const points = [point(i, section), point(i + 1, section), point(i + 1, section + 1), point(i, section + 1)];
        quad(color, points);
        support(points, kerbs, section);
      }
    }
  }

  const bays = [];
  for (const [from, to, side] of tyreRuns) {
    const start = Math.floor(from / length * (circuit.length - 1));
    const end = Math.min(circuit.length - 1, Math.ceil(to / length * (circuit.length - 1)));
    for (let i = start; i < end; i++) {
      const at = j => side * (cornerWidth(j) - .06);
      if ((i - start) % 3 === 0) {
        const a = corner(circuit[i], normals[i], at(i) + side * 1.48, 0, relief);
        const j = Math.min(i + 3, end);
        const b = corner(circuit[j], normals[j], at(j) + side * 1.48, 0, relief);
        // The pit entry and exit cross the eastern edge of the race track.
        if (distSqToLine((a[0] + b[0]) / 2, (a[2] + b[2]) / 2, lane2D) > 14) {
          const foot = p => verge.at(p[0], p[2])?.height(p[0], p[2]) ?? .012;
          bays.push({ x0: a[0], z0: a[2], x1: b[0], z1: b[2], y: foot(a), ye: foot(b) });
        }
      }
      if ((i - start) % 5 < 4) {
        const trace = j => at(j) * .67 + .24 * Math.sin(j * .09);
        ribbon(rubber, circuit, normals, j => trace(j) - .11, j => trace(j) + .11, .013, relief, i, i + 1);
      }
    }
  }
  const laneNormal = offsets(lane, false);
  for (let i = 0; i < lane.length - 1; i++) {
    const points = face(lane, laneNormal, i, () => -2.18, () => 2.18, relief, .004);
    quad(asphalt, points);
    support(points, pit);
  }
  for (let i = 0; i < circuit.length - 1; i++) {
    const points = face(circuit, normals, i, left, right, relief);
    quad(asphalt, points);
    support(points, track);
  }
  for (const side of [-1, 1]) {
    const at = i => side * (cornerWidth(i) - .19);
    const underPit = (x, z) => pit.at(x, z);
    const underJunction = (x, z) => track.at(x, z) || paddock.at(x, z);
    for (let i = 0; i < circuit.length - 1; i++) {
      const { x, z } = circuit[i];
      const near = x > -4710 && x < -4655 && z > 3545 && z < 3623;
      edgePaint(white, face(circuit, normals, i, j => at(j) - .057, j => at(j) + .057, relief, .009), near ? underPit : null);
    }
    for (let i = 0; i < lane.length - 1; i++) {
      edgePaint(white, face(lane, laneNormal, i, () => side * 1.97 - .043, () => side * 1.97 + .043, relief, .013), underJunction);
    }
  }
  const arrow = [-4669.3, 3582.1], tip = [-4673.4, 3583.8];
  const padHeight = (x, z) => groundY(x, z) ?? .073;
  for (const start of [arrow, [-4672.1, 3584.2], [-4672.5, 3583]]) {
    const steps = Math.ceil(Math.hypot(tip[0] - start[0], tip[1] - start[1]) / .25);
    const at = i => start.map((x, axis) => x + (tip[axis] - x) * i / steps);
    for (let i = 0; i < steps; i++) paintStrip(white, at(i), at(i + 1), .18, .017, padHeight);
  }

  const start = markingAt(white, START_FINISH, .34);
  const nearStart = circuit.findIndex(p => Math.hypot(p.x - start[0], p.z - start[1]) < 1.4);
  for (let row = 1; row <= 6; row++) {
    const i = nearStart - row * 3;
    const p = circuit[i], n = normals[i], s = (row % 2 ? 1 : -1) * 1.55;
    const a = [p.x + n[0] * s, p.z + n[1] * s];
    const b = [a[0] + n[0] * 1.25, a[1] + n[1] * 1.25];
    paintStrip(white, a, b, .085, .012);
  }

  const paving = spline(WALK_IN, false).getSpacedPoints(100);
  const floor = new MeshBuilder();
  ribbon(floor, paving, offsets(paving, false), () => -1.45, () => 1.45, .022, () => 0);
  const lawn = new MeshBuilder();
  addCap(lawn, { o: COURSE_LAWN.flat(), h: [] }, () => .012);
  const winter = ctx.season === 'winter';
  mesh(root, lawn, ctx.mat.toon(winter ? '#dce4e5' : '#64794d'), 'narvskaya-lawn');
  mesh(root, pavingPad(), ctx.mat.toon('#625f65'), 'pit-paddock');
  mesh(root, grass, ctx.mat.toon(winter ? '#cbd7db' : '#63784c'), 'circuit-graded-verges');
  mesh(root, floor, ctx.mat.toon('#ada192'), 'kirovets-walking-approach');
  mesh(root, white, ctx.mat.toon('#e8e5d8'), 'narvskaya-whites');
  mesh(root, red, ctx.mat.toon('#c4443c'), 'narvskaya-red-kerbs');
  mesh(root, rubber, ctx.mat.toon('#353941'), 'narvskaya-tyre-marks');

  mesh(root, asphalt, ctx.mat.toon('#42464d'), 'narvskaya-asphalt');

  const tyre = new THREE.TorusGeometry(.24, .088, 5, 10).rotateX(Math.PI / 2);
  const { items: tyreColliders } = knockBays(ctx, {
    name: 'karting-tyre-banks', bays, far: 380, cell: 64,
    parts: [
      { geo: tyre, mat: ctx.mat.toon('#303139'), ats: () => [.08, .25, .42, .58, .75, .92], y: .077 },
      { geo: tyre, mat: ctx.mat.toon('#e2dcc9'), ats: () => [.08, .25, .42, .58, .75, .92], y: .237, when: (_, i) => i % 4 < 2 },
      { geo: tyre, mat: ctx.mat.toon('#a53432'), ats: () => [.08, .25, .42, .58, .75, .92], y: .237, when: (_, i) => i % 4 >= 2 },
    ],
    collider: b => ({ thick: .67, y0: Math.min(b.y, b.ye) - .05, y1: Math.max(b.y, b.ye) + .33 }),
    // The tied banks yield and rebound through the existing anchored collision
    // path. Every SR5 tops out below their break speed.
    rec: { kind: 'tyre-bank', mass: 110, h: .33, anchored: 120, hitK: .12 },
  });
  // Even a low tied stack blocks wheels when the chassis overlaps it.
  for (const box of tyreColliders) box.solidForVehicles = true;

  return {
    deckY: groundY,
    roughnessAt: (x, z) => {
      if (track.at(x, z) || pit.at(x, z) || paddock.at(x, z)) return 0;
      if (onCourseLawn(x, z)) return 1;
      return cityRoughness(x, z);
    },
    kerbAt: kerbs.at, startFinish: START_FINISH, start, speedCheck: SPEED_CHECK, racingLine, length };
}

function pavingPad() {
  const pad = new MeshBuilder();
  quad(pad, PAD);
  return pad;
}

export function siteFence(ctx, points) {
  const net = ctx.services.streets?.net;
  const skipSet = new Set(net?.ways.filter(w => w.skipDraw || w.pedestrianOnly));
  const clear = (x, z) => !net || net.cover(x, z, { skipSet, noFillets: true }) < -.55;
  const bays = points.slice(1).flatMap(([x, z], i) => splitBays(...points[i], x, z, 2.7))
    .filter(b => clear(b.x0, b.z0) && clear(b.x1, b.z1) && clear((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2));
  const box = new THREE.BoxGeometry(1, 1, 1);
  const mat = ctx.mat.toon('#65736d');
  knockBays(ctx, {
    name: 'karting-perimeter', bays, far: 310, cell: 64,
    parts: [
      { geo: box, mat, at: 'start', sx: .075, sy: 1.45, sz: .075, y: .725 },
      { geo: box, mat, at: 'mid', stretch: true, sy: .05, sz: .045, y: 1.35 },
      { geo: box, mat, at: 'mid', stretch: true, sy: .045, sz: .045, y: .3 },
      { geo: box, mat, ats: () => [.16, .32, .5, .66, .83], sx: .023, sy: 1.06, sz: .023, y: .825 },
    ],
    collider: { thick: .12, y0: -.04, y1: 1.42 },
    rec: { kind: 'fence', mass: 47, h: 1.45, anchored: 27, hitK: .44 },
  });
}
