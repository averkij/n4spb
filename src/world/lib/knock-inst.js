// world/lib/knock-inst.js - the shared builder of KNOCKABLE instanced furniture (lamps, bollard posts, signal poles, stop furniture, landmark benches ...), the helper behind
// ctx.knock (core/knock.js). One call turns a list of placements into the draw structure the knock contract needs (docs/PERFORMANCE-CONTRACT.md, "Knockable instances"):
//   with ctx.knock    one DYNAMIC InstancedMesh per part per 384 m cell (named `${name}|${cx},${cz}`), registered with registerLOD(mesh, far) WITHOUT attach (a loose draw, no
//                     uncullable shadow sector), and one knock.register() per placement, whose parts are that placement's instances in every part mesh (a lamp = body + glow +
//                     light pool, a signal = pole + head instances + lens instances). The return value `records[i]` belongs to `spots[i]`.
//   without ctx.knock (tools/check.mjs and the headless tools of the modules, R1) ONE Static InstancedMesh per part for all placements, no register, no registerLOD: exactly the
//                     structure the module built before the knock existed (the engine splits and batches it as ever); `records` is a list of nulls.
// knockInstances(ctx, {
//   name,                         mesh name prefix
//   parts: [{ geo, mat, shadow = true, receive = true, noOutline = false, hide = false, far, name,
//             when(spot, i),      optional: false = this placement has no instance of the part (a signal without a countdown)
//             place(spot, i) }],  optional: a Matrix4 (or an array of them: two heads on one pole) in WORLD space instead of the placement matrix; null / false = none
//   spots: [{ x, y, z, rotY, s }],  y = the foot level; s = uniform scale (default 1)
//   items: [collider | null | [colliders]] | (i, spot) => collider | [colliders],   the physics colliders of the placements (R8: keep the handles)
//   rec: { kind, mass, h, r | w, d, anchored, hitK, metal, minDv, originY, onKnock } | (spot, i) => the same   used as given: apply spot.s yourself in the function form
//   far,                          registerLOD range (m) of the parts (a part `far` overrides it)
//   cell = 384,
//   extraParts: (i, spot) => [{ mesh, index, hide } | { obj }]   parts that live elsewhere (a shared light-pool mesh, a detached panel)
//   part.color(spot, i, k) -> THREE.Color | hex | null   (optional) the instance colour of the k-th matrix of the part (the posts of the quay fence: a tone per post); a part without it has no instanceColor
// }) -> { records, meshes }
import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), NO_MATRICES = [], WHITE = new THREE.Color(1, 1, 1);

/** the world matrix of a placement: translate (x, y, z), turn rotY about the vertical, scale s */
function spotMatrix(spot, out = new THREE.Matrix4()) {
  const s = spot.s ?? 1;
  return out.compose(_p.set(spot.x, spot.y ?? 0, spot.z), _q.setFromAxisAngle(UP, spot.rotY || 0), _s.set(s, s, s));
}

// Landmark Parts collectors store colours and atlas tile IDs in vertex RGB.
// Fence bays and detached furniture bypass the collectors' final material
// merge. Resolve those same handles once per part, before splitting by cell.
function resolveMaterial(part) {
  const handle = part.mat;
  if (!handle?.isHandle && !handle?.isTileHandle) return part;
  const geo = part.geo.clone();
  const count = geo.getAttribute('position').count;
  // An atlas selector uses the fractional bits of blue. Keep its encoded
  // value exact. Flat colours can also carry the sculptor's vertex tint.
  const tint = handle.isTileHandle ? null : geo.getAttribute('color');
  const [r, g, b] = handle.tileCol;
  const rgb = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    rgb[i * 3] = r * (tint ? tint.getX(i) : 1);
    rgb[i * 3 + 1] = g * (tint ? tint.getY(i) : 1);
    rgb[i * 3 + 2] = b * (tint ? tint.getZ(i) : 1);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  return { ...part, geo, mat: handle.tileBase, color: handle.isTileHandle ? undefined : part.color };
}

