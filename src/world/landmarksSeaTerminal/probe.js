// landmarksSeaTerminal/probe.js - NODE-ONLY diagnostic (SEATERM_KINDS=1 node tools/check.mjs landmarksSeaTerminal ...): lists the draw "kinds" the module hands to core/batch2.js, i.e. the signature of every mesh as the batcher
// groups it (material sheet or atlas page, side, transparency, alphaTest, polygonOffset, emissive; cast / receive; layer mask; size class; 192 m cell).  Every distinct kind x cell costs a colour call
// (+ a shadow call when it casts), so this is the quickest way to see where the calls of a postcard pose come from (copy of landmarksModernVO/probe.js).
import * as THREE from 'three';
import { uvInUnit, atlasableTex } from '../../core/batch2.js';
import { sizeClass } from '../../core/spatial.js';

const CELL = 192;
export function probe(root, label = 'module') {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3(), c = new THREE.Vector3(), kinds = new Map(), full = new Map();
  const uvOk = new Map(), tex = new Map();
  const metas = [];
  root.traverse((o) => { if (o.isMesh && !o.isInstancedMesh) metas.push(o); });
  for (const o of metas) { const m = o.material; if (m.map) { let ok = uvOk.get(o.geometry); if (ok === undefined) ok = uvInUnit(o.geometry); uvOk.set(o.geometry, ok); const prev = tex.get(m.map); tex.set(m.map, prev === undefined ? ok : prev && ok); } }
  for (const o of metas) {
    const m = o.material, g = o.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    box.copy(g.boundingBox).applyMatrix4(o.matrixWorld); box.getCenter(c);
    const dx = box.max.x - box.min.x, dy = box.max.y - box.min.y, dz = box.max.z - box.min.z, dim = Math.max(dx, dy, dz), mid = dx + dy + dz - dim - Math.min(dx, dy, dz);
    const cls = sizeClass(dim, mid, box.max.y, false);
    const atlas = m.map && atlasableTex(m.map) && tex.get(m.map);
    const mapKey = m.map ? (atlas ? 'page' : 'tiled:' + (m.name || m.map.uuid.slice(0, 6))) : 'none';
    const t = m.userData && m.userData.toon;
    const sig = [mapKey, m.side === THREE.DoubleSide ? 'double' : 'front', m.transparent ? 'T' : 'O', 'a' + m.alphaTest, 'po' + ((t && t.polygonOffset) || 0), m.emissive ? m.emissive.getHexString() + '/' + m.emissiveIntensity : ''].join('|');
    const flags = (o.castShadow ? 'c' : '-') + (o.receiveShadow ? 'r' : '-') + '|L' + o.layers.mask + '|' + cls;
    const k = kinds.get(sig) || { n: 0, tris: 0, names: new Set(), flags: new Set() };
    k.n++; k.tris += (g.index ? g.index.count : g.attributes.position.count) / 3; k.names.add(m.name.replace(/^lmseate-/, '')); k.flags.add(flags); kinds.set(sig, k);
    const fk = sig + '#' + flags + '#' + Math.floor(c.x / CELL) + ',' + Math.floor(c.z / CELL);
    full.set(fk, (full.get(fk) || 0) + 1);
  }
  const lines = [...kinds.entries()].sort((a, b) => b[1].n - a[1].n).map(([s, k]) => `${String(k.n).padStart(4)} meshes ${String(Math.round(k.tris)).padStart(7)} tris  ${s}  [${[...k.flags].join(' ')}]  ${[...k.names].slice(0, 6).join(',')}${k.names.size > 6 ? ',+' + (k.names.size - 6) : ''}`);
  console.log(`[${label} kinds] ${metas.length} meshes, ${kinds.size} kinds (signatures), ${full.size} kind x flags x cell batches`);
  for (const l of lines) console.log('  ' + l);
}
