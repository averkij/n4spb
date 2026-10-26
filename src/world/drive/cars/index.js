// drive/cars/index.js - the GARAGE: the registry of the drivable cars of the Moscow Railway Station (drive.js builds one vehicle per entry).
//   coupe  the red sports car "Bibliott GT" (drive/model.js, drive/cockpit.js: wrapped here, not moved)
//   truck  the taxi pickup (cars/cybertruck.js: SPEC_TRUCK + createTruckModel), heavier and a bit slower
//   lada   the eggplant VAZ-2106 "Zhiguli" (cars/lada2106.js: SPEC_LADA + createLadaModel), lighter, a bit faster and loose
//   roadster  the white Tesla Roadster of 2026 (cars/roadster.js: SPEC_ROADSTER + createRoadsterModel), the fastest: electric, one gear, four rear cold-gas nozzles (THRUST) and a gas hop
// An entry: { id, name, nameEn, label, labelEn, toast, spec, tuning, parked {x, z, yaw}, sound, hud, exhaust [{x,y,z}], reach, makeModel(ctx) }
//   spec    the car's SPEC (drive/model.js fields W R tw track wb front rear hgt len centerZ ...) + mass (kg), durability, eye {x,y,z}, fovRest: read by handling, damage, collisions, wrecks, camera
//   tuning  createHandling(ctx, tuning): the per-car overrides of the coupe's constants (cars/tuning.js) + the spec-derived probes
//   sound   createCarSound profile (the engine voice), hud  the HUD words (boost label, one-gear letter)
// The three new cars load with a dynamic import and a fallback: a missing / broken car file drops THAT car from the garage (a warning) and the game goes on with the others; the plain
// placeholder box car exists only for tests (loadGarage(ctx, { placeholders: true }), never in the game).
// PARKING: the coupe stays at its old spot on the station's taxi-rank service aisle (OSM way w569726648, highway=service: lane rank 0, which traffic/sim.js never drives); the pickup and the Zhiguli
// stand on the free forecourt pavement south of it, staggered so that every car has a free way out to the east (toward Vosstaniya Square); the Roadster has the open forecourt east of x = 596
// to itself; docs/research/garage-2026.md.
import * as THREE from 'three';
import { createCarModel, SPEC as COUPE_SPEC } from '../model.js';
import { EYE as COUPE_EYE } from '../cockpit.js';
import { MASS, DURABILITY, SOUND, HUD, tuningFor } from './tuning.js';
import { GARAGE } from '../../lib/area-tables.js';

const DEG = Math.PI / 180;
/** where the cars wait: GARAGE.poses of the area module (src/world/area.js; the strip: the coupe at its old spot on the asphalt strip beside the taxi rank, the new ones in line with it, verified free of lanes / buildings by
 *  tools/drive-garage-test.mjs). { coupe, truck, lada, roadster: { x, z, yaw } }: a car without a pose is not built (loadGarage), an area without poses has no garage */
export const PARKING = GARAGE.poses;

const PRESENTATION = {
  coupe: { name: 'Красная «Б»', nameEn: 'Bibliott GT', label: 'Сесть в машину', labelEn: 'Get in the car · Bibliott GT', toast: 'Красная «Б» · Bibliott GT', reach: 4.6 },
  truck: { name: 'Такси-пикап', nameEn: 'Taxi pickup', label: 'Сесть в такси-пикап', labelEn: 'Get in the taxi pickup', toast: 'Такси-пикап · Taxi pickup', reach: 5.4 },
  lada: { name: 'Жигули', nameEn: 'Zhiguli', label: 'Сесть в «Жигули»', labelEn: 'Get in the Zhiguli', toast: 'Жигули · баклажановая шестёрка', reach: 4.6 },
  roadster: { name: 'Родстер', nameEn: 'Roadster', label: 'Сесть в родстер', labelEn: 'Get in the Roadster', toast: 'Родстер · Tesla Roadster 2026', reach: 4.8 },
};

/** the Roadster's THRUST plume as the fx module draws it (fx.js reads def.jetFx): cold white condensate puffs from every nozzle instead of the orange exhaust glow; the other cars have none */
export const JET_FX = { color: [0.92, 0.95, 1.0], additive: false, rate: 28, s0: 0.22, s1: 2.8, life: [0.9, 1.5], a: 0.5, back: 6, drag: 2.0, ground: true };

