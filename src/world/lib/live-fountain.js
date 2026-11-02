// Shared live fountain water, following the Library forecourt's flowing jets,
// ballistic sparkles, impact ripples and gentle dusk/night illumination.
// Three bounded dynamic draws per fountain; one spatial update per context.
// Basin geometry and every walking/driving/boat collision remain with the caller.
import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';

const controllers = new WeakMap(), CELL = 256, G = 9.81, TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fract = v => v - Math.floor(v);
const cellKey = (x, z) => `${x},${z}`;

function controller(ctx) {
  let c = controllers.get(ctx);
  if (c) return c;
  const stream = ctx.mat.toon('#a9d8e0', { name: 'live-fountain-stream', paint: 0, emissive: '#60becb', emissiveIntensity: .08 });
  const sparkle = ctx.mat.emissive('#e1efdf', .95, { name: 'live-fountain-sparkle' });
  const ripple = ctx.mat.toon('#a1d4db', { name: 'live-fountain-ripple', paint: 0, transparent: true, opacity: .55, depthWrite: false, emissive: '#69cdd5', emissiveIntensity: .1 });
  c = { ctx, buckets: new Map(), active: new Set(), next: new Set(), reach: 300,
    materials: [stream, sparkle, ripple],
    geometry: [new THREE.CylinderGeometry(1, 1, 1, 5, 1, true), new THREE.OctahedronGeometry(1), new THREE.TorusGeometry(1, .024, 3, 20).rotateX(-Math.PI / 2)],
    matrix: new THREE.Matrix4(), rotation: new THREE.Quaternion(), position: new THREE.Vector3(), scale: new THREE.Vector3(), axis: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0),
    day: new THREE.Color('#e1efdf').multiplyScalar(.95), night: new THREE.Color('#8ee0ed').multiplyScalar(1.45),
    stats: { fountains: 0, active: 0, candidates: 0, uploads: 0, callbacks: 1 } };
  controllers.set(ctx, c);
  // Stable diagnostics/coverage hook; records expose the same authored bounds,
  // dynamic meshes and scheduling counters without a second runtime traversal.
  c.registry = { records: [], stats: c.stats };
  (ctx.services ||= {}).liveFountains = c.registry;
  ctx.onUpdate((dt, t) => update(c, t));
  return c;
}

function write(c, mesh, i, x, y, z, sx, sy, sz, rotation = null) {
  c.position.set(x, y, z); c.scale.set(sx, sy, sz);
  if (!rotation) c.rotation.identity();
  c.matrix.compose(c.position, rotation || c.rotation, c.scale); mesh.setMatrixAt(i, c.matrix);
}

