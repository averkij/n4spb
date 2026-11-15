// Small Rapier world for struck vehicles and shed panels. The city's spatial grid
// supplies nearby scenery; untouched traffic keeps its inexpensive lane simulation.
import RAPIER from '../../../vendor/rapier/rapier.js';
import * as THREE from 'three';
import { crushedSpec } from './damage.js';
import { TRAFFIC_PHYSICS, trafficPhysics, wreckTraction } from './vehicle-profiles.js';

let initialized;
export const vehicleMass = spec => spec.mass || TRAFFIC_PHYSICS[spec.kind]?.mass || (spec.bus ? TRAFFIC_PHYSICS.bus.mass : spec.len > 5.3 ? TRAFFIC_PHYSICS.van.mass : TRAFFIC_PHYSICS.sedan.mass);
const yawRotation = yaw => ({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) });
export async function getCarWrecks(ctx) {
  if (ctx.services.carWrecks) return ctx.services.carWrecks;
  if (!ctx.services.carWrecksLoading) ctx.services.carWrecksLoading = (async () => {
    await (initialized || (initialized = RAPIER.init()));
    const api = createWreckWorld(ctx);
    ctx.services.carWrecks = api;
    ctx.onUpdate(dt => api.step(dt));
    return api;
  })();
  return ctx.services.carWrecksLoading;
}