function entry(id, spec, makeModel, extra = {}, poses = PARKING) {
  const full = { ...spec, mass: MASS[id], durability: DURABILITY[id] };
  return { id, ...PRESENTATION[id], spec: full, tuning: tuningFor(id, full), parked: { ...poses[id] }, sound: SOUND[id], hud: HUD[id], exhaust: [], makeModel, carried: poses !== PARKING && poses[id] !== PARKING[id], ...extra };
}

/** a plain box car with the model API: tests only (collision lab, node harnesses without a page); named drive-body / drive-head / drive-tail / drive-plate like the real ones */
export function createPlaceholderModel(ctx, spec, color = '#888c94') {
  const mk = (w, h, d, y, z, col, name) => {
    const g = new THREE.BoxGeometry(w, h, d, 2, 2, 4); g.translate(0, y, z);           // indexed with position / normal / uv / color / aKind: the attribute set of the vertex-colour builder (VB)
    const c = new THREE.Color(col), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, name })); m.name = name; return m;
  };
  const root = new THREE.Group(); root.rotation.order = 'YXZ';
  const body = mk(spec.W, spec.hgt * 0.62, spec.len, spec.hgt * 0.4, spec.centerZ, color, 'drive-body'), glass = mk(spec.W * 0.8, spec.hgt * 0.3, spec.len * 0.4, spec.hgt * 0.8, spec.centerZ - 0.2, '#223', 'drive-glass');
  glass.material = new THREE.MeshBasicMaterial({ vertexColors: true, name: 'drive-glass', transparent: true, opacity: 0.6 });
  const headMat = new THREE.MeshBasicMaterial({ vertexColors: true, name: 'drive-head' }), tailMat = new THREE.MeshBasicMaterial({ vertexColors: true, name: 'drive-tail' });
  const lampH = mk(spec.W * 0.7, 0.1, 0.05, 0.6, spec.front, '#fff', 'drive-head'), lampT = mk(spec.W * 0.7, 0.1, 0.05, 0.7, spec.rear, '#f33', 'drive-tail'); lampH.material = headMat; lampT.material = tailMat;
  const driver = mk(0.4, 0.5, 0.3, 0.9, -0.3, '#336', 'drive-driver'), steerWheel = new THREE.Group();
  root.add(body, glass, lampH, lampT, driver, steerWheel);
  const wheels = [];
  for (const [sx, z, front] of [[1, spec.wb / 2, true], [-1, spec.wb / 2, true], [1, -spec.wb / 2, false], [-1, -spec.wb / 2, false]]) {
    const pivot = new THREE.Group(); pivot.position.set(sx * (spec.W / 2 - 0.12), spec.R, z);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(spec.R, spec.R, 0.25, 12).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#111' })); mesh.name = 'drive-wheel';
    pivot.add(mesh); root.add(pivot); wheels.push({ pivot, mesh, front });
  }
  const flames = [0, 1].map(() => { const f = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false })); f.visible = false; root.add(f); return f; });
  const glow = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false })); root.add(glow);
  root.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  return { root, wheels, steerWheel, driver, flames, glow, headMat, tailMat, body, glass, spec, placeholder: true,
    set(p) { root.position.set(p.x, p.y, p.z); root.rotation.set(-p.pitch, p.yaw, p.roll); for (const w of wheels) { if (w.front) w.pivot.rotation.y = p.steerAngle; w.mesh.rotation.x += p.spin; } },
    setView() {} };
}

async function optional(path, id, names, placeholders) {
  try {
    const mod = await import(path);
    for (const n of names) if (!mod[n]) throw new Error(`${path} does not export ${n}`);
    return mod;
  } catch (e) {
    console.warn(`[drive] the ${id} car is not available (${e.message}); the garage goes on without it`);
    return placeholders ? { placeholder: true } : null;
  }
}