function animate(c, f, t, lit) {
  const [streams, drops, rings] = f.meshes, segments = f.segments, perDrop = f.perDrop;
  for (let i = 0; i < f.nozzles.length; i++) {
    const j = f.nozzles[i], apex = Math.max(j.y, j.ty) + j.height * (.94 + .06 * Math.sin(t * 1.7 + j.phase));
    const upT = Math.sqrt(2 * (apex - j.y) / G), flight = upT + Math.sqrt(2 * (apex - j.ty) / G);
    const vy = G * upT, dx = j.tx - j.x, dz = j.tz - j.z;
    let ax = j.x, ay = j.y, az = j.z;
    for (let s = 0; s < (f.drawStreams ? segments : 0); s++) {
      const u = (s + 1) / segments, tu = flight * u;
      const bx = j.x + dx * u, by = j.y + vy * tu - .5 * G * tu * tu, bz = j.z + dz * u;
      c.axis.set(bx - ax, by - ay, bz - az); const length = c.axis.length();
      c.axis.multiplyScalar(1 / Math.max(length, 1e-8)); c.rotation.setFromUnitVectors(c.up, c.axis);
      const w = j.width * (.88 + .12 * Math.sin(t * 4.2 + j.phase + s * .8)) * (1 - u * .55);
      write(c, streams, i * segments + s, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, w, Math.max(length, .001), w, c.rotation);
      ax = bx; ay = by; az = bz;
    }
    for (let d = 0; d < perDrop; d++) {
      const u = fract(t / flight * .72 + d / perDrop + j.phase * .137), tu = u * flight;
      const spread = Math.sin(u * Math.PI) * .11, twist = j.phase + d * 2.4;
      const size = (.025 + j.width * .7) * (.65 + .5 * Math.pow(Math.sin(t * 5 + j.phase + d), 8));
      write(c, drops, i * perDrop + d, j.x + dx * u + Math.sin(twist) * spread, j.y + vy * tu - .5 * G * tu * tu + .04,
        j.z + dz * u + Math.cos(twist) * spread, size, size * 1.8, size);
    }
    for (let k = 0; k < 2; k++) {
      const u = fract(t * .64 + j.phase * .17 + k * .5), r = .08 + u * j.ripple;
      write(c, rings, i * 2 + k, j.tx, j.ty + .025 + k * .003, j.tz, r, .06 + .25 * (1 - u), r);
    }
  }
  let uploads = 0;
  for (let i = 0; i < f.meshes.length; i++) {
    const mesh = f.meshes[i]; mesh.count = f.counts[i];
    if (!mesh.count) { mesh.visible = false; continue; }
    // Only active fountains write their bounded buffers. Keep a single upload range
    // even while a mesh is behind the camera and has not consumed its last upload.
    mesh.instanceMatrix.clearUpdateRanges(); mesh.instanceMatrix.addUpdateRange(0, mesh.count * 16);
    mesh.instanceMatrix.needsUpdate = true;
    uploads++;
  }
  f.stats.active = true; f.stats.time = t; f.stats.night = lit; f.stats.updates++; f.stats.uploads += uploads;
  c.stats.uploads += uploads;
}

function update(c, t) {
  const camera = c.ctx.camera?.position || c.ctx.player?.position;
  if (!camera) return;
  const n = c.ctx.shared?.uNight?.value || 0, sunY = c.ctx.shared?.uSunDir?.value?.y ?? 1;
  const lit = clamp(Math.max((.22 - sunY) / .22 * .55, (n - .03) / .55), 0, 1);
  c.materials[0].emissiveIntensity = .08 + lit * 1.25;
  c.materials[1].color.copy(c.day).lerp(c.night, lit);
  c.materials[2].emissiveIntensity = .1 + lit * 1.5;
  c.stats.candidates = 0; c.next.clear();
  const x0 = Math.floor((camera.x - c.reach) / CELL), x1 = Math.floor((camera.x + c.reach) / CELL);
  const z0 = Math.floor((camera.z - c.reach) / CELL), z1 = Math.floor((camera.z + c.reach) / CELL);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const bucket = c.buckets.get(cellKey(x, z)); if (!bucket) continue;
    for (const f of bucket) {
      c.stats.candidates++;
      if (!f.nozzles.length || Math.hypot(camera.x - f.x, camera.z - f.z) > f.far + f.radius) continue;
      f.group.visible = true; c.next.add(f); animate(c, f, t, lit);
    }
  }
  for (const f of c.active) if (!c.next.has(f)) {
    f.group.visible = false; f.stats.active = false;
    for (const mesh of f.meshes) mesh.count = 0;
  }
  const old = c.active; c.active = c.next; c.next = old; c.stats.active = c.active.size;
}

/**
 * Add animated water above an existing basin (no physics changes).
 * x,z,y: world centre and water surface. r: basin radius; height: jet rise.
 * pattern: ring (rim to inner ring), radial (centre to rim), vertical.
 * nozzles: optional local {x,y,z,height,width,target:[x,y,z]} overrides.
 * A target is a landing point relative to the fountain's world centre/surface.
 * drawStreams:false adds moving droplets/ripples around existing authored jets.
 * All fountains receive gentle dusk/night highlights from shared scene uniforms.
 */