export function knockInstances(ctx, { name = 'knock', parts, spots, items = null, rec = {}, far = Infinity, cell = 384, extraParts = null }) {
  if (parts.some(p => p.mat?.isHandle || p.mat?.isTileHandle)) parts = parts.map(resolveMaterial);
  const records = new Array(spots.length).fill(null), meshes = [];
  const knock = ctx.knock || null;
  /** the matrices of part `pi` for placement `i`: [] when it has none */
  const matricesOf = (pi, i) => {
    const part = parts[pi], spot = spots[i];
    if (part.when && !part.when(spot, i)) return NO_MATRICES;
    if (part.place) { const m = part.place(spot, i); return !m ? NO_MATRICES : Array.isArray(m) ? m : [m]; }
    return [spotMatrix(spot)];
  };
  /** the instance colour of the k-th matrix of part `pi` for placement `i` (a part with `color(spot, i, k)`: a THREE.Color or a hex, null = white) */
  const colorOf = (pi, i, k) => { const c = parts[pi].color(spots[i], i, k); return c ? (c.isColor ? c : new THREE.Color(c)) : WHITE; };
  const make = (pi, list, key, cols = null) => {
    const part = parts[pi], mesh = new THREE.InstancedMesh(part.geo, part.mat, list.length);
    for (let k = 0; k < list.length; k++) mesh.setMatrixAt(k, list[k]);
    mesh.instanceMatrix.needsUpdate = true;
    if (cols) { for (let k = 0; k < cols.length; k++) mesh.setColorAt(k, cols[k]); mesh.instanceColor.needsUpdate = true; }
    mesh.castShadow = part.shadow !== false; mesh.receiveShadow = part.receive !== false;
    mesh.name = (part.name ? `${name}-${part.name}` : parts.length > 1 ? `${name}-${pi}` : name) + (key ? `|${key}` : '');
    mesh.computeBoundingSphere();
    if (part.noOutline) ctx.noOutline(mesh);
    ctx.addStatic(mesh); meshes.push(mesh);
    return mesh;
  };

  if (!knock) {                                                                            // headless / no knock: today's structure, one Static mesh per part
    for (let pi = 0; pi < parts.length; pi++) {
      const list = [], cols = parts[pi].color ? [] : null;
      for (let i = 0; i < spots.length; i++) matricesOf(pi, i).forEach((m, k) => { list.push(m); if (cols) cols.push(colorOf(pi, i, k)); });
      if (list.length) make(pi, list, '', cols);
    }
    return { records, meshes };
  }

  const cells = new Map();                                                                  // 'cx,cz' -> [spot indices], in spot order
  for (let i = 0; i < spots.length; i++) {
    const key = Math.floor(spots[i].x / cell) + ',' + Math.floor(spots[i].z / cell);
    let a = cells.get(key); if (!a) cells.set(key, (a = [])); a.push(i);
  }
  const keys = [...cells.keys()].sort((a, b) => { const [ax, az] = a.split(',').map(Number), [bx, bz] = b.split(',').map(Number); return ax - bx || az - bz; });
  for (const key of keys) {
    const idx = cells.get(key), mine = idx.map(() => []), cellMeshes = [];                  // mine[n] = the parts of the n-th placement of this cell
    for (let pi = 0; pi < parts.length; pi++) {
      const list = [], owner = [], cols = parts[pi].color ? [] : null;
      for (let n = 0; n < idx.length; n++) matricesOf(pi, idx[n]).forEach((m, k) => { list.push(m); owner.push(n); if (cols) cols.push(colorOf(pi, idx[n], k)); });
      if (!list.length) continue;
      const mesh = make(pi, list, key, cols);
      for (let k = 0; k < list.length; k++) mine[owner[k]].push({ mesh, index: k, hide: !!parts[pi].hide });
      cellMeshes.push([mesh, parts[pi].far ?? far]);
    }
    for (let n = 0; n < idx.length; n++) {
      const i = idx[n], spot = spots[i];
      const extra = extraParts ? extraParts(i, spot) : null;
      const it = typeof items === 'function' ? items(i, spot) : items ? items[i] : null;
      const r = typeof rec === 'function' ? rec(spot, i) : rec;
      if (!r) continue;
      records[i] = knock.register({
        ...r, x: r.x ?? spot.x, z: r.z ?? spot.z, y: r.y ?? spot.y ?? 0, rotY: r.rotY ?? spot.rotY ?? 0,
        parts: extra ? mine[n].concat(extra) : mine[n],
        ...(Array.isArray(it) ? { items: it } : { item: it || null }),
      });
    }
    for (const [mesh, pfar] of cellMeshes) registerLOD(mesh, pfar);                         // after register(): the LOD takes the bounding sphere, inflated by the throw reach, at call time
  }
  return { records, meshes };
}