/** the registry: coupe first, then whichever of the new cars load (the fleet order: coupe, truck, lada, roadster).
 *  carry { id, x, z, yaw }: the car the player DROVE into this page across an edge gate (docs/AREAS.md 15.z): when the area's GARAGE has no pose for it (admiralty keeps ONE purple Zhiguli; the four cars stand only
 *  at the central station) it is built anyway, parked at the arrival pose, flagged `carried` (drive.js gives it no parked box until it is left somewhere); an area that already keeps that car is not changed. */
export async function loadGarage(ctx, { placeholders = false, paths = {}, carry = null } = {}) {
  const poses = { ...PARKING };
  if (carry && Object.hasOwn(PRESENTATION, carry.id) && ![carry.x, carry.z, carry.yaw].some((v) => !Number.isFinite(v))) {
    const p = PARKING[carry.id]; if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.z)) poses[carry.id] = { x: carry.x, z: carry.z, yaw: carry.yaw };
  }
  const garage = [];
  const coupeSpec = { ...COUPE_SPEC, eye: { ...COUPE_EYE }, fovRest: 72 };
  garage.push(entry('coupe', coupeSpec, (c) => createCarModel(c), { exhaust: [{ x: 0.46, y: 0.28, z: COUPE_SPEC.rear - 0.1 }, { x: -0.46, y: 0.28, z: COUPE_SPEC.rear - 0.1 }] }, poses));
  const t = await optional(paths.truck || './cybertruck.js', 'truck', ['SPEC_TRUCK', 'createTruckModel'], placeholders);
  if (t && !t.placeholder) garage.push(entry('truck', t.SPEC_TRUCK, (c) => t.createTruckModel(c), { exhaust: [] }, poses));          // an electric truck: no tail pipes, no flames (a boost glow instead)
  else if (t) { const s = { W: 2.03, R: 0.43, tw: 0.285, track: 1.76, wb: 3.8, front: 2.63, rear: -3.05, hgt: 1.8, len: 5.68, centerZ: -0.21, eye: { x: 0.37, y: 1.44, z: 0.55 }, fovRest: 72 }; garage.push(entry('truck', s, (c) => createPlaceholderModel(c, s, '#e0b800'), { exhaust: [] }, poses)); }
  const l = await optional(paths.lada || './lada2106.js', 'lada', ['SPEC_LADA', 'createLadaModel'], placeholders);
  if (l && !l.placeholder) garage.push(entry('lada', l.SPEC_LADA, (c) => l.createLadaModel(c), { exhaust: l.SPEC_LADA.exhaust ? l.SPEC_LADA.exhaust.slice(0, 1) : [] }, poses));
  else if (l) { const s = { W: 1.62, R: 0.285, tw: 0.175, track: 1.35, wb: 2.42, front: 2.09, rear: -2.07, hgt: 1.4, len: 4.16, centerZ: 0.01, eye: { x: 0.35, y: 1.12, z: -0.1 }, fovRest: 72 }; garage.push(entry('lada', s, (c) => createPlaceholderModel(c, s, '#552659'), { exhaust: [{ x: 0.52, y: 0.235, z: -2.19 }] }, poses)); }
  const r = await optional(paths.roadster || './roadster.js', 'roadster', ['SPEC_ROADSTER', 'createRoadsterModel'], placeholders);
  if (r && !r.placeholder) garage.push(entry('roadster', r.SPEC_ROADSTER, (c) => r.createRoadsterModel(c), { exhaust: r.SPEC_ROADSTER.exhaust.slice(), jetFx: JET_FX }, poses));          // the four rear nozzles drive the thrust particles
  else if (r) { const s = { W: 2.0, R: 0.355, tw: 0.31, track: 1.61, wb: 2.96, front: 2.36, rear: -2.26, hgt: 1.22, len: 4.62, centerZ: 0.05, eye: { x: 0.36, y: 0.93, z: 0.2 }, fovRest: 74 }; garage.push(entry('roadster', s, (c) => createPlaceholderModel(c, s, '#e4e6ea'), { exhaust: [0.4, 0.13, -0.13, -0.4].map((x) => ({ x, y: 0.5, z: -2.27 })), jetFx: JET_FX }, poses)); }
  return garage.filter((g) => Number.isFinite(g.parked.x) && Number.isFinite(g.parked.z));          // a car without a pose in the GARAGE of the area is not built
}
