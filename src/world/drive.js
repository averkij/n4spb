// drive - a red sports car parked at the Moscow Railway Station that the player can get into ([E] next to it) and drive through the city, with a "Need for Speed, but simpler"
// interface. The car carries the Bibliotechka logo (the user's reader app, assets/bibliotochka.png) on the roof as an easter egg.
//
// FILES (code in drive/):  model.js the car (body, glass, wheels, lamps, driver, wing, logo decals, nitro flames, neon underglow);  handling.js the arcade physics + collisions;
//   hud.js speedometer / tacho / gear / nitro / drift counter / speed streaks / key hints;  fx.js tyre smoke + sparks + exhaust glow (the Roadster: cold-gas cloud);  sound.js engine / tyres / wind / nitro / crash.
// CONTROLS  W / Up gas, S / Down brake + reverse, A D / Left Right steer, Shift nitro, X hop and C barrel hop (the Roadster: X throws it over kerbs and bins, C is twice as high with a barrel roll; both start on key down), Space handbrake (drift), G horn, V camera (chase / high / cockpit), mouse looks around (it
//   swings back by itself), E gets out (below ~25 km/h), 1-5 and R teleport the car to the same places as on foot, T time of day, M mute. Touch: left stick drives, buttons for nitro / hop / flip / drift / stop / exit.
// HOW IT PLUGS IN: while driving, player.inputLock is raised (the walker is frozen and its keys / look are ignored), player.pos follows the car (so the people / traffic / zones /
//   street-name toasts keep working around the car) and this module sets the camera after the player's update (module updates run after player.update). The parked car is a physics
//   box; the moving car uses a rigid footprint with angular impulses against the walker's solids (core/physics.js). Traffic brakes after impacts while keeping its lane route; it appears to
//   the pedestrians as one more moving blocker (services.traffic.extraBlockers). damage.js retains local dents/scuffs until the stopped driver repairs with J or the HUD button.
// GARAGE (2026-10-13): three cars stand parked beside the taxi rank, each a vehicle with its own model, handling state, damage state and physics box (drive/cars/index.js registry, cars/tuning.js
//   handling / sound / HUD per car): the red coupe, the taxi pickup (heavier, a bit slower) and the eggplant Zhiguli (lighter, a bit faster, loose). E gets into the NEAREST one (the interaction layer),
//   exit leaves it parked where it stopped (dents included), only one car is active. A fourth, the white Roadster, adds THRUST (cold-gas nozzles) and the gas hop (handling.js tuning.hop). car / model / damage / parked in the service follow the current (last driven) car.
// BOATS (docs/AREAS.md "The motor boat"): the first water transport. The motor boats that wait at their docks (drive/boat/: index.js the docks and the entries, handling.js the floating physics on physics.waterLevel,
//   model.js the hull, wake.js the foam) are vehicles of the same shape as the cars, in `boats` (not in `fleet`, which stays the four cars of the station), taken with E like a car, driven with the car's keys; the active boat is
//   `car` / `model` / `damage` (empty) / `parked` like a car (`car.floats` = true, `vehicle.kind` = 'boat'). Exit: the walker stands beside the hull on the water bed; R / a hand-off onto land leaves the boat and sets the player on foot.
// SERVICE  ctx.drive = ctx.services.drive = { active, car (handling state of the current car), parked, model, damage, fleet, boats, vehicles, vehicle, vehicleById(id), enter(idOrVehicle), exit(force), place(x, z, yawDeg), setView(i), sim(seconds, input) (test hook) }
// TEST HOOKS  window.__drive = ctx.drive;  ?cam=... shots show the parked car; node tools/shot.mjs --eval "__ctx.drive.enter(); __ctx.drive.sim(3, { thr: 1 })" drives it headlessly.
import * as THREE from 'three';
import { loadGarage } from './drive/cars/index.js';
import { GARAGE } from './lib/area-tables.js';
import { createHandling, holdInput } from './drive/handling.js';
import { createCarDamage, crushedSpec } from './drive/damage.js';
import { getCarWrecks } from './drive/wrecks.js';
import { createCarSound } from './drive/sound.js';
import { createFx } from './drive/fx.js';
import { createDriveHud } from './drive/hud.js';
import { createWasted } from './drive/wasted.js';
import { STEP_HEIGHT } from '../core/physics.js';
import { loadBoats } from './drive/boat/index.js';
import { createBoatHandling } from './drive/boat/handling.js';
import { createWake } from './drive/boat/wake.js';

