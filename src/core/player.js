// Third-person walker: V cycles near / far / first person. Pointer-lock mouse look (drag-look fallback), WASD / arrows, Shift run, Space jump,
// F flight (take-off, then W/S fly along the view, Space/E up, Q/C down, F lands), touch joystick + drag look on phones.
//
// Underground support (docs/UNDERGROUND.md): the walker follows ANY surface of core/physics.js (terrain, decks, ramps, escalators, stairs, floors
// at -60 m), is carried by conveyors, keeps its feet on ramps / stairs going down (no airborne flicker), never steps off its surfaces into a void,
// is brought back to its last safe spot if it ever finds itself falling through nothing; flight is refused underground and on board
// a train; player.board({ frame, local, bounds }) rides a moving frame (a train car), player.alight(pose) steps off; inputLock pauses the input
// (modal panels, core/ui.js).
// WATER IS REACHABLE (docs/AREAS.md 13.7): a river, canal, pond or basin is terrain: the walker steps off a quay edge (where no fence stands) or through a broken fence, falls into the trench and WADES on the bed
// (physics.waterLevel: the feet depth slows him down, `player.depth` / `player.under` feed the underwater tint of core/water-view.js); a flight landing over water is allowed like anywhere else.
import * as THREE from 'three';
import { STEP_HEIGHT, DROP_MAX } from './physics.js';
import {footCameraFraction} from '../world/character/camera.js';
import {JUMPS} from '../world/character/jump-timing.js';

const DEG = Math.PI / 180;
const FLY_SPEED = 3.4;                      // flight speed = walking / running speed × this
const FLY_EASE = 5;                         // 1/s: how fast the flight velocity follows the input (a soft glide, no snap)
const TAKEOFF = { time: 0.55, speed: 9 };   // F on the ground: 9 m/s of extra climb for 0.55 s ≈ 4 m of eased lift, so take-off is visible at once
const FLY_MARGIN = 100;                     // m the flyer may go beyond the walkable area (still inside the modelled map)
const CEILING = 650;                        // m
const FALL_MAX = 35;                        // m/s: fastest descent after a flight
const LOOK_SMOOTH = 0.04;                   // s: time constant of the look easing (~2.5 frames at 60 fps); ?smooth=<ms> overrides, 0 = raw
const LOOK_SPIKE = 400;                     // px: a single mouse event beyond this is a driver / pointer-lock artefact, not a hand movement
const STICK_DOWN = 0.75;                    // m: going down a ramp / stairs the feet follow the surface this far (a step of the stairs is ~0.2)
const RESCUE_DROP = 6;                      // m: falling this far below the last safe spot with no surface under the feet -> back to the safe spot
const RIDE_WALK = 0.7;                      // walking inside a train car is slower than in the street
const UNDER_EPS = 0.05;                     // m below the terrain that counts as underground
const WADE_MIN = 0.45;                      // wading: the speed factor never drops below this (deep water: chest height and more)
const WADE_DEEP = 1.7;                      // m of water over the feet at which the slowdown is full

const _P = { y: -Infinity, kind: null, item: null };   // scratch surface query
const _cv = { x: 0, z: 0 };

