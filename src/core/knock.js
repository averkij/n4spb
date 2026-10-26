// core/knock.js - KNOCKABLE THINGS: the street furniture the driven car can knock over and throw: benches, litter bins, flower pots and urns, racks, post boxes, kiosks,
// the advertising columns, the cast-iron lamp posts, the traffic-signal and sign poles, the bollard posts. Ported from 103_doomgrad_3d (core/knock.js), adapted to n4spb:
// the bake (nothing of the baked city is ever registered), the waterways (a deck is a floor, open water swallows the thing), the wreck world (a knock source is a legal target).
//
// HOW IT PLUGS IN  Every knockable is an INSTANCE of an InstancedMesh (one or more parts: a lamp = body + glow + light pool, a signal = pole + several head and lens instances) with
//   a static physics collider. register() keeps the rest matrix of every part, switches the mesh's instanceMatrix to DynamicDrawUsage (that keeps it out of the fixture-cell batcher,
//   the instance splitter and the outline proxies, so the instance can move at run time) and puts a `source` on the collider: the protocol drive/collision.js already speaks for
//   pushed traffic (cx, cz, vx, vz, spin, invMassRatio, inertia, applyCarImpulse, onCarHit). The solver then shares the impulse BY MASS: a 14 kg bin takes the car's closing speed
//   and barely slows the car, a 380 kg lamp post takes ~80 % of it and costs the car ~20 %, a 650 kg kiosk slides. ANCHORED things (lamps, signal poles, bollards, columns:
//   `anchored` = the break speed in km/h of the CAR AT CONTACT) are static (invMassRatio 0: the car stops on them) below that speed and only wobble; above it they break off at
//   the foot and topple along the hit. The speed test is made ONCE, before the impulse: the invMassRatio getter latches `armed`, applyCarImpulse consumes it (the old test after
//   the impulse compared the already slowed car and held lamps that a 30 km/h car should break).
// THE BODY  after the knock the collider is removed and the instance becomes a small rigid body: free things fly (vy from the speed, gravity 12, bounce 0.3, Coulomb slide 7 m/s^2,
//   tumbling about their centre, settle on a side), anchored things topple about their foot (the tilt accelerates like a falling pole, stops flat on the ground) and slide a little.
//   The floor is resolved per step: a walkable deck / step / pavement slab of ctx.physics (surfaceAt), else the terrain level where the thing stood, else OPEN WATER (waterLevelAt):
//   the thing sinks and is `lost` (hidden, no rest collider, no sparks). At rest a low static collider (top <= 0.42 above the thing's floor AND <= 0.42 above the road level 0.03 the car drives at: furniture stands on a pavement drawn 0.1 m higher, a rest box
//   0.42 above THAT would stop the car, so the car drives over lying debris) is added at the resting pose. `hitK` scales the dents / shake / sound the car takes from the hit (drive.js applyImpacts): a bin is not a wall.
// PARTS  A record may carry any number of parts. A part is an instance { mesh, index, hide? } or an object { obj } (a single Object3D created with ctx.add, i.e. in the DYNAMIC root).
//   Each part keeps its rest offset from the record origin (x, y + originY, z), so a traffic head or a lens instance sits where it stood and flies with the pole; a `hide` part
//   (a glow, a light pool, a halo) is zero-scaled at the knock. Parts are normalised once at register(); a frame writes matrices only (no allocation).
//      ghost: true = a record with no parts at all (a collider that stands where nothing is drawn: it breaks silently; docs/AREAS.md 13.7)
//      beam: { ax, az (the unit axis of the piece, hinge end -> free end), hinge } = a long thin PIECE, the half of a barrier boom (docs/AREAS.md 15.x): w = its length, the record stands at its CENTRE, originY = its axis above the
//        foot. It does not topple about the foot: a HINGED piece (the post half) swings about its post end like a gate that is pushed open (it yaws toward the throw and droops until its free end lies on the ground), a free piece
//        (the outer half) is thrown along the hit, falls flat, spins a little about the vertical and lies. The rest collider is a thin box (<= 0.42 m) along the lying piece. ctx.knock.snap(record, dx, dz, speed) breaks a
//        standing record as if a car hit it (the other half of a boom that snapped: onKnock of one half snaps the other).
// API  ctx.knock.register({ kind, x, z, y (the base), originY (the instance origin above the base: 0 for base-origin geometry, h/2 for a centred box), rotY, mass, h, r | w, d,
//      anchored, hitK, metal, minDv, parts: [...], item | items: [...], onKnock }) -> record { kind, x, y, z, rotY, state: 'stand' | 'fly' | 'rest' | 'lost', wobble, parts, ... } | null (never throws);
//      ctx.knock.listen(fn(record, body))  after every knock (seated people, perched crows); ctx.knock.update(dt) (self-registered); ctx.knock.list (records);
//      ctx.knock.stats  { registered, knocked, live, byKind, updateMs };  ctx.knock.hit(x, z, kmh, dx, dz, kind)  test hook;  window.__knock
import * as THREE from 'three';