export function liveFountain(ctx, opts = {}) {
  const c = controller(ctx), { id = `fountain-${c.stats.fountains}`, x = 0, z = 0, y = .3 } = opts;
  const r = Math.max(.1, opts.r ?? 2), height = Math.max(.05, opts.height ?? 2), width = clamp(opts.width ?? .035, .012, .16);
  const segments = Math.round(clamp(opts.segments ?? 10, 4, 16)), far = clamp(opts.far ?? 300, 50, 350);
  const count = Math.round(clamp(opts.jets ?? 12, 0, 64)), pattern = opts.pattern ?? 'ring';
  const generated = Array.from({ length: count }, (_, i) => {
    const a = i / Math.max(1, count) * TAU, cs = Math.cos(a), sn = Math.sin(a);
    const from = pattern === 'radial' ? .10 : .58, to = pattern === 'radial' ? .72 : pattern === 'vertical' ? .58 : .14;
    return { x: cs * r * from, z: sn * r * from, target: [cs * r * to, 0, sn * r * to] };
  });
  const nozzles = (opts.nozzles ?? generated).map((j, i) => {
    const tx = j.target?.[0] ?? j.x ?? 0, ty = j.target?.[1] ?? 0, tz = j.target?.[2] ?? j.z ?? 0;
    const w = clamp(j.width ?? width, .012, .16);
    return { x: j.x ?? 0, y: j.y ?? 0, z: j.z ?? 0, tx, ty, tz, height: Math.max(.05, j.height ?? height), width: w, ripple: .28 + w * 6, phase: i * .73 + x * .013 + z * .017 };
  });
  const bounds = new THREE.Box3();
  for (const j of nozzles) {
    const margin = .30 + j.ripple;
    const dropExtent = (.025 + j.width * .7) * 1.15 * 1.8 + .05;
    bounds.expandByPoint(new THREE.Vector3(Math.min(j.x, j.tx) - margin, Math.min(j.y, j.ty) - dropExtent, Math.min(j.z, j.tz) - margin));
    bounds.expandByPoint(new THREE.Vector3(Math.max(j.x, j.tx) + margin, Math.max(j.y, j.ty) + j.height + dropExtent, Math.max(j.z, j.tz) + margin));
  }
  if (!nozzles.length) bounds.set(new THREE.Vector3(-r, -.1, -r), new THREE.Vector3(r, height + .2, r));
  const drawStreams = opts.drawStreams !== false;
  const perDrop = (ctx.quality?.level || ctx.quality?.name) === 'low' ? 3 : 6, counts = [drawStreams ? nozzles.length * segments : 0, nozzles.length * perDrop, nozzles.length * 2];
  const group = new THREE.Group(); group.name = `live-fountain-${id}`; group.position.set(x, y, z); group.visible = false;
  const meshes = counts.map((n, i) => {
    const mesh = new THREE.InstancedMesh(c.geometry[i], c.materials[i], n);
    mesh.name = `${group.name}-${['jets', 'droplets', 'ripples'][i]}`;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.castShadow = false; mesh.receiveShadow = false; mesh.count = 0;
    if (!n) mesh.visible = false;
    mesh.boundingBox = bounds.clone(); mesh.boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());
    group.add(mesh); return mesh;
  });
  ctx.noOutline(group); ctx.add(group); group.updateMatrixWorld(true);
  for (const mesh of meshes) registerLOD(mesh, far);
  const radius = Math.hypot(Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x)), Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z)));
  const f = { id, x, z, far, radius, nozzles, segments, perDrop, drawStreams, counts, group, meshes, bounds,
    stats: { jets: nozzles.length, draws: counts.filter(n => n > 0).length, active: false, updates: 0, uploads: 0, time: 0, night: 0 }, controllerStats: c.stats };
  const key = cellKey(Math.floor(x / CELL), Math.floor(z / CELL));
  let bucket = c.buckets.get(key); if (!bucket) c.buckets.set(key, bucket = []); bucket.push(f);
  c.reach = Math.max(c.reach, far + radius); c.stats.fountains++; c.registry.records.push(f);
  return f;
}