export class Player {
  constructor(camera, dom, physics, bounds) {
    this.camera = camera; this.dom = dom; this.physics = physics; this.bounds = bounds;
    this.pos = new THREE.Vector3(0, 0, 0); // feet
    this.vel = new THREE.Vector3();
    this.vy = 0;
    this.yaw = 0; this.pitch = 0;
    this.facingYaw=0;this.speed=0;this.animation='Idle';this.jump=null;
    this.view=0;this.cameraDistance=4.6;this.cameraSnap=true;
    this.cameraTarget=new THREE.Vector3();this.cameraOffset=new THREE.Vector3();
    this.shotView=typeof location!=='undefined'&&new URLSearchParams(location.search).has('shot');
    this.eye = 1.52; this.radius = 0.3; this.height = 1.7;
    this.walk = 3.6; this.run = 8.4;
    this.fly = false; this.enabled = false; this.onGround = true;
    this.lift = 0;          // s of take-off climb still to give
    this.descent = false;   // dropping straight down after F (terminal speed, flare, no steering: it lands where it was checked)
    this.roof = null;       // height of the building roof being stood on (kept while airborne, e.g. in a jump), else null
    this.onFly = null;      // (result) => void: 'on' | 'off' | 'roof' (touched down on a roof) | 'water' | 'blocked' | 'underground' | 'ride', for the HUD
    this.onRescue = null;   // () => void: the walker fell through nothing and was put back on its last safe spot
    this.solidAt = null;    // (x, z, r) => boolean: is the terrain there covered by a building (colliders are hollow wall boxes)? Set by the world.
    this.clampXZ = null;    // (x, z, margin) => [x, z]: the nearest point of the walkable area, which is a UNION of rectangles with empty notches (layout.clampToPlay); null = the `bounds` rectangle. Set by the world.
    this.keys = new Set();
    this.bob = 0; this.smoothY = null;
    this.look = { dx: 0, dy: 0 };          // raw mouse / touch movement since the last frame (pixels)
    this.turn = { yaw: 0, pitch: 0 };      // turn still to be applied to the view (radians): the view eases toward it
    this.smoothing = LOOK_SMOOTH;          // seconds; 0 = raw, unfiltered look
    this.touchMove = new THREE.Vector2();
    this.distance = 0;
    this.time = 0;                         // simulation time (ctx.time): main.js sets it before update(); a ride frame is a pure function of it
    this.inputLock = 0;                    // > 0: movement / look / F / jump are ignored (a modal panel is open)
    this.ride = null;                      // while on board: { frame, local, bounds, lookRelative, onExit, v }
    this.supportItem = null;               // the physics item under the feet while grounded (ramp / escalator / stairs step / walk box), else null
    this.stick = false;                    // grounded on a ramp / stairs: the feet follow the surface downhill
    this.noclipUnder = false;              // free camera put underground by setPose (debug / screenshots): flies without the terrain floor
    this.safe = { x: 0, y: 0, z: 0 };      // last grounded spot (rescue target)
    this.depth = 0;                        // m of water over the feet (0 on dry ground; walking only), set every frame from physics.waterLevel
    this.under = false;                    // the eyes are below the water surface (the underwater tint of core/water-view.js)
    this.wade = 1;                         // the speed factor of wading (1 on dry ground)
    this._bind();
  }