const G = 12, HALF_PI = Math.PI / 2, UP = new THREE.Vector3(0, 1, 0), ONE = new THREE.Vector3(1, 1, 1);
const REACH = 30;                                                           // m added once to the bounding sphere of a knock mesh: a thrown instance must not be culled with its mesh
const CLANK_GAP = 0.15;
const LEVEL = 0.03;                                                         // m: the level the car drives at on the road (handling.js groundAt); the pavement the furniture stands on is drawn 0.1 m higher                                                     // s between two steel clanks
const _m = new THREE.Matrix4(), _b = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _p = new THREE.Vector3(), _ax = new THREE.Vector3(), _sh = new THREE.Vector3();
const _surf = { y: -Infinity, kind: null, item: null };
const ZERO_M = new THREE.Matrix4().makeScale(0, 0, 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hyp = (a, b) => Math.sqrt(a * a + b * b);

export function createKnock(ctx) {
  const list = [], live = [], dirty = [], listeners = [], bounded = new WeakSet(), byKind = {};
  const busy = new Float32Array(120); let busyN = 0, knocked = 0, clock = 0, lastClank = -1;
  const stats = { registered: 0, knocked: 0, live: 0, byKind, updateMs: 0 };
  /** the driven car's speed in km/h, read live (the solver asks inside its sub-steps, also from the test sims that run no frames) */
  const carSpeed = () => { const d = ctx.drive; return d && d.active && d.car ? hyp(d.car.vx, d.car.vz) * 3.6 : 0; };

  function applyCarImpulse(ix, iz, x, z) {
    const it = this.knock; if (it.state !== 'stand') return;
    const dvx = ix / it.mass, dvz = iz / it.mass, dv = hyp(dvx, dvz);
    if (dv < it.minDv) return;                                                      // a nudge: the thing stays
    if (it.anchored) { if (!it.armed) return; it.armed = false; }                   // holds: the solver treated it as static (see invMassRatio)
    knock(it, dvx, dvz, x, z);
  }
  function onCarHit(speed, contact) {
    const it = this.knock; if (it.state !== 'stand' || !it.anchored || speed < 0.6) return;
    // a bump below the break speed: the post wobbles
    if (!it.wobble) { it.wobble = { t: 0, amp: 0, dx: 0, dz: 0 }; live.push({ it, wobble: true, done: false }); }
    const w = it.wobble; w.t = 0; w.amp = Math.min(0.07, Math.max(w.amp, speed * 0.012));
    const d = ctx.drive && ctx.drive.car, l = d ? hyp(d.vx, d.vz) : 0;
    if (l > 0.05) { w.dx = d.vx / l; w.dz = d.vz / l; } else { w.dx = contact ? -contact.nx : 1; w.dz = contact ? -contact.nz : 0; }
  }

  /** one normalised part: the rest transform relative to the record origin (so the offset of a lens or a head from its pole survives the knock) */
  function makePart(p, ox, oy, oz) {
    if (!p) return null;
    const out = { mesh: null, index: -1, obj: null, hide: !!p.hide, hidden: false, off: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), M0: new THREE.Matrix4() };
    if (p.obj) { p.obj.matrixAutoUpdate = false; p.obj.updateMatrix(); out.obj = p.obj; out.M0.copy(p.obj.matrix); }
    else if (p.mesh && p.mesh.isInstancedMesh && p.index >= 0 && p.index < p.mesh.count) { out.mesh = p.mesh; out.index = p.index; p.mesh.getMatrixAt(p.index, out.M0); }
    else return null;
    out.M0.decompose(out.off, out.q, out.s);
    out.off.x -= ox; out.off.y -= oy; out.off.z -= oz;
    return out;
  }

  /** see the header; `item` / `items` are the physics colliders (ctx.physics.add*), `parts` the instanced parts (hide: true = this part vanishes at the knock: a lantern glow, a light pool) */
  function register(o) {
    try {
      if (!o || !(o.ghost || (o.parts && o.parts.length)) || !Number.isFinite(o.x) || !Number.isFinite(o.z)) return null;
      const y = o.y ?? 0, originY = o.originY || 0, parts = [];
      for (const p of o.parts || []) { const q = makePart(p, o.x, y + originY, o.z); if (q) parts.push(q); }
      if (!parts.length && !o.ghost) return null;      // (ghost: a record without anything drawn: an invisible wall that must still break, lib/fence-bays.js)
      const items = o.items ? o.items.filter(Boolean) : (o.item ? [o.item] : []);
      const it = {
        kind: o.kind || 'thing', x: o.x, z: o.z, y, rotY: o.rotY || 0, mass: o.mass || 20, h: o.h || 1, r: o.r || (o.w && o.d ? hyp(o.w, o.d) / 2 : 0.3), w: o.w || (o.r ? o.r * 2 : 0.6), d: o.d || (o.r ? o.r * 2 : 0.6),
        originY, anchored: o.anchored || 0, hitK: o.hitK ?? 0.3, metal: !!o.metal, minDv: o.minDv ?? (o.anchored ? 0 : 0.5), onKnock: o.onKnock || null,
        parts, item: items[0] || null, items, state: 'stand', body: null, wobble: null, armed: false, src: null, beam: o.beam && Number.isFinite(o.beam.ax) && Number.isFinite(o.beam.az) ? { ax: o.beam.ax, az: o.beam.az, hinge: !!o.beam.hinge } : null,
      };
      for (const p of parts) {
        if (p.obj) { p.obj.userData.knock = true; continue; }
        const mesh = p.mesh;
        if (mesh.instanceMatrix.usage !== THREE.DynamicDrawUsage) mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.userData.knock = true;
        if (!bounded.has(mesh)) { bounded.add(mesh); if (!mesh.boundingSphere) mesh.computeBoundingSphere(); mesh.boundingSphere.radius += REACH; }
      }
      const src = { knock: it, cx: it.x, cz: it.z, vx: 0, vz: 0, spin: 0, mass: it.mass, inertia: (it.w * it.w + it.d * it.d) / 12 + it.h * it.h / 12, hitK: it.hitK, applyCarImpulse, onCarHit,
        get invMassRatio() { const k = this.knock; if (k.state !== 'stand') return 0; if (k.anchored) { if (carSpeed() < k.anchored) { k.armed = false; return 0; } k.armed = true; } return 1350 / k.mass; } };
      it.src = src;
      for (const c of items) c.source = src;
      list.push(it); byKind[it.kind] = (byKind[it.kind] || 0) + 1;
      return it;
    } catch (e) { if (!register.warned) { register.warned = true; console.error('knock register', e); } return null; }
  }

  /** RE-ARM a record (the barrier arms of a bascule bridge come back when the next opening cycle starts; docs/AREAS.md 13.11): a body that is still flying is dropped, the rest box is removed, the record stands again
   *  and every hidden part is shown. The caller re-poses the instances (they keep whatever matrix the fall left) and gives the dynamic box back to its physics provider (it.src is the same object). Returns true when it stood up. */
  function restore(it) {
    if (!it || it.state === 'stand') return false;
    if (it.body) it.body.done = true;
    for (const c of it.items) ctx.physics.remove(c);
    it.items = []; it.item = null; it.body = null; it.wobble = null; it.armed = false; it.state = 'stand';
    for (const p of it.parts) p.hidden = false;
    return true;
  }

  function listen(fn) { if (typeof fn === 'function') listeners.push(fn); }

  function knock(it, dvx, dvz, hx, hz) {
    const sp = hyp(dvx, dvz) || 0.01;
    let dx = dvx / sp, dz = dvz / sp; if (!dx && !dz) dx = 1;
    const cap = it.anchored ? 7 : 16, k = Math.min(1, cap / sp) * (it.anchored ? 0.35 : 1);
    // the spin from the lever of the hit point about the centre (free things), the tumble from the speed over the size
    const rx = hx - it.x, rz = hz - it.z, lever = (rz * dx - rx * dz);
    const b = {
      it, x: it.x, y: it.y, z: it.z, vx: dvx * k, vz: dvz * k, vy: it.anchored ? 0 : Math.min(6, 0.22 * sp * k + 0.9), dx, dz,
      tilt: 0, tiltV: it.anchored ? clamp(sp * 0.25, 0.35, 1.6) : clamp(sp * 0.8 / Math.max(0.4, it.h), 1, 7) * (lever < 0 ? -1 : 1) * (it.h > it.r * 2 ? 1 : 0.4),
      spin: 0, spinV: it.anchored ? 0 : clamp(-lever * sp * 0.5 / Math.max(0.2, it.r * it.r), -5, 5), ground: it.y, splash: false, lost: false, t: 0, onGround: false, done: false, wobble: false, sp, beam: false, swing: 0, sgn: 1,
    };
    if (it.beam) {                                                                    // a boom half: swings about its post (hinge) or is thrown flat (free); see the header
      const bm = it.beam, ang = Math.acos(clamp(bm.ax * dx + bm.az * dz, -1, 1));
      b.beam = true; b.sgn = Math.sign(bm.az * dx - bm.ax * dz) || 1; b.swing = clamp(ang, 0.45, 1.7);       // (the yaw turns the axis toward the throw, at most until it lies along it)
      b.tilt = 0; b.tiltV = 0.3; b.vy = 0;
      if (bm.hinge) { b.vx = b.vz = 0; b.spinV = b.sgn * clamp(sp * 0.9, 1.0, 3.5); }
      else { const kk = Math.min(1, 6 / sp) * 0.5; b.vx = dvx * kk; b.vz = dvz * kk; b.vy = Math.min(3, 0.8 + 0.12 * sp); b.spinV = b.sgn * clamp(sp * 0.4, 0.5, 1.6); }
    }
    for (const c of it.items) ctx.physics.remove(c);
    it.items = []; it.item = null;
    it.state = 'fly'; it.body = b; it.wobble = null; live.push(b); knocked++;
    const drive = ctx.drive;
    if (it.metal) {
      if (drive && drive.fx) try { drive.fx.sparks(hx, it.y + (it.beam ? it.originY : 0.55), hz, dx, dz, 14, 5); } catch (e) { /* no fx */ }
      if (ctx.audio && ctx.audio.play && clock - lastClank >= CLANK_GAP) {
        lastClank = clock;
        try { ctx.audio.play('clank', { position: { x: it.x, y: it.y + 0.5, z: it.z }, volume: clamp(sp / 12, 0.2, 1) }); } catch (e) { /* silent */ }
      }
    }
    if (it.onKnock) try { it.onKnock(it, b); } catch (e) { console.error('knock onKnock', e); }
    for (let i = 0; i < listeners.length; i++) try { listeners[i](it, b); } catch (e) { console.error('knock listener', e); }
  }

  /** the instance matrices of every part: T(pivot) R(tilt about the axis across the throw) R_y(spin) T(-pivot) (rest offset, rotation, scale). `hiding`: the hide parts vanish (a knocked body), else they follow (a wobble) */
  function write(it, x, y, z, tilt, dx, dz, spin, hiding) {
    const pivotY = it.anchored ? 0 : it.h / 2, oy = it.originY - pivotY;
    if (spin) _q.setFromAxisAngle(UP, spin); else _q.identity();
    if (tilt) { _ax.set(dz, 0, -dx); if (_ax.lengthSq() < 1e-9) _ax.set(0, 0, 1); _ax.normalize(); _q2.setFromAxisAngle(_ax, tilt); _q.premultiply(_q2); }
    _b.compose(_p.set(x, y + pivotY, z), _q, ONE);
    for (let i = 0; i < it.parts.length; i++) {
      const p = it.parts[i];
      if (hiding && p.hide) { if (!p.hidden) { p.hidden = true; put(p, ZERO_M); } continue; }
      _p.copy(p.off); _p.y += oy;
      _m.compose(_p, p.q, p.s).premultiply(_b);
      put(p, _m);
    }
  }
  /** write a part's matrix: the instance matrix (flushed at the end of the frame) or the object's local matrix */
  function put(p, m) {
    if (p.obj) { p.obj.matrix.copy(m); p.obj.matrixWorldNeedsUpdate = true; return; }
    p.mesh.setMatrixAt(p.index, m);
    if (!p.mesh.userData.knockDirty) { p.mesh.userData.knockDirty = true; dirty.push(p.mesh); }
  }
  /** the floor under a body: a deck / step / pavement slab, else open water (b.splash: the thing sinks), else the terrain level where it stood */
  function floor(x, z, it, b) {
    b.splash = false; b.level = LEVEL;
    const s = ctx.physics.surfaceAt(x, z, Math.max(it.y, b.y) + 0.3, false, _surf);
    if (s.kind === 'ramp' || s.kind === 'walk') { if (s.y > 0.3) b.level = s.y; return s.y; }       // (a low slab is a step the car takes from the road: its level is the road's)
    const L = ctx.L;
    if (L && L.waterLevelAt) { const w = L.waterLevelAt(x, z); if (w != null) { b.splash = true; return w - 1.2; } }
    return it.y > 0.05 ? it.y : 0;
  }
  /** the instance matrices of a BEAM piece: the hinged piece turns about its post end (the droop first, in its own frame, then the yaw), the free piece about its centre at the body's position */
  function writeBeam(it, b) {
    const bm = it.beam, half = it.w / 2;
    if (bm.hinge) { _p.set(it.x - bm.ax * half, it.y + it.originY, it.z - bm.az * half); _sh.set(bm.ax * half, 0, bm.az * half); }
    else { _p.set(b.x, b.y + it.originY, b.z); _sh.set(0, 0, 0); }
    _q.setFromAxisAngle(UP, b.spin);
    if (b.tilt) { _ax.set(bm.az, 0, -bm.ax); _q2.setFromAxisAngle(_ax, b.tilt); _q.multiply(_q2); }
    _b.compose(_p, _q, ONE);
    for (let i = 0; i < it.parts.length; i++) {
      const p = it.parts[i];
      _p.copy(p.off).add(_sh);
      _m.compose(_p, p.q, p.s).premultiply(_b);
      put(p, _m);
    }
  }
  function restBeam(it, b) {
    const bm = it.beam, ca = Math.cos(b.spin), sa = Math.sin(b.spin), th = 0.3;
    const rx = bm.ax * ca + bm.az * sa, rz = -bm.ax * sa + bm.az * ca;                // the axis after the yaw (rotation about +y)
    let len = it.w, cx = b.x, cz = b.z;
    if (bm.hinge) { len = it.w * Math.cos(b.tilt); cx = it.x - bm.ax * it.w / 2 + rx * len / 2; cz = it.z - bm.az * it.w / 2 + rz * len / 2; }
    it.item = ctx.physics.addBox(cx, cz, th, len, Math.atan2(rx, rz), b.ground - 0.05, Math.min(b.ground + th, b.level + 0.42));
    it.items = [it.item];
  }
  function stepBeam(b, dt) {
    const it = b.it, bm = it.beam, L = it.w;
    b.ground = floor(b.x, b.z, it, b);
    if (bm.hinge) {                                                                     // the post half: swings open about its post and droops until its free end lies on the ground
      const psiMax = Math.asin(Math.min(0.6, Math.max(0.04, it.y + it.originY - b.ground - 0.06) / L));
      b.tiltV += 1.5 * G / L * Math.cos(b.tilt) * dt; b.tilt = Math.min(psiMax, b.tilt + b.tiltV * dt); if (b.tilt >= psiMax) b.tiltV = 0;
      b.spinV *= Math.exp(-1.4 * dt); b.spin += b.spinV * dt;
      if (Math.abs(b.spin) >= b.swing) { b.spin = b.sgn * b.swing; b.spinV = 0; }
      if (b.splash) { b.lost = true; settle(b); return; }
      if ((b.tilt >= psiMax && Math.abs(b.spinV) < 0.15) || b.t > 3) { settle(b); return; }
      writeBeam(it, b); return;
    }
    b.vy -= G * dt; b.y += b.vy * dt; b.x += b.vx * dt; b.z += b.vz * dt;             // the outer half: thrown along the hit, falls flat
    b.spin += b.spinV * dt; if (Math.abs(b.spin) >= b.swing) { b.spin = b.sgn * b.swing; b.spinV = 0; }
    if (b.y < -420) { b.lost = true; settle(b); return; }
    if (b.y + it.originY - 0.06 <= b.ground) {
      if (b.splash) { b.lost = true; settle(b); return; }
      b.y = b.ground - it.originY + 0.06;
      if (b.vy < -1.5) { b.vy = -b.vy * 0.25; b.vx *= 0.72; b.vz *= 0.72; b.spinV *= 0.55; }
      else {
        b.vy = 0; b.onGround = true;
        const v = hyp(b.vx, b.vz), nv = Math.max(0, v - 7 * dt); if (v > 0) { b.vx *= nv / v; b.vz *= nv / v; }
        b.spinV *= Math.exp(-4 * dt);
        if (nv < 0.25 && Math.abs(b.spinV) < 0.3) { settle(b); return; }
      }
    } else b.onGround = false;
    writeBeam(it, b);
  }
  function restCollider(it, b) {
    const ph = ctx.physics;
    if (it.beam) { restBeam(it, b); return; }
    if (it.anchored) {                                                                // lying along the throw, the foot where it stood
      const len = it.h, cx = b.x + b.dx * len / 2, cz = b.z + b.dz * len / 2, th = Math.min(0.42, Math.max(0.3, it.r * 2));
      it.item = ph.addBox(cx, cz, th, len, Math.atan2(b.dx, b.dz), b.ground - 0.05, Math.min(b.ground + th, b.level + 0.42));
    } else it.item = ph.addBox(b.x, b.z, it.w, it.d, it.rotY + b.spin, b.ground - 0.05, Math.min(b.ground + Math.min(it.h, Math.max(0.35, Math.min(it.w, it.d)), 0.42), b.level + 0.42));
    it.items = [it.item];                                                            // no source: a lying thing is a static solid the car drives over
  }
  function settle(b) {
    const it = b.it;
    b.done = true; it.state = b.lost ? 'lost' : 'rest'; it.body = null;
    if (b.lost) { for (let i = 0; i < it.parts.length; i++) { it.parts[i].hidden = true; put(it.parts[i], ZERO_M); } return; }
    if (it.beam) writeBeam(it, b); else write(it, b.x, b.y, b.z, b.tilt, b.dx, b.dz, b.spin, true);
    restCollider(it, b);
  }

  function step(b, dt) {
    const it = b.it;
    b.t += dt;
    if (it.beam) { stepBeam(b, dt); return; }
    const ground = floor(b.x, b.z, it, b);
    b.ground = ground;
    if (it.anchored) {
      b.tiltV += (3.2 * Math.sin(b.tilt) + 0.6) * dt; b.tilt = Math.min(HALF_PI, b.tilt + b.tiltV * dt);
      const f = Math.exp(-2.5 * dt); b.vx *= f; b.vz *= f; b.x += b.vx * dt; b.z += b.vz * dt;
      if (b.splash) { b.vy -= G * dt; b.y += b.vy * dt; if (b.y <= ground) { b.lost = true; settle(b); return; } } else b.y = ground;    // over the water: it goes down
      if (b.y < -420) { b.lost = true; settle(b); return; }
      // a toppled pole rests on its thickness, not with its axis in the ground (the square's paving slabs are 0.12 m above the foot level)
      if (b.tilt >= HALF_PI && !b.splash) { b.x += b.dx * 0.05; b.y += it.r; settle(b); return; }
      write(it, b.x, b.y + Math.sin(b.tilt) * it.r, b.z, b.tilt, b.dx, b.dz, 0, true);
      return;
    }
    b.vy -= G * dt; b.y += b.vy * dt; b.x += b.vx * dt; b.z += b.vz * dt;
    b.tilt += b.tiltV * dt; b.spin += b.spinV * dt;
    if (b.y < -420) { b.lost = true; settle(b); return; }
    if (b.y <= ground) {
      if (b.splash) { b.lost = true; settle(b); return; }                            // into the water
      b.y = ground;
      if (b.vy < -1.5) { b.vy = -b.vy * 0.3; b.vx *= 0.72; b.vz *= 0.72; b.tiltV *= 0.55; b.spinV *= 0.55; }
      else {
        b.vy = 0; b.onGround = true;
        const v = hyp(b.vx, b.vz), nv = Math.max(0, v - 7 * dt); if (v > 0) { b.vx *= nv / v; b.vz *= nv / v; }
        const fa = Math.exp(-4 * dt); b.tiltV *= fa; b.spinV *= fa;
        if (nv < 0.25 && Math.abs(b.tiltV) < 0.6) {                                  // rest: on a side
          const sides = Math.round(b.tilt / HALF_PI); b.tilt = sides * HALF_PI;
          if (it.h > it.r * 2 && sides % 2) b.y = ground;                              // a tall thing lying: its centre pivot keeps it off the ground enough
          settle(b); return;
        }
      }
    } else b.onGround = false;
    write(it, b.x, b.y, b.z, b.tilt, b.dx, b.dz, b.spin, true);
  }
  function wobbleStep(b, dt) {
    const it = b.it, w = it.wobble; if (!w || it.state !== 'stand') { b.done = true; return; }
    w.t += dt;
    const a = w.amp * Math.sin(w.t * 9) * Math.exp(-2.2 * w.t);
    write(it, it.x, it.y, it.z, a, w.dx, w.dz, 0, false);
    if (w.t > 1.8) { write(it, it.x, it.y, it.z, 0, w.dx, w.dz, 0, false); it.wobble = null; b.done = true; }
  }

  function update(dt) {
    if (!(dt > 0)) return;
    clock += dt;
    if (!live.length) return;
    const t0 = performance.now(), h = Math.min(dt, 0.05);
    for (let i = 0; i < live.length; i++) { const b = live[i]; if (b.done) continue; if (b.wobble) wobbleStep(b, dt); else step(b, h); }
    for (let i = live.length - 1; i >= 0; i--) if (live[i].done) live.splice(i, 1);
    for (let i = 0; i < dirty.length; i++) { const m = dirty[i]; m.instanceMatrix.needsUpdate = true; m.userData.knockDirty = false; }
    dirty.length = 0;
    busy[busyN++ % busy.length] = performance.now() - t0;
  }
  ctx.onUpdate(update);

  /** break a STANDING record as if a car at `speed` m/s hit it toward (dx, dz): the partner half of a snapped boom (its onKnock calls this for the other half). false when it does not stand */
  function snap(it, dx, dz, speed, hx = it ? it.x : 0, hz = it ? it.z : 0) {
    if (!it || it.state !== 'stand') return false;
    const l = hyp(dx, dz) || 1; knock(it, speed * dx / l, speed * dz / l, hx, hz); return true;
  }

  const api = { register, listen, update, restore, snap, list,
    get stats() {
      stats.registered = list.length; stats.knocked = knocked; stats.live = live.length;
      let mx = 0; for (let i = 0; i < Math.min(busyN, busy.length); i++) if (busy[i] > mx) mx = busy[i];
      stats.updateMs = mx; return stats;
    },
    /** test hook: knock the standing record nearest to x, z (of `kind`, when given) as if hit at `kmh` toward (dx, dz) */
    hit(x, z, kmh = 40, dx = 1, dz = 0, kind = null) {
      let best = null, bd = 1e9;
      for (const it of list) { if (it.state !== 'stand' || (kind && it.kind !== kind)) continue; const dd = hyp(it.x - x, it.z - z); if (dd < bd) { bd = dd; best = it; } }
      if (!best) return null;
      const v = kmh / 3.6, l = hyp(dx, dz) || 1;
      knock(best, v * dx / l, v * dz / l, best.x - dx / l * 0.3, best.z - dz / l * 0.3); return best;
    } };
  if (typeof window !== 'undefined') window.__knock = api;
  return api;
}
