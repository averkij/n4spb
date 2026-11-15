// High-detail owned cars use the same struck-car bodies as the instanced fleet.
// Their logical parked pose, damage mesh and entry prompt follow that body until
// boarding takes ownership back from Rapier.
import { bindParkedImpact } from '../traffic/impact.js';

export function createParkedPhysics(wrecks) {
  function sync(v) {
    const record = v.parkedPhysics?.record;
    if (!record) return;
    const p = v.parked;
    p.x = record.x; p.y = record.y; p.z = record.z; p.yaw = Math.atan2(record.s, record.c);
    // Damage fragments are emitted from the handling pose even while parked.
    Object.assign(v.car, p);
    v.damage.sync();
  }
  function attach(v, box) {
    if (v.kind === 'boat') return;
    const p = v.parked;
    const record = { kind: v.def.traffic?.model || v.id, x: p.x, y: p.y, z: p.z,
      s: Math.sin(p.yaw), c: Math.cos(p.yaw), damageState: v.damage.state };
    const source = bindParkedImpact(box, record, { ...v.spec, wid: v.spec.W }, wrecks);
    source.ownedVehicle = v;
    const hit = source.onCarHit;
    source.onCarHit = function (speed, contact) { hit.call(this, speed, contact); sync(v); };
    v.parkedPhysics = { record, source };
  }
  function release(v) {
    const record = v.parkedPhysics?.record;
    if (!record) return;
    const snapshot = wrecks.release(record);
    sync(v);
    delete v.parkedPhysics;
    return snapshot;
  }
  return { attach, sync, release };
}