function createWreckWorld(ctx) {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const cars = new Map(), pieces = [], scenery = new Map(), colliders = [];
  const events = new RAPIER.EventQueue(true), carHandles = new Map(), proxyHandles = new Map();
  const material = ctx.mat.toon('#ffffff', { vertexColors: true, paint: 0.015, name: 'crash-debris' });
  let accumulator = 0, tick = 0, serial = 0;
  const height = (x, z, y = 0) => {
    const surface = ctx.physics.surfaceAt(x, z, y + .35, false, {});
    return Number.isFinite(surface.y) ? surface.y : y;
  };
  function sync(entry) {
    const { body, record: r, source, spec } = entry, p = body.translation(), q = body.rotation();
    if (r.damageState && entry.damageRevision !== r.damageState.revision) {
      const shape = crushedSpec(spec, r.damageState);
      entry.collider.setShape(new RAPIER.Cuboid(spec.wid / 2, .45, shape.len / 2));
      entry.collider.setTranslationWrtParent({ x: 0, y: 0, z: shape.centerZ - (spec.front + spec.rear) / 2 });
      entry.collider.setMass(vehicleMass(spec)); entry.damageRevision = r.damageState.revision;
      entry.crushedOffset = shape.centerZ - (spec.front + spec.rear) / 2; source.d = shape.len;
      source.inertia = (spec.wid ** 2 + shape.len ** 2) / 12;
    }
    const yaw = Math.atan2(2 * q.w * q.y, 1 - 2 * q.y * q.y), s = Math.sin(yaw), c = Math.cos(yaw);
    const offset = (spec.front + spec.rear) / 2;
    r.x = p.x - s * offset; r.z = p.z - c * offset; r.c = c; r.s = s;
    r.y = height(r.x, r.z, r.y); r.cp = 1; r.sp = 0;
    if (Math.abs(p.y - r.y - .55) > .04) body.setTranslation({ x: p.x, y: r.y + .55, z: p.z }, false);
    source.cx = p.x + s * (entry.crushedOffset || 0); source.cz = p.z + c * (entry.crushedOffset || 0); source.rotY = yaw;
    source.originX = r.x; source.originZ = r.z;
    const v = body.linvel(); source.vx = v.x; source.vz = v.z; source.spin = body.angvel().y;
    source.x = source.cx; source.z = source.cz; source.hw = source.w / 2; source.hd = source.d / 2;
    source.speed = Math.hypot(v.x, v.z); source.kind = r.kind;
    source.y0 = r.y; source.y1 = r.y + spec.hgt;
    if (source.vehicle) {
      const v = source.vehicle; v.x = v.px = r.x; v.z = v.pz = r.z;
      v.rot = v.prot = yaw; v.sn = s; v.cs = c; v.v = 0;
    }
  }
  function retire(entry, persist = true) {
    sync(entry); world.removeRigidBody(entry.body); cars.delete(entry.record);
    carHandles.delete(entry.collider.handle);
    entry.record.wreckBody = null;
    const s = entry.source; s.vx = s.vz = s.spin = 0;
    if (persist) {
      const box = ctx.physics.addBox(s.cx, s.cz, s.w, s.d, s.rotY, s.y0, s.y1);
      box.source = s; s.staticBox = box;
      if (s.vehicle) s.vehicle.wreckCleanup = () => { ctx.physics.remove(box); s.staticBox = null; };
    }
  }
  function activate(source) {
    let entry = cars.get(source.record); if (entry) return entry;
    if (cars.size >= 24) retire([...cars.values()].sort((a, b) => a.lastHit - b.lastHit)[0]);
    const { record, spec } = source;
    if (source.staticBox) { ctx.physics.remove(source.staticBox); source.staticBox = null; }
    if (source.vehicle) delete source.vehicle.wreckCleanup;
    const old = scenery.get(source.record); if (old) { proxyHandles.delete(old.collider.handle); world.removeCollider(old.collider, false); scenery.delete(source.record); }
    const yaw = Math.atan2(record.s, record.c), offset = (spec.front + spec.rear) / 2;
    const desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(record.x + record.s * offset, record.y + .55, record.z + record.c * offset)
      .setRotation(yawRotation(yaw)).enabledTranslations(true, false, true).enabledRotations(false, true, false)
      .setLinearDamping(0).setAngularDamping(0).setCcdEnabled(true);
    const body = world.createRigidBody(desc);
    const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(spec.wid / 2, .45, spec.len / 2)
      .setMass(vehicleMass(spec)).setFriction(.65).setRestitution(.08).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body);
    body.setLinvel({ x: source.vx || 0, y: 0, z: source.vz || 0 }, true);
    record.wrecked = true; record.wreckBody = body;
    if (source.vehicle) {
      source.vehicle.wrecked = true; source.vehicle.v = 0;
      const lane = source.vehicle.seg?.veh, i = lane?.indexOf(source.vehicle);
      if (i >= 0) lane.splice(i, 1);
    }
    // Traffic reuses its collider slots each frame. Keep our own stable source.
    const owned = { ...source };
    record.wreckSource = owned;
    entry = { body, collider, record, source: owned, spec, traction: trafficPhysics(record.kind, spec), lastHit: tick };
    cars.set(record, entry); carHandles.set(collider.handle, entry); return entry;
  }
  function impulse(source, ix, iz, x, z) {
    const entry = activate(source); entry.lastHit = tick;
    entry.body.applyImpulseAtPoint({ x: ix, y: 0, z: iz }, { x, y: entry.body.translation().y, z }, true);
    sync(entry);
    source.vx = entry.source.vx; source.vz = entry.source.vz; source.spin = entry.source.spin;
  }
  /** Hand a struck/parked vehicle to the driving controller without a second
   * collider, stale lane callback or reset of its pose/dents. */
  function release(record) {
    const entry = cars.get(record); if(entry)sync(entry);
    const source = entry?.source || record.wreckSource;
    const snapshot={x:record.x,y:record.y,z:record.z,yaw:Math.atan2(record.s,record.c),vx:source?.vx||0,vz:source?.vz||0,spin:source?.spin||0,damageState:record.damageState};
    if(entry)retire(entry,false);
    if(source?.staticBox){ctx.physics.remove(source.staticBox);source.staticBox=null;}
    if(source?.vehicle){source.vehicle.wreckCleanup?.();delete source.vehicle.wreckCleanup;source.vehicle.wrecked=false;}
    const proxy=scenery.get(record);if(proxy){proxyHandles.delete(proxy.collider.handle);world.removeCollider(proxy.collider,false);scenery.delete(record);}
    record.wreckBody=null;record.wreckSource=null;record.wrecked=false;
    return snapshot;
  }
  function dropPiece(p) { world.removeRigidBody(p.body); p.mesh.removeFromParent(); p.mesh.geometry.dispose(); }
  function shed(fragment, pose, tint) {
    if (pieces.length >= 48) dropPiece(pieces.shift());
    const geometry = fragment.geometry, colors = geometry.attributes.color, kinds = geometry.attributes.aKind;
    if (fragment.zone.includes('glass') && colors) for (let i = 0; i < colors.count; i++) colors.setXYZ(i, .055, .12, .15);
    if (tint && colors && kinds) for (let i = 0; i < colors.count; i++) if (kinds.getX(i) === 1)
      colors.setXYZ(i, colors.getX(i) * tint.r, colors.getY(i) * tint.g, colors.getZ(i) * tint.b);
    geometry.computeBoundingBox();
    const centre = geometry.boundingBox.getCenter(new THREE.Vector3()), size = geometry.boundingBox.getSize(new THREE.Vector3());
    geometry.translate(-centre.x, -centre.y, -centre.z);
    const yaw = pose.yaw ?? Math.atan2(pose.s, pose.c), s = Math.sin(yaw), c = Math.cos(yaw);
    const x = pose.x + centre.x * c + centre.z * s, z = pose.z - centre.x * s + centre.z * c;
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, pose.y + centre.y + .06, z)
      .setRotation(yawRotation(yaw)).setCcdEnabled(true).setLinearDamping(.15).setAngularDamping(.3));
    world.createCollider(RAPIER.ColliderDesc.cuboid(Math.max(.025, size.x / 2), Math.max(.025, size.y / 2), Math.max(.025, size.z / 2))
      .setMass(fragment.zone.includes('glass') ? 2 : 16).setFriction(.75).setRestitution(.24).setCollisionGroups(0x00020001), body);
    const j = ++serial, outward = fragment.zone.includes('rear') ? -1 : 1;
    body.setLinvel({ x: (pose.vx || 0) * .45 + c * Math.sin(j * 2.4) * 4 + s * outward * 3,
      y: 3 + (j % 3), z: (pose.vz || 0) * .45 - s * Math.sin(j * 2.4) * 4 + c * outward * 3 }, true);
    body.setAngvel({ x: 2 + j % 4, y: Math.sin(j) * 4, z: 2 * Math.cos(j) }, true);
    const mesh = new THREE.Mesh(geometry, material); mesh.name = 'car-debris'; mesh.castShadow = mesh.receiveShadow = true;
    mesh.position.copy(body.translation()); mesh.quaternion.copy(body.rotation()); ctx.add(mesh);
    pieces.push({ body, mesh, age: 0 });
  }
  function nearby() {
    const wanted = new Map();
    const gather = (x, z, y, speed) => {
      const r = Math.min(16, 6 + speed * .15);
      for (const b of ctx.physics.querySolids(x, z, r)) {
        if (b.type === 'hole' || b.type === 'ramp' || b.source?.record?.wreckBody || b.source?.kind === 'player') continue;
        if (Math.abs(b.cx - x) > r + (b.hw || b.r || 0) || Math.abs(b.cz - z) > r + (b.hd || b.r || 0)) continue;
        const top = b.top ?? b.y1;
        if (top <= y + .08 || b.y0 > y + 3) continue;
        wanted.set(b.source?.record || b.source || b, { b, y, top });
      }
      const gx = Math.floor(x / 6), gz = Math.floor(z / 6);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        const cx = (gx + dx) * 6 + 3, cz = (gz + dz) * 6 + 3, h = height(cx, cz, y);
        wanted.set(`floor:${gx + dx}:${gz + dz}:${h.toFixed(1)}`, { floor: true, x: cx, z: cz, y: h });
      }
    };
    for (const e of cars.values()) if (!e.body.isSleeping()) gather(e.record.x, e.record.z, e.record.y, Math.hypot(e.source.vx, e.source.vz));
    for (const p of pieces) { const pos = p.body.translation(); gather(pos.x, pos.z, height(pos.x, pos.z, pos.y), 0); }
    for (const [key, entry] of scenery) if (!wanted.has(key)) { proxyHandles.delete(entry.collider.handle); world.removeCollider(entry.collider, false); scenery.delete(key); }
    for (const [key, o] of wanted) {
      if (scenery.size >= 512 && !scenery.has(key)) continue;
      const b = o.b, top = o.floor ? o.y : Math.min(o.top, o.y + 12), bottom = o.floor ? o.y - 1 : Math.max(b.y0, o.y - 2);
      const x = o.floor ? o.x : b.cx, z = o.floor ? o.z : b.cz, y = (top + bottom) / 2;
      let entry = scenery.get(key);
      if (!entry) {
        const desc = o.floor ? RAPIER.ColliderDesc.cuboid(3, .5, 3) : b.type === 'cyl' ? RAPIER.ColliderDesc.cylinder((top - bottom) / 2, b.r) : RAPIER.ColliderDesc.cuboid(b.hw, (top - bottom) / 2, b.hd);
        entry = { collider: world.createCollider(desc.setFriction(.8).setRestitution(.08)) }; scenery.set(key, entry);
      }
      entry.collider.setTranslation({ x, y, z }); entry.collider.setRotation(yawRotation(b?.rotY || 0));
      if (b?.source?.applyCarImpulse) proxyHandles.set(entry.collider.handle, b.source);
    }
  }
  function chainCollision(h1, h2, started) {
    if (!started) return;
    const mover = carHandles.get(h1) || carHandles.get(h2);
    const target = proxyHandles.get(h1) || proxyHandles.get(h2);
    if (!mover) return;
    // Rapier resolves two active wrecks and fixed scenery itself. They still
    // need damage events; previously only a chain hit against an untouched car
    // damaged either shell, so an already struck car could hit walls unharmed.
    if(!target || target.record?.wreckBody){
      const otherHandle=mover.collider.handle===h1?h2:h1,other=world.getCollider(otherHandle);
      if(!other)return;
      const second=carHandles.get(otherHandle),prior=mover.before||mover.body.linvel(),ov=second?.before||{x:0,y:0,z:0};
      const p=mover.body.translation(),op=other.translation();let hit=null;
      world.contactPair(mover.collider,other,manifold=>{
        const n=manifold.normal();if(Math.abs(n.y)>.7)return;
        let nx=n.x,nz=n.z;const length=Math.hypot(nx,nz);if(length<.01)return;nx/=length;nz/=length;
        if(nx*(p.x-op.x)+nz*(p.z-op.z)<0){nx=-nx;nz=-nz;}
        const speed=-((prior.x-ov.x)*nx+(prior.z-ov.z)*nz);
        if(speed>.7&&(!hit||speed>hit.speed)){
          const point=manifold.numSolverContacts()?manifold.solverContactPoint(0):{x:(p.x+op.x)/2,z:(p.z+op.z)/2};
          hit={speed,x:point.x,z:point.z,nx,nz};
        }
      });
      if(hit){mover.lastHit=tick;mover.source.onCarHit?.(hit.speed,hit);if(second){second.lastHit=tick;second.source.onCarHit?.(hit.speed,{...hit,nx:-hit.nx,nz:-hit.nz});}}
      return;
    }
    const p = mover.body.translation(), dx = p.x - target.cx, dz = p.z - target.cz, d = Math.hypot(dx, dz) || 1;
    const nx = dx / d, nz = dz / d, prior = mover.before || mover.body.linvel();
    const speed = -((prior.x - target.vx) * nx + (prior.z - target.vz) * nz);
    if (speed < .7) return;
    mover.lastHit = tick;
    const mass = vehicleMass(mover.spec), otherMass = target.spec ? vehicleMass(target.spec) : (target.mass || 20), j = speed * 1.08 / (1 / mass + 1 / otherMass);
    const x = (p.x + target.cx) / 2, z = (p.z + target.cz) / 2;
    target.applyCarImpulse(-nx * j, -nz * j, x, z);
    // Replace the response to the temporary fixed proxy with the two-mass result.
    mover.body.setLinvel({ x: prior.x + nx * j / mass, y: 0, z: prior.z + nz * j / mass }, true);
    target.onCarHit(speed, { x, z, nx, nz });
    mover.source.onCarHit(speed, { x, z, nx: -nx, nz: -nz });
  }
  function step(dt) {
    if (!(dt > 0) || (!cars.size && !pieces.length)) return;
    accumulator = Math.min(.1, accumulator + dt);
    while (accumulator >= 1 / 120) {
      for (const entry of cars.values()) if (entry.source.vehicle?.retired) retire(entry, false);
      tick++; if (tick % 6 === 1) nearby();
      for (const entry of cars.values()) {
        if(!entry.body.isSleeping()) {
          const v=entry.body.linvel(),q=entry.body.rotation(),yaw=Math.atan2(2*q.w*q.y,1-2*q.y*q.y);
          const water=ctx.physics.waterLevel?.(entry.record.x,entry.record.z),depth=Number.isFinite(water)?Math.max(0,water-entry.record.y):0;
          const grip=wreckTraction(v.x,v.z,entry.body.angvel().y,yaw,1/120,entry.traction,depth);
          entry.body.setLinvel({x:grip.vx,y:0,z:grip.vz},false);entry.body.setAngvel({x:0,y:grip.spin,z:0},false);
        }
        entry.before = entry.body.linvel();
      }
      world.timestep = 1 / 120; world.step(events); accumulator -= 1 / 120;
      events.drainCollisionEvents(chainCollision);
      for (const e of cars.values()) sync(e);
    }
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i]; p.age += dt;
      if (p.age > 18) { dropPiece(p); pieces.splice(i, 1); continue; }
      p.mesh.position.copy(p.body.translation()); p.mesh.quaternion.copy(p.body.rotation());
    }
  }
  function reset() {
    for (const e of [...cars.values()]) retire(e);
    for (const p of pieces) dropPiece(p); pieces.length = 0;
    for (const e of scenery.values()) world.removeCollider(e.collider, false); scenery.clear(); proxyHandles.clear();
    accumulator = 0;
  }
  function movingColliders() {
    colliders.length = 0;
    for (const e of cars.values()) { sync(e); colliders.push(e.source); }
    return colliders;
  }
  ctx.physics.addDynamic(movingColliders);
  return { impulse, shed, step, reset, release, blockers: movingColliders,
    get stats() { return { cars: cars.size, debris: pieces.length, scenery: scenery.size }; } };
}
