// Collision callbacks preserve per-vehicle cosmetic state, never shared geometry.
import { createDamageState, recordDamage, damageAmount } from '../drive/damage.js';
import { vehicleMass } from '../drive/wrecks.js';
import { trafficSpec } from '../drive/vehicle-profiles.js';
const specs=new WeakMap();
function impactSpec(kind,spec){
  if(spec.kind===kind&&spec.mass&&spec.W)return spec;
  let kinds=specs.get(spec);if(!kinds){kinds=new Map();specs.set(spec,kinds);}
  if(!kinds.has(kind))kinds.set(kind,trafficSpec(kind,spec));
  return kinds.get(kind);
}
function applyCarImpulse(ix, iz, x, z) { this.wrecks.impulse(this, ix, iz, x, z); }
function onCarHit(speed, contact) {
  const v = this.vehicle;
  if (!(speed > 0.4)) return;
  if (v && !v.tram) {
    v.v = 0; v.brake = true;
    v.collisionUntil = Math.max(v.collisionUntil || 0, this.time + 0.8);
  }
  if (!this.record?.wreckBody) this.vx = this.vz = 0;
  if (contact && this.record && this.spec) {
    const c = Math.cos(this.rotY), s = Math.sin(this.rotY);
    const x = contact.x - this.originX, z = contact.z - this.originZ;
    const state = this.record.damageState || (this.record.damageState = createDamageState());
    recordDamage(state, { type: 'hit', v: speed, localX: x * c - z * s, localZ: x * s + z * c,
      localNX: -contact.nx * c + contact.nz * s, localNZ: -contact.nx * s - contact.nz * c }, this.spec);
    this.record.junked = damageAmount(state) >= .999;
    if(v)v.junked=this.record.junked;
  }
}
export function bindCarImpact(box, vehicle, time, record = null, spec = null, wrecks = null) {
  if(spec)spec=impactSpec(record?.kind || vehicle.kind,spec);
  box.vehicle = vehicle; box.time = time;
  box.vx = Math.sin(box.rotY) * vehicle.v;
  box.vz = Math.cos(box.rotY) * vehicle.v;
  box.onCarHit = onCarHit;
  box.record = record; box.spec = spec;
  box.wrecks = wrecks;
  box.invMassRatio = wrecks && spec && !vehicle.tram && !vehicle.arch?.parts ? 1350 / vehicleMass(spec) : 0;
  box.inertia = spec ? (spec.wid ** 2 + spec.len ** 2) / 12 : 1;
  box.applyCarImpulse = box.invMassRatio ? applyCarImpulse : null;
  const offset = spec ? (spec.front + spec.rear) / 2 : 0;
  box.originX = box.cx - Math.sin(box.rotY) * offset;
  box.originZ = box.cz - Math.cos(box.rotY) * offset;
}
export function bindParkedImpact(box, record, spec, wrecks = null) {
  spec=impactSpec(record.kind,spec);
  box.source = { record, spec, originX: record.x, originZ: record.z,
    cx: box.cx, cz: box.cz, w: spec.wid, d: spec.len, y0: record.y, y1: record.y + spec.hgt,
    rotY: Math.atan2(record.s, record.c), vx: 0, vz: 0, onCarHit,
    parked: true, staticBox: box, wrecks, invMassRatio: wrecks ? 1350 / vehicleMass(spec) : 0,
    inertia: (spec.wid ** 2 + spec.len ** 2) / 12, applyCarImpulse: wrecks ? applyCarImpulse : null };
  return box.source;
}
