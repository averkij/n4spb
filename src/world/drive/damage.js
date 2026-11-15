// Coherent crush zones: regenerate from pristine geometry using one continuous
// map for adjoining metal, glass and trim. Damage state is shared by fleet cars.
import * as THREE from 'three';
import { addMechanicalInterior, breakGroups, fragmentGeometry } from './breakable.js';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const fold = t => Math.max(0, 1 - Math.abs(t - .52) / .38);
export const DAMAGE_STAGES = ['Pristine', 'Scuffed', 'Dented', 'Crumpled', 'Wrecked'];
export const DURABILITY_MULTIPLIER = 1.5;
export function createDamageState() { return { front: 0, rear: 0, left: 0, right: 0, revision: 0, shed: {} }; }
export function damageAmount(s) { return Math.max(s.front, s.rear, s.left, s.right); }
export function crushedSpec(spec, state) {
  const front = spec.front - .95 * state.front, rear = spec.rear + .80 * state.rear;
  return { ...spec, front, rear, len: front - rear, centerZ: (front + rear) / 2 };
}
export function damageStage(s) { const v = damageAmount(s); return !v ? 0 : v < .2 ? 1 : v < .5 ? 2 : v < .85 ? 3 : 4; }
export function recordDamage(state, event, spec) {
  if (event.type !== 'hit' || event.v < 3 || !Number.isFinite(event.localX) || !Number.isFinite(event.localZ)) return false;
  const side = Math.abs(event.localNX || 0) > Math.abs(event.localNZ || 0);
  const zone = side ? (event.localX > 0 ? 'left' : 'right') : (event.localZ > (spec.front + spec.rear) / 2 ? 'front' : 'rear');
  state[zone] = Math.min(1, state[zone] + clamp((event.v - 3) / (45 * DURABILITY_MULTIPLIER) / (spec.durability || 1))); // 50% more impact budget, retaining each body's relative strength and the 100% junk threshold.
  state.revision++; return true;
}
// Monotonic X/Z mapping; wheel-arch bands translate together, with the final
// compression ahead of the axle. Broad bonnet folds vanish at the fender seams.
export function deformPoint(p, state, spec) {
  const { x, y, z } = p, half = spec.W / 2;
  const f = clamp((z - spec.wb * .16) / Math.max(.1, spec.front - spec.wb * .16));
  const r = clamp((-z - spec.wb * .16) / Math.max(.1, -spec.rear - spec.wb * .16));
  const upper = clamp((y - .40 * spec.hgt) / (.20 * spec.hgt));
  const centre = Math.max(0, 1 - (x / (half * .95)) ** 2);
  p.z = z - state.front * (.30 * clamp(f * 2.3) + .65 * f ** 1.3)
    + state.rear * (.27 * clamp(r * 2.3) + .53 * r ** 1.3);
  const crush = state.front * f + state.rear * r;
  const roof = clamp((y - spec.hgt * .7) / (spec.hgt * .25));
  p.y = y + centre * upper * (.17 * state.front ** 2 * fold(f) + .14 * state.rear ** 2 * fold(r))
    - .24 * crush * upper - .20 * damageAmount(state) * roof * Math.max(0, 1 - (z / spec.wb) ** 2);
  const door = Math.max(0, 1 - (z / Math.max(1, spec.wb * .48)) ** 4);
  p.x = x - .38 * state.left * clamp(x / half) * door + .38 * state.right * clamp(-x / half) * door
    + .12 * crush * Math.sin(z * 13 + y * 8) * clamp(Math.abs(x) / half) * Math.sign(x);
  return p;
}
export function createCarDamage(model, options = {}) {
  const spec = options.spec || { W: 1.82, len: 4.14, hgt: 1.3, front: 2.12, rear: -2.02, wb: 2.62 };
  const state = options.state || createDamageState();
  if (options.interior && model.body) addMechanicalInterior(model.body, spec, options.interior);
  const meshes = options.meshes || model.root.children.filter(m => m.isMesh && (m === model.body || m === model.glass || m === model.driver ||
    ['drive-head', 'drive-tail', 'drive-plate', 'drive-logo'].includes(m.material?.name)));
  const point = new THREE.Vector3(), pivot = new THREE.Vector3();
  // Capture a closed rest pose once. Door meshes may live under animated hinges;
  // damage is authored in car space, then transformed back into each mesh's space.
  model.root.updateWorldMatrix(true, true);
  const rootInverse = model.root.matrixWorld.clone().invert();
  const parts = meshes.map(mesh => {
    const g = mesh.geometry, p = g.attributes.position, color = g.attributes.color;
    mesh.updateWorldMatrix(true, false); p.setUsage(THREE.DynamicDrawUsage); color?.setUsage(THREE.DynamicDrawUsage);
    const matrix = new THREE.Matrix4().multiplyMatrices(rootInverse, mesh.matrixWorld);
    const parentMatrix = mesh.parent ? new THREE.Matrix4().multiplyMatrices(rootInverse, mesh.parent.matrixWorld) : new THREE.Matrix4();
    return { mesh, g, p, color, base: p.array.slice(), colors: color?.array.slice(), normals: g.attributes.normal?.array.slice(),
      matrix, inverse: matrix.clone().invert(), origin: mesh.position.clone(), carOrigin: new THREE.Vector3().setFromMatrixPosition(matrix), parentInverse: parentMatrix.invert(),
      rigid: ['drive-plate', 'drive-logo'].includes(mesh.material?.name), breaks: breakGroups(mesh, spec, matrix),
      lamp: /(?:drive-head|drive-tail|pb-car-lamp)/.test(mesh.material?.name || '') };
  });
  const wheels = (model.wheels || []).map(w => ({ pivot: w.pivot, base: w.pivot.position.clone() }));
  let applied = -1;
  function sync() {
    if (applied === state.revision) return;
    for (const [partId, part] of parts.entries()) {
      const { mesh, g, p, base, color, colors, matrix, inverse, rigid, lamp } = part;
      if (rigid) {
        mesh.position.copy(deformPoint(pivot.copy(part.carOrigin), state, spec).applyMatrix4(part.parentInverse));
        const amount = mesh.material.name === 'drive-logo' ? damageAmount(state) : part.carOrigin.z > 0 ? state.front : state.rear;
        mesh.userData.damageHidden = amount > .55;
        if (mesh.userData.damageHidden) mesh.visible = false;
        const key = `rigid:${partId}`;
        if (mesh.material.name === 'drive-plate' && amount > .55 && !state.shed?.[key]) {
          (state.shed ||= {})[key] = true;
          if (options.onDetach) options.onDetach({ geometry: fragmentGeometry(part, part.breaks.original), zone: part.carOrigin.z > 0 ? 'front-plate' : 'rear-plate' });
        }
        continue;
      }
      for (let i = 0; i < p.count; i++) {
        const j = i * 3;
        point.set(base[j], base[j + 1], base[j + 2]).applyMatrix4(matrix);
        const x = point.x, y = point.y, z = point.z;
        const f = clamp((z - spec.wb * .16) / (spec.front - spec.wb * .16));
        const r = clamp((-z - spec.wb * .16) / (-spec.rear - spec.wb * .16));
        const side = Math.max(0, 1 - (z / Math.max(1, spec.wb * .48)) ** 4);
        const severity = Math.max(state.front * f, state.rear * r, side * (x > 0 ? state.left : state.right));
        deformPoint(point, state, spec).applyMatrix4(inverse); p.setXYZ(i, point.x, point.y, point.z);
        if (color) {
          const band = Math.abs(Math.sin(y * 38 + z * 2)) > .84 ? .72 : .18, scuff = severity * (.18 + band);
          for (let k = 0; k < 3; k++) {
            const original = colors[j + k];
            color.array[j + k] = lamp ? original * (1 - clamp((severity - .35) / .5)) :
              original * (1 - severity * .28) + (Math.min(.24, original + .1) - original) * scuff;
          }
        }
      }
      const kept = [];
      for (const [zone, indices] of part.breaks.groups) {
        const amount = zone.startsWith('front') ? state.front : zone.startsWith('rear') ? state.rear : 0;
        const threshold = zone.includes('bonnet') ? .83 : zone.includes('glass') ? .70 : .55;
        if (amount <= threshold) { kept.push(...indices); continue; }
        const key = `${partId}:${zone}`;
        if (!state.shed?.[key]) {
          (state.shed ||= {})[key] = true;
          if (options.onDetach) {
            if (zone.includes('glass')) {
              // Separate small shards, never the entire bent greenhouse volume.
              const stride = Math.max(3, Math.ceil(indices.length / 18) * 3);
              for (let j = 0; j < indices.length; j += stride) {
                const geometry = fragmentGeometry(part, indices.slice(j, j + 3));
                geometry.computeBoundingBox();
                const centre = geometry.boundingBox.getCenter(new THREE.Vector3());
                geometry.translate(-centre.x, -centre.y, -centre.z); geometry.scale(.3, .3, .3); geometry.translate(centre.x, centre.y, centre.z);
                options.onDetach({ geometry, zone });
              }
            } else options.onDetach({ geometry: fragmentGeometry(part, indices), zone });
          }
        }
      }
      g.setIndex(kept);
      p.needsUpdate = true; if (color) color.needsUpdate = true;
      g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
    }
    for (const wheel of wheels) wheel.pivot.position.copy(deformPoint(point.copy(wheel.base), state, spec));
    applied = state.revision;
  }
  function hit(event) { if (!recordDamage(state, event, spec)) return false; sync(); return true; }
  function repair() {
    state.front = state.rear = state.left = state.right = 0; state.shed = {}; state.revision++;
    for (const { mesh, g, p, base, color, colors, normals, origin, breaks } of parts) {
      mesh.userData.damageHidden = false; mesh.visible = true; g.setIndex(breaks.original);
      mesh.position.copy(origin); p.array.set(base); p.needsUpdate = true;
      if (color) { color.array.set(colors); color.needsUpdate = true; }
      if (normals) { g.attributes.normal.array.set(normals); g.attributes.normal.needsUpdate = true; }
      g.computeBoundingBox(); g.computeBoundingSphere();
    }
    for (const wheel of wheels) wheel.pivot.position.copy(wheel.base);
    applied = state.revision;
  }
  function hideDetached() { for (const part of parts) if (part.mesh.userData.damageHidden) part.mesh.visible = false; }
  return { state, hit, sync, repair, hideDetached, get amount() { return damageAmount(state); }, get stage() { return DAMAGE_STAGES[damageStage(state)]; },
    get smoke() { return clamp((state.front - .55) / .45); }, get revision() { return state.revision; } };
}