  _bind() {
    const d = this.dom;
    addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      this.keys.add(e.code);
      if (this.inputLock > 0) return;
      if (e.code === 'KeyF' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) this.toggleFly();   // not on key auto-repeat, not Ctrl+F (browser find)
      if(e.code==='KeyV'&&!e.repeat&&this.enabled&&!this.fly&&!this.ride&&!e.ctrlKey&&!e.metaKey&&!e.altKey)this.cycleView();
      if (e.code === 'Space' && this.enabled && !this.ride && (this.onGround || this.fly)) { if (!this.fly&&!e.repeat) this.requestJump(); e.preventDefault(); }      // (a push off the bed is weaker)
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    // mouse look
    let dragging = false, lx = 0, ly = 0;
    d.addEventListener('mousedown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
    addEventListener('mouseup', () => { dragging = false; });
    addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (document.pointerLockElement === d) { if (Math.abs(e.movementX) < LOOK_SPIKE && Math.abs(e.movementY) < LOOK_SPIKE) { this.look.dx += e.movementX; this.look.dy += e.movementY; } }
      else if (dragging) { this.look.dx += (e.clientX - lx) * 1.4; this.look.dy += (e.clientY - ly) * 1.4; lx = e.clientX; ly = e.clientY; }
    });
    // touch: left half = move stick, right half = look
    const touches = new Map();
    d.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) touches.set(t.identifier, { x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, left: t.clientX < innerWidth * 0.45 });
      e.preventDefault();
    }, { passive: false });
    d.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        const s = touches.get(t.identifier); if (!s) continue;
        if (s.left) { this.touchMove.set((t.clientX - s.x0) / 60, (t.clientY - s.y0) / 60).clampLength(0, 1); }
        else { this.look.dx += (t.clientX - s.x) * 2.2; this.look.dy += (t.clientY - s.y) * 2.2; }
        s.x = t.clientX; s.y = t.clientY;
      }
      e.preventDefault();
    }, { passive: false });
    const end = (e) => { for (const t of e.changedTouches) { const s = touches.get(t.identifier); if (s && s.left) this.touchMove.set(0, 0); touches.delete(t.identifier); } };
    d.addEventListener('touchend', end); d.addEventListener('touchcancel', end);
  }

  requestLock() { try { const p = this.dom.requestPointerLock?.(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* drag-look fallback */ } }

  setView(view) {this.view=((Math.trunc(Number(view)||0)%3)+3)%3;this.cameraSnap=true;this.applyCamera(0);return this.view;}
  cycleView() {return this.setView(this.view+1);}
  get firstPerson(){return this.view===2||this.fly||!!this.ride||this.shotView;}
  requestJump(){
    if(!this.enabled||this.inputLock>0||this.fly||this.ride||!this.onGround||(this.jump&&this.jump.phase!=='land'))return false;
    this.jump={phase:'anticipation',time:0,clip:this.speed>this.walk*1.2?'RunningJump':'Jump',launchSpeed:this.depth>.3?3:4.2};return true;
  }

  /** True when the feet are below the terrain (a tunnel, a station, an escalator below the street). */
  isUnderground() { return this.pos.y < this.physics.heightAt(this.pos.x, this.pos.z) - UNDER_EPS; }
  get riding() { return !!this.ride; }

  /** F (or the Fly chip). Taking off lifts the player a few metres at once. Landing drops the player straight down onto the spot below;
   *  it is refused over the river, inside a building and where a tree or car is in the way (the player would end on the river bed or
   *  in a hollow tower). Level roofs are fine to land on. Flight is refused underground ('underground') and on board a train ('ride').
   *  Returns 'on' | 'off' | 'water' | 'blocked' | 'underground' | 'ride' and reports the same through onFly. */
  toggleFly(on = !this.fly) {
    if (!this.enabled || on === this.fly) return this.fly ? 'on' : 'off';
    let r = 'on';
    if (on) {
      const why = this.ride ? 'ride' : this.isUnderground() ? 'underground' : null;
      if (why) { if (this.onFly) this.onFly(why); return why; }
      this.fly = true; this.lift = TAKEOFF.time; this.descent = false; this.roof = null; this.vy = 0; this.vel.y = 0; this.supportItem = null; this.stick = false;this.jump=null;
    } else {
      r = this.landingBlocked();
      if (!r) {
        const g = this.physics.groundHeight(this.pos.x, this.pos.z, this.pos.y);
        this.fly = false; this.noclipUnder = false; this.lift = 0; this.vy = Math.min(0, this.vel.y); this.vel.set(0, 0, 0); this.descent = this.pos.y - g > 1.5;
        r = 'off';
      }
    }
    if (this.onFly) this.onFly(r);
    return r;
  }

  /** null when the player may land here, else why not: 'blocked' (solid in the way / no level spot / outside the walkable area / over a shaft). Water is NOT a reason (the world rule: the bed of a river or a pond is a floor like another). */
  landingBlocked() {
    const { x, z } = this.pos, b = this.bounds, ph = this.physics;
    if (ph.inHole(x, z, this.radius + 0.3)) return 'blocked';           // never touch down on the mouth of an escalator shaft: the drop would end 60 m below
    const g = ph.groundHeight(x, z, this.pos.y);
    if (this.clampXZ) { const c = this.clampXZ(x, z, 0); if (c[0] !== x || c[1] !== z) return 'blocked'; }
    else if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return 'blocked';
    const clear = () => !ph.columnBlocked(x, z, this.radius, g + STEP_HEIGHT, this.pos.y + this.height);
    if (ph.roofTop(x, z) === g) return this.roofSpotLevel(x, z, g) && clear() ? null : 'blocked';                   // touching down on a roof: level, clear of edges, parapets and slopes
    // inside a building footprint: refused, unless a raised deck (podium plaza, platform, bridge: > 2.5 m over the terrain) is what we would land on; low plinths / steps don't count
    if (this.solidAt && g < ph.heightAt(x, z) + 2.5 && this.solidAt(x, z, this.radius + 0.6)) return 'blocked';
    return clear() ? null : 'blocked';
  }

  /** a roof landing needs level roof all around (no edge, parapet, plant-room wall or slope steeper than a step within ~1 m) */
  roofSpotLevel(x, z, g) {
    const d = this.radius + 0.55;
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, rt = this.physics.roofTop(x + Math.cos(a) * d, z + Math.sin(a) * d);
      if (!(Math.abs(rt - g) <= STEP_HEIGHT)) return false;      // NaN (no roof: an edge) fails too
    }
    return true;
  }

  /** x,z world; yaw/pitch in degrees (yaw 0 = north). y optional: given -> flying at that eye height, else standing on the ground (never on a roof).
   *  opts.stand = true with y: STAND on the highest surface (terrain, deck, floor ...) whose top is not above y (metres, FEET level): the way for
   *  tests / screenshots to put a WALKING player on a platform at y = -60. An underground free camera (y below the terrain, no stand) is a
   *  no-clip debug camera: it never comes from player input. Ends a ride. */
  setPose(x, z, yawDeg = 0, pitchDeg = 0, y = null, opts = {}) {
    if (this.ride) this._endRide({ x, z, cancelled: true });
    const ph = this.physics;
    this.pos.set(x, 0, z);
    this.noclipUnder = false;
    if (y !== null && opts.stand) {
      const g = ph.groundHeight(x, z, y - STEP_HEIGHT + 0.05, false);
      this.pos.y = g > -Infinity ? g : y; this.fly = false;
    } else {
      this.pos.y = y !== null ? y - this.eye : ph.groundHeight(x, z, 1e9, false);
      this.fly = y !== null;
      if (this.fly && this.pos.y < ph.heightAt(x, z) - UNDER_EPS) this.noclipUnder = true;
    }
    this.yaw = yawDeg * DEG; this.pitch = pitchDeg * DEG; this.vy = 0; this.smoothY = null;
    this.facingYaw=this.yaw;this.jump=null;this.speed=0;this.animation='Idle';this.cameraSnap=true;
    this.vel.set(0, 0, 0); this.lift = 0; this.descent = false; this.roof = null; this.turn.yaw = this.turn.pitch = 0; this.look.dx = this.look.dy = 0;
    this.supportItem = null; this.stick = false; this.onGround = !this.fly;
    this.safe.x = x; this.safe.y = this.pos.y; this.safe.z = z;
    this.applyCamera(0);
  }

  // ------------------------------------------------------------------ riding (a train car)
  /** Put the player into a moving frame.
   *   o.frame(t) -> { x, y, z, yaw }: world position of the frame origin and its heading (rotY convention: 0 faces +Z, positive turns toward +X);
   *                MUST be a pure function of t (ctx.time) so that screenshots / fast-forward agree.
   *   o.local { x, y, z }: where the player stands in the frame (y = the floor); omitted: the current position expressed in the frame.
   *   o.bounds { x0, x1, z0, z1 }: the player can walk inside this rectangle of the frame (a car is about 2.6 x 19 m).
   *   o.lookRelative (default true): the view yaw is relative to the frame (the view turns with the car).
   *   o.onExit(pose): called by alight() / setPose(). Physics, roofs and the ground are suspended while riding. Returns the ride object. */
  board(o) {
    const frame = o.frame, fr = frame(this.time), phi = fr.yaw || 0, c = Math.cos(phi), s = Math.sin(phi);
    let local = o.local;
    if (!local) { const dx = this.pos.x - fr.x, dz = this.pos.z - fr.z; local = { x: dx * c - dz * s, y: this.pos.y - fr.y, z: dx * s + dz * c }; }
    const R = this.ride = { frame, local: { x: local.x, y: local.y ?? 0, z: local.z }, bounds: o.bounds || null, lookRelative: o.lookRelative !== false, onExit: o.onExit || null, v: { x: 0, z: 0 } };
    this._clampRide(R);
    this.fly = false; this.noclipUnder = false; this.lift = 0; this.descent = false; this.roof = null; this.vy = 0; this.vel.set(0, 0, 0);
    this.jump=null;this.speed=0;this.animation='Idle';
    this.supportItem = null; this.stick = false; this.onGround = true; this.smoothY = null; this.turn.yaw = this.turn.pitch = 0;
    if (R.lookRelative) this.yaw -= phi;                 // keeps the world view direction the same at the moment of boarding
    this._rideCamera(0, fr);
    return R;
  }
  /** Step off the frame onto pose { x, y, z, yaw (degrees, camera convention: 0 = north, as setPose), pitch? }. y omitted: the highest surface under (x,z)
   *  not above the current feet + 0.5 m. Calls the board() onExit(pose). Returns false when not riding. */
  alight(pose = {}) {
    const R = this.ride; if (!R) return false;
    const fr = R.frame(this.time);
    if (R.lookRelative) this.yaw += fr.yaw || 0;          // back to a world yaw
    this._endRide(pose);
    return true;
  }
  _endRide(pose) {
    const R = this.ride; this.ride = null;
    const x = pose.x ?? this.pos.x, z = pose.z ?? this.pos.z;
    let y = pose.y;
    if (y === undefined || y === null) { y = this.physics.groundHeight(x, z, this.pos.y + 0.5, false); if (!(y > -Infinity)) y = this.pos.y; }
    if (!pose.cancelled) {
      this.pos.set(x, y, z);
      if (pose.yaw !== undefined) this.yaw = pose.yaw * DEG;
      if (pose.pitch !== undefined) this.pitch = pose.pitch * DEG;
    }
    this.fly = false; this.vy = 0; this.vel.set(0, 0, 0); this.onGround = true; this.smoothY = null; this.turn.yaw = this.turn.pitch = 0;
    this.supportItem = null; this.stick = false; this.safe.x = this.pos.x; this.safe.y = this.pos.y; this.safe.z = this.pos.z;
    if (!pose.cancelled) this.applyCamera(0);
    if (R && R.onExit) { try { R.onExit({ x, y, z, yaw: pose.yaw, cancelled: !!pose.cancelled }); } catch (e) { console.error('ride onExit', e); } }
  }
  _clampRide(R) {
    const b = R.bounds; if (!b) return;
    if (R.local.x < b.x0) { R.local.x = b.x0; R.v.x = 0; } else if (R.local.x > b.x1) { R.local.x = b.x1; R.v.x = 0; }
    if (R.local.z < b.z0) { R.local.z = b.z0; R.v.z = 0; } else if (R.local.z > b.z1) { R.local.z = b.z1; R.v.z = 0; }
  }
  _rideStep(dt, f, s, running) {
    const R = this.ride, fr = R.frame(this.time), phi = fr.yaw || 0;
    const psi = R.lookRelative ? this.yaw : this.yaw - phi;               // view yaw in the frame
    const fx = -Math.sin(psi), fz = -Math.cos(psi), rx = Math.cos(psi), rz = -Math.sin(psi);
    let mx = fx * f + rx * s, mz = fz * f + rz * s;
    const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
    const speed = (running ? this.run : this.walk) * RIDE_WALK, k = Math.min(1, 10 * dt);
    R.v.x += (mx * speed - R.v.x) * k; R.v.z += (mz * speed - R.v.z) * k;
    R.local.x += R.v.x * dt; R.local.z += R.v.z * dt;
    this._clampRide(R);
    this._rideCamera(dt, fr);
  }
  _rideCamera(dt, fr) {
    const R = this.ride, phi = fr.yaw || 0, c = Math.cos(phi), s = Math.sin(phi), l = R.local;
    const wx = fr.x + l.x * c + l.z * s, wz = fr.z - l.x * s + l.z * c, wy = fr.y + l.y;
    this.pos.set(wx, wy, wz); this.vel.set(0, 0, 0);
    const sp = Math.hypot(R.v.x, R.v.z);
    if (sp > 0.3) this.bob += dt * sp * 2.1; else this.bob *= 0.9;
    const bobY = Math.sin(this.bob * 2) * 0.022 * Math.min(1, sp / 3);
    this.smoothY = wy + this.eye;
    this.camera.position.set(wx, this.smoothY + bobY, wz);
    this.camera.rotation.set(this.pitch, this.yaw + (R.lookRelative ? phi : 0), Math.sin(this.bob) * 0.0025 * Math.min(1, sp / 3), 'YXZ');
  }

  update(dt) {
    dt = Math.min(dt, 0.05);
    const sens = 0.0022, tr = this.turn, locked = this.inputLock > 0;
    if(locked&&this.jump?.phase==='anticipation')this.jump=null;
    if (locked) this.look.dx = this.look.dy = 0;
    // Look: the raw movement (whole pixels, uneven frame times, bursts of touch events) goes into a pending turn and the view eases toward it
    // (frame-rate independent), so slow mouse movement and irregular frames no longer show as steps. The total turn is unchanged.
    tr.yaw -= this.look.dx * sens; tr.pitch -= this.look.dy * sens; this.look.dx = this.look.dy = 0;
    const kt = this.smoothing > 0 ? 1 - Math.exp(-dt / this.smoothing) : 1;
    this.yaw += tr.yaw * kt; this.pitch += tr.pitch * kt; tr.yaw -= tr.yaw * kt; tr.pitch -= tr.pitch * kt;
    if (Math.abs(this.pitch) > 85 * DEG) { this.pitch = THREE.MathUtils.clamp(this.pitch, -85 * DEG, 85 * DEG); tr.pitch = 0; }        // at the stop: drop what is left, it would fight the next turn back
    const k = this.keys;
    let f = 0, s = 0, u = 0;
    if (this.enabled && !locked) {
      if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) s -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) s += 1;
      if (k.has('KeyE') || k.has('Space')) u += 1;
      if (k.has('KeyQ') || k.has('KeyC') || k.has('ControlLeft')) u -= 1;
      f -= this.touchMove.y; s += this.touchMove.x;
    }
    const running = !locked && (k.has('ShiftLeft') || k.has('ShiftRight') || this.touchMove.length() > 0.95);
    if (this.ride) { this._rideStep(dt, f, s, running); return; }
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw); // forward
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);  // right
    if (this.fly) { this.depth = 0; this.wade = 1; this._fly(dt, f, s, u, running, fx, fz, rx, rz); this.applyCamera(dt); const wf = this.physics.waterLevel ? this.physics.waterLevel(this.pos.x, this.pos.z) : null; this.under = wf !== null && this.pos.y + this.eye < wf; return; }

    const ph = this.physics;
    if(this.jump){
      const jump=this.jump,timing=JUMPS[jump.clip];jump.time+=dt;
      if(jump.phase==='anticipation'&&jump.time>=timing.anticipation){jump.phase='air';jump.time=0;this.vy=jump.launchSpeed;this.onGround=false;}
      else if(jump.phase==='land'&&jump.time>=timing.recovery)this.jump=null;
    }
    // standing on a roof: remember its height (kept while airborne, so a jump cannot carry the player over the edge)
    if (this.onGround) { const rt = ph.roofTop(this.pos.x, this.pos.z); this.roof = Math.abs(rt - this.pos.y) < 0.2 ? rt : null; }
    // wading: the water over the feet slows the walker (the camera stays at the eye height above the bed)
    const wl = ph.waterLevel ? ph.waterLevel(this.pos.x, this.pos.z) : null;
    this.depth = wl !== null ? Math.max(0, wl - this.pos.y) : 0;
    this.wade = this.depth > 0.05 ? Math.max(WADE_MIN, 1 - (1 - WADE_MIN) * Math.min(1, this.depth / WADE_DEEP)) : 1;
    this.under = wl !== null && this.pos.y + this.eye < wl;
    const speed = (running ? this.run : this.walk) * this.wade;
    let mx = fx * f + rx * s, mz = fz * f + rz * s;
    if (this.descent) mx = mz = 0;                                     // dropping from a flight: no steering, it lands where it was checked
    const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
    const acc = this.onGround ? 10 : 2.5;
    this.vel.x += (mx * speed - this.vel.x) * Math.min(1, acc * dt);
    this.vel.z += (mz * speed - this.vel.z) * Math.min(1, acc * dt);

    // a conveyor / escalator under the feet carries the player on top of the own walking (the own velocity stays the input: no head bob while standing)
    let cvx = 0, cvz = 0;
    if (this.onGround && this.supportItem && this.supportItem.conv) { ph.conveyorVelocity(this.supportItem, _cv); cvx = _cv.x; cvz = _cv.z; }

    // substeps keep collisions stable
    const sx = (this.vel.x + cvx) * dt, sz = (this.vel.z + cvz) * dt;
    const dist = Math.hypot(sx, sz);
    const n = Math.max(1, Math.ceil(dist / 0.12));
    const p = { x: this.pos.x, z: this.pos.z };
    let feet = this.pos.y;                                              // feet height as the substeps walk up a ramp / stairs (only tracked while on one)
    const track = this.onGround && this.stick;
    for (let i = 0; i < n; i++) {
      const ox = p.x, oz = p.z;
      p.x += sx / n; p.z += sz / n;
      ph.resolve(p, this.radius, feet, this.height);
      // don't walk up anything steeper than a step; on a roof the roof is the floor: an edge (no roof), a wall, a steep slope or a drop stops the walker
      const S = ph.surfaceAt(p.x, p.z, feet, true, _P), g = S.y;
      let refuse = g - feet > STEP_HEIGHT || (this.roof !== null && !(Math.abs(ph.roofTop(p.x, p.z) - this.roof) <= STEP_HEIGHT));
      // below the terrain or at a terrain hole a walker stays on its surfaces: a step down into a void, or more than DROP_MAX onto another surface, is refused like a wall
      if (!refuse && this.onGround && !this.descent && feet - g > DROP_MAX && S.kind !== 'terrain' && (feet < ph.heightAt(p.x, p.z) - UNDER_EPS || ph.inHole(p.x, p.z))) refuse = true;
      if (refuse) { p.x = ox; p.z = oz; } else if (track && g > feet) feet = g;
    }
    const b = this.bounds;
    if (this.clampXZ) { const c = this.clampXZ(p.x, p.z, 0); p.x = c[0]; p.z = c[1]; }
    else { p.x = THREE.MathUtils.clamp(p.x, b.x0, b.x1); p.z = THREE.MathUtils.clamp(p.z, b.z0, b.z1); }
    const movedX=p.x-this.pos.x-cvx*dt,movedZ=p.z-this.pos.z-cvz*dt;
    this.speed=dt>0?Math.hypot(movedX,movedZ)/dt:this.speed;
    if(this.speed>.12){const direction=Math.atan2(-movedX,-movedZ);this.facingYaw+=Math.atan2(Math.sin(direction-this.facingYaw),Math.cos(direction-this.facingYaw))*(1-Math.exp(-14*dt));}
    this.distance += Math.max(0, Math.hypot(movedX,movedZ));
    this.pos.x = p.x; this.pos.z = p.z;
    const S2 = ph.surfaceAt(this.pos.x, this.pos.z, this.pos.y, true, _P), g = S2.y, item = S2.item;
    if (this.onGround && (this.stick || (item && item.sticky)) && !this.descent && this.vy <= 0 && this.pos.y > g && this.pos.y - g <= STICK_DOWN) {
      this.pos.y = g; this.vy = 0; this.onGround = true;                 // going down a ramp / stairs: the feet follow the surface
    } else {
      this.vy -= 12 * dt;
      if (this.descent) this.vy = Math.max(this.vy, -Math.min(FALL_MAX, 3 + 1.2 * (this.pos.y - g)));   // after a flight: terminal speed, then a flare into the ground
      this.pos.y += this.vy * dt;
      if (this.pos.y <= g) { this.pos.y = g; this.vy = 0; this.onGround = true; }
      else if (this.pos.y - g < 0.06 && this.vy <= 0) { this.pos.y = g; this.vy = 0; this.onGround = true; }
      else this.onGround = false;
    }
    this.supportItem = this.onGround ? item : null;
    if(this.jump?.phase==='air'&&this.onGround){this.jump.phase='land';this.jump.time=0;}
    else if(this.jump?.phase==='anticipation'&&!this.onGround){this.jump.phase='air';this.jump.time=0;}
    else if(!this.onGround&&!this.jump&&!this.descent)this.jump={phase:'air',time:0,clip:this.speed>this.walk*1.2?'RunningJump':'Jump',launchSpeed:4.2};
    this.animation=this.jump?.clip||(this.speed<.12?'Idle':this.speed>this.walk*1.2?'Run':'Walk');
    this.stick = this.onGround && !!(item && item.sticky);
    if (this.onGround) { if (g > -Infinity) { this.safe.x = this.pos.x; this.safe.y = this.pos.y; this.safe.z = this.pos.z; } }
    else if (g === -Infinity && this.pos.y < this.safe.y - RESCUE_DROP) {   // falling through nothing (jumped over a rail into a void): never leave the player there
      this.pos.set(this.safe.x, this.safe.y, this.safe.z); this.vy = 0; this.vel.set(0, 0, 0); this.onGround = true; this.smoothY = null;
      this.jump=null;this.animation='Idle';this.speed=0;this.cameraSnap=true;
      if (this.onRescue) this.onRescue();
    }
    if (this.onGround && this.descent) {                                // touched down
      this.descent = false;
      const rt = ph.roofTop(this.pos.x, this.pos.z);
      if (this.onFly && Math.abs(rt - this.pos.y) < 0.2) this.onFly('roof');
    }
    this.applyCamera(dt);
  }

  /** Flight (noclip): W/S fly along the view, so looking up and pressing W climbs; A/D strafe; Space/E rise, Q/C/Ctrl sink.
   *  The velocity glides toward the input; the flyer stays above the ground, under the ceiling and inside the map. The terrain is a floor
   *  everywhere (also over the mouth of an escalator shaft), so a flyer can never dive into the underground. */
  _fly(dt, f, s, u, running, fx, fz, rx, rz) {
    const speed = (running ? this.run : this.walk) * FLY_SPEED, cp = Math.cos(this.pitch);
    let dx = fx * cp * f + rx * s, dy = Math.sin(this.pitch) * f + u, dz = fz * cp * f + rz * s;
    const dl = Math.hypot(dx, dy, dz); if (dl > 1) { dx /= dl; dy /= dl; dz /= dl; }
    const lift = this.lift > 0 ? TAKEOFF.speed : 0; this.lift = Math.max(0, this.lift - dt);
    const e = Math.min(1, FLY_EASE * dt), v = this.vel;
    v.x += (dx * speed - v.x) * e; v.y += (dy * speed + lift - v.y) * e; v.z += (dz * speed - v.z) * e;
    const b = this.bounds, m = FLY_MARGIN;
    if (this.clampXZ) { const c = this.clampXZ(this.pos.x + v.x * dt, this.pos.z + v.z * dt, -m); this.pos.x = c[0]; this.pos.z = c[1]; }
    else {
      this.pos.x = THREE.MathUtils.clamp(this.pos.x + v.x * dt, b.x0 - m, b.x1 + m);
      this.pos.z = THREE.MathUtils.clamp(this.pos.z + v.z * dt, b.z0 - m, b.z1 + m);
    }
    this.pos.y += v.y * dt;
    if (this.pos.y > CEILING) { this.pos.y = CEILING; if (v.y > 0) v.y = 0; }
    const ph = this.physics;
    if (this.noclipUnder && this.pos.y >= ph.heightAt(this.pos.x, this.pos.z)) this.noclipUnder = false;   // came up through the ground: a normal flyer from now on
    const g = this.noclipUnder ? ph.groundHeight(this.pos.x, this.pos.z, this.pos.y) : ph.flightFloor(this.pos.x, this.pos.z, this.pos.y);   // never sink into the ground, a quay or a deck
    if (this.pos.y < g) { this.pos.y = g; if (v.y < 0) v.y = 0; }
    this.vy = 0; this.onGround = false;
  }

  applyCamera(dt) {
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (this.onGround && sp > 0.3) this.bob += dt * sp * 2.1; else this.bob *= 0.9;
    const bobY = this.fly ? 0 : Math.sin(this.bob * 2) * 0.022 * Math.min(1, sp / 3);
    const eyeY = this.pos.y + this.eye;
    if (this.smoothY === null || this.fly) this.smoothY = eyeY;
    else this.smoothY += (eyeY - this.smoothY) * Math.min(1, dt * 14);
    if (Math.abs(this.smoothY - eyeY) > 1.2) this.smoothY = eyeY;
    if(!this.firstPerson){
      const distance=this.view===1?7.2:4.6,pitch=THREE.MathUtils.clamp(this.pitch,-1.05,.45),cp=Math.cos(pitch);
      const target=this.cameraTarget.set(this.pos.x,this.smoothY-this.eye+1.12,this.pos.z);
      const offset=this.cameraOffset.set(Math.sin(this.yaw)*cp*distance,.65-Math.sin(pitch)*distance,Math.cos(this.yaw)*cp*distance);
      const length=offset.length(),allowed=length*footCameraFraction(this.physics,target,offset);
      this.cameraDistance=this.cameraSnap||allowed<this.cameraDistance?allowed:THREE.MathUtils.lerp(this.cameraDistance,allowed,1-Math.exp(-7*dt));
      this.camera.position.copy(target).addScaledVector(offset,this.cameraDistance/length);this.camera.lookAt(target);this.cameraSnap=false;return;
    }
    this.cameraSnap=true;
    this.camera.position.set(this.pos.x, this.smoothY + bobY, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, Math.sin(this.bob) * 0.0025 * Math.min(1, sp / 3), 'YXZ');
  }
}
