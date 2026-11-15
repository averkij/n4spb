// Triangle groups detach as real pieces, leaving mechanical structure underneath.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { VB } from '../traffic/vb.js';

export function addMechanicalInterior(mesh, spec, mode = true) {
  const original = mesh.geometry, g = original.clone(), v = new VB(0), w = spec.W, h = spec.hgt;
  const z = (spec.front + spec.wb * .22) / 2, length = spec.front - spec.wb * .22;
  if (mode === 'hood') {
    // Hinged/open cabins need clear seat and foot space. Keep the chassis below
    // the lowest seat floor, and mechanical detail in the nose of the bonnet.
    const nose = spec.front - .38;
    v.box(w * .70, .07, spec.len - .30, '#171a1d', [0, .09, (spec.front + spec.rear) / 2]);
    v.box(w * .48, Math.min(.22, h * .16), .50, '#34393b', [0, h * .32, nose]);
    for (let i = -2; i <= 2; i++) v.box(w * .51, .035, .035, '#72797b', [0, h * .40, nose + i * .075]);
    v.box(w * .66, .20, .07, '#22292b', [0, h * .30, spec.front - .14]);
  } else {
  v.box(w * .76, .14, spec.len - .30, '#171a1d', [0, h * .24, (spec.front + spec.rear) / 2]);
  v.box(w * .83, .12, .12, '#3b4143', [0, h * .29, -spec.wb / 2]);
  v.box(w * .78, .10, length, '#15191c', [0, h * .28, z]);
  v.box(w * .48, h * .18, length * .62, '#34393b', [0, h * .40, z]);
  for (let i = -3; i <= 3; i++) v.box(w * .51, .045, .045, '#72797b', [0, h * .51, z + i * .09]);
  for (const side of [-1, 1]) v.box(.08, .09, length, '#525759', [side * w * .33, h * .33, z]);
  v.box(w * .69, .26, .09, '#22292b', [0, h * .32, spec.front - .22]);
  }
  const extra = v.build(), instanced = {};
  // Promoted traffic paint shares its plate atlas. Mechanical boxes have no
  // decal: sample the atlas's white margin, never stretch plate text over them.
  if(extra.attributes.uv)for(let i=0;i<extra.attributes.uv.count;i++)extra.attributes.uv.setXY(i,.5,.008);
  if (!g.index) g.setIndex(Array.from({ length: g.attributes.position.count }, (_, i) => i));
  for (const [name, attr] of Object.entries(g.attributes)) if (attr.isInstancedBufferAttribute) { instanced[name] = attr; g.deleteAttribute(name); }
  for (const name of Object.keys(extra.attributes)) if (!g.attributes[name]) extra.deleteAttribute(name);
  g.setAttribute('aProtected', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count), 1));
  extra.setAttribute('aProtected', new THREE.Float32BufferAttribute(new Float32Array(extra.attributes.position.count).fill(1), 1));
  const merged = mergeGeometries([g, extra]);
  for (const [name, attr] of Object.entries(instanced)) merged.setAttribute(name, attr);
  mesh.geometry = merged; g.dispose(); extra.dispose(); original.dispose();
}

export function breakGroups(mesh, spec, matrix = null) {
  const g = mesh.geometry, p = g.attributes.position, normal = g.attributes.normal, color = g.attributes.color;
  const index = g.index ? Array.from(g.index.array) : Array.from({ length: p.count }, (_, i) => i);
  const groups = new Map(), material = mesh.material?.name || '';
  const glass = mesh.name === 'drive-glass' || material === 'pb-car-glass';
  const body = material === 'drive-body' || material === 'pb-car-paint';
  const lamp = /drive-head|drive-tail|pb-car-lamp/.test(material);
  const centre = new THREE.Vector3(), faceNormal = new THREE.Vector3();
  const normalMatrix = matrix ? new THREE.Matrix3().getNormalMatrix(matrix) : null;
  for (let i = 0; i < index.length; i += 3) {
    const tri = index.slice(i, i + 3);
    const mean = (attr, axis) => tri.reduce((n, v) => n + attr.getComponent(v, axis), 0) / 3;
    centre.set(mean(p, 0), mean(p, 1), mean(p, 2));
    if (matrix) centre.applyMatrix4(matrix);
    const { x, y, z } = centre;
    faceNormal.set(normal ? mean(normal, 0) : 0, normal ? mean(normal, 1) : 0, normal ? mean(normal, 2) : 0);
    if (normalMatrix) faceNormal.applyNormalMatrix(normalMatrix);
    let zone = 'fixed';
    if (!g.attributes.aProtected || !tri.some(j => g.attributes.aProtected.getX(j))) {
      if (glass) zone = z > 0 ? 'front-glass' : 'rear-glass';
      else if (lamp) zone = (z > 0 ? 'front-bumper' : 'rear-bumper') + (x > 0 ? '-left' : '-right');
      else if (body) {
        if (z > spec.front - .16 && y < spec.hgt * .53) zone = 'front-bumper';
        else if (z < spec.rear + .16 && y < spec.hgt * .57) zone = 'rear-bumper';
        else if (z > spec.wb * .23 && z < spec.front - .08 && y > spec.hgt * .46 && Math.abs(x) < spec.W * .43 &&
          (faceNormal.y > .25 || color && mean(color, 0) < .04)) zone = 'front-bonnet';
      }
    }
    let group = groups.get(zone); if (!group) groups.set(zone, group = []); group.push(...tri);
  }
  return { original: index, groups };
}

export function fragmentGeometry(part, indices) {
  const geometry = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'color', 'uv', 'aKind']) {
    const attr = part.g.attributes[name]; if (!attr) continue;
    const data = new Float32Array(indices.length * attr.itemSize);
    for (let i = 0; i < indices.length; i++) for (let k = 0; k < attr.itemSize; k++) data[i * attr.itemSize + k] = attr.getComponent(indices[i], k);
    geometry.setAttribute(name, new THREE.BufferAttribute(data, attr.itemSize));
  }
  geometry.applyMatrix4(part.matrix);
  return geometry;
}
