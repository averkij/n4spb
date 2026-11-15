// Bounded private damaged meshes for struck vehicles. Healthy traffic keeps its
// original instanced path. States live on records, so cache eviction loses no dents.
import * as THREE from 'three';
import { createCarDamage } from '../drive/damage.js';
import { archOf } from './fleetdata.js';

export function createFleetDamage(ctx, capacity = 24) {
  const cache = new Map(); let frame = 0;
  const identity = new THREE.Matrix4();
  function dispose(entry) {
    entry.root.removeFromParent();
    for (const mesh of entry.meshes) { mesh.geometry.dispose(); mesh.dispose(); }
  }
  function make(v, k) {
    const root = new THREE.Group(); root.name = 'damaged-traffic';
    const meshes = [], mapping = {};
    const source = { paint: k.paint0, glass: k.glass, lamps: k.lamps };
    for (const key of Object.keys(k.ex)) {
      if (key === 'taxi' && !v.taxi || (key === 'police' || key === 'pdec') && !v.police || (key === 'amb' || key === 'adec') && !v.amb) continue;
      source[key] = k.ex[key];
    }
    for (const [name, original] of Object.entries(source)) {
      const geometry = original.geometry.clone();
      // One instance, with private short attributes and identity local transform.
      for (const [attr, data] of Object.entries(geometry.attributes)) if (data.isInstancedBufferAttribute)
        geometry.setAttribute(attr, new THREE.InstancedBufferAttribute(new Float32Array(data.itemSize), data.itemSize).setUsage(THREE.DynamicDrawUsage));
      const mesh = new THREE.InstancedMesh(geometry, original.material, 1);
      mesh.setMatrixAt(0, identity); mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      if (original.instanceColor) { mesh.setColorAt(0, v.color); mesh.instanceColor.setUsage(THREE.DynamicDrawUsage); }
      mesh.castShadow = original.castShadow; mesh.receiveShadow = original.receiveShadow;
      mesh.layers.mask = original.layers.mask; mesh.name = `damaged-${v.kind}-${name}`;
      root.add(mesh); meshes.push(mesh); mapping[name] = mesh;
    }
    const a = archOf(v.kind), spec = { ...a, W: a.wid };
    const damage = createCarDamage({ root }, { meshes, spec, state: v.visualDamageState||v.damageState, interior: true,
      onDetach: fragment => {
        const wrecks = ctx.services?.carWrecks;
        if (wrecks) wrecks.shed(fragment, { ...v, vx: v.wreckSource?.vx || 0, vz: v.wreckSource?.vz || 0 }, v.color);
        else fragment.geometry.dispose();
      } });
    ctx.add(root);
    return { root, meshes, mapping, damage, seen: frame };
  }
  return {
    get size() { return cache.size; },
    begin() { frame++; for (const entry of cache.values()) entry.root.visible = false; },
    push(v, k) {
      const state=v.visualDamageState||v.damageState;
      if (!state?.revision) return false;
      let entry = cache.get(state);
      if (!entry) {
        if (cache.size >= capacity) {
          let oldestKey, oldest;
          for (const [key, candidate] of cache) if (!oldest || candidate.seen < oldest.seen) { oldestKey = key; oldest = candidate; }
          // All slots visible this frame: retain the ordinary mesh as a fallback.
          if (oldest.seen === frame) return false;
          dispose(oldest); cache.delete(oldestKey);
        }
        entry = make(v, k); cache.set(state, entry);
      }
      entry.seen = frame; entry.root.visible = true;
      if (entry.boundRevision !== state.revision) {
        entry.damage.sync();
        for (const mesh of entry.meshes) { mesh.computeBoundingBox(); mesh.computeBoundingSphere(); }
        entry.boundRevision = state.revision;
      }
      entry.root.position.set(v.x, v.y, v.z);
      entry.root.rotation.order = 'YXZ'; entry.root.rotation.set(-Math.asin(v.sp || 0), Math.atan2(v.s, v.c), 0);
      const paint = entry.mapping.paint;
      paint.setColorAt(0, v.color); paint.instanceColor.needsUpdate = true;
      const plate = paint.geometry.attributes.aPlate; plate.setX(0, v.plate); plate.needsUpdate = true;
      const lights = entry.mapping.lamps.geometry.attributes.aLamp;
      lights.setXYZ(0, ...(v.lamp || [0, 0, 0])); lights.needsUpdate = true;
      return true;
    },
    dispose() { for (const entry of cache.values()) dispose(entry); cache.clear(); },
  };
}