const DEG = Math.PI / 180, TAU = Math.PI * 2;
/** the damage state of a vehicle that cannot be damaged (the motor boat): the shape of drive/damage.js that drive.js, the HUD and the hand-off read, with nothing in it */
const noDamage = () => ({ amount: 0, stage: 0, smoke: 0, revision: 0, state: { front: 0, rear: 0, left: 0, right: 0 }, hit() {}, repair() {}, sync() {}, hideDetached() {} });
export const SPAWN = GARAGE.spawn || GARAGE.poses.coupe || null;      // GARAGE.spawn of the area module (the strip: on the asphalt strip beside the station's taxi rank, facing east, toward Vosstaniya Square)
const EXIT_MAX_KMH = 25;
const angDiff = (a, b) => { let d = a - b; d -= TAU * Math.round(d / TAU); return d; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export async function build(ctx) {
  const { camera, physics: ph, L } = ctx, THREE_ = THREE;
  const player = ctx.playerObj || null;                       // set by main.js before the modules are built
  const garage = await loadGarage(ctx);                       // drive/cars/index.js: the coupe + whichever of the truck / Lada load
  if (!garage.length) { console.warn('[drive] the area has no garage (GARAGE.poses): no cars'); return; }      // an area without cars: no drive service (the callers test ctx.drive)
  const wrecks = await getCarWrecks(ctx);
  // ONE VEHICLE PER CAR: its own model, handling state (parked pose included), damage state, parked physics box. V is the car the player drives or last drove; the closure
  // names below (car, model, damage, parked, SPEC, EYE) always point at V, the others stand parked as solid obstacles with their own dents.
  const fleet = garage.map((def) => {
    const model = def.makeModel(ctx); ctx.add(model.root);
    const car = createHandling(ctx, def.tuning), p = def.parked;
    car.reset(p.x, p.z, p.yaw);
    const parked = { x: p.x, z: p.z, yaw: p.yaw, y: car.groundAt(p.x, p.z) };
    const damage = createCarDamage(model, { interior: true, spec: def.spec, onDetach: fragment => wrecks.shed(fragment, car) });
    return { id: def.id, def, model, car, parked, damage, spec: def.spec, box: null };
  });
  // THE BOATS (drive/boat/): the motor boats that wait at their docks, one vehicle each with the same shape as a car (model, handling state, parked pose, a damage state that stays empty, a physics box); they are NOT in `fleet`
  // (the cars of the station, which the tests count) but in `boats`; `vehicles` is both. A boat floats at the water level, takes the car's controls and has its own wake, sound and key line.
  const boats = [];
  try {
    for (const def of loadBoats(ctx)) {
      const model = def.makeModel(ctx); ctx.add(model.root);
      const car = createBoatHandling(ctx, def.tuning), p = def.parked;
      car.reset(p.x, p.z, p.yaw);
      boats.push({ id: def.id, kind: 'boat', def, model, car, parked: { x: p.x, z: p.z, yaw: p.yaw, y: car.y }, damage: noDamage(), spec: def.spec, box: null });
    }
  } catch (e) { console.warn(`[drive] the boats are not available (${e.message}); the cars go on without them`); boats.length = 0; }
  const vehicles = fleet.concat(boats), wake = boats.length ? createWake(ctx) : null;
  let V = fleet[0], car = V.car, model = V.model, damage = V.damage, parked = V.parked, SPEC = V.spec, EYE = V.spec.eye;
  const sound = createCarSound(ctx.audio);
  const fx = createFx(ctx);
  const isTouch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  const touch = { nitro: false, hand: false, brake: false, jump: false, flip: false };
  let hopTap = false, flipTap = false;      // the X / C hop key (or button) went down since the last physics step: a press shorter than one frame (keydown + keyup between two frames) must still launch its hop
  const hud = createDriveHud({ isTouch, onExit: () => api.exit(), onRepair: () => api.repair(), onNitro: (v) => { touch.nitro = v; }, onHand: (v) => { touch.hand = v; }, onBrake: (v) => { touch.brake = v; }, onJump: (v) => { touch.jump = v; if (v) hopTap = true; }, onFlip: (v) => { touch.flip = v; if (v) flipTap = true; } });
  const night = ctx.shared.uNight;
  // 100% junked: the "Потрачено" label for 5 s, the car cannot be driven (J still repairs it): drive/wasted.js
  const wasted = createWasted({ onShow: () => ctx.ui.toast('Нажмите J — ремонт · Press J to repair') });

  const addBox = (v = V) => {
    if (v.box) return;
    const { parked: p, spec } = v, sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
    const draft = v.kind === 'boat' ? 0.45 : 0.03;      // (a boat's box reaches below the waterline: a walker on the shallow bed of a pond cannot stand inside the hull)
    v.box = ph.addBox(p.x + sy * spec.centerZ, p.z + cy * spec.centerZ, spec.W + 0.08, spec.len + 0.08, p.yaw, p.y - draft, p.y - 0.03 + spec.hgt);
  };
  const dropBox = (v = V) => { if (v.box) { ph.remove(v.box); v.box = null; } };
  for (const v of vehicles) addBox(v);
  /** make `v` the current car (the closure names follow it); a car parked since its last drive keeps its dents */
  function use(v) {
    if (v === V) return;
    V = v; car = v.car; model = v.model; damage = v.damage; parked = v.parked; SPEC = v.spec; EYE = v.spec.eye; collisionRevision = -1;
    me.w = SPEC.W; me.d = SPEC.len; me.hw = SPEC.W / 2; me.hd = SPEC.len / 2;
    sound.setProfile(v.def.sound); hud.setProfile(v.def.hud, !!v.def.tuning.hop);
  }

  const view = { mode: 0, nearOn: false, hx: 0, hy: 0, hz: 0, camYaw: 0, orbitY: 0, orbitP: 0, idle: 0, fov: 62, baseFov: camera.fov || 62, shake: 0, y: 0, snap: true };
  const state = { active: false, enteredAt: 0, lights: false };
  const keys = player ? player.keys : new Set();
  const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _q2 = new THREE.Quaternion();
  const extra = [];       // services.traffic.extraBlockers: the player's car as a moving blocker for the pedestrians
  const me = { x: 0, z: 0, w: SPEC.W, d: SPEC.len, hw: SPEC.W / 2, hd: SPEC.len / 2, rotY: 0, vx: 0, vz: 0, speed: 0, kind: 'player' };

  // ---------------------------------------------------------------- input
  function readInput(out = {}) {
    const k = keys;
    const up = k.has('KeyW') || k.has('ArrowUp'), dn = k.has('KeyS') || k.has('ArrowDown');
    out.thr = up ? 1 : 0; out.brk = dn || touch.brake ? 1 : 0;
    out.steer = (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) - (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0);
    out.nitro = k.has('ShiftLeft') || k.has('ShiftRight') || touch.nitro;
    out.hand = k.has('Space') || touch.hand;
    out.jump = k.has('KeyX') || touch.jump || hopTap;                          // X = the simple hop, C = the barrel hop: levels plus the latched presses; handling.js makes the edge, so the hop starts on the frame of the key down (only a car with tuning.hop reads them)
    out.flip = k.has('KeyC') || touch.flip || flipTap;
    if (player && player.touchMove) { const tm = player.touchMove; if (tm.lengthSq() > 0.01) { out.steer = clamp(-tm.x * 1.4, -1, 1); if (tm.y < -0.15) out.thr = clamp(-tm.y * 1.3, 0, 1); else if (tm.y > 0.3) out.brk = clamp(tm.y, 0, 1); } }
    return out;
  }
  const input = {};

  // ---------------------------------------------------------------- enter / exit
  /** get into a car: `which` = a vehicle, its id ('coupe' | 'truck' | 'lada' | 'roadster') or nothing (the current / last driven one) */
  function enter(which) {
    if (state.active || !player) return false;
    if (player.fly || player.riding) return false;
    const v = typeof which === 'string' ? vehicles.find((f) => f.id === which) : which && which.car ? which : V;
    if (!v) return false;
    state.active = true; state.enteredAt = performance.now();
    player.inputLock++; player.fly = false;
    use(v); dropBox(); wasted.reset(damage.amount);
    car.reset(parked.x, parked.z, parked.yaw);
    car.jumpHeld = keys.has('KeyX') || touch.jump; car.flipHeld = keys.has('KeyC') || touch.flip;      // a hop key that is down at the door starts nothing: only a fresh press does
    car.damage = damage.amount; car.damageStage = damage.stage; car.damageSmoke = damage.smoke;
    view.snap = true; view.orbitY = view.orbitP = 0; view.camYaw = parked.yaw;
    {   // the neighbours in the row can block the chase view behind the car: start from the freer side, the view swings back behind as the car pulls away
      const cx = car.x + Math.sin(car.yaw) * SPEC.centerZ, cz = car.z + Math.cos(car.yaw) * SPEC.centerZ, r = 5.5 + 0.8 * (SPEC.len - 4.14);
      const open = (a) => !ph.columnBlocked(cx - Math.sin(car.yaw + a) * r, cz - Math.cos(car.yaw + a) * r, 0.6, car.y + 0.2, car.y + 1.3);
      if (!open(0)) { view.orbitY = open(0.95) ? 0.95 : open(-0.95) ? -0.95 : 0; view.idle = 0; }
    }
    hud.show(true); sound.start(); fx.clear(); hud.update(car, 0);
    model.setView(view.mode === 2); damage.hideDetached(); if (model.setDriven) model.setDriven(true);      // (the boat's helmsman is painted only while the boat is in use)
    ctx.ui.toast(V.def.toast);
    return true;
  }
  /** the spot beside the car where the walker can stand: tries the left / right side, then behind */
  function exitSpot() {
    const sy = Math.sin(car.yaw), cy = Math.cos(car.yaw), lx = cy, lz = -sy, c = car.carCenter, y = car.y;
    const spots = [[2.0, 0], [-2.0, 0], [2.7, 0.6], [-2.7, 0.6], [2.0, -1.5], [-2.0, -1.5], [3.4, 0], [-3.4, 0], [0, -3.9], [0, 3.9], [4.2, 1], [-4.2, 1]];
    for (let r = 3; r <= 9; r += 1.5) for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; spots.push([Math.cos(a) * r, Math.sin(a) * r]); }      // a ring search when the car is jammed against a wall / bollards
    const boat = V.kind === 'boat', bad = boat ? car.walkerBlocked : car.blocked;      // a boat: the walker may stand on the water bed (wading) or on a bank, the water is no wall for him
    for (const [side, back] of spots) {
      const x = c.x + lx * side + sy * back, z = c.z + lz * side + cy * back;
      if (bad(x, z) || ph.columnBlocked(x, z, 0.35, y + 0.3, y + 1.7)) continue;
      if (boat && !(ph.groundHeight(x, z, y + 0.35 - STEP_HEIGHT + 0.05, false) > -Infinity)) continue;      // the pose must have a floor the walker is set down on (player.setPose stand): the bed, a landing; not a quay 3 m over the boat
      return { x, z };
    }
    return null;
  }
  function exit(force = false) {
    if (!state.active) return false;
    if (!force && car.air) return false;                                        // mid-hop the door stays shut until the touchdown
    if (!force && car.speed > EXIT_MAX_KMH) { ctx.ui.toast('Остановитесь · Slow down to get out'); return false; }
    const spot = exitSpot();
    if (!spot && !force) { ctx.ui.toast('Здесь не выйти · No room to get out'); return false; }
    state.active = false;
    parked.x = car.x; parked.z = car.z; parked.yaw = car.yaw; parked.y = car.air ? car.groundAt(car.x, car.z) : car.y; car.vx = car.vz = 0;
    addBox();
    hud.show(false); sound.stop(); fx.clear(); extra.length = 0; wasted.hide();
    if (camera.fov !== view.baseFov) { camera.fov = view.baseFov; camera.updateProjectionMatrix(); }
    camera.up.set(0, 1, 0); cockpitNear(false);
    player.inputLock = Math.max(0, player.inputLock - 1);
    const s = spot || { x: car.carCenter.x + Math.cos(car.yaw) * 2.2, z: car.carCenter.z - Math.sin(car.yaw) * 2.2 };
    // face the way the car was heading (camera yaw convention: forward = (-sin, -cos))
    const yawDeg = ((car.yaw + Math.PI) / DEG + 540) % 360 - 180;
    player.setPose(s.x, s.z, yawDeg, 0, parked.y + 0.35, { stand: true });
    model.setView(false); damage.hideDetached(); if (model.setDriven) model.setDriven(false); poseModel(0);
    return true;
  }
  /** teleport (digit keys / R while driving): the nearest free spot, car facing the given walker yaw (degrees, camera convention) */
  function placeVehicle(x, z, yawDeg) {
    const yaw = yawDeg * DEG + Math.PI;
    for (let r = 0; r <= (V.kind === 'boat' ? 6 : 40); r += 4) for (let a = 0; a < (r ? 8 : 1); a++) {      // (a boat is only set where there is water: the spot itself or a few metres around it, never 40 m away)
      const px = x + Math.cos(a * Math.PI / 4) * r, pz = z + Math.sin(a * Math.PI / 4) * r;
      const sy = Math.sin(yaw), cy = Math.cos(yaw);
      let ok = !car.blocked(px, pz);
      const pf = Math.max(2, SPEC.front - 0.1), pr = Math.max(2, -SPEC.rear - 0.1), pw = Math.max(0.85, SPEC.W / 2 - 0.1);      // the probes follow the car's own body (the coupe keeps 2 / 2 / 0.85)
      for (const [fx_, bx] of [[pf, pw], [pf, -pw], [-pr, pw], [-pr, -pw]]) ok = ok && !car.blocked(px + sy * fx_ + cy * bx, pz + cy * fx_ - sy * bx);
      if (!ok) continue;
      const p = { x: px, z: pz }; ph.resolve(p, Math.max(0.9, SPEC.W / 2), car.groundAt(px, pz), SPEC.hgt); if (Math.hypot(p.x - px, p.z - pz) > 0.05) continue;
      car.reset(px, pz, yaw); view.snap = true; view.camYaw = yaw; wasted.hide(); return true;
    }
    return false;
  }
  /** teleport (R, the places) of the active car; a BOAT that cannot be set at the spot (it is on land: the start of the game) is left where it floats and the player is set down there on foot */
  function place(x, z, yawDeg) {
    if (placeVehicle(x, z, yawDeg)) return true;
    if (state.active && V.kind === 'boat') { exit(true); if (player) player.setPose(x, z, yawDeg, 0); return true; }
    return false;
  }

  // ---------------------------------------------------------------- model / camera
  const idle = { x: 0, z: 0, y: 0, yaw: 0, pitch: 0, roll: 0, steer: 0, steerAngle: 0, spin: 0, braking: false, boosting: false, air: false, h: 0, jet: 0 };
  function poseVehicle(v, spinDt, driven) {
    const c = driven ? v.car : (idle.x = v.parked.x, idle.z = v.parked.z, idle.y = v.parked.y, idle.yaw = v.parked.yaw, idle);
    const n = night ? night.value : 0;
    let gear = c.gear === 0 ? 'R' : ((c.speed || 0) < 1 && (c.throttle || 0) < 0.05 ? 'N' : String(c.gear || 1));
    if (v.def.hud.gearD && gear !== 'R' && gear !== 'N') gear = 'D';            // a one-gear electric car
    v.model.set({ x: c.x, y: c.y, z: c.z, yaw: c.yaw, pitch: c.pitch, roll: c.roll, steer: c.steer, steerAngle: c.steerAngle, spin: c.spin || 0, brake: c.braking ? 1 : 0, boost: c.boosting ? v.car.boost + 0.2 : 0, dt: spinDt || 0.016, lights: driven && n > 0.25, driven: !!driven, glow: driven ? 1 : 0.25,
      kmh: c.speed || 0, rpm: c.rpm ?? 0.15, gear, air: !!c.air, h: c.h || 0, jet: c.jet || 0, jetK: c.jetK || 1, flip: c.flip || 0, s0: c.pulse0 || 0, s1: c.pulse1 || 0 });
  }
  const poseModel = (spinDt) => poseVehicle(V, spinDt, state.active);
  // the parked cars: posed (and drawn) only while they can be seen: always within 70 m (their shadows), beyond that only inside the view frustum; the models switch their own frustum culling off
  const cullF = new THREE.Frustum(), _pm = new THREE.Matrix4(), _vm = new THREE.Matrix4(), _one = new THREE.Vector3(1, 1, 1), _sph = new THREE.Sphere();
  function parkedStep() {
    let frustum = false;
    for (const v of vehicles) {
      if (state.active && v === V) { v.model.root.visible = true; continue; }
      const p = v.parked, dx = p.x - camera.position.x, dz = p.z - camera.position.z, near = dx * dx + dz * dz < 70 * 70;
      let seen = near;
      if (!seen) {
        if (!frustum) { _vm.compose(camera.position, camera.quaternion, _one).invert(); _pm.multiplyMatrices(camera.projectionMatrix, _vm); cullF.setFromProjectionMatrix(_pm); frustum = true; }
        seen = cullF.intersectsSphere(_sph.set(_v.set(p.x, p.y + 1, p.z), 14));
      }
      v.model.root.visible = seen;
      if (seen) poseVehicle(v, 0, false);
    }
  }
  const ray = { x: 0, y: 0, z: 0 };
  function cameraStep(dt) {
    const sp = Math.min(1, car.speed / 200), sy = Math.sin(car.yaw), cy = Math.cos(car.yaw);
    const c = car.carCenter, target = view.mode === 2 ? null : _v;
    cockpitNear(view.mode === 2);
    // mouse look decays back
    view.idle += dt; if (view.idle > 1.6) { const k = Math.exp(-2.6 * dt); view.orbitY *= k; view.orbitP *= k; }
    // field of view widens with the speed / nitro
    const fovT = view.mode === 2 ? (SPEC.fovRest || 72) + 6 * Math.pow(sp, 1.2) + (car.boosting ? 2 : 0) : view.baseFov + 20 * Math.pow(sp, 1.2) + (car.boosting ? 9 : 0);      // cockpit: 72 at rest, ~79 flat out with the nitro
    view.fov += (fovT - view.fov) * (view.snap ? 1 : Math.min(1, 4 * dt));
    if (Math.abs(camera.fov - view.fov) > 0.05) { camera.fov = view.fov; camera.updateProjectionMatrix(); }
    view.shake = Math.max(0, view.shake - dt * 2.6);
    view.nitroAmp = (view.nitroAmp || 0) + ((car.boosting ? 0.022 : 0) - (view.nitroAmp || 0)) * Math.min(1, 4 * dt);
    const amp = view.shake * 0.35 + view.nitroAmp + 0.004 * sp * sp;
    if (view.mode === 2) {
      // cockpit: the driver's eye in the (pitching, rolling) body, the view = the body's orientation + the mouse look
      model.root.updateMatrixWorld(true);
      // head sway: the head lags the car (leans out of a corner, back under power, forward under braking) and dips a little with the speed; smoothed, no per-frame allocation
      const kh = view.snap ? 1 : Math.min(1, 5 * dt);
      view.hx += (clamp(-car.aLat * 0.0030, -0.045, 0.045) - view.hx) * kh;
      view.hz += (clamp(-car.aLong * 0.0018, -0.035, 0.035) - view.hz) * kh;
      view.hy += (-0.012 * sp - view.hy) * kh;
      camera.position.copy(model.root.localToWorld(_v.set(EYE.x + view.hx, EYE.y + view.hy, EYE.z + view.hz)));
      _q.copy(model.root.quaternion); _q2.setFromEuler(_e.set(0, Math.PI, 0)); _q.multiply(_q2);
      _q2.setFromEuler(_e.set(view.orbitP, view.orbitY, 0, 'YXZ')); _q.multiply(_q2);
      camera.quaternion.copy(_q);
      camera.position.x += (Math.random() - 0.5) * amp * 0.3; camera.position.y += (Math.random() - 0.5) * amp * 0.3;
      camera.up.set(0, 1, 0);
      return;
    }
    // chase: the camera swings behind the car, its heading follows the car partly toward the velocity (so a drift is seen from the side)
    const vel = Math.hypot(car.vx, car.vz), velYaw = Math.atan2(car.vx, car.vz);
    const tYaw = vel > 6 && car.vF > 0 ? car.yaw + clamp(angDiff(velYaw, car.yaw), -0.7, 0.7) * 0.55 : car.yaw;
    view.camYaw += angDiff(tYaw, view.camYaw) * Math.min(1, (view.snap ? 100 : 3.6) * dt);
    const a = view.camYaw + view.orbitY;
    const far = view.mode === 1, dT = (far ? 11.5 : 6.4) + 0.8 * (SPEC.len - 4.14) + 2.0 * sp + (car.boosting ? 0.9 : 0), hT = (far ? 5.2 : 2.35) + 0.9 * (SPEC.hgt - 1.3) + 0.4 * sp;       // a longer / taller car (the pickup) is followed from a bit further back and higher
    // distance / height / shake follow their targets smoothly (a nitro start used to pop the camera 0.9 m back in one frame)
    const ks = view.snap ? 1 : Math.min(1, 3.2 * dt);
    view.d = view.d === undefined || view.snap ? dT : view.d + (dT - view.d) * ks; view.h = view.h === undefined || view.snap ? hT : view.h + (hT - view.h) * ks;
    const d = view.d, h = view.h;
    const lookAhead = far ? 5 : 4.2;
    const gy = car.y - 0.5 * (car.h || 0);                                         // a hop lifts the car out of the frame a little instead of dragging the camera up with it
    const tx = c.x + Math.sin(car.yaw) * lookAhead, tz = c.z + Math.cos(car.yaw) * lookAhead, ty = gy + (far ? 0.9 : 1.15);
    let cx = c.x - Math.sin(a) * d * Math.cos(view.orbitP * 0.6), cz = c.z - Math.cos(a) * d * Math.cos(view.orbitP * 0.6);
    const hy = gy + h + d * Math.sin(Math.max(-0.3, view.orbitP * 0.8)) * 0.7;
    // keep the camera out of walls: march from the car to the wanted spot and stop before the first solid / building
    const dx = cx - c.x, dz = cz - c.z, N = 10; let t = 1;
    for (let i = 3; i <= N; i++) {
      const f = i / N, px = c.x + dx * f, pz = c.z + dz * f, py = gy + (hy - gy) * f + 0.3;
      if (L.insideBuilding(px, pz) || ph.columnBlocked(px, pz, 0.28, py - 0.3, py + 0.3)) { t = (i - 1) / N; break; }
    }
    t = Math.max(t, 0.28);
    cx = c.x + dx * t; cz = c.z + dz * t;
    const wantY = gy + (hy - gy) * Math.max(t, 0.45) + 0.0, gnd = car.groundAt(cx, cz) + 0.55;
    view.y = view.snap ? wantY : view.y + (wantY - view.y) * Math.min(1, 7 * dt);
    camera.position.set(cx + (Math.random() - 0.5) * amp, Math.max(view.y, gnd) + (Math.random() - 0.5) * amp, cz + (Math.random() - 0.5) * amp);
    camera.up.set(0, 1, 0);
    camera.lookAt(tx, ty - 0.2 * view.orbitP, tz);
    void target;
  }

  /** cockpit: the eye is 20-60 cm from the dash / roof / pillars, so the walker's 0.25 m near plane would slice them (main.js raises near with the height unless window.__fixedNear is set) */
  const COCKPIT_NEAR = 0.12;
  function cockpitNear(on) {
    if (on === view.nearOn) return;
    view.nearOn = on;
    if (typeof window === 'undefined') return;
    if (on) { view.prevFixed = window.__fixedNear; window.__fixedNear = true; camera.near = COCKPIT_NEAR; }
    else { window.__fixedNear = view.prevFixed; camera.near = 0.25; }
    camera.updateProjectionMatrix();
  }
  function syncPlayer() {
    if (!player) return;
    player.pos.set(car.x, car.y, car.z); player.vel.set(0, 0, 0); player.vy = 0; player.onGround = true;
    player.safe.x = car.x; player.safe.y = car.y; player.safe.z = car.z; player.smoothY = null;
    player.yaw = car.yaw + Math.PI; player.pitch = 0;
  }
  function trafficBlocker() {
    const tr = ctx.services.traffic; if (!tr || V.kind === 'boat') return;      // (a boat is on the water: nobody on the road needs to dodge it; the list was emptied at the exit from a car)
    const sy = Math.sin(car.yaw), cy = Math.cos(car.yaw);
    me.x = car.x + sy * SPEC.centerZ; me.z = car.z + cy * SPEC.centerZ; me.rotY = car.yaw; me.vx = car.vx; me.vz = car.vz; me.speed = Math.hypot(car.vx, car.vz);
    if (!tr.extraBlockers) tr.extraBlockers = extra;
    if (state.active && !extra.includes(me)) extra.push(me); else if (!state.active && extra.length) extra.length = 0;
  }

  // ---------------------------------------------------------------- per frame
  const wheelsW = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], exW = Array.from({ length: 8 }, () => new THREE.Vector3()), exUse = [], jetDir = new THREE.Vector3();
  let collisionRevision = -1;
  /** the active car hit a PARKED car of the garage: that car crumples too, by the mass share (a 2.97 t pickup hurts a parked 0.95 t Zhiguli far more than the reverse); the struck car stays a static solid */
  function strikeParked(ev) {
    const o = vehicles.find((f) => f !== V && f.box && f.box === ev.obstacle); if (!o) return;
    if (o.kind === 'boat') return;
    const mA = SPEC.mass || 1350, mB = o.spec.mass || 1350, p = o.parked, sy = Math.sin(p.yaw), cy = Math.cos(p.yaw), rx = ev.x - p.x, rz = ev.z - p.z;
    o.damage.hit({ type: 'hit', v: 1.4 * ev.v * mA / (mA + mB), localX: rx * cy - rz * sy, localZ: rx * sy + rz * cy, localNX: -(ev.nx * cy - ev.nz * sy), localNZ: -(ev.nx * sy + ev.nz * cy) });
  }
  function applyImpacts(effects = true) {
    for (const ev of car.events) {
      if (ev.type === 'hit') {
        const k = ev.obstacle?.source?.hitK ?? 1, v = ev.v * k;      // a knockable thing (core/knock.js) is not a wall: the car takes its hitK share of the blow
        damage.hit(k === 1 ? ev : { ...ev, v }); strikeParked(ev);
        if (effects && V.kind === 'boat') { sound.hit(v * 0.7); view.shake = Math.min(1.0, view.shake + v / 18); hud.flash(Math.min(0.4, v / 24)); }      // a boat has no body to crumple: a thump, a little shake, no sparks
        else if (effects) {
          sound.hit(v); view.shake = Math.min(1.4, view.shake + v / 10); hud.flash(Math.min(0.85, v / 14));
          fx.sparks(ev.x ?? car.x, car.y + 0.5, ev.z ?? car.z, ev.nx ?? -Math.sin(car.yaw), ev.nz ?? -Math.cos(car.yaw), Math.min(30, 8 + v * 2), 4 + v * 0.3);
        }
      } else if (effects) sound.scrape(ev.v * (ev.obstacle?.source?.hitK ?? 1));
    }
    car.damage = damage.amount; car.damageStage = damage.stage; car.damageSmoke = damage.smoke;
    if (collisionRevision !== damage.revision) { car.collisionSpec = crushedSpec(SPEC, damage.state); collisionRevision = damage.revision; }
  }
  /** the gas hop's own events (handling.js): sound, shake and the ring cloud. They are not blows, so they leave car.events here, before applyImpacts reads it */
  function hopEvents(effects = true) {
    const E = car.events;
    for (let i = 0; i < E.length; i++) {
      const ev = E[i]; if (ev.type !== 'hop' && ev.type !== 'cushion' && ev.type !== 'land' && ev.type !== 'dry') continue;
      E.splice(i--, 1);
      if (!effects) continue;
      if (ev.type === 'cushion') { sound.cushion(); continue; }
      if (ev.type === 'dry') { hud.deny(); continue; }                                     // a hop key press the tank cannot pay: the boost bar blinks
      if (ev.type === 'hop') { sound.hop(!!ev.flip); if (ev.flip) sound.flip(); view.shake = Math.min(1.4, view.shake + (ev.flip ? 0.45 : 0.2)); }
      else { sound.land(ev.v, ev.big); view.shake = Math.min(1.4, view.shake + ev.v / 14 + (ev.big ? 0.25 : 0)); }
      const big = ev.type === 'hop' ? ev.flip : ev.big;                                  // the barrel hop: a bigger ring cloud at take-off and at touchdown
      fx.ring(car.x, car.y - (car.h || 0), car.z, big ? 44 : ev.type === 'hop' || ev.v > 3 ? 24 : 12, big ? 1.5 : 1);
    }
  }
  function frame(dt) {
    parkedStep();
    if (wake) wake.update(dt, V.car, state.active && V.kind === 'boat');      // the foam of the boat: emitted while it is driven, fading afterwards
    if (!state.active) return;
    const locked = ctx.ui && ctx.ui.modalOpen;
    readInput(input);
    wasted.gate(input, car.vF, damage.amount);      // a junked car (100%) cannot be driven; E and J still work
    if (locked) holdInput(input, car.vF);      // a panel / the area prompt is open: the car holds (a fixed brake input would make a stopped car reverse: handling.js holdInput)
    if (dt > 0) {
      car.step(dt, input); hopTap = flipTap = false;
      hopEvents();
      applyImpacts();
      wasted.step(dt, damage.amount);
    }
    poseModel(dt);
    syncPlayer();
    if (dt > 0) {
      model.root.updateMatrixWorld(true);
      model.wheels.forEach((w, i) => w.pivot.getWorldPosition(wheelsW[i]));
      exUse.length = 0; for (let i = 0; i < Math.min(V.def.exhaust.length, exW.length); i++) { const e = V.def.exhaust[i]; exUse.push(model.root.localToWorld(exW[i].set(e.x, e.y, e.z))); }     // the car's own tail pipes (an electric pickup has none: no flame particles)
      jetDir.set(-Math.sin(car.yaw), 0.05, -Math.cos(car.yaw));                                                                                  // the nozzles fire backwards, 3 degrees up (the Roadster's cold-gas cloud, def.jetFx)
      if (V.kind !== 'boat') fx.update(dt, car, wheelsW, exUse, V.def.jetFx, jetDir);
      sound.update({ rpm: car.rpm, throttle: car.throttle, drifting: car.drifting, vL: car.vL, boosting: car.boosting, gear: car.gear, speed: car.speed }, true);
      hud.update(car, dt);
    }
    cameraStep(dt);
    view.snap = false;
    trafficBlocker();
  }

  let lastT = -1;
  ctx.onUpdate((dt, t) => { void t; frame(dt); if (!state.active) sound.update({ rpm: 0, throttle: 0, drifting: false, vL: 0, boosting: false, gear: 1, speed: 0 }, false); lastT = t; });

  // ---------------------------------------------------------------- keys / mouse
  if (typeof addEventListener === 'function') {
    addEventListener('keydown', (e) => {
      if (!state.active || e.repeat && e.code !== 'KeyG') return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) e.preventDefault();
      if (ctx.ui && ctx.ui.modalOpen) return;
      // The interaction handler consumes the enter event before this listener. First-time HUD/audio
      // setup can take longer than the debounce window; that same E must never immediately exit.
      if (e.code === 'KeyE' && !e.defaultPrevented && performance.now() - state.enteredAt > 350 && !e.ctrlKey && !e.metaKey) { e.preventDefault(); exit(); }
      else if (e.code === 'KeyV') api.setView((view.mode + 1) % 3);
      else if (e.code === 'KeyG') sound.horn();
      else if (e.code === 'KeyX') hopTap = true;
      else if (e.code === 'KeyC') flipTap = true;
      else if (e.code === 'KeyJ') { e.preventDefault(); api.repair(); }
    });
    addEventListener('mousemove', (e) => {
      if (!state.active || !player || player.inputLock > 1) return;
      const locked = document.pointerLockElement === player.dom;
      if (!locked && !(e.buttons & 1)) return;
      if (Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
      view.orbitY = clamp(view.orbitY - e.movementX * 0.0042, -Math.PI, Math.PI); view.orbitP = clamp(view.orbitP - e.movementY * 0.0035, -0.5, view.mode === 2 ? 0.62 : 0.9); view.idle = 0;
    });
  }

  // ---------------------------------------------------------------- the prompts next to the parked cars (the interaction layer offers the NEAREST one in reach: E gets into that car)
  if (ctx.interact) {
    for (const v of vehicles) ctx.interact.add({
      id: v.id === 'coupe' ? 'drive-car' : 'drive-' + v.id, radius: v.def.reach, label: v.def.label, labelEn: v.def.labelEn,
      at: () => ({ x: v.parked.x + Math.sin(v.parked.yaw) * v.spec.centerZ, y: v.parked.y + 0.8, z: v.parked.z + Math.cos(v.parked.yaw) * v.spec.centerZ }),
      enabled: () => !state.active && !!player && !player.fly && !player.riding && !player.isUnderground(),
      onUse: () => enter(v),
    });
  }

  /** Arrival of a hand-off (docs/AREAS.md): get into car `spec.id`, put it at (x, z) facing the camera yaw (degrees), restore its view and its four damage scalars. false (and the walker stays) when the car cannot be placed there. */
  function arrive(spec, x, z, yawDeg) {
    if (state.active || !spec || !enter(spec.id)) return false;
    if (!placeVehicle(x, z, yawDeg)) { exit(true); if (player) player.setPose(x, z, yawDeg, 0); return false; }      // (exit puts the walker beside the garage car: back to the resolved arrival pose)
    if (spec.view !== undefined && spec.view !== null) api.setView(Number(spec.view) || 0);
    const d = Array.isArray(spec.d) ? spec.d : [0, 0, 0, 0];
    if (d.some((v) => v > 0)) {
      [damage.state.front, damage.state.rear, damage.state.left, damage.state.right] = d.map((v) => Math.max(0, Math.min(1, Number(v) || 0)));
      damage.state.revision++; damage.sync(); wasted.reset(damage.amount);
      car.damage = damage.amount; car.damageStage = damage.stage; car.damageSmoke = damage.smoke; car.collisionSpec = crushedSpec(SPEC, damage.state); collisionRevision = damage.revision;
      model.setView(view.mode === 2); damage.hideDetached(); hud.update(car, 0);
    }
    return true;
  }
  const api = {
    get active() { return state.active; }, get car() { return car; }, get parked() { return parked; }, get model() { return model; }, get damage() { return damage; }, hud, fx, sound, view,
    enter, exit, place, arrive,
    /** the garage: one vehicle per car { id, def, model, car (handling state), parked, damage, spec, box }; `vehicle` is the current / last driven one; enter('truck') gets into a car by id */
    fleet, get vehicle() { return V; }, vehicleById: (id) => vehicles.find((f) => f.id === id),
    /** the motor boats ({ id: 'boat', kind: 'boat', def, model, car, parked, damage (empty), spec, box }), docs/AREAS.md "The motor boat"; `vehicles` = the cars and the boats */
    boats, vehicles, wake,
    repair() {
      if (V.kind === 'boat') return false;      // a boat has no body to repair
      if (Math.hypot(car.vx, car.vz) > 1.4) { ctx.ui.toast('Stop to repair'); return false; }
      damage.repair(); wasted.hide(); car.damage = car.damageSmoke = 0; car.damageStage = damage.stage; fx.clear();
      car.collisionSpec = null;
      model.setView(view.mode === 2); damage.hideDetached();
      hud.update(car, 0);
      ctx.ui.toast('Car repaired'); return true;
    },
    setView(i) { view.mode = i; model.setView(i === 2); damage.hideDetached(); if (i !== 2) cockpitNear(false); view.snap = true; if (i !== 2) view.camYaw = car.yaw; },
    /** test hook: step the physics for `seconds` with a fixed input ({ thr, brk, steer, hand, nitro, jump (X hop), flip (C barrel hop) }) in 1/60 s frames, then refresh the model / camera / player */
    sim(seconds, inp = {}, frames = null) {
      if (!state.active) enter();
      const dt = 1 / 60, n = Math.round(seconds / dt), full = { thr: 0, brk: 0, steer: 0, hand: false, nitro: false, jump: false, flip: false, ...inp };
      for (let i = 0; i < n; i++) { wrecks.step(dt); car.step(dt, wasted.gate({ ...(typeof inp === 'function' ? inp(i * dt) : full) }, car.vF, damage.amount)); hopEvents(false); applyImpacts(false); wasted.step(dt, damage.amount); if (wake && V.kind === 'boat') wake.update(dt, car, true); if (frames) frames(i, car); }
      view.snap = true; model.root.updateMatrixWorld(true); poseModel(0); syncPlayer(); cameraStep(0); view.snap = false; hud.update(car, 0.016);
      return { x: +car.x.toFixed(2), z: +car.z.toFixed(2), speed: +car.speed.toFixed(1), yaw: +(car.yaw / DEG).toFixed(1), gear: car.gear, boost: +car.boost.toFixed(2), vL: +car.vL.toFixed(2) };
    },
    /** test hook: put the (driving) car exactly here */
    teleport(x, z, yawRad) { if (!state.active) enter(); car.reset(x, z, yawRad); view.snap = true; view.camYaw = yawRad; poseModel(0); },
  };
  ctx.drive = api; ctx.services.drive = api; if (typeof window !== 'undefined') window.__drive = api;
  void lastT; void THREE_;
}
